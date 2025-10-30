// Script to migrate doctors from test database to cliqpat database
const mongoose = require('mongoose');
require('dotenv').config({ path: './config.env' });

async function migrateDoctors() {
    try {
        console.log('🔗 Connecting to MongoDB...');
        
        // First connect to get the client
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected successfully!');
        
        const client = mongoose.connection.client;
        
        // Connect to both databases
        const testDb = client.db('test');
        const cliqpatDb = client.db('cliqpat');
        
        console.log('\n📊 Checking doctors in test database...');
        
        // Get doctors from test database
        const testDoctors = await testDb.collection('doctors').find({}).toArray();
        console.log(`Found ${testDoctors.length} doctors in test database`);
        
        if (testDoctors.length === 0) {
            console.log('✅ No doctors to migrate from test database');
            return;
        }
        
        // Show doctors in test database
        console.log('\n👨‍⚕️ Doctors in test database:');
        testDoctors.forEach((doctor, index) => {
            console.log(`   ${index + 1}. Dr. ${doctor.firstName} ${doctor.lastName}`);
            console.log(`      📧 ${doctor.email}`);
            console.log(`      ⏰ Created: ${new Date(doctor.createdAt).toLocaleString()}`);
            console.log(`      ✅ Status: ${doctor.verificationStatus || 'pending'}`);
        });
        
        console.log('\n🔄 Migrating doctors to cliqpat database...');
        
        // Check for existing doctors in cliqpat to avoid duplicates
        const existingDoctors = await cliqpatDb.collection('doctors').find({}).toArray();
        const existingEmails = existingDoctors.map(doc => doc.email);
        
        console.log(`📧 Existing emails in cliqpat: ${existingEmails.join(', ')}`);
        
        // Filter out duplicates and ensure all are approved
        const doctorsToMigrate = testDoctors
            .filter(doctor => !existingEmails.includes(doctor.email))
            .map(doctor => ({
                ...doctor,
                verificationStatus: 'approved',
                isVerified: true,
                updatedAt: new Date()
            }));
        
        if (doctorsToMigrate.length === 0) {
            console.log('✅ All doctors already exist in cliqpat database');
        } else {
            // Insert doctors into cliqpat database
            const result = await cliqpatDb.collection('doctors').insertMany(doctorsToMigrate);
            console.log(`✅ Successfully migrated ${result.insertedCount} doctors to cliqpat database!`);
            
            // List final state
            console.log('\n📋 Final state in cliqpat database:');
            const finalDoctors = await cliqpatDb.collection('doctors').find({}).toArray();
            finalDoctors.forEach((doctor, index) => {
                console.log(`   ${index + 1}. Dr. ${doctor.firstName} ${doctor.lastName}`);
                console.log(`      📧 ${doctor.email}`);
                console.log(`      ✅ Status: ${doctor.verificationStatus}`);
                console.log(`      🔐 Verified: ${doctor.isVerified ? 'Yes' : 'No'}`);
            });
        }
        
    } catch (error) {
        console.error('❌ Migration error:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('\n🔌 Disconnected from MongoDB');
        process.exit(0);
    }
}

migrateDoctors();
