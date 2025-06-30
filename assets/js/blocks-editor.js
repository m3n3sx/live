/**
 * MAS V2 Gutenberg Blocks - Editor JavaScript
 * 
 * Faza 3: Ecosystem Integration
 * JavaScript dla edytora bloków WordPress (Gutenberg)
 * 
 * @package ModernAdminStyler
 * @version 3.0.0
 */

(function() {
    'use strict';
    
    const { registerBlockType } = wp.blocks;
    const { createElement: el, Fragment } = wp.element;
    const { 
        InspectorControls, 
        BlockControls,
        useBlockProps 
    } = wp.blockEditor;
    const { 
        PanelBody, 
        SelectControl, 
        ToggleControl, 
        CheckboxControl,
        RangeControl,
        ColorPicker,
        Button,
        ButtonGroup,
        Card,
        CardBody,
        CardHeader
    } = wp.components;
    const { __ } = wp.i18n;
    
    // Globalne dane z PHP
    const masData = window.masBlocks || {};
    const apiUrl = masData.apiUrl || '';
    const nonce = masData.nonce || '';
    const settings = masData.settings || {};
    const i18n = masData.i18n || {};
    
    /**
     * Blok: Admin Style Preview
     */
    registerBlockType('mas-v2/mas-admin-preview', {
        title: i18n.adminPreview || __('Admin Style Preview', 'modern-admin-styler-v2'),
        description: __('Preview how admin interface looks with current MAS settings', 'modern-admin-styler-v2'),
        category: 'mas-blocks',
        icon: 'admin-appearance',
        keywords: ['admin', 'preview', 'style'],
        
        attributes: {
            previewType: {
                type: 'string',
                default: 'admin-bar'
            },
            showSettings: {
                type: 'boolean',
                default: true
            }
        },
        
        edit: function(props) {
            const { attributes, setAttributes } = props;
            const { previewType, showSettings } = attributes;
            const blockProps = useBlockProps();
            
            return el(Fragment, {},
                // Inspector Controls (sidebar)
                el(InspectorControls, {},
                    el(PanelBody, {
                        title: __('Preview Settings', 'modern-admin-styler-v2'),
                        initialOpen: true
                    },
                        el(SelectControl, {
                            label: __('Preview Type', 'modern-admin-styler-v2'),
                            value: previewType,
                            options: [
                                { label: __('Admin Bar', 'modern-admin-styler-v2'), value: 'admin-bar' },
                                { label: __('Side Menu', 'modern-admin-styler-v2'), value: 'menu' },
                                { label: __('Full Interface', 'modern-admin-styler-v2'), value: 'full' }
                            ],
                            onChange: function(value) {
                                setAttributes({ previewType: value });
                            }
                        }),
                        
                        el(ToggleControl, {
                            label: __('Show Current Settings', 'modern-admin-styler-v2'),
                            checked: showSettings,
                            onChange: function(value) {
                                setAttributes({ showSettings: value });
                            }
                        })
                    )
                ),
                
                // Block Content
                el('div', blockProps,
                    el(Card, {},
                        el(CardHeader, {},
                            el('h3', {}, __('Admin Preview', 'modern-admin-styler-v2') + ' - ' + previewType)
                        ),
                        el(CardBody, {},
                            // Admin Bar Preview
                            previewType === 'admin-bar' && el('div', {
                                className: 'mas-admin-bar-preview',
                                style: {
                                    height: (settings.admin_bar_height || 32) + 'px',
                                    background: settings.admin_bar_bg_color || '#23282d',
                                    color: settings.admin_bar_text_color || '#ffffff',
                                    padding: '0 10px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    borderRadius: '3px',
                                    marginBottom: '10px'
                                }
                            }, __('WordPress Admin Bar Preview', 'modern-admin-styler-v2')),
                            
                            // Menu Preview
                            previewType === 'menu' && el('div', {
                                className: 'mas-menu-preview',
                                style: {
                                    width: (settings.menu_width || 160) + 'px',
                                    background: settings.menu_bg_color || '#23282d',
                                    color: settings.menu_text_color || '#ffffff',
                                    padding: '10px',
                                    borderRadius: '3px',
                                    marginBottom: '10px'
                                }
                            },
                                el('ul', { style: { listStyle: 'none', margin: 0, padding: 0 } },
                                    el('li', { style: { padding: '5px 0' } }, __('Dashboard', 'modern-admin-styler-v2')),
                                    el('li', { style: { padding: '5px 0' } }, __('Posts', 'modern-admin-styler-v2')),
                                    el('li', { style: { padding: '5px 0' } }, __('Media', 'modern-admin-styler-v2')),
                                    el('li', { style: { padding: '5px 0' } }, __('Pages', 'modern-admin-styler-v2'))
                                )
                            ),
                            
                            // Settings Display
                            showSettings && el('div', {
                                className: 'mas-preview-settings',
                                style: {
                                    background: '#f8f9fa',
                                    padding: '10px',
                                    borderRadius: '3px',
                                    fontSize: '12px'
                                }
                            },
                                el('h4', { style: { margin: '0 0 10px 0' } }, __('Current Settings', 'modern-admin-styler-v2')),
                                el('ul', { style: { margin: 0, paddingLeft: '20px' } },
                                    el('li', {}, __('Color Scheme:', 'modern-admin-styler-v2') + ' ' + (settings.color_scheme || 'default')),
                                    el('li', {}, __('Admin Bar Height:', 'modern-admin-styler-v2') + ' ' + (settings.admin_bar_height || 32) + 'px'),
                                    el('li', {}, __('Menu Width:', 'modern-admin-styler-v2') + ' ' + (settings.menu_width || 160) + 'px')
                                )
                            )
                        )
                    )
                )
            );
        },
        
        save: function() {
            // Dynamic block - rendered by PHP
            return null;
        }
    });
    
    /**
     * Blok: Color Scheme Selector
     */
    registerBlockType('mas-v2/mas-color-scheme', {
        title: i18n.colorScheme || __('Color Scheme Selector', 'modern-admin-styler-v2'),
        description: __('Allow users to switch between color schemes', 'modern-admin-styler-v2'),
        category: 'mas-blocks',
        icon: 'art',
        keywords: ['color', 'scheme', 'theme'],
        
        attributes: {
            allowedSchemes: {
                type: 'array',
                default: ['light', 'dark', 'auto']
            },
            showPreview: {
                type: 'boolean',
                default: true
            },
            layout: {
                type: 'string',
                default: 'horizontal'
            }
        },
        
        edit: function(props) {
            const { attributes, setAttributes } = props;
            const { allowedSchemes, showPreview, layout } = attributes;
            const blockProps = useBlockProps();
            
            return el(Fragment, {},
                // Inspector Controls
                el(InspectorControls, {},
                    el(PanelBody, {
                        title: __('Scheme Settings', 'modern-admin-styler-v2'),
                        initialOpen: true
                    },
                        el('h4', {}, __('Allowed Schemes', 'modern-admin-styler-v2')),
                        
                        el(CheckboxControl, {
                            label: __('Light', 'modern-admin-styler-v2'),
                            checked: allowedSchemes.includes('light'),
                            onChange: function(checked) {
                                const newSchemes = checked 
                                    ? [...allowedSchemes, 'light']
                                    : allowedSchemes.filter(s => s !== 'light');
                                setAttributes({ allowedSchemes: newSchemes });
                            }
                        }),
                        
                        el(CheckboxControl, {
                            label: __('Dark', 'modern-admin-styler-v2'),
                            checked: allowedSchemes.includes('dark'),
                            onChange: function(checked) {
                                const newSchemes = checked 
                                    ? [...allowedSchemes, 'dark']
                                    : allowedSchemes.filter(s => s !== 'dark');
                                setAttributes({ allowedSchemes: newSchemes });
                            }
                        }),
                        
                        el(CheckboxControl, {
                            label: __('Auto', 'modern-admin-styler-v2'),
                            checked: allowedSchemes.includes('auto'),
                            onChange: function(checked) {
                                const newSchemes = checked 
                                    ? [...allowedSchemes, 'auto']
                                    : allowedSchemes.filter(s => s !== 'auto');
                                setAttributes({ allowedSchemes: newSchemes });
                            }
                        }),
                        
                        el(ToggleControl, {
                            label: __('Show Preview', 'modern-admin-styler-v2'),
                            checked: showPreview,
                            onChange: function(value) {
                                setAttributes({ showPreview: value });
                            }
                        }),
                        
                        el(SelectControl, {
                            label: __('Layout', 'modern-admin-styler-v2'),
                            value: layout,
                            options: [
                                { label: __('Horizontal', 'modern-admin-styler-v2'), value: 'horizontal' },
                                { label: __('Vertical', 'modern-admin-styler-v2'), value: 'vertical' },
                                { label: __('Grid', 'modern-admin-styler-v2'), value: 'grid' }
                            ],
                            onChange: function(value) {
                                setAttributes({ layout: value });
                            }
                        })
                    )
                ),
                
                // Block Content
                el('div', blockProps,
                    el(Card, {},
                        el(CardHeader, {},
                            el('h3', {}, __('Color Scheme Selector', 'modern-admin-styler-v2'))
                        ),
                        el(CardBody, {},
                            el('div', {
                                className: 'mas-scheme-selector',
                                style: {
                                    display: layout === 'horizontal' ? 'flex' : 'block',
                                    gap: '10px',
                                    flexWrap: 'wrap'
                                }
                            },
                                allowedSchemes.map(function(scheme) {
                                    return el('div', {
                                        key: scheme,
                                        className: 'mas-scheme-option',
                                        style: {
                                            padding: '10px',
                                            border: '2px solid #ddd',
                                            borderRadius: '4px',
                                            textAlign: 'center',
                                            minWidth: '80px',
                                            marginBottom: layout === 'vertical' ? '10px' : '0'
                                        }
                                    },
                                        el('div', { style: { fontWeight: 'bold', marginBottom: '5px' } }, 
                                            scheme.charAt(0).toUpperCase() + scheme.slice(1)
                                        ),
                                        
                                        showPreview && el('div', {
                                            className: 'mas-scheme-preview',
                                            style: {
                                                width: '60px',
                                                height: '40px',
                                                margin: '0 auto',
                                                borderRadius: '2px',
                                                border: '1px solid #ccc'
                                            }
                                        },
                                            el('div', {
                                                style: {
                                                    height: '30%',
                                                    background: scheme === 'dark' ? '#1e1e1e' : '#23282d'
                                                }
                                            }),
                                            el('div', {
                                                style: {
                                                    height: '70%',
                                                    background: scheme === 'dark' ? '#2d2d2d' : '#f0f0f1'
                                                }
                                            })
                                        )
                                    );
                                })
                            )
                        )
                    )
                )
            );
        },
        
        save: function() {
            return null;
        }
    });
    
    /**
     * Blok: Settings Dashboard
     */
    registerBlockType('mas-v2/mas-settings-dashboard', {
        title: i18n.settings || __('MAS Settings Dashboard', 'modern-admin-styler-v2'),
        description: __('Quick access to MAS settings and controls', 'modern-admin-styler-v2'),
        category: 'mas-blocks',
        icon: 'admin-settings',
        keywords: ['settings', 'dashboard', 'admin'],
        
        attributes: {
            sections: {
                type: 'array',
                default: ['general', 'colors', 'layout']
            },
            compactMode: {
                type: 'boolean',
                default: false
            }
        },
        
        edit: function(props) {
            const { attributes, setAttributes } = props;
            const { sections, compactMode } = attributes;
            const blockProps = useBlockProps();
            
            return el(Fragment, {},
                // Inspector Controls
                el(InspectorControls, {},
                    el(PanelBody, {
                        title: __('Dashboard Settings', 'modern-admin-styler-v2'),
                        initialOpen: true
                    },
                        el('h4', {}, __('Visible Sections', 'modern-admin-styler-v2')),
                        
                        el(CheckboxControl, {
                            label: __('General', 'modern-admin-styler-v2'),
                            checked: sections.includes('general'),
                            onChange: function(checked) {
                                const newSections = checked 
                                    ? [...sections, 'general']
                                    : sections.filter(s => s !== 'general');
                                setAttributes({ sections: newSections });
                            }
                        }),
                        
                        el(CheckboxControl, {
                            label: __('Colors', 'modern-admin-styler-v2'),
                            checked: sections.includes('colors'),
                            onChange: function(checked) {
                                const newSections = checked 
                                    ? [...sections, 'colors']
                                    : sections.filter(s => s !== 'colors');
                                setAttributes({ sections: newSections });
                            }
                        }),
                        
                        el(CheckboxControl, {
                            label: __('Layout', 'modern-admin-styler-v2'),
                            checked: sections.includes('layout'),
                            onChange: function(checked) {
                                const newSections = checked 
                                    ? [...sections, 'layout']
                                    : sections.filter(s => s !== 'layout');
                                setAttributes({ sections: newSections });
                            }
                        }),
                        
                        el(ToggleControl, {
                            label: __('Compact Mode', 'modern-admin-styler-v2'),
                            checked: compactMode,
                            onChange: function(value) {
                                setAttributes({ compactMode: value });
                            }
                        })
                    )
                ),
                
                // Block Content
                el('div', blockProps,
                    el(Card, {},
                        el(CardHeader, {},
                            el('h3', {}, __('MAS Settings Dashboard', 'modern-admin-styler-v2'))
                        ),
                        el(CardBody, {},
                            el('div', {
                                className: 'mas-dashboard-sections',
                                style: {
                                    display: 'grid',
                                    gridTemplateColumns: compactMode ? '1fr' : 'repeat(auto-fit, minmax(250px, 1fr))',
                                    gap: '15px'
                                }
                            },
                                sections.map(function(section) {
                                    return el('div', {
                                        key: section,
                                        className: 'mas-dashboard-section',
                                        style: {
                                            padding: '15px',
                                            border: '1px solid #ddd',
                                            borderRadius: '4px',
                                            background: '#fafafa'
                                        }
                                    },
                                        el('h4', { style: { margin: '0 0 10px 0' } }, 
                                            section.charAt(0).toUpperCase() + section.slice(1)
                                        ),
                                        
                                        // Section specific content preview
                                        section === 'general' && el('div', {},
                                            el('label', { style: { display: 'block', marginBottom: '5px' } },
                                                el('input', { type: 'checkbox', style: { marginRight: '5px' } }),
                                                __('Enable Plugin', 'modern-admin-styler-v2')
                                            ),
                                            el('label', { style: { display: 'block' } },
                                                el('input', { type: 'checkbox', style: { marginRight: '5px' } }),
                                                __('Enable Animations', 'modern-admin-styler-v2')
                                            )
                                        ),
                                        
                                        section === 'colors' && el('div', {},
                                            el('label', { style: { display: 'block', marginBottom: '5px' } },
                                                __('Primary Color:', 'modern-admin-styler-v2'),
                                                el('input', { 
                                                    type: 'color', 
                                                    value: settings.primary_color || '#0073aa',
                                                    style: { marginLeft: '5px' }
                                                })
                                            ),
                                            el('label', { style: { display: 'block' } },
                                                __('Secondary Color:', 'modern-admin-styler-v2'),
                                                el('input', { 
                                                    type: 'color', 
                                                    value: settings.secondary_color || '#005a87',
                                                    style: { marginLeft: '5px' }
                                                })
                                            )
                                        ),
                                        
                                        section === 'layout' && el('div', {},
                                            el('label', { style: { display: 'block', marginBottom: '5px' } },
                                                __('Admin Bar Height:', 'modern-admin-styler-v2'),
                                                el('input', { 
                                                    type: 'range', 
                                                    min: 28, 
                                                    max: 50, 
                                                    value: settings.admin_bar_height || 32,
                                                    style: { width: '100%' }
                                                })
                                            ),
                                            el('label', { style: { display: 'block' } },
                                                __('Menu Width:', 'modern-admin-styler-v2'),
                                                el('input', { 
                                                    type: 'range', 
                                                    min: 140, 
                                                    max: 200, 
                                                    value: settings.menu_width || 160,
                                                    style: { width: '100%' }
                                                })
                                            )
                                        )
                                    );
                                })
                            ),
                            
                            el('div', {
                                className: 'mas-dashboard-actions',
                                style: {
                                    marginTop: '15px',
                                    textAlign: 'center'
                                }
                            },
                                el(Button, {
                                    isPrimary: true,
                                    style: { marginRight: '10px' }
                                }, __('Save Changes', 'modern-admin-styler-v2')),
                                
                                el(Button, {
                                    isSecondary: true
                                }, __('Full Settings', 'modern-admin-styler-v2'))
                            )
                        )
                    )
                )
            );
        },
        
        save: function() {
            return null;
        }
    });
    
    /**
     * Blok: Performance Metrics
     */
    registerBlockType('mas-v2/mas-performance-metrics', {
        title: i18n.performance || __('MAS Performance Metrics', 'modern-admin-styler-v2'),
        description: __('Display performance metrics and optimization tips', 'modern-admin-styler-v2'),
        category: 'mas-blocks',
        icon: 'performance',
        keywords: ['performance', 'metrics', 'optimization'],
        
        attributes: {
            showCharts: {
                type: 'boolean',
                default: true
            },
            metricsToShow: {
                type: 'array',
                default: ['load-time', 'css-size', 'cache-hits']
            }
        },
        
        edit: function(props) {
            const { attributes, setAttributes } = props;
            const { showCharts, metricsToShow } = attributes;
            const blockProps = useBlockProps();
            
            return el(Fragment, {},
                // Inspector Controls
                el(InspectorControls, {},
                    el(PanelBody, {
                        title: __('Metrics Settings', 'modern-admin-styler-v2'),
                        initialOpen: true
                    },
                        el('h4', {}, __('Metrics to Display', 'modern-admin-styler-v2')),
                        
                        el(CheckboxControl, {
                            label: __('Load Time', 'modern-admin-styler-v2'),
                            checked: metricsToShow.includes('load-time'),
                            onChange: function(checked) {
                                const newMetrics = checked 
                                    ? [...metricsToShow, 'load-time']
                                    : metricsToShow.filter(m => m !== 'load-time');
                                setAttributes({ metricsToShow: newMetrics });
                            }
                        }),
                        
                        el(CheckboxControl, {
                            label: __('CSS Size', 'modern-admin-styler-v2'),
                            checked: metricsToShow.includes('css-size'),
                            onChange: function(checked) {
                                const newMetrics = checked 
                                    ? [...metricsToShow, 'css-size']
                                    : metricsToShow.filter(m => m !== 'css-size');
                                setAttributes({ metricsToShow: newMetrics });
                            }
                        }),
                        
                        el(CheckboxControl, {
                            label: __('Cache Hits', 'modern-admin-styler-v2'),
                            checked: metricsToShow.includes('cache-hits'),
                            onChange: function(checked) {
                                const newMetrics = checked 
                                    ? [...metricsToShow, 'cache-hits']
                                    : metricsToShow.filter(m => m !== 'cache-hits');
                                setAttributes({ metricsToShow: newMetrics });
                            }
                        }),
                        
                        el(ToggleControl, {
                            label: __('Show Charts', 'modern-admin-styler-v2'),
                            checked: showCharts,
                            onChange: function(value) {
                                setAttributes({ showCharts: value });
                            }
                        })
                    )
                ),
                
                // Block Content
                el('div', blockProps,
                    el(Card, {},
                        el(CardHeader, {},
                            el('h3', {}, __('Performance Metrics', 'modern-admin-styler-v2'))
                        ),
                        el(CardBody, {},
                            el('div', {
                                className: 'mas-metrics-grid',
                                style: {
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                                    gap: '15px',
                                    marginBottom: showCharts ? '20px' : '0'
                                }
                            },
                                metricsToShow.map(function(metric) {
                                    let value = 'N/A';
                                    let unit = '';
                                    let label = metric;
                                    
                                    if (metric === 'load-time') {
                                        value = '245';
                                        unit = 'ms';
                                        label = __('Load Time', 'modern-admin-styler-v2');
                                    } else if (metric === 'css-size') {
                                        value = '16';
                                        unit = 'KB';
                                        label = __('CSS Size', 'modern-admin-styler-v2');
                                    } else if (metric === 'cache-hits') {
                                        value = '94';
                                        unit = '%';
                                        label = __('Cache Hits', 'modern-admin-styler-v2');
                                    }
                                    
                                    return el('div', {
                                        key: metric,
                                        className: 'mas-metric-item',
                                        style: {
                                            textAlign: 'center',
                                            padding: '15px',
                                            border: '1px solid #ddd',
                                            borderRadius: '4px',
                                            background: '#f9f9f9'
                                        }
                                    },
                                        el('div', {
                                            className: 'mas-metric-value',
                                            style: {
                                                fontSize: '24px',
                                                fontWeight: 'bold',
                                                color: '#0073aa',
                                                marginBottom: '5px'
                                            }
                                        }, value + unit),
                                        
                                        el('div', {
                                            className: 'mas-metric-label',
                                            style: {
                                                fontSize: '12px',
                                                color: '#666'
                                            }
                                        }, label)
                                    );
                                })
                            ),
                            
                            showCharts && el('div', {
                                className: 'mas-metrics-chart',
                                style: {
                                    height: '200px',
                                    background: '#f0f0f0',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#666'
                                }
                            }, __('Performance Chart (Live Data)', 'modern-admin-styler-v2'))
                        )
                    )
                )
            );
        },
        
        save: function() {
            return null;
        }
    });
    
    /**
     * Blok: CSS Variable Inspector
     */
    registerBlockType('mas-v2/mas-css-inspector', {
        title: i18n.cssInspector || __('CSS Variable Inspector', 'modern-admin-styler-v2'),
        description: __('Inspect and modify CSS variables in real-time', 'modern-admin-styler-v2'),
        category: 'mas-blocks',
        icon: 'editor-code',
        keywords: ['css', 'variables', 'inspector'],
        
        attributes: {
            variableGroups: {
                type: 'array',
                default: ['colors', 'spacing', 'typography']
            },
            showLivePreview: {
                type: 'boolean',
                default: true
            }
        },
        
        edit: function(props) {
            const { attributes, setAttributes } = props;
            const { variableGroups, showLivePreview } = attributes;
            const blockProps = useBlockProps();
            
            return el(Fragment, {},
                // Inspector Controls
                el(InspectorControls, {},
                    el(PanelBody, {
                        title: __('Inspector Settings', 'modern-admin-styler-v2'),
                        initialOpen: true
                    },
                        el('h4', {}, __('Variable Groups', 'modern-admin-styler-v2')),
                        
                        el(CheckboxControl, {
                            label: __('Colors', 'modern-admin-styler-v2'),
                            checked: variableGroups.includes('colors'),
                            onChange: function(checked) {
                                const newGroups = checked 
                                    ? [...variableGroups, 'colors']
                                    : variableGroups.filter(g => g !== 'colors');
                                setAttributes({ variableGroups: newGroups });
                            }
                        }),
                        
                        el(CheckboxControl, {
                            label: __('Spacing', 'modern-admin-styler-v2'),
                            checked: variableGroups.includes('spacing'),
                            onChange: function(checked) {
                                const newGroups = checked 
                                    ? [...variableGroups, 'spacing']
                                    : variableGroups.filter(g => g !== 'spacing');
                                setAttributes({ variableGroups: newGroups });
                            }
                        }),
                        
                        el(CheckboxControl, {
                            label: __('Typography', 'modern-admin-styler-v2'),
                            checked: variableGroups.includes('typography'),
                            onChange: function(checked) {
                                const newGroups = checked 
                                    ? [...variableGroups, 'typography']
                                    : variableGroups.filter(g => g !== 'typography');
                                setAttributes({ variableGroups: newGroups });
                            }
                        }),
                        
                        el(ToggleControl, {
                            label: __('Show Live Preview', 'modern-admin-styler-v2'),
                            checked: showLivePreview,
                            onChange: function(value) {
                                setAttributes({ showLivePreview: value });
                            }
                        })
                    )
                ),
                
                // Block Content
                el('div', blockProps,
                    el(Card, {},
                        el(CardHeader, {},
                            el('h3', {}, __('CSS Variable Inspector', 'modern-admin-styler-v2'))
                        ),
                        el(CardBody, {},
                            // Tab Buttons
                            el(ButtonGroup, {
                                style: { marginBottom: '15px' }
                            },
                                variableGroups.map(function(group) {
                                    return el(Button, {
                                        key: group,
                                        isSecondary: true,
                                        style: { marginRight: '5px' }
                                    }, group.charAt(0).toUpperCase() + group.slice(1));
                                })
                            ),
                            
                            // Variable Groups
                            el('div', {
                                className: 'mas-inspector-content'
                            },
                                variableGroups.map(function(group) {
                                    return el('div', {
                                        key: group,
                                        className: 'mas-variable-group',
                                        style: {
                                            marginBottom: '20px',
                                            padding: '10px',
                                            border: '1px solid #ddd',
                                            borderRadius: '4px'
                                        }
                                    },
                                        el('h4', {}, group.charAt(0).toUpperCase() + group.slice(1)),
                                        
                                        // Sample variables for each group
                                        group === 'colors' && el('div', {},
                                            el('div', { style: { marginBottom: '10px' } },
                                                el('label', { style: { display: 'block', marginBottom: '5px' } }, '--mas-primary'),
                                                el('input', { type: 'color', value: settings.primary_color || '#0073aa' })
                                            ),
                                            el('div', { style: { marginBottom: '10px' } },
                                                el('label', { style: { display: 'block', marginBottom: '5px' } }, '--mas-secondary'),
                                                el('input', { type: 'color', value: settings.secondary_color || '#005a87' })
                                            )
                                        ),
                                        
                                        group === 'spacing' && el('div', {},
                                            el('div', { style: { marginBottom: '10px' } },
                                                el('label', { style: { display: 'block', marginBottom: '5px' } }, '--mas-admin-bar-height'),
                                                el('input', { type: 'range', min: 28, max: 50, value: settings.admin_bar_height || 32 })
                                            ),
                                            el('div', { style: { marginBottom: '10px' } },
                                                el('label', { style: { display: 'block', marginBottom: '5px' } }, '--mas-menu-width'),
                                                el('input', { type: 'range', min: 140, max: 200, value: settings.menu_width || 160 })
                                            )
                                        ),
                                        
                                        group === 'typography' && el('div', {},
                                            el('div', { style: { marginBottom: '10px' } },
                                                el('label', { style: { display: 'block', marginBottom: '5px' } }, '--mas-font-size'),
                                                el('input', { type: 'text', value: settings.font_size || '14px', style: { width: '100%' } })
                                            ),
                                            el('div', { style: { marginBottom: '10px' } },
                                                el('label', { style: { display: 'block', marginBottom: '5px' } }, '--mas-font-family'),
                                                el('input', { type: 'text', value: settings.font_family || 'inherit', style: { width: '100%' } })
                                            )
                                        )
                                    );
                                })
                            ),
                            
                            // Live Preview
                            showLivePreview && el('div', {
                                className: 'mas-live-preview',
                                style: {
                                    marginTop: '20px',
                                    padding: '15px',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px',
                                    background: '#f9f9f9'
                                }
                            },
                                el('h4', {}, __('Live Preview', 'modern-admin-styler-v2')),
                                el('div', {
                                    style: {
                                        height: '100px',
                                        background: 'linear-gradient(45deg, #f0f0f0, #e0e0e0)',
                                        border: '1px solid #ccc',
                                        borderRadius: '4px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: '#666'
                                    }
                                }, __('Live CSS Preview Area', 'modern-admin-styler-v2'))
                            )
                        )
                    )
                )
            );
        },
        
        save: function() {
            return null;
        }
    });
    
})(); 