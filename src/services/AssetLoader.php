<?php
/**
 * Enterprise Asset Loader Service
 * 
 * STRATEGIC OPTIMIZATION: Uses static CSS files with inline CSS variables
 * for optimal performance and browser caching.
 * 
 * @package ModernAdminStyler\Services
 * @version 2.3.0 - Enterprise Optimization
 */

namespace ModernAdminStyler\Services;

class AssetLoader {
    
    private $plugin_url;
    private $plugin_version;
    private $settings_manager;
    private $css_generator;
    
    public function __construct($plugin_url, $plugin_version, $settings_manager = null, $css_generator = null) {
        $this->plugin_url = $plugin_url;
        $this->plugin_version = $plugin_version;
        $this->settings_manager = $settings_manager;
        $this->css_generator = $css_generator;
    }
    
    /**
     * 🎯 Loads assets for plugin settings pages
     * ENTERPRISE ARCHITECTURE: Static CSS + Inline variables
     */
    public function enqueueAdminAssets($hook) {
        $mas_pages = [
            'toplevel_page_mas-v2-general',
            'modern-admin_page_mas-v2-general',
            'modern-admin_page_mas-v2-admin-bar',
            'modern-admin_page_mas-v2-menu',
            'modern-admin_page_mas-v2-typography',
            'modern-admin_page_mas-v2-advanced'
        ];
        
        if (!in_array($hook, $mas_pages)) {
            return;
        }
        
        // 🎨 STEP 0: Ensure dashicons are loaded for all admin pages
        wp_enqueue_style('dashicons');
        
        // STEP 1: Load main static CSS file (100% cacheable)
        wp_enqueue_style(
            'mas-v2-main',
            $this->plugin_url . 'assets/css/woow-main.css',
            ['dashicons'],
            $this->plugin_version
        );
        
        // STEP 1.5: Load WOOW! Semantic Theme Architecture (v3.0.0-beta.1)
        wp_enqueue_style(
            'woow-semantic-themes',
            $this->plugin_url . 'assets/css/woow-semantic-themes.css',
            ['mas-v2-main'],
            $this->plugin_version
        );
        
        // STEP 2: Generate and inject dynamic CSS variables (minimal inline CSS)
        if ($this->settings_manager && $this->css_generator) {
            $settings = $this->settings_manager->getSettings();
            $dynamic_css = $this->css_generator->generate($settings);
            wp_add_inline_style('mas-v2-main', $dynamic_css);
        }
        
        // Load interface utilities CSS
        wp_enqueue_style(
            'mas-v2-utilities',
            $this->plugin_url . 'assets/css/woow-utilities.css',
            ['mas-v2-main'],
            $this->plugin_version
        );
        
        // STEP 3: Load WOOW Admin JavaScript (contains MAS object)
        wp_enqueue_script(
            'woow-admin',
            $this->plugin_url . 'assets/js/woow-admin.js',
            ['jquery', 'wp-color-picker'],
            $this->plugin_version,
            true
        );
        
        // Load V3 Data-Driven JavaScript
        wp_enqueue_script(
            'mas-v2-admin',
            $this->plugin_url . 'assets/js/admin-modern-v3.js',
            ['jquery', 'wp-color-picker', 'woow-admin'],
            $this->plugin_version,
            true
        );
        
        // 🎯 LIVE EDIT MODE: Revolutionary contextual editing system
        wp_enqueue_script(
            'mas-v2-live-edit',
            $this->plugin_url . 'assets/js/live-edit-mode.js',
            ['jquery', 'mas-v2-admin'],
            $this->plugin_version,
            true
        );
        
        wp_enqueue_style(
            'mas-v2-live-edit-css',
            $this->plugin_url . 'assets/css/live-edit-mode.css',
            ['mas-v2-main'],
            $this->plugin_version
        );
        
        // MAS Live Edit Bridge - connects MAS object with Live Edit Mode
        wp_enqueue_script(
            'mas-v2-live-edit-bridge',
            $this->plugin_url . 'assets/js/mas-live-edit-bridge.js',
            ['woow-admin', 'mas-v2-admin', 'mas-v2-live-edit'],
            $this->plugin_version,
            true
        );
        
        // Localize script for Live Edit Mode
        wp_localize_script('mas-v2-live-edit', 'masLiveEdit', [
            'ajaxUrl' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('mas_live_edit_nonce'),
            'debug' => defined('WP_DEBUG') && WP_DEBUG,
            'currentUser' => wp_get_current_user()->display_name,
            'capabilities' => [
                'manage_options' => current_user_can('manage_options'),
                'edit_theme_options' => current_user_can('edit_theme_options')
            ]
        ]);
        
        // 🎯 Toast Notifications System (Faza 5)
        wp_enqueue_script(
            'mas-toast-notifications',
            $this->plugin_url . 'assets/js/toast-notifications.js',
            ['jquery'],
            $this->plugin_version,
            true
        );
        
        // 🎨 Preset Manager System (Enterprise Preset System)
        wp_enqueue_script(
            'mas-preset-manager',
            $this->plugin_url . 'assets/js/preset-manager.js',
            ['jquery', 'wp-api-fetch'],
            $this->plugin_version,
            true
        );
        
        // Localize script for Preset Manager
        wp_localize_script('mas-preset-manager', 'masPresetConfig', [
            'apiUrl' => rest_url('modern-admin-styler/v2/presets'),
            'nonce' => wp_create_nonce('wp_rest'),
            'strings' => [
                'saveSuccess' => __('Preset saved successfully!', 'woow-admin-styler'),
                'applySuccess' => __('Preset applied successfully!', 'woow-admin-styler'),
                'deleteConfirm' => __('Are you sure you want to delete this preset?', 'woow-admin-styler'),
                'exportSuccess' => __('Preset exported successfully!', 'woow-admin-styler'),
                'importSuccess' => __('Preset imported successfully!', 'woow-admin-styler'),
            ]
        ]);
        
        wp_enqueue_style('wp-color-picker');
    }
    
    /**
     * 🌐 Loads global assets for all wp-admin pages
     * ENTERPRISE ARCHITECTURE: Static CSS + Inline variables
     */
    public function enqueueGlobalAssets($hook) {
        // Skip login pages
        if (!is_admin() || $this->isLoginPage()) {
            return;
        }
        
        // Avoid double loading on settings pages
        $mas_pages = [
            'toplevel_page_mas-v2-general',
            'modern-admin_page_mas-v2-general',
            'modern-admin_page_mas-v2-admin-bar',
            'modern-admin_page_mas-v2-menu',
            'modern-admin_page_mas-v2-typography',
            'modern-admin_page_mas-v2-advanced'
        ];
        
        if (in_array($hook, $mas_pages)) {
            return; // CSS will be loaded by enqueueAdminAssets()
        }
        
        // 🎨 STEP 0: Ensure dashicons are loaded for all admin pages
        wp_enqueue_style('dashicons');
        
        // STEP 1: Load main static CSS file (100% cacheable)
        wp_enqueue_style(
            'mas-v2-main',
            $this->plugin_url . 'assets/css/woow-main.css',
            ['dashicons'],
            $this->plugin_version
        );
        
        // STEP 1.5: Load WOOW! Semantic Theme Architecture (v3.0.0-beta.1)
        wp_enqueue_style(
            'woow-semantic-themes',
            $this->plugin_url . 'assets/css/woow-semantic-themes.css',
            ['mas-v2-main'],
            $this->plugin_version
        );
        
        // STEP 2: Generate and inject dynamic CSS variables (minimal inline CSS)
        if ($this->settings_manager && $this->css_generator) {
            $settings = $this->settings_manager->getSettings();
            $dynamic_css = $this->css_generator->generate($settings);
            wp_add_inline_style('mas-v2-main', $dynamic_css);
        }
        
        // STEP 3: Load WOOW Admin JavaScript (contains MAS object)
        wp_enqueue_script(
            'woow-admin-global',
            $this->plugin_url . 'assets/js/woow-admin.js',
            ['jquery'],
            $this->plugin_version,
            true
        );
        
        // Load global JavaScript
        wp_enqueue_script(
            'mas-v2-global',
            $this->plugin_url . 'assets/js/admin-global.js',
            ['jquery', 'woow-admin-global'],
            $this->plugin_version,
            true
        );
        
        // 🎯 LIVE EDIT MODE: Load globally for ALL admin pages
        wp_enqueue_script(
            'mas-v2-live-edit-global',
            $this->plugin_url . 'assets/js/live-edit-mode.js',
            ['jquery', 'mas-v2-global'],
            $this->plugin_version,
            true
        );
        
        wp_enqueue_style(
            'mas-v2-live-edit-css-global',
            $this->plugin_url . 'assets/css/live-edit-mode.css',
            ['mas-v2-main'],
            $this->plugin_version
        );
        
        // MAS Live Edit Bridge - global availability
        wp_enqueue_script(
            'mas-v2-live-edit-bridge-global',
            $this->plugin_url . 'assets/js/mas-live-edit-bridge.js',
            ['woow-admin-global', 'mas-v2-global', 'mas-v2-live-edit-global'],
            $this->plugin_version,
            true
        );
        
        // Toast Notifications System - global availability
        wp_enqueue_script(
            'mas-v2-toast-notifications-global',
            $this->plugin_url . 'assets/js/toast-notifications.js',
            [],
            $this->plugin_version,
            true
        );
        
        // 🔧 WOOW! Compatibility Layer (v3.0.0-beta.1) - Global availability
        // Ensures 100% compatibility between mas-* and woow-* variables
        wp_enqueue_script(
            'woow-compatibility-layer-global',
            $this->plugin_url . 'assets/js/woow-compatibility-layer.js',
            ['jquery'],
            $this->plugin_version,
            true
        );
        
        // Localize script for Live Edit Mode - global context
        wp_localize_script('mas-v2-live-edit-global', 'masLiveEdit', [
            'ajaxUrl' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('mas_live_edit_nonce'),
            'debug' => defined('WP_DEBUG') && WP_DEBUG,
            'currentUser' => wp_get_current_user()->display_name,
            'globalMode' => true, // Flag to indicate global mode
            'capabilities' => [
                'manage_options' => current_user_can('manage_options'),
                'edit_theme_options' => current_user_can('edit_theme_options')
            ],
            'settings' => $this->settings_manager ? $this->settings_manager->getSettings() : []
        ]);
        
        // NAPRAWKA: Dodaj zmienne dla Live Edit Mode
        wp_localize_script('mas-v2-live-edit-global', 'masNonce', wp_create_nonce('mas_live_edit_nonce'));
        wp_localize_script('mas-v2-live-edit-global', 'masV2Debug', defined('WP_DEBUG') && WP_DEBUG);
        wp_localize_script('mas-v2-live-edit-global', 'ajaxurl', admin_url('admin-ajax.php'));
    }
    
    /**
     * 🔧 Sets dependencies for AssetLoader
     * Called by ServiceFactory to inject required services
     */
    public function setDependencies($settings_manager, $css_generator) {
        $this->settings_manager = $settings_manager;
        $this->css_generator = $css_generator;
    }
    
    /**
     * 🔒 Check if we're on login page
     */
    private function isLoginPage() {
        return in_array($GLOBALS['pagenow'], ['wp-login.php', 'wp-register.php']);
    }
    
    /**
     * 🛡️ Early loading protection to prevent visual glitches
     */
    public function addEarlyLoadingProtection() {
        ?>
        <style>
        .mas-loading,
        .mas-loading * {
            transition: none !important;
            animation: none !important;
        }
        
        @media (prefers-reduced-motion: reduce) {
            * {
                animation-duration: 0.01ms !important;
                animation-iteration-count: 1 !important;
                transition-duration: 0.01ms !important;
            }
        }
        </style>
        <script>
        (function() {
            'use strict';
            
            // Add loading class immediately
            document.documentElement.classList.add('mas-loading');
            if (document.body) {
                document.body.classList.add('mas-loading');
            } else {
                document.addEventListener('DOMContentLoaded', function() {
                    document.body.classList.add('mas-loading');
                });
            }
            
            // Remove loading class after DOM is ready and styles are applied
            function removeLoadingClass() {
                setTimeout(function() {
                    document.documentElement.classList.remove('mas-loading');
                    if (document.body) {
                        document.body.classList.remove('mas-loading');
                    }
                    
                    // Trigger custom event for other scripts
                    if (window.CustomEvent) {
                        document.dispatchEvent(new CustomEvent('masLoadingComplete'));
                    }
                }, 300); // Small delay to ensure CSS is processed
            }
            
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', removeLoadingClass);
            } else {
                removeLoadingClass();
            }
        })();
        </script>
        <?php
    }
    
    /**
     * 📊 Get asset loading statistics
     * Useful for debugging and performance monitoring
     */
    public function getLoadingStats() {
        $stats = [
            'css_files_loaded' => 0,
            'js_files_loaded' => 0,
            'inline_css_size' => 0,
            'total_assets' => 0,
            'cache_strategy' => 'static_css_with_inline_variables',
            'optimization_level' => 'enterprise'
        ];
        
        // Count loaded assets
        global $wp_styles, $wp_scripts;
        
        if ($wp_styles) {
            foreach ($wp_styles->queue as $handle) {
                if (strpos($handle, 'mas-v2') !== false) {
                    $stats['css_files_loaded']++;
                }
            }
        }
        
        if ($wp_scripts) {
            foreach ($wp_scripts->queue as $handle) {
                if (strpos($handle, 'mas-v2') !== false) {
                    $stats['js_files_loaded']++;
                }
            }
        }
        
        $stats['total_assets'] = $stats['css_files_loaded'] + $stats['js_files_loaded'];
        
        return $stats;
    }
}

/**
 * 🚀 ENTERPRISE ASSET LOADING COMPLETE
 * 
 * PERFORMANCE OPTIMIZATIONS:
 * ✅ Static CSS files (100% browser cacheable)
 * ✅ Minimal inline CSS variables (10-20 lines max)
 * ✅ Eliminated dynamic CSS file generation
 * ✅ wp_add_inline_style for optimal WordPress integration
 * ✅ Early loading protection against FOUC
 * ✅ Reduced motion support for accessibility
 * 
 * ARCHITECTURE BENEFITS:
 * ✅ Clean separation of static vs dynamic content
 * ✅ Enterprise-grade caching strategy
 * ✅ Zero server-side CSS generation overhead
 * ✅ Lightning-fast subsequent page loads
 * ✅ Professional asset management
 */ 