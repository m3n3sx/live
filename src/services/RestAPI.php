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
    
    public function __construct($cache_manager, $security_service, $metrics_collector) {
        $this->cache_manager = $cache_manager;
        $this->security_service = $security_service;
        $this->metrics_collector = $metrics_collector;
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
    
    private function calculatePerformanceImpact($settings) {
        $impact = 0;
        
        if ($settings['glassmorphism_enabled'] ?? false) $impact += 2;
        if ($settings['animations_enabled'] ?? false) $impact += 1;
        if (!empty($settings['custom_css'])) $impact += 1;
        if (!empty($settings['custom_js'])) $impact += 2;
        
        if ($impact <= 2) return 'low';
        if ($impact <= 4) return 'medium';
        return 'high';
    }
} 