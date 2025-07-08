// Test Micro Panel - Krok po kroku
console.log('=== MICRO PANEL TEST - KROK PO KROKU ===');

// KROK 1: Sprawdź podstawowe komponenty
console.log('\n--- KROK 1: Sprawdzanie komponentów ---');
console.log('MAS:', window.MAS ? '✅ Załadowany' : '❌ Brak');
console.log('ConfigManager:', window.ConfigManager ? '✅ Załadowany' : '❌ Brak');
console.log('SettingsManager:', window.SettingsManager ? '✅ Załadowany' : '❌ Brak');

// KROK 2: Sprawdź Live Edit Mode
console.log('\n--- KROK 2: Live Edit Mode ---');
const isLiveEditActive = document.body.classList.contains('mas-edit-mode-active');
console.log('Live Edit Mode:', isLiveEditActive ? '✅ Aktywny' : '❌ Nieaktywny');

// KROK 3: Włącz Live Edit Mode jeśli nieaktywny
if (!isLiveEditActive) {
    console.log('Włączam Live Edit Mode...');
    document.body.classList.add('mas-edit-mode-active');
    
    // Sprawdź czy toggle istnieje
    const toggle = document.getElementById('mas-v2-edit-mode-switch');
    if (toggle) {
        toggle.checked = true;
        console.log('Toggle ustawiony na: checked');
    }
    
    // Wywołaj handler
    if (window.MAS && window.MAS.handleLiveEditModeToggle) {
        window.MAS.handleLiveEditModeToggle();
        console.log('Handler wywołany');
    }
}

// KROK 4: Przygotuj elementy
console.log('\n--- KROK 4: Przygotowanie elementów ---');
if (window.MAS && window.MAS.prepareEditableElements) {
    window.MAS.prepareEditableElements();
    console.log('Elementy przygotowane');
}

// Sprawdź elementy edytowalne
const editableElements = document.querySelectorAll('[data-mas-editable="true"]');
console.log('Znalezione elementy edytowalne:', editableElements.length);
editableElements.forEach(el => {
    console.log('  -', el.getAttribute('data-mas-element-name'), '(', el.getAttribute('data-mas-element-type'), ')');
});

// KROK 5: Inicjalizuj ikony edycji
console.log('\n--- KROK 5: Ikony edycji ---');
if (window.MAS && window.MAS.initializeEditableElements) {
    window.MAS.initializeEditableElements();
    console.log('Ikony zainicjalizowane');
}

// Sprawdź ikony
const cogs = document.querySelectorAll('.mas-context-cog');
console.log('Znalezione ikony edycji (cogs):', cogs.length);

// KROK 6: Sprawdź ConfigManager
console.log('\n--- KROK 6: ConfigManager ---');
if (window.ConfigManager) {
    console.log('Config loaded:', window.ConfigManager.config ? '✅ Tak' : '❌ Nie');
    
    // Sprawdź config dla admin bar
    const adminBarConfig = window.ConfigManager.getComponentConfig('wpadminbar');
    console.log('Admin bar config:', adminBarConfig ? '✅ Dostępny' : '❌ Brak');
    
    if (adminBarConfig) {
        console.log('Tabs:', adminBarConfig.tabs ? Object.keys(adminBarConfig.tabs).length : 0);
    }
}

// KROK 7: Sprawdź SettingsManager
console.log('\n--- KROK 7: SettingsManager ---');
if (window.SettingsManager) {
    console.log('Initialized:', window.SettingsManager.isInitialized ? '✅ Tak' : '❌ Nie');
    console.log('Settings count:', Object.keys(window.SettingsManager.settings || {}).length);
}

console.log('\n=== KONIEC TESTU ===');
console.log('\nAby otworzyć micro panel dla Admin Bar, wpisz:');
console.log('window.MAS.openMicroPanel(document.getElementById("wpadminbar"))'); 