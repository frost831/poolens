#!/bin/bash
set -euo pipefail

die() { printf '%s\n' "$*" >&2; exit 1; }
repo=frost831/throttleshare
if [[ ${1:-} == --repo ]]; then
    [[ $# -eq 5 ]] || die 'Usage: bash handoff.sh [--repo owner/name] mac|pc "Title" PROMPT_FILE'
    repo=$2
    shift 2
fi
case "$repo" in
    frost831/throttleshare|frost831/poolens|frost831/poolens-site) ;;
    *) die 'Unsupported bridge repository.' ;;
esac
[[ $# -eq 3 ]] || die 'Usage: bash handoff.sh [--repo owner/name] mac|pc "Title" PROMPT_FILE'
target=$1
case "$target" in mac|pc) ;; *) die 'Target must be exactly mac or pc.' ;; esac
[[ "$repo:$target" != frost831/poolens-site:mac ]] || die 'Mac runner is not enabled for frost831/poolens-site.'
title=$2
[[ -f "$3" && -r "$3" && -s "$3" ]] || die 'Prompt must be an existing, readable, nonempty file.'
prompt=$(cd -- "$(dirname -- "$3")" && printf '%s/%s' "$PWD" "$(basename -- "$3")")
[[ -n "${title//[[:space:]]/}" ]] || die 'Title must not be blank.'
command -v gh >/dev/null || die 'Install GitHub CLI first.'
export GH_HOST=github.com GH_PROMPT_DISABLED=1
[[ $(gh api --hostname github.com user --jq .login) == frost831 ]] || die 'Authenticate GitHub CLI as frost831.'
privacy=$(gh api --hostname github.com "repos/$repo" --jq '.private')
[[ "$privacy" == true || "$privacy" == false ]] || die "$repo must be accessible."
# Labels are provisioned by the bridge owner; never create or approximate one here.
gh issue create --repo "https://github.com/$repo" \
    --title "$title" --body-file "$prompt" --label "agent:$target"
