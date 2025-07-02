<?php
/**
 * Plugin Name: Modern Admin Styler V2
 * Plugin URI: https://github.com/modern-admin-team/modern-admin-styler-v2
 * Description: Kompletna wtyczka do stylowania panelu WordPress z nowoczesnymi dashboardami, metrykami, kartami z gradientami, glassmorphism i interaktywnymi elementami UI! Teraz z trybem ciemnym/jasnym i nowoczesnymi fontami!
 * Version: 2.2.0
 * Author: Modern Web Dev Team
 * Text Domain: modern-admin-styler-v2
 * Domain Path: /languages
 * Requires at least: 5.0
 * Tested up to: 6.4
 * Requires PHP: 7.4
 */

// Zabezpieczenie przed bezpośrednim dostępem
if (!defined('ABSPATH')) {
    exit;
}

// Definicje stałych - ujednolicenie wersji
define('MAS_V2_VERSION', '2.2.0');
define('MAS_V2_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('MAS_V2_PLUGIN_URL', plugin_dir_url(__FILE__));
define('MAS_V2_PLUGIN_FILE', __FILE__);

// 🚀 Autoloader dla serwisów
spl_autoload_register(function ($class) {
    $prefix = 'ModernAdminStyler\\Services\\';
    $base_dir = __DIR__ . '/src/services/';
    
    $len = strlen($prefix);
    if (strncmp($prefix, $class, $len) !== 0) {
        return;
    }
    
    $relative_class = substr($class, $len);
    $file = $base_dir . str_replace('\\', '/', $relative_class) . '.php';
    
    if (file_exists($file)) {
        require $file;
    }
});

/**
 * Główna klasa wtyczki - Refaktoryzowana architektura serwisów
 */
class ModernAdminStylerV2 {
    
    private static $instance = null;
    
    // 🏗️ Nowa architektura serwisów
    private $asset_loader;
    private $ajax_handler;
    private $settings_manager;
    
    // 🚀 Enterprise serwisy
    private $cache_manager;
    private $css_generator;
    private $security_service;
    private $metrics_collector;
    
    // 🎯 Serwisy WordPress API (Faza 1)
    private $settings_api;
    private $rest_api;
    
    // 🎨 Serwisy komponentów (Faza 2)
    private $component_adapter;
    
    // 🔗 Serwisy ekosystemu (Faza 3)
    private $hooks_manager;
    private $gutenberg_manager;
    
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    private function __construct() {
        $this->init();
    }
    
    /**
     * Inicjalizacja wtyczki
     */
    private function init() {
        // 🏗️ Inicjalizacja serwisów
        $this->initServices();
        
        // Hooks
        add_action('init', [$this, 'loadTextdomain']);
        add_action('admin_menu', [$this, 'addAdminMenu']);
        add_action('admin_enqueue_scripts', [$this, 'enqueueAssets']);
        add_action('admin_enqueue_scripts', [$this, 'enqueueGlobalAssets']);
        
        /*
         * ❌ CUSTOMIZER INTEGRATION REMOVED
         * Reason: Live Edit Mode provides superior UX compared to WordPress Customizer
         * The data-driven architecture in admin-modern-v3.js offers real-time visual editing
         * directly on admin pages, eliminating the need for a separate Customizer interface.
         */
        
        // 🚀 AJAX handlers - teraz przez serwis
        add_action('wp_ajax_mas_v2_save_settings', [$this->ajax_handler, 'handleSaveSettings']);
        add_action('wp_ajax_mas_v2_reset_settings', [$this->ajax_handler, 'handleResetSettings']);
        add_action('wp_ajax_mas_v2_export_settings', [$this->ajax_handler, 'handleExportSettings']);
        add_action('wp_ajax_mas_v2_import_settings', [$this->ajax_handler, 'handleImportSettings']);
        add_action('wp_ajax_mas_v2_db_check', [$this->ajax_handler, 'handleDatabaseCheck']);
        
        // 🚀 Enterprise AJAX endpoints - delegacja do AjaxHandler
        add_action('wp_ajax_mas_v2_cache_flush', [$this->ajax_handler, 'handleCacheFlush']);
        add_action('wp_ajax_mas_v2_cache_stats', [$this->ajax_handler, 'handleCacheStats']);
        add_action('wp_ajax_mas_v2_metrics_report', [$this->ajax_handler, 'handleMetricsReport']);
        add_action('wp_ajax_mas_v2_security_scan', [$this->ajax_handler, 'handleSecurityScan']);
        add_action('wp_ajax_mas_v2_performance_benchmark', [$this->ajax_handler, 'handlePerformanceBenchmark']);
        add_action('wp_ajax_mas_v2_css_regenerate', [$this->ajax_handler, 'handleCSSRegenerate']);
        
        // 💾 Memory Optimization AJAX endpoints
        add_action('wp_ajax_mas_v2_memory_stats', [$this->ajax_handler, 'handleMemoryStats']);
        add_action('wp_ajax_mas_v2_force_memory_optimization', [$this->ajax_handler, 'handleForceMemoryOptimization']);
        
        // 🎨 FAZA 2: Clear cache handler
        add_action('wp_ajax_mas_v2_clear_cache', [$this, 'ajaxClearCache']);
        
        // Output custom styles
        add_action('admin_head', [$this, 'outputCustomStyles']);
        add_action('wp_head', [$this, 'outputFrontendStyles']);
        add_action('login_head', [$this, 'outputLoginStyles']);
        
        // Footer modifications
        add_filter('admin_footer_text', [$this, 'customAdminFooter']);
        
        // Body class modifications
        add_filter('admin_body_class', [$this, 'addAdminBodyClasses']);
        
        // Menu search and custom blocks
        add_action('admin_footer', [$this, 'renderMenuSearchAndBlocks']);
        
        // Activation/Deactivation hooks
        register_activation_hook(__FILE__, [$this, 'activate']);
        register_deactivation_hook(__FILE__, [$this, 'deactivate']);
        
        // Allow framing for localhost viewer
        add_action('init', [$this, 'allowFramingForLocalhostViewer']);
        
        // AJAX handlers dla diagnostyki
        add_action('wp_ajax_mas_database_check', [$this, 'ajaxDatabaseCheck']);
        add_action('wp_ajax_mas_options_test', [$this, 'ajaxOptionsTest']);
        add_action('wp_ajax_mas_cache_check', [$this, 'ajaxCacheCheck']);
        add_action('wp_ajax_mas_clear_cache', [$this, 'ajaxClearCache']);
        
        // 🎯 LIVE EDIT MODE: AJAX handlers for contextual editing
        add_action('wp_ajax_mas_save_live_settings', [$this, 'ajaxSaveLiveSettings']);
        add_action('wp_ajax_mas_get_live_settings', [$this, 'ajaxGetLiveSettings']);
        add_action('wp_ajax_mas_reset_live_setting', [$this, 'ajaxResetLiveSetting']);
        
        // Legacy AJAX (for backward compatibility)
        add_action('wp_ajax_save_mas_v2_settings', [$this, 'ajaxSaveSettings']);
        add_action('wp_ajax_mas_live_preview', [$this, 'ajaxLivePreview']);
    }
    
    /**
     * Allow framing for Localhost Viewer extension in Cursor.
     */
    public function allowFramingForLocalhostViewer() {
        // This allows the site to be embedded in an iframe for development purposes.
        remove_action('admin_init', 'send_frame_options_header');
        remove_action('login_init', 'send_frame_options_header');
    }
    
    /**
     * 💾 Memory diagnostic function (temporary fix for memory issues)
     */
    public function logMemoryUsage($context = '') {
        $current_memory = memory_get_usage();
        $peak_memory = memory_get_peak_usage();
        $memory_limit = ini_get('memory_limit');
        
        error_log("MAS Memory Usage - {$context}: Current: " . number_format($current_memory / 1024 / 1024, 2) . "MB, Peak: " . number_format($peak_memory / 1024 / 1024, 2) . "MB, Limit: {$memory_limit}");
    }
    
    /**
     * Autoloader dla klas
     */
    public function autoload($className) {
        if (strpos($className, 'ModernAdminStylerV2\\') !== 0) {
            return;
        }
        
        $className = str_replace('ModernAdminStylerV2\\', '', $className);
        $className = str_replace('\\', DIRECTORY_SEPARATOR, $className);
        
        $file = MAS_V2_PLUGIN_DIR . 'src' . DIRECTORY_SEPARATOR . $className . '.php';
        
        if (file_exists($file)) {
            require_once $file;
        }
    }
    
    /**
     * 🏗️ Inicjalizacja serwisów przez ServiceFactory
     * 🎯 FAZA 1: Głęboka integracja z WordPress API
     */
    public function initServices() {
        // 🏭 Użyj ServiceFactory do zarządzania serwisami
        $factory = \ModernAdminStyler\Services\ServiceFactory::getInstance();
        
        // 🔧 Pobierz serwisy z factory
        $this->settings_manager = $factory->get('settings_manager');
        $this->asset_loader = $factory->get('asset_loader');
        $this->ajax_handler = $factory->get('ajax_handler');
        
        // 🚀 Dodatkowe serwisy dla enterprise features
        $this->cache_manager = $factory->get('cache_manager');
        $this->css_generator = $factory->get('css_generator');
        $this->security_service = $factory->get('security_service');
        $this->metrics_collector = $factory->get('metrics_collector');
        
        // 🎯 NOWE SERWISY FAZY 1: WordPress API Integration
        $this->settings_api = $factory->get('settings_api');
        $this->rest_api = $factory->get('rest_api');
        
        // 🎨 NOWY SERWIS FAZY 2: Component Adapter
        $this->component_adapter = $factory->get('component_adapter');
        
        // 🔗 NOWE SERWISY FAZY 3: Ecosystem Integration
        $this->hooks_manager = $factory->get('hooks_manager');
        $this->gutenberg_manager = $factory->get('gutenberg_manager');
        
        // 🎯 NOWE SERWISY FAZY 6: Enterprise Integration & Analytics
        $this->analytics_engine = $factory->get('analytics_engine');
        $this->integration_manager = $factory->get('integration_manager');
        $this->memory_optimizer = $factory->get('memory_optimizer');
        
        // 🎨 PRESET SYSTEM: Enterprise Preset Management
        $this->preset_manager = $factory->get('preset_manager');
    }
    
    /**
     * Aktywacja wtyczki
     */
    public function activate() {
        $defaults = $this->getDefaultSettings();
        add_option('mas_v2_settings', $defaults);
        
        // Wyczyść cache
        if (method_exists($this, 'clearCache')) {
            $this->clearCache();
        }
    }
    
    /**
     * Deaktywacja wtyczki
     */
    public function deactivate() {
        // Wyczyść cache i transients
        $this->clearCache();
    }
    
    /**
     * Ładowanie tłumaczeń
     */
    public function loadTextdomain() {
        load_plugin_textdomain('modern-admin-styler-v2', false, dirname(plugin_basename(__FILE__)) . '/languages');
    }
    
    /**
     * 🎯 FAZA 1: Natywna integracja z menu WordPress
     * Nowa architektura: Customizer + Settings API + REST API
     */
    public function addAdminMenu() {
        // Główna pozycja w menu
        add_menu_page(
            __('Modern Admin Styler - General', 'modern-admin-styler-v2'), // Tytuł strony
            __('Modern Admin', 'modern-admin-styler-v2'), // Tytuł w menu
            'manage_options',
            'mas-v2-general', // Slug strony głównej
            [$this, 'renderAdminPage'], // Funkcja renderująca
            'data:image/svg+xml;base64,' . base64_encode('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/></svg>'),
            30
        );

        // Podstrona "General" (powiązana z główną)
        add_submenu_page(
            'mas-v2-general', // Slug rodzica
            __('General Settings', 'modern-admin-styler-v2'),
            __('General', 'modern-admin-styler-v2'),
            'manage_options',
            'mas-v2-general', // Ten sam slug co rodzic
            [$this, 'renderAdminPage']
        );

        // Podstrona "Admin Bar"
        add_submenu_page(
            'mas-v2-general',
            __('Admin Bar Settings', 'modern-admin-styler-v2'),
            __('Admin Bar', 'modern-admin-styler-v2'),
            'manage_options',
            'mas-v2-admin-bar', // Nowy, unikalny slug
            [$this, 'renderAdminPage']
        );

        // Podstrona "Menu"
        add_submenu_page(
            'mas-v2-general',
            __('Menu Settings', 'modern-admin-styler-v2'),
            __('Menu', 'modern-admin-styler-v2'),
            'manage_options',
            'mas-v2-menu',
            [$this, 'renderAdminPage']
        );

        // Podstrona "Typography"
        add_submenu_page(
            'mas-v2-general',
            __('Typography Settings', 'modern-admin-styler-v2'),
            __('Typography', 'modern-admin-styler-v2'),
            'manage_options',
            'mas-v2-typography',
            [$this, 'renderAdminPage']
        );

        // Podstrona "Advanced"
        add_submenu_page(
            'mas-v2-general',
            __('Advanced Settings', 'modern-admin-styler-v2'),
            __('Advanced', 'modern-admin-styler-v2'),
            'manage_options',
            'mas-v2-advanced',
            [$this, 'renderAdminPage']
        );

        // 🚀 FAZA 1: Demo page pokazująca nową architekturę
        add_submenu_page(
            'mas-v2-general',
            __('🚀 Faza 1 Demo - WordPress API Integration', 'modern-admin-styler-v2'),
            __('🚀 Faza 1 Demo', 'modern-admin-styler-v2'),
            'manage_options',
            'mas-v2-phase1-demo',
            [$this, 'renderPhase1Demo']
        );

        // 🎨 FAZA 2: Demo page pokazująca WordPress komponenty
        add_submenu_page(
            'mas-v2-general',
            __('🎨 Faza 2 Demo - WordPress Components', 'modern-admin-styler-v2'),
            __('🎨 Faza 2 Demo', 'modern-admin-styler-v2'),
            'manage_options',
            'mas-v2-phase2-demo',
            [$this, 'renderPhase2Demo']
        );
        
        // 🔗 FAZA 3: Demo page pokazująca Ecosystem Integration
        add_submenu_page(
            'mas-v2-general',
            __('🔗 Faza 3 Demo - Ecosystem Integration', 'modern-admin-styler-v2'),
            __('🔗 Faza 3 Demo', 'modern-admin-styler-v2'),
            'manage_options',
            'mas-v2-phase3-demo',
            [$this, 'renderPhase3Demo']
        );
        
        // 🚀 FAZA 4: Demo page pokazująca Data-Driven Architecture & Security
        add_submenu_page(
            'mas-v2-general',
            __('🚀 Faza 4 Demo - Data-Driven Architecture & Security', 'modern-admin-styler-v2'),
            __('🚀 Faza 4 Demo', 'modern-admin-styler-v2'),
            'manage_options',
            'mas-v2-phase4-demo',
            [$this, 'renderPhase4Demo']
        );
        
        // 🚀 FAZA 5: Demo page pokazująca Advanced Performance & UX
        add_submenu_page(
            'mas-v2-general',
            __('🚀 Faza 5 Demo - Advanced Performance & UX', 'modern-admin-styler-v2'),
            __('🚀 Faza 5 Demo', 'modern-admin-styler-v2'),
            'manage_options',
            'mas-v2-phase5-demo',
            [$this, 'renderPhase5Demo']
        );
        
        // 🎯 FAZA 6: Enterprise Dashboard
        add_submenu_page(
            'mas-v2-general',
            __('🎯 Enterprise Dashboard - Analytics & Security', 'modern-admin-styler-v2'),
            __('🎯 Enterprise Dashboard', 'modern-admin-styler-v2'),
            'manage_options',
            'mas-v2-enterprise-dashboard',
            [$this, 'renderEnterpriseDashboard']
        );
        
        // 🎨 PRESET SYSTEM: Style Presets Management
        add_submenu_page(
            'mas-v2-general',
            __('🎨 Style Presets - Save & Load Configurations', 'modern-admin-styler-v2'),
            __('🎨 Style Presets', 'modern-admin-styler-v2'),
            'manage_options',
            'mas-v2-presets',
            [$this, 'renderPresetsPage']
        );
    }
    
    /*
     * ❌ CUSTOMIZER METHODS REMOVED - STRATEGIC CONSOLIDATION
     * 
     * These methods have been completely removed as part of the strategic decision
     * to consolidate all visual editing into a single, superior "Live Edit Mode" interface.
     * 
     * Previous functionality:
     * - registerCustomizerSettings($wp_customize) - Registered options in WordPress Customizer
     * - enqueueCustomizerPreviewAssets() - Loaded preview assets for Customizer
     * 
     * Why removed:
     * - Eliminated user confusion about multiple editing interfaces
     * - Reduced codebase complexity and maintenance overhead
     * - Focused development effort on the superior Live Edit Mode
     * - Provides consistent, context-aware editing experience
     * 
     * New approach: All visual editing is now handled through the Live Edit Mode toggle
     * in the main admin interface, providing real-time visual feedback without the need
     * for a separate Customizer interface.
     */
    
    /**
     * 🎯 Ładuje zasoby CSS/JS na stronach ustawień wtyczki
     */
    public function enqueueAssets($hook) {
        // 🚀 Deleguj ładowanie zasobów do AssetLoader serwisu
        $this->asset_loader->enqueueAdminAssets($hook);
        
        // Dodaj lokalizację AJAX tylko dla naszych stron
        $mas_pages = [
            'toplevel_page_mas-v2-general',
            'modern-admin_page_mas-v2-general',
            'modern-admin_page_mas-v2-admin-bar',
            'modern-admin_page_mas-v2-menu',
            'modern-admin_page_mas-v2-typography',
            'modern-admin_page_mas-v2-advanced'
        ];
        
        if (in_array($hook, $mas_pages)) {
            // Localize script - używamy tego samego obiektu co poprzednio
        wp_localize_script('mas-v2-admin', 'masV2', [
            'ajaxUrl' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('mas_v2_nonce'),
            'settings' => $this->getSettings(),
            'strings' => [
                'saving' => __('Zapisywanie...', 'modern-admin-styler-v2'),
                'saved' => __('Ustawienia zostały zapisane!', 'modern-admin-styler-v2'),
                'error' => __('Wystąpił błąd podczas zapisywania', 'modern-admin-styler-v2'),
                'confirm_reset' => __('Czy na pewno chcesz przywrócić domyślne ustawienia?', 'modern-admin-styler-v2'),
                'resetting' => __('Resetowanie...', 'modern-admin-styler-v2'),
                'reset_success' => __('Ustawienia zostały przywrócone!', 'modern-admin-styler-v2'),
            ]
        ]);
        }
    }
    
    /**
     * 🌐 Ładuje globalne zasoby na wszystkich stronach wp-admin
     */
    public function enqueueGlobalAssets($hook) {
        // Sprawdź, czy jesteśmy na stronie ustawień wtyczki. Jeśli tak, nie ładuj globalnych stylów,
        // ponieważ zostaną one załadowane przez enqueueAssets() z innymi zależnościami.
        $mas_pages = [
            'toplevel_page_mas-v2-general',
            'modern-admin_page_mas-v2-general',
            'modern-admin_page_mas-v2-admin-bar',
            'modern-admin_page_mas-v2-menu',
            'modern-admin_page_mas-v2-typography',
            'modern-admin_page_mas-v2-advanced',
        ];
        if (in_array($hook, $mas_pages)) {
            return;
        }
        
        // 🚀 Deleguj ładowanie globalnych zasobów do AssetLoader serwisu
        $this->asset_loader->enqueueGlobalAssets($hook);
        
        // Dodaj wczesne zabezpieczenia przeciwko animacjom
        add_action('admin_head', [$this->asset_loader, 'addEarlyLoadingProtection'], 1);
        
        // Dodaj globalne ustawienia JS tylko jeśli zasoby zostały załadowane
        if (!$this->isLoginPage() && is_admin()) {
            $mas_pages = [
                'toplevel_page_mas-v2-general',
                'modern-admin_page_mas-v2-general',
                'modern-admin_page_mas-v2-admin-bar',
                'modern-admin_page_mas-v2-menu',
                'modern-admin_page_mas-v2-typography',
                'modern-admin_page_mas-v2-advanced'
            ];
            
            if (!in_array($hook, $mas_pages)) {
        // Debug: Sprawdź ustawienia przed przekazaniem do JS
        $settings = $this->getSettings();
        error_log('🔍 MAS V2 PHP Debug - Settings being passed to JS: ' . print_r($settings, true));
        error_log('🔍 MAS V2 PHP Debug - admin_bar_floating value: ' . ($settings['admin_bar_floating'] ?? 'NOT SET'));
        
        // Przekaż ustawienia do globalnego JS (z nonce dla kompatybilności)
        wp_localize_script('mas-v2-global', 'masV2Global', [
            'ajaxUrl' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('mas_v2_nonce'),
            'settings' => $settings
        ]);
            }
        }
    }
    
    /**
     * ⚠️ DEPRECATED: Ta metoda jest teraz w AssetLoader serwisie
     */
    public function addEarlyLoadingProtection() {
        // Deleguj do AssetLoader
        $this->asset_loader->addEarlyLoadingProtection();
    }
    
    /**
     * ⚠️ DEPRECATED: Ta metoda powinna być prywatna w AssetLoader
     */
    private function isLoginPage() {
        return in_array($GLOBALS['pagenow'], ['wp-login.php', 'wp-register.php']);
    }
    
    /**
     * 🎯 INTELIGENTNE RENDEROWANIE: Określa aktywną zakładkę na podstawie URL
     */
    public function renderAdminPage() {
        // Określ aktywną zakładkę na podstawie parametru 'page' w URL
        $current_page_slug = $_GET['page'] ?? 'mas-v2-general';
        $active_tab = str_replace('mas-v2-', '', $current_page_slug);

        // Upewnij się, że mamy poprawną wartość domyślną
        $valid_tabs = ['general', 'admin-bar', 'menu', 'typography', 'advanced']; // 🚧 3d-effects tymczasowo ukryte
        if (!in_array($active_tab, $valid_tabs)) {
        $active_tab = 'general';
        }

        // Pobierz aktualne ustawienia, aby przekazać je do widoku
        $settings = $this->getSettings();
        $tabs = $this->getTabs();
        $plugin_instance = $this;
        
        // Załaduj widok strony
        // Zmienne $settings, $active_tab, $tabs i $plugin_instance będą dostępne w pliku widoku
        require_once MAS_V2_PLUGIN_DIR . 'src/views/admin-page.php';
            }

    /**
     * 🚀 FAZA 1: Renderowanie strony demo pokazującej nową architekturę
     */
    public function renderPhase1Demo() {
        require_once MAS_V2_PLUGIN_DIR . 'src/views/phase1-demo.php';
    }

    /**
     * 🎨 FAZA 2: Renderowanie strony demo pokazującej WordPress komponenty
     */
    public function renderPhase2Demo() {
        // Sprawdź uprawnienia
        if (!current_user_can('manage_options')) {
            wp_die(__('You do not have sufficient permissions to access this page.'));
        }
        
        // Inicjalizuj ComponentAdapter
        $factory = \ModernAdminStyler\Services\ServiceFactory::getInstance();
        $component_adapter = $factory->get('component_adapter');
        $settings_manager = $factory->get('settings_manager');
        
        // Wymuś pełną szerokość i dodaj style dla Phase 2
        echo '<style>
            .wrap { max-width: none; }
            .phase2-container { max-width: 1400px; margin: 0 auto; }
        </style>';
        
        // Załaduj template Phase 2
        require_once MAS_V2_PLUGIN_DIR . 'src/views/admin-page-phase2.php';
    }
    
    /**
     * 🔗 FAZA 3: Renderowanie strony demo pokazującej Ecosystem Integration
     */
    public function renderPhase3Demo() {
        // Sprawdź uprawnienia
        if (!current_user_can('manage_options')) {
            wp_die(__('You do not have sufficient permissions to access this page.'));
        }
        
        // Dodaj style dla Phase 3
        echo '<style>
            .wrap { max-width: none; }
            .mas-admin-page { max-width: 1400px; margin: 0 auto; }
        </style>';
        
        // Załaduj template Phase 3
        require_once MAS_V2_PLUGIN_DIR . 'src/views/admin-page-phase3.php';
    }
    
    /**
     * 🚀 FAZA 4: Renderowanie strony demo pokazującej Data-Driven Architecture & Security
     */
    public function renderPhase4Demo() {
        // Sprawdź uprawnienia
        if (!current_user_can('manage_options')) {
            wp_die(__('You do not have sufficient permissions to access this page.'));
        }
        
        // Dodaj style dla Phase 4
        echo '<style>
            .wrap { max-width: none; }
            .mas-admin-page { max-width: 1400px; margin: 0 auto; }
        </style>';
        
        // Załaduj template Phase 4
        require_once MAS_V2_PLUGIN_DIR . 'src/views/admin-page-phase4-demo.php';
    }
    
    /**
     * 🚀 FAZA 5: Renderowanie strony demo pokazującej Advanced Performance & UX
     */
    public function renderPhase5Demo() {
        // Sprawdź uprawnienia
        if (!current_user_can('manage_options')) {
            wp_die(__('You do not have sufficient permissions to access this page.'));
        }
        
        // Inicjalizuj serwisy
        $this->serviceFactory = \ModernAdminStyler\Services\ServiceFactory::getInstance();
        
        // Dodaj style dla Phase 5
        echo '<style>
            .wrap { max-width: none; }
            .mas-admin-page { max-width: 1400px; margin: 0 auto; }
        </style>';
        
        // Załaduj template Phase 5
        require_once MAS_V2_PLUGIN_DIR . 'src/views/admin-page-phase5-demo.php';
    }
    
    /**
     * 🎯 FAZA 6: Renderowanie Enterprise Dashboard
     */
    public function renderEnterpriseDashboard() {
        // Sprawdź uprawnienia
        if (!current_user_can('manage_options')) {
            wp_die(__('You do not have sufficient permissions to access this page.'));
        }
        
        // Inicjalizuj serwisy
        $this->serviceFactory = \ModernAdminStyler\Services\ServiceFactory::getInstance();
        
        // Dodaj style dla Phase 6
        echo '<style>
            .wrap { max-width: none; }
            .mas-v2-enterprise-dashboard { max-width: none; margin: 0; }
        </style>';
        
        // Załaduj template Phase 6
        require_once MAS_V2_PLUGIN_DIR . 'src/views/admin-page-phase6-dashboard.php';
    }

    /**
     * 🗑️ USUNIĘTE: renderTabPage() - martwy kod zastąpiony przez renderAdminPage()
     * Ta metoda była pozostałością po starym systemie zakładek
     */
    
    /**
     * Legacy: AJAX Zapisywanie ustawień
     */
    // 🗑️ USUNIĘTE: Legacy AJAX methods - przeniesione do AjaxHandler serwisu
    
    /**
     * 🗑️ USUNIĘTE: ajaxLivePreview() - martwy kod
     * Live Preview działa teraz w 100% po stronie klienta (admin-modern.js)
     * Zapytania AJAX przy każdej zmianie były niepotrzebne i spowalniały system
     */
    
    /**
     * Wyjście niestandardowych stylów do admin head
     */
    /**
     * 🎨 Wyprowadza style CSS (używa CSSGenerator z cache)
     */
    public function outputCustomStyles() {
        if ($this->isLoginPage()) {
            return;
        }
        
        $settings = $this->getSettings();
        
        if (empty($settings)) {
            error_log('MAS V2: No settings found');
            return;
        }
        
        // NAPRAWKA KRYTYCZNA: Zamiast całkowicie blokować wtyczkę, sprawdź enable_plugin 
        $plugin_enabled = isset($settings['enable_plugin']) ? $settings['enable_plugin'] : false;  // 🔒 DOMYŚLNIE WYŁĄCZONE
        
        if (!$plugin_enabled) {
            // Jeśli wtyczka wyłączona, zastosuj tylko podstawowe style bezpieczeństwa
            error_log('MAS V2: Plugin disabled by user - applying minimal safe styles');
            
            $minimal_css = ':root { 
                --mas-accent-color: #0073aa; 
                --mas-admin-bar-height: 32px; 
                --mas-menu-width: 160px; 
            }';
            wp_add_inline_style('mas-v2-global', $minimal_css);
            return;
        }
        
        // 🚀 ENTERPRISE OPTIMIZATION: Generate only CSS variables
        // All styling rules are now in static mas-v2-main.css for optimal caching
        $dynamic_css = $this->css_generator->generate($settings);

        // Add minimal dynamic CSS as inline styles (enterprise approach)
        wp_add_inline_style('mas-v2-main', $dynamic_css);

        // NAPRAWKA BEZPIECZEŃSTWA: Dodaj niestandardowy JS w bezpieczny sposób
        if (!empty($settings['custom_js'])) {
            // Double check permissions
            if (current_user_can('manage_options')) {
                $safe_js = $this->security_service->sanitizeInput($settings['custom_js'], 'js');
                if (!empty($safe_js) && strpos($safe_js, '/* Dangerous') !== 0 && strpos($safe_js, '/* JavaScript too large') !== 0) {
                    wp_add_inline_script('mas-v2-global', $safe_js);
                }
            }
        }
        
        // Dodaj JavaScript dla dynamicznego zarządzania klasami body
        $body_classes_js = $this->generateBodyClassesJS($settings);
        if (!empty($body_classes_js)) {
            wp_add_inline_script('mas-v2-global', $body_classes_js);
        }
    }
    
    /**
     * Wyjście stylów do frontend
     */
    public function outputFrontendStyles() {
        if (is_admin() || !is_admin_bar_showing()) {
            return;
        }
        
        $settings = $this->getSettings();
        
        if (empty($settings)) {
            return;
        }
        
        echo "<style id='mas-v2-frontend-styles'>\n";
        echo $this->generateFrontendCSS($settings);
        echo "\n</style>\n";
    }
    
    /**
     * Generuje zmienne CSS dla dynamicznego zarządzania layoutem
     */
    private function generateCSSVariables($settings) {
        $css = ':root {';
        
        // ADAPTIVE COLOR SYSTEM - Enhanced
        $colorScheme = $settings['color_scheme'] ?? 'light';
        
        // Define adaptive color palettes
        $colorPalettes = $this->getAdaptiveColorPalettes();
        $currentPalette = $settings['color_palette'] ?? 'modern';
        
        // Get light and dark variants
        $lightColors = $colorPalettes[$currentPalette]['light'] ?? $colorPalettes['modern-blue']['light'];
        $darkColors = $colorPalettes[$currentPalette]['dark'] ?? $colorPalettes['modern-blue']['dark'];
        
        // Apply colors based on scheme
        if ($colorScheme === 'light') {
            $activeColors = $lightColors;
        } elseif ($colorScheme === 'dark') {
            $activeColors = $darkColors;
        } else {
            // Auto mode - use light as default, dark will be handled by @media
            $activeColors = $lightColors;
        }
        
        // Generate adaptive color variables
        $css .= "--mas-primary: {$activeColors['primary']};";
        $css .= "--mas-secondary: {$activeColors['secondary']};";
        $css .= "--mas-accent: {$activeColors['accent']};";
        $css .= "--mas-background: {$activeColors['background']};";
        $css .= "--mas-surface: {$activeColors['surface']};";
        $css .= "--mas-text: {$activeColors['text']};";
        $css .= "--mas-text-secondary: {$activeColors['text_secondary']};";
        $css .= "--mas-border: {$activeColors['border']};";
        
        // Glass morphism variables
        $css .= "--mas-glass-primary: " . $this->hexToRgba($activeColors['surface'], 0.85) . ";";
        $css .= "--mas-glass-secondary: " . $this->hexToRgba($activeColors['surface'], 0.6) . ";";
        $css .= "--mas-glass-border: " . $this->hexToRgba($activeColors['text'], 0.2) . ";";
        
        // Accent gradients
        $css .= "--mas-accent-start: {$activeColors['primary']};";
        $css .= "--mas-accent-end: {$activeColors['secondary']};";
        $css .= "--mas-accent-glow: " . $this->hexToRgba($activeColors['primary'], 0.6) . ";";
        
        // Menu width - normalne i collapsed
        $menuWidth = isset($settings['menu_width']) ? $settings['menu_width'] : 160;
        $css .= "--mas-menu-width: {$menuWidth}px;";
        $css .= "--mas-menu-width-collapsed: 36px;";
        
        // Admin bar height
        $adminBarHeight = isset($settings['admin_bar_height']) ? $settings['admin_bar_height'] : 32;
        $css .= "--mas-admin-bar-height: {$adminBarHeight}px;";
        
        // Menu margin (dla floating) - unified naming
        $marginType = $settings['menu_margin_type'] ?? 'all';
        if ($marginType === 'all') {
            $marginAll = $settings['menu_margin_all'] ?? $settings['menu_margin'] ?? 20;
            $css .= "--mas-menu-margin-top: {$marginAll}px;";
            $css .= "--mas-menu-margin-right: {$marginAll}px;";
            $css .= "--mas-menu-margin-bottom: {$marginAll}px;";
            $css .= "--mas-menu-margin-left: {$marginAll}px;";
        } else {
            $marginTop = $settings['menu_margin_top'] ?? 20;
            $marginRight = $settings['menu_margin_right'] ?? 20;
            $marginBottom = $settings['menu_margin_bottom'] ?? 20;
            $marginLeft = $settings['menu_margin_left'] ?? 20;
            $css .= "--mas-menu-margin-top: {$marginTop}px;";
            $css .= "--mas-menu-margin-right: {$marginRight}px;";
            $css .= "--mas-menu-margin-bottom: {$marginBottom}px;";
            $css .= "--mas-menu-margin-left: {$marginLeft}px;";
        }
        
        // Fallback dla kompatybilności
        $oldMargin = $settings['menu_margin'] ?? 20;
        $css .= "--mas-menu-margin: {$oldMargin}px;";
        
        // Admin bar margin (dla floating) - nowe ustawienia
        $adminBarMarginType = $settings['admin_bar_margin_type'] ?? 'all';
        if ($adminBarMarginType === 'all') {
            $adminBarMargin = $settings['admin_bar_margin'] ?? 10;
            $css .= "--mas-admin-bar-margin-top: {$adminBarMargin}px;";
            $css .= "--mas-admin-bar-margin-right: {$adminBarMargin}px;";
            $css .= "--mas-admin-bar-margin-bottom: {$adminBarMargin}px;";
            $css .= "--mas-admin-bar-margin-left: {$adminBarMargin}px;";
        } else {
            $adminBarMarginTop = $settings['admin_bar_margin_top'] ?? 10;
            $adminBarMarginRight = $settings['admin_bar_margin_right'] ?? 10;
            $adminBarMarginBottom = $settings['admin_bar_margin_bottom'] ?? 10;
            $adminBarMarginLeft = $settings['admin_bar_margin_left'] ?? 10;
            $css .= "--mas-admin-bar-margin-top: {$adminBarMarginTop}px;";
            $css .= "--mas-admin-bar-margin-right: {$adminBarMarginRight}px;";
            $css .= "--mas-admin-bar-margin-bottom: {$adminBarMarginBottom}px;";
            $css .= "--mas-admin-bar-margin-left: {$adminBarMarginLeft}px;";
        }
        
        // Backward compatibility dla admin bar margin
        $oldAdminBarMargin = isset($settings['admin_bar_detached_margin']) ? $settings['admin_bar_detached_margin'] : 10;
        $css .= "--mas-admin-bar-margin: {$oldAdminBarMargin}px;";
        
        // Border radius variables (nowe opcje)
        $menuBorderRadius = $settings['menu_border_radius_all'] ?? 0;
        $css .= "--mas-menu-border-radius: {$menuBorderRadius}px;";
        
        $adminBarBorderRadius = $settings['admin_bar_border_radius'] ?? 0;
        $css .= "--mas-admin-bar-border-radius: {$adminBarBorderRadius}px;";
        
        // Menu margin variables (nowe opcje)
        $menuMarginType = $settings['menu_margin_type'] ?? 'all';
        if ($menuMarginType === 'all') {
            $menuMargin = $settings['menu_margin'] ?? 10;
            $css .= "--mas-menu-floating-margin-top: {$menuMargin}px;";
            $css .= "--mas-menu-floating-margin-right: {$menuMargin}px;";
            $css .= "--mas-menu-floating-margin-bottom: {$menuMargin}px;";
            $css .= "--mas-menu-floating-margin-left: {$menuMargin}px;";
        } else {
            $menuMarginTop = $settings['menu_margin_top'] ?? 10;
            $menuMarginRight = $settings['menu_margin_right'] ?? 10;
            $menuMarginBottom = $settings['menu_margin_bottom'] ?? 10;
            $menuMarginLeft = $settings['menu_margin_left'] ?? 10;
            $css .= "--mas-menu-floating-margin-top: {$menuMarginTop}px;";
            $css .= "--mas-menu-floating-margin-right: {$menuMarginRight}px;";
            $css .= "--mas-menu-floating-margin-bottom: {$menuMarginBottom}px;";
            $css .= "--mas-menu-floating-margin-left: {$menuMarginLeft}px;";
        }

        // Admin Bar variables for Live Preview
        $adminBarTextColor = $settings['admin_bar_text_color'] ?? '#ffffff';
        $adminBarHoverColor = $settings['admin_bar_hover_color'] ?? '#46a6d8';
        $adminBarFontSize = $settings['admin_bar_font_size'] ?? 13;
        $adminBarPadding = $settings['admin_bar_padding'] ?? 8;
        $adminBarBorderRadiusAll = $settings['admin_bar_border_radius'] ?? 0;
        
        $css .= "--mas-admin-bar-text-color: {$adminBarTextColor};";
        $css .= "--mas-admin-bar-hover-color: {$adminBarHoverColor};";
        $css .= "--mas-admin-bar-font-size: {$adminBarFontSize}px;";
        $css .= "--mas-admin-bar-padding: {$adminBarPadding}px;";
        $css .= "--mas-admin-bar-border-radius-all: {$adminBarBorderRadiusAll}px;";

        // Menu variables for Live Preview
        $menuTextColor = $settings['menu_text_color'] ?? $activeColors['text'];
        $menuHoverColor = $settings['menu_hover_color'] ?? $activeColors['primary'];
        $menuActiveBackground = $settings['menu_active_background'] ?? $activeColors['accent'];
        $menuActiveTextColor = $settings['menu_active_text_color'] ?? '#ffffff';
        $menuItemHeight = $settings['menu_item_height'] ?? 34;
        $menuBorderRadiusAll = $settings['menu_border_radius_all'] ?? 0;
        
        $css .= "--mas-menu-text-color: {$menuTextColor};";
        $css .= "--mas-menu-hover-color: {$menuHoverColor};";
        $css .= "--mas-menu-active-background: {$menuActiveBackground};";
        $css .= "--mas-menu-active-text-color: {$menuActiveTextColor};";
        $css .= "--mas-menu-item-height: {$menuItemHeight}px;";
        $css .= "--mas-menu-border-radius-all: {$menuBorderRadiusAll}px;";

        // Dodaj zmienną dla tła menu
        $menuBackground = isset($settings['menu_background']) ? $settings['menu_background'] : $activeColors['surface'];
        $css .= "--mas-menu-background: {$menuBackground};";
        
        $css .= '}';
        
        // Add auto dark mode support
        if ($colorScheme === 'auto') {
            $css .= '@media (prefers-color-scheme: dark) {';
            $css .= ':root {';
            $css .= "--mas-primary: {$darkColors['primary']};";
            $css .= "--mas-secondary: {$darkColors['secondary']};";
            $css .= "--mas-accent: {$darkColors['accent']};";
            $css .= "--mas-background: {$darkColors['background']};";
            $css .= "--mas-surface: {$darkColors['surface']};";
            $css .= "--mas-text: {$darkColors['text']};";
            $css .= "--mas-text-secondary: {$darkColors['text_secondary']};";
            $css .= "--mas-border: {$darkColors['border']};";
            $css .= "--mas-glass-primary: " . $this->hexToRgba($darkColors['surface'], 0.85) . ";";
            $css .= "--mas-glass-secondary: " . $this->hexToRgba($darkColors['surface'], 0.6) . ";";
            $css .= "--mas-glass-border: " . $this->hexToRgba($darkColors['text'], 0.2) . ";";
            $css .= "--mas-accent-start: {$darkColors['primary']};";
            $css .= "--mas-accent-end: {$darkColors['secondary']};";
            $css .= "--mas-accent-glow: " . $this->hexToRgba($darkColors['primary'], 0.6) . ";";
            $css .= '}';
            $css .= '}';
        }
        
        // Manual dark mode override
        $css .= 'body.mas-dark-mode {';
        $css .= "--mas-primary: {$darkColors['primary']};";
        $css .= "--mas-secondary: {$darkColors['secondary']};";
        $css .= "--mas-accent: {$darkColors['accent']};";
        $css .= "--mas-background: {$darkColors['background']};";
        $css .= "--mas-surface: {$darkColors['surface']};";
        $css .= "--mas-text: {$darkColors['text']};";
        $css .= "--mas-text-secondary: {$darkColors['text_secondary']};";
        $css .= "--mas-border: {$darkColors['border']};";
        $css .= "--mas-glass-primary: " . $this->hexToRgba($darkColors['surface'], 0.85) . ";";
        $css .= "--mas-glass-secondary: " . $this->hexToRgba($darkColors['surface'], 0.6) . ";";
        $css .= "--mas-glass-border: " . $this->hexToRgba($darkColors['text'], 0.2) . ";";
        $css .= "--mas-accent-start: {$darkColors['primary']};";
        $css .= "--mas-accent-end: {$darkColors['secondary']};";
        $css .= "--mas-accent-glow: " . $this->hexToRgba($darkColors['primary'], 0.6) . ";";
        $css .= '}';
        
        return $css;
    }
    
    /**
     * Define adaptive color palettes for light/dark modes
     */
    private function getAdaptiveColorPalettes() {
        return [
            'modern-blue' => [
                'light' => [
                    'primary' => '#4A90E2',
                    'secondary' => '#7BB3F0',
                    'accent' => '#0073aa',
                    'background' => '#f8fafc',
                    'surface' => '#ffffff',
                    'text' => '#1e293b',
                    'text_secondary' => '#64748b',
                    'border' => '#e2e8f0'
                ],
                'dark' => [
                    'primary' => '#60A5FA',
                    'secondary' => '#93C5FD',
                    'accent' => '#3B82F6',
                    'background' => '#0f172a',
                    'surface' => '#1e293b',
                    'text' => '#f1f5f9',
                    'text_secondary' => '#cbd5e1',
                    'border' => '#334155'
                ]
            ],
            'modern' => [
                'light' => [
                    'primary' => '#667eea',
                    'secondary' => '#764ba2',
                    'accent' => '#f093fb',
                    'background' => '#fafafa',
                    'surface' => '#ffffff',
                    'text' => '#1f2937',
                    'text_secondary' => '#6b7280',
                    'border' => '#e5e7eb'
                ],
                'dark' => [
                    'primary' => '#667eea',
                    'secondary' => '#764ba2',
                    'accent' => '#f093fb',
                    'background' => '#0f0f0f',
                    'surface' => '#1a1a1a',
                    'text' => '#ffffff',
                    'text_secondary' => '#a0a0a0',
                    'border' => '#333333'
                ]
            ],
            'white' => [
                'light' => [
                    'primary' => '#1f2937',
                    'secondary' => '#374151',
                    'accent' => '#059669',
                    'background' => '#ffffff',
                    'surface' => '#f8fafc',
                    'text' => '#111827',
                    'text_secondary' => '#6b7280',
                    'border' => '#e5e7eb'
                ],
                'dark' => [
                    'primary' => '#f8fafc',
                    'secondary' => '#e2e8f0',
                    'accent' => '#10b981',
                    'background' => '#1f2937',
                    'surface' => '#374151',
                    'text' => '#f9fafb',
                    'text_secondary' => '#d1d5db',
                    'border' => '#4b5563'
                ]
            ],
            'green' => [
                'light' => [
                    'primary' => '#10b981',
                    'secondary' => '#34d399',
                    'accent' => '#059669',
                    'background' => '#f0fdf4',
                    'surface' => '#ecfdf5',
                    'text' => '#064e3b',
                    'text_secondary' => '#065f46',
                    'border' => '#a7f3d0'
                ],
                'dark' => [
                    'primary' => '#34d399',
                    'secondary' => '#6ee7b7',
                    'accent' => '#10b981',
                    'background' => '#064e3b',
                    'surface' => '#065f46',
                    'text' => '#f0fdf4',
                    'text_secondary' => '#bbf7d0',
                    'border' => '#059669'
                ]
            ]
        ];
    }

    /**
     * Convert hex color to rgba
     */
    private function hexToRgba($hex, $alpha = 1) {
        $hex = ltrim($hex, '#');
        
        if (strlen($hex) === 3) {
            $hex = str_repeat(substr($hex,0,1), 2).str_repeat(substr($hex,1,1), 2).str_repeat(substr($hex,2,1), 2);
        }
        
        $r = hexdec(substr($hex, 0, 2));
        $g = hexdec(substr($hex, 2, 2));
        $b = hexdec(substr($hex, 4, 2));
        
        return "rgba($r, $g, $b, $alpha)";
    }
    
    /**
     * Adjust color brightness for scrollbar gradients
     */
    private function adjustColorBrightness($hex, $percent) {
        // Remove # if present
        $hex = ltrim($hex, '#');
        
        // Handle CSS variables - return as is since we can't calculate
        if (strpos($hex, 'var(') === 0) {
            return $hex;
        }
        
        // Convert shorthand hex to full
        if (strlen($hex) === 3) {
            $hex = str_repeat(substr($hex,0,1), 2).str_repeat(substr($hex,1,1), 2).str_repeat(substr($hex,2,1), 2);
        }
        
        // Convert hex to RGB
        $r = hexdec(substr($hex, 0, 2));
        $g = hexdec(substr($hex, 2, 2));
        $b = hexdec(substr($hex, 4, 2));
        
        // Adjust brightness
        $r = max(0, min(255, $r + ($r * $percent / 100)));
        $g = max(0, min(255, $g + ($g * $percent / 100)));
        $b = max(0, min(255, $b + ($b * $percent / 100)));
        
        // Convert back to hex
        $r = str_pad(dechex(round($r)), 2, '0', STR_PAD_LEFT);
        $g = str_pad(dechex(round($g)), 2, '0', STR_PAD_LEFT);
        $b = str_pad(dechex(round($b)), 2, '0', STR_PAD_LEFT);
        
        return '#' . $r . $g . $b;
    }

    /**
     * Generuje CSS dla strony logowania
     */
    public function outputLoginStyles() {
        $settings = $this->getSettings();
        
        if (!isset($settings['login_page_enabled']) || !$settings['login_page_enabled']) {
            return;
        }
        
        $css = '';
        
        // Login page background
        if (isset($settings['login_bg_color'])) {
            $css .= "body.login { background: {$settings['login_bg_color']} !important; }";
        }
        
        // Login form background
        if (isset($settings['login_form_bg'])) {
            $css .= ".login form { background: {$settings['login_form_bg']} !important; }";
        }
        
        // Login form shadow
        if (isset($settings['login_form_shadow']) && $settings['login_form_shadow']) {
            $css .= ".login form { box-shadow: 0 4px 20px rgba(0,0,0,0.1) !important; }";
        }
        
        // Login form rounded corners
        if (isset($settings['login_form_rounded']) && $settings['login_form_rounded']) {
            $css .= ".login form { border-radius: 8px !important; }";
        }
        
        // Custom logo
        if (!empty($settings['login_custom_logo'])) {
            $css .= ".login h1 a { background-image: url('{$settings['login_custom_logo']}') !important; background-size: contain !important; width: auto !important; height: 80px !important; }";
        }
        
        if (!empty($css)) {
            echo "<style id='mas-v2-login-styles'>\n";
            echo $css;
            echo "\n</style>\n";
        }
    }
    
    /**
     * Modyfikacja tekstu stopki admin
     */
    public function customAdminFooter($text) {
        $settings = $this->getSettings();
        
        if (!empty($settings['custom_admin_footer_text'])) {
            return $settings['custom_admin_footer_text'];
        }
        
        return $text;
    }
    
    /**
     * Dodaje klasy CSS do body admin
     */
    public function addAdminBodyClasses($classes) {
        $settings = $this->getSettings();
        
        if (isset($settings['compact_mode']) && $settings['compact_mode']) {
            $classes .= ' mas-compact-mode';
        }
        
        if (isset($settings['color_scheme'])) {
            $classes .= ' mas-theme-' . $settings['color_scheme'];
        }
        
        // Core menu floating class (unified system)
        if (isset($settings['menu_floating']) && $settings['menu_floating']) {
            $classes .= ' mas-v2-menu-floating'; // Use unified CSS class
            
            if (isset($settings['menu_glassmorphism']) && $settings['menu_glassmorphism']) {
                $classes .= ' mas-v2-menu-glossy';
            }
        }
        
        // Add responsive classes (Phase 6)
        if (!empty($settings['menu_responsive_enabled'])) {
            $classes .= ' mas-responsive-enabled';
        }
        
        // Add positioning classes
        $positionType = $settings['menu_position_type'] ?? 'default';
        if ($positionType !== 'default') {
            $classes .= ' mas-menu-position-' . $positionType;
        }
        
        // Add floating menu classes
        if ($positionType === 'floating') {
            if (!empty($settings['menu_floating_shadow'])) {
                $classes .= ' mas-floating-shadow';
            }
            if (!empty($settings['menu_floating_blur_background'])) {
                $classes .= ' mas-floating-blur';
            }
            if (!empty($settings['menu_floating_auto_hide'])) {
                $classes .= ' mas-floating-auto-hide';
            }
            if (!empty($settings['menu_floating_trigger_hover'])) {
                $classes .= ' mas-floating-trigger-hover';
            }
        }
        
        // Add mobile behavior classes
        if (!empty($settings['menu_responsive_enabled'])) {
            $mobileBehavior = $settings['menu_mobile_behavior'] ?? 'collapse';
            $togglePosition = $settings['menu_mobile_toggle_position'] ?? 'top-left';
            $toggleStyle = $settings['menu_mobile_toggle_style'] ?? 'hamburger';
            $mobileAnimation = $settings['menu_mobile_animation'] ?? 'slide';
            
            $classes .= ' mas-mobile-behavior-' . $mobileBehavior;
            $classes .= ' mas-toggle-' . $togglePosition;
            $classes .= ' mas-toggle-' . $toggleStyle;
            $classes .= ' mas-animation-' . $mobileAnimation;
        }
        
        // Add tablet behavior classes
        $tabletBehavior = $settings['menu_tablet_behavior'] ?? 'auto';
        if ($tabletBehavior === 'mobile') {
            $classes .= ' mas-tablet-behavior-mobile';
        }
        
        if (!empty($settings['menu_tablet_compact'])) {
            $classes .= ' mas-tablet-compact';
        }
        
        // Add feature classes
        if (!empty($settings['menu_touch_friendly'])) {
            $classes .= ' mas-touch-friendly';
        }
        
        if (!empty($settings['menu_swipe_gestures'])) {
            $classes .= ' mas-swipe-enabled';
        }
        
        if (!empty($settings['menu_reduce_animations_mobile'])) {
            $classes .= ' mas-reduce-animations';
        }
        
        if (!empty($settings['menu_optimize_performance'])) {
            $classes .= ' mas-optimize-performance';
        }
        
        return $classes;
    }
    
    /**
     * Pobieranie ustawień
     */
    /**
     * 🔧 Pobiera ustawienia z bazy danych
     */
    public function getSettings() {
        // 🚀 Deleguj do SettingsManager serwisu
        return $this->settings_manager->getSettings();
    }
    
    /**
     * ⚠️ DEPRECATED: Sanityzacja przeniesiona do SettingsManager serwisu
     * Pozostawiona dla kompatybilności wstecznej
     */
    private function sanitizeSettings($input) {
        // Deleguj do SettingsManager serwisu
        return $this->settings_manager->sanitizeSettings($input);
    }
    
    /**
     * Sanityzuje tablice rekurencyjnie
     */
    private function sanitizeArrayRecursive($input_array, $default_array) {
        $sanitized = [];
        
        foreach ($default_array as $key => $default_value) {
            if (!isset($input_array[$key])) {
                $sanitized[$key] = $default_value;
                continue;
            }
            
            $value = $input_array[$key];
            
            if (is_array($default_value)) {
                $sanitized[$key] = $this->sanitizeArrayRecursive($value, $default_value);
            } elseif (is_bool($default_value)) {
                $sanitized[$key] = (bool) $value;
            } elseif (is_int($default_value)) {
                $sanitized[$key] = (int) $value;
            } elseif (strpos($key, 'color') !== false || substr($key, -3) === '_bg' || $key === 'bg' || $key === 'hover_bg') {
                // Sanityzuj kolory, ale pozwól na puste stringi
                if (empty($value)) {
                    $sanitized[$key] = '';
                } else {
                    $color = sanitize_hex_color($value);
                    // Obsługa formatu #ddd
                    if ($color === null && preg_match('/^#[0-9a-fA-F]{3}$/', $value)) {
                        $sanitized[$key] = '#' . substr($value, 1, 1) . substr($value, 1, 1) . 
                                           substr($value, 2, 1) . substr($value, 2, 1) . 
                                           substr($value, 3, 1) . substr($value, 3, 1);
                    } else {
                        $sanitized[$key] = $color ?: '';
                    }
                }
            } else {
                $sanitized[$key] = sanitize_text_field($value);
            }
        }
        
        return $sanitized;
    }
    
    /**
     * NAPRAWKA BEZPIECZEŃSTWA: Ulepszona sanityzacja CSS
     */
    private function sanitizeCustomCSS($css) {
        // Limit rozmiaru (50KB)
        if (strlen($css) > 50000) {
            error_log('MAS V2: CSS too large, truncated');
            return substr($css, 0, 50000) . '/* CSS truncated for security */';
        }
        
        // NAPRAWKA: Więcej comprehensive cleaning
        $dangerous_patterns = [
            '/javascript\s*:/i',
            '/expression\s*\(/i',
            '/behavior\s*:/i',
            '/@import/i',
            '/data\s*:/i',
            '/vbscript\s*:/i',
            '/mocha\s*:/i',
            '/livescript\s*:/i',
            '/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/mi',
            '/url\s*\(\s*[\'"]?javascript:/i',
            '/url\s*\(\s*[\'"]?data:/i'
        ];
        
        foreach ($dangerous_patterns as $pattern) {
            $css = preg_replace($pattern, '', $css);
        }
        
        // Remove any remaining script tags and HTML comments
        $css = preg_replace('/<!--.*?-->/s', '', $css);
        $css = wp_strip_all_tags($css);
        
        return $css;
    }
    
    /**
     * NAPRAWKA BEZPIECZEŃSTWA: Nowa funkcja sanityzacji JS
     */
    private function sanitizeCustomJS($js) {
        // NAPRAWKA: Size limit (30KB)
        if (strlen($js) > 30000) {
            error_log('MAS V2: JS too large, truncated');
            return '/* JavaScript too large and was removed for security */';
        }
        
        // NAPRAWKA: Remove dangerous functions
        $dangerous_functions = [
            'eval(',
            'Function(',
            'setTimeout(',
            'setInterval(',
            'document.write',
            'innerHTML =',
            'outerHTML =',
            'document.cookie',
            'localStorage.',
            'sessionStorage.',
            'window.location'
        ];
        
        foreach ($dangerous_functions as $func) {
            if (stripos($js, $func) !== false) {
                error_log('MAS V2: Dangerous JS function detected: ' . $func);
                return '/* Dangerous JavaScript code detected and removed for security */';
        }
        }
        
        // Additional security - strip HTML tags
        $js = wp_strip_all_tags($js);
        
        return $js;
    }
    
    /**
     * ⚠️ DEPRECATED: Domyślne ustawienia przeniesione do SettingsManager serwisu
     * Pozostawiona dla kompatybilności wstecznej
     */
    private function getDefaultSettings() {
        // Deleguj do SettingsManager serwisu
        return $this->settings_manager->getDefaultSettings();
    }
    
    /**
     * ⚠️ DEPRECATED: Oryginalna metoda domyślnych ustawień
     */
    private function getDefaultSettingsLegacy() {
        return [
            // Ogólne - WYŁĄCZONE
            'enable_plugin' => false,  // 🔒 Główny wyłącznik
            'theme' => 'modern',
            'color_scheme' => 'auto',
            'color_palette' => 'modern',
            'auto_dark_mode' => false,  // WYŁĄCZONE
            'font_family' => 'system',
            'font_size' => 14,
            'enable_animations' => false,  // WYŁĄCZONE
            'animation_type' => 'smooth',
            'live_preview' => false,  // WYŁĄCZONE
            'auto_save' => false,
            'compact_mode' => false,
            'global_border_radius' => 8,
            'enable_shadows' => false,  // WYŁĄCZONE
            'shadow_color' => '#000000',
            'shadow_blur' => 10,
            
            // Admin Bar - WYŁĄCZONE
            'admin_bar_background' => '#23282d',
            'admin_bar_text_color' => '#ffffff',
            'admin_bar_hover_color' => '#00a0d2',
            'admin_bar_height' => 32,
            'admin_bar_font_size' => 13,
            'admin_bar_padding' => 8,
            'admin_bar_border_radius' => 0,
            'admin_bar_shadow' => false,
            'admin_bar_glassmorphism' => false,  // WYŁĄCZONE
            'admin_bar_detached' => false,  // WYŁĄCZONE
            
            // Admin Bar - Nowe opcje floating/glossy - WYŁĄCZONE
            'admin_bar_floating' => false,  // WYŁĄCZONE
            'admin_bar_glossy' => false,  // WYŁĄCZONE
            'admin_bar_border_radius_type' => 'all',
            'admin_bar_radius_tl' => false,
            'admin_bar_radius_tr' => false,
            'admin_bar_radius_bl' => false,
            'admin_bar_radius_br' => false,
            'admin_bar_margin_type' => 'all',
            'admin_bar_margin' => 10,
            'admin_bar_margin_top' => 10,
            'admin_bar_margin_right' => 10,
            'admin_bar_margin_bottom' => 10,
            'admin_bar_margin_left' => 10,
            
            // Ukrywanie elementów paska admin
            'hide_wp_logo' => false,
            'hide_howdy' => false,
            'hide_update_notices' => false,
            
            // Admin Bar Corner Radius
            'admin_bar_corner_radius_type' => 'none',
            'admin_bar_corner_radius_all' => 0,
            'admin_bar_corner_radius_top_left' => 0,
            'admin_bar_corner_radius_top_right' => 0,
            'admin_bar_corner_radius_bottom_right' => 0,
            'admin_bar_corner_radius_bottom_left' => 0,
            
            // Menu
            'menu_background' => '#23282d',
            'menu_text_color' => '#ffffff',
            'menu_hover_background' => '#32373c',
            'menu_hover_text_color' => '#00a0d2',
            'menu_active_background' => '#0073aa',
            'menu_active_text_color' => '#ffffff',
            'menu_width' => 160,
            'menu_item_height' => 34,
            'menu_rounded_corners' => false,
            'menu_shadow' => false,  // WYŁĄCZONE
            'menu_compact_mode' => false,
            'menu_glassmorphism' => false,  // WYŁĄCZONE
            'menu_floating' => false,  // WYŁĄCZONE
            'menu_floating_margin' => 10, // Backward compatibility
            'menu_floating_margin_type' => 'all',
            'menu_floating_margin_all' => 10,
            'menu_floating_margin_top' => 10,
            'menu_floating_margin_right' => 10,
            'menu_floating_margin_bottom' => 10,
            'menu_floating_margin_left' => 10,
            'menu_icons_enabled' => true,
            
            // Menu - Advanced Individual Styling (Phase 2)
            'menu_individual_styling' => false,
            'menu_hover_animation' => 'none', // none, slide, fade, scale, glow
            'menu_hover_duration' => 300,
            'menu_hover_easing' => 'ease-in-out',
            'menu_active_indicator' => 'none', // none, left-border, right-border, full-border, background, glow
            'menu_active_indicator_color' => '#0073aa',
            'menu_active_indicator_width' => 3,
            
            // Menu - Individual Item Spacing (Phase 2)
            'menu_item_spacing' => 2, // Vertical spacing between items (0-20px)
            'menu_item_padding_vertical' => 8, // Internal vertical padding (4-20px)
            'menu_item_padding_horizontal' => 12, // Internal horizontal padding (8-30px)
            
            // Menu - Individual Colors for Elements (Phase 2)
            'menu_individual_colors' => [
                'dashboard' => ['bg' => '', 'text' => '', 'hover_bg' => '', 'hover_text' => ''],
                'posts' => ['bg' => '', 'text' => '', 'hover_bg' => '', 'hover_text' => ''],
                'pages' => ['bg' => '', 'text' => '', 'hover_bg' => '', 'hover_text' => ''],
                'media' => ['bg' => '', 'text' => '', 'hover_bg' => '', 'hover_text' => ''],
                'comments' => ['bg' => '', 'text' => '', 'hover_bg' => '', 'hover_text' => ''],
                'appearance' => ['bg' => '', 'text' => '', 'hover_bg' => '', 'hover_text' => ''],
                'plugins' => ['bg' => '', 'text' => '', 'hover_bg' => '', 'hover_text' => ''],
                'users' => ['bg' => '', 'text' => '', 'hover_bg' => '', 'hover_text' => ''],
                'tools' => ['bg' => '', 'text' => '', 'hover_bg' => '', 'hover_text' => ''],
                'settings' => ['bg' => '', 'text' => '', 'hover_bg' => '', 'hover_text' => '']
            ],
            
            // Menu - Custom Icons System (Phase 2)
            'menu_custom_icons' => false,
            'menu_icon_library' => 'dashicons', // dashicons, fontawesome, custom
            'menu_individual_icons' => [
                'dashboard' => '',
                'posts' => '',
                'pages' => '',
                'media' => '',
                'comments' => '',
                'appearance' => '',
                'plugins' => '',
                'users' => '',
                'tools' => '',
                                 'settings' => ''
             ],
             
             // Menu - Submenu Control and Animations (Phase 3)
             'submenu_animation' => 'slide', // slide, fade, accordion, none
             'submenu_animation_duration' => 300,
             'submenu_indicator_style' => 'arrow', // arrow, plus, chevron, none
             'submenu_indicator_position' => 'right', // left, right
             'submenu_indicator_color' => '',
             'submenu_background' => '',
             'submenu_text_color' => '',
             'submenu_hover_background' => '',
             'submenu_hover_text_color' => '',
             'submenu_border_left' => true,
             'submenu_border_color' => '',
             'submenu_indent' => 20,
             'submenu_separator' => false,
             'submenu_separator_color' => '',
             'submenu_item_spacing' => 1,
             'submenu_item_padding' => 8,
             
             // Menu - Scrollbar Customization (Phase 4)
             'menu_scrollbar_enabled' => false,
             'menu_scrollbar_width' => 8, // 4-16px
             'menu_scrollbar_track_color' => '',
             'menu_scrollbar_thumb_color' => '',
             'menu_scrollbar_thumb_hover_color' => '',
             'menu_scrollbar_corner_radius' => 4, // 0-8px
             'menu_scrollbar_track_radius' => 4,
             'menu_scrollbar_auto_hide' => true,
             'menu_scrollbar_style' => 'modern', // modern, minimal, classic
             'submenu_scrollbar_enabled' => false,
             'submenu_scrollbar_width' => 6,
             'submenu_scrollbar_track_color' => '',
             'submenu_scrollbar_thumb_color' => '',
             'submenu_scrollbar_thumb_hover_color' => '',
             'submenu_scrollbar_style' => 'minimal',
             
             // Menu - Search and Custom Blocks (Phase 5)
             'menu_search_enabled' => false,
             'menu_search_position' => 'top', // top, bottom, custom
             'menu_search_placeholder' => '',
             'menu_search_style' => 'modern', // modern, minimal, compact
             'menu_search_background' => '',
             'menu_search_text_color' => '',
             'menu_search_border_color' => '',
             'menu_search_focus_color' => '',
             'menu_search_icon_color' => '',
             'menu_search_animation' => true,
             'menu_search_live_filter' => true,
             'menu_search_highlight_matches' => true,
             'menu_search_hotkey' => 'ctrl+k',
             
             // Custom HTML blocks in menu
             'menu_custom_blocks_enabled' => false,
             'menu_custom_blocks' => [
                 'block_1' => [
                     'enabled' => false,
                     'position' => 'top', // top, bottom, before_item, after_item
                     'target_item' => '', // For before/after positioning
                     'content' => '',
                     'style' => 'default', // default, card, minimal, highlight
                     'background' => '',
                     'text_color' => '',
                     'border_color' => '',
                     'padding' => 'medium', // small, medium, large
                     'margin' => 'medium',
                     'border_radius' => 6,
                     'show_for_roles' => ['all'], // all, admin, editor, etc.
                     'show_on_pages' => ['all'], // all, dashboard, posts, etc.
                     'animation' => 'fade' // none, fade, slide, bounce
                 ],
                 'block_2' => [
                     'enabled' => false,
                     'position' => 'bottom',
                     'target_item' => '',
                     'content' => '',
                     'style' => 'default',
                     'background' => '',
                     'text_color' => '',
                     'border_color' => '',
                     'padding' => 'medium',
                     'margin' => 'medium',
                     'border_radius' => 6,
                     'show_for_roles' => ['all'],
                     'show_on_pages' => ['all'],
                     'animation' => 'fade'
                 ],
                 'block_3' => [
                     'enabled' => false,
                     'position' => 'top',
                     'target_item' => '',
                     'content' => '',
                     'style' => 'highlight',
                     'background' => '',
                     'text_color' => '',
                     'border_color' => '',
                     'padding' => 'medium',
                     'margin' => 'medium',
                     'border_radius' => 6,
                     'show_for_roles' => ['all'],
                     'show_on_pages' => ['all'],
                     'animation' => 'slide'
                 ]
             ],
             
             // Menu - Responsive & Positioning (Phase 6)
             'menu_responsive_enabled' => true,
             'menu_mobile_breakpoint' => 768, // px
             'menu_tablet_breakpoint' => 1024, // px
             
             // Mobile menu behavior
             'menu_mobile_behavior' => 'collapse', // collapse, overlay, slide-out, bottom-bar
             'menu_mobile_toggle_position' => 'top-left', // top-left, top-right, bottom-left, bottom-right
             'menu_mobile_toggle_style' => 'hamburger', // hamburger, dots, text, icon
             'menu_mobile_toggle_color' => '',
             'menu_mobile_overlay_color' => 'rgba(0,0,0,0.8)',
             'menu_mobile_animation' => 'slide', // slide, fade, scale, none
             
             // Tablet adjustments
             'menu_tablet_width' => 200, // Reduced width on tablets
             'menu_tablet_compact' => true, // Compact spacing on tablets
             'menu_tablet_behavior' => 'auto', // auto, desktop, mobile
             
             // Menu positioning
             'menu_position_type' => 'default', // default, fixed, sticky, floating
             'menu_position_top' => 32, // Distance from top (when fixed/sticky)
             'menu_position_left' => 0, // Distance from left (when floating)
             'menu_position_z_index' => 1000, // Z-index for positioning
             
             // Floating menu specific
             'menu_floating_shadow' => true,
             'menu_floating_blur_background' => true,
             'menu_floating_auto_hide' => false, // Auto-hide when not in use
             'menu_floating_trigger_hover' => false, // Show on hover only
             
             // Responsive visibility
             'menu_hide_mobile' => false, // Hide menu completely on mobile
             'menu_hide_tablet' => false, // Hide menu completely on tablet
             'menu_hide_items_mobile' => [], // Array of menu items to hide on mobile
             'menu_hide_items_tablet' => [], // Array of menu items to hide on tablet
             
             // Mobile menu customization
             'menu_mobile_width' => '100%', // Full width or custom
             'menu_mobile_height' => 'auto', // auto, viewport, custom
             'menu_mobile_background' => '',
             'menu_mobile_text_color' => '',
             'menu_mobile_border_radius' => 0,
             'menu_mobile_padding' => 'normal', // compact, normal, spacious
             
             // Touch interactions
             'menu_touch_friendly' => true, // Larger touch targets
             'menu_swipe_gestures' => true, // Swipe to open/close
             'menu_touch_animation_speed' => 250, // Touch interaction speed
             
             // Performance optimizations
             'menu_lazy_load_mobile' => true, // Lazy load menu items on mobile
             'menu_reduce_animations_mobile' => true, // Reduce animations on mobile
             'menu_optimize_performance' => true, // General mobile optimizations
             
             // Menu - Premium Features (Phase 7)
             'menu_premium_enabled' => false,
             
             // Template System
             'menu_template_system' => true,
             'menu_active_template' => 'default',
             'menu_custom_templates' => [], // Array of custom templates
             'menu_template_auto_save' => true,
             'menu_template_backup' => true,
             
             // Conditional Display
             'menu_conditional_display' => false,
             'menu_user_role_restrictions' => [], // Array of role-based visibility
             'menu_page_specific_styling' => [], // Array of page-specific styles
             'menu_time_based_display' => false,
             'menu_device_specific_display' => [], // Array of device-specific rules
             
             // Advanced Analytics
             'menu_analytics_enabled' => false,
             'menu_track_clicks' => false,
             'menu_track_hover_time' => false,
             'menu_usage_statistics' => false,
             'menu_performance_monitoring' => false,
             
             // Import/Export System
             'menu_backup_enabled' => true,
             'menu_auto_backup' => false,
             'menu_backup_frequency' => 'weekly', // daily, weekly, monthly
             'menu_cloud_sync' => false,
             'menu_export_format' => 'json', // json, xml, css
             
             // Multi-site Support
             'menu_multisite_sync' => false,
             'menu_network_templates' => false,
             'menu_site_specific_overrides' => true,
             
             // White Label
             'menu_white_label' => false,
             'menu_custom_branding' => false,
             'menu_hide_plugin_info' => false,
             'menu_custom_admin_footer' => '',
             
             // Advanced Scheduling
             'menu_scheduled_changes' => false,
             'menu_maintenance_mode' => false,
             'menu_ab_testing' => false,
             'menu_rollback_system' => true,
             
             // Custom CSS/JS Injection
             'menu_custom_css_enabled' => false,
             'menu_custom_css_code' => '',
             'menu_custom_js_enabled' => false,
             'menu_custom_js_code' => '',
             'menu_css_minification' => true,
             'menu_js_minification' => true,
             
             // Performance Monitoring
             'menu_performance_alerts' => false,
             'menu_load_time_monitoring' => false,
             'menu_memory_usage_tracking' => false,
             'menu_error_logging' => true,
             
             // Advanced Security
             'menu_security_scanning' => false,
             'menu_access_logging' => false,
             'menu_ip_restrictions' => [],
             'menu_rate_limiting' => false,
             
             // API Integration
             'menu_api_enabled' => false,
             'menu_webhook_support' => false,
             'menu_external_integrations' => [],
             'menu_rest_api_endpoints' => true,
              
              // Menu - Nowe opcje floating/glossy
            'menu_floating' => true,
            'menu_glossy' => true,
            'menu_border_radius_type' => 'all',
            'menu_border_radius_all' => 0,
            'menu_radius_tl' => false,
            'menu_radius_tr' => false,
            'menu_radius_bl' => false,
            'menu_radius_br' => false,
            'menu_margin_type' => 'all',
            'menu_margin' => 10,
            'menu_margin_top' => 10,
            'menu_margin_right' => 10,
            'menu_margin_bottom' => 10,
            'menu_margin_left' => 10,
            
            // Menu Corner Radius
            'corner_radius_type' => 'none',
            'corner_radius_all' => 8,
            'corner_radius_top_left' => 8,
            'corner_radius_top_right' => 8,
            'corner_radius_bottom_right' => 8,
            'corner_radius_bottom_left' => 8,
            
            // Content
            'content_background' => '#f1f1f1',
            'content_card_background' => '#ffffff',
            'content_text_color' => '#333333',
            'content_link_color' => '#0073aa',
            'button_primary_background' => '#0073aa',
            'button_primary_text_color' => '#ffffff',
            'button_border_radius' => 4,
            'content_rounded_corners' => false,
            'content_shadows' => false,
            'content_hover_effects' => false,
            
            // Typography
            'google_font_primary' => '',
            'google_font_headings' => '',
            'load_google_fonts' => false,
            'heading_font_size' => 32,
            'body_font_size' => 14,
            'line_height' => 1.6,
            
            // Effects
            'animation_speed' => 300,
            'fade_in_effects' => false,
            'slide_animations' => false,
            'scale_hover_effects' => false,
            'glassmorphism_effects' => false,
            'gradient_backgrounds' => false,
            'particle_effects' => false,
            'smooth_scrolling' => false,
            
            // Buttons & Forms
            'button_primary_bg' => '#0073aa',
            'button_primary_text_color' => '#ffffff',
            'button_primary_hover_bg' => '#005a87',
            'button_secondary_bg' => '#f1f1f1',
            'button_secondary_text_color' => '#333333',
            'button_secondary_hover_bg' => '#e0e0e0',
            'button_border_radius' => 4,
            'button_shadow' => false,
            'button_hover_effects' => true,
            'form_field_bg' => '#ffffff',
            'form_field_border' => '#ddd',
            'form_field_focus_color' => '#0073aa',
            'form_field_border_radius' => 4,
            
            // Login Page
            'login_page_enabled' => false,
            'login_bg_color' => '#f1f1f1',
            'login_form_bg' => '#ffffff',
            'login_custom_logo' => '',
            'login_form_shadow' => true,
            'login_form_rounded' => true,
            
            // Advanced
            'custom_css' => '',
            'custom_js' => '',
            'hide_wp_version' => false,
            'hide_help_tabs' => false,
            'hide_screen_options' => false,
            'hide_admin_notices' => false,
            'custom_admin_footer_text' => '',
            'admin_bar_hide_wp_logo' => false,
            'admin_bar_hide_howdy' => false,
            'admin_bar_hide_updates' => false,
            'admin_bar_hide_comments' => false,
            'minify_css' => false,
            'cache_css' => true,
            'debug_mode' => false,
            'show_css_info' => false,
            'load_only_admin' => true,
            'async_loading' => false,
            
            // BRAKUJĄCE DOMYŚLNE KOLORY - HTML5 Color Input Fix
            'accent_color' => '#0073aa',
            'bar_text_hover_color' => '#00a0d2',
            'menu_background_color' => '#23282d',
            'menu_gradient_start' => '#23282d',
            'menu_gradient_end' => '#32373c',
            'menu_hover_color' => '#00a0d2',
            'menu_active_color' => '#ffffff',
            'submenu_bg_color' => '#32373c',
            'submenu_text_color' => '#ffffff',
            'menu_submenu_background' => '#32373c',
            'menu_submenu_text_color' => '#ffffff',
            'submenu_hover_bg_color' => '#0073aa',
            'submenu_hover_text_color' => '#ffffff',
            'submenu_active_bg_color' => '#0073aa',
            'submenu_active_text_color' => '#ffffff',
            'submenu_border_color' => '#464646',
            'submenu_separator_color' => '#464646',
            'content_background_color' => '#f1f1f1',
            'content_gradient_start' => '#f1f1f1',
            'content_gradient_end' => '#e0e0e0',
            'content_text_color' => '#333333',
            'content_blur_background' => '#ffffff',
            'button_bg_color' => '#0073aa',
            'button_text_color' => '#ffffff',
            'button_hover_bg_color' => '#005a87',
            'button_hover_text_color' => '#ffffff',
            'button_primary_text_color' => '#ffffff',
            'button_secondary_text_color' => '#0073aa',
            'form_field_bg_color' => '#ffffff',
            'form_field_border_color' => '#dddddd',
            'form_field_focus_color' => '#0073aa',
            'login_background_color' => '#f1f1f1',
            'login_gradient_start' => '#f1f1f1',
            'login_gradient_end' => '#e0e0e0',
            'login_form_background' => '#ffffff',
            'login_button_background' => '#0073aa',
            'login_button_text_color' => '#ffffff',
            'login_bg_color' => '#f1f1f1',
            'menu_search_background' => '#ffffff',
            'menu_search_text_color' => '#333333',
            'menu_search_border_color' => '#dddddd',
            'menu_search_focus_color' => '#0073aa',
            'menu_search_icon_color' => '#666666',
            'menu_scrollbar_track_color' => '#f1f1f1',
            'menu_scrollbar_thumb_color' => '#cccccc',
            'menu_scrollbar_thumb_hover_color' => '#999999',
            'submenu_scrollbar_track_color' => '#f1f1f1',
            'submenu_scrollbar_thumb_color' => '#cccccc',
            'submenu_scrollbar_thumb_hover_color' => '#999999',
            'menu_floating_blur_background' => '#ffffff',
            'menu_mobile_toggle_color' => '#333333',
            'menu_mobile_overlay_color' => '#000000',
            'menu_mobile_background' => '#23282d',
            'menu_mobile_text_color' => '#ffffff',
        ];
    }
    
    /**
     * Definicje tabów
     */
    private function getTabs() {
        // 🎯 NOWA ARCHITEKTURA INFORMACJI: 5 logicznych zakładek!
        return [
            'general' => [
                'title' => __('🌐 Główne', 'modern-admin-styler-v2'),
                'icon' => 'settings',
                'description' => __('Globalne ustawienia, motyw kolorystyczny, layout', 'modern-admin-styler-v2')
            ],
            'admin-bar' => [
                'title' => __('📊 Pasek Admina', 'modern-admin-styler-v2'),
                'icon' => 'admin-bar',
                'description' => __('Wygląd, pozycja, typografia i ukrywanie elementów', 'modern-admin-styler-v2')
            ],
            'menu' => [
                'title' => __('📋 Menu', 'modern-admin-styler-v2'),
                'icon' => 'menu',
                'description' => __('Menu główne + submenu (wszystko w jednym miejscu!)', 'modern-admin-styler-v2')
            ],
            'typography' => [
                'title' => __('🔤 Typografia', 'modern-admin-styler-v2'),
                'icon' => 'typography',
                'description' => __('Czcionki, rozmiary, nowa skala nagłówków H1-H6', 'modern-admin-styler-v2')
            ],
            'advanced' => [
                'title' => __('⚙️ Zaawansowane', 'modern-admin-styler-v2'),
                'icon' => 'advanced',
                'description' => __('Treść + Przyciski + Optymalizacja + CSS/JS', 'modern-admin-styler-v2')
            ]
        ];
    }
    
    /**
     * Helper function dla ikon
     */
    public function getTabIcon($icon_name) {
        $icons = [
            'settings' => '<span class="dashicons dashicons-admin-settings"></span>',
            'admin-bar' => '<span class="dashicons dashicons-admin-bar"></span>',
            'menu' => '<span class="dashicons dashicons-menu"></span>',
            'content' => '<span class="dashicons dashicons-admin-page"></span>',
            'typography' => '<span class="dashicons dashicons-editor-textcolor"></span>',
            'effects' => '<span class="dashicons dashicons-art"></span>',
            'advanced' => '<span class="dashicons dashicons-admin-tools"></span>',
            'live-preview' => '<span class="dashicons dashicons-visibility"></span>',
        ];
        
        return $icons[$icon_name] ?? '<span class="dashicons dashicons-admin-generic"></span>';
    }
    
    /**
     * Inteligentne czyszczenie cache
     */
    private function clearCache() {
        // NAPRAWKA WYDAJNOŚCI: Ograniczone czyszczenie cache tylko gdy naprawdę potrzebne
        static $cache_cleared = false;
        
        // Unikaj wielokrotnego czyszczenia w jednym request
        if ($cache_cleared) {
            return;
        }
        
        // WordPress cache
        if (function_exists('wp_cache_flush')) {
            wp_cache_flush();
        }
        
        // Object cache
        if (function_exists('wp_cache_delete_group')) {
            wp_cache_delete_group('mas_v2_cache', 'mas_v2');
        }
        
        // Opcjonalne: popularne cache plugins
        $cache_plugins = [
            'W3TC' => function() { 
                if (function_exists('w3tc_flush_all')) w3tc_flush_all(); 
            },
            'WP Super Cache' => function() { 
                if (function_exists('wp_cache_clear_cache')) wp_cache_clear_cache(); 
            },
            'WP Rocket' => function() { 
                if (function_exists('rocket_clean_domain')) rocket_clean_domain(); 
            }
        ];
        
        foreach ($cache_plugins as $plugin => $clear_func) {
            if (is_callable($clear_func)) {
                try {
                    $clear_func();
                } catch (Exception $e) {
                    error_log("MAS V2: Cache clear failed for {$plugin}: " . $e->getMessage());
                }
            }
        }
        
        $cache_cleared = true;
        error_log('MAS V2: Cache cleared successfully');
    }
    
    /**
     * Renderuje search box i custom bloki w menu (Phase 5)
     */
    public function renderMenuSearchAndBlocks() {
        if (!is_admin() || $this->isLoginPage()) {
            return;
        }
        
        $settings = $this->getSettings();
        
        // Render search if enabled
        if (isset($settings['menu_search_enabled']) && $settings['menu_search_enabled']) {
            $this->renderMenuSearch($settings);
        }
        
        // Render custom blocks if enabled
        if (isset($settings['menu_custom_blocks_enabled']) && $settings['menu_custom_blocks_enabled']) {
            $this->renderCustomBlocks($settings);
        }
    }
    
    /**
     * Renderuje wyszukiwarkę menu
     */
    private function renderMenuSearch($settings) {
        $position = $settings['menu_search_position'] ?? 'top';
        $style = $settings['menu_search_style'] ?? 'modern';
        $placeholder = $settings['menu_search_placeholder'] ?? 'Szukaj w menu...';
        $animation = isset($settings['menu_search_animation']) && $settings['menu_search_animation'];
        
        $searchHTML = sprintf(
            '<div class="mas-menu-search mas-search-%s" data-animation="%s" style="display: none;">
                <div class="mas-search-container">
                    %s
                    <input type="text" 
                           class="mas-search-input" 
                           placeholder="%s"
                           autocomplete="off"
                           spellcheck="false">
                    <div class="mas-search-clear" title="Wyczyść" style="display: none;">✕</div>
                </div>
                <div class="mas-search-results" style="display: none;"></div>
            </div>',
            esc_attr($style),
            $animation ? 'true' : 'false',
            $style === 'modern' ? '<div class="mas-search-icon">🔍</div>' : '',
            esc_attr($placeholder)
        );
        
        // JavaScript to inject search into menu
        echo "<script>
        jQuery(document).ready(function($) {
            var searchHTML = " . json_encode($searchHTML) . ";
            var position = " . json_encode($position) . ";
            
            if ($('#adminmenu').length) {
                if (position === 'top') {
                    $('#adminmenu').prepend(searchHTML);
                } else {
                    $('#adminmenu').append(searchHTML);
                }
                $('.mas-menu-search').show();
            }
        });
        </script>";
    }
    
    /**
     * Renderuje custom bloki HTML
     */
    private function renderCustomBlocks($settings) {
        $blocks = $settings['menu_custom_blocks'] ?? [];
        
        foreach ($blocks as $blockId => $block) {
            if (!isset($block['enabled']) || !$block['enabled']) {
                continue;
            }
            
            $content = $block['content'] ?? '';
            if (empty(trim($content))) {
                continue;
            }
            
            $position = $block['position'] ?? 'top';
            $style = $block['style'] ?? 'default';
            $animation = $block['animation'] ?? 'fade';
            
            // Process shortcodes in content
            $content = do_shortcode($content);
            
            // Basic HTML sanitization while allowing most tags
            $allowedTags = [
                'div', 'span', 'p', 'a', 'img', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
                'ul', 'ol', 'li', 'br', 'strong', 'em', 'b', 'i', 'u',
                'code', 'pre', 'blockquote', 'small', 'sub', 'sup'
            ];
            
            $allowedAttributes = [
                'href', 'src', 'alt', 'title', 'class', 'id', 'style',
                'target', 'rel', 'data-*'
            ];
            
            $blockHTML = sprintf(
                '<div class="mas-custom-block mas-block-%s mas-%s" data-animation="%s" style="display: none;">
                    <div class="mas-block-content">%s</div>
                </div>',
                esc_attr($style),
                esc_attr($blockId),
                esc_attr($animation),
                wp_kses($content, array_fill_keys($allowedTags, array_fill_keys($allowedAttributes, true)))
            );
            
            // JavaScript to inject block into menu
            echo "<script>
            jQuery(document).ready(function($) {
                var blockHTML = " . json_encode($blockHTML) . ";
                var position = " . json_encode($position) . ";
                var animation = " . json_encode($animation) . ";
                
                if ($('#adminmenu').length) {
                    if (position === 'top') {
                        $('#adminmenu').prepend(blockHTML);
                    } else {
                        $('#adminmenu').append(blockHTML);
                    }
                    
                    var \$block = $('.mas-" . esc_js($blockId) . "');
                    \$block.show();
                    
                    // Apply animation
                    if (animation !== 'none') {
                        setTimeout(function() {
                            \$block.addClass('mas-animate-' + animation);
                        }, 100);
                    }
                }
            });
            </script>";
        }
    }
    
    /**
     * Generuje CSS dla funkcji Premium (Phase 7)
     */
    private function generatePremiumCSS($settings) {
        $css = "\n/* =================================== */\n";
        $css .= "/* Premium Features CSS (Phase 7)     */\n";
        $css .= "/* =================================== */\n\n";
        
        // Custom CSS injection
        if (isset($settings['menu_custom_css_enabled']) && $settings['menu_custom_css_enabled']) {
            $customCSS = $settings['menu_custom_css_code'] ?? '';
            if (!empty(trim($customCSS))) {
                $css .= "\n/* Custom CSS Code */\n";
                
                // Basic CSS validation and minification if enabled
                if (isset($settings['menu_css_minification']) && $settings['menu_css_minification']) {
                    $customCSS = $this->minifyCSS($customCSS);
                }
                
                $css .= $customCSS . "\n";
            }
        }
        
        // Conditional display CSS
        if (isset($settings['menu_conditional_display']) && $settings['menu_conditional_display']) {
            $css .= $this->generateConditionalDisplayCSS($settings);
        }
        
        // Template-specific CSS
        $activeTemplate = $settings['menu_active_template'] ?? 'default';
        if ($activeTemplate !== 'default') {
            $css .= $this->generateTemplateCSS($activeTemplate, $settings);
        }
        
        // White label CSS (hide plugin info if enabled)
        if (isset($settings['menu_white_label']) && $settings['menu_white_label']) {
            $css .= $this->generateWhiteLabelCSS();
        }
        
        // Performance monitoring indicators
        if (isset($settings['menu_performance_monitoring']) && $settings['menu_performance_monitoring']) {
            $css .= $this->generatePerformanceIndicatorsCSS();
        }
        
        // Night mode CSS (for time-based display)
        $css .= "
        /* Night Mode Styles */
        body.mas-v2-night-mode #adminmenu {
            background: #0f172a !important;
            border-right-color: #1e293b !important;
        }
        
        body.mas-v2-night-mode #adminmenu li a {
            color: #e2e8f0 !important;
        }
        
        body.mas-v2-night-mode #adminmenu li.wp-has-current-submenu > a,
        body.mas-v2-night-mode #adminmenu li.current > a {
            background: #1e40af !important;
            color: #ffffff !important;
        }
        
        body.mas-v2-night-mode #adminmenu li:hover > a {
            background: #1e293b !important;
            color: #f1f5f9 !important;
        }";
        
        return $css;
    }
    
    /**
     * Generuje CSS dla wyświetlania warunkowego
     */
    private function generateConditionalDisplayCSS($settings) {
        $css = "\n/* Conditional Display CSS */\n";
        
        // Page-specific styling
        $pagePatterns = $settings['menu_page_specific_styling'] ?? [];
        if (!empty($pagePatterns)) {
            foreach ($pagePatterns as $index => $pattern) {
                $safeClass = 'mas-page-' . md5($pattern);
                $css .= "
                body.{$safeClass} #adminmenu {
                    /* Page-specific styles for: {$pattern} */
                    opacity: 0.9;
                    border-left: 3px solid #0073aa;
                }";
            }
        }
        
        // Role-based styling classes
        $restrictedRoles = $settings['menu_user_role_restrictions'] ?? [];
        if (!empty($restrictedRoles)) {
            foreach ($restrictedRoles as $role) {
                $css .= "
                body.role-{$role} #adminmenu {
                    /* Role-specific styles for: {$role} */
                    filter: hue-rotate(15deg);
                }";
            }
        }
        
        return $css;
    }
    
    /**
     * Generuje CSS dla aktywnego szablonu
     */
    private function generateTemplateCSS($template, $settings) {
        $css = "\n/* Template CSS: {$template} */\n";
        
        switch ($template) {
            case 'corporate':
                $css .= "
                #adminmenu {
                    background: linear-gradient(180deg, #1e3a5f 0%, #2563eb 100%) !important;
                    box-shadow: 0 0 20px rgba(37, 99, 235, 0.3) !important;
                }
                
                #adminmenu li a {
                    font-weight: 500 !important;
                    letter-spacing: 0.025em !important;
                }
                
                #adminmenu li.wp-has-current-submenu > a {
                    background: rgba(255, 255, 255, 0.15) !important;
                    border-left: 3px solid #60a5fa !important;
                }";
                break;
                
            case 'creative':
                $css .= "
                #adminmenu {
                    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%) !important;
                    border-radius: 0 15px 15px 0 !important;
                }
                
                #adminmenu li a {
                    border-radius: 8px !important;
                    margin: 2px 8px !important;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
                }
                
                #adminmenu li a:hover {
                    transform: translateX(5px) !important;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2) !important;
                }";
                break;
                
            case 'minimal':
                $css .= "
                #adminmenu {
                    background: #f8fafc !important;
                    border-right: 1px solid #e2e8f0 !important;
                    box-shadow: none !important;
                }
                
                #adminmenu li a {
                    color: #334155 !important;
                    font-weight: 400 !important;
                    padding: 12px 16px !important;
                }
                
                #adminmenu li a:hover {
                    background: #f1f5f9 !important;
                    color: #1e293b !important;
                }
                
                #adminmenu li.wp-has-current-submenu > a {
                    background: #e2e8f0 !important;
                    color: #0f172a !important;
                }";
                break;
                
            case 'dark-mode':
                $css .= "
                #adminmenu {
                    background: #0f172a !important;
                    border-right: 1px solid #1e293b !important;
                }
                
                #adminmenu li a {
                    color: #e2e8f0 !important;
                }
                
                #adminmenu li a:hover {
                    background: #1e293b !important;
                    color: #f1f5f9 !important;
                }
                
                #adminmenu li.wp-has-current-submenu > a {
                    background: #1e40af !important;
                    color: #ffffff !important;
                }";
                break;
        }
        
        return $css;
    }
    
    /**
     * Generuje CSS dla white label
     */
    private function generateWhiteLabelCSS() {
        return "
        /* White Label CSS */
        .mas-v2-plugin-info,
        .mas-v2-branding,
        #adminmenu .mas-v2-signature {
            display: none !important;
        }";
    }
    
    /**
     * Generuje CSS dla wskaźników wydajności
     */
    private function generatePerformanceIndicatorsCSS() {
        return "
        /* Performance Indicators CSS */
        .mas-v2-performance-indicator {
            position: fixed;
            top: 32px;
            right: 10px;
            background: rgba(0, 0, 0, 0.8);
            color: #fff;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 11px;
            font-family: monospace;
            z-index: 99999;
            pointer-events: none;
        }
        
        .mas-v2-performance-indicator.warning {
            background: rgba(255, 193, 7, 0.9);
            color: #000;
        }
        
        .mas-v2-performance-indicator.error {
            background: rgba(220, 53, 69, 0.9);
        }";
    }
    
    /**
     * Minifikacja CSS
     */
    private function minifyCSS($css) {
        // Remove comments
        $css = preg_replace('!/\*[^*]*\*+([^/][^*]*\*+)*/!', '', $css);
        
        // Remove unnecessary whitespace
        $css = str_replace(["\r\n", "\r", "\n", "\t", '  ', '    ', '    '], '', $css);
        
        // Remove spaces around specific characters
        $css = str_replace([' {', '{ ', ' }', '} ', ': ', ' :', '; ', ' ;', ', ', ' ,'], ['{', '{', '}', '}', ':', ':', ';', ';', ',', ','], $css);
        
        return trim($css);
    }
    
    /**
     * Generuje JavaScript dla dynamicznego zarządzania klasami body
     */
    private function generateBodyClassesJS($settings) {
        $js = 'document.addEventListener("DOMContentLoaded", function() {';
        $js .= 'var body = document.body;';
        
        // Floating menu classes
        if (isset($settings['menu_floating']) && $settings['menu_floating']) {
            $js .= 'body.classList.add("mas-v2-menu-floating");';
            $js .= 'body.classList.add("mas-menu-floating");';
            $js .= 'body.classList.remove("mas-menu-normal");';
        } else {
            $js .= 'body.classList.remove("mas-v2-menu-floating");';
            $js .= 'body.classList.add("mas-menu-normal");';
            $js .= 'body.classList.remove("mas-menu-floating");';
        }
        
        // Admin bar floating status
        if (isset($settings['admin_bar_floating']) && $settings['admin_bar_floating']) {
            $js .= 'body.classList.add("mas-v2-admin-bar-floating");';
            $js .= 'body.classList.remove("mas-admin-bar-floating");'; // Remove old class
        } else {
            $js .= 'body.classList.remove("mas-v2-admin-bar-floating", "mas-admin-bar-floating");';
        }
        
        // Glossy effects
        if (isset($settings['menu_glossy']) && $settings['menu_glossy']) {
            $js .= 'body.classList.add("mas-v2-menu-glossy");';
        } else {
            $js .= 'body.classList.remove("mas-v2-menu-glossy");';
        }
        
        if (isset($settings['admin_bar_glossy']) && $settings['admin_bar_glossy']) {
            $js .= 'body.classList.add("mas-v2-admin-bar-glossy");';
        } else {
            $js .= 'body.classList.remove("mas-v2-admin-bar-glossy");';
        }
        
        // Border radius individual settings
        if (isset($settings['menu_border_radius_type']) && $settings['menu_border_radius_type'] === 'individual') {
            $js .= 'body.classList.add("mas-v2-menu-radius-individual");';
        } else {
            $js .= 'body.classList.remove("mas-v2-menu-radius-individual");';
        }
        
        if (isset($settings['admin_bar_border_radius_type']) && $settings['admin_bar_border_radius_type'] === 'individual') {
            $js .= 'body.classList.add("mas-v2-admin-bar-radius-individual");';
        } else {
            $js .= 'body.classList.remove("mas-v2-admin-bar-radius-individual");';
        }
        
        // Debug info
        $js .= 'console.log("MAS V2: Unified styles active on all pages");';
        $js .= 'console.log("MAS V2: Body classes added:", body.className.split(" ").filter(function(c) { return c.startsWith("mas-"); }));';
        
        $js .= '});';
        
        return $js;
    }
    
    /**
     * DIAGNOSTIC: Database check AJAX handler
     */
    public function ajaxDatabaseCheck() {
        if (!wp_verify_nonce($_POST['nonce'] ?? $_POST['_wpnonce'] ?? '', 'mas_v2_nonce')) {
            wp_send_json_error(['message' => 'Security check failed']);
            return;
        }
        
        if (!current_user_can('manage_options')) {
            wp_send_json_error(['message' => 'Insufficient permissions']);
            return;
        }
        
        try {
            global $wpdb;
            
            // Get the option directly from database
            $option_name = 'mas_v2_settings';
            $result = $wpdb->get_row(
                $wpdb->prepare(
                    "SELECT option_value, option_id FROM {$wpdb->options} WHERE option_name = %s",
                    $option_name
                ),
                ARRAY_A
            );
            
            if ($result) {
                $settings = maybe_unserialize($result['option_value']);
                
                wp_send_json_success([
                    'settings' => $settings,
                    'option_id' => $result['option_id'],
                    'last_modified' => 'Database query successful',
                    'admin_bar_height' => $settings['admin_bar_height'] ?? 'NOT SET',
                    'enable_plugin' => $settings['enable_plugin'] ?? 'NOT SET',
                    'database_size' => strlen($result['option_value']) . ' bytes',
                    'settings_count' => is_array($settings) ? count($settings) : 'NOT ARRAY'
                ]);
            } else {
                wp_send_json_error(['message' => 'No mas_v2_settings found in database']);
            }
            
        } catch (Exception $e) {
            wp_send_json_error(['message' => 'Database error: ' . $e->getMessage()]);
        }
    }
    
    /**
     * DIAGNOSTIC: WordPress options system test
     */
    public function ajaxOptionsTest() {
        if (!wp_verify_nonce($_POST['nonce'] ?? $_POST['_wpnonce'] ?? '', 'mas_v2_nonce')) {
            wp_send_json_error(['message' => 'Security check failed']);
            return;
        }
        
        if (!current_user_can('manage_options')) {
            wp_send_json_error(['message' => 'Insufficient permissions']);
            return;
        }
        
        try {
            // Test WordPress options system with a temporary option
            $test_option_name = 'mas_v2_test_' . time();
            $test_data = [
                'test_field' => 'test_value_' . time(),
                'admin_bar_height' => 99
            ];
            
            // Test save
            $save_result = update_option($test_option_name, $test_data);
            
            // Test retrieve
            $retrieved_data = get_option($test_option_name);
            
            // Test delete
            $delete_result = delete_option($test_option_name);
            
            wp_send_json_success([
                'test_result' => 'SUCCESS',
                'save_result' => $save_result,
                'data_match' => ($test_data === $retrieved_data),
                'delete_result' => $delete_result,
                'test_data' => $test_data,
                'retrieved_data' => $retrieved_data
            ]);
            
        } catch (Exception $e) {
            wp_send_json_error(['message' => 'Options test error: ' . $e->getMessage()]);
        }
    }
    
    /**
     * DIAGNOSTIC: Cache check AJAX handler
     */
    public function ajaxCacheCheck() {
        if (!wp_verify_nonce($_POST['nonce'] ?? $_POST['_wpnonce'] ?? '', 'mas_v2_nonce')) {
            wp_send_json_error(['message' => 'Security check failed']);
            return;
        }
        
        if (!current_user_can('manage_options')) {
            wp_send_json_error(['message' => 'Insufficient permissions']);
            return;
        }
        
        try {
            $cache_status = [];
            
            // Check WordPress object cache
            if (wp_using_ext_object_cache()) {
                $cache_status['object_cache'] = 'External object cache detected';
            } else {
                $cache_status['object_cache'] = 'Using WordPress default cache';
            }
            
            // Check for common caching plugins
            $caching_plugins = [
                'W3 Total Cache' => 'w3-total-cache/w3-total-cache.php',
                'WP Super Cache' => 'wp-super-cache/wp-cache.php',
                'WP Rocket' => 'wp-rocket/wp-rocket.php',
                'LiteSpeed Cache' => 'litespeed-cache/litespeed-cache.php'
            ];
            
            $active_cache_plugins = [];
            foreach ($caching_plugins as $name => $plugin_file) {
                if (is_plugin_active($plugin_file)) {
                    $active_cache_plugins[] = $name;
                }
            }
            
            // Check transients
            $test_transient = 'mas_v2_cache_test_' . time();
            $test_value = 'cache_test_value';
            set_transient($test_transient, $test_value, 60);
            $retrieved_transient = get_transient($test_transient);
            delete_transient($test_transient);
            
            wp_send_json_success([
                'cache_status' => $cache_status,
                'active_cache_plugins' => $active_cache_plugins,
                'transient_test' => ($test_value === $retrieved_transient) ? 'PASS' : 'FAIL',
                'plugin_cache' => 'Plugin uses clearCache() method'
            ]);
            
        } catch (Exception $e) {
            wp_send_json_error(['message' => 'Cache check error: ' . $e->getMessage()]);
        }
    }
    
    /**
     * 🎨 FAZA 2: AJAX Clear Cache handler
     */
    public function ajaxClearCache() {
        // Security check
        if (!wp_verify_nonce($_POST['nonce'] ?? '', 'mas_v2_clear_cache') || !current_user_can('manage_options')) {
            wp_send_json_error(['message' => __('Security check failed', 'modern-admin-styler-v2')]);
        }
        
        try {
            // Clear plugin cache using cache manager
            $this->cache_manager->flush();
            
            // Clear WordPress transients
            delete_transient('mas_v2_css_cache');
            delete_transient('mas_v2_settings_cache');
            
            // Clear object cache if available
            if (function_exists('wp_cache_flush')) {
                wp_cache_flush();
            }
            
            wp_send_json_success(['message' => __('Cache cleared successfully!', 'modern-admin-styler-v2')]);
            
        } catch (Exception $e) {
            wp_send_json_error(['message' => __('Error clearing cache: ', 'modern-admin-styler-v2') . $e->getMessage()]);
        }
    }
    
    // 🗑️ USUNIĘTE: Enterprise AJAX methods - przeniesione do AjaxHandler serwisu
    
    /**
     * 🎯 LIVE EDIT MODE: Save settings via AJAX
     */
    public function ajaxSaveLiveSettings() {
        // Security check
        if (!wp_verify_nonce($_POST['nonce'] ?? '', 'mas_live_edit_nonce') || !current_user_can('manage_options')) {
            wp_send_json_error(['message' => 'Security check failed']);
            return;
        }
        
        try {
            $settings_json = $_POST['settings'] ?? '';
            $new_settings = json_decode(stripslashes($settings_json), true);
            
            if (!is_array($new_settings)) {
                wp_send_json_error(['message' => 'Invalid settings format']);
                return;
            }
            
            // Get existing settings
            $current_settings = $this->getSettings();
            
            // Merge with new settings (only update changed values)
            $updated_settings = array_merge($current_settings, $new_settings);
            
            // Sanitize settings using existing method
            $sanitized_settings = $this->sanitizeSettings($updated_settings);
            
            // Save to database
            $result = update_option('mas_v2_settings', $sanitized_settings);
            
            if ($result) {
                // Clear cache
                $this->clearCache();
                
                wp_send_json_success([
                    'message' => 'Settings saved successfully',
                    'updated_count' => count($new_settings),
                    'total_settings' => count($sanitized_settings),
                    'timestamp' => current_time('mysql')
                ]);
            } else {
                wp_send_json_error(['message' => 'Failed to save settings to database']);
            }
            
        } catch (Exception $e) {
            wp_send_json_error(['message' => 'Error saving settings: ' . $e->getMessage()]);
        }
    }
    
    /**
     * 🎯 LIVE EDIT MODE: Get current settings via AJAX
     */
    public function ajaxGetLiveSettings() {
        // Security check
        if (!wp_verify_nonce($_POST['nonce'] ?? '', 'mas_live_edit_nonce') || !current_user_can('manage_options')) {
            wp_send_json_error(['message' => 'Security check failed']);
            return;
        }
        
        try {
            $settings = $this->getSettings();
            
            wp_send_json_success([
                'settings' => $settings,
                'count' => count($settings),
                'last_modified' => get_option('mas_v2_settings_modified', 'Unknown'),
                'cache_status' => wp_using_ext_object_cache() ? 'External cache' : 'WordPress default'
            ]);
            
        } catch (Exception $e) {
            wp_send_json_error(['message' => 'Error loading settings: ' . $e->getMessage()]);
        }
    }
    
    /**
     * 🎯 LIVE EDIT MODE: Reset specific setting to default
     */
    public function ajaxResetLiveSetting() {
        // Security check
        if (!wp_verify_nonce($_POST['nonce'] ?? '', 'mas_live_edit_nonce') || !current_user_can('manage_options')) {
            wp_send_json_error(['message' => 'Security check failed']);
            return;
        }
        
        try {
            $setting_key = sanitize_key($_POST['setting_key'] ?? '');
            
            if (empty($setting_key)) {
                wp_send_json_error(['message' => 'Setting key is required']);
                return;
            }
            
            // Get current settings
            $current_settings = $this->getSettings();
            
            // Get default value
            $defaults = $this->getDefaultSettings();
            $default_value = $defaults[$setting_key] ?? null;
            
            if ($default_value === null) {
                wp_send_json_error(['message' => 'Setting not found in defaults']);
                return;
            }
            
            // Reset to default
            $current_settings[$setting_key] = $default_value;
            
            // Save settings
            $result = update_option('mas_v2_settings', $current_settings);
            
            if ($result) {
                // Clear cache
                $this->clearCache();
                
                wp_send_json_success([
                    'message' => "Setting '{$setting_key}' reset to default",
                    'setting_key' => $setting_key,
                    'default_value' => $default_value,
                    'timestamp' => current_time('mysql')
                ]);
            } else {
                wp_send_json_error(['message' => 'Failed to save settings']);
            }
            
        } catch (Exception $e) {
            wp_send_json_error(['message' => 'Error resetting setting: ' . $e->getMessage()]);
        }
    }
    
    // 🗑️ USUNIĘTE: Enterprise AJAX methods - przeniesione do AjaxHandler serwisu
    
    /**
     * 🎯 FAZA 6: Renderuje stronę Enterprise Dashboard
     */
    public function renderPhase6Demo() {
        // Load the phase 6 demo view
        $view_file = MAS_V2_PLUGIN_DIR . 'src/views/admin-page-phase6-dashboard.php';
        
        if (file_exists($view_file)) {
            $settings = $this->settings_manager->getSettings();
            include $view_file;
        } else {
            echo '<div class="mas-v2-error">Phase 6 Dashboard view file not found.</div>';
        }
    }
    
    /**
     * 🎨 PRESET SYSTEM: Renderuje stronę zarządzania presetami
     */
    public function renderPresetsPage() {
        $presets = [];
        $error_message = '';
        
        try {
            if ($this->preset_manager) {
                $presets = $this->preset_manager->getPresets();
            }
        } catch (Exception $e) {
            $error_message = 'Error loading presets: ' . $e->getMessage();
        }
        
        ?>
        <div class="wrap mas-v2-wrap">
            <div class="mas-v2-preset-management-page">
                
                <!-- Header Section -->
                <div class="mas-v2-hero-section" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 3rem; margin: 0 0 2rem 0; border-radius: 0;">
                    <div class="mas-v2-hero-content" style="max-width: 1000px; margin: 0 auto; text-align: center;">
                        <h1 style="color: white; font-size: 2.5rem; margin: 0 0 1rem 0; font-weight: 700;">🎨 Style Presets</h1>
                        <p style="color: rgba(255,255,255,0.9); font-size: 1.2rem; margin: 0 0 2rem 0; line-height: 1.6;">
                            Enterprise-grade preset management system. Save, load, and share complete style configurations.
                        </p>
                        
                        <!-- Quick Actions -->
                        <div class="mas-preset-quick-actions" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; max-width: 600px; margin: 0 auto;">
                            <button id="create-new-preset" class="mas-preset-action-btn" style="padding: 1rem; background: rgba(255,255,255,0.2); border: none; border-radius: 10px; color: white; cursor: pointer; transition: all 0.3s ease; backdrop-filter: blur(10px);">
                                ➕ Create New Preset
                            </button>
                            <button id="import-preset-file" class="mas-preset-action-btn" style="padding: 1rem; background: rgba(255,255,255,0.2); border: none; border-radius: 10px; color: white; cursor: pointer; transition: all 0.3s ease; backdrop-filter: blur(10px);">
                                📥 Import Preset
                            </button>
                            <button id="export-all-presets" class="mas-preset-action-btn" style="padding: 1rem; background: rgba(255,255,255,0.2); border: none; border-radius: 10px; color: white; cursor: pointer; transition: all 0.3s ease; backdrop-filter: blur(10px);">
                                📤 Export All
                            </button>
                        </div>
                    </div>
                </div>
                
                <!-- Statistics Section -->
                <div class="mas-preset-stats" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem; margin-bottom: 3rem;">
                    <div class="stat-card" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 2rem; border-radius: 15px; text-align: center;">
                        <div style="font-size: 2.5rem; font-weight: bold; margin-bottom: 0.5rem;"><?php echo count($presets); ?></div>
                        <div style="opacity: 0.9;">Total Presets</div>
                    </div>
                    <div class="stat-card" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 2rem; border-radius: 15px; text-align: center;">
                        <div style="font-size: 2.5rem; font-weight: bold; margin-bottom: 0.5rem;">43</div>
                        <div style="opacity: 0.9;">Available Options</div>
                    </div>
                    <div class="stat-card" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; padding: 2rem; border-radius: 15px; text-align: center;">
                        <div style="font-size: 2.5rem; font-weight: bold; margin-bottom: 0.5rem;">JSON</div>
                        <div style="opacity: 0.9;">Export Format</div>
                    </div>
                    <div class="stat-card" style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); color: white; padding: 2rem; border-radius: 15px; text-align: center;">
                        <div style="font-size: 2.5rem; font-weight: bold; margin-bottom: 0.5rem;">REST</div>
                        <div style="opacity: 0.9;">API Powered</div>
                    </div>
                </div>
                
                <?php if ($error_message): ?>
                    <div class="notice notice-error" style="margin-bottom: 2rem;">
                        <p><?php echo esc_html($error_message); ?></p>
                    </div>
                <?php endif; ?>
                
                <!-- Presets Grid -->
                <div class="mas-presets-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 2rem;">
                    
                    <?php if (empty($presets)): ?>
                        <!-- Empty State -->
                        <div class="mas-empty-state" style="grid-column: 1 / -1; text-align: center; padding: 4rem; background: #f9f9f9; border-radius: 15px; border: 2px dashed #ddd;">
                            <div style="font-size: 4rem; margin-bottom: 1rem; opacity: 0.5;">🎨</div>
                            <h3 style="color: #666; margin-bottom: 1rem;">No Presets Found</h3>
                            <p style="color: #999; margin-bottom: 2rem;">Create your first preset by saving your current style configuration!</p>
                            <button onclick="window.location.href='<?php echo admin_url('admin.php?page=mas-v2-general'); ?>'" style="padding: 1rem 2rem; background: #0073aa; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 1rem;">
                                🎨 Go to Style Settings
                            </button>
                        </div>
                    <?php else: ?>
                        
                        <?php foreach ($presets as $preset): ?>
                            <div class="mas-preset-card" data-preset-id="<?php echo esc_attr($preset['id']); ?>" style="background: white; border-radius: 15px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.1); transition: all 0.3s ease; border: 1px solid #e1e5e9;">
                                
                                <!-- Preset Header -->
                                <div class="preset-header" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 1.5rem;">
                                    <h3 style="margin: 0 0 0.5rem 0; font-size: 1.3rem;"><?php echo esc_html($preset['name']); ?></h3>
                                    <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.9rem; opacity: 0.9;">
                                        <span>📅 <?php echo date('M j, Y', strtotime($preset['created'])); ?></span>
                                        <span>⚙️ <?php echo count($preset['settings']); ?> options</span>
                                    </div>
                                </div>
                                
                                <!-- Preset Content -->
                                <div class="preset-content" style="padding: 1.5rem;">
                                    <?php if (!empty($preset['description'])): ?>
                                        <p style="color: #666; margin: 0 0 1rem 0; font-size: 0.95rem; line-height: 1.5;">
                                            <?php echo esc_html($preset['description']); ?>
                                        </p>
                                    <?php endif; ?>
                                    
                                    <!-- Preset Preview -->
                                    <div class="preset-preview" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem; margin: 1rem 0;">
                                        <?php 
                                        $preview_settings = ['admin_bar_background', 'menu_background', 'color_scheme'];
                                        foreach ($preview_settings as $setting): 
                                            $value = $preset['settings'][$setting] ?? '';
                                            $preview_color = $setting === 'color_scheme' ? ($value === 'dark' ? '#2c3e50' : '#3498db') : ($value ?: '#ddd');
                                        ?>
                                            <div style="height: 20px; background: <?php echo esc_attr($preview_color); ?>; border-radius: 4px;"></div>
                                        <?php endforeach; ?>
                                    </div>
                                    
                                    <!-- Last Modified -->
                                    <div style="font-size: 0.8rem; color: #999; margin-bottom: 1rem;">
                                        Last modified: <?php echo date('M j, Y \a\t g:i A', strtotime($preset['modified'])); ?>
                                    </div>
                                </div>
                                
                                <!-- Preset Actions -->
                                <div class="preset-actions" style="padding: 1rem 1.5rem; background: #f8f9fa; display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem;">
                                    <button onclick="presetManager.selectAndApply(<?php echo $preset['id']; ?>)" style="padding: 0.75rem; background: #28a745; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 0.9rem; transition: all 0.3s ease;">
                                        🎨 Apply
                                    </button>
                                    <div class="dropdown" style="position: relative;">
                                        <button onclick="togglePresetDropdown(<?php echo $preset['id']; ?>)" style="padding: 0.75rem; background: #6c757d; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 0.9rem; transition: all 0.3s ease; width: 100%;">
                                            ⚙️ More
                                        </button>
                                        <div id="dropdown-<?php echo $preset['id']; ?>" class="dropdown-menu" style="position: absolute; top: 100%; right: 0; background: white; border: 1px solid #ddd; border-radius: 6px; box-shadow: 0 5px 15px rgba(0,0,0,0.1); z-index: 1000; min-width: 150px; display: none;">
                                            <button onclick="presetManager.selectAndExport(<?php echo $preset['id']; ?>)" style="width: 100%; padding: 0.75rem; background: none; border: none; text-align: left; cursor: pointer; border-bottom: 1px solid #eee;">📤 Export</button>
                                            <button onclick="duplicatePreset(<?php echo $preset['id']; ?>)" style="width: 100%; padding: 0.75rem; background: none; border: none; text-align: left; cursor: pointer; border-bottom: 1px solid #eee;">📋 Duplicate</button>
                                            <button onclick="presetManager.selectAndDelete(<?php echo $preset['id']; ?>)" style="width: 100%; padding: 0.75rem; background: none; border: none; text-align: left; cursor: pointer; color: #dc3545;">🗑️ Delete</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        <?php endforeach; ?>
                        
                    <?php endif; ?>
                </div>
                
                <!-- Footer Help -->
                <div class="mas-preset-help" style="margin-top: 3rem; padding: 2rem; background: #f8f9fa; border-radius: 15px; border-left: 4px solid #667eea;">
                    <h3 style="margin: 0 0 1rem 0; color: #333;">💡 Quick Tips</h3>
                    <ul style="margin: 0; padding-left: 1.5rem; color: #666; line-height: 1.6;">
                        <li><strong>Keyboard Shortcuts:</strong> Ctrl+Shift+S (Save), Ctrl+Shift+L (Apply), Ctrl+Shift+E (Export)</li>
                        <li><strong>Export/Import:</strong> Share presets between sites by exporting as JSON files</li>
                        <li><strong>Live Preview:</strong> Changes are applied instantly with automatic page refresh</li>
                        <li><strong>Backup:</strong> Export your presets regularly as backups before major changes</li>
                    </ul>
                </div>
            </div>
        </div>
        
        <script>
        // Dropdown toggle functionality
        function togglePresetDropdown(presetId) {
            const dropdown = document.getElementById('dropdown-' + presetId);
            const allDropdowns = document.querySelectorAll('.dropdown-menu');
            
            // Close all other dropdowns
            allDropdowns.forEach(menu => {
                if (menu !== dropdown) {
                    menu.style.display = 'none';
                }
            });
            
            // Toggle current dropdown
            dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
        }
        
        // Close dropdowns when clicking outside
        document.addEventListener('click', function(event) {
            if (!event.target.closest('.dropdown')) {
                document.querySelectorAll('.dropdown-menu').forEach(menu => {
                    menu.style.display = 'none';
                });
            }
        });
        
        // Duplicate preset functionality
        function duplicatePreset(presetId) {
            // This would be implemented to create a copy of the preset
            if (window.masToast) {
                window.masToast.show('info', 'Duplicate feature coming soon!', 3000);
            }
        }
        
        // Add hover effects to cards
        document.addEventListener('DOMContentLoaded', function() {
            const cards = document.querySelectorAll('.mas-preset-card');
            cards.forEach(card => {
                card.addEventListener('mouseenter', function() {
                    this.style.transform = 'translateY(-5px)';
                    this.style.boxShadow = '0 15px 40px rgba(0,0,0,0.15)';
                });
                
                card.addEventListener('mouseleave', function() {
                    this.style.transform = 'translateY(0)';
                    this.style.boxShadow = '0 10px 30px rgba(0,0,0,0.1)';
                });
            });
            
            // Add hover effects to action buttons
            const actionBtns = document.querySelectorAll('.mas-preset-action-btn');
            actionBtns.forEach(btn => {
                btn.addEventListener('mouseenter', function() {
                    this.style.transform = 'translateY(-2px)';
                    this.style.background = 'rgba(255,255,255,0.3)';
                });
                
                btn.addEventListener('mouseleave', function() {
                    this.style.transform = 'translateY(0)';
                    this.style.background = 'rgba(255,255,255,0.2)';
                });
            });
        });
        </script>
        
        <style>
        .mas-preset-card {
            cursor: default;
        }
        
        .mas-preset-card:hover {
            cursor: default;
        }
        
        .preset-actions button:hover {
            opacity: 0.9;
            transform: translateY(-1px);
        }
        
        .dropdown-menu button:hover {
            background-color: #f8f9fa !important;
        }
        
        .mas-preset-action-btn:hover {
            font-weight: 500;
        }
        </style>
        <?php
    }
}

// Inicjalizuj wtyczkę
ModernAdminStylerV2::getInstance();
