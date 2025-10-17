const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

// Increase timeout for GitHub API tests to allow waiting for rate-limit reset which seems to be around 6 minutes
test.setTimeout(6 * 60 * 1000 + 5000); // add extra 5s buffer

async function gotoGithubWithRateLimitRetry(sharedPage, request) {
  await sharedPage.goto('/api/github');
  await sharedPage.waitForLoadState('networkidle');
  const title = await sharedPage.title();
  if (title && !/^Error$/i.test(title)) {
    return;
  }

  const webserverLog = path.resolve(__dirname, '..', '..', 'tmp', 'playwright-webserver.log');
  const recentLog = fs.readFileSync(webserverLog, 'utf8');
  const rateLimitRegex = /HttpError:\s*API rate limit exceeded for .* - https:\/\/docs\.github\.com/i;
  if (!rateLimitRegex.test(recentLog)) {
    throw new Error('GitHub API page rendered Error. See playwrite webserver logs in tmp or workflow artifacts for details.');
  }

  console.log('Github-api.e2e.test: Github API rate-limited. Checking for rate limit reset time.');
  const apiResp = await request.get('https://api.github.com/rate_limit', {
    headers: { Accept: 'application/vnd.github.v3+json', 'User-Agent': 'playwright' },
  });
  const headers = apiResp.headers();
  const resetHeader = headers['x-ratelimit-reset'] || headers['X-RateLimit-Reset'];
  let waitMs = 5000; // min 5s wait
  if (resetHeader) {
    const resetEpoch = parseInt(resetHeader, 10);
    const nowEpoch = Math.floor(Date.now() / 1000);
    const waitSeconds = Math.max(0, resetEpoch - nowEpoch);
    waitMs += waitSeconds * 1000; // add waitSeconds to minimum 5s to have buffer
  }
  console.log(`Retrying in ${waitMs / 1000} seconds`);
  await sharedPage.waitForTimeout(waitMs);
  await sharedPage.goto('/api/github');
  await sharedPage.waitForLoadState('networkidle');
}

test.describe('GitHub API Integration', () => {
  let sharedPage;

  test.beforeAll(async ({ browser }) => {
    sharedPage = await browser.newPage();
    // initial navigation will happen in the helper
  });

  test.afterAll(async () => {
    if (sharedPage) await sharedPage.close();
  });

  test('should launch app, navigate to GitHub API page, and handle API response', async ({ request }) => {
    await gotoGithubWithRateLimitRetry(sharedPage, request);

    // Basic page checks
    await expect(sharedPage).toHaveTitle(/GitHub API/);
    await expect(sharedPage.locator('h2')).toContainText('GitHub API');

    const repoSection = sharedPage.locator('.card.text-white.bg-primary');
    await expect(repoSection).toBeVisible({ timeout: 10000 });
    await expect(sharedPage.locator('.card-header h6')).toContainText('Repository Lookup Example');

    const repoContent = sharedPage.locator('.card-body.text-dark.bg-white');
    await expect(repoContent).toBeVisible();

    const repoLink = sharedPage.locator('a[href*="github.com"]');
    await expect(repoLink.first()).toBeVisible();
  });

  test('should display authentication prompt for unauthenticated users', async ({ request }) => {
    await gotoGithubWithRateLimitRetry(sharedPage, request);

    // Verify warning alert appears
    const alertWarning = sharedPage.locator('.alert.alert-warning');
    await expect(alertWarning).toBeVisible();
    await expect(alertWarning).toContainText(/log in|GitHub account/i);
  });

  test('testing repository lookup example', async ({ request }) => {
    await gotoGithubWithRateLimitRetry(sharedPage, request);
    // Basic page checks
    await expect(sharedPage).toHaveTitle(/GitHub API/);
    await expect(sharedPage.locator('h2')).toContainText('GitHub API');

    await expect(sharedPage.locator('.card-body h4')).toContainText('hackathon-starter');
    await expect(sharedPage.locator('li.list-inline-item', { hasText: 'Stars:' })).toContainText(/\d{4,}/); // at least 4 digits
    await expect(sharedPage.locator('li.list-inline-item', { hasText: 'Forks:' })).toContainText(/\d{3,}/); // at least 3 digits
    await expect(sharedPage.locator('li.list-inline-item', { hasText: 'Watchers:' })).toContainText(/\d{4,}/); // at least 4 digits
    await expect(sharedPage.locator('li.list-inline-item', { hasText: 'Open Issues:' })).toContainText(/\d+/); // at least 1 digit
    await expect(sharedPage.locator('li.list-inline-item', { hasText: 'License:' })).toContainText(/MIT/i);
    await expect(sharedPage.locator('li.list-inline-item', { hasText: 'Visibility:' })).toContainText(/public/i);
  });
});
