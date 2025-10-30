@echo off
echo ========================================
echo    Cliqpat Server Startup Script
echo ========================================
echo.

echo [1/4] Stopping any existing Node processes...
taskkill /f /im node.exe >nul 2>&1
if %errorlevel% equ 0 (
    echo    ✓ Node processes stopped
) else (
    echo    ℹ No Node processes were running
)

echo [2/4] Waiting for processes to fully terminate...
timeout /t 2 /nobreak >nul

echo [3/4] Checking if port 5000 is free...
netstat -ano | findstr :5000 >nul 2>&1
if %errorlevel% equ 0 (
    echo    ⚠ Port 5000 is still in use, waiting...
    timeout /t 3 /nobreak >nul
) else (
    echo    ✓ Port 5000 is free
)

echo [4/4] Starting Cliqpat server...
echo.
echo Starting server... (Press Ctrl+C to stop)
echo ========================================
npm run dev

echo.
echo Server stopped. Press any key to exit...
pause >nul
