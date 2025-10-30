# Cliqpat Integration Guide

This document outlines the newly integrated features from Cliqpat-shardul and Cliqpat-tejas projects into the main Cliqpat by me project.

## 🆕 Newly Integrated Features

### 1. Electronic Health Records (EHR) System
**Source: Cliqpat-shardul**

#### Features:
- **Patient EHR Upload**: Patients can upload PDF medical documents
- **Document Management**: Organize documents by type (lab reports, prescriptions, imaging, etc.)
- **Appointment Linking**: Link EHR documents to specific appointments
- **Secure Access**: Role-based access control for patients and doctors
- **File Storage**: Secure file storage with 10MB limit per document

#### Technical Implementation:
- **Backend Routes**: `/api/ehr/*` endpoints for CRUD operations
- **File Upload**: Multer middleware for secure file handling
- **Database Schema**: Enhanced Patient and Appointment models
- **Security**: JWT authentication and file access validation

#### API Endpoints:
```
POST   /api/ehr/upload              - Upload EHR document
GET    /api/ehr/patient/documents   - Get patient's EHR documents
GET    /api/ehr/appointment/:id/documents - Get EHR for specific appointment
GET    /api/ehr/download/:filename  - Download EHR document
DELETE /api/ehr/document/:id        - Delete EHR document
```

### 2. AI Calling Agent with ElevenLabs Integration
**Source: Cliqpat-tejas**

#### Features:
- **AI Pre-Consultation**: AI-powered preliminary health assessment
- **ElevenLabs Integration**: Voice-based AI conversation system
- **Gemini AI Reports**: Automated medical report generation
- **Webhook Support**: ElevenLabs webhook integration for conversation data
- **Patient Assessment**: Symptom analysis and urgency assessment

#### Technical Implementation:
- **AI Service**: Google Gemini AI integration for medical report generation
- **Webhook Routes**: `/api/webhook/*` endpoints for ElevenLabs integration
- **Database Schema**: Enhanced Appointment model with AI conversation data
- **Background Processing**: Asynchronous AI report generation

#### API Endpoints:
```
POST   /api/webhook/elevenlabs-conversation - Receive conversation data
GET    /api/webhook/ai-report/:appointmentId - Get AI-generated report
POST   /api/webhook/regenerate-ai-report/:appointmentId - Regenerate AI report
```

## 🏗️ Architecture Changes

### Database Schema Updates

#### Patient Model (`models/Patient.js`)
```javascript
// Added medicalRecords field
medicalRecords: [{
    type: String,           // 'ehr_document', 'lab_report', etc.
    title: String,          // Document title
    description: String,    // Document description
    fileUrl: String,        // File storage URL
    fileName: String,       // Stored filename
    fileSize: Number,       // File size in bytes
    mimeType: String,       // File MIME type
    uploadDate: Date,       // Upload timestamp
    doctor: ObjectId,       // Reference to doctor
    appointment: ObjectId,  // Reference to appointment
    isEHRDocument: Boolean  // EHR document flag
}]
```

#### Appointment Model (`models/Appointment.js`)
```javascript
// Added ehrDocuments field
ehrDocuments: [{
    fileName: String,       // Stored filename
    originalName: String,   // Original filename
    fileUrl: String,        // File storage URL
    fileSize: Number,       // File size in bytes
    mimeType: String,       // File MIME type
    uploadDate: Date        // Upload timestamp
}]

// Added aiConversationReport field
aiConversationReport: {
    status: String,         // 'pending', 'in_progress', 'completed', 'failed'
    conversationTranscript: String,  // Raw conversation data
    generatedReport: String,         // AI-generated report
    extractedPatientInfo: Object,    // Structured patient information
    webhookData: Mixed,             // ElevenLabs webhook data
    reportGeneratedAt: Date,        // Report generation timestamp
    reportUpdatedAt: Date           // Last update timestamp
}
```

### New Routes

#### EHR Routes (`routes/ehr.js`)
- File upload with validation
- Document retrieval and management
- Access control and security
- File download and deletion

#### Webhook Routes (`routes/webhook.js`)
- ElevenLabs webhook processing
- AI report generation
- Background processing
- Error handling and retry logic

### New Services

#### AI Service (`services/aiService.js`)
- Google Gemini AI integration
- Medical report generation
- Patient information extraction
- Urgency assessment

## 🚀 Setup Instructions

### 1. Environment Variables
Add the following to your `config.env` file:
```env
# Google Gemini AI
GEMINI_API_KEY=your_gemini_api_key_here

# JWT Secret (if not already set)
JWT_SECRET=your_jwt_secret_here
```

### 2. Dependencies
The following new packages have been added:
```json
{
  "@google/generative-ai": "^0.24.1",
  "multer": "^1.4.5-lts.1"
}
```

### 3. Directory Structure
Ensure the following directories exist:
```
uploads/
└── ehr/          # EHR document storage
```

### 4. Database Migration
If you have existing data, the new fields will be automatically added with default values.

## 🎯 Usage Examples

### Patient EHR Upload
```javascript
// Upload EHR document
const formData = new FormData();
formData.append('ehrDocument', pdfFile);
formData.append('title', 'Blood Test Report');
formData.append('description', 'Complete blood count results');
formData.append('appointmentId', 'appointment_id_here');

const response = await fetch('/api/ehr/upload', {
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${token}`
    },
    body: formData
});
```

### AI Call Integration
```javascript
// Initiate AI call
function initiateAICall(doctorId) {
    // Show AI call modal
    // Collect patient symptoms
    // Connect to ElevenLabs
    // Process conversation
    // Generate AI report
}
```

### Doctor EHR Access
```javascript
// Get appointments with EHR documents
const response = await fetch('/api/ehr/appointment/:appointmentId/documents', {
    headers: {
        'Authorization': `Bearer ${doctorToken}`
    }
});
```

## 🔒 Security Features

### Authentication & Authorization
- JWT token validation for all EHR operations
- Role-based access control (patients can only access their own documents)
- Doctors can only access EHR documents for their appointments

### File Security
- File type validation (PDF only)
- File size limits (10MB max)
- Secure file storage with unique filenames
- Access validation before file download

### Data Privacy
- Patient data isolation
- Secure webhook processing
- Encrypted file storage paths

## 🧪 Testing

### EHR Functionality
1. **Patient Upload**: Test PDF upload with various file sizes
2. **Document Management**: Test CRUD operations
3. **Access Control**: Test patient and doctor permissions
4. **File Download**: Test secure file access

### AI Calling
1. **Webhook Processing**: Test ElevenLabs webhook integration
2. **Report Generation**: Test AI report creation
3. **Error Handling**: Test failure scenarios
4. **Background Processing**: Test async operations

## 🐛 Troubleshooting

### Common Issues

#### File Upload Failures
- Check file type (must be PDF)
- Verify file size (max 10MB)
- Ensure authentication token is valid
- Check uploads directory permissions

#### AI Report Generation Failures
- Verify GEMINI_API_KEY is set
- Check webhook endpoint accessibility
- Monitor background processing logs
- Verify appointment data integrity

#### Access Denied Errors
- Check user authentication
- Verify user role (patient/doctor)
- Ensure proper appointment relationships
- Check JWT token expiration

### Debug Mode
Enable debug logging by setting:
```env
NODE_ENV=development
```

## 📚 Additional Resources

### Documentation
- [Google Gemini AI Documentation](https://ai.google.dev/docs)
- [ElevenLabs API Documentation](https://elevenlabs.io/docs)
- [Multer File Upload Documentation](https://github.com/expressjs/multer)

### Support
For technical support or questions about the integration:
1. Check the console logs for error messages
2. Verify all environment variables are set
3. Ensure database connections are working
4. Test individual API endpoints

## 🔄 Future Enhancements

### Planned Features
- **Real-time Notifications**: WebSocket integration for live updates
- **Advanced AI Features**: Symptom prediction and diagnosis assistance
- **Mobile App**: React Native mobile application
- **Analytics Dashboard**: Health insights and trends
- **Integration APIs**: Third-party healthcare system integration

### Scalability Considerations
- **File Storage**: Consider cloud storage (AWS S3, Google Cloud Storage)
- **Database**: Implement database sharding for large datasets
- **Caching**: Redis integration for performance optimization
- **Load Balancing**: Multiple server instances for high availability

---

**Note**: This integration maintains backward compatibility with existing functionality while adding powerful new features for enhanced patient care and doctor efficiency.
