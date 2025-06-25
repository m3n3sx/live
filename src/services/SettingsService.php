<?php

namespace ModernAdminStylerV2\Services;

/**
 * Serwis zarządzania ustawieniami
 */
class SettingsService {
    private $optionName = 'mas_v2_settings';
    private $defaults = null;
    
    /**
     * Pobiera wszystkie ustawienia
     */
    public function getSettings() {
        $settings = get_option($this->optionName, []);
        $defaults = $this->getDefaults();
        
        // Merge z domyślnymi wartościami żeby uniknąć błędów niezdefiniowanych indeksów
        return wp_parse_args($settings, $defaults);
    }
    
    /**
     * Zapisuje ustawienia
     */
    public function saveSettings($settings) {
        $sanitized = $this->sanitizeSettings($settings);
        return update_option($this->optionName, $sanitized);
    }
    
    /**
     * Resetuje ustawienia do domyślnych
     */
    public function resetSettings() {
        return update_option($this->optionName, $this->getDefaults());
    }
    
    /**
     * Sanityzuje ustawienia
     */
    public function sanitizeSettings($input) {
        $defaults = $this->getDefaults();
        $sanitized = [];
        
        foreach ($defaults as $key => $default_value) {
            if (!isset($input[$key])) {
                $sanitized[$key] = $default_value;
                continue;
            }
            
            $value = $input[$key];
            
            // Sanityzacja w zależności od typu domyślnej wartości
            switch (gettype($default_value)) {
                case 'boolean':
                    $sanitized[$key] = (bool) $value;
                    break;
                    
                case 'integer':
                    $sanitized[$key] = (int) $value;
                    break;
                    
                case 'double':
                    $sanitized[$key] = (float) $value;
                    break;
                    
                case 'string':
                    if ($key === 'custom_css') {
                        // Niestandardowy CSS - tylko podstawowa walidacja
                        $sanitized[$key] = wp_strip_all_tags($value);
                    } elseif (strpos($key, 'color') !== false) {
                        // Kolory - walidacja hex
                        $sanitized[$key] = $this->sanitizeColor($value);
                    } elseif (strpos($key, 'url') !== false) {
                        // URLe
                        $sanitized[$key] = esc_url_raw($value);
                    } else {
                        // Zwykły tekst
                        $sanitized[$key] = sanitize_text_field($value);
                    }
                    break;
                    
                case 'array':
                    $sanitized[$key] = is_array($value) ? array_map('sanitize_text_field', $value) : $default_value;
                    break;
                    
                default:
                    $sanitized[$key] = $default_value;
            }
        }
        
        return $sanitized;
    }
    
    /**
     * Sanityzuje kolor hex
     */
    private function sanitizeColor($color) {
        if (empty($color)) {
            return '';
        }
        
        // Usuń # jeśli istnieje
        $color = ltrim($color, '#');
        
        // Sprawdź czy to prawidłowy hex (3 lub 6 znaków)
        if (preg_match('/^[a-fA-F0-9]{3}$/', $color) || preg_match('/^[a-fA-F0-9]{6}$/', $color)) {
            return '#' . $color;
        }
        
        return '';
    }
    
    /**
     * Pobiera pojedyncze ustawienie
     */
    public function getSetting($key, $default = null) {
        $settings = $this->getSettings();
        
        if ($default === null) {
            $defaults = $this->getDefaults();
            $default = $defaults[$key] ?? null;
        }
        
        return $settings[$key] ?? $default;
    }
    
    /**
     * Ustawia pojedyncze ustawienie
     */
    public function setSetting($key, $value) {
        $settings = $this->getSettings();
        $settings[$key] = $value;
        return $this->saveSettings($settings);
    }
    
    /**
     * Domyślne ustawienia
     */
    public function getDefaults() {
        if ($this->defaults !== null) {
            return $this->defaults;
        }
        
        $this->defaults = [
            // Ogólne
            'theme' => 'modern',
            'color_scheme' => 'light',
            'font_family' => 'system',
            'font_size' => 14,
            'animations' => true,
            'live_preview' => true,
            'auto_save' => false,
            
            // Admin Bar
            'admin_bar_background' => '#23282d',
            'admin_bar_text_color' => '#ffffff',
            'admin_bar_hover_color' => '#00a0d2',
            'admin_bar_height' => 32,
            'admin_bar_font_size' => 13,
            'admin_bar_padding' => 8,
            'admin_bar_border_radius' => 0,
            'admin_bar_shadow' => false,
            'admin_bar_glassmorphism' => false,
            'admin_bar_detached' => false,
            
            // Menu
            'menu_background' => '#23282d',
            'menu_text_color' => '#ffffff',
            'menu_hover_background' => '#32373c',
            'menu_hover_text_color' => '#00a0d2',
            'menu_active_background' => '#0073aa',
            'menu_active_text_color' => '#ffffff',
            'menu_width' => 160,
            'menu_collapsed_width' => 36,
            'menu_border_radius' => 0,
            'menu_shadow' => false,
            'menu_icons' => true,
            'menu_glassmorphism' => false,
            
            // Treść
            'content_background' => '#ffffff',
            'content_text_color' => '#32373c',
            'content_border_radius' => 0,
            'content_shadow' => false,
            'content_padding' => 20,
            'content_max_width' => 0, // 0 = bez limitu
            
            // Typografia
            'heading_font_family' => 'inherit',
            'heading_font_weight' => 600,
            'body_font_family' => 'inherit',
            'body_font_weight' => 400,
            'line_height' => 1.5,
            
            // Przyciski
            'button_style' => 'default',
            'button_border_radius' => 3,
            'button_shadow' => false,
            'primary_button_color' => '#0073aa',
            'secondary_button_color' => '#f1f1f1',
            
            // Efekty
            'enable_animations' => true,
            'animation_speed' => 300,
            'hover_effects' => true,
            'glassmorphism_blur' => 10,
            'shadow_intensity' => 0.1,
            
            // Zaawansowane
            'custom_css' => '',
            'enable_debug' => false,
            'cache_duration' => 3600,
            'minify_css' => false,
        ];
        
        return $this->defaults;
    }
    
    /**
     * Pobiera grupę ustawień
     */
    public function getSettingsGroup($group) {
        $settings = $this->getSettings();
        $filtered = [];
        
        foreach ($settings as $key => $value) {
            if (strpos($key, $group . '_') === 0) {
                $filtered[$key] = $value;
            }
        }
        
        return $filtered;
    }
    
    /**
     * Eksportuje ustawienia do JSON
     */
    public function exportSettings() {
        $settings = $this->getSettings();
        
        return [
            'version' => MAS_V2_VERSION,
            'exported_at' => current_time('mysql'),
            'site_url' => get_site_url(),
            'settings' => $settings
        ];
    }
    
    /**
     * Importuje ustawienia z JSON
     */
    public function importSettings($data) {
        if (!is_array($data) || !isset($data['settings'])) {
            throw new \Exception(__('Nieprawidłowy format danych importu', 'modern-admin-styler-v2'));
        }
        
        $settings = $this->sanitizeSettings($data['settings']);
        return $this->saveSettings($settings);
    }
} 