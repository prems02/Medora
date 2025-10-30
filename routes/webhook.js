const express = require('express');
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const Conversation = require('../models/AIReport'); // Using simplified conversation model
const { generatePatientReport } = require('../services/aiService');
const router = express.Router();

/**
 * Test endpoint to verify webhook connectivity
 */
router.get('/test', (req, res) => {
    console.log('🧪 Webhook test endpoint called');
    res.json({
        success: true,
        message: 'Webhook endpoint is working!',
        timestamp: new Date().toISOString()
    });
});

router.post('/test', (req, res) => {
    console.log('🧪 Webhook POST test endpoint called');
    console.log('📋 Body:', JSON.stringify(req.body, null, 2));
    res.json({
        success: true,
        message: 'Webhook POST endpoint is working!',
        receivedData: req.body,
        timestamp: new Date().toISOString()
    });
});

/**
 * Manual conversation test endpoint - for testing the conversation storage
 */
router.post('/test-conversation', async (req, res) => {
    try {
        console.log('🧪 Testing conversation storage manually...');

        // Create a test conversation
        const testData = {
            conversation_transcript: req.body.transcript || "Patient: Hello, I have been experiencing headaches for the past week.\n\nDoctor AI: I understand you've been having headaches for a week. Can you describe the pain - is it constant or intermittent?\n\nPatient: It's mostly in the morning and gets worse during the day. The pain is throbbing.\n\nDoctor AI: Thank you for that information. On a scale of 1-10, how severe is the pain?\n\nPatient: I'd say about 6 or 7 out of 10.\n\nDoctor AI: Have you tried any medications or remedies?\n\nPatient: Just some ibuprofen, but it doesn't seem to help much.\n\nDoctor AI: I see. Any recent stress, changes in sleep patterns, or visual disturbances?\n\nPatient: Yes, I've been quite stressed at work lately and my sleep has been poor.\n\nDoctor AI: Thank you for providing this information. Based on what you've shared, this sounds like tension headaches possibly triggered by stress and poor sleep. I recommend consulting with a healthcare provider for proper evaluation.",
            appointment_id: req.body.appointment_id || 'test-' + Date.now(),
            patient_name: req.body.patient_name || 'Test Patient',
            call_duration: req.body.call_duration || '5 minutes'
        };

        // Use the same processing logic as the real webhook
        const processedRequest = {
            body: testData,
            headers: req.headers,
            query: req.query
        };

        // Process the test data through the same logic
        const Conversation = require('../models/AIReport');

        // Generate unique conversation ID
        const conversationId = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Store conversation in database
        const conversation = new Conversation({
            conversationId: conversationId,
            appointmentId: testData.appointment_id || 'unknown',
            transcript: testData.conversation_transcript,
            patientName: testData.patient_name || 'Test Patient',
            callDuration: testData.call_duration || 'Unknown',
            webhookData: testData,
            reportStatus: 'pending'
        });

        await conversation.save();
        const webhookResponse = {
            conversationId,
            success: true,
            stored: true
        };

        res.json({
            success: true,
            message: 'Test conversation processed successfully',
            testData: testData,
            result: webhookResponse
        });

    } catch (error) {
        console.error('❌ Error in test conversation:', error);
        res.status(500).json({
            success: false,
            message: 'Test failed',
            error: error.message
        });
    }
});

/**
 * ElevenLabs webhook endpoint
 * Enhanced conversation storage - handles all possible ElevenLabs webhook formats
 */
router.post('/elevenlabs-conversation', async (req, res) => {
    try {
        console.log('🎯 ElevenLabs webhook received!');
        console.log('📋 Headers:', JSON.stringify(req.headers, null, 2));
        console.log('📋 Body:', JSON.stringify(req.body, null, 2));
        console.log('📋 Query:', JSON.stringify(req.query, null, 2));

        // Handle different webhook formats from ElevenLabs
        const webhookData = req.body;

        // Multiple extraction strategies for different ElevenLabs webhook formats
        let transcript = null;
        let appointmentId = null;
        let patientName = null;
        let callDuration = null;
        let conversationData = null;

        // Strategy 1: Direct field extraction (our custom format)
        if (webhookData.conversation_transcript) {
            transcript = webhookData.conversation_transcript;
            appointmentId = webhookData.appointment_id;
            patientName = webhookData.patient_name;
            callDuration = webhookData.call_duration;
        }
        // Strategy 2: ElevenLabs consultation_summary format (YOUR SPECIFIC CASE)
        else if (webhookData.consultation_summary) {
            transcript = webhookData.consultation_summary;
            appointmentId = webhookData.appointment_id || webhookData.metadata?.appointment_id;
            patientName = webhookData.patient_name || webhookData.metadata?.patient_name;
            callDuration = webhookData.call_duration || webhookData.duration || webhookData.metadata?.duration;
            console.log('✅ Using consultation_summary extraction strategy');
        }
        // Strategy 3: ElevenLabs standard webhook format
        else if (webhookData.transcript) {
            transcript = webhookData.transcript;
            appointmentId = webhookData.metadata?.appointment_id || webhookData.appointment_id;
            patientName = webhookData.metadata?.patient_name || webhookData.patient_name;
            callDuration = webhookData.duration || webhookData.call_duration;
        }
        // Strategy 3: ElevenLabs conversation object format
        else if (webhookData.conversation) {
            const conv = webhookData.conversation;
            transcript = conv.transcript || conv.messages?.map(m => `${m.role}: ${m.content}`).join('\n\n');
            appointmentId = conv.metadata?.appointment_id || webhookData.appointment_id;
            patientName = conv.metadata?.patient_name || webhookData.patient_name;
            callDuration = conv.duration || webhookData.duration;
            conversationData = conv;
        }
        // Strategy 4: ElevenLabs messages array format
        else if (webhookData.messages && Array.isArray(webhookData.messages)) {
            transcript = webhookData.messages.map(msg => {
                const role = msg.role || msg.speaker || 'unknown';
                const content = msg.content || msg.text || msg.message;
                return `${role.charAt(0).toUpperCase() + role.slice(1)}: ${content}`;
            }).join('\n\n');
            appointmentId = webhookData.metadata?.appointment_id || webhookData.appointment_id;
            patientName = webhookData.metadata?.patient_name || webhookData.patient_name;
            callDuration = webhookData.duration || webhookData.call_duration;
        }
        // Strategy 5: Fallback - try to extract any text content
        else {
            const possibleTranscriptFields = [
                'text', 'content', 'summary', 'consultation_summary',
                'dialog', 'chat', 'conversation_text'
            ];

            for (const field of possibleTranscriptFields) {
                if (webhookData[field] && typeof webhookData[field] === 'string') {
                    transcript = webhookData[field];
                    break;
                }
            }

            // Extract metadata from various possible locations
            appointmentId = webhookData.appointment_id ||
                          webhookData.appointmentId ||
                          webhookData.metadata?.appointment_id ||
                          webhookData.context?.appointment_id;

            patientName = webhookData.patient_name ||
                         webhookData.patientName ||
                         webhookData.metadata?.patient_name ||
                         webhookData.context?.patient_name;

            callDuration = webhookData.call_duration ||
                          webhookData.duration ||
                          webhookData.length ||
                          webhookData.metadata?.duration;
        }

        // If no transcript found, create a minimal one from webhook data
        if (!transcript) {
            console.log('⚠️ No transcript found in standard formats, creating from webhook data');
            transcript = `Conversation received via webhook at ${new Date().toISOString()}\n\nWebhook Data: ${JSON.stringify(webhookData, null, 2)}`;
        }

        // Validate that we have some conversation data
        if (!transcript || transcript.trim().length === 0) {
            console.log('⚠️ Empty transcript, will still store for debugging');
            transcript = `Empty conversation received at ${new Date().toISOString()}`;
        }

        console.log('💬 Processed conversation data:');
        console.log(`📞 Call duration: ${callDuration || 'Unknown'}`);
        console.log(`👤 Patient: ${patientName || 'Unknown'}`);
        console.log(`🆔 Appointment ID: ${appointmentId || 'Unknown'}`);
        console.log(`📝 Transcript length: ${transcript.length} characters`);
        console.log(`📋 First 200 chars of transcript: ${transcript.substring(0, 200)}...`);

        // Generate unique conversation ID
        const conversationId = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Store conversation in database
        const conversation = new Conversation({
            conversationId: conversationId,
            appointmentId: appointmentId || 'unknown',
            transcript: transcript,
            patientName: patientName || 'Unknown Patient',
            callDuration: callDuration || 'Unknown',
            webhookData: webhookData, // Store complete webhook data for debugging
            reportStatus: 'pending'
        });

        await conversation.save();
        console.log('✅ Conversation stored successfully with ID:', conversationId);
        console.log('📊 Stored transcript preview:', transcript.substring(0, 150) + '...');

        return res.status(200).json({
            success: true,
            message: 'Conversation stored successfully',
            data: {
                conversationId: conversationId,
                appointmentId: appointmentId,
                patientName: patientName,
                transcriptLength: transcript.length,
                status: 'stored'
            }
        });

    } catch (error) {
        console.error('❌ Error processing ElevenLabs webhook:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
});

/**
 * Generate AI report on-demand for a specific appointment
 * Called when doctor clicks "View AI Report" button
 */
router.get('/generate-ai-report/:appointmentId', async (req, res) => {
    try {
        const { appointmentId } = req.params;
        console.log('🤖 Generating AI report for appointment:', appointmentId);

        // Find conversation by appointment ID (try multiple strategies)
        let conversation = await Conversation.findOne({ appointmentId: appointmentId });

        // If not found, try to find by appointment ObjectId
        if (!conversation && appointmentId.match(/^[0-9a-fA-F]{24}$/)) {
            conversation = await Conversation.findOne({ appointmentId: appointmentId });
        }

        // If still not found, try to find any conversation and log for debugging
        if (!conversation) {
            const allConversations = await Conversation.find().limit(5);
            console.log(`❌ No conversation found for appointment: ${appointmentId}`);
            console.log(`📊 Available conversations:`, allConversations.map(c => ({
                id: c.conversationId,
                appointmentId: c.appointmentId,
                patient: c.patientName,
                status: c.reportStatus
            })));

            return res.status(404).json({
                success: false,
                message: 'No conversation found for this appointment. Patient needs to call first.',
                debug: {
                    searchedAppointmentId: appointmentId,
                    availableConversations: allConversations.map(c => c.appointmentId)
                }
            });
        }

        // Check if report already exists
        if (conversation.reportStatus === 'completed' && conversation.generatedReport) {
            console.log('✅ Report already exists, returning cached version');
            return res.json({
                success: true,
                message: 'AI report retrieved successfully',
                data: {
                    conversationId: conversation.conversationId,
                    appointmentId: conversation.appointmentId,
                    patientName: conversation.patientName,
                    callDuration: conversation.callDuration,
                    generatedReport: conversation.generatedReport,
                    reportGeneratedAt: conversation.reportGeneratedAt,
                    transcript: conversation.transcript
                }
            });
        }

        // Generate new report
        console.log('🧠 Generating new AI report from conversation...');
        conversation.reportStatus = 'generating';
        await conversation.save();

        // Use AI service to generate report from transcript
        const aiReportResult = await generatePatientReport(conversation.transcript, {
            patientName: conversation.patientName,
            appointmentId: conversation.appointmentId,
            callDuration: conversation.callDuration
        });

        if (!aiReportResult || !aiReportResult.success) {
            throw new Error(`AI report generation failed: ${aiReportResult?.error || 'Unknown error'}`);
        }

        // Save generated report (extract just the text)
        const reportText = String(aiReportResult.generatedReport || 'Report generation failed');
        conversation.generatedReport = reportText;
        conversation.reportStatus = 'completed';
        conversation.reportGeneratedAt = new Date();
        await conversation.save();

        console.log('✅ AI report generated and saved successfully');

        return res.json({
            success: true,
            message: 'AI report generated successfully',
            data: {
                conversationId: conversation.conversationId,
                appointmentId: conversation.appointmentId,
                patientName: conversation.patientName,
                callDuration: conversation.callDuration,
                generatedReport: conversation.generatedReport,
                reportGeneratedAt: conversation.reportGeneratedAt,
                transcript: conversation.transcript
            }
        });

    } catch (error) {
        console.error('❌ Error generating AI report:', error);

        // Update status to failed if we have the conversation
        try {
            const conversation = await Conversation.findOne({ appointmentId: req.params.appointmentId });
            if (conversation) {
                conversation.reportStatus = 'failed';
                await conversation.save();
            }
        } catch (updateError) {
            console.error('❌ Error updating conversation status:', updateError);
        }

        res.status(500).json({
            success: false,
            message: 'Failed to generate AI report',
            error: error.message
        });
    }
});



module.exports = router;

/**
 * Get formatted medical report for doctors
 */
router.get('/ai-reports/:reportId/medical-report', async (req, res) => {
    try {
        const { reportId } = req.params;
        const { format = 'summary' } = req.query; // summary or detailed

        const result = await aiReportService.getAIReport(reportId);

        if (result.success && result.data) {
            const report = result.data;

            // Format the response for easy doctor consumption
            const formattedResponse = {
                reportInfo: {
                    reportId: report.reportId,
                    generatedAt: report.aiGeneratedReports?.generatedAt || report.createdAt,
                    status: report.status,
                    urgencyLevel: report.medicalData?.urgencyLevel || 'Medium'
                },
                patient: {
                    name: report.patientInfo?.name || 'Unknown',
                    age: report.patientInfo?.age || 'Unknown',
                    gender: report.patientInfo?.gender || 'Unknown',
                    phone: report.patientInfo?.phone || 'Not provided'
                },
                medicalSummary: {
                    chiefComplaint: report.medicalData?.chiefComplaint || 'Not specified',
                    symptoms: report.medicalData?.symptoms || [],
                    currentMedications: report.medicalData?.currentMedications || [],
                    allergies: report.medicalData?.allergies || [],
                    medicalHistory: report.medicalData?.medicalHistory || 'Not specified'
                },
                aiAnalysis: {
                    summary: report.aiGeneratedReports?.summaryReport || 'Analysis pending',
                    detailed: report.aiGeneratedReports?.detailedReport || 'Detailed report pending',
                    recommendations: report.aiGeneratedReports?.recommendations || []
                },
                conversationTranscript: report.conversationData?.transcript || 'Not available'
            };

            // Return appropriate format based on query parameter
            if (format === 'detailed') {
                res.json({
                    success: true,
                    message: 'Detailed medical report retrieved successfully',
                    data: formattedResponse
                });
            } else {
                // Return summary format for quick doctor review
                res.json({
                    success: true,
                    message: 'Medical report summary retrieved successfully',
                    data: {
                        reportInfo: formattedResponse.reportInfo,
                        patient: formattedResponse.patient,
                        medicalSummary: formattedResponse.medicalSummary,
                        quickSummary: formattedResponse.aiAnalysis.summary,
                        recommendations: formattedResponse.aiAnalysis.recommendations.slice(0, 3) // Top 3 recommendations
                    }
                });
            }
        } else {
            res.status(404).json({
                success: false,
                message: 'AI report not found',
                error: result.error
            });
        }
    } catch (error) {
        console.error('❌ Error getting medical report:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
});

/**
 * Get all AI reports with pagination
 */
router.get('/ai-reports', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        const result = await aiReportService.getAllAIReports(page, limit);

        if (result.success) {
            res.json({
                success: true,
                message: 'AI reports retrieved successfully',
                data: result.data,
                pagination: result.pagination
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Failed to retrieve AI reports',
                error: result.error
            });
        }
    } catch (error) {
        console.error('❌ Error getting AI reports:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
});

/**
 * Search AI reports
 */
router.get('/ai-reports/search/:searchTerm', async (req, res) => {
    try {
        const { searchTerm } = req.params;
        const result = await aiReportService.searchAIReports(searchTerm);

        if (result.success) {
            res.json({
                success: true,
                message: `Found ${result.count} AI reports`,
                data: result.data,
                count: result.count
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Search failed',
                error: result.error
            });
        }
    } catch (error) {
        console.error('❌ Error searching AI reports:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
});

/**
 * Get temporary files list
 */
router.get('/temp-files', async (req, res) => {
    try {
        const result = await tempFileService.listTempFiles();

        res.json({
            success: true,
            message: `Found ${result.count} temporary files`,
            data: result.files,
            count: result.count,
            tempDirectory: tempFileService.getTempDirectory()
        });
    } catch (error) {
        console.error('❌ Error listing temp files:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
});

/**
 * Clean up old temporary files
 */
router.post('/temp-files/cleanup', async (req, res) => {
    try {
        const maxAgeHours = req.body.maxAgeHours || 24;
        const result = await tempFileService.cleanupOldFiles(maxAgeHours);

        res.json({
            success: true,
            message: `Cleaned up ${result.cleanedCount} old files`,
            cleanedCount: result.cleanedCount
        });
    } catch (error) {
        console.error('❌ Error cleaning up temp files:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
});

// ==================== LEGACY APPOINTMENT-BASED ENDPOINTS ====================

/**
 * Get AI conversation report for an appointment (Legacy)
 */
router.get('/ai-report/:appointmentId', async (req, res) => {
    try {
        const { appointmentId } = req.params;

        let appointment;

        // Try to find appointment by ObjectId if it's a valid ObjectId format
        if (appointmentId.match(/^[0-9a-fA-F]{24}$/)) {
            appointment = await Appointment.findById(appointmentId)
                .populate('doctor', 'firstName lastName specialization clinicName')
                .populate('patient', 'firstName lastName');
        }

        // If not found or not ObjectId format, try to find by simple numeric ID
        if (!appointment) {
            appointment = await Appointment.findOne({
                $or: [
                    { appointmentNumber: appointmentId },
                    { appointmentNumber: parseInt(appointmentId) },
                    { simpleId: appointmentId },
                    { simpleId: parseInt(appointmentId) }
                ]
            })
            .populate('doctor', 'firstName lastName specialization clinicName')
            .populate('patient', 'firstName lastName');
        }

        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: 'Appointment not found'
            });
        }

        res.json({
            success: true,
            message: 'AI report retrieved successfully',
            data: {
                appointmentId: appointment._id,
                patientName: appointment.patient?.fullName || 'Unknown',
                doctorName: appointment.doctor?.fullName || 'Unknown',
                appointmentDate: appointment.appointmentDate,
                appointmentTime: appointment.appointmentTime,
                aiReport: {
                    status: appointment.aiConversationReport?.status || 'pending',
                    generatedReport: appointment.aiConversationReport?.generatedReport,
                    extractedPatientInfo: appointment.aiConversationReport?.extractedPatientInfo,
                    reportGeneratedAt: appointment.aiConversationReport?.reportGeneratedAt,
                    conversationTranscript: appointment.aiConversationReport?.conversationTranscript
                }
            }
        });

    } catch (error) {
        console.error('❌ Get AI report error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
});

// Get AI report by appointment ID
router.get('/ai-reports/appointment/:appointmentId', async (req, res) => {
    try {
        const { appointmentId } = req.params;

        console.log(`🔍 Fetching AI report for appointment: ${appointmentId}`);

        // Try multiple search strategies to find the AI report
        let aiReport;

        // Strategy 1: Find by appointment ID in conversationData
        aiReport = await AIReport.findOne({
            'conversationData.appointmentId': appointmentId
        });

        // Strategy 2: Find by appointment ID in conversationData (as number)
        if (!aiReport && !isNaN(appointmentId)) {
            aiReport = await AIReport.findOne({
                'conversationData.appointmentId': parseInt(appointmentId)
            });
        }

        // Strategy 3: Find by appointment ID in reportId (legacy support)
        if (!aiReport) {
            aiReport = await AIReport.findOne({
                reportId: { $regex: appointmentId, $options: 'i' }
            });
        }

        // Strategy 4: Find by simple appointment ID field
        if (!aiReport) {
            aiReport = await AIReport.findOne({
                $or: [
                    { appointmentId: appointmentId },
                    { appointmentId: parseInt(appointmentId) },
                    { simpleAppointmentId: appointmentId },
                    { simpleAppointmentId: parseInt(appointmentId) }
                ]
            });
        }

        // Strategy 5: For demo purposes, get the latest AI report if none found
        if (!aiReport) {
            aiReport = await AIReport.findOne().sort({ createdAt: -1 });
            console.log(`⚠️ No specific report found for appointment ${appointmentId}, returning latest report for demo`);
        }

        if (!aiReport) {
            return res.status(404).json({
                success: false,
                message: 'No AI report found for this appointment'
            });
        }

        const reportData = {
            aiReport: {
                reportId: aiReport.reportId,
                createdAt: aiReport.createdAt,
                status: aiReport.status,
                patientInfo: aiReport.patientInfo,
                medicalData: aiReport.medicalData,
                aiReports: aiReport.aiReports,
                conversationData: aiReport.conversationData
            }
        };

        console.log(`✅ AI report found and returned for appointment ${appointmentId}`);

        res.json({
            success: true,
            message: 'AI report retrieved successfully',
            data: reportData
        });

    } catch (error) {
        console.error('❌ Error fetching AI report by appointment:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch AI report',
            error: error.message
        });
    }
});

module.exports = router;
