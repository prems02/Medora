// Script to verify/approve doctors for testing
const mongoose = require('mongoose');
require('dotenv').config({ path: './config.env' });

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
.then(() => {
    console.log('✅ Connected to MongoDB successfully!');
    verifyAllDoctors();
})
.catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
});

const Doctor = require('./models/Doctor');

async function verifyAllDoctors() {
    try {
        console.log('🔍 Finding all pending doctors...');

        // Find all doctors with pending verification
        const pendingDoctors = await Doctor.find({
            verificationStatus: { $ne: 'approved' }
        });

        console.log(`Found ${pendingDoctors.length} doctors needing verification`);

        if (pendingDoctors.length === 0) {
            console.log('✅ All doctors are already verified!');
            process.exit(0);
        }

        // Update all doctors to approved status
        const result = await Doctor.updateMany(
            { verificationStatus: { $ne: 'approved' } },
            {
                $set: {
                    verificationStatus: 'approved',
                    isVerified: true,
                    updatedAt: new Date()
                }
            }
        );

        console.log(`✅ Successfully approved ${result.modifiedCount} doctors!`);

        // List all doctors with their status
        const allDoctors = await Doctor.find({}, 'firstName lastName email verificationStatus isVerified');

        console.log('\n📋 All Doctors:');
        allDoctors.forEach((doctor, index) => {
            console.log(`${index + 1}. Dr. ${doctor.firstName} ${doctor.lastName}`);
            console.log(`   📧 Email: ${doctor.email}`);
            console.log(`   ✅ Status: ${doctor.verificationStatus}`);
            console.log(`   🔐 Verified: ${doctor.isVerified ? 'Yes' : 'No'}`);
            console.log('');
        });

        process.exit(0);

    } catch (error) {
        console.error('❌ Error verifying doctors:', error);
        process.exit(1);
    }
}
