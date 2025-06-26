// 🔧 MAS V2 DIAGNOSTIC TEST SCRIPT
// Uruchom ten skrypt w konsoli przeglądarki na stronie ustawień wtyczki

console.log('🔧 MAS V2 Diagnostic Test Script - Starting...');

// Test 1: Sprawdź dostępność obiektów masV2/masV2Global
console.log('\n📋 TEST 1: Sprawdzenie dostępności obiektów JavaScript');
console.log('masV2 object:', window.masV2);
console.log('masV2Global object:', window.masV2Global);

const masData = window.masV2 || window.masV2Global || {};
console.log('Merged masData:', masData);

// Test 2: Sprawdź nonce
console.log('\n📋 TEST 2: Sprawdzenie nonce');
console.log('masV2.nonce:', window.masV2?.nonce);
console.log('masV2Global.nonce:', window.masV2Global?.nonce);
console.log('Merged nonce:', masData.nonce);

if (!masData.nonce) {
    console.error('❌ PROBLEM: Brak nonce! AJAX requests będą nieudane.');
} else {
    console.log('✅ Nonce available:', masData.nonce);
}

// Test 3: Sprawdź AJAX URL
console.log('\n📋 TEST 3: Sprawdzenie AJAX URL');
console.log('masV2.ajaxUrl:', window.masV2?.ajaxUrl);
console.log('masV2Global.ajaxUrl:', window.masV2Global?.ajaxUrl);
console.log('Merged ajaxUrl:', masData.ajaxUrl);

if (!masData.ajaxUrl) {
    console.error('❌ PROBLEM: Brak AJAX URL!');
} else {
    console.log('✅ AJAX URL available:', masData.ajaxUrl);
}

// Test 4: Sprawdź formularz
console.log('\n📋 TEST 4: Sprawdzenie formularza');
const form = document.getElementById('mas-v2-settings-form');
console.log('Form element:', form);

if (!form) {
    console.error('❌ PROBLEM: Formularz #mas-v2-settings-form nie znaleziony!');
} else {
    console.log('✅ Form found');
    console.log('Form method:', form.method);
    console.log('Form action:', form.action);
}

// Test 5: Sprawdź obiekt MAS
console.log('\n📋 TEST 5: Sprawdzenie obiektu MAS');
console.log('MAS object:', window.MAS);

if (!window.MAS) {
    console.error('❌ PROBLEM: Obiekt MAS nie znaleziony!');
} else {
    console.log('✅ MAS object available');
    console.log('MAS.getMasData function:', typeof window.MAS.getMasData);
}

// Test 6: Sprawdź enable_plugin w settings
console.log('\n📋 TEST 6: Sprawdzenie enable_plugin');
const settings = masData.settings || {};
console.log('Settings object:', settings);
console.log('enable_plugin value:', settings.enable_plugin);

if (settings.enable_plugin === false) {
    console.warn('⚠️ WARNING: enable_plugin = false - wtyczka jest wyłączona!');
} else if (settings.enable_plugin === true) {
    console.log('✅ enable_plugin = true');
} else {
    console.warn('⚠️ WARNING: enable_plugin = undefined/null');
}

// Test 7: Test AJAX Request (tylko test nonce, bez zapisywania)
console.log('\n📋 TEST 7: Test AJAX Request (dry run)');
if (masData.ajaxUrl && masData.nonce) {
    const testData = {
        action: 'mas_v2_save_settings',
        nonce: masData.nonce,
        test_field: 'diagnostic_test'
    };
    
    console.log('Test AJAX data:', testData);
    console.log('🔄 Simulating AJAX request...');
    
    // Simulated request - nie wysyłamy rzeczywistego
    console.log('✅ AJAX request would be sent with valid nonce');
} else {
    console.error('❌ CANNOT TEST AJAX: Missing ajaxUrl or nonce');
}

// Test 8: Sprawdź loaded scripts
console.log('\n📋 TEST 8: Sprawdzenie załadowanych skryptów');
const scripts = Array.from(document.querySelectorAll('script[src*="mas-v2"]'));
console.log('MAS V2 scripts found:', scripts.length);
scripts.forEach((script, index) => {
    console.log(`Script ${index + 1}:`, script.src);
});

// Test 9: Sprawdź CSS styles
console.log('\n📋 TEST 9: Sprawdzenie CSS styles');
const styles = Array.from(document.querySelectorAll('link[href*="mas-v2"], style[id*="mas-v2"]'));
console.log('MAS V2 styles found:', styles.length);
styles.forEach((style, index) => {
    console.log(`Style ${index + 1}:`, style.href || 'inline style');
});

// Test 10: Summary
console.log('\n📋 SUMMARY - Podsumowanie diagnostyki');

const tests = [
    { name: 'masV2/masV2Global objects', status: !!(window.masV2 || window.masV2Global) },
    { name: 'nonce available', status: !!masData.nonce },
    { name: 'ajaxUrl available', status: !!masData.ajaxUrl },
    { name: 'form found', status: !!form },
    { name: 'MAS object', status: !!window.MAS },
    { name: 'enable_plugin = true', status: settings.enable_plugin === true },
    { name: 'scripts loaded', status: scripts.length > 0 },
    { name: 'styles loaded', status: styles.length > 0 }
];

tests.forEach(test => {
    const icon = test.status ? '✅' : '❌';
    console.log(`${icon} ${test.name}: ${test.status ? 'OK' : 'FAILED'}`);
});

const failedTests = tests.filter(test => !test.status);
if (failedTests.length === 0) {
    console.log('\n🎉 ALL TESTS PASSED! Wtyczka powinna działać poprawnie.');
} else {
    console.log(`\n⚠️ ${failedTests.length} TEST(S) FAILED. Problemy do naprawy:`);
    failedTests.forEach(test => {
        console.log(`- ${test.name}`);
    });
}

console.log('\n🔧 Diagnostic test completed. Check results above.');

// Instrukcje dalszych kroków
console.log('\n📋 NEXT STEPS - Dalsze kroki:');
console.log('1. Jeśli nonce FAILED: Sprawdź czy jesteś na stronie zakładki (mas-v2-general, etc.)');
console.log('2. Jeśli form FAILED: Sprawdź czy ID formularza to "mas-v2-settings-form"');
console.log('3. Jeśli enable_plugin FAILED: Sprawdź wartość w bazie: SELECT option_value FROM wp_options WHERE option_name = "mas_v2_settings";');
console.log('4. Jeśli scripts/styles FAILED: Sprawdź czy hook enqueue działa poprawnie');
console.log('5. Po naprawach: Odśwież stronę i uruchom test ponownie'); 