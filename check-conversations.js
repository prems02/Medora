/**
 * Quick script to check what conversations are stored in the database
 */

const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect('mongodb+srv://medora:medora@cluster0.ys8bf76.mongodb.net/medoraDB', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// Define the AIReport model (conversations are stored here)
const AIReportSchema = new mongoose.Schema({
    conversationId: String,
    appointmentId: String,
    transcript: String,
    patientName: String,
    callDuration: String,
    webhookData: Object,
    reportStatus: String,
    generatedReport: String,
    reportGeneratedAt: Date,
    createdAt: { type: Date, default: Date.now }
}, { strict: false });

const AIReport = mongoose.model('AIReport', AIReportSchema, 'aireports');

async function checkConversations() {
    try {
        console.log('🔍 Checking for stored conversations...\n');

        // Get all conversations sorted by most recent first
        const conversations = await AIReport.find().sort({ createdAt: -1 }).limit(10);

        if (conversations.length === 0) {
            console.log('❌ No conversations found in database');
            console.log('');
            console.log('This means either:');
            console.log('1. ElevenLabs webhook is not sending data');
            console.log('2. The webhook endpoint is not being called');
            console.log('3. There\'s an error in conversation storage');
            console.log('');
            console.log('💡 Try using the manual test page: http://localhost:5000/frontend/manual-capture-test.html');
        } else {
            console.log(`✅ Found ${conversations.length} conversations:\n`);

            conversations.forEach((conv, index) => {
                console.log(`${index + 1}. Conversation ID: ${conv.conversationId || 'N/A'}`);
                console.log(`   Appointment ID: ${conv.appointmentId || 'N/A'}`);
                console.log(`   Patient: ${conv.patientName || 'N/A'}`);
                console.log(`   Status: ${conv.reportStatus || 'N/A'}`);
                console.log(`   Duration: ${conv.callDuration || 'N/A'}`);
                console.log(`   Created: ${conv.createdAt ? conv.createdAt.toLocaleString() : 'N/A'}`);
                console.log(`   Transcript: ${conv.transcript ? (conv.transcript.substring(0, 100) + '...') : 'No transcript'}`);
                console.log(`   Source: ${conv.webhookData?.source || 'Unknown'}`);
                console.log('   ---');
            });

            console.log('\n🎯 Recent conversation details:');
            if (conversations[0]) {
                const latest = conversations[0];
                console.log('Latest conversation:');
                console.log('- Appointment ID:', latest.appointmentId);
                console.log('- Patient Name:', latest.patientName);
                console.log('- Report Status:', latest.reportStatus);
                console.log('- Has AI Report:', !!latest.generatedReport);
                console.log('- Webhook Data Keys:', Object.keys(latest.webhookData || {}));
                console.log('- Full Transcript Length:', latest.transcript ? latest.transcript.length : 0);
            }
        }

        // Also check for specific appointment ID from your logs
        console.log('\n🔍 Checking for appointment "011" or "68ab650ecdbb94d4c9c318cc":');
        const specificConvs = await AIReport.find({
            $or: [
                { appointmentId: '011' },
                { appointmentId: '68ab650ecdbb94d4c9c318cc' }
            ]
        });

        if (specificConvs.length > 0) {
            console.log(`✅ Found ${specificConvs.length} conversations for your test appointment:`);
            specificConvs.forEach(conv => {
                console.log(`- ${conv.appointmentId}: ${conv.patientName} (${conv.reportStatus})`);
            });
        } else {
            console.log('❌ No conversations found for appointment "011" or "68ab650ecdbb94d4c9c318cc"');
        }

        console.log('\n✅ Database check complete');

    } catch (error) {
        console.error('❌ Error checking conversations:', error);
    } finally {
        mongoose.connection.close();
    }
}

checkConversations();
