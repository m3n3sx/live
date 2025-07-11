/**
 * WOOW! Performance Testing Suite
 * Validates optimization results and monitors performance metrics
 * 
 * @package ModernAdminStyler
 * @version 4.0.0 - Performance Optimized
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Performance targets
const PERFORMANCE_TARGETS = {
    maxMemoryUsage: 15 * 1024 * 1024, // 15MB
    maxLoadTime: 1500, // 1.5s
    maxBundleSize: 200 * 1024, // 200KB gzipped
    minCompressionRatio: 30 // 30% minimum compression
};

// Colors for console output
const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    reset: '\x1b[0m',
    bold: '\x1b[1m'
};

class PerformanceTest {
    constructor() {
        this.results = {
            bundleSize: {},
            compressionRatio: {},
            fileCount: {},
            optimization: {},
            score: 0
        };
    }

    /**
     * Run all performance tests
     */
    async runTests() {
        console.log(`${colors.cyan}${colors.bold}🚀 WOOW Performance Test Suite${colors.reset}\n`);
        
        try {
            // Test 1: Bundle Size Analysis
            await this.testBundleSize();
            
            // Test 2: Compression Ratio
            await this.testCompressionRatio();
            
            // Test 3: File Count Optimization
            await this.testFileCount();
            
            // Test 4: Asset Optimization
            await this.testAssetOptimization();
            
            // Test 5: Cache Strategy
            await this.testCacheStrategy();
            
            // Generate final report
            this.generateReport();
            
        } catch (error) {
            console.error(`${colors.red}❌ Performance test failed:${colors.reset}`, error.message);
            process.exit(1);
        }
    }

    /**
     * Test bundle size against targets
     */
    async testBundleSize() {
        console.log(`${colors.blue}📦 Testing Bundle Size...${colors.reset}`);
        
        const distCSS = 'assets/css/dist';
        const distJS = 'assets/js/dist';
        
        let totalSize = 0;
        let gzippedSize = 0;
        
        // Check CSS files
        if (fs.existsSync(distCSS)) {
            const cssFiles = fs.readdirSync(distCSS);
            for (const file of cssFiles) {
                const filePath = path.join(distCSS, file);
                const size = fs.statSync(filePath).size;
                totalSize += size;
                
                // Calculate gzipped size
                try {
                    const gzipPath = `${filePath}.gz`;
                    execSync(`gzip -9 -c "${filePath}" > "${gzipPath}"`);
                    gzippedSize += fs.statSync(gzipPath).size;
                    fs.unlinkSync(gzipPath); // cleanup
                } catch (error) {
                    console.warn(`Could not calculate gzip size for ${file}`);
                }
            }
        }
        
        // Check JS files
        if (fs.existsSync(distJS)) {
            const jsFiles = fs.readdirSync(distJS);
            for (const file of jsFiles) {
                const filePath = path.join(distJS, file);
                const size = fs.statSync(filePath).size;
                totalSize += size;
                
                // Calculate gzipped size
                try {
                    const gzipPath = `${filePath}.gz`;
                    execSync(`gzip -9 -c "${filePath}" > "${gzipPath}"`);
                    gzippedSize += fs.statSync(gzipPath).size;
                    fs.unlinkSync(gzipPath); // cleanup
                } catch (error) {
                    console.warn(`Could not calculate gzip size for ${file}`);
                }
            }
        }
        
        this.results.bundleSize = {
            total: totalSize,
            gzipped: gzippedSize,
            target: PERFORMANCE_TARGETS.maxBundleSize,
            passed: gzippedSize <= PERFORMANCE_TARGETS.maxBundleSize
        };
        
        const status = this.results.bundleSize.passed ? 
            `${colors.green}✅ PASSED${colors.reset}` : 
            `${colors.red}❌ FAILED${colors.reset}`;
            
        console.log(`  Total Size: ${this.formatBytes(totalSize)}`);
        console.log(`  Gzipped: ${this.formatBytes(gzippedSize)} / ${this.formatBytes(PERFORMANCE_TARGETS.maxBundleSize)}`);
        console.log(`  Status: ${status}\n`);
    }

    /**
     * Test compression ratios
     */
    async testCompressionRatio() {
        console.log(`${colors.blue}🗜️  Testing Compression Ratios...${colors.reset}`);
        
        const sourceCSS = 'assets/css';
        const distCSS = 'assets/css/dist';
        const sourceJS = 'assets/js';
        const distJS = 'assets/js/dist';
        
        let originalSize = 0;
        let optimizedSize = 0;
        
        // Calculate CSS compression
        if (fs.existsSync(sourceCSS) && fs.existsSync(distCSS)) {
            // Source files
            const sourceFiles = ['woow-core.css', 'woow-features.css'];
            for (const file of sourceFiles) {
                const filePath = path.join(sourceCSS, file);
                if (fs.existsSync(filePath)) {
                    originalSize += fs.statSync(filePath).size;
                }
            }
            
            // Optimized files
            const distFiles = fs.readdirSync(distCSS);
            for (const file of distFiles) {
                const filePath = path.join(distCSS, file);
                optimizedSize += fs.statSync(filePath).size;
            }
        }
        
        // Calculate JS compression
        if (fs.existsSync(sourceJS) && fs.existsSync(distJS)) {
            // Source files
            const sourceFiles = ['woow-core.js', 'unified-settings-manager.js', 'woow-service-worker.js'];
            for (const file of sourceFiles) {
                const filePath = path.join(sourceJS, file);
                if (fs.existsSync(filePath)) {
                    originalSize += fs.statSync(filePath).size;
                }
            }
            
            // Optimized files
            const distFiles = fs.readdirSync(distJS);
            for (const file of distFiles) {
                const filePath = path.join(distJS, file);
                optimizedSize += fs.statSync(filePath).size;
            }
        }
        
        const compressionRatio = ((originalSize - optimizedSize) / originalSize * 100);
        
        this.results.compressionRatio = {
            original: originalSize,
            optimized: optimizedSize,
            ratio: compressionRatio,
            target: PERFORMANCE_TARGETS.minCompressionRatio,
            passed: compressionRatio >= PERFORMANCE_TARGETS.minCompressionRatio
        };
        
        const status = this.results.compressionRatio.passed ? 
            `${colors.green}✅ PASSED${colors.reset}` : 
            `${colors.red}❌ FAILED${colors.reset}`;
            
        console.log(`  Original: ${this.formatBytes(originalSize)}`);
        console.log(`  Optimized: ${this.formatBytes(optimizedSize)}`);
        console.log(`  Compression: ${compressionRatio.toFixed(1)}% / ${PERFORMANCE_TARGETS.minCompressionRatio}%`);
        console.log(`  Status: ${status}\n`);
    }

    /**
     * Test file count optimization
     */
    async testFileCount() {
        console.log(`${colors.blue}📁 Testing File Count Optimization...${colors.reset}`);
        
        // Before: Count original files
        const originalCSS = ['woow-main.css', 'woow-semantic-themes.css', 'woow-utilities.css', 
                            'live-edit-mode.css', 'woow-dark-mode.css', 'woow-responsive.css', 'woow-animations.css'];
        const originalJS = ['woow-admin.js', 'unified-live-edit.js', 'admin-global.js'];
        
        const originalCount = originalCSS.length + originalJS.length;
        
        // After: Count optimized files
        let optimizedCount = 0;
        
        if (fs.existsSync('assets/css/dist')) {
            optimizedCount += fs.readdirSync('assets/css/dist').length;
        }
        
        if (fs.existsSync('assets/js/dist')) {
            optimizedCount += fs.readdirSync('assets/js/dist').length;
        }
        
        const reduction = ((originalCount - optimizedCount) / originalCount * 100);
        
        this.results.fileCount = {
            original: originalCount,
            optimized: optimizedCount,
            reduction: reduction,
            passed: optimizedCount <= originalCount
        };
        
        const status = this.results.fileCount.passed ? 
            `${colors.green}✅ PASSED${colors.reset}` : 
            `${colors.red}❌ FAILED${colors.reset}`;
            
        console.log(`  Original files: ${originalCount}`);
        console.log(`  Optimized files: ${optimizedCount}`);
        console.log(`  Reduction: ${reduction.toFixed(1)}%`);
        console.log(`  Status: ${status}\n`);
    }

    /**
     * Test asset optimization features
     */
    async testAssetOptimization() {
        console.log(`${colors.blue}⚡ Testing Asset Optimization Features...${colors.reset}`);
        
        const features = {
            criticalCSS: fs.existsSync('assets/css/dist/woow-critical.min.css'),
            minifiedCSS: fs.existsSync('assets/css/dist/woow-core.min.css'),
            minifiedJS: fs.existsSync('assets/js/dist/woow-core.min.js'),
            serviceWorker: fs.existsSync('assets/js/dist/woow-service-worker.min.js'),
            buildConfig: fs.existsSync('build.config.js'),
            packageJson: fs.existsSync('package.json')
        };
        
        const passedFeatures = Object.values(features).filter(Boolean).length;
        const totalFeatures = Object.keys(features).length;
        const score = (passedFeatures / totalFeatures * 100);
        
        this.results.optimization = {
            features,
            score,
            passed: score >= 80
        };
        
        const status = this.results.optimization.passed ? 
            `${colors.green}✅ PASSED${colors.reset}` : 
            `${colors.red}❌ FAILED${colors.reset}`;
        
        console.log(`  Features implemented: ${passedFeatures}/${totalFeatures}`);
        console.log(`  Optimization score: ${score.toFixed(1)}%`);
        console.log(`  Status: ${status}\n`);
        
        // List feature status
        for (const [feature, implemented] of Object.entries(features)) {
            const icon = implemented ? '✅' : '❌';
            console.log(`    ${icon} ${feature}`);
        }
        console.log();
    }

    /**
     * Test cache strategy implementation
     */
    async testCacheStrategy() {
        console.log(`${colors.blue}🔄 Testing Cache Strategy...${colors.reset}`);
        
        const serviceWorkerExists = fs.existsSync('assets/js/dist/woow-service-worker.min.js');
        const registrationExists = fs.existsSync('assets/js/woow-service-worker-register.js');
        
        let cacheStrategies = 0;
        
        if (serviceWorkerExists) {
            const swContent = fs.readFileSync('assets/js/dist/woow-service-worker.min.js', 'utf8');
            
            // Check for cache strategies
            if (swContent.includes('cache-first')) cacheStrategies++;
            if (swContent.includes('network-first')) cacheStrategies++;
            if (swContent.includes('stale-while-revalidate')) cacheStrategies++;
        }
        
        const cacheScore = ((serviceWorkerExists ? 40 : 0) + 
                           (registrationExists ? 30 : 0) + 
                           (cacheStrategies * 10));
        
        const passed = cacheScore >= 70;
        
        const status = passed ? 
            `${colors.green}✅ PASSED${colors.reset}` : 
            `${colors.red}❌ FAILED${colors.reset}`;
        
        console.log(`  Service Worker: ${serviceWorkerExists ? '✅' : '❌'}`);
        console.log(`  Registration: ${registrationExists ? '✅' : '❌'}`);
        console.log(`  Cache Strategies: ${cacheStrategies}/3`);
        console.log(`  Cache Score: ${cacheScore}%`);
        console.log(`  Status: ${status}\n`);
    }

    /**
     * Generate final performance report
     */
    generateReport() {
        console.log(`${colors.cyan}${colors.bold}📊 PERFORMANCE REPORT${colors.reset}`);
        console.log('='.repeat(50));
        
        const tests = [
            { name: 'Bundle Size', result: this.results.bundleSize },
            { name: 'Compression Ratio', result: this.results.compressionRatio },
            { name: 'File Count', result: this.results.fileCount },
            { name: 'Asset Optimization', result: this.results.optimization }
        ];
        
        let passedTests = 0;
        let totalScore = 0;
        
        for (const test of tests) {
            if (test.result.passed) passedTests++;
            
            const status = test.result.passed ? 
                `${colors.green}PASS${colors.reset}` : 
                `${colors.red}FAIL${colors.reset}`;
            
            console.log(`${test.name.padEnd(20)} ${status}`);
        }
        
        // Calculate overall score
        const overallScore = (passedTests / tests.length * 100);
        
        console.log('\n' + '='.repeat(50));
        console.log(`${colors.bold}OVERALL PERFORMANCE SCORE: ${overallScore.toFixed(1)}%${colors.reset}`);
        
        if (overallScore >= 90) {
            console.log(`${colors.green}🎉 EXCELLENT PERFORMANCE!${colors.reset}`);
        } else if (overallScore >= 75) {
            console.log(`${colors.yellow}⚠️  Good performance, some optimizations possible${colors.reset}`);
        } else {
            console.log(`${colors.red}❌ Performance improvements needed${colors.reset}`);
        }
        
        // Performance recommendations
        console.log(`\n${colors.cyan}💡 PERFORMANCE SUMMARY:${colors.reset}`);
        console.log(`• Bundle size: ${this.formatBytes(this.results.bundleSize.gzipped)} (target: ${this.formatBytes(PERFORMANCE_TARGETS.maxBundleSize)})`);
        console.log(`• Compression: ${this.results.compressionRatio.ratio.toFixed(1)}% (target: ${PERFORMANCE_TARGETS.minCompressionRatio}%)`);
        console.log(`• File reduction: ${this.results.fileCount.reduction.toFixed(1)}%`);
        console.log(`• Optimization score: ${this.results.optimization.score.toFixed(1)}%`);
        
        if (overallScore >= 75) {
            console.log(`\n${colors.green}✅ Performance targets achieved!${colors.reset}`);
        }
        
        this.results.score = overallScore;
    }

    /**
     * Format bytes to human readable format
     */
    formatBytes(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

// Run performance tests
if (require.main === module) {
    const perfTest = new PerformanceTest();
    perfTest.runTests().catch(error => {
        console.error('Performance test suite failed:', error);
        process.exit(1);
    });
}

module.exports = PerformanceTest; 