<?php
/**
 * Advanced Cache Manager - Intelligent Multi-Level Caching
 * 
 * FAZA 5: Advanced Performance & UX
 * Wielopoziomowy cache z automatycznym odświeżaniem i inteligentną invalidacją
 * 
 * @package ModernAdminStyler
 * @version 3.2.0
 */

namespace ModernAdminStyler\Services;

class AdvancedCacheManager {
    
    private $serviceFactory;
    private $cacheStats = [];
    
    // 🎯 Poziomy cache
    const LEVEL_MEMORY = 'memory';      // W pamięci (najszybszy)
    const LEVEL_TRANSIENT = 'transient'; // WordPress transients
    const LEVEL_OPTION = 'option';      // WordPress options (persistent)
    
    // ⏰ Czasy życia cache
    const TTL_SHORT = 300;              // 5 minut
    const TTL_MEDIUM = 1800;            // 30 minut
    const TTL_LONG = 3600;              // 1 godzina
    
    // 🏷️ Grupy cache
    const GROUP_SETTINGS = 'settings';
    const GROUP_CSS = 'css';
    const GROUP_PERFORMANCE = 'performance';
    
    private $memoryCache = [];
    private $cacheConfig = [];
    
    public function __construct($serviceFactory) {
        $this->serviceFactory = $serviceFactory;
        $this->initCacheConfig();
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
            'performance_stats' => [
                'group' => self::GROUP_PERFORMANCE,
                'level' => self::LEVEL_TRANSIENT,
                'ttl' => self::TTL_SHORT
            ]
        ];
    }
    
    /**
     * 💾 Zapisz do cache
     */
    public function set($key, $value, $ttl = null, $level = null) {
        $config = $this->cacheConfig[$key] ?? $this->getDefaultConfig();
        
        if ($ttl !== null) $config['ttl'] = $ttl;
        if ($level !== null) $config['level'] = $level;
        
        try {
            switch ($config['level']) {
                case self::LEVEL_MEMORY:
                    return $this->setMemoryCache($key, $value, $config['ttl']);
                    
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
                    
                case self::LEVEL_TRANSIENT:
                    $value = $this->getTransientCache($key);
                    break;
                    
                case self::LEVEL_OPTION:
                    $value = $this->getOptionCache($key);
                    break;
                    
                default:
                    $value = null;
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
            unset($this->memoryCache[$key]);
            delete_transient("mas_v2_cache_{$key}");
            delete_option("mas_v2_cache_{$key}");
            return true;
        } catch (\Exception $e) {
            error_log("MAS Cache: Failed to delete {$key} - " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * 💾 Memory cache operations
     */
    private function setMemoryCache($key, $value, $ttl) {
        $this->memoryCache[$key] = [
            'value' => $value,
            'expires' => time() + $ttl
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
     * ⏰ Transient cache operations
     */
    private function setTransientCache($key, $value, $ttl) {
        return set_transient("mas_v2_cache_{$key}", $value, $ttl);
    }
    
    private function getTransientCache($key) {
        return get_transient("mas_v2_cache_{$key}");
    }
    
    /**
     * 🔒 Option cache operations
     */
    private function setOptionCache($key, $value) {
        return update_option("mas_v2_cache_{$key}", $value);
    }
    
    private function getOptionCache($key) {
        return get_option("mas_v2_cache_{$key}");
    }
    
    /**
     * ⚙️ Domyślna konfiguracja cache
     */
    private function getDefaultConfig() {
        return [
            'group' => 'default',
            'level' => self::LEVEL_TRANSIENT,
            'ttl' => self::TTL_MEDIUM
        ];
    }
    
    /**
     * 📈 Pobierz statystyki cache
     */
    public function getStats() {
        return [
            'memory_cache_size' => count($this->memoryCache),
            'total_operations' => count($this->cacheStats)
        ];
    }
    
    /**
     * 🧹 Wyczyść wszystkie cache
     */
    public function clearAllCache() {
        $this->memoryCache = [];
        
        global $wpdb;
        $wpdb->query("DELETE FROM {$wpdb->options} WHERE option_name LIKE '_transient_mas_v2_cache_%'");
        $wpdb->query("DELETE FROM {$wpdb->options} WHERE option_name LIKE 'mas_v2_cache_%'");
        
        return true;
    }
} 