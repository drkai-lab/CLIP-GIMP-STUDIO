@echo off
setlocal
cd /d "%~dp0"

echo ========================================
echo   CLIP GIMP STUDIO - Auto Git Push
echo   Destination: drkai-lab/CLIP-GIMP-STUDIO
echo ========================================

set GIT_PATH="%~dp0..\..\..\bin\mingit\cmd\git.exe"
if not exist %GIT_PATH% (
    set GIT_PATH=git
)

set COMMIT_MSG=%*
if "%COMMIT_MSG%"=="" (
    for /f "tokens=1-3 delims=/ " %%a in ('date /t') do set mydate=%%a-%%b-%%c
    for /f "tokens=1-2 delims=: " %%a in ('time /t') do set mytime=%%a:%%b
    set COMMIT_MSG=Update CLIP GIMP STUDIO (!mydate! !mytime!)
)

echo Adding all changes...
%GIT_PATH% add -A

echo Committing changes...
%GIT_PATH% commit -m "%COMMIT_MSG%"

echo Pushing to GitHub (drkai-lab/CLIP-GIMP-STUDIO)...
%GIT_PATH% push origin main

if %ERRORLEVEL% equ 0 (
    echo.
    echo [SUCCESS] Successfully pushed to https://github.com/drkai-lab/CLIP-GIMP-STUDIO !
) else (
    echo.
    echo [ERROR] Push failed. Please check network connection.
)

echo.
timeout /t 3
