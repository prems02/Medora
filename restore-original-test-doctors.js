const mongoose = require('mongoose');
require('dotenv').config({ path: './config.env' });

// Import the Doctor model
const Doctor = require('./models/Doctor');

// Original test doctors data
const originalTestDoctors = [
    {
        firstName: 'Doctor',
        lastName: '1',
        email: 'doctor1@cliqpat.com',
        phone: '9876543210',
        specialization: 'general',
        experience: 10,
        qualifications: 'MBBS, MD',
        clinicName: 'Test Clinic 1 - Primary Care',
        clinicAddress: {
            street: '123 Medical Street',
            city: 'Mumbai',
            state: 'Maharashtra',
            pincode: '400001'
        },
        consultationFee: 500,
        registrationFee: 100,
        clinicTimings: {
            monday: { start: '09:00', end: '17:00', isOpen: true, slotDuration: 30, breakTime: { start: '13:00', end: '14:00' } },
            tuesday: { start: '09:00', end: '17:00', isOpen: true, slotDuration: 30, breakTime: { start: '13:00', end: '14:00' } },
            wednesday: { start: '09:00', end: '17:00', isOpen: true, slotDuration: 30, breakTime: { start: '13:00', end: '14:00' } },
            thursday: { start: '09:00', end: '17:00', isOpen: true, slotDuration: 30, breakTime: { start: '13:00', end: '14:00' } },
            friday: { start: '09:00', end: '17:00', isOpen: true, slotDuration: 30, breakTime: { start: '13:00', end: '14:00' } },
            saturday: { start: '09:00', end: '13:00', isOpen: true, slotDuration: 30, breakTime: { start: '12:00', end: '13:00' } },
            sunday: { start: '09:00', end: '13:00', isOpen: false, slotDuration: 30, breakTime: { start: '12:00', end: '13:00' } }
        },
        password: 'Doctor@123',
        isVerified: true,
        isActive: true,
        verificationStatus: 'approved',
        totalPatients: 150,
        totalAppointments: 300,
        rating: { average: 4.8, count: 45 },
        verificationNotes: 'Original Test Doctor 1 - Demo account for testing',
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date()
    },
    {
        firstName: 'Doctor',
        lastName: '2',
        email: 'doctor2@cliqpat.com',
        phone: '9876543211',
        specialization: 'cardiology',
        experience: 15,
        qualifications: 'MBBS, MD, DM Cardiology',
        clinicName: 'Test Clinic 2 - Heart Care',
        clinicAddress: {
            street: '456 Cardiology Avenue',
            city: 'Delhi',
            state: 'Delhi',
            pincode: '110001'
        },
        consultationFee: 800,
        registrationFee: 150,
        clinicTimings: {
            monday: { start: '10:00', end: '18:00', isOpen: true, slotDuration: 45, breakTime: { start: '14:00', end: '15:00' } },
            tuesday: { start: '10:00', end: '18:00', isOpen: true, slotDuration: 45, breakTime: { start: '14:00', end: '15:00' } },
            wednesday: { start: '10:00', end: '18:00', isOpen: true, slotDuration: 45, breakTime: { start: '14:00', end: '15:00' } },
            thursday: { start: '10:00', end: '18:00', isOpen: true, slotDuration: 45, breakTime: { start: '14:00', end: '15:00' } },
            friday: { start: '10:00', end: '18:00', isOpen: true, slotDuration: 45, breakTime: { start: '14:00', end: '15:00' } },
            saturday: { start: '10:00', end: '14:00', isOpen: true, slotDuration: 45, breakTime: { start: '12:00', end: '13:00' } },
            sunday: { start: '10:00', end: '14:00', isOpen: false, slotDuration: 45, breakTime: { start: '12:00', end: '13:00' } }
        },
        password: 'Doctor@123',
        isVerified: true,
        isActive: true,
        verificationStatus: 'approved',
        totalPatients: 200,
        totalAppointments: 450,
        rating: { average: 4.9, count: 78 },
        verificationNotes: 'Original Test Doctor 2 - Cardiology specialist demo account',
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date()
    },
    {
        firstName: 'Doctor',
        lastName: '3',
        email: 'doctor3@cliqpat.com',
        phone: '9876543212',
        specialization: 'pediatrics',
        experience: 8,
        qualifications: 'MBBS, MD Pediatrics',
        clinicName: 'Test Clinic 3 - Kids Care',
        clinicAddress: {
            street: '789 Children Hospital Road',
            city: 'Bangalore',
            state: 'Karnataka',
            pincode: '560001'
        },
        consultationFee: 600,
        registrationFee: 120,
        clinicTimings: {
            monday: { start: '08:00', end: '16:00', isOpen: true, slotDuration: 20, breakTime: { start: '12:00', end: '13:00' } },
            tuesday: { start: '08:00', end: '16:00', isOpen: true, slotDuration: 20, breakTime: { start: '12:00', end: '13:00' } },
            wednesday: { start: '08:00', end: '16:00', isOpen: true, slotDuration: 20, breakTime: { start: '12:00', end: '13:00' } },
            thursday: { start: '08:00', end: '16:00', isOpen: true, slotDuration: 20, breakTime: { start: '12:00', end: '13:00' } },
            friday: { start: '08:00', end: '16:00', isOpen: true, slotDuration: 20, breakTime: { start: '12:00', end: '13:00' } },
            saturday: { start: '08:00', end: '12:00', isOpen: true, slotDuration: 20, breakTime: { start: '10:00', end: '10:30' } },
            sunday: { start: '08:00', end: '12:00', isOpen: false, slotDuration: 20, breakTime: { start: '10:00', end: '10:30' } }
        },
        password: 'Doctor@123',
        isVerified: true,
        isActive: true,
        verificationStatus: 'approved',
        totalPatients: 300,
        totalAppointments: 600,
        rating: { average: 4.7, count: 120 },
        verificationNotes: 'Original Test Doctor 3 - Pediatrics specialist demo account',
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date()
    }
];

async function restoreOriginalTestDoctors() {
    try {
        console.log('🔗 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected successfully!');

        console.log('🔍 Checking for existing test doctors...');
        
        // Check if original test doctors already exist
        const existingTestDoctors = await Doctor.find({
            email: { $in: ['doctor1@cliqpat.com', 'doctor2@cliqpat.com', 'doctor3@cliqpat.com'] }
        });

        if (existingTestDoctors.length > 0) {
            console.log(`📋 Found ${existingTestDoctors.length} existing test doctors:`);
            existingTestDoctors.forEach((doctor, index) => {
                console.log(`   ${index + 1}. Dr. ${doctor.firstName} ${doctor.lastName} (${doctor.email})`);
            });
            
            console.log('🔄 Removing existing test doctors to recreate them...');
            await Doctor.deleteMany({
                email: { $in: ['doctor1@cliqpat.com', 'doctor2@cliqpat.com', 'doctor3@cliqpat.com'] }
            });
            console.log('✅ Existing test doctors removed');
        }

        console.log('➕ Adding original test doctors back to database...');
        
        // Insert the original test doctors
        const result = await Doctor.insertMany(originalTestDoctors);
        
        console.log(`✅ Successfully added ${result.length} test doctors!`);
        
        console.log('\n👨‍⚕️ Restored Test Doctors:');
        result.forEach((doctor, index) => {
            console.log(`   ${index + 1}. Dr. ${doctor.firstName} ${doctor.lastName}`);
            console.log(`      📧 ${doctor.email}`);
            console.log(`      🏥 ${doctor.specialization} - ${doctor.clinicName}`);
            console.log(`      📍 ${doctor.clinicAddress.city}, ${doctor.clinicAddress.state}`);
            console.log(`      💰 Consultation: ₹${doctor.consultationFee} | Registration: ₹${doctor.registrationFee}`);
            console.log(`      ⭐ Rating: ${doctor.rating.average}/5.0 (${doctor.rating.count} reviews)`);
            console.log(`      ✅ Status: ${doctor.verificationStatus} | Active: ${doctor.isActive}`);
            console.log('');
        });

        // Verify that patients can find these doctors
        console.log('🔍 PATIENT SEARCH TEST - Verifying visibility:');
        console.log('=' .repeat(50));
        
        const testSearches = [
            { name: 'General doctors', query: { specialization: 'general', isActive: true, isVerified: true } },
            { name: 'Cardiologists', query: { specialization: 'cardiology', isActive: true, isVerified: true } },
            { name: 'Pediatricians', query: { specialization: 'pediatrics', isActive: true, isVerified: true } },
            { name: 'Doctors in Mumbai', query: { 'clinicAddress.city': 'Mumbai', isActive: true, isVerified: true } },
            { name: 'All approved doctors', query: { isActive: true, isVerified: true, verificationStatus: 'approved' } }
        ];

        for (const search of testSearches) {
            const count = await Doctor.countDocuments(search.query);
            console.log(`   ${search.name}: ${count} found`);
        }

        // Final statistics
        const totalDoctors = await Doctor.countDocuments();
        const activeDoctors = await Doctor.countDocuments({ isActive: true, isVerified: true });
        
        console.log('\n📊 FINAL DATABASE STATUS:');
        console.log('=' .repeat(50));
        console.log(`   Total Doctors: ${totalDoctors}`);
        console.log(`   Active & Verified: ${activeDoctors}`);
        console.log(`   Original Test Doctors: 3 (Restored)`);
        console.log(`   Excel Imported Doctors: ${totalDoctors - 3}`);

        console.log('\n🎉 SUCCESS! Your original test doctors are back and visible to patients!');
        console.log('   - Doctor 1: General Practice in Mumbai');
        console.log('   - Doctor 2: Cardiology in Delhi');
        console.log('   - Doctor 3: Pediatrics in Bangalore');
        
    } catch (error) {
        console.error('❌ Error restoring test doctors:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n🔌 Disconnected from MongoDB');
        process.exit(0);
    }
}

console.log('🚀 Restoring Original Test Doctors...');
console.log('=' .repeat(60));
restoreOriginalTestDoctors();
