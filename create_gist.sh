#!/bin/bash

# Script to create a GitHub Gist with all Modern Admin Styler v2 plugin files

echo "Creating GitHub Gist for Modern Admin Styler v2 plugin..."

# Create a temporary directory for the gist files
TEMP_DIR=$(mktemp -d)
echo "Using temporary directory: $TEMP_DIR"

# Copy all files to the temporary directory, preserving structure
find . -type f -not -path "./.git/*" -not -path "./node_modules/*" -not -path "./.vscode/*" -not -path "./create_gist.sh" | while read file; do
    # Create the directory structure
    dir=$(dirname "$file")
    mkdir -p "$TEMP_DIR/$dir"
    
    # Copy the file
    cp "$file" "$TEMP_DIR/$file"
    echo "Added: $file"
done

# Change to the temporary directory
cd "$TEMP_DIR"

# Create the gist using GitHub CLI
echo "Creating Gist..."
gh gist create --public --desc "Modern Admin Styler v2 - WordPress Plugin - Complete Source Code" ./*

# Clean up
cd - > /dev/null
rm -rf "$TEMP_DIR"

echo "Gist created successfully!"
echo "The Gist URL will be displayed above." 