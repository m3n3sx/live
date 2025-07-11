/**
 * WOOW! Service Worker Registration
 * Handles service worker registration and communication
 * 
 * @package ModernAdminStyler
 * @version 4.0.0 - Performance Optimized
 */

(function() {
    'use strict';

    // Service Worker Registration and Management
    const WOOWServiceWorker = {
        registration: null,
        isSupported: 'serviceWorker' in navigator,
        
        /**
         * Initialize Service Worker
         */
        init: function() {
            if (!this.isSupported) {
                console.log('🚫 Service Worker not supported');
                return;
            }
            
            // Register when page loads
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.register());
            } else {
                this.register();
            }
        },
        
        /**
         * Register Service Worker
         */
        register: function() {
            const swPath = this.getServiceWorkerPath();
            
            navigator.serviceWorker.register(swPath)
                .then((registration) => {
                    this.registration = registration;
                    this.setupEventListeners(registration);
                    console.log('🚀 WOOW Service Worker registered:', registration.scope);
                    
                    // Check for updates
                    this.checkForUpdates(registration);
                })
                .catch((error) => {
                    console.error('❌ WOOW Service Worker registration failed:', error);
                });
        },
        
        /**
         * Get Service Worker path
         */
        getServiceWorkerPath: function() {
            const isProduction = typeof woowV2Global !== 'undefined' && woowV2Global.isProduction;
            const suffix = isProduction ? '.min' : '';
            const dir = isProduction ? 'dist/' : '';
            
            return `${woowV2Global?.pluginUrl || ''}assets/js/${dir}woow-service-worker${suffix}.js`;
        },
        
        /**
         * Setup event listeners for Service Worker
         */
        setupEventListeners: function(registration) {
            // Listen for Service Worker updates
            registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                
                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed') {
                        if (navigator.serviceWorker.controller) {
                            // New version available
                            this.showUpdateNotification();
                        }
                    }
                });
            });
            
            // Listen for messages from Service Worker
            navigator.serviceWorker.addEventListener('message', (event) => {
                this.handleServiceWorkerMessage(event);
            });
            
            // Listen for controller change
            navigator.serviceWorker.addEventListener('controllerchange', () => {
                console.log('🔄 Service Worker controller changed');
                window.location.reload();
            });
        },
        
        /**
         * Handle messages from Service Worker
         */
        handleServiceWorkerMessage: function(event) {
            const { type, data } = event.data;
            
            switch (type) {
                case 'SW_ACTIVATED':
                    console.log('✅ Service Worker activated');
                    this.notifyActivation();
                    break;
                    
                case 'CACHE_STATS':
                    console.log('📊 Cache stats:', data);
                    break;
                    
                case 'HIGH_MEMORY_USAGE':
                    console.warn('⚠️ High memory usage detected:', data);
                    break;
                    
                default:
                    console.log('📨 Service Worker message:', event.data);
            }
        },
        
        /**
         * Check for Service Worker updates
         */
        checkForUpdates: function(registration) {
            // Check for updates every 30 minutes
            setInterval(() => {
                registration.update();
            }, 30 * 60 * 1000);
        },
        
        /**
         * Show update notification
         */
        showUpdateNotification: function() {
            if (window.WOOW && window.WOOW.loader) {
                window.WOOW.loader.load('notifications').then((notifications) => {
                    notifications.show({
                        type: 'info',
                        title: 'Update Available',
                        message: 'A new version is available. Refresh to update.',
                        actions: [
                            {
                                text: 'Refresh',
                                action: () => window.location.reload()
                            },
                            {
                                text: 'Later',
                                action: () => {}
                            }
                        ]
                    });
                });
            }
        },
        
        /**
         * Notify about Service Worker activation
         */
        notifyActivation: function() {
            if (window.WOOW && window.WOOW.events) {
                window.WOOW.events.dispatchEvent(new CustomEvent('serviceWorkerActivated'));
            }
        },
        
        /**
         * Get cache statistics
         */
        getCacheStats: function() {
            return new Promise((resolve) => {
                if (!this.registration) {
                    resolve(null);
                    return;
                }
                
                const messageChannel = new MessageChannel();
                messageChannel.port1.onmessage = (event) => {
                    resolve(event.data.data);
                };
                
                this.registration.active.postMessage({
                    type: 'GET_CACHE_STATS'
                }, [messageChannel.port2]);
            });
        },
        
        /**
         * Clear cache
         */
        clearCache: function() {
            return new Promise((resolve) => {
                if (!this.registration) {
                    resolve(false);
                    return;
                }
                
                const messageChannel = new MessageChannel();
                messageChannel.port1.onmessage = (event) => {
                    resolve(event.data.success);
                };
                
                this.registration.active.postMessage({
                    type: 'CLEAR_CACHE'
                }, [messageChannel.port2]);
            });
        },
        
        /**
         * Preload resources
         */
        preloadResources: function(resources) {
            return new Promise((resolve) => {
                if (!this.registration) {
                    resolve(false);
                    return;
                }
                
                const messageChannel = new MessageChannel();
                messageChannel.port1.onmessage = (event) => {
                    resolve(event.data.success);
                };
                
                this.registration.active.postMessage({
                    type: 'PRELOAD_RESOURCES',
                    data: { resources }
                }, [messageChannel.port2]);
            });
        }
    };
    
    // Auto-initialize
    WOOWServiceWorker.init();
    
    // Make available globally
    window.WOOWServiceWorker = WOOWServiceWorker;
    
    // Add to WOOW namespace if available
    if (window.WOOW) {
        window.WOOW.serviceWorker = WOOWServiceWorker;
    }
    
})(); 