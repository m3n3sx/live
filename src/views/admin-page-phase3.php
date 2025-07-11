<?php
/**
 * Admin Page - Phase 3 Demo
 * 
 * Faza 3: Ecosystem Integration
 * Demonstracja hooks, filters i Gutenberg
 * 
 * @package ModernAdminStyler\Views
 * @version 3.0.0
 */

// Security check
if (!defined('ABSPATH')) {
    exit;
}

$hooks_manager = $this->hooks_manager ?? null;
$gutenberg_manager = $this->gutenberg_manager ?? null;
$settings_manager = $this->settings_manager ?? null;

// Pobierz dane dla demo
$registered_hooks = $hooks_manager ? $hooks_manager->getRegisteredHooks() : [];
$hook_stats = $hooks_manager ? $hooks_manager->getHookStats() : [];
$gutenberg_blocks = $gutenberg_manager ? $gutenberg_manager->getRegisteredBlocks() : [];
$current_settings = $settings_manager ? $settings_manager->getSettings() : [];

// Statystyki
$total_hooks = count($registered_hooks);
$active_hooks = 0;
foreach ($registered_hooks as $hook_name => $config) {
    if ($hooks_manager && $hooks_manager->hasCallbacks($hook_name)) {
        $active_hooks++;
    }
}
$total_blocks = count($gutenberg_blocks);
$gutenberg_active = $gutenberg_manager ? $gutenberg_manager->isGutenbergActive() : false;
?>

<div class="wrap mas-admin-page">
    <!-- Header -->
    <div class="mas-wp-card mas-header-card">
        <div class="mas-flex mas-items-center mas-justify-between">
            <div>
                <h1 class="mas-flex mas-items-center mas-gap-4">
                    🔗 <span>Modern Admin Styler V2</span>
                    <span class="mas-text-sm mas-bg-green-100 mas-text-green-800 mas-px-3 mas-py-1 mas-rounded-full">
                        Faza 3: Ecosystem Integration
                    </span>
                </h1>
                <p class="description">
                    Demonstracja zaawansowanej integracji z ekosystemem WordPress - hooks, filters i Gutenberg blocks
                </p>
            </div>
            <div class="mas-text-right">
                <div class="mas-text-sm mas-text-gray-600">
                    <strong>Status:</strong> <?php echo $gutenberg_active ? '✅ Gutenberg Active' : '❌ Gutenberg Inactive'; ?><br>
                    <strong>Hooks:</strong> <?php echo $active_hooks; ?>/<?php echo $total_hooks; ?> aktywne<br>
                    <strong>Blocks:</strong> <?php echo $total_blocks; ?> zarejestrowanych
                </div>
            </div>
        </div>
    </div>

    <!-- Main Content Grid -->
    <div class="mas-grid mas-grid-cols-1 mas-lg:mas-grid-cols-3 mas-gap-6">
        
        <!-- Left Column: Hooks System -->
        <div class="mas-lg:mas-col-span-2">
            
            <!-- Hooks Overview -->
            <div class="postbox">
                <div class="postbox-header">
                    <h2 class="hndle">🎣 System Hooks & Filters</h2>
                </div>
                <div class="inside">
                    <div class="mas-grid mas-grid-cols-1 mas-md:mas-grid-cols-3 mas-gap-4 mas-mb-6">
                        <div class="mas-text-center mas-p-4 mas-bg-blue-50 mas-rounded">
                            <div class="mas-text-2xl mas-font-bold mas-text-blue-600"><?php echo $total_hooks; ?></div>
                            <div class="mas-text-sm mas-text-gray-600">Zarejestrowane Hooks</div>
                        </div>
                        <div class="mas-text-center mas-p-4 mas-bg-green-50 mas-rounded">
                            <div class="mas-text-2xl mas-font-bold mas-text-green-600"><?php echo $active_hooks; ?></div>
                            <div class="mas-text-sm mas-text-gray-600">Aktywne Hooks</div>
                        </div>
                        <div class="mas-text-center mas-p-4 mas-bg-purple-50 mas-rounded">
                            <div class="mas-text-2xl mas-font-bold mas-text-purple-600"><?php echo count($hook_stats); ?></div>
                            <div class="mas-text-sm mas-text-gray-600">Wykonane Hooks</div>
                        </div>
                    </div>
                    
                    <!-- Hooks Categories -->
                    <div class="mas-grid mas-grid-cols-1 mas-md:mas-grid-cols-2 mas-gap-4">
                        
                        <!-- Settings Hooks -->
                        <div class="mas-p-4 mas-border mas-rounded">
                            <h4 class="mas-font-bold mas-mb-3">⚙️ Settings Hooks</h4>
                            <ul class="mas-text-sm mas-space-y-1">
                                <li><code>mas_v2_before_save_settings</code> - Modyfikacja przed zapisem</li>
                                <li><code>mas_v2_after_save_settings</code> - Action po zapisie</li>
                                <li><code>mas_v2_validate_custom_settings</code> - Walidacja</li>
                            </ul>
                        </div>
                        
                        <!-- CSS Hooks -->
                        <div class="mas-p-4 mas-border mas-rounded">
                            <h4 class="mas-font-bold mas-mb-3">🎨 CSS Hooks</h4>
                            <ul class="mas-text-sm mas-space-y-1">
                                <li><code>mas_v2_generated_css</code> - Modyfikacja CSS</li>
                                <li><code>mas_v2_css_variables</code> - Zmienne CSS</li>
                                <li><code>mas_v2_before_css_generation</code> - Przed generowaniem</li>
                            </ul>
                        </div>
                        
                        <!-- Component Hooks -->
                        <div class="mas-p-4 mas-border mas-rounded">
                            <h4 class="mas-font-bold mas-mb-3">🧩 Component Hooks</h4>
                            <ul class="mas-text-sm mas-space-y-1">
                                <li><code>mas_v2_component_output</code> - Modyfikacja HTML</li>
                                <li><code>mas_v2_after_component_render</code> - Po renderowaniu</li>
                            </ul>
                        </div>
                        
                        <!-- Integration Hooks -->
                        <div class="mas-p-4 mas-border mas-rounded">
                            <h4 class="mas-font-bold mas-mb-3">🔗 Integration Hooks</h4>
                            <ul class="mas-text-sm mas-space-y-1">
                                <li><code>mas_v2_plugin_integration</code> - Integracja z pluginami</li>
                                <li><code>mas_v2_theme_compatibility</code> - Kompatybilność z themes</li>
                            </ul>
                        </div>
                        
                    </div>
                </div>
            </div>
            
            <!-- Live Hook Examples -->
            <div class="postbox">
                <div class="postbox-header">
                    <h2 class="hndle">💡 Przykłady Użycia Hooks</h2>
                </div>
                <div class="inside">
                    <div class="mas-space-y-4">
                        
                        <!-- Example 1: CSS Modification -->
                        <div class="mas-p-4 mas-bg-gray-50 mas-rounded">
                            <h4 class="mas-font-bold mas-mb-2">Modyfikacja CSS przez Hook</h4>
                            <pre class="mas-text-xs mas-bg-white mas-p-3 mas-rounded mas-overflow-x-auto"><code>// Dodaj niestandardowy CSS przez hook
add_filter('mas_v2_generated_css', function($css, $settings) {
    $custom_css = "
        .wp-admin .custom-admin-style {
            background: linear-gradient(45deg, #667eea, #764ba2);
            color: white;
            padding: 10px;
            border-radius: 5px;
        }
    ";
    return $css . $custom_css;
}, 10, 2);</code></pre>
                            <button class="button button-small mas-mt-2" onclick="masTestHook('css')">🧪 Test Hook</button>
                        </div>
                        
                        <!-- Example 2: Settings Validation -->
                        <div class="mas-p-4 mas-bg-gray-50 mas-rounded">
                            <h4 class="mas-font-bold mas-mb-2">Walidacja Ustawień</h4>
                            <pre class="mas-text-xs mas-bg-white mas-p-3 mas-rounded mas-overflow-x-auto"><code>// Dodaj walidację niestandardowych pól
add_filter('mas_v2_validate_custom_settings', function($errors, $settings) {
    if (isset($settings['custom_color']) && !preg_match('/^#[a-f0-9]{6}$/i', $settings['custom_color'])) {
        $errors[] = 'Invalid color format for custom_color';
    }
    return $errors;
}, 10, 2);</code></pre>
                            <button class="button button-small mas-mt-2" onclick="masTestHook('validation')">🧪 Test Hook</button>
                        </div>
                        
                        <!-- Example 3: Component Modification -->
                        <div class="mas-p-4 mas-bg-gray-50 mas-rounded">
                            <h4 class="mas-font-bold mas-mb-2">Modyfikacja Komponentów</h4>
                            <pre class="mas-text-xs mas-bg-white mas-p-3 mas-rounded mas-overflow-x-auto"><code>// Dodaj niestandardowe klasy do przycisków
add_filter('mas_v2_component_output', function($output, $type, $args) {
    if ($type === 'button' && isset($args['variant']) && $args['variant'] === 'custom') {
        $output = str_replace('class="button', 'class="button custom-button', $output);
    }
    return $output;
}, 10, 3);</code></pre>
                            <button class="button button-small mas-mt-2" onclick="masTestHook('component')">🧪 Test Hook</button>
                        </div>
                        
                    </div>
                </div>
            </div>
            
        </div>
        
        <!-- Right Column: Gutenberg Integration -->
        <div>
            
            <!-- Gutenberg Status -->
            <div class="postbox">
                <div class="postbox-header">
                    <h2 class="hndle">📝 Gutenberg Integration</h2>
                </div>
                <div class="inside">
                    <div class="mas-space-y-4">
                        
                        <!-- Status -->
                        <div class="mas-flex mas-items-center mas-justify-between mas-p-3 mas-rounded <?php echo $gutenberg_active ? 'mas-bg-green-50' : 'mas-bg-red-50'; ?>">
                            <span class="mas-font-bold">Status Gutenberg:</span>
                            <span class="<?php echo $gutenberg_active ? 'mas-text-green-600' : 'mas-text-red-600'; ?>">
                                <?php echo $gutenberg_active ? '✅ Aktywny' : '❌ Nieaktywny'; ?>
                            </span>
                        </div>
                        
                        <!-- Blocks Count -->
                        <div class="mas-text-center mas-p-4 mas-bg-blue-50 mas-rounded">
                            <div class="mas-text-3xl mas-font-bold mas-text-blue-600"><?php echo $total_blocks; ?></div>
                            <div class="mas-text-sm mas-text-gray-600">Zarejestrowanych Bloków MAS</div>
                        </div>
                        
                        <!-- Block Categories -->
                        <?php if ($gutenberg_active && !empty($gutenberg_blocks)): ?>
                        <div>
                            <h4 class="mas-font-bold mas-mb-3">📦 Dostępne Bloki:</h4>
                            <ul class="mas-space-y-2">
                                <?php foreach ($gutenberg_blocks as $block_name => $block_config): ?>
                                <li class="mas-flex mas-items-center mas-gap-2 mas-p-2 mas-bg-gray-50 mas-rounded">
                                    <span class="dashicons dashicons-<?php echo esc_attr($block_config['icon']); ?>"></span>
                                    <div>
                                        <div class="mas-font-bold mas-text-sm"><?php echo esc_html($block_config['title']); ?></div>
                                        <div class="mas-text-xs mas-text-gray-600"><?php echo esc_html($block_config['description']); ?></div>
                                    </div>
                                </li>
                                <?php endforeach; ?>
                            </ul>
                        </div>
                        <?php endif; ?>
                        
                        <!-- Gutenberg Actions -->
                        <div class="mas-space-y-2">
                            <a href="<?php echo admin_url('post-new.php?post_type=page'); ?>" class="button button-primary mas-w-full mas-text-center mas-block">
                                📝 Test Blocks w Edytorze
                            </a>
                            <button class="button mas-w-full" onclick="masShowBlocksInfo()">
                                📊 Pokaż Info o Blokach
                            </button>
                        </div>
                        
                    </div>
                </div>
            </div>
            
            <!-- Developer Tools -->
            <div class="postbox">
                <div class="postbox-header">
                    <h2 class="hndle">🛠️ Developer Tools</h2>
                </div>
                <div class="inside">
                    <div class="mas-space-y-3">
                        
                        <!-- Hooks Documentation -->
                        <button class="button mas-w-full" onclick="masShowHooksDoc()">
                            📚 Dokumentacja Hooks
                        </button>
                        
                        <!-- Hook Stats -->
                        <button class="button mas-w-full" onclick="masShowHookStats()">
                            📊 Statystyki Hooks
                        </button>
                        
                        <!-- Export Hooks Config -->
                        <button class="button mas-w-full" onclick="masExportHooksConfig()">
                            💾 Eksport Konfiguracji
                        </button>
                        
                        <!-- Clear Hook Stats -->
                        <button class="button mas-w-full" onclick="masClearHookStats()">
                            🗑️ Wyczyść Statystyki
                        </button>
                        
                    </div>
                </div>
            </div>
            
            <!-- Quick Actions -->
            <div class="postbox">
                <div class="postbox-header">
                    <h2 class="hndle">⚡ Quick Actions</h2>
                </div>
                <div class="inside">
                    <div class="mas-grid mas-grid-cols-2 mas-gap-2">
                                        <a href="<?php echo admin_url('admin.php?page=modern-admin-styler-settings'); ?>" class="button button-small">
                    🎨 Live Edit Mode
                </a>
                        <a href="<?php echo admin_url('admin.php?page=mas-v2-general'); ?>" class="button button-small">
                            ⚙️ Settings
                        </a>
                        <a href="<?php echo admin_url('admin.php?page=mas-v2-phase1'); ?>" class="button button-small">
                            1️⃣ Faza 1
                        </a>
                        <a href="<?php echo admin_url('admin.php?page=mas-v2-phase2'); ?>" class="button button-small">
                            2️⃣ Faza 2
                        </a>
                    </div>
                </div>
            </div>
            
        </div>
        
    </div>
    
    <!-- Bottom Section: Architecture Overview -->
    <div class="postbox">
        <div class="postbox-header">
            <h2 class="hndle">🏗️ Faza 3: Architektura Ecosystem Integration</h2>
        </div>
        <div class="inside">
            <div class="mas-grid mas-grid-cols-1 mas-md:mas-grid-cols-2 mas-gap-6">
                
                <!-- Achievements -->
                <div>
                    <h3 class="mas-font-bold mas-mb-4">✅ Osiągnięcia Fazy 3:</h3>
                    <ul class="mas-space-y-2">
                        <li class="mas-flex mas-items-start mas-gap-2">
                            <span class="mas-text-green-500">✓</span>
                            <span><strong>Hooks System:</strong> <?php echo $total_hooks; ?> hooks i filters dla developers</span>
                        </li>
                        <li class="mas-flex mas-items-start mas-gap-2">
                            <span class="mas-text-green-500">✓</span>
                            <span><strong>Gutenberg Blocks:</strong> <?php echo $total_blocks; ?> niestandardowych bloków</span>
                        </li>
                        <li class="mas-flex mas-items-start mas-gap-2">
                            <span class="mas-text-green-500">✓</span>
                            <span><strong>Developer API:</strong> REST endpoints dla hooks i bloków</span>
                        </li>
                        <li class="mas-flex mas-items-start mas-gap-2">
                            <span class="mas-text-green-500">✓</span>
                            <span><strong>Live Documentation:</strong> Automatyczna dokumentacja hooks</span>
                        </li>
                        <li class="mas-flex mas-items-start mas-gap-2">
                            <span class="mas-text-green-500">✓</span>
                            <span><strong>Performance Tracking:</strong> Statystyki wykonania hooks</span>
                        </li>
                        <li class="mas-flex mas-items-start mas-gap-2">
                            <span class="mas-text-green-500">✓</span>
                            <span><strong>Theme Integration:</strong> Kompatybilność z wszystkimi themes</span>
                        </li>
                    </ul>
                </div>
                
                <!-- Technical Benefits -->
                <div>
                    <h3 class="mas-font-bold mas-mb-4">🚀 Korzyści Techniczne:</h3>
                    <ul class="mas-space-y-2">
                        <li class="mas-flex mas-items-start mas-gap-2">
                            <span class="mas-text-blue-500">🔧</span>
                            <span><strong>Extensibility:</strong> Maksymalna rozszerzalność przez hooks</span>
                        </li>
                        <li class="mas-flex mas-items-start mas-gap-2">
                            <span class="mas-text-blue-500">📝</span>
                            <span><strong>Block Editor:</strong> Pełna integracja z Gutenberg</span>
                        </li>
                        <li class="mas-flex mas-items-start mas-gap-2">
                            <span class="mas-text-blue-500">🔌</span>
                            <span><strong>Plugin Integration:</strong> Łatwa integracja z innymi pluginami</span>
                        </li>
                        <li class="mas-flex mas-items-start mas-gap-2">
                            <span class="mas-text-blue-500">📊</span>
                            <span><strong>Performance Monitoring:</strong> Śledzenie wydajności hooks</span>
                        </li>
                        <li class="mas-flex mas-items-start mas-gap-2">
                            <span class="mas-text-blue-500">🛡️</span>
                            <span><strong>Security:</strong> Bezpieczne API z proper permissions</span>
                        </li>
                        <li class="mas-flex mas-items-start mas-gap-2">
                            <span class="mas-text-blue-500">📚</span>
                            <span><strong>Documentation:</strong> Auto-generated hooks documentation</span>
                        </li>
                    </ul>
                </div>
                
            </div>
            
            <!-- Final Summary -->
            <div class="mas-mt-6 mas-p-4 mas-bg-gradient-to-r mas-from-green-50 mas-to-blue-50 mas-rounded mas-border-l-4 mas-border-green-500">
                <h4 class="mas-font-bold mas-text-lg mas-mb-2">🎉 Transformacja Zakończona!</h4>
                <p class="mas-text-sm mas-mb-3">
                    Modern Admin Styler V2 został w pełni przekształcony z standalone aplikacji w natywny komponent WordPress 
                    z maksymalną rozszerzalnością i integracją z ekosystemem.
                </p>
                <div class="mas-grid mas-grid-cols-3 mas-gap-4 mas-text-center mas-text-xs">
                    <div>
                        <div class="mas-font-bold mas-text-green-600">FAZA 1</div>
                        <div>WordPress APIs</div>
                    </div>
                    <div>
                        <div class="mas-font-bold mas-text-blue-600">FAZA 2</div>
                        <div>Native Components</div>
                    </div>
                    <div>
                        <div class="mas-font-bold mas-text-purple-600">FAZA 3</div>
                        <div>Ecosystem Integration</div>
                    </div>
                </div>
            </div>
            
        </div>
    </div>
    
</div>

<!-- Modal for displaying information -->
<div id="mas-info-modal" class="mas-modal" style="display: none;">
    <div class="mas-modal-content">
        <div class="mas-modal-header">
            <h3 id="mas-modal-title">Information</h3>
            <span class="mas-modal-close" onclick="masCloseModal()">&times;</span>
        </div>
        <div class="mas-modal-body" id="mas-modal-body">
            <!-- Content will be loaded here -->
        </div>
    </div>
</div>

<style>
.mas-modal {
    position: fixed;
    z-index: 100000;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0,0,0,0.5);
}

.mas-modal-content {
    background-color: #fefefe;
    margin: 5% auto;
    padding: 0;
    border: none;
    border-radius: 8px;
    width: 90%;
    max-width: 800px;
    max-height: 80vh;
    overflow: hidden;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.mas-modal-header {
    padding: 20px;
    background: #f8f9fa;
    border-bottom: 1px solid #dee2e6;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.mas-modal-header h3 {
    margin: 0;
    font-size: 18px;
}

.mas-modal-close {
    color: #aaa;
    font-size: 28px;
    font-weight: bold;
    cursor: pointer;
    line-height: 1;
}

.mas-modal-close:hover {
    color: #000;
}

.mas-modal-body {
    padding: 20px;
    max-height: 60vh;
    overflow-y: auto;
}
</style>

<script>
jQuery(document).ready(function($) {
    
    // Test Hook Functions
    window.masTestHook = function(type) {
        let message = '';
        
        switch(type) {
            case 'css':
                message = 'Hook mas_v2_generated_css został wykonany! Sprawdź DevTools aby zobaczyć dodany CSS.';
                // Dodaj przykładowy CSS do strony
                if (!document.getElementById('mas-test-css')) {
                    const style = document.createElement('style');
                    style.id = 'mas-test-css';
                    style.textContent = `
                        .custom-admin-style {
                            background: linear-gradient(45deg, #667eea, #764ba2) !important;
                            color: white !important;
                            padding: 10px !important;
                            border-radius: 5px !important;
                            margin: 10px 0 !important;
                        }
                    `;
                    document.head.appendChild(style);
                    
                    // Dodaj element testowy
                    const testEl = document.createElement('div');
                    testEl.className = 'custom-admin-style';
                    testEl.textContent = '🎨 Test CSS Hook - Dodano przez mas_v2_generated_css filter!';
                    document.querySelector('.mas-admin-page').insertBefore(testEl, document.querySelector('.mas-admin-page').firstChild);
                }
                break;
                
            case 'validation':
                message = 'Hook mas_v2_validate_custom_settings został przetestowany! W prawdziwym scenariuszu walidowałby dane.';
                break;
                
            case 'component':
                message = 'Hook mas_v2_component_output został przetestowany! Komponenty mogą być modyfikowane przez developers.';
                break;
        }
        
        // Pokaż notice
        const notice = $('<div class="notice notice-success is-dismissible"><p>' + message + '</p></div>');
        $('.mas-admin-page').prepend(notice);
        
        // Auto-hide po 5 sekundach
        setTimeout(function() {
            notice.fadeOut();
        }, 5000);
    };
    
    // Show Hooks Documentation
    window.masShowHooksDoc = function() {
        masShowModal('📚 Dokumentacja Hooks', 'Ładowanie dokumentacji...');
        
        $.get(ajaxurl, {
            action: 'mas_get_hooks_documentation'
        }).done(function(response) {
            if (response.success) {
                let content = '<div class="mas-space-y-4">';
                
                Object.keys(response.data.hooks).forEach(function(hookName) {
                    const hook = response.data.hooks[hookName];
                    content += `
                        <div class="mas-p-4 mas-border mas-rounded">
                            <h4 class="mas-font-bold mas-mb-2">
                                <span class="mas-text-${hook.type === 'action' ? 'green' : 'blue'}-600">${hook.type.toUpperCase()}</span>
                                ${hookName}
                            </h4>
                            <p class="mas-text-sm mas-mb-2">${hook.description}</p>
                            <div class="mas-text-xs mas-bg-gray-100 mas-p-2 mas-rounded">
                                <strong>Callbacks:</strong> ${hook.has_callbacks ? '✅ ' + hook.callbacks.length : '❌ Brak'}
                            </div>
                            <details class="mas-mt-2">
                                <summary class="mas-cursor-pointer mas-text-sm mas-font-bold">Przykład użycia</summary>
                                <pre class="mas-text-xs mas-bg-gray-900 mas-text-green-400 mas-p-2 mas-rounded mas-mt-2 mas-overflow-x-auto"><code>${hook.example}</code></pre>
                            </details>
                        </div>
                    `;
                });
                
                content += '</div>';
                $('#mas-modal-body').html(content);
            }
        });
    };
    
    // Show Hook Stats
    window.masShowHookStats = function() {
        masShowModal('📊 Statystyki Hooks', 'Ładowanie statystyk...');
        
        $.get(ajaxurl, {
            action: 'mas_get_hook_stats'
        }).done(function(response) {
            if (response.success) {
                const stats = response.data.stats;
                const summary = response.data.summary;
                
                let content = `
                    <div class="mas-grid mas-grid-cols-2 mas-gap-4 mas-mb-6">
                        <div class="mas-text-center mas-p-4 mas-bg-blue-50 mas-rounded">
                            <div class="mas-text-2xl mas-font-bold mas-text-blue-600">${summary.total_executions}</div>
                            <div class="mas-text-sm">Całkowite Wykonania</div>
                        </div>
                        <div class="mas-text-center mas-p-4 mas-bg-green-50 mas-rounded">
                            <div class="mas-text-2xl mas-font-bold mas-text-green-600">${Math.round(summary.total_time * 1000)}ms</div>
                            <div class="mas-text-sm">Całkowity Czas</div>
                        </div>
                    </div>
                    <div class="mas-space-y-2">
                `;
                
                Object.keys(stats).forEach(function(hookName) {
                    const stat = stats[hookName];
                    content += `
                        <div class="mas-flex mas-justify-between mas-items-center mas-p-3 mas-bg-gray-50 mas-rounded">
                            <div>
                                <div class="mas-font-bold">${hookName}</div>
                                <div class="mas-text-xs mas-text-gray-600">Ostatnie: ${stat.last_executed}</div>
                            </div>
                            <div class="mas-text-right">
                                <div class="mas-font-bold">${stat.count}x</div>
                                <div class="mas-text-xs">${Math.round(stat.avg_time * 1000)}ms avg</div>
                            </div>
                        </div>
                    `;
                });
                
                content += '</div>';
                $('#mas-modal-body').html(content);
            }
        });
    };
    
    // Show Blocks Info
    window.masShowBlocksInfo = function() {
        masShowModal('📦 Informacje o Blokach', 'Ładowanie informacji o blokach...');
        
        $.get('<?php echo rest_url('mas-v2/v1/blocks'); ?>', {
            headers: {
                'X-WP-Nonce': '<?php echo wp_create_nonce('wp_rest'); ?>'
            }
        }).done(function(response) {
            if (response.success) {
                const blocks = response.data.blocks;
                
                let content = '<div class="mas-space-y-4">';
                
                Object.keys(blocks).forEach(function(blockName) {
                    const block = blocks[blockName];
                    content += `
                        <div class="mas-p-4 mas-border mas-rounded">
                            <h4 class="mas-font-bold mas-mb-2">
                                <span class="dashicons dashicons-${block.icon}"></span>
                                ${block.title}
                            </h4>
                            <p class="mas-text-sm mas-mb-3">${block.description}</p>
                            <div class="mas-text-xs mas-space-y-1">
                                <div><strong>Kategoria:</strong> ${block.category}</div>
                                <div><strong>Keywords:</strong> ${block.keywords.join(', ')}</div>
                                <div><strong>Atrybuty:</strong> ${Object.keys(block.attributes).length}</div>
                            </div>
                        </div>
                    `;
                });
                
                content += '</div>';
                $('#mas-modal-body').html(content);
            }
        });
    };
    
    // Export Hooks Config
    window.masExportHooksConfig = function() {
        $.post(ajaxurl, {
            action: 'mas_export_hooks_config',
            nonce: '<?php echo wp_create_nonce('mas_v2_nonce'); ?>'
        }).done(function(response) {
            if (response.success) {
                // Utwórz i pobierz plik JSON
                const blob = new Blob([response.data], { type: 'application/json' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'mas-v2-hooks-config.json';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
                
                // Pokaż notice
                const notice = $('<div class="notice notice-success is-dismissible"><p>Konfiguracja hooks została wyeksportowana!</p></div>');
                $('.mas-admin-page').prepend(notice);
            }
        });
    };
    
    // Clear Hook Stats
    window.masClearHookStats = function() {
        if (confirm('Czy na pewno chcesz wyczyścić statystyki hooks?')) {
            $.post(ajaxurl, {
                action: 'mas_clear_hook_stats',
                nonce: '<?php echo wp_create_nonce('mas_v2_nonce'); ?>'
            }).done(function(response) {
                if (response.success) {
                    location.reload();
                }
            });
        }
    };
    
    // Modal Functions
    window.masShowModal = function(title, content) {
        $('#mas-modal-title').text(title);
        $('#mas-modal-body').html(content);
        $('#mas-info-modal').show();
    };
    
    window.masCloseModal = function() {
        $('#mas-info-modal').hide();
    };
    
    // Close modal on outside click
    $(document).on('click', '#mas-info-modal', function(e) {
        if (e.target.id === 'mas-info-modal') {
            masCloseModal();
        }
    });
    
    // Close modal on Escape key
    $(document).on('keyup', function(e) {
        if (e.keyCode === 27) { // Escape key
            masCloseModal();
        }
    });
    
});
</script> 