// playwright.config.js
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  // Test directory
  testDir: './playwright',
  
  // Global test timeout
  timeout: 90 * 1000, // Zwiększony timeout dla stabilności
  
  // Expect timeout
  expect: {
    timeout: 15 * 1000, // Zwiększony timeout dla expect
  },
  
  // Run tests in files in parallel
  fullyParallel: false, // Wyłączone dla WordPress - może być problematyczne
  
  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,
  
  // Retry on CI only
  retries: process.env.CI ? 2 : 1,
  
  // Opt out of parallel tests on CI
  workers: process.env.CI ? 1 : 2,
  
  // Reporter to use
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['line']
  ],
  
  // Shared settings for all the projects below
  use: {
    // Base URL to use in actions like `await page.goto('/')`
    baseURL: 'http://localhost:10013',
    
    // Collect trace when retrying the failed test
    trace: 'on-first-retry',
    
    // Record video
    video: 'retain-on-failure',
    
    // Take screenshot
    screenshot: 'only-on-failure',
    
    // Browser context options
    ignoreHTTPSErrors: true,
    
    // Viewport used for all pages
    viewport: { width: 1280, height: 720 },
    
    // User agent
    userAgent: 'Mozilla/5.0 (compatible; MAS-V2-Test/1.0; +https://example.com/bot)',
    
    // Extra HTTP headers
    extraHTTPHeaders: {
      'Accept-Language': 'pl-PL,pl;q=0.9,en;q=0.8'
    }
  },

  // Configure projects for major browsers
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // Dodatkowe opcje dla Chrome
        launchOptions: {
          args: [
            '--disable-web-security',
            '--disable-features=VizDisplayCompositor',
            '--no-sandbox'
          ]
        }
      },
    },
    
    {
      name: 'firefox',
      use: { 
        ...devices['Desktop Firefox'],
        // Firefox specific settings
        launchOptions: {
          firefoxUserPrefs: {
            'dom.webnotifications.enabled': false,
            'dom.push.enabled': false
          }
        }
      },
    },

    /* Disabled due to missing system libraries
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    */

    /* Test against mobile viewports. */
    {
      name: 'Mobile Chrome',
      use: { 
        ...devices['Pixel 5'],
        launchOptions: {
          args: [
            '--disable-web-security',
            '--no-sandbox'
          ]
        }
      },
    },
    
    /* Disabled due to missing system libraries
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
    */

    /* Disabled - not available on this system
    {
      name: 'Microsoft Edge',
      use: { 
        ...devices['Desktop Edge'],
        channel: 'msedge'
      },
    },
    */
    
    {
      name: 'Google Chrome',
      use: { 
        ...devices['Desktop Chrome'],
        channel: 'chrome',
        launchOptions: {
          args: [
            '--disable-web-security',
            '--no-sandbox'
          ]
        }
      },
    },
  ],

  // Global setup
  globalSetup: require.resolve('./global-setup.js'),
  
  // Global teardown  
  globalTeardown: require.resolve('./global-teardown.js'),

  // Folder for test artifacts such as screenshots, videos, traces, etc.
  outputDir: 'test-artifacts/',

  // Run your local dev server before starting the tests
  webServer: {
    command: 'echo "WordPress should be running on localhost:10013"',
    port: 10013,
    reuseExistingServer: !process.env.CI,
    timeout: 5 * 1000,
  },
}); 