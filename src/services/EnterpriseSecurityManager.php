<?php
/**
 * Enterprise Security Manager - Advanced Security System
 * 
 * FAZA 6: Enterprise Integration & Analytics
 * Zaawansowany system bezpieczeństwa dla enterprise
 * 
 * @package ModernAdminStyler
 * @version 3.3.0
 */

namespace ModernAdminStyler\Services;

class EnterpriseSecurityManager {
    
    private $serviceFactory;
    private $analyticsEngine;
    private $cacheManager;
    private $securityRules = [];
    private $auditLog = [];
    
    // 🛡️ Poziomy bezpieczeństwa
    const SECURITY_LEVEL_LOW = 'low';
    const SECURITY_LEVEL_MEDIUM = 'medium';
    const SECURITY_LEVEL_HIGH = 'high';
    const SECURITY_LEVEL_MAXIMUM = 'maximum';
    
    // 🚨 Typy zagrożeń
    const THREAT_BRUTE_FORCE = 'brute_force';
    const THREAT_SQL_INJECTION = 'sql_injection';
    const THREAT_XSS = 'xss';
    const THREAT_CSRF = 'csrf';
    const THREAT_FILE_UPLOAD = 'file_upload';
    const THREAT_PRIVILEGE_ESCALATION = 'privilege_escalation';
    const THREAT_SUSPICIOUS_ACTIVITY = 'suspicious_activity';
    
    // 🔒 Akcje bezpieczeństwa
    const ACTION_BLOCK = 'block';
    const ACTION_LOG = 'log';
    const ACTION_ALERT = 'alert';
    const ACTION_QUARANTINE = 'quarantine';
    const ACTION_RATE_LIMIT = 'rate_limit';
    
    public function __construct($serviceFactory) {
        $this->serviceFactory = $serviceFactory;
        $this->analyticsEngine = $serviceFactory->getAnalyticsEngine();
        $this->cacheManager = $serviceFactory->getAdvancedCacheManager();
        
        $this->initSecurity();
    }
    
    /**
     * 🚀 Inicjalizacja systemu bezpieczeństwa
     */
    private function initSecurity() {
        // Załaduj reguły bezpieczeństwa
        $this->loadSecurityRules();
        
        // Rozpocznij monitoring
        $this->startSecurityMonitoring();
        
        // Aktywuj firewall
        $this->activateFirewall();
        
        // Konfiguruj audit log
        $this->setupAuditLogging();
        
        // Rejestruj security hooks
        $this->registerSecurityHooks();
    }
    
    /**
     * 📋 Załaduj reguły bezpieczeństwa
     */
    private function loadSecurityRules() {
        $this->securityRules = [
            // Brute Force Protection
            'brute_force_protection' => [
                'enabled' => true,
                'max_attempts' => 5,
                'lockout_duration' => 900, // 15 minut
                'window_duration' => 300,  // 5 minut
                'action' => self::ACTION_BLOCK
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
            
            // File Upload Security
            'file_upload_security' => [
                'enabled' => true,
                'allowed_extensions' => ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx'],
                'max_file_size' => 10 * 1024 * 1024, // 10MB
                'scan_for_malware' => true,
                'action' => self::ACTION_QUARANTINE
            ],
            
            // Rate Limiting
            'rate_limiting' => [
                'enabled' => true,
                'requests_per_minute' => 60,
                'requests_per_hour' => 1000,
                'burst_limit' => 10,
                'action' => self::ACTION_RATE_LIMIT
            ],
            
            // Admin Access Control
            'admin_access_control' => [
                'enabled' => true,
                'require_2fa' => false,
                'allowed_ip_ranges' => [],
                'session_timeout' => 3600, // 1 godzina
                'force_ssl' => true
            ],
            
            // Content Security Policy
            'content_security_policy' => [
                'enabled' => true,
                'default_src' => "'self'",
                'script_src' => "'self' 'unsafe-inline'",
                'style_src' => "'self' 'unsafe-inline'",
                'img_src' => "'self' data: https:",
                'font_src' => "'self' https:",
                'connect_src' => "'self'"
            ]
        ];
    }
    
    /**
     * 👁️ Rozpocznij monitoring bezpieczeństwa
     */
    private function startSecurityMonitoring() {
        // Monitor login attempts
        add_action('wp_login_failed', [$this, 'onLoginFailed']);
        add_action('wp_login', [$this, 'onLoginSuccess'], 10, 2);
        
        // Monitor admin actions
        add_action('admin_init', [$this, 'monitorAdminActivity']);
        
        // Monitor file changes
        add_action('wp_loaded', [$this, 'monitorFileIntegrity']);
        
        // Monitor database queries
        add_filter('query', [$this, 'monitorDatabaseQueries']);
    }
    
    /**
     * 🔥 Aktywuj firewall
     */
    private function activateFirewall() {
        // Request filtering
        add_action('init', [$this, 'filterIncomingRequests'], 1);
        
        // Headers security
        add_action('send_headers', [$this, 'addSecurityHeaders']);
        
        // Content filtering
        add_filter('the_content', [$this, 'filterContent']);
        add_filter('comment_text', [$this, 'filterContent']);
    }
    
    /**
     * 📝 Konfiguruj audit log
     */
    private function setupAuditLogging() {
        // Utwórz tabelę audit log
        $this->createAuditLogTable();
        
        // Monitor krytyczne akcje
        $this->monitorCriticalActions();
    }
    
    /**
     * 🔗 Rejestruj security hooks
     */
    private function registerSecurityHooks() {
        // Custom security actions
        add_action('mas_v2_security_threat_detected', [$this, 'handleSecurityThreat'], 10, 3);
        add_action('mas_v2_security_audit_log', [$this, 'logSecurityEvent'], 10, 3);
        
        // WordPress security hooks
        add_action('wp_login_failed', [$this, 'handleFailedLogin']);
        add_action('user_register', [$this, 'auditUserRegistration']);
        add_action('profile_update', [$this, 'auditProfileUpdate']);
    }
    
    /**
     * 🚫 Filtruj przychodzące żądania
     */
    public function filterIncomingRequests() {
        $request_uri = $_SERVER['REQUEST_URI'] ?? '';
        $user_agent = $_SERVER['HTTP_USER_AGENT'] ?? '';
        $ip_address = $this->getClientIP();
        
        // Sprawdź czy IP jest zablokowane
        if ($this->isIPBlocked($ip_address)) {
            $this->blockRequest('IP address blocked', $ip_address);
            return;
        }
        
        // Sprawdź rate limiting
        if ($this->isRateLimited($ip_address)) {
            $this->blockRequest('Rate limit exceeded', $ip_address);
            return;
        }
        
        // Sprawdź SQL injection
        if ($this->detectSQLInjection($request_uri)) {
            $this->handleSecurityThreat(self::THREAT_SQL_INJECTION, $request_uri, $ip_address);
            return;
        }
        
        // Sprawdź XSS
        if ($this->detectXSS($request_uri)) {
            $this->handleSecurityThreat(self::THREAT_XSS, $request_uri, $ip_address);
            return;
        }
        
        // Sprawdź suspicious patterns
        if ($this->detectSuspiciousActivity($request_uri, $user_agent)) {
            $this->handleSecurityThreat(self::THREAT_SUSPICIOUS_ACTIVITY, $request_uri, $ip_address);
            return;
        }
    }
    
    /**
     * 🛡️ Dodaj security headers
     */
    public function addSecurityHeaders() {
        if (!headers_sent()) {
            // Content Security Policy
            if ($this->securityRules['content_security_policy']['enabled']) {
                $csp = $this->buildCSPHeader();
                header("Content-Security-Policy: {$csp}");
            }
            
            // X-Frame-Options
            header('X-Frame-Options: SAMEORIGIN');
            
            // X-Content-Type-Options
            header('X-Content-Type-Options: nosniff');
            
            // X-XSS-Protection
            header('X-XSS-Protection: 1; mode=block');
            
            // Referrer Policy
            header('Referrer-Policy: strict-origin-when-cross-origin');
            
            // Strict Transport Security (jeśli HTTPS)
            if (is_ssl()) {
                header('Strict-Transport-Security: max-age=31536000; includeSubDomains');
            }
        }
    }
    
    /**
     * 🔍 Wykryj SQL injection
     */
    private function detectSQLInjection($input) {
        if (!$this->securityRules['sql_injection_protection']['enabled']) {
            return false;
        }
        
        $patterns = $this->securityRules['sql_injection_protection']['patterns'];
        
        foreach ($patterns as $pattern) {
            if (preg_match($pattern, $input)) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * 🔍 Wykryj XSS
     */
    private function detectXSS($input) {
        if (!$this->securityRules['xss_protection']['enabled']) {
            return false;
        }
        
        $patterns = $this->securityRules['xss_protection']['patterns'];
        
        foreach ($patterns as $pattern) {
            if (preg_match($pattern, $input)) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * 🔍 Wykryj podejrzaną aktywność
     */
    private function detectSuspiciousActivity($uri, $user_agent) {
        $suspicious_patterns = [
            // Próby skanowania
            '/wp-config\.php/i',
            '/\.env/i',
            '/admin\.php/i',
            '/phpmyadmin/i',
            
            // Próby exploitów
            '/\.\./i',
            '/etc\/passwd/i',
            '/proc\/self\/environ/i',
            
            // Podejrzane user agents
            '/sqlmap/i',
            '/nikto/i',
            '/nessus/i',
            '/masscan/i'
        ];
        
        foreach ($suspicious_patterns as $pattern) {
            if (preg_match($pattern, $uri) || preg_match($pattern, $user_agent)) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * ⏱️ Sprawdź rate limiting
     */
    private function isRateLimited($ip_address) {
        if (!$this->securityRules['rate_limiting']['enabled']) {
            return false;
        }
        
        $cache_key = "rate_limit_{$ip_address}";
        $requests = $this->cacheManager->get($cache_key) ?: [];
        
        $current_time = time();
        $requests_per_minute = $this->securityRules['rate_limiting']['requests_per_minute'];
        
        // Usuń stare żądania (starsze niż minuta)
        $requests = array_filter($requests, function($timestamp) use ($current_time) {
            return ($current_time - $timestamp) < 60;
        });
        
        // Sprawdź czy przekroczono limit
        if (count($requests) >= $requests_per_minute) {
            return true;
        }
        
        // Dodaj bieżące żądanie
        $requests[] = $current_time;
        $this->cacheManager->set($cache_key, $requests, 300); // 5 minut
        
        return false;
    }
    
    /**
     * 🚫 Sprawdź czy IP jest zablokowane
     */
    private function isIPBlocked($ip_address) {
        $blocked_ips = $this->cacheManager->get('blocked_ips') ?: [];
        
        return in_array($ip_address, $blocked_ips);
    }
    
    /**
     * 🛑 Zablokuj żądanie
     */
    private function blockRequest($reason, $ip_address = null) {
        // Log security event
        $this->logSecurityEvent('request_blocked', $reason, [
            'ip_address' => $ip_address,
            'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? '',
            'request_uri' => $_SERVER['REQUEST_URI'] ?? ''
        ]);
        
        // Wyślij 403 Forbidden
        http_response_code(403);
        die('Access Denied: ' . esc_html($reason));
    }
    
    /**
     * 🚨 Obsłuż zagrożenie bezpieczeństwa
     */
    public function handleSecurityThreat($threat_type, $details, $ip_address) {
        // Log zagrożenia
        $this->logSecurityEvent('threat_detected', $threat_type, [
            'details' => $details,
            'ip_address' => $ip_address,
            'severity' => 'high'
        ]);
        
        // Zbierz metrykę analytics
        $this->analyticsEngine->collectSecurityMetric($threat_type, $details, [
            'ip_address' => $ip_address,
            'severity' => 'high',
            'blocked' => true
        ]);
        
        // Wykonaj akcję odpowiednią dla typu zagrożenia
        switch ($threat_type) {
            case self::THREAT_SQL_INJECTION:
            case self::THREAT_XSS:
                $this->blockRequest("Security threat detected: {$threat_type}", $ip_address);
                break;
                
            case self::THREAT_SUSPICIOUS_ACTIVITY:
                $this->addToWatchlist($ip_address);
                break;
                
            case self::THREAT_BRUTE_FORCE:
                $this->temporarilyBlockIP($ip_address);
                break;
        }
        
        // Wyślij alert administratorowi
        $this->sendSecurityAlert($threat_type, $details, $ip_address);
    }
    
    /**
     * 📧 Wyślij alert bezpieczeństwa
     */
    private function sendSecurityAlert($threat_type, $details, $ip_address) {
        $admin_email = get_option('admin_email');
        $site_name = get_bloginfo('name');
        
        $subject = "[{$site_name}] Security Alert: {$threat_type}";
        
        $message = "Security threat detected on your website:\n\n";
        $message .= "Threat Type: {$threat_type}\n";
        $message .= "IP Address: {$ip_address}\n";
        $message .= "Details: {$details}\n";
        $message .= "Time: " . current_time('mysql') . "\n\n";
        $message .= "This alert was generated by Modern Admin Styler V2 Security System.";
        
        wp_mail($admin_email, $subject, $message);
    }
    
    /**
     * 📝 Loguj event bezpieczeństwa
     * FIXED: Optimized to prevent memory exhaustion with large data
     */
    public function logSecurityEvent($event_type, $event_data, $metadata = []) {
        global $wpdb;
        
        $table_name = $wpdb->prefix . 'mas_v2_security_log';
        
        // Truncate large data to prevent memory issues
        $max_data_length = 10000; // 10KB limit for event data
        $event_data_json = is_array($event_data) ? json_encode($event_data) : (string)$event_data;
        
        if (strlen($event_data_json) > $max_data_length) {
            $event_data_json = substr($event_data_json, 0, $max_data_length) . '... [TRUNCATED]';
        }
        
        $metadata_json = json_encode($metadata);
        if (strlen($metadata_json) > $max_data_length) {
            $metadata_json = substr($metadata_json, 0, $max_data_length) . '... [TRUNCATED]';
        }
        
        $log_entry = [
            'event_type' => $event_type,
            'event_data' => $event_data_json,
            'metadata' => $metadata_json,
            'ip_address' => $this->getClientIP(),
            'user_id' => get_current_user_id(),
            'user_agent' => substr($_SERVER['HTTP_USER_AGENT'] ?? '', 0, 500), // Limit user agent length
            'created_at' => current_time('mysql')
        ];
        
        // Insert with error handling
        $insert_result = $wpdb->insert($table_name, $log_entry);
        
        if ($insert_result === false) {
            error_log('MAS Security: Failed to insert security log entry - ' . $wpdb->last_error);
            return;
        }
        
        // Dodaj do cache dla szybkiego dostępu (with memory optimization)
        $recent_logs = $this->cacheManager->get('recent_security_logs') ?: [];
        
        // Create lightweight cache entry (remove large data)
        $cache_entry = [
            'event_type' => $event_type,
            'event_data' => strlen($event_data_json) > 500 ? substr($event_data_json, 0, 500) . '...' : $event_data_json,
            'ip_address' => $log_entry['ip_address'],
            'created_at' => $log_entry['created_at']
        ];
        
        array_unshift($recent_logs, $cache_entry);
        
        // Zachowaj tylko ostatnie 50 logów w cache (reduced from 100 to save memory)
        if (count($recent_logs) > 50) {
            $recent_logs = array_slice($recent_logs, 0, 50);
        }
        
        $this->cacheManager->set('recent_security_logs', $recent_logs, 1800); // Reduced cache time to 30 minutes
        
        // Clean up old logs periodically to prevent database bloat
        if (rand(1, 100) === 1) { // 1% chance to run cleanup
            $this->cleanupOldSecurityLogs();
        }
    }

    /**
     * 🧹 Wyczyść stare logi bezpieczeństwa
     * FIXED: Prevents database from growing too large
     */
    private function cleanupOldSecurityLogs() {
        global $wpdb;
        
        $table_name = $wpdb->prefix . 'mas_v2_security_log';
        
        // Keep only logs from the last 30 days
        $cleanup_date = date('Y-m-d H:i:s', strtotime('-30 days'));
        
        $deleted_count = $wpdb->query($wpdb->prepare(
            "DELETE FROM {$table_name} WHERE created_at < %s",
            $cleanup_date
        ));
        
        if ($deleted_count > 0) {
            error_log("MAS Security: Cleaned up {$deleted_count} old security log entries");
        }
        
        // Also clean up very large logs that might cause memory issues
        $wpdb->query($wpdb->prepare(
            "DELETE FROM {$table_name} WHERE LENGTH(event_data) > %d OR LENGTH(metadata) > %d",
            50000, // 50KB
            50000
        ));
    }
    
    /**
     * 🗄️ Utwórz tabelę audit log
     */
    private function createAuditLogTable() {
        global $wpdb;
        
        $table_name = $wpdb->prefix . 'mas_v2_security_log';
        $charset_collate = $wpdb->get_charset_collate();
        
        $sql = "CREATE TABLE IF NOT EXISTS {$table_name} (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            event_type varchar(100) NOT NULL,
            event_data longtext,
            metadata longtext,
            ip_address varchar(45),
            user_id bigint(20) DEFAULT 0,
            user_agent text,
            created_at datetime NOT NULL,
            PRIMARY KEY (id),
            KEY event_type (event_type),
            KEY ip_address (ip_address),
            KEY user_id (user_id),
            KEY created_at (created_at)
        ) {$charset_collate};";
        
        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        dbDelta($sql);
    }
    
    /**
     * 👁️ Monitoruj krytyczne akcje
     */
    private function monitorCriticalActions() {
        // Monitor plugin/theme changes
        add_action('activated_plugin', function($plugin) {
            $this->logSecurityEvent('plugin_activated', $plugin);
        });
        
        add_action('deactivated_plugin', function($plugin) {
            $this->logSecurityEvent('plugin_deactivated', $plugin);
        });
        
        // Monitor user changes
        add_action('user_register', function($user_id) {
            $user = get_user_by('id', $user_id);
            $this->logSecurityEvent('user_registered', $user->user_login);
        });
        
        add_action('delete_user', function($user_id) {
            $user = get_user_by('id', $user_id);
            $this->logSecurityEvent('user_deleted', $user->user_login);
        });
        
        // Monitor option changes
        add_action('updated_option', function($option_name, $old_value, $value) {
            if (in_array($option_name, ['users_can_register', 'default_role', 'admin_email'])) {
                $this->logSecurityEvent('critical_option_changed', $option_name, [
                    'old_value' => $old_value,
                    'new_value' => $value
                ]);
            }
        }, 10, 3);
    }
    
    /**
     * 🔧 Metody pomocnicze
     */
    private function getClientIP() {
        $ip_keys = ['HTTP_CLIENT_IP', 'HTTP_X_FORWARDED_FOR', 'REMOTE_ADDR'];
        
        foreach ($ip_keys as $key) {
            if (array_key_exists($key, $_SERVER) === true) {
                foreach (explode(',', $_SERVER[$key]) as $ip) {
                    $ip = trim($ip);
                    if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE) !== false) {
                        return $ip;
                    }
                }
            }
        }
        
        return $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    }
    
    private function buildCSPHeader() {
        $csp_rules = $this->securityRules['content_security_policy'];
        
        $csp_parts = [];
        foreach ($csp_rules as $directive => $value) {
            if ($directive !== 'enabled' && !empty($value)) {
                $csp_parts[] = str_replace('_', '-', $directive) . " {$value}";
            }
        }
        
        return implode('; ', $csp_parts);
    }
    
    private function addToWatchlist($ip_address) {
        $watchlist = $this->cacheManager->get('security_watchlist') ?: [];
        
        if (!in_array($ip_address, $watchlist)) {
            $watchlist[] = $ip_address;
            $this->cacheManager->set('security_watchlist', $watchlist, 3600 * 24); // 24 godziny
        }
    }
    
    private function temporarilyBlockIP($ip_address) {
        $blocked_ips = $this->cacheManager->get('blocked_ips') ?: [];
        
        if (!in_array($ip_address, $blocked_ips)) {
            $blocked_ips[] = $ip_address;
            $lockout_duration = $this->securityRules['brute_force_protection']['lockout_duration'];
            $this->cacheManager->set('blocked_ips', $blocked_ips, $lockout_duration);
        }
    }
    
    /**
     * 🔍 Event handlers
     */
    public function onLoginFailed($username) {
        $ip_address = $this->getClientIP();
        
        // Sprawdź czy to próba brute force
        $cache_key = "login_attempts_{$ip_address}";
        $attempts = $this->cacheManager->get($cache_key) ?: 0;
        $attempts++;
        
        $max_attempts = $this->securityRules['brute_force_protection']['max_attempts'];
        $window_duration = $this->securityRules['brute_force_protection']['window_duration'];
        
        $this->cacheManager->set($cache_key, $attempts, $window_duration);
        
        if ($attempts >= $max_attempts) {
            $this->handleSecurityThreat(self::THREAT_BRUTE_FORCE, "Failed login attempts: {$attempts}", $ip_address);
        }
        
        $this->logSecurityEvent('login_failed', $username, [
            'ip_address' => $ip_address,
            'attempts' => $attempts
        ]);
    }
    
    public function onLoginSuccess($user_login, $user) {
        $ip_address = $this->getClientIP();
        
        // Wyczyść licznik nieudanych prób
        $cache_key = "login_attempts_{$ip_address}";
        $this->cacheManager->delete($cache_key);
        
        $this->logSecurityEvent('login_success', $user_login, [
            'ip_address' => $ip_address,
            'user_id' => $user->ID
        ]);
    }
    
    public function monitorAdminActivity() {
        if (!is_admin() || !current_user_can('manage_options')) {
            return;
        }
        
        $action = $_GET['action'] ?? $_POST['action'] ?? '';
        
        if (!empty($action)) {
            $this->logSecurityEvent('admin_action', $action, [
                'page' => $_GET['page'] ?? '',
                'user_id' => get_current_user_id()
            ]);
        }
    }
    
    public function monitorFileIntegrity() {
        // Placeholder dla monitoringu integralności plików
        // W pełnej implementacji sprawdzałby sumy kontrolne plików core
    }
    
    public function monitorDatabaseQueries($query) {
        // Monitor podejrzanych zapytań do bazy danych
        if ($this->detectSQLInjection($query)) {
            $this->handleSecurityThreat(self::THREAT_SQL_INJECTION, $query, $this->getClientIP());
        }
        
        return $query;
    }
    
    public function filterContent($content) {
        // Filtruj potencjalnie niebezpieczną zawartość
        if ($this->detectXSS($content)) {
            $this->logSecurityEvent('xss_attempt_in_content', 'XSS detected in content');
            return wp_kses_post($content);
        }
        
        return $content;
    }
    
    /**
     * 📊 API publiczne
     */
    
    /**
     * Pobierz statystyki bezpieczeństwa
     * FIXED: Optimized queries to prevent memory issues
     */
    public function getSecurityStats() {
        global $wpdb;
        
        $table_name = $wpdb->prefix . 'mas_v2_security_log';
        $today = current_time('Y-m-d');
        
        // Check if table exists first
        $table_exists = $wpdb->get_var($wpdb->prepare("SHOW TABLES LIKE %s", $table_name)) === $table_name;
        
        if (!$table_exists) {
            return [
                'threats_today' => 0,
                'blocked_requests_today' => 0,
                'failed_logins_today' => 0,
                'total_events_today' => 0,
                'blocked_ips' => count($this->cacheManager->get('blocked_ips') ?: []),
                'watchlist_ips' => count($this->cacheManager->get('security_watchlist') ?: []),
                'table_status' => 'not_created'
            ];
        }
        
        // Use efficient single query with conditional counting
        $stats_query = $wpdb->prepare("
            SELECT 
                SUM(CASE WHEN event_type = 'threat_detected' THEN 1 ELSE 0 END) as threats_today,
                SUM(CASE WHEN event_type = 'request_blocked' THEN 1 ELSE 0 END) as blocked_requests_today,
                SUM(CASE WHEN event_type = 'login_failed' THEN 1 ELSE 0 END) as failed_logins_today,
                COUNT(*) as total_events_today
            FROM {$table_name} 
            WHERE DATE(created_at) = %s
            LIMIT 1
        ", $today);
        
        $result = $wpdb->get_row($stats_query, ARRAY_A);
        
        $stats = [
            'threats_today' => (int)($result['threats_today'] ?? 0),
            'blocked_requests_today' => (int)($result['blocked_requests_today'] ?? 0),
            'failed_logins_today' => (int)($result['failed_logins_today'] ?? 0),
            'total_events_today' => (int)($result['total_events_today'] ?? 0),
            'blocked_ips' => count($this->cacheManager->get('blocked_ips') ?: []),
            'watchlist_ips' => count($this->cacheManager->get('security_watchlist') ?: []),
            'table_status' => 'active',
            'memory_usage' => [
                'current' => memory_get_usage(true),
                'peak' => memory_get_peak_usage(true),
                'limit' => ini_get('memory_limit')
            ]
        ];
        
        return $stats;
    }
    
    /**
     * Pobierz ostatnie eventy bezpieczeństwa
     */
    public function getRecentSecurityEvents($limit = 50) {
        return array_slice($this->cacheManager->get('recent_security_logs') ?: [], 0, $limit);
    }
    
    /**
     * Pobierz konfigurację bezpieczeństwa
     */
    public function getSecurityConfig() {
        return $this->securityRules;
    }
    
    /**
     * Aktualizuj konfigurację bezpieczeństwa
     */
    public function updateSecurityConfig($config) {
        $this->securityRules = array_merge($this->securityRules, $config);
        update_option('mas_v2_security_config', $this->securityRules);
        
        $this->logSecurityEvent('security_config_updated', 'Security configuration updated');
    }

    /**
     * 🔍 Skanuj opcje bazy danych w poszukiwaniu podejrzanej zawartości
     * FIXED: Używa chunking aby uniknąć wyczerpania pamięci
     */
    public function scanDatabaseOptions(): array {
        global $wpdb;
        $results = [];
        $limit = 500; // Process 500 options at a time to stay within memory limits.
        $offset = 0;

        while (true) {
            // SOLUTION: Fetch options in smaller, manageable chunks using LIMIT and OFFSET.
            $query = $wpdb->prepare(
                "SELECT option_name, option_value FROM {$wpdb->options} LIMIT %d OFFSET %d",
                $limit,
                $offset
            );
            $options_chunk = $wpdb->get_results($query, ARRAY_A);

            // If no more options are found, the scan is complete.
            if (empty($options_chunk)) {
                break;
            }

            foreach ($options_chunk as $option) {
                // A placeholder for a real security check (e.g., regex for base64_decode, eval, etc.)
                if ($this->isContentSuspicious($option['option_value'])) {
                    $results[] = [
                        'name' => $option['option_name'],
                        'reason' => 'Potentially malicious content found.',
                        'value_length' => strlen($option['option_value'])
                    ];
                }
            }

            // Prepare for the next chunk of data.
            $offset += $limit;

            /**
             * Optional but recommended:
             * Prevent script timeouts on servers with very large databases or slow I/O.
             * This resets the PHP execution time limit counter.
             */
            set_time_limit(30);

            // Optional: Free up memory used by the chunk before processing the next one.
            unset($options_chunk);
        }

        return $results;
    }

    /**
     * 🔍 Sprawdź czy zawartość jest podejrzana
     */
    private function isContentSuspicious($content): bool {
        if (empty($content) || !is_string($content)) {
            return false;
        }

        // Patterns indicating potentially malicious content
        $suspicious_patterns = [
            '/base64_decode\s*\(/i',
            '/eval\s*\(/i',
            '/exec\s*\(/i',
            '/system\s*\(/i',
            '/shell_exec\s*\(/i',
            '/file_get_contents\s*\(/i',
            '/curl_exec\s*\(/i',
            '/wp_remote_get\s*\(/i',
            '/<script[^>]*>.*?<\/script>/si',
            '/javascript\s*:/i',
            '/data\s*:\s*text\/html/i'
        ];

        foreach ($suspicious_patterns as $pattern) {
            if (preg_match($pattern, $content)) {
                return true;
            }
        }

        return false;
    }

    /**
     * 🔍 Skanuj pliki w poszukiwaniu podejrzanej zawartości
     * FIXED: Używa chunking aby uniknąć wyczerpania pamięci
     */
    public function scanFileSystem($directory = null): array {
        if (!$directory) {
            $directory = ABSPATH;
        }

        $results = [];
        $files_to_scan = [];
        
        // Get list of files to scan (limit to avoid memory issues)
        $iterator = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator($directory),
            \RecursiveIteratorIterator::LEAVES_ONLY
        );

        $file_count = 0;
        $max_files = 1000; // Limit number of files to scan to prevent memory exhaustion

        foreach ($iterator as $file) {
            if ($file->isFile() && $this->shouldScanFile($file)) {
                $files_to_scan[] = $file->getPathname();
                $file_count++;
                
                // Prevent scanning too many files at once
                if ($file_count >= $max_files) {
                    break;
                }
            }
        }

        // Process files in chunks
        $chunk_size = 50;
        $file_chunks = array_chunk($files_to_scan, $chunk_size);

        foreach ($file_chunks as $chunk) {
            foreach ($chunk as $file_path) {
                try {
                    $file_content = file_get_contents($file_path, false, null, 0, 10240); // Read only first 10KB
                    
                    if ($this->isContentSuspicious($file_content)) {
                        $results[] = [
                            'file' => $file_path,
                            'reason' => 'Suspicious content detected',
                            'size' => filesize($file_path)
                        ];
                    }
                } catch (Exception $e) {
                    // Skip files that can't be read
                    continue;
                }
            }

            // Reset execution time and free memory
            set_time_limit(30);
            unset($chunk);
        }

        return $results;
    }

    /**
     * 🔍 Sprawdź czy plik powinien być skanowany
     */
    private function shouldScanFile($file): bool {
        $extension = strtolower(pathinfo($file->getFilename(), PATHINFO_EXTENSION));
        $scannable_extensions = ['php', 'js', 'html', 'htm', 'txt', 'css'];
        
        return in_array($extension, $scannable_extensions) && $file->getSize() < 1048576; // Skip files larger than 1MB
    }

    /**
     * 🔍 Kompleksowy skan bezpieczeństwa
     */
    public function runComprehensiveScan(): array {
        $scan_results = [
            'timestamp' => current_time('mysql'),
            'database_scan' => [],
            'filesystem_scan' => [],
            'security_stats' => $this->getSecurityStats(),
            'memory_usage' => [
                'before_scan' => memory_get_usage(true),
                'peak_usage' => memory_get_peak_usage(true),
                'limit' => ini_get('memory_limit')
            ]
        ];

        try {
            // Scan database options (with chunking)
            $scan_results['database_scan'] = $this->scanDatabaseOptions();
            
            // Scan file system (with chunking)
            $scan_results['filesystem_scan'] = $this->scanFileSystem();
            
            // Update memory usage after scan
            $scan_results['memory_usage']['after_scan'] = memory_get_usage(true);
            $scan_results['memory_usage']['peak_usage'] = memory_get_peak_usage(true);
            
        } catch (Exception $e) {
            $scan_results['error'] = $e->getMessage();
            $this->logSecurityEvent('scan_error', $e->getMessage());
        }

        // Log scan completion
        $this->logSecurityEvent('comprehensive_scan_completed', 'Security scan finished', [
            'database_issues' => count($scan_results['database_scan']),
            'filesystem_issues' => count($scan_results['filesystem_scan']),
            'memory_used' => $scan_results['memory_usage']
        ]);

        return $scan_results;
    }
} 