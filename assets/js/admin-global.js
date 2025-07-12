/**
 * WOOW! Admin Styler - Global Admin Script (v3.0.0-beta.1)
 * Enterprise-grade theme management with semantic CSS variables

// ========================================================================
// WOOW! SEMANTIC CSS VARIABLES SYSTEM
// Controllers synchronized with --woow-{category}-{role} architecture
// ========================================================================
 */

(function($) {
    'use strict';
    
    // Script loaded successfully
    
    // Uruchom gdy DOM jest gotowy
    $(document).ready(function() {
        // Ustawienia są przekazane przez wp_localize_script
        if (typeof masV2Global !== 'undefined' && masV2Global.settings) {
            updateBodyClasses(masV2Global.settings);
            
            // Dodatkowe wywołanie po krótkim opóźnieniu dla pewności
            setTimeout(function() {
                updateBodyClasses(masV2Global.settings);
            }, 100);
        }
        
        // Inicjalizuj globalny manager motywów
        initGlobalThemeManager();
        
        // Theme manager initialized
    });
    
    /**
     * Aktualizuj klasy CSS body na podstawie ustawień
     */
    function updateBodyClasses(settings) {
        const body = document.body;

        // Menu floating status
        if (settings.menu_floating) {
            body.classList.add('woow-menu-floating', 'woow-menu-floating');
            body.classList.remove('mas-menu-normal');
        } else {
            body.classList.add('mas-menu-normal');
            body.classList.remove('woow-menu-floating', 'woow-menu-floating');
        }
        
        // Menu compact mode
        if (settings.menu_compact_mode) {
            body.classList.add('mas-menu-compact-mode');
        } else {
            body.classList.remove('mas-menu-compact-mode');
        }
        
        // Admin bar floating status
        if (settings.admin_bar_floating) {
            body.classList.add('woow-admin-bar-floating');
            body.classList.remove('woow-admin-bar-floating'); // Remove old class

        } else {
            body.classList.remove('woow-admin-bar-floating', 'woow-admin-bar-floating');

        }
        
        // Corner radius classes
        body.classList.remove('mas-corner-radius-all', 'mas-corner-radius-individual');
        if (settings.corner_radius_type === 'all') {
            body.classList.add('mas-corner-radius-all');
        } else if (settings.corner_radius_type === 'individual') {
            body.classList.add('mas-corner-radius-individual');
        }
    }

    /**
     * Globalny manager motywów - działa na wszystkich stronach wp-admin
     * Teraz z QUICK THEME SELECTOR!
     */
    function initGlobalThemeManager() {
        if (window.WOOW_ThemeManager) return; // Prevent duplicate initialization

        /**
         * ========================================================================
         *  🎨 ENTERPRISE-GRADE THEME MANAGER (Bootstrap 5.3+ / VueUse Style)
         * ========================================================================
         * ARCHITEKTURA: data-theme attributes + localStorage + system listener
         * FEATURES: light, dark, auto modes + live preview + FOUC prevention
         * SEMANTIC VARIABLES: --woow-{category}-{role} naming convention
         */
        class ThemeManager {
            constructor() {
                this.STORAGE_KEY = 'woow-theme';
                this.PALETTE_KEY = 'woow-palette';
                this.currentTheme = this.getPreferredTheme();
                this.currentPalette = this.getStoredPalette() || 'modern';
                this.liveEditEnabled = false;
            }

            init() {
                // 🔧 KRYTYCZNA NAPRAWKA: Tylko jeden przełącznik motywu
        
                
                // Apply stored/preferred theme immediately
                const preferredTheme = this.getPreferredTheme();

                this.setTheme(preferredTheme);
                
                // 🎯 GŁÓWNE PRZEŁĄCZNIKI
                this.createThemeToggle();
                // this.createGlobalLiveEditToggle(); // ✅ PRZYWRÓCONO: Przełącznik Live Edit
                // WYŁĄCZONE - funkcja jest zakomentowana
                
                // 🔧 USUNIĘTO: Chaos z wieloma przełącznikami
                // - createQuickThemeSelector() - powodował bałagan
                // - createLivePreviewToggle() - duplikacja funkcji
                
                // System theme change listener (disabled - auto mode removed)
                this.setupSystemThemeListener();
                
                // 🎨 Live Edit integration (if available)
                if (typeof window.MAS !== 'undefined') {
                    this.liveEditEnabled = true;

                }
                
                // 🔥 NEW: Live Preview toggle
                // this.createLivePreviewToggle();
                // WYŁĄCZONE - używamy tylko mas-live-edit-toggle z live-edit-mode.js
                
                // this.createGlobalLiveEditToggle(); // ✅ PRZYWRÓCONO: Przełącznik Live Edit
                // WYŁĄCZONE - używamy tylko systemu mikropaneli
                
                // 🎨 NAPRAWIONE: Usunięto wywołanie nieistniejącej funkcji checkForPaletteAttribute()
                // Color palette overrides are now handled automatically via CSS variables
            }

            /**
             * 🌟 VueUse-style theme preference getter
             * Pobiera preferowany motyw (localStorage -> systemowy -> domyślny).
             */
            getPreferredTheme() {
                const storedTheme = localStorage.getItem(this.STORAGE_KEY);
                if (storedTheme && ['light', 'dark'].includes(storedTheme)) {
                    return storedTheme;
                }
                // Jeśli nic nie ma w storage, użyj 'light' jako domyślnego
                return 'light';
            }

            /**
             * 🌟 Bootstrap 5.3+ style theme setter
             * Ustawia motyw na stronie i zapisuje wybór.
             * @param {string} theme - 'light' or 'dark'.
             */
            setTheme(theme) {
                if (!['light', 'dark'].includes(theme)) {
                    console.warn('⚠️ Invalid theme:', theme, 'Using light as fallback');
                    theme = 'light';
                }
                
                this.currentTheme = theme;
                
                // 🚀 BOOTSTRAP 5.3+ STYLE: Użyj data-theme zamiast klas
                document.documentElement.setAttribute('data-theme', theme);
                
                // 🔄 BACKWARD COMPATIBILITY: Zachowaj klasy dla starszego kodu
                document.body.classList.remove('woow-theme-light', 'woow-theme-dark');
                document.documentElement.classList.remove('woow-theme-light', 'woow-theme-dark');
                document.body.classList.add(`mas-theme-${theme}`);
                document.documentElement.classList.add(`mas-theme-${theme}`);
                
                // 💾 Zapisz w localStorage
                localStorage.setItem(this.STORAGE_KEY, theme);
                
                // 🔧 Apply theme-specific colors to WordPress elements
                this.applyWordPressElementsColors(theme);
                
                // Update active state quick selector
                this.updateQuickSelectorState();
                

            }

            // Legacy method for backward compatibility
            applyTheme(theme) {

                this.setTheme(theme);
            }

            getSystemTheme() {
                return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
            }

            getStoredTheme() {
                return localStorage.getItem(this.STORAGE_KEY);
            }

            setStoredTheme(theme) {
                localStorage.setItem(this.STORAGE_KEY, theme);
            }

            getStoredPalette() {
                return localStorage.getItem(this.PALETTE_KEY);
            }

            setStoredPalette(palette) {
                localStorage.setItem(this.PALETTE_KEY, palette);
            }

            /**
             * 🎨 NOWE: Zastosowanie kolorów do elementów WordPress
             */
            applyWordPressElementsColors(theme) {
                const root = document.documentElement;
                
                if (theme === 'dark') {
                    // Dark theme colors for WordPress elements
                    root.style.setProperty('--woow-text-primary', '#f7fafc');
                    root.style.setProperty('--woow-text-secondary', '#cbd5e0');
                    root.style.setProperty('--woow-text-tertiary', '#a0aec0');
                    root.style.setProperty('--woow-text-inverse', '#1a202c');
                    root.style.setProperty('--woow-text-link', '#60a5fa');
                    root.style.setProperty('--woow-text-link-hover', '#93c5fd');
                    root.style.setProperty('--woow-accent-primary', '#3b82f6');
                    root.style.setProperty('--woow-accent-primary-hover', '#60a5fa');
                    root.style.setProperty('--woow-surface-elevated', '#2d3748');
                    root.style.setProperty('--woow-border-primary', '#4a5568');
                    root.style.setProperty('--woow-border-primary', '#4a5568');
                    root.style.setProperty('--woow-border-focus', '#60a5fa');
                } else {
                    // Light theme colors for WordPress elements
                    root.style.setProperty('--woow-text-primary', '#1e293b');
                    root.style.setProperty('--woow-text-secondary', '#64748b');
                    root.style.setProperty('--woow-text-tertiary', '#94a3b8');
                    root.style.setProperty('--woow-text-inverse', '#ffffff');
                    root.style.setProperty('--woow-text-link', '#0073aa');
                    root.style.setProperty('--woow-text-link-hover', '#005a87');
                    root.style.setProperty('--woow-accent-primary', '#0073aa');
                    root.style.setProperty('--woow-accent-primary-hover', '#005a87');
                    root.style.setProperty('--woow-surface-elevated', '#f1f1f1');
                    root.style.setProperty('--woow-border-primary', '#ddd');
                    root.style.setProperty('--woow-border-primary', '#ddd');
                    root.style.setProperty('--woow-border-focus', '#0073aa');
                }
                
                // 🔗 TRIGGER LIVE EDIT UPDATE
                if (this.liveEditEnabled && typeof window.MAS !== 'undefined') {
                    window.MAS.triggerUpdate();
                }
            }

            /**
             * 🔧 POPRAWIONE: Szybkie motywy z Live Edit integration
             */
            createQuickThemeSelector() {
                // Sprawdź czy już istnieje
                if (document.querySelector('.mas-quick-themes')) return;
                
                const container = document.createElement('div');
                container.className = 'mas-quick-themes';
                
                const themes = [
                    {
                        id: 'modern',
                        emoji: '🌌',
                        tooltip: 'Modern - Fioletowo-niebieski',
                        class: 'mas-quick-theme-modern'
                    },
                    {
                        id: 'white',
                        emoji: '🤍',
                        tooltip: 'White Minimal - Duże czcionki',
                        class: 'mas-quick-theme-white'
                    },
                    {
                        id: 'green',
                        emoji: '🌿',
                        tooltip: 'Soothing Green - Kojący',
                        class: 'mas-quick-theme-green'
                    }
                ];
                
                themes.forEach(theme => {
                    const btn = document.createElement('button');
                    btn.className = `mas-quick-theme-btn ${theme.class}`;
                    btn.dataset.palette = theme.id;
                    btn.dataset.tooltip = theme.tooltip;
                    btn.textContent = theme.emoji;
                    btn.setAttribute('aria-label', theme.tooltip);
                    btn.setAttribute('title', theme.tooltip);
                    
                    // 🔗 LIVE EDIT INTEGRATION
                    if (this.liveEditEnabled) {
                        btn.setAttribute('data-mas-editable', 'true');
                    }
                    
                    btn.addEventListener('click', () => {
                        this.switchPalette(theme.id, false);
                        
                        // Spectacular button animation!
                        btn.style.transform = 'scale(0.8) rotate(360deg)';
                        setTimeout(() => {
                            btn.style.transform = 'scale(1.15) rotate(0deg)';
                            setTimeout(() => {
                                btn.style.transform = '';
                            }, 200);
                        }, 150);
                        
                        // 🔗 LIVE EDIT TRIGGER
                        if (this.liveEditEnabled && typeof window.MAS !== 'undefined') {
                            window.MAS.triggerUpdate();
                        }
                    });
                    
                    container.appendChild(btn);
                });
                
                document.body.appendChild(container);
                
                // Animacja wejścia
                setTimeout(() => {
                    container.style.opacity = '1';
                    container.style.transform = 'scale(1)';
                }, 300);
                
                // Inicjalne style
                container.style.opacity = '0';
                container.style.transform = 'scale(0.8)';
                container.style.transition = 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';
                
                // Set initial active state
                this.updateQuickSelectorState();
            }

            createThemeToggle() {
                // Sprawdź czy przełącznik już istnieje
                if (document.querySelector('.mas-theme-toggle')) return;

                const toggle = document.createElement('button');
                toggle.className = 'mas-theme-toggle';
                toggle.setAttribute('aria-label', 'Przełącz motyw jasny/ciemny');
                toggle.setAttribute('title', 'Przełącz motyw jasny/ciemny');
                
                // 🔗 LIVE EDIT INTEGRATION
                if (this.liveEditEnabled) {
                    toggle.setAttribute('data-mas-editable', 'true');
                }
                
                // Enhanced styling
                toggle.style.cssText = `
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    width: 48px;
                    height: 48px;
                    border: 2px solid var(--woow-glass-border);
                    border-radius: 50%;
                    background: var(--woow-glass-bg);
                    backdrop-filter: var(--woow-blur-lg);
                    -webkit-backdrop-filter: var(--woow-blur-lg);
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 20px;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    z-index: 9999;
                    box-shadow: var(--woow-glass-shadow);
                `;
                
                toggle.addEventListener('click', () => {
                    this.toggleTheme();
                });
                
                // Set initial icon
                this.updateToggleIcon(toggle, this.currentTheme);
                
                document.body.appendChild(toggle);
            }

            /**
             * 🌟 System theme listener (disabled - auto mode removed)
             */
            setupSystemThemeListener() {
                // Auto mode removed - this function is now a no-op
                console.log('ℹ️ System theme listener disabled (auto mode removed)');
            }

            /**
             * 🔧 NOWE: Global Live Edit Toggle
             */
            /* WYŁĄCZONE - używamy tylko systemu mikropaneli
            createGlobalLiveEditToggle() {
                if (document.querySelector('.mas-global-live-edit-toggle')) return;

                const toggleWrapper = document.createElement('div');
                toggleWrapper.className = 'mas-global-live-edit-toggle';
                
                toggleWrapper.innerHTML = `
                    <div class="mas-global-toggle-wrapper">
                        <div class="mas-toggle-badge">BETA</div>
                        <button class="mas-toggle-btn" aria-label="Global Live Edit Mode">
                            <span class="mas-toggle-icon">⚡</span>
                            <span class="mas-toggle-text">Live Edit</span>
                        </button>
                    </div>
                `;
                
                const button = toggleWrapper.querySelector('.mas-toggle-btn');
                button.addEventListener('click', () => {
                    this.toggleLivePreview();
                    button.classList.toggle('active');
                });
                
                document.body.appendChild(toggleWrapper);
            }
            */

            /**
             * 🌟 Simple theme toggle: light ↔ dark
             */
            toggleTheme() {
                // Simple toggle between light and dark
                const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
                
                this.setTheme(newTheme);
                this.showThemeNotification(newTheme);
                
                // 🔗 INTEGRACJA Z LIVE EDIT
                if (this.liveEditEnabled) {
                    this.showThemeIndicator(newTheme);
                }
                
                // Animacja przełącznika
                const toggle = document.querySelector('.mas-theme-toggle');
                if (toggle) {
                    toggle.classList.add('switching');
                    toggle.style.transform = 'scale(0.9) rotate(180deg)';
                    setTimeout(() => {
                        toggle.style.transform = 'scale(1) rotate(0deg)';
                        toggle.classList.remove('switching');
                        
                        // Update toggle icon based on theme
                        this.updateToggleIcon(toggle, newTheme);
                    }, 200);
                }
            }

            /**
             * 🌟 Update toggle icon based on current theme
             */
            updateToggleIcon(toggle, theme) {
                const icons = {
                    'light': '☀️',
                    'dark': '🌙'
                };
                
                toggle.textContent = icons[theme] || '☀️';
                toggle.setAttribute('title', `Motyw: ${theme} (kliknij aby przełączyć)`);
            }

            /**
             * 🔗 NOWE: Wskaźnik motywu dla Live Edit
             */
            showThemeIndicator(theme) {
                // Remove existing indicator
                const existing = document.querySelector('.mas-theme-indicator');
                if (existing) existing.remove();
                
                const indicator = document.createElement('div');
                indicator.className = 'mas-theme-indicator';
                const icons = {
                    'dark': '🌙',
                    'light': '☀️'
                };
                const labels = {
                    'dark': 'Tryb Ciemny',
                    'light': 'Tryb Jasny'
                };
                
                indicator.innerHTML = `
                    ${icons[theme]} ${labels[theme]}
                    <small>Live Edit: ${this.liveEditEnabled ? 'ON' : 'OFF'}</small>
                `;
                
                document.body.appendChild(indicator);
                
                // Show with animation
                setTimeout(() => indicator.classList.add('show'), 100);
                
                // Hide after 3 seconds
                setTimeout(() => {
                    indicator.classList.remove('show');
                    setTimeout(() => indicator.remove(), 300);
                }, 3000);
            }

            switchPalette(palette, fromSelect = false) {
                if (palette === this.currentPalette) return;
                
                this.applyPalette(palette, true); // Show notification when switching
                
                // Update form select if exists (only if not called from select)
                if (!fromSelect) {
                    const selectElement = document.querySelector('select[name="color_palette"]');
                    if (selectElement) {
                        selectElement.value = palette;
                    }
                }
                
                // 🔗 TRIGGER LIVE EDIT INTEGRATION
                if (this.liveEditEnabled && typeof window.MAS !== 'undefined') {
                    window.MAS.triggerLivePreview();
                }
                
                // Mark as changed for save button
                if (typeof window.MAS !== 'undefined' && typeof window.MAS.markAsChanged === 'function') {
                    window.MAS.markAsChanged();
                }
            }

            showThemeNotification(theme) {
                const messages = {
                    'dark': '🌙 Przełączono na tryb ciemny',
                    'light': '☀️ Przełączono na tryb jasny'
                };
                
                this.showSimpleNotification(messages[theme] || 'Motyw zmieniony');
            }

            showPaletteNotification(palette) {
                const messages = {
                    'modern': '🌌 Modern Theme - Fioletowo-niebieski',
                    'white': '🤍 White Minimal - Jasny z dużymi czcionkami',
                    'green': '🌿 Soothing Green - Kojący zielony'
                };
                
                this.showSimpleNotification(messages[palette] || 'Paleta zmieniona');
            }

            showSimpleNotification(message) {
                // Remove existing notification
                const existing = document.querySelector('.mas-notification');
                if (existing) existing.remove();
                
                const notification = document.createElement('div');
                notification.className = 'mas-notification';
                notification.textContent = message;
                notification.style.cssText = `
                    position: fixed;
                    top: 32px;
                    right: 32px;
                    background: var(--woow-glass-bg);
                    backdrop-filter: var(--woow-blur-lg);
                    -webkit-backdrop-filter: var(--woow-blur-lg);
                    color: var(--mas-text-primary);
                    padding: 12px 20px;
                    border-radius: 12px;
                    border: 1px solid var(--woow-glass-border);
                    box-shadow: var(--woow-glass-shadow);
                    z-index: 10000;
                    font-size: 14px;
                    font-weight: 500;
                    opacity: 0;
                    transform: translateX(100%);
                    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                `;
                
                document.body.appendChild(notification);
                
                // Animate in
                setTimeout(() => {
                    notification.style.opacity = '1';
                    notification.style.transform = 'translateX(0)';
                }, 100);
                
                // Animate out
                setTimeout(() => {
                    notification.style.opacity = '0';
                    notification.style.transform = 'translateX(100%)';
                    setTimeout(() => notification.remove(), 400);
                }, 3000);
            }

            applyPalette(palette, showNotification = false) {
                this.currentPalette = palette;
                
                // Remove existing palette classes
                document.body.className = document.body.className.replace(/\bmas-palette-\w+/g, '');
                document.documentElement.className = document.documentElement.className.replace(/\bdata-theme-palette-\w+/g, '');
                
                // Add new palette class and data attribute
                document.body.classList.add(`mas-palette-${palette}`);
                document.documentElement.setAttribute('data-theme-palette', palette);
                
                // Store preference
                this.setStoredPalette(palette);
                
                // Update active state quick selector
                this.updateQuickSelectorState();
                
                // 🔗 TRIGGER LIVE EDIT UPDATE
                if (this.liveEditEnabled && typeof window.MAS !== 'undefined') {
                    window.MAS.triggerUpdate();
                }
                
                // Show notification only if requested
                if (showNotification) {
                    this.showPaletteNotification(palette);
                }
            }

            updateQuickSelectorState() {
                const buttons = document.querySelectorAll('.mas-quick-theme-btn');
                buttons.forEach(btn => {
                    btn.classList.remove('active');
                    if (btn.dataset.palette === this.currentPalette) {
                        btn.classList.add('active');
                    }
                });
            }
        }

        // Initialize and expose globally
        window.WOOW_ThemeManager = new ThemeManager();
        window.WOOW_ThemeManager.init();
    }
    
})(jQuery); 