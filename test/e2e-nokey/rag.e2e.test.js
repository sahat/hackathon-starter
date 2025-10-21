const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

test.describe('RAG File Upload Integration', () => {
  test.describe.configure({ mode: 'serial' });
  // Helper to remove 'test-*' files from RAG input and 'ingested' dirs
  const cleanupTestFiles = () => {
    const ragInputDir = path.join(__dirname, '../../rag_input');
    const ingestedDir = path.join(ragInputDir, 'ingested');

    // Remove any test artifacts in both directories
    [ragInputDir, ingestedDir].forEach((dir) => {
      if (fs.existsSync(dir)) {
        const files = fs.readdirSync(dir).filter((f) => f.startsWith('test-'));
        files.forEach((file) => {
          const filePath = path.join(dir, file);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        });
      }
    });
  };

  test.beforeEach(async () => {
    // Ensure a clean slate before each test run
    cleanupTestFiles();
  });

  test.afterEach(async () => {
    // Remove test artifacts after each test to keep state isolated
    cleanupTestFiles();
  });

  test('should validate question submission functionality', async ({ page }) => {
    // Navigate to RAG page
    await page.goto('/ai/rag');
    await page.waitForLoadState('networkidle');

    // Set empty value and remove 'required' to exercise server-side validation
    await page.fill('#question', '');

    // Remove the required attribute to bypass client-side validation
    await page.evaluate(() => {
      const questionField = document.getElementById('question');
      if (questionField) {
        questionField.removeAttribute('required');
      }
    });

    // Try to submit empty question by clicking the ask button
    await page.click('#ask-btn');

    // Wait for redirect to complete and for flash messages to render
    await page.waitForLoadState('networkidle');

    const errorAlert = page.locator('.alert-danger');

    await expect(errorAlert).toBeVisible({ timeout: 3000 });

    // Locate server-side validation error alert
    const hasError = (await errorAlert.count()) > 0;

    // Ensure error alert appears with expected validation message
    expect(hasError).toBeTruthy();
    await expect(errorAlert).toBeVisible();
    await expect(errorAlert).toContainText(/Please enter a question./i);
  });
});
