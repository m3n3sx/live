<?php
/**
 * Gutenberg Manager Service
 * 
 * Faza 3: Ecosystem Integration
 * Zarządza integracją z edytorem blokowym WordPress (Gutenberg)
 * 
 * @package ModernAdminStyler\Services
 * @version 3.0.0
 */

namespace ModernAdminStyler\Services;

class GutenbergManager {
    
    private $settings_manager;
    private $registered_blocks = [];
    private $block_categories = [];
    
    public function __construct($settings_manager) {
        $this->settings_manager = $settings_manager;
        $this->init();
    }
    
    /**
     * Inicjalizacja Gutenberg Manager
     */
    public function init() {
        // Sprawdź czy Gutenberg jest dostępny
        if (!function_exists('register_block_type')) {
            return;
        }
        
        // Rejestruj hooks dla Gutenberg
        add_action('init', [$this, 'registerBlocks']);
        add_action('enqueue_block_editor_assets', [$this, 'enqueueBlockEditorAssets']);
        add_action('enqueue_block_assets', [$this, 'enqueueBlockAssets']);
        
        // Dodaj niestandardowe kategorie bloków
        add_filter('block_categories_all', [$this, 'addBlockCategories'], 10, 2);
        
        // Modyfikuj editor styles
        add_action('after_setup_theme', [$this, 'addEditorStyles']);
        
        // Dodaj REST endpoints dla bloków
        add_action('rest_api_init', [$this, 'registerBlockRestEndpoints']);
        
        // Integracja z MAS settings
        add_filter('mas_v2_generated_css', [$this, 'addGutenbergStyles'], 10, 2);
    }
    
    /**
     * Rejestruje bloki MAS
     */
    public function registerBlocks() {
        // Blok: Admin Style Preview
        $this->registerBlock('mas-admin-preview', [
            'title' => __('Admin Style Preview', 'modern-admin-styler-v2'),
            'description' => __('Preview how admin interface looks with current MAS settings', 'modern-admin-styler-v2'),
            'category' => 'mas-blocks',
            'icon' => 'admin-appearance',
            'keywords' => ['admin', 'preview', 'style'],
            'attributes' => [
                'previewType' => [
                    'type' => 'string',
                    'default' => 'admin-bar'
                ],
                'showSettings' => [
                    'type' => 'boolean',
                    'default' => true
                ]
            ],
            'render_callback' => [$this, 'renderAdminPreviewBlock']
        ]);
        
        // Blok: Color Scheme Selector
        $this->registerBlock('mas-color-scheme', [
            'title' => __('Color Scheme Selector', 'modern-admin-styler-v2'),
            'description' => __('Allow users to switch between color schemes', 'modern-admin-styler-v2'),
            'category' => 'mas-blocks',
            'icon' => 'art',
            'keywords' => ['color', 'scheme', 'theme'],
            'attributes' => [
                'allowedSchemes' => [
                    'type' => 'array',
                    'default' => ['light', 'dark', 'auto']
                ],
                'showPreview' => [
                    'type' => 'boolean',
                    'default' => true
                ],
                'layout' => [
                    'type' => 'string',
                    'default' => 'horizontal'
                ]
            ],
            'render_callback' => [$this, 'renderColorSchemeBlock']
        ]);
        
        // Blok: Settings Dashboard
        $this->registerBlock('mas-settings-dashboard', [
            'title' => __('MAS Settings Dashboard', 'modern-admin-styler-v2'),
            'description' => __('Quick access to MAS settings and controls', 'modern-admin-styler-v2'),
            'category' => 'mas-blocks',
            'icon' => 'admin-settings',
            'keywords' => ['settings', 'dashboard', 'admin'],
            'attributes' => [
                'sections' => [
                    'type' => 'array',
                    'default' => ['general', 'colors', 'layout']
                ],
                'compactMode' => [
                    'type' => 'boolean',
                    'default' => false
                ]
            ],
            'render_callback' => [$this, 'renderSettingsDashboardBlock']
        ]);
        
        // Blok: Performance Metrics
        $this->registerBlock('mas-performance-metrics', [
            'title' => __('MAS Performance Metrics', 'modern-admin-styler-v2'),
            'description' => __('Display performance metrics and optimization tips', 'modern-admin-styler-v2'),
            'category' => 'mas-blocks',
            'icon' => 'performance',
            'keywords' => ['performance', 'metrics', 'optimization'],
            'attributes' => [
                'showCharts' => [
                    'type' => 'boolean',
                    'default' => true
                ],
                'metricsToShow' => [
                    'type' => 'array',
                    'default' => ['load-time', 'css-size', 'cache-hits']
                ]
            ],
            'render_callback' => [$this, 'renderPerformanceMetricsBlock']
        ]);
        
        // Blok: CSS Variable Inspector
        $this->registerBlock('mas-css-inspector', [
            'title' => __('CSS Variable Inspector', 'modern-admin-styler-v2'),
            'description' => __('Inspect and modify CSS variables in real-time', 'modern-admin-styler-v2'),
            'category' => 'mas-blocks',
            'icon' => 'editor-code',
            'keywords' => ['css', 'variables', 'inspector'],
            'attributes' => [
                'variableGroups' => [
                    'type' => 'array',
                    'default' => ['colors', 'spacing', 'typography']
                ],
                'showLivePreview' => [
                    'type' => 'boolean',
                    'default' => true
                ]
            ],
            'render_callback' => [$this, 'renderCSSInspectorBlock']
        ]);
    }
    
    /**
     * Rejestruje pojedynczy blok
     */
    private function registerBlock($name, $config) {
        $this->registered_blocks[$name] = $config;
        
        register_block_type("mas-v2/{$name}", [
            'attributes' => $config['attributes'],
            'render_callback' => $config['render_callback'],
            'editor_script' => 'mas-v2-blocks-editor',
            'editor_style' => 'mas-v2-blocks-editor-style',
            'style' => 'mas-v2-blocks-style'
        ]);
    }
    
    /**
     * Dodaje kategorie bloków MAS
     */
    public function addBlockCategories($categories, $post) {
        array_unshift($categories, [
            'slug' => 'mas-blocks',
            'title' => __('Modern Admin Styler', 'modern-admin-styler-v2'),
            'icon' => 'admin-appearance'
        ]);
        
        return $categories;
    }
    
    /**
     * Ładuje zasoby dla edytora bloków
     */
    public function enqueueBlockEditorAssets() {
        // JavaScript dla edytora bloków
        wp_enqueue_script(
            'mas-v2-blocks-editor',
            MAS_V2_PLUGIN_URL . 'assets/js/blocks-editor.js',
            ['wp-blocks', 'wp-element', 'wp-editor', 'wp-components', 'wp-i18n'],
            MAS_V2_VERSION,
            true
        );
        
        // CSS dla edytora bloków
        wp_enqueue_style(
            'mas-v2-blocks-editor-style',
            MAS_V2_PLUGIN_URL . 'assets/css/blocks-editor.css',
            ['wp-edit-blocks'],
            MAS_V2_VERSION
        );
        
        // Przekaż dane do JavaScript
        wp_localize_script('mas-v2-blocks-editor', 'masBlocks', [
            'apiUrl' => rest_url('mas-v2/v1/'),
            'nonce' => wp_create_nonce('wp_rest'),
            'settings' => $this->settings_manager->getSettings(),
            'blocks' => $this->getBlocksConfig(),
            'i18n' => [
                'adminPreview' => __('Admin Preview', 'modern-admin-styler-v2'),
                'colorScheme' => __('Color Scheme', 'modern-admin-styler-v2'),
                'settings' => __('Settings', 'modern-admin-styler-v2'),
                'performance' => __('Performance', 'modern-admin-styler-v2'),
                'cssInspector' => __('CSS Inspector', 'modern-admin-styler-v2')
            ]
        ]);
    }
    
    /**
     * Ładuje zasoby dla frontendu bloków
     */
    public function enqueueBlockAssets() {
        // CSS dla frontendu bloków
        wp_enqueue_style(
            'mas-v2-blocks-style',
            MAS_V2_PLUGIN_URL . 'assets/css/blocks.css',
            [],
            MAS_V2_VERSION
        );
        
        // JavaScript dla interaktywnych bloków
        wp_enqueue_script(
            'mas-v2-blocks-frontend',
            MAS_V2_PLUGIN_URL . 'assets/js/blocks-frontend.js',
            ['jquery'],
            MAS_V2_VERSION,
            true
        );
    }
    
    /**
     * Dodaje style edytora
     */
    public function addEditorStyles() {
        add_theme_support('editor-styles');
        add_editor_style(MAS_V2_PLUGIN_URL . 'assets/css/editor-styles.css');
    }
    
    /**
     * Renderuje blok Admin Preview
     */
    public function renderAdminPreviewBlock($attributes, $content) {
        $preview_type = $attributes['previewType'] ?? 'admin-bar';
        $show_settings = $attributes['showSettings'] ?? true;
        $settings = $this->settings_manager->getSettings();
        
        ob_start();
        ?>
        <div class="mas-block-admin-preview" data-preview-type="<?php echo esc_attr($preview_type); ?>">
            <div class="mas-preview-container">
                <?php if ($preview_type === 'admin-bar'): ?>
                    <div class="mas-admin-bar-preview" style="
                        height: <?php echo esc_attr($settings['admin_bar_height'] ?? 32); ?>px;
                        background: <?php echo esc_attr($settings['admin_bar_bg_color'] ?? '#23282d'); ?>;
                        color: <?php echo esc_attr($settings['admin_bar_text_color'] ?? '#ffffff'); ?>;
                    ">
                        <span class="ab-item">WordPress Admin Bar Preview</span>
                    </div>
                <?php elseif ($preview_type === 'menu'): ?>
                    <div class="mas-menu-preview" style="
                        width: <?php echo esc_attr($settings['menu_width'] ?? 160); ?>px;
                        background: <?php echo esc_attr($settings['menu_bg_color'] ?? '#23282d'); ?>;
                        color: <?php echo esc_attr($settings['menu_text_color'] ?? '#ffffff'); ?>;
                    ">
                        <ul class="mas-menu-items">
                            <li>Dashboard</li>
                            <li>Posts</li>
                            <li>Media</li>
                            <li>Pages</li>
                        </ul>
                    </div>
                <?php endif; ?>
            </div>
            
            <?php if ($show_settings): ?>
                <div class="mas-preview-settings">
                    <h4><?php _e('Current Settings', 'modern-admin-styler-v2'); ?></h4>
                    <ul>
                        <li><?php _e('Color Scheme:', 'modern-admin-styler-v2'); ?> <?php echo esc_html($settings['color_scheme'] ?? 'default'); ?></li>
                        <li><?php _e('Admin Bar Height:', 'modern-admin-styler-v2'); ?> <?php echo esc_html($settings['admin_bar_height'] ?? 32); ?>px</li>
                        <li><?php _e('Menu Width:', 'modern-admin-styler-v2'); ?> <?php echo esc_html($settings['menu_width'] ?? 160); ?>px</li>
                    </ul>
                </div>
            <?php endif; ?>
        </div>
        <?php
        return ob_get_clean();
    }
    
    /**
     * Renderuje blok Color Scheme
     */
    public function renderColorSchemeBlock($attributes, $content) {
        $allowed_schemes = $attributes['allowedSchemes'] ?? ['light', 'dark', 'auto'];
        $show_preview = $attributes['showPreview'] ?? true;
        $layout = $attributes['layout'] ?? 'horizontal';
        $current_scheme = $this->settings_manager->get_setting('color_scheme', 'light');
        
        ob_start();
        ?>
        <div class="mas-block-color-scheme" data-layout="<?php echo esc_attr($layout); ?>">
            <h3><?php _e('Choose Color Scheme', 'modern-admin-styler-v2'); ?></h3>
            
            <div class="mas-scheme-selector">
                <?php foreach ($allowed_schemes as $scheme): ?>
                    <label class="mas-scheme-option <?php echo $scheme === $current_scheme ? 'active' : ''; ?>">
                        <input type="radio" name="mas_color_scheme" value="<?php echo esc_attr($scheme); ?>" 
                               <?php checked($scheme, $current_scheme); ?>>
                        <span class="mas-scheme-label">
                            <?php echo esc_html(ucfirst($scheme)); ?>
                        </span>
                        <?php if ($show_preview): ?>
                            <div class="mas-scheme-preview mas-scheme-<?php echo esc_attr($scheme); ?>">
                                <div class="mas-preview-bar"></div>
                                <div class="mas-preview-content"></div>
                            </div>
                        <?php endif; ?>
                    </label>
                <?php endforeach; ?>
            </div>
        </div>
        
        <script>
        document.querySelectorAll('input[name="mas_color_scheme"]').forEach(function(input) {
            input.addEventListener('change', function() {
                // AJAX call to update color scheme
                fetch('<?php echo rest_url('mas-v2/v1/settings'); ?>', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-WP-Nonce': '<?php echo wp_create_nonce('wp_rest'); ?>'
                    },
                    body: JSON.stringify({
                        color_scheme: this.value
                    })
                }).then(function(response) {
                    if (response.ok) {
                        location.reload(); // Reload to see changes
                    }
                });
            });
        });
        </script>
        <?php
        return ob_get_clean();
    }
    
    /**
     * Renderuje blok Settings Dashboard
     */
    public function renderSettingsDashboardBlock($attributes, $content) {
        $sections = $attributes['sections'] ?? ['general', 'colors', 'layout'];
        $compact_mode = $attributes['compactMode'] ?? false;
        $settings = $this->settings_manager->getSettings();
        
        ob_start();
        ?>
        <div class="mas-block-settings-dashboard <?php echo $compact_mode ? 'compact' : ''; ?>">
            <h3><?php _e('MAS Settings Dashboard', 'modern-admin-styler-v2'); ?></h3>
            
            <div class="mas-dashboard-sections">
                <?php foreach ($sections as $section): ?>
                    <div class="mas-dashboard-section" data-section="<?php echo esc_attr($section); ?>">
                        <h4><?php echo esc_html(ucfirst($section)); ?></h4>
                        
                        <?php if ($section === 'general'): ?>
                            <div class="mas-setting-item">
                                <label>
                                    <input type="checkbox" <?php checked($settings['enable_plugin'] ?? false); ?>>
                                    <?php _e('Enable Plugin', 'modern-admin-styler-v2'); ?>
                                </label>
                            </div>
                            <div class="mas-setting-item">
                                <label>
                                    <input type="checkbox" <?php checked($settings['enable_animations'] ?? true); ?>>
                                    <?php _e('Enable Animations', 'modern-admin-styler-v2'); ?>
                                </label>
                            </div>
                        <?php elseif ($section === 'colors'): ?>
                            <div class="mas-setting-item">
                                <label><?php _e('Primary Color:', 'modern-admin-styler-v2'); ?></label>
                                <input type="color" value="<?php echo esc_attr($settings['primary_color'] ?? '#0073aa'); ?>">
                            </div>
                            <div class="mas-setting-item">
                                <label><?php _e('Secondary Color:', 'modern-admin-styler-v2'); ?></label>
                                <input type="color" value="<?php echo esc_attr($settings['secondary_color'] ?? '#005a87'); ?>">
                            </div>
                        <?php elseif ($section === 'layout'): ?>
                            <div class="mas-setting-item">
                                <label><?php _e('Admin Bar Height:', 'modern-admin-styler-v2'); ?></label>
                                <input type="range" min="28" max="50" value="<?php echo esc_attr($settings['admin_bar_height'] ?? 32); ?>">
                                <span class="value"><?php echo esc_html($settings['admin_bar_height'] ?? 32); ?>px</span>
                            </div>
                            <div class="mas-setting-item">
                                <label><?php _e('Menu Width:', 'modern-admin-styler-v2'); ?></label>
                                <input type="range" min="140" max="200" value="<?php echo esc_attr($settings['menu_width'] ?? 160); ?>">
                                <span class="value"><?php echo esc_html($settings['menu_width'] ?? 160); ?>px</span>
                            </div>
                        <?php endif; ?>
                    </div>
                <?php endforeach; ?>
            </div>
            
            <div class="mas-dashboard-actions">
                <button class="button button-primary" onclick="masSaveDashboardSettings()">
                    <?php _e('Save Changes', 'modern-admin-styler-v2'); ?>
                </button>
                <a href="<?php echo admin_url('admin.php?page=mas-v2-general'); ?>" class="button">
                    <?php _e('Full Settings', 'modern-admin-styler-v2'); ?>
                </a>
            </div>
        </div>
        <?php
        return ob_get_clean();
    }
    
    /**
     * Renderuje blok Performance Metrics
     */
    public function renderPerformanceMetricsBlock($attributes, $content) {
        $show_charts = $attributes['showCharts'] ?? true;
        $metrics_to_show = $attributes['metricsToShow'] ?? ['load-time', 'css-size', 'cache-hits'];
        
        // Pobierz metryki z MetricsCollector
        $metrics = [];
        if (method_exists($this, 'getPerformanceMetrics')) {
            $metrics = $this->getPerformanceMetrics();
        }
        
        ob_start();
        ?>
        <div class="mas-block-performance-metrics">
            <h3><?php _e('Performance Metrics', 'modern-admin-styler-v2'); ?></h3>
            
            <div class="mas-metrics-grid">
                <?php foreach ($metrics_to_show as $metric): ?>
                    <div class="mas-metric-item" data-metric="<?php echo esc_attr($metric); ?>">
                        <?php if ($metric === 'load-time'): ?>
                            <div class="mas-metric-value"><?php echo esc_html($metrics['load_time'] ?? 'N/A'); ?>ms</div>
                            <div class="mas-metric-label"><?php _e('Load Time', 'modern-admin-styler-v2'); ?></div>
                        <?php elseif ($metric === 'css-size'): ?>
                            <div class="mas-metric-value"><?php echo esc_html($metrics['css_size'] ?? 'N/A'); ?>KB</div>
                            <div class="mas-metric-label"><?php _e('CSS Size', 'modern-admin-styler-v2'); ?></div>
                        <?php elseif ($metric === 'cache-hits'): ?>
                            <div class="mas-metric-value"><?php echo esc_html($metrics['cache_hits'] ?? 'N/A'); ?>%</div>
                            <div class="mas-metric-label"><?php _e('Cache Hits', 'modern-admin-styler-v2'); ?></div>
                        <?php endif; ?>
                    </div>
                <?php endforeach; ?>
            </div>
            
            <?php if ($show_charts): ?>
                <div class="mas-metrics-chart">
                    <canvas id="mas-performance-chart"></canvas>
                </div>
            <?php endif; ?>
        </div>
        <?php
        return ob_get_clean();
    }
    
    /**
     * Renderuje blok CSS Inspector
     */
    public function renderCSSInspectorBlock($attributes, $content) {
        $variable_groups = $attributes['variableGroups'] ?? ['colors', 'spacing', 'typography'];
        $show_live_preview = $attributes['showLivePreview'] ?? true;
        
        ob_start();
        ?>
        <div class="mas-block-css-inspector">
            <h3><?php _e('CSS Variable Inspector', 'modern-admin-styler-v2'); ?></h3>
            
            <div class="mas-inspector-tabs">
                <?php foreach ($variable_groups as $group): ?>
                    <button class="mas-tab-button" data-group="<?php echo esc_attr($group); ?>">
                        <?php echo esc_html(ucfirst($group)); ?>
                    </button>
                <?php endforeach; ?>
            </div>
            
            <div class="mas-inspector-content">
                <?php foreach ($variable_groups as $group): ?>
                    <div class="mas-variable-group" data-group="<?php echo esc_attr($group); ?>">
                        <?php $this->renderVariableGroup($group); ?>
                    </div>
                <?php endforeach; ?>
            </div>
            
            <?php if ($show_live_preview): ?>
                <div class="mas-live-preview">
                    <h4><?php _e('Live Preview', 'modern-admin-styler-v2'); ?></h4>
                    <div class="mas-preview-area" id="mas-css-preview">
                        <!-- Live preview content -->
                    </div>
                </div>
            <?php endif; ?>
        </div>
        <?php
        return ob_get_clean();
    }
    
    /**
     * Renderuje grupę zmiennych CSS
     */
    private function renderVariableGroup($group) {
        $variables = $this->getCSSVariables($group);
        
        foreach ($variables as $variable => $value) {
            echo '<div class="mas-variable-item">';
            echo '<label>' . esc_html($variable) . '</label>';
            
            if (strpos($variable, 'color') !== false) {
                echo '<input type="color" value="' . esc_attr($value) . '" data-variable="' . esc_attr($variable) . '">';
            } elseif (strpos($variable, 'size') !== false || strpos($variable, 'width') !== false) {
                echo '<input type="range" value="' . esc_attr(intval($value)) . '" data-variable="' . esc_attr($variable) . '">';
            } else {
                echo '<input type="text" value="' . esc_attr($value) . '" data-variable="' . esc_attr($variable) . '">';
            }
            
            echo '<span class="mas-variable-value">' . esc_html($value) . '</span>';
            echo '</div>';
        }
    }
    
    /**
     * Zwraca zmienne CSS dla grupy
     */
    private function getCSSVariables($group) {
        $settings = $this->settings_manager->getSettings();
        
        switch ($group) {
            case 'colors':
                return [
                    '--mas-primary' => $settings['primary_color'] ?? '#0073aa',
                    '--mas-secondary' => $settings['secondary_color'] ?? '#005a87',
                    '--mas-accent' => $settings['accent_color'] ?? '#72aee6'
                ];
                
            case 'spacing':
                return [
                    '--mas-admin-bar-height' => ($settings['admin_bar_height'] ?? 32) . 'px',
                    '--mas-menu-width' => ($settings['menu_width'] ?? 160) . 'px',
                    '--mas-menu-margin' => ($settings['menu_margin'] ?? 20) . 'px'
                ];
                
            case 'typography':
                return [
                    '--mas-font-size' => $settings['font_size'] ?? '14px',
                    '--mas-font-family' => $settings['font_family'] ?? 'inherit',
                    '--mas-line-height' => $settings['line_height'] ?? '1.4'
                ];
                
            default:
                return [];
        }
    }
    
    /**
     * Dodaje style Gutenberg do głównego CSS
     */
    public function addGutenbergStyles($css, $settings) {
        $gutenberg_css = "
            /* Gutenberg Editor Enhancements */
            .block-editor-page .edit-post-visual-editor {
                background: var(--mas-background, #f0f0f1);
            }
            
            .block-editor-block-list__layout {
                font-family: var(--mas-font-family, inherit);
            }
            
            .wp-block {
                max-width: none;
            }
            
            /* MAS Blocks Styling */
            .mas-block-admin-preview {
                border: 1px solid var(--mas-border, #c3c4c7);
                border-radius: 4px;
                padding: 1rem;
                margin: 1rem 0;
                background: var(--mas-surface, #ffffff);
            }
            
            .mas-block-color-scheme {
                padding: 1rem;
                border: 1px solid var(--mas-border, #c3c4c7);
                border-radius: 4px;
            }
            
            .mas-scheme-selector {
                display: flex;
                gap: 1rem;
                flex-wrap: wrap;
            }
            
            .mas-scheme-option {
                display: flex;
                flex-direction: column;
                align-items: center;
                padding: 0.5rem;
                border: 2px solid transparent;
                border-radius: 4px;
                cursor: pointer;
                transition: all 0.2s ease;
            }
            
            .mas-scheme-option.active {
                border-color: var(--mas-primary, #0073aa);
                background: var(--mas-surface, #ffffff);
            }
            
            .mas-scheme-preview {
                width: 60px;
                height: 40px;
                border-radius: 2px;
                margin-top: 0.5rem;
                display: flex;
                flex-direction: column;
            }
            
            .mas-scheme-light .mas-preview-bar {
                background: #23282d;
                height: 30%;
            }
            
            .mas-scheme-light .mas-preview-content {
                background: #f0f0f1;
                height: 70%;
            }
            
            .mas-scheme-dark .mas-preview-bar {
                background: #1e1e1e;
                height: 30%;
            }
            
            .mas-scheme-dark .mas-preview-content {
                background: #2d2d2d;
                height: 70%;
            }
        ";
        
        return $css . $gutenberg_css;
    }
    
    /**
     * Rejestruje REST endpoints dla bloków
     */
    public function registerBlockRestEndpoints() {
        register_rest_route('mas-v2/v1', '/blocks', [
            'methods' => 'GET',
            'callback' => [$this, 'getBlocksInfo'],
            'permission_callback' => '__return_true'
        ]);
        
        register_rest_route('mas-v2/v1', '/blocks/(?P<block_name>[a-zA-Z0-9-]+)', [
            'methods' => 'GET',
            'callback' => [$this, 'getBlockInfo'],
            'permission_callback' => '__return_true'
        ]);
    }
    
    /**
     * REST endpoint: Informacje o blokach
     */
    public function getBlocksInfo($request) {
        return rest_ensure_response([
            'success' => true,
            'data' => [
                'blocks' => $this->registered_blocks,
                'total' => count($this->registered_blocks)
            ]
        ]);
    }
    
    /**
     * REST endpoint: Informacje o konkretnym bloku
     */
    public function getBlockInfo($request) {
        $block_name = $request->get_param('block_name');
        
        if (!isset($this->registered_blocks[$block_name])) {
            return new \WP_Error('block_not_found', 'Block not found', ['status' => 404]);
        }
        
        return rest_ensure_response([
            'success' => true,
            'data' => $this->registered_blocks[$block_name]
        ]);
    }
    
    /**
     * Zwraca konfigurację bloków dla JavaScript
     */
    private function getBlocksConfig() {
        return array_map(function($block) {
            return [
                'title' => $block['title'],
                'description' => $block['description'],
                'category' => $block['category'],
                'icon' => $block['icon'],
                'keywords' => $block['keywords'],
                'attributes' => $block['attributes']
            ];
        }, $this->registered_blocks);
    }
    
    /**
     * Sprawdza czy Gutenberg jest aktywny
     */
    public function isGutenbergActive() {
        return function_exists('register_block_type');
    }
    
    /**
     * Zwraca listę zarejestrowanych bloków
     */
    public function getRegisteredBlocks() {
        return $this->registered_blocks;
    }
} 