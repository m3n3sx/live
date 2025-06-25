<?php

namespace ModernAdminStylerV2\Services;

/**
 * Serwis zarządzania zasobami (CSS/JS)
 */
class AssetService {
    private $settingsService;
    
    public function __construct() {
        // Nie tworzymy SettingsService jeśli nie jest potrzebny - używamy ustawień bezpośrednio
        $this->settingsService = null;
    }
    
    /**
     * Ładuje zasoby dla interfejsu administracyjnego
     */
    public function enqueueAdminAssets() {
        // CSS
        wp_enqueue_style(
            'mas-v2-admin',
            MAS_V2_PLUGIN_URL . 'assets/css/admin-modern.css',
            [],
            MAS_V2_VERSION
        );
        
        // JavaScript
        wp_enqueue_script(
            'mas-v2-admin',
            MAS_V2_PLUGIN_URL . 'assets/js/admin-modern.js',
            ['jquery'],
            MAS_V2_VERSION,
            true
        );
        
        // Dodatkowe skrypty potrzebne dla interfejsu
        wp_enqueue_script('wp-color-picker');
        wp_enqueue_style('wp-color-picker');
        
        // Media uploader jeśli potrzebny
        if (function_exists('wp_enqueue_media')) {
            wp_enqueue_media();
        }
    }
    
    /**
     * Ładuje style dla front-end WordPressa
     */
    public function enqueueFrontendStyles() {
        $settings = get_option('mas_v2_settings', []);
        
        // Dynamiczne CSS
        $css = $this->generateDynamicCSS($settings);
        
        if (!empty($css)) {
            wp_add_inline_style('admin-bar', $css);
        }
        
        // Niestandardowe CSS
        if (!empty($settings['custom_css'])) {
            wp_add_inline_style('admin-bar', $settings['custom_css']);
        }
    }
    
    /**
     * Generuje dynamiczne CSS na podstawie ustawień
     */
    public function generateDynamicCSS($settings) {
        $css = '';
        
        // Admin Bar styles
        if (is_admin_bar_showing()) {
            $css .= $this->generateAdminBarCSS($settings);
        }
        
        // Menu styles (tylko w admin area)
        if (is_admin()) {
            $css .= $this->generateMenuCSS($settings);
            $css .= $this->generateContentCSS($settings);
            $css .= $this->generateButtonCSS($settings);
        }
        
        return $css;
    }
    
    /**
     * Generuje CSS dla Admin Bar
     */
    private function generateAdminBarCSS($settings) {
        $css = '';
        
        // Podstawowe style admin bar
        $css .= "#wpadminbar {";
        if (isset($settings['admin_bar_background'])) {
            $css .= "background: {$settings['admin_bar_background']} !important;";
        }
        if (isset($settings['admin_bar_height'])) {
            $css .= "height: {$settings['admin_bar_height']}px !important;";
        }
        
        // Zaokrąglenie narożników Admin Bar
        $cornerType = $settings['admin_bar_corner_radius_type'] ?? 'none';
        if ($cornerType === 'all' && ($settings['admin_bar_corner_radius_all'] ?? 0) > 0) {
            $radius = $settings['admin_bar_corner_radius_all'];
            $css .= "border-radius: {$radius}px;";
        } elseif ($cornerType === 'individual') {
            $tl = $settings['admin_bar_corner_radius_top_left'] ?? 0;
            $tr = $settings['admin_bar_corner_radius_top_right'] ?? 0;
            $br = $settings['admin_bar_corner_radius_bottom_right'] ?? 0;
            $bl = $settings['admin_bar_corner_radius_bottom_left'] ?? 0;
            $css .= "border-radius: {$tl}px {$tr}px {$br}px {$bl}px;";
        }
        
        if (isset($settings['admin_bar_shadow']) && $settings['admin_bar_shadow']) {
            $css .= "box-shadow: 0 2px 8px rgba(0,0,0,0.1);";
        }
        
        if (isset($settings['admin_bar_glassmorphism']) && $settings['admin_bar_glassmorphism']) {
            $css .= "backdrop-filter: blur(10px);";
            $css .= "background: rgba(35, 40, 45, 0.8) !important;";
        }
        
        if (isset($settings['admin_bar_detached']) && $settings['admin_bar_detached']) {
            $css .= "position: fixed !important;";
            $css .= "top: 10px !important;";
            $css .= "left: 10px !important;";
            $css .= "right: 10px !important;";
            $css .= "width: auto !important;";
            $css .= "border-radius: 8px;";
            $css .= "z-index: 99999;";
        }
        
        $css .= "}";
        
        // CSS Variables dla Admin Bar
        $css .= "body {";
        if ($cornerType === 'all') {
            $css .= "--mas-admin-bar-corner-all: {$settings['admin_bar_corner_radius_all']}px;";
        } elseif ($cornerType === 'individual') {
            $css .= "--mas-admin-bar-corner-tl: {$settings['admin_bar_corner_radius_top_left']}px;";
            $css .= "--mas-admin-bar-corner-tr: {$settings['admin_bar_corner_radius_top_right']}px;";
            $css .= "--mas-admin-bar-corner-br: {$settings['admin_bar_corner_radius_bottom_right']}px;";
            $css .= "--mas-admin-bar-corner-bl: {$settings['admin_bar_corner_radius_bottom_left']}px;";
        }
        $css .= "}";
        
        // Tekst w admin bar
        if (isset($settings['admin_bar_text_color']) || isset($settings['admin_bar_font_size'])) {
            $css .= "#wpadminbar .ab-item,";
            $css .= "#wpadminbar a.ab-item,";
            $css .= "#wpadminbar > #wp-toolbar span.ab-label,";
            $css .= "#wpadminbar > #wp-toolbar span.noticon {";
            if (isset($settings['admin_bar_text_color'])) {
                $css .= "color: {$settings['admin_bar_text_color']} !important;";
            }
            if (isset($settings['admin_bar_font_size'])) {
                $css .= "font-size: {$settings['admin_bar_font_size']}px !important;";
            }
            $css .= "}";
        }
        
        // Hover effects
        if (isset($settings['admin_bar_hover_color'])) {
            $css .= "#wpadminbar .ab-top-menu > li:hover > .ab-item,";
            $css .= "#wpadminbar .ab-top-menu > li > .ab-item:focus,";
            $css .= "#wpadminbar.nojq .quicklinks .ab-top-menu > li > .ab-item:focus {";
            $css .= "color: {$settings['admin_bar_hover_color']} !important;";
            $css .= "}";
        }
        
        return $css;
    }
    
    /**
     * Generuje CSS dla menu administracyjnego
     */
    private function generateMenuCSS($settings) {
        $css = '';
        
        // Menu główne
        $css .= "#adminmenu {";
        if (isset($settings['menu_background'])) {
            $css .= "background: {$settings['menu_background']} !important;";
        }
        
        // Zaokrąglenie narożników Menu
        $cornerType = $settings['corner_radius_type'] ?? 'none';
        if ($cornerType === 'all' && ($settings['corner_radius_all'] ?? 0) > 0) {
            $radius = $settings['corner_radius_all'];
            $css .= "border-radius: {$radius}px;";
        } elseif ($cornerType === 'individual') {
            $tl = $settings['corner_radius_top_left'] ?? 0;
            $tr = $settings['corner_radius_top_right'] ?? 0;
            $br = $settings['corner_radius_bottom_right'] ?? 0;
            $bl = $settings['corner_radius_bottom_left'] ?? 0;
            $css .= "border-radius: {$tl}px {$tr}px {$br}px {$bl}px;";
        }
        
        if (isset($settings['menu_shadow']) && $settings['menu_shadow']) {
            $css .= "box-shadow: 2px 0 8px rgba(0,0,0,0.1);";
        }
        
        if (isset($settings['menu_glassmorphism']) && $settings['menu_glassmorphism']) {
            $css .= "backdrop-filter: blur(10px);";
            $css .= "background: rgba(35, 40, 45, 0.9) !important;";
        }
        
        $css .= "}";
        
        // CSS Variables dla Menu
        $css .= "body {";
        if ($cornerType === 'all') {
            $css .= "--mas-corner-all: {$settings['corner_radius_all']}px;";
        } elseif ($cornerType === 'individual') {
            $css .= "--mas-corner-tl: {$settings['corner_radius_top_left']}px;";
            $css .= "--mas-corner-tr: {$settings['corner_radius_top_right']}px;";
            $css .= "--mas-corner-br: {$settings['corner_radius_bottom_right']}px;";
            $css .= "--mas-corner-bl: {$settings['corner_radius_bottom_left']}px;";
        }
        $css .= "}";
        
        // Elementy menu
        if (isset($settings['menu_text_color'])) {
            $css .= "#adminmenu a { color: {$settings['menu_text_color']} !important; }";
        }
        
        // Hover states
        if (isset($settings['menu_hover_background']) || isset($settings['menu_hover_text_color'])) {
            $css .= "#adminmenu li:hover a, #adminmenu li a:focus {";
            if (isset($settings['menu_hover_background'])) {
                $css .= "background: {$settings['menu_hover_background']} !important;";
            }
            if (isset($settings['menu_hover_text_color'])) {
                $css .= "color: {$settings['menu_hover_text_color']} !important;";
            }
            $css .= "}";
        }
        
        // Aktywne elementy
        if (isset($settings['menu_active_background']) || isset($settings['menu_active_text_color'])) {
            $css .= "#adminmenu .wp-has-current-submenu a.wp-has-current-submenu, #adminmenu .current a.menu-top {";
            if (isset($settings['menu_active_background'])) {
                $css .= "background: {$settings['menu_active_background']} !important;";
            }
            if (isset($settings['menu_active_text_color'])) {
                $css .= "color: {$settings['menu_active_text_color']} !important;";
            }
            $css .= "}";
        }
        
        return $css;
    }
    
    /**
     * Generuje CSS dla obszaru treści
     */
    private function generateContentCSS($settings) {
        $css = '';
        
        // Główny kontener treści
        if (isset($settings['content_background'])) {
            $css .= "#wpbody-content { background: {$settings['content_background']} !important; }";
        }
        
        if (isset($settings['content_text_color'])) {
            $css .= "#wpbody-content { color: {$settings['content_text_color']} !important; }";
        }
        
        // Karty/boxy
        if (isset($settings['content_card_background'])) {
            $css .= ".postbox, .meta-box-sortables .postbox { background: {$settings['content_card_background']} !important; }";
        }
        
        // Linki
        if (isset($settings['content_link_color'])) {
            $css .= "#wpbody-content a { color: {$settings['content_link_color']} !important; }";
        }
        
        return $css;
    }
    
    /**
     * Generuje CSS dla przycisków
     */
    private function generateButtonCSS($settings) {
        $css = '';
        
        // Główne przyciski
        if (isset($settings['button_primary_background'])) {
            $css .= ".button-primary { background: {$settings['button_primary_background']} !important; border-color: {$settings['button_primary_background']} !important; }";
        }
        
        if (isset($settings['button_primary_text_color'])) {
            $css .= ".button-primary { color: {$settings['button_primary_text_color']} !important; }";
        }
        
        if (isset($settings['button_border_radius']) && $settings['button_border_radius'] > 0) {
            $css .= ".button, .button-primary, .button-secondary { border-radius: {$settings['button_border_radius']}px !important; }";
        }
        
        return $css;
    }
    
    /**
     * Minifikuje CSS
     */
    public function minifyCSS($css) {
        // Usuń komentarze
        $css = preg_replace('!/\*[^*]*\*+([^/][^*]*\*+)*/!', '', $css);
        
        // Usuń niepotrzebne spacje
        $css = str_replace(["\r\n", "\r", "\n", "\t", '  ', '    ', '    '], '', $css);
        
        // Usuń spacje wokół znaków specjalnych
        $css = str_replace([' {', '{ ', ' }', '} ', ': ', ' :', '; ', ' ;', ', ', ' ,'], ['{', '{', '}', '}', ':', ':', ';', ';', ',', ','], $css);
        
        return trim($css);
    }
    
    /**
     * Sprawdza czy plik istnieje w cache
     */
    public function getCachedAsset($key) {
        $transient_key = 'mas_v2_css_' . md5($key);
        return get_transient($transient_key);
    }
    
    /**
     * Zapisuje do cache
     */
    public function setCachedAsset($key, $content, $duration = 3600) {
        $transient_key = 'mas_v2_css_' . md5($key);
        return set_transient($transient_key, $content, $duration);
    }
    
    /**
     * Czyści cache zasobów
     */
    public function clearAssetCache() {
        global $wpdb;
        
        $wpdb->query(
            "DELETE FROM {$wpdb->options} 
             WHERE option_name LIKE '_transient_mas_v2_css_%' 
             OR option_name LIKE '_transient_timeout_mas_v2_css_%'"
        );
    }
} 