const mongoose = require('mongoose');

async function checkDatabase() {
    try {
        await mongoose.connect('mongodb+srv://medora:medora@cluster0.ys8bf76.mongodb.net/medoraDB');
        console.log('✅ Connected to MongoDB');

        const db = mongoose.connection.db;
        const aiReports = db.collection('ai_reports');
        const count = await aiReports.countDocuments();
        console.log('📊 AI Reports count:', count);

        if (count > 0) {
            const docs = await aiReports.find().sort({createdAt: -1}).toArray();
            docs.forEach((doc, i) => {
                console.log(`${i+1}. Report: ${doc.reportId}`);
                console.log(`   Status: ${doc.status}`);
                console.log(`   Created: ${doc.createdAt}`);
                console.log(`   Patient: ${doc.patientInfo?.name || 'Unknown'}`);
                console.log('---');
            });
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

checkDatabase();
