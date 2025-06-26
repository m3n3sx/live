const { test, expect } = require('@playwright/test');

test('Quick diagnostic test', async ({ page }) => {
    console.log('🔍 Rozpoczynam test diagnostyczny...');
    
    // Test 1: Sprawdź czy WordPress odpowiada
    console.log('📡 Sprawdzam dostępność WordPress...');
    await page.goto('http://localhost:10013/wp-admin/');
    
    // Sprawdź czy strona się załadowała
    const title = await page.title();
    console.log(`📄 Tytuł strony: ${title}`);
    
    // Test 2: Sprawdź czy formularz logowania jest dostępny
    const loginForm = await page.locator('#loginform').isVisible().catch(() => false);
    console.log(`🔐 Formularz logowania widoczny: ${loginForm}`);
    
    if (loginForm) {
        // Test 3: Próba logowania
        console.log('🔑 Próbuję się zalogować...');
        await page.fill('#user_login', 'xxx');
        await page.fill('#user_pass', 'xxx');
        
        // Kliknij i sprawdź nawigację
        await Promise.all([
            page.waitForNavigation({ timeout: 10000 }).catch(() => null),
            page.click('#wp-submit')
        ]);
        
        // Poczekaj dodatkowy czas na załadowanie
        await page.waitForTimeout(3000);
        
        // Sprawdź obecny URL
        const currentUrl = page.url();
        console.log(`🌐 Obecny URL: ${currentUrl}`);
        
        // Sprawdź czy admin bar jest dostępny
        const adminBar = await page.locator('#wpadminbar').isVisible().catch(() => false);
        console.log(`⚙️ Admin bar widoczny: ${adminBar}`);
        
        // Sprawdź czy menu jest dostępne
        const adminMenu = await page.locator('#adminmenu').isVisible().catch(() => false);
        console.log(`📋 Admin menu widoczne: ${adminMenu}`);
        
        // Sprawdź czy są błędy na stronie
        const pageContent = await page.textContent('body');
        const hasErrors = pageContent.includes('Error') || pageContent.includes('Fatal');
        console.log(`❌ Błędy na stronie: ${hasErrors}`);
        
        if (adminBar && adminMenu) {
            // Test 4: Sprawdź czy MAS V2 jest w menu
            const masLink = await page.locator('a[href*="mas-v2-settings"]').count();
            console.log(`🔌 Linki MAS V2 znalezione: ${masLink}`);
            
            console.log('✅ DIAGNOSTYKA ZAKOŃCZONA POMYŚLNIE!');
        } else {
            console.log('❌ Problem z interfejsem WordPress');
        }
    } else {
        console.log('❌ Nie można znaleźć formularza logowania');
    }
    
    // Zrób screenshot dla diagnostyki
    await page.screenshot({ path: 'diagnostic-screenshot.png', fullPage: true });
    console.log('📸 Screenshot zapisany jako diagnostic-screenshot.png');
}); 