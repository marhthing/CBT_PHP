
// CBT Portal - Modern JavaScript Implementation
// Using vanilla JavaScript for better performance and no external dependencies

document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ CBT Portal JavaScript initialized successfully');
    
    // Initialize all components
    initializeFormValidation();
    initializeLoadingStates();
    initializeTooltips();
    initializeAlerts();
    initializeNavigationEffects();
    initializeCardAnimations();
    initializeFormEnhancements();
    initializeLoginForm();
});

// Form Validation Enhancement
function initializeFormValidation() {
    const forms = document.querySelectorAll('.needs-validation');
    
    forms.forEach(form => {
        form.addEventListener('submit', function(event) {
            if (!form.checkValidity()) {
                event.preventDefault();
                event.stopPropagation();
            }
            form.classList.add('was-validated');
        });
    });
}

// Login Form Enhancement
function initializeLoginForm() {
    const loginForm = document.getElementById('loginForm');
    const loginButton = document.getElementById('loginButton');
    const loginButtonText = document.getElementById('loginButtonText');
    
    if (loginForm && loginButton && loginButtonText) {
        loginForm.addEventListener('submit', function(e) {
            // Only proceed if form validation passes
            if (loginForm.checkValidity()) {
                // Disable button immediately
                loginButton.disabled = true;
                
                // Change button text and add spinner
                loginButtonText.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Logging in...';
                
                // Add processing class for visual feedback
                loginButton.classList.add('btn-secondary');
                loginButton.classList.remove('btn-primary');
                
                // Reset button after 10 seconds if still processing (fallback)
                setTimeout(() => {
                    if (loginButton.disabled) {
                        loginButton.disabled = false;
                        loginButtonText.innerHTML = 'Login';
                        loginButton.classList.add('btn-primary');
                        loginButton.classList.remove('btn-secondary');
                    }
                }, 10000);
            }
        });
    }
}

// Loading States Management
function initializeLoadingStates() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    
    // Show loading for form submissions
    const forms = document.querySelectorAll('form[method="post"]');
    forms.forEach(form => {
        form.addEventListener('submit', function() {
            showLoading();
        });
    });
    
    // Show loading for navigation links (except dropdowns)
    const navLinks = document.querySelectorAll('.nav-link:not(.dropdown-toggle)');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            if (this.getAttribute('href') && this.getAttribute('href') !== '#') {
                showLoading();
            }
        });
    });
}

function showLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.classList.add('show');
    }
}

function hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.classList.remove('show');
    }
}

// Initialize Bootstrap Tooltips
function initializeTooltips() {
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
}

// Alert Auto-dismiss
function initializeAlerts() {
    const alerts = document.querySelectorAll('.alert:not(.alert-permanent)');
    alerts.forEach(alert => {
        setTimeout(() => {
            const bsAlert = new bootstrap.Alert(alert);
            bsAlert.close();
        }, 5000);
    });
}

// Navigation Effects
function initializeNavigationEffects() {
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        link.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-2px)';
        });
        
        link.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });
}

// Card Hover Animations
function initializeCardAnimations() {
    const cards = document.querySelectorAll('.card:not(.no-hover)');
    
    cards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-4px)';
            this.style.boxShadow = 'var(--shadow-xl)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = 'var(--shadow)';
        });
    });
}

// Form Enhancement
function initializeFormEnhancements() {
    // Floating labels effect
    const formControls = document.querySelectorAll('.form-control, .form-select');
    
    formControls.forEach(control => {
        control.addEventListener('focus', function() {
            this.parentElement.classList.add('focused');
        });
        
        control.addEventListener('blur', function() {
            if (!this.value) {
                this.parentElement.classList.remove('focused');
            }
        });
        
        // Check if field has value on load
        if (control.value) {
            control.parentElement.classList.add('focused');
        }
    });
}

// Utility Functions
function showAlert(message, type = 'info') {
    const alertContainer = document.getElementById('alertContainer') || createAlertContainer();
    
    const alert = document.createElement('div');
    alert.className = `alert alert-${type} alert-dismissible fade show`;
    alert.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    alertContainer.appendChild(alert);
    
    // Auto dismiss after 5 seconds
    setTimeout(() => {
        const bsAlert = new bootstrap.Alert(alert);
        bsAlert.close();
    }, 5000);
}

function createAlertContainer() {
    const container = document.createElement('div');
    container.id = 'alertContainer';
    container.className = 'position-fixed top-0 end-0 p-3';
    container.style.zIndex = '9999';
    document.body.appendChild(container);
    return container;
}

// AJAX Helper Functions
function makeRequest(url, options = {}) {
    const defaultOptions = {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
        }
    };
    
    const finalOptions = { ...defaultOptions, ...options };
    
    return fetch(url, finalOptions)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .catch(error => {
            console.error('Request failed:', error);
            showAlert('An error occurred. Please try again.', 'danger');
            throw error;
        });
}

// Form Data Helper
function getFormData(form) {
    const formData = new FormData(form);
    const data = {};
    
    for (let [key, value] of formData.entries()) {
        if (data[key]) {
            if (Array.isArray(data[key])) {
                data[key].push(value);
            } else {
                data[key] = [data[key], value];
            }
        } else {
            data[key] = value;
        }
    }
    
    return data;
}

// Question Navigation (for test pages)
function navigateToQuestion(questionNumber) {
    const currentQuestion = document.querySelector('.question-container.active');
    const targetQuestion = document.querySelector(`[data-question="${questionNumber}"]`);
    
    if (currentQuestion && targetQuestion) {
        currentQuestion.classList.remove('active');
        targetQuestion.classList.add('active');
        
        // Update navigation buttons
        updateQuestionNavigation(questionNumber);
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

function updateQuestionNavigation(currentQuestionNumber) {
    const navButtons = document.querySelectorAll('.nav-btn');
    
    navButtons.forEach(btn => {
        btn.classList.remove('current');
        if (parseInt(btn.textContent) === currentQuestionNumber) {
            btn.classList.add('current');
        }
    });
}

// Test Timer Functions
function startTimer(duration, display) {
    let timer = duration;
    const interval = setInterval(function() {
        const hours = Math.floor(timer / 3600);
        const minutes = Math.floor((timer % 3600) / 60);
        const seconds = timer % 60;
        
        const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        display.textContent = timeString;
        
        // Change timer color based on remaining time
        if (timer <= 300) { // 5 minutes
            display.classList.add('danger');
        } else if (timer <= 600) { // 10 minutes
            display.classList.add('warning');
        }
        
        if (--timer < 0) {
            clearInterval(interval);
            // Auto-submit test when time runs out
            if (typeof submitTest === 'function') {
                submitTest();
            }
        }
    }, 1000);
    
    return interval;
}

// Auto-save functionality for tests
function enableAutoSave(formSelector, interval = 30000) {
    const form = document.querySelector(formSelector);
    if (!form) return;
    
    setInterval(() => {
        const formData = getFormData(form);
        
        makeRequest('/ajax/auto_save.php', {
            method: 'POST',
            body: JSON.stringify(formData)
        }).catch(error => {
            console.warn('Auto-save failed:', error);
        });
    }, interval);
}

// Copy to clipboard functionality
function copyToClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
        return navigator.clipboard.writeText(text).then(() => {
            showAlert('Copied to clipboard!', 'success');
        });
    } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
            document.execCommand('copy');
            showAlert('Copied to clipboard!', 'success');
        } catch (err) {
            showAlert('Failed to copy to clipboard', 'danger');
        } finally {
            textArea.remove();
        }
    }
}

// Global error handler
window.addEventListener('error', function(event) {
    console.error('Global error:', event.error);
    
    // Don't show alert for script loading errors in development
    if (event.message !== 'Script error.') {
        showAlert('An unexpected error occurred. Please refresh the page.', 'warning');
    }
});

// Export functions for global use
window.CBTPortal = {
    showLoading,
    hideLoading,
    showAlert,
    makeRequest,
    copyToClipboard,
    navigateToQuestion,
    startTimer,
    enableAutoSave
};
