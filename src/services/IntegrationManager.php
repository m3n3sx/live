<?php
/**
 * Integration Manager - Third-Party Plugin Integrations
 * 
 * FAZA 6: Enterprise Integration & Analytics
 * System integracji z popularnymi pluginami WordPress
 * 
 * @package ModernAdminStyler
 * @version 3.3.0
 */

namespace ModernAdminStyler\Services;

class IntegrationManager {
    
    private $serviceFactory;
    private $analyticsEngine;
    private $activeIntegrations = [];
    private $integrationConfigs = [];
    
    // 🔌 Dostępne integracje
    const INTEGRATION_WOOCOMMERCE = 'woocommerce';
    const INTEGRATION_ELEMENTOR = 'elementor';
    const INTEGRATION_YOAST_SEO = 'yoast_seo';
    const INTEGRATION_CONTACT_FORM_7 = 'contact_form_7';
    const INTEGRATION_ADVANCED_CUSTOM_FIELDS = 'acf';
    const INTEGRATION_GRAVITY_FORMS = 'gravity_forms';
    const INTEGRATION_JETPACK = 'jetpack';
    const INTEGRATION_WORDFENCE = 'wordfence';
    const INTEGRATION_RANKMATH = 'rankmath';
    
    // 📊 Status integracji
    const STATUS_ACTIVE = 'active';
    const STATUS_INACTIVE = 'inactive';
    const STATUS_ERROR = 'error';
    const STATUS_PENDING = 'pending';
    
    public function __construct($serviceFactory) {
        $this->serviceFactory = $serviceFactory;
        $this->analyticsEngine = $serviceFactory->getAnalyticsEngine();
        
        $this->initIntegrations();
    }
    
    /**
     * 🚀 Inicjalizacja systemu integracji
     */
    private function initIntegrations() {
        // Załaduj konfiguracje integracji
        $this->loadIntegrationConfigs();
        
        // Wykryj dostępne pluginy
        $this->detectAvailablePlugins();
        
        // Aktywuj integracje
        $this->activateIntegrations();
        
        // Rejestruj hooks
        $this->registerIntegrationHooks();
    }
    
    /**
     * 📋 Załaduj konfiguracje integracji
     */
    private function loadIntegrationConfigs() {
        $this->integrationConfigs = [
            self::INTEGRATION_WOOCOMMERCE => [
                'name' => 'WooCommerce',
                'plugin_file' => 'woocommerce/woocommerce.php',
                'class_check' => 'WooCommerce',
                'function_check' => 'WC',
                'version_required' => '5.0.0',
                'features' => [
                    'admin_styling' => true,
                    'dashboard_widgets' => true,
                    'order_management' => true,
                    'product_styling' => true
                ]
            ],
            
            self::INTEGRATION_ELEMENTOR => [
                'name' => 'Elementor',
                'plugin_file' => 'elementor/elementor.php',
                'class_check' => '\Elementor\Plugin',
                'version_required' => '3.0.0',
                'features' => [
                    'editor_styling' => true,
                    'widget_styling' => true,
                    'admin_integration' => true
                ]
            ],
            
            self::INTEGRATION_YOAST_SEO => [
                'name' => 'Yoast SEO',
                'plugin_file' => 'wordpress-seo/wp-seo.php',
                'class_check' => 'WPSEO',
                'version_required' => '16.0',
                'features' => [
                    'metabox_styling' => true,
                    'admin_styling' => true,
                    'dashboard_integration' => true
                ]
            ],
            
            self::INTEGRATION_CONTACT_FORM_7 => [
                'name' => 'Contact Form 7',
                'plugin_file' => 'contact-form-7/wp-contact-form-7.php',
                'class_check' => 'WPCF7',
                'version_required' => '5.0',
                'features' => [
                    'form_styling' => true,
                    'admin_styling' => true
                ]
            ],
            
            self::INTEGRATION_ADVANCED_CUSTOM_FIELDS => [
                'name' => 'Advanced Custom Fields',
                'plugin_file' => 'advanced-custom-fields/acf.php',
                'class_check' => 'ACF',
                'function_check' => 'acf',
                'version_required' => '5.8.0',
                'features' => [
                    'field_styling' => true,
                    'admin_styling' => true,
                    'metabox_styling' => true
                ]
            ]
        ];
    }
    
    /**
     * 🔍 Wykryj dostępne pluginy
     */
    private function detectAvailablePlugins() {
        foreach ($this->integrationConfigs as $integration_id => $config) {
            $status = $this->checkPluginStatus($integration_id, $config);
            
            $this->activeIntegrations[$integration_id] = [
                'config' => $config,
                'status' => $status,
                'detected_at' => current_time('mysql'),
                'version' => $this->getPluginVersion($config),
                'compatible' => $this->isVersionCompatible($config)
            ];
            
            // Zbierz metrykę analytics
            $this->analyticsEngine->collectSystemHealthMetric(
                "integration_{$integration_id}",
                $status,
                [
                    'plugin_name' => $config['name'],
                    'version' => $this->getPluginVersion($config),
                    'compatible' => $this->isVersionCompatible($config)
                ]
            );
        }
    }
    
    /**
     * ✅ Sprawdź status pluginu
     */
    private function checkPluginStatus($integration_id, $config) {
        // Sprawdź czy plugin jest aktywny
        if (!is_plugin_active($config['plugin_file'])) {
            return self::STATUS_INACTIVE;
        }
        
        // Sprawdź czy klasa/funkcja istnieje
        if (isset($config['class_check']) && !class_exists($config['class_check'])) {
            return self::STATUS_ERROR;
        }
        
        if (isset($config['function_check']) && !function_exists($config['function_check'])) {
            return self::STATUS_ERROR;
        }
        
        // Sprawdź kompatybilność wersji
        if (!$this->isVersionCompatible($config)) {
            return self::STATUS_ERROR;
        }
        
        return self::STATUS_ACTIVE;
    }
    
    /**
     * 🔄 Aktywuj integracje
     */
    private function activateIntegrations() {
        foreach ($this->activeIntegrations as $integration_id => $integration) {
            if ($integration['status'] === self::STATUS_ACTIVE) {
                $this->activateIntegration($integration_id, $integration);
            }
        }
    }
    
    /**
     * 🎯 Aktywuj konkretną integrację
     */
    private function activateIntegration($integration_id, $integration) {
        $config = $integration['config'];
        
        // Załaduj specyficzne style dla integracji
        $this->loadIntegrationStyles($integration_id, $config);
        
        // Załaduj specyficzne skrypty
        $this->loadIntegrationScripts($integration_id, $config);
        
        // Dodaj dashboard widgets jeśli wspierane
        if (isset($config['features']['dashboard_widgets']) && $config['features']['dashboard_widgets']) {
            $this->addDashboardWidget($integration_id, $config);
        }
        
        // Trigger action dla developerów
        do_action('mas_v2_integration_activated', $integration_id, $integration);
        
        // Log aktywacji
        $this->analyticsEngine->collectUserBehaviorMetric(
            'integration_activated',
            $integration_id,
            ['plugin_name' => $config['name']]
        );
    }
    
    /**
     * 🎨 Załaduj style dla integracji
     */
    private function loadIntegrationStyles($integration_id, $config) {
        add_action('admin_enqueue_scripts', function() use ($integration_id, $config) {
            // Sprawdź czy jesteśmy na stronie tego pluginu
            if ($this->isPluginAdminPage($integration_id)) {
                // Dodaj inline styles dla integracji
                $styles = $this->getIntegrationStyles($integration_id);
                if ($styles) {
                    wp_add_inline_style('mas-v2-main', $styles);
                }
            }
        });
    }
    
    /**
     * 📜 Załaduj skrypty dla integracji
     */
    private function loadIntegrationScripts($integration_id, $config) {
        add_action('admin_enqueue_scripts', function() use ($integration_id, $config) {
            if ($this->isPluginAdminPage($integration_id)) {
                // Dodaj inline JavaScript dla integracji
                $scripts = $this->getIntegrationScripts($integration_id);
                if ($scripts) {
                    wp_add_inline_script('mas-v2-admin', $scripts);
                }
            }
        });
    }
    
    /**
     * 🎨 Pobierz style dla integracji
     */
    private function getIntegrationStyles($integration_id) {
        $styles = [
            self::INTEGRATION_WOOCOMMERCE => '
                .woocommerce .form-table th,
                .woocommerce .form-table td { padding: 15px 10px; }
                .woocommerce .button-primary { border-radius: 6px; }
                .woocommerce-order-data { border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            ',
            
            self::INTEGRATION_ELEMENTOR => '
                .elementor-panel { border-radius: 8px !important; }
                .elementor-control { margin-bottom: 15px; }
                .elementor-control-title { font-weight: 600; }
            ',
            
            self::INTEGRATION_YOAST_SEO => '
                .yoast-seo-metabox { border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
                .yoast-seo-score { padding: 12px; border-radius: 6px; }
                .yoast-seo-score-icon { margin-right: 8px; }
            ',
            
            self::INTEGRATION_CONTACT_FORM_7 => '
                .contact-form-editor { border-radius: 8px; }
                .contact-form-editor textarea { border-radius: 6px; font-family: Monaco, monospace; }
            ',
            
            self::INTEGRATION_ADVANCED_CUSTOM_FIELDS => '
                .acf-field { margin-bottom: 20px; }
                .acf-label { font-weight: 600; margin-bottom: 8px; }
                .acf-input input, .acf-input textarea, .acf-input select { border-radius: 6px; }
            '
        ];
        
        return $styles[$integration_id] ?? '';
    }
    
    /**
     * 📜 Pobierz skrypty dla integracji
     */
    private function getIntegrationScripts($integration_id) {
        $scripts = [
            self::INTEGRATION_WOOCOMMERCE => '
                jQuery(document).ready(function($) {
                    // Dodaj smooth animations do WooCommerce
                    $(".woocommerce .button").hover(function() {
                        $(this).css("transform", "translateY(-1px)");
                    }, function() {
                        $(this).css("transform", "translateY(0px)");
                    });
                });
            ',
            
            self::INTEGRATION_ELEMENTOR => '
                jQuery(document).ready(function($) {
                    // Ulepsz Elementor UI
                    if (typeof elementor !== "undefined") {
                        console.log("MAS V2: Elementor integration loaded");
                    }
                });
            '
        ];
        
        return $scripts[$integration_id] ?? '';
    }
    
    /**
     * 📊 Dodaj dashboard widget
     */
    private function addDashboardWidget($integration_id, $config) {
        add_action('wp_dashboard_setup', function() use ($integration_id, $config) {
            wp_add_dashboard_widget(
                "mas_v2_widget_{$integration_id}",
                "📊 {$config['name']} - MAS V2 Integration",
                function() use ($integration_id, $config) {
                    $this->renderDashboardWidget($integration_id, $config);
                }
            );
        });
    }
    
    /**
     * 🎨 Renderuj dashboard widget
     */
    private function renderDashboardWidget($integration_id, $config) {
        $stats = $this->getIntegrationStats($integration_id);
        
        echo '<div class="mas-v2-integration-widget">';
        echo '<h4>🔌 ' . esc_html($config['name']) . ' Integration</h4>';
        echo '<div class="integration-stats">';
        
        if ($stats) {
            echo '<p><strong>Status:</strong> <span class="status-active">✅ Active</span></p>';
            echo '<p><strong>Version:</strong> ' . esc_html($stats['version']) . '</p>';
            echo '<p><strong>Features:</strong> ' . count($config['features']) . ' active</p>';
        } else {
            echo '<p><strong>Status:</strong> <span class="status-inactive">❌ Inactive</span></p>';
        }
        
        echo '</div>';
        echo '</div>';
        
        // Dodaj style
        echo '<style>
            .mas-v2-integration-widget { padding: 10px; }
            .integration-stats { margin: 10px 0; }
            .integration-stats p { margin: 5px 0; }
            .status-active { color: #46b450; font-weight: bold; }
            .status-inactive { color: #dc3232; font-weight: bold; }
        </style>';
    }
    
    /**
     * 📈 Pobierz statystyki integracji
     */
    private function getIntegrationStats($integration_id) {
        if (!isset($this->activeIntegrations[$integration_id])) {
            return null;
        }
        
        $integration = $this->activeIntegrations[$integration_id];
        
        if ($integration['status'] !== self::STATUS_ACTIVE) {
            return null;
        }
        
        return [
            'version' => $integration['version'],
            'status' => $integration['status']
        ];
    }
    
    /**
     * 🔧 Metody pomocnicze
     */
    private function getPluginVersion($config) {
        if (!is_plugin_active($config['plugin_file'])) {
            return null;
        }
        
        $plugin_data = get_plugin_data(WP_PLUGIN_DIR . '/' . $config['plugin_file']);
        return $plugin_data['Version'] ?? null;
    }
    
    private function isVersionCompatible($config) {
        $current_version = $this->getPluginVersion($config);
        
        if (!$current_version || !isset($config['version_required'])) {
            return true;
        }
        
        return version_compare($current_version, $config['version_required'], '>=');
    }
    
    private function isPluginAdminPage($integration_id) {
        $screen = get_current_screen();
        
        if (!$screen) {
            return false;
        }
        
        $plugin_indicators = [
            self::INTEGRATION_WOOCOMMERCE => ['woocommerce', 'shop_order', 'product'],
            self::INTEGRATION_ELEMENTOR => ['elementor'],
            self::INTEGRATION_YOAST_SEO => ['yoast', 'wpseo'],
            self::INTEGRATION_CONTACT_FORM_7 => ['wpcf7'],
            self::INTEGRATION_ADVANCED_CUSTOM_FIELDS => ['acf']
        ];
        
        if (!isset($plugin_indicators[$integration_id])) {
            return false;
        }
        
        foreach ($plugin_indicators[$integration_id] as $indicator) {
            if (strpos($screen->id, $indicator) !== false || 
                strpos($screen->base, $indicator) !== false ||
                (isset($_GET['page']) && strpos($_GET['page'], $indicator) !== false)) {
                return true;
            }
        }
        
        return false;
    }
    
    private function registerIntegrationHooks() {
        // Rejestruj ogólne hooks dla integracji
        add_action('plugins_loaded', [$this, 'onPluginsLoaded']);
        add_action('activated_plugin', [$this, 'onPluginActivated']);
        add_action('deactivated_plugin', [$this, 'onPluginDeactivated']);
    }
    
    public function onPluginsLoaded() {
        // Ponownie sprawdź integracje po załadowaniu wszystkich pluginów
        $this->detectAvailablePlugins();
    }
    
    public function onPluginActivated($plugin) {
        // Sprawdź czy aktywowany plugin to jedna z naszych integracji
        foreach ($this->integrationConfigs as $integration_id => $config) {
            if ($config['plugin_file'] === $plugin) {
                $this->analyticsEngine->collectUserBehaviorMetric(
                    'integration_plugin_activated',
                    $integration_id,
                    ['plugin_name' => $config['name']]
                );
                
                // Ponownie sprawdź status tej integracji
                $this->detectAvailablePlugins();
                break;
            }
        }
    }
    
    public function onPluginDeactivated($plugin) {
        // Sprawdź czy deaktywowany plugin to jedna z naszych integracji
        foreach ($this->integrationConfigs as $integration_id => $config) {
            if ($config['plugin_file'] === $plugin) {
                $this->analyticsEngine->collectUserBehaviorMetric(
                    'integration_plugin_deactivated',
                    $integration_id,
                    ['plugin_name' => $config['name']]
                );
                
                // Aktualizuj status
                if (isset($this->activeIntegrations[$integration_id])) {
                    $this->activeIntegrations[$integration_id]['status'] = self::STATUS_INACTIVE;
                }
                break;
            }
        }
    }
    
    /**
     * 📋 API publiczne
     */
    
    /**
     * Pobierz wszystkie integracje
     */
    public function getAllIntegrations() {
        return $this->activeIntegrations;
    }
    
    /**
     * Pobierz aktywne integracje
     */
    public function getActiveIntegrations() {
        return array_filter($this->activeIntegrations, function($integration) {
            return $integration['status'] === self::STATUS_ACTIVE;
        });
    }
    
    /**
     * Sprawdź czy integracja jest aktywna
     */
    public function isIntegrationActive($integration_id) {
        return isset($this->activeIntegrations[$integration_id]) && 
               $this->activeIntegrations[$integration_id]['status'] === self::STATUS_ACTIVE;
    }
    
    /**
     * Pobierz konfigurację integracji
     */
    public function getIntegrationConfig($integration_id) {
        return $this->integrationConfigs[$integration_id] ?? null;
    }
    
    /**
     * Pobierz statystyki wszystkich integracji
     */
    public function getIntegrationsOverview() {
        $overview = [
            'total' => count($this->integrationConfigs),
            'active' => 0,
            'inactive' => 0,
            'error' => 0,
            'integrations' => []
        ];
        
        foreach ($this->activeIntegrations as $integration_id => $integration) {
            $overview['integrations'][$integration_id] = [
                'name' => $integration['config']['name'],
                'status' => $integration['status'],
                'version' => $integration['version'],
                'compatible' => $integration['compatible']
            ];
            
            switch ($integration['status']) {
                case self::STATUS_ACTIVE:
                    $overview['active']++;
                    break;
                case self::STATUS_INACTIVE:
                    $overview['inactive']++;
                    break;
                case self::STATUS_ERROR:
                    $overview['error']++;
                    break;
            }
        }
        
        return $overview;
    }
} 