# Modern Admin Styler V2 🎨

A comprehensive WordPress plugin for customizing the WordPress admin interface with modern design elements, responsive functionality, and extensive customization options.

## Features ✨

### 🚀 Enterprise-Grade Dynamic Configuration
- **Server-driven UI**: Interface components are dynamically built from PHP configuration
- **Single source of truth**: All customizable elements defined in one central location
- **REST API integration**: Configuration fetched securely from `/wp-json/woow/v1/components`
- **Fallback system**: Graceful degradation when server configuration is unavailable
- **Type-safe options**: Comprehensive validation for colors, sliders, toggles, and visibility controls

### 🎯 Core Functionality
- **Modern Admin Interface**: Clean, modern design for WordPress admin
- **Live Preview**: Real-time preview of changes without page refresh
- **Responsive Design**: Mobile and tablet-friendly admin interface
- **Dark/Light Theme**: Toggle between themes
- **Performance Optimized**: Consolidated CSS files for faster loading

### 🎨 Customization Options
- **Admin Bar Styling**: Colors, fonts, spacing, and layout
- **Menu Customization**: Floating menu, animations, responsive behavior
- **Color Palettes**: Pre-defined and custom color schemes
- **Typography**: Font families, sizes, and weights
- **Button Styling**: Custom button designs and effects
- **Login Page**: Custom login page styling

### 📱 Responsive Features
- **Mobile Toggle Button**: Hamburger menu for mobile devices
- **Tablet Optimization**: Compact mode for tablets
- **Touch-Friendly**: Larger touch targets for mobile
- **Adaptive Layouts**: Responsive grid systems

### 🧪 Testing & Development
- **Playwright Testing**: Comprehensive automated testing suite
- **Debug Tools**: Frontend and backend debugging utilities
- **Performance Monitoring**: Built-in performance indicators

## Installation 🚀

1. Download the plugin files
2. Upload to `/wp-content/plugins/modern-admin-styler-v2/`
3. Activate through the WordPress admin panel
4. Navigate to **MAS V2** in your admin menu to configure

## Usage 💡

### Basic Setup
1. Go to **MAS V2 → General Settings**
2. Enable the plugin
3. Choose your preferred theme (Light/Dark)
4. Configure color palette and typography

### Advanced Configuration
- **Admin Bar**: Customize colors, spacing, and behavior
- **Menu**: Set up floating menus, animations, and responsive behavior  
- **Content**: Adjust content area styling and layouts
- **Effects**: Add animations and transitions

### Live Preview
Use the **Live Preview** toggle to see changes in real-time without saving.

## File Structure 📁

```
modern-admin-styler-v2/
├── assets/
│   ├── css/
│   │   ├── mas-v2-main.css      # Main consolidated CSS
│   │   ├── admin.css            # Legacy admin styles
│   │   └── menu-*.css           # Modular menu styles
│   └── js/
│       ├── admin-global.js      # Global admin scripts
│       ├── admin-modern.js      # Main functionality
│       └── debug-frontend.js    # Debug utilities
├── src/
│   ├── controllers/             # PHP controllers
│   ├── services/               # Service classes
│   └── views/                  # Template files
├── tests/                      # Playwright test suite
└── templates/                  # Legacy templates
```

## Recent Updates 🔄

### v2.0 - CSS Optimization & Bug Fixes
- ✅ **Merged responsive styles** into main CSS file
- ✅ **Fixed checkbox settings** save functionality  
- ✅ **Improved performance** with fewer HTTP requests
- ✅ **Added comprehensive debugging** tools
- ✅ **Enhanced mobile responsiveness**
- ✅ **Fixed menu animation issues**

## Testing 🧪

### Automated Testing Suite
The plugin includes a comprehensive testing suite using Playwright:

```bash
# Run tests
cd tests/
npm install
npm test

# Run specific test
npm run test:login
npm run test:menu
```

### Manual Testing Suite
The plugin includes a built-in JavaScript testing suite for manual testing of all controls:

#### 🚀 Quick Start
Open browser console on any WordPress admin page and run:
```javascript
// Test all controls at once
WOOWTestSuite.runAllTests();

// Test with reset (recommended)
WOOWTestSuite.runTestsWithReset();
```

#### 🔍 Individual Tests
```javascript
// Test specific control types
WOOWTestSuite.testDynamicConfig();     // 🚀 Dynamic configuration system
WOOWTestSuite.testColorControls();     // Color pickers
WOOWTestSuite.testSliderControls();    // Range sliders
WOOWTestSuite.testToggleControls();    // Checkboxes/toggles
WOOWTestSuite.testVisibilityControls(); // Hide/show elements
WOOWTestSuite.testPersistence();       // Settings storage
WOOWTestSuite.testRestoration();       // Page refresh restoration
```

#### 🔄 Reset & Utilities
```javascript
// Reset all settings to defaults
SettingsManager.resetAllSettings();

// Check current settings
console.log(SettingsManager.settings);

// Manual setting update
SettingsManager.update('surface_bar', '#ff0000', { cssVar: '--woow-surface-bar' });
```

#### 📊 Test Results Interpretation
- **✅ PASS** - Test completed successfully
- **❌ FAIL** - Test failed, check implementation
- **⚠️ Element not found** - Element doesn't exist on page (may be normal)

#### 🎯 What Each Test Checks
- **🚀 Dynamic Config**: Server-side configuration loading and parsing
- **Color Controls**: CSS variables are applied correctly
- **Slider Controls**: Values with units are applied to CSS
- **Toggle Controls**: Body classes are added/removed
- **Visibility Controls**: Elements are hidden/shown
- **Persistence**: Settings are saved to localStorage
- **Restoration**: Settings are restored after page refresh

#### 🎬 Interactive Demo
Experience the plugin's capabilities with automated demonstrations:

```javascript
// Watch an automated demo of all features
WOOWTestSuite.runDemo();

// Interactive playground with helper functions
WOOWTestSuite.playground();

// Example playground usage:
WOOWTestSuite.setAdminBarColor("#ff0000");  // Red admin bar
WOOWTestSuite.setHeight(50);                // Bigger height
WOOWTestSuite.toggleGlassmorphism();        // Add glass effect
WOOWTestSuite.toggleWPLogo();               // Hide WP logo
WOOWTestSuite.reset();                      // Reset everything
```

The demo script shows:
1. **Color Changes** - Admin bar becomes red with custom hover colors
2. **Layout Adjustments** - Increased height, font size, and padding
3. **Visual Effects** - Glassmorphism, shadows, and blur effects
4. **Element Hiding** - WordPress logo disappears
5. **Theme Switching** - Changes to blue gradient theme
6. **Reset** - Returns to default settings

## Development 🔧

### Debug Mode
Enable debug mode by adding to `wp-config.php`:
```php
define('MAS_V2_DEBUG', true);
```

### Browser Console
Use the debug script in browser console:
```javascript
// Check plugin status
console.log(masV2Global);

// Monitor AJAX calls
masV2DebugConsole.logAjax = true;
```

## Browser Support 🌐

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## Contributing 🤝

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License 📄

This project is licensed under the GPL v2 or later.

## Support 💬

For issues and feature requests, please use the GitHub issue tracker.

---

**Note**: This plugin is designed for WordPress 5.0+ and requires PHP 7.4 or higher.

---

## Dla deweloperów

### Architektura Live Edit

- **LiveEditEngine** – centralny silnik obsługujący zmiany, batchowanie, tryb offline, synchronizację, reset, kolejkę zapisów.
- **SettingsRestorer** – przywraca stan UI po odświeżeniu, synchronizuje CSS variables, klasy, widoczność elementów.
- **MicroPanelFactory** – generuje panele z kontrolkami na podstawie definicji opcji.
- **LiveEditDebugger** – narzędzie do logowania i śledzenia zmian (w konsoli).

**Schemat przepływu:**

```
Użytkownik zmienia opcję → MicroPanel → LiveEditEngine.saveSetting → batchSave (AJAX) → SettingsRestorer.applyAllSettingsToUI → UI
```

### API JS

#### LiveEditEngine

- `saveSetting(optionId, value)` – zapisuje i synchronizuje opcję (batch, offline, retry)
- `settingsCache` – Map wszystkich aktualnych ustawień
- `retryPendingSaves()` – ręczna synchronizacja offline

#### SettingsRestorer

- `restoreSettings()` – przywraca ustawienia z bazy/localStorage
- `applyAllSettingsToUI(settings)` – wymusza odświeżenie UI na podstawie podanych ustawień

#### MicroPanelFactory

- `createPanel(options)` – generuje panel z kontrolkami na podstawie tablicy opcji
- Każda opcja: `{ id, label, type, cssVar, options, default, ... }`

#### Przykład dodania własnej opcji

```js
const myOptions = [
  {
    id: 'my_custom_color',
    label: 'Mój kolor',
    type: 'color',
    cssVar: '--woow-my-custom-color',
    default: '#23282d'
  }
];
MicroPanelFactory.createPanel(myOptions);
```

#### Debugowanie i testowanie

- Włącz logowanie: `window.LiveEditDebugger.enable()`
- Testy E2E: katalog `e2e/`, uruchom `npx playwright test`
- Sprawdzaj toasty, banner połączenia, synchronizację między zakładkami

#### Wskazówki bezpieczeństwa i wydajności

- AJAX zabezpieczony przez nonce (`window.masNonce`)
- Batchowanie zapisów (optymalizacja serwera)
- Tryb offline: zmiany nie giną, synchronizują się po powrocie online
- Reset pojedynczego ustawienia przez AJAX
- Synchronizacja przez localStorage (event `storage`)

---
