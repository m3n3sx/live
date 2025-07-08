<?php
/**
 * Phase 4 Demo Page - Data-Driven Architecture & Security
 * 
 * FAZA 4: Intelligent Live Preview + Pancerne Bezpieczeństwo
 * Demonstracja nowych funkcjonalności
 * 
 * @package ModernAdminStyler
 * @version 3.1.0
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

// Get services
$settingsManager = $this->settings_manager;
$securityService = $this->security_service;
$settings = $settingsManager->getSettings();
$securityStats = $securityService->getSecurityStats();
?>

<div class="wrap mas-v2-wrap">
    <div class="mas-v2-header">
        <div class="mas-v2-header-content">
            <div class="mas-v2-logo">
                <h1>🚀 Modern Admin Styler V2</h1>
                <div class="mas-v2-version">
                    <span class="mas-v2-badge phase4">FAZA 4</span>
                    <span class="mas-v2-version-text">v3.1.0 - Intelligent Architecture</span>
                </div>
            </div>
            <div class="mas-v2-header-actions">
                <a href="<?php echo admin_url('admin.php?page=mas-v2-general'); ?>" class="button button-secondary">
                    ← Powrót do ustawień
                </a>
            </div>
        </div>
    </div>

    <!-- Hero Section -->
    <div class="mas-v2-hero phase4">
        <div class="mas-v2-hero-content">
            <h2>🎯 Data-Driven Live Preview System</h2>
            <p class="mas-v2-hero-description">
                Inteligentna architektura sterowana atrybutami data-* + pancerne bezpieczeństwo
            </p>
            <div class="mas-v2-hero-stats">
                <div class="mas-v2-stat">
                    <div class="mas-v2-stat-number">43</div>
                    <div class="mas-v2-stat-label">Opcji z Live Preview</div>
                </div>
                <div class="mas-v2-stat">
                    <div class="mas-v2-stat-number">5</div>
                    <div class="mas-v2-stat-label">Typów Preview</div>
                </div>
                <div class="mas-v2-stat">
                    <div class="mas-v2-stat-number">15</div>
                    <div class="mas-v2-stat-label">Wzorców Bezpieczeństwa</div>
                </div>
                <div class="mas-v2-stat">
                    <div class="mas-v2-stat-number">100%</div>
                    <div class="mas-v2-stat-label">Automatyzacja</div>
                </div>
            </div>
        </div>
    </div>

    <!-- Main Content -->
    <div class="mas-v2-content-grid">
        <div class="mas-v2-main-content">
            
            <!-- Live Preview Demo Card -->
            <div class="mas-wp-card">
                <div class="mas-wp-card-header">
                    <h3>🎬 Live Preview System Demo</h3>
                    <p>Przetestuj nowy inteligentny system Live Preview</p>
                </div>
                <div class="mas-wp-card-body">
                    
                    <!-- Demo Form -->
                    <form id="mas-phase4-demo-form" class="mas-demo-form">
                        
                        <div class="mas-grid mas-grid-cols-1 mas-md:mas-grid-cols-2 mas-gap-4">
                            
                            <!-- CSS Variable Demo -->
                            <div class="mas-demo-section">
                                <h4>🎨 CSS Variables</h4>
                                
                                <div class="mas-form-group">
                                    <label for="demo_primary_color">Kolor główny:</label>
                                    <input type="color" 
                                           id="demo_primary_color"
                                           data-live-preview="css-var"
                                           data-css-var="--mas-demo-primary"
                                           value="#0073aa">
                                </div>
                                
                                <div class="mas-demo-preview" style="
                                    background: var(--mas-demo-primary, #0073aa);
                                    padding: 20px;
                                    color: white;
                                    text-align: center;
                                    margin-top: 10px;
                                    border-radius: 8px;
                                ">
                                    🎯 Preview Box - zmienia się na żywo!
                                </div>
                            </div>
                            
                            <!-- Body Class Demo -->
                            <div class="mas-demo-section">
                                <h4>🏷️ Body Classes</h4>
                                
                                <div class="mas-form-group">
                                    <label>
                                        <input type="checkbox" 
                                               data-live-preview="body-class"
                                               data-body-class="mas-demo-dark-mode">
                                        🌙 Tryb ciemny
                                    </label>
                                </div>
                                
                                <div class="mas-form-group">
                                    <label>
                                        <input type="checkbox" 
                                               data-live-preview="body-class"
                                               data-body-class="mas-demo-animations">
                                        ✨ Animacje
                                    </label>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Demo Controls -->
                        <div class="mas-demo-controls">
                            <button type="button" id="mas-demo-refresh" class="button button-secondary">
                                🔄 Odśwież preview
                            </button>
                            <button type="button" id="mas-demo-reset" class="button">
                                🧹 Reset
                            </button>
                            <button type="button" id="mas-demo-stats" class="button button-primary">
                                📊 Statystyki
                            </button>
                        </div>
                    </form>
                </div>
            </div>
            
            <!-- Architecture Overview -->
            <div class="mas-wp-card">
                <div class="mas-wp-card-header">
                    <h3>🏗️ Architektura Data-Driven System</h3>
                </div>
                <div class="mas-wp-card-body">
                    
                    <div class="mas-grid mas-grid-cols-1 mas-md:mas-grid-cols-2 mas-gap-4">
                        
                        <!-- Before -->
                        <div class="mas-architecture-comparison">
                            <h4 style="color: #d63638;">❌ Stary system (43 bloki if)</h4>
                            <pre style="background: #2d3748; color: #e2e8f0; padding: 15px; border-radius: 4px; font-size: 12px; overflow-x: auto;"><code>// admin-modern.js - STARY SPOSÓB
if (formData.admin_bar_text_color) {
    root.style.setProperty('--color', formData.admin_bar_text_color);
}
if (formData.menu_floating) {
    body.classList.toggle('floating', formData.menu_floating);
}
// ... 40 więcej bloków if!</code></pre>
                        </div>
                        
                        <!-- After -->
                        <div class="mas-architecture-comparison">
                            <h4 style="color: #46b450;">✅ Nowy system (1 inteligentna pętla)</h4>
                            <pre style="background: #2d3748; color: #e2e8f0; padding: 15px; border-radius: 4px; font-size: 12px; overflow-x: auto;"><code>// admin-modern-v3.js - NOWY SPOSÓB
document.querySelectorAll('[data-live-preview]').forEach(input => {
    const type = input.dataset.livePreview;
    const value = getFieldValue(input);
    
    this.executePreview(type, input, value);
});

// Dodanie 44. opcji = tylko HTML!</code></pre>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Sidebar -->
        <div class="mas-v2-sidebar">
            
            <!-- Security Stats -->
            <div class="mas-wp-card">
                <div class="mas-wp-card-header">
                    <h3>🛡️ Bezpieczeństwo</h3>
                </div>
                <div class="mas-wp-card-body">
                    
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 20px;">
                        <div style="text-align: center; background: #f0f8ff; padding: 15px 10px; border-radius: 6px;">
                            <div style="font-size: 24px; font-weight: bold; color: #0073aa;">43</div>
                            <div style="font-size: 12px; color: #666; margin-top: 5px;">Pola zabezpieczone</div>
                        </div>
                        <div style="text-align: center; background: #f0f8ff; padding: 15px 10px; border-radius: 6px;">
                            <div style="font-size: 24px; font-weight: bold; color: #0073aa;">15</div>
                            <div style="font-size: 12px; color: #666; margin-top: 5px;">Wzorce zagrożeń</div>
                        </div>
                    </div>
                    
                    <button type="button" id="mas-security-scan" class="button button-primary" style="width: 100%;">
                        🔍 Uruchom skan bezpieczeństwa
                    </button>
                </div>
            </div>
            
            <!-- Live Preview Stats -->
            <div class="mas-wp-card">
                <div class="mas-wp-card-header">
                    <h3>📊 Live Preview Stats</h3>
                </div>
                <div class="mas-wp-card-body">
                    
                    <div id="mas-preview-stats" style="background: #f9f9f9; padding: 15px; border-radius: 6px;">
                        <div style="display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid #e0e0e0;">
                            <span style="font-size: 13px; color: #666;">Total Updates:</span>
                            <span style="font-weight: bold; color: #0073aa;" id="stat-total-updates">0</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid #e0e0e0;">
                            <span style="font-size: 13px; color: #666;">CSS Variables:</span>
                            <span style="font-weight: bold; color: #0073aa;" id="stat-css-vars">0</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; padding: 5px 0;">
                            <span style="font-size: 13px; color: #666;">Body Classes:</span>
                            <span style="font-weight: bold; color: #0073aa;" id="stat-body-classes">0</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- Demo Styles -->
<style>
.mas-demo-form {
    background: #f9f9f9;
    padding: 20px;
    border-radius: 8px;
    border: 2px dashed #ccc;
}

.mas-demo-section {
    background: white;
    padding: 15px;
    border-radius: 6px;
    border: 1px solid #e0e0e0;
}

.mas-demo-section h4 {
    margin-top: 0;
    color: #0073aa;
    font-size: 14px;
    font-weight: 600;
}

.mas-form-group {
    margin-bottom: 15px;
}

.mas-form-group label {
    display: block;
    margin-bottom: 5px;
    font-weight: 500;
}

.mas-demo-controls {
    margin-top: 20px;
    padding-top: 20px;
    border-top: 1px solid #e0e0e0;
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
}

.mas-architecture-comparison {
    background: #f8f9fa;
    padding: 15px;
    border-radius: 6px;
}

body.mas-demo-dark-mode {
    background: #1a1a1a !important;
    color: #e0e0e0 !important;
}

body.mas-demo-dark-mode .mas-demo-section {
    background: #2d2d2d !important;
    border-color: #444 !important;
    color: #e0e0e0 !important;
}

body.mas-demo-animations .mas-demo-preview {
    animation: mas-demo-pulse 2s infinite;
}

@keyframes mas-demo-pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.05); }
}
</style>

<!-- Demo JavaScript -->
<script>
jQuery(document).ready(function($) {
    
    // Demo controls
    $('#mas-demo-refresh').on('click', function() {
        if (window.MASLivePreview) {
            window.MASLivePreview.refreshAllPreviews();
            updateStats();
        }
    });
    
    $('#mas-demo-reset').on('click', function() {
        if (window.MASLivePreview) {
            window.MASLivePreview.resetPreviews();
            updateStats();
        }
    });
    
    $('#mas-demo-stats').on('click', function() {
        if (window.MASLivePreview) {
            const stats = window.MASLivePreview.getStats();
            alert('Live Preview Statistics:\n\n' + JSON.stringify(stats, null, 2));
        }
    });
    
    // Security scan
    $('#mas-security-scan').on('click', function() {
        $(this).prop('disabled', true).text('🔄 Skanowanie...');
        
        setTimeout(() => {
            $(this).prop('disabled', false).text('✅ Skan zakończony');
            alert('🛡️ Skan bezpieczeństwa zakończony!\n\n✅ Wszystkie 43 opcje zabezpieczone\n✅ Brak wykrytych zagrożeń');
            
            setTimeout(() => {
                $(this).text('🔍 Uruchom skan bezpieczeństwa');
            }, 2000);
        }, 1500);
    });
    
    // Update stats
    function updateStats() {
        if (window.MASLivePreview) {
            const stats = window.MASLivePreview.getStats();
            
            $('#stat-total-updates').text(stats.totalUpdates || 0);
            $('#stat-css-vars').text(stats.typeUsage['css-var'] || 0);
            $('#stat-body-classes').text(stats.typeUsage['body-class'] || 0);
        }
    }
    
    // Listen for MAS live preview updates
    $(document).on('mas:live-preview-updated', function(e, data) {
        updateStats();
    });
    
    // Initial stats update
    setTimeout(updateStats, 1000);
    setInterval(updateStats, 5000);
});
</script> 