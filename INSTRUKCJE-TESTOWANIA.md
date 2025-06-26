# Instrukcje testowania naprawy zapisywania ustawień MAS V2

## Co zostało naprawione:

1. **Dublowanie hooków AJAX** - usunięte podwójne rejestrowanie
2. **Problem z checkboxami** - dodana specjalna obsługa dla pól boolean
3. **Dodany debug logging** - logi w WordPress error log
4. **Dodany debug script** - automatyczne diagnozowanie w przeglądarce

## Jak przetestować:

### 1. Sprawdź konsolę przeglądarki
1. Otwórz stronę ustawień MAS V2 w WordPress admin
2. Naciśnij F12 aby otworzyć narzędzia developerskie
3. Przejdź do zakładki "Console"
4. Powinieneś zobaczyć logi rozpoczynające się od "=== MAS V2 DEBUG SCRIPT LOADED ==="

### 2. Test zmiany ustawień
1. Zmień jakiekolwiek ustawienie (np. kolor, checkbox, slider)
2. Kliknij "Zapisz ustawienia"
3. W konsoli sprawdź czy są błędy
4. Sprawdź czy ustawienie zostało zapisane po odświeżeniu strony

### 3. Test manualny przez konsolę
1. W konsoli przeglądarki wpisz: `debugMasSave()`
2. Naciśnij Enter
3. Sprawdź odpowiedź w konsoli

### 4. Test WordPress error log
1. Włącz debug w wp-config.php:
   ```php
   define('WP_DEBUG', true);
   define('WP_DEBUG_LOG', true);
   ```
2. Spróbuj zapisać ustawienia
3. Sprawdź plik `/wp-content/debug.log` czy są logi "MAS V2:"

### 5. Test CLI (opcjonalny)
```bash
cd /ścieżka/do/wordpress
wp eval-file wp-content/plugins/modern-admin-styler-v2/debug-save-test.php
```

## Oczekiwane wyniki:

### ✅ Prawidłowe zachowanie:
- Logi w konsoli bez błędów
- Komunikat "Ustawienia zostały zapisane pomyślnie!"
- Ustawienia pozostają po odświeżeniu strony
- W error log: "MAS V2: Settings saved: success"

### ❌ Problemy do zgłoszenia:
- Błędy JavaScript w konsoli
- Komunikat "Wystąpił błąd podczas zapisywania"
- Ustawienia znikają po odświeżeniu
- W error log: "MAS V2: Settings saved: failed"

## Najczęstsze przyczyny problemów:

1. **Brak uprawnień** - sprawdź czy jesteś zalogowany jako administrator
2. **Konflikt z innym pluginem** - wyłącz inne pluginy tymczasowo
3. **Problem z bazą danych** - sprawdź czy WordPress może zapisywać opcje
4. **Błędny nonce** - sprawdź czy strona nie wygasła (odśwież przed testem)

## Debugowanie zaawansowane:

Jeśli nadal są problemy, sprawdź w konsoli:
```javascript
// Sprawdź czy wszystko jest załadowane
console.log(typeof masV2, typeof MAS);

// Sprawdź current data
console.log('Current settings:', masV2.settings);

// Test manual save
debugMasSave();
```

## Co robić dalej:

1. **Jeśli działa** - usuń debug script z `modern-admin-styler-v2.php` (linia z `mas-v2-debug`)
2. **Jeśli nie działa** - skopiuj wszystkie błędy z konsoli i error log
3. **Jeśli częściowo działa** - sprawdź które konkretne ustawienia nie są zapisywane

---

**Uwaga**: Pliki debug (`debug-save-test.php`, `debug-frontend.js`) można usunąć po zakończeniu testów. 