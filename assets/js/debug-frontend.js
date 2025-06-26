/**
 * Debug script for frontend MAS V2 issues
 * This will help diagnose save problems in browser
 */

jQuery(document).ready(function($) {
    console.log('=== MAS V2 DEBUG SCRIPT LOADED ===');
    
    // Check if masV2 is available
    if (typeof masV2 !== 'undefined') {
        console.log('✅ masV2 object available:', masV2);
        console.log('   AJAX URL:', masV2.ajaxUrl);
        console.log('   Nonce:', masV2.nonce);
        console.log('   Settings count:', Object.keys(masV2.settings || {}).length);
    } else {
        console.error('❌ masV2 object NOT AVAILABLE');
    }
    
    // Check if MAS object exists
    if (typeof MAS !== 'undefined') {
        console.log('✅ MAS object available');
        console.log('   Live preview enabled:', MAS.livePreviewEnabled);
        console.log('   Has changes:', MAS.hasChanges);
    } else {
        console.error('❌ MAS object NOT AVAILABLE');
    }
    
    // Check form existence
    const $form = $('#mas-v2-settings-form');
    if ($form.length) {
        console.log('✅ Settings form found');
        console.log('   Form fields count:', $form.find('input, select, textarea').length);
        
        // Test form data collection
        const formData = {};
        $form.find("input, select, textarea").each(function() {
            const $field = $(this);
            const name = $field.attr("name");
            
            if (!name) return;
            
            if ($field.is(":checkbox")) {
                formData[name] = $field.is(":checked") ? 1 : 0;
            } else if ($field.is(":radio")) {
                if ($field.is(":checked")) {
                    formData[name] = $field.val();
                }
            } else {
                formData[name] = $field.val();
            }
        });
        
        console.log('✅ Form data collection test:', Object.keys(formData).length, 'fields');
        console.log('   Sample data:', Object.keys(formData).slice(0, 5));
        
    } else {
        console.error('❌ Settings form NOT FOUND');
    }
    
    // Check save button
    const $saveBtn = $('#mas-v2-save-btn');
    if ($saveBtn.length) {
        console.log('✅ Save button found');
    } else {
        console.error('❌ Save button NOT FOUND');
    }
    
    // Add debug save function
    window.debugMasSave = function() {
        console.log('=== MANUAL DEBUG SAVE TEST ===');
        
        if (typeof MAS === 'undefined') {
            console.error('MAS object not available');
            return;
        }
        
        const formData = MAS.getFormData();
        console.log('Form data:', formData);
        
        $.ajax({
            url: masV2.ajaxUrl,
            type: "POST",
            data: {
                action: "mas_v2_save_settings",
                nonce: masV2.nonce,
                ...formData
            },
            beforeSend: function() {
                console.log('🚀 Sending AJAX request...');
            },
            success: function(response) {
                console.log('✅ AJAX Success:', response);
            },
            error: function(xhr, status, error) {
                console.error('❌ AJAX Error:', {xhr, status, error});
                console.error('Response text:', xhr.responseText);
            }
        });
    };
    
    console.log('💡 Run debugMasSave() in console to test save manually');
    console.log('=== MAS V2 DEBUG SCRIPT READY ===');
});

function showSubmenuFixInfo() {
    if (typeof window.masDebug === 'undefined') return;
    
    console.log('🔧 SUBMENU FIX APPLIED - FINAL VERSION');
    console.log('✅ Fixed: Hover submenu now works in normal menu');
    console.log('✅ Fixed: Active submenu z-index increased to prevent overlapping');  
    console.log('✅ Fixed: JavaScript submenu conflicts removed');
    console.log('✅ Fixed: PHP .opensub CSS conflicts disabled');
    console.log('✅ Fixed: admin-modern.css conflicting rules commented out');
    console.log('✅ Fixed: Duplicate CSS rules removed from optimized.css');
    
    console.log('📍 Your current menu state:', {
        floating: document.body.classList.contains('mas-v2-menu-floating'),
        collapsed: document.body.classList.contains('folded'),
        submenuCount: document.querySelectorAll('#adminmenu .wp-submenu').length,
        visibleSubmenu: document.querySelectorAll('#adminmenu .wp-submenu:not([style*="display: none"])').length
    });
    
    console.log('🎯 Submenu hover test:');
    const menuItems = document.querySelectorAll('#adminmenu li.menu-top:not(.wp-has-current-submenu):not(.current)');
    console.log(`Found ${menuItems.length} menu items that should show submenu on hover`);
    
    if (menuItems.length > 0) {
        console.log('Try hovering over these menu items:');
        menuItems.forEach((item, index) => {
            const name = item.querySelector('.wp-menu-name')?.textContent || 'Unknown';
            console.log(`${index + 1}. ${name}`);
        });
    }
}

// Uruchom informację o naprawie
if (window.masDebug) {
    showSubmenuFixInfo();
} 