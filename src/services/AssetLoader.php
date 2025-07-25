<?php
/**
 * Modern Admin Styler V2 - Performance-Optimized Asset Loader
 * 
 * @package ModernAdminStyler
 * @version 4.0.0 - Performance Optimized
 */

namespace ModernAdminStyler\Services;

class AssetLoader {
    private $plugin_url;
    private $plugin_path;
    private $plugin_version;
    private $settings_manager;
    private $css_generator;
    private $is_production;
    private $performance_budget;
    
    public function __construct($plugin_url, $plugin_version, $settings_manager = null, $css_generator = null) {
        $this->plugin_url = trailingslashit($plugin_url);
        $this->plugin_path = dirname(dirname(dirname(__FILE__))) . '/';
        $this->plugin_version = $plugin_version;
        $this->settings_manager = $settings_manager;
        $this->css_generator = $css_generator;
        $this->is_production = !defined('WP_DEBUG') || !WP_DEBUG;
        $this->performance_budget = [
            'maxMemory' => 15 * 1024 * 1024, // 15MB
            'maxLoadTime' => 1500, // 1.5s
            'maxBundleSize' => 200 * 1024, // 200KB gzipped
        ];
    }

    /**
     * 🚀 PERFORMANCE-OPTIMIZED: Loads assets for MAS V2 admin pages
     * Features: Critical CSS, Lazy Loading, Service Worker, Code Splitting
     */
    public function enqueueAdminAssets($hook) {
        $mas_pages = [
            'toplevel_page_mas-v2-general',
            'modern-admin_page_mas-v2-general',
            'modern-admin_page_mas-v2-admin-bar',
            'modern-admin_page_mas-v2-menu',
            'modern-admin_page_mas-v2-typography',
            'modern-admin_page_mas-v2-advanced',
            // 🎯 KRYTYCZNE: Dodaj obsługę WOOW pages
            'toplevel_page_woow-v2-general',
            'modern-admin_page_woow-v2-general',
            'modern-admin_page_woow-v2-admin-bar',
            'modern-admin_page_woow-v2-menu',
            'modern-admin_page_woow-v2-typography',
            'modern-admin_page_woow-v2-advanced'
        ];
        
        if (!in_array($hook, $mas_pages)) {
            return;
        }

        // 🎯 STEP 0: Early performance setup
        $this->setupPerformanceOptimizations();
        
        // 🎨 STEP 1: Load critical CSS (above-the-fold)
        $this->loadCriticalCSS();
        
        // 🚀 STEP 2: Load core JavaScript (essential functionality)
        $this->loadCoreJavaScript();
        
        // 📦 STEP 3: Register Service Worker for caching
        $this->registerServiceWorker();
        
        // 🎭 STEP 4: Lazy load advanced features
        $this->setupLazyLoading();
        
        // 📊 STEP 5: Performance monitoring
        $this->setupPerformanceMonitoring();
    }
    
    /**
     * 🌐 PERFORMANCE-OPTIMIZED: Loads global assets for all wp-admin pages
     * Lightweight version with minimal footprint
     */
    public function enqueueGlobalAssets($hook) {
        // Skip login pages but allow all admin pages including MAS pages
        if (!is_admin() || $this->isLoginPage()) {
            return;
        }
        
        // Load minimal global assets including theme manager
        $this->loadMinimalGlobalAssets();
        
        // Register Service Worker globally
        $this->registerServiceWorker();
    }

    /**
     * 🎯 Setup performance optimizations
     */
    private function setupPerformanceOptimizations() {
        // Ensure dashicons are loaded
        wp_enqueue_style('dashicons');
        
        // Add early performance hints
        add_action('wp_head', [$this, 'addPerformanceHints'], 1);
        
        // Preload critical resources
        add_action('wp_head', [$this, 'preloadCriticalResources'], 2);
    }

    /**
     * 🎨 Load critical CSS with inlining for performance
     */
    private function loadCriticalCSS() {
        $css_suffix = $this->is_production ? '.min' : '';
        $css_dir = $this->is_production ? 'dist/' : '';
        
        // Load consolidated main CSS which includes core styles
        wp_enqueue_style(
            'woow-main',
            $this->plugin_url . 'assets/css/' . $css_dir . 'woow-main' . $css_suffix . '.css',
            ['dashicons'],
            $this->plugin_version,
            'all'
        );
        
        // Inline critical CSS for above-the-fold content
        if ($this->is_production) {
            $critical_css_path = $this->plugin_path . 'assets/css/dist/woow-critical.min.css';
            if (file_exists($critical_css_path)) {
                $critical_css = file_get_contents($critical_css_path);
                if ($critical_css) {
                    wp_add_inline_style('woow-main', $critical_css);
                }
            }
        }
        
        // Generate and inject dynamic CSS variables
        if ($this->settings_manager && $this->css_generator) {
            $settings = $this->settings_manager->getSettings();
            $dynamic_css = $this->css_generator->generate($settings);
            if ($dynamic_css) {
                wp_add_inline_style('woow-main', $dynamic_css);
            }
        }
    }

    /**
     * 🎨 ENHANCED: Load core stylesheets with consolidated architecture
     * NEW: Single file loading strategy for improved performance
     */
    private function loadCoreCSS() {
        $css_suffix = $this->is_production ? '.min' : '';
        $css_dir = $this->is_production ? 'dist/' : '';
        
        // 🎯 CONSOLIDATED MAIN CSS - All core admin styles
        wp_enqueue_style(
            'woow-main-consolidated',
            $this->plugin_url . 'assets/css/' . $css_dir . 'woow-main' . $css_suffix . '.css',
            ['dashicons'],
            $this->plugin_version,
            'all'
        );
        
        // 🎛️ CONDITIONAL LIVE EDIT CSS - Only when Live Edit is active
        if ($this->isLiveEditActive()) {
            wp_enqueue_style(
                'woow-live-edit',
                $this->plugin_url . 'assets/css/' . $css_dir . 'woow-live-edit' . $css_suffix . '.css',
                ['woow-main-consolidated'],
                $this->plugin_version,
                'all'
            );
        }
        
        // 🛠️ UTILITIES CSS - Load on demand or cached
        if (is_admin() || $this->isDebugMode()) {
            wp_enqueue_style(
                'woow-utilities',
                $this->plugin_url . 'assets/css/' . $css_dir . 'woow-utilities' . $css_suffix . '.css',
                [],
                $this->plugin_version,
                'all'
            );
        }
    }
    
    /**
     * 🎛️ Check if Live Edit Mode is active
     */
    private function isLiveEditActive() {
        // Check if Live Edit is enabled globally
        $global_live_edit = get_option('woow_live_edit_global', false);
        
        // Check if current user can use Live Edit
        $user_can_edit = current_user_can('edit_theme_options');
        
        // Check if Live Edit is enabled for current page/session
        $session_live_edit = isset($_GET['woow_live_edit']) || 
                           isset($_SESSION['woow_live_edit_active']) ||
                           (isset($_COOKIE['woow_live_edit']) && $_COOKIE['woow_live_edit'] === 'active');
        
        return $global_live_edit || ($user_can_edit && $session_live_edit);
    }
    
    /**
     * 🐛 Check if debug mode is active
     */
    private function isDebugMode() {
        return defined('WP_DEBUG') && WP_DEBUG || 
               isset($_GET['woow_debug']) ||
               get_option('woow_debug_mode', false);
    }

    /**
     * 🚀 Load core JavaScript with optimization
     */
    private function loadCoreJavaScript() {
        $js_suffix = $this->is_production ? '.min' : '';
        $js_dir = $this->is_production ? 'dist/' : '';
        
        // Load UnifiedSettingsManager (essential)
        wp_enqueue_script(
            'woow-unified-settings-manager',
            $this->plugin_url . 'assets/js/' . $js_dir . 'unified-settings-manager' . $js_suffix . '.js',
            ['jquery'],
            $this->plugin_version,
            true
        );
        
        // 🎨 KRYTYCZNE: Ładuj live-edit-mode.js dla funkcjonalności Live Edit
        wp_enqueue_script(
            'woow-live-edit-mode',
            $this->plugin_url . 'assets/js/live-edit-mode.js',
            ['jquery'],
            $this->plugin_version,
            true
        );
        
        // 🎯 NEW: Load EventManager for robust event handling
        wp_enqueue_script(
            'woow-event-manager',
            $this->plugin_url . 'assets/js/event-manager.js',
            ['jquery'],
            $this->plugin_version,
            true
        );
        
        // 🎯 NEW: Load CSS Variable Mapper for comprehensive mapping system
        wp_enqueue_script(
            'woow-css-variable-mapper',
            $this->plugin_url . 'assets/js/css-variable-mapper.js',
            ['jquery', 'woow-event-manager'],
            $this->plugin_version,
            true
        );
        
        // 🎯 NEW: Load MicroPanelFactory for micro-panel functionality
        wp_enqueue_script(
            'woow-micro-panel-factory',
            $this->plugin_url . 'assets/js/micro-panel-factory.js',
            ['jquery', 'woow-live-edit-mode', 'woow-css-variable-mapper'],
            $this->plugin_version,
            true
        );
        
        // 🎯 NEW: Load AjaxManager for unified AJAX communication
        wp_enqueue_script(
            'woow-ajax-manager',
            $this->plugin_url . 'assets/js/ajax-manager.js',
            ['jquery'],
            $this->plugin_version,
            true
        );
        
        // Load core WOOW functionality
        wp_enqueue_script(
            'woow-core',
            $this->plugin_url . 'assets/js/' . $js_dir . 'woow-core' . $js_suffix . '.js',
            ['jquery', 'woow-unified-settings-manager', 'woow-live-edit-mode'],
            $this->plugin_version,
            true
        );
        
        // Localize with optimized data
        $this->localizeScripts();
    }

    /**
     * 📦 Register Service Worker for aggressive caching
     */
    private function registerServiceWorker() {
        $js_suffix = $this->is_production ? '.min' : '';
        $js_dir = $this->is_production ? 'dist/' : '';
        
        // Register service worker script
        wp_enqueue_script(
            'woow-service-worker-register',
            $this->plugin_url . 'assets/js/woow-service-worker-register.js',
            [],
            $this->plugin_version,
            true
        );
        
        // Add service worker registration
        $sw_script = "
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', function() {
                navigator.serviceWorker.register('" . $this->plugin_url . "assets/js/" . $js_dir . "woow-service-worker" . $js_suffix . ".js')
                .then(function(registration) {
                    console.log('🚀 WOOW Service Worker registered:', registration.scope);
                })
                .catch(function(error) {
                    console.log('❌ WOOW Service Worker registration failed:', error);
                });
            });
        }";
        
        wp_add_inline_script('woow-service-worker-register', $sw_script);
    }

    /**
     * 🎭 Setup lazy loading for advanced features
     * NOTE: Features now consolidated in woow-main.css
     */
    private function setupLazyLoading() {
        // Advanced features are now included in woow-main.css
        // Conditional loading handled by loadCoreCSS()
        
        // Load Live Edit features conditionally
        if ($this->isLiveEditActive()) {
            add_action('wp_footer', function() {
                echo '<script>console.log("🎛️ Live Edit Mode: Activated");</script>';
            });
        }
        
        // Performance monitoring
        add_action('wp_footer', function() {
            if ($this->isDebugMode()) {
                echo '<script>console.log("🔍 Debug Mode: Asset loading completed");</script>';
            }
        });
    }

    /**
     * 📊 Setup performance monitoring
     */
    private function setupPerformanceMonitoring() {
        if (!$this->is_production) {
            $monitoring_script = "
            document.addEventListener('DOMContentLoaded', function() {
                if (window.WOOW && window.WOOW.logger) {
                    const memory = performance.memory;
                    if (memory) {
                        const memoryMB = memory.usedJSHeapSize / 1024 / 1024;
                        if (memoryMB > 15) {
                            WOOW.logger.warn('High memory usage detected: ' + memoryMB.toFixed(2) + 'MB');
                        }
                    }
                    
                    const loadTime = performance.now();
                    if (loadTime > 1500) {
                        WOOW.logger.warn('Slow page load detected: ' + loadTime.toFixed(2) + 'ms');
                    }
                    
                    WOOW.logger.info('Performance metrics:', {
                        loadTime: loadTime.toFixed(2) + 'ms',
                        memory: memory ? (memory.usedJSHeapSize / 1024 / 1024).toFixed(2) + 'MB' : 'N/A'
                    });
                }
            });";
            
            wp_add_inline_script('woow-core', $monitoring_script);
        }
    }

    /**
     * 🌐 Load minimal global assets for all admin pages
     */
    private function loadMinimalGlobalAssets() {
        wp_enqueue_style('dashicons');
        
        // Load minimal core CSS for global pages - consolidated in woow-main.css
        $css_suffix = $this->is_production ? '.min' : '';
        $css_dir = $this->is_production ? 'dist/' : '';
        
        // 🎯 CONSOLIDATED: Load main CSS which includes core styles
        wp_enqueue_style(
            'woow-main-global',
            $this->plugin_url . 'assets/css/' . $css_dir . 'woow-main' . $css_suffix . '.css',
            ['dashicons'],
            $this->plugin_version,
            'all'
        );
        
        // 🎨 KRYTYCZNE: Ładuj admin-global.js zawierający ThemeManager dla przełącznika trybu jasny/ciemny
        wp_enqueue_script(
            'woow-admin-global',
            $this->plugin_url . 'assets/js/admin-global.js',
            ['jquery'],
            $this->plugin_version,
            true
        );
        
        // 🎯 KRYTYCZNE: Ładuj live-edit-mode.js globalnie dla dostępności na wszystkich stronach admin
        wp_enqueue_script(
            'woow-live-edit-mode-global',
            $this->plugin_url . 'assets/js/live-edit-mode.js',
            ['jquery'],
            $this->plugin_version,
            true
        );
        
        // 🎯 NEW: Load EventManager globally for robust event handling
        wp_enqueue_script(
            'woow-event-manager-global',
            $this->plugin_url . 'assets/js/event-manager.js',
            ['jquery'],
            $this->plugin_version,
            true
        );
        
        // 🎯 NEW: Load CSS Variable Mapper globally for comprehensive mapping system
        wp_enqueue_script(
            'woow-css-variable-mapper-global',
            $this->plugin_url . 'assets/js/css-variable-mapper.js',
            ['jquery', 'woow-event-manager-global'],
            $this->plugin_version,
            true
        );
        
        // 🎯 NEW: Load MicroPanelFactory globally for micro-panel functionality
        wp_enqueue_script(
            'woow-micro-panel-factory-global',
            $this->plugin_url . 'assets/js/micro-panel-factory.js',
            ['jquery', 'woow-live-edit-mode-global', 'woow-css-variable-mapper-global'],
            $this->plugin_version,
            true
        );
        
        // 🎯 NEW: Load AjaxManager globally for unified AJAX communication
        wp_enqueue_script(
            'woow-ajax-manager-global',
            $this->plugin_url . 'assets/js/ajax-manager.js',
            ['jquery'],
            $this->plugin_version,
            true
        );
        
        // Lokalizacja skryptów z ustawieniami
        wp_localize_script('woow-admin-global', 'woowGlobal', [
            'ajaxUrl' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('woow_global_nonce'),
            'pluginUrl' => $this->plugin_url
        ]);
        
        // Lokalizacja dla live-edit-mode
        wp_localize_script('woow-live-edit-mode-global', 'woowLiveEditGlobal', [
            'ajaxUrl' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('woow_live_edit_nonce'),
            'pluginUrl' => $this->plugin_url,
            'isMainPage' => !isset($_GET['page']) || empty($_GET['page']),
            'currentPage' => $_GET['page'] ?? 'dashboard'
        ]);
        
        // 🎯 KRYTYCZNE: Dodaj woowV2Global dla live-edit-mode-global (wymagane przez live-edit-mode.js)
        wp_localize_script('woow-live-edit-mode-global', 'woowV2Global', [
            'ajaxUrl' => admin_url('admin-ajax.php'),
            'restUrl' => rest_url('woow/v1/'),
            'restNonce' => wp_create_nonce('wp_rest'),
            'ajaxNonce' => wp_create_nonce('mas_live_edit_nonce'),
            'debug' => !$this->is_production,
            'version' => $this->plugin_version,
            'pluginUrl' => $this->plugin_url,
            'isProduction' => $this->is_production,
            'currentUser' => wp_get_current_user()->display_name,
            'capabilities' => [
                'manage_options' => current_user_can('manage_options'),
                'edit_theme_options' => current_user_can('edit_theme_options')
            ],
            'settings' => $this->settings_manager->getSettings()
        ]);
    }

    /**
     * 🎯 Localize scripts with optimized data
     */
    private function localizeScripts() {
        $localize_data = [
            'ajaxUrl' => admin_url('admin-ajax.php'),
            'restUrl' => rest_url('woow/v1/'),
            'restNonce' => wp_create_nonce('wp_rest'),
            'ajaxNonce' => wp_create_nonce('mas_live_edit_nonce'),
            'debug' => !$this->is_production,
            'version' => $this->plugin_version,
            'pluginUrl' => $this->plugin_url,
            'isProduction' => $this->is_production,
            'currentUser' => wp_get_current_user()->display_name,
            'capabilities' => [
                'manage_options' => current_user_can('manage_options'),
                'edit_theme_options' => current_user_can('edit_theme_options')
            ],
            'performance' => [
                'budget' => $this->performance_budget,
                'monitoring' => !$this->is_production
            ]
        ];
        
        // Add settings only if available
        if ($this->settings_manager) {
            $localize_data['settings'] = $this->settings_manager->getSettings();
        }
        
        wp_localize_script('woow-core', 'woowV2Global', $localize_data);
        wp_localize_script('woow-unified-settings-manager', 'woowV2Global', $localize_data);
    }

    /**
     * 🔗 Add performance hints for better loading
     */
    public function addPerformanceHints() {
        // DNS prefetch for external resources
        echo '<link rel="dns-prefetch" href="//fonts.googleapis.com">' . "\n";
        echo '<link rel="dns-prefetch" href="//fonts.gstatic.com">' . "\n";
        
        // Preconnect to critical origins
        echo '<link rel="preconnect" href="' . admin_url() . '" crossorigin>' . "\n";
        
        // Resource hints for better performance
        echo '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">' . "\n";
    }

    /**
     * 📦 Preload critical resources
     */
    public function preloadCriticalResources() {
        $css_suffix = $this->is_production ? '.min' : '';
        $css_dir = $this->is_production ? 'dist/' : '';
        $js_suffix = $this->is_production ? '.min' : '';
        $js_dir = $this->is_production ? 'dist/' : '';
        
        // Preload critical CSS
        echo '<link rel="preload" href="' . $this->plugin_url . 'assets/css/' . $css_dir . 'woow-core' . $css_suffix . '.css" as="style">' . "\n";
        
        // Preload critical JS
        echo '<link rel="preload" href="' . $this->plugin_url . 'assets/js/' . $js_dir . 'woow-core' . $js_suffix . '.js" as="script">' . "\n";
        echo '<link rel="preload" href="' . $this->plugin_url . 'assets/js/' . $js_dir . 'unified-settings-manager' . $js_suffix . '.js" as="script">' . "\n";
    }

    /**
     * 🎯 Check if current page is a MAS page
     */
    private function isMASPage($hook) {
        $mas_pages = [
            'toplevel_page_mas-v2-general',
            'modern-admin_page_mas-v2-general',
            'modern-admin_page_mas-v2-admin-bar',
            'modern-admin_page_mas-v2-menu',
            'modern-admin_page_mas-v2-typography',
            'modern-admin_page_mas-v2-advanced'
        ];
        
        return in_array($hook, $mas_pages);
    }

    /**
     * 🔒 Check if current page is login page
     */
    private function isLoginPage() {
        return in_array($GLOBALS['pagenow'], ['wp-login.php', 'wp-register.php']);
    }

    /**
     * 🔧 Set dependencies
     */
    public function setDependencies($settings_manager, $css_generator) {
        $this->settings_manager = $settings_manager;
        $this->css_generator = $css_generator;
    }

    /**
     * 🛡️ Add early loading protection to prevent FOUC
     */
    public function addEarlyLoadingProtection() {
        $protection_css = '
        <style id="woow-loading-protection">
            body.wp-admin {
                visibility: hidden;
                opacity: 0;
                transition: opacity 0.3s ease-in-out;
            }
            body.wp-admin.woow-loaded {
                visibility: visible;
                opacity: 1;
            }
        </style>
        <script>
            document.addEventListener("DOMContentLoaded", function() {
                document.body.classList.add("woow-loaded");
                setTimeout(function() {
                    var protectionStyle = document.getElementById("woow-loading-protection");
                    if (protectionStyle) {
                        protectionStyle.remove();
                    }
                }, 300);
            });
        </script>';
        
        echo $protection_css;
    }

    /**
     * 📊 Get loading statistics
     */
    public function getLoadingStats() {
        global $wp_scripts, $wp_styles;
        
        $stats = [
            'css_files' => 0,
            'js_files' => 0,
            'total_size' => 0,
            'performance_budget' => $this->performance_budget,
            'is_production' => $this->is_production
        ];
        
        // Count CSS files
        if (isset($wp_styles->done)) {
            foreach ($wp_styles->done as $handle) {
                if (strpos($handle, 'woow') !== false || strpos($handle, 'mas') !== false) {
                    $stats['css_files']++;
                }
            }
        }
        
        // Count JS files
        if (isset($wp_scripts->done)) {
            foreach ($wp_scripts->done as $handle) {
                if (strpos($handle, 'woow') !== false || strpos($handle, 'mas') !== false) {
                    $stats['js_files']++;
                }
            }
        }
        
        return $stats;
    }

    /**
     * 🚀 Get performance metrics
     */
    public function getPerformanceMetrics() {
        $metrics = [
            'memory_usage' => memory_get_usage(true),
            'memory_peak' => memory_get_peak_usage(true),
            'execution_time' => microtime(true) - $_SERVER['REQUEST_TIME_FLOAT'],
            'performance_budget' => $this->performance_budget,
            'is_production' => $this->is_production,
            'optimization_level' => $this->is_production ? 'production' : 'development'
        ];
        
        return $metrics;
    }
} 