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

// TEST ENV OVERRIDES
// Put any environment variables here that must be forced for e2e runs.
// This ensures the Playwright runner and the spawned webServer see the same values.
const TEST_ENV_OVERRIDES = {
  BASE_URL: 'http://127.0.0.1:8080',
  SESSION_SECRET: process.env.SESSION_SECRET || 'test_session_secret',
};

Object.entries(TEST_ENV_OVERRIDES).forEach(([k, v]) => {
  process.env[k] = v;
});

module.exports = defineConfig({
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 2,
  outputDir: '../tmp/playwright-artifacts',
  reporter: [['html', { outputFolder: '../tmp/playwright-report', open: 'never' }]],
  use: {
    baseURL: process.env.BASE_URL,
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
    url: process.env.BASE_URL,
    reuseExistingServer: !process.env.CI,
    env: { ...process.env, ...TEST_ENV_OVERRIDES },
  },
});
