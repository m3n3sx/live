<?php
/**
 * Error Logger - Comprehensive Error Handling System
 * 
 * Provides unified error logging, JavaScript error capture, database error handling,
 * security violation logging, and fallback error handling for the AJAX system.
 * 
 * @package ModernAdminStyler
 * @version 2.4.0 - Security Overhaul
 */

namespace ModernAdminStyler\Services;

class ErrorLogger {
    
    // Log file configuration
    private $log_file;
    private $max_log_size = 10485760; // 10MB
    private $max_log_files = 5; // Keep 5 rotated log files
    
    // Database storage configuration
    private $error_storage_key = 'mas_v2_ajax_errors';
    private $max_stored_errors = 50;
    
    // Error categorization
    const CATEGORY_AJAX = 'ajax';
    const CATEGORY_JAVASCRIPT = 'javascript';
    const CATEGORY_DATABASE = 'database';
    const CATEGORY_SECURITY = 'security';
    const CATEGORY_PERFORMANCE = 'performance';
    const CATEGORY_SYSTEM = 'system';
    
    // Error severity levels
    const SEVERITY_LOW = 'low';
    const SEVERITY_MEDIUM = 'medium';
    const SEVERITY_HIGH = 'high';
    const SEVERITY_CRITICAL = 'critical';
    
    public function __construct() {
        $this->initializeLogFile();
    }
    
    /**
     * Initialize log file path and ensure directory exists
     */
    private function initializeLogFile() {
        $upload_dir = wp_upload_dir();
        $log_dir = $upload_dir['basedir'] . '/mas-v2-logs';
        
        // Create log directory if it doesn't exist
        if (!file_exists($log_dir)) {
            wp_mkdir_p($log_dir);
            
            // Add .htaccess to protect log files
            $htaccess_content = "Order deny,allow\nDeny from all\n";
            file_put_contents($log_dir . '/.htaccess', $htaccess_content);
        }
        
        $this->log_file = $log_dir . '/ajax-errors.log';
    }
    
    /**
     * Log AJAX errors with comprehensive context
     * 
     * @param string $action AJAX action that failed
     * @param Exception $exception Exception object
     * @param array $request_data Request data (sanitized)
     * @param array $additional_context Additional context information
     */
    public function logAjaxError($action, $exception, $request_data = [], $additional_context = []) {
        $error_data = [
            'category' => self::CATEGORY_AJAX,
            'severity' => $this->determineSeverity($exception),
            'timestamp' => current_time('mysql'),
            'timestamp_gmt' => current_time('mysql', true),
            'action' => $action,
            'error_message' => $exception->getMessage(),
            'error_code' => $exception->getCode(),
            'error_type' => get_class($exception),
            'stack_trace' => $exception->getTraceAsString(),
            'file' => $exception->getFile(),
            'line' => $exception->getLine(),
            'user_context' => $this->getUserContext(),
            'system_context' => $this->getSystemContext(),
            'request_data' => $this->sanitizeForLogging($request_data),
            'additional_context' => $additional_context,
            'memory_usage' => memory_get_usage(true),
            'memory_peak' => memory_get_peak_usage(true),
            'error_id' => $this->generateErrorId()
        ];
        
        // Log to WordPress error log
        $this->logToWordPress($error_data);
        
        // Log to custom file with full context
        $this->writeToLogFile($error_data);
        
        // Store in database for error dashboard
        $this->storeErrorInDatabase($error_data);
        
        // Send email alert for critical errors
        if ($error_data['severity'] === self::SEVERITY_CRITICAL) {
            $this->sendErrorAlert($error_data);
        }
        
        return $error_data['error_id'];
    }
    
    /**
     * Log JavaScript errors reported from frontend
     * 
     * @param array $error_data JavaScript error data from frontend
     */
    public function logJavaScriptError($error_data) {
        $processed_error = [
            'category' => self::CATEGORY_JAVASCRIPT,
            'severity' => $this->determineJavaScriptSeverity($error_data),
            'timestamp' => current_time('mysql'),
            'timestamp_gmt' => current_time('mysql', true),
            'error_message' => $error_data['message'] ?? 'Unknown JavaScript error',
            'error_type' => $error_data['name'] ?? 'Error',
            'stack_trace' => $error_data['stack'] ?? '',
            'file' => $error_data['filename'] ?? $error_data['source'] ?? 'unknown',
            'line' => $error_data['lineno'] ?? $error_data['line'] ?? 0,
            'column' => $error_data['colno'] ?? $error_data['column'] ?? 0,
            'url' => $error_data['url'] ?? 'unknown',
            'user_agent' => $error_data['userAgent'] ?? $_SERVER['HTTP_USER_AGENT'] ?? 'unknown',
            'user_context' => $this->getUserContext(),
            'system_context' => $this->getSystemContext(),
            'browser_context' => [
                'viewport' => $error_data['viewport'] ?? null,
                'screen' => $error_data['screen'] ?? null,
                'timestamp_client' => $error_data['timestamp'] ?? null
            ],
            'error_id' => $this->generateErrorId()
        ];
        
        // Log to WordPress error log
        $this->logToWordPress($processed_error);
        
        // Log to custom file
        $this->writeToLogFile($processed_error);
        
        // Store in database
        $this->storeErrorInDatabase($processed_error);
        
        return $processed_error['error_id'];
    }
    
    /**
     * Log database errors with query context
     * 
     * @param string $operation Database operation that failed
     * @param string $error_message Database error message
     * @param string $query SQL query (sanitized)
     * @param array $additional_context Additional context
     */
    public function logDatabaseError($operation, $error_message, $query = '', $additional_context = []) {
        global $wpdb;
        
        $error_data = [
            'category' => self::CATEGORY_DATABASE,
            'severity' => self::SEVERITY_HIGH,
            'timestamp' => current_time('mysql'),
            'timestamp_gmt' => current_time('mysql', true),
            'operation' => $operation,
            'error_message' => $error_message,
            'query' => $this->sanitizeQuery($query),
            'last_error' => $wpdb->last_error ?? '',
            'last_query' => $this->sanitizeQuery($wpdb->last_query ?? ''),
            'user_context' => $this->getUserContext(),
            'system_context' => $this->getSystemContext(),
            'database_context' => [
                'charset' => $wpdb->charset ?? 'unknown',
                'collate' => $wpdb->collate ?? 'unknown',
                'db_version' => $wpdb->db_version() ?? 'unknown'
            ],
            'additional_context' => $additional_context,
            'error_id' => $this->generateErrorId()
        ];
        
        // Log to WordPress error log
        $this->logToWordPress($error_data);
        
        // Log to custom file
        $this->writeToLogFile($error_data);
        
        // Store in database
        $this->storeErrorInDatabase($error_data);
        
        // Send email alert for database errors
        $this->sendErrorAlert($error_data);
        
        return $error_data['error_id'];
    }
    
    /**
     * Log security violations with detailed context
     * 
     * @param string $violation_type Type of security violation
     * @param array $violation_context Violation context data
     */
    public function logSecurityViolation($violation_type, $violation_context = []) {
        $error_data = [
            'category' => self::CATEGORY_SECURITY,
            'severity' => $this->getSecuritySeverity($violation_type),
            'timestamp' => current_time('mysql'),
            'timestamp_gmt' => current_time('mysql', true),
            'violation_type' => $violation_type,
            'violation_context' => $violation_context,
            'user_context' => $this->getUserContext(),
            'system_context' => $this->getSystemContext(),
            'request_context' => [
                'method' => $_SERVER['REQUEST_METHOD'] ?? 'unknown',
                'uri' => $_SERVER['REQUEST_URI'] ?? 'unknown',
                'referer' => $_SERVER['HTTP_REFERER'] ?? 'none',
                'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown',
                'ip_address' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
                'forwarded_for' => $_SERVER['HTTP_X_FORWARDED_FOR'] ?? null
            ],
            'error_id' => $this->generateErrorId()
        ];
        
        // Log to WordPress error log
        $this->logToWordPress($error_data);
        
        // Log to custom file
        $this->writeToLogFile($error_data);
        
        // Store in database
        $this->storeErrorInDatabase($error_data);
        
        // Send immediate alert for critical security violations
        if ($error_data['severity'] === self::SEVERITY_CRITICAL) {
            $this->sendSecurityAlert($error_data);
        }
        
        return $error_data['error_id'];
    }
    
    /**
     * Log performance issues
     * 
     * @param string $operation Operation that was slow
     * @param float $execution_time Execution time in milliseconds
     * @param float $threshold Performance threshold
     * @param array $additional_context Additional context
     */
    public function logPerformanceIssue($operation, $execution_time, $threshold, $additional_context = []) {
        $error_data = [
            'category' => self::CATEGORY_PERFORMANCE,
            'severity' => $execution_time > ($threshold * 2) ? self::SEVERITY_HIGH : self::SEVERITY_MEDIUM,
            'timestamp' => current_time('mysql'),
            'timestamp_gmt' => current_time('mysql', true),
            'operation' => $operation,
            'execution_time_ms' => $execution_time,
            'threshold_ms' => $threshold,
            'performance_ratio' => round($execution_time / $threshold, 2),
            'user_context' => $this->getUserContext(),
            'system_context' => $this->getSystemContext(),
            'performance_context' => [
                'memory_usage' => memory_get_usage(true),
                'memory_peak' => memory_get_peak_usage(true),
                'memory_limit' => ini_get('memory_limit'),
                'time_limit' => ini_get('max_execution_time')
            ],
            'additional_context' => $additional_context,
            'error_id' => $this->generateErrorId()
        ];
        
        // Log to WordPress error log
        $this->logToWordPress($error_data);
        
        // Log to custom file
        $this->writeToLogFile($error_data);
        
        // Store in database
        $this->storeErrorInDatabase($error_data);
        
        return $error_data['error_id'];
    }
    
    /**
     * Log system errors (fallback error handling)
     * 
     * @param string $error_message Error message
     * @param array $context Error context
     */
    public function logSystemError($error_message, $context = []) {
        $error_data = [
            'category' => self::CATEGORY_SYSTEM,
            'severity' => self::SEVERITY_HIGH,
            'timestamp' => current_time('mysql'),
            'timestamp_gmt' => current_time('mysql', true),
            'error_message' => $error_message,
            'context' => $context,
            'user_context' => $this->getUserContext(),
            'system_context' => $this->getSystemContext(),
            'error_id' => $this->generateErrorId()
        ];
        
        // Log to WordPress error log
        $this->logToWordPress($error_data);
        
        // Try to log to custom file (may fail in system errors)
        try {
            $this->writeToLogFile($error_data);
        } catch (Exception $e) {
            // Fallback to WordPress error log only
            error_log('MAS V2: Failed to write to custom log file: ' . $e->getMessage());
        }
        
        // Try to store in database (may fail in system errors)
        try {
            $this->storeErrorInDatabase($error_data);
        } catch (Exception $e) {
            // Fallback to WordPress error log only
            error_log('MAS V2: Failed to store error in database: ' . $e->getMessage());
        }
        
        return $error_data['error_id'];
    }
    
    /**
     * Get user context information
     * 
     * @return array User context
     */
    private function getUserContext() {
        $user = wp_get_current_user();
        
        return [
            'user_id' => get_current_user_id(),
            'user_login' => $user->user_login ?? 'guest',
            'user_email' => $user->user_email ?? '',
            'user_roles' => $user->roles ?? [],
            'user_capabilities' => [
                'manage_options' => current_user_can('manage_options'),
                'edit_posts' => current_user_can('edit_posts'),
                'upload_files' => current_user_can('upload_files')
            ],
            'session_id' => session_id() ?: 'none'
        ];
    }
    
    /**
     * Get system context information
     * 
     * @return array System context
     */
    private function getSystemContext() {
        return [
            'php_version' => PHP_VERSION,
            'wordpress_version' => get_bloginfo('version'),
            'plugin_version' => defined('MAS_V2_VERSION') ? MAS_V2_VERSION : 'unknown',
            'theme' => get_template(),
            'is_multisite' => is_multisite(),
            'site_url' => site_url(),
            'admin_url' => admin_url(),
            'memory_limit' => ini_get('memory_limit'),
            'max_execution_time' => ini_get('max_execution_time'),
            'server_software' => $_SERVER['SERVER_SOFTWARE'] ?? 'unknown'
        ];
    }
    
    /**
     * Determine error severity based on exception type
     * 
     * @param Exception $exception Exception object
     * @return string Severity level
     */
    private function determineSeverity($exception) {
        $class_name = get_class($exception);
        
        $severity_map = [
            'SecurityException' => self::SEVERITY_HIGH,
            'RateLimitException' => self::SEVERITY_MEDIUM,
            'ValidationException' => self::SEVERITY_LOW,
            'PerformanceException' => self::SEVERITY_MEDIUM,
            'Error' => self::SEVERITY_CRITICAL,
            'ParseError' => self::SEVERITY_CRITICAL,
            'TypeError' => self::SEVERITY_HIGH,
            'ArgumentCountError' => self::SEVERITY_HIGH
        ];
        
        foreach ($severity_map as $type => $severity) {
            if (strpos($class_name, $type) !== false) {
                return $severity;
            }
        }
        
        return self::SEVERITY_MEDIUM;
    }
    
    /**
     * Determine JavaScript error severity
     * 
     * @param array $error_data JavaScript error data
     * @return string Severity level
     */
    private function determineJavaScriptSeverity($error_data) {
        $message = strtolower($error_data['message'] ?? '');
        
        // Critical errors
        if (strpos($message, 'script error') !== false ||
            strpos($message, 'network error') !== false ||
            strpos($message, 'out of memory') !== false) {
            return self::SEVERITY_CRITICAL;
        }
        
        // High severity errors
        if (strpos($message, 'uncaught') !== false ||
            strpos($message, 'reference') !== false ||
            strpos($message, 'type') !== false) {
            return self::SEVERITY_HIGH;
        }
        
        // Medium severity by default
        return self::SEVERITY_MEDIUM;
    }
    
    /**
     * Get security violation severity
     * 
     * @param string $violation_type Violation type
     * @return string Severity level
     */
    private function getSecuritySeverity($violation_type) {
        $severity_map = [
            'sql_injection_attempt' => self::SEVERITY_CRITICAL,
            'xss_attempt' => self::SEVERITY_CRITICAL,
            'file_inclusion_attempt' => self::SEVERITY_CRITICAL,
            'invalid_nonce' => self::SEVERITY_HIGH,
            'insufficient_capability' => self::SEVERITY_MEDIUM,
            'rate_limit_exceeded' => self::SEVERITY_MEDIUM,
            'invalid_referer' => self::SEVERITY_HIGH
        ];
        
        return $severity_map[$violation_type] ?? self::SEVERITY_MEDIUM;
    }
    
    /**
     * Sanitize data for logging (remove sensitive information)
     * 
     * @param mixed $data Data to sanitize
     * @return mixed Sanitized data
     */
    private function sanitizeForLogging($data) {
        if (!is_array($data)) {
            return $data;
        }
        
        $sensitive_keys = [
            'password', 'passwd', 'pwd', 'pass',
            'token', 'key', 'secret', 'auth',
            'nonce', 'csrf', 'session',
            'credit_card', 'cc_number', 'cvv',
            'ssn', 'social_security'
        ];
        
        foreach ($data as $key => $value) {
            $key_lower = strtolower($key);
            
            // Check if key contains sensitive information
            foreach ($sensitive_keys as $sensitive) {
                if (strpos($key_lower, $sensitive) !== false) {
                    $data[$key] = '[REDACTED]';
                    break;
                }
            }
            
            // Recursively sanitize arrays
            if (is_array($value)) {
                $data[$key] = $this->sanitizeForLogging($value);
            }
        }
        
        return $data;
    }
    
    /**
     * Sanitize SQL query for logging
     * 
     * @param string $query SQL query
     * @return string Sanitized query
     */
    private function sanitizeQuery($query) {
        if (empty($query)) {
            return '';
        }
        
        // Remove potential sensitive data from queries
        $query = preg_replace('/(\bPASSWORD\s*=\s*)[\'"][^\'"]*[\'"]/', '$1[REDACTED]', $query);
        $query = preg_replace('/(\bSET\s+\w*password\w*\s*=\s*)[\'"][^\'"]*[\'"]/', '$1[REDACTED]', $query);
        
        return $query;
    }
    
    /**
     * Generate unique error ID
     * 
     * @return string Unique error ID
     */
    private function generateErrorId() {
        return 'mas_err_' . uniqid() . '_' . substr(md5(microtime(true)), 0, 8);
    }
    
    /**
     * Log to WordPress error log
     * 
     * @param array $error_data Error data
     */
    private function logToWordPress($error_data) {
        $log_message = sprintf(
            'MAS V2 %s Error [%s]: %s | User: %d | IP: %s | ID: %s',
            strtoupper($error_data['category']),
            strtoupper($error_data['severity']),
            $error_data['error_message'] ?? $error_data['violation_type'] ?? 'Unknown error',
            $error_data['user_context']['user_id'] ?? 0,
            $error_data['request_context']['ip_address'] ?? $error_data['user_context']['ip_address'] ?? 'unknown',
            $error_data['error_id']
        );
        
        error_log($log_message);
    }
    
    /**
     * Write error to custom log file with rotation
     * 
     * @param array $error_data Error data
     */
    private function writeToLogFile($error_data) {
        // Rotate log file if too large
        if (file_exists($this->log_file) && filesize($this->log_file) > $this->max_log_size) {
            $this->rotateLogFile();
        }
        
        $log_entry = [
            'timestamp' => $error_data['timestamp'],
            'level' => strtoupper($error_data['severity']),
            'category' => strtoupper($error_data['category']),
            'id' => $error_data['error_id'],
            'data' => $error_data
        ];
        
        $log_line = json_encode($log_entry, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) . PHP_EOL;
        
        // Use file locking to prevent corruption
        file_put_contents($this->log_file, $log_line, FILE_APPEND | LOCK_EX);
    }
    
    /**
     * Rotate log files
     */
    private function rotateLogFile() {
        // Move existing log files
        for ($i = $this->max_log_files - 1; $i > 0; $i--) {
            $old_file = $this->log_file . '.' . $i;
            $new_file = $this->log_file . '.' . ($i + 1);
            
            if (file_exists($old_file)) {
                if ($i == $this->max_log_files - 1) {
                    unlink($old_file); // Delete oldest file
                } else {
                    rename($old_file, $new_file);
                }
            }
        }
        
        // Move current log file
        if (file_exists($this->log_file)) {
            rename($this->log_file, $this->log_file . '.1');
        }
    }
    
    /**
     * Store error in database for dashboard
     * 
     * @param array $error_data Error data
     */
    private function storeErrorInDatabase($error_data) {
        $errors = get_option($this->error_storage_key, []);
        
        // Add new error
        $errors[] = [
            'id' => $error_data['error_id'],
            'category' => $error_data['category'],
            'severity' => $error_data['severity'],
            'timestamp' => $error_data['timestamp'],
            'message' => $error_data['error_message'] ?? $error_data['violation_type'] ?? 'System error',
            'user_id' => $error_data['user_context']['user_id'] ?? 0,
            'context_summary' => $this->createContextSummary($error_data)
        ];
        
        // Keep only the most recent errors
        if (count($errors) > $this->max_stored_errors) {
            $errors = array_slice($errors, -$this->max_stored_errors);
        }
        
        update_option($this->error_storage_key, $errors);
    }
    
    /**
     * Create context summary for database storage
     * 
     * @param array $error_data Full error data
     * @return array Context summary
     */
    private function createContextSummary($error_data) {
        return [
            'action' => $error_data['action'] ?? null,
            'operation' => $error_data['operation'] ?? null,
            'violation_type' => $error_data['violation_type'] ?? null,
            'file' => $error_data['file'] ?? null,
            'line' => $error_data['line'] ?? null,
            'ip_address' => $error_data['request_context']['ip_address'] ?? $error_data['user_context']['ip_address'] ?? null
        ];
    }
    
    /**
     * Send error alert email
     * 
     * @param array $error_data Error data
     */
    private function sendErrorAlert($error_data) {
        $admin_email = get_option('admin_email');
        if (!$admin_email) {
            return;
        }
        
        $subject = sprintf(
            '[%s] %s Error Alert - %s',
            get_bloginfo('name'),
            ucfirst($error_data['category']),
            $error_data['severity']
        );
        
        $message = $this->formatErrorAlertMessage($error_data);
        
        wp_mail($admin_email, $subject, $message);
    }
    
    /**
     * Send security alert email
     * 
     * @param array $error_data Security violation data
     */
    private function sendSecurityAlert($error_data) {
        $admin_email = get_option('admin_email');
        if (!$admin_email) {
            return;
        }
        
        $subject = sprintf(
            '[%s] CRITICAL Security Alert - %s',
            get_bloginfo('name'),
            $error_data['violation_type']
        );
        
        $message = $this->formatSecurityAlertMessage($error_data);
        
        wp_mail($admin_email, $subject, $message);
    }
    
    /**
     * Format error alert message
     * 
     * @param array $error_data Error data
     * @return string Formatted message
     */
    private function formatErrorAlertMessage($error_data) {
        return sprintf(
            "%s error detected on your WordPress site:\n\n" .
            "Error ID: %s\n" .
            "Category: %s\n" .
            "Severity: %s\n" .
            "Timestamp: %s\n" .
            "Message: %s\n" .
            "User: %s (ID: %d)\n" .
            "IP Address: %s\n" .
            "File: %s\n" .
            "Line: %s\n\n" .
            "Please check your error logs for more details.\n\n" .
            "This is an automated alert from WOOW! Admin Styler plugin.",
            ucfirst($error_data['category']),
            $error_data['error_id'],
            $error_data['category'],
            $error_data['severity'],
            $error_data['timestamp'],
            $error_data['error_message'] ?? 'Unknown error',
            $error_data['user_context']['user_login'] ?? 'guest',
            $error_data['user_context']['user_id'] ?? 0,
            $error_data['request_context']['ip_address'] ?? $error_data['user_context']['ip_address'] ?? 'unknown',
            $error_data['file'] ?? 'unknown',
            $error_data['line'] ?? 'unknown'
        );
    }
    
    /**
     * Format security alert message
     * 
     * @param array $error_data Security violation data
     * @return string Formatted message
     */
    private function formatSecurityAlertMessage($error_data) {
        return sprintf(
            "CRITICAL security violation detected on your WordPress site:\n\n" .
            "Violation Type: %s\n" .
            "Severity: %s\n" .
            "Timestamp: %s\n" .
            "User: %s (ID: %d)\n" .
            "IP Address: %s\n" .
            "User Agent: %s\n" .
            "Request URI: %s\n" .
            "Referer: %s\n\n" .
            "Immediate action may be required to secure your site.\n" .
            "Please review your security logs and consider additional security measures.\n\n" .
            "This is an automated security alert from WOOW! Admin Styler plugin.",
            $error_data['violation_type'],
            $error_data['severity'],
            $error_data['timestamp'],
            $error_data['user_context']['user_login'] ?? 'guest',
            $error_data['user_context']['user_id'] ?? 0,
            $error_data['request_context']['ip_address'] ?? 'unknown',
            $error_data['request_context']['user_agent'] ?? 'unknown',
            $error_data['request_context']['uri'] ?? 'unknown',
            $error_data['request_context']['referer'] ?? 'none'
        );
    }
    
    /**
     * Get error statistics for dashboard
     * 
     * @return array Error statistics
     */
    public function getErrorStats() {
        $errors = get_option($this->error_storage_key, []);
        
        if (empty($errors)) {
            return [
                'total_errors' => 0,
                'recent_errors' => 0,
                'error_categories' => [],
                'severity_breakdown' => [],
                'error_rate' => 0
            ];
        }
        
        // Calculate recent errors (last 24 hours)
        $recent_threshold = strtotime('-24 hours');
        $recent_errors = array_filter($errors, function($e) use ($recent_threshold) {
            return strtotime($e['timestamp']) > $recent_threshold;
        });
        
        // Count by category
        $categories = [];
        foreach ($errors as $error) {
            $cat = $error['category'];
            $categories[$cat] = ($categories[$cat] ?? 0) + 1;
        }
        
        // Count by severity
        $severities = [];
        foreach ($errors as $error) {
            $sev = $error['severity'];
            $severities[$sev] = ($severities[$sev] ?? 0) + 1;
        }
        
        // Calculate error rate (errors per hour in last 24h)
        $error_rate = count($recent_errors) / 24;
        
        return [
            'total_errors' => count($errors),
            'recent_errors' => count($recent_errors),
            'error_categories' => $categories,
            'severity_breakdown' => $severities,
            'error_rate' => round($error_rate, 2),
            'last_error' => end($errors)['timestamp'] ?? null
        ];
    }
    
    /**
     * Clean up old errors (maintenance)
     * 
     * @param int $days_to_keep Number of days to keep errors
     * @return int Number of errors cleaned up
     */
    public function cleanupOldErrors($days_to_keep = 30) {
        $errors = get_option($this->error_storage_key, []);
        $cutoff_time = strtotime("-{$days_to_keep} days");
        
        $filtered_errors = array_filter($errors, function($e) use ($cutoff_time) {
            return strtotime($e['timestamp']) > $cutoff_time;
        });
        
        update_option($this->error_storage_key, array_values($filtered_errors));
        
        return count($errors) - count($filtered_errors);
    }
}