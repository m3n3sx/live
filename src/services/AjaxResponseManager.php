<?php
/**
 * AJAX Response Manager - Standardized Response Formatting
 * 
 * Provides unified response formatting for all AJAX endpoints using
 * WordPress best practices with wp_send_json() functions.
 * Includes backward compatibility and comprehensive response data.
 * 
 * @package ModernAdminStyler
 * @version 2.4.0 - Security Overhaul
 */

namespace ModernAdminStyler\Services;

class AjaxResponseManager {
    
    // Response format version for compatibility tracking
    const RESPONSE_VERSION = '2.4.0';
    
    // Standard response codes
    const CODE_SUCCESS = 'success';
    const CODE_ERROR = 'error';
    const CODE_VALIDATION_ERROR = 'validation_error';
    const CODE_SECURITY_ERROR = 'security_error';
    const CODE_RATE_LIMIT_ERROR = 'rate_limit_exceeded';
    const CODE_PERFORMANCE_ERROR = 'performance_error';
    const CODE_DATABASE_ERROR = 'database_error';
    
    // Track if response has been sent to prevent double responses
    private $response_sent = false;
    
    // Request start time for execution tracking
    private $request_start_time;
    
    // Response metadata
    private $metadata = [];
    
    public function __construct() {
        $this->request_start_time = defined('MAS_V2_REQUEST_START') ? MAS_V2_REQUEST_START : microtime(true);
    }
    
    /**
     * Send successful AJAX response
     * 
     * @param array|mixed $data Response data
     * @param string $message Success message
     * @param string $code Response code
     * @param array $metadata Additional metadata
     */
    public function success($data = [], $message = '', $code = self::CODE_SUCCESS, $metadata = []) {
        if ($this->response_sent) {
            error_log('MAS V2: Attempted to send response after response already sent');
            return;
        }
        
        $response = $this->formatResponse(true, $data, $message, $code, $metadata);
        
        // Set response sent flag before sending to prevent recursion
        $this->response_sent = true;
        
        // Use WordPress standard function
        wp_send_json_success($response);
    }
    
    /**
     * Send error AJAX response
     * 
     * @param string $message Error message
     * @param string $code Error code
     * @param array|mixed $data Additional error data
     * @param array $metadata Additional metadata
     */
    public function error($message, $code = self::CODE_ERROR, $data = [], $metadata = []) {
        if ($this->response_sent) {
            error_log('MAS V2: Attempted to send error response after response already sent');
            return;
        }
        
        $response = $this->formatResponse(false, $data, $message, $code, $metadata);
        
        // Set response sent flag before sending to prevent recursion
        $this->response_sent = true;
        
        // Use WordPress standard function
        wp_send_json_error($response);
    }
    
    /**
     * Send validation error response
     * 
     * @param string $message Validation error message
     * @param array $validation_errors Field-specific validation errors
     * @param array $metadata Additional metadata
     */
    public function validationError($message, $validation_errors = [], $metadata = []) {
        $data = [
            'validation_errors' => $validation_errors,
            'field_count' => count($validation_errors)
        ];
        
        $this->error($message, self::CODE_VALIDATION_ERROR, $data, $metadata);
    }
    
    /**
     * Send security error response
     * 
     * @param string $message Security error message
     * @param string $violation_type Type of security violation
     * @param array $metadata Additional metadata
     */
    public function securityError($message, $violation_type = 'generic', $metadata = []) {
        $data = [
            'violation_type' => $violation_type,
            'security_level' => 'high'
        ];
        
        $this->error($message, self::CODE_SECURITY_ERROR, $data, $metadata);
    }
    
    /**
     * Send rate limit error response
     * 
     * @param string $message Rate limit message
     * @param int $limit Rate limit value
     * @param int $window Rate limit window in seconds
     * @param array $metadata Additional metadata
     */
    public function rateLimitError($message, $limit = 0, $window = 60, $metadata = []) {
        $data = [
            'rate_limit' => $limit,
            'window_seconds' => $window,
            'retry_after' => $window
        ];
        
        $this->error($message, self::CODE_RATE_LIMIT_ERROR, $data, $metadata);
    }
    
    /**
     * Send performance error response
     * 
     * @param string $message Performance error message
     * @param float $execution_time Actual execution time
     * @param float $threshold Performance threshold
     * @param array $metadata Additional metadata
     */
    public function performanceError($message, $execution_time = 0, $threshold = 500, $metadata = []) {
        $data = [
            'execution_time_ms' => $execution_time,
            'threshold_ms' => $threshold,
            'performance_impact' => 'high'
        ];
        
        $this->error($message, self::CODE_PERFORMANCE_ERROR, $data, $metadata);
    }
    
    /**
     * Send database error response
     * 
     * @param string $message Database error message
     * @param string $operation Database operation that failed
     * @param array $metadata Additional metadata
     */
    public function databaseError($message, $operation = 'unknown', $metadata = []) {
        $data = [
            'database_operation' => $operation,
            'error_type' => 'database'
        ];
        
        $this->error($message, self::CODE_DATABASE_ERROR, $data, $metadata);
    }
    
    /**
     * Format standardized response structure
     * 
     * @param bool $success Success status
     * @param mixed $data Response data
     * @param string $message Response message
     * @param string $code Response code
     * @param array $metadata Additional metadata
     * @return array Formatted response
     */
    private function formatResponse($success, $data, $message, $code, $metadata = []) {
        $response = [
            // Core response data
            'success' => $success,
            'message' => $message,
            'code' => $code,
            'data' => $data,
            
            // Response metadata
            'meta' => array_merge([
                'timestamp' => current_time('mysql'),
                'timestamp_gmt' => current_time('mysql', true),
                'version' => self::RESPONSE_VERSION,
                'execution_time_ms' => $this->getExecutionTime(),
                'memory_usage' => memory_get_usage(true),
                'memory_peak' => memory_get_peak_usage(true),
                'request_id' => $this->generateRequestId()
            ], $this->metadata, $metadata),
            
            // Debug information (only in debug mode)
            'debug' => $this->getDebugInfo()
        ];
        
        // Remove debug info in production
        if (!defined('WP_DEBUG') || !WP_DEBUG) {
            unset($response['debug']);
        }
        
        return $response;
    }
    
    /**
     * Get request execution time in milliseconds
     * 
     * @return float Execution time in milliseconds
     */
    private function getExecutionTime() {
        return round((microtime(true) - $this->request_start_time) * 1000, 2);
    }
    
    /**
     * Generate unique request ID for tracking
     * 
     * @return string Unique request ID
     */
    private function generateRequestId() {
        return 'mas_' . uniqid() . '_' . substr(md5(microtime(true)), 0, 8);
    }
    
    /**
     * Get debug information (only in debug mode)
     * 
     * @return array Debug information
     */
    private function getDebugInfo() {
        if (!defined('WP_DEBUG') || !WP_DEBUG) {
            return null;
        }
        
        return [
            'php_version' => PHP_VERSION,
            'wordpress_version' => get_bloginfo('version'),
            'plugin_version' => defined('MAS_V2_VERSION') ? MAS_V2_VERSION : 'unknown',
            'user_id' => get_current_user_id(),
            'user_capability' => current_user_can('manage_options') ? 'admin' : 'limited',
            'request_method' => $_SERVER['REQUEST_METHOD'] ?? 'unknown',
            'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown',
            'ip_address' => $_SERVER['REMOTE_ADDR'] ?? 'unknown'
        ];
    }
    
    /**
     * Add metadata to response
     * 
     * @param string $key Metadata key
     * @param mixed $value Metadata value
     */
    public function addMetadata($key, $value) {
        $this->metadata[$key] = $value;
    }
    
    /**
     * Add multiple metadata items
     * 
     * @param array $metadata Metadata array
     */
    public function addMetadataArray($metadata) {
        $this->metadata = array_merge($this->metadata, $metadata);
    }
    
    /**
     * Check if response has been sent
     * 
     * @return bool True if response sent
     */
    public function isResponseSent() {
        return $this->response_sent;
    }
    
    /**
     * Legacy response format for backward compatibility
     * 
     * @param bool $success Success status
     * @param mixed $data Response data
     * @param string $message Response message
     * @deprecated Use success() or error() methods instead
     */
    public function legacyResponse($success, $data = [], $message = '') {
        error_log('MAS V2: Using deprecated legacyResponse method. Please update to use success() or error()');
        
        if ($success) {
            $this->success($data, $message, self::CODE_SUCCESS, ['legacy' => true]);
        } else {
            $this->error($message, self::CODE_ERROR, $data, ['legacy' => true]);
        }
    }
    
    /**
     * Send raw JSON response (for special cases)
     * 
     * @param array $response Raw response array
     * @param int $status_code HTTP status code
     */
    public function raw($response, $status_code = 200) {
        if ($this->response_sent) {
            error_log('MAS V2: Attempted to send raw response after response already sent');
            return;
        }
        
        $this->response_sent = true;
        
        // Set HTTP status code
        if ($status_code !== 200) {
            status_header($status_code);
        }
        
        // Set content type
        header('Content-Type: application/json; charset=utf-8');
        
        // Send response
        echo json_encode($response, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        
        // Terminate execution
        wp_die();
    }
    
    /**
     * Handle WordPress AJAX response compatibility
     * 
     * This method ensures compatibility with existing WordPress AJAX patterns
     * while providing enhanced response formatting.
     * 
     * @param mixed $response WordPress AJAX response
     * @return array Enhanced response
     */
    public function enhanceWordPressResponse($response) {
        // If it's already a properly formatted response, return as-is
        if (is_array($response) && isset($response['success'], $response['data'])) {
            return $response;
        }
        
        // Convert simple responses to enhanced format
        if (is_string($response)) {
            return $this->formatResponse(true, [], $response, self::CODE_SUCCESS);
        }
        
        if (is_array($response)) {
            return $this->formatResponse(true, $response, '', self::CODE_SUCCESS);
        }
        
        // Default enhancement
        return $this->formatResponse(true, $response, '', self::CODE_SUCCESS);
    }
    
    /**
     * Validate response data before sending
     * 
     * @param mixed $data Data to validate
     * @return bool True if valid
     */
    private function validateResponseData($data) {
        // Check for circular references
        try {
            json_encode($data);
            return true;
        } catch (Exception $e) {
            error_log('MAS V2: Response data validation failed: ' . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Sanitize response data for output
     * 
     * @param mixed $data Data to sanitize
     * @return mixed Sanitized data
     */
    private function sanitizeResponseData($data) {
        if (is_string($data)) {
            return sanitize_text_field($data);
        }
        
        if (is_array($data)) {
            return array_map([$this, 'sanitizeResponseData'], $data);
        }
        
        return $data;
    }
    
    /**
     * Get response statistics for monitoring
     * 
     * @return array Response statistics
     */
    public function getResponseStats() {
        return [
            'response_sent' => $this->response_sent,
            'execution_time_ms' => $this->getExecutionTime(),
            'memory_usage' => memory_get_usage(true),
            'memory_peak' => memory_get_peak_usage(true),
            'metadata_count' => count($this->metadata)
        ];
    }
}