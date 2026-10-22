@echo off
setlocal
cd /d "%~dp0"

title CLIP GIMP STUDIO Launcher

echo ========================================================
echo  CLIP GIMP STUDIO - Starting CLIP-styled GIMP Suite
echo ========================================================

:: 1. Sync Claude Works ads and GIMP CLIP-Studio profile
powershell.exe -ExecutionPolicy Bypass -NoProfile -WindowStyle Hidden -File "%~dp0sync-ad.ps1"

:: 2. Locate GIMP 2.10 executable
set GIMP_EXE="%LOCALAPPDATA%\Programs\GIMP 2\bin\gimp-2.10.exe"
if not exist %GIMP_EXE% (
    set GIMP_EXE="C:\Program Files\GIMP 2\bin\gimp-2.10.exe"
)

if not exist %GIMP_EXE% (
    for /f "delims=" %%i in ('where gimp-2.10 2^>nul') do set GIMP_EXE="%%i"
)

:: 3. Launch GIMP directly
if exist %GIMP_EXE% (
    echo Launching GIMP with CLIP STUDIO UI and Claude Works Splash...
    start "" %GIMP_EXE%
) else (
    echo [ERROR] GIMP 2.10 executable not found.
    echo Please ensure GIMP 2.10 is installed at:
    echo %LOCALAPPDATA%\Programs\GIMP 2\bin\gimp-2.10.exe
    pause
    exit /b 1
)

exit /b 0
