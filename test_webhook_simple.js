const http = require('http');

const data = JSON.stringify({
    consultation_summary: "Patient Consultation Summary for Appointment #68ab148eb4cac543c8524078: Patient Information: Name: John Doe, Age: 35 years old, Gender: Male. Chief Complaint: Persistent headaches for the past 3 days. Symptoms: Throbbing pain in forehead area, Severity: 6-7/10, Nausea, Light sensitivity, Dizziness when standing quickly. Duration: 3 days. Medical History: No significant past medical history, Generally healthy. Current Medications: Ibuprofen, Acetaminophen - providing minimal relief. Allergies: No known allergies. Additional Notes: Symptoms affecting work performance, Pain progressively worsening. Urgency Level: Medium."
});

const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/webhook/elevenlabs-conversation',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

console.log('🚀 Sending webhook data...');

const req = http.request(options, (res) => {
    console.log(`✅ Status: ${res.statusCode}`);
    console.log(`📋 Headers:`, res.headers);
    
    let responseData = '';
    res.on('data', (chunk) => {
        responseData += chunk;
    });
    
    res.on('end', () => {
        console.log('📝 Response:', responseData);
    });
});

req.on('error', (error) => {
    console.error('❌ Error:', error);
});

req.write(data);
req.end();
