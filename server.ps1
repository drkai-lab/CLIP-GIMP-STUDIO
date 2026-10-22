# CLIP GIMP STUDIO - Lightweight Local Bridge Server (PowerShell HttpListener)
# Zero external runtime required

param (
    [int]$Port = 8765
)

$rootDir = $PSScriptRoot
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
    Write-Host "[CLIP GIMP STUDIO Server] Press Ctrl+C to stop"
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
    $json = $obj | ConvertTo-Json -Depth 3 -Compress
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

    # API Routes
    if ($urlPath -eq "/api/launch-gimp" -and $request.HttpMethod -eq "POST") {
        $reader = New-Object System.IO.StreamReader($request.InputStream, [System.Text.Encoding]::UTF8)
        $body = $reader.ReadToEnd() | ConvertFrom-Json -ErrorAction SilentlyContinue

        if (Test-Path $gimpPath) {
            Start-Process $gimpPath
            Send-JsonResponse $context 200 @{ success = $true; message = "GIMP launched successfully" }
        } else {
            Send-JsonResponse $context 404 @{ success = $false; message = "GIMP executable not found at $gimpPath" }
        }
        continue
    }

    if ($urlPath -eq "/api/apply-profile" -and $request.HttpMethod -eq "POST") {
        $gimpConfigDir = "$env:APPDATA\GIMP\2.10"
        if (-not (Test-Path $gimpConfigDir)) {
            New-Item -ItemType Directory -Path $gimpConfigDir -Force | Out-Null
        }

        # Backup & Copy sessionrc (Layout)
        $sessionSrc = Join-Path $rootDir "gimp_profile\sessionrc"
        if (Test-Path $sessionSrc) {
            Copy-Item $sessionSrc -Destination (Join-Path $gimpConfigDir "sessionrc") -Force
        }

        # Copy menurc (Keybindings)
        $menuSrc = Join-Path $rootDir "gimp_profile\menurc"
        if (Test-Path $menuSrc) {
            Copy-Item $menuSrc -Destination (Join-Path $gimpConfigDir "menurc") -Force
        }

        # Copy gimp.css (Dark Theme)
        $cssSrc = Join-Path $rootDir "gimp_profile\gimp.css"
        if (Test-Path $cssSrc) {
            Copy-Item $cssSrc -Destination (Join-Path $gimpConfigDir "gimp.css") -Force
        }

        Send-JsonResponse $context 200 @{ success = $true; message = "CLIP STUDIO layout profile applied to GIMP 2.10 config" }
        continue
    }

    if ($urlPath -eq "/api/open-folder" -and $request.HttpMethod -eq "POST") {
        Start-Process "explorer.exe" $rootDir
        Send-JsonResponse $context 200 @{ success = $true }
        continue
    }

    if ($urlPath -eq "/api/status" -and $request.HttpMethod -eq "GET") {
        $lastCommit = git log -1 --pretty=format:"%h - %s (%cr)" 2>$null
        Send-JsonResponse $context 200 @{
            success = $true
            gimpInstalled = (Test-Path $gimpPath)
            gimpPath = $gimpPath
            lastCommit = $lastCommit
        }
        continue
    }

    if ($urlPath -eq "/api/git-push" -and $request.HttpMethod -eq "POST") {
        $reader = New-Object System.IO.StreamReader($request.InputStream, [System.Text.Encoding]::UTF8)
        $body = $reader.ReadToEnd() | ConvertFrom-Json -ErrorAction SilentlyContinue

        $token = $body.token
        $msg = if ($body.message) { $body.message } else { "Update CLIP GIMP STUDIO" }

        Set-Location $rootDir
        git add -A
        git commit -m $msg 2>$null

        if ($token) {
            $userEncoded = [System.Uri]::EscapeDataString("219235771+0yenAI@users.noreply.github.com")
            $tokenEncoded = [System.Uri]::EscapeDataString($token)
            git remote set-url origin "https://${userEncoded}:${tokenEncoded}@github.com/drkai-lab/CLIP-GIMP-STUDIO.git"
            $pushOut = git push -u origin main 2>&1 | Out-String
            if ($LASTEXITCODE -eq 0) {
                Send-JsonResponse $context 200 @{ success = $true; message = "Pushed to drkai-lab successfully" }
            } else {
                Send-JsonResponse $context 400 @{ success = $false; message = $pushOut }
            }
        } else {
            Send-JsonResponse $context 400 @{ success = $false; message = "Token is required for GitHub push" }
        }
        continue
    }

    # Static File Delivery
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
            ".json" { "application/json; charset=utf-8" }
            default { "application/octet-stream" }
        }
        $bytes = [System.IO.File]::ReadAllBytes($fullPath)
        Send-Response $context 200 $contentType $bytes
    } else {
        Send-Response $context 404 "text/plain" ([System.Text.Encoding]::UTF8.GetBytes("404 Not Found: $urlPath"))
    }
}
