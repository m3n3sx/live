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
        
        // Menu floating status
        if (settings.menu_detached) {
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
        if (settings.admin_bar_detached) {
            body.classList.add('mas-admin-bar-floating');
        } else {
            body.classList.remove('mas-admin-bar-floating');
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
     */
    function initGlobalThemeManager() {
        const themeManager = new GlobalThemeManager();
        themeManager.init();
    }
    
    class GlobalThemeManager {
        constructor() {
            this.currentTheme = this.getStoredTheme() || this.getSystemTheme();
        }
        
        init() {
            this.applyTheme(this.currentTheme);
            this.createThemeToggle();
            this.createLivePreviewToggle();
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
        
        showThemeNotification(theme) {
            const message = theme === 'dark' ? 
                '◐ Przełączono na tryb ciemny' : 
                '◑ Przełączono na tryb jasny';
            
            // Użyj WordPress notices jeśli dostępne
            if (typeof wp !== 'undefined' && wp.data) {
                // WordPress block editor
                wp.data.dispatch('core/notices').createNotice('info', message, {
                    isDismissible: true,
                    type: 'snackbar'
                });
            } else {
                // Fallback - prosta notyfikacja
                this.showSimpleNotification(message);
            }
        }
        
        showSimpleNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'mas-theme-notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
                top: 50px;
            right: 20px;
                background: var(--mas-glass);
            backdrop-filter: blur(16px);
                color: var(--mas-text-primary);
                padding: 12px 20px;
            border-radius: 12px;
                box-shadow: var(--mas-shadow-lg);
                z-index: 10001;
                opacity: 0;
                transform: translateX(100px);
                transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
                border: 1px solid var(--mas-glass-border);
            font-weight: 500;
        `;
        
        document.body.appendChild(notification);
        
            // Animacja wejścia
        setTimeout(() => {
                notification.style.opacity = '1';
            notification.style.transform = 'translateX(0)';
        }, 10);
        
            // Usunięcie po 3 sekundach
        setTimeout(() => {
                notification.style.opacity = '0';
            notification.style.transform = 'translateX(100px)';
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 300);
        }, 3000);
    }
    
        createThemeToggle() {
            // Sprawdź czy przełącznik już istnieje
            if (document.querySelector('.mas-theme-toggle')) return;

            const toggle = document.createElement('button');
            toggle.className = 'mas-theme-toggle';
            toggle.setAttribute('aria-label', 'Przełącz motyw');
            toggle.setAttribute('title', 'Przełącz między trybem jasnym a ciemnym (Ctrl+Shift+T)');
            
            const icon = document.createElement('span');
            icon.className = 'mas-theme-toggle-icon';
            toggle.appendChild(icon);
            
            toggle.addEventListener('click', () => this.toggleTheme());
            
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
            toggle.setAttribute('aria-label', 'Włącz/wyłącz Live Preview');
            toggle.setAttribute('title', 'Podgląd zmian na żywo');
            
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
            
            toggle.addEventListener('click', () => this.toggleLivePreview());
            
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
    }
    
})(jQuery); 