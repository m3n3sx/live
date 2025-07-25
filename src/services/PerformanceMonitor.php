<?php
/**
 * Performance Monitor - Comprehensive Performance Tracking System
 * 
 * Provides unified performance monitoring for all AJAX endpoints including:
 * - Response time tracking with 500ms threshold alerts
 * - Execution time measurement and optimization recommendations
 * - Database query performance monitoring
 * - Memory usage tracking and optimization
 * - Performance metrics storage and reporting
 * 
 * @package ModernAdminStyler
 * @version 2.4.0 - Security Overhaul
 */

namespace ModernAdminStyler\Services;

class PerformanceMonitor {
    
    // Performance thresholds
    const RESPONSE_TIME_THRESHOLD = 500; // milliseconds
    const SLOW_QUERY_THRESHOLD = 100; // milliseconds
    const MEMORY_WARNING_THRESHOLD = 0.8; // 80% of memory limit
    const CRITICAL_RESPONSE_TIME = 1000; // milliseconds
    
    // Storage configuration
    private $metrics_storage_key = 'mas_v2_performance_metrics';
    private $max_stored_metrics = 100;
    private $slow_queries_key = 'mas_v2_slow_queries';
    private $max_stored_queries = 50;
    
    // Current request tracking
    private $current_metrics = [];
    private $request_start_time;
    private $query_start_times = [];
    private $database_queries = [];
    
    // Performance alerts
    private $performance_alerts = [];
    
    public function __construct() {
        $this->request_start_time = defined('MAS_V2_REQUEST_START') ? MAS_V2_REQUEST_START : microtime(true);
        $this->initializeQueryMonitoring();
    }
    
    /**
     * Initialize database query monitoring
     */
    private function initializeQueryMonitoring() {
        // Hook into WordPress query monitoring if available
        if (defined('SAVEQUERIES') && SAVEQUERIES) {
            add_filter('query', [$this, 'trackDatabaseQuery'], 10, 1);
        }
        
        // Hook into wpdb for query timing
        add_action('wp_loaded', [$this, 'setupDatabaseHooks']);
    }
    
    /**
     * Setup database performance hooks
     */
    public function setupDatabaseHooks() {
        global $wpdb;
        
        if ($wpdb) {
            // Override wpdb query method for performance tracking
            add_filter('query', [$this, 'startQueryTimer'], 1);
            add_action('wp_footer', [$this, 'analyzeQueryPerformance'], 999);
        }
    }
    
    /**
     * Record AJAX request performance metrics
     * 
     * @param string $action AJAX action name
     * @param float $execution_time Execution time in milliseconds
     * @param bool $success Whether request was successful
     * @param array $additional_context Additional performance context
     */
    public function recordAjaxRequest($action, $execution_time, $success, $additional_context = []) {
        $metric = [
            'action' => $action,
            'execution_time_ms' => round($execution_time, 2),
            'success' => $success,
            'timestamp' => microtime(true),
            'date' => current_time('mysql'),
            'memory_usage' => memory_get_usage(true),
            'memory_peak' => memory_get_peak_usage(true),
            'memory_limit' => $this->parseMemoryLimit(ini_get('memory_limit')),
            'memory_percentage' => $this->calculateMemoryPercentage(),
            'user_id' => get_current_user_id(),
            'ip_address' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
            'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown',
            'request_size' => $this->calculateRequestSize(),
            'response_size' => $this->calculateResponseSize(),
            'database_queries' => $this->getDatabaseQueryCount(),
            'database_time' => $this->getDatabaseQueryTime(),
            'cache_hits' => $this->getCacheHits(),
            'cache_misses' => $this->getCacheMisses(),
            'additional_context' => $additional_context
        ];
        
        // Add to current metrics
        $this->current_metrics[] = $metric;
        
        // Check for performance issues
        $this->analyzePerformance($metric);
        
        // Store metrics for reporting
        $this->storeMetric($metric);
        
        // Log slow requests
        if ($execution_time > self::RESPONSE_TIME_THRESHOLD) {
            $this->logSlowRequest($metric);
        }
        
        // Send alerts for critical performance issues
        if ($execution_time > self::CRITICAL_RESPONSE_TIME) {
            $this->sendPerformanceAlert($metric);
        }
    }
    
    /**
     * Start timing for specific operation
     * 
     * @param string $operation_name Operation identifier
     * @return string Timer ID
     */
    public function startTimer($operation_name) {
        $timer_id = uniqid($operation_name . '_');
        $this->query_start_times[$timer_id] = [
            'operation' => $operation_name,
            'start_time' => microtime(true),
            'memory_start' => memory_get_usage(true)
        ];
        
        return $timer_id;
    }
    
    /**
     * Stop timing and record performance
     * 
     * @param string $timer_id Timer ID from startTimer
     * @param array $additional_context Additional context
     * @return array Performance data
     */
    public function stopTimer($timer_id, $additional_context = []) {
        if (!isset($this->query_start_times[$timer_id])) {
            return null;
        }
        
        $timer_data = $this->query_start_times[$timer_id];
        $end_time = microtime(true);
        $execution_time = ($end_time - $timer_data['start_time']) * 1000;
        $memory_used = memory_get_usage(true) - $timer_data['memory_start'];
        
        $performance_data = [
            'operation' => $timer_data['operation'],
            'execution_time_ms' => round($execution_time, 2),
            'memory_used' => $memory_used,
            'timestamp' => current_time('mysql'),
            'additional_context' => $additional_context
        ];
        
        // Clean up timer
        unset($this->query_start_times[$timer_id]);
        
        // Log if slow
        if ($execution_time > self::SLOW_QUERY_THRESHOLD) {
            $this->logSlowOperation($performance_data);
        }
        
        return $performance_data;
    }
    
    /**
     * Track database query performance
     * 
     * @param string $query SQL query
     * @return string Query (unchanged)
     */
    public function trackDatabaseQuery($query) {
        $query_hash = md5($query);
        $this->database_queries[$query_hash] = [
            'query' => $this->sanitizeQuery($query),
            'start_time' => microtime(true),
            'memory_before' => memory_get_usage(true)
        ];
        
        return $query;
    }
    
    /**
     * Start query timer
     * 
     * @param string $query SQL query
     * @return string Query (unchanged)
     */
    public function startQueryTimer($query) {
        $this->trackDatabaseQuery($query);
        return $query;
    }
    
    /**
     * Analyze query performance at end of request
     */
    public function analyzeQueryPerformance() {
        global $wpdb;
        
        if (!empty($wpdb->queries)) {
            foreach ($wpdb->queries as $query_data) {
                $execution_time = $query_data[1] * 1000; // Convert to milliseconds
                
                if ($execution_time > self::SLOW_QUERY_THRESHOLD) {
                    $this->logSlowQuery([
                        'query' => $this->sanitizeQuery($query_data[0]),
                        'execution_time_ms' => $execution_time,
                        'caller' => $query_data[2] ?? 'unknown',
                        'timestamp' => current_time('mysql')
                    ]);
                }
            }
        }
    }
    
    /**
     * Analyze performance metrics for issues
     * 
     * @param array $metric Performance metric
     */
    private function analyzePerformance($metric) {
        $issues = [];
        
        // Check response time
        if ($metric['execution_time_ms'] > self::CRITICAL_RESPONSE_TIME) {
            $issues[] = [
                'type' => 'critical_response_time',
                'severity' => 'critical',
                'message' => "Response time {$metric['execution_time_ms']}ms exceeds critical threshold",
                'recommendation' => 'Immediate optimization required'
            ];
        } elseif ($metric['execution_time_ms'] > self::RESPONSE_TIME_THRESHOLD) {
            $issues[] = [
                'type' => 'slow_response_time',
                'severity' => 'warning',
                'message' => "Response time {$metric['execution_time_ms']}ms exceeds threshold",
                'recommendation' => 'Consider optimization'
            ];
        }
        
        // Check memory usage
        if ($metric['memory_percentage'] > self::MEMORY_WARNING_THRESHOLD * 100) {
            $issues[] = [
                'type' => 'high_memory_usage',
                'severity' => 'warning',
                'message' => "Memory usage {$metric['memory_percentage']}% is high",
                'recommendation' => 'Monitor memory usage and optimize if needed'
            ];
        }
        
        // Check database performance
        if ($metric['database_time'] > 200) { // 200ms threshold for DB queries
            $issues[] = [
                'type' => 'slow_database',
                'severity' => 'warning',
                'message' => "Database queries took {$metric['database_time']}ms",
                'recommendation' => 'Optimize database queries'
            ];
        }
        
        // Store performance issues
        if (!empty($issues)) {
            $this->performance_alerts[] = [
                'action' => $metric['action'],
                'timestamp' => $metric['date'],
                'issues' => $issues,
                'metric' => $metric
            ];
        }
    }
    
    /**
     * Log slow request
     * 
     * @param array $metric Performance metric
     */
    private function logSlowRequest($metric) {
        error_log(sprintf(
            'MAS V2 Slow AJAX Request: %s took %dms (threshold: %dms) | User: %d | Memory: %s',
            $metric['action'],
            $metric['execution_time_ms'],
            self::RESPONSE_TIME_THRESHOLD,
            $metric['user_id'],
            $this->formatBytes($metric['memory_peak'])
        ));
        
        // Store detailed slow request data
        $slow_requests = get_option('mas_v2_slow_requests', []);
        $slow_requests[] = [
            'action' => $metric['action'],
            'execution_time_ms' => $metric['execution_time_ms'],
            'timestamp' => $metric['date'],
            'user_id' => $metric['user_id'],
            'memory_peak' => $metric['memory_peak'],
            'database_queries' => $metric['database_queries'],
            'database_time' => $metric['database_time']
        ];
        
        // Keep only last 20 slow requests
        if (count($slow_requests) > 20) {
            $slow_requests = array_slice($slow_requests, -20);
        }
        
        update_option('mas_v2_slow_requests', $slow_requests);
    }
    
    /**
     * Log slow operation
     * 
     * @param array $performance_data Performance data
     */
    private function logSlowOperation($performance_data) {
        error_log(sprintf(
            'MAS V2 Slow Operation: %s took %dms (threshold: %dms)',
            $performance_data['operation'],
            $performance_data['execution_time_ms'],
            self::SLOW_QUERY_THRESHOLD
        ));
    }
    
    /**
     * Log slow database query
     * 
     * @param array $query_data Query performance data
     */
    private function logSlowQuery($query_data) {
        error_log(sprintf(
            'MAS V2 Slow Query: %dms - %s',
            $query_data['execution_time_ms'],
            substr($query_data['query'], 0, 100) . '...'
        ));
        
        // Store slow query data
        $slow_queries = get_option($this->slow_queries_key, []);
        $slow_queries[] = $query_data;
        
        // Keep only recent slow queries
        if (count($slow_queries) > $this->max_stored_queries) {
            $slow_queries = array_slice($slow_queries, -$this->max_stored_queries);
        }
        
        update_option($this->slow_queries_key, $slow_queries);
    }
    
    /**
     * Send performance alert email
     * 
     * @param array $metric Performance metric
     */
    private function sendPerformanceAlert($metric) {
        $admin_email = get_option('admin_email');
        if (!$admin_email) {
            return;
        }
        
        $subject = sprintf(
            '[%s] Critical Performance Alert - %s',
            get_bloginfo('name'),
            $metric['action']
        );
        
        $message = sprintf(
            "Critical performance issue detected:\n\n" .
            "AJAX Action: %s\n" .
            "Response Time: %dms (Critical threshold: %dms)\n" .
            "Memory Usage: %s (Peak: %s)\n" .
            "Database Queries: %d (Time: %dms)\n" .
            "User: %d\n" .
            "Timestamp: %s\n\n" .
            "Immediate optimization is recommended.\n\n" .
            "This is an automated performance alert from WOOW! Admin Styler plugin.",
            $metric['action'],
            $metric['execution_time_ms'],
            self::CRITICAL_RESPONSE_TIME,
            $this->formatBytes($metric['memory_usage']),
            $this->formatBytes($metric['memory_peak']),
            $metric['database_queries'],
            $metric['database_time'],
            $metric['user_id'],
            $metric['date']
        );
        
        wp_mail($admin_email, $subject, $message);
    }
    
    /**
     * Store performance metric
     * 
     * @param array $metric Performance metric
     */
    private function storeMetric($metric) {
        $metrics = get_option($this->metrics_storage_key, []);
        
        // Add new metric
        $metrics[] = [
            'action' => $metric['action'],
            'execution_time_ms' => $metric['execution_time_ms'],
            'success' => $metric['success'],
            'timestamp' => $metric['timestamp'],
            'date' => $metric['date'],
            'memory_peak' => $metric['memory_peak'],
            'memory_percentage' => $metric['memory_percentage'],
            'database_queries' => $metric['database_queries'],
            'database_time' => $metric['database_time'],
            'user_id' => $metric['user_id']
        ];
        
        // Keep only recent metrics
        if (count($metrics) > $this->max_stored_metrics) {
            $metrics = array_slice($metrics, -$this->max_stored_metrics);
        }
        
        update_option($this->metrics_storage_key, $metrics);
    }
    
    /**
     * Generate comprehensive performance report
     * 
     * @param string $period Report period (hour, day, week, month)
     * @return array Performance report
     */
    public function generateReport($period = 'day') {
        $metrics = get_option($this->metrics_storage_key, []);
        
        if (empty($metrics)) {
            return [
                'message' => 'No performance data available',
                'period' => $period,
                'data_points' => 0
            ];
        }
        
        // Filter metrics by period
        $filtered_metrics = $this->filterMetricsByPeriod($metrics, $period);
        
        if (empty($filtered_metrics)) {
            return [
                'message' => "No performance data available for period: {$period}",
                'period' => $period,
                'data_points' => 0
            ];
        }
        
        $report = [
            'period' => $period,
            'data_points' => count($filtered_metrics),
            'summary' => $this->generateSummaryStats($filtered_metrics),
            'performance_analysis' => $this->analyzePerformanceTrends($filtered_metrics),
            'slowest_endpoints' => $this->findSlowestEndpoints($filtered_metrics),
            'memory_analysis' => $this->analyzeMemoryUsage($filtered_metrics),
            'database_analysis' => $this->analyzeDatabasePerformance($filtered_metrics),
            'recommendations' => $this->generateRecommendations($filtered_metrics),
            'alerts' => $this->getRecentAlerts(),
            'generated_at' => current_time('mysql')
        ];
        
        return $report;
    }
    
    /**
     * Filter metrics by time period
     * 
     * @param array $metrics All metrics
     * @param string $period Time period
     * @return array Filtered metrics
     */
    private function filterMetricsByPeriod($metrics, $period) {
        $cutoff_time = $this->getPeriodCutoffTime($period);
        
        return array_filter($metrics, function($metric) use ($cutoff_time) {
            return $metric['timestamp'] > $cutoff_time;
        });
    }
    
    /**
     * Get cutoff time for period
     * 
     * @param string $period Time period
     * @return float Cutoff timestamp
     */
    private function getPeriodCutoffTime($period) {
        $now = time();
        
        switch ($period) {
            case 'hour':
                return $now - 3600;
            case 'day':
                return $now - 86400;
            case 'week':
                return $now - 604800;
            case 'month':
                return $now - 2592000;
            default:
                return $now - 86400; // Default to day
        }
    }
    
    /**
     * Generate summary statistics
     * 
     * @param array $metrics Filtered metrics
     * @return array Summary stats
     */
    private function generateSummaryStats($metrics) {
        $execution_times = array_column($metrics, 'execution_time_ms');
        $memory_usage = array_column($metrics, 'memory_peak');
        $success_count = count(array_filter($metrics, function($m) { return $m['success']; }));
        
        return [
            'total_requests' => count($metrics),
            'success_rate' => round(($success_count / count($metrics)) * 100, 2),
            'average_response_time' => round(array_sum($execution_times) / count($execution_times), 2),
            'median_response_time' => $this->calculateMedian($execution_times),
            'min_response_time' => min($execution_times),
            'max_response_time' => max($execution_times),
            'slow_requests' => count(array_filter($execution_times, function($t) { return $t > self::RESPONSE_TIME_THRESHOLD; })),
            'critical_requests' => count(array_filter($execution_times, function($t) { return $t > self::CRITICAL_RESPONSE_TIME; })),
            'average_memory' => round(array_sum($memory_usage) / count($memory_usage)),
            'peak_memory' => max($memory_usage)
        ];
    }
    
    /**
     * Analyze performance trends
     * 
     * @param array $metrics Filtered metrics
     * @return array Performance trends
     */
    private function analyzePerformanceTrends($metrics) {
        // Group metrics by hour for trend analysis
        $hourly_data = [];
        foreach ($metrics as $metric) {
            $hour = date('Y-m-d H:00:00', $metric['timestamp']);
            if (!isset($hourly_data[$hour])) {
                $hourly_data[$hour] = [];
            }
            $hourly_data[$hour][] = $metric['execution_time_ms'];
        }
        
        $trends = [];
        foreach ($hourly_data as $hour => $times) {
            $trends[] = [
                'hour' => $hour,
                'average_time' => round(array_sum($times) / count($times), 2),
                'request_count' => count($times),
                'slow_requests' => count(array_filter($times, function($t) { return $t > self::RESPONSE_TIME_THRESHOLD; }))
            ];
        }
        
        return $trends;
    }
    
    /**
     * Find slowest endpoints
     * 
     * @param array $metrics Filtered metrics
     * @return array Slowest endpoints
     */
    private function findSlowestEndpoints($metrics) {
        $by_action = [];
        foreach ($metrics as $metric) {
            $action = $metric['action'];
            if (!isset($by_action[$action])) {
                $by_action[$action] = [];
            }
            $by_action[$action][] = $metric['execution_time_ms'];
        }
        
        $averages = [];
        foreach ($by_action as $action => $times) {
            $averages[$action] = [
                'action' => $action,
                'average_time' => round(array_sum($times) / count($times), 2),
                'max_time' => max($times),
                'request_count' => count($times),
                'slow_requests' => count(array_filter($times, function($t) { return $t > self::RESPONSE_TIME_THRESHOLD; }))
            ];
        }
        
        // Sort by average time descending
        uasort($averages, function($a, $b) {
            return $b['average_time'] <=> $a['average_time'];
        });
        
        return array_slice($averages, 0, 10, true);
    }
    
    /**
     * Analyze memory usage patterns
     * 
     * @param array $metrics Filtered metrics
     * @return array Memory analysis
     */
    private function analyzeMemoryUsage($metrics) {
        $memory_usage = array_column($metrics, 'memory_peak');
        $memory_percentages = array_column($metrics, 'memory_percentage');
        
        return [
            'average_memory' => round(array_sum($memory_usage) / count($memory_usage)),
            'peak_memory' => max($memory_usage),
            'minimum_memory' => min($memory_usage),
            'average_percentage' => round(array_sum($memory_percentages) / count($memory_percentages), 2),
            'high_memory_requests' => count(array_filter($memory_percentages, function($p) { return $p > 80; })),
            'memory_formatted' => [
                'average' => $this->formatBytes(array_sum($memory_usage) / count($memory_usage)),
                'peak' => $this->formatBytes(max($memory_usage)),
                'minimum' => $this->formatBytes(min($memory_usage))
            ]
        ];
    }
    
    /**
     * Analyze database performance
     * 
     * @param array $metrics Filtered metrics
     * @return array Database analysis
     */
    private function analyzeDatabasePerformance($metrics) {
        $db_times = array_filter(array_column($metrics, 'database_time'));
        $db_queries = array_filter(array_column($metrics, 'database_queries'));
        
        if (empty($db_times)) {
            return ['message' => 'No database performance data available'];
        }
        
        return [
            'average_query_time' => round(array_sum($db_times) / count($db_times), 2),
            'max_query_time' => max($db_times),
            'average_query_count' => round(array_sum($db_queries) / count($db_queries), 2),
            'max_query_count' => max($db_queries),
            'slow_database_requests' => count(array_filter($db_times, function($t) { return $t > 200; }))
        ];
    }
    
    /**
     * Generate performance recommendations
     * 
     * @param array $metrics Filtered metrics
     * @return array Recommendations
     */
    private function generateRecommendations($metrics) {
        $recommendations = [];
        $summary = $this->generateSummaryStats($metrics);
        
        // Response time recommendations
        if ($summary['average_response_time'] > self::RESPONSE_TIME_THRESHOLD) {
            $recommendations[] = [
                'type' => 'response_time',
                'priority' => 'high',
                'message' => "Average response time ({$summary['average_response_time']}ms) exceeds threshold",
                'suggestion' => 'Consider implementing caching, optimizing database queries, or reducing processing complexity'
            ];
        }
        
        // Memory recommendations
        if ($summary['peak_memory'] > $this->parseMemoryLimit(ini_get('memory_limit')) * 0.8) {
            $recommendations[] = [
                'type' => 'memory',
                'priority' => 'medium',
                'message' => 'Peak memory usage is high',
                'suggestion' => 'Review memory-intensive operations and consider optimization'
            ];
        }
        
        // Success rate recommendations
        if ($summary['success_rate'] < 95) {
            $recommendations[] = [
                'type' => 'reliability',
                'priority' => 'high',
                'message' => "Success rate ({$summary['success_rate']}%) is below optimal",
                'suggestion' => 'Review error logs and improve error handling'
            ];
        }
        
        // Database recommendations
        $db_analysis = $this->analyzeDatabasePerformance($metrics);
        if (isset($db_analysis['average_query_time']) && $db_analysis['average_query_time'] > 100) {
            $recommendations[] = [
                'type' => 'database',
                'priority' => 'medium',
                'message' => 'Database queries are slow',
                'suggestion' => 'Optimize database queries, add indexes, or implement query caching'
            ];
        }
        
        return $recommendations;
    }
    
    /**
     * Get recent performance alerts
     * 
     * @return array Recent alerts
     */
    private function getRecentAlerts() {
        return array_slice($this->performance_alerts, -10);
    }
    
    /**
     * Calculate median value
     * 
     * @param array $values Numeric values
     * @return float Median value
     */
    private function calculateMedian($values) {
        sort($values);
        $count = count($values);
        $middle = floor($count / 2);
        
        if ($count % 2) {
            return $values[$middle];
        } else {
            return ($values[$middle - 1] + $values[$middle]) / 2;
        }
    }
    
    /**
     * Calculate memory percentage used
     * 
     * @return float Memory percentage
     */
    private function calculateMemoryPercentage() {
        $current_memory = memory_get_usage(true);
        $memory_limit = $this->parseMemoryLimit(ini_get('memory_limit'));
        
        return round(($current_memory / $memory_limit) * 100, 2);
    }
    
    /**
     * Parse memory limit string to bytes
     * 
     * @param string $memory_limit Memory limit string
     * @return int Memory limit in bytes
     */
    private function parseMemoryLimit($memory_limit) {
        $memory_limit = trim($memory_limit);
        $last = strtolower($memory_limit[strlen($memory_limit) - 1]);
        $memory_limit = (int) $memory_limit;
        
        switch ($last) {
            case 'g':
                $memory_limit *= 1024;
            case 'm':
                $memory_limit *= 1024;
            case 'k':
                $memory_limit *= 1024;
        }
        
        return $memory_limit;
    }
    
    /**
     * Format bytes to human readable format
     * 
     * @param int $bytes Bytes
     * @return string Formatted string
     */
    private function formatBytes($bytes) {
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        
        for ($i = 0; $bytes > 1024 && $i < count($units) - 1; $i++) {
            $bytes /= 1024;
        }
        
        return round($bytes, 2) . ' ' . $units[$i];
    }
    
    /**
     * Calculate request size
     * 
     * @return int Request size in bytes
     */
    private function calculateRequestSize() {
        return strlen(serialize($_POST)) + strlen(serialize($_GET));
    }
    
    /**
     * Calculate response size (estimated)
     * 
     * @return int Estimated response size
     */
    private function calculateResponseSize() {
        // This is an estimation - actual response size would need to be captured differently
        return 1024; // Default estimate
    }
    
    /**
     * Get database query count
     * 
     * @return int Query count
     */
    private function getDatabaseQueryCount() {
        global $wpdb;
        return $wpdb->num_queries ?? 0;
    }
    
    /**
     * Get database query time
     * 
     * @return float Query time in milliseconds
     */
    private function getDatabaseQueryTime() {
        global $wpdb;
        
        if (!empty($wpdb->queries)) {
            $total_time = 0;
            foreach ($wpdb->queries as $query) {
                $total_time += $query[1];
            }
            return round($total_time * 1000, 2); // Convert to milliseconds
        }
        
        return 0;
    }
    
    /**
     * Get cache hits (if caching is available)
     * 
     * @return int Cache hits
     */
    private function getCacheHits() {
        // This would need to be implemented based on the caching system used
        return 0;
    }
    
    /**
     * Get cache misses (if caching is available)
     * 
     * @return int Cache misses
     */
    private function getCacheMisses() {
        // This would need to be implemented based on the caching system used
        return 0;
    }
    
    /**
     * Sanitize SQL query for logging
     * 
     * @param string $query SQL query
     * @return string Sanitized query
     */
    private function sanitizeQuery($query) {
        // Remove potential sensitive data
        $query = preg_replace('/(\bPASSWORD\s*=\s*)[\'"][^\'"]*[\'"]/', '$1[REDACTED]', $query);
        return substr($query, 0, 200) . (strlen($query) > 200 ? '...' : '');
    }
    
    /**
     * Get current performance statistics
     * 
     * @return array Current performance stats
     */
    public function getCurrentStats() {
        return [
            'current_memory' => memory_get_usage(true),
            'peak_memory' => memory_get_peak_usage(true),
            'memory_limit' => ini_get('memory_limit'),
            'memory_percentage' => $this->calculateMemoryPercentage(),
            'execution_time' => round((microtime(true) - $this->request_start_time) * 1000, 2),
            'database_queries' => $this->getDatabaseQueryCount(),
            'database_time' => $this->getDatabaseQueryTime()
        ];
    }
    
    /**
     * Clean up old performance data
     * 
     * @param int $days_to_keep Days to keep data
     * @return int Number of records cleaned
     */
    public function cleanupOldData($days_to_keep = 7) {
        $cutoff_time = time() - ($days_to_keep * 86400);
        
        // Clean metrics
        $metrics = get_option($this->metrics_storage_key, []);
        $filtered_metrics = array_filter($metrics, function($m) use ($cutoff_time) {
            return $m['timestamp'] > $cutoff_time;
        });
        update_option($this->metrics_storage_key, array_values($filtered_metrics));
        
        // Clean slow queries
        $slow_queries = get_option($this->slow_queries_key, []);
        $filtered_queries = array_filter($slow_queries, function($q) use ($cutoff_time) {
            return strtotime($q['timestamp']) > $cutoff_time;
        });
        update_option($this->slow_queries_key, array_values($filtered_queries));
        
        return (count($metrics) - count($filtered_metrics)) + (count($slow_queries) - count($filtered_queries));
    }
}