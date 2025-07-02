/**
 * Modern Admin Styler V2 - Global Admin Script
 * Lekki skrypt ładowany na wszystkich stronach wp-admin
 */

(function($) {
    'use strict';
    
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
    });
    
    /**
     * Aktualizuj klasy CSS body na podstawie ustawień
     */
    function updateBodyClasses(settings) {
        const body = document.body;
        
        // Debug: Sprawdź obecne ustawienia
        console.log('🔍 MAS V2 Debug - Current settings:', settings);
        console.log('🔍 MAS V2 Debug - admin_bar_floating:', settings.admin_bar_floating);
        console.log('🔍 MAS V2 Debug - Current body classes BEFORE update:', body.className);

        // Menu floating status
        if (settings.menu_floating) {
            body.classList.add('mas-menu-floating', 'mas-v2-menu-floating');
            body.classList.remove('mas-menu-normal');
        } else {
            body.classList.add('mas-menu-normal');
            body.classList.remove('mas-menu-floating', 'mas-v2-menu-floating');
        }
        
        // Menu compact mode
        if (settings.menu_compact_mode) {
            body.classList.add('mas-menu-compact-mode');
        } else {
            body.classList.remove('mas-menu-compact-mode');
        }
        
        // Admin bar floating status
        if (settings.admin_bar_floating) {
            body.classList.add('mas-v2-admin-bar-floating');
            body.classList.remove('mas-admin-bar-floating'); // Remove old class
            console.log('✅ MAS V2 Debug - Added mas-v2-admin-bar-floating class');
        } else {
            body.classList.remove('mas-v2-admin-bar-floating', 'mas-admin-bar-floating');
            console.log('❌ MAS V2 Debug - Removed floating admin bar classes');
        }
        
        // Corner radius classes
        body.classList.remove('mas-corner-radius-all', 'mas-corner-radius-individual');
        if (settings.corner_radius_type === 'all') {
            body.classList.add('mas-corner-radius-all');
        } else if (settings.corner_radius_type === 'individual') {
            body.classList.add('mas-corner-radius-individual');
        }

        // Debug: Sprawdź finalne klasy
        console.log('🔍 MAS V2 Debug - Final body classes AFTER update:', body.className);
        console.log('🔍 MAS V2 Debug - Has mas-v2-admin-bar-floating?', body.classList.contains('mas-v2-admin-bar-floating'));
        console.log('🔍 MAS V2 Debug - Has admin-bar?', body.classList.contains('admin-bar'));
    }

    /**
     * Globalny manager motywów - działa na wszystkich stronach wp-admin
     * Teraz z QUICK THEME SELECTOR!
     */
    function initGlobalThemeManager() {
        window.themeManager = new ThemeManager();
    }
    
    class ThemeManager {
        constructor() {
            this.currentTheme = this.getStoredTheme() || this.getSystemTheme();
            this.currentPalette = this.getStoredPalette() || 'modern';
            this.init();
        }
        
        init() {
            this.applyTheme(this.currentTheme);
            this.applyPalette(this.currentPalette);
            this.createThemeToggle();
            this.createLivePreviewToggle();
            this.createGlobalLiveEditToggle();
            this.createQuickThemeSelector();
            this.setupSystemThemeListener();
        }
        
        getSystemTheme() {
            return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
        
        getStoredTheme() {
            return localStorage.getItem('mas-v2-theme');
        }
        
        setStoredTheme(theme) {
            localStorage.setItem('mas-v2-theme', theme);
        }
        
        getStoredPalette() {
            return localStorage.getItem('mas-v2-palette');
        }
        
        setStoredPalette(palette) {
            localStorage.setItem('mas-v2-palette', palette);
        }
        
        applyTheme(theme) {
            this.currentTheme = theme;
            document.documentElement.setAttribute('data-theme', theme);
            this.setStoredTheme(theme);
            
            // Dodaj/usuń klasę z body dla kompatybilności
            if (theme === 'dark') {
                document.body.classList.add('mas-theme-dark');
                document.body.classList.remove('mas-theme-light');
                } else {
                document.body.classList.add('mas-theme-light');
                document.body.classList.remove('mas-theme-dark');
            }
        }
        
        applyPalette(palette, showNotification = false) {
            this.currentPalette = palette;
            document.documentElement.setAttribute('data-theme-palette', palette);
            this.setStoredPalette(palette);
            
            // Update active state quick selector
            this.updateQuickSelectorState();
            
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
        
        toggleTheme() {
            const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
            this.applyTheme(newTheme);
            this.showThemeNotification(newTheme);
            
            // Animacja przełącznika
        const toggle = document.querySelector('.mas-theme-toggle');
        if (toggle) {
                toggle.classList.add('switching');
                toggle.style.transform = 'scale(0.9) rotate(180deg)';
                setTimeout(() => {
                toggle.style.transform = 'scale(1) rotate(0deg)';
                    toggle.classList.remove('switching');
                }, 200);
            }
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
            
            // Trigger live preview if enabled
            if (typeof MAS !== 'undefined' && MAS.livePreviewEnabled) {
                MAS.triggerLivePreview();
            }
            
            // Mark as changed for save button
            if (typeof MAS !== 'undefined' && typeof MAS.markAsChanged === 'function') {
                MAS.markAsChanged();
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
                'green': '🌿 Soothing Green - Kojący'
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
                background: var(--mas-glass-bg);
                backdrop-filter: var(--mas-blur-lg);
                -webkit-backdrop-filter: var(--mas-blur-lg);
                color: var(--mas-text);
                padding: 12px 20px;
            border-radius: 12px;
                border: 1px solid var(--mas-glass-border);
                box-shadow: var(--mas-glass-shadow);
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
            
            // NAPRAWKA ACCESSIBILITY: Dodaj proper ARIA labels i keyboard support
            toggle.setAttribute('aria-label', 'Przełącz motyw między jasnym a ciemnym');
            toggle.setAttribute('role', 'button');
            toggle.setAttribute('tabindex', '0');
            toggle.setAttribute('title', 'Przełącz między trybem jasnym a ciemnym (Ctrl+Shift+T)');
            
            // NAPRAWKA: Event listeners z namespace
            toggle.addEventListener('click', () => this.toggleTheme());
            
            // NAPRAWKA ACCESSIBILITY: Keyboard support
            toggle.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.toggleTheme();
                }
            });
            
            // Dodaj obsługę skrótu klawiszowego
            document.addEventListener('keydown', (e) => {
                if (e.ctrlKey && e.shiftKey && e.key === 'T') {
                    e.preventDefault();
                    this.toggleTheme();
                }
            });
            
            // Dodaj przełącznik do body
            document.body.appendChild(toggle);
            
            // Animacja wejścia
            setTimeout(() => {
                toggle.style.opacity = '1';
                toggle.style.transform = 'scale(1)';
            }, 100);
            
            // Inicjalne style
            toggle.style.opacity = '0';
            toggle.style.transform = 'scale(0.8)';
            toggle.style.transition = 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)';
        }
        
        createLivePreviewToggle() {
            // Sprawdź czy przełącznik już istnieje
            if (document.querySelector('.mas-live-preview-toggle')) return;

            const toggle = document.createElement('button');
            toggle.className = 'mas-live-preview-toggle';
            
            // NAPRAWKA ACCESSIBILITY: Dodaj proper ARIA labels i keyboard support
            toggle.setAttribute('aria-label', 'Włącz lub wyłącz podgląd zmian na żywo');
            toggle.setAttribute('role', 'button');
            toggle.setAttribute('tabindex', '0');
            toggle.setAttribute('title', 'Podgląd zmian na żywo (Ctrl+Shift+P)');
            
            const icon = document.createElement('span');
            icon.className = 'mas-live-preview-icon';
            toggle.appendChild(icon);
            
            // Dodaj pulsującą kropkę
            const dot = document.createElement('span');
            dot.className = 'mas-live-preview-dot';
            toggle.appendChild(dot);
            
            // Sprawdź stan Live Preview
            const isActive = this.getLivePreviewState();
            toggle.classList.toggle('active', isActive);
            
            // NAPRAWKA: Event listeners z proper keyboard support
            toggle.addEventListener('click', () => this.toggleLivePreview());
            
            // NAPRAWKA ACCESSIBILITY: Keyboard support
            toggle.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.toggleLivePreview();
                }
            });
            
            // NAPRAWKA: Dodaj skrót klawiszowy dla Live Preview
            document.addEventListener('keydown', (e) => {
                if (e.ctrlKey && e.shiftKey && e.key === 'P') {
                    e.preventDefault();
                    this.toggleLivePreview();
                }
            });
            
            // Dodaj przełącznik do body
            document.body.appendChild(toggle);
            
            // Animacja wejścia (z opóźnieniem po theme toggle)
            setTimeout(() => {
                toggle.style.opacity = '1';
                toggle.style.transform = 'scale(1)';
            }, 200);
            
            // Inicjalne style
            toggle.style.opacity = '0';
            toggle.style.transform = 'scale(0.8)';
            toggle.style.transition = 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)';
        }
        
        getLivePreviewState() {
            // Sprawdź checkbox na stronie wtyczki najpierw
            const checkbox = document.getElementById('mas-v2-live-preview');
            if (checkbox) return checkbox.checked;
            
            // Fallback do localStorage jeśli checkbox nie istnieje
            const stored = localStorage.getItem('mas-v2-live-preview');
            return stored !== null ? stored === 'true' : true; // Domyślnie true
        }
        
        toggleLivePreview() {
            const toggle = document.querySelector('.mas-live-preview-toggle');
            if (!toggle) return;
            
            const isActive = toggle.classList.contains('active');
            const newState = !isActive;
            
            toggle.classList.toggle('active', newState);
            
            // Zapisz stan
            localStorage.setItem('mas-v2-live-preview', newState.toString());
            
            // Aktualizuj checkbox jeśli istnieje
            const checkbox = document.getElementById('mas-v2-live-preview');
            if (checkbox) {
                checkbox.checked = newState;
                // Wywołaj event change
                const event = new Event('change', { bubbles: true });
                checkbox.dispatchEvent(event);
            }
            
            // Animacja przełącznika
            toggle.style.transform = 'scale(0.9) rotate(180deg)';
            setTimeout(() => {
                toggle.style.transform = 'scale(1) rotate(0deg)';
            }, 150);
            
            // Notyfikacja
            const message = newState ? 
                '◉ Live Preview włączony' : 
                '◯ Live Preview wyłączony';
            this.showSimpleNotification(message);
        }
        
        setupSystemThemeListener() {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            mediaQuery.addEventListener('change', (e) => {
                // Tylko jeśli użytkownik nie ustawił własnych preferencji
                if (!this.getStoredTheme()) {
                    this.applyTheme(e.matches ? 'dark' : 'light');
                }
            });
        }

        /**
         * 🎯 GLOBAL LIVE EDIT MODE TOGGLE - DISABLED
         * The blue toggle from live-edit-mode.js will handle this
         */
        createGlobalLiveEditToggle() {
            // Disabled - using the blue toggle from live-edit-mode.js instead
            console.log('🎯 Global Live Edit Toggle disabled - using blue toggle from live-edit-mode.js');
        }
    }
    
})(jQuery); 