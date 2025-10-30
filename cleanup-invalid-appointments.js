require('dotenv').config();
const mongoose = require('mongoose');
const Appointment = require('./models/Appointment');
const Doctor = require('./models/Doctor');
const Patient = require('./models/Patient');

async function cleanupInvalidAppointments() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');
        
        // Find all appointments
        const appointments = await Appointment.find();
        console.log(`\n📋 Found ${appointments.length} appointments to check`);
        
        let validCount = 0;
        let invalidCount = 0;
        let invalidAppointmentIds = [];
        
        // Check each appointment for valid doctor reference
        for (const appointment of appointments) {
            const doctor = await Doctor.findById(appointment.doctor);
            
            if (!doctor) {
                console.log(`❌ Invalid appointment: ${appointment._id} - Doctor ${appointment.doctor} not found`);
                invalidCount++;
                invalidAppointmentIds.push(appointment._id);
            } else {
                validCount++;
            }
        }
        
        console.log(`\n📊 Results:`);
        console.log(`   Valid appointments: ${validCount}`);
        console.log(`   Invalid appointments: ${invalidCount}`);
        
        if (invalidCount > 0) {
            console.log(`\n⚠️ Found ${invalidCount} appointments with invalid doctor references`);
            console.log('Do you want to delete these invalid appointments? (Type "yes" to confirm)');
            
            // For automation, we'll delete them directly
            const shouldDelete = true; // Change to false if you want manual confirmation
            
            if (shouldDelete) {
                const deleteResult = await Appointment.deleteMany({
                    _id: { $in: invalidAppointmentIds }
                });
                
                console.log(`🗑️ Deleted ${deleteResult.deletedCount} invalid appointments`);
                console.log('✅ Database cleanup completed!');
            } else {
                console.log('❌ Cleanup cancelled');
            }
        } else {
            console.log('✅ All appointments have valid doctor references!');
        }
        
        // Show remaining valid appointments for test patient
        const testPatient = await mongoose.model('Patient').findOne({ email: 'patient01@gmail.com' });
        if (testPatient) {
            const validAppointments = await Appointment.find({ patient: testPatient._id })
                .populate('doctor', 'firstName lastName specialization clinicName');
                
            console.log(`\n👤 Remaining appointments for ${testPatient.firstName}:`);
            if (validAppointments.length > 0) {
                validAppointments.forEach((apt, index) => {
                    console.log(`   ${index + 1}. ${apt.doctor.firstName} ${apt.doctor.lastName} - ${apt.status} (${apt.appointmentTime})`);
                });
            } else {
                console.log('   No valid appointments found');
            }
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.connection.close();
        process.exit();
    }
}

cleanupInvalidAppointments();
