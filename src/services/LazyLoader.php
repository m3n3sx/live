<?php
/**
 * Lazy Loader Service - Intelligent Asset Loading
 * 
 * FAZA 5: Advanced Performance & UX
 * Inteligentne ładowanie zasobów z priorytetami i warunkami
 * 
 * @package ModernAdminStyler
 * @version 3.2.0
 */

namespace ModernAdminStyler\Services;

class LazyLoader {
    
    private $serviceFactory;
    private $loadedAssets = [];
    private $deferredAssets = [];
    private $criticalAssets = [];
    
    // 🎯 Priorytety ładowania
    const PRIORITY_CRITICAL = 1;    // Krytyczne - ładuj natychmiast
    const PRIORITY_HIGH = 2;        // Wysokie - ładuj po critical
    const PRIORITY_NORMAL = 3;      // Normalne - ładuj po interakcji
    const PRIORITY_LOW = 4;         // Niskie - ładuj w tle
    const PRIORITY_ON_DEMAND = 5;   // Na żądanie - ładuj tylko gdy potrzebne
    
    // 📱 Konteksty ładowania
    const CONTEXT_DESKTOP = 'desktop';
    const CONTEXT_MOBILE = 'mobile';
    const CONTEXT_SETTINGS_PAGE = 'settings';
    const CONTEXT_GENERAL_ADMIN = 'admin';
    const CONTEXT_FRONTEND = 'frontend';
    
    public function __construct($serviceFactory) {
        $this->serviceFactory = $serviceFactory;
        $this->initAssetRegistry();
    }
    
    /**
     * 📋 Inicjalizacja rejestru zasobów z priorytetami
     */
    private function initAssetRegistry() {
        // 🚨 CRITICAL - Ładuj natychmiast
        $this->criticalAssets = [
            'mas-core-css' => [
                'type' => 'style',
                'src' => 'assets/css/mas-v2-main.css',
                'priority' => self::PRIORITY_CRITICAL,
                'contexts' => [self::CONTEXT_DESKTOP, self::CONTEXT_MOBILE],
                'conditions' => ['enable_plugin' => true],
                'size' => 15000
            ]
        ];
        
        // ⚡ HIGH PRIORITY - Ładuj po critical
        $this->registerAsset('mas-live-preview-js', [
            'type' => 'script',
            'src' => 'assets/js/admin-modern-v3.js',
            'priority' => self::PRIORITY_HIGH,
            'contexts' => [self::CONTEXT_SETTINGS_PAGE],
            'dependencies' => ['jquery'],
            'size' => 25000
        ]);
        
        // 📱 NORMAL PRIORITY - Ładuj po interakcji
        $this->registerAsset('mas-animations-css', [
            'type' => 'style',
            'src' => 'assets/css/mas-animations.css',
            'priority' => self::PRIORITY_NORMAL,
            'contexts' => [self::CONTEXT_DESKTOP],
            'conditions' => ['enable_animations' => true],
            'size' => 12000
        ]);
    }
    
    /**
     * 📝 Rejestracja nowego zasobu
     */
    public function registerAsset($handle, $config) {
        $this->deferredAssets[$handle] = array_merge([
            'loaded' => false,
            'loading' => false,
            'error' => false,
            'load_time' => null,
            'contexts' => [self::CONTEXT_GENERAL_ADMIN],
            'conditions' => [],
            'dependencies' => [],
            'inline' => false
        ], $config);
    }
    
    /**
     * 🚀 Główna funkcja ładowania zasobów
     */
    public function loadAssets($context = self::CONTEXT_GENERAL_ADMIN) {
        $startTime = microtime(true);
        
        // 1. Załaduj critical assets natychmiast
        $this->loadCriticalAssets($context);
        
        // 2. Załaduj high priority assets
        $this->loadAssetsByPriority(self::PRIORITY_HIGH, $context);
        
        $loadTime = microtime(true) - $startTime;
        
        return [
            'success' => true,
            'load_time' => $loadTime,
            'context' => $context
        ];
    }
    
    /**
     * 🚨 Ładowanie critical assets
     */
    private function loadCriticalAssets($context) {
        foreach ($this->criticalAssets as $handle => $asset) {
            if ($this->shouldLoadAsset($asset, $context)) {
                $this->loadSingleAsset($handle, $asset);
            }
        }
    }
    
    /**
     * ⚡ Ładowanie zasobów według priorytetu
     */
    private function loadAssetsByPriority($priority, $context) {
        foreach ($this->deferredAssets as $handle => $asset) {
            if ($asset['priority'] === $priority && $this->shouldLoadAsset($asset, $context)) {
                $this->loadSingleAsset($handle, $asset);
            }
        }
    }
    
    /**
     * 🎯 Ładowanie pojedynczego zasobu
     */
    private function loadSingleAsset($handle, $asset) {
        $startTime = microtime(true);
        
        try {
            if ($asset['type'] === 'style') {
                wp_enqueue_style(
                    "mas-{$handle}",
                    MAS_V2_PLUGIN_URL . $asset['src'],
                    $asset['dependencies'] ?? [],
                    MAS_V2_VERSION
                );
            } elseif ($asset['type'] === 'script') {
                wp_enqueue_script(
                    "mas-{$handle}",
                    MAS_V2_PLUGIN_URL . $asset['src'],
                    $asset['dependencies'] ?? [],
                    MAS_V2_VERSION,
                    true
                );
            }
            
            $loadTime = microtime(true) - $startTime;
            
            $this->loadedAssets[$handle] = [
                'load_time' => $loadTime,
                'size' => $asset['size'] ?? 0,
                'timestamp' => current_time('mysql')
            ];
            
        } catch (\Exception $e) {
            error_log("MAS LazyLoader: Failed to load {$handle} - " . $e->getMessage());
        }
    }
    
    /**
     * 🔍 Sprawdź czy zasób powinien być załadowany
     */
    private function shouldLoadAsset($asset, $context) {
        // Sprawdź kontekst
        if (!in_array($context, $asset['contexts'])) {
            return false;
        }
        
        // Sprawdź warunki
        if (!empty($asset['conditions'])) {
            $settings = $this->serviceFactory->getSettingsManager()->getSettings();
            
            foreach ($asset['conditions'] as $condition => $expectedValue) {
                if (($settings[$condition] ?? false) !== $expectedValue) {
                    return false;
                }
            }
        }
        
        return true;
    }
    
    /**
     * 📊 Pobierz statystyki performance
     */
    public function getPerformanceStats() {
        return [
            'loaded_assets' => count($this->loadedAssets),
            'total_size' => array_sum(array_column($this->loadedAssets, 'size')),
            'average_load_time' => $this->calculateAverageLoadTime()
        ];
    }
    
    /**
     * 📈 Oblicz średni czas ładowania
     */
    private function calculateAverageLoadTime() {
        if (empty($this->loadedAssets)) {
            return 0;
        }
        
        $totalTime = array_sum(array_column($this->loadedAssets, 'load_time'));
        return $totalTime / count($this->loadedAssets);
    }
} 