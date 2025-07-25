<?php
/**
 * Backward Compatibility Manager
 * 
 * Ensures existing frontend JavaScript code continues to work
 * during the AJAX security overhaul transition period.
 * 
 * @package ModernAdminStyler
 * @version 2.4.0 - Security Overhaul
 */

namespace ModernAdminStyler\Services;

class BackwardCompatibilityManager {
    
    private $legacy_endpoints = [];
    private $legacy_nonces = [];
    private $response_format_detection = true;
    private $deprecation_notices = [];
    
    public function __construct() {
        $this->initializeLegacySupport();
        $this->registerLegacyEndpoints();
        $this->setupNonceCompatibility();
    }
    
    /**
     * Initialize legacy support systems
     */
    private function initializeLegacySupport() {
        // Define legacy endpoints that need to be maintained
        $this->legacy_endpoints = [
            // Main plugin file legacy endpoints
            'mas_database_check' => 'mas_v2_database_check',
            'mas_cache_check' => 'mas_v2_cache_check',
            'mas_clear_cache' => 'mas_v2_clear_cache',
            'save_mas_v2_settings' => 'mas_v2_save_settings',
            
            // CommunicationManager legacy endpoints
            'mas_v2_import_functional_settings' => 'mas_v2_import_settings',
            'mas_save_live_edit_settings' => 'mas_save_live_settings',
            
            // Additional legacy mappings
            'mas_options_test' => 'mas_v2_database_check' // Deprecated test endpoint
        ];
        
        // Define legacy nonce names that need to be supported
        $this->legacy_nonces = [
            'mas_live_edit_nonce' => 'mas_v2_ajax_nonce',
            'mas_v2_clear_cache' => 'mas_v2_ajax_nonce',
            'mas_nonce' => 'mas_v2_ajax_nonce'
        ];
    }
    
    /**
     * Register legacy AJAX endpoints with deprecation notices
     */
    private function registerLegacyEndpoints() {
        foreach ($this->legacy_endpoints as $legacy_endpoint => $new_endpoint) {
            add_action("wp_ajax_{$legacy_endpoint}", [$this, 'handleLegacyEndpoint']);
            add_action("wp_ajax_nopriv_{$legacy_endpoint}", [$this, 'handleLegacyEndpoint']);
        }
    }
    
    /**
     * Handle legacy endpoint requests with deprecation notices
     */
    public function handleLegacyEndpoint() {
        $legacy_action = str_replace('wp_ajax_', '', current_action());
        $legacy_action = str_replace('wp_ajax_nopriv_', '', $legacy_action);
        
        // Log deprecation notice
        $this->logDeprecationNotice($legacy_action);
        
        // Get the new endpoint
        $new_endpoint = $this->legacy_endpoints[$legacy_action] ?? null;
        
        if (!$new_endpoint) {
            wp_send_json_error([
                'message' => 'Legacy endpoint not found',
                'code' => 'legacy_endpoint_not_found',
                'deprecated_endpoint' => $legacy_action
            ]);
            return;
        }
        
        // Add deprecation header
        if (!headers_sent()) {
            header('X-MAS-Deprecated-Endpoint: ' . $legacy_action);
            header('X-MAS-New-Endpoint: ' . $new_endpoint);
        }
        
        // Validate legacy nonce formats
        if (!$this->validateLegacyNonce()) {
            wp_send_json_error([
                'message' => 'Security verification failed',
                'code' => 'nonce_verification_failed',
                'deprecated_endpoint' => $legacy_action
            ]);
            return;
        }
        
        // Forward to new endpoint through UnifiedAjaxManager
        $this->forwardToNewEndpoint($new_endpoint, $legacy_action);
    }
    
    /**
     * Validate legacy nonce formats
     */
    private function validateLegacyNonce() {
        $nonce = $_POST['nonce'] ?? $_POST['_wpnonce'] ?? '';
        
        if (empty($nonce)) {
            return false;
        }
        
        // Try the new unified nonce first
        if (wp_verify_nonce($nonce, 'mas_v2_ajax_nonce')) {
            return true;
        }
        
        // Try legacy nonce formats
        foreach ($this->legacy_nonces as $legacy_nonce => $new_nonce) {
            if (wp_verify_nonce($nonce, $legacy_nonce)) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Forward request to new endpoint
     */
    private function forwardToNewEndpoint($new_endpoint, $legacy_endpoint) {
        try {
            // Get the UnifiedAjaxManager instance
            $core_engine = \ModernAdminStyler\Services\CoreEngine::getInstance();
            $ajax_manager = $core_engine->getUnifiedAjaxManager();
            
            // Temporarily set the action to the new endpoint
            $_REQUEST['action'] = $new_endpoint;
            
            // Get endpoint configuration
            $endpoints = $ajax_manager->getEndpoints();
            if (!isset($endpoints[$new_endpoint])) {
                throw new \Exception("New endpoint {$new_endpoint} not found");
            }
            
            $config = $endpoints[$new_endpoint];
            
            // Execute the handler with legacy compatibility
            $handler = $config['handler'];
            if (is_callable($handler)) {
                // Add legacy context to the config
                $config['legacy_endpoint'] = $legacy_endpoint;
                $config['is_legacy_request'] = true;
                
                call_user_func($handler, $new_endpoint, $config);
            } else {
                throw new \Exception("Handler not callable for {$new_endpoint}");
            }
            
        } catch (\Exception $e) {
            wp_send_json_error([
                'message' => 'Failed to forward legacy request: ' . $e->getMessage(),
                'code' => 'legacy_forward_failed',
                'legacy_endpoint' => $legacy_endpoint,
                'new_endpoint' => $new_endpoint
            ]);
        }
    }
    
    /**
     * Setup nonce compatibility for frontend
     */
    private function setupNonceCompatibility() {
        add_action('wp_enqueue_scripts', [$this, 'enqueueCompatibilityScript']);
        add_action('admin_enqueue_scripts', [$this, 'enqueueCompatibilityScript']);
    }
    
    /**
     * Enqueue compatibility script for nonce handling
     */
    public function enqueueCompatibilityScript() {
        // Create compatibility object for JavaScript
        $compatibility_data = [
            'unified_nonce' => wp_create_nonce('mas_v2_ajax_nonce'),
            'legacy_nonces' => [
                'mas_live_edit_nonce' => wp_create_nonce('mas_v2_ajax_nonce'),
                'mas_v2_clear_cache' => wp_create_nonce('mas_v2_ajax_nonce'),
                'mas_nonce' => wp_create_nonce('mas_v2_ajax_nonce')
            ],
            'endpoint_mappings' => $this->legacy_endpoints,
            'deprecation_warnings' => get_option('mas_v2_show_deprecation_warnings', true)
        ];
        
        wp_localize_script('jquery', 'mas_compatibility', $compatibility_data);
        
        // Add inline script for automatic compatibility
        $inline_script = "
        (function($) {
            // Backward compatibility for AJAX requests
            if (typeof mas_ajax_object !== 'undefined' && typeof mas_compatibility !== 'undefined') {
                // Update nonce if using legacy format
                if (mas_ajax_object.nonce && mas_compatibility.unified_nonce) {
                    mas_ajax_object.nonce = mas_compatibility.unified_nonce;
                }
                
                // Intercept AJAX requests to show deprecation warnings
                if (mas_compatibility.deprecation_warnings) {
                    var originalAjax = $.ajax;
                    $.ajax = function(options) {
                        if (options.data && options.data.action) {
                            var action = options.data.action;
                            if (mas_compatibility.endpoint_mappings[action]) {
                                console.warn('MAS V2: Deprecated AJAX endpoint \"' + action + '\" used. Please update to \"' + mas_compatibility.endpoint_mappings[action] + '\"');
                            }
                        }
                        return originalAjax.apply(this, arguments);
                    };
                }
            }
        })(jQuery);
        ";
        
        wp_add_inline_script('jquery', $inline_script);
    }
    
    /**
     * Log deprecation notice
     */
    private function logDeprecationNotice($legacy_endpoint) {
        $notice = [
            'endpoint' => $legacy_endpoint,
            'new_endpoint' => $this->legacy_endpoints[$legacy_endpoint] ?? 'unknown',
            'timestamp' => current_time('mysql'),
            'user_id' => get_current_user_id(),
            'ip_address' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
            'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown'
        ];
        
        // Store deprecation notices
        $notices = get_option('mas_v2_deprecation_notices', []);
        $notices[] = $notice;
        
        // Keep only last 100 notices
        if (count($notices) > 100) {
            $notices = array_slice($notices, -100);
        }
        
        update_option('mas_v2_deprecation_notices', $notices);
        
        // Log to error log
        error_log(sprintf(
            'MAS V2 Deprecation: Legacy endpoint "%s" used, should use "%s" | User: %d | IP: %s',
            $legacy_endpoint,
            $this->legacy_endpoints[$legacy_endpoint] ?? 'unknown',
            get_current_user_id(),
            $_SERVER['REMOTE_ADDR'] ?? 'unknown'
        ));
    }
    
    /**
     * Get deprecation notices for admin dashboard
     */
    public function getDeprecationNotices() {
        return get_option('mas_v2_deprecation_notices', []);
    }
    
    /**
     * Clear deprecation notices
     */
    public function clearDeprecationNotices() {
        delete_option('mas_v2_deprecation_notices');
    }
    
    /**
     * Enable/disable deprecation warnings
     */
    public function setDeprecationWarnings($enabled) {
        update_option('mas_v2_show_deprecation_warnings', $enabled);
    }
    
    /**
     * Check if response format detection is enabled
     */
    public function isResponseFormatDetectionEnabled() {
        return $this->response_format_detection;
    }
    
    /**
     * Handle legacy response format
     */
    public function handleLegacyResponse($data, $success = true, $legacy_endpoint = null) {
        // For legacy endpoints, maintain old response format if needed
        if ($legacy_endpoint && $this->requiresLegacyFormat($legacy_endpoint)) {
            // Some legacy endpoints might expect plain text or different JSON structure
            switch ($legacy_endpoint) {
                case 'mas_options_test':
                    // This endpoint might have expected a simple success message
                    echo $success ? 'OK' : 'FAIL';
                    wp_die();
                    break;
                    
                default:
                    // Use standard wp_send_json for most cases
                    if ($success) {
                        wp_send_json_success($data);
                    } else {
                        wp_send_json_error($data);
                    }
                    break;
            }
        } else {
            // Use new unified format
            if ($success) {
                wp_send_json_success($data);
            } else {
                wp_send_json_error($data);
            }
        }
    }
    
    /**
     * Check if endpoint requires legacy response format
     */
    private function requiresLegacyFormat($endpoint) {
        $legacy_format_endpoints = [
            'mas_options_test' // This endpoint used plain text responses
        ];
        
        return in_array($endpoint, $legacy_format_endpoints);
    }
    
    /**
     * Generate migration guide
     */
    public function generateMigrationGuide() {
        $guide = [
            'title' => 'MAS V2 AJAX Endpoint Migration Guide',
            'version' => '2.4.0',
            'endpoints' => [],
            'nonces' => [],
            'breaking_changes' => []
        ];
        
        // Document endpoint changes
        foreach ($this->legacy_endpoints as $old => $new) {
            $guide['endpoints'][] = [
                'old_endpoint' => $old,
                'new_endpoint' => $new,
                'status' => 'deprecated',
                'removal_version' => '3.0.0'
            ];
        }
        
        // Document nonce changes
        foreach ($this->legacy_nonces as $old => $new) {
            $guide['nonces'][] = [
                'old_nonce' => $old,
                'new_nonce' => $new,
                'status' => 'deprecated',
                'removal_version' => '3.0.0'
            ];
        }
        
        // Document breaking changes
        $guide['breaking_changes'] = [
            [
                'change' => 'Unified nonce system',
                'description' => 'All AJAX requests now use mas_v2_ajax_nonce',
                'migration' => 'Update your JavaScript to use the unified nonce'
            ],
            [
                'change' => 'Standardized response format',
                'description' => 'All responses now use wp_send_json_success/error format',
                'migration' => 'Update response parsing to handle new format'
            ],
            [
                'change' => 'Rate limiting',
                'description' => 'All endpoints now have rate limiting',
                'migration' => 'Ensure your code handles rate limit errors gracefully'
            ]
        ];
        
        return $guide;
    }
}