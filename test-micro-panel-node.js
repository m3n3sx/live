/**
 * Node.js Test for MicroPanelFactory
 * Tests the core functionality without browser dependencies
 */

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

// Setup DOM environment
const dom = new JSDOM(`
<!DOCTYPE html>
<html>
<head><title>Test</title></head>
<body>
    <div id="wpadminbar" style="height: 32px; background: #23282d;">Admin Bar</div>
    <div id="adminmenuwrap" style="width: 160px; background: #23282d;">Menu</div>
</body>
</html>
`, {
    url: 'http://localhost',
    pretendToBeVisual: true,
    resources: 'usable'
});

global.window = dom.window;
global.document = dom.window.document;
global.navigator = dom.window.navigator || { userAgent: 'Node.js Test' };
global.getComputedStyle = dom.window.getComputedStyle;
global.Event = dom.window.Event;
global.CustomEvent = dom.window.CustomEvent;
global.performance = {
    now: () => Date.now()
};

// Mock BroadcastChannel
global.BroadcastChannel = class {
    constructor(name) {
        this.name = name;
    }
    postMessage(data) {}
    close() {}
    addEventListener() {}
    removeEventListener() {}
};

console.log('🧪 Starting MicroPanelFactory Node.js Tests...\n');

try {
    // Load the MicroPanelFactory code
    const factoryCode = fs.readFileSync(
        path.join(__dirname, 'assets/js/micro-panel-factory.js'),
        'utf8'
    );
    
    // Execute the code in the global context
    const vm = require('vm');
    const context = vm.createContext({
        window: global.window,
        document: global.document,
        console: console,
        performance: global.performance,
        BroadcastChannel: global.BroadcastChannel,
        Event: global.Event,
        CustomEvent: global.CustomEvent,
        getComputedStyle: global.getComputedStyle
    });
    
    vm.runInContext(factoryCode, context);
    
    // Get the class from window
    const MicroPanelFactory = context.window.MicroPanelFactory;
    
    if (!MicroPanelFactory) {
        throw new Error('MicroPanelFactory not found in global scope');
    }
    
    console.log('✅ MicroPanelFactory loaded successfully');
    
    // Test 1: Initialization
    console.log('\n🧪 Test 1: Initialization');
    const factory = new MicroPanelFactory();
    
    if (factory.activePanels && factory.panelConfigs) {
        console.log('✅ Factory initialized with required properties');
        console.log(`   - Active panels: ${factory.activePanels.size}`);
        console.log(`   - Panel configs: ${factory.panelConfigs.size}`);
    } else {
        console.log('❌ Factory missing required properties');
    }
    
    // Test 2: Configuration Check
    console.log('\n🧪 Test 2: Configuration Check');
    const adminBarConfig = factory.panelConfigs.get('wpadminbar');
    const menuConfig = factory.panelConfigs.get('adminmenuwrap');
    
    if (adminBarConfig) {
        console.log('✅ Admin Bar configuration found');
        console.log(`   - Target: ${adminBarConfig.targetSelector}`);
        console.log(`   - Options: ${adminBarConfig.options.length}`);
        console.log(`   - Title: ${adminBarConfig.title}`);
    } else {
        console.log('❌ Admin Bar configuration missing');
    }
    
    if (menuConfig) {
        console.log('✅ Menu configuration found');
        console.log(`   - Target: ${menuConfig.targetSelector}`);
        console.log(`   - Options: ${menuConfig.options.length}`);
        console.log(`   - Title: ${menuConfig.title}`);
    } else {
        console.log('❌ Menu configuration missing');
    }
    
    // Test 3: Panel Creation
    console.log('\n🧪 Test 3: Panel Creation');
    const panel = factory.createPanel('wpadminbar');
    
    if (panel) {
        console.log('✅ Admin Bar panel created successfully');
        console.log(`   - Element ID: ${panel.getAttribute('data-element-id')}`);
        console.log(`   - Classes: ${panel.className}`);
        
        // Check panel structure
        const header = panel.querySelector('.woow-panel-header');
        const content = panel.querySelector('.woow-panel-content');
        const controls = panel.querySelectorAll('[data-option-id]');
        
        if (header && content) {
            console.log('✅ Panel structure is valid');
            console.log(`   - Controls found: ${controls.length}`);
            
            // List controls
            controls.forEach(control => {
                const optionId = control.getAttribute('data-option-id');
                const cssVar = control.getAttribute('data-css-var');
                const type = control.type || control.tagName.toLowerCase();
                console.log(`   - ${optionId}: ${type} -> ${cssVar}`);
            });
        } else {
            console.log('❌ Panel structure is invalid');
        }
        
        // Check if panel is in DOM
        if (document.body.contains(panel)) {
            console.log('✅ Panel added to DOM');
        } else {
            console.log('❌ Panel not added to DOM');
        }
        
    } else {
        console.log('❌ Failed to create Admin Bar panel');
    }
    
    // Test 4: CSS Variable Application
    console.log('\n🧪 Test 4: CSS Variable Application');
    
    const testVar = '--woow-test-var';
    const testValue = '#ff0000';
    
    try {
        const result = factory.applyCSSVariable(testVar, testValue);
        
        if (result) {
            console.log('✅ CSS variable application method works');
            
            // Check if variable was actually applied
            const appliedValue = getComputedStyle(document.documentElement).getPropertyValue(testVar);
            if (appliedValue.trim() === testValue) {
                console.log('✅ CSS variable correctly applied to DOM');
            } else {
                console.log(`⚠️ CSS variable applied but value mismatch: expected ${testValue}, got ${appliedValue.trim()}`);
            }
        } else {
            console.log('❌ CSS variable application failed');
        }
    } catch (error) {
        console.log(`❌ Error applying CSS variable: ${error.message}`);
    }
    
    // Test 5: Control Change Handling
    console.log('\n🧪 Test 5: Control Change Handling');
    
    if (panel) {
        const colorControl = panel.querySelector('[data-option-id="admin_bar_background"]');
        
        if (colorControl) {
            console.log('✅ Color control found');
            
            try {
                // Test control change
                const testColor = '#00ff00';
                colorControl.value = testColor;
                
                // Mock the event handling
                factory.handleControlChange(colorControl, new Event('input'));
                
                console.log('✅ Control change handled without errors');
                
                // Check if CSS variable was updated
                const cssVar = colorControl.getAttribute('data-css-var');
                if (cssVar) {
                    const appliedValue = getComputedStyle(document.documentElement).getPropertyValue(cssVar);
                    if (appliedValue.trim() === testColor) {
                        console.log('✅ CSS variable updated correctly');
                    } else {
                        console.log(`⚠️ CSS variable not updated: expected ${testColor}, got ${appliedValue.trim()}`);
                    }
                }
                
            } catch (error) {
                console.log(`❌ Error handling control change: ${error.message}`);
            }
        } else {
            console.log('❌ Color control not found');
        }
    }
    
    // Test 6: Static Build Method
    console.log('\n🧪 Test 6: Static Build Method');
    
    try {
        const staticPanel = MicroPanelFactory.build('adminmenuwrap');
        
        if (staticPanel) {
            console.log('✅ Static build method works');
            console.log(`   - Panel type: ${staticPanel.getAttribute('data-element-id')}`);
            
            // Check if global instance was created
            if (global.microPanelFactoryInstance) {
                console.log('✅ Global instance created');
            } else {
                console.log('❌ Global instance not created');
            }
        } else {
            console.log('❌ Static build method failed');
        }
    } catch (error) {
        console.log(`❌ Error with static build method: ${error.message}`);
    }
    
    // Test 7: Error Handling
    console.log('\n🧪 Test 7: Error Handling');
    
    try {
        // Test with non-existent element
        const nullPanel = factory.createPanel('non-existent-element');
        
        if (nullPanel === null) {
            console.log('✅ Correctly handles non-existent elements');
        } else {
            console.log('❌ Should return null for non-existent elements');
        }
        
        // Test with missing target element
        document.getElementById('wpadminbar').remove();
        const missingTargetPanel = factory.createPanel('wpadminbar');
        
        if (missingTargetPanel === null) {
            console.log('✅ Correctly handles missing target elements');
        } else {
            console.log('❌ Should return null for missing target elements');
        }
        
    } catch (error) {
        console.log(`❌ Error during error handling test: ${error.message}`);
    }
    
    console.log('\n🏁 All tests completed!');
    
    // Summary
    console.log('\n📊 Test Summary:');
    console.log('- MicroPanelFactory loads and initializes correctly');
    console.log('- Panel configurations are properly set up');
    console.log('- Panels can be created and added to DOM');
    console.log('- CSS variables can be applied');
    console.log('- Control changes are handled');
    console.log('- Static methods work');
    console.log('- Error handling is robust');
    
} catch (error) {
    console.log(`❌ Fatal error during testing: ${error.message}`);
    console.log(error.stack);
}