const { test, expect } = require('@playwright/test');

test.describe('New York Times API Integration', () => {
  let sharedPage;

  test.beforeAll(async ({ browser }) => {
    sharedPage = await browser.newPage();
    await sharedPage.goto('/api/nyt');
    await sharedPage.waitForLoadState('networkidle');
  });

  test.afterAll(async () => {
    if (sharedPage) await sharedPage.close();
  });

  test('should render basic page content', async () => {
    // Basic page checks
    await expect(sharedPage).toHaveTitle(/New York Times API/);
    await expect(sharedPage.locator('h2')).toContainText('New York Times API');
    // Locate the main table and verify header columns
    const bestSellersTable = sharedPage.locator('table.table');
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
  });

  test('should display the details for the Rank 1 best seller', async () => {
    const bestSellersTable = sharedPage.locator('table.table');
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
