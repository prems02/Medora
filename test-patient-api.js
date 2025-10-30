require('dotenv').config();
const mongoose = require('mongoose');
const Appointment = require('./models/Appointment');
const Patient = require('./models/Patient');
const Doctor = require('./models/Doctor');

async function testPatientAPI() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');
        
        // Find the test patient
        const testPatient = await Patient.findOne({ email: 'patient01@gmail.com' });
        if (!testPatient) {
            console.log('❌ Test patient not found');
            return;
        }
        
        console.log(`\n👤 Test Patient: ${testPatient.firstName} ${testPatient.lastName} (${testPatient._id})`);
        
        // Simulate the API call that the frontend makes
        const appointments = await Appointment.find({ patient: testPatient._id })
            .populate('doctor', '_id firstName lastName specialization clinicName')
            .sort({ appointmentDate: -1, appointmentTime: -1 });
        
        console.log(`\n📋 API Response would return ${appointments.length} appointments:`);
        
        appointments.forEach((apt, index) => {
            console.log(`\n${index + 1}. Appointment Details:`);
            console.log(`   ID: ${apt._id}`);
            console.log(`   Status: ${apt.status}`);
            console.log(`   Date: ${apt.appointmentDate.toDateString()}`);
            console.log(`   Time: ${apt.appointmentTime}`);
            console.log(`   Doctor: ${apt.doctor?.firstName} ${apt.doctor?.lastName}`);
            console.log(`   Doctor ID: ${apt.doctor?._id}`);
            console.log(`   Specialization: ${apt.doctor?.specialization}`);
            console.log(`   Clinic: ${apt.doctor?.clinicName}`);
            console.log(`   Consultation Fee: ₹${apt.consultationFee}`);
        });
        
        // Test filtering logic
        const upcoming = appointments.filter(apt => apt.status === 'confirmed' || apt.status === 'scheduled');
        const past = appointments.filter(apt => apt.status === 'completed' || apt.status === 'cancelled');
        
        console.log(`\n📅 Frontend Filtering Results:`);
        console.log(`   Upcoming appointments: ${upcoming.length}`);
        console.log(`   Past appointments: ${past.length}`);
        
        if (upcoming.length > 0) {
            console.log(`\n✅ Upcoming appointments that should show:`);
            upcoming.forEach((apt, index) => {
                console.log(`   ${index + 1}. ${apt.doctor?.firstName} ${apt.doctor?.lastName} - ${apt.status} (${apt.appointmentTime})`);
            });
        }
        
        // Check if doctor data is missing
        const appointmentsWithMissingDoctor = appointments.filter(apt => !apt.doctor || !apt.doctor.firstName);
        if (appointmentsWithMissingDoctor.length > 0) {
            console.log(`\n⚠️ Found ${appointmentsWithMissingDoctor.length} appointments with missing doctor data`);
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.connection.close();
        process.exit();
    }
}

testPatientAPI();
