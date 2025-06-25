#!/bin/bash

# Script to create a GitHub Gist with all Modern Admin Styler v2 plugin files

echo "Creating GitHub Gist for Modern Admin Styler v2 plugin..."

# Create the gist using GitHub CLI with specific files (excluding binary files)
echo "Creating Gist..."
gh gist create --public --desc "Modern Admin Styler v2 - WordPress Plugin - Complete Source Code" \
  modern-admin-styler-v2.php \
  README.md \
  OPTIMIZATION-REPORT.md \
  MENU-OPTIMIZATION-REPORT.md \
  assets/css/admin.css \
  assets/css/modern-admin-optimized.css \
  assets/css/admin-modern.css \
  assets/js/admin-modern-backup.js \
  assets/js/admin-global.js \
  assets/js/admin-modern.js \
  templates/admin-page.php \
  templates/admin-page-backup.php \
  templates/admin-page-old.php \
  src/services/SettingsService.php \
  src/services/AssetService.php \
  src/controllers/AdminController.php \
  src/views/admin-page.php \
  src/views/admin-page-backup-original.php \
  cursor-localhost-viewer/package.json \
  cursor-localhost-viewer/src/extension.ts \
  cursor-localhost-viewer/tsconfig.json \
  cursor-localhost-viewer/README.md \
  cursor-localhost-viewer/.vscodeignore \
  cursor-localhost-viewer/install.sh \
  cursor-localhost-viewer/package-lock.json \
  cursor-localhost-viewer/out/extension.js \
  cursor-localhost-viewer/out/extension.js.map \
  cursor-localhost-viewer/test-extension.md \
  cursor-localhost-viewer/test-installation.md

echo "Gist created successfully!"
echo "The Gist URL will be displayed above." 