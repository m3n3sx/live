<?php
/**
 * Settings Manager Service
 * 
 * Odpowiedzialny za pobieranie, zapisywanie i sanitację ustawień
 * 
 * @package ModernAdminStyler
 * @version 2.0
 */

namespace ModernAdminStyler\Services;

class SettingsManager {
    
    const OPTION_NAME = 'mas_v2_settings';
    
    /**
     * 📥 Pobiera ustawienia z bazy danych
     */
    public function getSettings() {
        $defaults = $this->getDefaultSettings();
        $saved_settings = get_option(self::OPTION_NAME, []);
        
        // Merge z domyślnymi ustawieniami
        return wp_parse_args($saved_settings, $defaults);
    }
    
    /**
     * 💾 Zapisuje ustawienia do bazy danych
     */
    public function saveSettings($settings) {
        return update_option(self::OPTION_NAME, $settings);
    }
    
    /**
     * 🔒 WORLD-CLASS SECURITY: Centralized Sanitization Engine
     * Sanitizes all input data according to field type and security requirements
     * 
     * @param array $input Raw input data
     * @return array Sanitized data
     */
    public function sanitizeSettings(array $input): array {
        $sanitized = [];
        $defaults = $this->getDefaultSettings();
        
        foreach ($input as $key => $value) {
            switch ($key) {
                // ========================================
                // 🎨 COLOR FIELDS (hex validation)
                // ========================================
                case 'admin_bar_background':
                case 'admin_bar_text_color':
                case 'admin_bar_hover_color':
                case 'menu_background_color':
                case 'menu_text_color':
                case 'menu_hover_color':
                case 'menu_active_color':
                case 'menu_active_text_color':
                case 'submenu_bg_color':
                case 'submenu_text_color':
                case 'submenu_hover_bg_color':
                case 'submenu_hover_text_color':
                case 'submenu_active_bg_color':
                case 'accent_color':
                case 'content_background_color':
                case 'button_bg_color':
                case 'button_text_color':
                    $sanitized[$key] = $this->sanitizeColor($value, $defaults[$key] ?? '#000000');
                    break;
                    
                // ========================================
                // 🔢 NUMERIC FIELDS (integer validation)
                // ========================================
                case 'admin_bar_height':
                case 'admin_bar_margin':
                case 'admin_bar_border_radius':
                case 'admin_bar_font_size':
                case 'admin_bar_padding':
                case 'menu_width':
                case 'menu_margin':
                case 'menu_border_radius':
                case 'menu_item_height':
                case 'menu_item_spacing':
                case 'menu_submenu_width':
                case 'submenu_indent':
                case 'global_font_size':
                case 'content_padding':
                case 'content_border_radius':
                case 'button_border_radius':
                    $sanitized[$key] = $this->sanitizeNumeric($value, $defaults[$key] ?? 0);
                    break;
                    
                // ========================================
                // 🔘 BOOLEAN FIELDS (checkbox validation)
                // ========================================
                case 'enable_plugin':
                case 'admin_bar_floating':
                case 'menu_floating':
                case 'menu_glassmorphism':
                case 'admin_bar_glossy':
                case 'enable_animations':
                case 'menu_compact_mode':
                case 'submenu_separator':
                case 'hide_wp_logo':
                case 'hide_site_name':
                case 'hide_update_notices':
                case 'hide_comments':
                case 'hide_howdy':
                case 'hide_help_tab':
                case 'hide_screen_options':
                case 'hide_wp_version':
                case 'hide_admin_notices':
                case 'disable_emojis':
                case 'disable_embeds':
                case 'remove_jquery_migrate':
                    $sanitized[$key] = $this->sanitizeBoolean($value);
                    break;
                    
                // ========================================
                // 📝 TEXT FIELDS (basic text sanitization)
                // ========================================
                case 'body_font':
                case 'headings_font':
                case 'submenu_indicator_style':
                    $sanitized[$key] = $this->sanitizeText($value, $defaults[$key] ?? '');
                    break;
                    
                // ========================================
                // 🎚️ RANGE/SCALE FIELDS (float validation)
                // ========================================
                case 'global_line_height':
                case 'headings_scale':
                    $sanitized[$key] = $this->sanitizeFloat($value, $defaults[$key] ?? 1.0);
                    break;
                    
                // ========================================
                // 📋 SELECT FIELDS (predefined options)
                // ========================================
                case 'color_scheme':
                    $allowed_values = ['light', 'dark', 'auto'];
                    $sanitized[$key] = $this->sanitizeSelect($value, $allowed_values, $defaults['color_scheme'] ?? 'auto');
                    break;
                    
                case 'color_palette':
                    $allowed_values = ['default', 'blue', 'coffee', 'ectoplasm', 'midnight', 'ocean', 'sunrise'];
                    $sanitized[$key] = $this->sanitizeSelect($value, $allowed_values, $defaults['color_palette'] ?? 'default');
                    break;
                    
                // ========================================
                // 💻 DANGEROUS FIELDS (special sanitization)
                // ========================================
                case 'custom_css':
                    $sanitized[$key] = $this->sanitizeCSS($value);
                    break;
                    
                case 'custom_js':
                    $sanitized[$key] = $this->sanitizeJavaScript($value);
                    break;
                    
                // ========================================
                // 🛡️ DEFAULT FALLBACK (unknown fields)
                // ========================================
                default:
                    $sanitized[$key] = $this->sanitizeText($value, '');
                    error_log("MAS V2 Security Warning: Unknown field '$key' sanitized as text");
                    break;
            }
        }
        
        error_log("MAS V2 Security: Sanitized " . count($sanitized) . " settings fields");
        return $sanitized;
    }

    /**
     * 🎨 Sanitize color field (hex validation)
     */
    private function sanitizeColor(string $value, string $default): string {
        $sanitized = sanitize_hex_color($value);
        return $sanitized !== null ? $sanitized : $default;
    }

    /**
     * 🔢 Sanitize numeric field
     */
    private function sanitizeNumeric($value, int $default): int {
        $sanitized = absint($value);
        return $sanitized > 0 ? $sanitized : $default;
    }

    /**
     * 🔘 Sanitize boolean field
     */
    private function sanitizeBoolean($value): bool {
        return ($value === '1' || $value === true || $value === 1);
    }

    /**
     * 📝 Sanitize text field
     */
    private function sanitizeText($value, string $default): string {
        $sanitized = sanitize_text_field($value);
        return !empty($sanitized) ? $sanitized : $default;
    }

    /**
     * 🎚️ Sanitize float field
     */
    private function sanitizeFloat($value, float $default): float {
        $sanitized = floatval($value);
        return $sanitized > 0 ? $sanitized : $default;
    }

    /**
     * 📋 Sanitize select field (predefined options)
     */
    private function sanitizeSelect($value, array $allowed_values, string $default): string {
        return in_array($value, $allowed_values, true) ? $value : $default;
    }

    /**
     * 💻 Sanitize CSS field (special handling)
     */
    private function sanitizeCSS($value): string {
        if (empty($value)) return '';
        
        // Remove script tags and dangerous functions
        $dangerous_patterns = [
            '/<script[^>]*>.*?<\/script>/is',
            '/javascript:/i',
            '/expression\s*\(/i',
            '/behavior\s*:/i',
            '/binding\s*:/i',
            '/@import/i'
        ];
        
        $sanitized = $value;
        foreach ($dangerous_patterns as $pattern) {
            $sanitized = preg_replace($pattern, '', $sanitized);
        }
        
        // Allow only CSS-safe characters
        $sanitized = wp_strip_all_tags($sanitized);
        
        error_log("MAS V2 Security: CSS sanitized, " . strlen($value) . " -> " . strlen($sanitized) . " chars");
        return $sanitized;
    }

    /**
     * ⚡ Sanitize JavaScript field (special handling)
     */
    private function sanitizeJavaScript($value): string {
        if (empty($value)) return '';
        
        // For security, we heavily restrict JS
        // Only allow basic console.log and simple variable assignments
        $allowed_patterns = [
            '/^console\.log\(.+\);?$/m',
            '/^var\s+\w+\s*=\s*.+;?$/m',
            '/^\/\/.*$/m',  // Comments
            '/^\/\*.*?\*\/$/ms'  // Block comments
        ];
        
        $lines = explode("\n", $value);
        $sanitized_lines = [];
        
        foreach ($lines as $line) {
            $line = trim($line);
            if (empty($line)) continue;
            
            $allowed = false;
            foreach ($allowed_patterns as $pattern) {
                if (preg_match($pattern, $line)) {
                    $allowed = true;
                    break;
                }
            }
            
            if ($allowed) {
                $sanitized_lines[] = sanitize_text_field($line);
            } else {
                error_log("MAS V2 Security: Blocked JS line: " . $line);
            }
        }
        
        return implode("\n", $sanitized_lines);
    }
    
    /**
     * ⚙️ Zwraca domyślne ustawienia - WSZYSTKO WYŁĄCZONE DOMYŚLNIE
     */
    public function getDefaultSettings() {
        return [
            // Global Settings - WYŁĄCZONE
            'enable_plugin' => false,  // 🔒 Główny wyłącznik - WYŁĄCZONY
            'color_scheme' => 'light', // Pozostaw default WordPress
            'color_palette' => 'modern', // Pozostaw default
            
            // Layout - WSZYSTKO WYŁĄCZONE
            'menu_floating' => false,
            'admin_bar_floating' => false,
            'admin_bar_glossy' => false,
            'menu_glossy' => false,
            'glassmorphism_enabled' => false,
            'animations_enabled' => false,
            
            // Admin Bar - tylko podstawowe wartości WordPress
            'admin_bar_height' => 32,
            'admin_bar_background' => '#23282d',
            'admin_bar_text_color' => '#eee',
            'admin_bar_hover_color' => '#00a0d2',
            
            // Menu - tylko podstawowe wartości WordPress
            'menu_width' => 160,
            'menu_background' => '#23282d',
            'menu_text_color' => '#eee',
            'menu_hover_background' => '#32373c',
            'menu_hover_text_color' => '#00a0d2',
            'menu_compact_mode' => false,
            
            // Submenu - tylko podstawowe wartości WordPress
            'submenu_background' => '#32373c',
            'submenu_text_color' => '#eee',
            'submenu_hover_background' => '#0073aa',
            'submenu_hover_text_color' => '#fff',
            'submenu_separator' => false,
            'submenu_indicator_style' => 'arrow',
            
            // Typography - tylko podstawowe wartości WordPress
            'body_font' => 'system',
            'headings_font' => 'inherit',
            'global_font_size' => 14,
            'global_line_height' => 1.5,
            'headings_scale' => 1.0,
            
            // Advanced - WSZYSTKO WYŁĄCZONE
            'hide_help_tab' => false,
            'hide_screen_options' => false,
            'hide_wp_version' => false,
            'hide_admin_notices' => false,
            'disable_emojis' => false,
            'disable_embeds' => false,
            'remove_jquery_migrate' => false,
            
            // Custom Code - PUSTE
            'custom_css' => '',
            'custom_js' => ''
        ];
    }
} 