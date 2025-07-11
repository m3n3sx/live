<?php
/**
 * Consolidated API Manager Service
 * 
 * Combines RestAPI + SettingsAPI functionality:
 * - REST API endpoints for diagnostics and enterprise features
 * - WordPress Settings API integration for functional options
 * - Unified API management system
 * 
 * @package ModernAdminStyler\Services
 * @version 2.2.0
 */

namespace ModernAdminStyler\Services;

class APIManager {
    
    // REST API Configuration
    private $rest_namespace = 'modern-admin-styler/v2';
    
    // Settings API Configuration
    private $settings_group = 'mas_v2_functional_settings';
    private $settings_name = 'mas_v2_functional_settings';
    
    // Service Dependencies
    private $cache_manager;
    private $security_manager;
    private $metrics_collector;
    private $settings_manager;
    private $preset_manager;
    
    public function __construct($cache_manager, $security_manager, $metrics_collector, $settings_manager, $preset_manager = null) {
        $this->cache_manager = $cache_manager;
        $this->security_manager = $security_manager;
        $this->metrics_collector = $metrics_collector;
        $this->settings_manager = $settings_manager;
        $this->preset_manager = $preset_manager;
        
        $this->init();
    }
    
    /**
     * 🚀 Initialize API Manager
     */
    public function init() {
        // REST API initialization
        add_action('rest_api_init', [$this, 'registerRestEndpoints']);
        
        // Settings API initialization
        add_action('admin_init', [$this, 'registerSettings']);
        add_action('admin_menu', [$this, 'addSettingsPage']);
        
        // AJAX handlers for import/export
        add_action('wp_ajax_mas_v2_import_functional_settings', [$this, 'handleImportSettings']);
    }
    
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
            $result = $this->cache_manager->flush($type);
            
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
            $stats = $this->cache_manager->getStats();
            
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
            $scan_results = $this->security_manager->runScan($deep_scan);
            
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
            $report = $this->metrics_collector->generateReport($period);
            
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
    public function runPerformanceBenchmark() {
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
            'plugin_version' => MAS_V2_VERSION ?? '2.2.0',
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
            'cache_status' => $this->cache_manager->getStatus(),
            'security_level' => $this->security_manager->getSecurityLevel()
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
    public function regenerateCSS() {
        try {
            // Clear CSS cache
            delete_transient('mas_v2_generated_css');
            
            // Regenerate CSS through StyleGenerator
            $style_generator = new StyleGenerator($this->settings_manager, $this->cache_manager);
            $new_css = $style_generator->generateCSS();
            
            return new \WP_REST_Response([
                'success' => true,
                'message' => '🎨 CSS został zregenerowany',
                'data' => [
                    'css_size' => strlen($new_css),
                    'css_lines' => substr_count($new_css, "\n")
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
    
    // === PRESET ENDPOINT HANDLERS ===
    
    /**
     * 🎯 Get All Presets
     */
    public function getPresets(\WP_REST_Request $request) {
        if (!$this->preset_manager) {
            return new \WP_REST_Response([
                'success' => false,
                'message' => '❌ Preset Manager nie jest dostępny'
            ], 404);
        }
        
        try {
            $presets = $this->preset_manager->getAllPresets();
            
            return new \WP_REST_Response([
                'success' => true,
                'data' => $presets,
                'count' => count($presets),
                'timestamp' => current_time('mysql')
            ], 200);
            
        } catch (\Exception $e) {
            return new \WP_REST_Response([
                'success' => false,
                'message' => '❌ Błąd podczas pobierania presetów: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * 💾 Save New Preset
     */
    public function savePreset(\WP_REST_Request $request) {
        if (!$this->preset_manager) {
            return new \WP_REST_Response([
                'success' => false,
                'message' => '❌ Preset Manager nie jest dostępny'
            ], 404);
        }
        
        $name = $request->get_param('name');
        $settings = $request->get_param('settings');
        $description = $request->get_param('description') ?? '';
        
        try {
            $preset_id = $this->preset_manager->savePreset($name, $settings, $description);
            
            return new \WP_REST_Response([
                'success' => true,
                'message' => '✅ Preset został zapisany',
                'data' => [
                    'preset_id' => $preset_id,
                    'name' => $name
                ],
                'timestamp' => current_time('mysql')
            ], 201);
            
        } catch (\Exception $e) {
            return new \WP_REST_Response([
                'success' => false,
                'message' => '❌ Błąd podczas zapisywania presetu: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * 🔍 Get Single Preset
     */
    public function getPreset(\WP_REST_Request $request) {
        if (!$this->preset_manager) {
            return new \WP_REST_Response([
                'success' => false,
                'message' => '❌ Preset Manager nie jest dostępny'
            ], 404);
        }
        
        $preset_id = $request->get_param('id');
        
        try {
            $preset = $this->preset_manager->getPreset($preset_id);
            
            if (!$preset) {
                return new \WP_REST_Response([
                    'success' => false,
                    'message' => '❌ Preset nie został znaleziony'
                ], 404);
            }
            
            return new \WP_REST_Response([
                'success' => true,
                'data' => $preset,
                'timestamp' => current_time('mysql')
            ], 200);
            
        } catch (\Exception $e) {
            return new \WP_REST_Response([
                'success' => false,
                'message' => '❌ Błąd podczas pobierania presetu: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * ✏️ Update Preset
     */
    public function updatePreset(\WP_REST_Request $request) {
        if (!$this->preset_manager) {
            return new \WP_REST_Response([
                'success' => false,
                'message' => '❌ Preset Manager nie jest dostępny'
            ], 404);
        }
        
        $preset_id = $request->get_param('id');
        $updates = $request->get_json_params();
        
        try {
            $result = $this->preset_manager->updatePreset($preset_id, $updates);
            
            return new \WP_REST_Response([
                'success' => true,
                'message' => '✅ Preset został zaktualizowany',
                'data' => $result,
                'timestamp' => current_time('mysql')
            ], 200);
            
        } catch (\Exception $e) {
            return new \WP_REST_Response([
                'success' => false,
                'message' => '❌ Błąd podczas aktualizacji presetu: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * 🗑️ Delete Preset
     */
    public function deletePreset(\WP_REST_Request $request) {
        if (!$this->preset_manager) {
            return new \WP_REST_Response([
                'success' => false,
                'message' => '❌ Preset Manager nie jest dostępny'
            ], 404);
        }
        
        $preset_id = $request->get_param('id');
        
        try {
            $result = $this->preset_manager->deletePreset($preset_id);
            
            return new \WP_REST_Response([
                'success' => true,
                'message' => '✅ Preset został usunięty',
                'timestamp' => current_time('mysql')
            ], 200);
            
        } catch (\Exception $e) {
            return new \WP_REST_Response([
                'success' => false,
                'message' => '❌ Błąd podczas usuwania presetu: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * 🎯 Apply Preset
     */
    public function applyPreset(\WP_REST_Request $request) {
        if (!$this->preset_manager) {
            return new \WP_REST_Response([
                'success' => false,
                'message' => '❌ Preset Manager nie jest dostępny'
            ], 404);
        }
        
        $preset_id = $request->get_param('id');
        
        try {
            $result = $this->preset_manager->applyPreset($preset_id);
            
            return new \WP_REST_Response([
                'success' => true,
                'message' => '✅ Preset został zastosowany',
                'data' => $result,
                'timestamp' => current_time('mysql')
            ], 200);
            
        } catch (\Exception $e) {
            return new \WP_REST_Response([
                'success' => false,
                'message' => '❌ Błąd podczas aplikowania presetu: ' . $e->getMessage()
            ], 500);
        }
    }
    
    // === BENCHMARK METHODS ===
    
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
    
    // === WORDPRESS SETTINGS API ===
    
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
        
        // === OPTIMIZATION SECTION ===
        add_settings_section(
            'mas_v2_optimization',
            '🚀 Optymalizacja',
            [$this, 'renderOptimizationDescription'],
            'mas-v2-functional-settings'
        );
        
        add_settings_field(
            'disable_emojis',
            '😀 Wyłącz Emoji',
            [$this, 'renderCheckboxField'],
            'mas-v2-functional-settings',
            'mas_v2_optimization',
            [
                'field_id' => 'disable_emojis',
                'description' => 'Usuwa skrypty emoji, przyspiesza ładowanie'
            ]
        );
        
        add_settings_field(
            'disable_embeds',
            '📺 Wyłącz Embeds',
            [$this, 'renderCheckboxField'],
            'mas-v2-functional-settings',
            'mas_v2_optimization',
            [
                'field_id' => 'disable_embeds',
                'description' => 'Wyłącza automatyczne osadzanie treści zewnętrznych'
            ]
        );
        
        add_settings_field(
            'disable_jquery_migrate',
            '⚡ Wyłącz jQuery Migrate',
            [$this, 'renderCheckboxField'],
            'mas-v2-functional-settings',
            'mas_v2_optimization',
            [
                'field_id' => 'disable_jquery_migrate',
                'description' => 'Usuwa przestarzały jQuery Migrate, przyspiesza stronę'
            ]
        );
        
        // === HIDE ELEMENTS SECTION ===
        add_settings_section(
            'mas_v2_hide_elements',
            '👁️ Ukrywanie Elementów',
            [$this, 'renderHideElementsDescription'],
            'mas-v2-functional-settings'
        );
        
        add_settings_field(
            'hide_wp_version',
            '🔒 Ukryj wersję WP',
            [$this, 'renderCheckboxField'],
            'mas-v2-functional-settings',
            'mas_v2_hide_elements',
            [
                'field_id' => 'hide_wp_version',
                'description' => 'Ukrywa wersję WordPress ze względów bezpieczeństwa'
            ]
        );
        
        add_settings_field(
            'hide_admin_notices',
            '🔕 Ukryj powiadomienia admina',
            [$this, 'renderCheckboxField'],
            'mas-v2-functional-settings',
            'mas_v2_hide_elements',
            [
                'field_id' => 'hide_admin_notices',
                'description' => 'Ukrywa irytujące powiadomienia wtyczek'
            ]
        );
        
        add_settings_field(
            'hide_help_tab',
            '❓ Ukryj zakładkę Pomoc',
            [$this, 'renderCheckboxField'],
            'mas-v2-functional-settings',
            'mas_v2_hide_elements',
            [
                'field_id' => 'hide_help_tab',
                'description' => 'Usuwa zakładkę "Pomoc" z górnego paska'
            ]
        );
        
        add_settings_field(
            'hide_screen_options',
            '📋 Ukryj opcje ekranu',
            [$this, 'renderCheckboxField'],
            'mas-v2-functional-settings',
            'mas_v2_hide_elements',
            [
                'field_id' => 'hide_screen_options',
                'description' => 'Usuwa przycisk "Opcje ekranu"'
            ]
        );
        
        // === IMPORT/EXPORT SECTION ===
        add_settings_section(
            'mas_v2_import_export',
            '📦 Import/Export',
            [$this, 'renderImportExportDescription'],
            'mas-v2-functional-settings'
        );
        
        add_settings_field(
            'import_export_info',
            '📁 Zarządzanie ustawieniami',
            [$this, 'renderImportExportField'],
            'mas-v2-functional-settings',
            'mas_v2_import_export'
        );
        
        // === CUSTOM CODE SECTION ===
        add_settings_section(
            'mas_v2_custom_code',
            '💻 Własny Kod',
            [$this, 'renderCustomCodeDescription'],
            'mas-v2-functional-settings'
        );
        
        add_settings_field(
            'custom_css',
            '🎨 Własny CSS',
            [$this, 'renderTextareaField'],
            'mas-v2-functional-settings',
            'mas_v2_custom_code',
            [
                'field_id' => 'custom_css',
                'description' => 'Dodatkowy CSS aplikowany globalnie',
                'rows' => 10
            ]
        );
        
        add_settings_field(
            'custom_js',
            '⚡ Własny JavaScript',
            [$this, 'renderTextareaField'],
            'mas-v2-functional-settings',
            'mas_v2_custom_code',
            [
                'field_id' => 'custom_js',
                'description' => 'Dodatkowy JavaScript wykonywany w panelu admina',
                'rows' => 10
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
            
            <div class="mas-v2-info-box" style="background: #f0f6ff; border-left: 4px solid #3b82f6; padding: 15px; margin-top: 20px;">
                <h3>🚀 Strategia Integracji</h3>
                                    <p><strong>Opcje wizualne</strong> → <a href="<?php echo admin_url('admin.php?page=modern-admin-styler-settings'); ?>">Live Edit Mode</a> (podgląd na żywo)</p>
                <p><strong>Opcje funkcjonalne</strong> → Ta strona (WordPress Settings API)</p>
                <p><strong>Narzędzia diagnostyczne</strong> → REST API endpoints</p>
            </div>
        </div>
        <?php
    }
    
    // === SECTION DESCRIPTIONS ===
    
    public function renderBasicFunctionsDescription() {
        echo '<p>Podstawowe funkcje wtyczki i główne przełączniki.</p>';
    }
    
    public function renderOptimizationDescription() {
        echo '<p>Opcje optymalizacji wydajności WordPress - usuń zbędne skrypty i funkcje.</p>';
    }
    
    public function renderHideElementsDescription() {
        echo '<p>Ukryj niepotrzebne elementy interfejsu dla czystszego panelu administracyjnego.</p>';
    }
    
    public function renderImportExportDescription() {
        echo '<p>Zarządzanie konfiguracją wtyczki - import i export ustawień.</p>';
    }
    
    public function renderCustomCodeDescription() {
        echo '<p>Dodaj własny CSS i JavaScript do panelu administracyjnego.</p>';
    }
    
    // === FIELD RENDERING METHODS ===
    
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
     * 📝 Render Textarea Field
     */
    public function renderTextareaField($args) {
        $options = get_option($this->settings_name, []);
        $field_id = $args['field_id'];
        $value = $options[$field_id] ?? '';
        $description = $args['description'] ?? '';
        $rows = $args['rows'] ?? 5;
        
        echo '<textarea name="' . $this->settings_name . '[' . $field_id . ']" rows="' . $rows . '" cols="70" class="large-text code">';
        echo esc_textarea($value);
        echo '</textarea>';
        
        if ($description) {
            echo '<p class="description">' . $description . '</p>';
        }
    }
    
    /**
     * 📁 Render Import/Export Field
     */
    public function renderImportExportField() {
        ?>
        <div class="mas-v2-import-export-controls">
            <p class="description">Użyj przycisków poniżej do zarządzania konfiguracją:</p>
            
            <p>
                <button type="button" class="button" id="mas-v2-export-functional">
                    📤 Eksportuj ustawienia funkcjonalne
                </button>
                <button type="button" class="button" id="mas-v2-import-functional">
                    📥 Importuj ustawienia funkcjonalne
                </button>
            </p>
            
            <input type="file" id="mas-v2-import-file" accept=".json" style="display: none;">
        </div>
        
        <script>
        document.addEventListener('DOMContentLoaded', function() {
            // Export functionality
            document.getElementById('mas-v2-export-functional').addEventListener('click', function() {
                const settings = <?php echo json_encode(get_option($this->settings_name, [])); ?>;
                const blob = new Blob([JSON.stringify(settings, null, 2)], {type: 'application/json'});
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'mas-v2-functional-settings-' + new Date().toISOString().split('T')[0] + '.json';
                a.click();
                URL.revokeObjectURL(url);
            });
            
            // Import functionality
            document.getElementById('mas-v2-import-functional').addEventListener('click', function() {
                document.getElementById('mas-v2-import-file').click();
            });
            
            document.getElementById('mas-v2-import-file').addEventListener('change', function(e) {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        try {
                            const settings = JSON.parse(e.target.result);
                            fetch(ajaxurl, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/x-www-form-urlencoded',
                                },
                                body: new URLSearchParams({
                                    action: 'mas_v2_import_functional_settings',
                                    settings: JSON.stringify(settings),
                                    nonce: '<?php echo wp_create_nonce('mas_v2_import_functional'); ?>'
                                })
                            })
                            .then(response => response.json())
                            .then(data => {
                                if (data.success) {
                                    alert('✅ Ustawienia zostały zaimportowane pomyślnie!');
                                    location.reload();
                                } else {
                                    alert('❌ Błąd importu: ' + (data.data || 'Nieznany błąd'));
                                }
                            });
                        } catch (error) {
                            alert('❌ Nieprawidłowy format pliku JSON');
                        }
                    };
                    reader.readAsText(file);
                }
            });
        });
        </script>
        <?php
    }
    
    /**
     * 📥 Handle Import Settings AJAX
     */
    public function handleImportSettings() {
        // Verify nonce
        if (!wp_verify_nonce($_POST['nonce'], 'mas_v2_import_functional')) {
            wp_die('Security check failed');
        }
        
        // Check permissions
        if (!current_user_can('manage_options')) {
            wp_die('Insufficient permissions');
        }
        
        try {
            $settings = json_decode(stripslashes($_POST['settings']), true);
            
            if (json_last_error() !== JSON_ERROR_NONE) {
                throw new \Exception('Invalid JSON format');
            }
            
            // Sanitize imported settings
            $sanitized_settings = $this->sanitizeSettings($settings);
            
            // Update settings
            update_option($this->settings_name, $sanitized_settings);
            
            wp_send_json_success('Settings imported successfully');
            
        } catch (\Exception $e) {
            wp_send_json_error('Import failed: ' . $e->getMessage());
        }
    }
    
    /**
     * 🛡️ Sanitize Settings
     */
    public function sanitizeSettings($input) {
        $sanitized = [];
        
        // Boolean fields
        $boolean_fields = [
            'enable_plugin', 'disable_emojis', 'disable_embeds', 'disable_jquery_migrate',
            'hide_wp_version', 'hide_admin_notices', 'hide_help_tab', 'hide_screen_options'
        ];
        
        foreach ($boolean_fields as $field) {
            $sanitized[$field] = !empty($input[$field]);
        }
        
        // Text fields
        if (isset($input['custom_css'])) {
            $sanitized['custom_css'] = wp_strip_all_tags($input['custom_css']);
        }
        
        if (isset($input['custom_js'])) {
            $sanitized['custom_js'] = wp_strip_all_tags($input['custom_js']);
        }
        
        return $sanitized;
    }
    
    /**
     * 🔧 Get Default Settings
     */
    private function getDefaultSettings() {
        return [
            'enable_plugin' => false,  // 🔒 DISABLED BY DEFAULT
            'disable_emojis' => false,
            'disable_embeds' => false,
            'disable_jquery_migrate' => false,
            'hide_wp_version' => false,
            'hide_admin_notices' => false,
            'hide_help_tab' => false,
            'hide_screen_options' => false,
            'custom_css' => '',
            'custom_js' => ''
        ];
    }
    
    /**
     * 📋 Get Current Settings
     */
    public function getSettings() {
        return get_option($this->settings_name, $this->getDefaultSettings());
    }
} 