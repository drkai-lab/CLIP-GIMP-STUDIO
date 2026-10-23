@echo off
setlocal
cd /d "%~dp0"

title CLIP GIMP STUDIO Launcher

echo ========================================================
echo  CLIP GIMP STUDIO - Starting CLIP STUDIO PAINT Suite
echo ========================================================

:: 1. Sync Claude Works advertisement
powershell.exe -ExecutionPolicy Bypass -NoProfile -WindowStyle Hidden -File "%~dp0sync-ad.ps1"

:: 2. Start local bridge server
start "" /b powershell.exe -ExecutionPolicy Bypass -NoProfile -WindowStyle Hidden -File "%~dp0server.ps1" -Port 8765

timeout /t 1 /nobreak >nul

:: 3. Launch Native App Shell (Chromium App Mode - No Browser Frames)
set EDGE_PATH="C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
if not exist %EDGE_PATH% (
    set EDGE_PATH="C:\Program Files\Microsoft\Edge\Application\msedge.exe"
)

if exist %EDGE_PATH% (
    echo Launching Native CLIP STUDIO Suite Window...
    start "" %EDGE_PATH% --app="http://localhost:8765/" --start-maximized --window-name="CLIP GIMP STUDIO PRO"
) else (
    echo Launching Default Browser...
    start http://localhost:8765/
)

exit /b 0
