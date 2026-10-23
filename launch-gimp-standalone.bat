@echo off
setlocal
cd /d "%~dp0"

title GIMP 2.10 CLIP-Studio Profile Launcher

:: 1. Sync Claude Works ads and GIMP CLIP-Studio profile
powershell.exe -ExecutionPolicy Bypass -NoProfile -WindowStyle Hidden -File "%~dp0sync-ad.ps1"

:: 2. Locate and launch GIMP directly
set GIMP_EXE="%LOCALAPPDATA%\Programs\GIMP 2\bin\gimp-2.10.exe"
if not exist %GIMP_EXE% (
    set GIMP_EXE="C:\Program Files\GIMP 2\bin\gimp-2.10.exe"
)

if exist %GIMP_EXE% (
    start "" %GIMP_EXE%
) else (
    echo [ERROR] GIMP 2.10 executable not found.
    pause
)
