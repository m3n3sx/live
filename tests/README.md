# 🧪 Modern Admin Styler V2 - Comprehensive Tests

Kompleksowe testy automatyczne dla pluginu Modern Admin Styler V2 używające Playwright.

## 📋 Wymagania

- **Node.js** 16.0.0 lub nowszy
- **WordPress** uruchomiony na `http://localhost:10013`
- **Dostęp** do panelu administracyjnego z loginem `xxx` / hasłem `xxx`

## 🚀 Szybki start

### 1. Przygotowanie środowiska

```bash
# Upewnij się że WordPress działa
curl -I http://localhost:10013/wp-admin/

# Uruchom skrypt setup (automatycznie zainstaluje wszystko)
chmod +x ../run-tests.sh
../run-tests.sh --setup-only
```

### 2. Uruchomienie testów

```bash
# Wszystkie testy (pełna suita)
../run-tests.sh

# Tylko podstawowe testy (smoke tests)
../run-tests.sh --smoke

# Testy z widoczną przeglądarką
../run-tests.sh --headed

# Testy w trybie debug
../run-tests.sh --debug
```

## 📁 Struktura testów

```
tests/
├── playwright/
│   └── mas-v2-comprehensive-tests.js  # Główne testy
├── playwright.config.js              # Konfiguracja Playwright
├── global-setup.js                   # Setup przed testami
├── global-teardown.js               # Cleanup po testach
├── package.json                      # Zależności npm
└── README.md                         # Ta dokumentacja

test-results/                         # Wyniki testów
├── playwright-report/                # HTML raporty
├── results.json                      # JSON wyniki
└── summary.txt                       # Podsumowanie
```

## 🧪 Suity testów

### 1. **Testy podstawowe** (`--smoke`)
- ✅ Logowanie do WordPress
- ✅ Dostęp do menu MAS V2
- ✅ Sprawdzenie pozycjonowania menu

### 2. **Testy interfejsu pluginu**
- ✅ Załadowanie interfejsu MAS V2
- ✅ Sprawdzenie menu na stronie ustawień
- ✅ Nawigacja między zakładkami

### 3. **Testy funkcjonalności**
- ✅ Włączanie/wyłączanie opcji
- ✅ Zapisywanie ustawień
- ✅ Live Preview
- ✅ Weryfikacja braku błędów PHP

### 4. **Testy responsywności**
- ✅ Desktop (1920x1080, 1366x768)
- ✅ Tablet (1024x768, 768x1024) 
- ✅ Mobile (480x800, 320x568)

### 5. **Testy wydajności**
- ✅ Błędy JavaScript w konsoli
- ✅ Czasy ładowania stron
- ✅ Memory leaks podczas nawigacji

### 6. **Testy edge cases**
- ✅ Zachowanie przy problemach z JS
- ✅ Bardzo długie wartości w polach
- ✅ Ograniczone style CSS

### 7. **Test kompleksowy**
- ✅ Pełny workflow użytkownika
- ✅ Sprawdzenie wszystkich zakładek
- ✅ Veryfikacja braku regresji

## 🎯 Fokus na kluczowych problemach

### ⚠️ **Problem "uciekającego menu"**

Testy szczególnie sprawdzają czy:
- Menu WordPress nie "ucieka" do góry na stronach MAS V2
- Submenu działa poprawnie
- Position: fixed nie powoduje problemów
- CSS overrides działają właściwie

```bash
# Specjalne testy dla menu positioning
../run-tests.sh --grep "menu.*positioning|ucieka"
```

### 🔧 **Testy sanityzacji PHP**

- Sprawdzenie czy nie ma błędów `preg_match()`
- Weryfikacja sanityzacji tablic vs stringów
- Test zapisywania różnych typów danych

## 🖥️ Opcje uruchamiania

### Podstawowe opcje
```bash
../run-tests.sh                    # Wszystkie testy
../run-tests.sh --help            # Pomoc
../run-tests.sh --check-only      # Tylko sprawdź WordPress
../run-tests.sh --setup-only      # Tylko przygotuj środowisko
```

### Tryby wykonania
```bash
../run-tests.sh --headed          # Z widoczną przeglądarką
../run-tests.sh --debug           # Tryb debug (step-by-step)
../run-tests.sh --ui              # Interfejs użytkownika Playwright
```

### Specyficzne przeglądarki
```bash
../run-tests.sh --chromium        # Tylko Chrome/Chromium
../run-tests.sh --firefox         # Tylko Firefox
../run-tests.sh --webkit          # Tylko Safari/WebKit
```

### Urządzenia
```bash
../run-tests.sh --desktop         # Tylko desktop (Chrome, Firefox, Safari)
../run-tests.sh --mobile          # Tylko mobile (Chrome, Safari)
```

### Specyficzne suity
```bash
npm run test:smoke                # Podstawowe testy
npm run test:ui-tests             # Testy interfejsu
npm run test:functionality        # Testy funkcjonalności
npm run test:responsive           # Testy responsywności
npm run test:performance          # Testy wydajności
npm run test:edge-cases           # Testy edge cases
npm run test:comprehensive        # Test kompleksowy
```

## 📊 Raporty i wyniki

Po uruchomieniu testów dostępne są raporty:

### HTML Report (interaktywny)
```bash
npx playwright show-report test-results/playwright-report
```

### Bezpośredni dostęp do plików
```
test-results/
├── playwright-report/index.html   # Interaktywny raport HTML
├── results.json                   # Szczegółowe wyniki JSON
└── summary.txt                    # Krótkie podsumowanie
```

## 🐛 Debugowanie

### 1. Tryb debug (step-by-step)
```bash
../run-tests.sh --debug
```

### 2. Testy z widoczną przeglądarką
```bash
../run-tests.sh --headed
```

### 3. Interfejs użytkownika Playwright
```bash
../run-tests.sh --ui
```

### 4. Sprawdzenie konkretnego testu
```bash
npx playwright test --grep "Sprawdzenie że menu nie ucieka" --headed
```

### 5. Screenshoty i wideo
- **Screenshots**: Automatycznie przy błędach
- **Video**: Zapisywane przy nieudanych testach
- **Trace**: Dostępne w trybie retry

## 🔧 Rozwiązywanie problemów

### WordPress nie odpowiada
```bash
# Sprawdź czy WordPress działa
curl -I http://localhost:10013/wp-admin/

# Sprawdź logi WordPress
tail -f /path/to/wordpress/wp-content/debug.log
```

### Błędy logowania
- Sprawdź czy login/hasło są poprawne: `xxx` / `xxx`
- Sprawdź czy użytkownik ma uprawnienia administratora

### Błędy instalacji
```bash
# Wyczyść i zainstaluj ponownie
rm -rf node_modules/
npm install
npx playwright install
```

### Problemy z przeglądarkami
```bash
# Zainstaluj ponownie przeglądarki
npx playwright install --force
```

## 📈 Metryki i cele

### Poziomy akceptacji
- **Testy podstawowe**: 100% pass
- **Testy interfejsu**: 95% pass  
- **Testy funkcjonalności**: 90% pass
- **Testy responsywności**: 85% pass
- **Testy wydajności**: 80% pass
- **Edge cases**: 70% pass

### Wydajność
- **Czas logowania**: < 10s
- **Czas ładowania MAS V2**: < 5s
- **Memory leaks**: Brak krytycznych
- **JS errors**: < 3 na sesję

## 🤝 Współpraca

### Dodawanie nowych testów

1. Edytuj `playwright/mas-v2-comprehensive-tests.js`
2. Dodaj nowy test w odpowiedniej sekcji describe()
3. Użyj helper functions (loginToWordPress, navigateToMASSettings)
4. Przetestuj lokalnie przed commitem

### Zgłaszanie błędów

Gdy test wykryje błąd:
1. Sprawdź screenshot/video w `test-results/`
2. Sprawdź trace file dla szczegółów
3. Zweryfikuj czy to rzeczywisty błąd czy problem z testem

## 📚 Dodatkowe zasoby

- [Playwright Documentation](https://playwright.dev/)
- [WordPress Testing Handbook](https://make.wordpress.org/core/handbook/testing/)
- [Modern Admin Styler V2 Documentation](../README.md)

---

**Status testów**: 🔄 W ciągłym rozwoju  
**Ostatnia aktualizacja**: $(date)  
**Wersja Playwright**: 1.40.0+ 