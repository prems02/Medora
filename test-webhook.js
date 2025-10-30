#!/usr/bin/env node

/**
 * Test script for ElevenLabs webhook functionality
 * This script tests conversation storage and AI report generation
 */

const mongoose = require('mongoose');
require('dotenv').config({ path: './config.env' });

// Import models
const Conversation = require('./models/AIReport');
const { generatePatientReport } = require('./services/aiService');

async function testWebhook() {
    try {
        console.log('🧪 Starting webhook functionality test...');

        // Connect to MongoDB
        console.log('📡 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://medora:medora@cluster0.ys8bf76.mongodb.net/medoraDB', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('✅ Connected to MongoDB successfully!');

        // Create test conversation data
        const testConversationData = {
            conversation_transcript: `Patient: Hello, I've been experiencing severe headaches for the past week, especially in the morning.

AI Doctor: I understand you've been having headaches for a week. Can you describe the pain - is it constant or comes and goes?

Patient: It comes and goes, but it's really bad when it happens. The pain is like a throbbing sensation, mostly on the right side of my head.

AI Doctor: Thank you for that information. On a scale of 1-10, how severe would you rate the pain?

Patient: I'd say it's about an 8 out of 10 when it's at its worst. It's really affecting my daily life.

AI Doctor: That sounds quite severe. Have you tried any medications or remedies for these headaches?

Patient: Yes, I've tried ibuprofen and acetaminophen, but they only provide temporary relief for about an hour or two.

AI Doctor: I see. Have you noticed any triggers? Things like stress, changes in sleep patterns, certain foods, or visual disturbances?

Patient: Now that you mention it, I have been under a lot of stress at work lately. I've also been getting less sleep - maybe 4-5 hours a night instead of my usual 7-8.

AI Doctor: Those are important factors. Have you experienced any nausea, vomiting, or sensitivity to light or sound with these headaches?

Patient: Yes! I do feel nauseous sometimes, and bright lights make it worse. I usually have to lie down in a dark room.

AI Doctor: Have you had headaches like this before, or is this the first time you're experiencing this pattern?

Patient: I've had occasional headaches before, but never this severe or frequent. This is definitely new for me.

AI Doctor: Do you have any family history of migraines or severe headaches?

Patient: My mother gets migraines, and my grandmother did too. I never thought about it being genetic.

AI Doctor: That's very helpful information. Based on what you've shared - the throbbing pain, nausea, light sensitivity, family history, and stress triggers - this sounds like it could be migraine headaches. However, given the severity and new onset, I strongly recommend you see a healthcare provider in person for proper evaluation and treatment. They may want to do some tests and can prescribe more effective migraine medications.`,

            appointment_id: 'test-appointment-' + Date.now(),
            patient_name: 'John Doe (Test)',
            call_duration: '8 minutes'
        };

        console.log('💾 Creating test conversation...');

        // Generate unique conversation ID
        const conversationId = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Store conversation in database
        const conversation = new Conversation({
            conversationId: conversationId,
            appointmentId: testConversationData.appointment_id,
            transcript: testConversationData.conversation_transcript,
            patientName: testConversationData.patient_name,
            callDuration: testConversationData.call_duration,
            webhookData: testConversationData,
            reportStatus: 'pending'
        });

        await conversation.save();
        console.log('✅ Test conversation stored with ID:', conversationId);
        console.log('🆔 Appointment ID:', testConversationData.appointment_id);

        // Test AI report generation
        console.log('🤖 Testing AI report generation...');

        const aiReportResult = await generatePatientReport(conversation.transcript, {
            patientName: conversation.patientName,
            appointmentId: conversation.appointmentId,
            callDuration: conversation.callDuration
        });

        if (aiReportResult && aiReportResult.success) {
            console.log('✅ AI report generated successfully!');

            // Update conversation with generated report
            conversation.generatedReport = aiReportResult.generatedReport;
            conversation.reportStatus = 'completed';
            conversation.reportGeneratedAt = new Date();
            await conversation.save();

            console.log('📊 Report preview (first 300 chars):');
            console.log(aiReportResult.generatedReport.substring(0, 300) + '...');

        } else {
            console.error('❌ AI report generation failed:', aiReportResult?.error || 'Unknown error');
        }

        // List all conversations in database
        console.log('\n📋 Current conversations in database:');
        const allConversations = await Conversation.find().sort({ createdAt: -1 }).limit(10);
        allConversations.forEach((conv, index) => {
            console.log(`${index + 1}. ID: ${conv.conversationId}`);
            console.log(`   Appointment: ${conv.appointmentId}`);
            console.log(`   Patient: ${conv.patientName}`);
            console.log(`   Status: ${conv.reportStatus}`);
            console.log(`   Created: ${conv.createdAt}`);
            console.log(`   Transcript length: ${conv.transcript?.length || 0} chars`);
            console.log('   ---');
        });

        console.log(`\n✅ Test completed successfully!`);
        console.log(`🎯 You can now test the "View AI Report" button with appointment ID: ${testConversationData.appointment_id}`);

        // Test webhook endpoint URL
        console.log(`\n🌐 Webhook endpoint for ElevenLabs:`);
        console.log(`   URL: http://localhost:5000/api/webhook/elevenlabs-conversation`);
        console.log(`   Method: POST`);
        console.log(`   Test URL: http://localhost:5000/api/webhook/test-conversation`);

    } catch (error) {
        console.error('❌ Test failed:', error);
        throw error;
    } finally {
        // Close database connection
        await mongoose.disconnect();
        console.log('📡 Disconnected from MongoDB');
    }
}

// Run the test
if (require.main === module) {
    testWebhook()
        .then(() => {
            console.log('✅ All tests passed!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Test failed:', error);
            process.exit(1);
        });
}

module.exports = { testWebhook };
