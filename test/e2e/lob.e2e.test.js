const { test, expect } = require('@playwright/test');

/**
 * Helper function to navigate to Lob API page and check for errors
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @throws {Error} If API key is not configured
 */
async function navigateToLobPage(page) {
  await page.goto('/api/lob');
  await page.waitForLoadState('networkidle');

  // Detect if API returned an error (missing API key, etc.)
  const errorElement = page.locator('.alert.alert-danger');
  const isError = (await errorElement.count()) > 0;

  if (isError) {
    // Fail the test if API key is missing
    const errorText = await errorElement.textContent();
    throw new Error(`Lob API key is not configured. Test failed to ensure CI notices missing configuration. Error: ${errorText}`);
  }
}

test.describe('Lob API Integration', () => {
  test.describe.configure({ mode: 'serial' });
  test('should validate ZIP code API response format', async ({ page }) => {
    await navigateToLobPage(page);

    // Check for valid ZIP code pattern (5 digits)
    await expect(page.locator('h3').filter({ hasText: 'Details of zip code:' })).toContainText(/Details of zip code: \d{5}/);

    // Verify ZIP ID format (should be alphanumeric)
    const idText = await page.locator('p').filter({ hasText: 'ID:' }).textContent();
    expect(idText).toMatch(/ID: [a-zA-Z0-9_-]+/);

    // Verify ZIP Code Type format
    const zipTypeText = await page.locator('p').filter({ hasText: 'Zip Code Type:' }).textContent();
    expect(zipTypeText).toMatch(/Zip Code Type: \w+/);

    // Verify cities table has proper data structure
    const table = page.locator('table.table.table-striped.table-bordered');
    await expect(table).toBeVisible();

    // Verify table has data rows with proper structure
    const dataRows = table.locator('tbody tr');
    const rowCount = await dataRows.count();
    expect(rowCount).toBeGreaterThan(0);

    // Verify each row has 5 cells (City, State, County, County Fips, Preferred)
    const firstRow = dataRows.first();
    await expect(firstRow.locator('td')).toHaveCount(5);

    // Validate data formats in first row
    const firstRowCells = firstRow.locator('td');
    const cityText = await firstRowCells.nth(0).textContent();
    const stateText = await firstRowCells.nth(1).textContent();
    const countyFipsText = await firstRowCells.nth(3).textContent();
    const preferredText = await firstRowCells.nth(4).textContent();

    // City should be non-empty string
    expect(cityText.trim()).toBeTruthy();
    // State should be 2-letter code
    expect(stateText).toMatch(/^[A-Z]{2}$/);
    // County FIPS should be numeric
    expect(countyFipsText).toMatch(/^\d+$/);
    // Preferred should be true/false
    expect(preferredText).toMatch(/^(true|false)$/);
  });

  test('should validate USPS Letter API response format', async ({ page }) => {
    await navigateToLobPage(page);

    // Verify letter ID format (should be alphanumeric with specific pattern)
    const letterIdText = await page.locator('text=Letter ID:').textContent();
    expect(letterIdText).toMatch(/Letter ID: [a-zA-Z0-9_-]+/);

    // Verify mail type format
    const mailTypeText = await page.locator('text=Will be mailed using:').textContent();
    expect(mailTypeText).toMatch(/Will be mailed using: [a-zA-Z\s-]+/);

    // Verify delivery date format (should be a valid date)
    const deliveryDateText = await page.locator('text=With expected delivery date of:').textContent();
    expect(deliveryDateText).toMatch(/With expected delivery date of: \d{4}-\d{2}-\d{2}/);
  });

  test('should validate PDF generation and file properties', async ({ page }) => {
    await navigateToLobPage(page);

    // Verify PDF URL format and validate PDF file
    const pdfObject = page.locator('#pdfviewer object');
    // Wait for PDF viewer to become visible (Lob has a 3-second delay for PDF generation)
    await expect(pdfObject).toBeVisible({ timeout: 10000 });
    const pdfUrl = await pdfObject.getAttribute('data');
    expect(pdfUrl).toBeTruthy();
    expect(pdfUrl).toMatch(/^https?:\/\/.+\.pdf/);

    // Fetch and validate the PDF file
    const response = await page.request.get(pdfUrl);
    expect(response.status()).toBe(200);

    const contentType = response.headers()['content-type'];
    expect(contentType).toBe('application/pdf');

    const pdfBuffer = await response.body();
    const fileSize = pdfBuffer.length;

    // PDF smoke tests
    expect(fileSize).toBeGreaterThan(0);
    expect(fileSize).toBeLessThan(10000000); // Less than ~10MB

    // Check PDF header and footer
    const pdfString = pdfBuffer.toString('binary');
    expect(pdfString.indexOf('%PDF')).toBe(0); // PDF should start with %PDF
    expect(pdfString.lastIndexOf('%%EOF')).toBeGreaterThan(pdfString.length - 10); // EOF should be near the end
  });
});
