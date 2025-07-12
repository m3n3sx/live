<?php
/**
 * Plugin Name:       WOOW! Admin Styler
 * Plugin URI:        https://woowstyler.com/
 * Description:       The most advanced and intuitive way to style your WordPress admin panel with semantic theme architecture.
 * Version:           3.0.0-beta.1
 * Author:            OOXO
 * Author URI:        https://ooxo.com/
 * License:           GPLv2 or later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       woow-styler
 * Domain Path:       /languages
 * Requires at least: 5.0
 * Tested up to:      6.4
 * Requires PHP:      7.4
 * Network:           false
 * 
 * @package WOOW_Admin_Styler
 * @version 3.0.0-beta.1
 * @author OOXO
 * @license GPL-2.0+
 */

if (!defined('ABSPATH')) {
    exit;
}

define('MAS_V2_VERSION', '2.2.0');
define('MAS_V2_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('MAS_V2_PLUGIN_URL', plugin_dir_url(__FILE__));
define('MAS_V2_PLUGIN_FILE', __FILE__);

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
    
    private $asset_loader;
    private $ajax_handler;
    private $settings_manager;
    
    private $cache_manager;
    private $css_generator;
    private $security_service;
    private $metrics_collector;
    
    private $settings_api;
    private $rest_api;
    
    private $component_adapter;
    
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
        $this->initServices();
        
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
        
        /*
         * 🎯 AJAX HANDLERS REMOVED FROM MAIN INIT
         * Reason: After consolidation, all AJAX handlers are automatically registered 
         * by CommunicationManager in its init() method (lines 48-66).
         * Manual registration here caused conflicts and double-registration.
         * 
         * All these handlers are now managed by:
         * - CommunicationManager->init() for automatic registration
         * - CoreEngine->getCommunicationManager() for service access
         */
        
        add_action('wp_ajax_mas_v2_clear_cache', [$this, 'ajaxClearCache']);
        
        add_action('admin_head', [$this, 'outputCustomStyles']);
        add_action('admin_head', [$this, 'addThemeLoaderScript'], 1); // Priority 1 - Execute early
        add_action('wp_head', [$this, 'outputFrontendStyles']);
        add_action('login_head', [$this, 'outputLoginStyles']);
        
        // REFACTOR: The admin_head hook for styles is no longer needed.
        // We now use the WordPress-native wp_add_inline_style().
        
        add_filter('admin_footer_text', [$this, 'customAdminFooter']);
        
        add_filter('admin_body_class', [$this, 'addAdminBodyClasses']);
        
        add_action('admin_footer', [$this, 'renderMenuSearchAndBlocks']);
        
        register_activation_hook(__FILE__, [$this, 'activate']);
        register_deactivation_hook(__FILE__, [$this, 'deactivate']);
        
        add_action('init', [$this, 'allowFramingForLocalhostViewer']);
        
        add_action('wp_ajax_mas_database_check', [$this, 'ajaxDatabaseCheck']);
        add_action('wp_ajax_mas_options_test', [$this, 'ajaxOptionsTest']);
        add_action('wp_ajax_mas_cache_check', [$this, 'ajaxCacheCheck']);
        add_action('wp_ajax_mas_clear_cache', [$this, 'ajaxClearCache']);
        
        add_action('wp_ajax_mas_save_live_settings', [$this, 'ajaxSaveLiveSettings']);
        add_action('wp_ajax_mas_get_live_settings', [$this, 'ajaxGetLiveSettings']);
        add_action('wp_ajax_mas_get_live_settings', [$this, 'ajaxGetLiveSettings']);
        add_action('wp_ajax_mas_reset_live_setting', [$this, 'ajaxResetLiveSetting']);
        
        add_action('wp_ajax_save_mas_v2_settings', [$this, 'ajaxSaveSettings']);
        add_action('wp_ajax_mas_live_preview', [$this, 'ajaxLivePreview']);
        
        // 🚀 ENTERPRISE FEATURE: Dynamic UI Configuration REST API
        add_action('rest_api_init', [$this, 'registerRestRoutes']);
    }
    
    /**
     * Allow framing for Localhost Viewer extension in Cursor.
     */
    public function allowFramingForLocalhostViewer() {
        remove_action('admin_init', 'send_frame_options_header');
        remove_action('login_init', 'send_frame_options_header');
    }

    /**
     * 🚀 ENTERPRISE FEATURE: Register REST API routes for dynamic UI configuration
     */
    public function registerRestRoutes() {
        // Endpoint do pobierania dynamicznej konfiguracji UI
        register_rest_route('woow/v1', '/components', [
            'methods' => 'GET',
            'callback' => [$this, 'handleGetComponentsConfig'],
            'permission_callback' => function () {
                return current_user_can('manage_options');
            }
        ]);

        // Endpoint do zapisywania ustawień (rozszerzony)
        register_rest_route('woow/v1', '/settings', [
            'methods' => 'POST',
            'callback' => [$this, 'handleSaveSettings'],
            'permission_callback' => function () {
                return current_user_can('manage_options');
            }
        ]);
    }

    /**
     * 🎯 SINGLE SOURCE OF TRUTH: Centralna konfiguracja wszystkich edytowalnych komponentów
     * Ta konfiguracja jest pobierana przez frontend do dynamicznego budowania mikro-paneli
     * 
     * @return array Kompletna konfiguracja wszystkich komponentów UI
     */
    private function getComponentsConfig() {
        return [
            'wpadminbar' => [
                'title' => 'Admin Bar',
                'icon' => '🎯',
                'selector' => '#wpadminbar',
                'tabs' => [
                    'colors' => [
                        'id' => 'colors',
                        'icon' => '🎨',
                        'label' => 'Colors',
                        'options' => [
                            [
                                'id' => 'surface_bar',
                                'label' => 'Background Color',
                                'type' => 'color',
                                'cssVar' => '--woow-surface-bar',
                                'default' => '#23282d'
                            ],
                            [
                                'id' => 'surface_bar_text',
                                'label' => 'Text Color',
                                'type' => 'color',
                                'cssVar' => '--woow-surface-bar-text',
                                'default' => '#ffffff'
                            ],
                            [
                                'id' => 'surface_bar_hover',
                                'label' => 'Hover Color',
                                'type' => 'color',
                                'cssVar' => '--woow-surface-bar-hover',
                                'default' => '#00a0d2'
                            ]
                        ]
                    ],
                    'layout' => [
                        'id' => 'layout',
                        'icon' => '📐',
                        'label' => 'Layout',
                        'options' => [
                            [
                                'id' => 'surface_bar_height',
                                'label' => 'Height',
                                'type' => 'slider',
                                'min' => 28,
                                'max' => 60,
                                'default' => 32,
                                'unit' => 'px',
                                'cssVar' => '--woow-surface-bar-height'
                            ],
                            [
                                'id' => 'surface_bar_font_size',
                                'label' => 'Font Size',
                                'type' => 'slider',
                                'min' => 11,
                                'max' => 16,
                                'default' => 13,
                                'unit' => 'px',
                                'cssVar' => '--woow-surface-bar-font-size'
                            ],
                            [
                                'id' => 'surface_bar_padding',
                                'label' => 'Padding',
                                'type' => 'slider',
                                'min' => 4,
                                'max' => 16,
                                'default' => 8,
                                'unit' => 'px',
                                'cssVar' => '--woow-surface-bar-padding'
                            ]
                        ]
                    ],
                    'effects' => [
                        'id' => 'effects',
                        'icon' => '✨',
                        'label' => 'Effects',
                        'options' => [
                            [
                                'id' => 'admin_bar_glassmorphism',
                                'label' => 'Glassmorphism Effect',
                                'type' => 'toggle',
                                'bodyClass' => 'woow-admin-bar-glassmorphism'
                            ],
                            [
                                'id' => 'admin_bar_shadow',
                                'label' => 'Drop Shadow',
                                'type' => 'toggle',
                                'bodyClass' => 'woow-admin-bar-shadow'
                            ],
                            [
                                'id' => 'admin_bar_gradient',
                                'label' => 'Gradient Background',
                                'type' => 'toggle',
                                'bodyClass' => 'woow-admin-bar-gradient'
                            ],
                            [
                                'id' => 'surface_bar_blur',
                                'label' => 'Blur Intensity',
                                'type' => 'slider',
                                'min' => 0,
                                'max' => 20,
                                'default' => 10,
                                'unit' => 'px',
                                'cssVar' => '--woow-surface-bar-blur'
                            ]
                        ]
                    ],
                    'visibility' => [
                        'id' => 'visibility',
                        'icon' => '👁️',
                        'label' => 'Visibility',
                        'options' => [
                            [
                                'id' => 'hide_wp_logo',
                                'label' => 'Hide WordPress Logo',
                                'type' => 'visibility',
                                'selector' => '#wp-admin-bar-wp-logo'
                            ],
                            [
                                'id' => 'hide_howdy',
                                'label' => 'Hide "Howdy" Text',
                                'type' => 'visibility',
                                'selector' => '#wp-admin-bar-my-account .ab-item'
                            ],
                            [
                                'id' => 'hide_update_notices',
                                'label' => 'Hide Update Notices',
                                'type' => 'visibility',
                                'selector' => '#wp-admin-bar-updates'
                            ]
                        ]
                    ]
                ]
            ],
            'adminmenuwrap' => [
                'title' => 'Admin Menu',
                'icon' => '📋',
                'selector' => '#adminmenuwrap',
                'tabs' => [
                    'colors' => [
                        'id' => 'colors',
                        'icon' => '🎨',
                        'label' => 'Colors',
                        'options' => [
                            [
                                'id' => 'surface_menu',
                                'label' => 'Background Color',
                                'type' => 'color',
                                'cssVar' => '--woow-surface-menu',
                                'default' => '#ffffff'
                            ],
                            [
                                'id' => 'surface_menu_text',
                                'label' => 'Text Color',
                                'type' => 'color',
                                'cssVar' => '--woow-surface-menu-text',
                                'default' => '#1e293b'
                            ],
                            [
                                'id' => 'surface_menu_hover',
                                'label' => 'Hover Color',
                                'type' => 'color',
                                'cssVar' => '--woow-surface-menu-hover',
                                'default' => '#6366f1'
                            ],
                            [
                                'id' => 'surface_menu_active',
                                'label' => 'Active Color',
                                'type' => 'color',
                                'cssVar' => '--woow-surface-menu-active',
                                'default' => '#ec4899'
                            ]
                        ]
                    ],
                    'layout' => [
                        'id' => 'layout',
                        'icon' => '📐',
                        'label' => 'Layout',
                        'options' => [
                            [
                                'id' => 'surface_menu_width',
                                'label' => 'Menu Width',
                                'type' => 'slider',
                                'min' => 150,
                                'max' => 250,
                                'default' => 160,
                                'unit' => 'px',
                                'cssVar' => '--woow-surface-menu-width'
                            ],
                            [
                                'id' => 'menu_floating',
                                'label' => 'Floating Menu',
                                'type' => 'toggle',
                                'bodyClass' => 'woow-menu-floating'
                            ]
                        ]
                    ]
                ]
            ],
            'wpwrap' => [
                'title' => 'Content Area',
                'icon' => '📄',
                'selector' => '#wpwrap',
                'tabs' => [
                    'layout' => [
                        'id' => 'layout',
                        'icon' => '📐',
                        'label' => 'Layout',
                        'options' => [
                            [
                                'id' => 'content_max_width',
                                'label' => 'Max Width',
                                'type' => 'slider',
                                'min' => 1200,
                                'max' => 1800,
                                'default' => 1400,
                                'unit' => 'px',
                                'cssVar' => '--woow-content-max-width'
                            ],
                            [
                                'id' => 'content_padding',
                                'label' => 'Padding',
                                'type' => 'slider',
                                'min' => 10,
                                'max' => 40,
                                'default' => 20,
                                'unit' => 'px',
                                'cssVar' => '--woow-content-padding'
                            ]
                        ]
                    ]
                ]
            ],
            'wpfooter' => [
                'title' => 'Footer',
                'icon' => '🦶',
                'selector' => '#wpfooter',
                'tabs' => [
                    'colors' => [
                        'id' => 'colors',
                        'icon' => '🎨',
                        'label' => 'Colors',
                        'options' => [
                            [
                                'id' => 'footer_bg',
                                'label' => 'Background Color',
                                'type' => 'color',
                                'cssVar' => '--woow-surface-footer',
                                'default' => '#f1f1f1'
                            ],
                            [
                                'id' => 'footer_text',
                                'label' => 'Text Color',
                                'type' => 'color',
                                'cssVar' => '--woow-surface-footer-text',
                                'default' => '#666666'
                            ]
                        ]
                    ],
                    'visibility' => [
                        'id' => 'visibility',
                        'icon' => '👁️',
                        'label' => 'Visibility',
                        'options' => [
                            [
                                'id' => 'hide_footer',
                                'label' => 'Hide Footer',
                                'type' => 'visibility',
                                'selector' => '#wpfooter'
                            ],
                            [
                                'id' => 'hide_version',
                                'label' => 'Hide Version Info',
                                'type' => 'visibility',
                                'selector' => '#footer-thankyou'
                            ]
                        ]
                    ]
                ]
            ],
            'postbox' => [
                'title' => 'Post Boxes',
                'icon' => '📦',
                'selector' => '.postbox',
                'tabs' => [
                    'colors' => [
                        'id' => 'colors',
                        'icon' => '🎨',
                        'label' => 'Colors',
                        'options' => [
                            [
                                'id' => 'postbox_bg',
                                'label' => 'Background Color',
                                'type' => 'color',
                                'cssVar' => '--woow-surface-postbox',
                                'default' => '#ffffff'
                            ],
                            [
                                'id' => 'postbox_border',
                                'label' => 'Border Color',
                                'type' => 'color',
                                'cssVar' => '--woow-surface-postbox-border',
                                'default' => '#e0e0e0'
                            ],
                            [
                                'id' => 'postbox_text',
                                'label' => 'Text Color',
                                'type' => 'color',
                                'cssVar' => '--woow-surface-postbox-text',
                                'default' => '#333333'
                            ]
                        ]
                    ],
                    'layout' => [
                        'id' => 'layout',
                        'icon' => '📐',
                        'label' => 'Layout',
                        'options' => [
                            [
                                'id' => 'postbox_radius',
                                'label' => 'Border Radius',
                                'type' => 'slider',
                                'min' => 0,
                                'max' => 25,
                                'default' => 8,
                                'unit' => 'px',
                                'cssVar' => '--woow-radius-postbox'
                            ],
                            [
                                'id' => 'postbox_padding',
                                'label' => 'Padding',
                                'type' => 'slider',
                                'min' => 5,
                                'max' => 30,
                                'default' => 15,
                                'unit' => 'px',
                                'cssVar' => '--woow-surface-postbox-padding'
                            ],
                            [
                                'id' => 'postbox_margin',
                                'label' => 'Margin',
                                'type' => 'slider',
                                'min' => 0,
                                'max' => 20,
                                'default' => 10,
                                'unit' => 'px',
                                'cssVar' => '--woow-surface-postbox-margin'
                            ]
                        ]
                    ],
                    'effects' => [
                        'id' => 'effects',
                        'icon' => '✨',
                        'label' => 'Effects',
                        'options' => [
                            [
                                'id' => 'postbox_shadow',
                                'label' => 'Drop Shadow',
                                'type' => 'toggle',
                                'bodyClass' => 'woow-postbox-shadow'
                            ],
                            [
                                'id' => 'postbox_glassmorphism',
                                'label' => 'Glassmorphism',
                                'type' => 'toggle',
                                'bodyClass' => 'woow-postbox-glassmorphism'
                            ],
                            [
                                'id' => 'postbox_3d_hover',
                                'label' => '3D Hover Effect',
                                'type' => 'toggle',
                                'bodyClass' => 'woow-postbox-3d-hover'
                            ]
                        ]
                    ]
                ]
            ]
        ];
    }

    /**
     * 🌐 REST API Handler: Zwraca konfigurację komponentów
     */
    public function handleGetComponentsConfig() {
        $config = $this->getComponentsConfig();
        
        return new WP_REST_Response([
            'success' => true,
            'data' => $config,
            'timestamp' => current_time('timestamp'),
            'version' => MAS_V2_VERSION
        ], 200);
    }

    /**
     * 🌐 REST API Handler: Zapisuje ustawienia
     */
    public function handleSaveSettings(WP_REST_Request $request) {
        $settings = $request->get_json_params();
        
        if (empty($settings)) {
            return new WP_REST_Response([
                'success' => false,
                'message' => 'No settings provided'
            ], 400);
        }

        // Get current settings to merge with
        $current_settings = $this->getSettings();
        
        // Use intelligent schema-driven sanitization
        $sanitized_settings = $this->sanitizeSettings($settings, $current_settings);

        // Save to WordPress options
        update_option('mas_v2_settings', $sanitized_settings);

        return new WP_REST_Response([
            'success' => true,
            'message' => 'Settings saved successfully',
            'saved_settings' => $sanitized_settings
        ], 200);
    }

    /**
     * REFACTOR: A robust, schema-driven sanitization method.
     * It automatically sanitizes incoming data based on the 'type' defined
     * in the central components config, making it future-proof.
     *
     * @param array $settings Raw settings from the request.
     * @param array $current_settings Current saved settings.
     * @return array Sanitized settings.
     */
    private function sanitizeSettings($settings, $current_settings) {
        $sanitized = $current_settings;
        $schema = $this->getComponentsConfig();

        // Flatten the schema into a key => option_details map for easy lookup.
        $options_map = [];
        foreach ($schema as $component) {
            if (isset($component['tabs'])) {
                foreach ($component['tabs'] as $tab) {
                    if (isset($tab['options'])) {
                        foreach ($tab['options'] as $option) {
                            $options_map[$option['id']] = $option;
                        }
                    }
                }
            }
        }

        foreach ($settings as $key => $value) {
            $sanitized_key = sanitize_key($key);
            
            if (!isset($options_map[$sanitized_key])) {
                continue; // Ignore unknown settings for security.
            }

            switch ($options_map[$sanitized_key]['type']) {
                case 'color':
                    $sanitized[$sanitized_key] = sanitize_hex_color($value);
                    break;
                case 'toggle':
                case 'visibility':
                    $sanitized[$sanitized_key] = filter_var($value, FILTER_VALIDATE_BOOLEAN);
                    break;
                case 'slider':
                    $sanitized[$sanitized_key] = is_float($value) ? floatval($value) : intval($value);
                    break;
                default: // Includes any other text-based values.
                    $sanitized[$sanitized_key] = sanitize_text_field($value);
                    break;
            }
        }

        return $sanitized;
    }

    /**
     * ========================================================================
     * 🚀 FAZA 3: FOUC PREVENTION (Bootstrap 5.3+ / VueUse Style)
     * ========================================================================
     * Injects a blocking script in the <head> to prevent FOUC (Flash of Unstyled Content).
     * This sets the theme before the body even starts rendering.
     * 
     * ARCHITEKTURA: localStorage -> data-theme attribute BEFORE body render
     * REZULTAT: Zero mignięcia, instant theme application
     */
    public function addThemeLoaderScript() {
        if ($this->isLoginPage()) {
            return;
        }

        echo '<script>
            /**
             * 🚀 FOUC PREVENTION: Enterprise-Grade Theme Loader (VueUse Style)
             * Ustawia motyw PRZED renderowaniem body, eliminując migotanie.
             * ARCHITEKTURA: localStorage -> data-theme attribute BEFORE body render
             * SEMANTIC VARIABLES: Uses --woow-{category}-{role} naming convention
             */
            (function() {
                try {
                    const theme = localStorage.getItem("woow-theme") || "light";
                    console.log("🎨 WOOW! FOUC Prevention: Setting theme to", theme);
                    document.documentElement.setAttribute("data-theme", theme);
                    
                    document.documentElement.classList.add("woow-theme-" + theme);
                    
                    console.log("✅ WOOW! Theme set:", document.documentElement.getAttribute("data-theme"));
                } catch (e) {
                    console.error("❌ WOOW! FOUC Prevention error:", e);
                    document.documentElement.setAttribute("data-theme", "light");
                    document.documentElement.classList.add("woow-theme-light");
                }
            })();
        </script>';
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
     * 🏗️ Inicjalizacja serwisów przez CoreEngine (UPDATED)
     * 🎯 NEW CONSOLIDATED ARCHITECTURE: 8 strategic services with dependency injection
     */
    public function initServices() {
        $coreEngine = \ModernAdminStyler\Services\CoreEngine::getInstance();
        
        // Initialize all core services in proper dependency order
        $coreEngine->initialize();
        
        // === CONSOLIDATED SERVICES (8 TOTAL) ===
        
        // 1. Settings Management (includes presets)
        $this->settings_manager = $coreEngine->getSettingsManager();
        $this->preset_manager = $coreEngine->getSettingsManager(); // Consolidated into SettingsManager
        $this->component_adapter = $coreEngine->getSettingsManager(); // Integrated into SettingsManager
        
        // 2. Cache & Performance Management (includes metrics)
        $this->cache_manager = $coreEngine->getCacheManager();
        $this->metrics_collector = $coreEngine->getCacheManager(); // Consolidated into CacheManager
        $this->analytics_engine = $coreEngine->getCacheManager(); // Consolidated into CacheManager
        $this->memory_optimizer = $coreEngine->getCacheManager(); // Consolidated into CacheManager
        
        // 3. Security Management
        $this->security_service = $coreEngine->getSecurityManager();
        
        // 4. Style Generation
        $this->css_generator = $coreEngine->getStyleGenerator();
        
        // 5. Communication Management (includes API + AJAX)
        $this->ajax_handler = $coreEngine->getCommunicationManager(); // Consolidated into CommunicationManager
        $this->settings_api = $coreEngine->getCommunicationManager(); // Consolidated into CommunicationManager
        $this->rest_api = $coreEngine->getCommunicationManager(); // Consolidated into CommunicationManager
        
        // 6. Admin Interface (includes dashboard + hooks + gutenberg)
        $this->hooks_manager = $coreEngine->getAdminInterface(); // Consolidated into AdminInterface
        $this->gutenberg_manager = $coreEngine->getAdminInterface(); // Consolidated into AdminInterface
        
        // 7. Asset Loading
        $this->asset_loader = $coreEngine->getAssetLoader();
        
        // === REMOVED/DEPRECATED SERVICES ===
        $this->integration_manager = null; // Removed - functionality distributed
        
        error_log('🎯 MAS V2: New consolidated architecture initialized - 8 strategic services');
    }
    
    /**
     * Aktywacja wtyczki
     */
    public function activate() {
        $defaults = $this->getDefaultSettings();
        add_option('mas_v2_settings', $defaults);
        
        if (method_exists($this, 'clearCache')) {
            $this->clearCache();
        }
    }
    
    /**
     * Deaktywacja wtyczki
     */
    public function deactivate() {
        $this->clearCache();
    }
    
    /**
     * Ładowanie tłumaczeń
     */
    public function loadTextdomain() {
        load_plugin_textdomain('woow-admin-styler', false, dirname(plugin_basename(__FILE__)) . '/languages');
    }
    
    /**
     * 🎯 FAZA 1: Natywna integracja z menu WordPress
     * Nowa architektura: Customizer + Settings API + REST API
     */
    public function addAdminMenu() {
        add_menu_page(
            __('WOOW! Admin Styler - General', 'woow-admin-styler'), // Tytuł strony
            __('WOOW! Admin', 'woow-admin-styler'), // Tytuł w menu
            'manage_options',
            'woow-v2-general', // Slug strony głównej
            [$this, 'renderAdminPage'], // Funkcja renderująca
            'data:image/svg+xml;base64,' . base64_encode('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/></svg>'),
            30
        );

        add_submenu_page(
            'woow-v2-general', // Slug rodzica
            __('General Settings', 'woow-admin-styler'),
            __('General', 'woow-admin-styler'),
            'manage_options',
            'woow-v2-general', // Ten sam slug co rodzic
            [$this, 'renderAdminPage']
        );

        add_submenu_page(
            'woow-v2-general',
            __('Admin Bar Settings', 'woow-admin-styler'),
            __('Admin Bar', 'woow-admin-styler'),
            'manage_options',
            'woow-v2-admin-bar', // Nowy, unikalny slug
            [$this, 'renderAdminPage']
        );

        add_submenu_page(
            'woow-v2-general',
            __('Menu Settings', 'woow-admin-styler'),
            __('Menu', 'woow-admin-styler'),
            'manage_options',
            'woow-v2-menu',
            [$this, 'renderAdminPage']
        );

        add_submenu_page(
            'woow-v2-general',
            __('Typography Settings', 'woow-admin-styler'),
            __('Typography', 'woow-admin-styler'),
            'manage_options',
            'woow-v2-typography',
            [$this, 'renderAdminPage']
        );

        add_submenu_page(
            'woow-v2-general',
            __('Advanced Settings', 'woow-admin-styler'),
            __('Advanced', 'woow-admin-styler'),
            'manage_options',
            'woow-v2-advanced',
            [$this, 'renderAdminPage']
        );

        add_submenu_page(
            'woow-v2-general',
            __('🚀 Faza 1 Demo - WordPress API Integration', 'woow-admin-styler'),
            __('🚀 Faza 1 Demo', 'woow-admin-styler'),
            'manage_options',
            'woow-v2-phase1-demo',
            [$this, 'renderPhase1Demo']
        );

        add_submenu_page(
            'woow-v2-general',
            __('🎨 Faza 2 Demo - WordPress Components', 'woow-admin-styler'),
            __('🎨 Faza 2 Demo', 'woow-admin-styler'),
            'manage_options',
            'woow-v2-phase2-demo',
            [$this, 'renderPhase2Demo']
        );
        
        add_submenu_page(
            'woow-v2-general',
            __('🔗 Faza 3 Demo - Ecosystem Integration', 'woow-admin-styler'),
            __('🔗 Faza 3 Demo', 'woow-admin-styler'),
            'manage_options',
            'woow-v2-phase3-demo',
            [$this, 'renderPhase3Demo']
        );
        
        add_submenu_page(
            'woow-v2-general',
            __('🚀 Faza 4 Demo - Data-Driven Architecture & Security', 'woow-admin-styler'),
            __('🚀 Faza 4 Demo', 'woow-admin-styler'),
            'manage_options',
            'woow-v2-phase4-demo',
            [$this, 'renderPhase4Demo']
        );
        
        add_submenu_page(
            'woow-v2-general',
            __('🚀 Faza 5 Demo - Advanced Performance & UX', 'woow-admin-styler'),
            __('🚀 Faza 5 Demo', 'woow-admin-styler'),
            'manage_options',
            'woow-v2-phase5-demo',
            [$this, 'renderPhase5Demo']
        );
        
        add_submenu_page(
            'woow-v2-general',
            __('🎯 Enterprise Dashboard - Analytics & Security', 'woow-admin-styler'),
            __('🎯 Enterprise Dashboard', 'woow-admin-styler'),
            'manage_options',
            'woow-v2-enterprise-dashboard',
            [$this, 'renderEnterpriseDashboard']
        );
        
        /*
        add_submenu_page(
            'mas-v2-general',
            __('🎨 Style Presets - Save & Load Configurations', 'woow-admin-styler'),
            __('🎨 Style Presets', 'woow-admin-styler'),
            'manage_options',
            'mas-v2-presets',
            [$this, 'renderAdminPage']
        );
        */

        add_submenu_page(
            'woow-v2-general',
            '🎯 Phase 6: Interface Consolidation',
            '🎯 Phase 6: Consolidation',
            'manage_options',
            'woow-v2-phase6-consolidation',
            [$this, 'renderPhase6Demo']
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
        $this->asset_loader->enqueueAdminAssets($hook);
        
        // REFACTOR: Use the canonical WordPress way to add inline styles.
        // This guarantees our custom styles are loaded AFTER the main stylesheet,
        // ensuring they correctly override the defaults.
        // Note: Customizer styles removed - using Live Edit Mode instead
        
        $woow_pages = [
            'toplevel_page_woow-v2-general',
            'woow-admin_page_woow-v2-general',
            'woow-admin_page_woow-v2-admin-bar',
            'woow-admin_page_woow-v2-menu',
            'woow-admin_page_woow-v2-typography',
            'woow-admin_page_woow-v2-advanced'
        ];
        
        if (in_array($hook, $woow_pages)) {
        wp_localize_script('woow-v2-admin', 'woowV2', [
            'ajaxUrl' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('woow_v2_nonce'),
            'restUrl' => rest_url('woow/v1/'),
            'restNonce' => wp_create_nonce('wp_rest'),
            'settings' => $this->getSettings(),
            'strings' => [
                'saving' => __('Zapisywanie...', 'woow-admin-styler'),
                'saved' => __('Ustawienia zostały zapisane!', 'woow-admin-styler'),
                'error' => __('Wystąpił błąd podczas zapisywania', 'woow-admin-styler'),
                'confirm_reset' => __('Czy na pewno chcesz przywrócić domyślne ustawienia?', 'woow-admin-styler'),
                'resetting' => __('Resetowanie...', 'woow-admin-styler'),
                'reset_success' => __('Ustawienia zostały przywrócone!', 'woow-admin-styler'),
            ]
        ]);
        }
    }
    
    /**
     * 🌐 Ładuje globalne zasoby na wszystkich stronach wp-admin
     */
    public function enqueueGlobalAssets($hook) {
        $woow_pages = [
            'toplevel_page_woow-v2-general',
            'woow-admin_page_woow-v2-general',
            'woow-admin_page_woow-v2-admin-bar',
            'woow-admin_page_woow-v2-menu',
            'woow-admin_page_woow-v2-typography',
            'woow-admin_page_woow-v2-advanced',
        ];
        if (in_array($hook, $woow_pages)) {
            return;
        }
        
        $this->asset_loader->enqueueGlobalAssets($hook);
        
        // REFACTOR: Use the canonical WordPress way to add inline styles.
        // This guarantees our custom styles are loaded AFTER the main stylesheet,
        // ensuring they correctly override the defaults.
        // Note: Customizer styles removed - using Live Edit Mode instead
        
        add_action('admin_head', [$this->asset_loader, 'addEarlyLoadingProtection'], 1);
        
        if (!$this->isLoginPage() && is_admin()) {
            $woow_pages = [
                'toplevel_page_woow-v2-general',
                'woow-admin_page_woow-v2-general',
                'woow-admin_page_woow-v2-admin-bar',
                'woow-admin_page_woow-v2-menu',
                'woow-admin_page_woow-v2-typography',
                'woow-admin_page_woow-v2-advanced'
            ];
            
            if (!in_array($hook, $woow_pages)) {
                $settings = $this->getSettings();
                error_log('🔍 MAS V2 PHP Debug - Settings being passed to JS: ' . print_r($settings, true));
                error_log('🔍 MAS V2 PHP Debug - admin_bar_floating value: ' . ($settings['admin_bar_floating'] ?? 'NOT SET'));
                
                // 🎯 NAPRAWKA: Używaj poprawnego handle skryptu (woow-core-global zamiast woow-v2-global)
                wp_localize_script('woow-core-global', 'woowV2Global', [
                    'ajaxUrl' => admin_url('admin-ajax.php'),
                    'nonce' => wp_create_nonce('woow_v2_nonce'),
                    'restUrl' => rest_url('woow/v1/'),
                    'restNonce' => wp_create_nonce('wp_rest'),
                    'settings' => $settings
                ]);
            }
        }
    }
    
    /**
     * ⚠️ DEPRECATED: Ta metoda jest teraz w AssetLoader serwisie
     */
    public function addEarlyLoadingProtection() {
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
        $current_page_slug = $_GET['page'] ?? 'woow-v2-general';
        $active_tab = str_replace('woow-v2-', '', $current_page_slug);

        $valid_tabs = ['general', 'admin-bar', 'menu', 'typography', 'advanced']; // 🚧 3d-effects tymczasowo ukryte
        if (!in_array($active_tab, $valid_tabs)) {
        $active_tab = 'general';
        }

        $settings = $this->getSettings();
        $tabs = $this->getTabs();
        $plugin_instance = $this;
        
        require_once MAS_V2_PLUGIN_DIR . 'src/views/admin-page.php';
            }

    /**
     * 🚀 FAZA 1: Renderowanie strony demo pokazującej nową architekturę
     */
    public function renderPhase1Demo() {
        require_once MAS_V2_PLUGIN_DIR . 'src/views/phase1-demo.php';
    }

    /**
     * 🎨 FAZA 2: Renderowanie strony demo pokazującej WordPress Components
     */
    public function renderPhase2Demo() {
        if (!current_user_can('manage_options')) {
            wp_die(__('You do not have sufficient permissions to access this page.'));
        }
        
        $coreEngine = \ModernAdminStyler\Services\CoreEngine::getInstance();
        $component_adapter = $coreEngine->getSettingsManager(); // Consolidated into SettingsManager
        $settings_manager = $coreEngine->getSettingsManager();
        
        echo '<style>
            .wrap { max-width: none; }
            .phase2-container { max-width: 1400px; margin: 0 auto; }
        </style>';
        
        require_once MAS_V2_PLUGIN_DIR . 'src/views/admin-page-phase2.php';
    }
    
    /**
     * 🔗 FAZA 3: Renderowanie strony demo pokazującej Ecosystem Integration
     */
    public function renderPhase3Demo() {
        if (!current_user_can('manage_options')) {
            wp_die(__('You do not have sufficient permissions to access this page.'));
        }
        
        echo '<style>
            .wrap { max-width: none; }
            .woow-admin-page { max-width: 1400px; margin: 0 auto; }
        </style>';
        
        require_once MAS_V2_PLUGIN_DIR . 'src/views/admin-page-phase3.php';
    }
    
    /**
     * 🚀 FAZA 4: Renderowanie strony demo pokazującej Data-Driven Architecture & Security
     */
    public function renderPhase4Demo() {
        if (!current_user_can('manage_options')) {
            wp_die(__('You do not have sufficient permissions to access this page.'));
        }
        
        echo '<style>
            .wrap { max-width: none; }
            .woow-admin-page { max-width: 1400px; margin: 0 auto; }
        </style>';
        
        require_once MAS_V2_PLUGIN_DIR . 'src/views/admin-page-phase4-demo.php';
    }
    
    /**
     * 🚀 FAZA 5: Renderowanie strony demo pokazującej Advanced Performance & UX
     */
    public function renderPhase5Demo() {
        if (!current_user_can('manage_options')) {
            wp_die(__('You do not have sufficient permissions to access this page.'));
        }
        
        $this->coreEngine = \ModernAdminStyler\Services\CoreEngine::getInstance();
        
        echo '<style>
            .wrap { max-width: none; }
            .woow-admin-page { max-width: 1400px; margin: 0 auto; }
        </style>';
        
        require_once MAS_V2_PLUGIN_DIR . 'src/views/admin-page-phase5-demo.php';
    }
    
    /**
     * 🎯 FAZA 6: Renderowanie Enterprise Dashboard
     */
    public function renderEnterpriseDashboard() {
        if (!current_user_can('manage_options')) {
            wp_die(__('You do not have sufficient permissions to access this page.'));
        }
        
        $this->coreEngine = \ModernAdminStyler\Services\CoreEngine::getInstance();
        
        echo '<style>
            .wrap { max-width: none; }
            .woow-v2-enterprise-dashboard { max-width: none; margin: 0; }
        </style>';
        
        require_once MAS_V2_PLUGIN_DIR . 'src/views/admin-page-phase6-dashboard.php';
    }

    /**
     * 🗑️ USUNIĘTE: renderTabPage() - martwy kod zastąpiony przez renderAdminPage()
     * Ta metoda była pozostałością po starym systemie zakładek
     */
    
    /**
     * Legacy: AJAX Zapisywanie ustawień
     */
    
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
        
        $plugin_enabled = isset($settings['enable_plugin']) ? $settings['enable_plugin'] : false;  // 🔒 DOMYŚLNIE WYŁĄCZONE
        
        if (!$plugin_enabled) {
            error_log('MAS V2: Plugin disabled by user - applying minimal safe styles');
            
            $minimal_css = ':root { 
                --woow-accent-primary: #0073aa; 
                --woow-surface-bar-height: 32px; 
                --woow-surface-menu-width: 160px; 
            }';
            wp_add_inline_style('woow-v2-global', $minimal_css);
            return;
        }
        
        // NAPRAWKA: Użyj WordPress API zamiast echo
        $css_vars = $this->generateCSSVariables($settings);
        
        // Dodaj do <head> z wysokim priorytetem
        add_action('wp_head', function() use ($css_vars) {
            echo "<style id='woow-live-styles'>{$css_vars}</style>";
        }, 1);
        
        // Dodaj również przez WordPress API
        wp_add_inline_style('woow-v2-main', $css_vars);

        if (!empty($settings['custom_js'])) {
            if (current_user_can('manage_options')) {
                $safe_js = $this->security_service->sanitizeInput($settings['custom_js'], 'js');
                if (!empty($safe_js) && strpos($safe_js, '/* Dangerous') !== 0 && strpos($safe_js, '/* JavaScript too large') !== 0) {
                    wp_add_inline_script('woow-v2-global', $safe_js);
                }
            }
        }
        
        $body_classes_js = $this->generateBodyClassesJS($settings);
        if (!empty($body_classes_js)) {
            wp_add_inline_script('woow-v2-global', $body_classes_js);
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
        
        echo "<style id='woow-v2-frontend-styles'>\n";
        echo $this->generateFrontendCSS($settings);
        echo "\n</style>\n";
    }
    
    /**
     * Generuje zmienne CSS dla dynamicznego zarządzania layoutem
     */
    private function generateCSSVariables($settings) {
        $css = ':root {';
        
        $colorScheme = $settings['color_scheme'] ?? 'light';
        
        $colorPalettes = $this->getAdaptiveColorPalettes();
        $currentPalette = $settings['color_palette'] ?? 'modern';
        
        $lightColors = $colorPalettes[$currentPalette]['light'] ?? $colorPalettes['modern-blue']['light'];
        $darkColors = $colorPalettes[$currentPalette]['dark'] ?? $colorPalettes['modern-blue']['dark'];
        
        if ($colorScheme === 'light') {
            $activeColors = $lightColors;
        } elseif ($colorScheme === 'dark') {
            $activeColors = $darkColors;
        } else {
            $activeColors = $lightColors;
        }
        
        $css .= "--woow-accent-primary: {$activeColors['primary']};";
        $css .= "--woow-accent-secondary: {$activeColors['secondary']};";
        $css .= "--woow-accent-primary: {$activeColors['accent']};";
        $css .= "--woow-bg-primary: {$activeColors['background']};";
        $css .= "--woow-bg-secondary: {$activeColors['surface']};";
        $css .= "--woow-text-primary: {$activeColors['text']};";
        $css .= "--woow-text-secondary: {$activeColors['text_secondary']};";
        $css .= "--woow-border-primary: {$activeColors['border']};";
        
        $css .= "--woow-glass-bg: " . $this->hexToRgba($activeColors['surface'], 0.85) . ";";
        $css .= "--woow-glass-bg: " . $this->hexToRgba($activeColors['surface'], 0.6) . ";";
        $css .= "--woow-glass-border: " . $this->hexToRgba($activeColors['text'], 0.2) . ";";
        
        $css .= "--woow-gradient-start: {$activeColors['primary']};";
        $css .= "--woow-gradient-end: {$activeColors['secondary']};";
        $css .= "--woow-accent-glow: " . $this->hexToRgba($activeColors['primary'], 0.6) . ";";
        
        $menuWidth = isset($settings['menu_width']) ? $settings['menu_width'] : 160;
        $css .= "--woow-surface-menu-width: {$menuWidth}px;";
        $css .= "--woow-surface-menu-width-collapsed: 36px;";
        
        $adminBarHeight = isset($settings['admin_bar_height']) ? $settings['admin_bar_height'] : 32;
        $css .= "--woow-surface-bar-height: {$adminBarHeight}px;";
        
        $marginType = $settings['menu_margin_type'] ?? 'all';
        if ($marginType === 'all') {
            $marginAll = $settings['menu_margin_all'] ?? $settings['menu_margin'] ?? 20;
            $css .= "--woow-space-menu-top: {$marginAll}px;";
            $css .= "--woow-space-menu-right: {$marginAll}px;";
            $css .= "--woow-space-menu-bottom: {$marginAll}px;";
            $css .= "--woow-space-menu-left: {$marginAll}px;";
        } else {
            $marginTop = $settings['menu_margin_top'] ?? 20;
            $marginRight = $settings['menu_margin_right'] ?? 20;
            $marginBottom = $settings['menu_margin_bottom'] ?? 20;
            $marginLeft = $settings['menu_margin_left'] ?? 20;
            $css .= "--woow-space-menu-top: {$marginTop}px;";
            $css .= "--woow-space-menu-right: {$marginRight}px;";
            $css .= "--woow-space-menu-bottom: {$marginBottom}px;";
            $css .= "--woow-space-menu-left: {$marginLeft}px;";
        }
        
        $oldMargin = $settings['menu_margin'] ?? 20;
        $css .= "--woow-space-menu: {$oldMargin}px;";
        
        $adminBarMarginType = $settings['admin_bar_margin_type'] ?? 'all';
        if ($adminBarMarginType === 'all') {
            $adminBarMargin = $settings['admin_bar_margin'] ?? 10;
            $css .= "--woow-space-bar-top: {$adminBarMargin}px;";
            $css .= "--woow-space-bar-right: {$adminBarMargin}px;";
            $css .= "--woow-space-bar-bottom: {$adminBarMargin}px;";
            $css .= "--woow-space-bar-left: {$adminBarMargin}px;";
        } else {
            $adminBarMarginTop = $settings['admin_bar_margin_top'] ?? 10;
            $adminBarMarginRight = $settings['admin_bar_margin_right'] ?? 10;
            $adminBarMarginBottom = $settings['admin_bar_margin_bottom'] ?? 10;
            $adminBarMarginLeft = $settings['admin_bar_margin_left'] ?? 10;
            $css .= "--woow-space-bar-top: {$adminBarMarginTop}px;";
            $css .= "--woow-space-bar-right: {$adminBarMarginRight}px;";
            $css .= "--woow-space-bar-bottom: {$adminBarMarginBottom}px;";
            $css .= "--woow-space-bar-left: {$adminBarMarginLeft}px;";
        }
        
        $oldAdminBarMargin = isset($settings['admin_bar_detached_margin']) ? $settings['admin_bar_detached_margin'] : 10;
        $css .= "--woow-space-bar: {$oldAdminBarMargin}px;";
        
        $menuBorderRadius = $settings['menu_border_radius_all'] ?? 0;
        $css .= "--woow-radius-menu: {$menuBorderRadius}px;";
        
        $adminBarBorderRadius = $settings['admin_bar_border_radius'] ?? 0;
        $css .= "--woow-radius-bar: {$adminBarBorderRadius}px;";
        
        $menuMarginType = $settings['menu_margin_type'] ?? 'all';
        if ($menuMarginType === 'all') {
            $menuMargin = $settings['menu_margin'] ?? 10;
            $css .= "--woow-space-menu-floating-top: {$menuMargin}px;";
            $css .= "--woow-space-menu-floating-right: {$menuMargin}px;";
            $css .= "--woow-space-menu-floating-bottom: {$menuMargin}px;";
            $css .= "--woow-space-menu-floating-left: {$menuMargin}px;";
        } else {
            $menuMarginTop = $settings['menu_margin_top'] ?? 10;
            $menuMarginRight = $settings['menu_margin_right'] ?? 10;
            $menuMarginBottom = $settings['menu_margin_bottom'] ?? 10;
            $menuMarginLeft = $settings['menu_margin_left'] ?? 10;
            $css .= "--woow-space-menu-floating-top: {$menuMarginTop}px;";
            $css .= "--woow-space-menu-floating-right: {$menuMarginRight}px;";
            $css .= "--woow-space-menu-floating-bottom: {$menuMarginBottom}px;";
            $css .= "--woow-space-menu-floating-left: {$menuMarginLeft}px;";
        }

        $adminBarBackground = $settings['admin_bar_background'] ?? '#23282d';
        $adminBarTextColor = $settings['admin_bar_text_color'] ?? '#ffffff';
        $adminBarHoverColor = $settings['admin_bar_hover_color'] ?? '#46a6d8';
        $adminBarFontSize = $settings['admin_bar_font_size'] ?? 13;
        $adminBarPadding = $settings['admin_bar_padding'] ?? 8;
        $adminBarBorderRadiusAll = $settings['admin_bar_border_radius'] ?? 0;
        
        $css .= "--woow-surface-bar: {$adminBarBackground};";
        $css .= "--woow-surface-bar-text: {$adminBarTextColor};";
        $css .= "--woow-surface-bar-hover: {$adminBarHoverColor};";
        $css .= "--woow-surface-bar-font-size: {$adminBarFontSize}px;";
        $css .= "--woow-surface-bar-padding: {$adminBarPadding}px;";
        $css .= "--woow-radius-bar-all: {$adminBarBorderRadiusAll}px;";

        $menuTextColor = $settings['menu_text_color'] ?? $activeColors['text'];
        $menuHoverColor = $settings['menu_hover_color'] ?? $activeColors['primary'];
        $menuActiveBackground = $settings['menu_active_background'] ?? $activeColors['accent'];
        $menuActiveTextColor = $settings['menu_active_text_color'] ?? '#ffffff';
        $menuItemHeight = $settings['menu_item_height'] ?? 34;
        $menuBorderRadiusAll = $settings['menu_border_radius_all'] ?? 0;
        
        $css .= "--woow-surface-menu-text: {$menuTextColor};";
        $css .= "--woow-surface-menu-hover: {$menuHoverColor};";
        $css .= "--woow-surface-menu-active: {$menuActiveBackground};";
        $css .= "--woow-surface-menu-active-text: {$menuActiveTextColor};";
        $css .= "--woow-surface-menu-item-height: {$menuItemHeight}px;";
        $css .= "--woow-radius-menu-all: {$menuBorderRadiusAll}px;";

        $menuBackground = isset($settings['menu_background']) ? $settings['menu_background'] : $activeColors['surface'];
        $css .= "--woow-surface-menu: {$menuBackground};";
        
        $css .= '}';
        

        
        $css .= 'body.woow-dark-mode {';
        $css .= "--woow-accent-primary: {$darkColors['primary']};";
        $css .= "--woow-accent-secondary: {$darkColors['secondary']};";
        $css .= "--woow-accent-primary: {$darkColors['accent']};";
        $css .= "--woow-bg-primary: {$darkColors['background']};";
        $css .= "--woow-bg-secondary: {$darkColors['surface']};";
        $css .= "--woow-text-primary: {$darkColors['text']};";
        $css .= "--woow-text-secondary: {$darkColors['text_secondary']};";
        $css .= "--woow-border-primary: {$darkColors['border']};";
        $css .= "--woow-glass-bg: " . $this->hexToRgba($darkColors['surface'], 0.85) . ";";
        $css .= "--woow-glass-bg: " . $this->hexToRgba($darkColors['surface'], 0.6) . ";";
        $css .= "--woow-glass-border: " . $this->hexToRgba($darkColors['text'], 0.2) . ";";
        $css .= "--woow-gradient-start: {$darkColors['primary']};";
        $css .= "--woow-gradient-end: {$darkColors['secondary']};";
        $css .= "--woow-accent-glow: " . $this->hexToRgba($darkColors['primary'], 0.6) . ";";
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
        $hex = ltrim($hex, '#');
        
        if (strpos($hex, 'var(') === 0) {
            return $hex;
        }
        
        if (strlen($hex) === 3) {
            $hex = str_repeat(substr($hex,0,1), 2).str_repeat(substr($hex,1,1), 2).str_repeat(substr($hex,2,1), 2);
        }
        
        $r = hexdec(substr($hex, 0, 2));
        $g = hexdec(substr($hex, 2, 2));
        $b = hexdec(substr($hex, 4, 2));
        
        $r = max(0, min(255, $r + ($r * $percent / 100)));
        $g = max(0, min(255, $g + ($g * $percent / 100)));
        $b = max(0, min(255, $b + ($b * $percent / 100)));
        
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
        
        if (isset($settings['login_bg_color'])) {
            $css .= "body.login { background: {$settings['login_bg_color']} !important; }";
        }
        
        if (isset($settings['login_form_bg'])) {
            $css .= ".login form { background: {$settings['login_form_bg']} !important; }";
        }
        
        if (isset($settings['login_form_shadow']) && $settings['login_form_shadow']) {
            $css .= ".login form { box-shadow: 0 4px 20px rgba(0,0,0,0.1) !important; }";
        }
        
        if (isset($settings['login_form_rounded']) && $settings['login_form_rounded']) {
            $css .= ".login form { border-radius: 8px !important; }";
        }
        
        if (!empty($settings['login_custom_logo'])) {
            $css .= ".login h1 a { background-image: url('{$settings['login_custom_logo']}') !important; background-size: contain !important; width: auto !important; height: 80px !important; }";
        }
        
        if (!empty($css)) {
            echo "<style id='woow-v2-login-styles'>\n";
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
        $class_array = explode(' ', (string) $classes);

        /*
         * 🚫 USUNIĘTO CAŁKOWICIE: color_scheme i mas-theme-* klasy
         * Ta funkcja NIE ZARZĄDZA JUŻ MOTYWAMI.
         * 
         * Stary, konfliktowy kod (USUNIĘTY):
         * if (isset($settings['color_scheme'])) {
         *     $classes .= ' mas-theme-' . $settings['color_scheme'];  // ❌ KONFLIKT!
         * }
         */

        
        if (isset($settings['compact_mode']) && $settings['compact_mode']) {
            $class_array[] = 'woow-compact-mode';
        }
        
        if (isset($settings['menu_floating']) && $settings['menu_floating']) {
            $class_array[] = 'woow-v2-menu-floating'; // Use unified CSS class
            
            if (isset($settings['menu_glassmorphism']) && $settings['menu_glassmorphism']) {
                $class_array[] = 'woow-v2-menu-glossy';
            }
        }
        
        if (isset($settings['admin_bar_floating']) && $settings['admin_bar_floating']) {
            $class_array[] = 'woow-v2-admin-bar-floating';
        }
        
        if (!empty($settings['menu_responsive_enabled'])) {
            $class_array[] = 'woow-responsive-enabled';
        }
        
        $positionType = $settings['menu_position_type'] ?? 'default';
        if ($positionType !== 'default') {
            $class_array[] = 'woow-menu-position-' . $positionType;
        }
        
        if ($positionType === 'floating') {
            if (!empty($settings['menu_floating_shadow'])) {
                $class_array[] = 'woow-floating-shadow';
            }
            if (!empty($settings['menu_floating_blur_background'])) {
                $class_array[] = 'woow-floating-blur';
            }
            if (!empty($settings['menu_floating_auto_hide'])) {
                $class_array[] = 'woow-floating-auto-hide';
            }
            if (!empty($settings['menu_floating_trigger_hover'])) {
                $class_array[] = 'woow-floating-trigger-hover';
            }
        }
        
        if (!empty($settings['menu_responsive_enabled'])) {
            $mobileBehavior = $settings['menu_mobile_behavior'] ?? 'collapse';
            $togglePosition = $settings['menu_mobile_toggle_position'] ?? 'top-left';
            $toggleStyle = $settings['menu_mobile_toggle_style'] ?? 'hamburger';
            $mobileAnimation = $settings['menu_mobile_animation'] ?? 'slide';
            
            $class_array[] = 'woow-mobile-behavior-' . $mobileBehavior;
            $class_array[] = 'woow-toggle-' . $togglePosition;
            $class_array[] = 'woow-toggle-' . $toggleStyle;
            $class_array[] = 'woow-animation-' . $mobileAnimation;
        }
        
        $tabletBehavior = $settings['menu_tablet_behavior'] ?? 'auto';
        if ($tabletBehavior === 'mobile') {
            $class_array[] = 'woow-tablet-behavior-mobile';
        }
        
        if (!empty($settings['menu_tablet_compact'])) {
            $class_array[] = 'woow-tablet-compact';
        }
        
        if (!empty($settings['menu_touch_friendly'])) {
            $class_array[] = 'woow-touch-friendly';
        }
        
        if (!empty($settings['menu_swipe_gestures'])) {
            $class_array[] = 'woow-swipe-enabled';
        }
        
        if (!empty($settings['menu_reduce_animations_mobile'])) {
            $class_array[] = 'woow-reduce-animations';
        }
        
        if (!empty($settings['menu_optimize_performance'])) {
            $class_array[] = 'woow-optimize-performance';
        }
        
        $class_array = array_unique($class_array);
        return implode(' ', $class_array);
    }
    
    /**
     * Pobieranie ustawień
     */
    /**
     * ========================================================================
     * 🗂️ CENTRAL OPTIONS SCHEMA (Single Source of Truth)
     * ========================================================================
     * REFACTOR: Centralized options schema eliminates duplication across
     * settings registration, REST API validation, and default values.
     * 
     * ✅ DRY PRINCIPLE: All plugin options defined once
     * ✅ MAINTAINABILITY: Changes to options require only one edit
     * ✅ CONSISTENCY: Same types and defaults everywhere
     * 
     * @return array Complete plugin options schema
     */
    public function getOptionsSchema() {
        return [
            // === 🎛️ GLOBAL SETTINGS ===
            'enable_plugin' => ['type' => 'boolean', 'default' => true],
            'color_scheme' => ['type' => 'select', 'options' => ['light', 'dark', 'auto'], 'default' => 'auto'],
            'admin_theme' => ['type' => 'select', 'options' => ['default', 'modern', 'minimal', 'classic'], 'default' => 'modern'],
            'font_family' => ['type' => 'select', 'options' => ['system', 'inter', 'roboto', 'open-sans'], 'default' => 'system'],
            
            // === 🎨 COLOR SYSTEM ===
            'admin_bar_background' => ['type' => 'color', 'default' => '#23282d'],
            'admin_bar_text_color' => ['type' => 'color', 'default' => '#ffffff'],
            'admin_bar_hover_color' => ['type' => 'color', 'default' => '#00a0d2'],
            'menu_background' => ['type' => 'color', 'default' => '#23282d'],
            'menu_text_color' => ['type' => 'color', 'default' => '#ffffff'],
            'menu_hover_background' => ['type' => 'color', 'default' => '#32373c'],
            'menu_active_background' => ['type' => 'color', 'default' => '#0073aa'],
            'primary_color' => ['type' => 'color', 'default' => '#0073aa'],
            'secondary_color' => ['type' => 'color', 'default' => '#00a0d2'],
            'accent_color' => ['type' => 'color', 'default' => '#d63638'],
            'success_color' => ['type' => 'color', 'default' => '#46b450'],
            'warning_color' => ['type' => 'color', 'default' => '#ffb900'],
            'error_color' => ['type' => 'color', 'default' => '#d63638'],
            'shadow_color' => ['type' => 'color', 'default' => '#000000'],
            
            // === 📏 DIMENSIONS ===
            'admin_bar_height' => ['type' => 'dimension', 'min' => 20, 'max' => 100, 'default' => 32],
            'menu_width' => ['type' => 'dimension', 'min' => 100, 'max' => 400, 'default' => 160],
            'menu_item_height' => ['type' => 'dimension', 'min' => 20, 'max' => 80, 'default' => 36],
            'content_padding' => ['type' => 'dimension', 'min' => 0, 'max' => 100, 'default' => 20],
            'border_radius' => ['type' => 'dimension', 'min' => 0, 'max' => 50, 'default' => 4],
            'shadow_blur' => ['type' => 'dimension', 'min' => 0, 'max' => 50, 'default' => 10],
            'global_spacing' => ['type' => 'dimension', 'min' => 8, 'max' => 32, 'default' => 16],
            
            // === 🎚️ SCALES & RANGES ===
            'headings_scale' => ['type' => 'scale', 'min' => 1.0, 'max' => 2.0, 'default' => 1.25],
            'body_font_size' => ['type' => 'scale', 'min' => 10, 'max' => 24, 'default' => 16],
            'glassmorphism_opacity' => ['type' => 'scale', 'min' => 0.0, 'max' => 1.0, 'default' => 0.8],
            'animation_speed' => ['type' => 'scale', 'min' => 0.1, 'max' => 2.0, 'default' => 0.3],
            'shadow_opacity' => ['type' => 'scale', 'min' => 0.0, 'max' => 1.0, 'default' => 0.2],
            'transition_speed' => ['type' => 'scale', 'min' => 0.1, 'max' => 2.0, 'default' => 0.3],
            
            // === ✅ BOOLEAN TOGGLES ===
            'menu_floating' => ['type' => 'boolean', 'default' => false],
            'admin_bar_floating' => ['type' => 'boolean', 'default' => false],
            'dark_mode' => ['type' => 'boolean', 'default' => false],
            'glassmorphism_enabled' => ['type' => 'boolean', 'default' => false],
            'animations_enabled' => ['type' => 'boolean', 'default' => true],
            'enable_shadows' => ['type' => 'boolean', 'default' => true],
            'performance_mode' => ['type' => 'boolean', 'default' => false],
            'hide_wp_logo' => ['type' => 'boolean', 'default' => false],
            'hide_wp_version' => ['type' => 'boolean', 'default' => false],
            'hide_admin_notices' => ['type' => 'boolean', 'default' => false],
            'hide_help_tab' => ['type' => 'boolean', 'default' => false],
            'hide_screen_options' => ['type' => 'boolean', 'default' => false],
            'disable_emojis' => ['type' => 'boolean', 'default' => false],
            'disable_embeds' => ['type' => 'boolean', 'default' => false],
            'disable_jquery_migrate' => ['type' => 'boolean', 'default' => false],
            'enable_performance_mode' => ['type' => 'boolean', 'default' => false],
            
            // === 📝 TEXT FIELDS ===
            'custom_css' => ['type' => 'textarea', 'default' => ''],
            'custom_js' => ['type' => 'textarea', 'default' => ''],
        ];
    }
    
    /**
     * 🎯 Get default settings from schema
     */
    public function getDefaultSettings() {
        $schema = $this->getOptionsSchema();
        $defaults = [];
        
        foreach ($schema as $key => $config) {
            $defaults[$key] = $config['default'];
        }
        
        return $defaults;
    }
    
    /**
     * 🔧 Pobiera ustawienia z bazy danych
     */
    public function getSettings() {
        return $this->settings_manager->getSettings();
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
                if (empty($value)) {
                    $sanitized[$key] = '';
                } else {
                    $color = sanitize_hex_color($value);
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
        if (strlen($css) > 50000) {
            error_log('MAS V2: CSS too large, truncated');
            return substr($css, 0, 50000) . '/* CSS truncated for security */';
        }
        
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
        
        $css = preg_replace('/<!--.*?-->/s', '', $css);
        $css = wp_strip_all_tags($css);
        
        return $css;
    }
    
    /**
     * NAPRAWKA BEZPIECZEŃSTWA: Nowa funkcja sanityzacji JS
     */
    private function sanitizeCustomJS($js) {
        if (strlen($js) > 30000) {
            error_log('MAS V2: JS too large, truncated');
            return '/* JavaScript too large and was removed for security */';
        }
        
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
        
        $js = wp_strip_all_tags($js);
        
        return $js;
    }
    

    
    /**
     * ⚠️ DEPRECATED: Oryginalna metoda domyślnych ustawień
    
    /**
     * Definicje tabów
     */
    private function getTabs() {
        return [
            'general' => [
                'title' => __('🌐 Główne', 'woow-admin-styler'),
                'icon' => 'settings',
                'description' => __('Globalne ustawienia, motyw kolorystyczny, layout', 'woow-admin-styler')
            ],
            'admin-bar' => [
                'title' => __('📊 Pasek Admina', 'woow-admin-styler'),
                'icon' => 'admin-bar',
                'description' => __('Wygląd, pozycja, typografia i ukrywanie elementów', 'woow-admin-styler')
            ],
            'menu' => [
                'title' => __('📋 Menu', 'woow-admin-styler'),
                'icon' => 'menu',
                'description' => __('Menu główne + submenu (wszystko w jednym miejscu!)', 'woow-admin-styler')
            ],
            'typography' => [
                'title' => __('🔤 Typografia', 'woow-admin-styler'),
                'icon' => 'typography',
                'description' => __('Czcionki, rozmiary, nowa skala nagłówków H1-H6', 'woow-admin-styler')
            ],
            'advanced' => [
                'title' => __('⚙️ Zaawansowane', 'woow-admin-styler'),
                'icon' => 'advanced',
                'description' => __('Treść + Przyciski + Optymalizacja + CSS/JS', 'woow-admin-styler')
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
        static $cache_cleared = false;
        
        if ($cache_cleared) {
            return;
        }
        
        if (function_exists('wp_cache_flush')) {
            wp_cache_flush();
        }
        
        if (function_exists('wp_cache_delete_group')) {
            wp_cache_delete_group('mas_v2_cache', 'mas_v2');
        }
        
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
        
        if (isset($settings['menu_search_enabled']) && $settings['menu_search_enabled']) {
            $this->renderMenuSearch($settings);
        }
        
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
            
            $content = do_shortcode($content);
            
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
        
        if (isset($settings['menu_custom_css_enabled']) && $settings['menu_custom_css_enabled']) {
            $customCSS = $settings['menu_custom_css_code'] ?? '';
            if (!empty(trim($customCSS))) {
                $css .= "\n/* Custom CSS Code */\n";
                
                if (isset($settings['menu_css_minification']) && $settings['menu_css_minification']) {
                    $customCSS = $this->minifyCSS($customCSS);
                }
                
                $css .= $customCSS . "\n";
            }
        }
        
        if (isset($settings['menu_conditional_display']) && $settings['menu_conditional_display']) {
            $css .= $this->generateConditionalDisplayCSS($settings);
        }
        
        $activeTemplate = $settings['menu_active_template'] ?? 'default';
        if ($activeTemplate !== 'default') {
            $css .= $this->generateTemplateCSS($activeTemplate, $settings);
        }
        
        if (isset($settings['menu_white_label']) && $settings['menu_white_label']) {
            $css .= $this->generateWhiteLabelCSS();
        }
        
        if (isset($settings['menu_performance_monitoring']) && $settings['menu_performance_monitoring']) {
            $css .= $this->generatePerformanceIndicatorsCSS();
        }
        
        $css .= "
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
        
        $pagePatterns = $settings['menu_page_specific_styling'] ?? [];
        if (!empty($pagePatterns)) {
            foreach ($pagePatterns as $index => $pattern) {
                $safeClass = 'mas-page-' . md5($pattern);
                $css .= "
                body.{$safeClass} #adminmenu {
                    opacity: 0.9;
                    border-left: 3px solid #0073aa;
                }";
            }
        }
        
        $restrictedRoles = $settings['menu_user_role_restrictions'] ?? [];
        if (!empty($restrictedRoles)) {
            foreach ($restrictedRoles as $role) {
                $css .= "
                body.role-{$role} #adminmenu {
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
        $css = preg_replace('!/\*[^*]*\*+([^/][^*]*\*+)*/!', '', $css);
        
        $css = str_replace(["\r\n", "\r", "\n", "\t", '  ', '    ', '    '], '', $css);
        
        $css = str_replace([' {', '{ ', ' }', '} ', ': ', ' :', '; ', ' ;', ', ', ' ,'], ['{', '{', '}', '}', ':', ':', ';', ';', ',', ','], $css);
        
        return trim($css);
    }
    
    /**
     * Generuje JavaScript dla dynamicznego zarządzania klasami body
     */
    private function generateBodyClassesJS($settings) {
        $js = 'document.addEventListener("DOMContentLoaded", function() {';
        $js .= 'var body = document.body;';
        
        // Legacy options (keep for backward compatibility)
        if (isset($settings['menu_floating']) && $settings['menu_floating']) {
                    $js .= 'body.classList.add("woow-v2-menu-floating");';
        $js .= 'body.classList.add("woow-menu-floating");';
        $js .= 'body.classList.remove("woow-menu-normal");';
        } else {
                    $js .= 'body.classList.remove("woow-v2-menu-floating");';
        $js .= 'body.classList.add("woow-menu-normal");';
        $js .= 'body.classList.remove("woow-menu-floating");';
        }
        
        if (isset($settings['admin_bar_floating']) && $settings['admin_bar_floating']) {
                    $js .= 'body.classList.add("woow-v2-admin-bar-floating");';
        $js .= 'body.classList.remove("woow-admin-bar-floating");'; // Remove old class
        } else {
            $js .= 'body.classList.remove("woow-v2-admin-bar-floating", "woow-admin-bar-floating");';
        }
        
        if (isset($settings['menu_glossy']) && $settings['menu_glossy']) {
            $js .= 'body.classList.add("woow-v2-menu-glossy");';
        } else {
            $js .= 'body.classList.remove("woow-v2-menu-glossy");';
        }
        
        if (isset($settings['admin_bar_glossy']) && $settings['admin_bar_glossy']) {
            $js .= 'body.classList.add("woow-v2-admin-bar-glossy");';
        } else {
            $js .= 'body.classList.remove("woow-v2-admin-bar-glossy");';
        }
        
        if (isset($settings['menu_border_radius_type']) && $settings['menu_border_radius_type'] === 'individual') {
            $js .= 'body.classList.add("woow-v2-menu-radius-individual");';
        } else {
            $js .= 'body.classList.remove("woow-v2-menu-radius-individual");';
        }
        
        if (isset($settings['admin_bar_border_radius_type']) && $settings['admin_bar_border_radius_type'] === 'individual') {
            $js .= 'body.classList.add("woow-v2-admin-bar-radius-individual");';
        } else {
            $js .= 'body.classList.remove("woow-v2-admin-bar-radius-individual");';
        }
        
        // === MICRO-PANEL BOOLEAN OPTIONS ===
        
        // Admin Bar effects
        if (isset($settings['wpadminbar_floating']) && $settings['wpadminbar_floating']) {
            $js .= 'body.classList.add("woow-admin-bar-floating");';
        } else {
            $js .= 'body.classList.remove("woow-admin-bar-floating");';
        }
        
        if (isset($settings['wpadminbar_shadow']) && $settings['wpadminbar_shadow']) {
            $js .= 'body.classList.add("woow-admin-bar-shadow");';
        } else {
            $js .= 'body.classList.remove("woow-admin-bar-shadow");';
        }
        
        if (isset($settings['wpadminbar_glassmorphism']) && $settings['wpadminbar_glassmorphism']) {
            $js .= 'body.classList.add("woow-admin-bar-glassmorphism");';
        } else {
            $js .= 'body.classList.remove("woow-admin-bar-glassmorphism");';
        }
        
        if (isset($settings['wpadminbar_gradient']) && $settings['wpadminbar_gradient']) {
            $js .= 'body.classList.add("woow-admin-bar-gradient");';
        } else {
            $js .= 'body.classList.remove("woow-admin-bar-gradient");';
        }
        
        // Menu effects
        if (isset($settings['adminmenuwrap_floating']) && $settings['adminmenuwrap_floating']) {
            $js .= 'body.classList.add("woow-menu-floating");';
        } else {
            $js .= 'body.classList.remove("woow-menu-floating");';
        }
        
        // Post boxes effects
        if (isset($settings['postbox_shadow']) && $settings['postbox_shadow']) {
            $js .= 'body.classList.add("woow-postbox-shadow");';
        } else {
            $js .= 'body.classList.remove("woow-postbox-shadow");';
        }
        
        if (isset($settings['postbox_glassmorphism']) && $settings['postbox_glassmorphism']) {
            $js .= 'body.classList.add("woow-postbox-glassmorphism");';
        } else {
            $js .= 'body.classList.remove("woow-postbox-glassmorphism");';
        }
        
        if (isset($settings['postbox_hover_lift']) && $settings['postbox_hover_lift']) {
            $js .= 'body.classList.add("woow-postbox-hover-lift");';
        } else {
            $js .= 'body.classList.remove("woow-postbox-hover-lift");';
        }
        
        if (isset($settings['postbox_animation']) && $settings['postbox_animation']) {
            $js .= 'body.classList.add("woow-postbox-animation");';
        } else {
            $js .= 'body.classList.remove("woow-postbox-animation");';
        }
        
        // Visibility toggles - hide elements
        if (isset($settings['wpadminbar_hide_wp_logo']) && $settings['wpadminbar_hide_wp_logo']) {
            $js .= 'var wpLogo = document.querySelector("#wp-admin-bar-wp-logo");';
            $js .= 'if (wpLogo) wpLogo.style.display = "none";';
        } else {
            $js .= 'var wpLogo = document.querySelector("#wp-admin-bar-wp-logo");';
            $js .= 'if (wpLogo) wpLogo.style.display = "";';
        }
        
        if (isset($settings['wpadminbar_hide_howdy']) && $settings['wpadminbar_hide_howdy']) {
            $js .= 'var howdy = document.querySelector("#wp-admin-bar-my-account .display-name");';
            $js .= 'if (howdy) howdy.style.display = "none";';
        } else {
            $js .= 'var howdy = document.querySelector("#wp-admin-bar-my-account .display-name");';
            $js .= 'if (howdy) howdy.style.display = "";';
        }
        
        if (isset($settings['wpadminbar_hide_update_notices']) && $settings['wpadminbar_hide_update_notices']) {
            $js .= 'var updates = document.querySelector("#wp-admin-bar-updates");';
            $js .= 'if (updates) updates.style.display = "none";';
        } else {
            $js .= 'var updates = document.querySelector("#wp-admin-bar-updates");';
            $js .= 'if (updates) updates.style.display = "";';
        }
        
        if (isset($settings['wpadminbar_hide_comments']) && $settings['wpadminbar_hide_comments']) {
            $js .= 'var comments = document.querySelector("#wp-admin-bar-comments");';
            $js .= 'if (comments) comments.style.display = "none";';
        } else {
            $js .= 'var comments = document.querySelector("#wp-admin-bar-comments");';
            $js .= 'if (comments) comments.style.display = "";';
        }
        
        if (isset($settings['wpfooter_hide_version']) && $settings['wpfooter_hide_version']) {
            $js .= 'var version = document.querySelector("#footer-thankyou");';
            $js .= 'if (version) version.style.display = "none";';
        } else {
            $js .= 'var version = document.querySelector("#footer-thankyou");';
            $js .= 'if (version) version.style.display = "";';
        }
        
        if (isset($settings['wpfooter_hide_thanks']) && $settings['wpfooter_hide_thanks']) {
            $js .= 'var thanks = document.querySelector("#footer-upgrade");';
            $js .= 'if (thanks) thanks.style.display = "none";';
        } else {
            $js .= 'var thanks = document.querySelector("#footer-upgrade");';
            $js .= 'if (thanks) thanks.style.display = "";';
        }
        
        $js .= 'console.log("MAS V2: Unified styles active on all pages");';
        $js .= 'console.log("WOOW! V2: Body classes added:", body.className.split(" ").filter(function(c) { return c.startsWith("woow-"); }));';
        
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
            $test_option_name = 'mas_v2_test_' . time();
            $test_data = [
                'test_field' => 'test_value_' . time(),
                'admin_bar_height' => 99
            ];
            
            $save_result = update_option($test_option_name, $test_data);
            
            $retrieved_data = get_option($test_option_name);
            
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
            
            if (wp_using_ext_object_cache()) {
                $cache_status['object_cache'] = 'External object cache detected';
            } else {
                $cache_status['object_cache'] = 'Using WordPress default cache';
            }
            
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
        if (!wp_verify_nonce($_POST['nonce'] ?? '', 'mas_v2_clear_cache') || !current_user_can('manage_options')) {
            wp_send_json_error(['message' => __('Security check failed', 'woow-admin-styler')]);
        }
        
        try {
            $this->cache_manager->flush();
            
            delete_transient('mas_v2_css_cache');
            delete_transient('mas_v2_settings_cache');
            
            if (function_exists('wp_cache_flush')) {
                wp_cache_flush();
            }
            
            wp_send_json_success(['message' => __('Cache cleared successfully!', 'woow-admin-styler')]);
            
        } catch (Exception $e) {
            wp_send_json_error(['message' => __('Error clearing cache: ', 'woow-admin-styler') . $e->getMessage()]);
        }
    }
    
    
    /**
     * 🎯 LIVE EDIT MODE: Save settings via AJAX
     */
    public function ajaxSaveLiveSettings() {
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
            
            $current_settings = $this->getSettings();
            
            $updated_settings = array_merge($current_settings, $new_settings);
            
            $sanitized_settings = $this->sanitizeSettings($updated_settings);
            
            $result = update_option('mas_v2_settings', $sanitized_settings);
            
            if ($result) {
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
        if (!wp_verify_nonce($_POST['nonce'] ?? '', 'mas_live_edit_nonce') || !current_user_can('manage_options')) {
            wp_send_json_error(['message' => 'Security check failed']);
            return;
        }
        
        try {
            $settings = $this->getSettings();
            
            // Filtruj tylko ustawienia związane z Live Edit
            $live_edit_settings = [];
            $live_edit_keys = [
                'admin_bar_background',
                'admin_bar_text_color', 
                'admin_bar_hover_color',
                'admin_bar_height',
                'admin_bar_font_size',
                'admin_bar_border_radius',
                'menu_background',
                'menu_text_color',
                'menu_hover_color',
                'menu_width',
                'menu_border_radius',
                'accent_color'
            ];
            
            foreach ($live_edit_keys as $key) {
                if (isset($settings[$key])) {
                    $live_edit_settings[$key] = $settings[$key];
                }
            }
            
            wp_send_json_success([
                'settings' => $live_edit_settings,
                'count' => count($live_edit_settings),
                'last_modified' => get_option('mas_v2_settings_modified', 'Unknown'),
                'cache_status' => wp_using_ext_object_cache() ? 'External cache' : 'WordPress default',
                'timestamp' => current_time('mysql')
            ]);
            
        } catch (Exception $e) {
            wp_send_json_error(['message' => 'Error loading settings: ' . $e->getMessage()]);
        }
    }
    
    /**
     * 🎯 LIVE EDIT MODE: Reset specific setting to default
     */
    public function ajaxResetLiveSetting() {
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
            
            $current_settings = $this->getSettings();
            
            $defaults = $this->getDefaultSettings();
            $default_value = $defaults[$setting_key] ?? null;
            
            if ($default_value === null) {
                wp_send_json_error(['message' => 'Setting not found in defaults']);
                return;
            }
            
            // ✅ ENTERPRISE FIX: Remove key from database instead of setting default value
            // This allows CSS to fall back to the default value defined in the stylesheet
            unset($current_settings[$setting_key]);
            
            $result = update_option('mas_v2_settings', $current_settings);
            
            if ($result) {
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
    
    
    /**
     * 🎯 FAZA 6: Renderuje stronę Enterprise Dashboard
     */
    public function renderPhase6Demo() {
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
        function togglePresetDropdown(presetId) {
            const dropdown = document.getElementById('dropdown-' + presetId);
            const allDropdowns = document.querySelectorAll('.dropdown-menu');
            
            allDropdowns.forEach(menu => {
                if (menu !== dropdown) {
                    menu.style.display = 'none';
                }
            });
            
            dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
        }
        
        document.addEventListener('click', function(event) {
            if (!event.target.closest('.dropdown')) {
                document.querySelectorAll('.dropdown-menu').forEach(menu => {
                    menu.style.display = 'none';
                });
            }
        });
        
        function duplicatePreset(presetId) {
            if (window.masToast) {
                window.masToast.show('info', 'Duplicate feature coming soon!', 3000);
            }
        }
        
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

    /**
     * CUSTOMIZER METHODS REMOVED
     * 
     * These methods were removed as part of WordPress Customizer elimination:
     * - getCustomizerStylesString(): Handled by Live Edit Mode
     * - addCustomizerBodyClasses(): Handled by Live Edit Mode
     * 
     * Live Edit Mode provides superior UX with instant preview and
     * direct admin page editing without needing separate Customizer interface.
     */
}

ModernAdminStylerV2::getInstance();
