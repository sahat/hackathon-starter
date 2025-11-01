const { defineConfig, devices } = require('@playwright/test');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
// Preserve any MONGODB_URI that was set before loading dotenv, since it is set to the memory server starter
const originalMongoUri = process.env.MONGODB_URI;
const result = dotenv.config({ path: path.resolve(__dirname, '.env.test'), quiet: true });
// If MONGODB_URI was not set by the outer environment (originalMongoUri undefined)
// but exists in the parsed dotenv, remove it so the memory-server starter can create a DB.
if (!originalMongoUri && result && result.parsed && result.parsed.MONGODB_URI) {
  delete process.env.MONGODB_URI;
}

// Detect if a replay or record project is being run
const isReplay = process.argv.some((arg) => arg === '--project=chromium-replay' || arg === '--project=chromium-nokey-replay');
if (isReplay) {
  process.env.API_MODE = 'replay';
  process.env.API_STRICT_REPLAY = '1';
}
const isRecord = process.argv.some((arg) => arg === '--project=chromium-record' || arg === '--project=chromium-nokey-record');
if (isRecord) {
  process.env.API_MODE = 'record';
}

const webServerEnv = {
  ...process.env,
  SESSION_SECRET: process.env.SESSION_SECRET || 'test_session_secret',
  RATE_LIMIT_GLOBAL: '500',
  RATE_LIMIT_STRICT: '20',
  RATE_LIMIT_LOGIN: '50',
};

// Create `tmp` dir in case if it doesn't exist yet
// so `tee ../tmp/playwright-webserver.log` doesn't fail
try {
  const tmpRoot = path.resolve(__dirname, '..', 'tmp');
  if (!fs.existsSync(tmpRoot)) {
    fs.mkdirSync(tmpRoot);
  }
} catch (e) {
  console.error('[playwright.config] Failed to create tmp directory:', e && e.message);
}

module.exports = defineConfig({
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.API_MODE === 'record' ? 1 : process.env.CI ? 1 : 2,
  outputDir: '../tmp/playwright-artifacts',
  reporter: [['html', { outputFolder: '../tmp/playwright-report', open: 'never' }]],
  use: {
    baseURL: process.env.BASE_URL,
    trace: 'on-first-retry',
    // headless: false, launchOptions: { slowMo: 200 }, // Uncomment to see the browser
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      testMatch: ['e2e/*.e2e.test.js', 'e2e-nokey/*.e2e.test.js'],
    },
    {
      name: 'chromium-record',
      use: { ...devices['Desktop Chrome'] },
      testMatch: ['e2e/*.e2e.test.js', 'e2e-nokey/*.e2e.test.js'],
    },
    {
      name: 'chromium-replay',
      use: { ...devices['Desktop Chrome'] },
      testMatch: ['e2e/*.e2e.test.js', 'e2e-nokey/*.e2e.test.js'],
    },
    {
      name: 'chromium-nokey-live',
      use: { ...devices['Desktop Chrome'] },
      testMatch: ['e2e-nokey/*.e2e.test.js'],
    },
    {
      name: 'chromium-nokey-record',
      use: { ...devices['Desktop Chrome'] },
      testMatch: ['e2e-nokey/*.e2e.test.js'],
    },
    {
      name: 'chromium-nokey-replay',
      use: { ...devices['Desktop Chrome'] },
      testMatch: ['e2e-nokey/*.e2e.test.js'],
    },
  ],
  webServer: {
    command: 'node ./tools/playwright-start-and-log.js',
    url: 'http://127.0.0.1:8080',
    reuseExistingServer: !process.env.CI,
    env: webServerEnv,
  },
});
