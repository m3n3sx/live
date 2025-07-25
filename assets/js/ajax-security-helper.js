/**
 * AJAX Security Helper - Frontend Integration
 * 
 * Provides unified nonce handling and AJAX request helpers
 * for the new AjaxSecurityManager system.
 * 
 * @package ModernAdminStyler
 * @version 2.4.0 - Security Overhaul
 */

(function($) {
    'use strict';
    
    // Unified AJAX Security Helper
    window.MasAjaxSecurity = {
        
        // Unified nonce action name (must match PHP)
        nonceAction: 'mas_v2_ajax_nonce',
        
        // Current nonce value (set by WordPress)
        nonce: window.masAjaxSecurity?.nonce || '',
        
        /**
         * Make secure AJAX request with unified security
         * 
         * @param {string} action AJAX action name
         * @param {object} data Request data
         * @param {object} options jQuery AJAX options
         * @returns {Promise} AJAX promise
         */
        request: function(action, data = {}, options = {}) {
            // Add security data
            const secureData = {
                action: action,
                nonce: this.nonce,
                ...data
            };
            
            // Default options
            const defaultOptions = {
                url: window.ajaxurl || '/wp-admin/admin-ajax.php',
                type: 'POST',
                data: secureData,
                dataType: 'json',
                timeout: 30000 // 30 second timeout
            };
            
            // Merge options
            const ajaxOptions = { ...defaultOptions, ...options };
            
            // Make request and handle security errors
            return $.ajax(ajaxOptions)
                .fail((xhr, status, error) => {
                    this.handleAjaxError(xhr, status, error, action);
                });
        },
        
        /**
         * Handle AJAX errors with security context
         * 
         * @param {object} xhr XMLHttpRequest object
         * @param {string} status Error status
         * @param {string} error Error message
         * @param {string} action AJAX action that failed
         */
        handleAjaxError: function(xhr, status, error, action) {
            let errorMessage = 'AJAX request failed';
            let errorCode = 'ajax_error';
            
            try {
                const response = JSON.parse(xhr.responseText);
                if (response && response.data) {
                    errorMessage = response.data.message || errorMessage;
                    errorCode = response.data.code || errorCode;
                }
            } catch (e) {
                // Response is not JSON, use default error
            }
            
            // Log error for debugging
            console.error('MAS AJAX Error:', {
                action: action,
                status: status,
                error: error,
                code: errorCode,
                message: errorMessage,
                xhr: xhr
            });
            
            // Handle specific security errors
            if (errorCode === 'invalid_nonce' || errorCode === 'security_error') {
                this.handleSecurityError(errorCode, errorMessage);
            } else if (errorCode === 'rate_limit_exceeded') {
                this.handleRateLimitError(errorMessage);
            }
            
            // Send error to backend for logging
            this.logErrorToBackend({
                action: action,
                error_code: errorCode,
                error_message: errorMessage,
                status: status,
                timestamp: new Date().toISOString(),
                url: window.location.href,
                user_agent: navigator.userAgent
            });
        },
        
        /**
         * Handle security errors (nonce failures, etc.)
         * 
         * @param {string} code Error code
         * @param {string} message Error message
         */
        handleSecurityError: function(code, message) {
            console.warn('Security Error:', code, message);
            
            // Show user-friendly message
            if (window.masToast) {
                window.masToast.error('Security verification failed. Please refresh the page and try again.');
            } else {
                alert('Security verification failed. Please refresh the page and try again.');
            }
            
            // Optionally reload page after delay
            setTimeout(() => {
                if (confirm('Would you like to reload the page to fix the security issue?')) {
                    window.location.reload();
                }
            }, 2000);
        },
        
        /**
         * Handle rate limit errors
         * 
         * @param {string} message Error message
         */
        handleRateLimitError: function(message) {
            console.warn('Rate Limit Exceeded:', message);
            
            // Show user-friendly message
            if (window.masToast) {
                window.masToast.warning(message);
            } else {
                alert(message);
            }
        },
        
        /**
         * Log frontend errors to backend
         * 
         * @param {object} errorData Error information
         */
        logErrorToBackend: function(errorData) {
            // Don't log if we're already in an error state
            if (this.isLoggingError) {
                return;
            }
            
            this.isLoggingError = true;
            
            $.ajax({
                url: window.ajaxurl || '/wp-admin/admin-ajax.php',
                type: 'POST',
                data: {
                    action: 'mas_log_error',
                    error_data: JSON.stringify(errorData)
                },
                timeout: 5000 // Short timeout for error logging
            }).always(() => {
                this.isLoggingError = false;
            });
        },
        
        /**
         * Refresh nonce (for long-running pages)
         * 
         * @returns {Promise} Promise that resolves when nonce is refreshed
         */
        refreshNonce: function() {
            return $.ajax({
                url: window.ajaxurl || '/wp-admin/admin-ajax.php',
                type: 'POST',
                data: {
                    action: 'mas_get_nonce'
                },
                dataType: 'json'
            }).done((response) => {
                if (response.success && response.data.nonce) {
                    this.nonce = response.data.nonce;
                    console.log('Nonce refreshed successfully');
                }
            });
        },
        
        /**
         * Check if current nonce is valid
         * 
         * @returns {Promise} Promise that resolves with validity status
         */
        validateNonce: function() {
            return $.ajax({
                url: window.ajaxurl || '/wp-admin/admin-ajax.php',
                type: 'POST',
                data: {
                    action: 'mas_validate_nonce',
                    nonce: this.nonce
                },
                dataType: 'json'
            });
        },
        
        /**
         * Initialize comprehensive JavaScript error capture
         */
        initializeErrorCapture: function() {
            const self = this;
            
            // Global error handler for uncaught exceptions
            window.addEventListener('error', function(event) {
                self.captureJavaScriptError({
                    message: event.message,
                    filename: event.filename,
                    lineno: event.lineno,
                    colno: event.colno,
                    error: event.error,
                    type: 'javascript_error',
                    timestamp: new Date().toISOString()
                });
            });
            
            // Global handler for unhandled promise rejections
            window.addEventListener('unhandledrejection', function(event) {
                self.captureJavaScriptError({
                    message: event.reason?.message || 'Unhandled Promise Rejection',
                    filename: 'promise',
                    lineno: 0,
                    colno: 0,
                    error: event.reason,
                    type: 'promise_rejection',
                    timestamp: new Date().toISOString(),
                    promise: event.promise
                });
            });
            
            // Console error override for additional capture
            const originalConsoleError = console.error;
            console.error = function(...args) {
                // Call original console.error
                originalConsoleError.apply(console, args);
                
                // Capture for logging if it looks like an error
                if (args.length > 0 && (typeof args[0] === 'string' || args[0] instanceof Error)) {
                    self.captureJavaScriptError({
                        message: args[0]?.message || args[0]?.toString() || 'Console Error',
                        type: 'console_error',
                        timestamp: new Date().toISOString(),
                        arguments: args.map(arg => arg?.toString()).join(' ')
                    });
                }
            };
            
            console.log('MAS Error Capture initialized');
        },
        
        /**
         * Capture and process JavaScript errors
         * 
         * @param {object} errorInfo Error information
         */
        captureJavaScriptError: function(errorInfo) {
            // Don't capture errors during error logging to prevent loops
            if (this.isLoggingError) {
                return;
            }
            
            // Enhance error info with additional context
            const enhancedError = {
                ...errorInfo,
                url: window.location.href,
                userAgent: navigator.userAgent,
                viewport: {
                    width: window.innerWidth,
                    height: window.innerHeight
                },
                screen: {
                    width: screen.width,
                    height: screen.height,
                    colorDepth: screen.colorDepth
                },
                timestamp: errorInfo.timestamp || new Date().toISOString(),
                stack: errorInfo.error?.stack || (new Error()).stack,
                name: errorInfo.error?.name || 'Error'
            };
            
            // Log to console for immediate debugging
            console.error('MAS JavaScript Error Captured:', enhancedError);
            
            // Send to backend for comprehensive logging
            this.logErrorToBackend(enhancedError);
        }
    };
    
    // Initialize when document is ready
    $(document).ready(function() {
        // Set up periodic nonce refresh for long-running pages
        if (window.masAjaxSecurity?.autoRefresh) {
            setInterval(() => {
                MasAjaxSecurity.refreshNonce();
            }, 30 * 60 * 1000); // Refresh every 30 minutes
        }
        
        // Global AJAX error handler
        $(document).ajaxError(function(event, xhr, settings, error) {
            // Only handle our AJAX requests
            if (settings.data && typeof settings.data === 'string' && 
                settings.data.includes('mas_')) {
                console.warn('Global AJAX Error detected:', {
                    url: settings.url,
                    data: settings.data,
                    error: error,
                    status: xhr.status
                });
            }
        });
        
        // Enhanced JavaScript error capture
        MasAjaxSecurity.initializeErrorCapture();
    });
    
})(jQuery);