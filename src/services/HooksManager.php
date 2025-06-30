<?php
/**
 * Hooks Manager Service
 * 
 * Faza 3: Ecosystem Integration
 * Zarządza hooks i filters dla maksymalnej rozszerzalności
 * 
 * @package ModernAdminStyler\Services
 * @version 3.0.0
 */

namespace ModernAdminStyler\Services;

class HooksManager {
    
    private $settings_manager;
    private $registered_hooks = [];
    private $hook_priorities = [];
    
    public function __construct($settings_manager) {
        $this->settings_manager = $settings_manager;
        $this->init();
    }
    
    /**
     * Inicjalizacja hooks manager
     */
    public function init() {
        // Rejestruj główne hooks dla developers
        $this->registerCoreHooks();
        
        // Dodaj action dla late hook registration
        add_action('init', [$this, 'registerLateHooks'], 999);
        
        // Dodaj dokumentację hooks przez REST API
        add_action('rest_api_init', [$this, 'registerHooksDocumentationEndpoint']);
    }
    
    /**
     * Rejestruje główne hooks dla developers
     */
    private function registerCoreHooks() {
        
        // === SETTINGS HOOKS ===
        
        /**
         * Filtr: Modyfikacja ustawień przed zapisem
         * 
         * @param array $settings Tablica ustawień
         * @param array $old_settings Poprzednie ustawienia
         * @return array Zmodyfikowane ustawienia
         */
        $this->registerHook('filter', 'mas_v2_before_save_settings', [
            'description' => 'Modify settings before saving to database',
            'parameters' => ['settings' => 'array', 'old_settings' => 'array'],
            'return' => 'array',
            'example' => "add_filter('mas_v2_before_save_settings', function(\$settings, \$old) { \$settings['custom_field'] = 'value'; return \$settings; }, 10, 2);"
        ]);
        
        /**
         * Action: Po zapisaniu ustawień
         * 
         * @param array $settings Zapisane ustawienia
         * @param array $old_settings Poprzednie ustawienia
         */
        $this->registerHook('action', 'mas_v2_after_save_settings', [
            'description' => 'Triggered after settings are saved',
            'parameters' => ['settings' => 'array', 'old_settings' => 'array'],
            'example' => "add_action('mas_v2_after_save_settings', function(\$settings, \$old) { /* Custom logic */ }, 10, 2);"
        ]);
        
        /**
         * Filtr: Walidacja niestandardowych ustawień
         * 
         * @param array $errors Tablica błędów walidacji
         * @param array $settings Ustawienia do walidacji
         * @return array Tablica błędów
         */
        $this->registerHook('filter', 'mas_v2_validate_custom_settings', [
            'description' => 'Validate custom settings fields',
            'parameters' => ['errors' => 'array', 'settings' => 'array'],
            'return' => 'array',
            'example' => "add_filter('mas_v2_validate_custom_settings', function(\$errors, \$settings) { if(empty(\$settings['required_field'])) \$errors[] = 'Required field missing'; return \$errors; }, 10, 2);"
        ]);
        
        // === CSS GENERATION HOOKS ===
        
        /**
         * Filtr: Modyfikacja generowanego CSS
         * 
         * @param string $css Wygenerowany CSS
         * @param array $settings Aktualne ustawienia
         * @return string Zmodyfikowany CSS
         */
        $this->registerHook('filter', 'mas_v2_generated_css', [
            'description' => 'Modify generated CSS output',
            'parameters' => ['css' => 'string', 'settings' => 'array'],
            'return' => 'string',
            'example' => "add_filter('mas_v2_generated_css', function(\$css, \$settings) { return \$css . '.custom-class { color: red; }'; }, 10, 2);"
        ]);
        
        /**
         * Filtr: Dodanie niestandardowych zmiennych CSS
         * 
         * @param array $variables Tablica zmiennych CSS
         * @param array $settings Aktualne ustawienia
         * @return array Zmodyfikowane zmienne
         */
        $this->registerHook('filter', 'mas_v2_css_variables', [
            'description' => 'Add custom CSS variables',
            'parameters' => ['variables' => 'array', 'settings' => 'array'],
            'return' => 'array',
            'example' => "add_filter('mas_v2_css_variables', function(\$vars, \$settings) { \$vars['--custom-color'] = '#ff0000'; return \$vars; }, 10, 2);"
        ]);
        
        /**
         * Action: Przed generowaniem CSS
         * 
         * @param array $settings Aktualne ustawienia
         */
        $this->registerHook('action', 'mas_v2_before_css_generation', [
            'description' => 'Triggered before CSS generation starts',
            'parameters' => ['settings' => 'array'],
            'example' => "add_action('mas_v2_before_css_generation', function(\$settings) { /* Prepare custom data */ });"
        ]);
        
        // === COMPONENT HOOKS ===
        
        /**
         * Filtr: Modyfikacja renderowanych komponentów
         * 
         * @param string $output HTML output komponentu
         * @param string $component_type Typ komponentu (button, metabox, notice, etc.)
         * @param array $args Argumenty komponentu
         * @return string Zmodyfikowany HTML
         */
        $this->registerHook('filter', 'mas_v2_component_output', [
            'description' => 'Modify component HTML output',
            'parameters' => ['output' => 'string', 'component_type' => 'string', 'args' => 'array'],
            'return' => 'string',
            'example' => "add_filter('mas_v2_component_output', function(\$output, \$type, \$args) { if(\$type === 'button') \$output = str_replace('button', 'button custom-class', \$output); return \$output; }, 10, 3);"
        ]);
        
        /**
         * Action: Po renderowaniu komponentu
         * 
         * @param string $component_type Typ komponentu
         * @param array $args Argumenty komponentu
         * @param string $output Wygenerowany HTML
         */
        $this->registerHook('action', 'mas_v2_after_component_render', [
            'description' => 'Triggered after component is rendered',
            'parameters' => ['component_type' => 'string', 'args' => 'array', 'output' => 'string'],
            'example' => "add_action('mas_v2_after_component_render', function(\$type, \$args, \$output) { /* Track component usage */ }, 10, 3);"
        ]);
        
        // === ADMIN PAGE HOOKS ===
        
        /**
         * Action: Dodanie niestandardowych zakładek
         * 
         * @param array $tabs Aktualne zakładki
         * @return array Zmodyfikowane zakładki
         */
        $this->registerHook('filter', 'mas_v2_admin_tabs', [
            'description' => 'Add custom admin tabs',
            'parameters' => ['tabs' => 'array'],
            'return' => 'array',
            'example' => "add_filter('mas_v2_admin_tabs', function(\$tabs) { \$tabs['custom'] = ['title' => 'Custom Tab', 'icon' => 'admin-generic']; return \$tabs; });"
        ]);
        
        /**
         * Action: Renderowanie niestandardowej zawartości zakładki
         * 
         * @param string $tab_id ID aktywnej zakładki
         * @param array $settings Aktualne ustawienia
         */
        $this->registerHook('action', 'mas_v2_render_tab_content', [
            'description' => 'Render custom tab content',
            'parameters' => ['tab_id' => 'string', 'settings' => 'array'],
            'example' => "add_action('mas_v2_render_tab_content', function(\$tab_id, \$settings) { if(\$tab_id === 'custom') echo '<div>Custom content</div>'; }, 10, 2);"
        ]);
        
        /**
         * Filtr: Modyfikacja pól ustawień
         * 
         * @param array $fields Pola ustawień
         * @param string $tab_id ID zakładki
         * @return array Zmodyfikowane pola
         */
        $this->registerHook('filter', 'mas_v2_settings_fields', [
            'description' => 'Modify settings fields',
            'parameters' => ['fields' => 'array', 'tab_id' => 'string'],
            'return' => 'array',
            'example' => "add_filter('mas_v2_settings_fields', function(\$fields, \$tab_id) { if(\$tab_id === 'general') \$fields['custom_field'] = ['type' => 'text', 'label' => 'Custom']; return \$fields; }, 10, 2);"
        ]);
        
        // === PERFORMANCE HOOKS ===
        
        /**
         * Action: Po wyczyszczeniu cache
         */
        $this->registerHook('action', 'mas_v2_cache_cleared', [
            'description' => 'Triggered after cache is cleared',
            'parameters' => [],
            'example' => "add_action('mas_v2_cache_cleared', function() { /* Clear custom caches */ });"
        ]);
        
        /**
         * Filtr: Modyfikacja strategii cache
         * 
         * @param array $cache_config Konfiguracja cache
         * @return array Zmodyfikowana konfiguracja
         */
        $this->registerHook('filter', 'mas_v2_cache_config', [
            'description' => 'Modify cache configuration',
            'parameters' => ['cache_config' => 'array'],
            'return' => 'array',
            'example' => "add_filter('mas_v2_cache_config', function(\$config) { \$config['ttl'] = 3600; return \$config; });"
        ]);
        
        // === SECURITY HOOKS ===
        
        /**
         * Filtr: Dodatkowa walidacja bezpieczeństwa
         * 
         * @param bool $is_valid Czy dane są bezpieczne
         * @param mixed $data Dane do walidacji
         * @param string $context Kontekst walidacji
         * @return bool Wynik walidacji
         */
        $this->registerHook('filter', 'mas_v2_security_validate', [
            'description' => 'Additional security validation',
            'parameters' => ['is_valid' => 'bool', 'data' => 'mixed', 'context' => 'string'],
            'return' => 'bool',
            'example' => "add_filter('mas_v2_security_validate', function(\$valid, \$data, \$context) { return \$valid && custom_security_check(\$data); }, 10, 3);"
        ]);
        
        // === INTEGRATION HOOKS ===
        
        /**
         * Action: Integracja z innymi pluginami
         * 
         * @param array $settings Aktualne ustawienia
         */
        $this->registerHook('action', 'mas_v2_plugin_integration', [
            'description' => 'Integration with other plugins',
            'parameters' => ['settings' => 'array'],
            'example' => "add_action('mas_v2_plugin_integration', function(\$settings) { /* Integrate with WooCommerce, etc. */ });"
        ]);
        
        /**
         * Filtr: Kompatybilność z themes
         * 
         * @param array $theme_compat Ustawienia kompatybilności
         * @param string $theme_name Nazwa aktywnego theme
         * @return array Zmodyfikowane ustawienia
         */
        $this->registerHook('filter', 'mas_v2_theme_compatibility', [
            'description' => 'Theme compatibility settings',
            'parameters' => ['theme_compat' => 'array', 'theme_name' => 'string'],
            'return' => 'array',
            'example' => "add_filter('mas_v2_theme_compatibility', function(\$compat, \$theme) { if(\$theme === 'twentytwentyfour') \$compat['custom_css'] = '.wp-block { margin: 0; }'; return \$compat; }, 10, 2);"
        ]);
    }
    
    /**
     * Rejestruje hook w systemie
     */
    private function registerHook($type, $name, $config) {
        $this->registered_hooks[$name] = [
            'type' => $type,
            'name' => $name,
            'description' => $config['description'],
            'parameters' => $config['parameters'] ?? [],
            'return' => $config['return'] ?? null,
            'example' => $config['example'] ?? '',
            'registered_at' => current_time('mysql'),
            'callbacks' => []
        ];
    }
    
    /**
     * Rejestruje późne hooks (po init)
     */
    public function registerLateHooks() {
        // Hooks które wymagają pełnej inicjalizacji WordPress
        
        /**
         * Action: Po pełnej inicjalizacji pluginu
         */
        do_action('mas_v2_plugin_loaded', $this->settings_manager->getSettings());
        
        /**
         * Filtr: Finalna modyfikacja ustawień
         */
        $settings = $this->settings_manager->getSettings();
        $filtered_settings = apply_filters('mas_v2_final_settings', $settings);
        
        if ($filtered_settings !== $settings) {
            // Zapisz zmodyfikowane ustawienia jeśli zostały zmienione
            $this->settings_manager->saveSettings($filtered_settings);
        }
    }
    
    /**
     * Wykonuje hook z logowaniem
     */
    public function executeHook($type, $name, ...$args) {
        if (!isset($this->registered_hooks[$name])) {
            error_log("MAS V2: Unregistered hook called: {$name}");
            return $type === 'filter' ? ($args[0] ?? null) : null;
        }
        
        $start_time = microtime(true);
        
        if ($type === 'action') {
            do_action($name, ...$args);
            $result = null;
        } else {
            $result = apply_filters($name, ...$args);
        }
        
        $execution_time = microtime(true) - $start_time;
        
        // Log hook execution dla debugging
        if (defined('WP_DEBUG') && WP_DEBUG) {
            error_log("MAS V2 Hook: {$name} executed in " . round($execution_time * 1000, 2) . "ms");
        }
        
        // Zapisz statystyki
        $this->logHookExecution($name, $execution_time);
        
        return $result;
    }
    
    /**
     * Loguje wykonanie hook dla statystyk
     */
    private function logHookExecution($hook_name, $execution_time) {
        $stats = get_transient('mas_v2_hook_stats') ?: [];
        
        if (!isset($stats[$hook_name])) {
            $stats[$hook_name] = [
                'count' => 0,
                'total_time' => 0,
                'avg_time' => 0,
                'last_executed' => null
            ];
        }
        
        $stats[$hook_name]['count']++;
        $stats[$hook_name]['total_time'] += $execution_time;
        $stats[$hook_name]['avg_time'] = $stats[$hook_name]['total_time'] / $stats[$hook_name]['count'];
        $stats[$hook_name]['last_executed'] = current_time('mysql');
        
        set_transient('mas_v2_hook_stats', $stats, HOUR_IN_SECONDS);
    }
    
    /**
     * Zwraca listę zarejestrowanych hooks
     */
    public function getRegisteredHooks() {
        return $this->registered_hooks;
    }
    
    /**
     * Zwraca statystyki wykonania hooks
     */
    public function getHookStats() {
        return get_transient('mas_v2_hook_stats') ?: [];
    }
    
    /**
     * Sprawdza czy hook ma zarejestrowane callbacks
     */
    public function hasCallbacks($hook_name) {
        global $wp_filter;
        return isset($wp_filter[$hook_name]) && !empty($wp_filter[$hook_name]->callbacks);
    }
    
    /**
     * Zwraca informacje o callbacks dla hook
     */
    public function getHookCallbacks($hook_name) {
        global $wp_filter;
        
        if (!isset($wp_filter[$hook_name])) {
            return [];
        }
        
        $callbacks = [];
        foreach ($wp_filter[$hook_name]->callbacks as $priority => $functions) {
            foreach ($functions as $function) {
                $callbacks[] = [
                    'priority' => $priority,
                    'function' => $this->formatCallbackName($function['function']),
                    'accepted_args' => $function['accepted_args']
                ];
            }
        }
        
        return $callbacks;
    }
    
    /**
     * Formatuje nazwę callback dla czytelności
     */
    private function formatCallbackName($callback) {
        if (is_string($callback)) {
            return $callback;
        }
        
        if (is_array($callback)) {
            if (is_object($callback[0])) {
                return get_class($callback[0]) . '::' . $callback[1];
            }
            return $callback[0] . '::' . $callback[1];
        }
        
        if ($callback instanceof \Closure) {
            return 'Closure';
        }
        
        return 'Unknown';
    }
    
    /**
     * Rejestruje dokumentację hooks przez REST API
     */
    public function registerHooksDocumentationEndpoint() {
        register_rest_route('mas-v2/v1', '/hooks', [
            'methods' => 'GET',
            'callback' => [$this, 'getHooksDocumentation'],
            'permission_callback' => function() {
                return current_user_can('manage_options');
            }
        ]);
        
        register_rest_route('mas-v2/v1', '/hooks/stats', [
            'methods' => 'GET',
            'callback' => [$this, 'getHooksStats'],
            'permission_callback' => function() {
                return current_user_can('manage_options');
            }
        ]);
    }
    
    /**
     * REST endpoint: Dokumentacja hooks
     */
    public function getHooksDocumentation($request) {
        $hooks = $this->getRegisteredHooks();
        $documentation = [];
        
        foreach ($hooks as $name => $config) {
            $documentation[$name] = [
                'name' => $name,
                'type' => $config['type'],
                'description' => $config['description'],
                'parameters' => $config['parameters'],
                'return' => $config['return'],
                'example' => $config['example'],
                'has_callbacks' => $this->hasCallbacks($name),
                'callbacks' => $this->getHookCallbacks($name)
            ];
        }
        
        return rest_ensure_response([
            'success' => true,
            'data' => [
                'hooks' => $documentation,
                'total_hooks' => count($documentation),
                'active_hooks' => count(array_filter($documentation, function($hook) {
                    return $hook['has_callbacks'];
                }))
            ]
        ]);
    }
    
    /**
     * REST endpoint: Statystyki hooks
     */
    public function getHooksStats($request) {
        $stats = $this->getHookStats();
        
        return rest_ensure_response([
            'success' => true,
            'data' => [
                'stats' => $stats,
                'summary' => [
                    'total_executions' => array_sum(array_column($stats, 'count')),
                    'total_time' => array_sum(array_column($stats, 'total_time')),
                    'most_used' => !empty($stats) ? array_keys($stats, max($stats))[0] : null,
                    'slowest' => !empty($stats) ? array_keys(array_column($stats, 'avg_time'), max(array_column($stats, 'avg_time')))[0] : null
                ]
            ]
        ]);
    }
    
    /**
     * Czyści statystyki hooks
     */
    public function clearHookStats() {
        delete_transient('mas_v2_hook_stats');
    }
    
    /**
     * Eksportuje konfigurację hooks do JSON
     */
    public function exportHooksConfig() {
        $config = [
            'version' => '3.0.0',
            'generated' => current_time('c'),
            'hooks' => $this->getRegisteredHooks(),
            'stats' => $this->getHookStats()
        ];
        
        return json_encode($config, JSON_PRETTY_PRINT);
    }
} 