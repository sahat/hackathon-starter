const { test, expect } = require('@playwright/test');

test.describe('Google Maps API Integration', () => {
  test('should load Google Maps page and display map elements', async ({ page }) => {
    // Navigate to Google Maps API page
    await page.goto('/api/google-maps');
    await page.waitForLoadState('networkidle');

    // Basic page checks
    await expect(page).toHaveTitle(/Google Maps/);
    await expect(page.locator('h2')).toContainText('Google Maps JavaScript API');

    // Check for navigation buttons
    const gettingStartedBtn = page.locator('a[href*="developers.google.com/maps"]');
    const apiConsoleBtn = page.locator('a[href*="console.developers.google.com"]');
    await expect(gettingStartedBtn).toBeVisible();
    await expect(gettingStartedBtn).toContainText('Getting Started');
    await expect(apiConsoleBtn).toBeVisible();
    await expect(apiConsoleBtn).toContainText('API Console');

    // Check for map container
    const mapContainer = page.locator('#map');
    await expect(mapContainer).toBeVisible();
    await expect(mapContainer).toHaveCSS('height', '500px');

    // Check for description text (complete sentence) - use more specific selector
    await expect(page.locator('p').first()).toContainText('This example uses custom markers with Font Awesome icons, a custom map control (Center Map), and restricted navigation boundaries.');
  });

  test('should load Google Maps JavaScript API script', async ({ page }) => {
    await page.goto('/api/google-maps');
    await page.waitForLoadState('networkidle');

    // Check for the main Google Maps API script (with key parameter)
    const mainMapsScript = page.locator('script[src*="maps.googleapis.com/maps/api/js"][src*="key="]');
    await expect(mainMapsScript).toHaveCount(1);

    // Verify the main script has required parameters
    const scriptSrc = await mainMapsScript.getAttribute('src');
    expect(scriptSrc).toContain('key=');
    expect(scriptSrc).toContain('libraries=marker');
    expect(scriptSrc).toContain('loading=async');

    // Check for polyfill script
    const polyfillScript = page.locator('script[src*="polyfill.io"]');
    await expect(polyfillScript).toHaveCount(1);
  });

  test('should initialize map and custom elements', async ({ page }) => {
    await page.goto('/api/google-maps');
    await page.waitForTimeout(5000); // Allow more time for map initialization

    // Check if Google Maps API loaded by looking for map tiles
    const mapTileImages = await page.locator('#map img[src*="googleapis.com/maps/vt"]').count();
    expect(mapTileImages).toBeGreaterThan(0);

    // Verify map container is properly sized and positioned
    const mapContainer = page.locator('#map');
    await expect(mapContainer).toBeVisible();
    await expect(mapContainer).toHaveCSS('height', '500px');
  });

  test('should handle Google Maps API error scenarios comprehensively', async ({ page }) => {
    // Monitor console errors
    const consoleErrors = [];
    page.on('console', (message) => {
      if (message.type() === 'error') {
        consoleErrors.push(message.text());
      }
    });

    // Intercept the Google Maps API request and use invalid API key
    await page.route('**/maps.googleapis.com/maps/api/js**', async (route) => {
      const url = new URL(route.request().url());
      url.searchParams.set('key', 'INVALID_API_KEY_FOR_TESTING');
      await route.continue({ url: url.toString() });
    });

    await page.goto('/api/google-maps');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000);

    // Verify basic page structure still works
    await expect(page.locator('h2')).toContainText('Google Maps JavaScript API');
    await expect(page.locator('#map')).toBeVisible();

    // Verify no map tiles loaded (due to invalid API key)
    const mapTileImages = await page.locator('#map img[src*="googleapis.com/maps/vt"]').count();
    expect(mapTileImages).toBe(0);

    const errorTitle = await page
      .locator('.gm-err-title')
      .textContent()
      .catch(() => '');
    const errorMessage = await page
      .locator('.gm-err-message')
      .textContent()
      .catch(() => '');

    // Both title and message must be present for complete error validation
    expect(errorTitle).toBeTruthy();
    expect(errorMessage).toBeTruthy();

    // Also verify console errors related to Maps API
    const mapsApiErrors = consoleErrors.filter((error) => error.includes('Google Maps') || error.includes('maps.googleapis.com') || error.includes('API key'));

    // Should have either no console errors (clean failure) or Maps-related errors
    expect(consoleErrors.length === 0 || mapsApiErrors.length > 0).toBeTruthy();
  });

  test('should display map controls and interactive elements', async ({ page }) => {
    await page.goto('/api/google-maps');
    await page.waitForLoadState('networkidle');

    const mapLoaded = await page.waitForFunction(() => window.google && window.google.maps && window.map && window.map !== null, { timeout: 8000 });
    expect(mapLoaded).toBeTruthy();

    await page.waitForTimeout(1000);

    const centerMapControl = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('div'));
      return elements.some((el) => el.textContent.trim() === 'Center Map');
    });
    expect(centerMapControl).toBe(true);

    const markers = page.locator('.custom-marker');
    const markerCount = await markers.count();
    expect(markerCount).toBeGreaterThan(0);

    await markers.first().click();
    await page.waitForTimeout(1000);

    const infoWindow = await page.evaluate(() => document.querySelector('.info-window') !== null || document.querySelector('.gm-ui-hover-effect') !== null || document.querySelector('[class*="info"]') !== null);
    expect(infoWindow).toBe(true);

    await expect(page.locator('#map')).toBeVisible();
  });

  test('should verify all Font Awesome icons and marker locations', async ({ page }) => {
    await page.goto('/api/google-maps');
    await page.waitForLoadState('networkidle');

    await page.waitForFunction(() => window.google && window.google.maps && window.map && document.querySelectorAll('.custom-marker').length > 0, { timeout: 8000 });

    const cityIcon = await page.locator('i.fas.fa-city').count();
    const landmarkIcon = await page.locator('i.fas.fa-landmark').count();
    const fishIcon = await page.locator('i.fas.fa-fish').count();

    expect(cityIcon).toBeGreaterThanOrEqual(1);
    expect(landmarkIcon).toBeGreaterThanOrEqual(1);
    expect(fishIcon).toBeGreaterThanOrEqual(1);

    const markerLabels = ['San Francisco', 'Financial District', "Fisherman's Wharf"];
    for (const label of markerLabels) {
      const labelElement = await page.locator(`text=${label}`).count();
      expect(labelElement).toBeGreaterThanOrEqual(1);
    }
  });

  test('should test info window content on marker click', async ({ page }) => {
    await page.goto('/api/google-maps');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(4000);

    const mapLoaded = await page.evaluate(() => window.mapLoaded === true);
    if (mapLoaded) {
      const markerData = [
        { title: 'San Francisco', content: 'cultural, commercial, and financial center', icon: 'fa-city' },
        { title: 'Financial District', content: 'business and financial hub', icon: 'fa-landmark' },
        { title: "Fisherman's Wharf", content: 'seafood restaurants', icon: 'fa-fish' },
      ];

      for (let i = 0; i < markerData.length; i++) {
        await page.evaluate((index) => {
          const markers = document.querySelectorAll('.custom-marker');
          if (markers[index]) {
            markers[index].click();
          }
        }, i);

        await page.waitForTimeout(500);

        const infoWindowVisible = await page.evaluate((expectedData) => {
          const infoWindow = document.querySelector('.gm-style-iw');
          if (infoWindow) {
            const content = infoWindow.textContent;
            return content.includes(expectedData.title) || content.includes(expectedData.content);
          }
          return false;
        }, markerData[i]);

        expect(infoWindowVisible).toBe(true);
      }
    }
  });
});
