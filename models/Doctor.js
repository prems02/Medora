const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const doctorSchema = new mongoose.Schema({
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

    // Professional Information
    specialization: {
        type: String,
        required: [true, 'Specialization is required'],
        enum: [
            'cardiology', 'dermatology', 'endocrinology', 'gastroenterology',
            'general', 'gynecology', 'neurology', 'oncology', 'orthopedics',
            'pediatrics', 'psychiatry', 'pulmonology', 'urology', 'other'
        ]
    },
    experience: {
        type: Number,
        required: [true, 'Years of experience is required'],
        min: [0, 'Experience cannot be negative'],
        max: [50, 'Experience cannot exceed 50 years']
    },
    qualifications: {
        type: String,
        required: [true, 'Qualifications are required']
    },

    // Clinic Information
    clinicName: {
        type: String,
        required: [true, 'Clinic name is required'],
        trim: true
    },
    clinicAddress: {
        street: String,
        city: {
            type: String,
            required: [true, 'Clinic city is required']
        },
        state: {
            type: String,
            required: [true, 'Clinic state is required']
        },
        pincode: {
            type: String,
            required: [true, 'Clinic pincode is required']
        }
    },
    consultationFee: {
        type: Number,
        required: [true, 'Consultation fee is required'],
        min: [0, 'Consultation fee cannot be negative']
    },
    registrationFee: {
        type: Number,
        required: [true, 'Registration fee is required'],
        min: [0, 'Registration fee cannot be negative']
    },

    // Clinic Timings
    clinicTimings: {
        monday: {
            start: { type: String, default: '09:00' },
            end: { type: String, default: '18:00' },
            isOpen: { type: Boolean, default: true },
            slotDuration: { type: Number, default: 60 }, // minutes
            breakTime: {
                start: { type: String, default: '13:00' },
                end: { type: String, default: '14:00' }
            }
        },
        tuesday: {
            start: { type: String, default: '09:00' },
            end: { type: String, default: '18:00' },
            isOpen: { type: Boolean, default: true },
            slotDuration: { type: Number, default: 60 },
            breakTime: {
                start: { type: String, default: '13:00' },
                end: { type: String, default: '14:00' }
            }
        },
        wednesday: {
            start: { type: String, default: '09:00' },
            end: { type: String, default: '18:00' },
            isOpen: { type: Boolean, default: true },
            slotDuration: { type: Number, default: 60 },
            breakTime: {
                start: { type: String, default: '13:00' },
                end: { type: String, default: '14:00' }
            }
        },
        thursday: {
            start: { type: String, default: '09:00' },
            end: { type: String, default: '18:00' },
            isOpen: { type: Boolean, default: true },
            slotDuration: { type: Number, default: 60 },
            breakTime: {
                start: { type: String, default: '13:00' },
                end: { type: String, default: '14:00' }
            }
        },
        friday: {
            start: { type: String, default: '09:00' },
            end: { type: String, default: '18:00' },
            isOpen: { type: Boolean, default: true },
            slotDuration: { type: Number, default: 60 },
            breakTime: {
                start: { type: String, default: '13:00' },
                end: { type: String, default: '14:00' }
            }
        },
        saturday: {
            start: { type: String, default: '09:00' },
            end: { type: String, default: '15:00' },
            isOpen: { type: Boolean, default: false },
            slotDuration: { type: Number, default: 60 },
            breakTime: {
                start: { type: String, default: '12:00' },
                end: { type: String, default: '13:00' }
            }
        },
        sunday: {
            start: { type: String, default: '09:00' },
            end: { type: String, default: '15:00' },
            isOpen: { type: Boolean, default: false },
            slotDuration: { type: Number, default: 60 },
            breakTime: {
                start: { type: String, default: '12:00' },
                end: { type: String, default: '13:00' }
            }
        }
    },

    // Verification Documents
    verificationDocuments: {
        medicalLicense: {
            fileUrl: String,
            isVerified: { type: Boolean, default: false },
            verifiedBy: String,
            verifiedAt: Date
        },
        degreeCertificate: {
            fileUrl: String,
            isVerified: { type: Boolean, default: false },
            verifiedBy: String,
            verifiedAt: Date
        },
        clinicPhoto: {
            fileUrl: String,
            isVerified: { type: Boolean, default: false }
        }
    },

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
    verificationStatus: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    verificationNotes: String,

    // Statistics
    totalPatients: {
        type: Number,
        default: 0
    },
    totalAppointments: {
        type: Number,
        default: 0
    },
    rating: {
        average: { type: Number, default: 0, min: 0, max: 5 },
        count: { type: Number, default: 0 }
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
doctorSchema.virtual('fullName').get(function() {
    return `Dr. ${this.firstName} ${this.lastName}`;
});

// Virtual for clinic full address
doctorSchema.virtual('clinicFullAddress').get(function() {
    const addr = this.clinicAddress;
    return `${addr.street || ''} ${addr.city}, ${addr.state} - ${addr.pincode}`.trim();
});

// Hash password before saving
doctorSchema.pre('save', async function(next) {
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
doctorSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Method to get public profile (without sensitive data)
doctorSchema.methods.getPublicProfile = function() {
    const doctorObject = this.toObject();
    delete doctorObject.password;
    delete doctorObject.__v;
    delete doctorObject.verificationDocuments;
    delete doctorObject.verificationNotes;
    return doctorObject;
};

// Method to check if clinic is open on a specific day and time
doctorSchema.methods.isClinicOpen = function(day, time) {
    const daySchedule = this.clinicTimings[day.toLowerCase()];
    if (!daySchedule || !daySchedule.isOpen) return false;

    if (!time) return true;

    const currentTime = new Date(`2000-01-01 ${time}`);
    const startTime = new Date(`2000-01-01 ${daySchedule.start}`);
    const endTime = new Date(`2000-01-01 ${daySchedule.end}`);

    return currentTime >= startTime && currentTime <= endTime;
};

// Index for search
doctorSchema.index({
    firstName: 'text',
    lastName: 'text',
    email: 'text',
    specialization: 'text',
    'clinicAddress.city': 'text',
    'clinicAddress.state': 'text'
});

module.exports = mongoose.model('Doctor', doctorSchema);
