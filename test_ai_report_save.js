const AIReport = require('./models/AIReport');
const mongoose = require('mongoose');

async function testAIReportSave() {
    try {
        await mongoose.connect('mongodb://localhost:27017/cliqpat');
        console.log('✅ Connected to MongoDB');
        
        // Create a test AI Report
        const testReport = new AIReport({
            reportId: 'TEST_REPORT_123',
            conversationData: {
                transcript: 'Test conversation',
                rawWebhookData: { test: 'data' },
                timestamp: new Date(),
                source: 'Test'
            },
            patientInfo: {
                name: 'Test Patient',
                age: 30,
                gender: 'Male'
            },
            medicalData: {
                chiefComplaint: 'Test complaint',
                urgencyLevel: 'Medium'
            },
            status: 'received'
        });

        console.log('💾 Saving test AI Report...');
        const savedReport = await testReport.save();
        console.log('✅ Test AI Report saved with ID:', savedReport._id);
        console.log('✅ Report ID:', savedReport.reportId);

        // Verify it exists
        const foundReport = await AIReport.findById(savedReport._id);
        if (foundReport) {
            console.log('✅ Verification successful - Test report found in database');
        } else {
            console.log('❌ Verification failed - Test report not found');
        }

        // Check total count
        const count = await AIReport.countDocuments();
        console.log(`📊 Total AI Reports in database: ${count}`);

        // Clean up test data
        await AIReport.findByIdAndDelete(savedReport._id);
        console.log('🗑️ Test report cleaned up');

        process.exit(0);
        
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

testAIReportSave();
