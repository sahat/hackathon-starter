const { test, expect } = require('@playwright/test');

test.describe('GIPHY API', () => {
  test.describe.configure({ mode: 'serial' });
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
