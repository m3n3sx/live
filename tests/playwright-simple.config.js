// @ts-check
const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './playwright',
  
  // Brak global setup/teardown
  // globalSetup: undefined,
  // globalTeardown: undefined,
  
  // Zwiększone timeouts
  timeout: 90 * 1000,
  expect: {
    timeout: 15 * 1000,
  },
  
  // Retry na wypadek problemów
  retries: 1,
  
  // Jeden worker dla stabilności
  workers: 1,
  
  // Reporter
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report' }]
  ],
  
  use: {
    // Base URL
    baseURL: 'http://localhost:10013',
    
    // Browser options
    headless: false, // Domyślnie headed
    viewport: { width: 1280, height: 720 },
    
    // Trace on failure
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    
    // Timeouts
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },
  
  projects: [
    {
      name: 'chromium',
      use: { channel: 'chrome' },
    },
  ],
}); 