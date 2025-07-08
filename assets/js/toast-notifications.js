/**
 * Toast Notifications System - Elegant Notification System
 * 
 * FAZA 5: Advanced Performance & UX
 * Zaawansowany system powiadomień z animacjami i kolejkowaniem
 * 
 * @package ModernAdminStyler
 * @version 3.2.0
 */

class MASToastNotifications {
    
    constructor() {
        this.container = null;
        this.toasts = [];
        this.queue = [];
        this.maxToasts = 5;
        this.defaultDuration = 5000;
        this.animationDuration = 300;
        
        // 🎨 Typy powiadomień
        this.types = {
            SUCCESS: 'success',
            ERROR: 'error',
            WARNING: 'warning',
            INFO: 'info',
            LOADING: 'loading'
        };
        
        // 🎯 Pozycje powiadomień
        this.positions = {
            TOP_RIGHT: 'top-right',
            TOP_LEFT: 'top-left',
            TOP_CENTER: 'top-center',
            BOTTOM_RIGHT: 'bottom-right',
            BOTTOM_LEFT: 'bottom-left',
            BOTTOM_CENTER: 'bottom-center'
        };
        
        this.currentPosition = this.positions.TOP_RIGHT;
        this.init();
    }
    
    /**
     * 🚀 Inicjalizacja systemu
     */
    init() {
        this.createContainer();
        this.injectStyles();
        this.setupEventListeners();
        
        // Udostępnij globalnie
        window.MASToast = this;
        
    }
    
    /**
     * 📦 Stwórz kontener dla powiadomień
     */
    createContainer() {
        this.container = document.createElement('div');
        this.container.id = 'mas-toast-container';
        this.container.className = `mas-toast-container ${this.currentPosition}`;
        this.container.setAttribute('aria-live', 'polite');
        this.container.setAttribute('aria-label', 'Notifications');
        
        document.body.appendChild(this.container);
    }
    
    /**
     * 🎨 Wstrzyknij style CSS
     */
    injectStyles() {
        const styles = `
            <style id="mas-toast-styles">
                .mas-toast-container {
                    position: fixed;
                    z-index: 999999;
                    pointer-events: none;
                    max-width: 420px;
                    width: 100%;
                    padding: 16px;
                    box-sizing: border-box;
                }
                
                /* Pozycje kontenerów */
                .mas-toast-container.top-right {
                    top: 0;
                    right: 0;
                }
                
                .mas-toast-container.top-left {
                    top: 0;
                    left: 0;
                }
                
                .mas-toast-container.top-center {
                    top: 0;
                    left: 50%;
                    transform: translateX(-50%);
                }
                
                .mas-toast-container.bottom-right {
                    bottom: 0;
                    right: 0;
                }
                
                .mas-toast-container.bottom-left {
                    bottom: 0;
                    left: 0;
                }
                
                .mas-toast-container.bottom-center {
                    bottom: 0;
                    left: 50%;
                    transform: translateX(-50%);
                }
                
                /* Toast styles */
                .mas-toast {
                    pointer-events: auto;
                    margin-bottom: 12px;
                    padding: 16px 20px;
                    border-radius: 8px;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                    backdrop-filter: blur(10px);
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    font-size: 14px;
                    line-height: 1.4;
                    max-width: 100%;
                    word-wrap: break-word;
                    position: relative;
                    overflow: hidden;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    transform: translateX(0);
                    opacity: 1;
                }
                
                /* Animacje wejścia */
                .mas-toast.entering {
                    animation: masToastSlideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }
                
                .mas-toast.exiting {
                    animation: masToastSlideOut 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }
                
                @keyframes masToastSlideIn {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                
                @keyframes masToastSlideOut {
                    from {
                        transform: translateX(0);
                        opacity: 1;
                    }
                    to {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                }
                
                /* Typy powiadomień */
                .mas-toast.success {
                    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                    color: white;
                }
                
                .mas-toast.error {
                    background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
                    color: white;
                }
                
                .mas-toast.warning {
                    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
                    color: white;
                }
                
                .mas-toast.info {
                    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
                    color: white;
                }
                
                .mas-toast.loading {
                    background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
                    color: white;
                }
                
                /* Ikony */
                .mas-toast-icon {
                    display: inline-block;
                    width: 20px;
                    height: 20px;
                    margin-right: 12px;
                    vertical-align: top;
                    flex-shrink: 0;
                }
                
                .mas-toast-content {
                    display: flex;
                    align-items: flex-start;
                }
                
                .mas-toast-text {
                    flex: 1;
                    margin: 0;
                }
                
                .mas-toast-title {
                    font-weight: 600;
                    margin: 0 0 4px 0;
                }
                
                .mas-toast-message {
                    margin: 0;
                    opacity: 0.9;
                }
                
                /* Przycisk zamknięcia */
                .mas-toast-close {
                    position: absolute;
                    top: 8px;
                    right: 8px;
                    background: none;
                    border: none;
                    color: currentColor;
                    cursor: pointer;
                    padding: 4px;
                    border-radius: 4px;
                    opacity: 0.7;
                    transition: opacity 0.2s;
                }
                
                .mas-toast-close:hover {
                    opacity: 1;
                }
                
                /* Pasek postępu */
                .mas-toast-progress {
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    height: 3px;
                    background: rgba(255, 255, 255, 0.3);
                    transition: width linear;
                    border-radius: 0 0 8px 8px;
                }
                
                /* Spinner dla loading */
                .mas-toast-spinner {
                    width: 20px;
                    height: 20px;
                    border: 2px solid rgba(255, 255, 255, 0.3);
                    border-top: 2px solid white;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin-right: 12px;
                    flex-shrink: 0;
                }
                
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                
                /* Responsywność */
                @media (max-width: 640px) {
                    .mas-toast-container {
                        max-width: 100%;
                        padding: 12px;
                    }
                    
                    .mas-toast {
                        margin-bottom: 8px;
                        padding: 12px 16px;
                        font-size: 13px;
                    }
                }
            </style>
        `;
        
        document.head.insertAdjacentHTML('beforeend', styles);
    }
    
    /**
     * 🎧 Konfiguruj event listenery
     */
    setupEventListeners() {
        // Zamknij toast przy kliknięciu
        this.container.addEventListener('click', (e) => {
            if (e.target.closest('.mas-toast-close')) {
                const toast = e.target.closest('.mas-toast');
                if (toast) {
                    this.remove(toast.dataset.toastId);
                }
            }
        });
        
        // Zatrzymaj timer przy hover
        this.container.addEventListener('mouseenter', (e) => {
            const toast = e.target.closest('.mas-toast');
            if (toast && toast.dataset.toastId) {
                this.pauseTimer(toast.dataset.toastId);
            }
        });
        
        // Wznów timer po mouse leave
        this.container.addEventListener('mouseleave', (e) => {
            const toast = e.target.closest('.mas-toast');
            if (toast && toast.dataset.toastId) {
                this.resumeTimer(toast.dataset.toastId);
            }
        });
    }
    
    /**
     * 🔔 Pokaż powiadomienie
     */
    show(options) {
        const config = {
            type: this.types.INFO,
            title: '',
            message: '',
            duration: this.defaultDuration,
            closable: true,
            showProgress: true,
            icon: null,
            onClick: null,
            onClose: null,
            ...options
        };
        
        // Generuj unikalny ID
        const toastId = 'toast_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        
        // Dodaj do kolejki jeśli przekroczono limit
        if (this.toasts.length >= this.maxToasts) {
            this.queue.push({ id: toastId, config });
            return toastId;
        }
        
        // Stwórz element toast
        const toastElement = this.createToastElement(toastId, config);
        
        // Dodaj do kontenera
        this.container.appendChild(toastElement);
        
        // Dodaj do listy aktywnych
        const toastData = {
            id: toastId,
            element: toastElement,
            config: config,
            timer: null,
            startTime: Date.now(),
            pausedTime: 0
        };
        
        this.toasts.push(toastData);
        
        // Animacja wejścia
        requestAnimationFrame(() => {
            toastElement.classList.add('entering');
            
            setTimeout(() => {
                toastElement.classList.remove('entering');
            }, this.animationDuration);
        });
        
        // Ustaw timer auto-usuwania
        if (config.duration > 0) {
            this.setTimer(toastData);
        }
        
        // Uruchom callback
        if (config.onClick) {
            toastElement.addEventListener('click', config.onClick);
        }
        
        return toastId;
    }
    
    /**
     * 🏗️ Stwórz element toast
     */
    createToastElement(id, config) {
        const toast = document.createElement('div');
        toast.className = `mas-toast ${config.type}`;
        toast.dataset.toastId = id;
        toast.setAttribute('role', 'alert');
        toast.setAttribute('aria-live', 'assertive');
        
        // Ikona
        let iconHTML = '';
        if (config.type === this.types.LOADING) {
            iconHTML = '<div class="mas-toast-spinner"></div>';
        } else {
            const icon = config.icon || this.getDefaultIcon(config.type);
            if (icon) {
                iconHTML = `<div class="mas-toast-icon">${icon}</div>`;
            }
        }
        
        // Przycisk zamknięcia
        const closeButton = config.closable ? 
            '<button class="mas-toast-close" aria-label="Zamknij powiadomienie">×</button>' : '';
        
        // Pasek postępu
        const progressBar = config.showProgress && config.duration > 0 ? 
            '<div class="mas-toast-progress"></div>' : '';
        
        // Treść
        const titleHTML = config.title ? `<div class="mas-toast-title">${config.title}</div>` : '';
        const messageHTML = config.message ? `<div class="mas-toast-message">${config.message}</div>` : '';
        
        toast.innerHTML = `
            ${closeButton}
            <div class="mas-toast-content">
                ${iconHTML}
                <div class="mas-toast-text">
                    ${titleHTML}
                    ${messageHTML}
                </div>
            </div>
            ${progressBar}
        `;
        
        return toast;
    }
    
    /**
     * 🎨 Pobierz domyślną ikonę
     */
    getDefaultIcon(type) {
        const icons = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ',
            loading: ''
        };
        
        return icons[type] || '';
    }
    
    /**
     * ⏰ Ustaw timer auto-usuwania
     */
    setTimer(toastData) {
        const remainingTime = toastData.config.duration - toastData.pausedTime;
        
        toastData.timer = setTimeout(() => {
            this.remove(toastData.id);
        }, remainingTime);
        
        // Animuj pasek postępu
        if (toastData.config.showProgress) {
            const progressBar = toastData.element.querySelector('.mas-toast-progress');
            if (progressBar) {
                progressBar.style.width = '100%';
                progressBar.style.transitionDuration = remainingTime + 'ms';
                
                requestAnimationFrame(() => {
                    progressBar.style.width = '0%';
                });
            }
        }
    }
    
    /**
     * ⏸️ Zatrzymaj timer
     */
    pauseTimer(toastId) {
        const toast = this.toasts.find(t => t.id === toastId);
        if (toast && toast.timer) {
            clearTimeout(toast.timer);
            toast.timer = null;
            
            // Oblicz czas pauzy
            toast.pausedTime += Date.now() - toast.startTime;
            
            // Zatrzymaj pasek postępu
            const progressBar = toast.element.querySelector('.mas-toast-progress');
            if (progressBar) {
                progressBar.style.transitionDuration = '0ms';
            }
        }
    }
    
    /**
     * ▶️ Wznów timer
     */
    resumeTimer(toastId) {
        const toast = this.toasts.find(t => t.id === toastId);
        if (toast && !toast.timer && toast.config.duration > 0) {
            toast.startTime = Date.now();
            this.setTimer(toast);
        }
    }
    
    /**
     * 🗑️ Usuń powiadomienie
     */
    remove(toastId) {
        const toastIndex = this.toasts.findIndex(t => t.id === toastId);
        if (toastIndex === -1) return;
        
        const toast = this.toasts[toastIndex];
        
        // Wyczyść timer
        if (toast.timer) {
            clearTimeout(toast.timer);
        }
        
        // Animacja wyjścia
        toast.element.classList.add('exiting');
        
        setTimeout(() => {
            // Usuń element
            if (toast.element.parentNode) {
                toast.element.parentNode.removeChild(toast.element);
            }
            
            // Usuń z listy
            this.toasts.splice(toastIndex, 1);
            
            // Uruchom callback
            if (toast.config.onClose) {
                toast.config.onClose(toastId);
            }
            
            // Przetwórz kolejkę
            this.processQueue();
            
        }, this.animationDuration);
    }
    
    /**
     * 📋 Przetwórz kolejkę oczekujących
     */
    processQueue() {
        if (this.queue.length > 0 && this.toasts.length < this.maxToasts) {
            const next = this.queue.shift();
            this.show(next.config);
        }
    }
    
    /**
     * 🧹 Wyczyść wszystkie powiadomienia
     */
    clear() {
        this.toasts.forEach(toast => {
            this.remove(toast.id);
        });
        this.queue = [];
    }
    
    /**
     * 🔄 Zaktualizuj powiadomienie
     */
    update(toastId, options) {
        const toast = this.toasts.find(t => t.id === toastId);
        if (!toast) return false;
        
        // Aktualizuj konfigurację
        Object.assign(toast.config, options);
        
        // Odbuduj element
        const newElement = this.createToastElement(toastId, toast.config);
        toast.element.parentNode.replaceChild(newElement, toast.element);
        toast.element = newElement;
        
        // Resetuj timer jeśli zmieniono duration
        if (options.duration !== undefined) {
            if (toast.timer) {
                clearTimeout(toast.timer);
            }
            
            if (toast.config.duration > 0) {
                toast.startTime = Date.now();
                toast.pausedTime = 0;
                this.setTimer(toast);
            }
        }
        
        return true;
    }
    
    /**
     * 📍 Zmień pozycję kontenerów
     */
    setPosition(position) {
        if (this.positions[position]) {
            this.container.className = `mas-toast-container ${position}`;
            this.currentPosition = position;
        }
    }
    
    /**
     * ⚙️ Skonfiguruj ustawienia
     */
    configure(options) {
        if (options.maxToasts !== undefined) {
            this.maxToasts = options.maxToasts;
        }
        
        if (options.defaultDuration !== undefined) {
            this.defaultDuration = options.defaultDuration;
        }
        
        if (options.position !== undefined) {
            this.setPosition(options.position);
        }
    }
    
    // 🎯 Metody pomocnicze dla różnych typów
    
    success(message, options = {}) {
        return this.show({
            type: this.types.SUCCESS,
            message: message,
            ...options
        });
    }
    
    error(message, options = {}) {
        return this.show({
            type: this.types.ERROR,
            message: message,
            duration: 7000, // Dłużej dla błędów
            ...options
        });
    }
    
    warning(message, options = {}) {
        return this.show({
            type: this.types.WARNING,
            message: message,
            ...options
        });
    }
    
    info(message, options = {}) {
        return this.show({
            type: this.types.INFO,
            message: message,
            ...options
        });
    }
    
    loading(message, options = {}) {
        return this.show({
            type: this.types.LOADING,
            message: message,
            duration: 0, // Nie usuwaj automatycznie
            closable: false,
            showProgress: false,
            ...options
        });
    }
    
    /**
     * 📊 Pobierz statystyki
     */
    getStats() {
        return {
            active_toasts: this.toasts.length,
            queued_toasts: this.queue.length,
            max_toasts: this.maxToasts,
            current_position: this.currentPosition,
            default_duration: this.defaultDuration
        };
    }
}

// 🚀 Inicjalizacja po załadowaniu DOM
document.addEventListener('DOMContentLoaded', () => {
    new MASToastNotifications();
});

// 🌐 Export dla modułów
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MASToastNotifications;
} 