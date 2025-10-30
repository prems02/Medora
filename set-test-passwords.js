// Script to set known passwords for test doctors
const mongoose = require('mongoose');
require('dotenv').config({ path: './config.env' });

async function setTestPasswords() {
    try {
        console.log('🔗 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected successfully!');
        
        const Doctor = require('./models/Doctor');
        
        // Set password for doctor1@gmail.com
        const doctor1 = await Doctor.findOne({ email: 'doctor1@gmail.com' });
        if (doctor1) {
            doctor1.password = 'TestPassword123';
            await doctor1.save();
            console.log('✅ Updated password for doctor1@gmail.com to: TestPassword123');
        } else {
            console.log('❌ Doctor1 not found');
        }
        
        // Set password for doctor2@gmail.com  
        const doctor2 = await Doctor.findOne({ email: 'doctor2@gmail.com' });
        if (doctor2) {
            doctor2.password = 'TestPassword123';
            await doctor2.save();
            console.log('✅ Updated password for doctor2@gmail.com to: TestPassword123');
        } else {
            console.log('❌ Doctor2 not found');
        }
        
        // Test both passwords
        console.log('\n🧪 Testing passwords...');
        
        const testDoctor1 = await Doctor.findOne({ email: 'doctor1@gmail.com' });
        if (testDoctor1) {
            const works1 = await testDoctor1.comparePassword('TestPassword123');
            console.log(`👨‍⚕️ doctor1@gmail.com password test: ${works1 ? '✅ WORKS' : '❌ Failed'}`);
        }
        
        const testDoctor2 = await Doctor.findOne({ email: 'doctor2@gmail.com' });
        if (testDoctor2) {
            const works2 = await testDoctor2.comparePassword('TestPassword123');
            console.log(`👨‍⚕️ doctor2@gmail.com password test: ${works2 ? '✅ WORKS' : '❌ Failed'}`);
        }
        
        console.log('\n🎉 Both doctors now have the password: TestPassword123');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

setTestPasswords();
