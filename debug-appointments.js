require('dotenv').config();
const mongoose = require('mongoose');
const Appointment = require('./models/Appointment');
const Patient = require('./models/Patient');
const Doctor = require('./models/Doctor');

async function debugAppointments() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');
        
        // Get all appointments with populated data
        const appointments = await Appointment.find()
            .populate('doctor', 'firstName lastName')
            .populate('patient', 'firstName lastName')
            .sort({ createdAt: -1 })
            .limit(5);
        
        console.log('\n📋 Recent Appointments:');
        appointments.forEach((appointment, index) => {
            console.log(`${index + 1}. Appointment ID: ${appointment._id}`);
            console.log(`   Patient: ${appointment.patient?.firstName} ${appointment.patient?.lastName}`);
            console.log(`   Doctor: ${appointment.doctor?.firstName} ${appointment.doctor?.lastName}`);
            console.log(`   Date: ${appointment.appointmentDate.toDateString()}`);
            console.log(`   Time: ${appointment.appointmentTime}`);
            console.log(`   Status: ${appointment.status}`);
            console.log(`   Created: ${appointment.createdAt.toLocaleString()}`);
            console.log('   ---');
        });
        
        // Check for test patient
        const testPatient = await Patient.findOne({
            $or: [
                { firstName: /patient/i },
                { lastName: /patient/i },
                { email: /patient/i }
            ]
        });
        
        if (testPatient) {
            console.log('\n👤 Found test patient:');
            console.log(`   Name: ${testPatient.firstName} ${testPatient.lastName}`);
            console.log(`   Email: ${testPatient.email}`);
            console.log(`   ID: ${testPatient._id}`);
            
            // Get appointments for this specific patient
            const patientAppointments = await Appointment.find({ patient: testPatient._id })
                .populate('doctor', 'firstName lastName specialization clinicName')
                .sort({ appointmentDate: -1 });
                
            console.log(`\n📅 Appointments for ${testPatient.firstName}:`);
            if (patientAppointments.length > 0) {
                patientAppointments.forEach((apt, index) => {
                    console.log(`   ${index + 1}. ${apt.doctor.firstName} ${apt.doctor.lastName} - ${apt.status}`);
                    console.log(`      Date: ${apt.appointmentDate.toDateString()} at ${apt.appointmentTime}`);
                });
            } else {
                console.log('   No appointments found for this patient');
            }
        } else {
            console.log('\n❌ No test patient found');
        }
        
        // Check appointment status distribution
        const statusStats = await Appointment.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);
        
        console.log('\n📊 Appointment Status Distribution:');
        statusStats.forEach(stat => {
            console.log(`   ${stat._id}: ${stat.count}`);
        });
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.connection.close();
        process.exit();
    }
}

debugAppointments();
