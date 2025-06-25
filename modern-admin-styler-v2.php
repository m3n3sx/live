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

// Definicje stałych
define('MAS_V2_VERSION', '2.2.0');
define('MAS_V2_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('MAS_V2_PLUGIN_URL', plugin_dir_url(__FILE__));
define('MAS_V2_PLUGIN_FILE', __FILE__);

/**
 * Główna klasa wtyczki - Nowa architektura
 */
class ModernAdminStylerV2 {
    
    private static $instance = null;
    private $adminController;
    private $assetService;
    private $settingsService;
    
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
        // Autoloader
        spl_autoload_register([$this, 'autoload']);
        
        // Inicjalizacja serwisów
        $this->initServices();
        
        // Legacy mode dla kompatybilności
        $this->initLegacyMode();
        
        // Hooks
        add_action('init', [$this, 'loadTextdomain']);
        add_action('admin_menu', [$this, 'addAdminMenu']);
        add_action('admin_enqueue_scripts', [$this, 'enqueueAssets']);
        add_action('wp_enqueue_scripts', [$this, 'enqueueGlobalAssets']);
        
        // AJAX handlers
        add_action('wp_ajax_mas_v2_save_settings', [$this, 'ajaxSaveSettings']);
        add_action('wp_ajax_mas_v2_reset_settings', [$this, 'ajaxResetSettings']);
        add_action('wp_ajax_mas_v2_export_settings', [$this, 'ajaxExportSettings']);
        add_action('wp_ajax_mas_v2_import_settings', [$this, 'ajaxImportSettings']);
        add_action('wp_ajax_mas_v2_live_preview', [$this, 'ajaxLivePreview']);
        
        // Output custom styles
        add_action('admin_head', [$this, 'outputCustomStyles']);
        add_action('wp_head', [$this, 'outputFrontendStyles']);
        add_action('login_head', [$this, 'outputLoginStyles']);
        
        // Footer modifications
        add_filter('admin_footer_text', [$this, 'customAdminFooter']);
        
        // Body class modifications
        add_filter('admin_body_class', [$this, 'addAdminBodyClasses']);
        
        // Activation/Deactivation hooks
        register_activation_hook(__FILE__, [$this, 'activate']);
        register_deactivation_hook(__FILE__, [$this, 'deactivate']);
        
        // Allow framing for localhost viewer
        add_action('init', [$this, 'allowFramingForLocalhostViewer']);
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
     * Inicjalizacja serwisów
     */
    public function initServices() {
        // Na razie używamy legacy mode - nowa architektura będzie dodana później
        // Ta funkcja jest przygotowana na przyszłe rozszerzenie
        $this->initLegacyMode();
    }
    
    /**
     * Tryb zgodności ze starą wersją
     */
    private function initLegacyMode() {
        add_action('admin_menu', [$this, 'addAdminMenu']);
        add_action('admin_enqueue_scripts', [$this, 'enqueueAssets']);
        add_action('admin_enqueue_scripts', [$this, 'enqueueGlobalAssets']); // CSS na wszystkich stronach
        add_action('admin_head', [$this, 'outputCustomStyles']); // Style inline
        add_action('wp_ajax_mas_v2_save_settings', [$this, 'ajaxSaveSettings']);
        add_action('wp_ajax_mas_v2_reset_settings', [$this, 'ajaxResetSettings']);
        add_action('wp_ajax_mas_v2_export_settings', [$this, 'ajaxExportSettings']);
        add_action('wp_ajax_mas_v2_import_settings', [$this, 'ajaxImportSettings']);
        add_action('wp_ajax_mas_v2_live_preview', [$this, 'ajaxLivePreview']);
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
     * Legacy: Dodanie menu w adminpanel
     */
    public function addAdminMenu() {
        // Główne menu
        add_menu_page(
            __('Modern Admin Styler V2', 'modern-admin-styler-v2'),
            __('MAS V2', 'modern-admin-styler-v2'),
            'manage_options',
            'mas-v2-settings',
            [$this, 'renderAdminPage'],
            'data:image/svg+xml;base64,' . base64_encode('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/></svg>'),
            30
        );

        // Submenu dla poszczególnych zakładek
        add_submenu_page(
            'mas-v2-settings',
            __('Ogólne', 'modern-admin-styler-v2'),
            __('Ogólne', 'modern-admin-styler-v2'),
            'manage_options',
            'mas-v2-general',
            [$this, 'renderTabPage']
        );

        add_submenu_page(
            'mas-v2-settings',
            __('Pasek Admin', 'modern-admin-styler-v2'),
            __('Pasek Admin', 'modern-admin-styler-v2'),
            'manage_options',
            'mas-v2-admin-bar',
            [$this, 'renderTabPage']
        );

        add_submenu_page(
            'mas-v2-settings',
            __('Menu boczne', 'modern-admin-styler-v2'),
            __('Menu boczne', 'modern-admin-styler-v2'),
            'manage_options',
            'mas-v2-menu',
            [$this, 'renderTabPage']
        );

        add_submenu_page(
            'mas-v2-settings',
            __('Treść', 'modern-admin-styler-v2'),
            __('Treść', 'modern-admin-styler-v2'),
            'manage_options',
            'mas-v2-content',
            [$this, 'renderTabPage']
        );

        add_submenu_page(
            'mas-v2-settings',
            __('Przyciski', 'modern-admin-styler-v2'),
            __('Przyciski', 'modern-admin-styler-v2'),
            'manage_options',
            'mas-v2-buttons',
            [$this, 'renderTabPage']
        );

        add_submenu_page(
            'mas-v2-settings',
            __('Logowanie', 'modern-admin-styler-v2'),
            __('Logowanie', 'modern-admin-styler-v2'),
            'manage_options',
            'mas-v2-login',
            [$this, 'renderTabPage']
        );

        add_submenu_page(
            'mas-v2-settings',
            __('Typografia', 'modern-admin-styler-v2'),
            __('Typografia', 'modern-admin-styler-v2'),
            'manage_options',
            'mas-v2-typography',
            [$this, 'renderTabPage']
        );

        add_submenu_page(
            'mas-v2-settings',
            __('Efekty', 'modern-admin-styler-v2'),
            __('Efekty', 'modern-admin-styler-v2'),
            'manage_options',
            'mas-v2-effects',
            [$this, 'renderTabPage']
        );

        add_submenu_page(
            'mas-v2-settings',
            __('Szablony', 'modern-admin-styler-v2'),
            __('🎨 Szablony', 'modern-admin-styler-v2'),
            'manage_options',
            'mas-v2-templates',
            [$this, 'renderTabPage']
        );

        add_submenu_page(
            'mas-v2-settings',
            __('Zaawansowane', 'modern-admin-styler-v2'),
            __('Zaawansowane', 'modern-admin-styler-v2'),
            'manage_options',
            'mas-v2-advanced',
            [$this, 'renderTabPage']
        );
    }
    
    /**
     * Legacy: Enqueue CSS i JS na stronie ustawień pluginu
     */
    public function enqueueAssets($hook) {
        // Sprawdź czy jesteśmy na którejś ze stron wtyczki
        $mas_pages = [
            'toplevel_page_mas-v2-settings',
            'mas-v2_page_mas-v2-general',
            'mas-v2_page_mas-v2-admin-bar',
            'mas-v2_page_mas-v2-menu',
            'mas-v2_page_mas-v2-content',
            'mas-v2_page_mas-v2-typography',
            'mas-v2_page_mas-v2-effects',
            'mas-v2_page_mas-v2-templates',
            'mas-v2_page_mas-v2-advanced'
        ];
        
        if (!in_array($hook, $mas_pages)) {
            return;
        }
        
        // JS tylko na stronie ustawień
        wp_enqueue_script(
            'mas-v2-admin',
            MAS_V2_PLUGIN_URL . 'assets/js/admin-modern.js',
            ['jquery', 'wp-color-picker'],
            MAS_V2_VERSION,
            true
        );
        
        wp_enqueue_style('wp-color-picker');
        
        // Localize script
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
    
    /**
     * Enqueue CSS i JS na wszystkich stronach wp-admin
     */
    public function enqueueGlobalAssets($hook) {
        // Nie ładuj CSS/JS na stronie logowania lub jeśli jesteśmy poza admin
        if (!is_admin() || $this->isLoginPage()) {
            return;
        }
        
        // CSS na wszystkich stronach wp-admin (oprócz logowania)
        wp_enqueue_style(
            'mas-v2-global',
            MAS_V2_PLUGIN_URL . 'assets/css/admin-modern.css',
            [],
            MAS_V2_VERSION
        );
        
        // Lekki JS na wszystkich stronach wp-admin
        wp_enqueue_script(
            'mas-v2-global',
            MAS_V2_PLUGIN_URL . 'assets/js/admin-global.js',
            ['jquery'],
            MAS_V2_VERSION,
            true
        );
        
        // Przekaż ustawienia do globalnego JS
        wp_localize_script('mas-v2-global', 'masV2Global', [
            'settings' => $this->getSettings()
        ]);
    }
    
    /**
     * Sprawdza czy jesteśmy na stronie logowania
     */
    private function isLoginPage() {
        return in_array($GLOBALS['pagenow'], ['wp-login.php', 'wp-register.php']);
    }
    
    /**
     * Legacy: Renderowanie strony administracyjnej  
     */
    public function renderAdminPage() {
        $settings = $this->getSettings();
        $tabs = $this->getTabs();
        
        // Używaj nowego template jeśli istnieje
        $newTemplate = MAS_V2_PLUGIN_DIR . 'src/views/admin-page.php';
        if (file_exists($newTemplate)) {
            // Dodaj zmienną dostępną w template
            $plugin_instance = $this;
            include $newTemplate;
        } else {
            // Fallback do starego template
        include MAS_V2_PLUGIN_DIR . 'templates/admin-page.php';
        }
    }

    /**
     * Renderowanie strony poszczególnych zakładek
     */
    public function renderTabPage() {
        $settings = $this->getSettings();
        
        // Określ aktywną zakładkę na podstawie URL
        $current_page = $_GET['page'] ?? '';
        $active_tab = 'general';
        
        switch ($current_page) {
            case 'mas-v2-general':
                $active_tab = 'general';
                break;
            case 'mas-v2-admin-bar':
                $active_tab = 'admin-bar';
                break;
            case 'mas-v2-menu':
                $active_tab = 'menu';
                break;
            case 'mas-v2-content':
                $active_tab = 'content';
                break;
            case 'mas-v2-buttons':
                $active_tab = 'buttons';
                break;
            case 'mas-v2-login':
                $active_tab = 'login';
                break;
            case 'mas-v2-typography':
                $active_tab = 'typography';
                break;
            case 'mas-v2-effects':
                $active_tab = 'effects';
                break;
            case 'mas-v2-templates':
                $active_tab = 'templates';
                break;
            case 'mas-v2-advanced':
                $active_tab = 'advanced';
                break;
        }
        
        // Sprawdź czy formularz został wysłany
        if (isset($_POST['mas_v2_nonce']) && wp_verify_nonce($_POST['mas_v2_nonce'], 'mas_v2_nonce')) {
            $settings = $this->sanitizeSettings($_POST);
            update_option('mas_v2_settings', $settings);
            
            echo '<div class="notice notice-success is-dismissible"><p>' . 
                 __('Ustawienia zostały zapisane!', 'modern-admin-styler-v2') . 
                 '</p></div>';
        }
        
        // Załaduj template z aktywną zakładką
        $plugin_instance = $this;
        include MAS_V2_PLUGIN_DIR . 'src/views/admin-page.php';
    }
    
    /**
     * Legacy: AJAX Zapisywanie ustawień
     */
    public function ajaxSaveSettings() {
        // Weryfikacja nonce
        if (!wp_verify_nonce($_POST['nonce'] ?? '', 'mas_v2_nonce')) {
            wp_send_json_error(['message' => __('Błąd bezpieczeństwa', 'modern-admin-styler-v2')]);
        }
        
        // Sprawdzenie uprawnień
        if (!current_user_can('manage_options')) {
            wp_send_json_error(['message' => __('Brak uprawnień', 'modern-admin-styler-v2')]);
        }
        
        try {
        // Sanityzacja i zapisanie danych
            $settings = $this->sanitizeSettings($_POST);
            update_option('mas_v2_settings', $settings);
            
            wp_send_json_success([
                'message' => __('Ustawienia zostały zapisane pomyślnie!', 'modern-admin-styler-v2'),
                'settings' => $settings
            ]);
        } catch (Exception $e) {
            wp_send_json_error(['message' => $e->getMessage()]);
        }
    }
    
    /**
     * AJAX Reset ustawień
     */
    public function ajaxResetSettings() {
        if (!wp_verify_nonce($_POST['nonce'] ?? '', 'mas_v2_nonce')) {
            wp_send_json_error(['message' => __('Błąd bezpieczeństwa', 'modern-admin-styler-v2')]);
        }
        
        if (!current_user_can('manage_options')) {
            wp_send_json_error(['message' => __('Brak uprawnień', 'modern-admin-styler-v2')]);
        }
        
        try {
            $defaults = $this->getDefaultSettings();
            update_option('mas_v2_settings', $defaults);
            $this->clearCache();
        
        wp_send_json_success([
                'message' => __('Ustawienia zostały przywrócone do domyślnych!', 'modern-admin-styler-v2')
            ]);
        } catch (Exception $e) {
            wp_send_json_error(['message' => $e->getMessage()]);
        }
    }
    
    /**
     * AJAX Export ustawień
     */
    public function ajaxExportSettings() {
        if (!wp_verify_nonce($_POST['nonce'] ?? '', 'mas_v2_nonce')) {
            wp_send_json_error(['message' => __('Błąd bezpieczeństwa', 'modern-admin-styler-v2')]);
        }
        
        if (!current_user_can('manage_options')) {
            wp_send_json_error(['message' => __('Brak uprawnień', 'modern-admin-styler-v2')]);
        }
        
        try {
            $settings = $this->getSettings();
            $export_data = [
                'version' => MAS_V2_VERSION,
                'exported' => date('Y-m-d H:i:s'),
                'settings' => $settings
            ];
            
            wp_send_json_success([
                'data' => $export_data,
                'filename' => 'mas-v2-settings-' . date('Y-m-d-H-i-s') . '.json'
            ]);
        } catch (Exception $e) {
            wp_send_json_error(['message' => $e->getMessage()]);
        }
    }
    
    /**
     * AJAX Import ustawień
     */
    public function ajaxImportSettings() {
        if (!wp_verify_nonce($_POST['nonce'] ?? '', 'mas_v2_nonce')) {
            wp_send_json_error(['message' => __('Błąd bezpieczeństwa', 'modern-admin-styler-v2')]);
        }
        
        if (!current_user_can('manage_options')) {
            wp_send_json_error(['message' => __('Brak uprawnień', 'modern-admin-styler-v2')]);
        }
        
        try {
            $import_data = json_decode(stripslashes($_POST['data']), true);
            
            if (!$import_data || !isset($import_data['settings'])) {
                wp_send_json_error(['message' => __('Nieprawidłowy format pliku', 'modern-admin-styler-v2')]);
            }
            
            $settings = $this->sanitizeSettings($import_data['settings']);
            update_option('mas_v2_settings', $settings);
            $this->clearCache();
            
            wp_send_json_success([
                'message' => __('Ustawienia zostały zaimportowane pomyślnie!', 'modern-admin-styler-v2')
            ]);
        } catch (Exception $e) {
            wp_send_json_error(['message' => $e->getMessage()]);
        }
    }
    
    /**
     * AJAX Live Preview
     */
    public function ajaxLivePreview() {
        if (!wp_verify_nonce($_POST['nonce'] ?? '', 'mas_v2_nonce')) {
            wp_send_json_error(['message' => __('Błąd bezpieczeństwa', 'modern-admin-styler-v2')]);
        }
        
        if (!current_user_can('manage_options')) {
            wp_send_json_error(['message' => __('Brak uprawnień', 'modern-admin-styler-v2')]);
        }
        
        try {
            $settings = $this->sanitizeSettings($_POST);
            $css = $this->generateCSSVariables($settings);
            $css .= $this->generateAdminCSS($settings);
            
            wp_send_json_success([
                'css' => $css
            ]);
        } catch (Exception $e) {
            wp_send_json_error(['message' => $e->getMessage()]);
        }
    }
    
    /**
     * Wyjście niestandardowych stylów do admin head
     */
    public function outputCustomStyles() {
        if (!is_admin() || $this->isLoginPage()) {
            return;
        }
        
        $settings = $this->getSettings();
        
        if (empty($settings)) {
            return;
        }
        
        // Sprawdź czy wtyczka jest włączona
        if (!isset($settings['enable_plugin']) || !$settings['enable_plugin']) {
            return;
        }
        
        $css = $this->generateCSSVariables($settings);
        $css .= $this->generateAdminCSS($settings);
        $css .= $this->generateButtonCSS($settings);
        $css .= $this->generateFormCSS($settings);
        $css .= $this->generateAdvancedCSS($settings);
        
        echo "<style id='mas-v2-dynamic-styles'>\n";
        echo $css;
        echo "\n</style>\n";
        
        // Custom JavaScript
        if (!empty($settings['custom_js'])) {
            echo "<script>\n";
            echo "jQuery(document).ready(function($) {\n";
            echo $settings['custom_js'] . "\n";
            echo "});\n";
            echo "</script>\n";
        }
        
        // JavaScript do dodawania klas CSS do body
        ?>
        <script>
        document.addEventListener('DOMContentLoaded', function() {
            var body = document.body;
            
            // Dodaj klasy dla floating elementów (nowe opcje)
            <?php if (isset($settings['menu_floating']) && $settings['menu_floating']): ?>
            body.classList.add('mas-v2-menu-floating');
            <?php else: ?>
            body.classList.remove('mas-v2-menu-floating');
            <?php endif; ?>
            
            <?php if (isset($settings['admin_bar_floating']) && $settings['admin_bar_floating']): ?>
            body.classList.add('mas-v2-admin-bar-floating');
            <?php else: ?>
            body.classList.remove('mas-v2-admin-bar-floating');
            <?php endif; ?>
            
            // Dodaj klasy dla glossy efektów
            <?php if (isset($settings['menu_glossy']) && $settings['menu_glossy']): ?>
            body.classList.add('mas-v2-menu-glossy');
            <?php else: ?>
            body.classList.remove('mas-v2-menu-glossy');
            <?php endif; ?>
            
            <?php if (isset($settings['admin_bar_glossy']) && $settings['admin_bar_glossy']): ?>
            body.classList.add('mas-v2-admin-bar-glossy');
            <?php else: ?>
            body.classList.remove('mas-v2-admin-bar-glossy');
            <?php endif; ?>
            
            // Dodaj klasy dla border radius (nowe opcje)
            <?php if (isset($settings['menu_border_radius_type']) && $settings['menu_border_radius_type'] === 'individual'): ?>
            body.classList.add('mas-v2-menu-radius-individual');
            <?php else: ?>
            body.classList.remove('mas-v2-menu-radius-individual');
            <?php endif; ?>
            
            <?php if (isset($settings['admin_bar_border_radius_type']) && $settings['admin_bar_border_radius_type'] === 'individual'): ?>
            body.classList.add('mas-v2-admin-bar-radius-individual');
            <?php else: ?>
            body.classList.remove('mas-v2-admin-bar-radius-individual');
            <?php endif; ?>
            
            // Backward compatibility - dodaj klasy dla starych opcji
            <?php if (isset($settings['menu_detached']) && $settings['menu_detached']): ?>
            body.classList.add('mas-menu-floating');
            body.classList.remove('mas-menu-normal');
            <?php else: ?>
            body.classList.add('mas-menu-normal');
            body.classList.remove('mas-menu-floating');
            <?php endif; ?>
            
            <?php if (isset($settings['admin_bar_detached']) && $settings['admin_bar_detached']): ?>
            body.classList.add('mas-admin-bar-floating');
            <?php else: ?>
            body.classList.remove('mas-admin-bar-floating');
            <?php endif; ?>
            
            // Debug
            console.log('MAS V2: Body classes added:', body.className.split(' ').filter(c => c.startsWith('mas-')));
        });
        </script>
        <?php
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
        
        // Menu width - normalne i collapsed
        $menuWidth = isset($settings['menu_width']) ? $settings['menu_width'] : 160;
        $css .= "--mas-menu-width: {$menuWidth}px;";
        $css .= "--mas-menu-width-collapsed: 36px;";
        
        // Admin bar height
        $adminBarHeight = isset($settings['admin_bar_height']) ? $settings['admin_bar_height'] : 32;
        $css .= "--mas-admin-bar-height: {$adminBarHeight}px;";
        
        // Menu margin (dla floating) - nowe ustawienia z fallback
        $marginType = $settings['menu_detached_margin_type'] ?? 'all';
        if ($marginType === 'all') {
            $marginAll = $settings['menu_detached_margin_all'] ?? $settings['menu_detached_margin'] ?? 20;
            $css .= "--mas-menu-margin-top: {$marginAll}px;";
            $css .= "--mas-menu-margin-right: {$marginAll}px;";
            $css .= "--mas-menu-margin-bottom: {$marginAll}px;";
            $css .= "--mas-menu-margin-left: {$marginAll}px;";
        } else {
            $marginTop = $settings['menu_detached_margin_top'] ?? 20;
            $marginRight = $settings['menu_detached_margin_right'] ?? 20;
            $marginBottom = $settings['menu_detached_margin_bottom'] ?? 20;
            $marginLeft = $settings['menu_detached_margin_left'] ?? 20;
            $css .= "--mas-menu-margin-top: {$marginTop}px;";
            $css .= "--mas-menu-margin-right: {$marginRight}px;";
            $css .= "--mas-menu-margin-bottom: {$marginBottom}px;";
            $css .= "--mas-menu-margin-left: {$marginLeft}px;";
        }
        
        // Stary fallback dla kompatybilności
        $oldMargin = $settings['menu_detached_margin'] ?? 20;
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
        
        $css .= '}';
        
        return $css;
    }
    
    /**
     * Generowanie CSS dla admin area
     */
    private function generateAdminCSS($settings) {
        $css = '';
        
        // Admin Bar CSS
        $css .= $this->generateAdminBarCSS($settings);
        
        // Menu CSS
        $css .= $this->generateMenuCSS($settings);
        
        // Content CSS
        $css .= $this->generateContentCSS($settings);
        
        // Button CSS
        $css .= $this->generateButtonCSS($settings);
        
        return $css;
    }
    
    /**
     * Generowanie CSS dla frontend
     */
    private function generateFrontendCSS($settings) {
        return $this->generateAdminCSS($settings);
    }
    
    /**
     * Generuje CSS dla Admin Bar
     */
    private function generateAdminBarCSS($settings) {
        $css = '';
        
        // Podstawowe style admin bar
        $css .= "#wpadminbar {";
        if (isset($settings['admin_bar_background'])) {
            $css .= "background: {$settings['admin_bar_background']} !important;";
        }
        if (isset($settings['admin_bar_height'])) {
            $css .= "height: {$settings['admin_bar_height']}px !important;";
        }
        
        // Zaokrąglenie narożników Admin Bar
        $cornerType = $settings['admin_bar_corner_radius_type'] ?? 'none';
        if ($cornerType === 'all' && ($settings['admin_bar_corner_radius_all'] ?? 0) > 0) {
            $radius = $settings['admin_bar_corner_radius_all'];
            $css .= "border-radius: {$radius}px;";
        } elseif ($cornerType === 'individual') {
            $tl = $settings['admin_bar_corner_radius_top_left'] ?? 0;
            $tr = $settings['admin_bar_corner_radius_top_right'] ?? 0;
            $br = $settings['admin_bar_corner_radius_bottom_right'] ?? 0;
            $bl = $settings['admin_bar_corner_radius_bottom_left'] ?? 0;
            $css .= "border-radius: {$tl}px {$tr}px {$br}px {$bl}px;";
        }
        
        if (isset($settings['admin_bar_shadow']) && $settings['admin_bar_shadow']) {
            $css .= "box-shadow: 0 2px 8px rgba(0,0,0,0.1);";
        }
        
        if (isset($settings['admin_bar_glassmorphism']) && $settings['admin_bar_glassmorphism']) {
            $css .= "backdrop-filter: blur(10px);";
            $css .= "background: rgba(35, 40, 45, 0.8) !important;";
        }
        
        // Floating Admin Bar (nowa implementacja)
        if (isset($settings['admin_bar_floating']) && $settings['admin_bar_floating']) {
            $marginType = $settings['admin_bar_margin_type'] ?? 'all';
            if ($marginType === 'all') {
                $margin = $settings['admin_bar_margin'] ?? 10;
                $css .= "position: fixed !important;";
                $css .= "top: {$margin}px !important;";
                $css .= "left: {$margin}px !important;";
                $css .= "right: {$margin}px !important;";
                $css .= "width: calc(100% - " . ($margin * 2) . "px) !important;";
            } else {
                $marginTop = $settings['admin_bar_margin_top'] ?? 10;
                $marginRight = $settings['admin_bar_margin_right'] ?? 10;
                $marginLeft = $settings['admin_bar_margin_left'] ?? 10;
                $css .= "position: fixed !important;";
                $css .= "top: {$marginTop}px !important;";
                $css .= "left: {$marginLeft}px !important;";
                $css .= "right: {$marginRight}px !important;";
                $css .= "width: calc(100% - {$marginLeft}px - {$marginRight}px) !important;";
            }
            $css .= "z-index: 99999 !important;";
            $css .= "box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3) !important;";
        }
        
        // Glossy effect
        if (isset($settings['admin_bar_glossy']) && $settings['admin_bar_glossy']) {
            $css .= "backdrop-filter: blur(20px) !important;";
            $css .= "-webkit-backdrop-filter: blur(20px) !important;";
            $css .= "background: rgba(23, 23, 23, 0.8) !important;";
            $css .= "border: 1px solid rgba(255, 255, 255, 0.1) !important;";
        }
        
        // Border radius - nowa implementacja
        $borderRadiusType = $settings['admin_bar_border_radius_type'] ?? 'all';
        if ($borderRadiusType === 'all' && ($settings['admin_bar_border_radius'] ?? 0) > 0) {
            $radius = $settings['admin_bar_border_radius'];
            $css .= "border-radius: {$radius}px !important;";
        } elseif ($borderRadiusType === 'individual') {
            $radiusValues = [];
            $radiusValues[] = ($settings['admin_bar_radius_tl'] ?? false) ? '12px' : '0px';
            $radiusValues[] = ($settings['admin_bar_radius_tr'] ?? false) ? '12px' : '0px';
            $radiusValues[] = ($settings['admin_bar_radius_br'] ?? false) ? '12px' : '0px';
            $radiusValues[] = ($settings['admin_bar_radius_bl'] ?? false) ? '12px' : '0px';
            $css .= "border-radius: " . implode(' ', $radiusValues) . " !important;";
        }
        
        // Backward compatibility dla admin_bar_detached
        if (isset($settings['admin_bar_detached']) && $settings['admin_bar_detached']) {
            $css .= "position: fixed !important;";
            $css .= "top: 10px !important;";
            $css .= "left: 10px !important;";
            $css .= "right: 10px !important;";
            $css .= "width: auto !important;";
            $css .= "border-radius: 8px;";
            $css .= "z-index: 99999;";
        }
        
        $css .= "}";
        
        // Tekst w admin bar
        if (isset($settings['admin_bar_text_color']) || isset($settings['admin_bar_font_size'])) {
            $css .= "#wpadminbar .ab-item,";
            $css .= "#wpadminbar a.ab-item,";
            $css .= "#wpadminbar > #wp-toolbar span.ab-label,";
            $css .= "#wpadminbar > #wp-toolbar span.noticon {";
            if (isset($settings['admin_bar_text_color'])) {
                $css .= "color: {$settings['admin_bar_text_color']} !important;";
            }
            if (isset($settings['admin_bar_font_size'])) {
                $css .= "font-size: {$settings['admin_bar_font_size']}px !important;";
            }
            $css .= "}";
        }
        
        // Hover effects
        if (isset($settings['admin_bar_hover_color'])) {
            $css .= "#wpadminbar .ab-top-menu > li:hover > .ab-item,";
            $css .= "#wpadminbar .ab-top-menu > li > .ab-item:focus,";
            $css .= "#wpadminbar.nojq .quicklinks .ab-top-menu > li > .ab-item:focus {";
            $css .= "color: {$settings['admin_bar_hover_color']} !important;";
            $css .= "}";
        }
        
        // Admin Bar Submenu styles
        $submenuBg = isset($settings['admin_bar_background']) ? $settings['admin_bar_background'] : '#32373c';
        $submenuText = isset($settings['admin_bar_text_color']) ? $settings['admin_bar_text_color'] : '#ffffff';
        
        $css .= "#wpadminbar .ab-submenu {";
        $css .= "background: {$submenuBg} !important;";
        $css .= "border: 1px solid rgba(255,255,255,0.1) !important;";
        $css .= "box-shadow: 0 3px 5px rgba(0,0,0,0.2) !important;";
        $css .= "}";
        
        $css .= "#wpadminbar .ab-submenu .ab-item {";
        $css .= "color: {$submenuText} !important;";
        $css .= "}";
        
        $css .= "#wpadminbar .ab-submenu .ab-item:hover {";
        if (isset($settings['admin_bar_hover_color'])) {
            $css .= "color: {$settings['admin_bar_hover_color']} !important;";
        }
        $css .= "background: rgba(255,255,255,0.1) !important;";
        $css .= "}";
        
        return $css;
    }
    
    /**
     * Generuje CSS dla menu administracyjnego
     */
    private function generateMenuCSS($settings) {
        $css = '';
        
        // Menu główne - tylko #adminmenu ma kolor tła
        $menuBg = isset($settings['menu_background']) ? $settings['menu_background'] : '#23282d';
        $css .= "#adminmenu {";
        $css .= "background: {$menuBg} !important;";
        $css .= "background-color: {$menuBg} !important;";
        $css .= "}";
        
        // adminmenuback ukryty, adminmenuwrap bez tła
        $css .= "#adminmenuback {";
        $css .= "display: none !important;";
        $css .= "}";
        
        $css .= "#adminmenuwrap {";
        $css .= "background: transparent !important;";
        $css .= "background-color: transparent !important;";
        $css .= "}";
        
        // Właściwości tylko dla #adminmenu
        $css .= "#adminmenu {";
        
        // Floating Menu (nowa implementacja)
        if (isset($settings['menu_floating']) && $settings['menu_floating']) {
            $marginType = $settings['menu_margin_type'] ?? 'all';
            if ($marginType === 'all') {
                $margin = $settings['menu_margin'] ?? 10;
                $marginTop = $marginLeft = $marginRight = $marginBottom = $margin;
            } else {
                $marginTop = $settings['menu_margin_top'] ?? 10;
                $marginRight = $settings['menu_margin_right'] ?? 10;
                $marginBottom = $settings['menu_margin_bottom'] ?? 10;
                $marginLeft = $settings['menu_margin_left'] ?? 10;
            }
            
            $adminBarHeight = isset($settings['admin_bar_height']) ? $settings['admin_bar_height'] : 32;
            $css .= "position: fixed !important;";
            $css .= "top: " . ($adminBarHeight + $marginTop) . "px !important;";
            $css .= "left: {$marginLeft}px !important;";
            $css .= "bottom: {$marginBottom}px !important;";
            $css .= "right: auto !important;";
            $css .= "width: " . ($settings['menu_width'] ?? 160) . "px !important;";
            $css .= "max-width: " . ($settings['menu_width'] ?? 160) . "px !important;";
            $css .= "z-index: 9999 !important;";
            $css .= "box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3) !important;";
        }
        
        // Glossy effect (nowa implementacja)
        if (isset($settings['menu_glossy']) && $settings['menu_glossy']) {
            $css .= "backdrop-filter: blur(20px) !important;";
            $css .= "-webkit-backdrop-filter: blur(20px) !important;";
            
            // Konwertuj hex na rgba z przezroczystością dla glossy
            $hexColor = $menuBg;
            if (strlen($hexColor) == 7) {
                $r = hexdec(substr($hexColor, 1, 2));
                $g = hexdec(substr($hexColor, 3, 2));
                $b = hexdec(substr($hexColor, 5, 2));
                $css .= "background: rgba({$r}, {$g}, {$b}, 0.8) !important;";
            } else {
                $css .= "background: rgba(35, 40, 45, 0.8) !important;";
            }
            
            $css .= "border: 1px solid rgba(255, 255, 255, 0.1) !important;";
        }
        
        // Border radius (nowa implementacja)
        $borderRadiusType = $settings['menu_border_radius_type'] ?? 'all';
        if ($borderRadiusType === 'all' && ($settings['menu_border_radius_all'] ?? 0) > 0) {
            $radius = $settings['menu_border_radius_all'];
            $css .= "border-radius: {$radius}px !important;";
        } elseif ($borderRadiusType === 'individual') {
            $radiusValues = [];
            $radiusValues[] = ($settings['menu_radius_tl'] ?? false) ? '12px' : '0px';
            $radiusValues[] = ($settings['menu_radius_tr'] ?? false) ? '12px' : '0px';
            $radiusValues[] = ($settings['menu_radius_br'] ?? false) ? '12px' : '0px';
            $radiusValues[] = ($settings['menu_radius_bl'] ?? false) ? '12px' : '0px';
            $css .= "border-radius: " . implode(' ', $radiusValues) . " !important;";
        }
        
        // Zaokrąglenie narożników Menu (backward compatibility)
        $cornerType = $settings['corner_radius_type'] ?? 'none';
        if ($cornerType === 'all' && ($settings['corner_radius_all'] ?? 0) > 0) {
            $radius = $settings['corner_radius_all'];
            $css .= "border-radius: {$radius}px !important;";
        } elseif ($cornerType === 'individual') {
            $tl = $settings['corner_radius_top_left'] ?? 0;
            $tr = $settings['corner_radius_top_right'] ?? 0;
            $br = $settings['corner_radius_bottom_right'] ?? 0;
            $bl = $settings['corner_radius_bottom_left'] ?? 0;
            $css .= "border-radius: {$tl}px {$tr}px {$br}px {$bl}px !important;";
        }
        
        if (isset($settings['menu_shadow']) && $settings['menu_shadow']) {
            $css .= "box-shadow: 2px 0 8px rgba(0,0,0,0.1) !important;";
        }
        
        // Backward compatibility dla menu_glassmorphism
        if (isset($settings['menu_glassmorphism']) && $settings['menu_glassmorphism']) {
            $css .= "backdrop-filter: blur(10px) !important;";
            $css .= "-webkit-backdrop-filter: blur(10px) !important;";
            
            // Konwertuj hex na rgba z przezroczystością dla glassmorphism
            $hexColor = $menuBg;
            if (strlen($hexColor) == 7) {
                $r = hexdec(substr($hexColor, 1, 2));
                $g = hexdec(substr($hexColor, 3, 2));
                $b = hexdec(substr($hexColor, 5, 2));
                $css .= "background: rgba({$r}, {$g}, {$b}, 0.8) !important;";
            } else {
                $css .= "background: rgba(35, 40, 45, 0.8) !important;";
            }
            
            $css .= "border: 1px solid rgba(255, 255, 255, 0.1) !important;";
        }
        
        if (isset($settings['menu_detached']) && $settings['menu_detached']) {
            // Nowe ustawienia marginesu z fallback do starych
            $marginType = $settings['menu_detached_margin_type'] ?? 'all';
            if ($marginType === 'all') {
                $marginAll = $settings['menu_detached_margin_all'] ?? $settings['menu_detached_margin'] ?? 20;
                $marginTop = $marginLeft = $marginRight = $marginBottom = $marginAll;
            } else {
                $marginTop = $settings['menu_detached_margin_top'] ?? 20;
                $marginRight = $settings['menu_detached_margin_right'] ?? 20;
                $marginBottom = $settings['menu_detached_margin_bottom'] ?? 20;
                $marginLeft = $settings['menu_detached_margin_left'] ?? 20;
            }
            
            $adminBarHeight = isset($settings['admin_bar_height']) ? $settings['admin_bar_height'] : 32;
            $css .= "position: fixed !important;";
            $css .= "top: " . ($adminBarHeight + $marginTop) . "px !important;";
            $css .= "left: {$marginLeft}px !important;";
            $css .= "bottom: {$marginBottom}px !important;";
            $css .= "right: auto !important;";
            $css .= "width: " . ($settings['menu_width'] ?? 160) . "px !important;";
            $css .= "max-width: " . ($settings['menu_width'] ?? 160) . "px !important;";
            $css .= "z-index: 9999 !important;";
            
            // Zaokrąglenie narożników dla floating menu - nadpisz domyślne
            $cornerType = $settings['corner_radius_type'] ?? 'none';
            if ($cornerType === 'all' && ($settings['corner_radius_all'] ?? 0) > 0) {
                $radius = $settings['corner_radius_all'];
                $css .= "border-radius: {$radius}px !important;";
            } elseif ($cornerType === 'individual') {
                $tl = $settings['corner_radius_top_left'] ?? 0;
                $tr = $settings['corner_radius_top_right'] ?? 0;
                $br = $settings['corner_radius_bottom_right'] ?? 0;
                $bl = $settings['corner_radius_bottom_left'] ?? 0;
                $css .= "border-radius: {$tl}px {$tr}px {$br}px {$bl}px !important;";
            } else {
                // Domyślne zaokrąglenie dla floating menu
                $css .= "border-radius: 12px !important;";
            }
            
            $css .= "box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3) !important;";
            $css .= "transition: all 0.3s ease !important;";
        }
        
        $css .= "}";
        
        // Jeszcze wyższa specyficzność dla wszystkich elementów menu
        $css .= "body.wp-admin #adminmenu li, body.wp-admin #adminmenu li.menu-top {";
        $css .= "background: transparent !important;";
        $css .= "background-color: transparent !important;";
        $css .= "}";
        
        // Layout zarządzanie przez zmienne CSS i klasy body (zdefiniowane w admin-modern.css)
        $menuWidth = isset($settings['menu_width']) ? $settings['menu_width'] : 160;
        
        // Szerokość dla faktycznego menu - normalne (rozwinięte)
        $css .= "#adminmenu {";
        $css .= "width: {$menuWidth}px !important;";
        $css .= "min-width: {$menuWidth}px !important;";
        $css .= "max-width: {$menuWidth}px !important;";
        $css .= "}";
        
        // Wrapper dopasowuje się do menu
        $css .= "#adminmenuwrap {";
        $css .= "width: {$menuWidth}px !important;";
        $css .= "min-width: {$menuWidth}px !important;";
        $css .= "max-width: {$menuWidth}px !important;";
        $css .= "}";
        
        // COLLAPSED MENU - zwinięte menu (tylko ikony)
        $css .= ".folded #adminmenu {";
        $css .= "width: 36px !important;";
        $css .= "min-width: 36px !important;";
        $css .= "max-width: 36px !important;";
        $css .= "}";
        
        $css .= ".folded #adminmenuwrap {";
        $css .= "width: 36px !important;";
        $css .= "min-width: 36px !important;";
        $css .= "max-width: 36px !important;";
        $css .= "}";
        
        // Responsywne zachowanie
        $css .= "@media screen and (max-width: 782px) {";
        $css .= "#adminmenu { width: auto !important; min-width: auto !important; max-width: none !important; }";
        $css .= "#adminmenuwrap { width: auto !important; min-width: auto !important; max-width: none !important; }";
        $css .= ".folded #adminmenu, .folded #adminmenuwrap { width: auto !important; min-width: auto !important; max-width: none !important; }";
        $css .= "}";
        
        // Elementy menu
        if (isset($settings['menu_text_color'])) {
            $css .= "#adminmenu a { color: {$settings['menu_text_color']} !important; }";
        }
        
        // Hover states
        if (isset($settings['menu_hover_background']) || isset($settings['menu_hover_text_color'])) {
            $css .= "#adminmenu li:hover a, #adminmenu li a:focus {";
            if (isset($settings['menu_hover_background'])) {
                $css .= "background: {$settings['menu_hover_background']} !important;";
            }
            if (isset($settings['menu_hover_text_color'])) {
                $css .= "color: {$settings['menu_hover_text_color']} !important;";
            }
            $css .= "}";
        }
        
        // Aktywne elementy
        if (isset($settings['menu_active_background']) || isset($settings['menu_active_text_color'])) {
            $css .= "#adminmenu .wp-has-current-submenu a.wp-has-current-submenu, #adminmenu .current a.menu-top {";
            if (isset($settings['menu_active_background'])) {
                $css .= "background: {$settings['menu_active_background']} !important;";
            }
            if (isset($settings['menu_active_text_color'])) {
                $css .= "color: {$settings['menu_active_text_color']} !important;";
            }
            $css .= "}";
        }
        
        // Submenu (lewe menu rozwijane)
        $submenuBg = isset($settings['menu_background']) ? $settings['menu_background'] : '#23282d';
        $submenuText = isset($settings['menu_text_color']) ? $settings['menu_text_color'] : '#ffffff';
        $submenuHoverBg = isset($settings['menu_hover_background']) ? $settings['menu_hover_background'] : '#32373c';
        $submenuHoverText = isset($settings['menu_hover_text_color']) ? $settings['menu_hover_text_color'] : '#00a0d2';
        
        // Tło submenu
        $css .= "#adminmenu .wp-submenu {";
        $css .= "background: {$submenuBg} !important;";
        $css .= "border-left: 1px solid rgba(255,255,255,0.1) !important;";
        $css .= "}";
        
        // Elementy submenu
        $css .= "#adminmenu .wp-submenu a {";
        $css .= "color: {$submenuText} !important;";
        $css .= "}";
        
        // Hover submenu
        $css .= "#adminmenu .wp-submenu li:hover a,";
        $css .= "#adminmenu .wp-submenu li a:focus {";
        $css .= "background: {$submenuHoverBg} !important;";
        $css .= "color: {$submenuHoverText} !important;";
        $css .= "}";
        
        // Aktywne submenu
        if (isset($settings['menu_active_background']) || isset($settings['menu_active_text_color'])) {
            $css .= "#adminmenu .wp-submenu .current a,";
            $css .= "#adminmenu .wp-submenu a[aria-current=\"page\"] {";
            if (isset($settings['menu_active_background'])) {
                $css .= "background: {$settings['menu_active_background']} !important;";
            }
            if (isset($settings['menu_active_text_color'])) {
                $css .= "color: {$settings['menu_active_text_color']} !important;";
            }
            $css .= "}";
        }
        
        // Szerokość submenu (żeby było widoczne)
        if (isset($settings['menu_width'])) {
            $css .= "#adminmenu .wp-submenu {";
            if (isset($settings['menu_detached']) && $settings['menu_detached']) {
                // Jeśli menu jest detached, submenu powinno być obok niego
                $css .= "left: " . ($settings['menu_width'] ?? 160) . "px !important;";
                $css .= "border-radius: 8px !important;";
                $css .= "box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2) !important;";
                $css .= "border: 1px solid rgba(255, 255, 255, 0.1) !important;";
                
                // Glassmorphism dla submenu też jeśli główne menu ma
                if (isset($settings['menu_glassmorphism']) && $settings['menu_glassmorphism']) {
                    $css .= "backdrop-filter: blur(10px) !important;";
                    $css .= "-webkit-backdrop-filter: blur(10px) !important;";
                    
                    // Użyj tego samego koloru co główne menu z większą przezroczystością
                    $hexColor = $submenuBg;
                    if (strlen($hexColor) == 7) {
                        $r = hexdec(substr($hexColor, 1, 2));
                        $g = hexdec(substr($hexColor, 3, 2));
                        $b = hexdec(substr($hexColor, 5, 2));
                        $css .= "background: rgba({$r}, {$g}, {$b}, 0.9) !important;";
                    } else {
                        $css .= "background: rgba(35, 40, 45, 0.9) !important;";
                    }
                }
            } else {
                $css .= "left: {$settings['menu_width']}px !important;";
            }
            $css .= "min-width: 200px !important;";
            $css .= "}";
        }
        
        return $css;
    }
    
    /**
     * Generuje CSS dla obszaru treści
     */
    private function generateContentCSS($settings) {
        $css = '';
        
        // Główny kontener treści
        if (isset($settings['content_background'])) {
            $css .= "#wpbody-content { background: {$settings['content_background']} !important; }";
        }
        
        if (isset($settings['content_text_color'])) {
            $css .= "#wpbody-content { color: {$settings['content_text_color']} !important; }";
        }
        
        // Karty/boxy
        if (isset($settings['content_card_background'])) {
            $css .= ".postbox, .meta-box-sortables .postbox { background: {$settings['content_card_background']} !important; }";
        }
        
        // Linki
        if (isset($settings['content_link_color'])) {
            $css .= "#wpbody-content a { color: {$settings['content_link_color']} !important; }";
        }
        
        return $css;
    }
    
    /**
     * Generuje CSS dla przycisków
     */
    private function generateButtonCSS($settings) {
        $css = '';
        
        // Primary buttons
        if (isset($settings['button_primary_bg'])) {
            $css .= ".button-primary { background: {$settings['button_primary_bg']} !important; border-color: {$settings['button_primary_bg']} !important; }";
        }
        
        if (isset($settings['button_primary_text_color'])) {
            $css .= ".button-primary { color: {$settings['button_primary_text_color']} !important; }";
        }
        
        if (isset($settings['button_primary_hover_bg'])) {
            $css .= ".button-primary:hover { background: {$settings['button_primary_hover_bg']} !important; border-color: {$settings['button_primary_hover_bg']} !important; }";
        }
        
        // Secondary buttons
        if (isset($settings['button_secondary_bg'])) {
            $css .= ".button-secondary { background: {$settings['button_secondary_bg']} !important; border-color: {$settings['button_secondary_bg']} !important; }";
        }
        
        if (isset($settings['button_secondary_text_color'])) {
            $css .= ".button-secondary { color: {$settings['button_secondary_text_color']} !important; }";
        }
        
        if (isset($settings['button_secondary_hover_bg'])) {
            $css .= ".button-secondary:hover { background: {$settings['button_secondary_hover_bg']} !important; border-color: {$settings['button_secondary_hover_bg']} !important; }";
        }
        
        // Border radius
        if (isset($settings['button_border_radius']) && $settings['button_border_radius'] > 0) {
            $css .= ".button, .button-primary, .button-secondary { border-radius: {$settings['button_border_radius']}px !important; }";
        }
        
        // Shadow
        if (isset($settings['button_shadow']) && $settings['button_shadow']) {
            $css .= ".button, .button-primary, .button-secondary { box-shadow: 0 2px 4px rgba(0,0,0,0.1) !important; }";
        }
        
        return $css;
    }
    
    /**
     * Generuje CSS dla pól formularzy
     */
    private function generateFormCSS($settings) {
        $css = '';
        
        // Form fields background
        if (isset($settings['form_field_bg'])) {
            $css .= "input[type='text'], input[type='email'], input[type='url'], input[type='password'], input[type='search'], input[type='number'], input[type='tel'], input[type='range'], input[type='date'], input[type='month'], input[type='week'], input[type='time'], input[type='datetime'], input[type='datetime-local'], input[type='color'], select, textarea { background: {$settings['form_field_bg']} !important; }";
        }
        
        // Form fields border
        if (isset($settings['form_field_border'])) {
            $css .= "input[type='text'], input[type='email'], input[type='url'], input[type='password'], input[type='search'], input[type='number'], input[type='tel'], input[type='range'], input[type='date'], input[type='month'], input[type='week'], input[type='time'], input[type='datetime'], input[type='datetime-local'], input[type='color'], select, textarea { border-color: {$settings['form_field_border']} !important; }";
        }
        
        // Form fields focus
        if (isset($settings['form_field_focus_color'])) {
            $css .= "input[type='text']:focus, input[type='email']:focus, input[type='url']:focus, input[type='password']:focus, input[type='search']:focus, input[type='number']:focus, input[type='tel']:focus, input[type='range']:focus, input[type='date']:focus, input[type='month']:focus, input[type='week']:focus, input[type='time']:focus, input[type='datetime']:focus, input[type='datetime-local']:focus, input[type='color']:focus, select:focus, textarea:focus { border-color: {$settings['form_field_focus_color']} !important; box-shadow: 0 0 0 1px {$settings['form_field_focus_color']} !important; }";
        }
        
        // Form fields border radius
        if (isset($settings['form_field_border_radius']) && $settings['form_field_border_radius'] > 0) {
            $css .= "input[type='text'], input[type='email'], input[type='url'], input[type='password'], input[type='search'], input[type='number'], input[type='tel'], input[type='range'], input[type='date'], input[type='month'], input[type='week'], input[type='time'], input[type='datetime'], input[type='datetime-local'], input[type='color'], select, textarea { border-radius: {$settings['form_field_border_radius']}px !important; }";
        }
        
        return $css;
    }
    
    /**
     * Generuje CSS dla zaawansowanych opcji
     */
    private function generateAdvancedCSS($settings) {
        $css = '';
        
        // Compact mode
        if (isset($settings['compact_mode']) && $settings['compact_mode']) {
            $css .= "body.mas-compact-mode .wrap { padding: 10px !important; }";
            $css .= "body.mas-compact-mode .form-table th, body.mas-compact-mode .form-table td { padding: 8px !important; }";
            $css .= "body.mas-compact-mode .postbox { margin-bottom: 15px !important; }";
        }
        
        // Hide WP version
        if (isset($settings['hide_wp_version']) && $settings['hide_wp_version']) {
            $css .= "#footer-upgrade { display: none !important; }";
        }
        
        // Hide help tabs
        if (isset($settings['hide_help_tabs']) && $settings['hide_help_tabs']) {
            $css .= "#contextual-help-link-wrap { display: none !important; }";
        }
        
        // Hide screen options
        if (isset($settings['hide_screen_options']) && $settings['hide_screen_options']) {
            $css .= "#screen-options-link-wrap { display: none !important; }";
        }
        
        // Hide admin notices
        if (isset($settings['hide_admin_notices']) && $settings['hide_admin_notices']) {
            $css .= ".notice, .updated, .error { display: none !important; }";
        }
        
        // Admin bar element hiding
        if (isset($settings['admin_bar_hide_wp_logo']) && $settings['admin_bar_hide_wp_logo']) {
            $css .= "#wpadminbar #wp-admin-bar-wp-logo { display: none !important; }";
        }
        
        if (isset($settings['admin_bar_hide_howdy']) && $settings['admin_bar_hide_howdy']) {
            $css .= "#wpadminbar .ab-top-menu .menupop .ab-item .display-name { display: none !important; }";
        }
        
        if (isset($settings['admin_bar_hide_updates']) && $settings['admin_bar_hide_updates']) {
            $css .= "#wpadminbar #wp-admin-bar-updates { display: none !important; }";
        }
        
        if (isset($settings['admin_bar_hide_comments']) && $settings['admin_bar_hide_comments']) {
            $css .= "#wpadminbar #wp-admin-bar-comments { display: none !important; }";
        }
        
        return $css;
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
        
        return $classes;
    }
    
    /**
     * Pobieranie ustawień
     */
    public function getSettings() {
        // Używaj fallback - bezpieczna implementacja
        $settings = get_option('mas_v2_settings', []);
        $defaults = $this->getDefaultSettings();
        
        return wp_parse_args($settings, $defaults);
    }
    
    /**
     * Sanityzacja ustawień
     */
    private function sanitizeSettings($input) {
        // Bezpieczna sanityzacja
        $defaults = $this->getDefaultSettings();
        $sanitized = [];
        
        foreach ($defaults as $key => $default_value) {
            if (!isset($input[$key])) {
                $sanitized[$key] = $default_value;
                continue;
            }
            
            $value = $input[$key];
            
            if (is_bool($default_value)) {
                $sanitized[$key] = (bool) $value;
            } elseif (is_int($default_value)) {
                $sanitized[$key] = (int) $value;
            } elseif ($key === 'custom_css') {
                $sanitized[$key] = wp_strip_all_tags($value);
            } elseif (strpos($key, 'color') !== false) {
                $sanitized[$key] = sanitize_hex_color($value);
            } else {
                $sanitized[$key] = sanitize_text_field($value);
            }
        }
        
        return $sanitized;
    }
    
    /**
     * Domyślne ustawienia
     */
    private function getDefaultSettings() {
        return [
            // Ogólne
            'enable_plugin' => true,
            'theme' => 'modern',
            'color_scheme' => 'light',
            'font_family' => 'system',
            'font_size' => 14,
            'enable_animations' => true,
            'animation_type' => 'smooth',
            'live_preview' => true,
            'auto_save' => false,
            'compact_mode' => false,
            'global_border_radius' => 8,
            'enable_shadows' => true,
            'shadow_color' => '#000000',
            'shadow_blur' => 10,
            
            // Admin Bar
            'admin_bar_background' => '#23282d',
            'admin_bar_text_color' => '#ffffff',
            'admin_bar_hover_color' => '#00a0d2',
            'admin_bar_height' => 32,
            'admin_bar_font_size' => 13,
            'admin_bar_padding' => 8,
            'admin_bar_border_radius' => 0,
            'admin_bar_shadow' => false,
            'admin_bar_glassmorphism' => false,
            'admin_bar_detached' => false,
            
            // Admin Bar - Nowe opcje floating/glossy
            'admin_bar_floating' => false,
            'admin_bar_glossy' => false,
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
            'menu_shadow' => false,
            'menu_compact_mode' => false,
            'menu_glassmorphism' => false,
            'menu_detached' => false,
            'menu_detached_margin' => 20, // Backward compatibility
            'menu_detached_margin_type' => 'all',
            'menu_detached_margin_all' => 20,
            'menu_detached_margin_top' => 20,
            'menu_detached_margin_right' => 20,
            'menu_detached_margin_bottom' => 20,
            'menu_detached_margin_left' => 20,
            'menu_icons_enabled' => true,
            
            // Menu - Nowe opcje floating/glossy
            'menu_floating' => false,
            'menu_glossy' => false,
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
        ];
    }
    
    /**
     * Definicje tabów
     */
    private function getTabs() {
        return [
            'general' => [
                'title' => __('Ogólne', 'modern-admin-styler-v2'),
                'icon' => 'settings',
                'description' => __('Podstawowe ustawienia wyglądu', 'modern-admin-styler-v2')
            ],
            'admin-bar' => [
                'title' => __('Admin Bar', 'modern-admin-styler-v2'),
                'icon' => 'admin-bar',
                'description' => __('Stylowanie górnego paska administracyjnego', 'modern-admin-styler-v2')
            ],
            'menu' => [
                'title' => __('Menu', 'modern-admin-styler-v2'),
                'icon' => 'menu',
                'description' => __('Konfiguracja menu bocznego', 'modern-admin-styler-v2')
            ],
            'content' => [
                'title' => __('Treść', 'modern-admin-styler-v2'),
                'icon' => 'content',
                'description' => __('Stylowanie obszaru treści', 'modern-admin-styler-v2')
            ],
            'typography' => [
                'title' => __('Typografia', 'modern-admin-styler-v2'),
                'icon' => 'typography',
                'description' => __('Ustawienia czcionek i tekstów', 'modern-admin-styler-v2')
            ],
            'effects' => [
                'title' => __('Efekty', 'modern-admin-styler-v2'),
                'icon' => 'effects',
                'description' => __('Animacje i efekty specjalne', 'modern-admin-styler-v2')
            ],
            'advanced' => [
                'title' => __('Zaawansowane', 'modern-admin-styler-v2'),
                'icon' => 'advanced',
                'description' => __('Niestandardowe CSS i opcje deweloperskie', 'modern-admin-styler-v2')
            ],
            'live-preview' => [
                'title' => __('Live Preview', 'modern-admin-styler-v2'),
                'icon' => 'live-preview',
                'description' => __('Podgląd na żywo zmian w interfejsie', 'modern-admin-styler-v2')
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
     * Wyczyść cache
     */
    private function clearCache() {
        global $wpdb;
        
        // Wyczyść transients związane z pluginem
        $wpdb->query("DELETE FROM $wpdb->options WHERE option_name LIKE '_transient_timeout_mas_v2_%' OR option_name LIKE '_transient_mas_v2_%'");
        $wpdb->query("DELETE FROM $wpdb->options WHERE option_name LIKE '_site_transient_timeout_mas_v2_%' OR option_name LIKE '_site_transient_mas_v2_%'");
        
        // Wyczyść cache obiektów WordPress
        wp_cache_flush();
    }
}

// Inicjalizuj wtyczkę
ModernAdminStylerV2::getInstance();
