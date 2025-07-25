/**
 * 🎛️ EventManager - Robust Event Handling System
 * 
 * Centralized event management system with:
 * - Global event delegation for performance
 * - Dynamic element support with automatic rebinding
 * - Event type abstraction for different control types
 * - Error handling and recovery mechanisms
 * - Cross-browser compatibility
 * 
 * @package ModernAdminStyler
 * @version 1.0.0 - Initial Implementation
 */

(function(window, document) {
    'use strict';

    /**
     * 🎛️ EventManager - Main Event Management Class
     */
    class EventManager {
        constructor() {
            this.eventDelegates = new Map();
            this.controlHandlers = new Map();
            this.dynamicObserver = null;
            this.isInitialized = false;
            this.debugMode = window.masV2Debug || false;
            this.retryAttempts = new Map();
            this.maxRetries = 3;
            
            this.setupGlobalDelegation();
            this.setupDynamicObserver();
            this.setupErrorHandling();
            
            this.log('EventManager initialized');
        }

        /**
         * 🌐 Setup global event delegation
         */
        setupGlobalDelegation() {
            // Single event listener on document for all events
            const eventTypes = ['click', 'change', 'input', 'focus', 'blur', 'keydown', 'keyup'];
            
            eventTypes.forEach(eventType => {
                document.addEventListener(eventType, (event) => {
                    this.handleGlobalEvent(event);
                }, true); // Use capture phase for better control
            });
            
            // Special handling for form submission
            document.addEventListener('submit', (event) => {
                this.handleFormSubmission(event);
            }, true);
            
            this.log('Global event delegation setup complete');
        }

        /**
         * 🎯 Handle global events with delegation
         */
        handleGlobalEvent(event) {
            try {
                const target = event.target;
                
                // Check if target has micro-panel control attributes
                if (this.isMicroPanelControl(target)) {
                    this.handleMicroPanelControl(target, event);
                }
                
                // Check for custom event handlers
                const customHandler = this.findCustomHandler(target, event.type);
                if (customHandler) {
                    customHandler(target, event);
                }
                
                // Handle special cases
                this.handleSpecialCases(target, event);
                
            } catch (error) {
                this.handleEventError(error, event);
            }
        }

        /**
         * 🎛️ Check if element is a micro-panel control
         */
        isMicroPanelControl(element) {
            return element.hasAttribute('data-option-id') ||
                   element.closest('.woow-micro-panel') ||
                   element.closest('.mas-micro-panel') ||
                   element.classList.contains('woow-control') ||
                   element.classList.contains('mas-control');
        }

        /**
         * 🎨 Handle micro-panel control events
         */
        handleMicroPanelControl(element, event) {
            const optionId = element.getAttribute('data-option-id');
            const controlType = this.getControlType(element);
            const eventType = event.type;
            
            // Only handle relevant events for each control type
            if (!this.isRelevantEvent(controlType, eventType)) {
                return;
            }
            
            this.log(`Handling ${eventType} event for ${controlType} control: ${optionId}`);
            
            try {
                // Get the current value
                const value = this.getControlValue(element, controlType);
                
                // Apply the change immediately
                this.applyControlChange(optionId, value, element, event);
                
                // Update related UI elements
                this.updateRelatedElements(element, value, controlType);
                
                // Provide visual feedback
                this.showControlFeedback(element, 'success');
                
            } catch (error) {
                this.handleControlError(error, element, optionId);
            }
        }

        /**
         * 🔍 Get control type from element
         */
        getControlType(element) {
            // Check explicit type attribute
            if (element.hasAttribute('data-control-type')) {
                return element.getAttribute('data-control-type');
            }
            
            // Infer from element type and classes
            if (element.type === 'color') return 'color';
            if (element.type === 'range') return 'slider';
            if (element.type === 'checkbox') return 'toggle';
            if (element.type === 'radio') return 'radio';
            if (element.type === 'select-one') return 'select';
            if (element.tagName === 'SELECT') return 'select';
            if (element.classList.contains('woow-color-control')) return 'color';
            if (element.classList.contains('woow-slider-control')) return 'slider';
            if (element.classList.contains('woow-toggle-control')) return 'toggle';
            
            return 'text'; // Default fallback
        }

        /**
         * ✅ Check if event is relevant for control type
         */
        isRelevantEvent(controlType, eventType) {
            const relevantEvents = {
                'color': ['change', 'input'],
                'slider': ['input', 'change'],
                'toggle': ['change', 'click'],
                'radio': ['change', 'click'],
                'select': ['change'],
                'text': ['input', 'change', 'blur'],
                'number': ['input', 'change', 'blur']
            };
            
            return relevantEvents[controlType]?.includes(eventType) || false;
        }

        /**
         * 📊 Get control value based on type
         */
        getControlValue(element, controlType) {
            switch (controlType) {
                case 'toggle':
                case 'radio':
                    return element.checked;
                    
                case 'slider':
                case 'number':
                    return parseFloat(element.value) || 0;
                    
                case 'color':
                case 'text':
                case 'select':
                default:
                    return element.value;
            }
        }

        /**
         * 🎨 Apply control change
         */
        applyControlChange(optionId, value, element, event) {
            // Use CSSVariableMapper if available
            if (window.cssVariableMapperInstance) {
                const success = window.cssVariableMapperInstance.applyOption(optionId, value);
                if (!success) {
                    this.log(`Failed to apply option via CSSVariableMapper: ${optionId}`, 'warning');
                    // Try fallback method
                    this.applyFallbackChange(optionId, value, element);
                }
            } else {
                // Fallback to direct application
                this.applyFallbackChange(optionId, value, element);
            }
            
            // Broadcast change for cross-tab sync
            this.broadcastChange(optionId, value);
            
            // Schedule save to backend
            this.scheduleSave(optionId, value);
            
            // Trigger custom event
            this.triggerCustomEvent('woow:option-changed', {
                optionId: optionId,
                value: value,
                element: element,
                originalEvent: event
            });
        }

        /**
         * 🔄 Apply fallback change method
         */
        applyFallbackChange(optionId, value, element) {
            // Try to get CSS variable from element attributes
            const cssVar = element.getAttribute('data-css-var');
            const unit = element.getAttribute('data-unit') || '';
            const bodyClass = element.getAttribute('data-body-class');
            
            if (cssVar) {
                this.applyCSSVariable(cssVar, value, unit);
            }
            
            if (bodyClass) {
                this.applyBodyClass(bodyClass, value);
            }
        }

        /**
         * 🎨 Apply CSS variable directly
         */
        applyCSSVariable(cssVar, value, unit = '') {
            let cssValue = value;
            
            // Format value based on type
            if (typeof value === 'boolean') {
                cssValue = value ? '1' : '0';
            } else if (typeof value === 'number' || !isNaN(value)) {
                cssValue = value + unit;
            }
            
            // Apply to document root
            document.documentElement.style.setProperty(cssVar, cssValue);
            
            // Also apply to body for higher specificity
            document.body.style.setProperty(cssVar, cssValue, 'important');
            
            this.log(`Applied CSS variable: ${cssVar} = ${cssValue}`);
        }

        /**
         * 🏷️ Apply body class
         */
        applyBodyClass(className, value) {
            if (value) {
                document.body.classList.add(className);
            } else {
                document.body.classList.remove(className);
            }
            
            this.log(`Body class ${value ? 'added' : 'removed'}: ${className}`);
        }

        /**
         * 🔄 Update related UI elements
         */
        updateRelatedElements(element, value, controlType) {
            // Update slider value displays
            if (controlType === 'slider') {
                const valueDisplay = element.parentElement.querySelector('.woow-slider-value, .mas-slider-value');
                if (valueDisplay) {
                    const unit = element.getAttribute('data-unit') || '';
                    valueDisplay.textContent = value + unit;
                }
            }
            
            // Update color preview elements
            if (controlType === 'color') {
                const preview = element.parentElement.querySelector('.woow-color-preview, .mas-color-preview');
                if (preview) {
                    preview.style.backgroundColor = value;
                }
            }
            
            // Update toggle labels
            if (controlType === 'toggle') {
                const label = element.parentElement.querySelector('.woow-toggle-label, .mas-toggle-label');
                if (label) {
                    label.textContent = value ? 'On' : 'Off';
                    label.className = `woow-toggle-label ${value ? 'active' : 'inactive'}`;
                }
            }
        }

        /**
         * ✨ Show visual feedback for control
         */
        showControlFeedback(element, type = 'success') {
            const wrapper = element.closest('.woow-control-wrapper, .mas-control-wrapper') || element.parentElement;
            
            if (wrapper) {
                // Remove existing feedback classes
                wrapper.classList.remove('woow-feedback-success', 'woow-feedback-error', 'woow-feedback-warning');
                
                // Add new feedback class
                wrapper.classList.add(`woow-feedback-${type}`);
                
                // Apply visual styles
                const colors = {
                    success: '#e8f5e8',
                    error: '#ffeaea',
                    warning: '#fff8e1'
                };
                
                const originalBg = wrapper.style.backgroundColor;
                wrapper.style.backgroundColor = colors[type];
                wrapper.style.transition = 'background-color 0.3s ease';
                
                // Reset after animation
                setTimeout(() => {
                    wrapper.style.backgroundColor = originalBg;
                    wrapper.classList.remove(`woow-feedback-${type}`);
                }, 300);
            }
        }

        /**
         * 📡 Broadcast change to other tabs
         */
        broadcastChange(optionId, value) {
            if (window.SyncManager && window.SyncManager.broadcast) {
                window.SyncManager.broadcast(optionId, value);
            }
        }

        /**
         * 💾 Schedule save to backend (debounced)
         */
        scheduleSave(optionId, value) {
            if (!this.saveTimers) {
                this.saveTimers = new Map();
            }
            
            // Clear existing timer for this option
            if (this.saveTimers.has(optionId)) {
                clearTimeout(this.saveTimers.get(optionId));
            }
            
            // Schedule new save
            const timer = setTimeout(() => {
                this.saveToBackend(optionId, value);
                this.saveTimers.delete(optionId);
            }, 1000); // 1 second debounce
            
            this.saveTimers.set(optionId, timer);
        }

        /**
         * 💾 Save to backend via AJAX
         */
        async saveToBackend(optionId, value) {
            try {
                const response = await fetch(window.ajaxurl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: new URLSearchParams({
                        action: 'mas_save_live_settings',
                        nonce: window.masNonce || window.mas_nonce || '',
                        [optionId]: value
                    })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    this.log(`Setting saved: ${optionId} = ${value}`);
                    this.retryAttempts.delete(optionId); // Clear retry count on success
                } else {
                    throw new Error(data.message || 'Unknown server error');
                }
            } catch (error) {
                this.handleSaveError(error, optionId, value);
            }
        }

        /**
         * 🔄 Handle save errors with retry mechanism
         */
        handleSaveError(error, optionId, value) {
            const attempts = this.retryAttempts.get(optionId) || 0;
            
            if (attempts < this.maxRetries) {
                // Retry after delay
                const delay = Math.pow(2, attempts) * 1000; // Exponential backoff
                this.retryAttempts.set(optionId, attempts + 1);
                
                this.log(`Save failed for ${optionId}, retrying in ${delay}ms (attempt ${attempts + 1}/${this.maxRetries})`, 'warning');
                
                setTimeout(() => {
                    this.saveToBackend(optionId, value);
                }, delay);
            } else {
                // Max retries reached
                this.logError(`Failed to save ${optionId} after ${this.maxRetries} attempts: ${error.message}`);
                this.retryAttempts.delete(optionId);
                
                // Show user notification
                this.showErrorNotification(`Failed to save setting: ${optionId}`);
            }
        }

        /**
         * 🎯 Find custom event handler
         */
        findCustomHandler(element, eventType) {
            // Check for registered custom handlers
            const key = `${eventType}:${element.tagName.toLowerCase()}`;
            return this.controlHandlers.get(key);
        }

        /**
         * 🔧 Handle special cases
         */
        handleSpecialCases(element, event) {
            // Handle escape key to close panels
            if (event.type === 'keydown' && event.key === 'Escape') {
                this.handleEscapeKey(event);
            }
            
            // Handle enter key in inputs
            if (event.type === 'keydown' && event.key === 'Enter') {
                this.handleEnterKey(element, event);
            }
            
            // Handle focus/blur for accessibility
            if (event.type === 'focus' || event.type === 'blur') {
                this.handleFocusChange(element, event);
            }
        }

        /**
         * ⌨️ Handle escape key
         */
        handleEscapeKey(event) {
            // Close all micro-panels
            if (window.microPanelFactoryInstance) {
                window.microPanelFactoryInstance.closeAllPanels();
            }
            
            // Close any modal dialogs
            const modals = document.querySelectorAll('.woow-modal, .mas-modal');
            modals.forEach(modal => {
                if (modal.style.display !== 'none') {
                    modal.style.display = 'none';
                }
            });
        }

        /**
         * ⏎ Handle enter key
         */
        handleEnterKey(element, event) {
            // Trigger change event for inputs
            if (element.tagName === 'INPUT' && element.type === 'text') {
                element.dispatchEvent(new Event('change', { bubbles: true }));
            }
        }

        /**
         * 👁️ Handle focus changes for accessibility
         */
        handleFocusChange(element, event) {
            if (event.type === 'focus') {
                element.classList.add('woow-focused');
            } else {
                element.classList.remove('woow-focused');
            }
        }

        /**
         * 📋 Handle form submission
         */
        handleFormSubmission(event) {
            const form = event.target;
            
            // Check if it's a micro-panel form
            if (form.classList.contains('woow-micro-panel-form') || 
                form.closest('.woow-micro-panel')) {
                
                event.preventDefault();
                this.handleMicroPanelFormSubmit(form);
            }
        }

        /**
         * 📋 Handle micro-panel form submission
         */
        handleMicroPanelFormSubmit(form) {
            const formData = new FormData(form);
            const changes = {};
            
            // Collect all form data
            for (const [key, value] of formData.entries()) {
                changes[key] = value;
            }
            
            // Apply all changes
            Object.entries(changes).forEach(([optionId, value]) => {
                if (window.cssVariableMapperInstance) {
                    window.cssVariableMapperInstance.applyOption(optionId, value);
                }
            });
            
            this.log('Applied bulk changes from form:', changes);
        }

        /**
         * 👁️ Setup dynamic element observer
         */
        setupDynamicObserver() {
            if (this.dynamicObserver) return; // Prevent multiple observers
            
            this.dynamicObserver = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            this.handleDynamicElement(node);
                        }
                    });
                });
            });
            
            this.dynamicObserver.observe(document.body, {
                childList: true,
                subtree: true
            });
            
            this.log('Dynamic element observer activated');
        }

        /**
         * 🆕 Handle dynamically added elements
         */
        handleDynamicElement(element) {
            // Check if element or its children have micro-panel controls
            const controls = element.querySelectorAll('[data-option-id], .woow-control, .mas-control');
            
            if (controls.length > 0) {
                this.log(`Found ${controls.length} new controls in dynamic element`);
                
                // No need to bind events - global delegation handles it
                // Just ensure proper attributes are set
                controls.forEach(control => {
                    this.ensureControlAttributes(control);
                });
            }
        }

        /**
         * ✅ Ensure control has proper attributes
         */
        ensureControlAttributes(control) {
            // Add control class if missing
            if (!control.classList.contains('woow-control') && 
                !control.classList.contains('mas-control')) {
                control.classList.add('woow-control');
            }
            
            // Ensure data-control-type is set
            if (!control.hasAttribute('data-control-type')) {
                const type = this.getControlType(control);
                control.setAttribute('data-control-type', type);
            }
        }

        /**
         * 🚨 Setup error handling
         */
        setupErrorHandling() {
            // Global error handler for unhandled errors
            window.addEventListener('error', (event) => {
                if (event.filename && event.filename.includes('event-manager')) {
                    this.handleGlobalError(event.error, event);
                }
            });
            
            // Unhandled promise rejection handler
            window.addEventListener('unhandledrejection', (event) => {
                this.handlePromiseRejection(event.reason, event);
            });
        }

        /**
         * 🚨 Handle event-specific errors
         */
        handleEventError(error, event) {
            this.logError(`Event handling error for ${event.type} on ${event.target.tagName}:`, error);
            
            // Try to recover
            this.attemptErrorRecovery(event.target, event.type);
        }

        /**
         * 🚨 Handle control-specific errors
         */
        handleControlError(error, element, optionId) {
            this.logError(`Control error for ${optionId}:`, error);
            
            // Show visual feedback
            this.showControlFeedback(element, 'error');
            
            // Try to recover
            this.attemptControlRecovery(element, optionId);
        }

        /**
         * 🔄 Attempt error recovery
         */
        attemptErrorRecovery(element, eventType) {
            try {
                // Re-ensure control attributes
                if (this.isMicroPanelControl(element)) {
                    this.ensureControlAttributes(element);
                }
                
                // Clear any error states
                element.classList.remove('woow-error', 'mas-error');
                
                this.log(`Attempted recovery for ${eventType} event on ${element.tagName}`);
            } catch (recoveryError) {
                this.logError('Recovery attempt failed:', recoveryError);
            }
        }

        /**
         * 🔄 Attempt control recovery
         */
        attemptControlRecovery(element, optionId) {
            try {
                // Reset control to default state
                const controlType = this.getControlType(element);
                const defaultValue = this.getDefaultValue(controlType);
                
                if (defaultValue !== null) {
                    this.setControlValue(element, defaultValue, controlType);
                    this.log(`Reset control ${optionId} to default value: ${defaultValue}`);
                }
            } catch (recoveryError) {
                this.logError('Control recovery attempt failed:', recoveryError);
            }
        }

        /**
         * 📊 Get default value for control type
         */
        getDefaultValue(controlType) {
            const defaults = {
                'color': '#000000',
                'slider': 0,
                'toggle': false,
                'text': '',
                'number': 0
            };
            
            return defaults[controlType] || null;
        }

        /**
         * 📝 Set control value
         */
        setControlValue(element, value, controlType) {
            switch (controlType) {
                case 'toggle':
                    element.checked = Boolean(value);
                    break;
                case 'slider':
                case 'number':
                    element.value = Number(value);
                    break;
                default:
                    element.value = String(value);
            }
        }

        /**
         * 🚨 Handle global errors
         */
        handleGlobalError(error, event) {
            this.logError('Global error in EventManager:', error);
        }

        /**
         * 🚨 Handle promise rejections
         */
        handlePromiseRejection(reason, event) {
            this.logError('Unhandled promise rejection in EventManager:', reason);
        }

        /**
         * 🔔 Show error notification to user
         */
        showErrorNotification(message) {
            // Use toast notification if available
            if (window.Toast) {
                window.Toast.show(message, 'error', 5000);
            } else {
                // Fallback to console
                console.error('WOOW! Error:', message);
            }
        }

        /**
         * 🎯 Trigger custom event
         */
        triggerCustomEvent(eventName, detail) {
            const customEvent = new CustomEvent(eventName, {
                detail: detail,
                bubbles: true,
                cancelable: true
            });
            
            document.dispatchEvent(customEvent);
        }

        /**
         * 📋 Register custom control handler
         */
        registerControlHandler(eventType, elementType, handler) {
            const key = `${eventType}:${elementType.toLowerCase()}`;
            this.controlHandlers.set(key, handler);
            this.log(`Registered custom handler: ${key}`);
        }

        /**
         * 🗑️ Unregister custom control handler
         */
        unregisterControlHandler(eventType, elementType) {
            const key = `${eventType}:${elementType.toLowerCase()}`;
            this.controlHandlers.delete(key);
            this.log(`Unregistered custom handler: ${key}`);
        }

        /**
         * 📊 Get event statistics
         */
        getStats() {
            return {
                customHandlers: this.controlHandlers.size,
                retryAttempts: this.retryAttempts.size,
                saveTimers: this.saveTimers ? this.saveTimers.size : 0,
                isObserving: !!this.dynamicObserver
            };
        }

        /**
         * 🧹 Cleanup resources
         */
        destroy() {
            // Stop observing dynamic elements
            if (this.dynamicObserver) {
                this.dynamicObserver.disconnect();
                this.dynamicObserver = null;
            }
            
            // Clear all timers
            if (this.saveTimers) {
                this.saveTimers.forEach(timer => clearTimeout(timer));
                this.saveTimers.clear();
            }
            
            // Clear maps
            this.eventDelegates.clear();
            this.controlHandlers.clear();
            this.retryAttempts.clear();
            
            this.log('EventManager destroyed');
        }

        /**
         * 📝 Logging utilities
         */
        log(message, type = 'info') {
            if (this.debugMode) {
                const logMethod = type === 'warning' ? 'warn' : type === 'error' ? 'error' : 'log';
                console[logMethod](`🎛️ EventManager: ${message}`);
            }
        }

        logError(message, error = null) {
            console.error(`❌ EventManager: ${message}`, error);
        }
    }

    // Make EventManager globally available
    window.EventManager = EventManager;
    
    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.eventManagerInstance = new EventManager();
        });
    } else {
        window.eventManagerInstance = new EventManager();
    }

})(window, document);