# Modern Admin Styler V2 🎨

A comprehensive WordPress plugin for customizing the WordPress admin interface with modern design elements, responsive functionality, and extensive customization options.

## Features ✨

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
