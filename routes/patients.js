const express = require('express');
const Patient = require('../models/Patient');
const router = express.Router();

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Access token required'
        });
    }

    try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key');
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(403).json({
            success: false,
            message: 'Invalid or expired token'
        });
    }
};

// Get patient profile
router.get('/profile', authenticateToken, async (req, res) => {
    try {
        // Verify user is a patient
        if (req.user.userType !== 'patient') {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        const patientId = req.user.userId;
        const patient = await Patient.findById(patientId).select('-password');

        if (!patient) {
            return res.status(404).json({
                success: false,
                message: 'Patient not found'
            });
        }

        res.json({
            success: true,
            message: 'Patient profile retrieved successfully',
            data: { patient }
        });

    } catch (error) {
        console.error('Get patient profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
        });
    }
});

// Update patient profile
router.put('/profile', authenticateToken, async (req, res) => {
    try {
        // Verify user is a patient
        if (req.user.userType !== 'patient') {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        const patientId = req.user.userId;
        const updateData = req.body;

        // Remove sensitive fields that shouldn't be updated
        delete updateData.password;
        delete updateData.email;
        delete updateData.isVerified;
        delete updateData.isActive;

        const patient = await Patient.findByIdAndUpdate(
            patientId,
            updateData,
            { new: true, runValidators: true }
        ).select('-password');

        if (!patient) {
            return res.status(404).json({
                success: false,
                message: 'Patient not found'
            });
        }

        res.json({
            success: true,
            message: 'Patient profile updated successfully',
            data: { patient }
        });

    } catch (error) {
        console.error('Update patient profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
        });
    }
});

// Add medical record
router.post('/medical-records', authenticateToken, async (req, res) => {
    try {
        // Verify user is a patient
        if (req.user.userType !== 'patient') {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        const patientId = req.user.userId;
        const { type, title, description, fileUrl } = req.body;

        if (!type || !title || !fileUrl) {
            return res.status(400).json({
                success: false,
                message: 'Type, title, and file URL are required'
            });
        }

        const patient = await Patient.findById(patientId);
        if (!patient) {
            return res.status(404).json({
                success: false,
                message: 'Patient not found'
            });
        }

        // Add medical record
        patient.medicalRecords.push({
            type,
            title,
            description,
            fileUrl,
            uploadDate: new Date()
        });

        await patient.save();

        res.status(201).json({
            success: true,
            message: 'Medical record added successfully',
            data: {
                medicalRecord: patient.medicalRecords[patient.medicalRecords.length - 1]
            }
        });

    } catch (error) {
        console.error('Add medical record error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
        });
    }
});

// Get medical records
router.get('/medical-records', authenticateToken, async (req, res) => {
    try {
        // Verify user is a patient
        if (req.user.userType !== 'patient') {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        const patientId = req.user.userId;
        const { type, page = 1, limit = 10 } = req.query;

        const patient = await Patient.findById(patientId);
        if (!patient) {
            return res.status(404).json({
                success: false,
                message: 'Patient not found'
            });
        }

        let records = patient.medicalRecords;

        // Filter by type if specified
        if (type && type !== 'all') {
            records = records.filter(record => record.type === type);
        }

        // Sort by upload date (newest first)
        records.sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));

        // Pagination
        const total = records.length;
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + parseInt(limit);
        const paginatedRecords = records.slice(startIndex, endIndex);

        res.json({
            success: true,
            message: 'Medical records retrieved successfully',
            data: {
                records: paginatedRecords,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / limit),
                    totalRecords: total,
                    hasNext: endIndex < total,
                    hasPrev: page > 1
                }
            }
        });

    } catch (error) {
        console.error('Get medical records error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
        });
    }
});

// Delete medical record
router.delete('/medical-records/:recordId', authenticateToken, async (req, res) => {
    try {
        // Verify user is a patient
        if (req.user.userType !== 'patient') {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        const patientId = req.user.userId;
        const { recordId } = req.params;

        const patient = await Patient.findById(patientId);
        if (!patient) {
            return res.status(404).json({
                success: false,
                message: 'Patient not found'
            });
        }

        // Find and remove the record
        const recordIndex = patient.medicalRecords.findIndex(
            record => record._id.toString() === recordId
        );

        if (recordIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Medical record not found'
            });
        }

        const deletedRecord = patient.medicalRecords.splice(recordIndex, 1)[0];
        await patient.save();

        res.json({
            success: true,
            message: 'Medical record deleted successfully',
            data: { deletedRecord }
        });

    } catch (error) {
        console.error('Delete medical record error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
        });
    }
});

// Add medical history
router.post('/medical-history', authenticateToken, async (req, res) => {
    try {
        // Verify user is a patient
        if (req.user.userType !== 'patient') {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        const patientId = req.user.userId;
        const { condition, diagnosedDate, status, notes } = req.body;

        if (!condition || !diagnosedDate) {
            return res.status(400).json({
                success: false,
                message: 'Condition and diagnosed date are required'
            });
        }

        const patient = await Patient.findById(patientId);
        if (!patient) {
            return res.status(404).json({
                success: false,
                message: 'Patient not found'
            });
        }

        // Add medical history
        patient.medicalHistory.push({
            condition,
            diagnosedDate,
            status: status || 'active',
            notes
        });

        await patient.save();

        res.status(201).json({
            success: true,
            message: 'Medical history added successfully',
            data: {
                medicalHistory: patient.medicalHistory[patient.medicalHistory.length - 1]
            }
        });

    } catch (error) {
        console.error('Add medical history error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
        });
    }
});

// Add allergy
router.post('/allergies', authenticateToken, async (req, res) => {
    try {
        // Verify user is a patient
        if (req.user.userType !== 'patient') {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        const patientId = req.user.userId;
        const { allergen, severity, notes } = req.body;

        if (!allergen) {
            return res.status(400).json({
                success: false,
                message: 'Allergen is required'
            });
        }

        const patient = await Patient.findById(patientId);
        if (!patient) {
            return res.status(404).json({
                success: false,
                message: 'Patient not found'
            });
        }

        // Add allergy
        patient.allergies.push({
            allergen,
            severity: severity || 'mild',
            notes
        });

        await patient.save();

        res.status(201).json({
            success: true,
            message: 'Allergy added successfully',
            data: {
                allergy: patient.allergies[patient.allergies.length - 1]
            }
        });

    } catch (error) {
        console.error('Add allergy error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
        });
    }
});

// Add current medication
router.post('/medications', authenticateToken, async (req, res) => {
    try {
        // Verify user is a patient
        if (req.user.userType !== 'patient') {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        const patientId = req.user.userId;
        const { name, dosage, frequency, startDate, endDate, prescribedBy, notes } = req.body;

        if (!name || !dosage) {
            return res.status(400).json({
                success: false,
                message: 'Medication name and dosage are required'
            });
        }

        const patient = await Patient.findById(patientId);
        if (!patient) {
            return res.status(404).json({
                success: false,
                message: 'Patient not found'
            });
        }

        // Add medication
        patient.currentMedications.push({
            name,
            dosage,
            frequency,
            startDate,
            endDate,
            prescribedBy,
            notes
        });

        await patient.save();

        res.status(201).json({
            success: true,
            message: 'Medication added successfully',
            data: {
                medication: patient.currentMedications[patient.currentMedications.length - 1]
            }
        });

    } catch (error) {
        console.error('Add medication error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
        });
    }
});

module.exports = router;
