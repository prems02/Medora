Write-Host "Testing ElevenLabs Webhook..." -ForegroundColor Cyan

$testData = @{
    consultation_summary = "Patient Consultation Summary for Appointment #68aae39dcc54f7c1276b4e21: Patient Information: Name: John Doe, Age: 35 years old, Gender: Male. Chief Complaint: Persistent headaches for the past 3 days. Symptoms: Throbbing pain in forehead area, Severity: 6-7/10, Nausea, Light sensitivity, Dizziness when standing quickly. Duration: 3 days. Medical History: No significant past medical history, Generally healthy. Current Medications: Ibuprofen, Acetaminophen - providing minimal relief. Allergies: No known allergies. Additional Notes: Symptoms affecting work performance, Pain progressively worsening. Urgency Level: Medium."
}

$jsonData = $testData | ConvertTo-Json

Write-Host "Sending webhook request..." -ForegroundColor Yellow

try {
    $response = Invoke-RestMethod -Uri "http://localhost:5000/api/webhook/elevenlabs-conversation" -Method Post -Body $jsonData -ContentType "application/json"
    
    Write-Host "Webhook Response:" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 3 | Write-Host
    
    Write-Host "Waiting 5 seconds for AI processing..." -ForegroundColor Yellow
    Start-Sleep -Seconds 5
    
    Write-Host "Checking AI report status..." -ForegroundColor Cyan
    $reportResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/webhook/ai-report/68aae39dcc54f7c1276b4e21" -Method Get
    
    $status = $reportResponse.data.aiReport.status
    Write-Host "AI Report Status: $status" -ForegroundColor Magenta
    
    Write-Host "Open doctor dashboard at: http://localhost:5000/doctor-dashboard.html" -ForegroundColor Green
    
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}
