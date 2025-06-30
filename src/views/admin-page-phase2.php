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
$customizer_url = admin_url('customize.php?autofocus[panel]=mas_v2_panel&url=' . urlencode(admin_url('index.php')));
$settings_url = admin_url('admin.php?page=modern-admin-styler-settings');

?>

<div class="wrap">
    <h1 class="wp-heading-inline">
        <?php _e('Modern Admin Styler V2', 'modern-admin-styler-v2'); ?>
        <span class="title-count theme-count"><?php _e('Phase 2', 'modern-admin-styler-v2'); ?></span>
    </h1>
    
    <a href="<?php echo esc_url($customizer_url); ?>" class="page-title-action">
        <?php _e('Customize Appearance', 'modern-admin-styler-v2'); ?>
    </a>
    
    <hr class="wp-header-end">
    
    <!-- Phase 2 Introduction Notice -->
    <?php echo ComponentAdapter::notice(
        '<strong>' . __('Phase 2: WordPress Visual Language Adaptation', 'modern-admin-styler-v2') . '</strong><br>' .
        __('This page demonstrates the complete transformation to native WordPress components. All custom UI elements have been replaced with standard WordPress components (.postbox, .button, .notice) combined with minimal utility CSS.', 'modern-admin-styler-v2'),
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
                    ' . ComponentAdapter::button(__('Visual Customizer', 'modern-admin-styler-v2'), 'primary', [
                        'icon' => 'admin-customizer',
                        'attributes' => ['onclick' => 'window.open("' . esc_js($customizer_url) . '", "_blank")']
                    ]) . '
                    ' . ComponentAdapter::button(__('Functional Settings', 'modern-admin-styler-v2'), 'secondary', [
                        'icon' => 'admin-settings',
                        'attributes' => ['onclick' => 'window.location.href="' . esc_js($settings_url) . '"']
                    ]) . '
                    ' . ComponentAdapter::button(__('Clear Cache', 'modern-admin-styler-v2'), 'secondary', [
                        'icon' => 'update',
                        'id' => 'clear-cache-btn'
                    ]) . '
                    ' . ComponentAdapter::button(__('Export Settings', 'modern-admin-styler-v2'), 'secondary', [
                        'icon' => 'download',
                        'id' => 'export-settings-btn'
                    ]) . '
                </div>
                <p class="description">' . __('Quick access to main plugin functions. Visual options are managed through WordPress Customizer, functional options through Settings API.', 'modern-admin-styler-v2') . '</p>
            ';
            
            echo ComponentAdapter::metabox(
                __('Quick Actions', 'modern-admin-styler-v2'),
                $quick_actions_content,
                ['description' => __('Main plugin controls using native WordPress components', 'modern-admin-styler-v2')]
            );
            ?>
            
            <!-- Current Configuration -->
            <?php
            $config_rows = [
                [__('Plugin Status', 'modern-admin-styler-v2'), $settings['enable_plugin'] ? '<span class="dashicons dashicons-yes-alt" style="color: #00a32a;"></span> ' . __('Enabled', 'modern-admin-styler-v2') : '<span class="dashicons dashicons-dismiss" style="color: #d63638;"></span> ' . __('Disabled', 'modern-admin-styler-v2')],
                [__('Color Scheme', 'modern-admin-styler-v2'), ucfirst($settings['color_scheme'] ?? 'default')],
                [__('Admin Bar', 'modern-admin-styler-v2'), $settings['admin_bar_floating'] ? __('Floating', 'modern-admin-styler-v2') : __('Fixed', 'modern-admin-styler-v2')],
                [__('Side Menu', 'modern-admin-styler-v2'), $settings['side_menu_floating'] ? __('Floating', 'modern-admin-styler-v2') : __('Fixed', 'modern-admin-styler-v2')],
                [__('Glassmorphism', 'modern-admin-styler-v2'), $settings['enable_glassmorphism'] ? __('Enabled', 'modern-admin-styler-v2') : __('Disabled', 'modern-admin-styler-v2')],
                [__('Animations', 'modern-admin-styler-v2'), $settings['enable_animations'] ? __('Enabled', 'modern-admin-styler-v2') : __('Disabled', 'modern-admin-styler-v2')]
            ];
            
            $config_content = ComponentAdapter::table(
                [__('Setting', 'modern-admin-styler-v2'), __('Current Value', 'modern-admin-styler-v2')],
                $config_rows,
                ['id' => 'current-config-table']
            );
            
            echo ComponentAdapter::metabox(
                __('Current Configuration', 'modern-admin-styler-v2'),
                $config_content,
                ['description' => __('Overview of current plugin settings', 'modern-admin-styler-v2')]
            );
            ?>
            
            <!-- Phase 2 Features -->
            <?php
            $features_content = '
                <div class="mas-grid mas-grid-cols-1 mas-md:grid-cols-2 mas-gap-4">
                    <div class="mas-wp-card mas-p-4">
                        <h4 class="mas-mt-0 mas-mb-2">' . __('Native Components', 'modern-admin-styler-v2') . '</h4>
                        <ul class="mas-mb-0">
                            <li><span class="dashicons dashicons-yes"></span> ' . __('WordPress .postbox metaboxes', 'modern-admin-styler-v2') . '</li>
                            <li><span class="dashicons dashicons-yes"></span> ' . __('Native .button classes', 'modern-admin-styler-v2') . '</li>
                            <li><span class="dashicons dashicons-yes"></span> ' . __('Standard .notice components', 'modern-admin-styler-v2') . '</li>
                            <li><span class="dashicons dashicons-yes"></span> ' . __('WordPress form fields', 'modern-admin-styler-v2') . '</li>
                            <li><span class="dashicons dashicons-yes"></span> ' . __('Native .wp-list-table', 'modern-admin-styler-v2') . '</li>
                        </ul>
                    </div>
                    
                    <div class="mas-wp-card mas-p-4">
                        <h4 class="mas-mt-0 mas-mb-2">' . __('Minimal CSS', 'modern-admin-styler-v2') . '</h4>
                        <ul class="mas-mb-0">
                            <li><span class="dashicons dashicons-yes"></span> ' . __('Prefixed utilities (mas-)', 'modern-admin-styler-v2') . '</li>
                            <li><span class="dashicons dashicons-yes"></span> ' . __('Only missing WordPress classes', 'modern-admin-styler-v2') . '</li>
                            <li><span class="dashicons dashicons-yes"></span> ' . __('Responsive utilities', 'modern-admin-styler-v2') . '</li>
                            <li><span class="dashicons dashicons-yes"></span> ' . __('WordPress color variables', 'modern-admin-styler-v2') . '</li>
                            <li><span class="dashicons dashicons-yes"></span> ' . __('Dark mode support', 'modern-admin-styler-v2') . '</li>
                        </ul>
                    </div>
                </div>
            ';
            
            echo ComponentAdapter::metabox(
                __('Phase 2 Achievements', 'modern-admin-styler-v2'),
                $features_content,
                ['description' => __('Complete WordPress visual language adaptation', 'modern-admin-styler-v2')]
            );
            ?>
            
        </div>
        
        <!-- Right Column - Sidebar -->
        <div class="mas-col-span-1">
            
            <!-- Component Demo -->
            <?php
            $demo_content = '
                <div class="mas-flex mas-flex-col mas-gap-3">
                    <h4 class="mas-mt-0">' . __('Button Styles', 'modern-admin-styler-v2') . '</h4>
                    <div class="mas-flex mas-flex-wrap mas-gap-2">
                        ' . ComponentAdapter::button(__('Primary', 'modern-admin-styler-v2'), 'primary', ['size' => 'small']) . '
                        ' . ComponentAdapter::button(__('Secondary', 'modern-admin-styler-v2'), 'secondary', ['size' => 'small']) . '
                        ' . ComponentAdapter::button(__('Link', 'modern-admin-styler-v2'), 'link', ['size' => 'small']) . '
                    </div>
                    
                    <h4 class="mas-mb-2">' . __('Notice Types', 'modern-admin-styler-v2') . '</h4>
                    ' . ComponentAdapter::notice(__('Success message', 'modern-admin-styler-v2'), 'success', ['inline' => true]) . '
                    ' . ComponentAdapter::notice(__('Warning message', 'modern-admin-styler-v2'), 'warning', ['inline' => true]) . '
                    ' . ComponentAdapter::notice(__('Error message', 'modern-admin-styler-v2'), 'error', ['inline' => true]) . '
                    
                    <h4 class="mas-mb-2">' . __('Form Fields', 'modern-admin-styler-v2') . '</h4>
                    ' . ComponentAdapter::field('text', 'demo_text', 'Sample text', ['label' => __('Text Field', 'modern-admin-styler-v2'), 'placeholder' => __('Enter text...', 'modern-admin-styler-v2')]) . '
                    ' . ComponentAdapter::field('select', 'demo_select', 'option2', [
                        'label' => __('Select Field', 'modern-admin-styler-v2'),
                        'options' => [
                            'option1' => __('Option 1', 'modern-admin-styler-v2'),
                            'option2' => __('Option 2', 'modern-admin-styler-v2'),
                            'option3' => __('Option 3', 'modern-admin-styler-v2')
                        ]
                    ]) . '
                    ' . ComponentAdapter::field('checkbox', 'demo_checkbox', true, ['label' => __('Checkbox Field', 'modern-admin-styler-v2')]) . '
                </div>
            ';
            
            echo ComponentAdapter::metabox(
                __('Component Demo', 'modern-admin-styler-v2'),
                $demo_content,
                ['description' => __('Native WordPress components in action', 'modern-admin-styler-v2')]
            );
            ?>
            
            <!-- Architecture Info -->
            <?php
            $architecture_content = '
                <div class="mas-text-sm">
                    <h4 class="mas-mt-0 mas-mb-3">' . __('Technical Implementation', 'modern-admin-styler-v2') . '</h4>
                    
                    <div class="mas-mb-4">
                        <strong>' . __('ComponentAdapter Service', 'modern-admin-styler-v2') . '</strong>
                        <p class="description mas-mt-1">' . __('Transforms custom components into native WordPress equivalents using filter hooks.', 'modern-admin-styler-v2') . '</p>
                    </div>
                    
                    <div class="mas-mb-4">
                        <strong>' . __('MAS Utilities CSS', 'modern-admin-styler-v2') . '</strong>
                        <p class="description mas-mt-1">' . __('Minimal utility classes with mas- prefix. Only includes what WordPress lacks.', 'modern-admin-styler-v2') . '</p>
                    </div>
                    
                    <div class="mas-mb-4">
                        <strong>' . __('100% WordPress Native', 'modern-admin-styler-v2') . '</strong>
                        <p class="description mas-mt-1">' . __('Uses .postbox, .button, .notice, .wp-list-table and other standard WordPress classes.', 'modern-admin-styler-v2') . '</p>
                    </div>
                    
                    <div class="mas-btn-group mas-mt-4">
                        ' . ComponentAdapter::button(__('View Code', 'modern-admin-styler-v2'), 'link', ['size' => 'small', 'attributes' => ['onclick' => 'toggleCodeView()']]) . '
                        ' . ComponentAdapter::button(__('Inspect CSS', 'modern-admin-styler-v2'), 'link', ['size' => 'small', 'attributes' => ['onclick' => 'inspectCSS()']]) . '
                    </div>
                </div>
            ';
            
            echo ComponentAdapter::metabox(
                __('Architecture', 'modern-admin-styler-v2'),
                $architecture_content,
                ['description' => __('Phase 2 technical details', 'modern-admin-styler-v2')]
            );
            ?>
            
            <!-- Next Phase Preview -->
            <?php
            $next_phase_content = '
                <div class="mas-text-center mas-py-4">
                    <span class="dashicons dashicons-admin-plugins" style="font-size: 48px; color: #0073aa; opacity: 0.7;"></span>
                    <h4 class="mas-mt-2 mas-mb-3">' . __('Phase 3 Preview', 'modern-admin-styler-v2') . '</h4>
                    <p class="description mas-mb-4">' . __('Next: Ecosystem Integration with hooks, filters, and Gutenberg blocks for maximum extensibility.', 'modern-admin-styler-v2') . '</p>
                    ' . ComponentAdapter::button(__('Coming Soon', 'modern-admin-styler-v2'), 'secondary', ['disabled' => true, 'classes' => 'mas-opacity-50']) . '
                </div>
            ';
            
            echo ComponentAdapter::metabox(
                __('What\'s Next?', 'modern-admin-styler-v2'),
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
                <h4 class="mas-mt-0">' . __('Component Usage Example', 'modern-admin-styler-v2') . '</h4>
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
            __('Code Examples', 'modern-admin-styler-v2'),
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
        button.prop('disabled', true).text('<?php _e('Clearing...', 'modern-admin-styler-v2'); ?>');
        
        $.post(ajaxurl, {
            action: 'mas_v2_clear_cache',
            nonce: '<?php echo wp_create_nonce('mas_v2_clear_cache'); ?>'
        })
        .done(function(response) {
            if (response.success) {
                button.after('<div class="notice notice-success inline mas-ml-2"><p><?php _e('Cache cleared successfully!', 'modern-admin-styler-v2'); ?></p></div>');
            } else {
                button.after('<div class="notice notice-error inline mas-ml-2"><p><?php _e('Error clearing cache.', 'modern-admin-styler-v2'); ?></p></div>');
            }
        })
        .always(function() {
            button.prop('disabled', false).text('<?php _e('Clear Cache', 'modern-admin-styler-v2'); ?>');
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
        
        $(this).after('<div class="notice notice-success inline mas-ml-2"><p><?php _e('Settings exported!', 'modern-admin-styler-v2'); ?></p></div>');
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
        alert('<?php _e('Please use browser developer tools to inspect CSS classes starting with "mas-"', 'modern-admin-styler-v2'); ?>');
    }
}
</script>

<!-- CSS for additional styling -->
<style>
/* Phase 2 specific enhancements */
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

/* Button group enhancements */
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

/* Code block styling */
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

/* WordPress metabox enhancements */
.postbox .inside > *:first-child {
    margin-top: 0;
}

.postbox .inside > *:last-child {
    margin-bottom: 0;
}

/* Responsive improvements */
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