const AIReport = require('./models/AIReport');
const mongoose = require('mongoose');

async function checkAIReports() {
    try {
        await mongoose.connect('mongodb://localhost:27017/cliqpat');
        console.log('✅ Connected to MongoDB');

        // Check using Mongoose model
        const count = await AIReport.countDocuments();
        console.log(`\n📊 Total AI Reports (Mongoose): ${count}`);

        // Check raw collection
        const db = mongoose.connection.db;
        const collection = db.collection('ai_reports');
        const rawCount = await collection.countDocuments();
        console.log(`📊 Total AI Reports (Raw): ${rawCount}`);

        if (rawCount > 0) {
            const rawDocs = await collection.find().toArray();
            console.log('\n🔍 Raw Documents:');
            rawDocs.forEach((doc, index) => {
                console.log(`${index + 1}. ID: ${doc._id}`);
                console.log(`   Report ID: ${doc.reportId}`);
                console.log(`   Status: ${doc.status}`);
                console.log(`   Patient: ${doc.patientInfo?.name || 'Unknown'}`);
            });
        }

        const reports = await AIReport.find().sort({ createdAt: -1 });

        console.log('\n🤖 All AI Reports (Mongoose):');
        reports.forEach((report, index) => {
            console.log(`\n${index + 1}. Report ID: ${report.reportId}`);
            console.log(`   Status: ${report.status}`);
            console.log(`   Patient: ${report.patientInfo?.name || 'Unknown'} (${report.patientInfo?.age || 'Unknown'} years old)`);
            console.log(`   Chief Complaint: ${report.medicalData?.chiefComplaint || 'Not extracted'}`);
            console.log(`   Urgency: ${report.medicalData?.urgencyLevel || 'Not set'}`);
            console.log(`   Created: ${report.createdAt}`);
            console.log(`   Temp File: ${report.tempFiles?.jsonFilePath || 'No file'}`);

            if (report.aiGeneratedReports?.summaryReport) {
                console.log(`   AI Report Generated: ✅`);
                console.log(`   Report Preview: ${report.aiGeneratedReports.summaryReport.substring(0, 100)}...`);
            } else {
                console.log(`   AI Report Generated: ❌`);
            }
        });

        process.exit(0);

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

checkAIReports();
