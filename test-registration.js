// Test script for doctor registration debugging
const fetch = require('node-fetch');

async function testDoctorRegistration() {
    const testData = {
        firstName: "John",
        lastName: "Doe",
        email: "test.doctor@example.com",
        phone: "9876543210",
        password: "password123",
        specialization: "general",
        experience: 5,
        qualifications: "MBBS, MD",
        clinicName: "Test Clinic",
        clinicAddress: {
            street: "123 Test Street"
        },
        clinicCity: "Mumbai",
        clinicState: "Maharashtra",
        clinicPincode: "400001",
        consultationFee: 500,
        registrationFee: 100,
        clinicTimings: {
            monday: { start: '09:00', end: '17:00', isOpen: true },
            tuesday: { start: '09:00', end: '17:00', isOpen: true },
            wednesday: { start: '09:00', end: '17:00', isOpen: true },
            thursday: { start: '09:00', end: '17:00', isOpen: true },
            friday: { start: '09:00', end: '17:00', isOpen: true },
            saturday: { start: '09:00', end: '13:00', isOpen: false },
            sunday: { start: '09:00', end: '13:00', isOpen: false }
        }
    };

    try {
        console.log('Testing doctor registration with data:', JSON.stringify(testData, null, 2));

        const response = await fetch('http://localhost:5000/api/auth/doctor/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(testData)
        });

        console.log('Response status:', response.status);
        console.log('Response headers:', response.headers.raw());

        const responseData = await response.json();
        console.log('Response data:', JSON.stringify(responseData, null, 2));

        if (response.ok) {
            console.log('✅ Registration successful!');
        } else {
            console.log('❌ Registration failed:', responseData.message);
            if (responseData.errors) {
                console.log('Validation errors:', responseData.errors);
            }
        }
    } catch (error) {
        console.error('❌ Network error:', error.message);
    }
}

// Run the test
testDoctorRegistration();
