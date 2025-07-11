/**
 * 🚀 Unified Live Edit System - Modern Admin Styler V2
 * 
 * Consolidated from multiple files into a single modular architecture:
 * - live-edit-mode.js (system paneli)
 * - admin-modern-v3.js (główna logika)
 * - mas-live-edit-bridge.js (most kompatybilności)
 * - toast-notifications.js (powiadomienia)
 * - preset-manager.js (presety)
 * 
 * @package ModernAdminStyler
 * @version 4.0.0 - Unified Architecture
 */

(function(window, document, $) {
    'use strict';

    // ========================================================================
    // 🌐 MODULE: SyncManager (Multi-tab synchronization)
    // ========================================================================
    const SyncManager = {
        channel: null,
        tabId: Date.now() + Math.random(),
        listeners: new Map(),
        isLocalStorageFallback: false,
        
        init() {
            try {
                if (window.BroadcastChannel) {
                    this.channel = new BroadcastChannel('mas-live-edit-sync');
                    this.channel.onmessage = (event) => {
                        if (event.data.tabId !== this.tabId) {
                            this.handleMessage(event.data);
                        }
                    };
                } else {
                    this.initLocalStorageFallback();
                }
            } catch (error) {
                console.warn('SyncManager: Fallback to localStorage', error);
                this.initLocalStorageFallback();
            }
        },
        
        broadcast(key, value) {
            const message = {
                tabId: this.tabId,
                key,
                value,
                timestamp: Date.now()
            };
            
            if (this.channel) {
                this.channel.postMessage(message);
            } else {
                this.broadcastViaLocalStorage(key, value);
            }
        },
        
        initLocalStorageFallback() {
            this.isLocalStorageFallback = true;
            window.addEventListener('storage', (e) => {
                if (e.key === 'mas-live-edit-sync') {
                    try {
                        const data = JSON.parse(e.newValue);
                        if (data.tabId !== this.tabId) {
                            this.handleMessage(data);
                        }
                    } catch (error) {
                        console.error('SyncManager: Error parsing localStorage message', error);
                    }
                }
            });
        },
        
        broadcastViaLocalStorage(key, value) {
            const message = {
                tabId: this.tabId,
                key,
                value,
                timestamp: Date.now()
            };
            
            localStorage.setItem('mas-live-edit-sync', JSON.stringify(message));
            // Clear after broadcast to prevent accumulation
            setTimeout(() => {
                localStorage.removeItem('mas-live-edit-sync');
            }, 100);
        },
        
        handleMessage(data) {
            if (this.listeners.has(data.key)) {
                this.listeners.get(data.key).forEach(callback => {
                    callback(data.value, data);
                });
            }
        },
        
        subscribe(key, callback) {
            if (!this.listeners.has(key)) {
                this.listeners.set(key, []);
            }
            this.listeners.get(key).push(callback);
        },
        
        unsubscribe(key, callback) {
            if (this.listeners.has(key)) {
                const callbacks = this.listeners.get(key);
                const index = callbacks.indexOf(callback);
                if (index > -1) {
                    callbacks.splice(index, 1);
                }
            }
        },
        
        destroy() {
            if (this.channel) {
                this.channel.close();
            }
            this.listeners.clear();
        }
    };

    // ========================================================================
    // 🏗️ MODULE: StateManager (Critical State Management & Persistence)
    // ========================================================================
    class StateManager {
        constructor() {
            this.isInitialized = false;
            this.settings = new Map();
            this.defaultSettings = new Map();
            this.saveQueue = new Map();
            this.retryQueue = [];
            this.saveInProgress = false;
            this.isOffline = false;
            this.maxRetries = 3;
            this.saveDelay = 1000; // 1 second debounce
            this.saveTimer = null;
            this.retryTimer = null;
            this.lastSaveTimestamp = 0;
            this.pendingChanges = new Set();
            this.isDebugMode = false;
            
            // Storage keys
            this.storageKeys = {
                settings: 'mas_live_edit_settings',
                backup: 'mas_live_edit_backup',
                session: 'mas_live_edit_session',
                offline: 'mas_live_edit_offline_queue',
                timestamp: 'mas_live_edit_timestamp'
            };
            
            // Cross-tab synchronization
            this.broadcastChannel = null;
            this.isLeaderTab = false;
            this.tabId = this.generateTabId();
            this.heartbeatInterval = null;
            
            // Performance tracking
            this.performanceMetrics = {
                saveAttempts: 0,
                saveSuccess: 0,
                saveFailures: 0,
                retryAttempts: 0,
                averageSaveTime: 0,
                lastSaveTime: 0
            };
            
            // Initialize default settings
            this.initializeDefaults();
            
            // Setup event listeners
            this.setupEventListeners();
            
            this.debug('StateManager initialized', { tabId: this.tabId });
        }
        
        /**
         * 🔧 Initialize default settings
         */
        initializeDefaults() {
            const defaults = {
                // Global Settings
                'enable_plugin': true,
                'color_scheme': 'light',
                'color_palette': 'modern',
                'performance_mode': false,
                'enable_animations': true,
                
                // Admin Bar
                'admin_bar_height': 32,
                'admin_bar_background': '#23282d',
                'admin_bar_text_color': '#ffffff',
                'admin_bar_hover_color': '#00a0d2',
                'admin_bar_floating': false,
                'admin_bar_glossy': false,
                'admin_bar_margin': 0,
                'wpadminbar_bg_color': '#23282d',
                'wpadminbar_text_color': '#ffffff',
                'wpadminbar_hover_color': '#00a0d2',
                'wpadminbar_height': 32,
                'wpadminbar_font_size': 13,
                'wpadminbar_glassmorphism': false,
                'wpadminbar_floating': false,
                'wpadminbar_hide_wp_logo': false,
                'wpadminbar_hide_howdy': false,
                'wpadminbar_hide_update_notices': false,
                'wpadminbar_hide_comments': false,
                
                // Menu
                'menu_width': 160,
                'menu_background': '#23282d',
                'menu_text_color': '#ffffff',
                'menu_hover_background': '#32373c',
                'menu_hover_text_color': '#00a0d2',
                'menu_compact_mode': false,
                'menu_floating': false,
                'menu_glassmorphism': false,
                'adminmenuwrap_floating': false,
                
                // Submenu
                'submenu_background': '#32373c',
                'submenu_text_color': '#ffffff',
                'submenu_hover_background': '#0073aa',
                'submenu_hover_text_color': '#ffffff',
                'submenu_separator': false,
                'submenu_indicator_style': 'arrow',
                
                // Typography
                'body_font': 'system',
                'heading_font': 'system',
                'global_font_size': 14,
                'global_line_height': 1.5,
                'headings_scale': 1.25,
                'headings_weight': 600,
                'headings_spacing': 1.0,
                
                // Colors
                'primary_color': '#0073aa',
                'secondary_color': '#00a0d2',
                'accent_color': '#d63638',
                'success_color': '#46b450',
                'warning_color': '#ffb900',
                'error_color': '#d63638',
                'shadow_color': '#000000',
                'content_background': '#ffffff',
                'content_text_color': '#1e1e1e',
                
                // Dimensions
                'content_padding': 20,
                'content_max_width': 1200,
                'shadow_opacity': 0.2,
                'shadow_blur': 10,
                'transition_speed': 0.3,
                'z_index_base': 1000,
                
                // Postbox
                'postbox_bg_color': '#ffffff',
                'postbox_border_color': '#e2e4e7',
                'postbox_title_color': '#1e1e1e',
                'postbox_glassmorphism': false,
                'postbox_hover_lift': false,
                
                // Advanced
                'hardware_acceleration': true,
                'respect_reduced_motion': true,
                'mobile_3d_optimization': true,
                'enable_debug_mode': false,
                'wpfooter_hide_version': false,
                'wpfooter_hide_thanks': false
            };
            
            Object.entries(defaults).forEach(([key, value]) => {
                this.defaultSettings.set(key, value);
            });
        }
        
        /**
         * 🔧 Setup event listeners
         */
        setupEventListeners() {
            // Network status
            window.addEventListener('online', () => this.handleOnline());
            window.addEventListener('offline', () => this.handleOffline());
            
            // BeforeUnload protection
            window.addEventListener('beforeunload', (e) => this.handleBeforeUnload(e));
            
            // Page visibility for tab management
            document.addEventListener('visibilitychange', () => this.handleVisibilityChange());
            
            // Storage events for cross-tab sync
            window.addEventListener('storage', (e) => this.handleStorageChange(e));
            
            // Setup BroadcastChannel for modern browsers
            if (typeof BroadcastChannel !== 'undefined') {
                try {
                    this.broadcastChannel = new BroadcastChannel('mas_live_edit_sync');
                    this.broadcastChannel.onmessage = (event) => this.handleBroadcastMessage(event);
                } catch (error) {
                    this.debug('BroadcastChannel not supported', error);
                }
            }
            
            // Start heartbeat for tab leadership
            this.startHeartbeat();
        }
        
        /**
         * 🚀 Initialize the state manager
         */
        async init() {
            if (this.isInitialized) return;
            
            this.debug('Initializing StateManager...');
            
            // Determine if this is debug mode
            this.isDebugMode = window.location.search.includes('debug=1') || 
                            localStorage.getItem('mas_debug_mode') === 'true';
            
            // Load settings from all sources
            await this.loadSettings();
            
            // Apply initial state
            this.applyAllSettings();
            
            // Process any offline queue
            await this.processOfflineQueue();
            
            this.isInitialized = true;
            this.debug('StateManager initialized successfully');
            
            // Show initialization toast
            if (window.UnifiedLiveEdit && window.UnifiedLiveEdit.MASToast) {
                window.UnifiedLiveEdit.MASToast.success('Live Edit Mode ready', 2000);
            }
        }
        
        /**
         * 💾 Load settings from all sources with fallback chain
         */
        async loadSettings() {
            this.debug('Loading settings from all sources...');
            
            // Start with defaults
            this.settings = new Map(this.defaultSettings);
            
            // 1. Try server first (most authoritative)
            try {
                const serverSettings = await this.loadFromServer();
                if (serverSettings) {
                    Object.entries(serverSettings).forEach(([key, value]) => {
                        this.settings.set(key, value);
                    });
                    this.debug('Loaded settings from server', serverSettings);
                }
            } catch (error) {
                this.debug('Failed to load from server', error);
            }
            
            // 2. Fallback to localStorage
            try {
                const localSettings = this.loadFromLocalStorage();
                if (localSettings) {
                    Object.entries(localSettings).forEach(([key, value]) => {
                        // Only use localStorage if server didn't provide this setting
                        if (!this.settings.has(key) || this.settings.get(key) === this.defaultSettings.get(key)) {
                            this.settings.set(key, value);
                        }
                    });
                    this.debug('Loaded settings from localStorage', localSettings);
                }
            } catch (error) {
                this.debug('Failed to load from localStorage', error);
            }
            
            // 3. Fallback to sessionStorage
            try {
                const sessionSettings = this.loadFromSessionStorage();
                if (sessionSettings) {
                    Object.entries(sessionSettings).forEach(([key, value]) => {
                        // Only use sessionStorage if others didn't provide this setting
                        if (!this.settings.has(key) || this.settings.get(key) === this.defaultSettings.get(key)) {
                            this.settings.set(key, value);
                        }
                    });
                    this.debug('Loaded settings from sessionStorage', sessionSettings);
                }
            } catch (error) {
                this.debug('Failed to load from sessionStorage', error);
            }
            
            // 4. Save to local storage for future use
            this.saveToLocalStorage();
            this.saveToSessionStorage();
        }
        
        /**
         * 🌐 Load settings from server
         */
        async loadFromServer() {
            if (!window.ajaxurl) {
                throw new Error('WordPress AJAX URL not available');
            }
            
            const response = await fetch(window.ajaxurl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    action: 'mas_get_live_settings',
                    nonce: window.masNonce || window.mas_nonce || ''
                })
            });
            
            if (!response.ok) {
                throw new Error(`Server responded with ${response.status}`);
            }
            
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.message || 'Unknown server error');
            }
            
            return data.settings || data.data || {};
        }
        
        /**
         * 💾 Load settings from localStorage
         */
        loadFromLocalStorage() {
            try {
                const stored = localStorage.getItem(this.storageKeys.settings);
                return stored ? JSON.parse(stored) : null;
            } catch (error) {
                this.debug('Failed to parse localStorage settings', error);
                return null;
            }
        }
        
        /**
         * 💾 Load settings from sessionStorage
         */
        loadFromSessionStorage() {
            try {
                const stored = sessionStorage.getItem(this.storageKeys.session);
                return stored ? JSON.parse(stored) : null;
            } catch (error) {
                this.debug('Failed to parse sessionStorage settings', error);
                return null;
            }
        }
        
        /**
         * 🔄 Update a setting
         */
        updateSetting(key, value, options = {}) {
            const oldValue = this.settings.get(key);
            
            // Validate setting
            if (!this.isValidSetting(key, value)) {
                this.debug(`Invalid setting: ${key} = ${value}`);
                return false;
            }
            
            // Update internal state
            this.settings.set(key, value);
            
            // Apply immediately to UI
            this.applySetting(key, value, options);
            
            // Mark as pending change
            this.pendingChanges.add(key);
            
            // Add to save queue
            this.saveQueue.set(key, value);
            
            // Save to local storage immediately
            this.saveToLocalStorage();
            this.saveToSessionStorage();
            
            // Broadcast to other tabs
            this.broadcastChange(key, value);
            
            // Schedule server save
            this.scheduleSave();
            
            this.debug(`Setting updated: ${key} = ${value}`);
            
            return true;
        }
        
        /**
         * 🎨 Apply a single setting to the UI
         */
        applySetting(key, value, options = {}) {
            // Get CSS variable mapping
            const cssVar = this.getCSSVariable(key);
            
            if (cssVar) {
                // Apply CSS variable
                const cssValue = this.formatCSSValue(key, value);
                document.documentElement.style.setProperty(cssVar, cssValue);
                
                // Also apply to body for higher specificity
                document.body.style.setProperty(cssVar, cssValue, 'important');
                
                this.debug(`Applied CSS: ${cssVar} = ${cssValue}`);
            }
            
            // Apply body classes
            const bodyClass = this.getBodyClass(key, value);
            if (bodyClass) {
                this.applyBodyClass(bodyClass, value);
            }
            
            // Apply element visibility
            this.applyElementVisibility(key, value);
            
            // Apply special cases
            this.applySpecialCases(key, value);
        }
        
        /**
         * 🎨 Apply all settings to the UI
         */
        applyAllSettings() {
            this.debug('Applying all settings to UI...');
            
            this.settings.forEach((value, key) => {
                this.applySetting(key, value);
            });
        }
        
        /**
         * 🎨 Get CSS variable name for setting
         */
        getCSSVariable(key) {
            const cssVariableMap = {
                // Admin Bar
                'admin_bar_height': '--woow-surface-bar-height',
                'admin_bar_background': '--woow-surface-bar',
                'admin_bar_text_color': '--woow-surface-bar-text',
                'admin_bar_hover_color': '--woow-surface-bar-hover',
                'wpadminbar_bg_color': '--woow-surface-bar',
                'wpadminbar_text_color': '--woow-surface-bar-text',
                'wpadminbar_hover_color': '--woow-surface-bar-hover',
                'wpadminbar_height': '--woow-surface-bar-height',
                'wpadminbar_font_size': '--woow-surface-bar-font-size',
                
                // Menu
                'menu_width': '--woow-surface-menu-width',
                'menu_background': '--woow-surface-menu',
                'menu_text_color': '--woow-surface-menu-text',
                'menu_hover_background': '--woow-surface-menu-hover',
                'menu_hover_text_color': '--woow-surface-menu-hover-text',
                
                // Typography
                'global_font_size': '--woow-font-size-base',
                'global_line_height': '--woow-line-height-base',
                'headings_scale': '--woow-headings-scale',
                'headings_weight': '--woow-headings-weight',
                
                // Colors
                'primary_color': '--woow-accent-primary',
                'secondary_color': '--woow-accent-secondary',
                'accent_color': '--woow-accent-accent',
                'success_color': '--woow-accent-success',
                'warning_color': '--woow-accent-warning',
                'error_color': '--woow-accent-error',
                'content_background': '--woow-bg-primary',
                'content_text_color': '--woow-text-primary',
                
                // Postbox
                'postbox_bg_color': '--woow-postbox-bg',
                'postbox_border_color': '--woow-postbox-border',
                'postbox_title_color': '--woow-postbox-title',
                
                // Advanced
                'transition_speed': '--woow-transition-speed',
                'z_index_base': '--woow-z-index-base',
                'shadow_opacity': '--woow-shadow-opacity',
                'shadow_blur': '--woow-shadow-blur'
            };
            
            return cssVariableMap[key] || null;
        }
        
        /**
         * 🎨 Format CSS value with proper units
         */
        formatCSSValue(key, value) {
            const unitMap = {
                'admin_bar_height': 'px',
                'wpadminbar_height': 'px',
                'wpadminbar_font_size': 'px',
                'menu_width': 'px',
                'global_font_size': 'px',
                'content_padding': 'px',
                'content_max_width': 'px',
                'shadow_blur': 'px',
                'transition_speed': 's'
            };
            
            const unit = unitMap[key] || '';
            
            // Handle boolean values
            if (typeof value === 'boolean') {
                return value ? '1' : '0';
            }
            
            // Handle numeric values
            if (typeof value === 'number' || (typeof value === 'string' && !isNaN(value))) {
                return value + unit;
            }
            
            // Return as-is for colors and other string values
            return value;
        }
        
        /**
         * 🎨 Get body class for setting
         */
        getBodyClass(key, value) {
            const bodyClassMap = {
                'admin_bar_floating': 'woow-admin-bar-floating',
                'admin_bar_glossy': 'woow-admin-bar-glossy',
                'menu_floating': 'woow-menu-floating',
                'menu_glassmorphism': 'woow-menu-glassmorphism',
                'menu_compact_mode': 'woow-menu-compact',
                'performance_mode': 'woow-performance-mode',
                'wpadminbar_floating': 'woow-admin-bar-floating',
                'wpadminbar_glassmorphism': 'woow-admin-bar-glassmorphism',
                'adminmenuwrap_floating': 'woow-menu-floating',
                'postbox_glassmorphism': 'woow-postbox-glassmorphism',
                'postbox_hover_lift': 'woow-postbox-hover-lift',
                'color_scheme': 'woow-color-scheme-'
            };
            
            return bodyClassMap[key] || null;
        }
        
        /**
         * 🎨 Apply body class
         */
        applyBodyClass(className, value) {
            if (className.endsWith('-')) {
                // Handle scheme classes
                const prefix = className;
                // Remove existing scheme classes
                document.body.classList.forEach(cls => {
                    if (cls.startsWith(prefix)) {
                        document.body.classList.remove(cls);
                    }
                });
                // Add new scheme class
                document.body.classList.add(prefix + value);
            } else {
                // Handle boolean classes
                if (value) {
                    document.body.classList.add(className);
                } else {
                    document.body.classList.remove(className);
                }
            }
        }
        
        /**
         * 🎨 Apply element visibility
         */
        applyElementVisibility(key, value) {
            const visibilityMap = {
                'wpadminbar_hide_wp_logo': '#wp-admin-bar-wp-logo',
                'wpadminbar_hide_howdy': '#wp-admin-bar-my-account .display-name',
                'wpadminbar_hide_update_notices': '#wp-admin-bar-updates',
                'wpadminbar_hide_comments': '#wp-admin-bar-comments',
                'wpfooter_hide_version': '#wpfooter .alignright',
                'wpfooter_hide_thanks': '#wpfooter .alignleft'
            };
            
            const selector = visibilityMap[key];
            if (selector) {
                const element = document.querySelector(selector);
                if (element) {
                    element.style.display = value ? 'none' : '';
                }
            }
        }
        
        /**
         * 🎨 Apply special cases
         */
        applySpecialCases(key, value) {
            // Force admin bar color update for stubborn WordPress
            if (key === 'admin_bar_background' || key === 'wpadminbar_bg_color') {
                const adminBar = document.querySelector('#wpadminbar');
                if (adminBar) {
                    adminBar.style.setProperty('background-color', value, 'important');
                    adminBar.style.setProperty('background', value, 'important');
                }
            }
            
            // Update menu width
            if (key === 'menu_width') {
                const menu = document.querySelector('#adminmenuwrap');
                if (menu) {
                    menu.style.setProperty('width', value + 'px', 'important');
                }
            }
        }
        
        /**
         * 💾 Save to localStorage
         */
        saveToLocalStorage() {
            try {
                const settingsObj = Object.fromEntries(this.settings);
                localStorage.setItem(this.storageKeys.settings, JSON.stringify(settingsObj));
                localStorage.setItem(this.storageKeys.timestamp, Date.now().toString());
            } catch (error) {
                this.debug('Failed to save to localStorage', error);
            }
        }
        
        /**
         * 💾 Save to sessionStorage
         */
        saveToSessionStorage() {
            try {
                const settingsObj = Object.fromEntries(this.settings);
                sessionStorage.setItem(this.storageKeys.session, JSON.stringify(settingsObj));
            } catch (error) {
                this.debug('Failed to save to sessionStorage', error);
            }
        }
        
        /**
         * 🔄 Schedule server save
         */
        scheduleSave() {
            if (this.saveTimer) {
                clearTimeout(this.saveTimer);
            }
            
            this.saveTimer = setTimeout(() => {
                this.saveToServer();
            }, this.saveDelay);
        }
        
        /**
         * 🌐 Save to server with retry mechanism
         */
        async saveToServer() {
            if (this.saveInProgress || this.saveQueue.size === 0) {
                return;
            }
            
            this.saveInProgress = true;
            this.performanceMetrics.saveAttempts++;
            
            const startTime = performance.now();
            const settingsToSave = Object.fromEntries(this.saveQueue);
            
            try {
                if (this.isOffline) {
                    // Add to offline queue
                    this.addToOfflineQueue(settingsToSave);
                    this.debug('Added to offline queue', settingsToSave);
                    return;
                }
                
                if (!window.ajaxurl) {
                    throw new Error('WordPress AJAX URL not available');
                }
                
                const response = await fetch(window.ajaxurl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: new URLSearchParams({
                        action: 'mas_save_live_settings',
                        settings: JSON.stringify(settingsToSave),
                        nonce: window.masNonce || window.mas_nonce || ''
                    })
                });
                
                if (!response.ok) {
                    throw new Error(`Server responded with ${response.status}`);
                }
                
                const data = await response.json();
                
                if (!data.success) {
                    throw new Error(data.message || 'Unknown server error');
                }
                
                // Success - clear queue and pending changes
                this.saveQueue.clear();
                Object.keys(settingsToSave).forEach(key => {
                    this.pendingChanges.delete(key);
                });
                
                // Update performance metrics
                const saveTime = performance.now() - startTime;
                this.performanceMetrics.saveSuccess++;
                this.performanceMetrics.lastSaveTime = saveTime;
                this.performanceMetrics.averageSaveTime = 
                    (this.performanceMetrics.averageSaveTime + saveTime) / 2;
                
                this.lastSaveTimestamp = Date.now();
                
                this.debug('Settings saved to server successfully', {
                    settings: settingsToSave,
                    saveTime: saveTime + 'ms',
                    response: data
                });
                
                // Show success toast
                if (window.UnifiedLiveEdit && window.UnifiedLiveEdit.MASToast) {
                    window.UnifiedLiveEdit.MASToast.success('Settings saved', 2000);
                }
                
            } catch (error) {
                this.performanceMetrics.saveFailures++;
                this.debug('Failed to save to server', error);
                
                // Add to retry queue
                this.addToRetryQueue(settingsToSave);
                
                // Show error toast
                if (window.UnifiedLiveEdit && window.UnifiedLiveEdit.MASToast) {
                    window.UnifiedLiveEdit.MASToast.error('Failed to save settings', 3000);
                }
                
            } finally {
                this.saveInProgress = false;
            }
        }
        
        /**
         * 🔄 Add to retry queue
         */
        addToRetryQueue(settings) {
            const retryItem = {
                settings,
                attempts: 0,
                timestamp: Date.now()
            };
            
            this.retryQueue.push(retryItem);
            this.scheduleRetry();
        }
        
        /**
         * 🔄 Schedule retry
         */
        scheduleRetry() {
            if (this.retryTimer) {
                clearTimeout(this.retryTimer);
            }
            
            // Exponential backoff: 2s, 4s, 8s
            const delay = Math.pow(2, this.retryQueue.length) * 1000;
            
            this.retryTimer = setTimeout(() => {
                this.processRetryQueue();
            }, delay);
        }
        
        /**
         * 🔄 Process retry queue
         */
        async processRetryQueue() {
            if (this.retryQueue.length === 0 || this.isOffline) {
                return;
            }
            
            const retryItem = this.retryQueue.shift();
            retryItem.attempts++;
            this.performanceMetrics.retryAttempts++;
            
            // Re-add to save queue
            Object.entries(retryItem.settings).forEach(([key, value]) => {
                this.saveQueue.set(key, value);
            });
            
            try {
                await this.saveToServer();
                this.debug('Retry successful', retryItem);
            } catch (error) {
                this.debug('Retry failed', { error, retryItem });
                
                // Add back to retry queue if under max attempts
                if (retryItem.attempts < this.maxRetries) {
                    this.retryQueue.push(retryItem);
                    this.scheduleRetry();
                } else {
                    this.debug('Max retries exceeded, adding to offline queue', retryItem);
                    this.addToOfflineQueue(retryItem.settings);
                }
            }
        }
        
        /**
         * 💾 Add to offline queue
         */
        addToOfflineQueue(settings) {
            try {
                const queue = this.getOfflineQueue();
                queue.push({
                    settings,
                    timestamp: Date.now()
                });
                localStorage.setItem(this.storageKeys.offline, JSON.stringify(queue));
            } catch (error) {
                this.debug('Failed to add to offline queue', error);
            }
        }
        
        /**
         * 💾 Get offline queue
         */
        getOfflineQueue() {
            try {
                const stored = localStorage.getItem(this.storageKeys.offline);
                return stored ? JSON.parse(stored) : [];
            } catch (error) {
                this.debug('Failed to get offline queue', error);
                return [];
            }
        }
        
        /**
         * 🔄 Process offline queue
         */
        async processOfflineQueue() {
            if (this.isOffline) {
                return;
            }
            
            const queue = this.getOfflineQueue();
            if (queue.length === 0) {
                return;
            }
            
            this.debug('Processing offline queue', { queueLength: queue.length });
            
            for (const item of queue) {
                Object.entries(item.settings).forEach(([key, value]) => {
                    this.saveQueue.set(key, value);
                });
            }
            
            // Clear offline queue
            localStorage.removeItem(this.storageKeys.offline);
            
            // Save to server
            await this.saveToServer();
        }
        
        /**
         * 🌐 Handle online event
         */
        async handleOnline() {
            this.isOffline = false;
            this.debug('Connection restored');
            
            // Show online toast
            if (window.UnifiedLiveEdit && window.UnifiedLiveEdit.MASToast) {
                window.UnifiedLiveEdit.MASToast.success('Connection restored', 2000);
            }
            
            // Process offline queue
            await this.processOfflineQueue();
            
            // Process retry queue
            this.processRetryQueue();
        }
        
        /**
         * 🌐 Handle offline event
         */
        handleOffline() {
            this.isOffline = true;
            this.debug('Connection lost');
            
            // Show offline toast
            if (window.UnifiedLiveEdit && window.UnifiedLiveEdit.MASToast) {
                window.UnifiedLiveEdit.MASToast.warning('Working offline', 3000);
            }
        }
        
        /**
         * 🔒 Handle beforeunload event
         */
        handleBeforeUnload(event) {
            if (this.pendingChanges.size > 0) {
                const message = 'You have unsaved changes. Are you sure you want to leave?';
                event.returnValue = message;
                return message;
            }
        }
        
        /**
         * 📡 Broadcast change to other tabs
         */
        broadcastChange(key, value) {
            const message = {
                type: 'setting_change',
                key,
                value,
                timestamp: Date.now(),
                tabId: this.tabId
            };
            
            // Use BroadcastChannel if available
            if (this.broadcastChannel) {
                this.broadcastChannel.postMessage(message);
            }
            
            // Fallback to localStorage
            try {
                localStorage.setItem('mas_live_edit_broadcast', JSON.stringify(message));
                localStorage.removeItem('mas_live_edit_broadcast');
            } catch (error) {
                this.debug('Failed to broadcast via localStorage', error);
            }
        }
        
        /**
         * 📡 Handle broadcast message
         */
        handleBroadcastMessage(event) {
            const { type, key, value, tabId } = event.data;
            
            // Ignore messages from this tab
            if (tabId === this.tabId) {
                return;
            }
            
            if (type === 'setting_change') {
                // Update local state without triggering save
                this.settings.set(key, value);
                
                // Apply to UI
                this.applySetting(key, value);
                
                // Update storage
                this.saveToLocalStorage();
                this.saveToSessionStorage();
                
                this.debug('Received setting change from another tab', { key, value });
            }
        }
        
        /**
         * 💾 Handle storage change event
         */
        handleStorageChange(event) {
            if (event.key === 'mas_live_edit_broadcast') {
                try {
                    const message = JSON.parse(event.newValue);
                    this.handleBroadcastMessage({ data: message });
                } catch (error) {
                    this.debug('Failed to parse broadcast message', error);
                }
            }
        }
        
        /**
         * 👁️ Handle visibility change
         */
        handleVisibilityChange() {
            if (document.visibilityState === 'visible') {
                // Tab became visible - reload settings to sync
                this.loadSettings();
            }
        }
        
        /**
         * 💓 Start heartbeat for tab leadership
         */
        startHeartbeat() {
            this.heartbeatInterval = setInterval(() => {
                localStorage.setItem('mas_live_edit_tab_' + this.tabId, Date.now().toString());
            }, 1000);
        }
        
        /**
         * 🔧 Validate setting
         */
        isValidSetting(key, value) {
            // Check if key exists in defaults
            if (!this.defaultSettings.has(key)) {
                return false;
            }
            
            // Type validation
            const defaultValue = this.defaultSettings.get(key);
            const defaultType = typeof defaultValue;
            const valueType = typeof value;
            
            // Allow string representations of numbers
            if (defaultType === 'number' && valueType === 'string' && !isNaN(value)) {
                return true;
            }
            
            // Allow boolean representations
            if (defaultType === 'boolean' && (value === 'true' || value === 'false' || value === true || value === false)) {
                return true;
            }
            
            // Same type check
            if (defaultType === valueType) {
                return true;
            }
            
            return false;
        }
        
        /**
         * 🔧 Generate unique tab ID
         */
        generateTabId() {
            return 'tab_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
        }
        
        /**
         * 🔧 Debug logging
         */
        debug(message, data = null) {
            if (!this.isDebugMode) {
                return;
            }
            
            const timestamp = new Date().toISOString();
            const logMessage = `[${timestamp}] StateManager: ${message}`;
            
            if (data) {
                console.log(logMessage, data);
            } else {
                console.log(logMessage);
            }
        }
        
        /**
         * 📊 Get performance metrics
         */
        getPerformanceMetrics() {
            return {
                ...this.performanceMetrics,
                pendingChanges: this.pendingChanges.size,
                saveQueueSize: this.saveQueue.size,
                retryQueueSize: this.retryQueue.length,
                offlineQueueSize: this.getOfflineQueue().length,
                lastSaveTimestamp: this.lastSaveTimestamp,
                isOffline: this.isOffline,
                tabId: this.tabId
            };
        }
        
        /**
         * 🔄 Reset all settings
         */
        resetAllSettings() {
            this.debug('Resetting all settings to defaults');
            
            // Reset internal state
            this.settings = new Map(this.defaultSettings);
            this.saveQueue.clear();
            this.pendingChanges.clear();
            
            // Clear storage
            localStorage.removeItem(this.storageKeys.settings);
            localStorage.removeItem(this.storageKeys.backup);
            localStorage.removeItem(this.storageKeys.offline);
            sessionStorage.removeItem(this.storageKeys.session);
            
            // Apply defaults to UI
            this.applyAllSettings();
            
            // Save to server
            this.saveQueue = new Map(this.defaultSettings);
            this.saveToServer();
            
            // Show success toast
            if (window.UnifiedLiveEdit && window.UnifiedLiveEdit.MASToast) {
                window.UnifiedLiveEdit.MASToast.success('Settings reset to defaults', 3000);
            }
        }
        
        /**
         * 🔧 Get setting value
         */
        getSetting(key) {
            return this.settings.get(key) || this.defaultSettings.get(key);
        }
        
        /**
         * 🔧 Get all settings
         */
        getAllSettings() {
            return Object.fromEntries(this.settings);
        }
        
        /**
         * 🔧 Destroy state manager
         */
        destroy() {
            // Clear timers
            if (this.saveTimer) {
                clearTimeout(this.saveTimer);
            }
            if (this.retryTimer) {
                clearTimeout(this.retryTimer);
            }
            if (this.heartbeatInterval) {
                clearInterval(this.heartbeatInterval);
            }
            
            // Close broadcast channel
            if (this.broadcastChannel) {
                this.broadcastChannel.close();
            }
            
            // Remove event listeners
            window.removeEventListener('online', this.handleOnline);
            window.removeEventListener('offline', this.handleOffline);
            window.removeEventListener('beforeunload', this.handleBeforeUnload);
            document.removeEventListener('visibilitychange', this.handleVisibilityChange);
            window.removeEventListener('storage', this.handleStorageChange);
            
            this.debug('StateManager destroyed');
        }
    }

    // ========================================================================
    // 🛡️ MODULE: BeforeUnloadProtection (Data protection)
    // ========================================================================
    const BeforeUnloadProtection = {
        isActive: false,
        pendingChanges: new Set(),
        
        enable() {
            if (!this.isActive) {
                window.addEventListener('beforeunload', this.handleBeforeUnload);
                this.isActive = true;
            }
        },
        
        disable() {
            if (this.isActive) {
                window.removeEventListener('beforeunload', this.handleBeforeUnload);
                this.isActive = false;
            }
        },
        
        addPendingChange(key) {
            this.pendingChanges.add(key);
            this.enable();
        },
        
        removePendingChange(key) {
            this.pendingChanges.delete(key);
            if (this.pendingChanges.size === 0) {
                this.disable();
            }
        },
        
        handleBeforeUnload: (e) => {
            if (BeforeUnloadProtection.pendingChanges.size > 0) {
                const message = 'You have unsaved changes. Are you sure you want to leave?';
                e.returnValue = message;
                return message;
            }
        }
    };

    // ========================================================================
    // 🔧 MODULE: SettingsRestorer (Persistence)
    // ========================================================================
    class SettingsRestorer {
        constructor() {
            this.storageKey = 'mas_live_edit_settings';
            this.settings = new Map();
        }
        
        init() {
            this.loadFromStorage();
            this.restoreSettings();
            this.setupAutoSave();
        }
        
        loadFromStorage() {
            try {
                const saved = localStorage.getItem(this.storageKey);
                if (saved) {
                    const parsed = JSON.parse(saved);
                    Object.entries(parsed).forEach(([key, value]) => {
                        this.settings.set(key, value);
                    });
                }
            } catch (error) {
                console.error('SettingsRestorer: Error loading from storage', error);
            }
        }
        
        saveToStorage() {
            try {
                const obj = {};
                this.settings.forEach((value, key) => {
                    obj[key] = value;
                });
                localStorage.setItem(this.storageKey, JSON.stringify(obj));
            } catch (error) {
                console.error('SettingsRestorer: Error saving to storage', error);
            }
        }
        
        async restoreSettings() {
            for (const [key, value] of this.settings) {
                this.applySettingToCSS(key, value);
            }
        }
        
        applySettingToCSS(key, value) {
            const cssVar = this.mapSettingToCSSVar(key);
            if (cssVar) {
                document.documentElement.style.setProperty(cssVar, value);
            }
        }
        
        mapSettingToCSSVar(key) {
            const mapping = {
                'admin_bar_bg_color': '--woow-adminbar-bg-color',
                'admin_bar_text_color': '--woow-adminbar-text-color',
                'menu_bg_color': '--woow-menu-bg-color',
                'menu_text_color': '--woow-menu-text-color',
                'menu_hover_bg_color': '--woow-menu-hover-bg-color',
                'menu_hover_text_color': '--woow-menu-hover-text-color',
                'content_bg_color': '--woow-content-bg-color',
                'font_family': '--woow-font-family',
                'font_size': '--woow-font-size',
                'border_radius': '--woow-border-radius',
                'box_shadow': '--woow-box-shadow'
            };
            
            return mapping[key] || null;
        }
        
        setSetting(key, value) {
            this.settings.set(key, value);
            this.applySettingToCSS(key, value);
            this.saveToStorage();
            
            // Broadcast to other tabs
            SyncManager.broadcast(key, value);
        }
        
        getSetting(key, defaultValue = null) {
            return this.settings.get(key) || defaultValue;
        }
        
        setupAutoSave() {
            // Save every 30 seconds
            setInterval(() => {
                this.saveToStorage();
            }, 30000);
        }
    }

    // ========================================================================
    // 🎨 MODULE: Enhanced Toast Notifications
    // ========================================================================
    class MASToastNotifications {
        constructor() {
            this.container = null;
            this.toasts = [];
            this.queue = [];
            this.maxToasts = 5;
            this.defaultDuration = 5000;
            this.animationDuration = 300;
            
            this.types = {
                SUCCESS: 'success',
                ERROR: 'error',
                WARNING: 'warning',
                INFO: 'info',
                LOADING: 'loading'
            };
            
            this.positions = {
                TOP_RIGHT: 'top-right',
                TOP_LEFT: 'top-left',
                TOP_CENTER: 'top-center',
                BOTTOM_RIGHT: 'bottom-right',
                BOTTOM_LEFT: 'bottom-left',
                BOTTOM_CENTER: 'bottom-center'
            };
            
            this.currentPosition = this.positions.TOP_RIGHT;
            this.init();
        }
        
        init() {
            this.createContainer();
            this.injectStyles();
            this.setupEventListeners();
        }
        
        createContainer() {
            this.container = document.createElement('div');
            this.container.id = 'mas-toast-container';
            this.container.className = `mas-toast-container ${this.currentPosition}`;
            this.container.setAttribute('aria-live', 'polite');
            this.container.setAttribute('aria-label', 'Notifications');
            
            document.body.appendChild(this.container);
        }
        
        injectStyles() {
            if (document.getElementById('mas-toast-styles')) return;
            
            const styles = document.createElement('style');
            styles.id = 'mas-toast-styles';
            styles.textContent = `
                .mas-toast-container {
                    position: fixed;
                    z-index: 999999;
                    pointer-events: none;
                    max-width: 420px;
                    width: 100%;
                    padding: 16px;
                    box-sizing: border-box;
                }
                
                .mas-toast-container.top-right {
                    top: 0;
                    right: 0;
                }
                
                .mas-toast {
                    pointer-events: auto;
                    margin-bottom: 12px;
                    padding: 16px 20px;
                    border-radius: 8px;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                    backdrop-filter: blur(10px);
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    font-size: 14px;
                    line-height: 1.4;
                    max-width: 100%;
                    word-wrap: break-word;
                    position: relative;
                    overflow: hidden;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    transform: translateX(0);
                    opacity: 1;
                }
                
                .mas-toast.success {
                    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                    color: white;
                }
                
                .mas-toast.error {
                    background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
                    color: white;
                }
                
                .mas-toast.warning {
                    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
                    color: white;
                }
                
                .mas-toast.info {
                    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
                    color: white;
                }
                
                .mas-toast.entering {
                    animation: masToastSlideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }
                
                .mas-toast.exiting {
                    animation: masToastSlideOut 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }
                
                @keyframes masToastSlideIn {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                
                @keyframes masToastSlideOut {
                    from {
                        transform: translateX(0);
                        opacity: 1;
                    }
                    to {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                }
            `;
            
            document.head.appendChild(styles);
        }
        
        setupEventListeners() {
            this.container.addEventListener('click', (e) => {
                if (e.target.classList.contains('mas-toast')) {
                    this.remove(e.target.id);
                }
            });
            
            this.container.addEventListener('mouseenter', (e) => {
                if (e.target.classList.contains('mas-toast')) {
                    this.pauseTimer(e.target.id);
                }
            });
            
            this.container.addEventListener('mouseleave', (e) => {
                if (e.target.classList.contains('mas-toast')) {
                    this.resumeTimer(e.target.id);
                }
            });
        }
        
        show(message, type = 'info', duration = this.defaultDuration) {
            const id = 'toast-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
            const toast = {
                id,
                message,
                type,
                duration,
                timestamp: Date.now()
            };
            
            if (this.toasts.length >= this.maxToasts) {
                this.queue.push(toast);
                return id;
            }
            
            this.createToast(toast);
            return id;
        }
        
        createToast(toast) {
            const toastElement = document.createElement('div');
            toastElement.id = toast.id;
            toastElement.className = `mas-toast ${toast.type} entering`;
            toastElement.innerHTML = `
                <div class="mas-toast-content">
                    ${toast.message}
                </div>
            `;
            
            this.container.appendChild(toastElement);
            this.toasts.push(toast);
            
            // Remove entering class after animation
            setTimeout(() => {
                toastElement.classList.remove('entering');
            }, this.animationDuration);
            
            // Set timer for auto-removal
            if (toast.duration > 0) {
                this.setTimer(toast);
            }
        }
        
        setTimer(toast) {
            toast.timer = setTimeout(() => {
                this.remove(toast.id);
            }, toast.duration);
        }
        
        pauseTimer(toastId) {
            const toast = this.toasts.find(t => t.id === toastId);
            if (toast && toast.timer) {
                clearTimeout(toast.timer);
                toast.remainingTime = toast.duration - (Date.now() - toast.timestamp);
            }
        }
        
        resumeTimer(toastId) {
            const toast = this.toasts.find(t => t.id === toastId);
            if (toast && toast.remainingTime > 0) {
                toast.timer = setTimeout(() => {
                    this.remove(toast.id);
                }, toast.remainingTime);
            }
        }
        
        remove(toastId) {
            const toastElement = document.getElementById(toastId);
            if (!toastElement) return;
            
            toastElement.classList.add('exiting');
            
            setTimeout(() => {
                toastElement.remove();
                this.toasts = this.toasts.filter(t => t.id !== toastId);
                this.processQueue();
            }, this.animationDuration);
        }
        
        processQueue() {
            if (this.queue.length > 0 && this.toasts.length < this.maxToasts) {
                const nextToast = this.queue.shift();
                this.createToast(nextToast);
            }
        }
        
        success(message, duration = this.defaultDuration) {
            return this.show(message, this.types.SUCCESS, duration);
        }
        
        error(message, duration = this.defaultDuration) {
            return this.show(message, this.types.ERROR, duration);
        }
        
        warning(message, duration = this.defaultDuration) {
            return this.show(message, this.types.WARNING, duration);
        }
        
        info(message, duration = this.defaultDuration) {
            return this.show(message, this.types.INFO, duration);
        }
        
        clear() {
            this.toasts.forEach(toast => {
                if (toast.timer) {
                    clearTimeout(toast.timer);
                }
            });
            this.toasts = [];
            this.queue = [];
            this.container.innerHTML = '';
        }
    }

    // ========================================================================
    // 🎯 MODULE: Live Preview System
    // ========================================================================
    const MASLivePreview = {
        cache: {
            root: null,
            body: null,
            form: null,
            previewFrame: null
        },
        
        previewTypes: {
            'css-var': {
                handler: 'applyCSSVariable',
                description: 'Sets CSS variable'
            },
            'body-class': {
                handler: 'toggleBodyClass',
                description: 'Toggles body class'
            },
            'element-style': {
                handler: 'applyElementStyle',
                description: 'Applies element styles'
            },
            'custom-css': {
                handler: 'injectCustomCSS',
                description: 'Injects custom CSS'
            }
        },
        
        stats: {
            totalUpdates: 0,
            typeUsage: {},
            performanceMetrics: []
        },
        
        init() {
            this.initCache();
            this.bindEvents();
            this.initializePreviewTypes();
        },
        
        initCache() {
            this.cache.root = document.documentElement;
            this.cache.body = document.body;
            this.cache.form = document.getElementById('mas-v2-settings-form');
            
            if (window.parent !== window) {
                this.cache.previewFrame = window.parent.document;
            }
        },
        
        bindEvents() {
            if (!this.cache.form) return;
            
            $(this.cache.form).on('input change', '[data-live-preview]', (e) => {
                this.handleFieldChange(e.target);
            });
            
            $(this.cache.form).on('mas:custom-update', (e, data) => {
                this.handleCustomUpdate(data);
            });
        },
        
        initializePreviewTypes() {
            Object.keys(this.previewTypes).forEach(type => {
                this.stats.typeUsage[type] = 0;
            });
        },
        
        handleFieldChange(field) {
            const startTime = performance.now();
            
            try {
                const previewType = field.dataset.livePreview;
                const fieldName = field.name;
                const fieldValue = this.getFieldValue(field);
                
                if (!previewType || !this.previewTypes[previewType]) {
                    return;
                }
                
                const success = this.executePreview(previewType, field, fieldValue);
                
                this.updateStats(previewType, startTime, success);
                
                $(document).trigger('mas:live-preview-updated', {
                    field: fieldName,
                    value: fieldValue,
                    type: previewType,
                    success: success
                });
                
            } catch (error) {
                console.error('MASLivePreview: Error handling field change', error);
            }
        },
        
        executePreview(type, field, value) {
            const handler = this.previewTypes[type].handler;
            
            if (typeof this[handler] === 'function') {
                return this[handler](field, value);
            }
            
            return false;
        },
        
        applyCSSVariable(field, value) {
            const varName = field.dataset.cssVar;
            const unit = field.dataset.unit || '';
            const target = field.dataset.target || 'root';
            
            if (!varName) return false;
            
            const targetElement = target === 'root' ? this.cache.root : 
                                 target === 'body' ? this.cache.body : 
                                 document.querySelector(target);
            
            if (targetElement) {
                targetElement.style.setProperty(varName, value + unit);
                return true;
            }
            
            return false;
        },
        
        toggleBodyClass(field, value) {
            const className = field.dataset.bodyClass;
            if (!className) return false;
            
            if (field.type === 'checkbox') {
                this.cache.body.classList.toggle(className, field.checked);
            } else {
                this.cache.body.classList.toggle(className, !!value);
            }
            
            return true;
        },
        
        applyElementStyle(field, value) {
            const selector = field.dataset.targetSelector;
            const cssProperty = field.dataset.cssProperty;
            const unit = field.dataset.unit || '';
            
            if (!selector || !cssProperty) return false;
            
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => {
                el.style[cssProperty] = value + unit;
            });
            
            return elements.length > 0;
        },
        
        getFieldValue(field) {
            if (field.type === 'checkbox') {
                return field.checked;
            } else if (field.type === 'radio') {
                return field.checked ? field.value : null;
            } else {
                return field.value;
            }
        },
        
        updateStats(type, startTime, success) {
            this.stats.totalUpdates++;
            this.stats.typeUsage[type] = (this.stats.typeUsage[type] || 0) + 1;
            
            const endTime = performance.now();
            this.stats.performanceMetrics.push({
                type,
                duration: endTime - startTime,
                success,
                timestamp: Date.now()
            });
            
            // Keep only last 100 performance metrics
            if (this.stats.performanceMetrics.length > 100) {
                this.stats.performanceMetrics.shift();
            }
        },
        
        syncFromLiveEdit(data) {
            const field = this.cache.form?.querySelector(`[name="${data.optionId}"]`);
            if (field && field.value !== data.value) {
                field.value = data.value;
                this.handleFieldChange(field);
            }
        }
    };

    // ========================================================================
    // 🎛️ MODULE: MicroPanelFactory (Enhanced Panel System)
    // ========================================================================
    class MicroPanelFactory {
        constructor() {
            this.activePanels = new Map();
            this.panelCount = 0;
            this.maxPanels = 3;
            this.smartPositioner = new SmartPositioner();
            this.collisionDetector = new CollisionDetector();
            this.panelResizer = new PanelResizer();
            this.visualEffects = new VisualEffects();
            this.zIndexCounter = 99999;
        }
        
        createPanel(element, config, liveEditInstance) {
            // Close existing panels if at max
            if (this.activePanels.size >= this.maxPanels) {
                const firstPanel = this.activePanels.values().next().value;
                this.closePanel(firstPanel.id);
            }
            
            // Calculate optimal position using smart positioning
            const existingPositions = this.getExistingPanelPositions();
            const optimalPosition = this.smartPositioner.calculateOptimalPosition(
                existingPositions, 
                element, 
                config.preferredPosition
            );
            
            const panel = new MicroPanel(element, config, liveEditInstance, {
                position: optimalPosition,
                zIndex: this.zIndexCounter++,
                factory: this
            });
            
            this.activePanels.set(panel.id, panel);
            
            // Add to collision detector
            this.collisionDetector.addPanel(panel);
            
            // Add resize observer
            this.panelResizer.observePanel(panel);
            
            // Add visual effects
            this.visualEffects.animatePanel(panel, 'slideIn');
            this.visualEffects.addHoverEffect(panel.panel);
            
            return panel;
        }
        
        closePanel(panelId) {
            const panel = this.activePanels.get(panelId);
            if (panel) {
                // Remove from observers
                this.collisionDetector.removePanel(panel);
                this.panelResizer.unobservePanel(panel);
                
                // Animate out
                this.visualEffects.animatePanel(panel, 'slideOut').then(() => {
                    panel.close();
                    this.activePanels.delete(panelId);
                });
            }
        }
        
        closeAllPanels() {
            this.activePanels.forEach(panel => {
                this.collisionDetector.removePanel(panel);
                this.panelResizer.unobservePanel(panel);
                panel.close();
            });
            this.activePanels.clear();
        }
        
        getPanelById(panelId) {
            return this.activePanels.get(panelId);
        }
        
        getAllPanels() {
            return Array.from(this.activePanels.values());
        }
        
        getExistingPanelPositions() {
            return Array.from(this.activePanels.values()).map(panel => {
                if (!panel.panel) return null;
                const rect = panel.panel.getBoundingClientRect();
                return {
                    x: rect.left,
                    y: rect.top,
                    width: rect.width,
                    height: rect.height
                };
            }).filter(pos => pos !== null);
        }
        
        repositionPanel(panel, newPosition) {
            if (panel.panel) {
                panel.panel.style.left = newPosition.x + 'px';
                panel.panel.style.top = newPosition.y + 'px';
                
                // Animate the repositioning
                this.visualEffects.animatePanel(panel, 'bounce');
            }
        }
        
        optimizeLayout() {
            // Recalculate positions for all panels to avoid overlaps
            const panels = this.getAllPanels();
            const newPositions = [];
            
            panels.forEach((panel, index) => {
                const existingPositions = newPositions;
                const optimalPosition = this.smartPositioner.calculateOptimalPosition(
                    existingPositions, 
                    panel.element, 
                    null
                );
                
                newPositions.push({
                    x: optimalPosition.x,
                    y: optimalPosition.y,
                    width: panel.panel.offsetWidth,
                    height: panel.panel.offsetHeight
                });
                
                this.repositionPanel(panel, optimalPosition);
            });
        }
    }

    // ========================================================================
    // 🎯 MODULE: Smart Positioning System
    // ========================================================================
    // 🎯 MODULE: Intelligent Positioning System
    // ========================================================================
    class SmartPositioner {
        constructor() {
            this.minDistance = 20; // Minimum distance between panels
            this.edgeBuffer = 16; // Distance from screen edges (reduced for better space usage)
            this.flipOffset = 10; // Offset when flipping position
            this.maxAttempts = 50; // Maximum positioning attempts
            
            // Enhanced positioning priorities
            this.positionStrategies = [
                'elementRelative',    // Relative to target element
                'preferred',          // User preferred position
                'intelligentFlip',    // Smart flipping algorithm
                'responsiveQuadrant', // Quadrant-based positioning
                'spiralSearch',       // Spiral search algorithm
                'emergencyCenter'     // Last resort center positioning
            ];
            
            // Constraints configuration
            this.constraints = {
                maxWidth: '90vw',
                maxHeight: 'calc(100vh - 32px)',
                minWidth: '280px',
                minHeight: '200px',
                zIndex: 999999
            };
            
            // Responsive breakpoints for adaptive positioning
            this.breakpoints = {
                mobile: 768,
                tablet: 1024,
                desktop: 1200
            };
        }

        /**
         * 🔍 VIEWPORT DETECTION - Detects panel overflow boundaries
         */
        detectBoundaries(panel) {
            const rect = panel.getBoundingClientRect();
            const viewport = {
                width: window.innerWidth,
                height: window.innerHeight
            };
            
            return {
                overflowRight: Math.max(0, rect.right - viewport.width),
                overflowBottom: Math.max(0, rect.bottom - viewport.height),
                overflowLeft: rect.left < 0 ? Math.abs(rect.left) : 0,
                overflowTop: rect.top < 0 ? Math.abs(rect.top) : 0,
                isOverflowing: rect.right > viewport.width || 
                              rect.bottom > viewport.height || 
                              rect.left < 0 || 
                              rect.top < 0,
                viewport: viewport,
                panelRect: rect
            };
        }

        /**
         * 🎯 MAIN POSITIONING ENGINE - Calculates optimal panel position
         */
        calculateOptimalPosition(existingPositions, targetElement, preferredPosition, options = {}) {
            const viewport = this.getViewportDimensions();
            const panelSize = this.getEstimatedPanelSize(targetElement, options);
            const elementRect = targetElement ? targetElement.getBoundingClientRect() : null;
            
            // Apply responsive constraints
            this.applyResponsiveConstraints(panelSize, viewport);
            
            console.log('🎯 Smart Positioning:', { viewport, panelSize, elementRect });
            
            // Try each positioning strategy in order
            for (const strategy of this.positionStrategies) {
                const position = this.executePositioningStrategy(
                    strategy,
                    { existingPositions, targetElement, elementRect, preferredPosition, viewport, panelSize, options }
                );
                
                if (position && this.validatePosition(position, viewport, panelSize, existingPositions)) {
                    console.log(`✅ Positioning success with strategy: ${strategy}`, position);
                    return this.finalizePosition(position, panelSize, viewport);
                }
            }
            
            // Emergency fallback
            console.warn('⚠️ All positioning strategies failed, using emergency center');
            return this.getEmergencyPosition(viewport, panelSize);
        }

        /**
         * 🔄 AUTO-POSITIONING - Execute specific positioning strategies
         */
        executePositioningStrategy(strategy, context) {
            const { existingPositions, targetElement, elementRect, preferredPosition, viewport, panelSize, options } = context;
            
            switch (strategy) {
                case 'elementRelative':
                    return elementRect ? this.calculateIntelligentFlipPosition(elementRect, panelSize, viewport) : null;
                    
                case 'preferred':
                    return preferredPosition ? this.adjustPositionForViewport(preferredPosition, viewport, panelSize) : null;
                    
                case 'intelligentFlip':
                    return elementRect ? this.calculateIntelligentFlipPosition(elementRect, panelSize, viewport) : null;
                    
                case 'responsiveQuadrant':
                    return this.calculateResponsiveQuadrantPosition(viewport, panelSize, existingPositions);
                    
                case 'spiralSearch':
                    return this.generateSpiralPosition(existingPositions, viewport, panelSize);
                    
                case 'emergencyCenter':
                    return this.getEmergencyPosition(viewport, panelSize);
                    
                default:
                    return null;
            }
        }

        /**
         * 🧠 INTELLIGENT FLIP POSITIONING - Smart horizontal/vertical flipping
         */
        calculateIntelligentFlipPosition(elementRect, panelSize, viewport) {
            const positions = [];
            
            // Primary positions (preferred order)
            const primaryPositions = [
                // Right side positions
                { 
                    x: elementRect.right + this.flipOffset, 
                    y: elementRect.top,
                    anchor: 'right-top'
                },
                { 
                    x: elementRect.right + this.flipOffset, 
                    y: elementRect.bottom - panelSize.height,
                    anchor: 'right-bottom'
                },
                
                // Left side positions
                { 
                    x: elementRect.left - panelSize.width - this.flipOffset, 
                    y: elementRect.top,
                    anchor: 'left-top'
                },
                { 
                    x: elementRect.left - panelSize.width - this.flipOffset, 
                    y: elementRect.bottom - panelSize.height,
                    anchor: 'left-bottom'
                },
                
                // Bottom positions
                { 
                    x: elementRect.left, 
                    y: elementRect.bottom + this.flipOffset,
                    anchor: 'bottom-left'
                },
                { 
                    x: elementRect.right - panelSize.width, 
                    y: elementRect.bottom + this.flipOffset,
                    anchor: 'bottom-right'
                },
                
                // Top positions
                { 
                    x: elementRect.left, 
                    y: elementRect.top - panelSize.height - this.flipOffset,
                    anchor: 'top-left'
                },
                { 
                    x: elementRect.right - panelSize.width, 
                    y: elementRect.top - panelSize.height - this.flipOffset,
                    anchor: 'top-right'
                }
            ];
            
            // Test each position and return the first valid one
            for (const pos of primaryPositions) {
                const adjustedPosition = this.adjustPositionForViewport(pos, viewport, panelSize);
                if (this.isPositionInViewport(adjustedPosition, viewport, panelSize)) {
                    adjustedPosition.anchor = pos.anchor;
                    return adjustedPosition;
                }
            }
            
            return null;
        }

        /**
         * 📱 RESPONSIVE QUADRANT POSITIONING - Device-adaptive positioning
         */
        calculateResponsiveQuadrantPosition(viewport, panelSize, existingPositions) {
            const deviceType = this.getDeviceType(viewport.width);
            const quadrants = this.getResponsiveQuadrants(viewport, panelSize, deviceType);
            
            // Try each quadrant
            for (const quadrant of quadrants) {
                if (!this.hasCollision(quadrant, existingPositions, panelSize)) {
                    return quadrant;
                }
            }
            
            return null;
        }

        /**
         * 📐 RESPONSIVE QUADRANTS - Generate device-specific positioning areas
         */
        getResponsiveQuadrants(viewport, panelSize, deviceType) {
            const padding = this.edgeBuffer;
            const centerX = viewport.width / 2;
            const centerY = viewport.height / 2;
            
            if (deviceType === 'mobile') {
                // Mobile: prefer top and center positions
                return [
                    { x: padding, y: padding }, // Top-left
                    { x: centerX - panelSize.width / 2, y: padding }, // Top-center
                    { x: viewport.width - panelSize.width - padding, y: padding }, // Top-right
                    { x: centerX - panelSize.width / 2, y: centerY - panelSize.height / 2 }, // Center
                ];
            } else if (deviceType === 'tablet') {
                // Tablet: balanced positioning
                return [
                    { x: viewport.width - panelSize.width - padding, y: padding }, // Top-right
                    { x: padding, y: padding }, // Top-left
                    { x: viewport.width - panelSize.width - padding, y: viewport.height - panelSize.height - padding }, // Bottom-right
                    { x: padding, y: viewport.height - panelSize.height - padding }, // Bottom-left
                    { x: centerX - panelSize.width / 2, y: centerY - panelSize.height / 2 }, // Center
                ];
            } else {
                // Desktop: prefer side positions
                return [
                    { x: viewport.width - panelSize.width - padding, y: padding }, // Top-right
                    { x: viewport.width - panelSize.width - padding, y: centerY - panelSize.height / 2 }, // Mid-right
                    { x: viewport.width - panelSize.width - padding, y: viewport.height - panelSize.height - padding }, // Bottom-right
                    { x: padding, y: padding }, // Top-left
                    { x: padding, y: centerY - panelSize.height / 2 }, // Mid-left
                    { x: centerX - panelSize.width / 2, y: centerY - panelSize.height / 2 }, // Center
                ];
            }
        }

        /**
         * 🌀 SPIRAL SEARCH - Advanced spiral positioning algorithm
         */
        generateSpiralPosition(existingPositions, viewport, panelSize) {
            const centerX = viewport.width / 2;
            const centerY = viewport.height / 2;
            
            let radius = 50;
            let angle = 0;
            const angleIncrement = Math.PI / 6; // 30 degrees
            const radiusIncrement = 30;
            
            for (let attempt = 0; attempt < this.maxAttempts; attempt++) {
                const x = centerX + radius * Math.cos(angle) - panelSize.width / 2;
                const y = centerY + radius * Math.sin(angle) - panelSize.height / 2;
                
                const position = { x, y };
                const adjusted = this.adjustPositionForViewport(position, viewport, panelSize);
                
                if (this.isPositionInViewport(adjusted, viewport, panelSize) && 
                    !this.hasCollision(adjusted, existingPositions, panelSize)) {
                    return adjusted;
                }
                
                angle += angleIncrement;
                if (angle >= Math.PI * 2) {
                    angle = 0;
                    radius += radiusIncrement;
                }
            }
            
            return null;
        }

        /**
         * 🎯 POSITION VALIDATION & ADJUSTMENT
         */
        validatePosition(position, viewport, panelSize, existingPositions) {
            return this.isPositionInViewport(position, viewport, panelSize) && 
                   !this.hasCollision(position, existingPositions, panelSize);
        }

        isPositionInViewport(position, viewport, panelSize) {
            return position.x >= 0 && 
                   position.y >= 0 && 
                   position.x + panelSize.width <= viewport.width && 
                   position.y + panelSize.height <= viewport.height;
        }

        adjustPositionForViewport(position, viewport, panelSize) {
            let x = typeof position.x === 'string' ? this.parseStringPosition(position.x, viewport.width, panelSize.width) : position.x;
            let y = typeof position.y === 'string' ? this.parseStringPosition(position.y, viewport.height, panelSize.height) : position.y;

            // Ensure within viewport bounds
            x = Math.max(this.edgeBuffer, Math.min(x, viewport.width - panelSize.width - this.edgeBuffer));
            y = Math.max(this.edgeBuffer, Math.min(y, viewport.height - panelSize.height - this.edgeBuffer));

            return { x, y };
        }

        parseStringPosition(value, containerSize, elementSize) {
            switch (value) {
                case 'center': return (containerSize - elementSize) / 2;
                case 'right': case 'bottom': return containerSize - elementSize - this.edgeBuffer;
                case 'left': case 'top': return this.edgeBuffer;
                default: return 0;
            }
        }

        /**
         * 🔍 COLLISION DETECTION
         */
        hasCollision(position, existingPositions, panelSize) {
            return existingPositions.some(existing => {
                const dx = Math.abs(position.x - existing.x);
                const dy = Math.abs(position.y - existing.y);
                
                return dx < (panelSize.width + this.minDistance) && 
                       dy < (panelSize.height + this.minDistance);
            });
        }

        /**
         * ⚡ RESPONSIVE CONSTRAINTS & ADAPTATION
         */
        applyResponsiveConstraints(panelSize, viewport) {
            const deviceType = this.getDeviceType(viewport.width);
            
            // Apply max-width and max-height constraints
            const maxWidth = viewport.width * 0.9; // 90vw
            const maxHeight = viewport.height - 32; // calc(100vh - 32px)
            
            panelSize.width = Math.min(panelSize.width, maxWidth);
            panelSize.height = Math.min(panelSize.height, maxHeight);
            
            // Device-specific adjustments
            if (deviceType === 'mobile') {
                panelSize.width = Math.min(panelSize.width, viewport.width - 20);
                panelSize.height = Math.min(panelSize.height, viewport.height * 0.8);
            }
        }

        getDeviceType(width) {
            if (width <= this.breakpoints.mobile) return 'mobile';
            if (width <= this.breakpoints.tablet) return 'tablet';
            return 'desktop';
        }

        /**
         * 🛡️ EMERGENCY & UTILITY FUNCTIONS
         */
        getEmergencyPosition(viewport, panelSize) {
            return {
                x: Math.max(this.edgeBuffer, (viewport.width - panelSize.width) / 2),
                y: Math.max(this.edgeBuffer, (viewport.height - panelSize.height) / 2)
            };
        }

        finalizePosition(position, panelSize, viewport) {
            // Apply final constraints and return position with styles
            return {
                x: position.x,
                y: position.y,
                anchor: position.anchor || 'auto',
                constraints: this.constraints,
                styles: this.generatePositionStyles(position, panelSize)
            };
        }

        generatePositionStyles(position, panelSize) {
            return {
                position: 'fixed',
                left: `${position.x}px`,
                top: `${position.y}px`,
                maxWidth: this.constraints.maxWidth,
                maxHeight: this.constraints.maxHeight,
                minWidth: this.constraints.minWidth,
                minHeight: this.constraints.minHeight,
                zIndex: this.constraints.zIndex,
                overflow: 'auto'
            };
        }

        // Legacy compatibility methods
        calculateRelativePosition(elementRect, panelSize, viewport) {
            return this.calculateIntelligentFlipPosition(elementRect, panelSize, viewport) ||
                   this.getEmergencyPosition(viewport, panelSize);
        }

        getViewportDimensions() {
            return {
                width: window.innerWidth,
                height: window.innerHeight
            };
        }

        getEstimatedPanelSize(targetElement, options = {}) {
            // Try to get size from existing panels
            const existingPanel = document.querySelector('.mas-micro-panel');
            if (existingPanel) {
                const rect = existingPanel.getBoundingClientRect();
                return {
                    width: rect.width || 320,
                    height: rect.height || 400
                };
            }
            
            // Responsive default sizes
            const viewport = this.getViewportDimensions();
            const deviceType = this.getDeviceType(viewport.width);
            
            if (deviceType === 'mobile') {
                return { width: Math.min(300, viewport.width - 40), height: 350 };
            } else if (deviceType === 'tablet') {
                return { width: 340, height: 400 };
            } else {
                return { width: 380, height: 450 };
            }
        }

        /**
         * 🔄 REAL-TIME REPOSITIONING - For dynamic panels
         */
        repositionPanelIfNeeded(panel) {
            const boundaries = this.detectBoundaries(panel);
            
            if (boundaries.isOverflowing) {
                console.log('🔄 Panel overflow detected, repositioning...', boundaries);
                
                const rect = panel.getBoundingClientRect();
                const viewport = boundaries.viewport;
                const panelSize = { width: rect.width, height: rect.height };
                
                // Calculate new position
                let newX = rect.left;
                let newY = rect.top;
                
                // Fix horizontal overflow
                if (boundaries.overflowRight > 0) {
                    newX = viewport.width - panelSize.width - this.edgeBuffer;
                } else if (boundaries.overflowLeft > 0) {
                    newX = this.edgeBuffer;
                }
                
                // Fix vertical overflow
                if (boundaries.overflowBottom > 0) {
                    newY = viewport.height - panelSize.height - this.edgeBuffer;
                } else if (boundaries.overflowTop > 0) {
                    newY = this.edgeBuffer;
                }
                
                // Apply new position
                const styles = this.generatePositionStyles({ x: newX, y: newY }, panelSize);
                Object.assign(panel.style, styles);
                
                console.log('✅ Panel repositioned to:', { x: newX, y: newY });
                return true;
            }
            
            return false;
        }
    }

    // ========================================================================
    // 🔍 MODULE: Collision Detection System
    // ========================================================================
    class CollisionDetector {
        constructor() {
            this.monitoringInterval = null;
            this.updateInterval = 200; // Check every 200ms
            this.isMonitoring = false;
            this.panels = new Set();
        }

        startMonitoring() {
            if (this.isMonitoring) return;
            
            this.isMonitoring = true;
            this.monitoringInterval = setInterval(() => {
                this.checkCollisions();
            }, this.updateInterval);
        }

        stopMonitoring() {
            if (this.monitoringInterval) {
                clearInterval(this.monitoringInterval);
                this.monitoringInterval = null;
                this.isMonitoring = false;
            }
        }

        addPanel(panel) {
            this.panels.add(panel);
            if (!this.isMonitoring) {
                this.startMonitoring();
            }
        }

        removePanel(panel) {
            this.panels.delete(panel);
            if (this.panels.size === 0) {
                this.stopMonitoring();
            }
        }

        checkCollisions() {
            const panelArray = Array.from(this.panels);
            
            for (let i = 0; i < panelArray.length; i++) {
                for (let j = i + 1; j < panelArray.length; j++) {
                    const panel1 = panelArray[i];
                    const panel2 = panelArray[j];
                    
                    if (this.areColliding(panel1, panel2)) {
                        this.resolveCollision(panel1, panel2);
                    }
                }
            }
        }

        areColliding(panel1, panel2) {
            if (!panel1.panel || !panel2.panel) return false;
            
            const rect1 = panel1.panel.getBoundingClientRect();
            const rect2 = panel2.panel.getBoundingClientRect();
            
            return !(rect1.right < rect2.left || 
                     rect1.left > rect2.right || 
                     rect1.bottom < rect2.top || 
                     rect1.top > rect2.bottom);
        }

        resolveCollision(panel1, panel2) {
            // Move the panel with higher z-index or the more recently created one
            const z1 = parseInt(panel1.panel.style.zIndex) || 0;
            const z2 = parseInt(panel2.panel.style.zIndex) || 0;
            
            const panelToMove = z1 >= z2 ? panel1 : panel2;
            this.movePanel(panelToMove);
        }

        movePanel(panel) {
            const rect = panel.panel.getBoundingClientRect();
            const viewport = { width: window.innerWidth, height: window.innerHeight };
            
            // Calculate movement direction (spiral outward)
            const centerX = viewport.width / 2;
            const centerY = viewport.height / 2;
            const panelCenterX = rect.left + rect.width / 2;
            const panelCenterY = rect.top + rect.height / 2;
            
            const dx = panelCenterX - centerX;
            const dy = panelCenterY - centerY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 0) {
                const moveDistance = 60;
                const moveX = (dx / distance) * moveDistance;
                const moveY = (dy / distance) * moveDistance;
                
                let newX = rect.left + moveX;
                let newY = rect.top + moveY;
                
                // Ensure within viewport bounds
                newX = Math.max(50, Math.min(newX, viewport.width - rect.width - 50));
                newY = Math.max(50, Math.min(newY, viewport.height - rect.height - 50));
                
                panel.panel.style.left = newX + 'px';
                panel.panel.style.top = newY + 'px';
            }
        }
    }

    // ========================================================================
    // 📏 MODULE: Panel Resizer System
    // ========================================================================
    class PanelResizer {
        constructor() {
            this.minWidth = 280;
            this.maxWidth = 500;
            this.minHeight = 200;
            this.maxHeight = window.innerHeight * 0.8;
            this.resizeObserver = null;
            this.observers = new WeakMap();
        }

        initializeObserver() {
            if (window.ResizeObserver && !this.resizeObserver) {
                this.resizeObserver = new ResizeObserver((entries) => {
                    entries.forEach(entry => {
                        const panel = this.observers.get(entry.target);
                        if (panel) {
                            this.handleResize(panel, entry);
                        }
                    });
                });
            }
        }

        observePanel(panel) {
            this.initializeObserver();
            if (this.resizeObserver && panel.panel) {
                this.resizeObserver.observe(panel.panel);
                this.observers.set(panel.panel, panel);
            }
        }

        unobservePanel(panel) {
            if (this.resizeObserver && panel.panel) {
                this.resizeObserver.unobserve(panel.panel);
                this.observers.delete(panel.panel);
            }
        }

        handleResize(panel, entry) {
            const { width, height } = entry.contentRect;
            
            // Get content size
            const contentSize = this.getContentSize(panel.panel);
            
            // Calculate optimal size
            const optimalWidth = Math.max(this.minWidth, 
                Math.min(contentSize.width + 48, this.maxWidth));
            const optimalHeight = Math.max(this.minHeight, 
                Math.min(contentSize.height + 100, this.maxHeight));
            
            // Apply size if different from current
            if (Math.abs(width - optimalWidth) > 10 || Math.abs(height - optimalHeight) > 10) {
                this.applySize(panel, optimalWidth, optimalHeight);
            }
        }

        applySize(panel, width, height) {
            panel.panel.style.width = width + 'px';
            panel.panel.style.height = height + 'px';
            
            // Ensure panel stays within viewport
            this.ensureViewportBounds(panel);
        }

        ensureViewportBounds(panel) {
            const rect = panel.panel.getBoundingClientRect();
            const viewport = { width: window.innerWidth, height: window.innerHeight };
            
            let newX = rect.left;
            let newY = rect.top;
            let needsUpdate = false;
            
            // Check horizontal bounds
            if (rect.right > viewport.width) {
                newX = viewport.width - rect.width - 20;
                needsUpdate = true;
            }
            if (rect.left < 0) {
                newX = 20;
                needsUpdate = true;
            }
            
            // Check vertical bounds
            if (rect.bottom > viewport.height) {
                newY = viewport.height - rect.height - 20;
                needsUpdate = true;
            }
            if (rect.top < 0) {
                newY = 20;
                needsUpdate = true;
            }
            
            if (needsUpdate) {
                panel.panel.style.left = newX + 'px';
                panel.panel.style.top = newY + 'px';
            }
        }

        getContentSize(panelElement) {
            const content = panelElement.querySelector('.mas-panel-content');
            if (!content) return { width: 0, height: 0 };
            
            // Temporarily remove constraints to measure natural size
            const originalMaxHeight = content.style.maxHeight;
            const originalOverflow = content.style.overflow;
            
            content.style.maxHeight = 'none';
            content.style.overflow = 'visible';
            
            const size = {
                width: content.scrollWidth,
                height: content.scrollHeight
            };
            
            // Restore constraints
            content.style.maxHeight = originalMaxHeight;
            content.style.overflow = originalOverflow;
            
            return size;
        }

        getResponsiveSize() {
            const viewport = { width: window.innerWidth, height: window.innerHeight };
            
            if (viewport.width < 768) {
                return {
                    width: Math.min(viewport.width - 40, 300),
                    height: Math.min(viewport.height - 100, 500)
                };
            } else if (viewport.width < 1024) {
                return {
                    width: Math.min(viewport.width - 60, 350),
                    height: Math.min(viewport.height - 120, 600)
                };
            } else {
                return {
                    width: Math.min(viewport.width - 80, 400),
                    height: Math.min(viewport.height - 150, 700)
                };
            }
        }
    }

    // ========================================================================
    // 🎨 MODULE: Enhanced Visual Effects
    // ========================================================================
    class VisualEffects {
        constructor() {
            this.activeAnimations = new Map();
            this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        }

        animatePanel(panel, type = 'slideIn') {
            if (this.prefersReducedMotion) {
                // Skip animations for users who prefer reduced motion
                return Promise.resolve();
            }

            const element = panel.panel;
            const animationId = `${panel.id}-${type}`;
            
            // Cancel existing animation
            if (this.activeAnimations.has(animationId)) {
                this.activeAnimations.get(animationId).cancel();
            }

            const animation = this.createAnimation(element, type);
            this.activeAnimations.set(animationId, animation);
            
            return animation.finished.then(() => {
                this.activeAnimations.delete(animationId);
            });
        }

        createAnimation(element, type) {
            const animations = {
                slideIn: [
                    { 
                        opacity: 0, 
                        transform: 'translateY(30px) scale(0.9) rotateX(10deg)',
                        filter: 'blur(4px)' 
                    },
                    { 
                        opacity: 0.8, 
                        transform: 'translateY(10px) scale(0.98) rotateX(3deg)',
                        filter: 'blur(1px)' 
                    },
                    { 
                        opacity: 1, 
                        transform: 'translateY(0) scale(1) rotateX(0deg)',
                        filter: 'blur(0)' 
                    }
                ],
                slideOut: [
                    { 
                        opacity: 1, 
                        transform: 'translateY(0) scale(1) rotateX(0deg)',
                        filter: 'blur(0)' 
                    },
                    { 
                        opacity: 0, 
                        transform: 'translateY(-20px) scale(0.95) rotateX(-5deg)',
                        filter: 'blur(2px)' 
                    }
                ],
                bounce: [
                    { transform: 'scale(1)' },
                    { transform: 'scale(1.05)' },
                    { transform: 'scale(1)' }
                ]
            };

            const keyframes = animations[type] || animations.slideIn;
            const options = {
                duration: type === 'slideOut' ? 350 : 500,
                easing: 'cubic-bezier(0.19, 1, 0.22, 1)',
                fill: 'both'
            };

            return element.animate(keyframes, options);
        }

        addHoverEffect(element) {
            if (this.prefersReducedMotion) return;

            element.addEventListener('mouseenter', () => {
                element.style.transform = 'translateY(-2px) scale(1.02)';
                element.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.25)';
            });

            element.addEventListener('mouseleave', () => {
                element.style.transform = '';
                element.style.boxShadow = '';
            });
        }

        createRippleEffect(element, event) {
            if (this.prefersReducedMotion) return;

            const rect = element.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;

            const ripple = document.createElement('span');
            ripple.className = 'mas-ripple';
            ripple.style.left = x + 'px';
            ripple.style.top = y + 'px';

            element.appendChild(ripple);

            setTimeout(() => {
                ripple.remove();
            }, 1000);
        }
    }

    // ========================================================================
    // 📱 MODULE: MicroPanel (Individual panel)
    // ========================================================================
    class MicroPanel {
        constructor(element, config, liveEditMode, options = {}) {
            this.id = 'panel-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
            this.element = element;
            this.config = config;
            this.liveEditMode = liveEditMode;
            this.panel = null;
            this.isVisible = false;
            this.position = options.position || { x: 50, y: 50 };
            this.zIndex = options.zIndex || 99999;
            this.factory = options.factory;
            this.dragOffset = { x: 0, y: 0 };
            this.isDragging = false;
            
            this.create();
        }
        
        create() {
            this.panel = document.createElement('div');
            this.panel.id = this.id;
            this.panel.className = 'mas-micro-panel';
            this.panel.dataset.category = this.config.category;
            
            this.panel.innerHTML = this.generatePanelHTML();
            
            document.body.appendChild(this.panel);
            this.position();
            this.setupEventListeners();
            this.show();
        }
        
        generatePanelHTML() {
            let content = `
                <div class="mas-panel-header">
                    <h4>
                        <span class="dashicons dashicons-${this.config.icon}"></span>
                        ${this.config.title}
                    </h4>
                    <button class="mas-panel-close" type="button">
                        <span class="dashicons dashicons-no-alt"></span>
                    </button>
                </div>
                <div class="mas-panel-content">
            `;

            // Group options by section
            const sections = {};
            this.config.options.forEach(option => {
                const section = option.section || 'General';
                if (!sections[section]) sections[section] = [];
                sections[section].push(option);
            });

            // Render sections
            Object.entries(sections).forEach(([sectionName, options]) => {
                content += `<div class="mas-section">
                    <h5>${sectionName}</h5>
                    <div class="mas-controls">`;
                
                options.forEach(option => {
                    content += this.createControlHTML(option);
                });
                
                content += `</div></div>`;
            });

            content += '</div>';
            
            return content;
        }
        
        createControlHTML(option) {
            const currentValue = this.getCurrentValue(option);
            const resetBtn = `<button type="button" class="mas-reset-btn" data-reset-for="${option.id}" title="Reset to default">↺</button>`;
            
            switch (option.type) {
                case 'color':
                    return `
                        <div class="mas-control mas-control-color" data-option-id="${option.id}">
                            <label>${option.label}</label>
                            <input type="color" 
                                   value="${currentValue}" 
                                   data-css-var="${option.cssVar}"
                                   data-option-id="${option.id}"
                                   data-unit="${option.unit || ''}"
                            />
                            ${resetBtn}
                        </div>
                    `;
                    
                case 'slider':
                    return `
                        <div class="mas-control mas-control-slider" data-option-id="${option.id}">
                            <label>${option.label}</label>
                            <div class="slider-container">
                                <input type="range" 
                                       min="${option.min}" 
                                       max="${option.max}" 
                                       value="${currentValue}"
                                       data-css-var="${option.cssVar}"
                                       data-option-id="${option.id}"
                                       data-unit="${option.unit || ''}"
                                />
                                <span class="mas-value">${currentValue}${option.unit || ''}</span>
                            </div>
                            ${resetBtn}
                        </div>
                    `;
                    
                case 'toggle':
                    return `
                        <div class="mas-control mas-control-toggle" data-option-id="${option.id}">
                            <label>${option.label}</label>
                            <input type="checkbox" 
                                   ${currentValue ? 'checked' : ''}
                                   data-css-var="${option.cssVar}"
                                   data-option-id="${option.id}"
                            />
                            ${resetBtn}
                        </div>
                    `;
                    
                default:
                    return `
                        <div class="mas-control mas-control-text" data-option-id="${option.id}">
                            <label>${option.label}</label>
                            <input type="text" 
                                   value="${currentValue}" 
                                   data-css-var="${option.cssVar}"
                                   data-option-id="${option.id}"
                                   data-unit="${option.unit || ''}"
                            />
                            ${resetBtn}
                        </div>
                    `;
            }
        }
        
        getCurrentValue(option) {
            // Try to get value from various sources
            if (this.liveEditMode && this.liveEditMode.settingsCache && this.liveEditMode.settingsCache.has(option.id)) {
                return this.liveEditMode.settingsCache.get(option.id);
            }
            
            // Check localStorage
            try {
                const saved = localStorage.getItem('mas_live_edit_settings');
                if (saved) {
                    const settings = JSON.parse(saved);
                    if (settings[option.id] !== undefined) {
                        return settings[option.id];
                    }
                }
            } catch (error) {
                console.error('Error reading from localStorage', error);
            }
            
            // Return default
            return option.default || '';
        }
        
        position() {
            if (!this.panel) return;
            
            // Use intelligent positioning system
            if (this.factory && this.factory.smartPositioner) {
                const existingPositions = this.factory.getExistingPanelPositions().filter(pos => pos.id !== this.id);
                
                // Calculate optimal position using intelligent positioning
                const optimalPosition = this.factory.smartPositioner.calculateOptimalPosition(
                    existingPositions, 
                    this.element, 
                    this.position, 
                    {
                        panelId: this.id,
                        category: this.config.category,
                        size: this.getEstimatedSize()
                    }
                );
                
                if (optimalPosition) {
                    // Apply positioning styles with constraints
                    const styles = optimalPosition.styles || this.factory.smartPositioner.generatePositionStyles(optimalPosition, this.getEstimatedSize());
                    Object.assign(this.panel.style, styles);
                    
                    // Update position data
                    this.position = { x: optimalPosition.x, y: optimalPosition.y };
                    this.panel.dataset.anchor = optimalPosition.anchor || 'auto';
                    
                    console.log(`🎯 Panel ${this.id} positioned at:`, this.position, 'with anchor:', optimalPosition.anchor);
                } else {
                    console.warn('⚠️ Failed to calculate optimal position, using fallback');
                    this.applyFallbackPosition();
                }
            } else {
                // Fallback to simple positioning
                console.warn('⚠️ SmartPositioner not available, using fallback');
                this.applyFallbackPosition();
            }
            
            // Store position data for tracking
            this.panel.dataset.panelId = this.id;
            this.panel.dataset.positionX = this.position.x;
            this.panel.dataset.positionY = this.position.y;
            
            // Set up real-time repositioning observer
            this.setupPositionObserver();
        }

        applyFallbackPosition() {
            // Simple fallback positioning with constraints
            this.panel.style.position = 'fixed';
            this.panel.style.left = Math.max(16, this.position.x) + 'px';
            this.panel.style.top = Math.max(16, this.position.y) + 'px';
            this.panel.style.maxWidth = '90vw';
            this.panel.style.maxHeight = 'calc(100vh - 32px)';
            this.panel.style.zIndex = '999999';
            this.panel.style.overflow = 'auto';
        }

        getEstimatedSize() {
            if (this.panel) {
                const rect = this.panel.getBoundingClientRect();
                return { width: rect.width || 380, height: rect.height || 450 };
            }
            return { width: 380, height: 450 };
        }

        setupPositionObserver() {
            // Monitor for viewport changes and repositioning needs
            if (this.factory && this.factory.smartPositioner) {
                this.repositionObserver = setInterval(() => {
                    if (this.panel && this.isVisible) {
                        this.factory.smartPositioner.repositionPanelIfNeeded(this.panel);
                    }
                }, 1000); // Check every second
            }
        }
        
        updatePosition(newPosition) {
            this.position = newPosition;
            this.position();
        }
        
        setupDragFunctionality() {
            const header = this.panel.querySelector('.mas-panel-header');
            if (!header) return;
            
            header.style.cursor = 'move';
            
            const handleMouseDown = (e) => {
                if (e.target.closest('.mas-panel-close')) return;
                
                this.isDragging = true;
                const rect = this.panel.getBoundingClientRect();
                this.dragOffset.x = e.clientX - rect.left;
                this.dragOffset.y = e.clientY - rect.top;
                
                this.panel.style.userSelect = 'none';
                this.panel.style.pointerEvents = 'none';
                document.body.style.cursor = 'move';
                
                document.addEventListener('mousemove', handleMouseMove);
                document.addEventListener('mouseup', handleMouseUp);
                
                e.preventDefault();
            };
            
            const handleMouseMove = (e) => {
                if (!this.isDragging) return;
                
                const newX = e.clientX - this.dragOffset.x;
                const newY = e.clientY - this.dragOffset.y;
                
                // Use intelligent positioning constraints
                const viewport = { width: window.innerWidth, height: window.innerHeight };
                const rect = this.panel.getBoundingClientRect();
                const panelSize = { width: rect.width, height: rect.height };
                
                let constrainedX = newX;
                let constrainedY = newY;
                
                // Apply intelligent constraints
                if (this.factory && this.factory.smartPositioner) {
                    const edgeBuffer = this.factory.smartPositioner.edgeBuffer;
                    
                    // Apply max dimensions constraints
                    const maxWidth = viewport.width * 0.9; // 90vw
                    const maxHeight = viewport.height - 32; // calc(100vh - 32px)
                    
                    constrainedX = Math.max(edgeBuffer, Math.min(newX, viewport.width - Math.min(panelSize.width, maxWidth) - edgeBuffer));
                    constrainedY = Math.max(edgeBuffer, Math.min(newY, viewport.height - Math.min(panelSize.height, maxHeight) - edgeBuffer));
                } else {
                    // Fallback constraints
                    constrainedX = Math.max(16, Math.min(newX, viewport.width - rect.width - 16));
                    constrainedY = Math.max(16, Math.min(newY, viewport.height - rect.height - 16));
                }
                
                this.updatePosition({ x: constrainedX, y: constrainedY });
                
                e.preventDefault();
            };
            
            const handleMouseUp = () => {
                this.isDragging = false;
                this.panel.style.userSelect = '';
                this.panel.style.pointerEvents = '';
                document.body.style.cursor = '';
                
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
                
                // Check for collisions after drag
                if (this.factory && this.factory.collisionDetector) {
                    this.factory.collisionDetector.checkCollisions();
                }
            };
            
            header.addEventListener('mousedown', handleMouseDown);
        }
        
        setupEventListeners() {
            // Close button
            const closeBtn = this.panel.querySelector('.mas-panel-close');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => this.close());
            }
            
            // Control changes
            this.panel.addEventListener('input', (e) => {
                if (e.target.matches('[data-option-id]')) {
                    this.handleControlChange(e);
                }
            });
            
            this.panel.addEventListener('change', (e) => {
                if (e.target.matches('[data-option-id]')) {
                    this.handleControlChange(e);
                }
            });
            
            // Reset buttons
            this.panel.addEventListener('click', (e) => {
                if (e.target.classList.contains('mas-reset-btn')) {
                    this.handleReset(e);
                }
            });
            
            // Close on Escape key
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this.isVisible) {
                    this.close();
                }
            });
            
            // Setup drag functionality
            this.setupDragFunctionality();
            
            // Add enhanced visual feedback
            this.addAdvancedInteractions();
        }
        
        addAdvancedInteractions() {
            // Add ripple effect to buttons
            const buttons = this.panel.querySelectorAll('button, .mas-control input, .mas-reset-btn');
            buttons.forEach(button => {
                button.addEventListener('click', (e) => {
                    if (this.factory && this.factory.visualEffects) {
                        this.factory.visualEffects.createRippleEffect(button, e);
                    }
                });
            });
            
            // Add focus management for better accessibility
            this.setupFocusManagement();
            
            // Add auto-resize based on content
            this.setupAutoResize();
        }
        
        setupFocusManagement() {
            const focusableElements = this.panel.querySelectorAll(
                'button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            
            if (focusableElements.length > 0) {
                // Focus first element when panel opens
                setTimeout(() => {
                    focusableElements[0].focus();
                }, 100);
                
                // Trap focus within panel
                this.panel.addEventListener('keydown', (e) => {
                    if (e.key === 'Tab') {
                        const firstElement = focusableElements[0];
                        const lastElement = focusableElements[focusableElements.length - 1];
                        
                        if (e.shiftKey) {
                            if (document.activeElement === firstElement) {
                                lastElement.focus();
                                e.preventDefault();
                            }
                        } else {
                            if (document.activeElement === lastElement) {
                                firstElement.focus();
                                e.preventDefault();
                            }
                        }
                    }
                });
            }
        }
        
        setupAutoResize() {
            // Observe content changes and adjust panel size
            if (window.MutationObserver) {
                const observer = new MutationObserver((mutations) => {
                    let needsResize = false;
                    mutations.forEach(mutation => {
                        if (mutation.type === 'childList' || mutation.type === 'attributes') {
                            needsResize = true;
                        }
                    });
                    
                    if (needsResize && this.factory && this.factory.panelResizer) {
                        setTimeout(() => {
                            this.factory.panelResizer.handleResize(this, {
                                contentRect: this.panel.getBoundingClientRect()
                            });
                        }, 100);
                    }
                });
                
                observer.observe(this.panel.querySelector('.mas-panel-content'), {
                    childList: true,
                    subtree: true,
                    attributes: true,
                    attributeFilter: ['style', 'class']
                });
                
                this.contentObserver = observer;
            }
        }
        
        handleControlChange(e) {
            const target = e.target;
            const optionId = target.dataset.optionId;
            const cssVar = target.dataset.cssVar;
            const unit = target.dataset.unit || '';
            
            let value = target.value;
            if (target.type === 'checkbox') {
                value = target.checked;
            }
            
            // Apply CSS variable immediately
            if (cssVar) {
                const cssValue = target.type === 'checkbox' ? (value ? '1' : '0') : value + unit;
                document.documentElement.style.setProperty(cssVar, cssValue);
            }
            
            // Update value display for sliders
            const valueDisplay = target.parentElement.querySelector('.mas-value');
            if (valueDisplay && target.type === 'range') {
                valueDisplay.textContent = value + unit;
            }
            
            // Save to settings if available
            if (this.liveEditMode && typeof this.liveEditMode.saveSetting === 'function') {
                this.liveEditMode.saveSetting(optionId, value);
            }
            
            // Show toast notification
            if (window.UnifiedLiveEdit.MASToast) {
                window.UnifiedLiveEdit.MASToast.success(`Updated ${optionId}`, 2000);
            }
        }
        
        handleReset(e) {
            const resetBtn = e.target;
            const optionId = resetBtn.dataset.resetFor;
            const control = this.panel.querySelector(`[data-option-id="${optionId}"]`);
            
            if (control) {
                // Find the option config
                const option = this.config.options.find(opt => opt.id === optionId);
                if (option && option.default !== undefined) {
                    if (control.type === 'checkbox') {
                        control.checked = option.default;
                    } else {
                        control.value = option.default;
                    }
                    
                    // Trigger change event to update styles
                    control.dispatchEvent(new Event('change', { bubbles: true }));
                }
            }
        }
        
        show() {
            this.panel.classList.add('mas-panel-visible');
            this.isVisible = true;
            
            // Emit event for undo/redo system
            document.dispatchEvent(new CustomEvent('mas:panel-created', {
                detail: {
                    panelId: this.panelId,
                    config: this.config
                }
            }));
        }
        
        close() {
            if (this.panel) {
                this.panel.classList.add('mas-panel-closing');
                
                // Emit event for undo/redo system
                document.dispatchEvent(new CustomEvent('mas:panel-closed', {
                    detail: {
                        panelId: this.panelId,
                        config: this.config
                    }
                }));
                
                // Clean up observers
                if (this.contentObserver) {
                    this.contentObserver.disconnect();
                    this.contentObserver = null;
                }
                
                // Clean up positioning observer
                if (this.repositionObserver) {
                    clearInterval(this.repositionObserver);
                    this.repositionObserver = null;
                }
                
                setTimeout(() => {
                    if (this.panel && this.panel.parentNode) {
                        this.panel.parentNode.removeChild(this.panel);
                    }
                    this.isVisible = false;
                }, 300);
            }
        }
    }

    // ========================================================================
    // 🔄 MODULE: Advanced Undo/Redo System
    // ========================================================================
    class UndoRedoManager {
        constructor() {
            this.history = [];
            this.currentIndex = -1;
            this.maxHistorySize = 50;
            this.isRecording = true;
            this.batchOperations = [];
            this.batchTimeout = null;
            this.batchDelay = 500; // Group operations within 500ms
            this.snapshots = new Map();
            this.actionTypes = {
                CSS_CHANGE: 'css_change',
                SETTING_CHANGE: 'setting_change',
                PANEL_OPERATION: 'panel_operation',
                BATCH_OPERATION: 'batch_operation',
                PRESET_APPLICATION: 'preset_application'
            };
        }

        init() {
            this.setupKeyboardShortcuts();
            this.createUI();
            this.bindEvents();
        }

        // Record a new action
        recordAction(type, data, description = '') {
            if (!this.isRecording) return;

            const action = {
                id: this.generateActionId(),
                type,
                timestamp: Date.now(),
                description: description || this.generateDescription(type, data),
                data: this.cloneData(data),
                snapshot: this.createSnapshot()
            };

            // Handle batching for rapid consecutive actions
            if (this.shouldBatch(type)) {
                this.addToBatch(action);
                return;
            }

            this.addToHistory(action);
        }

        shouldBatch(type) {
            const batchableTypes = [
                this.actionTypes.CSS_CHANGE,
                this.actionTypes.SETTING_CHANGE
            ];
            return batchableTypes.includes(type);
        }

        addToBatch(action) {
            this.batchOperations.push(action);
            
            // Clear existing timeout
            if (this.batchTimeout) {
                clearTimeout(this.batchTimeout);
            }

            // Set new timeout to finalize batch
            this.batchTimeout = setTimeout(() => {
                this.finalizeBatch();
            }, this.batchDelay);
        }

        finalizeBatch() {
            if (this.batchOperations.length === 0) return;

            if (this.batchOperations.length === 1) {
                // Single operation, add normally
                this.addToHistory(this.batchOperations[0]);
            } else {
                // Multiple operations, create batch
                const batchAction = {
                    id: this.generateActionId(),
                    type: this.actionTypes.BATCH_OPERATION,
                    timestamp: Date.now(),
                    description: `Batch of ${this.batchOperations.length} operations`,
                    data: {
                        operations: [...this.batchOperations]
                    },
                    snapshot: this.createSnapshot()
                };
                this.addToHistory(batchAction);
            }

            this.batchOperations = [];
            this.batchTimeout = null;
        }

        addToHistory(action) {
            // Remove future actions if we're not at the end
            if (this.currentIndex < this.history.length - 1) {
                this.history = this.history.slice(0, this.currentIndex + 1);
            }

            // Add new action
            this.history.push(action);
            this.currentIndex = this.history.length - 1;

            // Limit history size
            if (this.history.length > this.maxHistorySize) {
                this.history.shift();
                this.currentIndex--;
            }

            this.updateUI();
            this.notifyHistoryChange();
        }

        undo() {
            if (!this.canUndo()) return false;

            // Finalize any pending batch first
            this.finalizeBatch();

            const action = this.history[this.currentIndex];
            
            try {
                this.restoreSnapshot(action.snapshot.before);
                this.currentIndex--;
                this.updateUI();
                this.showUndoToast(action);
                this.notifyHistoryChange();
                return true;
            } catch (error) {
                console.error('Undo failed:', error);
                this.showErrorToast('Undo operation failed');
                return false;
            }
        }

        redo() {
            if (!this.canRedo()) return false;

            this.currentIndex++;
            const action = this.history[this.currentIndex];
            
            try {
                this.restoreSnapshot(action.snapshot.after);
                this.updateUI();
                this.showRedoToast(action);
                this.notifyHistoryChange();
                return true;
            } catch (error) {
                console.error('Redo failed:', error);
                this.currentIndex--;
                this.showErrorToast('Redo operation failed');
                return false;
            }
        }

        canUndo() {
            return this.currentIndex >= 0;
        }

        canRedo() {
            return this.currentIndex < this.history.length - 1;
        }

        createSnapshot() {
            return {
                before: this.captureCurrentState(),
                after: null // Will be filled when action is complete
            };
        }

        captureCurrentState() {
            const state = {
                timestamp: Date.now(),
                cssVariables: this.getCSSVariables(),
                settings: this.getCurrentSettings(),
                panelStates: this.getPanelStates(),
                bodyClasses: Array.from(document.body.classList),
                customStyles: this.getCustomStyles()
            };

            return this.compressState(state);
        }

        getCSSVariables() {
            const variables = {};
            const styles = getComputedStyle(document.documentElement);
            
            // Get all CSS custom properties
            for (const property of styles) {
                if (property.startsWith('--')) {
                    variables[property] = styles.getPropertyValue(property);
                }
            }

            return variables;
        }

        getCurrentSettings() {
            const settings = {};
            
            // Get from localStorage
            try {
                const saved = localStorage.getItem('mas_live_edit_settings');
                if (saved) {
                    Object.assign(settings, JSON.parse(saved));
                }
            } catch (error) {
                console.warn('Failed to get settings from localStorage:', error);
            }

            // Get from current form if available
            const form = document.querySelector('#woow-customizer-form');
            if (form) {
                const formData = new FormData(form);
                for (const [key, value] of formData.entries()) {
                    settings[key] = value;
                }
            }

            return settings;
        }

        getPanelStates() {
            const panels = [];
            document.querySelectorAll('.mas-micro-panel').forEach(panel => {
                panels.push({
                    id: panel.dataset.panelId,
                    position: {
                        x: parseInt(panel.style.left),
                        y: parseInt(panel.style.top)
                    },
                    size: {
                        width: panel.offsetWidth,
                        height: panel.offsetHeight
                    },
                    visible: panel.style.display !== 'none'
                });
            });
            return panels;
        }

        getCustomStyles() {
            const styles = {};
            
            // Get inline styles from key elements
            const elements = document.querySelectorAll('[style*="--"]');
            elements.forEach((el, index) => {
                styles[`element_${index}`] = {
                    selector: this.getElementSelector(el),
                    style: el.getAttribute('style')
                };
            });

            return styles;
        }

        restoreSnapshot(snapshot) {
            if (!snapshot) return;

            const state = this.decompressState(snapshot);
            
            // Restore CSS variables
            Object.entries(state.cssVariables).forEach(([property, value]) => {
                document.documentElement.style.setProperty(property, value);
            });

            // Restore settings
            this.restoreSettings(state.settings);

            // Restore body classes
            document.body.className = state.bodyClasses.join(' ');

            // Restore custom styles
            this.restoreCustomStyles(state.customStyles);

            // Restore panel states
            this.restorePanelStates(state.panelStates);
        }

        restoreSettings(settings) {
            // Update localStorage
            try {
                localStorage.setItem('mas_live_edit_settings', JSON.stringify(settings));
            } catch (error) {
                console.warn('Failed to save settings to localStorage:', error);
            }

            // Update form fields
            Object.entries(settings).forEach(([key, value]) => {
                const field = document.querySelector(`[name="${key}"]`);
                if (field) {
                    if (field.type === 'checkbox') {
                        field.checked = value;
                    } else {
                        field.value = value;
                    }
                    
                    // Trigger change event for live preview
                    field.dispatchEvent(new Event('change', { bubbles: true }));
                }
            });
        }

        restoreCustomStyles(styles) {
            Object.entries(styles).forEach(([key, data]) => {
                const element = document.querySelector(data.selector);
                if (element) {
                    element.setAttribute('style', data.style);
                }
            });
        }

        restorePanelStates(panelStates) {
            // This would need integration with panel system
            panelStates.forEach(panelState => {
                const panel = document.querySelector(`[data-panel-id="${panelState.id}"]`);
                if (panel) {
                    panel.style.left = panelState.position.x + 'px';
                    panel.style.top = panelState.position.y + 'px';
                    panel.style.display = panelState.visible ? 'block' : 'none';
                }
            });
        }

        setupKeyboardShortcuts() {
            document.addEventListener('keydown', (e) => {
                // Ctrl+Z or Cmd+Z
                if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
                    e.preventDefault();
                    this.undo();
                    return;
                }

                // Ctrl+Y or Cmd+Y or Ctrl+Shift+Z
                if (((e.ctrlKey || e.metaKey) && e.key === 'y') || 
                    ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'Z')) {
                    e.preventDefault();
                    this.redo();
                    return;
                }
            });
        }

        createUI() {
            // Create undo/redo buttons in the admin bar or panel
            const container = this.createUIContainer();
            const undoBtn = this.createUndoButton();
            const redoBtn = this.createRedoButton();
            const historyIndicator = this.createHistoryIndicator();

            container.appendChild(undoBtn);
            container.appendChild(redoBtn);
            container.appendChild(historyIndicator);

            // Add to admin bar or floating position
            this.addToAdminBar(container);
        }

        createUIContainer() {
            const container = document.createElement('div');
            container.className = 'mas-undo-redo-controls';
            container.innerHTML = `
                <style>
                .mas-undo-redo-controls {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 4px 8px;
                    background: rgba(255, 255, 255, 0.95);
                    border: 1px solid rgba(0, 0, 0, 0.1);
                    border-radius: 8px;
                    backdrop-filter: blur(10px);
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    z-index: 99998;
                }

                .mas-undo-redo-btn {
                    background: none;
                    border: 1px solid rgba(0, 0, 0, 0.1);
                    border-radius: 6px;
                    padding: 6px 8px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    font-size: 14px;
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    min-width: 28px;
                    height: 28px;
                    justify-content: center;
                }

                .mas-undo-redo-btn:hover:not(:disabled) {
                    background: rgba(102, 126, 234, 0.1);
                    border-color: rgba(102, 126, 234, 0.3);
                }

                .mas-undo-redo-btn:disabled {
                    opacity: 0.4;
                    cursor: not-allowed;
                }

                .mas-history-indicator {
                    font-size: 11px;
                    color: #666;
                    padding: 2px 6px;
                    background: rgba(0, 0, 0, 0.05);
                    border-radius: 4px;
                    white-space: nowrap;
                }

                @media (max-width: 768px) {
                    .mas-undo-redo-controls {
                        position: fixed;
                        bottom: 20px;
                        right: 20px;
                        z-index: 99999;
                    }
                }
                </style>
            `;
            return container;
        }

        createUndoButton() {
            const btn = document.createElement('button');
            btn.className = 'mas-undo-redo-btn mas-undo-btn';
            btn.innerHTML = '↶';
            btn.title = 'Undo (Ctrl+Z)';
            btn.disabled = true;
            
            btn.addEventListener('click', () => this.undo());
            
            return btn;
        }

        createRedoButton() {
            const btn = document.createElement('button');
            btn.className = 'mas-undo-redo-btn mas-redo-btn';
            btn.innerHTML = '↷';
            btn.title = 'Redo (Ctrl+Y)';
            btn.disabled = true;
            
            btn.addEventListener('click', () => this.redo());
            
            return btn;
        }

        createHistoryIndicator() {
            const indicator = document.createElement('span');
            indicator.className = 'mas-history-indicator';
            indicator.textContent = '0/0';
            return indicator;
        }

        addToAdminBar(container) {
            // Try to add to WordPress admin bar first
            const adminBar = document.querySelector('#wpadminbar .ab-top-menu');
            if (adminBar) {
                const listItem = document.createElement('li');
                listItem.appendChild(container);
                adminBar.appendChild(listItem);
            } else {
                // Fallback to body
                document.body.appendChild(container);
                container.style.position = 'fixed';
                container.style.top = '20px';
                container.style.right = '20px';
            }
        }

        updateUI() {
            const undoBtn = document.querySelector('.mas-undo-btn');
            const redoBtn = document.querySelector('.mas-redo-btn');
            const indicator = document.querySelector('.mas-history-indicator');

            if (undoBtn) {
                undoBtn.disabled = !this.canUndo();
                const lastAction = this.canUndo() ? this.history[this.currentIndex] : null;
                undoBtn.title = lastAction ? 
                    `Undo: ${lastAction.description} (Ctrl+Z)` : 
                    'Undo (Ctrl+Z)';
            }

            if (redoBtn) {
                redoBtn.disabled = !this.canRedo();
                const nextAction = this.canRedo() ? this.history[this.currentIndex + 1] : null;
                redoBtn.title = nextAction ? 
                    `Redo: ${nextAction.description} (Ctrl+Y)` : 
                    'Redo (Ctrl+Y)';
            }

            if (indicator) {
                indicator.textContent = `${this.currentIndex + 1}/${this.history.length}`;
            }
        }

        // Utility methods
        generateActionId() {
            return 'action_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        }

        generateDescription(type, data) {
            const descriptions = {
                [this.actionTypes.CSS_CHANGE]: `CSS: ${data.property || 'property'} changed`,
                [this.actionTypes.SETTING_CHANGE]: `Setting: ${data.setting || 'setting'} changed`,
                [this.actionTypes.PANEL_OPERATION]: `Panel: ${data.operation || 'operation'}`,
                [this.actionTypes.PRESET_APPLICATION]: `Preset: ${data.presetName || 'preset'} applied`
            };
            
            return descriptions[type] || 'Unknown action';
        }

        cloneData(data) {
            try {
                return JSON.parse(JSON.stringify(data));
            } catch (error) {
                console.warn('Failed to clone data:', error);
                return data;
            }
        }

        compressState(state) {
            // Simple compression - could be enhanced with actual compression algorithms
            return {
                ...state,
                compressed: true,
                size: JSON.stringify(state).length
            };
        }

        decompressState(compressedState) {
            if (compressedState.compressed) {
                const { compressed, size, ...state } = compressedState;
                return state;
            }
            return compressedState;
        }

        getElementSelector(element) {
            // Generate a simple selector for the element
            if (element.id) {
                return `#${element.id}`;
            }
            
            if (element.className) {
                const classes = element.className.split(' ').filter(c => c.trim());
                if (classes.length > 0) {
                    return `.${classes[0]}`;
                }
            }
            
            return element.tagName.toLowerCase();
        }

        showUndoToast(action) {
            if (window.UnifiedLiveEdit.MASToast) {
                window.UnifiedLiveEdit.MASToast.info(`↶ Undid: ${action.description}`, 2000);
            }
        }

        showRedoToast(action) {
            if (window.UnifiedLiveEdit.MASToast) {
                window.UnifiedLiveEdit.MASToast.info(`↷ Redid: ${action.description}`, 2000);
            }
        }

        showErrorToast(message) {
            if (window.UnifiedLiveEdit.MASToast) {
                window.UnifiedLiveEdit.MASToast.error(message, 3000);
            }
        }

        notifyHistoryChange() {
            // Dispatch custom event for other components
            document.dispatchEvent(new CustomEvent('mas:history-changed', {
                detail: {
                    canUndo: this.canUndo(),
                    canRedo: this.canRedo(),
                    historyLength: this.history.length,
                    currentIndex: this.currentIndex
                }
            }));
        }

        bindEvents() {
            // Bind to existing events to automatically record actions
            this.bindCSSVariableChanges();
            this.bindSettingChanges();
            this.bindPanelOperations();
        }

        bindCSSVariableChanges() {
            // Monitor CSS variable changes
            const observer = new MutationObserver((mutations) => {
                mutations.forEach(mutation => {
                    if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                        const element = mutation.target;
                        const style = element.getAttribute('style');
                        
                        if (style && style.includes('--')) {
                            this.recordAction(this.actionTypes.CSS_CHANGE, {
                                element: this.getElementSelector(element),
                                style: style
                            });
                        }
                    }
                });
            });

            observer.observe(document.documentElement, {
                attributes: true,
                attributeFilter: ['style'],
                subtree: true
            });
        }

        bindSettingChanges() {
            // Monitor form changes
            document.addEventListener('change', (e) => {
                if (e.target.matches('[data-option-id], [name^="mas_"], [name^="woow_"]')) {
                    this.recordAction(this.actionTypes.SETTING_CHANGE, {
                        setting: e.target.name || e.target.dataset.optionId,
                        value: e.target.value,
                        type: e.target.type
                    });
                }
            });
        }

        bindPanelOperations() {
            // Monitor panel operations
            document.addEventListener('mas:panel-created', (e) => {
                this.recordAction(this.actionTypes.PANEL_OPERATION, {
                    operation: 'created',
                    panelId: e.detail.panelId
                }, 'Panel created');
            });

            document.addEventListener('mas:panel-closed', (e) => {
                this.recordAction(this.actionTypes.PANEL_OPERATION, {
                    operation: 'closed',
                    panelId: e.detail.panelId
                }, 'Panel closed');
            });
        }

        // Public API methods
        startRecording() {
            this.isRecording = true;
        }

        stopRecording() {
            this.isRecording = false;
            this.finalizeBatch();
        }

        clearHistory() {
            this.history = [];
            this.currentIndex = -1;
            this.updateUI();
            this.notifyHistoryChange();
        }

        getHistoryInfo() {
            return {
                length: this.history.length,
                currentIndex: this.currentIndex,
                canUndo: this.canUndo(),
                canRedo: this.canRedo(),
                memoryUsage: this.calculateMemoryUsage()
            };
        }

        calculateMemoryUsage() {
            const totalSize = this.history.reduce((size, action) => {
                return size + (action.snapshot?.size || 0);
            }, 0);
            
            return {
                totalActions: this.history.length,
                estimatedBytes: totalSize,
                estimatedMB: (totalSize / 1024 / 1024).toFixed(2)
            };
        }
    }

    // ========================================================================
    // ♿ MODULE: Enhanced Accessibility Support (WCAG 2.1 Compliance)
    // ========================================================================
    class AccessibilityManager {
        constructor() {
            this.focusHistory = [];
            this.currentFocusIndex = -1;
            this.announcements = [];
            this.lastAnnouncement = '';
            this.liveRegion = null;
            this.focusTraps = new Map();
            this.keyboardShortcuts = new Map();
            this.highContrastMode = false;
            this.reducedMotion = false;
            this.screenReaderMode = false;
            
            // ARIA labels and descriptions
            this.ariaLabels = {
                liveEditToggle: 'Toggle Live Edit Mode',
                undoButton: 'Undo last action',
                redoButton: 'Redo action',
                microPanel: 'Editing panel for {elementName}',
                colorPicker: 'Select color for {property}',
                slider: 'Adjust {property} value',
                closePanel: 'Close editing panel',
                dragHandle: 'Drag to reposition panel',
                presetSelect: 'Select preset to apply',
                savePreset: 'Save current settings as preset'
            };

            // Keyboard shortcuts registry
            this.shortcuts = {
                'Escape': 'Close current panel or exit live edit mode',
                'Tab': 'Navigate to next interactive element',
                'Shift+Tab': 'Navigate to previous interactive element',
                'Enter': 'Activate selected element',
                'Space': 'Toggle or activate current element',
                'Ctrl+Z': 'Undo last action',
                'Ctrl+Y': 'Redo action',
                'Ctrl+E': 'Toggle live edit mode',
                'Alt+H': 'Show keyboard shortcuts help',
                'F6': 'Move focus between main regions'
            };
        }

        init() {
            this.detectAccessibilityPreferences();
            this.createLiveRegion();
            this.setupKeyboardNavigation();
            this.setupFocusManagement();
            this.setupScreenReaderSupport();
            this.setupHighContrastSupport();
            this.setupReducedMotionSupport();
            this.bindGlobalEvents();
            this.injectAccessibilityStyles();
            
            console.log('♿ Accessibility Manager initialized with WCAG 2.1 support');
        }

        detectAccessibilityPreferences() {
            // Detect reduced motion preference
            if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
                this.reducedMotion = true;
                document.body.classList.add('mas-reduced-motion');
            }

            // Detect high contrast preference
            if (window.matchMedia && window.matchMedia('(prefers-contrast: high)').matches) {
                this.highContrastMode = true;
                document.body.classList.add('mas-high-contrast');
            }

            // Detect if screen reader is likely active
            this.detectScreenReader();

            // Listen for preference changes
            if (window.matchMedia) {
                window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
                    this.reducedMotion = e.matches;
                    document.body.classList.toggle('mas-reduced-motion', e.matches);
                    this.announce('Motion preferences updated');
                });

                window.matchMedia('(prefers-contrast: high)').addEventListener('change', (e) => {
                    this.highContrastMode = e.matches;
                    document.body.classList.toggle('mas-high-contrast', e.matches);
                    this.announce('Contrast preferences updated');
                });
            }
        }

        detectScreenReader() {
            // Various techniques to detect screen reader usage
            const indicators = [
                // Check for NVDA
                () => navigator.userAgent.includes('NVDA'),
                // Check for JAWS
                () => window.speechSynthesis && window.speechSynthesis.getVoices().length > 0,
                // Check for VoiceOver (Mac)
                () => navigator.platform.includes('Mac') && window.speechSynthesis,
                // Check for high contrast mode (often used with screen readers)
                () => window.matchMedia && window.matchMedia('(prefers-contrast: high)').matches,
                // Check for reduced motion (accessibility preference)
                () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
            ];

            const screenReaderLikely = indicators.some(check => {
                try {
                    return check();
                } catch (e) {
                    return false;
                }
            });

            if (screenReaderLikely) {
                this.screenReaderMode = true;
                document.body.classList.add('mas-screen-reader-mode');
                this.enhanceForScreenReaders();
            }
        }

        createLiveRegion() {
            // Create ARIA live region for announcements
            this.liveRegion = document.createElement('div');
            this.liveRegion.setAttribute('aria-live', 'polite');
            this.liveRegion.setAttribute('aria-atomic', 'true');
            this.liveRegion.setAttribute('role', 'status');
            this.liveRegion.className = 'mas-sr-only mas-live-region';
            this.liveRegion.id = 'mas-accessibility-announcements';
            
            document.body.appendChild(this.liveRegion);

            // Create assertive live region for urgent announcements
            this.urgentLiveRegion = document.createElement('div');
            this.urgentLiveRegion.setAttribute('aria-live', 'assertive');
            this.urgentLiveRegion.setAttribute('aria-atomic', 'true');
            this.urgentLiveRegion.setAttribute('role', 'alert');
            this.urgentLiveRegion.className = 'mas-sr-only mas-live-region-urgent';
            this.urgentLiveRegion.id = 'mas-accessibility-alerts';
            
            document.body.appendChild(this.urgentLiveRegion);
        }

        announce(message, urgent = false, delay = 100) {
            if (!message || message === this.lastAnnouncement) return;

            this.lastAnnouncement = message;
            this.announcements.push({
                message,
                timestamp: Date.now(),
                urgent
            });

            const region = urgent ? this.urgentLiveRegion : this.liveRegion;
            
            // Clear previous content and announce after short delay
            setTimeout(() => {
                region.textContent = '';
                setTimeout(() => {
                    region.textContent = message;
                    
                    // Clear after 5 seconds to prevent accumulation
                    setTimeout(() => {
                        if (region.textContent === message) {
                            region.textContent = '';
                        }
                    }, 5000);
                }, 50);
            }, delay);
        }

        setupKeyboardNavigation() {
            // Enhanced keyboard navigation system
            document.addEventListener('keydown', (e) => {
                this.handleGlobalKeyboard(e);
            });

            // Focus management for dynamic content
            document.addEventListener('focusin', (e) => {
                this.updateFocusHistory(e.target);
            });

            // Handle focus loss
            document.addEventListener('focusout', (e) => {
                setTimeout(() => {
                    if (!document.activeElement || document.activeElement === document.body) {
                        this.restoreFocus();
                    }
                }, 10);
            });
        }

        handleGlobalKeyboard(e) {
            const { key, ctrlKey, altKey, shiftKey, metaKey } = e;
            const modifiers = { ctrlKey, altKey, shiftKey, metaKey };

            // Handle escape key globally
            if (key === 'Escape') {
                this.handleEscapeKey(e);
                return;
            }

            // Handle F6 for region navigation
            if (key === 'F6') {
                e.preventDefault();
                this.navigateRegions(shiftKey);
                return;
            }

            // Handle Alt+H for help
            if (altKey && key === 'h') {
                e.preventDefault();
                this.showKeyboardHelp();
                return;
            }

            // Handle tab navigation within panels
            if (key === 'Tab') {
                this.handleTabNavigation(e);
                return;
            }

            // Handle arrow keys for custom navigation
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) {
                this.handleArrowNavigation(e);
                return;
            }

            // Handle custom shortcuts
            const shortcutKey = this.getShortcutKey(e);
            if (this.keyboardShortcuts.has(shortcutKey)) {
                e.preventDefault();
                const handler = this.keyboardShortcuts.get(shortcutKey);
                handler(e);
                return;
            }
        }

        handleEscapeKey(e) {
            // Priority order for escape key
            const activePanel = document.querySelector('.mas-micro-panel:not(.mas-panel-closing)');
            const activeModal = document.querySelector('.mas-modal[open]');
            const liveEditActive = document.body.classList.contains('mas-live-edit-active');

            if (activeModal) {
                // Close modal first
                activeModal.close();
                this.announce('Modal closed');
                e.preventDefault();
                return;
            }

            if (activePanel) {
                // Close panel
                const closeBtn = activePanel.querySelector('.mas-panel-close');
                if (closeBtn) {
                    closeBtn.click();
                    this.announce('Panel closed');
                }
                e.preventDefault();
                return;
            }

            if (liveEditActive) {
                // Exit live edit mode
                const toggle = document.querySelector('#mas-v2-edit-mode-switch, .mas-live-edit-toggle');
                if (toggle) {
                    if (toggle.type === 'checkbox') {
                        toggle.checked = false;
                        toggle.dispatchEvent(new Event('change'));
                    } else {
                        toggle.click();
                    }
                    this.announce('Live edit mode disabled');
                }
                e.preventDefault();
                return;
            }
        }

        handleTabNavigation(e) {
            const focusableElements = this.getFocusableElements();
            const currentIndex = focusableElements.indexOf(document.activeElement);
            
            if (currentIndex === -1) return;

            // Check if we're at boundaries
            if (!e.shiftKey && currentIndex === focusableElements.length - 1) {
                // At last element, cycle to first
                e.preventDefault();
                focusableElements[0]?.focus();
                this.announce('Cycled to first focusable element');
            } else if (e.shiftKey && currentIndex === 0) {
                // At first element, cycle to last
                e.preventDefault();
                focusableElements[focusableElements.length - 1]?.focus();
                this.announce('Cycled to last focusable element');
            }
        }

        handleArrowNavigation(e) {
            const target = e.target;
            
            // Handle slider controls
            if (target.type === 'range') {
                // Let browser handle default, but announce value
                setTimeout(() => {
                    const label = this.getElementLabel(target);
                    this.announce(`${label}: ${target.value}`);
                }, 50);
                return;
            }

            // Handle custom arrow navigation for panels
            const panel = target.closest('.mas-micro-panel');
            if (panel && ['ArrowUp', 'ArrowDown'].includes(e.key)) {
                this.navigatePanelControls(panel, e.key === 'ArrowDown');
                e.preventDefault();
            }
        }

        navigatePanelControls(panel, forward = true) {
            const controls = panel.querySelectorAll('input, select, button, [tabindex="0"]');
            const currentIndex = Array.from(controls).indexOf(document.activeElement);
            
            if (currentIndex === -1) {
                controls[0]?.focus();
                return;
            }

            const nextIndex = forward 
                ? (currentIndex + 1) % controls.length
                : (currentIndex - 1 + controls.length) % controls.length;
            
            controls[nextIndex]?.focus();
        }

        navigateRegions(reverse = false) {
            const regions = [
                '#wpadminbar',
                '#adminmenuwrap',
                '.mas-live-edit-toggle',
                '.mas-micro-panel',
                '.wrap'
            ];

            const availableRegions = regions
                .map(selector => document.querySelector(selector))
                .filter(Boolean);

            if (availableRegions.length === 0) return;

            const currentRegion = availableRegions.find(region => 
                region.contains(document.activeElement)
            );

            let nextIndex = 0;
            if (currentRegion) {
                const currentIndex = availableRegions.indexOf(currentRegion);
                nextIndex = reverse 
                    ? (currentIndex - 1 + availableRegions.length) % availableRegions.length
                    : (currentIndex + 1) % availableRegions.length;
            }

            const nextRegion = availableRegions[nextIndex];
            const focusableInRegion = this.getFocusableElements(nextRegion)[0];
            
            if (focusableInRegion) {
                focusableInRegion.focus();
                const regionName = this.getRegionName(nextRegion);
                this.announce(`Moved to ${regionName} region`);
            }
        }

        getRegionName(element) {
            const names = {
                '#wpadminbar': 'Admin Bar',
                '#adminmenuwrap': 'Admin Menu',
                '.mas-live-edit-toggle': 'Live Edit Controls',
                '.mas-micro-panel': 'Editing Panel',
                '.wrap': 'Main Content'
            };

            for (const [selector, name] of Object.entries(names)) {
                if (element.matches(selector)) return name;
            }

            return element.getAttribute('aria-label') || 'Unknown';
        }

        setupFocusManagement() {
            // Create focus trap for modal elements
            this.setupFocusTraps();
            
            // Monitor dynamic content addition
            const observer = new MutationObserver((mutations) => {
                mutations.forEach(mutation => {
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === 1) { // Element node
                            this.enhanceElementAccessibility(node);
                        }
                    });
                });
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        }

        setupFocusTraps() {
            // Focus trap for micro panels
            document.addEventListener('mas:panel-created', (e) => {
                const panel = document.querySelector(`[data-panel-id="${e.detail.panelId}"]`);
                if (panel) {
                    this.createFocusTrap(panel);
                    
                    // Announce panel creation
                    const panelTitle = panel.querySelector('.mas-panel-title')?.textContent || 'Editing panel';
                    this.announce(`${panelTitle} opened`);
                    
                    // Focus first interactive element
                    setTimeout(() => {
                        const firstFocusable = this.getFocusableElements(panel)[0];
                        if (firstFocusable) {
                            firstFocusable.focus();
                        }
                    }, 100);
                }
            });

            document.addEventListener('mas:panel-closed', (e) => {
                this.removeFocusTrap(e.detail.panelId);
                this.restoreFocus();
                this.announce('Panel closed');
            });
        }

        createFocusTrap(element) {
            const trapId = element.dataset.panelId || Date.now().toString();
            
            const trapData = {
                element,
                previousFocus: document.activeElement,
                focusableElements: this.getFocusableElements(element)
            };

            this.focusTraps.set(trapId, trapData);

            // Add event listeners for focus trapping
            const trapHandler = (e) => {
                if (e.key === 'Tab') {
                    this.handleFocusTrap(e, trapData);
                }
            };

            element.addEventListener('keydown', trapHandler);
            trapData.trapHandler = trapHandler;

            // Set ARIA attributes
            element.setAttribute('role', 'dialog');
            element.setAttribute('aria-modal', 'true');
            
            if (!element.getAttribute('aria-label') && !element.getAttribute('aria-labelledby')) {
                const title = element.querySelector('.mas-panel-title')?.textContent;
                if (title) {
                    element.setAttribute('aria-label', title);
                }
            }
        }

        handleFocusTrap(e, trapData) {
            const { focusableElements } = trapData;
            if (focusableElements.length === 0) return;

            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];

            if (e.shiftKey && document.activeElement === firstElement) {
                e.preventDefault();
                lastElement.focus();
            } else if (!e.shiftKey && document.activeElement === lastElement) {
                e.preventDefault();
                firstElement.focus();
            }
        }

        removeFocusTrap(trapId) {
            const trapData = this.focusTraps.get(trapId);
            if (trapData) {
                if (trapData.trapHandler) {
                    trapData.element.removeEventListener('keydown', trapData.trapHandler);
                }
                this.focusTraps.delete(trapId);
            }
        }

        restoreFocus() {
            // Try to restore focus to the last known good element
            if (this.focusHistory.length > 0) {
                for (let i = this.focusHistory.length - 1; i >= 0; i--) {
                    const element = this.focusHistory[i];
                    if (element && document.contains(element) && this.isFocusable(element)) {
                        element.focus();
                        return;
                    }
                }
            }

            // Fallback to first focusable element
            const firstFocusable = this.getFocusableElements()[0];
            if (firstFocusable) {
                firstFocusable.focus();
            }
        }

        updateFocusHistory(element) {
            if (!element || !this.isFocusable(element)) return;

            // Remove previous instances
            this.focusHistory = this.focusHistory.filter(el => el !== element);
            
            // Add to end
            this.focusHistory.push(element);
            
            // Limit history size
            if (this.focusHistory.length > 10) {
                this.focusHistory.shift();
            }
        }

        setupScreenReaderSupport() {
            // Enhance all interactive elements
            this.enhanceElementAccessibility(document.body);

            // Setup live edit mode announcements
            document.addEventListener('mas:live-edit-activated', () => {
                this.announce('Live edit mode activated. Press Escape to exit, Tab to navigate, F6 to move between regions.', true);
            });

            document.addEventListener('mas:live-edit-deactivated', () => {
                this.announce('Live edit mode deactivated');
            });

            // Setup setting change announcements
            document.addEventListener('change', (e) => {
                if (e.target.matches('[data-option-id], [name^="mas_"], [name^="woow_"]')) {
                    const label = this.getElementLabel(e.target);
                    const value = this.getElementValue(e.target);
                    this.announce(`${label} changed to ${value}`);
                }
            });
        }

        enhanceElementAccessibility(rootElement) {
            // Enhance live edit toggle
            const toggles = rootElement.querySelectorAll('#mas-v2-edit-mode-switch, .mas-live-edit-toggle');
            toggles.forEach(toggle => {
                if (!toggle.getAttribute('aria-label')) {
                    toggle.setAttribute('aria-label', this.ariaLabels.liveEditToggle);
                }
                if (!toggle.getAttribute('aria-describedby')) {
                    const desc = this.createDescription(
                        'Toggle live editing mode to customize the admin interface appearance'
                    );
                    toggle.setAttribute('aria-describedby', desc.id);
                }
            });

            // Enhance undo/redo buttons
            const undoBtn = rootElement.querySelector('.mas-undo-btn');
            if (undoBtn && !undoBtn.getAttribute('aria-label')) {
                undoBtn.setAttribute('aria-label', this.ariaLabels.undoButton);
                undoBtn.setAttribute('aria-keyshortcuts', 'Ctrl+Z');
            }

            const redoBtn = rootElement.querySelector('.mas-redo-btn');
            if (redoBtn && !redoBtn.getAttribute('aria-label')) {
                redoBtn.setAttribute('aria-label', this.ariaLabels.redoButton);
                redoBtn.setAttribute('aria-keyshortcuts', 'Ctrl+Y');
            }

            // Enhance form controls
            const controls = rootElement.querySelectorAll('input, select, textarea, button');
            controls.forEach(control => this.enhanceFormControl(control));

            // Enhance panels
            const panels = rootElement.querySelectorAll('.mas-micro-panel');
            panels.forEach(panel => this.enhancePanel(panel));
        }

        enhanceFormControl(control) {
            // Add proper labels
            if (!control.getAttribute('aria-label') && !control.getAttribute('aria-labelledby')) {
                const label = this.findLabelForControl(control);
                if (label) {
                    if (label.id) {
                        control.setAttribute('aria-labelledby', label.id);
                    } else {
                        control.setAttribute('aria-label', label.textContent.trim());
                    }
                }
            }

            // Add descriptions for complex controls
            if (control.type === 'range' && !control.getAttribute('aria-describedby')) {
                const description = this.createDescription(
                    `Use arrow keys to adjust value. Current: ${control.value}, Min: ${control.min}, Max: ${control.max}`
                );
                control.setAttribute('aria-describedby', description.id);
            }

            // Add value text for custom controls
            if (control.type === 'color') {
                control.addEventListener('input', () => {
                    control.setAttribute('aria-valuetext', `Color: ${control.value}`);
                });
            }
        }

        enhancePanel(panel) {
            // Set proper role and properties
            if (!panel.getAttribute('role')) {
                panel.setAttribute('role', 'dialog');
            }

            if (!panel.getAttribute('aria-modal')) {
                panel.setAttribute('aria-modal', 'true');
            }

            // Add title
            const title = panel.querySelector('.mas-panel-title');
            if (title && !panel.getAttribute('aria-labelledby')) {
                if (!title.id) {
                    title.id = `mas-panel-title-${Date.now()}`;
                }
                panel.setAttribute('aria-labelledby', title.id);
            }

            // Enhance close button
            const closeBtn = panel.querySelector('.mas-panel-close');
            if (closeBtn) {
                if (!closeBtn.getAttribute('aria-label')) {
                    closeBtn.setAttribute('aria-label', 'Close panel');
                }
                closeBtn.setAttribute('aria-keyshortcuts', 'Escape');
            }

            // Enhance drag handle
            const dragHandle = panel.querySelector('.mas-panel-header');
            if (dragHandle) {
                dragHandle.setAttribute('role', 'button');
                dragHandle.setAttribute('aria-label', 'Drag to move panel');
                dragHandle.setAttribute('tabindex', '0');
                
                // Add keyboard drag support
                dragHandle.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        this.startKeyboardDrag(panel);
                    }
                });
            }
        }

        startKeyboardDrag(panel) {
            this.announce('Keyboard drag mode activated. Use arrow keys to move, Enter to confirm, Escape to cancel.');
            
            let dragMode = true;
            const originalPosition = {
                x: parseInt(panel.style.left) || 0,
                y: parseInt(panel.style.top) || 0
            };

            const handleDragKeys = (e) => {
                if (!dragMode) return;

                const step = e.shiftKey ? 10 : 1;
                let newX = parseInt(panel.style.left) || 0;
                let newY = parseInt(panel.style.top) || 0;

                switch (e.key) {
                    case 'ArrowLeft':
                        e.preventDefault();
                        newX -= step;
                        break;
                    case 'ArrowRight':
                        e.preventDefault();
                        newX += step;
                        break;
                    case 'ArrowUp':
                        e.preventDefault();
                        newY -= step;
                        break;
                    case 'ArrowDown':
                        e.preventDefault();
                        newY += step;
                        break;
                    case 'Enter':
                        e.preventDefault();
                        dragMode = false;
                        document.removeEventListener('keydown', handleDragKeys, true);
                        this.announce('Panel position confirmed');
                        return;
                    case 'Escape':
                        e.preventDefault();
                        dragMode = false;
                        document.removeEventListener('keydown', handleDragKeys, true);
                        panel.style.left = originalPosition.x + 'px';
                        panel.style.top = originalPosition.y + 'px';
                        this.announce('Panel position cancelled');
                        return;
                }

                panel.style.left = Math.max(0, newX) + 'px';
                panel.style.top = Math.max(0, newY) + 'px';
                
                // Announce position periodically
                if (e.key.startsWith('Arrow')) {
                    clearTimeout(this.dragAnnounceTimeout);
                    this.dragAnnounceTimeout = setTimeout(() => {
                        this.announce(`Position: ${Math.round(newX)}, ${Math.round(newY)}`);
                    }, 500);
                }
            };

            document.addEventListener('keydown', handleDragKeys, true);
        }

        setupHighContrastSupport() {
            if (this.highContrastMode) {
                this.enhanceForHighContrast();
            }
        }

        enhanceForHighContrast() {
            // Add high contrast specific styles
            const highContrastStyles = `
                .mas-high-contrast .mas-micro-panel {
                    border: 3px solid !important;
                    box-shadow: none !important;
                }
                
                .mas-high-contrast .mas-panel-close:focus {
                    outline: 3px solid !important;
                    outline-offset: 2px !important;
                }
                
                .mas-high-contrast .mas-undo-redo-btn:focus {
                    outline: 3px solid !important;
                }
                
                .mas-high-contrast .mas-live-edit-toggle:focus {
                    outline: 3px solid !important;
                }
            `;

            this.injectStyles(highContrastStyles, 'mas-high-contrast-styles');
        }

        setupReducedMotionSupport() {
            if (this.reducedMotion) {
                this.disableAnimations();
            }
        }

        disableAnimations() {
            const reducedMotionStyles = `
                .mas-reduced-motion * {
                    animation-duration: 0.01ms !important;
                    animation-iteration-count: 1 !important;
                    transition-duration: 0.01ms !important;
                    transition-delay: 0ms !important;
                }
                
                .mas-reduced-motion .mas-panel-visible {
                    transform: none !important;
                    opacity: 1 !important;
                }
            `;

            this.injectStyles(reducedMotionStyles, 'mas-reduced-motion-styles');
        }

        enhanceForScreenReaders() {
            // Add more descriptive text
            const srOnlyStyles = `
                .mas-sr-only {
                    position: absolute !important;
                    width: 1px !important;
                    height: 1px !important;
                    padding: 0 !important;
                    margin: -1px !important;
                    overflow: hidden !important;
                    clip: rect(0, 0, 0, 0) !important;
                    white-space: nowrap !important;
                    border: 0 !important;
                }
                
                .mas-sr-only:focus,
                .mas-sr-only:active {
                    position: static !important;
                    width: auto !important;
                    height: auto !important;
                    margin: 0 !important;
                    overflow: visible !important;
                    clip: auto !important;
                    white-space: normal !important;
                }
            `;

            this.injectStyles(srOnlyStyles, 'mas-screen-reader-styles');

            // Add skip links
            this.addSkipLinks();

            // Enhance with additional context
            this.addContextualInformation();
        }

        addSkipLinks() {
            const skipLinks = document.createElement('div');
            skipLinks.className = 'mas-skip-links';
            skipLinks.innerHTML = `
                <a href="#adminmenuwrap" class="mas-sr-only">Skip to admin menu</a>
                <a href=".wrap" class="mas-sr-only">Skip to main content</a>
                <a href=".mas-micro-panel" class="mas-sr-only">Skip to editing panel</a>
            `;

            // Style skip links
            const skipStyles = `
                .mas-skip-links a {
                    position: absolute;
                    top: -40px;
                    left: 6px;
                    z-index: 100000;
                    padding: 8px 16px;
                    background: #000;
                    color: #fff;
                    text-decoration: none;
                    border-radius: 4px;
                }
                
                .mas-skip-links a:focus {
                    top: 6px;
                }
            `;

            this.injectStyles(skipStyles, 'mas-skip-links-styles');
            document.body.insertBefore(skipLinks, document.body.firstChild);
        }

        addContextualInformation() {
            // Add status information
            const statusInfo = document.createElement('div');
            statusInfo.id = 'mas-status-info';
            statusInfo.className = 'mas-sr-only';
            statusInfo.setAttribute('aria-live', 'polite');
            
            const updateStatus = () => {
                const isLiveEditActive = document.body.classList.contains('mas-live-edit-active');
                const openPanels = document.querySelectorAll('.mas-micro-panel:not(.mas-panel-closing)').length;
                
                statusInfo.textContent = `Live edit mode: ${isLiveEditActive ? 'active' : 'inactive'}. Open panels: ${openPanels}.`;
            };

            // Update status on changes
            document.addEventListener('mas:live-edit-toggled', updateStatus);
            document.addEventListener('mas:panel-created', updateStatus);
            document.addEventListener('mas:panel-closed', updateStatus);

            document.body.appendChild(statusInfo);
            updateStatus();
        }

        showKeyboardHelp() {
            // Create keyboard shortcuts help modal
            const modal = document.createElement('div');
            modal.className = 'mas-keyboard-help-modal';
            modal.setAttribute('role', 'dialog');
            modal.setAttribute('aria-modal', 'true');
            modal.setAttribute('aria-labelledby', 'mas-help-title');

            const shortcutsList = Object.entries(this.shortcuts)
                .map(([key, description]) => `
                    <tr>
                        <td><kbd>${key}</kbd></td>
                        <td>${description}</td>
                    </tr>
                `).join('');

            modal.innerHTML = `
                <div class="mas-help-content">
                    <h2 id="mas-help-title">Keyboard Shortcuts</h2>
                    <table class="mas-shortcuts-table">
                        <thead>
                            <tr>
                                <th>Key</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${shortcutsList}
                        </tbody>
                    </table>
                    <button class="mas-help-close" aria-label="Close help">Close</button>
                </div>
            `;

            // Style the modal
            const helpStyles = `
                .mas-keyboard-help-modal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.8);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 100000;
                }
                
                .mas-help-content {
                    background: white;
                    padding: 24px;
                    border-radius: 8px;
                    max-width: 600px;
                    max-height: 80vh;
                    overflow-y: auto;
                }
                
                .mas-shortcuts-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin: 16px 0;
                }
                
                .mas-shortcuts-table th,
                .mas-shortcuts-table td {
                    padding: 8px 12px;
                    text-align: left;
                    border-bottom: 1px solid #ddd;
                }
                
                .mas-shortcuts-table kbd {
                    background: #f5f5f5;
                    border: 1px solid #ccc;
                    border-radius: 4px;
                    padding: 2px 6px;
                    font-family: monospace;
                }
                
                .mas-help-close {
                    float: right;
                    padding: 8px 16px;
                    background: #0073aa;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                }
            `;

            this.injectStyles(helpStyles, 'mas-keyboard-help-styles');

            // Add event listeners
            const closeBtn = modal.querySelector('.mas-help-close');
            const closeModal = () => {
                document.body.removeChild(modal);
                this.announce('Keyboard shortcuts help closed');
            };

            closeBtn.addEventListener('click', closeModal);
            modal.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    closeModal();
                }
            });

            // Create focus trap
            this.createFocusTrap(modal);

            document.body.appendChild(modal);
            closeBtn.focus();
            this.announce('Keyboard shortcuts help opened');
        }

        // Utility methods
        getFocusableElements(root = document) {
            const focusableSelectors = [
                'a[href]',
                'button:not([disabled])',
                'input:not([disabled])',
                'select:not([disabled])',
                'textarea:not([disabled])',
                '[tabindex]:not([tabindex="-1"])',
                '[contenteditable="true"]'
            ].join(', ');

            return Array.from(root.querySelectorAll(focusableSelectors))
                .filter(el => this.isFocusable(el));
        }

        isFocusable(element) {
            if (!element || element.disabled) return false;
            
            const style = window.getComputedStyle(element);
            if (style.display === 'none' || style.visibility === 'hidden') return false;
            
            const rect = element.getBoundingClientRect();
            return rect.width > 0 && rect.height > 0;
        }

        getElementLabel(element) {
            // Try various methods to get element label
            if (element.getAttribute('aria-label')) {
                return element.getAttribute('aria-label');
            }

            const labelledBy = element.getAttribute('aria-labelledby');
            if (labelledBy) {
                const labelElement = document.getElementById(labelledBy);
                if (labelElement) {
                    return labelElement.textContent.trim();
                }
            }

            const label = this.findLabelForControl(element);
            if (label) {
                return label.textContent.trim();
            }

            return element.placeholder || element.title || element.name || 'Unnamed control';
        }

        getElementValue(element) {
            if (element.type === 'checkbox') {
                return element.checked ? 'checked' : 'unchecked';
            }
            
            if (element.type === 'color') {
                return element.value;
            }
            
            if (element.type === 'range') {
                const unit = element.dataset.unit || '';
                return `${element.value}${unit}`;
            }
            
            return element.value || element.textContent;
        }

        findLabelForControl(control) {
            // Look for associated label
            if (control.id) {
                const label = document.querySelector(`label[for="${control.id}"]`);
                if (label) return label;
            }

            // Look for parent label
            const parentLabel = control.closest('label');
            if (parentLabel) return parentLabel;

            // Look for sibling label
            const siblings = Array.from(control.parentNode?.children || []);
            const index = siblings.indexOf(control);
            for (let i = index - 1; i >= 0; i--) {
                if (siblings[i].tagName === 'LABEL') {
                    return siblings[i];
                }
            }

            return null;
        }

        createDescription(text) {
            const desc = document.createElement('span');
            desc.id = `mas-desc-${Date.now()}`;
            desc.className = 'mas-sr-only';
            desc.textContent = text;
            document.body.appendChild(desc);
            return desc;
        }

        getShortcutKey(e) {
            const parts = [];
            if (e.ctrlKey) parts.push('Ctrl');
            if (e.altKey) parts.push('Alt');
            if (e.shiftKey) parts.push('Shift');
            if (e.metaKey) parts.push('Meta');
            parts.push(e.key);
            return parts.join('+');
        }

        bindGlobalEvents() {
            // Listen for live edit mode changes
            document.addEventListener('change', (e) => {
                if (e.target.id === 'mas-v2-edit-mode-switch') {
                    const event = e.target.checked ? 'mas:live-edit-activated' : 'mas:live-edit-deactivated';
                    document.dispatchEvent(new CustomEvent(event));
                }
            });

            // Listen for undo/redo events
            document.addEventListener('mas:history-changed', (e) => {
                const { canUndo, canRedo } = e.detail;
                const undoBtn = document.querySelector('.mas-undo-btn');
                const redoBtn = document.querySelector('.mas-redo-btn');

                if (undoBtn) {
                    undoBtn.setAttribute('aria-disabled', !canUndo);
                }
                if (redoBtn) {
                    redoBtn.setAttribute('aria-disabled', !canRedo);
                }
            });
        }

        injectAccessibilityStyles() {
            const baseStyles = `
                /* Focus indicators */
                .mas-micro-panel *:focus,
                .mas-live-edit-toggle:focus,
                .mas-undo-redo-btn:focus {
                    outline: 2px solid #005fcc !important;
                    outline-offset: 2px !important;
                }

                /* Keyboard navigation helpers */
                .mas-keyboard-user .mas-micro-panel {
                    border: 2px solid transparent;
                }

                .mas-keyboard-user .mas-micro-panel:focus-within {
                    border-color: #005fcc;
                }

                /* Screen reader only content */
                .mas-sr-only {
                    position: absolute !important;
                    width: 1px !important;
                    height: 1px !important;
                    padding: 0 !important;
                    margin: -1px !important;
                    overflow: hidden !important;
                    clip: rect(0, 0, 0, 0) !important;
                    white-space: nowrap !important;
                    border: 0 !important;
                }

                /* Live regions for announcements */
                .mas-live-region,
                .mas-live-region-urgent {
                    position: absolute;
                    left: -10000px;
                    width: 1px;
                    height: 1px;
                    overflow: hidden;
                }
            `;

            this.injectStyles(baseStyles, 'mas-accessibility-base-styles');
        }

        injectStyles(css, id) {
            // Remove existing styles with same ID
            const existing = document.getElementById(id);
            if (existing) {
                existing.remove();
            }

            const style = document.createElement('style');
            style.id = id;
            style.textContent = css;
            document.head.appendChild(style);
        }

        // Public API
        registerShortcut(key, handler, description) {
            this.keyboardShortcuts.set(key, handler);
            if (description) {
                this.shortcuts[key] = description;
            }
        }

        unregisterShortcut(key) {
            this.keyboardShortcuts.delete(key);
            delete this.shortcuts[key];
        }

        announceToUser(message, urgent = false) {
            this.announce(message, urgent);
        }

        isAccessibilityMode() {
            return this.screenReaderMode || this.highContrastMode;
        }

        getAccessibilityInfo() {
            return {
                screenReaderMode: this.screenReaderMode,
                highContrastMode: this.highContrastMode,
                reducedMotion: this.reducedMotion,
                focusTrapsActive: this.focusTraps.size,
                registeredShortcuts: this.keyboardShortcuts.size
            };
        }
    }

    // ========================================================================
    // 🔄 MODULE: Batch Operations System (Multi-select & Bulk Edit)
    // ========================================================================
    class BatchOperationsManager {
        constructor() {
            this.selectedElements = new Set();
            this.isMultiSelectMode = false;
            this.selectionBox = null;
            this.lastSelectedElement = null;
            this.selectionHistory = [];
            this.batchPanel = null;
            this.selectionOverlay = null;
            this.dragSelect = false;
            this.dragStartPos = null;
            this.commonProperties = new Map();
            this.bulkOperations = new Map();
            
            // Selection modes
            this.selectionModes = {
                SINGLE: 'single',
                MULTIPLE: 'multiple',
                RECTANGLE: 'rectangle',
                LASSO: 'lasso'
            };
            
            this.currentMode = this.selectionModes.SINGLE;
            this.shortcuts = {
                'Ctrl+A': 'Select all editable elements',
                'Ctrl+D': 'Deselect all',
                'Ctrl+I': 'Invert selection',
                'Ctrl+G': 'Group selected elements',
                'Ctrl+U': 'Ungroup elements',
                'Ctrl+Shift+E': 'Bulk edit selected',
                'Delete': 'Remove selected elements',
                'Escape': 'Exit multi-select mode'
            };
        }

        init() {
            this.createSelectionOverlay();
            this.setupEventListeners();
            this.setupKeyboardShortcuts();
            this.createBatchPanel();
            this.setupMouseEvents();
            this.initializeCommonProperties();
            
            console.log('🔄 Batch Operations Manager initialized');
        }

        createSelectionOverlay() {
            this.selectionOverlay = document.createElement('div');
            this.selectionOverlay.className = 'mas-selection-overlay';
            this.selectionOverlay.innerHTML = `
                <div class="mas-selection-controls">
                    <button class="mas-selection-btn" data-action="select-all" title="Select All (Ctrl+A)">
                        <span class="dashicons dashicons-yes"></span>
                        <span class="sr-only">Select All</span>
                    </button>
                    <button class="mas-selection-btn" data-action="deselect-all" title="Deselect All (Ctrl+D)">
                        <span class="dashicons dashicons-no"></span>
                        <span class="sr-only">Deselect All</span>
                    </button>
                    <button class="mas-selection-btn" data-action="invert-selection" title="Invert Selection (Ctrl+I)">
                        <span class="dashicons dashicons-image-rotate"></span>
                        <span class="sr-only">Invert Selection</span>
                    </button>
                    <button class="mas-selection-btn" data-action="bulk-edit" title="Bulk Edit (Ctrl+Shift+E)">
                        <span class="dashicons dashicons-edit"></span>
                        <span class="sr-only">Bulk Edit</span>
                    </button>
                    <div class="mas-selection-count">
                        <span class="count">0</span> selected
                    </div>
                </div>
                <div class="mas-selection-box"></div>
            `;
            
            document.body.appendChild(this.selectionOverlay);
            this.selectionBox = this.selectionOverlay.querySelector('.mas-selection-box');
        }

        setupEventListeners() {
            // Selection control buttons
            this.selectionOverlay.addEventListener('click', (e) => {
                const action = e.target.closest('[data-action]')?.dataset.action;
                if (action) {
                    this.handleAction(action);
                }
            });

            // Live edit mode changes
            document.addEventListener('mas:live-edit-activated', () => {
                this.enableBatchMode();
            });

            document.addEventListener('mas:live-edit-deactivated', () => {
                this.disableBatchMode();
            });

            // Element selection
            document.addEventListener('click', (e) => {
                if (this.isMultiSelectMode && e.target.hasAttribute('data-woow-editable')) {
                    this.handleElementClick(e);
                }
            });
        }

        setupKeyboardShortcuts() {
            document.addEventListener('keydown', (e) => {
                if (!this.isMultiSelectMode) return;

                const key = this.getShortcutKey(e);
                
                switch (key) {
                    case 'Ctrl+A':
                        e.preventDefault();
                        this.selectAll();
                        break;
                    case 'Ctrl+D':
                        e.preventDefault();
                        this.deselectAll();
                        break;
                    case 'Ctrl+I':
                        e.preventDefault();
                        this.invertSelection();
                        break;
                    case 'Ctrl+G':
                        e.preventDefault();
                        this.groupSelected();
                        break;
                    case 'Ctrl+U':
                        e.preventDefault();
                        this.ungroupSelected();
                        break;
                    case 'Ctrl+Shift+E':
                        e.preventDefault();
                        this.openBulkEdit();
                        break;
                    case 'Delete':
                        e.preventDefault();
                        this.removeSelected();
                        break;
                    case 'Escape':
                        e.preventDefault();
                        this.exitMultiSelectMode();
                        break;
                }
            });
        }

        setupMouseEvents() {
            let isMouseDown = false;
            let startX, startY;

            document.addEventListener('mousedown', (e) => {
                if (!this.isMultiSelectMode || !e.ctrlKey) return;
                
                isMouseDown = true;
                startX = e.clientX;
                startY = e.clientY;
                this.dragStartPos = { x: startX, y: startY };
                
                this.showSelectionBox(startX, startY, 0, 0);
            });

            document.addEventListener('mousemove', (e) => {
                if (!isMouseDown || !this.isMultiSelectMode) return;
                
                const width = Math.abs(e.clientX - startX);
                const height = Math.abs(e.clientY - startY);
                const left = Math.min(e.clientX, startX);
                const top = Math.min(e.clientY, startY);
                
                this.updateSelectionBox(left, top, width, height);
                this.selectElementsInBox(left, top, width, height);
            });

            document.addEventListener('mouseup', () => {
                if (isMouseDown) {
                    isMouseDown = false;
                    this.hideSelectionBox();
                }
            });
        }

        enableBatchMode() {
            this.isMultiSelectMode = true;
            this.selectionOverlay.classList.add('mas-active');
            document.body.classList.add('mas-batch-mode');
            
            // Add multi-select indicators to editable elements
            const editableElements = document.querySelectorAll('[data-woow-editable="true"]');
            editableElements.forEach(element => {
                element.classList.add('mas-multi-selectable');
            });
            
            this.announceToUser('Batch operations mode enabled. Use Ctrl+click to select multiple elements.');
        }

        disableBatchMode() {
            this.isMultiSelectMode = false;
            this.selectionOverlay.classList.remove('mas-active');
            document.body.classList.remove('mas-batch-mode');
            this.deselectAll();
            
            // Remove multi-select indicators
            const editableElements = document.querySelectorAll('[data-woow-editable="true"]');
            editableElements.forEach(element => {
                element.classList.remove('mas-multi-selectable');
            });
            
            this.closeBatchPanel();
        }

        handleElementClick(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const element = e.target.closest('[data-woow-editable="true"]');
            if (!element) return;

            if (e.ctrlKey) {
                // Toggle selection
                if (this.selectedElements.has(element)) {
                    this.deselectElement(element);
                } else {
                    this.selectElement(element);
                }
            } else if (e.shiftKey && this.lastSelectedElement) {
                // Range selection
                this.selectRange(this.lastSelectedElement, element);
            } else {
                // Single selection (replace current)
                this.deselectAll();
                this.selectElement(element);
            }
            
            this.lastSelectedElement = element;
            this.updateSelectionDisplay();
        }

        selectElement(element) {
            this.selectedElements.add(element);
            element.classList.add('mas-selected');
            element.setAttribute('aria-selected', 'true');
            
            // Add selection indicator
            if (!element.querySelector('.mas-selection-indicator')) {
                const indicator = document.createElement('div');
                indicator.className = 'mas-selection-indicator';
                indicator.innerHTML = '<span class="dashicons dashicons-yes"></span>';
                element.appendChild(indicator);
            }
            
            this.announceToUser(`Selected: ${this.getElementDescription(element)}`);
            this.updateCommonProperties();
        }

        deselectElement(element) {
            this.selectedElements.delete(element);
            element.classList.remove('mas-selected');
            element.setAttribute('aria-selected', 'false');
            
            // Remove selection indicator
            const indicator = element.querySelector('.mas-selection-indicator');
            if (indicator) {
                indicator.remove();
            }
            
            this.updateCommonProperties();
        }

        selectAll() {
            const editableElements = document.querySelectorAll('[data-woow-editable="true"]');
            editableElements.forEach(element => {
                this.selectElement(element);
            });
            this.updateSelectionDisplay();
            this.announceToUser(`Selected all ${editableElements.length} elements`);
        }

        deselectAll() {
            this.selectedElements.forEach(element => {
                this.deselectElement(element);
            });
            this.updateSelectionDisplay();
            this.announceToUser('All elements deselected');
        }

        invertSelection() {
            const editableElements = document.querySelectorAll('[data-woow-editable="true"]');
            editableElements.forEach(element => {
                if (this.selectedElements.has(element)) {
                    this.deselectElement(element);
                } else {
                    this.selectElement(element);
                }
            });
            this.updateSelectionDisplay();
            this.announceToUser('Selection inverted');
        }

        selectRange(startElement, endElement) {
            const editableElements = Array.from(document.querySelectorAll('[data-woow-editable="true"]'));
            const startIndex = editableElements.indexOf(startElement);
            const endIndex = editableElements.indexOf(endElement);
            
            const minIndex = Math.min(startIndex, endIndex);
            const maxIndex = Math.max(startIndex, endIndex);
            
            for (let i = minIndex; i <= maxIndex; i++) {
                this.selectElement(editableElements[i]);
            }
            
            this.announceToUser(`Selected range: ${maxIndex - minIndex + 1} elements`);
        }

        selectElementsInBox(left, top, width, height) {
            const editableElements = document.querySelectorAll('[data-woow-editable="true"]');
            const selectionRect = { left, top, right: left + width, bottom: top + height };
            
            editableElements.forEach(element => {
                const rect = element.getBoundingClientRect();
                const elementRect = {
                    left: rect.left,
                    top: rect.top,
                    right: rect.right,
                    bottom: rect.bottom
                };
                
                if (this.rectsIntersect(selectionRect, elementRect)) {
                    this.selectElement(element);
                } else if (!this.dragStartPos) {
                    this.deselectElement(element);
                }
            });
        }

        rectsIntersect(rect1, rect2) {
            return !(rect1.right < rect2.left || 
                    rect1.left > rect2.right || 
                    rect1.bottom < rect2.top || 
                    rect1.top > rect2.bottom);
        }

        showSelectionBox(x, y, width, height) {
            this.selectionBox.style.display = 'block';
            this.selectionBox.style.left = x + 'px';
            this.selectionBox.style.top = y + 'px';
            this.selectionBox.style.width = width + 'px';
            this.selectionBox.style.height = height + 'px';
        }

        updateSelectionBox(x, y, width, height) {
            this.selectionBox.style.left = x + 'px';
            this.selectionBox.style.top = y + 'px';
            this.selectionBox.style.width = width + 'px';
            this.selectionBox.style.height = height + 'px';
        }

        hideSelectionBox() {
            this.selectionBox.style.display = 'none';
        }

        updateSelectionDisplay() {
            const count = this.selectedElements.size;
            const countElement = this.selectionOverlay.querySelector('.count');
            countElement.textContent = count;
            
            // Update button states
            const buttons = this.selectionOverlay.querySelectorAll('.mas-selection-btn');
            buttons.forEach(btn => {
                const action = btn.dataset.action;
                if (action === 'bulk-edit') {
                    btn.disabled = count === 0;
                    btn.classList.toggle('disabled', count === 0);
                }
            });
            
            // Show/hide batch panel
            if (count > 1) {
                this.showBatchPanel();
            } else {
                this.hideBatchPanel();
            }
        }

        createBatchPanel() {
            this.batchPanel = document.createElement('div');
            this.batchPanel.className = 'mas-batch-panel';
            this.batchPanel.innerHTML = `
                <div class="mas-batch-header">
                    <h4>Bulk Edit (<span class="selection-count">0</span> elements)</h4>
                    <button class="mas-batch-close" aria-label="Close bulk edit panel">
                        <span class="dashicons dashicons-no"></span>
                    </button>
                </div>
                <div class="mas-batch-content">
                    <div class="mas-batch-section">
                        <h5>Common Properties</h5>
                        <div class="mas-common-props"></div>
                    </div>
                    <div class="mas-batch-section">
                        <h5>Bulk Actions</h5>
                        <div class="mas-bulk-actions">
                            <button class="mas-bulk-btn" data-action="apply-preset">Apply Preset</button>
                            <button class="mas-bulk-btn" data-action="reset-all">Reset All</button>
                            <button class="mas-bulk-btn" data-action="copy-styles">Copy Styles</button>
                            <button class="mas-bulk-btn" data-action="paste-styles">Paste Styles</button>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.appendChild(this.batchPanel);
            this.setupBatchPanelEvents();
        }

        setupBatchPanelEvents() {
            const closeBtn = this.batchPanel.querySelector('.mas-batch-close');
            closeBtn.addEventListener('click', () => {
                this.hideBatchPanel();
            });
            
            const actionButtons = this.batchPanel.querySelectorAll('.mas-bulk-btn');
            actionButtons.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const action = e.target.dataset.action;
                    this.handleBulkAction(action);
                });
            });
        }

        showBatchPanel() {
            if (this.selectedElements.size <= 1) return;
            
            this.batchPanel.classList.add('mas-visible');
            this.updateBatchPanelContent();
            
            // Position panel
            const rect = this.batchPanel.getBoundingClientRect();
            this.batchPanel.style.left = `${window.innerWidth - rect.width - 20}px`;
            this.batchPanel.style.top = '100px';
        }

        hideBatchPanel() {
            this.batchPanel.classList.remove('mas-visible');
        }

        updateBatchPanelContent() {
            const count = this.selectedElements.size;
            const countElement = this.batchPanel.querySelector('.selection-count');
            countElement.textContent = count;
            
            // Update common properties
            this.updateCommonPropertiesDisplay();
        }

        updateCommonProperties() {
            this.commonProperties.clear();
            
            if (this.selectedElements.size === 0) return;
            
            const firstElement = Array.from(this.selectedElements)[0];
            const firstConfig = this.getElementConfig(firstElement);
            
            // Find properties common to all selected elements
            if (firstConfig && firstConfig.options) {
                firstConfig.options.forEach(option => {
                    let isCommon = true;
                    let allSameValue = true;
                    let firstValue = null;
                    
                    for (const element of this.selectedElements) {
                        const config = this.getElementConfig(element);
                        const hasOption = config?.options?.some(opt => opt.id === option.id);
                        
                        if (!hasOption) {
                            isCommon = false;
                            break;
                        }
                        
                        const value = this.getCurrentValue(element, option);
                        if (firstValue === null) {
                            firstValue = value;
                        } else if (firstValue !== value) {
                            allSameValue = false;
                        }
                    }
                    
                    if (isCommon) {
                        this.commonProperties.set(option.id, {
                            option: option,
                            hasCommonValue: allSameValue,
                            commonValue: allSameValue ? firstValue : null
                        });
                    }
                });
            }
        }

        updateCommonPropertiesDisplay() {
            const container = this.batchPanel.querySelector('.mas-common-props');
            container.innerHTML = '';
            
            if (this.commonProperties.size === 0) {
                container.innerHTML = '<p class="no-common-props">No common properties found</p>';
                return;
            }
            
            this.commonProperties.forEach((data, optionId) => {
                const { option, hasCommonValue, commonValue } = data;
                const controlHTML = this.createBulkControlHTML(option, hasCommonValue, commonValue);
                container.appendChild(controlHTML);
            });
        }

        createBulkControlHTML(option, hasCommonValue, commonValue) {
            const wrapper = document.createElement('div');
            wrapper.className = 'mas-bulk-control';
            wrapper.dataset.optionId = option.id;
            
            const displayValue = hasCommonValue ? commonValue : 'Mixed values';
            const placeholder = hasCommonValue ? '' : 'placeholder="Mixed values"';
            
            let inputHTML = '';
            switch (option.type) {
                case 'color':
                    inputHTML = `<input type="color" value="${hasCommonValue ? commonValue : '#000000'}" ${placeholder}>`;
                    break;
                case 'range':
                    inputHTML = `
                        <input type="range" 
                               min="${option.min || 0}" 
                               max="${option.max || 100}" 
                               value="${hasCommonValue ? commonValue : option.min || 0}"
                               ${placeholder}>
                        <span class="value">${displayValue}</span>
                    `;
                    break;
                case 'select':
                    const options = option.options.map(opt => 
                        `<option value="${opt.value}" ${hasCommonValue && opt.value === commonValue ? 'selected' : ''}>${opt.label}</option>`
                    ).join('');
                    inputHTML = `<select ${placeholder}>${options}</select>`;
                    break;
                default:
                    inputHTML = `<input type="text" value="${hasCommonValue ? commonValue : ''}" ${placeholder}>`;
            }
            
            wrapper.innerHTML = `
                <label>${option.label}</label>
                ${inputHTML}
                <div class="bulk-status ${hasCommonValue ? 'common' : 'mixed'}">
                    ${hasCommonValue ? 'Common value' : 'Mixed values'}
                </div>
            `;
            
            // Add event listener for bulk changes
            const input = wrapper.querySelector('input, select');
            input.addEventListener('change', (e) => {
                this.applyBulkChange(option.id, e.target.value);
            });
            
            return wrapper;
        }

        applyBulkChange(optionId, value) {
            const undoRedoManager = window.UnifiedLiveEdit.UndoRedoManager;
            
            // Start batch operation for undo/redo
            if (undoRedoManager) {
                undoRedoManager.startBatchOperation();
            }
            
            this.selectedElements.forEach(element => {
                const config = this.getElementConfig(element);
                const option = config?.options?.find(opt => opt.id === optionId);
                
                if (option) {
                    this.applyValueToElement(element, option, value);
                }
            });
            
            // End batch operation
            if (undoRedoManager) {
                undoRedoManager.endBatchOperation(`Bulk edit: ${optionId} = ${value}`);
            }
            
            this.announceToUser(`Applied ${optionId} = ${value} to ${this.selectedElements.size} elements`);
            this.updateCommonProperties();
            this.updateCommonPropertiesDisplay();
        }

        handleBulkAction(action) {
            switch (action) {
                case 'apply-preset':
                    this.showPresetSelector();
                    break;
                case 'reset-all':
                    this.resetAllSelected();
                    break;
                case 'copy-styles':
                    this.copySelectedStyles();
                    break;
                case 'paste-styles':
                    this.pasteSelectedStyles();
                    break;
            }
        }

        resetAllSelected() {
            const undoRedoManager = window.UnifiedLiveEdit.UndoRedoManager;
            
            if (undoRedoManager) {
                undoRedoManager.startBatchOperation();
            }
            
            this.selectedElements.forEach(element => {
                const config = this.getElementConfig(element);
                if (config?.options) {
                    config.options.forEach(option => {
                        this.applyValueToElement(element, option, option.default);
                    });
                }
            });
            
            if (undoRedoManager) {
                undoRedoManager.endBatchOperation(`Reset ${this.selectedElements.size} elements`);
            }
            
            this.announceToUser(`Reset ${this.selectedElements.size} elements to default values`);
            this.updateCommonProperties();
            this.updateCommonPropertiesDisplay();
        }

        // Utility methods
        handleAction(action) {
            switch (action) {
                case 'select-all':
                    this.selectAll();
                    break;
                case 'deselect-all':
                    this.deselectAll();
                    break;
                case 'invert-selection':
                    this.invertSelection();
                    break;
                case 'bulk-edit':
                    this.openBulkEdit();
                    break;
            }
        }

        openBulkEdit() {
            if (this.selectedElements.size > 1) {
                this.showBatchPanel();
                this.announceToUser('Bulk edit panel opened');
            }
        }

        getElementConfig(element) {
            // Get configuration for element (similar to LiveEditEngine)
            const elementType = element.tagName.toLowerCase();
            const classes = Array.from(element.classList);
            
            // Return mock config for now - in real implementation, this would
            // interface with the existing configuration system
            return {
                options: [
                    { id: 'background_color', label: 'Background Color', type: 'color', default: '#ffffff' },
                    { id: 'text_color', label: 'Text Color', type: 'color', default: '#000000' },
                    { id: 'font_size', label: 'Font Size', type: 'range', min: 12, max: 48, default: 16 },
                    { id: 'padding', label: 'Padding', type: 'range', min: 0, max: 50, default: 10 }
                ]
            };
        }

        getCurrentValue(element, option) {
            // Get current value for option from element
            const computedStyle = window.getComputedStyle(element);
            
            switch (option.id) {
                case 'background_color':
                    return this.rgbToHex(computedStyle.backgroundColor);
                case 'text_color':
                    return this.rgbToHex(computedStyle.color);
                case 'font_size':
                    return parseInt(computedStyle.fontSize);
                case 'padding':
                    return parseInt(computedStyle.padding);
                default:
                    return option.default;
            }
        }

        applyValueToElement(element, option, value) {
            // Apply value to element
            switch (option.id) {
                case 'background_color':
                    element.style.backgroundColor = value;
                    break;
                case 'text_color':
                    element.style.color = value;
                    break;
                case 'font_size':
                    element.style.fontSize = value + 'px';
                    break;
                case 'padding':
                    element.style.padding = value + 'px';
                    break;
            }
        }

        rgbToHex(rgb) {
            const result = rgb.match(/\d+/g);
            if (!result) return '#000000';
            
            const hex = result.map(x => {
                const hex = parseInt(x).toString(16);
                return hex.length === 1 ? '0' + hex : hex;
            }).join('');
            
            return '#' + hex;
        }

        getElementDescription(element) {
            const tag = element.tagName.toLowerCase();
            const id = element.id ? `#${element.id}` : '';
            const classes = element.className ? `.${element.className.split(' ').join('.')}` : '';
            return `${tag}${id}${classes}`;
        }

        getShortcutKey(e) {
            const parts = [];
            if (e.ctrlKey) parts.push('Ctrl');
            if (e.altKey) parts.push('Alt');
            if (e.shiftKey) parts.push('Shift');
            if (e.metaKey) parts.push('Meta');
            parts.push(e.key);
            return parts.join('+');
        }

        announceToUser(message) {
            if (window.UnifiedLiveEdit?.AccessibilityManager) {
                window.UnifiedLiveEdit.AccessibilityManager.announceToUser(message);
            }
        }

        exitMultiSelectMode() {
            this.disableBatchMode();
            this.announceToUser('Exited multi-select mode');
        }

        closeBatchPanel() {
            this.hideBatchPanel();
        }

        // Public API
        getSelectedElements() {
            return Array.from(this.selectedElements);
        }

        getSelectedCount() {
            return this.selectedElements.size;
        }

        isElementSelected(element) {
            return this.selectedElements.has(element);
        }

        selectElementById(elementId) {
            const element = document.getElementById(elementId);
            if (element && element.hasAttribute('data-woow-editable')) {
                this.selectElement(element);
                this.updateSelectionDisplay();
            }
        }

        getCommonProperties() {
            return new Map(this.commonProperties);
        }
    }

    // ========================================================================
    // 🎯 MODULE: AutoCompleteEngine (Value suggestions)
    // ========================================================================
    class AutoCompleteEngine {
        constructor() {
            this.valueDatabase = {
                colors: [
                    { value: '#ffffff', title: 'White', category: 'Basic Colors' },
                    { value: '#000000', title: 'Black', category: 'Basic Colors' },
                    { value: '#ff0000', title: 'Red', category: 'Basic Colors' },
                    { value: '#00ff00', title: 'Green', category: 'Basic Colors' },
                    { value: '#0000ff', title: 'Blue', category: 'Basic Colors' },
                    { value: '#007cba', title: 'WordPress Blue', category: 'WordPress Colors' },
                    { value: '#00a0d2', title: 'WordPress Light Blue', category: 'WordPress Colors' },
                    { value: '#d63638', title: 'WordPress Red', category: 'WordPress Colors' },
                    { value: '#00ba37', title: 'WordPress Green', category: 'WordPress Colors' },
                    { value: '#ffb900', title: 'WordPress Yellow', category: 'WordPress Colors' }
                ],
                dimensions: [
                    { value: '0px', title: 'No spacing', category: 'Spacing' },
                    { value: '4px', title: 'Extra small', category: 'Spacing' },
                    { value: '8px', title: 'Small', category: 'Spacing' },
                    { value: '12px', title: 'Medium', category: 'Spacing' },
                    { value: '16px', title: 'Large', category: 'Spacing' },
                    { value: '24px', title: 'Extra large', category: 'Spacing' },
                    { value: '32px', title: 'XX Large', category: 'Spacing' },
                    { value: '100%', title: 'Full width', category: 'Dimensions' },
                    { value: '50%', title: 'Half width', category: 'Dimensions' },
                    { value: 'auto', title: 'Automatic', category: 'Dimensions' }
                ],
                fonts: [
                    { value: 'system-ui', title: 'System UI', category: 'System Fonts' },
                    { value: '-apple-system', title: 'Apple System', category: 'System Fonts' },
                    { value: 'BlinkMacSystemFont', title: 'Blink Mac', category: 'System Fonts' },
                    { value: '"Segoe UI"', title: 'Segoe UI', category: 'System Fonts' },
                    { value: 'Roboto', title: 'Roboto', category: 'Google Fonts' },
                    { value: 'Inter', title: 'Inter', category: 'Google Fonts' },
                    { value: '"Open Sans"', title: 'Open Sans', category: 'Google Fonts' },
                    { value: 'Arial', title: 'Arial', category: 'Web Safe' },
                    { value: 'Helvetica', title: 'Helvetica', category: 'Web Safe' },
                    { value: 'sans-serif', title: 'Sans Serif', category: 'Generic' }
                ],
                transitions: [
                    { value: 'all 0.2s ease', title: 'Quick transition', category: 'Transitions' },
                    { value: 'all 0.3s ease', title: 'Medium transition', category: 'Transitions' },
                    { value: 'all 0.5s ease', title: 'Slow transition', category: 'Transitions' },
                    { value: 'transform 0.2s ease', title: 'Transform only', category: 'Transitions' },
                    { value: 'opacity 0.3s ease', title: 'Opacity only', category: 'Transitions' },
                    { value: 'none', title: 'No transition', category: 'Transitions' }
                ]
            };
            this.recentValues = [];
            this.contextualSuggestions = [];
        }

        init() {
            this.loadRecentValues();
            this.setupContextualAnalysis();
        }

        getSuggestions(input, currentValue, optionType) {
            const suggestions = [];
            const searchTerm = currentValue.toLowerCase();

            // Get relevant value set based on option type
            const valueSet = this.getValueSetForType(optionType);
            
            // Filter by search term
            const filteredValues = valueSet.filter(item => 
                item.value.toLowerCase().includes(searchTerm) ||
                item.title.toLowerCase().includes(searchTerm)
            );

            // Add filtered values
            suggestions.push(...filteredValues);

            // Add recent values
            const recentFiltered = this.recentValues.filter(item => 
                item.value.toLowerCase().includes(searchTerm) && 
                !suggestions.find(s => s.value === item.value)
            );
            suggestions.push(...recentFiltered);

            // Add contextual suggestions
            const contextual = this.getContextualSuggestions(input, optionType);
            suggestions.push(...contextual);

            return suggestions.slice(0, 10); // Limit to 10 suggestions
        }

        getValueSetForType(optionType) {
            switch (optionType) {
                case 'color':
                    return this.valueDatabase.colors;
                case 'dimension':
                case 'slider':
                    return this.valueDatabase.dimensions;
                case 'font':
                    return this.valueDatabase.fonts;
                case 'transition':
                    return this.valueDatabase.transitions;
                default:
                    return [];
            }
        }

        getContextualSuggestions(input, optionType) {
            const suggestions = [];
            
            // Analyze current page styles
            const currentStyles = this.analyzeCurrentStyles();
            
            // Suggest harmonious values
            if (optionType === 'color') {
                suggestions.push(...this.suggestHarmoniousColors(currentStyles.colors));
            } else if (optionType === 'dimension') {
                suggestions.push(...this.suggestConsistentDimensions(currentStyles.dimensions));
            }

            return suggestions;
        }

        analyzeCurrentStyles() {
            const computedStyles = getComputedStyle(document.documentElement);
            const colors = [];
            const dimensions = [];

            // Extract CSS variables
            const cssVars = Array.from(document.styleSheets).flatMap(sheet => {
                try {
                    return Array.from(sheet.cssRules);
                } catch (e) {
                    return [];
                }
            }).filter(rule => rule.style && rule.selectorText === ':root');

            cssVars.forEach(rule => {
                Array.from(rule.style).forEach(prop => {
                    if (prop.startsWith('--')) {
                        const value = rule.style.getPropertyValue(prop);
                        if (this.isColor(value)) {
                            colors.push(value);
                        } else if (this.isDimension(value)) {
                            dimensions.push(value);
                        }
                    }
                });
            });

            return { colors, dimensions };
        }

        suggestHarmoniousColors(existingColors) {
            // This would integrate with ColorHarmonyEngine
            return [];
        }

        suggestConsistentDimensions(existingDimensions) {
            const suggestions = [];
            const uniqueDimensions = [...new Set(existingDimensions)];
            
            uniqueDimensions.forEach(dim => {
                const numValue = parseInt(dim);
                if (!isNaN(numValue)) {
                    suggestions.push({
                        value: `${numValue * 0.5}px`,
                        title: `Half of ${dim}`,
                        category: 'Proportional'
                    });
                    suggestions.push({
                        value: `${numValue * 2}px`,
                        title: `Double of ${dim}`,
                        category: 'Proportional'
                    });
                }
            });

            return suggestions;
        }

        isColor(value) {
            return /^#[0-9a-f]{3,6}$/i.test(value) || 
                   /^rgba?\(/i.test(value) || 
                   /^hsla?\(/i.test(value);
        }

        isDimension(value) {
            return /^\d+(\.\d+)?(px|em|rem|%|vh|vw)$/.test(value);
        }

        addToRecent(value, title, category) {
            const recentItem = { value, title, category, timestamp: Date.now() };
            this.recentValues.unshift(recentItem);
            this.recentValues = this.recentValues.slice(0, 20); // Keep only 20 recent
            this.saveRecentValues();
        }

        loadRecentValues() {
            try {
                const recent = localStorage.getItem('mas-recent-values');
                this.recentValues = recent ? JSON.parse(recent) : [];
            } catch (error) {
                console.error('Error loading recent values:', error);
                this.recentValues = [];
            }
        }

        saveRecentValues() {
            try {
                localStorage.setItem('mas-recent-values', JSON.stringify(this.recentValues));
            } catch (error) {
                console.error('Error saving recent values:', error);
            }
        }

        setupContextualAnalysis() {
            // Analyze the current page and build contextual suggestions
            this.analyzeCurrentStyles();
        }
    }

    // ========================================================================
    // 🌈 MODULE: ColorHarmonyEngine (Color suggestions)
    // ========================================================================
    class ColorHarmonyEngine {
        constructor() {
            this.colorPalettes = {
                monochromatic: 'Monochromatic',
                analogous: 'Analogous',
                complementary: 'Complementary',
                triadic: 'Triadic',
                tetradic: 'Tetradic',
                splitComplementary: 'Split Complementary'
            };
            this.currentPalette = [];
            this.colorHistory = [];
        }

        init() {
            this.loadColorHistory();
            this.analyzeCurrentColors();
        }

        generateColorSuggestions(baseColor, harmony = 'complementary') {
            const suggestions = [];
            const hsl = this.hexToHsl(baseColor);
            
            if (!hsl) return suggestions;

            switch (harmony) {
                case 'monochromatic':
                    suggestions.push(...this.generateMonochromatic(hsl));
                    break;
                case 'analogous':
                    suggestions.push(...this.generateAnalogous(hsl));
                    break;
                case 'complementary':
                    suggestions.push(...this.generateComplementary(hsl));
                    break;
                case 'triadic':
                    suggestions.push(...this.generateTriadic(hsl));
                    break;
                case 'tetradic':
                    suggestions.push(...this.generateTetradic(hsl));
                    break;
                case 'splitComplementary':
                    suggestions.push(...this.generateSplitComplementary(hsl));
                    break;
            }

            return suggestions.map(color => ({
                value: color,
                title: this.getColorName(color),
                category: this.colorPalettes[harmony],
                preview: color
            }));
        }

        generateMonochromatic(hsl) {
            const [h, s, l] = hsl;
            const variations = [];
            
            // Generate lighter and darker versions
            for (let i = 1; i <= 4; i++) {
                const lighter = Math.min(100, l + (i * 15));
                const darker = Math.max(0, l - (i * 15));
                
                variations.push(this.hslToHex([h, s, lighter]));
                variations.push(this.hslToHex([h, s, darker]));
            }
            
            return variations;
        }

        generateAnalogous(hsl) {
            const [h, s, l] = hsl;
            const variations = [];
            
            // Generate colors 30 degrees apart
            for (let i = 1; i <= 2; i++) {
                const hue1 = (h + (i * 30)) % 360;
                const hue2 = (h - (i * 30) + 360) % 360;
                
                variations.push(this.hslToHex([hue1, s, l]));
                variations.push(this.hslToHex([hue2, s, l]));
            }
            
            return variations;
        }

        generateComplementary(hsl) {
            const [h, s, l] = hsl;
            const complementaryHue = (h + 180) % 360;
            
            return [
                this.hslToHex([complementaryHue, s, l]),
                this.hslToHex([complementaryHue, s, Math.max(0, l - 20)]),
                this.hslToHex([complementaryHue, s, Math.min(100, l + 20)])
            ];
        }

        generateTriadic(hsl) {
            const [h, s, l] = hsl;
            const hue1 = (h + 120) % 360;
            const hue2 = (h + 240) % 360;
            
            return [
                this.hslToHex([hue1, s, l]),
                this.hslToHex([hue2, s, l]),
                this.hslToHex([hue1, s, Math.max(0, l - 15)]),
                this.hslToHex([hue2, s, Math.max(0, l - 15)])
            ];
        }

        generateTetradic(hsl) {
            const [h, s, l] = hsl;
            const hue1 = (h + 90) % 360;
            const hue2 = (h + 180) % 360;
            const hue3 = (h + 270) % 360;
            
            return [
                this.hslToHex([hue1, s, l]),
                this.hslToHex([hue2, s, l]),
                this.hslToHex([hue3, s, l])
            ];
        }

        generateSplitComplementary(hsl) {
            const [h, s, l] = hsl;
            const hue1 = (h + 150) % 360;
            const hue2 = (h + 210) % 360;
            
            return [
                this.hslToHex([hue1, s, l]),
                this.hslToHex([hue2, s, l]),
                this.hslToHex([hue1, s, Math.max(0, l - 20)]),
                this.hslToHex([hue2, s, Math.max(0, l - 20)])
            ];
        }

        hexToHsl(hex) {
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            if (!result) return null;
            
            let r = parseInt(result[1], 16) / 255;
            let g = parseInt(result[2], 16) / 255;
            let b = parseInt(result[3], 16) / 255;
            
            const max = Math.max(r, g, b);
            const min = Math.min(r, g, b);
            let h, s, l = (max + min) / 2;
            
            if (max === min) {
                h = s = 0;
            } else {
                const d = max - min;
                s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
                switch (max) {
                    case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                    case g: h = (b - r) / d + 2; break;
                    case b: h = (r - g) / d + 4; break;
                }
                h /= 6;
            }
            
            return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
        }

        hslToHex(hsl) {
            const [h, s, l] = hsl;
            const hDecimal = h / 360;
            const sDecimal = s / 100;
            const lDecimal = l / 100;
            
            const c = (1 - Math.abs(2 * lDecimal - 1)) * sDecimal;
            const x = c * (1 - Math.abs((hDecimal * 6) % 2 - 1));
            const m = lDecimal - c / 2;
            
            let r, g, b;
            
            if (hDecimal < 1/6) {
                r = c; g = x; b = 0;
            } else if (hDecimal < 2/6) {
                r = x; g = c; b = 0;
            } else if (hDecimal < 3/6) {
                r = 0; g = c; b = x;
            } else if (hDecimal < 4/6) {
                r = 0; g = x; b = c;
            } else if (hDecimal < 5/6) {
                r = x; g = 0; b = c;
            } else {
                r = c; g = 0; b = x;
            }
            
            r = Math.round((r + m) * 255);
            g = Math.round((g + m) * 255);
            b = Math.round((b + m) * 255);
            
            return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
        }

        getColorName(hex) {
            // Simple color name detection
            const colorNames = {
                '#ffffff': 'White',
                '#000000': 'Black',
                '#ff0000': 'Red',
                '#00ff00': 'Green',
                '#0000ff': 'Blue',
                '#ffff00': 'Yellow',
                '#ff00ff': 'Magenta',
                '#00ffff': 'Cyan'
            };
            
            return colorNames[hex.toLowerCase()] || `Color ${hex}`;
        }

        analyzeCurrentColors() {
            const currentColors = [];
            const cssVars = document.querySelectorAll(':root');
            
            // Extract colors from CSS variables
            cssVars.forEach(root => {
                const styles = getComputedStyle(root);
                for (let i = 0; i < styles.length; i++) {
                    const prop = styles[i];
                    if (prop.startsWith('--') && prop.includes('color')) {
                        const value = styles.getPropertyValue(prop);
                        if (this.isValidColor(value)) {
                            currentColors.push(value);
                        }
                    }
                }
            });
            
            this.currentPalette = currentColors;
        }

        isValidColor(color) {
            const s = new Option().style;
            s.color = color;
            return s.color !== '';
        }

        loadColorHistory() {
            try {
                const history = localStorage.getItem('mas-color-history');
                this.colorHistory = history ? JSON.parse(history) : [];
            } catch (error) {
                console.error('Error loading color history:', error);
                this.colorHistory = [];
            }
        }

        saveColorHistory() {
            try {
                localStorage.setItem('mas-color-history', JSON.stringify(this.colorHistory));
            } catch (error) {
                console.error('Error saving color history:', error);
            }
        }

        addToHistory(color) {
            this.colorHistory.unshift(color);
            this.colorHistory = this.colorHistory.slice(0, 50); // Keep only 50 colors
            this.saveColorHistory();
        }
    }

    // ========================================================================
    // 📱 MODULE: ResponsiveBreakpointEngine (Responsive suggestions)
    // ========================================================================
    class ResponsiveBreakpointEngine {
        constructor() {
            this.breakpoints = {
                mobile: { max: 767, label: 'Mobile' },
                tablet: { min: 768, max: 1023, label: 'Tablet' },
                desktop: { min: 1024, max: 1199, label: 'Desktop' },
                large: { min: 1200, label: 'Large Desktop' }
            };
            this.currentBreakpoint = this.getCurrentBreakpoint();
        }

        init() {
            this.setupBreakpointDetection();
            this.monitorViewportChanges();
        }

        getCurrentBreakpoint() {
            const width = window.innerWidth;
            
            for (const [name, bp] of Object.entries(this.breakpoints)) {
                if (bp.min && bp.max) {
                    if (width >= bp.min && width <= bp.max) {
                        return name;
                    }
                } else if (bp.min && width >= bp.min) {
                    return name;
                } else if (bp.max && width <= bp.max) {
                    return name;
                }
            }
            
            return 'desktop';
        }

        getResponsiveSuggestions(property, currentValue) {
            const suggestions = [];
            const currentBp = this.getCurrentBreakpoint();
            
            // Generate responsive variations
            if (property.includes('font-size') || property.includes('size')) {
                suggestions.push(...this.generateFontSizeSuggestions(currentValue, currentBp));
            } else if (property.includes('width') || property.includes('height')) {
                suggestions.push(...this.generateDimensionSuggestions(currentValue, currentBp));
            } else if (property.includes('padding') || property.includes('margin')) {
                suggestions.push(...this.generateSpacingSuggestions(currentValue, currentBp));
            }

            return suggestions;
        }

        generateFontSizeSuggestions(currentValue, breakpoint) {
            const suggestions = [];
            const baseSize = parseInt(currentValue) || 16;
            
            const scales = {
                mobile: [0.8, 0.9, 1.0, 1.1, 1.2],
                tablet: [0.9, 1.0, 1.1, 1.2, 1.3],
                desktop: [1.0, 1.1, 1.2, 1.3, 1.4],
                large: [1.1, 1.2, 1.3, 1.4, 1.5]
            };

            const currentScales = scales[breakpoint] || scales.desktop;
            
            currentScales.forEach(scale => {
                const size = Math.round(baseSize * scale);
                suggestions.push({
                    value: `${size}px`,
                    title: `${size}px (${this.breakpoints[breakpoint].label})`,
                    category: `${this.breakpoints[breakpoint].label} Font Sizes`,
                    description: `Optimized for ${this.breakpoints[breakpoint].label.toLowerCase()} screens`
                });
            });

            return suggestions;
        }

        generateDimensionSuggestions(currentValue, breakpoint) {
            const suggestions = [];
            
            const responsiveUnits = {
                mobile: ['vw', '%', 'px'],
                tablet: ['vw', '%', 'px', 'em'],
                desktop: ['%', 'px', 'em', 'rem'],
                large: ['%', 'px', 'em', 'rem', 'vw']
            };

            const units = responsiveUnits[breakpoint] || responsiveUnits.desktop;
            const baseValue = parseInt(currentValue) || 100;

            units.forEach(unit => {
                let value;
                switch (unit) {
                    case 'vw':
                        value = Math.round(baseValue * 0.1);
                        break;
                    case '%':
                        value = baseValue < 100 ? baseValue : Math.round(baseValue * 0.8);
                        break;
                    case 'em':
                    case 'rem':
                        value = Math.round(baseValue / 16 * 100) / 100;
                        break;
                    default:
                        value = baseValue;
                }

                suggestions.push({
                    value: `${value}${unit}`,
                    title: `${value}${unit} (${this.breakpoints[breakpoint].label})`,
                    category: `${this.breakpoints[breakpoint].label} Dimensions`,
                    description: `Responsive unit for ${this.breakpoints[breakpoint].label.toLowerCase()}`
                });
            });

            return suggestions;
        }

        generateSpacingSuggestions(currentValue, breakpoint) {
            const suggestions = [];
            
            const spacingScales = {
                mobile: [0.5, 0.75, 1.0, 1.25],
                tablet: [0.75, 1.0, 1.25, 1.5],
                desktop: [1.0, 1.25, 1.5, 2.0],
                large: [1.25, 1.5, 2.0, 2.5]
            };

            const scales = spacingScales[breakpoint] || spacingScales.desktop;
            const baseSpacing = parseInt(currentValue) || 16;

            scales.forEach(scale => {
                const spacing = Math.round(baseSpacing * scale);
                suggestions.push({
                    value: `${spacing}px`,
                    title: `${spacing}px (${this.breakpoints[breakpoint].label})`,
                    category: `${this.breakpoints[breakpoint].label} Spacing`,
                    description: `Optimized spacing for ${this.breakpoints[breakpoint].label.toLowerCase()}`
                });
            });

            return suggestions;
        }

        setupBreakpointDetection() {
            window.addEventListener('resize', () => {
                const newBreakpoint = this.getCurrentBreakpoint();
                if (newBreakpoint !== this.currentBreakpoint) {
                    this.currentBreakpoint = newBreakpoint;
                    this.onBreakpointChange(newBreakpoint);
                }
            });
        }

        monitorViewportChanges() {
            if (window.ResizeObserver) {
                const resizeObserver = new ResizeObserver(entries => {
                    for (const entry of entries) {
                        if (entry.target === document.body) {
                            this.onViewportChange(entry.contentRect);
                        }
                    }
                });
                
                resizeObserver.observe(document.body);
            }
        }

        onBreakpointChange(newBreakpoint) {
            console.log(`Breakpoint changed to: ${newBreakpoint}`);
            
            // Dispatch custom event
            const event = new CustomEvent('breakpointChange', {
                detail: { breakpoint: newBreakpoint }
            });
            document.dispatchEvent(event);
        }

        onViewportChange(rect) {
            // Update responsive suggestions based on viewport changes
            if (window.UnifiedLiveEdit && window.UnifiedLiveEdit.smartSuggestions) {
                window.UnifiedLiveEdit.smartSuggestions.refreshSuggestions();
            }
        }

        getBreakpointInfo() {
            return {
                current: this.currentBreakpoint,
                label: this.breakpoints[this.currentBreakpoint].label,
                width: window.innerWidth,
                height: window.innerHeight
            };
        }
    }

    // ========================================================================
    // 🎯 MODULE: SmartSuggestionsManager (Intelligent suggestions system)
    // ========================================================================
    class SmartSuggestionsManager {
        constructor() {
            this.isEnabled = true;
            this.autoCompleteEngine = new AutoCompleteEngine();
            this.colorHarmonyEngine = new ColorHarmonyEngine();
            this.responsiveBreakpointEngine = new ResponsiveBreakpointEngine();
            this.activeDropdown = null;
            this.suggestionCache = new Map();
            this.userPreferences = this.loadUserPreferences();
            this.suggestionHistory = [];
            this.analytics = {
                totalSuggestions: 0,
                acceptedSuggestions: 0,
                rejectedSuggestions: 0,
                categoryUsage: {}
            };
        }

        init() {
            this.setupEventListeners();
            this.injectStyles();
            this.initializeEngines();
            this.setupKeyboardShortcuts();
            console.log('🎯 SmartSuggestionsManager initialized');
        }

        setupEventListeners() {
            document.addEventListener('input', this.handleInputChange.bind(this));
            document.addEventListener('focus', this.handleInputFocus.bind(this));
            document.addEventListener('blur', this.handleInputBlur.bind(this));
            document.addEventListener('click', this.handleDocumentClick.bind(this));
            document.addEventListener('keydown', this.handleKeyDown.bind(this));
        }

        injectStyles() {
            const styleId = 'mas-smart-suggestions-styles';
            if (document.getElementById(styleId)) return;

            const css = `
                .mas-suggestions-dropdown {
                    position: absolute;
                    background: white;
                    border: 1px solid #ddd;
                    border-radius: 8px;
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
                    z-index: 999999;
                    max-height: 300px;
                    overflow-y: auto;
                    backdrop-filter: blur(10px);
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                    font-size: 14px;
                }
                .mas-suggestions-dropdown.dark {
                    background: #2d3748;
                    border-color: #4a5568;
                    color: white;
                }
                .mas-suggestion-item {
                    padding: 12px 16px;
                    cursor: pointer;
                    border-bottom: 1px solid #f1f3f4;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    transition: all 0.2s ease;
                }
                .mas-suggestion-item:hover,
                .mas-suggestion-item.highlighted {
                    background: #f8f9fa;
                    border-left: 3px solid #007cba;
                }
                .dark .mas-suggestion-item {
                    border-bottom-color: #4a5568;
                }
                .dark .mas-suggestion-item:hover,
                .dark .mas-suggestion-item.highlighted {
                    background: #4a5568;
                    border-left-color: #63b3ed;
                }
                .mas-suggestion-icon {
                    font-size: 16px;
                    width: 20px;
                    text-align: center;
                    flex-shrink: 0;
                }
                .mas-suggestion-content {
                    flex: 1;
                    min-width: 0;
                }
                .mas-suggestion-title {
                    font-weight: 600;
                    color: #1a202c;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                .dark .mas-suggestion-title {
                    color: #f7fafc;
                }
                .mas-suggestion-description {
                    font-size: 12px;
                    color: #718096;
                    margin-top: 2px;
                }
                .dark .mas-suggestion-description {
                    color: #a0aec0;
                }
                .mas-suggestion-preview {
                    width: 24px;
                    height: 24px;
                    border-radius: 4px;
                    border: 1px solid #e2e8f0;
                    flex-shrink: 0;
                }
                .mas-suggestion-shortcut {
                    font-size: 11px;
                    color: #a0aec0;
                    background: #edf2f7;
                    padding: 2px 6px;
                    border-radius: 4px;
                    font-family: monospace;
                }
                .dark .mas-suggestion-shortcut {
                    background: #4a5568;
                    color: #cbd5e0;
                }
                .mas-suggestion-category {
                    font-size: 10px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    color: #a0aec0;
                    font-weight: 600;
                    padding: 8px 16px 4px;
                    background: #f8f9fa;
                    border-bottom: 1px solid #e2e8f0;
                    position: sticky;
                    top: 0;
                    z-index: 1;
                }
                .dark .mas-suggestion-category {
                    background: #2d3748;
                    color: #a0aec0;
                    border-bottom-color: #4a5568;
                }
                .mas-suggestion-loading {
                    padding: 16px;
                    text-align: center;
                    color: #718096;
                }
                .mas-suggestion-empty {
                    padding: 16px;
                    text-align: center;
                    color: #718096;
                    font-style: italic;
                }
            `;

            const style = document.createElement('style');
            style.id = styleId;
            style.textContent = css;
            document.head.appendChild(style);
        }

        initializeEngines() {
            this.autoCompleteEngine.init();
            this.colorHarmonyEngine.init();
            this.responsiveBreakpointEngine.init();
        }

        setupKeyboardShortcuts() {
            // Ctrl+Space or Cmd+Space to trigger suggestions
            document.addEventListener('keydown', (e) => {
                if ((e.ctrlKey || e.metaKey) && e.code === 'Space') {
                    e.preventDefault();
                    this.triggerSuggestions(e.target);
                }
            });
        }

        async handleInputChange(e) {
            const input = e.target;
            if (!this.isValidInput(input)) return;

            const value = input.value;
            const cursorPos = input.selectionStart;
            const beforeCursor = value.substring(0, cursorPos);
            const afterCursor = value.substring(cursorPos);

            // Debounce suggestions
            clearTimeout(this.suggestionTimeout);
            this.suggestionTimeout = setTimeout(() => {
                this.showSuggestions(input, beforeCursor, afterCursor);
            }, 300);
        }

        async handleInputFocus(e) {
            const input = e.target;
            if (!this.isValidInput(input)) return;

            // Show suggestions after a brief delay
            setTimeout(() => {
                if (document.activeElement === input) {
                    this.showSuggestions(input, input.value, '');
                }
            }, 500);
        }

        handleInputBlur(e) {
            // Hide suggestions with delay to allow for selection
            setTimeout(() => {
                if (!this.activeDropdown || !this.activeDropdown.contains(document.activeElement)) {
                    this.hideSuggestions();
                }
            }, 200);
        }

        handleDocumentClick(e) {
            if (this.activeDropdown && !this.activeDropdown.contains(e.target)) {
                this.hideSuggestions();
            }
        }

        handleKeyDown(e) {
            if (!this.activeDropdown) return;

            const items = this.activeDropdown.querySelectorAll('.mas-suggestion-item');
            const currentHighlighted = this.activeDropdown.querySelector('.mas-suggestion-item.highlighted');
            let currentIndex = currentHighlighted ? Array.from(items).indexOf(currentHighlighted) : -1;

            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    currentIndex = (currentIndex + 1) % items.length;
                    this.highlightSuggestion(items[currentIndex]);
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    currentIndex = currentIndex <= 0 ? items.length - 1 : currentIndex - 1;
                    this.highlightSuggestion(items[currentIndex]);
                    break;
                case 'Enter':
                    e.preventDefault();
                    if (currentHighlighted) {
                        this.selectSuggestion(currentHighlighted);
                    }
                    break;
                case 'Escape':
                    e.preventDefault();
                    this.hideSuggestions();
                    break;
            }
        }

        loadUserPreferences() {
            try {
                const prefs = localStorage.getItem('mas-suggestions-preferences');
                return prefs ? JSON.parse(prefs) : {
                    autoShow: true,
                    colorHarmony: true,
                    responsiveHints: true,
                    preferredColorFormats: ['hex', 'rgb'],
                    theme: 'auto'
                };
            } catch (error) {
                console.error('Error loading user preferences:', error);
                return {};
            }
        }

        saveUserPreferences() {
            try {
                localStorage.setItem('mas-suggestions-preferences', JSON.stringify(this.userPreferences));
            } catch (error) {
                console.error('Error saving user preferences:', error);
            }
        }

        async showSuggestions(input, beforeCursor, afterCursor) {
            if (!this.isEnabled || !this.isValidInput(input)) return;

            const optionType = this.getOptionType(input);
            const suggestions = await this.generateSuggestions(input, beforeCursor, optionType);

            if (suggestions.length === 0) {
                this.hideSuggestions();
                return;
            }

            this.renderSuggestions(input, suggestions);
            this.analytics.totalSuggestions++;
        }

        async generateSuggestions(input, currentValue, optionType) {
            const suggestions = [];
            const cacheKey = `${optionType}-${currentValue}`;

            // Check cache first
            if (this.suggestionCache.has(cacheKey)) {
                return this.suggestionCache.get(cacheKey);
            }

            // Generate auto-complete suggestions
            const autoComplete = this.autoCompleteEngine.getSuggestions(input, currentValue, optionType);
            suggestions.push(...autoComplete);

            // Generate color harmony suggestions for color fields
            if (optionType === 'color' && this.userPreferences.colorHarmony) {
                const colorSuggestions = await this.generateColorHarmonySuggestions(currentValue);
                suggestions.push(...colorSuggestions);
            }

            // Generate responsive suggestions
            if (this.userPreferences.responsiveHints) {
                const responsiveSuggestions = this.responsiveBreakpointEngine.getResponsiveSuggestions(
                    this.getPropertyFromInput(input), currentValue
                );
                suggestions.push(...responsiveSuggestions);
            }

            // Cache the results
            this.suggestionCache.set(cacheKey, suggestions);
            
            // Clean cache if it gets too large
            if (this.suggestionCache.size > 100) {
                const firstKey = this.suggestionCache.keys().next().value;
                this.suggestionCache.delete(firstKey);
            }

            return suggestions;
        }

        async generateColorHarmonySuggestions(currentValue) {
            if (!this.isValidColor(currentValue)) return [];

            const suggestions = [];
            const harmonies = ['complementary', 'analogous', 'triadic', 'monochromatic'];

            for (const harmony of harmonies) {
                const colorSuggestions = this.colorHarmonyEngine.generateColorSuggestions(currentValue, harmony);
                suggestions.push(...colorSuggestions.slice(0, 3)); // Limit to 3 per harmony
            }

            return suggestions;
        }

        renderSuggestions(input, suggestions) {
            this.hideSuggestions();

            if (suggestions.length === 0) return;

            const dropdown = document.createElement('div');
            dropdown.className = 'mas-suggestions-dropdown';
            dropdown.setAttribute('role', 'listbox');
            dropdown.setAttribute('aria-label', 'Suggestions');

            // Apply theme
            if (this.userPreferences.theme === 'dark' || 
                (this.userPreferences.theme === 'auto' && this.isDarkMode())) {
                dropdown.classList.add('dark');
            }

            // Group suggestions by category
            const groupedSuggestions = this.groupSuggestionsByCategory(suggestions);

            // Render groups
            Object.entries(groupedSuggestions).forEach(([category, items]) => {
                if (items.length === 0) return;

                // Add category header
                const categoryHeader = document.createElement('div');
                categoryHeader.className = 'mas-suggestion-category';
                categoryHeader.textContent = category;
                dropdown.appendChild(categoryHeader);

                // Add suggestions
                items.forEach((suggestion, index) => {
                    const item = this.createSuggestionItem(suggestion, index);
                    dropdown.appendChild(item);
                });
            });

            // Position dropdown
            this.positionDropdown(dropdown, input);
            
            // Add to DOM
            document.body.appendChild(dropdown);
            this.activeDropdown = dropdown;

            // Highlight first item
            const firstItem = dropdown.querySelector('.mas-suggestion-item');
            if (firstItem) {
                this.highlightSuggestion(firstItem);
            }

            // Announce to screen readers
            if (window.UnifiedLiveEdit && window.UnifiedLiveEdit.AccessibilityManager) {
                window.UnifiedLiveEdit.AccessibilityManager.announceToUser(
                    `${suggestions.length} suggestions available`
                );
            }
        }

        createSuggestionItem(suggestion, index) {
            const item = document.createElement('div');
            item.className = 'mas-suggestion-item';
            item.setAttribute('role', 'option');
            item.setAttribute('aria-selected', 'false');
            item.setAttribute('tabindex', '-1');
            item.dataset.value = suggestion.value;
            item.dataset.index = index;

            const icon = document.createElement('div');
            icon.className = 'mas-suggestion-icon';
            icon.textContent = this.getIconForSuggestion(suggestion);
            item.appendChild(icon);

            const content = document.createElement('div');
            content.className = 'mas-suggestion-content';
            
            const title = document.createElement('div');
            title.className = 'mas-suggestion-title';
            title.textContent = suggestion.title;
            content.appendChild(title);

            if (suggestion.description) {
                const description = document.createElement('div');
                description.className = 'mas-suggestion-description';
                description.textContent = suggestion.description;
                content.appendChild(description);
            }

            item.appendChild(content);

            // Add preview for colors
            if (suggestion.preview) {
                const preview = document.createElement('div');
                preview.className = 'mas-suggestion-preview';
                preview.style.backgroundColor = suggestion.preview;
                item.appendChild(preview);
            }

            // Add keyboard shortcut hint
            if (index < 9) {
                const shortcut = document.createElement('div');
                shortcut.className = 'mas-suggestion-shortcut';
                shortcut.textContent = `${index + 1}`;
                item.appendChild(shortcut);
            }

            // Add event listeners
            item.addEventListener('click', () => this.selectSuggestion(item));
            item.addEventListener('mouseenter', () => this.highlightSuggestion(item));

            return item;
        }

        getIconForSuggestion(suggestion) {
            const icons = {
                'Basic Colors': '🎨',
                'WordPress Colors': '🔵',
                'Spacing': '📏',
                'Dimensions': '📐',
                'System Fonts': '🔤',
                'Google Fonts': '🌐',
                'Web Safe': '✅',
                'Transitions': '⚡',
                'Complementary': '🎯',
                'Analogous': '🌈',
                'Triadic': '🔺',
                'Monochromatic': '🎨',
                'Mobile': '📱',
                'Tablet': '📱',
                'Desktop': '💻',
                'Large Desktop': '🖥️',
                'Proportional': '⚖️'
            };

            return icons[suggestion.category] || '💡';
        }

        groupSuggestionsByCategory(suggestions) {
            const groups = {};
            
            suggestions.forEach(suggestion => {
                const category = suggestion.category || 'Other';
                if (!groups[category]) {
                    groups[category] = [];
                }
                groups[category].push(suggestion);
            });

            return groups;
        }

        positionDropdown(dropdown, input) {
            const inputRect = input.getBoundingClientRect();
            const viewport = {
                width: window.innerWidth,
                height: window.innerHeight
            };

            let top = inputRect.bottom + window.scrollY + 4;
            let left = inputRect.left + window.scrollX;

            // Adjust for viewport boundaries
            const dropdownRect = dropdown.getBoundingClientRect();
            
            if (left + dropdownRect.width > viewport.width) {
                left = viewport.width - dropdownRect.width - 10;
            }
            
            if (top + dropdownRect.height > viewport.height + window.scrollY) {
                top = inputRect.top + window.scrollY - dropdownRect.height - 4;
            }

            dropdown.style.position = 'absolute';
            dropdown.style.top = `${top}px`;
            dropdown.style.left = `${left}px`;
            dropdown.style.minWidth = `${inputRect.width}px`;
        }

        highlightSuggestion(item) {
            if (!this.activeDropdown) return;

            // Remove previous highlight
            const prevHighlighted = this.activeDropdown.querySelector('.mas-suggestion-item.highlighted');
            if (prevHighlighted) {
                prevHighlighted.classList.remove('highlighted');
                prevHighlighted.setAttribute('aria-selected', 'false');
            }

            // Add highlight
            item.classList.add('highlighted');
            item.setAttribute('aria-selected', 'true');

            // Scroll into view
            item.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'nearest' 
            });
        }

        selectSuggestion(item) {
            const value = item.dataset.value;
            const input = document.activeElement;
            
            if (!input || !this.isValidInput(input)) return;

            // Apply the suggestion
            this.applySuggestion(input, value);
            
            // Hide dropdown
            this.hideSuggestions();
            
            // Track analytics
            this.analytics.acceptedSuggestions++;
            this.trackSuggestionUsage(item);
            
            // Add to history
            const title = item.querySelector('.mas-suggestion-title').textContent;
            const category = this.findCategoryForItem(item);
            this.autoCompleteEngine.addToRecent(value, title, category);
            
            // Show toast notification
            if (window.UnifiedLiveEdit && window.UnifiedLiveEdit.MASToast) {
                window.UnifiedLiveEdit.MASToast.success(`Applied: ${title}`, 2000);
            }
        }

        applySuggestion(input, value) {
            const oldValue = input.value;
            
            // Set the new value
            input.value = value;
            
            // Trigger change events
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('change', { bubbles: true }));
            
            // Record for undo/redo if available
            if (window.UnifiedLiveEdit && window.UnifiedLiveEdit.UndoRedoManager) {
                window.UnifiedLiveEdit.UndoRedoManager.recordAction(
                    'SUGGESTION_APPLIED',
                    { 
                        input: input,
                        oldValue: oldValue,
                        newValue: value
                    },
                    `Applied suggestion: ${value}`
                );
            }
        }

        hideSuggestions() {
            if (this.activeDropdown) {
                this.activeDropdown.remove();
                this.activeDropdown = null;
            }
        }

        isValidInput(element) {
            if (!element) return false;
            
            // Check if it's a valid input type
            const validTypes = ['input', 'textarea', 'select'];
            const tagName = element.tagName.toLowerCase();
            
            if (!validTypes.includes(tagName)) return false;
            
            // Check if it's in a micro panel or has data attributes
            const hasDataAttr = element.hasAttribute('data-css-var') || 
                               element.hasAttribute('data-option-id') ||
                               element.hasAttribute('data-setting-key');
            
            const inMicroPanel = element.closest('.mas-micro-panel');
            
            return hasDataAttr || inMicroPanel;
        }

        getOptionType(input) {
            // Get type from data attributes
            const dataType = input.getAttribute('data-option-type') || 
                            input.getAttribute('data-type');
            
            if (dataType) return dataType;
            
            // Infer from input attributes
            if (input.type === 'color') return 'color';
            if (input.type === 'range') return 'slider';
            if (input.type === 'number') return 'dimension';
            
            // Infer from CSS variable name
            const cssVar = input.getAttribute('data-css-var');
            if (cssVar) {
                if (cssVar.includes('color') || cssVar.includes('bg')) return 'color';
                if (cssVar.includes('width') || cssVar.includes('height') || cssVar.includes('size')) return 'dimension';
                if (cssVar.includes('font')) return 'font';
            }
            
            // Default
            return 'text';
        }

        getPropertyFromInput(input) {
            const cssVar = input.getAttribute('data-css-var');
            const optionId = input.getAttribute('data-option-id');
            
            return cssVar || optionId || 'unknown';
        }

        isValidColor(color) {
            if (!color) return false;
            
            // Test hex colors
            if (/^#[0-9a-f]{3,6}$/i.test(color)) return true;
            
            // Test other color formats
            const s = new Option().style;
            s.color = color;
            return s.color !== '';
        }

        isDarkMode() {
            return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        }

        findCategoryForItem(item) {
            let current = item.previousElementSibling;
            while (current) {
                if (current.classList.contains('mas-suggestion-category')) {
                    return current.textContent;
                }
                current = current.previousElementSibling;
            }
            return 'Other';
        }

        trackSuggestionUsage(item) {
            const category = this.findCategoryForItem(item);
            if (!this.analytics.categoryUsage[category]) {
                this.analytics.categoryUsage[category] = 0;
            }
            this.analytics.categoryUsage[category]++;
            
            // Add to history
            this.suggestionHistory.push({
                value: item.dataset.value,
                category: category,
                timestamp: Date.now()
            });
            
            // Keep only last 100 entries
            if (this.suggestionHistory.length > 100) {
                this.suggestionHistory.shift();
            }
        }

        triggerSuggestions(input) {
            if (!this.isValidInput(input)) return;
            
            const value = input.value;
            this.showSuggestions(input, value, '');
        }

        refreshSuggestions() {
            // Clear cache to force fresh suggestions
            this.suggestionCache.clear();
            
            // If dropdown is open, refresh it
            if (this.activeDropdown && document.activeElement) {
                this.triggerSuggestions(document.activeElement);
            }
        }

        getAnalytics() {
            return {
                ...this.analytics,
                cacheSize: this.suggestionCache.size,
                historySize: this.suggestionHistory.length,
                acceptanceRate: this.analytics.totalSuggestions > 0 ? 
                    (this.analytics.acceptedSuggestions / this.analytics.totalSuggestions * 100).toFixed(1) : 0
            };
        }

        enable() {
            this.isEnabled = true;
            console.log('🎯 Smart Suggestions enabled');
        }

        disable() {
            this.isEnabled = false;
            this.hideSuggestions();
            console.log('🎯 Smart Suggestions disabled');
        }

        toggle() {
            if (this.isEnabled) {
                this.disable();
            } else {
                this.enable();
            }
        }

        destroy() {
            this.hideSuggestions();
            this.suggestionCache.clear();
            this.isEnabled = false;
            
            // Remove event listeners
            document.removeEventListener('input', this.handleInputChange);
            document.removeEventListener('focus', this.handleInputFocus);
            document.removeEventListener('blur', this.handleInputBlur);
            document.removeEventListener('click', this.handleDocumentClick);
            document.removeEventListener('keydown', this.handleKeyDown);
            
            console.log('🎯 Smart Suggestions destroyed');
        }
    }

    // ========================================================================
    // 🔧 MODULE: LazyLoadManager (Lazy loading system)
    // ========================================================================
    class LazyLoadManager {
        constructor() {
            this.observer = null;
            this.lazyElements = new Set();
            this.loadedElements = new Set();
            this.isAggressiveMode = false;
            this.config = {
                rootMargin: '50px',
                threshold: 0.1
            };
        }

        init() {
            if ('IntersectionObserver' in window) {
                this.observer = new IntersectionObserver(
                    this.handleIntersection.bind(this),
                    this.config
                );
                
                this.setupLazyElements();
            }
        }

        setupLazyElements() {
            // Find elements that should be lazy loaded
            const selectors = [
                '.mas-micro-panel:not(.mas-panel-visible)',
                '.mas-suggestion-item',
                '.mas-control-suggestions',
                '[data-lazy-load="true"]'
            ];
            
            selectors.forEach(selector => {
                document.querySelectorAll(selector).forEach(element => {
                    this.addLazyElement(element);
                });
            });
        }

        addLazyElement(element) {
            if (!this.lazyElements.has(element) && !this.loadedElements.has(element)) {
                this.lazyElements.add(element);
                if (this.observer) {
                    this.observer.observe(element);
                }
            }
        }

        handleIntersection(entries) {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.loadElement(entry.target);
                }
            });
        }

        loadElement(element) {
            if (this.loadedElements.has(element)) return;
            
            // Mark as loaded
            this.lazyElements.delete(element);
            this.loadedElements.add(element);
            this.observer?.unobserve(element);
            
            // Trigger loading based on element type
            if (element.classList.contains('mas-micro-panel')) {
                this.loadMicroPanel(element);
            } else if (element.classList.contains('mas-suggestion-item')) {
                this.loadSuggestionItem(element);
            } else if (element.hasAttribute('data-lazy-load')) {
                this.loadCustomElement(element);
            }
        }

        loadMicroPanel(panel) {
            // Animate panel into view
            panel.style.opacity = '0';
            panel.style.transform = 'scale(0.95)';
            
            requestAnimationFrame(() => {
                panel.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
                panel.style.opacity = '1';
                panel.style.transform = 'scale(1)';
            });
            
            // Initialize panel components
            this.initializePanelComponents(panel);
        }

        loadSuggestionItem(item) {
            // Lazy load suggestion icons and previews
            const icon = item.querySelector('.mas-suggestion-icon:not([data-loaded])');
            const preview = item.querySelector('.mas-suggestion-preview:not([data-loaded])');
            
            if (icon) {
                icon.setAttribute('data-loaded', 'true');
                // Load icon content if needed
            }
            
            if (preview) {
                preview.setAttribute('data-loaded', 'true');
                // Load preview content if needed
            }
        }

        loadCustomElement(element) {
            const loadType = element.getAttribute('data-lazy-load');
            const loadSrc = element.getAttribute('data-lazy-src');
            
            if (loadType === 'content' && loadSrc) {
                fetch(loadSrc)
                    .then(response => response.text())
                    .then(content => {
                        element.innerHTML = content;
                        element.removeAttribute('data-lazy-load');
                    })
                    .catch(error => console.warn('Lazy load failed:', error));
            }
        }

        initializePanelComponents(panel) {
            // Initialize controls inside the panel
            const controls = panel.querySelectorAll('.mas-control:not([data-initialized])');
            
            controls.forEach(control => {
                control.setAttribute('data-initialized', 'true');
                
                // Add staggered animation
                const delay = Array.from(controls).indexOf(control) * 50;
                setTimeout(() => {
                    control.classList.add('mas-animate-in');
                }, delay);
            });
        }

        checkVisibleElements() {
            // Manual check for performance-critical scenarios
            if (this.isAggressiveMode) {
                this.lazyElements.forEach(element => {
                    if (this.isElementVisible(element)) {
                        this.loadElement(element);
                    }
                });
            }
        }

        isElementVisible(element) {
            const rect = element.getBoundingClientRect();
            const viewport = {
                top: 0,
                left: 0,
                bottom: window.innerHeight,
                right: window.innerWidth
            };
            
            return rect.bottom > viewport.top &&
                   rect.right > viewport.left &&
                   rect.top < viewport.bottom &&
                   rect.left < viewport.right;
        }

        updateViewport() {
            // Recalculate lazy loading after viewport changes
            if (this.observer) {
                this.observer.disconnect();
                this.init();
            }
        }

        setAggressiveMode(enabled) {
            this.isAggressiveMode = enabled;
            if (enabled) {
                this.checkVisibleElements();
            }
        }

        getStats() {
            return {
                totalElements: this.lazyElements.size + this.loadedElements.size,
                loadedElements: this.loadedElements.size,
                pendingElements: this.lazyElements.size,
                loadedPercentage: (this.loadedElements.size / (this.lazyElements.size + this.loadedElements.size)) * 100
            };
        }

        destroy() {
            if (this.observer) {
                this.observer.disconnect();
                this.observer = null;
            }
            
            this.lazyElements.clear();
            this.loadedElements.clear();
        }
    }

    // ========================================================================
    // 📜 MODULE: VirtualScrollManager (Virtual scrolling system)
    // ========================================================================
    class VirtualScrollManager {
        constructor() {
            this.containers = new Map();
            this.isPerformanceMode = false;
            this.config = {
                itemHeight: 50,
                bufferSize: 10,
                threshold: 100
            };
        }

        init() {
            this.setupVirtualContainers();
        }

        setupVirtualContainers() {
            // Find containers that should use virtual scrolling
            const selectors = [
                '.mas-suggestions-dropdown',
                '.mas-preset-list',
                '.mas-batch-panel .mas-common-props'
            ];
            
            selectors.forEach(selector => {
                document.querySelectorAll(selector).forEach(container => {
                    this.addVirtualContainer(container);
                });
            });
        }

        addVirtualContainer(container) {
            if (this.containers.has(container)) return;
            
            const items = Array.from(container.children);
            if (items.length < this.config.threshold) return; // Not worth virtualizing
            
            const virtualData = {
                items: items.map(item => ({
                    element: item,
                    height: item.offsetHeight || this.config.itemHeight,
                    data: this.extractItemData(item)
                })),
                visibleRange: { start: 0, end: 0 },
                scrollTop: 0,
                containerHeight: container.offsetHeight,
                totalHeight: 0
            };
            
            virtualData.totalHeight = virtualData.items.reduce((sum, item) => sum + item.height, 0);
            
            this.containers.set(container, virtualData);
            this.setupVirtualScrolling(container, virtualData);
        }

        extractItemData(item) {
            return {
                className: item.className,
                innerHTML: item.innerHTML,
                dataset: { ...item.dataset }
            };
        }

        setupVirtualScrolling(container, virtualData) {
            // Create virtual scroll wrapper
            const wrapper = document.createElement('div');
            wrapper.className = 'mas-virtual-scroll-wrapper';
            wrapper.style.height = `${virtualData.totalHeight}px`;
            wrapper.style.position = 'relative';
            
            // Create visible items container
            const visibleContainer = document.createElement('div');
            visibleContainer.className = 'mas-virtual-visible-items';
            visibleContainer.style.position = 'absolute';
            visibleContainer.style.top = '0';
            visibleContainer.style.width = '100%';
            
            // Replace container content
            container.innerHTML = '';
            container.appendChild(wrapper);
            wrapper.appendChild(visibleContainer);
            
            // Setup scroll handler
            container.addEventListener('scroll', this.createScrollHandler(container, virtualData, visibleContainer));
            
            // Initial render
            this.updateVisibleItems(container, virtualData, visibleContainer);
        }

        createScrollHandler(container, virtualData, visibleContainer) {
            let scrollTimeout;
            
            return () => {
                virtualData.scrollTop = container.scrollTop;
                
                clearTimeout(scrollTimeout);
                scrollTimeout = setTimeout(() => {
                    this.updateVisibleItems(container, virtualData, visibleContainer);
                }, 16); // ~60fps
            };
        }

        updateVisibleItems(container, virtualData, visibleContainer) {
            const scrollTop = virtualData.scrollTop;
            const containerHeight = container.offsetHeight;
            const bufferSize = this.config.bufferSize;
            
            // Calculate visible range
            let startIndex = 0;
            let endIndex = 0;
            let currentTop = 0;
            
            // Find start index
            for (let i = 0; i < virtualData.items.length; i++) {
                if (currentTop + virtualData.items[i].height > scrollTop) {
                    startIndex = Math.max(0, i - bufferSize);
                    break;
                }
                currentTop += virtualData.items[i].height;
            }
            
            // Find end index
            currentTop = virtualData.items.slice(0, startIndex).reduce((sum, item) => sum + item.height, 0);
            for (let i = startIndex; i < virtualData.items.length; i++) {
                if (currentTop > scrollTop + containerHeight + (bufferSize * this.config.itemHeight)) {
                    endIndex = i;
                    break;
                }
                currentTop += virtualData.items[i].height;
            }
            
            if (endIndex === 0) endIndex = virtualData.items.length;
            
            // Update visible range
            virtualData.visibleRange = { start: startIndex, end: endIndex };
            
            // Render visible items
            this.renderVisibleItems(virtualData, visibleContainer, startIndex, endIndex);
        }

        renderVisibleItems(virtualData, container, start, end) {
            // Clear container
            container.innerHTML = '';
            
            // Calculate top offset
            const topOffset = virtualData.items.slice(0, start).reduce((sum, item) => sum + item.height, 0);
            container.style.transform = `translateY(${topOffset}px)`;
            
            // Render visible items
            for (let i = start; i < end; i++) {
                const itemData = virtualData.items[i];
                const element = this.createVirtualItem(itemData);
                container.appendChild(element);
            }
        }

        createVirtualItem(itemData) {
            const element = document.createElement('div');
            element.className = itemData.data.className;
            element.innerHTML = itemData.data.innerHTML;
            
            // Restore dataset
            Object.keys(itemData.data.dataset).forEach(key => {
                element.dataset[key] = itemData.data.dataset[key];
            });
            
            return element;
        }

        recalculate() {
            this.containers.forEach((virtualData, container) => {
                virtualData.containerHeight = container.offsetHeight;
                this.updateVisibleItems(container, virtualData, 
                    container.querySelector('.mas-virtual-visible-items'));
            });
        }

        enablePerformanceMode() {
            this.isPerformanceMode = true;
            this.config.bufferSize = 5; // Reduce buffer size
        }

        disablePerformanceMode() {
            this.isPerformanceMode = false;
            this.config.bufferSize = 10; // Restore buffer size
        }

        getStats() {
            let totalItems = 0;
            let visibleItems = 0;
            
            this.containers.forEach(virtualData => {
                totalItems += virtualData.items.length;
                visibleItems += virtualData.visibleRange.end - virtualData.visibleRange.start;
            });
            
            return {
                containers: this.containers.size,
                totalItems,
                visibleItems,
                efficiency: totalItems > 0 ? (visibleItems / totalItems) * 100 : 0
            };
        }

        destroy() {
            this.containers.clear();
        }
    }

    // ========================================================================
    // 🧠 MODULE: MemoryManager (Memory optimization system)
    // ========================================================================
    class MemoryManager {
        constructor() {
            this.weakRefs = new Set();
            this.cleanupTasks = [];
            this.memoryThreshold = 100 * 1024 * 1024; // 100MB
            this.isMonitoring = false;
        }

        init() {
            this.startMonitoring();
            this.setupMemoryPressureHandler();
        }

        startMonitoring() {
            if (this.isMonitoring) return;
            
            this.isMonitoring = true;
            
            // Check memory usage every 30 seconds
            setInterval(() => {
                this.checkMemoryUsage();
            }, 30000);
        }

        checkMemoryUsage() {
            if (!performance.memory) return;
            
            const usage = performance.memory.usedJSHeapSize;
            const threshold = this.memoryThreshold;
            
            if (usage > threshold) {
                this.performCleanup();
            }
        }

        setupMemoryPressureHandler() {
            // Listen for memory pressure events (if available)
            if ('onmemorywarning' in window) {
                window.addEventListener('memorywarning', () => {
                    this.performEmergencyCleanup();
                });
            }
        }

        addWeakRef(object, cleanupCallback) {
            if ('WeakRef' in window) {
                const weakRef = new WeakRef(object);
                this.weakRefs.add({ ref: weakRef, cleanup: cleanupCallback });
                
                return {
                    deref: () => weakRef.deref(),
                    cleanup: () => {
                        if (cleanupCallback) cleanupCallback();
                        this.weakRefs.delete(weakRef);
                    }
                };
            }
            
            // Fallback for browsers without WeakRef
            return {
                deref: () => object,
                cleanup: () => {
                    if (cleanupCallback) cleanupCallback();
                }
            };
        }

        addCleanupTask(task) {
            this.cleanupTasks.push(task);
        }

        performCleanup() {
            console.log('🧹 MemoryManager: Performing cleanup...');
            
            // Clean up dead weak references
            this.cleanupWeakRefs();
            
            // Run cleanup tasks
            this.runCleanupTasks();
            
            // Clear caches
            this.clearCaches();
            
            // Request garbage collection if available
            this.requestGarbageCollection();
        }

        performEmergencyCleanup() {
            console.warn('🚨 MemoryManager: Emergency cleanup triggered!');
            
            // Aggressive cleanup
            this.performCleanup();
            
            // Clear all suggestions cache
            if (window.UnifiedLiveEdit?.SmartSuggestionsManager) {
                window.UnifiedLiveEdit.SmartSuggestionsManager.suggestionCache.clear();
            }
            
            // Close all panels except essential ones
            if (window.UnifiedLiveEdit?.panelFactory) {
                const panels = window.UnifiedLiveEdit.panelFactory.getAllPanels();
                panels.forEach((panel, id) => {
                    if (!panel.isEssential) {
                        window.UnifiedLiveEdit.panelFactory.closePanel(id);
                    }
                });
            }
        }

        cleanupWeakRefs() {
            const toRemove = [];
            
            this.weakRefs.forEach(item => {
                if (!item.ref.deref()) {
                    // Object has been garbage collected
                    if (item.cleanup) item.cleanup();
                    toRemove.push(item);
                }
            });
            
            toRemove.forEach(item => this.weakRefs.delete(item));
        }

        runCleanupTasks() {
            this.cleanupTasks.forEach(task => {
                try {
                    task();
                } catch (error) {
                    console.warn('Cleanup task failed:', error);
                }
            });
        }

        clearCaches() {
            // Clear browser caches if available
            if ('caches' in window) {
                caches.keys().then(names => {
                    names.forEach(name => {
                        if (name.includes('mas-')) {
                            caches.delete(name);
                        }
                    });
                });
            }
        }

        requestGarbageCollection() {
            if ('gc' in window && typeof window.gc === 'function') {
                try {
                    window.gc();
                } catch (error) {
                    // Ignore errors
                }
            }
        }

        getMemoryInfo() {
            if (!performance.memory) {
                return { available: false };
            }
            
            return {
                available: true,
                used: performance.memory.usedJSHeapSize,
                total: performance.memory.totalJSHeapSize,
                limit: performance.memory.jsHeapSizeLimit,
                percentage: (performance.memory.usedJSHeapSize / performance.memory.totalJSHeapSize) * 100
            };
        }

        destroy() {
            this.isMonitoring = false;
            this.weakRefs.clear();
            this.cleanupTasks = [];
        }
    }

    // ========================================================================
    // 🗄️ MODULE: CacheManager (Intelligent caching system)
    // ========================================================================
    class CacheManager {
        constructor() {
            this.caches = new Map();
            this.config = {
                maxAge: 300000, // 5 minutes
                maxSize: 100,
                cleanupInterval: 60000 // 1 minute
            };
        }

        init() {
            this.startCleanupTimer();
        }

        startCleanupTimer() {
            setInterval(() => {
                this.cleanupExpired();
            }, this.config.cleanupInterval);
        }

        createCache(name, options = {}) {
            const cache = {
                name,
                data: new Map(),
                maxAge: options.maxAge || this.config.maxAge,
                maxSize: options.maxSize || this.config.maxSize,
                hits: 0,
                misses: 0
            };
            
            this.caches.set(name, cache);
            return cache;
        }

        getCache(name) {
            return this.caches.get(name);
        }

        set(cacheName, key, value, ttl = null) {
            let cache = this.getCache(cacheName);
            if (!cache) {
                cache = this.createCache(cacheName);
            }
            
            const item = {
                value,
                timestamp: Date.now(),
                ttl: ttl || cache.maxAge,
                lastAccessed: Date.now()
            };
            
            // Check cache size limit
            if (cache.data.size >= cache.maxSize) {
                this.evictOldest(cache);
            }
            
            cache.data.set(key, item);
        }

        get(cacheName, key) {
            const cache = this.getCache(cacheName);
            if (!cache) {
                return null;
            }
            
            const item = cache.data.get(key);
            if (!item) {
                cache.misses++;
                return null;
            }
            
            // Check if expired
            if (Date.now() - item.timestamp > item.ttl) {
                cache.data.delete(key);
                cache.misses++;
                return null;
            }
            
            // Update access time
            item.lastAccessed = Date.now();
            cache.hits++;
            
            return item.value;
        }

        delete(cacheName, key) {
            const cache = this.getCache(cacheName);
            if (cache) {
                return cache.data.delete(key);
            }
            return false;
        }

        clear(cacheName) {
            const cache = this.getCache(cacheName);
            if (cache) {
                cache.data.clear();
                cache.hits = 0;
                cache.misses = 0;
            }
        }

        evictOldest(cache) {
            let oldestKey = null;
            let oldestTime = Infinity;
            
            cache.data.forEach((item, key) => {
                if (item.lastAccessed < oldestTime) {
                    oldestTime = item.lastAccessed;
                    oldestKey = key;
                }
            });
            
            if (oldestKey) {
                cache.data.delete(oldestKey);
            }
        }

        cleanupExpired() {
            this.caches.forEach(cache => {
                const now = Date.now();
                const toDelete = [];
                
                cache.data.forEach((item, key) => {
                    if (now - item.timestamp > item.ttl) {
                        toDelete.push(key);
                    }
                });
                
                toDelete.forEach(key => cache.data.delete(key));
            });
        }

        getStats() {
            const stats = {};
            
            this.caches.forEach((cache, name) => {
                const total = cache.hits + cache.misses;
                stats[name] = {
                    size: cache.data.size,
                    maxSize: cache.maxSize,
                    hits: cache.hits,
                    misses: cache.misses,
                    hitRate: total > 0 ? (cache.hits / total) * 100 : 0
                };
            });
            
            return stats;
        }

        destroy() {
            this.caches.clear();
        }
    }

    // ========================================================================
    // 📦 MODULE: BatchProcessor (Batch operations system)
    // ========================================================================
    class BatchProcessor {
        constructor() {
            this.batches = new Map();
            this.processors = new Map();
            this.config = {
                maxBatchSize: 50,
                batchTimeout: 100,
                maxWaitTime: 1000
            };
        }

        init() {
            this.setupDefaultProcessors();
        }

        setupDefaultProcessors() {
            // CSS Updates processor
            this.addProcessor('cssUpdates', (items) => {
                const styles = {};
                items.forEach(item => {
                    styles[item.property] = item.value;
                });
                
                // Apply all styles at once
                const root = document.documentElement;
                Object.entries(styles).forEach(([property, value]) => {
                    root.style.setProperty(property, value);
                });
            });
            
            // DOM Updates processor
            this.addProcessor('domUpdates', (items) => {
                const fragment = document.createDocumentFragment();
                items.forEach(item => {
                    if (item.element && item.operation === 'append') {
                        fragment.appendChild(item.element);
                    }
                });
                
                if (fragment.children.length > 0) {
                    items[0].parent.appendChild(fragment);
                }
            });
            
            // Settings Save processor
            this.addProcessor('settingsSave', async (items) => {
                const settings = {};
                items.forEach(item => {
                    settings[item.key] = item.value;
                });
                
                // Batch save to server
                if (window.UnifiedLiveEdit?.liveEditEngine) {
                    await window.UnifiedLiveEdit.liveEditEngine.saveToServer(settings);
                }
            });
        }

        addProcessor(name, processor) {
            this.processors.set(name, processor);
        }

        add(batchName, item) {
            if (!this.batches.has(batchName)) {
                this.batches.set(batchName, {
                    items: [],
                    timeout: null,
                    createdAt: Date.now()
                });
            }
            
            const batch = this.batches.get(batchName);
            batch.items.push(item);
            
            // Clear existing timeout
            if (batch.timeout) {
                clearTimeout(batch.timeout);
            }
            
            // Process immediately if batch is full
            if (batch.items.length >= this.config.maxBatchSize) {
                this.processBatch(batchName);
                return;
            }
            
            // Set new timeout
            batch.timeout = setTimeout(() => {
                this.processBatch(batchName);
            }, this.config.batchTimeout);
            
            // Force process if max wait time exceeded
            if (Date.now() - batch.createdAt > this.config.maxWaitTime) {
                this.processBatch(batchName);
            }
        }

        processBatch(batchName) {
            const batch = this.batches.get(batchName);
            if (!batch || batch.items.length === 0) return;
            
            // Clear timeout
            if (batch.timeout) {
                clearTimeout(batch.timeout);
            }
            
            // Get processor
            const processor = this.processors.get(batchName);
            if (!processor) {
                console.warn(`No processor found for batch: ${batchName}`);
                this.batches.delete(batchName);
                return;
            }
            
            // Process items
            try {
                processor(batch.items);
            } catch (error) {
                console.error(`Batch processing failed for ${batchName}:`, error);
            }
            
            // Clean up
            this.batches.delete(batchName);
        }

        flush(batchName = null) {
            if (batchName) {
                this.processBatch(batchName);
            } else {
                // Flush all batches
                this.batches.forEach((batch, name) => {
                    this.processBatch(name);
                });
            }
        }

        getStats() {
            const stats = {};
            
            this.batches.forEach((batch, name) => {
                stats[name] = {
                    pendingItems: batch.items.length,
                    age: Date.now() - batch.createdAt
                };
            });
            
            return {
                activeBatches: this.batches.size,
                processors: this.processors.size,
                batches: stats
            };
        }

        destroy() {
            // Clear all timeouts
            this.batches.forEach(batch => {
                if (batch.timeout) {
                    clearTimeout(batch.timeout);
                }
            });
            
            this.batches.clear();
            this.processors.clear();
        }
    }

    // ========================================================================
    // ⏱️ MODULE: EventThrottler (Event optimization system)
    // ========================================================================
    class EventThrottler {
        constructor() {
            this.throttledFunctions = new Map();
            this.debouncedFunctions = new Map();
        }

        init() {
            // Setup is minimal - functions are created on demand
        }

        throttle(func, limit) {
            const key = func.toString();
            
            if (this.throttledFunctions.has(key)) {
                return this.throttledFunctions.get(key);
            }
            
            let inThrottle;
            const throttledFunc = function(...args) {
                if (!inThrottle) {
                    func.apply(this, args);
                    inThrottle = true;
                    setTimeout(() => inThrottle = false, limit);
                }
            };
            
            this.throttledFunctions.set(key, throttledFunc);
            return throttledFunc;
        }

        debounce(func, delay) {
            const key = func.toString();
            
            if (this.debouncedFunctions.has(key)) {
                return this.debouncedFunctions.get(key);
            }
            
            let timeoutId;
            const debouncedFunc = function(...args) {
                clearTimeout(timeoutId);
                timeoutId = setTimeout(() => func.apply(this, args), delay);
            };
            
            this.debouncedFunctions.set(key, debouncedFunc);
            return debouncedFunc;
        }

        createAnimationThrottle(func) {
            let ticking = false;
            
            return function(...args) {
                if (!ticking) {
                    requestAnimationFrame(() => {
                        func.apply(this, args);
                        ticking = false;
                    });
                    ticking = true;
                }
            };
        }

        createIdleCallback(func, options = {}) {
            if ('requestIdleCallback' in window) {
                return function(...args) {
                    requestIdleCallback(() => {
                        func.apply(this, args);
                    }, options);
                };
            } else {
                // Fallback to setTimeout
                return function(...args) {
                    setTimeout(() => func.apply(this, args), 0);
                };
            }
        }

        destroy() {
            this.throttledFunctions.clear();
            this.debouncedFunctions.clear();
        }
    }

    // ========================================================================
    // 🚀 MODULE: PerformanceManager (Performance optimization system)
    // ========================================================================
    class PerformanceManager {
        constructor() {
            this.isEnabled = true;
            this.lazyLoadManager = new LazyLoadManager();
            this.virtualScrollManager = new VirtualScrollManager();
            this.memoryManager = new MemoryManager();
            this.cacheManager = new CacheManager();
            this.batchProcessor = new BatchProcessor();
            this.eventThrottler = new EventThrottler();
            
            this.metrics = {
                startTime: performance.now(),
                renderMetrics: [],
                memoryMetrics: [],
                performanceMarks: new Map(),
                frameRate: [],
                lastCleanup: Date.now()
            };
            
            this.observers = {
                performance: null,
                intersection: null,
                mutation: null,
                resize: null
            };
            
            this.config = {
                maxMetricsHistory: 100,
                memoryCleanupInterval: 30000, // 30 seconds
                performanceReportInterval: 60000, // 1 minute
                frameRateTargetFPS: 60,
                lazyLoadThreshold: 0.1,
                virtualScrollBufferSize: 10
            };
        }

        init() {
            this.setupPerformanceObserver();
            this.initializeManagers();
            this.startMemoryMonitoring();
            this.setupEventOptimization();
            this.enableFrameRateMonitoring();
            
            console.log('⚡ Performance Manager initialized');
        }

        setupPerformanceObserver() {
            if ('PerformanceObserver' in window) {
                this.observers.performance = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    entries.forEach(entry => {
                        this.recordPerformanceEntry(entry);
                    });
                });

                this.observers.performance.observe({
                    entryTypes: ['measure', 'navigation', 'paint', 'largest-contentful-paint']
                });
            }
        }

        initializeManagers() {
            this.lazyLoadManager.init();
            this.virtualScrollManager.init();
            this.memoryManager.init();
            this.cacheManager.init();
            this.batchProcessor.init();
            this.eventThrottler.init();
        }

        startMemoryMonitoring() {
            setInterval(() => {
                this.performMemoryCleanup();
                this.recordMemoryMetrics();
            }, this.config.memoryCleanupInterval);
        }

        setupEventOptimization() {
            // Replace high-frequency events with optimized versions
            this.optimizeScrollEvents();
            this.optimizeResizeEvents();
            this.optimizeMouseEvents();
        }

        enableFrameRateMonitoring() {
            let frameCount = 0;
            let lastTime = performance.now();

            const countFrame = () => {
                frameCount++;
                const currentTime = performance.now();
                
                if (currentTime - lastTime >= 1000) {
                    this.metrics.frameRate.push({
                        fps: frameCount,
                        timestamp: currentTime
                    });
                    
                    if (this.metrics.frameRate.length > this.config.maxMetricsHistory) {
                        this.metrics.frameRate.shift();
                    }
                    
                    frameCount = 0;
                    lastTime = currentTime;
                }
                
                requestAnimationFrame(countFrame);
            };
            
            requestAnimationFrame(countFrame);
        }

        // Performance marking and measuring
        mark(name) {
            if (this.isEnabled && 'performance' in window && performance.mark) {
                performance.mark(name);
                this.metrics.performanceMarks.set(name, performance.now());
            }
        }

        measure(name, startMark, endMark) {
            if (this.isEnabled && 'performance' in window && performance.measure) {
                try {
                    performance.measure(name, startMark, endMark);
                    return performance.getEntriesByName(name, 'measure').pop();
                } catch (error) {
                    console.warn('Performance measure failed:', error);
                }
            }
        }

        // Memory management
        performMemoryCleanup() {
            // Clean up old metrics
            this.cleanupOldMetrics();
            
            // Clear expired cache entries
            this.cacheManager.cleanupExpired();
            
            // Run garbage collection hints
            this.suggestGarbageCollection();
            
            // Clean up DOM references
            this.cleanupDOMReferences();
            
            this.metrics.lastCleanup = Date.now();
        }

        cleanupOldMetrics() {
            const maxAge = 300000; // 5 minutes
            const now = Date.now();
            
            this.metrics.renderMetrics = this.metrics.renderMetrics.filter(
                metric => now - metric.timestamp < maxAge
            );
            
            this.metrics.memoryMetrics = this.metrics.memoryMetrics.filter(
                metric => now - metric.timestamp < maxAge
            );
        }

        suggestGarbageCollection() {
            if ('gc' in window && typeof window.gc === 'function') {
                // Only available in Chrome with --js-flags="--expose-gc"
                try {
                    window.gc();
                } catch (error) {
                    // Ignore errors - GC might not be available
                }
            }
        }

        cleanupDOMReferences() {
            // Clean up panel factory references
            if (window.UnifiedLiveEdit?.panelFactory) {
                window.UnifiedLiveEdit.panelFactory.cleanupClosedPanels();
            }
            
            // Clean up smart suggestions cache
            if (window.UnifiedLiveEdit?.SmartSuggestionsManager) {
                window.UnifiedLiveEdit.SmartSuggestionsManager.suggestionCache.clear();
            }
        }

        recordMemoryMetrics() {
            if ('performance' in window && performance.memory) {
                this.metrics.memoryMetrics.push({
                    used: performance.memory.usedJSHeapSize,
                    total: performance.memory.totalJSHeapSize,
                    limit: performance.memory.jsHeapSizeLimit,
                    timestamp: Date.now()
                });
                
                if (this.metrics.memoryMetrics.length > this.config.maxMetricsHistory) {
                    this.metrics.memoryMetrics.shift();
                }
            }
        }

        recordPerformanceEntry(entry) {
            const metric = {
                name: entry.name,
                type: entry.entryType,
                startTime: entry.startTime,
                duration: entry.duration || 0,
                timestamp: Date.now()
            };
            
            this.metrics.renderMetrics.push(metric);
            
            if (this.metrics.renderMetrics.length > this.config.maxMetricsHistory) {
                this.metrics.renderMetrics.shift();
            }
        }

        // Event optimization
        optimizeScrollEvents() {
            let scrollTimeout;
            const originalScrollHandler = window.onscroll;
            
            window.onscroll = this.eventThrottler.throttle((e) => {
                if (originalScrollHandler) originalScrollHandler(e);
                
                clearTimeout(scrollTimeout);
                scrollTimeout = setTimeout(() => {
                    this.lazyLoadManager.checkVisibleElements();
                }, 100);
            }, 16); // ~60fps
        }

        optimizeResizeEvents() {
            let resizeTimeout;
            const originalResizeHandler = window.onresize;
            
            window.onresize = this.eventThrottler.debounce((e) => {
                if (originalResizeHandler) originalResizeHandler(e);
                
                clearTimeout(resizeTimeout);
                resizeTimeout = setTimeout(() => {
                    this.virtualScrollManager.recalculate();
                    this.lazyLoadManager.updateViewport();
                }, 150);
            }, 250);
        }

        optimizeMouseEvents() {
            // Throttle mousemove events for panels
            document.addEventListener('mousemove', this.eventThrottler.throttle((e) => {
                // Only process if panels are active
                if (window.UnifiedLiveEdit?.panelFactory?.getAllPanels().size > 0) {
                    this.updatePanelHoverStates(e);
                }
            }, 33)); // ~30fps for mouse tracking
        }

        updatePanelHoverStates(event) {
            const panels = window.UnifiedLiveEdit?.panelFactory?.getAllPanels() || new Map();
            
            panels.forEach(panel => {
                if (panel.element && panel.element.contains) {
                    const isHovered = panel.element.contains(event.target);
                    panel.element.classList.toggle('mas-panel-hovered', isHovered);
                }
            });
        }

        // Public API
        getMetrics() {
            const avgFrameRate = this.getAverageFrameRate();
            const memoryUsage = this.getCurrentMemoryUsage();
            const performanceSummary = this.getPerformanceSummary();
            
            return {
                frameRate: {
                    current: avgFrameRate,
                    target: this.config.frameRateTargetFPS,
                    performance: avgFrameRate / this.config.frameRateTargetFPS
                },
                memory: memoryUsage,
                performance: performanceSummary,
                managers: {
                    lazyLoad: this.lazyLoadManager.getStats(),
                    virtualScroll: this.virtualScrollManager.getStats(),
                    cache: this.cacheManager.getStats(),
                    batch: this.batchProcessor.getStats()
                }
            };
        }

        getAverageFrameRate() {
            if (this.metrics.frameRate.length === 0) return 0;
            
            const recent = this.metrics.frameRate.slice(-10);
            return recent.reduce((sum, frame) => sum + frame.fps, 0) / recent.length;
        }

        getCurrentMemoryUsage() {
            if (!performance.memory) return null;
            
            return {
                used: performance.memory.usedJSHeapSize,
                total: performance.memory.totalJSHeapSize,
                limit: performance.memory.jsHeapSizeLimit,
                percentage: (performance.memory.usedJSHeapSize / performance.memory.totalJSHeapSize) * 100
            };
        }

        getPerformanceSummary() {
            const recentMetrics = this.metrics.renderMetrics.slice(-20);
            if (recentMetrics.length === 0) return { avgDuration: 0, maxDuration: 0 };
            
            const durations = recentMetrics.map(m => m.duration).filter(d => d > 0);
            
            return {
                avgDuration: durations.reduce((sum, d) => sum + d, 0) / durations.length || 0,
                maxDuration: Math.max(...durations, 0),
                count: recentMetrics.length
            };
        }

        // Performance optimization helpers
        isPerformanceCritical() {
            const frameRate = this.getAverageFrameRate();
            const memoryUsage = this.getCurrentMemoryUsage();
            
            return frameRate < (this.config.frameRateTargetFPS * 0.8) || 
                   (memoryUsage && memoryUsage.percentage > 80);
        }

        enablePerformanceMode() {
            // Reduce animation quality
            document.documentElement.style.setProperty('--mas-performance-mode', '1');
            
            // Disable heavy effects
            this.lazyLoadManager.setAggressiveMode(true);
            this.virtualScrollManager.enablePerformanceMode();
            
            console.log('🚨 Performance mode enabled');
        }

        disablePerformanceMode() {
            document.documentElement.style.removeProperty('--mas-performance-mode');
            this.lazyLoadManager.setAggressiveMode(false);
            this.virtualScrollManager.disablePerformanceMode();
            
            console.log('✅ Performance mode disabled');
        }

        // Cleanup
        destroy() {
            // Stop observers
            Object.values(this.observers).forEach(observer => {
                if (observer && observer.disconnect) {
                    observer.disconnect();
                }
            });
            
            // Cleanup managers
            this.lazyLoadManager.destroy();
            this.virtualScrollManager.destroy();
            this.memoryManager.destroy();
            this.cacheManager.destroy();
            this.batchProcessor.destroy();
            this.eventThrottler.destroy();
            
            this.metrics = null;
            this.observers = null;
            
            console.log('⚡ Performance Manager destroyed');
        }
    }

    // ========================================================================
    // 📱 MODULE: TouchGestureManager (Touch gesture handling system)
    // ========================================================================
    class TouchGestureManager {
        constructor() {
            this.isEnabled = true;
            this.activeGestures = new Map();
            this.gestureHistory = [];
            this.touchStartTime = 0;
            this.lastTap = null;
            this.isDoubleTapEnabled = true;
            this.isPinchEnabled = true;
            this.isSwipeEnabled = true;
            
            this.config = {
                doubleTapDelay: 300,
                longPressDelay: 500,
                swipeThreshold: 50,
                pinchThreshold: 1.2,
                maxTouchPoints: 10,
                velocityThreshold: 0.3
            };
            
            this.callbacks = {
                tap: new Set(),
                doubleTap: new Set(),
                longPress: new Set(),
                swipe: new Set(),
                pinch: new Set(),
                rotate: new Set(),
                pan: new Set()
            };
        }

        init() {
            this.setupTouchEventListeners();
            this.setupGestureRecognition();
            this.enableHapticFeedback();
            
            console.log('📱 Touch Gesture Manager initialized');
        }

        setupTouchEventListeners() {
            // Passive listeners for better performance
            const passiveOptions = { passive: false, capture: true };
            
            document.addEventListener('touchstart', this.handleTouchStart.bind(this), passiveOptions);
            document.addEventListener('touchmove', this.handleTouchMove.bind(this), passiveOptions);
            document.addEventListener('touchend', this.handleTouchEnd.bind(this), passiveOptions);
            document.addEventListener('touchcancel', this.handleTouchCancel.bind(this), passiveOptions);
            
            // Gesture events for supported browsers
            if ('ongesturestart' in window) {
                document.addEventListener('gesturestart', this.handleGestureStart.bind(this), passiveOptions);
                document.addEventListener('gesturechange', this.handleGestureChange.bind(this), passiveOptions);
                document.addEventListener('gestureend', this.handleGestureEnd.bind(this), passiveOptions);
            }
        }

        setupGestureRecognition() {
            // Initialize gesture recognizers
            this.tapRecognizer = new TapRecognizer(this.config);
            this.swipeRecognizer = new SwipeRecognizer(this.config);
            this.pinchRecognizer = new PinchRecognizer(this.config);
            this.longPressRecognizer = new LongPressRecognizer(this.config);
        }

        handleTouchStart(e) {
            if (!this.isEnabled) return;
            
            this.touchStartTime = performance.now();
            const touches = Array.from(e.touches);
            
            // Store touch data
            touches.forEach(touch => {
                this.activeGestures.set(touch.identifier, {
                    startX: touch.clientX,
                    startY: touch.clientY,
                    currentX: touch.clientX,
                    currentY: touch.clientY,
                    startTime: this.touchStartTime,
                    element: document.elementFromPoint(touch.clientX, touch.clientY)
                });
            });
            
            // Handle long press detection
            if (touches.length === 1) {
                this.longPressRecognizer.start(touches[0], e.target);
            }
            
            // Prevent default for Live Edit elements
            if (this.isLiveEditElement(e.target)) {
                e.preventDefault();
            }
        }

        handleTouchMove(e) {
            if (!this.isEnabled) return;
            
            const touches = Array.from(e.touches);
            
            // Update touch positions
            touches.forEach(touch => {
                const gesture = this.activeGestures.get(touch.identifier);
                if (gesture) {
                    gesture.currentX = touch.clientX;
                    gesture.currentY = touch.clientY;
                    gesture.deltaX = touch.clientX - gesture.startX;
                    gesture.deltaY = touch.clientY - gesture.startY;
                }
            });
            
            // Handle multi-touch gestures
            if (touches.length === 2) {
                this.handlePinchGesture(touches);
            } else if (touches.length === 1) {
                this.handlePanGesture(touches[0]);
            }
            
            // Cancel long press if movement detected
            this.longPressRecognizer.cancel();
            
            if (this.isLiveEditElement(e.target)) {
                e.preventDefault();
            }
        }

        handleTouchEnd(e) {
            if (!this.isEnabled) return;
            
            const changedTouches = Array.from(e.changedTouches);
            const endTime = performance.now();
            
            changedTouches.forEach(touch => {
                const gesture = this.activeGestures.get(touch.identifier);
                if (gesture) {
                    const duration = endTime - gesture.startTime;
                    const distance = Math.sqrt(
                        Math.pow(gesture.deltaX || 0, 2) + 
                        Math.pow(gesture.deltaY || 0, 2)
                    );
                    
                    // Determine gesture type
                    if (duration < this.config.doubleTapDelay && distance < 20) {
                        this.handleTapGesture(touch, gesture, e.target);
                    } else if (distance > this.config.swipeThreshold) {
                        this.handleSwipeGesture(gesture, e.target);
                    }
                    
                    this.activeGestures.delete(touch.identifier);
                }
            });
            
            // Clean up recognizers
            this.longPressRecognizer.end();
        }

        handleTouchCancel(e) {
            this.activeGestures.clear();
            this.longPressRecognizer.cancel();
        }

        handleTapGesture(touch, gesture, target) {
            const now = performance.now();
            
            if (this.lastTap && 
                now - this.lastTap.time < this.config.doubleTapDelay &&
                Math.abs(touch.clientX - this.lastTap.x) < 50 &&
                Math.abs(touch.clientY - this.lastTap.y) < 50) {
                
                // Double tap detected
                this.triggerCallback('doubleTap', {
                    x: touch.clientX,
                    y: touch.clientY,
                    target: target,
                    gesture: gesture
                });
                
                this.hapticFeedback('medium');
                this.lastTap = null;
            } else {
                // Single tap
                this.triggerCallback('tap', {
                    x: touch.clientX,
                    y: touch.clientY,
                    target: target,
                    gesture: gesture
                });
                
                this.hapticFeedback('light');
                this.lastTap = {
                    x: touch.clientX,
                    y: touch.clientY,
                    time: now
                };
            }
        }

        handleSwipeGesture(gesture, target) {
            const deltaX = gesture.deltaX || 0;
            const deltaY = gesture.deltaY || 0;
            const absX = Math.abs(deltaX);
            const absY = Math.abs(deltaY);
            
            let direction;
            if (absX > absY) {
                direction = deltaX > 0 ? 'right' : 'left';
            } else {
                direction = deltaY > 0 ? 'down' : 'up';
            }
            
            this.triggerCallback('swipe', {
                direction: direction,
                distance: Math.sqrt(deltaX * deltaX + deltaY * deltaY),
                deltaX: deltaX,
                deltaY: deltaY,
                target: target,
                gesture: gesture
            });
            
            this.hapticFeedback('medium');
        }

        handlePinchGesture(touches) {
            if (touches.length !== 2) return;
            
            const gesture1 = this.activeGestures.get(touches[0].identifier);
            const gesture2 = this.activeGestures.get(touches[1].identifier);
            
            if (!gesture1 || !gesture2) return;
            
            const currentDistance = Math.sqrt(
                Math.pow(touches[0].clientX - touches[1].clientX, 2) +
                Math.pow(touches[0].clientY - touches[1].clientY, 2)
            );
            
            const startDistance = Math.sqrt(
                Math.pow(gesture1.startX - gesture2.startX, 2) +
                Math.pow(gesture1.startY - gesture2.startY, 2)
            );
            
            const scale = currentDistance / startDistance;
            
            this.triggerCallback('pinch', {
                scale: scale,
                center: {
                    x: (touches[0].clientX + touches[1].clientX) / 2,
                    y: (touches[0].clientY + touches[1].clientY) / 2
                },
                touches: touches
            });
        }

        handlePanGesture(touch) {
            const gesture = this.activeGestures.get(touch.identifier);
            if (!gesture) return;
            
            this.triggerCallback('pan', {
                deltaX: gesture.deltaX || 0,
                deltaY: gesture.deltaY || 0,
                startX: gesture.startX,
                startY: gesture.startY,
                currentX: gesture.currentX,
                currentY: gesture.currentY,
                target: gesture.element
            });
        }

        // Gesture recognizer classes
        isLiveEditElement(element) {
            return element && (
                element.closest('.mas-micro-panel') ||
                element.closest('[data-mas-editable]') ||
                element.closest('.mas-live-edit-toggle') ||
                element.hasAttribute('data-mas-touch-enabled')
            );
        }

        triggerCallback(gestureType, data) {
            const callbacks = this.callbacks[gestureType];
            if (callbacks) {
                callbacks.forEach(callback => {
                    try {
                        callback(data);
                    } catch (error) {
                        console.error(`Touch gesture callback error (${gestureType}):`, error);
                    }
                });
            }
        }

        enableHapticFeedback() {
            this.hapticSupported = 'vibrate' in navigator;
        }

        hapticFeedback(intensity = 'light') {
            if (!this.hapticSupported) return;
            
            const patterns = {
                light: [10],
                medium: [20],
                heavy: [30],
                success: [10, 50, 10],
                error: [50, 100, 50]
            };
            
            const pattern = patterns[intensity] || patterns.light;
            navigator.vibrate(pattern);
        }

        // Public API
        on(gestureType, callback) {
            if (this.callbacks[gestureType]) {
                this.callbacks[gestureType].add(callback);
            }
        }

        off(gestureType, callback) {
            if (this.callbacks[gestureType]) {
                this.callbacks[gestureType].delete(callback);
            }
        }

        enable() {
            this.isEnabled = true;
        }

        disable() {
            this.isEnabled = false;
        }

        destroy() {
            this.activeGestures.clear();
            Object.values(this.callbacks).forEach(set => set.clear());
        }
    }

    // ========================================================================
    // 📱 MODULE: MobileLayoutManager (Mobile responsive layout system)
    // ========================================================================
    class MobileLayoutManager {
        constructor() {
            this.isMobile = this.detectMobile();
            this.isTablet = this.detectTablet();
            this.orientation = this.getOrientation();
            this.viewportSize = this.getViewportSize();
            this.adaptivePanels = new Map();
            this.mobileBreakpoints = {
                mobile: 768,
                tablet: 1024,
                desktop: 1200
            };
        }

        init() {
            this.setupResponsiveObserver();
            this.setupOrientationHandler();
            this.adaptExistingPanels();
            this.injectMobileStyles();
            
            console.log('📱 Mobile Layout Manager initialized');
        }

        detectMobile() {
            const userAgent = navigator.userAgent || navigator.vendor || window.opera;
            return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent) ||
                   window.innerWidth <= this.mobileBreakpoints.mobile;
        }

        detectTablet() {
            const userAgent = navigator.userAgent || navigator.vendor || window.opera;
            return /ipad|android(?!.*mobile)|tablet/i.test(userAgent) ||
                   (window.innerWidth > this.mobileBreakpoints.mobile && 
                    window.innerWidth <= this.mobileBreakpoints.tablet);
        }

        getOrientation() {
            return window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
        }

        getViewportSize() {
            return {
                width: window.innerWidth,
                height: window.innerHeight,
                availableHeight: window.innerHeight - this.getKeyboardHeight()
            };
        }

        getKeyboardHeight() {
            // Estimate virtual keyboard height
            if (this.isMobile && document.activeElement && 
                ['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
                return window.innerHeight * 0.4; // Approximate keyboard height
            }
            return 0;
        }

        setupResponsiveObserver() {
            // Monitor viewport changes
            window.addEventListener('resize', this.throttle(() => {
                this.handleViewportChange();
            }, 100));
            
            // Monitor device orientation changes
            window.addEventListener('orientationchange', () => {
                setTimeout(() => {
                    this.handleOrientationChange();
                }, 100);
            });
        }

        setupOrientationHandler() {
            if (screen.orientation) {
                screen.orientation.addEventListener('change', () => {
                    this.handleOrientationChange();
                });
            }
        }

        handleViewportChange() {
            const newViewportSize = this.getViewportSize();
            const oldIsMobile = this.isMobile;
            
            this.isMobile = this.detectMobile();
            this.isTablet = this.detectTablet();
            this.viewportSize = newViewportSize;
            
            // Adapt panels if mobile state changed
            if (oldIsMobile !== this.isMobile) {
                this.adaptExistingPanels();
            }
            
            // Update panel positions and sizes
            this.updateAdaptivePanels();
        }

        handleOrientationChange() {
            const newOrientation = this.getOrientation();
            
            if (newOrientation !== this.orientation) {
                this.orientation = newOrientation;
                this.viewportSize = this.getViewportSize();
                
                // Reorganize panels for new orientation
                this.reorganizePanelsForOrientation();
                
                // Trigger custom event
                document.dispatchEvent(new CustomEvent('mas-orientation-change', {
                    detail: { orientation: this.orientation }
                }));
            }
        }

        adaptExistingPanels() {
            const panels = document.querySelectorAll('.mas-micro-panel');
            
            panels.forEach(panel => {
                this.adaptPanelForMobile(panel);
            });
        }

        adaptPanelForMobile(panel) {
            if (!panel) return;
            
            const panelId = panel.getAttribute('data-panel-id') || 
                           'panel-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
            
            if (this.isMobile) {
                this.convertToMobilePanel(panel, panelId);
            } else {
                this.convertToDesktopPanel(panel, panelId);
            }
        }

        convertToMobilePanel(panel, panelId) {
            panel.classList.add('mas-mobile-panel');
            panel.classList.remove('mas-desktop-panel');
            
            // Position at bottom of screen for mobile
            panel.style.position = 'fixed';
            panel.style.bottom = '0';
            panel.style.left = '0';
            panel.style.right = '0';
            panel.style.top = 'auto';
            panel.style.width = '100%';
            panel.style.maxWidth = '100%';
            panel.style.maxHeight = '70vh';
            panel.style.borderRadius = '16px 16px 0 0';
            panel.style.transform = 'translateY(0)';
            
            // Add mobile-specific features
            this.addMobilePanelFeatures(panel, panelId);
            
            this.adaptivePanels.set(panelId, {
                panel: panel,
                type: 'mobile',
                originalPosition: this.getPanelPosition(panel)
            });
        }

        convertToDesktopPanel(panel, panelId) {
            panel.classList.add('mas-desktop-panel');
            panel.classList.remove('mas-mobile-panel');
            
            // Restore desktop positioning
            const adaptiveData = this.adaptivePanels.get(panelId);
            if (adaptiveData && adaptiveData.originalPosition) {
                this.restorePanelPosition(panel, adaptiveData.originalPosition);
            }
            
            // Remove mobile-specific features
            this.removeMobilePanelFeatures(panel);
        }

        addMobilePanelFeatures(panel, panelId) {
            // Add drag handle for mobile
            let dragHandle = panel.querySelector('.mas-mobile-drag-handle');
            if (!dragHandle) {
                dragHandle = document.createElement('div');
                dragHandle.className = 'mas-mobile-drag-handle';
                dragHandle.innerHTML = '<div class="drag-indicator"></div>';
                panel.insertBefore(dragHandle, panel.firstChild);
            }
            
            // Add swipe-to-close functionality
            this.addSwipeToClose(panel, panelId);
            
            // Make controls touch-friendly
            this.makeTouchFriendly(panel);
        }

        addSwipeToClose(panel, panelId) {
            const touchManager = window.UnifiedLiveEdit.TouchGestureManager;
            if (!touchManager) return;
            
            touchManager.on('swipe', (data) => {
                if (data.target && panel.contains(data.target) && data.direction === 'down') {
                    this.closeMobilePanel(panel, panelId);
                }
            });
        }

        makeTouchFriendly(panel) {
            const controls = panel.querySelectorAll('input, button, select');
            
            controls.forEach(control => {
                control.style.minHeight = '44px';
                control.style.fontSize = '16px';
                control.style.padding = '12px';
                control.style.marginBottom = '8px';
                
                // Prevent zoom on iOS
                if (control.tagName === 'INPUT') {
                    control.style.fontSize = '16px';
                }
            });
        }

        closeMobilePanel(panel, panelId) {
            panel.style.transform = 'translateY(100%)';
            
            setTimeout(() => {
                if (window.UnifiedLiveEdit.panelFactory) {
                    window.UnifiedLiveEdit.panelFactory.closePanel(panelId);
                }
            }, 300);
        }

        reorganizePanelsForOrientation() {
            this.adaptivePanels.forEach((data, panelId) => {
                if (data.type === 'mobile') {
                    this.updateMobilePanelForOrientation(data.panel);
                }
            });
        }

        updateMobilePanelForOrientation(panel) {
            if (this.orientation === 'landscape') {
                panel.style.maxHeight = '50vh';
                panel.style.fontSize = '14px';
            } else {
                panel.style.maxHeight = '70vh';
                panel.style.fontSize = '16px';
            }
        }

        updateAdaptivePanels() {
            this.adaptivePanels.forEach((data, panelId) => {
                this.adaptPanelForMobile(data.panel);
            });
        }

        getPanelPosition(panel) {
            return {
                top: panel.style.top,
                left: panel.style.left,
                right: panel.style.right,
                bottom: panel.style.bottom,
                position: panel.style.position,
                transform: panel.style.transform
            };
        }

        restorePanelPosition(panel, position) {
            Object.keys(position).forEach(prop => {
                panel.style[prop] = position[prop];
            });
        }

        removeMobilePanelFeatures(panel) {
            const dragHandle = panel.querySelector('.mas-mobile-drag-handle');
            if (dragHandle) {
                dragHandle.remove();
            }
        }

        injectMobileStyles() {
            const mobileCSS = `
                @media (max-width: ${this.mobileBreakpoints.mobile}px) {
                    .mas-mobile-panel {
                        animation: mas-mobile-slide-up 0.3s ease-out;
                    }
                    
                    .mas-mobile-drag-handle {
                        height: 20px;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        cursor: grab;
                    }
                    
                    .mas-mobile-drag-handle .drag-indicator {
                        width: 40px;
                        height: 4px;
                        background: rgba(0, 0, 0, 0.3);
                        border-radius: 2px;
                    }
                    
                    @keyframes mas-mobile-slide-up {
                        from { transform: translateY(100%); }
                        to { transform: translateY(0); }
                    }
                }
            `;
            
            const style = document.createElement('style');
            style.textContent = mobileCSS;
            document.head.appendChild(style);
        }

        throttle(func, wait) {
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

        // Public API
        getCurrentDevice() {
            if (this.isMobile) return 'mobile';
            if (this.isTablet) return 'tablet';
            return 'desktop';
        }

        isCurrentlyMobile() {
            return this.isMobile;
        }

        getCurrentOrientation() {
            return this.orientation;
        }

        getViewportInfo() {
            return {
                ...this.viewportSize,
                device: this.getCurrentDevice(),
                orientation: this.orientation
            };
        }
    }

    // ========================================================================
    // 📱 MODULE: TouchKeyboardManager (Virtual keyboard interaction system)
    // ========================================================================
    class TouchKeyboardManager {
        constructor() {
            this.isKeyboardVisible = false;
            this.keyboardHeight = 0;
            this.originalViewportHeight = window.innerHeight;
            this.activeInput = null;
            this.scrollPosition = 0;
            this.adjustmentCallbacks = new Set();
        }

        init() {
            this.setupKeyboardDetection();
            this.setupInputHandlers();
            this.setupViewportAdjustment();
            
            console.log('📱 Touch Keyboard Manager initialized');
        }

        setupKeyboardDetection() {
            // Visual viewport API support
            if (window.visualViewport) {
                window.visualViewport.addEventListener('resize', () => {
                    this.handleViewportResize();
                });
            } else {
                // Fallback for older browsers
                window.addEventListener('resize', () => {
                    this.handleViewportResize();
                });
            }
        }

        setupInputHandlers() {
            document.addEventListener('focusin', (e) => {
                if (this.isInputElement(e.target)) {
                    this.handleInputFocus(e.target);
                }
            });

            document.addEventListener('focusout', (e) => {
                if (this.isInputElement(e.target)) {
                    this.handleInputBlur(e.target);
                }
            });
        }

        setupViewportAdjustment() {
            // Store original viewport height
            this.originalViewportHeight = window.innerHeight;
            
            // Monitor for significant viewport changes
            const observer = new ResizeObserver(() => {
                this.detectKeyboardState();
            });
            
            observer.observe(document.body);
        }

        handleViewportResize() {
            const currentHeight = window.visualViewport ? 
                window.visualViewport.height : window.innerHeight;
            
            this.detectKeyboardState();
            
            if (this.isKeyboardVisible) {
                this.adjustForKeyboard();
            } else {
                this.resetViewportAdjustments();
            }
        }

        detectKeyboardState() {
            const currentHeight = window.visualViewport ? 
                window.visualViewport.height : window.innerHeight;
            
            const heightDifference = this.originalViewportHeight - currentHeight;
            const wasKeyboardVisible = this.isKeyboardVisible;
            
            // Consider keyboard visible if height decreased by more than 150px
            this.isKeyboardVisible = heightDifference > 150;
            this.keyboardHeight = this.isKeyboardVisible ? heightDifference : 0;
            
            // Trigger callbacks if state changed
            if (wasKeyboardVisible !== this.isKeyboardVisible) {
                this.triggerAdjustmentCallbacks();
            }
        }

        handleInputFocus(input) {
            this.activeInput = input;
            
            // Delay to allow keyboard to show
            setTimeout(() => {
                if (this.isKeyboardVisible) {
                    this.ensureInputVisible(input);
                }
            }, 300);
        }

        handleInputBlur(input) {
            if (this.activeInput === input) {
                this.activeInput = null;
            }
        }

        ensureInputVisible(input) {
            const inputRect = input.getBoundingClientRect();
            const viewportHeight = window.visualViewport ? 
                window.visualViewport.height : window.innerHeight;
            
            // Check if input is hidden behind keyboard
            if (inputRect.bottom > viewportHeight - 50) {
                const scrollAmount = inputRect.bottom - (viewportHeight - 100);
                this.scrollToRevealInput(scrollAmount);
            }
        }

        scrollToRevealInput(scrollAmount) {
            const currentScroll = document.documentElement.scrollTop || document.body.scrollTop;
            const targetScroll = currentScroll + scrollAmount;
            
            // Smooth scroll to reveal input
            this.smoothScrollTo(targetScroll);
        }

        smoothScrollTo(targetScroll) {
            const startScroll = document.documentElement.scrollTop || document.body.scrollTop;
            const distance = targetScroll - startScroll;
            const duration = 300;
            const startTime = performance.now();
            
            const animateScroll = (currentTime) => {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const easeOutQuad = 1 - Math.pow(1 - progress, 2);
                
                const currentScroll = startScroll + (distance * easeOutQuad);
                document.documentElement.scrollTop = currentScroll;
                document.body.scrollTop = currentScroll;
                
                if (progress < 1) {
                    requestAnimationFrame(animateScroll);
                }
            };
            
            requestAnimationFrame(animateScroll);
        }

        adjustForKeyboard() {
            // Adjust panel positions for keyboard
            const panels = document.querySelectorAll('.mas-micro-panel');
            
            panels.forEach(panel => {
                if (panel.classList.contains('mas-mobile-panel')) {
                    const panelRect = panel.getBoundingClientRect();
                    const viewportHeight = window.visualViewport ? 
                        window.visualViewport.height : window.innerHeight;
                    
                    // Move panel above keyboard if it overlaps
                    if (panelRect.bottom > viewportHeight) {
                        panel.style.transform = `translateY(-${this.keyboardHeight}px)`;
                    }
                }
            });
        }

        resetViewportAdjustments() {
            // Reset panel positions
            const panels = document.querySelectorAll('.mas-micro-panel');
            
            panels.forEach(panel => {
                if (panel.classList.contains('mas-mobile-panel')) {
                    panel.style.transform = 'translateY(0)';
                }
            });
        }

        isInputElement(element) {
            return element && (
                element.tagName === 'INPUT' ||
                element.tagName === 'TEXTAREA' ||
                element.contentEditable === 'true'
            );
        }

        triggerAdjustmentCallbacks() {
            this.adjustmentCallbacks.forEach(callback => {
                try {
                    callback({
                        isVisible: this.isKeyboardVisible,
                        height: this.keyboardHeight,
                        activeInput: this.activeInput
                    });
                } catch (error) {
                    console.error('Keyboard adjustment callback error:', error);
                }
            });
        }

        // Public API
        onKeyboardToggle(callback) {
            this.adjustmentCallbacks.add(callback);
        }

        offKeyboardToggle(callback) {
            this.adjustmentCallbacks.delete(callback);
        }

        getKeyboardState() {
            return {
                isVisible: this.isKeyboardVisible,
                height: this.keyboardHeight,
                activeInput: this.activeInput
            };
        }
    }

    // ========================================================================
    // 📱 MODULE: SwipeNavigationManager (Swipe-based navigation system)
    // ========================================================================
    class SwipeNavigationManager {
        constructor() {
            this.isEnabled = true;
            this.navigationHistory = [];
            this.currentIndex = -1;
            this.swipeThreshold = 50;
            this.velocityThreshold = 0.5;
            this.navigationCallbacks = new Set();
        }

        init() {
            this.setupSwipeDetection();
            this.setupNavigationGestures();
            this.setupEdgeSwipes();
            
            console.log('📱 Swipe Navigation Manager initialized');
        }

        setupSwipeDetection() {
            const touchManager = window.UnifiedLiveEdit.TouchGestureManager;
            if (!touchManager) return;

            touchManager.on('swipe', (data) => {
                this.handleSwipeGesture(data);
            });
        }

        setupNavigationGestures() {
            // Panel navigation swipes
            document.addEventListener('mas-panel-created', (e) => {
                this.registerNavigablePanel(e.detail.panel);
            });

            // Settings panel navigation
            const settingsPanels = document.querySelectorAll('.mas-settings-panel');
            settingsPanels.forEach(panel => {
                this.registerNavigablePanel(panel);
            });
        }

        setupEdgeSwipes() {
            // Edge swipe detection for drawer navigation
            let startX = 0;
            let startY = 0;
            let isEdgeSwipe = false;

            document.addEventListener('touchstart', (e) => {
                const touch = e.touches[0];
                startX = touch.clientX;
                startY = touch.clientY;
                
                // Detect edge swipe (within 20px of screen edge)
                isEdgeSwipe = startX < 20 || startX > window.innerWidth - 20;
            });

            document.addEventListener('touchmove', (e) => {
                if (!isEdgeSwipe) return;
                
                const touch = e.touches[0];
                const deltaX = touch.clientX - startX;
                const deltaY = touch.clientY - startY;
                
                // Prevent default for horizontal edge swipes
                if (Math.abs(deltaX) > Math.abs(deltaY)) {
                    e.preventDefault();
                }
            });
        }

        handleSwipeGesture(data) {
            if (!this.isEnabled) return;

            const { direction, target, distance, velocity } = data;
            
            // Handle different swipe contexts
            if (this.isInPanel(target)) {
                this.handlePanelSwipe(direction, target, data);
            } else if (this.isInNavigationArea(target)) {
                this.handleNavigationSwipe(direction, target, data);
            } else if (this.isGlobalSwipe(data)) {
                this.handleGlobalSwipe(direction, data);
            }
        }

        handlePanelSwipe(direction, target, data) {
            const panel = target.closest('.mas-micro-panel');
            if (!panel) return;

            switch (direction) {
                case 'down':
                    this.closePanelWithAnimation(panel);
                    break;
                case 'up':
                    this.expandPanel(panel);
                    break;
                case 'left':
                case 'right':
                    this.navigatePanelTabs(panel, direction);
                    break;
            }
        }

        handleNavigationSwipe(direction, target, data) {
            // Handle navigation between different sections
            switch (direction) {
                case 'right':
                    this.navigateBack();
                    break;
                case 'left':
                    this.navigateForward();
                    break;
                case 'up':
                    this.showQuickActions();
                    break;
            }
        }

        handleGlobalSwipe(direction, data) {
            // Handle global swipe gestures
            if (data.startX < 20 && direction === 'right') {
                // Edge swipe from left - show navigation drawer
                this.showNavigationDrawer();
            } else if (data.startX > window.innerWidth - 20 && direction === 'left') {
                // Edge swipe from right - show settings panel
                this.showSettingsPanel();
            }
        }

        closePanelWithAnimation(panel) {
            panel.style.transition = 'transform 0.3s ease-out';
            panel.style.transform = 'translateY(100%)';
            
            setTimeout(() => {
                if (window.UnifiedLiveEdit.panelFactory) {
                    const panelId = panel.getAttribute('data-panel-id');
                    window.UnifiedLiveEdit.panelFactory.closePanel(panelId);
                }
            }, 300);
        }

        expandPanel(panel) {
            panel.style.transition = 'max-height 0.3s ease-out';
            panel.style.maxHeight = '90vh';
        }

        navigatePanelTabs(panel, direction) {
            const tabs = panel.querySelectorAll('.mas-panel-tab');
            const activeTab = panel.querySelector('.mas-panel-tab.active');
            
            if (!activeTab || tabs.length <= 1) return;
            
            const currentIndex = Array.from(tabs).indexOf(activeTab);
            let nextIndex;
            
            if (direction === 'left') {
                nextIndex = currentIndex > 0 ? currentIndex - 1 : tabs.length - 1;
            } else {
                nextIndex = currentIndex < tabs.length - 1 ? currentIndex + 1 : 0;
            }
            
            this.switchToTab(tabs[nextIndex]);
        }

        switchToTab(tab) {
            const panel = tab.closest('.mas-micro-panel');
            const allTabs = panel.querySelectorAll('.mas-panel-tab');
            
            allTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Trigger tab change event
            tab.click();
        }

        navigateBack() {
            if (this.currentIndex > 0) {
                this.currentIndex--;
                this.applyNavigationState();
            }
        }

        navigateForward() {
            if (this.currentIndex < this.navigationHistory.length - 1) {
                this.currentIndex++;
                this.applyNavigationState();
            }
        }

        showQuickActions() {
            // Show quick actions panel
            const quickActionsPanel = document.querySelector('.mas-quick-actions');
            if (quickActionsPanel) {
                quickActionsPanel.style.display = 'block';
                quickActionsPanel.style.animation = 'mas-fade-in 0.3s ease-out';
            }
        }

        showNavigationDrawer() {
            // Show navigation drawer
            const drawer = document.querySelector('.mas-navigation-drawer');
            if (drawer) {
                drawer.classList.add('open');
            }
        }

        showSettingsPanel() {
            // Show settings panel
            const settingsPanel = document.querySelector('.mas-settings-panel');
            if (settingsPanel) {
                settingsPanel.classList.add('open');
            }
        }

        registerNavigablePanel(panel) {
            panel.setAttribute('data-swipe-navigable', 'true');
        }

        isInPanel(target) {
            return target.closest('.mas-micro-panel') !== null;
        }

        isInNavigationArea(target) {
            return target.closest('.mas-navigation-area') !== null;
        }

        isGlobalSwipe(data) {
            return data.startX < 20 || data.startX > window.innerWidth - 20;
        }

        applyNavigationState() {
            const state = this.navigationHistory[this.currentIndex];
            if (state) {
                this.triggerNavigationCallbacks(state);
            }
        }

        triggerNavigationCallbacks(state) {
            this.navigationCallbacks.forEach(callback => {
                try {
                    callback(state);
                } catch (error) {
                    console.error('Navigation callback error:', error);
                }
            });
        }

        // Public API
        addNavigationState(state) {
            this.navigationHistory.push(state);
            this.currentIndex = this.navigationHistory.length - 1;
        }

        onNavigationChange(callback) {
            this.navigationCallbacks.add(callback);
        }

        offNavigationChange(callback) {
            this.navigationCallbacks.delete(callback);
        }

        enable() {
            this.isEnabled = true;
        }

        disable() {
            this.isEnabled = false;
        }
    }

    // ========================================================================
    // 📱 MODULE: MobileAccessibilityManager (Mobile accessibility features)
    // ========================================================================
    class MobileAccessibilityManager {
        constructor() {
            this.isEnabled = true;
            this.touchTargetSize = 44; // iOS HIG minimum
            this.focusRingEnabled = true;
            this.reduceMotionEnabled = false;
            this.highContrastEnabled = false;
            this.accessibilityAnnouncements = new Set();
        }

        init() {
            this.detectUserPreferences();
            this.enhanceTouchTargets();
            this.setupAccessibilityFeatures();
            this.setupGestureAccessibility();
            
            console.log('📱 Mobile Accessibility Manager initialized');
        }

        detectUserPreferences() {
            // Detect user preferences
            this.reduceMotionEnabled = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            this.highContrastEnabled = window.matchMedia('(prefers-contrast: high)').matches;
            
            // Monitor preference changes
            window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
                this.reduceMotionEnabled = e.matches;
                this.applyMotionPreferences();
            });
            
            window.matchMedia('(prefers-contrast: high)').addEventListener('change', (e) => {
                this.highContrastEnabled = e.matches;
                this.applyContrastPreferences();
            });
        }

        enhanceTouchTargets() {
            // Enhance touch targets for accessibility
            const controls = document.querySelectorAll('input, button, select, [role="button"]');
            
            controls.forEach(control => {
                this.enhanceControlAccessibility(control);
            });
            
            // Monitor for dynamically added controls
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            const newControls = node.querySelectorAll('input, button, select, [role="button"]');
                            newControls.forEach(control => {
                                this.enhanceControlAccessibility(control);
                            });
                        }
                    });
                });
            });
            
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        }

        enhanceControlAccessibility(control) {
            // Ensure minimum touch target size
            const rect = control.getBoundingClientRect();
            if (rect.width < this.touchTargetSize || rect.height < this.touchTargetSize) {
                control.style.minWidth = `${this.touchTargetSize}px`;
                control.style.minHeight = `${this.touchTargetSize}px`;
                control.style.position = 'relative';
            }
            
            // Add focus indicators
            if (this.focusRingEnabled) {
                control.style.outline = '2px solid transparent';
                control.style.outlineOffset = '2px';
                
                control.addEventListener('focus', () => {
                    control.style.outline = '2px solid #007cba';
                    control.style.outlineOffset = '2px';
                });
                
                control.addEventListener('blur', () => {
                    control.style.outline = '2px solid transparent';
                });
            }
            
            // Add touch feedback
            control.addEventListener('touchstart', () => {
                control.style.opacity = '0.7';
                control.style.transform = 'scale(0.95)';
            });
            
            control.addEventListener('touchend', () => {
                control.style.opacity = '1';
                control.style.transform = 'scale(1)';
            });
        }

        setupAccessibilityFeatures() {
            // Setup screen reader announcements
            this.createAriaLiveRegion();
            
            // Setup keyboard navigation
            this.setupKeyboardNavigation();
            
            // Setup voice control hints
            this.setupVoiceControlHints();
        }

        createAriaLiveRegion() {
            const liveRegion = document.createElement('div');
            liveRegion.id = 'mas-aria-live-region';
            liveRegion.setAttribute('aria-live', 'polite');
            liveRegion.setAttribute('aria-atomic', 'true');
            liveRegion.style.position = 'absolute';
            liveRegion.style.left = '-10000px';
            liveRegion.style.width = '1px';
            liveRegion.style.height = '1px';
            liveRegion.style.overflow = 'hidden';
            
            document.body.appendChild(liveRegion);
        }

        setupKeyboardNavigation() {
            // Tab navigation for mobile keyboards
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Tab') {
                    this.handleTabNavigation(e);
                }
            });
        }

        setupVoiceControlHints() {
            // Add voice control labels
            const controls = document.querySelectorAll('.mas-micro-panel input, .mas-micro-panel button');
            
            controls.forEach((control, index) => {
                if (!control.getAttribute('aria-label') && !control.getAttribute('aria-labelledby')) {
                    const label = this.generateVoiceLabel(control, index);
                    control.setAttribute('aria-label', label);
                }
            });
        }

        setupGestureAccessibility() {
            const touchManager = window.UnifiedLiveEdit.TouchGestureManager;
            if (!touchManager) return;

            // Add gesture descriptions
            touchManager.on('tap', (data) => {
                this.announceGesture('Tap', data.target);
            });

            touchManager.on('doubleTap', (data) => {
                this.announceGesture('Double tap', data.target);
            });

            touchManager.on('longPress', (data) => {
                this.announceGesture('Long press', data.target);
            });

            touchManager.on('swipe', (data) => {
                this.announceGesture(`Swipe ${data.direction}`, data.target);
            });
        }

        handleTabNavigation(e) {
            const focusableElements = document.querySelectorAll(
                'input, button, select, textarea, [tabindex]:not([tabindex="-1"]), [contenteditable="true"]'
            );
            
            const currentIndex = Array.from(focusableElements).indexOf(document.activeElement);
            
            if (e.shiftKey) {
                // Shift + Tab - go backward
                const prevIndex = currentIndex > 0 ? currentIndex - 1 : focusableElements.length - 1;
                focusableElements[prevIndex].focus();
            } else {
                // Tab - go forward
                const nextIndex = currentIndex < focusableElements.length - 1 ? currentIndex + 1 : 0;
                focusableElements[nextIndex].focus();
            }
            
            e.preventDefault();
        }

        generateVoiceLabel(control, index) {
            const tagName = control.tagName.toLowerCase();
            const type = control.type || '';
            const placeholder = control.placeholder || '';
            const nearbyText = this.getNearbyText(control);
            
            if (placeholder) return placeholder;
            if (nearbyText) return nearbyText;
            
            return `${tagName} ${type} ${index + 1}`;
        }

        getNearbyText(control) {
            // Look for nearby labels or text
            const label = control.closest('label');
            if (label) return label.textContent.trim();
            
            const labelFor = document.querySelector(`label[for="${control.id}"]`);
            if (labelFor) return labelFor.textContent.trim();
            
            const previousSibling = control.previousElementSibling;
            if (previousSibling && previousSibling.textContent.trim()) {
                return previousSibling.textContent.trim();
            }
            
            return null;
        }

        announceGesture(gesture, target) {
            const element = this.getElementDescription(target);
            this.announce(`${gesture} on ${element}`);
        }

        getElementDescription(element) {
            const tagName = element.tagName.toLowerCase();
            const ariaLabel = element.getAttribute('aria-label');
            const id = element.id;
            const className = element.className;
            
            if (ariaLabel) return ariaLabel;
            if (id) return `${tagName} with id ${id}`;
            if (className) return `${tagName} with class ${className.split(' ')[0]}`;
            
            return tagName;
        }

        announce(message) {
            const liveRegion = document.getElementById('mas-aria-live-region');
            if (liveRegion) {
                liveRegion.textContent = message;
                
                // Clear after announcement
                setTimeout(() => {
                    liveRegion.textContent = '';
                }, 1000);
            }
        }

        applyMotionPreferences() {
            const root = document.documentElement;
            
            if (this.reduceMotionEnabled) {
                root.style.setProperty('--mas-animation-duration', '0.01ms');
                root.style.setProperty('--mas-transition-duration', '0.01ms');
            } else {
                root.style.setProperty('--mas-animation-duration', '300ms');
                root.style.setProperty('--mas-transition-duration', '200ms');
            }
        }

        applyContrastPreferences() {
            const root = document.documentElement;
            
            if (this.highContrastEnabled) {
                root.classList.add('mas-high-contrast');
            } else {
                root.classList.remove('mas-high-contrast');
            }
        }

        // Public API
        announceToUser(message) {
            this.announce(message);
        }

        setFocusRingEnabled(enabled) {
            this.focusRingEnabled = enabled;
        }

        getTouchTargetSize() {
            return this.touchTargetSize;
        }

        setTouchTargetSize(size) {
            this.touchTargetSize = Math.max(size, 44); // Minimum 44px
        }
    }

    // ========================================================================
    // 🚀 MODULE: LiveEditEngine (Core engine)
    // ========================================================================
    class LiveEditEngine {
        constructor() {
            this.isActive = false;
            this.activePanels = new Map();
            this.globalMode = window.masLiveEdit && window.masLiveEdit.globalMode || false;
            this.stateManager = null; // Will be injected during initialization
            
            // Legacy compatibility - will be removed after migration
            this.settingsCache = new Map();
            this.saveQueue = new Map();
            this.saveInProgress = false;
            this.isOffline = false;
            this.retryQueue = [];
            this.debounceTimer = null;
            
            // Event listeners for connectivity
            window.addEventListener('online', () => this.handleOnline());
            window.addEventListener('offline', () => this.handleOffline());
        }
        
        init() {
            this.createToggleButton();
            this.prepareEditableElements();
            this.loadCurrentSettings();
            this.setupGlobalEventListeners();
            
            // Initialize Performance system first for optimal startup
            this.initializePerformanceSystem();
            
            // Initialize Undo/Redo system
            this.initializeUndoRedoSystem();
            
            // Initialize Accessibility system
            this.initializeAccessibilitySystem();
            
            // Initialize Batch Operations system
            this.initializeBatchOperationsSystem();
            
            // Initialize Smart Suggestions system
            this.initializeSmartSuggestionsSystem();
        this.initializeMobileSupport();
            
            // Auto-activate if in global mode and stored as active
            if (this.globalMode && localStorage.getItem('mas-global-live-edit-mode') === 'true') {
                this.isActive = true;
                this.activateEditMode();
            }
            
            // Performance optimization: Start continuous monitoring
            this.startPerformanceMonitoring();
            
            this.initializeMobileSupport();
        
        console.log('✅ LiveEditEngine initialized');
        }

        initializeUndoRedoSystem() {
            if (!this.undoRedoManager) {
                this.undoRedoManager = new UndoRedoManager();
                this.undoRedoManager.init();
                
                // Make it available globally
                window.UnifiedLiveEdit.UndoRedoManager = this.undoRedoManager;
                
                console.log('🔄 Undo/Redo system initialized');
            }
        }

        initializeAccessibilitySystem() {
            if (!this.accessibilityManager) {
                this.accessibilityManager = new AccessibilityManager();
                this.accessibilityManager.init();
                
                // Make it available globally
                window.UnifiedLiveEdit.AccessibilityManager = this.accessibilityManager;
                
                console.log('♿ Accessibility system initialized');
            }
        }

        initializeBatchOperationsSystem() {
            if (!this.batchOperationsManager) {
                this.batchOperationsManager = new BatchOperationsManager();
                this.batchOperationsManager.init();
                
                // Make it available globally
                window.UnifiedLiveEdit.BatchOperationsManager = this.batchOperationsManager;
                
                console.log('🔄 Batch Operations system initialized');
            }
        }

        initializePerformanceSystem() {
            if (!this.performanceManager) {
                this.performanceManager = new PerformanceManager();
                this.performanceManager.init();
                
                // Make it available globally
                window.UnifiedLiveEdit.PerformanceManager = this.performanceManager;
                
                console.log('⚡ Performance system initialized');
            }
        }

        initializeSmartSuggestionsSystem() {
            if (!this.smartSuggestionsManager) {
                this.smartSuggestionsManager = new SmartSuggestionsManager();
                this.smartSuggestionsManager.init();
                
                // Make it available globally
                window.UnifiedLiveEdit.SmartSuggestionsManager = this.smartSuggestionsManager;
                
                console.log('🎯 Smart Suggestions system initialized');
            }
        }
        
        initializeMobileSupport() {
        // Initialize mobile support systems
        this.touchGestureManager = new TouchGestureManager();
        this.touchGestureManager.init();
        
        this.mobileLayoutManager = new MobileLayoutManager();
        this.mobileLayoutManager.init();
        
        this.touchKeyboardManager = new TouchKeyboardManager();
        this.touchKeyboardManager.init();
        
        this.swipeNavigationManager = new SwipeNavigationManager();
        this.swipeNavigationManager.init();
        
        this.mobileAccessibilityManager = new MobileAccessibilityManager();
        this.mobileAccessibilityManager.init();
        
        // Setup mobile-specific integrations
        this.setupMobileIntegrations();
        
        console.log('📱 Mobile support systems initialized');
    }
    
    setupMobileIntegrations() {
        // Integrate touch gestures with existing systems
        this.touchGestureManager.on('tap', (data) => {
            this.handleMobileTap(data);
        });
        
        this.touchGestureManager.on('doubleTap', (data) => {
            this.handleMobileDoubleTap(data);
        });
        
        this.touchGestureManager.on('longPress', (data) => {
            this.handleMobileLongPress(data);
        });
        
        // Mobile keyboard adjustments
        this.touchKeyboardManager.onKeyboardToggle((state) => {
            this.handleKeyboardToggle(state);
        });
        
        // Mobile layout adaptations
        if (this.mobileLayoutManager.isCurrentlyMobile()) {
            this.adaptForMobile();
        }
    }
    
    handleMobileTap(data) {
        const element = data.target;
        
        // Handle editable elements
        if (element.hasAttribute('data-mas-editable')) {
            this.handleEditableTouch(element, data);
        }
        
        // Handle panel controls
        if (element.closest('.mas-micro-panel')) {
            this.handlePanelTouch(element, data);
        }
    }
    
    handleMobileDoubleTap(data) {
        const element = data.target;
        
        // Double tap to edit
        if (element.hasAttribute('data-mas-editable')) {
            this.activateDirectEdit(element);
        }
        
        // Double tap to expand panel
        if (element.closest('.mas-micro-panel')) {
            const panel = element.closest('.mas-micro-panel');
            this.mobileLayoutManager.expandPanel(panel);
        }
    }
    
    handleMobileLongPress(data) {
        const element = data.target;
        
        // Long press context menu
        if (element.hasAttribute('data-mas-editable')) {
            this.showMobileContextMenu(element, data);
        }
    }
    
    handleKeyboardToggle(state) {
        if (state.isVisible) {
            // Keyboard is visible - adjust layout
            this.mobileLayoutManager.adjustForKeyboard();
            
            // Notify performance system
            if (this.performanceManager) {
                this.performanceManager.notifyLayoutChange('keyboard-show');
            }
        } else {
            // Keyboard is hidden - restore layout
            this.mobileLayoutManager.resetViewportAdjustments();
            
            if (this.performanceManager) {
                this.performanceManager.notifyLayoutChange('keyboard-hide');
            }
        }
    }
    
    adaptForMobile() {
        // Adapt all existing panels for mobile
        const panels = document.querySelectorAll('.mas-micro-panel');
        panels.forEach(panel => {
            this.mobileLayoutManager.adaptPanelForMobile(panel);
        });
        
        // Adjust touch targets
        const controls = document.querySelectorAll('.mas-micro-panel input, .mas-micro-panel button');
        controls.forEach(control => {
            this.mobileAccessibilityManager.enhanceControlAccessibility(control);
        });
        
        // Enable swipe navigation
        this.swipeNavigationManager.enable();
    }
    
    handleEditableTouch(element, data) {
        // Show mobile editing interface
        const config = this.getConfigForElement(element);
        this.openMicroPanel(element, config);
    }
    
    handlePanelTouch(element, data) {
        // Handle mobile panel interactions
        const panel = element.closest('.mas-micro-panel');
        
        if (element.classList.contains('mas-panel-close')) {
            this.swipeNavigationManager.closePanelWithAnimation(panel);
        } else if (element.classList.contains('mas-panel-expand')) {
            this.mobileLayoutManager.expandPanel(panel);
        }
    }
    
    showMobileContextMenu(element, data) {
        const contextMenu = document.createElement('div');
        contextMenu.className = 'mas-mobile-context-menu';
        contextMenu.innerHTML = `
            <div class="context-menu-item" data-action="edit">Edit</div>
            <div class="context-menu-item" data-action="copy">Copy Styles</div>
            <div class="context-menu-item" data-action="paste">Paste Styles</div>
            <div class="context-menu-item" data-action="reset">Reset</div>
        `;
        
        // Position context menu
        contextMenu.style.position = 'fixed';
        contextMenu.style.left = `${data.x}px`;
        contextMenu.style.top = `${data.y}px`;
        contextMenu.style.zIndex = '10000';
        
        document.body.appendChild(contextMenu);
        
        // Handle context menu actions
        contextMenu.addEventListener('click', (e) => {
            const action = e.target.getAttribute('data-action');
            if (action) {
                this.handleContextMenuAction(action, element);
            }
            contextMenu.remove();
        });
        
        // Auto-hide context menu
        setTimeout(() => {
            if (contextMenu.parentNode) {
                contextMenu.remove();
            }
        }, 5000);
    }
    
    handleContextMenuAction(action, element) {
        switch (action) {
            case 'edit':
                this.activateDirectEdit(element);
                break;
            case 'copy':
                this.copyElementStyles(element);
                break;
            case 'paste':
                this.pasteElementStyles(element);
                break;
            case 'reset':
                this.resetElementStyles(element);
                break;
        }
    }
    
    activateDirectEdit(element) {
        // Direct editing for mobile
        const config = this.getConfigForElement(element);
        this.openMicroPanel(element, config);
    }
    
    copyElementStyles(element) {
        const styles = window.getComputedStyle(element);
        const styleData = {};
        
        for (let property of styles) {
            styleData[property] = styles.getPropertyValue(property);
        }
        
        // Store in memory
        this.copiedStyles = styleData;
        
        // Show feedback
        this.mobileAccessibilityManager.announceToUser('Styles copied');
        this.touchGestureManager.hapticFeedback('success');
    }
    
    pasteElementStyles(element) {
        if (!this.copiedStyles) {
            this.mobileAccessibilityManager.announceToUser('No styles to paste');
            return;
        }
        
        // Apply copied styles
        Object.keys(this.copiedStyles).forEach(property => {
            element.style[property] = this.copiedStyles[property];
        });
        
        this.mobileAccessibilityManager.announceToUser('Styles pasted');
        this.touchGestureManager.hapticFeedback('success');
    }
    
    resetElementStyles(element) {
        // Reset element styles
        element.removeAttribute('style');
        
        this.mobileAccessibilityManager.announceToUser('Styles reset');
        this.touchGestureManager.hapticFeedback('medium');
    }
    
    createToggleButton() {
            // Check if toggle already exists in HTML
            const existingToggle = document.getElementById('mas-v2-edit-mode-switch');
            const existingHeroToggle = document.getElementById('mas-v2-edit-mode-switch-hero');
            
            if (existingToggle) {
                existingToggle.addEventListener('change', () => {
                    this.isActive = existingToggle.checked;
                    this.handleToggleChange();
                });
                
                if (existingHeroToggle) {
                    existingHeroToggle.addEventListener('change', () => {
                        existingToggle.checked = existingHeroToggle.checked;
                        existingToggle.dispatchEvent(new Event('change'));
                    });
                }
                
                return;
            }
            
            // Create floating toggle if HTML toggle doesn't exist
            if (document.querySelector('.mas-live-edit-toggle')) {
                return;
            }
            
            const button = document.createElement('div');
            button.className = 'mas-live-edit-toggle';
            button.innerHTML = `
                <span class="dashicons dashicons-edit"></span>
                <span class="toggle-text">Live Edit</span>
            `;
            
            button.addEventListener('click', () => this.toggle());
            
            // Add to admin bar or body
            const adminBar = document.getElementById('wp-admin-bar-top-secondary');
            const target = adminBar || document.body;
            target.appendChild(button);
        }
        
        prepareEditableElements() {
            const editableElements = [
                { selector: '#wpadminbar', name: 'Admin Bar', type: 'admin-bar', category: 'adminBar', description: 'Top navigation bar' },
                { selector: '#adminmenuwrap', name: 'Admin Menu', type: 'admin-menu', category: 'menu', description: 'Left sidebar menu' },
                { selector: '#wpwrap', name: 'Content Area', type: 'content-area', category: 'content', description: 'Main content wrapper' },
                { selector: '#wpfooter', name: 'Footer', type: 'footer', category: 'footer', description: 'Bottom admin footer' },
                { selector: '.wrap', name: 'Page Content', type: 'page-content', category: 'content', description: 'Page content container' }
            ];
            
            let preparedCount = 0;
            
            editableElements.forEach(({ selector, name, type, category, description }) => {
                const elements = document.querySelectorAll(selector);
                elements.forEach(element => {
                    element.setAttribute('data-woow-editable', 'true');
                    element.setAttribute('data-mas-editable', 'true');
                    element.setAttribute('data-woow-element-name', name);
                    element.setAttribute('data-mas-element-name', name);
                    element.setAttribute('data-woow-element-type', type);
                    element.setAttribute('data-mas-element-type', type);
                    element.setAttribute('data-woow-category', category);
                    element.setAttribute('data-mas-category', category);
                    element.setAttribute('data-woow-element-description', description);
                    
                    if (!element.id) {
                        element.id = `woow-${type}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
                    }
                    
                    preparedCount++;
                });
            });
            
            console.log(`🏷️ Prepared ${preparedCount} editable elements`);
            document.body.classList.add('woow-live-edit-prepared');
        }
        
        toggle() {
            this.isActive = !this.isActive;
            this.handleToggleChange();
        }
        
        handleToggleChange() {
            document.body.classList.toggle('mas-live-edit-active', this.isActive);
            document.body.classList.toggle('mas-edit-mode-active', this.isActive);
            document.body.classList.toggle('woow-live-edit-enabled', this.isActive);
            
            if (this.isActive) {
                this.activateEditMode();
            } else {
                this.deactivateEditMode();
            }
        }
        
        activateEditMode() {
            document.body.classList.add('mas-just-activated');
            setTimeout(() => {
                document.body.classList.remove('mas-just-activated');
            }, 1500);
            
            this.enableEditableInteractions();
            this.addKeyboardShortcuts();
            this.showActivationToast();
        }
        
        enableEditableInteractions() {
            const editableElements = document.querySelectorAll('[data-woow-editable="true"]');
            editableElements.forEach(element => {
                element.addEventListener('click', (e) => this.handleEditableClick(e), { capture: true });
                element.style.outline = '2px dashed rgba(102, 126, 234, 0.6)';
                element.style.cursor = 'pointer';
            });
        }
        
        handleEditableClick(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const element = e.currentTarget;
            const config = this.getConfigForElement(element);
            
            if (config) {
                this.openMicroPanel(element, config);
            }
        }
        
        getConfigForElement(element) {
            const category = element.getAttribute('data-mas-category') || 'general';
            const type = element.getAttribute('data-mas-element-type') || 'unknown';
            const name = element.getAttribute('data-mas-element-name') || 'Element';
            
            // Return a basic config - in real implementation this would come from option configurations
            return {
                title: `Edit ${name}`,
                category: category,
                icon: 'edit',
                options: [
                    {
                        id: `${type}_bg_color`,
                        label: 'Background Color',
                        type: 'color',
                        cssVar: `--woow-${type}-bg-color`,
                        default: '#ffffff',
                        section: 'Colors'
                    },
                    {
                        id: `${type}_text_color`,
                        label: 'Text Color',
                        type: 'color',
                        cssVar: `--woow-${type}-text-color`,
                        default: '#000000',
                        section: 'Colors'
                    },
                    {
                        id: `${type}_padding`,
                        label: 'Padding',
                        type: 'slider',
                        min: 0,
                        max: 50,
                        unit: 'px',
                        cssVar: `--woow-${type}-padding`,
                        default: 15,
                        section: 'Spacing'
                    }
                ]
            };
        }
        
        openMicroPanel(element, config) {
            // Close other panels
            this.activePanels.forEach(panel => panel.close());
            this.activePanels.clear();
            
            const panel = window.UnifiedLiveEdit.panelFactory.createPanel(element, config, this);
            this.activePanels.set(config.category, panel);
        }
        
        addKeyboardShortcuts() {
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this.isActive) {
                    this.deactivateEditMode();
                }
                
                if ((e.ctrlKey || e.metaKey) && e.key === 'e' && !e.shiftKey) {
                    e.preventDefault();
                    this.toggle();
                }
            });
        }
        
        deactivateEditMode() {
            document.body.classList.remove('mas-just-activated');
            
            const editableElements = document.querySelectorAll('[data-woow-editable="true"]');
            editableElements.forEach(element => {
                element.removeEventListener('click', this.handleEditableClick, { capture: true });
                element.style.outline = '';
                element.style.cursor = '';
            });
            
            this.activePanels.forEach(panel => panel.close());
            this.activePanels.clear();
            
            // Emit event for accessibility system
            document.dispatchEvent(new CustomEvent('mas:live-edit-deactivated'));
        }
        
        loadCurrentSettings() {
            // Use StateManager for comprehensive settings loading if available
            if (this.stateManager) {
                const allSettings = this.stateManager.getAllSettings();
                Object.entries(allSettings).forEach(([key, value]) => {
                    this.settingsCache.set(key, value);
                });
                return;
            }
            
            // Fallback to localStorage if StateManager not available
            try {
                const saved = localStorage.getItem('mas_live_edit_settings');
                if (saved) {
                    const settings = JSON.parse(saved);
                    Object.entries(settings).forEach(([key, value]) => {
                        this.settingsCache.set(key, value);
                    });
                }
            } catch (error) {
                console.error('Error loading settings', error);
            }
        }
        
        saveSetting(key, value) {
            const oldValue = this.settingsCache.get(key);
            
            // Update local cache for backwards compatibility
            this.settingsCache.set(key, value);
            
            // Use StateManager for comprehensive state management
            if (this.stateManager) {
                this.stateManager.updateSetting(key, value, {
                    source: 'live_edit',
                    broadcast: true,
                    immediate: true
                });
            } else {
                // Fallback to old method if StateManager not available
                this.debouncedSave();
                this.applySettingImmediately(key, value);
            }
            
            // Record action for undo/redo
            if (this.undoRedoManager && oldValue !== value) {
                this.undoRedoManager.recordAction(
                    this.undoRedoManager.actionTypes.SETTING_CHANGE,
                    {
                        setting: key,
                        value: value,
                        previousValue: oldValue
                    },
                    `Setting: ${key} changed`
                );
            }
        }
        
        applySettingImmediately(key, value) {
            const cssVar = this.mapSettingToCSSVar(key);
            if (cssVar) {
                document.documentElement.style.setProperty(cssVar, value);
            }
        }
        
        mapSettingToCSSVar(key) {
            const mapping = {
                'admin_bar_bg_color': '--woow-adminbar-bg-color',
                'admin_bar_text_color': '--woow-adminbar-text-color',
                'menu_bg_color': '--woow-menu-bg-color',
                'menu_text_color': '--woow-menu-text-color',
                'content_bg_color': '--woow-content-bg-color'
            };
            
            return mapping[key] || `--woow-${key}`;
        }
        
        debouncedSave = this.debounce(async () => {
            try {
                const settings = {};
                this.settingsCache.forEach((value, key) => {
                    settings[key] = value;
                });
                
                localStorage.setItem('mas_live_edit_settings', JSON.stringify(settings));
                
                // Try to save to server if online
                if (!this.isOffline && window.masLiveEdit) {
                    await this.saveToServer(settings);
                }
                
                this.showSaveToast();
            } catch (error) {
                console.error('Error saving settings', error);
                window.UnifiedLiveEdit.MASToast.error('Failed to save settings');
            }
        }, 500);
        
        debounce(func, wait) {
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
        
        async saveToServer(settings) {
            if (!window.masLiveEdit || !window.masLiveEdit.ajaxUrl) return;
            
            const formData = new FormData();
            formData.append('action', 'mas_save_live_edit_settings');
            formData.append('nonce', window.masLiveEdit.nonce);
            formData.append('settings', JSON.stringify(settings));
            
            const response = await fetch(window.masLiveEdit.ajaxUrl, {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
        }
        
        setupGlobalEventListeners() {
            // Listen for settings changes from other sources
            window.addEventListener('storage', (e) => {
                if (e.key === 'mas_live_edit_settings') {
                    this.loadCurrentSettings();
                }
            });
        }
        
        showActivationToast() {
            window.UnifiedLiveEdit.MASToast.success('Live Edit Mode Activated! Click elements to edit.', 3000);
            
            // Announce for accessibility
            if (this.accessibilityManager) {
                this.accessibilityManager.announce('Live Edit Mode Activated! Click elements to edit or use keyboard navigation.', true);
            }
            
            // Emit event for accessibility system
            document.dispatchEvent(new CustomEvent('mas:live-edit-activated'));
        }
        
        showSaveToast() {
            window.UnifiedLiveEdit.MASToast.info('Settings saved', 2000);
        }
        
        handleOffline() {
            this.isOffline = true;
            window.UnifiedLiveEdit.MASToast.warning('You are offline. Changes will be saved locally.', 5000);
        }
        
        async handleOnline() {
            this.isOffline = false;
            window.UnifiedLiveEdit.MASToast.info('Back online. Syncing changes...', 3000);
            
            // Try to sync pending changes
            try {
                const settings = {};
                this.settingsCache.forEach((value, key) => {
                    settings[key] = value;
                });
                await this.saveToServer(settings);
                window.UnifiedLiveEdit.MASToast.success('Changes synced successfully', 2000);
            } catch (error) {
                console.error('Failed to sync changes', error);
            }
        }

        startPerformanceMonitoring() {
            if (!this.performanceManager) return;
            
            // Monitor critical performance metrics
            setInterval(() => {
                if (this.performanceManager.isPerformanceCritical()) {
                    console.warn('⚠️ Performance critical - enabling optimization mode');
                    this.performanceManager.enablePerformanceMode();
                    
                    // Notify user via toast
                    if (window.UnifiedLiveEdit.MASToast) {
                        window.UnifiedLiveEdit.MASToast.warning(
                            'Performance optimizations enabled due to high resource usage', 
                            5000
                        );
                    }
                } else if (this.performanceManager.config.performanceMode) {
                    // Re-enable full features if performance improves
                    this.performanceManager.disablePerformanceMode();
                }
            }, 10000); // Check every 10 seconds
            
            // Add performance marks for key operations
            this.performanceManager.mark('mas-live-edit-init-complete');
            
            console.log('📊 Performance monitoring started');
        }
    }

    // ========================================================================
    // 🎯 MODULE: PresetManager (Preset system)
    // ========================================================================
    class PresetManager {
        constructor() {
            this.apiBase = window.wpApiSettings ? window.wpApiSettings.root + 'modern-admin-styler/v2/presets' : '/wp-json/modern-admin-styler/v2/presets';
            this.nonce = window.wpApiSettings ? window.wpApiSettings.nonce : '';
            this.currentSettings = {};
            this.presets = [];
            this.selectedPresetId = null;
        }
        
        init() {
            this.bindEvents();
            this.loadPresets();
            this.addKeyboardShortcuts();
        }
        
        bindEvents() {
            // Preset selection
            const selectElement = document.getElementById('mas-v2-presets-select');
            if (selectElement) {
                selectElement.addEventListener('change', (e) => {
                    this.selectedPresetId = e.target.value;
                    if (this.selectedPresetId) {
                        this.showPresetInfo(this.selectedPresetId);
                    } else {
                        this.hidePresetInfo();
                    }
                });
            }
            
            // Preset action buttons
            const buttons = {
                'mas-v2-save-preset': () => this.showSaveDialog(),
                'mas-v2-apply-preset': () => this.applySelectedPreset(),
                'mas-v2-export-preset': () => this.exportSelectedPreset(),
                'mas-v2-import-preset': () => this.showImportDialog(),
                'mas-v2-delete-preset': () => this.deleteSelectedPreset()
            };
            
            Object.entries(buttons).forEach(([id, handler]) => {
                const btn = document.getElementById(id);
                if (btn) {
                    btn.addEventListener('click', handler);
                }
            });
        }
        
        addKeyboardShortcuts() {
            document.addEventListener('keydown', (e) => {
                if ((e.ctrlKey || e.metaKey) && e.shiftKey) {
                    switch (e.key) {
                        case 'S':
                            e.preventDefault();
                            this.showSaveDialog();
                            break;
                        case 'L':
                            e.preventDefault();
                            this.applySelectedPreset();
                            break;
                        case 'E':
                            e.preventDefault();
                            this.exportSelectedPreset();
                            break;
                    }
                }
            });
        }
        
        async loadPresets() {
            try {
                const response = await fetch(this.apiBase, {
                    method: 'GET',
                    headers: {
                        'X-WP-Nonce': this.nonce,
                        'Content-Type': 'application/json'
                    }
                });
                
                const result = await response.json();
                
                if (result.success) {
                    this.presets = result.data;
                    this.populatePresetSelect();
                    window.UnifiedLiveEdit.MASToast.success(`Loaded ${this.presets.length} presets`, 3000);
                } else {
                    throw new Error(result.message || 'Failed to load presets');
                }
                
            } catch (error) {
                console.error('Failed to load presets:', error);
                window.UnifiedLiveEdit.MASToast.error('Failed to load presets: ' + error.message, 5000);
            }
        }
        
        populatePresetSelect() {
            const selectElement = document.getElementById('mas-v2-presets-select');
            if (!selectElement) return;
            
            // Clear existing options except the first one
            while (selectElement.children.length > 1) {
                selectElement.removeChild(selectElement.lastChild);
            }
            
            // Add presets as options
            this.presets.forEach(preset => {
                const option = document.createElement('option');
                option.value = preset.id;
                option.textContent = preset.name;
                selectElement.appendChild(option);
            });
        }
        
        showSaveDialog() {
            const name = prompt('Enter preset name:');
            if (name && name.trim()) {
                this.saveCurrentAsPreset(name.trim());
            }
        }
        
        async saveCurrentAsPreset(name, description = '') {
            try {
                const settings = this.getCurrentSettings();
                
                const response = await fetch(this.apiBase, {
                    method: 'POST',
                    headers: {
                        'X-WP-Nonce': this.nonce,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        name: name,
                        description: description,
                        settings: settings
                    })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    window.UnifiedLiveEdit.MASToast.success(`Preset "${name}" saved successfully`, 3000);
                    this.loadPresets(); // Refresh the list
                } else {
                    throw new Error(result.message || 'Failed to save preset');
                }
                
            } catch (error) {
                console.error('Failed to save preset:', error);
                window.UnifiedLiveEdit.MASToast.error('Failed to save preset: ' + error.message, 5000);
            }
        }
        
        async applySelectedPreset() {
            if (!this.selectedPresetId) {
                window.UnifiedLiveEdit.MASToast.warning('Please select a preset first', 3000);
                return;
            }
            
            const preset = this.presets.find(p => p.id === this.selectedPresetId);
            if (!preset) {
                window.UnifiedLiveEdit.MASToast.error('Preset not found', 3000);
                return;
            }
            
            try {
                // Apply settings
                Object.entries(preset.settings).forEach(([key, value]) => {
                    // Apply to LiveEditEngine if available
                    if (window.UnifiedLiveEdit.liveEditEngine) {
                        window.UnifiedLiveEdit.liveEditEngine.saveSetting(key, value);
                    }
                    
                    // Apply to SettingsRestorer if available
                    if (window.UnifiedLiveEdit.settingsRestorer) {
                        window.UnifiedLiveEdit.settingsRestorer.setSetting(key, value);
                    }
                    
                    // Apply to form fields if they exist
                    const field = document.querySelector(`[name="${key}"]`);
                    if (field) {
                        if (field.type === 'checkbox') {
                            field.checked = !!value;
                        } else {
                            field.value = value;
                        }
                        field.dispatchEvent(new Event('change', { bubbles: true }));
                    }
                });
                
                window.UnifiedLiveEdit.MASToast.success(`Applied preset "${preset.name}"`, 3000);
                
            } catch (error) {
                console.error('Failed to apply preset:', error);
                window.UnifiedLiveEdit.MASToast.error('Failed to apply preset: ' + error.message, 5000);
            }
        }
        
        exportSelectedPreset() {
            if (!this.selectedPresetId) {
                window.UnifiedLiveEdit.MASToast.warning('Please select a preset first', 3000);
                return;
            }
            
            const preset = this.presets.find(p => p.id === this.selectedPresetId);
            if (!preset) {
                window.UnifiedLiveEdit.MASToast.error('Preset not found', 3000);
                return;
            }
            
            const dataStr = JSON.stringify(preset, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(dataBlob);
            link.download = `mas-preset-${preset.name}.json`;
            link.click();
            
            window.UnifiedLiveEdit.MASToast.success(`Exported preset "${preset.name}"`, 3000);
        }
        
        showImportDialog() {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';
            input.onchange = (e) => {
                const file = e.target.files[0];
                if (file) {
                    this.importPresetFromFile(file);
                }
            };
            input.click();
        }
        
        async importPresetFromFile(file) {
            try {
                const text = await file.text();
                const preset = JSON.parse(text);
                
                // Validate preset structure
                if (!preset.name || !preset.settings) {
                    throw new Error('Invalid preset file structure');
                }
                
                // Save as new preset
                await this.saveCurrentAsPreset(preset.name, preset.description || 'Imported preset');
                
                window.UnifiedLiveEdit.MASToast.success(`Imported preset "${preset.name}"`, 3000);
                
            } catch (error) {
                console.error('Failed to import preset:', error);
                window.UnifiedLiveEdit.MASToast.error('Failed to import preset: ' + error.message, 5000);
            }
        }
        
        async deleteSelectedPreset() {
            if (!this.selectedPresetId) {
                window.UnifiedLiveEdit.MASToast.warning('Please select a preset first', 3000);
                return;
            }
            
            const preset = this.presets.find(p => p.id === this.selectedPresetId);
            if (!preset) {
                window.UnifiedLiveEdit.MASToast.error('Preset not found', 3000);
                return;
            }
            
            if (!confirm(`Are you sure you want to delete preset "${preset.name}"?`)) {
                return;
            }
            
            try {
                const response = await fetch(`${this.apiBase}/${this.selectedPresetId}`, {
                    method: 'DELETE',
                    headers: {
                        'X-WP-Nonce': this.nonce
                    }
                });
                
                const result = await response.json();
                
                if (result.success) {
                    window.UnifiedLiveEdit.MASToast.success(`Deleted preset "${preset.name}"`, 3000);
                    this.selectedPresetId = null;
                    this.loadPresets(); // Refresh the list
                } else {
                    throw new Error(result.message || 'Failed to delete preset');
                }
                
            } catch (error) {
                console.error('Failed to delete preset:', error);
                window.UnifiedLiveEdit.MASToast.error('Failed to delete preset: ' + error.message, 5000);
            }
        }
        
        getCurrentSettings() {
            const settings = {};
            
            // Get from LiveEditEngine cache if available
            if (window.UnifiedLiveEdit.liveEditEngine && window.UnifiedLiveEdit.liveEditEngine.settingsCache) {
                window.UnifiedLiveEdit.liveEditEngine.settingsCache.forEach((value, key) => {
                    settings[key] = value;
                });
            }
            
            // Get from form fields
            const form = document.getElementById('mas-v2-settings-form');
            if (form) {
                const formData = new FormData(form);
                for (const [key, value] of formData.entries()) {
                    settings[key] = value;
                }
            }
            
            // Get from localStorage as fallback
            try {
                const saved = localStorage.getItem('mas_live_edit_settings');
                if (saved) {
                    const parsed = JSON.parse(saved);
                    Object.assign(settings, parsed);
                }
            } catch (error) {
                console.error('Error reading settings from localStorage', error);
            }
            
            return settings;
        }
        
        showPresetInfo(presetId) {
            const preset = this.presets.find(p => p.id === presetId);
            if (!preset) return;
            
            const infoContainer = document.getElementById('mas-preset-info');
            if (infoContainer) {
                infoContainer.innerHTML = `
                    <h4>${preset.name}</h4>
                    <p>${preset.description || 'No description available'}</p>
                    <small>Created: ${new Date(preset.created_at).toLocaleDateString()}</small>
                `;
                infoContainer.style.display = 'block';
            }
        }
        
        hidePresetInfo() {
            const infoContainer = document.getElementById('mas-preset-info');
            if (infoContainer) {
                infoContainer.style.display = 'none';
            }
        }
    }

    // ========================================================================
    // 🚀 EXPORT: Global objects and initialization
    // ========================================================================
    window.UnifiedLiveEdit = {
        SyncManager,
        StateManager,
        BeforeUnloadProtection,
        SettingsRestorer,
        MASToastNotifications,
        MASLivePreview,
        MicroPanelFactory,
        SmartPositioner,
        CollisionDetector,
        PanelResizer,
        VisualEffects,
        MicroPanel,
        UndoRedoManager,
        AccessibilityManager,
        BatchOperationsManager,
        AutoCompleteEngine,
        ColorHarmonyEngine,
        ResponsiveBreakpointEngine,
        SmartSuggestionsManager,
        LazyLoadManager,
        VirtualScrollManager,
        MemoryManager,
        CacheManager,
        BatchProcessor,
        EventThrottler,
        PerformanceManager,
        TouchGestureManager,
        MobileLayoutManager,
        TouchKeyboardManager,
        SwipeNavigationManager,
        MobileAccessibilityManager,
        LiveEditEngine,
        PresetManager,
        version: '4.0.0',
        
        // Initialize all modules
        async init() {
            console.log('🚀 Initializing UnifiedLiveEdit system...');
            
            // Initialize StateManager first (critical for settings persistence)
            window.UnifiedLiveEdit.stateManager = new StateManager();
            await window.UnifiedLiveEdit.stateManager.init();
            
            // Initialize sync manager
            SyncManager.init();
            MASLivePreview.init();
            
            // Create toast notifications
            window.UnifiedLiveEdit.MASToast = new MASToastNotifications();
            window.UnifiedLiveEdit.MASToast.init();
            
            // Enhanced UX components
            window.UnifiedLiveEdit.smartPositioner = new SmartPositioner();
            window.UnifiedLiveEdit.collisionDetector = new CollisionDetector();
            window.UnifiedLiveEdit.panelResizer = new PanelResizer();
            window.UnifiedLiveEdit.visualEffects = new VisualEffects();
            
            // Panel factory with enhanced components
            window.UnifiedLiveEdit.panelFactory = new MicroPanelFactory();
            window.UnifiedLiveEdit.panelFactory.smartPositioner = window.UnifiedLiveEdit.smartPositioner;
            window.UnifiedLiveEdit.panelFactory.collisionDetector = window.UnifiedLiveEdit.collisionDetector;
            window.UnifiedLiveEdit.panelFactory.panelResizer = window.UnifiedLiveEdit.panelResizer;
            window.UnifiedLiveEdit.panelFactory.visualEffects = window.UnifiedLiveEdit.visualEffects;
            
            // Live edit engine with StateManager integration
            window.UnifiedLiveEdit.liveEditEngine = new LiveEditEngine();
            window.UnifiedLiveEdit.liveEditEngine.stateManager = window.UnifiedLiveEdit.stateManager;
            window.UnifiedLiveEdit.liveEditEngine.init();
            
            // Preset manager
            window.UnifiedLiveEdit.presetManager = new PresetManager();
            window.UnifiedLiveEdit.presetManager.init();
            
            console.log('✅ UnifiedLiveEdit system fully initialized with StateManager & Enhanced UX');
        }
    };
    
    // Legacy compatibility
    window.SyncManager = SyncManager;
    window.MASToast = window.UnifiedLiveEdit.MASToast;
    window.MicroPanelFactory = window.UnifiedLiveEdit.panelFactory;
    window.liveEditInstance = window.UnifiedLiveEdit.liveEditEngine;
    window.masLiveEditMode = window.UnifiedLiveEdit.liveEditEngine;

    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.UnifiedLiveEdit.init();
        });
    } else {
        window.UnifiedLiveEdit.init();
    }

})(window, document, jQuery); 
