const express = require('express');
const Doctor = require('../models/Doctor');
const router = express.Router();

// Search doctors with filters
router.get('/search', async (req, res) => {
    try {
        const {
            name,
            specialization,
            city,
            state,
            experience,
            rating,
            page = 1,
            limit = 50
        } = req.query;

        // Build query
        const query = { verificationStatus: 'approved', isActive: true };
        
        if (name) {
            // Search by doctor name (firstName, lastName, or full name)
            const nameRegex = { $regex: name, $options: 'i' };
            query.$or = [
                { firstName: nameRegex },
                { lastName: nameRegex },
                { $expr: {
                    $regexMatch: {
                        input: { $concat: ['$firstName', ' ', '$lastName'] },
                        regex: name,
                        options: 'i'
                    }
                }}
            ];
        }
        
        if (specialization) {
            query.specialization = specialization;
        }
        
        if (city) {
            query['clinicAddress.city'] = { $regex: city, $options: 'i' };
        }
        
        if (state) {
            query['clinicAddress.state'] = { $regex: state, $options: 'i' };
        }
        
        if (experience) {
            query.experience = { $gte: parseInt(experience) };
        }
        
        if (rating) {
            query['rating.average'] = { $gte: parseFloat(rating) };
        }

        // Pagination
        const skip = (page - 1) * limit;

        const doctors = await Doctor.find(query)
            .select('-password -verificationDocuments -verificationNotes')
            .sort({ 'rating.average': -1, experience: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Doctor.countDocuments(query);

        res.json({
            success: true,
            message: 'Doctors retrieved successfully',
            data: {
                doctors,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / limit),
                    totalDoctors: total,
                    hasNext: page * limit < total,
                    hasPrev: page > 1
                }
            }
        });

    } catch (error) {
        console.error('Search doctors error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
        });
    }
});

// Get doctor by ID
router.get('/:doctorId', async (req, res) => {
    try {
        const { doctorId } = req.params;

        const doctor = await Doctor.findById(doctorId)
            .select('-password -verificationDocuments -verificationNotes');

        if (!doctor) {
            return res.status(404).json({
                success: false,
                message: 'Doctor not found'
            });
        }

        if (doctor.verificationStatus !== 'approved') {
            return res.status(400).json({
                success: false,
                message: 'Doctor is not verified yet'
            });
        }

        res.json({
            success: true,
            message: 'Doctor details retrieved successfully',
            data: { doctor }
        });

    } catch (error) {
        console.error('Get doctor error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
        });
    }
});

// Get specializations
router.get('/specializations/list', async (req, res) => {
    try {
        const specializations = [
            'cardiology', 'dermatology', 'endocrinology', 'gastroenterology',
            'general', 'gynecology', 'neurology', 'oncology', 'orthopedics',
            'pediatrics', 'psychiatry', 'pulmonology', 'urology', 'other'
        ];

        res.json({
            success: true,
            message: 'Specializations retrieved successfully',
            data: { specializations }
        });

    } catch (error) {
        console.error('Get specializations error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
        });
    }
});

// Get cities with doctors
router.get('/cities/list', async (req, res) => {
    try {
        const cities = await Doctor.distinct('clinicAddress.city', {
            verificationStatus: 'approved',
            isActive: true
        });

        res.json({
            success: true,
            message: 'Cities retrieved successfully',
            data: { cities: cities.sort() }
        });

    } catch (error) {
        console.error('Get cities error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
        });
    }
});

// Get states with doctors
router.get('/states/list', async (req, res) => {
    try {
        const states = await Doctor.distinct('clinicAddress.state', {
            verificationStatus: 'approved',
            isActive: true
        });

        res.json({
            success: true,
            message: 'States retrieved successfully',
            data: { states: states.sort() }
        });

    } catch (error) {
        console.error('Get states error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
        });
    }
});

// Verify/Approve Doctor (Admin route)
router.put('/:doctorId/verify', async (req, res) => {
    try {
        const { doctorId } = req.params;
        const { verificationStatus, verificationNotes } = req.body;

        // Validate verification status
        if (!['pending', 'approved', 'rejected'].includes(verificationStatus)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid verification status. Must be pending, approved, or rejected.'
            });
        }

        const doctor = await Doctor.findById(doctorId);
        if (!doctor) {
            return res.status(404).json({
                success: false,
                message: 'Doctor not found'
            });
        }

        // Update verification status
        doctor.verificationStatus = verificationStatus;
        doctor.isVerified = verificationStatus === 'approved';
        if (verificationNotes) {
            doctor.verificationNotes = verificationNotes;
        }

        await doctor.save();

        res.json({
            success: true,
            message: `Doctor verification status updated to ${verificationStatus}`,
            data: {
                doctor: doctor.getPublicProfile()
            }
        });

    } catch (error) {
        console.error('Verify doctor error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
        });
    }
});

// Get all doctors (including pending ones - for admin)
router.get('/admin/all', async (req, res) => {
    try {
        const { verificationStatus, page = 1, limit = 20 } = req.query;
        
        const query = {};
        if (verificationStatus) {
            query.verificationStatus = verificationStatus;
        }

        const skip = (page - 1) * limit;

        const doctors = await Doctor.find(query)
            .select('-password -verificationDocuments')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Doctor.countDocuments(query);

        res.json({
            success: true,
            message: 'Doctors retrieved successfully',
            data: {
                doctors,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / limit),
                    totalDoctors: total,
                    hasNext: page * limit < total,
                    hasPrev: page > 1
                }
            }
        });

    } catch (error) {
        console.error('Get all doctors error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
        });
    }
});

module.exports = router;
