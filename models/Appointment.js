const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
    // Doctor Information
    doctor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Doctor',
        required: [true, 'Doctor is required']
    },

    // Patient Information
    patient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Patient',
        required: [true, 'Patient is required']
    },

    // Appointment Details
    appointmentDate: {
        type: Date,
        required: [true, 'Appointment date is required']
    },
    appointmentTime: {
        type: String,
        required: [true, 'Appointment time is required']
    },
    duration: {
        type: Number,
        default: 60, // minutes (1 hour slots)
        min: [30, 'Duration must be at least 30 minutes'],
        max: [120, 'Duration cannot exceed 2 hours']
    },

    // Appointment Type
    type: {
        type: String,
        enum: ['consultation', 'follow_up', 'emergency', 'routine_checkup'],
        default: 'consultation'
    },

    // Status
    status: {
        type: String,
        enum: ['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'],
        default: 'scheduled'
    },

    // Reason and Notes
    reason: {
        type: String,
        required: [true, 'Appointment reason is required']
    },
    notes: String,
    symptoms: [String],

    // Fees
    consultationFee: {
        type: Number,
        required: [true, 'Consultation fee is required']
    },
    registrationFee: {
        type: Number,
        default: 0
    },
    totalAmount: {
        type: Number,
        required: [true, 'Total amount is required']
    },

    // Payment Status
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'refunded'],
        default: 'pending'
    },
    paymentMethod: String,
    paymentDate: Date,

    // AI Screening
    aiScreening: {
        isCompleted: { type: Boolean, default: false },
        reportUrl: String,
        riskLevel: {
            type: String,
            enum: ['low', 'medium', 'high'],
            default: 'low'
        },
        completedAt: Date
    },

    // Medical Records
    prescription: {
        isPrescribed: { type: Boolean, default: false },
        prescriptionText: String,
        prescribedMedicines: [{
            name: String,
            dosage: String,
            frequency: String,
            duration: String,
            instructions: String
        }],
        prescribedAt: Date
    },

    // Follow-up
    followUp: {
        isRequired: { type: Boolean, default: false },
        followUpDate: Date,
        followUpReason: String
    },

    // EHR Documents uploaded by patient for this appointment
    ehrDocuments: [{
        fileName: String,
        originalName: String,
        fileUrl: String,
        fileSize: Number,
        mimeType: String,
        uploadDate: {
            type: Date,
            default: Date.now
        }
    }],

    // AI Conversation Report
    aiConversationReport: {
        // Status of the AI report
        status: {
            type: String,
            enum: ['pending', 'in_progress', 'completed', 'failed'],
            default: 'pending'
        },
        // Raw conversation transcript from ElevenLabs
        conversationTranscript: String,
        // Generated summary/report using Gemini AI
        generatedReport: String,
        // Patient information extracted from conversation
        extractedPatientInfo: {
            appointment_id: String,
            patient_name: String,
            patient_age: Number,
            patient_gender: String,
            chief_complaint: String,
            symptoms: [String],
            duration_of_symptoms: String,
            severity: {
                type: String,
                enum: ['mild', 'moderate', 'severe']
            },
            previous_medical_history: String,
            current_medications: String,
            allergies: String,
            social_history: String,
            family_history: String,
            additional_notes: String
        },
        // Webhook data received from ElevenLabs
        webhookData: mongoose.Schema.Types.Mixed,
        // Timestamps
        reportGeneratedAt: Date,
        reportUpdatedAt: Date
    },

    // Timestamps
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

// Virtual for appointment datetime
appointmentSchema.virtual('appointmentDateTime').get(function() {
    if (!this.appointmentDate || !this.appointmentTime) return null;

    const date = new Date(this.appointmentDate);
    const [hours, minutes] = this.appointmentTime.split(':');
    date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    return date;
});

// Virtual for appointment end time
appointmentSchema.virtual('appointmentEndTime').get(function() {
    if (!this.appointmentDateTime) return null;

    const endTime = new Date(this.appointmentDateTime);
    endTime.setMinutes(endTime.getMinutes() + this.duration);
    return endTime;
});

// Virtual for is upcoming
appointmentSchema.virtual('isUpcoming').get(function() {
    if (!this.appointmentDateTime) return false;

    const now = new Date();
    return this.appointmentDateTime > now && this.status === 'confirmed';
});

// Virtual for is past
appointmentSchema.virtual('isPast').get(function() {
    if (!this.appointmentDateTime) return false;

    const now = new Date();
    return this.appointmentDateTime < now;
});

// Virtual for is today
appointmentSchema.virtual('isToday').get(function() {
    if (!this.appointmentDate) return false;

    const today = new Date();
    const appointmentDate = new Date(this.appointmentDate);

    return today.toDateString() === appointmentDate.toDateString();
});

// Indexes for efficient queries
appointmentSchema.index({ doctor: 1, appointmentDate: 1, appointmentTime: 1 });
appointmentSchema.index({ patient: 1, appointmentDate: 1 });
appointmentSchema.index({ status: 1, appointmentDate: 1 });
appointmentSchema.index({ appointmentDate: 1, appointmentTime: 1 });

// Pre-save middleware to calculate total amount
appointmentSchema.pre('save', function(next) {
    console.log('Pre-save middleware - consultationFee:', this.consultationFee, 'registrationFee:', this.registrationFee);

    // Ensure both fees are numbers
    const consultationFee = Number(this.consultationFee) || 0;
    const registrationFee = Number(this.registrationFee) || 0;

    this.totalAmount = consultationFee + registrationFee;
    console.log('Pre-save middleware - calculated totalAmount:', this.totalAmount);

    next();
});

// Static method to check availability
appointmentSchema.statics.checkAvailability = async function(doctorId, date, time, duration = 60, excludeAppointmentId = null) {
    const appointmentDate = new Date(date);
    const dayOfWeek = appointmentDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();

    // Check if doctor is available on this day
    const doctor = await mongoose.model('Doctor').findById(doctorId);
    if (!doctor || !doctor.isClinicOpen(dayOfWeek, time)) {
        return { available: false, reason: 'Clinic is closed on this day/time' };
    }

    // Build query for conflicting appointments
    const conflictQuery = {
        doctor: doctorId,
        appointmentDate: appointmentDate,
        status: { $in: ['scheduled', 'confirmed'] },
        appointmentTime: time
    };

    // Exclude the current appointment if rescheduling
    if (excludeAppointmentId) {
        conflictQuery._id = { $ne: excludeAppointmentId };
    }

    // Check for conflicting appointments at the exact time
    const conflictingAppointments = await this.find(conflictQuery);

    if (conflictingAppointments.length > 0) {
        return { available: false, reason: 'Time slot is already booked' };
    }

    // Build query for overlapping appointments with duration
    const overlapQuery = {
        doctor: doctorId,
        appointmentDate: appointmentDate,
        status: { $in: ['scheduled', 'confirmed'] }
    };

    // Exclude the current appointment if rescheduling
    if (excludeAppointmentId) {
        overlapQuery._id = { $ne: excludeAppointmentId };
    }

    // Check for overlapping appointments with duration
    const overlappingAppointments = await this.find(overlapQuery);

    // Check if any existing appointment overlaps with the new appointment
    for (const appointment of overlappingAppointments) {
        if (appointment.duration) {
            const appointmentStart = new Date(`${appointment.appointmentDate.toISOString().split('T')[0]}T${appointment.appointmentTime}`);
            const appointmentEnd = new Date(appointmentStart.getTime() + (appointment.duration * 60000)); // duration in milliseconds
            const newAppointmentStart = new Date(`${appointmentDate.toISOString().split('T')[0]}T${time}`);
            const newAppointmentEnd = new Date(newAppointmentStart.getTime() + (duration * 60000));

            // Check if appointments overlap
            if ((newAppointmentStart < appointmentEnd) && (newAppointmentEnd > appointmentStart)) {
                return { available: false, reason: 'Time slot overlaps with existing appointment' };
            }
        }
    }

    return { available: true };
};

// Static method to get available slots
appointmentSchema.statics.getAvailableSlots = async function(doctorId, date) {
    const doctor = await mongoose.model('Doctor').findById(doctorId);
    if (!doctor) return [];

    const appointmentDate = new Date(date);
    const dayOfWeek = appointmentDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const daySchedule = doctor.clinicTimings[dayOfWeek];

    if (!daySchedule || !daySchedule.isOpen) return [];

    const slots = [];
    const startTime = new Date(`2000-01-01 ${daySchedule.start}`);
    const endTime = new Date(`2000-01-01 ${daySchedule.end}`);
    const slotDuration = daySchedule.slotDuration || 60; // Use doctor's preferred slot duration (default 60 minutes)

    // Parse break time if exists
    let breakStart = null;
    let breakEnd = null;
    if (daySchedule.breakTime && daySchedule.breakTime.start && daySchedule.breakTime.end) {
        breakStart = new Date(`2000-01-01 ${daySchedule.breakTime.start}`);
        breakEnd = new Date(`2000-01-01 ${daySchedule.breakTime.end}`);
    }

    let currentTime = new Date(startTime);

    while (currentTime < endTime) {
        const timeString = currentTime.toTimeString().slice(0, 5);

        // Check if current slot is during break time
        let isDuringBreak = false;
        if (breakStart && breakEnd) {
            const slotEndTime = new Date(currentTime.getTime() + (slotDuration * 60000));
            isDuringBreak = (currentTime >= breakStart && currentTime < breakEnd) ||
                           (slotEndTime > breakStart && slotEndTime <= breakEnd);
        }

        if (isDuringBreak) {
            slots.push({
                time: timeString,
                available: false,
                reason: 'Break time'
            });
        } else {
            // Check if this slot is available
            const isAvailable = await this.checkAvailability(doctorId, date, timeString, slotDuration);

            if (isAvailable.available) {
                slots.push({
                    time: timeString,
                    available: true,
                    duration: slotDuration
                });
            } else {
                slots.push({
                    time: timeString,
                    available: false,
                    reason: isAvailable.reason
                });
            }
        }

        currentTime.setMinutes(currentTime.getMinutes() + slotDuration);
    }

    return slots;
};

module.exports = mongoose.model('Appointment', appointmentSchema);
