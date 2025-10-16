const { test, expect } = require('@playwright/test');

test.describe('Wikipedia Example', () => {
  test('should display Content Example: Node.js elements', async ({ page }) => {
    await page.goto('/api/wikipedia');
    await page.waitForLoadState('networkidle');

    // Basic page checks
    await expect(page).toHaveTitle(/Wikipedia/);
    await expect(page.locator('h2')).toContainText('Wikipedia');

    // Content Example card (Node.js)
    const contentCard = page.locator('.card.text-white.bg-success');
    await expect(contentCard).toBeVisible();
    await expect(contentCard.locator('.card-header h6')).toContainText('Content Example: Node.js');

    // Title and original wiki link
    const titleEl = contentCard.locator('.card-body h3');
    await expect(titleEl).toBeVisible();
    await expect(titleEl).toContainText('Node.js');

    const wikiLink = contentCard.locator('a[href="https://en.wikipedia.org/wiki/Node.js"]');
    await expect(wikiLink).toBeVisible();

    // Ensure there is a page image and it points to a valid URL
    const imageEl = contentCard.locator('.card-body img');
    await expect(imageEl).toBeVisible();
    const imageLoaded = await imageEl.evaluate((img) => img.complete && img.naturalWidth > 0);
    expect(imageLoaded).toBeTruthy();

    // Ensure there is an extract paragraph with sufficient text
    const extractPara = contentCard.locator('.card-body p.text-break');
    await expect(extractPara).toBeVisible();
    const extractText = (await extractPara.textContent()) || '';
    expect(extractText.trim().length).toBeGreaterThan(50);

    const sectionLinks = contentCard.locator('.card-body p a[href^="https://en.wikipedia.org/wiki/Node.js#"]');
    expect(await sectionLinks.count()).toBeGreaterThan(5);
  });

  test('should search for "javascript" and display results', async ({ request, page }) => {
    // Hit the endpoint directly to ensure server responds
    const apiResp = await request.get(`/api/wikipedia?q=javascript`);
    expect(apiResp.ok()).toBeTruthy();

    // Perform the search via the UI
    await page.goto('/api/wikipedia');
    await page.waitForLoadState('networkidle');

    await page.fill('input.form-control[name="q"]', 'javascript');
    await page.click('.card.text-white.bg-info button[type="submit"]');
    await page.waitForLoadState('networkidle');

    // Results area
    const results = page.locator('.card.text-white.bg-info .list-group a.list-group-item');
    await expect(results.first()).toBeVisible({ timeout: 10000 });
    const count = await results.count();

    expect(count).toBeGreaterThan(5);

    // Verify first result structure and title exactly matches expected "JavaScript"
    const first = results.nth(0);
    await expect(first.locator('strong')).toBeVisible();
    await expect(first.locator('small.text-muted')).toBeVisible();

    // Title must be exactly 'JavaScript' (the top result for this query)
    const firstTitle = (await first.locator('strong').textContent()) || '';
    expect(firstTitle.trim()).toBe('JavaScript');

    // Link should point to the JavaScript wikipedia article
    const href = await first.getAttribute('href');
    expect(href).toBeTruthy();
    expect(href).toMatch(/https?:\/\/en\.wikipedia\.org\/wiki\/JavaScript/);
  });
});
