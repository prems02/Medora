const mongoose = require('mongoose');
require('dotenv').config({ path: './config.env' });

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cliqpat', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => {
    console.log('✅ Connected to MongoDB successfully!');
    testDoctorData();
})
.catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
});

async function testDoctorData() {
    try {
        const Doctor = require('./models/Doctor');
        
        // Find all doctors
        const doctors = await Doctor.find({});
        console.log('\n📊 Total doctors in database:', doctors.length);
        
        if (doctors.length > 0) {
            console.log('\n🔍 Doctor details:');
            doctors.forEach((doctor, index) => {
                console.log(`\n--- Doctor ${index + 1} ---`);
                console.log('ID:', doctor._id);
                console.log('Name:', doctor.firstName, doctor.lastName);
                console.log('Email:', doctor.email);
                console.log('Phone:', doctor.phone);
                console.log('Specialization:', doctor.specialization);
                console.log('Experience:', doctor.experience, 'years');
                console.log('Clinic Name:', doctor.clinicName);
                console.log('Clinic Address:', {
                    street: doctor.clinicAddress.street,
                    city: doctor.clinicAddress.city,
                    state: doctor.clinicAddress.state,
                    pincode: doctor.clinicAddress.pincode
                });
                console.log('Consultation Fee:', doctor.consultationFee);
                console.log('Registration Fee:', doctor.registrationFee);
                console.log('Verification Status:', doctor.verificationStatus);
                console.log('Is Verified:', doctor.isVerified);
                console.log('Created At:', doctor.createdAt);
            });
            
            // Test updating verification status
            if (doctors.length > 0) {
                const firstDoctor = doctors[0];
                console.log(`\n🔄 Testing verification update for doctor: ${firstDoctor.firstName} ${firstDoctor.lastName}`);
                
                // Update verification status to approved
                firstDoctor.verificationStatus = 'approved';
                firstDoctor.isVerified = true;
                await firstDoctor.save();
                
                console.log('✅ Doctor verification status updated successfully!');
                console.log('New status:', firstDoctor.verificationStatus);
                console.log('Is verified:', firstDoctor.isVerified);
            }
        } else {
            console.log('❌ No doctors found in database');
        }
        
    } catch (error) {
        console.error('❌ Error testing doctor data:', error);
    } finally {
        mongoose.connection.close();
        console.log('\n🔌 MongoDB connection closed');
    }
}
