// Script to check MongoDB databases and collections
const mongoose = require('mongoose');
require('dotenv').config({ path: './config.env' });

async function checkDatabase() {
    try {
        console.log('🔗 Connecting to MongoDB...');
        console.log('📍 Connection URI:', process.env.MONGODB_URI?.replace(/:[^:@]*@/, ':***@'));

        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected successfully!');

        // Get database name
        const dbName = mongoose.connection.name;
        console.log(`📊 Current database: ${dbName}`);

        // List all collections
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log(`\n📂 Collections in '${dbName}' database:`);

        if (collections.length === 0) {
            console.log('   No collections found.');
        } else {
            for (const collection of collections) {
                console.log(`   📁 ${collection.name}`);

                // Count documents in each collection
                const count = await mongoose.connection.db.collection(collection.name).countDocuments();
                console.log(`      📊 Document count: ${count}`);

                if (collection.name === 'doctors' && count > 0) {
                    // Show doctor details
                    const doctors = await mongoose.connection.db.collection('doctors').find({}).toArray();
                    console.log(`      👨‍⚕️ Doctors in collection:`);
                    doctors.forEach((doctor, index) => {
                        console.log(`         ${index + 1}. ${doctor.firstName} ${doctor.lastName}`);
                        console.log(`            📧 ${doctor.email}`);
                        console.log(`            ⏰ Created: ${new Date(doctor.createdAt).toLocaleString()}`);
                        console.log(`            ✅ Status: ${doctor.verificationStatus}`);
                    });
                }
            }
        }

        // Also check if there are doctors in the default database (test)
        console.log('\n🔍 Checking for data in other common database names...');

        const adminDb = mongoose.connection.client.db('admin');
        const databases = await adminDb.admin().listDatabases();

        console.log('\n📊 All databases on this MongoDB cluster:');
        for (const db of databases.databases) {
            console.log(`   📁 ${db.name} (${(db.sizeOnDisk / (1024*1024)).toFixed(2)} MB)`);

            if (db.name === 'test' || db.name.includes('cliq')) {
                const testDb = mongoose.connection.client.db(db.name);
                const testCollections = await testDb.listCollections().toArray();

                if (testCollections.length > 0) {
                    console.log(`      Collections in ${db.name}:`);
                    for (const col of testCollections) {
                        const docCount = await testDb.collection(col.name).countDocuments();
                        console.log(`         📁 ${col.name} (${docCount} docs)`);

                        if (col.name === 'doctors' && docCount > 0) {
                            const doctors = await testDb.collection('doctors').find({}).toArray();
                            console.log(`            👨‍⚕️ Recent doctors:`);
                            doctors.slice(-3).forEach((doctor, index) => {
                                console.log(`               ${index + 1}. ${doctor.firstName} ${doctor.lastName} (${doctor.email})`);
                            });
                        }
                    }
                }
            }
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('\n🔌 Disconnected from MongoDB');
        process.exit(0);
    }
}

checkDatabase();
