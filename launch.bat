@echo off
setlocal
cd /d "%~dp0"

title CLIP GIMP STUDIO Launcher

echo Starting CLIP GIMP STUDIO Local Server...
start "" /b powershell.exe -ExecutionPolicy Bypass -NoProfile -WindowStyle Hidden -File "%~dp0server.ps1" -Port 8765

timeout /t 1 /nobreak >nul

set EDGE_PATH="C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
if not exist %EDGE_PATH% (
    set EDGE_PATH="C:\Program Files\Microsoft\Edge\Application\msedge.exe"
)

if exist %EDGE_PATH% (
    echo Launching Native App Window...
    start "" %EDGE_PATH% --app="http://localhost:8765/" --window-size=1200,800 --window-name="CLIP GIMP STUDIO"
) else (
    echo Opening Default Browser...
    start http://localhost:8765/
)

exit /b 0
