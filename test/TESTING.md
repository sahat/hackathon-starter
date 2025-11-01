# Testing Guide

This document describes the test organization, fixture system, and how to create and run new tests in the hackathon-starter project.

## Table of Contents

- [Overview](#overview)
- [Test Organization](#test-organization)
- [Fixture System](#fixture-system)
- [Running Tests](#running-tests)
- [Creating New Tests](#creating-new-tests)
- [Troubleshooting](#troubleshooting)

## Overview

Hackathon Starter comes with core unit tests that focus on essential functionality, as well as end-to-end (E2E) tests using [Playwright](https://playwright.dev/) for various integrations.

The purpose of the core unit tests is to verify core features like user management and security features. You usually don't need to worry about these during hackathons, but it's a good idea to keep them to ensure your customizations don't break core functions.

The end-to-end tests are built around various integrations. Depending on your application, you may want to replace them with tests that apply to your implementation. You don't need to run or update the E2E tests during the hackathon. However, if you decide to further develop your idea with your team after the event, the E2E tests can help you avoid breaking existing functionality every time you modify your application or build a new feature. With Playwright, test automation uses its own web browser to browse various views in your application, interact with them, and check for expected results. You can use the existing tests as templates for developing your own Playwright tests. Hackathon Starter's current test helper tools enable you to run E2E tests against live APIs, or record and replay API responses for more predictable results or in environments that you can't access live APIs.

## Test Organization

```
test/
├── fixtures/                    # Fixtures are recorded API responses
│   └── fixture_manifest.json    # Registry of recorded tests
├── tools/                       # Test utilities and fixtures
│   ├── fixture-helpers.js       # Shared fixture utilities
│   ├── server-fetch-fixtures.js # Intercepts server-side fetch() calls
│   ├── server-axios-fixtures.js # Intercepts server-side axios calls
│   ├── playwright-start-and-log.js
│   ├── simple-link-image-check.js
│   └── start-with-memory-db.js  # Test server with in-memory MongoDB
├── e2e/                         # Tests requiring API keys
│   ├── chart.e2e.test.js
│   ├── foursquare.e2e.test.js
│   ├── google-maps.e2e.test.js
│   ├── here-maps.e2e.test.js
│   ├── lob.e2e.test.js
│   ├── nyt.e2e.test.js
│   ├── openai-moderation.e2e.test.js
│   ├── togetherai-classifier.e2e.test.js
│   ├── trakt.e2e.test.js
│   └── twilio.e2e.test.js
├── e2e-nokey/                   # Tests that work without API keys
│   ├── github-api.e2e.test.js
│   ├── lastfm.e2e.test.js
│   ├── pubchem.e2e.test.js
│   ├── rag.e2e.test.js
│   ├── scraping.e2e.test.js
│   ├── upload.e2e.test.js
│   └── wikipedia.e2e.test.js
├── app.test.js                  # Basic app structure tests - core unit test
├── app-links.test.js            # Link validation tests - utility to identify broken links
├── contact.test.js              # Contact form tests - core unit test
├── flash.test.js                # Flash message tests - core unit test
├── models.test.js               # Database model tests - core unit test
├── morgan.test.js               # Morgan logger tests - core unit test
├── nodemailer.test.js           # Email tests - core unit test
├── passport.test.js             # Auth tests - core unit test
└── playwright.config.js         # Playwright configuration
```

### Test Categories

1. **`test/e2e/`** - Integration tests that require API keys
   - These tests call third-party APIs (Foursquare, Twilio, OpenAI, etc.)
   - Can run in record mode (with keys) or replay mode (with fixtures)
2. **`test/e2e-nokey/`** - Integration or partial Integration tests that don't need API keys
   - Public APIs (GitHub, Wikipedia, PubChem) or local features (upload, RAG)
   - Can run without any configuration in replay mode

3. **Core Unit Tests** - Individual component tests (models, config, middleware)

## Running E2E Tests

Use one script with project selection:

```bash
npm run test:e2e:live                                   # All E2E tests with live API calls
npm run test:e2e:replay                                 # All E2E tests with previously recorded API responses
npm run test:custom -- --project=chromium-record        # E2E with recording API calls (record fixtures)
npm run test:custom -- --project=chromium-nokey-live    # Only E2E tests that don't require API keys (live)
npm run test:custom -- --project=chromium-nokey-replay  # Only E2E tests that don't require API keys (replay fixtures)
npm run test:custom -- --project=chromium-nokey-record  # Only E2E tests that don't require API keys (record fixtures)
```

### Run a Single E2E Test File

```bash
# Run tests in a single test file against live APIs
npx playwright test test/e2e.../testfile.e2e.test.js --config=test/playwright.config.js --project=chromium

# Run tests in a single test file while replaying recorded API responses from the fixtures
npx playwright test test/e2e.../testfile.e2e.test.js --config=test/playwright.config.js --project=chromium-replay

# Run tests in a single test file against live APIs and capture the API responses as fixtures for replay later
npx playwright test test/e2e.../testfile.e2e.test.js --config=test/playwright.config.js --project=chromium-record
```

## Fixture System

The fixture system allows tests to record API responses once and replay them deterministically. This eliminates the need for API keys in CI/CD and makes tests faster and more reliable.

### How It Works

#### Server-Side Interception

The E2E test framework in hackathon-starter is currently only for server-side API calls, not browser-side. The fixture system intercepts server-side HTTP libraries:

1. **`server-fetch-fixtures.js`** - Monkey-patches `globalThis.fetch()`
2. **`server-axios-fixtures.js`** - Uses axios interceptors

Both are installed in `start-with-memory-db.js` for Playwright tests before the Express app loads for testing.

#### Limitations and unsupported transports

Record/replay supports only server-side `fetch()` and `axios` calls. Node's built-in (legacy) `http`/`https` modules, or browser-side API calls are currently not supported.

#### Recording Mode (API_MODE=record)

When recording, the system:

1. Lets API calls execute normally
2. Captures responses
3. Saves them to `test/fixtures/` with sanitized filenames (removes tokens and API keys by keyword matching)
4. Registers the test in `fixture_manifest.json` so the replay mode can check for missing fixtures

**Fixture filenames** are generated by `keyFor()` in `fixture-helpers.js`:

- URL is sanitized (sensitive query params like `apikey`, `token` are stripped by keyword matching)
- For POST requests, a body hash is appended for uniqueness
- Example filename: `GET_api.openweathermap.org_data_2.5_weather_q=Seattle.json`

#### Replay Mode (API_MODE=replay)

When replaying, the system:

1. Intercepts API calls before they hit the network
2. Returns saved fixture data instead
3. Falls back to real network if fixture is missing (unless `API_STRICT_REPLAY=1`)

#### Strict Replay Mode (API_STRICT_REPLAY=1)

With strict mode enabled:

- Any request without a fixture is blocked with an error
- Ensures tests never accidentally hit live APIs
- Useful in CI/CD or to verify all fixtures exist

### Fixture Helpers

**`test/tools/fixture-helpers.js`** provides shared utilities:

- **`registerTestInManifest(testFile)`** - Self-registers test during record mode
- **`isInManifest(testFile)`** - Checks if test is in manifest (for replay skip logic)
- **`hashBody(body)`** - Creates SHA1 hash of request body for fixture keys
- **`keyFor(method, url, body)`** - Generates sanitized fixture filename

## Creating New Tests

1. **Create the test file** in `test/e2e/` or `test/e2e-nokey/`
2. **Add fixture boilerplate** (if applicable - see existing tests for examples)
3. **Write your test assertions**
4. **Test and finalize your test against live APIs**

```bash
npx playwright test test/e2e/my-api.e2e.test.js --config=test/playwright.config.js --project=chromium
```

5. **Record fixtures** (first time only):

```bash
npx playwright test test/e2e/my-api.e2e.test.js --config=test/playwright.config.js --project=chromium-record
```

6. **Verify replay works**:

```bash
npx playwright test test/e2e/my-api.e2e.test.js --config=test/playwright.config.js --project=chromium-replay
```

### 3. Important Patterns

#### API_TEST_FILE Environment Variable

Always set this at the top of your test file if you are setting up Playwright tests that are going to have record and replay:

```javascript
process.env.API_TEST_FILE = 'e2e/my-api.e2e.test.js';
```

This tells the fixture system which test is currently running for fixture tracking.

#### Self-Registration Pattern

Tests self-register in the manifest during record mode:

```javascript
registerTestInManifest('e2e/my-api.e2e.test.js');
```

This enables you to let tests skip automatically when their fixtures haven't been recorded yet.

#### Skip Logic for Replay Mode

Skip tests that don't have fixtures recorded:

```javascript
if (process.env.API_MODE === 'replay' && !isInManifest('e2e/my-api.e2e.test.js')) {
  console.log('[fixtures] skipping e2e/my-api.e2e.test.js - not in manifest - [number of tests in the file] tests');
  test.skip(true, 'Not in manifest for replay mode');
}
```

#### Shared Page Pattern

Use `beforeAll` with a shared page for better performance:

```javascript
let sharedPage;

test.beforeAll(async ({ browser }) => {
  sharedPage = await browser.newPage();
  await sharedPage.goto('/api/my-api');
  await sharedPage.waitForLoadState('networkidle');
});

test.afterAll(async () => {
  if (sharedPage) await sharedPage.close();
});
```

### 4. Tests Without Fixtures

For tests that don't need fixtures (unit tests, local features):

```javascript
const { test, expect } = require('@playwright/test');

test.describe('My Feature', () => {
  test('should work correctly', async ({ page }) => {
    await page.goto('/my-feature');
    // Add assertions
  });
});
```

No fixture boilerplate needed.

### 5. Skipping Tests in Record/Replay Mode

Some tests (like Google Maps, HERE Maps) don't work well with fixtures and should skip entirely during record or replay modes:

```javascript
if (process.env.API_MODE === 'replay' || process.env.API_MODE === 'record') {
  console.log('[fixtures] skipping my-test.e2e.test.js in record/replay mode');
  test.skip(true, 'Skipping in record/replay mode');
}
```

## Best Practices

1. **Always use fixtures for API tests** - Faster, more reliable, works in CI/CD
2. **Record with --workers=1** - Prevents race conditions and incomplete fixtures
3. **Self-register tests** - Use `registerTestInManifest()` pattern for automatic skipping
4. **Share pages when possible** - Use `beforeAll` with a shared page for performance and to reduce the chances of getting rate-limited by APIs
5. **Use descriptive test names** - Makes debugging easier
6. **Test one thing at a time** - Easier to understand failures
7. **Clean up after tests** - Close pages, delete temp files
8. **Use strict replay in CI** - Catch missing fixtures early
9. **Keep fixtures committed** - Other developers can run tests immediately
10. **Document API-specific quirks** - Add comments for unusual API behavior
