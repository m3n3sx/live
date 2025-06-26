// tests/global-teardown.js
async function globalTeardown() {
    console.log('🧹 Rozpoczynam czyszczenie po testach MAS V2...');
    
    // Wyczyść zmienne środowiskowe
    delete process.env.PLAYWRIGHT_TEST_BASE_URL;
    delete process.env.PLAYWRIGHT_TEST_USERNAME;
    delete process.env.PLAYWRIGHT_TEST_PASSWORD;
    
    // Wygeneruj podsumowanie testów
    const fs = require('fs');
    const path = require('path');
    
    try {
        // Sprawdź czy istnieją wyniki testów
        const resultsPath = path.join(process.cwd(), 'test-results', 'results.json');
        
        if (fs.existsSync(resultsPath)) {
            const results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
            
            console.log('\n📊 PODSUMOWANIE TESTÓW MAS V2:');
            console.log('=====================================');
            console.log(`✅ Testy passed: ${results.stats?.passed || 0}`);
            console.log(`❌ Testy failed: ${results.stats?.failed || 0}`);
            console.log(`⏭️ Testy skipped: ${results.stats?.skipped || 0}`);
            console.log(`⏱️ Całkowity czas: ${results.stats?.duration || 0}ms`);
            
            // Wygeneruj krótki raport
            const reportPath = path.join(process.cwd(), 'test-results', 'summary.txt');
            const reportContent = `
MAS V2 Test Summary
==================
Passed: ${results.stats?.passed || 0}
Failed: ${results.stats?.failed || 0}
Skipped: ${results.stats?.skipped || 0}
Duration: ${results.stats?.duration || 0}ms
Generated: ${new Date().toISOString()}
            `.trim();
            
            fs.writeFileSync(reportPath, reportContent);
            console.log(`📝 Raport zapisany w: ${reportPath}`);
        }
        
    } catch (error) {
        console.warn('⚠️ Nie udało się wygenerować podsumowania:', error.message);
    }
    
    console.log('✅ Global teardown zakończony!');
}

module.exports = globalTeardown; 