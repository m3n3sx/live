const { test, expect } = require('@playwright/test');

test('Simple working test - MAS V2 plugin verification', async ({ page }) => {
    console.log('🚀 Rozpoczynam prosty test MAS V2...');
    
    // Krok 1: Idź do WordPress login
    await page.goto('http://localhost:10013/wp-admin/');
    console.log('📡 Nawigacja do wp-admin');
    
    // Krok 2: Sprawdź formularz logowania
    await expect(page.locator('#loginform')).toBeVisible();
    console.log('🔐 Formularz logowania znaleziony');
    
    // Krok 3: Zaloguj się
    await page.fill('#user_login', 'xxx');
    await page.fill('#user_pass', 'xxx'); 
    await page.click('#wp-submit');
    
    // Krok 4: Poczekaj na dashboard (z timeout)
    await page.waitForTimeout(5000);
    
    // Sprawdź czy jesteśmy zalogowani
    const adminBar = await page.locator('#wpadminbar').isVisible().catch(() => false);
    console.log(`⚙️ Admin bar visible: ${adminBar}`);
    
    if (adminBar) {
        console.log('✅ Logowanie pomyślne!');
        
        // Krok 5: Sprawdź czy admin menu jest dostępne
        const adminMenu = await page.locator('#adminmenu').isVisible().catch(() => false);
        console.log(`📋 Admin menu visible: ${adminMenu}`);
        
        if (adminMenu) {
            // Krok 6: Sprawdź czy MAS V2 jest w menu
            const masLinks = await page.locator('a[href*="mas-v2-settings"]').count();
            console.log(`🔌 MAS V2 links found: ${masLinks}`);
            
            expect(masLinks).toBeGreaterThan(0);
            console.log('✅ Plugin MAS V2 detected in menu!');
            
            // Krok 7: Test pozycjonowania menu (kluczowy test)
            const menuBox = await page.locator('#adminmenu').boundingBox();
            if (menuBox) {
                const menuIsInPosition = menuBox.x > -10 && menuBox.x < 200;
                console.log(`📍 Menu position OK: ${menuIsInPosition} (x: ${menuBox.x})`);
                expect(menuIsInPosition).toBe(true);
            }
            
            console.log('🎯 WSZYSTKIE TESTY PODSTAWOWE PRZESZŁY!');
            
        } else {
            console.log('❌ Admin menu nie jest widoczne');
        }
    } else {
        console.log('❌ Logowanie nie powiodło się');
        throw new Error('Nie udało się zalogować do WordPress');
    }
}); 