param(
  [string]$ProjectName = "poolens",
  [switch]$StageOnly
)

$ErrorActionPreference = "Stop"
$root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$deploy = Join-Path $root "_deploy\poolens-web"
$staging = Join-Path $root "_deploy"
if (Test-Path -LiteralPath $staging) {
  $item = Get-Item -LiteralPath $staging -Force
  if (-not $item.PSIsContainer -or ($item.Attributes -band [IO.FileAttributes]::ReparsePoint)) {
    throw "Unsafe staging directory."
  }
}

if (Test-Path $deploy) {
  $resolved = (Resolve-Path $deploy).Path
  $item = Get-Item -LiteralPath $deploy -Force
  if ($resolved -ne [IO.Path]::GetFullPath($deploy) -or -not $item.PSIsContainer -or ($item.Attributes -band [IO.FileAttributes]::ReparsePoint)) {
    throw "Unsafe deploy path: $resolved"
  }
  Remove-Item -LiteralPath $resolved -Recurse -Force
}

New-Item -ItemType Directory -Force -Path $deploy | Out-Null

foreach ($file in @("index.html", "landing.html", "dashboard.html", "owner-dashboard.html", "privacy.html", "data-deletion.html", "manifest.json", "favicon.svg", "robots.txt", "llms.txt", "sw.js", "_headers", "_redirects", "_routes.json")) {
  $source = Join-Path $root $file
  if (Test-Path $source) {
    $item = Get-Item -LiteralPath $source -Force
    if (-not $item.PSIsContainer -and -not ($item.Attributes -band [IO.FileAttributes]::ReparsePoint)) {
      Copy-Item -LiteralPath $source -Destination $deploy -Force
    }
  }
}

function Copy-PublicDirectory([string]$Source, [string]$Destination, [string]$Kind) {
  foreach ($item in Get-ChildItem -LiteralPath $Source -Force) {
    if (($item.Attributes -band [IO.FileAttributes]::ReparsePoint) -or $item.Name.StartsWith('.')) { continue }
    if ($item.PSIsContainer) {
      if ($Kind -eq '.well-known' -or $item.Name -in @('src', 'server', 'functions', 'tests', 'tools', 'docs', 'node_modules', 'ios', 'android')) { continue }
      Copy-PublicDirectory $item.FullName (Join-Path $Destination $item.Name) $Kind
    } else {
      if ($item.Name -match '^(package(-lock)?\.json|composer\.(json|lock)|wrangler\.(toml|jsonc?)|config\.json|credentials\.json)$') { continue }
      $allowed = if ($Kind -eq '.well-known') {
        $item.Name -in @('assetlinks.json', 'apple-app-site-association')
      } elseif ($Kind -eq 'js') {
        $item.Extension.ToLowerInvariant() -in @('.js', '.mjs', '.json')
      } else {
        $item.Extension.ToLowerInvariant() -in @('.png', '.jpg', '.jpeg', '.webp', '.avif', '.svg', '.ico')
      }
      if ($allowed) {
        New-Item -ItemType Directory -Force -Path $Destination | Out-Null
        Copy-Item -LiteralPath $item.FullName -Destination $Destination -Force
      }
    }
  }
}

foreach ($dir in @("js", "icons", ".well-known")) {
  $source = Join-Path $root $dir
  if (Test-Path -LiteralPath $source -PathType Container) {
    $item = Get-Item -LiteralPath $source -Force
    if (-not ($item.Attributes -band [IO.FileAttributes]::ReparsePoint)) {
      Copy-PublicDirectory $source (Join-Path $deploy $dir) $dir
    }
  }
}

# Pages compiles functions/ from the repository cwd; never copy it into public assets.
if ($StageOnly) {
  [pscustomobject]@{ output = $deploy; count = @(Get-ChildItem -LiteralPath $deploy -Recurse -File -Force).Count } | ConvertTo-Json -Compress
  return
}

Push-Location $root
try {
  $dirty = git status --porcelain
  if ($LASTEXITCODE -ne 0) {
    throw "Could not verify the Git working tree before deployment."
  }
  if ($dirty) {
    throw "Refusing to deploy a dirty working tree. Commit or stash the changes first."
  }
  $commit = (git rev-parse HEAD).Trim()
  if ($LASTEXITCODE -ne 0 -or -not $commit) {
    throw "Could not resolve the Git commit for deployment."
  }
  npx wrangler pages deploy "_deploy\poolens-web" --project-name $ProjectName --branch main --commit-hash $commit --commit-dirty=false
  if ($LASTEXITCODE -ne 0) {
    throw "Cloudflare Pages deployment failed."
  }
}
finally {
  Pop-Location
}
