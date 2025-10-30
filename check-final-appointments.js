require('dotenv').config();
const mongoose = require('mongoose');
const Appointment = require('./models/Appointment');
const Doctor = require('./models/Doctor');
const Patient = require('./models/Patient');

async function checkFinalAppointments() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');
        
        const testPatient = await Patient.findOne({ email: 'patient01@gmail.com' });
        if (!testPatient) {
            console.log('❌ Test patient not found');
            return;
        }
        
        const appointments = await Appointment.find({ patient: testPatient._id })
            .populate('doctor', '_id firstName lastName specialization clinicName')
            .sort({ appointmentDate: -1, appointmentTime: -1 });
        
        console.log(`\n👤 Final appointments for ${testPatient.firstName}:`);
        console.log(`📋 Total: ${appointments.length} appointments`);
        
        if (appointments.length > 0) {
            appointments.forEach((apt, index) => {
                console.log(`\n${index + 1}. Appointment Details:`);
                console.log(`   ID: ${apt._id}`);
                console.log(`   Status: ${apt.status}`);
                console.log(`   Date: ${apt.appointmentDate.toDateString()}`);
                console.log(`   Time: ${apt.appointmentTime}`);
                console.log(`   Doctor: ${apt.doctor.firstName} ${apt.doctor.lastName}`);
                console.log(`   Specialization: ${apt.doctor.specialization}`);
                console.log(`   Clinic: ${apt.doctor.clinicName}`);
                console.log(`   Consultation Fee: ₹${apt.consultationFee}`);
            });
            
            console.log(`\n✅ All ${appointments.length} appointments have valid doctor data!`);
            console.log(`🎯 These should now display properly in the frontend.`);
        } else {
            console.log('   No appointments found');
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.connection.close();
        process.exit();
    }
}

checkFinalAppointments();
