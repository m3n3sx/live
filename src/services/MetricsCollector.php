<?php
/**
 * Metrics Collector Service
 * 
 * Zbiera i analizuje metryki wydajności wtyczki
 * 
 * @package ModernAdminStyler
 * @version 2.0
 */

namespace ModernAdminStyler\Services;

class MetricsCollector {
    
    private $cache_manager;
    private $start_time;
    private $metrics = [];
    
    public function __construct($cache_manager) {
        $this->cache_manager = $cache_manager;
        $this->start_time = microtime(true);
    }
    
    /**
     * 📊 Rozpoczyna pomiar wydajności
     */
    public function startMeasurement($metric_name) {
        $this->metrics[$metric_name] = [
            'start' => microtime(true),
            'memory_start' => memory_get_usage(true)
        ];
    }
    
    /**
     * ⏱️ Kończy pomiar wydajności
     */
    public function endMeasurement($metric_name) {
        if (!isset($this->metrics[$metric_name])) {
            return null;
        }
        
        $end_time = microtime(true);
        $end_memory = memory_get_usage(true);
        
        $this->metrics[$metric_name]['end'] = $end_time;
        $this->metrics[$metric_name]['memory_end'] = $end_memory;
        $this->metrics[$metric_name]['duration'] = $end_time - $this->metrics[$metric_name]['start'];
        $this->metrics[$metric_name]['memory_used'] = $end_memory - $this->metrics[$metric_name]['memory_start'];
        
        return $this->metrics[$metric_name];
    }
    
    /**
     * 📈 Zbiera metryki systemu
     */
    public function collectSystemMetrics() {
        return [
            'timestamp' => current_time('mysql'),
            'php_version' => PHP_VERSION,
            'wordpress_version' => get_bloginfo('version'),
            'plugin_version' => MAS_V2_VERSION,
            'memory_usage' => [
                'current' => memory_get_usage(true),
                'peak' => memory_get_peak_usage(true),
                'limit' => ini_get('memory_limit'),
                'formatted' => [
                    'current' => size_format(memory_get_usage(true)),
                    'peak' => size_format(memory_get_peak_usage(true))
                ]
            ],
            'execution_time' => microtime(true) - $this->start_time,
            'database_queries' => get_num_queries(),
            'active_plugins' => count(get_option('active_plugins', [])),
            'theme' => get_template(),
            'multisite' => is_multisite(),
            'debug_mode' => defined('WP_DEBUG') && WP_DEBUG
        ];
    }
    
    /**
     * 🚀 Zbiera metryki wydajności wtyczki
     */
    public function collectPluginMetrics() {
        $settings = get_option('mas_v2_settings', []);
        
        return [
            'plugin_enabled' => $settings['enable_plugin'] ?? false,
            'settings_count' => count($settings),
            'settings_size' => strlen(serialize($settings)),
            'cache_stats' => $this->cache_manager->getStats(),
            'features_enabled' => [
                'animations' => $settings['enable_animations'] ?? false,
                'shadows' => $settings['enable_shadows'] ?? false,
                'floating_admin_bar' => $settings['admin_bar_floating'] ?? false,
                'glossy_effects' => $settings['admin_bar_glossy'] ?? false,
                'compact_mode' => $settings['compact_mode'] ?? false,
    
            ],
            'custom_code' => [
                'css_length' => strlen($settings['custom_css'] ?? ''),
                'js_length' => strlen($settings['custom_js'] ?? ''),
                'has_custom_css' => !empty($settings['custom_css']),
                'has_custom_js' => !empty($settings['custom_js'])
            ]
        ];
    }
    
    /**
     * 📱 Zbiera metryki środowiska
     */
    public function collectEnvironmentMetrics() {
        global $wpdb;
        
        return [
            'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown',
            'server_software' => $_SERVER['SERVER_SOFTWARE'] ?? 'unknown',
            'php_extensions' => [
                'gd' => extension_loaded('gd'),
                'imagick' => extension_loaded('imagick'),
                'curl' => extension_loaded('curl'),
                'mbstring' => extension_loaded('mbstring'),
                'zip' => extension_loaded('zip')
            ],
            'database' => [
                'version' => $wpdb->db_version(),
                'charset' => $wpdb->charset,
                'collate' => $wpdb->collate
            ],
            'server_limits' => [
                'max_execution_time' => ini_get('max_execution_time'),
                'upload_max_filesize' => ini_get('upload_max_filesize'),
                'post_max_size' => ini_get('post_max_size'),
                'max_input_vars' => ini_get('max_input_vars')
            ],
            'wordpress_config' => [
                'wp_debug' => defined('WP_DEBUG') ? WP_DEBUG : false,
                'wp_cache' => defined('WP_CACHE') ? WP_CACHE : false,
                'object_cache' => wp_using_ext_object_cache(),
                'ssl' => is_ssl()
            ]
        ];
    }
    
    /**
     * 📊 Generuje kompletny raport
     */
    public function generateReport() {
        return [
            'generated_at' => current_time('mysql'),
            'system' => $this->collectSystemMetrics(),
            'plugin' => $this->collectPluginMetrics(),
            'environment' => $this->collectEnvironmentMetrics(),
            'measurements' => $this->metrics,
            'summary' => $this->generateSummary()
        ];
    }
    
    /**
     * 📋 Generuje podsumowanie wydajności
     */
    private function generateSummary() {
        $total_time = microtime(true) - $this->start_time;
        $memory_usage = memory_get_usage(true);
        $peak_memory = memory_get_peak_usage(true);
        
        $status = 'good';
        $recommendations = [];
        
        // Analiza czasu wykonania
        if ($total_time > 1.0) {
            $status = 'warning';
            $recommendations[] = 'Consider optimizing plugin performance - execution time is high';
        }
        
        // Analiza użycia pamięci
        if ($memory_usage > 50 * 1024 * 1024) { // 50MB
            $status = 'warning';
            $recommendations[] = 'High memory usage detected - consider reducing plugin complexity';
        }
        
        // Analiza liczby zapytań DB
        if (get_num_queries() > 50) {
            $status = 'warning';
            $recommendations[] = 'High number of database queries - consider caching improvements';
        }
        
        return [
            'status' => $status,
            'total_execution_time' => round($total_time * 1000, 2) . 'ms',
            'memory_usage_formatted' => size_format($memory_usage),
            'peak_memory_formatted' => size_format($peak_memory),
            'database_queries' => get_num_queries(),
            'recommendations' => $recommendations,
            'performance_score' => $this->calculatePerformanceScore($total_time, $memory_usage)
        ];
    }
    
    /**
     * 🏆 Oblicza wynik wydajności
     */
    private function calculatePerformanceScore($execution_time, $memory_usage) {
        $score = 100;
        
        // Kara za czas wykonania
        if ($execution_time > 0.5) {
            $score -= min(30, ($execution_time - 0.5) * 60);
        }
        
        // Kara za użycie pamięci
        $memory_mb = $memory_usage / (1024 * 1024);
        if ($memory_mb > 20) {
            $score -= min(25, ($memory_mb - 20) * 2);
        }
        
        // Kara za liczbę zapytań
        $queries = get_num_queries();
        if ($queries > 30) {
            $score -= min(20, ($queries - 30) * 0.5);
        }
        
        return max(0, round($score));
    }
    
    /**
     * 💾 Zapisuje metryki do cache
     */
    public function saveMetrics($report = null) {
        $report = $report ?: $this->generateReport();
        $cache_key = 'metrics_' . date('Y-m-d-H');
        
        // Zapisz na 1 godzinę
        $this->cache_manager->set($cache_key, $report, 3600);
        
        // Zachowaj ostatnie metryki
        $this->cache_manager->set('latest_metrics', $report, 86400);
        
        return $report;
    }
    
    /**
     * 📈 Pobiera historyczne metryki
     */
    public function getHistoricalMetrics($hours = 24) {
        $metrics = [];
        $current_hour = time();
        
        for ($i = 0; $i < $hours; $i++) {
            $hour_timestamp = $current_hour - ($i * 3600);
            $cache_key = 'metrics_' . date('Y-m-d-H', $hour_timestamp);
            $hourly_metrics = $this->cache_manager->get($cache_key);
            
            if ($hourly_metrics) {
                $metrics[date('Y-m-d H:00', $hour_timestamp)] = $hourly_metrics;
            }
        }
        
        return array_reverse($metrics, true);
    }
    
    /**
     * 🔄 Benchmark wydajności
     */
    public function runBenchmark() {
        $this->startMeasurement('benchmark');
        
        // Test operacji na ustawieniach
        $settings = get_option('mas_v2_settings', []);
        for ($i = 0; $i < 100; $i++) {
            $test_settings = $settings;
            $test_settings['test_field'] = $i;
            // Symulacja sanityzacji
            array_walk_recursive($test_settings, function(&$value) {
                if (is_string($value)) {
                    $value = sanitize_text_field($value);
                }
            });
        }
        
        // Test cache operations
        $cache_benchmark = $this->cache_manager->benchmark();
        
        $this->endMeasurement('benchmark');
        
        return [
            'settings_operations' => $this->metrics['benchmark'],
            'cache_operations' => $cache_benchmark,
            'timestamp' => current_time('mysql')
        ];
    }
} 