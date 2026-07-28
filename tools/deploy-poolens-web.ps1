param(
  [string]$ProjectName = "poolens"
)

$ErrorActionPreference = "Stop"
$root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$deploy = Join-Path $root ("_deploy\poolens-web-" + (Get-Date -Format "yyyyMMddHHmmss"))

New-Item -ItemType Directory -Force -Path $deploy | Out-Null

foreach ($file in @("index.html", "landing.html", "dashboard.html", "proof-packet.html", "manifest.json", "favicon.svg", "favicon.ico", "robots.txt", "llms.txt", "ai.txt", "sw.js", "sw-partsnap-corpus.js", "_headers", "_redirects")) {
  $source = Join-Path $root $file
  if (Test-Path $source) {
    Copy-Item -LiteralPath $source -Destination $deploy -Force
  }
}

foreach ($dir in @("js", "data", "functions", "icons", ".well-known")) {
  $source = Join-Path $root $dir
  if (Test-Path $source) {
    Copy-Item -LiteralPath $source -Destination (Join-Path $deploy $dir) -Recurse -Force
  }
}

Push-Location $root
try {
  $relativeDeploy = Resolve-Path -LiteralPath $deploy -Relative
  npx wrangler pages deploy $relativeDeploy --project-name $ProjectName --branch main --commit-dirty=true
}
finally {
  Pop-Location
}
