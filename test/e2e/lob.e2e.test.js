const { test, expect } = require('@playwright/test');

test.describe('Lob API Integration', () => {
  test('should launch app, navigate to Lob page, and handle API response', async ({ page }) => {
    // Navigate to Lob API page
    await page.goto('/api/lob');
    await page.waitForLoadState('networkidle');

    // Basic page checks
    await expect(page).toHaveTitle(/Lob/);
    await expect(page.locator('h2')).toContainText('Lob API');

    // Detect if API returned an error (missing API key, etc.)
    const errorElement = page.locator('.alert.alert-danger');
    const isError = (await errorElement.count()) > 0;

    if (isError) {
      // Verify error handling works
      console.log('Lob API key not configured - testing error handling');
      await expect(errorElement).toContainText(/API key|not set/i);
    } else {
      // Verify normal content rendering
      console.log('Lob API key is configured - testing content display');

      // Verify all API data elements are present and contain expected data
      await test.step('Verify ZIP code details section', async () => {
        await expect(page.locator('h3').filter({ hasText: 'Details of zip code:' })).toContainText('Details of zip code:');
        // Check for any valid ZIP code pattern (5 digits)
        await expect(page.locator('h3').filter({ hasText: 'Details of zip code:' })).toContainText(/Details of zip code: \d{5}/);

        // Verify ZIP details data
        await expect(page.locator('p').filter({ hasText: 'ID:' })).toContainText('ID:');
        await expect(page.locator('p').filter({ hasText: 'Zip Code Type:' })).toContainText('Zip Code Type:');

        // Verify the table with city data
        await expect(page.locator('table.table.table-striped.table-bordered')).toBeVisible();
        await expect(page.locator('thead th')).toHaveCount(5);
        await expect(page.locator('thead th').nth(0)).toContainText('City');
        await expect(page.locator('thead th').nth(1)).toContainText('State');
        await expect(page.locator('thead th').nth(2)).toContainText('County');
        await expect(page.locator('thead th').nth(3)).toContainText('County Fips');
        await expect(page.locator('thead th').nth(4)).toContainText('Preferred');

        // Verify table has data rows
        const tableRows = page.locator('tbody tr');
        const rowCount = await tableRows.count();
        expect(rowCount).toBeGreaterThan(0);
      });

      await test.step('Verify USPS Letter section', async () => {
        await expect(page.locator('h3').filter({ hasText: 'First-Class Mail (USPS)' })).toContainText('First-Class Mail (USPS)');

        // Verify letter details
        await expect(page.locator('text=Letter ID:')).toBeVisible();
        await expect(page.locator('text=Will be mailed using:')).toBeVisible();
        await expect(page.locator('text=With expected delivery date of:')).toBeVisible();

        // Verify PDF viewer element exists (even if hidden initially)
        await expect(page.locator('#pdfviewer')).toBeAttached();
        await expect(page.locator('#pdfviewer object')).toBeAttached();
      });
    }

    // Common elements on the page (always present)
    await test.step('Verify navigation buttons', async () => {
      await expect(page.locator('.btn-group a[href*="lob.com/docs"]')).toBeVisible();
      await expect(page.locator('.btn-group a[href*="github.com/lob/lob-node"]')).toBeVisible();
      await expect(page.locator('.btn-group a[href*="dashboard.lob.com/register"]')).toBeVisible();

      await expect(page.locator('text=/API Documentation/i')).toBeVisible();
      await expect(page.locator('text=/Lob Node Docs/i')).toBeVisible();
      await expect(page.locator('text=/Create API Account/i')).toBeVisible();
    });
  });

  test('should display all ZIP code data elements correctly', async ({ page }) => {
    await page.goto('/api/lob');
    await page.waitForLoadState('networkidle');

    // Skip if there's an error (no API key)
    const errorElement = page.locator('.alert.alert-danger');
    const isError = (await errorElement.count()) > 0;

    if (isError) {
      console.log('Skipping ZIP code data test - API key not configured');
      return;
    }

    await test.step('Verify ZIP code information display', async () => {
      // Check that ZIP code is displayed in the heading with any valid 5-digit ZIP
      const zipHeading = page.locator('h3').filter({ hasText: 'Details of zip code:' });
      console.log('ZIP Heading Text:', await zipHeading.textContent());
      await expect(zipHeading).toContainText(/Details of zip code: \d{5}/);

      // Verify the note about test API key
      await expect(page.locator('p').filter({ hasText: "Note that Lob.com's test API key" })).toContainText("Note that Lob.com's test API key does not perform any verification");
      await expect(page.locator('a[href*="lob.com/docs#us-verification-test-environment"]')).toBeVisible();

      // Verify ID and Zip Code Type are displayed
      const paragraphs = page.locator('p');
      await expect(paragraphs.filter({ hasText: 'ID:' })).toBeVisible();
      await expect(paragraphs.filter({ hasText: 'Zip Code Type:' })).toBeVisible();
    });

    await test.step('Verify cities table structure and data', async () => {
      const table = page.locator('table.table.table-striped.table-bordered');
      await expect(table).toBeVisible();

      // Verify all column headers
      const headers = table.locator('thead th');
      await expect(headers).toHaveCount(5);
      await expect(headers.nth(0)).toHaveText('City');
      await expect(headers.nth(1)).toHaveText('State');
      await expect(headers.nth(2)).toHaveText('County');
      await expect(headers.nth(3)).toHaveText('County Fips');
      await expect(headers.nth(4)).toHaveText('Preferred');

      // Verify table has data rows
      const dataRows = table.locator('tbody tr');
      const rowCount = await dataRows.count();
      expect(rowCount).toBeGreaterThan(0);

      // Verify each row has 5 cells
      const firstRow = dataRows.first();
      await expect(firstRow.locator('td')).toHaveCount(5);
    });
  });

  test('should display all USPS letter data elements correctly', async ({ page }) => {
    await page.goto('/api/lob');
    await page.waitForLoadState('networkidle');

    // Skip if there's an error (no API key)
    const errorElement = page.locator('.alert.alert-danger');
    const isError = (await errorElement.count()) > 0;

    if (isError) {
      console.log('Skipping USPS letter data test - API key not configured');
      return;
    }

    await test.step('Verify USPS letter information display', async () => {
      // Check section heading
      await expect(page.locator('h3').filter({ hasText: 'First-Class Mail (USPS)' })).toContainText('First-Class Mail (USPS)');

      // Verify all letter details are displayed
      await expect(page.locator('text=Letter ID:')).toBeVisible();
      await expect(page.locator('text=Will be mailed using:')).toBeVisible();
      await expect(page.locator('text=With expected delivery date of:')).toBeVisible();

      // Verify the letter ID contains actual data (not empty)
      const letterIdText = await page.locator('text=Letter ID:').textContent();
      expect(letterIdText).toMatch(/Letter ID: \w+/);

      // Verify mail type contains actual data
      const mailTypeText = await page.locator('text=Will be mailed using:').textContent();
      expect(mailTypeText).toMatch(/Will be mailed using: \w+/);

      // Verify delivery date contains actual data
      const deliveryDateText = await page.locator('text=With expected delivery date of:').textContent();
      expect(deliveryDateText).toMatch(/With expected delivery date of: .+/);
    });

    await test.step('Verify PDF viewer setup', async () => {
      // Verify PDF viewer container exists
      const pdfViewer = page.locator('#pdfviewer');
      await expect(pdfViewer).toBeAttached();

      // Verify PDF object element exists with correct attributes
      const pdfObject = pdfViewer.locator('object');
      await expect(pdfObject).toBeAttached();
      await expect(pdfObject).toHaveAttribute('width', '600');
      await expect(pdfObject).toHaveAttribute('height', '850');
      await expect(pdfObject).toHaveAttribute('type', 'application/pdf');

      // Verify the PDF object has a data attribute (URL)
      const dataAttr = await pdfObject.getAttribute('data');
      expect(dataAttr).toBeTruthy();
      expect(dataAttr).toMatch(/^https?:\/\/.+\.pdf/); // Allow query parameters
    });

    await test.step('Verify PDF viewer becomes visible after delay', async () => {
      // Initially the PDF viewer should be hidden
      await expect(page.locator('#pdfviewer')).toHaveCSS('display', 'none');

      // Wait for the 3-second delay and check if it becomes visible
      await page.waitForTimeout(3500); // Wait a bit longer than the 3-second delay
      await expect(page.locator('#pdfviewer')).not.toHaveCSS('display', 'none');
    });
  });

  test('should have all external links working correctly', async ({ page }) => {
    await page.goto('/api/lob');
    await page.waitForLoadState('networkidle');

    await test.step('Verify all external links are present and have correct attributes', async () => {
      // API Documentation link
      const apiDocsLink = page.locator('a[href="https://lob.com/docs"]');
      await expect(apiDocsLink).toBeVisible();
      await expect(apiDocsLink).toHaveAttribute('target', '_blank');
      await expect(apiDocsLink).toContainText('API Documentation');

      // Lob Node Docs link
      const nodeDocsLink = page.locator('a[href="https://github.com/lob/lob-node"]');
      await expect(nodeDocsLink).toBeVisible();
      await expect(nodeDocsLink).toHaveAttribute('target', '_blank');
      await expect(nodeDocsLink).toContainText('Lob Node Docs');

      // Create API Account link
      const createAccountLink = page.locator('a[href="https://dashboard.lob.com/register"]');
      await expect(createAccountLink).toBeVisible();
      await expect(createAccountLink).toHaveAttribute('target', '_blank');
      await expect(createAccountLink).toContainText('Create API Account');

      // Test environment documentation link
      const testEnvLink = page.locator('a[href="https://lob.com/docs#us-verification-test-environment"]');
      await expect(testEnvLink).toBeVisible();
      await expect(testEnvLink).toHaveAttribute('target', '_blank');
    });
  });
});
