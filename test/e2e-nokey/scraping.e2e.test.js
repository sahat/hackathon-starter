const { test, expect } = require('@playwright/test');

test.describe('Web Scraping Integration', () => {
  test('should display scraped Hacker News links with proper page structure', async ({ page }) => {
    await page.goto('/api/scraping');
    await page.waitForLoadState('networkidle');

    // Verify page basics
    await expect(page).toHaveTitle(/Web Scraping/);
    await expect(page.locator('h2')).toContainText('Web Scraping');
    await expect(page.locator('h3')).toContainText('Hacker News Frontpage');

    // Verify table exists with headers
    const table = page.locator('table.table.table-condensed');
    await expect(table).toBeVisible();
    await expect(page.locator('thead tr th').nth(0)).toContainText('№');
    await expect(page.locator('thead tr th').nth(1)).toContainText('Title');

    // Verify scraped data
    const tableRows = page.locator('tbody tr');
    const rowCount = await tableRows.count();
    expect(rowCount).toBeGreaterThan(25); // usually the list is ~30
  });
});
