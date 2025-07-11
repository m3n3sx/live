<?php
/**
 * Settings Manager Service
 * 
 * Odpowiedzialny za pobieranie, zapisywanie i sanitację ustawień
 * ENHANCED: Integrated with ComponentAdapter for WordPress-native UI rendering
 * 
 * @package ModernAdminStyler
 * @version 2.2.0
 */

namespace ModernAdminStyler\Services;

class SettingsManager {
    
    const OPTION_NAME = 'mas_v2_settings';
    
    /**
     * @var CoreEngine Core engine instance for service access
     */
    private $coreEngine;
    
    /**
     * @var ComponentAdapter Component adapter for WordPress-native UI rendering
     */
    private $component_adapter;
    
    /**
     * 🚀 Initialize Settings Manager with ComponentAdapter integration
     */
    public function __construct($coreEngine = null) {
        $this->coreEngine = $coreEngine;
        
        // ComponentAdapter functionality is now integrated into SettingsManager
        // (part of consolidation - Block 8)
        $this->component_adapter = $this;
    }
    
    /**
     * 📥 Pobiera ustawienia z bazy danych
     * REFACTOR: Now uses central schema from main plugin class
     */
    public function getSettings() {
        // Get defaults from central schema
        $plugin_instance = \ModernAdminStylerV2::getInstance();
        $defaults = $plugin_instance->getDefaultSettings();
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
     * 🎨 Render Settings Form Field using ComponentAdapter
     * WordPress-native rendering with enhanced security and usability
     */
    public function renderSettingsField($field_type, $field_name, $field_value = '', $args = []) {
        if (!$this->component_adapter) {
            error_log('MAS V2 Warning: ComponentAdapter not available for field rendering');
            return $this->renderBasicField($field_type, $field_name, $field_value, $args);
        }
        
        // Enhanced field arguments with MAS V2 styling
        $enhanced_args = wp_parse_args($args, [
            'classes' => 'mas-v2-field',
            'wrap_table' => true,
            'description' => '',
            'required' => false
        ]);
        
        return $this->component_adapter->renderWordPressFormField(
            $field_type, 
            $field_name, 
            $field_value, 
            $enhanced_args
        );
    }
    
    /**
     * 🎯 Render Settings Section using ComponentAdapter
     */
    public function renderSettingsSection($title, $content, $args = []) {
        if (!$this->component_adapter) {
            return $this->renderBasicSection($title, $content, $args);
        }
        
        $enhanced_args = wp_parse_args($args, [
            'id' => 'mas-v2-section-' . sanitize_title($title),
            'classes' => 'mas-v2-settings-section',
            'description' => ''
        ]);
        
        return $this->component_adapter->renderWordPressMetabox($content, $title, $enhanced_args);
    }
    
    /**
     * 🔲 Render Settings Button using ComponentAdapter
     */
    public function renderSettingsButton($text, $type = 'secondary', $args = []) {
        if (!$this->component_adapter) {
            return sprintf('<button type="button" class="button button-%s">%s</button>', 
                esc_attr($type), esc_html($text));
        }
        
        $enhanced_args = wp_parse_args($args, [
            'classes' => 'mas-v2-button',
            'size' => 'normal'
        ]);
        
        return $this->component_adapter->renderWordPressButton($text, $type, $enhanced_args);
    }
    
    /**
     * 📢 Render Settings Notice using ComponentAdapter
     */
    public function renderSettingsNotice($message, $type = 'info', $args = []) {
        if (!$this->component_adapter) {
            return sprintf('<div class="notice notice-%s"><p>%s</p></div>', 
                esc_attr($type), wp_kses_post($message));
        }
        
        $enhanced_args = wp_parse_args($args, [
            'dismissible' => true,
            'classes' => 'mas-v2-notice'
        ]);
        
        return $this->component_adapter->renderWordPressNotice($message, $type, $enhanced_args);
    }
    
    /**
     * 🗂️ Render Settings Table using ComponentAdapter
     */
    public function renderSettingsTable($headers, $rows, $args = []) {
        if (!$this->component_adapter) {
            return $this->renderBasicTable($headers, $rows, $args);
        }
        
        $enhanced_args = wp_parse_args($args, [
            'classes' => 'wp-list-table widefat fixed striped mas-v2-table',
            'responsive' => true
        ]);
        
        return $this->component_adapter->renderWordPressTable($headers, $rows, $enhanced_args);
    }
    
    /**
     * 🎨 Render Complete Settings Form with ComponentAdapter
     */
    public function renderCompleteSettingsForm($settings_schema, $current_values = []) {
        if (!$this->component_adapter) {
            return $this->renderBasicForm($settings_schema, $current_values);
        }
        
        $output = '';
        
        // Group settings by sections
        $sections = $this->groupSettingsBySection($settings_schema);
        
        foreach ($sections as $section_name => $section_fields) {
            $section_title = ucfirst(str_replace('_', ' ', $section_name));
            $section_content = '';
            
            // Render fields in section
            foreach ($section_fields as $field_name => $field_config) {
                $field_value = $current_values[$field_name] ?? ($field_config['default'] ?? '');
                
                $field_args = [
                    'label' => $field_config['label'] ?? ucfirst(str_replace('_', ' ', $field_name)),
                    'description' => $field_config['description'] ?? '',
                    'required' => $field_config['required'] ?? false,
                    'options' => $field_config['options'] ?? [],
                    'classes' => 'mas-v2-field-' . $field_config['type'],
                    'wrap_table' => true
                ];
                
                $section_content .= $this->renderSettingsField(
                    $field_config['type'], 
                    $field_name, 
                    $field_value, 
                    $field_args
                );
            }
            
            // Wrap section in metabox
            $output .= $this->renderSettingsSection($section_title, $section_content, [
                'description' => 'Konfiguracja sekcji ' . strtolower($section_title)
            ]);
        }
        
        return $output;
    }
    
    /**
     * 🔧 Group Settings by Section
     */
    private function groupSettingsBySection($settings_schema) {
        $sections = [];
        
        foreach ($settings_schema as $field_name => $field_config) {
            $section = $field_config['section'] ?? 'general';
            
            if (!isset($sections[$section])) {
                $sections[$section] = [];
            }
            
            $sections[$section][$field_name] = $field_config;
        }
        
        return $sections;
    }
    
    /**
     * 📋 Get Settings Schema for Form Generation
     */
    public function getSettingsSchema() {
        return [
            'enable_plugin' => [
                'type' => 'checkbox',
                'label' => 'Włącz wtyczkę',
                'description' => 'Główny przełącznik funkcjonalności wtyczki',
                'default' => false,
                'section' => 'general'
            ],
            'color_scheme' => [
                'type' => 'select',
                'label' => 'Schemat kolorów',
                'description' => 'Wybierz podstawowy schemat kolorów',
                'options' => [
                    'light' => 'Jasny',
                    'dark' => 'Ciemny',
                    'auto' => 'Automatyczny'
                ],
                'default' => 'light',
                'section' => 'appearance'
            ],
            'admin_bar_background' => [
                'type' => 'color',
                'label' => 'Kolor tła paska administracyjnego',
                'description' => 'Ustaw kolor tła górnego paska',
                'default' => '#23282d',
                'section' => 'admin_bar'
            ],
            'menu_width' => [
                'type' => 'number',
                'label' => 'Szerokość menu',
                'description' => 'Szerokość menu bocznego w pikselach',
                'default' => 160,
                'section' => 'menu'
            ],
            'custom_css' => [
                'type' => 'textarea',
                'label' => 'Własny CSS',
                'description' => 'Dodatkowe style CSS',
                'default' => '',
                'section' => 'advanced'
            ]
        ];
    }
    
    /**
     * 🎯 Static Helper Methods for Quick Component Access
     */
    public static function field($type, $name, $value = '', $args = []) {
        $instance = new self();
        return $instance->renderSettingsField($type, $name, $value, $args);
    }
    
    public static function section($title, $content, $args = []) {
        $instance = new self();
        return $instance->renderSettingsSection($title, $content, $args);
    }
    
    public static function button($text, $type = 'secondary', $args = []) {
        $instance = new self();
        return $instance->renderSettingsButton($text, $type, $args);
    }
    
    public static function notice($message, $type = 'info', $args = []) {
        $instance = new self();
        return $instance->renderSettingsNotice($message, $type, $args);
    }
    
    // === FALLBACK METHODS FOR BASIC RENDERING ===
    
    /**
     * 🔧 Basic Field Rendering (fallback when ComponentAdapter not available)
     */
    private function renderBasicField($type, $name, $value, $args) {
        $label = $args['label'] ?? ucfirst(str_replace('_', ' ', $name));
        $description = $args['description'] ?? '';
        
        $output = '<tr><th scope="row"><label for="' . esc_attr($name) . '">' . esc_html($label) . '</label></th><td>';
        
        switch ($type) {
            case 'text':
            case 'email':
            case 'url':
            case 'number':
                $output .= sprintf('<input type="%s" name="%s" id="%s" value="%s" class="regular-text" />',
                    esc_attr($type), esc_attr($name), esc_attr($name), esc_attr($value));
                break;
            case 'textarea':
                $output .= sprintf('<textarea name="%s" id="%s" rows="5" cols="50" class="large-text">%s</textarea>',
                    esc_attr($name), esc_attr($name), esc_textarea($value));
                break;
            case 'checkbox':
                $output .= sprintf('<input type="checkbox" name="%s" id="%s" value="1" %s />',
                    esc_attr($name), esc_attr($name), checked($value, true, false));
                break;
            case 'color':
                $output .= sprintf('<input type="color" name="%s" id="%s" value="%s" class="color-picker" />',
                    esc_attr($name), esc_attr($name), esc_attr($value));
                break;
        }
        
        if ($description) {
            $output .= '<p class="description">' . wp_kses_post($description) . '</p>';
        }
        
        $output .= '</td></tr>';
        return $output;
    }
    
    /**
     * 🔧 Basic Section Rendering (fallback)
     */
    private function renderBasicSection($title, $content, $args) {
        return sprintf('<div class="postbox"><h3 class="hndle">%s</h3><div class="inside">%s</div></div>',
            esc_html($title), $content);
    }
    
    /**
     * 🔧 Basic Table Rendering (fallback)
     */
    private function renderBasicTable($headers, $rows, $args) {
        $output = '<table class="wp-list-table widefat fixed striped"><thead><tr>';
        
        foreach ($headers as $header) {
            $output .= '<th>' . esc_html($header) . '</th>';
        }
        
        $output .= '</tr></thead><tbody>';
        
        foreach ($rows as $row) {
            $output .= '<tr>';
            foreach ($row as $cell) {
                $output .= '<td>' . wp_kses_post($cell) . '</td>';
            }
            $output .= '</tr>';
        }
        
        $output .= '</tbody></table>';
        return $output;
    }
    
    /**
     * 🔧 Basic Form Rendering (fallback)
     */
    private function renderBasicForm($settings_schema, $current_values) {
        $output = '<table class="form-table">';
        
        foreach ($settings_schema as $field_name => $field_config) {
            $field_value = $current_values[$field_name] ?? ($field_config['default'] ?? '');
            $output .= $this->renderBasicField($field_config['type'], $field_name, $field_value, $field_config);
        }
        
        $output .= '</table>';
        return $output;
    }

    /**
     * 🔒 WORLD-CLASS SECURITY: Centralized Sanitization Engine
     * Sanitizes all input data according to field type and security requirements
     * ENHANCED: Integrated with ComponentAdapter for better UI rendering
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
     * ⚙️ Get Default Settings - EVERYTHING DISABLED BY DEFAULT
     * ENHANCED: Integrated with ComponentAdapter but keeps security-first approach
     */
    public function getDefaultSettings() {
        return [
            // Global Settings - DISABLED
            'enable_plugin' => false,  // 🔒 Main switch - DISABLED
            'color_scheme' => 'light', // Keep WordPress default
            'color_palette' => 'modern', // Keep default
            
            // Layout - EVERYTHING DISABLED
            'menu_floating' => false,
            'admin_bar_floating' => false,
            'admin_bar_glossy' => false,
            'menu_glossy' => false,
            'glassmorphism_enabled' => false,
            'animations_enabled' => false,
            
            // Admin Bar - WordPress default values only
            'admin_bar_height' => 32,
            'admin_bar_background' => '#23282d',
            'admin_bar_text_color' => '#eee',
            'admin_bar_hover_color' => '#00a0d2',
            
            // Menu - WordPress default values only
            'menu_width' => 160,
            'menu_background' => '#23282d',
            'menu_text_color' => '#eee',
            'menu_hover_background' => '#32373c',
            'menu_hover_text_color' => '#00a0d2',
            'menu_compact_mode' => false,
            
            // Submenu - WordPress default values only
            'submenu_background' => '#32373c',
            'submenu_text_color' => '#eee',
            'submenu_hover_background' => '#0073aa',
            'submenu_hover_text_color' => '#fff',
            'submenu_separator' => false,
            'submenu_indicator_style' => 'arrow',
            
            // Typography - WordPress default values only
            'body_font' => 'system',
            'headings_font' => 'inherit',
            'global_font_size' => 14,
            'global_line_height' => 1.5,
            'headings_scale' => 1.0,
            
            // Advanced - EVERYTHING DISABLED
            'hide_help_tab' => false,
            'hide_screen_options' => false,
            'hide_wp_version' => false,
            'hide_admin_notices' => false,
            'disable_emojis' => false,
            'disable_embeds' => false,
            'remove_jquery_migrate' => false,
            
            // Custom Code - EMPTY
            'custom_css' => '',
            'custom_js' => ''
        ];
    }
    
    /**
     * 🔧 Get All Settings (alias for getSettings for consistency)
     */
    public function getAllSettings() {
        return $this->getSettings();
    }
} 