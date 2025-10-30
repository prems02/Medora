const mongoose = require('mongoose');

// Simple conversation storage schema
const conversationSchema = new mongoose.Schema({
    // Unique identifier for the conversation
    conversationId: {
        type: String,
        required: true,
        unique: true
    },

    // Appointment ID (if available)
    appointmentId: {
        type: String,
        default: null
    },

    // Raw conversation transcript from ElevenLabs
    transcript: {
        type: String,
        required: true
    },

    // Patient information from webhook
    patientName: {
        type: String,
        default: 'Unknown'
    },

    // Call metadata
    callDuration: {
        type: String,
        default: null
    },

    // Webhook data for reference
    webhookData: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },

    // AI Report generation status
    reportStatus: {
        type: String,
        enum: ['pending', 'generating', 'completed', 'failed'],
        default: 'pending'
    },

    // Generated AI report (stored when doctor requests it)
    generatedReport: {
        type: String,
        default: null
    },

    // Report generation timestamp
    reportGeneratedAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true // Adds createdAt and updatedAt
});

module.exports = mongoose.model('Conversation', conversationSchema);
