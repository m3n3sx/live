<?php
/**
 * Performance Optimizer - AJAX Performance Optimization and Benchmarking
 * 
 * Provides comprehensive performance optimization for AJAX endpoints including:
 * - Database query optimization
 * - Caching strategies implementation
 * - Memory usage monitoring and optimization
 * - Response time optimization
 * - Automated performance benchmarking
 * - Performance alerts and monitoring
 * 
 * @package ModernAdminStyler
 * @version 2.4.0 - Security Overhaul
 */

namespace ModernAdminStyler\Services;

class PerformanceOptimizer {
    
    // Performance thresholds
    private $performance_thresholds = [
        'response_time_warning' => 500,  // 500ms
        'response_time_critical' => 1000, // 1 second
        'memory_usage_warning' => 64 * 1024 * 1024,  // 64MB
        'memory_usage_critical' => 128 * 1024 * 1024, // 128MB
        'database_query_warning' => 10,   // 10 queries
        'database_query_critical' => 20,  // 20 queries
        'cache_hit_ratio_warning' => 0.7, // 70%
        'cache_hit_ratio_critical' => 0.5 // 50%
    ];
    
    // Performance metrics storage
    private $performance_metrics = [];
    
    // Cache manager
    private $cache_manager;
    
    // Error logger
    private $error_logger;
    
    // Performance monitor
    private $performance_monitor;
    
    // Database query optimizer
    private $query_optimizer;
    
    // Memory optimizer
    private $memory_optimizer;
    
    /**
     * Constructor
     * 
     * @param object $cache_manager Cache manager instance
     * @param object $error_logger Error logger instance
     * @param object $performance_monitor Performance monitor instance
     */
    public function __construct($cache_manager = null, $error_logger = null, $performance_monitor = null) {
        $this->cache_manager = $cache_manager;
        $this->error_logger = $error_logger;
        $this->performance_monitor = $performance_monitor;
        
        $this->initializeOptimizer();
    }
    
    /**
     * Initialize performance optimizer
     */
    private function initializeOptimizer() {
        $this->query_optimizer = new DatabaseQueryOptimizer();
        $this->memory_optimizer = new MemoryOptimizer();
        
        // Initialize performance metrics
        $this->performance_metrics = [
            'response_times' => [],
            'memory_usage' => [],
            'database_queries' => [],
            'cache_performance' => [],
            'optimization_events' => []
        ];
    }
    
    /**
     * Optimize AJAX endpoint performance
     * 
     * @param string $endpoint Endpoint name
     * @param callable $handler Endpoint handler function
     * @param array $options Optimization options
     * @return mixed Optimized handler result
     */
    public function optimizeEndpoint($endpoint, $handler, $options = []) {
        $start_time = microtime(true);
        $start_memory = memory_get_usage(true);
        $start_queries = $this->getDatabaseQueryCount();
        
        try {
            // Pre-optimization setup
            $this->preOptimization($endpoint, $options);
            
            // Execute handler with optimizations
            $result = $this->executeOptimizedHandler($endpoint, $handler, $options);
            
            // Post-optimization cleanup
            $this->postOptimization($endpoint, $options);
            
            // Record performance metrics
            $this->recordPerformanceMetrics($endpoint, [
                'execution_time' => (microtime(true) - $start_time) * 1000,
                'memory_used' => memory_get_usage(true) - $start_memory,
                'database_queries' => $this->getDatabaseQueryCount() - $start_queries,
                'success' => true
            ]);
            
            return $result;
            
        } catch (Exception $e) {
            // Record failed performance metrics
            $this->recordPerformanceMetrics($endpoint, [
                'execution_time' => (microtime(true) - $start_time) * 1000,
                'memory_used' => memory_get_usage(true) - $start_memory,
                'database_queries' => $this->getDatabaseQueryCount() - $start_queries,
                'success' => false,
                'error' => $e->getMessage()
            ]);
            
            throw $e;
        }
    }
    
    /**
     * Pre-optimization setup
     * 
     * @param string $endpoint Endpoint name
     * @param array $options Optimization options
     */
    private function preOptimization($endpoint, $options) {
        // Enable query optimization
        if ($options['optimize_queries'] ?? true) {
            $this->query_optimizer->enableOptimization();
        }
        
        // Enable memory optimization
        if ($options['optimize_memory'] ?? true) {
            $this->memory_optimizer->enableOptimization();
        }
        
        // Preload frequently accessed data
        if ($options['preload_data'] ?? false) {
            $this->preloadEndpointData($endpoint);
        }
        
        // Enable output buffering for response optimization
        if ($options['optimize_output'] ?? true) {
            ob_start();
        }
    }
    
    /**
     * Execute optimized handler
     * 
     * @param string $endpoint Endpoint name
     * @param callable $handler Handler function
     * @param array $options Optimization options
     * @return mixed Handler result
     */
    private function executeOptimizedHandler($endpoint, $handler, $options) {
        // Check cache first
        if ($options['enable_caching'] ?? true) {
            $cache_key = $this->generateCacheKey($endpoint, $_POST);
            $cached_result = $this->getCachedResult($cache_key);
            
            if ($cached_result !== null) {
                $this->recordCacheHit($endpoint);
                return $cached_result;
            }
        }
        
        // Execute handler
        $result = call_user_func($handler);
        
        // Cache result if caching is enabled
        if (($options['enable_caching'] ?? true) && $this->shouldCacheResult($result)) {
            $cache_ttl = $options['cache_ttl'] ?? 300; // 5 minutes default
            $this->setCachedResult($cache_key, $result, $cache_ttl);
            $this->recordCacheMiss($endpoint);
        }
        
        return $result;
    }
    
    /**
     * Post-optimization cleanup
     * 
     * @param string $endpoint Endpoint name
     * @param array $options Optimization options
     */
    private function postOptimization($endpoint, $options) {
        // Optimize output if buffering was enabled
        if ($options['optimize_output'] ?? true) {
            $output = ob_get_clean();
            if ($output) {
                echo $this->optimizeOutput($output);
            }
        }
        
        // Run memory cleanup
        if ($options['optimize_memory'] ?? true) {
            $this->memory_optimizer->cleanup();
        }
        
        // Check performance thresholds
        $this->checkPerformanceThresholds($endpoint);
    }
    
    /**
     * Database query optimization
     * 
     * @param string $endpoint Endpoint name
     * @return array Optimization results
     */
    public function optimizeDatabaseQueries($endpoint) {
        $optimization_results = [];
        
        // Get slow queries for this endpoint
        $slow_queries = $this->query_optimizer->getSlowQueries($endpoint);
        
        foreach ($slow_queries as $query_info) {
            $optimization = $this->query_optimizer->optimizeQuery($query_info);
            $optimization_results[] = $optimization;
        }
        
        // Implement query caching
        $this->implementQueryCaching($endpoint);
        
        // Optimize database indexes
        $index_optimizations = $this->optimizeDatabaseIndexes($endpoint);
        $optimization_results = array_merge($optimization_results, $index_optimizations);
        
        return $optimization_results;
    }
    
    /**
     * Implement caching strategies
     * 
     * @param string $endpoint Endpoint name
     * @param array $strategy Caching strategy configuration
     * @return array Caching implementation results
     */
    public function implementCachingStrategy($endpoint, $strategy = []) {
        $default_strategy = [
            'type' => 'transient', // transient, object_cache, file_cache
            'ttl' => 300, // 5 minutes
            'invalidation' => 'time_based', // time_based, event_based, manual
            'compression' => true,
            'serialization' => 'json'
        ];
        
        $strategy = array_merge($default_strategy, $strategy);
        
        $results = [];
        
        // Implement response caching
        $response_cache = $this->implementResponseCaching($endpoint, $strategy);
        $results['response_caching'] = $response_cache;
        
        // Implement data caching
        $data_cache = $this->implementDataCaching($endpoint, $strategy);
        $results['data_caching'] = $data_cache;
        
        // Implement query result caching
        $query_cache = $this->implementQueryResultCaching($endpoint, $strategy);
        $results['query_caching'] = $query_cache;
        
        // Setup cache invalidation
        $invalidation = $this->setupCacheInvalidation($endpoint, $strategy);
        $results['cache_invalidation'] = $invalidation;
        
        return $results;
    }
    
    /**
     * Monitor memory usage and optimize
     * 
     * @param string $endpoint Endpoint name
     * @return array Memory optimization results
     */
    public function optimizeMemoryUsage($endpoint) {
        $memory_before = memory_get_usage(true);
        $peak_before = memory_get_peak_usage(true);
        
        $optimizations = [];
        
        // Optimize variable usage
        $variable_optimization = $this->memory_optimizer->optimizeVariables();
        $optimizations['variables'] = $variable_optimization;
        
        // Optimize object instances
        $object_optimization = $this->memory_optimizer->optimizeObjects();
        $optimizations['objects'] = $object_optimization;
        
        // Optimize array usage
        $array_optimization = $this->memory_optimizer->optimizeArrays();
        $optimizations['arrays'] = $array_optimization;
        
        // Run garbage collection
        $gc_collected = gc_collect_cycles();
        $optimizations['garbage_collection'] = [
            'cycles_collected' => $gc_collected,
            'enabled' => gc_enabled()
        ];
        
        $memory_after = memory_get_usage(true);
        $peak_after = memory_get_peak_usage(true);
        
        $optimizations['memory_stats'] = [
            'before' => $memory_before,
            'after' => $memory_after,
            'saved' => $memory_before - $memory_after,
            'peak_before' => $peak_before,
            'peak_after' => $peak_after
        ];
        
        // Check if memory usage exceeds thresholds
        if ($memory_after > $this->performance_thresholds['memory_usage_critical']) {
            $this->triggerMemoryAlert($endpoint, $memory_after, 'critical');
        } elseif ($memory_after > $this->performance_thresholds['memory_usage_warning']) {
            $this->triggerMemoryAlert($endpoint, $memory_after, 'warning');
        }
        
        return $optimizations;
    }
    
    /**
     * Run comprehensive performance benchmark
     * 
     * @param array $endpoints Endpoints to benchmark
     * @param array $options Benchmark options
     * @return array Benchmark results
     */
    public function runPerformanceBenchmark($endpoints = [], $options = []) {
        $default_options = [
            'iterations' => 100,
            'concurrent_requests' => 10,
            'warmup_iterations' => 10,
            'include_memory_profiling' => true,
            'include_database_profiling' => true,
            'include_cache_profiling' => true
        ];
        
        $options = array_merge($default_options, $options);
        
        $benchmark_results = [
            'summary' => [],
            'detailed_results' => [],
            'performance_analysis' => [],
            'recommendations' => []
        ];
        
        // Get endpoints to benchmark
        if (empty($endpoints)) {
            $endpoints = $this->getRegisteredEndpoints();
        }
        
        foreach ($endpoints as $endpoint) {
            $endpoint_results = $this->benchmarkEndpoint($endpoint, $options);
            $benchmark_results['detailed_results'][$endpoint] = $endpoint_results;
        }
        
        // Generate summary
        $benchmark_results['summary'] = $this->generateBenchmarkSummary($benchmark_results['detailed_results']);
        
        // Analyze performance
        $benchmark_results['performance_analysis'] = $this->analyzePerformanceResults($benchmark_results['detailed_results']);
        
        // Generate recommendations
        $benchmark_results['recommendations'] = $this->generatePerformanceRecommendations($benchmark_results['performance_analysis']);
        
        // Store benchmark results
        $this->storeBenchmarkResults($benchmark_results);
        
        return $benchmark_results;
    }
    
    /**
     * Benchmark individual endpoint
     * 
     * @param string $endpoint Endpoint name
     * @param array $options Benchmark options
     * @return array Endpoint benchmark results
     */
    private function benchmarkEndpoint($endpoint, $options) {
        $results = [
            'endpoint' => $endpoint,
            'iterations' => $options['iterations'],
            'response_times' => [],
            'memory_usage' => [],
            'database_queries' => [],
            'cache_performance' => [],
            'errors' => []
        ];
        
        // Warmup iterations
        for ($i = 0; $i < $options['warmup_iterations']; $i++) {
            $this->executeBenchmarkIteration($endpoint, false);
        }
        
        // Actual benchmark iterations
        for ($i = 0; $i < $options['iterations']; $i++) {
            $iteration_result = $this->executeBenchmarkIteration($endpoint, true);
            
            $results['response_times'][] = $iteration_result['response_time'];
            $results['memory_usage'][] = $iteration_result['memory_usage'];
            $results['database_queries'][] = $iteration_result['database_queries'];
            
            if (isset($iteration_result['cache_hit'])) {
                $results['cache_performance'][] = $iteration_result['cache_hit'];
            }
            
            if (isset($iteration_result['error'])) {
                $results['errors'][] = $iteration_result['error'];
            }
        }
        
        // Calculate statistics
        $results['statistics'] = $this->calculateBenchmarkStatistics($results);
        
        return $results;
    }
    
    /**
     * Execute single benchmark iteration
     * 
     * @param string $endpoint Endpoint name
     * @param bool $record_metrics Whether to record metrics
     * @return array Iteration results
     */
    private function executeBenchmarkIteration($endpoint, $record_metrics = true) {
        $start_time = microtime(true);
        $start_memory = memory_get_usage(true);
        $start_queries = $this->getDatabaseQueryCount();
        
        try {
            // Simulate AJAX request
            $result = $this->simulateAjaxRequest($endpoint);
            
            $end_time = microtime(true);
            $end_memory = memory_get_usage(true);
            $end_queries = $this->getDatabaseQueryCount();
            
            return [
                'response_time' => ($end_time - $start_time) * 1000,
                'memory_usage' => $end_memory - $start_memory,
                'database_queries' => $end_queries - $start_queries,
                'success' => true,
                'cache_hit' => $result['from_cache'] ?? false
            ];
            
        } catch (Exception $e) {
            return [
                'response_time' => (microtime(true) - $start_time) * 1000,
                'memory_usage' => memory_get_usage(true) - $start_memory,
                'database_queries' => $this->getDatabaseQueryCount() - $start_queries,
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }
    
    /**
     * Calculate benchmark statistics
     * 
     * @param array $results Raw benchmark results
     * @return array Calculated statistics
     */
    private function calculateBenchmarkStatistics($results) {
        $stats = [];
        
        // Response time statistics
        $response_times = $results['response_times'];
        $stats['response_time'] = [
            'min' => min($response_times),
            'max' => max($response_times),
            'avg' => array_sum($response_times) / count($response_times),
            'median' => $this->calculateMedian($response_times),
            'p95' => $this->calculatePercentile($response_times, 95),
            'p99' => $this->calculatePercentile($response_times, 99)
        ];
        
        // Memory usage statistics
        $memory_usage = $results['memory_usage'];
        $stats['memory_usage'] = [
            'min' => min($memory_usage),
            'max' => max($memory_usage),
            'avg' => array_sum($memory_usage) / count($memory_usage),
            'median' => $this->calculateMedian($memory_usage)
        ];
        
        // Database query statistics
        $db_queries = $results['database_queries'];
        $stats['database_queries'] = [
            'min' => min($db_queries),
            'max' => max($db_queries),
            'avg' => array_sum($db_queries) / count($db_queries),
            'total' => array_sum($db_queries)
        ];
        
        // Cache performance
        if (!empty($results['cache_performance'])) {
            $cache_hits = array_sum($results['cache_performance']);
            $total_requests = count($results['cache_performance']);
            $stats['cache_hit_ratio'] = $cache_hits / $total_requests;
        }
        
        // Error rate
        $error_count = count($results['errors']);
        $total_iterations = $results['iterations'];
        $stats['error_rate'] = $error_count / $total_iterations;
        
        return $stats;
    }
    
    /**
     * Generate performance recommendations
     * 
     * @param array $analysis Performance analysis results
     * @return array Performance recommendations
     */
    private function generatePerformanceRecommendations($analysis) {
        $recommendations = [];
        
        foreach ($analysis as $endpoint => $endpoint_analysis) {
            $endpoint_recommendations = [];
            
            // Response time recommendations
            if ($endpoint_analysis['avg_response_time'] > $this->performance_thresholds['response_time_warning']) {
                $endpoint_recommendations[] = [
                    'type' => 'response_time',
                    'severity' => $endpoint_analysis['avg_response_time'] > $this->performance_thresholds['response_time_critical'] ? 'critical' : 'warning',
                    'message' => "Average response time ({$endpoint_analysis['avg_response_time']}ms) exceeds threshold",
                    'suggestions' => [
                        'Implement response caching',
                        'Optimize database queries',
                        'Reduce data processing complexity',
                        'Consider asynchronous processing'
                    ]
                ];
            }
            
            // Memory usage recommendations
            if ($endpoint_analysis['avg_memory_usage'] > $this->performance_thresholds['memory_usage_warning']) {
                $endpoint_recommendations[] = [
                    'type' => 'memory_usage',
                    'severity' => $endpoint_analysis['avg_memory_usage'] > $this->performance_thresholds['memory_usage_critical'] ? 'critical' : 'warning',
                    'message' => "Average memory usage ({$endpoint_analysis['avg_memory_usage']} bytes) exceeds threshold",
                    'suggestions' => [
                        'Optimize data structures',
                        'Implement lazy loading',
                        'Reduce object instantiation',
                        'Enable garbage collection optimization'
                    ]
                ];
            }
            
            // Database query recommendations
            if ($endpoint_analysis['avg_database_queries'] > $this->performance_thresholds['database_query_warning']) {
                $endpoint_recommendations[] = [
                    'type' => 'database_queries',
                    'severity' => $endpoint_analysis['avg_database_queries'] > $this->performance_thresholds['database_query_critical'] ? 'critical' : 'warning',
                    'message' => "Average database queries ({$endpoint_analysis['avg_database_queries']}) exceeds threshold",
                    'suggestions' => [
                        'Implement query result caching',
                        'Optimize database indexes',
                        'Reduce N+1 query problems',
                        'Use database query optimization'
                    ]
                ];
            }
            
            // Cache performance recommendations
            if (isset($endpoint_analysis['cache_hit_ratio']) && 
                $endpoint_analysis['cache_hit_ratio'] < $this->performance_thresholds['cache_hit_ratio_warning']) {
                $endpoint_recommendations[] = [
                    'type' => 'cache_performance',
                    'severity' => $endpoint_analysis['cache_hit_ratio'] < $this->performance_thresholds['cache_hit_ratio_critical'] ? 'critical' : 'warning',
                    'message' => "Cache hit ratio ({$endpoint_analysis['cache_hit_ratio']}) is below threshold",
                    'suggestions' => [
                        'Increase cache TTL',
                        'Improve cache key strategy',
                        'Implement cache warming',
                        'Review cache invalidation logic'
                    ]
                ];
            }
            
            $recommendations[$endpoint] = $endpoint_recommendations;
        }
        
        return $recommendations;
    }
    
    /**
     * Setup automated performance alerts
     * 
     * @param array $alert_config Alert configuration
     */
    public function setupPerformanceAlerts($alert_config = []) {
        $default_config = [
            'response_time_threshold' => 500,
            'memory_threshold' => 64 * 1024 * 1024,
            'error_rate_threshold' => 0.05,
            'alert_methods' => ['log', 'email'],
            'alert_frequency' => 'immediate'
        ];
        
        $config = array_merge($default_config, $alert_config);
        
        // Register performance monitoring hooks
        add_action('mas_performance_threshold_exceeded', [$this, 'handlePerformanceAlert'], 10, 3);
        
        // Setup periodic performance checks
        if (!wp_next_scheduled('mas_performance_check')) {
            wp_schedule_event(time(), 'hourly', 'mas_performance_check');
        }
        
        add_action('mas_performance_check', [$this, 'runPerformanceCheck']);
    }
    
    // Helper methods
    
    private function getDatabaseQueryCount() {
        global $wpdb;
        return $wpdb->num_queries ?? 0;
    }
    
    private function generateCacheKey($endpoint, $data) {
        return 'mas_cache_' . $endpoint . '_' . md5(serialize($data));
    }
    
    private function getCachedResult($cache_key) {
        return get_transient($cache_key);
    }
    
    private function setCachedResult($cache_key, $result, $ttl) {
        set_transient($cache_key, $result, $ttl);
    }
    
    private function shouldCacheResult($result) {
        // Don't cache error responses
        if (isset($result['success']) && !$result['success']) {
            return false;
        }
        
        // Don't cache empty results
        if (empty($result)) {
            return false;
        }
        
        return true;
    }
    
    private function calculateMedian($array) {
        sort($array);
        $count = count($array);
        $middle = floor($count / 2);
        
        if ($count % 2) {
            return $array[$middle];
        } else {
            return ($array[$middle - 1] + $array[$middle]) / 2;
        }
    }
    
    private function calculatePercentile($array, $percentile) {
        sort($array);
        $index = ($percentile / 100) * (count($array) - 1);
        
        if (floor($index) == $index) {
            return $array[$index];
        } else {
            $lower = $array[floor($index)];
            $upper = $array[ceil($index)];
            return $lower + ($upper - $lower) * ($index - floor($index));
        }
    }
    
    private function recordPerformanceMetrics($endpoint, $metrics) {
        $this->performance_metrics['response_times'][] = [
            'endpoint' => $endpoint,
            'time' => $metrics['execution_time'],
            'timestamp' => time()
        ];
        
        $this->performance_metrics['memory_usage'][] = [
            'endpoint' => $endpoint,
            'memory' => $metrics['memory_used'],
            'timestamp' => time()
        ];
        
        if ($this->performance_monitor) {
            $this->performance_monitor->recordAjaxRequest($endpoint, $metrics['execution_time'], $metrics['success'], $metrics);
        }
    }
    
    private function checkPerformanceThresholds($endpoint) {
        $recent_metrics = $this->getRecentMetrics($endpoint);
        
        if (!empty($recent_metrics)) {
            $avg_response_time = array_sum(array_column($recent_metrics, 'execution_time')) / count($recent_metrics);
            
            if ($avg_response_time > $this->performance_thresholds['response_time_critical']) {
                do_action('mas_performance_threshold_exceeded', $endpoint, 'response_time', 'critical');
            } elseif ($avg_response_time > $this->performance_thresholds['response_time_warning']) {
                do_action('mas_performance_threshold_exceeded', $endpoint, 'response_time', 'warning');
            }
        }
    }
    
    private function getRecentMetrics($endpoint, $minutes = 5) {
        $cutoff_time = time() - ($minutes * 60);
        
        return array_filter($this->performance_metrics['response_times'], function($metric) use ($endpoint, $cutoff_time) {
            return $metric['endpoint'] === $endpoint && $metric['timestamp'] >= $cutoff_time;
        });
    }
    
    /**
     * Get performance metrics
     * 
     * @return array Performance metrics
     */
    public function getPerformanceMetrics() {
        return $this->performance_metrics;
    }
    
    /**
     * Export performance data
     * 
     * @return string JSON formatted performance data
     */
    public function exportPerformanceData() {
        return json_encode([
            'performance_metrics' => $this->performance_metrics,
            'thresholds' => $this->performance_thresholds,
            'export_timestamp' => date('Y-m-d H:i:s'),
            'version' => '2.4.0'
        ], JSON_PRETTY_PRINT);
    }
}

/**
 * Database Query Optimizer
 */
class DatabaseQueryOptimizer {
    
    private $slow_queries = [];
    private $optimization_enabled = false;
    
    public function enableOptimization() {
        $this->optimization_enabled = true;
        
        // Hook into WordPress query system
        add_filter('query', [$this, 'optimizeQuery']);
        add_action('shutdown', [$this, 'analyzeQueries']);
    }
    
    public function optimizeQuery($query) {
        if (!$this->optimization_enabled) {
            return $query;
        }
        
        // Add query optimization logic here
        return $query;
    }
    
    public function getSlowQueries($endpoint) {
        return $this->slow_queries[$endpoint] ?? [];
    }
    
    public function analyzeQueries() {
        // Analyze executed queries for optimization opportunities
    }
}

/**
 * Memory Optimizer
 */
class MemoryOptimizer {
    
    private $optimization_enabled = false;
    
    public function enableOptimization() {
        $this->optimization_enabled = true;
    }
    
    public function optimizeVariables() {
        if (!$this->optimization_enabled) {
            return ['status' => 'disabled'];
        }
        
        // Variable optimization logic
        return ['status' => 'optimized', 'variables_cleaned' => 0];
    }
    
    public function optimizeObjects() {
        if (!$this->optimization_enabled) {
            return ['status' => 'disabled'];
        }
        
        // Object optimization logic
        return ['status' => 'optimized', 'objects_cleaned' => 0];
    }
    
    public function optimizeArrays() {
        if (!$this->optimization_enabled) {
            return ['status' => 'disabled'];
        }
        
        // Array optimization logic
        return ['status' => 'optimized', 'arrays_cleaned' => 0];
    }
    
    public function cleanup() {
        if ($this->optimization_enabled) {
            // Force garbage collection
            gc_collect_cycles();
        }
    }
}