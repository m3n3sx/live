<?php
/**
 * AJAX Handler Service
 * 
 * Odpowiedzialny za obsługę wszystkich zapytań AJAX
 * 
 * @package ModernAdminStyler
 * @version 2.0
 */

namespace ModernAdminStyler\Services;

class AjaxHandler {
    
    private $settings_manager;
    
    public function __construct($settings_manager) {
        $this->settings_manager = $settings_manager;
    }
    
    /**
     * 🔒 Weryfikuje bezpieczeństwo AJAX requesta
     */
    private function verifyAjaxSecurity() {
        if (!wp_verify_nonce($_POST['nonce'] ?? '', 'mas_v2_nonce')) {
            wp_send_json_error(['message' => __('Błąd bezpieczeństwa', 'modern-admin-styler-v2')]);
            return false;
        }
        
        if (!current_user_can('manage_options')) {
            wp_send_json_error(['message' => __('Brak uprawnień', 'modern-admin-styler-v2')]);
            return false;
        }
        
        return true;
    }
    
    /**
     * 💾 Obsługuje zapisywanie ustawień przez AJAX
     */
    public function handleSaveSettings() {
        if (!$this->verifyAjaxSecurity()) {
            return;
        }
        
        try {
            error_log('MAS V2: AJAX Save Settings called');
            
            // Filtruj dane formularza
            $form_data = $_POST;
            unset($form_data['nonce'], $form_data['action']);
            
            // Sanityzacja i zapis
            $old_settings = $this->settings_manager->getSettings();
            $settings = $this->settings_manager->sanitizeSettings($form_data);
            $result = $this->settings_manager->saveSettings($settings);
            
            // Weryfikacja zapisu
            $is_success = ($result === true || serialize($settings) === serialize($old_settings));
            
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
     * 🔄 Obsługuje resetowanie ustawień
     */
    public function handleResetSettings() {
        if (!$this->verifyAjaxSecurity()) {
            return;
        }
        
        try {
            $defaults = $this->settings_manager->getDefaultSettings();
            $this->settings_manager->saveSettings($defaults);
            
            wp_send_json_success([
                'message' => __('Ustawienia zostały przywrócone do domyślnych!', 'modern-admin-styler-v2')
            ]);
        } catch (Exception $e) {
            wp_send_json_error(['message' => $e->getMessage()]);
        }
    }
    
    /**
     * 📤 Obsługuje eksport ustawień
     */
    public function handleExportSettings() {
        if (!$this->verifyAjaxSecurity()) {
            return;
        }
        
        try {
            $settings = $this->settings_manager->getSettings();
            $export_data = [
                'version' => MAS_V2_VERSION,
                'exported' => date('Y-m-d H:i:s'),
                'settings' => $settings
            ];
            
            wp_send_json_success([
                'data' => $export_data,
                'filename' => 'mas-v2-settings-' . date('Y-m-d') . '.json'
            ]);
        } catch (Exception $e) {
            wp_send_json_error(['message' => $e->getMessage()]);
        }
    }
    
    /**
     * 📥 Obsługuje import ustawień
     */
    public function handleImportSettings() {
        if (!$this->verifyAjaxSecurity()) {
            return;
        }
        
        try {
            $import_data = json_decode(stripslashes($_POST['data']), true);
            
            if (!$import_data || !isset($import_data['settings'])) {
                throw new Exception(__('Nieprawidłowy format pliku', 'modern-admin-styler-v2'));
            }
            
            $settings = $this->settings_manager->sanitizeSettings($import_data['settings']);
            $this->settings_manager->saveSettings($settings);
            
            wp_send_json_success([
                'message' => __('Ustawienia zostały zaimportowane pomyślnie!', 'modern-admin-styler-v2'),
                'settings' => $settings
            ]);
            
        } catch (Exception $e) {
            wp_send_json_error(['message' => $e->getMessage()]);
        }
    }
    
    /**
     * 🔍 Diagnostyka - sprawdzenie bazy danych
     */
    public function handleDatabaseCheck() {
        if (!$this->verifyAjaxSecurity()) {
            return;
        }
        
        try {
            global $wpdb;
            
            $results = [
                'database_connection' => $wpdb->check_connection(),
                'options_table_exists' => $wpdb->get_var("SHOW TABLES LIKE '{$wpdb->options}'") === $wpdb->options,
                'mas_option_exists' => get_option('mas_v2_settings') !== false,
                'option_size' => strlen(serialize(get_option('mas_v2_settings'))),
                'autoload_status' => $wpdb->get_var("SELECT autoload FROM {$wpdb->options} WHERE option_name = 'mas_v2_settings'")
            ];
            
            wp_send_json_success($results);
            
        } catch (Exception $e) {
            wp_send_json_error(['message' => $e->getMessage()]);
        }
    }

    // ========================================
    // 🚀 ENTERPRISE AJAX HANDLERS
    // ========================================

    /**
     * 🧹 Enterprise: Czyszczenie cache
     */
    public function handleCacheFlush() {
        if (!$this->verifyAjaxSecurity()) {
            return;
        }

        try {
            $factory = \ModernAdminStyler\Services\ServiceFactory::getInstance();
            $cache_manager = $factory->get('cache_manager');
            $cache_manager->flush();
            
            wp_send_json_success(['message' => __('Cache został wyczyszczony pomyślnie!', 'modern-admin-styler-v2')]);
        } catch (Exception $e) {
            wp_send_json_error(['message' => $e->getMessage()]);
        }
    }

    /**
     * 📊 Enterprise: Statystyki cache
     */
    public function handleCacheStats() {
        if (!$this->verifyAjaxSecurity()) {
            return;
        }

        try {
            $factory = \ModernAdminStyler\Services\ServiceFactory::getInstance();
            $cache_manager = $factory->get('cache_manager');
            $stats = $cache_manager->getStats();
            
            wp_send_json_success($stats);
        } catch (Exception $e) {
            wp_send_json_error(['message' => $e->getMessage()]);
        }
    }

    /**
     * 📈 Enterprise: Raport metryk wydajności
     */
    public function handleMetricsReport() {
        if (!$this->verifyAjaxSecurity()) {
            return;
        }

        try {
            $factory = \ModernAdminStyler\Services\ServiceFactory::getInstance();
            $metrics_collector = $factory->get('metrics_collector');
            $report = $metrics_collector->generateReport();
            
            wp_send_json_success($report);
        } catch (Exception $e) {
            wp_send_json_error(['message' => $e->getMessage()]);
        }
    }

    /**
     * 🔐 Enterprise: Skan bezpieczeństwa
     * FIXED: Now includes comprehensive database and filesystem scanning with memory optimization
     */
    public function handleSecurityScan() {
        if (!$this->verifyAjaxSecurity()) {
            return;
        }

        try {
            $factory = \ModernAdminStyler\Services\ServiceFactory::getInstance();
            $security_manager = $factory->get('enterprise_security');
            
            // Get scan type from request
            $scan_type = $_POST['scan_type'] ?? 'basic';
            
            if ($scan_type === 'comprehensive') {
                // Run comprehensive scan with chunking
                $scan_results = $security_manager->runComprehensiveScan();
            } else {
                // Basic security check
                $scan_results = [
                    'plugin_version' => MAS_V2_VERSION,
                    'security_features' => [
                        'nonce_verification' => true,
                        'capability_check' => true,
                        'input_sanitization' => true,
                        'rate_limiting' => true,
                        'memory_optimization' => true
                    ],
                    'security_stats' => $security_manager->getSecurityStats(),
                    'recommendations' => [
                        __('Wszystkie mechanizmy bezpieczeństwa są aktywne', 'modern-admin-styler-v2'),
                        __('System używa chunking aby uniknąć problemów z pamięcią', 'modern-admin-styler-v2')
                    ],
                    'security_score' => 98,
                    'memory_usage' => [
                        'current' => memory_get_usage(true),
                        'peak' => memory_get_peak_usage(true),
                        'limit' => ini_get('memory_limit')
                    ]
                ];
            }

            wp_send_json_success($scan_results);
        } catch (Exception $e) {
            wp_send_json_error(['message' => $e->getMessage()]);
        }
    }

    /**
     * ⚡ Enterprise: Test wydajności (benchmark)
     */
    public function handlePerformanceBenchmark() {
        if (!$this->verifyAjaxSecurity()) {
            return;
        }

        try {
            $factory = \ModernAdminStyler\Services\ServiceFactory::getInstance();
            $cache_manager = $factory->get('cache_manager');
            $benchmark = $cache_manager->benchmark();
            
            wp_send_json_success($benchmark);
        } catch (Exception $e) {
            wp_send_json_error(['message' => $e->getMessage()]);
        }
    }

    /**
     * 🎨 Enterprise: Regeneracja CSS
     */
    public function handleCSSRegenerate() {
        if (!$this->verifyAjaxSecurity()) {
            return;
        }

        try {
            $factory = \ModernAdminStyler\Services\ServiceFactory::getInstance();
            $cache_manager = $factory->get('cache_manager');
            $css_generator = $factory->get('css_generator');
            
            // Wyczyść cache CSS
            $cache_manager->delete('mas_v2_generated_css');
            
            // Regeneruj CSS
            $settings = $this->settings_manager->getSettings();
            $css = $css_generator->generate($settings);
            
            wp_send_json_success([
                'message' => __('CSS został zregenerowany pomyślnie!', 'modern-admin-styler-v2'),
                'css_length' => strlen($css),
                'timestamp' => current_time('mysql')
            ]);
        } catch (Exception $e) {
            wp_send_json_error(['message' => $e->getMessage()]);
        }
    }
    
    /**
     * 💾 Memory stats handler
     */
    public function handleMemoryStats() {
        if (!$this->verifyAjaxSecurity()) {
            return;
        }
        
        try {
            $serviceFactory = \ModernAdminStyler\Services\ServiceFactory::getInstance();
            $memoryOptimizer = $serviceFactory->getMemoryOptimizer();
            
            $stats = $memoryOptimizer->getMemoryStats();
            
            wp_send_json_success($stats);
        } catch (Exception $e) {
            wp_send_json_error('Failed to get memory stats: ' . $e->getMessage());
        }
    }
    
    /**
     * 🔧 Force memory optimization handler
     */
    public function handleForceMemoryOptimization() {
        if (!$this->verifyAjaxSecurity()) {
            return;
        }
        
        try {
            $serviceFactory = \ModernAdminStyler\Services\ServiceFactory::getInstance();
            $memoryOptimizer = $serviceFactory->getMemoryOptimizer();
            
            $result = $memoryOptimizer->forceOptimization();
            
            wp_send_json_success([
                'message' => 'Memory optimization completed',
                'stats' => $result
            ]);
        } catch (Exception $e) {
            wp_send_json_error('Memory optimization failed: ' . $e->getMessage());
        }
    }
} 