<?php
/**
 * AJAX Security Manager - Unified Security for All AJAX Endpoints
 * 
 * Centralizes all AJAX security validation including:
 * - Nonce verification with consistent naming
 * - Capability checking
 * - Rate limiting with WordPress transients
 * - Security violation logging and tracking
 * - Input sanitization and CSRF protection
 * 
 * @package ModernAdminStyler
 * @version 2.4.0 - Security Overhaul
 */

namespace ModernAdminStyler\Services;

require_once __DIR__ . '/SecurityExceptions.php';

class AjaxSecurityManager {
    
    // Unified nonce action for all AJAX endpoints
    const NONCE_ACTION = 'mas_v2_ajax_nonce';
    
    // Rate limiting configuration
    const RATE_LIMIT_PREFIX = 'mas_v2_rate_';
    const DEFAULT_RATE_LIMIT = 10; // requests per minute
    const RATE_LIMIT_WINDOW = 60; // seconds
    
    // Security violation tracking
    private $security_violations = [];
    private $violation_storage_key = 'mas_v2_security_violations';
    private $max_stored_violations = 100;
    
    /**
     * Comprehensive AJAX request validation
     * 
     * @param string $action AJAX action name
     * @param array $config Endpoint configuration
     * @throws SecurityException If validation fails
     * @return bool True if validation passes
     */
    public function validateRequest($action, $config) {
        try {
            // 1. Nonce verification (most critical)
            $this->validateNonce($action);
            
            // 2. Capability check
            $this->validateCapability($config['capability'] ?? 'manage_options');
            
            // 3. Input sanitization
            $this->sanitizeInputs();
            
            // 4. CSRF protection
            $this->validateReferer();
            
            // 5. Rate limiting check
            $this->checkRateLimit(
                get_current_user_id(),
                $_SERVER['REMOTE_ADDR'] ?? 'unknown',
                $config['rate_limit'] ?? self::DEFAULT_RATE_LIMIT
            );
            
            return true;
            
        } catch (SecurityException $e) {
            // Log security violation and re-throw
            $this->logSecurityViolation($e->getViolationType(), [
                'action' => $action,
                'error_message' => $e->getMessage(),
                'user_id' => get_current_user_id(),
                'ip_address' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
                'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown',
                'config' => $config
            ]);
            
            throw $e;
        }
    }
    
    /**
     * Validate WordPress nonce with unified naming
     * 
     * @param string $action AJAX action for context
     * @throws SecurityException If nonce validation fails
     */
    private function validateNonce($action) {
        $nonce = $_POST['nonce'] ?? $_POST['_wpnonce'] ?? '';
        
        if (empty($nonce)) {
            throw new SecurityException(
                __('Security token missing', 'woow-admin-styler'),
                'missing_nonce'
            );
        }
        
        if (!wp_verify_nonce($nonce, self::NONCE_ACTION)) {
            $this->logSecurityViolation('invalid_nonce', [
                'nonce_provided' => substr($nonce, 0, 10) . '...', // Partial for security
                'expected_action' => self::NONCE_ACTION,
                'ajax_action' => $action,
                'user_id' => get_current_user_id(),
                'ip_address' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
                'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown',
                'timestamp' => current_time('mysql')
            ]);
            
            throw new SecurityException(
                __('Security verification failed', 'woow-admin-styler'),
                'invalid_nonce'
            );
        }
    }
    
    /**
     * Validate user capabilities
     * 
     * @param string $required_capability WordPress capability required
     * @throws SecurityException If capability check fails
     */
    private function validateCapability($required_capability) {
        if (!current_user_can($required_capability)) {
            $user = wp_get_current_user();
            
            $this->logSecurityViolation('insufficient_capability', [
                'required_capability' => $required_capability,
                'user_id' => get_current_user_id(),
                'user_login' => $user->user_login ?? 'unknown',
                'user_roles' => $user->roles ?? [],
                'ip_address' => $_SERVER['REMOTE_ADDR'] ?? 'unknown'
            ]);
            
            throw new SecurityException(
                __('Insufficient permissions', 'woow-admin-styler'),
                'insufficient_capability'
            );
        }
    }
    
    /**
     * Sanitize all input data recursively
     */
    private function sanitizeInputs() {
        $_POST = $this->sanitizeArray($_POST);
        $_GET = $this->sanitizeArray($_GET);
        $_REQUEST = $this->sanitizeArray($_REQUEST);
    }
    
    /**
     * Recursively sanitize array data
     * 
     * @param array $array Data to sanitize
     * @return array Sanitized data
     */
    private function sanitizeArray($array) {
        if (!is_array($array)) {
            return sanitize_text_field($array);
        }
        
        foreach ($array as $key => $value) {
            if (is_array($value)) {
                $array[$key] = $this->sanitizeArray($value);
            } else {
                // Use appropriate sanitization based on key name
                $array[$key] = $this->sanitizeByContext($key, $value);
            }
        }
        
        return $array;
    }
    
    /**
     * Context-aware sanitization
     * 
     * @param string $key Field name for context
     * @param mixed $value Value to sanitize
     * @return mixed Sanitized value
     */
    private function sanitizeByContext($key, $value) {
        // Email fields
        if (strpos($key, 'email') !== false) {
            return sanitize_email($value);
        }
        
        // URL fields
        if (strpos($key, 'url') !== false || strpos($key, 'link') !== false) {
            return esc_url_raw($value);
        }
        
        // HTML content (for settings that may contain HTML)
        if (strpos($key, 'html') !== false || strpos($key, 'content') !== false) {
            return wp_kses_post($value);
        }
        
        // Numeric fields
        if (strpos($key, 'id') !== false || strpos($key, 'count') !== false || is_numeric($value)) {
            return intval($value);
        }
        
        // Default: text field sanitization
        return sanitize_text_field($value);
    }
    
    /**
     * Validate HTTP referer for CSRF protection
     * 
     * @throws SecurityException If referer validation fails
     */
    private function validateReferer() {
        // Skip referer check for localhost development
        if (defined('WP_DEBUG') && WP_DEBUG && 
            (strpos($_SERVER['HTTP_HOST'] ?? '', 'localhost') !== false || 
             strpos($_SERVER['HTTP_HOST'] ?? '', '127.0.0.1') !== false)) {
            return;
        }
        
        if (!check_ajax_referer(self::NONCE_ACTION, 'nonce', false)) {
            $this->logSecurityViolation('invalid_referer', [
                'referer' => $_SERVER['HTTP_REFERER'] ?? 'none',
                'expected_origin' => home_url(),
                'user_id' => get_current_user_id(),
                'ip_address' => $_SERVER['REMOTE_ADDR'] ?? 'unknown'
            ]);
            
            throw new SecurityException(
                __('Invalid request origin', 'woow-admin-styler'),
                'invalid_referer'
            );
        }
    }
    
    /**
     * Rate limiting implementation using WordPress transients
     * 
     * @param int $user_id User ID
     * @param string $ip_address IP address
     * @param int $limit Requests per minute limit
     * @throws SecurityException If rate limit exceeded
     */
    public function checkRateLimit($user_id, $ip_address, $limit) {
        $key = self::RATE_LIMIT_PREFIX . $user_id . '_' . md5($ip_address);
        $now = time();
        
        // Get current request history
        $requests = get_transient($key) ?: [];
        
        // Clean old requests outside the window
        $requests = array_filter($requests, function($timestamp) use ($now) {
            return $timestamp > ($now - self::RATE_LIMIT_WINDOW);
        });
        
        // Check if limit exceeded
        if (count($requests) >= $limit) {
            $this->logSecurityViolation('rate_limit_exceeded', [
                'user_id' => $user_id,
                'ip_address' => $ip_address,
                'request_count' => count($requests),
                'limit' => $limit,
                'window_seconds' => self::RATE_LIMIT_WINDOW,
                'oldest_request' => min($requests),
                'newest_request' => max($requests)
            ]);
            
            throw new SecurityException(
                sprintf(
                    __('Rate limit exceeded. Maximum %d requests per minute allowed. Please wait before making more requests.', 'woow-admin-styler'),
                    $limit
                ),
                'rate_limit_exceeded'
            );
        }
        
        // Add current request to history
        $requests[] = $now;
        set_transient($key, $requests, self::RATE_LIMIT_WINDOW);
    }
    
    /**
     * Log security violations with comprehensive context
     * 
     * @param string $type Violation type
     * @param array $context Additional context data
     */
    public function logSecurityViolation($type, $context) {
        $violation = [
            'type' => $type,
            'timestamp' => current_time('mysql'),
            'context' => $context,
            'request_uri' => $_SERVER['REQUEST_URI'] ?? '',
            'http_method' => $_SERVER['REQUEST_METHOD'] ?? '',
            'severity' => $this->getViolationSeverity($type),
            'action_taken' => $this->getActionTaken($type)
        ];
        
        // Add to current session violations
        $this->security_violations[] = $violation;
        
        // Log to WordPress error log
        error_log(sprintf(
            'MAS V2 Security Violation [%s]: %s | User: %d | IP: %s | Time: %s',
            strtoupper($violation['severity']),
            $type,
            $context['user_id'] ?? 0,
            $context['ip_address'] ?? 'unknown',
            $violation['timestamp']
        ));
        
        // Store in database for security dashboard
        $this->storeSecurityViolation($violation);
        
        // Send email alert for critical violations
        if ($violation['severity'] === 'critical') {
            $this->sendSecurityAlert($violation);
        }
    }
    
    /**
     * Determine violation severity level
     * 
     * @param string $type Violation type
     * @return string Severity level
     */
    private function getViolationSeverity($type) {
        $severity_map = [
            'invalid_nonce' => 'high',
            'missing_nonce' => 'high',
            'insufficient_capability' => 'medium',
            'rate_limit_exceeded' => 'medium',
            'invalid_referer' => 'high',
            'malicious_input' => 'critical',
            'sql_injection_attempt' => 'critical',
            'xss_attempt' => 'high'
        ];
        
        return $severity_map[$type] ?? 'low';
    }
    
    /**
     * Determine action taken for violation type
     * 
     * @param string $type Violation type
     * @return string Action description
     */
    private function getActionTaken($type) {
        $action_map = [
            'invalid_nonce' => 'Request blocked, error logged',
            'missing_nonce' => 'Request blocked, error logged',
            'insufficient_capability' => 'Request blocked, user logged',
            'rate_limit_exceeded' => 'Request blocked, IP tracked',
            'invalid_referer' => 'Request blocked, origin logged',
            'malicious_input' => 'Request blocked, admin notified',
            'sql_injection_attempt' => 'Request blocked, admin notified',
            'xss_attempt' => 'Request blocked, input sanitized'
        ];
        
        return $action_map[$type] ?? 'Request logged';
    }
    
    /**
     * Store security violation in database
     * 
     * @param array $violation Violation data
     */
    private function storeSecurityViolation($violation) {
        $violations = get_option($this->violation_storage_key, []);
        $violations[] = $violation;
        
        // Keep only the most recent violations
        if (count($violations) > $this->max_stored_violations) {
            $violations = array_slice($violations, -$this->max_stored_violations);
        }
        
        update_option($this->violation_storage_key, $violations);
    }
    
    /**
     * Send security alert email for critical violations
     * 
     * @param array $violation Violation data
     */
    private function sendSecurityAlert($violation) {
        $admin_email = get_option('admin_email');
        if (!$admin_email) {
            return;
        }
        
        $subject = sprintf(
            '[%s] Critical Security Alert - %s',
            get_bloginfo('name'),
            $violation['type']
        );
        
        $message = sprintf(
            "Critical security violation detected on your WordPress site:\n\n" .
            "Violation Type: %s\n" .
            "Timestamp: %s\n" .
            "User ID: %s\n" .
            "IP Address: %s\n" .
            "User Agent: %s\n" .
            "Request URI: %s\n\n" .
            "Action Taken: %s\n\n" .
            "Please review your site's security logs and consider additional security measures if necessary.\n\n" .
            "This is an automated security alert from WOOW! Admin Styler plugin.",
            $violation['type'],
            $violation['timestamp'],
            $violation['context']['user_id'] ?? 'unknown',
            $violation['context']['ip_address'] ?? 'unknown',
            $violation['context']['user_agent'] ?? 'unknown',
            $violation['request_uri'],
            $violation['action_taken']
        );
        
        wp_mail($admin_email, $subject, $message);
    }
    
    /**
     * Get security statistics for dashboard
     * 
     * @return array Security statistics
     */
    public function getSecurityStats() {
        $violations = get_option($this->violation_storage_key, []);
        
        if (empty($violations)) {
            return [
                'total_violations' => 0,
                'recent_violations' => 0,
                'violation_types' => [],
                'top_violating_ips' => [],
                'security_score' => 100
            ];
        }
        
        // Calculate recent violations (last 24 hours)
        $recent_threshold = strtotime('-24 hours');
        $recent_violations = array_filter($violations, function($v) use ($recent_threshold) {
            return strtotime($v['timestamp']) > $recent_threshold;
        });
        
        // Count violation types
        $violation_types = [];
        foreach ($violations as $violation) {
            $type = $violation['type'];
            $violation_types[$type] = ($violation_types[$type] ?? 0) + 1;
        }
        
        // Find top violating IPs
        $ip_counts = [];
        foreach ($violations as $violation) {
            $ip = $violation['context']['ip_address'] ?? 'unknown';
            $ip_counts[$ip] = ($ip_counts[$ip] ?? 0) + 1;
        }
        arsort($ip_counts);
        $top_violating_ips = array_slice($ip_counts, 0, 5, true);
        
        // Calculate security score (100 - violations in last 24h)
        $security_score = max(0, 100 - count($recent_violations));
        
        return [
            'total_violations' => count($violations),
            'recent_violations' => count($recent_violations),
            'violation_types' => $violation_types,
            'top_violating_ips' => $top_violating_ips,
            'security_score' => $security_score,
            'last_violation' => end($violations)['timestamp'] ?? null
        ];
    }
    
    /**
     * Clear old security violations (maintenance)
     * 
     * @param int $days_to_keep Number of days to keep violations
     */
    public function cleanupOldViolations($days_to_keep = 30) {
        $violations = get_option($this->violation_storage_key, []);
        $cutoff_time = strtotime("-{$days_to_keep} days");
        
        $filtered_violations = array_filter($violations, function($v) use ($cutoff_time) {
            return strtotime($v['timestamp']) > $cutoff_time;
        });
        
        update_option($this->violation_storage_key, array_values($filtered_violations));
        
        return count($violations) - count($filtered_violations);
    }
    
    /**
     * Get current session violations
     * 
     * @return array Current session violations
     */
    public function getSessionViolations() {
        return $this->security_violations;
    }
    
    /**
     * Generate security nonce for frontend
     * 
     * @return string Generated nonce
     */
    public static function generateNonce() {
        return wp_create_nonce(self::NONCE_ACTION);
    }
    
    /**
     * Get nonce action name for frontend
     * 
     * @return string Nonce action name
     */
    public static function getNonceAction() {
        return self::NONCE_ACTION;
    }
}

