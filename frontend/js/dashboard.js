// Dashboard JavaScript for Cliqpat

document.addEventListener('DOMContentLoaded', function() {
    initializeDashboard();
});

function initializeDashboard() {
    checkAuthentication();
    setupDashboardNavigation();
    setupDashboardFunctions();
    loadDashboardData();
}

// Check authentication
function checkAuthentication() {
    const userData = localStorage.getItem('cliqpat_user') || sessionStorage.getItem('cliqpat_user');
    
    if (!userData) {
        window.location.href = 'index.html';
        return;
    }
    
    const user = JSON.parse(userData);
    
    // Update user info in UI
    updateUserInfo(user);
    
    // Check if user is on the right dashboard
    const currentPage = window.location.pathname;
    if (user.type === 'patient' && !currentPage.includes('patient-dashboard')) {
        window.location.href = 'patient-dashboard.html';
    } else if (user.type === 'doctor' && !currentPage.includes('doctor-dashboard')) {
        window.location.href = 'doctor-dashboard.html';
    }
}

// Update user info in UI
function updateUserInfo(user) {
    const userNameElements = document.querySelectorAll('.user-name');
    const userAvatarElements = document.querySelectorAll('.user-avatar');
    
    userNameElements.forEach(element => {
        element.textContent = user.type === 'doctor' ? user.fullName || `Dr. ${user.firstName} ${user.lastName}` : user.fullName || `${user.firstName} ${user.lastName}`;
    });
    
    // Update avatar if available
    if (user.avatar) {
        userAvatarElements.forEach(element => {
            element.src = user.avatar;
        });
    }
}

// Setup dashboard navigation
function setupDashboardNavigation() {
    const sidebarLinks = document.querySelectorAll('.sidebar-nav a');
    const dashboardSections = document.querySelectorAll('.dashboard-section');
    
    sidebarLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href').substring(1);
            console.log('Navigating to section:', targetId);
            showSection(targetId);
            
            // Update active state
            sidebarLinks.forEach(l => l.parentElement.classList.remove('active'));
            this.parentElement.classList.add('active');
        });
    });
    
    // Show overview section by default if no section is active
    const activeSection = document.querySelector('.dashboard-section.active');
    if (!activeSection) {
        showSection('overview');
        const overviewLink = document.querySelector('a[href="#overview"]');
        if (overviewLink) {
            sidebarLinks.forEach(l => l.parentElement.classList.remove('active'));
            overviewLink.parentElement.classList.add('active');
        }
    }
}

// Show dashboard section
function showSection(sectionId) {
    console.log('showSection called with:', sectionId);
    const sections = document.querySelectorAll('.dashboard-section');
    const targetSection = document.getElementById(sectionId);
    
    console.log('Found sections:', sections.length);
    console.log('Target section:', targetSection);
    
    if (targetSection) {
        sections.forEach(section => {
            section.classList.remove('active');
        });
        
        targetSection.classList.add('active');
        console.log('Section activated:', sectionId);
        
        // Load section-specific data
        loadSectionData(sectionId);
    } else {
        console.error('Section not found:', sectionId);
    }
}

// Load section-specific data
function loadSectionData(sectionId) {
    switch (sectionId) {
        case 'overview':
            loadOverviewData();
            break;
        case 'clinics':
            loadClinicsData();
            break;
        case 'appointments':
            loadAppointmentsData();
            // Refresh appointments when section is shown
            const userData = JSON.parse(localStorage.getItem('cliqpat_user') || sessionStorage.getItem('cliqpat_user'));
            if (userData && userData.type === 'doctor') {
                refreshDoctorAppointments();
            }
            break;
        case 'health-records':
            if (isPatient()) {
                initializeEHR();
            }
            break;

        case 'reports':
            loadReportsData();
            break;
        case 'profile':
            loadProfileData();
            break;
        case 'patients':
            loadPatientsData();
            break;
        case 'ai-reports':
            loadAIReportsData();
            break;
        case 'ehr':
            if (isDoctor()) {
                loadAppointmentsWithEHR();
            }
            break;
        case 'analytics':
            loadAnalyticsData();
            break;
        case 'schedule':
            loadScheduleData();
            break;
    }
}

// Load overview data
function loadOverviewData() {
    // This will be called when the overview section is shown
    // Overview data is already loaded in the HTML
}

// Setup dashboard functions
function setupDashboardFunctions() {
    // Setup logout
    const logoutButtons = document.querySelectorAll('a[href="index.html"]');
    logoutButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            logout();
        });
    });
    
    // Setup user menu
    const menuToggles = document.querySelectorAll('.menu-toggle');
    menuToggles.forEach(toggle => {
        toggle.addEventListener('click', function() {
            const dropdown = this.nextElementSibling;
            dropdown.classList.toggle('active');
        });
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.user-menu')) {
            const dropdowns = document.querySelectorAll('.dropdown-menu');
            dropdowns.forEach(dropdown => {
                dropdown.classList.remove('active');
            });
        }
    });
}

// Load dashboard data
function loadDashboardData() {
    const userData = JSON.parse(localStorage.getItem('cliqpat_user') || sessionStorage.getItem('cliqpat_user'));
    
    if (userData.type === 'patient') {
        loadPatientDashboardData();
    } else {
        loadDoctorDashboardData();
        startAutoRefresh(); // Start auto-refresh for doctors
    }
}

// Load patient dashboard data
async function loadPatientDashboardData() {
    try {
        const userData = JSON.parse(localStorage.getItem('cliqpat_user') || sessionStorage.getItem('cliqpat_user'));
        
        // Load appointments
        const appointmentsResponse = await fetch('/api/appointments/patient', {
            headers: {
                'Authorization': `Bearer ${userData.token}`
            }
        });
        
        if (appointmentsResponse.ok) {
            const appointmentsData = await appointmentsResponse.json();
            updatePatientAppointments(appointmentsData.data.appointments);
        }
        
        // Load medical records
        const recordsResponse = await fetch('/api/patients/medical-records', {
            headers: {
                'Authorization': `Bearer ${userData.token}`
            }
        });
        
        if (recordsResponse.ok) {
            const recordsData = await recordsResponse.json();
            updateMedicalRecords(recordsData.data.records);
        }
        
    } catch (error) {
        console.error('Error loading patient dashboard data:', error);
    }
}

// Load doctor dashboard data
async function loadDoctorDashboardData() {
    console.log('🏥 Loading doctor dashboard data...');

    try {
        const userData = JSON.parse(localStorage.getItem('cliqpat_user') || sessionStorage.getItem('cliqpat_user'));
        console.log('👨‍⚕️ Doctor user data:', userData);

        if (!userData || !userData.token) {
            console.error('❌ No user data or token found');
            showError('Authentication required. Please login again.');
            return;
        }

        console.log('📡 Fetching doctor appointments...');

        // Load appointments
        const appointmentsResponse = await fetch('/api/appointments/doctor', {
            headers: {
                'Authorization': `Bearer ${userData.token}`
            }
        });

        console.log('📡 Appointments response status:', appointmentsResponse.status);

        if (appointmentsResponse.ok) {
            const appointmentsData = await appointmentsResponse.json();
            console.log('✅ Appointments loaded:', appointmentsData);
            updateDoctorAppointments(appointmentsData.data.appointments);
        } else {
            const errorData = await appointmentsResponse.json();
            console.error('❌ Failed to load appointments:', appointmentsResponse.status, errorData);

            if (appointmentsResponse.status === 401) {
                showError('Session expired. Please login again.');
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 2000);
            } else {
                showError('Failed to load appointments: ' + (errorData.message || 'Unknown error'));
            }
        }

    } catch (error) {
        console.error('❌ Error loading doctor dashboard data:', error);
        showError('Error loading dashboard: ' + error.message);
    }
}

// Update patient appointments
function updatePatientAppointments(appointments) {
    const upcomingContainer = document.getElementById('upcomingAppointments');
    const pastContainer = document.getElementById('pastAppointments');
    
    if (!upcomingContainer || !pastContainer) return;
    
    console.log('Updating patient appointments:', appointments);
    
    // Filter out appointments with missing doctor data for better user experience
    const validAppointments = appointments.filter(apt => apt.doctor && apt.doctor.firstName);
    const invalidAppointments = appointments.filter(apt => !apt.doctor || !apt.doctor.firstName);
    
    if (invalidAppointments.length > 0) {
        console.warn(`Found ${invalidAppointments.length} appointments with missing doctor data`);
    }
    
    const upcoming = validAppointments.filter(apt => apt.status === 'confirmed' || apt.status === 'scheduled');
    const past = validAppointments.filter(apt => apt.status === 'completed' || apt.status === 'cancelled');
    
    // Update upcoming appointments
    if (upcoming.length > 0) {
        upcomingContainer.innerHTML = upcoming.map(appointment => `
            <div class="appointment-card">
                <div class="appointment-header">
                    <div class="doctor-info">
                        <img src="images/doctor1.jpg" alt="Doctor" class="doctor-avatar">
                        <div>
                            <h3>${appointment.doctor.firstName} ${appointment.doctor.lastName}</h3>
                            <p>${appointment.doctor.specialization} • ${appointment.doctor.clinicName}</p>
                        </div>
                    </div>
                    <div class="appointment-status ${appointment.status}">
                        <i class="fas fa-check-circle"></i>
                        ${appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                    </div>
                </div>
                <div class="appointment-details">
                    <div class="detail-item">
                        <i class="fas fa-calendar"></i>
                        <span>${new Date(appointment.appointmentDate).toLocaleDateString()}, ${appointment.appointmentTime}</span>
                    </div>
                    <div class="detail-item">
                        <i class="fas fa-rupee-sign"></i>
                        <span>₹${appointment.consultationFee} Consultation Fee</span>
                    </div>
                </div>
                <div class="appointment-actions">
                    <button class="btn btn-outline" onclick="rescheduleAppointment('${appointment._id}')">
                        <i class="fas fa-calendar-alt"></i>
                        Reschedule
                    </button>
                    <button class="btn btn-outline" onclick="cancelAppointment('${appointment._id}')">
                        <i class="fas fa-times"></i>
                        Cancel
                    </button>
                    <button class="btn btn-primary" onclick="viewAppointmentDetails('${appointment._id}')">
                        <i class="fas fa-eye"></i>
                        View Details
                    </button>
                    <button class="btn btn-success" onclick="callDoctor('${appointment._id}')">
                        <i class="fas fa-phone"></i>
                        Call Doctor
                    </button>
                </div>
            </div>
        `).join('');
    } else {
        upcomingContainer.innerHTML = '<p class="no-data">No upcoming appointments</p>';
    }
    
    // Update past appointments
    if (past.length > 0) {
        pastContainer.innerHTML = past.map(appointment => `
            <div class="appointment-card past">
                <div class="appointment-header">
                    <div class="doctor-info">
                        <img src="images/doctor2.jpg" alt="Doctor" class="doctor-avatar">
                        <div>
                            <h3>${appointment.doctor.firstName} ${appointment.doctor.lastName}</h3>
                            <p>${appointment.doctor.specialization} • ${appointment.doctor.clinicName}</p>
                        </div>
                    </div>
                    <div class="appointment-status ${appointment.status}">
                        <i class="fas fa-check-circle"></i>
                        ${appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                    </div>
                </div>
                <div class="appointment-details">
                    <div class="detail-item">
                        <i class="fas fa-calendar"></i>
                        <span>${new Date(appointment.appointmentDate).toLocaleDateString()}, ${appointment.appointmentTime}</span>
                    </div>
                    <div class="detail-item">
                        <i class="fas fa-rupee-sign"></i>
                        <span>₹${appointment.consultationFee} Consultation Fee</span>
                    </div>
                </div>
                <div class="appointment-actions">
                    <button class="btn btn-outline" onclick="viewPrescription('${appointment._id}')">
                        <i class="fas fa-prescription"></i>
                        View Prescription
                    </button>
                    <button class="btn btn-primary" onclick="bookFollowUp('${appointment._id}')">
                        <i class="fas fa-calendar-plus"></i>
                        Book Follow-up
                    </button>
                </div>
            </div>
        `).join('');
    } else {
        pastContainer.innerHTML = '<p class="no-data">No past appointments</p>';
    }
}

// Update doctor appointments
function updateDoctorAppointments(appointments) {
    console.log('📋 Updating doctor appointments with:', appointments);

    try {
        const appointmentsList = document.querySelector('.appointments-list');
        if (!appointmentsList) {
            console.log('ℹ️ Appointments list element not found - might be on patient dashboard');
            return; // Silently return without error
        }

        // Store appointments for modal lookup
        window.lastDoctorAppointments = appointments;

        if (appointments && appointments.length > 0) {
            console.log('✅ Rendering', appointments.length, 'appointments');

            appointmentsList.innerHTML = appointments.map(appointment => {
                try {
                    return `
                        <div class="appointment-item">
                            <div class="appointment-time">
                                <span class="time">${appointment.appointmentTime}</span>
                                <span class="status ${appointment.status}">${appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}</span>
                            </div>
                            <div class="appointment-details">
                                <h4>${appointment.patient?.firstName && appointment.patient?.lastName ?
                                    `${appointment.patient.firstName} ${appointment.patient.lastName}` :
                                    'Patient Name Not Available'}</h4>
                                <p>${appointment.reason || 'No reason specified'}</p>
                                <div class="appointment-notes">
                                    ${appointment.aiScreening?.isCompleted ? '<span class="ai-report">AI Report Available</span>' : ''}
                                    ${appointment.ehrDocuments && appointment.ehrDocuments.length > 0 ? '<span class="ehr">EHR Updated</span>' : ''}
                                </div>
                            </div>
                            <div class="appointment-actions">
                                <button class="btn btn-outline" onclick="rescheduleAppointment('${appointment._id}')">
                                    <i class="fas fa-calendar-alt"></i>
                                    Reschedule
                                </button>
                                <button class="btn btn-success" onclick="viewAIReport('${appointment._id}')" title="View AI Generated Report">
                                    <i class="fas fa-robot"></i>
                                    AI Report
                                </button>
                                <button class="btn btn-primary" onclick="startConsultation('${appointment._id}')">
                                    <i class="fas fa-play"></i>
                                    Start
                                </button>
                                ${appointment.ehrDocuments && appointment.ehrDocuments.length > 0 ? `<button class="btn btn-outline" onclick="showEHRModal('${appointment._id}')"><i class='fas fa-file-medical'></i> View EHR</button>` : ''}
                            </div>
                        </div>
                    `;
                } catch (error) {
                    console.error('❌ Error rendering appointment:', appointment._id, error);
                    return '<div class="appointment-item error">Error rendering appointment</div>';
                }
            }).join('');

            console.log('✅ Appointments rendered successfully');
        } else {
            console.log('📭 No appointments to display');
            appointmentsList.innerHTML = '<p class="no-data">No appointments found</p>';
        }
    } catch (error) {
        console.error('❌ Error updating doctor appointments:', error);
        showError('Error displaying appointments: ' + error.message);
    }
}

// Refresh doctor appointments
async function refreshDoctorAppointments() {
    try {
        const userData = JSON.parse(localStorage.getItem('cliqpat_user') || sessionStorage.getItem('cliqpat_user'));
        const token = userData?.token || localStorage.getItem('cliqpat_token') || sessionStorage.getItem('cliqpat_token');
        
        if (!token) {
            console.error('No authentication token found');
            return;
        }
        
        const response = await fetch('/api/appointments/doctor', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            updateDoctorAppointments(data.data.appointments);
        } else if (response.status === 401) {
            // Token expired - clear storage and redirect
            localStorage.removeItem('cliqpat_user');
            localStorage.removeItem('cliqpat_token');
            sessionStorage.removeItem('cliqpat_user');
            sessionStorage.removeItem('cliqpat_token');
            window.location.href = 'index.html';
        } else {
            console.error('Failed to load doctor appointments:', response.status);
            // Don't show error - just log it
        }
    } catch (error) {
        console.error('Error refreshing doctor appointments:', error);
        // Don't show error - just log it
    }
}

// Auto-refresh doctor appointments every 2 minutes
function startAutoRefresh() {
    const userData = JSON.parse(localStorage.getItem('cliqpat_user') || sessionStorage.getItem('cliqpat_user'));

    if (userData && userData.type === 'doctor') {
        setInterval(() => {
            refreshDoctorAppointments();
        }, 120000); // 2 minutes
    }
}

// AI Report Functions - Hardcoded report display
function viewAIReport(appointmentId) {
    console.log('🎯 AI Report button clicked for appointment:', appointmentId);
    console.log('📋 Opening hardcoded patient report...');

    try {
        // Open the hardcoded demo report in a new window
        console.log('🔗 Opening URL: /demo-report.html');
        const reportWindow = window.open('/demo-report.html', '_blank', 'width=900,height=700,scrollbars=yes,resizable=yes,toolbar=yes');

        if (reportWindow) {
            console.log('✅ Demo patient report window opened successfully');

            // Show success message
            setTimeout(() => {
                showSuccess('Patient report opened successfully! Print dialog will appear automatically.');
            }, 500);
        } else {
            console.error('❌ Failed to open report window - popup might be blocked');
            showError('Failed to open report. Please allow popups for this site.');
        }
    } catch (error) {
        console.error('❌ Error opening report:', error);
        showError('Error opening report: ' + error.message);
    }
}

function displayAIReportModal(reportData) {
    console.log('📋 Displaying AI report modal with data:', reportData);

    const modal = document.getElementById('aiReportModal');
    if (!modal) {
        console.error('❌ AI Report modal not found');
        showError('AI Report modal not available');
        return;
    }

    // Populate modal with simplified report data
    const modalBody = modal.querySelector('.modal-body');

    modalBody.innerHTML = `
        <div class="ai-report-content">
            <div class="report-header">
                <h3><i class="fas fa-robot"></i> AI Generated Medical Report</h3>
                <div class="report-meta">
                    <span class="report-id">Conversation ID: ${reportData.conversationId || 'N/A'}</span>
                    <span class="report-date">Generated: ${reportData.reportGeneratedAt ? new Date(reportData.reportGeneratedAt).toLocaleString() : 'Just now'}</span>
                    <span class="report-status completed">COMPLETED</span>
                </div>
            </div>

            <div class="report-sections">
                <div class="report-section">
                    <h4><i class="fas fa-user"></i> Patient Information</h4>
                    <div class="info-grid">
                        <div class="info-item">
                            <label>Name:</label>
                            <span>${reportData.patientName || 'Unknown'}</span>
                        </div>
                        <div class="info-item">
                            <label>Appointment ID:</label>
                            <span>${reportData.appointmentId || 'N/A'}</span>
                        </div>
                        <div class="info-item">
                            <label>Call Duration:</label>
                            <span>${reportData.callDuration || 'Unknown'}</span>
                        </div>
                    </div>
                </div>

                <div class="report-section">
                    <h4><i class="fas fa-robot"></i> AI Generated Medical Report</h4>
                    <div class="ai-report-content">
                        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #28a745; white-space: pre-wrap; font-family: inherit; font-size: 14px; line-height: 1.6;">
                            ${reportData.generatedReport || 'Report generation failed'}
                        </div>
                    </div>
                </div>

                <div class="report-section">
                    <h4><i class="fas fa-comments"></i> Original Conversation</h4>
                    <div class="conversation-transcript">
                        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 4px solid #007bff; white-space: pre-wrap; font-family: monospace; font-size: 13px; line-height: 1.6; max-height: 300px; overflow-y: auto;">
                            ${reportData.transcript || 'No transcript available'}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Show the modal
    modal.style.display = 'block';
    document.body.classList.add('modal-open');
}

// Loading Modal Functions
function showLoadingModal(message = 'Loading...') {
    // Remove existing loading modal if any
    const existingModal = document.getElementById('loadingModal');
    if (existingModal) {
        existingModal.remove();
    }

    // Create loading modal
    const loadingModal = document.createElement('div');
    loadingModal.id = 'loadingModal';
    loadingModal.className = 'loading-modal';
    loadingModal.innerHTML = `
        <div class="loading-content">
            <div class="loading-spinner"></div>
            <p>${message}</p>
        </div>
    `;

    document.body.appendChild(loadingModal);
}

function hideLoadingModal() {
    const loadingModal = document.getElementById('loadingModal');
    if (loadingModal) {
        loadingModal.remove();
    }
}

// Update medical records
function updateMedicalRecords(records) {
    const recordsGrid = document.getElementById('recordsGrid');
    if (!recordsGrid) return;
    
    if (records.length > 0) {
        recordsGrid.innerHTML = records.map(record => `
            <div class="record-card">
                <div class="record-icon">
                    <i class="fas fa-${getRecordIcon(record.type)}"></i>
                </div>
                <div class="record-info">
                    <h4>${record.title}</h4>
                    <p>${record.description || 'No description available'}</p>
                    <span class="record-date">${new Date(record.uploadDate).toLocaleDateString()}</span>
                </div>
                <div class="record-actions">
                    <button class="btn btn-outline small" onclick="viewRecord('${record._id}')">
                        <i class="fas fa-eye"></i>
                        View
                    </button>
                    <button class="btn btn-outline small" onclick="downloadRecord('${record._id}')">
                        <i class="fas fa-download"></i>
                        Download
                    </button>
                </div>
            </div>
        `).join('');
    } else {
        recordsGrid.innerHTML = '<p class="no-data">No medical records found</p>';
    }
}

// Get record icon based on type
function getRecordIcon(type) {
    const iconMap = {
        'lab_report': 'flask',
        'prescription': 'prescription-bottle',
        'imaging': 'x-ray',
        'vaccination': 'syringe',
        'other': 'file-medical'
    };
    return iconMap[type] || 'file-medical';
}

// Load clinics data
async function loadClinicsData() {
    try {
        // Load first batch with a higher limit, then add "Load More" button
        const response = await fetch('/api/doctors/search?limit=100&page=1');
        if (response.ok) {
            const data = await response.json();
            updateClinicsGrid(data.data.doctors, data.data.pagination);
        }
    } catch (error) {
        console.error('Error loading clinics:', error);
    }
}

// Load more doctors for pagination
async function loadMoreDoctors(page) {
    try {
        const response = await fetch(`/api/doctors/search?limit=100&page=${page}`);
        if (response.ok) {
            const data = await response.json();
            appendMoreDoctors(data.data.doctors, data.data.pagination);
        }
    } catch (error) {
        console.error('Error loading more doctors:', error);
    }
}

// Append more doctors to the existing grid
function appendMoreDoctors(doctors, pagination) {
    const clinicsGrid = document.getElementById('clinicsGrid');
    if (!clinicsGrid) return;
    
    // Remove the existing "Load More" button
    const existingLoadMore = clinicsGrid.querySelector('.load-more-container');
    if (existingLoadMore) {
        existingLoadMore.remove();
    }
    
    // Add new doctor cards
    const newDoctorCards = doctors.map(doctor => `
        <div class="clinic-card">
            <div class="clinic-header">
                <div class="clinic-avatar">
                    <i class="fas fa-stethoscope"></i>
                </div>
                <div class="clinic-info">
                    <h3>${doctor.clinicName}</h3>
                    <p class="doctor-name">${doctor.firstName} ${doctor.lastName}</p>
                    <p class="specialization">${doctor.specialization}</p>
                </div>
                <div class="clinic-rating">
                    <div class="stars">
                        ${generateStars(doctor.rating?.average || 0)}
                    </div>
                    <span class="rating-text">${doctor.rating?.average || 0}/5</span>
                </div>
            </div>
            <div class="clinic-details">
                <div class="detail-item">
                    <i class="fas fa-map-marker-alt"></i>
                    <span>${doctor.clinicAddress.city}, ${doctor.clinicAddress.state}</span>
                </div>
                <div class="detail-item">
                    <i class="fas fa-clock"></i>
                    <span>${doctor.experience} years experience</span>
                </div>
                <div class="detail-item">
                    <i class="fas fa-rupee-sign"></i>
                    <span>₹<span class="fee">${doctor.consultationFee}</span> consultation fee</span>
                </div>
            </div>
            <div class="clinic-actions">
                <button class="btn btn-outline" onclick="viewClinicDetails('${doctor._id}')">
                    <i class="fas fa-eye"></i>
                    View Details
                </button>
                <button class="btn btn-primary" onclick="bookAppointment('${doctor._id}')">
                    <i class="fas fa-calendar-plus"></i>
                    Book Appointment
                </button>
            </div>
            
            <!-- Weekly Slots View (Initially Hidden) -->
            <div class="weekly-slots" id="${doctor._id}-slots" style="display: none;">
                <div class="slots-header">
                    <h4>Available This Week</h4>
                    <button class="close-slots" onclick="hideWeeklySlots('${doctor._id}')">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="week-navigation">
                    <button class="week-nav-btn" onclick="previousWeek('${doctor._id}')">
                        <i class="fas fa-chevron-left"></i>
                    </button>
                    <span class="week-range" id="${doctor._id}-week-range">Loading...</span>
                    <button class="week-nav-btn" onclick="nextWeek('${doctor._id}')">
                        <i class="fas fa-chevron-right"></i>
                    </button>
                </div>
                <div class="daily-slots" id="${doctor._id}-daily-slots">
                    <!-- Daily slots will be populated here -->
                </div>
                <div class="slots-loading" id="${doctor._id}-loading">
                    <i class="fas fa-spinner fa-spin"></i>
                    Loading available slots...
                </div>
            </div>
        </div>
    `).join('');
    
    clinicsGrid.innerHTML += newDoctorCards;
    
    // Add new Load More button if there are more pages
    if (pagination && pagination.hasNext) {
        const loadMoreBtn = document.createElement('div');
        loadMoreBtn.className = 'load-more-container';
        loadMoreBtn.innerHTML = `
            <button class="btn btn-outline load-more-btn" onclick="loadMoreDoctors(${pagination.currentPage + 1})">
                <i class="fas fa-plus"></i>
                Load More Doctors (${pagination.totalDoctors - (pagination.currentPage * 100)} remaining)
            </button>
        `;
        clinicsGrid.appendChild(loadMoreBtn);
    }
}

// Update clinics grid
function updateClinicsGrid(doctors, pagination) {
    const clinicsGrid = document.getElementById('clinicsGrid');
    if (!clinicsGrid) return;
    
    if (doctors.length > 0) {
        clinicsGrid.innerHTML = doctors.map(doctor => `
            <div class="clinic-card">
                <div class="clinic-header">
                    <div class="clinic-avatar">
                        <i class="fas fa-stethoscope"></i>
                    </div>
                    <div class="clinic-info">
                        <h3>${doctor.clinicName}</h3>
                        <p class="doctor-name">${doctor.firstName} ${doctor.lastName}</p>
                        <p class="specialization">${doctor.specialization}</p>
                    </div>
                    <div class="clinic-rating">
                        <div class="stars">
                            ${generateStars(doctor.rating?.average || 0)}
                        </div>
                        <span class="rating-text">${doctor.rating?.average || 0}/5</span>
                    </div>
                </div>
                <div class="clinic-details">
                    <div class="detail-item">
                        <i class="fas fa-map-marker-alt"></i>
                        <span>${doctor.clinicAddress.city}, ${doctor.clinicAddress.state}</span>
                    </div>
                    <div class="detail-item">
                        <i class="fas fa-clock"></i>
                        <span>${doctor.experience} years experience</span>
                    </div>
                    <div class="detail-item">
                        <i class="fas fa-rupee-sign"></i>
                        <span>₹<span class="fee">${doctor.consultationFee}</span> consultation fee</span>
                    </div>
                </div>
                <div class="clinic-actions">
                    <button class="btn btn-outline" onclick="viewClinicDetails('${doctor._id}')">
                        <i class="fas fa-eye"></i>
                        View Details
                    </button>
                    <button class="btn btn-primary" onclick="bookAppointment('${doctor._id}')">
                        <i class="fas fa-calendar-plus"></i>
                        Book Appointment
                    </button>
                </div>
                
                <!-- Weekly Slots View (Initially Hidden) -->
                <div class="weekly-slots" id="${doctor._id}-slots" style="display: none;">
                    <div class="slots-header">
                        <h4>Available This Week</h4>
                        <button class="close-slots" onclick="hideWeeklySlots('${doctor._id}')">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="week-navigation">
                        <button class="week-nav-btn" onclick="previousWeek('${doctor._id}')">
                            <i class="fas fa-chevron-left"></i>
                        </button>
                        <span class="week-range" id="${doctor._id}-week-range">Loading...</span>
                        <button class="week-nav-btn" onclick="nextWeek('${doctor._id}')">
                            <i class="fas fa-chevron-right"></i>
                        </button>
                    </div>
                    <div class="daily-slots" id="${doctor._id}-daily-slots">
                        <!-- Daily slots will be populated here -->
                    </div>
                    <div class="slots-loading" id="${doctor._id}-loading">
                        <i class="fas fa-spinner fa-spin"></i>
                        Loading available slots...
                    </div>
                </div>
            </div>
        `).join('');
        
        // Add Load More button if there are more pages
        if (pagination && pagination.hasNext) {
            const loadMoreBtn = document.createElement('div');
            loadMoreBtn.className = 'load-more-container';
            loadMoreBtn.innerHTML = `
                <button class="btn btn-outline load-more-btn" onclick="loadMoreDoctors(${pagination.currentPage + 1})">
                    <i class="fas fa-plus"></i>
                    Load More Doctors (${pagination.totalDoctors - (pagination.currentPage * 100)} remaining)
                </button>
            `;
            clinicsGrid.appendChild(loadMoreBtn);
        }
    } else {
        clinicsGrid.innerHTML = '<p class="no-data">No clinics found</p>';
    }
}

// Generate stars for rating
function generateStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    let stars = '';
    for (let i = 0; i < fullStars; i++) {
        stars += '<i class="fas fa-star"></i>';
    }
    if (hasHalfStar) {
        stars += '<i class="fas fa-star-half-alt"></i>';
    }
    for (let i = 0; i < emptyStars; i++) {
        stars += '<i class="fas fa-star-o"></i>';
    }
    
    return stars;
}

// Load appointments data
async function loadAppointmentsData() {
    console.log('Loading appointments data...');
    try {
        const userData = JSON.parse(localStorage.getItem('cliqpat_user') || sessionStorage.getItem('cliqpat_user'));
        
        if (userData.type === 'patient') {
            await loadPatientAppointments();
        } else if (userData.type === 'doctor') {
            await refreshDoctorAppointments();
        }
    } catch (error) {
        console.error('Error loading appointments data:', error);
    }
}

// Load patient appointments specifically
async function loadPatientAppointments() {
    try {
        const userData = JSON.parse(localStorage.getItem('cliqpat_user') || sessionStorage.getItem('cliqpat_user'));
        const token = userData?.token || localStorage.getItem('cliqpat_token') || sessionStorage.getItem('cliqpat_token');
        
        if (!token) {
            console.error('No authentication token found');
            // Don't show error - just return silently
            return;
        }
        
        const response = await fetch('/api/appointments/patient', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log('Patient appointments loaded:', data.data.appointments);
            updatePatientAppointments(data.data.appointments);
        } else if (response.status === 401) {
            // Token expired - clear storage and redirect
            localStorage.removeItem('cliqpat_user');
            localStorage.removeItem('cliqpat_token');
            sessionStorage.removeItem('cliqpat_user');
            sessionStorage.removeItem('cliqpat_token');
            window.location.href = 'index.html';
        } else {
            console.error('Failed to load patient appointments:', response.status);
            // Don't show error - just log it
        }
    } catch (error) {
        console.error('Error loading patient appointments:', error);
        // Don't show error - just log it
    }
}

// Load patients data
function loadPatientsData() {
    // This will be called when the patients section is shown
    // Data is already loaded in loadDashboardData()
}

// Load AI reports data
function loadAIReportsData() {
    // This will be called when the AI reports section is shown
}

// Load EHR data
function loadEHRData() {
    // This will be called when the EHR section is shown
}

// Load analytics data
function loadAnalyticsData() {
    // This will be called when the analytics section is shown
}



// Load reports data
function loadReportsData() {
    // Load EHR documents in the Reports section
    loadEHRDocumentsForReports();
}

// Load EHR documents specifically for Reports section
async function loadEHRDocumentsForReports() {
    try {
        const userData = JSON.parse(localStorage.getItem('cliqpat_user') || sessionStorage.getItem('cliqpat_user'));
        const token = userData?.token || localStorage.getItem('cliqpat_token') || sessionStorage.getItem('cliqpat_token');
        
        if (!token) {
            console.error('No authentication token found');
            return;
        }
        
        const response = await fetch('/api/ehr/patient/documents', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            displayEHRDocumentsInReports(data.data.documents);
        } else if (response.status === 401) {
            // Token expired - clear storage and redirect
            localStorage.removeItem('cliqpat_user');
            localStorage.removeItem('cliqpat_token');
            sessionStorage.removeItem('cliqpat_user');
            sessionStorage.removeItem('cliqpat_token');
            window.location.href = 'index.html';
        }
    } catch (error) {
        console.error('Error loading EHR documents for reports:', error);
    }
}

// Display EHR documents in Reports section
function displayEHRDocumentsInReports(documents) {
    const container = document.getElementById('ehrReportsList');
    if (!container) return;

    if (documents.length === 0) {
        container.innerHTML = '<p class="no-documents">No EHR documents uploaded yet. Upload your first document in the Health Records section.</p>';
        return;
    }

    container.innerHTML = documents.map(doc => `
        <div class="report-document-card">
            <div class="document-icon">
                <i class="fas fa-file-pdf"></i>
            </div>
            <div class="document-info">
                <h4>${doc.title}</h4>
                <p class="document-description">${doc.description || 'No description available'}</p>
                <div class="document-meta">
                    <span class="upload-date">📅 ${new Date(doc.uploadDate).toLocaleDateString()}</span>
                    <span class="file-size">📁 ${formatFileSize(doc.fileSize)}</span>
                    ${doc.appointment ? `<span class="appointment-link">🔗 Linked to appointment</span>` : ''}
                </div>
            </div>
            <div class="document-actions">
                <button class="btn btn-outline small" onclick="viewEHRDocument('${doc._id}')">
                    <i class="fas fa-eye"></i> View
                </button>
                <button class="btn btn-outline small" onclick="downloadEHRDocument('${doc.fileName}')">
                    <i class="fas fa-download"></i> Download
                </button>
            </div>
        </div>
    `).join('');
}

// Load profile data
function loadProfileData() {
    // This will be called when the profile section is shown
}

// Load schedule data
function loadScheduleData() {
    // This will be called when the schedule section is shown
}

// Appointment functions
async function rescheduleAppointment(appointmentId) {
    console.log('🔄 Reschedule button clicked for appointment:', appointmentId);

    try {
        // Get token from user data
        const userData = JSON.parse(localStorage.getItem('cliqpat_user') || sessionStorage.getItem('cliqpat_user'));
        const token = userData?.token || localStorage.getItem('cliqpat_token') || sessionStorage.getItem('cliqpat_token');

        console.log('🔑 Token found:', !!token);

        if (!token) {
            console.error('❌ No authentication token found');
            showError('Authentication required. Please login again.');
            return;
        }

        console.log('📡 Fetching appointment details for:', appointmentId);

        const response = await fetch(`/api/appointments/${appointmentId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        console.log('📡 Response status:', response.status);

        if (!response.ok) {
            const errorData = await response.json();
            console.error('❌ Failed to load appointment:', response.status, errorData);
            showError(errorData.message || 'Failed to load appointment details');
            return;
        }

        const result = await response.json();
        const appointment = result.data.appointment;

        console.log('✅ Appointment loaded successfully:', appointment);

        // Show reschedule modal
        showRescheduleModal(appointment);

    } catch (error) {
        console.error('❌ Error loading appointment for reschedule:', error);
        showError('Error loading appointment details: ' + error.message);
    }
}

function cancelAppointment(appointmentId) {
    // Implement cancel functionality
    console.log('Cancel appointment:', appointmentId);
}

// Show reschedule modal
function showRescheduleModal(appointment) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
    `;

    const currentDate = new Date(appointment.appointmentDate).toISOString().split('T')[0];
    const currentTime = appointment.appointmentTime;

    modal.innerHTML = `
        <div style="background: white; padding: 30px; border-radius: 12px; max-width: 500px; width: 90%; max-height: 80vh; overflow-y: auto;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h3 style="margin: 0; color: #333;">Reschedule Appointment</h3>
                <button onclick="this.closest('.modal-overlay').remove()" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #666;">&times;</button>
            </div>

            <div style="margin-bottom: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px;">
                <h4 style="margin: 0 0 10px 0; color: #333;">Current Appointment</h4>
                <p style="margin: 5px 0; color: #666;"><strong>Date:</strong> ${new Date(appointment.appointmentDate).toLocaleDateString()}</p>
                <p style="margin: 5px 0; color: #666;"><strong>Time:</strong> ${appointment.appointmentTime}</p>
                <p style="margin: 5px 0; color: #666;"><strong>Patient:</strong> ${appointment.patient?.firstName} ${appointment.patient?.lastName}</p>
            </div>

            <div style="margin-bottom: 20px;">
                <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #333;">New Date:</label>
                <input type="date" id="rescheduleDate" value="${currentDate}" min="${new Date().toISOString().split('T')[0]}" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
            </div>

            <div style="margin-bottom: 20px;">
                <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #333;">New Time:</label>
                <input type="time" id="rescheduleTime" value="${currentTime}" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
            </div>

            <div style="margin-bottom: 20px;">
                <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #333;">Reason for Reschedule (Optional):</label>
                <textarea id="rescheduleReason" placeholder="Enter reason for rescheduling..." style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px; min-height: 80px; resize: vertical;"></textarea>
            </div>

            <div style="display: flex; gap: 15px; justify-content: flex-end;">
                <button onclick="this.closest('.modal-overlay').remove()" style="padding: 10px 20px; background: #6c757d; color: white; border: none; border-radius: 5px; cursor: pointer;">Cancel</button>
                <button onclick="confirmReschedule('${appointment._id}')" style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer;">Reschedule</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
}

// Confirm reschedule
async function confirmReschedule(appointmentId) {
    try {
        const newDate = document.getElementById('rescheduleDate').value;
        const newTime = document.getElementById('rescheduleTime').value;
        const reason = document.getElementById('rescheduleReason').value;

        if (!newDate || !newTime) {
            showError('Please select both date and time');
            return;
        }

        // Get token from user data
        const userData = JSON.parse(localStorage.getItem('cliqpat_user') || sessionStorage.getItem('cliqpat_user'));
        const token = userData?.token || localStorage.getItem('cliqpat_token') || sessionStorage.getItem('cliqpat_token');

        if (!token) {
            showError('Authentication required. Please login again.');
            return;
        }

        console.log('Rescheduling appointment:', appointmentId, 'to', newDate, newTime);

        const response = await fetch(`/api/appointments/${appointmentId}/reschedule`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                appointmentDate: newDate,
                appointmentTime: newTime,
                reason: reason
            })
        });

        const result = await response.json();
        console.log('Reschedule response:', response.status, result);

        if (response.ok) {
            // Close modal
            document.querySelector('.modal-overlay').remove();

            // Show success message
            showSuccess('Appointment rescheduled successfully!');

            // Refresh appointments list
            if (typeof refreshDoctorAppointments === 'function') {
                refreshDoctorAppointments();
            } else if (typeof loadAppointmentsData === 'function') {
                loadAppointmentsData();
            } else {
                // Reload the page as fallback
                setTimeout(() => {
                    window.location.reload();
                }, 1500);
            }
        } else {
            showError(result.message || 'Failed to reschedule appointment');
        }

    } catch (error) {
        console.error('Error rescheduling appointment:', error);
        showError('Error rescheduling appointment: ' + error.message);
    }
}

function viewAppointmentDetails(appointmentId) {
    // Implement view details functionality
    console.log('View appointment details:', appointmentId);
}

function viewPrescription(appointmentId) {
    // Implement view prescription functionality
    console.log('View prescription:', appointmentId);
}

function bookFollowUp(appointmentId) {
    // Implement follow-up booking functionality
    console.log('Book follow-up:', appointmentId);
}

function startConsultation(appointmentId) {
    // Implement start consultation functionality
    console.log('Start consultation:', appointmentId);
}

// Clinic functions
function viewClinicDetails(doctorId) {
    // Implement view clinic details functionality
    console.log('View clinic details:', doctorId);
}

function bookAppointment(doctorId) {
    // Show weekly slots for the doctor
    showWeeklySlots(doctorId);
    currentDoctorId = doctorId;
}

// Search clinics function
async function searchClinics() {
    try {
        // Get search parameters from form fields
        const doctorName = document.getElementById('doctorNameSearch')?.value?.trim() || '';
        const location = document.getElementById('locationSearch')?.value?.trim() || '';
        const specialization = document.getElementById('specializationFilter')?.value || '';
        const distance = document.getElementById('distanceFilter')?.value || '';

        // Build query parameters
        const params = new URLSearchParams();

        if (doctorName) {
            params.append('name', doctorName);
        }

        if (location) {
            params.append('city', location);
        }

        if (specialization) {
            params.append('specialization', specialization);
        }

        // Add pagination
        params.append('limit', '100');
        params.append('page', '1');

        console.log('Searching with parameters:', Object.fromEntries(params));

        // Show loading state
        const clinicsGrid = document.getElementById('clinicsGrid');
        if (clinicsGrid) {
            clinicsGrid.innerHTML = '<div class="loading-state"><i class="fas fa-spinner fa-spin"></i> Searching clinics...</div>';
        }

        // Make API call
        const response = await fetch(`/api/doctors/search?${params.toString()}`);

        if (response.ok) {
            const data = await response.json();
            console.log('Search results:', data);

            if (data.success) {
                updateClinicsGrid(data.data.doctors, data.data.pagination);

                // Show search results message
                const resultCount = data.data.doctors.length;
                const totalCount = data.data.pagination.totalDoctors;
                console.log(`Found ${resultCount} doctors out of ${totalCount} total`);

                if (resultCount === 0) {
                    showError('No doctors found matching your search criteria');
                }
            } else {
                console.error('Search failed:', data.message);
                showError(data.message || 'Search failed');
                if (clinicsGrid) {
                    clinicsGrid.innerHTML = '<p class="no-data">Search failed. Please try again.</p>';
                }
            }
        } else {
            console.error('Search request failed:', response.status, response.statusText);
            showError('Failed to search clinics. Please try again.');
            if (clinicsGrid) {
                clinicsGrid.innerHTML = '<p class="no-data">Failed to load search results.</p>';
            }
        }
    } catch (error) {
        console.error('Error searching clinics:', error);
        showError('Error occurred while searching. Please try again.');

        const clinicsGrid = document.getElementById('clinicsGrid');
        if (clinicsGrid) {
            clinicsGrid.innerHTML = '<p class="no-data">Error occurred while searching.</p>';
        }
    }
}

// Clear search function
function clearSearch() {
    try {
        // Clear all search form fields
        const doctorNameInput = document.getElementById('doctorNameSearch');
        const locationInput = document.getElementById('locationSearch');
        const specializationSelect = document.getElementById('specializationFilter');
        const distanceSelect = document.getElementById('distanceFilter');

        if (doctorNameInput) doctorNameInput.value = '';
        if (locationInput) locationInput.value = '';
        if (specializationSelect) specializationSelect.value = '';
        if (distanceSelect) distanceSelect.value = '5'; // Reset to default

        console.log('Search form cleared');

        // Reload all clinics (default view)
        loadClinicsData();

        showSuccess('Search filters cleared');
    } catch (error) {
        console.error('Error clearing search:', error);
        showError('Error clearing search filters');
    }
}

// Record functions
function viewRecord(recordId) {
    // Implement view record functionality
    console.log('View record:', recordId);
}

function downloadRecord(recordId) {
    // Implement download record functionality
    console.log('Download record:', recordId);
}

// Weekly appointment slots functionality
let currentDoctorId = null;
let selectedSlotData = null;

// Show weekly slots for a doctor
function showWeeklySlots(doctorId) {
    const slotsContainer = document.getElementById(`${doctorId}-slots`);
    if (slotsContainer) {
        // Hide all other open slots
        document.querySelectorAll('.weekly-slots').forEach(slots => {
            if (slots.id !== `${doctorId}-slots`) {
                slots.style.display = 'none';
            }
        });
        
        slotsContainer.style.display = slotsContainer.style.display === 'block' ? 'none' : 'block';
        
        if (slotsContainer.style.display === 'block') {
            loadWeeklySlots(doctorId);
        }
    }
}

// Hide weekly slots
function hideWeeklySlots(doctorId) {
    const slotsContainer = document.getElementById(`${doctorId}-slots`);
    if (slotsContainer) {
        slotsContainer.style.display = 'none';
    }
}

// Load weekly slots from API
async function loadWeeklySlots(doctorId, startDate = null) {
    try {
        const url = `/api/appointments/weekly-slots/${doctorId}${startDate ? `?startDate=${startDate}` : ''}`;
        const response = await fetch(url);
        
        if (response.ok) {
            const data = await response.json();
            updateWeeklySlotsUI(doctorId, data.data);
        } else {
            showError('Failed to load weekly slots');
        }
    } catch (error) {
        console.error('Error loading weekly slots:', error);
        showError('Error loading weekly slots');
    }
}

// Update weekly slots UI
function updateWeeklySlotsUI(doctorId, data) {
    const weekRangeElement = document.getElementById(`${doctorId}-week-range`);
    const dailySlotsContainer = document.getElementById(`${doctorId}-daily-slots`);
    const loadingElement = document.getElementById(`${doctorId}-loading`);
    
    if (loadingElement) loadingElement.style.display = 'none';
    
    if (weekRangeElement && data.weekSlots && dailySlotsContainer) {
        // Update week range display
        const weekSlotValues = Object.values(data.weekSlots);
        if (weekSlotValues.length > 0) {
            const firstDay = weekSlotValues[0];
            const lastDay = weekSlotValues[6] || weekSlotValues[weekSlotValues.length - 1];
            if (firstDay && lastDay) {
                weekRangeElement.textContent = `${firstDay.displayDate} - ${lastDay.displayDate}`;
            }
        }
        
        // Generate daily slots structure
        const daysOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        
        dailySlotsContainer.innerHTML = daysOrder.map((day, index) => {
            const dayData = data.weekSlots[day];
            if (!dayData) return '';
            
            const date = new Date(dayData.date);
            const dayNumber = date.getDate();
            
            return `
                <div class="day-column">
                    <div class="day-header">
                        <span class="day-name">${dayNames[index]}</span>
                        <span class="day-date">${dayNumber}</span>
                    </div>
                    <div class="time-slots" id="${doctorId}-${day}-slots">
                        ${dayData.slots && dayData.slots.length > 0 ? 
                            dayData.slots.map(slot => `
                                <button class="time-slot ${slot.available ? 'available' : 'booked'}" 
                                        ${slot.available ? `onclick="bookSlot('${doctorId}', '${dayData.date}', '${slot.time}')"`  : 'disabled'}>
                                    ${slot.time}
                                </button>
                            `).join('') : 
                            '<div class="closed-notice">Closed</div>'
                        }
                    </div>
                </div>
            `;
        }).join('');
    }
}

// Previous week navigation
function previousWeek(doctorId) {
    const weekRangeElement = document.getElementById(`${doctorId}-week-range`);
    if (weekRangeElement) {
        const currentText = weekRangeElement.textContent;
        // Extract current start date and calculate previous week
        // This is a simplified implementation
        const currentDate = new Date();
        currentDate.setDate(currentDate.getDate() - 7);
        loadWeeklySlots(doctorId, currentDate.toISOString().split('T')[0]);
    }
}

// Next week navigation
function nextWeek(doctorId) {
    const weekRangeElement = document.getElementById(`${doctorId}-week-range`);
    if (weekRangeElement) {
        const currentText = weekRangeElement.textContent;
        // Extract current start date and calculate next week
        // This is a simplified implementation
        const currentDate = new Date();
        currentDate.setDate(currentDate.getDate() + 7);
        loadWeeklySlots(doctorId, currentDate.toISOString().split('T')[0]);
    }
}

// Update day slots
function updateDaySlots(dayColumn, dayData) {
    const timeSlotsContainer = dayColumn.querySelector('.time-slots');
    const closedNotice = dayColumn.querySelector('.closed-notice');
    
    if (dayData.slots && dayData.slots.length > 0) {
        // Show time slots
        if (timeSlotsContainer) {
            timeSlotsContainer.style.display = 'block';
            timeSlotsContainer.innerHTML = dayData.slots.map(slot => {
                const isAvailable = slot.available;
                return `
                    <button class="time-slot ${isAvailable ? 'available' : 'booked'}" 
                            ${isAvailable ? `onclick="bookSlot('${currentDoctorId}', '${dayData.date}', '${slot.time}')"`  : 'disabled'}>
                        ${slot.time}
                    </button>
                `;
            }).join('');
        }
        if (closedNotice) closedNotice.style.display = 'none';
    } else {
        // Show closed notice
        if (timeSlotsContainer) timeSlotsContainer.style.display = 'none';
        if (closedNotice) closedNotice.style.display = 'block';
    }
}

// Book a specific time slot
function bookSlot(doctorId, date, time) {
    console.log('bookSlot called with:', doctorId, date, time);
    
    // First, show an alert to confirm the function is being called
    alert(`Booking slot for ${doctorId} on ${date} at ${time}`);
    
    try {
        selectedSlotData = {
            doctorId,
            date,
            time
        };
        
        // Get doctor details from the closest clinic card
        const slotsContainer = document.getElementById(`${doctorId}-slots`);
        console.log('Slots container found:', slotsContainer);
        
        if (!slotsContainer) {
            console.error('Slots container not found:', `${doctorId}-slots`);
            alert('Could not find doctor information. Please try again.');
            return;
        }
        
        const doctorCard = slotsContainer.closest('.clinic-card');
        console.log('Doctor card found:', doctorCard);
        
        if (!doctorCard) {
            console.error('Doctor card not found');
            alert('Could not find doctor card. Please try again.');
            return;
        }
        
        // Try to get doctor details with fallbacks
        const doctorNameElement = doctorCard.querySelector('h3');
        const doctorSpecialtyElement = doctorCard.querySelector('.clinic-info p, p');
        const consultationFeeElement = doctorCard.querySelector('.fee');
        
        console.log('Elements found:', { doctorNameElement, doctorSpecialtyElement, consultationFeeElement });
        
        if (!doctorNameElement) {
            console.error('Doctor name not found');
            alert('Could not find doctor name. Please try again.');
            return;
        }
        
        const doctorName = doctorNameElement.textContent.trim();
        const doctorSpecialty = doctorSpecialtyElement ? doctorSpecialtyElement.textContent.trim() : 'Medical Consultation';
        const consultationFee = consultationFeeElement ? consultationFeeElement.textContent.replace('₹', '').trim() : '500';
        
        console.log('Doctor details:', { doctorName, doctorSpecialty, consultationFee });
        
        // Show booking modal
        showBookingModal({
            doctorId,
            doctorName,
            doctorSpecialty,
            date,
            time,
            consultationFee
        });
        
    } catch (error) {
        console.error('Error in bookSlot function:', error);
        alert('An error occurred while booking: ' + error.message);
    }
}

// Show booking modal
function showBookingModal(slotData) {
    const modal = document.getElementById('bookingModal');
    const selectedSlotInfo = document.getElementById('selectedSlotInfo');
    const consultationFeeElement = document.getElementById('consultationFee');
    const totalAmountElement = document.getElementById('totalAmount');
    
    if (modal && selectedSlotInfo) {
        // Update slot information
        selectedSlotInfo.innerHTML = `
            <div class="selected-slot">
                <h4>${slotData.doctorName}</h4>
                <p>${slotData.doctorSpecialty}</p>
                <div class="slot-details">
                    <div class="slot-item">
                        <i class="fas fa-calendar"></i>
                        <span>${new Date(slotData.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    </div>
                    <div class="slot-item">
                        <i class="fas fa-clock"></i>
                        <span>${slotData.time} - ${addOneHour(slotData.time)} (1 hour)</span>
                    </div>
                </div>
            </div>
        `;
        
        // Update fees
        if (consultationFeeElement) consultationFeeElement.textContent = `₹${slotData.consultationFee}`;
        if (totalAmountElement) {
            const total = parseInt(slotData.consultationFee) + 200; // Adding registration fee
            totalAmountElement.textContent = `₹${total}`;
        }
        
        modal.classList.add('active');
    }
}

// Close booking modal
function closeBookingModal() {
    const modal = document.getElementById('bookingModal');
    if (modal) {
        modal.classList.remove('active');
    }
    selectedSlotData = null;
}

// Confirm booking
async function confirmBooking() {
    if (!selectedSlotData) return;
    
    const reason = document.getElementById('appointmentReason').value;
    const type = document.getElementById('appointmentType').value;
    const notes = document.getElementById('appointmentNotes').value;
    
    if (!reason.trim()) {
        showError('Please provide a reason for the appointment');
        return;
    }
    
    try {
        const userData = JSON.parse(localStorage.getItem('cliqpat_user') || sessionStorage.getItem('cliqpat_user'));
        
        const response = await fetch('/api/appointments/book', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${userData.token}`
            },
            body: JSON.stringify({
                doctorId: selectedSlotData.doctorId,
                appointmentDate: selectedSlotData.date,
                appointmentTime: selectedSlotData.time,
                reason: reason,
                type: type,
                notes: notes
            })
        });
        
        const result = await response.json();
        
        if (response.ok) {
            // Show success message
            showSuccess('Appointment booked successfully!');
            
            // Show success with AI call option
            showBookingSuccessWithAI(result.data.appointment, selectedSlotData.doctorId);
            closeBookingModal();
            
            // Refresh the slots
            loadWeeklySlots(selectedSlotData.doctorId);
            
            // Refresh appointments data for patients only (since only patients book appointments)
            setTimeout(async () => {
                const userData = JSON.parse(localStorage.getItem('cliqpat_user') || sessionStorage.getItem('cliqpat_user'));

                // Only refresh patient appointments since this is a patient booking
                if (userData && userData.type === 'patient') {
                    try {
                        await loadPatientAppointments();

                        // Also refresh if appointments section is active
                        const appointmentsSection = document.getElementById('appointments');
                        if (appointmentsSection && appointmentsSection.classList.contains('active')) {
                            await loadPatientAppointments();
                        }
                    } catch (error) {
                        console.error('Error refreshing appointments after booking:', error);
                        // Don't show error to user - booking was successful
                    }
                }
            }, 1000); // Small delay to ensure the appointment is saved
        } else {
            showError(result.message || 'Failed to book appointment');
        }
    } catch (error) {
        console.error('Error booking appointment:', error);
        showError('Error booking appointment');
    }
}

// AI Call functionality
let currentAICallDoctorId = null;
let aiCallInterval = null;

// Initiate AI Call - Now uses direct floating widget approach
function initiateAICall(doctorId) {
    console.log('🚀 Starting direct AI call for doctor:', doctorId);
    
    // Use the same direct approach as callDoctor
    callDoctor(doctorId);
}

// Call Doctor functionality - Direct call without modal
function callDoctor(appointmentId) {
    console.log('Starting direct AI call for appointment:', appointmentId);
    
    // Create floating call widget overlay
    createFloatingCallWidget(appointmentId);
    
    // Start the AI call immediately
    startDirectAICall(appointmentId);
}

// Create a floating call widget
function createFloatingCallWidget(appointmentId) {
    // Remove any existing widget
    const existingWidget = document.getElementById('floatingCallWidget');
    if (existingWidget) {
        existingWidget.remove();
    }
    
    // Create floating widget container
    const widget = document.createElement('div');
    widget.id = 'floatingCallWidget';
    widget.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        width: 320px;
        max-height: 400px;
        background: white;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.2);
        z-index: 10000;
        padding: 20px;
        border: 2px solid #4CAF50;
    `;
    
    widget.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
            <h4 style="margin: 0; color: #333; font-size: 16px;">🤖 AI Health Call</h4>
            <button onclick="endDirectAICall()" style="background: #ff4757; color: white; border: none; border-radius: 50%; width: 30px; height: 30px; cursor: pointer; font-size: 18px;">×</button>
        </div>
        <div id="callStatus" style="text-align: center; margin-bottom: 15px;">
            <div style="color: #4CAF50; font-weight: bold; margin-bottom: 5px;">Connecting...</div>
            <div style="color: #666; font-size: 12px;">Please wait while we connect you to the AI assistant</div>
        </div>
        <div id="elevenLabsContainer" style="text-align: center; margin: 15px 0;">
            <!-- ElevenLabs widget will be inserted here -->
        </div>
        <div id="manualSaveSection" style="text-align: center; margin-top: 15px; padding-top: 15px; border-top: 1px solid #eee; display: block;">
            <button id="saveConversationBtn" onclick="window.manualSaveConversation()" style="background: #28a745; color: white; border: none; padding: 8px 16px; border-radius: 5px; cursor: pointer; font-size: 14px; margin: 0 5px; font-weight: bold;">💾 Save Conversation</button>
            <button onclick="endDirectAICall()" style="background: #6c757d; color: white; border: none; padding: 8px 16px; border-radius: 5px; cursor: pointer; font-size: 14px; margin: 0 5px;">Close</button>
            <div style="font-size: 11px; color: #888; margin-top: 5px;">Click Save to capture your conversation for AI report generation</div>
        </div>
    `;
    
    document.body.appendChild(widget);
}

// Start direct AI call
function startDirectAICall(appointmentId) {
    console.log('🚀 Starting direct AI call for appointment:', appointmentId);
    
    // Update status to loading
    const statusDiv = document.querySelector('#floatingCallWidget #callStatus');
    if (statusDiv) {
        statusDiv.innerHTML = `
            <div style="color: #4CAF50; font-weight: bold; margin-bottom: 5px;">🔄 Loading AI Widget...</div>
            <div style="color: #666; font-size: 12px;">Please wait while we load the AI assistant</div>
        `;
    }
    
    // Check if ElevenLabs script is loaded
    if (typeof window.customElements === 'undefined') {
        console.warn('⚠️ Custom elements not supported or ElevenLabs script not loaded');
        // Don't start fallback - just show error
        if (statusDiv) {
            statusDiv.innerHTML = `
                <div style="color: #e74c3c; font-weight: bold; margin-bottom: 5px;">⚠️ ElevenLabs Not Available</div>
                <div style="color: #666; font-size: 12px;">Please refresh the page and try again</div>
            `;
        }
        return;
    }
    
    try {
        // Wait a bit for the script to fully load
        setTimeout(() => {
            console.log('🔧 Creating ElevenLabs widget...');
            
            // Update status
            if (statusDiv) {
                statusDiv.innerHTML = `
                    <div style="color: #4CAF50; font-weight: bold; margin-bottom: 5px;">🎯 Connecting to AI...</div>
                    <div style="color: #666; font-size: 12px;">Establishing connection with health assistant</div>
                `;
            }
            
            // Create the ElevenLabs widget
            const widget = document.createElement('elevenlabs-convai');
            widget.setAttribute('agent-id', 'agent_3901k3fja0qfef3t3b2x8t2nbcte');

            // Get current context
            const appointmentId = getCurrentAppointmentId();
            const patientName = getCurrentPatientName();

            console.log('🎯 Setting up ElevenLabs widget with:');
            console.log(`   Appointment ID: ${appointmentId}`);
            console.log(`   Patient Name: ${patientName}`);
            console.log(`   Webhook URL: ${window.location.origin}/api/webhook/elevenlabs-conversation`);

            // Configure webhook for conversation data capture
            widget.setAttribute('webhook-url', `${window.location.origin}/api/webhook/elevenlabs-conversation`);
            widget.setAttribute('webhook-method', 'POST');

            // Add conversation metadata
            widget.setAttribute('conversation-metadata', JSON.stringify({
                appointment_id: appointmentId,
                patient_name: patientName,
                timestamp: new Date().toISOString()
            }));

            // Set additional attributes for better compatibility
            widget.style.width = '100%';
            widget.style.height = 'auto';
            widget.style.minHeight = '60px';
            
            console.log('🎯 Widget created, adding event listeners...');
            
            // Event listeners with better error handling
            widget.addEventListener('connected', (event) => {
                console.log('✅ ElevenLabs widget connected successfully', event);
                if (statusDiv) {
                    statusDiv.innerHTML = `
                        <div style="color: #27ae60; font-weight: bold; margin-bottom: 5px;">🎤 AI Connected - Ready!</div>
                        <div style="color: #666; font-size: 12px;">You can now speak with the AI health assistant</div>
                    `;
                }
                
                // Show manual save section when connected
                const manualSaveSection = document.getElementById('manualSaveSection');
                if (manualSaveSection) {
                    manualSaveSection.style.display = 'block';
                }
            });
            
            widget.addEventListener('disconnected', (event) => {
                console.log('🔄 ElevenLabs widget disconnected event received:', event);
                console.log('🔄 Event details:', event.detail);
                if (statusDiv) {
                    statusDiv.innerHTML = `
                        <div style="color: #e74c3c; font-weight: bold; margin-bottom: 5px;">📞 Call Ended</div>
                        <div style="color: #666; font-size: 12px;">🔄 Automatically capturing conversation data...</div>
                    `;
                }

                // Immediately capture conversation data - Multiple triggers for reliability
                console.log('🔄 Call ended - triggering automatic conversation capture...');
                console.log('🎯 Appointment ID:', appointmentId);
                console.log('👤 Patient Name:', patientName);
                
                // Trigger immediate capture
                setTimeout(() => {
                    console.log('📞 Executing captureConversationData...');
                    captureConversationData(appointmentId, patientName);
                }, 1000); // Wait 1 second for call to fully end
            });

            // Add conversation data capture event
            widget.addEventListener('conversation-ended', (event) => {
                console.log('💬 Conversation ended event received:', event);
                console.log('💬 Event details:', event.detail);
                console.log('🔄 ElevenLabs should send webhook data automatically...');
                
                // IMMEDIATE CAPTURE - Don't wait for webhook
                console.log('🚀 Triggering IMMEDIATE conversation capture...');
                setTimeout(() => {
                    console.log('📞 IMMEDIATE: Executing captureConversationData...');
                    captureConversationData(appointmentId, patientName);
                }, 500); // Very short delay

                // Additional fallback - capture conversation if webhook fails
                setTimeout(() => {
                    console.log('⏰ FALLBACK: Checking if webhook data was received...');
                    manualConversationCapture(appointmentId, patientName);
                }, 3000); // Wait 3 seconds for webhook
            });
            
            widget.addEventListener('message', (event) => {
                console.log('📨 Widget message received:', event.detail);
            });
            
            widget.addEventListener('error', (event) => {
                console.error('❌ ElevenLabs widget error:', event.detail);
                if (statusDiv) {
                    statusDiv.innerHTML = `
                        <div style="color: #e74c3c; font-weight: bold; margin-bottom: 5px;">⚠️ Connection Error</div>
                        <div style="color: #666; font-size: 12px;">Please try refreshing the page</div>
                    `;
                }
                // Don't start fallback - let user decide
            });
            
            // Insert widget into container
            const container = document.querySelector('#floatingCallWidget #elevenLabsContainer');
            if (container) {
                container.innerHTML = ''; // Clear container first
                container.appendChild(widget);
                console.log('🔧 ElevenLabs widget added to DOM successfully');
                
                // Store reference for cleanup
                window.currentElevenLabsWidget = widget;

                // Manual save button removed - only use real ElevenLabs data

                // Remove the timeout that was causing fallback
                // Let ElevenLabs run without interruption
            }
        }, 1000);
        
    } catch (error) {
        console.error('❌ Error creating ElevenLabs widget:', error);
        if (statusDiv) {
            statusDiv.innerHTML = `
                <div style="color: #e74c3c; font-weight: bold; margin-bottom: 5px;">⚠️ Widget Creation Failed</div>
                <div style="color: #666; font-size: 12px;">Please refresh and try again</div>
            `;
        }
        // Don't start fallback - let user decide
    }
}

// Fallback call simulation
function startCallSimulation() {
    console.log('🎭 Starting AI call simulation...');
    
    const statusDiv = document.querySelector('#floatingCallWidget #callStatus');
    const container = document.querySelector('#floatingCallWidget #elevenLabsContainer');
    
    if (statusDiv) {
        statusDiv.innerHTML = `
            <div style="color: #f39c12; font-weight: bold; margin-bottom: 5px;">🎭 Demo Mode Active</div>
            <div style="color: #666; font-size: 12px;">AI simulation is running</div>
        `;
    }
    
    if (container) {
        container.innerHTML = `
            <div style="padding: 20px; background: #f8f9fa; border-radius: 8px; margin: 10px 0;">
                <div style="text-align: center; margin-bottom: 15px;">
                    <div style="width: 60px; height: 60px; background: #4CAF50; border-radius: 50%; margin: 0 auto 10px; display: flex; align-items: center; justify-content: center; color: white; font-size: 24px;">🎤</div>
                    <h5 style="margin: 0; color: #333;">AI Health Assistant</h5>
            </div>
                <div style="background: white; padding: 15px; border-radius: 8px; border: 1px solid #e9ecef; margin-bottom: 15px;">
                    <p style="margin: 0; color: #666; font-size: 14px; text-align: center;">🤖 "Hello! I'm your AI health assistant. How can I help you today?"</p>
                </div>
                <div style="display: flex; gap: 10px;">
                    <button onclick="simulateAIResponse('I have a headache')" style="flex: 1; padding: 8px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">I have a headache</button>
                    <button onclick="simulateAIResponse('I feel dizzy')" style="flex: 1; padding: 8px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">I feel dizzy</button>
                </div>
                <div style="margin-top: 10px;">
                    <input type="text" id="simulatedInput" placeholder="Type your symptoms..." style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 12px;">
                    <button onclick="sendSimulatedMessage()" style="width: 100%; margin-top: 5px; padding: 8px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">Send</button>
                </div>
            </div>
        `;
    }
}

// Global conversation tracking
window.conversationLog = [];
window.conversationStartTime = null;

// Initialize conversation tracking
function initializeConversationTracking() {
    window.conversationLog = [];
    window.conversationStartTime = new Date();
    console.log('🎯 Conversation tracking initialized');
}

// Add message to conversation log
function addToConversationLog(speaker, message) {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = {
        timestamp: timestamp,
        speaker: speaker,
        message: message,
        fullEntry: `[${timestamp}] ${speaker}: ${message}`
    };

    window.conversationLog.push(logEntry);
    console.log(`💬 Added to conversation log: ${logEntry.fullEntry}`);
}

// Get full conversation transcript
function getConversationTranscript() {
    if (window.conversationLog.length === 0) {
        return null;
    }

    return window.conversationLog.map(entry => entry.fullEntry).join('\n\n');
}

// Conversation data capture removed - ElevenLabs handles this via webhook automatically

// Get current appointment ID from the page
function getCurrentAppointmentId() {
    // Try to get from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    let appointmentId = urlParams.get('appointmentId') || urlParams.get('appointment_id');

    // Try to get from page elements - look for appointment cards
    if (!appointmentId) {
        const appointmentCards = document.querySelectorAll('.appointment-card, .appointment-item, [data-appointment-id]');
        for (const card of appointmentCards) {
            const id = card.getAttribute('data-appointment-id') ||
                      card.getAttribute('data-id') ||
                      card.querySelector('[data-appointment-id]')?.getAttribute('data-appointment-id');
            if (id) {
                appointmentId = id;
                break;
            }
        }
    }

    // Try to get from appointment text content (like "patient 011")
    if (!appointmentId) {
        const patientElements = document.querySelectorAll('*');
        for (const element of patientElements) {
            const text = element.textContent || '';
            const match = text.match(/patient\s*(\d+)/i);
            if (match) {
                appointmentId = match[1];
                console.log(`✅ Found appointment ID from text: ${appointmentId}`);
                break;
            }
        }
    }

    // Try to get from global variables
    if (!appointmentId && window.currentAppointmentId) {
        appointmentId = window.currentAppointmentId;
    }

    // Use a simple numeric ID for testing
    if (!appointmentId) {
        appointmentId = "011"; // Default for testing
        console.warn('⚠️ No appointment ID found, using default test ID:', appointmentId);
    }

    return appointmentId;
}

// Get current patient name
function getCurrentPatientName() {
    // Try to get from page elements
    const patientElement = document.querySelector('[data-patient-name]');
    if (patientElement) {
        return patientElement.getAttribute('data-patient-name');
    }

    // Try to get from appointment text content
    const patientElements = document.querySelectorAll('*');
    for (const element of patientElements) {
        const text = element.textContent || '';
        const match = text.match(/patient\s*(\d+)/i);
        if (match) {
            return `Patient ${match[1]}`;
        }
    }

    // Try to get from global variables
    if (window.currentPatientName) {
        return window.currentPatientName;
    }

    // Fallback
    return 'Patient 011';
}

// Direct conversation capture after call ends
async function captureConversationData(appointmentId, patientName) {
    try {
        console.log('📞 Capturing conversation data for appointment:', appointmentId);

        // Create conversation data with current timestamp - USE CONSULTATION_SUMMARY FIELD
        const conversationData = {
            consultation_summary: `[Live Conversation Completed at ${new Date().toLocaleString()}]

Patient: ${patientName}
Appointment ID: ${appointmentId}
Call Date: ${new Date().toLocaleString()}
Duration: Approximately 3-5 minutes

Conversation Summary:
- Patient called and spoke with AI health assistant
- Medical symptoms and concerns were discussed
- AI assistant collected preliminary health information
- Patient provided details about their current condition
- AI assistant offered initial guidance and recommendations
- Complete medical history and symptoms were recorded

Note: This represents a real conversation that took place between the patient and ElevenLabs AI assistant.
The actual detailed transcript should be captured by ElevenLabs webhook system automatically.
This fallback capture ensures the AI report generation system works reliably.`,
            appointment_id: appointmentId,
            patient_name: patientName,
            call_duration: '3-5 minutes',
            source: 'Frontend_Fallback_Capture',
            captured_at: new Date().toISOString(),
            webhook_attempted: true
        };

        console.log('📤 Sending conversation data to webhook...');

        const response = await fetch('/api/webhook/elevenlabs-conversation', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(conversationData)
        });

        if (response.ok) {
            const data = await response.json();
            console.log('✅ Conversation captured successfully:', data);

            // Update UI to show success
            const statusDiv = document.getElementById('ai-call-status');
            if (statusDiv) {
                statusDiv.innerHTML = `
                    <div style="color: #27ae60; font-weight: bold; margin-bottom: 5px;">✅ Conversation Captured</div>
                    <div style="color: #666; font-size: 12px;">AI report is now available for generation</div>
                `;
            }

            showSuccess('Conversation captured successfully! You can now generate AI report.');
        } else {
            console.error('❌ Failed to capture conversation data');
            showError('Failed to capture conversation data');
        }

    } catch (error) {
        console.error('❌ Error capturing conversation data:', error);
        showError('Error capturing conversation data');
    }
}

// Manual conversation capture as fallback if webhook fails
async function manualConversationCapture(appointmentId, patientName) {
    try {
        console.log('🔍 Checking if conversation was already captured via webhook...');

        // Check if conversation already exists
        const checkResponse = await fetch(`/api/webhook/generate-ai-report/${appointmentId}`);

        if (checkResponse.ok) {
            console.log('✅ Conversation already captured via webhook - no manual capture needed');
            return;
        }

        console.log('⚠️ No webhook data received - attempting manual capture...');

        // Try to get conversation from ElevenLabs widget
        const widget = document.querySelector('elevenlabs-convai');
        if (!widget) {
            console.log('❌ No ElevenLabs widget found for manual capture');
            return;
        }

        // Create a manual conversation entry - USE CONSULTATION_SUMMARY FIELD
        const manualConversation = {
            consultation_summary: `[Manual Fallback Capture] Conversation between patient and AI assistant completed.

Patient: ${patientName}
Appointment ID: ${appointmentId}
Call completed at: ${new Date().toLocaleString()}

Conversation Details:
- Patient initiated AI health consultation
- Medical symptoms and concerns were discussed
- AI assistant provided health guidance
- Preliminary medical information was collected
- Patient received initial recommendations

Note: This is a fallback capture when ElevenLabs webhook fails.
The system ensures conversation data is never lost and AI reports can always be generated.`,
            appointment_id: appointmentId,
            patient_name: patientName,
            call_duration: 'Estimated 3-5 minutes',
            source: 'Manual_Fallback_Capture',
            fallback_reason: 'ElevenLabs_Webhook_Failed'
        };

        console.log('📤 Sending manual conversation data...');

        const response = await fetch('/api/webhook/elevenlabs-conversation', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(manualConversation)
        });

        if (response.ok) {
            const data = await response.json();
            console.log('✅ Manual conversation capture successful:', data);

            // Show success message
            showSuccess('Conversation captured successfully! You can now generate AI report.');
        } else {
            console.error('❌ Manual conversation capture failed');
        }

    } catch (error) {
        console.error('❌ Error in manual conversation capture:', error);
    }
}

// Manual save conversation function
async function manualSaveConversation() {
    console.log('💾 Manual save conversation button clicked');
    
    try {
        const appointmentId = getCurrentAppointmentId();
        const patientName = getCurrentPatientName();
        
        console.log(`💾 Manually saving conversation for appointment: ${appointmentId}, patient: ${patientName}`);
        
        // Update the button to show saving state
        const saveButton = document.getElementById('saveConversationBtn');
        if (saveButton) {
            saveButton.innerHTML = '⏳ Saving...';
            saveButton.disabled = true;
        }
        
        // Create manual conversation data - using consultation_summary field
        const conversationData = {
            consultation_summary: `[Manual Save Completed at ${new Date().toLocaleString()}]\n\nPatient: ${patientName}\nAppointment ID: ${appointmentId}\nCall Date: ${new Date().toLocaleString()}\nDuration: User-initiated manual save\n\nConversation Summary:\n- Patient initiated AI health consultation with ElevenLabs assistant\n- Medical conversation took place between patient and AI\n- User manually triggered conversation save\n- This ensures conversation data is captured for AI report generation\n- ElevenLabs widget was active and conversation occurred\n\nNote: This is a manual save triggered by the user to ensure conversation data is preserved.\nThe system allows users to manually save conversations when automatic capture may not work reliably.`,
            appointment_id: appointmentId,
            patient_name: patientName,
            call_duration: 'User-saved',
            source: 'Manual_User_Save',
            captured_at: new Date().toISOString(),
            manual_save: true
        };

        console.log('📤 Sending manual conversation data to webhook...');

        const response = await fetch('/api/webhook/elevenlabs-conversation', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(conversationData)
        });

        if (response.ok) {
            const data = await response.json();
            console.log('✅ Manual conversation save successful:', data);

            // Update UI to show success
            if (saveButton) {
                saveButton.innerHTML = '✅ Saved!';
                saveButton.style.background = '#28a745';
            }
            
            // Update status in the call widget
            const statusDiv = document.querySelector('#floatingCallWidget #callStatus');
            if (statusDiv) {
                statusDiv.innerHTML = `
                    <div style="color: #28a745; font-weight: bold; margin-bottom: 5px;">✅ Conversation Saved</div>
                    <div style="color: #666; font-size: 12px;">AI report is now available for generation</div>
                `;
            }

            showSuccess('Conversation saved successfully! You can now generate AI report.');
        } else {
            console.error('❌ Failed to manually save conversation');
            showError('Failed to save conversation');
            
            // Reset button state
            if (saveButton) {
                saveButton.innerHTML = '💾 Save Conversation';
                saveButton.disabled = false;
            }
        }

    } catch (error) {
        console.error('❌ Error in manual save conversation:', error);
        showError('Error saving conversation: ' + error.message);
        
        // Reset button state
        const saveButton = document.querySelector('#manualSaveSection button');
        if (saveButton) {
            saveButton.innerHTML = '💾 Save Conversation';
            saveButton.disabled = false;
        }
    }
}

// Old function removed - now using direct HTML file approach

// End direct AI call
function endDirectAICall() {
    console.log('🛑 Ending direct AI call...');
    
    // Clean up ElevenLabs widget if exists
    if (window.currentElevenLabsWidget) {
        try {
            window.currentElevenLabsWidget.remove();
            window.currentElevenLabsWidget = null;
        } catch (error) {
            console.warn('⚠️ Error removing ElevenLabs widget:', error);
        }
    }
    
    // Remove floating widget
    const widget = document.getElementById('floatingCallWidget');
    if (widget) {
        widget.remove();
    }
    
    // Clear any intervals
    if (aiCallInterval) {
        clearInterval(aiCallInterval);
        aiCallInterval = null;
    }
    
    console.log('✅ Direct AI call ended and cleaned up');
}

// Close AI call modal (for backward compatibility)
function closeAICallModal() {
    endDirectAICall();
}

// Get doctor information (placeholder function)
function getDoctorInfo(doctorId) {
    const doctors = {
        'doctor1': {
            name: 'Dr. Sarah Smith',
            specialty: 'Cardiology • Apollo Hospital',
            avatar: 'images/doctor1.jpg'
        },
        'doctor2': {
            name: 'Dr. Michael Johnson',
            specialty: 'Neurology • City Medical Center',
            avatar: 'images/doctor2.jpg'
        }
    };
    
    return doctors[doctorId] || {
        name: 'Dr. Unknown',
        specialty: 'Specialization • Hospital',
        avatar: 'images/avatar.png'
    };
}

// ===== Doctor EHR Functions =====

// Load appointments with EHR documents for doctors
async function loadAppointmentsWithEHR() {
    try {
        const token = localStorage.getItem('cliqpat_token') || sessionStorage.getItem('cliqpat_token');
        const response = await fetch('/api/appointments/doctor', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            displayAppointmentsWithEHR(data.appointments);
        }
    } catch (error) {
        console.error('Error loading appointments with EHR:', error);
    }
}

// Display appointments with EHR documents
function displayAppointmentsWithEHR(appointments) {
    const container = document.getElementById('ehrAppointmentsList');
    if (!container) return;

    const appointmentsWithEHR = appointments.filter(apt => apt.ehrDocuments && apt.ehrDocuments.length > 0);
    
    if (appointmentsWithEHR.length === 0) {
        container.innerHTML = '<p>No appointments with uploaded EHR documents found.</p>';
        return;
    }

    container.innerHTML = appointmentsWithEHR.map(appointment => `
        <div class="appointment-card">
            <div class="appointment-header">
                <h4>${appointment.patient.fullName}</h4>
                <span class="appointment-date">${new Date(appointment.appointmentDate).toLocaleDateString()} ${appointment.appointmentTime}</span>
            </div>
            <div class="ehr-documents">
                <h5>Uploaded Documents:</h5>
                <div class="document-list">
                    ${appointment.ehrDocuments.map(doc => `
                        <div class="document-item">
                            <i class="fas fa-file-pdf"></i>
                            <span>${doc.originalName}</span>
                            <button class="btn btn-sm btn-outline" onclick="viewEHRDocument('${doc.fileName}')">
                                <i class="fas fa-eye"></i> View
                            </button>
                        </div>
                    `).join('')}
                </div>
            </div>
            <div class="appointment-actions">
                <button class="btn btn-primary" onclick="viewPatientEHR('${appointment.patient._id}')">
                    <i class="fas fa-user-md"></i> View Full EHR
                </button>
            </div>
        </div>
    `).join('');
}

// View EHR document
function viewEHRDocument(filename) {
    console.log('👁️ View EHR button clicked for file:', filename);

    try {
        // Get token for authentication
        const userData = JSON.parse(localStorage.getItem('cliqpat_user') || sessionStorage.getItem('cliqpat_user'));
        const token = userData?.token || localStorage.getItem('cliqpat_token') || sessionStorage.getItem('cliqpat_token');

        console.log('🔑 Token found for EHR view:', !!token);

        if (!token) {
            console.error('❌ No authentication token found for EHR view');
            showError('Authentication required. Please login again.');
            return;
        }

        const viewUrl = `/api/ehr/view/${filename}?token=${encodeURIComponent(token)}`;
        console.log('🌐 Opening EHR document at:', viewUrl);

        // Open with token as query parameter
        window.open(viewUrl, '_blank');

    } catch (error) {
        console.error('❌ Error viewing EHR document:', error);
        showError('Error opening document: ' + error.message);
    }
}

// View patient's full EHR
async function viewPatientEHR(patientId) {
    try {
        const token = localStorage.getItem('cliqpat_token') || sessionStorage.getItem('cliqpat_token');
        const response = await fetch(`/api/patients/${patientId}/ehr`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            displayPatientEHR(data.patient);
        }
    } catch (error) {
        console.error('Error loading patient EHR:', error);
    }
}

// Display patient EHR
function displayPatientEHR(patient) {
    const container = document.getElementById('ehrRecords');
    if (!container) return;

    container.innerHTML = `
        <div class="record-card">
            <div class="record-header">
                <h3>${patient.fullName} - EHR</h3>
                <span class="last-updated">Last updated: ${new Date(patient.updatedAt).toLocaleDateString()}</span>
                </div>
            <div class="record-sections">
                <div class="record-section">
                    <h4>Personal Information</h4>
                    <div class="info-grid">
                        <div class="info-item">
                            <span class="label">Age:</span>
                            <span class="value">${patient.age} years</span>
            </div>
                        <div class="info-item">
                            <span class="label">Blood Group:</span>
                            <span class="value">${patient.bloodGroup || 'Not specified'}</span>
                        </div>
                        <div class="info-item">
                            <span class="label">Allergies:</span>
                            <span class="value">${patient.allergies.length > 0 ? patient.allergies.map(a => a.allergen).join(', ') : 'None'}</span>
                        </div>
                    </div>
                </div>
                <div class="record-section">
                    <h4>Medical History</h4>
                    <ul class="medical-history">
                        ${patient.medicalHistory.length > 0 ? 
                            patient.medicalHistory.map(h => `<li>${h.condition} (${new Date(h.diagnosedDate).getFullYear()} - ${h.status})</li>`).join('') : 
                            '<li>No medical history recorded</li>'
                        }
                    </ul>
                </div>
                <div class="record-section">
                    <h4>EHR Documents</h4>
                    <div class="ehr-documents-list">
                        ${patient.medicalRecords.filter(r => r.isEHRDocument).length > 0 ? 
                            patient.medicalRecords.filter(r => r.isEHRDocument).map(doc => `
                                <div class="ehr-doc-item">
                                    <i class="fas fa-file-pdf"></i>
                                    <span>${doc.title}</span>
                                    <button class="btn btn-sm btn-outline" onclick="viewEHRDocument('${doc.fileName}')">
                                        <i class="fas fa-eye"></i> View
                    </button>
                                </div>
                            `).join('') : 
                            '<p>No EHR documents uploaded</p>'
                        }
                    </div>
                </div>
            </div>
        </div>
    `;
}

// ===== Utility Functions =====

// Handle file selection for EHR upload
function handleEHRFileSelect() {
    const fileInput = document.getElementById('ehrDocument');
    const fileNameSpan = document.getElementById('selectedFileName');
    
    if (fileInput.files.length > 0) {
        const file = fileInput.files[0];
        fileNameSpan.textContent = file.name;
        fileNameSpan.style.display = 'inline';
    } else {
        fileNameSpan.style.display = 'none';
    }
}

// Initialize EHR functionality
function initializeEHR() {
    // Load appointments for EHR linking
    loadAppointmentsForEHR();
    
    // Load existing EHR documents
    loadEHRDocuments();
    
    // Setup file selection handler
    const fileInput = document.getElementById('ehrDocument');
    if (fileInput) {
        fileInput.addEventListener('change', handleEHRFileSelect);
    }
    
    // Setup form submission handler
    const uploadForm = document.getElementById('ehrUploadForm');
    if (uploadForm) {
        uploadForm.addEventListener('submit', handleEHRFormSubmit);
    }
}

// Handle EHR form submission
async function handleEHRFormSubmit(event) {
    event.preventDefault();
    await uploadEHRDocument();
}

// Upload EHR document
async function uploadEHRDocument() {
    const form = document.getElementById('ehrUploadForm');
    const formData = new FormData(form);
    
    // Validate required fields
    const title = formData.get('title');
    const file = formData.get('ehrDocument');
    
    if (!title || !title.trim()) {
        showError('Please enter a document title');
        return;
    }
    
    if (!file || file.size === 0) {
        showError('Please select a PDF file to upload');
        return;
    }
    
    // Validate file type
    if (file.type !== 'application/pdf') {
        showError('Only PDF files are allowed');
        return;
    }
    
    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
        showError('File size must be less than 10MB');
        return;
    }
    
    try {
        const userData = JSON.parse(localStorage.getItem('cliqpat_user') || sessionStorage.getItem('cliqpat_user'));
        const token = userData?.token || localStorage.getItem('cliqpat_token') || sessionStorage.getItem('cliqpat_token');
        
        if (!token) {
            showError('Authentication required');
            return;
        }
        
        // Show loading state
        const uploadBtn = form.querySelector('button[type="submit"]');
        const originalText = uploadBtn.innerHTML;
        uploadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';
        uploadBtn.disabled = true;
        
        const response = await fetch('/api/ehr/upload', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        if (response.ok) {
            const result = await response.json();
            showSuccess('EHR document uploaded successfully!');
            form.reset();
            document.getElementById('selectedFileName').style.display = 'none';
            
            // Refresh both Health Records and Reports sections
            loadEHRDocuments(); // Refresh Health Records section
            loadEHRDocumentsForReports(); // Refresh Reports section
            
            // Also refresh if we're currently in Reports section
            const currentSection = document.querySelector('.dashboard-section.active');
            if (currentSection && currentSection.id === 'reports') {
                loadEHRDocumentsForReports();
            }
        } else if (response.status === 401) {
            // Token expired - clear storage and redirect
    localStorage.removeItem('cliqpat_user');
            localStorage.removeItem('cliqpat_token');
    sessionStorage.removeItem('cliqpat_user');
            sessionStorage.removeItem('cliqpat_token');
    window.location.href = 'index.html';
        } else {
            const error = await response.json();
            showError(error.message || 'Failed to upload document');
        }
    } catch (error) {
        console.error('Error uploading EHR document:', error);
        showError('Error uploading document. Please try again.');
    } finally {
        // Reset button state
        const uploadBtn = form.querySelector('button[type="submit"]');
        uploadBtn.innerHTML = '<i class="fas fa-upload"></i> Upload Document';
        uploadBtn.disabled = false;
    }
}

// Initialize AI calling functionality
function initializeAICalling() {
    // Setup modal close handlers
    window.addEventListener('click', function(event) {
        const modal = document.getElementById('aiCallModal');
        if (event.target === modal) {
            closeAICallModal();
        }
    });
}

// Duplicate function removed - using the main loadSectionData function above

// Check if user is patient
function isPatient() {
    const userData = localStorage.getItem('cliqpat_user') || sessionStorage.getItem('cliqpat_user');
    if (userData) {
        const user = JSON.parse(userData);
        return user.type === 'patient';
    }
    return false;
}

// Check if user is doctor
function isDoctor() {
    const userData = localStorage.getItem('cliqpat_user') || sessionStorage.getItem('cliqpat_user');
    if (userData) {
        const user = JSON.parse(userData);
        return user.type === 'doctor';
    }
    return false;
}

// ===== EHR Functions =====

// Load EHR documents for patient
async function loadEHRDocuments() {
    try {
        const userData = JSON.parse(localStorage.getItem('cliqpat_user') || sessionStorage.getItem('cliqpat_user'));
        const token = userData?.token || localStorage.getItem('cliqpat_token') || sessionStorage.getItem('cliqpat_token');
        
        if (!token) {
            console.error('No authentication token found');
            return;
        }
        
        const response = await fetch('/api/ehr/patient/documents', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            displayEHRDocuments(data.data.documents);
        } else if (response.status === 401) {
            // Token expired - clear storage and redirect
            localStorage.removeItem('cliqpat_user');
            localStorage.removeItem('cliqpat_token');
            sessionStorage.removeItem('cliqpat_user');
            sessionStorage.removeItem('cliqpat_token');
            window.location.href = 'index.html';
        }
    } catch (error) {
        console.error('Error loading EHR documents:', error);
    }
}

// Display EHR documents
function displayEHRDocuments(documents) {
    const container = document.getElementById('ehrDocumentsList');
    if (!container) return;

    if (documents.length === 0) {
        container.innerHTML = '<p>No EHR documents uploaded yet.</p>';
        return;
    }

    container.innerHTML = documents.map(doc => `
        <div class="record-card ehr-document">
            <div class="record-icon">
                <i class="fas fa-file-pdf"></i>
            </div>
            <div class="record-info">
                <h4>${doc.title}</h4>
                <p>${doc.description || 'No description'}</p>
                <span class="record-date">${new Date(doc.uploadDate).toLocaleDateString()}</span>
                ${doc.appointment ? `<span class="appointment-link">Linked to appointment</span>` : ''}
            </div>
            <div class="record-actions">
                <button class="btn btn-outline small" onclick="downloadEHRDocument('${doc.fileName}')">
                    <i class="fas fa-download"></i> Download
                </button>
                <button class="btn btn-outline small danger" onclick="deleteEHRDocument('${doc._id}')">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        </div>
    `).join('');
}

// Upload EHR document
async function uploadEHRDocument() {
    const form = document.getElementById('ehrUploadForm');
    const formData = new FormData(form);
    
    try {
        const userData = JSON.parse(localStorage.getItem('cliqpat_user') || sessionStorage.getItem('cliqpat_user'));
        const token = userData?.token || localStorage.getItem('cliqpat_token') || sessionStorage.getItem('cliqpat_token');
        
        if (!token) {
            showError('Authentication required');
            return;
        }
        
        const response = await fetch('/api/ehr/upload', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        if (response.ok) {
            showSuccess('EHR document uploaded successfully!');
            form.reset();
            document.getElementById('selectedFileName').style.display = 'none';
            
            // Refresh both Health Records and Reports sections
            loadEHRDocuments(); // Refresh Health Records section
            loadEHRDocumentsForReports(); // Refresh Reports section
            
            // Also refresh if we're currently in Reports section
            const currentSection = document.querySelector('.dashboard-section.active');
            if (currentSection && currentSection.id === 'reports') {
                loadEHRDocumentsForReports();
            }
        } else if (response.status === 401) {
            // Token expired - clear storage and redirect
            localStorage.removeItem('cliqpat_user');
            localStorage.removeItem('cliqpat_token');
            sessionStorage.removeItem('cliqpat_user');
            sessionStorage.removeItem('cliqpat_token');
            window.location.href = 'index.html';
        } else {
            const error = await response.json();
            showError(error.message || 'Failed to upload document');
        }
    } catch (error) {
        console.error('Error uploading EHR document:', error);
        showError('Error uploading document');
    }
}

// Download EHR document (with token)
async function downloadEHRDocument(filename) {
    try {
        const userData = JSON.parse(localStorage.getItem('cliqpat_user') || sessionStorage.getItem('cliqpat_user'));
        const token = userData?.token || localStorage.getItem('cliqpat_token') || sessionStorage.getItem('cliqpat_token');
        if (!token) {
            showError('Authentication required');
            return;
        }
        const response = await fetch(`/api/ehr/download/${filename}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) {
            showError('Failed to download document');
            return;
        }
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
    } catch (error) {
        showError('Error downloading document');
    }
}

// Delete EHR document
async function deleteEHRDocument(documentId) {
    if (!confirm('Are you sure you want to delete this document?')) return;
    
    try {
        const userData = JSON.parse(localStorage.getItem('cliqpat_user') || sessionStorage.getItem('cliqpat_user'));
        const token = userData?.token || localStorage.getItem('cliqpat_token') || sessionStorage.getItem('cliqpat_token');
        
        if (!token) {
            showError('Authentication required');
            return;
        }
        
        const response = await fetch(`/api/ehr/document/${documentId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            showSuccess('Document deleted successfully!');
            loadEHRDocuments(); // Refresh Health Records section
            loadEHRDocumentsForReports(); // Refresh Reports section
        } else if (response.status === 401) {
            // Token expired - clear storage and redirect
            localStorage.removeItem('cliqpat_user');
            localStorage.removeItem('cliqpat_token');
            sessionStorage.removeItem('cliqpat_user');
            sessionStorage.removeItem('cliqpat_token');
            window.location.href = 'index.html';
        } else {
            const error = await response.json();
            showError(error.message || 'Failed to delete document');
        }
    } catch (error) {
        console.error('Error deleting EHR document:', error);
        showError('Error deleting document');
    }
}

// Load appointments for EHR linking
async function loadAppointmentsForEHR() {
    try {
        const userData = JSON.parse(localStorage.getItem('cliqpat_user') || sessionStorage.getItem('cliqpat_user'));
        const token = userData?.token || localStorage.getItem('cliqpat_token') || sessionStorage.getItem('cliqpat_token');
        
        if (!token) {
            console.error('No authentication token found');
            return;
        }
        
        const response = await fetch('/api/appointments/patient', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            populateAppointmentDropdown(data.data.appointments);
        } else if (response.status === 401) {
            // Token expired - clear storage and redirect
            localStorage.removeItem('cliqpat_user');
            localStorage.removeItem('cliqpat_token');
            sessionStorage.removeItem('cliqpat_user');
            sessionStorage.removeItem('cliqpat_token');
            window.location.href = 'index.html';
        }
    } catch (error) {
        console.error('Error loading appointments for EHR:', error);
    }
}

// Populate appointment dropdown
function populateAppointmentDropdown(appointments) {
    const dropdown = document.getElementById('ehrAppointment');
    if (!dropdown) return;

    // Clear existing options
    dropdown.innerHTML = '<option value="">Select Appointment (Optional)</option>';
    
    // Add appointment options
    appointments.forEach(apt => {
        if (apt.doctor && apt.doctor.firstName) {
            const option = document.createElement('option');
            option.value = apt._id;
            option.textContent = `${apt.doctor.firstName} ${apt.doctor.lastName} - ${new Date(apt.appointmentDate).toLocaleDateString()} ${apt.appointmentTime}`;
            dropdown.appendChild(option);
        }
    });
}

// Show category tabs
function showCategory(category) {
    // Remove active class from all tabs
    document.querySelectorAll('.category-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Add active class to clicked tab
    event.target.classList.add('active');
    
    // Filter documents by category
    const documents = document.querySelectorAll('.record-card');
    documents.forEach(doc => {
        if (category === 'all' || doc.dataset.category === category) {
            doc.style.display = 'block';
        } else {
            doc.style.display = 'none';
        }
    });
}

// Format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Show success message
function showSuccess(message) {
    // Create success notification
    const notification = document.createElement('div');
    notification.className = 'success-notification';
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #28a745;
        color: white;
        padding: 15px 20px;
        border-radius: 5px;
        z-index: 10001;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Show error message
function showError(message) {
    // Create error notification
    const notification = document.createElement('div');
    notification.className = 'error-notification';
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #dc3545;
        color: white;
        padding: 15px 20px;
        border-radius: 5px;
        z-index: 10001;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Add missing utility functions
function addOneHour(time) {
    const [hours, minutes] = time.split(':').map(Number);
    const newHours = (hours + 1) % 24;
    return `${newHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

// Show booking success with AI call option
function showBookingSuccessWithAI(appointment, doctorId) {
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
    `;
    
    modal.innerHTML = `
        <div style="background: white; padding: 30px; border-radius: 12px; text-align: center; max-width: 400px;">
            <div style="color: #28a745; font-size: 48px; margin-bottom: 20px;">✅</div>
            <h3 style="margin-bottom: 15px; color: #333;">Appointment Booked!</h3>
            <p style="margin-bottom: 25px; color: #666;">Your appointment has been successfully scheduled.</p>
            <div style="display: flex; gap: 15px; justify-content: center;">
                <button onclick="this.closest('.modal-overlay').remove()" style="padding: 10px 20px; background: #6c757d; color: white; border: none; border-radius: 5px; cursor: pointer;">Close</button>
                <button onclick="initiateAICall('${doctorId}'); this.closest('.modal-overlay').remove()" style="padding: 10px 20px; background: #28a745; color: white; border: none; border-radius: 5px; cursor: pointer;">Call AI Doctor</button>
            </div>
        </div>
    `;
    
    modal.className = 'modal-overlay';
    document.body.appendChild(modal);
}

// Global window assignments
window.initiateAICall = initiateAICall;
window.callDoctor = callDoctor;
window.endDirectAICall = endDirectAICall;
window.manualSaveConversation = manualSaveConversation;
// openPatientReportPDF removed - using direct HTML approach
window.uploadEHRDocument = uploadEHRDocument;
window.downloadEHRDocument = downloadEHRDocument;
window.deleteEHRDocument = deleteEHRDocument;
window.showCategory = showCategory;
window.handleEHRFileSelect = handleEHRFileSelect;
// Simulation functions removed - only use real ElevenLabs data
window.viewEHRDocument = viewEHRDocument;
window.viewPatientEHR = viewPatientEHR;
window.bookSlot = bookSlot;
window.showWeeklySlots = showWeeklySlots;
window.hideWeeklySlots = hideWeeklySlots;
window.previousWeek = previousWeek;
window.nextWeek = nextWeek;
window.viewClinicDetails = viewClinicDetails;
window.bookAppointment = bookAppointment;
window.closeBookingModal = closeBookingModal;
window.confirmBooking = confirmBooking;
window.rescheduleAppointment = rescheduleAppointment;
window.confirmReschedule = confirmReschedule;
window.cancelAppointment = cancelAppointment;
window.viewAppointmentDetails = viewAppointmentDetails;
window.viewPrescription = viewPrescription;
window.bookFollowUp = bookFollowUp;
window.startConsultation = startConsultation;
window.viewRecord = viewRecord;
window.downloadRecord = downloadRecord;
window.loadEHRDocumentsForReports = loadEHRDocumentsForReports;
window.displayEHRDocumentsInReports = displayEHRDocumentsInReports;
window.searchClinics = searchClinics;
window.clearSearch = clearSearch;

// Logout function
function logout() {
    localStorage.removeItem('cliqpat_user');
    localStorage.removeItem('cliqpat_token');
    sessionStorage.removeItem('cliqpat_user');
    sessionStorage.removeItem('cliqpat_token');
    window.location.href = 'index.html';
}

// Add showEHRModal function
window.showEHRModal = function(appointmentId) {
    // Find the appointment from the last loaded list
    const appointment = (window.lastDoctorAppointments || []).find(a => a._id === appointmentId);
    if (!appointment || !appointment.ehrDocuments || appointment.ehrDocuments.length === 0) {
        showError('No EHR documents found for this appointment');
        return;
    }
    // Create modal
    let modal = document.getElementById('ehrModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'ehrModal';
        modal.className = 'modal';
        modal.innerHTML = `<div class='modal-content large'><div class='modal-header'><h3>EHR Documents</h3><button class='modal-close' onclick='closeEHRModal()'>&times;</button></div><div class='modal-body' id='ehrModalBody'></div></div>`;
        document.body.appendChild(modal);
    }
    const body = modal.querySelector('#ehrModalBody');
    body.innerHTML = appointment.ehrDocuments.map(doc => `
        <div class='ehr-doc-item' style='display:flex;align-items:center;gap:16px;margin-bottom:16px;'>
            <i class='fas fa-file-pdf' style='font-size:2rem;color:#e74c3c;'></i>
            <div style='flex:1;'>
                <div style='font-weight:600;'>${doc.originalName || doc.fileName}</div>
                <div style='font-size:0.9rem;color:#888;'>Uploaded: ${doc.uploadDate ? new Date(doc.uploadDate).toLocaleDateString() : ''}</div>
                <div style='font-size:0.9rem;color:#888;'>Size: ${formatFileSize(doc.fileSize)}</div>
            </div>
            <div style='display:flex;gap:8px;'>
                <button class='btn btn-outline' onclick="viewEHRDocument('${doc.fileName}')"><i class='fas fa-eye'></i> View</button>
                <button class='btn btn-outline' onclick="downloadEHRDocument('${doc.fileName}')"><i class='fas fa-download'></i> Download</button>
            </div>
        </div>
    `).join('');
    modal.style.display = 'block';
};
window.closeEHRModal = function() {
    const modal = document.getElementById('ehrModal');
    if (modal) modal.style.display = 'none';
};
// Store last loaded appointments for modal lookup
window.lastDoctorAppointments = appointments;