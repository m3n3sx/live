// 🔍 DEEP DIAGNOSTIC: Szczegółowa diagnostyka zapisywania ustawień
// Skopiuj i uruchom w konsoli przeglądarki na stronie ustawień wtyczki

console.log('🔍 DEEP DIAGNOSTIC - MAS V2 Settings Save Issue');
console.log('Debugging why settings revert to defaults after save...\n');

// Test 1: Sprawdź dostępne obiekty
console.log('📋 TEST 1: Available Objects');
console.log('window.masV2:', window.masV2);
console.log('window.masV2Global:', window.masV2Global);
console.log('window.MAS:', window.MAS);

const masData = window.masV2 || window.masV2Global || {};
console.log('masData (merged):', masData);

// Test 2: Sprawdź current settings w obiekcie
console.log('\n📋 TEST 2: Current Settings in JS Object');
const settings = masData.settings || {};
console.log('Settings object:', settings);
console.log('enable_plugin:', settings.enable_plugin);
console.log('admin_bar_height:', settings.admin_bar_height);

// Test 3: Sprawdź wartości w formularzu
console.log('\n📋 TEST 3: Form Values Check');
const form = document.getElementById('mas-v2-settings-form');
if (form) {
    console.log('Form found ✅');
    
    // Sprawdź konkretne pole admin_bar_height
    const adminBarHeight = form.querySelector('input[name="admin_bar_height"]');
    console.log('admin_bar_height field:', adminBarHeight);
    if (adminBarHeight) {
        console.log('Current value in form:', adminBarHeight.value);
        console.log('Field type:', adminBarHeight.type);
        console.log('Field name:', adminBarHeight.name);
    }
    
    // Sprawdź enable_plugin checkbox
    const enablePlugin = form.querySelector('input[name="enable_plugin"]');
    console.log('enable_plugin field:', enablePlugin);
    if (enablePlugin) {
        console.log('enable_plugin checked:', enablePlugin.checked);
        console.log('enable_plugin value:', enablePlugin.value);
    }
} else {
    console.error('Form NOT found ❌');
}

// Test 4: Simuluj getFormData z MAS obiektu
console.log('\n📋 TEST 4: Simulate Form Data Collection');
if (window.MAS && typeof window.MAS.getFormData === 'function') {
    const formData = window.MAS.getFormData();
    console.log('getFormData() result:', formData);
    console.log('admin_bar_height in formData:', formData.admin_bar_height);
    console.log('enable_plugin in formData:', formData.enable_plugin);
} else {
    console.log('MAS.getFormData not available - collecting manually...');
    
    // Manual form data collection
    const manualFormData = {};
    if (form) {
        const inputs = form.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            if (input.name) {
                if (input.type === 'checkbox') {
                    manualFormData[input.name] = input.checked ? 1 : 0;
                } else if (input.type === 'radio') {
                    if (input.checked) {
                        manualFormData[input.name] = input.value;
                    }
                } else {
                    manualFormData[input.name] = input.value;
                }
            }
        });
        console.log('Manual form data:', manualFormData);
        console.log('admin_bar_height manual:', manualFormData.admin_bar_height);
        console.log('enable_plugin manual:', manualFormData.enable_plugin);
    }
}

// Test 5: Test rzeczywistego AJAX request (bez zapisywania)
console.log('\n📋 TEST 5: AJAX Request Simulation (DRY RUN)');
if (masData.ajaxUrl && masData.nonce) {
    console.log('AJAX URL:', masData.ajaxUrl);
    console.log('Nonce:', masData.nonce);
    
    // Symuluj dane które byłyby wysłane
    const testData = {
        action: 'mas_v2_save_settings',
        nonce: masData.nonce,
        admin_bar_height: '60', // Test value
        enable_plugin: '1'
    };
    
    console.log('Would send data:', testData);
    
    // Rzeczywisty test AJAX (tylko jeśli użytkownik potwierdzi)
    const doRealTest = confirm('Czy wykonać rzeczywisty test AJAX (NIE zapisze ustawień, tylko sprawdzi response)?');
    if (doRealTest) {
        console.log('🔄 Executing real AJAX test...');
        
        fetch(masData.ajaxUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                action: 'mas_v2_save_settings',
                nonce: masData.nonce,
                admin_bar_height: '999', // Unique test value to identify
                test_mode: 'diagnostic'
            })
        })
        .then(response => response.json())
        .then(data => {
            console.log('✅ AJAX Response:', data);
            if (data.success) {
                console.log('✅ AJAX successful - server accepts requests');
                console.log('Response data:', data.data);
            } else {
                console.error('❌ AJAX failed:', data.data);
            }
        })
        .catch(error => {
            console.error('❌ AJAX error:', error);
        });
    }
} else {
    console.error('❌ Cannot test AJAX - missing URL or nonce');
}

// Test 6: Sprawdź PHP error logs instruction
console.log('\n📋 TEST 6: PHP Error Logs Check Instructions');
console.log('To check PHP error logs:');
console.log('1. Enable WP_DEBUG in wp-config.php');
console.log('2. Check /wp-content/debug.log file');
console.log('3. Look for "MAS V2:" messages');
console.log('4. Check for any PHP errors during AJAX requests');

// Test 7: WordPress database check instruction  
console.log('\n📋 TEST 7: Database Check Instructions');
console.log('Run this SQL query to check current settings in database:');
console.log('SELECT option_value FROM wp_options WHERE option_name = "mas_v2_settings";');
console.log('Look for admin_bar_height value in JSON');

// Test 8: Immediate form submission test
console.log('\n📋 TEST 8: Form Submission Test Available');
console.log('To test form submission manually:');
console.log('1. Change admin_bar_height to 60px');
console.log('2. Open Network tab in DevTools');
console.log('3. Click Save Settings');
console.log('4. Check admin-ajax.php request');
console.log('5. Check request payload and response');

// Summary
console.log('\n📋 SUMMARY');
console.log('Run this diagnostic and share results:');
console.log('1. Form data collection results');
console.log('2. AJAX test results (if performed)');
console.log('3. Network tab screenshot during save');
console.log('4. PHP error logs');
console.log('5. Database query results');

console.log('\n🔍 Deep diagnostic completed.');
console.log('Next: Change admin_bar_height to 60px and save while monitoring Network tab'); 