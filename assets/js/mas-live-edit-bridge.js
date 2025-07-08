/**
 * MAS Live Edit Bridge
 * Connects the main MAS object with Live Edit Mode functionality
 * 
 * @package ModernAdminStyler
 * @version 1.0.0
 */

(function() {
    'use strict';
    
    // Wait for both MAS and liveEditInstance to be available
    function initializeBridge() {
        if (!window.MAS) {
            console.error('MAS object not found. Bridge cannot initialize.');
            return;
        }
        
        // Add Live Edit Mode methods to MAS object
        window.MAS.prepareEditableElements = function() {
            if (window.liveEditInstance) {
                // Get all configuration categories
                const configs = window.liveEditInstance.getOptionConfigurations();
                
                // Mark elements as editable
                Object.entries(configs).forEach(([key, config]) => {
                    const element = document.querySelector(config.element);
                    if (element) {
                        element.setAttribute('data-mas-editable', 'true');
                        element.setAttribute('data-mas-element-name', config.title);
                        element.setAttribute('data-mas-element-type', config.category);
                        console.log('✅ Prepared editable element:', config.title);
                    }
                });
            } else {
                console.error('Live Edit Instance not found');
            }
        };
        
        window.MAS.initializeEditableElements = function() {
            if (window.liveEditInstance && window.liveEditInstance.isActive) {
                window.liveEditInstance.activateEditMode();
                console.log('✅ Edit mode activated with icons');
            } else {
                console.log('Live Edit Mode not active or not found');
            }
        };
        
        window.MAS.openMicroPanel = function(element) {
            if (!window.liveEditInstance) {
                console.error('Live Edit Instance not found');
                return;
            }
            
            // Find the configuration for this element
            const configs = window.liveEditInstance.getOptionConfigurations();
            let targetConfig = null;
            
            Object.entries(configs).forEach(([key, config]) => {
                if (element.matches(config.element)) {
                    targetConfig = config;
                }
            });
            
            if (targetConfig) {
                window.liveEditInstance.openMicroPanel(element, targetConfig);
                console.log('✅ Opened micro panel for:', targetConfig.title);
            } else {
                console.error('No configuration found for element:', element);
            }
        };
        
        window.MAS.handleLiveEditModeToggle = function() {
            if (window.liveEditInstance) {
                window.liveEditInstance.toggle();
                console.log('✅ Live Edit Mode toggled');
            } else {
                console.error('Live Edit Instance not found');
            }
        };
        
        // Add ConfigManager reference if available
        if (window.ConfigManager) {
            window.MAS.ConfigManager = window.ConfigManager;
        }
        
        // Add SettingsManager reference if available
        if (window.SettingsManager) {
            window.MAS.SettingsManager = window.SettingsManager;
        }
        
        console.log('✅ MAS Live Edit Bridge initialized successfully');
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            // Wait a bit for other scripts to initialize
            setTimeout(initializeBridge, 500);
        });
    } else {
        // DOM already loaded, wait for other scripts
        setTimeout(initializeBridge, 500);
    }
    
    // Also try to initialize after a longer delay as backup
    setTimeout(initializeBridge, 2000);
})(); 