const { test, expect } = require('@playwright/test');

// Skip this suite entirely when running in record/replay fixture mode.
// We intentionally do not use browser-side record/replay for HERE Maps.
if (process.env.API_MODE === 'replay' || process.env.API_MODE === 'record') {
  console.log('[fixtures] skipping here-maps.e2e.test.js in record/replay mode (browser-side fixtures disabled) - 3 tests');
  test.skip(true, 'Skipping HERE Maps tests in record/replay mode (browser-side fixtures disabled)');
}

test.describe('HERE Maps API Integration', () => {
  let sharedPage;
  const tileRequests = [];

  test.beforeAll(async ({ browser }) => {
    sharedPage = await browser.newPage();

    // Set up tile request monitoring BEFORE page loads
    sharedPage.on('response', async (response) => {
      const url = response.url();
      if (url.includes('vector.hereapi.com') || url.includes('base.maps.api.here.com')) {
        tileRequests.push({
          status: response.status(),
          ok: response.ok(),
        });
      }
    });

    await sharedPage.goto('/api/here-maps');
    await sharedPage.waitForLoadState('networkidle');
  });

  test.afterAll(async () => {
    if (sharedPage) await sharedPage.close();
  });

  test('should initialize and render HERE Maps successfully', async () => {
    await sharedPage.waitForTimeout(3000);

    // Check if HERE Maps API loaded by verifying window.H object
    const hereMapsLoaded = await sharedPage.evaluate(() => typeof window.H !== 'undefined' && window.H !== null);
    expect(hereMapsLoaded).toBe(true);

    // Verify map canvas is rendered (HERE Maps uses Canvas for rendering)
    const hasCanvas = await sharedPage.locator('#map canvas').count();
    expect(hasCanvas).toBeGreaterThan(0);

    // Verify HERE Maps copyright/attribution is visible
    const hasCopyright = await sharedPage.locator('#map').locator('text=/HERE|©/i').count();
    expect(hasCopyright).toBeGreaterThan(0);
  });

  test('should calculate and display straight line distance using client-side calculation', async () => {
    // Check for distance display element
    const distanceElement = sharedPage.locator('#directLineDistance');
    await expect(distanceElement).toBeVisible();

    // Verify distance value is calculated and displayed (client-side Haversine formula)
    const distanceText = await distanceElement.textContent();
    const distance = parseFloat(distanceText);
    expect(distance).toBe(2.85);
  });

  test('should successfully load HERE Maps tiles', async () => {
    // Tiles should have been loaded during beforeAll
    expect(tileRequests.length).toBeGreaterThan(0);
    const successfulTiles = tileRequests.filter((req) => req.ok);
    expect(successfulTiles.length).toBeGreaterThan(0);

    const hasCanvas = await sharedPage.locator('#map canvas').count();
    expect(hasCanvas).toBeGreaterThan(0);
  });
});
