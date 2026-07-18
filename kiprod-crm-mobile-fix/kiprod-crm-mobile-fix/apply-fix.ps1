$ErrorActionPreference = "Stop"

$packageRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = (Get-Location).Path

if (-not (Test-Path (Join-Path $projectRoot "app\layout.tsx"))) {
  throw "Run this script from the root of kiprod-crm (the folder containing app and package.json)."
}

$backupRoot = Join-Path $projectRoot ".kiprod-backups\mobile-contact-fix"
New-Item -ItemType Directory -Path $backupRoot -Force | Out-Null

$targets = @(
  "app\components\GlobalSearch.tsx",
  "app\contacts\ContactDirectory.tsx"
)

foreach ($relativePath in $targets) {
  $target = Join-Path $projectRoot $relativePath
  $backup = Join-Path $backupRoot ($relativePath -replace "\\", "__")
  Copy-Item $target $backup -Force
  Copy-Item (Join-Path $packageRoot $relativePath) $target -Force
}

$cssTarget = Join-Path $projectRoot "app\crm-refinements.css"
Copy-Item (Join-Path $packageRoot "app\crm-refinements.css") $cssTarget -Force

$layoutPath = Join-Path $projectRoot "app\layout.tsx"
$layout = Get-Content $layoutPath -Raw

if ($layout -notmatch 'import "\.\/crm-refinements\.css";') {
  $layout = $layout.Replace(
    'import "./globals.css";',
    "import `"./globals.css`";`r`nimport `"./crm-refinements.css`";"
  )
  Set-Content -Path $layoutPath -Value $layout -Encoding utf8
}

Write-Host "KIPROD CRM mobile/contact fix applied." -ForegroundColor Green
Write-Host "Now run: npm run build" -ForegroundColor Yellow
