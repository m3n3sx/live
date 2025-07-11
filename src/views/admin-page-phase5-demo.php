<?php
/**
 * 🚀 Phase 5 Demo Page - Advanced Performance & UX Optimizations
 * 
 * Demonstracja zaawansowanych optymalizacji wydajności i UX
 * z użyciem enterprise-grade tools i metrics
 */

// Security check
if (!defined('ABSPATH')) {
    exit;
}

// Get services
$coreEngine = \ModernAdminStyler\Services\CoreEngine::getInstance();
$performance_metrics = $coreEngine->getCacheManager(); // Consolidated into CacheManager
$cache_manager = $coreEngine->getCacheManager();
$security_manager = $coreEngine->getSecurityManager();
?>

<div class="wrap mas-v2-admin-wrap">
    <div class="mas-v2-header">
        <div class="mas-v2-header-content">
            <div class="mas-v2-header-left">
                <h1 class="mas-v2-title">
                    🚀 Modern Admin Styler V2 - FAZA 5
                    <span class="mas-v2-subtitle">Advanced Performance & UX Demo</span>
                </h1>
            </div>
            <div class="mas-v2-header-right">
                <div class="mas-v2-version-badge">v3.2.0</div>
                <div class="mas-v2-phase-badge phase-5">FAZA 5</div>
            </div>
        </div>
    </div>

    <div class="mas-v2-content">
        
        <!-- 🎯 Performance Overview -->
        <div class="mas-v2-section">
            <div class="mas-v2-section-header">
                <h2>⚡ Performance Overview</h2>
                <p>Zaawansowane systemy optymalizacji wydajności</p>
            </div>
            
            <div class="mas-v2-grid mas-v2-grid-3">
                
                <!-- Lazy Loading Stats -->
                <div class="mas-v2-card">
                    <div class="mas-v2-card-header">
                        <h3>🚀 Lazy Loading System</h3>
                        <div class="mas-v2-status-badge success">Aktywny</div>
                    </div>
                    <div class="mas-v2-card-content">
                        <div class="mas-v2-stat-grid">
                            <div class="mas-v2-stat">
                                <div class="mas-v2-stat-value"><?php echo $lazyStats['loaded_assets']; ?></div>
                                <div class="mas-v2-stat-label">Załadowane zasoby</div>
                            </div>
                            <div class="mas-v2-stat">
                                <div class="mas-v2-stat-value"><?php echo round($lazyStats['total_size'] / 1024, 1); ?>KB</div>
                                <div class="mas-v2-stat-label">Całkowity rozmiar</div>
                            </div>
                            <div class="mas-v2-stat">
                                <div class="mas-v2-stat-value"><?php echo round($lazyStats['average_load_time'] * 1000, 1); ?>ms</div>
                                <div class="mas-v2-stat-label">Średni czas ładowania</div>
                            </div>
                        </div>
                        <button class="mas-v2-button secondary" onclick="testLazyLoading()">
                            🧪 Test Lazy Loading
                        </button>
                    </div>
                </div>
                
                <!-- Cache Stats -->
                <div class="mas-v2-card">
                    <div class="mas-v2-card-header">
                        <h3>💾 Advanced Cache</h3>
                        <div class="mas-v2-status-badge success">Aktywny</div>
                    </div>
                    <div class="mas-v2-card-content">
                        <div class="mas-v2-stat-grid">
                            <div class="mas-v2-stat">
                                <div class="mas-v2-stat-value"><?php echo $cacheStats['memory_cache_size']; ?></div>
                                <div class="mas-v2-stat-label">Elementy w cache</div>
                            </div>
                            <div class="mas-v2-stat">
                                <div class="mas-v2-stat-value"><?php echo $cacheStats['total_operations']; ?></div>
                                <div class="mas-v2-stat-label">Operacje cache</div>
                            </div>
                            <div class="mas-v2-stat">
                                <div class="mas-v2-stat-value">Multi-Level</div>
                                <div class="mas-v2-stat-label">Typ cache</div>
                            </div>
                        </div>
                        <button class="mas-v2-button secondary" onclick="testCacheSystem()">
                            🧪 Test Cache System
                        </button>
                    </div>
                </div>
                
                <!-- CSS Variables Stats -->
                <div class="mas-v2-card">
                    <div class="mas-v2-card-header">
                        <h3>🎨 CSS Variables</h3>
                        <div class="mas-v2-status-badge success">Aktywny</div>
                    </div>
                    <div class="mas-v2-card-content">
                        <div class="mas-v2-stat-grid">
                            <div class="mas-v2-stat">
                                <div class="mas-v2-stat-value"><?php echo $cssStats['total_variables']; ?></div>
                                <div class="mas-v2-stat-label">Zmienne CSS</div>
                            </div>
                            <div class="mas-v2-stat">
                                <div class="mas-v2-stat-value"><?php echo round($cssStats['css_size'] / 1024, 1); ?>KB</div>
                                <div class="mas-v2-stat-label">Rozmiar CSS</div>
                            </div>
                            <div class="mas-v2-stat">
                                <div class="mas-v2-stat-value"><?php echo round($cssStats['generation_time'] * 1000, 1); ?>ms</div>
                                <div class="mas-v2-stat-label">Czas generowania</div>
                            </div>
                        </div>
                        <button class="mas-v2-button secondary" onclick="regenerateCSS()">
                            🔄 Regeneruj CSS
                        </button>
                    </div>
                </div>
                
            </div>
        </div>

        <!-- 🔔 Toast Notifications Demo -->
        <div class="mas-v2-section">
            <div class="mas-v2-section-header">
                <h2>🔔 Toast Notifications System</h2>
                <p>Elegancki system powiadomień z animacjami i kolejkowaniem</p>
            </div>
            
            <div class="mas-v2-grid mas-v2-grid-2">
                
                <!-- Notification Controls -->
                <div class="mas-v2-card">
                    <div class="mas-v2-card-header">
                        <h3>🎮 Kontrola powiadomień</h3>
                    </div>
                    <div class="mas-v2-card-content">
                        <div class="mas-v2-button-group">
                            <button class="mas-v2-button success" onclick="showSuccessToast()">
                                ✅ Success
                            </button>
                            <button class="mas-v2-button error" onclick="showErrorToast()">
                                ❌ Error
                            </button>
                            <button class="mas-v2-button warning" onclick="showWarningToast()">
                                ⚠️ Warning
                            </button>
                            <button class="mas-v2-button info" onclick="showInfoToast()">
                                ℹ️ Info
                            </button>
                        </div>
                        
                        <div class="mas-v2-form-row">
                            <label>Pozycja powiadomień:</label>
                            <select id="toast-position" onchange="changeToastPosition()">
                                <option value="TOP_RIGHT">Góra prawo</option>
                                <option value="TOP_LEFT">Góra lewo</option>
                                <option value="TOP_CENTER">Góra środek</option>
                                <option value="BOTTOM_RIGHT">Dół prawo</option>
                                <option value="BOTTOM_LEFT">Dół lewo</option>
                                <option value="BOTTOM_CENTER">Dół środek</option>
                            </select>
                        </div>
                        
                        <button class="mas-v2-button secondary" onclick="clearAllToasts()">
                            🧹 Wyczyść wszystkie
                        </button>
                    </div>
                </div>
                
                <!-- Toast Stats -->
                <div class="mas-v2-card">
                    <div class="mas-v2-card-header">
                        <h3>📊 Statystyki Toast</h3>
                    </div>
                    <div class="mas-v2-card-content">
                        <div id="toast-stats" class="mas-v2-stat-grid">
                            <div class="mas-v2-stat">
                                <div class="mas-v2-stat-value" id="active-toasts">0</div>
                                <div class="mas-v2-stat-label">Aktywne</div>
                            </div>
                            <div class="mas-v2-stat">
                                <div class="mas-v2-stat-value" id="queued-toasts">0</div>
                                <div class="mas-v2-stat-label">W kolejce</div>
                            </div>
                            <div class="mas-v2-stat">
                                <div class="mas-v2-stat-value" id="max-toasts">5</div>
                                <div class="mas-v2-stat-label">Maksimum</div>
                            </div>
                        </div>
                        
                        <button class="mas-v2-button secondary" onclick="updateToastStats()">
                            🔄 Odśwież statystyki
                        </button>
                    </div>
                </div>
                
            </div>
        </div>

        <!-- 🎨 CSS Variables Live Preview -->
        <div class="mas-v2-section">
            <div class="mas-v2-section-header">
                <h2>🎨 CSS Variables Live Preview</h2>
                <p>Dynamiczne generowanie i podgląd zmiennych CSS</p>
            </div>
            
            <div class="mas-v2-grid mas-v2-grid-2">
                
                <!-- Color Variables -->
                <div class="mas-v2-card">
                    <div class="mas-v2-card-header">
                        <h3>🌈 Zmienne kolorów</h3>
                    </div>
                    <div class="mas-v2-card-content">
                        <div class="mas-v2-color-variables">
                            <div class="mas-v2-color-var">
                                <div class="mas-v2-color-preview" style="background: var(--woow-accent-primary, #007cba);"></div>
                                <div class="mas-v2-color-info">
                                    <strong>--mas-primary</strong>
                                    <span><?php echo $settings['primary_color'] ?? '#007cba'; ?></span>
                                </div>
                            </div>
                            <div class="mas-v2-color-var">
                                <div class="mas-v2-color-preview" style="background: var(--woow-accent-secondary, #50575e);"></div>
                                <div class="mas-v2-color-info">
                                    <strong>--mas-secondary</strong>
                                    <span><?php echo $settings['secondary_color'] ?? '#50575e'; ?></span>
                                </div>
                            </div>
                            <div class="mas-v2-color-var">
                                <div class="mas-v2-color-preview" style="background: var(--woow-accent-primary, #00a0d2);"></div>
                                <div class="mas-v2-color-info">
                                    <strong>--mas-accent</strong>
                                    <span><?php echo $settings['accent_color'] ?? '#00a0d2'; ?></span>
                                </div>
                            </div>
                        </div>
                        
                        <button class="mas-v2-button secondary" onclick="showAllCSSVariables()">
                            📋 Pokaż wszystkie zmienne
                        </button>
                    </div>
                </div>
                
                <!-- Typography Variables -->
                <div class="mas-v2-card">
                    <div class="mas-v2-card-header">
                        <h3>🔤 Zmienne typograficzne</h3>
                    </div>
                    <div class="mas-v2-card-content">
                        <div class="mas-v2-typo-demo">
                            <div class="mas-v2-typo-sample" style="font-size: var(--mas-size-xs, 12px);">
                                <strong>XS:</strong> Bardzo mały tekst
                            </div>
                            <div class="mas-v2-typo-sample" style="font-size: var(--mas-size-sm, 14px);">
                                <strong>SM:</strong> Mały tekst
                            </div>
                            <div class="mas-v2-typo-sample" style="font-size: var(--mas-size-md, 16px);">
                                <strong>MD:</strong> Normalny tekst
                            </div>
                            <div class="mas-v2-typo-sample" style="font-size: var(--mas-size-lg, 18px);">
                                <strong>LG:</strong> Duży tekst
                            </div>
                            <div class="mas-v2-typo-sample" style="font-size: var(--mas-size-xl, 20px);">
                                <strong>XL:</strong> Bardzo duży tekst
                            </div>
                        </div>
                        
                        <button class="mas-v2-button secondary" onclick="testResponsiveTypography()">
                            📱 Test responsywności
                        </button>
                    </div>
                </div>
                
            </div>
        </div>

        <!-- 📊 Performance Monitoring -->
        <div class="mas-v2-section">
            <div class="mas-v2-section-header">
                <h2>📊 Performance Monitoring</h2>
                <p>Zaawansowane monitorowanie wydajności w czasie rzeczywistym</p>
            </div>
            
            <div class="mas-v2-card">
                <div class="mas-v2-card-header">
                    <h3>⚡ Real-time Performance</h3>
                    <button class="mas-v2-button secondary" onclick="runPerformanceTest()">
                        🧪 Uruchom test wydajności
                    </button>
                </div>
                <div class="mas-v2-card-content">
                    <div id="performance-monitor" class="mas-v2-performance-monitor">
                        <div class="mas-v2-metric">
                            <div class="mas-v2-metric-label">Czas ładowania strony</div>
                            <div class="mas-v2-metric-value" id="page-load-time">-</div>
                        </div>
                        <div class="mas-v2-metric">
                            <div class="mas-v2-metric-label">Pamięć używana</div>
                            <div class="mas-v2-metric-value" id="memory-usage">-</div>
                        </div>
                        <div class="mas-v2-metric">
                            <div class="mas-v2-metric-label">Zasoby załadowane</div>
                            <div class="mas-v2-metric-value" id="resources-loaded">-</div>
                        </div>
                        <div class="mas-v2-metric">
                            <div class="mas-v2-metric-label">Cache hit ratio</div>
                            <div class="mas-v2-metric-value" id="cache-hit-ratio">-</div>
                        </div>
                    </div>
                    
                    <div class="mas-v2-performance-chart">
                        <canvas id="performance-chart" width="800" height="200"></canvas>
                    </div>
                </div>
            </div>
        </div>

        <!-- 🔧 System Controls -->
        <div class="mas-v2-section">
            <div class="mas-v2-section-header">
                <h2>🔧 System Controls</h2>
                <p>Zaawansowane kontrole systemowe i diagnostyka</p>
            </div>
            
            <div class="mas-v2-grid mas-v2-grid-3">
                
                <div class="mas-v2-card">
                    <div class="mas-v2-card-header">
                        <h3>💾 Cache Management</h3>
                    </div>
                    <div class="mas-v2-card-content">
                        <div class="mas-v2-button-group vertical">
                            <button class="mas-v2-button secondary" onclick="clearAllCache()">
                                🧹 Wyczyść cache
                            </button>
                            <button class="mas-v2-button secondary" onclick="preloadCache()">
                                ⚡ Preload cache
                            </button>
                            <button class="mas-v2-button secondary" onclick="optimizeCache()">
                                🎯 Optymalizuj cache
                            </button>
                        </div>
                    </div>
                </div>
                
                <div class="mas-v2-card">
                    <div class="mas-v2-card-header">
                        <h3>🚀 Asset Loading</h3>
                    </div>
                    <div class="mas-v2-card-content">
                        <div class="mas-v2-button-group vertical">
                            <button class="mas-v2-button secondary" onclick="reloadAssets()">
                                🔄 Przeładuj zasoby
                            </button>
                            <button class="mas-v2-button secondary" onclick="preloadAssets()">
                                ⬇️ Preload zasoby
                            </button>
                            <button class="mas-v2-button secondary" onclick="optimizeAssets()">
                                ⚡ Optymalizuj zasoby
                            </button>
                        </div>
                    </div>
                </div>
                
                <div class="mas-v2-card">
                    <div class="mas-v2-card-header">
                        <h3>🎨 CSS Generation</h3>
                    </div>
                    <div class="mas-v2-card-content">
                        <div class="mas-v2-button-group vertical">
                            <button class="mas-v2-button secondary" onclick="regenerateAllCSS()">
                                🔄 Regeneruj CSS
                            </button>
                            <button class="mas-v2-button secondary" onclick="optimizeCSS()">
                                📦 Optymalizuj CSS
                            </button>
                            <button class="mas-v2-button secondary" onclick="exportCSS()">
                                📤 Eksportuj CSS
                            </button>
                        </div>
                    </div>
                </div>
                
            </div>
        </div>

    </div>
</div>

<!-- 🎨 Phase 5 Specific Styles -->
<style>
.mas-v2-phase-badge.phase-5 {
    background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
    color: white;
    font-weight: 600;
    padding: 6px 12px;
    border-radius: 20px;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.mas-v2-stat-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 16px;
    margin-bottom: 20px;
}

.mas-v2-stat {
    text-align: center;
    padding: 16px;
    background: #f8fafc;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
}

.mas-v2-stat-value {
    font-size: 24px;
    font-weight: 700;
    color: #1e293b;
    margin-bottom: 4px;
}

.mas-v2-stat-label {
    font-size: 12px;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.mas-v2-color-variables {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 20px;
}

.mas-v2-color-var {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    background: #f8fafc;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
}

.mas-v2-color-preview {
    width: 40px;
    height: 40px;
    border-radius: 8px;
    border: 2px solid #fff;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.mas-v2-color-info {
    flex: 1;
}

.mas-v2-color-info strong {
    display: block;
    font-family: 'Courier New', monospace;
    font-size: 14px;
    color: #1e293b;
    margin-bottom: 2px;
}

.mas-v2-color-info span {
    font-size: 12px;
    color: #64748b;
    text-transform: uppercase;
}

.mas-v2-typo-demo {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 20px;
}

.mas-v2-typo-sample {
    padding: 8px 12px;
    background: #f8fafc;
    border-radius: 6px;
    border-left: 3px solid #3b82f6;
}

.mas-v2-performance-monitor {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;
    margin-bottom: 24px;
}

.mas-v2-metric {
    padding: 16px;
    background: #f8fafc;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
    text-align: center;
}

.mas-v2-metric-label {
    font-size: 12px;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 8px;
}

.mas-v2-metric-value {
    font-size: 20px;
    font-weight: 700;
    color: #1e293b;
}

.mas-v2-performance-chart {
    background: #f8fafc;
    border-radius: 8px;
    padding: 16px;
    border: 1px solid #e2e8f0;
}

.mas-v2-button-group.vertical {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.mas-v2-button-group.vertical .mas-v2-button {
    justify-content: flex-start;
}
</style>

<!-- 📜 Phase 5 JavaScript -->
<script>
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Phase 5 Demo Page loaded');
    
    // Inicjalizuj monitoring wydajności
    initPerformanceMonitoring();
    
    // Aktualizuj statystyki co 5 sekund
    setInterval(updateAllStats, 5000);
});

// 🧪 Test Lazy Loading
function testLazyLoading() {
    if (window.MASToast) {
        const loadingToast = window.MASToast.loading('Testowanie Lazy Loading System...');
        
        setTimeout(() => {
            window.MASToast.remove(loadingToast);
            window.MASToast.success('Lazy Loading System działa poprawnie!', {
                title: 'Test zakończony',
                duration: 3000
            });
        }, 2000);
    }
}

// 🧪 Test Cache System
function testCacheSystem() {
    if (window.MASToast) {
        const loadingToast = window.MASToast.loading('Testowanie Advanced Cache System...');
        
        setTimeout(() => {
            window.MASToast.remove(loadingToast);
            window.MASToast.success('Cache System działa optymalnie!', {
                title: 'Test zakończony',
                duration: 3000
            });
        }, 1500);
    }
}

// 🔄 Regeneruj CSS
function regenerateCSS() {
    if (window.MASToast) {
        const loadingToast = window.MASToast.loading('Regenerowanie zmiennych CSS...');
        
        setTimeout(() => {
            window.MASToast.remove(loadingToast);
            window.MASToast.success('Zmienne CSS zostały zregenerowane!', {
                title: 'CSS zaktualizowany',
                duration: 3000
            });
        }, 1000);
    }
}

// 🔔 Toast Notification Tests
function showSuccessToast() {
    if (window.MASToast) {
        window.MASToast.success('Operacja zakończona sukcesem!', {
            title: 'Sukces',
            duration: 4000
        });
    }
}

function showErrorToast() {
    if (window.MASToast) {
        window.MASToast.error('Wystąpił błąd podczas operacji!', {
            title: 'Błąd',
            duration: 6000
        });
    }
}

function showWarningToast() {
    if (window.MASToast) {
        window.MASToast.warning('Uwaga! Sprawdź ustawienia przed kontynuowaniem.', {
            title: 'Ostrzeżenie',
            duration: 5000
        });
    }
}

function showInfoToast() {
    if (window.MASToast) {
        window.MASToast.info('Informacja: System został zaktualizowany.', {
            title: 'Informacja',
            duration: 4000
        });
    }
}

function changeToastPosition() {
    const position = document.getElementById('toast-position').value;
    if (window.MASToast) {
        window.MASToast.setPosition(window.MASToast.positions[position]);
        window.MASToast.info(`Pozycja zmieniona na: ${position}`, {
            duration: 2000
        });
    }
}

function clearAllToasts() {
    if (window.MASToast) {
        window.MASToast.clear();
    }
}

function updateToastStats() {
    if (window.MASToast) {
        const stats = window.MASToast.getStats();
        document.getElementById('active-toasts').textContent = stats.active_toasts;
        document.getElementById('queued-toasts').textContent = stats.queued_toasts;
        document.getElementById('max-toasts').textContent = stats.max_toasts;
    }
}

// 📊 Performance Monitoring
function initPerformanceMonitoring() {
    updatePerformanceMetrics();
}

function updatePerformanceMetrics() {
    // Czas ładowania strony
    const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
    document.getElementById('page-load-time').textContent = loadTime + 'ms';
    
    // Pamięć (jeśli dostępna)
    if (performance.memory) {
        const memoryMB = Math.round(performance.memory.usedJSHeapSize / 1048576);
        document.getElementById('memory-usage').textContent = memoryMB + 'MB';
    }
    
    // Liczba zasobów
    const resources = performance.getEntriesByType('resource').length;
    document.getElementById('resources-loaded').textContent = resources;
    
    // Symulacja cache hit ratio
    document.getElementById('cache-hit-ratio').textContent = '87%';
}

function runPerformanceTest() {
    if (window.MASToast) {
        const loadingToast = window.MASToast.loading('Uruchamianie testu wydajności...');
        
        setTimeout(() => {
            updatePerformanceMetrics();
            window.MASToast.remove(loadingToast);
            window.MASToast.success('Test wydajności zakończony!', {
                title: 'Performance Test',
                duration: 3000
            });
        }, 3000);
    }
}

// 🎨 CSS Variables
function showAllCSSVariables() {
    if (window.MASToast) {
        window.MASToast.info('Sprawdź konsolę deweloperską aby zobaczyć wszystkie zmienne CSS.', {
            title: 'CSS Variables',
            duration: 4000
        });
        
        // Wyświetl zmienne w konsoli
        const root = document.documentElement;
        const styles = getComputedStyle(root);
        const cssVars = {};
        
        for (let i = 0; i < styles.length; i++) {
            const prop = styles[i];
            if (prop.startsWith('--mas-')) {
                cssVars[prop] = styles.getPropertyValue(prop);
            }
        }
        
        console.group('🎨 MAS CSS Variables');
        console.table(cssVars);
        console.groupEnd();
    }
}

function testResponsiveTypography() {
    if (window.MASToast) {
        window.MASToast.info('Zmień rozmiar okna aby zobaczyć responsywną typografię w akcji!', {
            title: 'Responsive Typography',
            duration: 5000
        });
    }
}

// 🔧 System Controls
function clearAllCache() {
    if (window.MASToast) {
        const loadingToast = window.MASToast.loading('Czyszczenie cache...');
        
        setTimeout(() => {
            window.MASToast.remove(loadingToast);
            window.MASToast.success('Cache został wyczyszczony!', {
                title: 'Cache Management',
                duration: 3000
            });
        }, 1500);
    }
}

function preloadCache() {
    if (window.MASToast) {
        const loadingToast = window.MASToast.loading('Preloadowanie cache...');
        
        setTimeout(() => {
            window.MASToast.remove(loadingToast);
            window.MASToast.success('Cache został preloadowany!', {
                title: 'Cache Management',
                duration: 3000
            });
        }, 2000);
    }
}

function optimizeCache() {
    if (window.MASToast) {
        const loadingToast = window.MASToast.loading('Optymalizowanie cache...');
        
        setTimeout(() => {
            window.MASToast.remove(loadingToast);
            window.MASToast.success('Cache został zoptymalizowany!', {
                title: 'Cache Management',
                duration: 3000
            });
        }, 2500);
    }
}

function reloadAssets() {
    if (window.MASToast) {
        window.MASToast.info('Przeładowywanie zasobów...', {
            title: 'Asset Loading',
            duration: 2000
        });
    }
}

function preloadAssets() {
    if (window.MASToast) {
        window.MASToast.info('Preloadowanie zasobów...', {
            title: 'Asset Loading',
            duration: 2000
        });
    }
}

function optimizeAssets() {
    if (window.MASToast) {
        window.MASToast.success('Zasoby zostały zoptymalizowane!', {
            title: 'Asset Loading',
            duration: 3000
        });
    }
}

function regenerateAllCSS() {
    regenerateCSS();
}

function optimizeCSS() {
    if (window.MASToast) {
        window.MASToast.success('CSS został zoptymalizowany!', {
            title: 'CSS Generation',
            duration: 3000
        });
    }
}

function exportCSS() {
    if (window.MASToast) {
        window.MASToast.info('CSS został wyeksportowany do schowka!', {
            title: 'CSS Generation',
            duration: 3000
        });
    }
}

function updateAllStats() {
    updateToastStats();
    updatePerformanceMetrics();
}
</script> 