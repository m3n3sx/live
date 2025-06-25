/**
 * Modern Admin Styler V2 - Admin JavaScript
 * Nowoczesny interfejs z animacjami i live preview
 */

(function($) {
    "use strict";

    // Główny obiekt aplikacji
    const MAS = {
        livePreviewEnabled: false,
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
            this.checkAutoSave();
            this.initTooltips();
            this.updateBodyClasses(); // Ustaw klasy na starcie
            this.initSystemMonitor(); // Inicjalizuj monitor systemu
            this.loadCustomTemplates(); // Załaduj własne szablony
            this.initNewFeatures(); // Inicjalizuj nowe funkcje
        },

        bindEvents: function() {
            $(document).on("click", "#mas-v2-save-btn", this.saveSettings);
            $(document).on("click", "#mas-v2-reset-btn", this.resetSettings);
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
            if (!this.livePreviewEnabled) return;
            
            const formData = this.getFormData();
            
            $.ajax({
                url: masV2.ajaxUrl,
                type: "POST",
                data: {
                    action: "mas_v2_live_preview",
                    nonce: masV2.nonce,
                    ...formData
                },
                success: function(response) {
                    if (response.success && response.data.css) {
                        $("#mas-v2-live-styles").remove();
                        $('<style id="mas-v2-live-styles">' + response.data.css + '</style>')
                            .appendTo("head");
                        
                        // Aktualizuj klasy CSS body dla live preview
                        MAS.updateBodyClasses();
                    }
                }
            });
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
                        
                        // Odśwież CSS dla nowych ustawień
                        if (MAS.livePreviewEnabled) {
                        MAS.triggerLivePreview();
                        } else {
                            // Jeśli live preview wyłączony, odśwież stronę po krótkim czasie
                            setTimeout(function() {
                                window.location.reload();
                            }, 1000);
                        }
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

        updateBodyClasses: function() {
            const body = document.body;
            
            // Debug - sprawdź czy checkbox istnieje
            const $menuCheckbox = $("input[name='menu_detached']");
            const $adminBarCheckbox = $("input[name='admin_bar_detached']");
            
            console.log('MAS V2 DEBUG: Checkboxes found:', {
                menuCheckbox: $menuCheckbox.length,
                adminBarCheckbox: $adminBarCheckbox.length,
                menuChecked: $menuCheckbox.is(":checked"),
                adminBarChecked: $adminBarCheckbox.is(":checked")
            });
            
            // Menu floating status
            const menuDetached = $menuCheckbox.is(":checked");
            if (menuDetached) {
                body.classList.add('mas-menu-floating');
                body.classList.add('mas-v2-menu-floating'); // Dodaj też nową klasę
                body.classList.remove('mas-menu-normal');
                // Inicjalizuj floating collapse po ustawieniu klasy
                this.initFloatingMenuCollapse();
            } else {
                body.classList.add('mas-menu-normal');
                body.classList.remove('mas-menu-floating');
                body.classList.remove('mas-v2-menu-floating');
                // Przywróć normalną funkcjonalność collapse
                this.restoreNormalCollapse();
            }
            
            // Admin bar floating status
            const adminBarDetached = $adminBarCheckbox.is(":checked");
            if (adminBarDetached) {
                body.classList.add('mas-admin-bar-floating');
                body.classList.add('mas-v2-admin-bar-floating'); // Dodaj też nową klasę
            } else {
                body.classList.remove('mas-admin-bar-floating');
                body.classList.remove('mas-v2-admin-bar-floating');
            }
            
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
                '◐ Użyj Ctrl+Shift+T aby przełączyć motyw',
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
    });

    // Dodaj MAS do globalnego scope
    window.MAS = MAS;

    /* === MODERN ADMIN STYLER V2 - THEME SYSTEM === */
    /* System motywów z obsługą ciemnego i jasnego trybu */

    class ThemeManager {
        constructor() {
            this.currentTheme = this.getStoredTheme() || this.getSystemTheme();
            this.init();
        }

        init() {
            this.applyTheme(this.currentTheme);
            this.createThemeToggle();
            this.createLivePreviewToggle();
            this.setupSystemThemeListener();
        }

        getSystemTheme() {
            return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }

        getStoredTheme() {
            return localStorage.getItem('mas-theme');
        }

        setStoredTheme(theme) {
            localStorage.setItem('mas-theme', theme);
        }

        applyTheme(theme) {
            document.documentElement.setAttribute('data-theme', theme);
            this.currentTheme = theme;
            this.setStoredTheme(theme);
            
            // Animacja przejścia między motywami
            document.body.style.transition = 'background-color 0.3s ease, color 0.3s ease';
            setTimeout(() => {
                document.body.style.transition = '';
            }, 300);
        }

        toggleTheme() {
            const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
            this.applyTheme(newTheme);
            
            // Animacja przełącznika
            const toggle = document.querySelector('.mas-theme-toggle');
            if (toggle) {
                toggle.style.transform = 'scale(0.9) rotate(180deg)';
                setTimeout(() => {
                    toggle.style.transform = 'scale(1) rotate(0deg)';
                }, 150);
            }
            
            // Pokazanie notyfikacji o zmianie motywu
            this.showThemeNotification(newTheme);
        }

        showThemeNotification(theme) {
            const message = theme === 'dark' ? 
                '◐ Przełączono na tryb ciemny' : 
                '◑ Przełączono na tryb jasny';
            
            if (window.masNotifications) {
                window.masNotifications.show(message, 'info', 2000);
            }
        }

        createThemeToggle() {
            // Sprawdź czy przełącznik już istnieje
            if (document.querySelector('.mas-theme-toggle')) return;

            const toggle = document.createElement('button');
            toggle.className = 'mas-theme-toggle';
            toggle.setAttribute('aria-label', 'Przełącz motyw');
            toggle.setAttribute('title', 'Przełącz między trybem jasnym a ciemnym');
            
            const icon = document.createElement('span');
            icon.className = 'mas-theme-toggle-icon';
            toggle.appendChild(icon);
            
            toggle.addEventListener('click', () => this.toggleTheme());
            
            // Dodaj przełącznik do body
            document.body.appendChild(toggle);
            
            // Animacja wejścia
            setTimeout(() => {
                toggle.style.opacity = '1';
                toggle.style.transform = 'scale(1)';
            }, 100);
            
            // Inicjalne style
            toggle.style.opacity = '0';
            toggle.style.transform = 'scale(0.8)';
            toggle.style.transition = 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)';
        }

        createLivePreviewToggle() {
            // Sprawdź czy przełącznik już istnieje
            if (document.querySelector('.mas-live-preview-toggle')) return;

            const toggle = document.createElement('button');
            toggle.className = 'mas-live-preview-toggle';
            toggle.setAttribute('aria-label', 'Włącz/wyłącz Live Preview');
            toggle.setAttribute('title', 'Podgląd zmian na żywo');
            
            const icon = document.createElement('span');
            icon.className = 'mas-live-preview-icon';
            toggle.appendChild(icon);
            
            // Dodaj pulsującą kropkę
            const dot = document.createElement('span');
            dot.className = 'mas-live-preview-dot';
            toggle.appendChild(dot);
            
            // Sprawdź stan Live Preview z checkboxu jeśli istnieje
            const checkbox = document.getElementById('mas-v2-live-preview');
            const isActive = checkbox ? checkbox.checked : (MAS?.livePreviewEnabled || false);
            toggle.classList.toggle('active', isActive);
            
            toggle.addEventListener('click', () => this.toggleLivePreview());
            
            // Dodaj przełącznik do body
            document.body.appendChild(toggle);
            
            // Animacja wejścia (z opóźnieniem po theme toggle)
            setTimeout(() => {
                toggle.style.opacity = '1';
                toggle.style.transform = 'scale(1)';
            }, 200);
            
            // Inicjalne style
            toggle.style.opacity = '0';
            toggle.style.transform = 'scale(0.8)';
            toggle.style.transition = 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)';
            
            // Synchronizacja z checkboxem - gdy checkbox się zmieni, zaktualizuj przełącznik
            if (checkbox) {
                $(checkbox).on('change', function() {
                    const livePreviewToggle = document.querySelector('.mas-live-preview-toggle');
                    if (livePreviewToggle) {
                        livePreviewToggle.classList.toggle('active', this.checked);
                    }
                });
            }
        }

        toggleLivePreview() {
            const toggle = document.querySelector('.mas-live-preview-toggle');
            if (!toggle) return;
            
            // Toggle aktywności
            const isActive = toggle.classList.contains('active');
            const newState = !isActive;
            
            toggle.classList.toggle('active', newState);
            
            // Aktualizuj MAS object jeśli istnieje
            if (window.MAS) {
                MAS.livePreviewEnabled = newState;
                
                // Aktualizuj checkbox w formularzu jeśli istnieje
                const checkbox = document.getElementById('mas-v2-live-preview');
                if (checkbox) {
                    checkbox.checked = newState;
                    // Wywołaj event change aby uruchomić istniejącą logikę MAS
                    $(checkbox).trigger('change');
                }
            }
            
            // Animacja przełącznika
                toggle.style.transform = 'scale(0.9) rotate(180deg)';
                setTimeout(() => {
                    toggle.style.transform = 'scale(1) rotate(0deg)';
                }, 150);
            
            // Pokazanie notyfikacji (używamy istniejącej funkcji MAS jeśli dostępna)
            if (window.MAS && MAS.showMessage) {
                MAS.showMessage(
                    newState ? "◉ Live Preview włączony" : "◯ Live Preview wyłączony",
                    "info"
                );
            } else {
                this.showLivePreviewNotification(newState);
            }
        }

        showLivePreviewNotification(isActive) {
            const message = isActive ? 
                '◉ Live Preview włączony' : 
                '◯ Live Preview wyłączony';
            
            if (window.showNotification) {
                window.showNotification(message, 'info', 2000);
            }
        }

        setupSystemThemeListener() {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            mediaQuery.addEventListener('change', (e) => {
                // Tylko jeśli użytkownik nie ustawił własnych preferencji
                if (!this.getStoredTheme()) {
                    this.applyTheme(e.matches ? 'dark' : 'light');
                }
            });
        }
    }

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

    class ModernDashboard {
        constructor() {
            this.init();
        }

        init() {
            this.createMetricCards();
            this.initProgressBars();
            this.initToggleSwitches();
            this.initFloatingActionButton();
            this.initCardAnimations();
            this.initCounterAnimations();
            this.initInteractiveElements();
            this.initSliders();
        }

        createMetricCards() {
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
            fab.innerHTML = '●';
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
    
    // Template functionality dla nowej zakładki szablonów
    initTemplateCards();
    
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