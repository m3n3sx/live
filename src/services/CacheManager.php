<?php
/**
 * Cache Manager Service
 * 
 * Zaawansowane zarządzanie cache'em z różnymi strategiami
 * 
 * @package ModernAdminStyler
 * @version 2.0
 */

namespace ModernAdminStyler\Services;

class CacheManager {
    
    private $settings_manager;
    private $cache_prefix = 'mas_v2_';
    private $default_expiration = 3600; // 1 godzina
    
    public function __construct($settings_manager) {
        $this->settings_manager = $settings_manager;
    }
    
    /**
     * 📥 Pobiera wartość z cache
     */
    public function get($key, $default = null) {
        $cache_key = $this->getCacheKey($key);
        
        // WordPress Object Cache
        $value = wp_cache_get($cache_key, 'mas_v2');
        
        if ($value === false) {
            // Fallback do transients
            $value = get_transient($cache_key);
            
            if ($value === false) {
                return $default;
            }
            
            // Przywróć do object cache
            wp_cache_set($cache_key, $value, 'mas_v2', $this->default_expiration);
        }
        
        return $value;
    }
    
    /**
     * 💾 Zapisuje wartość do cache
     */
    public function set($key, $value, $expiration = null) {
        $cache_key = $this->getCacheKey($key);
        $expiration = $expiration ?: $this->default_expiration;
        
        // WordPress Object Cache
        wp_cache_set($cache_key, $value, 'mas_v2', $expiration);
        
        // Persistent cache (transients)
        set_transient($cache_key, $value, $expiration);
        
        return true;
    }
    
    /**
     * 🗑️ Usuwa wartość z cache
     */
    public function delete($key) {
        $cache_key = $this->getCacheKey($key);
        
        wp_cache_delete($cache_key, 'mas_v2');
        delete_transient($cache_key);
        
        return true;
    }
    
    /**
     * 🧹 Czyści cały cache wtyczki
     */
    public function flush() {
        global $wpdb;
        
        // Usuń wszystkie transients MAS V2
        $wpdb->query($wpdb->prepare(
            "DELETE FROM {$wpdb->options} WHERE option_name LIKE %s",
            '_transient_' . $this->cache_prefix . '%'
        ));
        
        $wpdb->query($wpdb->prepare(
            "DELETE FROM {$wpdb->options} WHERE option_name LIKE %s",
            '_transient_timeout_' . $this->cache_prefix . '%'
        ));
        
        // Flush object cache group
        wp_cache_flush_group('mas_v2');
        
        return true;
    }
    
    /**
     * 🔄 Cache z callback (get-or-set pattern)
     */
    public function remember($key, $callback, $expiration = null) {
        $value = $this->get($key);
        
        if ($value === null) {
            $value = call_user_func($callback);
            $this->set($key, $value, $expiration);
        }
        
        return $value;
    }
    
    /**
     * 📊 Statystyki cache
     */
    public function getStats() {
        global $wpdb;
        
        $transient_count = $wpdb->get_var($wpdb->prepare(
            "SELECT COUNT(*) FROM {$wpdb->options} WHERE option_name LIKE %s",
            '_transient_' . $this->cache_prefix . '%'
        ));
        
        $total_size = $wpdb->get_var($wpdb->prepare(
            "SELECT SUM(LENGTH(option_value)) FROM {$wpdb->options} WHERE option_name LIKE %s",
            '_transient_' . $this->cache_prefix . '%'
        ));
        
        return [
            'transient_count' => (int) $transient_count,
            'total_size_bytes' => (int) $total_size,
            'total_size_human' => size_format($total_size),
            'cache_prefix' => $this->cache_prefix,
            'default_expiration' => $this->default_expiration
        ];
    }
    
    /**
     * 🔧 Generuje klucz cache
     */
    private function getCacheKey($key) {
        return $this->cache_prefix . md5($key . MAS_V2_VERSION);
    }
    
    /**
     * 🧪 Testuje wydajność cache
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
    
    /**
     * 🔍 Debuguje cache
     */
    public function debug($key = null) {
        if ($key) {
            $cache_key = $this->getCacheKey($key);
            return [
                'original_key' => $key,
                'cache_key' => $cache_key,
                'object_cache' => wp_cache_get($cache_key, 'mas_v2'),
                'transient' => get_transient($cache_key),
                'exists' => $this->get($key) !== null
            ];
        }
        
        return $this->getStats();
    }
} 