<?php
/**
 * Cache Manager - Unified Caching & Memory Optimization System
 * 
 * KONSOLIDACJA 2024: AdvancedCacheManager + CacheManager + MemoryOptimizer
 * Wielopoziomowy cache z automatyczną optymalizacją pamięci
 * 
 * @package ModernAdminStyler
 * @version 4.0.0 - Konsolidacja
 */

namespace ModernAdminStyler\Services;

class CacheManager {
    
    private $coreEngine;
    private $cacheStats = [];
    private $memoryUsageHistory = [];
    private $optimizationRules = [];
    private $memoryLimit;
    
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
        
        $this->initCacheConfig();
        $this->setupOptimizationRules();
        $this->startMemoryMonitoring();
        $this->registerCacheHooks();
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
} 