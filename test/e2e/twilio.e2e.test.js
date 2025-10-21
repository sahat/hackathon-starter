const { test, expect } = require('@playwright/test');

test.describe('Twilio API Integration', () => {
  let sharedPage;

  test.beforeAll(async ({ browser }) => {
    sharedPage = await browser.newPage();
    await sharedPage.goto('/api/twilio');
    await sharedPage.waitForLoadState('networkidle');
  });

  test.afterAll(async () => {
    if (sharedPage) await sharedPage.close();
  });

  test('should launch app, navigate to Twilio API page, and render basic page elements', async () => {
    // Basic page checks
    await expect(sharedPage).toHaveTitle(/Twilio API/);
    await expect(sharedPage.locator('h2')).toContainText('Twilio API');

    // Check for API documentation links
    await expect(sharedPage.locator('.btn-group a[href*="https://www.twilio.com/docs/libraries/reference/twilio-node/"]')).toBeVisible();
    await expect(sharedPage.locator('.btn-group a[href*="https://www.twilio.com/docs/sms/debugging-tools"]')).toBeVisible();
    await expect(sharedPage.locator('.btn-group a[href*="https://www.twilio.com/docs/api/rest"]')).toBeVisible();

    await expect(sharedPage.locator('text=/Twilio Node/i')).toBeVisible();
    await expect(sharedPage.locator('text=/Twilio Debugging Tools/i')).toBeVisible();
    await expect(sharedPage.locator('text=/REST API/i')).toBeVisible();

    // Check for existence of form inputs
    const phoneNumberLabel = sharedPage.locator('label[for="number"]');
    await expect(phoneNumberLabel).toBeVisible();
    await expect(phoneNumberLabel).toContainText(/phone number/i);
    await expect(sharedPage.locator('input[name="number"]')).toBeVisible();

    const messageLabel = sharedPage.locator('label[for="message"]');
    await expect(messageLabel).toBeVisible();
    await expect(messageLabel).toContainText(/message/i);
    await expect(sharedPage.locator('input[name="message"]')).toBeVisible();

    const submitButton = sharedPage.locator('button[type="submit"]');
    await expect(submitButton).toBeVisible();
    await expect(submitButton).toContainText('Send Message');
  });

  test('should display warning and that no SMS will be sent', async () => {
    const warningDiv = sharedPage.locator('div.alert.alert-warning');
    await expect(warningDiv).toBeVisible();
    await expect(warningDiv).toContainText('Warning');

    // Check the "from" sandbox number
    await expect(warningDiv).toContainText(/\+15005550006/);
    await expect(warningDiv).toContainText(/no actual sms.*sent/i);

    // Check for existence of example numbers to text
    const secondaryDiv = sharedPage.locator('div.alert.alert-secondary');
    await expect(secondaryDiv).toBeVisible();
    await expect(secondaryDiv).toContainText('Example Numbers to Text');
  });

  // Data for simulation of sending messages with appropriate responses
  const testNumToResp = [
    { num: '+12345678900', response: 'sent successfully' }, // any valid US number
    { num: '+15005550006', response: 'sent successfully' },
    { num: '+15005550001', response: 'number is invalid' },
    { num: '+15005550002', response: 'cannot route a message' },
    { num: '+15005550003', response: 'cannot send international messages' },
    { num: '+15005550004', response: 'can not send messages to it' },
    { num: '+15005550009', response: 'number is incapable of receiving SMS messages' },
  ];

  for (const { num, response } of testNumToResp) {
    test(`test number ${num} should respond with: ${response}`, async ({ page }) => {
      // Navigate to Twilio API page
      await page.goto('/api/twilio');
      await page.waitForLoadState('networkidle');

      // Fill inputs and submit form
      await page.fill('input[name="number"]', num);
      await page.fill('input[name="message"]', 'Hello, from Twilio.');
      await page.click('button[type="submit"]');
      await page.waitForLoadState('networkidle');

      // Check for appropriate response
      const alertDiv = page.locator('div.alert.alert-dismissible');
      await expect(alertDiv).toBeVisible();
      await expect(alertDiv).toContainText(response);
    });
  }
});
