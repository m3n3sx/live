<?php
/**
 * Admin Page - Faza 2: Język wizualny WordPress
 * 
 * Strona admin używająca wyłącznie natywnych WordPress komponentów
 * 
 * @package ModernAdminStyler\Views
 * @version 2.2.0
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

use ModernAdminStyler\Services\ComponentAdapter;

// Pobierz aktualne ustawienia
$settings = $this->settings_manager->getSettings();
$settings_url = admin_url('admin.php?page=modern-admin-styler-settings');

?>

<div class="wrap">
    <h1 class="wp-heading-inline">
        <?php _e('Modern Admin Styler V2', 'woow-admin-styler'); ?>
        <span class="title-count theme-count"><?php _e('Phase 2', 'woow-admin-styler'); ?></span>
    </h1>
    
    <a href="<?php echo esc_url($settings_url); ?>" class="page-title-action">
        <?php _e('Plugin Settings', 'woow-admin-styler'); ?>
    </a>
    
    <hr class="wp-header-end">
    
    <!-- Phase 2 Introduction Notice -->
    <?php echo ComponentAdapter::notice(
        '<strong>' . __('Phase 2: WordPress Visual Language Adaptation', 'woow-admin-styler') . '</strong><br>' .
        __('This page demonstrates the complete transformation to native WordPress components. All custom UI elements have been replaced with standard WordPress components (.postbox, .button, .notice) combined with minimal utility CSS.', 'woow-admin-styler'),
        'info',
        ['dismissible' => true, 'classes' => 'mas-mb-4']
    ); ?>
    
    <!-- Main Content Grid -->
    <div class="mas-grid mas-grid-cols-1 mas-lg:grid-cols-3 mas-gap-6 mas-mt-6">
        
        <!-- Left Column - Main Controls -->
        <div class="mas-col-span-2">
            
            <!-- Quick Actions Metabox -->
            <?php
            $quick_actions_content = '
                <div class="mas-flex mas-flex-wrap mas-gap-3 mas-mb-4">
                    ' . ComponentAdapter::button(__('Live Edit Mode', 'woow-admin-styler'), 'primary', [
                        'icon' => 'admin-appearance',
                        'attributes' => ['onclick' => 'window.location.href="' . esc_js($settings_url) . '"']
                    ]) . '
                    ' . ComponentAdapter::button(__('Settings', 'woow-admin-styler'), 'secondary', [
                        'icon' => 'admin-settings',
                        'attributes' => ['onclick' => 'window.location.href="' . esc_js($settings_url) . '"']
                    ]) . '
                    ' . ComponentAdapter::button(__('Clear Cache', 'woow-admin-styler'), 'secondary', [
                        'icon' => 'update',
                        'id' => 'clear-cache-btn'
                    ]) . '
                    ' . ComponentAdapter::button(__('Export Settings', 'woow-admin-styler'), 'secondary', [
                        'icon' => 'download',
                        'id' => 'export-settings-btn'
                    ]) . '
                </div>
                <p class="description">' . __('Quick access to main plugin functions. Visual options are managed through Live Edit Mode with instant preview.', 'woow-admin-styler') . '</p>
            ';
            
            echo ComponentAdapter::metabox(
                __('Quick Actions', 'woow-admin-styler'),
                $quick_actions_content,
                ['description' => __('Main plugin controls using native WordPress components', 'woow-admin-styler')]
            );
            ?>
            
            <!-- Current Configuration -->
            <?php
            $config_rows = [
                [__('Plugin Status', 'woow-admin-styler'), $settings['enable_plugin'] ? '<span class="dashicons dashicons-yes-alt" style="color: #00a32a;"></span> ' . __('Enabled', 'woow-admin-styler') : '<span class="dashicons dashicons-dismiss" style="color: #d63638;"></span> ' . __('Disabled', 'woow-admin-styler')],
                [__('Color Scheme', 'woow-admin-styler'), ucfirst($settings['color_scheme'] ?? 'default')],
                [__('Admin Bar', 'woow-admin-styler'), $settings['admin_bar_floating'] ? __('Floating', 'woow-admin-styler') : __('Fixed', 'woow-admin-styler')],
                [__('Side Menu', 'woow-admin-styler'), $settings['side_menu_floating'] ? __('Floating', 'woow-admin-styler') : __('Fixed', 'woow-admin-styler')],
                [__('Glassmorphism', 'woow-admin-styler'), $settings['enable_glassmorphism'] ? __('Enabled', 'woow-admin-styler') : __('Disabled', 'woow-admin-styler')],
                [__('Animations', 'woow-admin-styler'), $settings['enable_animations'] ? __('Enabled', 'woow-admin-styler') : __('Disabled', 'woow-admin-styler')]
            ];
            
            $config_content = ComponentAdapter::table(
                [__('Setting', 'woow-admin-styler'), __('Current Value', 'woow-admin-styler')],
                $config_rows,
                ['id' => 'current-config-table']
            );
            
            echo ComponentAdapter::metabox(
                __('Current Configuration', 'woow-admin-styler'),
                $config_content,
                ['description' => __('Overview of current plugin settings', 'woow-admin-styler')]
            );
            ?>
            
            <!-- Phase 2 Features -->
            <?php
            $features_content = '
                <div class="mas-grid mas-grid-cols-1 mas-md:grid-cols-2 mas-gap-4">
                    <div class="mas-wp-card mas-p-4">
                        <h4 class="mas-mt-0 mas-mb-2">' . __('Native Components', 'woow-admin-styler') . '</h4>
                        <ul class="mas-mb-0">
                            <li><span class="dashicons dashicons-yes"></span> ' . __('WordPress .postbox metaboxes', 'woow-admin-styler') . '</li>
                            <li><span class="dashicons dashicons-yes"></span> ' . __('Native .button classes', 'woow-admin-styler') . '</li>
                            <li><span class="dashicons dashicons-yes"></span> ' . __('Standard .notice components', 'woow-admin-styler') . '</li>
                            <li><span class="dashicons dashicons-yes"></span> ' . __('WordPress form fields', 'woow-admin-styler') . '</li>
                            <li><span class="dashicons dashicons-yes"></span> ' . __('Native .wp-list-table', 'woow-admin-styler') . '</li>
                        </ul>
                    </div>
                    
                    <div class="mas-wp-card mas-p-4">
                        <h4 class="mas-mt-0 mas-mb-2">' . __('Minimal CSS', 'woow-admin-styler') . '</h4>
                        <ul class="mas-mb-0">
                            <li><span class="dashicons dashicons-yes"></span> ' . __('Prefixed utilities (mas-)', 'woow-admin-styler') . '</li>
                            <li><span class="dashicons dashicons-yes"></span> ' . __('Only missing WordPress classes', 'woow-admin-styler') . '</li>
                            <li><span class="dashicons dashicons-yes"></span> ' . __('Responsive utilities', 'woow-admin-styler') . '</li>
                            <li><span class="dashicons dashicons-yes"></span> ' . __('WordPress color variables', 'woow-admin-styler') . '</li>
                            <li><span class="dashicons dashicons-yes"></span> ' . __('Dark mode support', 'woow-admin-styler') . '</li>
                        </ul>
                    </div>
                </div>
            ';
            
            echo ComponentAdapter::metabox(
                __('Phase 2 Achievements', 'woow-admin-styler'),
                $features_content,
                ['description' => __('Complete WordPress visual language adaptation', 'woow-admin-styler')]
            );
            ?>
            
        </div>
        
        <!-- Right Column - Sidebar -->
        <div class="mas-col-span-1">
            
            <!-- Component Demo -->
            <?php
            $demo_content = '
                <div class="mas-flex mas-flex-col mas-gap-3">
                    <h4 class="mas-mt-0">' . __('Button Styles', 'woow-admin-styler') . '</h4>
                    <div class="mas-flex mas-flex-wrap mas-gap-2">
                        ' . ComponentAdapter::button(__('Primary', 'woow-admin-styler'), 'primary', ['size' => 'small']) . '
                        ' . ComponentAdapter::button(__('Secondary', 'woow-admin-styler'), 'secondary', ['size' => 'small']) . '
                        ' . ComponentAdapter::button(__('Link', 'woow-admin-styler'), 'link', ['size' => 'small']) . '
                    </div>
                    
                    <h4 class="mas-mb-2">' . __('Notice Types', 'woow-admin-styler') . '</h4>
                    ' . ComponentAdapter::notice(__('Success message', 'woow-admin-styler'), 'success', ['inline' => true]) . '
                    ' . ComponentAdapter::notice(__('Warning message', 'woow-admin-styler'), 'warning', ['inline' => true]) . '
                    ' . ComponentAdapter::notice(__('Error message', 'woow-admin-styler'), 'error', ['inline' => true]) . '
                    
                    <h4 class="mas-mb-2">' . __('Form Fields', 'woow-admin-styler') . '</h4>
                    ' . ComponentAdapter::field('text', 'demo_text', 'Sample text', ['label' => __('Text Field', 'woow-admin-styler'), 'placeholder' => __('Enter text...', 'woow-admin-styler')]) . '
                    ' . ComponentAdapter::field('select', 'demo_select', 'option2', [
                        'label' => __('Select Field', 'woow-admin-styler'),
                        'options' => [
                            'option1' => __('Option 1', 'woow-admin-styler'),
                            'option2' => __('Option 2', 'woow-admin-styler'),
                            'option3' => __('Option 3', 'woow-admin-styler')
                        ]
                    ]) . '
                    ' . ComponentAdapter::field('checkbox', 'demo_checkbox', true, ['label' => __('Checkbox Field', 'woow-admin-styler')]) . '
                </div>
            ';
            
            echo ComponentAdapter::metabox(
                __('Component Demo', 'woow-admin-styler'),
                $demo_content,
                ['description' => __('Native WordPress components in action', 'woow-admin-styler')]
            );
            ?>
            
            <!-- Architecture Info -->
            <?php
            $architecture_content = '
                <div class="mas-text-sm">
                    <h4 class="mas-mt-0 mas-mb-3">' . __('Technical Implementation', 'woow-admin-styler') . '</h4>
                    
                    <div class="mas-mb-4">
                        <strong>' . __('ComponentAdapter Service', 'woow-admin-styler') . '</strong>
                        <p class="description mas-mt-1">' . __('Transforms custom components into native WordPress equivalents using filter hooks.', 'woow-admin-styler') . '</p>
                    </div>
                    
                    <div class="mas-mb-4">
                        <strong>' . __('MAS Utilities CSS', 'woow-admin-styler') . '</strong>
                        <p class="description mas-mt-1">' . __('Minimal utility classes with mas- prefix. Only includes what WordPress lacks.', 'woow-admin-styler') . '</p>
                    </div>
                    
                    <div class="mas-mb-4">
                        <strong>' . __('100% WordPress Native', 'woow-admin-styler') . '</strong>
                        <p class="description mas-mt-1">' . __('Uses .postbox, .button, .notice, .wp-list-table and other standard WordPress classes.', 'woow-admin-styler') . '</p>
                    </div>
                    
                    <div class="mas-btn-group mas-mt-4">
                        ' . ComponentAdapter::button(__('View Code', 'woow-admin-styler'), 'link', ['size' => 'small', 'attributes' => ['onclick' => 'toggleCodeView()']]) . '
                        ' . ComponentAdapter::button(__('Inspect CSS', 'woow-admin-styler'), 'link', ['size' => 'small', 'attributes' => ['onclick' => 'inspectCSS()']]) . '
                    </div>
                </div>
            ';
            
            echo ComponentAdapter::metabox(
                __('Architecture', 'woow-admin-styler'),
                $architecture_content,
                ['description' => __('Phase 2 technical details', 'woow-admin-styler')]
            );
            ?>
            
            <!-- Next Phase Preview -->
            <?php
            $next_phase_content = '
                <div class="mas-text-center mas-py-4">
                    <span class="dashicons dashicons-admin-plugins" style="font-size: 48px; color: #0073aa; opacity: 0.7;"></span>
                    <h4 class="mas-mt-2 mas-mb-3">' . __('Phase 3 Preview', 'woow-admin-styler') . '</h4>
                    <p class="description mas-mb-4">' . __('Next: Ecosystem Integration with hooks, filters, and Gutenberg blocks for maximum extensibility.', 'woow-admin-styler') . '</p>
                    ' . ComponentAdapter::button(__('Coming Soon', 'woow-admin-styler'), 'secondary', ['disabled' => true, 'classes' => 'mas-opacity-50']) . '
                </div>
            ';
            
            echo ComponentAdapter::metabox(
                __('What\'s Next?', 'woow-admin-styler'),
                $next_phase_content
            );
            ?>
            
        </div>
        
    </div>
    
    <!-- Hidden Code View -->
    <div id="code-view" class="mas-hidden mas-mt-6">
        <?php
        $code_content = '
            <div class="mas-bg-gray-100 mas-p-4 mas-rounded mas-overflow-x-auto">
                <h4 class="mas-mt-0">' . __('Component Usage Example', 'woow-admin-styler') . '</h4>
                <pre><code>// Native WordPress metabox
echo ComponentAdapter::metabox(
    __("Title", "textdomain"),
    $content,
    ["description" => __("Description", "textdomain")]
);

// Native WordPress button
echo ComponentAdapter::button(
    __("Click Me", "textdomain"), 
    "primary",
    ["icon" => "admin-settings"]
);

// Native WordPress notice
echo ComponentAdapter::notice(
    __("Success message", "textdomain"),
    "success",
    ["dismissible" => true]
);

// Native WordPress form field
echo ComponentAdapter::field(
    "text",
    "field_name",
    $value,
    ["label" => __("Label", "textdomain")]
);</code></pre>
            </div>
        ';
        
        echo ComponentAdapter::metabox(
            __('Code Examples', 'woow-admin-styler'),
            $code_content
        );
        ?>
    </div>
    
</div>

<!-- JavaScript for interactive features -->
<script>
jQuery(document).ready(function($) {
    
    // Clear Cache functionality
    $('#clear-cache-btn').on('click', function() {
        var button = $(this);
        button.prop('disabled', true).text('<?php _e('Clearing...', 'woow-admin-styler'); ?>');
        
        $.post(ajaxurl, {
            action: 'mas_v2_clear_cache',
            nonce: '<?php echo wp_create_nonce('mas_v2_clear_cache'); ?>'
        })
        .done(function(response) {
            if (response.success) {
                button.after('<div class="notice notice-success inline mas-ml-2"><p><?php _e('Cache cleared successfully!', 'woow-admin-styler'); ?></p></div>');
            } else {
                button.after('<div class="notice notice-error inline mas-ml-2"><p><?php _e('Error clearing cache.', 'woow-admin-styler'); ?></p></div>');
            }
        })
        .always(function() {
            button.prop('disabled', false).text('<?php _e('Clear Cache', 'woow-admin-styler'); ?>');
            setTimeout(function() {
                $('.notice.inline').fadeOut();
            }, 3000);
        });
    });
    
    // Export Settings functionality
    $('#export-settings-btn').on('click', function() {
        var settings = <?php echo json_encode($settings); ?>;
        var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(settings, null, 2));
        var downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "mas-v2-settings-" + new Date().toISOString().split('T')[0] + ".json");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
        
        $(this).after('<div class="notice notice-success inline mas-ml-2"><p><?php _e('Settings exported!', 'woow-admin-styler'); ?></p></div>');
        setTimeout(function() {
            $('.notice.inline').fadeOut();
        }, 3000);
    });
    
});

// Toggle code view
function toggleCodeView() {
    var codeView = document.getElementById('code-view');
    if (codeView.classList.contains('mas-hidden')) {
        codeView.classList.remove('mas-hidden');
    } else {
        codeView.classList.add('mas-hidden');
    }
}

// Inspect CSS
function inspectCSS() {
    if (typeof window.DevToolsAPI !== 'undefined') {
        window.DevToolsAPI.inspectElement(document.querySelector('.mas-utilities'));
    } else {
        alert('<?php _e('Please use browser developer tools to inspect CSS classes starting with "mas-"', 'woow-admin-styler'); ?>');
    }
}
</script>

<!-- CSS for additional styling -->
<style>
.mas-form-label {
    display: block;
    font-weight: 600;
    margin-bottom: 0.5rem;
}

.title-count {
    background: #0073aa;
    color: white;
    padding: 2px 8px;
    border-radius: 3px;
    font-size: 12px;
    font-weight: normal;
    margin-left: 8px;
}

.mas-btn-group {
    display: inline-flex;
    vertical-align: middle;
}

.mas-btn-group .button {
    margin-right: -1px;
    border-radius: 0;
}

.mas-btn-group .button:first-child {
    border-top-left-radius: 3px;
    border-bottom-left-radius: 3px;
}

.mas-btn-group .button:last-child {
    border-top-right-radius: 3px;
    border-bottom-right-radius: 3px;
    margin-right: 0;
}

pre {
    background: #f6f7f7;
    border: 1px solid #c3c4c7;
    border-radius: 4px;
    padding: 1rem;
    overflow-x: auto;
    font-family: Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace;
    font-size: 13px;
    line-height: 1.4;
}

code {
    background: transparent;
    padding: 0;
    font-family: inherit;
}

.postbox .inside > *:first-child {
    margin-top: 0;
}

.postbox .inside > *:last-child {
    margin-bottom: 0;
}

@media (max-width: 768px) {
    .mas-btn-group {
        flex-direction: column;
    }
    
    .mas-btn-group .button {
        margin-right: 0;
        margin-bottom: -1px;
        border-radius: 0;
    }
    
    .mas-btn-group .button:first-child {
        border-top-left-radius: 3px;
        border-top-right-radius: 3px;
        border-bottom-left-radius: 0;
    }
    
    .mas-btn-group .button:last-child {
        border-bottom-left-radius: 3px;
        border-bottom-right-radius: 3px;
        border-top-right-radius: 0;
        margin-bottom: 0;
    }
}
</style> 