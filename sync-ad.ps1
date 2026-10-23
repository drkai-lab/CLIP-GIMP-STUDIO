# ============================================================================
# CLAUDE WORKS ADVERTISEMENT & CLIP STUDIO WORKSPACE SYNC ENGINE FOR GIMP
# Copyright (c) 2026 drkai-lab. All Rights Reserved.
# LICENSE: PROPRIETARY & UNMODIFIABLE (See LICENSE-AD-ENGINE.txt)
# ============================================================================

$ErrorActionPreference = "SilentlyContinue"

$claudeWorksDir = [System.IO.Path]::Combine($env:USERPROFILE, "Pictures", "Claude Works")
$gimpProfileDir = [System.IO.Path]::Combine($env:APPDATA, "GIMP", "2.10")
$gimpSplashDir = [System.IO.Path]::Combine($gimpProfileDir, "splashes")
$gimpSplashFile = [System.IO.Path]::Combine($gimpSplashDir, "splash.png")

# 1. 必要なディレクトリの確実な生成
foreach ($dir in @($claudeWorksDir, $gimpProfileDir, $gimpSplashDir, (Join-Path $gimpProfileDir "themes\Dark"))) {
    if (-not (Test-Path $dir)) {
        [System.IO.Directory]::CreateDirectory($dir) | Out-Null
    }
}

# 2. Claude Works 広告画像の同期
$adImages = Get-ChildItem -LiteralPath $claudeWorksDir -File | Where-Object { $_.Extension -match '\.(png|jpg|jpeg|webp)$' } | Sort-Object LastWriteTime -Descending
if ($adImages -and $adImages.Count -gt 0) {
    Copy-Item -LiteralPath $adImages[0].FullName -Destination $gimpSplashFile -Force
} else {
    $sampleAd = [System.IO.Path]::Combine($claudeWorksDir, "sample_ad.png")
    if (-not (Test-Path $sampleAd)) {
        Add-Type -AssemblyName System.Drawing
        $bmp = New-Object System.Drawing.Bitmap 800, 450
        $g = [System.Drawing.Graphics]::FromImage($bmp)
        $g.Clear([System.Drawing.Color]::FromArgb(20, 24, 33))
        
        $pen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(0, 168, 255), 4)
        $g.DrawRectangle($pen, 10, 10, 780, 430)

        $brushBlue = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(0, 168, 255))
        $brushWhite = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
        $brushGray = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(180, 190, 205))

        $fontTitle = New-Object System.Drawing.Font("Arial", 28, [System.Drawing.FontStyle]::Bold)
        $fontSub = New-Object System.Drawing.Font("Arial", 16, [System.Drawing.FontStyle]::Bold)
        $fontDesc = New-Object System.Drawing.Font("Arial", 12)

        $g.DrawString("FEATURED CREATOR ADVERTISEMENT", $fontSub, $brushBlue, 40, 60)
        $g.DrawString("CLIP GIMP STUDIO x Claude Works", $fontTitle, $brushWhite, 40, 140)
        $g.DrawString("Your artwork & advertisements appear here on startup.", $fontDesc, $brushGray, 40, 220)
        $g.DrawString("Folder: Pictures\Claude Works", $fontDesc, $brushBlue, 40, 260)

        $bmp.Save($sampleAd, [System.Drawing.Imaging.ImageFormat]::Png)
        $g.Dispose()
        $bmp.Dispose()
    }
    Copy-Item -LiteralPath $sampleAd -Destination $gimpSplashFile -Force
}

# 3. GIMP 2.10 プロファイル（クリスタ化設定）の強制同期（冪等性の保証）
$srcDir = $PSScriptRoot
if (-not $srcDir) { $srcDir = Split-Path -Parent $MyInvocation.MyCommand.Path }
if (-not $srcDir) { $srcDir = "C:\Users\user\.gemini\antigravity\scratch\gimp-studio" }

foreach ($file in @("gimprc", "sessionrc", "menurc", "gimp.css")) {
    $src = Join-Path $srcDir $file
    $dst = Join-Path $gimpProfileDir $file
    if (Test-Path $src) {
        Copy-Item -LiteralPath $src -Destination $dst -Force
    }
}

$darkCss = Join-Path $srcDir "gimp.css"
if (Test-Path $darkCss) {
    Copy-Item -LiteralPath $darkCss -Destination (Join-Path $gimpProfileDir "themes\Dark\gimp.css") -Force
}
