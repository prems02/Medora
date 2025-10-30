const mongoose = require('mongoose');
const Appointment = require('./models/Appointment');
const Doctor = require('./models/Doctor');
const Patient = require('./models/Patient');

async function checkAIData() {
    try {
        await mongoose.connect('mongodb+srv://medora:medora@cluster0.ys8bf76.mongodb.net/medoraDB');
        console.log('✅ Connected to MongoDB');

        // Check all appointments with full details
        const allAppointments = await Appointment.find();
        console.log(`\n📊 Total appointments in database: ${allAppointments.length}`);

        allAppointments.forEach((apt, index) => {
            console.log(`\n${index + 1}. Appointment ID: ${apt._id}`);
            console.log(`   Status: ${apt.status}`);
            console.log(`   Doctor ID: ${apt.doctor || 'No doctor'}`);
            console.log(`   Patient ID: ${apt.patient || 'No patient'}`);
            console.log(`   Created: ${apt.createdAt}`);
            console.log(`   Updated: ${apt.updatedAt}`);

            // Check AI conversation report in detail
            if (apt.aiConversationReport) {
                console.log(`   🤖 AI Report Details:`);
                console.log(`      Status: ${apt.aiConversationReport.status}`);
                console.log(`      Has Transcript: ${!!apt.aiConversationReport.conversationTranscript}`);
                console.log(`      Has Generated Report: ${!!apt.aiConversationReport.generatedReport}`);
                console.log(`      Generated At: ${apt.aiConversationReport.generatedAt || 'Not set'}`);

                if (apt.aiConversationReport.conversationTranscript) {
                    console.log(`      📝 Transcript (first 200 chars):`);
                    console.log(`      "${apt.aiConversationReport.conversationTranscript.substring(0, 200)}..."`);
                }

                if (apt.aiConversationReport.generatedReport) {
                    console.log(`      📋 Generated Report (first 200 chars):`);
                    console.log(`      "${apt.aiConversationReport.generatedReport.substring(0, 200)}..."`);
                }
            } else {
                console.log(`   ❌ No AI conversation report found`);
            }
        });

        // Search for the specific appointment ID from webhook logs
        const webhookAppointment = await Appointment.findById('68aae39dcc54f7c1276b4e21');
        if (webhookAppointment) {
            console.log(`\n🎯 Found webhook appointment (68aae39dcc54f7c1276b4e21):`);
            console.log(`   Status: ${webhookAppointment.status}`);
            console.log(`   AI Report: ${JSON.stringify(webhookAppointment.aiConversationReport, null, 2)}`);
        } else {
            console.log(`\n❌ Webhook appointment (68aae39dcc54f7c1276b4e21) not found in database`);
        }

        // Check all collections for any AI-related data
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log(`\n📁 Available collections: ${collections.map(c => c.name).join(', ')}`);

        // Check database name
        console.log(`\n🗄️ Database name: ${mongoose.connection.db.databaseName}`);

        // List all databases
        const admin = mongoose.connection.db.admin();
        const databases = await admin.listDatabases();
        console.log(`\n🗄️ All databases: ${databases.databases.map(db => db.name).join(', ')}`);

        process.exit(0);

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

checkAIData();
