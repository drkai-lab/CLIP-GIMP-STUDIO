# CLIP GIMP STUDIO - Lightweight Local Bridge Server (PowerShell HttpListener)
# Zero external runtime required

param (
    [int]$Port = 8765
)

$rootDir = $PSScriptRoot
$worksDir = "$env:USERPROFILE\Pictures\CLIP GIMP Works"
if (-not (Test-Path $worksDir)) {
    New-Item -ItemType Directory -Path $worksDir -Force | Out-Null
}

# Claude Works advertisement directory
$claudeWorksDir = "$env:USERPROFILE\Pictures\Claude Works"
if (-not (Test-Path $claudeWorksDir)) {
    New-Item -ItemType Directory -Path $claudeWorksDir -Force | Out-Null
}

$gimpPath = "$env:LOCALAPPDATA\Programs\GIMP 2\bin\gimp-2.10.exe"
if (-not (Test-Path $gimpPath)) {
    $gimpCmd = Get-Command gimp* -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($gimpCmd) { $gimpPath = $gimpCmd.Source }
}

$listener = New-Object System.Net.HttpListener
$prefix = "http://localhost:$Port/"
$listener.Prefixes.Add($prefix)

try {
    $listener.Start()
    Write-Host "[CLIP GIMP STUDIO Server] Running at $prefix"
    Write-Host "[CLIP GIMP STUDIO Server] Works Directory: $worksDir"
    Write-Host "[CLIP GIMP STUDIO Server] Claude Works Ads: $claudeWorksDir"
} catch {
    Write-Error "Failed to start HttpListener on $prefix : $_"
    exit 1
}

function Send-Response($context, [int]$statusCode, [string]$contentType, [byte[]]$content) {
    $response = $context.Response
    $response.StatusCode = $statusCode
    $response.ContentType = $contentType
    $response.Headers.Add("Access-Control-Allow-Origin", "*")
    $response.Headers.Add("Access-Control-Allow-Headers", "Content-Type")
    $response.Headers.Add("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
    $response.ContentLength64 = $content.Length
    $response.OutputStream.Write($content, 0, $content.Length)
    $response.OutputStream.Close()
}

function Send-JsonResponse($context, [int]$statusCode, $obj) {
    $json = $obj | ConvertTo-Json -Depth 5 -Compress
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($json)
    Send-Response $context $statusCode "application/json; charset=utf-8" $bytes
}

while ($listener.IsListening) {
    $context = $listener.GetContext()
    $request = $context.Request
    $urlPath = $request.Url.LocalPath

    if ($request.HttpMethod -eq "OPTIONS") {
        Send-Response $context 200 "text/plain" ([byte[]]@())
        continue
    }

    # Route: Get Claude Works ads for splash screen
    if ($urlPath -eq "/api/splash-ad" -and $request.HttpMethod -eq "GET") {
        $files = Get-ChildItem -Path $claudeWorksDir -File | Where-Object { $_.Extension -match '\.(png|jpg|jpeg|webp|gif|mp4|webm)$' } | Sort-Object LastWriteTime -Descending
        $ads = @()
        foreach ($f in $files) {
            $ext = $f.Extension.TrimStart(".").ToLower()
            $isVideo = ($ext -eq "mp4" -or $ext -eq "webm")
            $ads += @{
                name = $f.Name
                isVideo = $isVideo
                type = $ext
                url = "/api/ad-media?file=" + [System.Uri]::EscapeDataString($f.Name)
            }
        }

        # Update GIMP splash screen if image available
        $firstImg = $files | Where-Object { $_.Extension -match '\.(png|jpg|jpeg|webp)$' } | Select-Object -First 1
        if ($firstImg) {
            $gimpSplashPath = "$env:APPDATA\GIMP\2.10\splashes\splash.png"
            if (Test-Path (Split-Path $gimpSplashPath)) {
                try { Copy-Item $firstImg.FullName -Destination $gimpSplashPath -Force } catch {}
            }
        }

        Send-JsonResponse $context 200 @{ success = $true; ads = $ads; folder = $claudeWorksDir }
        continue
    }

    # Route: Stream ad media binary
    if ($urlPath -eq "/api/ad-media" -and $request.HttpMethod -eq "GET") {
        $fileName = $request.QueryString["file"]
        if ($fileName) {
            $safeName = [System.IO.Path]::GetFileName($fileName)
            $mediaPath = Join-Path $claudeWorksDir $safeName
            if (Test-Path $mediaPath -PathType Leaf) {
                $ext = [System.IO.Path]::GetExtension($mediaPath).ToLower()
                $mime = switch ($ext) {
                    ".mp4"  { "video/mp4" }
                    ".webm" { "video/webm" }
                    ".png"  { "image/png" }
                    ".jpg"  { "image/jpeg" }
                    ".jpeg" { "image/jpeg" }
                    ".gif"  { "image/gif" }
                    ".webp" { "image/webp" }
                    default { "application/octet-stream" }
                }
                $bytes = [System.IO.File]::ReadAllBytes($mediaPath)
                Send-Response $context 200 $mime $bytes
                continue
            }
        }
        Send-Response $context 404 "text/plain" ([System.Text.Encoding]::UTF8.GetBytes("404 Media Not Found"))
        continue
    }

    # Route: Open Claude Works folder
    if ($urlPath -eq "/api/open-claude-works" -and $request.HttpMethod -eq "POST") {
        Start-Process "explorer.exe" $claudeWorksDir
        Send-JsonResponse $context 200 @{ success = $true }
        continue
    }

    # Route: Get works list
    if ($urlPath -eq "/api/works" -and $request.HttpMethod -eq "GET") {
        $files = Get-ChildItem -Path $worksDir -File | Where-Object { $_.Extension -match '\.(xcf|png|jpg|jpeg|psd|clip)$' } | Sort-Object LastWriteTime -Descending
        $items = @()
        foreach ($f in $files) {
            $ext = $f.Extension.TrimStart(".").ToUpper()
            $sizeMb = [math]::Round($f.Length / 1MB, 2)
            $items += @{
                id = $f.Name
                title = [System.IO.Path]::GetFileNameWithoutExtension($f.Name)
                ext = $ext
                path = $f.FullName
                updated = $f.LastWriteTime.ToString("yyyy/MM/dd HH:mm")
                size = "$sizeMb MB"
            }
        }
        Send-JsonResponse $context 200 @{ success = $true; works = $items; folder = $worksDir }
        continue
    }

    # Route: Create new work
    if ($urlPath -eq "/api/create-work" -and $request.HttpMethod -eq "POST") {
        $reader = New-Object System.IO.StreamReader($request.InputStream, [System.Text.Encoding]::UTF8)
        $body = $reader.ReadToEnd() | ConvertFrom-Json -ErrorAction SilentlyContinue

        $title = if ($body.title) { $body.title } else { "Untitled_" + (Get-Date -Format "yyyyMMdd_HHmmss") }
        $w = if ($body.width) { [int]$body.width } else { 2000 }
        $h = if ($body.height) { [int]$body.height } else { 2000 }

        $safeTitle = [regex]::Replace($title, '[\\/:*?"<>|]', '_')
        $filePath = Join-Path $worksDir "$safeTitle.png"

        Add-Type -AssemblyName System.Drawing
        $bmp = New-Object System.Drawing.Bitmap $w, $h
        $g = [System.Drawing.Graphics]::FromImage($bmp)
        $g.Clear([System.Drawing.Color]::White)
        $bmp.Save($filePath, [System.Drawing.Imaging.ImageFormat]::Png)
        $g.Dispose()
        $bmp.Dispose()

        if (Test-Path $gimpPath) {
            Start-Process $gimpPath -ArgumentList "`"$filePath`""
        }

        Send-JsonResponse $context 200 @{ success = $true; path = $filePath; title = $safeTitle }
        continue
    }

    # Route: Launch GIMP
    if ($urlPath -eq "/api/launch-gimp" -and $request.HttpMethod -eq "POST") {
        $reader = New-Object System.IO.StreamReader($request.InputStream, [System.Text.Encoding]::UTF8)
        $body = $reader.ReadToEnd() | ConvertFrom-Json -ErrorAction SilentlyContinue

        if (Test-Path $gimpPath) {
            if ($body -and $body.file -and (Test-Path $body.file)) {
                Start-Process $gimpPath -ArgumentList "`"$($body.file)`""
            } else {
                Start-Process $gimpPath
            }
            Send-JsonResponse $context 200 @{ success = $true; message = "GIMP launched successfully" }
        } else {
            Send-JsonResponse $context 404 @{ success = $false; message = "GIMP executable not found" }
        }
        continue
    }

    # Route: Apply GIMP profile
    if ($urlPath -eq "/api/apply-profile" -and $request.HttpMethod -eq "POST") {
        powershell.exe -ExecutionPolicy Bypass -NoProfile -File (Join-Path $rootDir "apply-profile.ps1") | Out-Null
        Send-JsonResponse $context 200 @{ success = $true; message = "CLIP STUDIO layout profile applied" }
        continue
    }

    # Route: Open works folder
    if ($urlPath -eq "/api/open-folder" -and $request.HttpMethod -eq "POST") {
        Start-Process "explorer.exe" $worksDir
        Send-JsonResponse $context 200 @{ success = $true }
        continue
    }

    # Route: Get status
    if ($urlPath -eq "/api/status" -and $request.HttpMethod -eq "GET") {
        Set-Location $rootDir
        $lastCommit = git log -1 --pretty=format:"%h - %s (%cr)" 2>$null
        Send-JsonResponse $context 200 @{
            success = $true
            gimpInstalled = (Test-Path $gimpPath)
            gimpPath = $gimpPath
            worksDir = $worksDir
            claudeWorksDir = $claudeWorksDir
            lastCommit = $lastCommit
        }
        continue
    }

    # Route: GitHub push
    if ($urlPath -eq "/api/git-push" -and $request.HttpMethod -eq "POST") {
        $reader = New-Object System.IO.StreamReader($request.InputStream, [System.Text.Encoding]::UTF8)
        $body = $reader.ReadToEnd() | ConvertFrom-Json -ErrorAction SilentlyContinue

        $token = $body.token
        $msg = if ($body.message) { $body.message } else { "Update CLIP GIMP STUDIO" }

        Set-Location $rootDir
        git add -A
        git commit -m $msg 2>$null

        if ($token) {
            $userEncoded = [System.Uri]::EscapeDataString("drkai-lab")
            $tokenEncoded = [System.Uri]::EscapeDataString($token)
            git remote set-url origin "https://${userEncoded}:${tokenEncoded}@github.com/drkai-lab/CLIP-GIMP-STUDIO.git"
            $pushOut = git push origin main 2>&1 | Out-String
            if ($LASTEXITCODE -eq 0) {
                Send-JsonResponse $context 200 @{ success = $true; message = "Pushed to drkai-lab successfully" }
            } else {
                Send-JsonResponse $context 400 @{ success = $false; message = $pushOut }
            }
        } else {
            $pushOut = git push origin main 2>&1 | Out-String
            if ($LASTEXITCODE -eq 0) {
                Send-JsonResponse $context 200 @{ success = $true; message = "Pushed to drkai-lab successfully" }
            } else {
                Send-JsonResponse $context 400 @{ success = $false; message = $pushOut }
            }
        }
        continue
    }

    # Static file delivery
    $localPath = if ($urlPath -eq "/" -or $urlPath -eq "") { "index.html" } else { $urlPath.TrimStart("/") }
    $fullPath = Join-Path $rootDir $localPath

    if (Test-Path $fullPath -PathType Leaf) {
        $ext = [System.IO.Path]::GetExtension($fullPath).ToLower()
        $contentType = switch ($ext) {
            ".html" { "text/html; charset=utf-8" }
            ".css"  { "text/css; charset=utf-8" }
            ".js"   { "application/javascript; charset=utf-8" }
            ".svg"  { "image/svg+xml" }
            ".png"  { "image/png" }
            ".jpg"  { "image/jpeg" }
            ".jpeg" { "image/jpeg" }
            ".mp4"  { "video/mp4" }
            ".webm" { "video/webm" }
            ".gpl"  { "text/plain; charset=utf-8" }
            ".json" { "application/json; charset=utf-8" }
            default { "application/octet-stream" }
        }
        $bytes = [System.IO.File]::ReadAllBytes($fullPath)
        Send-Response $context 200 $contentType $bytes
    } else {
        Send-Response $context 404 "text/plain" ([System.Text.Encoding]::UTF8.GetBytes("404 Not Found: $urlPath"))
    }
}
