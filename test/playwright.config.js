const { defineConfig, devices } = require('@playwright/test');
const dotenv = require('dotenv');
const path = require('path');
// Preserve any MONGODB_URI that was set before loading dotenv, since it is set to the memory server starter
const originalMongoUri = process.env.MONGODB_URI;
const result = dotenv.config({ path: path.resolve(__dirname, '.env.test') });
// If MONGODB_URI was not set by the outer environment (originalMongoUri undefined)
// but exists in the parsed dotenv, remove it so the memory-server starter can create a DB.
if (!originalMongoUri && result && result.parsed && result.parsed.MONGODB_URI) {
  delete process.env.MONGODB_URI;
}

module.exports = defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  outputDir: '../tmp/playwright-artifacts',
  reporter: [['html', { outputFolder: '../tmp/playwright-report', open: 'never' }]],
  use: {
    baseURL: 'http://localhost:8080',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'node ./helpers/start-with-memory-db.js',
    url: 'http://localhost:8080',
    reuseExistingServer: !process.env.CI,
    env: { ...process.env },
  },
});
