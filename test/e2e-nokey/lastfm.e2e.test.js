const { test, expect } = require('@playwright/test');

test.describe('Last.fm API Integration', () => {
  let sharedPage;

  test.beforeAll(async ({ browser }) => {
    sharedPage = await browser.newPage();
    await sharedPage.goto('/api/lastfm');
    await sharedPage.waitForLoadState('networkidle');
  });

  test.afterAll(async () => {
    if (sharedPage) await sharedPage.close();
  });

  test('should launch app, navigate to Last.fm API page, and handle API response', async () => {
    // Basic page checks
    await expect(sharedPage).toHaveTitle(/Last\.fm API/);
    await expect(sharedPage.locator('h2')).toContainText('Last.fm API');

    // Check artist name (should be "Roniit" based on controller)
    const artistName = sharedPage.locator('h3');
    await expect(artistName).toBeVisible({ timeout: 10000 });
    await expect(artistName).toContainText('Roniit');

    // Check Top Albums section
    const topAlbumsHeading = sharedPage.locator('h4', { hasText: 'Top Albums' });
    await expect(topAlbumsHeading).toBeVisible();

    // Check for album images (should have at least one)
    const albumImages = sharedPage.locator('img[src*="lastfm"]');
    await expect(albumImages.first()).toBeVisible();

    // Check Tags section
    const tagsHeading = sharedPage.locator('h4', { hasText: 'Tags' });
    await expect(tagsHeading).toBeVisible();

    // Check for tag elements
    const tagElements = sharedPage.locator('span.label.label-primary');
    await expect(tagElements.first()).toBeVisible();

    // Check Biography section
    const biographyHeading = sharedPage.locator('h4', { hasText: 'Biography' });
    await expect(biographyHeading).toBeVisible();

    // Biography should either have content or "No biography" message
    const biographyContent = sharedPage.locator('h4:has-text("Biography") + p');
    await expect(biographyContent).toBeVisible();

    // Check Top Tracks section
    const topTracksHeading = sharedPage.locator('h4', { hasText: 'Top Tracks' });
    await expect(topTracksHeading).toBeVisible();

    // Check for track list (ordered list)
    const trackList = sharedPage.locator('ol');
    await expect(trackList).toBeVisible();

    // Check for track links
    const trackLinks = sharedPage.locator('ol li a[href*="last.fm"]');
    await expect(trackLinks.first()).toBeVisible();

    // Check Similar Artists section
    const similarArtistsHeading = sharedPage.locator('h4', { hasText: 'Similar Artists' });
    await expect(similarArtistsHeading).toBeVisible();

    // Check for similar artist links
    const similarArtistsList = sharedPage.locator('ul.list-unstyled.list-inline');
    await expect(similarArtistsList).toBeVisible();

    const similarArtistLinks = sharedPage.locator('ul.list-unstyled.list-inline li a[href*="last.fm"]');
    await expect(similarArtistLinks.first()).toBeVisible();
  });

  test('should display correct page structure and navigation elements', async ({ page }) => {
    await page.goto('/api/lastfm');
    await page.waitForLoadState('networkidle');

    // Check page title and main heading
    await expect(page).toHaveTitle(/Last\.fm API/);
    await expect(page.locator('h2')).toContainText('Last.fm API');

    // Verify the Last.fm icon is present
    const lastfmIcon = page.locator('i.far.fa-play-circle');
    await expect(lastfmIcon).toBeVisible();
    await expect(lastfmIcon).toHaveCSS('color', 'rgb(219, 19, 2)'); // #db1302

    // Check all three documentation buttons
    const buttons = page.locator('.btn-group.d-flex .btn');
    await expect(buttons).toHaveCount(3);

    // Verify button texts and links
    await expect(page.locator('a[href*="lastfm-node"]')).toContainText('Last.fm Node Docs');
    await expect(page.locator('a[href*="api/account/create"]')).toContainText('Create API Account');
    await expect(page.locator('a[href="http://www.last.fm/api"]')).toContainText('API Endpoints');

    // Verify all buttons open in new tab
    const docLinks = page.locator('.btn-group a');
    const linkCount = await docLinks.count();
    for (let i = 0; i < linkCount; i++) {
      await expect(docLinks.nth(i)).toHaveAttribute('target', '_blank');
    }
  });

  test('should test Last.fm API endpoint directly and verify data structure', async ({ request, page }) => {
    await page.goto('/api/lastfm');
    await page.waitForLoadState('networkidle');

    // Test the API endpoint directly
    const response = await request.get('/api/lastfm');
    expect(response.ok()).toBeTruthy();

    // Verify page content matches expected data structure
    // Artist name should be present
    const artistNameElement = page.locator('h3');
    await expect(artistNameElement).toBeVisible();

    // Check that all main sections are present
    const sections = ['Top Albums', 'Tags', 'Biography', 'Top Tracks', 'Similar Artists'];

    for (const section of sections) {
      await expect(page.locator(`h4:has-text("${section}")`)).toBeVisible();
    }

    // Verify track list has items (should have up to 10 tracks based on controller)
    const trackItems = page.locator('ol li');
    const trackCount = await trackItems.count();
    expect(trackCount).toBeGreaterThan(0);
    expect(trackCount).toBeLessThanOrEqual(10);

    // Verify album images are present (should have up to 3 albums based on controller)
    const albumImages = page.locator('h4:has-text("Top Albums") ~ img');
    const albumCount = await albumImages.count();
    expect(albumCount).toBeGreaterThanOrEqual(0);
    expect(albumCount).toBeLessThanOrEqual(3);

    // Verify tags are present and properly formatted
    const tags = page.locator('span.label.label-primary');
    if ((await tags.count()) > 0) {
      await expect(tags.first()).toContainText(/\w+/); // Should contain text
      await expect(tags.first().locator('i.fas.fa-tag')).toBeVisible();
    }

    // Verify similar artists links work properly
    const similarArtistLinks = page.locator('ul.list-unstyled.list-inline li a');
    if ((await similarArtistLinks.count()) > 0) {
      await expect(similarArtistLinks.first()).toHaveAttribute('href', /last\.fm/);
    }

    // Verify track links work properly
    const trackLinks = page.locator('ol li a');
    if ((await trackLinks.count()) > 0) {
      await expect(trackLinks.first()).toHaveAttribute('href', /last\.fm/);
    }
  });

  test('should handle missing or empty data gracefully', async ({ page }) => {
    await page.goto('/api/lastfm');
    await page.waitForLoadState('networkidle');

    // Check biography section - should handle empty bio gracefully
    const biographySection = page.locator('h4:has-text("Biography")');
    await expect(biographySection).toBeVisible();

    // Biography should either have content or show "No biography"
    const biographyContent = page.locator('h4:has-text("Biography") + p');
    await expect(biographyContent).toBeVisible();

    // If no biography, should show appropriate message
    const noBioMessage = page.locator('p:has-text("No biography")');
    const hasBioContent = page.locator('h4:has-text("Biography") + p:not(:has-text("No biography"))');

    // One of these should be true
    const noBioExists = (await noBioMessage.count()) > 0;
    const bioExists = (await hasBioContent.count()) > 0;
    expect(noBioExists || bioExists).toBeTruthy();
  });

  test('should verify all external links have correct attributes', async ({ page }) => {
    await page.goto('/api/lastfm');
    await page.waitForLoadState('networkidle');

    // Check documentation links
    const docLinks = page.locator('.btn-group a');
    const docLinkCount = await docLinks.count();

    for (let i = 0; i < docLinkCount; i++) {
      const link = docLinks.nth(i);
      await expect(link).toHaveAttribute('target', '_blank');
      const href = await link.getAttribute('href');
      expect(href).toMatch(/^https?:\/\//); // Should be absolute URLs
    }

    // Check track links (if present)
    const trackLinks = page.locator('ol li a');
    const trackLinkCount = await trackLinks.count();

    for (let i = 0; i < Math.min(trackLinkCount, 3); i++) {
      // Check first 3 to avoid timeout
      const link = trackLinks.nth(i);
      const href = await link.getAttribute('href');
      expect(href).toContain('last.fm');
    }

    // Check similar artist links (if present)
    const artistLinks = page.locator('ul.list-unstyled.list-inline li a');
    const artistLinkCount = await artistLinks.count();

    for (let i = 0; i < Math.min(artistLinkCount, 3); i++) {
      // Check first 3 to avoid timeout
      const link = artistLinks.nth(i);
      const href = await link.getAttribute('href');
      expect(href).toContain('last.fm');
    }
  });

  test('should verify artist data elements are properly displayed', async ({ page }) => {
    await page.goto('/api/lastfm');
    await page.waitForLoadState('networkidle');

    // Test artist name display
    const artistName = page.locator('h3');
    await expect(artistName).toBeVisible();
    await expect(artistName).toContainText(/\w+/); // Should contain at least one word

    // Test album images have proper src attributes
    const albumImages = page.locator('img[src*="lastfm"], img[src*="last.fm"]');
    const firstImage = albumImages.first();
    await expect(firstImage).toHaveAttribute('width', '240');
    await expect(firstImage).toHaveAttribute('height', '240');

    // Test tag formatting
    const tagElements = page.locator('span.label.label-primary');
    const firstTag = tagElements.first();
    await expect(firstTag.locator('i.fas.fa-tag')).toBeVisible();
    await expect(firstTag).toContainText(/\w+/); // Should contain text

    // Test track list structure
    const trackItems = page.locator('ol li');
    const firstTrack = trackItems.first();
    await expect(firstTrack).toBeVisible();

    const trackLink = firstTrack.locator('a');
    await expect(trackLink).toHaveAttribute('href', /last\.fm/);

    // Test similar artists structure
    const artistItems = page.locator('ul.list-unstyled.list-inline li');
    const firstArtist = artistItems.first();
    const artistLink = firstArtist.locator('a');
    await expect(artistLink).toHaveAttribute('href', /last\.fm/);
    await expect(artistLink).toContainText(/\w+/); // Should contain text
  });
});
