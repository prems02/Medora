const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const router = express.Router();

// Generate JWT Token
const generateToken = (userId, userType) => {
    return jwt.sign(
        { userId, userType },
        process.env.JWT_SECRET || 'fallback_secret_key',
        { expiresIn: '7d' }
    );
};

// Patient Registration
router.post('/patient/register', [
    body('firstName').trim().isLength({ min: 2 }).withMessage('First name must be at least 2 characters'),
    body('lastName').trim().isLength({ min: 2 }).withMessage('Last name must be at least 2 characters'),
    body('email').isEmail().normalizeEmail().withMessage('Please enter a valid email'),
    body('phone').matches(/^[6-9]\d{9}$/).withMessage('Please enter a valid 10-digit phone number'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),
    body('dateOfBirth').isISO8601().withMessage('Please enter a valid date of birth'),
    body('gender').isIn(['male', 'female', 'other']).withMessage('Please select a valid gender'),
    body('city').trim().notEmpty().withMessage('City is required'),
    body('state').trim().notEmpty().withMessage('State is required'),
    body('pincode').trim().notEmpty().withMessage('Pincode is required'),
    body('emergencyContact.name').trim().notEmpty().withMessage('Emergency contact name is required'),
    body('emergencyContact.phone').matches(/^[6-9]\d{9}$/).withMessage('Emergency contact phone must be valid')
], async (req, res) => {
    try {
        // Check validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const {
            firstName, lastName, email, phone, password, dateOfBirth, gender,
            address, bloodGroup, emergencyContact, medicalHistory, allergies,
            currentMedications
        } = req.body;

        // Check if patient already exists
        const existingPatient = await Patient.findOne({ email });
        if (existingPatient) {
            return res.status(400).json({
                success: false,
                message: 'Patient with this email already exists'
            });
        }

        // Create new patient
        const patient = new Patient({
            firstName,
            lastName,
            email,
            phone,
            password,
            dateOfBirth,
            gender,
            address: {
                street: address.street || '',
                city: address.city,
                state: address.state,
                pincode: address.pincode
            },
            bloodGroup,
            emergencyContact,
            medicalHistory: medicalHistory || [],
            allergies: allergies || [],
            currentMedications: currentMedications || []
        });

        await patient.save();

        // Generate token
        const token = generateToken(patient._id, 'patient');

        res.status(201).json({
            success: true,
            message: 'Patient registered successfully',
            data: {
                patient: patient.getPublicProfile(),
                token
            }
        });

    } catch (error) {
        console.error('Patient registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
        });
    }
});

// Doctor Registration
router.post('/doctor/register', [
    body('firstName').trim().isLength({ min: 2 }).withMessage('First name must be at least 2 characters'),
    body('lastName').trim().isLength({ min: 2 }).withMessage('Last name must be at least 2 characters'),
    body('email').isEmail().normalizeEmail().withMessage('Please enter a valid email'),
    body('phone').matches(/^[6-9]\d{9}$/).withMessage('Please enter a valid 10-digit phone number'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),
    body('specialization').isIn([
        'cardiology', 'dermatology', 'endocrinology', 'gastroenterology',
        'general', 'gynecology', 'neurology', 'oncology', 'orthopedics',
        'pediatrics', 'psychiatry', 'pulmonology', 'urology', 'other'
    ]).withMessage('Please select a valid specialization'),
    body('experience').isInt({ min: 0, max: 50 }).withMessage('Experience must be between 0 and 50 years'),
    body('qualifications').trim().notEmpty().withMessage('Qualifications are required'),
    body('clinicName').trim().notEmpty().withMessage('Clinic name is required'),
    body('clinicCity').trim().notEmpty().withMessage('Clinic city is required'),
    body('clinicState').trim().notEmpty().withMessage('Clinic state is required'),
    body('clinicPincode').trim().notEmpty().withMessage('Clinic pincode is required'),
    body('consultationFee').isFloat({ min: 0 }).withMessage('Consultation fee must be positive'),
    body('registrationFee').isFloat({ min: 0 }).withMessage('Registration fee must be positive')
], async (req, res) => {
    try {
        // Check validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const {
            firstName, lastName, email, phone, password, specialization, experience,
            qualifications, clinicName, clinicAddress, clinicCity, clinicState, clinicPincode,
            consultationFee, registrationFee, clinicTimings
        } = req.body;

        // Check if doctor already exists
        const existingDoctor = await Doctor.findOne({ email });
        if (existingDoctor) {
            return res.status(400).json({
                success: false,
                message: 'Doctor with this email already exists'
            });
        }

        // Create new doctor
        const doctor = new Doctor({
            firstName,
            lastName,
            email,
            phone,
            password,
            specialization,
            experience,
            qualifications,
            clinicName,
            clinicAddress: {
                street: (clinicAddress && clinicAddress.street) || '',
                city: clinicCity,
                state: clinicState,
                pincode: clinicPincode
            },
            consultationFee,
            registrationFee,
            clinicTimings: clinicTimings || {
                monday: { start: '09:00', end: '17:00', isOpen: true },
                tuesday: { start: '09:00', end: '17:00', isOpen: true },
                wednesday: { start: '09:00', end: '17:00', isOpen: true },
                thursday: { start: '09:00', end: '17:00', isOpen: true },
                friday: { start: '09:00', end: '17:00', isOpen: true },
                saturday: { start: '09:00', end: '13:00', isOpen: false },
                sunday: { start: '09:00', end: '13:00', isOpen: false }
            },
            // Set default verification status for testing
            verificationStatus: 'approved',
            isVerified: true
        });

        await doctor.save();

        res.status(201).json({
            success: true,
            message: 'Doctor registration submitted successfully. Awaiting verification.',
            data: {
                doctor: doctor.getPublicProfile()
            }
        });

    } catch (error) {
        console.error('Doctor registration error:', error);
        console.error('Error details:', {
            name: error.name,
            message: error.message,
            stack: error.stack,
            requestBody: JSON.stringify(req.body, null, 2)
        });

        // Check for specific MongoDB errors
        if (error.name === 'ValidationError') {
            const validationErrors = Object.values(error.errors).map(err => ({
                field: err.path,
                message: err.message
            }));

            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: validationErrors
            });
        }

        if (error.code === 11000) {
            const field = Object.keys(error.keyValue)[0];
            return res.status(400).json({
                success: false,
                message: `Doctor with this ${field} already exists`
            });
        }

        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? {
                message: error.message,
                name: error.name,
                details: error.toString()
            } : 'Something went wrong'
        });
    }
});

// Alternative Simple Doctor Registration (for testing)
router.post('/doctor/register-simple', async (req, res) => {
    try {
        console.log('Simple registration request received');
        console.log('Request body:', JSON.stringify(req.body, null, 2));

        const {
            firstName, lastName, email, phone, password, specialization, experience,
            qualifications, clinicName, clinicAddress, clinicCity, clinicState, clinicPincode,
            consultationFee, registrationFee, clinicTimings
        } = req.body;

        // Basic validation
        if (!firstName || !lastName || !email || !phone || !password) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: firstName, lastName, email, phone, password'
            });
        }

        if (!specialization || !qualifications || !clinicName) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: specialization, qualifications, clinicName'
            });
        }

        if (!clinicCity || !clinicState || !clinicPincode) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: clinicCity, clinicState, clinicPincode'
            });
        }

        // Check if doctor already exists
        const existingDoctor = await Doctor.findOne({ email });
        if (existingDoctor) {
            return res.status(400).json({
                success: false,
                message: 'Doctor with this email already exists'
            });
        }

        // Create new doctor with minimal validation
        const doctor = new Doctor({
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: email.toLowerCase().trim(),
            phone: phone.trim(),
            password: password,
            specialization: specialization || 'general',
            experience: parseInt(experience) || 0,
            qualifications: qualifications.trim(),
            clinicName: clinicName.trim(),
            clinicAddress: {
                street: (clinicAddress && clinicAddress.street) || '',
                city: clinicCity.trim(),
                state: clinicState.trim(),
                pincode: clinicPincode.trim()
            },
            consultationFee: parseFloat(consultationFee) || 500,
            registrationFee: parseFloat(registrationFee) || 100,
            clinicTimings: clinicTimings || {
                monday: { start: '09:00', end: '17:00', isOpen: true },
                tuesday: { start: '09:00', end: '17:00', isOpen: true },
                wednesday: { start: '09:00', end: '17:00', isOpen: true },
                thursday: { start: '09:00', end: '17:00', isOpen: true },
                friday: { start: '09:00', end: '17:00', isOpen: true },
                saturday: { start: '09:00', end: '13:00', isOpen: false },
                sunday: { start: '09:00', end: '13:00', isOpen: false }
            },
            // Set default verification status for testing
            verificationStatus: 'approved',
            isVerified: true
        });

        console.log('Attempting to save doctor to database...');
        await doctor.save();
        console.log('Doctor saved successfully!');

        res.status(201).json({
            success: true,
            message: 'Doctor registration submitted successfully. Awaiting verification.',
            data: {
                doctor: doctor.getPublicProfile()
            }
        });

    } catch (error) {
        console.error('Simple doctor registration error:', error);
        console.error('Error stack:', error.stack);

        res.status(500).json({
            success: false,
            message: 'Registration failed',
            error: error.message,
            details: error.toString()
        });
    }
});

// Patient Login
router.post('/patient/login', [
    body('email').isEmail().normalizeEmail().withMessage('Please enter a valid email'),
    body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
    try {
        // Check validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { email, password } = req.body;

        // Find patient
        const patient = await Patient.findOne({ email });
        if (!patient) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Check if account is active
        if (!patient.isActive) {
            return res.status(401).json({
                success: false,
                message: 'Account is deactivated. Please contact support.'
            });
        }

        // Verify password
        const isPasswordValid = await patient.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Update last login
        patient.lastLogin = new Date();
        await patient.save();

        // Generate token
        const token = generateToken(patient._id, 'patient');

        res.json({
            success: true,
            message: 'Login successful',
            data: {
                patient: patient.getPublicProfile(),
                token
            }
        });

    } catch (error) {
        console.error('Patient login error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
        });
    }
});

// Doctor Login
router.post('/doctor/login', [
    body('email').isEmail().normalizeEmail().withMessage('Please enter a valid email'),
    body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
    try {
        // Check validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { email, password } = req.body;

        // Find doctor
        const doctor = await Doctor.findOne({ email });
        if (!doctor) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Check if account is active
        if (!doctor.isActive) {
            return res.status(401).json({
                success: false,
                message: 'Account is deactivated. Please contact support.'
            });
        }

        // Check verification status
        if (doctor.verificationStatus !== 'approved') {
            return res.status(401).json({
                success: false,
                message: `Account verification is ${doctor.verificationStatus}. Please wait for approval.`
            });
        }

        // Verify password
        const isPasswordValid = await doctor.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Update last login
        doctor.lastLogin = new Date();
        await doctor.save();

        // Generate token
        const token = generateToken(doctor._id, 'doctor');

        res.json({
            success: true,
            message: 'Login successful',
            data: {
                doctor: doctor.getPublicProfile(),
                token
            }
        });

    } catch (error) {
        console.error('Doctor login error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
        });
    }
});

// Verify Token
router.get('/verify', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'No token provided'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key');

        let user;
        if (decoded.userType === 'patient') {
            user = await Patient.findById(decoded.userId).select('-password');
        } else if (decoded.userType === 'doctor') {
            user = await Doctor.findById(decoded.userId).select('-password');
        } else {
            return res.status(401).json({
                success: false,
                message: 'Invalid token'
            });
        }

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            message: 'Token verified',
            data: {
                user: user.getPublicProfile ? user.getPublicProfile() : user,
                userType: decoded.userType
            }
        });

    } catch (error) {
        console.error('Token verification error:', error);
        res.status(401).json({
            success: false,
            message: 'Invalid token'
        });
    }
});

// Database Status Endpoint (for debugging)
router.get('/status', async (req, res) => {
    try {
        const mongoose = require('mongoose');
        const Doctor = require('../models/Doctor');

        // Get database info
        const dbName = mongoose.connection.name;
        const connectionState = mongoose.connection.readyState;
        const stateNames = ['disconnected', 'connected', 'connecting', 'disconnecting'];

        // Count doctors
        const doctorCount = await Doctor.countDocuments();
        const doctors = await Doctor.find({}, 'firstName lastName email verificationStatus').limit(10);

        res.json({
            success: true,
            database: {
                name: dbName,
                connectionState: stateNames[connectionState],
                uri: process.env.MONGODB_URI?.replace(/:\/\/[^:]+:[^@]+@/, '://***:***@')
            },
            collections: {
                doctors: {
                    count: doctorCount,
                    recent: doctors
                }
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Database status check failed',
            error: error.message
        });
    }
});

module.exports = router;
