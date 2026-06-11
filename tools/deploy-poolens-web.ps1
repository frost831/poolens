param(
  [string]$ProjectName = "poolens"
)

$ErrorActionPreference = "Stop"
$root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$deploy = Join-Path $root "_deploy\poolens-web"

if (Test-Path $deploy) {
  $resolved = (Resolve-Path $deploy).Path
  if (-not $resolved.StartsWith($root)) {
    throw "Unsafe deploy path: $resolved"
  }
  Remove-Item -LiteralPath $resolved -Recurse -Force
}

New-Item -ItemType Directory -Force -Path $deploy | Out-Null

foreach ($file in @("index.html", "landing.html", "manifest.json", "favicon.svg", "robots.txt", "llms.txt", "sw.js", "_headers")) {
  $source = Join-Path $root $file
  if (Test-Path $source) {
    Copy-Item -LiteralPath $source -Destination $deploy -Force
  }
}

foreach ($dir in @("js", "functions", "icons", ".well-known")) {
  $source = Join-Path $root $dir
  if (Test-Path $source) {
    Copy-Item -LiteralPath $source -Destination (Join-Path $deploy $dir) -Recurse -Force
  }
}

Push-Location $root
try {
  npx wrangler pages deploy "_deploy\poolens-web" --project-name $ProjectName --branch main --commit-dirty=true
}
finally {
  Pop-Location
}
