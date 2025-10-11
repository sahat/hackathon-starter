const { test, expect } = require('@playwright/test');

test.describe('Together AI Classifier Integration', () => {
  test.describe.configure({ mode: 'serial' });

  test('should launch app, navigate to Together AI Classifier page, and handle API response', async ({ page }) => {
    // Navigate to Together AI Classifier page
    await page.goto('/ai/togetherai-classifier');
    await page.waitForLoadState('networkidle');

    // Basic page checks
    await expect(page).toHaveTitle(/Together/);
    await expect(page.locator('h2')).toContainText('Together AI');

    // Verify form elements
    const textarea = page.locator('textarea#inputText');
    await expect(textarea).toBeVisible();

    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeVisible();
    await expect(submitButton).toContainText('Classify Department');

    // Common elements on the page
    await expect(page.locator('.btn-group a[href*="together.ai"]')).toHaveCount(3);
    await expect(page.locator('text=/Together AI Dashboard/i')).toBeVisible();
    await expect(page.locator('text=/API Reference/i')).toBeVisible();
  });

  test('should classify a user request and display all classification data', async ({ page }) => {
    // Increase timeout to accommodate rate limiting wait in free tier
    test.setTimeout(150000); // 2.5 minutes

    await page.goto('/ai/togetherai-classifier');
    await page.waitForLoadState('networkidle');

    // Enter and submit "I want a refund"
    const testMessage = 'I want a refund';
    await page.fill('textarea#inputText', testMessage);
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');

    // Verify all classification result elements that map to API data
    await expect(page.locator('textarea#inputText')).toHaveValue(testMessage);
    await expect(page.locator('h5')).toContainText('Classification (Routing) Result');
    await expect(page.locator('span.fw-bold.text-primary')).toContainText('Department:');

    const departmentValue = page.locator('span.ms-2.fs-4');
    await expect(departmentValue).toBeVisible();
    expect((await departmentValue.textContent()).trim().length).toBeGreaterThan(0);

    // Verify "Show raw model output" - maps to result.raw from API
    const rawOutputDetails = page.locator('details').filter({ hasText: 'Show raw model output' });
    await expect(rawOutputDetails).toBeVisible();
    await rawOutputDetails.locator('summary').click();
    const rawOutputPre = rawOutputDetails.locator('pre');
    await expect(rawOutputPre).toBeVisible();
    expect((await rawOutputPre.textContent()).trim().length).toBeGreaterThan(0);

    // Verify "Show system prompt" - maps to result.systemPrompt from API
    const systemPromptDetails = page.locator('details').filter({ hasText: 'Show system prompt' });
    await expect(systemPromptDetails).toBeVisible();
    await systemPromptDetails.locator('summary').click();
    const systemPromptPre = systemPromptDetails.locator('pre');
    await expect(systemPromptPre).toBeVisible();
    expect((await systemPromptPre.textContent()).trim().length).toBeGreaterThan(0);

    // Wait to avoid rate limiting in free tier (0.6 queries per minute = 1 query per 100 seconds)
    await page.waitForTimeout(105000);
  });

  test('should classify "I want a refund" as "Returns and Refunds"', async ({ page }) => {
    await page.goto('/ai/togetherai-classifier');
    await page.waitForLoadState('networkidle');

    const testMessage = 'I want a refund';
    await page.fill('textarea#inputText', testMessage);
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');

    // Verify input is preserved
    await expect(page.locator('textarea#inputText')).toHaveValue(testMessage);

    // Verify the specific department classification
    const departmentValue = page.locator('span.ms-2.fs-4');
    await expect(departmentValue).toContainText('Returns and Refunds');
  });
});
