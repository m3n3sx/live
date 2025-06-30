<?php
/**
 * Asset Loader Service
 * 
 * Odpowiedzialny za ładowanie i zarządzanie zasobami CSS/JS
 * 
 * @package ModernAdminStyler
 * @version 2.0
 */

namespace ModernAdminStyler\Services;

class AssetLoader {
    
    private $plugin_url;
    private $plugin_version;
    
    public function __construct($plugin_url, $plugin_version) {
        $this->plugin_url = $plugin_url;
        $this->plugin_version = $plugin_version;
    }
    
    /**
     * 🎯 Ładuje zasoby na stronach ustawień wtyczki
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
        
        // CSS dla interfejsu ustawień
        wp_enqueue_style(
            'mas-v2-interface',
            $this->plugin_url . 'assets/css/mas-v2-main.css',
            [],
            $this->plugin_version
        );
        
        // JavaScript dla interfejsu ustawień - UPGRADED V3 Data-Driven System
        wp_enqueue_script(
            'mas-v2-admin',
            $this->plugin_url . 'assets/js/admin-modern-v3.js',
            ['jquery', 'wp-color-picker'],
            $this->plugin_version,
            true
        );
        
        // 🔔 FAZA 5: Toast Notifications System
        wp_enqueue_script(
            'mas-v2-toast-notifications',
            $this->plugin_url . 'assets/js/toast-notifications.js',
            [],
            $this->plugin_version,
            true
        );
        
        wp_enqueue_style('wp-color-picker');
    }
    
    /**
     * 🌐 Ładuje globalne zasoby na wszystkich stronach wp-admin
     */
    public function enqueueGlobalAssets($hook) {
        // Nie ładuj na stronie logowania
        if (!is_admin() || $this->isLoginPage()) {
            return;
        }
        
        // 🚀 OPTYMALIZACJA: Unikaj podwójnego ładowania na stronach ustawień
        $mas_pages = [
            'toplevel_page_mas-v2-general',
            'modern-admin_page_mas-v2-general',
            'modern-admin_page_mas-v2-admin-bar',
            'modern-admin_page_mas-v2-menu',
            'modern-admin_page_mas-v2-typography',
            'modern-admin_page_mas-v2-advanced'
        ];
        
        if (in_array($hook, $mas_pages)) {
            return; // CSS będzie załadowany przez enqueueAdminAssets()
        }
        
        // Globalne CSS
        wp_enqueue_style(
            'mas-v2-main',
            $this->plugin_url . 'assets/css/mas-v2-main.css',
            [],
            $this->plugin_version
        );
        
        // Globalne JavaScript
        wp_enqueue_script(
            'mas-v2-global',
            $this->plugin_url . 'assets/js/admin-global.js',
            ['jquery'],
            $this->plugin_version,
            true
        );
    }
    
    /**
     * 🔒 Sprawdza czy jesteśmy na stronie logowania
     */
    private function isLoginPage() {
        return in_array($GLOBALS['pagenow'], ['wp-login.php', 'wp-register.php']);
    }
    
    /**
     * 🛡️ Dodaje wczesną ochronę przed animacjami podczas ładowania
     */
    public function addEarlyLoadingProtection() {
        ?>
        <script>
        // NAPRAW PROBLEM "ODLATUJĄCEGO MENU" - Wczesna ochrona
        (function() {
            document.documentElement.classList.add('mas-loading');
            document.body.classList.add('mas-loading');
            
            document.addEventListener('DOMContentLoaded', function() {
                setTimeout(function() {
                    document.documentElement.classList.remove('mas-loading');
                    document.body.classList.remove('mas-loading');
                }, 500);
            });
        })();
        </script>
        <?php
    }
} 