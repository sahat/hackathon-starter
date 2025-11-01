process.env.API_TEST_FILE = 'e2e/foursquare.e2e.test.js';
const { test, expect } = require('@playwright/test');
const { registerTestInManifest, isInManifest } = require('../tools/fixture-helpers');

// Self-register this test in the manifest when recording
registerTestInManifest('e2e/foursquare.e2e.test.js');

// Skip this file during replay if it's not in the manifest
if (process.env.API_MODE === 'replay' && !isInManifest('e2e/foursquare.e2e.test.js')) {
  console.log('[fixtures] skipping e2e/foursquare.e2e.test.js as it is not in manifest for replay mode - 2 tests');
  test.skip(true, 'Not in manifest for replay mode');
}

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
    expect(rowCount).toBe(10);

    // Validate first row structure and formats
    const firstRowCells = rows.first().locator('td');
    await expect(firstRowCells).toHaveCount(5);

    // Icon cell: must have an icon image
    const iconImgCount = await firstRowCells.nth(0).locator('img').count();
    expect(iconImgCount).toBeGreaterThan(0);
    const icon = firstRowCells.nth(0).locator('img');
    await expect(icon).toHaveAttribute('src', /https?:\/\//);
    await expect(icon).toHaveAttribute('alt', /\w+/);
    const w = parseInt(await icon.getAttribute('width'), 10);
    const h = parseInt(await icon.getAttribute('height'), 10);
    expect(w).toBeGreaterThanOrEqual(32);
    expect(w).toBeLessThanOrEqual(64);
    expect(h).toBe(w);

    // Name cell: non-empty
    const venueName = (await firstRowCells.nth(1).textContent()).trim();
    expect(venueName.length).toBeGreaterThan(0);

    // Category cell: non-empty
    const categoryText = (await firstRowCells.nth(2).textContent()).trim();
    expect(categoryText.length).toBeGreaterThan(0);

    // Address cell: non-empty
    const addrText = (await firstRowCells.nth(3).textContent()).trim();
    expect(addrText.length).toBeGreaterThan(0);

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
    expect(longitude).toBeGreaterThan(-122.35);
    expect(longitude).toBeLessThan(-122.33);

    // Extract and validate latitude (allow wiggle room for minor GIS changes)
    const latitudeMatch = detailsText.match(/latitude:\s*([-\d.]+)/i);
    expect(latitudeMatch).toBeTruthy();
    const latitude = parseFloat(latitudeMatch[1]);
    expect(latitude).toBeGreaterThan(47.6);
    expect(latitude).toBeLessThan(47.62);

    // Related venues: check for Pike Place Market with 10+ related venues
    const relatedVenuesPara = sharedPage.locator('p', { hasText: 'Related venues or businesses to' });
    await expect(relatedVenuesPara).toBeVisible();
    const relatedVenuesText = await relatedVenuesPara.textContent();
    expect(relatedVenuesText).toContain('Pike Place Market');

    // Extract the comma-separated list from the next paragraph
    const relatedListPara = relatedVenuesPara.locator('+ p');
    await expect(relatedListPara).toBeVisible();
    const relatedListText = (await relatedListPara.textContent()).trim();
    const relatedVenuesList = relatedListText
      .split(',')
      .map((v) => v.trim())
      .filter((v) => v.length > 0);
    expect(relatedVenuesList.length).toBeGreaterThanOrEqual(10);
  });
});
