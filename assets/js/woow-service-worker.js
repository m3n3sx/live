/**
 * WOOW! Service Worker - Aggressive Caching & Performance
 * Implements intelligent caching strategies for optimal performance
 * 
 * @package ModernAdminStyler
 * @version 4.0.0 - Performance Optimized
 */

const CACHE_NAME = 'woow-v4.0.0';
const CACHE_STRATEGY_VERSION = '1.0.0';

// Cache strategies
const CACHE_STRATEGIES = {
    CACHE_FIRST: 'cache-first',
    NETWORK_FIRST: 'network-first',
    STALE_WHILE_REVALIDATE: 'stale-while-revalidate',
    NETWORK_ONLY: 'network-only',
    CACHE_ONLY: 'cache-only'
};

// Asset categorization for optimal caching
const ASSET_PATTERNS = {
    // Static assets - long term cache
    static: {
        pattern: /\.(css|js|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/,
        strategy: CACHE_STRATEGIES.CACHE_FIRST,
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        maxEntries: 100
    },
    
    // API calls - network first with cache fallback
    api: {
        pattern: /\/wp-json\/|\/admin-ajax\.php/,
        strategy: CACHE_STRATEGIES.NETWORK_FIRST,
        maxAge: 5 * 60 * 1000, // 5 minutes
        maxEntries: 50
    },
    
    // HTML pages - stale while revalidate
    pages: {
        pattern: /\.php$|\/wp-admin/,
        strategy: CACHE_STRATEGIES.STALE_WHILE_REVALIDATE,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        maxEntries: 20
    },
    
    // Dynamic content - network only
    dynamic: {
        pattern: /\/wp-admin\/.*\.php\?/,
        strategy: CACHE_STRATEGIES.NETWORK_ONLY,
        maxAge: 0,
        maxEntries: 0
    }
};

// Performance metrics
let performanceMetrics = {
    cacheHits: 0,
    cacheMisses: 0,
    networkRequests: 0,
    backgroundSyncs: 0,
    startTime: Date.now()
};

// ========================================================================
// 🚀 SERVICE WORKER LIFECYCLE
// ========================================================================

self.addEventListener('install', (event) => {
    console.log('🔧 WOOW Service Worker installing...');
    
    event.waitUntil(
        (async () => {
            try {
                const cache = await caches.open(CACHE_NAME);
                
                // Pre-cache critical assets
                const criticalAssets = [
                    'assets/css/woow-core.css',
                    'assets/js/woow-core.js',
                    'assets/js/unified-settings-manager.js'
                ];
                
                await cache.addAll(criticalAssets.map(asset => 
                    new Request(asset, { cache: 'reload' })
                ));
                
                console.log('✅ Critical assets pre-cached');
                
                // Skip waiting to activate immediately
                self.skipWaiting();
                
            } catch (error) {
                console.error('❌ Service Worker installation failed:', error);
            }
        })()
    );
});

self.addEventListener('activate', (event) => {
    console.log('🎯 WOOW Service Worker activating...');
    
    event.waitUntil(
        (async () => {
            try {
                // Clean up old caches
                const cacheNames = await caches.keys();
                const deletionPromises = cacheNames
                    .filter(cacheName => cacheName !== CACHE_NAME)
                    .map(cacheName => {
                        console.log(`🗑️ Deleting old cache: ${cacheName}`);
                        return caches.delete(cacheName);
                    });
                
                await Promise.all(deletionPromises);
                
                // Claim all clients
                await self.clients.claim();
                
                console.log('✅ Service Worker activated and ready');
                
                // Notify clients of activation
                self.clients.matchAll().then(clients => {
                    clients.forEach(client => {
                        client.postMessage({
                            type: 'SW_ACTIVATED',
                            timestamp: Date.now()
                        });
                    });
                });
                
            } catch (error) {
                console.error('❌ Service Worker activation failed:', error);
            }
        })()
    );
});

// ========================================================================
// 🌐 FETCH HANDLING & CACHING STRATEGIES
// ========================================================================

self.addEventListener('fetch', (event) => {
    // Only handle GET requests
    if (event.request.method !== 'GET') {
        return;
    }
    
    // Skip cross-origin requests
    if (!event.request.url.startsWith(self.location.origin)) {
        return;
    }
    
    // Determine caching strategy
    const strategy = getCachingStrategy(event.request.url);
    
    event.respondWith(
        handleFetchWithStrategy(event.request, strategy)
    );
});

// ========================================================================
// 🎯 CACHING STRATEGY IMPLEMENTATION
// ========================================================================

function getCachingStrategy(url) {
    for (const [name, config] of Object.entries(ASSET_PATTERNS)) {
        if (config.pattern.test(url)) {
            return config;
        }
    }
    
    // Default strategy
    return ASSET_PATTERNS.static;
}

async function handleFetchWithStrategy(request, strategy) {
    performanceMetrics.networkRequests++;
    
    switch (strategy.strategy) {
        case CACHE_STRATEGIES.CACHE_FIRST:
            return cacheFirst(request, strategy);
            
        case CACHE_STRATEGIES.NETWORK_FIRST:
            return networkFirst(request, strategy);
            
        case CACHE_STRATEGIES.STALE_WHILE_REVALIDATE:
            return staleWhileRevalidate(request, strategy);
            
        case CACHE_STRATEGIES.NETWORK_ONLY:
            return networkOnly(request);
            
        case CACHE_STRATEGIES.CACHE_ONLY:
            return cacheOnly(request);
            
        default:
            return fetch(request);
    }
}

// Cache First Strategy
async function cacheFirst(request, strategy) {
    try {
        const cache = await caches.open(CACHE_NAME);
        const cachedResponse = await cache.match(request);
        
        if (cachedResponse && !isExpired(cachedResponse, strategy.maxAge)) {
            performanceMetrics.cacheHits++;
            return cachedResponse;
        }
        
        performanceMetrics.cacheMisses++;
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            await cache.put(request, networkResponse.clone());
            cleanupCache(cache, strategy.maxEntries);
        }
        
        return networkResponse;
        
    } catch (error) {
        console.error('Cache first strategy failed:', error);
        
        // Try cache as fallback
        const cache = await caches.open(CACHE_NAME);
        const cachedResponse = await cache.match(request);
        
        if (cachedResponse) {
            return cachedResponse;
        }
        
        throw error;
    }
}

// Network First Strategy
async function networkFirst(request, strategy) {
    try {
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            const cache = await caches.open(CACHE_NAME);
            await cache.put(request, networkResponse.clone());
            cleanupCache(cache, strategy.maxEntries);
        }
        
        return networkResponse;
        
    } catch (error) {
        console.warn('Network failed, trying cache:', error);
        
        const cache = await caches.open(CACHE_NAME);
        const cachedResponse = await cache.match(request);
        
        if (cachedResponse && !isExpired(cachedResponse, strategy.maxAge)) {
            performanceMetrics.cacheHits++;
            return cachedResponse;
        }
        
        throw error;
    }
}

// Stale While Revalidate Strategy
async function staleWhileRevalidate(request, strategy) {
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    // Start network request in background
    const networkResponsePromise = fetch(request).then(response => {
        if (response.ok) {
            cache.put(request, response.clone());
            cleanupCache(cache, strategy.maxEntries);
        }
        return response;
    }).catch(error => {
        console.warn('Background revalidation failed:', error);
    });
    
    // Return cached response immediately if available
    if (cachedResponse) {
        performanceMetrics.cacheHits++;
        
        // Don't await the network request
        networkResponsePromise;
        
        return cachedResponse;
    }
    
    // No cached response, wait for network
    performanceMetrics.cacheMisses++;
    return networkResponsePromise;
}

// Network Only Strategy
async function networkOnly(request) {
    return fetch(request);
}

// Cache Only Strategy
async function cacheOnly(request) {
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
        performanceMetrics.cacheHits++;
        return cachedResponse;
    }
    
    throw new Error('No cached response available');
}

// ========================================================================
// 🧹 CACHE MANAGEMENT
// ========================================================================

function isExpired(response, maxAge) {
    if (!maxAge) return false;
    
    const dateHeader = response.headers.get('date');
    if (!dateHeader) return false;
    
    const responseDate = new Date(dateHeader);
    const now = new Date();
    
    return (now.getTime() - responseDate.getTime()) > maxAge;
}

async function cleanupCache(cache, maxEntries) {
    if (!maxEntries) return;
    
    const keys = await cache.keys();
    
    if (keys.length > maxEntries) {
        // Remove oldest entries
        const entriesToDelete = keys.length - maxEntries;
        const keysToDelete = keys.slice(0, entriesToDelete);
        
        await Promise.all(
            keysToDelete.map(key => cache.delete(key))
        );
    }
}

// ========================================================================
// 📊 BACKGROUND SYNC & ANALYTICS
// ========================================================================

self.addEventListener('sync', (event) => {
    if (event.tag === 'background-sync') {
        event.waitUntil(performBackgroundSync());
    }
});

async function performBackgroundSync() {
    try {
        performanceMetrics.backgroundSyncs++;
        
        // Clean up expired cache entries
        const cache = await caches.open(CACHE_NAME);
        const keys = await cache.keys();
        
        for (const request of keys) {
            const response = await cache.match(request);
            const strategy = getCachingStrategy(request.url);
            
            if (response && isExpired(response, strategy.maxAge)) {
                await cache.delete(request);
            }
        }
        
        console.log('🧹 Background sync completed');
        
    } catch (error) {
        console.error('❌ Background sync failed:', error);
    }
}

// ========================================================================
// 📱 MESSAGE HANDLING
// ========================================================================

self.addEventListener('message', (event) => {
    const { type, data } = event.data;
    
    switch (type) {
        case 'GET_CACHE_STATS':
            event.ports[0].postMessage({
                type: 'CACHE_STATS',
                data: {
                    ...performanceMetrics,
                    uptime: Date.now() - performanceMetrics.startTime,
                    cacheName: CACHE_NAME
                }
            });
            break;
            
        case 'CLEAR_CACHE':
            clearCache().then(() => {
                event.ports[0].postMessage({
                    type: 'CACHE_CLEARED',
                    success: true
                });
            }).catch(error => {
                event.ports[0].postMessage({
                    type: 'CACHE_CLEARED',
                    success: false,
                    error: error.message
                });
            });
            break;
            
        case 'PRELOAD_RESOURCES':
            preloadResources(data.resources).then(() => {
                event.ports[0].postMessage({
                    type: 'RESOURCES_PRELOADED',
                    success: true
                });
            }).catch(error => {
                event.ports[0].postMessage({
                    type: 'RESOURCES_PRELOADED',
                    success: false,
                    error: error.message
                });
            });
            break;
    }
});

async function clearCache() {
    const cache = await caches.open(CACHE_NAME);
    const keys = await cache.keys();
    
    await Promise.all(
        keys.map(key => cache.delete(key))
    );
    
    // Reset metrics
    performanceMetrics = {
        cacheHits: 0,
        cacheMisses: 0,
        networkRequests: 0,
        backgroundSyncs: 0,
        startTime: Date.now()
    };
    
    console.log('🗑️ Cache cleared');
}

async function preloadResources(resources) {
    const cache = await caches.open(CACHE_NAME);
    
    const preloadPromises = resources.map(async (url) => {
        try {
            const response = await fetch(url);
            if (response.ok) {
                await cache.put(url, response);
            }
        } catch (error) {
            console.warn(`Failed to preload ${url}:`, error);
        }
    });
    
    await Promise.all(preloadPromises);
    console.log(`📦 Preloaded ${resources.length} resources`);
}

// ========================================================================
// 🔄 PERIODIC TASKS
// ========================================================================

// Register periodic background sync if supported
if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
    self.registration.sync.register('background-sync');
}

// Periodic cache cleanup (every 6 hours)
setInterval(() => {
    self.registration.sync.register('background-sync');
}, 6 * 60 * 60 * 1000);

// ========================================================================
// 📈 PERFORMANCE MONITORING
// ========================================================================

// Monitor fetch performance
self.addEventListener('fetch', (event) => {
    const startTime = performance.now();
    
    event.respondWith(
        event.respondWith.then ? 
        event.respondWith.then(response => {
            const endTime = performance.now();
            const duration = endTime - startTime;
            
            // Log slow requests
            if (duration > 1000) { // > 1 second
                console.warn(`🐌 Slow request detected: ${event.request.url} (${duration.toFixed(2)}ms)`);
            }
            
            return response;
        }) : 
        event.respondWith
    );
});

console.log('🚀 WOOW Service Worker loaded and ready for optimization!'); 