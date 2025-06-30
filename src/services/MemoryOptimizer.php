<?php
/**
 * Memory Optimizer - Memory Management & Resource Optimization
 * 
 * FAZA 6: Optymalizacja pamięci i zarządzanie zasobami
 * 
 * @package ModernAdminStyler
 * @version 3.3.0
 */

namespace ModernAdminStyler\Services;

class MemoryOptimizer {
    
    private $serviceFactory;
    private $memoryLimit;
    private $memoryUsageHistory = [];
    private $optimizationRules = [];
    
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
    
    public function __construct($serviceFactory) {
        $this->serviceFactory = $serviceFactory;
        $this->memoryLimit = $this->parseMemoryLimit(ini_get('memory_limit'));
        
        $this->initOptimizer();
    }
    
    /**
     * 🚀 Inicjalizacja optymalizatora pamięci
     */
    private function initOptimizer() {
        // Monitoruj użycie pamięci
        $this->startMemoryMonitoring();
        
        // Konfiguruj reguły optymalizacji
        $this->setupOptimizationRules();
        
        // Rejestruj shutdown handler
        register_shutdown_function([$this, 'onShutdown']);
        
        // Hook do WordPress
        add_action('init', [$this, 'optimizeOnInit'], 1);
        add_action('wp_loaded', [$this, 'optimizeAfterLoad']);
    }
    
    /**
     * 📊 Rozpocznij monitoring pamięci
     */
    private function startMemoryMonitoring() {
        // Zapisz początkowe użycie pamięci
        $this->recordMemoryUsage('startup');
        
        // Monitoruj co 10 sekund (w AJAX/długich operacjach)
        if (defined('DOING_AJAX') && DOING_AJAX) {
            add_action('wp_ajax_*', [$this, 'checkMemoryUsage'], 1);
        }
    }
    
    /**
     * ⚙️ Konfiguruj reguły optymalizacji
     */
    private function setupOptimizationRules() {
        $this->optimizationRules = [
            self::OPTIMIZATION_LIGHT => [
                'disable_analytics_buffer' => true,
                'reduce_cache_size' => 0.8,
                'disable_non_critical_hooks' => false
            ],
            
            self::OPTIMIZATION_MODERATE => [
                'disable_analytics_buffer' => true,
                'reduce_cache_size' => 0.6,
                'disable_non_critical_hooks' => true,
                'flush_object_cache' => true,
                'disable_integrations' => false
            ],
            
            self::OPTIMIZATION_AGGRESSIVE => [
                'disable_analytics_buffer' => true,
                'reduce_cache_size' => 0.4,
                'disable_non_critical_hooks' => true,
                'flush_object_cache' => true,
                'disable_integrations' => true,
                'disable_css_generation' => false
            ],
            
            self::OPTIMIZATION_EMERGENCY => [
                'disable_analytics_buffer' => true,
                'reduce_cache_size' => 0.2,
                'disable_non_critical_hooks' => true,
                'flush_object_cache' => true,
                'disable_integrations' => true,
                'disable_css_generation' => true,
                'emergency_cleanup' => true
            ]
        ];
    }
    
    /**
     * 🔍 Sprawdź użycie pamięci
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
        
        foreach ($rules as $rule => $enabled) {
            if (!$enabled) continue;
            
            switch ($rule) {
                case 'disable_analytics_buffer':
                    $this->disableAnalyticsBuffer();
                    break;
                    
                case 'reduce_cache_size':
                    $this->reduceCacheSize($enabled);
                    break;
                    
                case 'disable_non_critical_hooks':
                    $this->disableNonCriticalHooks();
                    break;
                    
                case 'flush_object_cache':
                    $this->flushObjectCache();
                    break;
                    
                case 'disable_integrations':
                    $this->disableIntegrations();
                    break;
                    
                case 'disable_css_generation':
                    $this->disableCSSGeneration();
                    break;
                    
                case 'emergency_cleanup':
                    $this->performEmergencyCleanup();
                    break;
            }
        }
        
        // Log optymalizacji
        error_log("MAS Memory Optimizer: Applied level {$level} optimization in context '{$context}'");
        
        // Wyślij alert jeśli krytyczny poziom
        if ($level >= self::OPTIMIZATION_AGGRESSIVE) {
            $this->sendMemoryAlert($level, $context);
        }
    }
    
    /**
     * 📊 Wyłącz bufor analytics
     */
    private function disableAnalyticsBuffer() {
        if (isset($this->serviceFactory->services['analytics_engine'])) {
            $analytics = $this->serviceFactory->getAnalyticsEngine();
            if (method_exists($analytics, 'flushMetricsBuffer')) {
                $analytics->flushMetricsBuffer();
            }
        }
    }
    
    /**
     * 💾 Zmniejsz rozmiar cache
     */
    private function reduceCacheSize($factor) {
        if (isset($this->serviceFactory->services['advanced_cache_manager'])) {
            $cache = $this->serviceFactory->getAdvancedCacheManager();
            if (method_exists($cache, 'reduceCacheSize')) {
                $cache->reduceCacheSize($factor);
            }
        }
    }
    
    /**
     * 🔗 Wyłącz niekrytyczne hooks
     */
    private function disableNonCriticalHooks() {
        // Wyłącz hooks analytics
        remove_action('wp_login', [
            $this->serviceFactory->getAnalyticsEngine(), 'onUserLogin'
        ]);
        remove_action('wp_logout', [
            $this->serviceFactory->getAnalyticsEngine(), 'onUserLogout'
        ]);
        remove_action('admin_init', [
            $this->serviceFactory->getAnalyticsEngine(), 'onAdminInit'
        ]);
    }
    
    /**
     * 🗑️ Flush object cache
     */
    private function flushObjectCache() {
        if (function_exists('wp_cache_flush')) {
            wp_cache_flush();
        }
        
        // Flush transients
        global $wpdb;
        $wpdb->query("DELETE FROM {$wpdb->options} WHERE option_name LIKE '_transient_%'");
    }
    
    /**
     * 🔌 Wyłącz integracje
     */
    private function disableIntegrations() {
        // Placeholder - wyłącz niekrytyczne integracje
        if (isset($this->serviceFactory->services['integration_manager'])) {
            // Można dodać metodę do tymczasowego wyłączenia integracji
        }
    }
    
    /**
     * 🎨 Wyłącz generowanie CSS
     */
    private function disableCSSGeneration() {
        // Wyłącz CSS Variables Generator
        remove_action('wp_head', [
            $this->serviceFactory->getCSSVariablesGenerator(), 'outputCSSVariables'
        ]);
    }
    
    /**
     * 🚨 Wykonaj awaryjne czyszczenie
     */
    private function performEmergencyCleanup() {
        // Wyczyść wszystkie bufory
        if (ob_get_level()) {
            ob_clean();
        }
        
        // Wymuś garbage collection
        if (function_exists('gc_collect_cycles')) {
            gc_collect_cycles();
        }
        
        // Wyczyść zmienne globalne
        $this->clearGlobalVariables();
        
        // Flush wszystkie cache
        $this->flushAllCaches();
    }
    
    /**
     * 🗑️ Wyczyść zmienne globalne
     */
    private function clearGlobalVariables() {
        // Wyczyść duże zmienne globalne WordPress
        global $wp_object_cache, $wp_query, $wp_rewrite;
        
        if (isset($wp_object_cache) && method_exists($wp_object_cache, 'flush')) {
            $wp_object_cache->flush();
        }
    }
    
    /**
     * 💾 Flush wszystkie cache
     */
    private function flushAllCaches() {
        // WordPress cache
        if (function_exists('wp_cache_flush')) {
            wp_cache_flush();
        }
        
        // Nasze cache
        if (isset($this->serviceFactory->services['cache_manager'])) {
            $cache = $this->serviceFactory->get('cache_manager');
            if (method_exists($cache, 'clearAll')) {
                $cache->clearAll();
            }
        }
        
        if (isset($this->serviceFactory->services['advanced_cache_manager'])) {
            $cache = $this->serviceFactory->getAdvancedCacheManager();
            if (method_exists($cache, 'clearAll')) {
                $cache->clearAll();
            }
        }
    }
    
    /**
     * 📧 Wyślij alert o pamięci
     */
    private function sendMemoryAlert($level, $context) {
        $usage = memory_get_usage(true);
        $percentage = ($usage / $this->memoryLimit) * 100;
        
        $level_names = [
            self::OPTIMIZATION_AGGRESSIVE => 'AGGRESSIVE',
            self::OPTIMIZATION_EMERGENCY => 'EMERGENCY'
        ];
        
        $message = "Memory usage alert on " . get_site_url() . "\n\n";
        $message .= "Level: " . ($level_names[$level] ?? $level) . "\n";
        $message .= "Context: {$context}\n";
        $message .= "Usage: " . $this->formatBytes($usage) . " ({$percentage}%)\n";
        $message .= "Limit: " . $this->formatBytes($this->memoryLimit) . "\n";
        $message .= "Time: " . current_time('mysql') . "\n\n";
        $message .= "Automatic optimization has been applied.";
        
        wp_mail(
            get_option('admin_email'),
            '[' . get_bloginfo('name') . '] Memory Usage Alert',
            $message
        );
    }
    
    /**
     * 🔧 Metody pomocnicze
     */
    private function parseMemoryLimit($limit) {
        $limit = trim($limit);
        $last = strtolower($limit[strlen($limit)-1]);
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
    
    private function formatBytes($bytes) {
        $units = ['B', 'KB', 'MB', 'GB'];
        $factor = floor((strlen($bytes) - 1) / 3);
        return sprintf("%.2f %s", $bytes / pow(1024, $factor), $units[$factor]);
    }
    
    /**
     * 📊 Hooks WordPress
     */
    public function optimizeOnInit() {
        $this->checkMemoryUsage('init');
    }
    
    public function optimizeAfterLoad() {
        $this->checkMemoryUsage('wp_loaded');
    }
    
    public function onShutdown() {
        $this->checkMemoryUsage('shutdown');
        
        // Zapisz statystyki do cache
        if (count($this->memoryUsageHistory) > 0) {
            set_transient('mas_v2_memory_stats', [
                'history' => $this->memoryUsageHistory,
                'peak_usage' => max(array_column($this->memoryUsageHistory, 'usage')),
                'avg_usage' => array_sum(array_column($this->memoryUsageHistory, 'usage')) / count($this->memoryUsageHistory),
                'last_check' => time()
            ], HOUR_IN_SECONDS);
        }
    }
    
    /**
     * 📊 API publiczne
     */
    
    /**
     * Pobierz statystyki pamięci
     */
    public function getMemoryStats() {
        return [
            'current_usage' => memory_get_usage(true),
            'peak_usage' => memory_get_peak_usage(true),
            'limit' => $this->memoryLimit,
            'percentage' => (memory_get_usage(true) / $this->memoryLimit) * 100,
            'history' => $this->memoryUsageHistory,
            'optimization_level' => $this->determineOptimizationLevel(memory_get_usage(true) / $this->memoryLimit)
        ];
    }
    
    /**
     * Wymuś optymalizację
     */
    public function forceOptimization($level = null) {
        if ($level === null) {
            $usage_percentage = memory_get_usage(true) / $this->memoryLimit;
            $level = $this->determineOptimizationLevel($usage_percentage);
        }
        
        $this->applyOptimization($level, 'forced');
        
        return $this->getMemoryStats();
    }
    
    /**
     * Sprawdź czy pamięć jest w krytycznym stanie
     */
    public function isMemoryCritical() {
        $usage_percentage = memory_get_usage(true) / $this->memoryLimit;
        return $usage_percentage >= self::MEMORY_CRITICAL_THRESHOLD;
    }
    
    /**
     * Pobierz rekomendacje optymalizacji
     */
    public function getOptimizationRecommendations() {
        $stats = $this->getMemoryStats();
        $recommendations = [];
        
        if ($stats['percentage'] > 80) {
            $recommendations[] = [
                'type' => 'warning',
                'message' => 'Memory usage is high. Consider increasing PHP memory_limit.',
                'action' => 'increase_memory_limit'
            ];
        }
        
        if (count($this->memoryUsageHistory) > 10) {
            $recent_usage = array_slice($this->memoryUsageHistory, -10);
            $avg_recent = array_sum(array_column($recent_usage, 'percentage')) / count($recent_usage);
            
            if ($avg_recent > 0.7) {
                $recommendations[] = [
                    'type' => 'info',
                    'message' => 'Consistently high memory usage detected. Enable automatic optimization.',
                    'action' => 'enable_auto_optimization'
                ];
            }
        }
        
        return $recommendations;
    }
} 