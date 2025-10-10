const { test , expect } = require("@playwright/test");

const testNumbers = [
  { number: "+15005550006", description: "Valid test number" },
  { number: "+15005550001", description: "Invalid number" },
  { number: "+15005550002", description: "Cannot route SMS" },
  { number: "+15005550003", description: "International permissions missing" },
  { number: "+15005550004", description: "Blocked number" },
  { number: "+15005550009", description: "Incapable of receiving SMS" },
];

let twilioConfigured = false;


test.describe('Twilio API Integration',async ()=> {

    test.beforeEach(async ({ page }) => {
        // Navigate to Twilio API Integration Page
        await page.goto("/api/twilio");
        await page.waitForLoadState("networkidle");

        // Basic page checks
        await expect(page).toHaveTitle(/Twilio API/);
        await expect(page.locator('h2')).toContainText('Twilio API');

        if(!twilioConfigured) {

            // Verify whether TWILIO_FROM_NUMBER is defined

            const infoAlert = page.locator("div.alert.alert-info");
            const isVisible = await infoAlert.isVisible({ timeout: 5000 }).catch(() => false);

            if (isVisible) {
            const text = await infoAlert.textContent();
            if (text.includes("undefined")) {
                twilioConfigured = false;
                throw new Error(`Twilio sender number is undefined! Alert text: "${text.trim()}"`);
            }
            }
            else {
                twilioConfigured = true;
                console.log("Twilio From Number is Configured");
            }

            // Verify whether TWILIO_SID And TWILIO_TOKEN are configured

            const numberInput = page.locator('input[name="number"]');
            await numberInput.fill('+15005550006');
            await expect(numberInput).toHaveValue('+15005550006');

            const messageInput = page.locator('input[name="message"]');
            await messageInput.fill('Test Message');
            await expect(messageInput).toHaveValue('Test Message');

            const submitButton = page.locator('button[type="submit"]');
            await submitButton.click();

            await page.waitForLoadState('networkidle');


            const alert = page.locator('div.alert.alert-danger');
            const isError = await alert.isVisible({ timeout: 5000 }).catch(() => false);

            if (isError) {
                const text = await alert.textContent();
                await expect(alert).toBeVisible();
                twilioConfigured = false;
                throw new Error(`Twilio Credentials are not configured Alert text: "${text.trim()}"`);
            } else {
                twilioConfigured = true;
                console.log('Twilio Credentials are Configured');
            }
            twilioConfigured = true;
        }
    });


    for (const testNumber of testNumbers) {
        test(`Send SMS to ${testNumber.number} (${testNumber.description})`, async ({ page }) => {
            test.skip(!twilioConfigured, 'Twilio not configured, skipping test.');

            const numberInput = page.locator('input[name="number"]');
            await numberInput.fill(testNumber.number);
            await expect(numberInput).toHaveValue(testNumber.number);

            const messageInput = page.locator('input[name="message"]');
            await messageInput.fill('Playwright test message');
            await expect(messageInput).toHaveValue('Playwright test message');

            const submitButton = page.locator('button[type="submit"]');
            await submitButton.click();

            await page.waitForLoadState("networkidle");

            // Check for ERROR alert
            const errorAlert = page.locator("div.alert.alert-danger");
            const isError = await errorAlert.isVisible({ timeout: 5000 }).catch(() => false);

            if (isError) {
                const text = await errorAlert.textContent();
                console.log(`Alert for [${ testNumber.description }] - (${ testNumber.number }):`, text.trim());
                await expect(errorAlert).toBeVisible();
            } else {
                // Check for SUCCESS alert
                const successAlert = page.locator("div.alert.alert-success");
                const isSuccess = await successAlert.isVisible({ timeout: 2000 }).catch(() => false);
                if (isSuccess) {
                const text = await successAlert.textContent();
                console.log(`Success for ${testNumber.number}:`, text.trim());
                }
                // If no ALERT shown
                else {
                console.log(`No alert shown for ${testNumber.number}`);
                }
            }
        });
    }

})