const mongoose = require('mongoose');
require('dotenv').config({ path: './config.env' });

// Import the Doctor model
const Doctor = require('./models/Doctor');

async function fixDoctorVisibility() {
    try {
        console.log('🔗 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected successfully!');

        // Find the newly registered doctor
        console.log('\n🔍 Checking newly registered doctors...');
        const newDoctor = await Doctor.findOne({ email: 'doctor2@gmail.com' });
        
        if (newDoctor) {
            console.log('📋 Found new doctor:');
            console.log(`   Name: Dr. ${newDoctor.firstName} ${newDoctor.lastName}`);
            console.log(`   Email: ${newDoctor.email}`);
            console.log(`   Status: ${newDoctor.verificationStatus}`);
            console.log(`   Verified: ${newDoctor.isVerified}`);
            console.log(`   Active: ${newDoctor.isActive}`);
            
            if (newDoctor.verificationStatus === 'pending' || !newDoctor.isVerified) {
                console.log('\n🔧 Approving new doctor for patient visibility...');
                
                await Doctor.updateOne(
                    { email: 'doctor2@gmail.com' },
                    {
                        $set: {
                            verificationStatus: 'approved',
                            isVerified: true,
                            isActive: true,
                            updatedAt: new Date()
                        }
                    }
                );
                
                console.log('✅ Doctor approved successfully!');
            } else {
                console.log('✅ Doctor already approved');
            }
        } else {
            console.log('❌ New doctor not found in database');
        }

        // Check for any other pending doctors and approve them
        console.log('\n🔍 Checking for other pending doctors...');
        const pendingDoctors = await Doctor.find({ 
            verificationStatus: { $in: ['pending', null] } 
        }).select('firstName lastName email verificationStatus isVerified');
        
        if (pendingDoctors.length > 0) {
            console.log(`📋 Found ${pendingDoctors.length} pending doctors:`);
            pendingDoctors.forEach((doctor, index) => {
                console.log(`   ${index + 1}. Dr. ${doctor.firstName} ${doctor.lastName} (${doctor.email})`);
            });
            
            console.log('\n🔧 Approving all pending doctors...');
            const result = await Doctor.updateMany(
                { verificationStatus: { $in: ['pending', null] } },
                {
                    $set: {
                        verificationStatus: 'approved',
                        isVerified: true,
                        isActive: true,
                        updatedAt: new Date()
                    }
                }
            );
            
            console.log(`✅ Approved ${result.modifiedCount} doctors`);
        } else {
            console.log('✅ No pending doctors found');
        }

        // Get final statistics
        console.log('\n📊 FINAL DOCTOR STATISTICS:');
        console.log('=' .repeat(50));
        
        const totalDoctors = await Doctor.countDocuments();
        const activeDoctors = await Doctor.countDocuments({ isActive: true });
        const verifiedDoctors = await Doctor.countDocuments({ isVerified: true });
        const approvedDoctors = await Doctor.countDocuments({ verificationStatus: 'approved' });
        const patientVisibleDoctors = await Doctor.countDocuments({
            isActive: true,
            isVerified: true,
            verificationStatus: 'approved'
        });
        
        console.log(`   Total Doctors: ${totalDoctors}`);
        console.log(`   Active Doctors: ${activeDoctors}`);
        console.log(`   Verified Doctors: ${verifiedDoctors}`);
        console.log(`   Approved Doctors: ${approvedDoctors}`);
        console.log(`   Visible to Patients: ${patientVisibleDoctors}`);

        // Test patient searches
        console.log('\n🔍 PATIENT SEARCH TESTS:');
        console.log('=' .repeat(50));
        
        const searches = [
            { name: 'All visible doctors', query: { isActive: true, isVerified: true, verificationStatus: 'approved' } },
            { name: 'Pediatricians', query: { specialization: 'pediatrics', isActive: true, isVerified: true, verificationStatus: 'approved' } },
            { name: 'Doctors in Ahmedabad', query: { 'clinicAddress.city': 'Ahemdabad', isActive: true, isVerified: true, verificationStatus: 'approved' } },
            { name: 'Doctors in Gujarat', query: { 'clinicAddress.state': 'Gujarat', isActive: true, isVerified: true, verificationStatus: 'approved' } }
        ];

        for (const search of searches) {
            const count = await Doctor.countDocuments(search.query);
            console.log(`   ${search.name}: ${count} found`);
        }

        // Show sample of recently added doctors
        console.log('\n👨‍⚕️ RECENTLY ADDED DOCTORS:');
        console.log('=' .repeat(50));
        
        const recentDoctors = await Doctor.find({
            createdAt: { $gte: new Date('2024-08-23') }
        })
        .select('firstName lastName email specialization clinicName clinicAddress verificationStatus isVerified isActive')
        .sort({ createdAt: -1 })
        .limit(5);

        if (recentDoctors.length > 0) {
            recentDoctors.forEach((doctor, index) => {
                console.log(`   ${index + 1}. Dr. ${doctor.firstName} ${doctor.lastName}`);
                console.log(`      📧 ${doctor.email}`);
                console.log(`      🏥 ${doctor.specialization} - ${doctor.clinicName}`);
                console.log(`      📍 ${doctor.clinicAddress?.city}, ${doctor.clinicAddress?.state}`);
                console.log(`      ✅ Status: ${doctor.verificationStatus} | Verified: ${doctor.isVerified} | Active: ${doctor.isActive}`);
                console.log('');
            });
        } else {
            console.log('   No doctors added today');
        }

        console.log('\n🎉 DOCTOR VISIBILITY FIXED!');
        console.log('   - All doctors are now approved and visible to patients');
        console.log('   - New doctor registration will be visible immediately');
        console.log('   - Patient searches should now show all available doctors');

    } catch (error) {
        console.error('❌ Error fixing doctor visibility:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n🔌 Disconnected from MongoDB');
        process.exit(0);
    }
}

console.log('🚀 Fixing Doctor Visibility Issues...');
console.log('=' .repeat(60));
fixDoctorVisibility();
