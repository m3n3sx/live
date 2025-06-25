/**
 * Modern Admin Styler V2 - Admin JavaScript
 * Nowoczesny interfejs z animacjami i live preview
 */

(function($) {
    "use strict";

    // Główny obiekt aplikacji
    const MAS = {
        livePreviewEnabled: true, // Always enabled by default
        hasChanges: false,
        autoSaveInterval: null,
        livePreviewTimeout: null,
        sliderTimeout: null,
        colorTimeout: null,
        
        init: function() {
            this.bindEvents();
            this.initTabs();
            this.initColorPickers();
            this.initSliders();
            this.initCornerRadius();
            this.initConditionalFields();
            this.initFloatingFields();
            this.initLivePreview();
            this.initAllFieldsLivePreview(); // Dodaj live preview do wszystkich pól
            this.checkAutoSave();
            this.initTooltips();
            this.updateBodyClasses(); // Ustaw klasy na starcie
            this.initMobileResponsive();
            this.initTouchGestures();
        },

        bindEvents: function() {
            $(document).on("click", "#mas-v2-save-btn", this.saveSettings);
            $(document).on("click", "#mas-v2-reset-btn", this.resetSettings);
        $(document).on("click", "#mas-v2-clear-cache-btn", this.clearCache);
            $(document).on("click", "#mas-v2-export-btn", this.exportSettings);
            $(document).on("click", "#mas-v2-import-btn", this.importSettings);
            $(document).on("change", "#mas-v2-import-file", this.handleImportFile);
            $(document).on("change", "#mas-v2-live-preview", this.toggleLivePreview);
            
            // Rozszerzona obsługa live preview dla wszystkich typów pól
            $(document).on("change input keyup", "#mas-v2-settings-form input, #mas-v2-settings-form select, #mas-v2-settings-form textarea", this.handleFormChange);
            $(document).on("change", "#mas-v2-settings-form input[type='checkbox'], #mas-v2-settings-form input[type='radio']", this.handleFormChange);
            $(document).on("input", "#mas-v2-settings-form input[type='range']", this.handleFormChange);
            
            // Obsługa color pickerów
            $(document).on("wpColorPickerChange", "#mas-v2-settings-form input.mas-v2-color", this.handleFormChange);
            
            // Obsługa submit formularza
            $(document).on("submit", "#mas-v2-settings-form", this.saveSettings.bind(this));
            $(document).on("click", "button[type='submit'][form='mas-v2-settings-form']", this.saveSettings.bind(this));
            $(document).on("click", "#mas-v2-save-btn", this.saveSettings.bind(this));
        },

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
                            // Zawsze aktywny live preview
                            clearTimeout(MAS.colorTimeout);
                            MAS.colorTimeout = setTimeout(function() {
                                MAS.triggerLivePreview();
                            }, 100); // Szybsze dla kolorów
                            MAS.markAsChanged();
                        },
                        clear: function() {
                            // Zawsze aktywny live preview
                            MAS.triggerLivePreview();
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
                    
                                                // Live preview z throttling dla płynności (zawsze aktywny)
                            clearTimeout(MAS.sliderTimeout);
                            MAS.sliderTimeout = setTimeout(function() {
                                MAS.triggerLivePreview();
                            }, 50); // Jeszcze szybsze dla sliderów
                    
                    MAS.markAsChanged();
                });
                
                // Natychmiastowa aktualizacja przy zmianie końcowej (zawsze aktywny)
                $slider.on("change", function() {
                    clearTimeout(MAS.sliderTimeout);
                    MAS.triggerLivePreview();
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
            // Zawsze włączony live preview
            this.livePreviewEnabled = true;
            
            // Force checkbox do zawsze checked i disabled
            const $checkbox = $("#mas-v2-live-preview");
            if ($checkbox.length) {
                $checkbox.prop("checked", true).prop("disabled", true)
                    .closest('.mas-v2-field').append('<small class="mas-v2-help-text">Live Preview jest zawsze aktywny dla lepszego UX</small>');
            }
            
            // Natychmiastowy initial preview
            setTimeout(() => {
                this.triggerLivePreview();
            }, 100);
            
            console.log('MAS V2: Live Preview zawsze aktywny');
        },

        initAllFieldsLivePreview: function() {
            // Dodatkowa inicjalizacja dla wszystkich pól
            setTimeout(() => {
                // Natychmiastowa obsługa dla wszystkich pól formularza
                $("#mas-v2-settings-form").find("input, select, textarea").each(function() {
                    const $field = $(this);
                    const fieldType = $field.attr('type') || $field.prop('tagName').toLowerCase();
                    
                    // Usuń istniejące handlery aby uniknąć duplikacji
                    $field.off('change.livepreview input.livepreview keyup.livepreview');
                    
                    // Dodaj nowe handlery z namespace
                    if (fieldType === 'checkbox' || fieldType === 'radio') {
                        $field.on('change.livepreview', function() {
                            MAS.triggerLivePreview();
                        });
                    } else if (fieldType === 'range') {
                        $field.on('input.livepreview', function() {
                            clearTimeout(MAS.sliderTimeout);
                            MAS.sliderTimeout = setTimeout(() => MAS.triggerLivePreview(), 50);
                        });
                    } else if ($field.hasClass('mas-v2-color')) {
                        // Color picker już ma obsługę
                    } else {
                        // Inne pola (text, textarea, select)
                        $field.on('input.livepreview keyup.livepreview change.livepreview', function() {
                            clearTimeout(MAS.livePreviewTimeout);
                            MAS.livePreviewTimeout = setTimeout(() => MAS.triggerLivePreview(), 200);
                        });
                    }
                    
                    console.log('MAS V2: Live preview bound to', $field.attr('name') || $field.attr('id'), fieldType);
                });
                
                // Trigger initial preview
                this.triggerLivePreview();
            }, 200);
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
            // Live Preview jest zawsze włączony
            MAS.livePreviewEnabled = true;
            $("#mas-v2-live-preview").prop("checked", true);
            MAS.showMessage("Live Preview jest zawsze aktywny!", "info");
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
            
            // Zawsze wykonuj live preview (usunięto sprawdzenie livePreviewEnabled)
            clearTimeout(MAS.livePreviewTimeout);
            
            if (instantUpdate) {
                // Natychmiastowa aktualizacja dla ważnych pól
                MAS.triggerLivePreview();
            } else {
                // Opóźniona aktualizacja dla text inputów i sliderów (krótsze opóźnienie)
                MAS.livePreviewTimeout = setTimeout(function() {
                    MAS.triggerLivePreview();
                }, 150); // Zmniejszone z 300ms na 150ms
            }
            
            MAS.markAsChanged();
        },

        triggerLivePreview: function() {
            // Optimized live preview using CSS Variables instead of AJAX
            const formData = this.getFormData();
            
            console.log('MAS V2: Updating live preview with CSS variables');
            
            // Update CSS variables on document root for instant preview
            const root = document.documentElement;
            
            // Color variables
            if (formData.accent_color) {
                root.style.setProperty('--mas-accent-color', formData.accent_color);
                root.style.setProperty('--mas-primary', formData.accent_color);
            }
            
            if (formData.background_color) {
                root.style.setProperty('--mas-bg-primary', formData.background_color);
            }
            
            if (formData.text_color) {
                root.style.setProperty('--mas-text-primary', formData.text_color);
            }
            
            if (formData.border_color) {
                root.style.setProperty('--mas-border-color', formData.border_color);
            }
            
            // Border radius variables
            if (formData.corner_radius_global) {
                root.style.setProperty('--mas-border-radius', formData.corner_radius_global + 'px');
            }
            
            // Typography variables
            if (formData.font_size_global) {
                root.style.setProperty('--mas-font-size-base', formData.font_size_global + 'px');
            }
            
            // Spacing variables
            if (formData.spacing_global) {
                root.style.setProperty('--mas-spacing-base', formData.spacing_global + 'px');
            }
            
            // Update body classes for structural changes
            if (window.updateBodyClasses && typeof masV2Global !== 'undefined') {
                window.updateBodyClasses(masV2Global.settings);
            }
            
            console.log('MAS V2: Live preview updated instantly with CSS variables');
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
            e.preventDefault();
            
            const $btn = $(e.target).closest('button, input[type="submit"]');
            const originalText = $btn.html() || $btn.val();
            
            $btn.prop("disabled", true);
            if ($btn.is('button')) {
                $btn.html('<span class="mas-v2-loading"></span> Zapisywanie...');
            } else {
                $btn.val('Zapisywanie...');
            }
            
            const formData = MAS.getFormData();
            
            $.ajax({
                url: masV2.ajaxUrl,
                type: "POST",
                data: {
                    action: "mas_v2_save_settings",
                    nonce: masV2.nonce,
                    ...formData
                },
                success: function(response) {
                    if (response.success) {
                        MAS.showMessage(response.data.message || "Ustawienia zostały zapisane", "success");
                        MAS.markAsSaved();
                        
                        // Aktualizuj status
                        $("#mas-v2-last-save").text(new Date().toLocaleTimeString());
                        
                        // Odśwież CSS dla nowych ustawień (zawsze aktywny live preview)
                        MAS.triggerLivePreview();
                    } else {
                        MAS.showMessage(response.data.message || "Wystąpił błąd podczas zapisywania", "error");
                    }
                },
                error: function(xhr, status, error) {
                    console.error('Save error:', xhr, status, error);
                    MAS.showMessage("Wystąpił błąd podczas zapisywania: " + error, "error");
                },
                complete: function() {
                    $btn.prop("disabled", false);
                    if ($btn.is('button')) {
                        $btn.html(originalText);
                    } else {
                        $btn.val(originalText);
                    }
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
            
            $.ajax({
                url: masV2.ajaxUrl,
                type: "POST",
                data: {
                    action: "mas_v2_reset_settings",
                    nonce: masV2.nonce
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

        clearCache: function(e) {
            e.preventDefault();
            
            const $btn = $(this);
            const originalText = $btn.html();
            
            $btn.prop("disabled", true).html('<span class="mas-v2-loading"></span> Czyszczenie...');
            
            $.ajax({
                url: masV2.ajaxUrl,
                type: "POST",
                data: {
                    action: "mas_v2_clear_cache",
                    nonce: masV2.nonce
                },
                success: function(response) {
                    if (response.success) {
                        MAS.showMessage(response.data.message, "success");
                        
                        // Aktualizuj ostatni zapis
                        $("#mas-v2-last-save").text(response.data.timestamp || 'Teraz');
                    } else {
                        MAS.showMessage(response.data.message || "Wystąpił błąd", "error");
                    }
                },
                error: function() {
                    MAS.showMessage("Wystąpił błąd podczas czyszczenia cache", "error");
                },
                complete: function() {
                    $btn.prop("disabled", false).html(originalText);
                }
            });
        },

        exportSettings: function(e) {
            e.preventDefault();
            
            $.ajax({
                url: masV2.ajaxUrl,
                type: "POST",
                data: {
                    action: "mas_v2_export_settings",
                    nonce: masV2.nonce
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
                    
                    $.ajax({
                        url: masV2.ajaxUrl,
                        type: "POST",
                        data: {
                            action: "mas_v2_import_settings",
                            nonce: masV2.nonce,
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

        /**
         * Mobile Responsive Initialization
         */
        initMobileResponsive: function() {
            // Detect mobile device
            this.isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            this.isTablet = /iPad|tablet/i.test(navigator.userAgent) || (window.screen.width >= 768 && window.screen.width <= 1024);
            
            // Add device classes
            if (this.isMobile) {
                $('body').addClass('mas-v2-mobile');
            }
            if (this.isTablet) {
                $('body').addClass('mas-v2-tablet');
            }
            
            // Enhanced tab navigation for mobile
            this.initMobileTabNavigation();
            
            // Responsive form adjustments
            this.initResponsiveFormElements();
            
            // Mobile-specific UI adjustments
            this.initMobileUIEnhancements();
            
            // Window resize handler
            $(window).on('resize.masv2', this.handleResize.bind(this));
            
            console.log('MAS V2: Mobile responsive initialized');
        },

        /**
         * Touch Gestures Support
         */
        initTouchGestures: function() {
            if (!this.isMobile && !this.isTablet) return;
            
            let startX = 0;
            let startY = 0;
            
            // Swipe between tabs
            $('.mas-v2-nav-tabs').on('touchstart', function(e) {
                startX = e.originalEvent.touches[0].clientX;
                startY = e.originalEvent.touches[0].clientY;
            });
            
            $('.mas-v2-nav-tabs').on('touchend', function(e) {
                if (!startX || !startY) return;
                
                const endX = e.originalEvent.changedTouches[0].clientX;
                const endY = e.originalEvent.changedTouches[0].clientY;
                
                const diffX = startX - endX;
                const diffY = startY - endY;
                
                // Check if it's a horizontal swipe
                if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
                    const $currentTab = $('.mas-v2-nav-tab.active');
                    let $nextTab;
                    
                    if (diffX > 0) {
                        // Swipe left - next tab
                        $nextTab = $currentTab.next('.mas-v2-nav-tab');
                    } else {
                        // Swipe right - previous tab
                        $nextTab = $currentTab.prev('.mas-v2-nav-tab');
                    }
                    
                    if ($nextTab.length) {
                        $nextTab.click();
                    }
                }
                
                startX = 0;
                startY = 0;
            });
            
            console.log('MAS V2: Touch gestures initialized');
        },

        /**
         * Mobile Tab Navigation
         */
        initMobileTabNavigation: function() {
            // Auto-scroll to active tab on mobile
            const scrollToActiveTab = function() {
                const $activeTab = $('.mas-v2-nav-tab.active');
                const $tabsContainer = $('.mas-v2-nav-tabs');
                
                if ($activeTab.length && $tabsContainer.length) {
                    const tabOffset = $activeTab.position().left;
                    const tabWidth = $activeTab.outerWidth();
                    const containerWidth = $tabsContainer.width();
                    const scrollLeft = tabOffset - (containerWidth / 2) + (tabWidth / 2);
                    
                    $tabsContainer.animate({
                        scrollLeft: scrollLeft
                    }, 300);
                }
            };
            
            // Scroll to active tab on tab change
            $('.mas-v2-nav-tab').on('click', function() {
                setTimeout(scrollToActiveTab, 100);
            });
            
            // Initial scroll
            setTimeout(scrollToActiveTab, 500);
        },

        /**
         * Responsive Form Elements
         */
        initResponsiveFormElements: function() {
            // Enhanced touch targets for mobile
            if (this.isMobile) {
                $('.mas-v2-slider').css({
                    'height': '48px',
                    'cursor': 'pointer'
                });
                
                $('.mas-v2-checkbox-mark').css({
                    'width': '24px',
                    'height': '24px'
                });
                
                $('.mas-v2-btn').css({
                    'min-height': '48px',
                    'padding': '12px 24px'
                });
            }
            
            // Auto-focus management on mobile
            $('input, textarea, select').on('focus', function() {
                if (this.isMobile) {
                    // Scroll to element with offset for mobile keyboards
                    setTimeout(() => {
                        const offset = $(this).offset().top - 100;
                        $('html, body').animate({
                            scrollTop: offset
                        }, 300);
                    }, 300);
                }
            }.bind(this));
        },

        /**
         * Mobile UI Enhancements
         */
        initMobileUIEnhancements: function() {
            // Collapsible sections on mobile
            if (window.innerWidth <= 768) {
                $('.mas-v2-section-title').addClass('mas-v2-collapsible');
                
                $('.mas-v2-section-title').on('click', function() {
                    const $section = $(this).closest('.mas-v2-section');
                    const $content = $section.find('.mas-v2-field, .mas-v2-grid');
                    
                    $content.slideToggle(300);
                    $(this).toggleClass('collapsed');
                });
            }
            
            // Enhanced mobile messages
            $('.mas-v2-message').on('touchstart', function(e) {
                e.stopPropagation();
            });
            
            // Mobile-friendly tooltips
            if (this.isMobile) {
                $('.mas-v2-tooltip').removeClass('mas-v2-tooltip').addClass('mas-v2-mobile-help');
            }
        },

        /**
         * Window Resize Handler
         */
        handleResize: function() {
            const width = window.innerWidth;
            
            // Update body classes based on screen size
            $('body').toggleClass('mas-v2-mobile-view', width <= 768);
            $('body').toggleClass('mas-v2-tablet-view', width > 768 && width <= 1024);
            $('body').toggleClass('mas-v2-desktop-view', width > 1024);
            
            // Recalculate mobile tab navigation
            if (width <= 768) {
                this.initMobileTabNavigation();
            }
            
            // Adjust floating elements on resize
            this.adjustFloatingElements();
        },

        /**
         * Adjust Floating Elements
         */
        adjustFloatingElements: function() {
            const width = window.innerWidth;
            
            // Adjust theme toggle position
            const $themeToggle = $('.mas-theme-toggle');
            const $livePreviewToggle = $('.mas-live-preview-toggle');
            
            if (width <= 480) {
                $themeToggle.css({
                    'top': '50px',
                    'right': '8px',
                    'width': '44px',
                    'height': '44px'
                });
                
                $livePreviewToggle.css({
                    'top': '105px',
                    'right': '8px',
                    'width': '44px',
                    'height': '44px'
                });
            } else if (width <= 782) {
                $themeToggle.css({
                    'top': '60px',
                    'right': '10px',
                    'width': '48px',
                    'height': '48px'
                });
                
                $livePreviewToggle.css({
                    'top': '120px',
                    'right': '10px',
                    'width': '48px',
                    'height': '48px'
                });
            }
        },

        updateBodyClasses: function() {
            const body = document.body;
            
            // Debug - sprawdź czy checkbox istnieje
            const $menuCheckbox = $("input[name='menu_detached']");
            const $adminBarCheckbox = $("input[name='admin_bar_detached']");
            
            // Jeśli checkboxy nie istnieją (fresh load), użyj domyślnych wartości
            let menuDetached = false;
            let adminBarDetached = false;
            
            if ($menuCheckbox.length > 0) {
                menuDetached = $menuCheckbox.is(":checked");
            } else {
                // Ustaw domyślnie na true (floating) dla nowego wyglądu
                menuDetached = true;
                body.classList.add('mas-default-floating');
            }
            
            if ($adminBarCheckbox.length > 0) {
                adminBarDetached = $adminBarCheckbox.is(":checked");
            } else {
                // Ustaw domyślnie na true (floating) dla nowego wyglądu
                adminBarDetached = true;
                body.classList.add('mas-default-floating');
            }
            
            console.log('MAS V2 DEBUG: Classes update:', {
                menuCheckbox: $menuCheckbox.length,
                adminBarCheckbox: $adminBarCheckbox.length,
                menuDetached: menuDetached,
                adminBarDetached: adminBarDetached
            });
            
            // Menu floating status
            if (menuDetached) {
                body.classList.add('mas-menu-floating');
                body.classList.add('mas-v2-menu-floating');
                body.classList.add('mas-v2-menu-glossy'); // Dodaj glossy domyślnie
                body.classList.remove('mas-menu-normal');
                // Inicjalizuj floating collapse po ustawieniu klasy
                this.initFloatingMenuCollapse();
            } else {
                body.classList.add('mas-menu-normal');
                body.classList.remove('mas-menu-floating');
                body.classList.remove('mas-v2-menu-floating');
                body.classList.remove('mas-v2-menu-glossy');
                // Przywróć normalną funkcjonalność collapse
                this.restoreNormalCollapse();
            }
            
            // Admin bar floating status
            if (adminBarDetached) {
                body.classList.add('mas-admin-bar-floating');
                body.classList.add('mas-v2-admin-bar-floating');
                body.classList.add('mas-v2-admin-bar-glossy'); // Dodaj glossy domyślnie
            } else {
                body.classList.remove('mas-admin-bar-floating');
                body.classList.remove('mas-v2-admin-bar-floating');
                body.classList.remove('mas-v2-admin-bar-glossy');
            }
            
            // Dodaj klasy dla zaokrąglonych rogów (domyślnie)
            body.classList.add('mas-v2-rounded-corners');
            body.classList.add('mas-v2-modern-style');
            
            // Debug info
            console.log('MAS V2: Body classes updated:', {
                menuFloating: menuDetached,
                adminBarFloating: adminBarDetached,
                bodyClasses: body.className.split(' ').filter(c => c.startsWith('mas-'))
            });
        },

        initFloatingMenuCollapse: function() {
            // Sprawdź czy już zainicjalizowane
            if (this.floatingCollapseInitialized) {
                return;
            }
            
            const self = this;
            const $body = $('body');
            
            console.log('MAS V2: Initializing floating menu collapse');
            
            // Usuń poprzednie event listenery
            $(document).off('click.mas-floating-collapse');
            
            // Obsługa przycisku collapse/expand w floating mode
            $(document).on('click.mas-floating-collapse', '#collapse-menu', function(e) {
                console.log('MAS V2: Collapse button clicked, floating mode active');
                
                if ($body.hasClass('mas-v2-menu-floating')) {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    // W floating mode ręcznie przełączamy stan
                    const isFolded = $body.hasClass('folded');
                    
                    if (isFolded) {
                        // Rozwiń menu
                        $body.removeClass('folded');
                        $('#adminmenu').css('width', '160px');
                        localStorage.setItem('adminmenufold', 'open');
                        console.log('MAS V2: Floating menu expanded');
                    } else {
                        // Zwiń menu
                        $body.addClass('folded');
                        $('#adminmenu').css('width', '36px');
                        localStorage.setItem('adminmenufold', 'folded');
                        console.log('MAS V2: Floating menu collapsed');
                    }
                    
                    // Wymuś ponowne renderowanie CSS dla poprawnego submenu positioning
                    const $adminmenu = $('#adminmenu');
                    $adminmenu.addClass('mas-refresh');
                    setTimeout(() => $adminmenu.removeClass('mas-refresh'), 50);
                    
                    // Wymuś odświeżenie stylów
                    self.triggerLivePreview();
                }
            });
            
            this.floatingCollapseInitialized = true;
        },

        restoreNormalCollapse: function() {
            // Przywróć normalną funkcjonalność collapse
            $(document).off('click.mas-floating-collapse');
            this.floatingCollapseInitialized = false;
            
            // Przywróć domyślne marginy
            $('#wpbody-content').css('margin-left', '');
            
            console.log('MAS V2: Normal collapse functionality restored');
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
        }
    };

    $(document).ready(function() {
        MAS.init();
    });

    // Dodaj MAS do globalnego scope
    window.MAS = MAS;

    /* === MODERN UI/UX ENHANCEMENTS === */

    // Nowoczesny system notyfikacji
    function showNotification(message, type = 'success', duration = 4000) {
        const notification = document.createElement('div');
        notification.className = `mas-v2-notification ${type}`;
        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 12px;">
                <span style="font-size: 18px;">
                    ${type === 'success' ? '✅' : type === 'error' ? '❌' : '⚠️'}
                </span>
                <span>${message}</span>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Animacja pojawiania się
        setTimeout(() => notification.classList.add('show'), 100);
        
        // Automatyczne usunięcie
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, duration);
    }

    // Animacje dla kart
    function initCardAnimations() {
        const cards = document.querySelectorAll('.mas-v2-card');
        
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
        
        cards.forEach(card => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            observer.observe(card);
        });
    }

    // Smooth scrolling dla nawigacji
    function initSmoothScrolling() {
        const navTabs = document.querySelectorAll('.mas-v2-nav-tab');
        
        navTabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = tab.getAttribute('href').substring(1);
                const targetElement = document.getElementById(targetId);
                
                if (targetElement) {
                    targetElement.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    }

    // Efekt paralaksy dla headera
    function initParallaxEffect() {
        const header = document.querySelector('.mas-v2-header');
        if (!header) return;
        
        window.addEventListener('scroll', () => {
            const scrolled = window.pageYOffset;
            const rate = scrolled * -0.5;
            header.style.transform = `translateY(${rate}px)`;
        });
    }

    // Dynamiczne aktualizacje wartości suwaków
    function initSliderUpdates() {
        const sliders = document.querySelectorAll('.mas-v2-slider');
        
        sliders.forEach(slider => {
            const valueDisplay = document.querySelector(`[data-target="${slider.id}"]`);
            if (valueDisplay) {
                slider.addEventListener('input', () => {
                    valueDisplay.textContent = `${slider.value}px`;
                    
                    // Dodaj efekt pulsowania
                    valueDisplay.style.transform = 'scale(1.1)';
                    setTimeout(() => {
                        valueDisplay.style.transform = 'scale(1)';
                    }, 150);
                });
            }
        });
    }

    // Efekt ripple dla przycisków
    function initRippleEffect() {
        const buttons = document.querySelectorAll('.mas-v2-btn');
        
        buttons.forEach(button => {
            button.addEventListener('click', function(e) {
                const ripple = document.createElement('span');
                const rect = this.getBoundingClientRect();
                const size = Math.max(rect.width, rect.height);
                const x = e.clientX - rect.left - size / 2;
                const y = e.clientY - rect.top - size / 2;
                
                ripple.style.cssText = `
                    position: absolute;
                    width: ${size}px;
                    height: ${size}px;
                    left: ${x}px;
                    top: ${y}px;
                    background: rgba(255, 255, 255, 0.3);
                    border-radius: 50%;
                    transform: scale(0);
                    animation: ripple 0.6s linear;
                    pointer-events: none;
                `;
                
                this.appendChild(ripple);
                
                setTimeout(() => ripple.remove(), 600);
            });
        });
        
        // Dodaj CSS dla animacji ripple
        if (!document.querySelector('#ripple-styles')) {
            const style = document.createElement('style');
            style.id = 'ripple-styles';
            style.textContent = `
                @keyframes ripple {
                    to {
                        transform: scale(4);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }

    // Inicjalizacja wszystkich nowoczesnych funkcji
    function initModernUI() {
        // Sprawdź czy jesteśmy na stronie Modern Admin Styler
        if (!document.querySelector('.mas-v2-admin-wrapper')) return;
        
        console.log('🎨 Inicjalizacja Modern Admin Styler V2 UI/UX...');
        
        // Inicjalizuj wszystkie funkcje
        initCardAnimations();
        initSmoothScrolling();
        initParallaxEffect();
        initSliderUpdates();
        initRippleEffect();
        
        // Pokaż powitalną notyfikację
        setTimeout(() => {
            showNotification('Modern Admin Styler V2 został załadowany!', 'success');
        }, 1000);
        
        console.log('✅ Modern UI/UX załadowany pomyślnie!');
    }

    // Uruchom po załadowaniu DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initModernUI);
    } else {
        initModernUI();
    }

    // Dodaj globalne style dla lepszej wydajności
    const modernStyles = document.createElement('style');
    modernStyles.textContent = `
        /* Optymalizacje wydajności */
        .mas-v2-card,
        .mas-v2-btn,
        .mas-v2-nav-tab {
            will-change: transform;
            transform: translateZ(0);
        }
        
        /* Smooth scrolling */
        html {
            scroll-behavior: smooth;
        }
        
        /* Loading skeleton */
        .mas-v2-skeleton {
            background: linear-gradient(90deg, 
                rgba(255,255,255,0.1) 25%, 
                rgba(255,255,255,0.2) 50%, 
                rgba(255,255,255,0.1) 75%
            );
            background-size: 200% 100%;
            animation: skeleton-loading 1.5s infinite;
        }
        
        @keyframes skeleton-loading {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
        }
        
        /* Ulepszone focus states */
        .mas-v2-btn:focus-visible,
        .mas-v2-input:focus-visible,
        .mas-v2-nav-tab:focus-visible {
            outline: 2px solid var(--mas-primary);
            outline-offset: 2px;
            box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
        }
    `;

    document.head.appendChild(modernStyles);

    /* === MODERN ADMIN STYLER V2 - THEME SYSTEM === */
    /* System motywów z obsługą ciemnego i jasnego trybu */

    // ThemeManager usunięty - zarządzanie motywem przeniesione do admin-global.js

    // Inicjalizacja managera motywów
    const themeManager = new ThemeManager();

    // === ENHANCED TYPOGRAPHY ANIMATIONS === */
    class TypographyAnimations {
        constructor() {
            this.init();
        }

        init() {
            this.animateHeaders();
            this.setupTextReveal();
            this.enhanceFontLoading();
        }

        animateHeaders() {
            const headers = document.querySelectorAll('h1, h2, h3, h4, h5, h6, .mas-v2-title');
            
            headers.forEach((header, index) => {
                header.style.opacity = '0';
                header.style.transform = 'translateY(20px)';
                header.style.transition = 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
                
                setTimeout(() => {
                    header.style.opacity = '1';
                    header.style.transform = 'translateY(0)';
                }, index * 100 + 200);
            });
        }

        setupTextReveal() {
            const textElements = document.querySelectorAll('.mas-v2-section-description, .mas-v2-subtitle');
            
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.style.opacity = '1';
                        entry.target.style.transform = 'translateY(0)';
                    }
                });
            }, { threshold: 0.1 });

            textElements.forEach(element => {
                element.style.opacity = '0';
                element.style.transform = 'translateY(15px)';
                element.style.transition = 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)';
                observer.observe(element);
            });
        }

        enhanceFontLoading() {
            // Sprawdź czy fonty Inter i JetBrains Mono są załadowane
            if ('fonts' in document) {
                Promise.all([
                    document.fonts.load('400 16px Inter'),
                    document.fonts.load('600 16px Inter'),
                    document.fonts.load('700 16px Inter'),
                    document.fonts.load('400 14px "JetBrains Mono"')
                ]).then(() => {
                    document.body.classList.add('fonts-loaded');
                    
                    // Animacja po załadowaniu fontów
                    const elements = document.querySelectorAll('.mas-v2-admin-wrapper *');
                    elements.forEach(el => {
                        if (el.style.fontFamily) {
                            el.style.fontDisplay = 'swap';
                        }
                    });
                }).catch(() => {
                    // Fallback jeśli fonty się nie załadują
                    console.warn('Nie udało się załadować niestandardowych fontów');
                });
            }
        }
    }

    // Inicjalizacja animacji typografii
    const typographyAnimations = new TypographyAnimations();

    // === ENHANCED THEME TOGGLE FUNCTIONALITY === */
    // Dodatkowe ulepszenia dla przełącznika motywów

    // Dodaj obsługę skrótów klawiszowych
    document.addEventListener('keydown', function(e) {
        // Ctrl/Cmd + Shift + T - przełącz motyw
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'T') {
            e.preventDefault();
            if (window.themeManager) {
                themeManager.toggleTheme();
            }
        }
        
        // Ctrl/Cmd + Shift + L - przełącz Live Preview
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'L') {
            e.preventDefault();
            if (window.themeManager) {
                themeManager.toggleLivePreview();
            }
        }
    });

    // Dodaj obsługę gestów na urządzeniach dotykowych
    let touchStartX = 0;
    let touchStartY = 0;

    document.addEventListener('touchstart', function(e) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
    });

    document.addEventListener('touchend', function(e) {
        if (!touchStartX || !touchStartY) return;
        
        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;
        
        const diffX = touchStartX - touchEndX;
        const diffY = touchStartY - touchEndY;
        
        // Gest w dół z prawej strony ekranu (dla przełącznika motywów)
        if (Math.abs(diffY) > Math.abs(diffX) && 
            diffY < -100 && 
            touchStartX > window.innerWidth * 0.8 &&
            touchStartY < 150) {
            
            if (window.themeManager) {
                themeManager.toggleTheme();
            }
        }
        
        touchStartX = 0;
        touchStartY = 0;
    });

    // Automatyczne wykrywanie zmiany motywu systemowego
    if (window.matchMedia) {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        
        // Nasłuchuj zmian preferencji systemowych
        mediaQuery.addEventListener('change', function(e) {
            // Tylko jeśli użytkownik nie ma własnych preferencji
            if (!localStorage.getItem('mas-theme')) {
                const newTheme = e.matches ? 'dark' : 'light';
                if (window.themeManager && themeManager.currentTheme !== newTheme) {
                    themeManager.applyTheme(newTheme);
                }
            }
        });
    }

    // Dodaj tooltips dla przełącznika motywów
    function addThemeToggleTooltip() {
        const toggle = document.querySelector('.mas-theme-toggle');
        if (!toggle) return;
        
        let tooltip = null;
        
        toggle.addEventListener('mouseenter', function() {
            const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
            const tooltipText = currentTheme === 'light' ? 
                'Przełącz na tryb ciemny (Ctrl+Shift+T)' : 
                'Przełącz na tryb jasny (Ctrl+Shift+T)';
            
            tooltip = document.createElement('div');
            tooltip.className = 'mas-theme-tooltip';
            tooltip.textContent = tooltipText;
            tooltip.style.cssText = `
                position: fixed;
                background: var(--mas-glass);
                backdrop-filter: blur(16px);
                color: var(--mas-text-primary);
                padding: 8px 12px;
                border-radius: 8px;
                font-size: 12px;
                font-weight: 500;
                white-space: nowrap;
                z-index: 1000000;
                pointer-events: none;
                box-shadow: var(--mas-shadow-lg);
                border: 1px solid var(--mas-glass-border);
                transform: translateY(-10px);
                opacity: 0;
                transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
            `;
            
            document.body.appendChild(tooltip);
            
            // Pozycjonowanie tooltipa
            const rect = toggle.getBoundingClientRect();
            tooltip.style.top = (rect.top - tooltip.offsetHeight - 10) + 'px';
            tooltip.style.left = (rect.left + rect.width/2 - tooltip.offsetWidth/2) + 'px';
            
            // Animacja wejścia
            requestAnimationFrame(() => {
                tooltip.style.opacity = '1';
                tooltip.style.transform = 'translateY(0)';
            });
        });
        
        toggle.addEventListener('mouseleave', function() {
            if (tooltip) {
                tooltip.style.opacity = '0';
                tooltip.style.transform = 'translateY(-10px)';
                setTimeout(() => {
                    if (tooltip && tooltip.parentNode) {
                        tooltip.parentNode.removeChild(tooltip);
                    }
                    tooltip = null;
                }, 200);
            }
        });
    }

    // Dodaj tooltips dla przełącznika Live Preview
    function addLivePreviewTooltip() {
        const toggle = document.querySelector('.mas-live-preview-toggle');
        if (!toggle) return;
        
        let tooltip = null;
        
        toggle.addEventListener('mouseenter', function() {
            const isActive = toggle.classList.contains('active');
            const tooltipText = isActive ? 
                'Live Preview aktywny - kliknij aby wyłączyć (Ctrl+Shift+L)' : 
                'Kliknij aby włączyć Live Preview (Ctrl+Shift+L)';
            
            tooltip = document.createElement('div');
            tooltip.className = 'mas-live-preview-tooltip';
            tooltip.textContent = tooltipText;
            tooltip.style.cssText = `
                position: fixed;
                background: var(--mas-glass);
                backdrop-filter: blur(16px);
                color: var(--mas-text-primary);
                padding: 8px 12px;
                border-radius: 8px;
                font-size: 12px;
                font-weight: 500;
                white-space: nowrap;
                z-index: 1000000;
                pointer-events: none;
                box-shadow: var(--mas-shadow-lg);
                border: 1px solid rgba(16, 185, 129, 0.3);
                transform: translateY(-10px);
                opacity: 0;
                transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
            `;
            
            document.body.appendChild(tooltip);
            
            // Pozycjonowanie tooltipa
            const rect = toggle.getBoundingClientRect();
            tooltip.style.top = (rect.top - tooltip.offsetHeight - 10) + 'px';
            tooltip.style.left = (rect.left + rect.width/2 - tooltip.offsetWidth/2) + 'px';
            
            // Animacja wejścia
            requestAnimationFrame(() => {
                tooltip.style.opacity = '1';
                tooltip.style.transform = 'translateY(0)';
            });
        });
        
        toggle.addEventListener('mouseleave', function() {
            if (tooltip) {
                tooltip.style.opacity = '0';
                tooltip.style.transform = 'translateY(-10px)';
                setTimeout(() => {
                    if (tooltip && tooltip.parentNode) {
                        tooltip.parentNode.removeChild(tooltip);
                    }
                    tooltip = null;
                }, 200);
            }
        });
    }

    // Inicjalizuj tooltips po załadowaniu DOM
    document.addEventListener('DOMContentLoaded', function() {
        setTimeout(() => {
            addThemeToggleTooltip();
            addLivePreviewTooltip();
        }, 500);
    });

    // Dodaj obsługę preferencji użytkownika dla animacji
    function respectMotionPreferences() {
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        
        if (prefersReducedMotion) {
            document.documentElement.style.setProperty('--mas-transition', 'none');
            document.documentElement.style.setProperty('--mas-transition-fast', 'none');
            document.documentElement.style.setProperty('--mas-transition-slow', 'none');
        }
    }

    // Sprawdź preferencje animacji przy ładowaniu
    respectMotionPreferences();

    // Nasłuchuj zmian preferencji animacji
    if (window.matchMedia) {
        window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', respectMotionPreferences);
    }

    // Eksportuj themeManager dla globalnego dostępu
    window.themeManager = themeManager;

    // Debug info w konsoli (tylko w trybie development)
    if (window.location.hostname === 'localhost' || window.location.hostname.includes('local')) {
        console.log('🎨 Modern Admin Styler V2 - Theme System loaded');
        console.log('Current theme:', themeManager.currentTheme);
        console.log('Available shortcuts: Ctrl+Shift+T (toggle theme), Ctrl+Shift+L (toggle live preview)');
    }

    // === MODERN DASHBOARD INTERACTIONS === */
    // Inspirowane nowoczesnymi dashboard UI

    // ModernDashboard usunięty - zawierał tylko demo content

    /**
     * Media Upload Handler dla logo
     */
    class MediaUploadHandler {
            // Sprawdź czy już istnieją karty metryki
            if (document.querySelector('.mas-v2-metrics-grid')) return;

            const wrapper = document.querySelector('.mas-v2-admin-wrapper');
            if (!wrapper) return;

            // Znajdź header
            const header = wrapper.querySelector('.mas-v2-header');
            if (!header) return;

            // Stwórz grid z metrykami
            const metricsGrid = document.createElement('div');
            metricsGrid.className = 'mas-v2-metrics-grid';

            const metrics = [
                {
                    icon: '📊',
                    value: '2,847',
                    label: 'Aktywne style',
                    trend: '+12%',
                    trendType: 'positive',
                    gradient: 'purple'
                },
                {
                    icon: '🎨',
                    value: '156',
                    label: 'Komponenty UI',
                    trend: '+8%',
                    trendType: 'positive',
                    gradient: 'pink'
                },
                {
                    icon: '⚡',
                    value: '98.5%',
                    label: 'Wydajność',
                    trend: '+2%',
                    trendType: 'positive',
                    gradient: 'orange'
                },
                {
                    icon: '👥',
                    value: '1,234',
                    label: 'Użytkownicy',
                    trend: '+24%',
                    trendType: 'positive',
                    gradient: 'green'
                }
            ];

            metrics.forEach((metric, index) => {
                const card = this.createMetricCard(metric, index);
                metricsGrid.appendChild(card);
            });

            // Wstaw po headerze
            header.insertAdjacentElement('afterend', metricsGrid);
        }

        createMetricCard(metric, index) {
            const card = document.createElement('div');
            card.className = `mas-v2-metric-card ${metric.gradient}`;
            card.style.animationDelay = `${index * 0.1}s`;
            
            card.innerHTML = `
                <div class="mas-v2-metric-header">
                    <div class="mas-v2-metric-icon">${metric.icon}</div>
                    <div class="mas-v2-metric-trend ${metric.trendType}">
                        ${metric.trendType === 'positive' ? '↗' : '↘'} ${metric.trend}
                    </div>
                </div>
                <div class="mas-v2-metric-value" data-target="${metric.value.replace(/[^\d.]/g, '')}">${metric.value}</div>
                <div class="mas-v2-metric-label">${metric.label}</div>
                <div class="mas-v2-mini-chart">
                    <div class="mas-v2-chart-line"></div>
                </div>
            `;

            // Dodaj hover effect
            card.addEventListener('mouseenter', () => {
                card.style.transform = 'translateY(-8px) scale(1.02)';
            });

            card.addEventListener('mouseleave', () => {
                card.style.transform = 'translateY(0) scale(1)';
            });

            return card;
        }

        initProgressBars() {
            // Stwórz przykładowe progress bary
            const cards = document.querySelectorAll('.mas-v2-card');
            
            cards.forEach((card, index) => {
                if (card.querySelector('.mas-v2-progress')) return;

                const progress = document.createElement('div');
                progress.className = 'mas-v2-progress';
                progress.innerHTML = `<div class="mas-v2-progress-bar" data-progress="${60 + (index * 10)}"></div>`;
                
                card.appendChild(progress);
            });

            // Animuj progress bary
            setTimeout(() => {
                document.querySelectorAll('.mas-v2-progress-bar').forEach(bar => {
                    const progress = bar.dataset.progress;
                    bar.style.width = progress + '%';
                });
            }, 500);
        }

        initToggleSwitches() {
            // Dodaj toggle switches do kart
            const cards = document.querySelectorAll('.mas-v2-card');
            
            cards.forEach((card, index) => {
                if (card.querySelector('.mas-v2-toggle-switch')) return;

                const cardHeader = card.querySelector('.mas-v2-card-header');
                if (!cardHeader) return;

                const toggle = document.createElement('div');
                toggle.className = 'mas-v2-toggle-switch';
                if (index % 2 === 0) toggle.classList.add('active');
                
                toggle.addEventListener('click', () => {
                    toggle.classList.toggle('active');
                    
                    // Ripple effect
                    const ripple = document.createElement('div');
                    ripple.style.cssText = `
                        position: absolute;
                        border-radius: 50%;
                        background: rgba(255,255,255,0.6);
                        transform: scale(0);
                        animation: ripple 0.6s linear;
                        pointer-events: none;
                    `;
                    
                    const rect = toggle.getBoundingClientRect();
                    const size = Math.max(rect.width, rect.height);
                    ripple.style.width = ripple.style.height = size + 'px';
                    ripple.style.left = '50%';
                    ripple.style.top = '50%';
                    ripple.style.marginLeft = -size/2 + 'px';
                    ripple.style.marginTop = -size/2 + 'px';
                    
                    toggle.appendChild(ripple);
                    
                    setTimeout(() => ripple.remove(), 600);
                });

                cardHeader.appendChild(toggle);
            });
        }

        initFloatingActionButton() {
            // Sprawdź czy już istnieje
            if (document.querySelector('.mas-v2-fab')) return;

            const fab = document.createElement('button');
            fab.className = 'mas-v2-fab';
            fab.innerHTML = '⚙️';
            fab.title = 'Szybkie ustawienia';
            
            fab.addEventListener('click', () => {
                // Animacja kliknięcia
                fab.style.transform = 'scale(0.9)';
                setTimeout(() => {
                    fab.style.transform = 'scale(1.1)';
                    setTimeout(() => {
                        fab.style.transform = 'scale(1)';
                    }, 100);
                }, 100);

                // Pokaż menu szybkich akcji
                this.showQuickMenu(fab);
            });

            document.body.appendChild(fab);
        }

        showQuickMenu(fab) {
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

        initCardAnimations() {
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

        initCounterAnimations() {
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

        initInteractiveElements() {
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

        initSliders() {
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
                    
                    // Live preview if enabled
                    if (this.livePreviewEnabled) {
                        this.applyLivePreview(slider);
                    }
                };

                // Update on input
                slider.addEventListener('input', updateValue);
                
                // Initial update
                updateValue();
            });
        }
    }

    // Inicjalizuj Modern Dashboard
    const modernDashboard = new ModernDashboard();

    // === WORDPRESS SUBMENU ENHANCEMENT === */
    // Dodatkowa obsługa submenu WordPress

    // WordPressSubmenuHandler removed - submenu styling now handled by CSS only

    /**
     * Media Upload Handler dla logo
     */
    class MediaUploadHandler {
        constructor() {
            this.frame = null;
            this.init();
        }

        init() {
            this.bindEvents();
            this.initImagePreviews();
        }

        bindEvents() {
            // Upload button clicks
            $(document).on('click', '.mas-v2-upload-btn', this.openMediaUploader.bind(this));
        }

        openMediaUploader(e) {
            e.preventDefault();
            
            const button = $(e.currentTarget);
            const targetInputId = button.data('target');
            const targetInput = $('#' + targetInputId);
            
            // Create media frame if not exists
            if (this.frame) {
                this.frame.open();
                return;
            }

            // Create new media frame
            this.frame = wp.media({
                title: 'Wybierz logo',
                button: {
                    text: 'Użyj tego obrazu'
                },
                library: {
                    type: 'image'
                },
                multiple: false
            });

            // Handle selection
            this.frame.on('select', () => {
                const attachment = this.frame.state().get('selection').first().toJSON();
                targetInput.val(attachment.url).trigger('change');
                
                // Show preview if possible
                this.showImagePreview(targetInput, attachment.url);
                
                // Trigger live preview
                if (window.MAS && typeof window.MAS.triggerLivePreview === 'function') {
                    MAS.triggerLivePreview();
                    MAS.markAsChanged();
                }
            });

            this.frame.open();
        }

        showImagePreview(input, imageUrl) {
            // Remove existing preview
            input.siblings('.mas-v2-image-preview').remove();
            
            // Add new preview
            const preview = $(`
                <div class="mas-v2-image-preview" style="margin-top: 10px;">
                    <img src="${imageUrl}" style="max-width: 100px; max-height: 60px; border: 1px solid #ddd; border-radius: 4px;">
                    <button type="button" class="mas-v2-remove-image button button-small" style="margin-left: 10px;">Usuń</button>
                </div>
            `);
            
            input.after(preview);
            
            // Handle remove
            preview.find('.mas-v2-remove-image').on('click', (e) => {
                e.preventDefault();
                input.val('').trigger('change');
                preview.remove();
                
                if (window.MAS && typeof window.MAS.triggerLivePreview === 'function') {
                    MAS.triggerLivePreview();
                    MAS.markAsChanged();
                }
            });
        }

        initImagePreviews() {
            // Show existing image previews
            $('.mas-v2-upload-field input[type="url"]').each((index, input) => {
                const $input = $(input);
                const imageUrl = $input.val();
                if (imageUrl) {
                    this.showImagePreview($input, imageUrl);
                }
            });
        }
    }

    // Initialize media upload handler
    document.addEventListener('DOMContentLoaded', () => {
        if (typeof wp !== 'undefined' && wp.media) {
            new MediaUploadHandler();
        }
    });

    // Initialize for case when script loads after DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            if (typeof wp !== 'undefined' && wp.media) {
                new MediaUploadHandler();
            }
        });
    } else {
        if (typeof wp !== 'undefined' && wp.media) {
            new MediaUploadHandler();
        }
    }

})(jQuery);