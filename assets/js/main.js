/**
 * CBT Portal - Main JavaScript File
 * Handles common functionality across the application
 */

// Global variables
let toastContainer;

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

/**
 * Initialize the application
 */
function initializeApp() {
    initializeToasts();
    initializeFormValidation();
    initializeTooltips();
    initializeConfirmDialogs();
    initializeImagePreviews();
    initializeTableSorting();
    initializeSearchFilters();
    handleNetworkStatus();
}

/**
 * Initialize toast notifications
 */
function initializeToasts() {
    // Create toast container if it doesn't exist
    if (!document.getElementById('toast-container')) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.className = 'toast-container position-fixed top-0 end-0 p-3';
        toastContainer.style.zIndex = '9999';
        document.body.appendChild(toastContainer);
    } else {
        toastContainer = document.getElementById('toast-container');
    }
}

/**
 * Show toast notification
 * @param {string} message - The message to display
 * @param {string} type - The type of toast (success, error, warning, info)
 * @param {number} duration - Duration in milliseconds (default: 5000)
 */
function showToast(message, type = 'info', duration = 5000) {
    const toastId = 'toast-' + Date.now();
    const iconClass = {
        success: 'fas fa-check-circle',
        error: 'fas fa-exclamation-circle',
        warning: 'fas fa-exclamation-triangle',
        info: 'fas fa-info-circle'
    };
    
    const bgClass = {
        success: 'bg-success',
        error: 'bg-danger',
        warning: 'bg-warning',
        info: 'bg-primary'
    };
    
    const toastHTML = `
        <div class="toast align-items-center text-white ${bgClass[type]} border-0" role="alert" id="${toastId}">
            <div class="d-flex">
                <div class="toast-body">
                    <i class="${iconClass[type]} me-2"></i>
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        </div>
    `;
    
    toastContainer.insertAdjacentHTML('beforeend', toastHTML);
    
    const toastElement = document.getElementById(toastId);
    const toast = new bootstrap.Toast(toastElement, { delay: duration });
    toast.show();
    
    // Remove toast element after it's hidden
    toastElement.addEventListener('hidden.bs.toast', function() {
        toastElement.remove();
    });
}

/**
 * Initialize form validation
 */
// CBT Portal - Enhanced Main JavaScript

// Toast notification system
function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toastContainer') || createToastContainer();
    const toast = document.createElement('div');
    toast.className = `alert alert-${type} alert-dismissible fade show`;
    toast.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    
    toast.innerHTML = `
        ${message}
        <button type="button" class="btn-close" onclick="this.parentElement.remove()"></button>
    `;
    
    toastContainer.appendChild(toast);
    
    setTimeout(() => {
        if (toast.parentElement) {
            toast.remove();
        }
    }, 5000);
}

function createToastContainer() {
    const container = document.createElement('div');
    container.id = 'toastContainer';
    container.style.cssText = 'position: fixed; top: 0; right: 0; z-index: 9999; padding: 20px;';
    document.body.appendChild(container);
    return container;
}

// Form validation
function initializeFormValidation() {
    const forms = document.querySelectorAll('.needs-validation');
    
    Array.from(forms).forEach(form => {
        form.addEventListener('submit', function(event) {
            if (!form.checkValidity()) {
                event.preventDefault();
                event.stopPropagation();
                
                const firstInvalid = form.querySelector(':invalid');
                if (firstInvalid) {
                    firstInvalid.focus();
                    showToast('Please fill in all required fields correctly', 'danger');
                }
            }
            form.classList.add('was-validated');
        });
    });
    
    const passwordFields = document.querySelectorAll('input[type="password"]');
    passwordFields.forEach(field => {
        field.addEventListener('input', validatePasswordStrength);
    });
    
    const emailFields = document.querySelectorAll('input[type="email"]');
    emailFields.forEach(field => {
        field.addEventListener('blur', validateEmail);
    });
}

function validatePasswordStrength(event) {
    const password = event.target.value;
    const strengthIndicator = event.target.parentElement.querySelector('.password-strength');
    
    if (!strengthIndicator) return;
    
    let strength = 0;
    let feedback = '';
    
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    
    switch (strength) {
        case 0:
        case 1:
            feedback = '<span class="text-danger">Weak</span>';
            break;
        case 2:
        case 3:
            feedback = '<span class="text-warning">Medium</span>';
            break;
        case 4:
        case 5:
            feedback = '<span class="text-success">Strong</span>';
            break;
    }
    
    strengthIndicator.innerHTML = feedback;
}

function validateEmail(event) {
    const email = event.target.value;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (email && !emailRegex.test(email)) {
        event.target.setCustomValidity('Please enter a valid email address');
        showToast('Please enter a valid email address', 'warning');
    } else {
        event.target.setCustomValidity('');
    }
}

// Utility functions
function formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
        return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeFormValidation();
    
    // Add loading states to buttons
    const submitButtons = document.querySelectorAll('button[type="submit"]');
    submitButtons.forEach(button => {
        button.addEventListener('click', function() {
            if (this.form && this.form.checkValidity()) {
                this.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Processing...';
                this.disabled = true;
            }
        });
    });
    
    // Auto-hide alerts after 5 seconds
    const alerts = document.querySelectorAll('.alert:not(.alert-permanent)');
    alerts.forEach(alert => {
        setTimeout(() => {
            if (alert.parentElement) {
                alert.style.opacity = '0';
                setTimeout(() => alert.remove(), 300);
            }
        }, 5000);
    });
});

// Copy function for codes
function copyAllCodes() {
    const codes = [];
    document.querySelectorAll('code.fs-5').forEach(codeEl => {
        codes.push(codeEl.textContent);
    });
    
    if (navigator.clipboard) {
        navigator.clipboard.writeText(codes.join('\n')).then(() => {
            showToast('All codes copied to clipboard!', 'success');
        }).catch(() => {
            showToast('Failed to copy codes to clipboard', 'danger');
        });
    } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = codes.join('\n');
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            showToast('All codes copied to clipboard!', 'success');
        } catch (err) {
            showToast('Failed to copy codes to clipboard', 'danger');
        }
        document.body.removeChild(textArea);
    }
}
function validatePasswordStrength(event) {
    const password = event.target.value;
    const strengthIndicator = event.target.parentNode.querySelector('.password-strength');
    
    if (!strengthIndicator) return;
    
    let strength = 0;
    let feedback = [];
    
    if (password.length >= 8) strength++;
    else feedback.push('At least 8 characters');
    
    if (/[a-z]/.test(password)) strength++;
    else feedback.push('Lowercase letter');
    
    if (/[A-Z]/.test(password)) strength++;
    else feedback.push('Uppercase letter');
    
    if (/[0-9]/.test(password)) strength++;
    else feedback.push('Number');
    
    if (/[^a-zA-Z0-9]/.test(password)) strength++;
    else feedback.push('Special character');
    
    const strengthText = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
    const strengthColor = ['danger', 'warning', 'info', 'success', 'success'];
    
    strengthIndicator.innerHTML = `
        <div class="progress mt-1" style="height: 4px;">
            <div class="progress-bar bg-${strengthColor[strength]}" style="width: ${(strength / 5) * 100}%"></div>
        </div>
        <small class="text-${strengthColor[strength]}">${strengthText[strength] || 'Very Weak'}</small>
    `;
}

/**
 * Validate email format
 * @param {Event} event 
 */
function validateEmail(event) {
    const email = event.target.value;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (email && !emailRegex.test(email)) {
        event.target.setCustomValidity('Please enter a valid email address');
        event.target.classList.add('is-invalid');
    } else {
        event.target.setCustomValidity('');
        event.target.classList.remove('is-invalid');
    }
}

/**
 * Initialize tooltips
 */
function initializeTooltips() {
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function(tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
}

/**
 * Initialize confirmation dialogs
 */
function initializeConfirmDialogs() {
    const confirmButtons = document.querySelectorAll('[data-confirm]');
    
    confirmButtons.forEach(button => {
        button.addEventListener('click', function(event) {
            const message = this.getAttribute('data-confirm');
            if (!confirm(message)) {
                event.preventDefault();
                return false;
            }
        });
    });
}

/**
 * Initialize image previews
 */
function initializeImagePreviews() {
    const imageInputs = document.querySelectorAll('input[type="file"][accept*="image"]');
    
    imageInputs.forEach(input => {
        input.addEventListener('change', function(event) {
            const file = event.target.files[0];
            if (!file) return;
            
            // Validate file size (5MB limit)
            if (file.size > 5 * 1024 * 1024) {
                showToast('Image file size must be less than 5MB', 'error');
                event.target.value = '';
                return;
            }
            
            // Validate file type
            if (!file.type.startsWith('image/')) {
                showToast('Please select a valid image file', 'error');
                event.target.value = '';
                return;
            }
            
            // Create preview
            const reader = new FileReader();
            reader.onload = function(e) {
                let preview = input.parentNode.querySelector('.image-preview');
                if (!preview) {
                    preview = document.createElement('div');
                    preview.className = 'image-preview mt-2';
                    input.parentNode.appendChild(preview);
                }
                
                preview.innerHTML = `
                    <img src="${e.target.result}" class="img-thumbnail" style="max-width: 200px; max-height: 200px;">
                    <button type="button" class="btn btn-sm btn-outline-danger ms-2" onclick="removeImagePreview(this)">
                        <i class="fas fa-times"></i>
                    </button>
                `;
            };
            reader.readAsDataURL(file);
        });
    });
}

/**
 * Remove image preview
 * @param {HTMLElement} button 
 */
function removeImagePreview(button) {
    const preview = button.closest('.image-preview');
    const input = preview.parentNode.querySelector('input[type="file"]');
    
    input.value = '';
    preview.remove();
}

/**
 * Initialize table sorting
 */
function initializeTableSorting() {
    const sortableTables = document.querySelectorAll('.table-sortable');
    
    sortableTables.forEach(table => {
        const headers = table.querySelectorAll('th[data-sort]');
        
        headers.forEach(header => {
            header.style.cursor = 'pointer';
            header.innerHTML += ' <i class="fas fa-sort text-muted"></i>';
            
            header.addEventListener('click', function() {
                sortTable(table, this.getAttribute('data-sort'), this);
            });
        });
    });
}

/**
 * Sort table by column
 * @param {HTMLElement} table 
 * @param {string} column 
 * @param {HTMLElement} header 
 */
function sortTable(table, column, header) {
    const tbody = table.querySelector('tbody');
    const rows = Array.from(tbody.querySelectorAll('tr'));
    const columnIndex = Array.from(header.parentNode.children).indexOf(header);
    
    const isAscending = !header.classList.contains('sort-asc');
    
    // Remove sort classes from all headers
    table.querySelectorAll('th').forEach(th => {
        th.classList.remove('sort-asc', 'sort-desc');
        const icon = th.querySelector('i');
        if (icon) {
            icon.className = 'fas fa-sort text-muted';
        }
    });
    
    // Add sort class to current header
    header.classList.add(isAscending ? 'sort-asc' : 'sort-desc');
    const icon = header.querySelector('i');
    if (icon) {
        icon.className = `fas fa-sort-${isAscending ? 'up' : 'down'} text-primary`;
    }
    
    // Sort rows
    rows.sort((a, b) => {
        const aValue = a.cells[columnIndex].textContent.trim();
        const bValue = b.cells[columnIndex].textContent.trim();
        
        // Try to parse as numbers
        const aNum = parseFloat(aValue);
        const bNum = parseFloat(bValue);
        
        if (!isNaN(aNum) && !isNaN(bNum)) {
            return isAscending ? aNum - bNum : bNum - aNum;
        }
        
        // String comparison
        return isAscending ? 
            aValue.localeCompare(bValue) : 
            bValue.localeCompare(aValue);
    });
    
    // Reappend sorted rows
    rows.forEach(row => tbody.appendChild(row));
}

/**
 * Initialize search filters
 */
function initializeSearchFilters() {
    const searchInputs = document.querySelectorAll('[data-search-target]');
    
    searchInputs.forEach(input => {
        const targetSelector = input.getAttribute('data-search-target');
        const targets = document.querySelectorAll(targetSelector);
        
        input.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            
            targets.forEach(target => {
                const text = target.textContent.toLowerCase();
                const matches = text.includes(searchTerm);
                
                target.style.display = matches ? '' : 'none';
                
                // Add highlight
                if (matches && searchTerm) {
                    highlightText(target, searchTerm);
                } else {
                    removeHighlight(target);
                }
            });
        });
    });
}

/**
 * Highlight search text
 * @param {HTMLElement} element 
 * @param {string} searchTerm 
 */
function highlightText(element, searchTerm) {
    // Simple highlighting - in production, use a more robust solution
    const originalText = element.getAttribute('data-original-text') || element.textContent;
    
    if (!element.getAttribute('data-original-text')) {
        element.setAttribute('data-original-text', originalText);
    }
    
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    const highlightedText = originalText.replace(regex, '<mark>$1</mark>');
    
    element.innerHTML = highlightedText;
}

/**
 * Remove highlight from text
 * @param {HTMLElement} element 
 */
function removeHighlight(element) {
    const originalText = element.getAttribute('data-original-text');
    if (originalText) {
        element.textContent = originalText;
    }
}

/**
 * Handle network status
 */
function handleNetworkStatus() {
    function updateNetworkStatus() {
        if (!navigator.onLine) {
            showToast('You are currently offline. Some features may not work properly.', 'warning', 10000);
        }
    }
    
    window.addEventListener('online', function() {
        showToast('You are back online!', 'success');
    });
    
    window.addEventListener('offline', updateNetworkStatus);
    
    // Check initial status
    updateNetworkStatus();
}

/**
 * Format time duration
 * @param {number} seconds 
 * @returns {string}
 */
function formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
        return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
}

/**
 * Debounce function to limit API calls
 * @param {Function} func 
 * @param {number} wait 
 * @returns {Function}
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Throttle function to limit execution frequency
 * @param {Function} func 
 * @param {number} limit 
 * @returns {Function}
 */
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * Copy text to clipboard
 * @param {string} text 
 * @returns {Promise}
 */
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        showToast('Copied to clipboard!', 'success');
        return true;
    } catch (err) {
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
            textArea.remove();
            showToast('Copied to clipboard!', 'success');
            return true;
        } catch (err) {
            textArea.remove();
            showToast('Failed to copy to clipboard', 'error');
            return false;
        }
    }
}

/**
 * Generate random string
 * @param {number} length 
 * @returns {string}
 */
function generateRandomString(length = 8) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

/**
 * Validate file upload
 * @param {File} file 
 * @param {Object} options 
 * @returns {Object}
 */
function validateFileUpload(file, options = {}) {
    const defaults = {
        maxSize: 5 * 1024 * 1024, // 5MB
        allowedTypes: ['image/jpeg', 'image/png', 'image/gif'],
        maxWidth: 2000,
        maxHeight: 2000
    };
    
    const config = { ...defaults, ...options };
    const errors = [];
    
    // Check file size
    if (file.size > config.maxSize) {
        errors.push(`File size must be less than ${config.maxSize / (1024 * 1024)}MB`);
    }
    
    // Check file type
    if (!config.allowedTypes.includes(file.type)) {
        errors.push(`File type not allowed. Allowed types: ${config.allowedTypes.join(', ')}`);
    }
    
    return {
        valid: errors.length === 0,
        errors: errors
    };
}

/**
 * Auto-save functionality
 * @param {string} key - Storage key
 * @param {Function} getData - Function to get data to save
 * @param {number} interval - Save interval in milliseconds
 * @returns {Function} - Cleanup function
 */
function setupAutoSave(key, getData, interval = 30000) {
    const saveData = () => {
        try {
            const data = getData();
            localStorage.setItem(key, JSON.stringify({
                data: data,
                timestamp: Date.now()
            }));
        } catch (error) {
            console.error('Auto-save failed:', error);
        }
    };
    
    const intervalId = setInterval(saveData, interval);
    
    // Save on page unload
    const unloadHandler = () => saveData();
    window.addEventListener('beforeunload', unloadHandler);
    
    // Return cleanup function
    return () => {
        clearInterval(intervalId);
        window.removeEventListener('beforeunload', unloadHandler);
    };
}

/**
 * Load auto-saved data
 * @param {string} key - Storage key
 * @param {number} maxAge - Maximum age in milliseconds
 * @returns {*} - Saved data or null
 */
function loadAutoSavedData(key, maxAge = 24 * 60 * 60 * 1000) {
    try {
        const saved = localStorage.getItem(key);
        if (!saved) return null;
        
        const parsed = JSON.parse(saved);
        const age = Date.now() - parsed.timestamp;
        
        if (age > maxAge) {
            localStorage.removeItem(key);
            return null;
        }
        
        return parsed.data;
    } catch (error) {
        console.error('Failed to load auto-saved data:', error);
        return null;
    }
}

// Export functions for use in other files
window.CBTPortal = {
    showToast,
    formatTime,
    debounce,
    throttle,
    copyToClipboard,
    generateRandomString,
    validateFileUpload,
    setupAutoSave,
    loadAutoSavedData
};
