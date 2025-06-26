// SZYBKI TEST POLA admin_bar_height
// Uruchom to w konsoli przeglądarki na stronie mas-v2-admin-bar

console.log('🔍 SZYBKI TEST POLA admin_bar_height');
console.log('==================================');

// Test 1: Sprawdź czy pole istnieje
const heightField = document.querySelector('[name="admin_bar_height"]');
console.log('1. Pole admin_bar_height znalezione:', !!heightField);

if (heightField) {
    console.log('   - Obecna wartość:', heightField.value);
    console.log('   - Typ pola:', heightField.type);
    console.log('   - Min:', heightField.min);
    console.log('   - Max:', heightField.max);
    console.log('   - ID:', heightField.id);
    console.log('   - Widoczne:', heightField.offsetParent !== null);
    
    // Test 2: Zmień wartość
    console.log('2. Zmieniam wartość na 50...');
    heightField.value = 50;
    heightField.dispatchEvent(new Event('input', { bubbles: true }));
    console.log('   - Nowa wartość:', heightField.value);
    
    // Test 3: Sprawdź slider value display
    const valueDisplay = document.querySelector('[data-target="admin_bar_height"]');
    console.log('3. Wyświetlacz wartości:', valueDisplay ? valueDisplay.textContent : 'NIE ZNALEZIONO');
    
    // Test 4: Sprawdź FormData
    const form = document.querySelector('#mas-v2-settings-form');
    if (form) {
        const formData = new FormData(form);
        console.log('4. Wartość w FormData:', formData.get('admin_bar_height'));
    }
    
    // Test 5: Sprawdź jQuery 
    if (typeof jQuery !== 'undefined') {
        const jqValue = jQuery('[name="admin_bar_height"]').val();
        console.log('5. Wartość w jQuery:', jqValue);
    }
    
} else {
    console.error('❌ POLE admin_bar_height NIE ZOSTAŁO ZNALEZIONE!');
    
    // Sprawdź wszystkie pola z admin_bar w nazwie
    const allAdminBarFields = document.querySelectorAll('[name*="admin_bar"]');
    console.log('Wszystkie pola admin_bar:', Array.from(allAdminBarFields).map(f => f.name));
}

// Test 6: Sprawdź czy formularz ma wszystkie wymagane elementy
const form = document.querySelector('#mas-v2-settings-form');
if (form) {
    console.log('6. Formularz znaleziony, total pól:', form.querySelectorAll('input, select, textarea').length);
} else {
    console.error('❌ FORMULARZ #mas-v2-settings-form NIE ZNALEZIONY!');
}

console.log('\n💡 Jeśli pole istnieje ale nie zapisuje się:');
console.log('   - Zmień wartość ręcznie w formularzu');
console.log('   - Kliknij Zapisz');
console.log('   - Sprawdź Network tab w dev tools'); 