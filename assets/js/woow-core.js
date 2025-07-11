/**
 * WOOW! Core JavaScript - Essential Functionality
 * Tree-shaken, code-split, performance-optimized core module
 * 
 * @package ModernAdminStyler
 * @version 4.0.0 - Performance Optimized
 * @size ~25KB (compressed)
 */

// ========================================================================
// 🚀 PERFORMANCE MONITORING & EARLY OPTIMIZATION
// ========================================================================

(function() {
    'use strict';

    // Performance monitoring
    const perfStart = performance.now();
    let memoryStart = 0;
    
    if (performance.memory) {
        memoryStart = performance.memory.usedJSHeapSize;
    }

    // Early performance checks
    const isLowPerformanceDevice = () => {
        return navigator.hardwareConcurrency <= 2 || 
               (performance.memory && performance.memory.jsHeapSizeLimit < 1073741824); // < 1GB
    };

    // Lazy loading registry
    const lazyModules = new Map();
    const loadedModules = new Set();

    // ========================================================================
    // 🎯 CORE WOOW NAMESPACE
    // ========================================================================

    window.WOOW = window.WOOW || {
        version: '4.0.0',
        initialized: false,
        config: {
            debug: typeof woowV2Global !== 'undefined' ? woowV2Global.debug : false,
            performance: {
                enableLazyLoading: true,
                enableMemoryOptimization: true,
                maxMemoryUsage: 15 * 1024 * 1024, // 15MB
                enableTreeShaking: true
            }
        },
        performance: {
            startTime: perfStart,
            memoryStart: memoryStart,
            isLowPerformance: isLowPerformanceDevice()
        },
        utils: {},
        modules: {},
        events: new EventTarget()
    };

    // ========================================================================
    // 🛠️ CORE UTILITIES
    // ========================================================================

    WOOW.utils = {
        // Debouncing utility
        debounce: function(func, wait, immediate) {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    timeout = null;
                    if (!immediate) func.apply(this, args);
                };
                const callNow = immediate && !timeout;
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
                if (callNow) func.apply(this, args);
            };
        },

        // Throttling utility
        throttle: function(func, limit) {
            let inThrottle;
            return function(...args) {
                if (!inThrottle) {
                    func.apply(this, args);
                    inThrottle = true;
                    setTimeout(() => inThrottle = false, limit);
                }
            };
        },

        // Deep merge objects
        deepMerge: function(target, ...sources) {
            if (!sources.length) return target;
            const source = sources.shift();

            if (this.isObject(target) && this.isObject(source)) {
                for (const key in source) {
                    if (this.isObject(source[key])) {
                        if (!target[key]) Object.assign(target, { [key]: {} });
                        this.deepMerge(target[key], source[key]);
                    } else {
                        Object.assign(target, { [key]: source[key] });
                    }
                }
            }

            return this.deepMerge(target, ...sources);
        },

        // Check if value is object
        isObject: function(item) {
            return item && typeof item === 'object' && !Array.isArray(item);
        },

        // Sanitize input
        sanitize: function(str) {
            const div = document.createElement('div');
            div.textContent = str;
            return div.innerHTML;
        },

        // Generate unique ID
        generateId: function(prefix = 'woow') {
            return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        },

        // Memory usage monitoring
        getMemoryUsage: function() {
            if (!performance.memory) return null;
            return {
                used: performance.memory.usedJSHeapSize,
                total: performance.memory.totalJSHeapSize,
                limit: performance.memory.jsHeapSizeLimit,
                percentage: (performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit) * 100
            };
        },

        // Performance monitoring
        measurePerformance: function(name, fn) {
            const start = performance.now();
            const result = fn();
            const end = performance.now();
            
            if (WOOW.config.debug) {
                console.log(`⚡ ${name}: ${(end - start).toFixed(2)}ms`);
            }
            
            return result;
        }
    };

    // ========================================================================
    // 🔧 MODULE LOADER & LAZY LOADING SYSTEM
    // ========================================================================

    WOOW.loader = {
        // Register lazy-loadable module
        register: function(name, loader, dependencies = []) {
            lazyModules.set(name, {
                loader,
                dependencies,
                loaded: false
            });
        },

        // Load module on demand
        load: async function(name) {
            if (loadedModules.has(name)) {
                return WOOW.modules[name];
            }

            const moduleConfig = lazyModules.get(name);
            if (!moduleConfig) {
                throw new Error(`Module ${name} not registered`);
            }

            try {
                // Load dependencies first
                for (const dep of moduleConfig.dependencies) {
                    await this.load(dep);
                }

                // Load the module
                const module = await moduleConfig.loader();
                WOOW.modules[name] = module;
                loadedModules.add(name);
                moduleConfig.loaded = true;

                // Emit module loaded event
                WOOW.events.dispatchEvent(new CustomEvent('moduleLoaded', {
                    detail: { name, module }
                }));

                if (WOOW.config.debug) {
                    console.log(`📦 Loaded module: ${name}`);
                }

                return module;
            } catch (error) {
                console.error(`❌ Failed to load module ${name}:`, error);
                throw error;
            }
        },

        // Preload critical modules
        preload: function(modules) {
            return Promise.all(modules.map(name => this.load(name)));
        },

        // Get loading stats
        getStats: function() {
            return {
                registered: lazyModules.size,
                loaded: loadedModules.size,
                pending: lazyModules.size - loadedModules.size
            };
        }
    };

    // ========================================================================
    // 🎨 SETTINGS MANAGER INTEGRATION
    // ========================================================================

    WOOW.settings = {
        cache: new Map(),
        subscribers: new Set(),

        // Get setting value
        get: function(key, defaultValue = null) {
            if (this.cache.has(key)) {
                return this.cache.get(key);
            }

            // Try UnifiedSettingsManager if available
            if (window.UnifiedSettingsManager) {
                return window.UnifiedSettingsManager.get(key, defaultValue);
            }

            return defaultValue;
        },

        // Set setting value
        set: function(key, value) {
            this.cache.set(key, value);
            
            // Update UnifiedSettingsManager if available
            if (window.UnifiedSettingsManager) {
                window.UnifiedSettingsManager.set(key, value);
            }

            // Notify subscribers
            this.notify(key, value);
        },

        // Subscribe to setting changes
        subscribe: function(callback) {
            this.subscribers.add(callback);
            return () => this.subscribers.delete(callback);
        },

        // Notify subscribers
        notify: function(key, value) {
            this.subscribers.forEach(callback => {
                try {
                    callback(key, value);
                } catch (error) {
                    console.error('Settings subscriber error:', error);
                }
            });
        }
    };

    // ========================================================================
    // 🎭 THEME SYSTEM
    // ========================================================================

    WOOW.theme = {
        current: 'light',
        
        // Apply theme
        apply: function(theme) {
            document.body.classList.remove(`mas-theme-${this.current}`);
            document.body.classList.add(`mas-theme-${theme}`);
            this.current = theme;
            
            WOOW.settings.set('theme', theme);
            
            // Emit theme change event
            WOOW.events.dispatchEvent(new CustomEvent('themeChanged', {
                detail: { theme }
            }));
        },

        // Toggle theme
        toggle: function() {
            const newTheme = this.current === 'light' ? 'dark' : 'light';
            this.apply(newTheme);
        },

        // Get current theme
        getCurrent: function() {
            return this.current;
        },

        // Auto-detect preferred theme
        detectPreferred: function() {
            if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                return 'dark';
            }
            return 'light';
        }
    };

    // ========================================================================
    // 📱 RESPONSIVE UTILITIES
    // ========================================================================

    WOOW.responsive = {
        breakpoints: {
            mobile: 480,
            tablet: 768,
            desktop: 1024,
            large: 1200
        },

        // Get current breakpoint
        getCurrentBreakpoint: function() {
            const width = window.innerWidth;
            
            if (width <= this.breakpoints.mobile) return 'mobile';
            if (width <= this.breakpoints.tablet) return 'tablet';
            if (width <= this.breakpoints.desktop) return 'desktop';
            return 'large';
        },

        // Check if mobile
        isMobile: function() {
            return window.innerWidth <= this.breakpoints.mobile;
        },

        // Check if tablet
        isTablet: function() {
            const width = window.innerWidth;
            return width > this.breakpoints.mobile && width <= this.breakpoints.tablet;
        },

        // Check if desktop
        isDesktop: function() {
            return window.innerWidth > this.breakpoints.tablet;
        },

        // Add responsive listener
        onBreakpointChange: function(callback) {
            let currentBreakpoint = this.getCurrentBreakpoint();
            
            const checkBreakpoint = WOOW.utils.throttle(() => {
                const newBreakpoint = this.getCurrentBreakpoint();
                if (newBreakpoint !== currentBreakpoint) {
                    currentBreakpoint = newBreakpoint;
                    callback(newBreakpoint);
                }
            }, 100);

            window.addEventListener('resize', checkBreakpoint);
            return () => window.removeEventListener('resize', checkBreakpoint);
        }
    };

    // ========================================================================
    // 🚨 ERROR HANDLING & LOGGING
    // ========================================================================

    WOOW.logger = {
        levels: {
            ERROR: 0,
            WARN: 1,
            INFO: 2,
            DEBUG: 3
        },

        currentLevel: WOOW.config.debug ? 3 : 1,

        log: function(level, message, data = null) {
            if (this.levels[level] <= this.currentLevel) {
                const timestamp = new Date().toISOString();
                const prefix = level === 'ERROR' ? '❌' : 
                              level === 'WARN' ? '⚠️' : 
                              level === 'INFO' ? 'ℹ️' : '🐛';
                
                console[level.toLowerCase()](`${prefix} [WOOW ${timestamp}] ${message}`, data || '');
            }
        },

        error: function(message, data) { this.log('ERROR', message, data); },
        warn: function(message, data) { this.log('WARN', message, data); },
        info: function(message, data) { this.log('INFO', message, data); },
        debug: function(message, data) { this.log('DEBUG', message, data); }
    };

    // Global error handler
    window.addEventListener('error', (event) => {
        WOOW.logger.error('JavaScript Error', {
            message: event.message,
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
            error: event.error
        });
    });

    // ========================================================================
    // 🎯 INITIALIZATION SYSTEM
    // ========================================================================

    WOOW.init = {
        tasks: [],
        
        // Add initialization task
        addTask: function(name, task, priority = 0) {
            this.tasks.push({ name, task, priority });
            this.tasks.sort((a, b) => b.priority - a.priority);
        },

        // Run all initialization tasks
        run: async function() {
            if (WOOW.initialized) {
                WOOW.logger.warn('WOOW already initialized');
                return;
            }

            WOOW.logger.info('🚀 Starting WOOW initialization...');

            try {
                for (const { name, task } of this.tasks) {
                    const startTime = performance.now();
                    await task();
                    const endTime = performance.now();
                    
                    WOOW.logger.debug(`✅ ${name} initialized in ${(endTime - startTime).toFixed(2)}ms`);
                }

                WOOW.initialized = true;
                
                // Calculate total initialization time
                const totalTime = performance.now() - WOOW.performance.startTime;
                const memoryUsed = WOOW.utils.getMemoryUsage();
                
                WOOW.logger.info(`🎉 WOOW initialized successfully in ${totalTime.toFixed(2)}ms`);
                
                if (memoryUsed) {
                    WOOW.logger.debug(`📊 Memory usage: ${(memoryUsed.used / 1024 / 1024).toFixed(2)}MB`);
                }

                // Emit initialization complete event
                WOOW.events.dispatchEvent(new CustomEvent('initialized', {
                    detail: { 
                        totalTime, 
                        memoryUsed: memoryUsed ? memoryUsed.used : null 
                    }
                }));

            } catch (error) {
                WOOW.logger.error('❌ WOOW initialization failed', error);
                throw error;
            }
        }
    };

    // ========================================================================
    // 🔧 CORE INITIALIZATION TASKS
    // ========================================================================

    // Theme initialization
    WOOW.init.addTask('theme', async () => {
        const savedTheme = WOOW.settings.get('theme') || WOOW.theme.detectPreferred();
        WOOW.theme.apply(savedTheme);
    }, 100);

    // Performance monitoring
    WOOW.init.addTask('performance', async () => {
        if (WOOW.performance.isLowPerformance) {
            WOOW.logger.warn('Low performance device detected, enabling optimizations');
            document.body.classList.add('woow-low-performance');
        }

        // Monitor memory usage
        if (WOOW.config.performance.enableMemoryOptimization) {
            setInterval(() => {
                const memory = WOOW.utils.getMemoryUsage();
                if (memory && memory.used > WOOW.config.performance.maxMemoryUsage) {
                    WOOW.logger.warn('High memory usage detected', memory);
                    WOOW.events.dispatchEvent(new CustomEvent('highMemoryUsage', { detail: memory }));
                }
            }, 10000); // Check every 10 seconds
        }
    }, 90);

    // Responsive system initialization
    WOOW.init.addTask('responsive', async () => {
        // Add current breakpoint class
        const currentBreakpoint = WOOW.responsive.getCurrentBreakpoint();
        document.body.classList.add(`woow-${currentBreakpoint}`);

        // Listen for breakpoint changes
        WOOW.responsive.onBreakpointChange((breakpoint) => {
            // Remove old breakpoint classes
            document.body.classList.remove('woow-mobile', 'woow-tablet', 'woow-desktop', 'woow-large');
            // Add new breakpoint class
            document.body.classList.add(`woow-${breakpoint}`);
            
            WOOW.events.dispatchEvent(new CustomEvent('breakpointChanged', {
                detail: { breakpoint }
            }));
        });
    }, 80);

    // ========================================================================
    // 📦 MODULE REGISTRATIONS
    // ========================================================================

    // Register lazy-loadable modules
    WOOW.loader.register('liveEdit', async () => {
        const script = document.createElement('script');
        script.src = `${woowV2Global?.pluginUrl || ''}assets/js/woow-live-edit.js`;
        document.head.appendChild(script);
        
        return new Promise((resolve) => {
            script.onload = () => resolve(window.WOOWLiveEdit);
        });
    });

    WOOW.loader.register('notifications', async () => {
        const script = document.createElement('script');
        script.src = `${woowV2Global?.pluginUrl || ''}assets/js/woow-notifications.js`;
        document.head.appendChild(script);
        
        return new Promise((resolve) => {
            script.onload = () => resolve(window.WOOWNotifications);
        });
    });

    WOOW.loader.register('presets', async () => {
        const script = document.createElement('script');
        script.src = `${woowV2Global?.pluginUrl || ''}assets/js/woow-presets.js`;
        document.head.appendChild(script);
        
        return new Promise((resolve) => {
            script.onload = () => resolve(window.WOOWPresets);
        });
    });

    // ========================================================================
    // 🎯 AUTO-INITIALIZATION
    // ========================================================================

    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            WOOW.init.run().catch(error => {
                WOOW.logger.error('Initialization failed', error);
            });
        });
    } else {
        // DOM is already ready
        setTimeout(() => {
            WOOW.init.run().catch(error => {
                WOOW.logger.error('Initialization failed', error);
            });
        }, 0);
    }

    // ========================================================================
    // 🌐 BACKWARD COMPATIBILITY
    // ========================================================================

    // Legacy MAS object compatibility
    window.MAS = window.MAS || {};
    Object.assign(window.MAS, {
        // Legacy methods for backward compatibility
        log: WOOW.logger.info,
        error: WOOW.logger.error,
        settings: WOOW.settings,
        utils: WOOW.utils
    });

    // jQuery integration if available
    if (typeof jQuery !== 'undefined') {
        jQuery.extend({
            woow: WOOW
        });
    }

    // ========================================================================
    // 🚀 EXPORT FOR MODULE SYSTEMS
    // ========================================================================

    // AMD support
    if (typeof define === 'function' && define.amd) {
        define('woow-core', [], () => WOOW);
    }

    // CommonJS support
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = WOOW;
    }

    // ES6 modules support
    if (typeof window !== 'undefined') {
        window.WOOW = WOOW;
    }

})(); 