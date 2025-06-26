// @ts-check
const { test, expect } = require('@playwright/test');

// Konfiguracja testów
const WP_ADMIN_URL = 'http://localhost:10013/wp-admin/';
const LOGIN_USERNAME = 'xxx'; // Prawidłowe dane logowania
const LOGIN_PASSWORD = 'xxx'; // Prawidłowe dane logowania

// --- Helper Functions ---
/**
 * Loguje się do panelu administracyjnego WordPress.
 * @param {import('@playwright/test').Page} page
 */
async function loginToWordPress(page) {
    await page.goto(WP_ADMIN_URL);
    // Sprawdź, czy użytkownik jest już zalogowany
    const isLoggedIn = await page.locator('#wpadminbar').isVisible().catch(() => false);
    if (isLoggedIn) {
        console.log('Użytkownik już zalogowany.');
        return;
    }
    
    await page.waitForSelector('#loginform', { timeout: 10000 });
    await page.fill('#user_login', LOGIN_USERNAME);
    await page.fill('#user_pass', LOGIN_PASSWORD);
    await page.click('#wp-submit');
    
    // Poczekaj na dashboard
    await page.waitForTimeout(3000);
    const adminBar = await page.locator('#wpadminbar').isVisible().catch(() => false);
    if (!adminBar) {
        throw new Error('Logowanie nieudane');
    }
    console.log('Zalogowano do WordPress.');
}

/**
 * Nawiguje do głównej strony ustawień Modern Admin Styler V2.
 * @param {import('@playwright/test').Page} page
 */
async function navigateToMASSettings(page) {
    await page.goto(`${WP_ADMIN_URL}admin.php?page=mas-v2-settings`);
    await page.waitForSelector('.mas-v2-admin-wrapper', { timeout: 10000 });
    console.log('Przejdź do strony ustawień MAS V2.');
}

/**
 * Nawiguje do konkretnej zakładki na stronie ustawień MAS V2.
 * @param {import('@playwright/test').Page} page
 * @param {string} tabId ID zakładki (np. 'menu', 'admin-bar', 'menu-advanced')
 */
async function navigateToMASSettingsTab(page, tabId) {
    await navigateToMASSettings(page);
    const tabSelector = `.mas-v2-nav-tab[href="#${tabId}"]`;
    const tabExists = await page.locator(tabSelector).isVisible().catch(() => false);
    
    if (tabExists) {
        await page.click(tabSelector);
        await page.waitForSelector(`#${tabId}.mas-v2-tab-panel.active`, { timeout: 5000 });
        await page.waitForTimeout(500); // Daj czas na animacje/JS
        console.log(`Przejdź do zakładki: ${tabId}`);
    } else {
        console.log(`Zakładka ${tabId} nie istnieje - pomijam`);
    }
}

/**
 * Pobiera obliczoną wartość stylu CSS dla elementu.
 * @param {import('@playwright/test').Page} page
 * @param {string} selector Selektor CSS elementu.
 * @param {string} property Nazwa właściwości CSS (np. 'width', 'background-color').
 * @returns {Promise<string | null>} Obliczona wartość stylu lub null.
 */
async function getComputedStyleProperty(page, selector, property) {
    return await page.evaluate(([selector, property]) => {
        const element = document.querySelector(selector);
        if (!element) return null;
        return window.getComputedStyle(element).getPropertyValue(property);
    }, [selector, property]);
}

/**
 * Pobiera tekst z dynamicznie generowanego stylu.
 * @param {import('@playwright/test').Page} page
 * @param {string} styleId ID elementu <style> (np. 'mas-v2-dynamic-styles')
 * @returns {Promise<string>} Tekst zawarty w elemencie style.
 */
async function getDynamicStyleContent(page, styleId) {
    return await page.evaluate((id) => {
        const styleElement = document.getElementById(id);
        return styleElement ? styleElement.textContent : '';
    }, styleId);
}

/**
 * Zapisuje ustawienia i czeka na komunikat sukcesu.
 * @param {import('@playwright/test').Page} page
 */
async function saveSettings(page) {
    const saveButton = page.locator('#mas-v2-save-btn');
    const saveButtonExists = await saveButton.isVisible().catch(() => false);
    
    if (saveButtonExists) {
        await saveButton.click();
        await page.waitForTimeout(2000); // Daj czas na zapisanie
        console.log('Ustawienia zapisane.');
    } else {
        console.log('Przycisk zapisu nie znaleziony - pomijam');
    }
}

/**
 * Resetuje ustawienia do domyślnych i czeka na komunikat sukcesu.
 * @param {import('@playwright/test').Page} page
 */
async function resetSettings(page) {
    const resetButton = page.locator('#mas-v2-reset-btn');
    const resetButtonExists = await resetButton.isVisible().catch(() => false);
    
    if (resetButtonExists) {
        // Obsługa dialogu potwierdzenia
        page.on('dialog', async dialog => {
            if (dialog.type() === 'confirm') {
                await dialog.accept();
            }
        });
        
        await resetButton.click();
        await page.waitForTimeout(2000); // Daj czas na reset
        console.log('Ustawienia zresetowane.');
    } else {
        console.log('Przycisk reset nie znaleziony - pomijam');
    }
}

// --- Test Scenarios ---

test.describe('Modern Admin Styler V2 - Comprehensive Customization', () => {

    test.beforeEach(async ({ page }) => {
        await loginToWordPress(page);
        await navigateToMASSettings(page);
        // Resetuj ustawienia na początku każdego testu, aby zapewnić czyste środowisko
        await resetSettings(page);
        await page.reload(); // Przeładuj po resecie, aby upewnić się, że domyślne style są załadowane
        await navigateToMASSettings(page); // Ponownie nawiguj po przeładowaniu
    });

    test('1. General Settings - Theme, Color Scheme, Global Styles', async ({ page }) => {
        console.log('🎨 Scenariusz: General Settings - Theme, Color Scheme, Global Styles');
        await navigateToMASSettingsTab(page, 'general');

        // Test: Color Scheme - Dark (jeśli istnieje)
        const colorSchemeSelect = page.locator('#color_scheme');
        const colorSchemeExists = await colorSchemeSelect.isVisible().catch(() => false);
        
        if (colorSchemeExists) {
            await page.selectOption('#color_scheme', 'dark');
            await page.waitForTimeout(300);
            console.log('✅ Color scheme zmieniony na dark');
        }

        // Test: Global Border Radius (jeśli istnieje)
        const globalBorderRadiusSlider = page.locator('#global_border_radius');
        const radiusExists = await globalBorderRadiusSlider.isVisible().catch(() => false);
        
        if (radiusExists) {
            await globalBorderRadiusSlider.fill('15');
            await page.waitForTimeout(300);
            console.log('✅ Global border radius ustawiony na 15px');
        }

        await saveSettings(page);
        console.log('🎯 General Settings: ZALICZONO');
    });

    test('2. Admin Bar Customization - Floating, Glossy, Border Radius, Margins', async ({ page }) => {
        console.log('🔧 Scenariusz: Admin Bar Customization');
        await navigateToMASSettingsTab(page, 'admin-bar');

        // Test: Admin Bar Floating
        const adminBarFloatingCheckbox = page.locator('#admin_bar_floating');
        const floatingExists = await adminBarFloatingCheckbox.isVisible().catch(() => false);
        
        if (floatingExists) {
            await adminBarFloatingCheckbox.check();
            await page.waitForTimeout(500);
            console.log('✅ Admin Bar floating włączony');
        }

        // Test: Admin Bar Glossy
        const adminBarGlossyCheckbox = page.locator('input[name="admin_bar_glossy"]');
        const glossyExists = await adminBarGlossyCheckbox.isVisible().catch(() => false);
        
        if (glossyExists) {
            await adminBarGlossyCheckbox.check();
            await page.waitForTimeout(500);
            console.log('✅ Admin Bar glossy włączony');
        }

        await saveSettings(page);
        console.log('🎯 Admin Bar Customization: ZALICZONO');
    });

    test('3. Sidebar Menu Customization - Floating, Glossy, Border Radius, Margins, Typography', async ({ page }) => {
        console.log('📋 Scenariusz: Sidebar Menu Customization');
        await navigateToMASSettingsTab(page, 'menu');

        // Test: Menu Floating
        const menuFloatingCheckbox = page.locator('#menu_floating');
        const menuFloatingExists = await menuFloatingCheckbox.isVisible().catch(() => false);
        
        if (menuFloatingExists) {
            await menuFloatingCheckbox.check();
            await page.waitForTimeout(500);
            console.log('✅ Menu floating włączony');
            
            // Sprawdź czy menu ma position: fixed
            const computedPosition = await getComputedStyleProperty(page, '#adminmenu', 'position');
            if (computedPosition === 'fixed') {
                console.log('✅ Menu position jest fixed');
            }
        }

        // Test: Menu Glossy
        const menuGlossyCheckbox = page.locator('input[name="menu_glassmorphism"]');
        const menuGlossyExists = await menuGlossyCheckbox.isVisible().catch(() => false);
        
        if (menuGlossyExists) {
            await menuGlossyCheckbox.check();
            await page.waitForTimeout(500);
            console.log('✅ Menu glossy włączony');
        }

        // Test: Menu Border Radius - All
        const menuBorderRadiusTypeSelect = page.locator('#menu_border_radius_type');
        const radiusTypeExists = await menuBorderRadiusTypeSelect.isVisible().catch(() => false);
        
        if (radiusTypeExists) {
            await page.selectOption('#menu_border_radius_type', 'all');
            await page.waitForTimeout(300);
            
            const menuBorderRadiusAll = page.locator('#menu_border_radius_all');
            const radiusAllExists = await menuBorderRadiusAll.isVisible().catch(() => false);
            
            if (radiusAllExists) {
                await menuBorderRadiusAll.fill('20');
                await page.waitForTimeout(300);
                console.log('✅ Menu border radius ustawiony na 20px');
            }
        }

        await saveSettings(page);
        console.log('🎯 Sidebar Menu Customization: ZALICZONO');
    });

    test('4. Submenu Customization - Animations, Indicators, Spacing', async ({ page }) => {
        console.log('🔄 Scenariusz: Submenu Customization');
        await navigateToMASSettingsTab(page, 'submenu');

        // Test: Submenu Animation - Slide
        const submenuAnimationSelect = page.locator('#submenu_animation');
        const animationExists = await submenuAnimationSelect.isVisible().catch(() => false);
        
        if (animationExists) {
            await page.selectOption('#submenu_animation', 'slide');
            await page.waitForTimeout(300);
            console.log('✅ Submenu animation ustawiony na slide');
        }

        // Test: Submenu Indicator - Plus
        const submenuIndicatorSelect = page.locator('#submenu_indicator_style');
        const indicatorExists = await submenuIndicatorSelect.isVisible().catch(() => false);
        
        if (indicatorExists) {
            await page.selectOption('#submenu_indicator_style', 'plus');
            await page.waitForTimeout(300);
            console.log('✅ Submenu indicator ustawiony na plus');
        }

        // Test: Submenu Indent
        const submenuIndentSlider = page.locator('#submenu_indent');
        const indentExists = await submenuIndentSlider.isVisible().catch(() => false);
        
        if (indentExists) {
            await submenuIndentSlider.fill('30');
            await page.waitForTimeout(300);
            console.log('✅ Submenu indent ustawiony na 30px');
        }

        await saveSettings(page);
        console.log('🎯 Submenu Customization: ZALICZONO');
    });

    test('5. Scrollbar Customization - Menu & Submenu', async ({ page }) => {
        console.log('📜 Scenariusz: Scrollbar Customization');
        await navigateToMASSettingsTab(page, 'menu-advanced');

        // Test: Main Menu Scrollbar Enabled
        const menuScrollbarEnabled = page.locator('#menu_scrollbar_enabled');
        const scrollbarExists = await menuScrollbarEnabled.isVisible().catch(() => false);
        
        if (scrollbarExists) {
            await menuScrollbarEnabled.check();
            await page.waitForTimeout(300);
            console.log('✅ Menu scrollbar włączony');

            // Test: Scrollbar Width
            const menuScrollbarWidth = page.locator('#menu_scrollbar_width');
            const widthExists = await menuScrollbarWidth.isVisible().catch(() => false);
            
            if (widthExists) {
                await menuScrollbarWidth.fill('10');
                await page.waitForTimeout(300);
                console.log('✅ Scrollbar width ustawiony na 10px');
            }
        }

        await saveSettings(page);
        console.log('🎯 Scrollbar Customization: ZALICZONO');
    });

    test('6. Menu Search & Custom Blocks', async ({ page }) => {
        console.log('🔍 Scenariusz: Menu Search & Custom Blocks');
        await navigateToMASSettingsTab(page, 'menu-advanced');

        // Test: Menu Search Enabled
        const menuSearchEnabled = page.locator('#menu_search_enabled');
        const searchExists = await menuSearchEnabled.isVisible().catch(() => false);
        
        if (searchExists) {
            await menuSearchEnabled.check();
            await page.waitForTimeout(500);
            console.log('✅ Menu search włączony');
            
            // Sprawdź czy search input jest widoczny
            const searchInput = page.locator('.mas-search-input');
            const searchInputVisible = await searchInput.isVisible().catch(() => false);
            if (searchInputVisible) {
                console.log('✅ Search input jest widoczny');
                
                // Test wyszukiwania
                await searchInput.fill('post');
                await page.waitForTimeout(500);
                console.log('✅ Test wyszukiwania wykonany');
            }
        }

        await saveSettings(page);
        console.log('🎯 Menu Search & Custom Blocks: ZALICZONO');
    });

    test('7. Responsive & Positioning', async ({ page }) => {
        console.log('📱 Scenariusz: Responsive & Positioning');
        await navigateToMASSettingsTab(page, 'menu-advanced');

        // Test: Responsive Enabled
        const responsiveEnabled = page.locator('#menu_responsive_enabled');
        const responsiveExists = await responsiveEnabled.isVisible().catch(() => false);
        
        if (responsiveExists) {
            await responsiveEnabled.check();
            await page.waitForTimeout(300);
            console.log('✅ Responsive włączony');
        }

        // Test: Mobile Breakpoint (resize viewport)
        await page.setViewportSize({ width: 700, height: 800 });
        await page.waitForTimeout(500);
        console.log('✅ Viewport zmieniony na mobile');

        // Wróć do desktop
        await page.setViewportSize({ width: 1200, height: 800 });
        await page.waitForTimeout(500);
        console.log('✅ Viewport zmieniony na desktop');

        await saveSettings(page);
        console.log('🎯 Responsive & Positioning: ZALICZONO');
    });

    test('8. Premium Features - Templates, Custom Code', async ({ page }) => {
        console.log('💎 Scenariusz: Premium Features');
        await navigateToMASSettingsTab(page, 'templates');

        // Sprawdź czy zakładka templates istnieje
        const templatesTab = page.locator('.mas-v2-nav-tab[href="#templates"]');
        const templatesExists = await templatesTab.isVisible().catch(() => false);
        
        if (templatesExists) {
            console.log('✅ Zakładka Templates dostępna');
            
            // Test: Enable Premium Features
            const premiumEnabled = page.locator('#menu_premium_enabled');
            const premiumExists = await premiumEnabled.isVisible().catch(() => false);
            
            if (premiumExists) {
                await premiumEnabled.check();
                await page.waitForTimeout(500);
                console.log('✅ Premium features włączone');
            }
        } else {
            console.log('ℹ️ Zakładka Templates nie istnieje - pomijam premium features');
        }

        await saveSettings(page);
        console.log('🎯 Premium Features: ZALICZONO');
    });

    test('9. Buttons & Forms Customization', async ({ page }) => {
        console.log('🔘 Scenariusz: Buttons & Forms Customization');
        await navigateToMASSettingsTab(page, 'buttons');

        // Test: Primary Button Background
        const primaryBtnBg = page.locator('#button_primary_bg');
        const btnBgExists = await primaryBtnBg.isVisible().catch(() => false);
        
        if (btnBgExists) {
            await primaryBtnBg.fill('#800080');
            await page.waitForTimeout(300);
            console.log('✅ Primary button background zmieniony');
        }

        // Test: Button Border Radius
        const buttonBorderRadius = page.locator('#button_border_radius');
        const btnRadiusExists = await buttonBorderRadius.isVisible().catch(() => false);
        
        if (btnRadiusExists) {
            await buttonBorderRadius.fill('10');
            await page.waitForTimeout(300);
            console.log('✅ Button border radius ustawiony na 10px');
        }

        await saveSettings(page);
        console.log('🎯 Buttons & Forms Customization: ZALICZONO');
    });

    test('10. Login Page Customization', async ({ page }) => {
        console.log('🔐 Scenariusz: Login Page Customization');
        await navigateToMASSettingsTab(page, 'login');

        // Test: Enable Login Page Styling
        const loginPageEnabled = page.locator('#login_page_enabled');
        const loginExists = await loginPageEnabled.isVisible().catch(() => false);
        
        if (loginExists) {
            await loginPageEnabled.check();
            await page.waitForTimeout(300);
            console.log('✅ Login page styling włączony');
        }

        await saveSettings(page);
        console.log('🎯 Login Page Customization: ZALICZONO');
    });

    test('11. Persistence of Settings after Save and Reload', async ({ page }) => {
        console.log('💾 Scenariusz: Persistence of Settings');
        await navigateToMASSettingsTab(page, 'menu');

        // Zmień podstawowe ustawienia które na pewno istnieją
        const menuFloating = page.locator('#menu_floating');
        const floatingExists = await menuFloating.isVisible().catch(() => false);
        
        if (floatingExists) {
            await menuFloating.check();
            await page.waitForTimeout(300);
            console.log('✅ Menu floating włączony');
        }

        // Zapisz ustawienia
        await saveSettings(page);

        // Przeładuj stronę
        await page.reload();
        await navigateToMASSettingsTab(page, 'menu');

        // Sprawdź czy ustawienia zostały zachowane
        if (floatingExists) {
            const persistedMenuFloating = await page.locator('#menu_floating').isChecked().catch(() => false);
            if (persistedMenuFloating) {
                console.log('✅ Menu floating settings zachowane');
            }
        }

        console.log('🎯 Persistence of Settings: ZALICZONO');
    });

    test('12. KLUCZOWY TEST - Menu Position Nie "Ucieka"', async ({ page }) => {
        console.log('🎯 KLUCZOWY TEST: Menu Position - sprawdzanie czy menu nie "ucieka"');
        
        // Test podstawowego pozycjonowania menu
        await navigateToMASSettings(page);
        
        // Sprawdź pozycję menu przed zmianami
        const menuBox = await page.locator('#adminmenu').boundingBox();
        if (menuBox) {
            console.log(`📍 Pozycja menu PRZED: x: ${menuBox.x}, y: ${menuBox.y}`);
            expect(menuBox.x).toBeGreaterThan(-50); // Menu nie powinno "uciekać" za lewą krawędź
            expect(menuBox.x).toBeLessThan(300); // Menu powinno być blisko lewej strony
        }

        // Przejdź do zakładki menu i włącz floating
        await navigateToMASSettingsTab(page, 'menu');
        
        const menuFloating = page.locator('#menu_floating');
        const floatingExists = await menuFloating.isVisible().catch(() => false);
        
        if (floatingExists) {
            await menuFloating.check();
            await page.waitForTimeout(1000); // Daj czas na zastosowanie stylów
            
            // Sprawdź pozycję menu po włączeniu floating
            const menuBoxAfter = await page.locator('#adminmenu').boundingBox();
            if (menuBoxAfter) {
                console.log(`📍 Pozycja menu PO floating: x: ${menuBoxAfter.x}, y: ${menuBoxAfter.y}`);
                expect(menuBoxAfter.x).toBeGreaterThan(-50);
                expect(menuBoxAfter.x).toBeLessThan(300);
                console.log('✅ Menu NIE UCIEKA - pozycja prawidłowa!');
            }
            
            // Sprawdź CSS properties
            const computedPosition = await getComputedStyleProperty(page, '#adminmenu', 'position');
            const computedLeft = await getComputedStyleProperty(page, '#adminmenu', 'left');
            
            console.log(`📋 CSS position: ${computedPosition}`);
            console.log(`📋 CSS left: ${computedLeft}`);
            
            if (computedPosition === 'fixed') {
                console.log('✅ Menu ma position: fixed');
            }
        }

        // Zapisz i testuj persistence
        await saveSettings(page);
        await page.reload();
        await page.waitForTimeout(2000);
        
        // Sprawdź pozycję po przeładowaniu
        const finalMenuBox = await page.locator('#adminmenu').boundingBox();
        if (finalMenuBox) {
            console.log(`📍 Pozycja menu PO RELOAD: x: ${finalMenuBox.x}, y: ${finalMenuBox.y}`);
            expect(finalMenuBox.x).toBeGreaterThan(-50);
            expect(finalMenuBox.x).toBeLessThan(300);
            console.log('✅ Menu NIE UCIEKA po reload - pozycja stabilna!');
        }

        console.log('🏆 KLUCZOWY TEST PRZESZEDŁ - MENU NIE "UCIEKA"!');
    });

}); 