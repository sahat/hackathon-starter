process.env.API_TEST_FILE = 'e2e/giphy.e2e.test.js';
const { test, expect } = require('@playwright/test');
const { registerTestInManifest, isInManifest } = require('../tools/fixture-helpers');

// Self-register this test in the manifest when recording
registerTestInManifest('e2e/giphy.e2e.test.js');

// Skip this file during replay if it's not in the manifest
if (process.env.API_MODE === 'replay' && !isInManifest('e2e/giphy.e2e.test.js')) {
  console.log('[fixtures] skipping e2e/giphy.e2e.test.js as it is not in manifest for replay mode - 2 tests');
  test.skip(true, 'Not in manifest for replay mode');
}

test.describe('GIPHY API', () => {
  let sharedPage;

  test.beforeAll(async ({ browser }) => {
    sharedPage = await browser.newPage();
    await sharedPage.goto('/api/giphy');
    await sharedPage.waitForLoadState('networkidle');
  });

  test.afterAll(async () => {
    if (sharedPage) await sharedPage.close();
  });

  test('should show results on a fresh page load', async () => {
    const resultsCard = sharedPage.locator('.card.text-white.bg-success');
    await expect(resultsCard).toBeVisible();
    const images = resultsCard.locator('img.card-img-top');
    const imageCount = await images.count();
    expect(imageCount).toBeGreaterThan(10);
    const src = await images.first().getAttribute('src');
    expect(src).toBeTruthy();
  });

  test('should return search results for submissions', async () => {
    await sharedPage.fill('input[name="search"]', 'funny cat');
    await sharedPage.click('button[type="submit"]');
    await sharedPage.waitForLoadState('networkidle');

    const resultsCard = sharedPage.locator('.card.text-white.bg-success');
    await expect(resultsCard).toBeVisible();
    const images = resultsCard.locator('img.card-img-top');
    const imageCount = await images.count();
    expect(imageCount).toBeGreaterThan(10);
    const src = await images.first().getAttribute('src');
    expect(src).toBeTruthy();
  });
});
