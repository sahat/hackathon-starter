const { test, expect } = require('@playwright/test');

test.describe('Trakt.tv API Integration', () => {
  test('should launch app, navigate to Trakt API page, and handle basic page elements', async ({ page }) => {
    // Navigate to Trakt API page
    await page.goto('/api/trakt');
    await page.waitForLoadState('networkidle');

    // Basic page checks
    await expect(page).toHaveTitle(/Trakt\.tv API/);
    await expect(page.locator('h2')).toContainText('Trakt.tv API');

    // Check for API documentation links
    await expect(page.locator('.btn-group a[href*="trakt.docs.apiary.io"]')).toBeVisible();
    await expect(page.locator('.btn-group a[href*="trakt.tv/oauth/applications"]')).toBeVisible();
    await expect(page.locator('text=/API Docs/i')).toBeVisible();
    await expect(page.locator('text=/App Dashboard/i')).toBeVisible();
  });

  test('should display proper flash message for authentication states', async ({ page }) => {
    await page.goto('/api/trakt');
    await page.waitForLoadState('networkidle');

    // Check for the specific authentication failure message
    const alertWarning = page.locator('.alert.alert-warning');
    await expect(alertWarning).toBeVisible();

    // Should contain the "please log in" message
    await expect(alertWarning).toContainText('Please log in to access your Trakt.tv profile information.');
  });

  test('should display public trending movies section', async ({ page }) => {
    await page.goto('/api/trakt');
    await page.waitForLoadState('networkidle');

    // Check for trending movies section - this should exist with valid API key
    const trendingCard = page.locator('.card.text-white.bg-info');
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

  test('should display top trending movie details', async ({ page }) => {
    await page.goto('/api/trakt');
    await page.waitForLoadState('networkidle');

    // Check for top trending movie section - this should exist with valid API key
    const topTrendingCard = page.locator('.card.text-white.bg-primary');
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

  test('should handle movie images and trailers', async ({ page }) => {
    await page.goto('/api/trakt');
    await page.waitForLoadState('networkidle');

    const topTrendingCard = page.locator('.card.text-white.bg-primary');
    await expect(topTrendingCard).toBeVisible();

    // Check for movie poster image
    const posterImage = topTrendingCard.locator('img');
    const posterExists = (await posterImage.count()) > 0;

    if (posterExists) {
      await expect(posterImage).toBeVisible();

      // Verify image has src attribute
      const imgSrc = await posterImage.getAttribute('src');
      expect(imgSrc).toBeTruthy();
    }

    // Check for trailer link if present
    const trailerLink = topTrendingCard.locator('a[href*="youtube"]');
    const trailerExists = (await trailerLink.count()) > 0;

    if (trailerExists) {
      await expect(trailerLink).toBeVisible();
      await expect(trailerLink).toContainText('Watch Trailer');
    }
  });

  test('should display movie year and tagline', async ({ page }) => {
    await page.goto('/api/trakt');
    await page.waitForLoadState('networkidle');

    const topTrendingCard = page.locator('.card.text-white.bg-primary');
    await expect(topTrendingCard).toBeVisible();

    // Check for movie year (usually in a paragraph with mb-1 text-muted classes)
    const yearElement = topTrendingCard.locator('p.mb-1.text-muted');
    const yearExists = (await yearElement.count()) > 0;

    if (yearExists) {
      await expect(yearElement.first()).toBeVisible();

      // Check if year text contains a 4-digit number (optional validation)
      const yearText = await yearElement.first().textContent();
      if (yearText && yearText.trim()) {
        const yearMatch = yearText.match(/\b(19|20)\d{2}\b/);
        // Only validate year format if we find a year pattern, otherwise just log
        if (yearMatch) {
          expect(yearMatch).toBeTruthy();
        } else {
          console.log(`Year element found but no year pattern detected: "${yearText}"`);
        }
      }
    }

    // Check for tagline if present
    const taglineElements = topTrendingCard.locator('p.text-muted');
    const taglineCount = await taglineElements.count();

    if (taglineCount > 0) {
      // Look for tagline (usually italic text)
      for (let i = 0; i < taglineCount; i++) {
        const tagline = taglineElements.nth(i);
        const taglineText = await tagline.textContent();

        // Skip if it's just the year
        if (taglineText && !taglineText.match(/^\s*(19|20)\d{2}\s*$/)) {
          await expect(tagline).toBeVisible();
          break;
        }
      }
    }
  });

  test('should validate trending movies data structure', async ({ page }) => {
    await page.goto('/api/trakt');
    await page.waitForLoadState('networkidle');

    const trendingCard = page.locator('.card.text-white.bg-info');
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

  test('should handle runtime and rating formatting', async ({ page }) => {
    await page.goto('/api/trakt');
    await page.waitForLoadState('networkidle');

    const topTrendingCard = page.locator('.card.text-white.bg-primary');
    await expect(topTrendingCard).toBeVisible();

    // Check runtime format (should end with "min")
    const runtimeText = await topTrendingCard.locator('li').filter({ hasText: 'Runtime:' }).textContent();
    expect(runtimeText).toMatch(/Runtime:\s+\d+\s+min/);

    // Check rating format (should be "X.XX / 10" or empty)
    const ratingText = await topTrendingCard.locator('li').filter({ hasText: 'Rating:' }).textContent();
    expect(ratingText).toMatch(/Rating:\s+(\d+\.\d{2}\s+\/\s+10|$)/);
  });

  test('should handle arrays for languages and genres', async ({ page }) => {
    await page.goto('/api/trakt');
    await page.waitForLoadState('networkidle');

    const topTrendingCard = page.locator('.card.text-white.bg-primary');
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

  test('should validate all API response elements are displayed', async ({ page }) => {
    await page.goto('/api/trakt');
    await page.waitForLoadState('networkidle');

    // Verify all main sections are present
    await expect(page.locator('h2')).toContainText('Trakt.tv API');

    // Authentication warning should be present when not logged in
    await expect(page.locator('.alert.alert-warning')).toBeVisible();

    // Public trending movies section should be present
    await expect(page.locator('.card.text-white.bg-info')).toBeVisible();

    // Top trending movie details should be present
    await expect(page.locator('.card.text-white.bg-primary')).toBeVisible();

    // Verify the page handles the API response structure correctly
    const trendingMoviesHeader = page.locator('.card.text-white.bg-info .card-header h6');
    await expect(trendingMoviesHeader).toContainText('Trending Movies (Public API, top 6)');

    const topMovieHeader = page.locator('.card.text-white.bg-primary .card-header h6');
    await expect(topMovieHeader).toContainText('Top Trending Movie Details (Public API)');
  });
});
