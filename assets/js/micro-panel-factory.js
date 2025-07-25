/**
 * 🎯 MicroPanelFactory - Dynamic Micro-Panel Creation System
 * 
 * Creates contextual micro-panels for WordPress admin elements with:
 * - Intelligent positioning to avoid viewport boundaries
 * - Event delegation for all control types
 * - Real-time CSS variable updates
 * - Cross-tab synchronization support
 * 
 * @package ModernAdminStyler
 * @version 1.0.0 - Initial Implementation
 */

(function (window, document) {
    'use strict';

    /**
     * 🏭 MicroPanelFactory - Main Factory Class
     */
    class MicroPanelFactory {
        constructor() {
            this.activePanels = new Map();
            this.panelConfigs = new Map();
            this.eventManager = null;
            this.cssMapper = null;
            this.debugMode = window.masV2Debug || false;

            this.initializeConfigurations();
            this.setupEventDelegation();

            this.log('MicroPanelFactory initialized');
        }

        /**
         * 🎛️ Initialize panel configurations for different elements
         */
        initializeConfigurations() {
            // Admin Bar Configuration
            this.panelConfigs.set('wpadminbar', {
                targetSelector: '#wpadminbar',
                position: 'bottom-center',
                title: 'Admin Bar Settings',
                icon: '🎨',
                options: [
                    {
                        id: 'admin_bar_background',
                        label: 'Background Color',
                        type: 'color',
                        cssVar: '--woow-surface-bar',
                        default: '#23282d'
                    },
                    {
                        id: 'admin_bar_text_color',
                        label: 'Text Color',
                        type: 'color',
                        cssVar: '--woow-surface-bar-text',
                        default: '#ffffff'
                    },
                    {
                        id: 'admin_bar_height',
                        label: 'Height',
                        type: 'slider',
                        cssVar: '--woow-surface-bar-height',
                        unit: 'px',
                        min: 24,
                        max: 60,
                        default: 32
                    },
                    {
                        id: 'admin_bar_floating',
                        label: 'Floating Mode',
                        type: 'toggle',
                        cssVar: '--woow-surface-bar-floating',
                        bodyClass: 'woow-admin-bar-floating',
                        default: false
                    }
                ]
            });

            // Admin Menu Configuration
            this.panelConfigs.set('adminmenuwrap', {
                targetSelector: '#adminmenuwrap',
                position: 'right-center',
                title: 'Menu Settings',
                icon: '📋',
                options: [
                    {
                        id: 'menu_background',
                        label: 'Background Color',
                        type: 'color',
                        cssVar: '--woow-surface-menu',
                        default: '#23282d'
                    },
                    {
                        id: 'menu_width',
                        label: 'Width',
                        type: 'slider',
                        cssVar: '--woow-surface-menu-width',
                        unit: 'px',
                        min: 120,
                        max: 300,
                        default: 160
                    },
                    {
                        id: 'menu_floating',
                        label: 'Floating Mode',
                        type: 'toggle',
                        cssVar: '--woow-surface-menu-floating',
                        bodyClass: 'woow-menu-floating',
                        default: false
                    }
                ]
            });

            this.log('Panel configurations initialized', this.panelConfigs.size);
        }

        /**
         * 🏗️ Build micro-panel for specific element
         */
        static build(elementId, options = {}) {
            if (!window.microPanelFactoryInstance) {
                window.microPanelFactoryInstance = new MicroPanelFactory();
            }

            return window.microPanelFactoryInstance.createPanel(elementId, options);
        }

        /**
         * 🎨 Create panel for element
         */
        createPanel(elementId, options = {}) {
            const config = this.panelConfigs.get(elementId);
            if (!config) {
                this.logError(`No configuration found for element: ${elementId}`);
                return null;
            }

            const targetElement = document.querySelector(config.targetSelector);
            if (!targetElement) {
                this.logError(`Target element not found: ${config.targetSelector}`);
                return null;
            }

            // Check if panel already exists
            if (this.activePanels.has(elementId)) {
                this.log(`Panel already exists for ${elementId}, returning existing panel`);
                return this.activePanels.get(elementId);
            }

            // Create panel element
            const panel = this.buildPanelElement(config, elementId);

            // Position panel intelligently
            this.positionPanel(panel, targetElement, config.position);

            // Bind event handlers
            this.bindPanelEvents(panel, config);

            // Add to DOM
            document.body.appendChild(panel);

            // Store reference
            this.activePanels.set(elementId, panel);

            // Add visual indicator to target element
            this.addTargetIndicator(targetElement, panel);

            this.log(`Panel created for ${elementId}`, panel);
            return panel;
        }

        /**
         * 🏗️ Build panel HTML element
         */
        buildPanelElement(config, elementId) {
            const panel = document.createElement('div');
            panel.className = 'woow-micro-panel mas-micro-panel';
            panel.setAttribute('data-element-id', elementId);
            panel.setAttribute('data-panel-type', 'micro-panel');

            // Panel header
            const header = document.createElement('div');
            header.className = 'woow-panel-header';
            header.innerHTML = `
                <span class="woow-panel-icon">${config.icon}</span>
                <span class="woow-panel-title">${config.title}</span>
                <button class="woow-panel-close" type="button" aria-label="Close panel">×</button>
            `;

            // Panel content
            const content = document.createElement('div');
            content.className = 'woow-panel-content';

            // Build controls
            config.options.forEach(option => {
                const control = this.buildControl(option);
                content.appendChild(control);
            });

            panel.appendChild(header);
            panel.appendChild(content);

            // Add styles
            this.addPanelStyles(panel);

            return panel;
        }

        /**
         * 🎛️ Build individual control element
         */
        buildControl(option) {
            const wrapper = document.createElement('div');
            wrapper.className = 'woow-control-wrapper';
            wrapper.setAttribute('data-option-id', option.id);

            const label = document.createElement('label');
            label.className = 'woow-control-label';
            label.textContent = option.label;

            let control;

            switch (option.type) {
                case 'color':
                    control = document.createElement('input');
                    control.type = 'color';
                    control.value = option.default;
                    control.className = 'woow-color-control';
                    break;

                case 'slider':
                    control = document.createElement('input');
                    control.type = 'range';
                    control.min = option.min || 0;
                    control.max = option.max || 100;
                    control.value = option.default || 50;
                    control.className = 'woow-slider-control';

                    // Add value display
                    const valueDisplay = document.createElement('span');
                    valueDisplay.className = 'woow-slider-value';
                    valueDisplay.textContent = control.value + (option.unit || '');
                    wrapper.appendChild(valueDisplay);
                    break;

                case 'toggle':
                    control = document.createElement('input');
                    control.type = 'checkbox';
                    control.checked = option.default || false;
                    control.className = 'woow-toggle-control';
                    break;

                default:
                    control = document.createElement('input');
                    control.type = 'text';
                    control.value = option.default || '';
                    control.className = 'woow-text-control';
            }

            control.setAttribute('data-option-id', option.id);
            control.setAttribute('data-css-var', option.cssVar);
            if (option.unit) control.setAttribute('data-unit', option.unit);
            if (option.bodyClass) control.setAttribute('data-body-class', option.bodyClass);

            wrapper.appendChild(label);
            wrapper.appendChild(control);

            return wrapper;
        }

        /**
         * 📍 Position panel intelligently
         */
        positionPanel(panel, targetElement, preferredPosition = 'bottom-center') {
            const targetRect = targetElement.getBoundingClientRect();
            const viewport = {
                width: window.innerWidth,
                height: window.innerHeight
            };

            // Panel dimensions (estimate before positioning)
            panel.style.position = 'fixed';
            panel.style.visibility = 'hidden';
            panel.style.zIndex = '999999';

            // Get actual panel dimensions
            const panelRect = panel.getBoundingClientRect();
            const panelWidth = Math.max(panelRect.width, 280); // Minimum width
            const panelHeight = Math.max(panelRect.height, 200); // Minimum height

            let position = { top: 0, left: 0 };

            // Calculate position based on preference and available space
            switch (preferredPosition) {
                case 'bottom-center':
                    position.left = targetRect.left + (targetRect.width / 2) - (panelWidth / 2);
                    position.top = targetRect.bottom + 10;
                    break;

                case 'right-center':
                    position.left = targetRect.right + 10;
                    position.top = targetRect.top + (targetRect.height / 2) - (panelHeight / 2);
                    break;

                case 'top-center':
                    position.left = targetRect.left + (targetRect.width / 2) - (panelWidth / 2);
                    position.top = targetRect.top - panelHeight - 10;
                    break;

                case 'left-center':
                    position.left = targetRect.left - panelWidth - 10;
                    position.top = targetRect.top + (targetRect.height / 2) - (panelHeight / 2);
                    break;
            }

            // Boundary checks and adjustments
            if (position.left < 10) position.left = 10;
            if (position.left + panelWidth > viewport.width - 10) {
                position.left = viewport.width - panelWidth - 10;
            }

            if (position.top < 10) position.top = 10;
            if (position.top + panelHeight > viewport.height - 10) {
                position.top = viewport.height - panelHeight - 10;
            }

            // Apply position
            panel.style.left = position.left + 'px';
            panel.style.top = position.top + 'px';
            panel.style.visibility = 'visible';

            this.log(`Panel positioned at ${position.left}, ${position.top}`);
        }

        /**
         * 🎯 Add visual indicator to target element
         */
        addTargetIndicator(targetElement, panel) {
            targetElement.classList.add('woow-has-micro-panel');
            targetElement.setAttribute('data-micro-panel-active', 'true');

            // Add subtle outline
            const originalOutline = targetElement.style.outline;
            targetElement.style.outline = '2px solid rgba(0, 123, 255, 0.3)';
            targetElement.style.outlineOffset = '2px';

            // Store original style for cleanup
            panel._originalTargetOutline = originalOutline;
        }

        /**
         * 🎨 Add panel styles
         */
        addPanelStyles(panel) {
            // Add inline styles for immediate application
            Object.assign(panel.style, {
                position: 'fixed',
                zIndex: '999999',
                backgroundColor: '#ffffff',
                border: '1px solid #ddd',
                borderRadius: '8px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                padding: '0',
                minWidth: '280px',
                maxWidth: '400px',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                fontSize: '14px',
                lineHeight: '1.4'
            });

            // Header styles
            const header = panel.querySelector('.woow-panel-header');
            if (header) {
                Object.assign(header.style, {
                    padding: '12px 16px',
                    borderBottom: '1px solid #eee',
                    display: 'flex',
                    alignItems: 'center',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '8px 8px 0 0'
                });
            }

            // Content styles
            const content = panel.querySelector('.woow-panel-content');
            if (content) {
                Object.assign(content.style, {
                    padding: '16px',
                    maxHeight: '400px',
                    overflowY: 'auto'
                });
            }

            // Control wrapper styles
            panel.querySelectorAll('.woow-control-wrapper').forEach(wrapper => {
                Object.assign(wrapper.style, {
                    marginBottom: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                });
            });

            // Label styles
            panel.querySelectorAll('.woow-control-label').forEach(label => {
                Object.assign(label.style, {
                    fontWeight: '500',
                    marginRight: '12px',
                    minWidth: '100px'
                });
            });

            // Control styles
            panel.querySelectorAll('input').forEach(input => {
                Object.assign(input.style, {
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    padding: '4px 8px'
                });
            });
        }

        /**
         * 🎯 Bind event handlers to panel
         */
        bindPanelEvents(panel, config) {
            // Close button
            const closeBtn = panel.querySelector('.woow-panel-close');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => {
                    this.closePanel(panel);
                });
            }

            // Control events - use event delegation
            panel.addEventListener('input', (e) => {
                if (e.target.hasAttribute('data-option-id')) {
                    this.handleControlChange(e.target, e);
                }
            });

            panel.addEventListener('change', (e) => {
                if (e.target.hasAttribute('data-option-id')) {
                    this.handleControlChange(e.target, e);
                }
            });

            // Slider value display updates
            panel.addEventListener('input', (e) => {
                if (e.target.type === 'range') {
                    const valueDisplay = e.target.parentElement.querySelector('.woow-slider-value');
                    if (valueDisplay) {
                        const unit = e.target.getAttribute('data-unit') || '';
                        valueDisplay.textContent = e.target.value + unit;
                    }
                }
            });

            this.log('Panel events bound', config.title);
        }

        /**
         * 🎛️ Handle control value changes
         */
        handleControlChange(control, event) {
            const startTime = performance.now();

            const optionId = control.getAttribute('data-option-id');
            const cssVar = control.getAttribute('data-css-var');
            const unit = control.getAttribute('data-unit') || '';
            const bodyClass = control.getAttribute('data-body-class');

            let value = control.value;

            // Handle different control types
            if (control.type === 'checkbox') {
                value = control.checked;
            }

            this.log(`Control changed: ${optionId} = ${value}`);

            // Validate control mapping before proceeding
            if (!this.validateControlMapping(control)) {
                this.logError(`Invalid control mapping for ${optionId}`, control);
                return;
            }

            // Apply changes immediately for real-time feedback
            let cssApplied = false;
            let classApplied = false;

            // Apply CSS variable immediately
            if (cssVar) {
                cssApplied = this.applyCSSVariable(cssVar, value, unit);

                // If CSS variable application failed, try fallback methods
                if (!cssApplied) {
                    cssApplied = this.applyCSSVariableFallback(cssVar, value, unit);
                }
            }

            // Apply body class if specified
            if (bodyClass) {
                classApplied = this.applyBodyClass(bodyClass, value);
            }

            // Measure performance
            const endTime = performance.now();
            const duration = endTime - startTime;

            if (duration > 100) {
                this.logError(`Slow CSS update for ${optionId}: ${duration}ms (target: <100ms)`);
            } else {
                this.log(`CSS update completed in ${duration.toFixed(2)}ms`);
            }

            // Visual feedback based on success/failure
            if (cssApplied || classApplied || (!cssVar && !bodyClass)) {
                this.showChangeIndicator(control, 'success');
            } else {
                this.showChangeIndicator(control, 'error');
                this.logError(`Failed to apply changes for ${optionId}`);
            }

            // Broadcast change for cross-tab sync
            this.broadcastChange(optionId, value);

            // Save to backend (debounced)
            this.scheduleSave(optionId, value);

            // Trigger custom event for other components
            this.triggerChangeEvent(optionId, value, {
                cssVar,
                bodyClass,
                duration,
                success: cssApplied || classApplied
            });
        }

        /**
         * 🎨 Fallback CSS variable application methods
         */
        applyCSSVariableFallback(cssVar, value, unit = '') {
            this.log(`Trying fallback CSS application for ${cssVar}`);

            let cssValue = value;
            if (typeof value === 'boolean') {
                cssValue = value ? '1' : '0';
            } else if (typeof value === 'number' || !isNaN(value)) {
                cssValue = value + unit;
            }

            try {
                // Method 1: Try with higher specificity
                const style = document.createElement('style');
                style.textContent = `
                    :root { ${cssVar}: ${cssValue} !important; }
                    html { ${cssVar}: ${cssValue} !important; }
                    body { ${cssVar}: ${cssValue} !important; }
                `;
                style.setAttribute('data-mas-fallback', cssVar);
                document.head.appendChild(style);

                // Remove any existing fallback styles for this variable
                const existingStyles = document.querySelectorAll(`style[data-mas-fallback="${cssVar}"]`);
                if (existingStyles.length > 1) {
                    existingStyles[0].remove();
                }

                this.log(`Fallback CSS applied via style element: ${cssVar} = ${cssValue}`);
                return true;

            } catch (error) {
                this.logError(`Fallback CSS application failed: ${error.message}`, error);
                return false;
            }
        }

        /**
         * 🏷️ Enhanced body class application
         */
        applyBodyClass(className, value) {
            try {
                const body = document.body;

                if (value) {
                    body.classList.add(className);
                    this.log(`Body class added: ${className}`);
                } else {
                    body.classList.remove(className);
                    this.log(`Body class removed: ${className}`);
                }

                // Verify class was applied/removed
                const hasClass = body.classList.contains(className);
                const expectedState = !!value;

                if (hasClass !== expectedState) {
                    this.logError(`Body class application failed: ${className}`, {
                        expected: expectedState,
                        actual: hasClass
                    });
                    return false;
                }

                return true;

            } catch (error) {
                this.logError(`Body class application error: ${error.message}`, error);
                return false;
            }
        }

        /**
         * ✨ Enhanced visual feedback for changes
         */
        showChangeIndicator(control, type = 'success') {
            const wrapper = control.closest('.woow-control-wrapper');
            if (!wrapper) return;

            // Remove any existing indicators
            wrapper.classList.remove('woow-change-success', 'woow-change-error', 'woow-change-pending');

            // Add appropriate indicator
            const className = `woow-change-${type}`;
            wrapper.classList.add(className);

            // Set appropriate colors
            const colors = {
                success: { bg: '#d4edda', border: '#c3e6cb' },
                error: { bg: '#f8d7da', border: '#f5c6cb' },
                pending: { bg: '#fff3cd', border: '#ffeaa7' }
            };

            const color = colors[type] || colors.success;
            wrapper.style.backgroundColor = color.bg;
            wrapper.style.borderColor = color.border;
            wrapper.style.transition = 'all 0.3s ease';

            // Remove indicator after delay
            setTimeout(() => {
                wrapper.classList.remove(className);
                wrapper.style.backgroundColor = '';
                wrapper.style.borderColor = '';
                wrapper.style.transition = '';
            }, type === 'error' ? 2000 : 1000);
        }

        /**
         * 📡 Trigger custom change event
         */
        triggerChangeEvent(optionId, value, details = {}) {
            const event = new CustomEvent('masOptionChanged', {
                detail: {
                    optionId,
                    value,
                    timestamp: Date.now(),
                    ...details
                }
            });

            document.dispatchEvent(event);
            this.log(`Custom event triggered for ${optionId}`, event.detail);
        }

        /**
         * 🔍 Validate CSS variable mapping
         */
        validateCSSVariableMapping(cssVar, value) {
            if (!cssVar) {
                this.logError('CSS variable is required but not provided');
                return false;
            }

            // Check if CSS variable name is valid
            if (!cssVar.startsWith('--')) {
                this.logError(`Invalid CSS variable name: ${cssVar} (must start with --)`);
                return false;
            }

            // Check if value is valid
            if (value === null || value === undefined) {
                this.logError(`Invalid value for CSS variable ${cssVar}: ${value}`);
                return false;
            }

            return true;
        }

        /**
         * 🎨 Apply CSS variable using new CSS Variables Engine
         */
        async applyCSSVariable(cssVar, value, unit = '') {
            // Validate CSS variable mapping first
            if (!this.validateCSSVariableMapping(cssVar, value)) {
                return false;
            }

            // Use new CSS Variables Engine if available
            if (window.cssVariablesEngine && window.cssVariablesEngine.isInitialized) {
                // Extract option ID from cssVar if possible
                const optionId = this.getOptionIdFromCSSVar(cssVar);
                if (optionId) {
                    try {
                        const success = await window.cssVariablesEngine.applyVariable(optionId, value);
                        if (success) {
                            this.log(`✅ Applied via CSS Engine: ${cssVar} = ${value}${unit}`);
                            return true;
                        }
                    } catch (error) {
                        this.logError('CSS Engine application failed:', error);
                    }
                }
            }

            // Fallback to legacy CSSVariableMapper
            if (window.cssVariableMapperInstance) {
                const optionId = this.getOptionIdFromCSSVar(cssVar);
                if (optionId) {
                    return window.cssVariableMapperInstance.applyOption(optionId, value);
                }
            }

            // Fallback to direct CSS variable application
            let cssValue = value;

            // Format value based on type
            if (typeof value === 'boolean') {
                cssValue = value ? '1' : '0';
            } else if (typeof value === 'number' || !isNaN(value)) {
                cssValue = value + unit;
            }

            // Debug CSS variable application if in debug mode
            if (this.debugMode) {
                this.debugCSSVariableApplication(cssVar, cssValue, '');
            }

            // Apply to document root
            document.documentElement.style.setProperty(cssVar, cssValue);

            // Also apply to body for higher specificity
            document.body.style.setProperty(cssVar, cssValue, 'important');

            // Verify application was successful
            const appliedValue = getComputedStyle(document.documentElement).getPropertyValue(cssVar);
            if (appliedValue.trim() !== cssValue.toString().trim()) {
                this.logError(`CSS Variable application failed: ${cssVar}`, {
                    expected: cssValue,
                    actual: appliedValue,
                    originalValue: value,
                    unit: unit
                });
                return false;
            }

            this.log(`CSS Variable applied successfully: ${cssVar} = ${cssValue}`);
            return true;
        }

        /**
         * 🔍 Get option ID from CSS variable name
         */
        getOptionIdFromCSSVar(cssVar) {
            // Reverse mapping from CSS var to option ID
            const mappings = {
                '--woow-surface-bar': 'admin_bar_background',
                '--woow-surface-bar-text': 'admin_bar_text_color',
                '--woow-surface-bar-height': 'admin_bar_height',
                '--woow-surface-bar-floating': 'admin_bar_floating',
                '--woow-surface-menu': 'menu_background',
                '--woow-surface-menu-width': 'menu_width',
                '--woow-surface-menu-floating': 'menu_floating'
            };

            return mappings[cssVar] || null;
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
         * 📡 Broadcast change to other tabs with anti-echo protection
         */
        broadcastChange(optionId, value) {
            // Create unique change ID to prevent echo
            const changeId = this.generateChangeId(optionId, value);

            // Store change ID to prevent processing our own broadcasts
            this.recentChanges = this.recentChanges || new Map();
            this.recentChanges.set(changeId, Date.now());

            // Clean up old change IDs (older than 5 seconds)
            this.cleanupRecentChanges();

            const changeData = {
                optionId,
                value,
                changeId,
                timestamp: Date.now(),
                source: 'micro-panel'
            };

            // Use BroadcastChannel if available
            if (this.getBroadcastChannel()) {
                this.getBroadcastChannel().postMessage(changeData);
                this.log(`Broadcasted change: ${optionId} = ${value} (ID: ${changeId})`);
            }

            // Fallback to SyncManager if available
            else if (window.SyncManager && window.SyncManager.broadcast) {
                window.SyncManager.broadcast(optionId, value, changeData);
            }

            // Fallback to localStorage for cross-tab sync
            else {
                this.broadcastViaLocalStorage(changeData);
            }
        }

        /**
         * 📻 Get or create BroadcastChannel
         */
        getBroadcastChannel() {
            if (!this.broadcastChannel && typeof BroadcastChannel !== 'undefined') {
                try {
                    this.broadcastChannel = new BroadcastChannel('mas-micro-panel-sync');
                    this.setupBroadcastChannelListener();
                } catch (error) {
                    this.logError('Failed to create BroadcastChannel:', error);
                    return null;
                }
            }

            return this.broadcastChannel || null;
        }

        /**
         * 👂 Setup BroadcastChannel listener
         */
        setupBroadcastChannelListener() {
            if (!this.broadcastChannel) return;

            this.broadcastChannel.addEventListener('message', (event) => {
                this.handleBroadcastMessage(event.data);
            });

            this.log('BroadcastChannel listener setup complete');
        }

        /**
         * 📨 Handle broadcast messages from other tabs
         */
        handleBroadcastMessage(data) {
            if (!data || !data.optionId || !data.changeId) {
                return;
            }

            // Check if this is our own change (anti-echo protection)
            if (this.recentChanges && this.recentChanges.has(data.changeId)) {
                this.log(`Ignoring echo of our own change: ${data.optionId} (ID: ${data.changeId})`);
                return;
            }

            // Check if change is too old (older than 10 seconds)
            if (Date.now() - data.timestamp > 10000) {
                this.log(`Ignoring old broadcast: ${data.optionId} (age: ${Date.now() - data.timestamp}ms)`);
                return;
            }

            this.log(`Received broadcast: ${data.optionId} = ${data.value} from ${data.source}`);

            // Apply the change from other tab
            this.applyRemoteChange(data.optionId, data.value);
        }

        /**
         * 🔄 Apply change received from other tab
         */
        applyRemoteChange(optionId, value) {
            // Find the control in active panels
            let targetControl = null;

            this.activePanels.forEach(panel => {
                const control = panel.querySelector(`[data-option-id="${optionId}"]`);
                if (control) {
                    targetControl = control;
                }
            });

            if (!targetControl) {
                this.log(`No control found for remote change: ${optionId}`);
                return;
            }

            // Update control value without triggering change event
            if (targetControl.type === 'checkbox') {
                targetControl.checked = value;
            } else {
                targetControl.value = value;
            }

            // Apply CSS changes directly
            const cssVar = targetControl.getAttribute('data-css-var');
            const unit = targetControl.getAttribute('data-unit') || '';
            const bodyClass = targetControl.getAttribute('data-body-class');

            if (cssVar) {
                this.applyCSSVariable(cssVar, value, unit);
            }

            if (bodyClass) {
                this.applyBodyClass(bodyClass, value);
            }

            // Show visual feedback for remote change
            this.showRemoteChangeIndicator(targetControl);

            this.log(`Applied remote change: ${optionId} = ${value}`);
        }

        /**
         * ✨ Show visual feedback for remote changes
         */
        showRemoteChangeIndicator(control) {
            const wrapper = control.closest('.woow-control-wrapper');
            if (!wrapper) return;

            // Add remote change indicator
            wrapper.classList.add('woow-remote-change');
            wrapper.style.backgroundColor = '#e3f2fd';
            wrapper.style.borderColor = '#2196f3';
            wrapper.style.transition = 'all 0.3s ease';

            // Add small indicator icon
            let indicator = wrapper.querySelector('.woow-remote-indicator');
            if (!indicator) {
                indicator = document.createElement('span');
                indicator.className = 'woow-remote-indicator';
                indicator.textContent = '🔄';
                indicator.style.cssText = `
                    position: absolute;
                    top: -5px;
                    right: -5px;
                    font-size: 12px;
                    background: #2196f3;
                    color: white;
                    border-radius: 50%;
                    width: 16px;
                    height: 16px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                `;
                wrapper.style.position = 'relative';
                wrapper.appendChild(indicator);
            }

            // Remove indicator after delay
            setTimeout(() => {
                wrapper.classList.remove('woow-remote-change');
                wrapper.style.backgroundColor = '';
                wrapper.style.borderColor = '';
                wrapper.style.transition = '';

                if (indicator) {
                    indicator.remove();
                }
            }, 2000);
        }

        /**
         * 🆔 Generate unique change ID
         */
        generateChangeId(optionId, value) {
            const timestamp = Date.now();
            const random = Math.random().toString(36).substr(2, 9);
            return `${optionId}_${value}_${timestamp}_${random}`;
        }

        /**
         * 🧹 Clean up old change IDs
         */
        cleanupRecentChanges() {
            if (!this.recentChanges) return;

            const now = Date.now();
            const maxAge = 5000; // 5 seconds

            for (const [changeId, timestamp] of this.recentChanges.entries()) {
                if (now - timestamp > maxAge) {
                    this.recentChanges.delete(changeId);
                }
            }
        }

        /**
         * 💾 Broadcast via localStorage fallback
         */
        broadcastViaLocalStorage(changeData) {
            try {
                const storageKey = 'mas-micro-panel-sync';
                const existingData = JSON.parse(localStorage.getItem(storageKey) || '[]');

                // Add new change
                existingData.push(changeData);

                // Keep only last 10 changes
                if (existingData.length > 10) {
                    existingData.splice(0, existingData.length - 10);
                }

                localStorage.setItem(storageKey, JSON.stringify(existingData));

                // Listen for storage events
                this.setupLocalStorageListener();

                this.log(`Broadcasted via localStorage: ${changeData.optionId}`);

            } catch (error) {
                this.logError('Failed to broadcast via localStorage:', error);
            }
        }

        /**
         * 👂 Setup localStorage listener
         */
        setupLocalStorageListener() {
            if (this.localStorageListenerSetup) return;

            window.addEventListener('storage', (event) => {
                if (event.key === 'mas-micro-panel-sync' && event.newValue) {
                    try {
                        const changes = JSON.parse(event.newValue);
                        const latestChange = changes[changes.length - 1];

                        if (latestChange) {
                            this.handleBroadcastMessage(latestChange);
                        }
                    } catch (error) {
                        this.logError('Failed to parse localStorage sync data:', error);
                    }
                }
            });

            this.localStorageListenerSetup = true;
            this.log('localStorage sync listener setup complete');
        }

        /**
         * 🔄 Handle conflicts in concurrent changes
         */
        resolveConflict(optionId, localValue, remoteValue, localTimestamp, remoteTimestamp) {
            // Use timestamp-based conflict resolution (last write wins)
            if (remoteTimestamp > localTimestamp) {
                this.log(`Conflict resolved: Using remote value for ${optionId} (${remoteValue})`);
                return remoteValue;
            } else {
                this.log(`Conflict resolved: Keeping local value for ${optionId} (${localValue})`);
                return localValue;
            }
        }

        /**
         * 🔄 Sync state with other tabs on initialization
         */
        syncStateOnInit() {
            // Request current state from other tabs
            const syncRequest = {
                type: 'sync-request',
                timestamp: Date.now(),
                requestId: this.generateChangeId('sync', 'request')
            };

            if (this.getBroadcastChannel()) {
                this.getBroadcastChannel().postMessage(syncRequest);
            }

            this.log('State sync requested from other tabs');
        }

        /**
         * 🛡️ Production-ready error handling wrapper
         */
        safeExecute(operation, context = 'unknown', fallback = null) {
            try {
                return operation();
            } catch (error) {
                this.handleProductionError(error, context);
                return fallback;
            }
        }

        /**
         * 🚨 Handle production errors gracefully
         */
        handleProductionError(error, context) {
            const errorInfo = {
                message: error.message,
                stack: error.stack,
                context: context,
                timestamp: new Date().toISOString(),
                url: window.location.href,
                userAgent: navigator.userAgent,
                component: 'MicroPanelFactory'
            };

            // Log error (but don't spam console in production)
            if (this.debugMode || window.location.hostname === 'localhost') {
                console.error(`🚨 MicroPanelFactory Error [${context}]:`, error);
            }

            // Send to backend error logging (with rate limiting)
            this.rateLimitedErrorLogging(errorInfo);

            // Show user-friendly notification
            this.showUserFriendlyError(context, error);

            // Attempt automatic recovery
            this.attemptRecovery(context, error);
        }

        /**
         * 📊 Rate-limited error logging
         */
        rateLimitedErrorLogging(errorInfo) {
            // Initialize rate limiting
            if (!this.errorLogRateLimit) {
                this.errorLogRateLimit = new Map();
            }

            const errorKey = `${errorInfo.context}_${errorInfo.message}`;
            const now = Date.now();
            const lastLogged = this.errorLogRateLimit.get(errorKey) || 0;

            // Only log same error once per minute
            if (now - lastLogged > 60000) {
                this.errorLogRateLimit.set(errorKey, now);
                this.sendErrorToBackend(errorInfo);

                // Clean up old entries
                this.cleanupErrorRateLimit();
            }
        }

        /**
         * 🧹 Clean up error rate limit map
         */
        cleanupErrorRateLimit() {
            if (!this.errorLogRateLimit) return;

            const now = Date.now();
            const maxAge = 300000; // 5 minutes

            for (const [key, timestamp] of this.errorLogRateLimit.entries()) {
                if (now - timestamp > maxAge) {
                    this.errorLogRateLimit.delete(key);
                }
            }
        }

        /**
         * 👤 Show user-friendly error messages
         */
        showUserFriendlyError(context, error) {
            let userMessage = '';
            let actionable = false;

            switch (context) {
                case 'css-application':
                    userMessage = 'Unable to apply visual changes. The page may need to be refreshed.';
                    actionable = true;
                    break;

                case 'ajax-save':
                    userMessage = 'Changes could not be saved. Please check your internet connection and try again.';
                    actionable = true;
                    break;

                case 'panel-creation':
                    userMessage = 'Unable to open settings panel. Please refresh the page and try again.';
                    actionable = true;
                    break;

                case 'sync-error':
                    userMessage = 'Cross-tab synchronization is temporarily unavailable.';
                    actionable = false;
                    break;

                default:
                    userMessage = 'A minor issue occurred with the admin styler. Functionality may be limited.';
                    actionable = false;
            }

            this.showUserNotification(userMessage, actionable ? 'warning' : 'info');
        }

        /**
         * 📢 Show user notification
         */
        showUserNotification(message, type = 'info', duration = 5000) {
            // Don't show notifications in debug mode (console is enough)
            if (this.debugMode) return;

            const notification = document.createElement('div');
            notification.className = `mas-user-notification mas-notification-${type}`;

            const colors = {
                info: { bg: '#e3f2fd', border: '#2196f3', text: '#1565c0' },
                warning: { bg: '#fff3e0', border: '#ff9800', text: '#ef6c00' },
                error: { bg: '#ffebee', border: '#f44336', text: '#c62828' },
                success: { bg: '#e8f5e9', border: '#4caf50', text: '#2e7d32' }
            };

            const color = colors[type] || colors.info;

            notification.innerHTML = `
                <div class="mas-notification-content">
                    <span class="mas-notification-icon">${this.getNotificationIcon(type)}</span>
                    <span class="mas-notification-message">${message}</span>
                    <button class="mas-notification-close" aria-label="Close notification">×</button>
                </div>
            `;

            Object.assign(notification.style, {
                position: 'fixed',
                top: '20px',
                right: '20px',
                backgroundColor: color.bg,
                border: `1px solid ${color.border}`,
                borderRadius: '4px',
                padding: '12px 16px',
                maxWidth: '350px',
                zIndex: '1000001',
                fontSize: '14px',
                color: color.text,
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                animation: 'slideInRight 0.3s ease-out'
            });

            // Add animation styles
            if (!document.getElementById('mas-notification-styles')) {
                const styles = document.createElement('style');
                styles.id = 'mas-notification-styles';
                styles.textContent = `
                    @keyframes slideInRight {
                        from { transform: translateX(100%); opacity: 0; }
                        to { transform: translateX(0); opacity: 1; }
                    }
                    @keyframes slideOutRight {
                        from { transform: translateX(0); opacity: 1; }
                        to { transform: translateX(100%); opacity: 0; }
                    }
                    .mas-notification-content {
                        display: flex;
                        align-items: center;
                        gap: 8px;
                    }
                    .mas-notification-close {
                        background: none;
                        border: none;
                        font-size: 18px;
                        cursor: pointer;
                        padding: 0;
                        margin-left: auto;
                        opacity: 0.7;
                    }
                    .mas-notification-close:hover {
                        opacity: 1;
                    }
                `;
                document.head.appendChild(styles);
            }

            document.body.appendChild(notification);

            // Close button functionality
            const closeBtn = notification.querySelector('.mas-notification-close');
            closeBtn.addEventListener('click', () => {
                this.removeNotification(notification);
            });

            // Auto-remove after duration
            if (duration > 0) {
                setTimeout(() => {
                    this.removeNotification(notification);
                }, duration);
            }
        }

        /**
         * 🎨 Get notification icon
         */
        getNotificationIcon(type) {
            const icons = {
                info: 'ℹ️',
                warning: '⚠️',
                error: '❌',
                success: '✅'
            };
            return icons[type] || icons.info;
        }

        /**
         * 🗑️ Remove notification
         */
        removeNotification(notification) {
            if (!notification.parentNode) return;

            notification.style.animation = 'slideOutRight 0.3s ease-in';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }

        /**
         * 🔧 Attempt automatic recovery
         */
        attemptRecovery(context, error) {
            switch (context) {
                case 'css-application':
                    this.recoverCSSApplication();
                    break;

                case 'ajax-save':
                    this.recoverAjaxSave();
                    break;

                case 'panel-creation':
                    this.recoverPanelCreation();
                    break;

                case 'sync-error':
                    this.recoverSyncError();
                    break;

                default:
                    this.performGeneralRecovery();
            }
        }

        /**
         * 🎨 Recover CSS application
         */
        recoverCSSApplication() {
            this.log('Attempting CSS application recovery...');

            // Try to reapply all active CSS variables
            this.activePanels.forEach(panel => {
                const controls = panel.querySelectorAll('[data-option-id]');
                controls.forEach(control => {
                    const cssVar = control.getAttribute('data-css-var');
                    if (cssVar) {
                        const value = control.type === 'checkbox' ? control.checked : control.value;
                        const unit = control.getAttribute('data-unit') || '';

                        this.safeExecute(() => {
                            this.applyCSSVariable(cssVar, value, unit);
                        }, 'css-recovery');
                    }
                });
            });
        }

        /**
         * 💾 Recover AJAX save functionality
         */
        recoverAjaxSave() {
            this.log('Attempting AJAX save recovery...');

            // Clear any pending saves and reset timers
            if (this.saveTimer) {
                Object.values(this.saveTimer).forEach(timer => clearTimeout(timer));
                this.saveTimer = {};
            }

            // Test AJAX connectivity
            this.testAjaxConnectivity();
        }

        /**
         * 🔗 Test AJAX connectivity
         */
        async testAjaxConnectivity() {
            try {
                const ajaxUrl = this.getAjaxUrl();
                const nonce = this.getAjaxNonce();

                if (!ajaxUrl || !nonce) {
                    throw new Error('AJAX configuration not available');
                }

                const response = await fetch(ajaxUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: new URLSearchParams({
                        action: 'mas_v2_database_check',
                        nonce: nonce
                    })
                });

                if (response.ok) {
                    this.log('AJAX connectivity test passed');
                    this.showUserNotification('Connection restored. You can continue making changes.', 'success', 3000);
                } else {
                    throw new Error(`HTTP ${response.status}`);
                }

            } catch (error) {
                this.log('AJAX connectivity test failed:', error.message);
            }
        }

        /**
         * 🎛️ Recover panel creation
         */
        recoverPanelCreation() {
            this.log('Attempting panel creation recovery...');

            // Clean up any broken panels
            const brokenPanels = document.querySelectorAll('.woow-micro-panel:not([data-element-id])');
            brokenPanels.forEach(panel => panel.remove());

            // Reset active panels map
            this.activePanels.clear();
        }

        /**
         * 🔄 Recover sync functionality
         */
        recoverSyncError() {
            this.log('Attempting sync recovery...');

            // Reset broadcast channel
            if (this.broadcastChannel) {
                this.broadcastChannel.close();
                this.broadcastChannel = null;
            }

            // Try to recreate broadcast channel
            setTimeout(() => {
                this.getBroadcastChannel();
            }, 1000);
        }

        /**
         * 🔧 Perform general recovery
         */
        performGeneralRecovery() {
            this.log('Performing general recovery...');

            // Clear any error states
            document.querySelectorAll('.woow-change-error').forEach(element => {
                element.classList.remove('woow-change-error');
                element.style.backgroundColor = '';
                element.style.borderColor = '';
            });

            // Reset error counters
            this.errorLogRateLimit = new Map();
        }

        /**
         * 🛡️ Graceful degradation for missing dependencies
         */
        checkDependencies() {
            const dependencies = {
                fetch: typeof fetch !== 'undefined',
                BroadcastChannel: typeof BroadcastChannel !== 'undefined',
                localStorage: this.testLocalStorage(),
                getComputedStyle: typeof getComputedStyle !== 'undefined',
                customEvents: typeof CustomEvent !== 'undefined'
            };

            const missing = Object.entries(dependencies)
                .filter(([name, available]) => !available)
                .map(([name]) => name);

            if (missing.length > 0) {
                this.log('Missing dependencies:', missing);
                this.setupFallbacks(missing);
            }

            return dependencies;
        }

        /**
         * 💾 Test localStorage availability
         */
        testLocalStorage() {
            try {
                const testKey = 'mas-test';
                localStorage.setItem(testKey, 'test');
                localStorage.removeItem(testKey);
                return true;
            } catch (error) {
                return false;
            }
        }

        /**
         * 🔄 Setup fallbacks for missing dependencies
         */
        setupFallbacks(missing) {
            missing.forEach(dependency => {
                switch (dependency) {
                    case 'fetch':
                        this.setupFetchFallback();
                        break;
                    case 'BroadcastChannel':
                        this.log('BroadcastChannel not available, using localStorage fallback');
                        break;
                    case 'localStorage':
                        this.log('localStorage not available, sync disabled');
                        break;
                    case 'customEvents':
                        this.setupCustomEventFallback();
                        break;
                }
            });
        }

        /**
         * 🔄 Setup fetch fallback using XMLHttpRequest
         */
        setupFetchFallback() {
            if (typeof XMLHttpRequest === 'undefined') {
                this.log('No AJAX support available');
                return;
            }

            // Create a simple fetch polyfill
            window.fetch = window.fetch || function (url, options) {
                return new Promise((resolve, reject) => {
                    const xhr = new XMLHttpRequest();
                    xhr.open(options.method || 'GET', url);

                    if (options.headers) {
                        Object.entries(options.headers).forEach(([key, value]) => {
                            xhr.setRequestHeader(key, value);
                        });
                    }

                    xhr.onload = () => {
                        resolve({
                            ok: xhr.status >= 200 && xhr.status < 300,
                            status: xhr.status,
                            json: () => Promise.resolve(JSON.parse(xhr.responseText))
                        });
                    };

                    xhr.onerror = () => reject(new Error('Network error'));
                    xhr.send(options.body);
                });
            };

            this.log('Fetch fallback setup complete');
        }

        /**
         * 🔄 Setup CustomEvent fallback
         */
        setupCustomEventFallback() {
            if (typeof Event === 'undefined') return;

            window.CustomEvent = window.CustomEvent || function (event, params) {
                params = params || { bubbles: false, cancelable: false, detail: undefined };
                const evt = document.createEvent('CustomEvent');
                evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);
                return evt;
            };

            this.log('CustomEvent fallback setup complete');
        }

        /**
         * 💾 Schedule save to backend (debounced)
         */
        scheduleSave(optionId, value) {
            if (!this.saveTimer) {
                this.saveTimer = {};
            }

            // Clear existing timer for this option
            if (this.saveTimer[optionId]) {
                clearTimeout(this.saveTimer[optionId]);
            }

            // Schedule new save
            this.saveTimer[optionId] = setTimeout(() => {
                this.saveToBackend(optionId, value);
                delete this.saveTimer[optionId];
            }, 1000); // 1 second debounce
        }

        /**
         * 💾 Save to backend via AJAX
         */
        async saveToBackend(optionId, value) {
            try {
                // Get AJAX URL and nonce from the correct localized objects
                const ajaxUrl = this.getAjaxUrl();
                const nonce = this.getAjaxNonce();

                if (!ajaxUrl) {
                    throw new Error('AJAX URL not available');
                }

                if (!nonce) {
                    throw new Error('Security nonce not available');
                }

                this.log(`Saving to backend: ${optionId} = ${value}`);
                this.log(`Using AJAX URL: ${ajaxUrl}`);
                this.log(`Using nonce: ${nonce.substring(0, 8)}...`);

                const response = await fetch(ajaxUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: new URLSearchParams({
                        action: 'mas_save_live_settings',
                        nonce: nonce,
                        option_id: optionId,
                        option_value: value
                    })
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                this.log('Backend response:', data);

                if (data.success) {
                    this.log(`Setting saved successfully: ${optionId} = ${value}`);

                    // Show success feedback
                    this.showSaveSuccess(optionId);
                } else {
                    const errorMessage = data.data?.message || data.message || 'Unknown error';
                    this.logError(`Save failed: ${errorMessage}`, data);

                    // Show error feedback
                    this.showSaveError(optionId, errorMessage);
                }
            } catch (error) {
                this.logError(`AJAX error for ${optionId}: ${error.message}`, error);

                // Show error feedback
                this.showSaveError(optionId, error.message);

                // Try to retry after a delay
                this.scheduleRetry(optionId, value);
            }
        }

        /**
         * 🔗 Get AJAX URL from available sources
         */
        getAjaxUrl() {
            // Try different possible sources for AJAX URL
            if (window.woowV2Global?.ajaxUrl) return window.woowV2Global.ajaxUrl;
            if (window.woowV2?.ajaxUrl) return window.woowV2.ajaxUrl;
            if (window.mas_ajax_object?.ajax_url) return window.mas_ajax_object.ajax_url;
            if (window.ajaxurl) return window.ajaxurl;

            // Fallback to WordPress standard
            return '/wp-admin/admin-ajax.php';
        }

        /**
         * 🔐 Get AJAX nonce from available sources
         */
        getAjaxNonce() {
            // Try unified nonce first (from security overhaul)
            if (window.mas_compatibility?.unified_nonce) return window.mas_compatibility.unified_nonce;

            // Try other possible sources
            if (window.woowV2Global?.nonce) return window.woowV2Global.nonce;
            if (window.woowV2?.nonce) return window.woowV2.nonce;
            if (window.mas_ajax_object?.nonce) return window.mas_ajax_object.nonce;
            if (window.masNonce) return window.masNonce;
            if (window.mas_nonce) return window.mas_nonce;

            this.logError('No valid nonce found in any of the expected locations');
            return null;
        }

        /**
         * ✅ Show save success feedback
         */
        showSaveSuccess(optionId) {
            // Find the control and show success indicator
            const control = document.querySelector(`[data-option-id="${optionId}"]`);
            if (control) {
                const wrapper = control.closest('.woow-control-wrapper');
                if (wrapper) {
                    wrapper.style.backgroundColor = '#d4edda';
                    wrapper.style.borderColor = '#c3e6cb';
                    setTimeout(() => {
                        wrapper.style.backgroundColor = '';
                        wrapper.style.borderColor = '';
                    }, 1000);
                }
            }
        }

        /**
         * ❌ Show save error feedback
         */
        showSaveError(optionId, errorMessage) {
            // Find the control and show error indicator
            const control = document.querySelector(`[data-option-id="${optionId}"]`);
            if (control) {
                const wrapper = control.closest('.woow-control-wrapper');
                if (wrapper) {
                    wrapper.style.backgroundColor = '#f8d7da';
                    wrapper.style.borderColor = '#f5c6cb';
                    wrapper.title = `Error: ${errorMessage}`;
                    setTimeout(() => {
                        wrapper.style.backgroundColor = '';
                        wrapper.style.borderColor = '';
                        wrapper.title = '';
                    }, 3000);
                }
            }

            // Also show a toast notification if available
            this.showToastError(`Failed to save ${optionId}: ${errorMessage}`);
        }

        /**
         * 🔄 Schedule retry for failed saves
         */
        scheduleRetry(optionId, value, attempt = 1) {
            if (attempt > 3) {
                this.logError(`Max retry attempts reached for ${optionId}`);
                return;
            }

            const delay = attempt * 2000; // Exponential backoff: 2s, 4s, 6s
            this.log(`Scheduling retry ${attempt} for ${optionId} in ${delay}ms`);

            setTimeout(() => {
                this.log(`Retrying save attempt ${attempt} for ${optionId}`);
                this.saveToBackendWithRetry(optionId, value, attempt + 1);
            }, delay);
        }

        /**
         * 🔄 Save with retry logic
         */
        async saveToBackendWithRetry(optionId, value, attempt = 1) {
            try {
                await this.saveToBackend(optionId, value);
            } catch (error) {
                if (attempt <= 3) {
                    this.scheduleRetry(optionId, value, attempt);
                }
            }
        }

        /**
         * 🍞 Show toast error notification
         */
        showToastError(message) {
            // Create a simple toast notification
            const toast = document.createElement('div');
            toast.className = 'woow-toast-error';
            toast.textContent = message;

            Object.assign(toast.style, {
                position: 'fixed',
                top: '20px',
                right: '20px',
                backgroundColor: '#dc3545',
                color: 'white',
                padding: '12px 16px',
                borderRadius: '4px',
                zIndex: '1000000',
                fontSize: '14px',
                maxWidth: '300px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
            });

            document.body.appendChild(toast);

            // Auto-remove after 5 seconds
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 5000);
        }

        /**
         * ✨ Show visual feedback for changes
         */
        showChangeIndicator(control) {
            const wrapper = control.closest('.woow-control-wrapper');
            if (wrapper) {
                wrapper.style.backgroundColor = '#e8f5e8';
                setTimeout(() => {
                    wrapper.style.backgroundColor = '';
                }, 300);
            }
        }

        /**
         * ❌ Close panel
         */
        closePanel(panel) {
            const elementId = panel.getAttribute('data-element-id');

            // Remove target indicator
            const targetElement = document.querySelector(this.panelConfigs.get(elementId)?.targetSelector);
            if (targetElement) {
                targetElement.classList.remove('woow-has-micro-panel');
                targetElement.removeAttribute('data-micro-panel-active');
                targetElement.style.outline = panel._originalTargetOutline || '';
            }

            // Remove panel
            panel.remove();

            // Remove from active panels
            this.activePanels.delete(elementId);

            this.log(`Panel closed: ${elementId}`);
        }

        /**
         * 🔧 Setup global event delegation
         */
        setupEventDelegation() {
            // Global click handler for creating panels
            document.addEventListener('click', (e) => {
                const target = e.target.closest('[data-woow-editable="true"], [data-mas-editable="true"]');
                if (target && e.ctrlKey) { // Ctrl+click to create panel
                    e.preventDefault();
                    const elementId = this.getElementId(target);
                    if (elementId) {
                        this.createPanel(elementId);
                    }
                }
            });

            // Escape key to close panels
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    this.closeAllPanels();
                }
            });
        }

        /**
         * 🆔 Get element ID for panel creation
         */
        getElementId(element) {
            if (element.id === 'wpadminbar') return 'wpadminbar';
            if (element.id === 'adminmenuwrap') return 'adminmenuwrap';

            // Add more element ID mappings as needed
            return null;
        }

        /**
         * ❌ Close all panels
         */
        closeAllPanels() {
            this.activePanels.forEach(panel => {
                this.closePanel(panel);
            });
        }

        /**
         * 📝 Logging utility
         */
        log(message, data = null) {
            if (this.debugMode) {
                console.log(`🎯 MicroPanelFactory: ${message}`, data);
            }
        }

        /**
         * ❌ Error logging utility
         */
        logError(message, error = null) {
            const errorData = {
                message: message,
                error: error,
                timestamp: new Date().toISOString(),
                component: 'MicroPanelFactory',
                url: window.location.href,
                userAgent: navigator.userAgent,
                stack: error?.stack || new Error().stack
            };

            // Log to console
            console.error(`🚨 MicroPanelFactory Error: ${message}`, error);

            // Send to backend error logging system
            this.sendErrorToBackend(errorData);
        }

        /**
         * 📤 Send error to backend logging system
         */
        async sendErrorToBackend(errorData) {
            try {
                const ajaxUrl = this.getAjaxUrl();
                const nonce = this.getAjaxNonce();

                if (!ajaxUrl || !nonce) {
                    console.warn('Cannot send error to backend: missing AJAX URL or nonce');
                    return;
                }

                await fetch(ajaxUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: new URLSearchParams({
                        action: 'mas_v2_log_error',
                        nonce: nonce,
                        error_data: JSON.stringify(errorData)
                    })
                });
            } catch (backendError) {
                console.warn('Failed to send error to backend:', backendError);
            }
        }

        /**
         * 🔍 Enhanced debugging with CSS variable validation
         */
        validateCSSVariableMapping(optionId, cssVar) {
            if (!cssVar) {
                this.logError(`Missing CSS variable mapping for option: ${optionId}`);
                return false;
            }

            // Check if CSS variable is actually applied
            const computedValue = getComputedStyle(document.documentElement).getPropertyValue(cssVar);

            if (this.debugMode) {
                this.log(`CSS Variable validation: ${cssVar} = "${computedValue}"`);
            }

            return true;
        }

        /**
         * 🔍 Validate control mapping
         */
        validateControlMapping(control) {
            const optionId = control.getAttribute('data-option-id');
            const cssVar = control.getAttribute('data-css-var');

            if (!optionId) {
                this.logError('Control missing data-option-id attribute', control);
                return false;
            }

            if (!cssVar) {
                this.logError(`Control ${optionId} missing data-css-var attribute`, control);
                return false;
            }

            return this.validateCSSVariableMapping(optionId, cssVar);
        }

        /**
         * 🔍 Debug panel state
         */
        debugPanelState(panel) {
            if (!this.debugMode) return;

            const elementId = panel.getAttribute('data-element-id');
            const controls = panel.querySelectorAll('[data-option-id]');

            this.log(`Panel Debug State for ${elementId}:`);
            this.log(`- Active panels: ${this.activePanels.size}`);
            this.log(`- Controls in panel: ${controls.length}`);

            controls.forEach(control => {
                const optionId = control.getAttribute('data-option-id');
                const cssVar = control.getAttribute('data-css-var');
                const value = control.type === 'checkbox' ? control.checked : control.value;

                this.log(`  - ${optionId}: ${value} -> ${cssVar}`);

                // Validate mapping
                this.validateControlMapping(control);
            });
        }

        /**
         * 🔍 Debug CSS variable application
         */
        debugCSSVariableApplication(cssVar, value, unit) {
            if (!this.debugMode) return;

            const beforeValue = getComputedStyle(document.documentElement).getPropertyValue(cssVar);

            // Apply the variable
            document.documentElement.style.setProperty(cssVar, value + unit);

            const afterValue = getComputedStyle(document.documentElement).getPropertyValue(cssVar);

            this.log(`CSS Variable Debug: ${cssVar}`);
            this.log(`  - Before: "${beforeValue}"`);
            this.log(`  - Applied: "${value + unit}"`);
            this.log(`  - After: "${afterValue}"`);

            if (beforeValue === afterValue && beforeValue !== value + unit) {
                this.logError(`CSS Variable not applied correctly: ${cssVar}`, {
                    expected: value + unit,
                    actual: afterValue
                });
            }
        }

        /**
         * 🛠️ Create debug panel
         */
        createDebugPanel() {
            if (!this.debugMode) return;

            // Remove existing debug panel
            const existingPanel = document.getElementById('mas-debug-panel');
            if (existingPanel) {
                existingPanel.remove();
            }

            const debugPanel = document.createElement('div');
            debugPanel.id = 'mas-debug-panel';
            debugPanel.innerHTML = `
                <div class="mas-debug-header">
                    <h3>🔧 MAS Debug Panel</h3>
                    <button id="mas-debug-close">×</button>
                </div>
                <div class="mas-debug-content">
                    <div class="mas-debug-section">
                        <h4>System Status</h4>
                        <div id="mas-debug-status"></div>
                    </div>
                    <div class="mas-debug-section">
                        <h4>Active Panels</h4>
                        <div id="mas-debug-panels"></div>
                    </div>
                    <div class="mas-debug-section">
                        <h4>CSS Variables</h4>
                        <div id="mas-debug-css-vars"></div>
                    </div>
                    <div class="mas-debug-section">
                        <h4>Actions</h4>
                        <button id="mas-debug-validate">Validate All Mappings</button>
                        <button id="mas-debug-test">Test All Controls</button>
                        <button id="mas-debug-clear">Clear Logs</button>
                    </div>
                    <div class="mas-debug-section">
                        <h4>Console Logs</h4>
                        <div id="mas-debug-logs"></div>
                    </div>
                </div>
            `;

            // Style the debug panel
            Object.assign(debugPanel.style, {
                position: 'fixed',
                top: '50px',
                right: '20px',
                width: '400px',
                maxHeight: '80vh',
                backgroundColor: '#1e1e1e',
                color: '#ffffff',
                border: '1px solid #444',
                borderRadius: '8px',
                zIndex: '1000000',
                fontFamily: 'monospace',
                fontSize: '12px',
                overflow: 'hidden',
                boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
            });

            // Style debug sections
            debugPanel.querySelectorAll('.mas-debug-section').forEach(section => {
                Object.assign(section.style, {
                    padding: '10px',
                    borderBottom: '1px solid #333'
                });
            });

            // Style debug header
            const header = debugPanel.querySelector('.mas-debug-header');
            Object.assign(header.style, {
                padding: '10px',
                backgroundColor: '#333',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            });

            // Style debug content
            const content = debugPanel.querySelector('.mas-debug-content');
            Object.assign(content.style, {
                maxHeight: '60vh',
                overflowY: 'auto'
            });

            document.body.appendChild(debugPanel);

            // Bind debug panel events
            this.bindDebugPanelEvents(debugPanel);

            // Update debug panel content
            this.updateDebugPanel();

            this.log('Debug panel created');
        }

        /**
         * 🎯 Bind debug panel events
         */
        bindDebugPanelEvents(debugPanel) {
            // Close button
            debugPanel.querySelector('#mas-debug-close').addEventListener('click', () => {
                debugPanel.remove();
            });

            // Validate all mappings
            debugPanel.querySelector('#mas-debug-validate').addEventListener('click', () => {
                this.validateAllMappings();
            });

            // Test all controls
            debugPanel.querySelector('#mas-debug-test').addEventListener('click', () => {
                this.testAllControls();
            });

            // Clear logs
            debugPanel.querySelector('#mas-debug-clear').addEventListener('click', () => {
                this.clearDebugLogs();
            });
        }

        /**
         * 🔄 Update debug panel content
         */
        updateDebugPanel() {
            const debugPanel = document.getElementById('mas-debug-panel');
            if (!debugPanel) return;

            // Update system status
            const statusDiv = debugPanel.querySelector('#mas-debug-status');
            statusDiv.innerHTML = `
                <div>Active Panels: ${this.activePanels.size}</div>
                <div>Configurations: ${this.panelConfigs.size}</div>
                <div>Debug Mode: ${this.debugMode ? 'ON' : 'OFF'}</div>
                <div>AJAX URL: ${this.getAjaxUrl() || 'NOT FOUND'}</div>
                <div>Nonce: ${this.getAjaxNonce() ? 'AVAILABLE' : 'NOT FOUND'}</div>
            `;

            // Update active panels
            const panelsDiv = debugPanel.querySelector('#mas-debug-panels');
            let panelsHtml = '';
            this.activePanels.forEach((panel, elementId) => {
                const controlCount = panel.querySelectorAll('[data-option-id]').length;
                panelsHtml += `<div>${elementId}: ${controlCount} controls</div>`;
            });
            panelsDiv.innerHTML = panelsHtml || '<div>No active panels</div>';

            // Update CSS variables
            this.updateDebugCSSVariables();
        }

        /**
         * 🎨 Update debug CSS variables display
         */
        updateDebugCSSVariables() {
            const debugPanel = document.getElementById('mas-debug-panel');
            if (!debugPanel) return;

            const cssVarsDiv = debugPanel.querySelector('#mas-debug-css-vars');
            let cssVarsHtml = '';

            // Get all CSS variables from active controls
            const allControls = document.querySelectorAll('[data-css-var]');
            const cssVars = new Set();

            allControls.forEach(control => {
                const cssVar = control.getAttribute('data-css-var');
                if (cssVar) cssVars.add(cssVar);
            });

            cssVars.forEach(cssVar => {
                const value = getComputedStyle(document.documentElement).getPropertyValue(cssVar);
                cssVarsHtml += `<div>${cssVar}: "${value.trim()}"</div>`;
            });

            cssVarsDiv.innerHTML = cssVarsHtml || '<div>No CSS variables found</div>';
        }

        /**
         * ✅ Validate all mappings
         */
        validateAllMappings() {
            this.log('🔍 Starting validation of all mappings...');

            let totalControls = 0;
            let validControls = 0;
            let errors = [];

            // Validate all active panels
            this.activePanels.forEach((panel, elementId) => {
                this.log(`Validating panel: ${elementId}`);

                const controls = panel.querySelectorAll('[data-option-id]');
                controls.forEach(control => {
                    totalControls++;

                    const optionId = control.getAttribute('data-option-id');
                    const cssVar = control.getAttribute('data-css-var');

                    if (this.validateControlMapping(control)) {
                        validControls++;
                    } else {
                        errors.push(`${elementId}.${optionId}: Invalid mapping`);
                    }
                });
            });

            // Report results
            const report = {
                total: totalControls,
                valid: validControls,
                invalid: totalControls - validControls,
                errors: errors
            };

            this.log('🔍 Validation complete:', report);

            if (errors.length > 0) {
                this.logError('Validation errors found:', errors);
            }

            // Update debug panel
            this.updateDebugPanel();

            return report;
        }

        /**
         * 🧪 Test all controls
         */
        testAllControls() {
            this.log('🧪 Starting test of all controls...');

            let testResults = [];

            this.activePanels.forEach((panel, elementId) => {
                const controls = panel.querySelectorAll('[data-option-id]');

                controls.forEach(control => {
                    const optionId = control.getAttribute('data-option-id');
                    const cssVar = control.getAttribute('data-css-var');

                    this.log(`Testing control: ${elementId}.${optionId}`);

                    // Test CSS variable application
                    if (cssVar) {
                        const testValue = this.getTestValue(control);
                        const beforeValue = getComputedStyle(document.documentElement).getPropertyValue(cssVar);

                        // Apply test value
                        const success = this.applyCSSVariable(cssVar, testValue, control.getAttribute('data-unit') || '');

                        const afterValue = getComputedStyle(document.documentElement).getPropertyValue(cssVar);

                        testResults.push({
                            elementId,
                            optionId,
                            cssVar,
                            testValue,
                            beforeValue: beforeValue.trim(),
                            afterValue: afterValue.trim(),
                            success
                        });

                        // Restore original value
                        if (control.type === 'checkbox') {
                            this.applyCSSVariable(cssVar, control.checked, control.getAttribute('data-unit') || '');
                        } else {
                            this.applyCSSVariable(cssVar, control.value, control.getAttribute('data-unit') || '');
                        }
                    }
                });
            });

            this.log('🧪 Control testing complete:', testResults);

            // Update debug panel
            this.updateDebugPanel();

            return testResults;
        }

        /**
         * 🎯 Get test value for control
         */
        getTestValue(control) {
            switch (control.type) {
                case 'color':
                    return '#ff0000';
                case 'range':
                    return Math.floor((parseInt(control.min) + parseInt(control.max)) / 2);
                case 'checkbox':
                    return !control.checked;
                default:
                    return 'test-value';
            }
        }

        /**
         * 🗑️ Clear debug logs
         */
        clearDebugLogs() {
            const debugPanel = document.getElementById('mas-debug-panel');
            if (!debugPanel) return;

            const logsDiv = debugPanel.querySelector('#mas-debug-logs');
            logsDiv.innerHTML = '<div>Logs cleared</div>';

            this.log('Debug logs cleared');
        }

        /**
         * 🔧 Enable debug mode
         */
        static enableDebugMode() {
            window.masV2Debug = true;

            if (window.microPanelFactoryInstance) {
                window.microPanelFactoryInstance.debugMode = true;
                window.microPanelFactoryInstance.createDebugPanel();
            }

            console.log('🔧 MAS Debug Mode Enabled');
        }

        /**
         * 🔧 Disable debug mode
         */
        static disableDebugMode() {
            window.masV2Debug = false;

            if (window.microPanelFactoryInstance) {
                window.microPanelFactoryInstance.debugMode = false;
            }

            const debugPanel = document.getElementById('mas-debug-panel');
            if (debugPanel) {
                debugPanel.remove();
            }

            console.log('🔧 MAS Debug Mode Disabled');
        }
    }

    // Make MicroPanelFactory globally available
    window.MicroPanelFactory = MicroPanelFactory;

    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            // Initialize factory instance
            window.microPanelFactoryInstance = new MicroPanelFactory();
        });
    } else {
        // Initialize immediately if DOM is already ready
        window.microPanelFactoryInstance = new MicroPanelFactory();
    }

})(window, document);