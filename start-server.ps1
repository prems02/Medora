# Cliqpat Server Startup Script (PowerShell)
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "    Cliqpat Server Startup Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Kill all Node processes
Write-Host "[1/4] Stopping any existing Node processes..." -ForegroundColor Yellow
$nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    $nodeProcesses | Stop-Process -Force
    Write-Host "    ✓ Node processes stopped" -ForegroundColor Green
} else {
    Write-Host "    ℹ No Node processes were running" -ForegroundColor Blue
}

# Step 2: Wait for processes to terminate
Write-Host "[2/4] Waiting for processes to fully terminate..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

# Step 3: Check and wait for port 5000 to be free
Write-Host "[3/4] Checking if port 5000 is free..." -ForegroundColor Yellow
$maxAttempts = 10
$attempt = 0
do {
    $portInUse = Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue
    if ($portInUse) {
        Write-Host "    ⚠ Port 5000 is still in use, waiting... (Attempt $($attempt + 1)/$maxAttempts)" -ForegroundColor Yellow
        Start-Sleep -Seconds 2
        $attempt++
    } else {
        Write-Host "    ✓ Port 5000 is free" -ForegroundColor Green
        break
    }
} while ($attempt -lt $maxAttempts)

if ($attempt -eq $maxAttempts) {
    Write-Host "    ❌ Port 5000 is still in use after $maxAttempts attempts" -ForegroundColor Red
    Write-Host "    Please check what's using the port manually" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Step 4: Start the server
Write-Host "[4/4] Starting Cliqpat server..." -ForegroundColor Yellow
Write-Host ""
Write-Host "Starting server... (Press Ctrl+C to stop)" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan

# Start the server
npm run dev

Write-Host ""
Write-Host "Server stopped. Press any key to exit..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
