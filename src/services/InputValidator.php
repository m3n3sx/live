<?php
/**
 * Input Validator - Comprehensive Input Validation and Sanitization
 * 
 * Provides centralized, recursive input validation and sanitization for all
 * AJAX endpoints with WordPress-specific sanitization functions and validation rules.
 * 
 * @package ModernAdminStyler
 * @version 2.4.0 - Security Overhaul
 */

namespace ModernAdminStyler\Services;

class InputValidator {
    
    // Validation rules for different data types
    private $validation_rules = [
        'email' => 'email',
        'url' => 'url', 
        'color' => 'hex_color',
        'number' => 'numeric',
        'integer' => 'integer',
        'boolean' => 'boolean',
        'text' => 'text_field',
        'textarea' => 'textarea_field',
        'html' => 'post_content',
        'json' => 'json',
        'array' => 'array',
        'slug' => 'slug',
        'key' => 'key'
    ];
    
    // Field-specific validation rules
    private $field_rules = [];
    
    // Error logger instance
    private $error_logger;
    
    /**
     * Constructor
     * 
     * @param ErrorLogger $error_logger Error logger instance
     */
    public function __construct($error_logger = null) {
        $this->error_logger = $error_logger;
        $this->initializeFieldRules();
    }
    
    /**
     * Initialize field-specific validation rules
     */
    private function initializeFieldRules() {
        $this->field_rules = [
            // Settings fields
            'option_id' => ['type' => 'key', 'required' => true, 'max_length' => 100],
            'option_value' => ['type' => 'text', 'required' => false, 'max_length' => 1000],
            'settings' => ['type' => 'json', 'required' => false],
            'data' => ['type' => 'json', 'required' => false],
            
            // Live edit fields
            'live_setting_key' => ['type' => 'key', 'required' => true, 'max_length' => 100],
            'live_setting_value' => ['type' => 'text', 'required' => false, 'max_length' => 500],
            
            // Color fields
            'color' => ['type' => 'color', 'required' => false],
            'background_color' => ['type' => 'color', 'required' => false],
            'text_color' => ['type' => 'color', 'required' => false],
            
            // Numeric fields
            'width' => ['type' => 'number', 'required' => false, 'min' => 0, 'max' => 9999],
            'height' => ['type' => 'number', 'required' => false, 'min' => 0, 'max' => 9999],
            'font_size' => ['type' => 'number', 'required' => false, 'min' => 8, 'max' => 72],
            'opacity' => ['type' => 'number', 'required' => false, 'min' => 0, 'max' => 1],
            
            // Boolean fields
            'enabled' => ['type' => 'boolean', 'required' => false],
            'active' => ['type' => 'boolean', 'required' => false],
            'visible' => ['type' => 'boolean', 'required' => false],
            
            // Security fields
            'nonce' => ['type' => 'key', 'required' => true, 'max_length' => 20],
            '_wpnonce' => ['type' => 'key', 'required' => true, 'max_length' => 20],
            
            // Error logging fields
            'error_data' => ['type' => 'json', 'required' => true],
            'error_message' => ['type' => 'text', 'required' => true, 'max_length' => 1000],
            'error_type' => ['type' => 'text', 'required' => false, 'max_length' => 50],
            
            // Import/Export fields
            'export_type' => ['type' => 'key', 'required' => false, 'allowed_values' => ['settings', 'presets', 'all']],
            'import_type' => ['type' => 'key', 'required' => false, 'allowed_values' => ['settings', 'presets', 'functional']],
            
            // Cache fields
            'cache_type' => ['type' => 'key', 'required' => false, 'allowed_values' => ['all', 'settings', 'css', 'transients']],
            
            // Diagnostic fields
            'scan_type' => ['type' => 'key', 'required' => false, 'allowed_values' => ['basic', 'comprehensive', 'security']],
            'test_type' => ['type' => 'key', 'required' => false, 'allowed_values' => ['database', 'options', 'cache', 'memory']]
        ];
    }
    
    /**
     * Validate and sanitize all POST data
     * 
     * @param array $data Raw POST data (default: $_POST)
     * @param array $expected_fields Expected field names and their rules
     * @return array Sanitized and validated data
     * @throws \InvalidArgumentException If validation fails
     */
    public function validateAndSanitize($data = null, $expected_fields = []) {
        if ($data === null) {
            $data = $_POST;
        }
        
        // Remove slashes added by WordPress
        $data = $this->removeSlashes($data);
        
        // Validate and sanitize recursively
        $sanitized_data = $this->processData($data, $expected_fields);
        
        // Log validation results
        $this->logValidationResults($data, $sanitized_data);
        
        return $sanitized_data;
    }
    
    /**
     * Remove slashes from data recursively
     * 
     * @param mixed $data Data to process
     * @return mixed Data with slashes removed
     */
    private function removeSlashes($data) {
        if (is_array($data)) {
            return array_map([$this, 'removeSlashes'], $data);
        }
        
        if (is_string($data)) {
            return wp_unslash($data);
        }
        
        return $data;
    }
    
    /**
     * Process and sanitize data recursively
     * 
     * @param mixed $data Data to process
     * @param array $expected_fields Expected field rules
     * @return mixed Processed data
     */
    private function processData($data, $expected_fields = []) {
        if (is_array($data)) {
            $processed = [];
            
            foreach ($data as $key => $value) {
                // Sanitize the key itself
                $clean_key = $this->sanitizeKey($key);
                
                // Get field rules
                $field_rules = $expected_fields[$key] ?? $this->field_rules[$key] ?? null;
                
                // Process the value
                $processed[$clean_key] = $this->processValue($value, $field_rules, $key);
            }
            
            return $processed;
        }
        
        return $this->sanitizeValue($data);
    }
    
    /**
     * Process individual value based on rules
     * 
     * @param mixed $value Value to process
     * @param array|null $rules Validation rules
     * @param string $field_name Field name for context
     * @return mixed Processed value
     */
    private function processValue($value, $rules, $field_name) {
        // Handle required fields
        if ($rules && isset($rules['required']) && $rules['required'] && empty($value)) {
            throw new \InvalidArgumentException("Required field '{$field_name}' is missing or empty");
        }
        
        // Handle allowed values
        if ($rules && isset($rules['allowed_values']) && !empty($value)) {
            if (!in_array($value, $rules['allowed_values'], true)) {
                throw new \InvalidArgumentException("Invalid value for field '{$field_name}'. Allowed: " . implode(', ', $rules['allowed_values']));
            }
        }
        
        // Handle max length
        if ($rules && isset($rules['max_length']) && is_string($value)) {
            if (strlen($value) > $rules['max_length']) {
                throw new \InvalidArgumentException("Field '{$field_name}' exceeds maximum length of {$rules['max_length']} characters");
            }
        }
        
        // Handle numeric ranges
        if ($rules && is_numeric($value)) {
            if (isset($rules['min']) && $value < $rules['min']) {
                throw new \InvalidArgumentException("Field '{$field_name}' is below minimum value of {$rules['min']}");
            }
            if (isset($rules['max']) && $value > $rules['max']) {
                throw new \InvalidArgumentException("Field '{$field_name}' exceeds maximum value of {$rules['max']}");
            }
        }
        
        // Sanitize based on type
        $type = $rules['type'] ?? 'text';
        return $this->sanitizeByType($value, $type, $field_name);
    }
    
    /**
     * Sanitize value by type
     * 
     * @param mixed $value Value to sanitize
     * @param string $type Data type
     * @param string $field_name Field name for context
     * @return mixed Sanitized value
     */
    private function sanitizeByType($value, $type, $field_name = '') {
        switch ($type) {
            case 'email':
                return sanitize_email($value);
                
            case 'url':
                return esc_url_raw($value);
                
            case 'hex_color':
            case 'color':
                $sanitized = sanitize_hex_color($value);
                return $sanitized !== null ? $sanitized : '';
                
            case 'numeric':
            case 'number':
                return is_numeric($value) ? floatval($value) : 0;
                
            case 'integer':
                return intval($value);
                
            case 'boolean':
                return $this->sanitizeBoolean($value);
                
            case 'textarea_field':
                return sanitize_textarea_field($value);
                
            case 'post_content':
                return wp_kses_post($value);
                
            case 'json':
                return $this->sanitizeJson($value, $field_name);
                
            case 'array':
                return is_array($value) ? $this->processData($value) : [];
                
            case 'slug':
                return sanitize_title($value);
                
            case 'key':
                return sanitize_key($value);
                
            case 'text_field':
            case 'text':
            default:
                return sanitize_text_field($value);
        }
    }
    
    /**
     * Sanitize key names
     * 
     * @param string $key Key to sanitize
     * @return string Sanitized key
     */
    private function sanitizeKey($key) {
        return sanitize_key($key);
    }
    
    /**
     * Sanitize generic value
     * 
     * @param mixed $value Value to sanitize
     * @return mixed Sanitized value
     */
    private function sanitizeValue($value) {
        if (is_string($value)) {
            return sanitize_text_field($value);
        }
        
        if (is_array($value)) {
            return $this->processData($value);
        }
        
        return $value;
    }
    
    /**
     * Sanitize boolean values
     * 
     * @param mixed $value Value to convert to boolean
     * @return bool Boolean value
     */
    private function sanitizeBoolean($value) {
        if (is_bool($value)) {
            return $value;
        }
        
        if (is_string($value)) {
            $value = strtolower(trim($value));
            return in_array($value, ['1', 'true', 'yes', 'on'], true);
        }
        
        return (bool) $value;
    }
    
    /**
     * Sanitize JSON data
     * 
     * @param mixed $value JSON string or array
     * @param string $field_name Field name for context
     * @return array Sanitized array data
     */
    private function sanitizeJson($value, $field_name = '') {
        if (is_array($value)) {
            return $this->processData($value);
        }
        
        if (is_string($value)) {
            $decoded = json_decode($value, true);
            
            if (json_last_error() !== JSON_ERROR_NONE) {
                throw new \InvalidArgumentException("Invalid JSON in field '{$field_name}': " . json_last_error_msg());
            }
            
            return is_array($decoded) ? $this->processData($decoded) : [];
        }
        
        return [];
    }
    
    /**
     * Validate specific field against rules
     * 
     * @param string $field_name Field name
     * @param mixed $value Field value
     * @param array $custom_rules Custom validation rules
     * @return mixed Validated and sanitized value
     */
    public function validateField($field_name, $value, $custom_rules = []) {
        $rules = $custom_rules ?: ($this->field_rules[$field_name] ?? ['type' => 'text']);
        return $this->processValue($value, $rules, $field_name);
    }
    
    /**
     * Add custom field validation rule
     * 
     * @param string $field_name Field name
     * @param array $rules Validation rules
     */
    public function addFieldRule($field_name, $rules) {
        $this->field_rules[$field_name] = $rules;
    }
    
    /**
     * Get validation rules for a field
     * 
     * @param string $field_name Field name
     * @return array|null Validation rules
     */
    public function getFieldRules($field_name) {
        return $this->field_rules[$field_name] ?? null;
    }
    
    /**
     * Log validation results
     * 
     * @param array $original_data Original data
     * @param array $sanitized_data Sanitized data
     */
    private function logValidationResults($original_data, $sanitized_data) {
        if (!$this->error_logger) {
            return;
        }
        
        // Log if any data was modified during sanitization
        $modifications = [];
        
        foreach ($original_data as $key => $value) {
            $sanitized_value = $sanitized_data[$key] ?? null;
            
            if ($value !== $sanitized_value) {
                $modifications[$key] = [
                    'original' => $value,
                    'sanitized' => $sanitized_value
                ];
            }
        }
        
        if (!empty($modifications)) {
            $this->error_logger->logSecurityEvent('Input sanitization modifications', [
                'modifications' => $modifications,
                'endpoint' => $_POST['action'] ?? 'unknown'
            ]);
        }
    }
    
    /**
     * Escape output data for safe display
     * 
     * @param mixed $data Data to escape
     * @param string $context Escape context (html, attr, js, url)
     * @return mixed Escaped data
     */
    public function escapeOutput($data, $context = 'html') {
        if (is_array($data)) {
            return array_map(function($value) use ($context) {
                return $this->escapeOutput($value, $context);
            }, $data);
        }
        
        if (!is_string($data)) {
            return $data;
        }
        
        switch ($context) {
            case 'attr':
                return esc_attr($data);
                
            case 'js':
                return esc_js($data);
                
            case 'url':
                return esc_url($data);
                
            case 'textarea':
                return esc_textarea($data);
                
            case 'html':
            default:
                return esc_html($data);
        }
    }
}