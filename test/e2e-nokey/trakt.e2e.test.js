const { test, expect } = require('@playwright/test');

test.describe('Trakt.tv API Integration - Core Functionality (No Authentication)', () => {
  test('should display basic page structure and navigation elements', async ({ page }) => {
    // Navigate to Trakt API page
    await page.goto('/api/trakt');
    await page.waitForLoadState('networkidle');

    // Basic page checks
    await expect(page).toHaveTitle(/Trakt\.tv API/);
    await expect(page.locator('h2')).toContainText('Trakt.tv API');

    // Check for API documentation links (always present)
    await expect(page.locator('.btn-group a[href*="trakt.docs.apiary.io"]')).toBeVisible();
    await expect(page.locator('.btn-group a[href*="trakt.tv/oauth/applications"]')).toBeVisible();
    await expect(page.locator('text=/API Docs/i')).toBeVisible();
    await expect(page.locator('text=/App Dashboard/i')).toBeVisible();

    // Verify the documentation links are clickable and have correct attributes
    const apiDocsLink = page.locator('.btn-group a[href*="trakt.docs.apiary.io"]');
    await expect(apiDocsLink).toHaveAttribute('target', '_blank');

    const appDashboardLink = page.locator('.btn-group a[href*="trakt.tv/oauth/applications"]');
    await expect(appDashboardLink).toHaveAttribute('target', '_blank');
  });

  test('should display authentication warning for unauthenticated users', async ({ page }) => {
    // Navigate to Trakt API page without login
    await page.goto('/api/trakt');
    await page.waitForLoadState('networkidle');

    // Verify warning alert appears with appropriate message
    const alertWarning = page.locator('.alert.alert-warning');
    await expect(alertWarning).toBeVisible();

    // Check for authentication-related messages
    const hasLoginMessage = (await alertWarning.locator('text=/log in/i').count()) > 0;
    const hasLinkMessage = (await alertWarning.locator('text=/linked your Trakt\.tv account/i').count()) > 0;
    const hasAuthMessage = (await alertWarning.locator('text=/authenticated/i').count()) > 0;

    // At least one authentication message should be present
    expect(hasLoginMessage || hasLinkMessage || hasAuthMessage).toBeTruthy();

    // If there's a link to connect Trakt account, verify it exists and is functional
    const traktAuthLink = page.locator('a[href="/auth/trakt"]');
    if ((await traktAuthLink.count()) > 0) {
      await expect(traktAuthLink).toBeVisible();
      await expect(traktAuthLink).toContainText(/link/i);
    }
  });

  test('should handle API errors gracefully and maintain page structure', async ({ page }) => {
    // Navigate to Trakt API page
    await page.goto('/api/trakt');
    await page.waitForLoadState('networkidle');

    // Basic page structure should always be present even if API fails
    await expect(page).toHaveTitle(/Trakt\.tv API/);
    await expect(page.locator('h2')).toContainText('Trakt.tv API');

    // Documentation links should always be present regardless of API status
    await expect(page.locator('.btn-group a[href*="trakt.docs.apiary.io"]')).toBeVisible();
    await expect(page.locator('.btn-group a[href*="trakt.tv/oauth/applications"]')).toBeVisible();

    // Authentication warning should be present for unauthenticated users
    const alertWarning = page.locator('.alert.alert-warning');
    await expect(alertWarning).toBeVisible();

    // Verify page doesn't show any JavaScript errors or broken elements
    const pageErrors = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));

    // Wait a bit to catch any potential errors
    await page.waitForTimeout(2000);

    // No critical JavaScript errors should occur
    expect(pageErrors.filter((error) => !error.includes('favicon'))).toHaveLength(0);
  });

  test('should have proper page accessibility and semantic structure', async ({ page }) => {
    // Navigate to Trakt API page
    await page.goto('/api/trakt');
    await page.waitForLoadState('networkidle');

    // Check for proper heading hierarchy
    await expect(page.locator('h2')).toBeVisible();

    // Verify buttons have proper roles and are accessible
    const buttonGroup = page.locator('.btn-group[role="group"]');
    await expect(buttonGroup).toBeVisible();

    // Check that buttons have proper classes and are styled correctly
    const apiDocsBtn = page.locator('.btn.btn-primary').first();
    const appDashboardBtn = page.locator('.btn.btn-primary').last();

    await expect(apiDocsBtn).toBeVisible();
    await expect(appDashboardBtn).toBeVisible();

    // Verify icons are present in buttons
    await expect(page.locator('.btn i.far.fa-file-alt')).toBeVisible();
    await expect(page.locator('.btn i.far.fa-square-check')).toBeVisible();
  });

  test('should respond to direct API endpoint requests appropriately', async ({ request, page }) => {
    // Test the page endpoint directly
    const response = await request.get('/api/trakt');

    // Should return a successful response (200-299) or a client error (400-499)
    // but not a server error (500+) for a properly functioning application
    expect(response.status()).toBeLessThan(500);

    // Navigate to verify the page renders correctly
    await page.goto('/api/trakt');
    await page.waitForLoadState('networkidle');

    // Basic functionality should work regardless of API key status
    await expect(page).toHaveTitle(/Trakt\.tv API/);
    await expect(page.locator('h2')).toContainText('Trakt.tv API');

    // The page should handle missing API keys gracefully
    const alertWarning = page.locator('.alert.alert-warning');
    await expect(alertWarning).toBeVisible();
  });
});
