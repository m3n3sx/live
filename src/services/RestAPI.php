<?php
/**
 * REST API Integration Service
 * 
 * Faza 1: Implementacja WordPress REST API
 * Obsługuje narzędzia diagnostyczne i Enterprise funkcje przez natywne REST API
 * 
 * @package ModernAdminStyler\Services
 * @version 2.2.0
 */

namespace ModernAdminStyler\Services;

class RestAPI {
    
    private $namespace = 'modern-admin-styler/v2';
    private $cache_manager;
    private $security_service;
    private $metrics_collector;
    private $preset_manager;
    
    public function __construct($cache_manager, $security_service, $metrics_collector, $preset_manager = null) {
        $this->cache_manager = $cache_manager;
        $this->security_service = $security_service;
        $this->metrics_collector = $metrics_collector;
        $this->preset_manager = $preset_manager;
        $this->init();
    }
    
    /**
     * Inicjalizacja REST API endpoints
     */
    public function init() {
        add_action('rest_api_init', [$this, 'registerEndpoints']);
    }
    
    /**
     * Rejestracja wszystkich endpoints
     */
    public function registerEndpoints() {
        
        // === CACHE MANAGEMENT ===
        register_rest_route($this->namespace, '/cache/flush', [
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
        
        register_rest_route($this->namespace, '/cache/stats', [
            'methods' => 'GET',
            'callback' => [$this, 'getCacheStats'],
            'permission_callback' => [$this, 'checkPermissions']
        ]);
        
        // === SECURITY SCAN ===
        register_rest_route($this->namespace, '/security/scan', [
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
        register_rest_route($this->namespace, '/metrics/report', [
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
        
        register_rest_route($this->namespace, '/metrics/benchmark', [
            'methods' => 'POST',
            'callback' => [$this, 'runPerformanceBenchmark'],
            'permission_callback' => [$this, 'checkPermissions']
        ]);
        
        // === DATABASE OPERATIONS ===
        register_rest_route($this->namespace, '/database/check', [
            'methods' => 'GET',
            'callback' => [$this, 'checkDatabase'],
            'permission_callback' => [$this, 'checkPermissions']
        ]);
        
        register_rest_route($this->namespace, '/database/optimize', [
            'methods' => 'POST',
            'callback' => [$this, 'optimizeDatabase'],
            'permission_callback' => [$this, 'checkPermissions']
        ]);
        
        // === CSS GENERATION ===
        register_rest_route($this->namespace, '/css/regenerate', [
            'methods' => 'POST',
            'callback' => [$this, 'regenerateCSS'],
            'permission_callback' => [$this, 'checkPermissions']
        ]);
        
        // === SYSTEM INFO ===
        register_rest_route($this->namespace, '/system/info', [
            'methods' => 'GET',
            'callback' => [$this, 'getSystemInfo'],
            'permission_callback' => [$this, 'checkPermissions']
        ]);
        
        // === PLUGIN STATUS ===
        register_rest_route($this->namespace, '/status', [
            'methods' => 'GET',
            'callback' => [$this, 'getPluginStatus'],
            'permission_callback' => [$this, 'checkPermissions']
        ]);
        
        // === PRESET MANAGEMENT ===
        if ($this->preset_manager) {
            $this->registerPresetEndpoints();
        }
    }
    
    /**
     * 🎨 Register Preset Management Endpoints
     * Enterprise-grade preset system REST API
     */
    private function registerPresetEndpoints() {
        // GET all presets
        register_rest_route($this->namespace, '/presets', [
            'methods' => 'GET',
            'callback' => [$this, 'getPresets'],
            'permission_callback' => [$this, 'checkPermissions'],
            'args' => [
                'search' => [
                    'required' => false,
                    'type' => 'string',
                    'description' => 'Search presets by name'
                ],
                'orderby' => [
                    'required' => false,
                    'type' => 'string',
                    'enum' => ['name', 'date', 'modified'],
                    'default' => 'name'
                ],
                'order' => [
                    'required' => false,
                    'type' => 'string',
                    'enum' => ['ASC', 'DESC'],
                    'default' => 'ASC'
                ]
            ]
        ]);
        
        // POST new preset
        register_rest_route($this->namespace, '/presets', [
            'methods' => 'POST',
            'callback' => [$this, 'savePreset'],
            'permission_callback' => [$this, 'checkPermissions'],
            'args' => [
                'name' => [
                    'required' => true,
                    'type' => 'string',
                    'description' => 'Preset name',
                    'validate_callback' => function($param) {
                        return !empty(trim($param));
                    }
                ],
                'description' => [
                    'required' => false,
                    'type' => 'string',
                    'description' => 'Preset description'
                ],
                'settings' => [
                    'required' => true,
                    'type' => 'object',
                    'description' => 'Preset settings data'
                ]
            ]
        ]);
        
        // GET single preset by ID
        register_rest_route($this->namespace, '/presets/(?P<id>\d+)', [
            'methods' => 'GET',
            'callback' => [$this, 'getPreset'],
            'permission_callback' => [$this, 'checkPermissions'],
            'args' => [
                'id' => [
                    'required' => true,
                    'type' => 'integer',
                    'validate_callback' => 'is_numeric'
                ]
            ]
        ]);
        
        // PUT/PATCH update preset
        register_rest_route($this->namespace, '/presets/(?P<id>\d+)', [
            'methods' => ['PUT', 'PATCH'],
            'callback' => [$this, 'updatePreset'],
            'permission_callback' => [$this, 'checkPermissions'],
            'args' => [
                'id' => [
                    'required' => true,
                    'type' => 'integer',
                    'validate_callback' => 'is_numeric'
                ],
                'name' => [
                    'required' => false,
                    'type' => 'string'
                ],
                'description' => [
                    'required' => false,
                    'type' => 'string'
                ],
                'settings' => [
                    'required' => false,
                    'type' => 'object'
                ]
            ]
        ]);
        
        // DELETE preset
        register_rest_route($this->namespace, '/presets/(?P<id>\d+)', [
            'methods' => 'DELETE',
            'callback' => [$this, 'deletePreset'],
            'permission_callback' => [$this, 'checkPermissions'],
            'args' => [
                'id' => [
                    'required' => true,
                    'type' => 'integer',
                    'validate_callback' => 'is_numeric'
                ]
            ]
        ]);
        
        // POST apply preset
        register_rest_route($this->namespace, '/presets/(?P<id>\d+)/apply', [
            'methods' => 'POST',
            'callback' => [$this, 'applyPreset'],
            'permission_callback' => [$this, 'checkPermissions'],
            'args' => [
                'id' => [
                    'required' => true,
                    'type' => 'integer',
                    'validate_callback' => 'is_numeric'
                ]
            ]
        ]);
        
        // GET preset export
        register_rest_route($this->namespace, '/presets/(?P<id>\d+)/export', [
            'methods' => 'GET',
            'callback' => [$this, 'exportPreset'],
            'permission_callback' => [$this, 'checkPermissions'],
            'args' => [
                'id' => [
                    'required' => true,
                    'type' => 'integer',
                    'validate_callback' => 'is_numeric'
                ]
            ]
        ]);
        
        // POST preset import
        register_rest_route($this->namespace, '/presets/import', [
            'methods' => 'POST',
            'callback' => [$this, 'importPreset'],
            'permission_callback' => [$this, 'checkPermissions'],
            'args' => [
                'data' => [
                    'required' => true,
                    'type' => 'string',
                    'description' => 'JSON preset data'
                ],
                'name' => [
                    'required' => false,
                    'type' => 'string',
                    'description' => 'Override preset name'
                ]
            ]
        ]);
    }
    
    /**
     * Sprawdzenie uprawnień
     */
    public function checkPermissions() {
        return current_user_can('manage_options');
    }
    
    /**
     * === CACHE ENDPOINTS ===
     */
    
    /**
     * Wyczyszczenie cache
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
     * Statystyki cache
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
     * === SECURITY ENDPOINTS ===
     */
    
    /**
     * Skan bezpieczeństwa
     */
    public function runSecurityScan(\WP_REST_Request $request) {
        $deep_scan = $request->get_param('deep_scan');
        
        try {
            $scan_results = $this->security_service->runScan($deep_scan);
            
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
     * === METRICS ENDPOINTS ===
     */
    
    /**
     * Raport metryk wydajności
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
     * Benchmark wydajności
     */
    public function runPerformanceBenchmark() {
        try {
            $benchmark_start = microtime(true);
            
            // Testy wydajności
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
     * === DATABASE ENDPOINTS ===
     */
    
    /**
     * Sprawdzenie bazy danych
     */
    public function checkDatabase() {
        global $wpdb;
        
        try {
            $results = [
                'connection_status' => $this->testDatabaseConnection(),
                'table_status' => $this->checkTableStatus(),
                'index_analysis' => $this->analyzeIndexes(),
                'size_analysis' => $this->analyzeDatabaseSize()
            ];
            
            return new \WP_REST_Response([
                'success' => true,
                'data' => $results,
                'timestamp' => current_time('mysql')
            ], 200);
            
        } catch (\Exception $e) {
            return new \WP_REST_Response([
                'success' => false,
                'message' => '❌ Błąd podczas sprawdzania bazy danych: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Optymalizacja bazy danych
     */
    public function optimizeDatabase() {
        global $wpdb;
        
        try {
            $results = [];
            
            // Optymalizacja tabel
            $tables = $wpdb->get_results("SHOW TABLES", ARRAY_N);
            foreach ($tables as $table) {
                $table_name = $table[0];
                $result = $wpdb->query("OPTIMIZE TABLE `$table_name`");
                $results['optimized_tables'][] = [
                    'table' => $table_name,
                    'status' => $result ? 'success' : 'failed'
                ];
            }
            
            // Czyszczenie transients
            $wpdb->query("DELETE FROM {$wpdb->options} WHERE option_name LIKE '_transient_%'");
            $results['transients_cleaned'] = $wpdb->rows_affected;
            
            return new \WP_REST_Response([
                'success' => true,
                'message' => '🚀 Optymalizacja bazy danych zakończona',
                'data' => $results,
                'timestamp' => current_time('mysql')
            ], 200);
            
        } catch (\Exception $e) {
            return new \WP_REST_Response([
                'success' => false,
                'message' => '❌ Błąd podczas optymalizacji: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * === CSS ENDPOINTS ===
     */
    
    /**
     * Regeneracja CSS
     */
    public function regenerateCSS() {
        try {
            // Wyczyść cache CSS
            delete_transient('mas_v2_generated_css');
            
            // Regeneruj CSS
            $css_generator = new \ModernAdminStyler\Services\CSSGenerator();
            $new_css = $css_generator->generateCSS();
            
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
    
    /**
     * === SYSTEM INFO ENDPOINTS ===
     */
    
    /**
     * Informacje o systemie
     */
    public function getSystemInfo() {
        return new \WP_REST_Response([
            'success' => true,
            'data' => [
                'wordpress' => [
                    'version' => get_bloginfo('version'),
                    'multisite' => is_multisite(),
                    'debug_mode' => WP_DEBUG,
                    'memory_limit' => WP_MEMORY_LIMIT
                ],
                'server' => [
                    'php_version' => PHP_VERSION,
                    'server_software' => $_SERVER['SERVER_SOFTWARE'] ?? 'Unknown',
                    'max_execution_time' => ini_get('max_execution_time'),
                    'memory_limit' => ini_get('memory_limit'),
                    'upload_max_filesize' => ini_get('upload_max_filesize')
                ],
                'plugin' => [
                    'version' => MAS_V2_VERSION,
                    'active_since' => get_option('mas_v2_activation_time', 'Unknown')
                ]
            ],
            'timestamp' => current_time('mysql')
        ], 200);
    }
    
    /**
     * Status wtyczki
     */
    public function getPluginStatus() {
        $settings = get_option('mas_v2_settings', []);
        
        return new \WP_REST_Response([
            'success' => true,
            'data' => [
                'plugin_enabled' => $settings['enable_plugin'] ?? false,
                'active_features' => $this->getActiveFeatures($settings),
                'performance_impact' => $this->calculatePerformanceImpact($settings),
                'last_update' => get_option('mas_v2_last_update', 'Never')
            ],
            'timestamp' => current_time('mysql')
        ], 200);
    }
    
    /**
     * === HELPER METHODS ===
     */
    
    private function benchmarkDatabaseQuery() {
        global $wpdb;
        $start = microtime(true);
        $wpdb->get_results("SELECT * FROM {$wpdb->posts} LIMIT 10");
        $end = microtime(true);
        
        return [
            'time' => round(($end - $start) * 1000, 2), // ms
            'score' => $this->calculateScore($end - $start, 0.01) // Good if under 10ms
        ];
    }
    
    private function benchmarkFileOperations() {
        $start = microtime(true);
        $temp_file = wp_upload_dir()['basedir'] . '/mas_v2_benchmark.tmp';
        file_put_contents($temp_file, str_repeat('test', 1000));
        $content = file_get_contents($temp_file);
        unlink($temp_file);
        $end = microtime(true);
        
        return [
            'time' => round(($end - $start) * 1000, 2),
            'score' => $this->calculateScore($end - $start, 0.005)
        ];
    }
    
    private function benchmarkMemoryUsage() {
        $start_memory = memory_get_usage();
        $data = array_fill(0, 10000, 'memory test');
        $peak_memory = memory_get_peak_usage();
        unset($data);
        
        return [
            'peak_usage_mb' => round($peak_memory / 1024 / 1024, 2),
            'score' => $this->calculateScore($peak_memory / 1024 / 1024, 50) // Good if under 50MB
        ];
    }
    
    private function benchmarkCPUPerformance() {
        $start = microtime(true);
        for ($i = 0; $i < 100000; $i++) {
            md5($i);
        }
        $end = microtime(true);
        
        return [
            'time' => round(($end - $start) * 1000, 2),
            'score' => $this->calculateScore($end - $start, 0.1)
        ];
    }
    
    private function calculateScore($actual, $good_threshold) {
        if ($actual <= $good_threshold) return 100;
        if ($actual <= $good_threshold * 2) return 75;
        if ($actual <= $good_threshold * 5) return 50;
        return 25;
    }
    
    private function calculateOverallScore($tests) {
        $total_score = 0;
        $count = 0;
        
        foreach ($tests as $test) {
            if (isset($test['score'])) {
                $total_score += $test['score'];
                $count++;
            }
        }
        
        return $count > 0 ? round($total_score / $count) : 0;
    }
    
    private function generateRecommendations($tests) {
        $recommendations = [];
        
        foreach ($tests as $test_name => $test_data) {
            if (isset($test_data['score']) && $test_data['score'] < 75) {
                switch ($test_name) {
                    case 'database_query':
                        $recommendations[] = '🗄️ Rozważ optymalizację bazy danych lub dodanie indeksów';
                        break;
                    case 'file_operations':
                        $recommendations[] = '📁 Sprawdź uprawnienia plików i wydajność dysku';
                        break;
                    case 'memory_usage':
                        $recommendations[] = '🧠 Rozważ zwiększenie limitu pamięci PHP';
                        break;
                    case 'cpu_performance':
                        $recommendations[] = '⚡ Serwer może potrzebować więcej mocy obliczeniowej';
                        break;
                }
            }
        }
        
        return $recommendations;
    }
    
    private function testDatabaseConnection() {
        global $wpdb;
        return $wpdb->check_connection() ? 'connected' : 'failed';
    }
    
    private function checkTableStatus() {
        global $wpdb;
        return $wpdb->get_results("SHOW TABLE STATUS");
    }
    
    private function analyzeIndexes() {
        global $wpdb;
        $indexes = [];
        $tables = $wpdb->get_results("SHOW TABLES", ARRAY_N);
        
        foreach ($tables as $table) {
            $table_name = $table[0];
            $table_indexes = $wpdb->get_results("SHOW INDEX FROM `$table_name`");
            $indexes[$table_name] = count($table_indexes);
        }
        
        return $indexes;
    }
    
    private function analyzeDatabaseSize() {
        global $wpdb;
        
        $size_query = "
            SELECT 
                ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS 'DB Size in MB'
            FROM information_schema.tables 
            WHERE table_schema = %s
        ";
        
        return $wpdb->get_var($wpdb->prepare($size_query, DB_NAME));
    }
    
    private function getActiveFeatures($settings) {
        $features = [];
        
        if ($settings['glassmorphism_enabled'] ?? false) $features[] = 'Glassmorphism';
        if ($settings['animations_enabled'] ?? false) $features[] = 'Animations';
        if ($settings['menu_floating'] ?? false) $features[] = 'Floating Menu';
        if ($settings['admin_bar_floating'] ?? false) $features[] = 'Floating Admin Bar';
        
        return $features;
    }
    
    /**
     * Analizuje wpływ ustawień na wydajność
     */
    private function calculatePerformanceImpact($settings) {
        $impact = 0;
        
        // Analiza różnych ustawień
        if (isset($settings['floating_admin_bar']) && $settings['floating_admin_bar']) {
            $impact += 5;
        }
        
        if (isset($settings['custom_fonts']) && $settings['custom_fonts']) {
            $impact += 10;
        }
        
        if (isset($settings['animations_enabled']) && $settings['animations_enabled']) {
            $impact += 8;
        }
        
        return $impact;
    }
    
    /**
     * === PRESET ENDPOINTS IMPLEMENTATION ===
     * Enterprise-grade preset management REST API callbacks
     */
    
    /**
     * 📋 Get all presets
     */
    public function getPresets(\WP_REST_Request $request) {
        if (!$this->preset_manager) {
            return new \WP_REST_Response([
                'success' => false,
                'message' => '❌ Preset Manager not available'
            ], 500);
        }
        
        try {
            $search = $request->get_param('search');
            $orderby = $request->get_param('orderby');
            $order = $request->get_param('order');
            
            $args = [
                'orderby' => $orderby === 'name' ? 'title' : $orderby,
                'order' => $order
            ];
            
            if ($search) {
                $args['s'] = $search;
            }
            
            $presets = $this->preset_manager->getPresets($args);
            
            return new \WP_REST_Response([
                'success' => true,
                'data' => $presets,
                'count' => count($presets),
                'timestamp' => current_time('mysql')
            ], 200);
            
        } catch (\Exception $e) {
            return new \WP_REST_Response([
                'success' => false,
                'message' => '❌ Error fetching presets: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * 💾 Save new preset
     */
    public function savePreset(\WP_REST_Request $request) {
        if (!$this->preset_manager) {
            return new \WP_REST_Response([
                'success' => false,
                'message' => '❌ Preset Manager not available'
            ], 500);
        }
        
        try {
            $name = $request->get_param('name');
            $description = $request->get_param('description') ?: '';
            $settings = $request->get_param('settings');
            
            $preset_id = $this->preset_manager->savePreset($name, $settings, $description);
            
            if (!$preset_id) {
                return new \WP_REST_Response([
                    'success' => false,
                    'message' => '❌ Failed to save preset'
                ], 500);
            }
            
            $preset = $this->preset_manager->getPreset($preset_id);
            
            return new \WP_REST_Response([
                'success' => true,
                'message' => "✅ Preset '{$name}' saved successfully",
                'data' => $preset,
                'timestamp' => current_time('mysql')
            ], 201);
            
        } catch (\Exception $e) {
            return new \WP_REST_Response([
                'success' => false,
                'message' => '❌ Error saving preset: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * 📖 Get single preset
     */
    public function getPreset(\WP_REST_Request $request) {
        if (!$this->preset_manager) {
            return new \WP_REST_Response([
                'success' => false,
                'message' => '❌ Preset Manager not available'
            ], 500);
        }
        
        try {
            $preset_id = $request->get_param('id');
            $preset = $this->preset_manager->getPreset($preset_id);
            
            if (!$preset) {
                return new \WP_REST_Response([
                    'success' => false,
                    'message' => '❌ Preset not found'
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
                'message' => '❌ Error fetching preset: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * 🔄 Update preset
     */
    public function updatePreset(\WP_REST_Request $request) {
        if (!$this->preset_manager) {
            return new \WP_REST_Response([
                'success' => false,
                'message' => '❌ Preset Manager not available'
            ], 500);
        }
        
        try {
            $preset_id = $request->get_param('id');
            $name = $request->get_param('name');
            $description = $request->get_param('description');
            $settings = $request->get_param('settings');
            
            if (!$this->preset_manager->presetExists($preset_id)) {
                return new \WP_REST_Response([
                    'success' => false,
                    'message' => '❌ Preset not found'
                ], 404);
            }
            
            $success = $this->preset_manager->updatePreset($preset_id, $name, $settings, $description);
            
            if (!$success) {
                return new \WP_REST_Response([
                    'success' => false,
                    'message' => '❌ Failed to update preset'
                ], 500);
            }
            
            $preset = $this->preset_manager->getPreset($preset_id);
            
            return new \WP_REST_Response([
                'success' => true,
                'message' => '✅ Preset updated successfully',
                'data' => $preset,
                'timestamp' => current_time('mysql')
            ], 200);
            
        } catch (\Exception $e) {
            return new \WP_REST_Response([
                'success' => false,
                'message' => '❌ Error updating preset: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * 🗑️ Delete preset
     */
    public function deletePreset(\WP_REST_Request $request) {
        if (!$this->preset_manager) {
            return new \WP_REST_Response([
                'success' => false,
                'message' => '❌ Preset Manager not available'
            ], 500);
        }
        
        try {
            $preset_id = $request->get_param('id');
            
            if (!$this->preset_manager->presetExists($preset_id)) {
                return new \WP_REST_Response([
                    'success' => false,
                    'message' => '❌ Preset not found'
                ], 404);
            }
            
            $success = $this->preset_manager->deletePreset($preset_id);
            
            if (!$success) {
                return new \WP_REST_Response([
                    'success' => false,
                    'message' => '❌ Failed to delete preset'
                ], 500);
            }
            
            return new \WP_REST_Response([
                'success' => true,
                'message' => '✅ Preset deleted successfully',
                'timestamp' => current_time('mysql')
            ], 200);
            
        } catch (\Exception $e) {
            return new \WP_REST_Response([
                'success' => false,
                'message' => '❌ Error deleting preset: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * 🎨 Apply preset
     */
    public function applyPreset(\WP_REST_Request $request) {
        if (!$this->preset_manager) {
            return new \WP_REST_Response([
                'success' => false,
                'message' => '❌ Preset Manager not available'
            ], 500);
        }
        
        try {
            $preset_id = $request->get_param('id');
            
            if (!$this->preset_manager->presetExists($preset_id)) {
                return new \WP_REST_Response([
                    'success' => false,
                    'message' => '❌ Preset not found'
                ], 404);
            }
            
            $success = $this->preset_manager->applyPreset($preset_id);
            
            if (!$success) {
                return new \WP_REST_Response([
                    'success' => false,
                    'message' => '❌ Failed to apply preset'
                ], 500);
            }
            
            $preset = $this->preset_manager->getPreset($preset_id);
            
            return new \WP_REST_Response([
                'success' => true,
                'message' => "✅ Preset '{$preset['name']}' applied successfully",
                'data' => $preset,
                'timestamp' => current_time('mysql')
            ], 200);
            
        } catch (\Exception $e) {
            return new \WP_REST_Response([
                'success' => false,
                'message' => '❌ Error applying preset: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * 📤 Export preset
     */
    public function exportPreset(\WP_REST_Request $request) {
        if (!$this->preset_manager) {
            return new \WP_REST_Response([
                'success' => false,
                'message' => '❌ Preset Manager not available'
            ], 500);
        }
        
        try {
            $preset_id = $request->get_param('id');
            
            if (!$this->preset_manager->presetExists($preset_id)) {
                return new \WP_REST_Response([
                    'success' => false,
                    'message' => '❌ Preset not found'
                ], 404);
            }
            
            $export_data = $this->preset_manager->exportPreset($preset_id);
            
            if (!$export_data) {
                return new \WP_REST_Response([
                    'success' => false,
                    'message' => '❌ Failed to export preset'
                ], 500);
            }
            
            return new \WP_REST_Response([
                'success' => true,
                'message' => '✅ Preset exported successfully',
                'data' => $export_data,
                'timestamp' => current_time('mysql')
            ], 200);
            
        } catch (\Exception $e) {
            return new \WP_REST_Response([
                'success' => false,
                'message' => '❌ Error exporting preset: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * 📥 Import preset
     */
    public function importPreset(\WP_REST_Request $request) {
        if (!$this->preset_manager) {
            return new \WP_REST_Response([
                'success' => false,
                'message' => '❌ Preset Manager not available'
            ], 500);
        }
        
        try {
            $data = $request->get_param('data');
            $name_override = $request->get_param('name');
            
            $preset_id = $this->preset_manager->importPreset($data, $name_override);
            
            if (!$preset_id) {
                return new \WP_REST_Response([
                    'success' => false,
                    'message' => '❌ Failed to import preset - invalid data format'
                ], 400);
            }
            
            $preset = $this->preset_manager->getPreset($preset_id);
            
            return new \WP_REST_Response([
                'success' => true,
                'message' => "✅ Preset imported successfully as '{$preset['name']}'",
                'data' => $preset,
                'timestamp' => current_time('mysql')
            ], 201);
            
        } catch (\Exception $e) {
            return new \WP_REST_Response([
                'success' => false,
                'message' => '❌ Error importing preset: ' . $e->getMessage()
            ], 500);
        }
    }
} 