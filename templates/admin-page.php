<?php
/**
 * Template strony administracyjnej - Modern Admin Styler V2
 * KOMPLETNY TEMPLATE Z 154 OPCJAMI
 */
if (!defined('ABSPATH')) exit;

$plugin_url = MAS_V2_PLUGIN_URL;
?>

<div class="mas-v2-admin-page">
    <!-- HEADER -->
    <div class="mas-v2-header">
        <h1>🎨 Modern Admin Styler V2</h1>
        <p>Kompletna wtyczka z 154 opcjami stylowania - bez dziwnych animacji i max-width!</p>
        
        <div class="mas-v2-header-actions">
            <button id="mas-v2-save" class="mas-v2-button">
                💾 Zapisz ustawienia
            </button>
            <button id="mas-v2-reset" class="mas-v2-button secondary">
                🔄 Reset
            </button>
        </div>
    </div>

    <!-- NAVIGATION -->
    <div class="mas-v2-container">
        <div class="mas-v2-sidebar">
            <nav class="mas-v2-nav">
                <ul>
                    <li><a href="#general" class="active"><span class="icon">⚙️</span> Ogólne</a></li>
                    <li><a href="#admin-bar"><span class="icon">📊</span> Admin Bar</a></li>
                    <li><a href="#menu"><span class="icon">📋</span> Menu</a></li>
                    <li><a href="#submenu"><span class="icon">📝</span> Podmenu</a></li>
                    <li><a href="#buttons"><span class="icon">🔘</span> Przyciski</a></li>
                    <li><a href="#content"><span class="icon">📄</span> Treść</a></li>
                    <li><a href="#typography"><span class="icon">📝</span> Typografia</a></li>
                    <li><a href="#login"><span class="icon">🔐</span> Logowanie</a></li>
                    <li><a href="#advanced"><span class="icon">⚡</span> Zaawansowane</a></li>
                </ul>
            </nav>
        </div>

        <div class="mas-v2-content">
            <form id="mas-v2-form" method="post">
                <?php wp_nonce_field('mas_v2_nonce'); ?>
                
                <!-- GENERAL SECTION -->
                <div id="general" class="mas-v2-section active">
                    <h2>⚙️ Ogólne opcje stylowania</h2>
                    
                    <div class="mas-v2-control-group">
                        <h4>🎨 Podstawowe ustawienia</h4>
                        <p>Wybierz motyw i podstawowe opcje wyglądu</p>
                        
                        <div class="mas-v2-control">
                            <label>Motyw:</label>
                            <select name="theme">
                                <option value="default" <?php selected($settings['theme'], 'default'); ?>>Default</option>
                                <option value="modern" <?php selected($settings['theme'], 'modern'); ?>>Modern</option>
                                <option value="minimal" <?php selected($settings['theme'], 'minimal'); ?>>Minimal</option>
                                <option value="dark" <?php selected($settings['theme'], 'dark'); ?>>Dark</option>
                                <option value="colorful" <?php selected($settings['theme'], 'colorful'); ?>>Colorful</option>
                            </select>
                        </div>
                        
                        <div class="mas-v2-control">
                            <label>Schemat kolorystyczny:</label>
                            <select name="color_scheme">
                                <option value="light" <?php selected($settings['color_scheme'], 'light'); ?>>Jasny</option>
                                <option value="dark" <?php selected($settings['color_scheme'], 'dark'); ?>>Ciemny</option>
                            </select>
                        </div>
                        
                        <div class="mas-v2-control">
                            <label>Rodzina czcionek:</label>
                            <select name="font_family">
                                <option value="system" <?php selected($settings['font_family'], 'system'); ?>>System</option>
                                <option value="inter" <?php selected($settings['font_family'], 'inter'); ?>>Inter</option>
                                <option value="roboto" <?php selected($settings['font_family'], 'roboto'); ?>>Roboto</option>
                                <option value="open-sans" <?php selected($settings['font_family'], 'open-sans'); ?>>Open Sans</option>
                            </select>
                        </div>
                        
                        <div class="mas-v2-control">
                            <label>Rozmiar czcionki: <span class="value"><?php echo $settings['font_size']; ?>px</span></label>
                            <input type="range" name="font_size" min="12" max="20" value="<?php echo esc_attr($settings['font_size']); ?>" class="mas-v2-slider">
                        </div>
                        
                        <div class="mas-v2-checkbox">
                            <input type="checkbox" name="animations" id="animations" <?php checked($settings['animations']); ?>>
                            <label for="animations">Włącz animacje</label>
                        </div>
                        
                        <div class="mas-v2-checkbox">
                            <input type="checkbox" name="live_preview" id="live_preview" <?php checked($settings['live_preview']); ?>>
                            <label for="live_preview">Podgląd na żywo</label>
                        </div>
                        
                        <div class="mas-v2-checkbox">
                            <input type="checkbox" name="auto_save" id="auto_save" <?php checked($settings['auto_save']); ?>>
                            <label for="auto_save">Automatyczny zapis</label>
                        </div>
                    </div>
                </div>

                <!-- ADMIN BAR SECTION -->
                <div id="admin-bar" class="mas-v2-section">
                    <h2>📊 Pasek administracyjny</h2>
                    
                    <div class="mas-v2-control-group">
                        <h4>🎨 Podstawowe opcje paska</h4>
                        <p>Konfiguracja wyglądu górnego paska WordPress</p>
                        
                        <div class="mas-v2-control">
                            <label>Tło paska:</label>
                            <input type="color" name="admin_bar_background" value="<?php echo esc_attr($settings['admin_bar_background']); ?>">
                        </div>
                        
                        <div class="mas-v2-control">
                            <label>Kolor tekstu:</label>
                            <input type="color" name="admin_bar_text_color" value="<?php echo esc_attr($settings['admin_bar_text_color']); ?>">
                        </div>
                        
                        <div class="mas-v2-control">
                            <label>Wysokość paska: <span class="value"><?php echo $settings['admin_bar_height']; ?>px</span></label>
                            <input type="range" name="admin_bar_height" min="20" max="60" value="<?php echo esc_attr($settings['admin_bar_height']); ?>">
                        </div>
                        
                        <div class="mas-v2-control">
                            <label>Rozmiar czcionki: <span class="value"><?php echo $settings['admin_bar_font_size']; ?>px</span></label>
                            <input type="range" name="admin_bar_font_size" min="12" max="18" value="<?php echo esc_attr($settings['admin_bar_font_size']); ?>">
                        </div>
                        
                        <div class="mas-v2-control">
                            <label>Padding: <span class="value"><?php echo $settings['admin_bar_padding']; ?>px</span></label>
                            <input type="range" name="admin_bar_padding" min="5" max="20" value="<?php echo esc_attr($settings['admin_bar_padding']); ?>">
                        </div>
                        
                        <div class="mas-v2-control">
                            <label>Kolor hover tekstu:</label>
                            <input type="color" name="bar_text_hover_color" value="<?php echo esc_attr($settings['bar_text_hover_color']); ?>">
                        </div>
                    </div>
                    
                    <div class="mas-v2-control-group">
                        <h4>🔄 Zaokrąglenia paska</h4>
                        <p>Ustaw zaokrąglone rogi dla paska administracyjnego</p>
                        
                        <div class="mas-v2-control">
                            <label>Typ zaokrągleń:</label>
                            <select name="admin_bar_border_radius_type" class="conditional-trigger" data-target="admin-bar-radius">
                                <option value="none" <?php selected($settings['admin_bar_border_radius_type'], 'none'); ?>>Brak</option>
                                <option value="all" <?php selected($settings['admin_bar_border_radius_type'], 'all'); ?>>Wszystkie rogi</option>
                                <option value="rounded" <?php selected($settings['admin_bar_border_radius_type'], 'rounded'); ?>>Zaokrąglone</option>
                                <option value="rounded-full" <?php selected($settings['admin_bar_border_radius_type'], 'rounded-full'); ?>>Pełne zaokrąglenie</option>
                                <option value="individual" <?php selected($settings['admin_bar_border_radius_type'], 'individual'); ?>>Indywidualne rogi</option>
                            </select>
                        </div>
                        
                        <div class="mas-v2-control conditional-field" data-show-when="admin_bar_border_radius_type" data-show-value="all">
                            <label>Promień zaokrąglenia: <span class="value"><?php echo $settings['admin_bar_border_radius']; ?>px</span></label>
                            <input type="range" name="admin_bar_border_radius" min="0" max="25" value="<?php echo esc_attr($settings['admin_bar_border_radius']); ?>">
                        </div>
                        
                        <div class="mas-v2-control conditional-field" data-show-when="admin_bar_border_radius_type" data-show-value="individual">
                            <h4>Indywidualne rogi:</h4>
                            <div class="mas-v2-checkbox">
                                <input type="checkbox" name="admin_bar_radius_tl" id="admin_bar_radius_tl" <?php checked($settings['admin_bar_radius_tl']); ?>>
                                <label for="admin_bar_radius_tl">Lewy górny</label>
                            </div>
                            <div class="mas-v2-checkbox">
                                <input type="checkbox" name="admin_bar_radius_tr" id="admin_bar_radius_tr" <?php checked($settings['admin_bar_radius_tr']); ?>>
                                <label for="admin_bar_radius_tr">Prawy górny</label>
                            </div>
                            <div class="mas-v2-checkbox">
                                <input type="checkbox" name="admin_bar_radius_bl" id="admin_bar_radius_bl" <?php checked($settings['admin_bar_radius_bl']); ?>>
                                <label for="admin_bar_radius_bl">Lewy dolny</label>
                            </div>
                            <div class="mas-v2-checkbox">
                                <input type="checkbox" name="admin_bar_radius_br" id="admin_bar_radius_br" <?php checked($settings['admin_bar_radius_br']); ?>>
                                <label for="admin_bar_radius_br">Prawy dolny</label>
                            </div>
                        </div>
                    </div>
                    
                    <div class="mas-v2-control-group">
                        <h4>✨ Efekty specjalne paska</h4>
                        <p>Nowoczesne efekty wizualne dla paska administracyjnego</p>
                        
                        <div class="mas-v2-checkbox">
                            <input type="checkbox" name="admin_bar_detached" id="admin_bar_detached" <?php checked($settings['admin_bar_detached']); ?>>
                            <label for="admin_bar_detached">🎯 Odklejony pasek (floating)</label>
                        </div>
                        
                        <div class="mas-v2-checkbox">
                            <input type="checkbox" name="admin_bar_glassmorphism" id="admin_bar_glassmorphism" <?php checked($settings['admin_bar_glassmorphism']); ?>>
                            <label for="admin_bar_glassmorphism">✨ Glassmorphism</label>
                        </div>
                        
                        <div class="mas-v2-checkbox">
                            <input type="checkbox" name="admin_bar_neon_glow" id="admin_bar_neon_glow" <?php checked($settings['admin_bar_neon_glow']); ?>>
                            <label for="admin_bar_neon_glow">💫 Neonowa poświata</label>
                        </div>
                        
                        <div class="mas-v2-checkbox">
                            <input type="checkbox" name="admin_bar_neumorphism" id="admin_bar_neumorphism" <?php checked($settings['admin_bar_neumorphism']); ?>>
                            <label for="admin_bar_neumorphism">🎨 Neumorphism</label>
                        </div>
                    </div>
                    
                    <div class="mas-v2-control-group">
                        <h4>⚙️ Pozostałe opcje paska</h4>
                        <p>Dodatkowe ustawienia paska administracyjnego</p>
                        
                        <div class="mas-v2-checkbox">
                            <input type="checkbox" name="admin_bar_show_logo" id="admin_bar_show_logo" <?php checked($settings['admin_bar_show_logo']); ?>>
                            <label for="admin_bar_show_logo">Pokazuj logo</label>
                        </div>
                        
                        <div class="mas-v2-checkbox">
                            <input type="checkbox" name="admin_bar_show_user_info" id="admin_bar_show_user_info" <?php checked($settings['admin_bar_show_user_info']); ?>>
                            <label for="admin_bar_show_user_info">Informacje o użytkowniku</label>
                        </div>
                        
                        <div class="mas-v2-control">
                            <label>Szerokość paska: <span class="value"><?php echo $settings['admin_bar_width']; ?>%</span></label>
                            <input type="range" name="admin_bar_width" min="50" max="100" value="<?php echo esc_attr($settings['admin_bar_width']); ?>">
                        </div>
                    </div>
                </div>

                <!-- MENU SECTION -->
                <div id="menu" class="mas-v2-section">
                    <h2>📋 Menu boczne</h2>
                    
                    <div class="mas-v2-control-group">
                        <h4>🎨 Tło i kolory menu</h4>
                        <p>Konfiguracja kolorystyki menu bocznego</p>
                        
                        <div class="mas-v2-control">
                            <label>Typ tła menu:</label>
                            <select name="menu_background_type" class="conditional-trigger" data-target="menu-bg">
                                <option value="solid" <?php selected($settings['menu_background_type'], 'solid'); ?>>Solidny kolor</option>
                                <option value="gradient" <?php selected($settings['menu_background_type'], 'gradient'); ?>>Gradient</option>
                            </select>
                        </div>
                        
                        <div class="mas-v2-control conditional-field" data-show-when="menu_background_type" data-show-value="solid">
                            <label>Kolor tła menu:</label>
                            <input type="color" name="menu_background_color" value="<?php echo esc_attr($settings['menu_background_color']); ?>">
                        </div>
                        
                        <div class="mas-v2-control conditional-field" data-show-when="menu_background_type" data-show-value="gradient">
                            <label>Kolor początkowy gradientu:</label>
                            <input type="color" name="menu_gradient_start" value="<?php echo esc_attr($settings['menu_gradient_start']); ?>">
                        </div>
                        
                        <div class="mas-v2-control conditional-field" data-show-when="menu_background_type" data-show-value="gradient">
                            <label>Kolor końcowy gradientu:</label>
                            <input type="color" name="menu_gradient_end" value="<?php echo esc_attr($settings['menu_gradient_end']); ?>">
                        </div>
                        
                        <div class="mas-v2-control conditional-field" data-show-when="menu_background_type" data-show-value="gradient">
                            <label>Kierunek gradientu:</label>
                            <select name="menu_bg_gradient_direction">
                                <option value="135deg" <?php selected($settings['menu_bg_gradient_direction'], '135deg'); ?>>135deg (ukośny)</option>
                                <option value="90deg" <?php selected($settings['menu_bg_gradient_direction'], '90deg'); ?>>90deg (pionowy)</option>
                                <option value="45deg" <?php selected($settings['menu_bg_gradient_direction'], '45deg'); ?>>45deg (ukośny odwrotny)</option>
                                <option value="180deg" <?php selected($settings['menu_bg_gradient_direction'], '180deg'); ?>>180deg (poziomy)</option>
                            </select>
                        </div>
                        
                        <div class="mas-v2-control">
                            <label>Kolor tekstu menu:</label>
                            <input type="color" name="menu_text_color" value="<?php echo esc_attr($settings['menu_text_color']); ?>">
                        </div>
                        
                        <div class="mas-v2-control">
                            <label>Kolor hover menu:</label>
                            <input type="color" name="menu_hover_color" value="<?php echo esc_attr($settings['menu_hover_color']); ?>">
                        </div>
                        
                        <div class="mas-v2-control">
                            <label>Kolor aktywnego elementu:</label>
                            <input type="color" name="menu_active_color" value="<?php echo esc_attr($settings['menu_active_color']); ?>">
                        </div>
                    </div>
                    
                    <div class="mas-v2-control-group">
                        <h4>📏 Wymiary i odstępy menu</h4>
                        <p>Konfiguracja rozmiarów i odstępów</p>
                        
                        <div class="mas-v2-control">
                            <label>Szerokość menu: <span class="value"><?php echo $settings['menu_width']; ?>px</span></label>
                            <input type="range" name="menu_width" min="200" max="400" value="<?php echo esc_attr($settings['menu_width']); ?>">
                        </div>
                        
                        <div class="mas-v2-control">
                            <label>Rozmiar ikon: <span class="value"><?php echo $settings['menu_icon_size']; ?>px</span></label>
                            <input type="range" name="menu_icon_size" min="16" max="32" value="<?php echo esc_attr($settings['menu_icon_size']); ?>">
                        </div>
                        
                        <div class="mas-v2-control">
                            <label>Padding elementów: <span class="value"><?php echo $settings['menu_item_padding']; ?>px</span></label>
                            <input type="range" name="menu_item_padding" min="8" max="20" value="<?php echo esc_attr($settings['menu_item_padding']); ?>">
                        </div>
                        
                        <div class="mas-v2-checkbox">
                            <input type="checkbox" name="menu_show_icons" id="menu_show_icons" <?php checked($settings['menu_show_icons']); ?>>
                            <label for="menu_show_icons">Pokazywanie ikon</label>
                        </div>
                        
                        <div class="mas-v2-checkbox">
                            <input type="checkbox" name="menu_show_count" id="menu_show_count" <?php checked($settings['menu_show_count']); ?>>
                            <label for="menu_show_count">Pokazywanie liczników</label>
                        </div>
                    </div>
                    
                    <div class="mas-v2-control-group">
                        <h4>🔄 Zaokrąglenia menu</h4>
                        <p>Ustaw zaokrąglone rogi dla menu bocznego</p>
                        
                        <div class="mas-v2-control">
                            <label>Typ zaokrągleń:</label>
                            <select name="menu_border_radius_type" class="conditional-trigger" data-target="menu-radius">
                                <option value="none" <?php selected($settings['menu_border_radius_type'], 'none'); ?>>Brak</option>
                                <option value="all" <?php selected($settings['menu_border_radius_type'], 'all'); ?>>Wszystkie rogi</option>
                                <option value="rounded" <?php selected($settings['menu_border_radius_type'], 'rounded'); ?>>Zaokrąglone</option>
                                <option value="rounded-full" <?php selected($settings['menu_border_radius_type'], 'rounded-full'); ?>>Pełne zaokrąglenie</option>
                                <option value="individual" <?php selected($settings['menu_border_radius_type'], 'individual'); ?>>Indywidualne rogi</option>
                            </select>
                        </div>
                        
                        <div class="mas-v2-control conditional-field" data-show-when="menu_border_radius_type" data-show-value="all">
                            <label>Promień zaokrąglenia: <span class="value"><?php echo $settings['menu_border_radius']; ?>px</span></label>
                            <input type="range" name="menu_border_radius" min="0" max="30" value="<?php echo esc_attr($settings['menu_border_radius']); ?>">
                        </div>
                        
                        <div class="mas-v2-control conditional-field" data-show-when="menu_border_radius_type" data-show-value="individual">
                            <h4>Indywidualne rogi:</h4>
                            <div class="mas-v2-checkbox">
                                <input type="checkbox" name="menu_radius_tl" id="menu_radius_tl" <?php checked($settings['menu_radius_tl']); ?>>
                                <label for="menu_radius_tl">Lewy górny</label>
                            </div>
                            <div class="mas-v2-checkbox">
                                <input type="checkbox" name="menu_radius_tr" id="menu_radius_tr" <?php checked($settings['menu_radius_tr']); ?>>
                                <label for="menu_radius_tr">Prawy górny</label>
                            </div>
                            <div class="mas-v2-checkbox">
                                <input type="checkbox" name="menu_radius_bl" id="menu_radius_bl" <?php checked($settings['menu_radius_bl']); ?>>
                                <label for="menu_radius_bl">Lewy dolny</label>
                            </div>
                            <div class="mas-v2-checkbox">
                                <input type="checkbox" name="menu_radius_br" id="menu_radius_br" <?php checked($settings['menu_radius_br']); ?>>
                                <label for="menu_radius_br">Prawy dolny</label>
                            </div>
                        </div>
                    </div>
                    
                    <div class="mas-v2-control-group">
                        <h4>✨ Efekty specjalne menu</h4>
                        <p>Nowoczesne efekty wizualne dla menu bocznego</p>
                        
                        <div class="mas-v2-checkbox">
                            <input type="checkbox" name="menu_detached" id="menu_detached" <?php checked($settings['menu_detached']); ?>>
                            <label for="menu_detached">🎯 Odklejone menu (floating)</label>
                        </div>
                        
                        <div class="mas-v2-checkbox">
                            <input type="checkbox" name="menu_glassmorphism" id="menu_glassmorphism" <?php checked($settings['menu_glassmorphism']); ?>>
                            <label for="menu_glassmorphism">✨ Glassmorphism</label>
                        </div>
                        
                        <div class="mas-v2-checkbox">
                            <input type="checkbox" name="menu_neon_glow" id="menu_neon_glow" <?php checked($settings['menu_neon_glow']); ?>>
                            <label for="menu_neon_glow">💫 Neonowa poświata</label>
                        </div>
                        
                        <div class="mas-v2-checkbox">
                            <input type="checkbox" name="menu_neumorphism" id="menu_neumorphism" <?php checked($settings['menu_neumorphism']); ?>>
                            <label for="menu_neumorphism">🎨 Neumorphism</label>
                        </div>
                    </div>
                    
                    <div class="mas-v2-control-group">
                        <h4>📝 Typografia menu</h4>
                        <p>Ustawienia czcionek dla menu bocznego</p>
                        
                        <div class="mas-v2-control">
                            <label>Rodzina czcionek menu:</label>
                            <select name="menu_font_family">
                                <option value="system" <?php selected($settings['menu_font_family'], 'system'); ?>>System</option>
                                <option value="inter" <?php selected($settings['menu_font_family'], 'inter'); ?>>Inter</option>
                                <option value="roboto" <?php selected($settings['menu_font_family'], 'roboto'); ?>>Roboto</option>
                                <option value="open-sans" <?php selected($settings['menu_font_family'], 'open-sans'); ?>>Open Sans</option>
                            </select>
                        </div>
                        
                        <div class="mas-v2-control">
                            <label>Google Font menu:</label>
                            <input type="text" name="menu_google_font" value="<?php echo esc_attr($settings['menu_google_font']); ?>" placeholder="Inter">
                        </div>
                        
                        <div class="mas-v2-control">
                            <label>Rozmiar czcionki menu: <span class="value"><?php echo $settings['menu_font_size']; ?>px</span></label>
                            <input type="range" name="menu_font_size" min="12" max="18" value="<?php echo esc_attr($settings['menu_font_size']); ?>">
                        </div>
                        
                        <div class="mas-v2-control">
                            <label>Wysokość linii: <span class="value"><?php echo $settings['menu_line_height']; ?></span></label>
                            <input type="range" name="menu_line_height" min="1.0" max="2.0" step="0.1" value="<?php echo esc_attr($settings['menu_line_height']); ?>">
                        </div>
                        
                        <div class="mas-v2-control">
                            <label>Odstęp między literami: <span class="value"><?php echo $settings['menu_letter_spacing']; ?>px</span></label>
                            <input type="range" name="menu_letter_spacing" min="-2.0" max="4.0" step="0.1" value="<?php echo esc_attr($settings['menu_letter_spacing']); ?>">
                        </div>
                        
                        <div class="mas-v2-control">
                            <label>Transformacja tekstu:</label>
                            <select name="menu_text_transform">
                                <option value="none" <?php selected($settings['menu_text_transform'], 'none'); ?>>Brak</option>
                                <option value="uppercase" <?php selected($settings['menu_text_transform'], 'uppercase'); ?>>WIELKIE LITERY</option>
                                <option value="lowercase" <?php selected($settings['menu_text_transform'], 'lowercase'); ?>>małe litery</option>
                                <option value="capitalize" <?php selected($settings['menu_text_transform'], 'capitalize'); ?>>Pierwsza Wielka</option>
                            </select>
                        </div>
                        
                        <div class="mas-v2-control">
                            <label>Grubość czcionki:</label>
                            <select name="menu_font_weight">
                                <option value="300" <?php selected($settings['menu_font_weight'], 300); ?>>300 (Light)</option>
                                <option value="400" <?php selected($settings['menu_font_weight'], 400); ?>>400 (Normal)</option>
                                <option value="500" <?php selected($settings['menu_font_weight'], 500); ?>>500 (Medium)</option>
                                <option value="600" <?php selected($settings['menu_font_weight'], 600); ?>>600 (Semi Bold)</option>
                                <option value="700" <?php selected($settings['menu_font_weight'], 700); ?>>700 (Bold)</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="mas-v2-control-group">
                        <h4>🎨 Efekty wizualne menu</h4>
                        <p>Dodatkowe efekty i opcje wizualne</p>
                        
                        <div class="mas-v2-control">
                            <label>Cień menu:</label>
                            <input type="text" name="menu_shadow" value="<?php echo esc_attr($settings['menu_shadow']); ?>" placeholder="0 4px 20px rgba(0,0,0,0.15)">
                        </div>
                        
                        <div class="mas-v2-control">
                            <label>URL logo menu:</label>
                            <input type="url" name="menu_logo_url" value="<?php echo esc_attr($settings['menu_logo_url']); ?>" placeholder="https://example.com/logo.png">
                        </div>
                        
                        <div class="mas-v2-control">
                            <label>Wysokość logo: <span class="value"><?php echo $settings['menu_logo_height']; ?>px</span></label>
                            <input type="range" name="menu_logo_height" min="30" max="100" value="<?php echo esc_attr($settings['menu_logo_height']); ?>">
                        </div>
                        
                        <div class="mas-v2-checkbox">
                            <input type="checkbox" name="sidebar_detached" id="sidebar_detached" <?php checked($settings['sidebar_detached']); ?>>
                            <label for="sidebar_detached">Menu oddzielone</label>
                        </div>
                        
                        <div class="mas-v2-control">
                            <label>Margines oddzielonego menu: <span class="value"><?php echo $settings['menu_detached_margin']; ?>px</span></label>
                            <input type="range" name="menu_detached_margin" min="10" max="50" value="<?php echo esc_attr($settings['menu_detached_margin']); ?>">
                        </div>
                        
                        <div class="mas-v2-checkbox">
                            <input type="checkbox" name="sidebar_mega_submenu" id="sidebar_mega_submenu" <?php checked($settings['sidebar_mega_submenu']); ?>>
                            <label for="sidebar_mega_submenu">Mega podmenu</label>
                        </div>
                    </div>
                </div>
                
                <!-- SUBMENU SECTION -->
                <div id="submenu" class="mas-v2-section">
                    <h2>📝 Podmenu - zaawansowane opcje</h2>
                    
                    <div class="mas-v2-control-group">
                        <h4>📏 Szerokość podmenu</h4>
                        <p>Wybierz typ szerokości dla podmenu</p>
                        
                        <div class="mas-v2-control">
                            <label>Typ szerokości podmenu:</label>
                            <select name="submenu_width_type">
                                <option value="normal" <?php selected($settings['submenu_width_type'], 'normal'); ?>>Normalna (200px)</option>
                                <option value="narrow" <?php selected($settings['submenu_width_type'], 'narrow'); ?>>Wąska (150px)</option>
                                <option value="wide" <?php selected($settings['submenu_width_type'], 'wide'); ?>>Szeroka (280px)</option>
                                <option value="mega" <?php selected($settings['submenu_width_type'], 'mega'); ?>>Mega menu (400px+)</option>
                            </select>
                        </div>
                        
                        <div class="mas-v2-control">
                            <label>Szerokość podmenu: <span class="value"><?php echo $settings['menu_submenu_width']; ?>px</span></label>
                            <input type="range" name="menu_submenu_width" min="180" max="400" value="<?php echo esc_attr($settings['menu_submenu_width']); ?>">
                        </div>
                    </div>
                    
                    <div class="mas-v2-control-group">
                        <h4>🎨 Kolory podmenu</h4>
                        <p>Konfiguracja kolorystyki podmenu</p>
                        
                        <div class="mas-v2-control">
                            <label>Tło podmenu:</label>
                            <input type="color" name="submenu_bg_color" value="<?php echo esc_attr($settings['submenu_bg_color']); ?>">
                        </div>
                        
                        <div class="mas-v2-control">
                            <label>Kolor tekstu podmenu:</label>
                            <input type="color" name="submenu_text_color" value="<?php echo esc_attr($settings['submenu_text_color']); ?>">
                        </div>
                        
                        <div class="mas-v2-control">
                            <label>Tło podmenu (legacy):</label>
                            <input type="color" name="menu_submenu_background" value="<?php echo esc_attr($settings['menu_submenu_background']); ?>">
                        </div>
                        
                        <div class="mas-v2-control">
                            <label>Kolor tekstu podmenu (legacy):</label>
                            <input type="color" name="menu_submenu_text_color" value="<?php echo esc_attr($settings['menu_submenu_text_color']); ?>">
                        </div>
                    </div>
                    
                    <div class="mas-v2-control-group">
                        <h4>🖱️ Efekty hover podmenu</h4>
                        <p>Kolory przy najechaniu myszką na elementy podmenu</p>
                        
                        <div class="mas-v2-control">
                            <label>Kolor tła hover podmenu:</label>
                            <input type="color" name="submenu_hover_bg_color" value="<?php echo esc_attr($settings['submenu_hover_bg_color']); ?>">
                        </div>
                        
                        <div class="mas-v2-control">
                            <label>Kolor tekstu przy hover:</label>
                            <input type="color" name="submenu_hover_text_color" value="<?php echo esc_attr($settings['submenu_hover_text_color']); ?>">
                        </div>
                        
                        <div class="mas-v2-control">
                            <label>Kolor aktywnego podmenu:</label>
                            <input type="color" name="submenu_active_bg_color" value="<?php echo esc_attr($settings['submenu_active_bg_color']); ?>">
                        </div>
                    </div>
                </div>

            <!-- CONTENT SECTION -->
            <div id="content" class="mas-v2-section">
                <h2>📄 Obszar treści</h2>
                
                <div class="mas-v2-control-group">
                    <h4>🎨 Tło obszaru treści</h4>
                    <p>Konfiguracja tła głównego obszaru treści</p>
                    
                    <div class="mas-v2-control">
                        <label>Typ tła treści:</label>
                        <select name="content_background_type" class="conditional-trigger" data-target="content-bg">
                            <option value="solid" <?php selected($settings['content_background_type'], 'solid'); ?>>Solidny kolor</option>
                            <option value="gradient" <?php selected($settings['content_background_type'], 'gradient'); ?>>Gradient</option>
                        </select>
                    </div>
                    
                    <div class="mas-v2-control conditional-field" data-show-when="content_background_type" data-show-value="solid">
                        <label>Kolor tła treści:</label>
                        <input type="color" name="content_background_color" value="<?php echo esc_attr($settings['content_background_color']); ?>">
                    </div>
                    
                    <div class="mas-v2-control conditional-field" data-show-when="content_background_type" data-show-value="gradient">
                        <label>Kolor początkowy gradientu:</label>
                        <input type="color" name="content_gradient_start" value="<?php echo esc_attr($settings['content_gradient_start']); ?>">
                    </div>
                    
                    <div class="mas-v2-control conditional-field" data-show-when="content_background_type" data-show-value="gradient">
                        <label>Kolor końcowy gradientu:</label>
                        <input type="color" name="content_gradient_end" value="<?php echo esc_attr($settings['content_gradient_end']); ?>">
                    </div>
                    
                    <div class="mas-v2-control conditional-field" data-show-when="content_background_type" data-show-value="gradient">
                        <label>Kierunek gradientu:</label>
                        <select name="content_gradient_direction">
                            <option value="135deg" <?php selected($settings['content_gradient_direction'], '135deg'); ?>>135deg (ukośny)</option>
                            <option value="90deg" <?php selected($settings['content_gradient_direction'], '90deg'); ?>>90deg (pionowy)</option>
                            <option value="45deg" <?php selected($settings['content_gradient_direction'], '45deg'); ?>>45deg (ukośny odwrotny)</option>
                            <option value="180deg" <?php selected($settings['content_gradient_direction'], '180deg'); ?>>180deg (poziomy)</option>
                        </select>
                    </div>
                </div>
                
                <div class="mas-v2-control-group">
                    <h4>✨ Efekty treści</h4>
                    <p>Dodatkowe efekty wizualne dla obszaru treści</p>
                    
                    <div class="mas-v2-control">
                        <label>Cień obszaru treści:</label>
                        <input type="text" name="content_shadow" value="<?php echo esc_attr($settings['content_shadow']); ?>" placeholder="0 4px 20px rgba(0,0,0,0.1)">
                    </div>
                    
                    <div class="mas-v2-control">
                        <label>Zaokrąglenie obszaru treści: <span class="value"><?php echo $settings['content_border_radius']; ?>px</span></label>
                        <input type="range" name="content_border_radius" min="0" max="20" value="<?php echo esc_attr($settings['content_border_radius']); ?>">
                    </div>
                    
                    <div class="mas-v2-control">
                        <label>Padding obszaru treści: <span class="value"><?php echo $settings['content_padding']; ?>px</span></label>
                        <input type="range" name="content_padding" min="15" max="40" value="<?php echo esc_attr($settings['content_padding']); ?>">
                    </div>
                    
                    <div class="mas-v2-control">
                        <label>Margines obszaru treści: <span class="value"><?php echo $settings['content_margin']; ?>px</span></label>
                        <input type="range" name="content_margin" min="0" max="30" value="<?php echo esc_attr($settings['content_margin']); ?>">
                    </div>
                    
                    <div class="mas-v2-checkbox">
                        <input type="checkbox" name="content_glassmorphism" id="content_glassmorphism" <?php checked($settings['content_glassmorphism']); ?>>
                        <label for="content_glassmorphism">✨ Glassmorphism dla treści</label>
                    </div>
                    
                    <div class="mas-v2-checkbox">
                        <input type="checkbox" name="content_floating" id="content_floating" <?php checked($settings['content_floating']); ?>>
                        <label for="content_floating">🎯 Floating content</label>
                    </div>
                    
                    <div class="mas-v2-checkbox">
                        <input type="checkbox" name="content_blur_background" id="content_blur_background" <?php checked($settings['content_blur_background']); ?>>
                        <label for="content_blur_background">🌫️ Blur tła</label>
                    </div>
                </div>
            </div>

            <!-- BUTTONS & FORMS SECTION -->
            <div id="buttons" class="mas-v2-section">
                <h2>🔘 Przyciski i formularze</h2>
                
                <div class="mas-v2-control-group">
                    <h4>🎨 Kolory przycisków</h4>
                    <p>Stylowanie przycisków w panelu administracyjnym</p>
                    
                    <div class="mas-v2-control">
                        <label>Tło przycisków:</label>
                        <input type="color" name="button_bg_color" value="<?php echo esc_attr($settings['button_bg_color']); ?>">
                    </div>
                    
                    <div class="mas-v2-control">
                        <label>Kolor tekstu przycisków:</label>
                        <input type="color" name="button_text_color" value="<?php echo esc_attr($settings['button_text_color']); ?>">
                    </div>
                    
                    <div class="mas-v2-control">
                        <label>Tło przycisków przy hover:</label>
                        <input type="color" name="button_hover_bg_color" value="<?php echo esc_attr($settings['button_hover_bg_color']); ?>">
                    </div>
                    
                    <div class="mas-v2-control">
                        <label>Kolor tekstu przy hover:</label>
                        <input type="color" name="button_hover_text_color" value="<?php echo esc_attr($settings['button_hover_text_color']); ?>">
                    </div>
                </div>
                
                <div class="mas-v2-control-group">
                    <h4>📐 Wymiary przycisków</h4>
                    <p>Konfiguracja rozmiarów i odstępów</p>
                    
                    <div class="mas-v2-control">
                        <label>Zaokrąglenie przycisków: <span class="value"><?php echo $settings['button_border_radius']; ?>px</span></label>
                        <input type="range" name="button_border_radius" min="0" max="25" value="<?php echo esc_attr($settings['button_border_radius']); ?>">
                    </div>
                    
                    <div class="mas-v2-control">
                        <label>Padding przycisków: <span class="value"><?php echo $settings['button_padding']; ?>px</span></label>
                        <input type="range" name="button_padding" min="8" max="20" value="<?php echo esc_attr($settings['button_padding']); ?>">
                    </div>
                </div>
                
                <div class="mas-v2-control-group">
                    <h4>📝 Kolory formularzy</h4>
                    <p>Stylowanie pól formularzy</p>
                    
                    <div class="mas-v2-control">
                        <label>Tło pól formularza:</label>
                        <input type="color" name="form_field_bg_color" value="<?php echo esc_attr($settings['form_field_bg_color']); ?>">
                    </div>
                    
                    <div class="mas-v2-control">
                        <label>Kolor obramowania pól:</label>
                        <input type="color" name="form_field_border_color" value="<?php echo esc_attr($settings['form_field_border_color']); ?>">
                    </div>
                    
                    <div class="mas-v2-control">
                        <label>Kolor focus pól formularza:</label>
                        <input type="color" name="form_field_focus_color" value="<?php echo esc_attr($settings['form_field_focus_color']); ?>">
                    </div>
                </div>
            </div>

            <!-- TYPOGRAPHY SECTION -->
            <div id="typography" class="mas-v2-section">
                <h2>📝 Typografia globalna</h2>
                
                <div class="mas-v2-control-group">
                    <h4>📝 Globalne ustawienia czcionek</h4>
                    <p>Podstawowe ustawienia typografii dla całego panelu</p>
                    
                    <div class="mas-v2-control">
                        <label>Rodzina czcionek:</label>
                        <select name="global_font_family">
                            <option value="system" <?php selected($settings['global_font_family'], 'system'); ?>>System</option>
                            <option value="inter" <?php selected($settings['global_font_family'], 'inter'); ?>>Inter</option>
                            <option value="roboto" <?php selected($settings['global_font_family'], 'roboto'); ?>>Roboto</option>
                            <option value="open-sans" <?php selected($settings['global_font_family'], 'open-sans'); ?>>Open Sans</option>
                            <option value="lato" <?php selected($settings['global_font_family'], 'lato'); ?>>Lato</option>
                            <option value="montserrat" <?php selected($settings['global_font_family'], 'montserrat'); ?>>Montserrat</option>
                            <option value="poppins" <?php selected($settings['global_font_family'], 'poppins'); ?>>Poppins</option>
                        </select>
                    </div>
                    
                    <div class="mas-v2-control">
                        <label>Rozmiar czcionki globalnej: <span class="value"><?php echo $settings['global_font_size']; ?>px</span></label>
                        <input type="range" name="global_font_size" min="12" max="18" value="<?php echo esc_attr($settings['global_font_size']); ?>">
                    </div>
                    
                    <div class="mas-v2-control">
                        <label>Wysokość linii: <span class="value"><?php echo $settings['global_line_height']; ?></span></label>
                        <input type="range" name="global_line_height" min="1.2" max="2.0" step="0.1" value="<?php echo esc_attr($settings['global_line_height']); ?>">
                    </div>
                </div>
            </div>

            <!-- LOGIN SECTION -->
            <div id="login" class="mas-v2-section">
                <h2>🔐 Strona logowania</h2>
                
                <div class="mas-v2-control-group">
                    <h4>🎨 Tło strony logowania</h4>
                    <p>Konfiguracja tła strony logowania</p>
                    
                    <div class="mas-v2-control">
                        <label>Typ tła logowania:</label>
                        <select name="login_background_type" class="conditional-trigger" data-target="login-bg">
                            <option value="solid" <?php selected($settings['login_background_type'], 'solid'); ?>>Solidny kolor</option>
                            <option value="gradient" <?php selected($settings['login_background_type'], 'gradient'); ?>>Gradient</option>
                            <option value="image" <?php selected($settings['login_background_type'], 'image'); ?>>Obraz</option>
                        </select>
                    </div>
                    
                    <div class="mas-v2-control conditional-field" data-show-when="login_background_type" data-show-value="solid">
                        <label>Kolor tła logowania:</label>
                        <input type="color" name="login_background_color" value="<?php echo esc_attr($settings['login_background_color']); ?>">
                    </div>
                    
                    <div class="mas-v2-control conditional-field" data-show-when="login_background_type" data-show-value="gradient">
                        <label>Kolor początkowy gradientu:</label>
                        <input type="color" name="login_gradient_start" value="<?php echo esc_attr($settings['login_gradient_start']); ?>">
                    </div>
                    
                    <div class="mas-v2-control conditional-field" data-show-when="login_background_type" data-show-value="gradient">
                        <label>Kolor końcowy gradientu:</label>
                        <input type="color" name="login_gradient_end" value="<?php echo esc_attr($settings['login_gradient_end']); ?>">
                    </div>
                    
                    <div class="mas-v2-control conditional-field" data-show-when="login_background_type" data-show-value="image">
                        <label>URL obrazu tła:</label>
                        <input type="url" name="login_background_image" value="<?php echo esc_attr($settings['login_background_image']); ?>" placeholder="https://example.com/background.jpg">
                    </div>
                </div>
                
                <div class="mas-v2-control-group">
                    <h4>📝 Formularz logowania</h4>
                    <p>Stylowanie formularza logowania</p>
                    
                    <div class="mas-v2-control">
                        <label>Tło formularza:</label>
                        <input type="color" name="login_form_background" value="<?php echo esc_attr($settings['login_form_background']); ?>">
                    </div>
                    
                    <div class="mas-v2-control">
                        <label>Zaokrąglenie formularza: <span class="value"><?php echo $settings['login_form_border_radius']; ?>px</span></label>
                        <input type="range" name="login_form_border_radius" min="0" max="20" value="<?php echo esc_attr($settings['login_form_border_radius']); ?>">
                    </div>
                    
                    <div class="mas-v2-control">
                        <label>Cień formularza:</label>
                        <input type="text" name="login_form_shadow" value="<?php echo esc_attr($settings['login_form_shadow']); ?>" placeholder="0 10px 30px rgba(0,0,0,0.1)">
                    </div>
                </div>
                
                <div class="mas-v2-control-group">
                    <h4>🖼️ Logo logowania</h4>
                    <p>Konfiguracja logo na stronie logowania</p>
                    
                    <div class="mas-v2-control">
                        <label>URL logo:</label>
                        <input type="url" name="login_logo_url" value="<?php echo esc_attr($settings['login_logo_url']); ?>" placeholder="https://example.com/logo.png">
                    </div>
                    
                    <div class="mas-v2-control">
                        <label>Szerokość logo: <span class="value"><?php echo $settings['login_logo_width']; ?>px</span></label>
                        <input type="range" name="login_logo_width" min="50" max="300" value="<?php echo esc_attr($settings['login_logo_width']); ?>">
                    </div>
                    
                    <div class="mas-v2-control">
                        <label>Wysokość logo: <span class="value"><?php echo $settings['login_logo_height']; ?>px</span></label>
                        <input type="range" name="login_logo_height" min="50" max="200" value="<?php echo esc_attr($settings['login_logo_height']); ?>">
                    </div>
                </div>
                
                <div class="mas-v2-control-group">
                    <h4>🔘 Przyciski logowania</h4>
                    <p>Stylowanie przycisków na stronie logowania</p>
                    
                    <div class="mas-v2-control">
                        <label>Tło przycisku logowania:</label>
                        <input type="color" name="login_button_background" value="<?php echo esc_attr($settings['login_button_background']); ?>">
                    </div>
                    
                    <div class="mas-v2-control">
                        <label>Kolor tekstu przycisku:</label>
                        <input type="color" name="login_button_text_color" value="<?php echo esc_attr($settings['login_button_text_color']); ?>">
                    </div>
                    
                    <div class="mas-v2-control">
                        <label>Zaokrąglenie przycisku: <span class="value"><?php echo $settings['login_button_border_radius']; ?>px</span></label>
                        <input type="range" name="login_button_border_radius" min="0" max="25" value="<?php echo esc_attr($settings['login_button_border_radius']); ?>">
                    </div>
                </div>
            </div>

            <!-- ADVANCED SECTION -->
            <div id="advanced" class="mas-v2-section">
                <h2>⚙️ Zaawansowane opcje</h2>
                
                <div class="mas-v2-control-group">
                    <h4>🎨 Tryby kolorów</h4>
                    <p>Zaawansowane opcje kolorystyczne</p>
                    
                    <div class="mas-v2-checkbox">
                        <input type="checkbox" name="dark_mode_enabled" id="dark_mode_enabled" <?php checked($settings['dark_mode_enabled']); ?>>
                        <label for="dark_mode_enabled">Tryb ciemny</label>
                    </div>
                    
                    <div class="mas-v2-checkbox">
                        <input type="checkbox" name="auto_dark_mode" id="auto_dark_mode" <?php checked($settings['auto_dark_mode']); ?>>
                        <label for="auto_dark_mode">Automatyczny tryb ciemny</label>
                    </div>
                    
                    <div class="mas-v2-checkbox">
                        <input type="checkbox" name="high_contrast_mode" id="high_contrast_mode" <?php checked($settings['high_contrast_mode']); ?>>
                        <label for="high_contrast_mode">Wysoki kontrast</label>
                    </div>
                </div>
                
                <div class="mas-v2-control-group">
                    <h4>⚡ Wydajność</h4>
                    <p>Optymalizacja wydajności wtyczki</p>
                    
                    <div class="mas-v2-checkbox">
                        <input type="checkbox" name="minify_css" id="minify_css" <?php checked($settings['minify_css']); ?>>
                        <label for="minify_css">Minifikacja CSS</label>
                    </div>
                    
                    <div class="mas-v2-checkbox">
                        <input type="checkbox" name="cache_styles" id="cache_styles" <?php checked($settings['cache_styles']); ?>>
                        <label for="cache_styles">Cachowanie stylów</label>
                    </div>
                    
                    <div class="mas-v2-checkbox">
                        <input type="checkbox" name="lazy_load_fonts" id="lazy_load_fonts" <?php checked($settings['lazy_load_fonts']); ?>>
                        <label for="lazy_load_fonts">Lazy loading czcionek</label>
                    </div>
                    
                    <div class="mas-v2-checkbox">
                        <input type="checkbox" name="optimize_animations" id="optimize_animations" <?php checked($settings['optimize_animations']); ?>>
                        <label for="optimize_animations">Optymalizacja animacji</label>
                    </div>
                </div>
                
                <div class="mas-v2-control-group">
                    <h4>👁️ Ukrywanie elementów</h4>
                    <p>Kontrola widoczności elementów interfejsu</p>
                    
                    <div class="mas-v2-checkbox">
                        <input type="checkbox" name="hide_wp_logo" id="hide_wp_logo" <?php checked($settings['hide_wp_logo']); ?>>
                        <label for="hide_wp_logo">Ukryj logo WordPress</label>
                    </div>
                    
                    <div class="mas-v2-checkbox">
                        <input type="checkbox" name="hide_admin_footer" id="hide_admin_footer" <?php checked($settings['hide_admin_footer']); ?>>
                        <label for="hide_admin_footer">Ukryj stopkę admin</label>
                    </div>
                    
                    <div class="mas-v2-checkbox">
                        <input type="checkbox" name="hide_screen_options" id="hide_screen_options" <?php checked($settings['hide_screen_options']); ?>>
                        <label for="hide_screen_options">Ukryj opcje ekranu</label>
                    </div>
                    
                    <div class="mas-v2-checkbox">
                        <input type="checkbox" name="hide_help_tab" id="hide_help_tab" <?php checked($settings['hide_help_tab']); ?>>
                        <label for="hide_help_tab">Ukryj zakładkę pomocy</label>
                    </div>
                    
                    <div class="mas-v2-checkbox">
                        <input type="checkbox" name="hide_howdy" id="hide_howdy" <?php checked($settings['hide_howdy']); ?>>
                        <label for="hide_howdy">Ukryj "Cześć" w pasku</label>
                    </div>
                    
                    <div class="mas-v2-checkbox">
                        <input type="checkbox" name="hide_update_notices" id="hide_update_notices" <?php checked($settings['hide_update_notices']); ?>>
                        <label for="hide_update_notices">Ukryj powiadomienia o aktualizacjach</label>
                    </div>
                </div>
                
                <div class="mas-v2-control-group">
                    <h4>🎨 Niestandardowy CSS</h4>
                    <p>Dodaj własny kod CSS</p>
                    
                                        <div class="mas-v2-control">
                        <label for="custom_css">Własny CSS:</label>
                        <textarea id="custom_css" name="custom_css" rows="8" class="mas-v2-textarea" placeholder="/* Wpisz tutaj własny kod CSS */"><?php echo esc_textarea($settings['custom_css']); ?></textarea>
                    </div>
                </div>
                
                <div class="mas-v2-control-group">
                    <h4>💾 Eksport/Import</h4>
                    <p>Funkcje zarządzania ustawieniami</p>
                    
                    <div class="mas-v2-control">
                        <label>Backup ustawień:</label>
                        <button type="button" class="mas-v2-button" onclick="exportSettings()">📥 Eksportuj ustawienia</button>
                    </div>
                    
                    <div class="mas-v2-control">
                        <label>Restore ustawień:</label>
                        <input type="file" id="import_settings" accept=".json" style="display: none;">
                        <button type="button" class="mas-v2-button" onclick="document.getElementById('import_settings').click()">📤 Importuj ustawienia</button>
                    </div>
                    
                    <div class="mas-v2-control">
                        <label>Reset ustawień:</label>
                        <button type="button" class="mas-v2-button mas-v2-button-danger" onclick="resetSettings()">🔄 Resetuj do domyślnych</button>
                    </div>
                </div>
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
