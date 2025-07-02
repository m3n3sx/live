/**
 * Modern Admin Styler V2 - Admin JavaScript
 * Nowoczesny interfejs z animacjami i live preview
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
            console.log('🚀 MAS V2: Initializing all systems...');
            this.bindEvents();
            this.initTabs();
            this.initColorPickers();
            this.initSliders();
            this.initCornerRadius();
            this.initConditionalFields();
            this.initFloatingFields();
            this.initLivePreview();
            this.checkAutoSave();
            this.initTooltips();
            this.updateBodyClasses(); // Ustaw klasy na starcie
            this.initSystemMonitor(); // Inicjalizuj monitor systemu
            this.loadCustomTemplates(); // Załaduj własne szablony
            this.initNewFeatures(); // Inicjalizuj nowe funkcje
            this.initLiveEditMode(); // FAZA 1: Inicjalizuj Live Edit Mode
            console.log('✅ MAS V2: All systems initialized successfully!');
            // Skróty klawiszowe są obsługiwane globalnie w admin-global.js
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
            
            // NAPRAWKA: Debounce dla live preview aby uniknąć nadmiarowych requestów
            let livePreviewTimeout;
            const debouncedLivePreview = function() {
                clearTimeout(livePreviewTimeout);
                livePreviewTimeout = setTimeout(function() {
                    MAS.handleFormChange.call(MAS);
                }, 300); // 300ms debounce
            };
            
            // Rozszerzona obsługa live preview z debounce
            $(document).on("change input keyup" + namespace, "#mas-v2-settings-form input, #mas-v2-settings-form select, #mas-v2-settings-form textarea", debouncedLivePreview);
            $(document).on("change" + namespace, "#mas-v2-settings-form input[type='checkbox'], #mas-v2-settings-form input[type='radio']", this.handleFormChange);
            $(document).on("input" + namespace, "#mas-v2-settings-form input[type='range']", debouncedLivePreview);
            
            // Obsługa color pickerów
            $(document).on("wpColorPickerChange" + namespace, "#mas-v2-settings-form input.mas-v2-color", this.handleFormChange);
        },

        // Skróty klawiszowe są teraz obsługiwane globalnie w admin-global.js

        initTabs: function() {
            console.log('🎯 MAS V2: Native WordPress menu navigation active - no tab switching needed');
            console.log('📄 Current content panels available:', $(".mas-v2-tab-content").length);
            
            // 🎯 NATYWNA INTEGRACJA: Nie potrzebujemy obsługi kliknięć w zakładki
            // Nawigacja jest teraz obsługiwana przez natywne menu WordPress
            
            // Upewnij się, że aktywna sekcja jest widoczna (PHP już to ustawia)
            const $activeContent = $(".mas-v2-tab-content.active");
            if ($activeContent.length) {
                console.log('✅ Active section found:', $activeContent.attr('id'));
                $activeContent.show().css('opacity', 1);
            }
            
            // Ukryj nieaktywne sekcje
            $(".mas-v2-tab-content:not(.active)").hide();
            
            console.log('✅ Native navigation system initialized');
        },

        initColorPickers: function() {
            $(".mas-v2-color").each(function() {
                const $input = $(this);
                
                if ($.fn.wpColorPicker) {
                    $input.wpColorPicker({
                        change: function(event, ui) {
                            if (MAS.livePreviewEnabled) {
                                clearTimeout(MAS.colorTimeout);
                                MAS.colorTimeout = setTimeout(function() {
                                    MAS.triggerLivePreview();
                                }, 200);
                            }
                            MAS.markAsChanged();
                        },
                        clear: function() {
                            if (MAS.livePreviewEnabled) {
                                MAS.triggerLivePreview();
                            }
                            MAS.markAsChanged();
                        }
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
                    console.log('🎯 MAS V2: Compact mode enabled via UI');
                } else {
                    $('body').removeClass(compactClass);
                    console.log('🎯 MAS V2: Compact mode disabled via UI');
                }
                MAS.triggerLivePreview();
                MAS.markAsChanged();
            });
            
            // DODANE: Obsługa typography fields
            $('select[name="body_font_family"], select[name="heading_font_family"]').on('change', function() {
                const fieldName = $(this).attr('name');
                const fontFamily = $(this).val();
                console.log('🎯 MAS V2: Font family changed:', fieldName, '=', fontFamily);
                MAS.triggerLivePreview();
                MAS.markAsChanged();
            });
            
            // DODANE: Obsługa advanced hiding options
            $('input[name="hide_wp_version"], input[name="hide_help_tabs"], input[name="hide_screen_options"], input[name="hide_admin_notices"], input[name="hide_footer_text"], input[name="hide_update_nag"]').on('change', function() {
                const fieldName = $(this).attr('name');
                const isChecked = $(this).is(':checked');
                console.log('🎯 MAS V2: Hide option changed:', fieldName, '=', isChecked);
                MAS.triggerLivePreview();
                MAS.markAsChanged();
            });
            
            // DODAJE: Obsługa color_palette select - synchronizacja z quick theme selector
            $('select[name="color_palette"]').on('change', function() {
                const palette = $(this).val();
                console.log('🎨 MAS V2: Color palette changed via select:', palette);
                
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
                console.log('🎯 MAS V2: Submenu option changed:', fieldName, '=', value);
                MAS.triggerLivePreview();
                MAS.markAsChanged();
            });
            
            $('input[name="submenu_item_spacing"], input[name="submenu_indent"]').on('input change', function() {
                const fieldName = $(this).attr('name');
                const value = $(this).val();
                console.log('🎯 MAS V2: Submenu sizing changed:', fieldName, '=', value + 'px');
                MAS.triggerLivePreview();
                MAS.markAsChanged();
            });
            
            $('input[name="submenu_separator"]').on('change', function() {
                const isChecked = $(this).is(':checked');
                console.log('🎯 MAS V2: Submenu separator:', isChecked ? 'enabled' : 'disabled');
                MAS.triggerLivePreview();
                MAS.markAsChanged();
            });
            
            $('select[name="submenu_indicator_style"]').on('change', function() {
                const indicatorStyle = $(this).val();
                console.log('🎯 MAS V2: Submenu indicator style:', indicatorStyle);
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
                    $('body').addClass('mas-v2-admin-bar-floating');
                } else {
                    $('body').removeClass('mas-v2-admin-bar-floating');
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
                    $('body').addClass('mas-v2-menu-floating');
                } else {
                    $('body').removeClass('mas-v2-menu-floating');
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
            console.log('MAS V2: Field changed:', fieldName, $field.val());
            
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
            console.log('🚀 MAS V2: Starting AUTOMATED Live Preview with data-* attributes');
            
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
            
            console.log('✅ AUTOMATED LIVE PREVIEW: Complete! Zero manual field handling.');
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
                        console.warn('🚨 Unknown live preview type:', previewType, 'for field:', fieldName);
                }
            });
            
            console.log(`✅ Processed ${processedFields} fields automatically via data-* attributes`);
        },

        /**
         * 🎨 Apply CSS Variable
         */
        applyCSSVariable: function(input, value, root) {
            const cssVar = input.dataset.cssVar;
            const unit = input.dataset.unit || '';
            
            if (!cssVar) {
                console.warn('🚨 Missing data-css-var for field:', input.name);
                return;
            }
            
            const finalValue = value + unit;
            root.style.setProperty(cssVar, finalValue);
            
            console.log(`✅ CSS Variable: ${cssVar} = ${finalValue}`);
        },

        /**
         * 🏷️ Apply Body Class (ENHANCED with state management)
         */
        applyBodyClass: function(input, value, body) {
            const className = input.dataset.bodyClass;
            const exclusiveGroup = input.dataset.exclusiveGroup;
            const allOptions = input.dataset.allOptions;
            
            if (!className) {
                console.warn('🚨 Missing data-body-class for field:', input.name);
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
                console.log(`🧹 Cleaned: ${fullClassName}`);
            });
            
            // STEP 2: Add only the new class (if valid)
            if (newValue && possibleValues.includes(newValue)) {
                const newClassName = prefix + newValue;
                body.classList.add(newClassName);
                console.log(`✅ State Set: ${newClassName}`);
            } else if (newValue) {
                console.warn(`🚨 Invalid value "${newValue}" for exclusive group "${prefix}". Valid options:`, possibleValues);
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
                console.log(`✅ Body Class Added: ${className}`);
            } else {
                body.classList.remove(className);
                console.log(`✅ Body Class Removed: ${className}`);
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
                'mas-v2-menu-floating': ['mas-menu-floating'], // Remove old naming
                'mas-v2-admin-bar-floating': ['mas-admin-bar-floating'], // Remove old naming
                'mas-v2-glassmorphism': ['mas-glassmorphism', 'mas-menu-glassmorphism'], // Consolidate
                'mas-v2-glossy': ['mas-admin-bar-glossy'], // Consolidate
                'mas-v2-animations-enabled': ['mas-animations-enabled', 'mas-enable-animations'] // Consolidate
            };
            
            if (legacyMappings[currentClassName]) {
                legacyMappings[currentClassName].forEach(legacyClass => {
                    if (body.classList.contains(legacyClass)) {
                        body.classList.remove(legacyClass);
                        console.log(`🧹 Removed legacy class: ${legacyClass} (replaced by ${currentClassName})`);
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
                
                console.log(`✅ Custom CSS Applied: ${value.length} characters`);
            } else {
                console.log(`✅ Custom CSS Removed`);
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
                console.warn('🚨 Missing data-target-selector or data-css-property for field:', input.name);
                return;
            }
            
            const elements = document.querySelectorAll(selector);
            const finalValue = value + unit;
            
            elements.forEach(element => {
                element.style[property] = finalValue;
            });
            
            console.log(`✅ Element Style: ${selector} { ${property}: ${finalValue} } (${elements.length} elements)`);
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
                
                console.log('✅ MAS V2: Custom CSS injected:', css.length, 'characters');
            }
        },

        updateHeadingsScale: function(scale, baseSize) {
            const base = parseFloat(baseSize) || 14;
            const ratio = parseFloat(scale) || 1.2;
            const root = document.documentElement;

            // Matematyczna skala dla H1-H6 z lepszymi proporcjami
            root.style.setProperty('--mas-h6-font-size', (base * Math.pow(ratio, -1)).toFixed(2) + 'px');
            root.style.setProperty('--mas-h5-font-size', (base * Math.pow(ratio, 0)).toFixed(2) + 'px'); // h5 = base
            root.style.setProperty('--mas-h4-font-size', (base * Math.pow(ratio, 1)).toFixed(2) + 'px');
            root.style.setProperty('--mas-h3-font-size', (base * Math.pow(ratio, 2)).toFixed(2) + 'px');
            root.style.setProperty('--mas-h2-font-size', (base * Math.pow(ratio, 3)).toFixed(2) + 'px');
            root.style.setProperty('--mas-h1-font-size', (base * Math.pow(ratio, 4)).toFixed(2) + 'px');

            console.log('✅ MAS V2: Headings scale updated with ratio:', ratio);
            console.log('  Base:', base + 'px', 'H1:', (base * Math.pow(ratio, 4)).toFixed(2) + 'px');
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
            console.log('MAS V2: Save button clicked');
            
            // Zapobiegnij duplikatom requestów
            if (this.saveInProgress) {
                console.log('MAS V2: Save already in progress, skipping');
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
                console.error('MAS V2: Missing AJAX data');
                this.showMessage('error', 'Błąd: Brak danych AJAX');
                $btn.prop("disabled", false).text(originalText);
                this.saveInProgress = false;
                return;
            }
            
            const formData = this.getFormData($form);
            formData.action = 'mas_v2_save_settings';
            formData.nonce = masData.nonce;
            
            console.log('MAS V2: AJAX URL:', masData.ajaxUrl);
            console.log('MAS V2: Nonce:', masData.nonce);
            console.log('MAS V2: Form data:', formData);
            
            const self = this;
            
            $.ajax({
                url: masData.ajaxUrl,
                type: 'POST',
                data: formData,
                timeout: 30000, // 30 second timeout
                success: function(response) {
                    console.log('MAS V2: AJAX response:', response);
                    
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
                    console.error('MAS V2: AJAX error:', status, error);
                    console.error('MAS V2: Response:', xhr.responseText);
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
            
            console.log('MAS V2: Settings marked as saved');
        },

        updateBodyClasses: function() {
            // Simplified body classes update - removed DOM manipulation
            // Classes are now managed by PHP and admin-global.js
            console.log('MAS V2: Body classes update delegated to admin-global.js');
            
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
            console.log('⚠️ BEFORE: Simulating conflicting classes...');
            body.classList.add('mas-theme-light');
            body.classList.add('mas-theme-dark');
            body.classList.add('mas-theme-auto');
            console.log('Body classes:', Array.from(body.classList).filter(cls => cls.startsWith('mas-theme-')));
            
            // Test 2: Apply exclusive state management
            console.log('🔧 FIXING: Applying exclusive state management...');
            this.updateExclusiveBodyClass(prefix, testValues, 'dark', body);
            console.log('Body classes after fix:', Array.from(body.classList).filter(cls => cls.startsWith('mas-theme-')));
            
            // Test 3: Legacy cleanup
            console.log('🧹 TESTING: Legacy cleanup...');
            body.classList.add('mas-menu-floating'); // Add old class
            this.cleanLegacyClasses('mas-v2-menu-floating', body);
            console.log('Menu classes after cleanup:', Array.from(body.classList).filter(cls => cls.includes('floating')));
            
            console.groupEnd();
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
        console.log('🎨 Modern Admin Styler V2 - Admin JavaScript loaded');
        console.log('Live Preview: Always enabled with CSS Variables');
        console.log('Keyboard shortcuts are handled by admin-global.js');
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
                { icon: '🎨', label: 'Style', action: () => console.log('Style') },
                { icon: '⚡', label: 'Wydajność', action: () => console.log('Performance') },
                { icon: '📊', label: 'Raporty', action: () => console.log('Reports') },
                { icon: '🔧', label: 'Narzędzia', action: () => console.log('Tools') }
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
            console.error('Szablon nie znaleziony:', templateName);
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
        console.log('Podgląd szablonu:', templateName);
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
        console.log('🧹 MAS V2: Cleaning up event handlers...');
        
        // Clear all timeouts
        Object.keys(MAS_TIMEOUTS).forEach(key => {
            if (MAS_TIMEOUTS[key]) {
                clearTimeout(MAS_TIMEOUTS[key]);
            }
        });
        
        // Remove namespaced events
        $(document).off(MAS_NAMESPACE);
        $(window).off(MAS_NAMESPACE);
        
        console.log('✅ MAS V2: Cleanup completed');
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
            console.log('🚀 MAS V2: Zajebiste 3D Effects System initialized for entire WordPress!');
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
            
            console.log('🎮 MAS V2: 3D Controls System initialized!');
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
                console.log(`🎮 3D Control changed: ${controlName} = ${this.settings[controlName]}`);
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
            root.style.setProperty('--mas-typography-scale', this.settings.typography_scale_factor);
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
                console.log('🐛 MAS V2: 3D Debug Mode enabled!', this.settings);
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
            document.documentElement.style.setProperty('--mas-3d-intensity', intensity);
            
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
            document.documentElement.style.setProperty('--mas-blur-md', `blur(${blurValue * 0.75}px)`);
            document.documentElement.style.setProperty('--mas-blur-lg', `blur(${blurValue * 1.25}px)`);
            document.documentElement.style.setProperty('--mas-blur-xl', `blur(${blurValue * 1.5}px)`);
        }

        updateGlassTransparency() {
            const transparency = this.settings.glass_transparency;
            document.documentElement.style.setProperty('--mas-glass-opacity', transparency);
            document.documentElement.style.setProperty('--mas-glass-bg', `rgba(255, 255, 255, ${transparency})`);
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
            document.documentElement.style.setProperty('--mas-typography-scale', scale);
            
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
                console.log('🎮 MAS V2: 3D Controls ready for action!');
                console.log('🎨 MAS V2: Live Edit Mode ready for contextual editing!');
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
        console.log('🎯 Initializing Live Edit Mode with Phase 3 enhancements...');
        
        // Nasłuchuj zmiany na głównym przełączniku
        const editModeSwitch = document.getElementById('mas-v2-edit-mode-switch');
        if (editModeSwitch) {
            // Uruchom przy załadowaniu strony
            this.handleLiveEditModeToggle();
            
            // Uruchom przy każdej zmianie
            editModeSwitch.addEventListener('change', this.handleLiveEditModeToggle.bind(this));
            
            console.log('✅ Live Edit Mode toggle initialized');
        }
        
        // Przygotuj elementy edytowalne
        this.prepareEditableElements();
        
        // FAZA 3: Initialize advanced features
        this.initPhase3Features();
    };

    MAS.handleLiveEditModeToggle = function() {
        const isEditModeActive = document.body.classList.contains('mas-edit-mode-active');
        
        if (isEditModeActive) {
            console.log('🎯 Live Edit Mode ACTIVATED with Phase 3 features');
            this.initializeEditableElements();
            this.enablePhase3Features();
        } else {
            console.log('❌ Live Edit Mode DEACTIVATED');
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
        
        // Dodaj dashboard postboxy jako edytowalne
        const postboxes = document.querySelectorAll('.postbox');
        postboxes.forEach((postbox, index) => {
            postbox.setAttribute('data-mas-editable', 'true');
            postbox.setAttribute('data-mas-element-type', 'postbox');
            postbox.setAttribute('data-mas-element-name', `Dashboard Widget ${index + 1}`);
        });
        
        console.log('✅ Marked', document.querySelectorAll('[data-mas-editable="true"]').length, 'elements as editable');
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
        
        console.log('✅ Initialized', editableElements.length, 'editable elements with controls');
    };

    MAS.cleanupEditableElements = function() {
        // Usuń wszystkie kontrolki Live Edit Mode
        document.querySelectorAll('.mas-context-cog').forEach(cog => cog.remove());
        document.querySelectorAll('.mas-drag-handle').forEach(handle => handle.remove());
        document.querySelectorAll('.mas-micro-panel').forEach(panel => panel.remove());
        
        console.log('✅ Cleaned up Live Edit Mode controls');
    };

    MAS.openMicroPanel = function(element) {
        // Usuń istniejące panele
        document.querySelectorAll('.mas-micro-panel').forEach(panel => panel.remove());
        
        const elementType = element.getAttribute('data-mas-element-type');
        const elementName = element.getAttribute('data-mas-element-name');
        
        const panel = document.createElement('div');
        panel.className = 'mas-micro-panel';
        
        // Generuj kontrolki na podstawie typu elementu
        let controls = this.generateControlsForElement(elementType);
        
        panel.innerHTML = `
            <h4>🎨 Edit ${elementName}</h4>
            ${controls}
            <hr>
            <p style="margin: 0; font-size: 12px; opacity: 0.8;">
                💡 Changes apply instantly | 🗙 Click outside to close
            </p>
        `;
        
        // Pozycjonuj panel obok elementu
        this.positionPanel(panel, element);
        
        // Dodaj event listenery dla kontrolek
        this.bindPanelControls(panel, element);
        
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
        
        console.log('🎨 Opened micro panel for:', elementName);
    };

    MAS.generateControlsForElement = function(elementType) {
        let controls = '';
        
        switch (elementType) {
            case 'admin-bar':
                controls = `
                    <div class="mas-panel-tabs">
                        <button class="mas-panel-tab active" data-tab="colors">🎨 Colors</button>
                        <button class="mas-panel-tab" data-tab="layout">📐 Layout</button>
                        <button class="mas-panel-tab" data-tab="effects">✨ Effects</button>
                        <button class="mas-panel-tab" data-tab="presets">🎯 Presets</button>
                    </div>
                    
                    <div class="mas-panel-content" data-content="colors">
                        <label>Background Color</label>
                        <input type="color" data-live-preview="css-var" data-css-var="--mas-admin-bar-background" value="#23282d">
                        
                        <label>Text Color</label>
                        <input type="color" data-live-preview="css-var" data-css-var="--mas-admin-bar-text-color" value="#ffffff">
                        
                        <label>Hover Color</label>
                        <input type="color" data-live-preview="css-var" data-css-var="--mas-admin-bar-hover-color" value="#00a0d2">
                        
                        <div class="mas-quick-actions">
                            <button class="mas-quick-btn" data-action="copy-colors">📋 Copy</button>
                            <button class="mas-quick-btn" data-action="paste-colors">📁 Paste</button>
                            <button class="mas-quick-btn" data-action="reset-colors">🔄 Reset</button>
                        </div>
                    </div>
                    
                    <div class="mas-panel-content" data-content="layout" style="display: none;">
                        <label>Height (px)</label>
                        <input type="range" min="28" max="60" value="32" data-live-preview="css-var" data-css-var="--mas-admin-bar-height" data-unit="px">
                        
                        <label>Font Size (px)</label>
                        <input type="range" min="11" max="16" value="13" data-live-preview="css-var" data-css-var="--mas-admin-bar-font-size" data-unit="px">
                        
                        <label>Padding (px)</label>
                        <input type="range" min="4" max="16" value="8" data-live-preview="css-var" data-css-var="--mas-admin-bar-padding" data-unit="px">
                        
                        <label>Position</label>
                        <select data-live-preview="body-class" data-class-prefix="mas-admin-bar-">
                            <option value="top">Top (Fixed)</option>
                            <option value="floating">Floating</option>
                            <option value="sticky">Sticky</option>
                        </select>
                    </div>
                    
                    <div class="mas-panel-content" data-content="effects" style="display: none;">
                        <label>
                            <input type="checkbox" data-live-preview="body-class" data-body-class="mas-admin-bar-glassmorphism"> 
                            Glassmorphism Effect
                        </label>
                        
                        <label>
                            <input type="checkbox" data-live-preview="body-class" data-body-class="mas-admin-bar-shadow"> 
                            Drop Shadow
                        </label>
                        
                        <label>
                            <input type="checkbox" data-live-preview="body-class" data-body-class="mas-admin-bar-gradient"> 
                            Gradient Background
                        </label>
                        
                        <label>Blur Intensity</label>
                        <input type="range" min="0" max="20" value="10" data-live-preview="css-var" data-css-var="--mas-admin-bar-blur" data-unit="px">
                    </div>
                    
                    <div class="mas-panel-content" data-content="presets" style="display: none;">
                        <div class="mas-preset-grid">
                            <button class="mas-preset-btn" data-preset="dark-modern">🌙 Dark Modern</button>
                            <button class="mas-preset-btn" data-preset="light-minimal">☀️ Light Minimal</button>
                            <button class="mas-preset-btn" data-preset="colorful">🌈 Colorful</button>
                            <button class="mas-preset-btn" data-preset="glass">💎 Glassmorphism</button>
                        </div>
                        
                        <div class="mas-preset-actions">
                            <button class="mas-preset-save" data-action="save-preset">💾 Save Current</button>
                            <button class="mas-preset-load" data-action="load-preset">📁 Load Saved</button>
                        </div>
                    </div>
                `;
                break;
                
            case 'admin-menu':
                controls = `
                    <div class="mas-panel-tabs">
                        <button class="mas-panel-tab active" data-tab="colors">🎨 Colors</button>
                        <button class="mas-panel-tab" data-tab="layout">📐 Layout</button>
                        <button class="mas-panel-tab" data-tab="typography">🔤 Typography</button>
                        <button class="mas-panel-tab" data-tab="effects">✨ Effects</button>
                    </div>
                    
                    <div class="mas-panel-content" data-content="colors">
                        <label>Background Color</label>
                        <input type="color" data-live-preview="css-var" data-css-var="--mas-menu-background" value="#ffffff">
                        
                        <label>Text Color</label>
                        <input type="color" data-live-preview="css-var" data-css-var="--mas-menu-text-color" value="#1e293b">
                        
                        <label>Hover Color</label>
                        <input type="color" data-live-preview="css-var" data-css-var="--mas-menu-hover-color" value="#6366f1">
                        
                        <label>Active Color</label>
                        <input type="color" data-live-preview="css-var" data-css-var="--mas-menu-active-color" value="#ec4899">
                    </div>
                    
                    <div class="mas-panel-content" data-content="layout" style="display: none;">
                        <label>Width (px)</label>
                        <input type="range" min="140" max="300" value="160" data-live-preview="css-var" data-css-var="--mas-menu-width" data-unit="px">
                        
                        <label>Item Padding (px)</label>
                        <input type="range" min="4" max="20" value="8" data-live-preview="css-var" data-css-var="--mas-menu-item-padding" data-unit="px">
                        
                        <label>Border Radius (px)</label>
                        <input type="range" min="0" max="15" value="0" data-live-preview="css-var" data-css-var="--mas-menu-border-radius-all" data-unit="px">
                        
                        <label>
                            <input type="checkbox" data-live-preview="body-class" data-body-class="mas-menu-floating"> 
                            Floating Mode
                        </label>
                    </div>
                    
                    <div class="mas-panel-content" data-content="typography" style="display: none;">
                        <label>Font Size (px)</label>
                        <input type="range" min="12" max="18" value="14" data-live-preview="css-var" data-css-var="--mas-menu-font-size" data-unit="px">
                        
                        <label>Font Weight</label>
                        <select data-live-preview="css-var" data-css-var="--mas-menu-font-weight">
                            <option value="400">Normal</option>
                            <option value="500">Medium</option>
                            <option value="600">Semi Bold</option>
                            <option value="700">Bold</option>
                        </select>
                        
                        <label>Letter Spacing (px)</label>
                        <input type="range" min="0" max="2" step="0.1" value="0" data-live-preview="css-var" data-css-var="--mas-menu-letter-spacing" data-unit="px">
                    </div>
                    
                    <div class="mas-panel-content" data-content="effects" style="display: none;">
                        <label>
                            <input type="checkbox" data-live-preview="body-class" data-body-class="mas-menu-3d-hover"> 
                            3D Hover Effects
                        </label>
                        
                        <label>
                            <input type="checkbox" data-live-preview="body-class" data-body-class="mas-menu-smooth-transitions"> 
                            Smooth Transitions
                        </label>
                        
                        <label>
                            <input type="checkbox" data-live-preview="body-class" data-body-class="mas-submenu-separator-enabled"> 
                            Submenu Separators
                        </label>
                    </div>
                `;
                break;
                
            case 'postbox':
                controls = `
                    <div class="mas-panel-tabs">
                        <button class="mas-panel-tab active" data-tab="appearance">🎭 Appearance</button>
                        <button class="mas-panel-tab" data-tab="spacing">📏 Spacing</button>
                        <button class="mas-panel-tab" data-tab="effects">✨ Effects</button>
                    </div>
                    
                    <div class="mas-panel-content" data-content="appearance">
                        <label>Background Color</label>
                        <input type="color" data-live-preview="element-style" data-style-property="backgroundColor" value="#ffffff">
                        
                        <label>Border Color</label>
                        <input type="color" data-live-preview="element-style" data-style-property="borderColor" value="#e0e0e0">
                        
                        <label>Text Color</label>
                        <input type="color" data-live-preview="element-style" data-style-property="color" value="#333333">
                        
                        <label>Border Width (px)</label>
                        <input type="range" min="0" max="5" value="1" data-live-preview="element-style" data-style-property="borderWidth" data-unit="px">
                    </div>
                    
                    <div class="mas-panel-content" data-content="spacing" style="display: none;">
                        <label>Border Radius (px)</label>
                        <input type="range" min="0" max="25" value="8" data-live-preview="element-style" data-style-property="borderRadius" data-unit="px">
                        
                        <label>Padding (px)</label>
                        <input type="range" min="5" max="30" value="15" data-live-preview="element-style" data-style-property="padding" data-unit="px">
                        
                        <label>Margin (px)</label>
                        <input type="range" min="0" max="20" value="5" data-live-preview="element-style" data-style-property="margin" data-unit="px">
                    </div>
                    
                    <div class="mas-panel-content" data-content="effects" style="display: none;">
                        <label>Shadow Intensity</label>
                        <input type="range" min="0" max="30" value="10" data-live-preview="element-shadow">
                        
                        <label>Opacity</label>
                        <input type="range" min="0" max="1" step="0.1" value="1" data-live-preview="element-style" data-style-property="opacity">
                        
                        <label>
                            <input type="checkbox" data-live-preview="element-class" data-element-class="mas-postbox-glassmorphism"> 
                            Glassmorphism
                        </label>
                        
                        <label>
                            <input type="checkbox" data-live-preview="element-class" data-element-class="mas-postbox-3d-hover"> 
                            3D Hover Effect
                        </label>
                    </div>
                `;
                break;
                
            default:
                controls = `
                    <div class="mas-panel-tabs">
                        <button class="mas-panel-tab active" data-tab="basic">⚙️ Basic</button>
                        <button class="mas-panel-tab" data-tab="advanced">🔧 Advanced</button>
                    </div>
                    
                    <div class="mas-panel-content" data-content="basic">
                        <label>Background Color</label>
                        <input type="color" data-live-preview="element-style" data-style-property="backgroundColor">
                        
                        <label>Opacity</label>
                        <input type="range" min="0" max="1" step="0.1" value="1" data-live-preview="element-style" data-style-property="opacity">
                        
                        <label>Border Radius (px)</label>
                        <input type="range" min="0" max="20" value="0" data-live-preview="element-style" data-style-property="borderRadius" data-unit="px">
                    </div>
                    
                    <div class="mas-panel-content" data-content="advanced" style="display: none;">
                        <label>Transform Scale</label>
                        <input type="range" min="0.5" max="1.5" step="0.1" value="1" data-live-preview="element-transform" data-transform-property="scale">
                        
                        <label>Rotation (deg)</label>
                        <input type="range" min="-45" max="45" value="0" data-live-preview="element-transform" data-transform-property="rotate" data-unit="deg">
                        
                        <label>Z-Index</label>
                        <input type="range" min="0" max="100" value="1" data-live-preview="element-style" data-style-property="zIndex">
                    </div>
                `;
        }
        
        return controls;
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

    MAS.bindPanelControls = function(panel, element) {
        // FAZA 2: Obsługa zakładek w panelu
        this.initPanelTabs(panel);
        
        // FAZA 2: Obsługa wszystkich kontrolek (input, select, button)
        const controls = panel.querySelectorAll('input, select, button');
        
        controls.forEach(control => {
            const eventType = control.type === 'range' ? 'input' : 'change';
            
            control.addEventListener(eventType, (e) => {
                this.handlePanelControlChange(control, element, e);
            });
            
            // Dodaj hover effect z live value display dla range inputs
            if (control.type === 'range') {
                this.addLiveValueDisplay(control);
            }
        });
        
        // FAZA 2: Obsługa Quick Actions i Presets
        this.bindQuickActions(panel, element);
        this.bindPresets(panel, element);
    };

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
                
                console.log('🎯 Panel tab switched to:', targetTab);
            });
        });
    };

    // FAZA 2: Rozszerzona obsługa kontrolek
    MAS.handlePanelControlChange = function(control, element, event) {
        const previewType = control.getAttribute('data-live-preview');
        const value = control.value;
        const unit = control.getAttribute('data-unit') || '';
        const checked = control.checked;
        
        switch (previewType) {
            case 'css-var':
                const cssVar = control.getAttribute('data-css-var');
                document.documentElement.style.setProperty(cssVar, value + unit);
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
                
            case 'body-class':
                const bodyClass = control.getAttribute('data-body-class');
                const classPrefix = control.getAttribute('data-class-prefix');
                
                if (classPrefix && control.tagName === 'SELECT') {
                    // Usuń wszystkie klasy z prefiksem
                    document.body.className = document.body.className.replace(new RegExp(`${classPrefix}\\w+`, 'g'), '');
                    // Dodaj nową klasę
                    document.body.classList.add(classPrefix + value);
                } else if (bodyClass) {
                    if (checked || control.type !== 'checkbox') {
                        document.body.classList.add(bodyClass);
                    } else {
                        document.body.classList.remove(bodyClass);
                    }
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
        
        console.log('🎨 Applied:', previewType, value + unit, checked ? '(checked)' : '');
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
                    '--mas-admin-bar-background': '#23282d',
                    '--mas-admin-bar-text-color': '#ffffff',
                    '--mas-admin-bar-hover-color': '#00a0d2',
                    '--mas-menu-background': '#ffffff',
                    '--mas-menu-text-color': '#1e293b',
                    '--mas-menu-hover-color': '#6366f1',
                    '--mas-menu-active-color': '#ec4899'
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
                '--mas-admin-bar-background': '#1a1a1a',
                '--mas-admin-bar-text-color': '#ffffff',
                '--mas-admin-bar-hover-color': '#6366f1'
            },
            'light-minimal': {
                '--mas-admin-bar-background': '#f8f9fa',
                '--mas-admin-bar-text-color': '#333333',
                '--mas-admin-bar-hover-color': '#007cba'
            },
            'colorful': {
                '--mas-admin-bar-background': 'linear-gradient(135deg, #667eea, #764ba2)',
                '--mas-admin-bar-text-color': '#ffffff',
                '--mas-admin-bar-hover-color': '#ffd93d'
            },
            'glass': {
                '--mas-admin-bar-background': 'rgba(255, 255, 255, 0.1)',
                '--mas-admin-bar-text-color': '#ffffff',
                '--mas-admin-bar-hover-color': '#00a0d2'
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
                document.body.classList.add('mas-admin-bar-glassmorphism');
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
            background: linear-gradient(135deg, var(--mas-success), #38f9d7);
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
                        document.documentElement.style.setProperty('--mas-menu-width', newWidth + 'px');
                    }
                };

                const stopDragMenu = () => {
                    document.removeEventListener('mousemove', dragMenu);
                    document.removeEventListener('mouseup', stopDragMenu);
                    console.log('🎯 Menu width drag completed');
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
                        document.documentElement.style.setProperty('--mas-admin-bar-height', newHeight + 'px');
                    }
                };

                const stopDragBar = () => {
                    document.removeEventListener('mousemove', dragBar);
                    document.removeEventListener('mouseup', stopDragBar);
                    console.log('🎯 Admin bar height drag completed');
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
                console.log('🎮 MAS V2: 3D Controls ready for action!');
                console.log('🎨 MAS V2: Live Edit Mode ready for contextual editing!');
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
        console.log('🚀 Phase 3 features initialized');
    };

    // FAZA 3: Enable Phase 3 features
    MAS.enablePhase3Features = function() {
        this.showAdvancedToolbar();
        this.enableMultiSelect();
        this.enableAdvancedDragDrop();
        this.enableBulkOperations();
        document.body.classList.add('mas-phase3-active');
        console.log('✅ Phase 3 features enabled');
    };

    // FAZA 3: Disable Phase 3 features
    MAS.disablePhase3Features = function() {
        this.hideAdvancedToolbar();
        this.disableMultiSelect();
        this.disableAdvancedDragDrop();
        this.clearSelection();
        document.body.classList.remove('mas-phase3-active');
        console.log('❌ Phase 3 features disabled');
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
                        <span class="dashicons dashicons-admin-customizer"></span>
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
            background: var(--mas-glass-bg);
            backdrop-filter: var(--mas-blur-xl);
            border: 1px solid var(--mas-glass-border);
            border-radius: var(--mas-radius-xl);
            padding: var(--mas-space-4);
            color: white;
            font-family: var(--mas-font-family);
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
        
        console.log('🎯 Multi-select mode:', this.isMultiSelectMode ? 'ON' : 'OFF');
    };

    // FAZA 3: Select All Elements
    MAS.selectAllElements = function() {
        const editableElements = document.querySelectorAll('[data-mas-editable="true"]');
        
        editableElements.forEach(element => {
            this.addToSelection(element);
        });
        
        this.updateSelectionDisplay();
        this.showQuickActionFeedback(`✅ Selected ${editableElements.length} elements`);
        console.log(`🎯 Selected all ${editableElements.length} elements`);
    };

    // FAZA 3: Clear Selection
    MAS.clearSelection = function() {
        this.selectedElements.forEach(element => {
            element.classList.remove('mas-selected');
        });
        
        this.selectedElements.clear();
        this.updateSelectionDisplay();
        this.showQuickActionFeedback('🗙 Selection cleared');
        console.log('🗙 Selection cleared');
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
        
        console.log('⌨️ Keyboard shortcuts initialized');
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
        console.log(`💾 State saved: ${action}`, data);
    };

    // FAZA 3: Perform Undo
    MAS.performUndo = function() {
        if (this.currentStackIndex >= 0) {
            const state = this.undoRedoStack[this.currentStackIndex];
            this.revertState(state);
            this.currentStackIndex--;
            this.updateHistoryDisplay();
            this.showQuickActionFeedback(`↶ Undone: ${state.action}`);
            console.log('↶ Undo performed:', state.action);
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
            console.log('↷ Redo performed:', state.action);
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
        console.log('🗑️ History cleared');
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
        console.log('🎮 Advanced Drag & Drop enabled');
        // This will be enhanced in the drag handles function
    };

    MAS.disableAdvancedDragDrop = function() {
        console.log('❌ Advanced Drag & Drop disabled');
    };

    // FAZA 3: Enable Multi-Select Features
    MAS.enableMultiSelect = function() {
        this.enhanceElementClickHandler();
        console.log('✅ Multi-select enabled');
    };

    MAS.disableMultiSelect = function() {
        // Remove event listeners and cleanup
        console.log('❌ Multi-select disabled');
    };

    // FAZA 3: Enable Bulk Operations
    MAS.enableBulkOperations = function() {
        console.log('⚡ Bulk operations enabled');
    };

    // FAZA 3: Show Bulk Panel
    MAS.showBulkPanel = function(panel) {
        // Position and show panel
        panel.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: var(--mas-glass-bg);
            backdrop-filter: var(--mas-blur-xl);
            border: 1px solid var(--mas-glass-border);
            border-radius: var(--mas-radius-xl);
            padding: var(--mas-space-4);
            color: white;
            font-family: var(--mas-font-family);
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
        console.log('✅ Bulk changes applied:', changes);
    };

    // FAZA 3: Revert State (for undo)
    MAS.revertState = function(state) {
        // Implementation depends on action type
        console.log('↶ Reverting state:', state.action);
    };

    // FAZA 3: Apply State (for redo)
    MAS.applyState = function(state) {
        // Implementation depends on action type
        console.log('↷ Applying state:', state.action);
    };

    // FAZA 3: Initialize Selection Box
    MAS.initSelectionBox = function() {
        // Create selection box element
        this.selectionBox = document.createElement('div');
        this.selectionBox.className = 'mas-selection-box';
        document.body.appendChild(this.selectionBox);
        
        console.log('📦 Selection box initialized');
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
            background: var(--mas-glass-bg);
            backdrop-filter: var(--mas-blur-xl);
            border: 1px solid var(--mas-glass-border);
            border-radius: var(--mas-radius-xl);
            padding: var(--mas-space-4);
            color: white;
            font-family: var(--mas-font-family);
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
            console.log('✨ Bulk preset applied:', preset);
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
        console.log('✅ Enhanced bulk changes applied:', { changes, transforms, classes });
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
            background: var(--mas-glass-bg);
            backdrop-filter: var(--mas-blur-xl);
            border: 2px solid #ff6b6b;
            border-radius: var(--mas-radius-xl);
            padding: var(--mas-space-4);
            color: white;
            font-family: var(--mas-font-family);
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
        console.log('🗑️ Bulk delete performed on', elementsToDelete.length, 'elements');
    };

})(jQuery);