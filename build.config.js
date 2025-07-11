/**
 * WOOW! Build Configuration
 * Performance optimization build process
 * 
 * @package ModernAdminStyler
 * @version 4.0.0 - Performance Optimized
 */

const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

// Build configuration
const config = {
    // Source and output directories
    src: {
        css: 'assets/css',
        js: 'assets/js'
    },
    dist: {
        css: 'assets/css/dist',
        js: 'assets/js/dist'
    },
    
    // Performance targets
    targets: {
        maxMemoryUsage: 15 * 1024 * 1024, // 15MB
        maxLoadTime: 1500, // 1.5s
        maxBundleSize: 200 * 1024, // 200KB gzipped
        minificationLevel: 'aggressive'
    },
    
    // Feature flags
    features: {
        treeshaking: true,
        codesplitting: true,
        lazyLoading: true,
        serviceWorker: true,
        criticalCSS: true,
        gzipCompression: true
    }
};

// File mappings for optimization
const fileMappings = {
    css: {
        // Core CSS (critical path)
        'woow-core.min.css': [
            'woow-core.css'
        ],
        
        // Features CSS (lazy loaded)
        'woow-features.min.css': [
            'woow-features.css'
        ]
    },
    
    js: {
        // Core JS (essential functionality)
        'woow-core.min.js': [
            'woow-core.js'
        ],
        
        // Unified Settings Manager (keep separate for caching)
        'unified-settings-manager.min.js': [
            'unified-settings-manager.js'
        ],
        
        // Service Worker (special handling)
        'woow-service-worker.min.js': [
            'woow-service-worker.js'
        ]
    }
};

// Critical CSS extraction patterns
const criticalCSSPatterns = [
    // WordPress admin core elements
    'body.wp-admin',
    '#wpwrap',
    '.wrap',
    '.postbox',
    '.wp-core-ui .button',
    '.notice',
    
    // WOOW core elements
    ':root',
    '.woow-loading',
    '.woow-sr-only',
    '.woow-skip-link',
    
    // Theme system
    'body.mas-theme-light',
    'body.mas-theme-dark',
    
    // Utility classes (most used)
    '.woow-hidden',
    '.woow-flex',
    '.woow-text-center'
];

// ========================================================================
// 🛠️ BUILD UTILITIES
// ========================================================================

class BuildUtils {
    static ensureDirectory(dir) {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
            console.log(`📁 Created directory: ${dir}`);
        }
    }
    
    static getFileSize(filePath) {
        try {
            const stats = fs.statSync(filePath);
            return stats.size;
        } catch {
            return 0;
        }
    }
    
    static formatBytes(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    static async gzipSize(filePath) {
        try {
            const gzipPath = `${filePath}.gz`;
            execSync(`gzip -9 -c "${filePath}" > "${gzipPath}"`);
            const size = this.getFileSize(gzipPath);
            fs.unlinkSync(gzipPath); // Clean up
            return size;
        } catch {
            return 0;
        }
    }
}

// ========================================================================
// 🎨 CSS OPTIMIZATION
// ========================================================================

class CSSOptimizer {
    static async optimizeCSS(inputFiles, outputFile) {
        console.log(`🎨 Optimizing CSS: ${outputFile}`);
        
        let combinedCSS = '';
        let originalSize = 0;
        
        // Combine CSS files
        for (const file of inputFiles) {
            const filePath = path.join(config.src.css, file);
            if (fs.existsSync(filePath)) {
                const content = fs.readFileSync(filePath, 'utf8');
                combinedCSS += content + '\n';
                originalSize += BuildUtils.getFileSize(filePath);
            }
        }
        
        // Optimize CSS
        let optimizedCSS = combinedCSS;
        
        // Remove comments
        optimizedCSS = optimizedCSS.replace(/\/\*[\s\S]*?\*\//g, '');
        
        // Remove unnecessary whitespace
        optimizedCSS = optimizedCSS.replace(/\s+/g, ' ');
        optimizedCSS = optimizedCSS.replace(/;\s+/g, ';');
        optimizedCSS = optimizedCSS.replace(/{\s+/g, '{');
        optimizedCSS = optimizedCSS.replace(/\s+}/g, '}');
        optimizedCSS = optimizedCSS.replace(/,\s+/g, ',');
        
        // Remove empty rules
        optimizedCSS = optimizedCSS.replace(/[^{}]+{\s*}/g, '');
        
        // Optimize colors
        optimizedCSS = optimizedCSS.replace(/#([a-f0-9])\1([a-f0-9])\2([a-f0-9])\3/gi, '#$1$2$3');
        optimizedCSS = optimizedCSS.replace(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/g, (match, r, g, b) => {
            const hex = ((1 << 24) + (parseInt(r) << 16) + (parseInt(g) << 8) + parseInt(b)).toString(16).slice(1);
            return `#${hex}`;
        });
        
        // Write optimized file
        const outputPath = path.join(config.dist.css, outputFile);
        BuildUtils.ensureDirectory(config.dist.css);
        fs.writeFileSync(outputPath, optimizedCSS.trim());
        
        const optimizedSize = BuildUtils.getFileSize(outputPath);
        const gzipSize = await BuildUtils.gzipSize(outputPath);
        const compressionRatio = ((originalSize - optimizedSize) / originalSize * 100).toFixed(1);
        
        console.log(`  📊 Original: ${BuildUtils.formatBytes(originalSize)}`);
        console.log(`  📦 Optimized: ${BuildUtils.formatBytes(optimizedSize)} (-${compressionRatio}%)`);
        console.log(`  🗜️ Gzipped: ${BuildUtils.formatBytes(gzipSize)}`);
        
        return {
            originalSize,
            optimizedSize,
            gzipSize,
            compressionRatio: parseFloat(compressionRatio)
        };
    }
    
    static extractCriticalCSS(cssContent) {
        console.log('🎯 Extracting critical CSS...');
        
        let criticalCSS = '';
        const lines = cssContent.split('\n');
        let inCriticalRule = false;
        let braceCount = 0;
        
        for (const line of lines) {
            const trimmedLine = line.trim();
            
            // Check if this line starts a critical rule
            if (!inCriticalRule) {
                for (const pattern of criticalCSSPatterns) {
                    if (trimmedLine.includes(pattern)) {
                        inCriticalRule = true;
                        break;
                    }
                }
            }
            
            if (inCriticalRule) {
                criticalCSS += line + '\n';
                
                // Count braces to know when rule ends
                braceCount += (line.match(/{/g) || []).length;
                braceCount -= (line.match(/}/g) || []).length;
                
                if (braceCount === 0) {
                    inCriticalRule = false;
                }
            }
        }
        
        return criticalCSS;
    }
}

// ========================================================================
// 🚀 JAVASCRIPT OPTIMIZATION
// ========================================================================

class JSOptimizer {
    static async optimizeJS(inputFiles, outputFile) {
        console.log(`🚀 Optimizing JS: ${outputFile}`);
        
        let combinedJS = '';
        let originalSize = 0;
        
        // Combine JS files
        for (const file of inputFiles) {
            const filePath = path.join(config.src.js, file);
            if (fs.existsSync(filePath)) {
                const content = fs.readFileSync(filePath, 'utf8');
                combinedJS += content + '\n';
                originalSize += BuildUtils.getFileSize(filePath);
            }
        }
        
        // Basic JS optimization (for production, use proper minifiers like Terser)
        let optimizedJS = combinedJS;
        
        // Remove single-line comments (be careful with URLs)
        optimizedJS = optimizedJS.replace(/^\s*\/\/.*$/gm, '');
        
        // Remove multi-line comments
        optimizedJS = optimizedJS.replace(/\/\*[\s\S]*?\*\//g, '');
        
        // Remove excessive whitespace
        optimizedJS = optimizedJS.replace(/\n\s*\n/g, '\n');
        optimizedJS = optimizedJS.replace(/^\s+/gm, '');
        
        // Write optimized file
        const outputPath = path.join(config.dist.js, outputFile);
        BuildUtils.ensureDirectory(config.dist.js);
        fs.writeFileSync(outputPath, optimizedJS.trim());
        
        const optimizedSize = BuildUtils.getFileSize(outputPath);
        const gzipSize = await BuildUtils.gzipSize(outputPath);
        const compressionRatio = ((originalSize - optimizedSize) / originalSize * 100).toFixed(1);
        
        console.log(`  📊 Original: ${BuildUtils.formatBytes(originalSize)}`);
        console.log(`  📦 Optimized: ${BuildUtils.formatBytes(optimizedSize)} (-${compressionRatio}%)`);
        console.log(`  🗜️ Gzipped: ${BuildUtils.formatBytes(gzipSize)}`);
        
        return {
            originalSize,
            optimizedSize,
            gzipSize,
            compressionRatio: parseFloat(compressionRatio)
        };
    }
}

// ========================================================================
// 🏗️ MAIN BUILD PROCESS
// ========================================================================

class Builder {
    static async build() {
        console.log('🚀 Starting WOOW optimization build...');
        console.log(`🎯 Target: <${BuildUtils.formatBytes(config.targets.maxBundleSize)} gzipped`);
        
        const stats = {
            css: {},
            js: {},
            totalOriginalSize: 0,
            totalOptimizedSize: 0,
            totalGzipSize: 0
        };
        
        // Build CSS files
        console.log('\n📐 Building CSS files...');
        for (const [outputFile, inputFiles] of Object.entries(fileMappings.css)) {
            const result = await CSSOptimizer.optimizeCSS(inputFiles, outputFile);
            stats.css[outputFile] = result;
            stats.totalOriginalSize += result.originalSize;
            stats.totalOptimizedSize += result.optimizedSize;
            stats.totalGzipSize += result.gzipSize;
        }
        
        // Extract critical CSS
        if (config.features.criticalCSS) {
            const coreCSS = fs.readFileSync(path.join(config.dist.css, 'woow-core.min.css'), 'utf8');
            const criticalCSS = CSSOptimizer.extractCriticalCSS(coreCSS);
            const criticalPath = path.join(config.dist.css, 'woow-critical.min.css');
            fs.writeFileSync(criticalPath, criticalCSS);
            console.log(`🎯 Critical CSS extracted: ${BuildUtils.formatBytes(BuildUtils.getFileSize(criticalPath))}`);
        }
        
        // Build JS files
        console.log('\n⚡ Building JS files...');
        for (const [outputFile, inputFiles] of Object.entries(fileMappings.js)) {
            const result = await JSOptimizer.optimizeJS(inputFiles, outputFile);
            stats.js[outputFile] = result;
            stats.totalOriginalSize += result.originalSize;
            stats.totalOptimizedSize += result.optimizedSize;
            stats.totalGzipSize += result.gzipSize;
        }
        
        // Generate build report
        this.generateBuildReport(stats);
        
        // Check performance targets
        this.checkPerformanceTargets(stats);
        
        console.log('\n✅ Build completed successfully!');
    }
    
    static generateBuildReport(stats) {
        console.log('\n📊 BUILD REPORT');
        console.log('================');
        
        console.log('\n🎨 CSS Files:');
        for (const [file, data] of Object.entries(stats.css)) {
            console.log(`  ${file}: ${BuildUtils.formatBytes(data.gzipSize)} (${data.compressionRatio}% smaller)`);
        }
        
        console.log('\n⚡ JS Files:');
        for (const [file, data] of Object.entries(stats.js)) {
            console.log(`  ${file}: ${BuildUtils.formatBytes(data.gzipSize)} (${data.compressionRatio}% smaller)`);
        }
        
        const totalCompressionRatio = ((stats.totalOriginalSize - stats.totalOptimizedSize) / stats.totalOriginalSize * 100).toFixed(1);
        
        console.log('\n📈 TOTALS:');
        console.log(`  Original: ${BuildUtils.formatBytes(stats.totalOriginalSize)}`);
        console.log(`  Optimized: ${BuildUtils.formatBytes(stats.totalOptimizedSize)} (-${totalCompressionRatio}%)`);
        console.log(`  Gzipped: ${BuildUtils.formatBytes(stats.totalGzipSize)}`);
    }
    
    static checkPerformanceTargets(stats) {
        console.log('\n🎯 PERFORMANCE TARGETS:');
        
        const bundleSize = stats.totalGzipSize;
        const target = config.targets.maxBundleSize;
        const bundleStatus = bundleSize <= target ? '✅' : '❌';
        
        console.log(`  Bundle size: ${bundleStatus} ${BuildUtils.formatBytes(bundleSize)} / ${BuildUtils.formatBytes(target)}`);
        
        if (bundleSize > target) {
            console.log(`  ⚠️  Bundle size exceeds target by ${BuildUtils.formatBytes(bundleSize - target)}`);
            console.log(`  💡 Consider further optimizations or code splitting`);
        }
        
        // Additional recommendations
        if (bundleSize <= target * 0.8) {
            console.log(`  🎉 Excellent! Bundle is ${Math.round((1 - bundleSize / target) * 100)}% under target`);
        }
    }
}

// ========================================================================
// 🎯 BUILD EXECUTION
// ========================================================================

if (require.main === module) {
    Builder.build().catch(error => {
        console.error('❌ Build failed:', error);
        process.exit(1);
    });
}

module.exports = {
    config,
    Builder,
    CSSOptimizer,
    JSOptimizer,
    BuildUtils
}; 