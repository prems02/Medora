const mongoose = require('mongoose');
const XLSX = require('xlsx');
require('dotenv').config({ path: './config.env' });

// Import the Doctor model
const Doctor = require('./models/Doctor');

// Excel file path
const excelFilePath = 'C:\\Users\\jeeln\\OneDrive - Universal Ai University\\Desktop\\2024.xlsx';

// Dummy data arrays for generating realistic information
const specializations = [
    'cardiology', 'dermatology', 'endocrinology', 'gastroenterology',
    'general', 'gynecology', 'neurology', 'oncology', 'orthopedics',
    'pediatrics', 'psychiatry', 'pulmonology', 'urology'
];

const qualifications = [
    'MBBS, MD', 'MBBS, MS', 'MBBS, DNB', 'MBBS, MCh', 'MBBS, DM',
    'MBBS, MS, MCh', 'MBBS, MD, DM', 'MBBS, MS, Fellowship',
    'MBBS, MD, Fellowship', 'MBBS, DNB, Fellowship'
];

const cities = [
    'Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata', 'Hyderabad',
    'Pune', 'Ahmedabad', 'Surat', 'Jaipur', 'Lucknow', 'Kanpur',
    'Nagpur', 'Indore', 'Thane', 'Bhopal', 'Visakhapatnam', 'Pimpri', 
    'Patna', 'Vadodara', 'Ghaziabad', 'Ludhiana', 'Coimbatore', 'Agra'
];

const states = [
    'Maharashtra', 'Delhi', 'Karnataka', 'Tamil Nadu', 'West Bengal', 
    'Telangana', 'Gujarat', 'Rajasthan', 'Uttar Pradesh', 'Madhya Pradesh',
    'Bihar', 'Punjab', 'Haryana', 'Kerala', 'Andhra Pradesh'
];

const clinicNames = [
    'City Care Clinic', 'Health Plus Center', 'Metro Medical Clinic', 
    'Prime Healthcare', 'Advanced Medical Center', 'Family Health Clinic',
    'Wellness Medical Center', 'Elite Healthcare', 'Modern Medical Clinic',
    'Integrated Health Center', 'Comprehensive Care Clinic', 'Medical Excellence Center'
];

// Utility functions
function getRandomElement(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateEmail(name, registrationNumber) {
    const cleanName = name.toLowerCase().replace(/[^a-z]/g, '');
    const domains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];
    return `dr.${cleanName}${registrationNumber}@${getRandomElement(domains)}`;
}

function generatePhoneNumber() {
    const firstDigit = [6, 7, 8, 9][Math.floor(Math.random() * 4)];
    const remaining = Math.floor(Math.random() * 900000000) + 100000000;
    return `${firstDigit}${remaining.toString().padStart(9, '0')}`;
}

function generatePincode() {
    return Math.floor(Math.random() * 900000) + 100000;
}

function splitName(fullName) {
    if (!fullName || typeof fullName !== 'string') {
        return { firstName: 'Doctor', lastName: 'Unknown' };
    }
    
    const parts = fullName.trim().split(' ');
    if (parts.length === 1) {
        return { firstName: parts[0], lastName: 'Kumar' }; // Default last name if only one name
    }
    return {
        firstName: parts[0],
        lastName: parts.slice(1).join(' ')
    };
}

function mapStateCouncilToState(stateCouncil) {
    if (!stateCouncil) return getRandomElement(states);
    
    const stateMapping = {
        'Tripura State Medical Council': 'Tripura',
        'Delhi Medical Council': 'Delhi',
        'Maharashtra Medical Council': 'Maharashtra',
        'Karnataka Medical Council': 'Karnataka',
        'Tamil Nadu Medical Council': 'Tamil Nadu',
        'West Bengal Medical Council': 'West Bengal',
        'Gujarat Medical Council': 'Gujarat',
        'Rajasthan Medical Council': 'Rajasthan',
        'Uttar Pradesh Medical Council': 'Uttar Pradesh',
        'Madhya Pradesh Medical Council': 'Madhya Pradesh',
        'Bihar Medical Council': 'Bihar',
        'Punjab Medical Council': 'Punjab',
        'Haryana Medical Council': 'Haryana',
        'Kerala Medical Council': 'Kerala',
        'Andhra Pradesh Medical Council': 'Andhra Pradesh',
        'Telangana Medical Council': 'Telangana',
        'Odisha Medical Council': 'Odisha',
        'Assam Medical Council': 'Assam',
        'Jharkhand Medical Council': 'Jharkhand',
        'Chhattisgarh Medical Council': 'Chhattisgarh'
    };
    
    return stateMapping[stateCouncil] || getRandomElement(states);
}

function getDefaultClinicTimings() {
    return {
        monday: {
            start: '09:00',
            end: '18:00',
            isOpen: true,
            slotDuration: 30,
            breakTime: { start: '13:00', end: '14:00' }
        },
        tuesday: {
            start: '09:00',
            end: '18:00',
            isOpen: true,
            slotDuration: 30,
            breakTime: { start: '13:00', end: '14:00' }
        },
        wednesday: {
            start: '09:00',
            end: '18:00',
            isOpen: true,
            slotDuration: 30,
            breakTime: { start: '13:00', end: '14:00' }
        },
        thursday: {
            start: '09:00',
            end: '18:00',
            isOpen: true,
            slotDuration: 30,
            breakTime: { start: '13:00', end: '14:00' }
        },
        friday: {
            start: '09:00',
            end: '18:00',
            isOpen: true,
            slotDuration: 30,
            breakTime: { start: '13:00', end: '14:00' }
        },
        saturday: {
            start: '09:00',
            end: '15:00',
            isOpen: true,
            slotDuration: 30,
            breakTime: { start: '12:00', end: '13:00' }
        },
        sunday: {
            start: '09:00',
            end: '15:00',
            isOpen: false,
            slotDuration: 30,
            breakTime: { start: '12:00', end: '13:00' }
        }
    };
}

async function migrateExcelDoctors() {
    try {
        console.log('🔗 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected successfully!');

        // Check current count (don't clear existing doctors)
        const existingCount = await Doctor.countDocuments();
        console.log(`📊 Current doctors in database: ${existingCount}`);

        console.log('📊 Reading Excel file...');
        const workbook = XLSX.readFile(excelFilePath);
        const worksheet = workbook.Sheets['Sheet1'];
        const excelData = XLSX.utils.sheet_to_json(worksheet);
        
        console.log(`📋 Found ${excelData.length} doctors in Excel file`);

        const batchSize = 50; // Smaller batch size for better stability
        const totalBatches = Math.ceil(excelData.length / batchSize);
        let processedCount = 0;
        let errorCount = 0;

        for (let i = 0; i < totalBatches; i++) {
            const batch = excelData.slice(i * batchSize, (i + 1) * batchSize);
            const doctorsToInsert = [];

            console.log(`\n🔄 Processing batch ${i + 1}/${totalBatches} (${batch.length} doctors)...`);

            for (const row of batch) {
                try {
                    // Skip if no name or registration number
                    if (!row.Name && !row['Regestration Number']) {
                        continue;
                    }

                    const { firstName, lastName } = splitName(row.Name);
                    const state = mapStateCouncilToState(row['State Medical Council']);
                    const city = getRandomElement(cities);
                    const regNumber = row['Regestration Number'] || getRandomNumber(10000, 99999);
                    
                    const doctorData = {
                        // Personal Information
                        firstName: firstName,
                        lastName: lastName,
                        email: generateEmail(row.Name || 'doctor', regNumber),
                        phone: generatePhoneNumber(),
                        
                        // Professional Information
                        specialization: getRandomElement(specializations),
                        experience: getRandomNumber(2, 35),
                        qualifications: getRandomElement(qualifications),
                        
                        // Clinic Information
                        clinicName: `${getRandomElement(clinicNames)} - ${city}`,
                        clinicAddress: {
                            street: `${getRandomNumber(1, 999)} Medical Street`,
                            city: city,
                            state: state,
                            pincode: generatePincode().toString()
                        },
                        consultationFee: getRandomNumber(200, 1500),
                        registrationFee: getRandomNumber(50, 200),
                        
                        // Clinic Timings
                        clinicTimings: getDefaultClinicTimings(),
                        
                        // Authentication
                        password: 'Doctor@123', // Will be hashed by the model
                        
                        // Account Status - Make all approved so patients can see them
                        isVerified: true,
                        isActive: true,
                        verificationStatus: 'approved',
                        
                        // Additional fields
                        totalPatients: getRandomNumber(50, 1000),
                        totalAppointments: getRandomNumber(100, 2000),
                        rating: {
                            average: parseFloat((3.5 + Math.random() * 1.5).toFixed(1)),
                            count: getRandomNumber(20, 200)
                        },
                        
                        // Store original registration info in notes
                        verificationNotes: `Original Registration: ${regNumber} - ${row['State Medical Council'] || 'Unknown Council'}`,
                        
                        createdAt: new Date(),
                        updatedAt: new Date()
                    };
                    
                    doctorsToInsert.push(doctorData);
                    
                } catch (error) {
                    errorCount++;
                    console.error(`❌ Error processing doctor ${row.Name || 'Unknown'}:`, error.message);
                }
            }

            // Insert batch
            if (doctorsToInsert.length > 0) {
                try {
                    await Doctor.insertMany(doctorsToInsert, { ordered: false });
                    processedCount += doctorsToInsert.length;
                    console.log(`✅ Inserted ${doctorsToInsert.length} doctors (Total: ${processedCount})`);
                } catch (insertError) {
                    console.error('❌ Batch insertion error:', insertError.message);
                    // Try inserting one by one if batch fails
                    for (const doctorData of doctorsToInsert) {
                        try {
                            await Doctor.create(doctorData);
                            processedCount++;
                        } catch (individualError) {
                            errorCount++;
                            console.error(`❌ Individual insert failed: ${individualError.message}`);
                        }
                    }
                }
            }

            // Brief pause to avoid overwhelming the database
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        console.log(`\n🎉 Migration completed!`);
        console.log(`✅ Successfully processed: ${processedCount} doctors`);
        console.log(`❌ Errors encountered: ${errorCount}`);

        // Display final statistics
        const totalDoctors = await Doctor.countDocuments();
        const verifiedDoctors = await Doctor.countDocuments({ isVerified: true });
        
        console.log('\n📊 Final Statistics:');
        console.log(`   Total Doctors in DB: ${totalDoctors}`);
        console.log(`   Verified Doctors: ${verifiedDoctors}`);
        console.log(`   Approval Rate: ${((verifiedDoctors/totalDoctors)*100).toFixed(1)}%`);

        // Show sample doctors
        console.log('\n👨‍⚕️ Sample doctors:');
        const sampleDoctors = await Doctor.find({}).limit(3).select('firstName lastName email specialization clinicName clinicAddress.city');
        sampleDoctors.forEach((doctor, index) => {
            console.log(`   ${index + 1}. Dr. ${doctor.firstName} ${doctor.lastName}`);
            console.log(`      📧 ${doctor.email}`);
            console.log(`      🏥 ${doctor.specialization} - ${doctor.clinicName}`);
            console.log(`      📍 ${doctor.clinicAddress.city}`);
        });

    } catch (error) {
        console.error('❌ Migration error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n🔌 Disconnected from MongoDB');
        process.exit(0);
    }
}

// Run the migration
console.log('🚀 Starting Excel doctors migration (Safe Mode)...');
console.log('=' .repeat(60));
migrateExcelDoctors();
