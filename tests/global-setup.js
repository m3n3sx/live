const { chromium } = require('@playwright/test');

async function globalSetup() {
    console.log('🚀 Rozpoczynam globalny setup testów MAS V2...');
    
    // Test czy WordPress jest dostępny
    const browser = await chromium.launch();
    const page = await browser.newPage();
    
    try {
        // Sprawdź czy WordPress odpowiada
        await page.goto('http://localhost:10013/wp-admin/', { 
            waitUntil: 'domcontentloaded',
            timeout: 10000 
        });
        
        // Sprawdź czy strona logowania jest dostępna
        const loginForm = await page.locator('#loginform').isVisible();
        if (!loginForm) {
            throw new Error('WordPress login form not found');
        }
        
        console.log('✅ WordPress jest dostępny na localhost:10013');
        
        // Opcjonalnie: przygotuj testową bazę danych lub cache
        await page.evaluate(() => {
            // Wyczyść localStorage jeśli potrzebne
            if (typeof(Storage) !== "undefined") {
                localStorage.clear();
                sessionStorage.clear();
            }
        });
        
        console.log('✅ Przygotowanie środowiska testowego zakończone');
        
    } catch (error) {
        console.error('❌ Błąd podczas setup:', error.message);
        throw new Error(`WordPress setup failed: ${error.message}`);
    } finally {
        await browser.close();
    }
    
    // Ustaw zmienne środowiskowe dla testów
    process.env.PLAYWRIGHT_TEST_BASE_URL = 'http://localhost:10013';
    process.env.PLAYWRIGHT_TEST_USERNAME = 'xxx';
    process.env.PLAYWRIGHT_TEST_PASSWORD = 'xxx';
    
    console.log('🎯 Global setup zakończony pomyślnie!');
}

module.exports = globalSetup; 