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
         * 🎯 GLOBAL LIVE EDIT MODE TOGGLE - Dostępny w całym WordPress Admin!
         */
        createGlobalLiveEditToggle() {
            // Sprawdź czy już istnieje
            if (document.querySelector('.mas-global-live-edit-toggle')) {
                return;
            }

            // Główny container - floating w prawym górnym rogu
            const toggleContainer = document.createElement('div');
            toggleContainer.className = 'mas-global-live-edit-toggle';
            toggleContainer.innerHTML = `
                <div class="mas-global-toggle-wrapper">
                    <div class="mas-toggle-badge">BETA</div>
                    <button class="mas-toggle-btn" id="mas-global-edit-mode-btn">
                        <span class="mas-toggle-icon">⚙️</span>
                        <span class="mas-toggle-text">Live Edit</span>
                        <div class="mas-toggle-switch">
                            <div class="mas-toggle-slider"></div>
                        </div>
                    </button>
                    <div class="mas-toggle-tooltip">
                        <div class="mas-tooltip-content">
                            <strong>🎯 Live Edit Mode</strong>
                            <p>Kontekstowa edycja elementów interfejsu bezpośrednio w miejscu ich występowania</p>
                            <div class="mas-tooltip-shortcuts">
                                <span><kbd>Ctrl</kbd> + <kbd>E</kbd> - Toggle</span>
                                <span><kbd>Ctrl</kbd> + <kbd>M</kbd> - Multi-Select</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            document.body.appendChild(toggleContainer);

            // Pobierz stan z localStorage
            const isActive = localStorage.getItem('mas-global-live-edit-mode') === 'true';
            if (isActive) {
                this.activateGlobalLiveEditMode();
            }

            // Event listeners
            const toggleBtn = document.getElementById('mas-global-edit-mode-btn');
            const toggleWrapper = toggleContainer.querySelector('.mas-global-toggle-wrapper');

            // Click handler
            toggleBtn.addEventListener('click', () => {
                this.toggleGlobalLiveEditMode();
            });

            // Hover effects
            toggleWrapper.addEventListener('mouseenter', () => {
                toggleWrapper.classList.add('expanded');
            });

            toggleWrapper.addEventListener('mouseleave', () => {
                toggleWrapper.classList.remove('expanded');
            });

            // Keyboard shortcuts
            document.addEventListener('keydown', (e) => {
                // Ctrl + E - Toggle Live Edit Mode
                if (e.ctrlKey && e.key === 'e') {
                    e.preventDefault();
                    this.toggleGlobalLiveEditMode();
                }
                
                // Ctrl + M - Multi-Select Mode (if Live Edit is active)
                if (e.ctrlKey && e.key === 'm' && document.body.classList.contains('mas-edit-mode-active')) {
                    e.preventDefault();
                    if (typeof MAS !== 'undefined' && MAS.toggleMultiSelectMode) {
                        MAS.toggleMultiSelectMode();
                    }
                }
            });

            console.log('🎯 Global Live Edit Toggle created!');
        }

        /**
         * Toggle Global Live Edit Mode
         */
        toggleGlobalLiveEditMode() {
            const isActive = document.body.classList.contains('mas-edit-mode-active');
            
            if (isActive) {
                this.deactivateGlobalLiveEditMode();
            } else {
                this.activateGlobalLiveEditMode();
            }
        }

        /**
         * Activate Global Live Edit Mode
         */
        activateGlobalLiveEditMode() {
            document.body.classList.add('mas-edit-mode-active');
            localStorage.setItem('mas-global-live-edit-mode', 'true');
            
            const toggleBtn = document.getElementById('mas-global-edit-mode-btn');
            const toggleSlider = document.querySelector('.mas-toggle-slider');
            
            if (toggleBtn) {
                toggleBtn.classList.add('active');
                toggleSlider.style.transform = 'translateX(24px)';
                toggleSlider.style.backgroundColor = '#00ff88';
            }

            // Initialize Live Edit Mode if MAS is available
            setTimeout(() => {
                if (typeof MAS !== 'undefined' && MAS.initLiveEditMode) {
                    MAS.initLiveEditMode();
                } else {
                    // Create basic context cogs for non-plugin pages
                    this.createBasicContextCogs();
                }
            }, 100);

            this.showSimpleNotification('🎯 Live Edit Mode WŁĄCZONY - Kliknij ikonki ⚙️ aby edytować elementy');
        }

        /**
         * Deactivate Global Live Edit Mode
         */
        deactivateGlobalLiveEditMode() {
            document.body.classList.remove('mas-edit-mode-active');
            localStorage.setItem('mas-global-live-edit-mode', 'false');
            
            const toggleBtn = document.getElementById('mas-global-edit-mode-btn');
            const toggleSlider = document.querySelector('.mas-toggle-slider');
            
            if (toggleBtn) {
                toggleBtn.classList.remove('active');
                toggleSlider.style.transform = 'translateX(0px)';
                toggleSlider.style.backgroundColor = '#666';
            }

            // Cleanup context cogs and panels
            const cogs = document.querySelectorAll('.mas-context-cog');
            const panels = document.querySelectorAll('.mas-micro-panel');
            
            cogs.forEach(cog => cog.remove());
            panels.forEach(panel => panel.remove());

            this.showSimpleNotification('🎯 Live Edit Mode WYŁĄCZONY');
        }

        /**
         * Create basic context cogs for non-plugin admin pages
         */
        createBasicContextCogs() {
            const elements = [
                { selector: '#wpadminbar', name: 'Admin Bar' },
                { selector: '#adminmenumain', name: 'Admin Menu' },
                { selector: '#wpcontent', name: 'Content Area' },
                { selector: '.postbox', name: 'Dashboard Widget' },
                { selector: '.wrap > h1', name: 'Page Title' },
                { selector: '.wp-header-end', name: 'Header Section' }
            ];

            elements.forEach(element => {
                const target = document.querySelector(element.selector);
                if (target && !target.querySelector('.mas-context-cog')) {
                    this.addContextCogToElement(target, element.name);
                }
            });
        }

        /**
         * Add context cog to element
         */
        addContextCogToElement(element, name) {
            const cog = document.createElement('div');
            cog.className = 'mas-context-cog';
            cog.innerHTML = `
                <div class="mas-cog-icon">⚙️</div>
                <div class="mas-cog-tooltip">${name}</div>
            `;

            // Position the cog
            element.style.position = 'relative';
            element.appendChild(cog);

            // Click handler for basic color panel
            cog.addEventListener('click', (e) => {
                e.stopPropagation();
                this.openBasicColorPanel(element, name);
            });
        }

        /**
         * Open basic color panel for elements
         */
        openBasicColorPanel(element, name) {
            // Remove existing panels
            const existingPanels = document.querySelectorAll('.mas-micro-panel');
            existingPanels.forEach(panel => panel.remove());

            const panel = document.createElement('div');
            panel.className = 'mas-micro-panel mas-basic-panel';
            panel.innerHTML = `
                <div class="mas-panel-header">
                    <span class="mas-panel-title">✨ ${name}</span>
                    <button class="mas-panel-close">×</button>
                </div>
                <div class="mas-panel-content">
                    <div class="mas-control-group">
                        <label>🎨 Background Color</label>
                        <input type="color" class="mas-color-input" data-property="backgroundColor" value="#ffffff">
                    </div>
                    <div class="mas-control-group">
                        <label>📝 Text Color</label>
                        <input type="color" class="mas-color-input" data-property="color" value="#000000">
                    </div>
                    <div class="mas-control-group">
                        <label>🔲 Border Color</label>
                        <input type="color" class="mas-color-input" data-property="borderColor" value="#cccccc">
                    </div>
                    <div class="mas-control-group">
                        <label>💧 Opacity</label>
                        <input type="range" class="mas-range-input" data-property="opacity" min="0" max="1" step="0.1" value="1">
                    </div>
                </div>
            `;

            document.body.appendChild(panel);

            // Position panel
            const rect = element.getBoundingClientRect();
            panel.style.left = Math.min(rect.right + 10, window.innerWidth - 320) + 'px';
            panel.style.top = Math.max(rect.top, 10) + 'px';

            // Event listeners
            panel.querySelector('.mas-panel-close').addEventListener('click', () => {
                panel.remove();
            });

            panel.querySelectorAll('.mas-color-input, .mas-range-input').forEach(input => {
                input.addEventListener('input', (e) => {
                    const property = e.target.dataset.property;
                    const value = e.target.value;
                    element.style[property] = value;
                });
            });

            // Show with animation
            requestAnimationFrame(() => {
                panel.classList.add('show');
            });
        }
    }
    
})(jQuery); 