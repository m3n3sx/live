const { test, expect } = require('@playwright/test');

test('Manual Menu Animation Test - Dokładne sprawdzenie "odlatującego menu"', async ({ page }) => {
    console.log('🎯 TEST ANIMACJI MENU - Szczegółowe sprawdzenie problem "odlatującego menu"');
    
    // Logowanie do WordPress
    await page.goto('http://localhost:10013/wp-admin/');
    await page.waitForSelector('#loginform');
    await page.fill('#user_login', 'admin');
    await page.fill('#user_pass', 'password');
    await page.click('#wp-submit');
    await page.waitForURL('**/wp-admin/**');
    
    console.log('✅ Zalogowano do WordPress');
    
    // TEST 1: Sprawdź czy klasa .mas-loading jest prawidłowo zarządzana
    console.log('🔍 TEST 1: Sprawdzanie zarządzania klasą .mas-loading');
    
    await page.goto('http://localhost:10013/wp-admin/admin.php?page=mas-v2');
    
    // Sprawdź czy klasa mas-loading jest dodana natychmiast
    const hasLoadingClassInitially = await page.evaluate(() => {
        return document.body.classList.contains('mas-loading');
    });
    console.log(`📋 Klasa .mas-loading na początku: ${hasLoadingClassInitially}`);
    
    // Poczekaj chwilę i sprawdź czy klasa nadal istnieje
    await page.waitForTimeout(100);
    const hasLoadingClassAfter100ms = await page.evaluate(() => {
        return document.body.classList.contains('mas-loading');
    });
    console.log(`📋 Klasa .mas-loading po 100ms: ${hasLoadingClassAfter100ms}`);
    
    // Poczekaj dłużej i sprawdź czy klasa została usunięta
    await page.waitForTimeout(600);
    const hasLoadingClassAfter600ms = await page.evaluate(() => {
        return document.body.classList.contains('mas-loading');
    });
    console.log(`📋 Klasa .mas-loading po 600ms: ${hasLoadingClassAfter600ms}`);
    
    // TEST 2: Sprawdź pozycję menu w różnych momentach ładowania
    console.log('🔍 TEST 2: Śledzenie pozycji menu podczas ładowania');
    
    // Odśwież stronę i śledź pozycję menu
    await page.reload();
    
    // Sprawdź pozycję menu natychmiast po załadowaniu
    await page.waitForSelector('#adminmenu', { timeout: 10000 });
    
    // Śledź pozycję menu w różnych momentach
    const positions = [];
    
    for (let i = 0; i < 10; i++) {
        const menuBox = await page.locator('#adminmenu').boundingBox();
        if (menuBox) {
            positions.push({
                time: i * 100,
                x: menuBox.x,
                y: menuBox.y
            });
            console.log(`📍 Pozycja menu po ${i * 100}ms: x=${menuBox.x}, y=${menuBox.y}`);
        }
        await page.waitForTimeout(100);
    }
    
    // Sprawdź czy pozycja menu była stabilna
    const firstPosition = positions[0];
    const lastPosition = positions[positions.length - 1];
    
    const xDifference = Math.abs(lastPosition.x - firstPosition.x);
    const yDifference = Math.abs(lastPosition.y - firstPosition.y);
    
    console.log(`📊 Różnica pozycji X: ${xDifference}px`);
    console.log(`📊 Różnica pozycji Y: ${yDifference}px`);
    
    // TEST 3: Sprawdź style CSS menu w różnych momentach
    console.log('🔍 TEST 3: Sprawdzanie stylów CSS menu');
    
    await page.reload();
    await page.waitForSelector('#adminmenu', { timeout: 10000 });
    
    // Sprawdź style CSS menu
    const menuStyles = await page.evaluate(() => {
        const menu = document.getElementById('adminmenu');
        const computedStyle = window.getComputedStyle(menu);
        return {
            position: computedStyle.position,
            top: computedStyle.top,
            left: computedStyle.left,
            transform: computedStyle.transform,
            transition: computedStyle.transition,
            animation: computedStyle.animation
        };
    });
    
    console.log('🎨 Style CSS menu:', menuStyles);
    
    // TEST 4: Sprawdź czy są jakieś błędy JavaScript
    console.log('🔍 TEST 4: Sprawdzanie błędów JavaScript');
    
    const jsErrors = [];
    page.on('console', msg => {
        if (msg.type() === 'error') {
            jsErrors.push(msg.text());
        }
    });
    
    await page.reload();
    await page.waitForTimeout(2000);
    
    if (jsErrors.length > 0) {
        console.log('❌ Błędy JavaScript:', jsErrors);
    } else {
        console.log('✅ Brak błędów JavaScript');
    }
    
    // TEST 5: Sprawdź czy menu "mignie" podczas ładowania
    console.log('🔍 TEST 5: Test migania menu');
    
    await page.reload();
    
    let menuVisibilityChanges = 0;
    let previousVisibility = null;
    
    // Śledź widoczność menu przez pierwsze 2 sekundy
    for (let i = 0; i < 20; i++) {
        const isVisible = await page.evaluate(() => {
            const menu = document.getElementById('adminmenu');
            if (!menu) return false;
            
            const rect = menu.getBoundingBox();
            const style = window.getComputedStyle(menu);
            
            return style.display !== 'none' && 
                   style.visibility !== 'hidden' && 
                   style.opacity !== '0' &&
                   rect && rect.width > 0 && rect.height > 0;
        });
        
        if (previousVisibility !== null && previousVisibility !== isVisible) {
            menuVisibilityChanges++;
            console.log(`👁️ Zmiana widoczności menu po ${i * 100}ms: ${isVisible}`);
        }
        
        previousVisibility = isVisible;
        await page.waitForTimeout(100);
    }
    
    console.log(`📊 Liczba zmian widoczności menu: ${menuVisibilityChanges}`);
    
    // WYNIKI KOŃCOWE
    console.log('📋 PODSUMOWANIE TESTU:');
    console.log(`   - Pozycja X zmieniła się o: ${xDifference}px`);
    console.log(`   - Pozycja Y zmieniła się o: ${yDifference}px`);
    console.log(`   - Liczba zmian widoczności: ${menuVisibilityChanges}`);
    console.log(`   - Błędy JavaScript: ${jsErrors.length}`);
    
    // Sprawdzenie czy test przeszedł
    const testPassed = xDifference < 50 && yDifference < 100 && menuVisibilityChanges <= 2;
    
    if (testPassed) {
        console.log('✅ TEST PRZESZEDŁ - Menu jest stabilne!');
    } else {
        console.log('❌ TEST NIE PRZESZEDŁ - Menu może "odlatywać" lub migać!');
        
        // Zrób screenshot problemu
        await page.screenshot({ path: 'menu-animation-problem.png', fullPage: true });
        console.log('📸 Screenshot problemu zapisany jako menu-animation-problem.png');
    }
    
    // Assert na końcu
    expect(testPassed).toBe(true);
}); 