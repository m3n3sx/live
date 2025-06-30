<?php
/**
 * Analytics Engine - Advanced Analytics & Reporting System
 * 
 * FAZA 6: Enterprise Integration & Analytics
 * Zaawansowany system analityki i raportowania dla enterprise
 * 
 * @package ModernAdminStyler
 * @version 3.3.0
 */

namespace ModernAdminStyler\Services;

class AnalyticsEngine {
    
    private $serviceFactory;
    private $cacheManager;
    private $metricsBuffer = [];
    private $sessionId;
    
    // 📊 Typy metryk
    const METRIC_PERFORMANCE = 'performance';
    const METRIC_USER_BEHAVIOR = 'user_behavior';
    const METRIC_SYSTEM_HEALTH = 'system_health';
    const METRIC_SECURITY = 'security';
    const METRIC_ERROR = 'error';
    
    // 🎯 Poziomy ważności
    const SEVERITY_LOW = 'low';
    const SEVERITY_MEDIUM = 'medium';
    const SEVERITY_HIGH = 'high';
    const SEVERITY_CRITICAL = 'critical';
    
    // ⏰ Okresy raportowania
    const PERIOD_HOURLY = 'hourly';
    const PERIOD_DAILY = 'daily';
    const PERIOD_WEEKLY = 'weekly';
    const PERIOD_MONTHLY = 'monthly';
    
    public function __construct($serviceFactory) {
        $this->serviceFactory = $serviceFactory;
        $this->cacheManager = $serviceFactory->getAdvancedCacheManager();
        $this->sessionId = $this->generateSessionId();
        
        $this->initAnalytics();
    }
    
    /**
     * 🚀 Inicjalizacja systemu analityki
     */
    private function initAnalytics() {
        // Rozpocznij sesję analityczną
        $this->startAnalyticsSession();
        
        // Zaplanuj automatyczne raporty
        $this->scheduleAutomaticReports();
        
        // Konfiguruj zbieranie metryk
        $this->setupMetricsCollection();
        
        // Rejestruj event listenery
        $this->registerEventListeners();
    }
    
    /**
     * 📈 Zbierz metrykę
     */
    public function collectMetric($type, $name, $value, $metadata = []) {
        $metric = [
            'id' => uniqid('metric_'),
            'session_id' => $this->sessionId,
            'type' => $type,
            'name' => $name,
            'value' => $value,
            'metadata' => $metadata,
            'timestamp' => microtime(true),
            'datetime' => current_time('mysql'),
            'user_id' => get_current_user_id(),
            'ip_address' => $this->getClientIP(),
            'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? '',
            'page_url' => $_SERVER['REQUEST_URI'] ?? '',
            'memory_usage' => memory_get_usage(true),
            'peak_memory' => memory_get_peak_usage(true)
        ];
        
        // Dodaj do bufora
        $this->metricsBuffer[] = $metric;
        
        // Flush buffer jeśli przekroczył limit
        if (count($this->metricsBuffer) >= 50) {
            $this->flushMetricsBuffer();
        }
        
        // Trigger real-time alerts jeśli krytyczne
        if (isset($metadata['severity']) && $metadata['severity'] === self::SEVERITY_CRITICAL) {
            $this->triggerCriticalAlert($metric);
        }
        
        return $metric['id'];
    }
    
    /**
     * ⚡ Zbierz metrykę performance
     */
    public function collectPerformanceMetric($name, $duration, $metadata = []) {
        return $this->collectMetric(self::METRIC_PERFORMANCE, $name, $duration, array_merge([
            'unit' => 'milliseconds',
            'category' => 'timing'
        ], $metadata));
    }
    
    /**
     * 👤 Zbierz metrykę user behavior
     */
    public function collectUserBehaviorMetric($action, $target, $metadata = []) {
        return $this->collectMetric(self::METRIC_USER_BEHAVIOR, $action, $target, array_merge([
            'category' => 'interaction',
            'session_time' => $this->getSessionDuration()
        ], $metadata));
    }
    
    /**
     * 🏥 Zbierz metrykę system health
     */
    public function collectSystemHealthMetric($component, $status, $metadata = []) {
        $severity = $status === 'healthy' ? self::SEVERITY_LOW : 
                   ($status === 'warning' ? self::SEVERITY_MEDIUM : self::SEVERITY_HIGH);
        
        return $this->collectMetric(self::METRIC_SYSTEM_HEALTH, $component, $status, array_merge([
            'severity' => $severity,
            'php_version' => PHP_VERSION,
            'wp_version' => get_bloginfo('version'),
            'plugin_version' => defined('MAS_V2_VERSION') ? MAS_V2_VERSION : '3.3.0'
        ], $metadata));
    }
    
    /**
     * 🛡️ Zbierz metrykę security
     */
    public function collectSecurityMetric($event, $details, $metadata = []) {
        return $this->collectMetric(self::METRIC_SECURITY, $event, $details, array_merge([
            'severity' => self::SEVERITY_HIGH,
            'requires_review' => true
        ], $metadata));
    }
    
    /**
     * ❌ Zbierz metrykę błędu
     */
    public function collectErrorMetric($error_type, $message, $metadata = []) {
        return $this->collectMetric(self::METRIC_ERROR, $error_type, $message, array_merge([
            'severity' => self::SEVERITY_MEDIUM,
            'stack_trace' => debug_backtrace(DEBUG_BACKTRACE_IGNORE_ARGS, 10)
        ], $metadata));
    }
    
    /**
     * 💾 Flush metrics buffer do storage
     */
    public function flushMetricsBuffer() {
        if (empty($this->metricsBuffer)) {
            return 0;
        }
        
        $flushed = 0;
        
        try {
            // Zapisz do bazy danych
            $this->saveMetricsToDatabase($this->metricsBuffer);
            
            // Aktualizuj cache'owane agregaty
            $this->updateCachedAggregates($this->metricsBuffer);
            
            // Wyślij do external analytics (jeśli skonfigurowane)
            $this->sendToExternalAnalytics($this->metricsBuffer);
            
            $flushed = count($this->metricsBuffer);
            $this->metricsBuffer = [];
            
        } catch (\Exception $e) {
            error_log('MAS Analytics: Failed to flush metrics - ' . $e->getMessage());
        }
        
        return $flushed;
    }
    
    /**
     * 📊 Generuj raport
     */
    public function generateReport($period = self::PERIOD_DAILY, $metrics = [], $options = []) {
        $startTime = microtime(true);
        
        // Określ zakres czasowy
        $timeRange = $this->getTimeRange($period);
        
        // Pobierz dane
        $data = $this->getMetricsData($timeRange, $metrics);
        
        // Przygotuj agregaty
        $aggregates = $this->calculateAggregates($data);
        
        // Generuj insights
        $insights = $this->generateInsights($data, $aggregates);
        
        // Przygotuj wykres danych
        $chartData = $this->prepareChartData($data, $period);
        
        $generationTime = microtime(true) - $startTime;
        
        $report = [
            'id' => uniqid('report_'),
            'period' => $period,
            'time_range' => $timeRange,
            'generated_at' => current_time('mysql'),
            'generation_time' => $generationTime,
            'data_points' => count($data),
            'summary' => $aggregates,
            'insights' => $insights,
            'chart_data' => $chartData,
            'raw_data' => $options['include_raw'] ?? false ? $data : null,
            'metadata' => [
                'plugin_version' => defined('MAS_V2_VERSION') ? MAS_V2_VERSION : '3.3.0',
                'wp_version' => get_bloginfo('version'),
                'site_url' => get_site_url(),
                'generated_by' => get_current_user_id()
            ]
        ];
        
        // Cache raport
        $this->cacheManager->set("analytics_report_{$period}", $report, 3600);
        
        return $report;
    }
    
    /**
     * 📊 Pobierz dashboard statistics
     */
    public function getDashboardStats() {
        $cached = $this->cacheManager->get('analytics_dashboard_stats');
        if ($cached) {
            return $cached;
        }
        
        $stats = [
            'today' => $this->generateReport(self::PERIOD_DAILY),
            'week' => $this->generateReport(self::PERIOD_WEEKLY),
            'system_health' => $this->getSystemHealthStatus(),
            'alerts' => $this->getActiveAlerts(),
            'user_activity' => $this->getUserActivitySummary()
        ];
        
        $this->cacheManager->set('analytics_dashboard_stats', $stats, 300); // 5 minut
        
        return $stats;
    }
    
    // Metody pomocnicze
    private function generateSessionId() {
        return 'session_' . time() . '_' . uniqid();
    }
    
    private function getClientIP() {
        $ip_keys = ['HTTP_CLIENT_IP', 'HTTP_X_FORWARDED_FOR', 'REMOTE_ADDR'];
        foreach ($ip_keys as $key) {
            if (array_key_exists($key, $_SERVER) === true) {
                foreach (explode(',', $_SERVER[$key]) as $ip) {
                    $ip = trim($ip);
                    if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE) !== false) {
                        return $ip;
                    }
                }
            }
        }
        return $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    }
    
    private function getSessionDuration() {
        $sessionStart = $this->cacheManager->get("session_start_{$this->sessionId}");
        if (!$sessionStart) {
            $sessionStart = time();
            $this->cacheManager->set("session_start_{$this->sessionId}", $sessionStart, 3600);
        }
        return time() - $sessionStart;
    }
    
    private function startAnalyticsSession() {
        $this->collectSystemHealthMetric('analytics_engine', 'healthy', [
            'session_id' => $this->sessionId,
            'startup_time' => microtime(true)
        ]);
    }
    
    private function scheduleAutomaticReports() {
        if (!wp_next_scheduled('mas_v2_analytics_daily_report')) {
            wp_schedule_event(time(), 'daily', 'mas_v2_analytics_daily_report');
        }
    }
    
    private function setupMetricsCollection() {
        add_action('init', [$this, 'collectSystemMetrics']);
    }
    
    private function registerEventListeners() {
        add_action('wp_login', [$this, 'onUserLogin'], 10, 2);
        add_action('wp_logout', [$this, 'onUserLogout']);
        add_action('admin_init', [$this, 'onAdminInit']);
    }
    
    public function collectSystemMetrics() {
        $this->collectSystemHealthMetric('php_memory', 'healthy', [
            'current_usage' => memory_get_usage(true),
            'peak_usage' => memory_get_peak_usage(true),
            'limit' => ini_get('memory_limit')
        ]);
    }
    
    public function onUserLogin($user_login, $user) {
        $this->collectUserBehaviorMetric('login', $user_login, [
            'user_id' => $user->ID,
            'user_role' => implode(',', $user->roles)
        ]);
    }
    
    public function onUserLogout() {
        $this->collectUserBehaviorMetric('logout', get_current_user_id());
    }
    
    public function onAdminInit() {
        $this->collectUserBehaviorMetric('admin_page_view', $_SERVER['REQUEST_URI'] ?? '');
    }
    
    private function triggerCriticalAlert($metric) {
        do_action('mas_v2_critical_alert', $metric);
        error_log('MAS V2 CRITICAL ALERT: ' . json_encode($metric));
    }
    
    private function getTimeRange($period) {
        $now = current_time('timestamp');
        
        switch ($period) {
            case self::PERIOD_HOURLY:
                return ['start' => $now - HOUR_IN_SECONDS, 'end' => $now, 'format' => 'Y-m-d H:i'];
            case self::PERIOD_DAILY:
                return ['start' => $now - DAY_IN_SECONDS, 'end' => $now, 'format' => 'Y-m-d H:00'];
            case self::PERIOD_WEEKLY:
                return ['start' => $now - WEEK_IN_SECONDS, 'end' => $now, 'format' => 'Y-m-d'];
            case self::PERIOD_MONTHLY:
                return ['start' => $now - MONTH_IN_SECONDS, 'end' => $now, 'format' => 'Y-m-d'];
            default:
                return $this->getTimeRange(self::PERIOD_DAILY);
        }
    }
    
    private function getMetricsData($timeRange, $metrics = []) {
        // Placeholder - w rzeczywistości pobierałby z bazy danych
        return [];
    }
    
    private function calculateAggregates($data) {
        return [
            'total_metrics' => count($data),
            'performance' => ['avg_duration' => 0, 'error_rate' => 0],
            'user_behavior' => ['total_interactions' => 0, 'unique_users' => 0],
            'system_health' => ['healthy_count' => 0, 'warning_count' => 0]
        ];
    }
    
    private function generateInsights($data, $aggregates) {
        return [];
    }
    
    private function prepareChartData($data, $period) {
        return ['performance' => [], 'user_behavior' => [], 'timeline' => []];
    }
    
    private function saveMetricsToDatabase($metrics) {
        // Placeholder dla zapisu do bazy danych
        return true;
    }
    
    private function updateCachedAggregates($metrics) {
        // Placeholder dla aktualizacji cache
    }
    
    private function sendToExternalAnalytics($metrics) {
        // Placeholder dla external analytics
    }
    
    private function getSystemHealthStatus() {
        return [
            'overall' => 'healthy',
            'components' => [
                'database' => 'healthy',
                'cache' => 'healthy',
                'memory' => memory_get_usage(true) < 128 * 1024 * 1024 ? 'healthy' : 'warning'
            ]
        ];
    }
    
    private function getActiveAlerts() {
        return [];
    }
    
    private function getUserActivitySummary() {
        return [
            'active_users_today' => 0,
            'total_sessions' => 0,
            'avg_session_duration' => 0
        ];
    }
} 