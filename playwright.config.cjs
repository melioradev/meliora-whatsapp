const {defineConfig} = require('@playwright/test');
module.exports = defineConfig({
  testDir: './tests', testMatch: '**/*.spec.cjs', fullyParallel: true,
  forbidOnly: !!process.env.CI, retries: process.env.CI ? 1 : 0, workers: process.env.CI ? 2 : undefined,
  timeout: 30000, reporter: 'list', outputDir: 'test-results',
  use: {baseURL: 'http://127.0.0.1:8794', viewport: {width: 1280, height: 900}, timezoneId: 'Asia/Jerusalem', screenshot: 'only-on-failure', trace: 'retain-on-failure'},
  projects: [
    {name: 'chromium', use: {browserName: 'chromium'}},
    {name: 'firefox', use: {browserName: 'firefox'}},
    {name: 'webkit', use: {browserName: 'webkit'}},
  ],
  webServer: {command: 'node tests/server.mjs', url: 'http://127.0.0.1:8794/', reuseExistingServer: !process.env.CI},
});
