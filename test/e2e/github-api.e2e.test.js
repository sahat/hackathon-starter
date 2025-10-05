const { test, expect } = require('@playwright/test');

test.describe('GitHub API Integration', () => {
  test('should launch app, navigate to GitHub API page, and handle API response', async ({ page }) => {
    // Navigate to GitHub API page
    await page.goto('/api/github');
    await page.waitForLoadState('networkidle');

    // Basic page checks
    await expect(page).toHaveTitle(/GitHub API/);
    await expect(page.locator('h2')).toContainText('GitHub API');

    // Detect if API returned an error (rate limit, 403, etc.)
    const errorElement = page.locator('text=/error|rate limit|403/i');
    const isError = (await errorElement.count()) > 0;

    if (isError) {
      // Verify error handling works
      console.log('GitHub API rate limit reached - testing error handling');
      await expect(page.locator('body')).toContainText(/error|rate limit|403/i);
    } else {
      // Verify normal content rendering
      console.log('GitHub API call succeeded - testing content display');
      const repoSection = page.locator('.card.text-white.bg-primary');
      await expect(repoSection).toBeVisible({ timeout: 10000 });
      await expect(page.locator('.card-header h6')).toContainText('Repository Lookup Example');

      const repoContent = page.locator('.card-body.text-dark.bg-white');
      await expect(repoContent).toBeVisible();

      const repoLink = page.locator('a[href*="github.com"]');
      await expect(repoLink.first()).toBeVisible();
    }

    // Common elements on the page
    await expect(page.locator('.btn-group a[href*="developer.github.com"]')).toHaveCount(2);
    await expect(page.locator('text=/Getting Started/i')).toBeVisible();
    await expect(page.locator('text=/Documentation/i')).toBeVisible();
  });

  test('should display authentication prompt for unauthenticated users', async ({ page }) => {
    // Navigate to GitHub API page without login
    await page.goto('/api/github');
    await page.waitForLoadState('networkidle');

    // Verify warning alert appears
    const alertWarning = page.locator('.alert.alert-warning');
    await expect(alertWarning).toBeVisible();
    await expect(alertWarning).toContainText(/log in|GitHub account/i);
  });
  test('testing repository lookup example', async ({ request, page }) => {
    await page.goto('/api/github');
    await page.waitForLoadState('networkidle');
    // Basic page checks
    await expect(page).toHaveTitle(/GitHub API/);
    await expect(page.locator('h2')).toContainText('GitHub API');

    //Testing GitHub API `/api/github`
    const response = await request.get(`/api/github`);
    expect(response.ok()).toBeTruthy();

    await expect(page.locator('.card-body h4')).toContainText('hackathon-starter');
    await expect(page.locator('li.list-inline-item', { hasText: 'Stars:' })).toContainText(/\d{4,}/); // at least 4 digits
    await expect(page.locator('li.list-inline-item', { hasText: 'Forks:' })).toContainText(/\d{3,}/); // at least 3 digits
    await expect(page.locator('li.list-inline-item', { hasText: 'Watchers:' })).toContainText(/\d{4,}/); // at least 4 digits
    await expect(page.locator('li.list-inline-item', { hasText: 'Open Issues:' })).toContainText(/\d+/); // at least 1 digit
    await expect(page.locator('li.list-inline-item', { hasText: 'License:' })).toContainText(/MIT/i);
    await expect(page.locator('li.list-inline-item', { hasText: 'Visibility:' })).toContainText(/public/i);
  });
});
