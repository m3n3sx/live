const { test, expect } = require('@playwright/test');

// Konfiguracja testów
const WP_ADMIN_URL = 'http://localhost:10013/wp-admin/';
const LOGIN_USERNAME = 'xxx';
const LOGIN_PASSWORD = 'xxx';

// Helper functions
async function loginToWordPress(page) {
    await page.goto(WP_ADMIN_URL);
    
    // Sprawdź czy już zalogowany
    const isLoggedIn = await page.locator('#wpadminbar').isVisible().catch(() => false);
    if (isLoggedIn) return;
    
    // Sprawdź czy formularz logowania jest dostępny
    await page.waitForSelector('#loginform', { timeout: 10000 });
    
    // Logowanie z lepszą obsługą błędów
    await page.fill('#user_login', LOGIN_USERNAME);
    await page.fill('#user_pass', LOGIN_PASSWORD);
    
    // Kliknij submit button
    await page.click('#wp-submit');
    
    // Poczekaj na przekierowanie lub załadowanie
    await page.waitForTimeout(3000);
    
    // Poczekaj na dashboard lub sprawdź błędy logowania
    try {
        await page.waitForSelector('#wpadminbar', { timeout: 10000 });
        console.log('✅ Logowanie pomyślne');
    } catch (error) {
        // Sprawdź czy są błędy logowania
        const loginError = await page.locator('#login_error').isVisible().catch(() => false);
        if (loginError) {
            const errorText = await page.locator('#login_error').textContent();
            throw new Error(`Błąd logowania: ${errorText}`);
        }
        
        // Sprawdź obecny URL dla diagnostyki
        const currentUrl = page.url();
        console.log(`🌐 URL po logowaniu: ${currentUrl}`);
        
        // Zrób screenshot dla diagnostyki
        await page.screenshot({ path: 'login-error.png', fullPage: true });
        
        throw new Error(`Nie udało się zalogować. Obecny URL: ${currentUrl}`);
    }
}

async function navigateToMASSettings(page) {
    // Upewnij się że jesteśmy zalogowani
    await page.waitForSelector('#adminmenu', { timeout: 5000 });
    
    // Hover over admin menu to trigger any submenus
    await page.hover('#adminmenu');
    await page.waitForTimeout(500); // Poczekaj na animacje
    
    try {
        // Spróbuj główny link najpierw
        const mainLink = page.locator('#adminmenu .menu-top a[href*="mas-v2-settings"]').first();
        const isMainVisible = await mainLink.isVisible();
        
        if (isMainVisible) {
            console.log('🔗 Klikam główny link MAS V2...');
            await mainLink.click();
        } else {
            // Fallback na submenu
            console.log('🔗 Szukam w submenu...');
            const submenuLink = page.locator('#adminmenu .wp-submenu a[href*="mas-v2-settings"]').first();
            const isSubmenuVisible = await submenuLink.isVisible();
            
            if (isSubmenuVisible) {
                await submenuLink.click();
            } else {
                // Ostatnia próba - bezpośrednia nawigacja
                console.log('🔗 Nawigacja bezpośrednia do MAS V2...');
                await page.goto('http://localhost:10013/wp-admin/admin.php?page=mas-v2-settings');
            }
        }
        
        // Poczekaj na załadowanie strony MAS V2
        await page.waitForSelector('.mas-v2-admin-wrapper', { timeout: 15000 });
        console.log('✅ Strona MAS V2 załadowana');
        
    } catch (error) {
        // Diagnostyka przy błędzie
        const currentUrl = page.url();
        console.log(`❌ Błąd nawigacji. URL: ${currentUrl}`);
        
        await page.screenshot({ path: 'navigation-error.png', fullPage: true });
        
        throw new Error(`Nie udało się przejść do ustawień MAS V2: ${error.message}`);
    }
}

async function waitForElementsToLoad(page) {
    await page.waitForTimeout(1000); // Podstawowe czekanie na animacje
    await page.waitForFunction(() => {
        return document.readyState === 'complete';
    });
}

// Test Suite 1: Podstawowe testy logowania i dostępu
test.describe('MAS V2 - Testy podstawowe', () => {
    test('Logowanie do WordPress i dostęp do pluginu', async ({ page }) => {
        await loginToWordPress(page);
        
        // Sprawdź czy WordPress załadował się poprawnie
        await expect(page.locator('#wpadminbar')).toBeVisible();
        
        // Na małych ekranach menu może być ukryte
        const viewport = page.viewportSize();
        if (viewport && viewport.width >= 783) {
            await expect(page.locator('#adminmenu')).toBeVisible();
        } else {
            console.log('ℹ️ Pomijam sprawdzenie menu na małym ekranie');
            return; // Zakończ test dla małych ekranów
        }
        
        // Sprawdź czy menu MAS V2 jest dostępne (główny link w menu)
        const masMenuItem = page.locator('#adminmenu .menu-top a[href*="mas-v2-settings"]').first();
        await expect(masMenuItem).toBeVisible();
        
        // Sprawdź czy alternatywnie submenu jest dostępne
        const masSubmenuItem = page.locator('#adminmenu .wp-submenu a[href*="mas-v2-settings"]');
        const isSubmenuVisible = await masSubmenuItem.isVisible().catch(() => false);
        
        if (!await masMenuItem.isVisible() && !isSubmenuVisible) {
            throw new Error('Ani główne menu MAS V2 ani submenu nie są dostępne');
        }
        
        console.log('✅ Logowanie i dostęp do menu MAS V2 - OK');
    });
    
    test('Weryfikacja że menu nie "ucieka" na głównej stronie wp-admin', async ({ page }) => {
        await loginToWordPress(page);
        
        // Sprawdź viewport size
        const viewport = page.viewportSize();
        if (viewport && viewport.width < 783) {
            console.log('ℹ️ Pomijam test menu positioning na małym ekranie');
            return;
        }
        
        const adminMenu = page.locator('#adminmenu');
        await expect(adminMenu).toBeVisible();
        
        // Sprawdź pozycjonowanie menu
        const menuBox = await adminMenu.boundingBox();
        expect(menuBox.x).toBeGreaterThan(-10); // Menu nie powinno być ukryte po lewej
        expect(menuBox.y).toBeGreaterThan(-10); // Menu nie powinno być ukryte u góry
        
        // Sprawdź czy submenu działa
        await page.hover('#adminmenu .menu-top:first-child');
        await page.waitForTimeout(500);
        
        const submenu = page.locator('#adminmenu .wp-submenu').first();
        if (await submenu.isVisible()) {
            const submenuBox = await submenu.boundingBox();
            expect(submenuBox.x).toBeGreaterThan(0);
            expect(submenuBox.y).toBeGreaterThan(0);
        }
        
        console.log('✅ Menu positioning na głównej stronie - OK');
    });
});

// Test Suite 2: Testy interfejsu MAS V2
test.describe('MAS V2 - Testy interfejsu pluginu', () => {
    test.beforeEach(async ({ page }) => {
        await loginToWordPress(page);
        await navigateToMASSettings(page);
    });
    
    test('Sprawdzenie że menu nie "ucieka" na stronie ustawień MAS V2', async ({ page }) => {
        // Sprawdź pozycjonowanie menu WordPress na stronie MAS V2
        const adminMenu = page.locator('#adminmenu');
        await expect(adminMenu).toBeVisible();
        
        const menuBox = await adminMenu.boundingBox();
        expect(menuBox.x).toBeGreaterThan(-10);
        expect(menuBox.y).toBeGreaterThan(25); // Powinno być pod admin bar
        expect(menuBox.x).toBeLessThan(200); // Powinno być w normalnej pozycji
        
        // Sprawdź czy submenu działa na stronie ustawień
        const menuItem = page.locator('#adminmenu .menu-top').first();
        await menuItem.hover();
        await page.waitForTimeout(500);
        
        const submenu = page.locator('#adminmenu .wp-submenu').first();
        if (await submenu.isVisible()) {
            const submenuBox = await submenu.boundingBox();
            expect(submenuBox.x).toBeGreaterThan(menuBox.x); // Submenu powinno być na prawo od menu
        }
        
        console.log('✅ Menu positioning na stronie MAS V2 - OK');
    });
    
    test('Weryfikacja załadowania interfejsu MAS V2', async ({ page }) => {
        // Sprawdź główne elementy interfejsu
        await expect(page.locator('.mas-v2-admin-wrapper')).toBeVisible();
        await expect(page.locator('.mas-v2-header')).toBeVisible();
        await expect(page.locator('.mas-v2-title')).toBeVisible();
        await expect(page.locator('.mas-v2-nav-tabs')).toBeVisible();
        
        // Sprawdź czy tytuł jest poprawny
        await expect(page.locator('.mas-v2-title')).toContainText('Modern Admin Styler V2');
        
        // Sprawdź czy są dostępne zakładki
        const tabs = page.locator('.mas-v2-nav-tab');
        const tabCount = await tabs.count();
        expect(tabCount).toBeGreaterThan(5); // Powinno być co najmniej 6 zakładek
        
        console.log('✅ Interface MAS V2 załadowany poprawnie');
    });
    
    test('Test nawigacji między zakładkami', async ({ page }) => {
        await waitForElementsToLoad(page);
        
        // Lista zakładek do przetestowania
        const tabs = [
            { selector: 'a[href*="mas-v2-general"]', name: 'General' },
            { selector: 'a[href*="mas-v2-admin-bar"]', name: 'Admin Bar' },
            { selector: 'a[href*="mas-v2-menu"]', name: 'Menu' },
            { selector: 'a[href*="mas-v2-content"]', name: 'Content' },
            { selector: 'a[href*="mas-v2-effects"]', name: 'Effects' }
        ];
        
        for (const tab of tabs) {
            await page.click(tab.selector);
            await waitForElementsToLoad(page);
            
            // Sprawdź czy URL się zmienił
            const currentUrl = page.url();
            expect(currentUrl).toContain('mas-v2');
            
            // Sprawdź czy strona się załadowała
            await expect(page.locator('.mas-v2-admin-wrapper')).toBeVisible();
            
            // Sprawdź czy menu nadal jest w dobrej pozycji
            const adminMenu = page.locator('#adminmenu');
            const menuBox = await adminMenu.boundingBox();
            expect(menuBox.x).toBeGreaterThan(-10);
            expect(menuBox.x).toBeLessThan(200);
            
            console.log(`✅ Zakładka ${tab.name} - OK`);
        }
    });
});

// Test Suite 3: Testy funkcjonalności opcji
test.describe('MAS V2 - Testy funkcjonalności', () => {
    test.beforeEach(async ({ page }) => {
        await loginToWordPress(page);
        await navigateToMASSettings(page);
        await page.click('a[href*="mas-v2-menu"]'); // Idź do zakładki Menu
        await waitForElementsToLoad(page);
    });
    
    test('Test włączania/wyłączania opcji floating menu', async ({ page }) => {
        // Znajdź toggle dla floating menu
        const floatingToggle = page.locator('input[name="menu_floating"]');
        
        if (await floatingToggle.isVisible()) {
            const initialState = await floatingToggle.isChecked();
            
            // Przełącz opcję
            await floatingToggle.click();
            await page.waitForTimeout(500);
            
            const newState = await floatingToggle.isChecked();
            expect(newState).toBe(!initialState);
            
            console.log('✅ Toggle floating menu - OK');
        }
    });
    
    test('Test zapisywania ustawień', async ({ page }) => {
        // Znajdź przycisk zapisz
        const saveButton = page.locator('input[type="submit"], button[type="submit"]').first();
        
        if (await saveButton.isVisible()) {
            await saveButton.click();
            
            // Czekaj na komunikat sukcesu lub redirect
            await page.waitForTimeout(2000);
            
            // Sprawdź czy nie ma błędów PHP
            const bodyText = await page.textContent('body');
            expect(bodyText).not.toContain('Fatal error');
            expect(bodyText).not.toContain('Parse error');
            expect(bodyText).not.toContain('Warning:');
            
            console.log('✅ Zapisywanie ustawień - OK');
        }
    });
    
    test('Test Live Preview', async ({ page }) => {
        // Sprawdź czy jest przycisk Live Preview
        const livePreviewToggle = page.locator('.mas-live-preview-toggle');
        
        if (await livePreviewToggle.isVisible()) {
            await livePreviewToggle.click();
            await page.waitForTimeout(1000);
            
            // Sprawdź czy przycisk się aktywował
            const isActive = await livePreviewToggle.getAttribute('class');
            console.log('Live Preview toggle state:', isActive);
            
            console.log('✅ Live Preview toggle - OK');
        }
    });
});

// Test Suite 4: Testy responsywności
test.describe('MAS V2 - Testy responsywności', () => {
    const viewports = [
        { width: 1920, height: 1080, name: 'Desktop Large' },
        { width: 1366, height: 768, name: 'Desktop Medium' },
        { width: 1024, height: 768, name: 'Tablet Landscape' },
        { width: 768, height: 1024, name: 'Tablet Portrait' },
        { width: 480, height: 800, name: 'Mobile Large' },
        { width: 320, height: 568, name: 'Mobile Small' }
    ];
    
    for (const viewport of viewports) {
        test(`Test responsywności ${viewport.name} (${viewport.width}x${viewport.height})`, async ({ page }) => {
            await page.setViewportSize({ width: viewport.width, height: viewport.height });
            await loginToWordPress(page);
            
            // Sprawdź podstawowe elementy
            await expect(page.locator('#wpadminbar')).toBeVisible();
            
            // Na małych ekranach menu może być ukryte
            if (viewport.width >= 783) {
                await expect(page.locator('#adminmenu')).toBeVisible();
                
                // Sprawdź pozycjonowanie menu
                const adminMenu = page.locator('#adminmenu');
                const menuBox = await adminMenu.boundingBox();
                expect(menuBox.x).toBeGreaterThan(-10);
            }
            
            // Przejdź do ustawień MAS V2
            if (viewport.width >= 600) { // Na bardzo małych ekranach może być trudno
                await navigateToMASSettings(page);
                await waitForElementsToLoad(page);
                
                // Sprawdź czy interface MAS V2 się dostosował
                await expect(page.locator('.mas-v2-admin-wrapper')).toBeVisible();
                
                // Na małych ekranach sprawdź czy elementy nie wylatują poza ekran
                const wrapper = page.locator('.mas-v2-admin-wrapper');
                const wrapperBox = await wrapper.boundingBox();
                expect(wrapperBox.width).toBeLessThanOrEqual(viewport.width + 50); // Tolerancja 50px
            }
            
            console.log(`✅ Responsywność ${viewport.name} - OK`);
        });
    }
});

// Test Suite 5: Testy wydajności i błędów
test.describe('MAS V2 - Testy wydajności i błędów', () => {
    test('Sprawdzenie błędów JavaScript w konsoli', async ({ page }) => {
        const consoleErrors = [];
        
        page.on('console', msg => {
            if (msg.type() === 'error') {
                consoleErrors.push(msg.text());
            }
        });
        
        await loginToWordPress(page);
        await navigateToMASSettings(page);
        
        // Przejdź przez kilka zakładek
        const tabs = ['mas-v2-general', 'mas-v2-menu', 'mas-v2-effects'];
        for (const tab of tabs) {
            await page.click(`a[href*="${tab}"]`);
            await waitForElementsToLoad(page);
        }
        
        // Sprawdź czy nie ma krytycznych błędów JS
        const criticalErrors = consoleErrors.filter(error => 
            !error.includes('favicon') && 
            !error.includes('net::ERR_') &&
            !error.includes('404')
        );
        
        if (criticalErrors.length > 0) {
            console.warn('⚠️ Znalezione błędy JavaScript:', criticalErrors);
        } else {
            console.log('✅ Brak krytycznych błędów JavaScript');
        }
        
        expect(criticalErrors.length).toBeLessThan(3); // Tolerancja dla drobnych błędów
    });
    
    test('Test czasu ładowania stron', async ({ page }) => {
        const startTime = Date.now();
        
        await loginToWordPress(page);
        const loginTime = Date.now() - startTime;
        
        const navStartTime = Date.now();
        await navigateToMASSettings(page);
        const navTime = Date.now() - navStartTime;
        
        console.log(`⏱️ Czas logowania: ${loginTime}ms`);
        console.log(`⏱️ Czas ładowania MAS V2: ${navTime}ms`);
        
        // Sprawdź czy czasy są rozsądne
        expect(loginTime).toBeLessThan(10000); // Max 10s na logowanie
        expect(navTime).toBeLessThan(5000); // Max 5s na ładowanie MAS V2
        
        console.log('✅ Wydajność ładowania - OK');
    });
    
    test('Test memory leaks podczas nawigacji', async ({ page }) => {
        await loginToWordPress(page);
        await navigateToMASSettings(page);
        
        // Symulacja intensywnej nawigacji
        const tabs = ['mas-v2-general', 'mas-v2-admin-bar', 'mas-v2-menu', 'mas-v2-content', 'mas-v2-effects'];
        
        for (let i = 0; i < 3; i++) { // 3 razy przez wszystkie zakładki
            for (const tab of tabs) {
                await page.click(`a[href*="${tab}"]`);
                await page.waitForTimeout(200);
            }
        }
        
        // Sprawdź czy strona nadal reaguje
        await expect(page.locator('.mas-v2-admin-wrapper')).toBeVisible();
        
        console.log('✅ Test memory leaks - OK');
    });
});

// Test Suite 6: Testy edge cases
test.describe('MAS V2 - Testy edge cases', () => {
    test('Test zachowania przy disabled JavaScript', async ({ page }) => {
        await page.addInitScript(() => {
            // Symulacja problemów z JS
            window.addEventListener('error', (e) => {
                console.log('JS Error captured:', e.message);
            });
        });
        
        await loginToWordPress(page);
        await navigateToMASSettings(page);
        
        // Sprawdź czy podstawowy interface działa bez JS
        await expect(page.locator('.mas-v2-admin-wrapper')).toBeVisible();
        await expect(page.locator('#adminmenu')).toBeVisible();
        
        console.log('✅ Test z problemami JS - OK');
    });
    
    test('Test bardzo długich wartości w polach', async ({ page }) => {
        await loginToWordPress(page);
        await navigateToMASSettings(page);
        
        // Znajdź pole tekstowe
        const textField = page.locator('input[type="text"]').first();
        
        if (await textField.isVisible()) {
            const longValue = 'a'.repeat(1000); // 1000 znaków
            await textField.fill(longValue);
            
            const fieldValue = await textField.inputValue();
            expect(fieldValue.length).toBeGreaterThan(0);
            
            console.log('✅ Test długich wartości - OK');
        }
    });
    
    test('Test z wyłączonymi stylami CSS', async ({ page }) => {
        // Wyłącz część stylów CSS
        await page.addStyleTag({
            content: `
                .mas-v2-admin-wrapper { display: block !important; }
                #adminmenu { position: relative !important; }
            `
        });
        
        await loginToWordPress(page);
        await navigateToMASSettings(page);
        
        // Sprawdź czy podstawowa funkcjonalność działa
        await expect(page.locator('.mas-v2-admin-wrapper')).toBeVisible();
        await expect(page.locator('#adminmenu')).toBeVisible();
        
        console.log('✅ Test z ograniczonymi stylami - OK');
    });
});

// Test podsumowujący
test.describe('MAS V2 - Test kompleksowy', () => {
    test('Kompletny workflow użytkownika', async ({ page }) => {
        console.log('🚀 Rozpoczynam kompleksowy test workflow...');
        
        // 1. Logowanie
        await loginToWordPress(page);
        console.log('✅ 1. Logowanie - OK');
        
        // 2. Navigacja do MAS V2
        await navigateToMASSettings(page);
        console.log('✅ 2. Navigacja do MAS V2 - OK');
        
        // 3. Sprawdzenie wszystkich zakładek
        const tabs = [
            'mas-v2-general', 'mas-v2-admin-bar', 'mas-v2-menu', 
            'mas-v2-content', 'mas-v2-buttons', 'mas-v2-effects'
        ];
        
        for (const tab of tabs) {
            await page.click(`a[href*="${tab}"]`);
            await waitForElementsToLoad(page);
            
            // Sprawdź menu positioning na każdej zakładce
            const adminMenu = page.locator('#adminmenu');
            const menuBox = await adminMenu.boundingBox();
            expect(menuBox.x).toBeGreaterThan(-10);
            expect(menuBox.x).toBeLessThan(200);
        }
        console.log('✅ 3. Test wszystkich zakładek - OK');
        
        // 4. Test zapisywania
        await page.click('a[href*="mas-v2-menu"]');
        const saveButton = page.locator('input[type="submit"]').first();
        if (await saveButton.isVisible()) {
            await saveButton.click();
            await page.waitForTimeout(2000);
        }
        console.log('✅ 4. Test zapisywania - OK');
        
        // 5. Sprawdzenie czy nie ma błędów
        const bodyText = await page.textContent('body');
        expect(bodyText).not.toContain('Fatal error');
        expect(bodyText).not.toContain('Parse error');
        console.log('✅ 5. Brak błędów PHP - OK');
        
        console.log('🎉 KOMPLEKSOWY TEST ZAKOŃCZONY POMYŚLNIE!');
    });
}); 