<?php
/**
 * Style Generator - Unified CSS Variables & Styling System
 * 
 * CONSOLIDATED SERVICE: Combines CSSGenerator + CSSVariablesGenerator
 * 
 * This service provides:
 * - Enterprise-grade CSS variables generation (43 mapped options)
 * - Advanced color shades and responsive variables
 * - High-performance caching with metrics
 * - Backward compatibility with both legacy systems
 * - Computed variables for dynamic styling
 * 
 * @package ModernAdminStyler\Services
 * @version 2.4.0 - Consolidated Architecture
 */

namespace ModernAdminStyler\Services;

class StyleGenerator {
    
    private $coreEngine;
    private $cacheManager;
    private $settingsManager;
    private $generatedVariables = [];
    
    // 🎨 Variable Types
    const TYPE_COLOR = 'color';
    const TYPE_DIMENSION = 'dimension';
    const TYPE_SCALE = 'scale';
    const TYPE_FONT = 'font';
    const TYPE_SHADOW = 'shadow';
    const TYPE_ANIMATION = 'animation';
    const TYPE_COMPUTED = 'computed';
    
    // 📱 Responsive Breakpoints
    const BREAKPOINT_MOBILE = '480px';
    const BREAKPOINT_TABLET = '768px';
    const BREAKPOINT_DESKTOP = '1024px';
    const BREAKPOINT_WIDE = '1200px';
    
    // 🎯 Generation Modes
    const MODE_LEGACY = 'legacy';       // Original CSSGenerator behavior
    const MODE_ADVANCED = 'advanced';   // Full CSSVariablesGenerator features  
    const MODE_HYBRID = 'hybrid';       // Best of both (default)
    
    /**
     * 🎨 CSS Variable Mapping - WOOW Unified Naming Convention
     * 
     * Maps setting keys to CSS variables with consistent --woow- prefix
     * Each entry defines: variable name, type, unit (if applicable)
     * 
     * @var array CSS variable mapping with unified naming
     */
    private const CSS_VAR_MAP = [
        // === GLOBAL SETTINGS ===
        'color_scheme' => ['name' => '--woow-color-scheme', 'type' => self::TYPE_SCALE],
        'color_palette' => ['name' => '--woow-color-palette', 'type' => self::TYPE_SCALE],
        'enable_animations' => ['name' => '--woow-animations-enabled', 'type' => self::TYPE_SCALE],
        'performance_mode' => ['name' => '--woow-performance-mode', 'type' => self::TYPE_SCALE],
        
        // === ADMIN BAR (Original) ===
        'admin_bar_height' => ['name' => '--woow-admin-bar-height', 'unit' => 'px', 'type' => self::TYPE_DIMENSION],
        'admin_bar_background' => ['name' => '--woow-surface-bar', 'type' => self::TYPE_COLOR],
        'admin_bar_text_color' => ['name' => '--woow-admin-bar-text-color', 'type' => self::TYPE_COLOR],
        'admin_bar_hover_color' => ['name' => '--woow-admin-bar-hover-color', 'type' => self::TYPE_COLOR],
        'admin_bar_floating' => ['name' => '--woow-admin-bar-floating', 'type' => self::TYPE_SCALE],
        'admin_bar_glossy' => ['name' => '--woow-admin-bar-glossy', 'type' => self::TYPE_SCALE],
        'admin_bar_margin' => ['name' => '--woow-admin-bar-margin', 'unit' => 'px', 'type' => self::TYPE_DIMENSION],
        
        // === ADMIN BAR (Micro-panel options) ===
        'wpadminbar_bg_color' => ['name' => '--woow-surface-bar', 'type' => self::TYPE_COLOR],
        'wpadminbar_text_color' => ['name' => '--woow-surface-bar-text', 'type' => self::TYPE_COLOR],
        'wpadminbar_hover_color' => ['name' => '--woow-surface-bar-hover', 'type' => self::TYPE_COLOR],
        'wpadminbar_logo_color' => ['name' => '--woow-surface-bar-logo', 'type' => self::TYPE_COLOR],
        'wpadminbar_height' => ['name' => '--woow-surface-bar-height', 'unit' => 'px', 'type' => self::TYPE_DIMENSION],
        'wpadminbar_font_size' => ['name' => '--woow-surface-bar-font-size', 'unit' => 'px', 'type' => self::TYPE_DIMENSION],
        'wpadminbar_border_radius' => ['name' => '--woow-radius-bar', 'unit' => 'px', 'type' => self::TYPE_DIMENSION],
        'wpadminbar_glassmorphism' => ['name' => '--woow-admin-bar-glassmorphism', 'type' => self::TYPE_SCALE],
        'wpadminbar_floating' => ['name' => '--woow-admin-bar-floating', 'type' => self::TYPE_SCALE],
        'wpadminbar_shadow' => ['name' => '--woow-admin-bar-shadow', 'type' => self::TYPE_SHADOW],
        'wpadminbar_gradient' => ['name' => '--woow-admin-bar-gradient', 'type' => self::TYPE_COLOR],
        'wpadminbar_hide_wp_logo' => ['name' => '--woow-admin-bar-hide-logo', 'type' => self::TYPE_SCALE],
        'wpadminbar_hide_howdy' => ['name' => '--woow-admin-bar-hide-howdy', 'type' => self::TYPE_SCALE],
        'wpadminbar_hide_update_notices' => ['name' => '--woow-admin-bar-hide-updates', 'type' => self::TYPE_SCALE],
        'wpadminbar_hide_comments' => ['name' => '--woow-admin-bar-hide-comments', 'type' => self::TYPE_SCALE],
        
        // === ADMIN BAR (New schema mappings) ===
        'surface_bar' => ['name' => '--woow-surface-bar', 'type' => self::TYPE_COLOR],
        'surface_bar_text' => ['name' => '--woow-surface-bar-text', 'type' => self::TYPE_COLOR],
        'surface_bar_hover' => ['name' => '--woow-surface-bar-hover', 'type' => self::TYPE_COLOR],
        'surface_bar_height' => ['name' => '--woow-surface-bar-height', 'unit' => 'px', 'type' => self::TYPE_DIMENSION],
        'surface_bar_font_size' => ['name' => '--woow-surface-bar-font-size', 'unit' => 'px', 'type' => self::TYPE_DIMENSION],
        'surface_bar_padding' => ['name' => '--woow-surface-bar-padding', 'unit' => 'px', 'type' => self::TYPE_DIMENSION],
        'surface_bar_blur' => ['name' => '--woow-surface-bar-blur', 'unit' => 'px', 'type' => self::TYPE_DIMENSION],
        
        // === MENU (Original) ===
        'menu_width' => ['name' => '--woow-menu-width', 'unit' => 'px', 'type' => self::TYPE_DIMENSION],
        'menu_background' => ['name' => '--woow-surface-menu', 'type' => self::TYPE_COLOR],
        'menu_text_color' => ['name' => '--woow-surface-menu-text', 'type' => self::TYPE_COLOR],
        'menu_hover_color' => ['name' => '--woow-menu-hover-color', 'type' => self::TYPE_COLOR],
        'menu_floating' => ['name' => '--woow-menu-floating', 'type' => self::TYPE_SCALE],
        'menu_glassmorphism' => ['name' => '--woow-menu-glassmorphism', 'type' => self::TYPE_SCALE],
        'menu_radius' => ['name' => '--woow-menu-radius', 'unit' => 'px', 'type' => self::TYPE_DIMENSION],
        'menu_margin' => ['name' => '--woow-menu-margin', 'unit' => 'px', 'type' => self::TYPE_DIMENSION],
        
        // === MENU (Micro-panel options) ===
        'adminmenuwrap_bg_color' => ['name' => '--woow-surface-menu', 'type' => self::TYPE_COLOR],
        'adminmenuwrap_text_color' => ['name' => '--woow-surface-menu-text', 'type' => self::TYPE_COLOR],
        'adminmenuwrap_hover_color' => ['name' => '--woow-surface-menu-hover', 'type' => self::TYPE_COLOR],
        'adminmenuwrap_active_color' => ['name' => '--woow-surface-menu-active', 'type' => self::TYPE_COLOR],
        'adminmenuwrap_width' => ['name' => '--woow-surface-menu-width', 'unit' => 'px', 'type' => self::TYPE_DIMENSION],
        'adminmenuwrap_border_radius' => ['name' => '--woow-radius-menu', 'unit' => 'px', 'type' => self::TYPE_DIMENSION],
        'adminmenuwrap_floating' => ['name' => '--woow-menu-floating', 'type' => self::TYPE_SCALE],
        
        // === MENU (New schema mappings) ===
        'surface_menu' => ['name' => '--woow-surface-menu', 'type' => self::TYPE_COLOR],
        'surface_menu_text' => ['name' => '--woow-surface-menu-text', 'type' => self::TYPE_COLOR],
        'surface_menu_hover' => ['name' => '--woow-surface-menu-hover', 'type' => self::TYPE_COLOR],
        'surface_menu_active' => ['name' => '--woow-surface-menu-active', 'type' => self::TYPE_COLOR],
        'surface_menu_width' => ['name' => '--woow-surface-menu-width', 'unit' => 'px', 'type' => self::TYPE_DIMENSION],
        
        // === CONTENT AREA (Micro-panel options) ===
        'wpwrap_bg_color' => ['name' => '--woow-bg-primary', 'type' => self::TYPE_COLOR],
        'wpwrap_max_width' => ['name' => '--woow-content-max-width', 'unit' => 'px', 'type' => self::TYPE_DIMENSION],
        
        // === FOOTER (Micro-panel options) ===
        'wpfooter_bg_color' => ['name' => '--woow-footer-bg', 'type' => self::TYPE_COLOR],
        'wpfooter_text_color' => ['name' => '--woow-footer-text', 'type' => self::TYPE_COLOR],
        'wpfooter_hide_version' => ['name' => '--woow-footer-hide-version', 'type' => self::TYPE_SCALE],
        'wpfooter_hide_thanks' => ['name' => '--woow-footer-hide-thanks', 'type' => self::TYPE_SCALE],
        
        // === POST BOXES (Micro-panel options) ===
        'postbox_bg_color' => ['name' => '--woow-postbox-bg', 'type' => self::TYPE_COLOR],
        'postbox_header_color' => ['name' => '--woow-postbox-header', 'type' => self::TYPE_COLOR],
        'postbox_text_color' => ['name' => '--woow-postbox-text', 'type' => self::TYPE_COLOR],
        'postbox_border_color' => ['name' => '--woow-postbox-border', 'type' => self::TYPE_COLOR],
        'postbox_header_bg' => ['name' => '--woow-postbox-header-bg', 'type' => self::TYPE_COLOR],
        'postbox_border_radius' => ['name' => '--woow-postbox-radius', 'unit' => 'px', 'type' => self::TYPE_DIMENSION],
        'postbox_padding' => ['name' => '--woow-postbox-padding', 'unit' => 'px', 'type' => self::TYPE_DIMENSION],
        'postbox_margin' => ['name' => '--woow-postbox-margin', 'unit' => 'px', 'type' => self::TYPE_DIMENSION],
        'postbox_shadow' => ['name' => '--woow-postbox-shadow', 'type' => self::TYPE_SHADOW],
        'postbox_glassmorphism' => ['name' => '--woow-postbox-glassmorphism', 'type' => self::TYPE_SCALE],
        'postbox_hover_lift' => ['name' => '--woow-postbox-hover-lift', 'type' => self::TYPE_SCALE],
        'postbox_animation' => ['name' => '--woow-postbox-animation', 'type' => self::TYPE_ANIMATION],
        
        // === TYPOGRAPHY ===
        'body_font' => ['name' => '--woow-body-font', 'type' => self::TYPE_FONT],
        'heading_font' => ['name' => '--woow-heading-font', 'type' => self::TYPE_FONT],
        'global_font_size' => ['name' => '--woow-global-font-size', 'unit' => 'px', 'type' => self::TYPE_DIMENSION],
        'global_line_height' => ['name' => '--woow-global-line-height', 'type' => self::TYPE_SCALE],
        'headings_scale' => ['name' => '--woow-headings-scale', 'type' => self::TYPE_SCALE],
        'headings_weight' => ['name' => '--woow-headings-weight', 'type' => self::TYPE_SCALE],
        'headings_spacing' => ['name' => '--woow-headings-spacing', 'unit' => 'em', 'type' => self::TYPE_DIMENSION],
        
        // === LAYOUT ===
        'global_border_radius' => ['name' => '--woow-global-border-radius', 'unit' => 'px', 'type' => self::TYPE_DIMENSION],
        'global_spacing' => ['name' => '--woow-global-spacing', 'unit' => 'px', 'type' => self::TYPE_DIMENSION],
        'compact_mode' => ['name' => '--woow-compact-mode', 'type' => self::TYPE_SCALE],
        'full_width_mode' => ['name' => '--woow-full-width-mode', 'type' => self::TYPE_SCALE],
        
        // === EFFECTS ===
        'enable_shadows' => ['name' => '--woow-shadows-enabled', 'type' => self::TYPE_SCALE],
        'shadow_color' => ['name' => '--woow-shadow-color', 'type' => self::TYPE_COLOR],
        'shadow_blur' => ['name' => '--woow-shadow-blur', 'unit' => 'px', 'type' => self::TYPE_DIMENSION],
        'shadow_opacity' => ['name' => '--woow-shadow-opacity', 'type' => self::TYPE_SCALE],
        'enable_glassmorphism' => ['name' => '--woow-glassmorphism-enabled', 'type' => self::TYPE_SCALE],
        
        // === PERFORMANCE ===
        'hardware_acceleration' => ['name' => '--woow-hardware-acceleration', 'type' => self::TYPE_SCALE],
        'respect_reduced_motion' => ['name' => '--woow-respect-reduced-motion', 'type' => self::TYPE_SCALE],
        'mobile_3d_optimization' => ['name' => '--woow-mobile-optimization', 'type' => self::TYPE_SCALE],
        
        // === ADVANCED ===
        'transition_speed' => ['name' => '--woow-transition-speed', 'unit' => 's', 'type' => self::TYPE_ANIMATION],
        'animation_easing' => ['name' => '--woow-animation-easing', 'type' => self::TYPE_ANIMATION],
        'z_index_base' => ['name' => '--woow-z-index-base', 'type' => self::TYPE_SCALE],
        'enable_debug_mode' => ['name' => '--woow-debug-mode', 'type' => self::TYPE_SCALE],
        
        // === CONTENT AREAS ===
        'content_background' => ['name' => '--woow-bg-primary', 'type' => self::TYPE_COLOR],
        'content_text_color' => ['name' => '--woow-content-text-color', 'type' => self::TYPE_COLOR],
        'content_padding' => ['name' => '--woow-content-padding', 'unit' => 'px', 'type' => self::TYPE_DIMENSION],
        'content_max_width' => ['name' => '--woow-content-max-width', 'unit' => 'px', 'type' => self::TYPE_DIMENSION],
        
        // === MISSING MAPPINGS - Added from Implementation Pattern Audit ===
        
        // Menu Item Options
        'menu_item_padding' => ['name' => '--woow-surface-menu-item-padding', 'unit' => 'px', 'type' => self::TYPE_DIMENSION],
        'menu_item_font_size' => ['name' => '--woow-surface-menu-font-size', 'unit' => 'px', 'type' => self::TYPE_DIMENSION],
        'menu_border_radius_all' => ['name' => '--woow-radius-menu-all', 'unit' => 'px', 'type' => self::TYPE_DIMENSION],
        'menu_spacing' => ['name' => '--woow-space-menu', 'unit' => 'px', 'type' => self::TYPE_DIMENSION],
        'menu_spacing_top' => ['name' => '--woow-space-menu-top', 'unit' => 'px', 'type' => self::TYPE_DIMENSION],
        'menu_spacing_right' => ['name' => '--woow-space-menu-right', 'unit' => 'px', 'type' => self::TYPE_DIMENSION],
        'menu_spacing_bottom' => ['name' => '--woow-space-menu-bottom', 'unit' => 'px', 'type' => self::TYPE_DIMENSION],
        'menu_spacing_left' => ['name' => '--woow-space-menu-left', 'unit' => 'px', 'type' => self::TYPE_DIMENSION],
        
        // Additional Surface Options
        'surface_elevated' => ['name' => '--woow-surface-elevated', 'type' => self::TYPE_COLOR],
        'surface_card' => ['name' => '--woow-surface-card', 'type' => self::TYPE_COLOR],
        'surface_overlay' => ['name' => '--woow-surface-overlay', 'type' => self::TYPE_COLOR],
        
        // Extended Border Options
        'border_secondary' => ['name' => '--woow-border-secondary', 'type' => self::TYPE_COLOR],
        'border_accent' => ['name' => '--woow-border-accent', 'type' => self::TYPE_COLOR],
        'border_focus' => ['name' => '--woow-border-focus', 'type' => self::TYPE_COLOR],
        
        // Extended Text Options
        'text_muted' => ['name' => '--woow-text-muted', 'type' => self::TYPE_COLOR],
        'text_disabled' => ['name' => '--woow-text-disabled', 'type' => self::TYPE_COLOR],
        'text_brand' => ['name' => '--woow-text-brand', 'type' => self::TYPE_COLOR],
        
        // Extended Accent Options
        'accent_info' => ['name' => '--woow-accent-info', 'type' => self::TYPE_COLOR],
        'accent_warning_hover' => ['name' => '--woow-accent-warning-hover', 'type' => self::TYPE_COLOR],
        'accent_error_hover' => ['name' => '--woow-accent-error-hover', 'type' => self::TYPE_COLOR],
        'accent_success_hover' => ['name' => '--woow-accent-success-hover', 'type' => self::TYPE_COLOR],
        
        // Extended Radius Options
        'radius_card' => ['name' => '--woow-radius-card', 'unit' => 'px', 'type' => self::TYPE_DIMENSION],
        'radius_button' => ['name' => '--woow-radius-button', 'unit' => 'px', 'type' => self::TYPE_DIMENSION],
        'radius_input' => ['name' => '--woow-radius-input', 'unit' => 'px', 'type' => self::TYPE_DIMENSION],
        
        // Extended Shadow Options
        'shadow_button' => ['name' => '--woow-shadow-button', 'type' => self::TYPE_SHADOW],
        'shadow_card' => ['name' => '--woow-shadow-card', 'type' => self::TYPE_SHADOW],
        'shadow_modal' => ['name' => '--woow-shadow-modal', 'type' => self::TYPE_SHADOW],
        
        // Extended Spacing Options
        'space_component' => ['name' => '--woow-space-component', 'unit' => 'px', 'type' => self::TYPE_DIMENSION],
        'space_section' => ['name' => '--woow-space-section', 'unit' => 'px', 'type' => self::TYPE_DIMENSION],
        'space_layout' => ['name' => '--woow-space-layout', 'unit' => 'px', 'type' => self::TYPE_DIMENSION],
        
        // Extended Animation Options
        'animation_duration_micro' => ['name' => '--woow-duration-micro', 'unit' => 'ms', 'type' => self::TYPE_ANIMATION],
        'animation_duration_macro' => ['name' => '--woow-duration-macro', 'unit' => 'ms', 'type' => self::TYPE_ANIMATION],
        'animation_ease_bounce' => ['name' => '--woow-ease-bounce', 'type' => self::TYPE_ANIMATION],
        'animation_ease_elastic' => ['name' => '--woow-ease-elastic', 'type' => self::TYPE_ANIMATION],
        
        // Extended Blur Options
        'blur_subtle' => ['name' => '--woow-blur-subtle', 'unit' => 'px', 'type' => self::TYPE_DIMENSION],
        'blur_strong' => ['name' => '--woow-blur-strong', 'unit' => 'px', 'type' => self::TYPE_DIMENSION],
        'blur_extreme' => ['name' => '--woow-blur-extreme', 'unit' => 'px', 'type' => self::TYPE_DIMENSION],
        
        // Extended Z-index Options
        'z_dropdown' => ['name' => '--woow-z-dropdown', 'type' => self::TYPE_SCALE],
        'z_modal' => ['name' => '--woow-z-modal', 'type' => self::TYPE_SCALE],
        'z_tooltip' => ['name' => '--woow-z-tooltip', 'type' => self::TYPE_SCALE],
        'z_notification' => ['name' => '--woow-z-notification', 'type' => self::TYPE_SCALE],
    ];
    
    public function __construct($coreEngine) {
        $this->coreEngine = $coreEngine;
        $this->cacheManager = $coreEngine->getCacheManager();
        $this->settingsManager = $coreEngine->getSettingsManager();
    }
    
    /**
     * 🎨 Generate CSS Variables - Primary Interface
     * 
     * Supports multiple generation modes:
     * - LEGACY: Original CSSGenerator behavior (fast, simple)
     * - ADVANCED: Full CSSVariablesGenerator features (comprehensive)
     * - HYBRID: Best of both systems (recommended)
     * 
     * @param array|null $settings Plugin settings
     * @param string $mode Generation mode
     * @return string|array CSS output or detailed result array
     */
    public function generate($settings = null, $mode = self::MODE_HYBRID) {
        $startTime = microtime(true);
        
        if ($settings === null) {
            $settings = $this->settingsManager->getSettings();
        }
        
        // Cache key based on settings and mode
        $cacheKey = 'style_generator_' . $mode . '_' . md5(serialize($settings));
        $cached = $this->cacheManager->get($cacheKey);
        
        if ($cached !== null) {
            return $cached;
        }
        
        $result = '';
        
        switch ($mode) {
            case self::MODE_LEGACY:
                $result = $this->generateLegacyCSS($settings);
                break;
                
            case self::MODE_ADVANCED:
                $result = $this->generateAdvancedVariables($settings);
                break;
                
            case self::MODE_HYBRID:
            default:
                $result = $this->generateHybridCSS($settings);
                break;
        }
        
        // Cache the result
        $cacheTime = $mode === self::MODE_LEGACY ? 3600 : 1800; // Legacy: 1h, Advanced: 30min
        $this->cacheManager->set($cacheKey, $result, $cacheTime);
        
        // Update performance metrics
        $this->updateMetrics($mode, microtime(true) - $startTime, $settings);
        
        return $result;
    }
    
    /**
     * 🔄 Legacy CSS Generation (CSSGenerator compatibility)
     * 
     * Fast, minimal CSS variables generation for backwards compatibility
     * Produces only the 43 mapped enterprise variables
     */
    private function generateLegacyCSS($settings) {
        // Ensure complete settings with defaults
        $settings = wp_parse_args($settings, $this->getDefaultSettings());
        
        $variables = [];
        
        foreach (self::CSS_VAR_MAP as $setting_key => $css_data) {
            if (isset($settings[$setting_key]) && $settings[$setting_key] !== '') {
                $value = $this->sanitizeValue($settings[$setting_key], $setting_key);
                $unit = $css_data['unit'] ?? '';
                
                // Handle boolean values
                if (is_bool($settings[$setting_key]) || in_array($settings[$setting_key], ['0', '1', 0, 1])) {
                    $value = $settings[$setting_key] ? '1' : '0';
                    $unit = '';
                }
                
                // Handle special value types
                if (in_array($setting_key, ['body_font', 'heading_font'])) {
                    $value = $this->getFontFamily($value);
                }
                
                if ($setting_key === 'animation_easing') {
                    $value = $this->getAnimationEasing($value);
                }
                
                $variables[] = "    " . $css_data['name'] . ": " . $value . $unit . " !important;";
            }
        }
        
        // Add computed variables
        $variables = array_merge($variables, $this->generateComputedVariables($settings));
        
        if (empty($variables)) {
            return "/* No custom CSS variables set */";
        }
        
        return "body.wp-admin {\n" . implode("\n", $variables) . "\n}";
    }
    
    /**
     * 🚀 Advanced Variables Generation (CSSVariablesGenerator features)
     * 
     * Comprehensive CSS variables with color shades, responsive scaling,
     * and advanced typography/effects systems
     */
    private function generateAdvancedVariables($settings) {
        $variables = [];
        
        // 1. Core enterprise variables (43 mapped options)
        $variables = array_merge($variables, $this->generateCoreVariables($settings));
        
        // 2. Advanced color shades and variants
        $variables = array_merge($variables, $this->generateColorVariables($settings));
        
        // 3. Comprehensive dimension and spacing system
        $variables = array_merge($variables, $this->generateDimensionVariables($settings));
        
        // 4. Rich typography variables
        $variables = array_merge($variables, $this->generateTypographyVariables($settings));
        
        // 5. Effects and shadows
        $variables = array_merge($variables, $this->generateEffectVariables($settings));
        
        // 6. Animation and transition variables
        $variables = array_merge($variables, $this->generateAnimationVariables($settings));
        
        // 7. Responsive variants
        $variables = array_merge($variables, $this->generateResponsiveVariables($variables, $settings));
        
        // 8. Computed enhancements
        $variables = array_merge($variables, $this->generateAdvancedComputedVariables($variables, $settings));
        
        $generationTime = microtime(true) - microtime(true);
        
        return [
            'variables' => $variables,
            'css' => $this->variablesToCSS($variables),
            'generation_time' => $generationTime,
            'variable_count' => count($variables),
            'timestamp' => current_time('mysql'),
            'mode' => self::MODE_ADVANCED
        ];
    }
    
    /**
     * 🎯 Hybrid CSS Generation (Recommended Default)
     * 
     * Combines the performance of legacy mode with key advanced features:
     * - All 43 enterprise variables (legacy compatibility)
     * - Essential color shades for primary/secondary/accent
     * - Computed hover states and responsive spacing
     * - Optimized for best performance/feature balance
     */
    private function generateHybridCSS($settings) {
        $settings = wp_parse_args($settings, $this->getDefaultSettings());
        
        $variables = [];
        
        // 1. All enterprise variables (legacy compatibility)
        foreach (self::CSS_VAR_MAP as $setting_key => $css_data) {
            if (isset($settings[$setting_key]) && $settings[$setting_key] !== '') {
                $value = $this->sanitizeValue($settings[$setting_key], $setting_key);
                $unit = $css_data['unit'] ?? '';
                
                // Handle special cases
                if (is_bool($settings[$setting_key]) || in_array($settings[$setting_key], ['0', '1', 0, 1])) {
                    $value = $settings[$setting_key] ? '1' : '0';
                    $unit = '';
                }
                
                if (in_array($setting_key, ['body_font', 'heading_font'])) {
                    $value = $this->getFontFamily($value);
                }
                
                if ($setting_key === 'animation_easing') {
                    $value = $this->getAnimationEasing($value);
                }
                
                $variables[$css_data['name']] = $value . $unit;
            }
        }
        
        // 2. Essential color shades for key colors
        $primaryColors = ['admin_bar_background', 'menu_background', 'postbox_bg_color'];
        foreach ($primaryColors as $colorKey) {
            if (!empty($settings[$colorKey])) {
                $shades = $this->generateColorShades($settings[$colorKey], str_replace('_', '-', $colorKey));
                $variables = array_merge($variables, $shades);
            }
        }
        
        // 3. Essential computed variables
        $computed = $this->generateComputedVariables($settings);
        foreach ($computed as $computedVar) {
            if (preg_match('/--([^:]+):\s*([^;]+);/', $computedVar, $matches)) {
                $variables['--' . $matches[1]] = $matches[2];
            }
        }
        
        // 4. Basic spacing scale
        $baseSpacing = $settings['global_spacing'] ?? 16;
        for ($i = 0; $i <= 10; $i++) {
            $variables["--mas-space-{$i}"] = ($baseSpacing * $i) . 'px';
        }
        
        // 5. Basic responsive font scaling
        $baseFontSize = $settings['global_font_size'] ?? 16;
        $variables['--mas-font-size-mobile'] = ($baseFontSize * 0.875) . 'px';
        $variables['--mas-font-size-tablet'] = ($baseFontSize * 0.9375) . 'px';
        
        // Convert to CSS format
        $css = "body.wp-admin {\n";
        foreach ($variables as $name => $value) {
            $css .= "    {$name}: {$value} !important;\n";
        }
        $css .= "}\n\n";
        
        // Add mobile responsive overrides
        $css .= "@media (max-width: " . self::BREAKPOINT_MOBILE . ") {\n";
        $css .= "    body.wp-admin {\n";
        $css .= "        --mas-global-font-size: var(--mas-font-size-mobile) !important;\n";
        $css .= "    }\n";
        $css .= "}\n";
        
        return $css;
    }
    
    /**
     * 🎨 Generate Core Enterprise Variables (43 mapped options)
     */
    private function generateCoreVariables($settings) {
        $variables = [];
        
        foreach (self::CSS_VAR_MAP as $setting_key => $css_data) {
            if (isset($settings[$setting_key]) && $settings[$setting_key] !== '') {
                $value = $this->sanitizeValue($settings[$setting_key], $setting_key);
                $unit = $css_data['unit'] ?? '';
                
                // Handle boolean values
                if (is_bool($settings[$setting_key]) || in_array($settings[$setting_key], ['0', '1', 0, 1])) {
                    $value = $settings[$setting_key] ? '1' : '0';
                    $unit = '';
                }
                
                // Handle special value types
                if (in_array($setting_key, ['body_font', 'heading_font'])) {
                    $value = $this->getFontFamily($value);
                }
                
                if ($setting_key === 'animation_easing') {
                    $value = $this->getAnimationEasing($value);
                }
                
                $variables[$css_data['name']] = $value . $unit;
            }
        }
        
        return $variables;
    }
    
    /**
     * 🌈 Generate Color Variables with Advanced Shades
     */
    private function generateColorVariables($settings) {
        $variables = [];
        
        // Primary colors from settings
        $primaryColor = $settings['admin_bar_background'] ?? '#007cba';
        $secondaryColor = $settings['menu_background'] ?? '#50575e';
        $accentColor = $settings['postbox_bg_color'] ?? '#00a0d2';
        
        // Generate comprehensive color shades
        $variables = array_merge($variables, $this->generateColorShades($primaryColor, 'primary'));
        $variables = array_merge($variables, $this->generateColorShades($secondaryColor, 'secondary'));
        $variables = array_merge($variables, $this->generateColorShades($accentColor, 'accent'));
        
        // Semantic colors
        $variables['--mas-success'] = $this->adjustBrightness($primaryColor, 20);
        $variables['--mas-warning'] = '#f0b849';
        $variables['--mas-error'] = '#dc3232';
        $variables['--mas-info'] = $accentColor;
        
        // Interface colors
        $variables['--mas-background'] = $settings['content_background'] ?? '#ffffff';
        $variables['--mas-surface'] = $this->adjustBrightness($variables['--mas-background'], -5);
        $variables['--mas-border'] = $this->adjustBrightness($secondaryColor, 60);
        $variables['--mas-text'] = $settings['content_text_color'] ?? '#1e1e1e';
        $variables['--mas-text-muted'] = $this->adjustBrightness($variables['--mas-text'], 40);
        
        return $variables;
    }
    
    /**
     * 🎨 Generate Color Shades (50-900 scale)
     */
    private function generateColorShades($baseColor, $name) {
        $shades = [];
        
        // Light shades (50, 100, 200, 300, 400)
        for ($i = 50; $i <= 400; $i += 50) {
            $lightness = ($i / 400) * 80; // 0-80% lightness
            $shades["--mas-{$name}-{$i}"] = $this->adjustBrightness($baseColor, $lightness);
        }
        
        // Base color (500)
        $shades["--mas-{$name}-500"] = $baseColor;
        
        // Dark shades (600, 700, 800, 900)
        for ($i = 600; $i <= 900; $i += 100) {
            $darkness = (($i - 500) / 400) * -60; // 0 to -60% darkness
            $shades["--mas-{$name}-{$i}"] = $this->adjustBrightness($baseColor, $darkness);
        }
        
        return $shades;
    }
    
    /**
     * 📏 Generate Dimension Variables
     */
    private function generateDimensionVariables($settings) {
        $variables = [];
        
        // Font size scale
        $baseSize = $settings['global_font_size'] ?? 16;
        $scale = $settings['headings_scale'] ?? 1.25;
        
        $sizes = ['xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl'];
        foreach ($sizes as $index => $size) {
            $multiplier = pow($scale, $index - 2); // md (index 2) as base
            $variables["--mas-size-{$size}"] = round($baseSize * $multiplier, 2) . 'px';
        }
        
        // Spacing scale
        $baseSpacing = $settings['global_spacing'] ?? 8;
        for ($i = 0; $i <= 20; $i++) {
            $variables["--mas-space-{$i}"] = ($baseSpacing * $i) . 'px';
        }
        
        // Special spacings
        $variables['--mas-space-px'] = '1px';
        $variables['--mas-space-0.5'] = ($baseSpacing * 0.5) . 'px';
        $variables['--mas-space-1.5'] = ($baseSpacing * 1.5) . 'px';
        $variables['--mas-space-2.5'] = ($baseSpacing * 2.5) . 'px';
        
        // Border radius scale
        $baseRadius = $settings['global_border_radius'] ?? 4;
        $variables['--mas-radius-none'] = '0px';
        $variables['--mas-radius-sm'] = ($baseRadius * 0.5) . 'px';
        $variables['--mas-radius'] = $baseRadius . 'px';
        $variables['--mas-radius-md'] = ($baseRadius * 1.5) . 'px';
        $variables['--mas-radius-lg'] = ($baseRadius * 2) . 'px';
        $variables['--mas-radius-xl'] = ($baseRadius * 3) . 'px';
        $variables['--mas-radius-full'] = '9999px';
        
        return $variables;
    }
    
    /**
     * 🔤 Generate Typography Variables
     */
    private function generateTypographyVariables($settings) {
        $variables = [];
        
        // Font families
        $primaryFont = $this->getFontFamily($settings['body_font'] ?? 'system');
        $headingFont = $this->getFontFamily($settings['heading_font'] ?? 'system');
        
        $variables['--mas-font-primary'] = $primaryFont;
        $variables['--mas-font-heading'] = $headingFont;
        $variables['--mas-font-mono'] = 'Consolas, Monaco, monospace';
        
        // Font weights
        $variables['--mas-font-thin'] = '100';
        $variables['--mas-font-light'] = '300';
        $variables['--mas-font-normal'] = '400';
        $variables['--mas-font-medium'] = '500';
        $variables['--mas-font-semibold'] = '600';
        $variables['--mas-font-bold'] = '700';
        $variables['--mas-font-black'] = '900';
        
        // Line heights
        $baseLineHeight = $settings['global_line_height'] ?? 1.5;
        $variables['--mas-leading-tight'] = '1.25';
        $variables['--mas-leading-normal'] = $baseLineHeight;
        $variables['--mas-leading-relaxed'] = '1.75';
        $variables['--mas-leading-loose'] = '2';
        
        return $variables;
    }
    
    /**
     * ✨ Generate Effect Variables
     */
    private function generateEffectVariables($settings) {
        $variables = [];
        
        // Shadow system
        $shadowColor = 'rgba(0, 0, 0, 0.1)';
        if (!empty($settings['shadow_color'])) {
            $rgb = $this->hexToRgb($settings['shadow_color']);
            $opacity = $settings['shadow_opacity'] ?? 0.1;
            $shadowColor = "rgba({$rgb}, {$opacity})";
        }
        
        $variables['--mas-shadow-sm'] = "0 1px 2px 0 {$shadowColor}";
        $variables['--mas-shadow'] = "0 1px 3px 0 {$shadowColor}, 0 1px 2px 0 {$shadowColor}";
        $variables['--mas-shadow-md'] = "0 4px 6px -1px {$shadowColor}, 0 2px 4px -1px {$shadowColor}";
        $variables['--mas-shadow-lg'] = "0 10px 15px -3px {$shadowColor}, 0 4px 6px -2px {$shadowColor}";
        $variables['--mas-shadow-xl'] = "0 20px 25px -5px {$shadowColor}, 0 10px 10px -5px {$shadowColor}";
        
        // Blur effects
        $variables['--mas-blur-sm'] = 'blur(4px)';
        $variables['--mas-blur'] = 'blur(8px)';
        $variables['--mas-blur-md'] = 'blur(12px)';
        $variables['--mas-blur-lg'] = 'blur(16px)';
        
        return $variables;
    }
    
    /**
     * 🎬 Generate Animation Variables
     */
    private function generateAnimationVariables($settings) {
        $variables = [];
        
        // Duration scale
        $baseSpeed = $settings['transition_speed'] ?? 0.3;
        $variables['--mas-duration-fast'] = ($baseSpeed * 0.5) . 's';
        $variables['--mas-duration-normal'] = $baseSpeed . 's';
        $variables['--mas-duration-slow'] = ($baseSpeed * 1.5) . 's';
        
        // Easing functions
        $easing = $this->getAnimationEasing($settings['animation_easing'] ?? 'custom');
        $variables['--mas-ease-linear'] = 'linear';
        $variables['--mas-ease-in'] = 'cubic-bezier(0.4, 0, 1, 1)';
        $variables['--mas-ease-out'] = 'cubic-bezier(0, 0, 0.2, 1)';
        $variables['--mas-ease-in-out'] = 'cubic-bezier(0.4, 0, 0.2, 1)';
        $variables['--mas-ease-custom'] = $easing;
        
        return $variables;
    }
    
    /**
     * 📱 Generate Responsive Variables
     */
    private function generateResponsiveVariables($baseVariables, $settings) {
        $responsiveVariables = [];
        
        // Mobile scaling factors
        $mobileScale = $settings['mobile_scale'] ?? 0.875;
        $tabletScale = $settings['tablet_scale'] ?? 0.9375;
        
        // Scale font sizes for mobile/tablet
        foreach ($baseVariables as $key => $value) {
            if (strpos($key, '--mas-size-') === 0) {
                $mobileValue = $this->scaleValue($value, $mobileScale);
                $tabletValue = $this->scaleValue($value, $tabletScale);
                
                $responsiveVariables[$key . '-mobile'] = $mobileValue;
                $responsiveVariables[$key . '-tablet'] = $tabletValue;
            }
        }
        
        return $responsiveVariables;
    }
    
    /**
     * 🧮 Generate Advanced Computed Variables
     */
    private function generateAdvancedComputedVariables($variables, $settings) {
        $computed = [];
        
        // Enhanced hover states for all color variables
        foreach ($variables as $name => $value) {
            if (strpos($name, '--mas-') === 0 && $this->isColorValue($value)) {
                $hoverName = str_replace('--mas-', '--mas-hover-', $name);
                $computed[$hoverName] = $this->adjustBrightness($value, -10);
            }
        }
        
        return $computed;
    }
    
    /**
     * 📋 Generate Legacy Computed Variables (CSSGenerator compatibility)
     */
    private function generateComputedVariables($settings) {
        $computed = [];
        
        // Computed hover variants (migrated from CSSGenerator)
        if (!empty($settings['admin_bar_background'])) {
            $computed[] = "    --woow-admin-bar-background-hover: " . $this->adjustBrightness($settings['admin_bar_background'], 10) . ";";
        }
        
        if (!empty($settings['menu_background'])) {
            $computed[] = "    --woow-menu-background-hover: " . $this->adjustBrightness($settings['menu_background'], 10) . ";";
        }
        
        if (!empty($settings['wpadminbar_bg_color'])) {
            $computed[] = "    --woow-surface-bar-hover-bg: " . $this->adjustBrightness($settings['wpadminbar_bg_color'], 10) . ";";
        }
        
        if (!empty($settings['adminmenuwrap_bg_color'])) {
            $computed[] = "    --woow-surface-menu-hover-bg: " . $this->adjustBrightness($settings['adminmenuwrap_bg_color'], 10) . ";";
        }
        
        if (!empty($settings['postbox_bg_color'])) {
            $computed[] = "    --woow-postbox-hover-bg: " . $this->adjustBrightness($settings['postbox_bg_color'], 5) . ";";
        }
        
        // Computed shadows
        if (isset($settings['enable_shadows']) && $settings['enable_shadows'] && !empty($settings['shadow_color'])) {
            $shadow_opacity = $settings['shadow_opacity'] ?? 0.2;
            $shadow_blur = $settings['shadow_blur'] ?? 10;
            $rgb = $this->hexToRgb($settings['shadow_color']);
            $computed[] = "    --woow-box-shadow: 0 2px {$shadow_blur}px rgba({$rgb}, {$shadow_opacity});";
        }
        
        // Computed spacing scale
        $base_spacing = $settings['global_spacing'] ?? 16;
        $computed[] = "    --woow-spacing-xs: " . ($base_spacing * 0.25) . "px;";
        $computed[] = "    --woow-spacing-sm: " . ($base_spacing * 0.5) . "px;";
        $computed[] = "    --woow-spacing-md: " . $base_spacing . "px;";
        $computed[] = "    --woow-spacing-lg: " . ($base_spacing * 1.5) . "px;";
        $computed[] = "    --woow-spacing-xl: " . ($base_spacing * 2) . "px;";
        
        // Computed transition speeds
        $base_speed = (isset($settings['performance_mode']) && $settings['performance_mode']) ? 0.15 : ($settings['transition_speed'] ?? 0.3);
        $computed[] = "    --woow-transition-fast: " . ($base_speed * 0.5) . "s;";
        $computed[] = "    --woow-transition-normal: " . $base_speed . "s;";
        $computed[] = "    --woow-transition-slow: " . ($base_speed * 1.5) . "s;";
        
        return $computed;
    }
    
    /**
     * 🎨 Convert Variables Array to CSS
     */
    private function variablesToCSS($variables) {
        $css = ":root {\n";
        
        foreach ($variables as $name => $value) {
            $css .= "    {$name}: {$value};\n";
        }
        
        $css .= "}\n\n";
        
        // Add responsive CSS
        $css .= $this->generateResponsiveCSS($variables);
        
        return $css;
    }
    
    /**
     * 📱 Generate Responsive CSS Media Queries
     */
    private function generateResponsiveCSS($variables) {
        $css = '';
        
        // Mobile overrides
        $mobileVars = array_filter($variables, function($key) {
            return strpos($key, '-mobile') !== false;
        }, ARRAY_FILTER_USE_KEY);
        
        if (!empty($mobileVars)) {
            $css .= "@media (max-width: " . self::BREAKPOINT_MOBILE . ") {\n";
            $css .= "    :root {\n";
            foreach ($mobileVars as $name => $value) {
                $baseName = str_replace('-mobile', '', $name);
                $css .= "        {$baseName}: {$value};\n";
            }
            $css .= "    }\n";
            $css .= "}\n\n";
        }
        
        // Tablet overrides
        $tabletVars = array_filter($variables, function($key) {
            return strpos($key, '-tablet') !== false;
        }, ARRAY_FILTER_USE_KEY);
        
        if (!empty($tabletVars)) {
            $css .= "@media (max-width: " . self::BREAKPOINT_TABLET . ") {\n";
            $css .= "    :root {\n";
            foreach ($tabletVars as $name => $value) {
                $baseName = str_replace('-tablet', '', $name);
                $css .= "        {$baseName}: {$value};\n";
            }
            $css .= "    }\n";
            $css .= "}\n";
        }
        
        return $css;
    }
    
    // === UTILITY METHODS ===
    
    /**
     * 🧹 Sanitize Setting Values for CSS Output
     */
    private function sanitizeValue($value, $setting_key) {
        $colorKeys = [
            'admin_bar_background', 'admin_bar_text_color', 'admin_bar_hover_color',
            'menu_background', 'menu_text_color', 'menu_hover_color', 'shadow_color',
            'content_background', 'content_text_color', 'wpadminbar_bg_color',
            'wpadminbar_text_color', 'wpadminbar_hover_color', 'wpadminbar_logo_color',
            'adminmenuwrap_bg_color', 'adminmenuwrap_text_color', 'adminmenuwrap_hover_color',
            'adminmenuwrap_active_color', 'wpwrap_bg_color', 'wpfooter_bg_color',
            'wpfooter_text_color', 'postbox_bg_color', 'postbox_header_color',
            'postbox_text_color', 'postbox_border_color', 'postbox_header_bg'
        ];
        
        $numericKeys = [
            'admin_bar_height', 'menu_width', 'global_font_size', 'global_border_radius',
            'global_spacing', 'shadow_blur', 'content_padding', 'content_max_width',
            'wpadminbar_height', 'wpadminbar_font_size', 'wpadminbar_border_radius',
            'adminmenuwrap_width', 'adminmenuwrap_border_radius', 'wpwrap_max_width',
            'postbox_border_radius', 'postbox_padding', 'postbox_margin'
        ];
        
        $floatKeys = [
            'global_line_height', 'headings_scale', 'shadow_opacity', 'transition_speed'
        ];
        
        if (in_array($setting_key, $colorKeys)) {
            return sanitize_hex_color($value) ?: $value;
        } elseif (in_array($setting_key, $numericKeys)) {
            return absint($value);
        } elseif (in_array($setting_key, $floatKeys)) {
            return floatval($value);
        }
        
        return esc_attr($value);
    }
    
    /**
     * 🔤 Get Font Family CSS Value
     */
    private function getFontFamily($font) {
        $font_map = [
            'system' => '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            'inter' => '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
            'roboto' => '"Roboto", -apple-system, BlinkMacSystemFont, sans-serif',
            'opensans' => '"Open Sans", -apple-system, BlinkMacSystemFont, sans-serif',
            'lato' => '"Lato", -apple-system, BlinkMacSystemFont, sans-serif',
            'poppins' => '"Poppins", -apple-system, BlinkMacSystemFont, sans-serif',
            'montserrat' => '"Montserrat", -apple-system, BlinkMacSystemFont, sans-serif',
        ];
        
        return $font_map[$font] ?? $font_map['system'];
    }
    
    /**
     * 🎭 Get Animation Easing CSS Value
     */
    private function getAnimationEasing($easing) {
        $easing_map = [
            'linear' => 'linear',
            'ease' => 'ease',
            'ease-in' => 'ease-in',
            'ease-out' => 'ease-out',
            'ease-in-out' => 'ease-in-out',
            'custom' => 'cubic-bezier(0.4, 0, 0.2, 1)',
        ];
        
        return $easing_map[$easing] ?? $easing_map['custom'];
    }
    
    /**
     * 🌈 Adjust Color Brightness
     */
    private function adjustBrightness($hex, $percent) {
        $hex = str_replace('#', '', $hex);
        if (strlen($hex) !== 6) return $hex;
        
        $rgb = array_map('hexdec', str_split($hex, 2));
        
        foreach ($rgb as &$color) {
            $color = max(0, min(255, $color + ($color * $percent / 100)));
        }
        
        return '#' . implode('', array_map(function($c) {
            return str_pad(dechex(round($c)), 2, '0', STR_PAD_LEFT);
        }, $rgb));
    }
    
    /**
     * 🎨 Convert Hex to RGB
     */
    private function hexToRgb($hex) {
        $hex = str_replace('#', '', $hex);
        if (strlen($hex) !== 6) return '0, 0, 0';
        
        $rgb = array_map('hexdec', str_split($hex, 2));
        return implode(', ', $rgb);
    }
    
    /**
     * 📏 Scale CSS Value
     */
    private function scaleValue($value, $scale) {
        if (preg_match('/^(\d+(?:\.\d+)?)(.*)$/', $value, $matches)) {
            $number = floatval($matches[1]);
            $unit = $matches[2];
            
            return round($number * $scale, 2) . $unit;
        }
        
        return $value;
    }
    
    /**
     * 🎨 Check if Value is Color
     */
    private function isColorValue($value) {
        return preg_match('/^#[0-9a-fA-F]{6}$/', $value) || 
               preg_match('/^rgb\(/', $value) || 
               preg_match('/^rgba\(/', $value) ||
               preg_match('/^hsl\(/', $value);
    }
    
    /**
     * 🏗️ Get Default Settings
     */
    private function getDefaultSettings() {
        // Use central schema from main plugin class
        $plugin_instance = \ModernAdminStylerV2::getInstance();
        return $plugin_instance->getDefaultSettings();
    }
    
    /**
     * 📊 Update Performance Metrics
     */
    private function updateMetrics($mode, $generationTime, $settings) {
        try {
            $metricsCollector = $this->coreEngine->getMetricsCollector();
            
            $metricsCollector->trackMetric([
                'type' => 'PERFORMANCE',
                'event' => 'style_generation',
                'data' => [
                    'mode' => $mode,
                    'generation_time_ms' => round($generationTime * 1000, 2),
                    'settings_count' => count($settings),
                    'timestamp' => current_time('mysql')
                ]
            ]);
        } catch (\Exception $e) {
            // Metrics tracking is non-critical
            error_log('StyleGenerator metrics tracking failed: ' . $e->getMessage());
        }
    }
    
    // === PUBLIC API METHODS ===
    
    /**
     * 🔄 Invalidate Style Cache
     */
    public function invalidateCache() {
        $this->cacheManager->delete('style_generator_legacy_*');
        $this->cacheManager->delete('style_generator_advanced_*');
        $this->cacheManager->delete('style_generator_hybrid_*');
        return true;
    }
    
    /**
     * 📊 Get Generation Statistics
     */
    public function getStats() {
        $settings = $this->settingsManager->getSettings();
        
        // Test generation in all modes for comparison
        $legacyTime = microtime(true);
        $this->generateLegacyCSS($settings);
        $legacyTime = microtime(true) - $legacyTime;
        
        $hybridTime = microtime(true);
        $hybridResult = $this->generateHybridCSS($settings);
        $hybridTime = microtime(true) - $hybridTime;
        
        return [
            'legacy_generation_time' => round($legacyTime * 1000, 2) . 'ms',
            'hybrid_generation_time' => round($hybridTime * 1000, 2) . 'ms',
            'hybrid_css_size' => strlen($hybridResult) . ' bytes',
            'mapped_variables_count' => count(self::CSS_VAR_MAP),
            'cache_status' => $this->cacheManager->getStats(),
            'last_generated' => current_time('mysql')
        ];
    }
    
    /**
     * 🎯 Quick Generate (Default Mode)
     * Simple interface for backward compatibility
     */
    public function generateCSS($settings = null) {
        return $this->generate($settings, self::MODE_HYBRID);
    }
    
    /**
     * 🚀 Advanced Generate (Full Features)
     * For use cases requiring comprehensive variable generation
     */
    public function generateAdvanced($settings = null) {
        return $this->generate($settings, self::MODE_ADVANCED);
    }
    
    /**
     * ⚡ Legacy Generate (CSSGenerator Compatibility)
     * For backward compatibility with existing integrations
     */
    public function generateLegacy($settings = null) {
        return $this->generate($settings, self::MODE_LEGACY);
    }
}