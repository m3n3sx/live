<?php
/**
 * Component Adapter Service
 * 
 * Faza 2: Adaptacja języka wizualnego WordPress
 * Zastępuje niestandardowe komponenty natywnymi WordPress komponentami
 * 
 * @package ModernAdminStyler\Services
 * @version 2.2.0
 */

namespace ModernAdminStyler\Services;

class ComponentAdapter {
    
    private $settings_manager;
    
    public function __construct($settings_manager) {
        $this->settings_manager = $settings_manager;
        $this->init();
    }
    
    /**
     * Inicjalizacja adaptera komponentów
     */
    public function init() {
        // Dodaj filtry do zastępowania komponentów
        add_filter('mas_v2_render_card', [$this, 'renderWordPressMetabox'], 10, 3);
        add_filter('mas_v2_render_button', [$this, 'renderWordPressButton'], 10, 3);
        add_filter('mas_v2_render_notice', [$this, 'renderWordPressNotice'], 10, 3);
        add_filter('mas_v2_render_form_field', [$this, 'renderWordPressFormField'], 10, 4);
        add_filter('mas_v2_render_table', [$this, 'renderWordPressTable'], 10, 3);
        
        // Enqueue utilities CSS
        add_action('admin_enqueue_scripts', [$this, 'enqueueUtilitiesCSS']);
    }
    
    /**
     * Ładowanie utility CSS
     */
    public function enqueueUtilitiesCSS() {
        wp_enqueue_style(
            'mas-v2-utilities',
            MAS_V2_PLUGIN_URL . 'assets/css/mas-utilities.css',
            [],
            MAS_V2_VERSION
        );
    }
    
    /**
     * Renderuje natywny WordPress metabox zamiast niestandardowej karty
     */
    public function renderWordPressMetabox($content, $title, $args = []) {
        $defaults = [
            'id' => 'mas-metabox-' . sanitize_title($title),
            'context' => 'normal',
            'priority' => 'default',
            'callback_args' => null,
            'classes' => '',
            'description' => ''
        ];
        
        $args = wp_parse_args($args, $defaults);
        
        ob_start();
        ?>
        <div id="<?php echo esc_attr($args['id']); ?>" class="postbox <?php echo esc_attr($args['classes']); ?>">
            <div class="postbox-header">
                <h2 class="hndle ui-sortable-handle">
                    <?php echo esc_html($title); ?>
                </h2>
                <?php if (!empty($args['description'])): ?>
                    <div class="handle-actions hide-if-no-js">
                        <button type="button" class="handlediv" aria-expanded="true">
                            <span class="screen-reader-text"><?php _e('Toggle panel'); ?></span>
                            <span class="toggle-indicator" aria-hidden="true"></span>
                        </button>
                    </div>
                <?php endif; ?>
            </div>
            
            <div class="inside">
                <?php if (!empty($args['description'])): ?>
                    <p class="description"><?php echo esc_html($args['description']); ?></p>
                <?php endif; ?>
                
                <?php echo $content; ?>
            </div>
        </div>
        <?php
        
        return ob_get_clean();
    }
    
    /**
     * Renderuje natywny WordPress button
     */
    public function renderWordPressButton($text, $type = 'secondary', $args = []) {
        $defaults = [
            'id' => '',
            'name' => '',
            'value' => '',
            'disabled' => false,
            'icon' => '',
            'size' => 'normal', // normal, small, large
            'classes' => '',
            'attributes' => []
        ];
        
        $args = wp_parse_args($args, $defaults);
        
        // Mapowanie typów na klasy WordPress
        $type_classes = [
            'primary' => 'button-primary',
            'secondary' => 'button-secondary',
            'delete' => 'button-secondary mas-text-red',
            'link' => 'button-link',
            'link-delete' => 'button-link-delete'
        ];
        
        $size_classes = [
            'small' => 'button-small',
            'large' => 'button-large',
            'hero' => 'button-hero'
        ];
        
        $classes = ['button'];
        
        if (isset($type_classes[$type])) {
            $classes[] = $type_classes[$type];
        }
        
        if ($args['size'] !== 'normal' && isset($size_classes[$args['size']])) {
            $classes[] = $size_classes[$args['size']];
        }
        
        if (!empty($args['classes'])) {
            $classes[] = $args['classes'];
        }
        
        $attributes = [];
        
        if (!empty($args['id'])) {
            $attributes[] = 'id="' . esc_attr($args['id']) . '"';
        }
        
        if (!empty($args['name'])) {
            $attributes[] = 'name="' . esc_attr($args['name']) . '"';
        }
        
        if (!empty($args['value'])) {
            $attributes[] = 'value="' . esc_attr($args['value']) . '"';
        }
        
        if ($args['disabled']) {
            $attributes[] = 'disabled';
        }
        
        // Dodatkowe atrybuty
        foreach ($args['attributes'] as $attr => $value) {
            $attributes[] = esc_attr($attr) . '="' . esc_attr($value) . '"';
        }
        
        $button_html = sprintf(
            '<button type="button" class="%s" %s>%s%s</button>',
            esc_attr(implode(' ', $classes)),
            implode(' ', $attributes),
            !empty($args['icon']) ? '<span class="dashicons dashicons-' . esc_attr($args['icon']) . '"></span> ' : '',
            esc_html($text)
        );
        
        return $button_html;
    }
    
    /**
     * Renderuje natywny WordPress notice
     */
    public function renderWordPressNotice($message, $type = 'info', $args = []) {
        $defaults = [
            'dismissible' => false,
            'inline' => false,
            'paragraph' => true,
            'classes' => '',
            'id' => ''
        ];
        
        $args = wp_parse_args($args, $defaults);
        
        $classes = ['notice'];
        
        // Mapowanie typów na klasy WordPress
        $type_classes = [
            'success' => 'notice-success',
            'error' => 'notice-error',
            'warning' => 'notice-warning',
            'info' => 'notice-info'
        ];
        
        if (isset($type_classes[$type])) {
            $classes[] = $type_classes[$type];
        }
        
        if ($args['dismissible']) {
            $classes[] = 'is-dismissible';
        }
        
        if ($args['inline']) {
            $classes[] = 'notice-alt';
            $classes[] = 'inline';
        }
        
        if (!empty($args['classes'])) {
            $classes[] = $args['classes'];
        }
        
        $id_attr = !empty($args['id']) ? ' id="' . esc_attr($args['id']) . '"' : '';
        
        ob_start();
        ?>
        <div class="<?php echo esc_attr(implode(' ', $classes)); ?>"<?php echo $id_attr; ?>>
            <?php if ($args['paragraph']): ?>
                <p><?php echo wp_kses_post($message); ?></p>
            <?php else: ?>
                <?php echo wp_kses_post($message); ?>
            <?php endif; ?>
        </div>
        <?php
        
        return ob_get_clean();
    }
    
    /**
     * Renderuje natywne WordPress form field
     */
    public function renderWordPressFormField($field_type, $name, $value = '', $args = []) {
        $defaults = [
            'id' => $name,
            'label' => '',
            'description' => '',
            'required' => false,
            'disabled' => false,
            'readonly' => false,
            'classes' => '',
            'attributes' => [],
            'options' => [], // dla select/radio/checkbox
            'placeholder' => '',
            'rows' => 5, // dla textarea
            'cols' => 50, // dla textarea
            'wrap_table' => false // czy owinąć w table row
        ];
        
        $args = wp_parse_args($args, $defaults);
        
        ob_start();
        
        if ($args['wrap_table']): ?>
            <tr>
                <th scope="row">
                    <?php if (!empty($args['label'])): ?>
                        <label for="<?php echo esc_attr($args['id']); ?>">
                            <?php echo esc_html($args['label']); ?>
                            <?php if ($args['required']): ?>
                                <span class="description"><?php _e('(required)'); ?></span>
                            <?php endif; ?>
                        </label>
                    <?php endif; ?>
                </th>
                <td>
        <?php else: ?>
            <?php if (!empty($args['label'])): ?>
                <label for="<?php echo esc_attr($args['id']); ?>" class="mas-form-label">
                    <?php echo esc_html($args['label']); ?>
                    <?php if ($args['required']): ?>
                        <span class="description"><?php _e('(required)'); ?></span>
                    <?php endif; ?>
                </label>
            <?php endif; ?>
        <?php endif;
        
        // Render field based on type
        switch ($field_type) {
            case 'text':
            case 'email':
            case 'url':
            case 'number':
            case 'password':
                $this->renderInputField($field_type, $name, $value, $args);
                break;
                
            case 'textarea':
                $this->renderTextareaField($name, $value, $args);
                break;
                
            case 'select':
                $this->renderSelectField($name, $value, $args);
                break;
                
            case 'checkbox':
                $this->renderCheckboxField($name, $value, $args);
                break;
                
            case 'radio':
                $this->renderRadioField($name, $value, $args);
                break;
                
            case 'color':
                $this->renderColorField($name, $value, $args);
                break;
                
            case 'range':
                $this->renderRangeField($name, $value, $args);
                break;
        }
        
        if (!empty($args['description'])): ?>
            <p class="description"><?php echo wp_kses_post($args['description']); ?></p>
        <?php endif;
        
        if ($args['wrap_table']): ?>
                </td>
            </tr>
        <?php endif;
        
        return ob_get_clean();
    }
    
    /**
     * Renderuje natywną WordPress table
     */
    public function renderWordPressTable($headers, $rows, $args = []) {
        $defaults = [
            'classes' => 'wp-list-table widefat fixed striped',
            'id' => '',
            'caption' => '',
            'responsive' => true
        ];
        
        $args = wp_parse_args($args, $defaults);
        
        $classes = $args['classes'];
        if ($args['responsive']) {
            $classes .= ' mas-overflow-x-auto';
        }
        
        $id_attr = !empty($args['id']) ? ' id="' . esc_attr($args['id']) . '"' : '';
        
        ob_start();
        ?>
        <table class="<?php echo esc_attr($classes); ?>"<?php echo $id_attr; ?>>
            <?php if (!empty($args['caption'])): ?>
                <caption><?php echo esc_html($args['caption']); ?></caption>
            <?php endif; ?>
            
            <?php if (!empty($headers)): ?>
                <thead>
                    <tr>
                        <?php foreach ($headers as $header): ?>
                            <th scope="col"><?php echo esc_html($header); ?></th>
                        <?php endforeach; ?>
                    </tr>
                </thead>
            <?php endif; ?>
            
            <tbody>
                <?php if (!empty($rows)): ?>
                    <?php foreach ($rows as $row): ?>
                        <tr>
                            <?php foreach ($row as $cell): ?>
                                <td><?php echo wp_kses_post($cell); ?></td>
                            <?php endforeach; ?>
                        </tr>
                    <?php endforeach; ?>
                <?php else: ?>
                    <tr>
                        <td colspan="<?php echo count($headers); ?>" class="mas-text-center mas-py-4">
                            <?php _e('No data available', 'modern-admin-styler-v2'); ?>
                        </td>
                    </tr>
                <?php endif; ?>
            </tbody>
        </table>
        <?php
        
        return ob_get_clean();
    }
    
    /**
     * Helper methods dla renderowania pól formularza
     */
    
    private function renderInputField($type, $name, $value, $args) {
        $classes = ['regular-text'];
        if (!empty($args['classes'])) {
            $classes[] = $args['classes'];
        }
        
        $attributes = $this->buildFieldAttributes($args);
        
        printf(
            '<input type="%s" name="%s" id="%s" value="%s" class="%s" %s />',
            esc_attr($type),
            esc_attr($name),
            esc_attr($args['id']),
            esc_attr($value),
            esc_attr(implode(' ', $classes)),
            implode(' ', $attributes)
        );
    }
    
    private function renderTextareaField($name, $value, $args) {
        $classes = ['large-text'];
        if (!empty($args['classes'])) {
            $classes[] = $args['classes'];
        }
        
        $attributes = $this->buildFieldAttributes($args);
        
        printf(
            '<textarea name="%s" id="%s" class="%s" rows="%d" cols="%d" %s>%s</textarea>',
            esc_attr($name),
            esc_attr($args['id']),
            esc_attr(implode(' ', $classes)),
            intval($args['rows']),
            intval($args['cols']),
            implode(' ', $attributes),
            esc_textarea($value)
        );
    }
    
    private function renderSelectField($name, $value, $args) {
        $attributes = $this->buildFieldAttributes($args);
        
        echo '<select name="' . esc_attr($name) . '" id="' . esc_attr($args['id']) . '" ' . implode(' ', $attributes) . '>';
        
        foreach ($args['options'] as $option_value => $option_label) {
            printf(
                '<option value="%s" %s>%s</option>',
                esc_attr($option_value),
                selected($value, $option_value, false),
                esc_html($option_label)
            );
        }
        
        echo '</select>';
    }
    
    private function renderCheckboxField($name, $value, $args) {
        $attributes = $this->buildFieldAttributes($args);
        
        printf(
            '<label><input type="checkbox" name="%s" id="%s" value="1" %s %s /> %s</label>',
            esc_attr($name),
            esc_attr($args['id']),
            checked($value, true, false),
            implode(' ', $attributes),
            !empty($args['label']) ? esc_html($args['label']) : ''
        );
    }
    
    private function renderRadioField($name, $value, $args) {
        foreach ($args['options'] as $option_value => $option_label) {
            $option_id = $args['id'] . '_' . sanitize_title($option_value);
            
            printf(
                '<label><input type="radio" name="%s" id="%s" value="%s" %s /> %s</label><br>',
                esc_attr($name),
                esc_attr($option_id),
                esc_attr($option_value),
                checked($value, $option_value, false),
                esc_html($option_label)
            );
        }
    }
    
    private function renderColorField($name, $value, $args) {
        wp_enqueue_script('wp-color-picker');
        wp_enqueue_style('wp-color-picker');
        
        $attributes = $this->buildFieldAttributes($args);
        
        printf(
            '<input type="text" name="%s" id="%s" value="%s" class="color-picker" %s />',
            esc_attr($name),
            esc_attr($args['id']),
            esc_attr($value),
            implode(' ', $attributes)
        );
        
        // Dodaj inicjalizację color picker
        echo '<script>jQuery(document).ready(function($) { $(".color-picker").wpColorPicker(); });</script>';
    }
    
    private function renderRangeField($name, $value, $args) {
        $attributes = $this->buildFieldAttributes($args);
        
        // Dodaj min, max, step dla range
        if (isset($args['min'])) {
            $attributes[] = 'min="' . esc_attr($args['min']) . '"';
        }
        if (isset($args['max'])) {
            $attributes[] = 'max="' . esc_attr($args['max']) . '"';
        }
        if (isset($args['step'])) {
            $attributes[] = 'step="' . esc_attr($args['step']) . '"';
        }
        
        printf(
            '<input type="range" name="%s" id="%s" value="%s" %s />',
            esc_attr($name),
            esc_attr($args['id']),
            esc_attr($value),
            implode(' ', $attributes)
        );
        
        // Dodaj wyświetlanie wartości
        echo '<span class="range-value">' . esc_html($value) . '</span>';
        echo '<script>
            document.getElementById("' . esc_js($args['id']) . '").addEventListener("input", function(e) {
                e.target.nextElementSibling.textContent = e.target.value;
            });
        </script>';
    }
    
    private function buildFieldAttributes($args) {
        $attributes = [];
        
        if (!empty($args['placeholder'])) {
            $attributes[] = 'placeholder="' . esc_attr($args['placeholder']) . '"';
        }
        
        if ($args['required']) {
            $attributes[] = 'required';
        }
        
        if ($args['disabled']) {
            $attributes[] = 'disabled';
        }
        
        if ($args['readonly']) {
            $attributes[] = 'readonly';
        }
        
        foreach ($args['attributes'] as $attr => $value) {
            $attributes[] = esc_attr($attr) . '="' . esc_attr($value) . '"';
        }
        
        return $attributes;
    }
    
    /**
     * Helper functions dla łatwego użycia w templates
     */
    
    /**
     * Renderuje metabox - wrapper dla apply_filters
     */
    public static function metabox($title, $content, $args = []) {
        return apply_filters('mas_v2_render_card', $content, $title, $args);
    }
    
    /**
     * Renderuje button - wrapper dla apply_filters
     */
    public static function button($text, $type = 'secondary', $args = []) {
        return apply_filters('mas_v2_render_button', '', $text, $type, $args);
    }
    
    /**
     * Renderuje notice - wrapper dla apply_filters
     */
    public static function notice($message, $type = 'info', $args = []) {
        return apply_filters('mas_v2_render_notice', '', $message, $type, $args);
    }
    
    /**
     * Renderuje form field - wrapper dla apply_filters
     */
    public static function field($type, $name, $value = '', $args = []) {
        return apply_filters('mas_v2_render_form_field', '', $type, $name, $value, $args);
    }
    
    /**
     * Renderuje table - wrapper dla apply_filters
     */
    public static function table($headers, $rows, $args = []) {
        return apply_filters('mas_v2_render_table', '', $headers, $rows, $args);
    }
} 