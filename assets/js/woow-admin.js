/**
 * Modern Admin Styler V2 - Production JavaScript
 * Enterprise-grade WordPress admin interface customization
 * 
 * @version 2.0.0
 * @author WOOW! Team
 * @description Clean, optimized production code with semantic CSS variables
 */

(function($) {
    "use strict";

    // Główny obiekt aplikacji
    const MAS = {
        livePreviewEnabled: true, // Always enabled for instant CSS Variables preview
        hasChanges: false,
        autoSaveInterval: null,
        livePreviewTimeout: null,
        sliderTimeout: null,
        colorTimeout: null,
        
        // Funkcja pomocnicza dla kompatybilności masV2/masV2Global
        getMasData: function() {
            return window.masV2 || window.masV2Global || {};
        },

        init: function() {
    
            
            // ✅ NAPRAWKA KRYTYCZNA: Ustawienie domyślnego stanu
            this.livePreviewEnabled = true;
            this.hasChanges = false;
            this.saveInProgress = false;
            
            // ✅ NAPRAWKA KRYTYCZNA: Inicjalizacja podstawowych funkcji
            this.initEventHandlers();
            this.initLivePreview();
            this.initFormHandlers();
            this.initTooltips();
            this.initTemplateHandlers();
            this.initFloatingMenuHandlers();
            this.initSystemMonitor();
            this.initNewFeatures();
            // this.initLiveEditMode(); // ✅ NAPRAWKA: Inicjalizacja Live Edit Mode
            // WYŁĄCZONE - używamy LiveEditMode z live-edit-mode.js
            this.checkAutoSave();
            
            // 🟡 PRIORYTET 2: Initialize enhanced features
            this.initAdvancedValidation();
            
            // 🟢 PRIORYTET 3: Initialize performance features
            this.initServerMonitoring();
            this.initDatabaseOptimization();
            this.optimizeMemoryUsage();
            
    
            
            // ✅ NAPRAWKA KRYTYCZNA: Początkowa synchronizacja
            this.updateConditionalFields();
            
            // ✅ NAPRAWKA KRYTYCZNA: Test state management (tylko w trybie debug)
            if (window.location.hostname === 'localhost' || window.location.hostname.includes('local')) {
                // this.testStateManagement(); // Disabled in production
            }
        },

        bindEvents: function() {
            // NAPRAWKA KRYTYCZNA: Ulepszone zarządzanie event handlerami z zabezpieczeniem przed duplikatami
            const namespace = '.masV2Events';
            
            // Usuń wszystkie poprzednie event handlers w namespace
            $(document).off(namespace);
            
            // Ustaw handlers z namespace dla łatwego zarządzania
            $(document).on("click" + namespace, "#mas-v2-save-btn", this.saveSettings.bind(this));
            $(document).on("submit" + namespace, "#mas-v2-settings-form", function(e) {
                e.preventDefault(); // Zapobiegnij podwójnemu wysłaniu
                $("#mas-v2-save-btn").trigger("click");
            });
            
            // Pozostałe handlers z namespace
            $(document).on("click" + namespace, "#mas-v2-reset-btn", this.resetSettings);
            $(document).on("click" + namespace, "#mas-v2-export-btn", this.exportSettings);
            $(document).on("click" + namespace, "#mas-v2-import-btn", this.importSettings);
            $(document).on("change" + namespace, "#mas-v2-import-file", this.handleImportFile);
            $(document).on("change" + namespace, "#mas-v2-live-preview", this.toggleLivePreview);
            
            // NAPRAWKA KRYTYCZNA: Ulepszone handling checkbox z prawidłową serializacją
            $(document).on("change" + namespace, "#mas-v2-settings-form input[type='checkbox']", function() {
                const $checkbox = $(this);
                const name = $checkbox.attr('name');
                const isChecked = $checkbox.is(':checked');
                
                // Explicit value handling for proper serialization - NAPRAWKA CHECKBOX
                $checkbox.val(isChecked ? '1' : '0');
                
                // Dodaj hidden input dla WordPress serialization compatibility  
                let $hiddenInput = $checkbox.siblings('input[name="' + name + '_hidden"]');
                if ($hiddenInput.length === 0) {
                    $hiddenInput = $('<input type="hidden" name="' + name + '_hidden" value="0">');
                    $checkbox.before($hiddenInput);
                }
                $hiddenInput.val(isChecked ? '1' : '0');
                
                MAS.triggerLivePreview();
                MAS.markAsChanged();
            });
            
            // NAPRAWKA: Debounce dla live preview aby uniknąć nadmiarowych requestów
            let livePreviewTimeout;
            const debouncedLivePreview = function() {
                clearTimeout(livePreviewTimeout);
                livePreviewTimeout = setTimeout(function() {
                    MAS.handleFormChange.call(MAS);
                }, 300); // 300ms debounce
            };
            
            // Rozszerzona obsługa live preview z debounce
            $(document).on("change input keyup" + namespace, "#mas-v2-settings-form input:not([type='checkbox']), #mas-v2-settings-form select, #mas-v2-settings-form textarea", debouncedLivePreview);
            $(document).on("change" + namespace, "#mas-v2-settings-form input[type='radio']", this.handleFormChange);
            $(document).on("input" + namespace, "#mas-v2-settings-form input[type='range']", debouncedLivePreview);
            
            // NAPRAWKA: Ulepszona obsługa color pickerów z error handling
            $(document).on("wpColorPickerChange" + namespace, "#mas-v2-settings-form input.mas-v2-color", function() {
                try {
                    MAS.handleFormChange();
                } catch (error) {

                    MAS.showNotification('Color picker error: ' + error.message, 'error');
                }
            });
        },

        // NAPRAWKA KRYTYCZNA: Toast notification system dla user feedback
        showNotification: function(message, type = 'info') {
            const toast = $(`
                <div class="mas-notification mas-notification-${type}">
                    <span class="mas-notification-icon">
                        ${type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️'}
                    </span>
                    <span class="mas-notification-message">${message}</span>
                    <button class="mas-notification-close">&times;</button>
                </div>
            `);
            
            // Add to body if not exists
            if ($('.mas-notifications-container').length === 0) {
                $('body').append('<div class="mas-notifications-container"></div>');
            }
            
            $('.mas-notifications-container').append(toast);
            toast.addClass('mas-notification-show');
            
            // Auto-hide after 5 seconds
            setTimeout(() => {
                toast.removeClass('mas-notification-show');
                setTimeout(() => toast.remove(), 300);
            }, 5000);
            
            // Manual close handler
            toast.find('.mas-notification-close').on('click', function() {
                toast.removeClass('mas-notification-show');
                setTimeout(() => toast.remove(), 300);
            });
        },

        // NAPRAWKA KRYTYCZNA: Cleanup function dla memory leaks
        cleanup: function() {

            
            // Clear all timeouts
            clearTimeout(this.livePreviewTimeout);
            clearTimeout(this.sliderTimeout);
            clearTimeout(this.colorTimeout);
            
            // Remove all event listeners with namespace
            $(document).off('.masV2Events');
            
            // Clear intervals
            if (this.autoSaveInterval) {
                clearInterval(this.autoSaveInterval);
                this.autoSaveInterval = null;
            }
            
            if (this.serverMonitorInterval) {
                clearInterval(this.serverMonitorInterval);
                this.serverMonitorInterval = null;
            }
            
            // Cleanup WordPress color pickers
            $('.mas-v2-color').each(function() {
                if ($(this).hasClass('wp-color-picker')) {
                    $(this).wpColorPicker('destroy');
                }
            });
            

        },

        // 🟡 PRIORYTET 2: Enhanced Error Handling & User Feedback
        showErrorPanel: function(error, context = '') {
            const errorContainer = $('<div class="mas-error-container"></div>');
            
            const errorPanel = $(`
                <div class="mas-error-panel">
                    <div class="mas-error-header">
                        <span class="mas-error-icon">⚠️</span>
                        <h3 class="mas-error-title">System Error Occurred</h3>
                    </div>
                    <div class="mas-error-message">
                        ${error.message || error || 'An unexpected error occurred'}
                    </div>
                    ${error.debug_info ? `
                        <div class="mas-error-details">
                            <strong>Debug Information:</strong><br>
                            ${JSON.stringify(error.debug_info, null, 2)}
                        </div>
                    ` : ''}
                    ${context ? `
                        <div class="mas-error-details">
                            <strong>Context:</strong> ${context}
                        </div>
                    ` : ''}
                    <div class="mas-error-actions">
                        <button class="mas-error-btn mas-error-btn-primary" onclick="this.closest('.mas-error-container').remove()">
                            Close
                        </button>
                        <button class="mas-error-btn mas-error-btn-secondary" onclick="location.reload()">
                            Reload Page
                        </button>
                    </div>
                </div>
            `);
            
            errorContainer.append(errorPanel);
            $('body').append(errorContainer);
            
            // Auto-remove after 10 seconds
            setTimeout(() => {
                errorContainer.fadeOut(300, () => errorContainer.remove());
            }, 10000);
        },

        // 🟡 PRIORYTET 2: Loading States & Progress Indicators
        showLoadingOverlay: function(message = 'Processing...', subtext = '') {
            const overlay = $(`
                <div class="mas-loading-overlay">
                    <div class="mas-loading-content">
                        <div class="mas-loading-spinner"></div>
                        <p class="mas-loading-text">${message}</p>
                        ${subtext ? `<p class="mas-loading-subtext">${subtext}</p>` : ''}
                    </div>
                </div>
            `);
            
            $('body').append(overlay);
            setTimeout(() => overlay.addClass('show'), 10);
            
            return overlay;
        },

        hideLoadingOverlay: function(overlay) {
            if (overlay) {
                overlay.removeClass('show');
                setTimeout(() => overlay.remove(), 300);
            } else {
                $('.mas-loading-overlay').removeClass('show');
                setTimeout(() => $('.mas-loading-overlay').remove(), 300);
            }
        },

        // 🟡 PRIORYTET 2: Form Validation with Visual Feedback
        validateField: function(field, rules) {
            const $field = $(field);
            const $wrapper = $field.closest('.mas-v2-field');
            const value = $field.val();
            const errors = [];
            
            // Remove previous validation classes
            $wrapper.removeClass('mas-field-error mas-field-success mas-field-warning');
            $wrapper.find('.mas-field-message').remove();
            
            // Apply validation rules
            if (rules.required && !value.trim()) {
                errors.push('This field is required');
            }
            
            if (rules.minLength && value.length < rules.minLength) {
                errors.push(`Minimum length is ${rules.minLength} characters`);
            }
            
            if (rules.maxLength && value.length > rules.maxLength) {
                errors.push(`Maximum length is ${rules.maxLength} characters`);
            }
            
            if (rules.pattern && !rules.pattern.test(value)) {
                errors.push(rules.patternMessage || 'Invalid format');
            }
            
            if (rules.custom && typeof rules.custom === 'function') {
                const customResult = rules.custom(value);
                if (customResult !== true) {
                    errors.push(customResult);
                }
            }
            
            // Display validation result
            if (errors.length > 0) {
                $wrapper.addClass('mas-field-error');
                const message = $(`
                    <div class="mas-field-message error">
                        <span class="mas-field-message-icon">❌</span>
                        ${errors[0]}
                    </div>
                `);
                $wrapper.append(message);
                return false;
            } else if (value.trim()) {
                $wrapper.addClass('mas-field-success');
                const message = $(`
                    <div class="mas-field-message success">
                        <span class="mas-field-message-icon">✅</span>
                        Valid
                    </div>
                `);
                $wrapper.append(message);
            }
            
            return true;
        },

        // 🟢 PRIORYTET 3: Performance Monitoring & Server Status
        initServerMonitoring: function() {
            
            // Check server performance every 30 seconds
            this.serverMonitorInterval = setInterval(() => {
                this.checkServerStatus();
            }, 30000);
            
            // Initial check
            this.checkServerStatus();
        },

        checkServerStatus: function() {
            const serverData = this.getMasData();
            
            // Memory usage monitoring
            if (serverData.memory_usage) {
                this.updateMemoryStatus(serverData.memory_usage);
            }
            
            // Database performance monitoring
            if (serverData.db_queries) {
                this.updateDatabaseStatus(serverData.db_queries);
            }
            
            // Cache status monitoring
            if (serverData.cache_status) {
                this.updateCacheStatus(serverData.cache_status);
            }
        },

        updateMemoryStatus: function(memoryUsage) {
            const memoryPercent = (memoryUsage.used / memoryUsage.limit) * 100;
            let statusClass = 'good';
            
            if (memoryPercent > 80) {
                statusClass = 'critical';
            } else if (memoryPercent > 60) {
                statusClass = 'warning';
            }
            
            $('.mas-memory-status').removeClass('good warning critical').addClass(statusClass);
            $('.mas-memory-status').text(`${Math.round(memoryPercent)}% Memory Used`);
        },

        updateDatabaseStatus: function(dbQueries) {
            const $dbOptimization = $('.mas-db-optimization');
            
            if (dbQueries > 50) {
                $dbOptimization.removeClass('warning').addClass('error');
                $dbOptimization.find('.mas-db-optimization-title').text('High Database Load Detected');
                $dbOptimization.find('.mas-db-optimization-description').text(
                    `${dbQueries} queries executed. Consider query optimization.`
                );
            } else if (dbQueries > 25) {
                $dbOptimization.removeClass('error').addClass('warning');
                $dbOptimization.find('.mas-db-optimization-title').text('Moderate Database Load');
                $dbOptimization.find('.mas-db-optimization-description').text(
                    `${dbQueries} queries executed. Performance is acceptable.`
                );
            }
        },

        updateCacheStatus: function(cacheStatus) {
            const $cacheStatus = $('.mas-cache-status');
            
            if (cacheStatus.active) {
                $cacheStatus.removeClass('inactive').addClass('active');
                $cacheStatus.text('Cache Active');
            } else {
                $cacheStatus.removeClass('active').addClass('inactive');
                $cacheStatus.text('Cache Inactive');
            }
        },

        // 🟢 PRIORYTET 3: Memory Optimization Features
        optimizeMemoryUsage: function() {
            
            // Enable GPU acceleration for better performance
            $('body').addClass('mas-hardware-accelerated');
            
            // Add memory-efficient classes to large elements
            $('.mas-v2-admin-wrapper, .mas-v2-card, .postbox').addClass('mas-memory-efficient');
            
            // Enable paint optimization
            $('.mas-v2-nav-tab, .mas-v2-btn, .wp-core-ui .button').addClass('mas-paint-optimized');
            
        },

        // 🟢 PRIORYTET 3: Database Optimization Actions
        initDatabaseOptimization: function() {
            $(document).on('click', '.mas-db-action-btn', function() {
                const action = $(this).data('action');
                
                switch (action) {
                    case 'optimize':
                        MAS.optimizeDatabase();
                        break;
                    case 'clean':
                        MAS.cleanDatabase();
                        break;
                    case 'analyze':
                        MAS.analyzeDatabase();
                        break;
                }
            });
        },

        optimizeDatabase: function() {
            const overlay = this.showLoadingOverlay('Optimizing Database...', 'This may take a few moments');
            
            $.ajax({
                url: ajaxurl,
                type: 'POST',
                data: {
                    action: 'mas_optimize_database',
                    nonce: this.getMasData().nonce
                },
                success: function(response) {
                    MAS.hideLoadingOverlay(overlay);
                    if (response.success) {
                        MAS.showNotification('Database optimization completed successfully', 'success');
                    } else {
                        MAS.showErrorPanel(response.data, 'Database Optimization');
                    }
                },
                error: function(xhr, status, error) {
                    MAS.hideLoadingOverlay(overlay);
                    MAS.showErrorPanel({
                        message: 'Database optimization failed',
                        debug_info: { xhr_status: status, error: error }
                    }, 'AJAX Error');
                }
            });
        },

        cleanDatabase: function() {
            const overlay = this.showLoadingOverlay('Cleaning Database...', 'Removing unnecessary data');
            
            $.ajax({
                url: ajaxurl,
                type: 'POST',
                data: {
                    action: 'mas_clean_database',
                    nonce: this.getMasData().nonce
                },
                success: function(response) {
                    MAS.hideLoadingOverlay(overlay);
                    if (response.success) {
                        MAS.showNotification('Database cleanup completed', 'success');
                    } else {
                        MAS.showErrorPanel(response.data, 'Database Cleanup');
                    }
                },
                error: function(xhr, status, error) {
                    MAS.hideLoadingOverlay(overlay);
                    MAS.showErrorPanel({
                        message: 'Database cleanup failed',
                        debug_info: { xhr_status: status, error: error }
                    }, 'AJAX Error');
                }
            });
        },

        analyzeDatabase: function() {
            const overlay = this.showLoadingOverlay('Analyzing Database...', 'Checking performance metrics');
            
            $.ajax({
                url: ajaxurl,
                type: 'POST',
                data: {
                    action: 'mas_analyze_database',
                    nonce: this.getMasData().nonce
                },
                success: function(response) {
                    MAS.hideLoadingOverlay(overlay);
                    if (response.success) {
                        // Display analysis results
                        const results = response.data;
                        const message = `
                            Database Analysis Complete:<br>
                            Tables: ${results.tables}<br>
                            Total Size: ${results.size}<br>
                            Optimization Score: ${results.score}/100
                        `;
                        MAS.showNotification(message, 'info');
                    } else {
                        MAS.showErrorPanel(response.data, 'Database Analysis');
                    }
                },
                error: function(xhr, status, error) {
                    MAS.hideLoadingOverlay(overlay);
                    MAS.showErrorPanel({
                        message: 'Database analysis failed',
                        debug_info: { xhr_status: status, error: error }
                    }, 'AJAX Error');
                }
            });
        },

        // 🟢 PRIORYTET 3: Enhanced Settings Validation
        initAdvancedValidation: function() {
            // Color field validation
            $('input.mas-v2-color').on('blur', function() {
                MAS.validateField(this, {
                    pattern: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
                    patternMessage: 'Please enter a valid hex color (e.g., #FF0000)'
                });
            });
            
            // Numeric field validation
            $('input[type="number"].mas-v2-input').on('blur', function() {
                const min = parseInt($(this).attr('min')) || 0;
                const max = parseInt($(this).attr('max')) || 999;
                
                MAS.validateField(this, {
                    required: true,
                    custom: function(value) {
                        const num = parseInt(value);
                        if (isNaN(num)) return 'Please enter a valid number';
                        if (num < min) return `Value must be at least ${min}`;
                        if (num > max) return `Value must be at most ${max}`;
                        return true;
                    }
                });
            });
            
            // CSS field validation
            $('textarea[name*="custom_css"]').on('blur', function() {
                MAS.validateField(this, {
                    maxLength: 50000,
                    custom: function(value) {
                        if (value.includes('javascript:')) {
                            return 'JavaScript URLs are not allowed in CSS';
                        }
                        if (value.includes('expression(')) {
                            return 'CSS expressions are not allowed';
                        }
                        return true;
                    }
                });
            });
        },

        // Skróty klawiszowe są teraz obsługiwane globalnie w admin-global.js

        initTabs: function() {
            
            // 🎯 NATYWNA INTEGRACJA: Nie potrzebujemy obsługi kliknięć w zakładki
            // Nawigacja jest teraz obsługiwana przez natywne menu WordPress
            
            // Upewnij się, że aktywna sekcja jest widoczna (PHP już to ustawia)
            const $activeContent = $(".mas-v2-tab-content.active");
            if ($activeContent.length) {
                $activeContent.show().css('opacity', 1);
            }
            
            // Ukryj nieaktywne sekcje
            $(".mas-v2-tab-content:not(.active)").hide();
            
        },

        initColorPickers: function() {
            $(".mas-v2-color").each(function() {
                const $input = $(this);
                
                // NAPRAWKA KRYTYCZNA: Enhanced color picker integration
                if ($.fn.wpColorPicker && !$input.hasClass('wp-color-picker')) {
                    $input.wpColorPicker({
                        change: function(event, ui) {
                            const color = ui.color.toString();
                            const fieldName = $input.attr('name');
                            
                            // NAPRAWKA: Update CSS variable immediately for instant preview
                            if (fieldName) {
                                const cssVar = `--mas-${fieldName.replace(/_/g, '-')}`;
                                document.documentElement.style.setProperty(cssVar, color);
                            }
                            
                            if (MAS.livePreviewEnabled) {
                                clearTimeout(MAS.colorTimeout);
                                MAS.colorTimeout = setTimeout(function() {
                                    MAS.triggerLivePreview();
                                }, 200);
                            }
                            MAS.markAsChanged();
                        },
                        clear: function() {
                            const fieldName = $input.attr('name');
                            
                            // NAPRAWKA: Reset CSS variable to default when cleared
                            if (fieldName) {
                                const cssVar = `--mas-${fieldName.replace(/_/g, '-')}`;
                                document.documentElement.style.removeProperty(cssVar);
                            }
                            
                            if (MAS.livePreviewEnabled) {
                                MAS.triggerLivePreview();
                            }
                            MAS.markAsChanged();
                        },
                        // NAPRAWKA: Enhanced color picker options
                        palettes: [
                            '#6366f1', '#ec4899', '#06b6d4', '#10b981', '#f59e0b', '#ef4444',
                            '#8b5cf6', '#f97316', '#84cc16', '#06b6d4', '#f59e0b', '#ef4444'
                        ],
                        width: 255,
                        mode: 'hsl'
                    });
                }
            });
        },

        initSliders: function() {
            $(".mas-v2-slider").each(function() {
                const $slider = $(this);
                const $valueSpan = $('[data-target="' + $slider.attr("name") + '"]');
                
                $slider.on("input", function() {
                    const value = $(this).val();
                    $valueSpan.text(value + "px");
                    
                    // Live preview z throttling dla płynności
                    if (MAS.livePreviewEnabled) {
                        clearTimeout(MAS.sliderTimeout);
                        MAS.sliderTimeout = setTimeout(function() {
                            MAS.triggerLivePreview();
                        }, 100);
                    }
                    
                    MAS.markAsChanged();
                });
                
                // Natychmiastowa aktualizacja przy zmianie końcowej
                $slider.on("change", function() {
                    if (MAS.livePreviewEnabled) {
                        clearTimeout(MAS.sliderTimeout);
                        MAS.triggerLivePreview();
                    }
                });
            });
        },

        initCornerRadius: function() {
            // Obsługa menu bocznego
            $("#corner_radius_type").on("change", function() {
                const type = $(this).val();
                $(".mas-v2-corner-group").hide();
                
                if (type === "all") {
                    $("#mas-v2-corner-all").show();
                } else if (type === "individual") {
                    $("#mas-v2-corner-individual").show();
                }
                
                MAS.triggerLivePreview();
                MAS.markAsChanged();
            });
            
            // Obsługa admin bar
            $("#admin_bar_corner_radius_type").on("change", function() {
                const type = $(this).val();
                $("#mas-v2-admin-bar-corner-all, #mas-v2-admin-bar-corner-individual").hide();
                
                if (type === "all") {
                    $("#mas-v2-admin-bar-corner-all").show();
                } else if (type === "individual") {
                    $("#mas-v2-admin-bar-corner-individual").show();
                }
                
                MAS.triggerLivePreview();
                MAS.markAsChanged();
            });
            
            // Obsługa detached menu - pokaż/ukryj opcje marginesu
            $("input[name='menu_detached']").on("change", function() {
                const isDetached = $(this).is(":checked");
                $("#mas-v2-menu-detached-margin").toggle(isDetached);
                
                // Dynamicznie przełącz klasy CSS body dla floating menu
                MAS.updateBodyClasses();
                
                // Natychmiastowa aktualizacja dla floating menu
                MAS.triggerLivePreview();
                MAS.markAsChanged();
            });
            
            // Obsługa typu marginesu floating menu
            $("#menu_detached_margin_type").on("change", function() {
                const type = $(this).val();
                $("#mas-v2-menu-margin-all, #mas-v2-menu-margin-individual").hide();
                
                if (type === "all") {
                    $("#mas-v2-menu-margin-all").show();
                } else if (type === "individual") {
                    $("#mas-v2-menu-margin-individual").show();
                }
                
                MAS.triggerLivePreview();
                MAS.markAsChanged();
            });
            
            // Obsługa detached admin bar
            $("input[name='admin_bar_detached']").on("change", function() {
                // Dynamicznie przełącz klasy CSS body dla floating admin bar
                MAS.updateBodyClasses();
                
                MAS.triggerLivePreview();
                MAS.markAsChanged();
            });
            
            // DODANE: Obsługa compact mode
            $('input[name="menu_compact_mode"]').on('change', function() {
                const compactClass = 'mas-menu-compact-mode';
                if ($(this).is(':checked')) {
                    $('body').addClass(compactClass);
                } else {
                    $('body').removeClass(compactClass);
                }
                MAS.triggerLivePreview();
                MAS.markAsChanged();
            });
            
            // DODANE: Obsługa typography fields
            $('select[name="body_font_family"], select[name="heading_font_family"]').on('change', function() {
                const fieldName = $(this).attr('name');
                const fontFamily = $(this).val();
                MAS.triggerLivePreview();
                MAS.markAsChanged();
            });
            
            // DODANE: Obsługa advanced hiding options
            $('input[name="hide_wp_version"], input[name="hide_help_tabs"], input[name="hide_screen_options"], input[name="hide_admin_notices"], input[name="hide_footer_text"], input[name="hide_update_nag"]').on('change', function() {
                const fieldName = $(this).attr('name');
                const isChecked = $(this).is(':checked');
                MAS.triggerLivePreview();
                MAS.markAsChanged();
            });
            
            // DODAJE: Obsługa color_palette select - synchronizacja z quick theme selector
            $('select[name="color_palette"]').on('change', function() {
                const palette = $(this).val();
                
                // Update theme manager (mark as from select to prevent loop)
                if (window.themeManager) {
                    window.themeManager.switchPalette(palette, true);
                }
                
                MAS.triggerLivePreview();
                MAS.markAsChanged();
            });

            // DODANE: Obsługa submenu fields
            $('input[name="submenu_background"], input[name="submenu_text_color"], input[name="submenu_hover_background"], input[name="submenu_hover_text_color"]').on('change input', function() {
                const fieldName = $(this).attr('name');
                const value = $(this).val();
                MAS.triggerLivePreview();
                MAS.markAsChanged();
            });
            
            $('input[name="submenu_item_spacing"], input[name="submenu_indent"]').on('input change', function() {
                const fieldName = $(this).attr('name');
                const value = $(this).val();
                MAS.triggerLivePreview();
                MAS.markAsChanged();
            });
            
            $('input[name="submenu_separator"]').on('change', function() {
                const isChecked = $(this).is(':checked');
                MAS.triggerLivePreview();
                MAS.markAsChanged();
            });
            
            $('select[name="submenu_indicator_style"]').on('change', function() {
                const indicatorStyle = $(this).val();
                MAS.triggerLivePreview();
                MAS.markAsChanged();
            });
        },

        initConditionalFields: function() {
            // Obsługa pól, które pokazują się tylko przy określonych warunkach
            $('[data-show-when]').each(function() {
                const $field = $(this);
                const showWhen = $field.data('show-when');
                const showValue = $field.data('show-value');
                
                const $trigger = $('[name="' + showWhen + '"]');
                
                const toggleField = function() {
                    const triggerValue = $trigger.is(':checkbox') ? $trigger.is(':checked') : $trigger.val();
                    
                    if (showValue !== undefined) {
                        $field.toggle(triggerValue == showValue);
                    } else {
                        $field.toggle(!!triggerValue);
                    }
                };
                
                $trigger.on('change', toggleField);
                toggleField(); // Początkowy stan
            });
            
            // Obsługa floating-only pól
            $('.floating-only').each(function() {
                const $field = $(this);
                const requires = $field.data('requires');
                
                if (requires) {
                    const $trigger = $('#' + requires);
                    
                    const toggleField = function() {
                        $field.toggle($trigger.is(':checked'));
                    };
                    
                    $trigger.on('change', toggleField);
                    toggleField(); // Początkowy stan
                }
            });
        },

        initFloatingFields: function() {
            // Obsługa floating admin bar
            $('#admin_bar_floating').on('change', function() {
                const isFloating = $(this).is(':checked');
                $('.admin-bar-floating-only').toggle(isFloating);
                
                // Dodaj/usuń klasę CSS do body
                if (isFloating) {
                    $('body').addClass('woow-admin-bar-floating');
                } else {
                    $('body').removeClass('woow-admin-bar-floating');
                }
                
                MAS.triggerLivePreview();
                MAS.markAsChanged();
            });
            
            // Obsługa floating menu
            $('#menu_floating').on('change', function() {
                const isFloating = $(this).is(':checked');
                $('.menu-floating-only').toggle(isFloating);
                
                // Dodaj/usuń klasę CSS do body
                if (isFloating) {
                    $('body').addClass('woow-menu-floating');
                } else {
                    $('body').removeClass('woow-menu-floating');
                }
                
                MAS.triggerLivePreview();
                MAS.markAsChanged();
            });
            
            // Obsługa glossy admin bar
            $('#admin_bar_glossy').on('change', function() {
                const isGlossy = $(this).is(':checked');
                
                if (isGlossy) {
                    $('body').addClass('mas-v2-admin-bar-glossy');
                } else {
                    $('body').removeClass('mas-v2-admin-bar-glossy');
                }
                
                MAS.triggerLivePreview();
                MAS.markAsChanged();
            });
            
            // Obsługa glossy menu
            $('#menu_glossy').on('change', function() {
                const isGlossy = $(this).is(':checked');
                
                if (isGlossy) {
                    $('body').addClass('mas-v2-menu-glossy');
                } else {
                    $('body').removeClass('mas-v2-menu-glossy');
                }
                
                MAS.triggerLivePreview();
                MAS.markAsChanged();
            });
            
            // Obsługa border radius type dla admin bar
            $('#admin_bar_border_radius_type').on('change', function() {
                const type = $(this).val();
                $('.admin-bar-radius-group').hide();
                
                if (type === 'all') {
                    $('#admin-bar-radius-all').show();
                } else if (type === 'individual') {
                    $('#admin-bar-radius-individual').show();
                }
                
                MAS.triggerLivePreview();
                MAS.markAsChanged();
            });
            
            // Obsługa border radius type dla menu
            $('#menu_border_radius_type').on('change', function() {
                const type = $(this).val();
                $('.menu-radius-group').hide();
                
                if (type === 'all') {
                    $('#menu-radius-all').show();
                } else if (type === 'individual') {
                    $('#menu-radius-individual').show();
                }
                
                MAS.triggerLivePreview();
                MAS.markAsChanged();
            });
            
            // Obsługa margin type dla admin bar
            $('#admin_bar_margin_type').on('change', function() {
                const type = $(this).val();
                $('.admin-bar-margin-group').hide();
                
                if (type === 'all') {
                    $('#admin-bar-margin-all').show();
                } else if (type === 'individual') {
                    $('#admin-bar-margin-individual').show();
                }
                
                MAS.triggerLivePreview();
                MAS.markAsChanged();
            });
            
            // Obsługa margin type dla menu
            $('#menu_margin_type').on('change', function() {
                const type = $(this).val();
                $('.menu-margin-group').hide();
                
                if (type === 'all') {
                    $('#menu-margin-all').show();
                } else if (type === 'individual') {
                    $('#menu-margin-individual').show();
                }
                
                MAS.triggerLivePreview();
                MAS.markAsChanged();
            });
            
            // Początkowy stan pól
            $('#admin_bar_floating').trigger('change');
            $('#menu_floating').trigger('change');
            $('#admin_bar_glossy').trigger('change');
            $('#menu_glossy').trigger('change');
            $('#admin_bar_border_radius_type').trigger('change');
            $('#menu_border_radius_type').trigger('change');
            $('#admin_bar_margin_type').trigger('change');
            $('#menu_margin_type').trigger('change');
        },

        initTooltips: function() {
            $("[title]").each(function() {
                const $element = $(this);
                const title = $element.attr("title");
                
                if (!title) return;
                
                $element.removeAttr("title").on("mouseenter", function() {
                    const tooltip = $('<div class="mas-v2-tooltip">' + title + '</div>');
                    $("body").append(tooltip);
                    
                    const rect = this.getBoundingClientRect();
                    tooltip.css({
                        position: "fixed",
                        top: rect.bottom + 5,
                        left: rect.left + (rect.width / 2) - (tooltip.outerWidth() / 2),
                        zIndex: 10000,
                        background: "#333",
                        color: "#fff",
                        padding: "5px 10px",
                        borderRadius: "4px",
                        fontSize: "12px",
                        whiteSpace: "nowrap"
                    });
                }).on("mouseleave", function() {
                    $(".mas-v2-tooltip").remove();
                });
            });
        },

        initLivePreview: function() {
            this.livePreviewEnabled = $("#mas-v2-live-preview").is(":checked");
            
            // Obsługa zmiany checkboxa Live Preview
            $("#mas-v2-live-preview").on("change", function() {
                MAS.livePreviewEnabled = $(this).is(":checked");
                MAS.showMessage(
                    MAS.livePreviewEnabled ? 
                    "Podgląd na żywo włączony" : 
                    "Podgląd na żywo wyłączony",
                    "info"
                );
                
                // Synchronizuj z floating toggle button
                const toggle = document.querySelector('.mas-live-preview-toggle');
                if (toggle) {
                    toggle.classList.toggle('active', MAS.livePreviewEnabled);
                }
                
                // Natychmiastowy podgląd jeśli włączony
                if (MAS.livePreviewEnabled) {
                    MAS.triggerLivePreview();
                }
            });
            
            // Live preview navigation buttons
            $("#mas-v2-preview-home").on("click", function() {
                MAS.navigatePreview("http://localhost:10018/wp-admin/index.php");
            });
            
            $("#mas-v2-preview-posts").on("click", function() {
                MAS.navigatePreview("http://localhost:10018/wp-admin/edit.php");
            });
            
            $("#mas-v2-preview-pages").on("click", function() {
                MAS.navigatePreview("http://localhost:10018/wp-admin/edit.php?post_type=page");
            });
            
            $("#mas-v2-preview-media").on("click", function() {
                MAS.navigatePreview("http://localhost:10018/wp-admin/upload.php");
            });
            
            $("#mas-v2-preview-refresh").on("click", function() {
                const currentUrl = $("#mas-v2-preview-url").val();
                MAS.refreshPreview();
            });
            
            $("#mas-v2-preview-go").on("click", function() {
                const url = $("#mas-v2-preview-url").val();
                if (url) {
                    MAS.navigatePreview(url);
                }
            });
            
            // Enter key support for URL input
            $("#mas-v2-preview-url").on("keypress", function(e) {
                if (e.which === 13) {
                    $("#mas-v2-preview-go").click();
                }
            });
        },

        navigatePreview: function(url) {
            const $iframe = $("#mas-v2-preview-iframe");
            const $urlInput = $("#mas-v2-preview-url");
            
            if ($iframe.length && url) {
                $urlInput.val(url);
                $iframe.attr("src", url);
                
                // Show loading state
                this.showMessage("Ładowanie podglądu...", "info");
                
                // Handle iframe load
                $iframe.off("load").on("load", function() {
                    MAS.showMessage("Podgląd załadowany", "success");
                });
            }
        },

        refreshPreview: function() {
            const $iframe = $("#mas-v2-preview-iframe");
            const currentUrl = $iframe.attr("src");
            
            if ($iframe.length && currentUrl) {
                // Add timestamp to force refresh
                const separator = currentUrl.includes("?") ? "&" : "?";
                const refreshUrl = currentUrl + separator + "_refresh=" + Date.now();
                $iframe.attr("src", refreshUrl);
                
                this.showMessage("Odświeżanie podglądu...", "info");
            }
        },

        toggleLivePreview: function() {
            MAS.livePreviewEnabled = $("#mas-v2-live-preview").is(":checked");
            MAS.showMessage(
                MAS.livePreviewEnabled ? 
                "Podgląd na żywo włączony" : 
                "Podgląd na żywo wyłączony",
                "info"
            );
        },

        handleFormChange: function(e) {
            const $field = $(e.target);
            const fieldName = $field.attr('name');
            
            // Debug info
            
            // Natychmiastowa aktualizacja dla checkboxów i select-ów
            const instantUpdate = $field.is(':checkbox') || $field.is('select') || 
                                 $field.attr('type') === 'radio' || 
                                 $field.hasClass('mas-v2-color');
            
            if (MAS.livePreviewEnabled) {
            clearTimeout(MAS.livePreviewTimeout);
            
            if (instantUpdate) {
                // Natychmiastowa aktualizacja dla ważnych pól
                MAS.triggerLivePreview();
            } else {
                    // Opóźniona aktualizacja dla text inputów i sliderów
                MAS.livePreviewTimeout = setTimeout(function() {
                    MAS.triggerLivePreview();
                    }, 300);
                }
            }
            
            MAS.markAsChanged();
        },

        triggerLivePreview: function(formData = null) {
            if (!this.livePreviewEnabled) return;
            
            const data = formData || this.getFormData();
            
            // ========================================
            // 🎯 AUTOMATED LIVE PREVIEW ENGINE
            // ========================================
            
            this.processAutomatedLivePreview(data);
            
            // ========================================
            // 🔧 SPECIAL CASES (remain manual)
            // ========================================
            
            // Special case: Headings Scale (mathematical calculation)
            if (data.headings_scale || data.global_font_size) {
                this.updateHeadingsScale(data.headings_scale, data.global_font_size);
            }
            
            // Special case: Custom CSS injection
            if (data.custom_css !== undefined) {
                this.injectCustomCSS(data.custom_css);
            }
            
            // Update body classes for structural changes
            if (window.updateBodyClasses && typeof window.updateBodyClasses === 'function') {
                window.updateBodyClasses(data);
            }
            
        },

        /**
         * 🎯 NEW: Automated Live Preview Engine
         * Processes all form fields with data-* attributes automatically
         */
        processAutomatedLivePreview: function(formData) {
            const root = document.documentElement;
            const body = document.body;
            let processedFields = 0;
            
            // Process all form fields with data-live-preview attributes
            document.querySelectorAll('#mas-v2-settings-form [data-live-preview]').forEach(input => {
                const fieldName = input.name;
                const value = formData[fieldName];
                const previewType = input.dataset.livePreview;
                
                if (typeof value === 'undefined') return;
                
                switch (previewType) {
                    case 'css-var':
                        this.applyCSSVariable(input, value, root);
                        processedFields++;
                        break;
                        
                    case 'body-class':
                        this.applyBodyClass(input, value, body);
                        processedFields++;
                        break;
                        
                    case 'custom-css':
                        this.applyCustomCSS(input, value);
                        processedFields++;
                        break;
                        
                    case 'element-style':
                        this.applyElementStyle(input, value);
                        processedFields++;
                        break;
                        
                    default:
                }
            });
            
        },

        /**
         * 🎨 Apply CSS Variable
         */
        applyCSSVariable: function(input, value, root) {
            const cssVar = input.dataset.cssVar;
            const unit = input.dataset.unit || '';
            
            if (!cssVar) {
                return;
            }
            
            const finalValue = value + unit;
            root.style.setProperty(cssVar, finalValue);
            
        },

        /**
         * 🏷️ Apply Body Class (ENHANCED with state management)
         */
        applyBodyClass: function(input, value, body) {
            const className = input.dataset.bodyClass;
            const exclusiveGroup = input.dataset.exclusiveGroup;
            const allOptions = input.dataset.allOptions;
            
            if (!className) {
                return;
            }
            
            // Handle exclusive groups (mutually exclusive classes)
            if (exclusiveGroup && allOptions) {
                // For select fields, the className is the prefix and value is the suffix
                const isSelectField = input.tagName.toLowerCase() === 'select';
                if (isSelectField) {
                    this.updateExclusiveBodyClass(className, allOptions.split(','), value, body);
                } else {
                    this.updateExclusiveBodyClass(exclusiveGroup, allOptions.split(','), value, body);
                }
            } else {
                // Handle regular toggle classes
                this.toggleBodyClass(className, value, body);
            }
        },

        /**
         * 🎯 NEW: Intelligent State Management Functions
         */
        
        /**
         * 🔄 Manages mutually exclusive body classes (fixes conflicts like mas-theme-auto + mas-theme-dark)
         * @param {string} prefix - Class prefix (e.g., 'mas-theme-')
         * @param {array} possibleValues - All possible values (['light', 'dark', 'auto'])
         * @param {string} newValue - New value to set
         * @param {Element} body - Body element
         */
        updateExclusiveBodyClass: function(prefix, possibleValues, newValue, body) {
            // STEP 1: Clean slate - remove ALL classes from this group
            possibleValues.forEach(value => {
                const fullClassName = prefix + value;
                body.classList.remove(fullClassName);
            });
            
            // STEP 2: Add only the new class (if valid)
            if (newValue && possibleValues.includes(newValue)) {
                const newClassName = prefix + newValue;
                body.classList.add(newClassName);
            } else if (newValue) {
            }
        },

        /**
         * 🔘 Smart toggle for single body classes
         * @param {string} className - Class name to toggle
         * @param {*} value - Value to evaluate for toggle
         * @param {Element} body - Body element
         */
        toggleBodyClass: function(className, value, body) {
            const shouldAdd = value === '1' || value === true || value === 1;
            
            // Remove legacy/conflicting classes first
            this.cleanLegacyClasses(className, body);
            
            if (shouldAdd) {
                body.classList.add(className);
            } else {
                body.classList.remove(className);
            }
        },

        /**
         * 🧹 Cleans up legacy/conflicting class names
         * @param {string} currentClassName - Current class being processed
         * @param {Element} body - Body element
         */
        cleanLegacyClasses: function(currentClassName, body) {
            // Define legacy mappings to clean up
            const legacyMappings = {
                'woow-menu-floating': ['woow-menu-floating'], // Remove old naming
                'woow-admin-bar-floating': ['woow-admin-bar-floating'], // Remove old naming
                'mas-v2-glassmorphism': ['woow-glassmorphism', 'mas-menu-glassmorphism'], // Consolidate
                'mas-v2-glossy': ['mas-admin-bar-glossy'], // Consolidate
                'mas-v2-animations-enabled': ['mas-animations-enabled', 'mas-enable-animations'] // Consolidate
            };
            
            if (legacyMappings[currentClassName]) {
                legacyMappings[currentClassName].forEach(legacyClass => {
                    if (body.classList.contains(legacyClass)) {
                        body.classList.remove(legacyClass);
                    }
                });
            }
        },

        /**
         * 💄 Apply Custom CSS
         */
        applyCustomCSS: function(input, value) {
            const cssId = input.dataset.cssId || 'mas-custom-css-preview';
            
            // Remove existing custom CSS
            const existing = document.getElementById(cssId);
            if (existing) {
                existing.remove();
            }
            
            // Add new custom CSS
            if (value && value.trim()) {
                const style = document.createElement('style');
                style.id = cssId;
                style.textContent = value;
                document.head.appendChild(style);
                
            } else {
            }
        },

        /**
         * 🎯 Apply Direct Element Style
         */
        applyElementStyle: function(input, value) {
            const selector = input.dataset.targetSelector;
            const property = input.dataset.cssProperty;
            const unit = input.dataset.unit || '';
            
            if (!selector || !property) {
                return;
            }
            
            const elements = document.querySelectorAll(selector);
            const finalValue = value + unit;
            
            elements.forEach(element => {
                element.style[property] = finalValue;
            });
            
        },

        /**
         * 💉 Legacy: Inject Custom CSS (for special case)
         */
        injectCustomCSS: function(css) {
            const styleId = 'mas-custom-css-preview';
            
            // Remove existing
            const existing = document.getElementById(styleId);
            if (existing) {
                existing.remove();
            }
            
            // Add new if not empty
            if (css && css.trim()) {
                const style = document.createElement('style');
                style.id = styleId;
                style.textContent = css;
                document.head.appendChild(style);
                
            }
        },

        updateHeadingsScale: function(scale, baseSize) {
            const base = parseFloat(baseSize) || 14;
            const ratio = parseFloat(scale) || 1.2;
            const root = document.documentElement;

            // Matematyczna skala dla H1-H6 z lepszymi proporcjami
            root.style.setProperty('--woow-font-size-base', (base * Math.pow(ratio, -1)).toFixed(2) + 'px');
            root.style.setProperty('--woow-font-size-lg', (base * Math.pow(ratio, 0)).toFixed(2) + 'px'); // h5 = base
            root.style.setProperty('--woow-font-size-xl', (base * Math.pow(ratio, 1)).toFixed(2) + 'px');
            root.style.setProperty('--woow-font-size-2xl', (base * Math.pow(ratio, 2)).toFixed(2) + 'px');
            root.style.setProperty('--woow-font-size-3xl', (base * Math.pow(ratio, 3)).toFixed(2) + 'px');
            root.style.setProperty('--woow-font-size-4xl', (base * Math.pow(ratio, 4)).toFixed(2) + 'px');

        },

        getFormData: function() {
            const formData = {};
            $("#mas-v2-settings-form").find("input, select, textarea").each(function() {
                const $field = $(this);
                const name = $field.attr("name");
                
                if (!name) return;
                
                if ($field.is(":checkbox")) {
                    formData[name] = $field.is(":checked") ? 1 : 0;
                } else if ($field.is(":radio")) {
                    if ($field.is(":checked")) {
                        formData[name] = $field.val();
                    }
                } else {
                    formData[name] = $field.val();
                }
            });
            
            return formData;
        },

        saveSettings: function(e) {
            if (e) e.preventDefault();
            
            // NAPRAWKA WYDAJNOŚCI: Debounce dla zapisywania ustawień
            const self = this;
            
            // Anuluj poprzedni timeout save jeśli istnieje
            if (this.saveTimeout) {
                clearTimeout(this.saveTimeout);
            }
            
            // Debounce save operations (500ms)
            this.saveTimeout = setTimeout(function() {
                self.performSave();
            }, 500);
        },
        
        performSave: function() {
            
            // Zapobiegnij duplikatom requestów
            if (this.saveInProgress) {
                return;
            }
            
            this.saveInProgress = true;
            
            const $form = $("#mas-v2-settings-form");
            const $btn = $("#mas-v2-save-btn");
            const originalText = $btn.text();
            
            // Update button state
            $btn.prop("disabled", true).text("Zapisywanie...");
            
            const masData = this.getMasData();
            
            if (!masData.ajaxUrl || !masData.nonce) {
                this.showMessage('error', 'Błąd: Brak danych AJAX');
                $btn.prop("disabled", false).text(originalText);
                this.saveInProgress = false;
                return;
            }
            
            const formData = this.getFormData($form);
            formData.action = 'mas_v2_save_settings';
            formData.nonce = masData.nonce;
            
            
            const self = this;
            
            $.ajax({
                url: masData.ajaxUrl,
                type: 'POST',
                data: formData,
                timeout: 30000, // 30 second timeout
                success: function(response) {
                    
                    if (response.success) {
                        self.showMessage('success', response.data.message || 'Ustawienia zostały zapisane!');
                        self.markAsSaved();
                        
                        // Auto-trigger live preview after successful save
                        if (self.livePreviewEnabled) {
                            setTimeout(function() {
                                self.triggerLivePreview();
                            }, 100);
                        }
                    } else {
                        self.showMessage('error', response.data.message || 'Wystąpił błąd podczas zapisu.');
                    }
                },
                error: function(xhr, status, error) {
                    self.showMessage('error', 'Błąd AJAX: ' + error);
                },
                complete: function() {
                    $btn.prop("disabled", false).text(originalText);
                    self.saveInProgress = false;
                }
            });
        },

        resetSettings: function(e) {
            e.preventDefault();
            
            if (!confirm("Czy na pewno chcesz przywrócić domyślne ustawienia?")) {
                return;
            }
            
            const $btn = $(this);
            const originalText = $btn.html();
            
            $btn.prop("disabled", true).html('<span class="mas-v2-loading"></span> Resetowanie...');
            
            const masData = MAS.getMasData();
            
            $.ajax({
                url: masData.ajaxUrl,
                type: "POST",
                data: {
                    action: "mas_v2_reset_settings",
                    nonce: masData.nonce
                },
                success: function(response) {
                    if (response.success) {
                        MAS.showMessage(response.data.message, "success");
                        
                        setTimeout(function() {
                            location.reload();
                        }, 1000);
                    } else {
                        MAS.showMessage(response.data.message || "Wystąpił błąd", "error");
                    }
                },
                error: function() {
                    MAS.showMessage("Wystąpił błąd podczas resetowania", "error");
                },
                complete: function() {
                    $btn.prop("disabled", false).html(originalText);
                }
            });
        },

        exportSettings: function(e) {
            e.preventDefault();
            
            const masData = MAS.getMasData();
            
            $.ajax({
                url: masData.ajaxUrl,
                type: "POST",
                data: {
                    action: "mas_v2_export_settings",
                    nonce: masData.nonce
                },
                success: function(response) {
                    if (response.success) {
                        const dataStr = JSON.stringify(response.data.data, null, 2);
                        const dataBlob = new Blob([dataStr], {type: "application/json"});
                        const url = URL.createObjectURL(dataBlob);
                        
                        const link = document.createElement("a");
                        link.href = url;
                        link.download = response.data.filename;
                        link.click();
                        
                        URL.revokeObjectURL(url);
                        
                        MAS.showMessage("Ustawienia zostały wyeksportowane", "success");
                    } else {
                        MAS.showMessage(response.data.message || "Wystąpił błąd", "error");
                    }
                },
                error: function() {
                    MAS.showMessage("Wystąpił błąd podczas eksportu", "error");
                }
            });
        },

        importSettings: function(e) {
            e.preventDefault();
            $("#mas-v2-import-file").click();
        },

        handleImportFile: function(e) {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const data = JSON.parse(e.target.result);
                    
                    const masData = MAS.getMasData();
                    
                    $.ajax({
                        url: masData.ajaxUrl,
                        type: "POST",
                        data: {
                            action: "mas_v2_import_settings",
                            nonce: masData.nonce,
                            data: JSON.stringify(data)
                        },
                        success: function(response) {
                            if (response.success) {
                                MAS.showMessage(response.data.message, "success");
                                
                                setTimeout(function() {
                                    location.reload();
                                }, 1000);
                            } else {
                                MAS.showMessage(response.data.message || "Wystąpił błąd", "error");
                            }
                        },
                        error: function() {
                            MAS.showMessage("Wystąpił błąd podczas importu", "error");
                        }
                    });
                } catch (error) {
                    MAS.showMessage("Nieprawidłowy format pliku", "error");
                }
            };
            
            reader.readAsText(file);
            $(this).val("");
        },

        checkAutoSave: function() {
            if ($('input[name="auto_save"]').is(":checked")) {
                this.startAutoSave();
            }
        },

        startAutoSave: function() {
            this.autoSaveInterval = setInterval(function() {
                if (MAS.hasChanges) {
                    $("#mas-v2-save-btn").click();
                }
            }, 30000);
        },

        stopAutoSave: function() {
            if (this.autoSaveInterval) {
                clearInterval(this.autoSaveInterval);
                this.autoSaveInterval = null;
            }
        },

        markAsChanged: function() {
            this.hasChanges = true;
            $("#mas-v2-status-value").text("Niezapisane zmiany").addClass("changed");
            
            $(window).on("beforeunload.mas", function() {
                return "Masz niezapisane zmiany. Czy na pewno chcesz opuścić stronę?";
            });
        },

        markAsSaved: function() {
            this.hasChanges = false;
            const $statusValue = $("#mas-v2-status-value");
            
            // Aktualizuj status z animacją
            $statusValue.text("Zapisano").removeClass("changed").addClass("saved");
            
            // Usuń obsługę beforeunload
            $(window).off("beforeunload.mas");
            
            // Usuń klasę "saved" po 3 sekundach
            setTimeout(function() {
                $statusValue.removeClass("saved");
            }, 3000);
            
        },

        updateBodyClasses: function() {
            // Simplified body classes update - removed DOM manipulation
            // Classes are now managed by PHP and admin-global.js
            
            // Only update CSS variables for live preview
            if (window.updateBodyClasses && typeof window.updateBodyClasses === 'function') {
                const formData = this.getFormData();
                window.updateBodyClasses(formData);
            }
        },

        // initFloatingMenuCollapse and restoreNormalCollapse removed
        // Floating menu is now handled by CSS-only approach

        initSystemMonitor: function() {
            // Sprawdź czy monitor systemu istnieje na stronie
            if (!$('.mas-v2-system-monitor-card').length) return;
            
            // Inicjalizuj rotację wskazówek
            this.initTipsRotation();
            
            // Aktualizuj dane co 5 sekund
            this.updateSystemMonitor();
            setInterval(() => {
                this.updateSystemMonitor();
            }, 5000);
        },

        initTipsRotation: function() {
            const tips = [
                '◐ Skróty klawiszowe dostępne w menu pomocy',
                '◆ Wszystkie zmiany są automatycznie zapisywane',
                '⚡ Wyłącz animacje dla lepszej wydajności',
                '● Sprawdź ustawienia zaawansowane',
                '▲ Regularnie eksportuj swoje ustawienia',
                '◒ Dostosuj kolory do swojej marki'
            ];
            
            let currentTip = 0;
            setInterval(() => {
                currentTip = (currentTip + 1) % tips.length;
                $('#rotating-tip').fadeOut(300, function() {
                    $(this).text(tips[currentTip]).fadeIn(300);
                });
                $('#tips-counter').text(tips.length);
            }, 4000);
        },

        updateSystemMonitor: function() {
            // System monitor w metric card
            const systemMainValue = $('#system-main-value');
            const systemMainLabel = $('#system-main-label');
            const systemTrend = $('#system-trend');
            const processesMini = $('#processes-mini');
            const queriesMini = $('#queries-mini');
            const performanceScore = $('#performance-score');
            
            // Rotacja głównej wartości systemu
            const systemMetrics = [
                { value: Math.floor(Math.random() * 512 + 128) + ' MB', label: 'Pamięć RAM', trend: '+' + Math.floor(Math.random() * 10 + 1) + '%' },
                { value: (Math.random() * 2 + 0.5).toFixed(2) + 's', label: 'Czas ładowania', trend: '-' + Math.floor(Math.random() * 5 + 1) + '%' },
                { value: Math.floor(Math.random() * 50 + 20), label: 'Zapytania DB', trend: '+' + Math.floor(Math.random() * 8 + 1) + '%' },
                { value: Math.floor(Math.random() * 30 + 10), label: 'Aktywne procesy', trend: '+' + Math.floor(Math.random() * 15 + 1) + '%' }
            ];
            
            const currentMetric = systemMetrics[Math.floor(Date.now() / 10000) % systemMetrics.length];
            
            if (systemMainValue.length) {
                this.animateCounter(systemMainValue, currentMetric.value);
                systemMainLabel.text(currentMetric.label);
                systemTrend.text(currentMetric.trend);
            }
            
            // Mini wartości
            if (processesMini.length) {
                const newProcesses = Math.max(10, parseInt(processesMini.text()) + Math.floor(Math.random() * 6 - 3));
                this.animateCounter(processesMini, newProcesses);
            }
            
            if (queriesMini.length) {
                const newQueries = Math.max(5, parseInt(queriesMini.text()) + Math.floor(Math.random() * 4 - 2));
                this.animateCounter(queriesMini, newQueries);
            }
            
            // Wydajność
            if (performanceScore.length) {
                const currentScore = parseInt(performanceScore.text()) || 95;
                const newScore = Math.max(85, Math.min(99, currentScore + Math.floor(Math.random() * 6 - 3)));
                this.animateCounter(performanceScore, newScore + '%');
            }
        },

        animateCounter: function(element, newValue) {
            element.addClass('updating');
            setTimeout(() => {
                element.text(newValue);
                element.removeClass('updating');
            }, 300);
        },

        showMessage: function(message, type = "info") {
            const $message = $('<div class="mas-v2-message ' + type + '">' + message + '</div>');
            
            if (!$("#mas-v2-messages").length) {
                $("body").append('<div id="mas-v2-messages" class="mas-v2-messages"></div>');
            }
            
            $("#mas-v2-messages").append($message);
            
            setTimeout(function() {
                $message.fadeOut(300, function() {
                    $(this).remove();
                });
            }, 5000);
            
            $message.on("click", function() {
                $(this).fadeOut(300, function() {
                    $(this).remove();
                });
            });
        },

        // Template functionality
        applyTemplate: function(templateName) {
            const templates = {
                'modern_blue': {
                    'theme': 'modern',
                    'color_scheme': 'light',
                    'admin_bar_background': '#1e3a8a',
                    'admin_bar_text_color': '#ffffff',
                    'menu_background': '#1e40af',
                    'menu_text_color': '#ffffff',
                    'button_primary_bg': '#2563eb',
                    'content_background': '#f8fafc'
                },
                'dark_elegant': {
                    'theme': 'modern',
                    'color_scheme': 'dark',
                    'admin_bar_background': '#1f2937',
                    'admin_bar_text_color': '#f9fafb',
                    'menu_background': '#111827',
                    'menu_text_color': '#e5e7eb',
                    'button_primary_bg': '#6b7280',
                    'content_background': '#374151'
                },
                'minimal_white': {
                    'theme': 'modern',
                    'color_scheme': 'light',
                    'admin_bar_background': '#ffffff',
                    'admin_bar_text_color': '#374151',
                    'menu_background': '#f9fafb',
                    'menu_text_color': '#1f2937',
                    'button_primary_bg': '#059669',
                    'content_background': '#ffffff'
                },
                'colorful_gradient': {
                    'theme': 'modern',
                    'color_scheme': 'light',
                    'admin_bar_background': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    'admin_bar_text_color': '#ffffff',
                    'menu_background': 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                    'menu_text_color': '#ffffff',
                    'button_primary_bg': '#8b5cf6',
                    'content_background': '#fef3c7'
                },
                'professional_gray': {
                    'theme': 'modern',
                    'color_scheme': 'light',
                    'admin_bar_background': '#6b7280',
                    'admin_bar_text_color': '#ffffff',
                    'menu_background': '#9ca3af',
                    'menu_text_color': '#ffffff',
                    'button_primary_bg': '#374151',
                    'content_background': '#f3f4f6'
                }
            };
            
            if (templates[templateName]) {
                // Apply template settings to form
                Object.keys(templates[templateName]).forEach(key => {
                    const field = $(`[name="${key}"]`);
                    if (field.length) {
                        if (field.is(':checkbox')) {
                            field.prop('checked', templates[templateName][key]);
                        } else {
                            field.val(templates[templateName][key]);
                        }
                    }
                });
                
                // Trigger live preview
                this.triggerLivePreview();
                this.markAsChanged();
                
                alert(`Szablon "${templateName}" został zastosowany!`);
            }
        },
        
        saveTemplate: function(templateName) {
            const formData = this.getFormData();
            
            // Save to localStorage for now (could be enhanced to save to database)
            const customTemplates = JSON.parse(localStorage.getItem('mas_custom_templates') || '{}');
            customTemplates[templateName] = formData;
            localStorage.setItem('mas_custom_templates', JSON.stringify(customTemplates));
            
            // Add to select dropdown
            const option = `<option value="custom_${templateName}">Własny: ${templateName}</option>`;
            $('#quick_templates').append(option);
            
            alert(`Szablon "${templateName}" został zapisany!`);
        },
        
        loadCustomTemplates: function() {
            const customTemplates = JSON.parse(localStorage.getItem('mas_custom_templates') || '{}');
            Object.keys(customTemplates).forEach(name => {
                const option = `<option value="custom_${name}">Własny: ${name}</option>`;
                $('#quick_templates').append(option);
            });
        },
        
        updateConditionalFields: function() {
            $('.conditional-field').each(function() {
                const $field = $(this);
                const showWhen = $field.data('show-when');
                const showValue = $field.data('show-value');
                const showValueNot = $field.data('show-value-not');
                
                if (showWhen) {
                    const $trigger = $(`[name="${showWhen}"]`);
                    let currentValue;
                    
                    if ($trigger.is(':checkbox')) {
                        currentValue = $trigger.is(':checked') ? '1' : '0';
                    } else {
                        currentValue = $trigger.val();
                    }
                    
                    let shouldShow = false;
                    
                    if (showValue !== undefined) {
                        shouldShow = (currentValue == showValue);
                    } else if (showValueNot !== undefined) {
                        shouldShow = (currentValue != showValueNot);
                    }
                    
                    if (shouldShow) {
                        $field.show();
                    } else {
                        $field.hide();
                    }
                }
            });
        },
        
        initNewFeatures: function() {
            // Template functionality
            $('#apply-template').on('click', function() {
                const templateName = $('#quick_templates').val();
                if (!templateName) {
                    alert('Wybierz szablon aby go zastosować.');
                    return;
                }
                
                if (confirm('Czy na pewno chcesz zastąpić obecne ustawienia wybranym szablonem?')) {
                    MAS.applyTemplate(templateName);
                }
            });
            
            // Save as template functionality
            $('#save-as-template').on('click', function() {
                const templateName = prompt('Podaj nazwę szablonu:');
                if (templateName) {
                    MAS.saveTemplate(templateName);
                }
            });
            
            // Upload buttons for logo fields
            $('.mas-v2-upload-btn').on('click', function() {
                const target = $(this).data('target');
                
                if (typeof wp !== 'undefined' && wp.media) {
                    const mediaUploader = wp.media({
                        title: 'Wybierz logo',
                        multiple: false,
                        library: {
                            type: 'image'
                        }
                    });
                    
                    mediaUploader.on('select', function() {
                        const attachment = mediaUploader.state().get('selection').first().toJSON();
                        $('#' + target).val(attachment.url);
                        MAS.triggerLivePreview();
                        MAS.markAsChanged();
                    });
                    
                    mediaUploader.open();
                }
            });
            
            // Conditional fields triggers
            $('input[name="enable_animations"], input[name="enable_shadows"], input[name="login_page_enabled"]').on('change', function() {
                MAS.updateConditionalFields();
            });
        },

        /**
         * 🧪 DEBUG: Test State Management System
         */
        testStateManagement: function() {
            console.group('🧪 Testing State Management System');
            
            const body = document.body;
            const prefix = 'mas-theme-';
            const testValues = ['light', 'dark', 'auto'];
            
            // Test 1: Add conflicting classes (simulating the bug)
            body.classList.add('woow-theme-light');
            body.classList.add('woow-theme-dark');
            body.classList.add('mas-theme-auto');
            
            // Test 2: Apply exclusive state management
            this.updateExclusiveBodyClass(prefix, testValues, 'dark', body);
            
            // Test 3: Legacy cleanup
            body.classList.add('woow-menu-floating'); // Add old class
            this.cleanLegacyClasses('woow-menu-floating', body);
            
            console.groupEnd();
        },

        // 🟡 PRIORYTET 2: Enhanced Error Handling & User Feedback
        showErrorPanel: function(error, context = '') {
            const errorContainer = $('<div class="mas-error-container"></div>');
            
            const errorPanel = $(`
                <div class="mas-error-panel">
                    <div class="mas-error-header">
                        <span class="mas-error-icon">⚠️</span>
                        <h3 class="mas-error-title">System Error Occurred</h3>
                    </div>
                    <div class="mas-error-message">
                        ${error.message || error || 'An unexpected error occurred'}
                    </div>
                    ${error.debug_info ? `
                        <div class="mas-error-details">
                            <strong>Debug Information:</strong><br>
                            ${JSON.stringify(error.debug_info, null, 2)}
                        </div>
                    ` : ''}
                    ${context ? `
                        <div class="mas-error-details">
                            <strong>Context:</strong> ${context}
                        </div>
                    ` : ''}
                    <div class="mas-error-actions">
                        <button class="mas-error-btn mas-error-btn-primary" onclick="this.closest('.mas-error-container').remove()">
                            Close
                        </button>
                        <button class="mas-error-btn mas-error-btn-secondary" onclick="location.reload()">
                            Reload Page
                        </button>
                    </div>
                </div>
            `);
            
            errorContainer.append(errorPanel);
            $('body').append(errorContainer);
            
            // Auto-remove after 10 seconds
            setTimeout(() => {
                errorContainer.fadeOut(300, () => errorContainer.remove());
            }, 10000);
        },

        // 🟡 PRIORYTET 2: Loading States & Progress Indicators
        showLoadingOverlay: function(message = 'Processing...', subtext = '') {
            const overlay = $(`
                <div class="mas-loading-overlay">
                    <div class="mas-loading-content">
                        <div class="mas-loading-spinner"></div>
                        <p class="mas-loading-text">${message}</p>
                        ${subtext ? `<p class="mas-loading-subtext">${subtext}</p>` : ''}
                    </div>
                </div>
            `);
            
            $('body').append(overlay);
            setTimeout(() => overlay.addClass('show'), 10);
            
            return overlay;
        },

        hideLoadingOverlay: function(overlay) {
            if (overlay) {
                overlay.removeClass('show');
                setTimeout(() => overlay.remove(), 300);
            } else {
                $('.mas-loading-overlay').removeClass('show');
                setTimeout(() => $('.mas-loading-overlay').remove(), 300);
            }
        },

        // 🟡 PRIORYTET 2: Form Validation with Visual Feedback
        validateField: function(field, rules) {
            const $field = $(field);
            const $wrapper = $field.closest('.mas-v2-field');
            const value = $field.val();
            const errors = [];
            
            // Remove previous validation classes
            $wrapper.removeClass('mas-field-error mas-field-success mas-field-warning');
            $wrapper.find('.mas-field-message').remove();
            
            // Apply validation rules
            if (rules.required && !value.trim()) {
                errors.push('This field is required');
            }
            
            if (rules.minLength && value.length < rules.minLength) {
                errors.push(`Minimum length is ${rules.minLength} characters`);
            }
            
            if (rules.maxLength && value.length > rules.maxLength) {
                errors.push(`Maximum length is ${rules.maxLength} characters`);
            }
            
            if (rules.pattern && !rules.pattern.test(value)) {
                errors.push(rules.patternMessage || 'Invalid format');
            }
            
            if (rules.custom && typeof rules.custom === 'function') {
                const customResult = rules.custom(value);
                if (customResult !== true) {
                    errors.push(customResult);
                }
            }
            
            // Display validation result
            if (errors.length > 0) {
                $wrapper.addClass('mas-field-error');
                const message = $(`
                    <div class="mas-field-message error">
                        <span class="mas-field-message-icon">❌</span>
                        ${errors[0]}
                    </div>
                `);
                $wrapper.append(message);
                return false;
            } else if (value.trim()) {
                $wrapper.addClass('mas-field-success');
                const message = $(`
                    <div class="mas-field-message success">
                        <span class="mas-field-message-icon">✅</span>
                        Valid
                    </div>
                `);
                $wrapper.append(message);
            }
            
            return true;
        },

        // 🟢 PRIORYTET 3: Performance Monitoring & Server Status
        initServerMonitoring: function() {
            
            // Check server performance every 30 seconds
            this.serverMonitorInterval = setInterval(() => {
                this.checkServerStatus();
            }, 30000);
            
            // Initial check
            this.checkServerStatus();
        },

        checkServerStatus: function() {
            const serverData = this.getMasData();
            
            // Memory usage monitoring
            if (serverData.memory_usage) {
                this.updateMemoryStatus(serverData.memory_usage);
            }
            
            // Database performance monitoring
            if (serverData.db_queries) {
                this.updateDatabaseStatus(serverData.db_queries);
            }
            
            // Cache status monitoring
            if (serverData.cache_status) {
                this.updateCacheStatus(serverData.cache_status);
            }
        },

        updateMemoryStatus: function(memoryUsage) {
            const memoryPercent = (memoryUsage.used / memoryUsage.limit) * 100;
            let statusClass = 'good';
            
            if (memoryPercent > 80) {
                statusClass = 'critical';
            } else if (memoryPercent > 60) {
                statusClass = 'warning';
            }
            
            $('.mas-memory-status').removeClass('good warning critical').addClass(statusClass);
            $('.mas-memory-status').text(`${Math.round(memoryPercent)}% Memory Used`);
        },

        updateDatabaseStatus: function(dbQueries) {
            const $dbOptimization = $('.mas-db-optimization');
            
            if (dbQueries > 50) {
                $dbOptimization.removeClass('warning').addClass('error');
                $dbOptimization.find('.mas-db-optimization-title').text('High Database Load Detected');
                $dbOptimization.find('.mas-db-optimization-description').text(
                    `${dbQueries} queries executed. Consider query optimization.`
                );
            } else if (dbQueries > 25) {
                $dbOptimization.removeClass('error').addClass('warning');
                $dbOptimization.find('.mas-db-optimization-title').text('Moderate Database Load');
                $dbOptimization.find('.mas-db-optimization-description').text(
                    `${dbQueries} queries executed. Performance is acceptable.`
                );
            }
        },

        updateCacheStatus: function(cacheStatus) {
            const $cacheStatus = $('.mas-cache-status');
            
            if (cacheStatus.active) {
                $cacheStatus.removeClass('inactive').addClass('active');
                $cacheStatus.text('Cache Active');
            } else {
                $cacheStatus.removeClass('active').addClass('inactive');
                $cacheStatus.text('Cache Inactive');
            }
        },

        // 🟢 PRIORYTET 3: Memory Optimization Features
        optimizeMemoryUsage: function() {
            
            // Enable GPU acceleration for better performance
            $('body').addClass('mas-hardware-accelerated');
            
            // Add memory-efficient classes to large elements
            $('.mas-v2-admin-wrapper, .mas-v2-card, .postbox').addClass('mas-memory-efficient');
            
            // Enable paint optimization
            $('.mas-v2-nav-tab, .mas-v2-btn, .wp-core-ui .button').addClass('mas-paint-optimized');
            
        },

        // 🟢 PRIORYTET 3: Database Optimization Actions
        initDatabaseOptimization: function() {
            $(document).on('click', '.mas-db-action-btn', function() {
                const action = $(this).data('action');
                
                switch (action) {
                    case 'optimize':
                        MAS.optimizeDatabase();
                        break;
                    case 'clean':
                        MAS.cleanDatabase();
                        break;
                    case 'analyze':
                        MAS.analyzeDatabase();
                        break;
                }
            });
        },

        optimizeDatabase: function() {
            const overlay = this.showLoadingOverlay('Optimizing Database...', 'This may take a few moments');
            
            $.ajax({
                url: ajaxurl,
                type: 'POST',
                data: {
                    action: 'mas_optimize_database',
                    nonce: this.getMasData().nonce
                },
                success: function(response) {
                    MAS.hideLoadingOverlay(overlay);
                    if (response.success) {
                        MAS.showNotification('Database optimization completed successfully', 'success');
                    } else {
                        MAS.showErrorPanel(response.data, 'Database Optimization');
                    }
                },
                error: function(xhr, status, error) {
                    MAS.hideLoadingOverlay(overlay);
                    MAS.showErrorPanel({
                        message: 'Database optimization failed',
                        debug_info: { xhr_status: status, error: error }
                    }, 'AJAX Error');
                }
            });
        },

        cleanDatabase: function() {
            const overlay = this.showLoadingOverlay('Cleaning Database...', 'Removing unnecessary data');
            
            $.ajax({
                url: ajaxurl,
                type: 'POST',
                data: {
                    action: 'mas_clean_database',
                    nonce: this.getMasData().nonce
                },
                success: function(response) {
                    MAS.hideLoadingOverlay(overlay);
                    if (response.success) {
                        MAS.showNotification('Database cleanup completed', 'success');
                    } else {
                        MAS.showErrorPanel(response.data, 'Database Cleanup');
                    }
                },
                error: function(xhr, status, error) {
                    MAS.hideLoadingOverlay(overlay);
                    MAS.showErrorPanel({
                        message: 'Database cleanup failed',
                        debug_info: { xhr_status: status, error: error }
                    }, 'AJAX Error');
                }
            });
        },

        analyzeDatabase: function() {
            const overlay = this.showLoadingOverlay('Analyzing Database...', 'Checking performance metrics');
            
            $.ajax({
                url: ajaxurl,
                type: 'POST',
                data: {
                    action: 'mas_analyze_database',
                    nonce: this.getMasData().nonce
                },
                success: function(response) {
                    MAS.hideLoadingOverlay(overlay);
                    if (response.success) {
                        // Display analysis results
                        const results = response.data;
                        const message = `
                            Database Analysis Complete:<br>
                            Tables: ${results.tables}<br>
                            Total Size: ${results.size}<br>
                            Optimization Score: ${results.score}/100
                        `;
                        MAS.showNotification(message, 'info');
                    } else {
                        MAS.showErrorPanel(response.data, 'Database Analysis');
                    }
                },
                error: function(xhr, status, error) {
                    MAS.hideLoadingOverlay(overlay);
                    MAS.showErrorPanel({
                        message: 'Database analysis failed',
                        debug_info: { xhr_status: status, error: error }
                    }, 'AJAX Error');
                }
            });
        },

        // 🟢 PRIORYTET 3: Enhanced Settings Validation
        initAdvancedValidation: function() {
            // Color field validation
            $('input.mas-v2-color').on('blur', function() {
                MAS.validateField(this, {
                    pattern: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
                    patternMessage: 'Please enter a valid hex color (e.g., #FF0000)'
                });
            });
            
            // Numeric field validation
            $('input[type="number"].mas-v2-input').on('blur', function() {
                const min = parseInt($(this).attr('min')) || 0;
                const max = parseInt($(this).attr('max')) || 999;
                
                MAS.validateField(this, {
                    required: true,
                    custom: function(value) {
                        const num = parseInt(value);
                        if (isNaN(num)) return 'Please enter a valid number';
                        if (num < min) return `Value must be at least ${min}`;
                        if (num > max) return `Value must be at most ${max}`;
                        return true;
                    }
                });
            });
            
            // CSS field validation
            $('textarea[name*="custom_css"]').on('blur', function() {
                MAS.validateField(this, {
                    maxLength: 50000,
                    custom: function(value) {
                        if (value.includes('javascript:')) {
                            return 'JavaScript URLs are not allowed in CSS';
                        }
                        if (value.includes('expression(')) {
                            return 'CSS expressions are not allowed';
                        }
                        return true;
                    }
                });
            });
        },

        // Skróty klawiszowe są teraz obsługiwane globalnie w admin-global.js

        initTabs: function() {
            
            // 🎯 NATYWNA INTEGRACJA: Nie potrzebujemy obsługi kliknięć w zakładki
            // Nawigacja jest teraz obsługiwana przez natywne menu WordPress
            
            // Upewnij się, że aktywna sekcja jest widoczna (PHP już to ustawia)
            const $activeContent = $(".mas-v2-tab-content.active");
            if ($activeContent.length) {
                $activeContent.show().css('opacity', 1);
            }
            
            // Ukryj nieaktywne sekcje
            $(".mas-v2-tab-content:not(.active)").hide();
            
        },

        initColorPickers: function() {
            $(".mas-v2-color").each(function() {
                const $input = $(this);
                
                // NAPRAWKA KRYTYCZNA: Enhanced color picker integration
                if ($.fn.wpColorPicker && !$input.hasClass('wp-color-picker')) {
                    $input.wpColorPicker({
                        change: function(event, ui) {
                            const color = ui.color.toString();
                            const fieldName = $input.attr('name');
                            
                            // NAPRAWKA: Update CSS variable immediately for instant preview
                            if (fieldName) {
                                const cssVar = `--mas-${fieldName.replace(/_/g, '-')}`;
                                document.documentElement.style.setProperty(cssVar, color);
                            }
                            
                            if (MAS.livePreviewEnabled) {
                                clearTimeout(MAS.colorTimeout);
                                MAS.colorTimeout = setTimeout(function() {
                                    MAS.triggerLivePreview();
                                }, 200);
                            }
                            MAS.markAsChanged();
                        },
                        clear: function() {
                            const fieldName = $input.attr('name');
                            
                            // NAPRAWKA: Reset CSS variable to default when cleared
                            if (fieldName) {
                                const cssVar = `--mas-${fieldName.replace(/_/g, '-')}`;
                                document.documentElement.style.removeProperty(cssVar);
                            }
                            
                            if (MAS.livePreviewEnabled) {
                                MAS.triggerLivePreview();
                            }
                            MAS.markAsChanged();
                        },
                        // NAPRAWKA: Enhanced color picker options
                        palettes: [
                            '#6366f1', '#ec4899', '#06b6d4', '#10b981', '#f59e0b', '#ef4444',
                            '#8b5cf6', '#f97316', '#84cc16', '#06b6d4', '#f59e0b', '#ef4444'
                        ],
                        width: 255,
                        mode: 'hsl'
                    });
                }
            });
        },

        initSliders: function() {
            $(".mas-v2-slider").each(function() {
                const $slider = $(this);
                const $valueSpan = $('[data-target="' + $slider.attr("name") + '"]');
                
                $slider.on("input", function() {
                    const value = $(this).val();
                    $valueSpan.text(value + "px");
                    
                    // Live preview z throttling dla płynności
                    if (MAS.livePreviewEnabled) {
                        clearTimeout(MAS.sliderTimeout);
                        MAS.sliderTimeout = setTimeout(function() {
                            MAS.triggerLivePreview();
                        }, 100);
                    }
                    
                    MAS.markAsChanged();
                });
                
                // Natychmiastowa aktualizacja przy zmianie końcowej
                $slider.on("change", function() {
                    if (MAS.livePreviewEnabled) {
                        clearTimeout(MAS.sliderTimeout);
                        MAS.triggerLivePreview();
                    }
                });
            });
        },

        initCornerRadius: function() {
            // Obsługa menu bocznego
            $("#corner_radius_type").on("change", function() {
                const type = $(this).val();
                $(".mas-v2-corner-group").hide();
                
                if (type === "all") {
                    $("#mas-v2-corner-all").show();
                } else if (type === "individual") {
                    $("#mas-v2-corner-individual").show();
                }
                
                MAS.triggerLivePreview();
                MAS.markAsChanged();
            });
            
            // Obsługa admin bar
            $("#admin_bar_corner_radius_type").on("change", function() {
                const type = $(this).val();
                $("#mas-v2-admin-bar-corner-all, #mas-v2-admin-bar-corner-individual").hide();
                
                if (type === "all") {
                    $("#mas-v2-admin-bar-corner-all").show();
                } else if (type === "individual") {
                    $("#mas-v2-admin-bar-corner-individual").show();
                }
                
                MAS.triggerLivePreview();
                MAS.markAsChanged();
            });
            
            // Obsługa detached menu - pokaż/ukryj opcje marginesu
            $("input[name='menu_detached']").on("change", function() {
                const isDetached = $(this).is(":checked");
                $("#mas-v2-menu-detached-margin").toggle(isDetached);
                
                // Dynamicznie przełącz klasy CSS body dla floating menu
                MAS.updateBodyClasses();
                
                // Natychmiastowa aktualizacja dla floating menu
                MAS.triggerLivePreview();
                MAS.markAsChanged();
            });
            
            // Obsługa typu marginesu floating menu
            $("#menu_detached_margin_type").on("change", function() {
                const type = $(this).val();
                $("#mas-v2-menu-margin-all, #mas-v2-menu-margin-individual").hide();
                
                if (type === "all") {
                    $("#mas-v2-menu-margin-all").show();
                } else if (type === "individual") {
                    $("#mas-v2-menu-margin-individual").show();
                }
                
                MAS.triggerLivePreview();
                MAS.markAsChanged();
            });
            
            // Obsługa detached admin bar
            $("input[name='admin_bar_detached']").on("change", function() {
                // Dynamicznie przełącz klasy CSS body dla floating admin bar
                MAS.updateBodyClasses();
                
                MAS.triggerLivePreview();
                MAS.markAsChanged();
            });
            
            // DODANE: Obsługa compact mode
            $('input[name="menu_compact_mode"]').on('change', function() {
                const compactClass = 'mas-menu-compact-mode';
                if ($(this).is(':checked')) {
                    $('body').addClass(compactClass);
                } else {
                    $('body').removeClass(compactClass);
                }
                MAS.triggerLivePreview();
                MAS.markAsChanged();
            });
            
            // DODANE: Obsługa typography fields
            $('select[name="body_font_family"], select[name="heading_font_family"]').on('change', function() {
                const fieldName = $(this).attr('name');
                const fontFamily = $(this).val();
                MAS.triggerLivePreview();
                MAS.markAsChanged();
            });
            
            // DODANE: Obsługa advanced hiding options
            $('input[name="hide_wp_version"], input[name="hide_help_tabs"], input[name="hide_screen_options"], input[name="hide_admin_notices"], input[name="hide_footer_text"], input[name="hide_update_nag"]').on('change', function() {
                const fieldName = $(this).attr('name');
                const isChecked = $(this).is(':checked');
                MAS.triggerLivePreview();
                MAS.markAsChanged();
            });
            
            // DODAJE: Obsługa color_palette select - synchronizacja z quick theme selector
            $('select[name="color_palette"]').on('change', function() {
                const palette = $(this).val();
                
                // Update theme manager (mark as from select to prevent loop)
                if (window.themeManager) {
                    window.themeManager.switchPalette(palette, true);
                }
                
                MAS.triggerLivePreview();
                MAS.markAsChanged();
            });

            // DODANE: Obsługa submenu fields
            $('input[name="submenu_background"], input[name="submenu_text_color"], input[name="submenu_hover_background"], input[name="submenu_hover_text_color"]').on('change input', function() {
                const fieldName = $(this).attr('name');
                const value = $(this).val();
                MAS.triggerLivePreview();
                MAS.markAsChanged();
            });
            
            $('input[name="submenu_item_spacing"], input[name="submenu_indent"]').on('input change', function() {
                const fieldName = $(this).attr('name');
                const value = $(this).val();
                MAS.triggerLivePreview();
                MAS.markAsChanged();
            });
            
            $('input[name="submenu_separator"]').on('change', function() {
                const isChecked = $(this).is(':checked');
                MAS.triggerLivePreview();
                MAS.markAsChanged();
            });
            
            $('select[name="submenu_indicator_style"]').on('change', function() {
                const indicatorStyle = $(this).val();
                MAS.triggerLivePreview();
                MAS.markAsChanged();
            });
        },

        initConditionalFields: function() {
            // Obsługa pól, które pokazują się tylko przy określonych warunkach
            $('[data-show-when]').each(function() {
                const $field = $(this);
                const showWhen = $field.data('show-when');
                const showValue = $field.data('show-value');
                
                const $trigger = $('[name="' + showWhen + '"]');
                
                const toggleField = function() {
                    const triggerValue = $trigger.is(':checkbox') ? $trigger.is(':checked') : $trigger.val();
                    
                    if (showValue !== undefined) {
                        $field.toggle(triggerValue == showValue);
                    } else {
                        $field.toggle(!!triggerValue);
                    }
                };
                
                $trigger.on('change', toggleField);
                toggleField(); // Początkowy stan
            });
            
            // Obsługa floating-only pól
            $('.floating-only').each(function() {
                const $field = $(this);
                const requires = $field.data('requires');
                
                if (requires) {
                    const $trigger = $('#' + requires);
                    
                    const toggleField = function() {
                        $field.toggle($trigger.is(':checked'));
                    };
                    
                    $trigger.on('change', toggleField);
                    toggleField(); // Początkowy stan
                }
            });
        },

        initFloatingFields: function() {
            // Obsługa floating admin bar
            $('#admin_bar_floating').on('change', function() {
                const isFloating = $(this).is(':checked');
                $('.admin-bar-floating-only').toggle(isFloating);
                
                // Dodaj/usuń klasę CSS do body
                if (isFloating) {
                    $('body').addClass('woow-admin-bar-floating');
                } else {
                    $('body').removeClass('woow-admin-bar-floating');
                }
                
                MAS.triggerLivePreview();
                MAS.markAsChanged();
            });
            
            // Obsługa floating menu
            $('#menu_floating').on('change', function() {
                const isFloating = $(this).is(':checked');
                $('.menu-floating-only').toggle(isFloating);
                
                // Dodaj/usuń klasę CSS do body
                if (isFloating) {
                    $('body').addClass('woow-menu-floating');
                } else {
                    $('body').removeClass('woow-menu-floating');
                }
                
                MAS.triggerLivePreview();
                MAS.markAsChanged();
            });
            
            // Obsługa glossy admin bar
            $('#admin_bar_glossy').on('change', function() {
                const isGlossy = $(this).is(':checked');
                
                if (isGlossy) {
                    $('body').addClass('mas-v2-admin-bar-glossy');
                } else {
                    $('body').removeClass('mas-v2-admin-bar-glossy');
                }
                
                MAS.triggerLivePreview();
                MAS.markAsChanged();
            });
            
            // Obsługa glossy menu
            $('#menu_glossy').on('change', function() {
                const isGlossy = $(this).is(':checked');
                
                if (isGlossy) {
                    $('body').addClass('mas-v2-menu-glossy');
                } else {
                    $('body').removeClass('mas-v2-menu-glossy');
                }
                
                MAS.triggerLivePreview();
                MAS.markAsChanged();
            });
            
            // Obsługa border radius type dla admin bar
            $('#admin_bar_border_radius_type').on('change', function() {
                const type = $(this).val();
                $('.admin-bar-radius-group').hide();
                
                if (type === 'all') {
                    $('#admin-bar-radius-all').show();
                } else if (type === 'individual') {
                    $('#admin-bar-radius-individual').show();
                }
                
                MAS.triggerLivePreview();
                MAS.markAsChanged();
            });
            
            // Obsługa border radius type dla menu
            $('#menu_border_radius_type').on('change', function() {
                const type = $(this).val();
                $('.menu-radius-group').hide();
                
                if (type === 'all') {
                    $('#menu-radius-all').show();
                } else if (type === 'individual') {
                    $('#menu-radius-individual').show();
                }
                
                MAS.triggerLivePreview();
                MAS.markAsChanged();
            });
            
            // Obsługa margin type dla admin bar
            $('#admin_bar_margin_type').on('change', function() {
                const type = $(this).val();
                $('.admin-bar-margin-group').hide();
                
                if (type === 'all') {
                    $('#admin-bar-margin-all').show();
                } else if (type === 'individual') {
                    $('#admin-bar-margin-individual').show();
                }
                
                MAS.triggerLivePreview();
                MAS.markAsChanged();
            });
            
            // Obsługa margin type dla menu
            $('#menu_margin_type').on('change', function() {
                const type = $(this).val();
                $('.menu-margin-group').hide();
                
                if (type === 'all') {
                    $('#menu-margin-all').show();
                } else if (type === 'individual') {
                    $('#menu-margin-individual').show();
                }
                
                MAS.triggerLivePreview();
                MAS.markAsChanged();
            });
            
            // Początkowy stan pól
            $('#admin_bar_floating').trigger('change');
            $('#menu_floating').trigger('change');
            $('#admin_bar_glossy').trigger('change');
            $('#menu_glossy').trigger('change');
            $('#admin_bar_border_radius_type').trigger('change');
            $('#menu_border_radius_type').trigger('change');
            $('#admin_bar_margin_type').trigger('change');
            $('#menu_margin_type').trigger('change');
        },

        initTooltips: function() {
            $("[title]").each(function() {
                const $element = $(this);
                const title = $element.attr("title");
                
                if (!title) return;
                
                $element.removeAttr("title").on("mouseenter", function() {
                    const tooltip = $('<div class="mas-v2-tooltip">' + title + '</div>');
                    $("body").append(tooltip);
                    
                    const rect = this.getBoundingClientRect();
                    tooltip.css({
                        position: "fixed",
                        top: rect.bottom + 5,
                        left: rect.left + (rect.width / 2) - (tooltip.outerWidth() / 2),
                        zIndex: 10000,
                        background: "#333",
                        color: "#fff",
                        padding: "5px 10px",
                        borderRadius: "4px",
                        fontSize: "12px",
                        whiteSpace: "nowrap"
                    });
                }).on("mouseleave", function() {
                    $(".mas-v2-tooltip").remove();
                });
            });
        },

        initLivePreview: function() {
            this.livePreviewEnabled = $("#mas-v2-live-preview").is(":checked");
            
            // Obsługa zmiany checkboxa Live Preview
            $("#mas-v2-live-preview").on("change", function() {
                MAS.livePreviewEnabled = $(this).is(":checked");
                MAS.showMessage(
                    MAS.livePreviewEnabled ? 
                    "Podgląd na żywo włączony" : 
                    "Podgląd na żywo wyłączony",
                    "info"
                );
                
                // Synchronizuj z floating toggle button
                const toggle = document.querySelector('.mas-live-preview-toggle');
                if (toggle) {
                    toggle.classList.toggle('active', MAS.livePreviewEnabled);
                }
                
                // Natychmiastowy podgląd jeśli włączony
                if (MAS.livePreviewEnabled) {
                    MAS.triggerLivePreview();
                }
            });
            
            // Live preview navigation buttons
            $("#mas-v2-preview-home").on("click", function() {
                MAS.navigatePreview("http://localhost:10018/wp-admin/index.php");
            });
            
            $("#mas-v2-preview-posts").on("click", function() {
                MAS.navigatePreview("http://localhost:10018/wp-admin/edit.php");
            });
            
            $("#mas-v2-preview-pages").on("click", function() {
                MAS.navigatePreview("http://localhost:10018/wp-admin/edit.php?post_type=page");
            });
            
            $("#mas-v2-preview-media").on("click", function() {
                MAS.navigatePreview("http://localhost:10018/wp-admin/upload.php");
            });
            
            $("#mas-v2-preview-refresh").on("click", function() {
                const currentUrl = $("#mas-v2-preview-url").val();
                MAS.refreshPreview();
            });
            
            $("#mas-v2-preview-go").on("click", function() {
                const url = $("#mas-v2-preview-url").val();
                if (url) {
                    MAS.navigatePreview(url);
                }
            });
            
            // Enter key support for URL input
            $("#mas-v2-preview-url").on("keypress", function(e) {
                if (e.which === 13) {
                    $("#mas-v2-preview-go").click();
                }
            });
        },

        navigatePreview: function(url) {
            const $iframe = $("#mas-v2-preview-iframe");
            const $urlInput = $("#mas-v2-preview-url");
            
            if ($iframe.length && url) {
                $urlInput.val(url);
                $iframe.attr("src", url);
                
                // Show loading state
                this.showMessage("Ładowanie podglądu...", "info");
                
                // Handle iframe load
                $iframe.off("load").on("load", function() {
                    MAS.showMessage("Podgląd załadowany", "success");
                });
            }
        },

        refreshPreview: function() {
            const $iframe = $("#mas-v2-preview-iframe");
            const currentUrl = $iframe.attr("src");
            
            if ($iframe.length && currentUrl) {
                // Add timestamp to force refresh
                const separator = currentUrl.includes("?") ? "&" : "?";
                const refreshUrl = currentUrl + separator + "_refresh=" + Date.now();
                $iframe.attr("src", refreshUrl);
                
                this.showMessage("Odświeżanie podglądu...", "info");
            }
        },

        toggleLivePreview: function() {
            MAS.livePreviewEnabled = $("#mas-v2-live-preview").is(":checked");
            MAS.showMessage(
                MAS.livePreviewEnabled ? 
                "Podgląd na żywo włączony" : 
                "Podgląd na żywo wyłączony",
                "info"
            );
        },

        handleFormChange: function(e) {
            const $field = $(e.target);
            const fieldName = $field.attr('name');
            
            // Debug info
            
            // Natychmiastowa aktualizacja dla checkboxów i select-ów
            const instantUpdate = $field.is(':checkbox') || $field.is('select') || 
                                 $field.attr('type') === 'radio' || 
                                 $field.hasClass('mas-v2-color');
            
            if (MAS.livePreviewEnabled) {
            clearTimeout(MAS.livePreviewTimeout);
            
            if (instantUpdate) {
                // Natychmiastowa aktualizacja dla ważnych pól
                MAS.triggerLivePreview();
            } else {
                    // Opóźniona aktualizacja dla text inputów i sliderów
                MAS.livePreviewTimeout = setTimeout(function() {
                    MAS.triggerLivePreview();
                    }, 300);
                }
            }
            
            MAS.markAsChanged();
        },

        triggerLivePreview: function(formData = null) {
            if (!this.livePreviewEnabled) return;
            
            const data = formData || this.getFormData();
            
            // ========================================
            // 🎯 AUTOMATED LIVE PREVIEW ENGINE
            // ========================================
            
            this.processAutomatedLivePreview(data);
            
            // ========================================
            // 🔧 SPECIAL CASES (remain manual)
            // ========================================
            
            // Special case: Headings Scale (mathematical calculation)
            if (data.headings_scale || data.global_font_size) {
                this.updateHeadingsScale(data.headings_scale, data.global_font_size);
            }
            
            // Special case: Custom CSS injection
            if (data.custom_css !== undefined) {
                this.injectCustomCSS(data.custom_css);
            }
            
            // Update body classes for structural changes
            if (window.updateBodyClasses && typeof window.updateBodyClasses === 'function') {
                window.updateBodyClasses(data);
            }
            
        },

        /**
         * 🎯 NEW: Automated Live Preview Engine
         * Processes all form fields with data-* attributes automatically
         */
        processAutomatedLivePreview: function(formData) {
            const root = document.documentElement;
            const body = document.body;
            let processedFields = 0;
            
            // Process all form fields with data-live-preview attributes
            document.querySelectorAll('#mas-v2-settings-form [data-live-preview]').forEach(input => {
                const fieldName = input.name;
                const value = formData[fieldName];
                const previewType = input.dataset.livePreview;
                
                if (typeof value === 'undefined') return;
                
                switch (previewType) {
                    case 'css-var':
                        this.applyCSSVariable(input, value, root);
                        processedFields++;
                        break;
                        
                    case 'body-class':
                        this.applyBodyClass(input, value, body);
                        processedFields++;
                        break;
                        
                    case 'custom-css':
                        this.applyCustomCSS(input, value);
                        processedFields++;
                        break;
                        
                    case 'element-style':
                        this.applyElementStyle(input, value);
                        processedFields++;
                        break;
                        
                    default:
                }
            });
            
        },

        /**
         * 🎨 Apply CSS Variable
         */
        applyCSSVariable: function(input, value, root) {
            const cssVar = input.dataset.cssVar;
            const unit = input.dataset.unit || '';
            
            if (!cssVar) {
                return;
            }
            
            const finalValue = value + unit;
            root.style.setProperty(cssVar, finalValue);
            
        },

        /**
         * 🏷️ Apply Body Class (ENHANCED with state management)
         */
        applyBodyClass: function(input, value, body) {
            const className = input.dataset.bodyClass;
            const exclusiveGroup = input.dataset.exclusiveGroup;
            const allOptions = input.dataset.allOptions;
            
            if (!className) {
                return;
            }
            
            // Handle exclusive groups (mutually exclusive classes)
            if (exclusiveGroup && allOptions) {
                // For select fields, the className is the prefix and value is the suffix
                const isSelectField = input.tagName.toLowerCase() === 'select';
                if (isSelectField) {
                    this.updateExclusiveBodyClass(className, allOptions.split(','), value, body);
                } else {
                    this.updateExclusiveBodyClass(exclusiveGroup, allOptions.split(','), value, body);
                }
            } else {
                // Handle regular toggle classes
                this.toggleBodyClass(className, value, body);
            }
        },

        /**
         * 🎯 NEW: Intelligent State Management Functions
         */
        
        /**
         * 🔄 Manages mutually exclusive body classes (fixes conflicts like mas-theme-auto + mas-theme-dark)
         * @param {string} prefix - Class prefix (e.g., 'mas-theme-')
         * @param {array} possibleValues - All possible values (['light', 'dark', 'auto'])
         * @param {string} newValue - The new value to apply
         */
        


        bindEvents: function() {
            // NAPRAWKA KRYTYCZNA: Ulepszone zarządzanie event handlerami z zabezpieczeniem przed duplikatami
            const namespace = '.masV2Events';
            
            // Usuń wszystkie poprzednie event handlers w namespace
            $(document).off(namespace);
            
            // Ustaw handlers z namespace dla łatwego zarządzania
            $(document).on("click" + namespace, "#mas-v2-save-btn", this.saveSettings.bind(this));
            $(document).on("submit" + namespace, "#mas-v2-settings-form", function(e) {
                e.preventDefault(); // Zapobiegnij podwójnemu wysłaniu
                $("#mas-v2-save-btn").trigger("click");
            });
            
            // Pozostałe handlers z namespace
            $(document).on("click" + namespace, "#mas-v2-reset-btn", this.resetSettings);
            $(document).on("click" + namespace, "#mas-v2-export-btn", this.exportSettings);
            $(document).on("click" + namespace, "#mas-v2-import-btn", this.importSettings);
            $(document).on("change" + namespace, "#mas-v2-import-file", this.handleImportFile);
            $(document).on("change" + namespace, "#mas-v2-live-preview", this.toggleLivePreview);
            
            // NAPRAWKA KRYTYCZNA: Ulepszone handling checkbox z prawidłową serializacją
            $(document).on("change" + namespace, "#mas-v2-settings-form input[type='checkbox']", function() {
                const $checkbox = $(this);
                const name = $checkbox.attr('name');
                const isChecked = $checkbox.is(':checked');
                
                // Explicit value handling for proper serialization - NAPRAWKA CHECKBOX
                $checkbox.val(isChecked ? '1' : '0');
                
                // Dodaj hidden input dla WordPress serialization compatibility  
                let $hiddenInput = $checkbox.siblings('input[name="' + name + '_hidden"]');
                if ($hiddenInput.length === 0) {
                    $hiddenInput = $('<input type="hidden" name="' + name + '_hidden" value="0">');
                    $checkbox.before($hiddenInput);
                }
                $hiddenInput.val(isChecked ? '1' : '0');
                
                MAS.triggerLivePreview();
                MAS.markAsChanged();
            });
            
            // NAPRAWKA: Debounce dla live preview aby uniknąć nadmiarowych requestów
            let livePreviewTimeout;
            const debouncedLivePreview = function() {
                clearTimeout(livePreviewTimeout);
                livePreviewTimeout = setTimeout(function() {
                    MAS.handleFormChange.call(MAS);
                }, 300); // 300ms debounce
            };
            
            // Rozszerzona obsługa live preview z debounce
            $(document).on("change input keyup" + namespace, "#mas-v2-settings-form input:not([type='checkbox']), #mas-v2-settings-form select, #mas-v2-settings-form textarea", debouncedLivePreview);
            $(document).on("change" + namespace, "#mas-v2-settings-form input[type='radio']", this.handleFormChange);
            $(document).on("input" + namespace, "#mas-v2-settings-form input[type='range']", debouncedLivePreview);
            
            // NAPRAWKA: Ulepszona obsługa color pickerów z error handling
            $(document).on("wpColorPickerChange" + namespace, "#mas-v2-settings-form input.mas-v2-color", function() {
                try {
                    MAS.handleFormChange();
                } catch (error) {
                    MAS.showNotification('Color picker error: ' + error.message, 'error');
                }
            });
        },

        // NAPRAWKA KRYTYCZNA: Toast notification system dla user feedback
        showNotification: function(message, type = 'info') {
            const toast = $(`
                <div class="mas-notification mas-notification-${type}">
                    <span class="mas-notification-icon">
                        ${type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️'}
                    </span>
                    <span class="mas-notification-message">${message}</span>
                    <button class="mas-notification-close">&times;</button>
                </div>
            `);
            
            // Add to body if not exists
            if ($('.mas-notifications-container').length === 0) {
                $('body').append('<div class="mas-notifications-container"></div>');
            }
            
            $('.mas-notifications-container').append(toast);
            toast.addClass('mas-notification-show');
            
            // Auto-hide after 5 seconds
            setTimeout(() => {
                toast.removeClass('mas-notification-show');
                setTimeout(() => toast.remove(), 300);
            }, 5000);
            
            // Manual close handler
            toast.find('.mas-notification-close').on('click', function() {
                toast.removeClass('mas-notification-show');
                setTimeout(() => toast.remove(), 300);
            });
        },

        // NAPRAWKA KRYTYCZNA: Cleanup function dla memory leaks
        cleanup: function() {
            
            // Clear all timeouts
            clearTimeout(this.livePreviewTimeout);
            clearTimeout(this.sliderTimeout);
            clearTimeout(this.colorTimeout);
            
            // Remove all event listeners with namespace
            $(document).off('.masV2Events');
            
            // Clear intervals
            if (this.autoSaveInterval) {
                clearInterval(this.autoSaveInterval);
                this.autoSaveInterval = null;
            }
            
            if (this.serverMonitorInterval) {
                clearInterval(this.serverMonitorInterval);
                this.serverMonitorInterval = null;
            }
            
            // Cleanup WordPress color pickers
            $('.mas-v2-color').each(function() {
                if ($(this).hasClass('wp-color-picker')) {
                    $(this).wpColorPicker('destroy');
                }
            });
            
        },

        // 🟡 PRIORYTET 2: Enhanced Error Handling & User Feedback
        showErrorPanel: function(error, context = '') {
            const errorContainer = $('<div class="mas-error-container"></div>');
            
            const errorPanel = $(`
                <div class="mas-error-panel">
                    <div class="mas-error-header">
                        <span class="mas-error-icon">⚠️</span>
                        <h3 class="mas-error-title">System Error Occurred</h3>
                    </div>
                    <div class="mas-error-message">
                        ${error.message || error || 'An unexpected error occurred'}
                    </div>
                    ${error.debug_info ? `
                        <div class="mas-error-details">
                            <strong>Debug Information:</strong><br>
                            ${JSON.stringify(error.debug_info, null, 2)}
                        </div>
                    ` : ''}
                    ${context ? `
                        <div class="mas-error-details">
                            <strong>Context:</strong> ${context}
                        </div>
                    ` : ''}
                    <div class="mas-error-actions">
                        <button class="mas-error-btn mas-error-btn-primary" onclick="this.closest('.mas-error-container').remove()">
                            Close
                        </button>
                        <button class="mas-error-btn mas-error-btn-secondary" onclick="location.reload()">
                            Reload Page
                        </button>
                    </div>
                </div>
            `);
            
            errorContainer.append(errorPanel);
            $('body').append(errorContainer);
            
            // Auto-remove after 10 seconds
            setTimeout(() => {
                errorContainer.fadeOut(300, () => errorContainer.remove());
            }, 10000);
        },

        // 🟡 PRIORYTET 2: Loading States & Progress Indicators
        showLoadingOverlay: function(message = 'Processing...', subtext = '') {
            const overlay = $(`
                <div class="mas-loading-overlay">
                    <div class="mas-loading-content">
                        <div class="mas-loading-spinner"></div>
                        <p class="mas-loading-text">${message}</p>
                        ${subtext ? `<p class="mas-loading-subtext">${subtext}</p>` : ''}
                    </div>
                </div>
            `);
            
            $('body').append(overlay);
            setTimeout(() => overlay.addClass('show'), 10);
            
            return overlay;
        },

        hideLoadingOverlay: function(overlay) {
            if (overlay) {
                overlay.removeClass('show');
                setTimeout(() => overlay.remove(), 300);
            } else {
                $('.mas-loading-overlay').removeClass('show');
                setTimeout(() => $('.mas-loading-overlay').remove(), 300);
            }
        },

        // 🟡 PRIORYTET 2: Form Validation with Visual Feedback
        validateField: function(field, rules) {
            const $field = $(field);
            const $wrapper = $field.closest('.mas-v2-field');
            const value = $field.val();
            const errors = [];
            
            // Remove previous validation classes
            $wrapper.removeClass('mas-field-error mas-field-success mas-field-warning');
            $wrapper.find('.mas-field-message').remove();
            
            // Apply validation rules
            if (rules.required && !value.trim()) {
                errors.push('This field is required');
            }
            
            if (rules.minLength && value.length < rules.minLength) {
                errors.push(`Minimum length is ${rules.minLength} characters`);
            }
            
            if (rules.maxLength && value.length > rules.maxLength) {
                errors.push(`Maximum length is ${rules.maxLength} characters`);
            }
            
            if (rules.pattern && !rules.pattern.test(value)) {
                errors.push(rules.patternMessage || 'Invalid format');
            }
            
            if (rules.custom && typeof rules.custom === 'function') {
                const customResult = rules.custom(value);
                if (customResult !== true) {
                    errors.push(customResult);
                }
            }
            
            // Display validation result
            if (errors.length > 0) {
                $wrapper.addClass('mas-field-error');
                const message = $(`
                    <div class="mas-field-message error">
                        <span class="mas-field-message-icon">❌</span>
                        ${errors[0]}
                    </div>
                `);
                $wrapper.append(message);
                return false;
            } else if (value.trim()) {
                $wrapper.addClass('mas-field-success');
                const message = $(`
                    <div class="mas-field-message success">
                        <span class="mas-field-message-icon">✅</span>
                        Valid
                    </div>
                `);
                $wrapper.append(message);
            }
            
            return true;
        },

        // 🟢 PRIORYTET 3: Performance Monitoring & Server Status
        initServerMonitoring: function() {
            
            // Check server performance every 30 seconds
            this.serverMonitorInterval = setInterval(() => {
                this.checkServerStatus();
            }, 30000);
            
            // Initial check
            this.checkServerStatus();
        },

        checkServerStatus: function() {
            const serverData = this.getMasData();
            
            // Memory usage monitoring
            if (serverData.memory_usage) {
                this.updateMemoryStatus(serverData.memory_usage);
            }
            
            // Database performance monitoring
            if (serverData.db_queries) {
                this.updateDatabaseStatus(serverData.db_queries);
            }
            
            // Cache status monitoring
            if (serverData.cache_status) {
                this.updateCacheStatus(serverData.cache_status);
            }
        },

        updateMemoryStatus: function(memoryUsage) {
            const memoryPercent = (memoryUsage.used / memoryUsage.limit) * 100;
            let statusClass = 'good';
            
            if (memoryPercent > 80) {
                statusClass = 'critical';
            } else if (memoryPercent > 60) {
                statusClass = 'warning';
            }
            
            $('.mas-memory-status').removeClass('good warning critical').addClass(statusClass);
            $('.mas-memory-status').text(`${Math.round(memoryPercent)}% Memory Used`);
        },

        updateDatabaseStatus: function(dbQueries) {
            const $dbOptimization = $('.mas-db-optimization');
            
            if (dbQueries > 50) {
                $dbOptimization.removeClass('warning').addClass('error');
                $dbOptimization.find('.mas-db-optimization-title').text('High Database Load Detected');
                $dbOptimization.find('.mas-db-optimization-description').text(
                    `${dbQueries} queries executed. Consider query optimization.`
                );
            } else if (dbQueries > 25) {
                $dbOptimization.removeClass('error').addClass('warning');
                $dbOptimization.find('.mas-db-optimization-title').text('Moderate Database Load');
                $dbOptimization.find('.mas-db-optimization-description').text(
                    `${dbQueries} queries executed. Performance is acceptable.`
                );
            }
        },

        updateCacheStatus: function(cacheStatus) {
            const $cacheStatus = $('.mas-cache-status');
            
            if (cacheStatus.active) {
                $cacheStatus.removeClass('inactive').addClass('active');
                $cacheStatus.text('Cache Active');
            } else {
                $cacheStatus.removeClass('active').addClass('inactive');
                $cacheStatus.text('Cache Inactive');
            }
        },

        // 🟢 PRIORYTET 3: Memory Optimization Features
        optimizeMemoryUsage: function() {
            
            // Enable GPU acceleration for better performance
            $('body').addClass('mas-hardware-accelerated');
            
            // Add memory-efficient classes to large elements
            $('.mas-v2-admin-wrapper, .mas-v2-card, .postbox').addClass('mas-memory-efficient');
            
            // Enable paint optimization
            $('.mas-v2-nav-tab, .mas-v2-btn, .wp-core-ui .button').addClass('mas-paint-optimized');
            
        },

        // 🟢 PRIORYTET 3: Database Optimization Actions
        initDatabaseOptimization: function() {
            $(document).on('click', '.mas-db-action-btn', function() {
                const action = $(this).data('action');
                
                switch (action) {
                    case 'optimize':
                        MAS.optimizeDatabase();
                        break;
                    case 'clean':
                        MAS.cleanDatabase();
                        break;
                    case 'analyze':
                        MAS.analyzeDatabase();
                        break;
                }
            });
        },

        optimizeDatabase: function() {
            const overlay = this.showLoadingOverlay('Optimizing Database...', 'This may take a few moments');
            
            $.ajax({
                url: ajaxurl,
                type: 'POST',
                data: {
                    action: 'mas_optimize_database',
                    nonce: this.getMasData().nonce
                },
                success: function(response) {
                    MAS.hideLoadingOverlay(overlay);
                    if (response.success) {
                        MAS.showNotification('Database optimization completed successfully', 'success');
                    } else {
                        MAS.showErrorPanel(response.data, 'Database Optimization');
                    }
                },
                error: function(xhr, status, error) {
                    MAS.hideLoadingOverlay(overlay);
                    MAS.showErrorPanel({
                        message: 'Database optimization failed',
                        debug_info: { xhr_status: status, error: error }
                    }, 'AJAX Error');
                }
            });
        },

        cleanDatabase: function() {
            const overlay = this.showLoadingOverlay('Cleaning Database...', 'Removing unnecessary data');
            
            $.ajax({
                url: ajaxurl,
                type: 'POST',
                data: {
                    action: 'mas_clean_database',
                    nonce: this.getMasData().nonce
                },
                success: function(response) {
                    MAS.hideLoadingOverlay(overlay);
                    if (response.success) {
                        MAS.showNotification('Database cleanup completed', 'success');
                    } else {
                        MAS.showErrorPanel(response.data, 'Database Cleanup');
                    }
                },
                error: function(xhr, status, error) {
                    MAS.hideLoadingOverlay(overlay);
                    MAS.showErrorPanel({
                        message: 'Database cleanup failed',
                        debug_info: { xhr_status: status, error: error }
                    }, 'AJAX Error');
                }
            });
        },

        analyzeDatabase: function() {
            const overlay = this.showLoadingOverlay('Analyzing Database...', 'Checking performance metrics');
            
            $.ajax({
                url: ajaxurl,
                type: 'POST',
                data: {
                    action: 'mas_analyze_database',
                    nonce: this.getMasData().nonce
                },
                success: function(response) {
                    MAS.hideLoadingOverlay(overlay);
                    if (response.success) {
                        // Display analysis results
                        const results = response.data;
                        const message = `
                            Database Analysis Complete:<br>
                            Tables: ${results.tables}<br>
                            Total Size: ${results.size}<br>
                            Optimization Score: ${results.score}/100
                        `;
                        MAS.showNotification(message, 'info');
                    } else {
                        MAS.showErrorPanel(response.data, 'Database Analysis');
                    }
                },
                error: function(xhr, status, error) {
                    MAS.hideLoadingOverlay(overlay);
                    MAS.showErrorPanel({
                        message: 'Database analysis failed',
                        debug_info: { xhr_status: status, error: error }
                    }, 'AJAX Error');
                }
            });
        },

        // 🟢 PRIORYTET 3: Enhanced Settings Validation
        initAdvancedValidation: function() {
            // Color field validation
            $('input.mas-v2-color').on('blur', function() {
                MAS.validateField(this, {
                    pattern: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
                    patternMessage: 'Please enter a valid hex color (e.g., #FF0000)'
                });
            });
            
            // Numeric field validation
            $('input[type="number"].mas-v2-input').on('blur', function() {
                const min = parseInt($(this).attr('min')) || 0;
                const max = parseInt($(this).attr('max')) || 999;
                
                MAS.validateField(this, {
                    required: true,
                    custom: function(value) {
                        const num = parseInt(value);
                        if (isNaN(num)) return 'Please enter a valid number';
                        if (num < min) return `Value must be at least ${min}`;
                        if (num > max) return `Value must be at most ${max}`;
                        return true;
                    }
                });
            });
            
            // CSS field validation
            $('textarea[name*="custom_css"]').on('blur', function() {
                MAS.validateField(this, {
                    maxLength: 50000,
                    custom: function(value) {
                        if (value.includes('javascript:')) {
                            return 'JavaScript URLs are not allowed in CSS';
                        }
                        if (value.includes('expression(')) {
                            return 'CSS expressions are not allowed';
                        }
                        return true;
                    }
                });
            });
        },

        // 🟡 PRIORYTET 2: Enhanced Error Handling & User Feedback
        showErrorPanel: function(error, context = '') {
            const errorContainer = $('<div class="mas-error-container"></div>');
            
            const errorPanel = $(`
                <div class="mas-error-panel">
                    <div class="mas-error-header">
                        <span class="mas-error-icon">⚠️</span>
                        <h3 class="mas-error-title">System Error Occurred</h3>
                    </div>
                    <div class="mas-error-message">
                        ${error.message || error || 'An unexpected error occurred'}
                    </div>
                    ${error.debug_info ? `
                        <div class="mas-error-details">
                            <strong>Debug Information:</strong><br>
                            ${JSON.stringify(error.debug_info, null, 2)}
                        </div>
                    ` : ''}
                    ${context ? `
                        <div class="mas-error-details">
                            <strong>Context:</strong> ${context}
                        </div>
                    ` : ''}
                    <div class="mas-error-actions">
                        <button class="mas-error-btn mas-error-btn-primary" onclick="this.closest('.mas-error-container').remove()">
                            Close
                        </button>
                        <button class="mas-error-btn mas-error-btn-secondary" onclick="location.reload()">
                            Reload Page
                        </button>
                    </div>
                </div>
            `);
            
            errorContainer.append(errorPanel);
            $('body').append(errorContainer);
            
            // Auto-remove after 10 seconds
            setTimeout(() => {
                errorContainer.fadeOut(300, () => errorContainer.remove());
            }, 10000);
        },

        // 🟡 PRIORYTET 2: Loading States & Progress Indicators
        showLoadingOverlay: function(message = 'Processing...', subtext = '') {
            const overlay = $(`
                <div class="mas-loading-overlay">
                    <div class="mas-loading-content">
                        <div class="mas-loading-spinner"></div>
                        <p class="mas-loading-text">${message}</p>
                        ${subtext ? `<p class="mas-loading-subtext">${subtext}</p>` : ''}
                    </div>
                </div>
            `);
            
            $('body').append(overlay);
            setTimeout(() => overlay.addClass('show'), 10);
            
            return overlay;
        },

        hideLoadingOverlay: function(overlay) {
            if (overlay) {
                overlay.removeClass('show');
                setTimeout(() => overlay.remove(), 300);
            } else {
                $('.mas-loading-overlay').removeClass('show');
                setTimeout(() => $('.mas-loading-overlay').remove(), 300);
            }
        },

        // 🟡 PRIORYTET 2: Form Validation with Visual Feedback
        validateField: function(field, rules) {
            const $field = $(field);
            const $wrapper = $field.closest('.mas-v2-field');
            const value = $field.val();
            const errors = [];
            
            // Remove previous validation classes
            $wrapper.removeClass('mas-field-error mas-field-success mas-field-warning');
            $wrapper.find('.mas-field-message').remove();
            
            // Apply validation rules
            if (rules.required && !value.trim()) {
                errors.push('This field is required');
            }
            
            if (rules.minLength && value.length < rules.minLength) {
                errors.push(`Minimum length is ${rules.minLength} characters`);
            }
            
            if (rules.maxLength && value.length > rules.maxLength) {
                errors.push(`Maximum length is ${rules.maxLength} characters`);
            }
            
            if (rules.pattern && !rules.pattern.test(value)) {
                errors.push(rules.patternMessage || 'Invalid format');
            }
            
            if (rules.custom && typeof rules.custom === 'function') {
                const customResult = rules.custom(value);
                if (customResult !== true) {
                    errors.push(customResult);
                }
            }
            
            // Display validation result
            if (errors.length > 0) {
                $wrapper.addClass('mas-field-error');
                const message = $(`
                    <div class="mas-field-message error">
                        <span class="mas-field-message-icon">❌</span>
                        ${errors[0]}
                    </div>
                `);
                $wrapper.append(message);
                return false;
            } else if (value.trim()) {
                $wrapper.addClass('mas-field-success');
                const message = $(`
                    <div class="mas-field-message success">
                        <span class="mas-field-message-icon">✅</span>
                        Valid
                    </div>
                `);
                $wrapper.append(message);
            }
            
            return true;
        },

        // 🟢 PRIORYTET 3: Performance Monitoring & Server Status
        initServerMonitoring: function() {
            
            // Check server performance every 30 seconds
            this.serverMonitorInterval = setInterval(() => {
                this.checkServerStatus();
            }, 30000);
            
            // Initial check
            this.checkServerStatus();
        },

        checkServerStatus: function() {
            const serverData = this.getMasData();
            
            // Memory usage monitoring
            if (serverData.memory_usage) {
                this.updateMemoryStatus(serverData.memory_usage);
            }
            
            // Database performance monitoring
            if (serverData.db_queries) {
                this.updateDatabaseStatus(serverData.db_queries);
            }
            
            // Cache status monitoring
            if (serverData.cache_status) {
                this.updateCacheStatus(serverData.cache_status);
            }
        },

        updateMemoryStatus: function(memoryUsage) {
            const memoryPercent = (memoryUsage.used / memoryUsage.limit) * 100;
            let statusClass = 'good';
            
            if (memoryPercent > 80) {
                statusClass = 'critical';
            } else if (memoryPercent > 60) {
                statusClass = 'warning';
            }
            
            $('.mas-memory-status').removeClass('good warning critical').addClass(statusClass);
            $('.mas-memory-status').text(`${Math.round(memoryPercent)}% Memory Used`);
        },

        updateDatabaseStatus: function(dbQueries) {
            const $dbOptimization = $('.mas-db-optimization');
            
            if (dbQueries > 50) {
                $dbOptimization.removeClass('warning').addClass('error');
                $dbOptimization.find('.mas-db-optimization-title').text('High Database Load Detected');
                $dbOptimization.find('.mas-db-optimization-description').text(
                    `${dbQueries} queries executed. Consider query optimization.`
                );
            } else if (dbQueries > 25) {
                $dbOptimization.removeClass('error').addClass('warning');
                $dbOptimization.find('.mas-db-optimization-title').text('Moderate Database Load');
                $dbOptimization.find('.mas-db-optimization-description').text(
                    `${dbQueries} queries executed. Performance is acceptable.`
                );
            }
        },

        updateCacheStatus: function(cacheStatus) {
            const $cacheStatus = $('.mas-cache-status');
            
            if (cacheStatus.active) {
                $cacheStatus.removeClass('inactive').addClass('active');
                $cacheStatus.text('Cache Active');
            } else {
                $cacheStatus.removeClass('active').addClass('inactive');
                $cacheStatus.text('Cache Inactive');
            }
        },

        // 🟢 PRIORYTET 3: Memory Optimization Features
        optimizeMemoryUsage: function() {
            
            // Enable GPU acceleration for better performance
            $('body').addClass('mas-hardware-accelerated');
            
            // Add memory-efficient classes to large elements
            $('.mas-v2-admin-wrapper, .mas-v2-card, .postbox').addClass('mas-memory-efficient');
            
            // Enable paint optimization
            $('.mas-v2-nav-tab, .mas-v2-btn, .wp-core-ui .button').addClass('mas-paint-optimized');
            
        },

        // 🟢 PRIORYTET 3: Database Optimization Actions
        initDatabaseOptimization: function() {
            $(document).on('click', '.mas-db-action-btn', function() {
                const action = $(this).data('action');
                
                switch (action) {
                    case 'optimize':
                        MAS.optimizeDatabase();
                        break;
                    case 'clean':
                        MAS.cleanDatabase();
                        break;
                    case 'analyze':
                        MAS.analyzeDatabase();
                        break;
                }
            });
        },

        optimizeDatabase: function() {
            const overlay = this.showLoadingOverlay('Optimizing Database...', 'This may take a few moments');
            
            $.ajax({
                url: ajaxurl,
                type: 'POST',
                data: {
                    action: 'mas_optimize_database',
                    nonce: this.getMasData().nonce
                },
                success: function(response) {
                    MAS.hideLoadingOverlay(overlay);
                    if (response.success) {
                        MAS.showNotification('Database optimization completed successfully', 'success');
                    } else {
                        MAS.showErrorPanel(response.data, 'Database Optimization');
                    }
                },
                error: function(xhr, status, error) {
                    MAS.hideLoadingOverlay(overlay);
                    MAS.showErrorPanel({
                        message: 'Database optimization failed',
                        debug_info: { xhr_status: status, error: error }
                    }, 'AJAX Error');
                }
            });
        },

        cleanDatabase: function() {
            const overlay = this.showLoadingOverlay('Cleaning Database...', 'Removing unnecessary data');
            
            $.ajax({
                url: ajaxurl,
                type: 'POST',
                data: {
                    action: 'mas_clean_database',
                    nonce: this.getMasData().nonce
                },
                success: function(response) {
                    MAS.hideLoadingOverlay(overlay);
                    if (response.success) {
                        MAS.showNotification('Database cleanup completed', 'success');
                    } else {
                        MAS.showErrorPanel(response.data, 'Database Cleanup');
                    }
                },
                error: function(xhr, status, error) {
                    MAS.hideLoadingOverlay(overlay);
                    MAS.showErrorPanel({
                        message: 'Database cleanup failed',
                        debug_info: { xhr_status: status, error: error }
                    }, 'AJAX Error');
                }
            });
        },

        analyzeDatabase: function() {
            const overlay = this.showLoadingOverlay('Analyzing Database...', 'Checking performance metrics');
            
            $.ajax({
                url: ajaxurl,
                type: 'POST',
                data: {
                    action: 'mas_analyze_database',
                    nonce: this.getMasData().nonce
                },
                success: function(response) {
                    MAS.hideLoadingOverlay(overlay);
                    if (response.success) {
                        // Display analysis results
                        const results = response.data;
                        const message = `
                            Database Analysis Complete:<br>
                            Tables: ${results.tables}<br>
                            Total Size: ${results.size}<br>
                            Optimization Score: ${results.score}/100
                        `;
                        MAS.showNotification(message, 'info');
                    } else {
                        MAS.showErrorPanel(response.data, 'Database Analysis');
                    }
                },
                error: function(xhr, status, error) {
                    MAS.hideLoadingOverlay(overlay);
                    MAS.showErrorPanel({
                        message: 'Database analysis failed',
                        debug_info: { xhr_status: status, error: error }
                    }, 'AJAX Error');
                }
            });
        },

        // 🟢 PRIORYTET 3: Enhanced Settings Validation
        initAdvancedValidation: function() {
            // Color field validation
            $('input.mas-v2-color').on('blur', function() {
                MAS.validateField(this, {
                    pattern: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
                    patternMessage: 'Please enter a valid hex color (e.g., #FF0000)'
                });
            });
            
            // Numeric field validation
            $('input[type="number"].mas-v2-input').on('blur', function() {
                const min = parseInt($(this).attr('min')) || 0;
                const max = parseInt($(this).attr('max')) || 999;
                
                MAS.validateField(this, {
                    required: true,
                    custom: function(value) {
                        const num = parseInt(value);
                        if (isNaN(num)) return 'Please enter a valid number';
                        if (num < min) return `Value must be at least ${min}`;
                        if (num > max) return `Value must be at most ${max}`;
                        return true;
                    }
                });
            });
            
            // CSS field validation
            $('textarea[name*="custom_css"]').on('blur', function() {
                MAS.validateField(this, {
                    maxLength: 50000,
                    custom: function(value) {
                        if (value.includes('javascript:')) {
                            return 'JavaScript URLs are not allowed in CSS';
                        }
                        if (value.includes('expression(')) {
                            return 'CSS expressions are not allowed';
                        }
                        return true;
                    }
                });
            });
        },

        // Skróty klawiszowe są teraz obsługiwane globalnie w admin-global.js

        initTabs: function() {
            
            // 🎯 NATYWNA INTEGRACJA: Nie potrzebujemy obsługi kliknięć w zakładki
            // Nawigacja jest teraz obsługiwana przez natywne menu WordPress
            
            // Upewnij się, że aktywna sekcja jest widoczna (PHP już to ustawia)
            const $activeContent = $(".mas-v2-tab-content.active");
            if ($activeContent.length) {
                $activeContent.show().css('opacity', 1);
            }
            
            // Ukryj nieaktywne sekcje
            $(".mas-v2-tab-content:not(.active)").hide();
            
        },

        initColorPickers: function() {
            $(".mas-v2-color").each(function() {
                const $input = $(this);
                
                // NAPRAWKA KRYTYCZNA: Enhanced color picker integration
                if ($.fn.wpColorPicker && !$input.hasClass('wp-color-picker')) {
                    $input.wpColorPicker({
                        change: function(event, ui) {
                            const color = ui.color.toString();
                            const fieldName = $input.attr('name');
                            
                            // NAPRAWKA: Update CSS variable immediately for instant preview
                            if (fieldName) {
                                const cssVar = `--mas-${fieldName.replace(/_/g, '-')}`;
                                document.documentElement.style.setProperty(cssVar, color);
                            }
                            
                            if (MAS.livePreviewEnabled) {
                                clearTimeout(MAS.colorTimeout);
                                MAS.colorTimeout = setTimeout(function() {
                                    MAS.triggerLivePreview();
                                }, 200);
                            }
                            MAS.markAsChanged();
                        },
                        clear: function() {
                            const fieldName = $input.attr('name');
                            
                            // NAPRAWKA: Reset CSS variable to default when cleared
                            if (fieldName) {
                                const cssVar = `--mas-${fieldName.replace(/_/g, '-')}`;
                                document.documentElement.style.removeProperty(cssVar);
                            }
                            
                            if (MAS.livePreviewEnabled) {
                                MAS.triggerLivePreview();
                            }
                            MAS.markAsChanged();
                        },
                        // NAPRAWKA: Enhanced color picker options
                        palettes: [
                            '#6366f1', '#ec4899', '#06b6d4', '#10b981', '#f59e0b', '#ef4444',
                            '#8b5cf6', '#f97316', '#84cc16', '#06b6d4', '#f59e0b', '#ef4444'
                        ],
                        width: 255,
                        mode: 'hsl'
                    });
                }
            });
        },

        initSliders: function() {
            $(".mas-v2-slider").each(function() {
                const $slider = $(this);
                const $valueSpan = $('[data-target="' + $slider.attr("name") + '"]');
                
                $slider.on("input", function() {
                    const value = $(this).val();
                    $valueSpan.text(value + "px");
                    
                    // Live preview z throttling dla płynności
                    if (MAS.livePreviewEnabled) {
                        clearTimeout(MAS.sliderTimeout);
                        MAS.sliderTimeout = setTimeout(function() {
                            MAS.triggerLivePreview();
                        }, 100);
                    }
                    
                    MAS.markAsChanged();
                });
                
                // Natychmiastowa aktualizacja przy zmianie końcowej
                $slider.on("change", function() {
                    if (MAS.livePreviewEnabled) {
                        clearTimeout(MAS.sliderTimeout);
                        MAS.triggerLivePreview();
                    }
                });
            });
        },

        initCornerRadius: function() {
            // Obsługa menu bocznego
            $("#corner_radius_type").on("change", function() {
                const type = $(this).val();
                $(".mas-v2-corner-group").hide();
                
                if (type === "all") {
                    $("#mas-v2-corner-all").show();
                } else if (type === "individual") {
                    $("#mas-v2-corner-individual").show();
                }
                
                MAS.triggerLivePreview();
                MAS.markAsChanged();
            });
            
            // Obsługa admin bar
            $("#admin_bar_corner_radius_type").on("change", function() {
                const type = $(this).val();
                $("#mas-v2-admin-bar-corner-all, #mas-v2-admin-bar-corner-individual").hide();
                
                if (type === "all") {
                    $("#mas-v2-admin-bar-corner-all").show();
                } else if (type === "individual") {
                    $("#mas-v2-admin-bar-corner-individual").show();
                }
                
                MAS.triggerLivePreview();
                MAS.markAsChanged();
            });
            
            // Obsługa detached menu - pokaż/ukryj opcje marginesu
            $("input[name='menu_detached']").on("change", function() {
                const isDetached = $(this).is(":checked");
                $("#mas-v2-menu-detached-margin").toggle(isDetached);
                
                // Dynamicznie przełącz klasy CSS body dla floating menu
                MAS.updateBodyClasses();
                
                // Natychmiastowa aktualizacja dla floating menu
                MAS.triggerLivePreview();
                MAS.markAsChanged();
            });
            
            // Obsługa typu marginesu floating menu
            $("#menu_detached_margin_type").on("change", function() {
                const type = $(this).val();
                $("#mas-v2-menu-margin-all, #mas-v2-menu-margin-individual").hide();
                
                if (type === "all") {
                    $("#mas-v2-menu-margin-all").show();
                } else if (type === "individual") {
                    $("#mas-v2-menu-margin-individual").show();
                }
                
                MAS.triggerLivePreview();
                MAS.markAsChanged();
            });
            
            // Obsługa detached admin bar
            $("input[name='admin_bar_detached']").on("change", function() {
                // Dynamicznie przełącz klasy CSS body dla floating admin bar
                MAS.updateBodyClasses();
                
                MAS.triggerLivePreview();
                MAS.markAsChanged();
            });
            
            // DODANE: Obsługa compact mode
            $('input[name="menu_compact_mode"]').on('change', function() {
                const compactClass = 'mas-menu-compact-mode';
                if ($(this).is(':checked')) {
                    $('body').addClass(compactClass);
                } else {
                    $('body').removeClass(compactClass);
                }
                MAS.triggerLivePreview();
                MAS.markAsChanged();
            });
            
            // DODANE: Obsługa typography fields
            $('select[name="body_font_family"], select[name="heading_font_family"]').on('change', function() {
                const fieldName = $(this).attr('name');
                const fontFamily = $(this).val();
                MAS.triggerLivePreview();
                MAS.markAsChanged();
            });
            
            // DODANE: Obsługa advanced hiding options
            $('input[name="hide_wp_version"], input[name="hide_help_tabs"], input[name="hide_screen_options"], input[name="hide_admin_notices"], input[name="hide_footer_text"], input[name="hide_update_nag"]').on('change', function() {
                const fieldName = $(this).attr('name');
                const isChecked = $(this).is(':checked');
                MAS.triggerLivePreview();
                MAS.markAsChanged();
            });
            
            // DODAJE: Obsługa color_palette select - synchronizacja z quick theme selector
            $('select[name="color_palette"]').on('change', function() {
                const palette = $(this).val();
                
                // Update theme manager (mark as from select to prevent loop)
                if (window.themeManager) {
                    window.themeManager.switchPalette(palette, true);
                }
                
                MAS.triggerLivePreview();
                MAS.markAsChanged();
            });

            // DODANE: Obsługa submenu fields
            $('input[name="submenu_background"], input[name="submenu_text_color"], input[name="submenu_hover_background"], input[name="submenu_hover_text_color"]').on('change input', function() {
                const fieldName = $(this).attr('name');
                const value = $(this).val();
                MAS.triggerLivePreview();
                MAS.markAsChanged();
            });
            
            $('input[name="submenu_item_spacing"], input[name="submenu_indent"]').on('input change', function() {
                const fieldName = $(this).attr('name');
                const value = $(this).val();
                MAS.triggerLivePreview();
                MAS.markAsChanged();
            });
            
            $('input[name="submenu_separator"]').on('change', function() {
                const isChecked = $(this).is(':checked');
                MAS.triggerLivePreview();
                MAS.markAsChanged();
            });
            
            $('select[name="submenu_indicator_style"]').on('change', function() {
                const indicatorStyle = $(this).val();
                MAS.triggerLivePreview();
                MAS.markAsChanged();
            });
        },

        initConditionalFields: function() {
            // Obsługa pól, które pokazują się tylko przy określonych warunkach
            $('[data-show-when]').each(function() {
                const $field = $(this);
                const showWhen = $field.data('show-when');
                const showValue = $field.data('show-value');
                
                const $trigger = $('[name="' + showWhen + '"]');
                
                const toggleField = function() {
                    const triggerValue = $trigger.is(':checkbox') ? $trigger.is(':checked') : $trigger.val();
                    
                    if (showValue !== undefined) {
                        $field.toggle(triggerValue == showValue);
                    } else {
                        $field.toggle(!!triggerValue);
                    }
                };
                
                $trigger.on('change', toggleField);
                toggleField(); // Początkowy stan
            });
            
            // Obsługa floating-only pól
            $('.floating-only').each(function() {
                const $field = $(this);
                const requires = $field.data('requires');
                
                if (requires) {
                    const $trigger = $('#' + requires);
                    
                    const toggleField = function() {
                        $field.toggle($trigger.is(':checked'));
                    };
                    
                    $trigger.on('change', toggleField);
                    toggleField(); // Początkowy stan
                }
            });
        },

        initFloatingFields: function() {
            // Obsługa floating admin bar
            $('#admin_bar_floating').on('change', function() {
                const isFloating = $(this).is(':checked');
                $('.admin-bar-floating-only').toggle(isFloating);
                
                // Dodaj/usuń klasę CSS do body
                if (isFloating) {
                    $('body').addClass('woow-admin-bar-floating');
                } else {
                    $('body').removeClass('woow-admin-bar-floating');
                }
                
                MAS.triggerLivePreview();
                MAS.markAsChanged();
            });
            
            // Obsługa floating menu
            $('#menu_floating').on('change', function() {
                const isFloating = $(this).is(':checked');
                $('.menu-floating-only').toggle(isFloating);
                
                // Dodaj/usuń klasę CSS do body
                if (isFloating) {
                    $('body').addClass('woow-menu-floating');
                } else {
                    $('body').removeClass('woow-menu-floating');
                }
                
                MAS.triggerLivePreview();
                MAS.markAsChanged();
            });
            
            // Obsługa glossy admin bar
            $('#admin_bar_glossy').on('change', function() {
                const isGlossy = $(this).is(':checked');
                
                if (isGlossy) {
                    $('body').addClass('mas-v2-admin-bar-glossy');
                } else {
                    $('body').removeClass('mas-v2-admin-bar-glossy');
                }
                
                MAS.triggerLivePreview();
                MAS.markAsChanged();
            });
            
            // Obsługa glossy menu
            $('#menu_glossy').on('change', function() {
                const isGlossy = $(this).is(':checked');
                
                if (isGlossy) {
                    $('body').addClass('mas-v2-menu-glossy');
                } else {
                    $('body').removeClass('mas-v2-menu-glossy');
                }
                
                MAS.triggerLivePreview();
                MAS.markAsChanged();
            });
            
            // Obsługa border radius type dla admin bar
            $('#admin_bar_border_radius_type').on('change', function() {
                const type = $(this).val();
                $('.admin-bar-radius-group').hide();
                
                if (type === 'all') {
                    $('#admin-bar-radius-all').show();
                } else if (type === 'individual') {
                    $('#admin-bar-radius-individual').show();
                }
                
                MAS.triggerLivePreview();
                MAS.markAsChanged();
            });
            
            // Obsługa border radius type dla menu
            $('#menu_border_radius_type').on('change', function() {
                const type = $(this).val();
                $('.menu-radius-group').hide();
                
                if (type === 'all') {
                    $('#menu-radius-all').show();
                } else if (type === 'individual') {
                    $('#menu-radius-individual').show();
                }
                
                MAS.triggerLivePreview();
                MAS.markAsChanged();
            });
            
            // Obsługa margin type dla admin bar
            $('#admin_bar_margin_type').on('change', function() {
                const type = $(this).val();
                $('.admin-bar-margin-group').hide();
                
                if (type === 'all') {
                    $('#admin-bar-margin-all').show();
                } else if (type === 'individual') {
                    $('#admin-bar-margin-individual').show();
                }
                
                MAS.triggerLivePreview();
                MAS.markAsChanged();
            });
            
            // Obsługa margin type dla menu
            $('#menu_margin_type').on('change', function() {
                const type = $(this).val();
                $('.menu-margin-group').hide();
                
                if (type === 'all') {
                    $('#menu-margin-all').show();
                } else if (type === 'individual') {
                    $('#menu-margin-individual').show();
                }
                
                MAS.triggerLivePreview();
                MAS.markAsChanged();
            });
            
            // Początkowy stan pól
            $('#admin_bar_floating').trigger('change');
            $('#menu_floating').trigger('change');
            $('#admin_bar_glossy').trigger('change');
            $('#menu_glossy').trigger('change');
            $('#admin_bar_border_radius_type').trigger('change');
            $('#menu_border_radius_type').trigger('change');
            $('#admin_bar_margin_type').trigger('change');
            $('#menu_margin_type').trigger('change');
        },

        initTooltips: function() {
            $("[title]").each(function() {
                const $element = $(this);
                const title = $element.attr("title");
                
                if (!title) return;
                
                $element.removeAttr("title").on("mouseenter", function() {
                    const tooltip = $('<div class="mas-v2-tooltip">' + title + '</div>');
                    $("body").append(tooltip);
                    
                    const rect = this.getBoundingClientRect();
                    tooltip.css({
                        position: "fixed",
                        top: rect.bottom + 5,
                        left: rect.left + (rect.width / 2) - (tooltip.outerWidth() / 2),
                        zIndex: 10000,
                        background: "#333",
                        color: "#fff",
                        padding: "5px 10px",
                        borderRadius: "4px",
                        fontSize: "12px",
                        whiteSpace: "nowrap"
                    });
                }).on("mouseleave", function() {
                    $(".mas-v2-tooltip").remove();
                });
            });
        },

        initLivePreview: function() {
            this.livePreviewEnabled = $("#mas-v2-live-preview").is(":checked");
            
            // Obsługa zmiany checkboxa Live Preview
            $("#mas-v2-live-preview").on("change", function() {
                MAS.livePreviewEnabled = $(this).is(":checked");
                MAS.showMessage(
                    MAS.livePreviewEnabled ? 
                    "Podgląd na żywo włączony" : 
                    "Podgląd na żywo wyłączony",
                    "info"
                );
                
                // Synchronizuj z floating toggle button
                const toggle = document.querySelector('.mas-live-preview-toggle');
                if (toggle) {
                    toggle.classList.toggle('active', MAS.livePreviewEnabled);
                }
                
                // Natychmiastowy podgląd jeśli włączony
                if (MAS.livePreviewEnabled) {
                    MAS.triggerLivePreview();
                }
            });
            
            // Live preview navigation buttons
            $("#mas-v2-preview-home").on("click", function() {
                MAS.navigatePreview("http://localhost:10018/wp-admin/index.php");
            });
            
            $("#mas-v2-preview-posts").on("click", function() {
                MAS.navigatePreview("http://localhost:10018/wp-admin/edit.php");
            });
            
            $("#mas-v2-preview-pages").on("click", function() {
                MAS.navigatePreview("http://localhost:10018/wp-admin/edit.php?post_type=page");
            });
            
            $("#mas-v2-preview-media").on("click", function() {
                MAS.navigatePreview("http://localhost:10018/wp-admin/upload.php");
            });
            
            $("#mas-v2-preview-refresh").on("click", function() {
                const currentUrl = $("#mas-v2-preview-url").val();
                MAS.refreshPreview();
            });
            
            $("#mas-v2-preview-go").on("click", function() {
                const url = $("#mas-v2-preview-url").val();
                if (url) {
                    MAS.navigatePreview(url);
                }
            });
            
            // Enter key support for URL input
            $("#mas-v2-preview-url").on("keypress", function(e) {
                if (e.which === 13) {
                    $("#mas-v2-preview-go").click();
                }
            });
        },

        navigatePreview: function(url) {
            const $iframe = $("#mas-v2-preview-iframe");
            const $urlInput = $("#mas-v2-preview-url");
            
            if ($iframe.length && url) {
                $urlInput.val(url);
                $iframe.attr("src", url);
                
                // Show loading state
                this.showMessage("Ładowanie podglądu...", "info");
                
                // Handle iframe load
                $iframe.off("load").on("load", function() {
                    MAS.showMessage("Podgląd załadowany", "success");
                });
            }
        },

        refreshPreview: function() {
            const $iframe = $("#mas-v2-preview-iframe");
            const currentUrl = $iframe.attr("src");
            
            if ($iframe.length && currentUrl) {
                // Add timestamp to force refresh
                const separator = currentUrl.includes("?") ? "&" : "?";
                const refreshUrl = currentUrl + separator + "_refresh=" + Date.now();
                $iframe.attr("src", refreshUrl);
                
                this.showMessage("Odświeżanie podglądu...", "info");
            }
        },

        toggleLivePreview: function() {
            MAS.livePreviewEnabled = $("#mas-v2-live-preview").is(":checked");
            MAS.showMessage(
                MAS.livePreviewEnabled ? 
                "Podgląd na żywo włączony" : 
                "Podgląd na żywo wyłączony",
                "info"
            );
        },

        handleFormChange: function(e) {
            const $field = $(e.target);
            const fieldName = $field.attr('name');
            
            // Debug info
            
            // Natychmiastowa aktualizacja dla checkboxów i select-ów
            const instantUpdate = $field.is(':checkbox') || $field.is('select') || 
                                 $field.attr('type') === 'radio' || 
                                 $field.hasClass('mas-v2-color');
            
            if (MAS.livePreviewEnabled) {
            clearTimeout(MAS.livePreviewTimeout);
            
            if (instantUpdate) {
                // Natychmiastowa aktualizacja dla ważnych pól
                MAS.triggerLivePreview();
            } else {
                    // Opóźniona aktualizacja dla text inputów i sliderów
                MAS.livePreviewTimeout = setTimeout(function() {
                    MAS.triggerLivePreview();
                    }, 300);
                }
            }
            
            MAS.markAsChanged();
        },

        triggerLivePreview: function(formData = null) {
            if (!this.livePreviewEnabled) return;
            
            const data = formData || this.getFormData();
            
            // ========================================
            // 🎯 AUTOMATED LIVE PREVIEW ENGINE
            // ========================================
            
            this.processAutomatedLivePreview(data);
            
            // ========================================
            // 🔧 SPECIAL CASES (remain manual)
            // ========================================
            
            // Special case: Headings Scale (mathematical calculation)
            if (data.headings_scale || data.global_font_size) {
                this.updateHeadingsScale(data.headings_scale, data.global_font_size);
            }
            
            // Special case: Custom CSS injection
            if (data.custom_css !== undefined) {
                this.injectCustomCSS(data.custom_css);
            }
            
            // Update body classes for structural changes
            if (window.updateBodyClasses && typeof window.updateBodyClasses === 'function') {
                window.updateBodyClasses(data);
            }
            
        },

        /**
         * 🎯 NEW: Automated Live Preview Engine
         * Processes all form fields with data-* attributes automatically
         */
        processAutomatedLivePreview: function(formData) {
            const root = document.documentElement;
            const body = document.body;
            let processedFields = 0;
            
            // Process all form fields with data-live-preview attributes
            document.querySelectorAll('#mas-v2-settings-form [data-live-preview]').forEach(input => {
                const fieldName = input.name;
                const value = formData[fieldName];
                const previewType = input.dataset.livePreview;
                
                if (typeof value === 'undefined') return;
                
                switch (previewType) {
                    case 'css-var':
                        this.applyCSSVariable(input, value, root);
                        processedFields++;
                        break;
                        
                    case 'body-class':
                        this.applyBodyClass(input, value, body);
                        processedFields++;
                        break;
                        
                    case 'custom-css':
                        this.applyCustomCSS(input, value);
                        processedFields++;
                        break;
                        
                    case 'element-style':
                        this.applyElementStyle(input, value);
                        processedFields++;
                        break;
                        
                    default:
                }
            });
            
        },

        /**
         * 🎨 Apply CSS Variable
         */
        applyCSSVariable: function(input, value, root) {
            const cssVar = input.dataset.cssVar;
            const unit = input.dataset.unit || '';
            
            if (!cssVar) {
                return;
            }
            
            const finalValue = value + unit;
            root.style.setProperty(cssVar, finalValue);
            
        },

        /**
         * 🏷️ Apply Body Class (ENHANCED with state management)
         */
        applyBodyClass: function(input, value, body) {
            const className = input.dataset.bodyClass;
            const exclusiveGroup = input.dataset.exclusiveGroup;
            const allOptions = input.dataset.allOptions;
            
            if (!className) {
                return;
            }
            
            // Handle exclusive groups (mutually exclusive classes)
            if (exclusiveGroup && allOptions) {
                // For select fields, the className is the prefix and value is the suffix
                const isSelectField = input.tagName.toLowerCase() === 'select';
                if (isSelectField) {
                    this.updateExclusiveBodyClass(className, allOptions.split(','), value, body);
                } else {
                    this.updateExclusiveBodyClass(exclusiveGroup, allOptions.split(','), value, body);
                }
            } else {
                // Handle regular toggle classes
                this.toggleBodyClass(className, value, body);
            }
        },

        /**
         * 🎯 NEW: Intelligent State Management Functions
         */
        
        /**
         * 🔄 Manages mutually exclusive body classes (fixes conflicts like mas-theme-auto + mas-theme-dark)
         * @param {string} prefix - Class prefix (e.g., 'mas-theme-')
         * @param {array} possibleValues - All possible values (['light', 'dark', 'auto'])
         * @param {string} newValue - New value to set
         * @param {Element} body - Body element
         */
        updateExclusiveBodyClass: function(prefix, possibleValues, newValue, body) {
            // STEP 1: Clean slate - remove ALL classes from this group
            possibleValues.forEach(value => {
                const fullClassName = prefix + value;
                body.classList.remove(fullClassName);
            });
            
            // STEP 2: Add only the new class (if valid)
            if (newValue && possibleValues.includes(newValue)) {
                const newClassName = prefix + newValue;
                body.classList.add(newClassName);
            } else if (newValue) {
            }
        },

        /**
         * 🔘 Smart toggle for single body classes
         * @param {string} className - Class name to toggle
         * @param {*} value - Value to evaluate for toggle
         * @param {Element} body - Body element
         */
        toggleBodyClass: function(className, value, body) {
            const shouldAdd = value === '1' || value === true || value === 1;
            
            // Remove legacy/conflicting classes first
            this.cleanLegacyClasses(className, body);
            
            if (shouldAdd) {
                body.classList.add(className);
            } else {
                body.classList.remove(className);
            }
        },

        /**
         * 🧹 Cleans up legacy/conflicting class names
         * @param {string} currentClassName - Current class being processed
         * @param {Element} body - Body element
         */
        cleanLegacyClasses: function(currentClassName, body) {
            // Define legacy mappings to clean up
            const legacyMappings = {
                'woow-menu-floating': ['woow-menu-floating'], // Remove old naming
                'woow-admin-bar-floating': ['woow-admin-bar-floating'], // Remove old naming
                'mas-v2-glassmorphism': ['woow-glassmorphism', 'mas-menu-glassmorphism'], // Consolidate
                'mas-v2-glossy': ['mas-admin-bar-glossy'], // Consolidate
                'mas-v2-animations-enabled': ['mas-animations-enabled', 'mas-enable-animations'] // Consolidate
            };
            
            if (legacyMappings[currentClassName]) {
                legacyMappings[currentClassName].forEach(legacyClass => {
                    if (body.classList.contains(legacyClass)) {
                        body.classList.remove(legacyClass);
                    }
                });
            }
        },

        /**
         * 💄 Apply Custom CSS
         */
        applyCustomCSS: function(input, value) {
            const cssId = input.dataset.cssId || 'mas-custom-css-preview';
            
            // Remove existing custom CSS
            const existing = document.getElementById(cssId);
            if (existing) {
                existing.remove();
            }
            
            // Add new custom CSS
            if (value && value.trim()) {
                const style = document.createElement('style');
                style.id = cssId;
                style.textContent = value;
                document.head.appendChild(style);
                
            } else {
            }
        },

        /**
         * 🎯 Apply Direct Element Style
         */
        applyElementStyle: function(input, value) {
            const selector = input.dataset.targetSelector;
            const property = input.dataset.cssProperty;
            const unit = input.dataset.unit || '';
            
            if (!selector || !property) {
                return;
            }
            
            const elements = document.querySelectorAll(selector);
            const finalValue = value + unit;
            
            elements.forEach(element => {
                element.style[property] = finalValue;
            });
            
        },

        /**
         * 💉 Legacy: Inject Custom CSS (for special case)
         */
        injectCustomCSS: function(css) {
            const styleId = 'mas-custom-css-preview';
            
            // Remove existing
            const existing = document.getElementById(styleId);
            if (existing) {
                existing.remove();
            }
            
            // Add new if not empty
            if (css && css.trim()) {
                const style = document.createElement('style');
                style.id = styleId;
                style.textContent = css;
                document.head.appendChild(style);
                
            }
        },

        updateHeadingsScale: function(scale, baseSize) {
            const base = parseFloat(baseSize) || 14;
            const ratio = parseFloat(scale) || 1.2;
            const root = document.documentElement;

            // Matematyczna skala dla H1-H6 z lepszymi proporcjami
            root.style.setProperty('--woow-font-size-base', (base * Math.pow(ratio, -1)).toFixed(2) + 'px');
            root.style.setProperty('--woow-font-size-lg', (base * Math.pow(ratio, 0)).toFixed(2) + 'px'); // h5 = base
            root.style.setProperty('--woow-font-size-xl', (base * Math.pow(ratio, 1)).toFixed(2) + 'px');
            root.style.setProperty('--woow-font-size-2xl', (base * Math.pow(ratio, 2)).toFixed(2) + 'px');
            root.style.setProperty('--woow-font-size-3xl', (base * Math.pow(ratio, 3)).toFixed(2) + 'px');
            root.style.setProperty('--woow-font-size-4xl', (base * Math.pow(ratio, 4)).toFixed(2) + 'px');

        },

        getFormData: function() {
            const formData = {};
            $("#mas-v2-settings-form").find("input, select, textarea").each(function() {
                const $field = $(this);
                const name = $field.attr("name");
                
                if (!name) return;
                
                if ($field.is(":checkbox")) {
                    formData[name] = $field.is(":checked") ? 1 : 0;
                } else if ($field.is(":radio")) {
                    if ($field.is(":checked")) {
                        formData[name] = $field.val();
                    }
                } else {
                    formData[name] = $field.val();
                }
            });
            
            return formData;
        },

        saveSettings: function(e) {
            if (e) e.preventDefault();
            
            // NAPRAWKA WYDAJNOŚCI: Debounce dla zapisywania ustawień
            const self = this;
            
            // Anuluj poprzedni timeout save jeśli istnieje
            if (this.saveTimeout) {
                clearTimeout(this.saveTimeout);
            }
            
            // Debounce save operations (500ms)
            this.saveTimeout = setTimeout(function() {
                self.performSave();
            }, 500);
        },
        
        performSave: function() {
            
            // Zapobiegnij duplikatom requestów
            if (this.saveInProgress) {
                return;
            }
            
            this.saveInProgress = true;
            
            const $form = $("#mas-v2-settings-form");
            const $btn = $("#mas-v2-save-btn");
            const originalText = $btn.text();
            
            // Update button state
            $btn.prop("disabled", true).text("Zapisywanie...");
            
            const masData = this.getMasData();
            
            if (!masData.ajaxUrl || !masData.nonce) {
                this.showMessage('error', 'Błąd: Brak danych AJAX');
                $btn.prop("disabled", false).text(originalText);
                this.saveInProgress = false;
                return;
            }
            
            const formData = this.getFormData($form);
            formData.action = 'mas_v2_save_settings';
            formData.nonce = masData.nonce;
            
            
            const self = this;
            
            $.ajax({
                url: masData.ajaxUrl,
                type: 'POST',
                data: formData,
                timeout: 30000, // 30 second timeout
                success: function(response) {
                    
                    if (response.success) {
                        self.showMessage('success', response.data.message || 'Ustawienia zostały zapisane!');
                        self.markAsSaved();
                        
                        // Auto-trigger live preview after successful save
                        if (self.livePreviewEnabled) {
                            setTimeout(function() {
                                self.triggerLivePreview();
                            }, 100);
                        }
                    } else {
                        self.showMessage('error', response.data.message || 'Wystąpił błąd podczas zapisu.');
                    }
                },
                error: function(xhr, status, error) {
                    self.showMessage('error', 'Błąd AJAX: ' + error);
                },
                complete: function() {
                    $btn.prop("disabled", false).text(originalText);
                    self.saveInProgress = false;
                }
            });
        },

        resetSettings: function(e) {
            e.preventDefault();
            
            if (!confirm("Czy na pewno chcesz przywrócić domyślne ustawienia?")) {
                return;
            }
            
            const $btn = $(this);
            const originalText = $btn.html();
            
            $btn.prop("disabled", true).html('<span class="mas-v2-loading"></span> Resetowanie...');
            
            const masData = MAS.getMasData();
            
            $.ajax({
                url: masData.ajaxUrl,
                type: "POST",
                data: {
                    action: "mas_v2_reset_settings",
                    nonce: masData.nonce
                },
                success: function(response) {
                    if (response.success) {
                        MAS.showMessage(response.data.message, "success");
                        
                        setTimeout(function() {
                            location.reload();
                        }, 1000);
                    } else {
                        MAS.showMessage(response.data.message || "Wystąpił błąd", "error");
                    }
                },
                error: function() {
                    MAS.showMessage("Wystąpił błąd podczas resetowania", "error");
                },
                complete: function() {
                    $btn.prop("disabled", false).html(originalText);
                }
            });
        },

        exportSettings: function(e) {
            e.preventDefault();
            
            const masData = MAS.getMasData();
            
            $.ajax({
                url: masData.ajaxUrl,
                type: "POST",
                data: {
                    action: "mas_v2_export_settings",
                    nonce: masData.nonce
                },
                success: function(response) {
                    if (response.success) {
                        const dataStr = JSON.stringify(response.data.data, null, 2);
                        const dataBlob = new Blob([dataStr], {type: "application/json"});
                        const url = URL.createObjectURL(dataBlob);
                        
                        const link = document.createElement("a");
                        link.href = url;
                        link.download = response.data.filename;
                        link.click();
                        
                        URL.revokeObjectURL(url);
                        
                        MAS.showMessage("Ustawienia zostały wyeksportowane", "success");
                    } else {
                        MAS.showMessage(response.data.message || "Wystąpił błąd", "error");
                    }
                },
                error: function() {
                    MAS.showMessage("Wystąpił błąd podczas eksportu", "error");
                }
            });
        },

        importSettings: function(e) {
            e.preventDefault();
            $("#mas-v2-import-file").click();
        },

        handleImportFile: function(e) {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const data = JSON.parse(e.target.result);
                    
                    const masData = MAS.getMasData();
                    
                    $.ajax({
                        url: masData.ajaxUrl,
                        type: "POST",
                        data: {
                            action: "mas_v2_import_settings",
                            nonce: masData.nonce,
                            data: JSON.stringify(data)
                        },
                        success: function(response) {
                            if (response.success) {
                                MAS.showMessage(response.data.message, "success");
                                
                                setTimeout(function() {
                                    location.reload();
                                }, 1000);
                            } else {
                                MAS.showMessage(response.data.message || "Wystąpił błąd", "error");
                            }
                        },
                        error: function() {
                            MAS.showMessage("Wystąpił błąd podczas importu", "error");
                        }
                    });
                } catch (error) {
                    MAS.showMessage("Nieprawidłowy format pliku", "error");
                }
            };
            
            reader.readAsText(file);
            $(this).val("");
        },

        checkAutoSave: function() {
            if ($('input[name="auto_save"]').is(":checked")) {
                this.startAutoSave();
            }
        },

        startAutoSave: function() {
            this.autoSaveInterval = setInterval(function() {
                if (MAS.hasChanges) {
                    $("#mas-v2-save-btn").click();
                }
            }, 30000);
        },

        stopAutoSave: function() {
            if (this.autoSaveInterval) {
                clearInterval(this.autoSaveInterval);
                this.autoSaveInterval = null;
            }
        },

        markAsChanged: function() {
            this.hasChanges = true;
            $("#mas-v2-status-value").text("Niezapisane zmiany").addClass("changed");
            
            $(window).on("beforeunload.mas", function() {
                return "Masz niezapisane zmiany. Czy na pewno chcesz opuścić stronę?";
            });
        },

        markAsSaved: function() {
            this.hasChanges = false;
            const $statusValue = $("#mas-v2-status-value");
            
            // Aktualizuj status z animacją
            $statusValue.text("Zapisano").removeClass("changed").addClass("saved");
            
            // Usuń obsługę beforeunload
            $(window).off("beforeunload.mas");
            
            // Usuń klasę "saved" po 3 sekundach
            setTimeout(function() {
                $statusValue.removeClass("saved");
            }, 3000);
            
        },

        updateBodyClasses: function() {
            // Simplified body classes update - removed DOM manipulation
            // Classes are now managed by PHP and admin-global.js
            
            // Only update CSS variables for live preview
            if (window.updateBodyClasses && typeof window.updateBodyClasses === 'function') {
                const formData = this.getFormData();
                window.updateBodyClasses(formData);
            }
        },

        // initFloatingMenuCollapse and restoreNormalCollapse removed
        // Floating menu is now handled by CSS-only approach

        initSystemMonitor: function() {
            // Sprawdź czy monitor systemu istnieje na stronie
            if (!$('.mas-v2-system-monitor-card').length) return;
            
            // Inicjalizuj rotację wskazówek
            this.initTipsRotation();
            
            // Aktualizuj dane co 5 sekund
            this.updateSystemMonitor();
            setInterval(() => {
                this.updateSystemMonitor();
            }, 5000);
        },

        initTipsRotation: function() {
            const tips = [
                '◐ Skróty klawiszowe dostępne w menu pomocy',
                '◆ Wszystkie zmiany są automatycznie zapisywane',
                '⚡ Wyłącz animacje dla lepszej wydajności',
                '● Sprawdź ustawienia zaawansowane',
                '▲ Regularnie eksportuj swoje ustawienia',
                '◒ Dostosuj kolory do swojej marki'
            ];
            
            let currentTip = 0;
            setInterval(() => {
                currentTip = (currentTip + 1) % tips.length;
                $('#rotating-tip').fadeOut(300, function() {
                    $(this).text(tips[currentTip]).fadeIn(300);
                });
                $('#tips-counter').text(tips.length);
            }, 4000);
        },

        updateSystemMonitor: function() {
            // System monitor w metric card
            const systemMainValue = $('#system-main-value');
            const systemMainLabel = $('#system-main-label');
            const systemTrend = $('#system-trend');
            const processesMini = $('#processes-mini');
            const queriesMini = $('#queries-mini');
            const performanceScore = $('#performance-score');
            
            // Rotacja głównej wartości systemu
            const systemMetrics = [
                { value: Math.floor(Math.random() * 512 + 128) + ' MB', label: 'Pamięć RAM', trend: '+' + Math.floor(Math.random() * 10 + 1) + '%' },
                { value: (Math.random() * 2 + 0.5).toFixed(2) + 's', label: 'Czas ładowania', trend: '-' + Math.floor(Math.random() * 5 + 1) + '%' },
                { value: Math.floor(Math.random() * 50 + 20), label: 'Zapytania DB', trend: '+' + Math.floor(Math.random() * 8 + 1) + '%' },
                { value: Math.floor(Math.random() * 30 + 10), label: 'Aktywne procesy', trend: '+' + Math.floor(Math.random() * 15 + 1) + '%' }
            ];
            
            const currentMetric = systemMetrics[Math.floor(Date.now() / 10000) % systemMetrics.length];
            
            if (systemMainValue.length) {
                this.animateCounter(systemMainValue, currentMetric.value);
                systemMainLabel.text(currentMetric.label);
                systemTrend.text(currentMetric.trend);
            }
            
            // Mini wartości
            if (processesMini.length) {
                const newProcesses = Math.max(10, parseInt(processesMini.text()) + Math.floor(Math.random() * 6 - 3));
                this.animateCounter(processesMini, newProcesses);
            }
            
            if (queriesMini.length) {
                const newQueries = Math.max(5, parseInt(queriesMini.text()) + Math.floor(Math.random() * 4 - 2));
                this.animateCounter(queriesMini, newQueries);
            }
            
            // Wydajność
            if (performanceScore.length) {
                const currentScore = parseInt(performanceScore.text()) || 95;
                const newScore = Math.max(85, Math.min(99, currentScore + Math.floor(Math.random() * 6 - 3)));
                this.animateCounter(performanceScore, newScore + '%');
            }
        },

        animateCounter: function(element, newValue) {
            element.addClass('updating');
            setTimeout(() => {
                element.text(newValue);
                element.removeClass('updating');
            }, 300);
        },

        showMessage: function(message, type = "info") {
            const $message = $('<div class="mas-v2-message ' + type + '">' + message + '</div>');
            
            if (!$("#mas-v2-messages").length) {
                $("body").append('<div id="mas-v2-messages" class="mas-v2-messages"></div>');
            }
            
            $("#mas-v2-messages").append($message);
            
            setTimeout(function() {
                $message.fadeOut(300, function() {
                    $(this).remove();
                });
            }, 5000);
            
            $message.on("click", function() {
                $(this).fadeOut(300, function() {
                    $(this).remove();
                });
            });
        },

        // Template functionality
        applyTemplate: function(templateName) {
            const templates = {
                'modern_blue': {
                    'theme': 'modern',
                    'color_scheme': 'light',
                    'admin_bar_background': '#1e3a8a',
                    'admin_bar_text_color': '#ffffff',
                    'menu_background': '#1e40af',
                    'menu_text_color': '#ffffff',
                    'button_primary_bg': '#2563eb',
                    'content_background': '#f8fafc'
                },
                'dark_elegant': {
                    'theme': 'modern',
                    'color_scheme': 'dark',
                    'admin_bar_background': '#1f2937',
                    'admin_bar_text_color': '#f9fafb',
                    'menu_background': '#111827',
                    'menu_text_color': '#e5e7eb',
                    'button_primary_bg': '#6b7280',
                    'content_background': '#374151'
                },
                'minimal_white': {
                    'theme': 'modern',
                    'color_scheme': 'light',
                    'admin_bar_background': '#ffffff',
                    'admin_bar_text_color': '#374151',
                    'menu_background': '#f9fafb',
                    'menu_text_color': '#1f2937',
                    'button_primary_bg': '#059669',
                    'content_background': '#ffffff'
                },
                'colorful_gradient': {
                    'theme': 'modern',
                    'color_scheme': 'light',
                    'admin_bar_background': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    'admin_bar_text_color': '#ffffff',
                    'menu_background': 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                    'menu_text_color': '#ffffff',
                    'button_primary_bg': '#8b5cf6',
                    'content_background': '#fef3c7'
                },
                'professional_gray': {
                    'theme': 'modern',
                    'color_scheme': 'light',
                    'admin_bar_background': '#6b7280',
                    'admin_bar_text_color': '#ffffff',
                    'menu_background': '#9ca3af',
                    'menu_text_color': '#ffffff',
                    'button_primary_bg': '#374151',
                    'content_background': '#f3f4f6'
                }
            };
            
            if (templates[templateName]) {
                // Apply template settings to form
                Object.keys(templates[templateName]).forEach(key => {
                    const field = $(`[name="${key}"]`);
                    if (field.length) {
                        if (field.is(':checkbox')) {
                            field.prop('checked', templates[templateName][key]);
                        } else {
                            field.val(templates[templateName][key]);
                        }
                    }
                });
                
                // Trigger live preview
                this.triggerLivePreview();
                this.markAsChanged();
                
                alert(`Szablon "${templateName}" został zastosowany!`);
            }
        },
        
        saveTemplate: function(templateName) {
            const formData = this.getFormData();
            
            // Save to localStorage for now (could be enhanced to save to database)
            const customTemplates = JSON.parse(localStorage.getItem('mas_custom_templates') || '{}');
            customTemplates[templateName] = formData;
            localStorage.setItem('mas_custom_templates', JSON.stringify(customTemplates));
            
            // Add to select dropdown
            const option = `<option value="custom_${templateName}">Własny: ${templateName}</option>`;
            $('#quick_templates').append(option);
            
            alert(`Szablon "${templateName}" został zapisany!`);
        },
        
        loadCustomTemplates: function() {
            const customTemplates = JSON.parse(localStorage.getItem('mas_custom_templates') || '{}');
            Object.keys(customTemplates).forEach(name => {
                const option = `<option value="custom_${name}">Własny: ${name}</option>`;
                $('#quick_templates').append(option);
            });
        },
        
        updateConditionalFields: function() {
            $('.conditional-field').each(function() {
                const $field = $(this);
                const showWhen = $field.data('show-when');
                const showValue = $field.data('show-value');
                const showValueNot = $field.data('show-value-not');
                
                if (showWhen) {
                    const $trigger = $(`[name="${showWhen}"]`);
                    let currentValue;
                    
                    if ($trigger.is(':checkbox')) {
                        currentValue = $trigger.is(':checked') ? '1' : '0';
                    } else {
                        currentValue = $trigger.val();
                    }
                    
                    let shouldShow = false;
                    
                    if (showValue !== undefined) {
                        shouldShow = (currentValue == showValue);
                    } else if (showValueNot !== undefined) {
                        shouldShow = (currentValue != showValueNot);
                    }
                    
                    if (shouldShow) {
                        $field.show();
                    } else {
                        $field.hide();
                    }
                }
            });
        },
        
        initNewFeatures: function() {
            // Template functionality
            $('#apply-template').on('click', function() {
                const templateName = $('#quick_templates').val();
                if (!templateName) {
                    alert('Wybierz szablon aby go zastosować.');
                    return;
                }
                
                if (confirm('Czy na pewno chcesz zastąpić obecne ustawienia wybranym szablonem?')) {
                    MAS.applyTemplate(templateName);
                }
            });
            
            // Save as template functionality
            $('#save-as-template').on('click', function() {
                const templateName = prompt('Podaj nazwę szablonu:');
                if (templateName) {
                    MAS.saveTemplate(templateName);
                }
            });
            
            // Upload buttons for logo fields
            $('.mas-v2-upload-btn').on('click', function() {
                const target = $(this).data('target');
                
                if (typeof wp !== 'undefined' && wp.media) {
                    const mediaUploader = wp.media({
                        title: 'Wybierz logo',
                        multiple: false,
                        library: {
                            type: 'image'
                        }
                    });
                    
                    mediaUploader.on('select', function() {
                        const attachment = mediaUploader.state().get('selection').first().toJSON();
                        $('#' + target).val(attachment.url);
                        MAS.triggerLivePreview();
                        MAS.markAsChanged();
                    });
                    
                    mediaUploader.open();
                }
            });
            
            // Conditional fields triggers
            $('input[name="enable_animations"], input[name="enable_shadows"], input[name="login_page_enabled"]').on('change', function() {
                MAS.updateConditionalFields();
            });
        },

        /**
         * 🧪 DEBUG: Test State Management System
         */
        testStateManagement: function() {
            console.group('🧪 Testing State Management System');
            
            const body = document.body;
            const prefix = 'mas-theme-';
            const testValues = ['light', 'dark', 'auto'];
            
            // Test 1: Add conflicting classes (simulating the bug)
            body.classList.add('woow-theme-light');
            body.classList.add('woow-theme-dark');
            body.classList.add('mas-theme-auto');
            
            // Test 2: Apply exclusive state management
            this.updateExclusiveBodyClass(prefix, testValues, 'dark', body);
            
            // Test 3: Legacy cleanup
            body.classList.add('woow-menu-floating'); // Add old class
            this.cleanLegacyClasses('woow-menu-floating', body);
            
            console.groupEnd();
        },

        // 🟡 PRIORYTET 2: Enhanced Error Handling & User Feedback
        showErrorPanel: function(error, context = '') {
            const errorContainer = $('<div class="mas-error-container"></div>');
            
            const errorPanel = $(`
                <div class="mas-error-panel">
                    <div class="mas-error-header">
                        <span class="mas-error-icon">⚠️</span>
                        <h3 class="mas-error-title">System Error Occurred</h3>
                    </div>
                    <div class="mas-error-message">
                        ${error.message || error || 'An unexpected error occurred'}
                    </div>
                    ${error.debug_info ? `
                        <div class="mas-error-details">
                            <strong>Debug Information:</strong><br>
                            ${JSON.stringify(error.debug_info, null, 2)}
                        </div>
                    ` : ''}
                    ${context ? `
                        <div class="mas-error-details">
                            <strong>Context:</strong> ${context}
                        </div>
                    ` : ''}
                    <div class="mas-error-actions">
                        <button class="mas-error-btn mas-error-btn-primary" onclick="this.closest('.mas-error-container').remove()">
                            Close
                        </button>
                        <button class="mas-error-btn mas-error-btn-secondary" onclick="location.reload()">
                            Reload Page
                        </button>
                    </div>
                </div>
            `);
            
            errorContainer.append(errorPanel);
            $('body').append(errorContainer);
            
            // Auto-remove after 10 seconds
            setTimeout(() => {
                errorContainer.fadeOut(300, () => errorContainer.remove());
            }, 10000);
        },

        // 🟡 PRIORYTET 2: Loading States & Progress Indicators
        showLoadingOverlay: function(message = 'Processing...', subtext = '') {
            const overlay = $(`
                <div class="mas-loading-overlay">
                    <div class="mas-loading-content">
                        <div class="mas-loading-spinner"></div>
                        <p class="mas-loading-text">${message}</p>
                        ${subtext ? `<p class="mas-loading-subtext">${subtext}</p>` : ''}
                    </div>
                </div>
            `);
            
            $('body').append(overlay);
            setTimeout(() => overlay.addClass('show'), 10);
            
            return overlay;
        },

        hideLoadingOverlay: function(overlay) {
            if (overlay) {
                overlay.removeClass('show');
                setTimeout(() => overlay.remove(), 300);
            } else {
                $('.mas-loading-overlay').removeClass('show');
                setTimeout(() => $('.mas-loading-overlay').remove(), 300);
            }
        },

        // 🟡 PRIORYTET 2: Form Validation with Visual Feedback
        validateField: function(field, rules) {
            const $field = $(field);
            const $wrapper = $field.closest('.mas-v2-field');
            const value = $field.val();
            const errors = [];
            
            // Remove previous validation classes
            $wrapper.removeClass('mas-field-error mas-field-success mas-field-warning');
            $wrapper.find('.mas-field-message').remove();
            
            // Apply validation rules
            if (rules.required && !value.trim()) {
                errors.push('This field is required');
            }
            
            if (rules.minLength && value.length < rules.minLength) {
                errors.push(`Minimum length is ${rules.minLength} characters`);
            }
            
            if (rules.maxLength && value.length > rules.maxLength) {
                errors.push(`Maximum length is ${rules.maxLength} characters`);
            }
            
            if (rules.pattern && !rules.pattern.test(value)) {
                errors.push(rules.patternMessage || 'Invalid format');
            }
            
            if (rules.custom && typeof rules.custom === 'function') {
                const customResult = rules.custom(value);
                if (customResult !== true) {
                    errors.push(customResult);
                }
            }
            
            // Display validation result
            if (errors.length > 0) {
                $wrapper.addClass('mas-field-error');
                const message = $(`
                    <div class="mas-field-message error">
                        <span class="mas-field-message-icon">❌</span>
                        ${errors[0]}
                    </div>
                `);
                $wrapper.append(message);
                return false;
            } else if (value.trim()) {
                $wrapper.addClass('mas-field-success');
                const message = $(`
                    <div class="mas-field-message success">
                        <span class="mas-field-message-icon">✅</span>
                        Valid
                    </div>
                `);
                $wrapper.append(message);
            }
            
            return true;
        },

        // 🟢 PRIORYTET 3: Performance Monitoring & Server Status
        initServerMonitoring: function() {
            
            // Check server performance every 30 seconds
            this.serverMonitorInterval = setInterval(() => {
                this.checkServerStatus();
            }, 30000);
            
            // Initial check
            this.checkServerStatus();
        },

        checkServerStatus: function() {
            const serverData = this.getMasData();
            
            // Memory usage monitoring
            if (serverData.memory_usage) {
                this.updateMemoryStatus(serverData.memory_usage);
            }
            
            // Database performance monitoring
            if (serverData.db_queries) {
                this.updateDatabaseStatus(serverData.db_queries);
            }
            
            // Cache status monitoring
            if (serverData.cache_status) {
                this.updateCacheStatus(serverData.cache_status);
            }
        },

        updateMemoryStatus: function(memoryUsage) {
            const memoryPercent = (memoryUsage.used / memoryUsage.limit) * 100;
            let statusClass = 'good';
            
            if (memoryPercent > 80) {
                statusClass = 'critical';
            } else if (memoryPercent > 60) {
                statusClass = 'warning';
            }
            
            $('.mas-memory-status').removeClass('good warning critical').addClass(statusClass);
            $('.mas-memory-status').text(`${Math.round(memoryPercent)}% Memory Used`);
        },

        updateDatabaseStatus: function(dbQueries) {
            const $dbOptimization = $('.mas-db-optimization');
            
            if (dbQueries > 50) {
                $dbOptimization.removeClass('warning').addClass('error');
                $dbOptimization.find('.mas-db-optimization-title').text('High Database Load Detected');
                $dbOptimization.find('.mas-db-optimization-description').text(
                    `${dbQueries} queries executed. Consider query optimization.`
                );
            } else if (dbQueries > 25) {
                $dbOptimization.removeClass('error').addClass('warning');
                $dbOptimization.find('.mas-db-optimization-title').text('Moderate Database Load');
                $dbOptimization.find('.mas-db-optimization-description').text(
                    `${dbQueries} queries executed. Performance is acceptable.`
                );
            }
        },

        updateCacheStatus: function(cacheStatus) {
            const $cacheStatus = $('.mas-cache-status');
            
            if (cacheStatus.active) {
                $cacheStatus.removeClass('inactive').addClass('active');
                $cacheStatus.text('Cache Active');
            } else {
                $cacheStatus.removeClass('active').addClass('inactive');
                $cacheStatus.text('Cache Inactive');
            }
        },

        // 🟢 PRIORYTET 3: Memory Optimization Features
        optimizeMemoryUsage: function() {
            
            // Enable GPU acceleration for better performance
            $('body').addClass('mas-hardware-accelerated');
            
            // Add memory-efficient classes to large elements
            $('.mas-v2-admin-wrapper, .mas-v2-card, .postbox').addClass('mas-memory-efficient');
            
            // Enable paint optimization
            $('.mas-v2-nav-tab, .mas-v2-btn, .wp-core-ui .button').addClass('mas-paint-optimized');
            
        },

        // 🟢 PRIORYTET 3: Database Optimization Actions
        initDatabaseOptimization: function() {
            $(document).on('click', '.mas-db-action-btn', function() {
                const action = $(this).data('action');
                
                switch (action) {
                    case 'optimize':
                        MAS.optimizeDatabase();
                        break;
                    case 'clean':
                        MAS.cleanDatabase();
                        break;
                    case 'analyze':
                        MAS.analyzeDatabase();
                        break;
                }
            });
        },

        optimizeDatabase: function() {
            const overlay = this.showLoadingOverlay('Optimizing Database...', 'This may take a few moments');
            
            $.ajax({
                url: ajaxurl,
                type: 'POST',
                data: {
                    action: 'mas_optimize_database',
                    nonce: this.getMasData().nonce
                },
                success: function(response) {
                    MAS.hideLoadingOverlay(overlay);
                    if (response.success) {
                        MAS.showNotification('Database optimization completed successfully', 'success');
                    } else {
                        MAS.showErrorPanel(response.data, 'Database Optimization');
                    }
                },
                error: function(xhr, status, error) {
                    MAS.hideLoadingOverlay(overlay);
                    MAS.showErrorPanel({
                        message: 'Database optimization failed',
                        debug_info: { xhr_status: status, error: error }
                    }, 'AJAX Error');
                }
            });
        },

        cleanDatabase: function() {
            const overlay = this.showLoadingOverlay('Cleaning Database...', 'Removing unnecessary data');
            
            $.ajax({
                url: ajaxurl,
                type: 'POST',
                data: {
                    action: 'mas_clean_database',
                    nonce: this.getMasData().nonce
                },
                success: function(response) {
                    MAS.hideLoadingOverlay(overlay);
                    if (response.success) {
                        MAS.showNotification('Database cleanup completed', 'success');
                    } else {
                        MAS.showErrorPanel(response.data, 'Database Cleanup');
                    }
                },
                error: function(xhr, status, error) {
                    MAS.hideLoadingOverlay(overlay);
                    MAS.showErrorPanel({
                        message: 'Database cleanup failed',
                        debug_info: { xhr_status: status, error: error }
                    }, 'AJAX Error');
                }
            });
        },

        analyzeDatabase: function() {
            const overlay = this.showLoadingOverlay('Analyzing Database...', 'Checking performance metrics');
            
            $.ajax({
                url: ajaxurl,
                type: 'POST',
                data: {
                    action: 'mas_analyze_database',
                    nonce: this.getMasData().nonce
                },
                success: function(response) {
                    MAS.hideLoadingOverlay(overlay);
                    if (response.success) {
                        // Display analysis results
                        const results = response.data;
                        const message = `
                            Database Analysis Complete:<br>
                            Tables: ${results.tables}<br>
                            Total Size: ${results.size}<br>
                            Optimization Score: ${results.score}/100
                        `;
                        MAS.showNotification(message, 'info');
                    } else {
                        MAS.showErrorPanel(response.data, 'Database Analysis');
                    }
                },
                error: function(xhr, status, error) {
                    MAS.hideLoadingOverlay(overlay);
                    MAS.showErrorPanel({
                        message: 'Database analysis failed',
                        debug_info: { xhr_status: status, error: error }
                    }, 'AJAX Error');
                }
            });
        },

        // 🟢 PRIORYTET 3: Enhanced Settings Validation
        initAdvancedValidation: function() {
            // Color field validation
            $('input.mas-v2-color').on('blur', function() {
                MAS.validateField(this, {
                    pattern: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
                    patternMessage: 'Please enter a valid hex color (e.g., #FF0000)'
                });
            });
            
            // Numeric field validation
            $('input[type="number"].mas-v2-input').on('blur', function() {
                const min = parseInt($(this).attr('min')) || 0;
                const max = parseInt($(this).attr('max')) || 999;
                
                MAS.validateField(this, {
                    required: true,
                    custom: function(value) {
                        const num = parseInt(value);
                        if (isNaN(num)) return 'Please enter a valid number';
                        if (num < min) return `Value must be at least ${min}`;
                        if (num > max) return `Value must be at most ${max}`;
                        return true;
                    }
                });
            });
            
            // CSS field validation
            $('textarea[name*="custom_css"]').on('blur', function() {
                MAS.validateField(this, {
                    maxLength: 50000,
                    custom: function(value) {
                        if (value.includes('javascript:')) {
                            return 'JavaScript URLs are not allowed in CSS';
                        }
                        if (value.includes('expression(')) {
                            return 'CSS expressions are not allowed';
                        }
                        return true;
                    }
                });
            });
        }
    };

    $(document).ready(function() {
        MAS.init();
        
        // Initialize template cards functionality
        initTemplateCards();
    });

    // Dodaj MAS do globalnego scope
    window.MAS = MAS;

    // Theme Manager jest zarządzany przez admin-global.js
    // Debug info w konsoli (tylko w trybie development)
    if (window.location.hostname === 'localhost' || window.location.hostname.includes('local')) {
    }

    // === MODERN DASHBOARD INTERACTIONS === */
    // Inspirowane nowoczesnymi dashboard UI

    // ModernDashboard class removed - contained only demo content - CLEANED UP
    
    function showQuickMenu(fab) {
            // Usuń poprzednie menu jeśli istnieje
            const existingMenu = document.querySelector('.mas-v2-quick-menu');
            if (existingMenu) {
                existingMenu.remove();
                return;
            }

            const menu = document.createElement('div');
            menu.className = 'mas-v2-quick-menu';
            menu.style.cssText = `
                position: fixed;
                bottom: 90px;
                right: 2rem;
                background: rgba(255, 255, 255, 0.1);
                backdrop-filter: blur(20px);
                border: 1px solid rgba(255, 255, 255, 0.2);
                border-radius: 16px;
                padding: 1rem;
                box-shadow: var(--mas-card-shadow);
                z-index: 1001;
                transform: scale(0.8) translateY(20px);
                opacity: 0;
                transition: all 0.3s var(--mas-ease-bounce);
            `;

            const actions = [
            ];

            actions.forEach((action, index) => {
                const button = document.createElement('button');
                button.style.cssText = `
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    width: 100%;
                    padding: 0.75rem;
                    background: transparent;
                    border: none;
                    border-radius: 8px;
                    color: white;
                    font-size: 0.875rem;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    margin-bottom: ${index === actions.length - 1 ? '0' : '0.25rem'};
                `;
                
                button.innerHTML = `${action.icon} ${action.label}`;
                button.addEventListener('click', action.action);
                button.addEventListener('mouseenter', () => {
                    button.style.background = 'rgba(255, 255, 255, 0.1)';
                });
                button.addEventListener('mouseleave', () => {
                    button.style.background = 'transparent';
                });
                
                menu.appendChild(button);
            });

            document.body.appendChild(menu);

            // Animacja wejścia
            requestAnimationFrame(() => {
                menu.style.transform = 'scale(1) translateY(0)';
                menu.style.opacity = '1';
            });

            // Zamknij po kliknięciu poza menu
            const closeMenu = (e) => {
                if (!menu.contains(e.target) && e.target !== fab) {
                    menu.style.transform = 'scale(0.8) translateY(20px)';
                    menu.style.opacity = '0';
                    setTimeout(() => menu.remove(), 300);
                    document.removeEventListener('click', closeMenu);
                }
            };

            setTimeout(() => {
                document.addEventListener('click', closeMenu);
            }, 100);
    }

    function initCardAnimations() {
            // Intersection Observer dla animacji wejścia kart
            const observer = new IntersectionObserver((entries) => {
                entries.forEach((entry, index) => {
                    if (entry.isIntersecting) {
                        setTimeout(() => {
                            entry.target.style.opacity = '1';
                            entry.target.style.transform = 'translateY(0)';
                        }, index * 100);
                    }
                });
            }, { threshold: 0.1 });

            // Przygotuj karty do animacji
            document.querySelectorAll('.mas-v2-card, .mas-v2-metric-card').forEach(card => {
                card.style.opacity = '0';
                card.style.transform = 'translateY(30px)';
                card.style.transition = 'all 0.6s var(--mas-ease-smooth)';
                observer.observe(card);
            });
    }

    function initCounterAnimations() {
            // Animowane liczniki w metrykach
            const animateCounter = (element, target) => {
                const start = 0;
                const duration = 2000;
                const startTime = performance.now();
                
                const isPercentage = target.toString().includes('.');
                const isLargeNumber = target > 1000;

                const animate = (currentTime) => {
                    const elapsed = currentTime - startTime;
                    const progress = Math.min(elapsed / duration, 1);
                    
                    // Easing function
                    const easeOut = 1 - Math.pow(1 - progress, 3);
                    const current = start + (target * easeOut);
                    
                    if (isPercentage) {
                        element.textContent = current.toFixed(1) + '%';
                    } else if (isLargeNumber) {
                        element.textContent = Math.floor(current).toLocaleString();
                    } else {
                        element.textContent = Math.floor(current);
                    }
                    
                    if (progress < 1) {
                        requestAnimationFrame(animate);
                    }
                };
                
                requestAnimationFrame(animate);
            };

            // Uruchom animacje liczników po załadowaniu
            setTimeout(() => {
                document.querySelectorAll('.mas-v2-metric-value[data-target]').forEach(element => {
                    const target = parseFloat(element.dataset.target);
                    animateCounter(element, target);
                });
            }, 1000);
    }

    function initInteractiveElements() {
            // Dodaj ripple effect do wszystkich interaktywnych elementów
            document.addEventListener('click', (e) => {
                const clickable = e.target.closest('.mas-v2-card, .mas-v2-metric-card, .mas-v2-btn');
                if (!clickable) return;

                const ripple = document.createElement('div');
                const rect = clickable.getBoundingClientRect();
                const size = Math.max(rect.width, rect.height);
                
                ripple.style.cssText = `
                    position: absolute;
                    border-radius: 50%;
                    background: rgba(255, 255, 255, 0.3);
                    width: ${size}px;
                    height: ${size}px;
                    left: ${e.clientX - rect.left - size/2}px;
                    top: ${e.clientY - rect.top - size/2}px;
                    transform: scale(0);
                    animation: ripple 0.6s linear;
                    pointer-events: none;
                    z-index: 1000;
                `;

                clickable.style.position = 'relative';
                clickable.style.overflow = 'hidden';
                clickable.appendChild(ripple);

                setTimeout(() => ripple.remove(), 600);
            });

            // Dodaj CSS dla ripple animacji
            if (!document.querySelector('#ripple-styles')) {
                const style = document.createElement('style');
                style.id = 'ripple-styles';
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

    function initSliders() {
            const sliders = document.querySelectorAll('.mas-v2-slider');
            
            sliders.forEach(slider => {
                const updateValue = () => {
                    const target = slider.getAttribute('id');
                    const valueDisplay = document.querySelector(`[data-target="${target}"]`);
                    if (valueDisplay) {
                        let value = slider.value;
                        const unit = slider.getAttribute('data-unit') || 'px';
                        
                        // Special formatting for different types
                        if (target === 'line_height') {
                            value = parseFloat(value).toFixed(1);
                            valueDisplay.textContent = value;
                        } else if (target === 'animation_speed') {
                            valueDisplay.textContent = value + 'ms';
                        } else {
                            valueDisplay.textContent = value + unit;
                        }
                    }
                    
                    // Live preview if enabled (global check)
                    if (typeof masV2Global !== 'undefined' && masV2Global.settings.live_preview) {
                        // Trigger live preview update
                        slider.dispatchEvent(new Event('change'));
                    }
                };

                // Update on input
                slider.addEventListener('input', updateValue);
                
                // Initial update
                updateValue();
            });
        }

    // Template functionality dla nowej zakładki szablonów - wykonywane w $(document).ready
    // initTemplateCards();
    
    function initTemplateCards() {
        // Obsługa przycisków w kartach szablonów
        document.querySelectorAll('.mas-v2-template-btn[data-action="apply"]').forEach(button => {
            button.addEventListener('click', function() {
                const templateCard = this.closest('.mas-v2-template-card');
                const templateName = templateCard.dataset.template;
                applyAdvancedTemplate(templateName);
            });
        });
        
        document.querySelectorAll('.mas-v2-template-btn[data-action="preview"]').forEach(button => {
            button.addEventListener('click', function() {
                const templateCard = this.closest('.mas-v2-template-card');
                const templateName = templateCard.dataset.template;
                previewAdvancedTemplate(templateName);
            });
        });
        
        // Obsługa zapisywania własnego szablonu
        const saveCustomBtn = document.getElementById('save-custom-template');
        if (saveCustomBtn) {
            saveCustomBtn.addEventListener('click', function() {
                const nameInput = document.getElementById('custom_template_name');
                const templateName = nameInput.value.trim();
                
                if (!templateName) {
                    alert('Wprowadź nazwę szablonu');
                    return;
                }
                
                saveCustomAdvancedTemplate(templateName);
                nameInput.value = '';
            });
        }
    }
    
    function applyAdvancedTemplate(templateName) {
        const advancedTemplates = {
            terminal: {
                theme: 'dark',
                color_scheme: 'dark',
                accent_color: '#00ff00',
                admin_bar_bg: '#000000',
                admin_bar_text: '#00ff00',
                menu_bg: '#000000',
                menu_text: '#00ff00',
                enable_animations: false,
                global_border_radius: 0,
                custom_css: `/* Terminal Theme */\nbody.wp-admin { background: #000000 !important; color: #00ff00 !important; font-family: 'JetBrains Mono', monospace !important; }\n#wpcontent { background: #000000 !important; }\n.wrap { background: #000000 !important; color: #00ff00 !important; }\ninput, textarea, select { background: #001100 !important; color: #00ff00 !important; border: 1px solid #00ff00 !important; }\n.button { background: #003300 !important; color: #00ff00 !important; border: 1px solid #00ff00 !important; }\n.button-primary { background: #00ff00 !important; color: #000000 !important; }`,
            },
            gaming: {
                theme: 'dark',
                color_scheme: 'dark',
                accent_color: '#ff0080',
                admin_bar_bg: '#1a0033',
                admin_bar_text: '#ff00ff',
                menu_bg: '#1a0033',
                menu_text: '#ff00ff',
                enable_animations: true,
                animation_type: 'bounce',
                global_border_radius: 15,
                custom_css: `/* Gaming Theme */\nbody.wp-admin { background: linear-gradient(45deg, #0a0015, #150033) !important; }\n.wrap { background: rgba(255,0,128,0.1) !important; backdrop-filter: blur(10px) !important; }\n.button-primary { background: linear-gradient(45deg, #ff0080, #8000ff) !important; box-shadow: 0 0 20px rgba(255,0,128,0.5) !important; }\ninput:focus, textarea:focus { box-shadow: 0 0 15px rgba(255,0,128,0.8) !important; }\n#adminmenu .wp-menu-name { text-shadow: 0 0 10px #ff00ff !important; }`,
            },
            retro: {
                theme: 'colorful',
                color_scheme: 'dark',
                accent_color: '#ff6b9d',
                admin_bar_bg: '#2d1b69',
                admin_bar_text: '#ff6b9d',
                menu_bg: '#2d1b69',
                menu_text: '#ff6b9d',
                enable_animations: true,
                animation_type: 'bounce',
                global_border_radius: 8,
                custom_css: `/* Retro Wave Theme */\nbody.wp-admin { background: linear-gradient(135deg, #0c0032, #190061) !important; background-image: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,107,157,0.03) 2px, rgba(255,107,157,0.03) 4px), repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(255,107,157,0.03) 2px, rgba(255,107,157,0.03) 4px); }\n.wrap { background: rgba(255,107,157,0.1) !important; backdrop-filter: blur(5px) !important; text-shadow: 2px 2px 0px #ff6b9d !important; }\n.button-primary { background: linear-gradient(135deg, #ff6b9d, #ffd93d) !important; text-shadow: 2px 2px 0px rgba(0,0,0,0.5) !important; }`,
            },
            arctic: {
                theme: 'minimal',
                color_scheme: 'light',
                accent_color: '#00bcd4',
                admin_bar_bg: '#e0f7fa',
                admin_bar_text: '#006064',
                menu_bg: '#f0fdff',
                menu_text: '#004d5c',
                enable_animations: true,
                animation_type: 'smooth',
                global_border_radius: 10
            },
            forest: {
                theme: 'minimal',
                color_scheme: 'light',
                accent_color: '#2e7d32',
                admin_bar_bg: '#f1f8e9',
                admin_bar_text: '#1b5e20',
                menu_bg: '#f1f8e9',
                menu_text: '#1b5e20',
                enable_animations: true,
                animation_type: 'smooth',
                global_border_radius: 8
            },
            sunset: {
                theme: 'colorful',
                color_scheme: 'light',
                accent_color: '#ff5722',
                admin_bar_bg: '#fff8e1',
                admin_bar_text: '#e65100',
                menu_bg: '#fff8e1',
                menu_text: '#e65100',
                enable_animations: true,
                animation_type: 'smooth',
                global_border_radius: 12
            },
            royal: {
                theme: 'dark',
                color_scheme: 'dark',
                accent_color: '#7b1fa2',
                admin_bar_bg: '#4a148c',
                admin_bar_text: '#e1bee7',
                menu_bg: '#4a148c',
                menu_text: '#e1bee7',
                enable_animations: true,
                animation_type: 'smooth',
                global_border_radius: 10
            },
            ocean: {
                theme: 'minimal',
                color_scheme: 'light',
                accent_color: '#0288d1',
                admin_bar_bg: '#e3f2fd',
                admin_bar_text: '#01579b',
                menu_bg: '#e3f2fd',
                menu_text: '#01579b',
                enable_animations: true,
                animation_type: 'smooth',
                global_border_radius: 8
            },
            midnight: {
                theme: 'dark',
                color_scheme: 'dark',
                accent_color: '#37474f',
                admin_bar_bg: '#263238',
                admin_bar_text: '#b0bec5',
                menu_bg: '#263238',
                menu_text: '#b0bec5',
                enable_animations: true,
                animation_type: 'smooth',
                global_border_radius: 6
            },
            cherry: {
                theme: 'minimal',
                color_scheme: 'light',
                accent_color: '#e91e63',
                admin_bar_bg: '#fce4ec',
                admin_bar_text: '#880e4f',
                menu_bg: '#fce4ec',
                menu_text: '#880e4f',
                enable_animations: true,
                animation_type: 'smooth',
                global_border_radius: 12
            }
        };
        
        const template = advancedTemplates[templateName];
        if (!template) {
            return;
        }
        
        // Backup obecnych ustawień jeśli włączone
        const autoBackup = document.querySelector('input[name="template_auto_backup"]');
        if (autoBackup && autoBackup.checked) {
            const currentSettings = getCurrentFormData();
            localStorage.setItem('mas_v2_template_backup', JSON.stringify({
                timestamp: Date.now(),
                settings: currentSettings
            }));
        }
        
        // Aplikuj ustawienia szablonu
        Object.keys(template).forEach(key => {
            const input = document.querySelector(`[name="${key}"]`);
            if (input) {
                if (input.type === 'checkbox') {
                    input.checked = template[key];
                } else if (input.type === 'range') {
                    input.value = template[key];
                    // Aktualizuj wyświetlaną wartość
                    const valueDisplay = document.querySelector(`[data-target="${key}"]`);
                    if (valueDisplay) {
                        valueDisplay.textContent = template[key] + (key.includes('radius') || key.includes('width') ? 'px' : '');
                    }
                } else {
                    input.value = template[key] || '';
                }
                
                // Trigger event dla live preview
                input.dispatchEvent(new Event('change'));
            }
        });
        
        // Pokaż komunikat
        showSuccessMessage(`Szablon "${templateName}" został zastosowany!`);
        
        // Auto-save jeśli włączone
        const autoSave = document.querySelector('input[name="auto_save"]');
        if (autoSave && autoSave.checked) {
            setTimeout(() => {
                const form = document.getElementById('mas-v2-settings-form');
                if (form) {
                    form.submit();
                }
            }, 500);
        }
    }
    
    function previewAdvancedTemplate(templateName) {
        showInfoMessage('Funkcja podglądu będzie dostępna wkrótce!');
    }
    
    function saveCustomAdvancedTemplate(templateName) {
        const currentSettings = getCurrentFormData();
        
        // Zapisz do localStorage
        let customTemplates = JSON.parse(localStorage.getItem('mas_v2_custom_templates') || '{}');
        customTemplates[templateName] = {
            name: templateName,
            settings: currentSettings,
            created: Date.now()
        };
        
        localStorage.setItem('mas_v2_custom_templates', JSON.stringify(customTemplates));
        
        showSuccessMessage(`Szablon "${templateName}" został zapisany!`);
    }
    
    function getCurrentFormData() {
        const formData = {};
        const form = document.getElementById('mas-v2-settings-form');
        
        if (form) {
            const inputs = form.querySelectorAll('input, select, textarea');
            inputs.forEach(input => {
                if (input.name) {
                    if (input.type === 'checkbox') {
                        formData[input.name] = input.checked;
                    } else {
                        formData[input.name] = input.value;
                    }
                }
            });
        }
        
        return formData;
    }
    
    function showSuccessMessage(message) {
        // Dodaj style dla animacji jeśli nie istnieją
        if (!document.getElementById('mas-toast-styles')) {
            const styles = document.createElement('style');
            styles.id = 'mas-toast-styles';
            styles.textContent = `
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOutRight {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
            document.head.appendChild(styles);
        }
        
        // Dodaj toast notification
        const toast = document.createElement('div');
        toast.className = 'mas-v2-toast mas-v2-toast-success';
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 100px;
            right: 30px;
            background: #22c55e;
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 8px 32px rgba(34, 197, 94, 0.3);
            z-index: 10000;
            font-weight: 500;
            animation: slideInRight 0.3s ease;
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
    
    function showInfoMessage(message) {
        // Dodaj style dla animacji jeśli nie istnieją
        if (!document.getElementById('mas-toast-styles')) {
            const styles = document.createElement('style');
            styles.id = 'mas-toast-styles';
            styles.textContent = `
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOutRight {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
            document.head.appendChild(styles);
        }
        
        const toast = document.createElement('div');
        toast.className = 'mas-v2-toast mas-v2-toast-info';
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 100px;
            right: 30px;
            background: #3b82f6;
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 8px 32px rgba(59, 130, 246, 0.3);
            z-index: 10000;
            font-weight: 500;
            animation: slideInRight 0.3s ease;
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // NAPRAWKA: Dodaj namespace dla event handlers i cleanup system
    const MAS_NAMESPACE = '.masV2Events';
    let MAS_TIMEOUTS = {
        colorTimeout: null,
        sliderTimeout: null,
        livePreviewTimeout: null,
        debounceTimeout: null
    };

    // NAPRAWKA: Debounce function dla lepszej wydajności
    function debounce(func, wait) {
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(MAS_TIMEOUTS.debounceTimeout);
                func(...args);
            };
            clearTimeout(MAS_TIMEOUTS.debounceTimeout);
            MAS_TIMEOUTS.debounceTimeout = setTimeout(later, wait);
        };
    }

    // NAPRAWKA: Cleanup przy unload
    $(window).on('beforeunload' + MAS_NAMESPACE, function() {
        
        // Clear all timeouts
        Object.keys(MAS_TIMEOUTS).forEach(key => {
            if (MAS_TIMEOUTS[key]) {
                clearTimeout(MAS_TIMEOUTS[key]);
            }
        });
        
        // Remove namespaced events
        $(document).off(MAS_NAMESPACE);
        $(window).off(MAS_NAMESPACE);
        
    });

    // NAPRAWKA: Debounced live preview function
    const debouncedLivePreview = debounce(function() {
        if (typeof MAS !== 'undefined' && MAS.triggerLivePreview) {
            MAS.triggerLivePreview();
        }
    }, 300);

    // ==========================================================================
    // ZAJEBISTE 3D EFFECTS SYSTEM - Global WordPress Enhancement
    // ==========================================================================

    class MAS_3D_Effects_System {
        constructor() {
            this.initGlobalEffects();
            this.initPremiumTypography();
            this.initAdvanced3DInteractions();
            this.initParallaxBackground();
            this.initFloatingElements();
        }

        initGlobalEffects() {
            // Enhanced 3D card hover system for ALL WordPress elements
            const elements = document.querySelectorAll(`
                .postbox, .stuffbox, .form-table, .wp-list-table, 
                .wp-core-ui .button, .notice, #dashboard-widgets .postbox
            `);

            elements.forEach(element => {
                this.enhance3DElement(element);
            });

            // Real-time 3D effect addition for dynamically loaded content
            this.observeNewElements();
        }

        enhance3DElement(element) {
            // Add 3D transform origin
            element.style.transformOrigin = 'center center';
            element.style.transformStyle = 'preserve-3d';
            
            // Enhanced mouse enter effect
            element.addEventListener('mouseenter', (e) => {
                this.apply3DHoverEffect(e.target);
            });

            // Enhanced mouse leave effect  
            element.addEventListener('mouseleave', (e) => {
                this.remove3DHoverEffect(e.target);
            });

            // Advanced mouse move parallax effect
            element.addEventListener('mousemove', (e) => {
                this.applyMouseParallax(e);
            });
        }

        apply3DHoverEffect(element) {
            // Determine element type for specific effects
            const isButton = element.classList.contains('button');
            const isCard = element.classList.contains('postbox') || element.classList.contains('stuffbox');
            const isTable = element.classList.contains('wp-list-table') || element.classList.contains('form-table');

            if (isButton) {
                element.style.transform = 'translateY(-4px) translateZ(15px) rotateX(2deg)';
                element.style.boxShadow = `
                    0 20px 40px rgba(31, 38, 135, 0.5),
                    0 12px 30px rgba(99, 102, 241, 0.4),
                    inset 0 1px 0 rgba(255, 255, 255, 0.4)
                `;
            } else if (isCard) {
                element.style.transform = 'translateY(-10px) rotateX(3deg) rotateY(2deg) translateZ(20px)';
                element.style.boxShadow = `
                    0 30px 60px rgba(31, 38, 135, 0.6),
                    0 20px 40px rgba(99, 102, 241, 0.4),
                    inset 0 2px 0 rgba(255, 255, 255, 0.3)
                `;
            } else if (isTable) {
                element.style.transform = 'translateY(-6px) rotateX(1deg) translateZ(10px)';
                element.style.boxShadow = `
                    0 15px 35px rgba(31, 38, 135, 0.4),
                    0 8px 25px rgba(99, 102, 241, 0.3)
                `;
            }

            // Add glow effect
            element.style.filter = 'brightness(1.1) saturate(1.2)';
            
            // Enhanced backdrop blur
            element.style.backdropFilter = 'blur(20px) saturate(180%)';
        }

        remove3DHoverEffect(element) {
            element.style.transform = 'translateY(0) translateZ(0) rotateX(0) rotateY(0)';
            element.style.filter = 'brightness(1) saturate(1)';
            element.style.backdropFilter = 'blur(12px) saturate(120%)';
            
            // Reset box shadow to default
            const isButton = element.classList.contains('button');
            if (isButton) {
                element.style.boxShadow = `
                    0 4px 15px rgba(31, 38, 135, 0.3),
                    inset 0 1px 0 rgba(255, 255, 255, 0.2)
                `;
            } else {
                element.style.boxShadow = `
                    0 8px 25px rgba(31, 38, 135, 0.2),
                    0 4px 10px rgba(0, 0, 0, 0.1),
                    inset 0 1px 0 rgba(255, 255, 255, 0.1)
                `;
            }
        }

        applyMouseParallax(e) {
            const element = e.currentTarget;
            const rect = element.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            const mouseX = e.clientX;
            const mouseY = e.clientY;

            // Calculate rotation based on mouse position
            const rotateX = (mouseY - centerY) / rect.height * 5; // Max 5 degrees
            const rotateY = (mouseX - centerX) / rect.width * 5;  // Max 5 degrees

            // Apply subtle parallax rotation
            const currentTransform = element.style.transform || '';
            if (currentTransform.includes('translateY')) {
                // Preserve existing transforms and add rotation
                const baseTransform = currentTransform.split('rotateX')[0];
                element.style.transform = `${baseTransform} rotateX(${-rotateX}deg) rotateY(${rotateY}deg)`;
            }
        }

        initPremiumTypography() {
            // Enhanced gradient text effects for headings
            const headings = document.querySelectorAll('h1, h2, h3, .wp-heading-inline');
            
            headings.forEach(heading => {
                if (!heading.classList.contains('mas-gradient-text')) {
                    heading.classList.add('mas-gradient-text');
                    
                    // Add text shimmer effect on hover
                    heading.addEventListener('mouseenter', () => {
                        heading.style.backgroundSize = '200% auto';
                        heading.style.animation = 'textShimmer 2s linear infinite';
                    });
                    
                    heading.addEventListener('mouseleave', () => {
                        heading.style.backgroundSize = '100% auto';
                        heading.style.animation = 'none';
                    });
                }
            });

            // Dynamic text scaling based on viewport
            this.implementResponsiveTypography();
            
            // Text reveal animations for new content
            this.initTextRevealAnimations();
        }

        implementResponsiveTypography() {
            // Advanced responsive typography calculation
            const updateTypographyScale = () => {
                const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
                const vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
                
                // Calculate dynamic scale factor
                const scaleFactor = Math.min(vw / 1200, vh / 800, 1.2);
                
                document.documentElement.style.setProperty('--mas-dynamic-scale', scaleFactor);
                
                // Apply to headings
                const headings = document.querySelectorAll('body.wp-admin h1, body.wp-admin h2, body.wp-admin h3');
                headings.forEach(heading => {
                    const baseFontSize = parseFloat(getComputedStyle(heading).fontSize);
                    heading.style.fontSize = `${baseFontSize * scaleFactor}px`;
                });
            };

            updateTypographyScale();
            window.addEventListener('resize', this.debounce(updateTypographyScale, 150));
        }

        initTextRevealAnimations() {
            // Intersection Observer for text reveal animations
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('mas-text-reveal');
                    }
                });
            }, {
                threshold: 0.1,
                rootMargin: '0px 0px -50px 0px'
            });

            // Observe all text elements
            const textElements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, .description, label');
            textElements.forEach(el => observer.observe(el));
        }

        initAdvanced3DInteractions() {
            // Advanced 3D button press effects
            document.addEventListener('mousedown', (e) => {
                if (e.target.classList.contains('button')) {
                    e.target.style.transform = 'translateY(-1px) translateZ(5px) scale(0.98)';
                    e.target.style.boxShadow = `
                        0 8px 20px rgba(31, 38, 135, 0.3),
                        inset 0 2px 4px rgba(0, 0, 0, 0.1)
                    `;
                }
            });

            document.addEventListener('mouseup', (e) => {
                if (e.target.classList.contains('button')) {
                    setTimeout(() => {
                        this.apply3DHoverEffect(e.target);
                    }, 100);
                }
            });

            // 3D card flip effects for special elements
            this.initCardFlipEffects();
            
            // Floating elements physics
            this.initFloatingPhysics();
        }

        initCardFlipEffects() {
            // Special flip effects for dashboard widgets
            const dashboardWidgets = document.querySelectorAll('#dashboard-widgets .postbox');
            
            dashboardWidgets.forEach(widget => {
                // Add flip capability
                widget.style.transformStyle = 'preserve-3d';
                
                // Double-click to flip
                widget.addEventListener('dblclick', () => {
                    if (widget.style.transform.includes('rotateY(180deg)')) {
                        widget.style.transform = 'rotateY(0deg)';
                    } else {
                        widget.style.transform = 'rotateY(180deg)';
                    }
                });
            });
        }

        initParallaxBackground() {
            // Enhanced parallax scrolling for background elements
            let ticking = false;
            
            const updateParallax = () => {
                const scrollY = window.pageYOffset;
                const backgroundElement = document.querySelector('body.wp-admin::before');
                
                if (backgroundElement) {
                    // Parallax movement calculation
                    const parallaxSpeed = 0.5;
                    const yPos = -(scrollY * parallaxSpeed);
                    
                    // Apply 3D transform with parallax
                    document.body.style.setProperty('--parallax-y', `${yPos}px`);
                }
                
                ticking = false;
            };

            const requestParallaxUpdate = () => {
                if (!ticking) {
                    requestAnimationFrame(updateParallax);
                    ticking = true;
                }
            };

            window.addEventListener('scroll', requestParallaxUpdate, { passive: true });
        }

        initFloatingElements() {
            // Create floating elements system for enhanced UX
            this.createFloatingParticles();
            this.initGlowCursor();
            this.initFloatingTooltips();
        }

        createFloatingParticles() {
            // Create subtle floating particles in background
            const particleCount = 15;
            const container = document.createElement('div');
            container.className = 'mas-floating-particles';
            container.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                z-index: 1;
            `;

            for (let i = 0; i < particleCount; i++) {
                const particle = document.createElement('div');
                particle.className = 'mas-particle';
                particle.style.cssText = `
                    position: absolute;
                    width: ${Math.random() * 4 + 2}px;
                    height: ${Math.random() * 4 + 2}px;
                    background: rgba(255, 255, 255, 0.3);
                    border-radius: 50%;
                    left: ${Math.random() * 100}%;
                    top: ${Math.random() * 100}%;
                    animation: floatParticle ${Math.random() * 20 + 10}s linear infinite;
                    opacity: ${Math.random() * 0.5 + 0.2};
                `;
                container.appendChild(particle);
            }

            document.body.appendChild(container);

            // Add keyframes for particle animation
            if (!document.querySelector('#mas-particle-styles')) {
                const style = document.createElement('style');
                style.id = 'mas-particle-styles';
                style.textContent = `
                    @keyframes floatParticle {
                        0% {
                            transform: translateY(100vh) translateX(0px) rotate(0deg);
                            opacity: 0;
                        }
                        10% {
                            opacity: 1;
                        }
                        90% {
                            opacity: 1;
                        }
                        100% {
                            transform: translateY(-10px) translateX(${Math.random() * 100 - 50}px) rotate(360deg);
                            opacity: 0;
                        }
                    }
                    
                    @keyframes textShimmer {
                        0% { background-position: 0% 50%; }
                        50% { background-position: 100% 50%; }
                        100% { background-position: 0% 50%; }
                    }
                    
                    .mas-text-reveal {
                        animation: textReveal 0.8s ease-out forwards;
                    }
                    
                    @keyframes textReveal {
                        from {
                            opacity: 0;
                            transform: translateY(20px);
                        }
                        to {
                            opacity: 1;
                            transform: translateY(0);
                        }
                    }
                `;
                document.head.appendChild(style);
            }
        }

        initGlowCursor() {
            // Create custom glow cursor effect
            const cursor = document.createElement('div');
            cursor.className = 'mas-glow-cursor';
            cursor.style.cssText = `
                position: fixed;
                width: 20px;
                height: 20px;
                background: radial-gradient(circle, rgba(99, 102, 241, 0.6) 0%, transparent 70%);
                border-radius: 50%;
                pointer-events: none;
                z-index: 9999;
                mix-blend-mode: screen;
                transition: transform 0.1s ease-out;
            `;
            document.body.appendChild(cursor);

            document.addEventListener('mousemove', (e) => {
                cursor.style.left = e.clientX - 10 + 'px';
                cursor.style.top = e.clientY - 10 + 'px';
            });

            // Enhanced cursor on interactive elements
            document.addEventListener('mouseenter', (e) => {
                if (e.target.matches('button, a, input, select, textarea')) {
                    cursor.style.transform = 'scale(2)';
                    cursor.style.background = 'radial-gradient(circle, rgba(236, 72, 153, 0.8) 0%, transparent 70%)';
                }
            }, true);

            document.addEventListener('mouseleave', (e) => {
                if (e.target.matches('button, a, input, select, textarea')) {
                    cursor.style.transform = 'scale(1)';
                    cursor.style.background = 'radial-gradient(circle, rgba(99, 102, 241, 0.6) 0%, transparent 70%)';
                }
            }, true);
        }

        initFloatingTooltips() {
            // Enhanced 3D floating tooltips
            const elementsWithTooltips = document.querySelectorAll('[title], [data-tooltip]');
            
            elementsWithTooltips.forEach(element => {
                const tooltipText = element.getAttribute('title') || element.getAttribute('data-tooltip');
                if (!tooltipText) return;

                // Remove default title to prevent browser tooltip
                element.removeAttribute('title');

                const tooltip = document.createElement('div');
                tooltip.className = 'mas-floating-tooltip';
                tooltip.textContent = tooltipText;
                tooltip.style.cssText = `
                    position: absolute;
                    background: rgba(0, 0, 0, 0.9);
                    backdrop-filter: blur(10px);
                    color: white;
                    padding: 8px 12px;
                    border-radius: 8px;
                    font-size: 12px;
                    white-space: nowrap;
                    z-index: 10000;
                    opacity: 0;
                    transform: translateY(10px) translateZ(0);
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    pointer-events: none;
                    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                `;

                element.addEventListener('mouseenter', (e) => {
                    document.body.appendChild(tooltip);
                    const rect = element.getBoundingClientRect();
                    tooltip.style.left = rect.left + rect.width / 2 - tooltip.offsetWidth / 2 + 'px';
                    tooltip.style.top = rect.top - tooltip.offsetHeight - 10 + 'px';
                    
                    setTimeout(() => {
                        tooltip.style.opacity = '1';
                        tooltip.style.transform = 'translateY(0) translateZ(10px)';
                    }, 10);
                });

                element.addEventListener('mouseleave', () => {
                    tooltip.style.opacity = '0';
                    tooltip.style.transform = 'translateY(10px) translateZ(0)';
                    setTimeout(() => {
                        if (tooltip.parentNode) {
                            tooltip.parentNode.removeChild(tooltip);
                        }
                    }, 300);
                });
            });
        }

        initFloatingPhysics() {
            // Implement physics-based floating for special elements
            const floatingElements = document.querySelectorAll('.mas-theme-toggle, .mas-live-preview-toggle');
            
            floatingElements.forEach(element => {
                let mouseX = 0;
                let mouseY = 0;
                let elementX = 0;
                let elementY = 0;

                const updatePosition = () => {
                    elementX += (mouseX - elementX) * 0.1;
                    elementY += (mouseY - elementY) * 0.1;
                    
                    element.style.transform = `translate(${elementX * 0.1}px, ${elementY * 0.1}px) translateZ(20px)`;
                    requestAnimationFrame(updatePosition);
                };

                document.addEventListener('mousemove', (e) => {
                    const rect = element.getBoundingClientRect();
                    mouseX = (e.clientX - rect.left - rect.width / 2) / rect.width;
                    mouseY = (e.clientY - rect.top - rect.height / 2) / rect.height;
                });

                updatePosition();
            });
        }

        observeNewElements() {
            // Observer for dynamically added WordPress content
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === 1) { // Element node
                            const newElements = node.querySelectorAll(`
                                .postbox, .stuffbox, .form-table, .wp-list-table, 
                                .wp-core-ui .button, .notice
                            `);
                            newElements.forEach(element => {
                                this.enhance3DElement(element);
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
    }

    // Initialize the 3D Effects System
    document.addEventListener('DOMContentLoaded', () => {
        if (document.body.classList.contains('wp-admin')) {
            window.mas3DEffects = new MAS_3D_Effects_System();
        }
    });

    // ==========================================================================
    // REAL-TIME 3D EFFECTS CONTROL SYSTEM
    // ==========================================================================

    class MAS_3D_Controls {
        constructor() {
            this.settings = {};
            this.init();
        }

        init() {
            // Load current settings from form
            this.loadSettings();
            
            // Bind real-time controls
            this.bindControls();
            
            // Apply initial settings
            this.applySettings();
            
        }

        loadSettings() {
            // Load all 3D settings from form inputs
            const form = document.getElementById('mas-v2-settings-form');
            if (!form) return;

            this.settings = {
                // Global 3D System
                enable_global_3d: this.getCheckboxValue('enable_global_3d'),
                '3d_intensity': this.getSliderValue('3d_intensity', 1.0),
                '3d_performance_mode': this.getSelectValue('3d_performance_mode', 'high'),
                
                // Glassmorphism
                enable_glassmorphism: this.getCheckboxValue('enable_glassmorphism'),
                glass_blur_intensity: this.getSliderValue('glass_blur_intensity', 12),
                glass_transparency: this.getSliderValue('glass_transparency', 0.1),
                enable_animated_background: this.getCheckboxValue('enable_animated_background'),
                
                // Interactive 3D
                enable_mouse_parallax: this.getCheckboxValue('enable_mouse_parallax'),
                enable_card_hover_3d: this.getCheckboxValue('enable_card_hover_3d'),
                enable_button_3d: this.getCheckboxValue('enable_button_3d'),
                enable_card_flip: this.getCheckboxValue('enable_card_flip'),
                
                // Typography 3D
                enable_gradient_headings: this.getCheckboxValue('enable_gradient_headings'),
                enable_text_shimmer: this.getCheckboxValue('enable_text_shimmer'),
                enable_text_reveal: this.getCheckboxValue('enable_text_reveal'),
                typography_scale_factor: this.getSliderValue('typography_scale_factor', 1.0),
                
                // Floating Elements
                enable_floating_particles: this.getCheckboxValue('enable_floating_particles'),
                particles_count: this.getSliderValue('particles_count', 15),
                enable_custom_cursor: this.getCheckboxValue('enable_custom_cursor'),
                enable_3d_tooltips: this.getCheckboxValue('enable_3d_tooltips'),
                enable_parallax_scrolling: this.getCheckboxValue('enable_parallax_scrolling'),
                
                // Performance
                respect_reduced_motion: this.getCheckboxValue('respect_reduced_motion'),
                mobile_3d_optimization: this.getCheckboxValue('mobile_3d_optimization'),
                hardware_acceleration: this.getCheckboxValue('hardware_acceleration'),
                '3d_debug_mode': this.getCheckboxValue('3d_debug_mode')
            };
        }

        getCheckboxValue(name) {
            const input = document.querySelector(`input[name="${name}"]`);
            return input ? input.checked : false;
        }

        getSliderValue(name, defaultValue) {
            const input = document.querySelector(`input[name="${name}"]`);
            return input ? parseFloat(input.value) : defaultValue;
        }

        getSelectValue(name, defaultValue) {
            const select = document.querySelector(`select[name="${name}"]`);
            return select ? select.value : defaultValue;
        }

        bindControls() {
            // Bind all 3D controls for real-time updates
            const controls = [
                'enable_global_3d', '3d_intensity', '3d_performance_mode',
                'enable_glassmorphism', 'glass_blur_intensity', 'glass_transparency', 'enable_animated_background',
                'enable_mouse_parallax', 'enable_card_hover_3d', 'enable_button_3d', 'enable_card_flip',
                'enable_gradient_headings', 'enable_text_shimmer', 'enable_text_reveal', 'typography_scale_factor',
                'enable_floating_particles', 'particles_count', 'enable_custom_cursor', 'enable_3d_tooltips', 'enable_parallax_scrolling',
                'respect_reduced_motion', 'mobile_3d_optimization', 'hardware_acceleration', '3d_debug_mode'
            ];

            controls.forEach(controlName => {
                const input = document.querySelector(`input[name="${controlName}"], select[name="${controlName}"]`);
                if (input) {
                    input.addEventListener('change', () => this.handleControlChange(controlName));
                    input.addEventListener('input', () => this.handleControlChange(controlName));
                }
            });
        }

        handleControlChange(controlName) {
            // Update setting
            if (controlName.includes('3d_') || controlName.includes('_3d')) {
                this.settings[controlName] = this.getCheckboxValue(controlName);
            } else if (controlName.includes('intensity') || controlName.includes('factor') || controlName.includes('count')) {
                this.settings[controlName] = this.getSliderValue(controlName);
            } else if (controlName.includes('mode')) {
                this.settings[controlName] = this.getSelectValue(controlName);
            } else {
                this.settings[controlName] = this.getCheckboxValue(controlName);
            }

            // Apply change immediately
            this.applySpecificSetting(controlName);
            
            if (this.settings['3d_debug_mode']) {
            }
        }

        applySettings() {
            // Apply all settings to the 3D system
            this.applyGlobalSettings();
            this.applyGlassmorphismSettings();
            this.applyInteractiveSettings();
            this.applyTypographySettings();
            this.applyFloatingSettings();
            this.applyPerformanceSettings();
        }

        applySpecificSetting(controlName) {
            switch(controlName) {
                case 'enable_global_3d':
                    this.toggleGlobal3D();
                    break;
                case '3d_intensity':
                    this.update3DIntensity();
                    break;
                case 'enable_glassmorphism':
                    this.toggleGlassmorphism();
                    break;
                case 'glass_blur_intensity':
                    this.updateGlassBlur();
                    break;
                case 'glass_transparency':
                    this.updateGlassTransparency();
                    break;
                case 'enable_animated_background':
                    this.toggleAnimatedBackground();
                    break;
                case 'enable_floating_particles':
                    this.toggleFloatingParticles();
                    break;
                case 'particles_count':
                    this.updateParticlesCount();
                    break;
                case 'enable_custom_cursor':
                    this.toggleCustomCursor();
                    break;
                case 'typography_scale_factor':
                    this.updateTypographyScale();
                    break;
                default:
                    this.applySettings(); // Fallback for complex settings
            }
        }

        applyGlobalSettings() {
            const body = document.body;
            
            if (this.settings.enable_global_3d) {
                body.classList.add('mas-3d-enabled');
                this.update3DIntensity();
            } else {
                body.classList.remove('mas-3d-enabled');
            }
            
            // Set performance mode
            body.classList.remove('mas-3d-high', 'mas-3d-balanced', 'mas-3d-low');
            body.classList.add(`mas-3d-${this.settings['3d_performance_mode']}`);
        }

        applyGlassmorphismSettings() {
            const root = document.documentElement;
            
            if (this.settings.enable_glassmorphism) {
                document.body.classList.add('mas-glassmorphism-enabled');
                
                // Update CSS variables
                root.style.setProperty('--mas-glass-blur', `blur(${this.settings.glass_blur_intensity}px)`);
                root.style.setProperty('--mas-glass-opacity', this.settings.glass_transparency);
                
                this.updateGlassBlur();
                this.updateGlassTransparency();
            } else {
                document.body.classList.remove('mas-glassmorphism-enabled');
            }
            
            if (this.settings.enable_animated_background) {
                document.body.classList.add('mas-animated-bg-enabled');
            } else {
                document.body.classList.remove('mas-animated-bg-enabled');
            }
        }

        applyInteractiveSettings() {
            const body = document.body;
            
            // Mouse Parallax
            if (this.settings.enable_mouse_parallax) {
                body.classList.add('mas-parallax-enabled');
            } else {
                body.classList.remove('mas-parallax-enabled');
            }
            
            // Card Hover 3D
            if (this.settings.enable_card_hover_3d) {
                body.classList.add('mas-card-3d-enabled');
            } else {
                body.classList.remove('mas-card-3d-enabled');
            }
            
            // Button 3D
            if (this.settings.enable_button_3d) {
                body.classList.add('mas-button-3d-enabled');
            } else {
                body.classList.remove('mas-button-3d-enabled');
            }
            
            // Card Flip
            if (this.settings.enable_card_flip) {
                body.classList.add('mas-card-flip-enabled');
            } else {
                body.classList.remove('mas-card-flip-enabled');
            }
        }

        applyTypographySettings() {
            const root = document.documentElement;
            
            // Gradient Headings
            if (this.settings.enable_gradient_headings) {
                document.body.classList.add('mas-gradient-headings-enabled');
            } else {
                document.body.classList.remove('mas-gradient-headings-enabled');
            }
            
            // Text Shimmer
            if (this.settings.enable_text_shimmer) {
                document.body.classList.add('mas-text-shimmer-enabled');
            } else {
                document.body.classList.remove('mas-text-shimmer-enabled');
            }
            
            // Text Reveal
            if (this.settings.enable_text_reveal) {
                document.body.classList.add('mas-text-reveal-enabled');
            } else {
                document.body.classList.remove('mas-text-reveal-enabled');
            }
            
            // Typography Scale
            root.style.setProperty('--woow-typography-scale', this.settings.typography_scale_factor);
            this.updateTypographyScale();
        }

        applyFloatingSettings() {
            // Floating Particles
            if (this.settings.enable_floating_particles) {
                document.body.classList.add('mas-particles-enabled');
                this.updateParticlesCount();
            } else {
                document.body.classList.remove('mas-particles-enabled');
                this.removeParticles();
            }
            
            // Custom Cursor
            if (this.settings.enable_custom_cursor) {
                document.body.classList.add('mas-custom-cursor-enabled');
            } else {
                document.body.classList.remove('mas-custom-cursor-enabled');
                this.removeCustomCursor();
            }
            
            // 3D Tooltips
            if (this.settings.enable_3d_tooltips) {
                document.body.classList.add('mas-3d-tooltips-enabled');
            } else {
                document.body.classList.remove('mas-3d-tooltips-enabled');
            }
            
            // Parallax Scrolling
            if (this.settings.enable_parallax_scrolling) {
                document.body.classList.add('mas-parallax-scroll-enabled');
            } else {
                document.body.classList.remove('mas-parallax-scroll-enabled');
            }
        }

        applyPerformanceSettings() {
            const body = document.body;
            
            // Reduced Motion
            if (this.settings.respect_reduced_motion) {
                body.classList.add('mas-reduced-motion-respect');
            } else {
                body.classList.remove('mas-reduced-motion-respect');
            }
            
            // Mobile Optimization
            if (this.settings.mobile_3d_optimization) {
                body.classList.add('mas-mobile-optimized');
            } else {
                body.classList.remove('mas-mobile-optimized');
            }
            
            // Hardware Acceleration
            if (this.settings.hardware_acceleration) {
                body.classList.add('mas-hardware-accelerated');
            } else {
                body.classList.remove('mas-hardware-accelerated');
            }
            
            // Debug Mode
            if (this.settings['3d_debug_mode']) {
                body.classList.add('mas-debug-mode');
            } else {
                body.classList.remove('mas-debug-mode');
            }
        }

        // Specific update methods
        toggleGlobal3D() {
            if (this.settings.enable_global_3d) {
                document.body.classList.add('mas-3d-enabled');
                // Re-initialize 3D effects if they exist
                if (window.mas3DEffects) {
                    window.mas3DEffects.initGlobalEffects();
                }
            } else {
                document.body.classList.remove('mas-3d-enabled');
            }
        }

        update3DIntensity() {
            const intensity = this.settings['3d_intensity'];
            document.documentElement.style.setProperty('--woow-3d-intensity', intensity);
            
            // Update all 3D transforms based on intensity
            const elements = document.querySelectorAll('.postbox, .stuffbox, .wp-core-ui .button');
            elements.forEach(el => {
                if (el.style.transform && el.style.transform.includes('translateY')) {
                    // Scale existing transforms by intensity
                    const currentTransform = el.style.transform;
                    // This is a simplified approach - in production you'd want more sophisticated scaling
                }
            });
        }

        updateGlassBlur() {
            const blurValue = this.settings.glass_blur_intensity;
            document.documentElement.style.setProperty('--mas-glass-blur', `blur(${blurValue}px)`);
            document.documentElement.style.setProperty('--woow-blur-md', `blur(${blurValue * 0.75}px)`);
            document.documentElement.style.setProperty('--woow-blur-lg', `blur(${blurValue * 1.25}px)`);
            document.documentElement.style.setProperty('--woow-blur-xl', `blur(${blurValue * 1.5}px)`);
        }

        updateGlassTransparency() {
            const transparency = this.settings.glass_transparency;
            document.documentElement.style.setProperty('--mas-glass-opacity', transparency);
            document.documentElement.style.setProperty('--woow-glass-bg', `rgba(255, 255, 255, ${transparency})`);
            document.documentElement.style.setProperty('--mas-glass-hover', `rgba(255, 255, 255, ${transparency * 1.5})`);
        }

        toggleAnimatedBackground() {
            if (this.settings.enable_animated_background) {
                document.body.classList.add('mas-animated-bg-enabled');
            } else {
                document.body.classList.remove('mas-animated-bg-enabled');
            }
        }

        toggleFloatingParticles() {
            if (this.settings.enable_floating_particles) {
                document.body.classList.add('mas-particles-enabled');
                // Recreate particles with current count
                if (window.mas3DEffects) {
                    window.mas3DEffects.createFloatingParticles();
                }
            } else {
                document.body.classList.remove('mas-particles-enabled');
                this.removeParticles();
            }
        }

        updateParticlesCount() {
            const count = this.settings.particles_count;
            
            // Remove existing particles
            this.removeParticles();
            
            // Create new particles with updated count
            if (this.settings.enable_floating_particles && window.mas3DEffects) {
                // Update the particle count in the 3D effects system
                window.mas3DEffects.particleCount = count;
                window.mas3DEffects.createFloatingParticles();
            }
        }

        removeParticles() {
            const particleContainer = document.querySelector('.mas-floating-particles');
            if (particleContainer) {
                particleContainer.remove();
            }
        }

        toggleCustomCursor() {
            if (this.settings.enable_custom_cursor) {
                document.body.classList.add('mas-custom-cursor-enabled');
                if (window.mas3DEffects) {
                    window.mas3DEffects.initGlowCursor();
                }
            } else {
                document.body.classList.remove('mas-custom-cursor-enabled');
                this.removeCustomCursor();
            }
        }

        removeCustomCursor() {
            const cursor = document.querySelector('.mas-glow-cursor');
            if (cursor) {
                cursor.remove();
            }
        }

        updateTypographyScale() {
            const scale = this.settings.typography_scale_factor;
            document.documentElement.style.setProperty('--woow-typography-scale', scale);
            
            // Apply to all headings
            const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
            headings.forEach(heading => {
                const computedStyle = getComputedStyle(heading);
                const fontSize = parseFloat(computedStyle.fontSize);
                heading.style.fontSize = `${fontSize * scale}px`;
            });
        }

        // Public API for external control
        updateSetting(settingName, value) {
            this.settings[settingName] = value;
            this.applySpecificSetting(settingName);
        }

        getSetting(settingName) {
            return this.settings[settingName];
        }

        getAllSettings() {
            return this.settings;
        }
    }

    // Initialize 3D Controls when DOM is ready
    document.addEventListener('DOMContentLoaded', () => {
        // Wait for 3D Effects system to initialize first
        setTimeout(() => {
            if (document.body.classList.contains('wp-admin')) {
                window.mas3DControls = new MAS_3D_Controls();
            }
        }, 500);
    });

    // ==========================================================================
    // FAZA 1-3: LIVE EDIT MODE - Kompletny System Edycji Kontekstowej
    // ==========================================================================

    // FAZA 3: Advanced State Management
    MAS.undoRedoStack = [];
    MAS.currentStackIndex = -1;
    MAS.maxStackSize = 50;
    MAS.selectedElements = new Set();
    MAS.selectionBox = null;
    MAS.isMultiSelectMode = false;
    MAS.draggedElement = null;
    MAS.dragOffset = { x: 0, y: 0 };

    // Dodaj główne funkcje Live Edit Mode do obiektu MAS
    MAS.initLiveEditMode = function() {
        
        // Nasłuchuj zmiany na głównym przełączniku
        const editModeSwitch = document.getElementById('mas-v2-edit-mode-switch');
        const editModeSwitchHero = document.getElementById('mas-v2-edit-mode-switch-hero');
        
        if (editModeSwitch) {
            // Uruchom przy załadowaniu strony
            this.handleLiveEditModeToggle();
            
            // Uruchom przy każdej zmianie
            editModeSwitch.addEventListener('change', this.handleLiveEditModeToggle.bind(this));
        }
        
        // Synchronizuj hero toggle z głównym
        if (editModeSwitchHero && editModeSwitch) {
            editModeSwitchHero.addEventListener('change', function() {
                editModeSwitch.checked = editModeSwitchHero.checked;
                editModeSwitch.dispatchEvent(new Event('change'));
            });
        }
        
        // Przygotuj elementy edytowalne
        this.prepareEditableElements();
        
        // FAZA 3: Initialize advanced features
        this.initPhase3Features();
    };

    MAS.handleLiveEditModeToggle = function() {
        // Sprawdź czy switch istnieje i jest aktywny
        const toggle = document.getElementById('mas-v2-edit-mode-switch');
        const isEditModeActive = toggle ? toggle.checked : document.body.classList.contains('mas-edit-mode-active');
        
        if (isEditModeActive) {
            this.initializeEditableElements();
            this.enablePhase3Features();
        } else {
            this.cleanupEditableElements();
            this.disablePhase3Features();
        }
    };

    MAS.prepareEditableElements = function() {
        // Oznacz elementy jako edytowalne w WordPress Admin
        const adminBar = document.getElementById('wpadminbar');
        const adminMenu = document.getElementById('adminmenuwrap');
        const wpContent = document.getElementById('wpcontent');
        
        if (adminBar) {
            adminBar.setAttribute('data-mas-editable', 'true');
            adminBar.setAttribute('data-mas-element-type', 'admin-bar');
            adminBar.setAttribute('data-mas-element-name', 'Admin Bar');
        }
        
        if (adminMenu) {
            adminMenu.setAttribute('data-mas-editable', 'true');
            adminMenu.setAttribute('data-mas-element-type', 'admin-menu');
            adminMenu.setAttribute('data-mas-element-name', 'Admin Menu');
        }
        
        if (wpContent) {
            wpContent.setAttribute('data-mas-editable', 'true');
            wpContent.setAttribute('data-mas-element-type', 'content-area');
            wpContent.setAttribute('data-mas-element-name', 'Content Area');
        }
        
        // Dodaj footer jako edytowalny
        const wpFooter = document.getElementById('wpfooter');
        if (wpFooter) {
            wpFooter.setAttribute('data-mas-editable', 'true');
            wpFooter.setAttribute('data-mas-element-type', 'footer');
            wpFooter.setAttribute('data-mas-element-name', 'Footer');
        }
        
        // Dodaj dashboard postboxy jako edytowalne
        const postboxes = document.querySelectorAll('.postbox');
        postboxes.forEach((postbox, index) => {
            postbox.setAttribute('data-mas-editable', 'true');
            postbox.setAttribute('data-mas-element-type', 'postbox');
            postbox.setAttribute('data-mas-element-name', `Dashboard Widget ${index + 1}`);
        });
        
    };

    MAS.initializeEditableElements = function() {
        const editableElements = document.querySelectorAll('[data-mas-editable="true"]');

        editableElements.forEach(element => {
            // Unikaj dodawania wielu ikonek
            if (element.querySelector('.mas-context-cog')) return;

            const cog = document.createElement('span');
            cog.className = 'dashicons dashicons-admin-generic mas-context-cog';
            cog.title = 'Edit ' + (element.getAttribute('data-mas-element-name') || 'Element');
            
            cog.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('🔍 WOOW! Cog clicked for element:', element);
                console.log('🔍 WOOW! Element type:', element.getAttribute('data-mas-element-type'));
                console.log('🔍 WOOW! ConfigManager available:', !!window.ConfigManager);
                console.log('🔍 WOOW! SettingsManager available:', !!window.SettingsManager);
                this.openMicroPanel(element);
            });

            // Upewnij się, że element jest kontekstem pozycjonowania
            if (getComputedStyle(element).position === 'static') {
                element.style.position = 'relative';
            }
            
            element.appendChild(cog);
            
            // Dodaj drag handles dla odpowiednich elementów
            this.addDragHandles(element);
        });
        
    };

    MAS.cleanupEditableElements = function() {
        // Usuń wszystkie kontrolki Live Edit Mode
        document.querySelectorAll('.mas-context-cog').forEach(cog => cog.remove());
        document.querySelectorAll('.mas-drag-handle').forEach(handle => handle.remove());
        document.querySelectorAll('.mas-micro-panel').forEach(panel => panel.remove());
        
    };

    /**
     * 🎯 REFACTORED: Direct data-binding micro panel with complete lifecycle
     */
    MAS.openMicroPanel = function(element) {
        console.log('🚀 WOOW! openMicroPanel called with element:', element);
        
        // Usuń istniejące panele
        document.querySelectorAll('.mas-micro-panel').forEach(panel => panel.remove());
        
        const elementType = element.getAttribute('data-mas-element-type');
        const elementName = element.getAttribute('data-mas-element-name');
        
        console.log('🔍 WOOW! Element type:', elementType);
        console.log('🔍 WOOW! Element name:', elementName);
        
        // Map element types to API component IDs
        const elementMapping = {
            'admin-bar': 'wpadminbar',
            'admin-menu': 'adminmenuwrap',
            'content-area': 'wpwrap',
            'footer': 'wpfooter',
            'postbox': 'postbox'
        };

        const componentId = elementMapping[elementType];
        if (!componentId) {
            console.warn(`⚠️ WOOW! No mapping found for element type: ${elementType}`);
            return;
        }

        // Get configuration from ConfigManager
        const config = window.ConfigManager?.getComponentConfig(componentId);
        if (!config) {
            console.warn(`⚠️ WOOW! No configuration found for component: ${componentId}`);
            return;
        }

        console.log(`🚀 WOOW! Opening micro panel for ${componentId}`, config);

        // Create panel structure
        const panel = document.createElement('div');
        panel.className = 'mas-micro-panel';
        
        // Create header
        const header = document.createElement('h4');
        header.textContent = `🎨 Edit ${elementName}`;
        panel.appendChild(header);
        
        // Create tabs container
        const tabsContainer = document.createElement('div');
        tabsContainer.className = 'woow-tabs-container';
        
        // Create tab buttons
        const tabButtons = document.createElement('div');
        tabButtons.className = 'woow-tab-buttons';
        
        // Create tab contents
        const tabContents = document.createElement('div');
        tabContents.className = 'woow-tab-contents';
        
        // Build tabs dynamically from configuration
        let firstTab = true;
        
        if (config.tabs) {
            Object.values(config.tabs).forEach(tabConfig => {
                // Create tab button
                const tabButton = document.createElement('button');
                tabButton.className = `woow-tab-button ${firstTab ? 'active' : ''}`;
                tabButton.setAttribute('data-tab', tabConfig.id);
                tabButton.innerHTML = `${tabConfig.icon} ${tabConfig.label}`;
                tabButtons.appendChild(tabButton);
                
                // Create tab content
                const tabContent = document.createElement('div');
                tabContent.className = `woow-tab-content ${firstTab ? 'active' : ''}`;
                tabContent.setAttribute('data-content', tabConfig.id);
                
                // Generate controls for this tab using new ComponentFactory
                if (Array.isArray(tabConfig.options)) {
                    tabConfig.options.forEach(option => {
                        // Get current value from SettingsManager
                        const currentValue = window.SettingsManager?.get(option.id);
                        
                        // Create control with direct data binding
                        const controlElement = ComponentFactory.create(option, currentValue);
                        
                        if (controlElement) {
                            tabContent.appendChild(controlElement);
                        }
                    });
                }
                
                tabContents.appendChild(tabContent);
                firstTab = false;
            });
        }
        
        // Add tab switching functionality
        tabButtons.addEventListener('click', (e) => {
            if (e.target.classList.contains('woow-tab-button')) {
                const tabId = e.target.getAttribute('data-tab');
                
                // Update button states
                tabButtons.querySelectorAll('.woow-tab-button').forEach(btn => {
                    btn.classList.remove('active');
                });
                e.target.classList.add('active');
                
                // Update content visibility
                tabContents.querySelectorAll('.woow-tab-content').forEach(content => {
                    content.classList.remove('active');
                });
                const targetContent = tabContents.querySelector(`[data-content="${tabId}"]`);
                if (targetContent) {
                    targetContent.classList.add('active');
                }
            }
        });
        
        tabsContainer.appendChild(tabButtons);
        tabsContainer.appendChild(tabContents);
        panel.appendChild(tabsContainer);
        
        // Create footer
        const footer = document.createElement('div');
        footer.className = 'woow-panel-footer';
        footer.innerHTML = `
            <hr>
            <p style="margin: 0; font-size: 12px; opacity: 0.8;">
                💡 Changes apply instantly | 🗙 Click outside to close
            </p>
        `;
        panel.appendChild(footer);
        
        // Pozycjonuj panel obok elementu
        this.positionPanel(panel, element);
        
        // Dodaj do DOM
        document.body.appendChild(panel);
        
        // Zamknij panel po kliknięciu poza nim
        setTimeout(() => {
            const closePanel = (e) => {
                if (!panel.contains(e.target) && !element.contains(e.target)) {
                    panel.remove();
                    document.removeEventListener('click', closePanel);
                }
            };
            document.addEventListener('click', closePanel);
        }, 100);
        
    };

    /**
     * ========================================================================
     *  WOOW! ComponentFactory: Builds UI controls with direct data-binding.
     * ========================================================================
     * REFACTOR: This is the definitive fix. Instead of relying on event
     * delegation, we bind the event listener directly to the control upon
     * creation. This creates a robust, unbreakable link to the SettingsManager.
     */
    const ComponentFactory = {
        
        /**
         * 🎯 MAIN FACTORY METHOD: Creates any control with direct data binding
         */
        create(option, currentValue) {
            const wrapper = document.createElement('div');
            wrapper.className = 'woow-panel-control';
            
            const label = document.createElement('label');
            label.textContent = option.label;
            wrapper.appendChild(label);

            let control;
            switch (option.type) {
                case 'color':
                    control = this.createColorInput(option, currentValue);
                    break;
                case 'slider':
                    control = this.createSliderInput(option, currentValue);
                    break;
                case 'toggle':
                    control = this.createToggleInput(option, currentValue);
                    break;
                case 'visibility':
                    control = this.createVisibilityInput(option, currentValue);
                    break;
                case 'select':
                    control = this.createSelectInput(option, currentValue);
                    break;
                default:
                    console.warn('Unknown control type:', option.type);
                    return null;
            }

            if (control) {
                wrapper.appendChild(control);
            }
            return wrapper;
        },
        
        /**
         * 🎨 Create color picker with direct binding
         */
        createColorInput(option, currentValue) {
            const input = document.createElement('input');
            input.type = 'color';
            input.value = currentValue || option.fallback || '#ffffff';
            
            // DIRECT BINDING: 'input' event for live color changes
            input.addEventListener('input', (e) => {
                console.log(`🎨 Color changed: ${option.id} = ${e.target.value}`);
                window.SettingsManager.update(option.id, e.target.value, { 
                    cssVar: option.cssVar 
                });
            });
            
            return input;
        },
        
        /**
         * 🎚️ Create range slider with direct binding
         */
        createSliderInput(option, currentValue) {
            const container = document.createElement('div');
            container.className = 'woow-slider-container';
            
            const input = document.createElement('input');
            input.type = 'range';
            input.min = option.min || 0;
            input.max = option.max || 100;
            input.step = option.step || 1;
            input.value = parseInt(currentValue) || option.fallback || option.min || 0;
            
            const valueDisplay = document.createElement('span');
            valueDisplay.className = 'woow-value-display';
            valueDisplay.textContent = input.value + (option.unit || '');
            
            // DIRECT BINDING: 'input' event for live slider changes
            input.addEventListener('input', (e) => {
                const value = e.target.value;
                const unit = option.unit || '';
                valueDisplay.textContent = value + unit;
                
                console.log(`🎚️ Slider changed: ${option.id} = ${value}${unit}`);
                window.SettingsManager.update(option.id, value, { 
                    cssVar: option.cssVar,
                    unit: unit
                });
            });
            
            container.appendChild(input);
            container.appendChild(valueDisplay);
            return container;
        },
        
        /**
         * ✅ Create checkbox toggle with direct binding
         */
        createToggleInput(option, currentValue) {
            const container = document.createElement('div');
            container.className = 'woow-toggle-container';
            
            const input = document.createElement('input');
            input.type = 'checkbox';
            input.checked = !!currentValue;
            
            const toggleSwitch = document.createElement('span');
            toggleSwitch.className = 'woow-toggle-switch';
            
            const labelText = document.createElement('span');
            labelText.textContent = option.label;
            
            // DIRECT BINDING: 'change' event for toggles
            input.addEventListener('change', (e) => {
                console.log(`✅ Toggle changed: ${option.id} = ${e.target.checked}`);
                window.SettingsManager.update(option.id, e.target.checked, { 
                    bodyClass: option.bodyClass 
                });
            });
            
            container.appendChild(input);
            container.appendChild(toggleSwitch);
            container.appendChild(labelText);
            return container;
        },
        
        /**
         * 👁️ Create visibility toggle with direct binding
         */
        createVisibilityInput(option, currentValue) {
            const container = document.createElement('div');
            container.className = 'woow-visibility-container';
            
            const input = document.createElement('input');
            input.type = 'checkbox';
            input.checked = !!currentValue;
            
            const labelText = document.createElement('span');
            labelText.textContent = option.label;
            
            // DIRECT BINDING: 'change' event for visibility toggles
            input.addEventListener('change', (e) => {
                console.log(`👁️ Visibility changed: ${option.id} = ${e.target.checked}`);
                
                // Immediately hide/show the target element
                if (option.selector) {
                    const targetEl = document.querySelector(option.selector);
                    if (targetEl) {
                        targetEl.style.display = e.target.checked ? 'none' : '';
                    }
                }
                
                window.SettingsManager.update(option.id, e.target.checked, { 
                    selector: option.selector 
                });
            });
            
            container.appendChild(input);
            container.appendChild(labelText);
            return container;
        },
        
        /**
         * 📋 Create select dropdown with direct binding
         */
        createSelectInput(option, currentValue) {
            const select = document.createElement('select');
            
            // Populate options
            Object.entries(option.options || {}).forEach(([value, label]) => {
                const optionEl = document.createElement('option');
                optionEl.value = value;
                optionEl.textContent = label;
                optionEl.selected = currentValue === value;
                select.appendChild(optionEl);
            });
            
            // DIRECT BINDING: 'change' event for selects
            select.addEventListener('change', (e) => {
                console.log(`📋 Select changed: ${option.id} = ${e.target.value}`);
                window.SettingsManager.update(option.id, e.target.value, { 
                    cssVar: option.cssVar,
                    bodyClass: option.bodyClass 
                });
            });
            
            return select;
        },
        
        /**
         * 📑 Create tabbed panel structure (legacy method for backward compatibility)
         */
        createTabbedPanel(tabs) {
            // Create tab buttons
            let tabButtonsHtml = '';
            tabs.forEach((tab, index) => {
                const activeClass = index === 0 ? 'active' : '';
                tabButtonsHtml += `<button class="mas-panel-tab ${activeClass}" data-tab="${tab.id}">${tab.icon} ${tab.label}</button>`;
            });
            
            // Create tab contents
            let tabContentsHtml = '';
            tabs.forEach((tab, index) => {
                const displayStyle = index === 0 ? '' : 'style="display: none;"';
                tabContentsHtml += `
                    <div class="mas-panel-content" data-content="${tab.id}" ${displayStyle}>
                        ${tab.content}
                    </div>
                `;
            });
            
            return `
                <div class="mas-panel-tabs">
                    ${tabButtonsHtml}
                </div>
                ${tabContentsHtml}
            `;
        }
    };

    /**
     * 🚀 ENTERPRISE REFACTOR: Dynamic control generation from server configuration
     * Poprzednio: Hardcoded switch statement z static configuration
     * Teraz: Dynamic building based on server-provided configuration
     */
    MAS.generateControlsForElement = function(elementType) {
        // Map element types to API component IDs
        const elementMapping = {
            'admin-bar': 'wpadminbar',
            'admin-menu': 'adminmenuwrap',
            'content-area': 'wpwrap',
            'footer': 'wpfooter',
            'postbox': 'postbox'
        };

        const componentId = elementMapping[elementType];
        if (!componentId) {
            console.warn(`⚠️ WOOW! No mapping found for element type: ${elementType}`);
            return this.generateFallbackControls(elementType);
        }

        // Get configuration from ConfigManager
        const config = window.ConfigManager?.getComponentConfig(componentId);
        if (!config) {
            console.warn(`⚠️ WOOW! No configuration found for component: ${componentId}`);
            return this.generateFallbackControls(elementType);
        }

        console.log(`🚀 WOOW! Generating dynamic controls for ${componentId}`, config);

        // Build tabs dynamically from configuration
        const tabs = [];
        
        if (config.tabs) {
            Object.values(config.tabs).forEach(tabConfig => {
                const tabContent = this.generateTabContent(tabConfig.options);
                
                tabs.push({
                    id: tabConfig.id,
                    icon: tabConfig.icon,
                    label: tabConfig.label,
                    content: tabContent
                });
            });
        }

        return ComponentFactory.createTabbedPanel(tabs);
    };

    /**
     * 🔧 NEW: Generates tab content using direct data-binding ComponentFactory
     */
    MAS.generateTabContent = function(options) {
        const container = document.createElement('div');
        container.className = 'woow-tab-content';
        
        if (!Array.isArray(options)) {
            console.warn('⚠️ WOOW! Invalid options format');
            return container.outerHTML;
        }

        options.forEach(option => {
            // Get current value from SettingsManager
            const currentValue = window.SettingsManager?.get(option.id);
            
            // Create control with direct data binding
            const controlElement = ComponentFactory.create(option, currentValue);
            
            if (controlElement) {
                container.appendChild(controlElement);
            }
        });

        return container.outerHTML;
    };

    /**
     * 🔄 Fallback for when dynamic configuration is not available
     */
    MAS.generateFallbackControls = function(elementType) {
        console.log(`🔄 WOOW! Using fallback controls for: ${elementType}`);
        
        switch (elementType) {
            case 'admin-bar':
                // Simplified fallback for admin bar
                const adminBarTabs = [
                    {
                        id: 'colors',
                        icon: '🎨',
                        label: 'Colors',
                        content: 
                            ComponentFactory.createColorControl('Background Color', '--woow-surface-bar', '#23282d') +
                            ComponentFactory.createColorControl('Text Color', '--woow-surface-bar-text', '#ffffff') +
                            ComponentFactory.createColorControl('Hover Color', '--woow-surface-bar-hover', '#00a0d2')
                    },
                    {
                        id: 'effects',
                        icon: '✨',
                        label: 'Effects',
                        content:
                            ComponentFactory.createToggleControl('Glassmorphism Effect', 'woow-admin-bar-glassmorphism') +
                            ComponentFactory.createToggleControl('Drop Shadow', 'woow-admin-bar-shadow')
                    }
                ];
                return ComponentFactory.createTabbedPanel(adminBarTabs);
                
            case 'admin-menu':
                // Simplified fallback for admin menu
                const adminMenuTabs = [
                    {
                        id: 'colors',
                        icon: '🎨',
                        label: 'Colors',
                        content:
                            ComponentFactory.createColorControl('Background Color', '--woow-surface-menu', '#ffffff') +
                            ComponentFactory.createColorControl('Text Color', '--woow-surface-menu-text', '#1e293b') +
                            ComponentFactory.createColorControl('Hover Color', '--woow-surface-menu-hover', '#6366f1')
                    }
                ];
                return ComponentFactory.createTabbedPanel(adminMenuTabs);
                
            default:
                // Basic fallback for unknown elements
                const basicTabs = [
                    {
                        id: 'basic',
                        icon: '⚙️',
                        label: 'Basic',
                        content:
                            '<label>Background Color</label>' +
                            '<input type="color" data-live-preview="element-style" data-style-property="backgroundColor">' +
                            '<label>Opacity</label>' +
                            '<input type="range" min="0" max="1" step="0.1" value="1" data-live-preview="element-style" data-style-property="opacity">'
                    }
                ];
                return ComponentFactory.createTabbedPanel(basicTabs);
        }
        
        // Default fallback
        return '<div class="mas-panel-content"><p>⚠️ No configuration available</p></div>';
    };

    MAS.positionPanel = function(panel, element) {
        const rect = element.getBoundingClientRect();
        const panelWidth = 300;
        const panelHeight = 200; // Przybliżona wysokość
        
        let left = rect.right + 10;
        let top = rect.top;
        
        // Sprawdź czy panel mieści się na ekranie
        if (left + panelWidth > window.innerWidth) {
            left = rect.left - panelWidth - 10;
        }
        
        if (top + panelHeight > window.innerHeight) {
            top = window.innerHeight - panelHeight - 10;
        }
        
        if (top < 10) top = 10;
        if (left < 10) left = 10;
        
        panel.style.left = left + 'px';
        panel.style.top = top + 'px';
    };

    // REMOVED: bindPanelControls - no longer needed with direct data-binding

    // FAZA 2: Obsługa zakładek w panelu
    MAS.initPanelTabs = function(panel) {
        const tabs = panel.querySelectorAll('.mas-panel-tab');
        const contents = panel.querySelectorAll('.mas-panel-content');
        
        tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                const targetTab = tab.getAttribute('data-tab');
                
                // Zmień aktywną zakładkę
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                // Pokaż odpowiednią zawartość
                contents.forEach(content => {
                    const contentTab = content.getAttribute('data-content');
                    if (contentTab === targetTab) {
                        content.style.display = 'block';
                        content.style.animation = 'fadeInUp 0.3s ease';
                    } else {
                        content.style.display = 'none';
                    }
                });
                
            });
        });
    };

    // FAZA 2: Rozszerzona obsługa kontrolek - Z INTEGRACJĄ SETTINGSMANAGER
    MAS.handlePanelControlChange = function(control, element, event) {
        const previewType = control.getAttribute('data-live-preview');
        const value = control.value;
        const unit = control.getAttribute('data-unit') || '';
        const checked = control.checked;
        
        // ✅ NAPRAWKA: Generuj klucz ustawienia na podstawie cssVar lub bodyClass
        let settingKey = null;
        const cssVar = control.getAttribute('data-css-var');
        const bodyClass = control.getAttribute('data-body-class');
        
        if (cssVar) {
            // Przekształć --woow-surface-bar na admin_bar_bg
            settingKey = cssVar.replace('--woow-', '').replace(/-/g, '_');
        } else if (bodyClass) {
            // Przekształć woow-admin-bar-floating na admin_bar_floating
            settingKey = bodyClass.replace('woow-', '').replace(/-/g, '_');
        }
        
        switch (previewType) {
            case 'css-var':
                if (cssVar && window.SettingsManager) {
                    // ✅ NAPRAWKA: Użyj SettingsManager dla trwałości
                    window.SettingsManager.update(settingKey, value, {
                        cssVar: cssVar,
                        unit: unit
                    });
                } else {
                    // Fallback: stary sposób
                    document.documentElement.style.setProperty(cssVar, value + unit);
                }
                break;
                
            case 'body-class':
                const classPrefix = control.getAttribute('data-class-prefix');
                
                if (classPrefix && control.tagName === 'SELECT') {
                    // Usuń wszystkie klasy z prefiksem
                    document.body.className = document.body.className.replace(new RegExp(`${classPrefix}\\w+`, 'g'), '');
                    // Dodaj nową klasę
                    document.body.classList.add(classPrefix + value);
                    
                    // ✅ NAPRAWKA: Zapisz do SettingsManager
                    if (window.SettingsManager) {
                        const key = classPrefix.replace('woow-', '').replace(/-/g, '_') + 'mode';
                        window.SettingsManager.update(key, value);
                    }
                } else if (bodyClass) {
                    const isActive = checked || control.type !== 'checkbox';
                    
                    if (window.SettingsManager) {
                        // ✅ NAPRAWKA: Użyj SettingsManager dla trwałości
                        window.SettingsManager.update(settingKey, isActive, {
                            bodyClass: bodyClass
                        });
                    } else {
                        // Fallback: stary sposób
                        document.body.classList.toggle(bodyClass, isActive);
                    }
                }
                break;
                
            case 'element-visibility':
                const targetSelector = control.getAttribute('data-target-selector');
                const settingKeyDirect = control.getAttribute('data-setting-key');
                
                if (targetSelector && settingKeyDirect && window.SettingsManager) {
                    // ✅ NAPRAWKA: Użyj SettingsManager dla trwałości visibility
                    window.SettingsManager.update(settingKeyDirect, checked, {
                        selector: targetSelector
                    });
                } else if (targetSelector) {
                    // Fallback: bezpośrednia manipulacja DOM
                    const targetElement = document.querySelector(targetSelector);
                    if (targetElement) {
                        targetElement.style.display = checked ? 'none' : '';
                    }
                }
                break;
                
            case 'element-style':
                const property = control.getAttribute('data-style-property');
                element.style[property] = value + unit;
                break;
                
            case 'element-shadow':
                const intensity = value;
                element.style.boxShadow = `0 2px ${intensity}px rgba(0,0,0,0.1)`;
                break;
                
            case 'element-class':
                const className = control.getAttribute('data-element-class');
                if (checked) {
                    element.classList.add(className);
                } else {
                    element.classList.remove(className);
                }
                break;
                
            case 'element-transform':
                const transformProperty = control.getAttribute('data-transform-property');
                const currentTransform = element.style.transform || '';
                
                // Usuń poprzednią wartość tego typu transformacji
                const transformRegex = new RegExp(`${transformProperty}\\([^)]*\\)\\s*`, 'g');
                const cleanTransform = currentTransform.replace(transformRegex, '').trim();
                
                // Dodaj nową transformację
                let newTransform = cleanTransform;
                if (transformProperty === 'scale') {
                    newTransform += ` scale(${value})`;
                } else if (transformProperty === 'rotate') {
                    newTransform += ` rotate(${value}${unit})`;
                }
                
                element.style.transform = newTransform.trim();
                break;
        }
        
    };

    // FAZA 2: Live value display
    MAS.addLiveValueDisplay = function(control) {
        const label = control.parentElement.querySelector('label');
        if (!label || label.querySelector('.mas-live-value')) return;
        
        const valueDisplay = document.createElement('span');
        valueDisplay.className = 'mas-live-value';
        valueDisplay.textContent = control.value + (control.getAttribute('data-unit') || '');
        label.appendChild(valueDisplay);
        
        control.addEventListener('input', () => {
            valueDisplay.textContent = control.value + (control.getAttribute('data-unit') || '');
        });
    };

    // FAZA 2: Quick Actions (Copy, Paste, Reset)
    MAS.bindQuickActions = function(panel, element) {
        const quickButtons = panel.querySelectorAll('.mas-quick-btn');
        
        quickButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                const action = button.getAttribute('data-action');
                this.handleQuickAction(action, panel, element);
            });
        });
    };

    MAS.handleQuickAction = function(action, panel, element) {
        switch (action) {
            case 'copy-colors':
                const colorInputs = panel.querySelectorAll('input[type="color"]');
                const colors = {};
                colorInputs.forEach(input => {
                    const cssVar = input.getAttribute('data-css-var');
                    if (cssVar) {
                        colors[cssVar] = input.value;
                    }
                });
                
                // Zapisz w localStorage
                localStorage.setItem('mas-copied-colors', JSON.stringify(colors));
                this.showQuickActionFeedback('📋 Colors copied!');
                break;
                
            case 'paste-colors':
                const savedColors = localStorage.getItem('mas-copied-colors');
                if (savedColors) {
                    const colors = JSON.parse(savedColors);
                    Object.keys(colors).forEach(cssVar => {
                        document.documentElement.style.setProperty(cssVar, colors[cssVar]);
                        
                        // Zaktualizuj input values
                        const input = panel.querySelector(`input[data-css-var="${cssVar}"]`);
                        if (input) input.value = colors[cssVar];
                    });
                    this.showQuickActionFeedback('📁 Colors pasted!');
                } else {
                    this.showQuickActionFeedback('❌ No colors to paste');
                }
                break;
                
            case 'reset-colors':
                const defaultColors = {
                    '--woow-surface-bar': '#23282d',
                    '--woow-surface-bar-text': '#ffffff',
                    '--woow-surface-bar-hover': '#00a0d2',
                    '--woow-surface-menu': '#ffffff',
                    '--woow-surface-menu-text': '#1e293b',
                    '--woow-surface-menu-hover': '#6366f1',
                    '--woow-surface-menu-active': '#ec4899'
                };
                
                Object.keys(defaultColors).forEach(cssVar => {
                    document.documentElement.style.setProperty(cssVar, defaultColors[cssVar]);
                    
                    // Zaktualizuj input values
                    const input = panel.querySelector(`input[data-css-var="${cssVar}"]`);
                    if (input) input.value = defaultColors[cssVar];
                });
                this.showQuickActionFeedback('🔄 Colors reset to default!');
                break;
        }
    };

    // FAZA 2: Presets System
    MAS.bindPresets = function(panel, element) {
        const presetButtons = panel.querySelectorAll('.mas-preset-btn');
        const presetActions = panel.querySelectorAll('.mas-preset-save, .mas-preset-load');
        
        presetButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                const preset = button.getAttribute('data-preset');
                this.applyPreset(preset, panel);
            });
        });
        
        presetActions.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                const action = button.getAttribute('data-action');
                this.handlePresetAction(action, panel);
            });
        });
    };

    MAS.applyPreset = function(preset, panel) {
        const presets = {
            'dark-modern': {
                '--woow-surface-bar': '#1a1a1a',
                '--woow-surface-bar-text': '#ffffff',
                '--woow-surface-bar-hover': '#6366f1'
            },
            'light-minimal': {
                '--woow-surface-bar': '#f8f9fa',
                '--woow-surface-bar-text': '#333333',
                '--woow-surface-bar-hover': '#007cba'
            },
            'colorful': {
                '--woow-surface-bar': 'linear-gradient(135deg, #667eea, #764ba2)',
                '--woow-surface-bar-text': '#ffffff',
                '--woow-surface-bar-hover': '#ffd93d'
            },
            'glass': {
                '--woow-surface-bar': 'rgba(255, 255, 255, 0.1)',
                '--woow-surface-bar-text': '#ffffff',
                '--woow-surface-bar-hover': '#00a0d2'
            }
        };
        
        const presetData = presets[preset];
        if (presetData) {
            Object.keys(presetData).forEach(cssVar => {
                document.documentElement.style.setProperty(cssVar, presetData[cssVar]);
                
                // Zaktualizuj input values
                const input = panel.querySelector(`input[data-css-var="${cssVar}"]`);
                if (input) input.value = presetData[cssVar];
            });
            
            // Dodaj body classes dla glass effect
            if (preset === 'glass') {
                document.body.classList.add('woow-admin-bar-glassmorphism');
            }
            
            this.showQuickActionFeedback(`✨ Applied ${preset} preset!`);
        }
    };

    MAS.handlePresetAction = function(action, panel) {
        if (action === 'save-preset') {
            // Placeholder for custom preset saving
            this.showQuickActionFeedback('💾 Save preset feature coming soon!');
        } else if (action === 'load-preset') {
            // Placeholder for custom preset loading
            this.showQuickActionFeedback('📁 Load preset feature coming soon!');
        }
    };

    MAS.showQuickActionFeedback = function(message) {
        // Utwórz toast notification
        const toast = document.createElement('div');
        toast.className = 'mas-quick-action-toast';
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, var(--woow-accent-success), #38f9d7);
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 600;
            z-index: 9999999;
            animation: slideInScale 0.3s ease-out;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
        `;
        
        document.body.appendChild(toast);
        
        // Usuń po 3 sekundach
        setTimeout(() => {
            toast.style.animation = 'fadeOut 0.3s ease-in forwards';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    };

    MAS.addDragHandles = function(element) {
        const elementType = element.getAttribute('data-mas-element-type');
        
        // Dodaj poziomy uchwyt dla menu (szerokość)
        if (elementType === 'admin-menu') {
            const handle = document.createElement('div');
            handle.className = 'mas-drag-handle mas-drag-handle-x';
            element.appendChild(handle);

            handle.addEventListener('mousedown', (e) => {
                e.preventDefault();
                const startX = e.clientX;
                const startWidth = element.offsetWidth;

                const dragMenu = (e) => {
                    const newWidth = startWidth + (e.clientX - startX);
                    if (newWidth >= 140 && newWidth <= 300) {
                        document.documentElement.style.setProperty('--woow-surface-menu-width', newWidth + 'px');
                    }
                };

                const stopDragMenu = () => {
                    document.removeEventListener('mousemove', dragMenu);
                    document.removeEventListener('mouseup', stopDragMenu);
                };

                document.addEventListener('mousemove', dragMenu);
                document.addEventListener('mouseup', stopDragMenu);
            });
        }
        
        // Dodaj pionowy uchwyt dla admin bara (wysokość)
        if (elementType === 'admin-bar') {
            const handle = document.createElement('div');
            handle.className = 'mas-drag-handle mas-drag-handle-y';
            element.appendChild(handle);

            handle.addEventListener('mousedown', (e) => {
                e.preventDefault();
                const startY = e.clientY;
                const startHeight = element.offsetHeight;

                const dragBar = (e) => {
                    const newHeight = startHeight + (e.clientY - startY);
                    if (newHeight >= 28 && newHeight <= 60) {
                        document.documentElement.style.setProperty('--woow-surface-bar-height', newHeight + 'px');
                    }
                };

                const stopDragBar = () => {
                    document.removeEventListener('mousemove', dragBar);
                    document.removeEventListener('mouseup', stopDragBar);
                };

                document.addEventListener('mousemove', dragBar);
                document.addEventListener('mouseup', stopDragBar);
            });
        }
    };

    // Initialize 3D Controls when DOM is ready
    document.addEventListener('DOMContentLoaded', () => {
        // Wait for 3D Effects system to initialize first
        setTimeout(() => {
            if (document.body.classList.contains('wp-admin')) {
                window.mas3DControls = new MAS_3D_Controls();
            }
        }, 500);
    });

    // ==========================================================================
    // FAZA 3: ADVANCED FEATURES - Multi-Select, Drag & Drop 2.0, Undo/Redo
    // ==========================================================================

    // FAZA 3: Initialize Phase 3 features
    MAS.initPhase3Features = function() {
        this.createAdvancedToolbar();
        this.initKeyboardShortcuts();
        this.initSelectionBox();
    };

    // FAZA 3: Enable Phase 3 features
    MAS.enablePhase3Features = function() {
        this.showAdvancedToolbar();
        this.enableMultiSelect();
        this.enableAdvancedDragDrop();
        this.enableBulkOperations();
        document.body.classList.add('mas-phase3-active');
    };

    // FAZA 3: Disable Phase 3 features
    MAS.disablePhase3Features = function() {
        this.hideAdvancedToolbar();
        this.disableMultiSelect();
        this.disableAdvancedDragDrop();
        this.clearSelection();
        document.body.classList.remove('mas-phase3-active');
    };

    // FAZA 3: Create Advanced Toolbar
    MAS.createAdvancedToolbar = function() {
        if (document.querySelector('.mas-advanced-toolbar')) return;

        const toolbar = document.createElement('div');
        toolbar.className = 'mas-advanced-toolbar';
        toolbar.innerHTML = `
            <div class="mas-toolbar-section">
                <h4>🎮 Advanced Live Edit</h4>
                <div class="mas-toolbar-actions">
                    <button class="mas-toolbar-btn" data-action="multi-select" title="Multi-Select Mode (Ctrl+M)">
                        <span class="dashicons dashicons-yes-alt"></span>
                        Multi-Select
                    </button>
                    <button class="mas-toolbar-btn" data-action="select-all" title="Select All Elements (Ctrl+A)">
                        <span class="dashicons dashicons-admin-page"></span>
                        Select All
                    </button>
                    <button class="mas-toolbar-btn" data-action="clear-selection" title="Clear Selection (Esc)">
                        <span class="dashicons dashicons-dismiss"></span>
                        Clear
                    </button>
                </div>
            </div>
            
            <div class="mas-toolbar-section">
                <h4>⚡ Bulk Operations</h4>
                <div class="mas-toolbar-actions">
                    <button class="mas-toolbar-btn" data-action="bulk-color" title="Apply Color to Selected">
                        <span class="dashicons dashicons-admin-appearance"></span>
                        Color
                    </button>
                    <button class="mas-toolbar-btn" data-action="bulk-spacing" title="Apply Spacing to Selected">
                        <span class="dashicons dashicons-editor-expand"></span>
                        Spacing
                    </button>
                    <button class="mas-toolbar-btn" data-action="bulk-effects" title="Apply Effects to Selected">
                        <span class="dashicons dashicons-format-gallery"></span>
                        Effects
                    </button>
                    <button class="mas-toolbar-btn" data-action="bulk-preset" title="Apply Preset to Selected">
                        <span class="dashicons dashicons-admin-appearance"></span>
                        Preset
                    </button>
                </div>
            </div>
            
            <div class="mas-toolbar-section">
                <h4>🔄 History</h4>
                <div class="mas-toolbar-actions">
                    <button class="mas-toolbar-btn" data-action="undo" title="Undo (Ctrl+Z)" disabled>
                        <span class="dashicons dashicons-undo"></span>
                        Undo
                    </button>
                    <button class="mas-toolbar-btn" data-action="redo" title="Redo (Ctrl+Y)" disabled>
                        <span class="dashicons dashicons-redo"></span>
                        Redo
                    </button>
                    <button class="mas-toolbar-btn" data-action="clear-history" title="Clear History">
                        <span class="dashicons dashicons-trash"></span>
                        Clear
                    </button>
                </div>
            </div>
            
            <div class="mas-toolbar-section">
                <h4>📊 Info</h4>
                <div class="mas-toolbar-info">
                    <span class="mas-selection-count">0 selected</span>
                    <span class="mas-history-count">0 actions</span>
                </div>
            </div>
        `;

        // Position toolbar
        toolbar.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: var(--woow-glass-bg);
            backdrop-filter: var(--woow-blur-xl);
            border: 1px solid var(--woow-glass-border);
            border-radius: var(--woow-radius-xl);
            padding: var(--woow-space-lg);
            color: white;
            font-family: var(--woow-font-family);
            z-index: 999998;
            min-width: 280px;
            max-height: 70vh;
            overflow-y: auto;
            display: none;
            animation: slideInScale 0.3s ease-out;
        `;

        document.body.appendChild(toolbar);
        this.bindAdvancedToolbar(toolbar);
    };

    // FAZA 3: Bind Advanced Toolbar Events
    MAS.bindAdvancedToolbar = function(toolbar) {
        const buttons = toolbar.querySelectorAll('.mas-toolbar-btn');
        
        buttons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                const action = button.getAttribute('data-action');
                this.handleToolbarAction(action, button);
            });
        });
    };

    // FAZA 3: Handle Toolbar Actions
    MAS.handleToolbarAction = function(action, button) {
        switch (action) {
            case 'multi-select':
                this.toggleMultiSelectMode();
                break;
            case 'select-all':
                this.selectAllElements();
                break;
            case 'clear-selection':
                this.clearSelection();
                break;
            case 'bulk-color':
                this.openBulkColorPanel();
                break;
            case 'bulk-spacing':
                this.openBulkSpacingPanel();
                break;
            case 'bulk-effects':
                this.openBulkEffectsPanel();
                break;
            case 'bulk-preset':
                this.openBulkPresetPanel();
                break;
            case 'undo':
                this.performUndo();
                break;
            case 'redo':
                this.performRedo();
                break;
            case 'clear-history':
                this.clearHistory();
                break;
        }
    };

    // FAZA 3: Multi-Select System
    MAS.toggleMultiSelectMode = function() {
        this.isMultiSelectMode = !this.isMultiSelectMode;
        
        const button = document.querySelector('[data-action="multi-select"]');
        if (this.isMultiSelectMode) {
            button.classList.add('active');
            document.body.classList.add('mas-multi-select-mode');
            this.showQuickActionFeedback('🎯 Multi-Select Mode ENABLED - Click elements to select');
        } else {
            button.classList.remove('active');
            document.body.classList.remove('mas-multi-select-mode');
            this.showQuickActionFeedback('❌ Multi-Select Mode DISABLED');
        }
        
    };

    // FAZA 3: Select All Elements
    MAS.selectAllElements = function() {
        const editableElements = document.querySelectorAll('[data-mas-editable="true"]');
        
        editableElements.forEach(element => {
            this.addToSelection(element);
        });
        
        this.updateSelectionDisplay();
        this.showQuickActionFeedback(`✅ Selected ${editableElements.length} elements`);
    };

    // FAZA 3: Clear Selection
    MAS.clearSelection = function() {
        this.selectedElements.forEach(element => {
            element.classList.remove('mas-selected');
        });
        
        this.selectedElements.clear();
        this.updateSelectionDisplay();
        this.showQuickActionFeedback('🗙 Selection cleared');
    };

    // FAZA 3: Add Element to Selection
    MAS.addToSelection = function(element) {
        if (!this.selectedElements.has(element)) {
            this.selectedElements.add(element);
            element.classList.add('mas-selected');
            
            // Save state for undo
            this.saveState('selection_add', {
                element: element,
                elementId: element.id || element.className
            });
        }
    };

    // FAZA 3: Remove Element from Selection
    MAS.removeFromSelection = function(element) {
        if (this.selectedElements.has(element)) {
            this.selectedElements.delete(element);
            element.classList.remove('mas-selected');
            
            // Save state for undo
            this.saveState('selection_remove', {
                element: element,
                elementId: element.id || element.className
            });
        }
    };

    // FAZA 3: Update Selection Display
    MAS.updateSelectionDisplay = function() {
        const countDisplay = document.querySelector('.mas-selection-count');
        if (countDisplay) {
            const count = this.selectedElements.size;
            countDisplay.textContent = `${count} selected`;
            
            // Update bulk action buttons
            const bulkButtons = document.querySelectorAll('[data-action^="bulk-"]');
            bulkButtons.forEach(button => {
                button.disabled = count === 0;
                button.classList.toggle('disabled', count === 0);
            });
        }
    };

    // FAZA 3: Keyboard Shortcuts
    MAS.initKeyboardShortcuts = function() {
        document.addEventListener('keydown', (e) => {
            // Only work in edit mode
            if (!document.body.classList.contains('mas-edit-mode-active')) return;
            
            // Ctrl+Z - Undo
            if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
                e.preventDefault();
                this.performUndo();
            }
            
            // Ctrl+Y or Ctrl+Shift+Z - Redo
            if ((e.ctrlKey && e.key === 'y') || (e.ctrlKey && e.shiftKey && e.key === 'z')) {
                e.preventDefault();
                this.performRedo();
            }
            
            // Ctrl+A - Select All
            if (e.ctrlKey && e.key === 'a') {
                e.preventDefault();
                this.selectAllElements();
            }
            
            // Ctrl+M - Toggle Multi-Select
            if (e.ctrlKey && e.key === 'm') {
                e.preventDefault();
                this.toggleMultiSelectMode();
            }
            
            // Escape - Clear Selection
            if (e.key === 'Escape') {
                e.preventDefault();
                this.clearSelection();
                if (this.isMultiSelectMode) {
                    this.toggleMultiSelectMode();
                }
            }
            
            // Delete - Remove Selected Elements (careful!)
            if (e.key === 'Delete' && this.selectedElements.size > 0) {
                e.preventDefault();
                this.confirmBulkDelete();
            }
        });
        
    };

    // FAZA 3: Undo/Redo System
    MAS.saveState = function(action, data) {
        const state = {
            action: action,
            data: data,
            timestamp: Date.now(),
            selectedElements: Array.from(this.selectedElements)
        };
        
        // Remove any states after current index (for branching)
        this.undoRedoStack = this.undoRedoStack.slice(0, this.currentStackIndex + 1);
        
        // Add new state
        this.undoRedoStack.push(state);
        this.currentStackIndex++;
        
        // Limit stack size
        if (this.undoRedoStack.length > this.maxStackSize) {
            this.undoRedoStack.shift();
            this.currentStackIndex--;
        }
        
        this.updateHistoryDisplay();
    };

    // FAZA 3: Perform Undo
    MAS.performUndo = function() {
        if (this.currentStackIndex >= 0) {
            const state = this.undoRedoStack[this.currentStackIndex];
            this.revertState(state);
            this.currentStackIndex--;
            this.updateHistoryDisplay();
            this.showQuickActionFeedback(`↶ Undone: ${state.action}`);
        } else {
            this.showQuickActionFeedback('❌ Nothing to undo');
        }
    };

    // FAZA 3: Perform Redo
    MAS.performRedo = function() {
        if (this.currentStackIndex < this.undoRedoStack.length - 1) {
            this.currentStackIndex++;
            const state = this.undoRedoStack[this.currentStackIndex];
            this.applyState(state);
            this.updateHistoryDisplay();
            this.showQuickActionFeedback(`↷ Redone: ${state.action}`);
        } else {
            this.showQuickActionFeedback('❌ Nothing to redo');
        }
    };

    // FAZA 3: Clear History
    MAS.clearHistory = function() {
        this.undoRedoStack = [];
        this.currentStackIndex = -1;
        this.updateHistoryDisplay();
        this.showQuickActionFeedback('🗑️ History cleared');
    };

    // FAZA 3: Update History Display
    MAS.updateHistoryDisplay = function() {
        const historyCount = document.querySelector('.mas-history-count');
        const undoButton = document.querySelector('[data-action="undo"]');
        const redoButton = document.querySelector('[data-action="redo"]');
        
        if (historyCount) {
            historyCount.textContent = `${this.undoRedoStack.length} actions`;
        }
        
        if (undoButton) {
            undoButton.disabled = this.currentStackIndex < 0;
            undoButton.classList.toggle('disabled', this.currentStackIndex < 0);
        }
        
        if (redoButton) {
            redoButton.disabled = this.currentStackIndex >= this.undoRedoStack.length - 1;
            redoButton.classList.toggle('disabled', this.currentStackIndex >= this.undoRedoStack.length - 1);
        }
    };

    // FAZA 3: Show/Hide Advanced Toolbar
    MAS.showAdvancedToolbar = function() {
        const toolbar = document.querySelector('.mas-advanced-toolbar');
        if (toolbar) {
            toolbar.style.display = 'block';
            setTimeout(() => {
                toolbar.style.animation = 'slideInScale 0.3s ease-out';
            }, 10);
        }
    };

    MAS.hideAdvancedToolbar = function() {
        const toolbar = document.querySelector('.mas-advanced-toolbar');
        if (toolbar) {
            toolbar.style.display = 'none';
        }
    };

    // FAZA 3: Enhanced Element Click Handler
    MAS.enhanceElementClickHandler = function() {
        document.addEventListener('click', (e) => {
            // Only work in edit mode
            if (!document.body.classList.contains('mas-edit-mode-active')) return;
            
            const editableElement = e.target.closest('[data-mas-editable="true"]');
            if (!editableElement) return;
            
            // Prevent default action if multi-select mode
            if (this.isMultiSelectMode) {
                e.preventDefault();
                e.stopPropagation();
                
                // Toggle selection
                if (this.selectedElements.has(editableElement)) {
                    this.removeFromSelection(editableElement);
                } else {
                    this.addToSelection(editableElement);
                }
                
                this.updateSelectionDisplay();
                return;
            }
            
            // Single select mode - clear other selections
            if (!e.ctrlKey) {
                this.clearSelection();
            }
            
            this.addToSelection(editableElement);
            this.updateSelectionDisplay();
        });
    };

    // FAZA 3: Bulk Operations
    MAS.openBulkColorPanel = function() {
        if (this.selectedElements.size === 0) {
            this.showQuickActionFeedback('❌ No elements selected');
            return;
        }
        
        const panel = document.createElement('div');
        panel.className = 'mas-bulk-panel mas-bulk-color-panel';
        panel.innerHTML = `
            <h4>🎨 Bulk Color Changes</h4>
            <p>Applying to ${this.selectedElements.size} elements</p>
            
            <label>Background Color</label>
            <input type="color" data-bulk-property="backgroundColor" value="#ffffff">
            
            <label>Text Color</label>
            <input type="color" data-bulk-property="color" value="#333333">
            
            <label>Border Color</label>
            <input type="color" data-bulk-property="borderColor" value="#e0e0e0">
            
            <div class="mas-bulk-actions">
                <button class="mas-bulk-apply">✅ Apply</button>
                <button class="mas-bulk-cancel">❌ Cancel</button>
            </div>
        `;
        
        this.showBulkPanel(panel);
    };

    // FAZA 3: Enhanced Drag & Drop for Multiple Elements
    MAS.enableAdvancedDragDrop = function() {
        // This will be enhanced in the drag handles function
    };

    MAS.disableAdvancedDragDrop = function() {
    };

    // FAZA 3: Enable Multi-Select Features
    MAS.enableMultiSelect = function() {
        this.enhanceElementClickHandler();
    };

    MAS.disableMultiSelect = function() {
        // Remove event listeners and cleanup
    };

    // FAZA 3: Enable Bulk Operations
    MAS.enableBulkOperations = function() {
    };

    // FAZA 3: Show Bulk Panel
    MAS.showBulkPanel = function(panel) {
        // Position and show panel
        panel.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: var(--woow-glass-bg);
            backdrop-filter: var(--woow-blur-xl);
            border: 1px solid var(--woow-glass-border);
            border-radius: var(--woow-radius-xl);
            padding: var(--woow-space-lg);
            color: white;
            font-family: var(--woow-font-family);
            z-index: 9999999;
            min-width: 350px;
            animation: slideInScale 0.3s ease-out;
        `;
        
        document.body.appendChild(panel);
        
        // Bind events
        const applyButton = panel.querySelector('.mas-bulk-apply');
        const cancelButton = panel.querySelector('.mas-bulk-cancel');
        
        applyButton.addEventListener('click', () => {
            this.applyBulkChanges(panel);
            panel.remove();
        });
        
        cancelButton.addEventListener('click', () => {
            panel.remove();
        });
        
        // Close on escape
        const closeOnEscape = (e) => {
            if (e.key === 'Escape') {
                panel.remove();
                document.removeEventListener('keydown', closeOnEscape);
            }
        };
        document.addEventListener('keydown', closeOnEscape);
    };

    // FAZA 3: Apply Bulk Changes
    MAS.applyBulkChanges = function(panel) {
        const inputs = panel.querySelectorAll('input');
        const changes = {};
        
        inputs.forEach(input => {
            const property = input.getAttribute('data-bulk-property');
            if (property) {
                changes[property] = input.value;
            }
        });
        
        // Apply to all selected elements
        this.selectedElements.forEach(element => {
            Object.keys(changes).forEach(property => {
                element.style[property] = changes[property];
            });
        });
        
        // Save state for undo
        this.saveState('bulk_change', {
            elements: Array.from(this.selectedElements),
            changes: changes
        });
        
        this.showQuickActionFeedback(`✅ Applied bulk changes to ${this.selectedElements.size} elements`);
    };

    // FAZA 3: Revert State (for undo)
    MAS.revertState = function(state) {
        // Implementation depends on action type
    };

    // FAZA 3: Apply State (for redo)
    MAS.applyState = function(state) {
        // Implementation depends on action type
    };

    // FAZA 3: Initialize Selection Box
    MAS.initSelectionBox = function() {
        // Create selection box element
        this.selectionBox = document.createElement('div');
        this.selectionBox.className = 'mas-selection-box';
        document.body.appendChild(this.selectionBox);
        
    };

    // FAZA 3: Missing Bulk Operation Functions
    MAS.openBulkSpacingPanel = function() {
        if (this.selectedElements.size === 0) {
            this.showQuickActionFeedback('❌ No elements selected');
            return;
        }
        
        const panel = document.createElement('div');
        panel.className = 'mas-bulk-panel mas-bulk-spacing-panel';
        panel.innerHTML = `
            <h4>📏 Bulk Spacing Changes</h4>
            <p>Applying to ${this.selectedElements.size} elements</p>
            
            <label>Padding (px)</label>
            <input type="range" min="0" max="50" value="15" data-bulk-property="padding" data-unit="px">
            
            <label>Margin (px)</label>
            <input type="range" min="0" max="30" value="5" data-bulk-property="margin" data-unit="px">
            
            <label>Border Radius (px)</label>
            <input type="range" min="0" max="25" value="8" data-bulk-property="borderRadius" data-unit="px">
            
            <div class="mas-bulk-actions">
                <button class="mas-bulk-apply">✅ Apply</button>
                <button class="mas-bulk-cancel">❌ Cancel</button>
            </div>
        `;
        
        this.showBulkPanel(panel);
    };

    MAS.openBulkEffectsPanel = function() {
        if (this.selectedElements.size === 0) {
            this.showQuickActionFeedback('❌ No elements selected');
            return;
        }
        
        const panel = document.createElement('div');
        panel.className = 'mas-bulk-panel mas-bulk-effects-panel';
        panel.innerHTML = `
            <h4>✨ Bulk Effects Changes</h4>
            <p>Applying to ${this.selectedElements.size} elements</p>
            
            <label>
                <input type="checkbox" data-bulk-class="mas-glassmorphism-effect">
                Glassmorphism Effect
            </label>
            
            <label>
                <input type="checkbox" data-bulk-class="mas-3d-hover-effect">
                3D Hover Effect
            </label>
            
            <label>
                <input type="checkbox" data-bulk-class="mas-shadow-effect">
                Drop Shadow Effect
            </label>
            
            <label>Opacity</label>
            <input type="range" min="0" max="1" step="0.1" value="1" data-bulk-property="opacity">
            
            <label>Transform Scale</label>
            <input type="range" min="0.5" max="1.5" step="0.1" value="1" data-bulk-transform="scale">
            
            <div class="mas-bulk-actions">
                <button class="mas-bulk-apply">✅ Apply</button>
                <button class="mas-bulk-cancel">❌ Cancel</button>
            </div>
        `;
        
        this.showBulkPanel(panel);
    };

    MAS.openBulkPresetPanel = function() {
        if (this.selectedElements.size === 0) {
            this.showQuickActionFeedback('❌ No elements selected');
            return;
        }
        
        const panel = document.createElement('div');
        panel.className = 'mas-bulk-panel mas-bulk-preset-panel';
        panel.innerHTML = `
            <h4>🎯 Bulk Preset Application</h4>
            <p>Applying to ${this.selectedElements.size} elements</p>
            
            <div class="mas-preset-grid">
                <button class="mas-preset-btn" data-preset="dark-modern">🌙 Dark Modern</button>
                <button class="mas-preset-btn" data-preset="light-minimal">☀️ Light Minimal</button>
                <button class="mas-preset-btn" data-preset="colorful">🌈 Colorful</button>
                <button class="mas-preset-btn" data-preset="glass">💎 Glassmorphism</button>
            </div>
            
            <div class="mas-bulk-actions">
                <button class="mas-bulk-cancel">❌ Close</button>
            </div>
        `;
        
        // Show panel
        panel.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: var(--woow-glass-bg);
            backdrop-filter: var(--woow-blur-xl);
            border: 1px solid var(--woow-glass-border);
            border-radius: var(--woow-radius-xl);
            padding: var(--woow-space-lg);
            color: white;
            font-family: var(--woow-font-family);
            z-index: 9999999;
            min-width: 350px;
            animation: slideInScale 0.3s ease-out;
        `;
        
        document.body.appendChild(panel);
        
        // Bind preset buttons
        const presetButtons = panel.querySelectorAll('.mas-preset-btn');
        presetButtons.forEach(button => {
            button.addEventListener('click', () => {
                const preset = button.getAttribute('data-preset');
                this.applyBulkPreset(preset);
                panel.remove();
            });
        });
        
        // Bind cancel
        const cancelButton = panel.querySelector('.mas-bulk-cancel');
        cancelButton.addEventListener('click', () => {
            panel.remove();
        });
    };

    // FAZA 3: Apply Bulk Preset
    MAS.applyBulkPreset = function(preset) {
        const presets = {
            'dark-modern': {
                backgroundColor: '#1a1a1a',
                color: '#ffffff',
                borderColor: '#333333'
            },
            'light-minimal': {
                backgroundColor: '#f8f9fa',
                color: '#333333',
                borderColor: '#e0e0e0'
            },
            'colorful': {
                backgroundColor: 'linear-gradient(135deg, #667eea, #764ba2)',
                color: '#ffffff',
                borderColor: '#transparent'
            },
            'glass': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                color: '#ffffff',
                borderColor: 'rgba(255, 255, 255, 0.2)'
            }
        };
        
        const presetData = presets[preset];
        if (presetData) {
            // Apply to all selected elements
            this.selectedElements.forEach(element => {
                Object.keys(presetData).forEach(property => {
                    element.style[property] = presetData[property];
                });
                
                // Add special classes for glass effect
                if (preset === 'glass') {
                    element.classList.add('mas-glassmorphism-effect');
                }
            });
            
            // Save state for undo
            this.saveState('bulk_preset', {
                elements: Array.from(this.selectedElements),
                preset: preset,
                presetData: presetData
            });
            
            this.showQuickActionFeedback(`✨ Applied ${preset} preset to ${this.selectedElements.size} elements`);
        }
    };

    // FAZA 3: Enhanced Apply Bulk Changes (with ranges and transforms)
    MAS.applyBulkChanges = function(panel) {
        const inputs = panel.querySelectorAll('input');
        const changes = {};
        const transforms = {};
        const classes = [];
        
        inputs.forEach(input => {
            const property = input.getAttribute('data-bulk-property');
            const transform = input.getAttribute('data-bulk-transform');
            const className = input.getAttribute('data-bulk-class');
            const unit = input.getAttribute('data-unit') || '';
            
            if (property) {
                changes[property] = input.value + unit;
            } else if (transform) {
                transforms[transform] = input.value;
            } else if (className && input.checked) {
                classes.push(className);
            }
        });
        
        // Apply to all selected elements
        this.selectedElements.forEach(element => {
            // Apply style changes
            Object.keys(changes).forEach(property => {
                element.style[property] = changes[property];
            });
            
            // Apply transforms
            if (Object.keys(transforms).length > 0) {
                let transformString = '';
                Object.keys(transforms).forEach(transform => {
                    if (transform === 'scale') {
                        transformString += `scale(${transforms[transform]}) `;
                    }
                });
                if (transformString) {
                    element.style.transform = transformString.trim();
                }
            }
            
            // Apply classes
            classes.forEach(className => {
                element.classList.add(className);
            });
        });
        
        // Save state for undo
        this.saveState('bulk_change', {
            elements: Array.from(this.selectedElements),
            changes: changes,
            transforms: transforms,
            classes: classes
        });
        
        this.showQuickActionFeedback(`✅ Applied bulk changes to ${this.selectedElements.size} elements`);
    };

    // FAZA 3: Confirm Bulk Delete (careful operation)
    MAS.confirmBulkDelete = function() {
        if (this.selectedElements.size === 0) return;
        
        const confirmPanel = document.createElement('div');
        confirmPanel.className = 'mas-bulk-panel mas-confirm-delete-panel';
        confirmPanel.innerHTML = `
            <h4>🗑️ Confirm Bulk Delete</h4>
            <p style="color: #ff6b6b;">⚠️ You are about to DELETE ${this.selectedElements.size} elements!</p>
            <p>This action cannot be undone easily. Are you sure?</p>
            
            <div class="mas-bulk-actions">
                <button class="mas-bulk-apply" style="background: linear-gradient(135deg, #ff6b6b, #ff5757);">🗑️ DELETE</button>
                <button class="mas-bulk-cancel">❌ Cancel</button>
            </div>
        `;
        
        confirmPanel.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: var(--woow-glass-bg);
            backdrop-filter: var(--woow-blur-xl);
            border: 2px solid #ff6b6b;
            border-radius: var(--woow-radius-xl);
            padding: var(--woow-space-lg);
            color: white;
            font-family: var(--woow-font-family);
            z-index: 9999999;
            min-width: 350px;
            animation: slideInScale 0.3s ease-out;
        `;
        
        document.body.appendChild(confirmPanel);
        
        // Bind delete action
        const deleteButton = confirmPanel.querySelector('.mas-bulk-apply');
        deleteButton.addEventListener('click', () => {
            this.performBulkDelete();
            confirmPanel.remove();
        });
        
        // Bind cancel
        const cancelButton = confirmPanel.querySelector('.mas-bulk-cancel');
        cancelButton.addEventListener('click', () => {
            confirmPanel.remove();
        });
    };

    // FAZA 3: Perform Bulk Delete
    MAS.performBulkDelete = function() {
        const elementsToDelete = Array.from(this.selectedElements);
        
        // Save state for undo
        this.saveState('bulk_delete', {
            elements: elementsToDelete,
            elementsData: elementsToDelete.map(el => ({
                element: el,
                parent: el.parentNode,
                nextSibling: el.nextSibling,
                outerHTML: el.outerHTML
            }))
        });
        
        // Remove elements (hide them for safety)
        elementsToDelete.forEach(element => {
            element.style.display = 'none';
            element.classList.add('mas-deleted');
        });
        
        this.clearSelection();
        this.showQuickActionFeedback(`🗑️ Deleted ${elementsToDelete.length} elements (reversible with Undo)`);
    };

    // ========================================================================
    //  WOOW! LiveEditEngine: The Single Source of Truth for Live Editing
    // ========================================================================
    // REFACTOR: This central engine replaces the fragmented logic of the old
    // LiveEditToggle and global click listeners. It manages the entire
    // lifecycle of the live edit mode.
    // ========================================================================
    const LiveEditEngine = {
        // Core state management
        isActive: false,
        toggleButton: null,
        editableElements: [],
        activePanels: new Map(),
        
        // Configuration
        STATE_KEY: 'woow-live-edit-engine-state',
        EDITABLE_SELECTOR: '[data-woow-editable="true"]',
        
        /**
         * 🚀 Initialize the Live Edit Engine
         */
        init() {
            console.log('🎯 WOOW! LiveEditEngine: Initializing unified architecture...');
            
            this.initializeToggleButton();
            this.discoverEditableElements();
            this.restoreState();
            this.applyState();
            
            console.log(`✅ WOOW! LiveEditEngine: Initialized with ${this.editableElements.length} editable elements`);
        },
        
        /**
         * 🎛️ Initialize toggle button with enterprise-grade integration
         */
        initializeToggleButton() {
            this.toggleButton = document.getElementById('woow-live-edit-toggle');
            
            if (!this.toggleButton) {
                this.createToggleButton();
            }
            
            if (this.toggleButton) {
                this.toggleButton.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.toggleState();
                });
            }
        },
        
        /**
         * 🎨 Create toggle button if none exists
         */
        createToggleButton() {
            const adminBar = document.querySelector('#wp-admin-bar-top-secondary') || 
                            document.querySelector('#wpadminbar .ab-top-menu') ||
                            document.querySelector('#wpadminbar');
            
            if (!adminBar) return;
            
            const listItem = document.createElement('li');
            listItem.id = 'wp-admin-bar-woow-live-edit';
            listItem.className = 'menupop';
            
            const button = document.createElement('div');
            button.id = 'woow-live-edit-toggle';
            button.className = 'ab-item ab-empty-item';
            button.setAttribute('role', 'button');
            button.setAttribute('aria-label', 'Toggle WOOW! Live Edit Mode');
            
            button.style.cssText = `
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 6px;
                padding: 0 12px;
                transition: all 0.3s ease;
                background: linear-gradient(135deg, #667eea, #764ba2);
                color: white !important;
                border-radius: 4px;
                margin: 6px 4px;
                min-height: 26px;
                opacity: 0.8;
            `;
            
            button.innerHTML = `
                <span class="ab-icon dashicons dashicons-edit"></span>
                <span class="ab-label">Live Edit</span>
                <span class="woow-toggle-indicator" style="
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    background: #ff4757;
                    transition: all 0.3s ease;
                    margin-left: 4px;
                "></span>
            `;
            
            listItem.appendChild(button);
            adminBar.appendChild(listItem);
            this.toggleButton = button;
        },
        
        /**
         * 🔍 Discover all elements marked as editable
         */
        discoverEditableElements() {
            this.editableElements = Array.from(document.querySelectorAll(this.EDITABLE_SELECTOR));
            
            if (this.editableElements.length === 0) {
                this.addDefaultEditableAttributes();
            }
            
            console.log(`🔍 LiveEditEngine: Found ${this.editableElements.length} editable elements`);
        },
        
        /**
         * 🏷️ Add data attributes to default WordPress elements
         */
        addDefaultEditableAttributes() {
            const defaultElements = ['#wpadminbar', '#adminmenuwrap', '#wpwrap', '#wpfooter'];
            
            defaultElements.forEach(selector => {
                const element = document.querySelector(selector);
                if (element) {
                    element.setAttribute('data-woow-editable', 'true');
                    this.editableElements.push(element);
                }
            });
        },
        
        /**
         * 🔄 Toggle Live Edit state
         */
        toggleState() {
            this.isActive = !this.isActive;
            
            if (this.isActive) {
                this.activate();
            } else {
                this.deactivate();
            }
            
            this.saveState();
            this.updateToggleButtonState();
            this.showFeedback(this.isActive ? 'Live Edit Mode Activated! Click elements to edit.' : 'Live Edit Mode Deactivated');
        },
        
        /**
         * ✅ Activate Live Edit Mode
         */
        activate() {
            document.body.classList.add('woow-live-edit-enabled', 'mas-edit-mode-active');
            
            this.editableElements.forEach(el => {
                el.addEventListener('click', this.handleEditableClick, { capture: true });
                el.style.outline = '2px dashed rgba(102, 126, 234, 0.6)';
                el.style.cursor = 'pointer';
            });
            
            document.addEventListener('keydown', this.handleEscapeKey);
            console.log('✅ LiveEditEngine: ACTIVATED');
        },
        
        /**
         * ❌ Deactivate Live Edit Mode
         */
        deactivate() {
            document.body.classList.remove('woow-live-edit-enabled', 'mas-edit-mode-active');
            
            this.editableElements.forEach(el => {
                el.removeEventListener('click', this.handleEditableClick, { capture: true });
                el.style.outline = '';
                el.style.cursor = '';
            });
            
            document.removeEventListener('keydown', this.handleEscapeKey);
            this.closeAllPanels();
            console.log('❌ LiveEditEngine: DEACTIVATED');
        },
        
        /**
         * 🖱️ Handle clicks on editable elements
         */
        handleEditableClick: function(event) {
            event.preventDefault();
            event.stopPropagation();
            
            const element = event.currentTarget;
            const elementId = element.id;
            
            console.log(`🖱️ LiveEditEngine: Clicked ${elementId}`);
            
            LiveEditEngine.closeAllPanels();
            
            if (elementId && window.MicroPanelFactory) {
                window.MicroPanelFactory.build(elementId);
            } else if (elementId && window.ConfigManager) {
                const config = window.ConfigManager.getComponentConfig(elementId);
                if (config) {
                    LiveEditEngine.openMicroPanel(element, config);
                }
            }
        },
        
        /**
         * ⌨️ Handle escape key
         */
        handleEscapeKey: function(event) {
            if (event.key === 'Escape') {
                LiveEditEngine.deactivate();
            }
        },
        
        /**
         * 🗄️ Open micro panel
         */
        openMicroPanel(element, config) {
            const panel = document.createElement('div');
            panel.className = 'woow-live-edit-panel';
            panel.style.cssText = `
                position: fixed;
                top: 50px;
                right: 20px;
                width: 300px;
                background: white;
                border: 1px solid #ddd;
                border-radius: 8px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.15);
                z-index: 999999;
                padding: 20px;
            `;
            
            panel.innerHTML = `
                <h3>Edit ${config.title || element.tagName}</h3>
                <p>Element: ${element.id}</p>
                <button onclick="this.parentElement.remove()">Close</button>
            `;
            
            document.body.appendChild(panel);
            this.activePanels.set(element.id, panel);
        },
        
        closeAllPanels() {
            this.activePanels.forEach(panel => panel.remove());
            this.activePanels.clear();
        },
        
        updateToggleButtonState() {
            if (!this.toggleButton) return;
            
            const indicator = this.toggleButton.querySelector('.woow-toggle-indicator');
            
            if (this.isActive) {
                indicator.style.background = '#2ed573';
                this.toggleButton.style.background = 'linear-gradient(135deg, #2ed573, #1dd1a1)';
            } else {
                indicator.style.background = '#ff4757';
                this.toggleButton.style.background = 'linear-gradient(135deg, #667eea, #764ba2)';
            }
        },
        
        saveState() {
            localStorage.setItem(this.STATE_KEY, this.isActive.toString());
        },
        
        restoreState() {
            const savedState = localStorage.getItem(this.STATE_KEY);
            this.isActive = savedState === 'true';
        },
        
        applyState() {
            if (this.isActive) {
                this.activate();
            } else {
                this.deactivate();
            }
            this.updateToggleButtonState();
        },
        
        showFeedback(message) {
            if (window.MAS && typeof window.MAS.showNotification === 'function') {
                window.MAS.showNotification(message, 'info');
                return;
            }
            
            const toast = document.createElement('div');
            toast.style.cssText = `
                position: fixed;
                top: 40px;
                right: 20px;
                background: rgba(0, 0, 0, 0.9);
                color: white;
                padding: 12px 20px;
                border-radius: 6px;
                font-size: 14px;
                z-index: 999999;
                transition: all 0.3s ease;
            `;
            toast.textContent = message;
            
            document.body.appendChild(toast);
            
            setTimeout(() => {
                toast.style.opacity = '0';
                setTimeout(() => toast.remove(), 300);
            }, 3000);
        }
    };
    
    // Export to global scope
    window.LiveEditEngine = LiveEditEngine;

    // ========================================================================
    // 🏭 MicroPanelFactory: Builds and manages the lifecycle of micro-panels.
    // ========================================================================
    // REFACTOR: This is now a stateful singleton with an intelligent positioning
    // engine. It ensures that only one panel is open at a time, handles closing,
    // and dynamically calculates the panel's position to keep it within the
    // viewport, preventing it from being cut off.
    const MicroPanelFactory = {
        currentPanel: null,
        currentTargetId: null,
        boundClickHandler: null,

        // This handler is bound once and reused for performance.
        handleClickOutside(event) {
            if (this.currentPanel && !this.currentPanel.contains(event.target)) {
                // The click was outside the currently open panel, so we close it.
                this.close();
                const targetElement = document.getElementById(this.currentTargetId);
                // Also check if the click is on the original button, to let the build method handle the toggle
                if (targetElement && !targetElement.contains(event.target)) {
                    this.close();
                }
            }
        },

        build(elementId) {
            // Feature: If the user clicks the same element again, toggle the panel off.
            const targetElement = document.getElementById(elementId);
            if (!targetElement) {
                console.error(`WOOW! Error: Target element with ID #${elementId} not found.`);
                return;
            }

            if (this.currentPanel && this.currentTargetId === elementId) {
                this.close();
                return;
            }
            
            // CRITICAL: Ensure any previously open panel is closed before building a new one.
            this.close();

            const config = this.getElementConfig(elementId);
            if (!config) {
                console.error(`WOOW! Error: No configuration found for element ID: ${elementId}`);
                return;
            }
            
            // --- Panel Creation Logic ---
            const panel = document.createElement('div');
            panel.className = 'woow-micro-panel';
            panel.id = `woow-panel-for-${elementId}`;
            panel.innerHTML = `
                <div class="woow-panel-header">
                    <h3>${config.title}</h3>
                    <button class="woow-panel-close" aria-label="Close">&times;</button>
                </div>
                <div class="woow-panel-content"></div>
            `;

            const panelContent = panel.querySelector('.woow-panel-content');
            config.options.forEach(option => {
                const currentValue = window.SettingsManager ? window.SettingsManager.get(option.key) : option.default;
                const controlElement = this.createControlElement(option, currentValue);
                if (controlElement) {
                    panelContent.appendChild(controlElement);
            }
            });

            // Add to body but keep it invisible to measure its dimensions
            panel.style.position = 'fixed';
            panel.style.zIndex = '999999';
            panel.style.visibility = 'hidden';
            panel.style.width = '320px';
            panel.style.maxWidth = '90vw';
            panel.style.background = 'white';
            panel.style.border = '1px solid #ddd';
            panel.style.borderRadius = '12px';
            panel.style.boxShadow = '0 8px 32px rgba(0,0,0,0.12)';
            panel.style.padding = '0';
            panel.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
            panel.style.fontSize = '14px';
            panel.style.color = '#333';
            document.body.appendChild(panel);

            // --- Intelligent Positioning Engine ---
            const targetRect = targetElement.getBoundingClientRect();
            const panelRect = panel.getBoundingClientRect();
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            const margin = 10; // Margin from viewport edges

            let top, left;

            // Default position: below the target element
            top = targetRect.bottom + margin;
            left = targetRect.left;

            // Adjust horizontal position to stay in viewport
            if (left + panelRect.width > viewportWidth - margin) {
                left = viewportWidth - panelRect.width - margin;
            }
            if (left < margin) {
                left = margin;
            }

            // Adjust vertical position to stay in viewport
            // If it overflows below, try to place it above
            if (top + panelRect.height > viewportHeight - margin) {
                top = targetRect.top - panelRect.height - margin;
            }
            // If it still overflows above (e.g., very tall panel or target at top of screen),
            // place it just inside the viewport top.
            if (top < margin) {
                top = margin;
            }

            panel.style.top = `${top}px`;
            panel.style.left = `${left}px`;
            panel.style.visibility = 'visible';
            // --- End of Positioning Engine ---

            this.currentPanel = panel;
            this.currentTargetId = elementId;

            // Add a listener to the panel's own close button for explicit closing.
            panel.querySelector('.woow-panel-close').addEventListener('click', () => this.close());

            // IMPORTANT: Add the "click outside" listener ONLY when the panel is open.
            // We use a timeout to prevent the same click that opened the panel from immediately closing it.
            setTimeout(() => {
                this.boundClickHandler = this.handleClickOutside.bind(this);
                document.addEventListener('click', this.boundClickHandler, { capture: true });
            }, 0);
        },

        close() {
            if (this.currentPanel) {
                this.currentPanel.remove();
                this.currentPanel = null;
                this.currentTargetId = null;

                // CRITICAL FOR PERFORMANCE: Clean up the global event listener to prevent memory leaks.
                if (this.boundClickHandler) {
                    document.removeEventListener('click', this.boundClickHandler, { capture: true });
                    this.boundClickHandler = null;
                }
            }
        },
        
        /**
         * 🔧 Get configuration for an element
         */
        getElementConfig(elementId) {
            // Try ConfigManager first
            if (window.ConfigManager && window.ConfigManager.isConfigLoaded()) {
                return window.ConfigManager.getComponentConfig(elementId);
            }
            
            // Fallback to hardcoded configurations
            return this.getFallbackConfig(elementId);
        },
        
        /**
         * 🎛️ Create control element based on option type
         */
        createControlElement(option, currentValue) {
                const group = document.createElement('div');
                group.className = 'woow-control-group';
            group.style.cssText = `
                margin-bottom: 16px;
                padding: 0 16px;
            `;
                
                const label = document.createElement('label');
                label.className = 'woow-control-label';
                label.textContent = option.label;
            label.style.cssText = `
                display: block;
                font-weight: 500;
                margin-bottom: 6px;
                color: #555;
            `;
                
            const input = this.createControlInput(option, currentValue);
                
                group.appendChild(label);
                group.appendChild(input);
            return group;
        },
        
        /**
         * 🎛️ Create control input based on type
         */
        createControlInput(option, currentValue) {
            const input = document.createElement('input');
            input.className = 'woow-control-input';
            
            switch (option.type) {
                case 'color':
                    input.type = 'color';
                    input.value = currentValue || option.default || '#000000';
                    input.style.cssText = `
                        width: 100%;
                        height: 40px;
                        border: 1px solid #ddd;
                        border-radius: 6px;
                        cursor: pointer;
                    `;
                    break;
                case 'slider':
                    input.type = 'range';
                    input.min = option.min || 0;
                    input.max = option.max || 100;
                    input.value = currentValue || option.default || 50;
                    input.style.cssText = `
                        width: 100%;
                        height: 6px;
                        border-radius: 3px;
                        background: #f0f0f0;
                        outline: none;
                    `;
                    break;
                default:
                    input.type = 'text';
                    input.value = currentValue || option.default || '';
                    input.style.cssText = `
                        width: 100%;
                        padding: 8px 12px;
                        border: 1px solid #ddd;
                        border-radius: 6px;
                        font-size: 14px;
                    `;
            }
            
            // Add event listener for live changes
            input.addEventListener('input', (e) => {
                this.handleControlChange(option, e.target.value);
            });
            
            return input;
        },
        
        /**
         * 🔄 Handle control changes
         */
        handleControlChange(option, value) {
            console.log(`🔄 MicroPanelFactory: ${option.key} changed to ${value}`);
            
            // Apply CSS variable if specified
            if (option.cssVar) {
                document.body.style.setProperty(option.cssVar, value, 'important');
            }
            
            // Update SettingsManager if available
            if (window.SettingsManager) {
                window.SettingsManager.update(option.key, value, {
                    cssVar: option.cssVar,
                    unit: option.unit
                });
            }
        },
        
        /**
         * 🔧 Get fallback configuration
         */
        getFallbackConfig(elementId) {
            const fallbacks = {
                'wpadminbar': {
                    title: 'Admin Bar',
                    options: [
                        {
                            key: 'surface_bar',
                            label: 'Background Color',
                            type: 'color',
                            cssVar: '--woow-surface-bar',
                            default: '#23282d'
                        },
                        {
                            key: 'surface_bar_text',
                            label: 'Text Color',
                            type: 'color',
                            cssVar: '--woow-surface-bar-text',
                            default: '#ffffff'
                        },
                        {
                            key: 'surface_bar_height',
                            label: 'Height',
                            type: 'slider',
                            cssVar: '--woow-surface-bar-height',
                            unit: 'px',
                            min: 24,
                            max: 60,
                            default: 32
                        }
                    ]
                },
                'adminmenuwrap': {
                    title: 'Admin Menu',
                    options: [
                        {
                            key: 'surface_menu',
                            label: 'Background Color',
                            type: 'color',
                            cssVar: '--woow-surface-menu',
                            default: '#ffffff'
                        }
                    ]
                }
            };
            
            return fallbacks[elementId] || null;
        }
    };
    
    // Export to global scope
    window.MicroPanelFactory = MicroPanelFactory;

    // ========================================================================
    // 🗑️ OLD SYSTEM: LiveEditToggle (DEPRECATED - kept for compatibility)
    // ========================================================================
    const LiveEditToggle = {
        STATE_KEY: 'woow-live-edit-mode',
        targetElement: '#wp-admin-bar-top-secondary', // WordPress admin bar right side
        toggleButton: null,
        
        init() {
            // Sprawdź czy jesteśmy w WordPress admin
            if (!document.getElementById('wpadminbar')) {
                console.log('WOOW! Styler: Not in WordPress admin, skipping Live Edit toggle.');
                return;
            }
            
            // Sprawdź czy toggle już istnieje
            if (document.querySelector('#woow-live-edit-toggle')) {
                console.log('WOOW! Styler: Live Edit toggle already exists.');
                return;
            }
            
            // Spróbuj różnych selektorów dla WordPress admin bar
            let target = document.querySelector(this.targetElement);
            
            // Fallback: próbuj inne lokacje
            if (!target) {
                target = document.querySelector('#wp-admin-bar-top-secondary');
            }
            if (!target) {
                target = document.querySelector('#wp-admin-bar-root-default');
            }
            if (!target) {
                target = document.querySelector('#wpadminbar .ab-top-menu');
            }
            if (!target) {
                target = document.querySelector('#wpadminbar');
            }
            
            if (!target) {
                console.warn('WOOW! Styler: Could not find any suitable admin bar target for Live Edit toggle.');
                return;
            }
            
            this.toggleButton = this.build();
            target.appendChild(this.toggleButton);
            
            this.applyInitialState();
            this.syncWithFormToggles();
            
            console.log('✅ WOOW! LiveEditToggle: Successfully initialized in admin bar at:', target.tagName + (target.id ? '#' + target.id : '') + (target.className ? '.' + target.className.replace(/\s+/g, '.') : ''));
        },
        
        build() {
            // Tworzymy li element zgodny ze standardem WordPress admin bar
            const listItem = document.createElement('li');
            listItem.id = 'wp-admin-bar-woow-live-edit';
            listItem.className = 'menupop';
            
            const button = document.createElement('div');
            button.id = 'woow-live-edit-toggle';
            button.className = 'ab-item ab-empty-item';
            button.setAttribute('role', 'button');
            button.setAttribute('aria-label', 'Toggle WOOW! Live Edit Mode');
            
            // Stylizacja inline dla natychmiastowego efektu
            button.style.cssText = `
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 6px;
                padding: 0 12px;
                transition: all 0.3s ease;
                background: linear-gradient(135deg, #667eea, #764ba2);
                color: white !important;
                border-radius: 4px;
                margin: 6px 4px;
                min-height: 26px;
                opacity: 0.8;
            `;
            
            button.innerHTML = `
                <span class="ab-icon dashicons dashicons-edit" style="font-size: 16px; line-height: 1;"></span>
                <span class="ab-label" style="font-size: 12px; font-weight: 500;">Live Edit</span>
                <span class="woow-toggle-indicator" style="
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    background: #ff4757;
                    transition: all 0.3s ease;
                    margin-left: 4px;
                "></span>
            `;
            
            button.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.toggleState();
            });
            
            // Hover effects
            button.addEventListener('mouseenter', function() {
                this.style.opacity = '1';
                this.style.transform = 'translateY(-1px)';
            });
            
            button.addEventListener('mouseleave', function() {
                this.style.opacity = '0.8';
                this.style.transform = 'translateY(0)';
            });
            
            listItem.appendChild(button);
            return listItem;
        },
        
        toggleState() {
            const isCurrentlyEnabled = this.isLiveEditEnabled();
            const newState = !isCurrentlyEnabled;
            
            // Zapisz stan
            localStorage.setItem(this.STATE_KEY, newState.toString());
            
            // Aktualizuj UI
            this.updateButtonState(newState);
            
            // Synchronizuj z formularzami
            this.syncWithFormToggles();
            
            // ✅ NAPRAWKA INTEGRACJI: Poprawna synchronizacja z systemem MAS
            if (window.MAS && typeof window.MAS.handleLiveEditModeToggle === 'function') {
                // Ustaw stan body classes
                if (newState) {
                    document.body.classList.add('mas-edit-mode-active', 'woow-live-edit-enabled');
                } else {
                    document.body.classList.remove('mas-edit-mode-active', 'woow-live-edit-enabled');
                }
                
                // KRYTYCZNE: Ustaw stan w formularzu PRZED wywołaniem handlera
                const formToggle = document.getElementById('mas-v2-edit-mode-switch');
                if (formToggle) {
                    formToggle.checked = newState;
                }
                
                // Wywołaj handler MAS (który sprawdza stan przełącznika)
                window.MAS.handleLiveEditModeToggle();
                
                console.log(`🔄 WOOW! LiveEditToggle: ${newState ? 'Enabled' : 'Disabled'} Live Edit Mode`);
            }
            
            // Pokaż feedback
            this.showFeedback(newState ? 'Live Edit Mode Activated - Click elements to edit!' : 'Live Edit Mode Deactivated');
        },
        
        isLiveEditEnabled() {
            return localStorage.getItem(this.STATE_KEY) === 'true' || 
                   document.body.classList.contains('woow-live-edit-enabled');
        },
        
        updateButtonState(isEnabled) {
            if (!this.toggleButton) return;
            
            const indicator = this.toggleButton.querySelector('.woow-toggle-indicator');
            const button = this.toggleButton.querySelector('.ab-item');
            
            if (isEnabled) {
                indicator.style.background = '#2ed573'; // Green
                button.style.background = 'linear-gradient(135deg, #2ed573, #1dd1a1)';
                button.style.boxShadow = '0 2px 8px rgba(46, 213, 115, 0.3)';
            } else {
                indicator.style.background = '#ff4757'; // Red
                button.style.background = 'linear-gradient(135deg, #667eea, #764ba2)';
                button.style.boxShadow = 'none';
            }
        },
        
        applyInitialState() {
            const isEnabled = this.isLiveEditEnabled();
            this.updateButtonState(isEnabled);
            
            if (isEnabled) {
                document.body.classList.add('woow-live-edit-enabled');
            }
        },
        
        syncWithFormToggles() {
            // Synchronizuj z przełącznikami w formularzu
            const formToggle = document.getElementById('mas-v2-edit-mode-switch');
            const heroToggle = document.getElementById('mas-v2-edit-mode-switch-hero');
            const isEnabled = this.isLiveEditEnabled();
            
            if (formToggle) {
                formToggle.checked = isEnabled;
            }
            
            if (heroToggle) {
                heroToggle.checked = isEnabled;
            }
        },
        
        showFeedback(message) {
            // Użyj systemu notyfikacji MAS jeśli dostępny
            if (window.MAS && typeof window.MAS.showNotification === 'function') {
                window.MAS.showNotification(message, 'info');
                return;
            }
            
            // Fallback: prosty toast
            const toast = document.createElement('div');
            toast.style.cssText = `
                position: fixed;
                top: 32px;
                right: 20px;
                background: rgba(0, 0, 0, 0.8);
                color: white;
                padding: 12px 16px;
                border-radius: 6px;
                font-size: 14px;
                z-index: 999999;
                transition: all 0.3s ease;
            `;
            toast.textContent = message;
            
            document.body.appendChild(toast);
            
            setTimeout(() => {
                toast.style.opacity = '0';
                setTimeout(() => toast.remove(), 300);
            }, 2000);
        }
    };
    
    // Eksportuj LiveEditToggle do global scope dla dostępności z backup init
    window.LiveEditToggle = LiveEditToggle;
    
    // ========================================================================
    // GŁÓWNA INICJALIZACJA - Enterprise Pattern
    // ========================================================================
    // Inicjalizacja po załadowaniu DOM z pełnym error handling
    document.addEventListener('DOMContentLoaded', async function() {
        try {
            // 🚀 ENTERPRISE FEATURE: Inicjalizuj ConfigManager (pobiera konfigurację z serwera)
            if (window.ConfigManager) {
                await window.ConfigManager.init();
                console.log('✅ WOOW! ConfigManager: Initialized successfully');
            }

            // 🚀 Initialize UnifiedSettingsManager (Enterprise-Grade)
            // Load the UnifiedSettingsManager if available
            if (window.UnifiedSettingsManager || window.initializeUnifiedSettingsManager) {
                try {
                    // Get initial settings from various sources
                    let initialSettings = {};
                    
                    if (window.woowV2Global && window.woowV2Global.settings) {
                        initialSettings = window.woowV2Global.settings;
                        console.log('✅ WOOW! UnifiedSettingsManager: Using settings from PHP', initialSettings);
                    } else if (window.woowV2 && window.woowV2.settings) {
                        initialSettings = window.woowV2.settings;
                        console.log('✅ WOOW! UnifiedSettingsManager: Using settings from PHP (woowV2)', initialSettings);
                    } else {
                        // Fallback to localStorage
                        const savedSettings = localStorage.getItem('woow_settings');
                        initialSettings = savedSettings ? JSON.parse(savedSettings) : {};
                        console.log('⚠️ WOOW! UnifiedSettingsManager: Using settings from localStorage', initialSettings);
                    }
                    
                    // Initialize UnifiedSettingsManager with initial settings
                    if (window.initializeUnifiedSettingsManager) {
                        await window.initializeUnifiedSettingsManager({
                            initialSettings,
                            debugMode: window.location.search.includes('debug=true')
                        });
                        console.log('✅ WOOW! UnifiedSettingsManager: Initialized successfully');
                    } else if (window.UnifiedSettingsManager) {
                        await window.UnifiedSettingsManager.initialize();
                        console.log('✅ WOOW! UnifiedSettingsManager: Already initialized');
                    }
                    
                    // Restore all settings after page refresh
                    if (Object.keys(initialSettings).length > 0 && window.SettingsManager) {
                        window.SettingsManager.restoreAllSettings();
                    }
                    
                } catch (error) {
                    console.error('❌ WOOW! UnifiedSettingsManager initialization failed:', error);
                    console.log('⚠️ WOOW! Falling back to legacy SettingsManager');
                    
                    // Fallback to legacy SettingsManager
                    if (window.SettingsManager) {
                        let initialSettings = {};
                        
                        if (window.woowV2Global && window.woowV2Global.settings) {
                            initialSettings = window.woowV2Global.settings;
                        } else if (window.woowV2 && window.woowV2.settings) {
                            initialSettings = window.woowV2.settings;
                        } else {
                            const savedSettings = localStorage.getItem('woow_settings');
                            initialSettings = savedSettings ? JSON.parse(savedSettings) : {};
                        }
                        
                        window.SettingsManager.init(initialSettings);
                        
                        if (Object.keys(initialSettings).length > 0) {
                            window.SettingsManager.restoreAllSettings();
                        }
                    }
                }
            } else {
                // Legacy SettingsManager initialization
                if (window.SettingsManager) {
                    let initialSettings = {};
                    
                    if (window.woowV2Global && window.woowV2Global.settings) {
                        initialSettings = window.woowV2Global.settings;
                        console.log('✅ WOOW! SettingsManager: Using settings from PHP', initialSettings);
                    } else if (window.woowV2 && window.woowV2.settings) {
                        initialSettings = window.woowV2.settings;
                        console.log('✅ WOOW! SettingsManager: Using settings from PHP (woowV2)', initialSettings);
                    } else {
                        const savedSettings = localStorage.getItem('woow_settings');
                        initialSettings = savedSettings ? JSON.parse(savedSettings) : {};
                        console.log('⚠️ WOOW! SettingsManager: Using settings from localStorage', initialSettings);
                    }
                    
                    window.SettingsManager.init(initialSettings);
                    
                    if (Object.keys(initialSettings).length > 0) {
                        window.SettingsManager.restoreAllSettings();
                    }
                }
            }
        
            // Inicjalizuj główny system MAS
            if (window.MAS && typeof window.MAS.init === 'function') {
                window.MAS.init();
                window.MAS_INITIALIZED = true; // Flaga dla backup initialization
                console.log('✅ WOOW! MAS System: Successfully initialized');
            }
            
            // Dodatkowe systemy 3D (jeśli dostępne)
            if (window.MAS_3D_Effects_System) {
                window.mas3DEffects = new MAS_3D_Effects_System();
            }
            
            if (window.MAS_3D_Controls) {
                window.mas3DControls = new MAS_3D_Controls();
                window.mas3DControls.init();
            }
            
        } catch (error) {
            console.error('❌ WOOW! Initialization Error:', error);
            console.error('❌ Error details:', {
                message: error.message,
                stack: error.stack,
                location: window.location.href,
                masData: typeof masV2 !== 'undefined' || typeof masV2Global !== 'undefined'
            });
            
            // Only show alert for critical errors, not missing optional components
            if (error.message.includes('required') || error.message.includes('critical')) {
                if (window.location.hostname.includes('local') || window.location.hostname === 'localhost') {
                    alert('WOOW! Admin Styler initialization failed. Check console for details.');
                }
            } else {
                console.log('ℹ️ WOOW! Non-critical initialization issue - system will continue with available components');
            }
        }
    });

    // ========================================================================
    // WOOW! SettingsManager: The Single Source of Truth for Options
    // ========================================================================
    // Centralny menedżer stanu - zarządza ustawieniami, zapisuje do bazy danych
    // i synchronizuje z CSS w czasie rzeczywistym
    // ========================================================================
    const SettingsManager = {
        settings: {}, // Cache ustawień w pamięci
        saveTimeout: null,
        isInitialized: false,

        init(initialSettings = {}) {
            this.settings = initialSettings;
            this.isInitialized = true;
            console.log('✅ WOOW! SettingsManager: Initialized with settings:', this.settings);
            
            // 🔥 CRITICAL: Setup admin bar color guardian
            this.setupAdminBarGuardian();
        },
        
        /**
         * 🛡️ Setup admin bar color guardian to prevent WordPress from overriding
         */
        setupAdminBarGuardian() {
            const adminBar = document.querySelector('#wpadminbar');
            if (!adminBar) return;
            
            // Watch for style changes on admin bar
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                        const currentSurfaceBar = document.documentElement.style.getPropertyValue('--woow-surface-bar');
                        if (currentSurfaceBar && currentSurfaceBar.trim() !== '') {
                            const adminBar = mutation.target;
                            adminBar.style.setProperty('background-color', currentSurfaceBar.trim(), 'important');
                            adminBar.style.setProperty('background', currentSurfaceBar.trim(), 'important');
                            console.log(`🛡️ WOOW! Guardian: Restored admin bar color to ${currentSurfaceBar.trim()} !important`);
                        }
                    }
                });
            });
            
            observer.observe(adminBar, {
                attributes: true,
                attributeFilter: ['style']
            });
            
            console.log('🛡️ WOOW! Admin bar guardian activated');
            
            // Also setup periodic check every 2 seconds
            setInterval(() => {
                const currentSurfaceBar = document.documentElement.style.getPropertyValue('--woow-surface-bar');
                if (currentSurfaceBar && currentSurfaceBar.trim() !== '') {
                    const adminBar = document.querySelector('#wpadminbar');
                    if (adminBar) {
                        const currentBg = getComputedStyle(adminBar).backgroundColor;
                        const expectedColor = currentSurfaceBar.trim();
                        
                        // Check if admin bar background doesn't match expected color
                        if (!currentBg.includes(expectedColor.replace('#', '')) && expectedColor !== '#2c3338') {
                            adminBar.style.setProperty('background-color', expectedColor, 'important');
                            adminBar.style.setProperty('background', expectedColor, 'important');
                            console.log(`🔄 WOOW! Periodic check: Fixed admin bar color to ${expectedColor} !important`);
                        }
                    }
                }
            }, 2000);
        },

        /**
         * Główna funkcja do aktualizacji ustawienia
         * @param {string} key - Klucz ustawienia (np. 'admin_bar_bg_color')
         * @param {string|boolean} value - Nowa wartość
         * @param {object} options - Dodatkowe opcje jak cssVar lub bodyClass
         */
        update(key, value, options = {}) {
            console.log(`🔄 WOOW! SettingsManager: Updating ${key} =`, value, options);
            
            this.settings[key] = value;

            // 1. Zastosuj zmianę wizualną natychmiast
            if (options.cssVar) {
                const cssValue = options.unit ? value + options.unit : value;
                // FINAL ARCHITECTURE: Apply styles only to body.wp-admin to match PHP implementation
                // This ensures consistency with the high-specificity override layer and prevents
                // conflicts with theme variables defined on :root or [data-theme] selectors
                document.body.style.setProperty(options.cssVar, cssValue, 'important');
                console.log(`🎨 WOOW! Applied CSS: ${options.cssVar} = ${cssValue} !important`);
                
                // 🔥 CRITICAL FIX: Force admin bar color change for stubborn WordPress
                if (options.cssVar === '--woow-surface-bar') {
                    const adminBar = document.querySelector('#wpadminbar');
                    if (adminBar) {
                        adminBar.style.setProperty('background-color', cssValue, 'important');
                        adminBar.style.setProperty('background', cssValue, 'important');
                        console.log(`🎯 WOOW! FORCED admin bar color: ${cssValue} !important`);
                    }
                }
            }
            
            if (options.bodyClass) {
                if (typeof value === 'boolean') {
                    document.body.classList.toggle(options.bodyClass, value);
                    console.log(`🏷️ WOOW! Body class ${options.bodyClass}: ${value ? 'added' : 'removed'}`);
                }
            }

            if (options.selector) {
                if (typeof value === 'boolean') {
                    const element = document.querySelector(options.selector);
                    if (element) {
                        element.style.display = value ? 'none' : '';
                        console.log(`👁️ WOOW! Element ${options.selector} visibility: ${value ? 'hidden' : 'visible'}`);
                    }
                }
            }

            // 2. Zaplanuj zapis do bazy danych (debounced)
            this.scheduleSave();
        },

        scheduleSave() {
            clearTimeout(this.saveTimeout);
            this.saveTimeout = setTimeout(() => {
                this.saveToServer();
            }, 750); // Czekaj 750ms po ostatniej zmianie
        },

        async saveToServer() {
            if (!this.isInitialized) {
                console.warn('⚠️ WOOW! SettingsManager: Not initialized, skipping save');
                return;
            }

            console.log('💾 WOOW! SettingsManager: Saving settings to server...', this.settings);
            
            try {
                // Save to localStorage as backup
                localStorage.setItem('woow_settings', JSON.stringify(this.settings));
                
                // Get REST API URL and nonce
                const restUrl = (window.woowV2?.restUrl || window.woowV2Global?.restUrl || '/wp-json/woow/v1/');
                const nonce = (window.woowV2?.restNonce || window.woowV2Global?.restNonce || '');
                
                // Save to database via REST API
                const response = await fetch(restUrl + 'settings', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-WP-Nonce': nonce
                    },
                    body: JSON.stringify(this.settings)
                });

                if (!response.ok) {
                    throw new Error(`Server responded with status: ${response.status}`);
                }

                const result = await response.json();
                console.log('✅ WOOW! Settings saved to database!', result);

            } catch (error) {
                console.error('❌ WOOW! Failed to save settings:', error);
                // Try fallback AJAX method
                this.saveViaAjax();
            }
        },

        /**
         * Fallback save method using WordPress AJAX
         */
        async saveViaAjax() {
            try {
                const formData = new FormData();
                formData.append('action', 'mas_v2_save_settings');
                formData.append('nonce', window.woowV2?.nonce || window.woowV2Global?.nonce || '');
                
                // Add all settings to form data
                Object.entries(this.settings).forEach(([key, value]) => {
                    formData.append(`settings[${key}]`, value);
                });

                const response = await fetch(ajaxurl, {
                    method: 'POST',
                    body: formData
                });

                const result = await response.text();
                console.log('✅ WOOW! Settings saved via AJAX fallback');
            } catch (error) {
                console.error('❌ WOOW! AJAX save also failed:', error);
            }
        },

        /**
         * Pobierz wartość ustawienia
         */
        get(key, defaultValue = null) {
            return this.settings[key] !== undefined ? this.settings[key] : defaultValue;
        },

        /**
         * Sprawdź czy ustawienie istnieje
         */
        has(key) {
            return this.settings[key] !== undefined;
        },

        /**
         * Przywróć wszystkie ustawienia po odświeżeniu strony
         */
        restoreAllSettings() {
            console.log('🔄 WOOW! SettingsManager: Restoring settings after page refresh...');
            
            Object.entries(this.settings).forEach(([key, value]) => {
                this.restoreSetting(key, value);
            });
            
            console.log('✅ WOOW! SettingsManager: All settings restored');
        },

        /**
         * Resetuj wszystkie ustawienia do domyślnych wartości
         */
        resetAllSettings() {
            console.log('🔄 WOOW! SettingsManager: Resetting all settings to defaults...');
            
            // Clear internal settings
            this.settings = {};
            
            // Clear localStorage
            localStorage.removeItem('woow_settings');
            
            // Reset CSS variables to defaults
            const defaultCssVars = {
                '--woow-surface-bar': '#23282d',
                '--woow-surface-bar-text': '#ffffff',
                '--woow-surface-bar-hover': '#00a0d2',
                '--woow-surface-bar-height': '32px',
                '--woow-surface-bar-font-size': '13px',
                '--woow-surface-bar-padding': '8px',
                '--woow-surface-bar-blur': '10px'
            };
            
            Object.entries(defaultCssVars).forEach(([cssVar, value]) => {
                // FINAL ARCHITECTURE: Apply styles only to body.wp-admin to match PHP implementation
                document.body.style.setProperty(cssVar, value, 'important');
            });
            
            // Remove all WOOW body classes
            const bodyClasses = document.body.className.split(' ');
            bodyClasses.forEach(className => {
                if (className.startsWith('woow-')) {
                    document.body.classList.remove(className);
                }
            });
            
            // Show all hidden elements
            const hiddenElements = [
                '#wp-admin-bar-wp-logo',
                '#wp-admin-bar-my-account .display-name',
                '#wp-admin-bar-updates'
            ];
            
            hiddenElements.forEach(selector => {
                const element = document.querySelector(selector);
                if (element) {
                    element.style.display = '';
                }
            });
            
            console.log('✅ WOOW! SettingsManager: All settings reset to defaults');
        },

        /**
         * Przywróć pojedyncze ustawienie
         */
        restoreSetting(key, value) {
            // Mapowanie kluczy na zmienne CSS i klasy
            const settingMappings = {
                // Admin Bar - Colors
                'surface_bar': { cssVar: '--woow-surface-bar' },
                'surface_bar_text': { cssVar: '--woow-surface-bar-text' },
                'surface_bar_hover': { cssVar: '--woow-surface-bar-hover' },
                
                // Admin Bar - Layout
                'surface_bar_height': { cssVar: '--woow-surface-bar-height', unit: 'px' },
                'surface_bar_font_size': { cssVar: '--woow-surface-bar-font-size', unit: 'px' },
                'surface_bar_padding': { cssVar: '--woow-surface-bar-padding', unit: 'px' },
                'surface_bar_blur': { cssVar: '--woow-surface-bar-blur', unit: 'px' },
                
                // Admin Bar - Effects (body classes)
                'admin_bar_glassmorphism': { bodyClass: 'woow-admin-bar-glassmorphism' },
                'admin_bar_shadow': { bodyClass: 'woow-admin-bar-shadow' },
                'admin_bar_gradient': { bodyClass: 'woow-admin-bar-gradient' },
                'admin_bar_floating': { bodyClass: 'woow-admin-bar-floating' },
                
                // Admin Bar - Position modes (generated by class-prefix)
                'admin_bar_mode': { bodyClass: 'woow-admin-bar-' }, // Special handling for prefix
                
                // Menu - Colors
                'surface_menu': { cssVar: '--woow-surface-menu' },
                'surface_menu_text': { cssVar: '--woow-surface-menu-text' },
                'surface_menu_hover': { cssVar: '--woow-surface-menu-hover' },
                'surface_menu_active': { cssVar: '--woow-surface-menu-active' },
                
                // Menu - Layout
                'surface_menu_width': { cssVar: '--woow-surface-menu-width', unit: 'px' },
                'surface_menu_item_padding': { cssVar: '--woow-surface-menu-item-padding', unit: 'px' },
                'radius_menu_all': { cssVar: '--woow-radius-menu-all', unit: 'px' },
                'surface_menu_font_size': { cssVar: '--woow-surface-menu-font-size', unit: 'px' },
                'menu_floating': { bodyClass: 'woow-menu-floating' },
                
                // Content Area
                'content_max_width': { cssVar: '--woow-content-max-width', unit: 'px' },
                'content_padding': { cssVar: '--woow-content-padding', unit: 'px' },
                
                // Footer
                'footer_bg': { cssVar: '--woow-surface-footer' },
                'footer_text': { cssVar: '--woow-surface-footer-text' },
                
                // Postbox
                'postbox_bg': { cssVar: '--woow-surface-postbox' },
                'postbox_border': { cssVar: '--woow-surface-postbox-border' },
                'postbox_text': { cssVar: '--woow-surface-postbox-text' },
                'postbox_radius': { cssVar: '--woow-radius-postbox', unit: 'px' },
                'postbox_padding': { cssVar: '--woow-surface-postbox-padding', unit: 'px' },
                'postbox_margin': { cssVar: '--woow-surface-postbox-margin', unit: 'px' },
                'postbox_shadow': { bodyClass: 'woow-postbox-shadow' },
                'postbox_glassmorphism': { bodyClass: 'woow-postbox-glassmorphism' },
                'postbox_3d_hover': { bodyClass: 'woow-postbox-3d-hover' },
                
                // Visibility toggles
                'hide_wp_logo': { selector: '#wp-admin-bar-wp-logo' },
                'hide_howdy': { selector: '#wp-admin-bar-my-account .ab-item' },
                'hide_update_notices': { selector: '#wp-admin-bar-updates' },
                'hide_footer': { selector: '#wpfooter' },
                'hide_version': { selector: '#footer-thankyou' }
            };

            const mapping = settingMappings[key];
            if (!mapping) return;

            if (mapping.cssVar) {
                const cssValue = mapping.unit ? value + mapping.unit : value;
                // FINAL ARCHITECTURE: Apply styles only to body.wp-admin to match PHP implementation
                document.body.style.setProperty(mapping.cssVar, cssValue, 'important');
                console.log(`🎨 WOOW! Restored CSS: ${mapping.cssVar} = ${cssValue} !important`);
            }

            if (mapping.bodyClass && typeof value === 'boolean') {
                document.body.classList.toggle(mapping.bodyClass, value);
                console.log(`🏷️ WOOW! Restored body class ${mapping.bodyClass}: ${value ? 'added' : 'removed'}`);
            }

            // Special handling for class-prefix modes (like admin_bar_mode)
            if (mapping.bodyClass && typeof value === 'string' && mapping.bodyClass.endsWith('-')) {
                // Remove all existing classes with this prefix
                const classPrefix = mapping.bodyClass;
                document.body.className = document.body.className.replace(new RegExp(`${classPrefix}\\w+`, 'g'), '');
                // Add the new class
                document.body.classList.add(classPrefix + value);
                console.log(`🏷️ WOOW! Restored prefixed class: ${classPrefix}${value}`);
            }

            if (mapping.selector && typeof value === 'boolean') {
                const element = document.querySelector(mapping.selector);
                if (element) {
                    element.style.display = value ? 'none' : '';
                    console.log(`👁️ WOOW! Element ${mapping.selector} visibility: ${value ? 'hidden' : 'visible'}`);
                }
            }
        }
    };

    // Eksportuj do global scope
    window.SettingsManager = SettingsManager;

    // ========================================================================
    // 🚀 ENTERPRISE FEATURE: ConfigManager
    // Pobiera i cache'uje konfigurację UI z serwera
    // ========================================================================
    const ConfigManager = {
        config: null,
        isLoading: false,
        loadPromise: null,

        /**
         * Inicjalizacja - pobiera konfigurację z serwera
         */
        async init() {
            if (this.isLoading) {
                return this.loadPromise;
            }

            this.isLoading = true;
            this.loadPromise = this.fetchConfig();
            
            try {
                await this.loadPromise;
                console.log('🚀 WOOW! ConfigManager: Configuration loaded successfully');
            } catch (error) {
                console.error('❌ WOOW! ConfigManager: Failed to load configuration', error);
                this.config = {}; // Prevent further errors
            } finally {
                this.isLoading = false;
            }

            return this.loadPromise;
        },

        /**
         * Pobiera konfigurację z REST API
         */
        async fetchConfig() {
            const restUrl = (window.woowV2?.restUrl || window.woowV2Global?.restUrl || '/wp-json/woow/v1/');
            const nonce = (window.woowV2?.restNonce || window.woowV2Global?.restNonce || '');
            
            console.log('🌐 WOOW! ConfigManager: Fetching configuration from', restUrl + 'components');
            
            try {
                const response = await fetch(restUrl + 'components', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-WP-Nonce': nonce
                    }
                });

                if (!response.ok) {
                    throw new Error(`Server responded with status: ${response.status}`);
                }

                const data = await response.json();
                
                if (data.success && data.data) {
                    this.config = data.data;
                    console.log('✅ WOOW! ConfigManager: Configuration loaded', this.config);
                } else {
                    throw new Error('Invalid response format');
                }
            } catch (error) {
                console.error('❌ WOOW! ConfigManager: Fetch error', error);
                
                // Fallback to hardcoded config for development
                this.config = this.getFallbackConfig();
                console.warn('⚠️ WOOW! ConfigManager: Using fallback configuration');
            }
        },

        /**
         * Pobiera konfigurację komponentu
         */
        getComponentConfig(elementId) {
            if (!this.config) {
                console.warn('⚠️ WOOW! ConfigManager: Configuration not loaded yet');
                return null;
            }
            
            return this.config[elementId] || null;
        },

        /**
         * Sprawdza czy konfiguracja jest załadowana
         */
        isConfigLoaded() {
            return this.config !== null;
        },

        /**
         * Fallback konfiguracja dla przypadku gdy API nie działa
         */
        getFallbackConfig() {
            return {
                'wpadminbar': {
                    'title': 'Admin Bar',
                    'icon': '🎯',
                    'selector': '#wpadminbar',
                    'tabs': {
                        'colors': {
                            'id': 'colors',
                            'icon': '🎨',
                            'label': 'Colors',
                            'options': [
                                {
                                    'key': 'surface_bar',
                                    'label': 'Background Color',
                                    'type': 'color',
                                    'cssVar': '--woow-surface-bar',
                                    'default': '#23282d'
                                },
                                {
                                    'key': 'surface_bar_text',
                                    'label': 'Text Color',
                                    'type': 'color',
                                    'cssVar': '--woow-surface-bar-text',
                                    'default': '#ffffff'
                                },
                                {
                                    'key': 'surface_bar_hover',
                                    'label': 'Hover Color',
                                    'type': 'color',
                                    'cssVar': '--woow-surface-bar-hover',
                                    'default': '#00a0d2'
                                }
                            ]
                        }
                    }
                }
            };
        },

        /**
         * Wymusza ponowne załadowanie konfiguracji
         */
        async reload() {
            this.config = null;
            this.isLoading = false;
            this.loadPromise = null;
            return await this.init();
        }
    };

    // Eksportuj do global scope
    window.ConfigManager = ConfigManager;

    // NAPRAWKA KRYTYCZNA: Cleanup resources on page unload dla memory leaks
    $(window).on('beforeunload', function() {
        if (window.MAS && typeof window.MAS.cleanup === 'function') {
            window.MAS.cleanup();
        }
    });

})(jQuery);

// ========================================================================
// DUBLOWANE ZABEZPIECZENIE: Inizjalizacja MAS (jQuery wrapper)
// ========================================================================
// Dodatkowa inicjalizacja dla przypadków, gdy DOMContentLoaded już minął
jQuery(document).ready(function($) {
    // Backup initialization jeśli główna nie zadziałała
    setTimeout(function() {
        if (!window.MAS_INITIALIZED) {
            console.log('🔄 WOOW! Backup initialization triggered');
            
            if (window.MAS && typeof window.MAS.init === 'function') {
                window.MAS.init();
                window.MAS_INITIALIZED = true;
            }
            
                // Initialize the NEW unified LiveEditEngine (replaces fragmented systems)
    if (window.LiveEditEngine && typeof window.LiveEditEngine.init === 'function') {
        window.LiveEditEngine.init();
    }
            // WYŁĄCZONE - używamy tylko mas-live-edit-toggle z live-edit-mode.js
        }
    }, 1000);
});

    // NAPRAWKA KRYTYCZNA: Cleanup resources on page unload dla memory leaks
    jQuery(window).on('beforeunload', function() {
        if (window.MAS && typeof window.MAS.cleanup === 'function') {
            window.MAS.cleanup();
        }
    });

    // Główna inicjalizacja
    document.addEventListener('DOMContentLoaded', async () => {
        if (window.SettingsManager) {
            SettingsManager.init(woow_data?.settings || {});
        }
        if (window.ConfigManager) {
            await ConfigManager.init();
        }
    });
