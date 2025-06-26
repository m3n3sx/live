/**
 * Modern Admin Styler V2 - Premium Features JavaScript
 * Advanced functionality for enterprise-level features
 */

(function($) {
    'use strict';

    // Premium Features Manager
    class PremiumFeaturesManager {
        constructor() {
            this.templates = {};
            this.analytics = {
                clicks: {},
                hoverTimes: {},
                sessions: []
            };
            this.codeEditors = {};
            this.init();
        }

        init() {
            this.initTemplateSystem();
            this.initAnalytics();
            this.initCodeEditors();
            this.initConditionalDisplay();
            this.initBackupSystem();
            this.initPremiumToggles();
            this.bindEvents();
        }

        // Template System
        initTemplateSystem() {
            this.loadTemplates();
            this.bindTemplateEvents();
        }

        loadTemplates() {
            // Load saved templates from localStorage
            const savedTemplates = localStorage.getItem('mas_v2_templates');
            if (savedTemplates) {
                try {
                    this.templates = JSON.parse(savedTemplates);
                } catch (e) {
                    console.warn('Failed to load templates:', e);
                    this.templates = {};
                }
            }
            
            // Load predefined templates
            this.loadPredefinedTemplates();
        }

        loadPredefinedTemplates() {
            this.predefinedTemplates = {
                default: {
                    name: 'Domyślny',
                    description: 'Podstawowa konfiguracja menu',
                    settings: this.getDefaultSettings()
                },
                corporate: {
                    name: 'Corporate',
                    description: 'Profesjonalny wygląd dla firm',
                    settings: this.getCorporateSettings()
                },
                creative: {
                    name: 'Creative',
                    description: 'Kolorowy i kreatywny design',
                    settings: this.getCreativeSettings()
                },
                minimal: {
                    name: 'Minimal',
                    description: 'Minimalistyczny i czysty',
                    settings: this.getMinimalSettings()
                },
                'dark-mode': {
                    name: 'Dark Mode',
                    description: 'Ciemny motyw dla lepszej pracy w nocy',
                    settings: this.getDarkModeSettings()
                }
            };
        }

        getDefaultSettings() {
            return {
                menu_background_color: '#23282d',
                menu_text_color: '#ffffff',
                menu_border_radius_all: '5',
                menu_shadow: true,
                menu_glassmorphism: false
            };
        }

        getCorporateSettings() {
            return {
                menu_background_color: '#1e3a5f',
                menu_text_color: '#ffffff',
                menu_border_radius_all: '3',
                menu_shadow: true,
                menu_glassmorphism: false,
                menu_individual_colors: true,
                dashboard_bg: '#2563eb',
                posts_bg: '#059669',
                pages_bg: '#7c3aed'
            };
        }

        getCreativeSettings() {
            return {
                menu_background_color: '#6366f1',
                menu_text_color: '#ffffff',
                menu_border_radius_all: '12',
                menu_shadow: true,
                menu_glassmorphism: true,
                menu_gradient_enabled: true
            };
        }

        getMinimalSettings() {
            return {
                menu_background_color: '#f8fafc',
                menu_text_color: '#334155',
                menu_border_radius_all: '0',
                menu_shadow: false,
                menu_glassmorphism: false
            };
        }

        getDarkModeSettings() {
            return {
                menu_background_color: '#0f172a',
                menu_text_color: '#e2e8f0',
                menu_border_radius_all: '8',
                menu_shadow: true,
                menu_glassmorphism: true,
                menu_adaptive_colors: true
            };
        }

        bindTemplateEvents() {
            const self = this;

            // Save Template
            $('#save-template').on('click', function() {
                self.saveCurrentTemplate();
            });

            // Load Template
            $('#load-template').on('click', function() {
                self.showTemplateModal();
            });

            // Export Template
            $('#export-template').on('click', function() {
                self.exportTemplate();
            });

            // Import Template
            $('#import-template').on('click', function() {
                self.showImportModal();
            });

            // Template Selection Change
            $('#menu_active_template').on('change', function() {
                const templateId = $(this).val();
                if (templateId && templateId !== 'custom') {
                    self.applyTemplate(templateId);
                }
            });
        }

        saveCurrentTemplate() {
            const templateName = prompt('Nazwa szablonu:', '');
            if (!templateName) return;

            const settings = this.getCurrentSettings();
            const templateId = 'custom_' + Date.now();

            this.templates[templateId] = {
                name: templateName,
                description: 'Szablon niestandardowy',
                settings: settings,
                created: new Date().toISOString()
            };

            this.saveTemplates();
            this.showNotification('Szablon zapisany pomyślnie!', 'success');
        }

        getCurrentSettings() {
            const settings = {};
            $('.mas-v2-container input, .mas-v2-container select, .mas-v2-container textarea').each(function() {
                const $input = $(this);
                const name = $input.attr('name');
                if (name) {
                    if ($input.is(':checkbox')) {
                        settings[name] = $input.is(':checked');
                    } else if ($input.is(':radio')) {
                        if ($input.is(':checked')) {
                            settings[name] = $input.val();
                        }
                    } else {
                        settings[name] = $input.val();
                    }
                }
            });
            return settings;
        }

        applyTemplate(templateId) {
            let template;
            if (this.predefinedTemplates[templateId]) {
                template = this.predefinedTemplates[templateId];
            } else if (this.templates[templateId]) {
                template = this.templates[templateId];
            } else {
                console.warn('Template not found:', templateId);
                return;
            }

            this.applySettings(template.settings);
            this.showNotification(`Zastosowano szablon: ${template.name}`, 'success');
        }

        applySettings(settings) {
            Object.keys(settings).forEach(key => {
                const $input = $(`[name="${key}"]`);
                if ($input.length) {
                    if ($input.is(':checkbox')) {
                        $input.prop('checked', settings[key]);
                    } else if ($input.is(':radio')) {
                        $input.filter(`[value="${settings[key]}"]`).prop('checked', true);
                    } else {
                        $input.val(settings[key]);
                    }
                    $input.trigger('change');
                }
            });
        }

        saveTemplates() {
            localStorage.setItem('mas_v2_templates', JSON.stringify(this.templates));
        }

        exportTemplate() {
            const settings = this.getCurrentSettings();
            const exportData = {
                version: '2.0',
                timestamp: new Date().toISOString(),
                settings: settings
            };

            const dataStr = JSON.stringify(exportData, null, 2);
            const dataBlob = new Blob([dataStr], {type: 'application/json'});

            const link = document.createElement('a');
            link.href = URL.createObjectURL(dataBlob);
            link.download = `mas-v2-template-${Date.now()}.json`;
            link.click();

            this.showNotification('Szablon wyeksportowany!', 'success');
        }

        // Analytics System
        initAnalytics() {
            if (!this.getSetting('menu_analytics_enabled')) return;

            this.startAnalyticsTracking();
            this.scheduleAnalyticsReport();
        }

        startAnalyticsTracking() {
            const self = this;

            // Track clicks
            if (this.getSetting('menu_track_clicks')) {
                $('#adminmenu a').on('click', function() {
                    const href = $(this).attr('href') || $(this).closest('li').attr('id');
                    self.trackClick(href);
                });
            }

            // Track hover times
            if (this.getSetting('menu_track_hover_time')) {
                $('#adminmenu a').on('mouseenter mouseleave', function(e) {
                    self.trackHover($(this), e.type);
                });
            }

            // Track usage statistics
            if (this.getSetting('menu_usage_statistics')) {
                this.trackSession();
            }
        }

        trackClick(element) {
            const key = this.getElementKey(element);
            this.analytics.clicks[key] = (this.analytics.clicks[key] || 0) + 1;
            this.saveAnalytics();
        }

        trackHover(element, eventType) {
            const key = this.getElementKey(element);
            
            if (eventType === 'mouseenter') {
                this.analytics.hoverStart = Date.now();
            } else if (eventType === 'mouseleave' && this.analytics.hoverStart) {
                const duration = Date.now() - this.analytics.hoverStart;
                this.analytics.hoverTimes[key] = (this.analytics.hoverTimes[key] || 0) + duration;
                delete this.analytics.hoverStart;
            }
        }

        trackSession() {
            this.analytics.sessions.push({
                timestamp: Date.now(),
                userAgent: navigator.userAgent,
                viewport: {
                    width: window.innerWidth,
                    height: window.innerHeight
                }
            });
            this.saveAnalytics();
        }

        getElementKey(element) {
            if (typeof element === 'string') return element;
            return element.attr('href') || element.closest('li').attr('id') || 'unknown';
        }

        saveAnalytics() {
            localStorage.setItem('mas_v2_analytics', JSON.stringify(this.analytics));
        }

        scheduleAnalyticsReport() {
            // Send analytics report periodically
            setInterval(() => {
                this.generateAnalyticsReport();
            }, 300000); // Every 5 minutes
        }

        generateAnalyticsReport() {
            const report = {
                timestamp: Date.now(),
                clicks: this.analytics.clicks,
                hoverTimes: this.analytics.hoverTimes,
                sessions: this.analytics.sessions.length,
                topClicked: this.getTopClicked(),
                averageHoverTime: this.getAverageHoverTime()
            };

            console.log('Analytics Report:', report);
        }

        getTopClicked() {
            const clicks = Object.entries(this.analytics.clicks);
            clicks.sort((a, b) => b[1] - a[1]);
            return clicks.slice(0, 5);
        }

        getAverageHoverTime() {
            const times = Object.values(this.analytics.hoverTimes);
            if (times.length === 0) return 0;
            return times.reduce((a, b) => a + b, 0) / times.length;
        }

        // Code Editors
        initCodeEditors() {
            this.initCSSEditor();
            this.initJSEditor();
        }

        initCSSEditor() {
            const cssEditor = $('#menu_custom_css_code');
            if (cssEditor.length) {
                this.enhanceCodeEditor(cssEditor, 'css');
            }
        }

        initJSEditor() {
            const jsEditor = $('#menu_custom_js_code');
            if (jsEditor.length) {
                this.enhanceCodeEditor(jsEditor, 'javascript');
            }
        }

        enhanceCodeEditor(editor, language) {
            // Add syntax highlighting hints and features
            editor.on('keydown', function(e) {
                // Tab support
                if (e.keyCode === 9) {
                    e.preventDefault();
                    const start = this.selectionStart;
                    const end = this.selectionEnd;
                    const value = this.value;
                    this.value = value.substring(0, start) + "    " + value.substring(end);
                    this.selectionStart = this.selectionEnd = start + 4;
                }

                // Auto-complete brackets
                if (e.key === '{') {
                    setTimeout(() => {
                        const start = editor[0].selectionStart;
                        const value = editor.val();
                        if (value[start] !== '}') {
                            editor.val(value.substring(0, start) + '}' + value.substring(start));
                            editor[0].selectionStart = editor[0].selectionEnd = start;
                        }
                    }, 10);
                }
            });
        }

        // Conditional Display
        initConditionalDisplay() {
            this.checkUserRole();
            this.checkPageSpecific();
            this.checkTimeBasedDisplay();
        }

        checkUserRole() {
            const userRoles = this.getCurrentUserRoles();
            const restrictedRoles = this.getSetting('menu_user_role_restrictions') || [];
            
            if (restrictedRoles.some(role => userRoles.includes(role))) {
                this.applyRoleBasedStyling();
            }
        }

        checkPageSpecific() {
            const currentPage = window.location.pathname + window.location.search;
            const pagePatterns = this.getSetting('menu_page_specific_styling') || [];
            
            pagePatterns.forEach(pattern => {
                if (this.matchesPattern(currentPage, pattern)) {
                    this.applyPageSpecificStyling(pattern);
                }
            });
        }

        matchesPattern(url, pattern) {
            const regex = new RegExp(pattern.replace(/\*/g, '.*'));
            return regex.test(url);
        }

        checkTimeBasedDisplay() {
            if (!this.getSetting('menu_time_based_display')) return;

            const currentHour = new Date().getHours();
            // Apply dark mode during night hours
            if (currentHour < 6 || currentHour > 20) {
                this.applyNightMode();
            }
        }

        // Backup System
        initBackupSystem() {
            this.scheduleAutoBackup();
        }

        scheduleAutoBackup() {
            if (!this.getSetting('menu_auto_backup')) return;

            const frequency = this.getSetting('menu_backup_frequency') || 'weekly';
            const intervals = {
                daily: 24 * 60 * 60 * 1000,
                weekly: 7 * 24 * 60 * 60 * 1000,
                monthly: 30 * 24 * 60 * 60 * 1000
            };

            setInterval(() => {
                this.createAutoBackup();
            }, intervals[frequency]);
        }

        createAutoBackup() {
            const backup = {
                timestamp: Date.now(),
                settings: this.getCurrentSettings(),
                version: '2.0',
                type: 'auto'
            };

            const backups = JSON.parse(localStorage.getItem('mas_v2_backups') || '[]');
            backups.push(backup);

            // Keep only last 10 backups
            if (backups.length > 10) {
                backups.splice(0, backups.length - 10);
            }

            localStorage.setItem('mas_v2_backups', JSON.stringify(backups));
            console.log('Auto backup created:', backup);
        }

        // Premium Toggles
        initPremiumToggles() {
            const self = this;

            // Handle premium feature toggling
            $('#menu_premium_enabled').on('change', function() {
                const isEnabled = $(this).is(':checked');
                $('.mas-v2-premium-content').toggle(isEnabled);
                
                if (isEnabled) {
                    self.showNotification('Funkcje Premium aktywowane!', 'success');
                } else {
                    self.showNotification('Funkcje Premium wyłączone', 'info');
                }
            });

            // Other premium toggles
            $('#menu_analytics_enabled').on('change', function() {
                if ($(this).is(':checked')) {
                    self.initAnalytics();
                }
            });

            $('#menu_custom_css_enabled').on('change', function() {
                $('.mas-v2-custom-css').toggle($(this).is(':checked'));
            });

            $('#menu_custom_js_enabled').on('change', function() {
                $('.mas-v2-custom-js').toggle($(this).is(':checked'));
            });
        }

        // Utility methods
        getSetting(key) {
            const input = $(`[name="${key}"]`);
            if (input.is(':checkbox')) {
                return input.is(':checked');
            }
            return input.val();
        }

        getCurrentUserRoles() {
            return [];
        }

        applyRoleBasedStyling() {
            console.log('Applying role-based styling');
        }

        applyPageSpecificStyling(pattern) {
            console.log('Applying page-specific styling for:', pattern);
        }

        applyNightMode() {
            $('body').addClass('mas-v2-night-mode');
        }

        showNotification(message, type = 'info') {
            const notification = $(`
                <div class="mas-v2-notification mas-v2-notification-${type}">
                    <span class="mas-v2-notification-text">${message}</span>
                    <button class="mas-v2-notification-close">&times;</button>
                </div>
            `);

            $('body').append(notification);
            notification.fadeIn();

            setTimeout(() => {
                notification.fadeOut(() => {
                    notification.remove();
                });
            }, 5000);

            notification.find('.mas-v2-notification-close').on('click', function() {
                notification.fadeOut(() => {
                    notification.remove();
                });
            });
        }

        bindEvents() {
            const self = this;

            $('.mas-v2-btn-premium').on('click', function() {
                self.showUpgradeModal();
            });

            $('#menu_custom_css_code').on('input', function() {
                self.previewCustomCSS($(this).val());
            });

            $('#menu_custom_js_code').on('input', function() {
                self.validateCustomJS($(this).val());
            });
        }

        showUpgradeModal() {
            alert('Upgrade to Premium to unlock all features!');
        }

        previewCustomCSS(css) {
            $('#mas-v2-custom-css-preview').remove();
            
            if (css.trim()) {
                $('<style id="mas-v2-custom-css-preview">' + css + '</style>').appendTo('head');
            }
        }

        validateCustomJS(js) {
            try {
                new Function(js);
                $('#menu_custom_js_code').removeClass('mas-v2-error').addClass('mas-v2-success');
            } catch (e) {
                $('#menu_custom_js_code').removeClass('mas-v2-success').addClass('mas-v2-error');
            }
        }
    }

    // Initialize Premium Features when document is ready
    $(document).ready(function() {
        window.MASPremiumFeatures = new PremiumFeaturesManager();
        
        // Add notification styles
        if (!$('#mas-v2-notification-styles').length) {
            $(`<style id="mas-v2-notification-styles">
                .mas-v2-notification {
                    position: fixed;
                    top: 32px;
                    right: 20px;
                    background: white;
                    border-left: 4px solid #0073aa;
                    padding: 12px 16px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                    border-radius: 4px;
                    z-index: 100000;
                    display: none;
                    max-width: 300px;
                }
                .mas-v2-notification-success { border-left-color: #46b450; }
                .mas-v2-notification-error { border-left-color: #dc3232; }
                .mas-v2-notification-info { border-left-color: #0073aa; }
                .mas-v2-notification-close {
                    background: none;
                    border: none;
                    float: right;
                    cursor: pointer;
                    margin-left: 10px;
                }
            </style>`).appendTo('head');
        }
    });

})(jQuery); 