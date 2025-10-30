const fetch = require('node-fetch'); // You might need to install this: npm install node-fetch

async function testPatientRegistration() {
    const testData = {
        firstName: "John",
        lastName: "Doe",
        email: "test.patient@example.com",
        phone: "9876543210",
        password: "testpassword123",
        dateOfBirth: "1990-01-01",
        gender: "male",
        address: {
            street: "123 Test Street",
            city: "Mumbai",
            state: "Maharashtra",
            pincode: "400001"
        },
        city: "Mumbai",
        state: "Maharashtra", 
        pincode: "400001",
        bloodGroup: "A+",
        emergencyContact: {
            name: "Jane Doe",
            phone: "9876543211"
        },
        medicalHistory: [],
        allergies: [],
        currentMedications: []
    };

    try {
        console.log('Testing patient registration...');
        console.log('Request data:', JSON.stringify(testData, null, 2));

        const response = await fetch('http://localhost:5000/api/auth/patient/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(testData)
        });

        const responseData = await response.json();
        
        console.log('Response status:', response.status);
        console.log('Response data:', JSON.stringify(responseData, null, 2));
        
        if (response.ok) {
            console.log('✅ Registration successful!');
        } else {
            console.log('❌ Registration failed');
            if (responseData.errors) {
                console.log('Validation errors:', responseData.errors);
            }
        }
    } catch (error) {
        console.error('❌ Network error:', error.message);
    }
}

// Run test
testPatientRegistration();
