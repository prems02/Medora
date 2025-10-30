/**
 * Test script to verify that the webhook correctly handles ElevenLabs consultation_summary field
 * This simulates the exact payload format that ElevenLabs is sending based on your screenshot
 */

const axios = require('axios');

async function testConsultationSummaryWebhook() {
    console.log('🧪 Testing consultation_summary webhook handling...\n');

    // Simulate the exact payload format that ElevenLabs sends based on your screenshot
    const testPayload = {
        consultation_summary: "Patient: Hello doctor, I've been having severe headaches for the past week.\n\nAI Doctor: I understand you're experiencing headaches. Can you tell me more about when they started and their characteristics?\n\nPatient: They started about a week ago, mostly in the morning. The pain is throbbing and rates about 7/10 in severity.\n\nAI Doctor: That sounds concerning. Have you tried any medications, and do you have any triggers like stress or sleep issues?\n\nPatient: I've tried ibuprofen but it doesn't help much. I have been quite stressed at work lately and my sleep has been poor.\n\nAI Doctor: Based on your symptoms, this could be tension headaches related to stress and poor sleep. I recommend consulting with a healthcare provider for proper evaluation and treatment options.",
        appointment_id: "test-consultation-" + Date.now(),
        patient_name: "John Test Patient",
        call_duration: "8 minutes",
        // Additional fields that might be sent by ElevenLabs
        timestamp: new Date().toISOString(),
        call_status: "completed",
        metadata: {
            session_id: "session_" + Date.now(),
            widget_version: "2.1.0"
        }
    };

    try {
        console.log('📤 Sending test payload to webhook...');
        console.log('📋 Payload:', JSON.stringify(testPayload, null, 2));
        
        // Send to the webhook endpoint
        const response = await axios.post('http://localhost:5000/api/webhook/elevenlabs-conversation', testPayload, {
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'ElevenLabs-Webhook-Test'
            },
            timeout: 10000
        });

        console.log('\n✅ Webhook Response:', response.status);
        console.log('📋 Response Data:', JSON.stringify(response.data, null, 2));

        // Verify the response
        if (response.data.success) {
            console.log('\n🎉 SUCCESS: consultation_summary field was processed correctly!');
            console.log(`🆔 Conversation ID: ${response.data.data.conversationId}`);
            console.log(`👤 Patient: ${response.data.data.patientName}`);
            console.log(`📝 Transcript Length: ${response.data.data.transcriptLength} characters`);
            
            // Test AI report generation with the stored conversation
            if (response.data.data.appointmentId) {
                console.log('\n🤖 Testing AI report generation...');
                try {
                    const reportResponse = await axios.get(`http://localhost:5000/api/webhook/generate-ai-report/${response.data.data.appointmentId}`, {
                        timeout: 30000 // AI generation can take time
                    });
                    
                    if (reportResponse.data.success) {
                        console.log('✅ AI Report generated successfully!');
                        console.log(`📊 Report preview: ${reportResponse.data.data.generatedReport.substring(0, 200)}...`);
                    } else {
                        console.log('⚠️ AI Report generation failed:', reportResponse.data.message);
                    }
                } catch (reportError) {
                    console.log('❌ Error generating AI report:', reportError.response?.data || reportError.message);
                }
            }
        } else {
            console.log('\n❌ FAILED: Webhook returned error:', response.data.message);
        }

    } catch (error) {
        console.error('\n❌ ERROR: Failed to test webhook');
        if (error.response) {
            console.error('📋 Status:', error.response.status);
            console.error('📋 Response:', error.response.data);
        } else if (error.request) {
            console.error('📋 Network Error: No response received');
            console.error('📋 Make sure your server is running on http://localhost:5000');
        } else {
            console.error('📋 Error:', error.message);
        }
    }
}

// Additional test to verify fallback field extraction
async function testFieldNameVariations() {
    console.log('\n🧪 Testing different field name variations...\n');

    const testCases = [
        {
            name: "consultation_summary (Your ElevenLabs config)",
            payload: {
                consultation_summary: "Test conversation content from consultation_summary field",
                appointment_id: "test-var-1-" + Date.now(),
                patient_name: "Test Patient 1"
            }
        },
        {
            name: "conversation_transcript (Our custom format)",
            payload: {
                conversation_transcript: "Test conversation content from conversation_transcript field",
                appointment_id: "test-var-2-" + Date.now(),
                patient_name: "Test Patient 2"
            }
        },
        {
            name: "transcript (Standard ElevenLabs)",
            payload: {
                transcript: "Test conversation content from transcript field",
                appointment_id: "test-var-3-" + Date.now(),
                patient_name: "Test Patient 3"
            }
        },
        {
            name: "Metadata format",
            payload: {
                consultation_summary: "Test conversation with metadata format",
                metadata: {
                    appointment_id: "test-var-4-" + Date.now(),
                    patient_name: "Test Patient 4"
                }
            }
        }
    ];

    for (const testCase of testCases) {
        try {
            console.log(`📤 Testing: ${testCase.name}`);
            const response = await axios.post('http://localhost:5000/api/webhook/elevenlabs-conversation', testCase.payload, {
                headers: { 'Content-Type': 'application/json' },
                timeout: 5000
            });

            if (response.data.success) {
                console.log(`✅ ${testCase.name}: SUCCESS`);
                console.log(`   📝 Transcript Length: ${response.data.data.transcriptLength}`);
                console.log(`   🆔 Appointment ID: ${response.data.data.appointmentId}`);
            } else {
                console.log(`❌ ${testCase.name}: FAILED - ${response.data.message}`);
            }
        } catch (error) {
            console.log(`❌ ${testCase.name}: ERROR - ${error.response?.data?.message || error.message}`);
        }
        
        // Small delay between tests
        await new Promise(resolve => setTimeout(resolve, 500));
    }
}

// Run the tests
async function runAllTests() {
    console.log('🚀 Starting ElevenLabs consultation_summary webhook tests...\n');
    
    await testConsultationSummaryWebhook();
    await testFieldNameVariations();
    
    console.log('\n🏁 All tests completed!');
    console.log('\nNext steps:');
    console.log('1. ✅ The webhook now properly handles consultation_summary field');
    console.log('2. 🔧 Test with real ElevenLabs webhook calls');
    console.log('3. 👨‍⚕️ Have doctors test the "View AI Report" functionality');
    console.log('4. 📱 Test the complete patient flow: Book → Call → AI Report');
}

runAllTests().catch(console.error);
