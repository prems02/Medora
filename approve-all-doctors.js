// Script to approve doctors in all databases
const mongoose = require('mongoose');
require('dotenv').config({ path: './config.env' });

async function approveAllDoctors() {
    try {
        console.log('🔗 Connecting to MongoDB...');

        // Connect to default database
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected successfully!');

        // Define doctor schema (minimal for this operation)
        const DoctorSchema = new mongoose.Schema({}, { collection: 'doctors', strict: false });

        // Get list of all databases
        const adminDb = mongoose.connection.client.db('admin');
        const databases = await adminDb.admin().listDatabases();

        console.log('\n🔄 Checking and approving doctors in all databases...\n');

        for (const dbInfo of databases.databases) {
            if (dbInfo.name === 'admin' || dbInfo.name === 'local' || dbInfo.name === 'config') {
                continue; // Skip system databases
            }

            console.log(`📊 Checking database: ${dbInfo.name}`);

            const db = mongoose.connection.client.db(dbInfo.name);
            const collections = await db.listCollections().toArray();

            // Check if doctors collection exists
            const doctorsCollection = collections.find(col => col.name === 'doctors');
            if (!doctorsCollection) {
                console.log('   ❌ No doctors collection found');
                continue;
            }

            const doctorsCol = db.collection('doctors');

            // Find all doctors
            const doctors = await doctorsCol.find({}).toArray();
            console.log(`   👨‍⚕️ Found ${doctors.length} doctors`);

            if (doctors.length === 0) {
                continue;
            }

            // Show current doctors
            doctors.forEach((doctor, index) => {
                console.log(`      ${index + 1}. ${doctor.firstName} ${doctor.lastName}`);
                console.log(`         📧 ${doctor.email}`);
                console.log(`         ✅ Status: ${doctor.verificationStatus || 'pending'}`);
                console.log(`         🔐 Verified: ${doctor.isVerified ? 'Yes' : 'No'}`);
            });

            // Update all doctors to approved status
            const result = await doctorsCol.updateMany(
                {
                    $or: [
                        { verificationStatus: { $ne: 'approved' } },
                        { isVerified: { $ne: true } }
                    ]
                },
                {
                    $set: {
                        verificationStatus: 'approved',
                        isVerified: true,
                        updatedAt: new Date()
                    }
                }
            );

            console.log(`   ✅ Updated ${result.modifiedCount} doctors to approved status\n`);
        }

        console.log('🎉 All doctors have been approved across all databases!');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

approveAllDoctors();
