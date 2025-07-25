<?php
/**
 * Security Exception Classes for AJAX Security Manager
 * 
 * Defines specific exception types for different security violations
 * to enable proper error handling and logging categorization.
 * 
 * @package ModernAdminStyler
 * @version 2.4.0 - Security Overhaul
 */

namespace ModernAdminStyler\Services;

/**
 * Base AJAX Exception
 */
class MasAjaxException extends \Exception {
    protected $error_code;
    protected $context;
    
    public function __construct($message, $error_code = 'ajax_error', $context = [], $code = 0, \Throwable $previous = null) {
        parent::__construct($message, $code, $previous);
        $this->error_code = $error_code;
        $this->context = $context;
    }
    
    public function getErrorCode() {
        return $this->error_code;
    }
    
    public function getContext() {
        return $this->context;
    }
}

/**
 * Security Exception - Base for all security-related errors
 */
class SecurityException extends MasAjaxException {
    private $violation_type;
    
    public function __construct($message, $violation_type = 'generic_security_error', $context = [], $code = 0, \Throwable $previous = null) {
        parent::__construct($message, 'security_error', $context, $code, $previous);
        $this->violation_type = $violation_type;
    }
    
    public function getViolationType() {
        return $this->violation_type;
    }
}

/**
 * Rate Limit Exception - When rate limits are exceeded
 */
class RateLimitException extends SecurityException {
    private $limit;
    private $window;
    private $current_count;
    
    public function __construct($message, $limit, $window, $current_count, $context = []) {
        parent::__construct($message, 'rate_limit_exceeded', $context);
        $this->limit = $limit;
        $this->window = $window;
        $this->current_count = $current_count;
    }
    
    public function getLimit() {
        return $this->limit;
    }
    
    public function getWindow() {
        return $this->window;
    }
    
    public function getCurrentCount() {
        return $this->current_count;
    }
}

/**
 * Validation Exception - Input validation failures
 */
class ValidationException extends MasAjaxException {
    private $field;
    private $validation_rule;
    
    public function __construct($message, $field = null, $validation_rule = null, $context = []) {
        parent::__construct($message, 'validation_error', $context);
        $this->field = $field;
        $this->validation_rule = $validation_rule;
    }
    
    public function getField() {
        return $this->field;
    }
    
    public function getValidationRule() {
        return $this->validation_rule;
    }
}

/**
 * Performance Exception - When requests take too long
 */
class PerformanceException extends MasAjaxException {
    private $execution_time;
    private $threshold;
    
    public function __construct($message, $execution_time, $threshold, $context = []) {
        parent::__construct($message, 'performance_error', $context);
        $this->execution_time = $execution_time;
        $this->threshold = $threshold;
    }
    
    public function getExecutionTime() {
        return $this->execution_time;
    }
    
    public function getThreshold() {
        return $this->threshold;
    }
}