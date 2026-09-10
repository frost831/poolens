param(
  [string]$BaseUrl = "https://app.splashlens.com",
  [string]$Secret = $env:SPLASHLENS_STATS_SECRET,
  [switch]$PromptForSecret,
  [switch]$Json
)

$ErrorActionPreference = "Stop"

function Convert-SecretToPlainText {
  param([Security.SecureString]$Secure)
  $ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($Secure)
  try {
    [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)
  }
  finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)
  }
}

if (-not $Secret -and $PromptForSecret) {
  $secure = Read-Host "Paste SplashLens stats/admin secret" -AsSecureString
  $Secret = Convert-SecretToPlainText -Secure $secure
}

if (-not $Secret) {
  throw "SPLASHLENS_STATS_SECRET is not set. Set it for owner API pulls, run tools\run-field-intelligence-loop.mjs for read-only D1 fallback, or pass -PromptForSecret for a manual one-time pull."
}

$headers = @{
  "X-SplashLens-Stats-Secret" = $Secret
  "Accept" = "application/json"
}

function Invoke-SplashLensJson {
  param([string]$Path)
  $uri = "$BaseUrl$Path"
  try {
    Invoke-RestMethod -Method Get -Uri $uri -Headers $headers
  }
  catch {
    $status = $_.Exception.Response.StatusCode.value__
    if ($status -eq 401) {
      throw "Unauthorized. Use the current SplashLens stats/admin secret; the value was not printed or stored."
    }
    throw
  }
}

try {
  $stats = Invoke-SplashLensJson -Path "/api/stats"
  $admin = Invoke-SplashLensJson -Path "/api/admin"
}
catch {
  [Console]::Error.WriteLine("ERROR: $($_.Exception.Message)")
  exit 1
}

if ($Json) {
  [ordered]@{
    pulledAt = (Get-Date).ToString("o")
    baseUrl = $BaseUrl
    stats = $stats
    admin = $admin
  } | ConvertTo-Json -Depth 12
  exit 0
}

function Write-TableRows {
  param(
    [string[]]$Headers,
    [object[]]$Rows
  )
  "| $($Headers -join ' | ') |"
  "| $(( $Headers | ForEach-Object { '---' }) -join ' | ') |"
  foreach ($row in $Rows) {
    $values = foreach ($header in $Headers) {
      $value = $row.$header
      if ($null -eq $value) { "" } else { [string]$value -replace "\|", "/" }
    }
    "| $($values -join ' | ') |"
  }
}

"# SplashLens Numbers Pull"
""
"Pulled: $((Get-Date).ToString('yyyy-MM-dd HH:mm:ss zzz'))"
"Source: $BaseUrl protected owner APIs"
""
"## Core Metrics"
""
$metrics = $stats.metrics
Write-TableRows -Headers @("Metric", "Value") -Rows @(
  [pscustomobject]@{ Metric = "Events, 7 days"; Value = $metrics.events7d },
  [pscustomobject]@{ Metric = "Events, 30 days"; Value = $metrics.events30d },
  [pscustomobject]@{ Metric = "App opens, 30 days"; Value = $metrics.appOpens30d },
  [pscustomobject]@{ Metric = "First field actions, 30 days"; Value = $metrics.firstActions30d },
  [pscustomobject]@{ Metric = "Useful results, 30 days"; Value = $metrics.firstValues30d },
  [pscustomobject]@{ Metric = "Feedback, 30 days"; Value = $metrics.feedback30d },
  [pscustomobject]@{ Metric = "Checkout clicks, 30 days"; Value = $metrics.checkoutClicks30d },
  [pscustomobject]@{ Metric = "Subscribers total"; Value = $metrics.subscribersTotal },
  [pscustomobject]@{ Metric = "Partner leads total"; Value = $metrics.partnerLeadsTotal },
  [pscustomobject]@{ Metric = "SplashLens paid completions"; Value = $metrics.splashlensPaidCompletions },
  [pscustomobject]@{ Metric = "Suspect non-SplashLens payment rows"; Value = $metrics.suspectNonSplashLensPaymentRows }
)
""
"## 7-Day Funnel"
""
Write-TableRows -Headers @("label", "count", "conversionFromPrevious") -Rows @($stats.funnel7d)
""
"## 30-Day Funnel"
""
Write-TableRows -Headers @("label", "count", "conversionFromPrevious") -Rows @($stats.funnel30d)
""
"## Top Events, 30 Days"
""
Write-TableRows -Headers @("event", "count") -Rows @($stats.topEvents30d)
""
"## Top Pages, 30 Days"
""
Write-TableRows -Headers @("path", "count") -Rows @($stats.topPages30d)
""
"## Commercial / Admin Totals"
""
$totals = $admin.totals
Write-TableRows -Headers @("Metric", "Value") -Rows @(
  [pscustomobject]@{ Metric = "Entitlements total"; Value = $totals.entitlementsTotal },
  [pscustomobject]@{ Metric = "Active entitlements"; Value = $totals.entitlementsActive },
  [pscustomobject]@{ Metric = "Open access requests"; Value = $totals.intakeOpen },
  [pscustomobject]@{ Metric = "Proof records, 30 days"; Value = $totals.proofLast30 },
  [pscustomobject]@{ Metric = "Partner card requests"; Value = $totals.partnerCardRequests },
  [pscustomobject]@{ Metric = "Approved partner cards"; Value = $totals.partnerCardsApproved },
  [pscustomobject]@{ Metric = "Learning modules"; Value = $totals.learningModules },
  [pscustomobject]@{ Metric = "Team workspaces"; Value = $totals.teamWorkspaces }
)
""
"## Payment Rows By Plan"
""
Write-TableRows -Headers @("event_type", "plan", "count", "stripeSessions", "firstSeen", "lastSeen") -Rows @($stats.paymentsByPlan)
