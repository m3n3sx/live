<?php
/**
 * Service Factory
 * 
 * Implementuje Factory Pattern + Dependency Injection
 * Centralne zarządzanie wszystkimi serwisami wtyczki
 * UPDATED: Consolidated architecture with 8 core services
 * 
 * @package ModernAdminStyler
 * @version 2.2.0
 */

namespace ModernAdminStyler\Services;

class ServiceFactory {
    
    private static $instance = null;
    private $services = [];
    private $config = [];
    
    /**
     * @var array Tracks services currently being resolved to detect circular dependencies
     */
    private $resolving = [];
    
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
        
        // Enable external service management for CoreEngine
        if (!defined('MAS_V2_EXTERNAL_SERVICE_MANAGEMENT')) {
            define('MAS_V2_EXTERNAL_SERVICE_MANAGEMENT', true);
        }
    }
    
    /**
     * 🔧 Tworzy lub zwraca instancję serwisu
     * 🛡️ ENHANCED: Circular dependency detection
     */
    public function get($service_name) {
        // Return existing service if already created
        if (isset($this->services[$service_name])) {
            return $this->services[$service_name];
        }
        
        // Check for circular dependency before attempting to create the service
        if (isset($this->resolving[$service_name])) {
            $resolutionPath = implode(' -> ', array_keys($this->resolving));
            throw new \Exception(sprintf(
                'Circular dependency detected while resolving service "%s". Resolution path: %s -> %s',
                $service_name,
                $resolutionPath,
                $service_name
            ));
        }
        
        // Add the service to the resolving stack
        $this->resolving[$service_name] = true;
        
        try {
            // Create the service
            $this->services[$service_name] = $this->create($service_name);
            
            // Register service with CoreEngine if it's a core service
            $this->registerServiceWithCoreEngine($service_name, $this->services[$service_name]);
            
        } finally {
            // CRITICAL: Always remove the service from the resolving stack
            unset($this->resolving[$service_name]);
        }
        
        return $this->services[$service_name];
    }
    
    /**
     * 🔗 Register service with CoreEngine
     */
    private function registerServiceWithCoreEngine($service_name, $service_instance) {
        // Only register if CoreEngine exists and service is a core service
        if (isset($this->services['core_engine']) && $this->isCoreService($service_name)) {
            $this->services['core_engine']->registerService($service_name, $service_instance);
        }
    }
    
    /**
     * 🔍 Check if service is a core service
     */
    private function isCoreService($service_name) {
        $core_services = [
            'settings_manager',
            'cache_manager',
            'metrics_collector',
            'style_generator',
            'security_manager',
            'admin_interface',
            'api_manager',
            'ajax_handler',
            'asset_loader',
            'preset_manager'
        ];
        
        return in_array($service_name, $core_services);
    }
    
    /**
     * 🏗️ Factory Method - tworzy serwisy z dependency injection
     * UPDATED: New consolidated architecture
     */
    private function create($service_name) {
        switch ($service_name) {
            
            // === CORE ENGINE (ORCHESTRATOR) ===
            case 'core_engine':
                $coreEngine = CoreEngine::getInstance();
                // Don't initialize immediately - services will be registered first
                return $coreEngine;
                
            // === CACHE MANAGEMENT ===
            case 'cache_manager':
                return new CacheManager(
                    $this->get('core_engine')
                );
                
            // === PERFORMANCE MONITORING ===
            case 'metrics_collector':
                return new MetricsCollector(
                    $this->get('core_engine')
                );
                
            // === STYLE GENERATION ===
            case 'style_generator':
                return new StyleGenerator(
                    $this->get('core_engine')
                );
                
            // === SECURITY MANAGEMENT ===
            case 'security_manager':
                return new SecurityManager(
                    $this->get('core_engine')
                );
                
            // === ADMIN INTERFACE ===
            case 'admin_interface':
                return new AdminInterface(
                    $this->get('core_engine')
                );
                
            // === API MANAGEMENT ===
            case 'api_manager':
                return new APIManager(
                    $this->get('cache_manager'),
                    $this->get('security_manager'),
                    $this->get('metrics_collector'),
                    $this->get('settings_manager'),
                    $this->get('preset_manager')
                );
                
            // === SETTINGS MANAGEMENT ===
            case 'settings_manager':
                // ComponentAdapter integrated into SettingsManager
                return new SettingsManager(
                    $this->get('core_engine')
                );
                
            // === AUXILIARY SERVICES ===
            case 'ajax_handler':
                return new AjaxHandler(
                    $this->get('settings_manager')
                );
                
            case 'asset_loader':
                return new AssetLoader(
                    $this->config['plugin_url'],
                    $this->config['plugin_version'],
                    $this->get('settings_manager'),
                    $this->get('style_generator')
                );
                
            case 'preset_manager':
                return new PresetManager(
                    $this->get('settings_manager')
                );
                
            // === LEGACY COMPATIBILITY (DEPRECATED) ===
            case 'css_generator':
                error_log("MAS V2: css_generator deprecated - use style_generator instead");
                return $this->get('style_generator');
                
            case 'security_service':
                error_log("MAS V2: security_service deprecated - use security_manager instead");
                return $this->get('security_manager');
                
            case 'rest_api':
                error_log("MAS V2: rest_api deprecated - use api_manager instead");
                return $this->get('api_manager');
                
            case 'settings_api':
                error_log("MAS V2: settings_api deprecated - use api_manager instead");
                return $this->get('api_manager');
                
            case 'component_adapter':
                error_log("MAS V2: component_adapter deprecated - integrated into settings_manager");
                return null;
                
            case 'hooks_manager':
                error_log("MAS V2: hooks_manager deprecated - integrated into admin_interface");
                return $this->get('admin_interface');
                
            case 'gutenberg_manager':
                error_log("MAS V2: gutenberg_manager deprecated - integrated into admin_interface");
                return $this->get('admin_interface');
                
            case 'lazy_loader':
                error_log("MAS V2: lazy_loader deprecated - functionality moved to cache_manager");
                return null;
                
            case 'advanced_cache_manager':
                error_log("MAS V2: advanced_cache_manager deprecated - use cache_manager instead");
                return $this->get('cache_manager');
                
            case 'css_variables_generator':
                error_log("MAS V2: css_variables_generator deprecated - use style_generator instead");
                return $this->get('style_generator');
                
            case 'analytics_engine':
                error_log("MAS V2: analytics_engine deprecated - use metrics_collector instead");
                return $this->get('metrics_collector');
                
            case 'integration_manager':
                error_log("MAS V2: integration_manager deprecated - functionality distributed to other services");
                return null;
                
            case 'enterprise_security_manager':
                error_log("MAS V2: enterprise_security_manager deprecated - use security_manager instead");
                return $this->get('security_manager');
                
            case 'memory_optimizer':
                error_log("MAS V2: memory_optimizer deprecated - use cache_manager instead");
                return $this->get('cache_manager');
                
            // customizer_integration removed - use Live Edit Mode instead
                
            default:
                throw new \InvalidArgumentException("Unknown service: {$service_name}");
        }
    }
    
    /**
     * 🚀 Initialize Core Services
     * Creates all core services in proper dependency order
     */
    public function initializeCoreServices() {
        $core_services = [
            'core_engine',
            'settings_manager',
            'cache_manager',
            'metrics_collector',
            'style_generator',
            'security_manager',
            'admin_interface',
            'api_manager'
        ];
        
        // Phase 1: Create all services (CoreEngine not initialized yet)
        foreach ($core_services as $service) {
            $this->get($service);
        }
        
        // Phase 2: Initialize CoreEngine now that all services are registered
        if (isset($this->services['core_engine'])) {
            $this->services['core_engine']->initialize();
        }
        
        // Phase 3: Trigger the services ready event for lazy initialization
        do_action('mas_core_services_ready');
        
        error_log("MAS V2: Initialized " . count($core_services) . " core services");
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
    
    /**
     * 📈 Get Performance Statistics
     */
    public function getPerformanceStats() {
        $stats = [
            'total_services' => count($this->services),
            'core_services' => 8,
            'auxiliary_services' => count($this->services) - 8,
            'memory_usage' => memory_get_usage(true),
            'peak_memory' => memory_get_peak_usage(true),
            'services_list' => array_keys($this->services)
        ];
        
        return $stats;
    }
    
    /**
     * 🎯 Get Service Status
     */
    public function getServiceStatus() {
        $status = [];
        
        $core_services = [
            'core_engine', 'settings_manager', 'cache_manager', 'metrics_collector',
            'style_generator', 'security_manager', 'admin_interface', 'api_manager'
        ];
        
        foreach ($core_services as $service) {
            $status[$service] = [
                'initialized' => $this->has($service),
                'type' => 'core',
                'dependencies' => $this->getServiceDependencies($service)
            ];
        }
        
        return $status;
    }
    
    /**
     * 🔗 Get Service Dependencies
     */
    private function getServiceDependencies($service_name) {
        $dependencies = [
            'core_engine' => [],
            'settings_manager' => [],
            'cache_manager' => ['settings_manager'],
            'metrics_collector' => ['cache_manager'],
            'style_generator' => ['settings_manager', 'cache_manager'],
            'security_manager' => ['settings_manager', 'cache_manager', 'metrics_collector'],
            'admin_interface' => ['settings_manager', 'security_manager'],
            'api_manager' => ['cache_manager', 'security_manager', 'metrics_collector', 'settings_manager', 'preset_manager'],
            'ajax_handler' => ['settings_manager'],
            'asset_loader' => ['settings_manager', 'style_generator'],
            'preset_manager' => ['settings_manager']
        ];
        
        return $dependencies[$service_name] ?? [];
    }
} 