const { test, expect } = require('@playwright/test');

test.describe('Tenor API', () => {
  let sharedPage;

  test.beforeAll(async ({ browser }) => {
    sharedPage = await browser.newPage();
    await sharedPage.goto('/api/tenor');
    await sharedPage.waitForLoadState('networkidle');
  });

  test.afterAll(async () => {
    if (sharedPage) await sharedPage.close();
  });

  test('should launch app and show Tenor API page', async () => {
    await expect(sharedPage).toHaveTitle(/Tenor API/);
    await expect(sharedPage.locator('h2')).toContainText('Tenor API');
  });

  test('should display Tenor help links', async () => {
    await expect(sharedPage.locator('.btn-group a[href*="tenor/guides/quickstart"]')).toBeVisible();
    await expect(sharedPage.locator('.btn-group a[href*="console.developers.google.com/apis/dashboard"]')).toBeVisible();
  });

  test('should display search form', async () => {
    await expect(sharedPage.locator('form[method="GET"][action="/api/tenor"]')).toBeVisible();
    await expect(sharedPage.locator('input[name="search"]')).toBeVisible();
    await expect(sharedPage.locator('button[type="submit"]')).toBeVisible();
  });

  test('should show results or a no-results warning', async () => {
    const resultsCard = sharedPage.locator('.card.text-white.bg-success');

    if ((await resultsCard.count()) > 0) {
      // If results are returned, ensure there are GIF cards with images
      await expect(resultsCard).toBeVisible();
      const images = resultsCard.locator('img.card-img-top');
      const imageCount = await images.count();
      expect(imageCount).toBeGreaterThan(0);
      // Check first image has src
      const src = await images.first().getAttribute('src');
      expect(src).toBeTruthy();
    } else {
      // Otherwise the page should render a no-results alert
      const alert = sharedPage.locator('.alert.alert-warning');
      await expect(alert).toBeVisible();
      await expect(alert).toContainText('No GIFs found');
    }
  });
});
