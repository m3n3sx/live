#!/usr/bin/env node

/**
 * Advanced Test Runner Script
 * WOOW Modern Admin Styler v4.0
 * 
 * Features:
 * - Parallel test execution
 * - Environment-specific configuration
 * - Performance monitoring
 * - Report generation
 * - CI/CD integration
 */

import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const execAsync = promisify(exec);

class TestRunner {
  constructor() {
    this.config = {
      environments: ['development', 'testing', 'ci'],
      browsers: ['chrome', 'firefox', 'safari'],
      testTypes: ['unit', 'integration', 'e2e', 'performance'],
      parallel: true,
      maxWorkers: 4,
      timeout: 30000,
      retries: 2,
      coverage: true,
      reports: ['json', 'html', 'lcov'],
      logLevel: 'info'
    };
    
    this.results = {
      passed: 0,
      failed: 0,
      skipped: 0,
      total: 0,
      duration: 0,
      coverage: 0
    };
    
    this.startTime = Date.now();
  }

  /**
   * Parse command line arguments
   */
  parseArgs() {
    const args = process.argv.slice(2);
    const options = {};
    
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      
      if (arg === '--help' || arg === '-h') {
        this.showHelp();
        process.exit(0);
      }
      
      if (arg === '--env' || arg === '-e') {
        options.environment = args[++i];
      }
      
      if (arg === '--browser' || arg === '-b') {
        options.browser = args[++i];
      }
      
      if (arg === '--type' || arg === '-t') {
        options.testType = args[++i];
      }
      
      if (arg === '--parallel' || arg === '-p') {
        options.parallel = true;
      }
      
      if (arg === '--sequential' || arg === '-s') {
        options.parallel = false;
      }
      
      if (arg === '--workers' || arg === '-w') {
        options.maxWorkers = parseInt(args[++i]);
      }
      
      if (arg === '--timeout') {
        options.timeout = parseInt(args[++i]);
      }
      
      if (arg === '--retries') {
        options.retries = parseInt(args[++i]);
      }
      
      if (arg === '--coverage') {
        options.coverage = true;
      }
      
      if (arg === '--no-coverage') {
        options.coverage = false;
      }
      
      if (arg === '--watch') {
        options.watch = true;
      }
      
      if (arg === '--debug') {
        options.debug = true;
        options.logLevel = 'debug';
      }
      
      if (arg === '--verbose' || arg === '-v') {
        options.logLevel = 'verbose';
      }
      
      if (arg === '--quiet' || arg === '-q') {
        options.logLevel = 'error';
      }
      
      if (arg === '--ci') {
        options.ci = true;
        options.parallel = true;
        options.coverage = true;
      }
      
      if (arg === '--headless') {
        options.headless = true;
      }
      
      if (arg === '--update-snapshots') {
        options.updateSnapshots = true;
      }
      
      if (arg === '--fail-fast') {
        options.failFast = true;
      }
      
      if (arg.startsWith('--')) {
        const key = arg.slice(2);
        const value = args[++i];
        options[key] = value;
      }
    }
    
    return options;
  }

  /**
   * Show help message
   */
  showHelp() {
    console.log(`
WOOW Test Runner v4.0

Usage: node scripts/test-runner.js [options]

Options:
  -h, --help              Show this help message
  -e, --env <env>         Test environment (development, testing, ci)
  -b, --browser <browser> Target browser (chrome, firefox, safari)
  -t, --type <type>       Test type (unit, integration, e2e, performance)
  -p, --parallel          Run tests in parallel (default)
  -s, --sequential        Run tests sequentially
  -w, --workers <num>     Number of parallel workers (default: 4)
  --timeout <ms>          Test timeout in milliseconds (default: 30000)
  --retries <num>         Number of retries for failed tests (default: 2)
  --coverage              Enable code coverage (default)
  --no-coverage           Disable code coverage
  --watch                 Watch mode for development
  --debug                 Enable debug logging
  -v, --verbose           Verbose output
  -q, --quiet             Quiet output (errors only)
  --ci                    CI mode (parallel, coverage, headless)
  --headless              Run browsers in headless mode
  --update-snapshots      Update test snapshots
  --fail-fast             Stop on first failure

Examples:
  node scripts/test-runner.js                    # Run all tests
  node scripts/test-runner.js --type unit        # Run unit tests only
  node scripts/test-runner.js --env ci --ci      # Run in CI mode
  node scripts/test-runner.js --browser chrome   # Run Chrome tests only
  node scripts/test-runner.js --watch            # Watch mode
  node scripts/test-runner.js --debug            # Debug mode
    `);
  }

  /**
   * Setup test environment
   */
  async setupEnvironment(options) {
    this.log('Setting up test environment...', 'info');
    
    // Create necessary directories
    await this.ensureDirectories([
      'tests/logs',
      'tests/reports',
      'tests/coverage',
      'tests/screenshots',
      'tests/videos'
    ]);
    
    // Set environment variables
    process.env.NODE_ENV = options.environment || 'testing';
    process.env.WOOW_TEST_MODE = 'true';
    
    if (options.debug) {
      process.env.DEBUG = 'woow:*';
    }
    
    if (options.headless) {
      process.env.HEADLESS = 'true';
    }
    
    // Setup database
    if (options.testType === 'integration' || options.testType === 'e2e') {
      await this.setupDatabase(options);
    }
    
    // Setup WordPress environment
    if (options.testType === 'e2e') {
      await this.setupWordPress(options);
    }
  }

  /**
   * Ensure directories exist
   */
  async ensureDirectories(dirs) {
    for (const dir of dirs) {
      try {
        await fs.access(dir);
      } catch {
        await fs.mkdir(dir, { recursive: true });
      }
    }
  }

  /**
   * Setup database for testing
   */
  async setupDatabase(options) {
    this.log('Setting up test database...', 'info');
    
    const env = options.environment || 'testing';
    const dbConfig = this.getDBConfig(env);
    
    try {
      // Create database if it doesn't exist
      await execAsync(`mysql -h ${dbConfig.host} -u ${dbConfig.user} -p${dbConfig.password} -e "CREATE DATABASE IF NOT EXISTS ${dbConfig.name}"`);
      
      // Run migrations if needed
      if (await this.fileExists('tests/fixtures/database.sql')) {
        await execAsync(`mysql -h ${dbConfig.host} -u ${dbConfig.user} -p${dbConfig.password} ${dbConfig.name} < tests/fixtures/database.sql`);
      }
      
      this.log('Database setup complete', 'success');
    } catch (error) {
      this.log(`Database setup failed: ${error.message}`, 'error');
      throw error;
    }
  }

  /**
   * Setup WordPress environment
   */
  async setupWordPress(options) {
    this.log('Setting up WordPress environment...', 'info');
    
    try {
      // Check if WordPress is already running
      const wpStatus = await this.checkWordPressStatus();
      
      if (!wpStatus.running) {
        // Start WordPress development server
        await this.startWordPressServer(options);
        
        // Wait for WordPress to be ready
        await this.waitForWordPress();
      }
      
      this.log('WordPress environment ready', 'success');
    } catch (error) {
      this.log(`WordPress setup failed: ${error.message}`, 'error');
      throw error;
    }
  }

  /**
   * Check WordPress status
   */
  async checkWordPressStatus() {
    try {
      const { stdout } = await execAsync('curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/wp-admin/');
      return {
        running: stdout.trim() === '200',
        url: 'http://localhost:8080'
      };
    } catch {
      return { running: false };
    }
  }

  /**
   * Start WordPress development server
   */
  async startWordPressServer(options) {
    return new Promise((resolve, reject) => {
      const server = spawn('npm', ['run', 'server:start'], {
        stdio: options.debug ? 'inherit' : 'pipe',
        detached: true
      });
      
      server.unref();
      
      setTimeout(() => {
        resolve();
      }, 10000); // Give WordPress 10 seconds to start
    });
  }

  /**
   * Wait for WordPress to be ready
   */
  async waitForWordPress(maxAttempts = 30) {
    for (let i = 0; i < maxAttempts; i++) {
      const status = await this.checkWordPressStatus();
      if (status.running) {
        return true;
      }
      await this.sleep(1000);
    }
    throw new Error('WordPress failed to start within timeout');
  }

  /**
   * Run tests
   */
  async runTests(options) {
    this.log('Starting test execution...', 'info');
    
    const testSuites = this.getTestSuites(options);
    const results = [];
    
    if (options.parallel && testSuites.length > 1) {
      this.log(`Running ${testSuites.length} test suites in parallel...`, 'info');
      results.push(...await this.runParallelTests(testSuites, options));
    } else {
      this.log(`Running ${testSuites.length} test suites sequentially...`, 'info');
      for (const suite of testSuites) {
        const result = await this.runTestSuite(suite, options);
        results.push(result);
        
        if (options.failFast && result.failed > 0) {
          this.log('Stopping due to --fail-fast flag', 'warn');
          break;
        }
      }
    }
    
    return results;
  }

  /**
   * Get test suites to run
   */
  getTestSuites(options) {
    const suites = [];
    
    if (!options.testType || options.testType === 'unit') {
      suites.push({
        name: 'Unit Tests',
        type: 'unit',
        command: 'npm run test:unit',
        config: 'jest.config.js'
      });
    }
    
    if (!options.testType || options.testType === 'integration') {
      suites.push({
        name: 'Integration Tests',
        type: 'integration',
        command: 'npm run test:integration',
        config: 'jest.config.js'
      });
    }
    
    if (!options.testType || options.testType === 'e2e') {
      const browsers = options.browser ? [options.browser] : ['chrome', 'firefox'];
      
      for (const browser of browsers) {
        suites.push({
          name: `E2E Tests (${browser})`,
          type: 'e2e',
          command: `npm run test:e2e -- --project=${browser}`,
          config: 'playwright.config.js',
          browser
        });
      }
    }
    
    if (!options.testType || options.testType === 'performance') {
      suites.push({
        name: 'Performance Tests',
        type: 'performance',
        command: 'npm run test:performance',
        config: 'playwright.config.js'
      });
    }
    
    return suites;
  }

  /**
   * Run test suites in parallel
   */
  async runParallelTests(testSuites, options) {
    const maxWorkers = Math.min(options.maxWorkers || 4, testSuites.length);
    const chunks = this.chunkArray(testSuites, maxWorkers);
    const results = [];
    
    for (const chunk of chunks) {
      const promises = chunk.map(suite => this.runTestSuite(suite, options));
      const chunkResults = await Promise.all(promises);
      results.push(...chunkResults);
    }
    
    return results;
  }

  /**
   * Run individual test suite
   */
  async runTestSuite(suite, options) {
    const startTime = Date.now();
    this.log(`Running ${suite.name}...`, 'info');
    
    try {
      const command = this.buildCommand(suite, options);
      const result = await this.executeCommand(command, options);
      
      const duration = Date.now() - startTime;
      const testResult = {
        suite: suite.name,
        type: suite.type,
        passed: result.passed || 0,
        failed: result.failed || 0,
        skipped: result.skipped || 0,
        total: result.total || 0,
        duration,
        coverage: result.coverage || 0,
        success: result.exitCode === 0
      };
      
      this.results.passed += testResult.passed;
      this.results.failed += testResult.failed;
      this.results.skipped += testResult.skipped;
      this.results.total += testResult.total;
      
      const status = testResult.success ? 'success' : 'error';
      this.log(`${suite.name} completed: ${testResult.passed} passed, ${testResult.failed} failed, ${testResult.skipped} skipped (${duration}ms)`, status);
      
      return testResult;
    } catch (error) {
      this.log(`${suite.name} failed: ${error.message}`, 'error');
      
      return {
        suite: suite.name,
        type: suite.type,
        passed: 0,
        failed: 1,
        skipped: 0,
        total: 1,
        duration: Date.now() - startTime,
        coverage: 0,
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Build test command
   */
  buildCommand(suite, options) {
    let command = suite.command;
    
    // Add coverage flag
    if (options.coverage !== false) {
      command += ' --coverage';
    }
    
    // Add debug flag
    if (options.debug) {
      command += ' --verbose';
    }
    
    // Add headless flag
    if (options.headless) {
      command += ' --headless';
    }
    
    // Add update snapshots flag
    if (options.updateSnapshots) {
      command += ' --updateSnapshot';
    }
    
    // Add timeout
    if (options.timeout) {
      command += ` --timeout ${options.timeout}`;
    }
    
    // Add retries
    if (options.retries) {
      command += ` --retries ${options.retries}`;
    }
    
    return command;
  }

  /**
   * Execute command
   */
  async executeCommand(command, options) {
    return new Promise((resolve, reject) => {
      const child = spawn('bash', ['-c', command], {
        stdio: options.debug ? 'inherit' : 'pipe',
        env: { ...process.env }
      });
      
      let stdout = '';
      let stderr = '';
      
      if (child.stdout) {
        child.stdout.on('data', (data) => {
          stdout += data.toString();
        });
      }
      
      if (child.stderr) {
        child.stderr.on('data', (data) => {
          stderr += data.toString();
        });
      }
      
      child.on('close', (code) => {
        const result = this.parseTestOutput(stdout, stderr);
        result.exitCode = code;
        resolve(result);
      });
      
      child.on('error', (error) => {
        reject(error);
      });
      
      // Handle timeout
      const timeout = setTimeout(() => {
        child.kill('SIGTERM');
        reject(new Error('Test execution timed out'));
      }, options.timeout || 300000); // 5 minutes default
      
      child.on('close', () => {
        clearTimeout(timeout);
      });
    });
  }

  /**
   * Parse test output
   */
  parseTestOutput(stdout, stderr) {
    const result = {
      passed: 0,
      failed: 0,
      skipped: 0,
      total: 0,
      coverage: 0
    };
    
    // Jest output parsing
    const jestMatch = stdout.match(/Tests:\s+(\d+) failed,\s+(\d+) passed,\s+(\d+) total/);
    if (jestMatch) {
      result.failed = parseInt(jestMatch[1]);
      result.passed = parseInt(jestMatch[2]);
      result.total = parseInt(jestMatch[3]);
    }
    
    // Playwright output parsing
    const playwrightMatch = stdout.match(/(\d+) passed.*?(\d+) failed.*?(\d+) skipped/);
    if (playwrightMatch) {
      result.passed = parseInt(playwrightMatch[1]);
      result.failed = parseInt(playwrightMatch[2]);
      result.skipped = parseInt(playwrightMatch[3]);
      result.total = result.passed + result.failed + result.skipped;
    }
    
    // Coverage parsing
    const coverageMatch = stdout.match(/All files\s+\|\s+([\d.]+)/);
    if (coverageMatch) {
      result.coverage = parseFloat(coverageMatch[1]);
    }
    
    return result;
  }

  /**
   * Generate reports
   */
  async generateReports(results, options) {
    this.log('Generating test reports...', 'info');
    
    const reportData = {
      timestamp: new Date().toISOString(),
      environment: options.environment || 'testing',
      browser: options.browser || 'all',
      testType: options.testType || 'all',
      summary: {
        passed: this.results.passed,
        failed: this.results.failed,
        skipped: this.results.skipped,
        total: this.results.total,
        duration: Date.now() - this.startTime,
        coverage: this.calculateAverageCoverage(results)
      },
      suites: results
    };
    
    // Generate JSON report
    await this.generateJSONReport(reportData);
    
    // Generate HTML report
    await this.generateHTMLReport(reportData);
    
    // Generate JUnit XML report
    await this.generateJUnitReport(reportData);
    
    // Generate performance report
    if (results.some(r => r.type === 'performance')) {
      await this.generatePerformanceReport(reportData);
    }
    
    this.log('Reports generated successfully', 'success');
  }

  /**
   * Generate JSON report
   */
  async generateJSONReport(data) {
    const reportPath = `tests/reports/test-results-${Date.now()}.json`;
    await fs.writeFile(reportPath, JSON.stringify(data, null, 2));
    this.log(`JSON report: ${reportPath}`, 'info');
  }

  /**
   * Generate HTML report
   */
  async generateHTMLReport(data) {
    const html = this.generateHTMLReportContent(data);
    const reportPath = `tests/reports/test-report-${Date.now()}.html`;
    await fs.writeFile(reportPath, html);
    this.log(`HTML report: ${reportPath}`, 'info');
  }

  /**
   * Generate HTML report content
   */
  generateHTMLReportContent(data) {
    const { summary, suites } = data;
    const successRate = ((summary.passed / summary.total) * 100).toFixed(2);
    
    return `
<!DOCTYPE html>
<html>
<head>
    <title>WOOW Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f0f0f0; padding: 20px; border-radius: 5px; }
        .summary { display: flex; gap: 20px; margin: 20px 0; }
        .metric { background: #fff; padding: 15px; border-radius: 5px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .metric.success { border-left: 4px solid #4caf50; }
        .metric.error { border-left: 4px solid #f44336; }
        .metric.warning { border-left: 4px solid #ff9800; }
        .suite { margin: 20px 0; padding: 15px; background: #f9f9f9; border-radius: 5px; }
        .suite.success { border-left: 4px solid #4caf50; }
        .suite.error { border-left: 4px solid #f44336; }
        .progress { width: 100%; height: 20px; background: #e0e0e0; border-radius: 10px; overflow: hidden; }
        .progress-bar { height: 100%; background: #4caf50; transition: width 0.3s; }
        .progress-bar.error { background: #f44336; }
    </style>
</head>
<body>
    <div class="header">
        <h1>WOOW Test Report</h1>
        <p>Generated: ${data.timestamp}</p>
        <p>Environment: ${data.environment}</p>
        <p>Browser: ${data.browser}</p>
        <p>Test Type: ${data.testType}</p>
    </div>

    <div class="summary">
        <div class="metric success">
            <h3>Success Rate</h3>
            <p>${successRate}%</p>
        </div>
        <div class="metric">
            <h3>Total Tests</h3>
            <p>${summary.total}</p>
        </div>
        <div class="metric success">
            <h3>Passed</h3>
            <p>${summary.passed}</p>
        </div>
        <div class="metric error">
            <h3>Failed</h3>
            <p>${summary.failed}</p>
        </div>
        <div class="metric warning">
            <h3>Skipped</h3>
            <p>${summary.skipped}</p>
        </div>
        <div class="metric">
            <h3>Duration</h3>
            <p>${(summary.duration / 1000).toFixed(2)}s</p>
        </div>
        <div class="metric">
            <h3>Coverage</h3>
            <p>${summary.coverage.toFixed(2)}%</p>
        </div>
    </div>

    <div class="progress">
        <div class="progress-bar" style="width: ${successRate}%"></div>
    </div>

    <h2>Test Suites</h2>
    ${suites.map(suite => `
        <div class="suite ${suite.success ? 'success' : 'error'}">
            <h3>${suite.suite}</h3>
            <p>Type: ${suite.type}</p>
            <p>Duration: ${(suite.duration / 1000).toFixed(2)}s</p>
            <p>Tests: ${suite.total} | Passed: ${suite.passed} | Failed: ${suite.failed} | Skipped: ${suite.skipped}</p>
            ${suite.coverage > 0 ? `<p>Coverage: ${suite.coverage.toFixed(2)}%</p>` : ''}
            ${suite.error ? `<p style="color: red;">Error: ${suite.error}</p>` : ''}
        </div>
    `).join('')}
</body>
</html>
    `;
  }

  /**
   * Generate JUnit XML report
   */
  async generateJUnitReport(data) {
    const xml = this.generateJUnitXML(data);
    const reportPath = `tests/reports/junit-${Date.now()}.xml`;
    await fs.writeFile(reportPath, xml);
    this.log(`JUnit report: ${reportPath}`, 'info');
  }

  /**
   * Generate JUnit XML content
   */
  generateJUnitXML(data) {
    const { summary, suites } = data;
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<testsuites name="WOOW Test Suite" tests="${summary.total}" failures="${summary.failed}" errors="0" skipped="${summary.skipped}" time="${(summary.duration / 1000).toFixed(2)}">
${suites.map(suite => `
    <testsuite name="${suite.suite}" tests="${suite.total}" failures="${suite.failed}" errors="0" skipped="${suite.skipped}" time="${(suite.duration / 1000).toFixed(2)}">
        ${suite.error ? `<error message="${suite.error}"></error>` : ''}
        ${Array.from({ length: suite.passed }, (_, i) => `<testcase name="test-${i + 1}" time="0.1"></testcase>`).join('')}
        ${Array.from({ length: suite.failed }, (_, i) => `<testcase name="failed-test-${i + 1}" time="0.1"><failure message="Test failed"></failure></testcase>`).join('')}
        ${Array.from({ length: suite.skipped }, (_, i) => `<testcase name="skipped-test-${i + 1}" time="0.0"><skipped></skipped></testcase>`).join('')}
    </testsuite>
`).join('')}
</testsuites>`;
  }

  /**
   * Generate performance report
   */
  async generatePerformanceReport(data) {
    const performanceData = {
      timestamp: data.timestamp,
      environment: data.environment,
      metrics: this.extractPerformanceMetrics(data.suites),
      thresholds: this.getPerformanceThresholds(data.environment)
    };
    
    const reportPath = `tests/reports/performance-${Date.now()}.json`;
    await fs.writeFile(reportPath, JSON.stringify(performanceData, null, 2));
    this.log(`Performance report: ${reportPath}`, 'info');
  }

  /**
   * Utility methods
   */
  chunkArray(array, chunkSize) {
    const chunks = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  calculateAverageCoverage(results) {
    const coverageResults = results.filter(r => r.coverage > 0);
    if (coverageResults.length === 0) return 0;
    
    const totalCoverage = coverageResults.reduce((sum, r) => sum + r.coverage, 0);
    return totalCoverage / coverageResults.length;
  }

  extractPerformanceMetrics(suites) {
    const performanceSuite = suites.find(s => s.type === 'performance');
    return performanceSuite ? performanceSuite.metrics : {};
  }

  getPerformanceThresholds(environment) {
    const thresholds = {
      development: { pageLoadTime: 3000, memoryUsage: 150, cpuUsage: 30 },
      testing: { pageLoadTime: 2000, memoryUsage: 100, cpuUsage: 20 },
      production: { pageLoadTime: 1000, memoryUsage: 50, cpuUsage: 8 }
    };
    
    return thresholds[environment] || thresholds.testing;
  }

  getDBConfig(environment) {
    const configs = {
      development: { host: 'localhost', port: 3306, name: 'woow_dev', user: 'dev_user', password: 'dev_password' },
      testing: { host: 'localhost', port: 3306, name: 'woow_test', user: 'test_user', password: 'test_password' },
      ci: { host: 'mysql', port: 3306, name: 'woow_ci', user: 'ci_user', password: 'ci_password' }
    };
    
    return configs[environment] || configs.testing;
  }

  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  log(message, level = 'info') {
    const timestamp = new Date().toISOString();
    const colors = {
      info: '\x1b[36m',
      success: '\x1b[32m',
      warn: '\x1b[33m',
      error: '\x1b[31m',
      debug: '\x1b[35m'
    };
    
    const color = colors[level] || colors.info;
    const reset = '\x1b[0m';
    
    console.log(`${color}[${timestamp}] ${level.toUpperCase()}: ${message}${reset}`);
  }

  /**
   * Main execution
   */
  async run() {
    try {
      const options = this.parseArgs();
      
      // Setup environment
      await this.setupEnvironment(options);
      
      // Run tests
      const results = await this.runTests(options);
      
      // Generate reports
      await this.generateReports(results, options);
      
      // Print summary
      this.printSummary(results);
      
      // Exit with appropriate code
      const hasFailures = results.some(r => r.failed > 0);
      process.exit(hasFailures ? 1 : 0);
      
    } catch (error) {
      this.log(`Test runner failed: ${error.message}`, 'error');
      process.exit(1);
    }
  }

  /**
   * Print test summary
   */
  printSummary(results) {
    const totalDuration = Date.now() - this.startTime;
    const successRate = ((this.results.passed / this.results.total) * 100).toFixed(2);
    
    console.log('\n' + '='.repeat(60));
    console.log('TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Tests: ${this.results.total}`);
    console.log(`Passed: ${this.results.passed}`);
    console.log(`Failed: ${this.results.failed}`);
    console.log(`Skipped: ${this.results.skipped}`);
    console.log(`Success Rate: ${successRate}%`);
    console.log(`Duration: ${(totalDuration / 1000).toFixed(2)}s`);
    console.log('='.repeat(60));
    
    if (this.results.failed > 0) {
      console.log('❌ Tests failed');
    } else {
      console.log('✅ All tests passed');
    }
  }
}

// Run the test runner
if (import.meta.url === `file://${process.argv[1]}`) {
  const runner = new TestRunner();
  runner.run();
}

export default TestRunner; 