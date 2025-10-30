// Registration JavaScript for Cliqpat

document.addEventListener('DOMContentLoaded', function() {
    initializeRegistration();
});

function initializeRegistration() {
    setupMultiStepForms();
    setupFileUploads();
    setupRegistrationForms();
}

// Multi-step form setup
function setupMultiStepForms() {
    const multiStepForms = document.querySelectorAll('.multi-step');
    
    multiStepForms.forEach(form => {
        const steps = form.querySelectorAll('.form-step');
        const progressSteps = document.querySelectorAll('.progress-step');
        
        // Initialize first step
        if (steps.length > 0) {
            steps[0].classList.add('active');
            if (progressSteps.length > 0) {
                progressSteps[0].classList.add('active');
            }
        }
    });
}

// Next step function
function nextStep(stepNumber) {
    const currentStep = document.querySelector(`.form-step[data-step="${stepNumber - 1}"]`);
    const nextStep = document.querySelector(`.form-step[data-step="${stepNumber}"]`);
    const currentProgress = document.querySelector(`.progress-step[data-step="${stepNumber - 1}"]`);
    const nextProgress = document.querySelector(`.progress-step[data-step="${stepNumber}"]`);
    
    if (currentStep && nextStep) {
        // Validate current step
        if (validateStep(currentStep)) {
            currentStep.classList.remove('active');
            nextStep.classList.add('active');
            
            if (currentProgress && nextProgress) {
                currentProgress.classList.remove('active');
                nextProgress.classList.add('active');
            }
            
            // Scroll to top of form
            nextStep.scrollIntoView({ behavior: 'smooth' });
        }
    }
}

// Previous step function
function prevStep(stepNumber) {
    const currentStep = document.querySelector(`.form-step[data-step="${stepNumber + 1}"]`);
    const prevStep = document.querySelector(`.form-step[data-step="${stepNumber}"]`);
    const currentProgress = document.querySelector(`.progress-step[data-step="${stepNumber + 1}"]`);
    const prevProgress = document.querySelector(`.progress-step[data-step="${stepNumber}"]`);
    
    if (currentStep && prevStep) {
        currentStep.classList.remove('active');
        prevStep.classList.add('active');
        
        if (currentProgress && prevProgress) {
            currentProgress.classList.remove('active');
            prevProgress.classList.add('active');
        }
        
        // Scroll to top of form
        prevStep.scrollIntoView({ behavior: 'smooth' });
    }
}

// Validate step
function validateStep(step) {
    const requiredFields = step.querySelectorAll('[required]');
    let isValid = true;
    
    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            showFieldError(field, 'This field is required');
            isValid = false;
        } else {
            clearFieldError(field);
        }
    });
    
    return isValid;
}

// File upload setup
function setupFileUploads() {
    const fileInputs = document.querySelectorAll('input[type="file"]');
    
    fileInputs.forEach(input => {
        input.addEventListener('change', handleFileUpload);
    });
    
    // Drag and drop functionality
    const uploadAreas = document.querySelectorAll('.upload-area');
    uploadAreas.forEach(area => {
        area.addEventListener('dragover', handleDragOver);
        area.addEventListener('drop', handleDrop);
        area.addEventListener('click', () => {
            const fileInput = area.querySelector('input[type="file"]');
            if (fileInput) fileInput.click();
        });
    });
}

// Handle file upload
function handleFileUpload(e) {
    const files = Array.from(e.target.files);
    const uploadArea = e.target.closest('.upload-area');
    const uploadedFiles = uploadArea.parentElement.querySelector('.uploaded-files');
    
    if (uploadedFiles) {
        uploadedFiles.innerHTML = '';
        
        files.forEach(file => {
            const fileItem = createFileItem(file);
            uploadedFiles.appendChild(fileItem);
        });
    }
}

// Create file item element
function createFileItem(file) {
    const fileItem = document.createElement('div');
    fileItem.className = 'file-item';
    fileItem.innerHTML = `
        <div class="file-info">
            <i class="fas fa-file"></i>
            <span class="file-name">${file.name}</span>
            <span class="file-size">${formatFileSize(file.size)}</span>
        </div>
        <button type="button" class="remove-file" onclick="removeFile(this)">
            <i class="fas fa-times"></i>
        </button>
    `;
    return fileItem;
}

// Format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Remove file
function removeFile(button) {
    const fileItem = button.closest('.file-item');
    const fileInput = fileItem.closest('.upload-section').querySelector('input[type="file"]');
    
    // Clear file input
    fileInput.value = '';
    fileItem.remove();
}

// Handle drag over
function handleDragOver(e) {
    e.preventDefault();
    e.currentTarget.classList.add('drag-over');
}

// Handle drop
function handleDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
    
    const files = Array.from(e.dataTransfer.files);
    const fileInput = e.currentTarget.querySelector('input[type="file"]');
    
    if (fileInput) {
        fileInput.files = e.dataTransfer.files;
        handleFileUpload({ target: fileInput });
    }
}

// Registration forms setup
function setupRegistrationForms() {
    const patientRegisterForm = document.getElementById('patientRegisterForm');
    const doctorRegisterForm = document.getElementById('doctorRegisterForm');
    
    if (patientRegisterForm) {
        patientRegisterForm.addEventListener('submit', handlePatientRegistration);
    }
    
    if (doctorRegisterForm) {
        doctorRegisterForm.addEventListener('submit', handleDoctorRegistration);
    }
}

// Handle patient registration
async function handlePatientRegistration(e) {
    e.preventDefault();
    
    if (!validateForm(e.target)) {
        return;
    }
    
    const formData = new FormData(e.target);
    const registrationData = {
        firstName: formData.get('firstName'),
        lastName: formData.get('lastName'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        password: formData.get('password'),
        dateOfBirth: formData.get('dateOfBirth'),
        gender: formData.get('gender'),
        address: {
            street: formData.get('address') || '',
            city: formData.get('city'),
            state: formData.get('state'),
            pincode: formData.get('pincode')
        },
        // Also include separate city, state, pincode for backend validation
        city: formData.get('city'),
        state: formData.get('state'),
        pincode: formData.get('pincode'),
        bloodGroup: formData.get('bloodGroup') || '',
        emergencyContact: {
            name: formData.get('emergencyContact'),
            phone: formData.get('emergencyPhone')
        },
        medicalHistory: formData.get('medicalHistory') ? [{
            condition: formData.get('medicalHistory'),
            diagnosedDate: new Date(),
            status: 'active'
        }] : [],
        allergies: formData.get('allergies') ? [{
            allergen: formData.get('allergies'),
            severity: 'mild'
        }] : [],
        currentMedications: formData.get('currentMedications') ? [{
            name: formData.get('currentMedications'),
            dosage: '',
            frequency: '',
            startDate: new Date()
        }] : []
    };
    
    // Show loading state
    showLoadingModal();
    
    // Debug: Log the registration data being sent
    console.log('Patient registration data:', JSON.stringify(registrationData, null, 2));
    
    try {
        const response = await fetch('/api/auth/patient/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(registrationData)
        });

        const data = await response.json();
        
        // Debug: Log the response
        console.log('Registration response status:', response.status);
        console.log('Registration response data:', JSON.stringify(data, null, 2));
        
        if (response.ok && data.success) {
            hideLoadingModal();
            
            // Store user data and token
            const userData = {
                ...data.data.patient,
                type: 'patient',
                token: data.data.token
            };
            
            localStorage.setItem('cliqpat_user', JSON.stringify(userData));
            
            showSuccessModal();
        } else {
            hideLoadingModal();
            
            // Show detailed error information
            let errorMessage = data.message || 'Registration failed';
            if (data.errors && data.errors.length > 0) {
                const errorDetails = data.errors.map(err => `${err.path || err.param || 'Field'}: ${err.msg || err.message}`).join('\n');
                errorMessage += '\n\nDetails:\n' + errorDetails;
            }
            
            console.error('Registration failed:', errorMessage);
            showNotification(errorMessage, 'error');
        }
    } catch (error) {
        console.error('Registration error:', error);
        hideLoadingModal();
        showNotification('Network error. Please try again.', 'error');
    }
}

// Handle doctor registration
async function handleDoctorRegistration(e) {
    e.preventDefault();
    
    console.log('Form submission started');
    
    if (!validateForm(e.target)) {
        console.log('Form validation failed');
        showNotification('Please fill in all required fields correctly', 'error');
        return;
    }
    
    console.log('Form validation passed, collecting data...');
    
    const formData = new FormData(e.target);
    
    // Debug: Log all form data
    console.log('All form data:');
    for (let [key, value] of formData.entries()) {
        console.log(`${key}: ${value}`);
    }
    
    const registrationData = {
        firstName: formData.get('firstName'),
        lastName: formData.get('lastName'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        password: formData.get('password'),
        specialization: formData.get('specialization'),
        experience: parseInt(formData.get('experience')),
        qualifications: formData.get('qualifications'),
        clinicName: formData.get('clinicName'),
        clinicAddress: {
            street: formData.get('clinicAddress') || '',
            city: formData.get('clinicCity'),
            state: formData.get('clinicState'),
            pincode: formData.get('clinicPincode')
        },
        clinicCity: formData.get('clinicCity'),
        clinicState: formData.get('clinicState'),
        clinicPincode: formData.get('clinicPincode'),
        consultationFee: parseInt(formData.get('consultationFee')),
        registrationFee: parseInt(formData.get('registrationFee')),
        clinicTimings: {
            monday: {
                start: formData.get('weekdayStart'),
                end: formData.get('weekdayEnd'),
                isOpen: true
            },
            tuesday: {
                start: formData.get('weekdayStart'),
                end: formData.get('weekdayEnd'),
                isOpen: true
            },
            wednesday: {
                start: formData.get('weekdayStart'),
                end: formData.get('weekdayEnd'),
                isOpen: true
            },
            thursday: {
                start: formData.get('weekdayStart'),
                end: formData.get('weekdayEnd'),
                isOpen: true
            },
            friday: {
                start: formData.get('weekdayStart'),
                end: formData.get('weekdayEnd'),
                isOpen: true
            },
            saturday: {
                start: formData.get('saturdayStart') || '09:00',
                end: formData.get('saturdayEnd') || '13:00',
                isOpen: !!formData.get('saturdayStart')
            },
            sunday: {
                start: formData.get('sundayStart') || '09:00',
                end: formData.get('sundayEnd') || '13:00',
                isOpen: !!formData.get('sundayStart')
            }
        }
    };
    
    // Show loading state
    showLoadingModal();
    
    // Debug: Log the registration data being sent
    console.log('Registration data being sent:', registrationData);
    
    try {
        // Try the main registration endpoint first
        let response = await fetch('/api/auth/doctor/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(registrationData)
        });
        
        // If main endpoint fails, try the alternative simple endpoint
        if (!response.ok) {
            console.log('Main endpoint failed, trying alternative...');
            response = await fetch('/api/auth/doctor/register-simple', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(registrationData)
            });
        }

        // Debug: Log the response
        console.log('Response status:', response.status);
        console.log('Response headers:', response.headers);

        const data = await response.json();
        console.log('Response data:', data);
        
        if (response.ok && data.success) {
            hideLoadingModal();
            showSuccessModal();
        } else {
            hideLoadingModal();
            showNotification(data.message || 'Registration failed', 'error');
        }
    } catch (error) {
        console.error('Registration error:', error);
        hideLoadingModal();
        showNotification('Network error. Please try again.', 'error');
    }
}

// Validate form
function validateForm(form) {
    const inputs = form.querySelectorAll('input[required], select[required], textarea[required]');
    let isValid = true;
    let missingFields = [];
    
    inputs.forEach(input => {
        if (!input.value.trim()) {
            showFieldError(input, 'This field is required');
            isValid = false;
            missingFields.push(input.name || input.id);
        } else {
            clearFieldError(input);
        }
    });
    
    // Validate password confirmation
    const password = form.querySelector('input[name="password"]');
    const confirmPassword = form.querySelector('input[name="confirmPassword"]');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
        showFieldError(confirmPassword, 'Passwords do not match');
        isValid = false;
    }
    
    // Debug: Log validation results
    if (!isValid) {
        console.log('Validation failed. Missing fields:', missingFields);
    } else {
        console.log('Form validation passed');
    }
    
    return isValid;
}

// Show field error
function showFieldError(field, message) {
    clearFieldError(field);
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'field-error';
    errorDiv.textContent = message;
    errorDiv.style.cssText = `
        color: #ef4444;
        font-size: 0.75rem;
        margin-top: 0.25rem;
        display: flex;
        align-items: center;
        gap: 0.25rem;
    `;
    
    field.parentElement.appendChild(errorDiv);
    field.classList.add('error');
    field.style.borderColor = '#ef4444';
}

// Clear field error
function clearFieldError(field) {
    const errorDiv = field.parentElement.querySelector('.field-error');
    if (errorDiv) {
        errorDiv.remove();
    }
    field.classList.remove('error');
    field.style.borderColor = '';
}

// Show loading modal
function showLoadingModal() {
    const modal = document.getElementById('loadingModal');
    if (modal) {
        modal.classList.add('active');
    }
}

// Hide loading modal
function hideLoadingModal() {
    const modal = document.getElementById('loadingModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

// Show success modal
function showSuccessModal() {
    const modal = document.getElementById('successModal');
    if (modal) {
        modal.classList.add('active');
    }
}

// Show notification
function showNotification(message, type = 'info') {
    if (window.AuthUtils && window.AuthUtils.showNotification) {
        window.AuthUtils.showNotification(message, type);
    } else {
        // Fallback notification
        alert(message);
    }
}

// Export functions for global use
window.RegistrationUtils = {
    nextStep,
    prevStep,
    validateStep,
    handleFileUpload,
    removeFile,
    showNotification
};

