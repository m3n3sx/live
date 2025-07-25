/**
 * 🎨 CSS Variables Engine - Next-Generation CSS Custom Properties System
 * 
 * Complete redesign of CSS variables architecture with:
 * - W3C CSS Custom Properties compliance
 * - Real-time application with <50ms performance
 * - Cross-browser compatibility (Chrome, Firefox, Safari, Edge)
 * - Centralized mapping with fallback values
 * - Advanced validation and error handling
 * - Performance monitoring and optimization
 * 
 * @package ModernAdminStyler
 * @version 2.0.0 - Complete Architecture Redesign
 * @author Kiro AI Assistant
 */

(function(window, document) {
    'use strict';

    /**
     * 🚀 CSSVariablesEngine - Core Engine Class
     */
    class CSSVariablesEngine {
        constructor(options = {}) {
            // Configuration
            this.config = {
                performanceTarget: 50, // Target <50ms per change
                enableFallbacks: true,
                enableValidation: true,
                enablePerformanceMonitoring: true,
                enableCrossBrowserSupport: true,
                debugMode: options.debug || window.masV2Debug || false,
                ...options
            };

            // Core systems
            this.variableRegistry = new Map();
            this.mappingRegistry = new Map();
            this.fallbackRegistry = new Map();
            this.performanceMonitor = new PerformanceMonitor();
            this.validator = new CSSVariableValidator();
            this.browserSupport = new BrowserCompatibilityManager();
            
            // State management
            this.isInitialized = false;
            this.pendingUpdates = new Set();
            this.updateQueue = [];
            this.batchUpdateTimer = null;

            this.initialize();
        }

        /**
         * 🔧 Initialize the CSS Variables Engine
         */
        async initialize() {
            try {
                this.log('🚀 Initializing CSS Variables Engine...');
                
                // Check browser support
                await this.browserSupport.initialize();
                
                // Initialize core registries
                this.initializeVariableRegistry();
                this.initializeMappingRegistry();
                this.initializeFallbackRegistry();
                
                // Setup performance monitoring
                if (this.config.enablePerformanceMonitoring) {
                    this.performanceMonitor.initialize();
                }
                
                // Setup batch update system
                this.setupBatchUpdateSystem();
                
                // Apply initial CSS architecture
                this.applyInitialArchitecture();
                
                this.isInitialized = true;
                this.log('✅ CSS Variables Engine initialized successfully');
                
                // Trigger initialization event
                this.dispatchEvent('css-engine:initialized', {
                    engine: this,
                    performance: this.performanceMonitor.getStats()
                });
                
            } catch (error) {
                this.logError('❌ Failed to initialize CSS Variables Engine:', error);
                throw error;
            }
        }

        /**
         * 🗺️ Initialize Variable Registry with W3C compliant definitions
         */
        initializeVariableRegistry() {
            const variables = {
                // ========================================
                // 🎯 SURFACE SYSTEM (Admin Bar, Menu, etc.)
                // ========================================
                '--woow-surface-bar': {
                    category: 'surface',
                    type: 'color',
                    default: '#23282d',
                    fallback: '#333333',
                    description: 'Admin bar background color'
                },
                '--woow-surface-bar-text': {
                    category: 'surface',
                    type: 'color',
                    default: '#ffffff',
                    fallback: '#ffffff',
                    description: 'Admin bar text color'
                },
                '--woow-surface-bar-height': {
                    category: 'surface',
                    type: 'dimension',
                    unit: 'px',
                    default: '32',
                    fallback: '32',
                    min: 24,
                    max: 60,
                    description: 'Admin bar height'
                },
                '--woow-surface-bar-hover': {
                    category: 'surface',
                    type: 'color',
                    default: '#0073aa',
                    fallback: '#0073aa',
                    description: 'Admin bar hover color'
                },
                '--woow-surface-bar-floating': {
                    category: 'surface',
                    type: 'boolean',
                    default: '0',
                    fallback: '0',
                    description: 'Admin bar floating mode'
                },
                '--woow-surface-bar-blur': {
                    category: 'surface',
                    type: 'dimension',
                    unit: 'px',
                    default: '10',
                    fallback: '0',
                    min: 0,
                    max: 50,
                    description: 'Admin bar backdrop blur'
                },

                // Menu System
                '--woow-surface-menu': {
                    category: 'surface',
                    type: 'color',
                    default: '#23282d',
                    fallback: '#333333',
                    description: 'Admin menu background'
                },
                '--woow-surface-menu-text': {
                    category: 'surface',
                    type: 'color',
                    default: '#ffffff',
                    fallback: '#ffffff',
                    description: 'Admin menu text color'
                },
                '--woow-surface-menu-width': {
                    category: 'surface',
                    type: 'dimension',
                    unit: 'px',
                    default: '160',
                    fallback: '160',
                    min: 120,
                    max: 300,
                    description: 'Admin menu width'
                },
                '--woow-surface-menu-hover': {
                    category: 'surface',
                    type: 'color',
                    default: '#0073aa',
                    fallback: '#0073aa',
                    description: 'Menu item hover color'
                },
                '--woow-surface-menu-floating': {
                    category: 'surface',
                    type: 'boolean',
                    default: '0',
                    fallback: '0',
                    description: 'Menu floating mode'
                },

                // ========================================
                // 🎨 ACCENT SYSTEM (Primary, Secondary, etc.)
                // ========================================
                '--woow-accent-primary': {
                    category: 'accent',
                    type: 'color',
                    default: '#0073aa',
                    fallback: '#0073aa',
                    description: 'Primary accent color'
                },
                '--woow-accent-secondary': {
                    category: 'accent',
                    type: 'color',
                    default: '#00a32a',
                    fallback: '#00a32a',
                    description: 'Secondary accent color'
                },
                '--woow-accent-success': {
                    category: 'accent',
                    type: 'color',
                    default: '#00a32a',
                    fallback: '#00a32a',
                    description: 'Success state color'
                },
                '--woow-accent-warning': {
                    category: 'accent',
                    type: 'color',
                    default: '#dba617',
                    fallback: '#dba617',
                    description: 'Warning state color'
                },
                '--woow-accent-error': {
                    category: 'accent',
                    type: 'color',
                    default: '#d63638',
                    fallback: '#d63638',
                    description: 'Error state color'
                },

                // ========================================
                // 📝 TEXT SYSTEM (Typography)
                // ========================================
                '--woow-text-primary': {
                    category: 'text',
                    type: 'color',
                    default: '#1e293b',
                    fallback: '#333333',
                    description: 'Primary text color'
                },
                '--woow-text-secondary': {
                    category: 'text',
                    type: 'color',
                    default: '#64748b',
                    fallback: '#666666',
                    description: 'Secondary text color'
                },
                '--woow-text-inverse': {
                    category: 'text',
                    type: 'color',
                    default: '#ffffff',
                    fallback: '#ffffff',
                    description: 'Inverse text color'
                },

                // ========================================
                // 🏠 BACKGROUND SYSTEM
                // ========================================
                '--woow-bg-primary': {
                    category: 'background',
                    type: 'color',
                    default: '#ffffff',
                    fallback: '#ffffff',
                    description: 'Primary background color'
                },
                '--woow-bg-secondary': {
                    category: 'background',
                    type: 'color',
                    default: '#f8fafc',
                    fallback: '#f8f8f8',
                    description: 'Secondary background color'
                },

                // ========================================
                // 📐 SPACING SYSTEM
                // ========================================
                '--woow-space-xs': {
                    category: 'spacing',
                    type: 'dimension',
                    unit: 'rem',
                    default: '0.25',
                    fallback: '0.25',
                    description: 'Extra small spacing'
                },
                '--woow-space-sm': {
                    category: 'spacing',
                    type: 'dimension',
                    unit: 'rem',
                    default: '0.5',
                    fallback: '0.5',
                    description: 'Small spacing'
                },
                '--woow-space-md': {
                    category: 'spacing',
                    type: 'dimension',
                    unit: 'rem',
                    default: '1',
                    fallback: '1',
                    description: 'Medium spacing'
                },
                '--woow-space-lg': {
                    category: 'spacing',
                    type: 'dimension',
                    unit: 'rem',
                    default: '1.5',
                    fallback: '1.5',
                    description: 'Large spacing'
                },

                // ========================================
                // 🔘 RADIUS SYSTEM
                // ========================================
                '--woow-radius-sm': {
                    category: 'radius',
                    type: 'dimension',
                    unit: 'px',
                    default: '4',
                    fallback: '4',
                    description: 'Small border radius'
                },
                '--woow-radius-md': {
                    category: 'radius',
                    type: 'dimension',
                    unit: 'px',
                    default: '8',
                    fallback: '8',
                    description: 'Medium border radius'
                },
                '--woow-radius-lg': {
                    category: 'radius',
                    type: 'dimension',
                    unit: 'px',
                    default: '12',
                    fallback: '12',
                    description: 'Large border radius'
                },

                // ========================================
                // 🎭 EFFECTS SYSTEM
                // ========================================
                '--woow-shadow-sm': {
                    category: 'effects',
                    type: 'shadow',
                    default: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                    fallback: '0 1px 2px rgba(0, 0, 0, 0.1)',
                    description: 'Small shadow'
                },
                '--woow-shadow-md': {
                    category: 'effects',
                    type: 'shadow',
                    default: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    fallback: '0 4px 6px rgba(0, 0, 0, 0.1)',
                    description: 'Medium shadow'
                },
                '--woow-transition-fast': {
                    category: 'effects',
                    type: 'transition',
                    default: '150ms ease-in-out',
                    fallback: '0.15s ease',
                    description: 'Fast transition'
                },
                '--woow-transition-normal': {
                    category: 'effects',
                    type: 'transition',
                    default: '300ms ease-in-out',
                    fallback: '0.3s ease',
                    description: 'Normal transition'
                }
            };

            // Register all variables
            Object.entries(variables).forEach(([name, config]) => {
                this.variableRegistry.set(name, config);
            });

            this.log(`📋 Registered ${this.variableRegistry.size} CSS variables`);
        }

        /**
         * 🗺️ Initialize Mapping Registry (Option ID → CSS Variable)
         */
        initializeMappingRegistry() {
            const mappings = {
                // Admin Bar Mappings
                'admin_bar_background': '--woow-surface-bar',
                'wpadminbar_bg_color': '--woow-surface-bar',
                'admin_bar_text_color': '--woow-surface-bar-text',
                'wpadminbar_text_color': '--woow-surface-bar-text',
                'admin_bar_height': '--woow-surface-bar-height',
                'wpadminbar_height': '--woow-surface-bar-height',
                'admin_bar_hover_color': '--woow-surface-bar-hover',
                'admin_bar_floating': '--woow-surface-bar-floating',
                'wpadminbar_floating': '--woow-surface-bar-floating',

                // Menu Mappings
                'menu_background': '--woow-surface-menu',
                'menu_text_color': '--woow-surface-menu-text',
                'menu_width': '--woow-surface-menu-width',
                'menu_hover_color': '--woow-surface-menu-hover',
                'menu_floating': '--woow-surface-menu-floating',

                // Color System
                'primary_color': '--woow-accent-primary',
                'secondary_color': '--woow-accent-secondary',
                'success_color': '--woow-accent-success',
                'warning_color': '--woow-accent-warning',
                'error_color': '--woow-accent-error',

                // Typography
                'content_text_color': '--woow-text-primary',
                'content_background': '--woow-bg-primary'
            };

            Object.entries(mappings).forEach(([optionId, cssVar]) => {
                this.mappingRegistry.set(optionId, cssVar);
            });

            this.log(`🗺️ Registered ${this.mappingRegistry.size} option mappings`);
        }

        /**
         * 🛡️ Initialize Fallback Registry for unsupported browsers
         */
        initializeFallbackRegistry() {
            // Legacy browser fallbacks
            const fallbacks = {
                '--woow-surface-bar': {
                    property: 'background-color',
                    selector: '#wpadminbar'
                },
                '--woow-surface-bar-text': {
                    property: 'color',
                    selector: '#wpadminbar, #wpadminbar a'
                },
                '--woow-surface-menu': {
                    property: 'background-color',
                    selector: '#adminmenuwrap'
                },
                '--woow-surface-menu-text': {
                    property: 'color',
                    selector: '#adminmenu a'
                }
            };

            Object.entries(fallbacks).forEach(([cssVar, config]) => {
                this.fallbackRegistry.set(cssVar, config);
            });

            this.log(`🛡️ Registered ${this.fallbackRegistry.size} fallback mappings`);
        }

        /**
         * 🎨 Apply CSS variable with comprehensive error handling and performance monitoring
         */
        async applyVariable(optionId, value, options = {}) {
            const startTime = performance.now();
            
            try {
                // Get CSS variable from mapping
                const cssVar = this.mappingRegistry.get(optionId);
                if (!cssVar) {
                    throw new Error(`No CSS variable mapping found for option: ${optionId}`);
                }

                // Get variable configuration
                const varConfig = this.variableRegistry.get(cssVar);
                if (!varConfig) {
                    throw new Error(`CSS variable not registered: ${cssVar}`);
                }

                // Validate value
                if (this.config.enableValidation) {
                    const validation = this.validator.validate(value, varConfig);
                    if (!validation.isValid) {
                        throw new Error(`Validation failed: ${validation.error}`);
                    }
                    value = validation.sanitizedValue;
                }

                // Transform value with unit if needed
                const cssValue = this.transformValue(value, varConfig);

                // Apply CSS variable
                const success = await this.setCSSProperty(cssVar, cssValue, varConfig);

                // Record performance
                const duration = performance.now() - startTime;
                this.performanceMonitor.recordUpdate(cssVar, duration, success);

                if (success) {
                    this.log(`✅ Applied ${cssVar}: ${cssValue} (${duration.toFixed(2)}ms)`);
                    
                    // Trigger change event
                    this.dispatchEvent('css-variable:changed', {
                        optionId,
                        cssVar,
                        value: cssValue,
                        duration
                    });
                } else {
                    throw new Error('Failed to apply CSS property');
                }

                return success;

            } catch (error) {
                const duration = performance.now() - startTime;
                this.performanceMonitor.recordUpdate(optionId, duration, false);
                this.logError(`❌ Failed to apply ${optionId}:`, error);
                return false;
            }
        }

        /**
         * 🎯 Set CSS property with cross-browser support and fallbacks
         */
        async setCSSProperty(cssVar, value, varConfig) {
            try {
                // Primary method: CSS Custom Properties
                if (this.browserSupport.supportsCustomProperties()) {
                    document.documentElement.style.setProperty(cssVar, value);
                    
                    // Verify application
                    const appliedValue = getComputedStyle(document.documentElement)
                        .getPropertyValue(cssVar).trim();
                    
                    if (appliedValue === value.toString().trim()) {
                        return true;
                    }
                }

                // Fallback method: Direct CSS application
                if (this.config.enableFallbacks) {
                    return this.applyFallbackCSS(cssVar, value);
                }

                return false;

            } catch (error) {
                this.logError('Failed to set CSS property:', error);
                return false;
            }
        }

        /**
         * 🛡️ Apply fallback CSS for unsupported browsers
         */
        applyFallbackCSS(cssVar, value) {
            try {
                const fallback = this.fallbackRegistry.get(cssVar);
                if (!fallback) {
                    return false;
                }

                // Create or update fallback style element
                let styleElement = document.querySelector(`style[data-css-var="${cssVar}"]`);
                if (!styleElement) {
                    styleElement = document.createElement('style');
                    styleElement.setAttribute('data-css-var', cssVar);
                    document.head.appendChild(styleElement);
                }

                // Apply CSS rule
                styleElement.textContent = `
                    ${fallback.selector} {
                        ${fallback.property}: ${value} !important;
                    }
                `;

                this.log(`🛡️ Applied fallback CSS: ${cssVar} → ${fallback.selector}`);
                return true;

            } catch (error) {
                this.logError('Failed to apply fallback CSS:', error);
                return false;
            }
        }

        /**
         * 🔄 Transform value based on variable configuration
         */
        transformValue(value, varConfig) {
            switch (varConfig.type) {
                case 'color':
                    return this.validator.sanitizeColor(value);
                
                case 'dimension':
                    const numValue = parseFloat(value);
                    return varConfig.unit ? `${numValue}${varConfig.unit}` : numValue.toString();
                
                case 'boolean':
                    return value ? '1' : '0';
                
                case 'shadow':
                case 'transition':
                default:
                    return value.toString();
            }
        }

        /**
         * 📦 Batch update multiple variables for optimal performance
         */
        async batchUpdate(updates) {
            const startTime = performance.now();
            const results = [];

            try {
                // Process all updates
                const promises = updates.map(({ optionId, value, options }) => 
                    this.applyVariable(optionId, value, options)
                );

                const outcomes = await Promise.allSettled(promises);
                
                outcomes.forEach((outcome, index) => {
                    results.push({
                        optionId: updates[index].optionId,
                        success: outcome.status === 'fulfilled' && outcome.value,
                        error: outcome.status === 'rejected' ? outcome.reason : null
                    });
                });

                const duration = performance.now() - startTime;
                const successCount = results.filter(r => r.success).length;

                this.log(`📦 Batch update completed: ${successCount}/${updates.length} successful (${duration.toFixed(2)}ms)`);

                return {
                    success: successCount === updates.length,
                    results,
                    duration,
                    successCount,
                    totalCount: updates.length
                };

            } catch (error) {
                this.logError('Batch update failed:', error);
                return {
                    success: false,
                    error: error.message,
                    results
                };
            }
        }

        /**
         * ⚡ Setup batch update system for performance optimization
         */
        setupBatchUpdateSystem() {
            this.batchUpdateDelay = 16; // ~60fps
            
            // Debounced batch processor
            this.processBatchUpdates = this.debounce(() => {
                if (this.updateQueue.length > 0) {
                    const updates = [...this.updateQueue];
                    this.updateQueue = [];
                    this.batchUpdate(updates);
                }
            }, this.batchUpdateDelay);
        }

        /**
         * 🎨 Apply initial CSS architecture
         */
        applyInitialArchitecture() {
            // Create base CSS architecture
            const baseCSS = this.generateBaseCSS();
            
            // Apply base styles
            let styleElement = document.querySelector('#woow-css-variables-base');
            if (!styleElement) {
                styleElement = document.createElement('style');
                styleElement.id = 'woow-css-variables-base';
                document.head.appendChild(styleElement);
            }
            
            styleElement.textContent = baseCSS;
            this.log('🎨 Applied initial CSS architecture');
        }

        /**
         * 🏗️ Generate base CSS with all variables and fallbacks
         */
        generateBaseCSS() {
            let css = ':root {\n';
            
            // Add all CSS variables with default values
            this.variableRegistry.forEach((config, cssVar) => {
                const value = this.transformValue(config.default, config);
                css += `  ${cssVar}: ${value};\n`;
            });
            
            css += '}\n\n';
            
            // Add fallback styles for older browsers
            if (this.config.enableFallbacks) {
                css += this.generateFallbackCSS();
            }
            
            return css;
        }

        /**
         * 🛡️ Generate fallback CSS for older browsers
         */
        generateFallbackCSS() {
            let css = '/* Fallback styles for older browsers */\n';
            
            this.fallbackRegistry.forEach((fallback, cssVar) => {
                const varConfig = this.variableRegistry.get(cssVar);
                if (varConfig) {
                    const value = this.transformValue(varConfig.fallback, varConfig);
                    css += `${fallback.selector} {\n`;
                    css += `  ${fallback.property}: ${value};\n`;
                    css += '}\n';
                }
            });
            
            return css;
        }

        /**
         * 📊 Get performance statistics
         */
        getPerformanceStats() {
            return this.performanceMonitor.getStats();
        }

        /**
         * 🧪 Test all CSS variables
         */
        async testAllVariables() {
            const results = {
                total: this.variableRegistry.size,
                passed: 0,
                failed: 0,
                errors: []
            };

            for (const [cssVar, config] of this.variableRegistry) {
                try {
                    const testValue = this.getTestValue(config.type);
                    const success = await this.setCSSProperty(cssVar, testValue, config);
                    
                    if (success) {
                        results.passed++;
                    } else {
                        results.failed++;
                        results.errors.push(`${cssVar}: Failed to apply test value`);
                    }
                } catch (error) {
                    results.failed++;
                    results.errors.push(`${cssVar}: ${error.message}`);
                }
            }

            this.log('🧪 CSS Variables test results:', results);
            return results;
        }

        /**
         * 🎯 Get test value for variable type
         */
        getTestValue(type) {
            switch (type) {
                case 'color': return '#ff0000';
                case 'dimension': return '42';
                case 'boolean': return true;
                case 'shadow': return '0 2px 4px rgba(0,0,0,0.1)';
                case 'transition': return '300ms ease';
                default: return 'test-value';
            }
        }

        /**
         * 🔧 Utility methods
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

        dispatchEvent(eventName, detail) {
            const event = new CustomEvent(eventName, { detail });
            document.dispatchEvent(event);
        }

        log(message, ...args) {
            if (this.config.debugMode) {
                console.log(`🎨 CSSEngine: ${message}`, ...args);
            }
        }

        logError(message, ...args) {
            console.error(`❌ CSSEngine: ${message}`, ...args);
        }
    }

    /**
     * 📊 Performance Monitor Class
     */
    class PerformanceMonitor {
        constructor() {
            this.updates = [];
            this.stats = {
                totalUpdates: 0,
                successfulUpdates: 0,
                failedUpdates: 0,
                averageDuration: 0,
                maxDuration: 0,
                minDuration: Infinity
            };
        }

        initialize() {
            this.startTime = performance.now();
        }

        recordUpdate(variable, duration, success) {
            this.updates.push({
                variable,
                duration,
                success,
                timestamp: performance.now()
            });

            this.updateStats(duration, success);
        }

        updateStats(duration, success) {
            this.stats.totalUpdates++;
            
            if (success) {
                this.stats.successfulUpdates++;
            } else {
                this.stats.failedUpdates++;
            }

            this.stats.maxDuration = Math.max(this.stats.maxDuration, duration);
            this.stats.minDuration = Math.min(this.stats.minDuration, duration);
            
            // Calculate average duration
            const totalDuration = this.updates.reduce((sum, update) => sum + update.duration, 0);
            this.stats.averageDuration = totalDuration / this.updates.length;
        }

        getStats() {
            return {
                ...this.stats,
                successRate: this.stats.totalUpdates > 0 ? 
                    (this.stats.successfulUpdates / this.stats.totalUpdates) * 100 : 0,
                recentUpdates: this.updates.slice(-10)
            };
        }
    }

    /**
     * ✅ CSS Variable Validator Class
     */
    class CSSVariableValidator {
        validate(value, varConfig) {
            try {
                switch (varConfig.type) {
                    case 'color':
                        return this.validateColor(value);
                    case 'dimension':
                        return this.validateDimension(value, varConfig);
                    case 'boolean':
                        return this.validateBoolean(value);
                    default:
                        return { isValid: true, sanitizedValue: value };
                }
            } catch (error) {
                return { isValid: false, error: error.message };
            }
        }

        validateColor(value) {
            const colorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
            if (colorRegex.test(value)) {
                return { isValid: true, sanitizedValue: value };
            }
            
            // Try to parse other color formats
            const sanitized = this.sanitizeColor(value);
            if (sanitized) {
                return { isValid: true, sanitizedValue: sanitized };
            }
            
            throw new Error(`Invalid color format: ${value}`);
        }

        validateDimension(value, varConfig) {
            const numValue = parseFloat(value);
            if (isNaN(numValue)) {
                throw new Error(`Invalid numeric value: ${value}`);
            }

            if (varConfig.min !== undefined && numValue < varConfig.min) {
                throw new Error(`Value ${numValue} is below minimum ${varConfig.min}`);
            }

            if (varConfig.max !== undefined && numValue > varConfig.max) {
                throw new Error(`Value ${numValue} is above maximum ${varConfig.max}`);
            }

            return { isValid: true, sanitizedValue: numValue.toString() };
        }

        validateBoolean(value) {
            const boolValue = Boolean(value);
            return { isValid: true, sanitizedValue: boolValue };
        }

        sanitizeColor(color) {
            // Create a temporary element to test color validity
            const tempElement = document.createElement('div');
            tempElement.style.color = color;
            
            if (tempElement.style.color) {
                return color;
            }
            
            return null;
        }
    }

    /**
     * 🌐 Browser Compatibility Manager Class
     */
    class BrowserCompatibilityManager {
        constructor() {
            this.support = {
                customProperties: false,
                cssVariables: false,
                modernCSS: false
            };
        }

        async initialize() {
            this.checkCustomPropertiesSupport();
            this.checkModernCSSSupport();
        }

        checkCustomPropertiesSupport() {
            try {
                // Test CSS Custom Properties support
                const testElement = document.createElement('div');
                testElement.style.setProperty('--test-var', 'test');
                const testValue = testElement.style.getPropertyValue('--test-var');
                
                this.support.customProperties = testValue === 'test';
                this.support.cssVariables = this.support.customProperties;
                
            } catch (error) {
                this.support.customProperties = false;
                this.support.cssVariables = false;
            }
        }

        checkModernCSSSupport() {
            // Check for modern CSS features
            this.support.modernCSS = 'CSS' in window && 'supports' in window.CSS;
        }

        supportsCustomProperties() {
            return this.support.customProperties;
        }

        getSupport() {
            return { ...this.support };
        }
    }

    // Export classes and initialize
    window.CSSVariablesEngine = CSSVariablesEngine;
    window.PerformanceMonitor = PerformanceMonitor;
    window.CSSVariableValidator = CSSVariableValidator;
    window.BrowserCompatibilityManager = BrowserCompatibilityManager;

    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', async () => {
            try {
                window.cssVariablesEngine = new CSSVariablesEngine({
                    debug: window.masV2Debug || false
                });
                await window.cssVariablesEngine.initialize();
            } catch (error) {
                console.error('Failed to initialize CSS Variables Engine:', error);
            }
        });
    } else {
        // DOM already loaded
        setTimeout(async () => {
            try {
                window.cssVariablesEngine = new CSSVariablesEngine({
                    debug: window.masV2Debug || false
                });
                await window.cssVariablesEngine.initialize();
            } catch (error) {
                console.error('Failed to initialize CSS Variables Engine:', error);
            }
        }, 0);
    }

})(window, document);