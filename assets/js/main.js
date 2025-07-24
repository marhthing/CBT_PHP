/**
 * CBT Portal - Enhanced Main JavaScript
 * Modern, feature-rich client-side functionality
 */

// Global configuration
window.CBTPortal = {
    config: {
        animationDuration: 300,
        toastDuration: 5000,
        ajaxTimeout: 30000
    },

    // Utility functions
    utils: {
        formatTime: function(seconds) {
            const hours = Math.floor(seconds / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);
            const secs = seconds % 60;

            if (hours > 0) {
                return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
            } else {
                return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
            }
        },

        debounce: function(func, wait) {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    clearTimeout(timeout);
                    func(...args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        },

        throttle: function(func, limit) {
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
        },

        showNotification: function(message, type = 'info', duration = 5000) {
            const alertClass = type === 'error' ? 'danger' : type;
            const icon = {
                'success': 'fas fa-check-circle',
                'danger': 'fas fa-exclamation-triangle',
                'warning': 'fas fa-exclamation-circle',
                'info': 'fas fa-info-circle'
            }[alertClass] || 'fas fa-info-circle';

            const alertHtml = `
                <div class="alert alert-${alertClass} alert-dismissible fade show" role="alert" style="position: fixed; top: 20px; right: 20px; z-index: 9999; min-width: 300px; box-shadow: var(--shadow-xl);">
                    <i class="${icon} me-2"></i>
                    ${message}
                    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                </div>
            `;

            $('body').append(alertHtml);

            // Auto-dismiss after duration
            setTimeout(() => {
                $('.alert').last().fadeOut(300, function() {
                    $(this).remove();
                });
            }, duration);
        },

        validateForm: function(formSelector) {
            const form = $(formSelector);
            let isValid = true;

            // Remove previous validation classes
            form.find('.is-invalid').removeClass('is-invalid');
            form.find('.invalid-feedback').remove();

            // Validate required fields
            form.find('[required]').each(function() {
                const field = $(this);
                const value = field.val().trim();

                if (!value) {
                    isValid = false;
                    field.addClass('is-invalid');
                    field.after('<div class="invalid-feedback">This field is required.</div>');
                }
            });

            // Validate email fields
            form.find('input[type="email"]').each(function() {
                const field = $(this);
                const value = field.val().trim();
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

                if (value && !emailRegex.test(value)) {
                    isValid = false;
                    field.addClass('is-invalid');
                    field.after('<div class="invalid-feedback">Please enter a valid email address.</div>');
                }
            });

            return isValid;
        },

        formatFileSize: function(bytes) {
            if (bytes === 0) return '0 Bytes';
            const k = 1024;
            const sizes = ['Bytes', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        },

        copyToClipboard: function(text) {
            if (navigator.clipboard) {
                navigator.clipboard.writeText(text).then(() => {
                    this.showNotification('Text copied to clipboard!', 'success', 2000);
                }).catch(() => {
                    this.fallbackCopyToClipboard(text);
                });
            } else {
                this.fallbackCopyToClipboard(text);
            }
        },

        fallbackCopyToClipboard: function(text) {
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
                this.showNotification('Text copied to clipboard!', 'success', 2000);
            } catch (err) {
                this.showNotification('Failed to copy text', 'error', 3000);
            }

            document.body.removeChild(textArea);
        }
    },

    // Loading management
    loading: {
        show: function(message = 'Loading...') {
            const loadingOverlay = $('#loadingOverlay');
            if (loadingOverlay.length) {
                loadingOverlay.find('strong').text(message);
                loadingOverlay.addClass('show');
            }
        },

        hide: function() {
            const loadingOverlay = $('#loadingOverlay');
            if (loadingOverlay.length) {
                loadingOverlay.removeClass('show');
            }
        }
    },

    // AJAX utilities
    ajax: {
        request: function(options) {
            const defaults = {
                timeout: CBTPortal.config.ajaxTimeout,
                beforeSend: function() {
                    CBTPortal.loading.show();
                },
                complete: function() {
                    CBTPortal.loading.hide();
                },
                error: function(xhr, status, error) {
                    let message = 'An error occurred. Please try again.';

                    if (xhr.responseJSON && xhr.responseJSON.message) {
                        message = xhr.responseJSON.message;
                    } else if (status === 'timeout') {
                        message = 'Request timeout. Please check your connection.';
                    } else if (status === 'abort') {
                        return; // Don't show error for aborted requests
                    }

                    CBTPortal.utils.showNotification(message, 'error');
                }
            };

            return $.ajax($.extend({}, defaults, options));
        }
    }
};

// Enhanced jQuery document ready
$(document).ready(function() {
    'use strict';

    // Initialize loading overlay
    CBTPortal.loading.hide();

    // Enhanced form validation
    $('form[data-validate="true"]').on('submit', function(e) {
        if (!CBTPortal.utils.validateForm(this)) {
            e.preventDefault();
            return false;
        }
    });

    // Auto-dismiss alerts
    $('.alert:not(.alert-permanent)').each(function() {
        const alert = $(this);
        setTimeout(() => {
            alert.fadeOut(CBTPortal.config.animationDuration, function() {
                $(this).remove();
            });
        }, CBTPortal.config.toastDuration);
    });

    // Enhanced button click effects
    $('.btn').on('click', function() {
        const btn = $(this);
        if (!btn.hasClass('btn-no-effect')) {
            btn.addClass('clicked');
            setTimeout(() => btn.removeClass('clicked'), 150);
        }
    });

    // Smooth scrolling for anchor links
    $('a[href^="#"]:not([href="#"])').on('click', function(e) {
        const target = $(this.getAttribute('href'));
        if (target.length) {
            e.preventDefault();
            $('html, body').animate({
                scrollTop: target.offset().top - 100
            }, 500, 'easeInOutQuart');
        }
    });

    // Auto-resize textareas
    $('textarea[data-auto-resize="true"]').each(function() {
        const textarea = this;
        textarea.style.height = 'auto';
        textarea.style.height = textarea.scrollHeight + 'px';

        $(textarea).on('input', function() {
            this.style.height = 'auto';
            this.style.height = this.scrollHeight + 'px';
        });
    });

    // Enhanced file input handling
    $('input[type="file"]').on('change', function() {
        const input = $(this);
        const files = this.files;
        const maxSize = input.data('max-size') || 5242880; // 5MB default
        const allowedTypes = input.data('allowed-types');

        if (files.length > 0) {
            const file = files[0];
            let isValid = true;
            let errorMessage = '';

            // Check file size
            if (file.size > maxSize) {
                isValid = false;
                errorMessage = `File size must be less than ${CBTPortal.utils.formatFileSize(maxSize)}`;
            }

            // Check file type
            if (allowedTypes) {
                const allowedTypesArray = allowedTypes.split(',').map(type => type.trim());
                const fileExtension = file.name.split('.').pop().toLowerCase();

                if (!allowedTypesArray.includes(fileExtension)) {
                    isValid = false;
                    errorMessage = `Only ${allowedTypes} files are allowed`;
                }
            }

            if (!isValid) {
                input.val('');
                CBTPortal.utils.showNotification(errorMessage, 'error');
                return;
            }

            // Show file info
            const fileInfo = `Selected: ${file.name} (${CBTPortal.utils.formatFileSize(file.size)})`;
            const infoElement = input.next('.file-info');

            if (infoElement.length) {
                infoElement.text(fileInfo);
            } else {
                input.after(`<small class="file-info text-muted d-block mt-1">${fileInfo}</small>`);
            }
        }
    });

    // Copy to clipboard functionality
    $('[data-clipboard]').on('click', function() {
        const text = $(this).data('clipboard');
        CBTPortal.utils.copyToClipboard(text);
    });

    // Confirmation dialogs
    $('[data-confirm]').on('click', function(e) {
        const message = $(this).data('confirm') || 'Are you sure?';
        if (!confirm(message)) {
            e.preventDefault();
            return false;
        }
    });

    // Auto-save functionality for forms
    $('form[data-auto-save="true"]').each(function() {
        const form = $(this);
        const autoSaveKey = form.data('auto-save-key') || 'form_auto_save';

        // Load saved data
        const savedData = localStorage.getItem(autoSaveKey);
        if (savedData) {
            try {
                const data = JSON.parse(savedData);
                Object.keys(data).forEach(key => {
                    const field = form.find(`[name="${key}"]`);
                    if (field.length && field.attr('type') !== 'password') {
                        field.val(data[key]);
                    }
                });
            } catch (e) {
                console.warn('Failed to load auto-saved data:', e);
            }
        }

        // Save data on change (debounced)
        const saveData = CBTPortal.utils.debounce(() => {
            const formData = {};
            form.find('input, textarea, select').each(function() {
                const field = $(this);
                const name = field.attr('name');
                const type = field.attr('type');

                if (name && type !== 'password' && type !== 'file') {
                    formData[name] = field.val();
                }
            });

            localStorage.setItem(autoSaveKey, JSON.stringify(formData));
        }, 1000);

        form.on('input change', 'input, textarea, select', saveData);

        // Clear saved data on successful submit
        form.on('submit', function() {
            localStorage.removeItem(autoSaveKey);
        });
    });

    // Enhanced table functionality
    $('.table-sortable th[data-sort]').on('click', function() {
        const th = $(this);
        const table = th.closest('table');
        const column = th.data('sort');
        const order = th.hasClass('sort-asc') ? 'desc' : 'asc';

        // Remove sort classes from other headers
        table.find('th').removeClass('sort-asc sort-desc');
        th.addClass('sort-' + order);

        // Sort table rows
        const tbody = table.find('tbody');
        const rows = tbody.find('tr').toArray();

        rows.sort((a, b) => {
            const aVal = $(a).find(`td:eq(${th.index()})`).text().trim();
            const bVal = $(b).find(`td:eq(${th.index()})`).text().trim();

            let result;
            if (!isNaN(aVal) && !isNaN(bVal)) {
                result = parseFloat(aVal) - parseFloat(bVal);
            } else {
                result = aVal.localeCompare(bVal);
            }

            return order === 'asc' ? result : -result;
        });

        tbody.empty().append(rows);
    });

    // Search functionality
    $('[data-search-target]').on('input', CBTPortal.utils.debounce(function() {
        const searchTerm = $(this).val().toLowerCase();
        const targetSelector = $(this).data('search-target');
        const target = $(targetSelector);

        if (target.is('table')) {
            target.find('tbody tr').each(function() {
                const row = $(this);
                const text = row.text().toLowerCase();
                row.toggle(text.includes(searchTerm));
            });
        } else {
            target.children().each(function() {
                const item = $(this);
                const text = item.text().toLowerCase();
                item.toggle(text.includes(searchTerm));
            });
        }
    }, 300));

    // Initialize tooltips and popovers
    $('[data-bs-toggle="tooltip"]').tooltip();
    $('[data-bs-toggle="popover"]').popover();

    // Page transition effects
    $('a:not([href^="#"]):not([href^="javascript:"]):not([data-bs-toggle]):not([target="_blank"])').on('click', function() {
        if (this.hostname === window.location.hostname) {
            CBTPortal.loading.show('Loading page...');
        }
    });

    // Form submission loading
    $('form').on('submit', function() {
        const submitBtn = $(this).find('button[type="submit"], input[type="submit"]');
        submitBtn.prop('disabled', true);

        const originalText = submitBtn.html();
        submitBtn.html('<i class="fas fa-spinner fa-spin me-2"></i>Processing...');

        // Re-enable after 30 seconds as fallback
        setTimeout(() => {
            submitBtn.prop('disabled', false).html(originalText);
        }, 30000);

        CBTPortal.loading.show('Processing...');
    });

    // Error handling for images
    $('img').on('error', function() {
        const img = $(this);
        if (!img.hasClass('error-handled')) {
            img.addClass('error-handled');
            img.attr('src', 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCxzYW5zLXNlcmlmIiBmb250LXNpemU9IjE0IiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+SW1hZ2UgTm90IEZvdW5kPC90ZXh0Pjwvc3ZnPg==');
            img.attr('alt', 'Image not found');
        }
    });

    console.log('✅ CBT Portal JavaScript initialized successfully');
});

// Global error handling
window.addEventListener('error', function(e) {
    console.error('Global error:', e.error);
    if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        // Only show user-friendly errors in production
        CBTPortal.utils.showNotification('An unexpected error occurred. Please refresh the page and try again.', 'error');
    }
});

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', function(e) {
    console.error('Unhandled promise rejection:', e.reason);
    if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        CBTPortal.utils.showNotification('An unexpected error occurred. Please refresh the page and try again.', 'error');
    }
});

// Expose utility functions globally for backward compatibility
window.formatTime = CBTPortal.utils.formatTime;
window.debounce = CBTPortal.utils.debounce;
window.showNotification = CBTPortal.utils.showNotification;