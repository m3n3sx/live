<?php
/**
 * Core Engine - Central Service Orchestrator
 * 
 * KONSOLIDACJA 2024: Główny serwis zarządzający wszystkimi komponentami
 * Zastępuje ServiceFactory i zapewnia jednolite API dla całego systemu
 * 
 * @package ModernAdminStyler
 * @version 4.0.0 - Konsolidacja
 */

namespace ModernAdminStyler\Services;

class CoreEngine {
    
    private static $instance = null;
    private $services = [];
    private $initialized = false;
    private $bootTime;
    private $config;
    
    // 🎯 Mapa serwisów po konsolidacji
    const SERVICE_SETTINGS = 'settings_manager';
    const SERVICE_ASSET_LOADER = 'asset_loader';
    const SERVICE_AJAX_HANDLER = 'ajax_handler';
    const SERVICE_STYLE_GENERATOR = 'style_generator';
    const SERVICE_CACHE_MANAGER = 'cache_manager';
    const SERVICE_SECURITY_MANAGER = 'security_manager';
    const SERVICE_ADMIN_INTERFACE = 'admin_interface';
    const SERVICE_API = 'api';
    const SERVICE_METRICS = 'metrics_collector';
    
    // 🔧 Stan systemu
    const STATE_INITIALIZING = 'initializing';
    const STATE_READY = 'ready';
    const STATE_ERROR = 'error';
    const STATE_MAINTENANCE = 'maintenance';
    
    private $systemState = self::STATE_INITIALIZING;
    private $errors = [];
    
    private function __construct() {
        $this->bootTime = microtime(true);
        $this->loadConfiguration();
    }
    
    /**
     * 🚀 Singleton instance
     */
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    /**
     * ⚙️ Inicjalizacja systemu
     */
    public function initialize() {
        if ($this->initialized) {
            return true;
        }
        
        try {
            // 1. Sprawdź wymagania systemowe
            $this->checkSystemRequirements();
            
            // 2. Inicjalizuj podstawowe serwisy
            $this->initializeCoreServices();
            
            // 3. Inicjalizuj serwisy business logic
            $this->initializeBusinessServices();
            
            // 4. Rejestruj hooks systemowe
            $this->registerSystemHooks();
            
            // 5. Finalny setup
            $this->finalizeInitialization();
            
            $this->initialized = true;
            $this->systemState = self::STATE_READY;
            
            $this->logSystemBoot();
            
            return true;
            
        } catch (\Exception $e) {
            $this->systemState = self::STATE_ERROR;
            $this->errors[] = $e->getMessage();
            error_log('MAS CoreEngine: Initialization failed - ' . $e->getMessage());
            return false;
        }
    }
    
    /**
     * 🔧 Inicjalizacja podstawowych serwisów
     */
    private function initializeCoreServices() {
        // Skip service creation if services are being managed externally (e.g., by ServiceFactory)
        if ($this->hasExternalServiceManagement()) {
            return;
        }
        
        // 1. Cache Manager (musi być pierwszy)
        $this->services[self::SERVICE_CACHE_MANAGER] = new CacheManager($this);
        
        // 2. Security Manager (drugi w kolejności)
        $this->services[self::SERVICE_SECURITY_MANAGER] = new SecurityManager($this);
        
        // 3. Settings Manager
        $this->services[self::SERVICE_SETTINGS] = new SettingsManager($this);
        
        // 4. Metrics Collector
        $this->services[self::SERVICE_METRICS] = new MetricsCollector($this);
    }
    
    /**
     * 💼 Inicjalizacja serwisów business logic
     */
    private function initializeBusinessServices() {
        // Skip service creation if services are being managed externally (e.g., by ServiceFactory)
        if ($this->hasExternalServiceManagement()) {
            return;
        }
        
        // 5. Style Generator
        $this->services[self::SERVICE_STYLE_GENERATOR] = new StyleGenerator($this);
        
        // 6. Asset Loader
        $this->services[self::SERVICE_ASSET_LOADER] = new AssetLoader($this);
        
        // 7. Admin Interface
        $this->services[self::SERVICE_ADMIN_INTERFACE] = new AdminInterface($this);
        
        // 8. API
        $this->services[self::SERVICE_API] = new API($this);
        
        // 9. Ajax Handler
        $this->services[self::SERVICE_AJAX_HANDLER] = new AjaxHandler($this);
    }
    
    /**
     * 🔗 Register service externally (for ServiceFactory integration)
     */
    public function registerService($service_name, $service_instance) {
        $this->services[$service_name] = $service_instance;
    }
    
    /**
     * 🔍 Check if external service management is active
     */
    private function hasExternalServiceManagement() {
        // Check if ServiceFactory is managing services
        return defined('MAS_V2_EXTERNAL_SERVICE_MANAGEMENT') && MAS_V2_EXTERNAL_SERVICE_MANAGEMENT;
    }
    
    /**
     * 🔗 Rejestracja hooks systemowych
     */
    private function registerSystemHooks() {
        // System lifecycle hooks
        add_action('wp_loaded', [$this, 'onWordPressLoaded']);
        add_action('admin_init', [$this, 'onAdminInit']);
        add_action('wp_enqueue_scripts', [$this, 'onEnqueueScripts']);
        add_action('admin_enqueue_scripts', [$this, 'onAdminEnqueueScripts']);
        
        // Performance monitoring
        add_action('shutdown', [$this, 'onShutdown']);
        
        // Error handling
        add_action('wp_die_handler', [$this, 'onSystemError']);
    }
    
    /**
     * 🎯 Pobierz serwis
     */
    public function getService($service_name) {
        if (!isset($this->services[$service_name])) {
            // Enhanced error reporting with detailed service information
            $availableServices = array_keys($this->services);
            $availableServicesStr = implode(', ', $availableServices);
            
            $message = sprintf(
                "Service '%s' not found or not initialized. This is likely an issue with the service registration order. Available services: [%s]. Total services: %d",
                $service_name,
                $availableServicesStr ?: 'None',
                count($availableServices)
            );
            
            error_log("🚨 MAS V2 CoreEngine Error: " . $message);
            throw new \Exception($message);
        }
        
        return $this->services[$service_name];
    }
    
    /**
     * 📊 Skróty do często używanych serwisów
     */
    public function getSettings() {
        return $this->getService(self::SERVICE_SETTINGS);
    }
    
    public function getCache() {
        return $this->getService(self::SERVICE_CACHE_MANAGER);
    }
    
    public function getSecurity() {
        return $this->getService(self::SERVICE_SECURITY_MANAGER);
    }
    
    public function getMetrics() {
        return $this->getService(self::SERVICE_METRICS);
    }
    
    public function getStyleGenerator() {
        return $this->getService(self::SERVICE_STYLE_GENERATOR);
    }
    
    public function getAssetLoader() {
        return $this->getService(self::SERVICE_ASSET_LOADER);
    }
    
    public function getAdminInterface() {
        return $this->getService(self::SERVICE_ADMIN_INTERFACE);
    }
    
    public function getAPI() {
        return $this->getService(self::SERVICE_API);
    }
    
    public function getAjaxHandler() {
        return $this->getService(self::SERVICE_AJAX_HANDLER);
    }
    
    /**
     * ⚡ Konfiguracja systemu
     */
    private function loadConfiguration() {
        $this->config = [
            'version' => defined('MAS_V2_VERSION') ? MAS_V2_VERSION : '4.0.0',
            'debug' => defined('WP_DEBUG') && WP_DEBUG,
            'cache_enabled' => true,
            'metrics_enabled' => true,
            'security_level' => 'high',
            'performance_mode' => false,
            'error_reporting' => true
        ];
    }
    
    /**
     * 🔍 Sprawdź wymagania systemowe
     */
    private function checkSystemRequirements() {
        $requirements = [
            'php_version' => '7.4.0',
            'wp_version' => '5.0.0',
            'memory_limit' => '64M',
            'required_functions' => ['json_encode', 'json_decode', 'file_get_contents'],
            'required_extensions' => ['json', 'mbstring']
        ];
        
        // PHP Version
        if (version_compare(PHP_VERSION, $requirements['php_version'], '<')) {
            throw new \Exception("PHP {$requirements['php_version']} or higher is required");
        }
        
        // WordPress Version
        global $wp_version;
        if (version_compare($wp_version, $requirements['wp_version'], '<')) {
            throw new \Exception("WordPress {$requirements['wp_version']} or higher is required");
        }
        
        // Memory limit
        $memory_limit = ini_get('memory_limit');
        if ($this->parseMemoryLimit($memory_limit) < $this->parseMemoryLimit($requirements['memory_limit'])) {
            throw new \Exception("Memory limit of at least {$requirements['memory_limit']} is required");
        }
    }
    
    /**
     * 🏁 Finalizacja inicjalizacji
     */
    private function finalizeInitialization() {
        // Uruchom post-initialization hooks dla wszystkich serwisów
        foreach ($this->services as $service) {
            if (method_exists($service, 'onSystemReady')) {
                $service->onSystemReady();
            }
        }
        
        // Trigger system ready event
        do_action('mas_core_engine_ready', $this);
    }
    
    /**
     * 📝 System lifecycle events
     */
    public function onWordPressLoaded() {
        do_action('mas_core_wp_loaded', $this);
    }
    
    public function onAdminInit() {
        do_action('mas_core_admin_init', $this);
    }
    
    public function onEnqueueScripts() {
        $this->getAssetLoader()->enqueuePublicAssets();
    }
    
    public function onAdminEnqueueScripts() {
        $this->getAssetLoader()->enqueueAdminAssets();
    }
    
    public function onShutdown() {
        $this->logPerformanceMetrics();
    }
    
    /**
     * 📊 System status i diagnostyka
     */
    public function getSystemStatus() {
        return [
            'state' => $this->systemState,
            'initialized' => $this->initialized,
            'boot_time' => $this->bootTime,
            'uptime' => microtime(true) - $this->bootTime,
            'memory_usage' => memory_get_usage(true),
            'peak_memory' => memory_get_peak_usage(true),
            'services_count' => count($this->services),
            'errors' => $this->errors,
            'version' => $this->config['version']
        ];
    }
    
    public function getHealthCheck() {
        $health = [
            'overall' => 'healthy',
            'services' => [],
            'issues' => []
        ];
        
        foreach ($this->services as $name => $service) {
            if (method_exists($service, 'getHealthStatus')) {
                $serviceHealth = $service->getHealthStatus();
                $health['services'][$name] = $serviceHealth;
                
                if ($serviceHealth['status'] !== 'healthy') {
                    $health['overall'] = 'warning';
                    $health['issues'][] = "{$name}: {$serviceHealth['message']}";
                }
            } else {
                $health['services'][$name] = ['status' => 'unknown'];
            }
        }
        
        return $health;
    }
    
    /**
     * 📈 Performance logging
     */
    private function logSystemBoot() {
        $bootTime = (microtime(true) - $this->bootTime) * 1000;
        
        $this->getMetrics()->collectPerformanceMetric(
            'system_boot',
            $bootTime,
            [
                'services_count' => count($this->services),
                'memory_usage' => memory_get_usage(true),
                'version' => $this->config['version']
            ]
        );
    }
    
    private function logPerformanceMetrics() {
        if (!$this->initialized) return;
        
        $metrics = [
            'uptime' => microtime(true) - $this->bootTime,
            'memory_usage' => memory_get_usage(true),
            'peak_memory' => memory_get_peak_usage(true),
            'queries' => get_num_queries()
        ];
        
        $this->getMetrics()->collectSystemHealthMetric(
            'system_performance',
            'healthy',
            $metrics
        );
    }
    
    /**
     * 🛠️ Utility methods
     */
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
    
    public function onSystemError($function) {
        $this->systemState = self::STATE_ERROR;
        return $function;
    }
    
    /**
     * 🔄 Legacy compatibility - ServiceFactory methods
     */
    public function getSettingsManager() {
        return $this->getSettings();
    }
    
    public function getCacheManager() {
        return $this->getCache();
    }
    
    public function getAdvancedCacheManager() {
        return $this->getCache(); // Teraz to samo co CacheManager
    }
    
    public function getSecurityService() {
        return $this->getSecurity();
    }
    
    public function getAnalyticsEngine() {
        return $this->getMetrics(); // Skonsolidowane
    }
    
    public function getMetricsCollector() {
        return $this->getMetrics();
    }
    
    public function getCSSGenerator() {
        return $this->getStyleGenerator();
    }
    
    // Prevent cloning and unserialization
    private function __clone() {}
    public function __wakeup() {
        throw new \Exception("Cannot unserialize CoreEngine");
    }
} 