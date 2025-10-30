require('dotenv').config();
const mongoose = require('mongoose');
const Doctor = require('./models/Doctor');

async function checkDoctorFees() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');
        
        // Get a few sample doctors with their fees
        const doctors = await Doctor.find().select('firstName lastName consultationFee registrationFee').limit(5);
        
        console.log('\n📊 Sample doctors with fees:');
        doctors.forEach((doc, index) => {
            console.log(`${index + 1}. ${doc.firstName} ${doc.lastName}: consultation=₹${doc.consultationFee}, registration=₹${doc.registrationFee}`);
        });
        
        // Check for doctors with specific fee combinations
        const doctorWith1000Fee = await Doctor.findOne({ 
            consultationFee: 1000, 
            registrationFee: { $in: [97, 100] } 
        }).select('firstName lastName consultationFee registrationFee');
        
        if (doctorWith1000Fee) {
            console.log('\n🎯 Found doctor with 1000 consultation fee:');
            console.log(`${doctorWith1000Fee.firstName} ${doctorWith1000Fee.lastName}: consultation=₹${doctorWith1000Fee.consultationFee}, registration=₹${doctorWith1000Fee.registrationFee}`);
        } else {
            console.log('\n❌ No doctor found with 1000 consultation fee');
        }
        
        // Check fee statistics
        const feeStats = await Doctor.aggregate([
            {
                $group: {
                    _id: null,
                    avgConsultation: { $avg: "$consultationFee" },
                    minConsultation: { $min: "$consultationFee" },
                    maxConsultation: { $max: "$consultationFee" },
                    avgRegistration: { $avg: "$registrationFee" },
                    minRegistration: { $min: "$registrationFee" },
                    maxRegistration: { $max: "$registrationFee" }
                }
            }
        ]);
        
        if (feeStats.length > 0) {
            console.log('\n📈 Fee Statistics:');
            const stats = feeStats[0];
            console.log(`Consultation Fee - Avg: ₹${stats.avgConsultation?.toFixed(2)}, Min: ₹${stats.minConsultation}, Max: ₹${stats.maxConsultation}`);
            console.log(`Registration Fee - Avg: ₹${stats.avgRegistration?.toFixed(2)}, Min: ₹${stats.minRegistration}, Max: ₹${stats.maxRegistration}`);
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.connection.close();
        process.exit();
    }
}

checkDoctorFees();
