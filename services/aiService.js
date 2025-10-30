const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'AIzaSyA15msPKToSTkcWu8p6UufERVZH_ZX1I4U');
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

/**
 * Generate patient report from conversation transcript
 * @param {string} transcript - The conversation transcript from ElevenLabs
 * @param {Object} appointmentInfo - Additional appointment context
 * @returns {Object} - Generated report and extracted patient info
 */
async function generatePatientReport(transcript, appointmentInfo = {}) {
    try {
        console.log('Generating patient report from transcript...');

        const prompt = `
You are a medical AI assistant. Analyze the following patient-doctor conversation transcript and create a comprehensive medical report.

CONVERSATION TRANSCRIPT:
${transcript}

APPOINTMENT CONTEXT:
${appointmentInfo ? JSON.stringify(appointmentInfo, null, 2) : 'No additional context provided'}

Please extract and organize the information into the following structured format:

**MEDICAL CONSULTATION SUMMARY**

**Patient Information:**
- Name: [Extract patient name]
- Age: [Extract patient age]
- Gender: [Extract patient gender]

**Chief Complaint:**
[Main reason for consultation]

**Present Illness:**
[Detailed description of current symptoms and their timeline]

**Symptoms:**
[List all symptoms mentioned]

**Duration:** [How long symptoms have been present]

**Severity:** [IMPORTANT: Use ONLY one of these exact values: mild, moderate, severe]

**Past Medical History:**
[Any mentioned previous medical conditions, surgeries, hospitalizations]

**Current Medications:**
[Any medications currently being taken]

**Allergies:**
[Any mentioned allergies to medications, food, or other substances]

**Family History:**
[Any mentioned family medical history]

**Social History:**
[Smoking, alcohol, occupation, lifestyle factors mentioned]

**Assessment:**
[Clinical impression based on the conversation]

**Recommendations:**
[Any advice, tests, or follow-up mentioned]

**Additional Notes:**
[Any other relevant information from the conversation]

**Urgency Level:**
[Based on symptoms: Low/Medium/High]

Please provide a professional, concise medical summary. If any information is not mentioned in the transcript, indicate "Not mentioned" or "Not discussed".

Also provide a separate JSON object with extracted key information:
{
  "patient_name": "",
  "patient_age": null,
  "patient_gender": "",
  "chief_complaint": "",
  "symptoms": [],
  "duration_of_symptoms": "",
  "severity": "mild|moderate|severe",
  "previous_medical_history": "",
  "current_medications": "",
  "allergies": "",
  "social_history": "",
  "family_history": "",
  "additional_notes": "",
  "urgency_level": ""
}

IMPORTANT: For the "severity" field, use ONLY one of these exact values: "mild", "moderate", or "severe". Do not use any other text or descriptions.
`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const generatedText = response.text();

        console.log('Report generated successfully');

        // Try to extract JSON from the response
        let extractedInfo = {};
        try {
            // Look for JSON pattern in the response
            const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                extractedInfo = JSON.parse(jsonMatch[0]);

                // Validate and clean severity field
                if (extractedInfo.severity) {
                    const severityLower = extractedInfo.severity.toLowerCase();
                    if (severityLower.includes('mild')) {
                        extractedInfo.severity = 'mild';
                    } else if (severityLower.includes('severe')) {
                        extractedInfo.severity = 'severe';
                    } else if (severityLower.includes('moderate')) {
                        extractedInfo.severity = 'moderate';
                    } else {
                        // Default to moderate if unclear
                        extractedInfo.severity = 'moderate';
                    }
                }
            }
        } catch (error) {
            console.warn('Could not parse extracted info JSON:', error.message);
        }

        return {
            success: true,
            generatedReport: generatedText,
            extractedPatientInfo: extractedInfo
        };

    } catch (error) {
        console.error('Error generating patient report:', error);
        return {
            success: false,
            error: error.message,
            generatedReport: null,
            extractedPatientInfo: null
        };
    }
}

/**
 * Create a summary report for doctor's quick review
 * @param {string} fullReport - The complete generated report
 * @returns {string} - Condensed summary for quick review
 */
async function createSummaryReport(fullReport) {
    try {
        const prompt = `
Please create a concise summary of the following medical consultation report for quick doctor review:

${fullReport}

Create a brief summary (3-4 sentences) that includes:
1. Patient's main complaint
2. Key symptoms and severity
3. Any urgent concerns or red flags
4. Recommended next steps

Keep it professional and to the point for quick scanning.
`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();

    } catch (error) {
        console.error('Error creating summary report:', error);
        return 'Summary generation failed. Please review the full report.';
    }
}

/**
 * Assess urgency level from conversation
 * @param {string} transcript - Conversation transcript
 * @returns {string} - Urgency level: low, medium, high
 */
async function assessUrgency(transcript) {
    try {
        const prompt = `
Analyze the following patient conversation and determine the urgency level based on symptoms mentioned:

${transcript}

Based on the symptoms, pain level, duration, and patient's description, classify this as:
- LOW: Minor symptoms, routine care, no immediate concern
- MEDIUM: Symptoms requiring attention but not emergency
- HIGH: Severe symptoms, potential emergency, requires immediate attention

Respond with just one word: LOW, MEDIUM, or HIGH
`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const urgency = response.text().trim().toLowerCase();

        if (['low', 'medium', 'high'].includes(urgency)) {
            return urgency;
        }

        return 'medium'; // default fallback

    } catch (error) {
        console.error('Error assessing urgency:', error);
        return 'medium'; // default fallback
    }
}

module.exports = {
    generatePatientReport,
    createSummaryReport,
    assessUrgency
};
