<?php
/**
 * Core Engine - Central Orchestration & Dependency Injection System
 * 
 * CONSOLIDATED: CoreEngine + ServiceFactory
 * - Central coordination of all plugin services
 * - Dependency injection and service management
 * - Plugin lifecycle management
 * - Service communication coordination
 * - Factory pattern implementation
 * 
 * @package ModernAdminStyler
 * @version 2.5.0 - DI Consolidated Architecture
 */

namespace ModernAdminStyler\Services;

// Import required service classes
require_once __DIR__ . '/UnifiedAjaxManager.php';
require_once __DIR__ . '/BackwardCompatibilityManager.php';

class CoreEngine {
    
    private static $instance = null;
    private $services = [];
    private $resolving = []; // For circular dependency detection
    private $isInitialized = false;
    
    // Service management
    private $config = [];
    private $serviceStatus = [];
    
    // Original CoreEngine properties
    private $settingsManager;
    private $assetLoader;
    private $styleGenerator;
    private $securityManager;
    private $cacheManager;
    private $adminInterface;
    private $communicationManager;
    
    /**
     * 🏭 Singleton Pattern (ENHANCED)
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
        
        // Enable external service management
        if (!defined('MAS_V2_EXTERNAL_SERVICE_MANAGEMENT')) {
            define('MAS_V2_EXTERNAL_SERVICE_MANAGEMENT', true);
        }
    }
    
    /**
     * 🚀 Initialize Core Engine with Service Factory
     */
    public function initialize() {
        if ($this->isInitialized) {
            return;
        }
        
        try {
            // Initialize all core services
            $this->initializeCoreServices();
            
            // Mark as initialized
            $this->isInitialized = true;
            
            // Trigger services ready event
            do_action('mas_core_services_ready');
            
            error_log("MAS V2: Core Engine initialized with " . count($this->services) . " services");
            
        } catch (\Exception $e) {
            error_log("MAS V2: Core Engine initialization failed: " . $e->getMessage());
        }
    }
    
    // ========================================
    // 🏭 DEPENDENCY INJECTION SYSTEM (FROM ServiceFactory)
    // ========================================
    
    /**
     * 🔧 Get or create service instance
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
            $this->services[$service_name] = $this->createService($service_name);
            
            // Register service with CoreEngine if it's a core service
            $this->registerService($service_name, $this->services[$service_name]);
            
        } finally {
            // CRITICAL: Always remove the service from the resolving stack
            unset($this->resolving[$service_name]);
        }
        
        return $this->services[$service_name];
    }
    
    /**
     * 🏗️ Factory Method - creates services with dependency injection
     * UPDATED: New consolidated architecture
     */
    private function createService($service_name) {
        switch ($service_name) {
            
            // === CORE ENGINE (ORCHESTRATOR) ===
            case 'core_engine':
                return $this; // Self-reference
                
            // === CACHE & PERFORMANCE MANAGEMENT ===
            case 'cache_manager':
                return new CacheManager($this);
                
            // === STYLE GENERATION ===
            case 'style_generator':
                return new StyleGenerator($this);
                
            // === SECURITY MANAGEMENT ===
            case 'security_manager':
                return new SecurityManager($this);
                
            // === ADMIN INTERFACE ===
            case 'admin_interface':
                return new AdminInterface($this);
                
            // === COMMUNICATION MANAGEMENT ===
            case 'communication_manager':
                return new CommunicationManager(
                    $this->get('settings_manager'),
                    $this->get('cache_manager'),
                    $this->get('security_manager'),
                    $this->get('cache_manager'), // Using cache_manager as metrics_collector
                    $this->get('settings_manager') // Using settings_manager for presets
                );
                
            // === UNIFIED AJAX MANAGEMENT ===
            case 'unified_ajax_manager':
                return new UnifiedAjaxManager(
                    $this->get('settings_manager')
                );
                
            // === BACKWARD COMPATIBILITY MANAGEMENT ===
            case 'backward_compatibility_manager':
                return new BackwardCompatibilityManager();
                
            // === SETTINGS MANAGEMENT ===
            case 'settings_manager':
                return new SettingsManager($this);
                
            // === ASSET LOADING ===
            case 'asset_loader':
                return new AssetLoader(
                    $this->config['plugin_url'],
                    $this->config['plugin_version'],
                    $this->get('settings_manager'),
                    $this->get('style_generator')
                );
                
            // === LEGACY COMPATIBILITY (DEPRECATED) ===
            case 'ajax_handler':
                error_log("MAS V2: ajax_handler deprecated - use communication_manager instead");
                return $this->get('communication_manager');
                
            case 'api_manager':
                error_log("MAS V2: api_manager deprecated - use communication_manager instead");
                return $this->get('communication_manager');
                
            case 'preset_manager':
                error_log("MAS V2: preset_manager deprecated - use settings_manager->getPresets() instead");
                return $this->get('settings_manager');
                
            case 'metrics_collector':
                error_log("MAS V2: metrics_collector deprecated - use cache_manager instead");
                return $this->get('cache_manager');
                
            case 'dashboard_manager':
                error_log("MAS V2: dashboard_manager deprecated - integrated into admin_interface");
                return $this->get('admin_interface');
                
            case 'css_generator':
                error_log("MAS V2: css_generator deprecated - use style_generator instead");
                return $this->get('style_generator');
                
            case 'security_service':
                error_log("MAS V2: security_service deprecated - use security_manager instead");
                return $this->get('security_manager');
                
            case 'service_factory':
                error_log("MAS V2: service_factory deprecated - integrated into core_engine");
                return $this;
                
            default:
                throw new \InvalidArgumentException("Unknown service: {$service_name}");
        }
    }
    
    /**
     * 🚀 Initialize Core Services
     * Creates all core services in proper dependency order
     */
    private function initializeCoreServices() {
        $core_services = [
            'settings_manager',
            'cache_manager',
            'style_generator', 
            'security_manager',
            'unified_ajax_manager',  // Initialize AJAX manager early for endpoint registration
            'backward_compatibility_manager',  // Initialize compatibility layer after AJAX manager
            'admin_interface',
            'communication_manager',
            'asset_loader'
        ];
        
        // Create all services
        foreach ($core_services as $service) {
            $this->get($service);
        }
        
        error_log("MAS V2: Initialized " . count($core_services) . " core services");
    }
    
    /**
     * 🔗 Register service with CoreEngine
     */
    public function registerService($service_name, $service_instance) {
        // Store the service instance
        $this->services[$service_name] = $service_instance;
        
        // Update service status
        $this->serviceStatus[$service_name] = [
            'initialized' => true,
            'type' => $this->isCoreService($service_name) ? 'core' : 'auxiliary',
            'dependencies' => $this->getServiceDependencies($service_name),
            'registered_at' => current_time('mysql')
        ];
        
        // Set up references for legacy methods
        switch ($service_name) {
            case 'settings_manager':
                $this->settingsManager = $service_instance;
                break;
            case 'asset_loader':
                $this->assetLoader = $service_instance;
                break;
            case 'style_generator':
                $this->styleGenerator = $service_instance;
                break;
            case 'security_manager':
                $this->securityManager = $service_instance;
                break;
            case 'cache_manager':
                $this->cacheManager = $service_instance;
                break;
            case 'admin_interface':
                $this->adminInterface = $service_instance;
                break;
            case 'communication_manager':
                $this->communicationManager = $service_instance;
                break;
        }
    }
    
    /**
     * 🔍 Check if service is a core service
     */
    private function isCoreService($service_name) {
        $core_services = [
            'settings_manager',
            'cache_manager',
            'style_generator',
            'security_manager',
            'unified_ajax_manager',
            'backward_compatibility_manager',
            'admin_interface',
            'communication_manager',
            'asset_loader'
        ];
        
        return in_array($service_name, $core_services);
    }
    
    /**
     * 🔗 Get Service Dependencies
     */
    private function getServiceDependencies($service_name) {
        $dependencies = [
            'settings_manager' => [],
            'cache_manager' => ['settings_manager'],
            'style_generator' => ['settings_manager', 'cache_manager'],
            'security_manager' => ['settings_manager', 'cache_manager'],
            'unified_ajax_manager' => ['settings_manager'],
            'backward_compatibility_manager' => [],
            'admin_interface' => ['settings_manager', 'security_manager'],
            'communication_manager' => ['settings_manager', 'cache_manager', 'security_manager'],
            'asset_loader' => ['settings_manager', 'style_generator']
        ];
        
        return $dependencies[$service_name] ?? [];
    }
    
    /**
     * 🔄 Reset all services (useful for testing)
     */
    public function reset() {
        $this->services = [];
        $this->resolving = [];
        $this->serviceStatus = [];
        $this->isInitialized = false;
    }
    
    /**
     * 📊 Get list of registered services
     */
    public function getRegisteredServices() {
        return array_keys($this->services);
    }
    
    /**
     * 🛡️ Check if service is registered
     */
    public function has($service_name) {
        return isset($this->services[$service_name]);
    }
    
    /**
     * ⚙️ Configure service (before creation)
     */
    public function configure($service_name, array $config) {
        if (isset($this->services[$service_name])) {
            throw new \RuntimeException("Cannot configure service '{$service_name}' - already instantiated");
        }
        
        $this->config["{$service_name}_config"] = $config;
    }
    
    /**
     * 🔧 Get configuration for service
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
            'services_list' => array_keys($this->services),
            'initialization_status' => $this->isInitialized
        ];
        
        return $stats;
    }
    
    /**
     * 🎯 Get Service Status
     */
    public function getServiceStatus() {
        return $this->serviceStatus;
    }
    
    // ========================================
    // 🔧 LEGACY COMPATIBILITY METHODS (UPDATED)
    // ========================================
    
    /**
     * 🔧 Get Settings Manager
     */
    public function getSettingsManager() {
        return $this->get('settings_manager');
    }
    
    /**
     * 🎨 Get Asset Loader
     */
    public function getAssetLoader() {
        return $this->get('asset_loader');
    }
    
    /**
     * 🎨 Get Style Generator
     */
    public function getStyleGenerator() {
        return $this->get('style_generator');
    }
    
    /**
     * 🛡️ Get Security Manager
     */
    public function getSecurityManager() {
        return $this->get('security_manager');
    }
    
    /**
     * 🗄️ Get Cache Manager
     */
    public function getCacheManager() {
        return $this->get('cache_manager');
    }
    
    /**
     * 🎛️ Get Admin Interface
     */
    public function getAdminInterface() {
        return $this->get('admin_interface');
    }
    
    /**
     * 📡 Get Communication Manager
     */
    public function getCommunicationManager() {
        return $this->get('communication_manager');
    }
    
    /**
     * 🔗 Get Unified AJAX Manager
     */
    public function getUnifiedAjaxManager() {
        return $this->get('unified_ajax_manager');
    }
    
    /**
     * 🔄 Get Backward Compatibility Manager
     */
    public function getBackwardCompatibilityManager() {
        return $this->get('backward_compatibility_manager');
    }
    
    /**
     * 📊 Get Metrics Collector (DEPRECATED - use CacheManager)
     */
    public function getMetricsCollector() {
        error_log("MAS V2: getMetricsCollector() deprecated - use getCacheManager() instead");
        return $this->get('cache_manager');
    }
    
    /**
     * 🎯 Get Preset Manager (DEPRECATED - use SettingsManager)
     */
    public function getPresetManager() {
        error_log("MAS V2: getPresetManager() deprecated - use getSettingsManager()->getPresets() instead");
        return $this->get('settings_manager');
    }
    
    /**
     * 🔗 Get AJAX Handler (DEPRECATED - use CommunicationManager)
     */
    public function getAjaxHandler() {
        error_log("MAS V2: getAjaxHandler() deprecated - use getCommunicationManager() instead");
        return $this->get('communication_manager');
    }
    
    /**
     * 🔗 Get API Manager (DEPRECATED - use CommunicationManager)
     */
    public function getAPIManager() {
        error_log("MAS V2: getAPIManager() deprecated - use getCommunicationManager() instead");
        return $this->get('communication_manager');
    }
    
    /**
     * 🏠 Get Dashboard Manager (DEPRECATED - use AdminInterface)
     */
    public function getDashboardManager() {
        error_log("MAS V2: getDashboardManager() deprecated - use getAdminInterface() instead");
        return $this->get('admin_interface');
    }
    
    // Prevent cloning and serialization
    private function __clone() {}
    public function __wakeup() {
        throw new \Exception("Cannot unserialize singleton");
    }
} 