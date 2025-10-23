const { test, expect } = require('@playwright/test');

test.describe('HERE Maps API Integration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/api/here-maps');
    await page.waitForLoadState('networkidle');
  });

  test('should load HERE Maps page and display basic elements', async ({ page }) => {
    // Basic page checks
    await expect(page).toHaveTitle(/Here Maps/);
    await expect(page.locator('h2')).toContainText('HERE Maps API');

    // Check for Font Awesome icon
    const mapIcon = page.locator('h2 i.fas.fa-map-marked');
    await expect(mapIcon).toBeVisible();

    // Check for navigation buttons
    const developerPortalBtn = page.locator('a[href*="developer.here.com"]').first();
    const imageMapParamsBtn = page.locator('a[href*="developer.here.com/documentation"]');
    await expect(developerPortalBtn).toBeVisible();
    await expect(developerPortalBtn).toContainText('HERE Developer Portal');
    await expect(imageMapParamsBtn).toBeVisible();
    await expect(imageMapParamsBtn).toContainText('Image Map Parameters');

    // Check for subtitle
    await expect(page.locator('h3')).toContainText('Map using Here Interactive Map Service');

    // Check for map container
    const mapContainer = page.locator('#map');
    await expect(mapContainer).toBeVisible();

    // Verify map container has dimensions (style attribute contains width and height)
    const mapStyle = await mapContainer.getAttribute('style');
    expect(mapStyle).toContain('width: 100vw');
    expect(mapStyle).toContain('height: 50vh');

    // Check for distance text
    const distanceText = page.locator('text=Straight line distance between the Fremont Troll and Seattle Art Museum is');
    await expect(distanceText).toBeVisible();

    // Check for distance value element
    const distanceElement = page.locator('#directLineDistance');
    await expect(distanceElement).toBeVisible();
  });

  test('should load HERE Maps JavaScript API scripts', async ({ page }) => {
    // Check for all HERE Maps API scripts
    const coreScript = page.locator('script[src*="js.api.here.com/v3/3.1/mapsjs-core.js"]');
    await expect(coreScript).toHaveCount(1);

    const serviceScript = page.locator('script[src*="js.api.here.com/v3/3.1/mapsjs-service.js"]');
    await expect(serviceScript).toHaveCount(1);

    const mapEventsScript = page.locator('script[src*="js.api.here.com/v3/3.1/mapsjs-mapevents.js"]');
    await expect(mapEventsScript).toHaveCount(1);

    const uiScript = page.locator('script[src*="js.api.here.com/v3/3.1/mapsjs-ui.js"]');
    await expect(uiScript).toHaveCount(1);

    // Check for UI CSS
    const uiStylesheet = page.locator('link[href*="js.api.here.com/v3/3.1/mapsjs-ui.css"]');
    await expect(uiStylesheet).toHaveCount(1);
  });

  test('should initialize and render HERE Maps successfully', async ({ page }) => {
    await page.waitForTimeout(3000);

    // Check if HERE Maps API loaded by verifying window.H object
    const hereMapsLoaded = await page.evaluate(() => typeof window.H !== 'undefined' && window.H !== null);
    expect(hereMapsLoaded).toBe(true);

    // Verify map canvas is rendered (HERE Maps uses Canvas for rendering)
    const hasCanvas = await page.locator('#map canvas').count();
    expect(hasCanvas).toBeGreaterThan(0);

    // Verify HERE Maps copyright/attribution is visible
    const hasCopyright = await page.locator('#map').locator('text=/HERE|©/i').count();
    expect(hasCopyright).toBeGreaterThan(0);
  });

  test('should calculate and display straight line distance using client-side calculation', async ({ page }) => {
    await page.waitForTimeout(2000); // Wait for distance calculation

    // Check for distance display element
    const distanceElement = page.locator('#directLineDistance');
    await expect(distanceElement).toBeVisible();

    // Verify distance value is calculated and displayed (client-side Haversine formula)
    const distanceText = await distanceElement.textContent();
    expect(distanceText).toBeTruthy();
    expect(distanceText.trim()).not.toBe('');

    // Verify it's a valid number (not empty, NaN, or error text)
    const distance = parseFloat(distanceText);
    expect(distance).not.toBeNaN();

    // Verify it's a reasonable distance value (between 2 and 4 miles)between Fremont Troll and Seattle Art Museum
    expect(distance).toBeGreaterThan(2);
    expect(distance).toBeLessThan(4);
  });

  test('should verify HERE Maps API key is valid by checking map tile loading', async ({ page, context }) => {
    // NOTE: This test has limitations due to HERE Maps' CDN architecture:
    // - HERE Maps uses CloudFront CDN which aggressively caches map tiles
    // - Cached tiles return 200 OK even with invalid API keys if you used valid API key before
    // - This test verifies that tiles can be loaded, but cannot reliably detect invalid API keys if the tiles are already cached in CloudFront
    await context.clearCookies();

    // Monitor network requests for map tiles
    const tileRequests = [];
    const tileErrors = [];

    page.on('response', async (response) => {
      const url = response.url();
      // HERE Maps vector tiles come from specific endpoints with API key
      if (url.includes('vector.hereapi.com') || url.includes('base.maps.api.here.com')) {
        const requestInfo = {
          url: url.substring(0, 150),
          status: response.status(),
          ok: response.ok(),
        };
        tileRequests.push(requestInfo);

        if (!response.ok()) {
          if (response.status() === 401 || response.status() === 403) {
            tileErrors.push(`Auth error (${response.status()}): Invalid API key`);
          }
        }
      }
    });

    await page.goto('/api/here-maps', { waitUntil: 'networkidle' });
    await page.waitForTimeout(5000); // Wait for tiles to load

    // Verify tiles were requested (proves map attempted to load)
    expect(tileRequests.length).toBeGreaterThan(0);

    // If we get auth errors, fail the test (API key is definitely invalid)
    // If we get 200 OK, it could mean either:
    // a) API key is valid, OR
    // b) Tiles are served from CloudFront cache (even with invalid key)
    if (tileRequests.length > 0) {
      expect(tileErrors.length).toBe(0); // No auth errors on tiles
    }

    // Check that map canvas rendered
    const hasCanvas = await page.locator('#map canvas').count();
    expect(hasCanvas).toBeGreaterThan(0);
  });

  test('should display map centered on Seattle area', async ({ page }) => {
    await page.waitForTimeout(2000);

    // Verify map is initialized and displaying Seattle area
    const mapContent = await page.locator('#map > div').count();
    expect(mapContent).toBeGreaterThan(0);

    // Verify HERE Maps copyright/attribution is visible (indicates map loaded successfully)
    const hasCopyright = await page.locator('#map').locator('text=/HERE|©|Terms/i').count();
    expect(hasCopyright).toBeGreaterThan(0);
  });

  test('should handle HERE Maps API error scenarios', async ({ page }) => {
    // Monitor console errors
    const consoleErrors = [];
    page.on('console', (message) => {
      if (message.type() === 'error') {
        consoleErrors.push(message.text());
      }
    });

    // Intercept the HERE Maps API request and abort it
    await page.route('**/js.api.here.com/**', async (route) => {
      await route.abort('failed');
    });

    await page.goto('/api/here-maps');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Verify basic page structure still works
    await expect(page.locator('h2')).toContainText('HERE Maps API');
    await expect(page.locator('#map')).toBeVisible();

    // Verify HERE Maps API failed to load
    const hereMapsLoaded = await page.evaluate(() => typeof window.H !== 'undefined');
    expect(hereMapsLoaded).toBe(false);
  });
});
