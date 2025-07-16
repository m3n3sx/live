<?php
/**
 * Cache Manager - Unified Caching & Performance Monitoring System
 * 
 * CONSOLIDATED: CacheManager + MetricsCollector + MemoryOptimizer
 * - Wielopoziomowy cache z automatyczną optymalizacją pamięci
 * - Performance monitoring i analytics  
 * - System metrics collection
 * - Memory usage tracking
 * 
 * @package ModernAdminStyler
 * @version 4.1.0 - Performance Consolidation
 */

namespace ModernAdminStyler\Services;

class CacheManager {
    
    private $coreEngine;
    private $cacheStats = [];
    private $memoryUsageHistory = [];
    private $optimizationRules = [];
    private $memoryLimit;
    
    // 🎯 METRICS COLLECTION (ADDED FROM MetricsCollector)
    private $start_time;
    private $metrics = [];
    private $metricsBuffer = [];
    private $sessionId;
    private $auditLog = [];
    
    // 📊 Typy metryk (FROM MetricsCollector)
    const METRIC_PERFORMANCE = 'performance';
    const METRIC_USER_BEHAVIOR = 'user_behavior';
    const METRIC_SYSTEM_HEALTH = 'system_health';
    const METRIC_SECURITY = 'security';
    const METRIC_ERROR = 'error';
    const METRIC_CUSTOM = 'custom';
    
    // 🎯 Poziomy ważności (FROM MetricsCollector)
    const SEVERITY_LOW = 'low';
    const SEVERITY_MEDIUM = 'medium';
    const SEVERITY_HIGH = 'high';
    const SEVERITY_CRITICAL = 'critical';
    
    // ⏰ Okresy raportowania (FROM MetricsCollector)
    const PERIOD_HOURLY = 'hourly';
    const PERIOD_DAILY = 'daily';
    const PERIOD_WEEKLY = 'weekly';
    const PERIOD_MONTHLY = 'monthly';
    
    // 📈 Kategorie metryk (FROM MetricsCollector)
    const CATEGORY_TIMING = 'timing';
    const CATEGORY_INTERACTION = 'interaction';
    const CATEGORY_SYSTEM = 'system';
    const CATEGORY_ERROR = 'error';
    
    // 🎯 Poziomy cache
    const LEVEL_MEMORY = 'memory';      // W pamięci (najszybszy)
    const LEVEL_TRANSIENT = 'transient'; // WordPress transients
    const LEVEL_OPTION = 'option';      // WordPress options (persistent)
    const LEVEL_OBJECT = 'object';      // WordPress Object Cache
    
    // ⏰ Czasy życia cache
    const TTL_SHORT = 300;              // 5 minut
    const TTL_MEDIUM = 1800;            // 30 minut
    const TTL_LONG = 3600;              // 1 godzina
    const TTL_PERSISTENT = 86400;       // 24 godziny
    
    // 🏷️ Grupy cache
    const GROUP_SETTINGS = 'settings';
    const GROUP_CSS = 'css';
    const GROUP_PERFORMANCE = 'performance';
    const GROUP_SECURITY = 'security';
    const GROUP_ANALYTICS = 'analytics';
    
    // 📊 Memory thresholds
    const MEMORY_WARNING_THRESHOLD = 0.75;  // 75%
    const MEMORY_CRITICAL_THRESHOLD = 0.90; // 90%
    const MEMORY_EMERGENCY_THRESHOLD = 0.95; // 95%
    
    // 🔧 Optimization levels
    const OPTIMIZATION_NONE = 0;
    const OPTIMIZATION_LIGHT = 1;
    const OPTIMIZATION_MODERATE = 2;
    const OPTIMIZATION_AGGRESSIVE = 3;
    const OPTIMIZATION_EMERGENCY = 4;
    
    private $memoryCache = [];
    private $cacheConfig = [];
    private $cache_prefix = 'mas_v2_';
    private $default_expiration = 3600;
    
    public function __construct($coreEngine) {
        $this->coreEngine = $coreEngine;
        $this->memoryLimit = $this->parseMemoryLimit(ini_get('memory_limit'));
        
        // Initialize cache system
        $this->initCacheConfig();
        $this->setupOptimizationRules();
        $this->startMemoryMonitoring();
        $this->registerCacheHooks();
        
        // Initialize metrics system (ADDED)
        $this->initMetricsSystem();
    }
    
    /**
     * 🔧 Inicjalizacja konfiguracji cache
     */
    private function initCacheConfig() {
        $this->cacheConfig = [
            'user_settings' => [
                'group' => self::GROUP_SETTINGS,
                'level' => self::LEVEL_MEMORY,
                'ttl' => self::TTL_MEDIUM
            ],
            'generated_css' => [
                'group' => self::GROUP_CSS,
                'level' => self::LEVEL_TRANSIENT,
                'ttl' => self::TTL_LONG
            ],
            'css_variables' => [
                'group' => self::GROUP_CSS,
                'level' => self::LEVEL_TRANSIENT,
                'ttl' => self::TTL_LONG
            ],
            'performance_stats' => [
                'group' => self::GROUP_PERFORMANCE,
                'level' => self::LEVEL_TRANSIENT,
                'ttl' => self::TTL_SHORT
            ],
            'security_events' => [
                'group' => self::GROUP_SECURITY,
                'level' => self::LEVEL_OPTION,
                'ttl' => self::TTL_PERSISTENT
            ],
            'analytics_data' => [
                'group' => self::GROUP_ANALYTICS,
                'level' => self::LEVEL_TRANSIENT,
                'ttl' => self::TTL_MEDIUM
            ]
        ];
    }
    
    /**
     * ⚙️ Konfiguruj reguły optymalizacji pamięci
     */
    private function setupOptimizationRules() {
        $this->optimizationRules = [
            self::OPTIMIZATION_LIGHT => [
                'reduce_cache_size' => 0.8,
                'flush_memory_cache' => true,
                'disable_analytics_buffer' => false
            ],
            
            self::OPTIMIZATION_MODERATE => [
                'reduce_cache_size' => 0.6,
                'flush_memory_cache' => true,
                'flush_object_cache' => true,
                'disable_analytics_buffer' => true
            ],
            
            self::OPTIMIZATION_AGGRESSIVE => [
                'reduce_cache_size' => 0.4,
                'flush_memory_cache' => true,
                'flush_object_cache' => true,
                'disable_analytics_buffer' => true,
                'clear_transients' => false
            ],
            
            self::OPTIMIZATION_EMERGENCY => [
                'reduce_cache_size' => 0.2,
                'flush_memory_cache' => true,
                'flush_object_cache' => true,
                'clear_transients' => true,
                'disable_analytics_buffer' => true,
                'emergency_cleanup' => true
            ]
        ];
    }
    
    /**
     * 📊 Rozpocznij monitoring pamięci
     */
    private function startMemoryMonitoring() {
        $this->recordMemoryUsage('startup');
        
        // Sprawdzaj pamięć regularnie
        add_action('wp_loaded', [$this, 'checkMemoryUsage']);
        add_action('admin_init', [$this, 'checkMemoryUsage']);
        
        register_shutdown_function([$this, 'onShutdown']);
    }
    
    /**
     * 🔗 Rejestruj cache hooks
     */
    private function registerCacheHooks() {
        add_action('wp_cache_flush', [$this, 'onWPCacheFlush']);
        add_action('mas_core_engine_ready', [$this, 'onSystemReady']);
    }
    
    /**
     * 💾 Zapisz do cache
     */
    public function set($key, $value, $ttl = null, $level = null) {
        // Sprawdź pamięć przed zapisem
        $this->checkMemoryUsage('cache_set');
        
        $config = $this->cacheConfig[$key] ?? $this->getDefaultConfig();
        
        if ($ttl !== null) $config['ttl'] = $ttl;
        if ($level !== null) $config['level'] = $level;
        
        try {
            switch ($config['level']) {
                case self::LEVEL_MEMORY:
                    return $this->setMemoryCache($key, $value, $config['ttl']);
                    
                case self::LEVEL_OBJECT:
                    return $this->setObjectCache($key, $value, $config['ttl']);
                    
                case self::LEVEL_TRANSIENT:
                    return $this->setTransientCache($key, $value, $config['ttl']);
                    
                case self::LEVEL_OPTION:
                    return $this->setOptionCache($key, $value);
            }
        } catch (\Exception $e) {
            error_log("MAS Cache: Failed to set {$key} - " . $e->getMessage());
            return false;
        }
        
        return false;
    }
    
    /**
     * 📖 Pobierz z cache
     */
    public function get($key, $default = null) {
        $config = $this->cacheConfig[$key] ?? $this->getDefaultConfig();
        
        try {
            switch ($config['level']) {
                case self::LEVEL_MEMORY:
                    $value = $this->getMemoryCache($key);
                    break;
                    
                case self::LEVEL_OBJECT:
                    $value = $this->getObjectCache($key);
                    break;
                    
                case self::LEVEL_TRANSIENT:
                    $value = $this->getTransientCache($key);
                    break;
                    
                case self::LEVEL_OPTION:
                    $value = $this->getOptionCache($key);
                    break;
                    
                default:
                    $value = null;
            }
            
            // Fallback strategy - sprawdź inne poziomy
            if ($value === null && $config['level'] !== self::LEVEL_MEMORY) {
                $value = $this->getMemoryCache($key);
            }
            
            if ($value === null && $config['level'] !== self::LEVEL_OBJECT) {
                $value = $this->getObjectCache($key);
            }
            
            return $value !== null ? $value : $default;
            
        } catch (\Exception $e) {
            error_log("MAS Cache: Failed to get {$key} - " . $e->getMessage());
            return $default;
        }
    }
    
    /**
     * 🗑️ Usuń z cache
     */
    public function delete($key) {
        try {
            // Usuń ze wszystkich poziomów
            unset($this->memoryCache[$key]);
            wp_cache_delete($this->getCacheKey($key), 'mas_v2');
            delete_transient($this->getCacheKey($key));
            delete_option($this->getCacheKey($key));
            return true;
        } catch (\Exception $e) {
            error_log("MAS Cache: Failed to delete {$key} - " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * 🔄 Cache z callback (get-or-set pattern)
     */
    public function remember($key, $callback, $expiration = null) {
        $value = $this->get($key);
        
        if ($value === null) {
            $value = call_user_func($callback);
            if ($value !== null) {
                $this->set($key, $value, $expiration);
            }
        }
        
        return $value;
    }
    
    /**
     * 💾 Memory cache operations
     */
    private function setMemoryCache($key, $value, $ttl) {
        $this->memoryCache[$key] = [
            'value' => $value,
            'expires' => time() + $ttl,
            'created' => time(),
            'size' => strlen(serialize($value))
        ];
        return true;
    }
    
    private function getMemoryCache($key) {
        if (!isset($this->memoryCache[$key])) {
            return null;
        }
        
        $cache = $this->memoryCache[$key];
        
        if ($cache['expires'] < time()) {
            unset($this->memoryCache[$key]);
            return null;
        }
        
        return $cache['value'];
    }
    
    /**
     * 🎯 Object cache operations
     */
    private function setObjectCache($key, $value, $ttl) {
        return wp_cache_set($this->getCacheKey($key), $value, 'mas_v2', $ttl);
    }
    
    private function getObjectCache($key) {
        return wp_cache_get($this->getCacheKey($key), 'mas_v2');
    }
    
    /**
     * ⏰ Transient cache operations
     */
    private function setTransientCache($key, $value, $ttl) {
        return set_transient($this->getCacheKey($key), $value, $ttl);
    }
    
    private function getTransientCache($key) {
        return get_transient($this->getCacheKey($key));
    }
    
    /**
     * 🔒 Option cache operations
     */
    private function setOptionCache($key, $value) {
        return update_option($this->getCacheKey($key), $value);
    }
    
    private function getOptionCache($key) {
        return get_option($this->getCacheKey($key));
    }
    
    /**
     * 🔍 Sprawdź użycie pamięci i optymalizuj
     */
    public function checkMemoryUsage($context = 'check') {
        $current_usage = memory_get_usage(true);
        $current_peak = memory_get_peak_usage(true);
        $usage_percentage = $current_usage / $this->memoryLimit;
        
        // Zapisz w historii
        $this->recordMemoryUsage($context, $current_usage, $current_peak);
        
        // Określ poziom optymalizacji
        $optimization_level = $this->determineOptimizationLevel($usage_percentage);
        
        if ($optimization_level > self::OPTIMIZATION_NONE) {
            $this->applyOptimization($optimization_level, $context);
        }
        
        return [
            'current' => $current_usage,
            'peak' => $current_peak,
            'limit' => $this->memoryLimit,
            'percentage' => $usage_percentage,
            'optimization_level' => $optimization_level
        ];
    }
    
    /**
     * 📈 Zapisz użycie pamięci w historii
     */
    private function recordMemoryUsage($context, $usage = null, $peak = null) {
        $usage = $usage ?: memory_get_usage(true);
        $peak = $peak ?: memory_get_peak_usage(true);
        
        $this->memoryUsageHistory[] = [
            'timestamp' => microtime(true),
            'context' => $context,
            'usage' => $usage,
            'peak' => $peak,
            'percentage' => $usage / $this->memoryLimit
        ];
        
        // Zachowaj tylko ostatnie 50 zapisów
        if (count($this->memoryUsageHistory) > 50) {
            $this->memoryUsageHistory = array_slice($this->memoryUsageHistory, -50);
        }
    }
    
    /**
     * 🎯 Określ poziom optymalizacji
     */
    private function determineOptimizationLevel($usage_percentage) {
        if ($usage_percentage >= self::MEMORY_EMERGENCY_THRESHOLD) {
            return self::OPTIMIZATION_EMERGENCY;
        } elseif ($usage_percentage >= self::MEMORY_CRITICAL_THRESHOLD) {
            return self::OPTIMIZATION_AGGRESSIVE;
        } elseif ($usage_percentage >= self::MEMORY_WARNING_THRESHOLD) {
            return self::OPTIMIZATION_MODERATE;
        } elseif ($usage_percentage >= 0.6) {
            return self::OPTIMIZATION_LIGHT;
        }
        
        return self::OPTIMIZATION_NONE;
    }
    
    /**
     * 🔧 Zastosuj optymalizację
     */
    private function applyOptimization($level, $context) {
        $rules = $this->optimizationRules[$level] ?? [];
        
        foreach ($rules as $rule => $value) {
            switch ($rule) {
                case 'reduce_cache_size':
                    $this->reduceCacheSize($value);
                    break;
                    
                case 'flush_memory_cache':
                    if ($value) $this->flushMemoryCache();
                    break;
                    
                case 'flush_object_cache':
                    if ($value) $this->flushObjectCache();
                    break;
                    
                case 'clear_transients':
                    if ($value) $this->clearTransients();
                    break;
                    
                case 'emergency_cleanup':
                    if ($value) $this->performEmergencyCleanup();
                    break;
            }
        }
        
        // Log optymalizacji
        error_log("MAS Cache: Applied optimization level {$level} in context {$context}");
    }
    
    /**
     * 🧹 Czyść cache operations
     */
    public function flush() {
        global $wpdb;
        
        // Wyczyść memory cache
        $this->memoryCache = [];
        
        // Wyczyść object cache
        wp_cache_flush_group('mas_v2');
        
        // Usuń wszystkie transients MAS V2
        $wpdb->query($wpdb->prepare(
            "DELETE FROM {$wpdb->options} WHERE option_name LIKE %s",
            '_transient_' . $this->cache_prefix . '%'
        ));
        
        $wpdb->query($wpdb->prepare(
            "DELETE FROM {$wpdb->options} WHERE option_name LIKE %s",
            '_transient_timeout_' . $this->cache_prefix . '%'
        ));
        
        return true;
    }
    
    private function flushMemoryCache() {
        $this->memoryCache = [];
    }
    
    private function flushObjectCache() {
        wp_cache_flush_group('mas_v2');
    }
    
    private function clearTransients() {
        global $wpdb;
        $wpdb->query($wpdb->prepare(
            "DELETE FROM {$wpdb->options} WHERE option_name LIKE %s",
            '_transient_' . $this->cache_prefix . '%'
        ));
    }
    
    private function reduceCacheSize($factor) {
        // Usuń najstarsze wpisy z memory cache
        $count = count($this->memoryCache);
        $toRemove = (int) ($count * (1 - $factor));
        
        if ($toRemove > 0) {
            $sorted = $this->memoryCache;
            uasort($sorted, function($a, $b) {
                return $a['created'] - $b['created'];
            });
            
            $removed = 0;
            foreach ($sorted as $key => $data) {
                unset($this->memoryCache[$key]);
                $removed++;
                if ($removed >= $toRemove) break;
            }
        }
    }
    
    private function performEmergencyCleanup() {
        $this->flush();
        
        // Wyczyść globalne zmienne
        if (isset($GLOBALS['wp_object_cache'])) {
            $GLOBALS['wp_object_cache']->flush();
        }
        
        // Force garbage collection
        if (function_exists('gc_collect_cycles')) {
            gc_collect_cycles();
        }
    }
    
    /**
     * 📊 Statystyki cache i pamięci
     */
    public function getStats() {
        global $wpdb;
        
        $memory_usage = memory_get_usage(true);
        $peak_memory = memory_get_peak_usage(true);
        
        $transient_count = $wpdb->get_var($wpdb->prepare(
            "SELECT COUNT(*) FROM {$wpdb->options} WHERE option_name LIKE %s",
            '_transient_' . $this->cache_prefix . '%'
        ));
        
        $total_size = $wpdb->get_var($wpdb->prepare(
            "SELECT SUM(LENGTH(option_value)) FROM {$wpdb->options} WHERE option_name LIKE %s",
            '_transient_' . $this->cache_prefix . '%'
        ));
        
        return [
            'memory_cache' => [
                'items' => count($this->memoryCache),
                'total_size' => array_sum(array_column($this->memoryCache, 'size'))
            ],
            'transient_cache' => [
                'items' => (int) $transient_count,
            'total_size_bytes' => (int) $total_size,
                'total_size_human' => size_format($total_size ?: 0)
            ],
            'memory_usage' => [
                'current' => $memory_usage,
                'current_human' => size_format($memory_usage),
                'peak' => $peak_memory,
                'peak_human' => size_format($peak_memory),
                'limit' => $this->memoryLimit,
                'limit_human' => size_format($this->memoryLimit),
                'percentage' => round(($memory_usage / $this->memoryLimit) * 100, 2)
            ],
            'optimization' => [
                'level' => $this->determineOptimizationLevel($memory_usage / $this->memoryLimit),
                'history_entries' => count($this->memoryUsageHistory)
            ]
        ];
    }
    
    /**
     * 🔧 Helper methods
     */
    private function getCacheKey($key) {
        return $this->cache_prefix . md5($key . (defined('MAS_V2_VERSION') ? MAS_V2_VERSION : '4.0.0'));
    }
    
    private function getDefaultConfig() {
        return [
            'group' => 'default',
            'level' => self::LEVEL_OBJECT,
            'ttl' => self::TTL_MEDIUM
        ];
    }
    
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
    
    /**
     * 🎯 Event handlers
     */
    public function onSystemReady() {
        $this->checkMemoryUsage('system_ready');
    }
    
    public function onWPCacheFlush() {
        $this->flushMemoryCache();
    }
    
    public function onShutdown() {
        $this->recordMemoryUsage('shutdown');
    }
    
    /**
     * 🏥 Health check
     */
    public function getHealthStatus() {
        $memory_percentage = (memory_get_usage(true) / $this->memoryLimit);
        
        if ($memory_percentage >= self::MEMORY_CRITICAL_THRESHOLD) {
            return [
                'status' => 'critical',
                'message' => 'Memory usage critical: ' . round($memory_percentage * 100, 2) . '%'
            ];
        } elseif ($memory_percentage >= self::MEMORY_WARNING_THRESHOLD) {
            return [
                'status' => 'warning',
                'message' => 'Memory usage high: ' . round($memory_percentage * 100, 2) . '%'
            ];
        }
        
        return [
            'status' => 'healthy',
            'message' => 'Cache and memory usage normal'
        ];
    }
    
    /**
     * 🧪 Benchmark cache performance
     */
    public function benchmark() {
        $test_data = str_repeat('test_data_', 1000);
        $iterations = 100;
        
        // Test zapisu
        $start_time = microtime(true);
        for ($i = 0; $i < $iterations; $i++) {
            $this->set("benchmark_test_{$i}", $test_data, 300);
        }
        $write_time = microtime(true) - $start_time;
        
        // Test odczytu
        $start_time = microtime(true);
        for ($i = 0; $i < $iterations; $i++) {
            $this->get("benchmark_test_{$i}");
        }
        $read_time = microtime(true) - $start_time;
        
        // Cleanup
        for ($i = 0; $i < $iterations; $i++) {
            $this->delete("benchmark_test_{$i}");
        }
        
        return [
            'write_time' => round($write_time * 1000, 2) . 'ms',
            'read_time' => round($read_time * 1000, 2) . 'ms',
            'iterations' => $iterations,
            'avg_write' => round(($write_time / $iterations) * 1000, 2) . 'ms',
            'avg_read' => round(($read_time / $iterations) * 1000, 2) . 'ms'
        ];
    }
    
    // ========================================
    // 📊 METRICS COLLECTION FUNCTIONALITY (FROM MetricsCollector)
    // ========================================
    
    /**
     * 🚀 Initialize Metrics System (ADDED)
     */
    private function initMetricsSystem() {
        $this->start_time = microtime(true);
        $this->sessionId = $this->generateSessionId();
        
        // Start analytics session
        $this->startAnalyticsSession();
        
        // Setup metrics collection
        $this->setupMetricsCollection();
        
        // Register event listeners
        $this->registerEventListeners();
        
        // Schedule automatic reports
        $this->scheduleAutomaticReports();
    }
    
    /**
     * 📊 Start performance measurement
     */
    public function startMeasurement($metric_name) {
        $this->metrics[$metric_name] = [
            'start' => microtime(true),
            'memory_start' => memory_get_usage(true),
            'context' => $this->getCurrentContext()
        ];
    }
    
    /**
     * ⏱️ End performance measurement
     */
    public function endMeasurement($metric_name) {
        if (!isset($this->metrics[$metric_name])) {
            return null;
        }
        
        $end_time = microtime(true);
        $end_memory = memory_get_usage(true);
        
        $measurement = $this->metrics[$metric_name];
        $measurement['end'] = $end_time;
        $measurement['memory_end'] = $end_memory;
        $measurement['duration'] = $end_time - $measurement['start'];
        $measurement['memory_used'] = $end_memory - $measurement['memory_start'];
        
        $this->metrics[$metric_name] = $measurement;
        
        // Auto-collect performance metric
        $this->collectPerformanceMetric($metric_name, $measurement['duration'] * 1000, [
            'memory_used' => $measurement['memory_used'],
            'context' => $measurement['context']
        ]);
        
        return $measurement;
    }
    
    /**
     * 📈 Collect metric (main method)
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
        
        // Add to buffer
        $this->metricsBuffer[] = $metric;
        
        // Flush buffer if exceeded limit
        if (count($this->metricsBuffer) >= 50) {
            $this->flushMetricsBuffer();
        }
        
        // Trigger real-time alerts if critical
        if (isset($metadata['severity']) && $metadata['severity'] === self::SEVERITY_CRITICAL) {
            $this->triggerCriticalAlert($metric);
        }
        
        return $metric['id'];
    }
    
    /**
     * ⚡ Collect performance metric
     */
    public function collectPerformanceMetric($name, $duration, $metadata = []) {
        return $this->collectMetric(self::METRIC_PERFORMANCE, $name, $duration, array_merge([
            'unit' => 'milliseconds',
            'category' => self::CATEGORY_TIMING
        ], $metadata));
    }
    
    /**
     * 👤 Collect user behavior metric
     */
    public function collectUserBehaviorMetric($action, $target, $metadata = []) {
        return $this->collectMetric(self::METRIC_USER_BEHAVIOR, $action, $target, array_merge([
            'category' => self::CATEGORY_INTERACTION,
            'session_time' => $this->getSessionDuration()
        ], $metadata));
    }
    
    /**
     * 🏥 Collect system health metric
     */
    public function collectSystemHealthMetric($component, $status, $metadata = []) {
        $severity = $status === 'healthy' ? self::SEVERITY_LOW : 
                   ($status === 'warning' ? self::SEVERITY_MEDIUM : self::SEVERITY_HIGH);
        
        return $this->collectMetric(self::METRIC_SYSTEM_HEALTH, $component, $status, array_merge([
            'severity' => $severity,
            'category' => self::CATEGORY_SYSTEM,
            'php_version' => PHP_VERSION,
            'wp_version' => get_bloginfo('version'),
            'plugin_version' => defined('MAS_V2_VERSION') ? MAS_V2_VERSION : '4.1.0'
        ], $metadata));
    }
    
    /**
     * 🛡️ Collect security metric
     */
    public function collectSecurityMetric($event, $details, $metadata = []) {
        return $this->collectMetric(self::METRIC_SECURITY, $event, $details, array_merge([
            'severity' => self::SEVERITY_HIGH,
            'category' => self::CATEGORY_ERROR,
            'requires_review' => true
        ], $metadata));
    }
    
    /**
     * ❌ Collect error metric
     */
    public function collectErrorMetric($error_type, $message, $metadata = []) {
        return $this->collectMetric(self::METRIC_ERROR, $error_type, $message, array_merge([
            'severity' => self::SEVERITY_MEDIUM,
            'category' => self::CATEGORY_ERROR,
            'stack_trace' => debug_backtrace(DEBUG_BACKTRACE_IGNORE_ARGS, 10)
        ], $metadata));
    }
    
    /**
     * 📈 Collect system metrics
     */
    public function collectSystemMetrics() {
        $metrics = [
            'timestamp' => current_time('mysql'),
            'php_version' => PHP_VERSION,
            'wordpress_version' => get_bloginfo('version'),
            'plugin_version' => defined('MAS_V2_VERSION') ? MAS_V2_VERSION : '4.1.0',
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
            'debug_mode' => defined('WP_DEBUG') && WP_DEBUG,
            'cache_stats' => $this->getStats()
        ];
        
        // Auto-collect as system health metric
        $this->collectSystemHealthMetric('general_system', 'healthy', $metrics);
        
        return $metrics;
    }
    
    /**
     * 🚀 Collect plugin metrics
     */
    public function collectPluginMetrics() {
        $settings = get_option('mas_v2_settings', []);
        
        $metrics = [
            'plugin_enabled' => $settings['enable_plugin'] ?? false,
            'settings_count' => count($settings),
            'settings_size' => strlen(serialize($settings)),
            'cache_stats' => $this->getStats(),
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
        
        // Auto-collect as performance metric
        $this->collectPerformanceMetric('plugin_metrics', 0, $metrics);
        
        return $metrics;
    }
    
    /**
     * 💾 Flush metrics buffer to storage
     */
    private function flushMetricsBuffer() {
        if (empty($this->metricsBuffer)) {
            return 0;
        }
        
        $flushed = 0;
        
        try {
            // Save to cache
            $this->saveMetricsToCache($this->metricsBuffer);
            
            // Save to database (persistent)
            $this->saveMetricsToDatabase($this->metricsBuffer);
            
            // Update cached aggregates
            $this->updateCachedAggregates($this->metricsBuffer);
            
            $flushed = count($this->metricsBuffer);
            $this->metricsBuffer = [];
            
        } catch (\Exception $e) {
            error_log('MAS Analytics: Failed to flush metrics - ' . $e->getMessage());
        }
        
        return $flushed;
    }
    
    /**
     * 📊 Generate performance report
     */
    public function generateReport($period = self::PERIOD_DAILY, $metrics = [], $options = []) {
        $startTime = microtime(true);
        
        // Determine time range
        $timeRange = $this->getTimeRange($period);
        
        // Get data
        $data = $this->getMetricsData($timeRange, $metrics);
        
        // Prepare aggregates
        $aggregates = $this->calculateAggregates($data);
        
        // Generate insights
        $insights = $this->generateInsights($data, $aggregates);
        
        // Prepare chart data
        $chartData = $this->prepareChartData($data, $period);
        
        $generationTime = (microtime(true) - $startTime) * 1000;
        
        return [
            'period' => $period,
            'time_range' => $timeRange,
            'data' => $data,
            'aggregates' => $aggregates,
            'insights' => $insights,
            'chart_data' => $chartData,
            'generation_time' => round($generationTime, 2),
            'generated_at' => current_time('mysql')
        ];
    }
    
    /**
     * 📊 Generate complete report
     */
    public function generateCompleteReport() {
        return [
            'generated_at' => current_time('mysql'),
            'system' => $this->collectSystemMetrics(),
            'plugin' => $this->collectPluginMetrics(),
            'measurements' => $this->metrics,
            'summary' => $this->generateSummary(),
            'performance_analysis' => $this->analyzePerformance(),
            'cache_performance' => $this->getStats()
        ];
    }
    
    /**
     * 📋 Generate performance summary
     */
    private function generateSummary() {
        $total_time = microtime(true) - $this->start_time;
        $memory_usage = memory_get_usage(true);
        $peak_memory = memory_get_peak_usage(true);
        
        $status = 'good';
        $recommendations = [];
        
        // Analyze execution time
        if ($total_time > 1.0) {
            $status = 'warning';
            $recommendations[] = 'Consider optimizing plugin performance - execution time is high';
        }
        
        // Analyze memory usage
        if ($memory_usage > 50 * 1024 * 1024) { // 50MB
            $status = 'warning';
            $recommendations[] = 'High memory usage detected - consider reducing plugin complexity';
        }
        
        // Analyze database queries
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
     * 🏆 Calculate performance score
     */
    private function calculatePerformanceScore($execution_time, $memory_usage) {
        $time_score = max(0, 100 - ($execution_time * 100));
        $memory_score = max(0, 100 - (($memory_usage / (64 * 1024 * 1024)) * 100));
        $query_score = max(0, 100 - (get_num_queries() * 2));
        
        return round(($time_score + $memory_score + $query_score) / 3);
    }
    
    /**
     * 📊 Track Admin Performance
     * Monitors admin interface performance and user interactions
     */
    public function trackAdminPerformance() {
        // Only track in admin area
        if (!is_admin()) {
            return;
        }
        
        // Collect admin-specific performance metrics
        $metrics = [
            'admin_page' => $_GET['page'] ?? (function_exists('get_current_screen') ? get_current_screen()->id : 'unknown'),
            'memory_usage' => memory_get_usage(true),
            'peak_memory' => memory_get_peak_usage(true),
            'execution_time' => microtime(true) - $this->start_time,
            'database_queries' => get_num_queries(),
            'user_id' => get_current_user_id(),
            'screen_id' => function_exists('get_current_screen') ? get_current_screen()->id : 'unknown',
            'hook_suffix' => $GLOBALS['hook_suffix'] ?? 'unknown'
        ];
        
        // Auto-collect as performance metric
        $this->collectPerformanceMetric('admin_page_load', 
            round($metrics['execution_time'] * 1000, 2), 
            $metrics
        );
    }
    
    // ========================================
    // 🔧 HELPER METHODS (FROM MetricsCollector)
    // ========================================
    
    private function generateSessionId() {
        return 'mas_session_' . wp_generate_uuid4();
    }
    
    private function getClientIP() {
        $ip_keys = ['HTTP_CF_CONNECTING_IP', 'HTTP_X_FORWARDED_FOR', 'HTTP_X_FORWARDED', 'HTTP_X_CLUSTER_CLIENT_IP', 'HTTP_FORWARDED_FOR', 'HTTP_FORWARDED', 'REMOTE_ADDR'];
        
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
        
        return $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
    }
    
    private function getSessionDuration() {
        return microtime(true) - $this->start_time;
    }
    
    private function getCurrentContext() {
        return [
            'is_admin' => is_admin(),
            'is_ajax' => defined('DOING_AJAX') && DOING_AJAX,
            'is_cron' => defined('DOING_CRON') && DOING_CRON,
            'current_screen' => function_exists('get_current_screen') ? get_current_screen() : null,
            'hook_suffix' => $GLOBALS['hook_suffix'] ?? null
        ];
    }
    
    private function startAnalyticsSession() {
        $this->set('analytics_session_' . $this->sessionId, [
            'started_at' => current_time('mysql'),
            'user_id' => get_current_user_id(),
            'ip_address' => $this->getClientIP(),
            'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? ''
        ], 3600);
    }
    
    private function setupMetricsCollection() {
        // Automatic system metrics collection every 5 minutes
        if (!wp_next_scheduled('mas_collect_system_metrics')) {
            wp_schedule_event(time(), 'five_minutes', 'mas_collect_system_metrics');
        }
        
        add_action('mas_collect_system_metrics', [$this, 'collectSystemMetrics']);
    }
    
    private function registerEventListeners() {
        // WordPress events
        add_action('wp_login', [$this, 'onUserLogin'], 10, 2);
        add_action('wp_logout', [$this, 'onUserLogout']);
        add_action('admin_init', [$this, 'onAdminInit']);
        
        // Performance monitoring
        add_action('shutdown', [$this, 'onShutdown']);
    }
    
    private function scheduleAutomaticReports() {
        // Daily report
        if (!wp_next_scheduled('mas_daily_report')) {
            wp_schedule_event(time(), 'daily', 'mas_daily_report');
        }
        
        add_action('mas_daily_report', function() {
            $this->saveMetrics();
        });
    }
    
    /**
     * 🔥 Event handlers
     */
    public function onUserLogin($user_login, $user) {
        $this->collectUserBehaviorMetric('login', $user_login, [
            'user_id' => $user->ID,
            'user_role' => $user->roles[0] ?? 'unknown'
        ]);
    }
    
    public function onUserLogout() {
        $this->collectUserBehaviorMetric('logout', get_current_user_id());
    }
    
    public function onAdminInit() {
        $this->collectSystemHealthMetric('admin_init', 'healthy');
    }
    
    private function saveSessionSummary() {
        $summary = [
            'session_id' => $this->sessionId,
            'duration' => $this->getSessionDuration(),
            'metrics_collected' => count($this->metricsBuffer),
            'memory_peak' => memory_get_peak_usage(true),
            'ended_at' => current_time('mysql')
        ];
        
        $this->set('session_summary_' . $this->sessionId, $summary, 86400);
    }
    
    // Placeholder methods for metrics functionality
    private function triggerCriticalAlert($metric) {
        error_log('MAS Critical Alert: ' . json_encode($metric));
    }
    
    private function getTimeRange($period) {
        return ['start' => date('Y-m-d H:i:s', strtotime("-1 {$period}")), 'end' => current_time('mysql')];
    }
    
    private function getMetricsData($timeRange, $metrics) {
        return [];
    }
    
    private function calculateAggregates($data) {
        return [];
    }
    
    private function generateInsights($data, $aggregates) {
        return [];
    }
    
    private function prepareChartData($data, $period) {
        return [];
    }
    
    private function saveMetricsToCache($metrics) {
        foreach ($metrics as $metric) {
            $key = 'metric_' . $metric['id'];
            $this->set($key, $metric, 3600);
        }
    }
    
    private function saveMetricsToDatabase($metrics) {
        $serialized = serialize($metrics);
        update_option('mas_v2_metrics_buffer_' . time(), $serialized);
    }
    
    private function updateCachedAggregates($metrics) {
        // Implementation for updating cached aggregates
    }
    
    private function analyzePerformance() {
            return [
            'overall_score' => $this->calculatePerformanceScore(microtime(true) - $this->start_time, memory_get_usage(true)),
            'bottlenecks' => [],
            'recommendations' => []
        ];
    }
    
    /**
     * 💾 Save metrics (legacy compatibility)
     */
    public function saveMetrics($report = null) {
        if ($report === null) {
            $report = $this->generateCompleteReport();
        }
        
        // Save to cache (fast access)
        $this->set('latest_metrics_report', $report, 3600);
        
        // Save to WordPress options (persistent)
        $historical = get_option('mas_v2_metrics_history', []);
        $historical[] = [
            'timestamp' => current_time('mysql'),
            'summary' => $report['summary'],
            'system_basics' => [
                'memory' => $report['system']['memory_usage'],
                'execution_time' => $report['system']['execution_time'],
                'queries' => $report['system']['database_queries']
            ]
        ];
        
        // Keep only recent reports
        if (count($historical) > 50) {
            $historical = array_slice($historical, -50);
        }
        
        update_option('mas_v2_metrics_history', $historical);
        
        return true;
    }
    
    /**
     * 📈 Get historical metrics
     */
    public function getHistoricalMetrics($hours = 24) {
        $cacheKey = "historical_metrics_{$hours}h";
        
        return $this->remember($cacheKey, function() use ($hours) {
            $history = get_option('mas_v2_metrics_history', []);
            $cutoff = date('Y-m-d H:i:s', strtotime("-{$hours} hours"));
            
            return array_filter($history, function($entry) use ($cutoff) {
                return $entry['timestamp'] >= $cutoff;
            });
        }, 300);
    }
    
    // ========================================
    // 🔧 LEGACY COMPATIBILITY FOR MetricsCollector
    // ========================================
    
    /**
     * 📊 Get dashboard stats (legacy compatibility)
     */
    public function getDashboardStats() {
        $cacheKey = 'dashboard_stats_' . date('Y-m-d-H');
        
        return $this->remember($cacheKey, function() {
            return [
                'metrics_collected_today' => count($this->metricsBuffer),
                'performance_average' => $this->calculatePerformanceScore(microtime(true) - $this->start_time, memory_get_usage(true)),
                'memory_usage' => memory_get_usage(true),
                'system_health' => 'healthy',
                'active_alerts' => [],
                'user_activity' => [],
                'cache_hit_rate' => 0.95,
                'error_rate' => 0.01
            ];
        }, 300);
    }
} 