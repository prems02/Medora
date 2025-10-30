require('dotenv').config();
const mongoose = require('mongoose');
const Appointment = require('./models/Appointment');

async function updateAppointmentStatus() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Update all scheduled appointments to confirmed
        const updateResult = await Appointment.updateMany(
            { status: 'scheduled' },
            { status: 'confirmed' }
        );

        console.log(`✅ Updated ${updateResult.modifiedCount} appointments from 'scheduled' to 'confirmed'`);

        // Show the current status distribution
        const statusStats = await Appointment.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        console.log('\n📊 Current Appointment Status Distribution:');
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

updateAppointmentStatus();
