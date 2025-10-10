const { test, expect } = require('@playwright/test');

test.describe('New York Times API Integration', () => {
  test('should launch app, navigate to NYT API page, and display best sellers list or error message', async ({ page }) => {
    // Navigate to the NYT API page
    await page.goto('/api/nyt');
    await page.waitForLoadState('networkidle');

    // Check the page title
    const pageTitle = await page.title();

    const isError = pageTitle.includes('Error') || (await page.locator('body').textContent()).includes('Error:');

    if (isError) {
      // Verify error handling works
      console.log('NYT API call failed - testing error handling');
      await expect(page).toHaveTitle(/Error/);
      await expect(page.locator('body')).toContainText(/Error|NYT API/i);
      test.skip();
    } else {
      // Verify normal content rendering
      console.log('NYT API call succeeded - testing content display');

      // Basic page checks
      await expect(page).toHaveTitle(/New York Times API/);
      await expect(page.locator('h2')).toContainText('New York Times API');
      // Locate the main table and verify header columns
      const bestSellersTable = page.locator('table.table');
      await expect(bestSellersTable).toBeVisible();

      //Check the content of the file
      const tableHeaders = bestSellersTable.locator('thead th');
      await expect(tableHeaders).toHaveCount(5);
      await expect(tableHeaders.nth(0)).toContainText('Rank');
      await expect(tableHeaders.nth(1)).toContainText('Title');
      await expect(tableHeaders.nth(2)).toContainText('Description');
      await expect(tableHeaders.nth(3)).toContainText('Author');
      await expect(tableHeaders.nth(4)).toContainText('ISBN-13');

      // Verify there is at least one row of data
      const tableRows = bestSellersTable.locator('tbody tr');
      expect(await tableRows.count()).toBeGreaterThan(0);
    }
  });

  test('should display the details for the Rank 1 best seller', async ({ page }) => {
    await page.goto('/api/nyt');
    await page.waitForLoadState('networkidle');

    // Check for error page title again to skip the test if the API failed
    const pageTitle = await page.title();
    if (pageTitle.includes('Error')) {
      console.log('NYT API call failed - skipping detailed content check.');
      test.skip();
      return;
    }
    const bestSellersTable = page.locator('table.table');
    await expect(bestSellersTable).toBeVisible();

    // Locate the first row's data cells (td)
    const firstRowCells = bestSellersTable.locator('tbody tr').nth(0).locator('td');

    // Verify Rank
    await expect(firstRowCells.nth(0)).toContainText('1');
    const currentRank1Title = (await firstRowCells.nth(1).textContent()).trim();
    await expect(firstRowCells.nth(1)).toContainText(currentRank1Title);
    expect(currentRank1Title.length).toBeGreaterThan(5);
    await expect(firstRowCells.nth(3)).toContainText(/\w+/);
    await expect(firstRowCells.nth(4)).toContainText(/978\d{9,}/);
  });
});
