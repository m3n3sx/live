// @ts-check
const { test, expect } = require('@playwright/test');

test('Weryfikacja logowania WordPress', async ({ page }) => {
    console.log('🔐 Test weryfikacji logowania...');
    
    // Krok 1: Idź do wp-admin
    await page.goto('http://localhost:10013/wp-admin/');
    console.log('📡 Nawigacja do wp-admin');
    
    // Krok 2: Sprawdź formularz logowania
    const loginForm = await page.locator('#loginform').isVisible().catch(() => false);
    console.log(`🔐 Formularz logowania widoczny: ${loginForm}`);
    
    if (loginForm) {
        // Krok 3: Wpisz dane logowania
        await page.fill('#user_login', 'xxx');
        await page.fill('#user_pass', 'xxx');
        console.log('✏️ Dane logowania wpisane');
        
        // Krok 4: Kliknij submit
        await page.click('#wp-submit');
        console.log('🖱️ Kliknięto submit');
        
        // Krok 5: Poczekaj na wynik
        await page.waitForTimeout(8000);
        
        // Sprawdź obecny URL
        const currentUrl = page.url();
        console.log(`🌐 URL po logowaniu: ${currentUrl}`);
        
        // Sprawdź czy admin bar jest widoczny
        const adminBar = await page.locator('#wpadminbar').isVisible().catch(() => false);
        console.log(`⚙️ Admin bar widoczny: ${adminBar}`);
        
        // Sprawdź czy admin menu jest widoczne
        const adminMenu = await page.locator('#adminmenu').isVisible().catch(() => false);
        console.log(`📋 Admin menu widoczne: ${adminMenu}`);
        
        // Sprawdź błędy logowania
        const loginError = await page.locator('#login_error').isVisible().catch(() => false);
        if (loginError) {
            const errorText = await page.locator('#login_error').textContent();
            console.log(`❌ Błąd logowania: ${errorText}`);
        } else {
            console.log('✅ Brak błędów logowania');
        }
        
        // Sprawdź czy są linki MAS V2
        const masLinks = await page.locator('a[href*="mas-v2-settings"]').count();
        console.log(`🔌 Linki MAS V2 znalezione: ${masLinks}`);
        
        // Spróbuj nawigacji do MAS V2
        if (masLinks > 0) {
            try {
                await page.goto('http://localhost:10013/wp-admin/admin.php?page=mas-v2-settings');
                await page.waitForTimeout(3000);
                
                const masWrapper = await page.locator('.mas-v2-admin-wrapper').isVisible().catch(() => false);
                console.log(`🎛️ MAS V2 interface widoczny: ${masWrapper}`);
                
                if (masWrapper) {
                    console.log('🎉 SUKCES: Pełny dostęp do MAS V2!');
                    
                    // Sprawdź dostępne zakładki
                    const tabs = await page.locator('.mas-v2-nav-tab').count();
                    console.log(`📑 Dostępnych zakładek: ${tabs}`);
                    
                    // Lista zakładek
                    const tabTexts = await page.locator('.mas-v2-nav-tab').allTextContents();
                    console.log(`📑 Zakładki: ${tabTexts.join(', ')}`);
                    
                } else {
                    console.log('❌ Nie udało się załadować interfejsu MAS V2');
                }
            } catch (error) {
                console.log(`❌ Błąd nawigacji do MAS V2: ${error.message}`);
            }
        }
        
    } else {
        console.log('ℹ️ Użytkownik już zalogowany lub brak formularza logowania');
    }
    
    console.log('🏁 Test weryfikacji logowania zakończony');
}); 