#!/bin/bash

# WOOW Modern Admin Styler v4.0 - Development Setup Script
# This script sets up the complete development environment including testing infrastructure

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
NODE_VERSION="20"
PHP_VERSION="8.1"
MYSQL_VERSION="8.0"
REDIS_VERSION="7"
WORDPRESS_VERSION="latest"
PROJECT_NAME="woow-admin-styler"

print_header() {
    echo -e "${BLUE}"
    echo "╔══════════════════════════════════════════════════════════════════════════════╗"
    echo "║                     WOOW Modern Admin Styler v4.0                           ║"
    echo "║                        Development Setup Script                             ║"
    echo "║                                                                              ║"
    echo "║  This script will set up your complete development environment including:   ║"
    echo "║  • Node.js and npm dependencies                                              ║"
    echo "║  • PHP and Composer dependencies                                             ║"
    echo "║  • MySQL database setup                                                     ║"
    echo "║  • Redis cache setup                                                        ║"
    echo "║  • WordPress development environment                                         ║"
    echo "║  • Testing infrastructure (Jest, Playwright, etc.)                          ║"
    echo "║  • Development tools and utilities                                           ║"
    echo "╚══════════════════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_command() {
    if command -v $1 &> /dev/null; then
        return 0
    else
        return 1
    fi
}

install_node() {
    print_step "Setting up Node.js environment..."
    
    if check_command "node"; then
        NODE_CURRENT=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
        if [ "$NODE_CURRENT" -ge "$NODE_VERSION" ]; then
            print_success "Node.js $NODE_CURRENT is already installed"
            return 0
        fi
    fi
    
    if check_command "nvm"; then
        print_step "Installing Node.js $NODE_VERSION using nvm..."
        nvm install $NODE_VERSION
        nvm use $NODE_VERSION
        nvm alias default $NODE_VERSION
    else
        print_warning "nvm not found. Please install Node.js $NODE_VERSION manually"
        print_warning "Visit: https://nodejs.org/en/download/"
        read -p "Press Enter when Node.js is installed..."
    fi
    
    print_success "Node.js setup complete"
}

install_npm_dependencies() {
    print_step "Installing npm dependencies..."
    
    if [ ! -f "package.json" ]; then
        print_error "package.json not found. Please run this script from the project root."
        exit 1
    fi
    
    npm install
    
    # Install global development tools
    print_step "Installing global development tools..."
    npm install -g @playwright/test
    npm install -g jest
    npm install -g eslint
    npm install -g prettier
    
    print_success "npm dependencies installed"
}

setup_php() {
    print_step "Setting up PHP environment..."
    
    if check_command "php"; then
        PHP_CURRENT=$(php --version | head -n1 | cut -d' ' -f2 | cut -d'.' -f1,2)
        if [ "$PHP_CURRENT" = "$PHP_VERSION" ]; then
            print_success "PHP $PHP_CURRENT is already installed"
        else
            print_warning "PHP $PHP_CURRENT is installed, but $PHP_VERSION is recommended"
        fi
    else
        print_warning "PHP not found. Please install PHP $PHP_VERSION manually"
        print_warning "Visit: https://www.php.net/downloads"
        read -p "Press Enter when PHP is installed..."
    fi
    
    # Install Composer if not present
    if ! check_command "composer"; then
        print_step "Installing Composer..."
        curl -sS https://getcomposer.org/installer | php
        sudo mv composer.phar /usr/local/bin/composer
    fi
    
    print_success "PHP setup complete"
}

install_composer_dependencies() {
    print_step "Installing Composer dependencies..."
    
    if [ ! -f "composer.json" ]; then
        print_step "Creating composer.json for development dependencies..."
        cat > composer.json << EOF
{
    "name": "woow/admin-styler",
    "description": "WOOW Modern Admin Styler WordPress Plugin",
    "type": "wordpress-plugin",
    "require-dev": {
        "phpunit/phpunit": "^9.5",
        "squizlabs/php_codesniffer": "^3.6",
        "friendsofphp/php-cs-fixer": "^3.8",
        "phpstan/phpstan": "^1.8",
        "wp-coding-standards/wpcs": "^2.3"
    },
    "autoload": {
        "psr-4": {
            "WOOW\\AdminStyler\\": "src/"
        }
    },
    "scripts": {
        "test": "phpunit",
        "cs": "php-cs-fixer fix --dry-run --diff",
        "cs:fix": "php-cs-fixer fix",
        "phpstan": "phpstan analyse"
    }
}
EOF
    fi
    
    composer install
    
    print_success "Composer dependencies installed"
}

setup_database() {
    print_step "Setting up MySQL database..."
    
    if check_command "mysql"; then
        print_success "MySQL is already installed"
    else
        print_warning "MySQL not found. Please install MySQL $MYSQL_VERSION manually"
        print_warning "Visit: https://dev.mysql.com/downloads/installer/"
        read -p "Press Enter when MySQL is installed..."
    fi
    
    # Create development database
    print_step "Creating development database..."
    
    read -p "Enter MySQL root password: " -s MYSQL_ROOT_PASSWORD
    echo
    
    mysql -u root -p$MYSQL_ROOT_PASSWORD << EOF
CREATE DATABASE IF NOT EXISTS woow_dev;
CREATE DATABASE IF NOT EXISTS woow_test;
CREATE DATABASE IF NOT EXISTS woow_e2e;

CREATE USER IF NOT EXISTS 'dev_user'@'localhost' IDENTIFIED BY 'dev_password';
CREATE USER IF NOT EXISTS 'test_user'@'localhost' IDENTIFIED BY 'test_password';

GRANT ALL PRIVILEGES ON woow_dev.* TO 'dev_user'@'localhost';
GRANT ALL PRIVILEGES ON woow_test.* TO 'test_user'@'localhost';
GRANT ALL PRIVILEGES ON woow_e2e.* TO 'test_user'@'localhost';

FLUSH PRIVILEGES;
EOF
    
    print_success "Database setup complete"
}

setup_redis() {
    print_step "Setting up Redis cache..."
    
    if check_command "redis-server"; then
        print_success "Redis is already installed"
    else
        print_warning "Redis not found. Installing Redis..."
        
        if [[ "$OSTYPE" == "linux-gnu"* ]]; then
            # Ubuntu/Debian
            sudo apt-get update
            sudo apt-get install -y redis-server
        elif [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            if check_command "brew"; then
                brew install redis
            else
                print_warning "Homebrew not found. Please install Redis manually"
                print_warning "Visit: https://redis.io/download"
                read -p "Press Enter when Redis is installed..."
            fi
        else
            print_warning "Please install Redis manually for your system"
            print_warning "Visit: https://redis.io/download"
            read -p "Press Enter when Redis is installed..."
        fi
    fi
    
    # Start Redis service
    print_step "Starting Redis service..."
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        sudo systemctl start redis-server
        sudo systemctl enable redis-server
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        brew services start redis
    fi
    
    print_success "Redis setup complete"
}

setup_wordpress() {
    print_step "Setting up WordPress development environment..."
    
    # Create WordPress directory if it doesn't exist
    if [ ! -d "wordpress" ]; then
        mkdir wordpress
        cd wordpress
        
        # Download WordPress
        print_step "Downloading WordPress..."
        curl -O https://wordpress.org/latest.tar.gz
        tar -xzf latest.tar.gz --strip-components=1
        rm latest.tar.gz
        
        # Create wp-config.php
        print_step "Creating wp-config.php..."
        cp wp-config-sample.php wp-config.php
        
        # Generate salts
        SALTS=$(curl -s https://api.wordpress.org/secret-key/1.1/salt/)
        
        # Update wp-config.php
        sed -i "s/database_name_here/woow_dev/g" wp-config.php
        sed -i "s/username_here/dev_user/g" wp-config.php
        sed -i "s/password_here/dev_password/g" wp-config.php
        sed -i "s/localhost/127.0.0.1/g" wp-config.php
        
        # Add salts
        sed -i "/AUTH_KEY/,/NONCE_SALT/c\\
$SALTS" wp-config.php
        
        # Add debug settings
        echo "" >> wp-config.php
        echo "// Debug settings" >> wp-config.php
        echo "define('WP_DEBUG', true);" >> wp-config.php
        echo "define('WP_DEBUG_LOG', true);" >> wp-config.php
        echo "define('WP_DEBUG_DISPLAY', false);" >> wp-config.php
        echo "define('SCRIPT_DEBUG', true);" >> wp-config.php
        
        cd ..
    fi
    
    # Create symlink to plugin
    print_step "Creating plugin symlink..."
    if [ ! -L "wordpress/wp-content/plugins/$PROJECT_NAME" ]; then
        ln -s "$(pwd)" "wordpress/wp-content/plugins/$PROJECT_NAME"
    fi
    
    print_success "WordPress setup complete"
}

setup_testing() {
    print_step "Setting up testing infrastructure..."
    
    # Install Playwright browsers
    print_step "Installing Playwright browsers..."
    npx playwright install
    
    # Setup test directories
    print_step "Creating test directories..."
    mkdir -p tests/{unit,integration,e2e,performance,fixtures,utils,reports,logs,screenshots,videos}
    
    # Create test environment files
    print_step "Creating test environment files..."
    
    # .env.test
    cat > .env.test << EOF
NODE_ENV=testing
WP_TEST_URL=http://localhost:8080
WP_TEST_USERNAME=admin
WP_TEST_PASSWORD=password
DB_HOST=localhost
DB_USER=test_user
DB_PASSWORD=test_password
DB_NAME=woow_test
REDIS_HOST=localhost
REDIS_PORT=6379
HEADLESS=true
DEBUG=false
EOF
    
    # .env.e2e
    cat > .env.e2e << EOF
NODE_ENV=e2e
WP_TEST_URL=http://localhost:8080
WP_TEST_USERNAME=admin
WP_TEST_PASSWORD=password
DB_HOST=localhost
DB_USER=test_user
DB_PASSWORD=test_password
DB_NAME=woow_e2e
REDIS_HOST=localhost
REDIS_PORT=6379
HEADLESS=true
DEBUG=false
EOF
    
    print_success "Testing infrastructure setup complete"
}

setup_git_hooks() {
    print_step "Setting up Git hooks..."
    
    # Create pre-commit hook
    cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash
# WOOW Pre-commit hook

echo "Running pre-commit checks..."

# Run linting
echo "Running ESLint..."
npm run lint
if [ $? -ne 0 ]; then
    echo "ESLint failed. Please fix the issues and try again."
    exit 1
fi

# Run PHP CS Fixer
echo "Running PHP CS Fixer..."
composer run cs
if [ $? -ne 0 ]; then
    echo "PHP CS Fixer failed. Please fix the issues and try again."
    exit 1
fi

# Run unit tests
echo "Running unit tests..."
npm run test:unit
if [ $? -ne 0 ]; then
    echo "Unit tests failed. Please fix the issues and try again."
    exit 1
fi

echo "Pre-commit checks passed!"
EOF
    
    chmod +x .git/hooks/pre-commit
    
    print_success "Git hooks setup complete"
}

create_development_scripts() {
    print_step "Creating development scripts..."
    
    # Create scripts directory
    mkdir -p scripts
    
    # Create start script
    cat > scripts/start.sh << 'EOF'
#!/bin/bash
# Start development environment

echo "Starting WOOW development environment..."

# Start Redis
redis-server --daemonize yes

# Start WordPress development server
cd wordpress
php -S localhost:8080 &
WP_PID=$!
cd ..

echo "Development server started at http://localhost:8080"
echo "WordPress PID: $WP_PID"
echo "Press Ctrl+C to stop"

# Wait for interrupt
trap "kill $WP_PID; redis-cli shutdown; exit" INT
wait $WP_PID
EOF
    
    chmod +x scripts/start.sh
    
    # Create stop script
    cat > scripts/stop.sh << 'EOF'
#!/bin/bash
# Stop development environment

echo "Stopping WOOW development environment..."

# Stop WordPress server
pkill -f "php -S localhost:8080"

# Stop Redis
redis-cli shutdown

echo "Development environment stopped"
EOF
    
    chmod +x scripts/stop.sh
    
    # Create build script
    cat > scripts/build.sh << 'EOF'
#!/bin/bash
# Build production assets

echo "Building WOOW production assets..."

# Clean previous build
rm -rf dist

# Create dist directory
mkdir -p dist

# Build CSS
npm run build:css

# Build JavaScript
npm run build:js

# Copy PHP files
cp -r src dist/
cp woow-admin-styler.php dist/
cp readme.txt dist/
cp LICENSE dist/

# Create plugin ZIP
cd dist
zip -r woow-admin-styler.zip . -x "*.git*" "node_modules/*" "tests/*" "*.md"
cd ..

echo "Build complete! Plugin package: dist/woow-admin-styler.zip"
EOF
    
    chmod +x scripts/build.sh
    
    print_success "Development scripts created"
}

setup_ide_configuration() {
    print_step "Setting up IDE configuration..."
    
    # Create .vscode directory
    mkdir -p .vscode
    
    # VS Code settings
    cat > .vscode/settings.json << 'EOF'
{
    "php.validate.executablePath": "/usr/bin/php",
    "php.suggest.basic": false,
    "eslint.autoFixOnSave": true,
    "editor.formatOnSave": true,
    "editor.defaultFormatter": "esbenp.prettier-vscode",
    "files.exclude": {
        "**/node_modules": true,
        "**/vendor": true,
        "**/.git": true,
        "**/dist": true
    },
    "search.exclude": {
        "**/node_modules": true,
        "**/vendor": true,
        "**/dist": true
    },
    "emmet.includeLanguages": {
        "javascript": "javascriptreact"
    },
    "jest.autoEnable": true,
    "jest.pathToJest": "npm run test:unit"
}
EOF
    
    # VS Code extensions
    cat > .vscode/extensions.json << 'EOF'
{
    "recommendations": [
        "esbenp.prettier-vscode",
        "ms-vscode.vscode-eslint",
        "bradlc.vscode-tailwindcss",
        "ms-playwright.playwright",
        "orta.vscode-jest",
        "bmewburn.vscode-intelephense-client",
        "wordpresstoolbox.wordpress-toolbox"
    ]
}
EOF
    
    # VS Code tasks
    cat > .vscode/tasks.json << 'EOF'
{
    "version": "2.0.0",
    "tasks": [
        {
            "label": "Start Development Server",
            "type": "shell",
            "command": "./scripts/start.sh",
            "group": "build",
            "presentation": {
                "echo": true,
                "reveal": "always",
                "focus": false,
                "panel": "shared"
            }
        },
        {
            "label": "Run Tests",
            "type": "shell",
            "command": "npm run test",
            "group": "test",
            "presentation": {
                "echo": true,
                "reveal": "always",
                "focus": false,
                "panel": "shared"
            }
        },
        {
            "label": "Build Production",
            "type": "shell",
            "command": "./scripts/build.sh",
            "group": "build",
            "presentation": {
                "echo": true,
                "reveal": "always",
                "focus": false,
                "panel": "shared"
            }
        }
    ]
}
EOF
    
    print_success "IDE configuration setup complete"
}

run_initial_tests() {
    print_step "Running initial tests..."
    
    # Run unit tests
    print_step "Running unit tests..."
    npm run test:unit || print_warning "Unit tests failed - this is expected for a fresh setup"
    
    # Run linting
    print_step "Running linting..."
    npm run lint || print_warning "Linting issues found - please fix them"
    
    print_success "Initial tests complete"
}

print_completion_summary() {
    echo -e "${GREEN}"
    echo "╔══════════════════════════════════════════════════════════════════════════════╗"
    echo "║                           SETUP COMPLETE!                                   ║"
    echo "╠══════════════════════════════════════════════════════════════════════════════╣"
    echo "║                                                                              ║"
    echo "║  Your WOOW development environment is now ready!                            ║"
    echo "║                                                                              ║"
    echo "║  Next steps:                                                                 ║"
    echo "║  1. Start the development server: ./scripts/start.sh                        ║"
    echo "║  2. Visit WordPress admin: http://localhost:8080/wp-admin                   ║"
    echo "║  3. Run tests: npm run test                                                  ║"
    echo "║  4. Open performance monitor: tests/dashboard/performance-monitor.html      ║"
    echo "║                                                                              ║"
    echo "║  Available commands:                                                         ║"
    echo "║  • npm run test:unit          - Run unit tests                              ║"
    echo "║  • npm run test:integration   - Run integration tests                       ║"
    echo "║  • npm run test:e2e          - Run end-to-end tests                         ║"
    echo "║  • npm run test:performance   - Run performance tests                       ║"
    echo "║  • npm run lint              - Run code linting                             ║"
    echo "║  • npm run build             - Build production assets                      ║"
    echo "║  • ./scripts/start.sh        - Start development server                     ║"
    echo "║  • ./scripts/stop.sh         - Stop development server                      ║"
    echo "║  • ./scripts/build.sh        - Build production package                     ║"
    echo "║                                                                              ║"
    echo "║  Documentation:                                                              ║"
    echo "║  • tests/README.md           - Testing documentation                        ║"
    echo "║  • README.md                 - Project documentation                        ║"
    echo "║                                                                              ║"
    echo "╚══════════════════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

main() {
    print_header
    
    # Check if script is run from project root
    if [ ! -f "woow-admin-styler.php" ]; then
        print_error "This script must be run from the project root directory"
        exit 1
    fi
    
    # Run setup steps
    install_node
    install_npm_dependencies
    setup_php
    install_composer_dependencies
    setup_database
    setup_redis
    setup_wordpress
    setup_testing
    setup_git_hooks
    create_development_scripts
    setup_ide_configuration
    run_initial_tests
    
    print_completion_summary
}

# Run main function
main "$@" 