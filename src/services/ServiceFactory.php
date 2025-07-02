<?php
/**
 * Service Factory
 * 
 * Implementuje Factory Pattern + Dependency Injection
 * Centralne zarządzanie wszystkimi serwisami wtyczki
 * 
 * @package ModernAdminStyler
 * @version 2.0
 */

namespace ModernAdminStyler\Services;

class ServiceFactory {
    
    private static $instance = null;
    private $services = [];
    private $config = [];
    
    /**
     * 🏭 Singleton Pattern
     */
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    private function __construct() {
        $this->config = [
            'plugin_url' => MAS_V2_PLUGIN_URL,
            'plugin_version' => MAS_V2_VERSION,
            'plugin_dir' => MAS_V2_PLUGIN_DIR
        ];
    }
    
    /**
     * 🔧 Tworzy lub zwraca instancję serwisu
     */
    public function get($service_name) {
        if (!isset($this->services[$service_name])) {
            $this->services[$service_name] = $this->create($service_name);
        }
        
        return $this->services[$service_name];
    }
    
    /**
     * 🏗️ Factory Method - tworzy serwisy z dependency injection
     */
    private function create($service_name) {
        switch ($service_name) {
            case 'settings_manager':
                return new SettingsManager();
                
            case 'asset_loader':
                // Enterprise AssetLoader with CSS optimization dependencies
                return new AssetLoader(
                    $this->config['plugin_url'],
                    $this->config['plugin_version'],
                    $this->get('settings_manager'),
                    $this->get('css_generator')
                );
                
            case 'ajax_handler':
                return new AjaxHandler(
                    $this->get('settings_manager') // Dependency Injection
                );
                
            case 'cache_manager':
                return new CacheManager(
                    $this->get('settings_manager')
                );
                
            case 'css_generator':
                // Optimized CSSGenerator - only generates CSS variables now
                return new CSSGenerator(
                    $this->get('settings_manager')
                );
                
            case 'security_service':
                return new SecurityService();
                
            case 'metrics_collector':
                return new MetricsCollector(
                    $this->get('cache_manager')
                );
                
            // ❌ DEPRECATED: CustomizerIntegration removed in Phase 6
            // All visual editing unified into Live Edit Mode
            case 'customizer_integration':
                error_log("MAS: CustomizerIntegration deprecated - use Live Edit Mode instead");
                return null;
                
            case 'settings_api':
                return new SettingsAPI(
                    $this->get('settings_manager')
                );
                
            case 'rest_api':
                return new RestAPI(
                    $this->get('cache_manager'),
                    $this->get('security_service'),
                    $this->get('metrics_collector'),
                    $this->get('preset_manager')
                );
                
            // 🎨 NOWY SERWIS FAZY 2: Component Adapter
            case 'component_adapter':
                return new ComponentAdapter(
                    $this->get('settings_manager')
                );
                
            // 🔗 NOWE SERWISY FAZY 3: Ecosystem Integration
            case 'hooks_manager':
                return new HooksManager(
                    $this->get('settings_manager')
                );
                
            case 'gutenberg_manager':
                return new GutenbergManager(
                    $this->get('settings_manager')
                );
                
            // 🚀 NOWE SERWISY FAZY 5: Advanced Performance & UX
            case 'lazy_loader':
                return new LazyLoader($this);
                
            case 'advanced_cache_manager':
                return new AdvancedCacheManager($this);
                
            case 'css_variables_generator':
                return new CSSVariablesGenerator($this);
                
            // 🎯 NOWE SERWISY FAZY 6: Enterprise Integration & Analytics
            case 'analytics_engine':
                return new AnalyticsEngine($this);
                
            case 'integration_manager':
                return new IntegrationManager($this);
                
            case 'enterprise_security_manager':
                // TEMPORARY FIX: Return null to prevent memory exhaustion
                // The service will be available again after optimization
                error_log("MAS: EnterpriseSecurityManager requested but disabled due to memory concerns");
                return null;
                
            case 'memory_optimizer':
                return new MemoryOptimizer($this);
                
            // 🎨 NOWY SERWIS: Preset Manager (Enterprise Preset System)
            case 'preset_manager':
                return new PresetManager(
                    $this->get('settings_manager')
                );
                
            default:
                throw new \InvalidArgumentException("Unknown service: {$service_name}");
        }
    }
    
    /**
     * 🔄 Resetuje wszystkie serwisy (przydatne w testach)
     */
    public function reset() {
        $this->services = [];
    }
    
    /**
     * 📊 Zwraca listę zarejestrowanych serwisów
     */
    public function getRegisteredServices() {
        return array_keys($this->services);
    }
    
    /**
     * 🛡️ Sprawdza czy serwis jest zarejestrowany
     */
    public function has($service_name) {
        return isset($this->services[$service_name]);
    }
    
    /**
     * ⚙️ Konfiguruje serwis (przed utworzeniem)
     */
    public function configure($service_name, array $config) {
        if (isset($this->services[$service_name])) {
            throw new \RuntimeException("Cannot configure service '{$service_name}' - already instantiated");
        }
        
        $this->config["{$service_name}_config"] = $config;
    }
    
    /**
     * 🔧 Zwraca konfigurację dla serwisu
     */
    public function getConfig($service_name) {
        return $this->config["{$service_name}_config"] ?? [];
    }
    
    // 🎯 FAZA 5: Metody pomocnicze dla nowych serwisów
    
    /**
     * 🚀 Lazy Loader Service
     */
    public function getLazyLoader() {
        return $this->get('lazy_loader');
    }
    
    /**
     * 💾 Advanced Cache Manager Service
     */
    public function getAdvancedCacheManager() {
        return $this->get('advanced_cache_manager');
    }
    
    /**
     * 🎨 CSS Variables Generator Service
     */
    public function getCSSVariablesGenerator() {
        return $this->get('css_variables_generator');
    }
    
    /**
     * 📊 Analytics Engine Service
     */
    public function getAnalyticsEngine() {
        return $this->get('analytics_engine');
    }
    
    /**
     * 🔌 Integration Manager Service
     */
    public function getIntegrationManager() {
        return $this->get('integration_manager');
    }
    
    /**
     * 🛡️ Enterprise Security Manager Service
     */
    public function getEnterpriseSecurityManager() {
        // TEMPORARY FIX: Return null to prevent memory exhaustion
        // The service will be available again after optimization
        error_log("MAS: EnterpriseSecurityManager requested but disabled due to memory concerns");
        return null;
        
        // Original code commented out:
        // return $this->get('enterprise_security_manager');
    }
    
    /**
     * 💾 Memory Optimizer Service
     */
    public function getMemoryOptimizer() {
        return $this->get('memory_optimizer');
    }
    
    /**
     * 🎨 Preset Manager Service - Enterprise Preset System
     */
    public function getPresetManager() {
        return $this->get('preset_manager');
    }
    
    /**
     * 📊 Pobierz wszystkie statystyki performance
     */
    public function getPerformanceStats() {
        return [
            'lazy_loader' => $this->getLazyLoader()->getPerformanceStats(),
            'cache_manager' => $this->getAdvancedCacheManager()->getStats(),
            'css_generator' => $this->getCSSVariablesGenerator()->getStats(),
            'timestamp' => current_time('mysql')
        ];
    }
    
    /**
     * 🔧 Convert memory limit string to bytes
     */
    private function convertToBytes($memory_limit) {
        if ($memory_limit == '-1') {
            return PHP_INT_MAX;
        }
        
        $unit = strtolower(substr($memory_limit, -1));
        $value = (int) substr($memory_limit, 0, -1);
        
        switch ($unit) {
            case 'g':
                $value *= 1024;
            case 'm':
                $value *= 1024;
            case 'k':
                $value *= 1024;
        }
        
        return $value;
    }
} 