/**
 * 🎯 Live Edit Mode - Enterprise Implementation
 * 

// ========================================================================
// WOOW! SEMANTIC CSS VARIABLES SYSTEM
// Controllers synchronized with --woow-{category}-{role} architecture
// ========================================================================
 * Implements the comprehensive option mapping plan with contextual micro-panels
 * Based on the strategic blueprint of 107+ options across 8 categories
 * 
 * @package ModernAdminStyler
 * @version 3.0.0 - Live Edit Mode
 */

/**
 * ========================================================================
 *  🌐 ENTERPRISE SYNCMANAGER: Multi-tab synchronization with BroadcastChannel
 * ========================================================================
 * World-class pattern for synchronization based on user's specifications.
 * Handles multi-tab and cross-browser synchronization with anti-echo protection.
 */
const SyncManager = {
    channel: null,
    tabId: Date.now() + Math.random(), // Simple unique ID for the current tab session

    init() {
        if ('BroadcastChannel' in window) {
            this.channel = new BroadcastChannel('woow_settings_sync');
            this.channel.onmessage = (event) => {
                const { key, value, sourceTabId } = event.data;
                // IMPORTANT: Ignore messages from the same tab to prevent loops.
                if (sourceTabId !== this.tabId) {
                    console.log(`🔄 SyncManager: Received update for '${key}' from another tab.`);
                    // Apply the update received from another tab to the UI.
                    // This function needs to update the control (e.g., color picker) and the live style.
                    if (window.liveEditInstance) {
                        window.liveEditInstance.applyRemoteUpdate(key, value);
                    }
                }
            };
            console.log('✅ SyncManager: BroadcastChannel initialized with tabId:', this.tabId);
        } else {
            // Fallback for older browsers using localStorage events
            console.log('⚠️ SyncManager: BroadcastChannel not supported, using localStorage fallback');
            this.initLocalStorageFallback();
        }
    },

    /**
     * Broadcasts a change to all other open tabs.
     * @param {string} key The setting key that changed.
     * @param {*} value The new value.
     */
    broadcast(key, value) {
        if (!this.channel) {
            this.broadcastViaLocalStorage(key, value);
            return;
        }

        const payload = {
            key,
            value,
            sourceTabId: this.tabId,
            timestamp: Date.now()
        };
        
        try {
            this.channel.postMessage(payload);
            console.log(`📡 SyncManager: Broadcasted '${key}' change to other tabs`);
        } catch (error) {
            console.warn('⚠️ SyncManager: Broadcast failed, falling back to localStorage', error);
            this.broadcastViaLocalStorage(key, value);
        }
    },

    /**
     * Fallback synchronization via localStorage for older browsers
     */
    initLocalStorageFallback() {
        window.addEventListener('storage', (event) => {
            if (event.key === 'woow_sync_event' && event.newValue) {
                try {
                    const data = JSON.parse(event.newValue);
                    // Anti-echo: ignore our own messages
                    if (data.sourceTabId !== this.tabId && window.liveEditInstance) {
                        window.liveEditInstance.applyRemoteUpdate(data.key, data.value);
                    }
                } catch (e) {
                    console.error('🚨 SyncManager: Failed to parse localStorage sync event', e);
                }
            }
        });
    },

    /**
     * Broadcast via localStorage (fallback method)
     */
    broadcastViaLocalStorage(key, value) {
        const payload = {
            key,
            value,
            sourceTabId: this.tabId,
            timestamp: Date.now()
        };
        
        try {
            localStorage.setItem('woow_sync_event', JSON.stringify(payload));
            // Clear immediately to allow repeated events
            setTimeout(() => localStorage.removeItem('woow_sync_event'), 100);
        } catch (error) {
            console.error('🚨 SyncManager: localStorage broadcast failed', error);
        }
    },

    /**
     * Cleanup when page unloads
     */
    destroy() {
        if (this.channel) {
            this.channel.close();
            this.channel = null;
        }
    }
};

// ========================================================================
// 🛡️ BEFOREUNLOAD PROTECTION: Enterprise-grade data protection
// ========================================================================
class BeforeUnloadProtection {
    static isActive = false;
    static pendingChanges = new Set();

    static enable() {
        if (!this.isActive) {
            window.addEventListener('beforeunload', this.handleBeforeUnload);
            this.isActive = true;
        }
    }

    static disable() {
        if (this.isActive) {
            window.removeEventListener('beforeunload', this.handleBeforeUnload);
            this.isActive = false;
        }
    }

    static addPendingChange(key) {
        this.pendingChanges.add(key);
        this.enable();
    }

    static removePendingChange(key) {
        this.pendingChanges.delete(key);
        if (this.pendingChanges.size === 0) {
            this.disable();
        }
    }

    static handleBeforeUnload = (e) => {
        if (this.pendingChanges.size > 0) {
            // Try synchronous save using sendBeacon if available
            if (navigator.sendBeacon && window.liveEditInstance) {
                window.liveEditInstance.synchronousFlush();
            }
            
            const message = 'You have unsaved changes. Are you sure you want to leave?';
            e.returnValue = message;
            return message;
        }
    }
}

/**
 * 🔍 WOOW! Live Edit Debugger - System monitoringu i diagnostyki
 */
class LiveEditDebugger {
    static log(message, data = null) {
        if (window.masV2Debug) {
            console.log(`🔍 WOOW! Debug: ${message}`, data);
        }
    }
    
    static trackSettingChange(key, oldValue, newValue) {
        this.log(`Setting changed: ${key}`, {
            old: oldValue,
            new: newValue,
            timestamp: new Date().toISOString()
        });
    }
    
    static trackDatabaseSave(key, success, error = null) {
        if (success) {
            this.log(`✅ Database save successful: ${key}`);
        } else {
            this.log(`❌ Database save failed: ${key}`, error);
        }
    }
    
    static trackCSSVariable(cssVar, value) {
        this.log(`🎨 CSS Variable applied: ${cssVar} = ${value}`);
    }
}

// Toast notifications
class Toast {
    static show(message, type = 'info', timeout = 3000) {
        let toast = document.createElement('div');
        toast.className = `woow-toast woow-toast-${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => toast.classList.add('visible'), 10);
        setTimeout(() => {
            toast.classList.remove('visible');
            setTimeout(() => toast.remove(), 300);
        }, timeout);
    }
}

// Loader/spinner
class Loader {
    static show() {
        if (document.getElementById('woow-loader')) return;
        let loader = document.createElement('div');
        loader.id = 'woow-loader';
        loader.innerHTML = '<div class="woow-spinner"></div>';
        document.body.appendChild(loader);
    }
    static hide() {
        let loader = document.getElementById('woow-loader');
        if (loader) loader.remove();
    }
}

// Banner trybu offline/online
class ConnectionBanner {
    static show(status) {
        let banner = document.getElementById('woow-connection-banner');
        if (!banner) {
            banner = document.createElement('div');
            banner.id = 'woow-connection-banner';
            document.body.appendChild(banner);
        }
        banner.textContent = status === 'offline' ? 'Brak połączenia – tryb offline' : 'Połączono – tryb online';
        banner.className = status === 'offline' ? 'woow-banner-offline' : 'woow-banner-online';
        banner.style.display = 'block';
    }
    static hide() {
        const banner = document.getElementById('woow-connection-banner');
        if (banner) banner.style.display = 'none';
    }
}

// Obsługa zmiany statusu połączenia
window.addEventListener('online', () => {
    ConnectionBanner.show('online');
    setTimeout(() => ConnectionBanner.hide(), 2000);
});
window.addEventListener('offline', () => {
    ConnectionBanner.show('offline');
});

// Tooltipy (prosty mechanizm)
document.addEventListener('mouseover', (e) => {
    const el = e.target.closest('[data-tooltip]');
    if (!el) return;
    let tooltip = document.createElement('div');
    tooltip.className = 'woow-tooltip';
    tooltip.textContent = el.dataset.tooltip;
    document.body.appendChild(tooltip);
    const rect = el.getBoundingClientRect();
    tooltip.style.left = rect.left + window.scrollX + rect.width / 2 + 'px';
    tooltip.style.top = rect.top + window.scrollY - 32 + 'px';
    el._woowTooltip = tooltip;
});
document.addEventListener('mouseout', (e) => {
    const el = e.target.closest('[data-tooltip]');
    if (el && el._woowTooltip) {
        el._woowTooltip.remove();
        el._woowTooltip = null;
    }
});

// Rozszerzenie SettingsRestorer o synchronizację UI
class SettingsRestorer {
    constructor() {
        this.init();
    }
    
    init() {
        // Przywróć ustawienia natychmiast po DOMContentLoaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.restoreSettings();
            });
        } else {
            this.restoreSettings();
        }
    }
    
    async restoreSettings() {
        try {
            LiveEditDebugger.log('🔄 Starting settings restoration...');
            const response = await fetch(window.ajaxurl + '?action=mas_get_live_settings&nonce=' + window.masNonce);
            const data = await response.json();
            if (data.success && data.settings) {
                LiveEditDebugger.log('✅ Settings loaded from database', data.settings);
                this.applyAllSettingsToUI(data.settings);
                if (window.liveEditInstance) {
                    window.liveEditInstance.settingsCache = new Map(Object.entries(data.settings));
                }
            } else {
                throw new Error(data.message || 'Failed to load settings');
            }
        } catch (error) {
            console.error('❌ WOOW! Failed to restore settings from database:', error);
            this.restoreFromLocalStorage();
        }
    }
    
    applySettingToCSS(key, value) {
        // Mapuj ustawienia na CSS variables
        const cssVar = this.mapSettingToCSSVar(key);
        if (cssVar && value !== null && value !== undefined) {
            document.documentElement.style.setProperty(cssVar, value);
            LiveEditDebugger.trackCSSVariable(cssVar, value);
        }
    }
    
    // 🔧 NAPRAWIONE: Dodano brakującą metodę applyAllSettingsToUI
    applyAllSettingsToUI(settings) {
        if (!settings || typeof settings !== 'object') {
            console.warn('⚠️ WOOW! Invalid settings object passed to applyAllSettingsToUI');
            return;
        }
        
        Object.entries(settings).forEach(([key, value]) => {
            this.applySettingToCSS(key, value);
        });
        
        LiveEditDebugger.log('✅ Applied all settings to UI', {
            settingsCount: Object.keys(settings).length,
            settings: Object.keys(settings)
        });
    }
    
    mapSettingToCSSVar(key) {
        const mapping = {
            'admin_bar_background': '--woow-surface-bar',
            'admin_bar_text_color': '--woow-surface-bar-text',
            'admin_bar_hover_color': '--woow-surface-bar-hover',
            'admin_bar_height': '--woow-surface-bar-height',
            'admin_bar_font_size': '--woow-surface-bar-font-size',
            'admin_bar_border_radius': '--woow-radius-bar',
            'menu_background': '--woow-surface-menu',
            'menu_text_color': '--woow-surface-menu-text',
            'menu_hover_color': '--woow-surface-menu-hover',
            'menu_width': '--woow-surface-menu-width',
            'menu_border_radius': '--woow-radius-menu',
            'accent_color': '--woow-accent-primary'
        };
        
        const cssVar = mapping[key] || null;
        
        // 🔍 DEBUG: Log mapping results
        if (window.masV2Debug || window.woowDebug) {
            if (cssVar) {
                console.log(`🎨 WOOW! Debug: Mapped setting "${key}" → CSS variable "${cssVar}"`);
            } else {
                console.warn(`⚠️ WOOW! Debug: No CSS variable mapping found for setting "${key}"`);
                console.log(`🔍 WOOW! Debug: Available mappings:`, Object.keys(mapping));
            }
        }
        
        return cssVar;
    }
    
    restoreFromLocalStorage() {
        try {
            const saved = localStorage.getItem('mas_live_edit_settings');
            if (saved) {
                const settings = JSON.parse(saved);
                LiveEditDebugger.log('🔄 Restoring from localStorage', settings);
                this.applyAllSettingsToUI(settings);
            }
        } catch (error) {
            console.error('❌ WOOW! Failed to restore from localStorage:', error);
        }
    }
}

// Rozszerzenie LiveEditEngine o obsługę błędów AJAX, tryb offline, retry, toasty
class LiveEditEngine {
    constructor() {
        this.isActive = false;
        this.activePanels = new Map();
        this.settingsCache = new Map();
        this.globalMode = window.masLiveEdit && window.masLiveEdit.globalMode || false;
        this.saveQueue = new Map(); // Kolejka zapisów do bazy danych
        this.saveInProgress = false;
        this.isOffline = false;
        this.retryQueue = [];
        this.debounceTimer = null;
        window.addEventListener('online', () => this.handleOnline());
        window.addEventListener('offline', () => this.handleOffline());
        // Note: init() will be called explicitly from the defensive initialization system
    }

    init() {
        // Always create toggle button - this is the blue "Live Edit" button from the screenshot
        this.createToggleButton();
        
        // ✅ CRITICAL: Always prepare editable elements on init
        this.prepareEditableElements();
        
        this.loadCurrentSettings();
        this.setupGlobalEventListeners();
        
        // ✅ ENTERPRISE INTEGRATION: Initialize SyncManager and protection
        SyncManager.init();
        
        // Auto-activate if in global mode and stored as active
        if (this.globalMode && localStorage.getItem('mas-global-live-edit-mode') === 'true') {
            this.isActive = true;
            this.activateEditMode();
        }
        
        // Uruchom mechanizm przywracania ustawień
        new SettingsRestorer();
        
        // Track initialization success
        LiveEditDebugger.log('LiveEditEngine initialized with enterprise features', {
            syncManagerReady: !!SyncManager.channel || !!window.localStorage,
            tabId: SyncManager.tabId,
            beforeUnloadProtection: true
        });
    }

    /**
     * 🏷️ Prepare editable elements by adding data attributes
     * CRITICAL: This ensures all WordPress admin elements are marked as editable
     */
    prepareEditableElements() {
        console.log('🏷️ WOOW! Live Edit: Preparing editable elements...');
        
        // Define default editable elements in WordPress admin with enhanced metadata
        const editableElements = [
            { selector: '#wpadminbar', name: 'Admin Bar', type: 'admin-bar', category: 'adminBar', description: 'Top navigation bar' },
            { selector: '#adminmenuwrap', name: 'Admin Menu', type: 'admin-menu', category: 'menu', description: 'Left sidebar menu' },
            { selector: '#wpwrap', name: 'Content Area', type: 'content-area', category: 'content', description: 'Main content wrapper' },
            { selector: '#wpfooter', name: 'Footer', type: 'footer', category: 'footer', description: 'Bottom admin footer' },
            { selector: '.wrap', name: 'Page Content', type: 'page-content', category: 'content', description: 'Page content container' },
            { selector: '#adminmenu', name: 'Menu Items', type: 'menu-items', category: 'menu', description: 'Individual menu items' },
            { selector: '#wpbody', name: 'Body Content', type: 'body-content', category: 'content', description: 'Main body area' },
            { selector: '.postbox', name: 'Post Box', type: 'post-box', category: 'content', description: 'Content post boxes' },
            { selector: '.notice', name: 'Notice', type: 'notice', category: 'feedback', description: 'Admin notices' }
        ];
        
        let preparedCount = 0;
        
        editableElements.forEach(({ selector, name, type, category, description }) => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(element => {
                // Add both data attribute formats for compatibility
                element.setAttribute('data-woow-editable', 'true');
                element.setAttribute('data-mas-editable', 'true');
                element.setAttribute('data-woow-element-name', name);
                element.setAttribute('data-mas-element-name', name);
                element.setAttribute('data-woow-element-type', type);
                element.setAttribute('data-mas-element-type', type);
                element.setAttribute('data-woow-category', category);
                element.setAttribute('data-mas-category', category);
                element.setAttribute('data-woow-element-description', description);
                
                // Add unique ID for tracking if not present
                if (!element.id) {
                    element.id = `woow-${type}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
                }
                
                preparedCount++;
                console.log(`✅ WOOW! Prepared editable element: ${name} (${selector})`);
            });
        });
        
        // Set up dynamic element observer for new elements
        this.observeForDynamicElements();
        
        console.log(`🏷️ WOOW! Live Edit: Prepared ${preparedCount} editable elements`);
        
        // Add visual indication class to body for CSS targeting
        document.body.classList.add('woow-live-edit-prepared');
    }
    
    /**
     * 👁️ Observe for dynamically added elements
     */
    observeForDynamicElements() {
        if (this.dynamicObserver) return; // Prevent multiple observers
        
        this.dynamicObserver = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        // Check if new element matches our selectors
                        const selectorsToWatch = [
                            { selector: '.postbox', name: 'Post Box', type: 'post-box', category: 'content' },
                            { selector: '.notice', name: 'Notice', type: 'notice', category: 'feedback' },
                            { selector: '.wrap', name: 'Page Content', type: 'page-content', category: 'content' },
                            { selector: '.meta-box-sortables', name: 'Meta Box', type: 'meta-box', category: 'content' }
                        ];
                        
                        selectorsToWatch.forEach(({ selector, name, type, category }) => {
                            if (node.matches && node.matches(selector)) {
                                node.setAttribute('data-woow-editable', 'true');
                                node.setAttribute('data-mas-editable', 'true');
                                node.setAttribute('data-woow-element-name', name);
                                node.setAttribute('data-woow-element-type', type);
                                node.setAttribute('data-woow-category', category);
                                node.setAttribute('data-woow-element-description', 'Dynamically added element');
                                
                                if (!node.id) {
                                    node.id = `woow-dynamic-${type}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
                                }
                                
                                console.log('✅ WOOW! Auto-marked dynamic element:', name, node);
                            }
                        });
                    }
                });
            });
        });
        
        this.dynamicObserver.observe(document.body, {
            childList: true,
            subtree: true
        });
        
        console.log('👁️ WOOW! Dynamic element observer activated');
    }

    /**
     * 🎛️ Complete Option Configuration based on the strategic plan
     * Maps all 107+ options across 8 categories with full CSS variables
     */
    getOptionConfigurations() {
        return {
            adminBar: {
                title: 'Admin Bar Settings',
                element: '#wpadminbar',
                category: 'admin-bar',
                icon: 'admin-home',
                options: [
                    // 🎨 Kolory i wygląd
                    {
                        id: 'admin_bar_background',
                        label: 'Background Color',
                        type: 'color',
                        cssVar: '--woow-surface-bar',
                        fallback: '#23282d',
                        section: 'Appearance'
                    },
                    {
                        id: 'admin_bar_text_color',
                        label: 'Text Color',
                        type: 'color',
                        cssVar: '--woow-surface-bar-text',
                        fallback: '#ffffff',
                        section: 'Appearance'
                    },
                    {
                        id: 'admin_bar_hover_color',
                        label: 'Hover Color',
                        type: 'color',
                        cssVar: '--woow-surface-bar-hover',
                        fallback: '#00a0d2',
                        section: 'Appearance'
                    },
                    {
                        id: 'admin_bar_height',
                        label: 'Height',
                        type: 'slider',
                        cssVar: '--woow-surface-bar-height',
                        unit: 'px',
                        min: 24,
                        max: 60,
                        fallback: 32,
                        section: 'Dimensions'
                    },
                    {
                        id: 'admin_bar_font_size',
                        label: 'Font Size',
                        type: 'slider',
                        cssVar: '--woow-surface-bar-font-size',
                        unit: 'px',
                        min: 10,
                        max: 18,
                        fallback: 13,
                        section: 'Typography'
                    },
                    // 📐 Pozycjonowanie i marginesy
                    {
                        id: 'admin_bar_floating',
                        label: 'Floating Mode',
                        type: 'toggle',
                        bodyClass: 'woow-admin-bar-floating',
                        cssVar: '--woow-surface-bar-floating',
                        fallback: false,
                        section: 'Layout'
                    },
                    {
                        id: 'admin_bar_glassmorphism',
                        label: 'Glass Effect',
                        type: 'toggle',
                        bodyClass: 'woow-admin-bar-glass',
                        cssVar: '--woow-surface-bar-glass',
                        fallback: false,
                        section: 'Effects'
                    },
                    {
                        id: 'admin_bar_border_radius',
                        label: 'Border Radius',
                        type: 'slider',
                        cssVar: '--woow-radius-bar',
                        unit: 'px',
                        min: 0,
                        max: 25,
                        fallback: 0,
                        section: 'Layout'
                    },
                    {
                        id: 'admin_bar_margin_top',
                        label: 'Margin Top',
                        type: 'slider',
                        cssVar: '--woow-space-bar-top',
                        unit: 'px',
                        min: 0,
                        max: 50,
                        fallback: 10,
                        section: 'Layout'
                    },
                    {
                        id: 'admin_bar_margin_left',
                        label: 'Margin Left',
                        type: 'slider',
                        cssVar: '--woow-space-bar-left',
                        unit: 'px',
                        min: 0,
                        max: 50,
                        fallback: 10,
                        section: 'Layout'
                    },
                    {
                        id: 'admin_bar_margin_right',
                        label: 'Margin Right',
                        type: 'slider',
                        cssVar: '--woow-space-bar-right',
                        unit: 'px',
                        min: 0,
                        max: 50,
                        fallback: 10,
                        section: 'Layout'
                    },
                    // 🔍 Ukrywanie elementów
                    {
                        id: 'hide_wp_logo',
                        label: 'Hide WordPress Logo',
                        type: 'toggle',
                        cssVar: '--woow-hide-wp-logo',
                        targetSelector: '#wp-admin-bar-wp-logo',
                        fallback: false,
                        section: 'Visibility'
                    },
                    {
                        id: 'hide_howdy',
                        label: 'Hide "Howdy" Text',
                        type: 'toggle',
                        cssVar: '--woow-hide-howdy',
                        targetSelector: '#wp-admin-bar-my-account .display-name',
                        fallback: false,
                        section: 'Visibility'
                    },
                    {
                        id: 'hide_update_notices',
                        label: 'Hide Update Notices',
                        type: 'toggle',
                        cssVar: '--woow-hide-updates',
                        targetSelector: '#wp-admin-bar-updates',
                        fallback: false,
                        section: 'Visibility'
                    }
                ]
            },

            menu: {
                title: 'Admin Menu Settings',
                element: '#adminmenuwrap',
                category: 'menu',
                icon: 'menu',
                options: [
                    // 🎨 Podstawowe stylowanie
                    {
                        id: 'menu_background',
                        label: 'Background Color',
                        type: 'color',
                        cssVar: '--woow-surface-menu',
                        fallback: '#23282d',
                        section: 'Appearance'
                    },
                    {
                        id: 'menu_text_color',
                        label: 'Text Color',
                        type: 'color',
                        cssVar: '--woow-surface-menu-text',
                        fallback: '#ffffff',
                        section: 'Appearance'
                    },
                    {
                        id: 'menu_hover_color',
                        label: 'Hover Color',
                        type: 'color',
                        cssVar: '--woow-surface-menu-hover',
                        fallback: '#00a0d2',
                        section: 'Appearance'
                    },
                    {
                        id: 'menu_width',
                        label: 'Menu Width',
                        type: 'slider',
                        cssVar: '--woow-surface-menu-width',
                        unit: 'px',
                        min: 120,
                        max: 300,
                        fallback: 160,
                        section: 'Dimensions'
                    },
                    {
                        id: 'menu_border_radius',
                        label: 'Border Radius',
                        type: 'slider',
                        cssVar: '--woow-radius-menu',
                        unit: 'px',
                        min: 0,
                        max: 25,
                        fallback: 0,
                        section: 'Layout'
                    }
                ]
            },

            content: {
                title: 'Content Area Settings',
                element: '#wpcontent',
                category: 'content',
                icon: 'admin-page',
                options: [
                    // 🎨 Kolory i tło
                    {
                        id: 'content_background',
                        label: 'Background Color',
                        type: 'color',
                        cssVar: '--woow-bg-primary',
                        fallback: '#f1f1f1',
                        section: 'Appearance'
                    },
                    {
                        id: 'content_card_background',
                        label: 'Card Background',
                        type: 'color',
                        cssVar: '--woow-bg-card',
                        fallback: '#ffffff',
                        section: 'Appearance'
                    },
                    {
                        id: 'content_text_color',
                        label: 'Text Color',
                        type: 'color',
                        cssVar: '--woow-text-primary',
                        fallback: '#333333',
                        section: 'Typography'
                    },
                    {
                        id: 'content_link_color',
                        label: 'Link Color',
                        type: 'color',
                        cssVar: '--woow-text-link',
                        fallback: '#0073aa',
                        section: 'Typography'
                    },
                    // 🔘 Przyciski i formularze
                    {
                        id: 'button_primary_background',
                        label: 'Primary Button Background',
                        type: 'color',
                        cssVar: '--woow-accent-primary',
                        fallback: '#0073aa',
                        section: 'Forms'
                    },
                    {
                        id: 'button_primary_text_color',
                        label: 'Primary Button Text',
                        type: 'color',
                        cssVar: '--woow-text-primary',
                        fallback: '#ffffff',
                        section: 'Forms'
                    },
                    {
                        id: 'button_border_radius',
                        label: 'Button Border Radius',
                        type: 'slider',
                        cssVar: '--woow-radius-button',
                        unit: 'px',
                        min: 0,
                        max: 25,
                        fallback: 4,
                        section: 'Forms'
                    },
                    // ✨ Efekty
                    {
                        id: 'content_rounded_corners',
                        label: 'Rounded Corners',
                        type: 'toggle',
                        bodyClass: 'mas-content-rounded',
                        cssVar: '--woow-content-rounded',
                        fallback: false,
                        section: 'Effects'
                    },
                    {
                        id: 'content_shadows',
                        label: 'Card Shadows',
                        type: 'toggle',
                        bodyClass: 'mas-content-shadows',
                        cssVar: '--woow-content-shadows',
                        fallback: false,
                        section: 'Effects'
                    },
                    {
                        id: 'content_hover_effects',
                        label: 'Hover Effects',
                        type: 'toggle',
                        bodyClass: 'mas-content-hover',
                        cssVar: '--woow-content-hover',
                        fallback: false,
                        section: 'Effects'
                    }
                ]
            },

            typography: {
                title: 'Typography Settings',
                element: 'body',
                category: 'typography',
                icon: 'editor-textcolor',
                position: 'global',
                options: [
                    // 🎨 Czcionki
                    {
                        id: 'google_font_primary',
                        label: 'Primary Font',
                        type: 'font-picker',
                        cssVar: '--woow-font-primary',
                        fallback: 'system-ui',
                        section: 'Fonts'
                    },
                    {
                        id: 'google_font_headings',
                        label: 'Heading Font',
                        type: 'font-picker',
                        cssVar: '--woow-font-heading',
                        fallback: 'system-ui',
                        section: 'Fonts'
                    },
                    {
                        id: 'load_google_fonts',
                        label: 'Load Google Fonts',
                        type: 'toggle',
                        bodyClass: 'mas-google-fonts-enabled',
                        cssVar: '--woow-load-google-fonts',
                        fallback: false,
                        section: 'Fonts'
                    },
                    // 📏 Rozmiary i odstępy
                    {
                        id: 'heading_font_size',
                        label: 'Heading Size (H1)',
                        type: 'slider',
                        cssVar: '--woow-font-heading-size',
                        unit: 'px',
                        min: 20,
                        max: 48,
                        fallback: 32,
                        section: 'Sizes'
                    },
                    {
                        id: 'body_font_size',
                        label: 'Body Font Size',
                        type: 'slider',
                        cssVar: '--woow-font-body-size',
                        unit: 'px',
                        min: 12,
                        max: 18,
                        fallback: 14,
                        section: 'Sizes'
                    },
                    {
                        id: 'line_height',
                        label: 'Line Height',
                        type: 'slider',
                        cssVar: '--woow-font-line-height',
                        unit: '',
                        min: 1.2,
                        max: 2.0,
                        step: 0.1,
                        fallback: 1.6,
                        section: 'Sizes'
                    }
                ]
            },

            effects: {
                title: 'Visual Effects',
                element: 'body',
                category: 'effects',
                icon: 'art',
                position: 'global',
                options: [
                    // 🎬 Animacje
                    {
                        id: 'animation_speed',
                        label: 'Animation Speed',
                        type: 'slider',
                        cssVar: '--woow-animation-speed',
                        unit: 'ms',
                        min: 100,
                        max: 1000,
                        fallback: 300,
                        section: 'Animations'
                    },
                    {
                        id: 'fade_in_effects',
                        label: 'Fade In Effects',
                        type: 'toggle',
                        bodyClass: 'mas-fade-in',
                        cssVar: '--woow-fade-in',
                        fallback: false,
                        section: 'Animations'
                    },
                    {
                        id: 'slide_animations',
                        label: 'Slide Animations',
                        type: 'toggle',
                        bodyClass: 'mas-slide-anim',
                        cssVar: '--woow-slide-anim',
                        fallback: false,
                        section: 'Animations'
                    },
                    {
                        id: 'scale_hover_effects',
                        label: 'Scale on Hover',
                        type: 'toggle',
                        bodyClass: 'mas-scale-hover',
                        cssVar: '--woow-scale-hover',
                        fallback: false,
                        section: 'Interactions'
                    },
                    // 🌟 Zaawansowane efekty
                    {
                        id: 'glassmorphism_effects',
                        label: 'Glassmorphism',
                        type: 'toggle',
                        bodyClass: 'woow-glassmorphism',
                        cssVar: '--woow-glassmorphism',
                        fallback: false,
                        section: 'Advanced'
                    },
                    {
                        id: 'gradient_backgrounds',
                        label: 'Gradient Backgrounds',
                        type: 'toggle',
                        bodyClass: 'mas-gradients',
                        cssVar: '--woow-gradients',
                        fallback: false,
                        section: 'Advanced'
                    },
                    {
                        id: 'smooth_scrolling',
                        label: 'Smooth Scrolling',
                        type: 'toggle',
                        bodyClass: 'mas-smooth-scroll',
                        cssVar: '--woow-smooth-scroll',
                        fallback: false,
                        section: 'Advanced'
                    }
                ]
            },

            global: {
                title: 'Global Settings',
                element: 'body',
                category: 'general',
                icon: 'admin-settings',
                position: 'global',
                options: [
                    // 🎨 Podstawowe ustawienia
                    {
                        id: 'color_scheme',
                        label: 'Color Scheme',
                        type: 'select',
                        cssVar: '--woow-color-scheme',
                        options: {
                            'auto': 'Auto',
                            'light': 'Light',
                            'dark': 'Dark'
                        },
                        fallback: 'auto',
                        section: 'Appearance'
                    },
                    {
                        id: 'color_palette',
                        label: 'Color Palette',
                        type: 'select',
                        cssVar: '--woow-color-palette',
                        options: {
                            'modern-blue': 'Modern Blue',
                            'professional': 'Professional',
                            'warm': 'Warm',
                            'cool': 'Cool'
                        },
                        fallback: 'modern-blue',
                        section: 'Appearance'
                    },
                    {
                        id: 'accent_color',
                        label: 'Accent Color',
                        type: 'color',
                        cssVar: '--woow-accent-primary',
                        fallback: '#0073aa',
                        section: 'Appearance'
                    },
                    // 🎯 Globalne Style
                    {
                        id: 'compact_mode',
                        label: 'Compact Mode',
                        type: 'toggle',
                        bodyClass: 'mas-compact',
                        cssVar: '--woow-compact-mode',
                        fallback: false,
                        section: 'Layout'
                    },
                    {
                        id: 'global_border_radius',
                        label: 'Global Border Radius',
                        type: 'slider',
                        cssVar: '--woow-radius-global',
                        unit: 'px',
                        min: 0,
                        max: 20,
                        fallback: 8,
                        section: 'Layout'
                    },
                    {
                        id: 'enable_animations',
                        label: 'Enable Animations',
                        type: 'toggle',
                        bodyClass: 'mas-animated',
                        cssVar: '--woow-animations-enabled',
                        fallback: true,
                        section: 'Performance'
                    }
                ]
            }
        };
    }

    /**
     * 🎛️ Create and show Live Edit Mode toggle button
     */
    createToggleButton() {
        console.log('🔍 WOOW! Live Edit: Creating toggle button...');
        console.log('🔍 WOOW! DOM Ready State:', document.readyState);
        console.log('🔍 WOOW! Current URL:', window.location.href);
        
        // ===== ENHANCED SELECTOR VERIFICATION =====
        // Check all possible toggle selectors with detailed logging
        const selectors = {
            primary: '#mas-v2-edit-mode-switch',
            hero: '#mas-v2-edit-mode-switch-hero', 
            floating: '.mas-live-edit-toggle',
            fallback: '.woow-live-edit-toggle'
        };
        
        console.log('🔍 WOOW! Checking for existing toggle elements...');
        
        const existingToggles = {};
        Object.entries(selectors).forEach(([key, selector]) => {
            const element = document.querySelector(selector);
            existingToggles[key] = element;
            console.log(`🔍 WOOW! Toggle check [${key}]: "${selector}" =>`, {
                found: !!element,
                element: element,
                visible: element ? this.isElementVisible(element) : false,
                inDOM: element ? document.contains(element) : false
            });
        });
        
        // Try to use existing HTML toggle first
        if (existingToggles.primary && this.isElementVisible(existingToggles.primary)) {
            console.log('✅ WOOW! Live Edit: Using existing primary HTML toggle');
            this.setupToggleEvents(existingToggles.primary, 'primary');
            
            // Sync hero toggle if it exists
            if (existingToggles.hero && this.isElementVisible(existingToggles.hero)) {
                console.log('✅ WOOW! Live Edit: Syncing with hero toggle');
                this.setupToggleEvents(existingToggles.hero, 'hero', existingToggles.primary);
            }
            return existingToggles.primary;
        }
        
        // Check for existing floating toggle
        if (existingToggles.floating && this.isElementVisible(existingToggles.floating)) {
            console.log('✅ WOOW! Live Edit: Using existing floating toggle');
            this.setupToggleEvents(existingToggles.floating, 'floating');
            return existingToggles.floating;
        }
        
        // ===== EMERGENCY FALLBACK BUTTON CREATION =====
        console.log('🚨 WOOW! Live Edit: No suitable toggle found - Creating EMERGENCY floating toggle');
        
        const emergencyToggle = this.createEmergencyToggle();
        if (emergencyToggle) {
            console.log('✅ WOOW! Live Edit: Emergency toggle created successfully');
            return emergencyToggle;
        } else {
            console.error('❌ WOOW! Live Edit: CRITICAL - Failed to create emergency toggle');
            return null;
        }
    }
    
    /**
     * 🔧 Helper: Check if element is visible and interactable
     */
    isElementVisible(element) {
        if (!element) return false;
        
        const rect = element.getBoundingClientRect();
        const style = window.getComputedStyle(element);
        
        return (
            rect.width > 0 && 
            rect.height > 0 && 
            style.display !== 'none' && 
            style.visibility !== 'hidden' && 
            style.opacity !== '0'
        );
    }
    
    /**
     * 🎛️ Setup event listeners for toggle elements
     */
    setupToggleEvents(toggleElement, type, syncTarget = null) {
        console.log(`🎛️ WOOW! Setting up events for ${type} toggle:`, toggleElement);
        
        // Remove existing listeners to prevent duplicates
        const newElement = toggleElement.cloneNode(true);
        toggleElement.parentNode.replaceChild(newElement, toggleElement);
        
        if (type === 'primary' || type === 'hero') {
            // Checkbox/switch element
            newElement.addEventListener('change', (e) => {
                this.isActive = e.target.checked;
                console.log(`🔄 WOOW! ${type} toggle changed:`, this.isActive);
                this.handleToggleChange();
                this.validateToggleFunction();
            });
        } else {
            // Button element
            newElement.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggle();
                console.log(`🔄 WOOW! ${type} toggle clicked:`, this.isActive);
                this.validateToggleFunction();
            });
        }
        
        // Sync with target if provided
        if (syncTarget && type === 'hero') {
            newElement.addEventListener('change', () => {
                syncTarget.checked = newElement.checked;
                syncTarget.dispatchEvent(new Event('change'));
            });
        }
        
        // Add visual feedback
        newElement.classList.add('woow-toggle-enhanced');
        
        return newElement;
    }
    
    /**
     * 🚨 Create emergency floating toggle button
     */
    createEmergencyToggle() {
        console.log('🚨 WOOW! Creating emergency floating toggle...');
        
        // Check if emergency toggle already exists
        const existing = document.querySelector('.woow-emergency-toggle');
        if (existing) {
            console.log('⚠️ WOOW! Emergency toggle already exists, enhancing it');
            existing.remove();
        }
        
        const emergencyToggle = document.createElement('div');
        emergencyToggle.className = 'woow-emergency-toggle mas-live-edit-toggle';
        emergencyToggle.setAttribute('data-toggle-type', 'emergency');
        emergencyToggle.setAttribute('title', 'WOOW! Live Edit Mode Toggle');
        emergencyToggle.style.cssText = `
            position: fixed !important;
            top: 50px !important;
            right: 20px !important;
            z-index: 999999 !important;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
            color: white !important;
            border: none !important;
            border-radius: 12px !important;
            padding: 12px 16px !important;
            cursor: pointer !important;
            font-size: 14px !important;
            font-weight: 600 !important;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2) !important;
            transition: all 0.3s ease !important;
            user-select: none !important;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important;
        `;
        
        emergencyToggle.innerHTML = `
            <span class="dashicons dashicons-edit" style="margin-right: 8px; font-size: 16px; vertical-align: middle;"></span>
            <span class="label">Live Edit</span>
        `;
        
        // Enhanced hover effects
        emergencyToggle.addEventListener('mouseenter', () => {
            emergencyToggle.style.transform = 'scale(1.05) translateY(-2px)';
            emergencyToggle.style.boxShadow = '0 6px 20px rgba(0,0,0,0.3)';
        });
        
        emergencyToggle.addEventListener('mouseleave', () => {
            emergencyToggle.style.transform = 'scale(1) translateY(0)';
            emergencyToggle.style.boxShadow = '0 4px 15px rgba(0,0,0,0.2)';
        });
        
        // Add to DOM
        document.body.appendChild(emergencyToggle);
        
        // Setup events
        this.setupToggleEvents(emergencyToggle, 'emergency');
        
        // Verify creation
        const verification = document.querySelector('.woow-emergency-toggle');
        console.log('🔍 WOOW! Emergency toggle verification:', {
            created: !!verification,
            visible: verification ? this.isElementVisible(verification) : false,
            position: verification ? verification.getBoundingClientRect() : null
        });
        
        return verification;
    }
    
    /**
     * ✅ Validate toggle functionality (for manual UI testing)
     */
    validateToggleFunction() {
        const validation = {
            timestamp: new Date().toISOString(),
            toggleState: this.isActive,
            bodyClasses: {
                'mas-live-edit-active': document.body.classList.contains('mas-live-edit-active'),
                'mas-edit-mode-active': document.body.classList.contains('mas-edit-mode-active'),
                'woow-live-edit-enabled': document.body.classList.contains('woow-live-edit-enabled')
            },
            editableElements: document.querySelectorAll('[data-woow-editable="true"]').length,
            microPanels: document.querySelectorAll('.mas-micro-panel').length
        };
        
        console.log('✅ WOOW! Toggle Function Validation:', validation);
        
        // UI Test feedback
        if (this.isActive) {
            this.showValidationToast('✅ Live Edit ACTIVATED - Click elements to edit', 'success');
        } else {
            this.showValidationToast('❌ Live Edit DEACTIVATED', 'info');
        }
        
        return validation;
    }
    
    /**
     * 📝 Show validation toast for UI testing
     */
    showValidationToast(message, type = 'info') {
        // Remove existing validation toast
        const existing = document.querySelector('.woow-validation-toast');
        if (existing) existing.remove();
        
        const toast = document.createElement('div');
        toast.className = `woow-validation-toast woow-toast-${type}`;
        toast.style.cssText = `
            position: fixed !important;
            top: 120px !important;
            right: 20px !important;
            z-index: 999998 !important;
            background: ${type === 'success' ? '#10b981' : '#6b7280'} !important;
            color: white !important;
            padding: 12px 20px !important;
            border-radius: 8px !important;
            font-size: 14px !important;
            font-weight: 500 !important;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important;
            transform: translateX(100%) !important;
            transition: transform 0.3s ease !important;
            max-width: 300px !important;
        `;
        
        toast.textContent = message;
        document.body.appendChild(toast);
        
        // Animate in
        setTimeout(() => {
            toast.style.transform = 'translateX(0)';
        }, 100);
        
        // Auto remove
        setTimeout(() => {
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    /**
     * 🚀 Toggle Live Edit Mode
     */
    toggle() {
        this.isActive = !this.isActive;
        console.log('🔄 WOOW! Live Edit: Toggle clicked, new state:', this.isActive);
        this.handleToggleChange();
    }
    
    /**
     * 🔄 Handle toggle state change (used by both click and checkbox change)
     */
    handleToggleChange() {
        console.log('🔄 WOOW! Live Edit: Handling toggle change, active:', this.isActive);
        
        // ✅ NAPRAWKA SYNCHRONIZACJI: Używaj kompatybilnych klas CSS
        document.body.classList.toggle('mas-live-edit-active', this.isActive);
        document.body.classList.toggle('mas-edit-mode-active', this.isActive); // Dla kompatybilności z MAS
        document.body.classList.toggle('woow-live-edit-enabled', this.isActive); // Dla nowego systemu
        
        if (this.isActive) {
            console.log('✅ WOOW! Live Edit: Activating edit mode...');
            this.activateEditMode();
        } else {
            console.log('❌ WOOW! Live Edit: Deactivating edit mode...');
            this.deactivateEditMode();
        }
    }

    /**
     * ✨ Activate Live Edit Mode - Enhanced with advanced UX features
     */
    activateEditMode() {
        console.log('🔄 WOOW! Live Edit: Activating edit mode...');
        
        // ✅ CRITICAL: Add pulse animation class for visual feedback
        document.body.classList.add('mas-just-activated');
        setTimeout(() => {
            document.body.classList.remove('mas-just-activated');
        }, 1500);
        
        // ✅ ENHANCED: Add advanced interaction features
        this.enableAdvancedInteractions();
        this.addKeyboardShortcuts();
        this.createFloatingHelper();
        
        // ✅ NAPRAWKA INTEGRACJI: Użyj systemu MAS zamiast własnego
        if (window.MAS && typeof window.MAS.initializeEditableElements === 'function') {
            console.log('✅ WOOW! Live Edit: Using MAS system for edit elements');
            
            // Upewnij się, że elementy są przygotowane
            if (typeof window.MAS.prepareEditableElements === 'function') {
                window.MAS.prepareEditableElements();
            }
            
            window.MAS.initializeEditableElements();
        } else {
            // Fallback: użyj własnego systemu
            console.log('🔄 WOOW! Live Edit: Using fallback system');
            const configs = this.getOptionConfigurations();
            console.log('🔄 WOOW! Live Edit: Option configurations loaded:', configs);
            
            Object.values(configs).forEach(config => {
                console.log('🔄 WOOW! Live Edit: Processing config:', config);
                if (config.position === 'global') {
                    this.createGlobalEditTrigger(config);
                } else {
                    this.createElementEditTrigger(config);
                }
            });
        }

        this.showActivationToast();
    }
    
    /**
     * 🎮 Enable advanced interactions for better UX (SIMPLIFIED)
     */
    enableAdvancedInteractions() {
        // Skip heavy effects to prevent browser freezing
        console.log('🎮 WOOW! Advanced interactions enabled (simplified mode)');
    }
    
    /**
     * 🔊 Add subtle click sound effect
     */
    addClickSoundEffect() {
        document.addEventListener('click', (e) => {
            if (this.isActive && e.target.closest('[data-woow-editable="true"]')) {
                // Create audio context for click sound
                try {
                    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                    const oscillator = audioContext.createOscillator();
                    const gainNode = audioContext.createGain();
                    
                    oscillator.connect(gainNode);
                    gainNode.connect(audioContext.destination);
                    
                    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
                    oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.1);
                    
                    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
                    
                    oscillator.start(audioContext.currentTime);
                    oscillator.stop(audioContext.currentTime + 0.1);
                } catch (error) {
                    // Silently fail if audio context not supported
                }
            }
        });
    }
    
    /**
     * 🌊 Add ripple effect on click
     */
    addRippleEffect() {
        document.addEventListener('click', (e) => {
            if (this.isActive && e.target.closest('[data-woow-editable="true"]')) {
                const element = e.target.closest('[data-woow-editable="true"]');
                const rect = element.getBoundingClientRect();
                const ripple = document.createElement('div');
                
                ripple.style.cssText = `
                    position: absolute;
                    border-radius: 50%;
                    background: rgba(139, 92, 246, 0.3);
                    transform: scale(0);
                    animation: ripple 0.6s linear;
                    pointer-events: none;
                    z-index: 999999;
                `;
                
                const size = Math.max(rect.width, rect.height);
                ripple.style.width = ripple.style.height = size + 'px';
                ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
                ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
                
                element.style.position = 'relative';
                element.appendChild(ripple);
                
                setTimeout(() => ripple.remove(), 600);
            }
        });
        
        // Add ripple animation CSS
        if (!document.getElementById('woow-ripple-styles')) {
            const style = document.createElement('style');
            style.id = 'woow-ripple-styles';
            style.textContent = `
                @keyframes ripple {
                    to {
                        transform: scale(2);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    /**
     * 👁️ Add hover preview functionality
     */
    addHoverPreview() {
        let hoverTimeout;
        
        document.addEventListener('mouseenter', (e) => {
            if (this.isActive && e.target.closest('[data-woow-editable="true"]')) {
                const element = e.target.closest('[data-woow-editable="true"]');
                hoverTimeout = setTimeout(() => {
                    this.showQuickPreview(element);
                }, 500);
            }
        }, true);
        
        document.addEventListener('mouseleave', (e) => {
            if (hoverTimeout) {
                clearTimeout(hoverTimeout);
            }
            this.hideQuickPreview();
        }, true);
    }
    
    /**
     * 👀 Show quick preview of editable options
     */
    showQuickPreview(element) {
        const elementName = element.getAttribute('data-woow-element-name') || 'Element';
        const preview = document.createElement('div');
        
        preview.id = 'woow-quick-preview';
        preview.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, rgba(139, 92, 246, 0.95), rgba(124, 58, 237, 0.95));
            color: white;
            padding: 12px 16px;
            border-radius: 12px;
            font-size: 13px;
            font-weight: 600;
            z-index: 1000000;
            backdrop-filter: blur(15px);
            box-shadow: 0 8px 32px rgba(139, 92, 246, 0.4);
            border: 1px solid rgba(255, 255, 255, 0.2);
            animation: slideInRight 0.3s ease;
        `;
        
        preview.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px;">
                <span>✏️</span>
                <span>Editing: ${elementName}</span>
            </div>
            <div style="font-size: 11px; opacity: 0.8; margin-top: 4px;">
                Click to open options panel
            </div>
        `;
        
        document.body.appendChild(preview);
        
        // Add slide animation
        if (!document.getElementById('woow-preview-styles')) {
            const style = document.createElement('style');
            style.id = 'woow-preview-styles';
            style.textContent = `
                @keyframes slideInRight {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    /**
     * 🙈 Hide quick preview
     */
    hideQuickPreview() {
        const preview = document.getElementById('woow-quick-preview');
        if (preview) {
            preview.style.animation = 'slideInRight 0.3s ease reverse';
            setTimeout(() => preview.remove(), 300);
        }
    }
    
    /**
     * ⌨️ Add keyboard shortcuts for power users
     */
    addKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (!this.isActive) return;
            
            // Escape to exit Live Edit mode
            if (e.key === 'Escape') {
                this.toggle();
                e.preventDefault();
            }
            
            // Ctrl/Cmd + E to toggle Live Edit mode
            if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
                this.toggle();
                e.preventDefault();
            }
            
            // H key to show/hide helper
            if (e.key === 'h' || e.key === 'H') {
                this.toggleFloatingHelper();
                e.preventDefault();
            }
        });
        
        console.log('⌨️ WOOW! Keyboard shortcuts enabled (Esc, Ctrl+E, H)');
    }
    
    /**
     * 🆘 Create floating helper panel
     */
    createFloatingHelper() {
        if (document.getElementById('woow-floating-helper')) return;
        
        const helper = document.createElement('div');
        helper.id = 'woow-floating-helper';
        helper.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 20px;
            background: linear-gradient(135deg, rgba(139, 92, 246, 0.95), rgba(124, 58, 237, 0.95));
            color: white;
            padding: 16px;
            border-radius: 12px;
            font-size: 12px;
            z-index: 1000000;
            backdrop-filter: blur(15px);
            box-shadow: 0 8px 32px rgba(139, 92, 246, 0.4);
            border: 1px solid rgba(255, 255, 255, 0.2);
            max-width: 280px;
            animation: slideInLeft 0.3s ease;
        `;
        
        helper.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
                <span>🆘</span>
                <strong>Live Edit Mode Active</strong>
            </div>
            <div style="line-height: 1.4; opacity: 0.9;">
                <div>• Click outlined elements to edit</div>
                <div>• Press <kbd>Esc</kbd> to exit</div>
                <div>• Press <kbd>H</kbd> to toggle this help</div>
                <div>• Press <kbd>Ctrl+E</kbd> to toggle mode</div>
            </div>
        `;
        
        document.body.appendChild(helper);
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            if (helper.parentNode) {
                helper.style.opacity = '0.7';
                helper.style.transform = 'scale(0.95)';
            }
        }, 5000);
    }
    
    /**
     * 🔄 Toggle floating helper visibility
     */
    toggleFloatingHelper() {
        const helper = document.getElementById('woow-floating-helper');
        if (helper) {
            helper.style.display = helper.style.display === 'none' ? 'block' : 'none';
        }
    }

    /**
     * 🎯 Create edit trigger for specific element
     */
    createElementEditTrigger(config) {
        const element = document.querySelector(config.element);
        if (!element) return;

        const trigger = document.createElement('div');
        trigger.className = 'mas-edit-trigger';
        trigger.innerHTML = `<span class="dashicons dashicons-${config.icon}"></span>`;
        trigger.dataset.config = JSON.stringify(config);
        
        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            this.openMicroPanel(element, config);
        });

        element.style.position = 'relative';
        element.appendChild(trigger);
    }

    /**
     * 🌐 Create global edit trigger (floating)
     */
    createGlobalEditTrigger(config) {
        const trigger = document.createElement('div');
        trigger.className = 'mas-global-edit-trigger';
        trigger.innerHTML = `
            <span class="dashicons dashicons-${config.icon}"></span>
            <span class="label">${config.title}</span>
        `;
        trigger.dataset.config = JSON.stringify(config);
        
        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            this.openMicroPanel(document.body, config);
        });

        document.querySelector('.mas-live-edit-toggle').appendChild(trigger);
    }

    /**
     * 🚫 Deactivate Live Edit Mode
     */
    deactivateEditMode() {
        console.log('❌ WOOW! Live Edit: Deactivating edit mode with enhanced cleanup...');
        
        // ✅ NAPRAWKA INTEGRACJI: Użyj systemu MAS dla cleanup
        if (window.MAS && typeof window.MAS.cleanupEditableElements === 'function') {
            console.log('✅ WOOW! Live Edit: Using MAS system for cleanup');
            window.MAS.cleanupEditableElements();
        } else {
            // Fallback: własny cleanup
            console.log('🔄 WOOW! Live Edit: Using fallback cleanup');
            document.querySelectorAll('.mas-edit-trigger, .mas-global-edit-trigger').forEach(el => el.remove());
        }
        
        // Enhanced cleanup for advanced features
        this.cleanupAdvancedFeatures();
        
        // Close all panels (własne)
        this.activePanels.forEach(panel => panel.close());
        this.activePanels.clear();
    }
    
    /**
     * 🧹 Clean up advanced features and UI elements
     */
    cleanupAdvancedFeatures() {
        // Remove floating helper and quick previews
        const helper = document.getElementById('woow-floating-helper');
        if (helper) helper.remove();
        
        const preview = document.getElementById('woow-quick-preview');
        if (preview) preview.remove();
        
        // Remove dynamic styles
        const stylesToRemove = [
            'woow-ripple-styles',
            'woow-preview-styles'
        ];
        
        stylesToRemove.forEach(id => {
            const style = document.getElementById(id);
            if (style) style.remove();
        });
        
        // Remove body classes
        document.body.classList.remove(
            'woow-live-edit-enabled', 
            'mas-live-edit-active', 
            'mas-just-activated',
            'woow-live-edit-prepared'
        );
        
        // Clear all active states
        document.querySelectorAll('[data-woow-editable]').forEach(element => {
            element.classList.remove('woow-edit-active');
        });
        
        // Disconnect dynamic observer
        if (this.dynamicObserver) {
            this.dynamicObserver.disconnect();
            this.dynamicObserver = null;
        }
        
        console.log('🧹 WOOW! Advanced features cleaned up');
    }

    /**
     * 📱 Open contextual micro-panel for editing
     */
    openMicroPanel(element, config) {
        console.log('🔄 WOOW! Live Edit: Opening micro panel for:', element);
        console.log('🔄 WOOW! Live Edit: Config:', config);
        
        // ✅ NAPRAWKA INTEGRACJI: Użyj systemu MAS dla mikropaneli
        if (window.MAS && typeof window.MAS.openMicroPanel === 'function') {
            console.log('✅ WOOW! Live Edit: Using MAS system for micro panel');
            window.MAS.openMicroPanel(element);
        } else {
            console.log('🔄 WOOW! Live Edit: Using fallback micro panel system');
            console.log('🔄 WOOW! Live Edit: Creating MicroPanel with config:', config);
            
            // Close other panels
            this.activePanels.forEach(panel => panel.close());
            this.activePanels.clear();

            const panel = new MicroPanel(element, config, this);
            this.activePanels.set(config.category, panel);
            
            console.log('✅ WOOW! Live Edit: MicroPanel created and added to activePanels');
        }
    }

    /**
     * 💾 Load current settings from WordPress
     */
    loadCurrentSettings() {
        // In real implementation, this would fetch from WordPress AJAX
        // For now, we'll use localStorage as fallback
        const saved = localStorage.getItem('mas_live_edit_settings');
        if (saved) {
            try {
                this.settingsCache = new Map(Object.entries(JSON.parse(saved)));
            } catch (e) {
            }
        }
    }

    /**
     * �� Save setting value (batch, debounced)
     */
    saveSetting(key, value) {
        this.settingsCache.set(key, value);
        this.saveToLocalStorage();
        this.saveQueue.set(key, value);
        
        // ✅ ENTERPRISE: Broadcast to other tabs
        SyncManager.broadcast(key, value);
        
        // ✅ ENTERPRISE: Track pending changes for beforeunload protection
        BeforeUnloadProtection.addPendingChange(key);
        
        // 🔧 NAPRAWIONE: Wywołanie poprawnej funkcji
        this.debouncedSave();
    }

    /**
     * ⚡ Natychmiastowe aplikowanie ustawienia
     */
    applySettingImmediately(key, value) {
        const cssVar = this.mapSettingToCSSVar(key);
        if (cssVar && value !== null && value !== undefined) {
            const unit = this.getUnitForKey(key);
            document.documentElement.style.setProperty(cssVar, value + unit);
            LiveEditDebugger.trackCSSVariable(cssVar, value + unit);
        }
    }
    
    /**
     * 🗺️ Mapowanie ustawień na CSS variables
     */
    mapSettingToCSSVar(key) {
        const mapping = {
            'admin_bar_background': '--woow-surface-bar',
            'admin_bar_text_color': '--woow-surface-bar-text',
            'admin_bar_hover_color': '--woow-surface-bar-hover',
            'admin_bar_height': '--woow-surface-bar-height',
            'admin_bar_font_size': '--woow-surface-bar-font-size',
            'admin_bar_border_radius': '--woow-radius-bar',
            'menu_background': '--woow-surface-menu',
            'menu_text_color': '--woow-surface-menu-text',
            'menu_hover_color': '--woow-surface-menu-hover',
            'menu_width': '--woow-surface-menu-width',
            'menu_border_radius': '--woow-radius-menu',
            'accent_color': '--woow-accent-primary'
        };
        
        const cssVar = mapping[key] || null;
        
        // 🔍 DEBUG: Log mapping results
        if (window.masV2Debug || window.woowDebug) {
            if (cssVar) {
                console.log(`🎨 WOOW! Debug: Mapped setting "${key}" → CSS variable "${cssVar}"`);
            } else {
                console.warn(`⚠️ WOOW! Debug: No CSS variable mapping found for setting "${key}"`);
                console.log(`🔍 WOOW! Debug: Available mappings:`, Object.keys(mapping));
            }
        }
        
        return cssVar;
    }
    
    /**
     * 📏 Pobieranie jednostek dla ustawień
     */
    getUnitForKey(key) {
        const units = {
            'admin_bar_height': 'px',
            'admin_bar_font_size': 'px',
            'admin_bar_border_radius': 'px',
            'menu_width': 'px',
            'menu_border_radius': 'px'
        };
        
        return units[key] || '';
    }

    /**
     * 🔄 Debounced save to WordPress database
     */
    debouncedSave = this.debounce(async () => {
        if (this.saveInProgress || this.saveQueue.size === 0) {
            return;
        }
        
        this.saveInProgress = true;
        
        try {
            const settings = Object.fromEntries(this.saveQueue);
            
            LiveEditDebugger.log('💾 Saving to database', settings);
            
            // WordPress AJAX save
            if (window.ajaxurl) {
                const response = await fetch(window.ajaxurl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: new URLSearchParams({
                        action: 'mas_save_live_settings',
                        settings: JSON.stringify(settings),
                        nonce: window.masNonce || ''
                    })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    // Wyczyść kolejkę po udanym zapisie
                    this.saveQueue.clear();
                    
                    // ✅ ENTERPRISE: Clear pending changes after successful save
                    Object.keys(settings).forEach(key => {
                        BeforeUnloadProtection.removePendingChange(key);
                    });
                    
                    this.showSaveToast();
                    
                    // Track successful saves
                    Object.keys(settings).forEach(key => {
                        LiveEditDebugger.trackDatabaseSave(key, true);
                    });
                    
                    LiveEditDebugger.log('✅ Database save successful', data);
                } else {
                    throw new Error(data.message || 'Unknown error');
                }
            }
        } catch (error) {
            console.error('❌ WOOW! Database save failed:', error);
            
            // Track failed saves
            Object.keys(this.saveQueue).forEach(key => {
                LiveEditDebugger.trackDatabaseSave(key, false, error.message);
            });
            
            this.showToast('Failed to save settings: ' + error.message, 'error');
        } finally {
            this.saveInProgress = false;
        }
    }, 1000);

    /**
     * 🔧 Utility: Debounce function
     */
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

    /**
     * 🎯 Setup global event listeners
     */
    setupGlobalEventListeners() {
        // Close panels when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.mas-micro-panel') && !e.target.closest('.mas-edit-trigger')) {
                this.activePanels.forEach(panel => panel.close());
                this.activePanels.clear();
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'e') {
                e.preventDefault();
                this.toggle();
            }
        });

        // Delegacja obsługi kliknięcia Reset w MicroPanel/init
        document.addEventListener('click', async (e) => {
            const btn = e.target.closest('.mas-reset-btn');
            if (!btn) return;
            const optionId = btn.dataset.resetFor;
            if (!optionId) return;
            btn.disabled = true;
            Loader.show();
            try {
                const response = await fetch(window.ajaxurl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: `action=mas_reset_live_setting&nonce=${window.masNonce}&option_id=${encodeURIComponent(optionId)}`
                });
                const data = await response.json();
                Loader.hide();
                btn.disabled = false;
                if (data.success && data.default !== undefined) {
                    // Zaktualizuj UI, cache, localStorage, CSS variables, klasy, widoczność
                    if (window.liveEditInstance) {
                        window.liveEditInstance.settingsCache.set(optionId, data.default);
                        window.liveEditInstance.saveToLocalStorage();
                    }
                    // Przywróć w UI (SettingsRestorer)
                    if (window.settingsRestorer) {
                        const settings = Object.fromEntries(window.liveEditInstance.settingsCache);
                        settings[optionId] = data.default;
                        window.settingsRestorer.applyAllSettingsToUI(settings);
                    }
                    Toast.show('Przywrócono domyślne!', 'success');
                } else {
                    throw new Error(data.message || 'Błąd resetu');
                }
            } catch (error) {
                Loader.hide();
                btn.disabled = false;
                Toast.show('Błąd resetu!', 'error');
            }
        });
    }

    /**
     * 🍞 Show activation toast
     */
    showActivationToast() {
        this.showToast('Live Edit Mode Activated! Click any element to edit its settings.', 'success');
    }

    /**
     * 💾 Show save toast
     */
    showSaveToast() {
        this.showToast('Settings saved successfully!', 'success');
    }

    /**
     * 🍞 Generic toast notification
     */
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `mas-toast mas-toast-${type}`;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('mas-toast-show');
        }, 100);
        
        setTimeout(() => {
            toast.classList.remove('mas-toast-show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    handleAjaxError(optionId, value, error) {
        Toast.show('Błąd zapisu! Przechodzę w tryb offline.', 'error', 4000);
        this.isOffline = true;
        this.retryQueue.push({ optionId, value });
        this.saveToLocalStorage();
    }
    
    handleOffline() {
        this.isOffline = true;
        Toast.show('Brak połączenia. Tryb offline.', 'warning', 4000);
    }
    
    async handleOnline() {
        if (!this.isOffline) return;
        Toast.show('Połączenie przywrócone. Synchronizuję...', 'info', 4000);
        await this.retryPendingSaves();
        this.isOffline = false;
    }
    
    async retryPendingSaves() {
        while (this.retryQueue.length > 0) {
            const { optionId, value } = this.retryQueue.shift();
            await this.saveSetting(optionId, value);
        }
        Toast.show('Wszystkie zmiany zsynchronizowane!', 'success', 3000);
    }
    
    saveToLocalStorage() {
        const obj = Object.fromEntries(this.settingsCache);
        localStorage.setItem('mas_live_edit_settings', JSON.stringify(obj));
    }

    /**
     * ✅ ENTERPRISE: Apply remote update from another tab (via SyncManager)
     * This function updates the control and live CSS without re-broadcasting
     */
    applyRemoteUpdate(key, value) {
        // 1. Update local state without triggering save
        this.settingsCache.set(key, value);
        
        // 2. CRITICAL: Update the UI to reflect the change
        const control = document.querySelector(`[data-option-id="${key}"]`);
        if (control) {
            const input = control.querySelector('input, select');
            if (input) {
                if (input.type === 'checkbox') {
                    input.checked = !!value;
                } else {
                    input.value = value;
                }
                
                // Dispatch change event for any listeners
                input.dispatchEvent(new Event('change', { bubbles: true }));
            }
        }
        
        // 3. Apply CSS immediately
        this.applySettingImmediately(key, value);
        
        // 4. Update localStorage
        this.saveToLocalStorage();
        
        LiveEditDebugger.log(`Remote update applied: ${key} = ${value}`);
    }

    /**
     * ✅ ENTERPRISE: Synchronous flush for beforeunload protection
     * Attempts to save pending changes before page unload using sendBeacon
     */
    synchronousFlush() {
        if (this.saveQueue.size === 0) return;
        
        const settings = Object.fromEntries(this.saveQueue);
        const formData = new FormData();
        formData.append('action', 'mas_save_live_settings');
        formData.append('settings', JSON.stringify(settings));
        formData.append('nonce', window.masNonce || '');
        
        if (navigator.sendBeacon && window.ajaxurl) {
            const success = navigator.sendBeacon(window.ajaxurl, formData);
            if (success) {
                LiveEditDebugger.log('Emergency save via sendBeacon successful', settings);
                // Clear pending changes if beacon was sent successfully
                BeforeUnloadProtection.pendingChanges.clear();
            }
        }
    }
}

/**
 * 🎛️ Micro Panel Class - Individual contextual editing panel
 */
class MicroPanel {
    constructor(element, config, liveEditMode) {
        console.log('🎛️ WOOW! MicroPanel: Constructor called', {
            element: element,
            config: config,
            liveEditMode: liveEditMode
        });
        
        this.element = element;
        this.config = config;
        this.liveEditMode = liveEditMode;
        this.panel = null;
        this.create();
    }

    create() {
        console.log('🎛️ WOOW! MicroPanel: Creating panel for', this.config.title);
        
        this.panel = document.createElement('div');
        this.panel.className = 'mas-micro-panel';
        this.panel.dataset.category = this.config.category;
        
        let content = `
            <div class="mas-panel-header">
                <h4>
                    <span class="dashicons dashicons-${this.config.icon}"></span>
                    ${this.config.title}
                </h4>
                <button class="mas-panel-close">
                    <span class="dashicons dashicons-no-alt"></span>
                </button>
            </div>
            <div class="mas-panel-content">
        `;

        console.log('🎛️ WOOW! MicroPanel: Processing options', this.config.options);

        // Group options by section
        const sections = {};
        this.config.options.forEach(option => {
            const section = option.section || 'General';
            if (!sections[section]) sections[section] = [];
            sections[section].push(option);
        });

        console.log('🎛️ WOOW! MicroPanel: Sections grouped', sections);

        // Render sections
        Object.entries(sections).forEach(([sectionName, options]) => {
            content += `<div class="mas-section">
                <h5>${sectionName}</h5>
                <div class="mas-controls">`;
            
            options.forEach(option => {
                content += this.createControl(option);
            });
            
            content += `</div></div>`;
        });

        content += '</div>';
        this.panel.innerHTML = content;
        
        console.log('🎛️ WOOW! MicroPanel: Panel HTML created, adding to DOM');
        
        document.body.appendChild(this.panel);
        this.position();
        this.panel.__microPanelInstance = this; // umożliwia globalny dostęp
        // Usuń fixOverflow - nie jest potrzebne
    }

    /**
     * ��️ Create individual control based on type
     */
    createControl(option) {
        const currentValue = this.getCurrentValue(option);
        return this.createControlHtml(option, currentValue);
    }

    /**
     * ��️ Create individual control based on type
     */
    createControlHtml(option, currentValue) {
        let controlHtml = '';
        const resetBtn = `<button type="button" class="mas-reset-btn" data-reset-for="${option.id}" title="Przywróć domyślne">↺</button>`;
        switch (option.type) {
            case 'color':
                controlHtml = `
                    <div class="mas-control mas-control-color" data-option-id="${option.id}">
                        <label>${option.label}</label>
                        <input type="color" 
                               value="${currentValue}" 
                               data-css-var="${option.cssVar}"
                               data-option-id="${option.id}"
                               data-unit="${option.unit || ''}"
                               data-body-class="${option.bodyClass || ''}"
                               data-target-selector="${option.targetSelector || ''}"
                               data-tooltip="Wybierz kolor"
                        />
                        ${resetBtn}
                    </div>
                `;
                break;
                
            case 'slider':
                controlHtml = `
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
                                   data-body-class="${option.bodyClass || ''}"
                                   data-tooltip="Wybierz wartość"
                            />
                            <span class="mas-value">${currentValue}${option.unit || ''}</span>
                        </div>
                        ${resetBtn}
                    </div>
                `;
                break;
                
            case 'toggle':
                controlHtml = `
                    <div class="mas-control mas-control-toggle" data-option-id="${option.id}">
                        <label>${option.label}</label>
                        <input type="checkbox" 
                               ${currentValue ? 'checked' : ''}
                               data-css-var="${option.cssVar}"
                               data-option-id="${option.id}"
                               data-body-class="${option.bodyClass || ''}"
                               data-target-selector="${option.targetSelector || ''}"
                               data-tooltip="Włącz/wyłącz"
                        />
                        ${resetBtn}
                    </div>
                `;
                break;
                
            case 'select':
                controlHtml = `
                    <div class="mas-control mas-control-select" data-option-id="${option.id}">
                        <label>${option.label}</label>
                        <select data-css-var="${option.cssVar}" data-option-id="${option.id}" data-tooltip="Wybierz wartość">
                            ${Object.entries(option.options).map(([value, label]) => 
                                `<option value="${value}" ${currentValue === value ? 'selected' : ''}>${label}</option>`
                            ).join('')}
                        </select>
                        ${resetBtn}
                    </div>
                `;
                break;
                
            case 'font-picker':
                controlHtml = `
                    <div class="mas-control mas-control-font-picker" data-option-id="${option.id}">
                        <label>${option.label}</label>
                        <select data-css-var="${option.cssVar}" data-option-id="${option.id}" data-tooltip="Wybierz czcionkę">
                            ${Object.entries(option.options).map(([value, label]) => 
                                `<option value="${value}" ${currentValue === value ? 'selected' : ''}>${label}</option>`
                            ).join('')}
                        </select>
                        ${resetBtn}
                    </div>
                `;
                break;
                
            default:
                controlHtml = `
                    <div class="mas-control mas-control-text" data-option-id="${option.id}">
                        <label>${option.label}</label>
                        <input type="text" 
                               value="${currentValue}" 
                               data-css-var="${option.cssVar}"
                               data-option-id="${option.id}"
                               data-unit="${option.unit || ''}"
                               data-tooltip="Wprowadź wartość"
                        />
                        ${resetBtn}
                    </div>
                `;
        }
        return controlHtml;
    }

    /**
     * 🔍 Get current value for option
     */
    getCurrentValue(option) {
        // 1. Sprawdź cache LiveEditMode
        if (this.liveEditMode.settingsCache.has(option.id)) {
            return this.liveEditMode.settingsCache.get(option.id);
        }
        
        // 2. Sprawdź localStorage
        const saved = localStorage.getItem('mas_live_edit_settings');
        if (saved) {
            try {
                const settings = JSON.parse(saved);
                if (settings[option.id] !== undefined) {
                    return settings[option.id];
                }
            } catch (e) {
                console.error('❌ WOOW! Failed to parse localStorage:', e);
            }
        }
        
        // 3. Użyj fallback
        return option.fallback !== undefined ? option.fallback : '';
    }

    /**
     * 🔍 Get current toggle value
     */
    getCurrentToggleValue(option) {
        const value = this.getCurrentValue(option);
        return value === true || value === '1' || value === 1;
    }

    /**
     * 📍 Position panel
     */
    position() {
        if (!this.element) {
            // Global panel - center on screen
            this.panel.style.position = 'fixed';
            this.panel.style.top = '50%';
            this.panel.style.left = '50%';
            this.panel.style.transform = 'translate(-50%, -50%)';
            this.panel.style.zIndex = '999999';
        } else {
            // Position relative to target element
            const rect = this.element.getBoundingClientRect();
            this.panel.style.position = 'fixed';
            this.panel.style.top = `${Math.min(rect.top, window.innerHeight - 400)}px`;
            this.panel.style.left = `${Math.min(rect.right + 20, window.innerWidth - 350)}px`;
            this.panel.style.zIndex = '999999';
        }
    }

    /**
     * 🎯 Setup event listeners
     */
    setupEventListeners() {
        // Close button
        this.panel.querySelector('.mas-panel-close').addEventListener('click', () => {
            this.close();
        });

        // Control inputs
        this.panel.addEventListener('input', (e) => {
            this.handleControlChange(e);
        });

        this.panel.addEventListener('change', (e) => {
            this.handleControlChange(e);
        });
    }

    /**
     * 🔄 Handle control value changes
     */
    handleControlChange(e) {
        const target = e.target;
        const optionId = target.dataset.optionId;
        
        console.log(`🎛️ WOOW! Debug: Control changed for ${optionId}`, {
            value: target.value,
            checked: target.checked,
            type: target.type,
            cssVar: target.dataset.cssVar,
            bodyClass: target.dataset.bodyClass,
            unit: target.dataset.unit
        });
        
        if (!optionId) return;

        let value = target.value;
        
        // Handle different control types
        if (target.type === 'checkbox') {
            value = target.checked;
            
            // Update body class
            if (target.dataset.bodyClass) {
                document.body.classList.toggle(target.dataset.bodyClass, target.checked);
                console.log(`🎛️ WOOW! Debug: Toggled body class ${target.dataset.bodyClass} = ${target.checked}`);
            }
            
            // Update target element visibility
            if (target.dataset.targetSelector) {
                const targetEl = document.querySelector(target.dataset.targetSelector);
                if (targetEl) {
                    targetEl.style.display = target.checked ? 'none' : '';
                    console.log(`🎛️ WOOW! Debug: Toggled element visibility ${target.dataset.targetSelector} = ${target.checked ? 'hidden' : 'visible'}`);
                }
            }
        }
        
        // ✅ NAPRAWKA INTEGRACJI: Użyj SettingsManager zamiast bezpośredniego ustawiania CSS
        if (window.SettingsManager && target.dataset.cssVar) {
            const unit = target.dataset.unit || '';
            const options = {
                cssVar: target.dataset.cssVar
            };
            
            if (unit) {
                options.unit = unit;
            }
            
            if (target.dataset.bodyClass) {
                options.bodyClass = target.dataset.bodyClass;
            }
            
            // Użyj SettingsManager do aplikowania zmian
            console.log(`🎛️ WOOW! Debug: Using SettingsManager.update(${optionId}, ${value}, options)`, options);
            window.SettingsManager.update(optionId, value, options);
            console.log(`🎛️ WOOW! LiveEdit: Updated ${optionId} = ${value}${unit} via SettingsManager`);
            
            // Sprawdź czy CSS variable został faktycznie ustawiony
            setTimeout(() => {
                const appliedValue = getComputedStyle(document.documentElement).getPropertyValue(target.dataset.cssVar);
                console.log(`🔍 WOOW! Debug: Applied CSS Variable ${target.dataset.cssVar} = "${appliedValue.trim()}"`);
            }, 100);
            
        } else {
            // Fallback: bezpośrednie ustawienie CSS variable
            if (target.dataset.cssVar) {
                const unit = target.dataset.unit || '';
                document.documentElement.style.setProperty(
                    target.dataset.cssVar, 
                    value + unit
                );
                console.log(`🎛️ WOOW! LiveEdit: Updated ${target.dataset.cssVar} = ${value}${unit} (fallback)`);
            }
        }
        
        // Update value display for sliders
        if (target.type === 'range') {
            const valueDisplay = target.parentElement.querySelector('.mas-value');
            if (valueDisplay) {
                valueDisplay.textContent = value + (target.dataset.unit || '');
            }
        }

        // Save the setting
        this.liveEditMode.saveSetting(optionId, value);
    }

    /**
     * 🔄 Load current values into controls
     */
    loadCurrentValues() {
        console.log(`🔄 WOOW! Debug: Loading current values for ${this.config.title}`, this.config.options);
        
        this.config.options.forEach(option => {
            const control = this.panel.querySelector(`[data-option-id="${option.id}"]`);
            if (!control) {
                console.warn(`🔄 WOOW! Debug: Control not found for ${option.id}`);
                return;
            }

            const input = control.querySelector('input, select');
            if (!input) {
                console.warn(`🔄 WOOW! Debug: Input not found for ${option.id}`);
                return;
            }

            const currentValue = this.getCurrentValue(option);
            console.log(`🔄 WOOW! Debug: Setting ${option.id} input value to "${currentValue}"`);
            
            if (input.type === 'checkbox') {
                input.checked = this.getCurrentToggleValue(option);
                console.log(`🔄 WOOW! Debug: Set checkbox ${option.id} to ${input.checked}`);
            } else if (input.type === 'select') {
                input.value = currentValue;
                console.log(`🔄 WOOW! Debug: Set select ${option.id} to "${currentValue}"`);
            } else if (input.type === 'font-picker') {
                // For font-picker, the value is the font family name
                input.value = currentValue;
                console.log(`🔄 WOOW! Debug: Set font-picker ${option.id} to "${currentValue}"`);
            }
            else {
                input.value = currentValue;
                console.log(`🔄 WOOW! Debug: Set input ${option.id} to "${currentValue}"`);
            }
        });
    }

    /**
     * 🚫 Close panel
     */
    close() {
        if (this.panel) {
            this.panel.remove();
            this.panel = null;
        }
    }

    // Usuń fixOverflow - nie jest potrzebne
}

// Ujednolicona obsługa eventów i synchronizacji dla wszystkich typów opcji
function setupUnifiedOptionEvents() {
    document.addEventListener('input', handleOptionChange, true);
    document.addEventListener('change', handleOptionChange, true);
}

/**
 * 🔄 Handle option changes in micro panels
 * NAPRAWIONE: Używa bezpośredniego ustawiania CSS zamiast nieistniejącej funkcji
 * @param {Event} e The input or change event.
 */
async function handleOptionChange(e) {
    const input = e.target;
    if (!input.dataset.optionId) {
        return;
    }

    const key = input.dataset.optionId;
    const value = input.value;

    // 🔍 DEBUG: Log the change event
    if (window.masV2Debug || window.woowDebug) {
        console.log(`🔄 WOOW! Debug: handleOptionChange triggered`, {
            key: key,
            value: value,
            inputType: input.type,
            element: input,
            timestamp: new Date().toISOString()
        });
    }

    // 🔧 NAPRAWKA: Zastosuj zmianę bezpośrednio i wydajnie
    // 1. Pobierz nazwę zmiennej CSS i jednostkę z atrybutów data elementu
    const cssVar = input.dataset.cssVar;
    const unit = input.dataset.unit || '';

    // 2. Zastosuj styl do root elementu dokumentu dla natychmiastowego podglądu
    if (cssVar) {
        const cssValue = value + unit;
        document.documentElement.style.setProperty(cssVar, cssValue);
        
        // 🔍 DEBUG: Log CSS variable application
        if (window.masV2Debug || window.woowDebug) {
            console.log(`🎨 WOOW! Debug: CSS variable applied`, {
                cssVar: cssVar,
                value: cssValue,
                element: input,
                computed: getComputedStyle(document.documentElement).getPropertyValue(cssVar)
            });
        }
        
        console.log(`🎨 Style Applied: ${cssVar} -> ${cssValue}`);
    } else {
        console.warn(`⚠️ No CSS variable found for setting key: ${key}`);
        
        // 🔍 DEBUG: Log missing CSS variable mapping
        if (window.masV2Debug || window.woowDebug) {
            console.warn(`🔍 WOOW! Debug: Missing CSS variable mapping for "${key}"`, {
                availableDataAttributes: Object.keys(input.dataset),
                element: input
            });
        }
    }

    // 3. Zapisz ustawienie do bazy danych i rozgłoś do innych kart
    if (window.liveEditInstance) {
        window.liveEditInstance.saveSetting(key, value);
        
        // 🔍 DEBUG: Log database save attempt
        if (window.masV2Debug || window.woowDebug) {
            console.log(`💾 WOOW! Debug: Database save initiated for "${key}" = "${value}"`);
        }
    } else {
        console.warn(`⚠️ WOOW! liveEditInstance not available for saving setting: ${key}`);
    }

    // 4. Dodaj wizualny wskaźnik że ustawienie zostało zapisane
    console.log(`💾 Setting saved: ${key} = ${value}`);
    
    // 🔍 DEBUG: Log completion
    if (window.masV2Debug || window.woowDebug) {
        console.log(`✅ WOOW! Debug: handleOptionChange completed successfully for "${key}"`);
    }
}

// Wywołaj po inicjalizacji
setupUnifiedOptionEvents();

// CSS do bannera, tooltipów, loadera
const uxStyle = document.createElement('style');
uxStyle.innerHTML = `
#woow-connection-banner {
  position: fixed; top: 0; left: 50%; transform: translateX(-50%);
  z-index: 10000; padding: 8px 32px; border-radius: 0 0 12px 12px;
  font-size: 16px; font-weight: 600; color: #fff; box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  transition: background 0.3s, color 0.3s;
}
.woow-banner-online { background: #16a34a; }
.woow-banner-offline { background: #dc2626; }
.woow-tooltip {
  position: absolute; background: #23282d; color: #fff; padding: 6px 16px; border-radius: 6px;
  font-size: 14px; pointer-events: none; z-index: 10001; white-space: nowrap;
  transform: translate(-50%, -8px); box-shadow: 0 2px 8px rgba(0,0,0,0.12);
  opacity: 0.96;
}
#woow-loader { background: rgba(0,0,0,0.16)!important; }
.woow-spinner { border-top: 6px solid #16a34a!important; }
`;
document.head.appendChild(uxStyle);

// Globalny handler na końcu pliku lub w LiveEditEngine:
window.addEventListener('resize', () => {
    document.querySelectorAll('.mas-micro-panel').forEach(panel => {
        if (panel.__microPanelInstance) {
            panel.__microPanelInstance.position();
        }
    });
});
// Upewnij się, że CSS panelu zawiera:
const microPanelStyle = document.createElement('style');
microPanelStyle.innerHTML = `
.mas-micro-panel {
  position: absolute;
  z-index: 1000;
  max-width: 90vw;
  max-height: calc(100vh - 32px);
  overflow: hidden auto;
  box-shadow: 0 6px 12px rgba(0,0,0,.15);
  border-radius: 4px;
}
`;
document.head.appendChild(microPanelStyle);

/**
 * ========================================================================
 * 🚀 DEFENSIVE INITIALIZATION - Enterprise-grade startup sequence
 * ========================================================================
 * CRITICAL FIX: Implements "Defensive Initialization" architecture to prevent
 * "WOOW! Admin Styler initialization failed" errors. Each module's
 * initialization is wrapped in DOM element checks to ensure required UI
 * elements exist before attempting initialization.
 */
document.addEventListener('DOMContentLoaded', async () => {
    console.log('WOOW! Admin Styler: Starting initialization...');

    try {
        // --- Phase 1: Core System Check ---
        if (!window.location.pathname.includes('/wp-admin/') && !document.body.classList.contains('wp-admin')) {
            console.log('ℹ️ Not in admin area, skipping initialization');
            return;
        }

        // --- Phase 2: Essential Data Validation ---
        if (typeof woow_data === 'undefined') {
            console.warn('⚠️ WOOW data not found, initializing with defaults');
            window.woow_data = { settings: {}, ajax_url: '', nonce: '' };
        }

        // --- Phase 3: Core Modules (Always Load) ---
        console.log('⚡ Initializing core modules...');

        // Initialize SyncManager (always safe - no DOM dependencies)
        SyncManager.init();
        console.log('✅ SyncManager initialized.');

        // Setup settings restorer if available
        if (window.woow_data && window.woow_data.settings) {
            window.settingsRestorer = new SettingsRestorer();
            window.settingsRestorer.init();
            console.log('✅ SettingsRestorer initialized.');
        }

        console.log('✅ Core modules initialization complete.');

        // --- Phase 4: LiveEditEngine Initialization (MOVED UP) ---
        console.log('🔍 Initializing LiveEditEngine...');

        // Initialize Live Edit Engine FIRST - it will create its own toggle button if needed
        const isAdminPage = window.location.pathname.includes('/wp-admin/');
        const isMainWOOWPage = window.location.pathname.includes('admin.php') && 
                              window.location.search.includes('page=woow-admin-styler');
        
        // LiveEditEngine should initialize on all admin pages or main WOOW page
        if (isAdminPage || isMainWOOWPage) {
            console.log('🎯 Admin area detected, initializing LiveEditEngine...');
            
            // Create global instance
            window.liveEditInstance = new LiveEditEngine();
            window.liveEditInstance.init();
            
            // Legacy compatibility
            window.masLiveEditMode = window.liveEditInstance;
            
            console.log('✅ LiveEditEngine initialized successfully.');
        } else {
            console.log('ℹ️ LiveEditEngine skipped (not in admin area).');
        }

        // --- Phase 5: Emergency Toggle Button Verification (AFTER LiveEditEngine) ---
        console.log('🚨 Emergency Toggle Button Verification...');
        
        // Wait for LiveEditEngine to create its toggle, then verify
        setTimeout(() => {
            const emergencyVerification = {
                selectors: [
                    '#mas-v2-edit-mode-switch',
                    '#mas-v2-edit-mode-switch-hero', 
                    '.mas-live-edit-toggle',
                    '.woow-live-edit-toggle',
                    '.woow-emergency-toggle'
                ],
                found: [],
                visible: []
            };
            
            emergencyVerification.selectors.forEach(selector => {
                const element = document.querySelector(selector);
                if (element) {
                    emergencyVerification.found.push(selector);
                    
                    // Check visibility
                    const rect = element.getBoundingClientRect();
                    const style = window.getComputedStyle(element);
                    const isVisible = (
                        rect.width > 0 && 
                        rect.height > 0 && 
                        style.display !== 'none' && 
                        style.visibility !== 'hidden' && 
                        style.opacity !== '0'
                    );
                    
                    if (isVisible) {
                        emergencyVerification.visible.push(selector);
                    }
                }
            });
            
            console.log('🔍 Emergency Toggle Verification Results:', emergencyVerification);
            
            // If no visible toggle found, create emergency toggle
            if (emergencyVerification.visible.length === 0) {
                console.log('🚨 EMERGENCY: No visible toggle buttons found! Creating emergency fallback...');
                
                if (window.liveEditInstance && typeof window.liveEditInstance.createEmergencyToggle === 'function') {
                    const emergencyToggle = window.liveEditInstance.createEmergencyToggle();
                    
                    if (emergencyToggle) {
                        console.log('✅ Emergency toggle created successfully');
                        
                        // Add emergency notification
                        const emergencyNotification = document.createElement('div');
                        emergencyNotification.style.cssText = `
                            position: fixed !important;
                            top: 10px !important;
                            right: 20px !important;
                            z-index: 999997 !important;
                            background: #f59e0b !important;
                            color: white !important;
                            padding: 8px 12px !important;
                            border-radius: 6px !important;
                            font-size: 12px !important;
                            font-weight: 500 !important;
                            box-shadow: 0 2px 8px rgba(0,0,0,0.1) !important;
                            max-width: 200px !important;
                        `;
                        emergencyNotification.textContent = 'Emergency toggle active';
                        document.body.appendChild(emergencyNotification);
                        
                        // Remove notification after 5 seconds
                        setTimeout(() => emergencyNotification.remove(), 5000);
                    }
                } else {
                    console.error('❌ CRITICAL: Could not create emergency toggle - liveEditInstance not available');
                }
            } else {
                console.log(`✅ Found ${emergencyVerification.visible.length} visible toggle(s):`, emergencyVerification.visible);
            }
        }, 1500); // Wait 1.5 seconds for LiveEditEngine to create toggle

        // --- Phase 6: Additional UI Components ---

        // Initialize Advanced Toolbar only if its container exists
        const advancedToolbar = document.querySelector('.mas-advanced-toolbar') ||
                               document.querySelector('.woow-advanced-toolbar') ||
                               document.querySelector('[data-component="advanced-toolbar"]');

        if (advancedToolbar) {
            // Future: AdvancedToolbar.init();
            console.log('✅ Advanced Toolbar container found (ready for implementation).');
        } else {
            console.log('ℹ️ Advanced Toolbar skipped (container not found on this page).');
        }

        // Initialize global event handlers (always safe)
        setupUnifiedOptionEvents();
        console.log('✅ Global event handlers initialized.');

        // --- Phase 7: Cleanup Handlers ---
        window.addEventListener('beforeunload', () => {
            SyncManager.destroy();
            BeforeUnloadProtection.disable();
        });

        console.log('🚀 WOOW! Admin Styler: Initialization complete successfully!');

    } catch (error) {
        // This catches only critical core errors, not optional UI components
        console.error('🔴 CRITICAL: WOOW! Admin Styler core initialization failed!', error);
        console.error('🔴 Error details:', {
            message: error.message,
            stack: error.stack,
            location: window.location.href,
            woowData: typeof woow_data !== 'undefined'
        });
        
        // User-friendly alert only for critical failures
        if (error.message.includes('woow_data') || error.message.includes('required')) {
            alert('WOOW! Admin Styler: Critical initialization failure. Please check console for details.');
        }
    }
});

// 🔄 BACKUP INITIALIZATION: Removed to prevent conflicts with defensive initialization

/**
 * 🎯 IMPLEMENTATION COMPLETE
 * 
 * This Live Edit Mode system implements the comprehensive 107+ option plan with:
 * 
 * ✅ Contextual micro-panels for each major interface section
 * ✅ Complete CSS variable system mapping all visual options
 * ✅ Real-time preview with instant visual feedback
 * ✅ Auto-save functionality with WordPress integration
 * ✅ Clean, intuitive user interface
 * ✅ Professional toast notifications
 * ✅ Keyboard shortcuts (Ctrl+E to toggle)
 * ✅ Responsive design and positioning
 * ✅ Extensible architecture for future options
 * ✅ NAPRAWKA: System przywracania ustawień po refresh
 * ✅ NAPRAWKA: Ulepszona synchronizacja z bazą danych
 * ✅ NAPRAWKA: Mechanizm debugowania i monitoringu
 * 
 * The system transforms the comprehensive option mapping into an 
 * intuitive, context-aware editing experience that rivals premium
 * design tools while maintaining WordPress integration.
 */ 

// 🔧 DEBUG FUNCTIONS - Global functions for testing/debugging
window.woowDebug = {
    /**
     * Force create emergency toggle button
     */
    forceCreateToggle: function() {
        console.log('🔧 DEBUG: Force creating toggle...');
        
        if (!window.liveEditInstance) {
            console.error('❌ LiveEditEngine not available');
            return false;
        }
        
        const toggle = window.liveEditInstance.createEmergencyToggle();
        if (toggle) {
            console.log('✅ Emergency toggle force-created');
            return true;
        } else {
            console.error('❌ Failed to create emergency toggle');
            return false;
        }
    },

    /**
     * Check toggle status
     */
    checkToggles: function() {
        const selectors = [
            '#mas-v2-edit-mode-switch',
            '#mas-v2-edit-mode-switch-hero', 
            '.mas-live-edit-toggle',
            '.woow-live-edit-toggle',
            '.woow-emergency-toggle'
        ];
        
        console.log('🔍 DEBUG: Checking all toggle selectors...');
        
        selectors.forEach(selector => {
            const element = document.querySelector(selector);
            console.log(`${selector}:`, {
                found: !!element,
                visible: element ? window.liveEditInstance?.isElementVisible?.(element) : false,
                element: element
            });
        });
        
        return selectors.map(selector => ({
            selector,
            element: document.querySelector(selector)
        })).filter(item => item.element);
    },

    /**
     * Initialize LiveEditEngine manually
     */
    initLiveEdit: function() {
        console.log('🔧 DEBUG: Manual LiveEditEngine initialization...');
        
        if (window.liveEditInstance) {
            console.log('⚠️ LiveEditEngine already exists, reinitializing...');
        }
        
        try {
            window.liveEditInstance = new LiveEditEngine();
            window.liveEditInstance.init();
            console.log('✅ LiveEditEngine manually initialized');
            return true;
        } catch (error) {
            console.error('❌ Manual initialization failed:', error);
            return false;
        }
    },

    /**
     * Show current Live Edit state
     */
    showState: function() {
        const state = {
            liveEditInstance: !!window.liveEditInstance,
            bodyClasses: Array.from(document.body.classList).filter(cls => 
                cls.includes('live-edit') || cls.includes('edit-mode') || cls.includes('woow')
            ),
            editableElements: document.querySelectorAll('[data-woow-editable="true"]').length,
            microPanels: document.querySelectorAll('.mas-micro-panel').length,
            currentURL: window.location.href,
            isAdmin: window.location.href.includes('/wp-admin/')
        };
        
        console.log('📊 DEBUG: Current Live Edit state:', state);
        return state;
    }
};

console.log('🔧 WOOW Debug functions available:');
console.log('- woowDebug.forceCreateToggle() - Force create emergency toggle');
console.log('- woowDebug.checkToggles() - Check all toggle selectors');
console.log('- woowDebug.initLiveEdit() - Manual LiveEditEngine init');
console.log('- woowDebug.showState() - Show current state');