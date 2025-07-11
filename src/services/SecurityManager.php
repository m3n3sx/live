<?php
/**
 * Security Manager - Unified Security & Sanitization System
 * 
 * CONSOLIDATED SERVICE: Combines EnterpriseSecurityManager + SecurityService
 * 
 * This service provides:
 * - Core sanitization and validation (essential for all operations)
 * - Advanced threat detection and prevention (enterprise features)
 * - Unified security monitoring and audit logging
 * - Configurable security levels (basic to maximum)
 * - Performance-optimized security operations
 * 
 * @package ModernAdminStyler\Services
 * @version 2.4.0 - Consolidated Architecture
 */

namespace ModernAdminStyler\Services;

class SecurityManager {
    
    private $coreEngine;
    private $cacheManager;
    private $metricsCollector;
    private $securityRules = [];
    private $auditLog = [];
    private $sanitizationStats = [];
    
    // 🛡️ Security Levels
    const LEVEL_BASIC = 'basic';           // Core sanitization only
    const LEVEL_STANDARD = 'standard';     // + Basic threat detection  
    const LEVEL_ADVANCED = 'advanced';     // + Monitoring & rate limiting
    const LEVEL_ENTERPRISE = 'enterprise'; // + Full audit & analytics
    const LEVEL_MAXIMUM = 'maximum';       // + Aggressive protection
    
    // 🚨 Threat Types
    const THREAT_BRUTE_FORCE = 'brute_force';
    const THREAT_SQL_INJECTION = 'sql_injection';
    const THREAT_XSS = 'xss';
    const THREAT_CSRF = 'csrf';
    const THREAT_FILE_UPLOAD = 'file_upload';
    const THREAT_PRIVILEGE_ESCALATION = 'privilege_escalation';
    const THREAT_SUSPICIOUS_ACTIVITY = 'suspicious_activity';
    const THREAT_RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded';
    
    // 🔒 Security Actions
    const ACTION_BLOCK = 'block';
    const ACTION_LOG = 'log';
    const ACTION_ALERT = 'alert';
    const ACTION_QUARANTINE = 'quarantine';
    const ACTION_RATE_LIMIT = 'rate_limit';
    const ACTION_SANITIZE = 'sanitize';
    
    // 🔧 Sanitization Types
    const TYPE_COLOR = 'color';
    const TYPE_DIMENSION = 'dimension';
    const TYPE_SCALE = 'scale';
    const TYPE_BOOLEAN = 'boolean';
    const TYPE_SELECT = 'select';
    const TYPE_CSS = 'css';
    const TYPE_JAVASCRIPT = 'javascript';
    const TYPE_HTML = 'html';
    const TYPE_JSON = 'json';
    const TYPE_READONLY = 'readonly';
    
    // 🚨 Dangerous Patterns for CSS/JS injection detection
    private const DANGEROUS_PATTERNS = [
        // JavaScript injection
        '/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/mi',
        '/javascript:/i',
        '/vbscript:/i',
        '/onload\s*=/i',
        '/onerror\s*=/i',
        '/onclick\s*=/i',
        '/on\w+\s*=/i',
        
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
        
        // SQL injection patterns
        '/(\bunion\b.*\bselect\b)/i',
        '/(\bselect\b.*\bfrom\b.*\bwhere\b)/i',
        '/(\bdrop\b.*\btable\b)/i',
        '/(\binsert\b.*\binto\b)/i',
        '/(\bdelete\b.*\bfrom\b)/i',
        '/(\bupdate\b.*\bset\b)/i'
    ];
    
    /**
     * 📋 Field Sanitization Configuration
     * Complete mapping for all 43 plugin options with security rules
     */
    private function getFieldSanitizers() {
        return [
            // === COLORS ===
            'admin_bar_text_color' => ['type' => self::TYPE_COLOR, 'default' => '#ffffff'],
            'admin_bar_background' => ['type' => self::TYPE_COLOR, 'default' => '#23282d'],
            'admin_bar_hover_color' => ['type' => self::TYPE_COLOR, 'default' => '#00a0d2'],
            'menu_background' => ['type' => self::TYPE_COLOR, 'default' => '#23282d'],
            'menu_text_color' => ['type' => self::TYPE_COLOR, 'default' => '#ffffff'],
            'menu_hover_color' => ['type' => self::TYPE_COLOR, 'default' => '#32373c'],
            'menu_active_color' => ['type' => self::TYPE_COLOR, 'default' => '#0073aa'],
            'primary_color' => ['type' => self::TYPE_COLOR, 'default' => '#0073aa'],
            'secondary_color' => ['type' => self::TYPE_COLOR, 'default' => '#00a0d2'],
            'accent_color' => ['type' => self::TYPE_COLOR, 'default' => '#d63638'],
            'success_color' => ['type' => self::TYPE_COLOR, 'default' => '#46b450'],
            'warning_color' => ['type' => self::TYPE_COLOR, 'default' => '#ffb900'],
            'error_color' => ['type' => self::TYPE_COLOR, 'default' => '#d63638'],
            'shadow_color' => ['type' => self::TYPE_COLOR, 'default' => '#000000'],
            'content_background' => ['type' => self::TYPE_COLOR, 'default' => '#ffffff'],
            'content_text_color' => ['type' => self::TYPE_COLOR, 'default' => '#1e1e1e'],
            
            // === MICRO-PANEL COLORS ===
            'wpadminbar_bg_color' => ['type' => self::TYPE_COLOR, 'default' => '#23282d'],
            'wpadminbar_text_color' => ['type' => self::TYPE_COLOR, 'default' => '#ffffff'],
            'wpadminbar_hover_color' => ['type' => self::TYPE_COLOR, 'default' => '#00a0d2'],
            'wpadminbar_logo_color' => ['type' => self::TYPE_COLOR, 'default' => '#ffffff'],
            'adminmenuwrap_bg_color' => ['type' => self::TYPE_COLOR, 'default' => '#23282d'],
            'adminmenuwrap_text_color' => ['type' => self::TYPE_COLOR, 'default' => '#ffffff'],
            'adminmenuwrap_hover_color' => ['type' => self::TYPE_COLOR, 'default' => '#32373c'],
            'adminmenuwrap_active_color' => ['type' => self::TYPE_COLOR, 'default' => '#0073aa'],
            'wpwrap_bg_color' => ['type' => self::TYPE_COLOR, 'default' => '#f1f1f1'],
            'wpfooter_bg_color' => ['type' => self::TYPE_COLOR, 'default' => '#f1f1f1'],
            'wpfooter_text_color' => ['type' => self::TYPE_COLOR, 'default' => '#646970'],
            'postbox_bg_color' => ['type' => self::TYPE_COLOR, 'default' => '#ffffff'],
            'postbox_header_color' => ['type' => self::TYPE_COLOR, 'default' => '#1e1e1e'],
            'postbox_text_color' => ['type' => self::TYPE_COLOR, 'default' => '#1e1e1e'],
            'postbox_border_color' => ['type' => self::TYPE_COLOR, 'default' => '#ccd0d4'],
            'postbox_header_bg' => ['type' => self::TYPE_COLOR, 'default' => '#ffffff'],
            
            // === DIMENSIONS (px) ===
            'admin_bar_height' => ['type' => self::TYPE_DIMENSION, 'min' => 20, 'max' => 100, 'default' => 32],
            'admin_bar_margin' => ['type' => self::TYPE_DIMENSION, 'min' => 0, 'max' => 50, 'default' => 0],
            'menu_width' => ['type' => self::TYPE_DIMENSION, 'min' => 100, 'max' => 400, 'default' => 160],
            'menu_radius' => ['type' => self::TYPE_DIMENSION, 'min' => 0, 'max' => 50, 'default' => 4],
            'menu_margin' => ['type' => self::TYPE_DIMENSION, 'min' => 0, 'max' => 50, 'default' => 0],
            'global_font_size' => ['type' => self::TYPE_DIMENSION, 'min' => 10, 'max' => 24, 'default' => 16],
            'global_border_radius' => ['type' => self::TYPE_DIMENSION, 'min' => 0, 'max' => 50, 'default' => 4],
            'global_spacing' => ['type' => self::TYPE_DIMENSION, 'min' => 0, 'max' => 100, 'default' => 16],
            'shadow_blur' => ['type' => self::TYPE_DIMENSION, 'min' => 0, 'max' => 100, 'default' => 10],
            'content_padding' => ['type' => self::TYPE_DIMENSION, 'min' => 0, 'max' => 100, 'default' => 20],
            'content_max_width' => ['type' => self::TYPE_DIMENSION, 'min' => 800, 'max' => 2000, 'default' => 1200],
            'wpadminbar_height' => ['type' => self::TYPE_DIMENSION, 'min' => 20, 'max' => 100, 'default' => 32],
            'wpadminbar_font_size' => ['type' => self::TYPE_DIMENSION, 'min' => 10, 'max' => 24, 'default' => 13],
            'wpadminbar_border_radius' => ['type' => self::TYPE_DIMENSION, 'min' => 0, 'max' => 50, 'default' => 0],
            'adminmenuwrap_width' => ['type' => self::TYPE_DIMENSION, 'min' => 100, 'max' => 400, 'default' => 160],
            'adminmenuwrap_border_radius' => ['type' => self::TYPE_DIMENSION, 'min' => 0, 'max' => 50, 'default' => 0],
            'wpwrap_max_width' => ['type' => self::TYPE_DIMENSION, 'min' => 800, 'max' => 2000, 'default' => 1200],
            'postbox_border_radius' => ['type' => self::TYPE_DIMENSION, 'min' => 0, 'max' => 50, 'default' => 4],
            'postbox_padding' => ['type' => self::TYPE_DIMENSION, 'min' => 0, 'max' => 50, 'default' => 12],
            'postbox_margin' => ['type' => self::TYPE_DIMENSION, 'min' => 0, 'max' => 50, 'default' => 20],
            'surface_bar_height' => ['type' => self::TYPE_DIMENSION, 'min' => 20, 'max' => 100, 'default' => 32],
            'surface_bar_font_size' => ['type' => self::TYPE_DIMENSION, 'min' => 10, 'max' => 24, 'default' => 13],
            'surface_bar_padding' => ['type' => self::TYPE_DIMENSION, 'min' => 0, 'max' => 50, 'default' => 6],
            'surface_bar_blur' => ['type' => self::TYPE_DIMENSION, 'min' => 0, 'max' => 50, 'default' => 10],
            'surface_menu_width' => ['type' => self::TYPE_DIMENSION, 'min' => 100, 'max' => 400, 'default' => 160],
            'headings_spacing' => ['type' => self::TYPE_SCALE, 'min' => 0.0, 'max' => 3.0, 'default' => 1.0, 'unit' => 'em'],
            
            // === SCALES (float/ratio) ===
            'global_line_height' => ['type' => self::TYPE_SCALE, 'min' => 1.0, 'max' => 3.0, 'default' => 1.5],
            'headings_scale' => ['type' => self::TYPE_SCALE, 'min' => 1.0, 'max' => 2.0, 'default' => 1.25],
            'headings_weight' => ['type' => self::TYPE_SCALE, 'min' => 100, 'max' => 900, 'default' => 600],
            'shadow_opacity' => ['type' => self::TYPE_SCALE, 'min' => 0.0, 'max' => 1.0, 'default' => 0.2],
            'transition_speed' => ['type' => self::TYPE_SCALE, 'min' => 0.1, 'max' => 2.0, 'default' => 0.3, 'unit' => 's'],
            'z_index_base' => ['type' => self::TYPE_SCALE, 'min' => 1, 'max' => 99999, 'default' => 1000],
            
            // === BOOLEANS ===
            'enable_animations' => ['type' => self::TYPE_BOOLEAN, 'default' => true],
            'performance_mode' => ['type' => self::TYPE_BOOLEAN, 'default' => false],
            'admin_bar_floating' => ['type' => self::TYPE_BOOLEAN, 'default' => false],
            'admin_bar_glossy' => ['type' => self::TYPE_BOOLEAN, 'default' => false],
            'menu_floating' => ['type' => self::TYPE_BOOLEAN, 'default' => false],
            'menu_glassmorphism' => ['type' => self::TYPE_BOOLEAN, 'default' => false],
            'compact_mode' => ['type' => self::TYPE_BOOLEAN, 'default' => false],
            'full_width_mode' => ['type' => self::TYPE_BOOLEAN, 'default' => false],
            'enable_shadows' => ['type' => self::TYPE_BOOLEAN, 'default' => true],
            'enable_glassmorphism' => ['type' => self::TYPE_BOOLEAN, 'default' => false],
            'hardware_acceleration' => ['type' => self::TYPE_BOOLEAN, 'default' => true],
            'respect_reduced_motion' => ['type' => self::TYPE_BOOLEAN, 'default' => true],
            'mobile_3d_optimization' => ['type' => self::TYPE_BOOLEAN, 'default' => true],
            'enable_debug_mode' => ['type' => self::TYPE_BOOLEAN, 'default' => false],
            'wpadminbar_glassmorphism' => ['type' => self::TYPE_BOOLEAN, 'default' => false],
            'wpadminbar_floating' => ['type' => self::TYPE_BOOLEAN, 'default' => false],
            'wpadminbar_hide_wp_logo' => ['type' => self::TYPE_BOOLEAN, 'default' => false],
            'wpadminbar_hide_howdy' => ['type' => self::TYPE_BOOLEAN, 'default' => false],
            'wpadminbar_hide_update_notices' => ['type' => self::TYPE_BOOLEAN, 'default' => false],
            'wpadminbar_hide_comments' => ['type' => self::TYPE_BOOLEAN, 'default' => false],
            'adminmenuwrap_floating' => ['type' => self::TYPE_BOOLEAN, 'default' => false],
            'wpfooter_hide_version' => ['type' => self::TYPE_BOOLEAN, 'default' => false],
            'wpfooter_hide_thanks' => ['type' => self::TYPE_BOOLEAN, 'default' => false],
            'postbox_glassmorphism' => ['type' => self::TYPE_BOOLEAN, 'default' => false],
            'postbox_hover_lift' => ['type' => self::TYPE_BOOLEAN, 'default' => false],
            
            // === SELECTS ===
            'color_scheme' => ['type' => self::TYPE_SELECT, 'options' => ['light', 'dark', 'auto'], 'default' => 'light'],
            'color_palette' => ['type' => self::TYPE_SELECT, 'options' => ['default', 'blue', 'green', 'red', 'purple'], 'default' => 'default'],
            'body_font' => ['type' => self::TYPE_SELECT, 'options' => ['system', 'inter', 'roboto', 'opensans', 'lato', 'poppins', 'montserrat'], 'default' => 'system'],
            'heading_font' => ['type' => self::TYPE_SELECT, 'options' => ['system', 'inter', 'roboto', 'opensans', 'lato', 'poppins', 'montserrat'], 'default' => 'system'],
            'animation_easing' => ['type' => self::TYPE_SELECT, 'options' => ['linear', 'ease', 'ease-in', 'ease-out', 'ease-in-out', 'custom'], 'default' => 'custom'],
            'postbox_animation' => ['type' => self::TYPE_SELECT, 'options' => ['none', 'fade', 'slide', 'scale', 'bounce'], 'default' => 'none'],
            
            // === COMPLEX TYPES ===
            'wpadminbar_shadow' => ['type' => self::TYPE_SELECT, 'options' => ['none', 'small', 'medium', 'large'], 'default' => 'none'],
            'wpadminbar_gradient' => ['type' => self::TYPE_COLOR, 'default' => ''],
            'postbox_shadow' => ['type' => self::TYPE_SELECT, 'options' => ['none', 'small', 'medium', 'large'], 'default' => 'small'],
            
            // === SPECIAL CONTENT (high security) ===
            'custom_css' => ['type' => self::TYPE_CSS, 'max_length' => 50000, 'default' => ''],
            'custom_js' => ['type' => self::TYPE_JAVASCRIPT, 'max_length' => 20000, 'default' => ''],
            'custom_admin_footer' => ['type' => self::TYPE_HTML, 'max_length' => 1000, 'default' => ''],
            'import_settings' => ['type' => self::TYPE_JSON, 'default' => ''],
            'backup_settings' => ['type' => self::TYPE_READONLY, 'default' => ''],
        ];
    }
    
    public function __construct($coreEngine) {
        $this->coreEngine = $coreEngine;
        
        // LAZY INITIALIZATION: Don't access other services immediately
        // Services will be initialized when first accessed
        $this->cacheManager = null;
        $this->metricsCollector = null;
        
        // Defer security initialization until all services are ready
        add_action('mas_core_services_ready', [$this, 'initSecurity']);
    }
    
    /**
     * 🚀 Initialize Security System
     * 
     * Sets up security rules, monitoring, and threat detection
     * based on the configured security level
     */
    public function initSecurity() {
        // Initialize services now that they're ready
        $this->initializeServices();
        
        // Load security configuration
        $this->loadSecurityRules();
        
        // Get current security level from settings
        $settings = $this->coreEngine->getSettingsManager()->getSettings();
        $securityLevel = $settings['security_level'] ?? self::LEVEL_STANDARD;
        
        // Initialize security components based on level
        $this->initSecurityLevel($securityLevel);
        
        // Always register core security hooks
        $this->registerCoreSecurityHooks();
    }
    
    /**
     * 🔧 Initialize Services (Lazy Loading)
     */
    private function initializeServices() {
        if ($this->cacheManager === null) {
            $this->cacheManager = $this->coreEngine->getCacheManager();
        }
        
        if ($this->metricsCollector === null) {
            $this->metricsCollector = $this->coreEngine->getMetricsCollector();
        }
    }
    
    /**
     * 🔧 Get Cache Manager (Lazy Loading)
     */
    private function getCacheManager() {
        if ($this->cacheManager === null) {
            $this->cacheManager = $this->coreEngine->getCacheManager();
        }
        return $this->cacheManager;
    }
    
    /**
     * 🔧 Get Metrics Collector (Lazy Loading)
     */
    private function getMetricsCollector() {
        if ($this->metricsCollector === null) {
            $this->metricsCollector = $this->coreEngine->getMetricsCollector();
        }
        return $this->metricsCollector;
    }
    
    /**
     * 📋 Load Security Rules Configuration
     */
    private function loadSecurityRules() {
        $this->securityRules = [
            // Brute Force Protection
            'brute_force_protection' => [
                'enabled' => true,
                'max_attempts' => 5,
                'lockout_duration' => 900, // 15 minutes
                'window_duration' => 300,  // 5 minutes
                'action' => self::ACTION_BLOCK
            ],
            
            // Input Validation & Sanitization
            'input_sanitization' => [
                'enabled' => true,
                'strict_mode' => false,
                'dangerous_patterns' => self::DANGEROUS_PATTERNS,
                'action' => self::ACTION_SANITIZE
            ],
            
            // Rate Limiting
            'rate_limiting' => [
                'enabled' => true,
                'requests_per_minute' => 60,
                'requests_per_hour' => 1000,
                'burst_limit' => 10,
                'action' => self::ACTION_RATE_LIMIT
            ],
            
            // SQL Injection Protection
            'sql_injection_protection' => [
                'enabled' => true,
                'patterns' => [
                    '/(\bunion\b.*\bselect\b)/i',
                    '/(\bselect\b.*\bfrom\b.*\bwhere\b)/i',
                    '/(\bdrop\b.*\btable\b)/i',
                    '/(\binsert\b.*\binto\b)/i',
                    '/(\bdelete\b.*\bfrom\b)/i',
                    '/(\bupdate\b.*\bset\b)/i'
                ],
                'action' => self::ACTION_BLOCK
            ],
            
            // XSS Protection
            'xss_protection' => [
                'enabled' => true,
                'patterns' => [
                    '/<script[^>]*>.*?<\/script>/si',
                    '/javascript:/i',
                    '/on\w+\s*=/i',
                    '/<iframe[^>]*>.*?<\/iframe>/si',
                    '/<object[^>]*>.*?<\/object>/si'
                ],
                'action' => self::ACTION_BLOCK
            ],
            
            // Content Security Policy
            'content_security_policy' => [
                'enabled' => false, // Disabled by default to avoid conflicts
                'default_src' => "'self'",
                'script_src' => "'self' 'unsafe-inline'",
                'style_src' => "'self' 'unsafe-inline'",
                'img_src' => "'self' data: https:",
                'font_src' => "'self' https:",
                'connect_src' => "'self'"
            ],
            
            // Audit Logging
            'audit_logging' => [
                'enabled' => true,
                'log_level' => 'standard',
                'retention_days' => 30,
                'max_log_size' => 50 * 1024 * 1024 // 50MB
            ]
        ];
    }
    
    /**
     * 🔧 Initialize Security Level Configuration
     */
    private function initSecurityLevel($level) {
        switch ($level) {
            case self::LEVEL_BASIC:
                // Only core sanitization
                $this->securityRules['brute_force_protection']['enabled'] = false;
                $this->securityRules['rate_limiting']['enabled'] = false;
                $this->securityRules['audit_logging']['log_level'] = 'minimal';
                break;
                
            case self::LEVEL_STANDARD:
                // Basic protection + sanitization
                $this->securityRules['sql_injection_protection']['enabled'] = true;
                $this->securityRules['xss_protection']['enabled'] = true;
                break;
                
            case self::LEVEL_ADVANCED:
                // Standard + monitoring & rate limiting
                $this->securityRules['rate_limiting']['enabled'] = true;
                $this->securityRules['audit_logging']['log_level'] = 'detailed';
                $this->registerAdvancedSecurityHooks();
                break;
                
            case self::LEVEL_ENTERPRISE:
                // Advanced + full analytics & audit
                $this->securityRules['audit_logging']['log_level'] = 'comprehensive';
                $this->securityRules['content_security_policy']['enabled'] = true;
                $this->registerEnterpriseSecurityHooks();
                break;
                
            case self::LEVEL_MAXIMUM:
                // Enterprise + aggressive protection
                $this->securityRules['input_sanitization']['strict_mode'] = true;
                $this->securityRules['brute_force_protection']['max_attempts'] = 3;
                $this->securityRules['rate_limiting']['requests_per_minute'] = 30;
                $this->registerMaximumSecurityHooks();
                break;
        }
    } 

    /**
     * 🔗 Register Core Security Hooks (Always Active)
     */
    private function registerCoreSecurityHooks() {
        // Core sanitization hooks
        add_filter('pre_update_option_mas_v2_settings', [$this, 'sanitizeSettingsOnSave'], 10, 2);
        
        // Basic security headers
        add_action('send_headers', [$this, 'addBasicSecurityHeaders']);
        
        // Input filtering for plugin requests
        add_action('init', [$this, 'filterPluginRequests'], 1);
        
        // Nonce verification for AJAX
        add_action('wp_ajax_mas_v2_save_settings', [$this, 'verifyAjaxNonce'], 1);
        add_action('wp_ajax_nopriv_mas_v2_save_settings', [$this, 'blockUnauthorizedAjax'], 1);
    }
    
    /**
     * 🔗 Register Advanced Security Hooks
     */
    private function registerAdvancedSecurityHooks() {
        // Rate limiting
        add_action('init', [$this, 'checkRateLimit'], 5);
        
        // Enhanced monitoring
        add_action('wp_login_failed', [$this, 'onLoginFailed']);
        add_action('wp_login', [$this, 'onLoginSuccess'], 10, 2);
        
        // Content filtering
        add_filter('the_content', [$this, 'filterSuspiciousContent']);
    }
    
    /**
     * 🔗 Register Enterprise Security Hooks
     */
    private function registerEnterpriseSecurityHooks() {
        // Full audit logging
        add_action('admin_init', [$this, 'auditAdminActivity']);
        add_action('wp_loaded', [$this, 'monitorFileIntegrity']);
        
        // Database monitoring
        add_filter('query', [$this, 'monitorDatabaseQueries']);
        
        // Content Security Policy
        add_action('send_headers', [$this, 'addContentSecurityPolicy']);
    }
    
    /**
     * 🔗 Register Maximum Security Hooks
     */
    private function registerMaximumSecurityHooks() {
        // Aggressive filtering
        add_action('init', [$this, 'aggressiveRequestFiltering'], 1);
        
        // IP blocking
        add_action('init', [$this, 'enforceIPBlocking'], 2);
        
        // Enhanced audit
        add_action('wp_footer', [$this, 'auditPageAccess']);
    }
    
    // === CORE SANITIZATION METHODS ===
    
    /**
     * 🛡️ Main Settings Sanitization (Primary Interface)
     * 
     * This is the core function that sanitizes all plugin settings
     * Called when settings are saved via options API
     */
    public function sanitizeAllSettings(array $input): array {
        $startTime = microtime(true);
        $sanitized = [];
        $errors = [];
        $dangerousContent = [];
        
        $sanitizers = $this->getFieldSanitizers();
        
        foreach ($sanitizers as $field => $config) {
            try {
                $rawValue = $input[$field] ?? $config['default'];
                
                // Pre-screening for dangerous content
                if ($this->containsDangerousPatterns($rawValue)) {
                    $dangerousContent[$field] = $rawValue;
                    $this->logSecurityEvent(self::THREAT_XSS, [
                        'field' => $field,
                        'raw_value' => substr($rawValue, 0, 200),
                        'ip_address' => $this->getClientIP()
                    ]);
                }
                
                // Sanitize the field
                $sanitized[$field] = $this->sanitizeField($field, $rawValue, $config);
                
                // Post-sanitization validation
                $validation = $this->validateField($field, $sanitized[$field], $config);
                if (!$validation['valid']) {
                    $errors[$field] = $validation['error'];
                    $sanitized[$field] = $config['default'];
                }
                
            } catch (\Exception $e) {
                $errors[$field] = $e->getMessage();
                $sanitized[$field] = $config['default'];
                
                // Log sanitization error
                error_log('SecurityManager: Sanitization error for field "' . $field . '": ' . $e->getMessage());
                
                $this->logSecurityEvent('sanitization_error', [
                    'field' => $field,
                    'error' => $e->getMessage(),
                    'ip_address' => $this->getClientIP()
                ]);
            }
        }
        
        // Add sanitization metadata
        if (!empty($errors)) {
            $sanitized['_sanitization_errors'] = $errors;
        }
        
        if (!empty($dangerousContent)) {
            $sanitized['_dangerous_content_detected'] = array_keys($dangerousContent);
        }
        
        // Update statistics
        $sanitizationTime = microtime(true) - $startTime;
        $this->updateSanitizationStats($input, $sanitized, $errors, $sanitizationTime);
        
        return $sanitized;
    }
    
    /**
     * 🔧 Sanitize Individual Field
     */
    private function sanitizeField(string $field, $value, array $config) {
        $type = $config['type'];
        
        switch ($type) {
            case self::TYPE_COLOR:
                return $this->sanitizeColor($value, $config['default']);
                
            case self::TYPE_DIMENSION:
                return $this->sanitizeDimension($value, $config);
                
            case self::TYPE_SCALE:
                return $this->sanitizeScale($value, $config);
                
            case self::TYPE_BOOLEAN:
                return $this->sanitizeBoolean($value);
                
            case self::TYPE_SELECT:
                return $this->sanitizeSelect($value, $config['options'], $config['default']);
                
            case self::TYPE_CSS:
                return $this->sanitizeCSS($value, $config['max_length']);
                
            case self::TYPE_JAVASCRIPT:
                return $this->sanitizeJavaScript($value, $config['max_length']);
                
            case self::TYPE_HTML:
                return $this->sanitizeHTML($value, $config['max_length']);
                
            case self::TYPE_JSON:
                return $this->sanitizeJSON($value);
                
            case self::TYPE_READONLY:
                return $config['default']; // Readonly fields cannot be changed
                
            default:
                return sanitize_text_field($value);
        }
    }
    
    /**
     * 🎨 Sanitize Color Values
     */
    private function sanitizeColor(string $value, string $default): string {
        $value = trim($value);
        
        // Empty value
        if (empty($value)) {
            return $default;
        }
        
        // WordPress built-in color sanitization
        $sanitized = sanitize_hex_color($value);
        if ($sanitized) {
            return $sanitized;
        }
        
        // Support for rgba, hsl values
        if (preg_match('/^rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(?:,\s*[\d.]+)?\s*\)$/i', $value)) {
            return $value;
        }
        
        if (preg_match('/^hsla?\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*(?:,\s*[\d.]+)?\s*\)$/i', $value)) {
            return $value;
        }
        
        // Invalid color, return default
        return $default;
    }
    
    /**
     * 📏 Sanitize Dimension Values (px)
     */
    private function sanitizeDimension($value, array $config): int {
        $value = absint($value);
        $min = $config['min'] ?? 0;
        $max = $config['max'] ?? 9999;
        
        return max($min, min($max, $value));
    }
    
    /**
     * 📊 Sanitize Scale Values (float/ratio)
     */
    private function sanitizeScale($value, array $config): float {
        $value = floatval($value);
        $min = $config['min'] ?? 0.0;
        $max = $config['max'] ?? 100.0;
        
        return max($min, min($max, $value));
    }
    
    /**
     * ✅ Sanitize Boolean Values
     */
    private function sanitizeBoolean($value): bool {
        return filter_var($value, FILTER_VALIDATE_BOOLEAN);
    }
    
    /**
     * 📝 Sanitize Select Values
     */
    private function sanitizeSelect($value, array $options, string $default): string {
        return in_array($value, $options) ? $value : $default;
    }
    
    /**
     * 🎨 Sanitize CSS Content (High Security)
     */
    private function sanitizeCSS(string $value, int $maxLength): string {
        // Length check
        if (strlen($value) > $maxLength) {
            $value = substr($value, 0, $maxLength);
        }
        
        // Remove dangerous patterns
        foreach (self::DANGEROUS_PATTERNS as $pattern) {
            $value = preg_replace($pattern, '', $value);
        }
        
        // Additional CSS-specific sanitization
        $value = wp_strip_all_tags($value);
        
        // Remove potential CSS injection
        $value = preg_replace('/expression\s*\(/i', '', $value);
        $value = preg_replace('/behavior\s*:/i', '', $value);
        $value = preg_replace('/binding\s*:/i', '', $value);
        $value = preg_replace('/@import/i', '', $value);
        
        return trim($value);
    }
    
    /**
     * 📜 Sanitize JavaScript Content (Maximum Security)
     */
    private function sanitizeJavaScript(string $value, int $maxLength): string {
        // Length check
        if (strlen($value) > $maxLength) {
            $value = substr($value, 0, $maxLength);
        }
        
        // In strict mode, block all JavaScript
        if ($this->securityRules['input_sanitization']['strict_mode']) {
            $this->logSecurityEvent(self::THREAT_XSS, [
                'type' => 'javascript_blocked_strict_mode',
                'content_length' => strlen($value),
                'ip_address' => $this->getClientIP()
            ]);
            return '';
        }
        
        // Remove dangerous patterns
        foreach (self::DANGEROUS_PATTERNS as $pattern) {
            $value = preg_replace($pattern, '', $value);
        }
        
        // Remove script tags
        $value = preg_replace('/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/mi', '', $value);
        
        // Remove event handlers
        $value = preg_replace('/on\w+\s*=/i', '', $value);
        
        // Remove javascript: and vbscript: protocols
        $value = preg_replace('/(?:javascript|vbscript):/i', '', $value);
        
        return trim($value);
    }
    
    /**
     * 📄 Sanitize HTML Content
     */
    private function sanitizeHTML(string $value, int $maxLength): string {
        // Length check
        if (strlen($value) > $maxLength) {
            $value = substr($value, 0, $maxLength);
        }
        
        // WordPress HTML sanitization with allowed tags
        $allowedTags = [
            'p' => [],
            'br' => [],
            'strong' => [],
            'em' => [],
            'span' => ['class' => []],
            'div' => ['class' => []],
            'a' => ['href' => [], 'title' => [], 'target' => []]
        ];
        
        return wp_kses($value, $allowedTags);
    }
    
    /**
     * 📊 Sanitize JSON Content
     */
    private function sanitizeJSON(string $value): string {
        if (empty($value)) {
            return '';
        }
        
        // Validate JSON
        $decoded = json_decode($value, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            return '';
        }
        
        // Re-encode to ensure clean JSON
        return json_encode($decoded, JSON_UNESCAPED_UNICODE);
    }
    
    /**
     * ✅ Validate Field Value
     */
    private function validateField(string $field, $value, array $config): array {
        $type = $config['type'];
        
        switch ($type) {
            case self::TYPE_COLOR:
                return $this->validateColor($value);
                
            case self::TYPE_DIMENSION:
                return $this->validateDimension($value, $config);
                
            case self::TYPE_SCALE:
                return $this->validateScale($value, $config);
                
            case self::TYPE_SELECT:
                return $this->validateSelect($value, $config['options']);
                
            default:
                return ['valid' => true, 'error' => null];
        }
    }
    
    /**
     * 🎨 Validate Color Value
     */
    private function validateColor($value): array {
        if (empty($value)) {
            return ['valid' => true, 'error' => null];
        }
        
        // Check hex colors
        if (preg_match('/^#[0-9a-fA-F]{6}$/', $value)) {
            return ['valid' => true, 'error' => null];
        }
        
        // Check rgba/hsla
        if (preg_match('/^(?:rgba?|hsla?)\(/i', $value)) {
            return ['valid' => true, 'error' => null];
        }
        
        return ['valid' => false, 'error' => 'Invalid color format'];
    }
    
    /**
     * 📏 Validate Dimension Value
     */
    private function validateDimension($value, array $config): array {
        $min = $config['min'] ?? 0;
        $max = $config['max'] ?? 9999;
        
        if (!is_numeric($value)) {
            return ['valid' => false, 'error' => 'Value must be numeric'];
        }
        
        $value = intval($value);
        
        if ($value < $min || $value > $max) {
            return ['valid' => false, 'error' => "Value must be between {$min} and {$max}"];
        }
        
        return ['valid' => true, 'error' => null];
    }
    
    /**
     * 📊 Validate Scale Value
     */
    private function validateScale($value, array $config): array {
        $min = $config['min'] ?? 0.0;
        $max = $config['max'] ?? 100.0;
        
        if (!is_numeric($value)) {
            return ['valid' => false, 'error' => 'Value must be numeric'];
        }
        
        $value = floatval($value);
        
        if ($value < $min || $value > $max) {
            return ['valid' => false, 'error' => "Value must be between {$min} and {$max}"];
        }
        
        return ['valid' => true, 'error' => null];
    }
    
    /**
     * 📝 Validate Select Value
     */
    private function validateSelect($value, array $options): array {
        if (!in_array($value, $options)) {
            return ['valid' => false, 'error' => 'Invalid option selected'];
        }
        
        return ['valid' => true, 'error' => null];
    }
    
    // === THREAT DETECTION METHODS ===
    
    /**
     * 🚨 Check for Dangerous Patterns
     */
    private function containsDangerousPatterns($value): bool {
        if (!is_string($value)) {
            return false;
        }
        
        foreach (self::DANGEROUS_PATTERNS as $pattern) {
            if (preg_match($pattern, $value)) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * 🔒 Settings Sanitization Hook
     */
    public function sanitizeSettingsOnSave($newValue, $oldValue) {
        // Only sanitize our plugin's settings
        if (!is_array($newValue)) {
            return $newValue;
        }
        
        return $this->sanitizeAllSettings($newValue);
    }
    
    /**
     * 🔐 Basic Security Headers
     */
    public function addBasicSecurityHeaders() {
        if (is_admin()) {
            header('X-Content-Type-Options: nosniff');
            header('X-Frame-Options: SAMEORIGIN');
            header('X-XSS-Protection: 1; mode=block');
            header('Referrer-Policy: strict-origin-when-cross-origin');
        }
    }
    
    /**
     * 🛡️ Filter Plugin Requests
     */
    public function filterPluginRequests() {
        // Check if this is a plugin-related request
        if (!$this->isPluginRequest()) {
            return;
        }
        
        // Basic request validation
        $this->validateRequest();
        
        // Check for suspicious activity
        $this->detectSuspiciousActivity();
    }
    
    /**
     * 🔍 Check if Current Request is Plugin-Related
     */
    private function isPluginRequest(): bool {
        $uri = $_SERVER['REQUEST_URI'] ?? '';
        $action = $_REQUEST['action'] ?? '';
        
        return (
            strpos($uri, 'mas_v2') !== false ||
            strpos($action, 'mas_v2') !== false ||
            strpos($uri, 'modern-admin-styler') !== false
        );
    }
    
    /**
     * ✅ Validate Request
     */
    private function validateRequest() {
        // Check request method
        $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
        
        // Check for oversized requests
        $contentLength = $_SERVER['CONTENT_LENGTH'] ?? 0;
        $maxSize = 10 * 1024 * 1024; // 10MB
        
        if ($contentLength > $maxSize) {
            $this->handleSecurityThreat(self::THREAT_SUSPICIOUS_ACTIVITY, [
                'type' => 'oversized_request',
                'content_length' => $contentLength,
                'max_allowed' => $maxSize
            ]);
        }
        
        // Check for suspicious headers
        $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? '';
        if (empty($userAgent) || strlen($userAgent) > 1000) {
            $this->handleSecurityThreat(self::THREAT_SUSPICIOUS_ACTIVITY, [
                'type' => 'suspicious_user_agent',
                'user_agent' => substr($userAgent, 0, 200)
            ]);
        }
    }
    
    /**
     * 🕵️ Detect Suspicious Activity
     */
    private function detectSuspiciousActivity() {
        $ip = $this->getClientIP();
        $uri = $_SERVER['REQUEST_URI'] ?? '';
        $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? '';
        
        // Check for known bad patterns in URI
        $suspiciousPatterns = [
            '/\.\.\//',
            '/\/etc\/passwd/',
            '/\/proc\//',
            '/php://',
            '/file://',
            '/ftp://',
            '/<script/i',
            '/union.*select/i'
        ];
        
        foreach ($suspiciousPatterns as $pattern) {
            if (preg_match($pattern, $uri)) {
                $this->handleSecurityThreat(self::THREAT_SUSPICIOUS_ACTIVITY, [
                    'type' => 'suspicious_uri_pattern',
                    'pattern' => $pattern,
                    'uri' => $uri,
                    'ip_address' => $ip
                ]);
                break;
            }
        }
        
        // Check for bot/scanner user agents
        $botPatterns = [
            '/sqlmap/i',
            '/nikto/i',
            '/nessus/i',
            '/nmap/i',
            '/masscan/i',
            '/zgrab/i'
        ];
        
        foreach ($botPatterns as $pattern) {
            if (preg_match($pattern, $userAgent)) {
                $this->handleSecurityThreat(self::THREAT_SUSPICIOUS_ACTIVITY, [
                    'type' => 'scanner_detected',
                    'user_agent' => $userAgent,
                    'ip_address' => $ip
                ]);
                break;
            }
        }
    }
    
    /**
     * 🚨 Handle Security Threat
     */
    public function handleSecurityThreat(string $threatType, array $details) {
        $ip = $details['ip_address'] ?? $this->getClientIP();
        
        // Log the threat
        $this->logSecurityEvent($threatType, $details);
        
        // Get the action for this threat type
        $action = $this->getActionForThreat($threatType);
        
        // Execute the action
        switch ($action) {
            case self::ACTION_BLOCK:
                $this->blockRequest($threatType, $ip);
                break;
                
            case self::ACTION_RATE_LIMIT:
                $this->applyRateLimit($ip);
                break;
                
            case self::ACTION_ALERT:
                $this->sendSecurityAlert($threatType, $details);
                break;
                
            case self::ACTION_QUARANTINE:
                $this->quarantineContent($details);
                break;
                
            case self::ACTION_LOG:
            default:
                // Already logged above
                break;
        }
        
        // Update threat metrics
        $this->updateThreatMetrics($threatType, $details);
    }
    
    /**
     * 📊 Get Action for Threat Type
     */
    private function getActionForThreat(string $threatType): string {
        $threatActions = [
            self::THREAT_BRUTE_FORCE => self::ACTION_BLOCK,
            self::THREAT_SQL_INJECTION => self::ACTION_BLOCK,
            self::THREAT_XSS => self::ACTION_BLOCK,
            self::THREAT_CSRF => self::ACTION_BLOCK,
            self::THREAT_SUSPICIOUS_ACTIVITY => self::ACTION_LOG,
            self::THREAT_RATE_LIMIT_EXCEEDED => self::ACTION_RATE_LIMIT,
            self::THREAT_FILE_UPLOAD => self::ACTION_QUARANTINE,
            self::THREAT_PRIVILEGE_ESCALATION => self::ACTION_ALERT
        ];
        
        return $threatActions[$threatType] ?? self::ACTION_LOG;
    }
    
    /**
     * 🚫 Block Request
     */
    private function blockRequest(string $reason, string $ip = null) {
        $ip = $ip ?: $this->getClientIP();
        
        // Send 403 Forbidden
        status_header(403);
        
        // Log the block
        $this->logSecurityEvent('request_blocked', [
            'reason' => $reason,
            'ip_address' => $ip,
            'uri' => $_SERVER['REQUEST_URI'] ?? '',
            'timestamp' => current_time('mysql')
        ]);
        
        // Display security message
        wp_die(
            'Security violation detected. Access denied.',
            'Security Alert',
            ['response' => 403]
        );
    }
    
    /**
     * ⏱️ Apply Rate Limiting
     */
    private function applyRateLimit(string $ip) {
        $key = 'rate_limit_' . md5($ip);
        $current = $this->getCacheManager()->get($key, 0, 'MEMORY');
        
        $limit = $this->securityRules['rate_limiting']['requests_per_minute'] ?? 60;
        
        if ($current >= $limit) {
            $this->blockRequest(self::THREAT_RATE_LIMIT_EXCEEDED, $ip);
        } else {
            $this->getCacheManager()->set($key, $current + 1, 60, 'MEMORY'); // 1 minute window
        }
    }
    
    // === UTILITY METHODS ===
    
    /**
     * 🌐 Get Client IP Address
     */
    private function getClientIP(): string {
        $ipKeys = [
            'HTTP_CLIENT_IP',
            'HTTP_X_FORWARDED_FOR',
            'HTTP_X_FORWARDED',
            'HTTP_X_CLUSTER_CLIENT_IP',
            'HTTP_FORWARDED_FOR',
            'HTTP_FORWARDED',
            'REMOTE_ADDR'
        ];
        
        foreach ($ipKeys as $key) {
            if (array_key_exists($key, $_SERVER) === true) {
                foreach (explode(',', $_SERVER[$key]) as $ip) {
                    $ip = trim($ip);
                    
                    if (filter_var($ip, FILTER_VALIDATE_IP, 
                        FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE) !== false) {
                        return $ip;
                    }
                }
            }
        }
        
        return $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
    }
    
    /**
     * 📝 Log Security Event
     */
    public function logSecurityEvent(string $eventType, array $eventData) {
        try {
            $logLevel = $this->securityRules['audit_logging']['log_level'] ?? 'standard';
            
            if ($logLevel === 'minimal' && !in_array($eventType, [
                self::THREAT_BRUTE_FORCE, 
                self::THREAT_SQL_INJECTION, 
                self::THREAT_XSS
            ])) {
                return; // Skip non-critical events in minimal mode
            }
            
            $logEntry = [
                'timestamp' => current_time('mysql'),
                'event_type' => $eventType,
                'ip_address' => $eventData['ip_address'] ?? $this->getClientIP(),
                'user_id' => get_current_user_id(),
                'session_id' => session_id(),
                'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? '',
                'uri' => $_SERVER['REQUEST_URI'] ?? '',
                'event_data' => $eventData,
                'severity' => $this->getEventSeverity($eventType)
            ];
            
            // Store in audit log
            $this->auditLog[] = $logEntry;
            
            // Persist to database if needed
            if ($logLevel === 'comprehensive' || $logEntry['severity'] === 'high') {
                $this->persistAuditLog($logEntry);
            }
            
            // Send to metrics collector
            $this->getMetricsCollector()->trackMetric([
                'type' => 'SECURITY',
                'event' => 'security_event',
                'data' => [
                    'event_type' => $eventType,
                    'severity' => $logEntry['severity'],
                    'ip_address' => $logEntry['ip_address'],
                    'timestamp' => $logEntry['timestamp']
                ]
            ]);
            
        } catch (\Exception $e) {
            // Logging should never break the application
            error_log('SecurityManager logging error: ' . $e->getMessage());
        }
    }
    
    /**
     * 📊 Get Event Severity
     */
    private function getEventSeverity(string $eventType): string {
        $highSeverityEvents = [
            self::THREAT_BRUTE_FORCE,
            self::THREAT_SQL_INJECTION,
            self::THREAT_XSS,
            self::THREAT_PRIVILEGE_ESCALATION
        ];
        
        $mediumSeverityEvents = [
            self::THREAT_CSRF,
            self::THREAT_FILE_UPLOAD,
            self::THREAT_SUSPICIOUS_ACTIVITY
        ];
        
        if (in_array($eventType, $highSeverityEvents)) {
            return 'high';
        } elseif (in_array($eventType, $mediumSeverityEvents)) {
            return 'medium';
        } else {
            return 'low';
        }
    }
    
    /**
     * 💾 Persist Audit Log to Database
     */
    private function persistAuditLog(array $logEntry) {
        // Store in WordPress options table or custom table
        $existingLogs = get_option('mas_v2_security_audit_log', []);
        $existingLogs[] = $logEntry;
        
        // Keep only recent logs to prevent bloat
        $maxLogs = 1000;
        if (count($existingLogs) > $maxLogs) {
            $existingLogs = array_slice($existingLogs, -$maxLogs);
        }
        
        update_option('mas_v2_security_audit_log', $existingLogs);
    }
    
    /**
     * 📊 Update Sanitization Statistics
     */
    private function updateSanitizationStats(array $input, array $sanitized, array $errors, float $time) {
        $stats = [
            'timestamp' => current_time('mysql'),
            'fields_processed' => count($input),
            'fields_sanitized' => count($sanitized),
            'errors_count' => count($errors),
            'processing_time_ms' => round($time * 1000, 2),
            'dangerous_patterns_found' => isset($sanitized['_dangerous_content_detected']) ? 
                                        count($sanitized['_dangerous_content_detected']) : 0
        ];
        
        $this->sanitizationStats[] = $stats;
        
        // Keep only recent stats
        if (count($this->sanitizationStats) > 100) {
            $this->sanitizationStats = array_slice($this->sanitizationStats, -100);
        }
    }
    
    /**
     * 📊 Update Threat Metrics
     */
    private function updateThreatMetrics(string $threatType, array $details) {
        try {
            $this->getMetricsCollector()->trackMetric([
                'type' => 'SECURITY',
                'event' => 'threat_detected',
                'data' => [
                    'threat_type' => $threatType,
                    'ip_address' => $details['ip_address'] ?? $this->getClientIP(),
                    'severity' => $this->getEventSeverity($threatType),
                    'details' => $details,
                    'timestamp' => current_time('mysql')
                ]
            ]);
        } catch (\Exception $e) {
            error_log('SecurityManager metrics error: ' . $e->getMessage());
        }
    }
    
    // === PUBLIC API METHODS ===
    
    /**
     * 🔒 Verify Nonce
     */
    public function verifyNonce(string $nonce, string $action = 'mas_v2_settings'): bool {
        return wp_verify_nonce($nonce, $action);
    }
    
    /**
     * 🔑 Generate Nonce
     */
    public function generateNonce(string $action = 'mas_v2_settings'): string {
        return wp_create_nonce($action);
    }
    
    /**
     * 👤 Check User Permissions
     */
    public function checkUserPermissions(): bool {
        return current_user_can('manage_options');
    }
    
    /**
     * 🚫 Verify AJAX Nonce
     */
    public function verifyAjaxNonce() {
        $nonce = $_REQUEST['_wpnonce'] ?? '';
        if (!$this->verifyNonce($nonce)) {
            wp_die('Security check failed', 'Security Error', ['response' => 403]);
        }
    }
    
    /**
     * 🚫 Block Unauthorized AJAX
     */
    public function blockUnauthorizedAjax() {
        wp_die('Unauthorized access', 'Security Error', ['response' => 403]);
    }
    
    /**
     * 📊 Get Security Statistics
     */
    public function getSecurityStats(): array {
        $recentEvents = array_slice($this->auditLog, -50);
        $recentStats = array_slice($this->sanitizationStats, -10);
        
        return [
            'security_level' => $this->getCurrentSecurityLevel(),
            'recent_events' => count($recentEvents),
            'high_severity_events' => count(array_filter($recentEvents, function($event) {
                return $event['severity'] === 'high';
            })),
            'sanitization_stats' => [
                'recent_operations' => count($recentStats),
                'avg_processing_time' => $this->calculateAverageProcessingTime($recentStats),
                'total_errors' => array_sum(array_column($recentStats, 'errors_count')),
                'dangerous_patterns_detected' => array_sum(array_column($recentStats, 'dangerous_patterns_found'))
            ],
            'security_rules' => [
                'brute_force_protection' => $this->securityRules['brute_force_protection']['enabled'],
                'sql_injection_protection' => $this->securityRules['sql_injection_protection']['enabled'],
                'xss_protection' => $this->securityRules['xss_protection']['enabled'],
                'rate_limiting' => $this->securityRules['rate_limiting']['enabled'],
                'audit_logging' => $this->securityRules['audit_logging']['enabled']
            ],
            'last_updated' => current_time('mysql')
        ];
    }
    
    /**
     * 🔧 Get Current Security Level
     */
    private function getCurrentSecurityLevel(): string {
        $settings = $this->coreEngine->getSettingsManager()->getSettings();
        return $settings['security_level'] ?? self::LEVEL_STANDARD;
    }
    
    /**
     * ⏱️ Calculate Average Processing Time
     */
    private function calculateAverageProcessingTime(array $stats): float {
        if (empty($stats)) {
            return 0.0;
        }
        
        $total = array_sum(array_column($stats, 'processing_time_ms'));
        return round($total / count($stats), 2);
    }
    
    /**
     * 📋 Get Recent Security Events
     */
    public function getRecentSecurityEvents(int $limit = 50): array {
        return array_slice($this->auditLog, -$limit);
    }
    
    /**
     * 🔧 Update Security Configuration
     */
    public function updateSecurityLevel(string $level): bool {
        if (!in_array($level, [
            self::LEVEL_BASIC, 
            self::LEVEL_STANDARD, 
            self::LEVEL_ADVANCED, 
            self::LEVEL_ENTERPRISE, 
            self::LEVEL_MAXIMUM
        ])) {
            return false;
        }
        
        // Update security level
        $settings = $this->coreEngine->getSettingsManager()->getSettings();
        $settings['security_level'] = $level;
        $this->coreEngine->getSettingsManager()->updateSettings($settings);
        
        // Reinitialize security with new level
        $this->initSecurityLevel($level);
        
        $this->logSecurityEvent('security_level_changed', [
            'old_level' => $this->getCurrentSecurityLevel(),
            'new_level' => $level,
            'user_id' => get_current_user_id()
        ]);
        
        return true;
    }
    
    /**
     * 🔄 Clear Security Cache
     */
    public function clearSecurityCache(): bool {
        $this->getCacheManager()->delete('security_*');
        $this->auditLog = [];
        $this->sanitizationStats = [];
        
        return true;
    }
    
    /**
     * 🧹 Cleanup Old Security Data
     */
    public function cleanupSecurityData(): int {
        $retentionDays = $this->securityRules['audit_logging']['retention_days'] ?? 30;
        $cutoffDate = date('Y-m-d H:i:s', strtotime("-{$retentionDays} days"));
        
        // Clean audit logs
        $existingLogs = get_option('mas_v2_security_audit_log', []);
        $cleanedLogs = array_filter($existingLogs, function($log) use ($cutoffDate) {
            return $log['timestamp'] > $cutoffDate;
        });
        
        update_option('mas_v2_security_audit_log', $cleanedLogs);
        
        $removedCount = count($existingLogs) - count($cleanedLogs);
        
        if ($removedCount > 0) {
            $this->logSecurityEvent('security_cleanup', [
                'removed_logs' => $removedCount,
                'retention_days' => $retentionDays
            ]);
        }
        
        return $removedCount;
    }
    
    /**
     * 🛡️ Quick Security Check
     * Simple interface for basic validation
     */
    public function quickSecurityCheck(array $data): array {
        $result = [
            'safe' => true,
            'threats' => [],
            'sanitized_data' => $data
        ];
        
        foreach ($data as $key => $value) {
            if (is_string($value) && $this->containsDangerousPatterns($value)) {
                $result['safe'] = false;
                $result['threats'][] = [
                    'field' => $key,
                    'type' => 'dangerous_pattern',
                    'value' => substr($value, 0, 100)
                ];
            }
        }
        
        if (!$result['safe']) {
            $result['sanitized_data'] = $this->sanitizeAllSettings($data);
        }
        
        return $result;
    }
} 