/**
 * Modern Admin Styler V2 - Data-Driven Live Preview System
 * 
 * FAZA 3+: Intelligent Live Preview Architecture
 * Sterowany atrybutami data-* zamiast hardcoded if statements
 * 
 * @package ModernAdminStyler
 * @version 3.1.0
 */

(function($) {
    'use strict';
    
    // 🎯 Główny obiekt Live Preview System
    const MASLivePreview = {
        
        // Cache dla performance
        cache: {
            root: null,
            body: null,
            form: null,
            previewFrame: null
        },
        
        // Konfiguracja typów preview
        previewTypes: {
            'css-var': {
                handler: 'applyCSSVariable',
                description: 'Ustawia zmienną CSS'
            },
            'body-class': {
                handler: 'toggleBodyClass',
                description: 'Przełącza klasę CSS na body'
            },
            'element-style': {
                handler: 'applyElementStyle',
                description: 'Aplikuje style bezpośrednio do elementu'
            },
            'custom-css': {
                handler: 'injectCustomCSS',
                description: 'Wstrzykuje niestandardowy CSS'
            },
            'headings-scale': {
                handler: 'updateHeadingsScale',
                description: 'Aktualizuje skalę nagłówków'
            }
        },
        
        // Statystyki dla debugging
        stats: {
            totalUpdates: 0,
            typeUsage: {},
            performanceMetrics: []
        },
        
        /**
         * 🚀 Inicjalizacja systemu
         */
        init: function() {
            this.initCache();
            this.bindEvents();
            this.initializePreviewTypes();
            this.logSystemInfo();
        },
        
        /**
         * 💾 Inicjalizacja cache
         */
        initCache: function() {
            this.cache.root = document.documentElement;
            this.cache.body = document.body;
            this.cache.form = document.getElementById('mas-v2-settings-form');
            
            // Sprawdź czy jesteśmy w iframe preview
            if (window.parent !== window) {
                this.cache.previewFrame = window.parent.document;
            }
        },
        
        /**
         * 🎛️ Bindowanie eventów
         */
        bindEvents: function() {
            if (!this.cache.form) {
                console.warn('MAS Live Preview: Form not found');
                return;
            }
            
            // Event delegation dla wszystkich pól z data-live-preview
            $(this.cache.form).on('input change', '[data-live-preview]', (e) => {
                this.handleFieldChange(e.target);
            });
            
            // Specjalne eventy dla złożonych kontrolek
            $(this.cache.form).on('mas:custom-update', (e, data) => {
                this.handleCustomUpdate(data);
            });
        },
        
        /**
         * 🔧 Inicjalizacja typów preview
         */
        initializePreviewTypes: function() {
            // Rejestruj statystyki użycia
            Object.keys(this.previewTypes).forEach(type => {
                this.stats.typeUsage[type] = 0;
            });
        },
        
        /**
         * 📊 Logowanie informacji systemowych
         */
        logSystemInfo: function() {
            if (window.masV2?.debug) {
                console.group('🎨 MAS Live Preview System Initialized');
                console.log('Available preview types:', Object.keys(this.previewTypes));
                console.log('Form fields with live preview:', this.getPreviewFields().length);
                console.log('Cache initialized:', this.cache);
                console.log('Live Edit Mode:', window.masLiveEditMode ? 'Available' : 'Not loaded');
                console.groupEnd();
            }
        },
        
        /**
         * 🔗 Integration with Live Edit Mode
         */
        integrateWithLiveEditMode: function() {
            if (window.masLiveEditMode) {
                // Listen for Live Edit Mode changes and sync with form
                $(document).on('mas:live-edit-changed', (e, data) => {
                    this.syncFromLiveEdit(data);
                });
                
                console.log('🔗 Integrated with Live Edit Mode');
            }
        },
        
        /**
         * 🔄 Sync changes from Live Edit Mode to traditional form
         */
        syncFromLiveEdit: function(data) {
            const field = this.cache.form?.querySelector(`[name="${data.optionId}"]`);
            if (field && field.value !== data.value) {
                field.value = data.value;
                this.handleFieldChange(field);
            }
        },
        
        /**
         * 🎯 Główna funkcja obsługi zmiany pola
         */
        handleFieldChange: function(field) {
            const startTime = performance.now();
            
            try {
                const previewType = field.dataset.livePreview;
                const fieldName = field.name;
                const fieldValue = this.getFieldValue(field);
                
                if (!previewType || !this.previewTypes[previewType]) {
                    console.warn(`Unknown preview type: ${previewType}`);
                    return;
                }
                
                // Wykonaj preview
                const success = this.executePreview(previewType, field, fieldValue);
                
                // Statystyki
                this.updateStats(previewType, startTime, success);
                
                // Trigger custom event dla innych systemów
                $(document).trigger('mas:live-preview-updated', {
                    field: fieldName,
                    value: fieldValue,
                    type: previewType,
                    success: success
                });
                
            } catch (error) {
                console.error('MAS Live Preview Error:', error);
            }
        },
        
        /**
         * ⚡ Wykonanie preview
         */
        executePreview: function(type, field, value) {
            const handler = this.previewTypes[type].handler;
            
            if (typeof this[handler] === 'function') {
                return this[handler](field, value);
            }
            
            console.error(`Handler not found: ${handler}`);
            return false;
        },
        
        /**
         * 🎨 Handler: CSS Variable
         */
        applyCSSVariable: function(field, value) {
            const varName = field.dataset.cssVar;
            const unit = field.dataset.unit || '';
            const target = field.dataset.target || 'root'; // root, body, form
            
            if (!varName) {
                console.warn('CSS variable name not specified');
                return false;
            }
            
            let targetElement;
            switch (target) {
                case 'body':
                    targetElement = this.cache.body;
                    break;
                case 'form':
                    targetElement = this.cache.form;
                    break;
                default:
                    targetElement = this.cache.root;
            }
            
            // Formatuj wartość
            const formattedValue = this.formatValue(value, field.type, unit);
            
            // Ustaw zmienną CSS
            targetElement.style.setProperty(varName, formattedValue);
            
            if (window.masV2?.debug) {
                console.log(`CSS Variable: ${varName} = ${formattedValue}`);
            }
            
            return true;
        },
        
        /**
         * 🏷️ Handler: Body Class
         */
        toggleBodyClass: function(field, value) {
            const className = field.dataset.bodyClass;
            const mode = field.dataset.classMode || 'toggle'; // toggle, add, remove
            
            if (!className) {
                console.warn('Body class name not specified');
                return false;
            }
            
            switch (mode) {
                case 'toggle':
                    const shouldAdd = this.isTruthy(value);
                    this.cache.body.classList.toggle(className, shouldAdd);
                    break;
                case 'add':
                    this.cache.body.classList.add(className);
                    break;
                case 'remove':
                    this.cache.body.classList.remove(className);
                    break;
            }
            
            if (window.masV2?.debug) {
                console.log(`Body Class: ${className} (${mode}) = ${value}`);
            }
            
            return true;
        },
        
        /**
         * 🎯 Handler: Element Style
         */
        applyElementStyle: function(field, value) {
            const selector = field.dataset.selector;
            const property = field.dataset.property;
            const unit = field.dataset.unit || '';
            
            if (!selector || !property) {
                console.warn('Element selector or property not specified');
                return false;
            }
            
            const elements = document.querySelectorAll(selector);
            const formattedValue = this.formatValue(value, field.type, unit);
            
            elements.forEach(element => {
                element.style[property] = formattedValue;
            });
            
            if (window.masV2?.debug) {
                console.log(`Element Style: ${selector} { ${property}: ${formattedValue} }`);
            }
            
            return true;
        },
        
        /**
         * 📝 Handler: Custom CSS
         */
        injectCustomCSS: function(field, value) {
            const cssId = field.dataset.cssId || 'mas-live-preview-css';
            
            // Usuń poprzedni CSS
            const existingStyle = document.getElementById(cssId);
            if (existingStyle) {
                existingStyle.remove();
            }
            
            // Dodaj nowy CSS jeśli wartość nie jest pusta
            if (value && value.trim()) {
                const style = document.createElement('style');
                style.id = cssId;
                style.textContent = value;
                document.head.appendChild(style);
            }
            
            if (window.masV2?.debug) {
                console.log(`Custom CSS injected: ${value.length} characters`);
            }
            
            return true;
        },
        
        /**
         * 📏 Handler: Headings Scale
         */
        updateHeadingsScale: function(field, value) {
            const baseSize = parseFloat(field.dataset.baseSize || '16');
            const scale = parseFloat(value) || 1.2;
            
            const headingSizes = {
                'h1': Math.pow(scale, 5),
                'h2': Math.pow(scale, 4),
                'h3': Math.pow(scale, 3),
                'h4': Math.pow(scale, 2),
                'h5': Math.pow(scale, 1),
                'h6': Math.pow(scale, 0.5)
            };
            
            Object.entries(headingSizes).forEach(([tag, multiplier]) => {
                const size = (baseSize * multiplier).toFixed(2);
                this.cache.root.style.setProperty(`--mas-${tag}-size`, `${size}px`);
            });
            
            if (window.masV2?.debug) {
                console.log(`Headings Scale: ${scale} (base: ${baseSize}px)`);
            }
            
            return true;
        },
        
        /**
         * 🔧 Pomocnicze funkcje
         */
        
        getFieldValue: function(field) {
            switch (field.type) {
                case 'checkbox':
                    return field.checked ? '1' : '0';
                case 'radio':
                    return field.checked ? field.value : null;
                case 'number':
                case 'range':
                    return parseFloat(field.value) || 0;
                default:
                    return field.value;
            }
        },
        
        formatValue: function(value, type, unit) {
            if (value === null || value === undefined) {
                return '';
            }
            
            switch (type) {
                case 'number':
                case 'range':
                    return value + unit;
                case 'color':
                    return this.validateColor(value);
                default:
                    return value;
            }
        },
        
        validateColor: function(color) {
            // Podstawowa walidacja koloru
            if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color)) {
                return color;
            }
            return '#000000'; // fallback
        },
        
        isTruthy: function(value) {
            return value === '1' || value === true || value === 'true' || value === 'on';
        },
        
        getPreviewFields: function() {
            return this.cache.form ? 
                this.cache.form.querySelectorAll('[data-live-preview]') : [];
        },
        
        updateStats: function(type, startTime, success) {
            this.stats.totalUpdates++;
            this.stats.typeUsage[type]++;
            
            const duration = performance.now() - startTime;
            this.stats.performanceMetrics.push({
                type: type,
                duration: duration,
                success: success,
                timestamp: Date.now()
            });
            
            // Zachowaj tylko ostatnie 100 metryk
            if (this.stats.performanceMetrics.length > 100) {
                this.stats.performanceMetrics = this.stats.performanceMetrics.slice(-100);
            }
        },
        
        /**
         * 📊 Public API dla debugging
         */
        getStats: function() {
            return {
                ...this.stats,
                averageUpdateTime: this.stats.performanceMetrics.reduce((sum, metric) => 
                    sum + metric.duration, 0) / this.stats.performanceMetrics.length || 0
            };
        },
        
        /**
         * 🔄 Ręczne uruchomienie preview dla wszystkich pól
         */
        refreshAllPreviews: function() {
            const fields = this.getPreviewFields();
            fields.forEach(field => this.handleFieldChange(field));
        },
        
        /**
         * 🧹 Reset wszystkich preview
         */
        resetPreviews: function() {
            // Usuń wszystkie CSS variables
            const root = this.cache.root;
            Array.from(root.style).forEach(property => {
                if (property.startsWith('--mas-')) {
                    root.style.removeProperty(property);
                }
            });
            
            // Usuń klasy body
            this.cache.body.className = this.cache.body.className
                .split(' ')
                .filter(cls => !cls.startsWith('mas-'))
                .join(' ');
            
            // Usuń custom CSS
            const customStyles = document.querySelectorAll('style[id*="mas-live-preview"]');
            customStyles.forEach(style => style.remove());
        }
    };
    
    // 🚀 Inicjalizacja po załadowaniu DOM
    $(document).ready(function() {
        MASLivePreview.init();
        
        // Udostępnij globalnie dla debugging
        window.MASLivePreview = MASLivePreview;
        
        // Kompatybilność wsteczna
        window.triggerLivePreview = function(formData) {
            console.warn('triggerLivePreview is deprecated. Use MASLivePreview.refreshAllPreviews()');
            MASLivePreview.refreshAllPreviews();
        };
    });
    
})(jQuery); 