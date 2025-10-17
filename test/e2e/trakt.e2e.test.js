const { test, expect } = require('@playwright/test');

test.describe('Trakt.tv API Integration', () => {
  let sharedPage;

  test.beforeAll(async ({ browser }) => {
    sharedPage = await browser.newPage();
    await sharedPage.goto('/api/trakt');
    await sharedPage.waitForLoadState('networkidle');
  });

  test.afterAll(async () => {
    if (sharedPage) await sharedPage.close();
  });

  test('should launch app, navigate to Trakt API page, and handle basic page elements', async () => {
    // Basic page checks
    await expect(sharedPage).toHaveTitle(/Trakt\.tv API/);
    await expect(sharedPage.locator('h2')).toContainText('Trakt.tv API');

    // Check for API documentation links
    await expect(sharedPage.locator('.btn-group a[href*="trakt.docs.apiary.io"]')).toBeVisible();
    await expect(sharedPage.locator('.btn-group a[href*="trakt.tv/oauth/applications"]')).toBeVisible();
    await expect(sharedPage.locator('text=/API Docs/i')).toBeVisible();
    await expect(sharedPage.locator('text=/App Dashboard/i')).toBeVisible();
  });

  test('should display proper flash message for authentication states', async () => {
    // Check for the specific authentication failure message
    const alertWarning = sharedPage.locator('.alert.alert-warning');
    await expect(alertWarning).toBeVisible();

    // Should contain the "please log in" message
    await expect(alertWarning).toContainText('Please log in to access your Trakt.tv profile information.');
  });

  test('should display public trending movies section', async () => {
    // Check for trending movies section - this should exist with valid API key
    const trendingCard = sharedPage.locator('.card.text-white.bg-info');
    await expect(trendingCard).toBeVisible();
    await expect(trendingCard.locator('.card-header h6')).toContainText('Trending Movies (Public API, top 6)');

    // Check for movie items in the trending section
    const movieItems = trendingCard.locator('.col-md-4.col-6.mb-3');
    const movieCount = await movieItems.count();
    expect(movieCount).toBeGreaterThan(0);
    expect(movieCount).toBeLessThanOrEqual(6);

    // Check each movie item has required elements
    for (let i = 0; i < Math.min(movieCount, 3); i++) {
      const movieItem = movieItems.nth(i);

      // Each movie should have a title
      const titleElement = movieItem.locator('strong');
      await expect(titleElement).toBeVisible();

      // Each movie should have watchers count
      const watchersElement = movieItem.locator('small.text-muted');
      await expect(watchersElement).toBeVisible();
      await expect(watchersElement).toContainText('watchers');
    }
  });

  test('should display top trending movie details', async () => {
    // Check for top trending movie section - this should exist with valid API key
    const topTrendingCard = sharedPage.locator('.card.text-white.bg-primary');
    await expect(topTrendingCard).toBeVisible();
    await expect(topTrendingCard.locator('.card-header h6')).toContainText('Top Trending Movie Details');

    // Check for movie details
    const movieTitle = topTrendingCard.locator('h4');
    await expect(movieTitle).toBeVisible();

    // Check for overview paragraph (look for paragraphs that aren't year/tagline)
    const allParagraphs = topTrendingCard.locator('p');
    const paragraphCount = await allParagraphs.count();
    expect(paragraphCount).toBeGreaterThan(0);

    // Look for overview content (usually the longest paragraph)
    let overviewFound = false;
    for (let i = 0; i < paragraphCount; i++) {
      const paragraph = allParagraphs.nth(i);
      const text = await paragraph.textContent();
      const classes = (await paragraph.getAttribute('class')) || '';

      // Skip year and tagline paragraphs, look for overview
      if (!classes.includes('mb-1') && !classes.includes('text-muted') && text && text.length > 50) {
        await expect(paragraph).toBeVisible();
        overviewFound = true;
        break;
      }
    }

    expect(overviewFound).toBe(true);
  });

  test('should handle movie images and trailers', async () => {
    const topTrendingCard = sharedPage.locator('.card.text-white.bg-primary');
    await expect(topTrendingCard).toBeVisible();

    // Check for movie poster image
    const posterImage = topTrendingCard.locator('img');
    await expect(posterImage).toBeVisible();

    // Verify image has src attribute
    const imgSrc = await posterImage.getAttribute('src');
    expect(imgSrc).toBeTruthy();

    // Check for trailer embed (the template renders an <iframe> inside a .ratio-16x9 wrapper)
    const trailerIframe = topTrendingCard.locator('.ratio-16x9 iframe, iframe');
    await expect(trailerIframe.first()).toBeVisible();
    const iframeSrc = await trailerIframe.first().getAttribute('src');
    expect(iframeSrc).toBeTruthy();
    expect(iframeSrc).toMatch(/youtu/);
  });

  test('should display movie year and tagline', async () => {
    const topTrendingCard = sharedPage.locator('.card.text-white.bg-primary');
    await expect(topTrendingCard).toBeVisible();

    const yearElement = topTrendingCard.locator('span.text-muted');
    await expect(yearElement.first()).toBeVisible();

    const yearText = await yearElement.first().textContent();
    expect(yearText).toMatch(/\b(19|20)\d{2}\b/);

    const tagline = topTrendingCard.locator('p.mb-1.text-muted');
    await expect(tagline.first()).toBeVisible();
  });

  test('should validate trending movies data structure', async () => {
    const trendingCard = sharedPage.locator('.card.text-white.bg-info');
    await expect(trendingCard).toBeVisible();

    // Check the grid structure
    const gridRow = trendingCard.locator('.row');
    await expect(gridRow).toBeVisible();

    // Check movie items have proper Bootstrap classes
    const movieItems = trendingCard.locator('.col-md-4.col-6.mb-3');
    const movieCount = await movieItems.count();

    for (let i = 0; i < Math.min(movieCount, 2); i++) {
      const movieItem = movieItems.nth(i);

      // Check for image or placeholder
      const hasImage = (await movieItem.locator('img.img-thumbnail').count()) > 0;
      const hasPlaceholder = (await movieItem.locator('div').filter({ hasText: 'No Image' }).count()) > 0;

      expect(hasImage || hasPlaceholder).toBeTruthy();

      // Check watchers count format
      const watchersText = await movieItem.locator('small.text-muted').textContent();
      expect(watchersText).toMatch(/\d+\s+watchers/);
    }
  });

  test('should handle runtime and rating formatting', async () => {
    const topTrendingCard = sharedPage.locator('.card.text-white.bg-primary');
    await expect(topTrendingCard).toBeVisible();

    // Check runtime format (should end with "min")
    const runtimeText = await topTrendingCard.locator('li').filter({ hasText: 'Runtime:' }).textContent();
    expect(runtimeText).toMatch(/Runtime:\s+\d+\s+min/);

    // Check rating format (should be "X.XX / 10" or empty)
    const ratingText = await topTrendingCard.locator('li').filter({ hasText: 'Rating:' }).textContent();
    expect(ratingText).toMatch(/Rating:\s+(\d+\.\d{2}\s+\/\s+10|$)/);
  });

  test('should handle arrays for languages and genres', async () => {
    const topTrendingCard = sharedPage.locator('.card.text-white.bg-primary');
    await expect(topTrendingCard).toBeVisible();

    // Check languages format (comma-separated or "N/A")
    const languagesText = await topTrendingCard.locator('li').filter({ hasText: 'Languages:' }).textContent();
    expect(languagesText).toMatch(/Languages:\s+([\w\s,]+|N\/A)/);

    // Check genres format (comma-separated or "N/A")
    const genresText = await topTrendingCard.locator('li').filter({ hasText: 'Genres:' }).textContent();
    expect(genresText).toMatch(/Genres:\s+([\w\s,]+|N\/A)/);

    // Check certification format (text or "N/A")
    const certificationText = await topTrendingCard.locator('li').filter({ hasText: 'Certification:' }).textContent();
    expect(certificationText).toMatch(/Certification:\s+([\w\s-]+|N\/A)/);
  });

  test('should validate all API response elements are displayed', async () => {
    // Verify all main sections are present
    await expect(sharedPage.locator('h2')).toContainText('Trakt.tv API');

    // Authentication warning should be present when not logged in
    await expect(sharedPage.locator('.alert.alert-warning')).toBeVisible();

    // Public trending movies section should be present
    await expect(sharedPage.locator('.card.text-white.bg-info')).toBeVisible();

    // Top trending movie details should be present
    await expect(sharedPage.locator('.card.text-white.bg-primary')).toBeVisible();

    // Verify the page handles the API response structure correctly
    const trendingMoviesHeader = sharedPage.locator('.card.text-white.bg-info .card-header h6');
    await expect(trendingMoviesHeader).toContainText('Trending Movies (Public API, top 6)');

    const topMovieHeader = sharedPage.locator('.card.text-white.bg-primary .card-header h6');
    await expect(topMovieHeader).toContainText('Top Trending Movie Details (Public API)');
  });
});
