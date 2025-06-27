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
        add_action('admin_enqueue_scripts', [$this, 'enqueueGlobalAssets']);
        
        // AJAX handlers - usuń dublowanie
        add_action('wp_ajax_mas_v2_save_settings', [$this, 'ajaxSaveSettings']);
        add_action('wp_ajax_mas_v2_reset_settings', [$this, 'ajaxResetSettings']);
        add_action('wp_ajax_mas_v2_export_settings', [$this, 'ajaxExportSettings']);
        add_action('wp_ajax_mas_v2_import_settings', [$this, 'ajaxImportSettings']);
        add_action('wp_ajax_mas_v2_live_preview', [$this, 'ajaxLivePreview']);
        
        // Diagnostic AJAX handlers
        add_action('wp_ajax_mas_v2_db_check', [$this, 'ajaxDatabaseCheck']);
        add_action('wp_ajax_mas_v2_options_test', [$this, 'ajaxOptionsTest']);
        add_action('wp_ajax_mas_v2_cache_check', [$this, 'ajaxCacheCheck']);
        
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
        // Serwisy są wyłączone aby uniknąć duplikatów hooks'ów
        // Używamy tylko legacy mode w głównej klasie
        // AdminController i AssetService powodowały konflikty rejestracji
    }
    
    /**
     * Tryb zgodności ze starą wersją
     */
    private function initLegacyMode() {
        // Legacy mode jest jedynym aktywnym systemem
        // Wszystko działa przez main class bez duplikatów
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

        // 🎯 NOWA ARCHITEKTURA: 5 logicznych zakładek zamiast 12 chaotycznych!
        add_submenu_page(
            'mas-v2-settings',
            __('🌐 Główne', 'modern-admin-styler-v2'),
            __('🌐 Główne', 'modern-admin-styler-v2'),
            'manage_options',
            'mas-v2-general',
            [$this, 'renderTabPage']
        );

        add_submenu_page(
            'mas-v2-settings',
            __('📊 Pasek Admina', 'modern-admin-styler-v2'),
            __('📊 Pasek Admina', 'modern-admin-styler-v2'),
            'manage_options',
            'mas-v2-admin-bar',
            [$this, 'renderTabPage']
        );

        add_submenu_page(
            'mas-v2-settings',
            __('📋 Menu', 'modern-admin-styler-v2'),
            __('📋 Menu (+ Submenu)', 'modern-admin-styler-v2'),
            'manage_options',
            'mas-v2-menu',
            [$this, 'renderTabPage']
        );

        add_submenu_page(
            'mas-v2-settings',
            __('🔤 Typografia', 'modern-admin-styler-v2'),
            __('🔤 Typografia', 'modern-admin-styler-v2'),
            'manage_options',
            'mas-v2-typography',
            [$this, 'renderTabPage']
        );

        add_submenu_page(
            'mas-v2-settings',
            __('⚙️ Zaawansowane', 'modern-admin-styler-v2'),
            __('⚙️ Zaawansowane', 'modern-admin-styler-v2'),
            'manage_options',
            'mas-v2-advanced',
            [$this, 'renderTabPage']
        );
    }
    
    /**
     * Legacy: Enqueue CSS i JS na stronie ustawień pluginu
     */
    public function enqueueAssets($hook) {
        // 🎯 NOWA ARCHITEKTURA: Sprawdź czy jesteśmy na którejś z 5 logicznych stron
        $mas_pages = [
            'toplevel_page_mas-v2-settings',
            'mas-v2_page_mas-v2-general',
            'mas-v2_page_mas-v2-admin-bar',
            'mas-v2_page_mas-v2-menu',
            'mas-v2_page_mas-v2-typography',
            'mas-v2_page_mas-v2-advanced'
        ];
        
        if (!in_array($hook, $mas_pages)) {
            return;
        }
        
        // SKONSOLIDOWANY CSS - tylko mas-v2-main.css (zawiera wszystko)
        wp_enqueue_style(
            'mas-v2-interface',
            MAS_V2_PLUGIN_URL . 'assets/css/mas-v2-main.css',
            [],
            MAS_V2_VERSION
        );
        
        // SKONSOLIDOWANY JavaScript - tylko admin-modern.js (zawiera wszystko)
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
        
        // Dodaj wczesny JavaScript PRZED wszystkimi innymi skryptami
        add_action('admin_head', [$this, 'addEarlyLoadingProtection'], 1);
        
        // SKONSOLIDOWANY CSS - mas-v2-main.css zawiera wszystkie potrzebne style
        wp_enqueue_style(
            'mas-v2-main',
            MAS_V2_PLUGIN_URL . 'assets/css/mas-v2-main.css',
            [],
            MAS_V2_VERSION
        );
        
        // SKONSOLIDOWANY JavaScript - admin-global.js (lekka wersja)
        wp_enqueue_script(
            'mas-v2-global',
            MAS_V2_PLUGIN_URL . 'assets/js/admin-global.js',
            ['jquery'],
            MAS_V2_VERSION,
            true
        );
        
        // Przekaż ustawienia do globalnego JS (z nonce dla kompatybilności)
        wp_localize_script('mas-v2-global', 'masV2Global', [
            'ajaxUrl' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('mas_v2_nonce'),
            'settings' => $this->getSettings()
        ]);
    }
    
    /**
     * Dodaje wczesną ochronę przed animacjami podczas ładowania strony
     */
    public function addEarlyLoadingProtection() {
        ?>
        <script>
        // NAPRAW PROBLEM "ODLATUJĄCEGO MENU" - Wczesna ochrona
        (function() {
            // Dodaj klasę mas-loading NATYCHMIAST
            document.documentElement.classList.add('mas-loading');
            document.body.classList.add('mas-loading');
            
            // Usuń klasę po pełnym załadowaniu
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
        
        // Sprawdź czy formularz został wysłany (fallback dla POST)
        if (isset($_POST['mas_v2_nonce']) && wp_verify_nonce($_POST['mas_v2_nonce'], 'mas_v2_nonce')) {
            error_log('MAS V2: POST form submitted (non-AJAX)');
            
            // Filtruj tylko odpowiednie pola formularza
            $form_data = $_POST;
            unset($form_data['mas_v2_nonce'], $form_data['_wp_http_referer'], $form_data['submit']);
            
            $settings = $this->sanitizeSettings($form_data);
            $result = update_option('mas_v2_settings', $settings);
            
            error_log('MAS V2: POST save result: ' . ($result ? 'success' : 'failed'));
            $this->clearCache();
            
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
            return;
        }
        
        // Sprawdzenie uprawnień
        if (!current_user_can('manage_options')) {
            wp_send_json_error(['message' => __('Brak uprawnień', 'modern-admin-styler-v2')]);
            return;
        }
        
        try {
            // Debug info
            error_log('MAS V2: AJAX Save Settings called');
            error_log('MAS V2: POST data: ' . print_r($_POST, true));
            
            // Filtruj tylko odpowiednie pola formularza
            $form_data = $_POST;
            unset($form_data['nonce'], $form_data['action']);
            
            // Sanityzacja i zapisanie danych
            $old_settings = $this->getSettings();
            error_log('MAS V2: Old settings before save: ' . print_r($old_settings, true));
            
            $settings = $this->sanitizeSettings($form_data);
            error_log('MAS V2: New settings after sanitization: ' . print_r($settings, true));
            
            // Test specific field
            error_log('MAS V2: admin_bar_height - old: ' . ($old_settings['admin_bar_height'] ?? 'not set') . ', new: ' . ($settings['admin_bar_height'] ?? 'not set'));
            
            $result = update_option('mas_v2_settings', $settings);
            error_log('MAS V2: update_option() returned: ' . var_export($result, true));
            
            // Verify the save by reading back from database
            $saved_settings = get_option('mas_v2_settings');
            error_log('MAS V2: Settings read back from DB: ' . print_r($saved_settings, true));
            error_log('MAS V2: admin_bar_height in DB: ' . ($saved_settings['admin_bar_height'] ?? 'not set'));
            
            // update_option() zwraca false, jeśli wartości są takie same, co nie jest błędem.
            // Uznajemy zapis za udany, jeśli funkcja zwróciła true LUB jeśli nowe ustawienia są identyczne jak stare.
            $is_success = ($result === true || serialize($settings) === serialize($old_settings));
            
            error_log('MAS V2: Save success determined as: ' . ($is_success ? 'true' : 'false'));
            
            // Wyczyść cache
            $this->clearCache();
            
            if ($is_success) {
                wp_send_json_success([
                    'message' => __('Ustawienia zostały zapisane pomyślnie!', 'modern-admin-styler-v2'),
                    'settings' => $settings
                ]);
            } else {
                wp_send_json_error(['message' => __('Wystąpił błąd podczas zapisu do bazy danych.', 'modern-admin-styler-v2')]);
            }
        } catch (Exception $e) {
            error_log('MAS V2: Save error: ' . $e->getMessage());
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
     * AJAX Import ustawień - ulepszona walidacja bezpieczeństwa
     */
    public function ajaxImportSettings() {
        if (!wp_verify_nonce($_POST['nonce'] ?? '', 'mas_v2_nonce')) {
            wp_send_json_error(['message' => __('Błąd bezpieczeństwa', 'modern-admin-styler-v2')]);
        }
        
        if (!current_user_can('manage_options')) {
            wp_send_json_error(['message' => __('Brak uprawnień', 'modern-admin-styler-v2')]);
        }
        
        try {
            $raw_data = $_POST['data'] ?? '';
            
            // Walidacja rozmiaru danych (max 500KB)
            if (strlen($raw_data) > 500000) {
                wp_send_json_error(['message' => __('Plik jest zbyt duży (max 500KB)', 'modern-admin-styler-v2')]);
                return;
            }
            
            // Walidacja JSON
            $import_data = json_decode(stripslashes($raw_data), true);
            
            if (json_last_error() !== JSON_ERROR_NONE) {
                wp_send_json_error(['message' => __('Nieprawidłowy format JSON', 'modern-admin-styler-v2')]);
                return;
            }
            
            if (!$import_data || !is_array($import_data)) {
                wp_send_json_error(['message' => __('Nieprawidłowa struktura pliku', 'modern-admin-styler-v2')]);
                return;
            }
            
            // Walidacja wymaganych pól
            if (!isset($import_data['settings']) || !is_array($import_data['settings'])) {
                wp_send_json_error(['message' => __('Brak sekcji ustawień w pliku', 'modern-admin-styler-v2')]);
                return;
            }
            
            // Opcjonalna walidacja wersji dla kompatybilności
            if (isset($import_data['version'])) {
                $import_version = $import_data['version'];
                $current_version = MAS_V2_VERSION;
                
                // Sprawdź czy wersja nie jest z przyszłości
                if (version_compare($import_version, $current_version, '>')) {
                    wp_send_json_error(['message' => sprintf(
                        __('Plik został utworzony w nowszej wersji (%s). Obecna wersja: %s', 'modern-admin-styler-v2'),
                        $import_version,
                        $current_version
                    )]);
                    return;
                }
            }
            
            // Walidacja i sanityzacja ustawień
            $settings = $this->sanitizeSettings($import_data['settings']);
            
            if (empty($settings)) {
                wp_send_json_error(['message' => __('Brak prawidłowych ustawień do importu', 'modern-admin-styler-v2')]);
                return;
            }
            
            // Zapisz ustawienia
            $result = update_option('mas_v2_settings', $settings);
            
            if (!$result && get_option('mas_v2_settings') !== $settings) {
                wp_send_json_error(['message' => __('Błąd podczas zapisywania ustawień', 'modern-admin-styler-v2')]);
                return;
            }
            
            $this->clearCache();
            
            wp_send_json_success([
                'message' => __('Ustawienia zostały zaimportowane pomyślnie!', 'modern-admin-styler-v2'),
                'settings_count' => count($settings)
            ]);
            
        } catch (Exception $e) {
            error_log('MAS V2 Import Error: ' . $e->getMessage());
            wp_send_json_error(['message' => __('Wystąpił błąd podczas importu', 'modern-admin-styler-v2')]);
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
            // Filtruj tylko odpowiednie pola formularza
            $form_data = $_POST;
            unset($form_data['nonce'], $form_data['action']);
            
            $settings = $this->sanitizeSettings($form_data);
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
        if ($this->isLoginPage()) {
            return;
        }
        
        $settings = $this->getSettings();
        
        if (empty($settings)) {
            error_log('MAS V2: No settings found');
            return;
        }
        
        // NAPRAWKA KRYTYCZNA: Zamiast całkowicie blokować wtyczkę, sprawdź enable_plugin 
        // tylko dla głównych funkcji, ale pozwól na podstawowe działanie
        $plugin_enabled = isset($settings['enable_plugin']) ? $settings['enable_plugin'] : true;
        
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
        
        // Generowanie stylów jest teraz scentralizowane i ładowane przez `wp_add_inline_style`
        // dla lepszej wydajności i uniknięcia FOUC (Flash of Unstyled Content).
        $dynamic_css = $this->generateCSSVariables($settings);

        // Dodaj style w linii w sposób rekomendowany przez WordPress
        wp_add_inline_style('mas-v2-global', $dynamic_css);

        // Dodaj niestandardowy JS w bezpieczny sposób
        if (!empty($settings['custom_js'])) {
            wp_add_inline_script('mas-v2-global', $settings['custom_js']);
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
        $currentPalette = $settings['color_palette'] ?? 'modern-blue';
        
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
            'elegant-purple' => [
                'light' => [
                    'primary' => '#8B5CF6',
                    'secondary' => '#A78BFA',
                    'accent' => '#7C3AED',
                    'background' => '#fafafa',
                    'surface' => '#ffffff',
                    'text' => '#1f2937',
                    'text_secondary' => '#6b7280',
                    'border' => '#e5e7eb'
                ],
                'dark' => [
                    'primary' => '#A78BFA',
                    'secondary' => '#C4B5FD',
                    'accent' => '#8B5CF6',
                    'background' => '#111827',
                    'surface' => '#1f2937',
                    'text' => '#f9fafb',
                    'text_secondary' => '#d1d5db',
                    'border' => '#374151'
                ]
            ],
            'warm-orange' => [
                'light' => [
                    'primary' => '#F59E0B',
                    'secondary' => '#FBBF24',
                    'accent' => '#D97706',
                    'background' => '#fffbeb',
                    'surface' => '#ffffff',
                    'text' => '#1c1917',
                    'text_secondary' => '#78716c',
                    'border' => '#e7e5e4'
                ],
                'dark' => [
                    'primary' => '#FBBF24',
                    'secondary' => '#FCD34D',
                    'accent' => '#F59E0B',
                    'background' => '#1c1917',
                    'surface' => '#292524',
                    'text' => '#fafaf9',
                    'text_secondary' => '#d6d3d1',
                    'border' => '#44403c'
                ]
            ],
            'forest-green' => [
                'light' => [
                    'primary' => '#10B981',
                    'secondary' => '#34D399',
                    'accent' => '#059669',
                    'background' => '#f0fdf4',
                    'surface' => '#ffffff',
                    'text' => '#14532d',
                    'text_secondary' => '#65a30d',
                    'border' => '#dcfce7'
                ],
                'dark' => [
                    'primary' => '#34D399',
                    'secondary' => '#6EE7B7',
                    'accent' => '#10B981',
                    'background' => '#14532d',
                    'surface' => '#166534',
                    'text' => '#f0fdf4',
                    'text_secondary' => '#bbf7d0',
                    'border' => '#15803d'
                ]
            ],
            'crimson-red' => [
                'light' => [
                    'primary' => '#EF4444',
                    'secondary' => '#F87171',
                    'accent' => '#DC2626',
                    'background' => '#fef2f2',
                    'surface' => '#ffffff',
                    'text' => '#1f2937',
                    'text_secondary' => '#6b7280',
                    'border' => '#fecaca'
                ],
                'dark' => [
                    'primary' => '#F87171',
                    'secondary' => '#FCA5A5',
                    'accent' => '#EF4444',
                    'background' => '#1f2937',
                    'surface' => '#374151',
                    'text' => '#f9fafb',
                    'text_secondary' => '#d1d5db',
                    'border' => '#4b5563'
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
        // Bezpieczna sanityzacja z ograniczonym debugowaniem
        $defaults = $this->getDefaultSettings();
        $sanitized = [];
        
        // NAPRAWKA KRYTYCZNA: Ograniczony logging tylko dla błędów
        $debug_mode = defined('WP_DEBUG') && WP_DEBUG;
        
        foreach ($defaults as $key => $default_value) {
            if (!isset($input[$key])) {
                $sanitized[$key] = $default_value;
                continue;
            }
            
            $value = $input[$key];
            
            // Handle arrays (like menu_individual_colors, menu_individual_icons)
            if (is_array($default_value)) {
                if (is_array($value)) {
                    $sanitized[$key] = $this->sanitizeArrayRecursive($value, $default_value);
                } else {
                    $sanitized[$key] = $default_value;
                }
            } elseif (is_bool($default_value)) {
                // NAPRAWKA KRYTYCZNA: Ulepszona obsługa boolean - checkbox nie wysyła wartości gdy niezaznaczone
                // Jeśli pole istnieje w input, znaczy że checkbox był zaznaczony
                // Dla AJAX: sprawdź czy wartość to '1', 'true', true, lub 'on'
                $sanitized[$key] = isset($input[$key]) && in_array($input[$key], ['1', 1, true, 'true', 'on'], true);
                
                if ($debug_mode && $key === 'enable_plugin') {
                    error_log("MAS V2: Critical field {$key} = " . ($sanitized[$key] ? 'true' : 'false') . " (from: " . print_r($value, true) . ")");
                }
            } elseif (is_int($default_value)) {
                $sanitized[$key] = (int) $value;
            } elseif ($key === 'custom_css') {
                // Ulepszona sanityzacja CSS - bezpieczna ale pozwala na CSS
                $sanitized[$key] = $this->sanitizeCustomCSS($value);
            } elseif (strpos($key, 'color') !== false) {
                // Obsługa kolorów w różnych formatach
                if (is_array($value)) {
                    // Jeśli to tablica, użyj wartości domyślnej
                    $sanitized[$key] = $default_value;
                } else {
                    // Obsługa pustych wartości i formatów #ddd oraz #dddddd
                    if (empty($value)) {
                        $sanitized[$key] = $default_value;
                    } else {
                        $color = sanitize_hex_color($value);
                        // Jeśli sanitize_hex_color zwróci null dla #ddd, sprawdź czy jest to prawidłowy 3-znakowy hex
                        if ($color === null && preg_match('/^#[0-9a-fA-F]{3}$/', $value)) {
                            // Konwertuj #ddd na #dddddd
                            $sanitized[$key] = '#' . substr($value, 1, 1) . substr($value, 1, 1) . 
                                               substr($value, 2, 1) . substr($value, 2, 1) . 
                                               substr($value, 3, 1) . substr($value, 3, 1);
                        } else {
                            $sanitized[$key] = $color ?: $default_value;
                        }
                    }
                }
            } else {
                $sanitized[$key] = sanitize_text_field($value);
            }
        }
        
        return $sanitized;
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
     * Bezpieczna sanityzacja CSS
     */
    private function sanitizeCustomCSS($css) {
        // Usuń potencjalnie niebezpieczne elementy
        $dangerous_patterns = [
            '/<script\b[^>]*>.*?<\/script>/is',  // JavaScript
            '/javascript:/i',                    // javascript: URLs
            '/expression\s*\(/i',               // CSS expressions (IE)
            '/behavior\s*:/i',                  // CSS behaviors (IE)
            '/binding\s*:/i',                   // CSS bindings (IE)
            '/@import\s+/i',                    // @import rules
            '/url\s*\(\s*[\'"]?data:/i',       // Data URLs
            '/url\s*\(\s*[\'"]?javascript:/i',  // JavaScript URLs w CSS
        ];
        
        foreach ($dangerous_patterns as $pattern) {
            $css = preg_replace($pattern, '', $css);
        }
        
        // Dodatkowa walidacja - usuń komentarze HTML
        $css = preg_replace('/<!--.*?-->/s', '', $css);
        
        // Limit długości (max 50KB)
        if (strlen($css) > 50000) {
            $css = substr($css, 0, 50000) . '/* ... CSS truncated for security */';
        }
        
        return $css;
    }
    
    /**
     * Domyślne ustawienia
     */
    private function getDefaultSettings() {
        return [
            // Ogólne
            'enable_plugin' => true,
            'theme' => 'modern',
            'color_scheme' => 'auto',
            'color_palette' => 'modern-blue',
            'auto_dark_mode' => true,
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
            'admin_bar_glassmorphism' => true,
            'admin_bar_detached' => true,
            
            // Admin Bar - Nowe opcje floating/glossy
            'admin_bar_floating' => true,
            'admin_bar_glossy' => true,
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
            'menu_shadow' => true,
            'menu_compact_mode' => false,
            'menu_glassmorphism' => true,
            'menu_floating' => true,
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
        
        // Admin bar floating
        if (isset($settings['admin_bar_floating']) && $settings['admin_bar_floating']) {
            $js .= 'body.classList.add("mas-v2-admin-bar-floating");';
        } else {
            $js .= 'body.classList.remove("mas-v2-admin-bar-floating");';
        }
        
        // Admin bar detached (legacy compatibility)
        if (isset($settings['admin_bar_detached']) && $settings['admin_bar_detached']) {
            $js .= 'body.classList.add("mas-admin-bar-floating");';
        } else {
            $js .= 'body.classList.remove("mas-admin-bar-floating");';
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
}

// Inicjalizuj wtyczkę
ModernAdminStylerV2::getInstance();
