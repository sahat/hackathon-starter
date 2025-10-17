const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

test.describe('RAG File Upload Integration', () => {
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

  test('should navigate to RAG page and display basic elements', async ({ page }) => {
    // Navigate to RAG page
    await page.goto('/ai/rag');
    await page.waitForLoadState('networkidle');

    // Basic page checks
    await expect(page).toHaveTitle(/Retrieval-Augmented Generation/);
    await expect(page.locator('h2')).toContainText('Retrieval-Augmented Generation (RAG)');

    // Check for main sections
    await expect(page.locator('text=Ingested Files')).toBeVisible();
    await expect(page.locator('text=Ask a Question')).toBeVisible();

    // Check for ingest button
    await expect(page.locator('#ingest-btn')).toBeVisible();
    await expect(page.locator('#ingest-btn')).toContainText('Ingest Files');

    // Check for ask button
    await expect(page.locator('#ask-btn')).toBeVisible();
    await expect(page.locator('#ask-btn')).toContainText('Ask');

    // Check for external API links
    await expect(page.locator('a[href*="together.ai"]')).toBeVisible();
    await expect(page.locator('a[href*="huggingface.co"]')).toBeVisible();
    await expect(page.locator('a[href*="mongodb.com"]')).toBeVisible();
    await expect(page.locator('a[href*="langchain.com"]')).toBeVisible();
  });

  test('should handle empty directory ingestion', async ({ page }) => {
    // Ensure no test files exist in RAG input or ingested directories
    cleanupTestFiles();

    // Navigate to RAG page
    await page.goto('/ai/rag');
    await page.waitForLoadState('networkidle');

    // Click ingest button with no files
    await page.click('#ingest-btn');
    await page.waitForLoadState('networkidle');

    // Wait for flash messages to render
    await page.waitForTimeout(1000);

    // Expect informational alert indicating no PDF files found
    // Note: Info messages use .alert-primary in this app
    const infoAlert = page.locator('.alert-primary');

    // Confirm presence of informational feedback
    const hasInfo = (await infoAlert.count()) > 0;

    // An info alert should be present when no files are found
    expect(hasInfo).toBeTruthy();
    await expect(infoAlert).toBeVisible();
    await expect(infoAlert).toContainText(/No PDF files found/i);
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

  test('should handle question submission with no ingested files', async ({ page }) => {
    // Ensure no ingested/indexed files exist by cleaning test directories
    cleanupTestFiles();

    // Navigate to RAG page
    await page.goto('/ai/rag');
    await page.waitForLoadState('networkidle');

    // Fill in a question
    await page.fill('#question', 'What is the content of the documents?');

    // Submit question
    await page.click('#ask-btn');
    await page.waitForLoadState('networkidle');

    // Expect error alert about missing indexed files for RAG
    const errorAlert = page.locator('.alert-danger');
    await expect(errorAlert).toBeVisible();
    await expect(errorAlert).toContainText(/No files have been indexed for RAG/i);
  });
});
