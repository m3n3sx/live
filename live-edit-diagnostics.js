/**
 * 🔍 WOOW Live Edit Diagnostics
 * Run this in the browser console to identify loading issues
 */

console.log('🔍 WOOW Live Edit Diagnostics Started...');

// ========================================================================
// 1. Check Current Page Information
// ========================================================================
console.log('📍 Current Page Info:');
console.log('  URL:', window.location.href);
console.log('  Body Classes:', Array.from(document.body.classList));
console.log('  Admin Page:', window.location.href.includes('/wp-admin/'));

// ========================================================================
// 2. Check Script Loading
// ========================================================================
console.log('📦 Script Loading Check:');
const scripts = Array.from(document.scripts);
const liveEditScript = scripts.find(script => 
    script.src.includes('live-edit-mode.js') || 
    script.src.includes('woow-live-edit-mode')
);

if (liveEditScript) {
    console.log('  ✅ live-edit-mode.js found:', liveEditScript.src);
    console.log('  Status:', liveEditScript.readyState || 'unknown');
} else {
    console.log('  ❌ live-edit-mode.js NOT found in loaded scripts');
    console.log('  Available scripts:', scripts.map(s => s.src.split('/').pop()).filter(s => s));
}

// ========================================================================
// 3. Check for JavaScript Objects
// ========================================================================
console.log('🔧 JavaScript Objects Check:');
console.log('  LiveEditEngine:', typeof window.LiveEditEngine);
console.log('  liveEditInstance:', typeof window.liveEditInstance);
console.log('  masLiveEditMode:', typeof window.masLiveEditMode);
console.log('  SyncManager:', typeof window.SyncManager);
console.log('  UnifiedLiveEdit:', typeof window.UnifiedLiveEdit);
console.log('  woowDebug:', typeof window.woowDebug);

// ========================================================================
// 4. Check for Toggle Button Elements
// ========================================================================
console.log('🔘 Toggle Button Check:');
const toggleSelectors = [
    '#mas-v2-edit-mode-switch',
    '.mas-live-edit-toggle',
    '.woow-live-edit-toggle',
    '.mas-live-edit-button',
    '[data-mas-live-edit-toggle]'
];

toggleSelectors.forEach(selector => {
    const element = document.querySelector(selector);
    console.log(`  ${selector}:`, element ? '✅ Found' : '❌ Not Found');
});

// ========================================================================
// 5. Check WordPress Data
// ========================================================================
console.log('📊 WordPress Data Check:');
console.log('  woow_data:', typeof window.woow_data);
console.log('  masV2:', typeof window.masV2);
console.log('  masV2Global:', typeof window.masV2Global);
console.log('  jQuery:', typeof window.jQuery);

// ========================================================================
// 6. Check for Errors
// ========================================================================
console.log('⚠️ Error Detection:');
window.addEventListener('error', (e) => {
    console.error('🚨 JavaScript Error:', e.message, 'at', e.filename, 'line', e.lineno);
});

// ========================================================================
// 7. Manual Script Loading Test
// ========================================================================
console.log('🧪 Manual Script Loading Test:');
function testScriptLoading() {
    const pluginUrl = window.location.origin + '/wp-content/plugins/modern-admin-styler-v2/';
    const scriptUrl = pluginUrl + 'assets/js/live-edit-mode.js';
    
    fetch(scriptUrl)
        .then(response => {
            console.log('  Script fetch status:', response.status);
            if (response.ok) {
                console.log('  ✅ Script file is accessible');
            } else {
                console.log('  ❌ Script file not accessible');
            }
        })
        .catch(error => {
            console.log('  ❌ Script fetch error:', error);
        });
}

testScriptLoading();

// ========================================================================
// 8. Emergency Toggle Creation
// ========================================================================
console.log('🚨 Emergency Toggle Creation:');
function createEmergencyToggle() {
    if (document.querySelector('.woow-emergency-toggle')) {
        console.log('  Emergency toggle already exists');
        return;
    }
    
    const toggle = document.createElement('div');
    toggle.className = 'woow-emergency-toggle';
    toggle.innerHTML = `
        <div style="
            position: fixed;
            top: 32px;
            right: 20px;
            z-index: 999999;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 12px 20px;
            border-radius: 25px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            transition: all 0.3s ease;
            border: none;
            outline: none;
        " onclick="
            this.style.background = this.style.background.includes('764ba2') 
                ? 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' 
                : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
            document.body.classList.toggle('woow-live-edit-active');
            console.log('🔄 Emergency toggle activated');
        ">
            🎨 Live Edit
        </div>
    `;
    
    document.body.appendChild(toggle);
    console.log('  ✅ Emergency toggle created');
}

// Create emergency toggle after 2 seconds
setTimeout(createEmergencyToggle, 2000);

console.log('🔍 WOOW Live Edit Diagnostics Completed!');
console.log('📋 Summary: Check the console output above for any issues'); 