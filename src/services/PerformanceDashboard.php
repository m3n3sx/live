<?php
/**
 * Performance Dashboard - Real-time Performance Monitoring
 * 
 * Provides real-time performance monitoring dashboard for AJAX endpoints
 * including metrics visualization, alerts, and optimization recommendations.
 * 
 * @package ModernAdminStyler
 * @version 2.4.0 - Security Overhaul
 */

namespace ModernAdminStyler\Services;

class PerformanceDashboard {
    
    // Dashboard configuration
    private $dashboard_config = [
        'refresh_interval' => 5000, // 5 seconds
        'metrics_retention' => 86400, // 24 hours
        'alert_thresholds' => [
            'response_time' => 500,
            'memory_usage' => 64 * 1024 * 1024,
            'error_rate' => 0.05
        ]
    ];
    
    // Performance data storage
    private $performance_data = [];
    
    // Dependencies
    private $performance_monitor;
    private $performance_optimizer;
    private $error_logger;
    
    /**
     * Constructor
     * 
     * @param object $performance_monitor Performance monitor instance
     * @param object $performance_optimizer Performance optimizer instance
     * @param object $error_logger Error logger instance
     */
    public function __construct($performance_monitor, $performance_optimizer, $error_logger) {
        $this->performance_monitor = $performance_monitor;
        $this->performance_optimizer = $performance_optimizer;
        $this->error_logger = $error_logger;
        
        $this->initializeDashboard();
    }
    
    /**
     * Initialize performance dashboard
     */
    private function initializeDashboard() {
        // Register AJAX endpoints for dashboard
        add_action('wp_ajax_mas_performance_dashboard_data', [$this, 'getDashboardData']);
        add_action('wp_ajax_mas_performance_metrics', [$this, 'getPerformanceMetrics']);
        add_action('wp_ajax_mas_performance_alerts', [$this, 'getPerformanceAlerts']);
        add_action('wp_ajax_mas_performance_optimize', [$this, 'triggerOptimization']);
        
        // Register dashboard page
        add_action('admin_menu', [$this, 'addDashboardPage']);
        
        // Register dashboard assets
        add_action('admin_enqueue_scripts', [$this, 'enqueueDashboardAssets']);
        
        // Setup periodic data collection
        add_action('init', [$this, 'setupDataCollection']);
    }
    
    /**
     * Add dashboard page to admin menu
     */
    public function addDashboardPage() {
        add_submenu_page(
            'tools.php',
            'AJAX Performance Dashboard',
            'Performance Monitor',
            'manage_options',
            'mas-performance-dashboard',
            [$this, 'renderDashboardPage']
        );
    }
    
    /**
     * Enqueue dashboard assets
     */
    public function enqueueDashboardAssets($hook) {
        if ($hook !== 'tools_page_mas-performance-dashboard') {
            return;
        }
        
        wp_enqueue_script(
            'mas-performance-dashboard',
            MAS_V2_PLUGIN_URL . 'assets/js/performance-dashboard.js',
            ['jquery', 'chart-js'],
            MAS_V2_VERSION,
            true
        );
        
        wp_enqueue_style(
            'mas-performance-dashboard',
            MAS_V2_PLUGIN_URL . 'assets/css/performance-dashboard.css',
            [],
            MAS_V2_VERSION
        );
        
        // Localize script with dashboard configuration
        wp_localize_script('mas-performance-dashboard', 'masPerformanceDashboard', [
            'ajaxUrl' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('mas_performance_dashboard'),
            'refreshInterval' => $this->dashboard_config['refresh_interval'],
            'thresholds' => $this->dashboard_config['alert_thresholds']
        ]);
    }
    
    /**
     * Render dashboard page
     */
    public function renderDashboardPage() {
        ?>
        <div class="wrap mas-performance-dashboard">
            <h1>AJAX Performance Dashboard</h1>
            
            <!-- Dashboard Overview -->
            <div class="mas-dashboard-overview">
                <div class="mas-metric-cards">
                    <div class="mas-metric-card" id="response-time-card">
                        <div class="mas-metric-icon">⚡</div>
                        <div class="mas-metric-content">
                            <div class="mas-metric-value" id="avg-response-time">--</div>
                            <div class="mas-metric-label">Avg Response Time (ms)</div>
                        </div>
                        <div class="mas-metric-trend" id="response-time-trend"></div>
                    </div>
                    
                    <div class="mas-metric-card" id="throughput-card">
                        <div class="mas-metric-icon">📊</div>
                        <div class="mas-metric-content">
                            <div class="mas-metric-value" id="throughput">--</div>
                            <div class="mas-metric-label">Requests/sec</div>
                        </div>
                        <div class="mas-metric-trend" id="throughput-trend"></div>
                    </div>
                    
                    <div class="mas-metric-card" id="error-rate-card">
                        <div class="mas-metric-icon">🚨</div>
                        <div class="mas-metric-content">
                            <div class="mas-metric-value" id="error-rate">--</div>
                            <div class="mas-metric-label">Error Rate (%)</div>
                        </div>
                        <div class="mas-metric-trend" id="error-rate-trend"></div>
                    </div>
                    
                    <div class="mas-metric-card" id="memory-usage-card">
                        <div class="mas-metric-icon">💾</div>
                        <div class="mas-metric-content">
                            <div class="mas-metric-value" id="memory-usage">--</div>
                            <div class="mas-metric-label">Memory Usage (MB)</div>
                        </div>
                        <div class="mas-metric-trend" id="memory-usage-trend"></div>
                    </div>
                </div>
            </div>
            
            <!-- Performance Charts -->
            <div class="mas-dashboard-charts">
                <div class="mas-chart-container">
                    <h3>Response Time Over Time</h3>
                    <canvas id="response-time-chart"></canvas>
                </div>
                
                <div class="mas-chart-container">
                    <h3>Endpoint Performance Comparison</h3>
                    <canvas id="endpoint-performance-chart"></canvas>
                </div>
                
                <div class="mas-chart-container">
                    <h3>Memory Usage Trends</h3>
                    <canvas id="memory-usage-chart"></canvas>
                </div>
                
                <div class="mas-chart-container">
                    <h3>Database Query Performance</h3>
                    <canvas id="database-performance-chart"></canvas>
                </div>
            </div>
            
            <!-- Performance Alerts -->
            <div class="mas-dashboard-alerts">
                <h3>Performance Alerts</h3>
                <div id="performance-alerts-container">
                    <p>Loading alerts...</p>
                </div>
            </div>
            
            <!-- Endpoint Details -->
            <div class="mas-dashboard-endpoints">
                <h3>Endpoint Performance Details</h3>
                <div class="mas-endpoints-table-container">
                    <table class="mas-endpoints-table" id="endpoints-performance-table">
                        <thead>
                            <tr>
                                <th>Endpoint</th>
                                <th>Avg Response Time</th>
                                <th>Requests/Hour</th>
                                <th>Error Rate</th>
                                <th>Last 24h Trend</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td colspan="6">Loading endpoint data...</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
            
            <!-- Optimization Recommendations -->
            <div class="mas-dashboard-recommendations">
                <h3>Performance Optimization Recommendations</h3>
                <div id="optimization-recommendations">
                    <p>Loading recommendations...</p>
                </div>
            </div>
            
            <!-- Dashboard Controls -->
            <div class="mas-dashboard-controls">
                <button type="button" class="button button-primary" id="refresh-dashboard">
                    Refresh Dashboard
                </button>
                <button type="button" class="button" id="export-performance-data">
                    Export Performance Data
                </button>
                <button type="button" class="button" id="run-optimization">
                    Run Optimization
                </button>
                <button type="button" class="button" id="clear-performance-data">
                    Clear Performance Data
                </button>
            </div>
        </div>
        
        <style>
        .mas-performance-dashboard {
            max-width: 1400px;
        }
        
        .mas-dashboard-overview {
            margin-bottom: 30px;
        }
        
        .mas-metric-cards {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .mas-metric-card {
            background: #fff;
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 20px;
            display: flex;
            align-items: center;
            gap: 15px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            transition: transform 0.2s ease;
        }
        
        .mas-metric-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0,0,0,0.15);
        }
        
        .mas-metric-icon {
            font-size: 2rem;
            width: 50px;
            text-align: center;
        }
        
        .mas-metric-content {
            flex: 1;
        }
        
        .mas-metric-value {
            font-size: 2rem;
            font-weight: bold;
            color: #2271b1;
            margin-bottom: 5px;
        }
        
        .mas-metric-label {
            color: #666;
            font-size: 0.9rem;
        }
        
        .mas-metric-trend {
            width: 60px;
            height: 30px;
            background: #f0f0f0;
            border-radius: 4px;
        }
        
        .mas-dashboard-charts {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .mas-chart-container {
            background: #fff;
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 20px;
        }
        
        .mas-chart-container h3 {
            margin-top: 0;
            margin-bottom: 15px;
            color: #333;
        }
        
        .mas-dashboard-alerts,
        .mas-dashboard-endpoints,
        .mas-dashboard-recommendations {
            background: #fff;
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 20px;
        }
        
        .mas-endpoints-table {
            width: 100%;
            border-collapse: collapse;
        }
        
        .mas-endpoints-table th,
        .mas-endpoints-table td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #ddd;
        }
        
        .mas-endpoints-table th {
            background: #f8f9fa;
            font-weight: 600;
        }
        
        .mas-dashboard-controls {
            text-align: center;
            padding: 20px 0;
        }
        
        .mas-dashboard-controls .button {
            margin: 0 5px;
        }
        
        .mas-alert {
            padding: 12px 16px;
            border-radius: 4px;
            margin-bottom: 10px;
        }
        
        .mas-alert.warning {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            color: #856404;
        }
        
        .mas-alert.critical {
            background: #f8d7da;
            border: 1px solid #f5c6cb;
            color: #721c24;
        }
        
        .mas-recommendation {
            background: #d1ecf1;
            border: 1px solid #bee5eb;
            border-radius: 4px;
            padding: 15px;
            margin-bottom: 10px;
        }
        
        .mas-recommendation h4 {
            margin: 0 0 10px 0;
            color: #0c5460;
        }
        
        .mas-recommendation p {
            margin: 0;
            color: #0c5460;
        }
        </style>
        <?php
    }
    
    /**
     * Get dashboard data via AJAX
     */
    public function getDashboardData() {
        if (!wp_verify_nonce($_POST['nonce'] ?? '', 'mas_performance_dashboard')) {
            wp_send_json_error('Invalid nonce');
            return;
        }
        
        if (!current_user_can('manage_options')) {
            wp_send_json_error('Insufficient permissions');
            return;
        }
        
        try {
            $dashboard_data = [
                'overview' => $this->getOverviewMetrics(),
                'charts' => $this->getChartData(),
                'endpoints' => $this->getEndpointDetails(),
                'alerts' => $this->getActiveAlerts(),
                'recommendations' => $this->getOptimizationRecommendations(),
                'timestamp' => current_time('timestamp')
            ];
            
            wp_send_json_success($dashboard_data);
            
        } catch (Exception $e) {
            wp_send_json_error('Failed to load dashboard data: ' . $e->getMessage());
        }
    }
    
    /**
     * Get overview metrics
     * 
     * @return array Overview metrics
     */
    private function getOverviewMetrics() {
        $metrics = $this->performance_monitor->getRecentMetrics(3600); // Last hour
        
        if (empty($metrics)) {
            return [
                'avg_response_time' => 0,
                'throughput' => 0,
                'error_rate' => 0,
                'memory_usage' => 0
            ];
        }
        
        $response_times = array_column($metrics, 'response_time');
        $errors = array_filter($metrics, function($m) { return !$m['success']; });
        $memory_usage = array_column($metrics, 'memory_used');
        
        return [
            'avg_response_time' => round(array_sum($response_times) / count($response_times)),
            'throughput' => round(count($metrics) / 3600, 2),
            'error_rate' => round((count($errors) / count($metrics)) * 100, 2),
            'memory_usage' => round(array_sum($memory_usage) / count($memory_usage) / 1024 / 1024, 2)
        ];
    }
    
    /**
     * Get chart data
     * 
     * @return array Chart data
     */
    private function getChartData() {
        $metrics = $this->performance_monitor->getRecentMetrics(86400); // Last 24 hours
        
        // Group metrics by hour
        $hourly_data = [];
        foreach ($metrics as $metric) {
            $hour = date('H:00', $metric['timestamp']);
            if (!isset($hourly_data[$hour])) {
                $hourly_data[$hour] = [];
            }
            $hourly_data[$hour][] = $metric;
        }
        
        $chart_data = [
            'response_time' => [],
            'endpoint_performance' => [],
            'memory_usage' => [],
            'database_performance' => []
        ];
        
        foreach ($hourly_data as $hour => $hour_metrics) {
            $avg_response_time = array_sum(array_column($hour_metrics, 'response_time')) / count($hour_metrics);
            $avg_memory = array_sum(array_column($hour_metrics, 'memory_used')) / count($hour_metrics);
            $avg_db_queries = array_sum(array_column($hour_metrics, 'database_queries')) / count($hour_metrics);
            
            $chart_data['response_time'][] = [
                'time' => $hour,
                'value' => round($avg_response_time)
            ];
            
            $chart_data['memory_usage'][] = [
                'time' => $hour,
                'value' => round($avg_memory / 1024 / 1024, 2)
            ];
            
            $chart_data['database_performance'][] = [
                'time' => $hour,
                'value' => round($avg_db_queries, 1)
            ];
        }
        
        // Endpoint performance comparison
        $endpoint_metrics = [];
        foreach ($metrics as $metric) {
            $endpoint = $metric['endpoint'];
            if (!isset($endpoint_metrics[$endpoint])) {
                $endpoint_metrics[$endpoint] = [];
            }
            $endpoint_metrics[$endpoint][] = $metric['response_time'];
        }
        
        foreach ($endpoint_metrics as $endpoint => $times) {
            $chart_data['endpoint_performance'][] = [
                'endpoint' => $endpoint,
                'avg_time' => round(array_sum($times) / count($times))
            ];
        }
        
        return $chart_data;
    }
    
    /**
     * Get endpoint details
     * 
     * @return array Endpoint details
     */
    private function getEndpointDetails() {
        $metrics = $this->performance_monitor->getRecentMetrics(86400); // Last 24 hours
        $endpoint_details = [];
        
        // Group by endpoint
        $endpoint_groups = [];
        foreach ($metrics as $metric) {
            $endpoint = $metric['endpoint'];
            if (!isset($endpoint_groups[$endpoint])) {
                $endpoint_groups[$endpoint] = [];
            }
            $endpoint_groups[$endpoint][] = $metric;
        }
        
        foreach ($endpoint_groups as $endpoint => $endpoint_metrics) {
            $response_times = array_column($endpoint_metrics, 'response_time');
            $errors = array_filter($endpoint_metrics, function($m) { return !$m['success']; });
            
            $endpoint_details[] = [
                'endpoint' => $endpoint,
                'avg_response_time' => round(array_sum($response_times) / count($response_times)),
                'requests_per_hour' => round(count($endpoint_metrics) / 24),
                'error_rate' => round((count($errors) / count($endpoint_metrics)) * 100, 2),
                'trend' => $this->calculateTrend($response_times),
                'status' => $this->getEndpointStatus($endpoint_metrics)
            ];
        }
        
        return $endpoint_details;
    }
    
    /**
     * Get active alerts
     * 
     * @return array Active alerts
     */
    private function getActiveAlerts() {
        $alerts = [];
        $recent_metrics = $this->performance_monitor->getRecentMetrics(300); // Last 5 minutes
        
        if (empty($recent_metrics)) {
            return $alerts;
        }
        
        $avg_response_time = array_sum(array_column($recent_metrics, 'response_time')) / count($recent_metrics);
        $error_count = count(array_filter($recent_metrics, function($m) { return !$m['success']; }));
        $error_rate = $error_count / count($recent_metrics);
        
        // Response time alerts
        if ($avg_response_time > $this->dashboard_config['alert_thresholds']['response_time']) {
            $alerts[] = [
                'type' => 'warning',
                'title' => 'High Response Time',
                'message' => "Average response time is {$avg_response_time}ms, exceeding threshold of {$this->dashboard_config['alert_thresholds']['response_time']}ms",
                'timestamp' => current_time('timestamp')
            ];
        }
        
        // Error rate alerts
        if ($error_rate > $this->dashboard_config['alert_thresholds']['error_rate']) {
            $alerts[] = [
                'type' => 'critical',
                'title' => 'High Error Rate',
                'message' => "Error rate is " . round($error_rate * 100, 2) . "%, exceeding threshold of " . round($this->dashboard_config['alert_thresholds']['error_rate'] * 100, 2) . "%",
                'timestamp' => current_time('timestamp')
            ];
        }
        
        return $alerts;
    }
    
    /**
     * Get optimization recommendations
     * 
     * @return array Optimization recommendations
     */
    private function getOptimizationRecommendations() {
        if (!$this->performance_optimizer) {
            return [];
        }
        
        $recent_metrics = $this->performance_monitor->getRecentMetrics(3600); // Last hour
        $recommendations = [];
        
        if (empty($recent_metrics)) {
            return $recommendations;
        }
        
        $avg_response_time = array_sum(array_column($recent_metrics, 'response_time')) / count($recent_metrics);
        $avg_memory = array_sum(array_column($recent_metrics, 'memory_used')) / count($recent_metrics);
        $avg_db_queries = array_sum(array_column($recent_metrics, 'database_queries')) / count($recent_metrics);
        
        // Response time recommendations
        if ($avg_response_time > 300) {
            $recommendations[] = [
                'title' => 'Optimize Response Time',
                'description' => 'Consider implementing response caching or optimizing database queries to improve response times.',
                'priority' => 'high'
            ];
        }
        
        // Memory usage recommendations
        if ($avg_memory > 32 * 1024 * 1024) { // 32MB
            $recommendations[] = [
                'title' => 'Optimize Memory Usage',
                'description' => 'Memory usage is high. Consider optimizing data structures or implementing lazy loading.',
                'priority' => 'medium'
            ];
        }
        
        // Database query recommendations
        if ($avg_db_queries > 5) {
            $recommendations[] = [
                'title' => 'Optimize Database Queries',
                'description' => 'High number of database queries detected. Consider implementing query caching or optimizing indexes.',
                'priority' => 'high'
            ];
        }
        
        return $recommendations;
    }
    
    /**
     * Setup periodic data collection
     */
    public function setupDataCollection() {
        // Schedule performance data collection
        if (!wp_next_scheduled('mas_collect_performance_data')) {
            wp_schedule_event(time(), 'hourly', 'mas_collect_performance_data');
        }
        
        add_action('mas_collect_performance_data', [$this, 'collectPerformanceData']);
    }
    
    /**
     * Collect performance data
     */
    public function collectPerformanceData() {
        // Collect and store performance metrics
        $metrics = $this->performance_monitor->getRecentMetrics(3600);
        
        // Store aggregated data for dashboard
        $aggregated_data = [
            'timestamp' => current_time('timestamp'),
            'metrics_count' => count($metrics),
            'avg_response_time' => !empty($metrics) ? array_sum(array_column($metrics, 'response_time')) / count($metrics) : 0,
            'error_count' => count(array_filter($metrics, function($m) { return !$m['success']; })),
            'memory_usage' => !empty($metrics) ? array_sum(array_column($metrics, 'memory_used')) / count($metrics) : 0
        ];
        
        // Store in WordPress options (with cleanup of old data)
        $stored_data = get_option('mas_performance_dashboard_data', []);
        $stored_data[] = $aggregated_data;
        
        // Keep only last 24 hours of data
        $cutoff_time = current_time('timestamp') - 86400;
        $stored_data = array_filter($stored_data, function($data) use ($cutoff_time) {
            return $data['timestamp'] >= $cutoff_time;
        });
        
        update_option('mas_performance_dashboard_data', $stored_data);
    }
    
    // Helper methods
    
    private function calculateTrend($values) {
        if (count($values) < 2) {
            return 'stable';
        }
        
        $first_half = array_slice($values, 0, floor(count($values) / 2));
        $second_half = array_slice($values, floor(count($values) / 2));
        
        $first_avg = array_sum($first_half) / count($first_half);
        $second_avg = array_sum($second_half) / count($second_half);
        
        $change = ($second_avg - $first_avg) / $first_avg;
        
        if ($change > 0.1) {
            return 'increasing';
        } elseif ($change < -0.1) {
            return 'decreasing';
        } else {
            return 'stable';
        }
    }
    
    private function getEndpointStatus($metrics) {
        $recent_metrics = array_slice($metrics, -10); // Last 10 requests
        $error_count = count(array_filter($recent_metrics, function($m) { return !$m['success']; }));
        $error_rate = $error_count / count($recent_metrics);
        
        if ($error_rate > 0.2) {
            return 'critical';
        } elseif ($error_rate > 0.1) {
            return 'warning';
        } else {
            return 'healthy';
        }
    }
}