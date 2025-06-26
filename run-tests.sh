#!/bin/bash

# Modern Admin Styler V2 - Comprehensive Test Runner
# ================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
WORDPRESS_URL="http://localhost:10013"
TEST_DIR="./tests"
RESULTS_DIR="./test-results"

echo -e "${BLUE}🚀 Modern Admin Styler V2 - Test Runner${NC}"
echo "========================================"

# Function to check if WordPress is running
check_wordpress() {
    echo -e "${YELLOW}🔍 Sprawdzam czy WordPress jest dostępny...${NC}"
    
    if curl -s --head "$WORDPRESS_URL/wp-admin/" | head -n 1 | grep -q "200 OK\|302 Found"; then
        echo -e "${GREEN}✅ WordPress jest dostępny na $WORDPRESS_URL${NC}"
        return 0
    else
        echo -e "${RED}❌ WordPress nie jest dostępny na $WORDPRESS_URL${NC}"
        echo -e "${YELLOW}Uruchom WordPress przed rozpoczęciem testów.${NC}"
        return 1
    fi
}

# Function to setup test environment
setup_tests() {
    echo -e "${YELLOW}🛠️ Przygotowuję środowisko testowe...${NC}"
    
    # Przejdź do katalogu testów
    cd "$TEST_DIR"
    
    # Sprawdź czy package.json istnieje
    if [ ! -f "package.json" ]; then
        echo -e "${RED}❌ Nie znaleziono package.json w katalogu testów${NC}"
        exit 1
    fi
    
    # Zainstaluj zależności jeśli potrzebne
    if [ ! -d "node_modules" ]; then
        echo -e "${CYAN}📦 Instaluję zależności npm...${NC}"
        npm install
    fi
    
    # Zainstaluj przeglądarki Playwright
    echo -e "${CYAN}🌐 Sprawdzam przeglądarki Playwright...${NC}"
    npx playwright install
    
    # Utwórz katalog na wyniki
    mkdir -p "$RESULTS_DIR"
    
    echo -e "${GREEN}✅ Środowisko testowe przygotowane${NC}"
}

# Function to run specific test suites
run_test_suite() {
    local suite_name="$1"
    local grep_pattern="$2"
    
    echo -e "${PURPLE}🧪 Uruchamiam: $suite_name${NC}"
    echo "--------------------------------------------"
    
    if npx playwright test --grep="$grep_pattern" --reporter=line; then
        echo -e "${GREEN}✅ $suite_name - PASSED${NC}"
        return 0
    else
        echo -e "${RED}❌ $suite_name - FAILED${NC}"
        return 1
    fi
}

# Main test execution
run_tests() {
    echo -e "${BLUE}🎯 Rozpoczynam testy automatyczne...${NC}"
    
    local failed_suites=0
    local total_suites=0
    
    # Test Suite 1: Podstawowe testy
    total_suites=$((total_suites + 1))
    if ! run_test_suite "Testy podstawowe" "Testy podstawowe"; then
        failed_suites=$((failed_suites + 1))
    fi
    
    # Test Suite 2: Testy interfejsu
    total_suites=$((total_suites + 1))
    if ! run_test_suite "Testy interfejsu" "Testy interfejsu"; then
        failed_suites=$((failed_suites + 1))
    fi
    
    # Test Suite 3: Testy funkcjonalności
    total_suites=$((total_suites + 1))
    if ! run_test_suite "Testy funkcjonalności" "Testy funkcjonalności"; then
        failed_suites=$((failed_suites + 1))
    fi
    
    # Test Suite 4: Testy responsywności
    total_suites=$((total_suites + 1))
    if ! run_test_suite "Testy responsywności" "Testy responsywności"; then
        failed_suites=$((failed_suites + 1))
    fi
    
    # Test Suite 5: Testy wydajności
    total_suites=$((total_suites + 1))
    if ! run_test_suite "Testy wydajności" "wydajności"; then
        failed_suites=$((failed_suites + 1))
    fi
    
    # Test Suite 6: Testy edge cases
    total_suites=$((total_suites + 1))
    if ! run_test_suite "Testy edge cases" "edge cases"; then
        failed_suites=$((failed_suites + 1))
    fi
    
    # Test Suite 7: Test kompleksowy
    total_suites=$((total_suites + 1))
    if ! run_test_suite "Test kompleksowy" "kompleksowy"; then
        failed_suites=$((failed_suites + 1))
    fi
    
    echo ""
    echo "========================================"
    echo -e "${BLUE}📊 PODSUMOWANIE TESTÓW${NC}"
    echo "========================================"
    
    local passed_suites=$((total_suites - failed_suites))
    echo -e "${GREEN}✅ Passed test suites: $passed_suites/$total_suites${NC}"
    
    if [ $failed_suites -gt 0 ]; then
        echo -e "${RED}❌ Failed test suites: $failed_suites/$total_suites${NC}"
        echo -e "${YELLOW}⚠️  Sprawdź szczegółowe logi powyżej${NC}"
        return 1
    else
        echo -e "${GREEN}🎉 WSZYSTKIE TESTY PRZESZŁY POMYŚLNIE!${NC}"
        return 0
    fi
}

# Function to generate reports
generate_reports() {
    echo -e "${CYAN}📊 Generuję raporty...${NC}"
    
    # HTML Report
    if [ -d "$RESULTS_DIR/playwright-report" ]; then
        echo -e "${GREEN}📝 HTML Report: file://$(pwd)/$RESULTS_DIR/playwright-report/index.html${NC}"
    fi
    
    # JSON Report
    if [ -f "$RESULTS_DIR/results.json" ]; then
        echo -e "${GREEN}📋 JSON Report: $(pwd)/$RESULTS_DIR/results.json${NC}"
    fi
    
    # Summary
    if [ -f "$RESULTS_DIR/summary.txt" ]; then
        echo -e "${GREEN}📄 Summary: $(pwd)/$RESULTS_DIR/summary.txt${NC}"
        echo ""
        echo -e "${YELLOW}📖 Podsumowanie:${NC}"
        cat "$RESULTS_DIR/summary.txt"
    fi
}

# Function to show help
show_help() {
    echo "Modern Admin Styler V2 - Test Runner"
    echo ""
    echo "Użycie: $0 [OPCJE]"
    echo ""
    echo "Opcje:"
    echo "  --help, -h           Pokaż tę pomoc"
    echo "  --check-only         Tylko sprawdź WordPress, nie uruchamiaj testów"
    echo "  --setup-only         Tylko przygotuj środowisko"
    echo "  --smoke              Uruchom tylko testy podstawowe"
    echo "  --ui                 Uruchom testy w trybie UI"
    echo "  --headed             Uruchom testy z widoczną przeglądarką"
    echo "  --debug              Uruchom testy w trybie debug"
    echo "  --mobile             Uruchom tylko testy mobile"
    echo "  --desktop            Uruchom tylko testy desktop"
    echo "  --chromium           Uruchom tylko w Chromium"
    echo "  --firefox            Uruchom tylko w Firefox"
    echo "  --webkit             Uruchom tylko w WebKit"
    echo ""
    echo "Przykłady:"
    echo "  $0                   # Uruchom wszystkie testy"
    echo "  $0 --smoke           # Uruchom tylko podstawowe testy"
    echo "  $0 --headed          # Uruchom z widoczną przeglądarką"
    echo "  $0 --mobile          # Uruchom tylko testy mobile"
}

# Parse command line arguments
case "$1" in
    --help|-h)
        show_help
        exit 0
        ;;
    --check-only)
        check_wordpress
        exit $?
        ;;
    --setup-only)
        check_wordpress && setup_tests
        exit $?
        ;;
    --smoke)
        check_wordpress && setup_tests && run_test_suite "Testy podstawowe" "Testy podstawowe"
        exit $?
        ;;
    --ui)
        check_wordpress && setup_tests && npx playwright test --ui
        exit $?
        ;;
    --headed)
        check_wordpress && setup_tests && npx playwright test --headed
        exit $?
        ;;
    --debug)
        check_wordpress && setup_tests && npx playwright test --debug
        exit $?
        ;;
    --mobile)
        check_wordpress && setup_tests && npx playwright test --project="Mobile Chrome" --project="Mobile Safari"
        exit $?
        ;;
    --desktop)
        check_wordpress && setup_tests && npx playwright test --project=chromium --project=firefox --project=webkit
        exit $?
        ;;
    --chromium)
        check_wordpress && setup_tests && npx playwright test --project=chromium
        exit $?
        ;;
    --firefox)
        check_wordpress && setup_tests && npx playwright test --project=firefox
        exit $?
        ;;
    --webkit)
        check_wordpress && setup_tests && npx playwright test --project=webkit
        exit $?
        ;;
    "")
        # Default: run all tests
        if check_wordpress && setup_tests; then
            if run_tests; then
                generate_reports
                echo -e "${GREEN}🎊 WSZYSTKIE TESTY ZAKOŃCZONE POMYŚLNIE!${NC}"
                exit 0
            else
                generate_reports
                echo -e "${RED}💥 NIEKTÓRE TESTY NIEUDANE - sprawdź raporty${NC}"
                exit 1
            fi
        else
            echo -e "${RED}❌ Nie udało się przygotować środowiska testowego${NC}"
            exit 1
        fi
        ;;
    *)
        echo -e "${RED}❌ Nieznana opcja: $1${NC}"
        echo "Użyj --help aby zobaczyć dostępne opcje"
        exit 1
        ;;
esac 