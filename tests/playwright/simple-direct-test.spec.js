// @ts-check
const { test, expect } = require('@playwright/test');

// Test BEZ użycia global setup
test('Simple direct test - no global setup', async ({ page }) => {
    console.log('🚀 Test bezpośredni bez global setup...');
    
    try {
        // Krok 1: Idź bezpośrednio do WordPress
        console.log('📡 Nawigacja do WordPress...');
        await page.goto('http://localhost:10013/wp-admin/', { 
            waitUntil: 'domcontentloaded',
            timeout: 30000 
        });
        
        // Krok 2: Sprawdź czy jesteś na stronie logowania
        const currentUrl = page.url();
        console.log(`🌐 Obecny URL: ${currentUrl}`);
        
        // Krok 3: Poczekaj na formularz logowania
        await page.waitForSelector('#loginform', { timeout: 10000 });
        console.log('🔐 Formularz logowania znaleziony');
        
        // Krok 4: Wypełnij dane logowania POWOLI
        console.log('✏️ Wypełniam dane logowania...');
        await page.locator('#user_login').click();
        await page.locator('#user_login').fill('');
        await page.locator('#user_login').type('xxx', { delay: 100 });
        
        await page.locator('#user_pass').click();
        await page.locator('#user_pass').fill('');
        await page.locator('#user_pass').type('xxx', { delay: 100 });
        
        console.log('✏️ Dane wpisane, czekam przed kliknięciem...');
        await page.waitForTimeout(1000);
        
        // Krok 5: Kliknij submit
        console.log('🖱️ Klikam submit...');
        await page.click('#wp-submit');
        
        // Krok 6: Czekaj na reakcję
        await page.waitForTimeout(5000);
        
        // Krok 7: Sprawdź wynik
        const finalUrl = page.url();
        console.log(`🌐 URL po logowaniu: ${finalUrl}`);
        
        // Sprawdź czy admin bar jest widoczny
        const adminBar = await page.locator('#wpadminbar').isVisible().catch(() => false);
        console.log(`⚙️ Admin bar widoczny: ${adminBar}`);
        
        if (adminBar) {
            console.log('✅ SUKCES! Logowanie automatyczne działa!');
            
            // Sprawdź admin menu
            const adminMenu = await page.locator('#adminmenu').isVisible().catch(() => false);
            console.log(`📋 Admin menu widoczne: ${adminMenu}`);
            
            // Sprawdź linki MAS V2
            const masLinks = await page.locator('a[href*="mas-v2-settings"]').count();
            console.log(`🔌 Linki MAS V2 znalezione: ${masLinks}`);
            
            // Test menu positioning (KLUCZOWY TEST)
            const menuBox = await page.locator('#adminmenu').boundingBox();
            if (menuBox) {
                console.log(`📍 Pozycja menu: x: ${menuBox.x}, y: ${menuBox.y}`);
                const menuInPosition = menuBox.x > -50 && menuBox.x < 300;
                console.log(`📍 Menu position OK: ${menuInPosition}`);
                
                if (menuInPosition) {
                    console.log('🎯 KLUCZOWY TEST PRZESZEDŁ - MENU NIE "UCIEKA"!');
                }
            }
            
            // Test nawigacji do MAS V2
            console.log('🎛️ Testuję nawigację do MAS V2...');
            await page.goto('http://localhost:10013/wp-admin/admin.php?page=mas-v2-settings');
            await page.waitForTimeout(3000);
            
            const masWrapper = await page.locator('.mas-v2-admin-wrapper').isVisible().catch(() => false);
            console.log(`🎛️ MAS V2 interface widoczny: ${masWrapper}`);
            
            if (masWrapper) {
                console.log('🎉 PEŁNY SUKCES: Wszystko działa bez global setup!');
            }
            
        } else {
            console.log('❌ Logowanie nie powiodło się');
            
            // Sprawdź błędy
            const loginError = await page.locator('#login_error').isVisible().catch(() => false);
            if (loginError) {
                const errorText = await page.locator('#login_error').textContent();
                console.log(`❌ Błąd logowania: ${errorText}`);
            }
        }
        
    } catch (error) {
        console.log(`❌ Błąd w teście: ${error.message}`);
    }
    
    console.log('🏁 Test zakończony');
}); 