/**
 * AJAX Manager - Unified AJAX Communication System
 * 
 * Handles all AJAX communication between frontend and backend
 * with proper error handling, retry mechanisms, and debugging
 * 
 * @package ModernAdminStyler
 * @version 2.3.0
 */

class AjaxManager {
    constructor() {
        this.endpoints = {
            save: 'mas_v2_save_settings',
            load: 'mas_get_live_settings', 
            reset: 'mas_v2_reset_settings',
            export: 'mas_v2_export_settings',
            import: 'mas_v2_import_settings',
            saveLive: 'mas_save_live_settings',
            resetLive: 'mas_reset_live_setting'
        };
        
        this.retryQueue = new Map();
        this.maxRetries = 3;
        this.retryDelay = 1000; // 1 second
        this.requestTimeout = 30000; // 30 seconds
        
        this.isOnline = navigator.onLine;
        this.setupNetworkListeners();
        
        // Debug mode
        this.debug = window.masV2Debug || false;
        
        this.log('🚀 AjaxManager initialized');
    }
    
    /**
     * 🌐 Setup network status listeners
     */
    setupNetworkListeners() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.log('🌐 Network back online - processing retry queue');
            this.processRetryQueue();
        });
        
        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.log('📴 Network offline detected');
        });
    }
    
    /**
     * 💾 Save live settings (for micro-panel changes)
     */
    async saveLiveSettings(optionId, value) {
        const requestId = `live_${optionId}_${Date.now()}`;
        
        try {
            this.log(`💾 Saving live setting: ${optionId} = ${value}`);
            
            const response = await this.makeRequest(this.endpoints.saveLive, {
                [optionId]: value
            }, requestId);
            
            if (response.success) {
                this.log(`✅ Live setting saved: ${optionId}`);
                return response;
            } else {
                throw new Error(response.data?.message || 'Save failed');
            }
            
        } catch (error) {
            this.logError(`❌ Failed to save live setting ${optionId}:`, error);
            
            // Add to retry queue if network error
            if (this.isNetworkError(error)) {
                this.addToRetryQueue(requestId, 'saveLiveSettings', [optionId, value]);
            }
            
            throw error;
        }
    }
    
    /**
     * 💾 Save all settings (bulk save)
     */
    async saveSettings(settings) {
        const requestId = `save_${Date.now()}`;
        
        try {
            this.log('💾 Saving settings:', settings);
            
            const response = await this.makeRequest(this.endpoints.save, settings, requestId);
            
            if (response.success) {
                this.log('✅ Settings saved successfully');
                return response;
            } else {
                throw new Error(response.data?.message || 'Save failed');
            }
            
        } catch (error) {
            this.logError('❌ Failed to save settings:', error);
            
            if (this.isNetworkError(error)) {
                this.addToRetryQueue(requestId, 'saveSettings', [settings]);
            }
            
            throw error;
        }
    }
    
    /**
     * 📥 Load settings from server
     */
    async loadSettings() {
        try {
            this.log('📥 Loading settings from server');
            
            const response = await this.makeRequest(this.endpoints.load, {}, `load_${Date.now()}`);
            
            if (response.success) {
                this.log('✅ Settings loaded successfully');
                return response.data?.settings || response.settings || {};
            } else {
                throw new Error(response.data?.message || 'Load failed');
            }
            
        } catch (error) {
            this.logError('❌ Failed to load settings:', error);
            throw error;
        }
    }
    
    /**
     * 🔄 Reset settings to defaults
     */
    async resetSettings() {
        try {
            this.log('🔄 Resetting settings to defaults');
            
            const response = await this.makeRequest(this.endpoints.reset, {}, `reset_${Date.now()}`);
            
            if (response.success) {
                this.log('✅ Settings reset successfully');
                return response;
            } else {
                throw new Error(response.data?.message || 'Reset failed');
            }
            
        } catch (error) {
            this.logError('❌ Failed to reset settings:', error);
            throw error;
        }
    }
    
    /**
     * 📤 Export settings
     */
    async exportSettings() {
        try {
            this.log('📤 Exporting settings');
            
            const response = await this.makeRequest(this.endpoints.export, {}, `export_${Date.now()}`);
            
            if (response.success) {
                this.log('✅ Settings exported successfully');
                return response.data;
            } else {
                throw new Error(response.data?.message || 'Export failed');
            }
            
        } catch (error) {
            this.logError('❌ Failed to export settings:', error);
            throw error;
        }
    }
    
    /**
     * 📥 Import settings
     */
    async importSettings(data) {
        try {
            this.log('📥 Importing settings');
            
            const response = await this.makeRequest(this.endpoints.import, {
                data: JSON.stringify(data)
            }, `import_${Date.now()}`);
            
            if (response.success) {
                this.log('✅ Settings imported successfully');
                return response;
            } else {
                throw new Error(response.data?.message || 'Import failed');
            }
            
        } catch (error) {
            this.logError('❌ Failed to import settings:', error);
            throw error;
        }
    }
    
    /**
     * 🌐 Make AJAX request with proper error handling
     */
    async makeRequest(action, data = {}, requestId = null) {
        if (!this.isOnline) {
            throw new Error('Network offline');
        }
        
        const ajaxUrl = window.ajaxurl || window.masLiveEdit?.ajaxUrl || '/wp-admin/admin-ajax.php';
        const nonce = this.getNonce();
        
        if (!nonce) {
            throw new Error('Security nonce not found');
        }
        
        const requestData = {
            action: action,
            nonce: nonce,
            ...data
        };
        
        this.log(`🌐 Making request to ${action}:`, requestData);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.requestTimeout);
        
        try {
            const response = await fetch(ajaxUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams(requestData),
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            
            this.log(`✅ Request ${action} completed:`, result);
            
            // Remove from retry queue if successful
            if (requestId && this.retryQueue.has(requestId)) {
                this.retryQueue.delete(requestId);
            }
            
            return result;
            
        } catch (error) {
            clearTimeout(timeoutId);
            
            if (error.name === 'AbortError') {
                throw new Error('Request timeout');
            }
            
            throw error;
        }
    }
    
    /**
     * 🔄 Add request to retry queue
     */
    addToRetryQueue(requestId, method, args) {
        if (this.retryQueue.has(requestId)) {
            const item = this.retryQueue.get(requestId);
            item.attempts++;
            
            if (item.attempts >= this.maxRetries) {
                this.log(`❌ Max retries reached for ${requestId}`);
                this.retryQueue.delete(requestId);
                return;
            }
        } else {
            this.retryQueue.set(requestId, {
                method: method,
                args: args,
                attempts: 1,
                timestamp: Date.now()
            });
        }
        
        this.log(`🔄 Added to retry queue: ${requestId} (attempt ${this.retryQueue.get(requestId).attempts})`);
    }
    
    /**
     * 🔄 Process retry queue when network comes back
     */
    async processRetryQueue() {
        if (this.retryQueue.size === 0) return;
        
        this.log(`🔄 Processing ${this.retryQueue.size} items in retry queue`);
        
        const promises = [];
        
        for (const [requestId, item] of this.retryQueue.entries()) {
            // Add delay between retries
            const delay = item.attempts * this.retryDelay;
            
            const promise = new Promise(resolve => {
                setTimeout(async () => {
                    try {
                        await this[item.method](...item.args);
                        this.log(`✅ Retry successful: ${requestId}`);
                        resolve(true);
                    } catch (error) {
                        this.logError(`❌ Retry failed: ${requestId}`, error);
                        resolve(false);
                    }
                }, delay);
            });
            
            promises.push(promise);
        }
        
        await Promise.allSettled(promises);
    }
    
    /**
     * 🔍 Check if error is network-related
     */
    isNetworkError(error) {
        const networkErrors = [
            'Failed to fetch',
            'Network request failed',
            'Request timeout',
            'Network offline'
        ];
        
        return networkErrors.some(msg => error.message.includes(msg));
    }
    
    /**
     * 🔐 Get security nonce
     */
    getNonce() {
        return window.masNonce || 
               window.mas_nonce || 
               window.masV2?.nonce || 
               window.masV2?.ajaxNonce ||
               window.masLiveEdit?.nonce ||
               window.woowV2?.nonce ||
               window.woowV2Global?.nonce ||
               '';
    }
    
    /**
     * 📊 Get request statistics
     */
    getStats() {
        return {
            retryQueueSize: this.retryQueue.size,
            isOnline: this.isOnline,
            endpoints: this.endpoints,
            maxRetries: this.maxRetries,
            requestTimeout: this.requestTimeout
        };
    }
    
    /**
     * 🧹 Clear retry queue
     */
    clearRetryQueue() {
        this.retryQueue.clear();
        this.log('🧹 Retry queue cleared');
    }
    
    /**
     * 📝 Debug logging
     */
    log(message, data = null) {
        if (!this.debug) return;
        
        if (data) {
            console.log(`[AjaxManager] ${message}`, data);
        } else {
            console.log(`[AjaxManager] ${message}`);
        }
    }
    
    /**
     * ❌ Error logging
     */
    logError(message, error) {
        console.error(`[AjaxManager] ${message}`, error);
        
        // Send error to backend for logging if possible
        if (this.isOnline && error.message !== 'Network offline') {
            this.sendErrorToBackend(message, error).catch(() => {
                // Silently fail - don't create infinite error loops
            });
        }
    }
    
    /**
     * 📤 Send error to backend for logging
     */
    async sendErrorToBackend(message, error) {
        try {
            const errorData = {
                message: message,
                error: error.message,
                stack: error.stack,
                timestamp: new Date().toISOString(),
                url: window.location.href,
                userAgent: navigator.userAgent
            };
            
            await fetch(window.ajaxurl || '/wp-admin/admin-ajax.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    action: 'mas_log_error',
                    nonce: this.getNonce(),
                    error_data: JSON.stringify(errorData)
                })
            });
            
        } catch (e) {
            // Silently fail
        }
    }
}

// Create global instance
window.MasAjaxManager = new AjaxManager();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AjaxManager;
}