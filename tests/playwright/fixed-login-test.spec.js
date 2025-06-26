// @ts-check
const { test, expect } = require('@playwright/test');

test('Fixed login test - based on manual success', async ({ page }) => {
    console.log('🔧 Test naprawionego logowania...');
    
    // Krok 1: Idź do WordPress login
    await page.goto('http://localhost:10013/wp-admin/', { waitUntil: 'networkidle' });
    console.log('📡 Strona załadowana z network idle');
    
    // Krok 2: Poczekaj na formularz logowania
    await page.waitForSelector('#loginform', { timeout: 10000 });
    console.log('🔐 Formularz logowania znaleziony');
    
    // Krok 3: Wypełnij dane POWOLI
    await page.locator('#user_login').fill('xxx');
    await page.waitForTimeout(500);
    await page.locator('#user_pass').fill('xxx');
    await page.waitForTimeout(500);
    console.log('✏️ Dane logowania wpisane');
    
    // Krok 4: Kliknij submit i poczekaj na nawigację
    await Promise.all([
        page.waitForURL('**/wp-admin/**', { timeout: 15000 }),
        page.click('#wp-submit')
    ]);
    console.log('🖱️ Kliknięto submit i poczekano na nawigację');
    
    // Krok 5: Poczekaj na pełne załadowanie
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Krok 6: Sprawdź wyniki
    const currentUrl = page.url();
    console.log(`🌐 URL po logowaniu: ${currentUrl}`);
    
    // Sprawdź czy admin bar jest widoczny
    await page.waitForSelector('#wpadminbar', { timeout: 10000 });
    const adminBar = await page.locator('#wpadminbar').isVisible();
    console.log(`⚙️ Admin bar widoczny: ${adminBar}`);
    
    // Sprawdź czy admin menu jest widoczne
    const adminMenu = await page.locator('#adminmenu').isVisible();
    console.log(`📋 Admin menu widoczne: ${adminMenu}`);
    
    // Sprawdź czy są linki MAS V2
    const masLinks = await page.locator('a[href*="mas-v2-settings"]').count();
    console.log(`🔌 Linki MAS V2 znalezione: ${masLinks}`);
    
    // Asserty
    expect(adminBar).toBe(true);
    expect(adminMenu).toBe(true);
    expect(masLinks).toBeGreaterThan(0);
    
    console.log('✅ LOGOWANIE NAPRAWIONE - WSZYSTKO DZIAŁA!');
    
    // Test nawigacji do MAS V2
    console.log('🎛️ Testuję nawigację do MAS V2...');
    await page.goto('http://localhost:10013/wp-admin/admin.php?page=mas-v2-settings');
    await page.waitForSelector('.mas-v2-admin-wrapper', { timeout: 10000 });
    
    const masWrapper = await page.locator('.mas-v2-admin-wrapper').isVisible();
    console.log(`🎛️ MAS V2 interface widoczny: ${masWrapper}`);
    
    if (masWrapper) {
        // Sprawdź dostępne zakładki
        const tabs = await page.locator('.mas-v2-nav-tab').count();
        console.log(`📑 Dostępnych zakładek: ${tabs}`);
        
        expect(masWrapper).toBe(true);
        expect(tabs).toBeGreaterThan(0);
        
        console.log('🎉 PEŁNY SUKCES: Logowanie + MAS V2 działają!');
    }
}); 