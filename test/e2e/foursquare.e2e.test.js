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

    // Should have 10 result rows (API limit for busy Downtown Seattle location)
    const rows = table.locator('tbody tr');
    const rowCount = await rows.count();
    expect(rowCount).toBe(10); // Changed: expect exactly 10 results from busy tourist location

    // Validate first row structure and formats
    const firstRowCells = rows.first().locator('td');
    await expect(firstRowCells).toHaveCount(5);

    // Icon cell: either an <img> category icon or literal "N/A"
    const iconImgCount = await firstRowCells.nth(0).locator('img').count();
    expect(iconImgCount).toBeGreaterThan(0); // Changed: fail test if no icon present
    const icon = firstRowCells.nth(0).locator('img');
    await expect(icon).toHaveAttribute('src', /https?:\/\//);
    await expect(icon).toHaveAttribute('alt', /\w+/);
    const w = parseInt(await icon.getAttribute('width'), 10);
    const h = parseInt(await icon.getAttribute('height'), 10);
    expect(w).toBeGreaterThanOrEqual(32); // Changed: check boundaries >= 32
    expect(w).toBeLessThanOrEqual(64); // Changed: check boundaries <= 64
    expect(h).toBe(w);

    // Name cell: non-empty
    const venueName = (await firstRowCells.nth(1).textContent()).trim();
    expect(venueName.length).toBeGreaterThan(0); // Changed: fail if empty (hardcoded location should always return results)

    // Category cell: either non-empty string or 'N/A'
    const categoryText = (await firstRowCells.nth(2).textContent()).trim();
    expect(categoryText.length).toBeGreaterThan(0); // Changed: fail if empty (hardcoded location should always return results)

    // Address cell: string (may be 'N/A' depending on data)
    const addrText = (await firstRowCells.nth(3).textContent()).trim();
    expect(addrText.length).toBeGreaterThan(0); // Changed: fail if empty (hardcoded location should always return results)

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

    // Check expected hardcoded values from Downtown Seattle location (ll=47.609657,-122.342148)
    const detailsText = await detailsPara.textContent();

    // Extract and validate longitude (allow wiggle room for minor GIS changes)
    const longitudeMatch = detailsText.match(/longitude:\s*([-\d.]+)/i);
    expect(longitudeMatch).toBeTruthy();
    const longitude = parseFloat(longitudeMatch[1]);
    expect(longitude).toBeGreaterThan(-122.35); // Changed: check expected longitude value
    expect(longitude).toBeLessThan(-122.33); // Changed: check expected longitude value

    // Extract and validate latitude (allow wiggle room for minor GIS changes)
    const latitudeMatch = detailsText.match(/latitude:\s*([-\d.]+)/i);
    expect(latitudeMatch).toBeTruthy();
    const latitude = parseFloat(latitudeMatch[1]);
    expect(latitude).toBeGreaterThan(47.6); // Changed: check expected latitude value
    expect(latitude).toBeLessThan(47.62); // Changed: check expected latitude value

    // Related venues: check for Pike Place Market with 10+ related venues
    const relatedVenuesPara = sharedPage.locator('p', { hasText: 'Related venues or businesses to' });
    await expect(relatedVenuesPara).toBeVisible();
    const relatedVenuesText = await relatedVenuesPara.textContent();
    expect(relatedVenuesText).toContain('Pike Place Market'); // Changed: verify expected venue name

    // Extract the comma-separated list from the next paragraph
    const relatedListPara = relatedVenuesPara.locator('+ p');
    await expect(relatedListPara).toBeVisible();
    const relatedListText = (await relatedListPara.textContent()).trim();
    const relatedVenuesList = relatedListText
      .split(',')
      .map((v) => v.trim())
      .filter((v) => v.length > 0);
    expect(relatedVenuesList.length).toBeGreaterThanOrEqual(10); // Changed: expect 10+ related venues from Pike Place Market
  });
});
