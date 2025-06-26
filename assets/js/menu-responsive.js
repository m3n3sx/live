/**
 * Modern Admin Styler V2 - Responsive Menu & Positioning JavaScript
 * Handles mobile menu behavior, positioning, and responsive features
 */

(function($) {
    'use strict';

    // Global responsive state
    let responsiveState = {
        isMobile: false,
        isTablet: false,
        mobileMenuActive: false,
        swipeStartX: 0,
        swipeStartY: 0,
        breakpoints: {
            mobile: 768,
            tablet: 1024
        },
        settings: {}
    };

    // Initialize when document is ready
    $(document).ready(function() {
        // Opóźnij inicjalizację jeśli body ma klasę mas-loading
        if (document.body.classList.contains('mas-loading')) {
            // Poczekaj aż klasa mas-loading zostanie usunięta
            setTimeout(function() {
                initResponsiveMenu();
                initPositioning();
                initSwipeGestures();
                initFloatingBehaviors();
                bindEvents();
                
                // Update on window resize
                $(window).on('resize', debounce(handleResize, 250));
                
                // Initial responsive check
                handleResize();
                         }, 700); // 200ms więcej niż czas usuwania mas-loading (500ms)
        } else {
            initResponsiveMenu();
            initPositioning();
            initSwipeGestures();
            initFloatingBehaviors();
            bindEvents();
            
            // Update on window resize
            $(window).on('resize', debounce(handleResize, 250));
            
            // Initial responsive check
            handleResize();
        }
    });

    /**
     * Initialize responsive menu system
     */
    function initResponsiveMenu() {
        const responsiveEnabled = $('#menu_responsive_enabled').is(':checked');
        
        if (!responsiveEnabled) return;
        
        // Get settings from form or use defaults
        updateSettingsFromForm();
        
        // Create mobile toggle button
        createMobileToggle();
        
        // Create mobile overlay
        createMobileOverlay();
        
        // Apply responsive classes
        applyResponsiveClasses();
        
        // Listen for setting changes
        bindResponsiveSettings();
    }

    /**
     * Update settings from form values
     */
    function updateSettingsFromForm() {
        responsiveState.settings = {
            mobileBreakpoint: parseInt($('#menu_mobile_breakpoint').val()) || 768,
            tabletBreakpoint: parseInt($('#menu_tablet_breakpoint').val()) || 1024,
            mobileBehavior: $('#menu_mobile_behavior').val() || 'collapse',
            togglePosition: $('#menu_mobile_toggle_position').val() || 'top-left',
            toggleStyle: $('#menu_mobile_toggle_style').val() || 'hamburger',
            mobileAnimation: $('#menu_mobile_animation').val() || 'slide',
            positionType: $('#menu_position_type').val() || 'default',
            positionTop: parseInt($('#menu_position_top').val()) || 32,
            positionLeft: parseInt($('#menu_position_left').val()) || 0,
            zIndex: parseInt($('#menu_position_z_index').val()) || 1000,
            touchFriendly: $('#menu_touch_friendly').is(':checked'),
            swipeGestures: $('#menu_swipe_gestures').is(':checked'),
            reduceAnimations: $('#menu_reduce_animations_mobile').is(':checked'),
            optimizePerformance: $('#menu_optimize_performance').is(':checked')
        };
        
        // Update CSS variables
        updateCSSVariables();
    }

    /**
     * Update CSS variables based on settings
     */
    function updateCSSVariables() {
        const root = document.documentElement;
        const settings = responsiveState.settings;
        
        root.style.setProperty('--mas-mobile-breakpoint', settings.mobileBreakpoint + 'px');
        root.style.setProperty('--mas-tablet-breakpoint', settings.tabletBreakpoint + 'px');
        root.style.setProperty('--mas-position-top', settings.positionTop + 'px');
        root.style.setProperty('--mas-position-left', settings.positionLeft + 'px');
        root.style.setProperty('--mas-position-z-index', settings.zIndex);
        
        if (settings.reduceAnimations) {
            root.style.setProperty('--mas-mobile-animation-speed', '100ms');
        }
    }

    /**
     * Create mobile toggle button
     */
    function createMobileToggle() {
        if ($('.mas-mobile-menu-toggle').length) return;
        
        const settings = responsiveState.settings;
        const toggleHTML = `
            <button class="mas-mobile-menu-toggle" 
                    aria-label="Toggle admin menu" 
                    aria-expanded="false">
                <span class="mas-sr-only">Menu</span>
            </button>
        `;
        
        $('body').append(toggleHTML);
        
        // Bind toggle events
        $('.mas-mobile-menu-toggle').on('click', toggleMobileMenu);
    }

    /**
     * Create mobile overlay
     */
    function createMobileOverlay() {
        if ($('.mas-mobile-overlay').length) return;
        
        const overlayHTML = '<div class="mas-mobile-overlay"></div>';
        $('body').append(overlayHTML);
        
        // Bind overlay events
        $('.mas-mobile-overlay').on('click', closeMobileMenu);
    }

    /**
     * Apply responsive classes to body
     */
    function applyResponsiveClasses() {
        const $body = $('body');
        const settings = responsiveState.settings;
        
        // Remove existing classes
        $body.removeClass(function(index, className) {
            return (className.match(/(^|\s)mas-\S+/g) || []).join(' ');
        });
        
        // Add responsive classes
        if ($('#menu_responsive_enabled').is(':checked')) {
            $body.addClass('mas-responsive-enabled');
        }
        
        // Add behavior classes
        $body.addClass(`mas-mobile-behavior-${settings.mobileBehavior}`);
        $body.addClass(`mas-toggle-${settings.togglePosition.replace('-', '-')}`);
        $body.addClass(`mas-toggle-${settings.toggleStyle}`);
        $body.addClass(`mas-animation-${settings.mobileAnimation}`);
        
        // Add positioning classes
        if (settings.positionType !== 'default') {
            $body.addClass(`mas-menu-position-${settings.positionType}`);
        }
        
        // Add floating classes if applicable
        if (settings.positionType === 'floating') {
            if ($('#menu_floating_shadow').is(':checked')) {
                $body.addClass('mas-floating-shadow');
            }
            if ($('#menu_floating_blur_background').is(':checked')) {
                $body.addClass('mas-floating-blur');
            }
            if ($('#menu_floating_auto_hide').is(':checked')) {
                $body.addClass('mas-floating-auto-hide');
            }
            if ($('#menu_floating_trigger_hover').is(':checked')) {
                $body.addClass('mas-floating-trigger-hover');
            }
        }
        
        // Add feature classes
        if (settings.touchFriendly) {
            $body.addClass('mas-touch-friendly');
        }
        if (settings.swipeGestures) {
            $body.addClass('mas-swipe-enabled');
        }
        if (settings.reduceAnimations) {
            $body.addClass('mas-reduce-animations');
        }
        if (settings.optimizePerformance) {
            $body.addClass('mas-optimize-performance');
        }
    }

    /**
     * Toggle mobile menu
     */
    function toggleMobileMenu() {
        if (responsiveState.mobileMenuActive) {
            closeMobileMenu();
        } else {
            openMobileMenu();
        }
    }

    /**
     * Open mobile menu
     */
    function openMobileMenu() {
        responsiveState.mobileMenuActive = true;
        
        $('body').addClass('mas-mobile-active');
        $('.mas-mobile-overlay').addClass('active').show();
        $('.mas-mobile-menu-toggle').attr('aria-expanded', 'true');
        
        // Focus management
        $('#adminmenu').attr('tabindex', '-1').focus();
        
        // Trigger animation
        const animation = responsiveState.settings.mobileAnimation;
        if (animation && animation !== 'none') {
            $('body').addClass(`mas-animation-${animation}`);
        }
    }

    /**
     * Close mobile menu
     */
    function closeMobileMenu() {
        responsiveState.mobileMenuActive = false;
        
        $('body').removeClass('mas-mobile-active');
        $('.mas-mobile-overlay').removeClass('active');
        $('.mas-mobile-menu-toggle').attr('aria-expanded', 'false');
        
        // Remove animation classes
        $('body').removeClass(function(index, className) {
            return (className.match(/(^|\s)mas-animation-\S+/g) || []).join(' ');
        });
        
        // Hide overlay after animation
        setTimeout(() => {
            if (!responsiveState.mobileMenuActive) {
                $('.mas-mobile-overlay').hide();
            }
        }, responsiveState.settings.reduceAnimations ? 100 : 250);
        
        // Focus management
        $('.mas-mobile-menu-toggle').focus();
    }

    /**
     * Handle window resize
     */
    function handleResize() {
        const width = $(window).width();
        const settings = responsiveState.settings;
        
        // Update responsive state
        responsiveState.isMobile = width <= settings.mobileBreakpoint;
        responsiveState.isTablet = width > settings.mobileBreakpoint && width <= settings.tabletBreakpoint;
        
        // Close mobile menu if window becomes larger
        if (!responsiveState.isMobile && responsiveState.mobileMenuActive) {
            closeMobileMenu();
        }
        
        // Update body classes for current state
        $('body')
            .toggleClass('mas-is-mobile', responsiveState.isMobile)
            .toggleClass('mas-is-tablet', responsiveState.isTablet)
            .toggleClass('mas-is-desktop', !responsiveState.isMobile && !responsiveState.isTablet);
    }

    /**
     * Initialize menu positioning
     */
    function initPositioning() {
        const positionType = $('#menu_position_type').val() || 'default';
        
        if (positionType === 'default') return;
        
        // Apply positioning immediately
        applyPositioning();
        
        // Update on setting changes
        $('#menu_position_type, #menu_position_top, #menu_position_left, #menu_position_z_index')
            .on('change input', applyPositioning);
    }

    /**
     * Apply positioning styles
     */
    function applyPositioning() {
        updateSettingsFromForm();
        applyResponsiveClasses();
        
        // Special handling for floating menu
        if (responsiveState.settings.positionType === 'floating') {
            initFloatingMenu();
        }
    }

    /**
     * Initialize floating menu behaviors
     */
    function initFloatingMenu() {
        const $adminMenu = $('#adminmenu');
        
        // Auto-hide behavior
        if ($('#menu_floating_auto_hide').is(':checked')) {
            let hideTimeout;
            
            $adminMenu.on('mouseenter', function() {
                clearTimeout(hideTimeout);
                $(this).addClass('mas-floating-visible');
            }).on('mouseleave', function() {
                const $this = $(this);
                hideTimeout = setTimeout(() => {
                    $this.removeClass('mas-floating-visible');
                }, 1000);
            });
        }
        
        // Trigger hover behavior
        if ($('#menu_floating_trigger_hover').is(':checked')) {
            $adminMenu.addClass('mas-floating-hidden');
        }
    }

    /**
     * Initialize floating behaviors
     */
    function initFloatingBehaviors() {
        // Listen for floating option changes
        $('#menu_floating_shadow, #menu_floating_blur_background, #menu_floating_auto_hide, #menu_floating_trigger_hover')
            .on('change', function() {
                applyResponsiveClasses();
                if ($('#menu_position_type').val() === 'floating') {
                    initFloatingMenu();
                }
            });
    }

    /**
     * Initialize swipe gestures
     */
    function initSwipeGestures() {
        if (!('ontouchstart' in window)) return; // No touch support
        
        // Touch events
        $(document).on('touchstart', function(e) {
            if (!responsiveState.settings.swipeGestures) return;
            
            responsiveState.swipeStartX = e.originalEvent.touches[0].clientX;
            responsiveState.swipeStartY = e.originalEvent.touches[0].clientY;
        });
        
        $(document).on('touchend', function(e) {
            if (!responsiveState.settings.swipeGestures) return;
            
            const endX = e.originalEvent.changedTouches[0].clientX;
            const endY = e.originalEvent.changedTouches[0].clientY;
            const deltaX = endX - responsiveState.swipeStartX;
            const deltaY = endY - responsiveState.swipeStartY;
            
            // Detect swipe gesture
            if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
                if (deltaX > 0 && responsiveState.swipeStartX < 50) {
                    // Swipe right from left edge - open menu
                    if (responsiveState.isMobile && !responsiveState.mobileMenuActive) {
                        openMobileMenu();
                    }
                } else if (deltaX < 0 && responsiveState.mobileMenuActive) {
                    // Swipe left - close menu
                    closeMobileMenu();
                }
            }
        });
    }

    /**
     * Bind responsive settings changes
     */
    function bindResponsiveSettings() {
        // Breakpoint changes
        $('#menu_mobile_breakpoint, #menu_tablet_breakpoint').on('input', function() {
            updateSettingsFromForm();
            handleResize();
        });
        
        // Behavior changes
        $('#menu_mobile_behavior, #menu_mobile_toggle_position, #menu_mobile_toggle_style, #menu_mobile_animation')
            .on('change', function() {
                updateSettingsFromForm();
                applyResponsiveClasses();
                
                // Recreate toggle if style/position changed
                if ($(this).attr('id').includes('toggle')) {
                    $('.mas-mobile-menu-toggle').remove();
                    createMobileToggle();
                }
            });
        
        // Feature toggles
        $('#menu_touch_friendly, #menu_swipe_gestures, #menu_reduce_animations_mobile, #menu_optimize_performance')
            .on('change', function() {
                updateSettingsFromForm();
                applyResponsiveClasses();
            });
        
        // Responsive enabled/disabled
        $('#menu_responsive_enabled').on('change', function() {
            if ($(this).is(':checked')) {
                initResponsiveMenu();
            } else {
                // Cleanup responsive elements
                $('.mas-mobile-menu-toggle, .mas-mobile-overlay').remove();
                $('body').removeClass(function(index, className) {
                    return (className.match(/(^|\s)mas-\S+/g) || []).join(' ');
                });
            }
        });
    }

    /**
     * Bind general events
     */
    function bindEvents() {
        // Keyboard events
        $(document).on('keydown', function(e) {
            // ESC to close mobile menu
            if (e.key === 'Escape' && responsiveState.mobileMenuActive) {
                closeMobileMenu();
            }
        });
        
        // Update colors when changed
        $('#menu_mobile_toggle_color, #menu_mobile_overlay_color, #menu_mobile_background, #menu_mobile_text_color')
            .on('change input', updateMobileColors);
    }

    /**
     * Update mobile colors
     */
    function updateMobileColors() {
        const toggleColor = $('#menu_mobile_toggle_color').val();
        const overlayColor = $('#menu_mobile_overlay_color').val();
        const backgroundColor = $('#menu_mobile_background').val();
        const textColor = $('#menu_mobile_text_color').val();
        
        const root = document.documentElement;
        
        if (toggleColor) {
            $('.mas-mobile-menu-toggle').css('background-color', toggleColor);
        }
        
        if (overlayColor) {
            root.style.setProperty('--mas-overlay-background', overlayColor);
        }
        
        if (backgroundColor) {
            root.style.setProperty('--mas-mobile-background', backgroundColor);
        }
        
        if (textColor) {
            root.style.setProperty('--mas-mobile-text-color', textColor);
        }
    }

    /**
     * Debounce function for performance
     */
    function debounce(func, wait) {
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

    /**
     * Public API for external access
     */
    window.MASResponsive = {
        openMobileMenu: openMobileMenu,
        closeMobileMenu: closeMobileMenu,
        toggleMobileMenu: toggleMobileMenu,
        getState: () => responsiveState,
        updateSettings: updateSettingsFromForm,
        handleResize: handleResize
    };

})(jQuery); 