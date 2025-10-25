const { test, expect } = require('@playwright/test');

test.describe('Foursquare Places API Integration', () => {
  let sharedPage;

  test.beforeAll(async ({ browser }) => {
    sharedPage = await browser.newPage();
    await sharedPage.goto('/api/foursquare');
    await sharedPage.waitForLoadState('networkidle');
  });

  test.afterAll(async () => {
    if (sharedPage) await sharedPage.close();
  });

  test('should load page and show primary UI elements', async () => {
    // Document title and main header
    await expect(sharedPage).toHaveTitle(/Foursquare/i);
    await expect(sharedPage.locator('h2')).toContainText('Foursquare API');

    // Top action buttons
    const devInfo = sharedPage.locator('a.btn', { hasText: 'Developer Info' });
    const apiDocs = sharedPage.locator('a.btn', { hasText: 'API Docs' });
    await expect(devInfo).toBeVisible();
    await expect(devInfo).toHaveAttribute('href', 'https://foursquare.com/developer');
    await expect(apiDocs).toBeVisible();
    await expect(apiDocs).toHaveAttribute('href', 'https://docs.foursquare.com/');

    // Ensure no error alert is displayed when a valid key is configured
    await expect(sharedPage.locator('.alert.alert-danger')).toHaveCount(0);
  });

  test('should render Trending Venues table with data', async () => {
    // Section header and hint text
    await expect(sharedPage.locator('h3.text-primary', { hasText: 'Trending Venues' })).toBeVisible();
    await expect(sharedPage.locator('p', { hasText: 'Near longitude' })).toBeVisible();

    // Table basics
    const table = sharedPage.locator('table.table.table-striped.table-bordered');
    await expect(table).toBeVisible();

    const headers = table.locator('thead th');
    await expect(headers).toHaveCount(5);
    await expect(headers.nth(1)).toContainText('Name');
    await expect(headers.nth(2)).toContainText('Category');
    await expect(headers.nth(3)).toContainText('Address');
    await expect(headers.nth(4)).toContainText('Distance');

    // At least one result row
    const rows = table.locator('tbody tr');
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThan(0);

    // Validate first row structure and formats
    const firstRowCells = rows.first().locator('td');
    await expect(firstRowCells).toHaveCount(5);

    // Icon cell: either an <img> category icon or literal "N/A"
    const iconImgCount = await firstRowCells.nth(0).locator('img').count();
    if (iconImgCount > 0) {
      const icon = firstRowCells.nth(0).locator('img');
      await expect(icon).toHaveAttribute('src', /https?:\/\//);
      await expect(icon).toHaveAttribute('alt', /\w+/);
      const w = await icon.getAttribute('width');
      const h = await icon.getAttribute('height');
      expect(['32', '36', '40', '48', '64']).toContain(w); // size can vary in future; allow a few common values
      expect(h).toBe(w);
    } else {
      const text = (await firstRowCells.nth(0).textContent()).trim();
      expect(text).toBe('N/A');
    }

    // Name cell: non-empty
    const venueName = (await firstRowCells.nth(1).textContent()).trim();
    expect(venueName.length).toBeGreaterThan(0);

    // Category cell: either non-empty string or 'N/A'
    const categoryText = (await firstRowCells.nth(2).textContent()).trim();
    expect(categoryText.length > 0 || categoryText === 'N/A').toBeTruthy();

    // Address cell: string (may be 'N/A' depending on data)
    const addrText = (await firstRowCells.nth(3).textContent()).trim();
    expect(addrText.length > 0).toBeTruthy();

    // Distance cell: numeric
    const distanceText = (await firstRowCells.nth(4).textContent()).trim();
    expect(distanceText).toMatch(/^\d+$/);
  });

  test('should render Venue Details with name, category, and coordinates', async () => {
    // Section header
    await expect(sharedPage.locator('h3.text-primary', { hasText: 'Venue Details' })).toBeVisible();

    // The details paragraph contains <i><u>name</u></i>, optional category, and location + lat/long
    const detailsPara = sharedPage.locator('h3.text-primary:has-text("Venue Details") + p');
    await expect(detailsPara).toBeVisible();

    // Name element
    const nameElement = detailsPara.locator('i u');
    await expect(nameElement).toBeVisible();
    const detailName = (await nameElement.textContent()).trim();
    expect(detailName.length).toBeGreaterThan(0);

    // Should include the phrases that come from API-driven template
    const detailsText = (await detailsPara.textContent()).toLowerCase();
    expect(detailsText).toContain('located at');
    expect(detailsText).toContain('longitude');
    expect(detailsText).toContain('latitude');

    // If category phrase is present, it should read like: "is a <Category>"
    if (detailsText.includes(' is a ')) {
      const hasIsAPhrase = /\bis a\b/.test(detailsText);
      expect(hasIsAPhrase).toBe(true);
    }
  });
});
