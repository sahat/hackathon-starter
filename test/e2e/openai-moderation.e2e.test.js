process.env.API_TEST_FILE = 'e2e/openai-moderation.e2e.test.js';
const { test, expect } = require('@playwright/test');
const { registerTestInManifest, isInManifest } = require('../tools/fixture-helpers');

// Self-register this test in the manifest when recording
registerTestInManifest('e2e/openai-moderation.e2e.test.js');

// Skip this file during replay if it's not in the manifest
if (process.env.API_MODE === 'replay' && !isInManifest('e2e/openai-moderation.e2e.test.js')) {
  console.log('[fixtures] skipping e2e/openai-moderation.e2e.test.js as it is not in manifest for replay mode - 2 tests');
  test.skip(true, 'Not in manifest for replay mode');
}

test.describe('OpenAI Moderation API Integration', () => {
  test('should flag harmful content and display all moderation data', async ({ page }) => {
    await page.goto('/ai/openai-moderation');
    await page.waitForLoadState('networkidle');

    // Enter text that should be flagged as harmful (violent content)
    const harmfulText = 'I want to kill and hurt people violently.';
    await page.fill('textarea#inputText', harmfulText);
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');

    // Verify all moderation data elements
    await expect(page.locator('textarea#inputText')).toHaveValue(harmfulText);
    await expect(page.locator('h4')).toContainText('Moderation Result');
    await expect(page.locator('.alert.alert-warning')).toContainText('flagged as harmful');
    await expect(page.locator('h5')).toContainText('Category Scores');
    await expect(page.locator('.badge.rounded-pill').first()).toBeVisible();
    await expect(page.locator('h6')).toContainText('Flagged Categories');
    await expect(page.locator('li.text-danger').first()).toBeVisible();
  });

  test('should not flag safe content and show all category data', async ({ page }) => {
    await page.goto('/ai/openai-moderation');
    await page.waitForLoadState('networkidle');

    // Enter safe, harmless text
    const safeText = 'I love reading books and learning new things. The weather is beautiful today.';
    await page.fill('textarea#inputText', safeText);
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');

    // Verify all moderation data elements
    await expect(page.locator('textarea#inputText')).toHaveValue(safeText);
    await expect(page.locator('h4')).toContainText('Moderation Result');
    await expect(page.locator('.alert.alert-success')).toContainText('not flagged');
    await expect(page.locator('h5')).toContainText('Category Scores');
    await expect(page.locator('.badge.rounded-pill').first()).toBeVisible();
    await expect(page.locator('h6')).toContainText('Flagged Categories');
    await expect(page.locator('p.text-success')).toContainText('No categories were flagged');
  });
});
