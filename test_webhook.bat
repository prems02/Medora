@echo off
echo 🧪 Testing ElevenLabs Webhook...
echo.

REM Test using PowerShell
powershell -ExecutionPolicy Bypass -File test_webhook.ps1

echo.
echo ✅ Test completed!
echo 🌐 Open http://localhost:5000/doctor-dashboard.html to see the results
pause
