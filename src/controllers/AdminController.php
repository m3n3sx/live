<?php

namespace ModernAdminStylerV2\Controllers;

use ModernAdminStylerV2\Services\SettingsService;
use ModernAdminStylerV2\Services\AssetService;

/**
 * Kontroler administracyjny - odpowiedzialny za interfejs admina
 */
class AdminController {
    private $settingsService;
    private $assetService;
    
    public function __construct() {
        $this->settingsService = new SettingsService();
        $this->assetService = new AssetService();
        $this->init();
    }
    
    private function init() {
        add_action('admin_menu', [$this, 'addAdminMenu']);
        add_action('admin_enqueue_scripts', [$this, 'enqueueAssets']);
        add_action('wp_ajax_mas_v2_save_settings', [$this, 'ajaxSaveSettings']);
        add_action('wp_ajax_mas_v2_reset_settings', [$this, 'ajaxResetSettings']);
        add_action('wp_ajax_mas_v2_export_settings', [$this, 'ajaxExportSettings']);
        add_action('wp_ajax_mas_v2_import_settings', [$this, 'ajaxImportSettings']);
    }
    
    /**
     * Dodaje menu do panelu administracyjnego
     */
    public function addAdminMenu() {
        add_menu_page(
            __('Modern Admin Styler V2', 'modern-admin-styler-v2'),
            __('MAS V2', 'modern-admin-styler-v2'),
            'manage_options',
            'mas-v2-settings',
            [$this, 'renderAdminPage'],
            'data:image/svg+xml;base64,' . base64_encode('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/></svg>'),
            30
        );
    }
    
    /**
     * Ładuje zasoby CSS i JS
     */
    public function enqueueAssets($hook) {
        if ($hook !== 'toplevel_page_mas-v2-settings') {
            return;
        }
        
        $this->assetService->enqueueAdminAssets();
        
        // Lokalizacja skryptu
        wp_localize_script('mas-v2-admin', 'masV2', [
            'ajaxUrl' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('mas_v2_nonce'),
            'settings' => $this->settingsService->getSettings(),
            'strings' => [
                'saving' => __('Zapisywanie...', 'modern-admin-styler-v2'),
                'saved' => __('Ustawienia zostały zapisane!', 'modern-admin-styler-v2'),
                'error' => __('Wystąpił błąd podczas zapisywania', 'modern-admin-styler-v2'),
                'confirm_reset' => __('Czy na pewno chcesz przywrócić domyślne ustawienia?', 'modern-admin-styler-v2'),
                'resetting' => __('Resetowanie...', 'modern-admin-styler-v2'),
                'reset_success' => __('Ustawienia zostały przywrócone!', 'modern-admin-styler-v2'),
                'export_success' => __('Ustawienia zostały wyeksportowane!', 'modern-admin-styler-v2'),
                'import_success' => __('Ustawienia zostały zaimportowane!', 'modern-admin-styler-v2'),
                'invalid_file' => __('Nieprawidłowy plik ustawień!', 'modern-admin-styler-v2'),
            ]
        ]);
    }
    
    /**
     * Renderuje stronę administracyjną
     */
    public function renderAdminPage() {
        $settings = $this->settingsService->getSettings();
        $tabs = $this->getTabs();
        
        include MAS_V2_PLUGIN_DIR . 'src/views/admin-page.php';
    }
    
    /**
     * AJAX: Zapisuje ustawienia
     */
    public function ajaxSaveSettings() {
        // Weryfikacja bezpieczeństwa
        if (!wp_verify_nonce($_POST['nonce'] ?? '', 'mas_v2_nonce')) {
            wp_send_json_error(['message' => __('Błąd bezpieczeństwa', 'modern-admin-styler-v2')]);
        }
        
        if (!current_user_can('manage_options')) {
            wp_send_json_error(['message' => __('Brak uprawnień', 'modern-admin-styler-v2')]);
        }
        
        try {
            $settings = $this->settingsService->sanitizeSettings($_POST);
            $this->settingsService->saveSettings($settings);
            
            wp_send_json_success([
                'message' => __('Ustawienia zostały zapisane pomyślnie!', 'modern-admin-styler-v2'),
                'settings' => $settings
            ]);
        } catch (Exception $e) {
            wp_send_json_error(['message' => $e->getMessage()]);
        }
    }
    
    /**
     * AJAX: Resetuje ustawienia
     */
    public function ajaxResetSettings() {
        if (!wp_verify_nonce($_POST['nonce'] ?? '', 'mas_v2_nonce')) {
            wp_send_json_error(['message' => __('Błąd bezpieczeństwa', 'modern-admin-styler-v2')]);
        }
        
        if (!current_user_can('manage_options')) {
            wp_send_json_error(['message' => __('Brak uprawnień', 'modern-admin-styler-v2')]);
        }
        
        try {
            $this->settingsService->resetSettings();
            $settings = $this->settingsService->getSettings();
            
            wp_send_json_success([
                'message' => __('Ustawienia zostały przywrócone do domyślnych!', 'modern-admin-styler-v2'),
                'settings' => $settings
            ]);
        } catch (Exception $e) {
            wp_send_json_error(['message' => $e->getMessage()]);
        }
    }
    
    /**
     * AJAX: Eksportuje ustawienia
     */
    public function ajaxExportSettings() {
        if (!wp_verify_nonce($_POST['nonce'] ?? '', 'mas_v2_nonce')) {
            wp_send_json_error(['message' => __('Błąd bezpieczeństwa', 'modern-admin-styler-v2')]);
        }
        
        if (!current_user_can('manage_options')) {
            wp_send_json_error(['message' => __('Brak uprawnień', 'modern-admin-styler-v2')]);
        }
        
        try {
            $settings = $this->settingsService->getSettings();
            $export = [
                'version' => MAS_V2_VERSION,
                'exported_at' => current_time('mysql'),
                'settings' => $settings
            ];
            
            wp_send_json_success([
                'data' => $export,
                'filename' => 'mas-v2-settings-' . date('Y-m-d-H-i-s') . '.json'
            ]);
        } catch (Exception $e) {
            wp_send_json_error(['message' => $e->getMessage()]);
        }
    }
    
    /**
     * AJAX: Importuje ustawienia
     */
    public function ajaxImportSettings() {
        if (!wp_verify_nonce($_POST['nonce'] ?? '', 'mas_v2_nonce')) {
            wp_send_json_error(['message' => __('Błąd bezpieczeństwa', 'modern-admin-styler-v2')]);
        }
        
        if (!current_user_can('manage_options')) {
            wp_send_json_error(['message' => __('Brak uprawnień', 'modern-admin-styler-v2')]);
        }
        
        try {
            $data = json_decode(stripslashes($_POST['data'] ?? ''), true);
            
            if (!$data || !isset($data['settings'])) {
                throw new Exception(__('Nieprawidłowy format pliku', 'modern-admin-styler-v2'));
            }
            
            $settings = $this->settingsService->sanitizeSettings($data['settings']);
            $this->settingsService->saveSettings($settings);
            
            wp_send_json_success([
                'message' => __('Ustawienia zostały zaimportowane pomyślnie!', 'modern-admin-styler-v2'),
                'settings' => $settings
            ]);
        } catch (Exception $e) {
            wp_send_json_error(['message' => $e->getMessage()]);
        }
    }
    
    /**
     * Zwraca definicje tabów interfejsu
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
            ]
        ];
    }
} 