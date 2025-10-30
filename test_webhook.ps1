# PowerShell script to test ElevenLabs webhook
Write-Host "🧪 Testing ElevenLabs Webhook..." -ForegroundColor Cyan

# Test data - ONLY 1 PARAMETER NEEDED! 🎉
$testData = @{
    consultation_summary = "Patient Consultation Summary for Appointment #2:`n`nPatient Information:`n- Name: John Doe`n- Age: 35 years old`n- Gender: Male`n`nChief Complaint:`nPersistent headaches for the past 3 days`n`nSymptoms:`n- Throbbing pain in forehead area`n- Severity: 6-7/10`n- Nausea`n- Light sensitivity (photophobia)`n- Dizziness when standing quickly`n`nDuration: 3 days`n`nTrigger/Onset:`nStarted after working long hours on computer (12-14 hours daily for past week)`n`nMedical History:`n- No significant past medical history`n- Generally healthy`n- No previous surgeries or chronic conditions`n`nCurrent Medications:`n- Ibuprofen (over-the-counter)`n- Acetaminophen (over-the-counter)`n- Note: Pain relievers providing minimal relief`n`nAllergies:`n- No known allergies to medications, foods, or other substances`n`nSelf-Care Attempts:`n- Resting in dark room`n- Increased water intake`n- Over-the-counter pain medications`n- Limited effectiveness of all interventions`n`nAdditional Notes:`n- Symptoms are affecting work performance`n- Pain is progressively worsening`n- Patient seeking medical evaluation due to lack of improvement with self-care`n`nUrgency Level: Medium - Persistent symptoms requiring medical evaluation`n`nRecommendations:`n- Medical evaluation by Dr. Smith`n- Consider neurological assessment`n- Evaluate for tension headaches vs. other causes`n- Review ergonomic factors and screen time"
}

$jsonData = $testData | ConvertTo-Json

Write-Host "📤 Sending webhook request..." -ForegroundColor Yellow

# Send POST request to webhook
$response = Invoke-RestMethod -Uri "http://localhost:5000/api/webhook/elevenlabs-conversation" -Method Post -Body $jsonData -ContentType "application/json"

Write-Host "✅ Webhook Response:" -ForegroundColor Green
$response | ConvertTo-Json -Depth 3 | Write-Host

Write-Host "`n⏳ Waiting 5 seconds for AI processing..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

Write-Host "🔍 Checking AI report status..." -ForegroundColor Cyan
$reportResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/webhook/ai-report/2" -Method Get

$status = $reportResponse.data.aiReport.status
Write-Host "📊 AI Report Status: $status" -ForegroundColor Magenta

Write-Host "`n🌐 Open your doctor dashboard at: http://localhost:5000/doctor-dashboard.html" -ForegroundColor Cyan
Write-Host "👀 Look for Patient #2 - the AI Report button should now be green!" -ForegroundColor Green
