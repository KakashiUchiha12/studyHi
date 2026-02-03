@echo off
setlocal
echo 🎥 StudyHi FFmpeg Installer
echo ==========================================
echo.

:: Define install path
set "INSTALL_DIR=%LOCALAPPDATA%\ffmpeg"
set "ZIP_URL=https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip"
set "ZIP_FILE=%TEMP%\ffmpeg.zip"

:: 1. Check if already installed
ffmpeg -version >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ FFmpeg is already installed and in your PATH!
    echo.
    pause
    exit /b
)

echo ⬇️  Downloading FFmpeg (this may take a minute)...
powershell -Command "Invoke-WebRequest -Uri '%ZIP_URL%' -OutFile '%ZIP_FILE%'"
if %errorlevel% neq 0 (
    echo ❌ Download failed. Please check your internet connection.
    pause
    exit /b
)

echo 📦 Extracting...
if exist "%INSTALL_DIR%" rmdir /s /q "%INSTALL_DIR%"
mkdir "%INSTALL_DIR%"
powershell -Command "Expand-Archive -Path '%ZIP_FILE%' -DestinationPath '%INSTALL_DIR%' -Force"

:: The zip contains a subfolder like "ffmpeg-5.1.2-essentials_build", move contents up
for /d %%I in ("%INSTALL_DIR%\ffmpeg-*") do (
    xcopy "%%I\*" "%INSTALL_DIR%\" /E /H /Y >nul
    rmdir /s /q "%%I"
)

echo 🔧 Adding to System PATH...
set "BIN_PATH=%INSTALL_DIR%\bin"
powershell -Command "[Environment]::SetEnvironmentVariable('Path', [Environment]::GetEnvironmentVariable('Path', 'User') + ';%BIN_PATH%', 'User')"

:: Clean up
del "%ZIP_FILE%"

echo.
echo ==========================================
echo ✅ FFmpeg installed successfully!
echo ⚠️  IMPORTANT: You must CLOSE this terminal and open a NEW one for the changes to take effect.
echo.
pause
