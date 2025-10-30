// Authentication JavaScript for Cliqpat

document.addEventListener('DOMContentLoaded', function() {
    initializeAuth();
});

function initializeAuth() {
    setupPasswordToggles();
    setupFormValidation();
    setupLoginForms();
    setupSocialLogin();
}

// Password Toggle Setup
function setupPasswordToggles() {
    const passwordToggles = document.querySelectorAll('.password-toggle');
    
    passwordToggles.forEach(toggle => {
        toggle.addEventListener('click', function() {
            const input = this.parentElement.querySelector('input');
            const icon = this.querySelector('i');
            
            if (input.type === 'password') {
                input.type = 'text';
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            } else {
                input.type = 'password';
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
        });
    });
}

// Form Validation Setup
function setupFormValidation() {
    const forms = document.querySelectorAll('.auth-form');
    
    forms.forEach(form => {
        const inputs = form.querySelectorAll('input, select, textarea');
        
        inputs.forEach(input => {
            // Real-time validation
            input.addEventListener('blur', () => validateField(input));
            input.addEventListener('input', () => clearFieldError(input));
            
            // Email validation
            if (input.type === 'email') {
                input.addEventListener('blur', () => validateEmail(input));
            }
            
            // Phone validation
            if (input.type === 'tel') {
                input.addEventListener('blur', () => validatePhone(input));
            }
            
            // Password validation
            if (input.type === 'password') {
                input.addEventListener('blur', () => validatePassword(input));
            }
        });
    });
}

// Field Validation
function validateField(field) {
    const value = field.value.trim();
    const isRequired = field.hasAttribute('required');
    
    if (isRequired && !value) {
        showFieldError(field, 'This field is required');
        return false;
    }
    
    clearFieldError(field);
    return true;
}

// Email Validation
function validateEmail(field) {
    const email = field.value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (email && !emailRegex.test(email)) {
        showFieldError(field, 'Please enter a valid email address');
        return false;
    }
    
    return true;
}

// Phone Validation (Indian format)
function validatePhone(field) {
    const phone = field.value.replace(/\D/g, '');
    const phoneRegex = /^[6-9]\d{9}$/;
    
    if (phone && !phoneRegex.test(phone)) {
        showFieldError(field, 'Please enter a valid 10-digit phone number');
        return false;
    }
    
    return true;
}

// Password Validation
function validatePassword(field) {
    const password = field.value;
    const minLength = 8;
    
    if (password && password.length < minLength) {
        showFieldError(field, `Password must be at least ${minLength} characters long`);
        return false;
    }
    
    // Check for password strength (relaxed for testing)
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    // Only enforce basic length requirement for now
    if (password && password.length < minLength) {
        showFieldError(field, `Password must be at least ${minLength} characters long`);
        return false;
    }
    
    // Optional: Uncomment below for strict password requirements
    /*
    if (password && (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar)) {
        showFieldError(field, 'Password must contain uppercase, lowercase, number, and special character');
        return false;
    }
    */
    
    return true;
}

// Show Field Error
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

// Clear Field Error
function clearFieldError(field) {
    const errorDiv = field.parentElement.querySelector('.field-error');
    if (errorDiv) {
        errorDiv.remove();
    }
    field.classList.remove('error');
    field.style.borderColor = '';
}

// Login Forms Setup
function setupLoginForms() {
    const patientLoginForm = document.getElementById('patientLoginForm');
    const doctorLoginForm = document.getElementById('doctorLoginForm');
    
    if (patientLoginForm) {
        patientLoginForm.addEventListener('submit', handlePatientLogin);
    }
    
    if (doctorLoginForm) {
        doctorLoginForm.addEventListener('submit', handleDoctorLogin);
    }
}

// Handle Patient Login
async function handlePatientLogin(e) {
    e.preventDefault();
    
    if (!validateForm(e.target)) {
        return;
    }
    
    const formData = new FormData(e.target);
    const email = formData.get('email');
    const password = formData.get('password');
    const remember = formData.get('remember');
    
    // Show loading state
    showLoadingModal();
    
    try {
        const response = await fetch('/api/auth/patient/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();
        
        if (response.ok && data.success) {
            // Store user data and token
            const userData = {
                ...data.data.patient,
                type: 'patient',
                token: data.data.token
            };
            
            if (remember) {
                localStorage.setItem('cliqpat_user', JSON.stringify(userData));
            } else {
                sessionStorage.setItem('cliqpat_user', JSON.stringify(userData));
            }
            
            hideLoadingModal();
            showSuccessModal('patient');
        } else {
            hideLoadingModal();
            showNotification(data.message || 'Login failed', 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        hideLoadingModal();
        showNotification('Network error. Please try again.', 'error');
    }
}

// Handle Doctor Login
async function handleDoctorLogin(e) {
    e.preventDefault();
    
    console.log('Doctor login attempt started');
    
    if (!validateForm(e.target)) {
        console.log('Form validation failed');
        return;
    }
    
    const formData = new FormData(e.target);
    const email = formData.get('email');
    const password = formData.get('password');
    const remember = formData.get('remember');
    
    console.log('Login attempt for email:', email);
    
    // Show loading state
    showLoadingModal();
    
    try {
        console.log('Sending login request to /api/auth/doctor/login');
        const response = await fetch('/api/auth/doctor/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password })
        });

        console.log('Response status:', response.status);
        const data = await response.json();
        console.log('Response data:', data);
        
        if (response.ok && data.success) {
            console.log('Login successful, storing user data');
            // Store user data and token
            const userData = {
                ...data.data.doctor,
                type: 'doctor',
                token: data.data.token
            };
            
            if (remember) {
                localStorage.setItem('cliqpat_user', JSON.stringify(userData));
            } else {
                sessionStorage.setItem('cliqpat_user', JSON.stringify(userData));
            }
            
            hideLoadingModal();
            console.log('Showing success modal for doctor');
            showSuccessModal('doctor');
        } else {
            console.log('Login failed:', data.message);
            hideLoadingModal();
            showNotification(data.message || 'Login failed', 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        hideLoadingModal();
        showNotification('Network error. Please try again.', 'error');
    }
}

// Validate Form
function validateForm(form) {
    const inputs = form.querySelectorAll('input[required], select[required], textarea[required]');
    let isValid = true;
    
    inputs.forEach(input => {
        if (!validateField(input)) {
            isValid = false;
        }
    });
    
    return isValid;
}

// Social Login Setup
function setupSocialLogin() {
    const googleButtons = document.querySelectorAll('.btn-google');
    const facebookButtons = document.querySelectorAll('.btn-facebook');
    
    googleButtons.forEach(button => {
        button.addEventListener('click', handleGoogleLogin);
    });
    
    facebookButtons.forEach(button => {
        button.addEventListener('click', handleFacebookLogin);
    });
}

// Handle Google Login
function handleGoogleLogin(e) {
    e.preventDefault();
    
    // Show loading state
    const button = e.target;
    const originalText = button.innerHTML;
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Connecting...';
    button.disabled = true;
    
    // Simulate Google OAuth (for now)
    setTimeout(() => {
        // Simulate successful login
        const userData = {
            email: 'john.doe@gmail.com',
            type: 'patient',
            name: 'John Doe',
            id: 'P001',
            provider: 'google'
        };
        
        localStorage.setItem('cliqpat_user', JSON.stringify(userData));
        
        showSuccessModal('patient');
    }, 2000);
}

// Handle Facebook Login
function handleFacebookLogin(e) {
    e.preventDefault();
    
    // Show loading state
    const button = e.target;
    const originalText = button.innerHTML;
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Connecting...';
    button.disabled = true;
    
    // Simulate Facebook OAuth (for now)
    setTimeout(() => {
        // Simulate successful login
        const userData = {
            email: 'john.doe@facebook.com',
            type: 'patient',
            name: 'John Doe',
            id: 'P001',
            provider: 'facebook'
        };
        
        localStorage.setItem('cliqpat_user', JSON.stringify(userData));
        
        showSuccessModal('patient');
    }, 2000);
}

// Show Loading Modal
function showLoadingModal() {
    const modal = document.getElementById('loadingModal');
    if (modal) {
        modal.classList.add('active');
    }
}

// Hide Loading Modal
function hideLoadingModal() {
    const modal = document.getElementById('loadingModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

// Show Success Modal
function showSuccessModal(userType) {
    console.log('showSuccessModal called with userType:', userType);
    const modal = document.getElementById('successModal');
    if (modal) {
        console.log('Success modal found, showing it');
        modal.classList.add('active');
        
        // Redirect after 3 seconds
        setTimeout(() => {
            console.log('Redirecting after timeout');
            if (userType === 'patient') {
                console.log('Redirecting to patient dashboard');
                window.location.href = 'patient-dashboard.html';
            } else {
                console.log('Redirecting to doctor dashboard');
                window.location.href = 'doctor-dashboard.html';
            }
        }, 3000);
    } else {
        console.error('Success modal not found!');
    }
}

// Check Authentication Status
function checkAuthStatus() {
    const userData = localStorage.getItem('cliqpat_user') || sessionStorage.getItem('cliqpat_user');
    
    if (userData) {
        const user = JSON.parse(userData);
        
        // Redirect to appropriate dashboard
        if (user.type === 'patient') {
            window.location.href = 'patient-dashboard.html';
        } else {
            window.location.href = 'doctor-dashboard.html';
        }
    }
}

// Logout Function
function logout() {
    localStorage.removeItem('cliqpat_user');
    sessionStorage.removeItem('cliqpat_user');
    window.location.href = 'index.html';
}

// Forgot Password
function forgotPassword(email) {
    if (!email || !validateEmail({ value: email })) {
        showNotification('Please enter a valid email address', 'error');
        return;
    }
    
    // Show loading state
    showNotification('Sending password reset email...', 'info');
    
    // Simulate API call
    setTimeout(() => {
        showNotification('Password reset email sent! Check your inbox.', 'success');
    }, 2000);
}

// Auto-fill form from URL parameters
function autoFillForm() {
    const urlParams = new URLSearchParams(window.location.search);
    const email = urlParams.get('email');
    const type = urlParams.get('type');
    
    if (email) {
        const emailInput = document.querySelector('input[type="email"]');
        if (emailInput) {
            emailInput.value = email;
        }
    }
    
    if (type) {
        // Handle type-specific logic
        console.log('User type:', type);
    }
}

// Password Strength Indicator
function setupPasswordStrength() {
    const passwordInputs = document.querySelectorAll('input[type="password"]');
    
    passwordInputs.forEach(input => {
        input.addEventListener('input', function() {
            const password = this.value;
            const strength = calculatePasswordStrength(password);
            showPasswordStrength(this, strength);
        });
    });
}

// Calculate Password Strength
function calculatePasswordStrength(password) {
    let score = 0;
    
    if (password.length >= 8) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;
    
    if (score <= 2) return 'weak';
    if (score <= 3) return 'medium';
    if (score <= 4) return 'strong';
    return 'very-strong';
}

// Show Password Strength
function showPasswordStrength(input, strength) {
    let strengthIndicator = input.parentElement.querySelector('.password-strength');
    
    if (!strengthIndicator) {
        strengthIndicator = document.createElement('div');
        strengthIndicator.className = 'password-strength';
        input.parentElement.appendChild(strengthIndicator);
    }
    
    const colors = {
        'weak': '#ef4444',
        'medium': '#f59e0b',
        'strong': '#10b981',
        'very-strong': '#059669'
    };
    
    strengthIndicator.textContent = `Password strength: ${strength}`;
    strengthIndicator.style.color = colors[strength];
    strengthIndicator.style.fontSize = '0.75rem';
    strengthIndicator.style.marginTop = '0.25rem';
}

// Show Notification
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        </div>
        <button class="notification-close">&times;</button>
    `;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
        color: white;
        padding: 1rem;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        z-index: 10000;
        max-width: 400px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        animation: slideInRight 0.3s ease-out;
    `;
    
    // Add to body
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
    
    // Close button functionality
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
        notification.remove();
    });
}

// Initialize additional features
document.addEventListener('DOMContentLoaded', function() {
    autoFillForm();
    setupPasswordStrength();
    
    // Check if user is already logged in
    checkAuthStatus();
});

// Export functions for use in other scripts
window.AuthUtils = {
    logout,
    forgotPassword,
    checkAuthStatus,
    validateEmail,
    validatePhone,
    validatePassword,
    showNotification
};

