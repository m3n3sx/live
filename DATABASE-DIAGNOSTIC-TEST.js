// DATABASE DIAGNOSTIC TEST FOR MAS V2 SETTINGS
// Run this in your browser console on the admin page

console.log('🔍 MAS V2 DATABASE DIAGNOSTIC TEST');
console.log('==================================');

// Test 1: Check current database value directly
function testDatabaseDirectly() {
    console.log('🧪 TEST 1: Direct Database Check');
    
    // Make AJAX call to check current database value
    jQuery.post(ajaxurl, {
        action: 'wp_ajax_mas_v2_db_check',
        option_name: 'mas_v2_settings',
        _wpnonce: getMasData().nonce
    }, function(response) {
        console.log('📊 Database Response:', response);
        
        if (response.success) {
            const settings = response.data.settings;
            console.log('📋 Current admin_bar_height in DB:', settings.admin_bar_height);
            console.log('📋 Database last updated:', response.data.last_modified);
            console.log('📋 Total settings count:', Object.keys(settings).length);
        } else {
            console.error('❌ Database check failed:', response.data);
        }
    }).fail(function(xhr, status, error) {
        console.error('❌ AJAX request failed:', error);
    });
}

// Test 2: Save and immediately verify
function testSaveAndVerify() {
    console.log('🧪 TEST 2: Save and Immediate Verification');
    
    const testValue = 60; // Different from default 32
    console.log('💾 Saving admin_bar_height:', testValue);
    
    // Get current form data
    const formData = new FormData(document.querySelector('#mas-v2-settings-form'));
    
    // Override the specific field we want to test
    formData.set('admin_bar_height', testValue);
    formData.set('action', 'mas_v2_save_settings');
    formData.set('nonce', getMasData().nonce);
    
    // Convert FormData to URL-encoded string
    const urlencoded = new URLSearchParams();
    for (const [key, value] of formData) {
        urlencoded.append(key, value);
    }
    
    // Save settings
    jQuery.post(ajaxurl, urlencoded.toString(), function(saveResponse) {
        console.log('💾 Save Response:', saveResponse);
        
        if (saveResponse.success) {
            console.log('✅ Save successful, returned admin_bar_height:', saveResponse.data.settings.admin_bar_height);
            
            // Immediately check database again
            setTimeout(() => {
                testDatabaseDirectly();
            }, 1000);
        } else {
            console.error('❌ Save failed:', saveResponse.data);
        }
    }, 'json').fail(function(xhr, status, error) {
        console.error('❌ Save AJAX failed:', error);
    });
}

// Test 3: WordPress option system test
function testWordPressOptions() {
    console.log('🧪 TEST 3: WordPress Options System Check');
    
    // Test if we can access wp_options table
    jQuery.post(ajaxurl, {
        action: 'wp_ajax_mas_v2_options_test',
        _wpnonce: getMasData().nonce
    }, function(response) {
        console.log('🔧 WordPress Options Test:', response);
        
        if (response.success) {
            console.log('✅ WordPress options system working');
            console.log('📊 Test option save/retrieve:', response.data.test_result);
        } else {
            console.error('❌ WordPress options system failed:', response.data);
        }
    }).fail(function(xhr, status, error) {
        console.error('❌ Options test failed:', error);
    });
}

// Test 4: Cache and transient check
function testCacheSystem() {
    console.log('🧪 TEST 4: Cache System Check');
    
    jQuery.post(ajaxurl, {
        action: 'wp_ajax_mas_v2_cache_check',
        _wpnonce: getMasData().nonce
    }, function(response) {
        console.log('🗄️ Cache Check:', response);
        
        if (response.success) {
            console.log('📊 WordPress caching status:', response.data.cache_status);
            console.log('📊 Plugin cache status:', response.data.plugin_cache);
        }
    }).fail(function(xhr, status, error) {
        console.error('❌ Cache check failed:', error);
    });
}

// Helper function from our plugin
function getMasData() {
    return window.masV2 || window.masV2Global || { nonce: '', ajaxUrl: ajaxurl };
}

// Run all tests
function runFullDatabaseDiagnostic() {
    console.log('🚀 Starting Full Database Diagnostic...');
    
    testDatabaseDirectly();
    
    setTimeout(() => {
        testWordPressOptions();
    }, 2000);
    
    setTimeout(() => {
        testCacheSystem();
    }, 4000);
    
    setTimeout(() => {
        console.log('🎯 Ready for save test. Run testSaveAndVerify() when ready.');
    }, 6000);
}

// Make functions available globally
window.masV2DbDiagnostic = {
    testDatabaseDirectly,
    testSaveAndVerify,
    testWordPressOptions,
    testCacheSystem,
    runFullDatabaseDiagnostic
};

console.log('🎯 Available functions:');
console.log('- masV2DbDiagnostic.runFullDatabaseDiagnostic()');
console.log('- masV2DbDiagnostic.testSaveAndVerify()');
console.log('- masV2DbDiagnostic.testDatabaseDirectly()');

// Auto-start basic test
runFullDatabaseDiagnostic(); 