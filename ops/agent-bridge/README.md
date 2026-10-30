# ThrottleShare PC / Mac Bridge

The bridge is enabled for `frost831/throttleshare`, `frost831/poolens`, and `frost831/poolens-site`. Issues authored by frost831 with exactly one target label (`agent:pc` or `agent:mac`) are tasks. Both the workflow and runner revalidate authorization. Other authors and ordinary comments do not execute. The Mac runner is enabled for `frost831/throttleshare` and `frost831/poolens` only; `frost831/poolens-site` is PC-only. Public repository execution is allowed only for the explicitly listed SplashLens repos.

## Setup

On each machine, log in with `gh auth login` as frost831 and `codex login` as the local user. Git, Python, GitHub CLI and a current Codex CLI supporting `--approve-for-me` must be on PATH. PC also requires PowerShell 7.

Mac, from the current checkout:

```sh
git pull --ff-only && bash ops/agent-bridge/mac-setup.sh
```

To register the SplashLens app Mac runner, run:

```sh
bash ops/agent-bridge/mac-setup.sh frost831/poolens
```

PC, from the current checkout:

```powershell
./ops/agent-bridge/pc-setup.ps1 -Background
```

To register the SplashLens PC runners, run:

```powershell
./ops/agent-bridge/pc-setup.ps1 -Repo frost831/poolens -Background
./ops/agent-bridge/pc-setup.ps1 -Repo frost831/poolens-site -Background
```

Installers verify the official GitHub runner archive SHA-256 digest and fetch short-lived registration tokens without printing or committing them. Mac uses the signed-in user's launchd agent. The PC background option uses a hidden user process with startup at login, not a Windows service; it does not survive sign-out. Installing a Windows service under the Codex-authenticated user requires an elevated interactive administrator session and that user's service credentials. Do not configure LocalSystem and assume it has the user's Codex login.

## Handoff

```sh
bash ops/agent-bridge/handoff.sh mac "Check Apple build" complete-prompt.md
```

```powershell
./ops/agent-bridge/handoff.ps1 pc "Fix web regression" complete-prompt.md
```

For a non-ThrottleShare repo, pass the repository explicitly:

```sh
bash ops/agent-bridge/handoff.sh --repo frost831/poolens pc "Fix web regression" complete-prompt.md
```

```powershell
./ops/agent-bridge/handoff.ps1 pc "Fix web regression" complete-prompt.md -Repo frost831/poolens-site
```

An owner `/codex` comment restarts a completed/failed task with explicit follow-up instructions. Manual workflow dispatch takes an existing issue number and target machine. Changed queued task text is rejected instead of silently executed. Do not apply both target labels.

## Execution And Proof

- One job per machine; up to 100 wait in its concurrency group. Additional work above GitHub's queue limit must be redispatched.
- Each run uses a new isolated worktree and `agent/<issue>-<title>-<run>-<attempt>` branch. A follow-up resumes the one verified open task PR and pushes a normal fast-forward update to its existing branch; ambiguous task PRs stop for review. Canonical PC/Mac working copies are not reset or cleaned.
- The runner user's existing `gh` login creates PRs so PR CI actually starts. No long-lived token is committed to the repository or placed in Actions YAML.
- Codex receives the task through stdin, not shell interpolation, and runs in workspace-write mode with automatic approval review. No sandbox-bypass flag.
- The bridge reports pickup, summary, tests, PR and blockers on the issue. It marks `agent:done` only when Codex reports completion and the requested PR operation succeeds.
- Completed changes can merge only after the primary `verify` check passes and every other reported check is passing/skipped. The merge matches the exact tested head SHA. PR-only instructions disable merge. Empty/pending checks never count as green.
- No task authorizes email, production mutations, payment movement or store submission merely by being labeled. Exact task instructions and repository gates still apply.
- SplashLens Mac tasks in `frost831/poolens` may change only `ios/` and `android-twa/`. App Store Connect uploads, Play uploads and Android signing require explicit current owner authorization and all release gates. Existing signing assets must be reused without exposing or moving them; new secrets, certificates or profiles still require separate owner authorization.
- A queued job is not runner pickup. Verify `runner_name` in the Actions job and the automatic pickup comment. An absent/offline runner requires setup/connectivity; do not pretend the other machine ran.
- For a timed-out/cancelled run, inspect its worktree and issue before removing a stale `agent:running` label and explicitly retrying. Never duplicate an uncertain external action.

## Smoke Test

Create an owner-authored issue for the target machine asking it to add one timestamped line to `ops/agent-bridge/TEST.md`, run a content check, and open a PR without merging. Verify the assigned runner, pickup comment, PR, test report and `agent:done`. These tests need no deployment, customer email, production database or payment access.


## Failure and owner-scope hardening (2026-10-30)

The bridge reads every page of owner comments at pickup and rechecks task scope
before execution and publication. Chronological owner corrections and stop/defer
instructions must be honored. Bridge-generated receipts are evidence, not new
authorization. Cross-repository or outside-checkout work still stops for review.
Publication, required-check and final reporting failures cannot mark a task done.
An incomplete task exits unsuccessfully while preserving its workspace. No fallback
push is attempted after a rejected publication. Credential rejection and outbound
redaction share supported token formats; private key/config files are blocked.
Failed process queries preserve Git locks. Store work remains Mac-owned where
required and needs explicit current owner authorization plus all existing gates.
This update does not dispatch or replay tasks or authorize any release.
