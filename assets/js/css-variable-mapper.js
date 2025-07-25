/**
 * 🎨 CSS Variable Mapper - Comprehensive Mapping System
 * 
 * Centralized system for mapping option IDs to CSS variables with:
 * - Complete mapping coverage for all micro-panel options
 * - Value transformation and unit handling
 * - Validation and error logging
 * - Fallback mechanisms
 * 
 * @package ModernAdminStyler
 * @version 1.0.0 - Initial Implementation
 */

(function(window, document) {
    'use strict';

    /**
     * 🎨 CSSVariableMapper - Main Mapper Class
     */
    class CSSVariableMapper {
        constructor() {
            this.mappings = new Map();
            this.unitMappings = new Map();
            this.bodyClassMappings = new Map();
            this.visibilityMappings = new Map();
            this.specialCaseMappings = new Map();
            this.debugMode = window.masV2Debug || false;
            
            this.initializeMappings();
            this.log('CSSVariableMapper initialized with', this.mappings.size, 'mappings');
        }

        /**
         * 🗺️ Initialize all CSS variable mappings
         */
        initializeMappings() {
            // ========================================
            // 🎯 ADMIN BAR MAPPINGS
            // ========================================
            this.addMapping('admin_bar_background', '--woow-surface-bar', 'color');
            this.addMapping('admin_bar_text_color', '--woow-surface-bar-text', 'color');
            this.addMapping('admin_bar_hover_color', '--woow-surface-bar-hover', 'color');
            this.addMapping('admin_bar_height', '--woow-surface-bar-height', 'numeric', 'px');
            this.addMapping('admin_bar_font_size', '--woow-surface-bar-font-size', 'numeric', 'px');
            this.addMapping('admin_bar_padding', '--woow-surface-bar-padding', 'numeric', 'px');
            this.addMapping('admin_bar_margin_top', '--woow-space-bar-top', 'numeric', 'px');
            this.addMapping('admin_bar_margin_left', '--woow-space-bar-left', 'numeric', 'px');
            this.addMapping('admin_bar_margin_right', '--woow-space-bar-right', 'numeric', 'px');
            this.addMapping('admin_bar_border_radius', '--woow-radius-bar', 'numeric', 'px');
            this.addMapping('admin_bar_floating', '--woow-surface-bar-floating', 'boolean');
            this.addMapping('admin_bar_glassmorphism', '--woow-surface-bar-glass', 'boolean');
            
            // Alternative admin bar naming (for compatibility)
            this.addMapping('wpadminbar_bg_color', '--woow-surface-bar', 'color');
            this.addMapping('wpadminbar_text_color', '--woow-surface-bar-text', 'color');
            this.addMapping('wpadminbar_hover_color', '--woow-surface-bar-hover', 'color');
            this.addMapping('wpadminbar_height', '--woow-surface-bar-height', 'numeric', 'px');
            this.addMapping('wpadminbar_font_size', '--woow-surface-bar-font-size', 'numeric', 'px');
            this.addMapping('wpadminbar_floating', '--woow-surface-bar-floating', 'boolean');
            this.addMapping('wpadminbar_glassmorphism', '--woow-surface-bar-glass', 'boolean');

            // ========================================
            // 📋 ADMIN MENU MAPPINGS
            // ========================================
            this.addMapping('menu_background', '--woow-surface-menu', 'color');
            this.addMapping('menu_text_color', '--woow-surface-menu-text', 'color');
            this.addMapping('menu_hover_color', '--woow-surface-menu-hover', 'color');
            this.addMapping('menu_hover_background', '--woow-surface-menu-hover-bg', 'color');
            this.addMapping('menu_hover_text_color', '--woow-surface-menu-hover-text', 'color');
            this.addMapping('menu_active_color', '--woow-surface-menu-active', 'color');
            this.addMapping('menu_width', '--woow-surface-menu-width', 'numeric', 'px');
            this.addMapping('menu_border_radius', '--woow-radius-menu', 'numeric', 'px');
            this.addMapping('menu_padding', '--woow-surface-menu-padding', 'numeric', 'px');
            this.addMapping('menu_margin', '--woow-surface-menu-margin', 'numeric', 'px');
            this.addMapping('menu_floating', '--woow-surface-menu-floating', 'boolean');
            this.addMapping('menu_glassmorphism', '--woow-surface-menu-glass', 'boolean');
            this.addMapping('menu_compact_mode', '--woow-surface-menu-compact', 'boolean');

            // Alternative menu naming
            this.addMapping('adminmenuwrap_floating', '--woow-surface-menu-floating', 'boolean');

            // ========================================
            // 📄 SUBMENU MAPPINGS
            // ========================================
            this.addMapping('submenu_background', '--woow-surface-submenu', 'color');
            this.addMapping('submenu_text_color', '--woow-surface-submenu-text', 'color');
            this.addMapping('submenu_hover_background', '--woow-surface-submenu-hover', 'color');
            this.addMapping('submenu_hover_text_color', '--woow-surface-submenu-hover-text', 'color');
            this.addMapping('submenu_active_background', '--woow-surface-submenu-active', 'color');
            this.addMapping('submenu_active_text_color', '--woow-surface-submenu-active-text', 'color');
            this.addMapping('submenu_separator', '--woow-surface-submenu-separator', 'boolean');
            this.addMapping('submenu_indent', '--woow-surface-submenu-indent', 'numeric', 'px');

            // ========================================
            // 🎨 TYPOGRAPHY MAPPINGS
            // ========================================
            this.addMapping('body_font', '--woow-font-family-base', 'string');
            this.addMapping('heading_font', '--woow-font-family-headings', 'string');
            this.addMapping('global_font_size', '--woow-font-size-base', 'numeric', 'px');
            this.addMapping('global_line_height', '--woow-line-height-base', 'numeric');
            this.addMapping('headings_scale', '--woow-headings-scale', 'numeric');
            this.addMapping('headings_weight', '--woow-headings-weight', 'numeric');
            this.addMapping('headings_spacing', '--woow-headings-spacing', 'numeric', 'em');

            // ========================================
            // 🌈 COLOR SYSTEM MAPPINGS
            // ========================================
            this.addMapping('primary_color', '--woow-accent-primary', 'color');
            this.addMapping('secondary_color', '--woow-accent-secondary', 'color');
            this.addMapping('accent_color', '--woow-accent-accent', 'color');
            this.addMapping('success_color', '--woow-accent-success', 'color');
            this.addMapping('warning_color', '--woow-accent-warning', 'color');
            this.addMapping('error_color', '--woow-accent-error', 'color');
            this.addMapping('shadow_color', '--woow-shadow-color', 'color');
            this.addMapping('content_background', '--woow-bg-primary', 'color');
            this.addMapping('content_text_color', '--woow-text-primary', 'color');

            // ========================================
            // 📦 POSTBOX MAPPINGS
            // ========================================
            this.addMapping('postbox_bg_color', '--woow-postbox-bg', 'color');
            this.addMapping('postbox_border_color', '--woow-postbox-border', 'color');
            this.addMapping('postbox_title_color', '--woow-postbox-title', 'color');
            this.addMapping('postbox_text_color', '--woow-postbox-text', 'color');
            this.addMapping('postbox_radius', '--woow-radius-postbox', 'numeric', 'px');
            this.addMapping('postbox_padding', '--woow-postbox-padding', 'numeric', 'px');
            this.addMapping('postbox_margin', '--woow-postbox-margin', 'numeric', 'px');
            this.addMapping('postbox_shadow', '--woow-postbox-shadow', 'boolean');
            this.addMapping('postbox_glassmorphism', '--woow-postbox-glass', 'boolean');
            this.addMapping('postbox_hover_lift', '--woow-postbox-hover-lift', 'boolean');

            // ========================================
            // 📐 LAYOUT & DIMENSIONS MAPPINGS
            // ========================================
            this.addMapping('content_padding', '--woow-content-padding', 'numeric', 'px');
            this.addMapping('content_max_width', '--woow-content-max-width', 'numeric', 'px');
            this.addMapping('content_border_radius', '--woow-content-radius', 'numeric', 'px');

            // ========================================
            // ✨ EFFECTS & ANIMATIONS MAPPINGS
            // ========================================
            this.addMapping('shadow_opacity', '--woow-shadow-opacity', 'numeric');
            this.addMapping('shadow_blur', '--woow-shadow-blur', 'numeric', 'px');
            this.addMapping('transition_speed', '--woow-transition-speed', 'numeric', 's');
            this.addMapping('z_index_base', '--woow-z-index-base', 'numeric');
            this.addMapping('surface_bar_blur', '--woow-surface-bar-blur', 'numeric', 'px');

            // ========================================
            // 🦶 FOOTER MAPPINGS
            // ========================================
            this.addMapping('footer_bg', '--woow-surface-footer', 'color');
            this.addMapping('footer_text', '--woow-surface-footer-text', 'color');
            this.addMapping('footer_padding', '--woow-surface-footer-padding', 'numeric', 'px');

            // ========================================
            // 🏷️ BODY CLASS MAPPINGS
            // ========================================
            this.addBodyClassMapping('admin_bar_floating', 'woow-admin-bar-floating');
            this.addBodyClassMapping('admin_bar_glassmorphism', 'woow-admin-bar-glassmorphism');
            this.addBodyClassMapping('admin_bar_shadow', 'woow-admin-bar-shadow');
            this.addBodyClassMapping('admin_bar_gradient', 'woow-admin-bar-gradient');
            this.addBodyClassMapping('wpadminbar_floating', 'woow-admin-bar-floating');
            this.addBodyClassMapping('wpadminbar_glassmorphism', 'woow-admin-bar-glassmorphism');
            
            this.addBodyClassMapping('menu_floating', 'woow-menu-floating');
            this.addBodyClassMapping('menu_glassmorphism', 'woow-menu-glassmorphism');
            this.addBodyClassMapping('menu_compact_mode', 'woow-menu-compact');
            this.addBodyClassMapping('adminmenuwrap_floating', 'woow-menu-floating');
            
            this.addBodyClassMapping('postbox_glassmorphism', 'woow-postbox-glassmorphism');
            this.addBodyClassMapping('postbox_hover_lift', 'woow-postbox-hover-lift');
            this.addBodyClassMapping('postbox_shadow', 'woow-postbox-shadow');
            this.addBodyClassMapping('postbox_3d_hover', 'woow-postbox-3d-hover');
            
            this.addBodyClassMapping('performance_mode', 'woow-performance-mode');
            this.addBodyClassMapping('enable_animations', 'woow-animations-enabled');
            this.addBodyClassMapping('hardware_acceleration', 'woow-hardware-acceleration');

            // ========================================
            // 👁️ VISIBILITY MAPPINGS
            // ========================================
            this.addVisibilityMapping('hide_wp_logo', '#wp-admin-bar-wp-logo');
            this.addVisibilityMapping('hide_howdy', '#wp-admin-bar-my-account .display-name');
            this.addVisibilityMapping('hide_update_notices', '#wp-admin-bar-updates');
            this.addVisibilityMapping('hide_comments', '#wp-admin-bar-comments');
            this.addVisibilityMapping('hide_help_tab', '#contextual-help-link-wrap');
            this.addVisibilityMapping('hide_screen_options', '#screen-options-link-wrap');
            this.addVisibilityMapping('hide_footer', '#wpfooter');
            this.addVisibilityMapping('hide_version', '#footer-thankyou');
            this.addVisibilityMapping('wpfooter_hide_version', '#wpfooter .alignright');
            this.addVisibilityMapping('wpfooter_hide_thanks', '#wpfooter .alignleft');

            // ========================================
            // 🔧 SPECIAL CASE MAPPINGS
            // ========================================
            this.addSpecialCaseMapping('color_scheme', this.handleColorScheme.bind(this));
            this.addSpecialCaseMapping('admin_bar_background', this.handleAdminBarBackground.bind(this));
            this.addSpecialCaseMapping('wpadminbar_bg_color', this.handleAdminBarBackground.bind(this));
            this.addSpecialCaseMapping('menu_width', this.handleMenuWidth.bind(this));
        }

        /**
         * ➕ Add CSS variable mapping
         */
        addMapping(optionId, cssVar, type = 'string', unit = '') {
            this.mappings.set(optionId, {
                cssVar: cssVar,
                type: type,
                unit: unit
            });

            if (unit) {
                this.unitMappings.set(optionId, unit);
            }
        }

        /**
         * 🏷️ Add body class mapping
         */
        addBodyClassMapping(optionId, className) {
            this.bodyClassMappings.set(optionId, className);
        }

        /**
         * 👁️ Add visibility mapping
         */
        addVisibilityMapping(optionId, selector) {
            this.visibilityMappings.set(optionId, selector);
        }

        /**
         * 🔧 Add special case mapping
         */
        addSpecialCaseMapping(optionId, handler) {
            this.specialCaseMappings.set(optionId, handler);
        }

        /**
         * 🎨 Apply CSS variable for option
         */
        applyVariable(optionId, value) {
            const mapping = this.mappings.get(optionId);
            
            if (!mapping) {
                this.logWarning(`No CSS variable mapping found for option: ${optionId}`);
                return false;
            }

            try {
                // Transform value based on type
                const cssValue = this.transformValue(value, mapping.type, mapping.unit);
                
                // Apply CSS variable
                document.documentElement.style.setProperty(mapping.cssVar, cssValue);
                
                // Also apply to body for higher specificity
                document.body.style.setProperty(mapping.cssVar, cssValue, 'important');
                
                this.log(`Applied CSS variable: ${mapping.cssVar} = ${cssValue}`);
                return true;
                
            } catch (error) {
                this.logError(`Failed to apply CSS variable for ${optionId}:`, error);
                return false;
            }
        }

        /**
         * 🏷️ Apply body class for option
         */
        applyBodyClass(optionId, value) {
            const className = this.bodyClassMappings.get(optionId);
            
            if (!className) {
                return false;
            }

            try {
                if (className.endsWith('-')) {
                    // Handle scheme classes (e.g., 'woow-color-scheme-')
                    const prefix = className;
                    // Remove existing scheme classes
                    document.body.classList.forEach(cls => {
                        if (cls.startsWith(prefix)) {
                            document.body.classList.remove(cls);
                        }
                    });
                    // Add new scheme class
                    if (value) {
                        document.body.classList.add(prefix + value);
                    }
                } else {
                    // Handle boolean classes
                    if (value) {
                        document.body.classList.add(className);
                    } else {
                        document.body.classList.remove(className);
                    }
                }
                
                this.log(`Applied body class: ${className} (${value ? 'added' : 'removed'})`);
                return true;
                
            } catch (error) {
                this.logError(`Failed to apply body class for ${optionId}:`, error);
                return false;
            }
        }

        /**
         * 👁️ Apply element visibility for option
         */
        applyVisibility(optionId, value) {
            const selector = this.visibilityMappings.get(optionId);
            
            if (!selector) {
                return false;
            }

            try {
                const elements = document.querySelectorAll(selector);
                elements.forEach(element => {
                    element.style.display = value ? 'none' : '';
                });
                
                this.log(`Applied visibility: ${selector} (${value ? 'hidden' : 'visible'})`);
                return true;
                
            } catch (error) {
                this.logError(`Failed to apply visibility for ${optionId}:`, error);
                return false;
            }
        }

        /**
         * 🔧 Apply special case handling
         */
        applySpecialCase(optionId, value) {
            const handler = this.specialCaseMappings.get(optionId);
            
            if (!handler) {
                return false;
            }

            try {
                handler(value);
                this.log(`Applied special case: ${optionId} = ${value}`);
                return true;
                
            } catch (error) {
                this.logError(`Failed to apply special case for ${optionId}:`, error);
                return false;
            }
        }

        /**
         * 🎯 Apply all mappings for an option
         */
        applyOption(optionId, value) {
            let applied = false;
            
            // Apply CSS variable
            if (this.applyVariable(optionId, value)) {
                applied = true;
            }
            
            // Apply body class
            if (this.applyBodyClass(optionId, value)) {
                applied = true;
            }
            
            // Apply visibility
            if (this.applyVisibility(optionId, value)) {
                applied = true;
            }
            
            // Apply special case
            if (this.applySpecialCase(optionId, value)) {
                applied = true;
            }
            
            if (!applied) {
                this.logWarning(`No mappings applied for option: ${optionId}`);
            }
            
            return applied;
        }

        /**
         * 🔄 Transform value based on type and unit
         */
        transformValue(value, type, unit = '') {
            switch (type) {
                case 'boolean':
                    return value ? '1' : '0';
                    
                case 'numeric':
                    const numValue = parseFloat(value);
                    if (isNaN(numValue)) {
                        throw new Error(`Invalid numeric value: ${value}`);
                    }
                    return numValue + unit;
                    
                case 'color':
                    if (typeof value === 'string' && value.match(/^#[0-9A-Fa-f]{6}$/)) {
                        return value;
                    }
                    throw new Error(`Invalid color value: ${value}`);
                    
                case 'string':
                default:
                    return String(value);
            }
        }

        /**
         * ✅ Validate mapping exists
         */
        validateMapping(optionId) {
            const hasMapping = this.mappings.has(optionId) || 
                             this.bodyClassMappings.has(optionId) || 
                             this.visibilityMappings.has(optionId) || 
                             this.specialCaseMappings.has(optionId);
            
            if (!hasMapping) {
                this.logWarning(`No mapping found for option: ${optionId}`);
                this.suggestMapping(optionId);
            }
            
            return hasMapping;
        }

        /**
         * 💡 Suggest mapping for unknown option
         */
        suggestMapping(optionId) {
            const suggestions = [];
            
            // Look for similar option IDs
            const allOptions = [
                ...this.mappings.keys(),
                ...this.bodyClassMappings.keys(),
                ...this.visibilityMappings.keys(),
                ...this.specialCaseMappings.keys()
            ];
            
            allOptions.forEach(existingOption => {
                if (this.calculateSimilarity(optionId, existingOption) > 0.6) {
                    suggestions.push(existingOption);
                }
            });
            
            if (suggestions.length > 0) {
                this.log(`💡 Similar options found for '${optionId}': ${suggestions.join(', ')}`);
            }
        }

        /**
         * 📊 Calculate string similarity
         */
        calculateSimilarity(str1, str2) {
            const longer = str1.length > str2.length ? str1 : str2;
            const shorter = str1.length > str2.length ? str2 : str1;
            
            if (longer.length === 0) {
                return 1.0;
            }
            
            const editDistance = this.levenshteinDistance(longer, shorter);
            return (longer.length - editDistance) / longer.length;
        }

        /**
         * 📏 Calculate Levenshtein distance
         */
        levenshteinDistance(str1, str2) {
            const matrix = [];
            
            for (let i = 0; i <= str2.length; i++) {
                matrix[i] = [i];
            }
            
            for (let j = 0; j <= str1.length; j++) {
                matrix[0][j] = j;
            }
            
            for (let i = 1; i <= str2.length; i++) {
                for (let j = 1; j <= str1.length; j++) {
                    if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                        matrix[i][j] = matrix[i - 1][j - 1];
                    } else {
                        matrix[i][j] = Math.min(
                            matrix[i - 1][j - 1] + 1,
                            matrix[i][j - 1] + 1,
                            matrix[i - 1][j] + 1
                        );
                    }
                }
            }
            
            return matrix[str2.length][str1.length];
        }

        // ========================================
        // 🔧 SPECIAL CASE HANDLERS
        // ========================================

        /**
         * 🎨 Handle color scheme changes
         */
        handleColorScheme(value) {
            // Remove existing scheme classes
            document.body.classList.forEach(cls => {
                if (cls.startsWith('woow-color-scheme-')) {
                    document.body.classList.remove(cls);
                }
            });
            
            // Add new scheme class
            document.body.classList.add(`woow-color-scheme-${value}`);
            
            // Update data attribute
            document.documentElement.setAttribute('data-theme', value);
            
            // Store in localStorage for persistence
            localStorage.setItem('woow-theme', value);
        }

        /**
         * 🎯 Handle admin bar background (force application)
         */
        handleAdminBarBackground(value) {
            const adminBar = document.querySelector('#wpadminbar');
            if (adminBar) {
                adminBar.style.setProperty('background-color', value, 'important');
                adminBar.style.setProperty('background', value, 'important');
            }
        }

        /**
         * 📏 Handle menu width changes
         */
        handleMenuWidth(value) {
            const menu = document.querySelector('#adminmenuwrap');
            if (menu) {
                menu.style.setProperty('width', value + 'px', 'important');
            }
            
            // Also update content margin
            const content = document.querySelector('#wpcontent');
            if (content) {
                content.style.setProperty('margin-left', value + 'px', 'important');
            }
        }

        // ========================================
        // 📊 UTILITY METHODS
        // ========================================

        /**
         * 📋 Get all mappings
         */
        getAllMappings() {
            return {
                cssVariables: Object.fromEntries(this.mappings),
                bodyClasses: Object.fromEntries(this.bodyClassMappings),
                visibility: Object.fromEntries(this.visibilityMappings),
                specialCases: Array.from(this.specialCaseMappings.keys())
            };
        }

        /**
         * 📊 Get mapping statistics
         */
        getStats() {
            return {
                totalMappings: this.mappings.size + this.bodyClassMappings.size + 
                              this.visibilityMappings.size + this.specialCaseMappings.size,
                cssVariables: this.mappings.size,
                bodyClasses: this.bodyClassMappings.size,
                visibility: this.visibilityMappings.size,
                specialCases: this.specialCaseMappings.size
            };
        }

        /**
         * 🧪 Test all mappings
         */
        testAllMappings() {
            const results = {
                passed: 0,
                failed: 0,
                errors: []
            };
            
            // Test CSS variable mappings
            this.mappings.forEach((mapping, optionId) => {
                try {
                    this.applyVariable(optionId, this.getTestValue(mapping.type));
                    results.passed++;
                } catch (error) {
                    results.failed++;
                    results.errors.push(`${optionId}: ${error.message}`);
                }
            });
            
            this.log('Mapping test results:', results);
            return results;
        }

        /**
         * 🎯 Get test value for type
         */
        getTestValue(type) {
            switch (type) {
                case 'boolean': return true;
                case 'numeric': return 42;
                case 'color': return '#ff0000';
                case 'string': default: return 'test-value';
            }
        }

        /**
         * 📝 Logging utilities
         */
        log(message, ...args) {
            if (this.debugMode) {
                console.log(`🎨 CSSVariableMapper: ${message}`, ...args);
            }
        }

        logWarning(message, ...args) {
            console.warn(`⚠️ CSSVariableMapper: ${message}`, ...args);
        }

        logError(message, ...args) {
            console.error(`❌ CSSVariableMapper: ${message}`, ...args);
        }
    }

    // Make CSSVariableMapper globally available
    window.CSSVariableMapper = CSSVariableMapper;
    
    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.cssVariableMapperInstance = new CSSVariableMapper();
        });
    } else {
        window.cssVariableMapperInstance = new CSSVariableMapper();
    }

})(window, document);