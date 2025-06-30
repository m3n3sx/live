<?php
/**
 * Settings API Integration Service
 * 
 * Faza 1: Integracja z WordPress Settings API
 * Obsługuje opcje funkcjonalne (nie wizualne) przez natywne API WordPress
 * 
 * @package ModernAdminStyler\Services
 * @version 2.2.0
 */

namespace ModernAdminStyler\Services;

class SettingsAPI {
    
    private $settings_manager;
    private $option_group = 'mas_v2_functional_settings';
    private $option_name = 'mas_v2_functional_settings';
    
    public function __construct($settings_manager) {
        $this->settings_manager = $settings_manager;
        $this->init();
    }
    
    /**
     * Inicjalizacja Settings API
     */
    public function init() {
        add_action('admin_init', [$this, 'registerSettings']);
        add_action('admin_menu', [$this, 'addSettingsPage']);
    }
    
    /**
     * Rejestracja ustawień przez Settings API
     */
    public function registerSettings() {
        
        // Główna rejestracja ustawień
        register_setting(
            $this->option_group,
            $this->option_name,
            [
                'sanitize_callback' => [$this, 'sanitizeSettings'],
                'default' => $this->getDefaultSettings()
            ]
        );
        
        // === SEKCJA 1: PODSTAWOWE FUNKCJE ===
        add_settings_section(
            'mas_v2_basic_functions',
            '⚙️ Podstawowe Funkcje',
            [$this, 'renderBasicFunctionsDescription'],
            'mas-v2-functional-settings'
        );
        
        // Enable Plugin
        add_settings_field(
            'enable_plugin',
            '🟢 Włącz wtyczkę',
            [$this, 'renderCheckboxField'],
            'mas-v2-functional-settings',
            'mas_v2_basic_functions',
            [
                'field_id' => 'enable_plugin',
                'description' => 'Główny przełącznik włączający/wyłączający wtyczkę'
            ]
        );
        
        // === SEKCJA 2: OPTYMALIZACJA ===
        add_settings_section(
            'mas_v2_optimization',
            '🚀 Optymalizacja',
            [$this, 'renderOptimizationDescription'],
            'mas-v2-functional-settings'
        );
        
        // Disable Emojis
        add_settings_field(
            'disable_emojis',
            '😀 Wyłącz Emoji',
            [$this, 'renderCheckboxField'],
            'mas-v2-functional-settings',
            'mas_v2_optimization',
            [
                'field_id' => 'disable_emojis',
                'description' => 'Usuwa skrypty emoji, przyspiesza ładowanie'
            ]
        );
        
        // Disable Embeds
        add_settings_field(
            'disable_embeds',
            '📺 Wyłącz Embeds',
            [$this, 'renderCheckboxField'],
            'mas-v2-functional-settings',
            'mas_v2_optimization',
            [
                'field_id' => 'disable_embeds',
                'description' => 'Wyłącza automatyczne osadzanie treści zewnętrznych'
            ]
        );
        
        // Disable jQuery Migrate
        add_settings_field(
            'disable_jquery_migrate',
            '⚡ Wyłącz jQuery Migrate',
            [$this, 'renderCheckboxField'],
            'mas-v2-functional-settings',
            'mas_v2_optimization',
            [
                'field_id' => 'disable_jquery_migrate',
                'description' => 'Usuwa przestarzały jQuery Migrate, przyspiesza stronę'
            ]
        );
        
        // === SEKCJA 3: UKRYWANIE ELEMENTÓW ===
        add_settings_section(
            'mas_v2_hide_elements',
            '👁️ Ukrywanie Elementów',
            [$this, 'renderHideElementsDescription'],
            'mas-v2-functional-settings'
        );
        
        // Hide WP Version
        add_settings_field(
            'hide_wp_version',
            '🔒 Ukryj wersję WP',
            [$this, 'renderCheckboxField'],
            'mas-v2-functional-settings',
            'mas_v2_hide_elements',
            [
                'field_id' => 'hide_wp_version',
                'description' => 'Ukrywa wersję WordPress ze względów bezpieczeństwa'
            ]
        );
        
        // Hide Admin Notices
        add_settings_field(
            'hide_admin_notices',
            '🔕 Ukryj powiadomienia admina',
            [$this, 'renderCheckboxField'],
            'mas-v2-functional-settings',
            'mas_v2_hide_elements',
            [
                'field_id' => 'hide_admin_notices',
                'description' => 'Ukrywa irytujące powiadomienia wtyczek'
            ]
        );
        
        // Hide Help Tab
        add_settings_field(
            'hide_help_tab',
            '❓ Ukryj zakładkę Pomoc',
            [$this, 'renderCheckboxField'],
            'mas-v2-functional-settings',
            'mas_v2_hide_elements',
            [
                'field_id' => 'hide_help_tab',
                'description' => 'Usuwa zakładkę "Pomoc" z górnego paska'
            ]
        );
        
        // Hide Screen Options
        add_settings_field(
            'hide_screen_options',
            '📋 Ukryj opcje ekranu',
            [$this, 'renderCheckboxField'],
            'mas-v2-functional-settings',
            'mas_v2_hide_elements',
            [
                'field_id' => 'hide_screen_options',
                'description' => 'Usuwa przycisk "Opcje ekranu"'
            ]
        );
        
        // === SEKCJA 4: IMPORT/EXPORT ===
        add_settings_section(
            'mas_v2_import_export',
            '📦 Import/Export',
            [$this, 'renderImportExportDescription'],
            'mas-v2-functional-settings'
        );
        
        // Import/Export będzie obsługiwane przez AJAX, więc tylko informacyjne pole
        add_settings_field(
            'import_export_info',
            '📁 Zarządzanie ustawieniami',
            [$this, 'renderImportExportField'],
            'mas-v2-functional-settings',
            'mas_v2_import_export'
        );
        
        // === SEKCJA 5: CUSTOM CODE ===
        add_settings_section(
            'mas_v2_custom_code',
            '💻 Własny Kod',
            [$this, 'renderCustomCodeDescription'],
            'mas-v2-functional-settings'
        );
        
        // Custom CSS
        add_settings_field(
            'custom_css',
            '🎨 Własny CSS',
            [$this, 'renderTextareaField'],
            'mas-v2-functional-settings',
            'mas_v2_custom_code',
            [
                'field_id' => 'custom_css',
                'description' => 'Dodatkowy CSS aplikowany globalnie',
                'rows' => 10
            ]
        );
        
        // Custom JS
        add_settings_field(
            'custom_js',
            '⚡ Własny JavaScript',
            [$this, 'renderTextareaField'],
            'mas-v2-functional-settings',
            'mas_v2_custom_code',
            [
                'field_id' => 'custom_js',
                'description' => 'Dodatkowy JavaScript wykonywany w panelu admina',
                'rows' => 10
            ]
        );
    }
    
    /**
     * Dodanie strony ustawień do menu
     */
    public function addSettingsPage() {
        add_submenu_page(
            'mas-v2-settings',
            '⚙️ Ustawienia Funkcjonalne',
            '⚙️ Funkcjonalne',
            'manage_options',
            'mas-v2-functional',
            [$this, 'renderSettingsPage']
        );
    }
    
    /**
     * Renderowanie strony ustawień
     */
    public function renderSettingsPage() {
        ?>
        <div class="wrap">
            <h1>⚙️ Modern Admin Styler V2 - Ustawienia Funkcjonalne</h1>
            <p class="description">
                🎯 <strong>Filozofia "WordPress Way":</strong> Te ustawienia używają natywnego WordPress Settings API 
                dla maksymalnej kompatybilności i bezpieczeństwa. Opcje wizualne znajdziesz w 
                <a href="<?php echo admin_url('customize.php?autofocus[panel]=mas_v2_panel&url=' . urlencode(admin_url('index.php'))); ?>">WordPress Customizer</a> (podgląd na żywo).
            </p>
            
            <form method="post" action="options.php">
                <?php
                settings_fields($this->option_group);
                do_settings_sections('mas-v2-functional-settings');
                submit_button('💾 Zapisz ustawienia funkcjonalne');
                ?>
            </form>
            
            <div class="mas-v2-info-box" style="background: #f0f6ff; border-left: 4px solid #3b82f6; padding: 15px; margin-top: 20px;">
                <h3>🚀 Strategia Integracji</h3>
                <p><strong>Opcje wizualne</strong> → <a href="<?php echo admin_url('customize.php?autofocus[panel]=mas_v2_panel&url=' . urlencode(admin_url('index.php'))); ?>">WordPress Customizer</a> (podgląd na żywo)</p>
                <p><strong>Opcje funkcjonalne</strong> → Ta strona (WordPress Settings API)</p>
                <p><strong>Narzędzia diagnostyczne</strong> → REST API endpoints</p>
            </div>
        </div>
        <?php
    }
    
    /**
     * Opisy sekcji
     */
    public function renderBasicFunctionsDescription() {
        echo '<p>Podstawowe funkcje wtyczki i główne przełączniki.</p>';
    }
    
    public function renderOptimizationDescription() {
        echo '<p>Opcje optymalizacji wydajności WordPress - usuń zbędne skrypty i funkcje.</p>';
    }
    
    public function renderHideElementsDescription() {
        echo '<p>Ukryj niepotrzebne elementy interfejsu dla czystszego panelu administracyjnego.</p>';
    }
    
    public function renderImportExportDescription() {
        echo '<p>Zarządzanie konfiguracją wtyczki - import i export ustawień.</p>';
    }
    
    public function renderCustomCodeDescription() {
        echo '<p>Dodaj własny CSS i JavaScript do panelu administracyjnego.</p>';
    }
    
    /**
     * Renderowanie pól formularza
     */
    public function renderCheckboxField($args) {
        $options = get_option($this->option_name, []);
        $field_id = $args['field_id'];
        $value = $options[$field_id] ?? false;
        $description = $args['description'] ?? '';
        
        echo '<label>';
        echo '<input type="checkbox" name="' . $this->option_name . '[' . $field_id . ']" value="1" ' . checked($value, true, false) . ' />';
        echo ' ' . $description;
        echo '</label>';
    }
    
    public function renderTextareaField($args) {
        $options = get_option($this->option_name, []);
        $field_id = $args['field_id'];
        $value = $options[$field_id] ?? '';
        $description = $args['description'] ?? '';
        $rows = $args['rows'] ?? 5;
        
        echo '<textarea name="' . $this->option_name . '[' . $field_id . ']" rows="' . $rows . '" cols="70" class="large-text code">';
        echo esc_textarea($value);
        echo '</textarea>';
        
        if ($description) {
            echo '<p class="description">' . $description . '</p>';
        }
    }
    
    public function renderImportExportField() {
        ?>
        <div class="mas-v2-import-export-controls">
            <p class="description">Użyj przycisków poniżej do zarządzania konfiguracją:</p>
            
            <p>
                <button type="button" class="button" id="mas-v2-export-functional">
                    📤 Eksportuj ustawienia funkcjonalne
                </button>
                <button type="button" class="button" id="mas-v2-import-functional">
                    📥 Importuj ustawienia funkcjonalne
                </button>
            </p>
            
            <input type="file" id="mas-v2-import-file" accept=".json" style="display: none;">
        </div>
        
        <script>
        document.addEventListener('DOMContentLoaded', function() {
            // Export functionality
            document.getElementById('mas-v2-export-functional').addEventListener('click', function() {
                const settings = <?php echo json_encode(get_option($this->option_name, [])); ?>;
                const blob = new Blob([JSON.stringify(settings, null, 2)], {type: 'application/json'});
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'mas-v2-functional-settings-' + new Date().toISOString().split('T')[0] + '.json';
                a.click();
                URL.revokeObjectURL(url);
            });
            
            // Import functionality
            document.getElementById('mas-v2-import-functional').addEventListener('click', function() {
                document.getElementById('mas-v2-import-file').click();
            });
            
            document.getElementById('mas-v2-import-file').addEventListener('change', function(e) {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        try {
                            const settings = JSON.parse(e.target.result);
                            // Wyślij przez AJAX do zapisania
                            fetch(ajaxurl, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/x-www-form-urlencoded',
                                },
                                body: new URLSearchParams({
                                    action: 'mas_v2_import_functional_settings',
                                    settings: JSON.stringify(settings),
                                    nonce: '<?php echo wp_create_nonce('mas_v2_import_functional'); ?>'
                                })
                            })
                            .then(response => response.json())
                            .then(data => {
                                if (data.success) {
                                    alert('✅ Ustawienia zostały zaimportowane pomyślnie!');
                                    location.reload();
                                } else {
                                    alert('❌ Błąd importu: ' + (data.data || 'Nieznany błąd'));
                                }
                            });
                        } catch (error) {
                            alert('❌ Nieprawidłowy format pliku JSON');
                        }
                    };
                    reader.readAsText(file);
                }
            });
        });
        </script>
        <?php
    }
    
    /**
     * Sanityzacja ustawień
     */
    public function sanitizeSettings($input) {
        $sanitized = [];
        
        // Boolean fields
        $boolean_fields = [
            'enable_plugin', 'disable_emojis', 'disable_embeds', 'disable_jquery_migrate',
            'hide_wp_version', 'hide_admin_notices', 'hide_help_tab', 'hide_screen_options'
        ];
        
        foreach ($boolean_fields as $field) {
            $sanitized[$field] = !empty($input[$field]);
        }
        
        // Text fields
        if (isset($input['custom_css'])) {
            $sanitized['custom_css'] = wp_strip_all_tags($input['custom_css']);
        }
        
        if (isset($input['custom_js'])) {
            $sanitized['custom_js'] = wp_strip_all_tags($input['custom_js']);
        }
        
        return $sanitized;
    }
    
    /**
     * Domyślne ustawienia funkcjonalne - WSZYSTKO WYŁĄCZONE
     */
    private function getDefaultSettings() {
        return [
            'enable_plugin' => false,  // 🔒 WYŁĄCZONE DOMYŚLNIE
            'disable_emojis' => false,
            'disable_embeds' => false,
            'disable_jquery_migrate' => false,
            'hide_wp_version' => false,
            'hide_admin_notices' => false,
            'hide_help_tab' => false,
            'hide_screen_options' => false,
            'custom_css' => '',
            'custom_js' => ''
        ];
    }
    
    /**
     * Pobierz ustawienia funkcjonalne
     */
    public function getSettings() {
        return get_option($this->option_name, $this->getDefaultSettings());
    }
} 