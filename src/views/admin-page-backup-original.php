<?php
/**
 * Nowoczesny template strony administracyjnej - Modern Admin Styler V2
 * 
 * @package ModernAdminStylerV2
 * @version 2.1.0
 */

if (!defined('ABSPATH')) {
    exit;
}

// Bezpiečné pobranie zmiennych
$settings = $settings ?? [];
$tabs = $tabs ?? [];
$plugin_url = MAS_V2_PLUGIN_URL;

// Określ aktywną zakładkę na podstawie URL
$current_page = $_GET['page'] ?? 'mas-v2-settings';
$is_main_page = ($current_page === 'mas-v2-settings');
$active_tab = 'general';

// Mapowanie stron na zakładki
if (!$is_main_page) {
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
        case 'mas-v2-typography':
            $active_tab = 'typography';
            break;
        case 'mas-v2-effects':
            $active_tab = 'effects';
            break;
        case 'mas-v2-advanced':
            $active_tab = 'advanced';
            break;
    }
}
?>

<div class="mas-v2-admin-wrapper">
    <!-- Modern Header -->
    <div class="mas-v2-header">
        <div class="mas-v2-header-content">
            <div>
                <h1 class="mas-v2-title">
                    <?php 
                    if (!$is_main_page) {
                        // Pokaż tytuł dla konkretnej zakładki
                        switch($active_tab) {
                            case 'general': echo '🎨 ' . esc_html__('Ogólne ustawienia', 'modern-admin-styler-v2'); break;
                            case 'admin-bar': echo '📊 ' . esc_html__('Pasek administracyjny', 'modern-admin-styler-v2'); break;
                            case 'menu': echo '📋 ' . esc_html__('Menu boczne', 'modern-admin-styler-v2'); break;
                            case 'content': echo '📄 ' . esc_html__('Obszar treści', 'modern-admin-styler-v2'); break;
                            case 'typography': echo '🔤 ' . esc_html__('Typografia', 'modern-admin-styler-v2'); break;
                            case 'effects': echo '✨ ' . esc_html__('Efekty wizualne', 'modern-admin-styler-v2'); break;
                            case 'advanced': echo '⚙️ ' . esc_html__('Opcje zaawansowane', 'modern-admin-styler-v2'); break;
                            default: echo '🎨 ' . esc_html__('Modern Admin Styler V2', 'modern-admin-styler-v2');
                        }
                    } else {
                        echo '🎨 ' . esc_html__('Modern Admin Styler V2', 'modern-admin-styler-v2');
                    }
                    ?>
                </h1>
                <p class="mas-v2-subtitle">
                    <?php 
                    if (!$is_main_page) {
                        echo esc_html__('Konfiguracja wybranej sekcji', 'modern-admin-styler-v2');
                    } else {
                        echo esc_html__('Nowoczesne stylowanie panelu WordPress z dashboardami, metrykami i efektami!', 'modern-admin-styler-v2');
                    }
                    ?>
                </p>
            </div>
            <div class="mas-v2-header-actions">
                <?php if ($is_main_page): ?>
                <button type="button" class="mas-v2-btn mas-v2-btn-secondary" id="mas-v2-import-btn">
                    📥 <?php esc_html_e('Import', 'modern-admin-styler-v2'); ?>
                </button>
                <button type="button" class="mas-v2-btn mas-v2-btn-secondary" id="mas-v2-export-btn">
                    📤 <?php esc_html_e('Export', 'modern-admin-styler-v2'); ?>
                </button>
                <?php endif; ?>
                <button type="submit" form="mas-v2-settings-form" class="mas-v2-btn mas-v2-btn-primary">
                    💾 <?php esc_html_e('Zapisz ustawienia', 'modern-admin-styler-v2'); ?>
                </button>
            </div>
        </div>
    </div>

    <!-- Metrics cards tylko na głównej stronie -->
    <?php if ($is_main_page): ?>
    <!-- Metrics cards will be inserted here by JavaScript -->
    <?php endif; ?>
    
    <!-- Main Content Grid -->
    <div class="mas-v2-content-grid">
        <!-- Left Column - Main Settings -->
        <div class="mas-v2-main-content">
            <form id="mas-v2-settings-form" method="post" action="" novalidate>
            <?php wp_nonce_field('mas_v2_nonce', 'mas_v2_nonce'); ?>
            <input type="file" id="mas-v2-import-file" accept=".json" style="display: none;">
            
            <!-- General Tab -->
                <div id="general" class="mas-v2-tab-content <?php echo ($is_main_page || $active_tab === 'general') ? 'active' : ''; ?>" role="tabpanel" <?php echo (!$is_main_page && $active_tab !== 'general') ? 'style="display: none;"' : ''; ?>>
                    <div class="mas-v2-card">
                        <div class="mas-v2-card-header">
                            <h2 class="mas-v2-card-title">
                                🎨 <?php esc_html_e('Ogólne ustawienia', 'modern-admin-styler-v2'); ?>
                    </h2>
                        </div>
                            
                            <div class="mas-v2-field">
                                <label for="theme" class="mas-v2-label">
                                    <?php esc_html_e('Motyw główny', 'modern-admin-styler-v2'); ?>
                                </label>
                                <select id="theme" name="theme" class="mas-v2-input">
                                    <option value="default" <?php selected($settings['theme'] ?? '', 'default'); ?>>
                                    <?php esc_html_e('Domyślny WordPress', 'modern-admin-styler-v2'); ?>
                                    </option>
                                    <option value="modern" <?php selected($settings['theme'] ?? '', 'modern'); ?>>
                                        <?php esc_html_e('Nowoczesny', 'modern-admin-styler-v2'); ?>
                                    </option>
                                    <option value="minimal" <?php selected($settings['theme'] ?? '', 'minimal'); ?>>
                                        <?php esc_html_e('Minimalistyczny', 'modern-admin-styler-v2'); ?>
                                    </option>
                                    <option value="dark" <?php selected($settings['theme'] ?? '', 'dark'); ?>>
                                        <?php esc_html_e('Ciemny', 'modern-admin-styler-v2'); ?>
                                    </option>
                                <option value="colorful" <?php selected($settings['theme'] ?? '', 'colorful'); ?>>
                                    <?php esc_html_e('Kolorowy', 'modern-admin-styler-v2'); ?>
                                </option>
                                </select>
                            </div>
                            
                            <div class="mas-v2-field">
                                <label for="color_scheme" class="mas-v2-label">
                                    <?php esc_html_e('Schemat kolorów', 'modern-admin-styler-v2'); ?>
                                </label>
                                <select id="color_scheme" name="color_scheme" class="mas-v2-input">
                                    <option value="light" <?php selected($settings['color_scheme'] ?? '', 'light'); ?>>
                                        <?php esc_html_e('Jasny', 'modern-admin-styler-v2'); ?>
                                    </option>
                                    <option value="dark" <?php selected($settings['color_scheme'] ?? '', 'dark'); ?>>
                                        <?php esc_html_e('Ciemny', 'modern-admin-styler-v2'); ?>
                                    </option>
                                    <option value="auto" <?php selected($settings['color_scheme'] ?? '', 'auto'); ?>>
                                        <?php esc_html_e('Automatyczny', 'modern-admin-styler-v2'); ?>
                                    </option>
                                </select>
                        </div>
                            
                            <div class="mas-v2-field">
                            <label class="mas-v2-checkbox">
                                <input type="checkbox" 
                                       name="enable_plugin" 
                                       value="1" 
                                       <?php checked($settings['enable_plugin'] ?? true); ?>>
                                <span class="mas-v2-checkbox-mark"></span>
                                <?php esc_html_e('Włącz wtyczkę Modern Admin Styler', 'modern-admin-styler-v2'); ?>
                                </label>
                            </div>
                            
                            <div class="mas-v2-field">
                            <label class="mas-v2-checkbox">
                                <input type="checkbox" 
                                       name="auto_save" 
                                       value="1" 
                                       <?php checked($settings['auto_save'] ?? false); ?>>
                                <span class="mas-v2-checkbox-mark"></span>
                                <?php esc_html_e('Automatyczny zapis ustawień', 'modern-admin-styler-v2'); ?>
                                </label>
                        </div>
                        
                        <h3 style="margin-top: 2rem; color: rgba(255,255,255,0.9);">🎨 <?php esc_html_e('Globalne ustawienia stylu', 'modern-admin-styler-v2'); ?></h3>
                        
                        <div class="mas-v2-field">
                            <label for="accent_color" class="mas-v2-label">
                                <?php esc_html_e('Kolor akcentowy', 'modern-admin-styler-v2'); ?>
                            </label>
                            <input type="color" 
                                   id="accent_color" 
                                   name="accent_color" 
                                   value="<?php echo esc_attr($settings['accent_color'] ?? '#0073aa'); ?>" 
                                   class="mas-v2-color">
                        </div>
                        
                        <div class="mas-v2-field">
                            <label class="mas-v2-checkbox">
                                <input type="checkbox" 
                                       name="compact_mode" 
                                       value="1" 
                                       <?php checked($settings['compact_mode'] ?? false); ?>>
                                <span class="mas-v2-checkbox-mark"></span>
                                <?php esc_html_e('Tryb kompaktowy (zmniejszone odstępy)', 'modern-admin-styler-v2'); ?>
                            </label>
                        </div>
                        
                        <div class="mas-v2-field">
                            <label for="global_border_radius" class="mas-v2-label">
                                <?php esc_html_e('Globalne zaokrąglenie rogów', 'modern-admin-styler-v2'); ?>
                                <span class="mas-v2-slider-value" data-target="global_border_radius"><?php echo esc_html($settings['global_border_radius'] ?? 8); ?>px</span>
                            </label>
                            <input type="range" 
                                   id="global_border_radius" 
                                   name="global_border_radius" 
                                   min="0" 
                                   max="20" 
                                   value="<?php echo esc_attr($settings['global_border_radius'] ?? 8); ?>" 
                                   class="mas-v2-slider">
                        </div>
                        
                        <div class="mas-v2-field">
                            <label class="mas-v2-checkbox">
                                <input type="checkbox" 
                                       name="global_box_shadow" 
                                       value="1" 
                                       <?php checked($settings['global_box_shadow'] ?? true); ?>>
                                <span class="mas-v2-checkbox-mark"></span>
                                <?php esc_html_e('Globalne cienie elementów', 'modern-admin-styler-v2'); ?>
                            </label>
                        </div>
                        
                        <h3 style="margin-top: 2rem; color: rgba(255,255,255,0.9);">⚡ <?php esc_html_e('Animacje i efekty', 'modern-admin-styler-v2'); ?></h3>
                        
                        <div class="mas-v2-field">
                            <label class="mas-v2-checkbox">
                                <input type="checkbox" 
                                       name="animations" 
                                       value="1" 
                                       <?php checked($settings['animations'] ?? true); ?>>
                                <span class="mas-v2-checkbox-mark"></span>
                                <?php esc_html_e('Włącz animacje', 'modern-admin-styler-v2'); ?>
                            </label>
                        </div>
                        
                        <div class="mas-v2-field conditional-field" data-show-when="animations" data-show-value="1">
                            <label for="animation_type" class="mas-v2-label">
                                <?php esc_html_e('Typ animacji', 'modern-admin-styler-v2'); ?>
                            </label>
                            <select id="animation_type" name="animation_type" class="mas-v2-input">
                                <option value="fade" <?php selected($settings['animation_type'] ?? '', 'fade'); ?>>
                                    <?php esc_html_e('Przenikanie (Fade)', 'modern-admin-styler-v2'); ?>
                                </option>
                                <option value="slide" <?php selected($settings['animation_type'] ?? '', 'slide'); ?>>
                                    <?php esc_html_e('Przesuwanie (Slide)', 'modern-admin-styler-v2'); ?>
                                </option>
                                <option value="scale" <?php selected($settings['animation_type'] ?? '', 'scale'); ?>>
                                    <?php esc_html_e('Powiększanie (Scale)', 'modern-admin-styler-v2'); ?>
                                </option>
                            </select>
                        </div>
                            </div>
                        </div>
                        
                <!-- Admin Bar Tab -->
                <div id="admin-bar" class="mas-v2-tab-content <?php echo ($is_main_page || $active_tab === 'admin-bar') ? 'active' : ''; ?>" role="tabpanel" <?php echo (!$is_main_page && $active_tab !== 'admin-bar') ? 'style="display: none;"' : ''; ?>>
                        <div class="mas-v2-card">
                        <div class="mas-v2-card-header">
                            <h2 class="mas-v2-card-title">
                                📊 <?php esc_html_e('Pasek administracyjny', 'modern-admin-styler-v2'); ?>
                            </h2>
                        </div>
                            
                            <div class="mas-v2-field">
                                <label class="mas-v2-checkbox">
                                    <input type="checkbox" 
                                       name="hide_admin_bar" 
                                           value="1" 
                                       <?php checked($settings['hide_admin_bar'] ?? false); ?>>
                                    <span class="mas-v2-checkbox-mark"></span>
                                <?php esc_html_e('Ukryj pasek administracyjny na stronie', 'modern-admin-styler-v2'); ?>
                                </label>
                            </div>
                            
                            <div class="mas-v2-field">
                                <label class="mas-v2-checkbox">
                                    <input type="checkbox" 
                                       name="custom_admin_bar_style" 
                                           value="1" 
                                       <?php checked($settings['custom_admin_bar_style'] ?? true); ?>>
                                    <span class="mas-v2-checkbox-mark"></span>
                                <?php esc_html_e('Własny styl paska administracyjnego', 'modern-admin-styler-v2'); ?>
                                </label>
            </div>
                            
                            <div class="mas-v2-field">
                            <label for="admin_bar_bg" class="mas-v2-label">
                                <?php esc_html_e('Tło paska administracyjnego', 'modern-admin-styler-v2'); ?>
                                </label>
                            <input type="color" 
                                   id="admin_bar_bg" 
                                   name="admin_bar_bg" 
                                   value="<?php echo esc_attr($settings['admin_bar_bg'] ?? '#23282d'); ?>" 
                                   class="mas-v2-input">
                            </div>
                            
                            <div class="mas-v2-field">
                                <label for="admin_bar_text_color" class="mas-v2-label">
                                <?php esc_html_e('Kolor tekstu paska', 'modern-admin-styler-v2'); ?>
                                </label>
                            <input type="color" 
                                       id="admin_bar_text_color" 
                                       name="admin_bar_text_color" 
                                       value="<?php echo esc_attr($settings['admin_bar_text_color'] ?? '#ffffff'); ?>" 
                                   class="mas-v2-input">
                            </div>
                            
                            <div class="mas-v2-field">
                                <label for="admin_bar_height" class="mas-v2-label">
                                <?php esc_html_e('Wysokość paska administracyjnego', 'modern-admin-styler-v2'); ?>
                                    <span class="mas-v2-slider-value" data-target="admin_bar_height"><?php echo esc_html($settings['admin_bar_height'] ?? 32); ?>px</span>
                                </label>
                                <input type="range" 
                                       id="admin_bar_height" 
                                       name="admin_bar_height" 
                                   min="25" 
                                       max="60" 
                                       value="<?php echo esc_attr($settings['admin_bar_height'] ?? 32); ?>" 
                                       class="mas-v2-slider">
                            </div>
                            
                            <div class="mas-v2-field">
                            <label class="mas-v2-checkbox">
                                <input type="checkbox" 
                                       name="hide_wp_logo" 
                                       value="1" 
                                       <?php checked($settings['hide_wp_logo'] ?? false); ?>>
                                <span class="mas-v2-checkbox-mark"></span>
                                <?php esc_html_e('Ukryj logo WordPress', 'modern-admin-styler-v2'); ?>
                                </label>
                            </div>

                        <div class="mas-v2-field">
                            <label class="mas-v2-checkbox">
                                <input type="checkbox" 
                                       name="hide_howdy" 
                                       value="1" 
                                       <?php checked($settings['hide_howdy'] ?? false); ?>>
                                <span class="mas-v2-checkbox-mark"></span>
                                <?php esc_html_e('Ukryj "Cześć" w pasku', 'modern-admin-styler-v2'); ?>
                            </label>
                        </div>
                        
                        <div class="mas-v2-field">
                            <label class="mas-v2-checkbox">
                                <input type="checkbox" 
                                       name="hide_update_notices" 
                                       value="1" 
                                       <?php checked($settings['hide_update_notices'] ?? false); ?>>
                                <span class="mas-v2-checkbox-mark"></span>
                                <?php esc_html_e('Ukryj powiadomienia o aktualizacjach', 'modern-admin-styler-v2'); ?>
                            </label>
                        </div>

                        <h3 style="margin-top: 2rem; color: rgba(255,255,255,0.9);">🎯 <?php esc_html_e('Efekty wizualne paska', 'modern-admin-styler-v2'); ?></h3>
                            
                            <div class="mas-v2-field">
                            <label class="mas-v2-checkbox">
                                <input type="checkbox" 
                                       name="admin_bar_floating" 
                                       value="1" 
                                       id="admin_bar_floating"
                                       <?php checked($settings['admin_bar_floating'] ?? false); ?>>
                                <span class="mas-v2-checkbox-mark"></span>
                                <?php esc_html_e('🎯 Floating (odklejony) pasek admin', 'modern-admin-styler-v2'); ?>
                                </label>
                        </div>

                        <div class="mas-v2-field">
                            <label class="mas-v2-checkbox">
                                <input type="checkbox" 
                                       name="admin_bar_glossy" 
                                       value="1" 
                                       <?php checked($settings['admin_bar_glossy'] ?? false); ?>>
                                <span class="mas-v2-checkbox-mark"></span>
                                <?php esc_html_e('✨ Efekt glossy paska admin', 'modern-admin-styler-v2'); ?>
                            </label>
                        </div>

                        <h3 style="margin-top: 2rem; color: rgba(255,255,255,0.9);">📐 <?php esc_html_e('Zaokrąglenia paska', 'modern-admin-styler-v2'); ?></h3>

                        <div class="mas-v2-field">
                            <label for="admin_bar_border_radius_type" class="mas-v2-label">
                                <?php esc_html_e('Typ zaokrągleń', 'modern-admin-styler-v2'); ?>
                            </label>
                            <select id="admin_bar_border_radius_type" name="admin_bar_border_radius_type" class="mas-v2-input">
                                <option value="all" <?php selected($settings['admin_bar_border_radius_type'] ?? '', 'all'); ?>>
                                    <?php esc_html_e('Wszystkie rogi', 'modern-admin-styler-v2'); ?>
                                    </option>
                                <option value="individual" <?php selected($settings['admin_bar_border_radius_type'] ?? '', 'individual'); ?>>
                                    <?php esc_html_e('Indywidualne rogi', 'modern-admin-styler-v2'); ?>
                                    </option>
                                </select>
                            </div>
                            
                        <div class="mas-v2-field conditional-field" data-show-when="admin_bar_border_radius_type" data-show-value="all">
                            <label for="admin_bar_border_radius" class="mas-v2-label">
                                <?php esc_html_e('Promień zaokrąglenia', 'modern-admin-styler-v2'); ?>
                                <span class="mas-v2-slider-value" data-target="admin_bar_border_radius"><?php echo esc_html($settings['admin_bar_border_radius'] ?? 0); ?>px</span>
                                    </label>
                                    <input type="range" 
                                   id="admin_bar_border_radius" 
                                   name="admin_bar_border_radius" 
                                           min="0" 
                                   max="30" 
                                   value="<?php echo esc_attr($settings['admin_bar_border_radius'] ?? 0); ?>" 
                                           class="mas-v2-slider">
                        </div>

                        <div class="mas-v2-field conditional-field" data-show-when="admin_bar_border_radius_type" data-show-value="individual">
                            <h4><?php esc_html_e('Indywidualne rogi:', 'modern-admin-styler-v2'); ?></h4>
                            <div class="mas-v2-checkbox">
                                <input type="checkbox" name="admin_bar_radius_tl" id="admin_bar_radius_tl" <?php checked($settings['admin_bar_radius_tl'] ?? false); ?>>
                                <span class="mas-v2-checkbox-mark"></span>
                                <label for="admin_bar_radius_tl"><?php esc_html_e('Lewy górny', 'modern-admin-styler-v2'); ?></label>
                            </div>
                            <div class="mas-v2-checkbox">
                                <input type="checkbox" name="admin_bar_radius_tr" id="admin_bar_radius_tr" <?php checked($settings['admin_bar_radius_tr'] ?? false); ?>>
                                <span class="mas-v2-checkbox-mark"></span>
                                <label for="admin_bar_radius_tr"><?php esc_html_e('Prawy górny', 'modern-admin-styler-v2'); ?></label>
                            </div>
                            <div class="mas-v2-checkbox">
                                <input type="checkbox" name="admin_bar_radius_bl" id="admin_bar_radius_bl" <?php checked($settings['admin_bar_radius_bl'] ?? false); ?>>
                                <span class="mas-v2-checkbox-mark"></span>
                                <label for="admin_bar_radius_bl"><?php esc_html_e('Lewy dolny', 'modern-admin-styler-v2'); ?></label>
                            </div>
                            <div class="mas-v2-checkbox">
                                <input type="checkbox" name="admin_bar_radius_br" id="admin_bar_radius_br" <?php checked($settings['admin_bar_radius_br'] ?? false); ?>>
                                <span class="mas-v2-checkbox-mark"></span>
                                <label for="admin_bar_radius_br"><?php esc_html_e('Prawy dolny', 'modern-admin-styler-v2'); ?></label>
                                </div>
                            </div>
                            
                        <div class="mas-v2-field floating-only" data-requires="admin_bar_floating">
                            <h3 style="margin-top: 2rem; color: rgba(255,255,255,0.9);">📏 <?php esc_html_e('Odstępy floating paska', 'modern-admin-styler-v2'); ?></h3>
                            
                            <label for="admin_bar_margin_type" class="mas-v2-label">
                                <?php esc_html_e('Typ odstępów', 'modern-admin-styler-v2'); ?>
                            </label>
                            <select id="admin_bar_margin_type" name="admin_bar_margin_type" class="mas-v2-input">
                                <option value="all" <?php selected($settings['admin_bar_margin_type'] ?? '', 'all'); ?>>
                                    <?php esc_html_e('Wszystkie strony', 'modern-admin-styler-v2'); ?>
                                </option>
                                <option value="individual" <?php selected($settings['admin_bar_margin_type'] ?? '', 'individual'); ?>>
                                    <?php esc_html_e('Indywidualne strony', 'modern-admin-styler-v2'); ?>
                                </option>
                            </select>
                        </div>

                        <div class="mas-v2-field conditional-field floating-only" data-show-when="admin_bar_margin_type" data-show-value="all" data-requires="admin_bar_floating">
                            <label for="admin_bar_margin" class="mas-v2-label">
                                <?php esc_html_e('Odstęp od krawędzi', 'modern-admin-styler-v2'); ?>
                                <span class="mas-v2-slider-value" data-target="admin_bar_margin"><?php echo esc_html($settings['admin_bar_margin'] ?? 10); ?>px</span>
                                    </label>
                                    <input type="range" 
                                   id="admin_bar_margin" 
                                   name="admin_bar_margin" 
                                           min="0" 
                                   max="50" 
                                   value="<?php echo esc_attr($settings['admin_bar_margin'] ?? 10); ?>" 
                                           class="mas-v2-slider">
                                </div>
                                
                        <div class="mas-v2-field conditional-field floating-only" data-show-when="admin_bar_margin_type" data-show-value="individual" data-requires="admin_bar_floating">
                            <h4><?php esc_html_e('Indywidualne odstępy:', 'modern-admin-styler-v2'); ?></h4>
                            
                            <label for="admin_bar_margin_top" class="mas-v2-label">
                                <?php esc_html_e('Górny odstęp', 'modern-admin-styler-v2'); ?>
                                <span class="mas-v2-slider-value" data-target="admin_bar_margin_top"><?php echo esc_html($settings['admin_bar_margin_top'] ?? 10); ?>px</span>
                                    </label>
                                    <input type="range" 
                                   id="admin_bar_margin_top" 
                                   name="admin_bar_margin_top" 
                                           min="0" 
                                   max="50" 
                                   value="<?php echo esc_attr($settings['admin_bar_margin_top'] ?? 10); ?>" 
                                           class="mas-v2-slider">

                            <label for="admin_bar_margin_right" class="mas-v2-label">
                                <?php esc_html_e('Prawy odstęp', 'modern-admin-styler-v2'); ?>
                                <span class="mas-v2-slider-value" data-target="admin_bar_margin_right"><?php echo esc_html($settings['admin_bar_margin_right'] ?? 10); ?>px</span>
                                    </label>
                                    <input type="range" 
                                   id="admin_bar_margin_right" 
                                   name="admin_bar_margin_right" 
                                           min="0" 
                                   max="50" 
                                   value="<?php echo esc_attr($settings['admin_bar_margin_right'] ?? 10); ?>" 
                                           class="mas-v2-slider">

                            <label for="admin_bar_margin_bottom" class="mas-v2-label">
                                <?php esc_html_e('Dolny odstęp', 'modern-admin-styler-v2'); ?>
                                <span class="mas-v2-slider-value" data-target="admin_bar_margin_bottom"><?php echo esc_html($settings['admin_bar_margin_bottom'] ?? 10); ?>px</span>
                                    </label>
                                    <input type="range" 
                                   id="admin_bar_margin_bottom" 
                                   name="admin_bar_margin_bottom" 
                                           min="0" 
                                   max="50" 
                                   value="<?php echo esc_attr($settings['admin_bar_margin_bottom'] ?? 10); ?>" 
                                   class="mas-v2-slider">

                            <label for="admin_bar_margin_left" class="mas-v2-label">
                                <?php esc_html_e('Lewy odstęp', 'modern-admin-styler-v2'); ?>
                                <span class="mas-v2-slider-value" data-target="admin_bar_margin_left"><?php echo esc_html($settings['admin_bar_margin_left'] ?? 10); ?>px</span>
                            </label>
                            <input type="range" 
                                   id="admin_bar_margin_left" 
                                   name="admin_bar_margin_left" 
                                   min="0" 
                                   max="50" 
                                                                      value="<?php echo esc_attr($settings['admin_bar_margin_left'] ?? 10); ?>" 
                                               class="mas-v2-slider">
                    </div>
                    
                    <h3 style="margin-top: 2rem; color: rgba(255,255,255,0.9);">📝 <?php esc_html_e('Typografia i rozmiary', 'modern-admin-styler-v2'); ?></h3>
                    
                    <div class="mas-v2-field">
                        <label for="admin_bar_typography_size" class="mas-v2-label">
                            <?php esc_html_e('Rozmiar czcionki', 'modern-admin-styler-v2'); ?>
                            <span class="mas-v2-slider-value" data-target="admin_bar_typography_size"><?php echo esc_html($settings['admin_bar_typography_size'] ?? 13); ?>px</span>
                        </label>
                        <input type="range" 
                               id="admin_bar_typography_size" 
                               name="admin_bar_typography_size" 
                               min="10" 
                               max="18" 
                               value="<?php echo esc_attr($settings['admin_bar_typography_size'] ?? 13); ?>" 
                               class="mas-v2-slider">
                    </div>
                    
                    <div class="mas-v2-field">
                        <label for="admin_bar_typography_weight" class="mas-v2-label">
                            <?php esc_html_e('Grubość czcionki', 'modern-admin-styler-v2'); ?>
                        </label>
                        <select id="admin_bar_typography_weight" name="admin_bar_typography_weight" class="mas-v2-input">
                            <option value="300" <?php selected($settings['admin_bar_typography_weight'] ?? '', '300'); ?>>
                                <?php esc_html_e('Lekka (300)', 'modern-admin-styler-v2'); ?>
                            </option>
                            <option value="400" <?php selected($settings['admin_bar_typography_weight'] ?? '', '400'); ?>>
                                <?php esc_html_e('Normalna (400)', 'modern-admin-styler-v2'); ?>
                            </option>
                            <option value="500" <?php selected($settings['admin_bar_typography_weight'] ?? '', '500'); ?>>
                                <?php esc_html_e('Średnia (500)', 'modern-admin-styler-v2'); ?>
                            </option>
                            <option value="600" <?php selected($settings['admin_bar_typography_weight'] ?? '', '600'); ?>>
                                <?php esc_html_e('Semi-bold (600)', 'modern-admin-styler-v2'); ?>
                            </option>
                            <option value="700" <?php selected($settings['admin_bar_typography_weight'] ?? '', '700'); ?>>
                                <?php esc_html_e('Pogrubiona (700)', 'modern-admin-styler-v2'); ?>
                            </option>
                        </select>
                    </div>
                    
                    <div class="mas-v2-field">
                        <label for="admin_bar_icon_size" class="mas-v2-label">
                            <?php esc_html_e('Rozmiar ikon', 'modern-admin-styler-v2'); ?>
                            <span class="mas-v2-slider-value" data-target="admin_bar_icon_size"><?php echo esc_html($settings['admin_bar_icon_size'] ?? 20); ?>px</span>
                        </label>
                        <input type="range" 
                               id="admin_bar_icon_size" 
                               name="admin_bar_icon_size" 
                               min="14" 
                               max="28" 
                               value="<?php echo esc_attr($settings['admin_bar_icon_size'] ?? 20); ?>" 
                               class="mas-v2-slider">
                    </div>
                    
                    <div class="mas-v2-field">
                        <label for="admin_bar_spacing" class="mas-v2-label">
                            <?php esc_html_e('Odstępy między elementami', 'modern-admin-styler-v2'); ?>
                            <span class="mas-v2-slider-value" data-target="admin_bar_spacing"><?php echo esc_html($settings['admin_bar_spacing'] ?? 8); ?>px</span>
                        </label>
                        <input type="range" 
                               id="admin_bar_spacing" 
                               name="admin_bar_spacing" 
                               min="0" 
                               max="20" 
                               value="<?php echo esc_attr($settings['admin_bar_spacing'] ?? 8); ?>" 
                               class="mas-v2-slider">
                    </div>
                    
                    <h3 style="margin-top: 2rem; color: rgba(255,255,255,0.9);">🔧 <?php esc_html_e('Ukrywanie elementów', 'modern-admin-styler-v2'); ?></h3>
                    
                    <div class="mas-v2-field">
                        <label class="mas-v2-checkbox">
                            <input type="checkbox" 
                                   name="admin_bar_search_box" 
                                   value="1" 
                                   <?php checked($settings['admin_bar_search_box'] ?? true); ?>>
                            <span class="mas-v2-checkbox-mark"></span>
                            <?php esc_html_e('Pokaż pole wyszukiwania', 'modern-admin-styler-v2'); ?>
                        </label>
                    </div>
                    
                    <div class="mas-v2-field">
                        <label class="mas-v2-checkbox">
                            <input type="checkbox" 
                                   name="admin_bar_user_info" 
                                   value="1" 
                                   <?php checked($settings['admin_bar_user_info'] ?? true); ?>>
                            <span class="mas-v2-checkbox-mark"></span>
                            <?php esc_html_e('Pokaż informacje o użytkowniku', 'modern-admin-styler-v2'); ?>
                        </label>
                    </div>
                    
                    <div class="mas-v2-field">
                        <label class="mas-v2-checkbox">
                            <input type="checkbox" 
                                   name="admin_bar_site_name" 
                                   value="1" 
                                   <?php checked($settings['admin_bar_site_name'] ?? true); ?>>
                            <span class="mas-v2-checkbox-mark"></span>
                            <?php esc_html_e('Pokaż nazwę strony', 'modern-admin-styler-v2'); ?>
                        </label>
                    </div>
                    
                    <div class="mas-v2-field">
                        <label class="mas-v2-checkbox">
                            <input type="checkbox" 
                                   name="admin_bar_notifications" 
                                   value="1" 
                                   <?php checked($settings['admin_bar_notifications'] ?? true); ?>>
                            <span class="mas-v2-checkbox-mark"></span>
                            <?php esc_html_e('Pokaż powiadomienia', 'modern-admin-styler-v2'); ?>
                        </label>
                    </div>
                    
                    <h3 style="margin-top: 2rem; color: rgba(255,255,255,0.9);">⚙️ <?php esc_html_e('Zaawansowane', 'modern-admin-styler-v2'); ?></h3>
                    
                    <div class="mas-v2-field">
                        <label for="admin_bar_custom_items" class="mas-v2-label">
                            <?php esc_html_e('Własne elementy (HTML)', 'modern-admin-styler-v2'); ?>
                        </label>
                        <textarea 
                            id="admin_bar_custom_items" 
                            name="admin_bar_custom_items" 
                            rows="3"
                            placeholder="<li><a href='#'>Custom Link</a></li>"
                            class="mas-v2-input"><?php echo esc_textarea($settings['admin_bar_custom_items'] ?? ''); ?></textarea>
                        <small class="mas-v2-help-text">
                            <?php esc_html_e('Dodaj własne elementy HTML do Admin Bar (zaawansowane)', 'modern-admin-styler-v2'); ?>
                        </small>
                    </div>
                </div>
            </div>
                        
                <!-- Menu Tab -->
                <div id="menu" class="mas-v2-tab-content <?php echo ($is_main_page || $active_tab === 'menu') ? 'active' : ''; ?>" role="tabpanel" <?php echo (!$is_main_page && $active_tab !== 'menu') ? 'style="display: none;"' : ''; ?>>
                        <div class="mas-v2-card">
                        <div class="mas-v2-card-header">
                            <h2 class="mas-v2-card-title">
                                📋 <?php esc_html_e('Menu boczne', 'modern-admin-styler-v2'); ?>
                            </h2>
                            </div>
                            
                            <div class="mas-v2-field">
                                <label class="mas-v2-checkbox">
                                    <input type="checkbox" 
                                       name="auto_fold_menu" 
                                           value="1" 
                                       <?php checked($settings['auto_fold_menu'] ?? false); ?>>
                                    <span class="mas-v2-checkbox-mark"></span>
                                <?php esc_html_e('Automatycznie zwiń menu na małych ekranach', 'modern-admin-styler-v2'); ?>
                                </label>
                            </div>
                            
                            <div class="mas-v2-field">
                                <label class="mas-v2-checkbox">
                                    <input type="checkbox" 
                                       name="modern_menu_style" 
                                           value="1" 
                                       <?php checked($settings['modern_menu_style'] ?? true); ?>>
                                    <span class="mas-v2-checkbox-mark"></span>
                                <?php esc_html_e('Nowoczesny styl menu', 'modern-admin-styler-v2'); ?>
                                </label>
            </div>
                            
                            <div class="mas-v2-field">
                            <label for="menu_bg" class="mas-v2-label">
                                    <?php esc_html_e('Tło menu', 'modern-admin-styler-v2'); ?>
                                </label>
                            <input type="color" 
                                   id="menu_bg" 
                                   name="menu_bg" 
                                   value="<?php echo esc_attr($settings['menu_bg'] ?? '#23282d'); ?>" 
                                   class="mas-v2-input">
                            </div>
                            
                            <div class="mas-v2-field">
                                <label for="menu_text_color" class="mas-v2-label">
                                <?php esc_html_e('Kolor tekstu menu', 'modern-admin-styler-v2'); ?>
                                </label>
                            <input type="color" 
                                       id="menu_text_color" 
                                       name="menu_text_color" 
                                       value="<?php echo esc_attr($settings['menu_text_color'] ?? '#ffffff'); ?>" 
                                   class="mas-v2-input">
                            </div>
                            
                            <div class="mas-v2-field">
                            <label for="menu_hover_color" class="mas-v2-label">
                                <?php esc_html_e('Kolor hover menu', 'modern-admin-styler-v2'); ?>
                                </label>
                            <input type="color" 
                                   id="menu_hover_color" 
                                   name="menu_hover_color" 
                                   value="<?php echo esc_attr($settings['menu_hover_color'] ?? '#0073aa'); ?>" 
                                   class="mas-v2-input">
                            </div>
                            
                            <div class="mas-v2-field">
                                <label for="menu_width" class="mas-v2-label">
                                    <?php esc_html_e('Szerokość menu', 'modern-admin-styler-v2'); ?>
                                    <span class="mas-v2-slider-value" data-target="menu_width"><?php echo esc_html($settings['menu_width'] ?? 160); ?>px</span>
                                </label>
                                <input type="range" 
                                       id="menu_width" 
                                       name="menu_width" 
                                       min="140" 
                                   max="300" 
                                       value="<?php echo esc_attr($settings['menu_width'] ?? 160); ?>" 
                                       class="mas-v2-slider">
                            </div>
                            
                            <div class="mas-v2-field">
                            <label for="menu_border_radius" class="mas-v2-label">
                                <?php esc_html_e('Zaokrąglenie rogów menu', 'modern-admin-styler-v2'); ?>
                                <span class="mas-v2-slider-value" data-target="menu_border_radius"><?php echo esc_html($settings['menu_border_radius'] ?? 0); ?>px</span>
                                </label>
                                <input type="range" 
                                   id="menu_border_radius" 
                                   name="menu_border_radius" 
                                   min="0" 
                                   max="30" 
                                   value="<?php echo esc_attr($settings['menu_border_radius'] ?? 0); ?>" 
                                       class="mas-v2-slider">
                        </div>
                            
                            <div class="mas-v2-field">
                            <label class="mas-v2-checkbox">
                                <input type="checkbox" 
                                       name="menu_icons_enabled" 
                                       value="1" 
                                       <?php checked($settings['menu_icons_enabled'] ?? true); ?>>
                                <span class="mas-v2-checkbox-mark"></span>
                                <?php esc_html_e('Pokaż ikony menu', 'modern-admin-styler-v2'); ?>
                                </label>
                            </div>
                            
                        <h3 style="margin-top: 2rem; color: rgba(255,255,255,0.9);">🎯 <?php esc_html_e('Efekty wizualne menu', 'modern-admin-styler-v2'); ?></h3>

                                <div class="mas-v2-field">
                            <label class="mas-v2-checkbox">
                                <input type="checkbox" 
                                       name="menu_floating" 
                                       value="1" 
                                       id="menu_floating"
                                       <?php checked($settings['menu_floating'] ?? false); ?>>
                                <span class="mas-v2-checkbox-mark"></span>
                                <?php esc_html_e('🎯 Floating (odklejone) menu boczne', 'modern-admin-styler-v2'); ?>
                                    </label>
                                </div>
                                
                                <div class="mas-v2-field">
                            <label class="mas-v2-checkbox">
                                <input type="checkbox" 
                                       name="menu_glossy" 
                                       value="1" 
                                       <?php checked($settings['menu_glossy'] ?? false); ?>>
                                <span class="mas-v2-checkbox-mark"></span>
                                <?php esc_html_e('✨ Efekt glossy menu bocznego', 'modern-admin-styler-v2'); ?>
                                    </label>
                                </div>

                        <h3 style="margin-top: 2rem; color: rgba(255,255,255,0.9);">📐 <?php esc_html_e('Zaokrąglenia menu', 'modern-admin-styler-v2'); ?></h3>
                                
                                <div class="mas-v2-field">
                            <label for="menu_border_radius_type" class="mas-v2-label">
                                <?php esc_html_e('Typ zaokrągleń', 'modern-admin-styler-v2'); ?>
                                    </label>
                            <select id="menu_border_radius_type" name="menu_border_radius_type" class="mas-v2-input">
                                <option value="all" <?php selected($settings['menu_border_radius_type'] ?? '', 'all'); ?>>
                                    <?php esc_html_e('Wszystkie rogi', 'modern-admin-styler-v2'); ?>
                                </option>
                                <option value="individual" <?php selected($settings['menu_border_radius_type'] ?? '', 'individual'); ?>>
                                    <?php esc_html_e('Indywidualne rogi', 'modern-admin-styler-v2'); ?>
                                </option>
                            </select>
                                </div>
                                
                        <div class="mas-v2-field conditional-field" data-show-when="menu_border_radius_type" data-show-value="all">
                            <label for="menu_border_radius_all" class="mas-v2-label">
                                <?php esc_html_e('Promień zaokrąglenia', 'modern-admin-styler-v2'); ?>
                                <span class="mas-v2-slider-value" data-target="menu_border_radius_all"><?php echo esc_html($settings['menu_border_radius_all'] ?? 0); ?>px</span>
                                    </label>
                                    <input type="range" 
                                   id="menu_border_radius_all" 
                                   name="menu_border_radius_all" 
                                           min="0" 
                                           max="30" 
                                   value="<?php echo esc_attr($settings['menu_border_radius_all'] ?? 0); ?>" 
                                           class="mas-v2-slider">
                        </div>
                        
                        <div class="mas-v2-field conditional-field" data-show-when="menu_border_radius_type" data-show-value="individual">
                            <h4><?php esc_html_e('Indywidualne rogi:', 'modern-admin-styler-v2'); ?></h4>
                            <div class="mas-v2-checkbox">
                                <input type="checkbox" name="menu_radius_tl" id="menu_radius_tl" <?php checked($settings['menu_radius_tl'] ?? false); ?>>
                                    <span class="mas-v2-checkbox-mark"></span>
                                <label for="menu_radius_tl"><?php esc_html_e('Lewy górny', 'modern-admin-styler-v2'); ?></label>
                            </div>
                            <div class="mas-v2-checkbox">
                                <input type="checkbox" name="menu_radius_tr" id="menu_radius_tr" <?php checked($settings['menu_radius_tr'] ?? false); ?>>
                                    <span class="mas-v2-checkbox-mark"></span>
                                <label for="menu_radius_tr"><?php esc_html_e('Prawy górny', 'modern-admin-styler-v2'); ?></label>
                            </div>
                            <div class="mas-v2-checkbox">
                                <input type="checkbox" name="menu_radius_bl" id="menu_radius_bl" <?php checked($settings['menu_radius_bl'] ?? false); ?>>
                                    <span class="mas-v2-checkbox-mark"></span>
                                <label for="menu_radius_bl"><?php esc_html_e('Lewy dolny', 'modern-admin-styler-v2'); ?></label>
                            </div>
                            <div class="mas-v2-checkbox">
                                <input type="checkbox" name="menu_radius_br" id="menu_radius_br" <?php checked($settings['menu_radius_br'] ?? false); ?>>
                                    <span class="mas-v2-checkbox-mark"></span>
                                <label for="menu_radius_br"><?php esc_html_e('Prawy dolny', 'modern-admin-styler-v2'); ?></label>
                            </div>
                            </div>
                            
                        <div class="mas-v2-field floating-only" data-requires="menu_floating">
                            <h3 style="margin-top: 2rem; color: rgba(255,255,255,0.9);">📏 <?php esc_html_e('Odstępy floating menu', 'modern-admin-styler-v2'); ?></h3>
                            
                            <label for="menu_margin_type" class="mas-v2-label">
                                <?php esc_html_e('Typ odstępów', 'modern-admin-styler-v2'); ?>
                                </label>
                            <select id="menu_margin_type" name="menu_margin_type" class="mas-v2-input">
                                <option value="all" <?php selected($settings['menu_margin_type'] ?? '', 'all'); ?>>
                                    <?php esc_html_e('Wszystkie strony', 'modern-admin-styler-v2'); ?>
                                    </option>
                                <option value="individual" <?php selected($settings['menu_margin_type'] ?? '', 'individual'); ?>>
                                    <?php esc_html_e('Indywidualne strony', 'modern-admin-styler-v2'); ?>
                                    </option>
                                </select>
                        </div>

                        <div class="mas-v2-field conditional-field floating-only" data-show-when="menu_margin_type" data-show-value="all" data-requires="menu_floating">
                            <label for="menu_margin" class="mas-v2-label">
                                <?php esc_html_e('Odstęp od krawędzi', 'modern-admin-styler-v2'); ?>
                                <span class="mas-v2-slider-value" data-target="menu_margin"><?php echo esc_html($settings['menu_margin'] ?? 10); ?>px</span>
                                        </label>
                                        <input type="range" 
                                   id="menu_margin" 
                                   name="menu_margin" 
                                               min="0" 
                                               max="50" 
                                   value="<?php echo esc_attr($settings['menu_margin'] ?? 10); ?>" 
                                               class="mas-v2-slider">
                                </div>
                                
                        <div class="mas-v2-field conditional-field floating-only" data-show-when="menu_margin_type" data-show-value="individual" data-requires="menu_floating">
                            <h4><?php esc_html_e('Indywidualne odstępy:', 'modern-admin-styler-v2'); ?></h4>
                            
                            <label for="menu_margin_top" class="mas-v2-label">
                                <?php esc_html_e('Górny odstęp', 'modern-admin-styler-v2'); ?>
                                <span class="mas-v2-slider-value" data-target="menu_margin_top"><?php echo esc_html($settings['menu_margin_top'] ?? 10); ?>px</span>
                                        </label>
                                        <input type="range" 
                                   id="menu_margin_top" 
                                   name="menu_margin_top" 
                                               min="0" 
                                               max="50" 
                                   value="<?php echo esc_attr($settings['menu_margin_top'] ?? 10); ?>" 
                                               class="mas-v2-slider">

                            <label for="menu_margin_right" class="mas-v2-label">
                                <?php esc_html_e('Prawy odstęp', 'modern-admin-styler-v2'); ?>
                                <span class="mas-v2-slider-value" data-target="menu_margin_right"><?php echo esc_html($settings['menu_margin_right'] ?? 10); ?>px</span>
                                        </label>
                                        <input type="range" 
                                   id="menu_margin_right" 
                                   name="menu_margin_right" 
                                               min="0" 
                                               max="50" 
                                   value="<?php echo esc_attr($settings['menu_margin_right'] ?? 10); ?>" 
                                               class="mas-v2-slider">

                            <label for="menu_margin_bottom" class="mas-v2-label">
                                <?php esc_html_e('Dolny odstęp', 'modern-admin-styler-v2'); ?>
                                <span class="mas-v2-slider-value" data-target="menu_margin_bottom"><?php echo esc_html($settings['menu_margin_bottom'] ?? 10); ?>px</span>
                                        </label>
                                        <input type="range" 
                                   id="menu_margin_bottom" 
                                   name="menu_margin_bottom" 
                                               min="0" 
                                               max="50" 
                                   value="<?php echo esc_attr($settings['menu_margin_bottom'] ?? 10); ?>" 
                                               class="mas-v2-slider">

                            <label for="menu_margin_left" class="mas-v2-label">
                                <?php esc_html_e('Lewy odstęp', 'modern-admin-styler-v2'); ?>
                                <span class="mas-v2-slider-value" data-target="menu_margin_left"><?php echo esc_html($settings['menu_margin_left'] ?? 10); ?>px</span>
                                        </label>
                                        <input type="range" 
                                   id="menu_margin_left" 
                                   name="menu_margin_left" 
                                               min="0" 
                                               max="50" 
                                   value="<?php echo esc_attr($settings['menu_margin_left'] ?? 10); ?>" 
                                               class="mas-v2-slider">
                    </div>
                    
                    <h3 style="margin-top: 2rem; color: rgba(255,255,255,0.9);">📝 <?php esc_html_e('Typografia menu', 'modern-admin-styler-v2'); ?></h3>
                    
                    <div class="mas-v2-field">
                        <label for="menu_font_family" class="mas-v2-label">
                            <?php esc_html_e('Rodzina czcionek', 'modern-admin-styler-v2'); ?>
                        </label>
                        <select id="menu_font_family" name="menu_font_family" class="mas-v2-input">
                            <option value="inherit" <?php selected($settings['menu_font_family'] ?? '', 'inherit'); ?>>
                                <?php esc_html_e('Dziedzicz z WordPress', 'modern-admin-styler-v2'); ?>
                            </option>
                            <option value="system" <?php selected($settings['menu_font_family'] ?? '', 'system'); ?>>
                                <?php esc_html_e('Systemowa', 'modern-admin-styler-v2'); ?>
                            </option>
                            <option value="inter" <?php selected($settings['menu_font_family'] ?? '', 'inter'); ?>>
                                Inter (Google Fonts)
                            </option>
                            <option value="roboto" <?php selected($settings['menu_font_family'] ?? '', 'roboto'); ?>>
                                Roboto (Google Fonts)
                            </option>
                            <option value="open-sans" <?php selected($settings['menu_font_family'] ?? '', 'open-sans'); ?>>
                                Open Sans (Google Fonts)
                            </option>
                            <option value="lato" <?php selected($settings['menu_font_family'] ?? '', 'lato'); ?>>
                                Lato (Google Fonts)
                            </option>
                            <option value="montserrat" <?php selected($settings['menu_font_family'] ?? '', 'montserrat'); ?>>
                                Montserrat (Google Fonts)
                            </option>
                            <option value="poppins" <?php selected($settings['menu_font_family'] ?? '', 'poppins'); ?>>
                                Poppins (Google Fonts)
                            </option>
                            <option value="custom" <?php selected($settings['menu_font_family'] ?? '', 'custom'); ?>>
                                <?php esc_html_e('Niestandardowa (Google Fonts)', 'modern-admin-styler-v2'); ?>
                            </option>
                        </select>
                    </div>
                    
                    <div class="mas-v2-field conditional-field" data-show-when="menu_font_family" data-show-value="custom">
                        <label for="menu_google_font" class="mas-v2-label">
                            <?php esc_html_e('Nazwa czcionki Google Fonts', 'modern-admin-styler-v2'); ?>
                        </label>
                        <input type="text" 
                               id="menu_google_font" 
                               name="menu_google_font" 
                               value="<?php echo esc_attr($settings['menu_google_font'] ?? ''); ?>" 
                               placeholder="np. Noto Sans"
                               class="mas-v2-input">
                        <small class="mas-v2-help-text">
                            <?php esc_html_e('Wprowadź nazwę czcionki z Google Fonts (bez spacji: Noto+Sans)', 'modern-admin-styler-v2'); ?>
                        </small>
                    </div>
                    
                    <div class="mas-v2-field">
                        <label for="menu_font_size" class="mas-v2-label">
                            <?php esc_html_e('Rozmiar czcionki menu', 'modern-admin-styler-v2'); ?>
                            <span class="mas-v2-slider-value" data-target="menu_font_size"><?php echo esc_html($settings['menu_font_size'] ?? 14); ?>px</span>
                        </label>
                        <input type="range" 
                               id="menu_font_size" 
                               name="menu_font_size" 
                               min="10" 
                               max="20" 
                               value="<?php echo esc_attr($settings['menu_font_size'] ?? 14); ?>" 
                               class="mas-v2-slider">
                    </div>
                    
                    <div class="mas-v2-field">
                        <label for="menu_font_weight" class="mas-v2-label">
                            <?php esc_html_e('Grubość czcionki menu', 'modern-admin-styler-v2'); ?>
                        </label>
                        <select id="menu_font_weight" name="menu_font_weight" class="mas-v2-input">
                            <option value="300" <?php selected($settings['menu_font_weight'] ?? '', '300'); ?>>
                                <?php esc_html_e('Lekka (300)', 'modern-admin-styler-v2'); ?>
                            </option>
                            <option value="400" <?php selected($settings['menu_font_weight'] ?? '', '400'); ?>>
                                <?php esc_html_e('Normalna (400)', 'modern-admin-styler-v2'); ?>
                            </option>
                            <option value="500" <?php selected($settings['menu_font_weight'] ?? '', '500'); ?>>
                                <?php esc_html_e('Średnia (500)', 'modern-admin-styler-v2'); ?>
                            </option>
                            <option value="600" <?php selected($settings['menu_font_weight'] ?? '', '600'); ?>>
                                <?php esc_html_e('Semi-bold (600)', 'modern-admin-styler-v2'); ?>
                            </option>
                            <option value="700" <?php selected($settings['menu_font_weight'] ?? '', '700'); ?>>
                                <?php esc_html_e('Pogrubiona (700)', 'modern-admin-styler-v2'); ?>
                            </option>
                        </select>
                    </div>
                    
                    <div class="mas-v2-field">
                        <label for="menu_line_height" class="mas-v2-label">
                            <?php esc_html_e('Wysokość linii', 'modern-admin-styler-v2'); ?>
                            <span class="mas-v2-slider-value" data-target="menu_line_height"><?php echo esc_html($settings['menu_line_height'] ?? 1.4); ?></span>
                        </label>
                        <input type="range" 
                               id="menu_line_height" 
                               name="menu_line_height" 
                               min="1.0" 
                               max="2.0" 
                               step="0.1"
                               value="<?php echo esc_attr($settings['menu_line_height'] ?? 1.4); ?>" 
                               class="mas-v2-slider">
                    </div>
                    
                    <div class="mas-v2-field">
                        <label for="menu_letter_spacing" class="mas-v2-label">
                            <?php esc_html_e('Odstępy między literami', 'modern-admin-styler-v2'); ?>
                            <span class="mas-v2-slider-value" data-target="menu_letter_spacing"><?php echo esc_html($settings['menu_letter_spacing'] ?? 0); ?>px</span>
                        </label>
                        <input type="range" 
                               id="menu_letter_spacing" 
                               name="menu_letter_spacing" 
                               min="-1" 
                               max="3" 
                               step="0.1"
                               value="<?php echo esc_attr($settings['menu_letter_spacing'] ?? 0); ?>" 
                               class="mas-v2-slider">
                    </div>
                    
                    <div class="mas-v2-field">
                        <label for="menu_text_transform" class="mas-v2-label">
                            <?php esc_html_e('Transformacja tekstu', 'modern-admin-styler-v2'); ?>
                        </label>
                        <select id="menu_text_transform" name="menu_text_transform" class="mas-v2-input">
                            <option value="none" <?php selected($settings['menu_text_transform'] ?? '', 'none'); ?>>
                                <?php esc_html_e('Bez zmian', 'modern-admin-styler-v2'); ?>
                            </option>
                            <option value="uppercase" <?php selected($settings['menu_text_transform'] ?? '', 'uppercase'); ?>>
                                <?php esc_html_e('WIELKIE LITERY', 'modern-admin-styler-v2'); ?>
                            </option>
                            <option value="lowercase" <?php selected($settings['menu_text_transform'] ?? '', 'lowercase'); ?>>
                                <?php esc_html_e('małe litery', 'modern-admin-styler-v2'); ?>
                            </option>
                            <option value="capitalize" <?php selected($settings['menu_text_transform'] ?? '', 'capitalize'); ?>>
                                <?php esc_html_e('Pierwsze Litery Wielkie', 'modern-admin-styler-v2'); ?>
                            </option>
                        </select>
                    </div>
                    
                    <h3 style="margin-top: 2rem; color: rgba(255,255,255,0.9);">🙈 <?php esc_html_e('Ukrywanie elementów', 'modern-admin-styler-v2'); ?></h3>
                    
                    <div class="mas-v2-field">
                        <label class="mas-v2-checkbox">
                            <input type="checkbox" 
                                   name="menu_hide_icons" 
                                   value="1" 
                                   <?php checked($settings['menu_hide_icons'] ?? false); ?>>
                            <span class="mas-v2-checkbox-mark"></span>
                            <?php esc_html_e('Ukryj ikony przy pozycjach menu', 'modern-admin-styler-v2'); ?>
                        </label>
                    </div>
                    
                    <div class="mas-v2-field">
                        <label class="mas-v2-checkbox">
                            <input type="checkbox" 
                                   name="menu_hide_counters" 
                                   value="1" 
                                   <?php checked($settings['menu_hide_counters'] ?? false); ?>>
                            <span class="mas-v2-checkbox-mark"></span>
                            <?php esc_html_e('Ukryj liczniki (np. komentarze do moderacji)', 'modern-admin-styler-v2'); ?>
                        </label>
                    </div>
                    
                    <div class="mas-v2-field">
                        <label class="mas-v2-checkbox">
                            <input type="checkbox" 
                                   name="menu_hide_scrollbar" 
                                   value="1" 
                                   <?php checked($settings['menu_hide_scrollbar'] ?? false); ?>>
                            <span class="mas-v2-checkbox-mark"></span>
                            <?php esc_html_e('Ukryj pasek przewijania w menu', 'modern-admin-styler-v2'); ?>
                        </label>
                    </div>
                    
                    <div class="mas-v2-field">
                        <label class="mas-v2-checkbox">
                            <input type="checkbox" 
                                   name="menu_hide_collapse_button" 
                                   value="1" 
                                   <?php checked($settings['menu_hide_collapse_button'] ?? false); ?>>
                            <span class="mas-v2-checkbox-mark"></span>
                            <?php esc_html_e('Ukryj przycisk zwijania menu', 'modern-admin-styler-v2'); ?>
                        </label>
                    </div>
                    
                    <h3 style="margin-top: 2rem; color: rgba(255,255,255,0.9);">🖼️ <?php esc_html_e('Logo w menu', 'modern-admin-styler-v2'); ?></h3>
                    
                    <div class="mas-v2-field">
                        <label class="mas-v2-checkbox">
                            <input type="checkbox" 
                                   name="menu_show_wp_logo" 
                                   value="1" 
                                   <?php checked($settings['menu_show_wp_logo'] ?? true); ?>>
                            <span class="mas-v2-checkbox-mark"></span>
                            <?php esc_html_e('Pokaż domyślne logo WordPress', 'modern-admin-styler-v2'); ?>
                        </label>
                    </div>
                    
                    <div class="mas-v2-field">
                        <label for="menu_custom_logo" class="mas-v2-label">
                            <?php esc_html_e('Własne logo (URL)', 'modern-admin-styler-v2'); ?>
                        </label>
                        <div class="mas-v2-upload-field">
                            <input type="url" 
                                   id="menu_custom_logo" 
                                   name="menu_custom_logo" 
                                   value="<?php echo esc_attr($settings['menu_custom_logo'] ?? ''); ?>" 
                                   placeholder="https://example.com/logo.png"
                                   class="mas-v2-input">
                            <button type="button" 
                                    class="mas-v2-upload-btn button" 
                                    data-target="menu_custom_logo">
                                <?php esc_html_e('Wybierz z biblioteki', 'modern-admin-styler-v2'); ?>
                            </button>
                        </div>
                        <small class="mas-v2-help-text">
                            <?php esc_html_e('Rekomendowane: PNG/SVG, max 200px szerokości', 'modern-admin-styler-v2'); ?>
                        </small>
                    </div>
                    
                    <div class="mas-v2-field conditional-field" data-show-when="menu_custom_logo" data-show-value-not="">
                        <label for="menu_logo_height" class="mas-v2-label">
                            <?php esc_html_e('Wysokość logo', 'modern-admin-styler-v2'); ?>
                            <span class="mas-v2-slider-value" data-target="menu_logo_height"><?php echo esc_html($settings['menu_logo_height'] ?? 40); ?>px</span>
                        </label>
                        <input type="range" 
                               id="menu_logo_height" 
                               name="menu_logo_height" 
                               min="20" 
                               max="80" 
                               value="<?php echo esc_attr($settings['menu_logo_height'] ?? 40); ?>" 
                               class="mas-v2-slider">
                    </div>
                    
                    <div class="mas-v2-field conditional-field" data-show-when="menu_custom_logo" data-show-value-not="">
                        <label for="menu_logo_position" class="mas-v2-label">
                            <?php esc_html_e('Pozycja logo', 'modern-admin-styler-v2'); ?>
                        </label>
                        <select id="menu_logo_position" name="menu_logo_position" class="mas-v2-input">
                            <option value="top" <?php selected($settings['menu_logo_position'] ?? '', 'top'); ?>>
                                <?php esc_html_e('Na górze menu', 'modern-admin-styler-v2'); ?>
                            </option>
                            <option value="bottom" <?php selected($settings['menu_logo_position'] ?? '', 'bottom'); ?>>
                                <?php esc_html_e('Na dole menu', 'modern-admin-styler-v2'); ?>
                            </option>
                            <option value="replace" <?php selected($settings['menu_logo_position'] ?? '', 'replace'); ?>>
                                <?php esc_html_e('Zastąp logo WordPress', 'modern-admin-styler-v2'); ?>
                            </option>
                        </select>
                    </div>
                </div>
            </div>

            <!-- Submenu Tab -->
            <div id="submenu" class="mas-v2-tab-content <?php echo ($is_main_page || $active_tab === 'submenu') ? 'active' : ''; ?>" role="tabpanel" <?php echo (!$is_main_page && $active_tab !== 'submenu') ? 'style="display: none;"' : ''; ?>>
                <div class="mas-v2-card">
                    <div class="mas-v2-card-header">
                        <h2 class="mas-v2-card-title">
                            📂 <?php esc_html_e('Podmenu', 'modern-admin-styler-v2'); ?>
                        </h2>
                        <p class="mas-v2-card-description">
                            <?php esc_html_e('Konfiguracja stylowania rozwijanych podmenu w menu bocznym', 'modern-admin-styler-v2'); ?>
                        </p>
                    </div>
                    
                    <h3 style="margin-top: 1rem; color: rgba(255,255,255,0.9);">🎨 <?php esc_html_e('Kolory podmenu', 'modern-admin-styler-v2'); ?></h3>
                    
                    <div class="mas-v2-field">
                        <label for="submenu_background" class="mas-v2-label">
                            <?php esc_html_e('Tło podmenu', 'modern-admin-styler-v2'); ?>
                        </label>
                        <input type="color" 
                               id="submenu_background" 
                               name="submenu_background" 
                               value="<?php echo esc_attr($settings['submenu_background'] ?? '#2c3338'); ?>" 
                               class="mas-v2-color">
                    </div>
                    
                    <div class="mas-v2-field">
                        <label for="submenu_text_color" class="mas-v2-label">
                            <?php esc_html_e('Kolor tekstu', 'modern-admin-styler-v2'); ?>
                        </label>
                        <input type="color" 
                               id="submenu_text_color" 
                               name="submenu_text_color" 
                               value="<?php echo esc_attr($settings['submenu_text_color'] ?? '#ffffff'); ?>" 
                               class="mas-v2-color">
                    </div>
                    
                    <div class="mas-v2-field">
                        <label for="submenu_hover_background" class="mas-v2-label">
                            <?php esc_html_e('Tło przy najechaniu', 'modern-admin-styler-v2'); ?>
                        </label>
                        <input type="color" 
                               id="submenu_hover_background" 
                               name="submenu_hover_background" 
                               value="<?php echo esc_attr($settings['submenu_hover_background'] ?? '#32373c'); ?>" 
                               class="mas-v2-color">
                    </div>
                    
                    <div class="mas-v2-field">
                        <label for="submenu_hover_text_color" class="mas-v2-label">
                            <?php esc_html_e('Kolor tekstu przy najechaniu', 'modern-admin-styler-v2'); ?>
                        </label>
                        <input type="color" 
                               id="submenu_hover_text_color" 
                               name="submenu_hover_text_color" 
                               value="<?php echo esc_attr($settings['submenu_hover_text_color'] ?? '#00a0d2'); ?>" 
                               class="mas-v2-color">
                    </div>
                    
                    <div class="mas-v2-field">
                        <label for="submenu_active_background" class="mas-v2-label">
                            <?php esc_html_e('Tło aktywnego elementu', 'modern-admin-styler-v2'); ?>
                        </label>
                        <input type="color" 
                               id="submenu_active_background" 
                               name="submenu_active_background" 
                               value="<?php echo esc_attr($settings['submenu_active_background'] ?? '#0073aa'); ?>" 
                               class="mas-v2-color">
                    </div>
                    
                    <div class="mas-v2-field">
                        <label for="submenu_active_text_color" class="mas-v2-label">
                            <?php esc_html_e('Kolor tekstu aktywnego elementu', 'modern-admin-styler-v2'); ?>
                        </label>
                        <input type="color" 
                               id="submenu_active_text_color" 
                               name="submenu_active_text_color" 
                               value="<?php echo esc_attr($settings['submenu_active_text_color'] ?? '#ffffff'); ?>" 
                               class="mas-v2-color">
                    </div>
                    
                    <div class="mas-v2-field">
                        <label for="submenu_border_color" class="mas-v2-label">
                            <?php esc_html_e('Kolor obramowania', 'modern-admin-styler-v2'); ?>
                        </label>
                        <input type="color" 
                               id="submenu_border_color" 
                               name="submenu_border_color" 
                               value="<?php echo esc_attr($settings['submenu_border_color'] ?? '#464b50'); ?>" 
                               class="mas-v2-color">
                    </div>
                    
                    <h3 style="margin-top: 2rem; color: rgba(255,255,255,0.9);">📏 <?php esc_html_e('Wymiary i pozycjonowanie', 'modern-admin-styler-v2'); ?></h3>
                    
                    <div class="mas-v2-field">
                        <label for="submenu_width_type" class="mas-v2-label">
                            <?php esc_html_e('Tryb szerokości', 'modern-admin-styler-v2'); ?>
                        </label>
                        <select id="submenu_width_type" name="submenu_width_type" class="mas-v2-input">
                            <option value="auto" <?php selected($settings['submenu_width_type'] ?? '', 'auto'); ?>>
                                <?php esc_html_e('Automatyczna', 'modern-admin-styler-v2'); ?>
                            </option>
                            <option value="fixed" <?php selected($settings['submenu_width_type'] ?? '', 'fixed'); ?>>
                                <?php esc_html_e('Stała szerokość', 'modern-admin-styler-v2'); ?>
                            </option>
                            <option value="min-max" <?php selected($settings['submenu_width_type'] ?? '', 'min-max'); ?>>
                                <?php esc_html_e('Min-Max szerokość', 'modern-admin-styler-v2'); ?>
                            </option>
                        </select>
                    </div>
                    
                    <div class="mas-v2-field conditional-field" data-show-when="submenu_width_type" data-show-value="fixed">
                        <label for="submenu_width_value" class="mas-v2-label">
                            <?php esc_html_e('Szerokość podmenu', 'modern-admin-styler-v2'); ?>
                            <span class="mas-v2-slider-value" data-target="submenu_width_value"><?php echo esc_html($settings['submenu_width_value'] ?? 200); ?>px</span>
                        </label>
                        <input type="range" 
                               id="submenu_width_value" 
                               name="submenu_width_value" 
                               min="150" 
                               max="400" 
                               value="<?php echo esc_attr($settings['submenu_width_value'] ?? 200); ?>" 
                               class="mas-v2-slider">
                    </div>
                    
                    <div class="mas-v2-field conditional-field" data-show-when="submenu_width_type" data-show-value="min-max">
                        <label for="submenu_min_width" class="mas-v2-label">
                            <?php esc_html_e('Minimalna szerokość', 'modern-admin-styler-v2'); ?>
                            <span class="mas-v2-slider-value" data-target="submenu_min_width"><?php echo esc_html($settings['submenu_min_width'] ?? 180); ?>px</span>
                        </label>
                        <input type="range" 
                               id="submenu_min_width" 
                               name="submenu_min_width" 
                               min="120" 
                               max="300" 
                               value="<?php echo esc_attr($settings['submenu_min_width'] ?? 180); ?>" 
                               class="mas-v2-slider">
                               
                        <label for="submenu_max_width" class="mas-v2-label">
                            <?php esc_html_e('Maksymalna szerokość', 'modern-admin-styler-v2'); ?>
                            <span class="mas-v2-slider-value" data-target="submenu_max_width"><?php echo esc_html($settings['submenu_max_width'] ?? 300); ?>px</span>
                        </label>
                        <input type="range" 
                               id="submenu_max_width" 
                               name="submenu_max_width" 
                               min="200" 
                               max="500" 
                               value="<?php echo esc_attr($settings['submenu_max_width'] ?? 300); ?>" 
                               class="mas-v2-slider">
                    </div>
                    
                    <div class="mas-v2-field">
                        <label for="submenu_position" class="mas-v2-label">
                            <?php esc_html_e('Pozycja podmenu', 'modern-admin-styler-v2'); ?>
                        </label>
                        <select id="submenu_position" name="submenu_position" class="mas-v2-input">
                            <option value="right" <?php selected($settings['submenu_position'] ?? '', 'right'); ?>>
                                <?php esc_html_e('Po prawej stronie', 'modern-admin-styler-v2'); ?>
                            </option>
                            <option value="left" <?php selected($settings['submenu_position'] ?? '', 'left'); ?>>
                                <?php esc_html_e('Po lewej stronie', 'modern-admin-styler-v2'); ?>
                            </option>
                            <option value="overlay" <?php selected($settings['submenu_position'] ?? '', 'overlay'); ?>>
                                <?php esc_html_e('Jako nakładka', 'modern-admin-styler-v2'); ?>
                            </option>
                        </select>
                    </div>
                    
                    <div class="mas-v2-field">
                        <label for="submenu_offset_x" class="mas-v2-label">
                            <?php esc_html_e('Przesunięcie X (poziomo)', 'modern-admin-styler-v2'); ?>
                            <span class="mas-v2-slider-value" data-target="submenu_offset_x"><?php echo esc_html($settings['submenu_offset_x'] ?? 0); ?>px</span>
                        </label>
                        <input type="range" 
                               id="submenu_offset_x" 
                               name="submenu_offset_x" 
                               min="-50" 
                               max="50" 
                               value="<?php echo esc_attr($settings['submenu_offset_x'] ?? 0); ?>" 
                               class="mas-v2-slider">
                    </div>
                    
                    <div class="mas-v2-field">
                        <label for="submenu_offset_y" class="mas-v2-label">
                            <?php esc_html_e('Przesunięcie Y (pionowo)', 'modern-admin-styler-v2'); ?>
                            <span class="mas-v2-slider-value" data-target="submenu_offset_y"><?php echo esc_html($settings['submenu_offset_y'] ?? 0); ?>px</span>
                        </label>
                        <input type="range" 
                               id="submenu_offset_y" 
                               name="submenu_offset_y" 
                               min="-30" 
                               max="30" 
                               value="<?php echo esc_attr($settings['submenu_offset_y'] ?? 0); ?>" 
                               class="mas-v2-slider">
                    </div>
                    
                    <h3 style="margin-top: 2rem; color: rgba(255,255,255,0.9);">🎨 <?php esc_html_e('Wygląd i efekty', 'modern-admin-styler-v2'); ?></h3>
                    
                    <div class="mas-v2-field">
                        <label class="mas-v2-checkbox">
                            <input type="checkbox" 
                                   name="submenu_shadow" 
                                   value="1" 
                                   <?php checked($settings['submenu_shadow'] ?? true); ?>>
                            <span class="mas-v2-checkbox-mark"></span>
                            <?php esc_html_e('Cień podmenu', 'modern-admin-styler-v2'); ?>
                        </label>
                    </div>
                    
                    <div class="mas-v2-field">
                        <label for="submenu_border_radius_type" class="mas-v2-label">
                            <?php esc_html_e('Typ zaokrągleń', 'modern-admin-styler-v2'); ?>
                        </label>
                        <select id="submenu_border_radius_type" name="submenu_border_radius_type" class="mas-v2-input">
                            <option value="all" <?php selected($settings['submenu_border_radius_type'] ?? '', 'all'); ?>>
                                <?php esc_html_e('Wszystkie rogi', 'modern-admin-styler-v2'); ?>
                            </option>
                            <option value="individual" <?php selected($settings['submenu_border_radius_type'] ?? '', 'individual'); ?>>
                                <?php esc_html_e('Indywidualne rogi', 'modern-admin-styler-v2'); ?>
                            </option>
                        </select>
                    </div>
                    
                    <div class="mas-v2-field conditional-field" data-show-when="submenu_border_radius_type" data-show-value="all">
                        <label for="submenu_border_radius_all" class="mas-v2-label">
                            <?php esc_html_e('Promień zaokrąglenia', 'modern-admin-styler-v2'); ?>
                            <span class="mas-v2-slider-value" data-target="submenu_border_radius_all"><?php echo esc_html($settings['submenu_border_radius_all'] ?? 8); ?>px</span>
                        </label>
                        <input type="range" 
                               id="submenu_border_radius_all" 
                               name="submenu_border_radius_all" 
                               min="0" 
                               max="20" 
                               value="<?php echo esc_attr($settings['submenu_border_radius_all'] ?? 8); ?>" 
                               class="mas-v2-slider">
                    </div>
                    
                    <div class="mas-v2-field conditional-field" data-show-when="submenu_border_radius_type" data-show-value="individual">
                        <h4><?php esc_html_e('Indywidualne rogi (px):', 'modern-admin-styler-v2'); ?></h4>
                        
                        <label for="submenu_border_radius_top_left" class="mas-v2-label">
                            <?php esc_html_e('Lewy górny', 'modern-admin-styler-v2'); ?>
                            <span class="mas-v2-slider-value" data-target="submenu_border_radius_top_left"><?php echo esc_html($settings['submenu_border_radius_top_left'] ?? 8); ?>px</span>
                        </label>
                        <input type="range" 
                               id="submenu_border_radius_top_left" 
                               name="submenu_border_radius_top_left" 
                               min="0" 
                               max="20" 
                               value="<?php echo esc_attr($settings['submenu_border_radius_top_left'] ?? 8); ?>" 
                               class="mas-v2-slider">
                               
                        <label for="submenu_border_radius_top_right" class="mas-v2-label">
                            <?php esc_html_e('Prawy górny', 'modern-admin-styler-v2'); ?>
                            <span class="mas-v2-slider-value" data-target="submenu_border_radius_top_right"><?php echo esc_html($settings['submenu_border_radius_top_right'] ?? 8); ?>px</span>
                        </label>
                        <input type="range" 
                               id="submenu_border_radius_top_right" 
                               name="submenu_border_radius_top_right" 
                               min="0" 
                               max="20" 
                               value="<?php echo esc_attr($settings['submenu_border_radius_top_right'] ?? 8); ?>" 
                               class="mas-v2-slider">
                               
                        <label for="submenu_border_radius_bottom_right" class="mas-v2-label">
                            <?php esc_html_e('Prawy dolny', 'modern-admin-styler-v2'); ?>
                            <span class="mas-v2-slider-value" data-target="submenu_border_radius_bottom_right"><?php echo esc_html($settings['submenu_border_radius_bottom_right'] ?? 8); ?>px</span>
                        </label>
                        <input type="range" 
                               id="submenu_border_radius_bottom_right" 
                               name="submenu_border_radius_bottom_right" 
                               min="0" 
                               max="20" 
                               value="<?php echo esc_attr($settings['submenu_border_radius_bottom_right'] ?? 8); ?>" 
                               class="mas-v2-slider">
                               
                        <label for="submenu_border_radius_bottom_left" class="mas-v2-label">
                            <?php esc_html_e('Lewy dolny', 'modern-admin-styler-v2'); ?>
                            <span class="mas-v2-slider-value" data-target="submenu_border_radius_bottom_left"><?php echo esc_html($settings['submenu_border_radius_bottom_left'] ?? 8); ?>px</span>
                        </label>
                        <input type="range" 
                               id="submenu_border_radius_bottom_left" 
                               name="submenu_border_radius_bottom_left" 
                               min="0" 
                               max="20" 
                               value="<?php echo esc_attr($settings['submenu_border_radius_bottom_left'] ?? 8); ?>" 
                               class="mas-v2-slider">
                    </div>
                    
                    <h3 style="margin-top: 2rem; color: rgba(255,255,255,0.9);">⚡ <?php esc_html_e('Animacje i zachowanie', 'modern-admin-styler-v2'); ?></h3>
                    
                    <div class="mas-v2-field">
                        <label for="submenu_animation_speed" class="mas-v2-label">
                            <?php esc_html_e('Szybkość animacji', 'modern-admin-styler-v2'); ?>
                            <span class="mas-v2-slider-value" data-target="submenu_animation_speed"><?php echo esc_html($settings['submenu_animation_speed'] ?? 300); ?>ms</span>
                        </label>
                        <input type="range" 
                               id="submenu_animation_speed" 
                               name="submenu_animation_speed" 
                               min="100" 
                               max="800" 
                               step="50"
                               value="<?php echo esc_attr($settings['submenu_animation_speed'] ?? 300); ?>" 
                               class="mas-v2-slider">
                    </div>
                    
                    <div class="mas-v2-field">
                        <label class="mas-v2-checkbox">
                            <input type="checkbox" 
                                   name="submenu_text_wrap" 
                                   value="1" 
                                   <?php checked($settings['submenu_text_wrap'] ?? false); ?>>
                            <span class="mas-v2-checkbox-mark"></span>
                            <?php esc_html_e('Zawijanie długich nazw', 'modern-admin-styler-v2'); ?>
                        </label>
                    </div>
                    
                    <h3 style="margin-top: 2rem; color: rgba(255,255,255,0.9);">📝 <?php esc_html_e('Typografia i odstępy', 'modern-admin-styler-v2'); ?></h3>
                    
                    <div class="mas-v2-field">
                        <label for="submenu_padding_vertical" class="mas-v2-label">
                            <?php esc_html_e('Odstępy pionowe', 'modern-admin-styler-v2'); ?>
                            <span class="mas-v2-slider-value" data-target="submenu_padding_vertical"><?php echo esc_html($settings['submenu_padding_vertical'] ?? 8); ?>px</span>
                        </label>
                        <input type="range" 
                               id="submenu_padding_vertical" 
                               name="submenu_padding_vertical" 
                               min="4" 
                               max="20" 
                               value="<?php echo esc_attr($settings['submenu_padding_vertical'] ?? 8); ?>" 
                               class="mas-v2-slider">
                    </div>
                    
                    <div class="mas-v2-field">
                        <label for="submenu_padding_horizontal" class="mas-v2-label">
                            <?php esc_html_e('Odstępy poziome', 'modern-admin-styler-v2'); ?>
                            <span class="mas-v2-slider-value" data-target="submenu_padding_horizontal"><?php echo esc_html($settings['submenu_padding_horizontal'] ?? 16); ?>px</span>
                        </label>
                        <input type="range" 
                               id="submenu_padding_horizontal" 
                               name="submenu_padding_horizontal" 
                               min="8" 
                               max="30" 
                               value="<?php echo esc_attr($settings['submenu_padding_horizontal'] ?? 16); ?>" 
                               class="mas-v2-slider">
                    </div>
                    
                    <div class="mas-v2-field">
                        <label for="submenu_item_height" class="mas-v2-label">
                            <?php esc_html_e('Wysokość elementów', 'modern-admin-styler-v2'); ?>
                            <span class="mas-v2-slider-value" data-target="submenu_item_height"><?php echo esc_html($settings['submenu_item_height'] ?? 32); ?>px</span>
                        </label>
                        <input type="range" 
                               id="submenu_item_height" 
                               name="submenu_item_height" 
                               min="24" 
                               max="50" 
                               value="<?php echo esc_attr($settings['submenu_item_height'] ?? 32); ?>" 
                               class="mas-v2-slider">
                    </div>
                    
                    <div class="mas-v2-field">
                        <label for="submenu_font_size" class="mas-v2-label">
                            <?php esc_html_e('Rozmiar czcionki', 'modern-admin-styler-v2'); ?>
                            <span class="mas-v2-slider-value" data-target="submenu_font_size"><?php echo esc_html($settings['submenu_font_size'] ?? 13); ?>px</span>
                        </label>
                        <input type="range" 
                               id="submenu_font_size" 
                               name="submenu_font_size" 
                               min="10" 
                               max="18" 
                               value="<?php echo esc_attr($settings['submenu_font_size'] ?? 13); ?>" 
                               class="mas-v2-slider">
                    </div>
                    
                    <div class="mas-v2-field">
                        <label for="submenu_font_weight" class="mas-v2-label">
                            <?php esc_html_e('Grubość czcionki', 'modern-admin-styler-v2'); ?>
                        </label>
                        <select id="submenu_font_weight" name="submenu_font_weight" class="mas-v2-input">
                            <option value="normal" <?php selected($settings['submenu_font_weight'] ?? '', 'normal'); ?>>
                                <?php esc_html_e('Normalna (400)', 'modern-admin-styler-v2'); ?>
                            </option>
                            <option value="500" <?php selected($settings['submenu_font_weight'] ?? '', '500'); ?>>
                                <?php esc_html_e('Średnia (500)', 'modern-admin-styler-v2'); ?>
                            </option>
                            <option value="600" <?php selected($settings['submenu_font_weight'] ?? '', '600'); ?>>
                                <?php esc_html_e('Semi-bold (600)', 'modern-admin-styler-v2'); ?>
                            </option>
                            <option value="bold" <?php selected($settings['submenu_font_weight'] ?? '', 'bold'); ?>>
                                <?php esc_html_e('Pogrubiona (700)', 'modern-admin-styler-v2'); ?>
                            </option>
                        </select>
                    </div>
                </div>
            </div>

            <!-- Content Tab -->
                <div id="content" class="mas-v2-tab-content <?php echo ($is_main_page || $active_tab === 'content') ? 'active' : ''; ?>" role="tabpanel" <?php echo (!$is_main_page && $active_tab !== 'content') ? 'style="display: none;"' : ''; ?>>
                    <div class="mas-v2-card">
                        <div class="mas-v2-card-header">
                            <h2 class="mas-v2-card-title">
                                📄 <?php esc_html_e('Obszar treści', 'modern-admin-styler-v2'); ?>
                    </h2>
                        </div>
                        
                        <div class="mas-v2-field">
                            <label class="mas-v2-checkbox">
                                <input type="checkbox" 
                                       name="rounded_corners" 
                                       value="1" 
                                       <?php checked($settings['rounded_corners'] ?? true); ?>>
                                <span class="mas-v2-checkbox-mark"></span>
                                <?php esc_html_e('Zaokrąglone rogi elementów', 'modern-admin-styler-v2'); ?>
                            </label>
                        </div>
                            
                            <div class="mas-v2-field">
                            <label class="mas-v2-checkbox">
                                <input type="checkbox" 
                                       name="box_shadows" 
                                       value="1" 
                                       <?php checked($settings['box_shadows'] ?? true); ?>>
                                <span class="mas-v2-checkbox-mark"></span>
                                <?php esc_html_e('Cienie elementów', 'modern-admin-styler-v2'); ?>
                                </label>
                            </div>
                            
                            <div class="mas-v2-field">
                            <label for="content_bg" class="mas-v2-label">
                                <?php esc_html_e('Tło obszaru treści', 'modern-admin-styler-v2'); ?>
                                </label>
                            <input type="color" 
                                   id="content_bg" 
                                   name="content_bg" 
                                   value="<?php echo esc_attr($settings['content_bg'] ?? '#ffffff'); ?>" 
                                   class="mas-v2-input">
                            </div>
                            
                            <div class="mas-v2-field">
                                <label for="content_text_color" class="mas-v2-label">
                                <?php esc_html_e('Kolor tekstu treści', 'modern-admin-styler-v2'); ?>
                                </label>
                            <input type="color" 
                                       id="content_text_color" 
                                       name="content_text_color" 
                                       value="<?php echo esc_attr($settings['content_text_color'] ?? '#333333'); ?>" 
                                   class="mas-v2-input">
                            </div>
                            
                            <div class="mas-v2-field">
                            <label for="page_bg" class="mas-v2-label">
                                <?php esc_html_e('Tło strony', 'modern-admin-styler-v2'); ?>
                                </label>
                            <input type="color" 
                                   id="page_bg" 
                                   name="page_bg" 
                                   value="<?php echo esc_attr($settings['page_bg'] ?? '#f1f1f1'); ?>" 
                                   class="mas-v2-input">
                        </div>
                            
                            <div class="mas-v2-field">
                            <label for="content_padding" class="mas-v2-label">
                                <?php esc_html_e('Odstępy wewnętrzne', 'modern-admin-styler-v2'); ?>
                                <span class="mas-v2-slider-value" data-target="content_padding"><?php echo esc_html($settings['content_padding'] ?? 20); ?>px</span>
                                </label>
                            <input type="range" 
                                   id="content_padding" 
                                   name="content_padding" 
                                   min="10" 
                                   max="50" 
                                   value="<?php echo esc_attr($settings['content_padding'] ?? 20); ?>" 
                                   class="mas-v2-slider">
                            </div>
                            
                            <div class="mas-v2-field">
                            <label for="content_background_type" class="mas-v2-label">
                                <?php esc_html_e('Typ tła', 'modern-admin-styler-v2'); ?>
                                </label>
                            <select id="content_background_type" name="content_background_type" class="mas-v2-input">
                                <option value="solid" <?php selected($settings['content_background_type'] ?? '', 'solid'); ?>>
                                    <?php esc_html_e('Jednolite', 'modern-admin-styler-v2'); ?>
                                </option>
                                <option value="gradient" <?php selected($settings['content_background_type'] ?? '', 'gradient'); ?>>
                                    <?php esc_html_e('Gradient', 'modern-admin-styler-v2'); ?>
                                </option>
                            </select>
                            </div>
                            
                            <div class="mas-v2-field">
                            <label for="content_gradient_end" class="mas-v2-label">
                                <?php esc_html_e('Kolor końcowy gradientu', 'modern-admin-styler-v2'); ?>
                                </label>
                            <input type="color" 
                                   id="content_gradient_end" 
                                   name="content_gradient_end" 
                                   value="<?php echo esc_attr($settings['content_gradient_end'] ?? '#f8f9fa'); ?>" 
                                   class="mas-v2-input">
                        </div>
                            
                            <div class="mas-v2-field">
                                <label class="mas-v2-checkbox">
                                    <input type="checkbox" 
                                       name="content_glassmorphism" 
                                           value="1" 
                                       <?php checked($settings['content_glassmorphism'] ?? false); ?>>
                                    <span class="mas-v2-checkbox-mark"></span>
                                <?php esc_html_e('✨ Efekt glassmorphism', 'modern-admin-styler-v2'); ?>
                                </label>
                            </div>
                            
                            <div class="mas-v2-field">
                                <label class="mas-v2-checkbox">
                                    <input type="checkbox" 
                                       name="content_floating" 
                                           value="1" 
                                       <?php checked($settings['content_floating'] ?? false); ?>>
                                    <span class="mas-v2-checkbox-mark"></span>
                                <?php esc_html_e('🎯 Floating content', 'modern-admin-styler-v2'); ?>
                                </label>
                            </div>
                            
                            <div class="mas-v2-field">
                                <label class="mas-v2-checkbox">
                                    <input type="checkbox" 
                                       name="content_blur_background" 
                                           value="1" 
                                       <?php checked($settings['content_blur_background'] ?? false); ?>>
                                    <span class="mas-v2-checkbox-mark"></span>
                                <?php esc_html_e('🌫️ Blur tła', 'modern-admin-styler-v2'); ?>
                                </label>
                    </div>
                </div>
            </div>

            <!-- Typography Tab -->
                <div id="typography" class="mas-v2-tab-content <?php echo ($is_main_page || $active_tab === 'typography') ? 'active' : ''; ?>" role="tabpanel" <?php echo (!$is_main_page && $active_tab !== 'typography') ? 'style="display: none;"' : ''; ?>>
                    <div class="mas-v2-card">
                        <div class="mas-v2-card-header">
                            <h2 class="mas-v2-card-title">
                                🔤 <?php esc_html_e('Typografia', 'modern-admin-styler-v2'); ?>
                    </h2>
                        </div>
                            
                            <div class="mas-v2-field">
                            <label for="font_family" class="mas-v2-label">
                                <?php esc_html_e('Rodzina czcionek', 'modern-admin-styler-v2'); ?>
                                </label>
                            <select id="font_family" name="font_family" class="mas-v2-input">
                                <option value="system" <?php selected($settings['font_family'] ?? '', 'system'); ?>>
                                    <?php esc_html_e('Systemowa', 'modern-admin-styler-v2'); ?>
                                    </option>
                                <option value="inter" <?php selected($settings['font_family'] ?? '', 'inter'); ?>>
                                    Inter (Zalecane)
                                </option>
                                <option value="roboto" <?php selected($settings['font_family'] ?? '', 'roboto'); ?>>
                                    Roboto
                                </option>
                                <option value="open-sans" <?php selected($settings['font_family'] ?? '', 'open-sans'); ?>>
                                    Open Sans
                                </option>
                                <option value="lato" <?php selected($settings['font_family'] ?? '', 'lato'); ?>>
                                    Lato
                                </option>
                                <option value="montserrat" <?php selected($settings['font_family'] ?? '', 'montserrat'); ?>>
                                    Montserrat
                                </option>
                                <option value="poppins" <?php selected($settings['font_family'] ?? '', 'poppins'); ?>>
                                    Poppins
                                </option>
                                <option value="source-sans-pro" <?php selected($settings['font_family'] ?? '', 'source-sans-pro'); ?>>
                                    Source Sans Pro
                                </option>
                                </select>
                            </div>
                            
                            <div class="mas-v2-field">
                            <label for="font_size" class="mas-v2-label">
                                <?php esc_html_e('Rozmiar czcionki', 'modern-admin-styler-v2'); ?>
                                <span class="mas-v2-slider-value" data-target="font_size"><?php echo esc_html($settings['font_size'] ?? 18); ?>px</span>
                                </label>
                            <input type="range" 
                                   id="font_size" 
                                   name="font_size" 
                                   min="11" 
                                   max="24" 
                                   value="<?php echo esc_attr($settings['font_size'] ?? 18); ?>" 
                                   class="mas-v2-slider">
                            </div>
                            
                            <div class="mas-v2-field">
                            <label for="line_height" class="mas-v2-label">
                                <?php esc_html_e('Wysokość linii', 'modern-admin-styler-v2'); ?>
                                <span class="mas-v2-slider-value" data-target="line_height"><?php echo esc_html($settings['line_height'] ?? 1.6); ?></span>
                                </label>
                            <input type="range" 
                                   id="line_height" 
                                   name="line_height" 
                                   min="1.2" 
                                   max="2.0" 
                                   step="0.1"
                                   value="<?php echo esc_attr($settings['line_height'] ?? 1.6); ?>" 
                                   class="mas-v2-slider">
                            </div>

                        <div class="mas-v2-field">
                            <label for="font_weight" class="mas-v2-label">
                                <?php esc_html_e('Grubość czcionki', 'modern-admin-styler-v2'); ?>
                            </label>
                            <select id="font_weight" name="font_weight" class="mas-v2-input">
                                <option value="300" <?php selected($settings['font_weight'] ?? '', '300'); ?>>
                                    <?php esc_html_e('Lekka (300)', 'modern-admin-styler-v2'); ?>
                                </option>
                                <option value="400" <?php selected($settings['font_weight'] ?? '', '400'); ?>>
                                    <?php esc_html_e('Normalna (400)', 'modern-admin-styler-v2'); ?>
                                </option>
                                <option value="500" <?php selected($settings['font_weight'] ?? '', '500'); ?>>
                                    <?php esc_html_e('Średnia (500)', 'modern-admin-styler-v2'); ?>
                                </option>
                                <option value="600" <?php selected($settings['font_weight'] ?? '', '600'); ?>>
                                    <?php esc_html_e('Semi-bold (600)', 'modern-admin-styler-v2'); ?>
                                </option>
                                <option value="700" <?php selected($settings['font_weight'] ?? '', '700'); ?>>
                                    <?php esc_html_e('Pogrubiona (700)', 'modern-admin-styler-v2'); ?>
                                </option>
                            </select>
                        </div>
                            
                            <div class="mas-v2-field">
                                <label for="heading_font_size" class="mas-v2-label">
                                    <?php esc_html_e('Rozmiar nagłówków H1', 'modern-admin-styler-v2'); ?>
                                    <span class="mas-v2-slider-value" data-target="heading_font_size"><?php echo esc_html($settings['heading_font_size'] ?? 32); ?>px</span>
                                </label>
                                <input type="range" 
                                       id="heading_font_size" 
                                       name="heading_font_size" 
                                   min="24" 
                                       max="48" 
                                       value="<?php echo esc_attr($settings['heading_font_size'] ?? 32); ?>" 
                                       class="mas-v2-slider">
                            </div>
                            
                            <div class="mas-v2-field">
                            <label for="heading_font_weight" class="mas-v2-label">
                                <?php esc_html_e('Grubość nagłówków', 'modern-admin-styler-v2'); ?>
                                </label>
                            <select id="heading_font_weight" name="heading_font_weight" class="mas-v2-input">
                                <option value="400" <?php selected($settings['heading_font_weight'] ?? '', '400'); ?>>
                                    <?php esc_html_e('Normalna (400)', 'modern-admin-styler-v2'); ?>
                                </option>
                                <option value="500" <?php selected($settings['heading_font_weight'] ?? '', '500'); ?>>
                                    <?php esc_html_e('Średnia (500)', 'modern-admin-styler-v2'); ?>
                                </option>
                                <option value="600" <?php selected($settings['heading_font_weight'] ?? '', '600'); ?>>
                                    <?php esc_html_e('Semi-bold (600)', 'modern-admin-styler-v2'); ?>
                                </option>
                                <option value="700" <?php selected($settings['heading_font_weight'] ?? '', '700'); ?>>
                                    <?php esc_html_e('Pogrubiona (700)', 'modern-admin-styler-v2'); ?>
                                </option>
                                <option value="800" <?php selected($settings['heading_font_weight'] ?? '', '800'); ?>>
                                    <?php esc_html_e('Extra bold (800)', 'modern-admin-styler-v2'); ?>
                                </option>
                            </select>
                            </div>
                            
                            <div class="mas-v2-field">
                            <label class="mas-v2-checkbox">
                                <input type="checkbox" 
                                       name="google_fonts_enabled" 
                                       value="1" 
                                       <?php checked($settings['google_fonts_enabled'] ?? true); ?>>
                                <span class="mas-v2-checkbox-mark"></span>
                                <?php esc_html_e('Włącz Google Fonts', 'modern-admin-styler-v2'); ?>
                                </label>
                    </div>
                </div>
            </div>

            <!-- Effects Tab -->
                <div id="effects" class="mas-v2-tab-content <?php echo ($is_main_page || $active_tab === 'effects') ? 'active' : ''; ?>" role="tabpanel" <?php echo (!$is_main_page && $active_tab !== 'effects') ? 'style="display: none;"' : ''; ?>>
                        <div class="mas-v2-card">
                        <div class="mas-v2-card-header">
                            <h2 class="mas-v2-card-title">
                                ✨ <?php esc_html_e('Efekty wizualne', 'modern-admin-styler-v2'); ?>
                            </h2>
                            </div>
                            
                            <div class="mas-v2-field">
                                <label class="mas-v2-checkbox">
                                    <input type="checkbox" 
                                       name="animations" 
                                           value="1" 
                                       <?php checked($settings['animations'] ?? true); ?>>
                                    <span class="mas-v2-checkbox-mark"></span>
                                <?php esc_html_e('Włącz animacje', 'modern-admin-styler-v2'); ?>
                                </label>
                            </div>
                            
                            <div class="mas-v2-field">
                                <label class="mas-v2-checkbox">
                                    <input type="checkbox" 
                                       name="glassmorphism" 
                                           value="1" 
                                       <?php checked($settings['glassmorphism'] ?? true); ?>>
                                    <span class="mas-v2-checkbox-mark"></span>
                                <?php esc_html_e('Efekt glassmorphism', 'modern-admin-styler-v2'); ?>
                                </label>
                            </div>
                            
                            <div class="mas-v2-field">
                                <label class="mas-v2-checkbox">
                                    <input type="checkbox" 
                                       name="hover_effects" 
                                           value="1" 
                                       <?php checked($settings['hover_effects'] ?? true); ?>>
                                    <span class="mas-v2-checkbox-mark"></span>
                                <?php esc_html_e('Efekty hover', 'modern-admin-styler-v2'); ?>
                                </label>
                            </div>

                        <div class="mas-v2-field">
                            <label for="animation_speed" class="mas-v2-label">
                                <?php esc_html_e('Szybkość animacji', 'modern-admin-styler-v2'); ?>
                                <span class="mas-v2-slider-value" data-target="animation_speed"><?php echo esc_html($settings['animation_speed'] ?? 300); ?>ms</span>
                            </label>
                            <input type="range" 
                                   id="animation_speed" 
                                   name="animation_speed" 
                                   min="100" 
                                   max="800" 
                                   step="50"
                                   value="<?php echo esc_attr($settings['animation_speed'] ?? 300); ?>" 
                                   class="mas-v2-slider">
                        </div>
                        
                        <!-- Przyciski i formularze -->
                        <h3 style="margin-top: 2rem; color: rgba(255,255,255,0.9);">🔘 <?php esc_html_e('Przyciski', 'modern-admin-styler-v2'); ?></h3>
                            
                            <div class="mas-v2-field">
                            <label for="button_bg" class="mas-v2-label">
                                <?php esc_html_e('Tło przycisków', 'modern-admin-styler-v2'); ?>
                                </label>
                            <input type="color" 
                                   id="button_bg" 
                                   name="button_bg" 
                                   value="<?php echo esc_attr($settings['button_bg'] ?? '#0073aa'); ?>" 
                                   class="mas-v2-input">
                            </div>
                            
                            <div class="mas-v2-field">
                            <label for="button_text_color" class="mas-v2-label">
                                <?php esc_html_e('Kolor tekstu przycisków', 'modern-admin-styler-v2'); ?>
                                </label>
                            <input type="color" 
                                   id="button_text_color" 
                                   name="button_text_color" 
                                   value="<?php echo esc_attr($settings['button_text_color'] ?? '#ffffff'); ?>" 
                                   class="mas-v2-input">
                            </div>
                            
                            <div class="mas-v2-field">
                            <label for="button_border_radius" class="mas-v2-label">
                                <?php esc_html_e('Zaokrąglenie przycisków', 'modern-admin-styler-v2'); ?>
                                <span class="mas-v2-slider-value" data-target="button_border_radius"><?php echo esc_html($settings['button_border_radius'] ?? 4); ?>px</span>
                                </label>
                            <input type="range" 
                                   id="button_border_radius" 
                                   name="button_border_radius" 
                                   min="0" 
                                   max="20" 
                                   value="<?php echo esc_attr($settings['button_border_radius'] ?? 4); ?>" 
                                   class="mas-v2-slider">
                            </div>

                        <h3 style="margin-top: 2rem; color: rgba(255,255,255,0.9);">📝 <?php esc_html_e('Formularze', 'modern-admin-styler-v2'); ?></h3>
                            
                            <div class="mas-v2-field">
                            <label for="form_field_bg_color" class="mas-v2-label">
                                <?php esc_html_e('Tło pól formularza', 'modern-admin-styler-v2'); ?>
                                </label>
                            <input type="color" 
                                   id="form_field_bg_color" 
                                   name="form_field_bg_color" 
                                   value="<?php echo esc_attr($settings['form_field_bg_color'] ?? '#ffffff'); ?>" 
                                   class="mas-v2-input">
                            </div>

                        <div class="mas-v2-field">
                            <label for="form_field_border_color" class="mas-v2-label">
                                <?php esc_html_e('Kolor obramowania pól', 'modern-admin-styler-v2'); ?>
                            </label>
                            <input type="color" 
                                   id="form_field_border_color" 
                                   name="form_field_border_color" 
                                   value="<?php echo esc_attr($settings['form_field_border_color'] ?? '#ddd'); ?>" 
                                   class="mas-v2-input">
                        </div>

                        <div class="mas-v2-field">
                            <label for="form_field_focus_color" class="mas-v2-label">
                                <?php esc_html_e('Kolor focus pól', 'modern-admin-styler-v2'); ?>
                            </label>
                            <input type="color" 
                                   id="form_field_focus_color" 
                                   name="form_field_focus_color" 
                                   value="<?php echo esc_attr($settings['form_field_focus_color'] ?? '#0073aa'); ?>" 
                                   class="mas-v2-input">
                    </div>
                </div>
            </div>

            <!-- Advanced Tab -->
                <div id="advanced" class="mas-v2-tab-content <?php echo ($is_main_page || $active_tab === 'advanced') ? 'active' : ''; ?>" role="tabpanel" <?php echo (!$is_main_page && $active_tab !== 'advanced') ? 'style="display: none;"' : ''; ?>>
                    <div class="mas-v2-card">
                        <div class="mas-v2-card-header">
                            <h2 class="mas-v2-card-title">
                                ⚙️ <?php esc_html_e('Opcje zaawansowane', 'modern-admin-styler-v2'); ?>
                    </h2>
                        </div>
                            
                            <div class="mas-v2-field">
                            <label class="mas-v2-checkbox">
                                <input type="checkbox" 
                                       id="mas-v2-live-preview"
                                       name="live_preview" 
                                       value="1" 
                                       checked 
                                       disabled 
                                       style="opacity: 0.7;">
                                <span class="mas-v2-checkbox-mark"></span>
                                <?php esc_html_e('Podgląd na żywo', 'modern-admin-styler-v2'); ?>
                                <small class="mas-v2-help-text">Zawsze aktywny dla lepszego UX</small>
                                </label>
                            </div>
                            
                            <div class="mas-v2-field">
                                <label class="mas-v2-checkbox">
                                    <input type="checkbox" 
                                       name="debug_mode" 
                                           value="1" 
                                       <?php checked($settings['debug_mode'] ?? false); ?>>
                                    <span class="mas-v2-checkbox-mark"></span>
                                <?php esc_html_e('Tryb debugowania', 'modern-admin-styler-v2'); ?>
                                </label>
                            </div>
                            
                            <div class="mas-v2-field">
                                <label class="mas-v2-checkbox">
                                    <input type="checkbox" 
                                       name="apply_to_frontend" 
                                           value="1" 
                                       <?php checked($settings['apply_to_frontend'] ?? false); ?>>
                                    <span class="mas-v2-checkbox-mark"></span>
                                <?php esc_html_e('Zastosuj na frontend', 'modern-admin-styler-v2'); ?>
                                </label>
                        </div>
                            
                            <div class="mas-v2-field">
                                <label class="mas-v2-checkbox">
                                    <input type="checkbox" 
                                       name="hide_admin_footer" 
                                           value="1" 
                                       <?php checked($settings['hide_admin_footer'] ?? false); ?>>
                                    <span class="mas-v2-checkbox-mark"></span>
                                <?php esc_html_e('Ukryj stopkę admin', 'modern-admin-styler-v2'); ?>
                                </label>
                            </div>
                            
                            <div class="mas-v2-field">
                                <label class="mas-v2-checkbox">
                                    <input type="checkbox" 
                                       name="hide_screen_options" 
                                           value="1" 
                                       <?php checked($settings['hide_screen_options'] ?? false); ?>>
                                    <span class="mas-v2-checkbox-mark"></span>
                                <?php esc_html_e('Ukryj opcje ekranu', 'modern-admin-styler-v2'); ?>
                                </label>
                        </div>
                            
                            <div class="mas-v2-field">
                                <label class="mas-v2-checkbox">
                                    <input type="checkbox" 
                                       name="hide_help_tab" 
                                           value="1" 
                                       <?php checked($settings['hide_help_tab'] ?? false); ?>>
                                    <span class="mas-v2-checkbox-mark"></span>
                                <?php esc_html_e('Ukryj zakładkę pomocy', 'modern-admin-styler-v2'); ?>
                                </label>
                            </div>

                        <h3 style="margin-top: 2rem; color: rgba(255,255,255,0.9);">🔐 <?php esc_html_e('Strona logowania', 'modern-admin-styler-v2'); ?></h3>

                        <div class="mas-v2-field">
                            <label for="login_bg" class="mas-v2-label">
                                <?php esc_html_e('Tło strony logowania', 'modern-admin-styler-v2'); ?>
                            </label>
                            <input type="color" 
                                   id="login_bg" 
                                   name="login_bg" 
                                   value="<?php echo esc_attr($settings['login_bg'] ?? '#f1f1f1'); ?>" 
                                   class="mas-v2-input">
                        </div>

                        <div class="mas-v2-field">
                            <label for="login_form_bg" class="mas-v2-label">
                                <?php esc_html_e('Tło formularza logowania', 'modern-admin-styler-v2'); ?>
                            </label>
                            <input type="color" 
                                   id="login_form_bg" 
                                   name="login_form_bg" 
                                   value="<?php echo esc_attr($settings['login_form_bg'] ?? '#ffffff'); ?>" 
                                   class="mas-v2-input">
                        </div>

                        <div class="mas-v2-field">
                            <label for="login_logo_url" class="mas-v2-label">
                                <?php esc_html_e('URL logo logowania', 'modern-admin-styler-v2'); ?>
                            </label>
                            <input type="url" 
                                   id="login_logo_url" 
                                   name="login_logo_url" 
                                   value="<?php echo esc_attr($settings['login_logo_url'] ?? ''); ?>" 
                                   class="mas-v2-input"
                                   placeholder="https://example.com/logo.png">
                        </div>

                        <div class="mas-v2-field">
                            <label for="login_logo_width" class="mas-v2-label">
                                <?php esc_html_e('Szerokość logo', 'modern-admin-styler-v2'); ?>
                                <span class="mas-v2-slider-value" data-target="login_logo_width"><?php echo esc_html($settings['login_logo_width'] ?? 84); ?>px</span>
                            </label>
                            <input type="range" 
                                   id="login_logo_width" 
                                   name="login_logo_width" 
                                   min="50" 
                                   max="300" 
                                   value="<?php echo esc_attr($settings['login_logo_width'] ?? 84); ?>" 
                                   class="mas-v2-slider">
                        </div>
                            
                            <div class="mas-v2-field">
                                <label class="mas-v2-checkbox">
                                    <input type="checkbox" 
                                       name="custom_css_enabled" 
                                           value="1" 
                                       <?php checked($settings['custom_css_enabled'] ?? false); ?>>
                                    <span class="mas-v2-checkbox-mark"></span>
                                <?php esc_html_e('Włącz własny CSS', 'modern-admin-styler-v2'); ?>
                                </label>
                            </div>

                        <div class="mas-v2-field">
                            <label for="custom_css" class="mas-v2-label">
                                <?php esc_html_e('Własny CSS', 'modern-admin-styler-v2'); ?>
                            </label>
                            <textarea id="custom_css" 
                                      name="custom_css" 
                                      class="mas-v2-textarea"
                                      rows="8"
                                      placeholder="/* Dodaj swój własny CSS tutaj */"><?php echo esc_textarea($settings['custom_css'] ?? ''); ?></textarea>
                        </div>

                        <h3 style="margin-top: 2rem; color: rgba(255,255,255,0.9);">⚡ <?php esc_html_e('Wydajność', 'modern-admin-styler-v2'); ?></h3>

                        <div class="mas-v2-field">
                            <label class="mas-v2-checkbox">
                                <input type="checkbox" 
                                   name="css_cache_enabled" 
                                   value="1" 
                                   <?php checked($settings['css_cache_enabled'] ?? true); ?>>
                                <span class="mas-v2-checkbox-mark"></span>
                                <?php esc_html_e('Cache CSS (zalecane)', 'modern-admin-styler-v2'); ?>
                            </label>
                            <small class="mas-v2-help-text">
                                <?php esc_html_e('Przechowuje skompilowany CSS w cache dla szybszego ładowania', 'modern-admin-styler-v2'); ?>
                            </small>
                        </div>

                        <div class="mas-v2-field">
                            <label class="mas-v2-checkbox">
                                <input type="checkbox" 
                                   name="css_minification_enabled" 
                                   value="1" 
                                   <?php checked($settings['css_minification_enabled'] ?? true); ?>>
                                <span class="mas-v2-checkbox-mark"></span>
                                <?php esc_html_e('Minifikacja CSS', 'modern-admin-styler-v2'); ?>
                            </label>
                            <small class="mas-v2-help-text">
                                <?php esc_html_e('Usuwa zbędne spacje i komentarze z CSS', 'modern-admin-styler-v2'); ?>
                            </small>
                        </div>

                        <div class="mas-v2-field">
                            <label class="mas-v2-checkbox">
                                <input type="checkbox" 
                                   name="performance_mode" 
                                   value="1" 
                                   <?php checked($settings['performance_mode'] ?? false); ?>>
                                <span class="mas-v2-checkbox-mark"></span>
                                <?php esc_html_e('Tryb wydajności', 'modern-admin-styler-v2'); ?>
                            </label>
                            <small class="mas-v2-help-text">
                                <?php esc_html_e('Wyłącza ciężkie animacje i efekty dla lepszej wydajności', 'modern-admin-styler-v2'); ?>
                            </small>
                        </div>
                    </div>
                </div>
            </form>
            </div>

        <!-- Right Column - Quick Stats & Tools -->
        <div class="mas-v2-sidebar">
            <!-- Quick Actions Card -->
            <div class="mas-v2-card">
                <div class="mas-v2-card-header">
                    <h2 class="mas-v2-card-title">
                        🚀 <?php esc_html_e('Szybkie akcje', 'modern-admin-styler-v2'); ?>
                    </h2>
                </div>
                
                <div style="display: flex; flex-direction: column; gap: 1rem;">
                    <button type="button" class="mas-v2-btn mas-v2-btn-secondary" id="mas-v2-reset-btn">
                        🔄 <?php esc_html_e('Reset ustawień', 'modern-admin-styler-v2'); ?>
                    </button>
                    <button type="button" class="mas-v2-btn mas-v2-btn-secondary" id="mas-v2-clear-cache-btn">
                        🧹 <?php esc_html_e('Wyczyść cache', 'modern-admin-styler-v2'); ?>
                    </button>
                    <button type="button" class="mas-v2-btn mas-v2-btn-secondary" onclick="window.open('<?php echo admin_url(); ?>', '_blank')">
                        👁️ <?php esc_html_e('Podgląd panelu', 'modern-admin-styler-v2'); ?>
                    </button>
                    <button type="button" class="mas-v2-btn mas-v2-btn-secondary" onclick="location.reload()">
                        🔃 <?php esc_html_e('Odśwież stronę', 'modern-admin-styler-v2'); ?>
                    </button>
                </div>
                        
                <!-- Progress bar will be added by JavaScript -->
                        </div>
                        
            <!-- Status Card -->
                            <div class="mas-v2-card">
                <div class="mas-v2-card-header">
                    <h2 class="mas-v2-card-title">
                        📊 <?php esc_html_e('Status systemu', 'modern-admin-styler-v2'); ?>
                    </h2>
                            </div>
                
                <div style="display: flex; flex-direction: column; gap: 1rem;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="color: rgba(255,255,255,0.8);"><?php esc_html_e('Status:', 'modern-admin-styler-v2'); ?></span>
                        <span style="color: #4ade80; font-weight: 600;" id="mas-v2-status-value">
                            ✅ <?php esc_html_e('Aktywny', 'modern-admin-styler-v2'); ?>
                        </span>
                        </div>
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="color: rgba(255,255,255,0.8);"><?php esc_html_e('Wersja:', 'modern-admin-styler-v2'); ?></span>
                        <span style="color: white; font-weight: 600;">2.1.0</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="color: rgba(255,255,255,0.8);"><?php esc_html_e('Ostatni zapis:', 'modern-admin-styler-v2'); ?></span>
                        <span style="color: white; font-weight: 600;" id="mas-v2-last-save">-</span>
                </div>
            </div>
                
                <!-- Progress bar will be added by JavaScript -->
    </div>

            <!-- Tips Card -->
            <div class="mas-v2-card">
                <div class="mas-v2-card-header">
                    <h2 class="mas-v2-card-title">
                        💡 <?php esc_html_e('Wskazówki', 'modern-admin-styler-v2'); ?>
                    </h2>
            </div>
                
                <div style="color: rgba(255,255,255,0.8); font-size: 0.875rem; line-height: 1.6;">
                    <p style="margin: 0 0 1rem 0;">
                        🌙 <?php esc_html_e('Użyj Ctrl+Shift+T aby przełączyć motyw', 'modern-admin-styler-v2'); ?>
                    </p>
                    <p style="margin: 0 0 1rem 0;">
                        🎨 <?php esc_html_e('Wszystkie zmiany są automatycznie zapisywane', 'modern-admin-styler-v2'); ?>
                    </p>
                    <p style="margin: 0;">
                        ⚡ <?php esc_html_e('Wyłącz animacje dla lepszej wydajności', 'modern-admin-styler-v2'); ?>
                </p>
                </div>
            </div>
        </div>
    </div>
</div>

