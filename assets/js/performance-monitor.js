/**
 * WOOW! Real-time Performance Monitor
 * Tracks optimization metrics and provides insights
 * 
 * @package ModernAdminStyler
 * @version 4.0.0 - Performance Optimized
 */

class WoowPerformanceMonitor {
    constructor() {
        this.metrics = {
            loadTime: 0,
            memoryUsage: 0,
            bundleSize: 0,
            cacheHits: 0,
            cacheMisses: 0,
            serviceWorkerActive: false,
            criticalCSSLoaded: false,
            lazyLoadedModules: 0,
            totalRequests: 0,
            compressedRequests: 0
        };
        
        this.targets = {
            maxLoadTime: 1500, // 1.5s
            maxMemoryUsage: 15 * 1024 * 1024, // 15MB
            maxBundleSize: 200 * 1024, // 200KB
            minCacheHitRate: 80, // 80%
            minCompressionRatio: 30 // 30%
        };
        
        this.startTime = performance.now();
        this.observers = [];
        
        this.init();
    }
    
    /**
     * Initialize performance monitoring
     */
    init() {
        // Start monitoring immediately
        this.startMonitoring();
        
        // Set up periodic monitoring
        setInterval(() => this.updateMetrics(), 1000);
        
        // Monitor DOM ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.onDOMReady());
        } else {
            this.onDOMReady();
        }
        
        // Monitor window load
        if (document.readyState === 'complete') {
            this.onWindowLoad();
        } else {
            window.addEventListener('load', () => this.onWindowLoad());
        }
        
        // Monitor Service Worker
        this.monitorServiceWorker();
        
        // Monitor navigation
        this.monitorNavigation();
        
        // Create performance dashboard
        this.createPerformanceDashboard();
    }
    
    /**
     * Start monitoring performance metrics
     */
    startMonitoring() {
        console.log('🚀 WOOW Performance Monitor started');
        
        // Monitor resource loading
        this.monitorResourceLoading();
        
        // Monitor memory usage
        this.monitorMemoryUsage();
        
        // Monitor cache performance
        this.monitorCachePerformance();
        
        // Monitor bundle loading
        this.monitorBundleLoading();
    }
    
    /**
     * Monitor resource loading
     */
    monitorResourceLoading() {
        if ('PerformanceObserver' in window) {
            const observer = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                entries.forEach(entry => {
                    if (entry.initiatorType === 'link' || entry.initiatorType === 'script') {
                        this.metrics.totalRequests++;
                        
                        // Check if resource was compressed
                        if (entry.transferSize < entry.decodedBodySize) {
                            this.metrics.compressedRequests++;
                        }
                        
                        // Log slow resources
                        if (entry.duration > 500) {
                            console.warn(`🐌 Slow resource: ${entry.name} (${entry.duration}ms)`);
                        }
                    }
                });
            });
            
            observer.observe({ entryTypes: ['resource'] });
            this.observers.push(observer);
        }
    }
    
    /**
     * Monitor memory usage
     */
    monitorMemoryUsage() {
        if ('memory' in performance) {
            const updateMemory = () => {
                this.metrics.memoryUsage = performance.memory.usedJSHeapSize;
                
                // Alert if memory usage is high
                if (this.metrics.memoryUsage > this.targets.maxMemoryUsage * 0.9) {
                    console.warn('🧠 High memory usage detected:', this.formatBytes(this.metrics.memoryUsage));
                }
            };
            
            updateMemory();
            setInterval(updateMemory, 5000);
        }
    }
    
    /**
     * Monitor cache performance
     */
    monitorCachePerformance() {
        // Override fetch to monitor cache hits/misses
        const originalFetch = window.fetch;
        let cacheHits = 0;
        let cacheMisses = 0;
        
        window.fetch = async function(...args) {
            const response = await originalFetch.apply(this, args);
            
            if (response.headers.get('x-cache')) {
                cacheHits++;
            } else {
                cacheMisses++;
            }
            
            return response;
        };
        
        // Update metrics periodically
        setInterval(() => {
            this.metrics.cacheHits = cacheHits;
            this.metrics.cacheMisses = cacheMisses;
        }, 1000);
    }
    
    /**
     * Monitor bundle loading
     */
    monitorBundleLoading() {
        const bundleFiles = [
            'woow-core.min.css',
            'woow-features.min.css',
            'woow-core.min.js',
            'unified-settings-manager.min.js'
        ];
        
        let bundleSize = 0;
        
        bundleFiles.forEach(file => {
            const elements = document.querySelectorAll(`[src*="${file}"], [href*="${file}"]`);
            elements.forEach(element => {
                if (element.complete || element.readyState === 'complete') {
                    // Estimate bundle size (approximate)
                    bundleSize += this.estimateResourceSize(element);
                }
            });
        });
        
        this.metrics.bundleSize = bundleSize;
    }
    
    /**
     * Monitor Service Worker
     */
    monitorServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistration().then(registration => {
                if (registration) {
                    this.metrics.serviceWorkerActive = true;
                    console.log('✅ Service Worker active');
                } else {
                    console.log('❌ Service Worker not found');
                }
            });
        }
    }
    
    /**
     * Monitor navigation performance
     */
    monitorNavigation() {
        if ('navigation' in performance) {
            const navTiming = performance.navigation;
            const timing = performance.timing;
            
            // Calculate load time
            this.metrics.loadTime = timing.loadEventEnd - timing.navigationStart;
            
            // Log navigation type
            if (navTiming.type === 1) {
                console.log('🔄 Page reloaded');
            } else if (navTiming.type === 2) {
                console.log('⬅️ Back/Forward navigation');
            }
        }
    }
    
    /**
     * Handle DOM ready event
     */
    onDOMReady() {
        const domReadyTime = performance.now() - this.startTime;
        console.log(`📄 DOM ready in ${domReadyTime.toFixed(2)}ms`);
        
        // Check for critical CSS
        const criticalCSS = document.querySelector('style[data-woow-critical]');
        if (criticalCSS) {
            this.metrics.criticalCSSLoaded = true;
            console.log('⚡ Critical CSS loaded');
        }
        
        // Monitor lazy loading
        this.monitorLazyLoading();
    }
    
    /**
     * Handle window load event
     */
    onWindowLoad() {
        const totalLoadTime = performance.now() - this.startTime;
        this.metrics.loadTime = totalLoadTime;
        
        console.log(`🎯 Total load time: ${totalLoadTime.toFixed(2)}ms`);
        
        // Performance analysis
        this.analyzePerformance();
        
        // Update dashboard
        this.updateDashboard();
    }
    
    /**
     * Monitor lazy loading
     */
    monitorLazyLoading() {
        // Track WOOW module loading
        if (window.WOOW && window.WOOW.loadModule) {
            const originalLoadModule = window.WOOW.loadModule;
            
            window.WOOW.loadModule = (moduleName, callback) => {
                const startTime = performance.now();
                
                return originalLoadModule.call(window.WOOW, moduleName, (...args) => {
                    const loadTime = performance.now() - startTime;
                    this.metrics.lazyLoadedModules++;
                    
                    console.log(`📦 Lazy loaded module: ${moduleName} (${loadTime.toFixed(2)}ms)`);
                    
                    if (callback) callback.apply(this, args);
                });
            };
        }
    }
    
    /**
     * Update metrics
     */
    updateMetrics() {
        // Update memory usage
        if ('memory' in performance) {
            this.metrics.memoryUsage = performance.memory.usedJSHeapSize;
        }
        
        // Update load time
        if (this.metrics.loadTime === 0) {
            this.metrics.loadTime = performance.now() - this.startTime;
        }
        
        // Update dashboard if visible
        if (this.dashboard && this.dashboard.style.display !== 'none') {
            this.updateDashboard();
        }
    }
    
    /**
     * Analyze performance
     */
    analyzePerformance() {
        const issues = [];
        const achievements = [];
        
        // Check load time
        if (this.metrics.loadTime > this.targets.maxLoadTime) {
            issues.push(`Load time: ${this.metrics.loadTime.toFixed(2)}ms (target: ${this.targets.maxLoadTime}ms)`);
        } else {
            achievements.push(`Fast load time: ${this.metrics.loadTime.toFixed(2)}ms`);
        }
        
        // Check memory usage
        if (this.metrics.memoryUsage > this.targets.maxMemoryUsage) {
            issues.push(`Memory usage: ${this.formatBytes(this.metrics.memoryUsage)} (target: ${this.formatBytes(this.targets.maxMemoryUsage)})`);
        } else {
            achievements.push(`Efficient memory usage: ${this.formatBytes(this.metrics.memoryUsage)}`);
        }
        
        // Check cache hit rate
        const totalCacheRequests = this.metrics.cacheHits + this.metrics.cacheMisses;
        if (totalCacheRequests > 0) {
            const cacheHitRate = (this.metrics.cacheHits / totalCacheRequests) * 100;
            if (cacheHitRate < this.targets.minCacheHitRate) {
                issues.push(`Cache hit rate: ${cacheHitRate.toFixed(1)}% (target: ${this.targets.minCacheHitRate}%)`);
            } else {
                achievements.push(`Excellent cache hit rate: ${cacheHitRate.toFixed(1)}%`);
            }
        }
        
        // Check compression ratio
        if (this.metrics.totalRequests > 0) {
            const compressionRatio = (this.metrics.compressedRequests / this.metrics.totalRequests) * 100;
            if (compressionRatio < this.targets.minCompressionRatio) {
                issues.push(`Compression ratio: ${compressionRatio.toFixed(1)}% (target: ${this.targets.minCompressionRatio}%)`);
            } else {
                achievements.push(`Good compression ratio: ${compressionRatio.toFixed(1)}%`);
            }
        }
        
        // Log results
        if (achievements.length > 0) {
            console.log('🏆 Performance achievements:');
            achievements.forEach(achievement => console.log(`  ✅ ${achievement}`));
        }
        
        if (issues.length > 0) {
            console.log('⚠️ Performance issues:');
            issues.forEach(issue => console.log(`  ❌ ${issue}`));
        } else {
            console.log('🎉 All performance targets met!');
        }
    }
    
    /**
     * Create performance dashboard
     */
    createPerformanceDashboard() {
        // Only create dashboard for admin users
        if (!document.body.classList.contains('wp-admin')) {
            return;
        }
        
        this.dashboard = document.createElement('div');
        this.dashboard.id = 'woow-performance-dashboard';
        this.dashboard.innerHTML = `
            <div class="woow-perf-header">
                <h3>🚀 WOOW Performance</h3>
                <button class="woow-perf-toggle" onclick="this.parentElement.parentElement.classList.toggle('collapsed')">_</button>
            </div>
            <div class="woow-perf-content">
                <div class="woow-perf-metrics">
                    <div class="woow-perf-metric">
                        <label>Load Time</label>
                        <span class="woow-perf-value" id="woow-load-time">-</span>
                    </div>
                    <div class="woow-perf-metric">
                        <label>Memory</label>
                        <span class="woow-perf-value" id="woow-memory">-</span>
                    </div>
                    <div class="woow-perf-metric">
                        <label>Cache Hit Rate</label>
                        <span class="woow-perf-value" id="woow-cache-rate">-</span>
                    </div>
                    <div class="woow-perf-metric">
                        <label>Lazy Modules</label>
                        <span class="woow-perf-value" id="woow-lazy-modules">-</span>
                    </div>
                </div>
                <div class="woow-perf-status">
                    <div class="woow-perf-indicator" id="woow-perf-indicator">
                        <span class="woow-perf-dot"></span>
                        <span id="woow-perf-status">Analyzing...</span>
                    </div>
                </div>
            </div>
        `;
        
        // Add CSS
        const style = document.createElement('style');
        style.textContent = `
            #woow-performance-dashboard {
                position: fixed;
                top: 32px;
                right: 20px;
                width: 280px;
                background: #fff;
                border: 1px solid #ccd0d4;
                border-radius: 4px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                z-index: 99999;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                font-size: 13px;
                transition: all 0.3s ease;
            }
            
            #woow-performance-dashboard.collapsed .woow-perf-content {
                display: none;
            }
            
            .woow-perf-header {
                background: #2271b1;
                color: white;
                padding: 8px 12px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                cursor: pointer;
            }
            
            .woow-perf-header h3 {
                margin: 0;
                font-size: 14px;
                font-weight: 600;
            }
            
            .woow-perf-toggle {
                background: none;
                border: none;
                color: white;
                font-size: 16px;
                cursor: pointer;
                padding: 0;
                width: 20px;
                height: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .woow-perf-content {
                padding: 12px;
            }
            
            .woow-perf-metrics {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 8px;
                margin-bottom: 12px;
            }
            
            .woow-perf-metric {
                display: flex;
                flex-direction: column;
                align-items: center;
                padding: 8px;
                background: #f8f9fa;
                border-radius: 3px;
            }
            
            .woow-perf-metric label {
                font-size: 11px;
                color: #666;
                margin-bottom: 2px;
            }
            
            .woow-perf-value {
                font-weight: 600;
                font-size: 12px;
                color: #2271b1;
            }
            
            .woow-perf-status {
                border-top: 1px solid #f0f0f1;
                padding-top: 8px;
            }
            
            .woow-perf-indicator {
                display: flex;
                align-items: center;
                gap: 6px;
            }
            
            .woow-perf-dot {
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background: #00a32a;
                animation: pulse 2s infinite;
            }
            
            .woow-perf-dot.warning {
                background: #dba617;
            }
            
            .woow-perf-dot.error {
                background: #d63638;
            }
            
            @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.5; }
            }
        `;
        
        document.head.appendChild(style);
        document.body.appendChild(this.dashboard);
        
        // Make dashboard draggable
        this.makeDraggable();
    }
    
    /**
     * Update dashboard
     */
    updateDashboard() {
        if (!this.dashboard) return;
        
        // Update load time
        const loadTimeEl = document.getElementById('woow-load-time');
        if (loadTimeEl) {
            loadTimeEl.textContent = this.metrics.loadTime ? `${this.metrics.loadTime.toFixed(0)}ms` : '-';
        }
        
        // Update memory
        const memoryEl = document.getElementById('woow-memory');
        if (memoryEl) {
            memoryEl.textContent = this.metrics.memoryUsage ? this.formatBytes(this.metrics.memoryUsage) : '-';
        }
        
        // Update cache hit rate
        const cacheRateEl = document.getElementById('woow-cache-rate');
        if (cacheRateEl) {
            const totalRequests = this.metrics.cacheHits + this.metrics.cacheMisses;
            if (totalRequests > 0) {
                const rate = (this.metrics.cacheHits / totalRequests * 100).toFixed(1);
                cacheRateEl.textContent = `${rate}%`;
            } else {
                cacheRateEl.textContent = '-';
            }
        }
        
        // Update lazy modules
        const lazyModulesEl = document.getElementById('woow-lazy-modules');
        if (lazyModulesEl) {
            lazyModulesEl.textContent = this.metrics.lazyLoadedModules.toString();
        }
        
        // Update status
        this.updateStatus();
    }
    
    /**
     * Update status indicator
     */
    updateStatus() {
        const statusEl = document.getElementById('woow-perf-status');
        const dotEl = document.querySelector('.woow-perf-dot');
        
        if (!statusEl || !dotEl) return;
        
        let status = 'Excellent';
        let dotClass = '';
        
        // Check performance issues
        if (this.metrics.loadTime > this.targets.maxLoadTime) {
            status = 'Slow Load';
            dotClass = 'error';
        } else if (this.metrics.memoryUsage > this.targets.maxMemoryUsage) {
            status = 'High Memory';
            dotClass = 'warning';
        } else if (this.metrics.loadTime > this.targets.maxLoadTime * 0.8) {
            status = 'Good';
            dotClass = 'warning';
        }
        
        statusEl.textContent = status;
        dotEl.className = 'woow-perf-dot ' + dotClass;
    }
    
    /**
     * Make dashboard draggable
     */
    makeDraggable() {
        const header = this.dashboard.querySelector('.woow-perf-header');
        let isDragging = false;
        let startX, startY, startLeft, startTop;
        
        header.addEventListener('mousedown', (e) => {
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            startLeft = this.dashboard.offsetLeft;
            startTop = this.dashboard.offsetTop;
            
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        });
        
        const onMouseMove = (e) => {
            if (!isDragging) return;
            
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;
            
            this.dashboard.style.left = (startLeft + deltaX) + 'px';
            this.dashboard.style.top = (startTop + deltaY) + 'px';
            this.dashboard.style.right = 'auto';
        };
        
        const onMouseUp = () => {
            isDragging = false;
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };
    }
    
    /**
     * Estimate resource size
     */
    estimateResourceSize(element) {
        // Rough estimation based on element type
        if (element.tagName === 'LINK') {
            return 15000; // ~15KB for CSS
        } else if (element.tagName === 'SCRIPT') {
            return 25000; // ~25KB for JS
        }
        return 0;
    }
    
    /**
     * Format bytes to human readable format
     */
    formatBytes(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }
    
    /**
     * Get performance report
     */
    getReport() {
        return {
            metrics: this.metrics,
            targets: this.targets,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href
        };
    }
    
    /**
     * Export performance data
     */
    exportData() {
        const report = this.getReport();
        const dataStr = JSON.stringify(report, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `woow-performance-${Date.now()}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    }
    
    /**
     * Cleanup
     */
    destroy() {
        this.observers.forEach(observer => observer.disconnect());
        if (this.dashboard) {
            this.dashboard.remove();
        }
    }
}

// Initialize performance monitor
if (typeof window !== 'undefined') {
    window.WoowPerformanceMonitor = WoowPerformanceMonitor;
    
    // Auto-initialize for WordPress admin
    if (document.body && document.body.classList.contains('wp-admin')) {
        window.woowPerfMonitor = new WoowPerformanceMonitor();
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WoowPerformanceMonitor;
} 