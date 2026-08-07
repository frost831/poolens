param(
  [switch]$SkipDeploy,
  [switch]$SkipAmplitudeSecret,
  [string]$ReportPath = ""
)

$ErrorActionPreference = "Stop"

$root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$siteRoot = (Resolve-Path (Join-Path $root "..\poolens-site")).Path
$stamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss zzz"
$safeStamp = Get-Date -Format "yyyy-MM-dd-HHmmss"
if (-not $ReportPath) {
  $ReportPath = Join-Path $root "docs\ops\splashlens-production-wiring-$safeStamp.md"
}

$checks = New-Object System.Collections.Generic.List[object]
$warnings = New-Object System.Collections.Generic.List[string]
$failures = New-Object System.Collections.Generic.List[string]

function Add-Check {
  param(
    [string]$Surface,
    [string]$Check,
    [string]$Result,
    [string]$Evidence,
    [string]$Fix = ""
  )
  $script:checks.Add([pscustomobject]@{
    Surface = $Surface
    Check = $Check
    Result = $Result
    Evidence = $Evidence
    Fix = $Fix
  })
  if ($Result -eq "fail") { $script:failures.Add("$Surface - $Check - $Evidence") }
  if ($Result -eq "warn" -or $Result -eq "blocked") { $script:warnings.Add("$Surface - $Check - $Evidence") }
}

function Get-Json {
  param([string]$Url, [hashtable]$Headers = @{})
  $tmp = Join-Path $env:TEMP ("sl-wire-" + [Guid]::NewGuid().ToString("N") + ".json")
  try {
    $args = @("-sS", "-D", "-", "-o", $tmp)
    foreach ($name in $Headers.Keys) {
      $args += @("-H", "$name`: $($Headers[$name])")
    }
    $args += $Url
    $headersText = (& curl.exe @args) -join "`n"
    $body = if (Test-Path -LiteralPath $tmp) { Get-Content -LiteralPath $tmp -Raw } else { "" }
    $statusLine = ($headersText -split "`r?`n" | Where-Object { $_ -match "^HTTP/" } | Select-Object -Last 1)
    $status = if ($statusLine) { [int](($statusLine -split " ")[1]) } else { 0 }
    $json = $null
    try { $json = $body | ConvertFrom-Json } catch {}
    return [pscustomobject]@{ Status = $status; Json = $json; Body = $body; Headers = $headersText }
  }
  finally {
    Remove-Item -LiteralPath $tmp -Force -ErrorAction SilentlyContinue
  }
}

function Test-Contains {
  param([string]$Url, [string[]]$Patterns, [string]$Surface, [string]$Check)
  $body = (curl.exe -sS -L -H "Accept-Encoding: identity" $Url) -join "`n"
  $missing = @()
  foreach ($pattern in $Patterns) {
    if (-not $body.Contains($pattern)) { $missing += $pattern }
  }
  Add-Check $Surface $Check ($(if ($missing.Count -eq 0) { "pass" } else { "fail" })) "missing=$($missing -join ', ')" "Deploy current static assets/functions."
}

function Get-AmplitudeKey {
  foreach ($name in @("AMPLITUDE_API_KEY", "SPLASHLENS_AMPLITUDE_API_KEY")) {
    $value = [Environment]::GetEnvironmentVariable($name, "Process")
    if (-not $value) { $value = [Environment]::GetEnvironmentVariable($name, "User") }
    if (-not $value) { $value = [Environment]::GetEnvironmentVariable($name, "Machine") }
    if ($value -and $value.Trim()) {
      return [pscustomobject]@{ Name = $name; Value = $value.Trim() }
    }
  }
  return $null
}

function Put-PagesSecret {
  param([string]$Project, [string]$Name, [string]$Value, [string]$WorkingDirectory)
  $tmp = Join-Path $env:TEMP ("sl-secret-" + [Guid]::NewGuid().ToString("N") + ".txt")
  try {
    Set-Content -LiteralPath $tmp -Value $Value -NoNewline
    Push-Location $WorkingDirectory
    try {
      Get-Content -LiteralPath $tmp | npx wrangler pages secret put $Name --project-name $Project | Out-Null
    }
    finally {
      Pop-Location
    }
  }
  finally {
    Remove-Item -LiteralPath $tmp -Force -ErrorAction SilentlyContinue
  }
}

function Deploy-App {
  $deploy = Join-Path $root "_deploy\usage-pull-prod"
  if (-not (Test-Path -LiteralPath $deploy)) { New-Item -ItemType Directory -Force -Path $deploy | Out-Null }
  foreach ($dir in @("functions", "js", "data", "icons", ".well-known", "workers")) {
    $src = Join-Path $root $dir
    if (Test-Path -LiteralPath $src) {
      robocopy $src (Join-Path $deploy $dir) /MIR /NFL /NDL /NJH /NJS /NP | Out-Null
      if ($LASTEXITCODE -gt 7) { throw "robocopy failed for app $dir with $LASTEXITCODE" }
    }
  }
  foreach ($file in @("index.html", "dashboard.html", "landing.html", "proof-packet.html", "manifest.json", "favicon.svg", "favicon.ico", "robots.txt", "llms.txt", "ai.txt", "sw.js", "sw-field-signals.js", "_headers", "_redirects")) {
    $src = Join-Path $root $file
    if (Test-Path -LiteralPath $src) { Copy-Item -LiteralPath $src -Destination (Join-Path $deploy $file) -Force }
  }
  Push-Location $root
  try {
    npx wrangler pages deploy "_deploy\usage-pull-prod" --project-name poolens --branch main --commit-dirty=true | Out-Null
  }
  finally {
    Pop-Location
  }
}

function Deploy-Site {
  $deploy = Join-Path $siteRoot "_deploy"
  if (-not (Test-Path -LiteralPath $deploy)) { New-Item -ItemType Directory -Force -Path $deploy | Out-Null }
  foreach ($file in @("index.html", "_headers", "_redirects", "splashlens-nav.js", "ga4.js", "favicon.svg", "favicon.ico", "favicon-32.png", "splashlens-icon-180.png", "splashlens-icon-512.png", "site.webmanifest", "robots.txt", "sitemap.xml", "pseo-sitemap.xml", "seo-hub-sitemap.xml", "category-hub-sitemap.xml", "source-pages-sitemap.xml", "ai.txt", "llms.txt")) {
    $src = Join-Path $siteRoot $file
    if (Test-Path -LiteralPath $src) { Copy-Item -LiteralPath $src -Destination (Join-Path $deploy $file) -Force }
  }
  foreach ($dir in @("functions", "field-challenge", "product-screenshots")) {
    $src = Join-Path $siteRoot $dir
    if (Test-Path -LiteralPath $src) {
      robocopy $src (Join-Path $deploy $dir) /MIR /NFL /NDL /NJH /NJS /NP | Out-Null
      if ($LASTEXITCODE -gt 7) { throw "robocopy failed for site $dir with $LASTEXITCODE" }
    }
  }
  Push-Location $siteRoot
  try {
    npx wrangler pages deploy "_deploy" --project-name poolens-site --branch main --commit-dirty=true | Out-Null
  }
  finally {
    Pop-Location
  }
}

$amp = Get-AmplitudeKey
if ($amp -and -not $SkipAmplitudeSecret) {
  Put-PagesSecret -Project "poolens" -Name "AMPLITUDE_API_KEY" -Value $amp.Value -WorkingDirectory $root
  Put-PagesSecret -Project "poolens-site" -Name "AMPLITUDE_API_KEY" -Value $amp.Value -WorkingDirectory $siteRoot
  Add-Check "Amplitude" "secret wiring" "pass" "$($amp.Name) found locally and uploaded to both Cloudflare Pages projects." ""
}
else {
  Add-Check "Amplitude" "secret wiring" "blocked" "No local AMPLITUDE_API_KEY or SPLASHLENS_AMPLITUDE_API_KEY was present, so no Amplitude secret could be uploaded." "Add the Amplitude project API key to local env, then rerun this script."
}

if (-not $SkipDeploy) {
  Deploy-App
  Add-Check "Deploy" "app Cloudflare Pages" "pass" "poolens deployed from trimmed app folder." ""
  Deploy-Site
  Add-Check "Deploy" "site Cloudflare Pages" "pass" "poolens-site deployed from trimmed site folder." ""
}
else {
  Add-Check "Deploy" "Cloudflare Pages" "warn" "Skipped by -SkipDeploy." "Run without -SkipDeploy."
}

$appEvents = Get-Json "https://app.splashlens.com/api/events"
Add-Check "App events" "live status" ($(if ($appEvents.Status -eq 200 -and $appEvents.Json.ok -eq $true -and $appEvents.Json.storageConfigured -eq $true -and $appEvents.Json.emailConfigured -eq $true) { "pass" } else { "fail" })) "status=$($appEvents.Status); storage=$($appEvents.Json.storageConfigured); email=$($appEvents.Json.emailConfigured); amplitude=$($appEvents.Json.amplitudeConfigured)" "Check Cloudflare bindings/secrets and redeploy."

$siteEvents = Get-Json "https://splashlens.com/api/event"
Add-Check "Site events" "live status" ($(if ($siteEvents.Status -eq 200 -and $siteEvents.Json.ok -eq $true -and $siteEvents.Json.stored -eq $true) { "pass" } else { "fail" })) "status=$($siteEvents.Status); stored=$($siteEvents.Json.stored); fresh=$($siteEvents.Json.fresh); amplitude=$($siteEvents.Json.amplitudeConfigured)" "Check D1 binding/secrets and redeploy."

$appAmplitude = Get-Json "https://app.splashlens.com/api/amplitude-config"
$siteAmplitude = Get-Json "https://splashlens.com/api/amplitude-config"
$ampReady = $appAmplitude.Status -eq 200 -and $siteAmplitude.Status -eq 200 -and $appAmplitude.Json.enabled -eq $true -and $siteAmplitude.Json.enabled -eq $true
Add-Check "Amplitude" "live config" ($(if ($ampReady) { "pass" } else { "blocked" })) "app=$($appAmplitude.Json.status); site=$($siteAmplitude.Json.status)" "Add AMPLITUDE_API_KEY to both Cloudflare projects and redeploy."

$checkout = Get-Json "https://app.splashlens.com/api/checkout-readiness"
Add-Check "Stripe" "checkout readiness" ($(if ($checkout.Status -eq 200 -and $checkout.Json.productionReady -eq $true) { "pass" } else { "fail" })) "status=$($checkout.Status); productionReady=$($checkout.Json.productionReady); stripe=$($checkout.Json.stripe.ok); webhook=$($checkout.Json.webhook.ok); paymentLinks=$($checkout.Json.paymentLinks.ok)" "Fix Stripe/webhook/payment-link config before sending paid traffic."

$usageProtected = Get-Json "https://app.splashlens.com/api/usage-pull?days=1&maxKeys=100"
Add-Check "Owner analytics" "usage pull protected" ($(if ($usageProtected.Status -eq 401) { "pass" } else { "fail" })) "status=$($usageProtected.Status)" "Keep /api/usage-pull protected."

Test-Contains "https://app.splashlens.com/js/app.js" @("identity_captured_after_value", "field-identity-prompt", "Keep Anonymous") "App UX" "post-value identity prompt live"
Test-Contains "https://app.splashlens.com/dashboard" @("Weak Spot Scorecard", "weakspot-scorecard", "/api/usage-pull") "Dashboard" "weak spot scorecard live"
Test-Contains "https://splashlens.com/" @("challenge=field60", "challenge_path=partsnap", "challenge_path=service_proof", "destination_path") "Marketing site" "challenge-linked app CTAs live"

New-Item -ItemType Directory -Force -Path (Split-Path -Parent $ReportPath) | Out-Null
$lines = @()
$lines += "# SplashLens Production Wiring Report"
$lines += ""
$lines += "Generated: $stamp"
$lines += ""
$lines += "Result: $(if ($failures.Count -eq 0 -and $warnings.Count -eq 0) { 'GREEN' } elseif ($failures.Count -eq 0) { 'YELLOW' } else { 'RED' })"
$lines += ""
$lines += "| Surface | Check | Result | Evidence | Fix |"
$lines += "|---|---|---|---|---|"
foreach ($row in $checks) {
  $lines += "| $($row.Surface) | $($row.Check) | $($row.Result) | $($row.Evidence -replace '\|','/') | $($row.Fix -replace '\|','/') |"
}
if ($warnings.Count -gt 0) {
  $lines += ""
  $lines += "## Warnings / Blockers"
  foreach ($warning in $warnings) { $lines += "- $warning" }
}
if ($failures.Count -gt 0) {
  $lines += ""
  $lines += "## Failures"
  foreach ($failure in $failures) { $lines += "- $failure" }
}
Set-Content -LiteralPath $ReportPath -Value ($lines -join "`n") -Encoding UTF8

$checks | Format-Table -AutoSize | Out-String -Width 240
Write-Output "Report: $ReportPath"

if ($failures.Count -gt 0) {
  throw "SplashLens production wiring failed: $($failures -join '; ')"
}
