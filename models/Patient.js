const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const patientSchema = new mongoose.Schema({
    // Personal Information
    firstName: {
        type: String,
        required: [true, 'First name is required'],
        trim: true
    },
    lastName: {
        type: String,
        required: [true, 'Last name is required'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    phone: {
        type: String,
        required: [true, 'Phone number is required'],
        match: [/^[6-9]\d{9}$/, 'Please enter a valid 10-digit phone number']
    },
    dateOfBirth: {
        type: Date,
        required: [true, 'Date of birth is required']
    },
    gender: {
        type: String,
        enum: ['male', 'female', 'other'],
        required: [true, 'Gender is required']
    },

    // Address Information
    address: {
        street: String,
        city: {
            type: String,
            required: [true, 'City is required']
        },
        state: {
            type: String,
            required: [true, 'State is required']
        },
        pincode: {
            type: String,
            required: [true, 'Pincode is required']
        }
    },

    // Medical Information
    bloodGroup: {
        type: String,
        enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
    },
    emergencyContact: {
        name: {
            type: String,
            required: [true, 'Emergency contact name is required']
        },
        phone: {
            type: String,
            required: [true, 'Emergency contact phone is required'],
            match: [/^[6-9]\d{9}$/, 'Please enter a valid 10-digit phone number']
        },
        relationship: String
    },
    medicalHistory: [{
        condition: String,
        diagnosedDate: Date,
        status: {
            type: String,
            enum: ['active', 'resolved', 'chronic'],
            default: 'active'
        },
        notes: String
    }],
    allergies: [{
        allergen: String,
        severity: {
            type: String,
            enum: ['mild', 'moderate', 'severe'],
            default: 'mild'
        },
        notes: String
    }],
    currentMedications: [{
        name: String,
        dosage: String,
        frequency: String,
        startDate: Date,
        endDate: Date,
        prescribedBy: String,
        notes: String
    }],

    // Medical Records
    medicalRecords: [{
        type: {
            type: String,
            enum: ['lab_report', 'prescription', 'imaging', 'vaccination', 'ehr_document', 'other']
        },
        title: String,
        description: String,
        fileUrl: String,
        fileName: String,
        fileSize: Number,
        mimeType: String,
        uploadDate: {
            type: Date,
            default: Date.now
        },
        doctor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Doctor'
        },
        appointment: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Appointment'
        },
        isEHRDocument: {
            type: Boolean,
            default: false
        }
    }],

    // Authentication
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [8, 'Password must be at least 8 characters long']
    },

    // Account Status
    isVerified: {
        type: Boolean,
        default: false
    },
    isActive: {
        type: Boolean,
        default: true
    },

    // Timestamps
    lastLogin: Date,
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Virtual for full name
patientSchema.virtual('fullName').get(function() {
    return `${this.firstName} ${this.lastName}`;
});

// Virtual for age
patientSchema.virtual('age').get(function() {
    if (!this.dateOfBirth) return null;
    const today = new Date();
    const birthDate = new Date(this.dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
});

// Hash password before saving
patientSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();

    try {
        const salt = await bcrypt.genSalt(12);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Method to compare password
patientSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Method to get public profile (without sensitive data)
patientSchema.methods.getPublicProfile = function() {
    const patientObject = this.toObject();
    delete patientObject.password;
    delete patientObject.__v;
    return patientObject;
};

// Index for search
patientSchema.index({ firstName: 'text', lastName: 'text', email: 'text', phone: 'text' });

module.exports = mongoose.model('Patient', patientSchema);
