<?php
/**
 * Test skrypt dla debugowania zapisywania ustawień MAS V2
 * Uruchom: wp eval-file debug-save-test.php
 */

echo "=== TEST ZAPISYWANIA USTAWIEŃ MAS V2 ===\n";

// Test 1: Sprawdź obecne ustawienia
echo "\n1. Sprawdzanie obecnych ustawień:\n";
$current_settings = get_option('mas_v2_settings', []);
echo "Znalezione ustawienia: " . (empty($current_settings) ? "BRAK" : count($current_settings) . " opcji") . "\n";

if (!empty($current_settings)) {
    echo "Przykładowe ustawienia:\n";
    $sample = array_slice($current_settings, 0, 5, true);
    foreach ($sample as $key => $value) {
        echo "  $key: " . (is_array($value) ? 'array(' . count($value) . ')' : $value) . "\n";
    }
}

// Test 2: Sprawdź czy można zapisać
echo "\n2. Test zapisywania:\n";
$test_settings = [
    'theme' => 'modern',
    'color_scheme' => 'light',
    'test_timestamp' => current_time('mysql'),
    'test_value' => 'test_' . time()
];

$save_result = update_option('mas_v2_settings_test', $test_settings);
echo "Wynik zapisywania testowego: " . ($save_result ? "SUKCES" : "BŁĄD") . "\n";

// Sprawdź czy zostało zapisane
$retrieved = get_option('mas_v2_settings_test', null);
echo "Odczyt testowy: " . ($retrieved ? "SUKCES" : "BŁĄD") . "\n";

// Test 3: Sprawdź hooki AJAX
echo "\n3. Sprawdzanie hooków AJAX:\n";
global $wp_filter;

$ajax_hooks = [
    'wp_ajax_mas_v2_save_settings',
    'wp_ajax_mas_v2_reset_settings',
    'wp_ajax_mas_v2_export_settings',
    'wp_ajax_mas_v2_import_settings'
];

foreach ($ajax_hooks as $hook) {
    if (isset($wp_filter[$hook])) {
        $callbacks = count($wp_filter[$hook]->callbacks);
        echo "  $hook: $callbacks callback(s)\n";
        
        // Pokaż szczegóły
        foreach ($wp_filter[$hook]->callbacks as $priority => $group) {
            foreach ($group as $callback) {
                if (is_array($callback['function'])) {
                    $class = is_object($callback['function'][0]) ? get_class($callback['function'][0]) : $callback['function'][0];
                    echo "    -> $class::{$callback['function'][1]} (priority: $priority)\n";
                } else {
                    echo "    -> {$callback['function']} (priority: $priority)\n";
                }
            }
        }
    } else {
        echo "  $hook: BRAK\n";
    }
}

// Test 4: Sprawdź czy plugin jest aktywny
echo "\n4. Sprawdzanie stanu pluginu:\n";
$active_plugins = get_option('active_plugins', []);
$mas_active = false;

foreach ($active_plugins as $plugin) {
    if (strpos($plugin, 'modern-admin-styler') !== false) {
        echo "  Plugin aktywny: $plugin\n";
        $mas_active = true;
        break;
    }
}

if (!$mas_active) {
    echo "  Plugin MAS V2: NIEAKTYWNY\n";
}

// Test 5: Sprawdź uprawnienia
echo "\n5. Sprawdzanie uprawnień:\n";
echo "  Obecny użytkownik ID: " . get_current_user_id() . "\n";
echo "  Uprawnienia manage_options: " . (current_user_can('manage_options') ? "TAK" : "NIE") . "\n";

// Test 6: Sprawdź czy klasa istnieje
echo "\n6. Sprawdzanie klas:\n";
echo "  ModernAdminStylerV2: " . (class_exists('ModernAdminStylerV2') ? "ISTNIEJE" : "BRAK") . "\n";

// Podsumowanie
echo "\n=== PODSUMOWANIE ===\n";
if ($save_result && $retrieved && $mas_active) {
    echo "✅ Podstawowa funkcjonalność zapisu działa\n";
    echo "🔍 Problem może być w:\n";
    echo "   - JavaScript/AJAX (sprawdź konsolę przeglądarki)\n";
    echo "   - Nonce verification\n";
    echo "   - Sanityzacji danych\n";
    echo "   - Konfliktach między hookami\n";
} else {
    echo "❌ Wykryto problemy z zapisem lub stanem pluginu\n";
}

// Czyszczenie
delete_option('mas_v2_settings_test');
echo "\nTest zakończony.\n";
?> 