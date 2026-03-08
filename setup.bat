@echo off
SETLOCAL EnableDelayedExpansion

echo ==========================================
echo    OfflineGPT - Setup Assistant
echo ==========================================
echo.

set /p "choice=Do you want to proceed with the setup? (y/n): "
if /i "%choice%" neq "y" (
    echo [INFO] Setup cancelled by user.
    pause
    exit /b
)
echo.

:: 1. Check for Node.js
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js is not installed.
    echo Please download and install Node.js from https://nodejs.org/
    pause
    exit /b
)
echo [OK] Node.js found.

:: 2. Check for Ollama
where ollama >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [WARNING] Ollama is not installed or not in PATH.
    echo Please download and install Ollama from https://ollama.com/
    echo After installing, restart this script.
    pause
    start https://ollama.com/
    exit /b
)
echo [OK] Ollama found.

:: 2.5 Setup Environment Variables
if not exist ".env" (
    echo [INFO] Creating .env from .env.example...
    copy .env.example .env >nul
)
if not exist "Backend\.env" (
    copy .env.example Backend\.env >nul
)

:: 3. Install Root Dependencies
echo [STEP 1/4] Installing Root dependencies...
call npm install

:: 4. Install Backend Dependencies
echo [STEP 2/4] Installing Backend dependencies...
cd Backend
call npm install
cd ..

:: 5. Install Frontend Dependencies
echo [STEP 3/4] Installing Frontend dependencies...
cd Frontend
call npm install
cd ..

:: 6. Pull Ollama Model
echo [STEP 4/4] Pulling required models...
echo This may take a few minutes depending on your internet speed.

:: Try to get model name from .env, else default
set "FINAL_MODEL=llama3.2:1b"
if exist ".env" (
    for /f "tokens=2 delims==" %%a in ('findstr "MODEL_NAME=" .env') do set "FINAL_MODEL=%%a"
)

echo Pulling %FINAL_MODEL%...
ollama pull %FINAL_MODEL%

echo.
echo ==========================================
echo    Setup Complete!
echo ==========================================
echo To start the app:
echo 1. Open a terminal and run: npm run dev
echo.
pause
