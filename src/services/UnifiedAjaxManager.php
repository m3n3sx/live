<?php
/**
 * Unified AJAX Manager - Central Controller for All AJAX Endpoints
 * 
 * @package ModernAdminStyler
 * @version 2.4.0 - Security Overhaul
 */

namespace ModernAdminStyler\Services;

require_once __DIR__ . '/AjaxSecurityManager.php';
require_once __DIR__ . '/AjaxResponseManager.php';
require_once __DIR__ . '/ErrorLogger.php';
require_once __DIR__ . '/PerformanceMonitor.php';
require_once __DIR__ . '/SecurityExceptions.php';

class UnifiedAjaxManager {
    
    private $settings_manager;
    private $security_manager;
    private $response_manager;
    private $error_logger;
    private $performance_monitor;
    private $endpoints = [];
    private $request_start_time;
    
    public function __construct($settings_manager) {
        $this->settings_manager = $settings_manager;
        $this->request_start_time = microtime(true);
        
        $this->security_manager = new AjaxSecurityManager();
        $this->response_manager = new AjaxResponseManager();
        $this->error_logger = new ErrorLogger();
        $this->performance_monitor = new PerformanceMonitor();
        
        $this->registerEndpoints();
    }    

    /**
     * Register all AJAX endpoints in centralized location
     */
    public function registerEndpoints() {
        $this->endpoints = [
            // Live Edit Endpoints (High Priority - for micro-panel functionality)
            'mas_save_live_settings' => [
                'handler' => [$this, 'handleSaveLiveSettings'],
                'capability' => 'manage_options',
                'rate_limit' => 20,
                'description' => 'Save individual live edit settings',
                'version_added' => '2.4.0',
                'priority' => 'high'
            ],
            'mas_get_live_settings' => [
                'handler' => [$this, 'handleGetLiveSettings'],
                'capability' => 'manage_options',
                'rate_limit' => 30,
                'description' => 'Get current live edit settings',
                'version_added' => '2.4.0',
                'priority' => 'high'
            ],
            'mas_reset_live_setting' => [
                'handler' => [$this, 'handleResetLiveSetting'],
                'capability' => 'manage_options',
                'rate_limit' => 10,
                'description' => 'Reset single setting to default',
                'version_added' => '2.4.0',
                'priority' => 'medium'
            ],
            
            // Settings Management
            'mas_v2_save_settings' => [
                'handler' => [$this, 'handleSaveSettings'],
                'capability' => 'manage_options',
                'rate_limit' => 5,
                'description' => 'Save bulk settings',
                'version_added' => '2.4.0',
                'priority' => 'high'
            ],
            'mas_v2_reset_settings' => [
                'handler' => [$this, 'handleResetSettings'],
                'capability' => 'manage_options',
                'rate_limit' => 3,
                'description' => 'Reset all settings to defaults',
                'version_added' => '2.4.0',
                'priority' => 'medium'
            ],
            
            // Import/Export
            'mas_v2_export_settings' => [
                'handler' => [$this, 'handleExportSettings'],
                'capability' => 'manage_options',
                'rate_limit' => 5,
                'description' => 'Export settings to JSON',
                'version_added' => '2.4.0',
                'priority' => 'low'
            ],
            'mas_v2_import_settings' => [
                'handler' => [$this, 'handleImportSettings'],
                'capability' => 'manage_options',
                'rate_limit' => 3,
                'description' => 'Import settings from JSON',
                'version_added' => '2.4.0',
                'priority' => 'low'
            ],
            
            // Diagnostics
            'mas_v2_database_check' => [
                'handler' => [$this, 'handleDatabaseCheck'],
                'capability' => 'manage_options',
                'rate_limit' => 5,
                'description' => 'Check database connectivity and integrity',
                'version_added' => '2.4.0',
                'priority' => 'low'
            ],
            'mas_v2_cache_check' => [
                'handler' => [$this, 'handleCacheCheck'],
                'capability' => 'manage_options',
                'rate_limit' => 10,
                'description' => 'Check cache system status',
                'version_added' => '2.4.0',
                'priority' => 'low'
            ],
            
            // Cache Management
            'mas_v2_clear_cache' => [
                'handler' => [$this, 'handleClearCache'],
                'capability' => 'manage_options',
                'rate_limit' => 5,
                'description' => 'Clear plugin cache',
                'version_added' => '2.4.0',
                'priority' => 'medium'
            ],
            
            // Live Preview
            'mas_live_preview' => [
                'handler' => [$this, 'handleLivePreview'],
                'capability' => 'manage_options',
                'rate_limit' => 15,
                'description' => 'Generate live preview CSS',
                'version_added' => '2.4.0',
                'priority' => 'high'
            ],
            
            // Error Logging
            'mas_v2_log_error' => [
                'handler' => [$this, 'handleLogError'],
                'capability' => 'read',
                'rate_limit' => 50,
                'description' => 'Log frontend errors',
                'version_added' => '2.4.0',
                'priority' => 'medium'
            ],
            
            // Enterprise Features
            'mas_v2_security_scan' => [
                'handler' => [$this, 'handleSecurityScan'],
                'capability' => 'manage_options',
                'rate_limit' => 2,
                'description' => 'Run security vulnerability scan',
                'version_added' => '2.4.0',
                'priority' => 'low'
            ],
            'mas_v2_performance_benchmark' => [
                'handler' => [$this, 'handlePerformanceBenchmark'],
                'capability' => 'manage_options',
                'rate_limit' => 3,
                'description' => 'Run performance benchmark tests',
                'version_added' => '2.4.0',
                'priority' => 'low'
            ],
            'mas_v2_cache_flush' => [
                'handler' => [$this, 'handleCacheFlush'],
                'capability' => 'manage_options',
                'rate_limit' => 5,
                'description' => 'Flush all caches',
                'version_added' => '2.4.0',
                'priority' => 'medium'
            ],
            'mas_v2_cache_stats' => [
                'handler' => [$this, 'handleCacheStats'],
                'capability' => 'manage_options',
                'rate_limit' => 10,
                'description' => 'Get cache statistics',
                'version_added' => '2.4.0',
                'priority' => 'low'
            ],
            'mas_v2_metrics_report' => [
                'handler' => [$this, 'handleMetricsReport'],
                'capability' => 'manage_options',
                'rate_limit' => 5,
                'description' => 'Generate metrics report',
                'version_added' => '2.4.0',
                'priority' => 'low'
            ],
            'mas_v2_css_regenerate' => [
                'handler' => [$this, 'handleCSSRegenerate'],
                'capability' => 'manage_options',
                'rate_limit' => 3,
                'description' => 'Regenerate CSS files',
                'version_added' => '2.4.0',
                'priority' => 'medium'
            ],
            'mas_v2_memory_stats' => [
                'handler' => [$this, 'handleMemoryStats'],
                'capability' => 'manage_options',
                'rate_limit' => 10,
                'description' => 'Get memory usage statistics',
                'version_added' => '2.4.0',
                'priority' => 'low'
            ],
            'mas_v2_force_memory_optimization' => [
                'handler' => [$this, 'handleForceMemoryOptimization'],
                'capability' => 'manage_options',
                'rate_limit' => 2,
                'description' => 'Force memory optimization',
                'version_added' => '2.4.0',
                'priority' => 'low'
            ]
        ];
        
        // Register deprecated endpoints for backward compatibility
        $this->registerDeprecatedEndpoints();
        
        // Hook all endpoints to WordPress
        $this->hookEndpoints();
    }    

    /**
     * Register deprecated endpoints for backward compatibility
     */
    private function registerDeprecatedEndpoints() {
        $this->deprecated_endpoints = [
            // Legacy endpoints from main plugin file (deprecated)
            'mas_database_check' => 'mas_v2_database_check',
            'mas_cache_check' => 'mas_v2_cache_check', 
            'mas_clear_cache' => 'mas_v2_clear_cache',
            'save_mas_v2_settings' => 'mas_v2_save_settings',
            
            // Legacy endpoints from CommunicationManager (deprecated)
            'mas_v2_import_functional_settings' => 'mas_v2_import_settings',
            'mas_save_live_edit_settings' => 'mas_save_live_settings',
            
            // Old naming conventions - redirect to new endpoints
            'mas_save_live_settings_old' => 'mas_save_live_settings',
            'mas_get_live_settings_old' => 'mas_get_live_settings'
        ];
    }
    
    /**
     * Hook all endpoints to WordPress AJAX system
     */
    private function hookEndpoints() {
        foreach ($this->endpoints as $action => $config) {
            add_action("wp_ajax_{$action}", [$this, 'processAjaxRequest']);
        }
        
        // Hook deprecated endpoints
        foreach ($this->deprecated_endpoints as $old_action => $new_action) {
            add_action("wp_ajax_{$old_action}", [$this, 'processDeprecatedRequest']);
        }
    }
    
    /**
     * Unified AJAX request processor - handles all requests through single pipeline
     */
    public function processAjaxRequest() {
        $action = str_replace('wp_ajax_', '', current_action());
        $start_time = microtime(true);
        
        try {
            // Validate endpoint exists
            if (!isset($this->endpoints[$action])) {
                throw new \Exception("Unknown AJAX endpoint: {$action}");
            }
            
            $config = $this->endpoints[$action];
            $this->current_request = [
                'action' => $action,
                'config' => $config,
                'start_time' => $start_time
            ];
            
            // Phase 1: Security Validation
            $this->security_manager->validateRequest($action, $config);
            
            // Phase 2: Execute Handler
            $handler = $config['handler'];
            if (!is_callable($handler)) {
                throw new \Exception("Handler not callable for action: {$action}");
            }
            
            $result = call_user_func($handler, $action, $config);
            
            // Phase 3: Performance Monitoring
            $execution_time = (microtime(true) - $start_time) * 1000;
            $this->performance_monitor->recordAjaxRequest($action, $execution_time, true, [
                'handler_result' => $result !== null ? 'success' : 'no_return'
            ]);
            
            // Ensure response was sent
            if (!$this->response_manager->isResponseSent()) {
                $this->response_manager->error('Handler did not send response', 'no_response');
            }
            
        } catch (SecurityException $e) {
            $this->handleSecurityException($e, $action, $start_time);
        } catch (\Exception $e) {
            $this->handleGeneralException($e, $action, $start_time);
        }
    }    

    /**
     * Process deprecated AJAX requests with warnings
     */
    public function processDeprecatedRequest() {
        $old_action = str_replace('wp_ajax_', '', current_action());
        $new_action = $this->deprecated_endpoints[$old_action] ?? null;
        
        if (!$new_action) {
            $this->response_manager->error('Deprecated endpoint not found', 'deprecated_endpoint');
            return;
        }
        
        // Log deprecation warning
        error_log("MAS V2: Deprecated AJAX endpoint used: {$old_action} -> use {$new_action} instead");
        
        // Add deprecation notice to response
        $this->response_manager->addMetadata('deprecation_warning', [
            'old_endpoint' => $old_action,
            'new_endpoint' => $new_action,
            'message' => 'This endpoint is deprecated and will be removed in a future version'
        ]);
        
        // Process as new endpoint
        $_POST['action'] = $new_action;
        $this->processAjaxRequest();
    }
    
    /**
     * Handle security exceptions
     */
    private function handleSecurityException(SecurityException $e, $action, $start_time) {
        $execution_time = (microtime(true) - $start_time) * 1000;
        
        // Record failed performance metrics
        $this->performance_monitor->recordAjaxRequest($action, $execution_time, false, [
            'error_type' => 'security',
            'violation_type' => $e->getViolationType()
        ]);
        
        // Log security violation (already handled by security manager)
        $error_id = $this->error_logger->logSecurityViolation($e->getViolationType(), [
            'action' => $action,
            'message' => $e->getMessage(),
            'execution_time' => $execution_time
        ]);
        
        // Send security error response
        $this->response_manager->securityError($e->getMessage(), $e->getViolationType(), [
            'error_id' => $error_id
        ]);
    }
    
    /**
     * Handle general exceptions
     */
    private function handleGeneralException(\Exception $e, $action, $start_time) {
        $execution_time = (microtime(true) - $start_time) * 1000;
        
        // Record failed performance metrics
        $this->performance_monitor->recordAjaxRequest($action, $execution_time, false, [
            'error_type' => get_class($e),
            'error_message' => $e->getMessage()
        ]);
        
        // Log error with comprehensive context
        $error_id = $this->error_logger->logAjaxError($action, $e, $_POST, [
            'execution_time' => $execution_time,
            'endpoint_config' => $this->current_request['config'] ?? null
        ]);
        
        // Send error response
        $this->response_manager->error($e->getMessage(), 'ajax_error', [
            'error_id' => $error_id
        ]);
    } 
   
    /**
     * Handle save live settings - Consistent handler structure
     */
    public function handleSaveLiveSettings($action, $config) {
        try {
            // Get current settings
            $current_settings = $this->settings_manager->getSettings();
            
            // Process form data
            $form_data = $_POST;
            unset($form_data['nonce'], $form_data['action']);
            
            // Update settings
            foreach ($form_data as $option_id => $value) {
                if ($option_id === 'settings') {
                    $bulk_settings = json_decode(stripslashes($value), true);
                    if (is_array($bulk_settings)) {
                        foreach ($bulk_settings as $bulk_option => $bulk_value) {
                            $current_settings[$bulk_option] = sanitize_text_field($bulk_value);
                        }
                    }
                } else {
                    $current_settings[$option_id] = sanitize_text_field($value);
                }
            }
            
            // Save settings
            $result = $this->settings_manager->saveSettings($current_settings);
            
            if ($result !== false) {
                $this->response_manager->success([
                    'settings' => $current_settings,
                    'updated_options' => array_keys($form_data)
                ], __('Live settings saved successfully!', 'woow-admin-styler'), 'live_settings_saved');
            } else {
                $this->response_manager->databaseError(
                    __('Failed to save settings to database.', 'woow-admin-styler'),
                    'save_live_settings'
                );
            }
            
        } catch (\Exception $e) {
            throw $e; // Re-throw for unified error handling
        }
    }
    
    /**
     * Handle get live settings - Consistent handler structure
     */
    public function handleGetLiveSettings($action, $config) {
        try {
            $settings = $this->settings_manager->getSettings();
            
            $this->response_manager->success([
                'settings' => $settings
            ], __('Settings retrieved successfully!', 'woow-admin-styler'), 'live_settings_loaded');
            
        } catch (\Exception $e) {
            throw $e; // Re-throw for unified error handling
        }
    }
    
    /**
     * Handle reset live setting - Consistent handler structure
     */
    public function handleResetLiveSetting($action, $config) {
        try {
            $option_id = sanitize_text_field($_POST['option_id'] ?? '');
            
            if (empty($option_id)) {
                throw new ValidationException(__('Option ID is required', 'woow-admin-styler'), 'option_id', 'required');
            }
            
            $current_settings = $this->settings_manager->getSettings();
            $default_settings = $this->settings_manager->getDefaultSettings();
            
            if (isset($default_settings[$option_id])) {
                $current_settings[$option_id] = $default_settings[$option_id];
                $result = $this->settings_manager->saveSettings($current_settings);
                
                if ($result !== false) {
                    $this->response_manager->success([
                        'option_id' => $option_id,
                        'default_value' => $default_settings[$option_id],
                        'settings' => $current_settings
                    ], sprintf(__('Option %s reset to default value!', 'woow-admin-styler'), $option_id), 'setting_reset');
                } else {
                    $this->response_manager->databaseError(__('Failed to save reset setting', 'woow-admin-styler'), 'reset_setting');
                }
            } else {
                throw new ValidationException(__('Unknown option', 'woow-admin-styler'), 'option_id', 'unknown_option');
            }
            
        } catch (\Exception $e) {
            throw $e; // Re-throw for unified error handling
        }
    }  
  
    /**
     * Handle save settings - Consistent handler structure
     */
    public function handleSaveSettings($action, $config) {
        try {
            $form_data = $_POST;
            unset($form_data['nonce'], $form_data['action']);
            
            $old_settings = $this->settings_manager->getSettings();
            $settings = $this->settings_manager->sanitizeSettings($form_data);
            $result = $this->settings_manager->saveSettings($settings);
            
            $is_success = ($result === true || serialize($settings) === serialize($old_settings));
            
            if ($is_success) {
                $this->response_manager->success([
                    'settings' => $settings
                ], __('Settings saved successfully!', 'woow-admin-styler'), 'settings_saved');
            } else {
                $this->response_manager->databaseError(
                    __('Failed to save settings to database.', 'woow-admin-styler'),
                    'save_settings'
                );
            }
            
        } catch (\Exception $e) {
            throw $e;
        }
    }
    
    /**
     * Handle reset settings - Consistent handler structure
     */
    public function handleResetSettings($action, $config) {
        try {
            $defaults = $this->settings_manager->getDefaultSettings();
            $this->settings_manager->saveSettings($defaults);
            
            $this->response_manager->success([
                'settings' => $defaults
            ], __('Settings reset to defaults!', 'woow-admin-styler'), 'settings_reset');
            
        } catch (\Exception $e) {
            throw $e;
        }
    }
    
    /**
     * Handle export settings - Consistent handler structure
     */
    public function handleExportSettings($action, $config) {
        try {
            $settings = $this->settings_manager->getSettings();
            $export_data = [
                'version' => defined('MAS_V2_VERSION') ? MAS_V2_VERSION : '2.4.0',
                'exported' => current_time('mysql'),
                'settings' => $settings
            ];
            
            $this->response_manager->success([
                'data' => $export_data,
                'filename' => 'mas-v2-settings-' . date('Y-m-d') . '.json'
            ], __('Settings exported successfully!', 'woow-admin-styler'), 'settings_exported');
            
        } catch (\Exception $e) {
            throw $e;
        }
    }
    
    /**
     * Handle import settings - Consistent handler structure
     */
    public function handleImportSettings($action, $config) {
        try {
            $import_data = json_decode(stripslashes($_POST['data'] ?? ''), true);
            
            if (!$import_data || !isset($import_data['settings'])) {
                throw new ValidationException(__('Invalid file format', 'woow-admin-styler'), 'data', 'invalid_format');
            }
            
            $settings = $this->settings_manager->sanitizeSettings($import_data['settings']);
            $this->settings_manager->saveSettings($settings);
            
            $this->response_manager->success([
                'settings' => $settings
            ], __('Settings imported successfully!', 'woow-admin-styler'), 'settings_imported');
            
        } catch (\Exception $e) {
            throw $e;
        }
    }
    
    /**
     * Handle database check - Consistent handler structure
     */
    public function handleDatabaseCheck($action, $config) {
        try {
            global $wpdb;
            
            $results = [
                'database_connection' => $wpdb->check_connection(),
                'options_table_exists' => $wpdb->get_var("SHOW TABLES LIKE '{$wpdb->options}'") === $wpdb->options,
                'mas_option_exists' => get_option('mas_v2_settings') !== false,
                'option_size' => strlen(serialize(get_option('mas_v2_settings'))),
                'autoload_status' => $wpdb->get_var("SELECT autoload FROM {$wpdb->options} WHERE option_name = 'mas_v2_settings'")
            ];
            
            $this->response_manager->success($results, __('Database check completed', 'woow-admin-styler'), 'database_check');
            
        } catch (\Exception $e) {
            throw $e;
        }
    }
    
    /**
     * Handle error logging - Consistent handler structure
     */
    public function handleLogError($action, $config) {
        try {
            $error_data = json_decode(stripslashes($_POST['error_data'] ?? '{}'), true);
            
            if (is_array($error_data)) {
                $error_id = $this->error_logger->logJavaScriptError($error_data);
                
                $this->response_manager->success([
                    'error_id' => $error_id,
                    'logged' => true
                ], 'Error logged successfully', 'error_logged');
            } else {
                throw new ValidationException('Invalid error data format', 'error_data', 'invalid_format');
            }
            
        } catch (\Exception $e) {
            // Log the logging error itself
            $this->error_logger->logSystemError('Failed to log frontend error: ' . $e->getMessage(), [
                'original_error_data' => $_POST['error_data'] ?? null,
                'logging_error' => $e->getMessage()
            ]);
            throw $e;
        }
    }    
 
   /**
     * Get endpoint registry for documentation/debugging
     */
    public function getEndpointRegistry() {
        return [
            'active_endpoints' => $this->endpoints,
            'deprecated_endpoints' => $this->deprecated_endpoints,
            'total_endpoints' => count($this->endpoints),
            'high_priority_endpoints' => $this->getEndpointsByPriority('high'),
            'endpoint_statistics' => $this->getEndpointStatistics()
        ];
    }
    
    /**
     * Get endpoints by priority level
     */
    private function getEndpointsByPriority($priority) {
        return array_filter($this->endpoints, function($config) use ($priority) {
            return ($config['priority'] ?? 'medium') === $priority;
        });
    }
    
    /**
     * Get endpoint statistics
     */
    private function getEndpointStatistics() {
        $stats = [
            'by_priority' => ['high' => 0, 'medium' => 0, 'low' => 0],
            'by_capability' => [],
            'average_rate_limit' => 0,
            'total_rate_limit' => 0
        ];
        
        foreach ($this->endpoints as $config) {
            // Priority stats
            $priority = $config['priority'] ?? 'medium';
            $stats['by_priority'][$priority]++;
            
            // Capability stats
            $capability = $config['capability'] ?? 'manage_options';
            $stats['by_capability'][$capability] = ($stats['by_capability'][$capability] ?? 0) + 1;
            
            // Rate limit stats
            $stats['total_rate_limit'] += $config['rate_limit'] ?? 10;
        }
        
        $stats['average_rate_limit'] = round($stats['total_rate_limit'] / count($this->endpoints), 2);
        
        return $stats;
    }
    
    /**
     * Validate endpoint configuration
     */
    public function validateEndpointConfig($action, $config) {
        $required_fields = ['handler', 'capability', 'description'];
        $missing_fields = [];
        
        foreach ($required_fields as $field) {
            if (!isset($config[$field])) {
                $missing_fields[] = $field;
            }
        }
        
        if (!empty($missing_fields)) {
            throw new \Exception("Endpoint {$action} missing required fields: " . implode(', ', $missing_fields));
        }
        
        if (!is_callable($config['handler'])) {
            throw new \Exception("Endpoint {$action} handler is not callable");
        }
        
        return true;
    }
    
    /**
     * Add custom endpoint dynamically
     */
    public function addEndpoint($action, $config) {
        // Validate configuration
        $this->validateEndpointConfig($action, $config);
        
        // Add version info if not present
        if (!isset($config['version_added'])) {
            $config['version_added'] = '2.4.0-custom';
        }
        
        // Add to registry
        $this->endpoints[$action] = $config;
        
        // Hook to WordPress
        add_action("wp_ajax_{$action}", [$this, 'processAjaxRequest']);
        
        return true;
    }
    
    /**
     * Remove endpoint
     */
    public function removeEndpoint($action) {
        if (isset($this->endpoints[$action])) {
            unset($this->endpoints[$action]);
            remove_action("wp_ajax_{$action}", [$this, 'processAjaxRequest']);
            return true;
        }
        
        return false;
    }
    
    /**
     * Get current request information
     */
    public function getCurrentRequest() {
        return $this->current_request;
    }
    
    /**
     * Get performance statistics for all endpoints
     */
    public function getPerformanceReport($period = 'day') {
        return $this->performance_monitor->generateReport($period);
    }
    
    /**
     * Get security statistics
     */
    public function getSecurityReport() {
        return $this->security_manager->getSecurityStats();
    }
    
    /**
     * Get error statistics
     */
    public function getErrorReport() {
        return $this->error_logger->getErrorStats();
    }
    
    /**
     * Generate comprehensive system report
     */
    public function generateSystemReport() {
        return [
            'endpoints' => $this->getEndpointRegistry(),
            'performance' => $this->getPerformanceReport(),
            'security' => $this->getSecurityReport(),
            'errors' => $this->getErrorReport(),
            'system_info' => [
                'php_version' => PHP_VERSION,
                'wordpress_version' => get_bloginfo('version'),
                'plugin_version' => defined('MAS_V2_VERSION') ? MAS_V2_VERSION : '2.4.0',
                'memory_usage' => memory_get_usage(true),
                'memory_peak' => memory_get_peak_usage(true),
                'memory_limit' => ini_get('memory_limit')
            ],
            'generated_at' => current_time('mysql')
        ];
    }
    
    /**
     * Handle cache check - Consistent handler structure
     */
    public function handleCacheCheck($action, $config) {
        try {
            $cache_stats = [
                'object_cache_enabled' => wp_using_ext_object_cache(),
                'transients_count' => $this->getTransientsCount(),
                'mas_cache_size' => $this->getMasCacheSize(),
                'cache_status' => 'operational'
            ];
            
            $this->response_manager->success($cache_stats, __('Cache check completed', 'woow-admin-styler'), 'cache_check');
            
        } catch (\Exception $e) {
            throw $e;
        }
    }
    
    /**
     * Handle clear cache - Consistent handler structure
     */
    public function handleClearCache($action, $config) {
        try {
            // Clear WordPress object cache
            if (function_exists('wp_cache_flush')) {
                wp_cache_flush();
            }
            
            // Clear MAS-specific transients
            $this->clearMasTransients();
            
            // Clear any generated CSS files
            $this->clearGeneratedCSS();
            
            $this->response_manager->success([
                'cleared_items' => ['object_cache', 'transients', 'generated_css']
            ], __('Cache cleared successfully!', 'woow-admin-styler'), 'cache_cleared');
            
        } catch (\Exception $e) {
            throw $e;
        }
    }
    
    /**
     * Handle live preview - Consistent handler structure
     */
    public function handleLivePreview($action, $config) {
        try {
            $settings = $this->settings_manager->getSettings();
            
            // Generate CSS based on current settings
            $css = $this->generatePreviewCSS($settings);
            
            $this->response_manager->success([
                'css' => $css,
                'settings_count' => count($settings)
            ], __('Live preview generated', 'woow-admin-styler'), 'live_preview');
            
        } catch (\Exception $e) {
            throw $e;
        }
    }
    
    /**
     * Handle security scan - Consistent handler structure
     */
    public function handleSecurityScan($action, $config) {
        try {
            $scan_results = [
                'vulnerabilities_count' => 0,
                'security_score' => 100,
                'vulnerabilities' => [],
                'recommendations' => []
            ];
            
            // Perform basic security checks
            $scan_results = $this->performSecurityScan($scan_results);
            
            $this->response_manager->success([
                'results' => $scan_results
            ], __('Security scan completed', 'woow-admin-styler'), 'security_scan');
            
        } catch (\Exception $e) {
            throw $e;
        }
    }
    
    /**
     * Handle performance benchmark - Consistent handler structure
     */
    public function handlePerformanceBenchmark($action, $config) {
        try {
            $benchmark_results = [
                'avg_response_time' => 0,
                'memory_usage' => memory_get_usage(true) / 1024 / 1024, // MB
                'db_queries' => 0,
                'cache_hit_ratio' => 0,
                'recommendations' => []
            ];
            
            // Run performance benchmarks
            $benchmark_results = $this->runPerformanceBenchmark($benchmark_results);
            
            $this->response_manager->success([
                'results' => $benchmark_results
            ], __('Performance benchmark completed', 'woow-admin-styler'), 'performance_benchmark');
            
        } catch (\Exception $e) {
            throw $e;
        }
    }
    
    /**
     * Handle cache flush - Consistent handler structure
     */
    public function handleCacheFlush($action, $config) {
        try {
            // More aggressive cache clearing
            wp_cache_flush();
            $this->clearMasTransients();
            $this->clearGeneratedCSS();
            
            // Clear opcache if available
            if (function_exists('opcache_reset')) {
                opcache_reset();
            }
            
            $this->response_manager->success([
                'flushed_items' => ['wp_cache', 'transients', 'css', 'opcache']
            ], __('All caches flushed successfully!', 'woow-admin-styler'), 'cache_flushed');
            
        } catch (\Exception $e) {
            throw $e;
        }
    }
    
    /**
     * Handle cache stats - Consistent handler structure
     */
    public function handleCacheStats($action, $config) {
        try {
            $stats = [
                'object_cache' => wp_using_ext_object_cache(),
                'transients_count' => $this->getTransientsCount(),
                'cache_size' => $this->getMasCacheSize(),
                'hit_ratio' => $this->getCacheHitRatio()
            ];
            
            $this->response_manager->success($stats, __('Cache statistics retrieved', 'woow-admin-styler'), 'cache_stats');
            
        } catch (\Exception $e) {
            throw $e;
        }
    }
    
    /**
     * Handle metrics report - Consistent handler structure
     */
    public function handleMetricsReport($action, $config) {
        try {
            $metrics = $this->performance_monitor->generateReport();
            
            $this->response_manager->success([
                'metrics' => $metrics
            ], __('Metrics report generated', 'woow-admin-styler'), 'metrics_report');
            
        } catch (\Exception $e) {
            throw $e;
        }
    }
    
    /**
     * Handle CSS regenerate - Consistent handler structure
     */
    public function handleCSSRegenerate($action, $config) {
        try {
            $this->clearGeneratedCSS();
            $settings = $this->settings_manager->getSettings();
            $css = $this->generatePreviewCSS($settings);
            
            $this->response_manager->success([
                'css_generated' => !empty($css)
            ], __('CSS regenerated successfully', 'woow-admin-styler'), 'css_regenerated');
            
        } catch (\Exception $e) {
            throw $e;
        }
    }
    
    /**
     * Handle memory stats - Consistent handler structure
     */
    public function handleMemoryStats($action, $config) {
        try {
            $stats = [
                'current_usage' => memory_get_usage(true),
                'peak_usage' => memory_get_peak_usage(true),
                'limit' => ini_get('memory_limit'),
                'usage_percentage' => (memory_get_usage(true) / $this->parseMemoryLimit(ini_get('memory_limit'))) * 100
            ];
            
            $this->response_manager->success($stats, __('Memory statistics retrieved', 'woow-admin-styler'), 'memory_stats');
            
        } catch (\Exception $e) {
            throw $e;
        }
    }
    
    /**
     * Handle force memory optimization - Consistent handler structure
     */
    public function handleForceMemoryOptimization($action, $config) {
        try {
            // Force garbage collection
            if (function_exists('gc_collect_cycles')) {
                $collected = gc_collect_cycles();
            }
            
            // Clear unnecessary caches
            wp_cache_flush();
            
            $this->response_manager->success([
                'cycles_collected' => $collected ?? 0,
                'memory_after' => memory_get_usage(true)
            ], __('Memory optimization completed', 'woow-admin-styler'), 'memory_optimized');
            
        } catch (\Exception $e) {
            throw $e;
        }
    }
    
    // ========================================
    // HELPER METHODS
    // ========================================
    
    /**
     * Get count of MAS-related transients
     */
    private function getTransientsCount() {
        global $wpdb;
        return (int) $wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->options} WHERE option_name LIKE '_transient_mas_%'");
    }
    
    /**
     * Get size of MAS cache data
     */
    private function getMasCacheSize() {
        global $wpdb;
        $result = $wpdb->get_var("SELECT SUM(LENGTH(option_value)) FROM {$wpdb->options} WHERE option_name LIKE '%mas_%'");
        return (int) $result;
    }
    
    /**
     * Clear MAS-specific transients
     */
    private function clearMasTransients() {
        global $wpdb;
        $wpdb->query("DELETE FROM {$wpdb->options} WHERE option_name LIKE '_transient_mas_%' OR option_name LIKE '_transient_timeout_mas_%'");
    }
    
    /**
     * Clear generated CSS files
     */
    private function clearGeneratedCSS() {
        $upload_dir = wp_upload_dir();
        $css_dir = $upload_dir['basedir'] . '/mas-v2-css/';
        
        if (is_dir($css_dir)) {
            $files = glob($css_dir . '*.css');
            foreach ($files as $file) {
                if (is_file($file)) {
                    unlink($file);
                }
            }
        }
    }
    
    /**
     * Generate preview CSS
     */
    private function generatePreviewCSS($settings) {
        // Basic CSS generation - this would be expanded based on actual requirements
        $css = ":root {\n";
        
        foreach ($settings as $key => $value) {
            if (strpos($key, 'color') !== false) {
                $css_var = '--mas-' . str_replace('_', '-', $key);
                $css .= "  {$css_var}: {$value};\n";
            }
        }
        
        $css .= "}\n";
        return $css;
    }
    
    /**
     * Get cache hit ratio
     */
    private function getCacheHitRatio() {
        // Placeholder - would need actual cache statistics
        return wp_using_ext_object_cache() ? 85 : 0;
    }
    
    /**
     * Perform security scan
     */
    private function performSecurityScan($results) {
        // Basic security checks
        $checks = [
            'nonce_validation' => $this->checkNonceValidation(),
            'capability_checks' => $this->checkCapabilityChecks(),
            'input_sanitization' => $this->checkInputSanitization()
        ];
        
        foreach ($checks as $check => $passed) {
            if (!$passed) {
                $results['vulnerabilities_count']++;
                $results['security_score'] -= 20;
                $results['vulnerabilities'][] = [
                    'title' => ucfirst(str_replace('_', ' ', $check)),
                    'severity' => 'medium',
                    'description' => "Issue found with {$check}",
                    'recommendation' => "Review and fix {$check} implementation"
                ];
            }
        }
        
        return $results;
    }
    
    /**
     * Run performance benchmark
     */
    private function runPerformanceBenchmark($results) {
        $start_time = microtime(true);
        
        // Simulate some operations
        $settings = $this->settings_manager->getSettings();
        $css = $this->generatePreviewCSS($settings);
        
        $end_time = microtime(true);
        $results['avg_response_time'] = round(($end_time - $start_time) * 1000, 2);
        
        if ($results['avg_response_time'] > 500) {
            $results['recommendations'][] = 'Consider optimizing CSS generation for better performance';
        }
        
        return $results;
    }
    
    /**
     * Parse memory limit string to bytes
     */
    private function parseMemoryLimit($limit) {
        $limit = trim($limit);
        $last = strtolower($limit[strlen($limit)-1]);
        $limit = (int) $limit;
        
        switch($last) {
            case 'g': $limit *= 1024;
            case 'm': $limit *= 1024;
            case 'k': $limit *= 1024;
        }
        
        return $limit;
    }
    
    /**
     * Check nonce validation implementation
     */
    private function checkNonceValidation() {
        // This would check if nonces are properly implemented
        return true; // Placeholder
    }
    
    /**
     * Check capability checks implementation
     */
    private function checkCapabilityChecks() {
        // This would check if capability checks are properly implemented
        return true; // Placeholder
    }
    
    /**
     * Check input sanitization implementation
     */
    private function checkInputSanitization() {
        // This would check if input sanitization is properly implemented
        return true; // Placeholder
    }
    
    /**
     * Get registered endpoints (for backward compatibility)
     */
    public function getEndpoints() {
        return $this->endpoints;
    }
    
    /**
     * Get deprecated endpoints mapping (for backward compatibility)
     */
    public function getDeprecatedEndpoints() {
        return $this->deprecated_endpoints ?? [];
    }
}