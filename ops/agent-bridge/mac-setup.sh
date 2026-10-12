#!/bin/bash
# Run as the signed-in macOS user, never through sudo.
set +x
set -euo pipefail
umask 077

die() { printf '%s\n' "$*" >&2; exit 1; }
[[ $# -le 1 ]] || die 'Usage: bash mac-setup.sh [frost831/throttleshare|frost831/poolens]'
repo=${1:-frost831/throttleshare}
case "$repo" in
    frost831/throttleshare|frost831/poolens) ;;
    *) die 'Mac runner is enabled only for frost831/throttleshare and frost831/poolens.' ;;
esac
repo_slug=${repo//\//-}
export BRIDGE_REPO="$repo" BRIDGE_REPO_SLUG="$repo_slug"
[[ $(uname -s) == Darwin ]] || die 'This setup requires macOS.'
[[ $(id -u) -ne 0 && -z ${SUDO_USER:-} ]] || die 'Run as the signed-in user without sudo.'
[[ $(stat -f %Su /dev/console) == "$(id -un)" ]] || die 'Run as the user signed into the Mac desktop.'
for tool in gh git python3 codex curl tar launchctl; do
    command -v "$tool" >/dev/null || die "Required command missing: $tool"
done
git --version >/dev/null
python3 --version >/dev/null
codex login status </dev/null >/dev/null 2>&1 || die 'Run codex login as this user first.'
export GH_HOST=github.com GH_PROMPT_DISABLED=1
unset GH_DEBUG GITHUB_ACTIONS_RUNNER_SERVICE_TEMPLATE
[[ $(gh api --hostname github.com user --jq .login) == frost831 ]] || die 'Authenticate GitHub CLI as frost831.'
privacy=$(gh api --hostname github.com "repos/$repo" --jq '.private')
[[ "$privacy" == true || "$privacy" == false ]] || die "$repo must be accessible."
case "$(uname -m)" in
    arm64) arch=arm64 ;;
    x86_64)
        arch=x64
        if [[ $(sysctl -in sysctl.proc_translated 2>/dev/null || true) == 1 ]]; then arch=arm64; fi
        ;;
    *) die 'Unsupported Mac architecture.' ;;
esac

if [[ "$repo" == frost831/throttleshare ]]; then
    runner_dir="$HOME/.local/share/throttleshare-agent-runner"
else
    runner_dir="$HOME/.local/share/$repo_slug-agent-runner"
fi
# Refuse redirected or foreign-owned installations, including symlinked parents.
python3 - "$runner_dir" <<'PY'
import os
import pathlib
import sys
root = pathlib.Path(sys.argv[1])
for path in (root, *root.parents):
    if path.is_symlink():
        sys.exit('Runner directory and its parents must not be symlinks.')
if root.exists() and (not root.is_dir() or root.stat().st_uid != os.getuid()):
    sys.exit('Existing runner directory must be owned by this user.')
PY
mkdir -p "$runner_dir"
chmod 700 "$runner_dir"
cd "$runner_dir"
mkdir .setup-lock 2>/dev/null || die 'Another setup is running or .setup-lock needs manual inspection.'
trap 'rmdir "$runner_dir/.setup-lock"' EXIT

if [[ -f .runner ]]; then
    python3 - <<'PY'
import json
import pathlib
import subprocess
import sys
config = json.loads(pathlib.Path('.runner').read_text())
if any(pathlib.Path(name).is_symlink() for name in ('.runner', '.credentials', 'svc.sh')):
    sys.exit('Existing runner files must not be symlinks.')
expected_url = 'https://github.com/' + os.environ['BRIDGE_REPO']
if config.get('gitHubUrl', '').rstrip('/').lower() != expected_url.lower():
    sys.exit('Existing runner belongs to another repository; refusing to change it.')
runner_id = config.get('agentId')
if not isinstance(runner_id, int) or runner_id <= 0:
    sys.exit('Existing runner has no valid registration ID.')
remote = json.loads(subprocess.check_output([
    'gh', 'api', '--hostname', 'github.com',
    f"repos/{os.environ['BRIDGE_REPO']}/actions/runners/{runner_id}",
], text=True))
labels = {label['name'] for label in remote.get('labels', [])}
if (remote.get('name') != config.get('agentName')
        or remote.get('os') not in {'osx', 'macos'}
        or not {'mac', 'codex'} <= labels):
    sys.exit('Existing runner registration or labels differ; inspect manually.')
PY
    [[ -f .credentials && -x svc.sh ]] || die 'Existing runner installation is incomplete; inspect manually.'
else
    [[ -z $(find . -mindepth 1 -maxdepth 1 ! -name .setup-lock -print -quit) ]] || die 'Unregistered runner directory is not empty; inspect manually.'
    gh api --hostname github.com repos/actions/runner/releases/latest > .release.json
    python3 - "$arch" <<'PY'
import json
import pathlib
import re
import sys
release = json.loads(pathlib.Path('.release.json').read_text())
tag = release.get('tag_name', '')
if not re.fullmatch(r'v[0-9]+\.[0-9]+\.[0-9]+', tag) or release.get('draft') or release.get('prerelease'):
    sys.exit('Invalid stable runner release.')
name = f'actions-runner-osx-{sys.argv[1]}-{tag[1:]}.tar.gz'
assets = [a for a in release.get('assets', []) if a.get('name') == name]
if len(assets) != 1:
    sys.exit('Expected exactly one official Mac runner asset.')
asset = assets[0]
digest = asset.get('digest') or ''
url = f'https://github.com/actions/runner/releases/download/{tag}/{name}'
if not re.fullmatch(r'sha256:[0-9a-fA-F]{64}', digest) or asset.get('browser_download_url') != url:
    sys.exit('Missing SHA256 release digest or unexpected asset URL; refusing download.')
pathlib.Path('.asset-url').write_text(url)
pathlib.Path('.asset-sha256').write_text(digest[7:].lower())
PY
    curl --fail --location --proto '=https' --proto-redir '=https' \
        --output .runner.tar.gz "$(<.asset-url)"
    python3 - <<'PY'
import hashlib
import pathlib
import sys
digest = hashlib.sha256()
with open('.runner.tar.gz', 'rb') as archive:
    for chunk in iter(lambda: archive.read(1024 * 1024), b''):
        digest.update(chunk)
if digest.hexdigest() != pathlib.Path('.asset-sha256').read_text():
    sys.exit('Runner SHA256 mismatch; refusing extraction.')
PY
    tar -xzf .runner.tar.gz
    # Keep the token off argv, disk, shell tracing, and console output.
    python3 - <<'PY'
import json
import os
import socket
import subprocess
import sys
env = {k: v for k, v in os.environ.items() if not k.startswith('ACTIONS_RUNNER_INPUT_')}
env.pop('GH_DEBUG', None)
result = subprocess.run([
        'gh', 'api', '--hostname', 'github.com', '--method', 'POST',
        f"repos/{os.environ['BRIDGE_REPO']}/actions/runners/registration-token",
], env=env, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, text=True)
if result.returncode:
    sys.exit('Unable to obtain runner registration token.')
try:
    token = json.loads(result.stdout)['token']
    if not isinstance(token, str) or not token.strip():
        raise ValueError()
except (ValueError, KeyError, TypeError):
    sys.exit('Invalid runner registration response.')
env['ACTIONS_RUNNER_INPUT_TOKEN'] = token
result = subprocess.run([
    './config.sh', '--unattended', '--url', 'https://github.com/' + os.environ['BRIDGE_REPO'],
    '--name', os.environ['BRIDGE_REPO_SLUG'] + '-mac-' + socket.gethostname().split('.')[0],
    '--labels', 'mac,codex', '--work', '_work',
], env=env, stdin=subprocess.DEVNULL, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
env.pop('ACTIONS_RUNNER_INPUT_TOKEN', None)
if result.returncode:
    sys.exit('Runner registration failed; inspect locally. Existing runners were not replaced.')
PY
    rm .release.json .asset-url .asset-sha256 .runner.tar.gz
fi

if [[ ! -e .service ]]; then
    ./svc.sh install
fi
# Validate the saved launchd target before operating an existing service.
service_label=$(python3 - "$runner_dir" <<'PY'
import os
import pathlib
import plistlib
import sys
root = pathlib.Path(sys.argv[1])
service = root / '.service'
plist = pathlib.Path(service.read_text().strip())
expected_parent = pathlib.Path.home() / 'Library' / 'LaunchAgents'
if service.is_symlink() or plist.is_symlink() or plist.parent != expected_parent:
    sys.exit('Unexpected launchd service path.')
with plist.open('rb') as stream:
    data = plistlib.load(stream)
expected_prefix = 'actions.runner.' + os.environ['BRIDGE_REPO_SLUG'] + '.'
if (plist.stat().st_uid != os.getuid()
        or data.get('WorkingDirectory') != str(root)
        or data.get('ProgramArguments') != [str(root / 'runsvc.sh')]
        or not data.get('Label', '').startswith(expected_prefix)):
    sys.exit('Existing launchd service is not this repository runner.')
print(data['Label'])
PY
)
if launchctl print "gui/$(id -u)/$service_label" >/dev/null 2>&1; then
    ./svc.sh status
else
    ./svc.sh start
fi
printf '%s\n' "$repo runner service configured. Verify online status in GitHub Actions."
