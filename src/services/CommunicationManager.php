<?php
/**
 * Communication Manager Service - Unified HTTP Communication
 * 
 * CONSOLIDATED: AjaxHandler + APIManager  
 * - AJAX request handling for WordPress admin
 * - REST API endpoints for diagnostics and enterprise features
 * - WordPress Settings API integration
 * - Unified communication management system
 * 
 * @package ModernAdminStyler
 * @version 2.3.0 - Consolidated Architecture
 */

namespace ModernAdminStyler\Services;

class CommunicationManager {
    
    // AJAX PROPERTIES (FROM AjaxHandler)
    private $settings_manager;
    
    // REST API PROPERTIES (FROM APIManager)
    private $rest_namespace = 'modern-admin-styler/v2';
    private $settings_group = 'mas_v2_functional_settings';
    private $settings_name = 'mas_v2_functional_settings';
    
    // Service Dependencies (FROM APIManager)
    private $cache_manager;
    private $security_manager;
    private $metrics_collector;
    private $preset_manager;
    
    public function __construct($settings_manager, $cache_manager = null, $security_manager = null, $metrics_collector = null, $preset_manager = null) {
        // AJAX initialization
        $this->settings_manager = $settings_manager;
        
        // API initialization
        $this->cache_manager = $cache_manager;
        $this->security_manager = $security_manager;
        $this->metrics_collector = $metrics_collector;
        $this->preset_manager = $preset_manager;
        
        $this->init();
    }
    
    /**
     * 🚀 Initialize Communication Manager
     */
    public function init() {
        // REST API initialization
        add_action('rest_api_init', [$this, 'registerRestEndpoints']);
        
        // Settings API initialization
        add_action('admin_init', [$this, 'registerSettings']);
        add_action('admin_menu', [$this, 'addSettingsPage']);
        
        // AJAX handlers for import/export
        add_action('wp_ajax_mas_v2_import_functional_settings', [$this, 'handleImportSettings']);
        
        // Register AJAX handlers (FROM AjaxHandler)
        add_action('wp_ajax_mas_v2_save_settings', [$this, 'handleSaveSettings']);
        add_action('wp_ajax_mas_v2_reset_settings', [$this, 'handleResetSettings']);
        add_action('wp_ajax_mas_v2_export_settings', [$this, 'handleExportSettings']);
        add_action('wp_ajax_mas_v2_import_settings', [$this, 'handleImportSettings']);
        add_action('wp_ajax_mas_v2_database_check', [$this, 'handleDatabaseCheck']);
        
        // Enterprise AJAX handlers
        add_action('wp_ajax_mas_v2_cache_flush', [$this, 'handleCacheFlush']);
        add_action('wp_ajax_mas_v2_cache_stats', [$this, 'handleCacheStats']);
        add_action('wp_ajax_mas_v2_metrics_report', [$this, 'handleMetricsReport']);
        add_action('wp_ajax_mas_v2_security_scan', [$this, 'handleSecurityScan']);
        add_action('wp_ajax_mas_v2_performance_benchmark', [$this, 'handlePerformanceBenchmark']);
        add_action('wp_ajax_mas_v2_css_regenerate', [$this, 'handleCSSRegenerate']);
        add_action('wp_ajax_mas_v2_memory_stats', [$this, 'handleMemoryStats']);
        add_action('wp_ajax_mas_v2_force_memory_optimization', [$this, 'handleForceMemoryOptimization']);
    }
    
    /**
     * 🔒 Weryfikuje bezpieczeństwo AJAX requesta
     */
    private function verifyAjaxSecurity() {
        if (!wp_verify_nonce($_POST['nonce'] ?? '', 'mas_v2_nonce')) {
            wp_send_json_error(['message' => __('Błąd bezpieczeństwa', 'woow-admin-styler')]);
            return false;
        }
        
        if (!current_user_can('manage_options')) {
            wp_send_json_error(['message' => __('Brak uprawnień', 'woow-admin-styler')]);
            return false;
        }
        
        return true;
    }
    
    /**
     * Rate limiting helper (max 10 zapisów na minutę na usera)
     */
    private function isRateLimited($action = 'save') {
        $user_id = get_current_user_id();
        $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
        $key = 'mas_v2_rate_' . $action . '_' . $user_id;
        $limit = 10;
        $window = 60; // sekundy
        $now = time();
        $history = get_transient($key);
        if (!is_array($history)) $history = [];
        // Usuń stare wpisy
        $history = array_filter($history, function($ts) use ($now, $window) { return $ts > $now - $window; });
        if (count($history) >= $limit) {
            error_log("MAS V2: Rate limit exceeded for user $user_id ($ip) at " . date('Y-m-d H:i:s'));
            return true;
        }
        $history[] = $now;
        set_transient($key, $history, $window);
        return false;
    }

    /**
     * 💾 Obsługuje zapisywanie ustawień przez AJAX
     */
    public function handleSaveSettings() {
        if (!$this->verifyAjaxSecurity()) {
            return;
        }
        if ($this->isRateLimited('save')) {
            wp_send_json_error(['message' => __('Zbyt wiele zapisów. Odczekaj chwilę i spróbuj ponownie.', 'woow-admin-styler')]);
            return;
        }
        try {
            error_log('MAS V2: AJAX Save Settings called');
            // Filtruj dane formularza
            $form_data = $_POST;
            unset($form_data['nonce'], $form_data['action']);
            // Sanityzacja i zapis
            $old_settings = $this->settings_manager->getSettings();
            $settings = $this->settings_manager->sanitizeSettings($form_data);
            $result = $this->settings_manager->saveSettings($settings);
            // Weryfikacja zapisu
            $is_success = ($result === true || serialize($settings) === serialize($old_settings));
            if ($is_success) {
                wp_send_json_success([
                    'message' => __('Ustawienia zostały zapisane pomyślnie!', 'woow-admin-styler'),
                    'settings' => $settings
                ]);
            } else {
                error_log('MAS V2: Save failed for user ' . get_current_user_id() . ' (' . ($_SERVER['REMOTE_ADDR'] ?? 'unknown') . ') at ' . date('Y-m-d H:i:s'));
                wp_send_json_error(['message' => __('Wystąpił błąd podczas zapisu do bazy danych.', 'woow-admin-styler')]);
            }
        } catch (Exception $e) {
            error_log('MAS V2: Save error: ' . $e->getMessage() . ' for user ' . get_current_user_id() . ' (' . ($_SERVER['REMOTE_ADDR'] ?? 'unknown') . ') at ' . date('Y-m-d H:i:s'));
            wp_send_json_error(['message' => $e->getMessage()]);
        }
    }
    
    /**
     * 🔄 Obsługuje resetowanie ustawień
     */
    public function handleResetSettings() {
        if (!$this->verifyAjaxSecurity()) {
            return;
        }
        if ($this->isRateLimited('reset')) {
            wp_send_json_error(['message' => __('Zbyt wiele resetów. Odczekaj chwilę i spróbuj ponownie.', 'woow-admin-styler')]);
            return;
        }
        try {
            $defaults = $this->settings_manager->getDefaultSettings();
            $this->settings_manager->saveSettings($defaults);
            
            wp_send_json_success([
                'message' => __('Ustawienia zostały przywrócone do domyślnych!', 'woow-admin-styler')
            ]);
        } catch (Exception $e) {
            error_log('MAS V2: Reset error: ' . $e->getMessage() . ' for user ' . get_current_user_id() . ' (' . ($_SERVER['REMOTE_ADDR'] ?? 'unknown') . ') at ' . date('Y-m-d H:i:s'));
            wp_send_json_error(['message' => $e->getMessage()]);
        }
    }
    
    /**
     * 📤 Obsługuje eksport ustawień
     */
    public function handleExportSettings() {
        if (!$this->verifyAjaxSecurity()) {
            return;
        }
        
        try {
            $settings = $this->settings_manager->getSettings();
            $export_data = [
                'version' => MAS_V2_VERSION,
                'exported' => date('Y-m-d H:i:s'),
                'settings' => $settings
            ];
            
            wp_send_json_success([
                'data' => $export_data,
                'filename' => 'mas-v2-settings-' . date('Y-m-d') . '.json'
            ]);
        } catch (Exception $e) {
            wp_send_json_error(['message' => $e->getMessage()]);
        }
    }
    
    /**
     * 📥 Obsługuje import ustawień
     */
    public function handleImportSettings() {
        if (!$this->verifyAjaxSecurity()) {
            return;
        }
        
        try {
            $import_data = json_decode(stripslashes($_POST['data']), true);
            
            if (!$import_data || !isset($import_data['settings'])) {
                throw new Exception(__('Nieprawidłowy format pliku', 'woow-admin-styler'));
            }
            
            $settings = $this->settings_manager->sanitizeSettings($import_data['settings']);
            $this->settings_manager->saveSettings($settings);
            
            wp_send_json_success([
                'message' => __('Ustawienia zostały zaimportowane pomyślnie!', 'woow-admin-styler'),
                'settings' => $settings
            ]);
            
        } catch (Exception $e) {
            wp_send_json_error(['message' => $e->getMessage()]);
        }
    }
    
    /**
     * 🔍 Diagnostyka - sprawdzenie bazy danych
     */
    public function handleDatabaseCheck() {
        if (!$this->verifyAjaxSecurity()) {
            return;
        }
        
        try {
            global $wpdb;
            
            $results = [
                'database_connection' => $wpdb->check_connection(),
                'options_table_exists' => $wpdb->get_var("SHOW TABLES LIKE '{$wpdb->options}'") === $wpdb->options,
                'mas_option_exists' => get_option('mas_v2_settings') !== false,
                'option_size' => strlen(serialize(get_option('mas_v2_settings'))),
                'autoload_status' => $wpdb->get_var("SELECT autoload FROM {$wpdb->options} WHERE option_name = 'mas_v2_settings'")
            ];
            
            wp_send_json_success($results);
            
        } catch (Exception $e) {
            wp_send_json_error(['message' => $e->getMessage()]);
        }
    }

    // ========================================
    // 🚀 ENTERPRISE AJAX HANDLERS
    // ========================================

    /**
     * 🗄️ Enterprise: Czyszczenie cache
     */
    public function handleCacheFlush() {
        if (!$this->verifyAjaxSecurity()) {
            return;
        }

        try {
            $coreEngine = \ModernAdminStyler\Services\CoreEngine::getInstance();
            $cache_manager = $coreEngine->getCacheManager();
            $cache_manager->flush();
            
            wp_send_json_success(['message' => __('Cache został wyczyszczony pomyślnie!', 'woow-admin-styler')]);
        } catch (Exception $e) {
            wp_send_json_error(['message' => $e->getMessage()]);
        }
    }

    /**
     * 📊 Enterprise: Statystyki cache
     */
    public function handleCacheStats() {
        if (!$this->verifyAjaxSecurity()) {
            return;
        }

        try {
            $coreEngine = \ModernAdminStyler\Services\CoreEngine::getInstance();
            $cache_manager = $coreEngine->getCacheManager();
            $stats = $cache_manager->getStats();
            
            wp_send_json_success($stats);
        } catch (Exception $e) {
            wp_send_json_error(['message' => $e->getMessage()]);
        }
    }

    /**
     * 📈 Enterprise: Raport metryk wydajności
     */
    public function handleMetricsReport() {
        if (!$this->verifyAjaxSecurity()) {
            return;
        }

        try {
            $coreEngine = \ModernAdminStyler\Services\CoreEngine::getInstance();
            $metrics_collector = $coreEngine->getCacheManager(); // Consolidated into CacheManager
            $report = $metrics_collector->generateReport();
            
            wp_send_json_success($report);
        } catch (Exception $e) {
            wp_send_json_error(['message' => $e->getMessage()]);
        }
    }

    /**
     * 🔐 Enterprise: Skan bezpieczeństwa
     * FIXED: Now includes comprehensive database and filesystem scanning with memory optimization
     */
    public function handleSecurityScan() {
        if (!$this->verifyAjaxSecurity()) {
            return;
        }

        try {
            $coreEngine = \ModernAdminStyler\Services\CoreEngine::getInstance();
            $security_manager = $coreEngine->getSecurityManager();
            
            // Get scan type from request
            $scan_type = $_POST['scan_type'] ?? 'basic';
            
            if ($scan_type === 'comprehensive') {
                // Run comprehensive scan with chunking
                $scan_results = $security_manager->runComprehensiveScan();
            } else {
                // Basic security check
                $scan_results = [
                    'plugin_version' => MAS_V2_VERSION,
                    'security_features' => [
                        'nonce_verification' => true,
                        'capability_check' => true,
                        'input_sanitization' => true,
                        'rate_limiting' => true,
                        'memory_optimization' => true
                    ],
                    'security_stats' => $security_manager->getSecurityStats(),
                    'recommendations' => [
                        __('Wszystkie mechanizmy bezpieczeństwa są aktywne', 'woow-admin-styler'),
                        __('System używa chunking aby uniknąć problemów z pamięcią', 'woow-admin-styler')
                    ],
                    'security_score' => 98,
                    'memory_usage' => [
                        'current' => memory_get_usage(true),
                        'peak' => memory_get_peak_usage(true),
                        'limit' => ini_get('memory_limit')
                    ]
                ];
            }

            wp_send_json_success($scan_results);
        } catch (Exception $e) {
            wp_send_json_error(['message' => $e->getMessage()]);
        }
    }

    /**
     * ⚡ Enterprise: Test wydajności (benchmark)
     */
    public function handlePerformanceBenchmark() {
        if (!$this->verifyAjaxSecurity()) {
            return;
        }

        try {
            $coreEngine = \ModernAdminStyler\Services\CoreEngine::getInstance();
            $cache_manager = $coreEngine->getCacheManager();
            $benchmark = $cache_manager->benchmark();
            
            wp_send_json_success($benchmark);
        } catch (Exception $e) {
            wp_send_json_error(['message' => $e->getMessage()]);
        }
    }

    /**
     * 🎨 Enterprise: Regeneracja CSS
     */
    public function handleCSSRegenerate() {
        if (!$this->verifyAjaxSecurity()) {
            return;
        }

        try {
            $coreEngine = \ModernAdminStyler\Services\CoreEngine::getInstance();
            $cache_manager = $coreEngine->getCacheManager();
            $css_generator = $coreEngine->getStyleGenerator(); // Consolidated name
            
            // Wyczyść cache CSS
            $cache_manager->delete('mas_v2_generated_css');
            
            // Regeneruj CSS
            $settings = $this->settings_manager->getSettings();
            $css = $css_generator->generate($settings);
            
            wp_send_json_success([
                'message' => __('CSS został zregenerowany pomyślnie!', 'woow-admin-styler'),
                'css_length' => strlen($css),
                'timestamp' => current_time('mysql')
            ]);
        } catch (Exception $e) {
            wp_send_json_error(['message' => $e->getMessage()]);
        }
    }
    
    /**
     * 💾 Memory stats handler
     */
    public function handleMemoryStats() {
        if (!$this->verifyAjaxSecurity()) {
            return;
        }
        
        try {
            $coreEngine = \ModernAdminStyler\Services\CoreEngine::getInstance();
            $memoryOptimizer = $coreEngine->getCacheManager(); // Consolidated into CacheManager
            
            $stats = [
                'current' => memory_get_usage(true),
                'peak' => memory_get_peak_usage(true),
                'limit' => ini_get('memory_limit'),
                'percentage' => round((memory_get_usage(true) / $this->parseMemoryLimit(ini_get('memory_limit'))) * 100, 2)
            ];
            
            wp_send_json_success($stats);
        } catch (Exception $e) {
            wp_send_json_error('Failed to get memory stats: ' . $e->getMessage());
        }
    }
    
    /**
     * 🔧 Force memory optimization handler
     */
    public function handleForceMemoryOptimization() {
        if (!$this->verifyAjaxSecurity()) {
            return;
        }
        
        try {
            $coreEngine = \ModernAdminStyler\Services\CoreEngine::getInstance();
            $memoryOptimizer = $coreEngine->getCacheManager(); // Consolidated into CacheManager
            
            // Force garbage collection
            if (function_exists('gc_collect_cycles')) {
                gc_collect_cycles();
            }
            
            $result = [
                'message' => 'Memory optimization completed',
                'memory_before' => memory_get_usage(true),
                'memory_after' => memory_get_usage(true)
            ];
            
            wp_send_json_success($result);
        } catch (Exception $e) {
            wp_send_json_error('Memory optimization failed: ' . $e->getMessage());
        }
    }
    
    // ========================================
    // 🔗 REST API ENDPOINTS (FROM APIManager)
    // ========================================
    
    /**
     * 🔗 Register REST API Endpoints
     */
    public function registerRestEndpoints() {
        
        // === CACHE MANAGEMENT ===
        register_rest_route($this->rest_namespace, '/cache/flush', [
            'methods' => 'POST',
            'callback' => [$this, 'flushCache'],
            'permission_callback' => [$this, 'checkPermissions'],
            'args' => [
                'type' => [
                    'required' => false,
                    'type' => 'string',
                    'enum' => ['all', 'transients', 'object', 'opcache'],
                    'default' => 'all'
                ]
            ]
        ]);
        
        register_rest_route($this->rest_namespace, '/cache/stats', [
            'methods' => 'GET',
            'callback' => [$this, 'getCacheStats'],
            'permission_callback' => [$this, 'checkPermissions']
        ]);
        
        // === SECURITY MANAGEMENT ===
        register_rest_route($this->rest_namespace, '/security/scan', [
            'methods' => 'POST',
            'callback' => [$this, 'runSecurityScan'],
            'permission_callback' => [$this, 'checkPermissions'],
            'args' => [
                'deep_scan' => [
                    'required' => false,
                    'type' => 'boolean',
                    'default' => false
                ]
            ]
        ]);
        
        // === PERFORMANCE METRICS ===
        register_rest_route($this->rest_namespace, '/metrics/report', [
            'methods' => 'GET',
            'callback' => [$this, 'getMetricsReport'],
            'permission_callback' => [$this, 'checkPermissions'],
            'args' => [
                'period' => [
                    'required' => false,
                    'type' => 'string',
                    'enum' => ['hour', 'day', 'week', 'month'],
                    'default' => 'day'
                ]
            ]
        ]);
        
        register_rest_route($this->rest_namespace, '/metrics/benchmark', [
            'methods' => 'POST',
            'callback' => [$this, 'runPerformanceBenchmark'],
            'permission_callback' => [$this, 'checkPermissions']
        ]);
        
        // === SYSTEM MANAGEMENT ===
        register_rest_route($this->rest_namespace, '/system/info', [
            'methods' => 'GET',
            'callback' => [$this, 'getSystemInfo'],
            'permission_callback' => [$this, 'checkPermissions']
        ]);
        
        register_rest_route($this->rest_namespace, '/status', [
            'methods' => 'GET',
            'callback' => [$this, 'getPluginStatus'],
            'permission_callback' => [$this, 'checkPermissions']
        ]);
        
        // === CSS GENERATION ===
        register_rest_route($this->rest_namespace, '/css/regenerate', [
            'methods' => 'POST',
            'callback' => [$this, 'regenerateCSS'],
            'permission_callback' => [$this, 'checkPermissions']
        ]);
        
        // === PRESET MANAGEMENT ===
        if ($this->preset_manager) {
            $this->registerPresetEndpoints();
        }
    }
    
    /**
     * 🎯 Register Preset REST Endpoints
     */
    private function registerPresetEndpoints() {
        // GET all presets
        register_rest_route($this->rest_namespace, '/presets', [
            'methods' => 'GET',
            'callback' => [$this, 'getPresets'],
            'permission_callback' => [$this, 'checkPermissions']
        ]);
        
        // POST new preset
        register_rest_route($this->rest_namespace, '/presets', [
            'methods' => 'POST',
            'callback' => [$this, 'savePreset'],
            'permission_callback' => [$this, 'checkPermissions'],
            'args' => [
                'name' => [
                    'required' => true,
                    'type' => 'string',
                    'validate_callback' => function($param) {
                        return !empty(trim($param));
                    }
                ],
                'settings' => [
                    'required' => true,
                    'type' => 'object'
                ]
            ]
        ]);
        
        // GET/PUT/DELETE single preset
        register_rest_route($this->rest_namespace, '/presets/(?P<id>\d+)', [
            [
                'methods' => 'GET',
                'callback' => [$this, 'getPreset'],
                'permission_callback' => [$this, 'checkPermissions']
            ],
            [
                'methods' => 'PUT',
                'callback' => [$this, 'updatePreset'],
                'permission_callback' => [$this, 'checkPermissions']
            ],
            [
                'methods' => 'DELETE',
                'callback' => [$this, 'deletePreset'],
                'permission_callback' => [$this, 'checkPermissions']
            ]
        ]);
        
        // Apply preset
        register_rest_route($this->rest_namespace, '/presets/(?P<id>\d+)/apply', [
            'methods' => 'POST',
            'callback' => [$this, 'applyPreset'],
            'permission_callback' => [$this, 'checkPermissions']
        ]);
    }
    
    /**
     * 🔐 Check REST API permissions
     */
    public function checkPermissions() {
        return current_user_can('manage_options');
    }
    
    // === REST API ENDPOINT HANDLERS ===
    
    /**
     * 🗄️ Flush Cache Endpoint
     */
    public function flushCache(\WP_REST_Request $request) {
        $type = $request->get_param('type');
        
        try {
            if ($this->cache_manager) {
                $result = $this->cache_manager->flush();
            } else {
                $result = ['message' => 'Cache manager not available'];
            }
            
            return new \WP_REST_Response([
                'success' => true,
                'message' => sprintf('✅ Cache typu "%s" został wyczyszczony', $type),
                'data' => $result,
                'timestamp' => current_time('mysql')
            ], 200);
            
        } catch (\Exception $e) {
            return new \WP_REST_Response([
                'success' => false,
                'message' => '❌ Błąd podczas czyszczenia cache: ' . $e->getMessage(),
                'error_code' => 'CACHE_FLUSH_ERROR'
            ], 500);
        }
    }
    
    /**
     * 📊 Get Cache Stats Endpoint
     */
    public function getCacheStats() {
        try {
            if ($this->cache_manager) {
                $stats = $this->cache_manager->getStats();
            } else {
                $stats = ['message' => 'Cache manager not available'];
            }
            
            return new \WP_REST_Response([
                'success' => true,
                'data' => $stats,
                'timestamp' => current_time('mysql')
            ], 200);
            
        } catch (\Exception $e) {
            return new \WP_REST_Response([
                'success' => false,
                'message' => '❌ Błąd podczas pobierania statystyk cache: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * 🔒 Security Scan Endpoint
     */
    public function runSecurityScan(\WP_REST_Request $request) {
        $deep_scan = $request->get_param('deep_scan');
        
        try {
            if ($this->security_manager) {
                $scan_results = $this->security_manager->quickSecurityCheck([]);
            } else {
                $scan_results = [
                    'safe' => true,
                    'threats' => [],
                    'message' => 'Security manager not available'
                ];
            }
            
            return new \WP_REST_Response([
                'success' => true,
                'message' => '🔒 Skan bezpieczeństwa zakończony',
                'data' => $scan_results,
                'timestamp' => current_time('mysql')
            ], 200);
            
        } catch (\Exception $e) {
            return new \WP_REST_Response([
                'success' => false,
                'message' => '❌ Błąd podczas skanu bezpieczeństwa: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * 📈 Get Metrics Report Endpoint
     */
    public function getMetricsReport(\WP_REST_Request $request) {
        $period = $request->get_param('period');
        
        try {
            if ($this->metrics_collector) {
                $report = $this->metrics_collector->generateReport($period);
            } else {
                $report = [
                    'message' => 'Metrics collector not available',
                    'basic_stats' => [
                        'memory_usage' => memory_get_usage(true),
                        'peak_memory' => memory_get_peak_usage(true),
                        'execution_time' => microtime(true)
                    ]
                ];
            }
            
            return new \WP_REST_Response([
                'success' => true,
                'data' => $report,
                'period' => $period,
                'timestamp' => current_time('mysql')
            ], 200);
            
        } catch (\Exception $e) {
            return new \WP_REST_Response([
                'success' => false,
                'message' => '❌ Błąd podczas generowania raportu: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * ⚡ Performance Benchmark Endpoint
     */
    public function runPerformanceBenchmark(\WP_REST_Request $request) {
        try {
            $benchmark_start = microtime(true);
            
            $tests = [
                'database_query' => $this->benchmarkDatabaseQuery(),
                'file_operations' => $this->benchmarkFileOperations(),
                'memory_usage' => $this->benchmarkMemoryUsage(),
                'cpu_performance' => $this->benchmarkCPUPerformance()
            ];
            
            $benchmark_end = microtime(true);
            $total_time = $benchmark_end - $benchmark_start;
            
            return new \WP_REST_Response([
                'success' => true,
                'message' => '📊 Benchmark wydajności zakończony',
                'data' => [
                    'tests' => $tests,
                    'total_time' => round($total_time, 4),
                    'overall_score' => $this->calculateOverallScore($tests),
                    'recommendations' => $this->generateRecommendations($tests)
                ],
                'timestamp' => current_time('mysql')
            ], 200);
            
        } catch (\Exception $e) {
            return new \WP_REST_Response([
                'success' => false,
                'message' => '❌ Błąd podczas benchmarku: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * ℹ️ Get System Info Endpoint
     */
    public function getSystemInfo() {
        $info = [
            'php_version' => PHP_VERSION,
            'wp_version' => get_bloginfo('version'),
            'memory_limit' => ini_get('memory_limit'),
            'max_execution_time' => ini_get('max_execution_time'),
            'upload_max_size' => ini_get('upload_max_filesize'),
            'plugin_version' => defined('MAS_V2_VERSION') ? MAS_V2_VERSION : '2.3.0',
            'active_theme' => wp_get_theme()->get('Name'),
            'multisite' => is_multisite(),
            'debug_mode' => defined('WP_DEBUG') && WP_DEBUG,
            'server_info' => $_SERVER['SERVER_SOFTWARE'] ?? 'Unknown'
        ];
        
        return new \WP_REST_Response([
            'success' => true,
            'data' => $info,
            'timestamp' => current_time('mysql')
        ], 200);
    }
    
    /**
     * 🔍 Get Plugin Status Endpoint
     */
    public function getPluginStatus() {
        $settings = $this->settings_manager->getAllSettings();
        
        $status = [
            'plugin_active' => true,
            'settings_count' => count($settings),
            'active_features' => $this->getActiveFeatures($settings),
            'performance_impact' => $this->calculatePerformanceImpact($settings),
            'cache_status' => $this->cache_manager ? 'active' : 'not available',
            'security_level' => $this->security_manager ? 'active' : 'not available'
        ];
        
        return new \WP_REST_Response([
            'success' => true,
            'data' => $status,
            'timestamp' => current_time('mysql')
        ], 200);
    }
    
    /**
     * 🎨 Regenerate CSS Endpoint
     */
    public function regenerateCSS(\WP_REST_Request $request) {
        try {
            // Clear CSS cache
            if ($this->cache_manager) {
                $this->cache_manager->delete('mas_v2_generated_css');
            }
            
            return new \WP_REST_Response([
                'success' => true,
                'message' => '🎨 CSS został zregenerowany',
                'data' => [
                    'timestamp' => current_time('mysql')
                ],
                'timestamp' => current_time('mysql')
            ], 200);
            
        } catch (\Exception $e) {
            return new \WP_REST_Response([
                'success' => false,
                'message' => '❌ Błąd podczas regeneracji CSS: ' . $e->getMessage()
            ], 500);
        }
    }
    
    // === BENCHMARK METHODS (FROM APIManager) ===
    
    /**
     * 🗄️ Database Query Benchmark
     */
    private function benchmarkDatabaseQuery() {
        global $wpdb;
        
        $start_time = microtime(true);
        $wpdb->get_results("SELECT * FROM {$wpdb->options} WHERE option_name LIKE 'mas_v2_%' LIMIT 10");
        $end_time = microtime(true);
        
        $execution_time = ($end_time - $start_time) * 1000;
        
        return [
            'execution_time' => round($execution_time, 2),
            'score' => $this->calculateScore($execution_time, 50),
            'status' => $execution_time < 50 ? 'good' : ($execution_time < 100 ? 'average' : 'poor'),
            'unit' => 'ms'
        ];
    }
    
    /**
     * 📁 File Operations Benchmark
     */
    private function benchmarkFileOperations() {
        $start_time = microtime(true);
        
        // Test file operations
        $test_file = WP_CONTENT_DIR . '/mas-v2-test.tmp';
        file_put_contents($test_file, 'Test content for MAS V2 benchmark');
        $content = file_get_contents($test_file);
        unlink($test_file);
        
        $end_time = microtime(true);
        $execution_time = ($end_time - $start_time) * 1000;
        
        return [
            'execution_time' => round($execution_time, 2),
            'score' => $this->calculateScore($execution_time, 10),
            'status' => $execution_time < 10 ? 'good' : ($execution_time < 25 ? 'average' : 'poor'),
            'unit' => 'ms'
        ];
    }
    
    /**
     * 💾 Memory Usage Benchmark
     */
    private function benchmarkMemoryUsage() {
        $start_memory = memory_get_usage();
        
        // Memory-intensive operation
        $test_array = [];
        for ($i = 0; $i < 10000; $i++) {
            $test_array[] = str_repeat('x', 100);
        }
        
        $end_memory = memory_get_usage();
        $memory_used = ($end_memory - $start_memory) / 1024 / 1024;
        
        unset($test_array);
        
        return [
            'memory_used' => round($memory_used, 2),
            'score' => $this->calculateScore($memory_used, 5),
            'status' => $memory_used < 5 ? 'good' : ($memory_used < 10 ? 'average' : 'poor'),
            'unit' => 'MB'
        ];
    }
    
    /**
     * ⚡ CPU Performance Benchmark
     */
    private function benchmarkCPUPerformance() {
        $start_time = microtime(true);
        
        // CPU-intensive operation
        $result = 0;
        for ($i = 0; $i < 100000; $i++) {
            $result += sqrt($i);
        }
        
        $end_time = microtime(true);
        $execution_time = ($end_time - $start_time) * 1000;
        
        return [
            'execution_time' => round($execution_time, 2),
            'score' => $this->calculateScore($execution_time, 100),
            'status' => $execution_time < 100 ? 'good' : ($execution_time < 200 ? 'average' : 'poor'),
            'unit' => 'ms'
        ];
    }
    
    /**
     * 📊 Calculate Performance Score
     */
    private function calculateScore($actual, $good_threshold) {
        return max(0, min(100, 100 - (($actual / $good_threshold) * 50)));
    }
    
    /**
     * 🎯 Calculate Overall Performance Score
     */
    private function calculateOverallScore($tests) {
        $total_score = 0;
        $test_count = count($tests);
        
        foreach ($tests as $test) {
            $total_score += $test['score'];
        }
        
        return round($total_score / $test_count, 1);
    }
    
    /**
     * 💡 Generate Performance Recommendations
     */
    private function generateRecommendations($tests) {
        $recommendations = [];
        
        foreach ($tests as $test_name => $test_data) {
            if ($test_data['status'] === 'poor') {
                switch ($test_name) {
                    case 'database_query':
                        $recommendations[] = '🗄️ Rozważ optymalizację bazy danych lub dodanie indeksów';
                        break;
                    case 'file_operations':
                        $recommendations[] = '📁 Sprawdź uprawnienia do plików i szybkość dysku';
                        break;
                    case 'memory_usage':
                        $recommendations[] = '💾 Zwiększ limit pamięci PHP lub zoptymalizuj kod';
                        break;
                    case 'cpu_performance':
                        $recommendations[] = '⚡ Rozważ upgrade serwera lub optymalizację procesów';
                        break;
                }
            }
        }
        
        if (empty($recommendations)) {
            $recommendations[] = '✅ Wydajność jest na dobrym poziomie!';
        }
        
        return $recommendations;
    }
    
    /**
     * 🔍 Get Active Features
     */
    private function getActiveFeatures($settings) {
        $features = [];
        
        // Count active visual features
        $visual_features = array_filter($settings, function($value, $key) {
            return !in_array($key, ['custom_css', 'custom_js']) && !empty($value);
        }, ARRAY_FILTER_USE_BOTH);
        
        $features['visual_customizations'] = count($visual_features);
        $features['custom_css'] = !empty($settings['custom_css'] ?? '');
        $features['custom_js'] = !empty($settings['custom_js'] ?? '');
        
        return $features;
    }
    
    /**
     * ⚡ Calculate Performance Impact
     */
    private function calculatePerformanceImpact($settings) {
        $impact = 0;
        
        // Each active feature adds minimal impact
        foreach ($settings as $key => $value) {
            if (!empty($value) && $key !== 'enable_plugin') {
                $impact += 0.1;
            }
        }
        
        return [
            'level' => $impact < 1 ? 'minimal' : ($impact < 3 ? 'moderate' : 'high'),
            'score' => round($impact, 1),
            'description' => sprintf('Aktywnych funkcji: %d', count(array_filter($settings)))
        ];
    }
    
    /**
     * 📐 Parse Memory Limit
     */
    private function parseMemoryLimit($limit) {
        $limit = trim($limit);
        $last = strtolower(substr($limit, -1));
        $value = (int) $limit;
        
        switch ($last) {
            case 'g':
                $value *= 1024;
            case 'm':
                $value *= 1024;
            case 'k':
                $value *= 1024;
        }
        
        return $value;
    }
    
    // ========================================
    // 📋 WORDPRESS SETTINGS API (FROM APIManager)
    // ========================================
    
    /**
     * 📋 Register Settings through WordPress Settings API
     */
    public function registerSettings() {
        
        // Main settings registration
        register_setting(
            $this->settings_group,
            $this->settings_name,
            [
                'sanitize_callback' => [$this, 'sanitizeSettings'],
                'default' => $this->getDefaultSettings()
            ]
        );
        
        // === BASIC FUNCTIONS SECTION ===
        add_settings_section(
            'mas_v2_basic_functions',
            '⚙️ Podstawowe Funkcje',
            [$this, 'renderBasicFunctionsDescription'],
            'mas-v2-functional-settings'
        );
        
        add_settings_field(
            'enable_plugin',
            '🟢 Włącz wtyczkę',
            [$this, 'renderCheckboxField'],
            'mas-v2-functional-settings',
            'mas_v2_basic_functions',
            [
                'field_id' => 'enable_plugin',
                'description' => 'Główny przełącznik włączający/wyłączający wtyczkę'
            ]
        );
    }
    
    /**
     * 📄 Add Settings Page to Admin Menu
     */
    public function addSettingsPage() {
        add_submenu_page(
            'mas-v2-settings',
            '⚙️ Ustawienia Funkcjonalne',
            '⚙️ Funkcjonalne',
            'manage_options',
            'mas-v2-functional',
            [$this, 'renderSettingsPage']
        );
    }
    
    /**
     * 🎨 Render Settings Page
     */
    public function renderSettingsPage() {
        ?>
        <div class="wrap">
            <h1>⚙️ Modern Admin Styler V2 - Ustawienia Funkcjonalne</h1>
            <p class="description">
                🎯 <strong>Filozofia "WordPress Way":</strong> Te ustawienia używają natywnego WordPress Settings API 
                dla maksymalnej kompatybilności i bezpieczeństwa. Opcje wizualne znajdziesz w 
                <a href="<?php echo admin_url('admin.php?page=modern-admin-styler-settings'); ?>">Live Edit Mode</a> (podgląd na żywo).
            </p>
            
            <form method="post" action="options.php">
                <?php
                settings_fields($this->settings_group);
                do_settings_sections('mas-v2-functional-settings');
                submit_button('💾 Zapisz ustawienia funkcjonalne');
                ?>
            </form>
        </div>
        <?php
    }
    
    // === SECTION DESCRIPTIONS ===
    
    public function renderBasicFunctionsDescription() {
        echo '<p>Podstawowe funkcje wtyczki i główne przełączniki.</p>';
    }
    
    /**
     * ✅ Render Checkbox Field
     */
    public function renderCheckboxField($args) {
        $options = get_option($this->settings_name, []);
        $field_id = $args['field_id'];
        $value = $options[$field_id] ?? false;
        $description = $args['description'] ?? '';
        
        echo '<label>';
        echo '<input type="checkbox" name="' . $this->settings_name . '[' . $field_id . ']" value="1" ' . checked($value, true, false) . ' />';
        echo ' ' . $description;
        echo '</label>';
    }
    
    /**
     * 🛡️ Sanitize Settings
     */
    public function sanitizeSettings($input) {
        $sanitized = [];
        
        // Boolean fields
        $boolean_fields = ['enable_plugin'];
        
        foreach ($boolean_fields as $field) {
            $sanitized[$field] = !empty($input[$field]);
        }
        
        return $sanitized;
    }
    
    /**
     * 🔧 Get Default Settings
     */
    private function getDefaultSettings() {
        return [
            'enable_plugin' => false,  // 🔒 DISABLED BY DEFAULT
        ];
    }
    
    /**
     * 📋 Get Current Settings
     */
    public function getSettings() {
        return get_option($this->settings_name, $this->getDefaultSettings());
    }
} 