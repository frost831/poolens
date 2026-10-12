[CmdletBinding()]
param(
    [Parameter(Mandatory, Position = 0)]
    [ValidateSet('mac', 'pc', IgnoreCase = $false)]
    [string]$Target,
    [Parameter(Mandatory, Position = 1)]
    [string]$Title,
    [Parameter(Mandatory, Position = 2)]
    [string]$PromptFile,
    [ValidateSet('frost831/throttleshare', 'frost831/poolens', 'frost831/poolens-site')]
    [string]$Repo = 'frost831/throttleshare'
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest
if (-not (Test-Path -LiteralPath $PromptFile -PathType Leaf)) {
    throw 'Prompt must be an existing file.'
}
$prompt = Get-Item -LiteralPath $PromptFile
if ($prompt.PSProvider.Name -ne 'FileSystem' -or $prompt.Length -eq 0) {
    throw 'Prompt must be a nonempty filesystem file.'
}
# Check readability before any GitHub operation.
$stream = [System.IO.File]::OpenRead($prompt.FullName)
$stream.Dispose()
if ([string]::IsNullOrWhiteSpace($Title)) { throw 'Title must not be blank.' }
Get-Command gh -CommandType Application -ErrorAction Stop | Out-Null
$oldHost = $env:GH_HOST
$oldPrompt = $env:GH_PROMPT_DISABLED
try {
    $env:GH_HOST = 'github.com'
    $env:GH_PROMPT_DISABLED = '1'
    $account = & gh api --hostname github.com user --jq .login
    if ($LASTEXITCODE -ne 0 -or $account -cne 'frost831') {
        throw 'Authenticate GitHub CLI as frost831.'
    }
    if ($Target -eq 'mac' -and $Repo -eq 'frost831/poolens-site') {
        throw 'Mac runner is not enabled for frost831/poolens-site.'
    }
    $private = & gh api --hostname github.com "repos/$Repo" --jq '.private'
    if ($LASTEXITCODE -ne 0 -or @('true', 'false') -cnotcontains $private) {
        throw "$Repo must be accessible."
    }
    & gh issue create --repo "https://github.com/$Repo" `
        --title $Title --body-file $prompt.FullName --label "agent:$Target"
    if ($LASTEXITCODE -ne 0) { throw 'GitHub issue creation failed; inspect GitHub before retrying.' }
}
finally {
    $env:GH_HOST = $oldHost
    $env:GH_PROMPT_DISABLED = $oldPrompt
}
