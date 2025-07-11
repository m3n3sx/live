<?php
/**
 * Demo Page - Faza 1: Głęboka Integracja z WordPress API
 * 
 * Pokazuje nową architekturę wtyczki opartą na natywnych API WordPress
 * 
 * @package ModernAdminStyler
 * @version 2.2.0
 */

if (!defined('ABSPATH')) {
    exit;
}

// Pobierz instancję wtyczki
$plugin = ModernAdminStylerV2::getInstance();
?>

<div class="wrap">
    <h1>🚀 Modern Admin Styler V2 - Faza 1: WordPress API Integration</h1>
    
    <div class="notice notice-success">
        <p><strong>✅ Faza 1 została pomyślnie zaimplementowana!</strong></p>
        <p>Wtyczka została przekształcona zgodnie z filozofią "WordPress Way" - wykorzystuje natywne API WordPress dla maksymalnej kompatybilności i profesjonalnego doświadczenia użytkownika.</p>
    </div>
    
    <!-- Architecture Overview -->
    <div class="mas-v2-architecture-overview" style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; margin: 30px 0;">
        
        <!-- Live Edit Mode -->
        <div class="mas-v2-integration-card" style="background: #f0f6ff; border-left: 4px solid #3b82f6; padding: 20px; border-radius: 8px;">
            <h2>🎨 Live Edit Mode</h2>
            <p><strong>Opcje wizualne z podglądem na żywo</strong></p>
            <ul style="margin: 15px 0;">
                <li>✅ Kolory i motywy</li>
                <li>✅ Typografia</li>
                <li>✅ Pasek admina</li>
                <li>✅ Menu boczne</li>
                <li>✅ Efekty wizualne</li>
            </ul>
            <p>
                <a href="<?php echo admin_url('admin.php?page=modern-admin-styler-settings'); ?>" class="button button-primary">
                    🎯 Otwórz Live Edit Mode
                </a>
            </p>
        </div>
        
        <!-- Settings API -->
        <div class="mas-v2-integration-card" style="background: #f0fdf4; border-left: 4px solid #22c55e; padding: 20px; border-radius: 8px;">
            <h2>⚙️ WordPress Settings API</h2>
            <p><strong>Opcje funkcjonalne</strong></p>
            <ul style="margin: 15px 0;">
                <li>✅ Włącz/wyłącz wtyczkę</li>
                <li>✅ Optymalizacja</li>
                <li>✅ Ukrywanie elementów</li>
                <li>✅ Własny CSS/JS</li>
                <li>✅ Import/Export</li>
            </ul>
            <p>
                <a href="<?php echo admin_url('admin.php?page=mas-v2-functional'); ?>" class="button button-primary">
                    ⚙️ Ustawienia funkcjonalne
                </a>
            </p>
        </div>
        
        <!-- REST API -->
        <div class="mas-v2-integration-card" style="background: #fefce8; border-left: 4px solid #eab308; padding: 20px; border-radius: 8px;">
            <h2>🔗 WordPress REST API</h2>
            <p><strong>Narzędzia diagnostyczne</strong></p>
            <ul style="margin: 15px 0;">
                <li>✅ Cache management</li>
                <li>✅ Security scan</li>
                <li>✅ Performance metrics</li>
                <li>✅ Database tools</li>
                <li>✅ System info</li>
            </ul>
            <p>
                <button class="button button-primary" id="test-rest-api">
                    🧪 Testuj REST API
                </button>
            </p>
        </div>
    </div>
    
    <!-- Benefits Section -->
    <div class="mas-v2-benefits" style="background: white; border: 1px solid #ddd; border-radius: 8px; padding: 30px; margin: 30px 0;">
        <h2>🎯 Korzyści z nowej architektury</h2>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-top: 20px;">
            <div>
                <h3>🏗️ Architektoniczne</h3>
                <ul>
                    <li><strong>Natywna integracja</strong> - wykorzystuje WordPress API</li>
                    <li><strong>Separation of Concerns</strong> - wizualne vs funkcjonalne</li>
                    <li><strong>Bezstanowe API</strong> - nowoczesne REST endpoints</li>
                    <li><strong>Dependency Injection</strong> - czysta architektura</li>
                </ul>
            </div>
            
            <div>
                <h3>👤 Użytkownika</h3>
                <ul>
                    <li><strong>Podgląd na żywo</strong> - zmiany widoczne natychmiast</li>
                    <li><strong>Znajomy interfejs</strong> - natywne komponenty WP</li>
                    <li><strong>Bezpieczeństwo</strong> - WordPress nonce i permissions</li>
                    <li><strong>Wydajność</strong> - optymalizowane zapytania</li>
                </ul>
            </div>
        </div>
    </div>
    
    <!-- Technical Implementation -->
    <div class="mas-v2-technical" style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 30px; margin: 30px 0;">
        <h2>🔧 Implementacja techniczna</h2>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; margin-top: 20px;">
            
            <div>
                <h4>📁 Nowe serwisy</h4>
                <code style="display: block; background: white; padding: 10px; border-radius: 4px; margin: 10px 0;">
                    AdminInterface.php<br>
                    SettingsAPI.php<br>
                    RestAPI.php
                </code>
            </div>
            
            <div>
                <h4>🎨 Frontend assets</h4>
                <code style="display: block; background: white; padding: 10px; border-radius: 4px; margin: 10px 0;">
                    live-edit-mode.js<br>
                    Live preview support<br>
                    Direct DOM manipulation
                </code>
            </div>
            
            <div>
                <h4>🔗 REST Endpoints</h4>
                <code style="display: block; background: white; padding: 10px; border-radius: 4px; margin: 10px 0;">
                    /modern-admin-styler/v2/<br>
                    cache/, security/, metrics/<br>
                    database/, system/
                </code>
            </div>
        </div>
    </div>
    
    <!-- API Testing Section -->
    <div class="mas-v2-api-testing" style="background: white; border: 1px solid #ddd; border-radius: 8px; padding: 30px; margin: 30px 0;">
        <h2>🧪 Testowanie API</h2>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px;">
            <div>
                <h3>REST API Endpoints</h3>
                <div style="margin: 15px 0;">
                    <button class="button" onclick="testEndpoint('/cache/stats')">📊 Cache Stats</button>
                    <button class="button" onclick="testEndpoint('/system/info')">💻 System Info</button>
                    <button class="button" onclick="testEndpoint('/status')">✅ Plugin Status</button>
                </div>
                
                <h4>POST Endpoints (wymagają uprawnień)</h4>
                <div style="margin: 15px 0;">
                    <button class="button" onclick="testEndpoint('/cache/flush', 'POST')">🗑️ Flush Cache</button>
                    <button class="button" onclick="testEndpoint('/metrics/benchmark', 'POST')">⚡ Performance Test</button>
                </div>
            </div>
            
            <div>
                <h3>Wyniki testów</h3>
                <div id="api-results" style="background: #f9f9f9; border: 1px solid #ddd; padding: 15px; border-radius: 4px; height: 300px; overflow-y: auto; font-family: monospace; font-size: 12px;">
                    Kliknij przycisk aby przetestować endpoint...
                </div>
            </div>
        </div>
    </div>
    
    <!-- Next Steps -->
    <div class="mas-v2-next-steps" style="background: #f0f6ff; border-left: 4px solid #3b82f6; padding: 20px; border-radius: 8px; margin: 30px 0;">
        <h2>🚀 Następne kroki</h2>
        <p><strong>Faza 1</strong> została ukończona! Następne fazy rozwoju:</p>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 15px;">
            <div>
                <h4>🎨 Faza 2: Adaptacja języka wizualnego</h4>
                <ul>
                    <li>Zastąpienie komponentów natywnymi WordPress</li>
                    <li>Minimalistyczny utility CSS z prefiksem</li>
                    <li>Pełna spójność wizualna</li>
                </ul>
            </div>
            
            <div>
                <h4>🔌 Faza 3: Integracja z ekosystemem</h4>
                <ul>
                    <li>Hooki i filtry dla deweloperów</li>
                    <li>Integracja z Gutenberg</li>
                    <li>Otwartość na rozszerzenia</li>
                </ul>
            </div>
        </div>
    </div>
</div>

<script>
document.addEventListener('DOMContentLoaded', function() {
    // Test REST API functionality
    window.testEndpoint = function(endpoint, method = 'GET') {
        const resultsDiv = document.getElementById('api-results');
        const baseUrl = '<?php echo rest_url('modern-admin-styler/v2'); ?>';
        
        resultsDiv.innerHTML += `\n🔄 Testing ${method} ${endpoint}...\n`;
        resultsDiv.scrollTop = resultsDiv.scrollHeight;
        
        const options = {
            method: method,
            headers: {
                'X-WP-Nonce': '<?php echo wp_create_nonce('wp_rest'); ?>'
            }
        };
        
        fetch(baseUrl + endpoint, options)
            .then(response => response.json())
            .then(data => {
                resultsDiv.innerHTML += `✅ ${endpoint}: ${JSON.stringify(data, null, 2)}\n\n`;
                resultsDiv.scrollTop = resultsDiv.scrollHeight;
            })
            .catch(error => {
                resultsDiv.innerHTML += `❌ ${endpoint}: ${error.message}\n\n`;
                resultsDiv.scrollTop = resultsDiv.scrollHeight;
            });
    };
    
    // Test REST API button
    document.getElementById('test-rest-api').addEventListener('click', function() {
        testEndpoint('/status');
        setTimeout(() => testEndpoint('/system/info'), 500);
        setTimeout(() => testEndpoint('/cache/stats'), 1000);
    });
});
</script>

<style>
.mas-v2-integration-card h2 {
    margin-top: 0;
    color: #1e293b;
}

.mas-v2-integration-card ul {
    list-style: none;
    padding-left: 0;
}

.mas-v2-integration-card li {
    padding: 3px 0;
    font-size: 14px;
}

.mas-v2-benefits h3,
.mas-v2-technical h4 {
    color: #1e293b;
    margin-bottom: 10px;
}

.mas-v2-benefits ul,
.mas-v2-technical ul {
    list-style-type: disc;
    padding-left: 20px;
}

.mas-v2-benefits li,
.mas-v2-technical li {
    margin: 5px 0;
    font-size: 14px;
}

@media (max-width: 768px) {
    .mas-v2-architecture-overview,
    .mas-v2-benefits > div,
    .mas-v2-technical > div,
    .mas-v2-api-testing > div,
    .mas-v2-next-steps > div {
        grid-template-columns: 1fr !important;
    }
}
</style> 