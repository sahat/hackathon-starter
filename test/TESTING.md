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

The end-to-end tests are built around various integrations. Depending on your application, you may want to replace them with tests that apply to your implementation. You don't need to run or update the E2E tests during the hackathon. However, if you decide to further develop your idea with your team after the event, the E2E tests can help you avoid breaking existing functionality every time you modify your application or build a new feature. With Playwright, test automation uses its own web browser to browse various views in your application, interact with them, and check for expected results. You can use the existing tests as templates for developing your own Playwright tests. Hackathon Starter's test helper tools enable you to run E2E tests against live APIs, or record and replay API responses for more predictable results or in environments that you can't access live APIs.

## Test Organization

```
test/
├── fixtures/                    # Recorded nock JSON fixtures, one per
│                                 # (sanitized) outbound URL + body.
│                                 # Re-loaded by nock on webserver startup
│                                 # in replay mode.
├── tools/                       # Test utilities
│   ├── nock-server-fixtures.js  # Server-side nock record/replay installer
│   ├── playwright-start-and-log.js
│   ├── simple-link-image-check.js
│   └── start-with-memory-db.js  # Webserver starter; runs the nock installer
├── e2e/                         # Tests that exercise real third-party APIs
│   ├── chart.e2e.test.js
│   ├── foursquare.e2e.test.js
│   ├── giphy.e2e.test.js
│   ├── google-maps.e2e.test.js
│   ├── here-maps.e2e.test.js
│   ├── llm-classifier.e2e.test.js
│   ├── lob.e2e.test.js
│   ├── nyt.e2e.test.js
│   ├── rag.e2e.test.js
│   ├── trakt.e2e.test.js
│   └── twilio.e2e.test.js
├── e2e-nokey/                   # Same as e2e/, but matched only by the
│                                 # chromium-nokey-* Playwright projects
│   ├── github-api.e2e.test.js
│   ├── lastfm.e2e.test.js
│   ├── pubchem.e2e.test.js
│   ├── scraping.e2e.test.js
│   ├── theme.e2e.test.js
│   ├── upload.e2e.test.js
│   └── wikipedia.e2e.test.js
├── app.test.js                  # Basic app structure tests - core unit test
├── app-links.test.js            # Link validation tests
├── cacheBust.test.js            # Cache-busting tests
├── contact.test.js              # Contact form tests
├── flash.test.js                # Flash message tests
├── models.test.js               # Database model tests
├── morgan.test.js               # Morgan logger tests
├── nodemailer.test.js           # Email tests
├── passport.test.js             # Auth & middleware tests
├── session.test.js              # Session model tests
├── token-revocation.test.js     # Token revocation tests
├── user.test.js                 # User controller tests
├── webauthn.test.js             # WebAuthn controller tests
└── playwright.config.js         # Playwright configuration
```

### Test Categories

1. **`test/e2e/`** and **`test/e2e-nokey/`** - Integration tests that exercise external HTTP APIs. The `chromium-record` and `chromium-replay` Playwright projects run these tests against nock fixtures; the `chromium` / `chromium-nokey-live` projects run them against live APIs.
2. **Core Unit Tests** - Individual component tests (models, config, middleware). Run with `npm run test`.

## Fixture System

The fixture system lets e2e tests run deterministically against recorded HTTP responses instead of hitting live APIs. It is implemented in `test/tools/nock-server-fixtures.js` and installed by `test/tools/start-with-memory-db.js` after the Express app loads.

### How It Works

The installer hooks into the webserver process (not the test process) via [nock 15](https://github.com/nock/nock). The recorder runs in the long-lived webserver; interceptors persist across the entire Playwright run.

- **Record mode** (`API_MODE=record`, set by `--project=chromium-record`): the nock recorder is started in the webserver; real HTTP calls are made by the controllers; for every captured call, `saveRecordedRequest()` is called. It redacts the captured request (see "Sensitive data scrubbing" below) and writes a per-URL JSON file to `test/fixtures/`. The recorded `path` is also replaced with a 12-character sha256 hash, so long URLs won't exceed file-system length limits, embedded IDs won't leak into the fixture filename or content, **and the same logical URL hashes to the same value regardless of which secret values are in `process.env` at record time** (so a recording made locally with real keys matches a replay in CI that has placeholders).
- **Replay mode** (`API_MODE=replay`, set by `--project=chromium-replay`): nock disables all outbound HTTP except to `127.0.0.1`/`localhost`; every `.json` file under `test/fixtures/` is loaded as a persistent nock scope by `loadFixtureScopes()`. Each scope also gets `filteringPath(rewritePathForFixture)` applied — this replaces any occurrence of a known secret value in the LIVE request path with `REDACTED` and then sha256-hashes it, so a live `https://api.example.com/v1/users/12345?...&apikey=REAL_KEY` request matches a fixture whose stored path is `/${12-char-hash}`. A `logMissingFixtures()` listener prints a single `[nock] MISSING FIXTURE for GET <url>` line for any unmatched request, naming the predicted fixture filename and the re-record command.
- **Live mode** (no `API_MODE`): the installer is a no-op. Controllers make real HTTP calls.

The webserver is started once per test run by Playwright (see `webServer.command` in `playwright.config.js`) and the nock install is `await`ed after the Express app loads (so any `fetch` calls `app.js` makes during initialization are not seen by nock).

### When a fixture is missing

If a controller makes a request for a URL that has no recorded fixture, the webserver log will contain a block like:

```
[nock] MISSING FIXTURE for GET https://api.example.com/v1/things
      Expected: test/fixtures/GET_https%3A%2F%2Fapi.example.com%2Fv1%2Fthings.json
      Re-record: npm run test:e2e:custom -- --project=chromium-record
```

The first line names the URL, the second names the file you need, the third tells you how to generate it. Each distinct missing URL produces exactly one block in the log, so a run with N missing fixtures produces N blocks (not one block repeated N times). The block is printed by the webserver's `console.error`, so it shows up in the test output alongside the failing tests.

The test that triggered the miss will fail with a regular assertion error (e.g. `element not visible`) because the page didn't render. The companion error in the webserver log is a single-line `Label: Nock: Disallowed net connect for <url>` (no stack trace). To find the matching MISSING FIXTURE block, search the log for the URL from that line.

### Sensitive data scrubbing

The fixtures are safe to commit. The recorder redacts the whole captured request before writing it to disk — two passes plus a path rewrite:

- **Field-name redaction** (`redactByField()`). Walks the request recursively, replacing the value of any field whose name is in the `SENSITIVE_FIELDS` set with the literal string `REDACTED`
- **Value scrubbing** (`@zapier/secret-scrubber`). Catches actual values based on environment values listed in `.env.example` plus any names listed in `INCLUDE_ENV_VAR`.
  For value scrubbing the list skips `.env.example` keys and values that are listed in `IGNORE_ENV_EXAMPLE_KEYS` and `IGNORE_ENV_EXAMPLE_VALUES`. If your tests are breaking because non-secrets from `.env.example` are being redacted, add those keys or values to these two ignore lists.
- **Path rewrite** (`rewritePathForFixture()`). The recorded `path` is replaced with a 12-character sha256 hash. Before hashing, every occurrence of any known secret value in the path string is replaced with `REDACTED`. This is a plain string replace-and-hash, not URL-aware — query parameters in the path are not parsed or redacted by name. The hash is stable across environments that have different real values for the same secret field — a recording made with `apikey=REAL_KEY` matches a replay with `apikey=PLACEHOLDER`.

In short, add additional values to the following in `nock-server-fixtures.js` based on your project's needs:

- `SENSITIVE_FIELDS`
- `INCLUDE_ENV_VAR`
- `IGNORE_ENV_EXAMPLE_KEYS`
- `IGNORE_ENV_EXAMPLE_VALUES`

## Running E2E Tests

Use one script with project selection:

```bash
npm run test:e2e:live                                   # All E2E tests with live API calls
npm run test:e2e:replay                                 # All E2E tests using recorded fixtures
npm run test:e2e:custom -- --project=chromium-record        # All E2E tests with recording (writes fixtures)
npm run test:e2e:custom -- --project=chromium-nokey-live    # Only the no-key tests (live)
npm run test:e2e:custom -- --project=chromium-nokey-replay  # Only the no-key tests (replay)
```

### Run a Single E2E Test File

```bash
# Live mode
npx playwright test test/e2e/.../testfile.e2e.test.js --config=test/playwright.config.js --project=chromium

# Replay mode
npx playwright test test/e2e/.../testfile.e2e.test.js --config=test/playwright.config.js --project=chromium-replay

# Record mode (overwrites the file's fixtures)
npx playwright test test/e2e/.../testfile.e2e.test.js --config=test/playwright.config.js --project=chromium-record
```

## Creating New Tests

1. Create the test file in `test/e2e/` or `test/e2e-nokey/`.
2. If the test makes HTTP calls, run it once in record mode with valid API keys to capture the fixture:
   ```bash
   npx playwright test test/e2e/my-api.e2e.test.js --config=test/playwright.config.js --project=chromium-record
   ```
3. Commit the new `.json` files under `test/fixtures/`.
4. Verify the test passes in replay mode:
   ```bash
   npx playwright test test/e2e/my-api.e2e.test.js --config=test/playwright.config.js --project=chromium-replay
   ```
5. Confirm it still works in live mode (no API_MODE):
   ```bash
   npx playwright test test/e2e/my-api.e2e.test.js --config=test/playwright.config.js --project=chromium
   ```

### Notes

- `workers: 1` is forced whenever `API_MODE` is set so the shared webserver's nock state is not contended across parallel test files.
- A test file that makes no outbound HTTP (e.g. `theme.e2e.test.js`, `upload.e2e.test.js`) works in all three modes; no fixture is needed.

## Troubleshooting

- **Test fails in replay mode**: see [When a fixture is missing](#when-a-fixture-is-missing) above.
- **Empty `test/fixtures/` after record**: check the webserver log for any errors thrown from the fixture writer. The most common cause is a controller calling a URL the filename function can't parse (e.g. a relative URL passed where a full URL is expected). Verify the controller's outbound URL and that the recording ran in an environment with valid API keys.
- **First request after install is "Nock: No match" but the same fixture works for the second call**: this is the symptom of nock scopes being consumed on first use; every replay scope is marked with `persist()` so a long-lived webserver can replay the same fixture across many calls. If you see this, the persist call has been removed — restore it.
- **Tests time out in replay**: the webserver is on `localhost:8080`; if your environment has `BASE_URL` pointing elsewhere (e.g. `https://sedna.ydftech.com`), Playwright will try to navigate to that URL and the browser will fail to reach the webserver. The `.env.test` file's `BASE_URL=http://localhost:8080` is the intended value for tests; the playwright config loads it via `process.loadEnvFile` and respects any pre-set value.
