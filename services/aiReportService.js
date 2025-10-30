const AIReport = require('../models/AIReport');
const tempFileService = require('./tempFileService');
const { generatePatientReport } = require('./aiService');
const mongoose = require('mongoose');

class AIReportService {
    /**
     * Process conversation data from webhook
     * @param {Object} webhookData - Raw webhook data
     * @param {string} conversationTranscript - ACTUAL conversation between patient and AI
     * @returns {Object} Processing result
     */
    async processConversationData(webhookData, conversationTranscript) {
        try {
            console.log('🤖 Starting AI conversation processing...');

            // Check database connection
            if (mongoose.connection.readyState !== 1) {
                console.log('⚠️ Database not connected, attempting to reconnect...');
                await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cliqpat');
                console.log('✅ Database reconnected successfully');
            }

            // Generate unique report ID
            const reportId = AIReport.generateReportId();
            console.log(`🆔 Generated report ID: ${reportId}`);

            // Extract appointment ID from conversation transcript or webhook data
            const appointmentId = this.extractAppointmentId(conversationTranscript, webhookData);
            console.log(`🔍 Extracted appointment ID: ${appointmentId}`);

            // Determine if this is raw conversation or summary
            const isRawConversation = this.isRawConversationTranscript(conversationTranscript);
            console.log(`💬 Content type: ${isRawConversation ? 'Raw Conversation' : 'Summary'}`);

            // Prepare conversation data for temp file
            const conversationData = {
                transcript: conversationTranscript,
                isRawConversation: isRawConversation,
                rawWebhookData: webhookData,
                appointmentId: appointmentId,
                patientName: webhookData.patient_name || 'Unknown',
                callDuration: webhookData.call_duration || 'Unknown',
                receivedAt: new Date().toISOString(),
                source: 'ElevenLabs'
            };

            // Step 1: Save to temporary JSON file
            console.log('📁 Saving conversation to temporary file...');
            const tempFileResult = await tempFileService.saveConversationToTempFile(
                conversationData,
                reportId
            );

            if (!tempFileResult.success) {
                throw new Error(`Failed to save temp file: ${tempFileResult.error}`);
            }

            // Step 2: Create AI Report document
            console.log('💾 Creating AI Report in database...');
            const aiReport = await this.createAIReportDocument(
                reportId,
                conversationData,
                tempFileResult
            );

            if (!aiReport || !aiReport._id) {
                throw new Error('Failed to create AI Report document');
            }

            // Step 3: Extract patient information
            console.log('👤 Extracting patient information...');
            await this.extractAndSavePatientInfo(aiReport);

            // Step 4: Generate AI reports (async but wait for completion)
            console.log('🧠 Starting AI report generation...');
            await this.generateAIReports(aiReport._id);

            // Final verification
            const finalReport = await AIReport.findById(aiReport._id);
            if (!finalReport) {
                throw new Error('AI Report was not saved properly to database');
            }

            console.log('✅ All processing completed successfully');
            return {
                success: true,
                reportId: reportId,
                aiReportId: aiReport._id,
                tempFilePath: tempFileResult.filePath,
                status: finalReport.status,
                message: 'Conversation data processed and saved successfully'
            };

        } catch (error) {
            console.error('❌ Error processing conversation data:', error);
            console.error('❌ Error stack:', error.stack);
            return {
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Create AI Report document in database
     */
    async createAIReportDocument(reportId, conversationData, tempFileResult) {
        try {
            console.log('💾 Creating new AI Report document...');

            const aiReport = new AIReport({
                reportId: reportId,
                appointmentId: conversationData.appointmentId, // Store appointment ID for easy lookup
                conversationData: {
                    transcript: conversationData.transcript,
                    isRawConversation: conversationData.isRawConversation,
                    rawWebhookData: conversationData.rawWebhookData,
                    appointmentId: conversationData.appointmentId,
                    patientName: conversationData.patientName,
                    callDuration: conversationData.callDuration,
                    timestamp: new Date(conversationData.receivedAt),
                    source: conversationData.source
                },
                tempFiles: {
                    jsonFilePath: tempFileResult.filePath,
                    backupFilePath: tempFileResult.backupPath,
                    fileCreatedAt: new Date(tempFileResult.timestamp)
                },
                status: 'received',
                // Initialize empty objects to prevent undefined errors
                patientInfo: {},
                medicalData: {},
                aiGeneratedReports: {}
            });

            console.log('💾 Saving AI Report to database...');
            const savedReport = await aiReport.save();
            console.log(`✅ AI Report successfully saved with ID: ${savedReport._id}`);
            console.log(`✅ Report ID: ${savedReport.reportId}`);

            // Verify the save by checking if it exists
            const verification = await AIReport.findById(savedReport._id);
            if (verification) {
                console.log(`✅ Verification successful - AI Report exists in database`);
            } else {
                console.error(`❌ Verification failed - AI Report not found in database`);
            }

            return savedReport;
        } catch (error) {
            console.error('❌ Error creating AI Report document:', error);
            throw error;
        }
    }

    /**
     * Extract patient information from conversation
     */
    async extractAndSavePatientInfo(aiReport) {
        try {
            console.log('👤 Starting patient information extraction...');
            const transcript = aiReport.conversationData.transcript;

            // Extract patient information using comprehensive regex patterns
            console.log('🔍 Extracting patient demographics...');

            // Extract name
            const nameMatch = transcript.match(/name[:\s]*([a-zA-Z\s]+?)(?:,|\.|age|gender|$)/i);
            if (nameMatch) {
                aiReport.patientInfo.name = nameMatch[1].trim();
                console.log(`✅ Patient name: ${aiReport.patientInfo.name}`);
            }

            // Extract age
            const ageMatch = transcript.match(/age[:\s]*(\d+)/i) ||
                           transcript.match(/(\d+)\s*years?\s*old/i);
            if (ageMatch) {
                aiReport.patientInfo.age = parseInt(ageMatch[1]);
                console.log(`✅ Patient age: ${aiReport.patientInfo.age}`);
            }

            // Extract gender
            const genderMatch = transcript.match(/gender[:\s]*(male|female|other)/i);
            if (genderMatch) {
                aiReport.patientInfo.gender = genderMatch[1].charAt(0).toUpperCase() + genderMatch[1].slice(1);
                console.log(`✅ Patient gender: ${aiReport.patientInfo.gender}`);
            }

            console.log('🔍 Extracting medical information...');

            // Extract chief complaint with multiple patterns
            const complaintMatch = transcript.match(/chief complaint[:\s]*([^.]+)/i) ||
                                 transcript.match(/main concern[:\s]*([^.]+)/i) ||
                                 transcript.match(/problem[:\s]*([^.]+)/i) ||
                                 transcript.match(/complaint[:\s]*([^.]+)/i);

            if (complaintMatch) {
                aiReport.medicalData.chiefComplaint = complaintMatch[1].trim();
                console.log(`✅ Chief complaint: ${aiReport.medicalData.chiefComplaint}`);
            }

            // Extract symptoms with better parsing
            const symptomsMatch = transcript.match(/symptoms[:\s]*([^.]+(?:\.[^.]*)*)/i);
            if (symptomsMatch) {
                const symptomsText = symptomsMatch[1];
                const symptoms = symptomsText.split(/[,;]/).map(s => s.trim()).filter(s => s.length > 0);
                aiReport.medicalData.symptoms = symptoms;
                console.log(`✅ Symptoms: ${symptoms.join(', ')}`);
            }

            // Extract urgency level
            const urgencyMatch = transcript.match(/urgency\s*level[:\s]*(low|medium|high|critical)/i);
            if (urgencyMatch) {
                aiReport.medicalData.urgencyLevel = urgencyMatch[1].charAt(0).toUpperCase() + urgencyMatch[1].slice(1);
                console.log(`✅ Urgency level: ${aiReport.medicalData.urgencyLevel}`);
            }

            // Extract current medications
            const medicationsMatch = transcript.match(/current\s*medications[:\s]*([^.]+)/i) ||
                                   transcript.match(/medications[:\s]*([^.]+)/i) ||
                                   transcript.match(/taking[:\s]*([^.]+)/i);
            if (medicationsMatch) {
                const medications = medicationsMatch[1].split(/[,;]/).map(m => m.trim()).filter(m => m.length > 0);
                aiReport.medicalData.currentMedications = medications;
                console.log(`✅ Medications: ${medications.join(', ')}`);
            }

            // Extract allergies
            const allergiesMatch = transcript.match(/allergies[:\s]*([^.]+)/i);
            if (allergiesMatch) {
                const allergiesText = allergiesMatch[1].toLowerCase();
                if (allergiesText.includes('no known') || allergiesText.includes('none')) {
                    aiReport.medicalData.allergies = ['No known allergies'];
                } else {
                    const allergies = allergiesText.split(/[,;]/).map(a => a.trim()).filter(a => a.length > 0);
                    aiReport.medicalData.allergies = allergies;
                }
                console.log(`✅ Allergies: ${aiReport.medicalData.allergies.join(', ')}`);
            }

            // Extract medical history
            const historyMatch = transcript.match(/medical\s*history[:\s]*([^.]+)/i);
            if (historyMatch) {
                aiReport.medicalData.medicalHistory = historyMatch[1].trim();
                console.log(`✅ Medical history: ${aiReport.medicalData.medicalHistory}`);
            }

            // Extract additional notes
            const notesMatch = transcript.match(/additional\s*notes[:\s]*([^.]+)/i) ||
                             transcript.match(/notes[:\s]*([^.]+)/i);
            if (notesMatch) {
                aiReport.medicalData.additionalNotes = notesMatch[1].trim();
                console.log(`✅ Additional notes: ${aiReport.medicalData.additionalNotes}`);
            }

            console.log('💾 Saving extracted patient information...');
            const savedReport = await aiReport.save();
            console.log('✅ Patient information extracted and saved successfully');

            return savedReport;

        } catch (error) {
            console.error('❌ Error extracting patient info:', error);
            aiReport.errorInfo = {
                message: `Patient info extraction failed: ${error.message}`,
                timestamp: new Date()
            };
            await aiReport.save();
            throw error;
        }
    }

    /**
     * Generate AI reports using external AI service
     */
    async generateAIReports(aiReportId) {
        try {
            console.log(`🧠 Starting AI report generation for ID: ${aiReportId}`);

            const aiReport = await AIReport.findById(aiReportId);
            if (!aiReport) {
                throw new Error('AI Report not found');
            }

            aiReport.status = 'processing';
            await aiReport.save();
            console.log('📝 Status updated to processing');

            // Prepare comprehensive context for AI
            const reportContext = {
                patient: {
                    name: aiReport.patientInfo.name || 'Unknown',
                    age: aiReport.patientInfo.age || 'Unknown',
                    gender: aiReport.patientInfo.gender || 'Unknown'
                },
                medical: {
                    chiefComplaint: aiReport.medicalData.chiefComplaint || 'Not specified',
                    symptoms: aiReport.medicalData.symptoms || [],
                    urgencyLevel: aiReport.medicalData.urgencyLevel || 'Medium',
                    currentMedications: aiReport.medicalData.currentMedications || [],
                    allergies: aiReport.medicalData.allergies || [],
                    medicalHistory: aiReport.medicalData.medicalHistory || 'Not specified',
                    additionalNotes: aiReport.medicalData.additionalNotes || 'None'
                },
                reportId: aiReport.reportId,
                timestamp: new Date().toISOString()
            };

            console.log('🤖 Generating comprehensive medical report...');

            // Generate detailed report using existing AI service
            const reportResult = await generatePatientReport(
                aiReport.conversationData.transcript,
                reportContext
            );

            if (reportResult.success) {
                // Create a structured medical report
                const structuredReport = this.createStructuredMedicalReport(aiReport, reportResult);

                aiReport.aiGeneratedReports = {
                    summaryReport: structuredReport.summary,
                    detailedReport: structuredReport.detailed,
                    recommendations: reportResult.recommendations || [],
                    generatedAt: new Date(),
                    aiModel: 'Gemini'
                };
                aiReport.status = 'completed';

                console.log('✅ AI reports generated successfully');
                console.log(`📋 Summary length: ${structuredReport.summary.length} characters`);
                console.log(`📋 Detailed report length: ${structuredReport.detailed.length} characters`);
            } else {
                throw new Error(reportResult.error || 'AI report generation failed');
            }

            const savedReport = await aiReport.save();
            console.log('💾 AI report saved to database successfully');

            return savedReport;

        } catch (error) {
            console.error('❌ Error generating AI reports:', error);

            const aiReport = await AIReport.findById(aiReportId);
            if (aiReport) {
                aiReport.status = 'failed';
                aiReport.errorInfo = {
                    message: error.message,
                    stack: error.stack,
                    timestamp: new Date()
                };
                await aiReport.save();
                console.log('💾 Error status saved to database');
            }
        }
    }

    /**
     * Create a structured medical report for doctors
     */
    createStructuredMedicalReport(aiReport, reportResult) {
        const patient = aiReport.patientInfo;
        const medical = aiReport.medicalData;
        const timestamp = new Date().toLocaleString();

        // Create summary report (30-40 seconds read time)
        const summary = `
PATIENT CONSULTATION SUMMARY
Generated: ${timestamp}
Report ID: ${aiReport.reportId}

PATIENT INFORMATION:
• Name: ${patient.name || 'Unknown'}
• Age: ${patient.age || 'Unknown'} years
• Gender: ${patient.gender || 'Unknown'}

CHIEF COMPLAINT:
${medical.chiefComplaint || 'Not specified'}

KEY SYMPTOMS:
${medical.symptoms && medical.symptoms.length > 0 ?
  medical.symptoms.map(s => `• ${s}`).join('\n') :
  '• No specific symptoms documented'}

URGENCY LEVEL: ${medical.urgencyLevel || 'Medium'}

CURRENT MEDICATIONS:
${medical.currentMedications && medical.currentMedications.length > 0 ?
  medical.currentMedications.map(m => `• ${m}`).join('\n') :
  '• No current medications'}

ALLERGIES:
${medical.allergies && medical.allergies.length > 0 ?
  medical.allergies.map(a => `• ${a}`).join('\n') :
  '• No known allergies'}

AI ASSESSMENT:
${reportResult.summary || reportResult.report || 'Assessment pending'}

RECOMMENDED ACTIONS:
${reportResult.recommendations && reportResult.recommendations.length > 0 ?
  reportResult.recommendations.map(r => `• ${r}`).join('\n') :
  '• Follow standard consultation protocol'}
        `.trim();

        // Create detailed report
        const detailed = `
COMPREHENSIVE MEDICAL CONSULTATION REPORT
========================================

Report Generated: ${timestamp}
Report ID: ${aiReport.reportId}
Source: ElevenLabs AI Conversation

PATIENT DEMOGRAPHICS:
--------------------
Name: ${patient.name || 'Unknown'}
Age: ${patient.age || 'Unknown'} years
Gender: ${patient.gender || 'Unknown'}
Phone: ${patient.phone || 'Not provided'}
Email: ${patient.email || 'Not provided'}

MEDICAL INFORMATION:
-------------------
Chief Complaint: ${medical.chiefComplaint || 'Not specified'}

Presenting Symptoms:
${medical.symptoms && medical.symptoms.length > 0 ?
  medical.symptoms.map((s, i) => `${i + 1}. ${s}`).join('\n') :
  'No specific symptoms documented'}

Medical History: ${medical.medicalHistory || 'Not specified'}

Current Medications:
${medical.currentMedications && medical.currentMedications.length > 0 ?
  medical.currentMedications.map((m, i) => `${i + 1}. ${m}`).join('\n') :
  'No current medications reported'}

Known Allergies:
${medical.allergies && medical.allergies.length > 0 ?
  medical.allergies.map((a, i) => `${i + 1}. ${a}`).join('\n') :
  'No known allergies'}

Additional Notes: ${medical.additionalNotes || 'None'}

URGENCY ASSESSMENT:
------------------
Priority Level: ${medical.urgencyLevel || 'Medium'}

AI ANALYSIS:
-----------
${reportResult.report || reportResult.summary || 'Detailed analysis pending'}

RECOMMENDATIONS:
---------------
${reportResult.recommendations && reportResult.recommendations.length > 0 ?
  reportResult.recommendations.map((r, i) => `${i + 1}. ${r}`).join('\n') :
  '1. Conduct standard medical examination\n2. Review patient history\n3. Consider appropriate diagnostic tests'}

CONVERSATION TRANSCRIPT:
-----------------------
${aiReport.conversationData.transcript}

---
Report generated by AI Assistant
For medical review and validation by licensed physician
        `.trim();

        return {
            summary: summary,
            detailed: detailed
        };
    }

    /**
     * Get AI report by ID
     */
    async getAIReport(reportId) {
        try {
            const aiReport = await AIReport.findOne({ reportId: reportId });
            return {
                success: true,
                data: aiReport
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get all AI reports with pagination
     */
    async getAllAIReports(page = 1, limit = 10) {
        try {
            const skip = (page - 1) * limit;
            const aiReports = await AIReport.find()
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit);

            const total = await AIReport.countDocuments();

            return {
                success: true,
                data: aiReports,
                pagination: {
                    page: page,
                    limit: limit,
                    total: total,
                    pages: Math.ceil(total / limit)
                }
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Search AI reports by patient name or medical condition
     */
    async searchAIReports(searchTerm) {
        try {
            const aiReports = await AIReport.find({
                $or: [
                    { 'patientInfo.name': { $regex: searchTerm, $options: 'i' } },
                    { 'medicalData.chiefComplaint': { $regex: searchTerm, $options: 'i' } },
                    { 'conversationData.transcript': { $regex: searchTerm, $options: 'i' } }
                ]
            }).sort({ createdAt: -1 });

            return {
                success: true,
                data: aiReports,
                count: aiReports.length
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Detect if content is raw conversation transcript or summary
     * @param {string} content - The content to analyze
     * @returns {boolean} True if raw conversation, false if summary
     */
    isRawConversationTranscript(content) {
        if (!content) return false;

        // Look for conversation patterns
        const conversationPatterns = [
            /Patient[:\s]*[""'].*[""']/i,  // Patient: "text"
            /AI[:\s]*[""'].*[""']/i,       // AI: "text"
            /Virat[:\s]*[""'].*[""']/i,    // Virat: "text"
            /Doctor[:\s]*[""'].*[""']/i,   // Doctor: "text"
            /\n.*:[^:]*\n/g,               // Multiple speaker lines
            /Patient.*\nAI.*\n/i,          // Patient/AI alternating
            /timestamp/i,                  // Timestamp indicators
            /\d{2}:\d{2}/                  // Time stamps like 10:30
        ];

        // Check for conversation indicators
        for (const pattern of conversationPatterns) {
            if (pattern.test(content)) {
                return true;
            }
        }

        // If it starts with "Patient Consultation Summary", it's likely a summary
        if (content.toLowerCase().includes('patient consultation summary')) {
            return false;
        }

        // Default to summary if unclear
        return false;
    }

    /**
     * Extract appointment ID from conversation transcript or webhook data
     * @param {string} conversationContent - The conversation transcript or summary
     * @param {Object} webhookData - Raw webhook data
     * @returns {string|null} Extracted appointment ID
     */
    extractAppointmentId(conversationContent, webhookData) {
        try {
            // Strategy 1: Look for appointment ID in conversation content
            if (conversationContent) {
                // Look for patterns like "Appointment #123" or "Appointment ID: 123"
                const appointmentPatterns = [
                    /Appointment\s*#(\w+)/i,
                    /Appointment\s*ID[:\s]*(\w+)/i,
                    /Appointment\s*Number[:\s]*(\w+)/i,
                    /#(\w+)/g // Generic hash pattern
                ];

                for (const pattern of appointmentPatterns) {
                    const match = conversationContent.match(pattern);
                    if (match && match[1]) {
                        console.log(`✅ Found appointment ID in content: ${match[1]}`);
                        return match[1];
                    }
                }
            }

            // Strategy 2: Look for appointment ID in webhook data
            if (webhookData) {
                // Check common webhook fields
                const possibleFields = [
                    'appointment_id',
                    'appointmentId',
                    'appointment_number',
                    'appointmentNumber',
                    'session_id',
                    'sessionId',
                    'call_id',
                    'callId'
                ];

                for (const field of possibleFields) {
                    if (webhookData[field]) {
                        console.log(`✅ Found appointment ID in webhook data (${field}): ${webhookData[field]}`);
                        return webhookData[field].toString();
                    }
                }

                // Check nested objects
                if (webhookData.metadata) {
                    for (const field of possibleFields) {
                        if (webhookData.metadata[field]) {
                            console.log(`✅ Found appointment ID in webhook metadata (${field}): ${webhookData.metadata[field]}`);
                            return webhookData.metadata[field].toString();
                        }
                    }
                }
            }

            console.log('⚠️ No appointment ID found in conversation data');
            return null;

        } catch (error) {
            console.error('❌ Error extracting appointment ID:', error);
            return null;
        }
    }
}

module.exports = new AIReportService();
