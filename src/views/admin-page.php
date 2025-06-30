<?php
/**
 * Nowy, uporządkowany template - Modern Admin Styler V2
 * Reorganizacja zgodna z nową architekturą informacji
 * 
 * @package ModernAdminStylerV2
 * @version 2.1.0
 */

if (!defined('ABSPATH')) {
    exit;
}

$settings = $settings ?? [];
$plugin_url = MAS_V2_PLUGIN_URL;

// Określ aktywną zakładkę
$current_page = $_GET['page'] ?? 'mas-v2-settings';
$active_tab = 'general';

if ($current_page !== 'mas-v2-settings') {
    switch ($current_page) {
        case 'mas-v2-general': $active_tab = 'general'; break;
        case 'mas-v2-admin-bar': $active_tab = 'admin-bar'; break;
        case 'mas-v2-menu': $active_tab = 'menu'; break;
        case 'mas-v2-typography': $active_tab = 'typography'; break;
        case 'mas-v2-advanced': $active_tab = 'advanced'; break;
    }
}
?>

<div class="mas-v2-admin-wrapper">
    <!-- Header -->
    <div class="mas-v2-header">
        <div class="mas-v2-header-content">
            <div class="mas-v2-header-left">
                <div class="mas-v2-user-welcome">
                    <?php 
                    $current_user = wp_get_current_user();
                    $user_name = !empty($current_user->display_name) ? $current_user->display_name : $current_user->user_login;
                    $avatar_url = get_avatar_url($current_user->ID, array('size' => 48));
                    ?>
                    <div class="mas-v2-user-avatar">
                        <img src="<?php echo esc_url($avatar_url); ?>" alt="<?php echo esc_attr($user_name); ?>" class="mas-v2-avatar-img">
                    </div>
                    <div class="mas-v2-user-info">
                        <div class="mas-v2-greeting">
                            <?php printf(esc_html__('Cześć %s! 🎯', 'modern-admin-styler-v2'), esc_html($user_name)); ?>
                        </div>
                        <h1 class="mas-v2-title">
                            🚀 <?php esc_html_e('NOWA ARCHITEKTURA INFORMACJI', 'modern-admin-styler-v2'); ?>
                        </h1>
                    </div>
                </div>
            </div>

            <!-- FAZA 1: TRYB EDYCJI KONTEKSTOWEJ - Przełącznik w nagłówku -->
            <div class="mas-v2-edit-mode-section">
                <div class="mas-v2-edit-mode-toggle">
                    <label for="mas-v2-edit-mode-switch" class="mas-v2-edit-mode-label">
                        <span class="dashicons dashicons-edit mas-v2-edit-icon"></span>
                        <span class="mas-v2-edit-text"><?php esc_html_e('Live Edit Mode', 'modern-admin-styler-v2'); ?></span>
                        <span class="mas-v2-edit-badge">BETA</span>
                    </label>
                    <input type="checkbox" id="mas-v2-edit-mode-switch" 
                           data-live-preview="body-class" 
                           data-body-class="mas-edit-mode-active">
                    <span class="mas-v2-edit-help-text">🎯 <?php esc_html_e('Włącz, aby edytować elementy bezpośrednio w kontekście', 'modern-admin-styler-v2'); ?></span>
                </div>
            </div>
            
            <div class="mas-v2-header-actions">
                <div class="mas-v2-actions-vertical">
                    <button type="button" class="mas-v2-btn mas-v2-btn-secondary" id="mas-v2-import-btn">
                        📥 <?php esc_html_e('Import', 'modern-admin-styler-v2'); ?>
                    </button>
                    <button type="button" class="mas-v2-btn mas-v2-btn-secondary" id="mas-v2-export-btn">
                        📤 <?php esc_html_e('Export', 'modern-admin-styler-v2'); ?>
                    </button>
                    <button type="submit" form="mas-v2-settings-form" id="mas-v2-save-btn" class="mas-v2-btn mas-v2-btn-primary">
                        💾 <?php esc_html_e('Zapisz', 'modern-admin-styler-v2'); ?>
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- Metrics - Nowe info o reorganizacji -->
    <div class="mas-v2-metrics-grid">
        <div class="mas-v2-metric-card purple">
            <div class="mas-v2-metric-header">
                <div class="mas-v2-metric-icon">🎯</div>
                <div class="mas-v2-metric-trend positive">NOWE!</div>
            </div>
            <div class="mas-v2-metric-value">5</div>
            <div class="mas-v2-metric-label"><?php esc_html_e('Logiczne zakładki', 'modern-admin-styler-v2'); ?></div>
        </div>

        <div class="mas-v2-metric-card pink">
            <div class="mas-v2-metric-header">
                <div class="mas-v2-metric-icon">📂</div>
                <div class="mas-v2-metric-trend positive">∞%</div>
            </div>
            <div class="mas-v2-metric-value">∞</div>
            <div class="mas-v2-metric-label"><?php esc_html_e('Porządek', 'modern-admin-styler-v2'); ?></div>
        </div>

        <div class="mas-v2-metric-card orange">
            <div class="mas-v2-metric-header">
                <div class="mas-v2-metric-icon">🚀</div>
                <div class="mas-v2-metric-trend positive">+100%</div>
            </div>
            <div class="mas-v2-metric-value">100%</div>
            <div class="mas-v2-metric-label"><?php esc_html_e('Logika', 'modern-admin-styler-v2'); ?></div>
        </div>

        <div class="mas-v2-metric-card green">
            <div class="mas-v2-metric-header">
                <div class="mas-v2-metric-icon">✅</div>
                <div class="mas-v2-metric-trend positive">FIXED</div>
            </div>
            <div class="mas-v2-metric-value">43</div>
            <div class="mas-v2-metric-label"><?php esc_html_e('Pola naprawione', 'modern-admin-styler-v2'); ?></div>
        </div>
    </div>
    
    <!-- Content -->
    <div class="mas-v2-content-grid">
        <div class="mas-v2-main-content">
            <form id="mas-v2-settings-form" method="post" action="">
            <?php wp_nonce_field('mas_v2_nonce', 'mas_v2_nonce'); ?>
            
            <!-- 🎯 NATIVE INTEGRATION: Nawigacja przeniesiona do menu WordPress -->
            
            <!-- REDESIGN: Content Cards -->
            <div class="mas-v2-content">
            <div class="mas-v2-settings-columns">
            
                <!-- 1. GENERAL Tab -->
                <div id="general" class="mas-v2-tab-content <?php echo $active_tab === 'general' ? 'active' : ''; ?>" role="tabpanel">
                    
                    <!-- Global Settings Card -->
                    <div class="mas-v2-card">
                        <div class="mas-v2-card-header">
                            <h3 class="mas-v2-card-title">⚙️ Global Settings</h3>
                            <p class="mas-v2-card-description">Essential plugin configuration</p>
                        </div>
                            
                        <!-- Enable Plugin -->
                            <div class="mas-v2-field">
                            <label class="mas-v2-toggle">
                                <input type="checkbox" 
                                       name="enable_plugin" 
                                       id="enable_plugin"
                                       value="1"
                                       <?php checked($settings['enable_plugin'] ?? false); ?>>
                                <span class="mas-v2-toggle-slider"></span>
                                <span class="mas-v2-label">🟢 Enable Modern Admin Styler</span>
                                </label>
                            </div>
                            
                        <!-- Color Scheme -->
                            <div class="mas-v2-field">
                                <label for="color_scheme" class="mas-v2-label">
                                🎨 Color Scheme
                                </label>
                            <select id="color_scheme" 
                                    name="color_scheme" 
                                    class="mas-v2-select"
                                    data-live-preview="body-class"
                                    data-body-class="mas-theme-"
                                    data-exclusive-group="mas-theme-"
                                    data-all-options="light,dark,auto">
                                    <option value="light" <?php selected($settings['color_scheme'] ?? '', 'light'); ?>>
                                    💡 Light Mode
                                    </option>
                                    <option value="dark" <?php selected($settings['color_scheme'] ?? '', 'dark'); ?>>
                                    🌙 Dark Mode
                                    </option>
                                    <option value="auto" <?php selected($settings['color_scheme'] ?? '', 'auto'); ?>>
                                    🤖 Auto (System)
                                    </option>
                                </select>
                        </div>
                            
                        <!-- Color Palette - NOWE MOTYWY! -->
                            <div class="mas-v2-field">
                                <label for="color_palette" class="mas-v2-label">
                                🎨 Theme Palette (Paleta motywu)
                                </label>
                            <select id="color_palette" 
                                    name="color_palette" 
                                    class="mas-v2-select"
                                    data-live-preview="body-class"
                                    data-body-class="mas-palette-"
                                    data-exclusive-group="mas-palette-"
                                    data-all-options="modern,white,green">
                                    <option value="modern" <?php selected($settings['color_palette'] ?? '', 'modern'); ?>>
                                    🌌 Modern - Fioletowo-niebieski (oryginalny)
                                    </option>
                                    <option value="white" <?php selected($settings['color_palette'] ?? '', 'white'); ?>>
                                    🤍 White Minimal - Jasny z dużymi czcionkami
                                    </option>
                                    <option value="green" <?php selected($settings['color_palette'] ?? '', 'green'); ?>>
                                    🌿 Soothing Green - Kojący zielony
                                    </option>
                                </select>
                        <small class="mas-v2-help-text">✨ Użyj przycisków floating po prawej stronie dla szybkiej zmiany!</small>
                        </div>
                            </div>
                            
                <!-- Sekcja: Layout (Układ) -->
                <div class="mas-v2-card">
                    <div class="mas-v2-card-header">
                        <h2 class="mas-v2-card-title">📐 <?php esc_html_e('Layout (Układ)', 'modern-admin-styler-v2'); ?></h2>
                        <p class="mas-v2-card-description"><?php esc_html_e('Główne opcje układu interfejsu', 'modern-admin-styler-v2'); ?></p>
                        </div>
                            
                    <!-- Menu Floating -->
                            <div class="mas-v2-field">
                            <label class="mas-v2-checkbox">
                                <input type="checkbox" 
                                   name="menu_floating" 
                                       value="1" 
                                   id="menu_floating"
                                   data-live-preview="body-class"
                                   data-body-class="mas-v2-menu-floating"
                                   <?php checked($settings['menu_floating'] ?? false); ?>>
                                <span class="mas-v2-checkbox-mark"></span>
                            🎯 <?php esc_html_e('Menu Floating (pływające menu)', 'modern-admin-styler-v2'); ?>
                                </label>
                        <small class="mas-v2-help-text"><?php esc_html_e('Menu będzie "odklejone" od krawędzi i będzie pływać', 'modern-admin-styler-v2'); ?></small>
                            </div>
                            
                    <!-- Admin Bar Floating -->
                            <div class="mas-v2-field">
                            <label class="mas-v2-checkbox">
                                <input type="checkbox" 
                                   name="admin_bar_floating" 
                                       value="1" 
                                   id="admin_bar_floating"
                                   data-live-preview="body-class"
                                   data-body-class="mas-v2-admin-bar-floating"
                                   <?php checked($settings['admin_bar_floating'] ?? false); ?>>
                                <span class="mas-v2-checkbox-mark"></span>
                            🎯 <?php esc_html_e('Admin Bar Floating (pływający pasek admina)', 'modern-admin-styler-v2'); ?>
                                </label>
                        <small class="mas-v2-help-text"><?php esc_html_e('Pasek administracyjny będzie "odklejony" i będzie pływać', 'modern-admin-styler-v2'); ?></small>
                    </div>
                        </div>
                        
                <!-- Sekcja: Efekty Wizualne -->
                <div class="mas-v2-card">
                    <div class="mas-v2-card-header">
                        <h2 class="mas-v2-card-title">✨ <?php esc_html_e('Efekty Wizualne', 'modern-admin-styler-v2'); ?></h2>
                        <p class="mas-v2-card-description"><?php esc_html_e('Nowoczesne efekty i animacje', 'modern-admin-styler-v2'); ?></p>
                        </div>
                        
                    <!-- Menu Glossy/Glassmorphism -->
                        <div class="mas-v2-field">
                            <label class="mas-v2-checkbox">
                                <input type="checkbox" 
                                   name="menu_glassmorphism" 
                                       value="1" 
                                   data-live-preview="body-class"
                                   data-body-class="mas-v2-glassmorphism"
                                   <?php checked($settings['menu_glassmorphism'] ?? false); ?>>
                                <span class="mas-v2-checkbox-mark"></span>
                            🪟 <?php esc_html_e('Menu Glossy/Glassmorphism (efekt "szkła" na menu)', 'modern-admin-styler-v2'); ?>
                            </label>
                        </div>
                        
                    <!-- Admin Bar Glossy/Glassmorphism -->
                        <div class="mas-v2-field">
                            <label class="mas-v2-checkbox">
                                <input type="checkbox" 
                                   name="admin_bar_glossy" 
                                       value="1" 
                                   data-live-preview="body-class"
                                   data-body-class="mas-v2-glossy"
                                   <?php checked($settings['admin_bar_glossy'] ?? false); ?>>
                                <span class="mas-v2-checkbox-mark"></span>
                            🪟 <?php esc_html_e('Admin Bar Glossy/Glassmorphism (efekt "szkła" na pasku admina)', 'modern-admin-styler-v2'); ?>
                            </label>
                        </div>
                        
                    <!-- Enable Animations -->
                        <div class="mas-v2-field">
                            <label class="mas-v2-checkbox">
                                <input type="checkbox" 
                                       name="enable_animations" 
                                       value="1" 
                                       data-live-preview="body-class"
                                       data-body-class="mas-v2-animations-enabled"
                                       <?php checked($settings['enable_animations'] ?? true); ?>>
                                <span class="mas-v2-checkbox-mark"></span>
                            🎬 <?php esc_html_e('Włącz animacje', 'modern-admin-styler-v2'); ?>
                            </label>
                    </div>
                        </div>
                        
                <!-- Sekcja: Dodatkowe -->
                <div class="mas-v2-card">
                    <div class="mas-v2-card-header">
                        <h2 class="mas-v2-card-title">🔧 <?php esc_html_e('Dodatkowe', 'modern-admin-styler-v2'); ?></h2>
                        <p class="mas-v2-card-description"><?php esc_html_e('Custom CSS i JS dla zaawansowanych użytkowników', 'modern-admin-styler-v2'); ?></p>
                        </div>
                        
                    <!-- Custom CSS -->
                        <div class="mas-v2-field">
                        <label for="custom_css" class="mas-v2-label">
                            💻 <?php esc_html_e('Custom CSS', 'modern-admin-styler-v2'); ?>
                            </label>
                        <textarea id="custom_css" 
                                  name="custom_css" 
                                  rows="6" 
                                  class="mas-v2-textarea"
                                  data-live-preview="custom-css"
                                  data-css-id="mas-custom-css-preview"
                                  placeholder="/* Twój własny CSS */&#10;.my-custom-style {&#10;    color: #ff0000;&#10;}"><?php echo esc_textarea($settings['custom_css'] ?? ''); ?></textarea>
                        <small class="mas-v2-help-text"><?php esc_html_e('Dodaj własne style CSS, które będą zastosowane w panelu administracyjnym', 'modern-admin-styler-v2'); ?></small>
                        </div>
                        
                    <!-- Custom JS -->
                        <div class="mas-v2-field">
                        <label for="custom_js" class="mas-v2-label">
                            ⚡ <?php esc_html_e('Custom JS', 'modern-admin-styler-v2'); ?>
                            </label>
                        <textarea id="custom_js" 
                                  name="custom_js" 
                                  rows="6" 
                                  class="mas-v2-textarea"
                                  placeholder="// Twój własny JavaScript&#10;console.log('Modern Admin Styler loaded!');"><?php echo esc_textarea($settings['custom_js'] ?? ''); ?></textarea>
                        <small class="mas-v2-help-text"><?php esc_html_e('Dodaj własny kod JavaScript (bez tagów script)', 'modern-admin-styler-v2'); ?></small>
                        </div>
                            </div>
                        </div>
                        
            <!-- 2. ADMIN BAR TAB (Pasek Admina) -->
            <div id="admin-bar" class="mas-v2-tab-content <?php echo $active_tab === 'admin-bar' ? 'active' : ''; ?>" role="tabpanel">
                
                <!-- Sekcja: Wygląd i Pozycja -->
                        <div class="mas-v2-card">
                        <div class="mas-v2-card-header">
                        <h2 class="mas-v2-card-title">🎨 <?php esc_html_e('Wygląd i Pozycja', 'modern-admin-styler-v2'); ?></h2>
                        <p class="mas-v2-card-description"><?php esc_html_e('Podstawowe ustawienia wyglądu i pozycjonowania paska', 'modern-admin-styler-v2'); ?></p>
                        </div>
                            
                    <!-- Admin Bar Height -->
                            <div class="mas-v2-field">
                                <label for="admin_bar_height" class="mas-v2-label">
                            📏 <?php esc_html_e('Wysokość paska', 'modern-admin-styler-v2'); ?>
                                    <span class="mas-v2-slider-value" data-target="admin_bar_height"><?php echo esc_html($settings['admin_bar_height'] ?? 32); ?>px</span>
                                </label>
                                <input type="range" 
                                       id="admin_bar_height" 
                                       name="admin_bar_height" 
                                   min="25" 
                                       max="60" 
                                       value="<?php echo esc_attr($settings['admin_bar_height'] ?? 32); ?>" 
                                       class="mas-v2-slider"
                                       data-live-preview="css-var"
                                       data-css-var="--mas-admin-bar-height"
                                       data-unit="px">
                        <small class="mas-v2-help-text"><?php esc_html_e('Wysokość górnego paska administratora (25-60px)', 'modern-admin-styler-v2'); ?></small>
                            </div>
                            
                    <!-- Admin Bar Margin (tylko dla floating) -->
                    <div class="mas-v2-field floating-only" data-requires="admin_bar_floating">
                        <label for="admin_bar_margin" class="mas-v2-label">
                            📐 <?php esc_html_e('Marginesy (tylko dla trybu Floating)', 'modern-admin-styler-v2'); ?>
                            <span class="mas-v2-slider-value" data-target="admin_bar_margin"><?php echo esc_html($settings['admin_bar_margin'] ?? 10); ?>px</span>
                                </label>
                        <input type="range" 
                               id="admin_bar_margin" 
                               name="admin_bar_margin" 
                               min="0" 
                               max="30" 
                               value="<?php echo esc_attr($settings['admin_bar_margin'] ?? 10); ?>" 
                               class="mas-v2-slider"
                               data-live-preview="css-var"
                               data-css-var="--mas-admin-bar-margin"
                               data-unit="px">
                        <small class="mas-v2-help-text"><?php esc_html_e('Odstęp od krawędzi ekranu w trybie floating', 'modern-admin-styler-v2'); ?></small>
                            </div>

                    <!-- Admin Bar Border Radius -->
                        <div class="mas-v2-field">
                            <label for="admin_bar_border_radius" class="mas-v2-label">
                            ⭕ <?php esc_html_e('Zaokrąglenie narożników', 'modern-admin-styler-v2'); ?>
                                <span class="mas-v2-slider-value" data-target="admin_bar_border_radius"><?php echo esc_html($settings['admin_bar_border_radius'] ?? 0); ?>px</span>
                                    </label>
                                    <input type="range" 
                                   id="admin_bar_border_radius" 
                                   name="admin_bar_border_radius" 
                                           min="0" 
                                   max="30" 
                                   value="<?php echo esc_attr($settings['admin_bar_border_radius'] ?? 0); ?>" 
                                           class="mas-v2-slider"
                                           data-live-preview="css-var"
                                           data-css-var="--mas-admin-bar-border-radius"
                                           data-unit="px">
                        <small class="mas-v2-help-text"><?php esc_html_e('Zaokrąglenie rogów paska (0 = ostre rogi, 30 = bardzo okrągłe)', 'modern-admin-styler-v2'); ?></small>
                                </div>
                            </div>
                            
                <!-- Sekcja: Typografia i Kolory -->
                <div class="mas-v2-card">
                    <div class="mas-v2-card-header">
                        <h2 class="mas-v2-card-title">🎭 <?php esc_html_e('Typografia i Kolory', 'modern-admin-styler-v2'); ?></h2>
                        <p class="mas-v2-card-description"><?php esc_html_e('Kolory tekstu, tła i ustawienia czcionek', 'modern-admin-styler-v2'); ?></p>
                        </div>

                    <!-- Admin Bar Background -->
                    <div class="mas-v2-field">
                        <label for="admin_bar_background" class="mas-v2-label">
                            🎨 <?php esc_html_e('Kolor tła paska', 'modern-admin-styler-v2'); ?>
                                    </label>
                        <input type="color" 
                               id="admin_bar_background" 
                               name="admin_bar_background" 
                               value="<?php echo esc_attr($settings['admin_bar_background'] ?? '#23282d'); ?>" 
                               class="mas-v2-color"
                               data-live-preview="css-var"
                               data-css-var="--mas-admin-bar-background">
                        <small class="mas-v2-help-text"><?php esc_html_e('Główny kolor tła paska administratora', 'modern-admin-styler-v2'); ?></small>
                                </div>
                                
                    <!-- Text Color -->
                    <div class="mas-v2-field">
                        <label for="admin_bar_text_color" class="mas-v2-label">
                            ✏️ <?php esc_html_e('Kolor tekstu', 'modern-admin-styler-v2'); ?>
                        </label>
                        <input type="color" 
                               id="admin_bar_text_color" 
                               name="admin_bar_text_color" 
                               value="<?php echo esc_attr($settings['admin_bar_text_color'] ?? '#ffffff'); ?>" 
                               class="mas-v2-color"
                               data-live-preview="css-var"
                               data-css-var="--mas-admin-bar-text-color">
                        <small class="mas-v2-help-text"><?php esc_html_e('Kolor tekstu w pasku administratora', 'modern-admin-styler-v2'); ?></small>
                    </div>
                    
                    <!-- Hover Color -->
                    <div class="mas-v2-field">
                        <label for="admin_bar_hover_color" class="mas-v2-label">
                            👆 <?php esc_html_e('Kolor po najechaniu', 'modern-admin-styler-v2'); ?>
                        </label>
                        <input type="color" 
                               id="admin_bar_hover_color" 
                               name="admin_bar_hover_color" 
                               value="<?php echo esc_attr($settings['admin_bar_hover_color'] ?? '#00a0d2'); ?>" 
                               class="mas-v2-color"
                               data-live-preview="css-var"
                               data-css-var="--mas-admin-bar-hover-color">
                        <small class="mas-v2-help-text"><?php esc_html_e('Kolor elementów po najechaniu myszką', 'modern-admin-styler-v2'); ?></small>
                    </div>
                    
                    <!-- Font Size -->
                    <div class="mas-v2-field">
                        <label for="admin_bar_font_size" class="mas-v2-label">
                            🔤 <?php esc_html_e('Rozmiar czcionki', 'modern-admin-styler-v2'); ?>
                            <span class="mas-v2-slider-value" data-target="admin_bar_font_size"><?php echo esc_html($settings['admin_bar_font_size'] ?? 13); ?>px</span>
                        </label>
                        <input type="range" 
                               id="admin_bar_font_size" 
                               name="admin_bar_font_size" 
                               min="11" 
                               max="18" 
                               value="<?php echo esc_attr($settings['admin_bar_font_size'] ?? 13); ?>" 
                               class="mas-v2-slider"
                               data-live-preview="css-var"
                               data-css-var="--mas-admin-bar-font-size"
                               data-unit="px">
                        <small class="mas-v2-help-text"><?php esc_html_e('Rozmiar tekstu w pasku (11-18px)', 'modern-admin-styler-v2'); ?></small>
                    </div>
                    
                    <!-- Padding -->
                    <div class="mas-v2-field">
                        <label for="admin_bar_padding" class="mas-v2-label">
                            📦 <?php esc_html_e('Wewnętrzne odstępy', 'modern-admin-styler-v2'); ?>
                            <span class="mas-v2-slider-value" data-target="admin_bar_padding"><?php echo esc_html($settings['admin_bar_padding'] ?? 5); ?>px</span>
                        </label>
                        <input type="range" 
                               id="admin_bar_padding" 
                               name="admin_bar_padding" 
                               min="0" 
                               max="20" 
                               value="<?php echo esc_attr($settings['admin_bar_padding'] ?? 5); ?>" 
                               class="mas-v2-slider">
                        <small class="mas-v2-help-text"><?php esc_html_e('Wewnętrzne odstępy elementów w pasku', 'modern-admin-styler-v2'); ?></small>
                    </div>
                    </div>
                    
                <!-- Sekcja: Widoczność Elementów -->
                <div class="mas-v2-card">
                    <div class="mas-v2-card-header">
                        <h2 class="mas-v2-card-title">👁️ <?php esc_html_e('Widoczność Elementów', 'modern-admin-styler-v2'); ?></h2>
                        <p class="mas-v2-card-description"><?php esc_html_e('Kontrola nad tym, które elementy są wyświetlane w pasku', 'modern-admin-styler-v2'); ?></p>
                    </div>
                    
                    <!-- Hide WP Logo -->
                    <div class="mas-v2-field">
                        <label class="mas-v2-checkbox">
                            <input type="checkbox" 
                                   name="hide_wp_logo" 
                                   value="1" 
                                   <?php checked($settings['hide_wp_logo'] ?? false); ?>>
                            <span class="mas-v2-checkbox-mark"></span>
                            🙈 <?php esc_html_e('Ukryj logo WordPress', 'modern-admin-styler-v2'); ?>
                        </label>
                        <small class="mas-v2-help-text"><?php esc_html_e('Usuwa logo WP z lewej strony paska', 'modern-admin-styler-v2'); ?></small>
                    </div>
                    
                    <!-- Hide Site Name -->
                    <div class="mas-v2-field">
                        <label class="mas-v2-checkbox">
                            <input type="checkbox" 
                                   name="hide_site_name" 
                                   value="1" 
                                   <?php checked($settings['hide_site_name'] ?? false); ?>>
                            <span class="mas-v2-checkbox-mark"></span>
                            🙈 <?php esc_html_e('Ukryj nazwę strony', 'modern-admin-styler-v2'); ?>
                        </label>
                        <small class="mas-v2-help-text"><?php esc_html_e('Usuwa nazwę witryny z paska', 'modern-admin-styler-v2'); ?></small>
                    </div>
                    
                    <!-- Hide Updates -->
                    <div class="mas-v2-field">
                        <label class="mas-v2-checkbox">
                            <input type="checkbox" 
                                   name="hide_update_notices" 
                                   value="1" 
                                   <?php checked($settings['hide_update_notices'] ?? false); ?>>
                            <span class="mas-v2-checkbox-mark"></span>
                            🙈 <?php esc_html_e('Ukryj aktualizacje', 'modern-admin-styler-v2'); ?>
                        </label>
                        <small class="mas-v2-help-text"><?php esc_html_e('Usuwa powiadomienia o aktualizacjach', 'modern-admin-styler-v2'); ?></small>
                    </div>
                    
                    <!-- Hide Comments -->
                    <div class="mas-v2-field">
                        <label class="mas-v2-checkbox">
                            <input type="checkbox" 
                                   name="hide_comments" 
                                   value="1" 
                                   <?php checked($settings['hide_comments'] ?? false); ?>>
                            <span class="mas-v2-checkbox-mark"></span>
                            🙈 <?php esc_html_e('Ukryj komentarze', 'modern-admin-styler-v2'); ?>
                        </label>
                        <small class="mas-v2-help-text"><?php esc_html_e('Usuwa ikonę komentarzy z paska', 'modern-admin-styler-v2'); ?></small>
                    </div>
                    
                    <!-- Hide "Howdy" -->
                    <div class="mas-v2-field">
                        <label class="mas-v2-checkbox">
                            <input type="checkbox" 
                                   name="hide_howdy" 
                                   value="1" 
                                   <?php checked($settings['hide_howdy'] ?? false); ?>>
                            <span class="mas-v2-checkbox-mark"></span>
                            🙈 <?php esc_html_e('Ukryj "Cześć"', 'modern-admin-styler-v2'); ?>
                        </label>
                        <small class="mas-v2-help-text"><?php esc_html_e('Usuwa tekst powitania "Cześć [użytkownik]"', 'modern-admin-styler-v2'); ?></small>
                    </div>
                </div>
            </div>
                        
            <!-- 3. MENU TAB (Menu nawigacyjne) -->
            <div id="menu" class="mas-v2-tab-content <?php echo $active_tab === 'menu' ? 'active' : ''; ?>" role="tabpanel">
                
                <!-- Sekcja: Główne Ustawienia Menu -->
                        <div class="mas-v2-card">
                        <div class="mas-v2-card-header">
                        <h2 class="mas-v2-card-title">📋 <?php esc_html_e('Główne Ustawienia Menu', 'modern-admin-styler-v2'); ?></h2>
                        <p class="mas-v2-card-description"><?php esc_html_e('Podstawowe opcje rozmiaru i położenia menu', 'modern-admin-styler-v2'); ?></p>
                            </div>
                            
                    <!-- Menu Width -->
                            <div class="mas-v2-field">
                                <label for="menu_width" class="mas-v2-label">
                            📏 <?php esc_html_e('Szerokość menu', 'modern-admin-styler-v2'); ?>
                                    <span class="mas-v2-slider-value" data-target="menu_width"><?php echo esc_html($settings['menu_width'] ?? 160); ?>px</span>
                                </label>
                                <input type="range" 
                                       id="menu_width" 
                                       name="menu_width" 
                                       min="120" 
                                   max="400" 
                                       value="<?php echo esc_attr($settings['menu_width'] ?? 160); ?>" 
                                       class="mas-v2-slider"
                                       data-live-preview="css-var"
                                       data-css-var="--mas-menu-width"
                                       data-unit="px">
                        <small class="mas-v2-help-text"><?php esc_html_e('Szerokość menu bocznego (120-400px)', 'modern-admin-styler-v2'); ?></small>
                            </div>
                            
                    <!-- Menu Margin (tylko dla floating) -->
                        <div class="mas-v2-field floating-only" data-requires="menu_floating">
                            <label for="menu_margin" class="mas-v2-label">
                            📐 <?php esc_html_e('Marginesy (tylko dla trybu Floating)', 'modern-admin-styler-v2'); ?>
                                <span class="mas-v2-slider-value" data-target="menu_margin"><?php echo esc_html($settings['menu_margin'] ?? 10); ?>px</span>
                                        </label>
                                        <input type="range" 
                                   id="menu_margin" 
                                   name="menu_margin" 
                                               min="0" 
                               max="30" 
                                   value="<?php echo esc_attr($settings['menu_margin'] ?? 10); ?>" 
                                               class="mas-v2-slider"
                                               data-live-preview="css-var"
                                               data-css-var="--mas-menu-margin"
                                               data-unit="px">
                        <small class="mas-v2-help-text"><?php esc_html_e('Odstęp od krawędzi ekranu w trybie floating', 'modern-admin-styler-v2'); ?></small>
                                </div>
                                
                    <!-- Menu Border Radius -->
                    <div class="mas-v2-field">
                        <label for="menu_border_radius" class="mas-v2-label">
                            ⭕ <?php esc_html_e('Zaokrąglenie narożników', 'modern-admin-styler-v2'); ?>
                            <span class="mas-v2-slider-value" data-target="menu_border_radius"><?php echo esc_html($settings['menu_border_radius'] ?? 0); ?>px</span>
                                        </label>
                                        <input type="range" 
                               id="menu_border_radius" 
                               name="menu_border_radius" 
                                               min="0" 
                               max="30" 
                               value="<?php echo esc_attr($settings['menu_border_radius'] ?? 0); ?>" 
                                               class="mas-v2-slider"
                                               data-live-preview="css-var"
                                               data-css-var="--mas-menu-border-radius"
                                               data-unit="px">
                        <small class="mas-v2-help-text"><?php esc_html_e('Zaokrąglenie rogów menu (0 = ostre rogi)', 'modern-admin-styler-v2'); ?></small>
                    </div>
                    </div>
                    
                <!-- Sekcja: Wygląd Elementów Menu -->
                <div class="mas-v2-card">
                    <div class="mas-v2-card-header">
                        <h2 class="mas-v2-card-title">🎨 <?php esc_html_e('Wygląd Elementów Menu', 'modern-admin-styler-v2'); ?></h2>
                        <p class="mas-v2-card-description"><?php esc_html_e('Rozmiary i odstępy elementów menu', 'modern-admin-styler-v2'); ?></p>
                    </div>
                    
                    <!-- Menu Item Height -->
                    <div class="mas-v2-field">
                        <label for="menu_item_height" class="mas-v2-label">
                            📐 <?php esc_html_e('Wysokość elementu', 'modern-admin-styler-v2'); ?>
                            <span class="mas-v2-slider-value" data-target="menu_item_height"><?php echo esc_html($settings['menu_item_height'] ?? 34); ?>px</span>
                        </label>
                        <input type="range" 
                               id="menu_item_height" 
                               name="menu_item_height" 
                               min="28" 
                               max="50" 
                               value="<?php echo esc_attr($settings['menu_item_height'] ?? 34); ?>" 
                               class="mas-v2-slider"
                               data-live-preview="css-var"
                               data-css-var="--mas-menu-item-height"
                               data-unit="px">
                        <small class="mas-v2-help-text"><?php esc_html_e('Wysokość każdego elementu menu (28-50px)', 'modern-admin-styler-v2'); ?></small>
                    </div>
                    
                    <!-- Menu Item Spacing -->
                    <div class="mas-v2-field">
                        <label for="menu_item_spacing" class="mas-v2-label">
                            📏 <?php esc_html_e('Odstęp między elementami', 'modern-admin-styler-v2'); ?>
                            <span class="mas-v2-slider-value" data-target="menu_item_spacing"><?php echo esc_html($settings['menu_item_spacing'] ?? 2); ?>px</span>
                        </label>
                        <input type="range" 
                               id="menu_item_spacing" 
                               name="menu_item_spacing" 
                               min="0" 
                               max="10" 
                               value="<?php echo esc_attr($settings['menu_item_spacing'] ?? 2); ?>" 
                               class="mas-v2-slider"
                               data-live-preview="css-var"
                               data-css-var="--mas-menu-item-spacing"
                               data-unit="px">
                        <small class="mas-v2-help-text"><?php esc_html_e('Pionowy odstęp między elementami menu', 'modern-admin-styler-v2'); ?></small>
                    </div>
                    
                    <!-- Compact Mode -->
                    <div class="mas-v2-field">
                        <label class="mas-v2-checkbox">
                            <input type="checkbox" 
                                   name="menu_compact_mode" 
                                   value="1" 
                                   data-live-preview="body-class"
                                   data-body-class="mas-menu-compact-mode"
                                   <?php checked($settings['menu_compact_mode'] ?? false); ?>>
                            <span class="mas-v2-checkbox-mark"></span>
                            📦 <?php esc_html_e('Tryb kompaktowy', 'modern-admin-styler-v2'); ?>
                        </label>
                        <small class="mas-v2-help-text"><?php esc_html_e('Zmniejsza odstępy i rozmiary dla bardziej zwartego menu', 'modern-admin-styler-v2'); ?></small>
                    </div>
                    </div>
                    
                <!-- Sekcja: Kolory i Czcionki -->
                <div class="mas-v2-card">
                    <div class="mas-v2-card-header">
                        <h2 class="mas-v2-card-title">🎭 <?php esc_html_e('Kolory i Czcionki', 'modern-admin-styler-v2'); ?></h2>
                        <p class="mas-v2-card-description"><?php esc_html_e('Schemat kolorów i typografia menu', 'modern-admin-styler-v2'); ?></p>
                    </div>
                    
                    <!-- Menu Background -->
                    <div class="mas-v2-field">
                        <label for="menu_background_color" class="mas-v2-label">
                            🎨 <?php esc_html_e('Tło menu', 'modern-admin-styler-v2'); ?>
                        </label>
                        <input type="color" 
                               id="menu_background_color" 
                               name="menu_background_color" 
                               value="<?php echo esc_attr($settings['menu_background_color'] ?? '#23282d'); ?>" 
                               class="mas-v2-color"
                               data-live-preview="css-var"
                               data-css-var="--mas-menu-background">
                        <small class="mas-v2-help-text"><?php esc_html_e('Główny kolor tła menu bocznego', 'modern-admin-styler-v2'); ?></small>
                    </div>
                    
                    <!-- Text Color -->
                    <div class="mas-v2-field">
                        <label for="menu_text_color" class="mas-v2-label">
                            ✏️ <?php esc_html_e('Kolor tekstu', 'modern-admin-styler-v2'); ?>
                        </label>
                        <input type="color" 
                               id="menu_text_color" 
                               name="menu_text_color" 
                               value="<?php echo esc_attr($settings['menu_text_color'] ?? '#ffffff'); ?>" 
                               class="mas-v2-color"
                               data-live-preview="css-var"
                               data-css-var="--mas-menu-text-color">
                        <small class="mas-v2-help-text"><?php esc_html_e('Kolor tekstu elementów menu', 'modern-admin-styler-v2'); ?></small>
                    </div>
                    
                    <!-- Hover Background Color -->
                    <div class="mas-v2-field">
                        <label for="menu_hover_color" class="mas-v2-label">
                            👆 <?php esc_html_e('Kolor tła po najechaniu', 'modern-admin-styler-v2'); ?>
                        </label>
                        <input type="color" 
                               id="menu_hover_color" 
                               name="menu_hover_color" 
                               value="<?php echo esc_attr($settings['menu_hover_color'] ?? '#0073aa'); ?>" 
                               class="mas-v2-color"
                               data-live-preview="css-var"
                               data-css-var="--mas-menu-hover-color">
                        <small class="mas-v2-help-text"><?php esc_html_e('Kolor tła elementu po najechaniu myszką', 'modern-admin-styler-v2'); ?></small>
                    </div>
                    
                    <!-- Active Background Color -->
                    <div class="mas-v2-field">
                        <label for="menu_active_color" class="mas-v2-label">
                            🎯 <?php esc_html_e('Kolor tła aktywnego elementu', 'modern-admin-styler-v2'); ?>
                        </label>
                        <input type="color" 
                               id="menu_active_color" 
                               name="menu_active_color" 
                               value="<?php echo esc_attr($settings['menu_active_color'] ?? '#0073aa'); ?>" 
                               class="mas-v2-color"
                               data-live-preview="css-var"
                               data-css-var="--mas-menu-active-background">
                        <small class="mas-v2-help-text"><?php esc_html_e('Kolor tła aktualnie wybranego elementu', 'modern-admin-styler-v2'); ?></small>
                    </div>
                    
                    <!-- Active Text Color -->
                    <div class="mas-v2-field">
                        <label for="menu_active_text_color" class="mas-v2-label">
                            🎯 <?php esc_html_e('Kolor tekstu aktywnego elementu', 'modern-admin-styler-v2'); ?>
                                    </label>
                                    <input type="color" 
                               id="menu_active_text_color" 
                               name="menu_active_text_color" 
                               value="<?php echo esc_attr($settings['menu_active_text_color'] ?? '#ffffff'); ?>" 
                               class="mas-v2-color"
                               data-live-preview="css-var"
                               data-css-var="--mas-menu-active-text-color">
                        <small class="mas-v2-help-text"><?php esc_html_e('Kolor tekstu aktualnie wybranego elementu', 'modern-admin-styler-v2'); ?></small>
                                </div>
                    </div>
                    
                <!-- Sekcja: Submenu (PRZENIESIONE Z OSOBNEJ ZAKŁADKI!) -->
                <div class="mas-v2-card">
                    <div class="mas-v2-card-header">
                        <h2 class="mas-v2-card-title">📂 <?php esc_html_e('Submenu (Podmenu)', 'modern-admin-styler-v2'); ?></h2>
                        <p class="mas-v2-card-description"><?php esc_html_e('🎯 NOWE! Wszystkie opcje podmenu teraz w jednej logicznej sekcji Menu', 'modern-admin-styler-v2'); ?></p>
                    </div>
                    
                    <!-- Submenu Background Color -->
                    <div class="mas-v2-field">
                        <label for="submenu_bg_color" class="mas-v2-label">
                            🎨 <?php esc_html_e('Tło podmenu', 'modern-admin-styler-v2'); ?>
                        </label>
                        <input type="color" 
                               id="submenu_bg_color" 
                               name="submenu_bg_color" 
                               value="<?php echo esc_attr($settings['submenu_bg_color'] ?? '#2c3338'); ?>" 
                               class="mas-v2-color">
                        <small class="mas-v2-help-text"><?php esc_html_e('Kolor tła rozwijanych podmenu', 'modern-admin-styler-v2'); ?></small>
                    </div>
                    
                    <!-- Submenu Text Color -->
                    <div class="mas-v2-field">
                        <label for="submenu_text_color" class="mas-v2-label">
                            ✏️ <?php esc_html_e('Kolor tekstu', 'modern-admin-styler-v2'); ?>
                        </label>
                        <input type="color" 
                               id="submenu_text_color" 
                               name="submenu_text_color" 
                               value="<?php echo esc_attr($settings['submenu_text_color'] ?? '#ffffff'); ?>" 
                               class="mas-v2-color">
                        <small class="mas-v2-help-text"><?php esc_html_e('Kolor tekstu elementów podmenu', 'modern-admin-styler-v2'); ?></small>
                    </div>
                    
                    <!-- Submenu Hover Background -->
                    <div class="mas-v2-field">
                        <label for="submenu_hover_bg_color" class="mas-v2-label">
                            👆 <?php esc_html_e('Tło po najechaniu', 'modern-admin-styler-v2'); ?>
                        </label>
                        <input type="color" 
                               id="submenu_hover_bg_color" 
                               name="submenu_hover_bg_color" 
                               value="<?php echo esc_attr($settings['submenu_hover_bg_color'] ?? '#32373c'); ?>" 
                               class="mas-v2-color">
                        <small class="mas-v2-help-text"><?php esc_html_e('Kolor tła elementu podmenu po najechaniu', 'modern-admin-styler-v2'); ?></small>
                    </div>
                    
                    <!-- Submenu Hover Text Color -->
                    <div class="mas-v2-field">
                        <label for="submenu_hover_text_color" class="mas-v2-label">
                            👆 <?php esc_html_e('Kolor tekstu po najechaniu', 'modern-admin-styler-v2'); ?>
                        </label>
                        <input type="color" 
                               id="submenu_hover_text_color" 
                               name="submenu_hover_text_color" 
                               value="<?php echo esc_attr($settings['submenu_hover_text_color'] ?? '#00a0d2'); ?>" 
                               class="mas-v2-color">
                        <small class="mas-v2-help-text"><?php esc_html_e('Kolor tekstu elementu podmenu po najechaniu', 'modern-admin-styler-v2'); ?></small>
                    </div>
                    
                    <!-- Submenu Active Background -->
                    <div class="mas-v2-field">
                        <label for="submenu_active_bg_color" class="mas-v2-label">
                            🎯 <?php esc_html_e('Tło aktywnego elementu', 'modern-admin-styler-v2'); ?>
                        </label>
                        <input type="color" 
                               id="submenu_active_bg_color" 
                               name="submenu_active_bg_color" 
                               value="<?php echo esc_attr($settings['submenu_active_bg_color'] ?? '#0073aa'); ?>" 
                               class="mas-v2-color">
                        <small class="mas-v2-help-text"><?php esc_html_e('Kolor tła aktywnego elementu podmenu', 'modern-admin-styler-v2'); ?></small>
                    </div>
                    
                    <!-- Submenu Width -->
                    <div class="mas-v2-field">
                        <label for="menu_submenu_width" class="mas-v2-label">
                            📏 <?php esc_html_e('Szerokość podmenu', 'modern-admin-styler-v2'); ?>
                            <span class="mas-v2-slider-value" data-target="menu_submenu_width"><?php echo esc_html($settings['menu_submenu_width'] ?? 200); ?>px</span>
                        </label>
                        <input type="range" 
                               id="menu_submenu_width" 
                               name="menu_submenu_width" 
                               min="150" 
                               max="400" 
                               value="<?php echo esc_attr($settings['menu_submenu_width'] ?? 200); ?>" 
                               class="mas-v2-slider">
                        <small class="mas-v2-help-text"><?php esc_html_e('Szerokość rozwijanych podmenu (150-400px)', 'modern-admin-styler-v2'); ?></small>
                    </div>
                    
                    <!-- Submenu Indent -->
                    <div class="mas-v2-field">
                        <label for="submenu_indent" class="mas-v2-label">
                            📐 <?php esc_html_e('Wcięcie', 'modern-admin-styler-v2'); ?>
                            <span class="mas-v2-slider-value" data-target="submenu_indent"><?php echo esc_html($settings['submenu_indent'] ?? 20); ?>px</span>
                        </label>
                        <input type="range" 
                               id="submenu_indent" 
                               name="submenu_indent" 
                               min="0" 
                               max="40" 
                               value="<?php echo esc_attr($settings['submenu_indent'] ?? 20); ?>" 
                               class="mas-v2-slider">
                        <small class="mas-v2-help-text"><?php esc_html_e('Wcięcie elementów podmenu od lewej krawędzi', 'modern-admin-styler-v2'); ?></small>
                    </div>
                    
                    <!-- Submenu Separator -->
                    <div class="mas-v2-field">
                        <label class="mas-v2-checkbox">
                            <input type="checkbox" 
                                   name="submenu_separator" 
                                   value="1" 
                                   <?php checked($settings['submenu_separator'] ?? false); ?>>
                            <span class="mas-v2-checkbox-mark"></span>
                            📏 <?php esc_html_e('Separator', 'modern-admin-styler-v2'); ?>
                        </label>
                        <small class="mas-v2-help-text"><?php esc_html_e('Pokazuj linię oddzielającą podmenu od głównego menu', 'modern-admin-styler-v2'); ?></small>
                    </div>
                    
                    <!-- Submenu Indicator Style -->
                    <div class="mas-v2-field">
                        <label for="submenu_indicator_style" class="mas-v2-label">
                            🔽 <?php esc_html_e('Styl wskaźnika', 'modern-admin-styler-v2'); ?>
                        </label>
                        <select id="submenu_indicator_style" name="submenu_indicator_style" class="mas-v2-input">
                            <option value="arrow" <?php selected($settings['submenu_indicator_style'] ?? '', 'arrow'); ?>>
                                ➤ <?php esc_html_e('Strzałka', 'modern-admin-styler-v2'); ?>
                            </option>
                            <option value="chevron" <?php selected($settings['submenu_indicator_style'] ?? '', 'chevron'); ?>>
                                〉 <?php esc_html_e('Chevron', 'modern-admin-styler-v2'); ?>
                            </option>
                            <option value="plus" <?php selected($settings['submenu_indicator_style'] ?? '', 'plus'); ?>>
                                ＋ <?php esc_html_e('Plus', 'modern-admin-styler-v2'); ?>
                            </option>
                            <option value="none" <?php selected($settings['submenu_indicator_style'] ?? '', 'none'); ?>>
                                ○ <?php esc_html_e('Brak', 'modern-admin-styler-v2'); ?>
                            </option>
                        </select>
                        <small class="mas-v2-help-text"><?php esc_html_e('Styl wskaźnika rozwijania podmenu', 'modern-admin-styler-v2'); ?></small>
                    </div>
                    </div>
                    </div>
                    
            <!-- 4. TYPOGRAPHY TAB (Typografia) -->
            <div id="typography" class="mas-v2-tab-content <?php echo $active_tab === 'typography' ? 'active' : ''; ?>" role="tabpanel">
                
                <!-- Sekcja: Czcionki Główne -->
                <div class="mas-v2-card">
                    <div class="mas-v2-card-header">
                        <h2 class="mas-v2-card-title">🔤 <?php esc_html_e('Czcionki Główne', 'modern-admin-styler-v2'); ?></h2>
                        <p class="mas-v2-card-description"><?php esc_html_e('Wybór rodziny czcionek dla różnych elementów', 'modern-admin-styler-v2'); ?></p>
                    </div>
                    
                    <!-- Body Font -->
                    <div class="mas-v2-field">
                        <label for="body_font" class="mas-v2-label">
                            📝 <?php esc_html_e('Czcionka dla treści', 'modern-admin-styler-v2'); ?>
                        </label>
                        <select id="body_font" name="body_font" class="mas-v2-input">
                            <option value="system" <?php selected($settings['body_font'] ?? '', 'system'); ?>>
                                🖥️ <?php esc_html_e('Systemowa', 'modern-admin-styler-v2'); ?>
                            </option>
                            <option value="inter" <?php selected($settings['body_font'] ?? '', 'inter'); ?>>
                                📖 <?php esc_html_e('Inter', 'modern-admin-styler-v2'); ?>
                            </option>
                            <option value="roboto" <?php selected($settings['body_font'] ?? '', 'roboto'); ?>>
                                🤖 <?php esc_html_e('Roboto', 'modern-admin-styler-v2'); ?>
                            </option>
                            <option value="open-sans" <?php selected($settings['body_font'] ?? '', 'open-sans'); ?>>
                                📰 <?php esc_html_e('Open Sans', 'modern-admin-styler-v2'); ?>
                            </option>
                            <option value="lato" <?php selected($settings['body_font'] ?? '', 'lato'); ?>>
                                📄 <?php esc_html_e('Lato', 'modern-admin-styler-v2'); ?>
                            </option>
                        </select>
                        <small class="mas-v2-help-text"><?php esc_html_e('Czcionka używana w treści panelu administracyjnego', 'modern-admin-styler-v2'); ?></small>
                    </div>
                    
                    <!-- Headings Font -->
                    <div class="mas-v2-field">
                        <label for="headings_font" class="mas-v2-label">
                            🏷️ <?php esc_html_e('Czcionka dla nagłówków', 'modern-admin-styler-v2'); ?>
                        </label>
                        <select id="headings_font" name="headings_font" class="mas-v2-input">
                            <option value="inherit" <?php selected($settings['headings_font'] ?? '', 'inherit'); ?>>
                                ↗️ <?php esc_html_e('Jak treść', 'modern-admin-styler-v2'); ?>
                            </option>
                            <option value="system" <?php selected($settings['headings_font'] ?? '', 'system'); ?>>
                                🖥️ <?php esc_html_e('Systemowa', 'modern-admin-styler-v2'); ?>
                            </option>
                            <option value="playfair" <?php selected($settings['headings_font'] ?? '', 'playfair'); ?>>
                                🎭 <?php esc_html_e('Playfair Display', 'modern-admin-styler-v2'); ?>
                            </option>
                            <option value="montserrat" <?php selected($settings['headings_font'] ?? '', 'montserrat'); ?>>
                                🎨 <?php esc_html_e('Montserrat', 'modern-admin-styler-v2'); ?>
                            </option>
                        </select>
                        <small class="mas-v2-help-text"><?php esc_html_e('Czcionka używana w nagłówkach (H1-H6)', 'modern-admin-styler-v2'); ?></small>
                    </div>
                    </div>
                    
                <!-- Sekcja: Rozmiary i Odstępy -->
                <div class="mas-v2-card">
                    <div class="mas-v2-card-header">
                        <h2 class="mas-v2-card-title">📐 <?php esc_html_e('Rozmiary i Odstępy', 'modern-admin-styler-v2'); ?></h2>
                        <p class="mas-v2-card-description"><?php esc_html_e('Kontrola nad rozmiarami czcionek i interlinią', 'modern-admin-styler-v2'); ?></p>
                    </div>
                    
                    <!-- Body Font Size -->
                    <div class="mas-v2-field">
                        <label for="global_font_size" class="mas-v2-label">
                            🔤 <?php esc_html_e('Rozmiar czcionki dla treści', 'modern-admin-styler-v2'); ?>
                            <span class="mas-v2-slider-value" data-target="global_font_size"><?php echo esc_html($settings['global_font_size'] ?? 14); ?>px</span>
                        </label>
                        <input type="range" 
                               id="global_font_size" 
                               name="global_font_size" 
                               min="12" 
                               max="18" 
                               value="<?php echo esc_attr($settings['global_font_size'] ?? 14); ?>" 
                               class="mas-v2-slider">
                        <small class="mas-v2-help-text"><?php esc_html_e('Podstawowy rozmiar tekstu w panelu (12-18px)', 'modern-admin-styler-v2'); ?></small>
                    </div>
                    
                    <!-- Body Line Height -->
                    <div class="mas-v2-field">
                        <label for="global_line_height" class="mas-v2-label">
                            📏 <?php esc_html_e('Interlinia dla treści', 'modern-admin-styler-v2'); ?>
                            <span class="mas-v2-slider-value" data-target="global_line_height"><?php echo esc_html($settings['global_line_height'] ?? 1.5); ?></span>
                        </label>
                        <input type="range" 
                               id="global_line_height" 
                               name="global_line_height" 
                               min="1.2" 
                               max="2.0" 
                               step="0.1"
                               value="<?php echo esc_attr($settings['global_line_height'] ?? 1.5); ?>" 
                               class="mas-v2-slider">
                        <small class="mas-v2-help-text"><?php esc_html_e('Odstęp między liniami tekstu (1.2 = ciasno, 2.0 = luźno)', 'modern-admin-styler-v2'); ?></small>
                    </div>
                    
                    <!-- NOWA OPCJA: Headings Scale -->
                    <div class="mas-v2-field">
                        <label for="headings_scale" class="mas-v2-label">
                            🎚️ <?php esc_html_e('Skala nagłówków (NOWA OPCJA!)', 'modern-admin-styler-v2'); ?>
                            <span class="mas-v2-slider-value" data-target="headings_scale"><?php echo esc_html(($settings['headings_scale'] ?? 1.0) * 100); ?>%</span>
                        </label>
                        <input type="range" 
                               id="headings_scale" 
                               name="headings_scale" 
                               min="0.8" 
                               max="1.5" 
                               step="0.1"
                               value="<?php echo esc_attr($settings['headings_scale'] ?? 1.0); ?>" 
                               class="mas-v2-slider">
                        <small class="mas-v2-help-text"><?php esc_html_e('🎯 NOWE! Proporcjonalne powiększanie/zmniejszanie wszystkich nagłówków H1-H6', 'modern-admin-styler-v2'); ?></small>
                    </div>
                </div>
            </div>

            <!-- 5. ADVANCED TAB (Zaawansowane) -->
            <div id="advanced" class="mas-v2-tab-content <?php echo $active_tab === 'advanced' ? 'active' : ''; ?>" role="tabpanel">
                
                <!-- Sekcja: Modyfikacje Interfejsu -->
                    <div class="mas-v2-card">
                        <div class="mas-v2-card-header">
                        <h2 class="mas-v2-card-title">🔧 <?php esc_html_e('Modyfikacje Interfejsu', 'modern-admin-styler-v2'); ?></h2>
                        <p class="mas-v2-card-description"><?php esc_html_e('Zaawansowane opcje modyfikacji standardowego interfejsu WordPress', 'modern-admin-styler-v2'); ?></p>
                        </div>
                        
                    <!-- Hide "Help" Tab -->
                        <div class="mas-v2-field">
                            <label class="mas-v2-checkbox">
                                <input type="checkbox" 
                                   name="hide_help_tab" 
                                       value="1" 
                                   <?php checked($settings['hide_help_tab'] ?? false); ?>>
                                <span class="mas-v2-checkbox-mark"></span>
                            🙈 <?php esc_html_e('Ukryj zakładkę "Pomoc"', 'modern-admin-styler-v2'); ?>
                            </label>
                        <small class="mas-v2-help-text"><?php esc_html_e('Usuwa zakładkę "Pomoc" z prawego górnego rogu', 'modern-admin-styler-v2'); ?></small>
                        </div>
                            
                    <!-- Hide "Screen Options" Tab -->
                            <div class="mas-v2-field">
                            <label class="mas-v2-checkbox">
                                <input type="checkbox" 
                                   name="hide_screen_options" 
                                       value="1" 
                                   <?php checked($settings['hide_screen_options'] ?? false); ?>>
                                <span class="mas-v2-checkbox-mark"></span>
                            🙈 <?php esc_html_e('Ukryj "Opcje ekranu"', 'modern-admin-styler-v2'); ?>
                                </label>
                        <small class="mas-v2-help-text"><?php esc_html_e('Usuwa zakładkę "Opcje ekranu" z prawego górnego rogu', 'modern-admin-styler-v2'); ?></small>
                            </div>
                            
                    <!-- Hide WP Version in Footer -->
                            <div class="mas-v2-field">
                                <label class="mas-v2-checkbox">
                                    <input type="checkbox" 
                                   name="hide_wp_version" 
                                           value="1" 
                                   <?php checked($settings['hide_wp_version'] ?? false); ?>>
                                    <span class="mas-v2-checkbox-mark"></span>
                            🙈 <?php esc_html_e('Ukryj wersję WP w stopce', 'modern-admin-styler-v2'); ?>
                                </label>
                        <small class="mas-v2-help-text"><?php esc_html_e('Usuwa informację o wersji WordPress ze stopki panelu', 'modern-admin-styler-v2'); ?></small>
                            </div>
                            </div>
                            
                <!-- Sekcja: Powiadomienia -->
                <div class="mas-v2-card">
                    <div class="mas-v2-card-header">
                        <h2 class="mas-v2-card-title">🔔 <?php esc_html_e('Powiadomienia', 'modern-admin-styler-v2'); ?></h2>
                        <p class="mas-v2-card-description"><?php esc_html_e('Kontrola nad powiadomieniami i alertami w panelu', 'modern-admin-styler-v2'); ?></p>
                    </div>
                    
                    <!-- Hide All Admin Notices -->
                    <div class="mas-v2-field">
                        <label class="mas-v2-checkbox">
                            <input type="checkbox" 
                                   name="hide_admin_notices" 
                                   value="1" 
                                   <?php checked($settings['hide_admin_notices'] ?? false); ?>>
                            <span class="mas-v2-checkbox-mark"></span>
                            🙈 <?php esc_html_e('Ukryj wszystkie powiadomienia administratora', 'modern-admin-styler-v2'); ?>
                        </label>
                        <small class="mas-v2-help-text"><?php esc_html_e('Usuwa wszystkie powiadomienia (notices) z panelu administracyjnego', 'modern-admin-styler-v2'); ?></small>
                    </div>
                    </div>
                    
                <!-- Sekcja: OPTYMALIZACJA (NOWA!) -->
                <div class="mas-v2-card">
                    <div class="mas-v2-card-header">
                        <h2 class="mas-v2-card-title">⚡ <?php esc_html_e('Optymalizacja (NOWA SEKCJA!)', 'modern-admin-styler-v2'); ?></h2>
                        <p class="mas-v2-card-description"><?php esc_html_e('🎯 NOWE! Proste przełączniki do wyłączania niepotrzebnych funkcji WordPress', 'modern-admin-styler-v2'); ?></p>
                    </div>
                    
                    <!-- Disable Emojis -->
                    <div class="mas-v2-field">
                        <label class="mas-v2-checkbox">
                            <input type="checkbox" 
                                   name="disable_emojis" 
                                   value="1" 
                                   <?php checked($settings['disable_emojis'] ?? false); ?>>
                            <span class="mas-v2-checkbox-mark"></span>
                            😶 <?php esc_html_e('Wyłącz Emojis', 'modern-admin-styler-v2'); ?>
                        </label>
                        <small class="mas-v2-help-text"><?php esc_html_e('Usuwa obsługę emoji z WordPress (mniejszy rozmiar strony)', 'modern-admin-styler-v2'); ?></small>
                    </div>
                    
                    <!-- Disable Embeds -->
                    <div class="mas-v2-field">
                        <label class="mas-v2-checkbox">
                            <input type="checkbox" 
                                   name="disable_embeds" 
                                   value="1" 
                                   <?php checked($settings['disable_embeds'] ?? false); ?>>
                            <span class="mas-v2-checkbox-mark"></span>
                            📺 <?php esc_html_e('Wyłącz osadzanie', 'modern-admin-styler-v2'); ?>
                        </label>
                        <small class="mas-v2-help-text"><?php esc_html_e('Wyłącza automatyczne osadzanie treści (YouTube, Twitter itp.)', 'modern-admin-styler-v2'); ?></small>
                    </div>
                    
                    <!-- Remove jQuery Migrate -->
                    <div class="mas-v2-field">
                        <label class="mas-v2-checkbox">
                            <input type="checkbox" 
                                   name="remove_jquery_migrate" 
                                   value="1" 
                                   <?php checked($settings['remove_jquery_migrate'] ?? false); ?>>
                            <span class="mas-v2-checkbox-mark"></span>
                            🗑️ <?php esc_html_e('Usuń jQuery Migrate', 'modern-admin-styler-v2'); ?>
                        </label>
                        <small class="mas-v2-help-text"><?php esc_html_e('Usuwa przestarzały jQuery Migrate (może przyspieszyć stronę)', 'modern-admin-styler-v2'); ?></small>
                </div>
            </div>

                <!-- Sekcja: Content (PRZENIESIONE TUTAJ!) -->
                    <div class="mas-v2-card">
                        <div class="mas-v2-card-header">
                        <h2 class="mas-v2-card-title">📄 <?php esc_html_e('Obszar Treści (przeniesione z osobnej zakładki)', 'modern-admin-styler-v2'); ?></h2>
                        <p class="mas-v2-card-description"><?php esc_html_e('🎯 REORGANIZOWANE! Opcje stylowania głównego obszaru treści', 'modern-admin-styler-v2'); ?></p>
                        </div>
                            
                    <!-- Content Background -->
                            <div class="mas-v2-field">
                        <label for="content_background_color" class="mas-v2-label">
                            🎨 <?php esc_html_e('Kolor tła treści', 'modern-admin-styler-v2'); ?>
                                </label>
                        <input type="color" 
                               id="content_background_color" 
                               name="content_background_color" 
                               value="<?php echo esc_attr($settings['content_background_color'] ?? '#ffffff'); ?>" 
                               class="mas-v2-color">
                        <small class="mas-v2-help-text"><?php esc_html_e('Kolor tła głównego obszaru treści', 'modern-admin-styler-v2'); ?></small>
                            </div>
                            
                    <!-- Content Padding -->
                            <div class="mas-v2-field">
                        <label for="content_padding" class="mas-v2-label">
                            📦 <?php esc_html_e('Wewnętrzne odstępy treści', 'modern-admin-styler-v2'); ?>
                            <span class="mas-v2-slider-value" data-target="content_padding"><?php echo esc_html($settings['content_padding'] ?? 20); ?>px</span>
                                </label>
                            <input type="range" 
                               id="content_padding" 
                               name="content_padding" 
                               min="0" 
                               max="50" 
                               value="<?php echo esc_attr($settings['content_padding'] ?? 20); ?>" 
                                   class="mas-v2-slider">
                        <small class="mas-v2-help-text"><?php esc_html_e('Wewnętrzne odstępy obszaru treści', 'modern-admin-styler-v2'); ?></small>
                            </div>
                            
                    <!-- Content Border Radius -->
                            <div class="mas-v2-field">
                        <label for="content_border_radius" class="mas-v2-label">
                            ⭕ <?php esc_html_e('Zaokrąglenie rogów treści', 'modern-admin-styler-v2'); ?>
                            <span class="mas-v2-slider-value" data-target="content_border_radius"><?php echo esc_html($settings['content_border_radius'] ?? 0); ?>px</span>
                                </label>
                            <input type="range" 
                               id="content_border_radius" 
                               name="content_border_radius" 
                               min="0" 
                               max="30" 
                               value="<?php echo esc_attr($settings['content_border_radius'] ?? 0); ?>" 
                                   class="mas-v2-slider">
                        <small class="mas-v2-help-text"><?php esc_html_e('Zaokrąglenie rogów obszaru treści', 'modern-admin-styler-v2'); ?></small>
                            </div>
                        </div>
                            
                <!-- Sekcja: Buttons (PRZENIESIONE TUTAJ!) -->
                        <div class="mas-v2-card">
                        <div class="mas-v2-card-header">
                        <h2 class="mas-v2-card-title">🔘 <?php esc_html_e('Przyciski (przeniesione z osobnej zakładki)', 'modern-admin-styler-v2'); ?></h2>
                        <p class="mas-v2-card-description"><?php esc_html_e('🎯 REORGANIZOWANE! Stylowanie przycisków w panelu administracyjnym', 'modern-admin-styler-v2'); ?></p>
                            </div>
                            
                    <!-- Button Background -->
                            <div class="mas-v2-field">
                        <label for="button_bg_color" class="mas-v2-label">
                            🎨 <?php esc_html_e('Kolor tła przycisku', 'modern-admin-styler-v2'); ?>
                                </label>
                            <input type="color" 
                               id="button_bg_color" 
                               name="button_bg_color" 
                               value="<?php echo esc_attr($settings['button_bg_color'] ?? '#0073aa'); ?>" 
                               class="mas-v2-color">
                        <small class="mas-v2-help-text"><?php esc_html_e('Kolor tła głównych przycisków', 'modern-admin-styler-v2'); ?></small>
                            </div>
                            
                    <!-- Button Text Color -->
                            <div class="mas-v2-field">
                            <label for="button_text_color" class="mas-v2-label">
                            ✏️ <?php esc_html_e('Kolor tekstu przycisku', 'modern-admin-styler-v2'); ?>
                                </label>
                            <input type="color" 
                                   id="button_text_color" 
                                   name="button_text_color" 
                                   value="<?php echo esc_attr($settings['button_text_color'] ?? '#ffffff'); ?>" 
                               class="mas-v2-color">
                        <small class="mas-v2-help-text"><?php esc_html_e('Kolor tekstu na przyciskach', 'modern-admin-styler-v2'); ?></small>
                            </div>
                            
                    <!-- Button Border Radius -->
                            <div class="mas-v2-field">
                            <label for="button_border_radius" class="mas-v2-label">
                            ⭕ <?php esc_html_e('Zaokrąglenie przycisków', 'modern-admin-styler-v2'); ?>
                            <span class="mas-v2-slider-value" data-target="button_border_radius"><?php echo esc_html($settings['button_border_radius'] ?? 3); ?>px</span>
                                </label>
                            <input type="range" 
                                   id="button_border_radius" 
                                   name="button_border_radius" 
                                   min="0" 
                               max="25" 
                               value="<?php echo esc_attr($settings['button_border_radius'] ?? 3); ?>" 
                                   class="mas-v2-slider">
                        <small class="mas-v2-help-text"><?php esc_html_e('Zaokrąglenie rogów przycisków', 'modern-admin-styler-v2'); ?></small>
                            </div>
                            </div>
                        </div>

            <!-- 6. 3D EFFECTS TAB (💎 PREMIUM FEATURES!) -->
            <div id="3d-effects" class="mas-v2-tab-content <?php echo $active_tab === '3d-effects' ? 'active' : ''; ?>" role="tabpanel">
                
                <!-- GŁÓWNE USTAWIENIA 3D -->
                <div class="mas-v2-card">
                    <div class="mas-v2-card-header">
                        <h2 class="mas-v2-card-title">💎 <?php esc_html_e('Global 3D System (ZAJEBISTE!)', 'modern-admin-styler-v2'); ?></h2>
                        <p class="mas-v2-card-description"><?php esc_html_e('🔥 System zajebistych efektów 3D dla całego WordPressa!', 'modern-admin-styler-v2'); ?></p>
                    </div>
                    
                    <!-- Enable Global 3D Effects -->
                    <div class="mas-v2-field mas-v2-field-important">
                        <label class="mas-v2-toggle">
                             <input type="checkbox" 
                                   name="enable_global_3d" 
                                    value="1" 
                                   <?php checked($settings['enable_global_3d'] ?? true); ?>>
                            <span class="mas-v2-toggle-slider"></span>
                            <span class="mas-v2-label mas-v2-checkbox-important">🚀 Enable Global 3D Effects System</span>
                         </label>
                        <small class="mas-v2-help-text">🔥 Włącza zajebiste efekty 3D dla całego WordPressa (wszystkie przyciski, karty, tabele)</small>
                     </div>
                     
                    <!-- 3D Intensity -->
                         <div class="mas-v2-field">
                        <label for="3d_intensity" class="mas-v2-label">
                            🎚️ <?php esc_html_e('Intensywność efektów 3D', 'modern-admin-styler-v2'); ?>
                            <span class="mas-v2-slider-value" data-target="3d_intensity"><?php echo esc_html(($settings['3d_intensity'] ?? 1.0) * 100); ?>%</span>
                             </label>
                             <input type="range" 
                               id="3d_intensity" 
                               name="3d_intensity" 
                               min="0.3" 
                               max="2.0" 
                               step="0.1"
                               value="<?php echo esc_attr($settings['3d_intensity'] ?? 1.0); ?>" 
                                    class="mas-v2-slider">
                        <small class="mas-v2-help-text">💫 Kontrola siły efektów 3D (30% = subtelne, 200% = ekstremalne)</small>
                         </div>
                         
                    <!-- 3D Performance Mode -->
                         <div class="mas-v2-field">
                        <label for="3d_performance_mode" class="mas-v2-label">
                            ⚡ <?php esc_html_e('Tryb wydajności 3D', 'modern-admin-styler-v2'); ?>
                             </label>
                        <select id="3d_performance_mode" name="3d_performance_mode" class="mas-v2-select">
                            <option value="high" <?php selected($settings['3d_performance_mode'] ?? '', 'high'); ?>>
                                🔥 High Performance (wszystkie efekty)
                                 </option>
                            <option value="balanced" <?php selected($settings['3d_performance_mode'] ?? '', 'balanced'); ?>>
                                ⚖️ Balanced (zrównoważone)
                                 </option>
                            <option value="low" <?php selected($settings['3d_performance_mode'] ?? '', 'low'); ?>>
                                💡 Low Performance (podstawowe efekty)
                                 </option>
                             </select>
                        <small class="mas-v2-help-text">⚡ Dostosuj wydajność do możliwości urządzenia</small>
                         </div>
                         </div>
                         
                <!-- GLASSMORPHISM SYSTEM -->
                <div class="mas-v2-card">
                    <div class="mas-v2-card-header">
                        <h2 class="mas-v2-card-title">🌟 <?php esc_html_e('Glassmorphism System', 'modern-admin-styler-v2'); ?></h2>
                        <p class="mas-v2-card-description"><?php esc_html_e('Kontrola nad efektami szkła i blur dla całego WordPressa', 'modern-admin-styler-v2'); ?></p>
                             </div>
                             
                    <!-- Enable Glassmorphism -->
                             <div class="mas-v2-field">
                        <label class="mas-v2-toggle">
                             <input type="checkbox" 
                                   name="enable_glassmorphism" 
                                    value="1" 
                                   <?php checked($settings['enable_glassmorphism'] ?? true); ?>>
                            <span class="mas-v2-toggle-slider"></span>
                            <span class="mas-v2-label">✨ Enable Global Glassmorphism</span>
                         </label>
                        <small class="mas-v2-help-text">🌊 Dodaje efekty szkła z blur do wszystkich elementów WP</small>
                     </div>
                     
                    <!-- Glass Blur Intensity -->
                         <div class="mas-v2-field">
                        <label for="glass_blur_intensity" class="mas-v2-label">
                            🌊 <?php esc_html_e('Intensywność blur', 'modern-admin-styler-v2'); ?>
                            <span class="mas-v2-slider-value" data-target="glass_blur_intensity"><?php echo esc_html($settings['glass_blur_intensity'] ?? 12); ?>px</span>
                                 </label>
                                 <input type="range" 
                               id="glass_blur_intensity" 
                               name="glass_blur_intensity" 
                               min="4" 
                               max="30" 
                               value="<?php echo esc_attr($settings['glass_blur_intensity'] ?? 12); ?>" 
                               class="mas-v2-slider">
                        <small class="mas-v2-help-text">🌫️ Kontrola rozmycia tła elementów (4px = subtelne, 30px = mocne)</small>
                             </div>
                             
                    <!-- Glass Transparency -->
                             <div class="mas-v2-field">
                        <label for="glass_transparency" class="mas-v2-label">
                            👻 <?php esc_html_e('Przezroczystość szkła', 'modern-admin-styler-v2'); ?>
                            <span class="mas-v2-slider-value" data-target="glass_transparency"><?php echo esc_html(($settings['glass_transparency'] ?? 0.1) * 100); ?>%</span>
                                 </label>
                                 <input type="range" 
                               id="glass_transparency" 
                               name="glass_transparency" 
                               min="0.05" 
                               max="0.3" 
                               step="0.01"
                               value="<?php echo esc_attr($settings['glass_transparency'] ?? 0.1); ?>" 
                               class="mas-v2-slider">
                        <small class="mas-v2-help-text">💫 Przezroczystość elementów szkłanych (5% = prawie niewidoczne, 30% = bardzo widoczne)</small>
                         </div>
                         
                    <!-- Animated Background -->
                         <div class="mas-v2-field">
                        <label class="mas-v2-toggle">
                                         <input type="checkbox" 
                                   name="enable_animated_background" 
                                                value="1" 
                                   <?php checked($settings['enable_animated_background'] ?? true); ?>>
                            <span class="mas-v2-toggle-slider"></span>
                            <span class="mas-v2-label">🌈 Animowane tło gradientowe</span>
                                     </label>
                        <small class="mas-v2-help-text">🎨 Włącza animowane tło gradientowe dla całego WordPressa (15s loop)</small>
                                 </div>
                                 </div>
                                 
                <!-- INTERACTIVE 3D EFFECTS -->
                <div class="mas-v2-card">
                    <div class="mas-v2-card-header">
                        <h2 class="mas-v2-card-title">🎪 <?php esc_html_e('Interactive 3D Effects', 'modern-admin-styler-v2'); ?></h2>
                        <p class="mas-v2-card-description"><?php esc_html_e('Zaawansowane interakcje 3D dla elementów interfejsu', 'modern-admin-styler-v2'); ?></p>
                                 </div>
                                 
                    <!-- Enable Mouse Parallax -->
                                 <div class="mas-v2-field">
                        <label class="mas-v2-toggle">
                                         <input type="checkbox" 
                                   name="enable_mouse_parallax" 
                                                value="1" 
                                   <?php checked($settings['enable_mouse_parallax'] ?? true); ?>>
                            <span class="mas-v2-toggle-slider"></span>
                            <span class="mas-v2-label">🖱️ Mouse Parallax Effects</span>
                                     </label>
                        <small class="mas-v2-help-text">🎯 Elementy podążają za kursorem z efektem paralaksy</small>
                         </div>
                         
                    <!-- Enable Card Hover 3D -->
                             <div class="mas-v2-field">
                        <label class="mas-v2-toggle">
                                     <input type="checkbox" 
                                   name="enable_card_hover_3d" 
                                            value="1" 
                                   <?php checked($settings['enable_card_hover_3d'] ?? true); ?>>
                            <span class="mas-v2-toggle-slider"></span>
                            <span class="mas-v2-label">🃏 3D Card Hover Effects</span>
                                 </label>
                        <small class="mas-v2-help-text">💎 Karty unoszą się i obracają w 3D na hover</small>
                             </div>
                             
                    <!-- Enable Button 3D -->
                             <div class="mas-v2-field">
                        <label class="mas-v2-toggle">
                                     <input type="checkbox" 
                                   name="enable_button_3d" 
                                            value="1" 
                                   <?php checked($settings['enable_button_3d'] ?? true); ?>>
                            <span class="mas-v2-toggle-slider"></span>
                            <span class="mas-v2-label">🔘 3D Button Interactions</span>
                                 </label>
                        <small class="mas-v2-help-text">🚀 Przyciski z efektami 3D (hover, press, glow)</small>
                             </div>
                             
                    <!-- Enable Card Flip -->
                             <div class="mas-v2-field">
                        <label class="mas-v2-toggle">
                                     <input type="checkbox" 
                                   name="enable_card_flip" 
                                            value="1" 
                                   <?php checked($settings['enable_card_flip'] ?? true); ?>>
                            <span class="mas-v2-toggle-slider"></span>
                            <span class="mas-v2-label">🔄 Card Flip Effects</span>
                                 </label>
                        <small class="mas-v2-help-text">🎪 Dashboard widgets flip 180° na double-click</small>
                             </div>
                         </div>
                         
                <!-- PREMIUM TYPOGRAPHY 3D -->
                <div class="mas-v2-card">
                    <div class="mas-v2-card-header">
                        <h2 class="mas-v2-card-title">✨ <?php esc_html_e('Premium Typography 3D', 'modern-admin-styler-v2'); ?></h2>
                        <p class="mas-v2-card-description"><?php esc_html_e('Zajebista typografia z efektami gradientów i animacji', 'modern-admin-styler-v2'); ?></p>
                     </div>
                     
                    <!-- Enable Gradient Headings -->
                     <div class="mas-v2-field">
                        <label class="mas-v2-toggle">
                             <input type="checkbox" 
                                   name="enable_gradient_headings" 
                                    value="1" 
                                   <?php checked($settings['enable_gradient_headings'] ?? true); ?>>
                            <span class="mas-v2-toggle-slider"></span>
                            <span class="mas-v2-label">🌈 Gradient Headings</span>
                         </label>
                        <small class="mas-v2-help-text">🎨 Nagłówki z gradientowymi kolorami (H1-H6)</small>
                     </div>
                     
                    <!-- Enable Text Shimmer -->
                             <div class="mas-v2-field">
                        <label class="mas-v2-toggle">
                                     <input type="checkbox" 
                                   name="enable_text_shimmer" 
                                            value="1" 
                                   <?php checked($settings['enable_text_shimmer'] ?? true); ?>>
                            <span class="mas-v2-toggle-slider"></span>
                            <span class="mas-v2-label">✨ Text Shimmer Animation</span>
                                 </label>
                        <small class="mas-v2-help-text">💫 Efekt shimmer na hover nad nagłówkami</small>
                             </div>
                             
                    <!-- Enable Text Reveal -->
                                 <div class="mas-v2-field">
                        <label class="mas-v2-toggle">
                                         <input type="checkbox" 
                                   name="enable_text_reveal" 
                                                value="1" 
                                   <?php checked($settings['enable_text_reveal'] ?? true); ?>>
                            <span class="mas-v2-toggle-slider"></span>
                            <span class="mas-v2-label">🎭 Text Reveal Animations</span>
                                     </label>
                        <small class="mas-v2-help-text">🌟 Tekst pojawia się z animacją podczas scrollowania</small>
                                 </div>
                                 
                    <!-- Typography Scale Factor -->
                                 <div class="mas-v2-field">
                        <label for="typography_scale_factor" class="mas-v2-label">
                            📐 <?php esc_html_e('Skala typografii premium', 'modern-admin-styler-v2'); ?>
                            <span class="mas-v2-slider-value" data-target="typography_scale_factor"><?php echo esc_html(($settings['typography_scale_factor'] ?? 1.0) * 100); ?>%</span>
                                     </label>
                        <input type="range" 
                               id="typography_scale_factor" 
                               name="typography_scale_factor" 
                               min="0.8" 
                               max="1.5" 
                               step="0.05"
                               value="<?php echo esc_attr($settings['typography_scale_factor'] ?? 1.0); ?>" 
                               class="mas-v2-slider">
                        <small class="mas-v2-help-text">🎯 Globalny mnożnik skali dla premium typography (80% = mniejsze, 150% = większe)</small>
                             </div>
                         </div>
                         
                <!-- FLOATING ELEMENTS -->
                    <div class="mas-v2-card">
                        <div class="mas-v2-card-header">
                        <h2 class="mas-v2-card-title">🎈 <?php esc_html_e('Floating Elements System', 'modern-admin-styler-v2'); ?></h2>
                        <p class="mas-v2-card-description"><?php esc_html_e('System pływających elementów i cząsteczek w tle', 'modern-admin-styler-v2'); ?></p>
                        </div>
                            
                    <!-- Enable Floating Particles -->
                            <div class="mas-v2-field">
                        <label class="mas-v2-toggle">
                                <input type="checkbox" 
                                   name="enable_floating_particles" 
                                       value="1" 
                                   <?php checked($settings['enable_floating_particles'] ?? true); ?>>
                            <span class="mas-v2-toggle-slider"></span>
                            <span class="mas-v2-label">✨ Floating Particles</span>
                                </label>
                        <small class="mas-v2-help-text">🌟 Animowane cząsteczki w tle (15 particles)</small>
                            </div>
                            
                    <!-- Particles Count -->
                            <div class="mas-v2-field">
                        <label for="particles_count" class="mas-v2-label">
                            🔢 <?php esc_html_e('Liczba cząsteczek', 'modern-admin-styler-v2'); ?>
                            <span class="mas-v2-slider-value" data-target="particles_count"><?php echo esc_html($settings['particles_count'] ?? 15); ?></span>
                            </label>
                            <input type="range" 
                               id="particles_count" 
                               name="particles_count" 
                               min="5" 
                               max="50" 
                               value="<?php echo esc_attr($settings['particles_count'] ?? 15); ?>" 
                                   class="mas-v2-slider">
                        <small class="mas-v2-help-text">⭐ Ilość animowanych cząsteczek (5 = minimalne, 50 = dużo)</small>
                        </div>
                            
                    <!-- Enable Custom Cursor -->
                            <div class="mas-v2-field">
                        <label class="mas-v2-toggle">
                                    <input type="checkbox" 
                                   name="enable_custom_cursor" 
                                           value="1" 
                                   <?php checked($settings['enable_custom_cursor'] ?? true); ?>>
                            <span class="mas-v2-toggle-slider"></span>
                            <span class="mas-v2-label">🖱️ Custom Glow Cursor</span>
                                </label>
                        <small class="mas-v2-help-text">💫 Niestandardowy kursor z efektem glow</small>
                            </div>

                    <!-- Enable 3D Tooltips -->
                        <div class="mas-v2-field">
                        <label class="mas-v2-toggle">
                                <input type="checkbox" 
                                   name="enable_3d_tooltips" 
                                       value="1" 
                                   <?php checked($settings['enable_3d_tooltips'] ?? true); ?>>
                            <span class="mas-v2-toggle-slider"></span>
                            <span class="mas-v2-label">💬 3D Glass Tooltips</span>
                            </label>
                        <small class="mas-v2-help-text">🎪 Tooltips z efektami szkła i 3D</small>
                        </div>
                        
                    <!-- Enable Parallax Scrolling -->
                        <div class="mas-v2-field">
                        <label class="mas-v2-toggle">
                                <input type="checkbox" 
                                   name="enable_parallax_scrolling" 
                                       value="1" 
                                   <?php checked($settings['enable_parallax_scrolling'] ?? true); ?>>
                            <span class="mas-v2-toggle-slider"></span>
                            <span class="mas-v2-label">🌊 Parallax Scrolling</span>
                            </label>
                        <small class="mas-v2-help-text">🎯 Efekt paralaksy podczas scrollowania</small>
                    </div>
                        </div>
                        
                <!-- PERFORMANCE & ACCESSIBILITY -->
                <div class="mas-v2-card">
                    <div class="mas-v2-card-header">
                        <h2 class="mas-v2-card-title">⚡ <?php esc_html_e('Performance & Accessibility', 'modern-admin-styler-v2'); ?></h2>
                        <p class="mas-v2-card-description"><?php esc_html_e('Optymalizacja wydajności i dostępności efektów 3D', 'modern-admin-styler-v2'); ?></p>
                        </div>
                        
                    <!-- Respect Reduced Motion -->
                        <div class="mas-v2-field">
                        <label class="mas-v2-toggle">
                                <input type="checkbox" 
                                   name="respect_reduced_motion" 
                                       value="1" 
                                   <?php checked($settings['respect_reduced_motion'] ?? true); ?>>
                            <span class="mas-v2-toggle-slider"></span>
                            <span class="mas-v2-label">♿ Respect Reduced Motion Preference</span>
                            </label>
                        <small class="mas-v2-help-text">🎯 Wyłącza animacje dla użytkowników preferujących mniej ruchu</small>
                        </div>
                        
                    <!-- Mobile 3D Optimization -->
                        <div class="mas-v2-field">
                        <label class="mas-v2-toggle">
                                <input type="checkbox" 
                                   name="mobile_3d_optimization" 
                                   value="1" 
                                   <?php checked($settings['mobile_3d_optimization'] ?? true); ?>>
                            <span class="mas-v2-toggle-slider"></span>
                            <span class="mas-v2-label">📱 Mobile 3D Optimization</span>
                            </label>
                        <small class="mas-v2-help-text">🚀 Redukuje efekty 3D na urządzeniach mobilnych dla lepszej wydajności</small>
                        </div>

                    <!-- Hardware Acceleration -->
                        <div class="mas-v2-field">
                        <label class="mas-v2-toggle">
                                <input type="checkbox" 
                                   name="hardware_acceleration" 
                                   value="1" 
                                   <?php checked($settings['hardware_acceleration'] ?? true); ?>>
                            <span class="mas-v2-toggle-slider"></span>
                            <span class="mas-v2-label">🏎️ Hardware Acceleration</span>
                            </label>
                        <small class="mas-v2-help-text">⚡ Włącza przyspieszenie sprzętowe dla płynniejszych animacji</small>
                        </div>

                    <!-- Debug Mode -->
                        <div class="mas-v2-field">
                        <label class="mas-v2-toggle">
                                <input type="checkbox" 
                                   name="3d_debug_mode" 
                                   value="1" 
                                   <?php checked($settings['3d_debug_mode'] ?? false); ?>>
                            <span class="mas-v2-toggle-slider"></span>
                            <span class="mas-v2-label">🐛 3D Debug Mode</span>
                            </label>
                        <small class="mas-v2-help-text">🔍 Włącza tryb debug z console.log dla efektów 3D</small>
                        </div>
                    </div>
                </div>
                
                        </div>
            </form>
                                </div>
                            </div>
                            
    <!-- REDESIGN: Floating Status Bar -->
    <div class="mas-v2-status-bar">
        <div class="mas-v2-status-content">
            <div class="mas-v2-status-item">
                <span class="mas-v2-status-label">Status:</span>
                <span class="mas-v2-status-value" id="mas-plugin-status">Active</span>
                                    </div>
            <div class="mas-v2-status-item">
                <span class="mas-v2-status-label">Live Preview:</span>
                <span class="mas-v2-status-value" id="mas-live-preview-status">Enabled</span>
                                </div>
            <div class="mas-v2-status-item">
                <span class="mas-v2-status-label">Options:</span>
                <span class="mas-v2-status-value">43/43</span>
                                </div>
            <div class="mas-v2-status-item">
                <span class="mas-v2-status-label">Performance:</span>
                <span class="mas-v2-status-value">Optimized</span>
                                </div>
                            </div>
                                </div>
                            </div>
                            
<style>
/* DEMO - Podgląd nowej architektury */
.mas-v2-field-important {
    background: linear-gradient(135deg, rgba(76, 175, 80, 0.1) 0%, rgba(76, 175, 80, 0.05) 100%);
    border: 2px solid rgba(76, 175, 80, 0.3);
    border-radius: 8px;
    padding: 1rem;
    margin-bottom: 1.5rem;
}

.mas-v2-checkbox-important {
    font-size: 1.1em;
    font-weight: 600;
}

.mas-v2-card-title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.mas-v2-greeting {
    font-size: 0.9em;
    opacity: 0.8;
}
</style>

<script>
// DEMO - Informacja o reorganizacji
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎯 NOWA ARCHITEKTURA INFORMACJI ZAŁADOWANA!');
    console.log('📂 Submenu teraz jest w sekcji Menu!');
    console.log('🔧 Login, Buttons, Content w sekcji Advanced!');
    console.log('✨ Logiczne grupowanie opcji!');
});
</script> 

<script>
jQuery(document).ready(function($) {
    console.log('🚀 MAS V2: Admin page loaded - delegating to admin-modern.js');
    
    // REDESIGN: Toggle field visibility - TYLKO te funkcje które nie są w admin-modern.js
    function toggleFloatingFields() {
        const menuFloating = $('input[name="menu_floating"]').is(':checked');
        const adminBarFloating = $('input[name="admin_bar_floating"]').is(':checked');
        
        $('.floating-only').toggle(menuFloating || adminBarFloating);
        $('.menu-floating-only').toggle(menuFloating);
        $('.admin-bar-floating-only').toggle(adminBarFloating);
    }
    
    // REDESIGN: Status Bar Updates
    function updateStatusBar() {
        const enablePlugin = $('input[name="enable_plugin"]').is(':checked');
        const livePreview = localStorage.getItem('mas_live_preview') === 'true';
        
        $('#mas-plugin-status').text(enablePlugin ? 'Active' : 'Disabled')
            .removeClass('active disabled').addClass(enablePlugin ? 'active' : 'disabled');
        
        $('#mas-live-preview-status').text(livePreview ? 'Enabled' : 'Disabled')
            .removeClass('active disabled').addClass(livePreview ? 'active' : 'disabled');
    }
    
    // REDESIGN: Initialize ONLY local functions
    toggleFloatingFields();
    updateStatusBar();
    
    $('input[name="menu_floating"], input[name="admin_bar_floating"]').on('change', toggleFloatingFields);
    $('input[name="enable_plugin"]').on('change', updateStatusBar);
    
    // Make updateStatusBar global for admin-modern.js
    window.updateStatusBar = updateStatusBar;
});
</script>

<?php
/**
 * 🎨 MODERN ADMIN STYLER V2 - REDESIGNED INTERFACE 
 * 
 * ✅ REDESIGN FEATURES:
 * - Modern glassmorphism design with gradient backgrounds
 * - Floating elements with backdrop blur effects
 * - Premium SaaS dashboard inspired interface
 * - Responsive mobile-first design
 * - Accessibility improvements (ARIA, keyboard navigation)
 * - Performance optimized CSS with hardware acceleration
 * - Real-time status bar with live updates
 * - Smooth animations and transitions
 * - Modern form elements (toggles, sliders, inputs)
 * - Professional card-based layout system
 * 
 * 🚀 RESULT: Premium, modern WordPress admin interface!
 */