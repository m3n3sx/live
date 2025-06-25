<?php
/**
 * Template strony administracyjnej - Modern Admin Styler V2
 * Prosty, czysty design bez problemów z layoutem
 */
if (!defined('ABSPATH')) exit;

$plugin_url = MAS_V2_PLUGIN_URL;
?>

<div class="mas-v2-wrap">
    <!-- HEADER -->
    <div class="mas-v2-header">
        <div class="mas-v2-header-content">
            <div class="mas-v2-header-left">
                <h1 class="mas-v2-title">
                    <span class="mas-v2-icon">🎨</span>
                    Modern Admin Styler V2
                </h1>
                <p class="mas-v2-subtitle">Profesjonalne stylowanie panelu WordPress - wersja przepisana od nowa</p>
            </div>
            <div class="mas-v2-header-actions">
                <button id="mas-v2-save" class="mas-v2-btn mas-v2-btn-primary">
                    <span class="dashicons dashicons-saved"></span>
                    Zapisz ustawienia
                </button>
                <button id="mas-v2-reset" class="mas-v2-btn mas-v2-btn-secondary">
                    <span class="dashicons dashicons-update"></span>
                    Reset
                </button>
            </div>
        </div>
    </div>

    <!-- NAVIGATION TABS -->
    <nav class="mas-v2-nav">
        <ul class="mas-v2-nav-tabs">
            <li><a href="#overview" class="mas-v2-nav-tab active">🏠 Przegląd</a></li>
            <li><a href="#admin-bar" class="mas-v2-nav-tab">⚡ Admin Bar</a></li>
            <li><a href="#menu" class="mas-v2-nav-tab">📋 Menu</a></li>
            <li><a href="#content" class="mas-v2-nav-tab">📄 Treść</a></li>
            <li><a href="#buttons" class="mas-v2-nav-tab">🔘 Przyciski</a></li>
            <li><a href="#typography" class="mas-v2-nav-tab">📝 Typografia</a></li>
            <li><a href="#login" class="mas-v2-nav-tab">🔐 Logowanie</a></li>
            <li><a href="#advanced" class="mas-v2-nav-tab">⚙️ Zaawansowane</a></li>
        </ul>
    </nav>

    <!-- CONTENT -->
    <div class="mas-v2-content">
        <form id="mas-v2-form" method="post">
            
            <!-- OVERVIEW TAB -->
            <div id="overview" class="mas-v2-tab-panel active">
                <div class="mas-v2-section">
                    <h2>🏠 Przegląd wtyczki</h2>
                    <p>Modern Admin Styler V2 - kompletnie przepisana wersja z czystym kodem</p>
                    
                    <div class="mas-v2-grid">
                        <div class="mas-v2-card">
                            <h3>🎨 Quick Presets</h3>
                            <div class="mas-v2-presets">
                                <button type="button" class="mas-v2-preset" data-preset="default">Default</button>
                                <button type="button" class="mas-v2-preset" data-preset="dark">Dark</button>
                                <button type="button" class="mas-v2-preset" data-preset="modern">Modern</button>
                                <button type="button" class="mas-v2-preset" data-preset="minimal">Minimal</button>
                            </div>
                        </div>
                        
                        <div class="mas-v2-card">
                            <h3>📊 Status</h3>
                            <div class="mas-v2-status">
                                <div class="mas-v2-status-item">
                                    <span>Wersja:</span>
                                    <span class="mas-v2-status-value">2.0.0</span>
                                </div>
                                <div class="mas-v2-status-item">
                                    <span>Status:</span>
                                    <span class="mas-v2-status-value mas-v2-status-active">Aktywna</span>
                                </div>
                                <div class="mas-v2-status-item">
                                    <span>Opcje:</span>
                                    <span class="mas-v2-status-value">30+</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- ADMIN BAR TAB -->
            <div id="admin-bar" class="mas-v2-tab-panel">
                <div class="mas-v2-section">
                    <h2>⚡ Pasek administracyjny</h2>
                    <p>Konfiguracja górnego paska WordPress</p>
                    
                    <div class="mas-v2-grid">
                        <div class="mas-v2-card">
                            <h3>🎨 Kolory paska</h3>
                            <div class="mas-v2-field">
                                <label for="admin_bar_bg">Tło paska:</label>
                                <input type="color" id="admin_bar_bg" name="admin_bar_bg" value="<?php echo esc_attr($settings['admin_bar_bg']); ?>" class="mas-v2-color">
                            </div>
                            <div class="mas-v2-field">
                                <label for="admin_bar_text_color">Kolor tekstu:</label>
                                <input type="color" id="admin_bar_text_color" name="admin_bar_text_color" value="<?php echo esc_attr($settings['admin_bar_text_color']); ?>" class="mas-v2-color">
                            </div>
                        </div>
                        
                        <div class="mas-v2-card">
                            <h3>📏 Wymiary</h3>
                            <div class="mas-v2-field">
                                <label for="admin_bar_height">Wysokość paska:</label>
                                <input type="range" id="admin_bar_height" name="admin_bar_height" min="25" max="60" value="<?php echo esc_attr($settings['admin_bar_height']); ?>" class="mas-v2-slider">
                                <span class="mas-v2-slider-value"><?php echo $settings['admin_bar_height']; ?>px</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- MENU TAB -->
            <div id="menu" class="mas-v2-tab-panel">
                <div class="mas-v2-section">
                    <h2>📋 Menu boczne</h2>
                    <p>Stylowanie lewego menu administracyjnego</p>
                    
                    <div class="mas-v2-grid">
                        <div class="mas-v2-card">
                            <h3>🎨 Kolory menu</h3>
                            <div class="mas-v2-field">
                                <label for="menu_bg">Tło menu:</label>
                                <input type="color" id="menu_bg" name="menu_bg" value="<?php echo esc_attr($settings['menu_bg']); ?>" class="mas-v2-color">
                            </div>
                            <div class="mas-v2-field">
                                <label for="menu_text_color">Kolor tekstu:</label>
                                <input type="color" id="menu_text_color" name="menu_text_color" value="<?php echo esc_attr($settings['menu_text_color']); ?>" class="mas-v2-color">
                            </div>
                            <div class="mas-v2-field">
                                <label for="menu_hover_color">Kolor hover:</label>
                                <input type="color" id="menu_hover_color" name="menu_hover_color" value="<?php echo esc_attr($settings['menu_hover_color']); ?>" class="mas-v2-color">
                            </div>
                        </div>
                        
                        <div class="mas-v2-card">
                            <h3>📏 Rozmiary</h3>
                            <div class="mas-v2-field">
                                <label for="menu_width">Szerokość menu:</label>
                                <input type="range" id="menu_width" name="menu_width" min="120" max="300" value="<?php echo esc_attr($settings['menu_width']); ?>" class="mas-v2-slider">
                                <span class="mas-v2-slider-value"><?php echo $settings['menu_width']; ?>px</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- CONTENT TAB -->
            <div id="content" class="mas-v2-tab-panel">
                <div class="mas-v2-section">
                    <h2>📄 Obszar treści</h2>
                    <p>Stylowanie głównego obszaru treści</p>
                    
                    <div class="mas-v2-grid">
                        <div class="mas-v2-card">
                            <h3>🎨 Kolory treści</h3>
                            <div class="mas-v2-field">
                                <label for="content_bg">Tło treści:</label>
                                <input type="color" id="content_bg" name="content_bg" value="<?php echo esc_attr($settings['content_bg']); ?>" class="mas-v2-color">
                            </div>
                            <div class="mas-v2-field">
                                <label for="content_text_color">Kolor tekstu:</label>
                                <input type="color" id="content_text_color" name="content_text_color" value="<?php echo esc_attr($settings['content_text_color']); ?>" class="mas-v2-color">
                            </div>
                            <div class="mas-v2-field">
                                <label for="page_bg">Tło strony:</label>
                                <input type="color" id="page_bg" name="page_bg" value="<?php echo esc_attr($settings['page_bg']); ?>" class="mas-v2-color">
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- BUTTONS TAB -->
            <div id="buttons" class="mas-v2-tab-panel">
                <div class="mas-v2-section">
                    <h2>🔘 Przyciski i formularze</h2>
                    <p>Stylowanie przycisków i pól formularzy</p>
                    
                    <div class="mas-v2-grid">
                        <div class="mas-v2-card">
                            <h3>🔘 Przyciski</h3>
                            <div class="mas-v2-field">
                                <label for="button_bg">Tło przycisku:</label>
                                <input type="color" id="button_bg" name="button_bg" value="<?php echo esc_attr($settings['button_bg']); ?>" class="mas-v2-color">
                            </div>
                            <div class="mas-v2-field">
                                <label for="button_text_color">Kolor tekstu:</label>
                                <input type="color" id="button_text_color" name="button_text_color" value="<?php echo esc_attr($settings['button_text_color']); ?>" class="mas-v2-color">
                            </div>
                            <div class="mas-v2-field">
                                <label for="button_border_radius">Zaokrąglenie:</label>
                                <input type="range" id="button_border_radius" name="button_border_radius" min="0" max="20" value="<?php echo esc_attr($settings['button_border_radius']); ?>" class="mas-v2-slider">
                                <span class="mas-v2-slider-value"><?php echo $settings['button_border_radius']; ?>px</span>
                            </div>
                        </div>
                        
                        <div class="mas-v2-card">
                            <h3>📝 Formularze</h3>
                            <div class="mas-v2-field">
                                <label for="input_bg">Tło pól:</label>
                                <input type="color" id="input_bg" name="input_bg" value="<?php echo esc_attr($settings['input_bg']); ?>" class="mas-v2-color">
                            </div>
                            <div class="mas-v2-field">
                                <label for="input_border_color">Kolor obramowania:</label>
                                <input type="color" id="input_border_color" name="input_border_color" value="<?php echo esc_attr($settings['input_border_color']); ?>" class="mas-v2-color">
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- TYPOGRAPHY TAB -->
            <div id="typography" class="mas-v2-tab-panel">
                <div class="mas-v2-section">
                    <h2>📝 Typografia</h2>
                    <p>Ustawienia czcionek i tekstów</p>
                    
                    <div class="mas-v2-grid">
                        <div class="mas-v2-card">
                            <h3>📝 Czcionki</h3>
                            <div class="mas-v2-field">
                                <label for="font_family">Rodzina czcionek:</label>
                                <select id="font_family" name="font_family" class="mas-v2-select">
                                    <option value="system" <?php selected($settings['font_family'], 'system'); ?>>System</option>
                                    <option value="inter" <?php selected($settings['font_family'], 'inter'); ?>>Inter</option>
                                    <option value="roboto" <?php selected($settings['font_family'], 'roboto'); ?>>Roboto</option>
                                    <option value="open-sans" <?php selected($settings['font_family'], 'open-sans'); ?>>Open Sans</option>
                                    <option value="lato" <?php selected($settings['font_family'], 'lato'); ?>>Lato</option>
                                    <option value="montserrat" <?php selected($settings['font_family'], 'montserrat'); ?>>Montserrat</option>
                                </select>
                            </div>
                            <div class="mas-v2-field">
                                <label for="font_size">Rozmiar czcionki:</label>
                                <input type="range" id="font_size" name="font_size" min="11" max="18" value="<?php echo esc_attr($settings['font_size']); ?>" class="mas-v2-slider">
                                <span class="mas-v2-slider-value"><?php echo $settings['font_size']; ?>px</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- LOGIN TAB -->
            <div id="login" class="mas-v2-tab-panel">
                <div class="mas-v2-section">
                    <h2>🔐 Strona logowania</h2>
                    <p>Personalizacja strony logowania WordPress</p>
                    
                    <div class="mas-v2-grid">
                        <div class="mas-v2-card">
                            <h3>🎨 Wygląd logowania</h3>
                            <div class="mas-v2-field">
                                <label for="login_bg">Tło strony:</label>
                                <input type="color" id="login_bg" name="login_bg" value="<?php echo esc_attr($settings['login_bg']); ?>" class="mas-v2-color">
                            </div>
                            <div class="mas-v2-field">
                                <label for="login_form_bg">Tło formularza:</label>
                                <input type="color" id="login_form_bg" name="login_form_bg" value="<?php echo esc_attr($settings['login_form_bg']); ?>" class="mas-v2-color">
                            </div>
                        </div>
                        
                        <div class="mas-v2-card">
                            <h3>🖼️ Logo</h3>
                            <div class="mas-v2-field">
                                <label for="login_logo_url">URL logo:</label>
                                <input type="url" id="login_logo_url" name="login_logo_url" value="<?php echo esc_attr($settings['login_logo_url']); ?>" class="mas-v2-input">
                            </div>
                            <div class="mas-v2-field">
                                <label for="login_logo_width">Szerokość logo:</label>
                                <input type="range" id="login_logo_width" name="login_logo_width" min="50" max="300" value="<?php echo esc_attr($settings['login_logo_width']); ?>" class="mas-v2-slider">
                                <span class="mas-v2-slider-value"><?php echo $settings['login_logo_width']; ?>px</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- ADVANCED TAB -->
            <div id="advanced" class="mas-v2-tab-panel">
                <div class="mas-v2-section">
                    <h2>⚙️ Zaawansowane</h2>
                    <p>Opcje dla zaawansowanych użytkowników</p>
                    
                    <div class="mas-v2-grid">
                        <div class="mas-v2-card">
                            <h3>🎨 Niestandardowy CSS</h3>
                            <div class="mas-v2-field">
                                <label for="custom_css">Własny CSS:</label>
                                <textarea id="custom_css" name="custom_css" rows="8" class="mas-v2-textarea" placeholder="/* Wpisz tutaj własny CSS */"><?php echo esc_textarea($settings['custom_css']); ?></textarea>
                            </div>
                        </div>
                        
                        <div class="mas-v2-card">
                            <h3>⚙️ Opcje</h3>
                            <div class="mas-v2-field">
                                <label class="mas-v2-checkbox">
                                    <input type="checkbox" name="dark_mode" value="1" <?php checked($settings['dark_mode']); ?>>
                                    <span class="mas-v2-checkbox-mark"></span>
                                    Tryb ciemny
                                </label>
                            </div>
                            <div class="mas-v2-field">
                                <label class="mas-v2-checkbox">
                                    <input type="checkbox" name="apply_to_frontend" value="1" <?php checked($settings['apply_to_frontend']); ?>>
                                    <span class="mas-v2-checkbox-mark"></span>
                                    Zastosuj na frontend
                                </label>
                            </div>
                            <div class="mas-v2-field">
                                <label class="mas-v2-checkbox">
                                    <input type="checkbox" name="debug_mode" value="1" <?php checked($settings['debug_mode']); ?>>
                                    <span class="mas-v2-checkbox-mark"></span>
                                    Tryb debug
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </form>
    </div>

    <!-- FOOTER -->
    <div class="mas-v2-footer">
        <p>Modern Admin Styler V2 &copy; 2024 - Przepisane od nowa dla lepszej wydajności</p>
    </div>

    <!-- MESSAGES -->
    <div id="mas-v2-messages"></div>
</div>
