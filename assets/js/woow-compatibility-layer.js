/**
 * WOOW! Admin Styler - Compatibility Layer
 * ========================================
 * Ensures 100% compatibility between old mas-* and new woow-* variables
 * This layer acts as a bridge during the transition period
 */

(function() {
    "use strict";

    // CSS Variables Mapping: mas-* → woow-*
    const CSS_VAR_MAPPING = {
        // Admin Bar
        '--mas-admin-bar-background': '--woow-surface-bar',
        '--mas-admin-bar-text-color': '--woow-surface-bar-text',
        '--mas-admin-bar-hover-color': '--woow-surface-bar-hover',
        '--mas-admin-bar-height': '--woow-surface-bar-height',
        '--mas-admin-bar-font-size': '--woow-surface-bar-font-size',
        '--mas-admin-bar-padding': '--woow-surface-bar-padding',
        '--mas-admin-bar-blur': '--woow-surface-bar-blur',
        
        // Menu
        '--mas-menu-background': '--woow-surface-menu',
        '--mas-menu-text-color': '--woow-surface-menu-text',
        '--mas-menu-hover-color': '--woow-surface-menu-hover',
        '--mas-menu-active-color': '--woow-surface-menu-active',
        '--mas-menu-width': '--woow-surface-menu-width',
        '--mas-menu-item-padding': '--woow-surface-menu-item-padding',
        '--mas-menu-border-radius-all': '--woow-radius-menu-all',
        '--mas-menu-font-size': '--woow-surface-menu-font-size',
        
        // Core Colors
        '--mas-primary': '--woow-accent-primary',
        '--mas-secondary': '--woow-accent-secondary',
        '--mas-accent': '--woow-accent-primary',
        '--mas-background': '--woow-bg-primary',
        '--mas-surface': '--woow-bg-secondary',
        '--mas-text': '--woow-text-primary',
        '--mas-text-secondary': '--woow-text-secondary',
        '--mas-border': '--woow-border-primary',
        
        // Content
        '--mas-content-background': '--woow-bg-primary',
        '--mas-card-background': '--woow-bg-secondary',
        '--mas-border-color': '--woow-border-primary',
        
        // Effects
        '--mas-glass-bg': '--woow-glass-bg',
        '--mas-glass-border': '--woow-glass-border',
        '--mas-glass-shadow': '--woow-glass-shadow',
        
        // Spacing
        '--mas-space-1': '--woow-space-xs',
        '--mas-space-2': '--woow-space-sm',
        '--mas-space-3': '--woow-space-md',
        '--mas-space-4': '--woow-space-lg',
        
        // Typography
        '--mas-font-size': '--woow-font-size-base',
        '--mas-font-family': '--woow-font-family',
        
        // Status Colors
        '--mas-success': '--woow-accent-success',
        '--mas-warning': '--woow-accent-warning',
        '--mas-error': '--woow-accent-error'
    };

    // Body Classes Mapping: mas-* → woow-*
    const BODY_CLASS_MAPPING = {
        'mas-admin-bar-glassmorphism': 'woow-admin-bar-glassmorphism',
        'mas-admin-bar-shadow': 'woow-admin-bar-shadow',
        'mas-admin-bar-gradient': 'woow-admin-bar-gradient',
        'mas-admin-bar-floating': 'woow-admin-bar-floating',
        'mas-v2-admin-bar-floating': 'woow-admin-bar-floating',
        'mas-menu-floating': 'woow-menu-floating',
        'mas-menu-3d-hover': 'woow-menu-3d-hover',
        'mas-menu-smooth-transitions': 'woow-menu-smooth-transitions',
        'mas-submenu-separator-enabled': 'woow-submenu-separator-enabled',
        'mas-theme-dark': 'woow-theme-dark',
        'mas-theme-light': 'woow-theme-light',
        'mas-v2-menu-floating': 'woow-menu-floating',
        'mas-admin-bar-glass': 'woow-admin-bar-glass',
        'mas-3d-effects': 'woow-3d-effects',
        'mas-glassmorphism': 'woow-glassmorphism'
    };

    /**
     * Intercept CSS Variable Operations
     * Automatically redirect mas-* to woow-* variables
     */
    function setupCSSVariableInterception() {
        const originalSetProperty = CSSStyleDeclaration.prototype.setProperty;
        const originalGetPropertyValue = CSSStyleDeclaration.prototype.getPropertyValue;
        
        // Intercept setProperty calls
        CSSStyleDeclaration.prototype.setProperty = function(property, value, priority) {
            if (property.startsWith('--mas-') && CSS_VAR_MAPPING[property]) {
                const newProperty = CSS_VAR_MAPPING[property];
        
                return originalSetProperty.call(this, newProperty, value, priority);
            }
            return originalSetProperty.call(this, property, value, priority);
        };
        
        // Intercept getPropertyValue calls
        CSSStyleDeclaration.prototype.getPropertyValue = function(property) {
            if (property.startsWith('--mas-') && CSS_VAR_MAPPING[property]) {
                const newProperty = CSS_VAR_MAPPING[property];
        
                return originalGetPropertyValue.call(this, newProperty);
            }
            return originalGetPropertyValue.call(this, property);
        };
    }

    /**
     * Intercept Body Class Operations
     * Automatically redirect mas-* to woow-* classes
     */
    function setupBodyClassInterception() {
        const originalAdd = DOMTokenList.prototype.add;
        const originalRemove = DOMTokenList.prototype.remove;
        const originalToggle = DOMTokenList.prototype.toggle;
        
        // Intercept add calls
        DOMTokenList.prototype.add = function(...classes) {
            const mappedClasses = classes.map(cls => {
                if (BODY_CLASS_MAPPING[cls]) {
            
                    return BODY_CLASS_MAPPING[cls];
                }
                return cls;
            });
            return originalAdd.apply(this, mappedClasses);
        };
        
        // Intercept remove calls
        DOMTokenList.prototype.remove = function(...classes) {
            const mappedClasses = classes.map(cls => {
                if (BODY_CLASS_MAPPING[cls]) {
            
                    return BODY_CLASS_MAPPING[cls];
                }
                return cls;
            });
            return originalRemove.apply(this, mappedClasses);
        };
        
        // Intercept toggle calls
        DOMTokenList.prototype.toggle = function(cls, force) {
            if (BODY_CLASS_MAPPING[cls]) {
                const mappedClass = BODY_CLASS_MAPPING[cls];
        
                return originalToggle.call(this, mappedClass, force);
            }
            return originalToggle.call(this, cls, force);
        };
    }

    /**
     * Setup DOM Mutation Observer for Dynamic Elements
     * Ensures new elements also get compatibility treatment
     */
    function setupMutationObserver() {
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach(function(node) {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            updateElementAttributes(node);
                        }
                    });
                }
            });
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    /**
     * Update data attributes in existing and new elements
     */
    function updateElementAttributes(element) {
        // Update data-css-var attributes
        const cssVarElements = element.querySelectorAll('[data-css-var]');
        cssVarElements.forEach(el => {
            const cssVar = el.getAttribute('data-css-var');
            if (cssVar && cssVar.startsWith('--mas-') && CSS_VAR_MAPPING[cssVar]) {
                const newVar = CSS_VAR_MAPPING[cssVar];
                el.setAttribute('data-css-var', newVar);
        
            }
        });
        
        // Update data-body-class attributes
        const bodyClassElements = element.querySelectorAll('[data-body-class]');
        bodyClassElements.forEach(el => {
            const bodyClass = el.getAttribute('data-body-class');
            if (bodyClass && BODY_CLASS_MAPPING[bodyClass]) {
                const newClass = BODY_CLASS_MAPPING[bodyClass];
                el.setAttribute('data-body-class', newClass);
        
            }
        });
    }

    /**
     * Initialize Compatibility Layer
     */
    function initCompatibilityLayer() {
    
        
        // Setup interceptions
        setupCSSVariableInterception();
        setupBodyClassInterception();
        setupMutationObserver();
        
        // Update existing elements
        updateElementAttributes(document);
        
        
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initCompatibilityLayer);
    } else {
        initCompatibilityLayer();
    }

    // Export for global access
    window.WOOWCompatibility = {
        cssVarMapping: CSS_VAR_MAPPING,
        bodyClassMapping: BODY_CLASS_MAPPING,
        updateElement: updateElementAttributes
    };

})(); 