[CmdletBinding()]
param(
    [ValidateSet('frost831/throttleshare', 'frost831/poolens', 'frost831/poolens-site')]
    [string]$Repo = 'frost831/throttleshare',
    [switch]$Background
)
$ErrorActionPreference = 'Stop'
$repo = $Repo
$repoSlug = $repo -replace '[^A-Za-z0-9_.-]', '-'
$runnerRoot = Join-Path $env:LOCALAPPDATA 'ThrottleShare\agent-runner-pc'
$runner = if ($repo -eq 'frost831/throttleshare') { $runnerRoot } else { Join-Path $runnerRoot $repoSlug }
$runtimePaths = Join-Path $runner 'runtime-paths.json'
if (Test-Path -LiteralPath $runtimePaths) {
    $savedPaths = @(Get-Content -LiteralPath $runtimePaths -Raw | ConvertFrom-Json)
    foreach ($path in $savedPaths) {
        if ($path -isnot [string] -or -not [IO.Path]::IsPathRooted($path)) { throw 'Invalid saved runner tool path.' }
    }
    $env:PATH = ($savedPaths -join ';') + ';' + $env:PATH
}
foreach ($tool in @('git', 'gh', 'codex', 'python', 'pwsh')) { Get-Command $tool -ErrorAction Stop | Out-Null }
$identity = & gh api user --jq .login
if ($LASTEXITCODE -ne 0 -or $identity -ne 'frost831') { throw 'Sign gh in as frost831 first.' }
$private = & gh api "repos/$repo" --jq .private
if ($LASTEXITCODE -ne 0 -or @('true', 'false') -notcontains $private) { throw "Bridge requires access to $repo." }
& codex login status
if ($LASTEXITCODE -ne 0) { throw 'Run codex login as the runner user first.' }
New-Item -ItemType Directory -Path $runner -Force | Out-Null
$toolPaths = @(@('git', 'gh', 'codex', 'python', 'pwsh') | ForEach-Object { Split-Path (Get-Command $_).Source } | Select-Object -Unique)
ConvertTo-Json -InputObject $toolPaths | Set-Content -LiteralPath $runtimePaths -Encoding utf8
$config = Join-Path $runner '.runner'
if (-not (Test-Path -LiteralPath $config)) {
    $release = & gh api repos/actions/runner/releases/latest | ConvertFrom-Json
    if ($LASTEXITCODE -ne 0) { throw 'Cannot retrieve the official runner release.' }
    $asset = $release.assets | Where-Object { $_.name -match '^actions-runner-win-x64-[0-9.]+\.zip$' } | Select-Object -First 1
    if (-not $asset -or $asset.digest -notmatch '^sha256:[a-f0-9]{64}$') { throw 'Official runner checksum is missing.' }
    $zip = Join-Path $runner $asset.name
    Invoke-WebRequest -Uri $asset.browser_download_url -OutFile $zip
    if ((Get-FileHash -LiteralPath $zip -Algorithm SHA256).Hash.ToLowerInvariant() -ne $asset.digest.Substring(7)) { throw 'Runner checksum mismatch.' }
    Expand-Archive -LiteralPath $zip -DestinationPath $runner -Force
    $registration = & gh api --method POST "repos/$repo/actions/runners/registration-token" | ConvertFrom-Json
    if ($LASTEXITCODE -ne 0 -or -not $registration.token) { throw 'Runner registration was not authorized.' }
    Push-Location $runner
    try {
        & .\config.cmd --unattended --url "https://github.com/$repo" --token $registration.token --name "$env:COMPUTERNAME-$repoSlug-pc" --labels pc,codex --work _work
        if ($LASTEXITCODE -ne 0) { throw 'Runner registration failed.' }
    } finally { $registration = $null; Pop-Location }
}
$registered = Get-Content -LiteralPath $config -Raw | ConvertFrom-Json
if ($registered.gitHubUrl.TrimEnd('/') -ne "https://github.com/$repo") { throw 'Existing runner belongs to another repository.' }
if ($Background) {
    $installedSetup = Join-Path $runner 'pc-setup.ps1'
    if ([IO.Path]::GetFullPath($PSCommandPath) -ne [IO.Path]::GetFullPath($installedSetup)) { Copy-Item -LiteralPath $PSCommandPath -Destination $installedSetup -Force }
    $pwsh = (Get-Command pwsh).Source
    $startup = 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Run'
    New-Item -Path $startup -Force | Out-Null
    Set-ItemProperty -Path $startup -Name "ThrottleShareAgentRunner-$repoSlug" -Value "`"$pwsh`" -NoProfile -WindowStyle Hidden -File `"$installedSetup`" -Repo `"$repo`" -Background"
    $active = Get-CimInstance Win32_Process -Filter "Name='Runner.Listener.exe'" | Where-Object { $_.ExecutablePath -eq (Join-Path $runner 'bin\Runner.Listener.exe') }
    if (-not $active) { Start-Process -FilePath (Join-Path $runner 'run.cmd') -WorkingDirectory $runner -WindowStyle Hidden }
    Write-Host 'PC runner started with per-user logon startup. This is not a Windows service; it stops on sign-out.'
} else {
    Push-Location $runner
    try { & .\run.cmd } finally { Pop-Location }
}
