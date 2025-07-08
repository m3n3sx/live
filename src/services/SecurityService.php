<?php
/**
 * Security Service - Centralna Sanitacja i Walidacja
 * 
 * FAZA 3+: Pancerne Bezpieczeństwo
 * Centralna sanitacja wszystkich 43 opcji ustawień
 * 
 * @package ModernAdminStyler
 * @version 3.1.0
 */

namespace ModernAdminStyler\Services;

class SecurityService {
    
    /**
     * 🛡️ Konfiguracja sanitacji dla każdego pola
     * REFACTOR: Now uses central schema from main plugin class
     */
    private function getFieldSanitizers() {
        // Get central schema
        $plugin_instance = \ModernAdminStylerV2::getInstance();
        $central_schema = $plugin_instance->getOptionsSchema();
        
        // Add security-specific sanitization rules
        $security_rules = [
        // 🎨 KOLORY
        'admin_bar_text_color' => ['type' => 'color', 'default' => '#ffffff'],
        'admin_bar_background' => ['type' => 'color', 'default' => '#23282d'],
        'admin_bar_hover_color' => ['type' => 'color', 'default' => '#00a0d2'],
        'menu_background' => ['type' => 'color', 'default' => '#23282d'],
        'menu_text_color' => ['type' => 'color', 'default' => '#ffffff'],
        'menu_hover_background' => ['type' => 'color', 'default' => '#32373c'],
        'menu_active_background' => ['type' => 'color', 'default' => '#0073aa'],
        'primary_color' => ['type' => 'color', 'default' => '#0073aa'],
        'secondary_color' => ['type' => 'color', 'default' => '#00a0d2'],
        'accent_color' => ['type' => 'color', 'default' => '#d63638'],
        'success_color' => ['type' => 'color', 'default' => '#46b450'],
        'warning_color' => ['type' => 'color', 'default' => '#ffb900'],
        'error_color' => ['type' => 'color', 'default' => '#d63638'],
        
        // 📏 WYMIARY (px)
        'admin_bar_height' => ['type' => 'dimension', 'min' => 20, 'max' => 100, 'default' => 32],
        'menu_width' => ['type' => 'dimension', 'min' => 100, 'max' => 400, 'default' => 160],
        'menu_item_height' => ['type' => 'dimension', 'min' => 20, 'max' => 80, 'default' => 36],
        'content_padding' => ['type' => 'dimension', 'min' => 0, 'max' => 100, 'default' => 20],
        'border_radius' => ['type' => 'dimension', 'min' => 0, 'max' => 50, 'default' => 4],
        
        // 📊 SKALE (float)
        'headings_scale' => ['type' => 'scale', 'min' => 1.0, 'max' => 2.0, 'default' => 1.25],
        'body_font_size' => ['type' => 'scale', 'min' => 10, 'max' => 24, 'default' => 16],
        'glassmorphism_opacity' => ['type' => 'scale', 'min' => 0.0, 'max' => 1.0, 'default' => 0.8],
        'animation_speed' => ['type' => 'scale', 'min' => 0.1, 'max' => 2.0, 'default' => 0.3],
        
        // ✅ PRZEŁĄCZNIKI (boolean)
                    'enable_plugin' => ['type' => 'boolean', 'default' => false],  // 🔒 WYŁĄCZONE DOMYŚLNIE
        'menu_floating' => ['type' => 'boolean', 'default' => false],
        'admin_bar_floating' => ['type' => 'boolean', 'default' => false],
        'dark_mode' => ['type' => 'boolean', 'default' => false],
        'glassmorphism_enabled' => ['type' => 'boolean', 'default' => false],
        'animations_enabled' => ['type' => 'boolean', 'default' => true],
        'hide_wp_logo' => ['type' => 'boolean', 'default' => false],
        'hide_wp_version' => ['type' => 'boolean', 'default' => false],
        'hide_admin_notices' => ['type' => 'boolean', 'default' => false],
        'hide_help_tab' => ['type' => 'boolean', 'default' => false],
        'hide_screen_options' => ['type' => 'boolean', 'default' => false],
        'disable_emojis' => ['type' => 'boolean', 'default' => false],
        'disable_embeds' => ['type' => 'boolean', 'default' => false],
        'disable_jquery_migrate' => ['type' => 'boolean', 'default' => false],
        'enable_performance_mode' => ['type' => 'boolean', 'default' => false],
        
        // 📝 WYBÓR Z LISTY (select)
        'color_scheme' => ['type' => 'select', 'options' => ['light', 'dark', 'auto'], 'default' => 'light'],
        'admin_theme' => ['type' => 'select', 'options' => ['default', 'modern', 'minimal', 'classic'], 'default' => 'modern'],
        'font_family' => ['type' => 'select', 'options' => ['system', 'inter', 'roboto', 'open-sans'], 'default' => 'system'],
        'layout_style' => ['type' => 'select', 'options' => ['default', 'compact', 'spacious'], 'default' => 'default'],
        'button_style' => ['type' => 'select', 'options' => ['default', 'rounded', 'sharp', 'pill'], 'default' => 'default'],
        
        // 📄 TEKSTY (z ograniczeniami)
        'custom_css' => ['type' => 'css', 'max_length' => 50000, 'default' => ''],
        'custom_js' => ['type' => 'javascript', 'max_length' => 20000, 'default' => ''],
        'custom_admin_footer' => ['type' => 'html', 'max_length' => 1000, 'default' => ''],
        
            // 🔧 SPECJALNE (security-specific)
            'custom_css' => ['type' => 'css', 'max_length' => 50000, 'default' => ''],
            'custom_js' => ['type' => 'javascript', 'max_length' => 20000, 'default' => ''],
            'custom_admin_footer' => ['type' => 'html', 'max_length' => 1000, 'default' => ''],
            'import_settings' => ['type' => 'json', 'default' => ''],
            'backup_settings' => ['type' => 'readonly', 'default' => ''],
        ];
        
        // Merge central schema with security rules
        return array_merge($central_schema, $security_rules);
    }
    
    // 🚨 Niebezpieczne wzorce w CSS/JS
    private const DANGEROUS_PATTERNS = [
        // JavaScript injection
        '/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/mi',
        '/javascript:/i',
        '/vbscript:/i',
        '/onload\s*=/i',
        '/onerror\s*=/i',
        '/onclick\s*=/i',
        
        // CSS injection
        '/expression\s*\(/i',
        '/behavior\s*:/i',
        '/binding\s*:/i',
        '/@import/i',
        '/url\s*\(\s*["\']?\s*javascript:/i',
        
        // Data URLs with scripts
        '/data:.*script/i',
        
        // PHP injection
        '/<\?php/i',
        '/<\?=/i',
        '/<%/i',
    ];
    
    /**
     * 🛡️ Główna funkcja sanitacji wszystkich ustawień
     */
    public function sanitizeAllSettings(array $input): array {
        $sanitized = [];
        $errors = [];
        
        foreach ($this->getFieldSanitizers() as $field => $config) {
            try {
                $value = $input[$field] ?? $config['default'];
                $sanitized[$field] = $this->sanitizeField($field, $value, $config);
            } catch (Exception $e) {
                $errors[$field] = $e->getMessage();
                $sanitized[$field] = $config['default'];
                
                // Log błąd sanitacji
                error_log("MAS Security: Sanitization error for field '{$field}': " . $e->getMessage());
            }
        }
        
        // Dodaj informacje o błędach do wyniku
        if (!empty($errors)) {
            $sanitized['_sanitization_errors'] = $errors;
        }
        
        // Log statystyk sanitacji
        $this->logSanitizationStats($input, $sanitized, $errors);
        
        return $sanitized;
    }
    
    /**
     * 🔧 Sanitacja pojedynczego pola
     */
    private function sanitizeField(string $field, $value, array $config) {
        $type = $config['type'];
        
        switch ($type) {
            case 'color':
                return $this->sanitizeColor($value, $config['default']);
                
            case 'dimension':
                return $this->sanitizeDimension($value, $config);
                
            case 'scale':
                return $this->sanitizeScale($value, $config);
                
            case 'boolean':
                return $this->sanitizeBoolean($value);
                
            case 'select':
                return $this->sanitizeSelect($value, $config['options'], $config['default']);
                
            case 'css':
                return $this->sanitizeCSS($value, $config['max_length']);
                
            case 'javascript':
                return $this->sanitizeJavaScript($value, $config['max_length']);
                
            case 'html':
                return $this->sanitizeHTML($value, $config['max_length']);
                
            case 'json':
                return $this->sanitizeJSON($value);
                
            case 'readonly':
                return $config['default']; // Pola readonly nie są sanityzowane
                
            default:
                return sanitize_text_field($value);
        }
    }
    
    /**
     * 🎨 Sanitacja kolorów
     */
    private function sanitizeColor(string $value, string $default): string {
        // Usuń białe znaki
        $value = trim($value);
        
        // Sprawdź format HEX
        if (preg_match('/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/', $value)) {
            return $value;
        }
        
        // Sprawdź format RGB/RGBA
        if (preg_match('/^rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(?:,\s*[\d.]+)?\s*\)$/', $value)) {
            return $value;
        }
        
        // Sprawdź kolory nazwane CSS
        $namedColors = ['transparent', 'inherit', 'initial', 'unset', 'currentColor'];
        if (in_array(strtolower($value), $namedColors)) {
            return $value;
        }
        
        // Fallback do domyślnego
        return $default;
    }
    
    /**
     * 📏 Sanitacja wymiarów
     */
    private function sanitizeDimension($value, array $config): int {
        $value = intval($value);
        $min = $config['min'] ?? 0;
        $max = $config['max'] ?? 9999;
        
        return max($min, min($max, $value));
    }
    
    /**
     * 📊 Sanitacja skal
     */
    private function sanitizeScale($value, array $config): float {
        $value = floatval($value);
        $min = $config['min'] ?? 0.0;
        $max = $config['max'] ?? 10.0;
        
        return max($min, min($max, $value));
    }
    
    /**
     * ✅ Sanitacja boolean
     */
    private function sanitizeBoolean($value): bool {
        return filter_var($value, FILTER_VALIDATE_BOOLEAN);
    }
    
    /**
     * 📝 Sanitacja select
     */
    private function sanitizeSelect($value, array $options, string $default): string {
        return in_array($value, $options) ? $value : $default;
    }
    
    /**
     * 🎨 Sanitacja CSS
     */
    private function sanitizeCSS(string $value, int $maxLength): string {
        // Ogranicz długość
        $value = substr($value, 0, $maxLength);
        
        // Sprawdź niebezpieczne wzorce
        foreach (self::DANGEROUS_PATTERNS as $pattern) {
            if (preg_match($pattern, $value)) {
                error_log("MAS Security: Dangerous pattern detected in CSS: " . $pattern);
                return ''; // Wyczyść całkowicie jeśli wykryto niebezpieczny wzorzec
            }
        }
        
        // Usuń komentarze /* */ które mogą ukrywać kod
        $value = preg_replace('/\/\*.*?\*\//s', '', $value);
        
        // Podstawowa sanitacja
        $value = wp_strip_all_tags($value);
        
        return $value;
    }
    
    /**
     * 📜 Sanitacja JavaScript
     */
    private function sanitizeJavaScript(string $value, int $maxLength): string {
        // Ogranicz długość
        $value = substr($value, 0, $maxLength);
        
        // JavaScript jest bardzo niebezpieczny - rygorystyczna kontrola
        foreach (self::DANGEROUS_PATTERNS as $pattern) {
            if (preg_match($pattern, $value)) {
                error_log("MAS Security: Dangerous pattern detected in JavaScript");
                return ''; // Wyczyść całkowicie
            }
        }
        
        // Sprawdź czy zawiera tylko bezpieczne funkcje
        $allowedFunctions = ['console.log', 'document.getElementById', 'jQuery', '$'];
        $hasAllowedFunction = false;
        
        foreach ($allowedFunctions as $func) {
            if (strpos($value, $func) !== false) {
                $hasAllowedFunction = true;
                break;
            }
        }
        
        // Jeśli nie zawiera żadnej dozwolonej funkcji, prawdopodobnie jest niebezpieczny
        if (!empty($value) && !$hasAllowedFunction) {
            error_log("MAS Security: JavaScript code doesn't contain allowed functions");
            return '';
        }
        
        return wp_strip_all_tags($value);
    }
    
    /**
     * 📄 Sanitacja HTML
     */
    private function sanitizeHTML(string $value, int $maxLength): string {
        // Ogranicz długość
        $value = substr($value, 0, $maxLength);
        
        // Dozwolone tagi HTML
        $allowedTags = '<p><br><strong><em><u><a><span><div>';
        
        return wp_kses($value, wp_kses_allowed_html('post'));
    }
    
    /**
     * 📋 Sanitacja JSON
     */
    private function sanitizeJSON(string $value): string {
        if (empty($value)) {
            return '';
        }
        
        // Sprawdź czy to poprawny JSON
        $decoded = json_decode($value, true);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new \Exception('Invalid JSON format');
        }
        
        // Sprawdź czy JSON nie zawiera niebezpiecznych danych
        $jsonString = json_encode($decoded);
        
        foreach (self::DANGEROUS_PATTERNS as $pattern) {
            if (preg_match($pattern, $jsonString)) {
                throw new \Exception('Dangerous content detected in JSON');
            }
        }
        
        return $jsonString;
    }
    
    /**
     * 🔍 Walidacja pojedynczego pola
     */
    public function validateField(string $field, $value): array {
        $errors = [];
        
        if (!isset(self::FIELD_SANITIZERS[$field])) {
            $errors[] = "Unknown field: {$field}";
            return $errors;
        }
        
        $config = self::FIELD_SANITIZERS[$field];
        $type = $config['type'];
        
        switch ($type) {
            case 'color':
                if (!$this->isValidColor($value)) {
                    $errors[] = "Invalid color format for {$field}";
                }
                break;
                
            case 'dimension':
                if (!is_numeric($value) || $value < $config['min'] || $value > $config['max']) {
                    $errors[] = "Value for {$field} must be between {$config['min']} and {$config['max']}";
                }
                break;
                
            case 'scale':
                if (!is_numeric($value) || $value < $config['min'] || $value > $config['max']) {
                    $errors[] = "Scale for {$field} must be between {$config['min']} and {$config['max']}";
                }
                break;
                
            case 'select':
                if (!in_array($value, $config['options'])) {
                    $errors[] = "Invalid option for {$field}. Allowed: " . implode(', ', $config['options']);
                }
                break;
                
            case 'css':
            case 'javascript':
                foreach (self::DANGEROUS_PATTERNS as $pattern) {
                    if (preg_match($pattern, $value)) {
                        $errors[] = "Dangerous content detected in {$field}";
                        break;
                    }
                }
                break;
        }
        
        return $errors;
    }
    
    /**
     * 🎨 Sprawdź czy kolor jest poprawny
     */
    private function isValidColor(string $value): bool {
        return preg_match('/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/', $value) ||
               preg_match('/^rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(?:,\s*[\d.]+)?\s*\)$/', $value) ||
               in_array(strtolower($value), ['transparent', 'inherit', 'initial', 'unset', 'currentColor']);
    }
    
    /**
     * 📊 Logowanie statystyk sanitacji
     */
    private function logSanitizationStats(array $input, array $sanitized, array $errors): void {
        $stats = [
            'timestamp' => current_time('mysql'),
            'fields_processed' => count($input),
            'fields_sanitized' => count($sanitized),
            'errors_count' => count($errors),
            'user_id' => get_current_user_id(),
            'ip_address' => $_SERVER['REMOTE_ADDR'] ?? 'unknown'
        ];
        
        // Zapisz do opcji WordPress (ostatnie 10 operacji)
        $history = get_option('mas_v2_sanitization_history', []);
        array_unshift($history, $stats);
        $history = array_slice($history, 0, 10);
        update_option('mas_v2_sanitization_history', $history);
        
        // Log do pliku jeśli są błędy
        if (!empty($errors)) {
            error_log('MAS Security: Sanitization completed with errors - ' . json_encode($stats));
        }
    }
    
    /**
     * 📋 Pobierz historię sanitacji
     */
    public function getSanitizationHistory(): array {
        return get_option('mas_v2_sanitization_history', []);
    }
    
    /**
     * 🔒 Sprawdź uprawnienia użytkownika
     */
    public function checkUserPermissions(): bool {
        return current_user_can('manage_options');
    }
    
    /**
     * 🛡️ Generuj nonce dla formularzy
     */
    public function generateNonce(string $action = 'mas_v2_settings'): string {
        return wp_create_nonce($action);
    }
    
    /**
     * ✅ Weryfikuj nonce
     */
    public function verifyNonce(string $nonce, string $action = 'mas_v2_settings'): bool {
        return wp_verify_nonce($nonce, $action);
    }
    
    /**
     * 🚨 Sprawdź czy IP jest na czarnej liście
     */
    public function isIPBlocked(): bool {
        $userIP = $_SERVER['REMOTE_ADDR'] ?? '';
        $blockedIPs = get_option('mas_v2_blocked_ips', []);
        
        return in_array($userIP, $blockedIPs);
    }
    
    /**
     * 🔐 Rate limiting - sprawdź czy użytkownik nie przekracza limitów
     */
    public function checkRateLimit(int $maxRequests = 60, int $timeWindow = 3600): bool {
        $userIP = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
        $key = 'mas_v2_rate_limit_' . md5($userIP);
        
        $requests = get_transient($key) ?: [];
        $currentTime = time();
        
        // Usuń stare requesty
        $requests = array_filter($requests, function($timestamp) use ($currentTime, $timeWindow) {
            return ($currentTime - $timestamp) < $timeWindow;
        });
        
        // Sprawdź limit
        if (count($requests) >= $maxRequests) {
            return false;
        }
        
        // Dodaj nowy request
        $requests[] = $currentTime;
        set_transient($key, $requests, $timeWindow);
        
        return true;
    }
    
    /**
     * 📊 Pobierz statystyki bezpieczeństwa
     */
    public function getSecurityStats(): array {
        return [
            'sanitization_history' => $this->getSanitizationHistory(),
            'blocked_ips' => get_option('mas_v2_blocked_ips', []),
            'security_events' => get_option('mas_v2_security_events', []),
            'last_security_scan' => get_option('mas_v2_last_security_scan'),
            'total_fields_configured' => count(self::FIELD_SANITIZERS),
            'dangerous_patterns_count' => count(self::DANGEROUS_PATTERNS)
        ];
    }
} 