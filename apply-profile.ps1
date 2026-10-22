# Apply CLIP STUDIO PAINT Profile to GIMP 2.10
$ErrorActionPreference = "Stop"

$scriptDir = $PSScriptRoot
$gimpTargetDir = "$env:APPDATA\GIMP\2.10"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  CLIP GIMP STUDIO - Profile Installer  " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

if (-not (Test-Path $gimpTargetDir)) {
    Write-Host "Creating GIMP 2.10 profile directory..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $gimpTargetDir -Force | Out-Null
}

# 1. sessionrc (Layout)
$sessionSrc = Join-Path $scriptDir "gimp_profile\sessionrc"
if (Test-Path $sessionSrc) {
    Copy-Item $sessionSrc -Destination (Join-Path $gimpTargetDir "sessionrc") -Force
    Write-Host "[OK] sessionrc applied (CSP Docking Layout)" -ForegroundColor Green
}

# 2. menurc (Keybindings)
$menuSrc = Join-Path $scriptDir "gimp_profile\menurc"
if (Test-Path $menuSrc) {
    Copy-Item $menuSrc -Destination (Join-Path $gimpTargetDir "menurc") -Force
    Write-Host "[OK] menurc applied (CSP Shortcuts: B, E, G, M, Ctrl+T, etc.)" -ForegroundColor Green
}

# 3. gimp.css (Dark Theme)
$cssSrc = Join-Path $scriptDir "gimp_profile\gimp.css"
if (Test-Path $cssSrc) {
    Copy-Item $cssSrc -Destination (Join-Path $gimpTargetDir "gimp.css") -Force
    Write-Host "[OK] gimp.css applied (Studio Dark Scheme)" -ForegroundColor Green
}

Write-Host "`nSuccessfully applied CLIP STUDIO PAINT layout to GIMP!" -ForegroundColor Cyan
Write-Host "Launch GIMP to see the new layout." -ForegroundColor White
