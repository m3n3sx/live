/**
 * 🚨 EMERGENCY LIVE EDIT TOGGLE FIX
 * 
 * Ten skrypt utworzy Live Edit toggle button w każdych warunkach
 * Niezależnie od tego czy główny system działa
 * 
 * Użycie:
 * 1. Wklej ten kod do konsoli WordPress admin
 * 2. Lub załaduj jako skrypt: <script src="emergency-toggle-fix.js"></script>
 * 3. Lub dodaj do functions.php jako inline script
 */

(function() {
    'use strict';
    
    // Sprawdź czy nie jest już załadowany
    if (window.emergencyToggleLoaded) {
        console.log('🚨 Emergency toggle already loaded');
        return;
    }
    
    window.emergencyToggleLoaded = true;
    
    console.log('🚨 EMERGENCY LIVE EDIT TOGGLE - Starting...');
    
    // Funkcja do tworzenia emergency toggle
    function createEmergencyToggle() {
        console.log('🚨 Creating emergency toggle button...');
        
        // Usuń istniejący emergency toggle jeśli istnieje
        const existing = document.querySelector('.emergency-live-edit-toggle');
        if (existing) {
            existing.remove();
        }
        
        // Utwórz emergency toggle
        const toggle = document.createElement('div');
        toggle.className = 'emergency-live-edit-toggle';
        toggle.setAttribute('data-toggle-type', 'emergency');
        toggle.setAttribute('title', 'EMERGENCY Live Edit Toggle');
        
        // Style inline - gwarantowana widoczność
        toggle.style.cssText = `
            position: fixed !important;
            top: 50px !important;
            right: 20px !important;
            z-index: 999999 !important;
            background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%) !important;
            color: white !important;
            border: 2px solid #fff !important;
            border-radius: 12px !important;
            padding: 12px 16px !important;
            cursor: pointer !important;
            font-size: 14px !important;
            font-weight: 700 !important;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important;
            box-shadow: 0 6px 20px rgba(231, 76, 60, 0.4) !important;
            transition: all 0.3s ease !important;
            user-select: none !important;
            text-shadow: 0 1px 2px rgba(0,0,0,0.3) !important;
        `;
        
        // Dodaj content
        toggle.innerHTML = `
            <span style="margin-right: 8px; font-size: 16px;">🚨</span>
            <span>EMERGENCY</span>
            <br>
            <span style="font-size: 12px; opacity: 0.9;">Live Edit</span>
        `;
        
        // Dodaj hover effect
        toggle.addEventListener('mouseenter', function() {
            toggle.style.transform = 'scale(1.05) translateY(-2px)';
            toggle.style.boxShadow = '0 8px 25px rgba(231, 76, 60, 0.6)';
        });
        
        toggle.addEventListener('mouseleave', function() {
            toggle.style.transform = 'scale(1) translateY(0)';
            toggle.style.boxShadow = '0 6px 20px rgba(231, 76, 60, 0.4)';
        });
        
        // Dodaj funkcjonalność
        let isActive = false;
        
        toggle.addEventListener('click', function() {
            isActive = !isActive;
            
            console.log('🚨 Emergency toggle clicked, new state:', isActive);
            
            // Zmień wygląd
            if (isActive) {
                toggle.style.background = 'linear-gradient(135deg, #27ae60 0%, #229954 100%)';
                toggle.innerHTML = `
                    <span style="margin-right: 8px; font-size: 16px;">✅</span>
                    <span>ACTIVE</span>
                    <br>
                    <span style="font-size: 12px; opacity: 0.9;">Live Edit</span>
                `;
                
                // Dodaj body classes
                document.body.classList.add('emergency-live-edit-active');
                document.body.classList.add('mas-live-edit-active');
                document.body.classList.add('woow-live-edit-enabled');
                
                // Pokaż powiadomienie
                showNotification('✅ Emergency Live Edit ACTIVATED', 'success');
                
                // Dodaj editable elementy
                addEditableElements();
                
            } else {
                toggle.style.background = 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)';
                toggle.innerHTML = `
                    <span style="margin-right: 8px; font-size: 16px;">🚨</span>
                    <span>EMERGENCY</span>
                    <br>
                    <span style="font-size: 12px; opacity: 0.9;">Live Edit</span>
                `;
                
                // Usuń body classes
                document.body.classList.remove('emergency-live-edit-active');
                document.body.classList.remove('mas-live-edit-active');
                document.body.classList.remove('woow-live-edit-enabled');
                
                // Pokaż powiadomienie
                showNotification('❌ Emergency Live Edit DEACTIVATED', 'info');
                
                // Usuń editable elementy
                removeEditableElements();
            }
        });
        
        // Dodaj do DOM
        document.body.appendChild(toggle);
        
        console.log('✅ Emergency toggle created and added to DOM');
        
        // Pokaż powiadomienie o utworzeniu
        showNotification('🚨 Emergency Live Edit Toggle Created', 'warning');
        
        return toggle;
    }
    
    // Funkcja do pokazywania powiadomień
    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = 'emergency-notification';
        
        const colors = {
            success: '#27ae60',
            error: '#e74c3c',
            warning: '#f39c12',
            info: '#3498db'
        };
        
        notification.style.cssText = `
            position: fixed !important;
            top: 120px !important;
            right: 20px !important;
            z-index: 999998 !important;
            background: ${colors[type]} !important;
            color: white !important;
            padding: 12px 20px !important;
            border-radius: 8px !important;
            font-size: 14px !important;
            font-weight: 600 !important;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2) !important;
            transform: translateX(100%) !important;
            transition: transform 0.3s ease !important;
            max-width: 300px !important;
            word-wrap: break-word !important;
        `;
        
        notification.textContent = message;
        document.body.appendChild(notification);
        
        // Animacja wejścia
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // Auto-usuń
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
    
    // Funkcja do dodawania editable elementów
    function addEditableElements() {
        const elements = [
            '#wpadminbar',
            '#adminmenuwrap',
            '#wpwrap',
            '#wpfooter',
            '.wrap'
        ];
        
        elements.forEach(selector => {
            const element = document.querySelector(selector);
            if (element) {
                element.setAttribute('data-woow-editable', 'true');
                element.setAttribute('data-emergency-editable', 'true');
                element.style.outline = '2px dashed rgba(231, 76, 60, 0.5)';
                element.style.outlineOffset = '2px';
                
                // Dodaj click handler
                element.addEventListener('click', handleElementClick);
            }
        });
        
        console.log('✅ Editable elements added');
    }
    
    // Funkcja do usuwania editable elementów
    function removeEditableElements() {
        const elements = document.querySelectorAll('[data-emergency-editable="true"]');
        elements.forEach(element => {
            element.removeAttribute('data-woow-editable');
            element.removeAttribute('data-emergency-editable');
            element.style.outline = '';
            element.style.outlineOffset = '';
            element.removeEventListener('click', handleElementClick);
        });
        
        console.log('✅ Editable elements removed');
    }
    
    // Handler dla kliknięcia elementów
    function handleElementClick(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const element = e.currentTarget;
        const elementName = element.id || element.className.split(' ')[0] || 'Unknown';
        
        console.log('🎯 Element clicked:', elementName, element);
        
        // Pokaż informację o kliknięciu
        showNotification(`🎯 Clicked: ${elementName}`, 'info');
        
        // Przykład prostej edycji - zmiana koloru tła
        const currentBg = element.style.backgroundColor;
        const newBg = currentBg === 'rgba(231, 76, 60, 0.1)' ? '' : 'rgba(231, 76, 60, 0.1)';
        element.style.backgroundColor = newBg;
        
        // Pokaż powiadomienie o zmianie
        showNotification(`🎨 Background ${newBg ? 'added' : 'removed'} for ${elementName}`, 'success');
    }
    
    // Funkcja do sprawdzenia istniejących toggle'ów
    function checkExistingToggles() {
        const selectors = [
            '#mas-v2-edit-mode-switch',
            '.mas-live-edit-toggle',
            '.woow-live-edit-toggle',
            '.woow-emergency-toggle'
        ];
        
        const found = [];
        selectors.forEach(selector => {
            const element = document.querySelector(selector);
            if (element) {
                found.push(selector);
            }
        });
        
        console.log('🔍 Existing toggles found:', found);
        return found;
    }
    
    // Główna funkcja inicjalizacji
    function init() {
        console.log('🚨 Emergency Live Edit Toggle - Initializing...');
        
        // Sprawdź istniejące toggles
        const existingToggles = checkExistingToggles();
        
        if (existingToggles.length > 0) {
            console.log('ℹ️ Found existing toggles:', existingToggles);
            console.log('ℹ️ Creating emergency toggle as backup...');
        } else {
            console.log('⚠️ No existing toggles found, creating emergency toggle...');
        }
        
        // Zawsze utwórz emergency toggle
        const toggle = createEmergencyToggle();
        
        // Dodaj debug funkcje
        window.emergencyToggleDebug = {
            toggle: toggle,
            activate: function() {
                toggle.click();
            },
            remove: function() {
                toggle.remove();
            },
            recreate: function() {
                toggle.remove();
                createEmergencyToggle();
            }
        };
        
        console.log('✅ Emergency Live Edit Toggle initialized');
        console.log('🎮 Debug functions available: window.emergencyToggleDebug');
    }
    
    // Inicjalizacja
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    // Globalny dostęp
    window.createEmergencyToggle = createEmergencyToggle;
    
})();

// Informacje o użyciu
console.log('🚨 EMERGENCY LIVE EDIT TOGGLE loaded');
console.log('🎮 Available functions:');
console.log('- window.createEmergencyToggle() - Create emergency toggle');
console.log('- window.emergencyToggleDebug.activate() - Activate toggle');
console.log('- window.emergencyToggleDebug.remove() - Remove toggle');
console.log('- window.emergencyToggleDebug.recreate() - Recreate toggle'); 