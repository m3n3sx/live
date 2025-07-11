/**
 * UnifiedSettingsManager - Enterprise-Grade Settings Management System
 * 
 * Features:
 * ✅ Map-based caching with cache-first loading
 * ✅ Save queue with debouncing and batch processing
 * ✅ Online/offline detection with retry mechanism
 * ✅ Comprehensive validation and sanitization
 * ✅ Cross-tab synchronization with BroadcastChannel
 * ✅ Immediate UI updates with fallback strategies
 * ✅ localStorage fallback and error recovery
 * ✅ Performance monitoring and metrics
 * 
 * @package ModernAdminStyler
 * @version 3.0.0 - Enterprise Edition
 */

class UnifiedSettingsManager {
    constructor(options = {}) {
        // Core state management
        this.cache = new Map();
        this.saveQueue = new Map();
        this.retryQueue = [];
        this.defaultSettings = new Map();
        
        // Network and connectivity
        this.isOnline = navigator.onLine;
        this.networkStatusChecked = false;
        
        // Configuration
        this.config = {
            debounceDelay: options.debounceDelay || 1000,
            maxRetries: options.maxRetries || 3,
            retryDelay: options.retryDelay || 2000,
            batchSize: options.batchSize || 10,
            cacheExpiry: options.cacheExpiry || 300000, // 5 minutes
            storageKey: options.storageKey || 'mas_unified_settings',
            backupKey: options.backupKey || 'mas_unified_settings_backup',
            enableCrossTabs: options.enableCrossTabs !== false,
            enableMetrics: options.enableMetrics !== false,
            debugMode: options.debugMode || false,
            ...options
        };
        
        // Timers and intervals
        this.saveTimer = null;
        this.retryTimer = null;
        this.syncTimer = null;
        this.cacheCleanupTimer = null;
        
        // Cross-tab synchronization
        this.broadcastChannel = null;
        this.tabId = this.generateTabId();
        this.lastSyncTimestamp = 0;
        
        // Performance metrics
        this.metrics = {
            saveAttempts: 0,
            saveSuccess: 0,
            saveFailures: 0,
            retryAttempts: 0,
            cacheHits: 0,
            cacheMisses: 0,
            averageResponseTime: 0,
            lastSaveTime: 0,
            totalDataTransferred: 0,
            errors: []
        };
        
        // State flags
        this.isInitialized = false;
        this.isSaving = false;
        this.isDestroyed = false;
        
        // Initialize the system
        this.initialize();
    }
    
    /**
     * 🚀 Initialize the UnifiedSettingsManager
     */
    async initialize() {
        try {
            this.debug('Initializing UnifiedSettingsManager...');
            
            // 1. Setup default settings
            await this.setupDefaults();
            
            // 2. Setup event listeners
            this.setupEventListeners();
            
            // 3. Initialize cross-tab sync
            if (this.config.enableCrossTabs) {
                this.initializeCrossTabSync();
            }
            
            // 4. Load initial settings
            await this.loadSettings();
            
            // 5. Start background tasks
            this.startBackgroundTasks();
            
            this.isInitialized = true;
            this.debug('UnifiedSettingsManager initialized successfully');
            
            // Trigger initialization event
            this.dispatchEvent('initialized', { 
                tabId: this.tabId, 
                settingsCount: this.cache.size 
            });
            
        } catch (error) {
            this.error('Failed to initialize UnifiedSettingsManager', error);
            throw error;
        }
    }
    
    /**
     * 🔧 Setup default settings
     */
    async setupDefaults() {
        // Get defaults from existing systems
        const defaults = await this.getDefaultsFromSources();
        
        // Core defaults
        const coreDefaults = {
            enable_plugin: false,
            color_scheme: 'light',
            admin_bar_background: '#23282d',
            admin_bar_text_color: '#eee',
            menu_background: '#23282d',
            menu_text_color: '#eee',
            menu_width: 160,
            animations_enabled: false,
            last_updated: Date.now(),
            version: '3.0.0'
        };
        
        // Merge with any existing defaults
        const mergedDefaults = { ...coreDefaults, ...defaults };
        
        // Store in Map for efficient access
        Object.entries(mergedDefaults).forEach(([key, value]) => {
            this.defaultSettings.set(key, value);
        });
        
        this.debug('Setup defaults completed', { count: this.defaultSettings.size });
    }
    
    /**
     * 🔍 Get defaults from various sources
     */
    async getDefaultsFromSources() {
        const defaults = {};
        
        // Try to get from existing SettingsManager
        if (window.SettingsManager && typeof window.SettingsManager.get === 'function') {
            try {
                const existingSettings = window.SettingsManager.settings || {};
                Object.assign(defaults, existingSettings);
                this.debug('Loaded defaults from existing SettingsManager');
            } catch (error) {
                this.debug('Could not load from existing SettingsManager', error);
            }
        }
        
        // Try to get from global config
        if (window.woowV2Global && window.woowV2Global.settings) {
            Object.assign(defaults, window.woowV2Global.settings);
            this.debug('Loaded defaults from woowV2Global');
        }
        
        // Try to get from localStorage backup
        try {
            const backupData = localStorage.getItem(this.config.backupKey);
            if (backupData) {
                const parsedBackup = JSON.parse(backupData);
                if (parsedBackup.defaults) {
                    Object.assign(defaults, parsedBackup.defaults);
                    this.debug('Loaded defaults from localStorage backup');
                }
            }
        } catch (error) {
            this.debug('Could not load defaults from localStorage backup', error);
        }
        
        return defaults;
    }
    
    /**
     * 🎧 Setup event listeners
     */
    setupEventListeners() {
        // Network status monitoring
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.debug('Network online - processing retry queue');
            this.processRetryQueue();
        });
        
        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.debug('Network offline - queuing saves');
        });
        
        // Page lifecycle events
        window.addEventListener('beforeunload', () => {
            this.handleBeforeUnload();
        });
        
        // Visibility change (tab switching)
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.handleTabVisible();
            }
        });
        
        // Storage events (for cross-tab sync fallback)
        window.addEventListener('storage', (event) => {
            if (event.key === this.config.storageKey) {
                this.handleStorageSync(event);
            }
        });
        
        this.debug('Event listeners setup completed');
    }
    
    /**
     * 🔄 Initialize cross-tab synchronization
     */
    initializeCrossTabSync() {
        if (!window.BroadcastChannel) {
            this.debug('BroadcastChannel not supported - using localStorage fallback');
            return;
        }
        
        try {
            this.broadcastChannel = new BroadcastChannel('mas_settings_sync');
            
            this.broadcastChannel.onmessage = (event) => {
                this.handleCrossTabMessage(event.data);
            };
            
            this.debug('Cross-tab synchronization initialized');
        } catch (error) {
            this.debug('Failed to initialize cross-tab sync', error);
        }
    }
    
    /**
     * ⚡ Start background tasks
     */
    startBackgroundTasks() {
        // Cache cleanup every 5 minutes
        this.cacheCleanupTimer = setInterval(() => {
            this.cleanupExpiredCache();
        }, 300000);
        
        // Network status check every 30 seconds
        setInterval(() => {
            this.checkNetworkStatus();
        }, 30000);
        
        // Metrics collection every minute
        if (this.config.enableMetrics) {
            setInterval(() => {
                this.collectMetrics();
            }, 60000);
        }
        
        this.debug('Background tasks started');
    }
    
    /**
     * 🔧 Generate unique tab ID
     */
    generateTabId() {
        return 'tab_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    }
    
    /**
     * 🐛 Debug logging
     */
    debug(message, data = null) {
        if (this.config.debugMode) {
            console.log(`[UnifiedSettingsManager] ${message}`, data || '');
        }
    }
    
    /**
     * ❌ Error logging
     */
    error(message, error = null) {
        console.error(`[UnifiedSettingsManager] ${message}`, error || '');
        
        // Store error for metrics
        this.metrics.errors.push({
            message,
            error: error?.message || error,
            timestamp: Date.now()
        });
        
        // Keep only last 50 errors
        if (this.metrics.errors.length > 50) {
            this.metrics.errors = this.metrics.errors.slice(-50);
        }
    }
    
    /**
     * 📡 Dispatch custom event
     */
    dispatchEvent(eventName, data = {}) {
        const event = new CustomEvent(`unified-settings-${eventName}`, {
            detail: { ...data, tabId: this.tabId }
        });
        window.dispatchEvent(event);
    }

    // ========================================================================
    // CORE SETTINGS OPERATIONS
    // ========================================================================

    /**
     * 💾 Save settings with enterprise-grade reliability
     */
    async saveSettings(data, options = {}) {
        if (!this.isInitialized) {
            throw new Error('UnifiedSettingsManager not initialized');
        }

        const startTime = Date.now();
        this.metrics.saveAttempts++;

        try {
            // 1. Validation and sanitization
            const sanitized = this.sanitizeSettings(data);
            this.debug('Settings sanitized', { original: Object.keys(data), sanitized: Object.keys(sanitized) });

            // 2. Immediate UI update
            this.applyToUI(sanitized);

            // 3. Update cache
            this.updateCache(sanitized);

            // 4. Save to localStorage immediately
            this.saveToLocalStorage(sanitized);

            // 5. Queue for database save (debounced)
            this.queueForDatabase(sanitized, options);

            // 6. Cross-tab synchronization
            if (this.config.enableCrossTabs) {
                this.broadcast(sanitized);
            }

            // 7. Dispatch events
            this.dispatchEvent('settings-saved', { 
                settings: sanitized, 
                immediate: true,
                options 
            });

            this.metrics.saveSuccess++;
            this.metrics.lastSaveTime = Date.now() - startTime;

            this.debug('Settings saved successfully', { 
                keys: Object.keys(sanitized), 
                time: this.metrics.lastSaveTime 
            });

            return { success: true, data: sanitized };

        } catch (error) {
            this.metrics.saveFailures++;
            this.error('Failed to save settings', error);
            throw error;
        }
    }

    /**
     * 📥 Load settings with cache-first strategy
     */
    async loadSettings(useCache = true) {
        if (!this.isInitialized) {
            await this.initialize();
        }

        try {
            // 1. Try cache first (if enabled)
            if (useCache && this.cache.size > 0) {
                this.metrics.cacheHits++;
                this.debug('Loading settings from cache', { count: this.cache.size });
                return Object.fromEntries(this.cache);
            }

            this.metrics.cacheMisses++;

            // 2. Try to load from database
            try {
                const response = await this.fetchFromDatabase();
                if (response && response.data) {
                    this.updateCache(response.data);
                    this.debug('Settings loaded from database', response.data);
                    return response.data;
                }
            } catch (error) {
                this.debug('Failed to load from database', error);
            }

            // 3. Fallback to localStorage
            const localData = this.loadFromLocalStorage();
            if (localData && Object.keys(localData).length > 0) {
                this.updateCache(localData);
                this.debug('Settings loaded from localStorage', localData);
                return localData;
            }

            // 4. Final fallback to defaults
            this.debug('Loading default settings');
            const defaults = Object.fromEntries(this.defaultSettings);
            this.updateCache(defaults);
            return defaults;

        } catch (error) {
            this.error('Failed to load settings', error);
            // Return defaults on error
            return Object.fromEntries(this.defaultSettings);
        }
    }

    /**
     * 🔄 Reset settings to defaults
     */
    async resetToDefaults(keys = []) {
        if (!this.isInitialized) {
            throw new Error('UnifiedSettingsManager not initialized');
        }

        try {
            const defaults = Object.fromEntries(this.defaultSettings);
            
            // If specific keys provided, only reset those
            if (keys.length > 0) {
                const toReset = {};
                keys.forEach(key => {
                    if (defaults.hasOwnProperty(key)) {
                        toReset[key] = defaults[key];
                    }
                });
                
                this.debug('Resetting specific settings to defaults', { keys });
                await this.saveSettings(toReset);
                return toReset;
            }

            // Reset all settings
            this.debug('Resetting all settings to defaults');
            await this.saveSettings(defaults);
            return defaults;

        } catch (error) {
            this.error('Failed to reset settings to defaults', error);
            throw error;
        }
    }

    /**
     * 🧹 Sanitize settings data
     */
    sanitizeSettings(data) {
        const sanitized = {};
        
        for (const [key, value] of Object.entries(data)) {
            try {
                // Get the default value for type checking
                const defaultValue = this.defaultSettings.get(key);
                
                // Sanitize based on type
                if (typeof defaultValue === 'boolean') {
                    sanitized[key] = this.sanitizeBoolean(value);
                } else if (typeof defaultValue === 'number') {
                    sanitized[key] = this.sanitizeNumber(value, defaultValue);
                } else if (typeof defaultValue === 'string') {
                    sanitized[key] = this.sanitizeString(value, key);
                } else if (Array.isArray(defaultValue)) {
                    sanitized[key] = this.sanitizeArray(value, defaultValue);
                } else if (typeof defaultValue === 'object' && defaultValue !== null) {
                    sanitized[key] = this.sanitizeObject(value, defaultValue);
                } else {
                    // Unknown type - sanitize as string
                    sanitized[key] = this.sanitizeString(value, key);
                }
            } catch (error) {
                this.debug(`Failed to sanitize ${key}`, error);
                // Use default value on sanitization error
                sanitized[key] = this.defaultSettings.get(key);
            }
        }
        
        return sanitized;
    }

    /**
     * 🔧 Sanitize boolean values
     */
    sanitizeBoolean(value) {
        if (typeof value === 'boolean') return value;
        if (typeof value === 'string') {
            return value.toLowerCase() === 'true' || value === '1';
        }
        return Boolean(value);
    }

    /**
     * 🔧 Sanitize number values
     */
    sanitizeNumber(value, defaultValue) {
        const parsed = parseFloat(value);
        if (isNaN(parsed)) return defaultValue;
        
        // Additional validation for specific fields
        if (typeof value === 'number' && value < 0) {
            return Math.abs(value); // Ensure positive numbers
        }
        
        return parsed;
    }

    /**
     * 🔧 Sanitize string values
     */
    sanitizeString(value, key) {
        if (typeof value !== 'string') {
            value = String(value);
        }
        
        // Trim whitespace
        value = value.trim();
        
        // Special handling for specific fields
        if (key.includes('color') || key.includes('Color')) {
            // Validate hex colors
            if (!/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(value)) {
                return this.defaultSettings.get(key) || '#000000';
            }
        }
        
        if (key.includes('css') || key.includes('Css')) {
            // Basic CSS sanitization
            value = value.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
            value = value.replace(/javascript:/gi, '');
        }
        
        return value;
    }

    /**
     * 🔧 Sanitize array values
     */
    sanitizeArray(value, defaultValue) {
        if (!Array.isArray(value)) {
            return defaultValue;
        }
        
        return value.map(item => {
            if (typeof item === 'string') {
                return this.sanitizeString(item, 'array_item');
            }
            return item;
        });
    }

    /**
     * 🔧 Sanitize object values
     */
    sanitizeObject(value, defaultValue) {
        if (typeof value !== 'object' || value === null) {
            return defaultValue;
        }
        
        const sanitized = {};
        for (const [key, val] of Object.entries(value)) {
            if (typeof val === 'string') {
                sanitized[key] = this.sanitizeString(val, key);
            } else if (typeof val === 'number') {
                sanitized[key] = this.sanitizeNumber(val, 0);
            } else if (typeof val === 'boolean') {
                sanitized[key] = this.sanitizeBoolean(val);
            } else {
                sanitized[key] = val;
            }
        }
        
        return sanitized;
    }

    /**
     * 🎨 Apply settings to UI immediately
     */
    applyToUI(settings) {
        try {
            // Update CSS custom properties
            this.updateCSSProperties(settings);
            
            // Update existing UI elements
            this.updateUIElements(settings);
            
            // Notify other systems
            this.dispatchEvent('ui-updated', { settings });
            
        } catch (error) {
            this.error('Failed to apply settings to UI', error);
        }
    }

    /**
     * 🎨 Update CSS custom properties
     */
    updateCSSProperties(settings) {
        const root = document.documentElement;
        
        // Map settings to CSS custom properties
        const cssPropertyMap = {
            'admin_bar_background': '--mas-admin-bar-bg',
            'admin_bar_text_color': '--mas-admin-bar-text',
            'menu_background': '--mas-menu-bg',
            'menu_text_color': '--mas-menu-text',
            'menu_width': '--mas-menu-width',
            'accent_color': '--mas-accent-color'
        };
        
        for (const [setting, cssVar] of Object.entries(cssPropertyMap)) {
            if (settings.hasOwnProperty(setting)) {
                const value = settings[setting];
                if (setting.includes('width') && typeof value === 'number') {
                    root.style.setProperty(cssVar, value + 'px');
                } else {
                    root.style.setProperty(cssVar, value);
                }
            }
        }
    }

    /**
     * 🎨 Update UI elements
     */
    updateUIElements(settings) {
        // Update existing SettingsManager if it exists
        if (window.SettingsManager && typeof window.SettingsManager.set === 'function') {
            Object.entries(settings).forEach(([key, value]) => {
                window.SettingsManager.set(key, value);
            });
        }
        
        // Update form elements
        Object.entries(settings).forEach(([key, value]) => {
            const element = document.querySelector(`[name="${key}"], [data-setting="${key}"]`);
            if (element) {
                if (element.type === 'checkbox') {
                    element.checked = Boolean(value);
                } else {
                    element.value = value;
                }
            }
        });
    }

    /**
     * 🗄️ Update cache with new settings
     */
    updateCache(settings) {
        const timestamp = Date.now();
        
        Object.entries(settings).forEach(([key, value]) => {
            this.cache.set(key, {
                value,
                timestamp,
                expires: timestamp + this.config.cacheExpiry
            });
        });
        
        this.debug('Cache updated', { 
            keys: Object.keys(settings), 
            totalCacheSize: this.cache.size 
        });
    }

    /**
     * 💾 Save to localStorage
     */
    saveToLocalStorage(settings) {
        try {
            const data = {
                settings,
                timestamp: Date.now(),
                version: this.config.version || '3.0.0',
                tabId: this.tabId
            };
            
            localStorage.setItem(this.config.storageKey, JSON.stringify(data));
            
            // Create backup
            localStorage.setItem(this.config.backupKey, JSON.stringify({
                ...data,
                backup: true
            }));
            
            this.debug('Settings saved to localStorage');
            
        } catch (error) {
            this.error('Failed to save to localStorage', error);
        }
    }

    /**
     * 📥 Load from localStorage
     */
    loadFromLocalStorage() {
        try {
            const data = localStorage.getItem(this.config.storageKey);
            if (data) {
                const parsed = JSON.parse(data);
                
                // Check if data is not too old (24 hours)
                if (Date.now() - parsed.timestamp < 86400000) {
                    return parsed.settings;
                }
            }
            
            return null;
            
        } catch (error) {
            this.error('Failed to load from localStorage', error);
            return null;
        }
    }

    // ========================================================================
    // DATABASE OPERATIONS & QUEUING SYSTEM
    // ========================================================================

    /**
     * 📤 Queue settings for database save with debouncing
     */
    queueForDatabase(settings, options = {}) {
        // Clear existing timer
        if (this.saveTimer) {
            clearTimeout(this.saveTimer);
        }

        // Add to save queue
        const queueKey = Date.now();
        this.saveQueue.set(queueKey, {
            settings,
            options,
            timestamp: Date.now(),
            attempts: 0
        });

        // Debounced save
        this.saveTimer = setTimeout(() => {
            this.processSaveQueue();
        }, this.config.debounceDelay);

        this.debug('Settings queued for database save', { 
            queueKey, 
            queueSize: this.saveQueue.size 
        });
    }

    /**
     * 📋 Process save queue (batch processing)
     */
    async processSaveQueue() {
        if (this.isSaving || this.saveQueue.size === 0) {
            return;
        }

        this.isSaving = true;
        this.debug('Processing save queue', { queueSize: this.saveQueue.size });

        try {
            // Get all queued settings
            const queueEntries = Array.from(this.saveQueue.entries());
            
            // Merge all settings into one batch
            const batchSettings = {};
            const batchOptions = {};
            
            queueEntries.forEach(([key, data]) => {
                Object.assign(batchSettings, data.settings);
                Object.assign(batchOptions, data.options);
            });

            // Try to save to database
            if (this.isOnline) {
                await this.saveToDatabase(batchSettings, batchOptions);
                
                // Clear queue on success
                this.saveQueue.clear();
                this.debug('Save queue processed successfully');
                
            } else {
                // Add to retry queue if offline
                this.addToRetryQueue(batchSettings, batchOptions);
                this.debug('Offline - added to retry queue');
            }

        } catch (error) {
            this.error('Failed to process save queue', error);
            
            // Add failed saves to retry queue
            const queueEntries = Array.from(this.saveQueue.entries());
            queueEntries.forEach(([key, data]) => {
                this.addToRetryQueue(data.settings, data.options);
            });
            
        } finally {
            this.isSaving = false;
        }
    }

    /**
     * 💾 Save to database
     */
    async saveToDatabase(settings, options = {}) {
        const startTime = Date.now();
        
        try {
            // Get API endpoint information
            const apiData = this.getApiEndpoints();
            
            // Prepare request data
            const requestData = {
                settings,
                options,
                timestamp: Date.now(),
                tabId: this.tabId,
                version: this.config.version || '3.0.0'
            };

            // Make API request
            const response = await fetch(apiData.saveUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-WP-Nonce': apiData.nonce,
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify(requestData)
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            
            // Update metrics
            this.metrics.averageResponseTime = (this.metrics.averageResponseTime + (Date.now() - startTime)) / 2;
            this.metrics.totalDataTransferred += new Blob([JSON.stringify(requestData)]).size;
            
            this.debug('Settings saved to database', { 
                response: result, 
                responseTime: Date.now() - startTime 
            });

            // Dispatch success event
            this.dispatchEvent('database-saved', { 
                settings, 
                response: result, 
                responseTime: Date.now() - startTime 
            });

            return result;

        } catch (error) {
            this.error('Failed to save to database', error);
            throw error;
        }
    }

    /**
     * 📥 Fetch from database
     */
    async fetchFromDatabase() {
        const startTime = Date.now();
        
        try {
            // Get API endpoint information
            const apiData = this.getApiEndpoints();
            
            // Make API request
            const response = await fetch(apiData.loadUrl, {
                method: 'GET',
                headers: {
                    'X-WP-Nonce': apiData.nonce,
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            
            // Update metrics
            this.metrics.averageResponseTime = (this.metrics.averageResponseTime + (Date.now() - startTime)) / 2;
            
            this.debug('Settings loaded from database', { 
                response: result, 
                responseTime: Date.now() - startTime 
            });

            return result;

        } catch (error) {
            this.error('Failed to load from database', error);
            throw error;
        }
    }

    /**
     * 🔗 Get API endpoints
     */
    getApiEndpoints() {
        // Try different sources for API information
        const sources = [
            window.woowV2Global,
            window.woowV2,
            window.masV2Global,
            window.masV2
        ];

        let apiData = null;
        
        for (const source of sources) {
            if (source && source.restUrl && source.restNonce) {
                apiData = {
                    saveUrl: source.restUrl + 'settings',
                    loadUrl: source.restUrl + 'settings',
                    nonce: source.restNonce
                };
                break;
            }
        }

        // Fallback to WordPress AJAX
        if (!apiData) {
            apiData = {
                saveUrl: '/wp-admin/admin-ajax.php',
                loadUrl: '/wp-admin/admin-ajax.php',
                nonce: window.masV2?.ajaxNonce || ''
            };
        }

        return apiData;
    }

    // ========================================================================
    // RETRY MECHANISM
    // ========================================================================

    /**
     * 🔄 Add to retry queue
     */
    addToRetryQueue(settings, options = {}) {
        const retryItem = {
            settings,
            options,
            timestamp: Date.now(),
            attempts: 0,
            nextRetry: Date.now() + this.config.retryDelay
        };

        this.retryQueue.push(retryItem);
        this.debug('Added to retry queue', { 
            queueSize: this.retryQueue.length 
        });

        // Start retry timer if not already running
        if (!this.retryTimer) {
            this.startRetryTimer();
        }
    }

    /**
     * ⏰ Start retry timer
     */
    startRetryTimer() {
        this.retryTimer = setInterval(() => {
            this.processRetryQueue();
        }, this.config.retryDelay);
    }

    /**
     * 🔄 Process retry queue
     */
    async processRetryQueue() {
        if (!this.isOnline || this.retryQueue.length === 0) {
            return;
        }

        this.debug('Processing retry queue', { queueSize: this.retryQueue.length });

        const now = Date.now();
        const itemsToRetry = this.retryQueue.filter(item => now >= item.nextRetry);

        for (const item of itemsToRetry) {
            try {
                this.metrics.retryAttempts++;
                item.attempts++;

                // Try to save to database
                await this.saveToDatabase(item.settings, item.options);

                // Remove from retry queue on success
                this.retryQueue = this.retryQueue.filter(i => i !== item);
                this.debug('Retry successful', { attempts: item.attempts });

            } catch (error) {
                this.error('Retry failed', error);

                // Check if max retries reached
                if (item.attempts >= this.config.maxRetries) {
                    this.retryQueue = this.retryQueue.filter(i => i !== item);
                    this.error('Max retries reached - giving up', { 
                        attempts: item.attempts, 
                        settings: Object.keys(item.settings) 
                    });
                    
                    // Dispatch failure event
                    this.dispatchEvent('retry-failed', { 
                        settings: item.settings, 
                        attempts: item.attempts 
                    });
                } else {
                    // Schedule next retry with exponential backoff
                    item.nextRetry = now + (this.config.retryDelay * Math.pow(2, item.attempts));
                }
            }
        }

        // Stop retry timer if queue is empty
        if (this.retryQueue.length === 0) {
            clearInterval(this.retryTimer);
            this.retryTimer = null;
        }
    }

    // ========================================================================
    // CROSS-TAB SYNCHRONIZATION
    // ========================================================================

    /**
     * 📡 Broadcast settings to other tabs
     */
    broadcast(settings) {
        const message = {
            type: 'settings-update',
            settings,
            timestamp: Date.now(),
            tabId: this.tabId
        };

        // Use BroadcastChannel if available
        if (this.broadcastChannel) {
            try {
                this.broadcastChannel.postMessage(message);
                this.debug('Settings broadcast via BroadcastChannel');
            } catch (error) {
                this.debug('BroadcastChannel failed, using localStorage fallback', error);
                this.broadcastViaLocalStorage(message);
            }
        } else {
            // Fallback to localStorage
            this.broadcastViaLocalStorage(message);
        }
    }

    /**
     * 📡 Broadcast via localStorage (fallback)
     */
    broadcastViaLocalStorage(message) {
        try {
            const key = 'mas_settings_broadcast';
            localStorage.setItem(key, JSON.stringify(message));
            
            // Clean up immediately
            setTimeout(() => {
                localStorage.removeItem(key);
            }, 1000);
            
            this.debug('Settings broadcast via localStorage');
        } catch (error) {
            this.error('Failed to broadcast via localStorage', error);
        }
    }

    /**
     * 📨 Handle cross-tab message
     */
    handleCrossTabMessage(message) {
        if (message.tabId === this.tabId) {
            return; // Ignore messages from same tab
        }

        if (message.type === 'settings-update') {
            this.debug('Received settings update from another tab', message);
            
            // Update local cache
            this.updateCache(message.settings);
            
            // Apply to UI
            this.applyToUI(message.settings);
            
            // Dispatch event
            this.dispatchEvent('cross-tab-sync', { 
                settings: message.settings, 
                sourceTabId: message.tabId 
            });
        }
    }

    /**
     * 🔄 Handle storage sync (fallback)
     */
    handleStorageSync(event) {
        if (event.key === 'mas_settings_broadcast') {
            try {
                const message = JSON.parse(event.newValue);
                this.handleCrossTabMessage(message);
            } catch (error) {
                this.debug('Failed to parse storage sync message', error);
            }
        }
    }

    // ========================================================================
    // BACKGROUND TASKS & MAINTENANCE
    // ========================================================================

    /**
     * 🧹 Clean up expired cache entries
     */
    cleanupExpiredCache() {
        const now = Date.now();
        const expiredKeys = [];

        for (const [key, data] of this.cache.entries()) {
            if (data.expires && now > data.expires) {
                expiredKeys.push(key);
            }
        }

        expiredKeys.forEach(key => {
            this.cache.delete(key);
        });

        if (expiredKeys.length > 0) {
            this.debug('Cleaned up expired cache entries', { 
                expired: expiredKeys.length, 
                remaining: this.cache.size 
            });
        }
    }

    /**
     * 🌐 Check network status
     */
    async checkNetworkStatus() {
        const wasOnline = this.isOnline;
        
        try {
            // Simple network check
            const response = await fetch('/wp-admin/admin-ajax.php?action=heartbeat', {
                method: 'HEAD',
                cache: 'no-cache'
            });
            
            this.isOnline = response.ok;
            
        } catch (error) {
            this.isOnline = false;
        }

        // If came back online, process retry queue
        if (!wasOnline && this.isOnline) {
            this.debug('Network status changed: back online');
            this.processRetryQueue();
        } else if (wasOnline && !this.isOnline) {
            this.debug('Network status changed: gone offline');
        }

        this.networkStatusChecked = true;
    }

    /**
     * 📊 Collect performance metrics
     */
    collectMetrics() {
        const metrics = {
            ...this.metrics,
            cacheSize: this.cache.size,
            saveQueueSize: this.saveQueue.size,
            retryQueueSize: this.retryQueue.length,
            isOnline: this.isOnline,
            memoryUsage: this.getMemoryUsage()
        };

        this.debug('Performance metrics collected', metrics);
        
        // Dispatch metrics event
        this.dispatchEvent('metrics-collected', { metrics });
        
        return metrics;
    }

    /**
     * 🧠 Get memory usage estimate
     */
    getMemoryUsage() {
        if (window.performance && window.performance.memory) {
            return {
                used: window.performance.memory.usedJSHeapSize,
                total: window.performance.memory.totalJSHeapSize,
                limit: window.performance.memory.jsHeapSizeLimit
            };
        }
        return null;
    }

    // ========================================================================
    // EVENT HANDLERS
    // ========================================================================

    /**
     * 🚪 Handle before unload
     */
    handleBeforeUnload() {
        // Force save any pending changes
        if (this.saveQueue.size > 0) {
            this.processSaveQueue();
        }
        
        // Clean up resources
        this.cleanup();
    }

    /**
     * 👁️ Handle tab visible
     */
    handleTabVisible() {
        // Check for updates from other tabs
        if (this.lastSyncTimestamp > 0) {
            const timeSinceSync = Date.now() - this.lastSyncTimestamp;
            if (timeSinceSync > 30000) { // 30 seconds
                this.syncWithOtherTabs();
            }
        }
    }

    /**
     * 🔄 Sync with other tabs
     */
    async syncWithOtherTabs() {
        try {
            // Load fresh settings from database
            const freshSettings = await this.fetchFromDatabase();
            
            if (freshSettings && freshSettings.data) {
                // Update cache and UI
                this.updateCache(freshSettings.data);
                this.applyToUI(freshSettings.data);
                
                this.lastSyncTimestamp = Date.now();
                this.debug('Synced with other tabs');
            }
        } catch (error) {
            this.debug('Failed to sync with other tabs', error);
        }
    }

    /**
     * 🧹 Cleanup resources
     */
    cleanup() {
        // Clear timers
        if (this.saveTimer) {
            clearTimeout(this.saveTimer);
            this.saveTimer = null;
        }
        
        if (this.retryTimer) {
            clearInterval(this.retryTimer);
            this.retryTimer = null;
        }
        
        if (this.cacheCleanupTimer) {
            clearInterval(this.cacheCleanupTimer);
            this.cacheCleanupTimer = null;
        }
        
        // Close broadcast channel
        if (this.broadcastChannel) {
            this.broadcastChannel.close();
            this.broadcastChannel = null;
        }
        
        // Clear queues
        this.saveQueue.clear();
        this.retryQueue.length = 0;
        
        this.isDestroyed = true;
        this.debug('Resources cleaned up');
    }

    // ========================================================================
    // PUBLIC API METHODS
    // ========================================================================

    /**
     * 🔧 Get setting value
     */
    get(key, defaultValue = null) {
        if (!this.isInitialized) {
            return defaultValue;
        }

        const cached = this.cache.get(key);
        if (cached) {
            this.metrics.cacheHits++;
            return cached.value;
        }

        this.metrics.cacheMisses++;
        const defaultFromDefaults = this.defaultSettings.get(key);
        return defaultFromDefaults !== undefined ? defaultFromDefaults : defaultValue;
    }

    /**
     * 🔧 Set setting value
     */
    async set(key, value, options = {}) {
        if (!this.isInitialized) {
            throw new Error('UnifiedSettingsManager not initialized');
        }

        const settings = { [key]: value };
        return await this.saveSettings(settings, options);
    }

    /**
     * 🔧 Check if setting exists
     */
    has(key) {
        return this.cache.has(key) || this.defaultSettings.has(key);
    }

    /**
     * 🔧 Get multiple settings
     */
    getMultiple(keys) {
        const result = {};
        keys.forEach(key => {
            result[key] = this.get(key);
        });
        return result;
    }

    /**
     * 🔧 Set multiple settings
     */
    async setMultiple(settings, options = {}) {
        return await this.saveSettings(settings, options);
    }

    /**
     * 🔧 Delete setting
     */
    async delete(key, options = {}) {
        if (!this.isInitialized) {
            throw new Error('UnifiedSettingsManager not initialized');
        }

        this.cache.delete(key);
        const settings = { [key]: undefined };
        return await this.saveSettings(settings, options);
    }

    /**
     * 🔧 Clear all settings
     */
    async clear(options = {}) {
        if (!this.isInitialized) {
            throw new Error('UnifiedSettingsManager not initialized');
        }

        this.cache.clear();
        const defaults = Object.fromEntries(this.defaultSettings);
        return await this.saveSettings(defaults, options);
    }

    /**
     * 📊 Get all settings
     */
    getAll() {
        const result = {};
        
        // Start with defaults
        for (const [key, value] of this.defaultSettings) {
            result[key] = value;
        }
        
        // Override with cached values
        for (const [key, data] of this.cache) {
            result[key] = data.value;
        }
        
        return result;
    }

    /**
     * 📊 Get performance metrics
     */
    getMetrics() {
        return { ...this.metrics };
    }

    /**
     * 🔧 Get configuration
     */
    getConfig() {
        return { ...this.config };
    }

    /**
     * 🔧 Update configuration
     */
    updateConfig(newConfig) {
        Object.assign(this.config, newConfig);
        this.debug('Configuration updated', newConfig);
    }

    /**
     * 🔍 Search settings
     */
    search(query) {
        const results = [];
        const lowerQuery = query.toLowerCase();
        
        for (const [key, data] of this.cache) {
            if (key.toLowerCase().includes(lowerQuery)) {
                results.push({
                    key,
                    value: data.value,
                    isDefault: false
                });
            }
        }
        
        for (const [key, value] of this.defaultSettings) {
            if (key.toLowerCase().includes(lowerQuery) && !this.cache.has(key)) {
                results.push({
                    key,
                    value,
                    isDefault: true
                });
            }
        }
        
        return results;
    }

    /**
     * 📤 Export settings
     */
    export(format = 'json') {
        const settings = this.getAll();
        const exportData = {
            settings,
            metadata: {
                timestamp: Date.now(),
                version: this.config.version || '3.0.0',
                tabId: this.tabId,
                userAgent: navigator.userAgent
            }
        };

        switch (format) {
            case 'json':
                return JSON.stringify(exportData, null, 2);
            case 'object':
                return exportData;
            default:
                throw new Error(`Unsupported export format: ${format}`);
        }
    }

    /**
     * 📥 Import settings
     */
    async import(data, options = {}) {
        try {
            let importData;
            
            if (typeof data === 'string') {
                importData = JSON.parse(data);
            } else {
                importData = data;
            }

            const settings = importData.settings || importData;
            
            // Validate settings before import
            const validatedSettings = this.sanitizeSettings(settings);
            
            // Import settings
            await this.saveSettings(validatedSettings, {
                ...options,
                skipValidation: true // Already validated
            });

            this.debug('Settings imported successfully', { 
                count: Object.keys(validatedSettings).length 
            });

            return { success: true, imported: Object.keys(validatedSettings) };

        } catch (error) {
            this.error('Failed to import settings', error);
            throw error;
        }
    }

    /**
     * 🔄 Refresh settings from database
     */
    async refresh() {
        try {
            const freshSettings = await this.fetchFromDatabase();
            
            if (freshSettings && freshSettings.data) {
                this.updateCache(freshSettings.data);
                this.applyToUI(freshSettings.data);
                this.debug('Settings refreshed from database');
                return freshSettings.data;
            }
            
            return null;
        } catch (error) {
            this.error('Failed to refresh settings', error);
            throw error;
        }
    }

    /**
     * 🎯 Force save (bypass debouncing)
     */
    async forceSave() {
        if (this.saveQueue.size > 0) {
            await this.processSaveQueue();
        }
    }

    /**
     * 🧪 Test connection
     */
    async testConnection() {
        try {
            const response = await this.checkNetworkStatus();
            return {
                online: this.isOnline,
                timestamp: Date.now(),
                response
            };
        } catch (error) {
            return {
                online: false,
                error: error.message,
                timestamp: Date.now()
            };
        }
    }

    // ========================================================================
    // UTILITY METHODS
    // ========================================================================

    /**
     * 🔧 Validate setting key
     */
    validateKey(key) {
        if (typeof key !== 'string') {
            throw new Error('Setting key must be a string');
        }
        
        if (key.length === 0) {
            throw new Error('Setting key cannot be empty');
        }
        
        if (key.includes(' ')) {
            throw new Error('Setting key cannot contain spaces');
        }
        
        return true;
    }

    /**
     * 🔧 Validate setting value
     */
    validateValue(value) {
        // Check for dangerous values
        if (typeof value === 'string') {
            if (value.includes('<script>')) {
                throw new Error('Setting value cannot contain script tags');
            }
        }
        
        return true;
    }

    /**
     * 🔧 Deep clone object
     */
    deepClone(obj) {
        if (obj === null || typeof obj !== 'object') {
            return obj;
        }
        
        if (obj instanceof Date) {
            return new Date(obj.getTime());
        }
        
        if (Array.isArray(obj)) {
            return obj.map(item => this.deepClone(item));
        }
        
        const cloned = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                cloned[key] = this.deepClone(obj[key]);
            }
        }
        
        return cloned;
    }

    /**
     * 🔧 Throttle function
     */
    throttle(func, limit) {
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
     * 🔧 Debounce function
     */
    debounce(func, wait, immediate) {
        let timeout;
        return function() {
            const context = this;
            const args = arguments;
            const later = function() {
                timeout = null;
                if (!immediate) func.apply(context, args);
            };
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func.apply(context, args);
        };
    }

    /**
     * 🎯 Get status summary
     */
    getStatus() {
        return {
            initialized: this.isInitialized,
            online: this.isOnline,
            saving: this.isSaving,
            cacheSize: this.cache.size,
            saveQueueSize: this.saveQueue.size,
            retryQueueSize: this.retryQueue.length,
            metrics: this.getMetrics(),
            tabId: this.tabId,
            lastSyncTimestamp: this.lastSyncTimestamp
        };
    }

    /**
     * 🔧 Convert to legacy format (for compatibility)
     */
    toLegacyFormat() {
        const settings = this.getAll();
        return {
            settings,
            get: (key, defaultValue) => this.get(key, defaultValue),
            set: (key, value) => this.set(key, value),
            has: (key) => this.has(key),
            save: () => this.forceSave(),
            isInitialized: this.isInitialized
        };
    }
}

// ========================================================================
// INTEGRATION & INITIALIZATION
// ========================================================================

/**
 * 🔗 Initialize UnifiedSettingsManager and integrate with existing systems
 */
async function initializeUnifiedSettingsManager(options = {}) {
    // Default configuration
    const defaultConfig = {
        debugMode: window.location.search.includes('debug=true'),
        enableCrossTabs: true,
        enableMetrics: true,
        debounceDelay: 1000,
        maxRetries: 3,
        retryDelay: 2000
    };

    // Create UnifiedSettingsManager instance
    const manager = new UnifiedSettingsManager({ ...defaultConfig, ...options });
    
    // Wait for initialization
    await manager.initialize();
    
    // Integrate with existing systems
    await integrateWithExistingSystems(manager);
    
    // Setup global access
    window.UnifiedSettingsManager = manager;
    window.USM = manager; // Short alias
    
    // Dispatch global event
    window.dispatchEvent(new CustomEvent('unified-settings-manager-ready', {
        detail: { manager }
    }));
    
    console.log('✅ UnifiedSettingsManager initialized and integrated');
    
    return manager;
}

/**
 * 🔗 Integrate with existing systems
 */
async function integrateWithExistingSystems(manager) {
    // Migrate from existing SettingsManager
    if (window.SettingsManager && window.SettingsManager.settings) {
        try {
            const existingSettings = window.SettingsManager.settings;
            await manager.import(existingSettings, { skipValidation: false });
            console.log('✅ Migrated settings from existing SettingsManager');
        } catch (error) {
            console.warn('⚠️ Failed to migrate from existing SettingsManager', error);
        }
    }
    
    // Create compatibility layer
    const compatibilityLayer = manager.toLegacyFormat();
    
    // Replace existing SettingsManager
    if (window.SettingsManager) {
        // Backup existing SettingsManager
        window.SettingsManager_Legacy = window.SettingsManager;
        
        // Replace with compatibility layer
        window.SettingsManager = compatibilityLayer;
        
        console.log('✅ Replaced existing SettingsManager with compatibility layer');
    }
    
    // Setup event forwarding
    manager.dispatchEvent = (eventName, data) => {
        // Dispatch both new and legacy events
        const newEvent = new CustomEvent(`unified-settings-${eventName}`, {
            detail: { ...data, manager }
        });
        
        const legacyEvent = new CustomEvent(`settings-${eventName}`, {
            detail: { ...data, manager }
        });
        
        window.dispatchEvent(newEvent);
        window.dispatchEvent(legacyEvent);
    };
}

// ========================================================================
// AUTO-INITIALIZATION
// ========================================================================

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initializeUnifiedSettingsManager();
    });
} else {
    // DOM is already ready
    initializeUnifiedSettingsManager();
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { UnifiedSettingsManager, initializeUnifiedSettingsManager };
}

// AMD support
if (typeof define === 'function' && define.amd) {
    define([], () => ({ UnifiedSettingsManager, initializeUnifiedSettingsManager }));
} 