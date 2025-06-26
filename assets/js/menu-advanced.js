/**
 * Modern Admin Styler V2 - Advanced Menu JavaScript
 * Handles submenu animations and conditional field display
 */

(function($) {
    'use strict';

    // Initialize when document is ready
    $(document).ready(function() {
        initConditionalFields();
        // initSubmenuAnimations(); // WYŁĄCZONE - powoduje konflikty, animacje są teraz w CSS
        initColorPreview();
        initSliderValues();
        initScrollbarPreview();
    });

    /**
     * Initialize conditional field display logic
     */
    function initConditionalFields() {
        // Handle conditional fields based on checkbox/select values
        $('.conditional-field').each(function() {
            const $field = $(this);
            const showWhen = $field.data('show-when');
            const showValue = $field.data('show-value');
            const hideValue = $field.data('show-value-not');
            
            if (showWhen) {
                const $trigger = $(`#${showWhen}, [name="${showWhen}"]`);
                
                if ($trigger.length) {
                    // Initial state
                    toggleConditionalField($field, $trigger, showValue, hideValue);
                    
                    // Listen for changes
                    $trigger.on('change', function() {
                        toggleConditionalField($field, $trigger, showValue, hideValue);
                    });
                }
            }
        });
    }

    /**
     * Toggle conditional field visibility
     */
    function toggleConditionalField($field, $trigger, showValue, hideValue) {
        const triggerValue = $trigger.is(':checkbox') ? ($trigger.is(':checked') ? '1' : '0') : $trigger.val();
        let shouldShow = false;

        if (hideValue !== undefined) {
            // Show when value is NOT equal to hideValue
            shouldShow = triggerValue !== hideValue;
        } else if (showValue !== undefined) {
            // Show when value equals showValue
            shouldShow = triggerValue === showValue;
        }

        if (shouldShow) {
            $field.slideDown(300).removeClass('mas-hidden');
        } else {
            $field.slideUp(300).addClass('mas-hidden');
        }
    }

    /**
     * Initialize color preview functionality
     */
    function initColorPreview() {
        // Add real-time color preview for individual menu items
        $('.mas-v2-color-mini').on('change input', function() {
            const $input = $(this);
            const colorValue = $input.val();
            const fieldName = $input.attr('name');
            
            // Add visual feedback
            $input.css('border-color', colorValue);
            
            // Optionally add live preview (requires more complex implementation)
            if (fieldName && fieldName.includes('menu_individual_colors')) {
                // This could trigger a live preview update
                // For now, just add visual feedback
                $input.closest('.mas-v2-color-field').find('.mas-v2-label-mini').css('color', colorValue);
            }
        });

        // Reset color picker styles on focus out
        $('.mas-v2-color-mini').on('blur', function() {
            $(this).css('border-color', '');
            $(this).closest('.mas-v2-color-field').find('.mas-v2-label-mini').css('color', '');
        });
    }

    /**
     * Initialize slider value displays
     */
    function initSliderValues() {
        // Update slider value displays in real-time
        $('.mas-v2-slider').on('input change', function() {
            const $slider = $(this);
            const value = $slider.val();
            const sliderId = $slider.attr('id');
            const $valueDisplay = $(`.mas-v2-slider-value[data-target="${sliderId}"]`);
            
            if ($valueDisplay.length) {
                let displayValue = value;
                
                // Add appropriate units based on slider type
                if (sliderId.includes('duration')) {
                    displayValue += 'ms';
                } else if (sliderId.includes('width') || sliderId.includes('spacing') || 
                          sliderId.includes('padding') || sliderId.includes('indent')) {
                    displayValue += 'px';
                }
                
                $valueDisplay.text(displayValue);
            }
        });
    }

    /**
     * Reinitialize animations when settings change
     */
    $(document).on('change', '#submenu_animation, #submenu_animation_duration', function() {
        // Reinitialize submenu animations with new settings
        // setTimeout(initSubmenuAnimations, 100); // WYŁĄCZONE
    });

    /**
     * Handle icon library changes
     */
    $(document).on('change', '#menu_icon_library', function() {
        const library = $(this).val();
        const $iconFields = $('.mas-v2-icon-field input');
        
        // Update placeholders based on selected library
        $iconFields.each(function() {
            const $input = $(this);
            let placeholder = '';
            
            switch (library) {
                case 'dashicons':
                    placeholder = 'np. dashicons-admin-home';
                    break;
                case 'fontawesome':
                    placeholder = 'np. fas fa-home';
                    break;
                case 'custom':
                    placeholder = 'URL do ikony SVG';
                    break;
            }
            
            $input.attr('placeholder', placeholder);
        });
    });

    /**
     * Initialize scrollbar preview functionality
     */
    function initScrollbarPreview() {
        // Add scrollbar preview boxes to configuration sections
        const mainScrollbarConfig = $('.mas-v2-scrollbar-config');
        const submenuScrollbarConfig = $('.mas-v2-submenu-scrollbar-config');
        
        if (mainScrollbarConfig.length) {
            const previewHtml = `
                <div class="mas-v2-scrollbar-preview">
                    <div class="mas-v2-scrollbar-preview-content">
                        <div>📜 Podgląd scrollbar</div>
                        <div>Przewijaj aby zobaczyć efekt</div>
                        <div>Możesz dostosować szerokość, kolory i styl</div>
                        <div>Auto-ukrywanie sprawia, że scrollbar pojawia się tylko podczas przewijania</div>
                    </div>
                </div>
            `;
            mainScrollbarConfig.prepend(previewHtml);
        }
        
        // Update scrollbar styles in real-time
        $('#menu_scrollbar_width, #menu_scrollbar_corner_radius').on('input', updateScrollbarPreview);
        $('#menu_scrollbar_track_color, #menu_scrollbar_thumb_color, #menu_scrollbar_thumb_hover_color').on('change', updateScrollbarPreview);
        $('#menu_scrollbar_style').on('change', updateScrollbarPreview);
        
        // Initial preview update
        updateScrollbarPreview();
    }
    
    /**
     * Update scrollbar preview in real-time
     */
    function updateScrollbarPreview() {
        const $preview = $('.mas-v2-scrollbar-preview');
        if (!$preview.length) return;
        
        const width = $('#menu_scrollbar_width').val() || 8;
        const cornerRadius = $('#menu_scrollbar_corner_radius').val() || 4;
        const trackColor = $('#menu_scrollbar_track_color').val() || 'rgba(255,255,255,0.05)';
        const thumbColor = $('#menu_scrollbar_thumb_color').val() || '#0073aa';
        const thumbHoverColor = $('#menu_scrollbar_thumb_hover_color').val() || '#005a87';
        const style = $('#menu_scrollbar_style').val() || 'modern';
        
        // Create unique ID for this preview
        const previewId = 'mas-scrollbar-preview-' + Date.now();
        $preview.attr('id', previewId);
        
        // Generate scrollbar CSS for preview
        let previewCSS = `
            #${previewId}::-webkit-scrollbar {
                width: ${width}px !important;
            }
            #${previewId}::-webkit-scrollbar-track {
                background: ${trackColor} !important;
                border-radius: ${cornerRadius}px !important;
            }
            #${previewId}::-webkit-scrollbar-thumb {
                border-radius: ${cornerRadius}px !important;
        `;
        
        switch (style) {
            case 'modern':
                previewCSS += `
                    background: linear-gradient(to bottom, ${thumbColor}, ${adjustBrightness(thumbColor, -20)}) !important;
                    border: 1px solid rgba(255,255,255,0.1) !important;
                    box-shadow: inset 0 1px 2px rgba(255,255,255,0.2) !important;
                `;
                break;
            case 'minimal':
                previewCSS += `background: ${thumbColor} !important;`;
                break;
            case 'classic':
                previewCSS += `
                    background: ${thumbColor} !important;
                    border: 1px solid rgba(0,0,0,0.2) !important;
                    box-shadow: inset 0 1px 1px rgba(255,255,255,0.3) !important;
                `;
                break;
        }
        
        previewCSS += `
            }
            #${previewId}::-webkit-scrollbar-thumb:hover {
                background: ${thumbHoverColor} !important;
            }
        `;
        
        // Remove old preview styles and add new ones
        $('#mas-scrollbar-preview-styles').remove();
        $('<style id="mas-scrollbar-preview-styles">' + previewCSS + '</style>').appendTo('head');
    }
    
    /**
     * Simple brightness adjustment for preview
     */
    function adjustBrightness(hex, percent) {
        // Simple implementation for preview
        if (!hex || hex.indexOf('#') !== 0) return hex;
        
        const num = parseInt(hex.slice(1), 16);
        const r = Math.max(0, Math.min(255, (num >> 16) + (num >> 16) * percent / 100));
        const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + ((num >> 8) & 0x00FF) * percent / 100));
        const b = Math.max(0, Math.min(255, (num & 0x0000FF) + (num & 0x0000FF) * percent / 100));
        
        return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    }

    /**
     * Add keyboard shortcuts for quick menu customization
     */
    $(document).on('keydown', function(e) {
        // Ctrl+Shift+M - Focus menu customization
        if (e.ctrlKey && e.shiftKey && e.key === 'M') {
            e.preventDefault();
            $('.mas-v2-tab-button[data-tab="menu"]').click();
            $('#menu_width').focus();
        }
        
        // Ctrl+Shift+S - Focus scrollbar customization
        if (e.ctrlKey && e.shiftKey && e.key === 'S') {
            e.preventDefault();
            $('.mas-v2-tab-button[data-tab="menu"]').click();
            $('#menu_scrollbar_enabled').focus();
        }
    });

})(jQuery); 