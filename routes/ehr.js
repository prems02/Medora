const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { body, validationResult } = require('express-validator');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
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

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads/ehr');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        // Generate unique filename
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, `ehr-${uniqueSuffix}${ext}`);
    }
});

const fileFilter = (req, file, cb) => {
    // Allow only PDF files for EHR documents
    if (file.mimetype === 'application/pdf') {
        cb(null, true);
    } else {
        cb(new Error('Only PDF files are allowed for EHR documents'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

// Upload EHR document for patient
router.post('/upload', authenticateToken, upload.single('ehrDocument'), async (req, res) => {
    try {
        // Verify user is a patient
        if (req.user.userType !== 'patient') {
            return res.status(403).json({
                success: false,
                message: 'Only patients can upload EHR documents'
            });
        }

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        const patientId = req.user.userId;
        const { title, description, appointmentId } = req.body;

        // Find patient
        const patient = await Patient.findById(patientId);
        if (!patient) {
            return res.status(404).json({
                success: false,
                message: 'Patient not found'
            });
        }

        // If appointmentId is provided, verify it belongs to the patient
        let appointment = null;
        if (appointmentId) {
            appointment = await Appointment.findOne({
                _id: appointmentId,
                patient: patientId
            });

            if (!appointment) {
                return res.status(404).json({
                    success: false,
                    message: 'Appointment not found or does not belong to patient'
                });
            }
        }

        // Create medical record entry
        const medicalRecord = {
            type: 'ehr_document',
            title: title || 'EHR Document',
            description: description || '',
            fileName: req.file.filename,
            fileUrl: `/uploads/ehr/${req.file.filename}`,
            fileSize: req.file.size,
            mimeType: req.file.mimetype,
            uploadDate: new Date(),
            isEHRDocument: true
        };

        if (appointmentId) {
            medicalRecord.appointment = appointmentId;
        }

        // Add to patient's medical records
        patient.medicalRecords.push(medicalRecord);
        await patient.save();

        // If appointment is provided, also add to appointment's EHR documents
        if (appointment) {
            appointment.ehrDocuments.push({
                fileName: req.file.filename,
                originalName: req.file.originalname,
                fileUrl: `/uploads/ehr/${req.file.filename}`,
                fileSize: req.file.size,
                mimeType: req.file.mimetype,
                uploadDate: new Date()
            });
            await appointment.save();
        }

        res.status(201).json({
            success: true,
            message: 'EHR document uploaded successfully',
            data: {
                document: {
                    id: patient.medicalRecords[patient.medicalRecords.length - 1]._id,
                    title: medicalRecord.title,
                    fileName: req.file.originalname,
                    fileSize: req.file.size,
                    uploadDate: medicalRecord.uploadDate,
                    appointmentId: appointmentId || null
                }
            }
        });

    } catch (error) {
        console.error('EHR upload error:', error);

        // Clean up uploaded file if there was an error
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
        });
    }
});

// Get patient's EHR documents
router.get('/patient/documents', authenticateToken, async (req, res) => {
    try {
        // Verify user is a patient
        if (req.user.userType !== 'patient') {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        const patientId = req.user.userId;
        const patient = await Patient.findById(patientId)
            .populate('medicalRecords.appointment', 'appointmentDate appointmentTime doctor')
            .populate('medicalRecords.doctor', 'firstName lastName specialization');

        if (!patient) {
            return res.status(404).json({
                success: false,
                message: 'Patient not found'
            });
        }

        // Filter only EHR documents
        const ehrDocuments = patient.medicalRecords.filter(record => record.isEHRDocument);

        res.json({
            success: true,
            message: 'EHR documents retrieved successfully',
            data: {
                documents: ehrDocuments
            }
        });

    } catch (error) {
        console.error('Get patient EHR documents error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
        });
    }
});

// Get EHR documents for a specific appointment (for doctors)
router.get('/appointment/:appointmentId/documents', authenticateToken, async (req, res) => {
    try {
        // Verify user is a doctor
        if (req.user.userType !== 'doctor') {
            return res.status(403).json({
                success: false,
                message: 'Only doctors can access appointment EHR documents'
            });
        }

        const { appointmentId } = req.params;
        const doctorId = req.user.userId;

        // Find appointment and verify it belongs to the doctor
        const appointment = await Appointment.findOne({
            _id: appointmentId,
            doctor: doctorId
        }).populate('patient', 'firstName lastName');

        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: 'Appointment not found or access denied'
            });
        }

        res.json({
            success: true,
            message: 'Appointment EHR documents retrieved successfully',
            data: {
                appointment: {
                    id: appointment._id,
                    patient: appointment.patient,
                    appointmentDate: appointment.appointmentDate,
                    appointmentTime: appointment.appointmentTime
                },
                documents: appointment.ehrDocuments
            }
        });

    } catch (error) {
        console.error('Get appointment EHR documents error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
        });
    }
});

// View EHR document (inline viewing)
router.get('/view/:filename', (req, res, next) => {
    // Check for token in query parameter first, then use normal auth middleware
    if (req.query.token) {
        req.headers.authorization = `Bearer ${req.query.token}`;
    }
    authenticateToken(req, res, next);
}, async (req, res) => {
    try {
        const { filename } = req.params;
        const filePath = path.join(uploadsDir, filename);

        // Check if file exists
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({
                success: false,
                message: 'File not found'
            });
        }

        // Verify user has access to this file
        const userId = req.user.userId;
        const userType = req.user.userType;

        let hasAccess = false;

        if (userType === 'patient') {
            // Check if patient owns this document
            const patient = await Patient.findById(userId);
            if (patient) {
                hasAccess = patient.medicalRecords.some(record =>
                    record.fileName === filename && record.isEHRDocument
                );
            }
        } else if (userType === 'doctor') {
            // Check if doctor has access through appointments
            const appointments = await Appointment.find({
                doctor: userId,
                'ehrDocuments.fileName': filename
            });
            hasAccess = appointments.length > 0;
        }

        if (!hasAccess) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        // Set appropriate headers for inline viewing
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="${filename}"`);

        // Stream the file
        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);

    } catch (error) {
        console.error('View EHR document error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
        });
    }
});

// Download EHR document
router.get('/download/:filename', authenticateToken, async (req, res) => {
    try {
        const { filename } = req.params;
        const filePath = path.join(uploadsDir, filename);

        // Check if file exists
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({
                success: false,
                message: 'File not found'
            });
        }

        // Verify user has access to this file
        const userId = req.user.userId;
        const userType = req.user.userType;

        let hasAccess = false;

        if (userType === 'patient') {
            // Check if patient owns this document
            const patient = await Patient.findById(userId);
            if (patient) {
                hasAccess = patient.medicalRecords.some(record =>
                    record.fileName === filename && record.isEHRDocument
                );
            }
        } else if (userType === 'doctor') {
            // Check if doctor has access through appointments
            const appointments = await Appointment.find({
                doctor: userId,
                'ehrDocuments.fileName': filename
            });
            hasAccess = appointments.length > 0;
        }

        if (!hasAccess) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        // Set appropriate headers for file download
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

        // Stream the file
        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);

    } catch (error) {
        console.error('Download EHR document error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
        });
    }
});

// Delete EHR document
router.delete('/document/:documentId', authenticateToken, async (req, res) => {
    try {
        // Verify user is a patient
        if (req.user.userType !== 'patient') {
            return res.status(403).json({
                success: false,
                message: 'Only patients can delete their EHR documents'
            });
        }

        const { documentId } = req.params;
        const patientId = req.user.userId;

        // Find patient
        const patient = await Patient.findById(patientId);
        if (!patient) {
            return res.status(404).json({
                success: false,
                message: 'Patient not found'
            });
        }

        // Find the document
        const documentIndex = patient.medicalRecords.findIndex(
            record => record._id.toString() === documentId && record.type === 'ehr_document'
        );

        if (documentIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'EHR document not found'
            });
        }

        const document = patient.medicalRecords[documentIndex];
        const fileName = document.fileName;

        // Remove from patient's medical records
        patient.medicalRecords.splice(documentIndex, 1);
        await patient.save();

        // Delete physical file
        const fs = require('fs');
        const path = require('path');
        const filePath = path.join(__dirname, '..', 'uploads', 'ehr', fileName);

        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        // Also remove from any appointments that reference this document
        await Appointment.updateMany(
            { 'ehrDocuments.fileName': fileName },
            { $pull: { ehrDocuments: { fileName: fileName } } }
        );

        res.json({
            success: true,
            message: 'EHR document deleted successfully'
        });

    } catch (error) {
        console.error('Delete EHR document error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
        });
    }
});

module.exports = router;
