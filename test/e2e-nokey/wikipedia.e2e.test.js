const { test, expect } = require('@playwright/test');

test.describe('Wikipedia Example', () => {
  let sharedPage;

  test.beforeAll(async ({ browser }) => {
    sharedPage = await browser.newPage();
    await sharedPage.goto('/api/wikipedia');
    await sharedPage.waitForLoadState('networkidle');
  });

  test.afterAll(async () => {
    if (sharedPage) await sharedPage.close();
  });

  test('should display Content Example: Node.js elements', async () => {
    // Basic page checks
    await expect(sharedPage).toHaveTitle(/Wikipedia/);
    await expect(sharedPage.locator('h2')).toContainText('Wikipedia');

    // Content Example card (Node.js)
    const contentCard = sharedPage.locator('.card.text-white.bg-success');
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

  test('should search for "javascript" and display results', async () => {
    // Perform the search via the UI on the already loaded page
    await sharedPage.fill('input.form-control[name="q"]', 'javascript');
    await sharedPage.click('.card.text-white.bg-info button[type="submit"]');
    await sharedPage.waitForLoadState('networkidle');

    // Results area
    const results = sharedPage.locator('.card.text-white.bg-info .list-group a.list-group-item');
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
