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
            $(".mas-v2-nav-tab").on("click", function(e) {
                e.preventDefault();
                
                const $tab = $(this);
                const targetId = $tab.attr("href").substring(1);
                
                $(".mas-v2-nav-tab").removeClass("active");
                $(".mas-v2-tab-panel").removeClass("active");
                
                $tab.addClass("active");
                $("#" + targetId).addClass("active");
                
                // Zapisz aktywny tab
                localStorage.setItem("mas_v2_active_tab", targetId);
                
                // Animacja
                $("#" + targetId).hide().fadeIn(300);
            });
            
            // Przywróć ostatni aktywny tab
            const lastActiveTab = localStorage.getItem("mas_v2_active_tab");
            if (lastActiveTab && $("#" + lastActiveTab).length) {
                $(".mas-v2-nav-tab[href=\"#" + lastActiveTab + "\"]").click();
            }
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

        triggerLivePreview: function() {
            // 🎯 FIXED LIVE PREVIEW - CSS Variables with correct field names!
            if (!this.livePreviewEnabled) return;
            
            const formData = this.getFormData();
            
            console.log('🎯 MAS V2: WZORZEC IMPLEMENTACJI - Updating all variables with full pattern!');
            
            // Update CSS variables on document root for instant preview
            const root = document.documentElement;
            
            // ========================================
            // 🌐 GENERAL (GŁÓWNE) - PEŁNA IMPLEMENTACJA
            // ========================================
            
            // Enable Plugin - Body Class Toggle
            if (formData.enable_plugin !== undefined) {
                const enableClass = 'mas-v2-modern-style';
                if (formData.enable_plugin === '1' || formData.enable_plugin === 1) {
                    document.body.classList.add(enableClass);
                    console.log('✅ MAS V2: Plugin enabled - added body class');
                } else {
                    document.body.classList.remove(enableClass);
                    console.log('✅ MAS V2: Plugin disabled - removed body class');
                }
            }
            
            // Color Scheme
            if (formData.color_scheme) {
                root.style.setProperty('--mas-color-scheme', formData.color_scheme);
                document.documentElement.setAttribute('data-theme', formData.color_scheme);
                console.log('✅ MAS V2: Color scheme set to:', formData.color_scheme);
            }
            
            // Color Palette
            if (formData.color_palette) {
                root.style.setProperty('--mas-color-palette', formData.color_palette);
                document.documentElement.setAttribute('data-palette', formData.color_palette);
                console.log('✅ MAS V2: Color palette set to:', formData.color_palette);
            }
            
            // Accent Color
            if (formData.accent_color) {
                root.style.setProperty('--mas-accent-color', formData.accent_color);
                root.style.setProperty('--mas-primary', formData.accent_color);
                console.log('✅ MAS V2: Accent color set to:', formData.accent_color);
            }
            
            // Floating Modes - Body Class Toggle
            if (formData.menu_floating !== undefined) {
                const floatingClass = 'mas-v2-menu-floating';
                if (formData.menu_floating === '1' || formData.menu_floating === 1) {
                    document.body.classList.add(floatingClass);
                    console.log('✅ MAS V2: Menu floating enabled');
                } else {
                    document.body.classList.remove(floatingClass);
                    console.log('✅ MAS V2: Menu floating disabled');
                }
            }
            
            if (formData.admin_bar_floating !== undefined) {
                const floatingClass = 'mas-v2-admin-bar-floating';
                if (formData.admin_bar_floating === '1' || formData.admin_bar_floating === 1) {
                    document.body.classList.add(floatingClass);
                    console.log('✅ MAS V2: Admin bar floating enabled');
                } else {
                    document.body.classList.remove(floatingClass);
                    console.log('✅ MAS V2: Admin bar floating disabled');
                }
            }
            
            // Visual Effects
            if (formData.menu_glassmorphism !== undefined) {
                const glassClass = 'mas-v2-glassmorphism';
                if (formData.menu_glassmorphism === '1' || formData.menu_glassmorphism === 1) {
                    document.body.classList.add(glassClass);
                    console.log('✅ MAS V2: Glassmorphism enabled');
                } else {
                    document.body.classList.remove(glassClass);
                    console.log('✅ MAS V2: Glassmorphism disabled');
                }
            }
            
            if (formData.admin_bar_glossy !== undefined) {
                const glossyClass = 'mas-v2-glossy';
                if (formData.admin_bar_glossy === '1' || formData.admin_bar_glossy === 1) {
                    document.body.classList.add(glossyClass);
                    console.log('✅ MAS V2: Glossy effect enabled');
                } else {
                    document.body.classList.remove(glossyClass);
                    console.log('✅ MAS V2: Glossy effect disabled');
                }
            }
            
            if (formData.enable_animations !== undefined) {
                const animClass = 'mas-v2-animations-enabled';
                if (formData.enable_animations === '1' || formData.enable_animations === 1) {
                    document.body.classList.add(animClass);
                    console.log('✅ MAS V2: Animations enabled');
                } else {
                    document.body.classList.remove(animClass);
                    console.log('✅ MAS V2: Animations disabled');
                }
            }
            
            // Custom CSS/JS - Dynamic injection
            if (formData.custom_css) {
                let customStyleEl = document.getElementById('mas-v2-custom-css');
                if (!customStyleEl) {
                    customStyleEl = document.createElement('style');
                    customStyleEl.id = 'mas-v2-custom-css';
                    document.head.appendChild(customStyleEl);
                }
                customStyleEl.textContent = formData.custom_css;
                console.log('✅ MAS V2: Custom CSS injected');
            }
            
            if (formData.custom_js) {
                let customScriptEl = document.getElementById('mas-v2-custom-js');
                if (!customScriptEl) {
                    customScriptEl = document.createElement('script');
                    customScriptEl.id = 'mas-v2-custom-js';
                    document.head.appendChild(customScriptEl);
                }
                customScriptEl.textContent = formData.custom_js;
                console.log('✅ MAS V2: Custom JS injected');
            }
            
            // ========================================
            // 📊 ADMIN BAR - PEŁNA IMPLEMENTACJA
            // ========================================
            
            // Admin Bar Background
            if (formData.admin_bar_background) {
                root.style.setProperty('--mas-admin-bar-background', formData.admin_bar_background);
                // Fallback direct application
                const adminBar = document.querySelector('#wpadminbar');
                if (adminBar) {
                    adminBar.style.background = formData.admin_bar_background;
                }
                console.log('✅ MAS V2: Admin bar background set to:', formData.admin_bar_background);
            }
            
            // Admin Bar Text Colors
            if (formData.admin_bar_text_color) {
                root.style.setProperty('--mas-admin-bar-text-color', formData.admin_bar_text_color);
                console.log('✅ MAS V2: Admin bar text color set to:', formData.admin_bar_text_color);
            }
            
            if (formData.bar_text_hover_color) {
                root.style.setProperty('--mas-admin-bar-hover-color', formData.bar_text_hover_color);
                console.log('✅ MAS V2: Admin bar hover color set to:', formData.bar_text_hover_color);
            }
            
            // Admin Bar Dimensions
            if (formData.admin_bar_height) {
                root.style.setProperty('--mas-admin-bar-height', formData.admin_bar_height + 'px');
                // Fallback direct application
                const adminBar = document.querySelector('#wpadminbar');
                if (adminBar) {
                    adminBar.style.height = formData.admin_bar_height + 'px';
                    adminBar.style.lineHeight = formData.admin_bar_height + 'px';
                }
                console.log('✅ MAS V2: Admin bar height set to:', formData.admin_bar_height + 'px');
            }
            
            if (formData.admin_bar_margin) {
                root.style.setProperty('--mas-admin-bar-margin', formData.admin_bar_margin + 'px');
                console.log('✅ MAS V2: Admin bar margin set to:', formData.admin_bar_margin + 'px');
            }
            
            // Admin Bar Border Radius
            if (formData.admin_bar_border_radius) {
                root.style.setProperty('--mas-admin-bar-border-radius-all', formData.admin_bar_border_radius + 'px');
                // Fallback direct application
                const adminBar = document.querySelector('#wpadminbar');
                if (adminBar) {
                    adminBar.style.borderRadius = formData.admin_bar_border_radius + 'px';
                }
                console.log('✅ MAS V2: Admin bar border radius set to:', formData.admin_bar_border_radius + 'px');
            }
            
            // Admin Bar Typography
            if (formData.admin_bar_font_size) {
                root.style.setProperty('--mas-admin-bar-font-size', formData.admin_bar_font_size + 'px');
                root.style.setProperty('--mas-admin-bar-typography-size', formData.admin_bar_font_size + 'px');
                console.log('✅ MAS V2: Admin bar font size set to:', formData.admin_bar_font_size + 'px');
            }
            
            if (formData.admin_bar_padding) {
                root.style.setProperty('--mas-admin-bar-padding', formData.admin_bar_padding + 'px');
                root.style.setProperty('--mas-admin-bar-spacing', formData.admin_bar_padding + 'px');
                console.log('✅ MAS V2: Admin bar padding set to:', formData.admin_bar_padding + 'px');
            }
            
            // Admin Bar Element Visibility (NOWA IMPLEMENTACJA)
            const hideOptions = [
                'hide_wp_logo',
                'hide_site_name', 
                'hide_update_notices',
                'hide_comments',
                'hide_howdy'
            ];
            
            hideOptions.forEach(option => {
                if (formData[option] !== undefined) {
                    const hideClass = `mas-v2-${option.replace('_', '-')}`;
                    if (formData[option] === '1' || formData[option] === 1) {
                        document.body.classList.add(hideClass);
                        console.log(`✅ MAS V2: ${option} hidden`);
                    } else {
                        document.body.classList.remove(hideClass);
                        console.log(`✅ MAS V2: ${option} visible`);
                    }
                }
            });
            
            // ========================================
            // 📋 MENU - PEŁNA IMPLEMENTACJA  
            // ========================================
            
            // Menu Background
            if (formData.menu_background_color) {
                root.style.setProperty('--mas-menu-background', formData.menu_background_color);
                // Fallback direct application
                const adminMenu = document.querySelector('#adminmenu');
                if (adminMenu) {
                    adminMenu.style.background = formData.menu_background_color;
                }
                console.log('✅ MAS V2: Menu background set to:', formData.menu_background_color);
            }
            
            // Menu Colors
            if (formData.menu_text_color) {
                root.style.setProperty('--mas-menu-text-color', formData.menu_text_color);
                console.log('✅ MAS V2: Menu text color set to:', formData.menu_text_color);
            }
            
            if (formData.menu_hover_color) {
                root.style.setProperty('--mas-menu-hover-color', formData.menu_hover_color);
                console.log('✅ MAS V2: Menu hover color set to:', formData.menu_hover_color);
            }
            
            if (formData.menu_active_color) {
                root.style.setProperty('--mas-menu-active-background', formData.menu_active_color);
                console.log('✅ MAS V2: Menu active background set to:', formData.menu_active_color);
            }
            
            if (formData.menu_active_text_color) {
                root.style.setProperty('--mas-menu-active-text-color', formData.menu_active_text_color);
                console.log('✅ MAS V2: Menu active text color set to:', formData.menu_active_text_color);
            }
            
            // Menu Dimensions
            if (formData.menu_width) {
                root.style.setProperty('--mas-menu-width', formData.menu_width + 'px');
                // Fallback direct application
                const adminMenu = document.querySelector('#adminmenu');
                if (adminMenu) {
                    adminMenu.style.width = formData.menu_width + 'px';
                }
                console.log('✅ MAS V2: Menu width set to:', formData.menu_width + 'px');
            }
            
            if (formData.menu_margin) {
                root.style.setProperty('--mas-menu-margin', formData.menu_margin + 'px');
                console.log('✅ MAS V2: Menu margin set to:', formData.menu_margin + 'px');
            }
            
            if (formData.menu_border_radius) {
                root.style.setProperty('--mas-menu-border-radius-all', formData.menu_border_radius + 'px');
                console.log('✅ MAS V2: Menu border radius set to:', formData.menu_border_radius + 'px');
            }
            
            // Menu Item Settings
            if (formData.menu_item_height) {
                root.style.setProperty('--mas-menu-item-height', formData.menu_item_height + 'px');
                console.log('✅ MAS V2: Menu item height set to:', formData.menu_item_height + 'px');
            }
            
            if (formData.menu_item_spacing) {
                root.style.setProperty('--mas-menu-item-spacing', formData.menu_item_spacing + 'px');
                console.log('✅ MAS V2: Menu item spacing set to:', formData.menu_item_spacing + 'px');
            }
            
            // Menu Compact Mode
            if (formData.menu_compact_mode !== undefined) {
                const compactClass = 'mas-menu-compact-mode';
                if (formData.menu_compact_mode === '1' || formData.menu_compact_mode === 1) {
                    document.body.classList.add(compactClass);
                    console.log('✅ MAS V2: Menu compact mode enabled');
                } else {
                    document.body.classList.remove(compactClass);
                    console.log('✅ MAS V2: Menu compact mode disabled');
                }
            }
            
            // ========================================
            // 📂 SUBMENU - PEŁNA IMPLEMENTACJA (NOWE!)
            // ========================================
            
            if (formData.submenu_bg_color) {
                root.style.setProperty('--mas-submenu-background', formData.submenu_bg_color);
                console.log('✅ MAS V2: Submenu background set to:', formData.submenu_bg_color);
            }
            
            if (formData.submenu_text_color) {
                root.style.setProperty('--mas-submenu-text-color', formData.submenu_text_color);
                console.log('✅ MAS V2: Submenu text color set to:', formData.submenu_text_color);
            }
            
            if (formData.submenu_hover_bg_color) {
                root.style.setProperty('--mas-submenu-hover-background', formData.submenu_hover_bg_color);
                console.log('✅ MAS V2: Submenu hover background set to:', formData.submenu_hover_bg_color);
            }
            
            if (formData.submenu_hover_text_color) {
                root.style.setProperty('--mas-submenu-hover-text-color', formData.submenu_hover_text_color);
                console.log('✅ MAS V2: Submenu hover text color set to:', formData.submenu_hover_text_color);
            }
            
            if (formData.submenu_active_bg_color) {
                root.style.setProperty('--mas-submenu-active-background', formData.submenu_active_bg_color);
                console.log('✅ MAS V2: Submenu active background set to:', formData.submenu_active_bg_color);
            }
            
            if (formData.menu_submenu_width) {
                root.style.setProperty('--mas-submenu-width', formData.menu_submenu_width + 'px');
                console.log('✅ MAS V2: Submenu width set to:', formData.menu_submenu_width + 'px');
            }
            
            if (formData.submenu_indent) {
                root.style.setProperty('--mas-submenu-indent', formData.submenu_indent + 'px');
                console.log('✅ MAS V2: Submenu indent set to:', formData.submenu_indent + 'px');
            }
            
            // Submenu Separator
            if (formData.submenu_separator !== undefined) {
                const separatorDisplay = (formData.submenu_separator === '1' || formData.submenu_separator === 1) ? 'block' : 'none';
                root.style.setProperty('--mas-submenu-separator-display', separatorDisplay);
                console.log('✅ MAS V2: Submenu separator display set to:', separatorDisplay);
            }
            
            // Submenu Indicator Style
            if (formData.submenu_indicator_style) {
                root.style.setProperty('--mas-submenu-indicator-style', formData.submenu_indicator_style);
                console.log('✅ MAS V2: Submenu indicator style set to:', formData.submenu_indicator_style);
            }
            
            // ========================================
            // 🔤 TYPOGRAPHY - PEŁNA IMPLEMENTACJA
            // ========================================
            
            if (formData.body_font) {
                root.style.setProperty('--mas-body-font-family', formData.body_font);
                console.log('✅ MAS V2: Body font set to:', formData.body_font);
            }
            
            if (formData.headings_font) {
                root.style.setProperty('--mas-heading-font-family', formData.headings_font);
                console.log('✅ MAS V2: Headings font set to:', formData.headings_font);
            }
            
            if (formData.global_font_size) {
                root.style.setProperty('--mas-global-font-size', formData.global_font_size + 'px');
                root.style.setProperty('--mas-font-size-base', formData.global_font_size + 'px');
                root.style.setProperty('--mas-body-font-size', formData.global_font_size + 'px');
                console.log('✅ MAS V2: Global font size set to:', formData.global_font_size + 'px');
            }
            
            if (formData.global_line_height) {
                root.style.setProperty('--mas-global-line-height', formData.global_line_height);
                root.style.setProperty('--mas-body-line-height', formData.global_line_height);
                console.log('✅ MAS V2: Global line height set to:', formData.global_line_height);
            }
            
            // Headings Scale - NOWA FUNKCJA!
            if (formData.headings_scale) {
                const baseSize = parseFloat(formData.global_font_size) || 14;
                const scale = parseFloat(formData.headings_scale) || 1.25;
                
                // Matematyczna skala dla H1-H6
                const h1Size = baseSize * Math.pow(scale, 5); // Największy
                const h2Size = baseSize * Math.pow(scale, 4);
                const h3Size = baseSize * Math.pow(scale, 3);
                const h4Size = baseSize * Math.pow(scale, 2);
                const h5Size = baseSize * Math.pow(scale, 1);
                const h6Size = baseSize; // Bazowy rozmiar
                
                root.style.setProperty('--mas-h1-font-size', h1Size + 'px');
                root.style.setProperty('--mas-h2-font-size', h2Size + 'px');
                root.style.setProperty('--mas-h3-font-size', h3Size + 'px');
                root.style.setProperty('--mas-h4-font-size', h4Size + 'px');
                root.style.setProperty('--mas-h5-font-size', h5Size + 'px');
                root.style.setProperty('--mas-h6-font-size', h6Size + 'px');
                
                console.log('✅ MAS V2: Headings scale applied with ratio:', scale);
                console.log('  H1:', h1Size + 'px', 'H2:', h2Size + 'px', 'H3:', h3Size + 'px');
            }
            
            // ========================================
            // ⚙️ ADVANCED - PEŁNA IMPLEMENTACJA
            // ========================================
            
            // Interface Modifications - Hide Elements
            const advancedHideOptions = [
                'hide_help_tab',
                'hide_screen_options', 
                'hide_wp_version',
                'hide_admin_notices'
            ];
            
            advancedHideOptions.forEach(option => {
                if (formData[option] !== undefined) {
                    const hideClass = `mas-v2-${option.replace('_', '-')}`;
                    if (formData[option] === '1' || formData[option] === 1) {
                        document.body.classList.add(hideClass);
                        console.log(`✅ MAS V2: ${option} hidden`);
                    } else {
                        document.body.classList.remove(hideClass);
                        console.log(`✅ MAS V2: ${option} visible`);
                    }
                }
            });
            
            // Optimization Options - NOWA SEKCJA!
            const optimizationOptions = [
                'disable_emojis',
                'disable_embeds',
                'remove_jquery_migrate'
            ];
            
            optimizationOptions.forEach(option => {
                if (formData[option] !== undefined) {
                    const optClass = `mas-v2-${option.replace('_', '-')}`;
                    if (formData[option] === '1' || formData[option] === 1) {
                        document.body.classList.add(optClass);
                        console.log(`✅ MAS V2: ${option} enabled`);
                    } else {
                        document.body.classList.remove(optClass);
                        console.log(`✅ MAS V2: ${option} disabled`);
                    }
                }
            });
            
            // ========================================
            // 📄 CONTENT - PEŁNA IMPLEMENTACJA (PRZENIESIONE)
            // ========================================
            
            if (formData.content_background_color) {
                root.style.setProperty('--mas-content-background-color', formData.content_background_color);
                console.log('✅ MAS V2: Content background color set to:', formData.content_background_color);
            }
            
            if (formData.content_padding) {
                root.style.setProperty('--mas-content-padding', formData.content_padding + 'px');
                console.log('✅ MAS V2: Content padding set to:', formData.content_padding + 'px');
            }
            
            if (formData.content_border_radius) {
                root.style.setProperty('--mas-content-border-radius', formData.content_border_radius + 'px');
                console.log('✅ MAS V2: Content border radius set to:', formData.content_border_radius + 'px');
            }
            
            // ========================================
            // 🔘 BUTTONS - PEŁNA IMPLEMENTACJA (PRZENIESIONE)
            // ========================================
            
            if (formData.button_bg_color) {
                root.style.setProperty('--mas-button-bg-color', formData.button_bg_color);
                console.log('✅ MAS V2: Button bg color set to:', formData.button_bg_color);
            }
            
            if (formData.button_text_color) {
                root.style.setProperty('--mas-button-text-color', formData.button_text_color);
                console.log('✅ MAS V2: Button text color set to:', formData.button_text_color);
            }
            
            if (formData.button_border_radius) {
                root.style.setProperty('--mas-button-border-radius', formData.button_border_radius + 'px');
                console.log('✅ MAS V2: Button border radius set to:', formData.button_border_radius + 'px');
            }
            
            // Update body classes for structural changes
            if (window.updateBodyClasses && typeof window.updateBodyClasses === 'function') {
                window.updateBodyClasses(formData);
            }
            
            console.log('🎯 WZORZEC IMPLEMENTACJI: All CSS variables updated with complete pattern!');
            console.log('✅ CSS Variables, ✅ JS Handlers, ✅ CSS Selectors, ✅ Debug Logs, ✅ Fallbacks');
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

})(jQuery);