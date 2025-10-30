// Script to check doctor credentials and test login
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: './config.env' });

async function checkCredentials() {
    try {
        console.log('🔗 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected successfully!');

        const Doctor = require('./models/Doctor');

        // Get all doctors
        const doctors = await Doctor.find({});
        console.log(`\n👨‍⚕️ Found ${doctors.length} doctors in database:\n`);

        for (let i = 0; i < doctors.length; i++) {
            const doctor = doctors[i];
            console.log(`${i + 1}. Dr. ${doctor.firstName} ${doctor.lastName}`);
            console.log(`   📧 Email: ${doctor.email}`);
            console.log(`   ✅ Status: ${doctor.verificationStatus}`);
            console.log(`   🔐 Verified: ${doctor.isVerified ? 'Yes' : 'No'}`);
            console.log(`   🔑 Password Hash: ${doctor.password.substring(0, 20)}...`);

            // Test password comparison for known passwords
            const testPasswords = ['Blackdevil@442', 'blackdevil@442', '123456', 'password123'];

            for (const testPassword of testPasswords) {
                try {
                    const isMatch = await doctor.comparePassword(testPassword);
                    if (isMatch) {
                        console.log(`   ✅ Password matches: "${testPassword}"`);
                        break;
                    }
                } catch (error) {
                    console.log(`   ❌ Error testing password "${testPassword}":`, error.message);
                }
            }
            console.log('');
        }

        // Test login for doctor1@gmail.com with different passwords
        console.log('\n🧪 Testing login for doctor1@gmail.com...');
        const testDoctor = await Doctor.findOne({ email: 'doctor1@gmail.com' });

        if (testDoctor) {
            const testPasswords = ['Blackdevil@442', 'blackdevil@442', '123456'];

            for (const testPassword of testPasswords) {
                try {
                    const isValid = await testDoctor.comparePassword(testPassword);
                    console.log(`🔑 Password "${testPassword}": ${isValid ? '✅ VALID' : '❌ Invalid'}`);
                } catch (error) {
                    console.log(`🔑 Password "${testPassword}": ❌ Error - ${error.message}`);
                }
            }

            // If no password works, let's reset it to a known value
            console.log('\n🔧 Setting a known password for testing...');
            testDoctor.password = 'TestPassword123';
            await testDoctor.save();
            console.log('✅ Password reset to: TestPassword123');

            // Verify the new password works
            const newPasswordWorks = await testDoctor.comparePassword('TestPassword123');
            console.log(`🧪 New password test: ${newPasswordWorks ? '✅ WORKS' : '❌ Failed'}`);

        } else {
            console.log('❌ Doctor not found with email doctor1@gmail.com');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

checkCredentials();
