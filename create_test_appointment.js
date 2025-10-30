const mongoose = require('mongoose');
const Appointment = require('./models/Appointment');
const Doctor = require('./models/Doctor');
const Patient = require('./models/Patient');

async function createTestAppointment() {
    try {
        await mongoose.connect('mongodb://localhost:27017/cliqpat');
        console.log('✅ Connected to MongoDB');
        
        // Find or create a test doctor
        let doctor = await Doctor.findOne({ email: 'doctor01@gmail.com' });
        if (!doctor) {
            doctor = new Doctor({
                firstName: 'John',
                lastName: 'Smith',
                email: 'doctor01@gmail.com',
                phone: '9876543210',
                password: 'hashedpassword',
                specialization: 'general',
                experience: 10,
                qualifications: 'MBBS, MD',
                clinicName: 'Smith Medical Clinic',
                clinicAddress: {
                    street: '123 Medical Street',
                    city: 'Mumbai',
                    state: 'Maharashtra',
                    pincode: '400001'
                },
                consultationFee: 500,
                registrationFee: 100,
                verificationStatus: 'approved'
            });
            await doctor.save();
            console.log('✅ Created test doctor');
        }

        // Find or create a test patient
        let patient = await Patient.findOne({ email: 'patient01@gmail.com' });
        if (!patient) {
            patient = new Patient({
                firstName: 'John',
                lastName: 'Doe',
                email: 'patient01@gmail.com',
                phone: '9876543211',
                password: 'hashedpassword',
                dateOfBirth: new Date('1989-01-01'),
                gender: 'male',
                address: {
                    street: '456 Patient Street',
                    city: 'Mumbai',
                    state: 'Maharashtra',
                    pincode: '400002'
                },
                emergencyContact: {
                    name: 'Jane Doe',
                    phone: '9876543212',
                    relationship: 'spouse'
                }
            });
            await patient.save();
            console.log('✅ Created test patient');
        }
        
        // Create test appointment
        const appointment = new Appointment({
            doctor: doctor._id,
            patient: patient._id,
            appointmentDate: new Date('2024-08-25'),
            appointmentTime: '10:00',
            reason: 'Persistent headaches',
            type: 'consultation',
            consultationFee: doctor.consultationFee,
            registrationFee: doctor.registrationFee,
            totalAmount: doctor.consultationFee + doctor.registrationFee,
            status: 'confirmed'
        });
        
        await appointment.save();
        
        console.log('✅ Created test appointment');
        console.log('📋 Appointment ID:', appointment._id.toString());
        console.log('👨‍⚕️ Doctor:', doctor.fullName);
        console.log('👤 Patient:', patient.fullName);
        
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

createTestAppointment();
