/**
 * 🧪 WOOW! Live Edit Toggle Button - Manual UI Test Script
 * 
 * This script validates the Live Edit Toggle Button functionality
 * according to Task 1 requirements:
 * 
 * ✅ Toggle button detection (#mas-v2-edit-mode-switch, .mas-live-edit-toggle)
 * ✅ Emergency fallback button creation
 * ✅ Click functionality validation
 * ✅ Live Edit mode activation/deactivation
 * 
 * Usage: Run this script in browser console while on WordPress admin page
 */

class LiveEditToggleValidator {
    constructor() {
        this.results = {
            selectors: {},
            functionality: {},
            emergency: {},
            validation: {}
        };
        
        this.init();
    }
    
    init() {
        console.log('🧪 WOOW! Live Edit Toggle Validator - Starting...');
        this.runTests();
    }
    
    async runTests() {
        console.log('\n=== 🔍 Phase 1: Selector Detection ===');
        await this.testSelectorDetection();
        
        console.log('\n=== 🎛️ Phase 2: Functionality Testing ===');
        await this.testToggleFunctionality();
        
        console.log('\n=== 🚨 Phase 3: Emergency Fallback ===');
        await this.testEmergencyFallback();
        
        console.log('\n=== ✅ Phase 4: Live Edit Validation ===');
        await this.testLiveEditActivation();
        
        console.log('\n=== 📊 Final Test Results ===');
        this.displayResults();
    }
    
    async testSelectorDetection() {
        const selectors = [
            { id: 'primary', selector: '#mas-v2-edit-mode-switch', type: 'checkbox' },
            { id: 'hero', selector: '#mas-v2-edit-mode-switch-hero', type: 'checkbox' },
            { id: 'floating', selector: '.mas-live-edit-toggle', type: 'button' },
            { id: 'fallback', selector: '.woow-live-edit-toggle', type: 'button' },
            { id: 'emergency', selector: '.woow-emergency-toggle', type: 'button' }
        ];
        
        console.log('🔍 Testing selector detection...');
        
        selectors.forEach(({ id, selector, type }) => {
            const element = document.querySelector(selector);
            const found = !!element;
            const visible = found ? this.isElementVisible(element) : false;
            const functional = found ? this.isElementFunctional(element, type) : false;
            
            this.results.selectors[id] = {
                selector,
                found,
                visible,
                functional,
                element
            };
            
            console.log(`🔍 ${id}: "${selector}" =>`, {
                found: found ? '✅' : '❌',
                visible: visible ? '✅' : '❌',
                functional: functional ? '✅' : '❌'
            });
        });
    }
    
    isElementVisible(element) {
        if (!element) return false;
        
        const rect = element.getBoundingClientRect();
        const style = window.getComputedStyle(element);
        
        return (
            rect.width > 0 && 
            rect.height > 0 && 
            style.display !== 'none' && 
            style.visibility !== 'hidden' && 
            style.opacity !== '0'
        );
    }
    
    isElementFunctional(element, type) {
        if (!element) return false;
        
        try {
            if (type === 'checkbox') {
                return element.type === 'checkbox' && typeof element.checked === 'boolean';
            } else if (type === 'button') {
                return element.style.cursor === 'pointer' || element.onclick !== null;
            }
            return true;
        } catch (e) {
            return false;
        }
    }
    
    async testToggleFunctionality() {
        console.log('🎛️ Testing toggle functionality...');
        
        // Find the best available toggle
        const availableToggle = this.findBestToggle();
        
        if (!availableToggle) {
            this.results.functionality.available = false;
            console.log('❌ No functional toggle found');
            return;
        }
        
        console.log('✅ Found functional toggle:', availableToggle.id);
        
        // Test click/change functionality
        try {
            const initialState = this.getLiveEditState();
            console.log('📊 Initial Live Edit state:', initialState);
            
            // Simulate toggle activation
            if (availableToggle.type === 'checkbox') {
                availableToggle.element.checked = !availableToggle.element.checked;
                availableToggle.element.dispatchEvent(new Event('change', { bubbles: true }));
            } else {
                availableToggle.element.click();
            }
            
            // Wait for state change
            await this.sleep(500);
            
            const newState = this.getLiveEditState();
            console.log('📊 New Live Edit state:', newState);
            
            this.results.functionality = {
                available: true,
                toggleId: availableToggle.id,
                stateChanged: initialState.active !== newState.active,
                bodyClassesUpdated: newState.bodyClasses.length > initialState.bodyClasses.length
            };
            
            console.log('✅ Toggle functionality test completed');
            
        } catch (error) {
            console.error('❌ Toggle functionality test failed:', error);
            this.results.functionality.error = error.message;
        }
    }
    
    findBestToggle() {
        // Priority order: primary > floating > emergency > hero > fallback
        const priorities = ['primary', 'floating', 'emergency', 'hero', 'fallback'];
        
        for (const id of priorities) {
            const toggle = this.results.selectors[id];
            if (toggle && toggle.found && toggle.visible && toggle.functional) {
                return {
                    id,
                    element: toggle.element,
                    type: id === 'primary' || id === 'hero' ? 'checkbox' : 'button'
                };
            }
        }
        
        return null;
    }
    
    getLiveEditState() {
        const bodyClasses = [];
        const classes = ['mas-live-edit-active', 'mas-edit-mode-active', 'woow-live-edit-enabled'];
        
        classes.forEach(cls => {
            if (document.body.classList.contains(cls)) {
                bodyClasses.push(cls);
            }
        });
        
        return {
            active: bodyClasses.length > 0,
            bodyClasses,
            editableElements: document.querySelectorAll('[data-woow-editable="true"]').length,
            microPanels: document.querySelectorAll('.mas-micro-panel').length
        };
    }
    
    async testEmergencyFallback() {
        console.log('🚨 Testing emergency fallback...');
        
        // Check if LiveEditEngine is available
        const hasLiveEditInstance = !!(window.liveEditInstance && window.liveEditInstance.createEmergencyToggle);
        
        if (!hasLiveEditInstance) {
            this.results.emergency.available = false;
            console.log('❌ LiveEditEngine instance not available');
            return;
        }
        
        // Hide existing toggles temporarily to trigger emergency mode
        const existingToggles = [];
        Object.values(this.results.selectors).forEach(toggle => {
            if (toggle.found && toggle.visible) {
                existingToggles.push({
                    element: toggle.element,
                    originalDisplay: toggle.element.style.display
                });
                toggle.element.style.display = 'none';
            }
        });
        
        console.log('🚨 Hidden existing toggles, creating emergency toggle...');
        
        try {
            // Create emergency toggle
            const emergencyToggle = window.liveEditInstance.createEmergencyToggle();
            
            await this.sleep(100);
            
            const verification = document.querySelector('.woow-emergency-toggle');
            
            this.results.emergency = {
                available: true,
                created: !!emergencyToggle,
                visible: verification ? this.isElementVisible(verification) : false,
                functional: verification ? this.isElementFunctional(verification, 'button') : false
            };
            
            console.log('✅ Emergency toggle test:', this.results.emergency);
            
        } catch (error) {
            console.error('❌ Emergency toggle test failed:', error);
            this.results.emergency.error = error.message;
        }
        
        // Restore original toggles
        existingToggles.forEach(({ element, originalDisplay }) => {
            element.style.display = originalDisplay;
        });
        
        // Clean up emergency toggle
        const emergencyToggle = document.querySelector('.woow-emergency-toggle');
        if (emergencyToggle) {
            emergencyToggle.remove();
        }
        
        console.log('🧹 Cleaned up emergency test');
    }
    
    async testLiveEditActivation() {
        console.log('✅ Testing Live Edit activation validation...');
        
        const toggle = this.findBestToggle();
        if (!toggle) {
            this.results.validation.possible = false;
            console.log('❌ No toggle available for validation');
            return;
        }
        
        try {
            // Get initial state
            const before = this.getLiveEditState();
            
            // Activate Live Edit
            if (toggle.type === 'checkbox') {
                toggle.element.checked = true;
                toggle.element.dispatchEvent(new Event('change', { bubbles: true }));
            } else {
                if (!before.active) {
                    toggle.element.click();
                }
            }
            
            await this.sleep(1000);
            
            const after = this.getLiveEditState();
            
            this.results.validation = {
                possible: true,
                activated: after.active,
                bodyClassesAdded: after.bodyClasses.length > before.bodyClasses.length,
                editableElementsFound: after.editableElements > 0,
                validationToastShown: !!document.querySelector('.woow-validation-toast')
            };
            
            console.log('✅ Live Edit validation results:', this.results.validation);
            
            // Deactivate for cleanup
            if (toggle.type === 'checkbox') {
                toggle.element.checked = false;
                toggle.element.dispatchEvent(new Event('change', { bubbles: true }));
            } else {
                if (after.active) {
                    toggle.element.click();
                }
            }
            
        } catch (error) {
            console.error('❌ Live Edit validation failed:', error);
            this.results.validation.error = error.message;
        }
    }
    
    displayResults() {
        const passed = this.calculatePassRate();
        
        console.log(`\n🏆 WOOW! Live Edit Toggle Validation Complete`);
        console.log(`📊 Overall Pass Rate: ${passed.percentage}% (${passed.passed}/${passed.total})`);
        
        console.log('\n📋 Detailed Results:');
        console.table(this.results);
        
        if (passed.percentage >= 80) {
            console.log('✅ PASS: Live Edit Toggle functionality is working correctly!');
        } else {
            console.log('❌ FAIL: Live Edit Toggle has issues that need attention.');
        }
        
        // Show recommendations
        this.showRecommendations();
    }
    
    calculatePassRate() {
        let passed = 0;
        let total = 0;
        
        // Selector tests
        Object.values(this.results.selectors).forEach(result => {
            total += 3; // found, visible, functional
            if (result.found) passed++;
            if (result.visible) passed++;
            if (result.functional) passed++;
        });
        
        // Functionality tests
        if (this.results.functionality.available !== undefined) {
            total += 3;
            if (this.results.functionality.available) passed++;
            if (this.results.functionality.stateChanged) passed++;
            if (this.results.functionality.bodyClassesUpdated) passed++;
        }
        
        // Emergency tests
        if (this.results.emergency.available !== undefined) {
            total += 3;
            if (this.results.emergency.created) passed++;
            if (this.results.emergency.visible) passed++;
            if (this.results.emergency.functional) passed++;
        }
        
        // Validation tests
        if (this.results.validation.possible !== undefined) {
            total += 3;
            if (this.results.validation.activated) passed++;
            if (this.results.validation.bodyClassesAdded) passed++;
            if (this.results.validation.editableElementsFound) passed++;
        }
        
        return {
            passed,
            total,
            percentage: Math.round((passed / total) * 100)
        };
    }
    
    showRecommendations() {
        console.log('\n💡 Recommendations:');
        
        const visibleToggles = Object.values(this.results.selectors).filter(r => r.visible);
        if (visibleToggles.length === 0) {
            console.log('🚨 CRITICAL: No visible toggles found - Emergency fallback should activate');
        }
        
        if (!this.results.functionality.available) {
            console.log('🔧 Check LiveEditEngine initialization');
        }
        
        if (!this.results.validation.activated) {
            console.log('🔧 Verify toggle event handlers are properly attached');
        }
        
        if (this.results.validation.editableElementsFound === 0) {
            console.log('🔧 Check prepareEditableElements() method');
        }
    }
    
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Auto-run if script is executed
if (typeof window !== 'undefined') {
    // Run validator
    const validator = new LiveEditToggleValidator();
    
    // Make available globally for manual testing
    window.liveEditToggleValidator = validator;
    
    console.log('\n🎮 Manual Testing Commands:');
    console.log('- window.liveEditToggleValidator.runTests() - Run full test suite');
    console.log('- window.liveEditToggleValidator.results - View current results');
    console.log('- window.liveEditToggleValidator.findBestToggle() - Find best available toggle');
} 