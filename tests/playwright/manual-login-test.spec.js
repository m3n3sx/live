// @ts-check
const { test, expect } = require('@playwright/test');

test('Manual login test - inspect login process', async ({ page }) => {
    console.log('🔍 Otwierając przeglądarkę dla manualnej inspekcji...');
    
    // Otwórz WordPress login
    await page.goto('http://localhost:10013/wp-admin/');
    
    console.log('🌐 Strona załadowana');
    console.log('🔐 Sprawdź czy formularz logowania jest widoczny');
    
    // Sprawdź obecność formularza
    const loginForm = await page.locator('#loginform').isVisible().catch(() => false);
    console.log(`📋 Formularz logowania widoczny: ${loginForm}`);
    
    if (loginForm) {
        console.log('✏️ Wypełniam dane logowania automatycznie...');
        await page.fill('#user_login', 'xxx');
        await page.fill('#user_pass', 'xxx'); 
        
        console.log('🔍 TERAZ MOŻESZ:');
        console.log('1. Sprawdzić czy dane są poprawnie wpisane');
        console.log('2. Ręcznie kliknąć "Zaloguj się" aby zobaczyć co się stanie');
        console.log('3. Sprawdzić czy pojawiają się błędy');
        
        // Czekaj 60 sekund na manualną interakcję
        await page.waitForTimeout(60000);
        
        // Sprawdź końcowy stan
        const finalUrl = page.url();
        console.log(`🌐 Końcowy URL: ${finalUrl}`);
        
        const adminBar = await page.locator('#wpadminbar').isVisible().catch(() => false);
        console.log(`⚙️ Admin bar widoczny: ${adminBar}`);
        
        const loginError = await page.locator('#login_error').isVisible().catch(() => false);
        if (loginError) {
            const errorText = await page.locator('#login_error').textContent();
            console.log(`❌ Błąd logowania: ${errorText}`);
        }
        
    } else {
        console.log('ℹ️ Brak formularza logowania - możliwe że już zalogowany');
        await page.waitForTimeout(10000);
    }
    
    console.log('🏁 Test zakończony');
}); 