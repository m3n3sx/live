<?php
/**
 * Customizer Integration Service
 * 
 * Faza 1: Głęboka integracja z WordPress Customizer API
 * Przenosi opcje wizualne do natywnego Customizera WordPress
 * 
 * @package ModernAdminStyler\Services
 * @version 2.2.0
 */

namespace ModernAdminStyler\Services;

class CustomizerIntegration {
    
    private $settings_manager;
    
    public function __construct($settings_manager) {
        $this->settings_manager = $settings_manager;
        $this->init();
    }
    
    /**
     * Inicjalizacja integracji z Customizer
     */
    public function init() {
        add_action('customize_register', [$this, 'registerCustomizerControls']);
        add_action('customize_preview_init', [$this, 'enqueueCustomizerPreview']);
        add_action('wp_head', [$this, 'outputCustomizerStyles']);
        add_action('admin_head', [$this, 'outputCustomizerStyles']);
        
        // 🎯 NOWE PODEJŚCIE: JavaScript w kontrolach Customizera
        add_action('customize_controls_enqueue_scripts', [$this, 'enqueueCustomizerControlScript']);
        
        // 🎯 KLUCZOWE: Ustaw domyślny URL podglądu na panel admina
        add_filter('customize_previewable_devices', [$this, 'setCustomPreviewDevices']);
        add_action('customize_controls_init', [$this, 'setDefaultPreviewUrl']);
        add_action('customize_controls_print_scripts', [$this, 'forceAdminPreviewUrl']);
        
        // Dodaj obsługę przełączania URL podglądu - dla obu kontekstów
        add_action('wp_footer', [$this, 'addPreviewUrlSwitcher']);
        add_action('admin_footer', [$this, 'addPreviewUrlSwitcher']);
    }
    
    /**
     * Rejestracja paneli, sekcji i kontrolek w Customizer
     */
    public function registerCustomizerControls($wp_customize) {
        
        // 🎯 PANEL GŁÓWNY: Modern Admin Styler
        $wp_customize->add_panel('mas_v2_panel', [
            'title' => '🚀 Modern Admin Styler V2',
            'description' => __('Kompletna personalizacja panelu WordPress - opcje wizualne z podglądem na żywo', 'modern-admin-styler-v2'),
            'priority' => 30,
            'capability' => 'manage_options'
        ]);
        
        // === SEKCJA 1: WYGLĄD OGÓLNY ===
        $this->registerGeneralAppearanceSection($wp_customize);
        
        // === SEKCJA 2: PASEK ADMINA ===
        $this->registerAdminBarSection($wp_customize);
        
        // === SEKCJA 3: MENU BOCZNE ===
        $this->registerSideMenuSection($wp_customize);
        
        // === SEKCJA 4: TYPOGRAFIA ===
        $this->registerTypographySection($wp_customize);
        
        // === SEKCJA 5: KOLORY I MOTYWY ===
        $this->registerColorsSection($wp_customize);
    }
    
    /**
     * Sekcja: Wygląd Ogólny
     */
    private function registerGeneralAppearanceSection($wp_customize) {
        
        $wp_customize->add_section('mas_v2_general', [
            'title' => '🌐 Wygląd Ogólny',
            'description' => 'Podstawowe ustawienia wyglądu panelu administracyjnego',
            'panel' => 'mas_v2_panel',
            'priority' => 10
        ]);
        
        // Color Scheme
        $wp_customize->add_setting('mas_v2_settings[color_scheme]', [
            'default' => 'auto',
            'type' => 'option',
            'capability' => 'manage_options',
            'transport' => 'postMessage',
            'sanitize_callback' => [$this, 'sanitizeSelect']
        ]);
        
        $wp_customize->add_control('mas_v2_color_scheme', [
            'label' => '🎨 Schemat kolorów',
            'description' => 'Wybierz tryb kolorów dla panelu',
            'section' => 'mas_v2_general',
            'settings' => 'mas_v2_settings[color_scheme]',
            'type' => 'select',
            'choices' => [
                'light' => '💡 Jasny',
                'dark' => '🌙 Ciemny', 
                'auto' => '🤖 Automatyczny (system)'
            ]
        ]);
        
        // Color Palette
        $wp_customize->add_setting('mas_v2_settings[color_palette]', [
            'default' => 'modern',
            'type' => 'option',
            'capability' => 'manage_options',
            'transport' => 'postMessage',
            'sanitize_callback' => [$this, 'sanitizeSelect']
        ]);
        
        $wp_customize->add_control('mas_v2_color_palette', [
            'label' => '🎨 Paleta motywu',
            'description' => 'Wybierz główną paletę kolorów',
            'section' => 'mas_v2_general',
            'settings' => 'mas_v2_settings[color_palette]',
            'type' => 'select',
            'choices' => [
                'modern' => '🌌 Modern - Fioletowo-niebieski',
                'white' => '🤍 White Minimal - Jasny minimalistyczny',
                'green' => '🌿 Soothing Green - Kojący zielony'
            ]
        ]);
        
        // Glassmorphism Effect
        $wp_customize->add_setting('mas_v2_settings[glassmorphism_enabled]', [
            'default' => true,
            'type' => 'option',
            'capability' => 'manage_options',
            'transport' => 'postMessage',
            'sanitize_callback' => 'rest_sanitize_boolean'
        ]);
        
        $wp_customize->add_control('mas_v2_glassmorphism', [
            'label' => '✨ Efekt Glassmorphism',
            'description' => 'Włącz przezroczyste, szklane efekty',
            'section' => 'mas_v2_general',
            'settings' => 'mas_v2_settings[glassmorphism_enabled]',
            'type' => 'checkbox'
        ]);
        
        // Animations
        $wp_customize->add_setting('mas_v2_settings[animations_enabled]', [
            'default' => true,
            'type' => 'option',
            'capability' => 'manage_options',
            'transport' => 'postMessage',
            'sanitize_callback' => 'rest_sanitize_boolean'
        ]);
        
        $wp_customize->add_control('mas_v2_animations', [
            'label' => '🎬 Animacje',
            'description' => 'Włącz płynne animacje interfejsu',
            'section' => 'mas_v2_general',
            'settings' => 'mas_v2_settings[animations_enabled]',
            'type' => 'checkbox'
        ]);
    }
    
    /**
     * Sekcja: Pasek Admina
     */
    private function registerAdminBarSection($wp_customize) {
        
        $wp_customize->add_section('mas_v2_admin_bar', [
            'title' => '📊 Pasek Admina',
            'description' => 'Personalizacja górnego paska administracyjnego',
            'panel' => 'mas_v2_panel',
            'priority' => 20
        ]);
        
        // Admin Bar Height
        $wp_customize->add_setting('mas_v2_settings[admin_bar_height]', [
            'default' => 32,
            'type' => 'option',
            'capability' => 'manage_options',
            'transport' => 'postMessage',
            'sanitize_callback' => 'absint'
        ]);
        
        $wp_customize->add_control('mas_v2_admin_bar_height', [
            'label' => '📏 Wysokość paska (px)',
            'description' => 'Ustaw wysokość górnego paska administracyjnego',
            'section' => 'mas_v2_admin_bar',
            'settings' => 'mas_v2_settings[admin_bar_height]',
            'type' => 'range',
            'input_attrs' => [
                'min' => 24,
                'max' => 80,
                'step' => 2
            ]
        ]);
        
        // Admin Bar Floating
        $wp_customize->add_setting('mas_v2_settings[admin_bar_floating]', [
            'default' => false,
            'type' => 'option',
            'capability' => 'manage_options',
            'transport' => 'postMessage',
            'sanitize_callback' => 'rest_sanitize_boolean'
        ]);
        
        $wp_customize->add_control('mas_v2_admin_bar_floating', [
            'label' => '🎯 Pływający pasek',
            'description' => 'Pasek oddzielony od górnej krawędzi',
            'section' => 'mas_v2_admin_bar',
            'settings' => 'mas_v2_settings[admin_bar_floating]',
            'type' => 'checkbox'
        ]);
        
        // Admin Bar Background Color
        $wp_customize->add_setting('mas_v2_settings[admin_bar_bg_color]', [
            'default' => '#23282d',
            'type' => 'option',
            'capability' => 'manage_options',
            'transport' => 'postMessage',
            'sanitize_callback' => 'sanitize_hex_color'
        ]);
        
        $wp_customize->add_control(new \WP_Customize_Color_Control($wp_customize, 'mas_v2_admin_bar_bg', [
            'label' => '🎨 Kolor tła',
            'section' => 'mas_v2_admin_bar',
            'settings' => 'mas_v2_settings[admin_bar_bg_color]'
        ]));
        
        // Admin Bar Text Color
        $wp_customize->add_setting('mas_v2_settings[admin_bar_text_color]', [
            'default' => '#ffffff',
            'type' => 'option',
            'capability' => 'manage_options',
            'transport' => 'postMessage',
            'sanitize_callback' => 'sanitize_hex_color'
        ]);
        
        $wp_customize->add_control(new \WP_Customize_Color_Control($wp_customize, 'mas_v2_admin_bar_text', [
            'label' => '📝 Kolor tekstu',
            'section' => 'mas_v2_admin_bar',
            'settings' => 'mas_v2_settings[admin_bar_text_color]'
        ]));
    }
    
    /**
     * Sekcja: Menu Boczne
     */
    private function registerSideMenuSection($wp_customize) {
        
        $wp_customize->add_section('mas_v2_side_menu', [
            'title' => '📋 Menu Boczne',
            'description' => 'Personalizacja lewego menu nawigacyjnego',
            'panel' => 'mas_v2_panel',
            'priority' => 30
        ]);
        
        // Menu Width
        $wp_customize->add_setting('mas_v2_settings[menu_width]', [
            'default' => 160,
            'type' => 'option',
            'capability' => 'manage_options',
            'transport' => 'postMessage',
            'sanitize_callback' => 'absint'
        ]);
        
        $wp_customize->add_control('mas_v2_menu_width', [
            'label' => '📏 Szerokość menu (px)',
            'description' => 'Ustaw szerokość bocznego menu',
            'section' => 'mas_v2_side_menu',
            'settings' => 'mas_v2_settings[menu_width]',
            'type' => 'range',
            'input_attrs' => [
                'min' => 120,
                'max' => 300,
                'step' => 10
            ]
        ]);
        
        // Menu Floating
        $wp_customize->add_setting('mas_v2_settings[menu_floating]', [
            'default' => false,
            'type' => 'option',
            'capability' => 'manage_options',
            'transport' => 'postMessage',
            'sanitize_callback' => 'rest_sanitize_boolean'
        ]);
        
        $wp_customize->add_control('mas_v2_menu_floating', [
            'label' => '🎯 Pływające menu',
            'description' => 'Menu oddzielone od lewej krawędzi',
            'section' => 'mas_v2_side_menu',
            'settings' => 'mas_v2_settings[menu_floating]',
            'type' => 'checkbox'
        ]);
        
        // Menu Background Color
        $wp_customize->add_setting('mas_v2_settings[menu_bg_color]', [
            'default' => '#23282d',
            'type' => 'option',
            'capability' => 'manage_options',
            'transport' => 'postMessage',
            'sanitize_callback' => 'sanitize_hex_color'
        ]);
        
        $wp_customize->add_control(new \WP_Customize_Color_Control($wp_customize, 'mas_v2_menu_bg', [
            'label' => '🎨 Kolor tła menu',
            'section' => 'mas_v2_side_menu',
            'settings' => 'mas_v2_settings[menu_bg_color]'
        ]));
    }
    
    /**
     * Sekcja: Typografia
     */
    private function registerTypographySection($wp_customize) {
        
        $wp_customize->add_section('mas_v2_typography', [
            'title' => '🔤 Typografia',
            'description' => 'Ustawienia czcionek i tekstu',
            'panel' => 'mas_v2_panel',
            'priority' => 40
        ]);
        
        // Body Font
        $wp_customize->add_setting('mas_v2_settings[body_font]', [
            'default' => 'Inter',
            'type' => 'option',
            'capability' => 'manage_options',
            'transport' => 'postMessage',
            'sanitize_callback' => [$this, 'sanitizeSelect']
        ]);
        
        $wp_customize->add_control('mas_v2_body_font', [
            'label' => '📝 Czcionka podstawowa',
            'description' => 'Czcionka dla tekstu interfejsu',
            'section' => 'mas_v2_typography',
            'settings' => 'mas_v2_settings[body_font]',
            'type' => 'select',
            'choices' => [
                'Inter' => 'Inter (nowoczesna)',
                'Roboto' => 'Roboto (Google)',
                'Open Sans' => 'Open Sans (klasyczna)',
                'Lato' => 'Lato (elegancka)',
                'Source Sans Pro' => 'Source Sans Pro (czytelna)'
            ]
        ]);
        
        // Headings Font
        $wp_customize->add_setting('mas_v2_settings[headings_font]', [
            'default' => 'Inter',
            'type' => 'option',
            'capability' => 'manage_options',
            'transport' => 'postMessage',
            'sanitize_callback' => [$this, 'sanitizeSelect']
        ]);
        
        $wp_customize->add_control('mas_v2_headings_font', [
            'label' => '📰 Czcionka nagłówków',
            'description' => 'Czcionka dla tytułów i nagłówków',
            'section' => 'mas_v2_typography',
            'settings' => 'mas_v2_settings[headings_font]',
            'type' => 'select',
            'choices' => [
                'Inter' => 'Inter (nowoczesna)',
                'Roboto' => 'Roboto (Google)',
                'Montserrat' => 'Montserrat (wyrazista)',
                'Poppins' => 'Poppins (zaokrąglona)',
                'Playfair Display' => 'Playfair Display (elegancka)'
            ]
        ]);
        
        // Font Size Scale
        $wp_customize->add_setting('mas_v2_settings[font_size_scale]', [
            'default' => 1.0,
            'type' => 'option',
            'capability' => 'manage_options',
            'transport' => 'postMessage',
            'sanitize_callback' => [$this, 'sanitizeFloat']
        ]);
        
        $wp_customize->add_control('mas_v2_font_scale', [
            'label' => '📏 Skala czcionek',
            'description' => 'Proporcjonalne skalowanie wszystkich rozmiarów',
            'section' => 'mas_v2_typography',
            'settings' => 'mas_v2_settings[font_size_scale]',
            'type' => 'range',
            'input_attrs' => [
                'min' => 0.8,
                'max' => 1.4,
                'step' => 0.1
            ]
        ]);
    }
    
    /**
     * Sekcja: Kolory i Motywy
     */
    private function registerColorsSection($wp_customize) {
        
        $wp_customize->add_section('mas_v2_colors', [
            'title' => '🎨 Kolory i Motywy',
            'description' => 'Zaawansowane ustawienia kolorów',
            'panel' => 'mas_v2_panel',
            'priority' => 50
        ]);
        
        // Primary Color
        $wp_customize->add_setting('mas_v2_settings[primary_color]', [
            'default' => '#6366f1',
            'type' => 'option',
            'capability' => 'manage_options',
            'transport' => 'postMessage',
            'sanitize_callback' => 'sanitize_hex_color'
        ]);
        
        $wp_customize->add_control(new \WP_Customize_Color_Control($wp_customize, 'mas_v2_primary_color', [
            'label' => '🎯 Kolor główny',
            'description' => 'Podstawowy kolor akcentu',
            'section' => 'mas_v2_colors',
            'settings' => 'mas_v2_settings[primary_color]'
        ]));
        
        // Secondary Color
        $wp_customize->add_setting('mas_v2_settings[secondary_color]', [
            'default' => '#8b5cf6',
            'type' => 'option',
            'capability' => 'manage_options',
            'transport' => 'postMessage',
            'sanitize_callback' => 'sanitize_hex_color'
        ]);
        
        $wp_customize->add_control(new \WP_Customize_Color_Control($wp_customize, 'mas_v2_secondary_color', [
            'label' => '🎨 Kolor drugorzędny',
            'description' => 'Kolor dla elementów pomocniczych',
            'section' => 'mas_v2_colors',
            'settings' => 'mas_v2_settings[secondary_color]'
        ]));
    }
    
    /**
     * Enqueue scripts dla preview w Customizer
     */
    public function enqueueCustomizerPreview() {
        // ✅ Ładuj główny CSS wtyczki w podglądzie Customizera
        wp_enqueue_style(
            'mas-v2-main-css',
            MAS_V2_PLUGIN_URL . 'assets/css/mas-v2-main.css',
            [],
            MAS_V2_VERSION
        );
        
        // ✅ Ładuj utilities CSS
        wp_enqueue_style(
            'mas-v2-utilities',
            MAS_V2_PLUGIN_URL . 'assets/css/mas-utilities.css',
            [],
            MAS_V2_VERSION
        );
        
        // ✅ Ładuj JavaScript dla live preview
        wp_enqueue_script(
            'mas-v2-customizer-preview',
            MAS_V2_PLUGIN_URL . 'assets/js/customizer-preview.js',
            ['customize-preview'],
            MAS_V2_VERSION,
            true
        );
    }
    
    /**
     * Output stylów z Customizer
     */
    public function outputCustomizerStyles() {
        $settings = get_option('mas_v2_settings', []);
        
        if (empty($settings)) {
            return;
        }
        
        echo '<style id="mas-v2-customizer-styles">';
        echo $this->generateCustomizerCSS($settings);
        echo '</style>';
    }
    
    /**
     * Generowanie CSS z ustawień Customizer
     */
    private function generateCustomizerCSS($settings) {
        $css = '';
        
        // Admin Bar Styles
        if (!empty($settings['admin_bar_height'])) {
            $css .= "#wpadminbar { height: {$settings['admin_bar_height']}px !important; }";
            $css .= "html.wp-toolbar { padding-top: {$settings['admin_bar_height']}px !important; }";
        }
        
        if (!empty($settings['admin_bar_bg_color'])) {
            $css .= "#wpadminbar { background: {$settings['admin_bar_bg_color']} !important; }";
        }
        
        if (!empty($settings['admin_bar_text_color'])) {
            $css .= "#wpadminbar * { color: {$settings['admin_bar_text_color']} !important; }";
        }
        
        // Menu Styles
        if (!empty($settings['menu_width'])) {
            $css .= "#adminmenumain { width: {$settings['menu_width']}px !important; }";
            $css .= "#wpcontent, #wpfooter { margin-left: {$settings['menu_width']}px !important; }";
        }
        
        if (!empty($settings['menu_bg_color'])) {
            $css .= "#adminmenu { background: {$settings['menu_bg_color']} !important; }";
        }
        
        // Typography
        if (!empty($settings['body_font'])) {
            $css .= "body, .wp-admin { font-family: '{$settings['body_font']}', sans-serif !important; }";
        }
        
        if (!empty($settings['headings_font'])) {
            $css .= "h1, h2, h3, h4, h5, h6 { font-family: '{$settings['headings_font']}', sans-serif !important; }";
        }
        
        if (!empty($settings['font_size_scale']) && $settings['font_size_scale'] != 1.0) {
            $scale = floatval($settings['font_size_scale']);
            $css .= "html { font-size: " . (16 * $scale) . "px !important; }";
        }
        
        // Floating Effects
        if (!empty($settings['admin_bar_floating'])) {
            $css .= "#wpadminbar { margin: 10px; border-radius: 12px; width: calc(100% - 20px); }";
        }
        
        if (!empty($settings['menu_floating'])) {
            $css .= "#adminmenumain { margin: 10px 0 10px 10px; border-radius: 12px; height: calc(100vh - 20px); }";
        }
        
        // Glassmorphism
        if (!empty($settings['glassmorphism_enabled'])) {
            $css .= "
                #wpadminbar, #adminmenu {
                    backdrop-filter: blur(10px) !important;
                    background: rgba(255, 255, 255, 0.1) !important;
                    border: 1px solid rgba(255, 255, 255, 0.2) !important;
                }
            ";
        }
        
        return $css;
    }
    
        /**
     * 🎯 Ustaw domyślny URL podglądu na panel administracyjny
     */
    public function setDefaultPreviewUrl() {
        global $wp_customize;
        
        if ($wp_customize) {
            // URL panelu administracyjnego
            $admin_url = admin_url('index.php');
            
            // Ustaw domyślny URL podglądu
            $wp_customize->set_preview_url($admin_url);
            
            // Dodatkowo, ustaw URL w JavaScript
            add_action('customize_controls_print_footer_scripts', function() use ($admin_url) {
                ?>
                <script>
                if (typeof wp !== 'undefined' && wp.customize && wp.customize.previewer) {
                    wp.customize.previewer.previewUrl.set('<?php echo esc_js($admin_url); ?>');
                }
                </script>
                <?php
            });
        }
    }
    
    /**
     * 🎯 Dostosuj urządzenia podglądu dla panelu admina
     */
    public function setCustomPreviewDevices($devices) {
        // Dodaj specjalny "device" dla panelu admina
        $devices['admin-panel'] = [
            'label' => __('🎯 Panel Administracyjny', 'modern-admin-styler-v2'),
            'default' => true
        ];
        
        return $devices;
    }
    
    /**
     * 🎯 Wymuś URL podglądu na panel administracyjny (najwcześniejszy hook)
     */
    public function forceAdminPreviewUrl() {
        $admin_url = admin_url('index.php');
        ?>
        <script>
        // Natychmiastowe ustawienie URL podglądu - najwcześniejszy moment
        (function() {
            if (typeof wp !== 'undefined' && wp.customize && wp.customize.previewer) {
                // Ustaw natychmiast
                wp.customize.previewer.previewUrl.set('<?php echo esc_js($admin_url); ?>');
                console.log('🚀 MAS V2: Wymuszone ustawienie URL podglądu na:', '<?php echo esc_js($admin_url); ?>');
            } else {
                // Jeśli jeszcze nie ma wp.customize, poczekaj
                document.addEventListener('DOMContentLoaded', function() {
                    setTimeout(function() {
                        if (typeof wp !== 'undefined' && wp.customize && wp.customize.previewer) {
                            wp.customize.previewer.previewUrl.set('<?php echo esc_js($admin_url); ?>');
                            console.log('🚀 MAS V2: Opóźnione ustawienie URL podglądu na:', '<?php echo esc_js($admin_url); ?>');
                        }
                    }, 100);
                });
            }
        })();
        </script>
        <?php
    }

    /**
     * Sanitization callbacks
     */
    public function sanitizeSelect($input, $setting) {
        $choices = $setting->manager->get_control($setting->id)->choices ?? [];
        return array_key_exists($input, $choices) ? $input : $setting->default;
    }

    public function sanitizeFloat($input) {
        return floatval($input);
    }
    
    /**
     * 🎯 Enqueue script dla kontroli Customizera
     */
    public function enqueueCustomizerControlScript() {
        ?>
        <script type="text/javascript">
        jQuery(document).ready(function($) {
            // Sprawdź czy Customizer API jest dostępne
            if (typeof wp !== 'undefined' && wp.customize) {
                
                // Natychmiast ustaw URL podglądu na panel admina
                wp.customize.bind('ready', function() {
                    console.log('🎯 MAS V2: Inicjalizacja podglądu panelu administracyjnego...');
                    
                    // URL panelu administracyjnego z parametrem dla Customizera
                    var adminUrl = '<?php echo esc_js(admin_url('index.php?customize_preview=1')); ?>';
                    
                    // Poczekaj chwilę na pełne załadowanie Customizera
                    setTimeout(function() {
                        // Ustaw URL podglądu
                        if (wp.customize.previewer && wp.customize.previewer.previewUrl) {
                            wp.customize.previewer.previewUrl.set(adminUrl);
                            console.log('✅ MAS V2: Podgląd ustawiony na:', adminUrl);
                        }
                    }, 500);
                });
                
                // Dodaj przycisk przełączania w kontrolach
                wp.customize.bind('ready', function() {
                    setTimeout(function() {
                        var $customizeInfo = $('.customize-info');
                        if ($customizeInfo.length) {
                            var previewToggle = $('<div class="mas-v2-preview-toggle" style="margin: 15px 0; padding: 15px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 8px; text-align: center; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">' +
                                '<strong style="font-size: 14px;">🎯 Modern Admin Styler V2</strong><br>' +
                                '<small style="opacity: 0.9;">Podgląd na żywo: Panel Administracyjny</small><br>' +
                                '<button type="button" class="button button-small mas-switch-frontend" style="margin-top: 10px; background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.3); color: white;">👁️ Przełącz na Frontend</button>' +
                                '</div>');
                            $customizeInfo.after(previewToggle);
                            
                            // Event listener dla przycisku
                            $('.mas-switch-frontend').on('click', function() {
                                switchToFrontend();
                            });
                        }
                    }, 1500);
                });
                
                // Funkcja przełączania na frontend
                window.switchToFrontend = function() {
                    var frontendUrl = '<?php echo esc_js(home_url('/?customize_preview=1')); ?>';
                    wp.customize.previewer.previewUrl.set(frontendUrl);
                    
                    // Aktualizuj interfejs
                    $('.mas-v2-preview-toggle').html(
                        '<strong style="font-size: 14px;">🌐 Modern Admin Styler V2</strong><br>' +
                        '<small style="opacity: 0.9;">Podgląd na żywo: Strona Frontowa</small><br>' +
                        '<button type="button" class="button button-small mas-switch-admin" style="margin-top: 10px; background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.3); color: white;">🎯 Przełącz na Panel Admina</button>'
                    );
                    
                    // Nowy event listener
                    $('.mas-switch-admin').on('click', function() {
                        switchToAdmin();
                    });
                    
                    console.log('🌐 MAS V2: Przełączono na frontend:', frontendUrl);
                };
                
                // Funkcja przełączania na panel admina
                window.switchToAdmin = function() {
                    var adminUrl = '<?php echo esc_js(admin_url('index.php?customize_preview=1')); ?>';
                    wp.customize.previewer.previewUrl.set(adminUrl);
                    
                    // Aktualizuj interfejs
                    $('.mas-v2-preview-toggle').html(
                        '<strong style="font-size: 14px;">🎯 Modern Admin Styler V2</strong><br>' +
                        '<small style="opacity: 0.9;">Podgląd na żywo: Panel Administracyjny</small><br>' +
                        '<button type="button" class="button button-small mas-switch-frontend" style="margin-top: 10px; background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.3); color: white;">👁️ Przełącz na Frontend</button>'
                    );
                    
                    // Nowy event listener
                    $('.mas-switch-frontend').on('click', function() {
                        switchToFrontend();
                    });
                    
                    console.log('🎯 MAS V2: Przełączono na panel admina:', adminUrl);
                };
            }
        });
        </script>
        <?php
    }
    
    /**
     * 🎯 Dodaje przełącznik URL podglądu (admin/frontend)
     */
    public function addPreviewUrlSwitcher() {
        // Tylko w iframe podglądu Customizera
        if (!is_customize_preview()) {
            return;
        }
        
        ?>
        <script>
        (function() {
            // Sprawdź czy jesteśmy w panelu admina
            const isAdminPanel = document.body.classList.contains('wp-admin');
            const isFrontend = !isAdminPanel;
            
            // Wyślij informację do Customizera o aktualnym kontekście
            if (typeof wp !== 'undefined' && wp.customize && wp.customize.preview) {
                wp.customize.preview.bind('ready', function() {
                    // Wyślij informację o kontekście
                    wp.customize.preview.send('mas-v2-context', {
                        context: isAdminPanel ? 'admin' : 'frontend',
                        url: window.location.href
                    });
                });
            }
            
            // Dodaj przycisk przełączania (tylko w panelu admina)
            if (isAdminPanel) {
                const switcherButton = document.createElement('div');
                switcherButton.id = 'mas-v2-preview-switcher';
                switcherButton.innerHTML = `
                    <button onclick="switchToFrontend()" style="
                        position: fixed; 
                        top: 40px; 
                        right: 20px; 
                        z-index: 99999; 
                        padding: 8px 12px; 
                        background: #0073aa; 
                        color: white; 
                        border: none; 
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 12px;
                    ">
                        👁️ Zobacz Frontend
                    </button>
                `;
                document.body.appendChild(switcherButton);
                
                // Funkcja przełączania na frontend
                window.switchToFrontend = function() {
                    const frontendUrl = '<?php echo esc_js(home_url('/')); ?>?mas_v2_frontend_preview=1';
                    window.location.href = frontendUrl;
                };
            }
        })();
        </script>
        
        <style>
        /* Specjalne style dla podglądu w panelu admina */
        body.wp-admin.customize-preview {
            /* Upewnij się, że wszystkie elementy są widoczne */
        }
        
        /* Ukryj niepotrzebne elementy w podglądzie */
        .customize-preview #screen-meta-links,
        .customize-preview .screen-meta-toggle {
            display: none !important;
        }
        
        /* Wyróżnij elementy, które są stylowane przez wtyczkę */
        .customize-preview #wpadminbar {
            outline: 2px dashed rgba(0, 123, 255, 0.5);
            outline-offset: 2px;
        }
        
        .customize-preview #adminmenumain {
            outline: 2px dashed rgba(255, 123, 0, 0.5);
            outline-offset: 2px;
        }
        </style>
        <?php
    }
} 