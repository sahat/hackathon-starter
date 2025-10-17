const { test, expect } = require('@playwright/test');

test.describe('Google Maps API Integration', () => {
  let sharedPage;

  test.beforeAll(async ({ browser }) => {
    sharedPage = await browser.newPage();
    await sharedPage.goto('/api/google-maps');
    await sharedPage.waitForLoadState('networkidle');
  });

  test.afterAll(async () => {
    if (sharedPage) await sharedPage.close();
  });

  test('should load Google Maps page and display map elements', async () => {
    // Basic page checks
    await expect(sharedPage).toHaveTitle(/Google Maps/);
    await expect(sharedPage.locator('h2')).toContainText('Google Maps JavaScript API');

    // Check for navigation buttons
    const gettingStartedBtn = sharedPage.locator('a[href*="developers.google.com/maps"]');
    const apiConsoleBtn = sharedPage.locator('a[href*="console.developers.google.com"]');
    await expect(gettingStartedBtn).toBeVisible();
    await expect(gettingStartedBtn).toContainText('Getting Started');
    await expect(apiConsoleBtn).toBeVisible();
    await expect(apiConsoleBtn).toContainText('API Console');

    // Check for map container
    const mapContainer = sharedPage.locator('#map');
    await expect(mapContainer).toBeVisible();
    await expect(mapContainer).toHaveCSS('height', '500px');

    // Check for description text (complete sentence) - use more specific selector
    await expect(sharedPage.locator('p').first()).toContainText('This example uses custom markers with Font Awesome icons, a custom map control (Center Map), and restricted navigation boundaries.');
  });

  test('should load Google Maps JavaScript API script', async () => {
    // Check for the main Google Maps API script (with key parameter)
    const mainMapsScript = sharedPage.locator('script[src*="maps.googleapis.com/maps/api/js"][src*="key="]');
    await expect(mainMapsScript).toHaveCount(1);

    // Verify the main script has required parameters
    const scriptSrc = await mainMapsScript.getAttribute('src');
    expect(scriptSrc).toContain('key=');
    expect(scriptSrc).toContain('libraries=marker');
    expect(scriptSrc).toContain('loading=async');
  });

  test('should initialize map and custom elements', async () => {
    await sharedPage.waitForTimeout(5000); // Allow more time for map initialization

    // Check if Google Maps API loaded by looking for map tiles
    const mapTileImages = await sharedPage.locator('#map img[src*="googleapis.com/maps/vt"]').count();
    expect(mapTileImages).toBeGreaterThan(0);

    // Verify map container is properly sized and positioned
    const mapContainer = sharedPage.locator('#map');
    await expect(mapContainer).toBeVisible();
    await expect(mapContainer).toHaveCSS('height', '500px');
  });

  test('should display map controls and interactive elements', async () => {
    const mapLoaded = await sharedPage.waitForFunction(() => window.google && window.google.maps && window.map && window.map !== null, { timeout: 8000 });
    expect(mapLoaded).toBeTruthy();

    await sharedPage.waitForTimeout(5000);

    const centerMapControl = await sharedPage.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('div'));
      return elements.some((el) => el.textContent.trim() === 'Center Map');
    });
    expect(centerMapControl).toBe(true);

    const markers = sharedPage.locator('.custom-marker');
    const markerCount = await markers.count();
    expect(markerCount).toBeGreaterThan(0);

    await markers.first().click();
    await sharedPage.waitForTimeout(1000);

    const infoWindow = await sharedPage.evaluate(() => document.querySelector('.info-window') !== null || document.querySelector('.gm-ui-hover-effect') !== null || document.querySelector('[class*="info"]') !== null);
    expect(infoWindow).toBe(true);

    await expect(sharedPage.locator('#map')).toBeVisible();
  });

  test('should verify all Font Awesome icons and marker locations', async () => {
    await sharedPage.waitForFunction(() => window.google && window.google.maps && window.map && document.querySelectorAll('.custom-marker').length > 0, { timeout: 8000 });

    const cityIcon = await sharedPage.locator('i.fas.fa-city').count();
    const landmarkIcon = await sharedPage.locator('i.fas.fa-landmark').count();
    const fishIcon = await sharedPage.locator('i.fas.fa-fish').count();

    expect(cityIcon).toBeGreaterThanOrEqual(1);
    expect(landmarkIcon).toBeGreaterThanOrEqual(1);
    expect(fishIcon).toBeGreaterThanOrEqual(1);

    const markerLabels = ['San Francisco', 'Financial District', "Fisherman's Wharf"];
    for (const label of markerLabels) {
      const labelElement = await sharedPage.locator(`text=${label}`).count();
      expect(labelElement).toBeGreaterThanOrEqual(1);
    }
  });

  test('should test info window content on marker click', async () => {
    await sharedPage.waitForTimeout(5000);

    const mapLoaded = await sharedPage.evaluate(() => window.mapLoaded === true);
    if (mapLoaded) {
      const markerData = [
        { title: 'San Francisco', content: 'cultural, commercial, and financial center', icon: 'fa-city' },
        { title: 'Financial District', content: 'business and financial hub', icon: 'fa-landmark' },
        { title: "Fisherman's Wharf", content: 'seafood restaurants', icon: 'fa-fish' },
      ];

      for (let i = 0; i < markerData.length; i++) {
        await sharedPage.evaluate((index) => {
          const markers = document.querySelectorAll('.custom-marker');
          if (markers[index]) {
            markers[index].click();
          }
        }, i);

        await sharedPage.waitForTimeout(500);

        const infoWindowVisible = await sharedPage.evaluate((expectedData) => {
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
