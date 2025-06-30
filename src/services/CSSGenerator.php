<?php
/**
 * CSS Generator Service
 * 
 * Dynamiczne generowanie CSS z zaawansowanym cache'owaniem
 * 
 * @package ModernAdminStyler
 * @version 2.0
 */

namespace ModernAdminStyler\Services;

class CSSGenerator {
    
    private $settings_manager;
    private $cache_manager;
    
    public function __construct($settings_manager, $cache_manager) {
        $this->settings_manager = $settings_manager;
        $this->cache_manager = $cache_manager;
    }
    
    /**
     * 🎯 NAPRAWKA: Zwraca domyślne ustawienia wtyczki
     * ROZWIĄZUJE: "Undefined array key" warnings podczas generowania CSS
     *
     * @return array
     */
    private function get_default_settings(): array {
        return [
            // Podstawowe ustawienia
            'enable_plugin' => '1',
            'enable_animations' => '0',
            'enable_shadows' => '0',
            'auto_dark_mode' => '0',
            'compact_mode' => '0',
            'color_scheme' => 'default',
            
            // Admin Bar
            'admin_bar_floating' => '0',
            'admin_bar_background' => '#23282d',
            'admin_bar_text_color' => '#ffffff',
            'admin_bar_hover_color' => '#00a0d2',
            'admin_bar_height' => 32,
            'admin_bar_margin' => 10,
            'admin_bar_glossy' => '0',
            
            // Menu
            'menu_floating' => '0',
            'menu_glassmorphism' => '0',
            'menu_width' => 160,
            'menu_compact_mode' => '0',
            'menu_position_type' => 'default',
            'menu_responsive_enabled' => '0',
            'menu_mobile_behavior' => 'collapse',
            'menu_mobile_toggle_position' => 'top-left',
            'menu_mobile_toggle_style' => 'hamburger',
            'menu_mobile_animation' => 'slide',
            'menu_tablet_behavior' => 'auto',
            'menu_tablet_compact' => '0',
            'menu_touch_friendly' => '0',
            'menu_swipe_gestures' => '0',
            'menu_reduce_animations_mobile' => '0',
            'menu_optimize_performance' => '0',
            'menu_floating_shadow' => '0',
            'menu_floating_blur_background' => '0',
            'menu_floating_auto_hide' => '0',
            'menu_floating_trigger_hover' => '0',
            
            // Submenu
            'submenu_background' => '#32373c',
            'submenu_text_color' => '#eee',
            'submenu_hover_background' => '#0073aa',
            'submenu_hover_text_color' => '#fff',
            'submenu_separator' => '0',
            
            // Typografia
            'global_font_size' => 14,
            'global_line_height' => 1.5,
            'body_font' => 'system',
            'headings_scale' => 1.2,
            'global_border_radius' => 8,
            
            // Cienie i efekty
            'shadow_color' => '#000000',
            'shadow_blur' => 10,
            
            // Niestandardowe style
            'custom_css' => ''
        ];
    }
    
    /**
     * 🎨 Generuje kompletny CSS
     */
    public function generate($force_rebuild = false) {
        $raw_settings = $this->settings_manager->getSettings();
        
        // 🎯 NAPRAWKA: Merge z domyślnymi ustawieniami aby zapobiec "Undefined array key" warnings
        $settings = wp_parse_args($raw_settings, $this->get_default_settings());
        
        $cache_key = 'generated_css_' . md5(serialize($settings));
        
        if (!$force_rebuild) {
            $cached_css = $this->cache_manager->get($cache_key);
            if ($cached_css !== null) {
                return $cached_css;
            }
        }
        
        $css_parts = [
            $this->generateVariables($settings),
            $this->generateGlobalStyles($settings),
            $this->generateAdminBarStyles($settings),
            $this->generateMenuStyles($settings),
            $this->generateSubmenuStyles($settings),
            $this->generateTypographyStyles($settings),
            $this->generateResponsiveStyles($settings),
            $this->generateAnimationStyles($settings),
            $this->generateCustomStyles($settings)
        ];
        
        $full_css = implode("\n\n", array_filter($css_parts));
        $minified_css = $this->minify($full_css);
        
        // Cache na 2 godziny
        $this->cache_manager->set($cache_key, $minified_css, 7200);
        
        return $minified_css;
    }
    
    /**
     * 🎯 Generuje zmienne CSS
     */
    private function generateVariables($settings) {
        $variables = [
            // Kolory główne
            '--mas-primary' => $settings['admin_bar_background'] ?? '#23282d',
            '--mas-primary-hover' => $this->adjustBrightness($settings['admin_bar_background'] ?? '#23282d', 10),
            '--mas-text' => $settings['admin_bar_text_color'] ?? '#ffffff',
            '--mas-accent' => $settings['admin_bar_hover_color'] ?? '#00a0d2',
            
            // Wymiary
            '--mas-admin-bar-height' => ($settings['admin_bar_height'] ?? 32) . 'px',
            '--mas-menu-width' => ($settings['menu_width'] ?? 160) . 'px',
            '--mas-border-radius' => ($settings['global_border_radius'] ?? 8) . 'px',
            
            // Typografia
            '--mas-font-size' => ($settings['global_font_size'] ?? 14) . 'px',
            '--mas-line-height' => $settings['global_line_height'] ?? 1.5,
            '--mas-font-family' => $this->getFontFamily($settings['body_font'] ?? 'system'),
            
            // Animacje
            '--mas-transition-speed' => $settings['enable_animations'] ? '0.3s' : '0s',
            '--mas-animation-easing' => 'cubic-bezier(0.4, 0, 0.2, 1)',
            
            // Cienie
            '--mas-shadow-color' => $settings['shadow_color'] ?? '#000000',
            '--mas-shadow-blur' => ($settings['shadow_blur'] ?? 10) . 'px',
            '--mas-box-shadow' => $settings['enable_shadows'] 
                ? "0 2px {$settings['shadow_blur']}px rgba(" . $this->hexToRgb($settings['shadow_color']) . ", 0.1)"
                : 'none',
        ];
        
        // Dodaj zmienne kolorów dla trybu ciemnego
        if ($settings['color_scheme'] === 'dark' || $settings['auto_dark_mode']) {
            $variables = array_merge($variables, [
                '--mas-bg-dark' => '#1e1e1e',
                '--mas-surface-dark' => '#2d2d2d',
                '--mas-text-dark' => '#ffffff',
                '--mas-border-dark' => '#404040'
            ]);
        }
        
        $css = ":root {\n";
        foreach ($variables as $property => $value) {
            $css .= "  {$property}: {$value};\n";
        }
        $css .= "}";
        
        return $css;
    }
    
    /**
     * 🌍 Generuje globalne style
     */
    private function generateGlobalStyles($settings) {
        if (!$settings['enable_plugin']) {
            return '';
        }
        
        $css = "
        body.wp-admin.mas-v2-modern-style {
            font-family: var(--mas-font-family);
            font-size: var(--mas-font-size);
            line-height: var(--mas-line-height);
        }
        
        .mas-loading * {
            transition: none !important;
            animation: none !important;
        }
        ";
        
        if ($settings['compact_mode']) {
            $css .= "
            body.wp-admin.mas-v2-modern-style .wrap {
                margin: 10px 20px 0 2px;
            }
            ";
        }
        
        return $css;
    }
    
    /**
     * 📱 Generuje style Admin Bar
     */
    private function generateAdminBarStyles($settings) {
        $css = "
        #wpadminbar {
            background: var(--mas-primary);
            height: var(--mas-admin-bar-height);
            transition: all var(--mas-transition-speed) var(--mas-animation-easing);
        }
        
        #wpadminbar .ab-item {
            color: var(--mas-text);
            height: var(--mas-admin-bar-height);
            line-height: var(--mas-admin-bar-height);
        }
        
        #wpadminbar .ab-item:hover {
            color: var(--mas-accent);
            background: var(--mas-primary-hover);
        }
        ";
        
        if ($settings['admin_bar_floating']) {
            $margin = $settings['admin_bar_margin'] ?? 10;
            $css .= "
            #wpadminbar {
                position: fixed;
                top: {$margin}px;
                left: {$margin}px;
                right: {$margin}px;
                width: auto;
                border-radius: var(--mas-border-radius);
                box-shadow: var(--mas-box-shadow);
                z-index: 99999;
            }
            
            body.wp-admin {
                padding-top: calc(var(--mas-admin-bar-height) + " . ($margin * 2) . "px);
            }
            ";
        }
        
        if ($settings['admin_bar_glossy']) {
            $css .= "
            #wpadminbar {
                backdrop-filter: blur(10px);
                background: rgba(" . $this->hexToRgb($settings['admin_bar_background']) . ", 0.8);
            }
            ";
        }
        
        return $css;
    }
    
    /**
     * 🔗 Generuje style menu
     */
    private function generateMenuStyles($settings) {
        $css = "
        #adminmenu {
            background: var(--mas-primary);
            width: var(--mas-menu-width);
        }
        
        #adminmenu a {
            color: var(--mas-text);
            transition: all var(--mas-transition-speed) var(--mas-animation-easing);
        }
        
        #adminmenu .wp-has-current-submenu .wp-submenu,
        #adminmenu .wp-has-current-submenu .wp-submenu-wrap,
        #adminmenu li.current a.menu-top {
            background: var(--mas-primary-hover);
        }
        ";
        
        if ($settings['menu_compact_mode']) {
            $css .= "
            #adminmenu .wp-menu-name {
                font-size: 12px;
            }
            
            #adminmenu .menu-icon-dashboard div.wp-menu-image:before {
                font-size: 16px;
            }
            ";
        }
        
        return $css;
    }
    
    /**
     * 📝 Generuje style submenu
     */
    private function generateSubmenuStyles($settings) {
        $css = "
        #adminmenu .wp-submenu {
            background: " . ($settings['submenu_background'] ?? '#32373c') . ";
        }
        
        #adminmenu .wp-submenu a {
            color: " . ($settings['submenu_text_color'] ?? '#eee') . ";
        }
        
        #adminmenu .wp-submenu a:hover {
            background: " . ($settings['submenu_hover_background'] ?? '#0073aa') . ";
            color: " . ($settings['submenu_hover_text_color'] ?? '#fff') . ";
        }
        ";
        
        if ($settings['submenu_separator']) {
            $css .= "
            body.mas-submenu-separator-enabled #adminmenu .wp-submenu li {
                border-bottom: 1px solid rgba(255,255,255,0.1);
            }
            ";
        }
        
        return $css;
    }
    
    /**
     * 🔤 Generuje style typografii
     */
    private function generateTypographyStyles($settings) {
        $css = "";
        
        if (isset($settings['headings_scale']) && $settings['headings_scale'] > 0) {
            $base_size = $settings['global_font_size'] ?? 14;
            $scale = $settings['headings_scale'];
            
            for ($i = 1; $i <= 6; $i++) {
                $size = $base_size * pow($scale, (7 - $i));
                $css .= "h{$i} { font-size: {$size}px; }\n";
            }
        }
        
        return $css;
    }
    
    /**
     * 📱 Generuje responsive styles
     */
    private function generateResponsiveStyles($settings) {
        return "
        @media (max-width: 768px) {
            #adminmenu {
                width: 100%;
                position: relative;
            }
            
            body.wp-admin {
                margin-left: 0;
            }
        }
        ";
    }
    
    /**
     * ✨ Generuje style animacji
     */
    private function generateAnimationStyles($settings) {
        if (empty($settings['enable_animations'])) {
            return '';
        }
        
        return "
        @keyframes masSlideIn {
            from { transform: translateY(-10px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }
        
        .mas-v2-modern-style .wp-submenu {
            animation: masSlideIn var(--mas-transition-speed) var(--mas-animation-easing);
        }
        ";
    }
    
    /**
     * 🎨 Dodaje niestandardowe style
     */
    private function generateCustomStyles($settings) {
        return $settings['custom_css'] ?? '';
    }
    
    /**
     * 🗜️ Minifikuje CSS
     */
    private function minify($css) {
        // Usuń komentarze
        $css = preg_replace('!/\*[^*]*\*+([^/][^*]*\*+)*/!', '', $css);
        // Usuń białe znaki
        $css = str_replace(["\r\n", "\r", "\n", "\t", '  ', '    ', '    '], '', $css);
        // Usuń niepotrzebne spacje wokół znaków
        $css = str_replace([': ', ' :', ' {', '{ ', '} ', ' }', '; ', ' ;'], [':', ':', '{', '{', '}', '}', ';', ';'], $css);
        
        return trim($css);
    }
    
    /**
     * 🎨 Konwertuje hex na RGB
     */
    private function hexToRgb($hex) {
        $hex = ltrim($hex, '#');
        $rgb = [];
        
        if (strlen($hex) === 3) {
            $rgb[0] = hexdec(substr($hex, 0, 1) . substr($hex, 0, 1));
            $rgb[1] = hexdec(substr($hex, 1, 1) . substr($hex, 1, 1));
            $rgb[2] = hexdec(substr($hex, 2, 1) . substr($hex, 2, 1));
        } else {
            $rgb[0] = hexdec(substr($hex, 0, 2));
            $rgb[1] = hexdec(substr($hex, 2, 2));
            $rgb[2] = hexdec(substr($hex, 4, 2));
        }
        
        return implode(',', $rgb);
    }
    
    /**
     * 🔆 Dostosowuje jasność koloru
     */
    private function adjustBrightness($hex, $percent) {
        $hex = ltrim($hex, '#');
        $rgb = [];
        
        for ($i = 0; $i < 3; $i++) {
            $color = hexdec(substr($hex, $i * 2, 2));
            $color = max(0, min(255, $color + ($color * $percent / 100)));
            $rgb[] = str_pad(dechex($color), 2, '0', STR_PAD_LEFT);
        }
        
        return '#' . implode('', $rgb);
    }
    
    /**
     * 🔤 Zwraca rodzinę fontów
     */
    private function getFontFamily($font) {
        $fonts = [
            'system' => '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif',
            'arial' => 'Arial, sans-serif',
            'helvetica' => '"Helvetica Neue", Helvetica, Arial, sans-serif',
            'georgia' => 'Georgia, serif',
            'times' => '"Times New Roman", Times, serif',
            'courier' => '"Courier New", Courier, monospace'
        ];
        
        return $fonts[$font] ?? $fonts['system'];
    }
} 