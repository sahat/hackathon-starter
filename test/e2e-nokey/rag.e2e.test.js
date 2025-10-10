const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

test.describe('RAG File Upload Integration', () => {
  // Helper function to clean up test files
  const cleanupTestFiles = () => {
    const ragInputDir = path.join(__dirname, '../../rag_input');
    const ingestedDir = path.join(ragInputDir, 'ingested');

    // Clean up test files from both directories
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
    // Clean up any existing test files before each test
    cleanupTestFiles();
  });

  test.afterEach(async () => {
    // Clean up test files after each test
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
    // Ensure rag_input directory is empty
    cleanupTestFiles();

    // Navigate to RAG page
    await page.goto('/ai/rag');
    await page.waitForLoadState('networkidle');

    // Click ingest button with no files
    await page.click('#ingest-btn');
    await page.waitForLoadState('networkidle');

    // Wait for any alert to appear and check for flash messages
    await page.waitForTimeout(1000); // Give time for flash messages to render

    // Should show info message about no files or success message
    // Note: Info messages use .alert-primary class in this app
    const infoAlert = page.locator('.alert-primary');

    // Check for any kind of feedback message
    const hasInfo = (await infoAlert.count()) > 0;

    // At least one type of alert should be present
    expect(hasInfo).toBeTruthy();
    await expect(infoAlert).toBeVisible();
    await expect(infoAlert).toContainText(/No PDF files found/i);
  });

  test('should validate question submission functionality', async ({ page }) => {
    // Navigate to RAG page
    await page.goto('/ai/rag');
    await page.waitForLoadState('networkidle');

    // Clear the question textarea to ensure it's empty and bypass client-side validation
    await page.fill('#question', '');

    // Remove the required attribute to bypass client-side validation and test server-side validation
    await page.evaluate(() => {
      const questionField = document.getElementById('question');
      if (questionField) {
        questionField.removeAttribute('required');
      }
    });

    // Try to submit empty question by clicking the ask button
    await page.click('#ask-btn');

    // Wait for redirect to complete and flash messages to render
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000); // Increased wait time for flash message rendering

    const errorAlert = page.locator('.alert-danger');

    // Check if any error alert is present
    const hasError = (await errorAlert.count()) > 0;

    // At least one type of alert should be present for validation feedback
    expect(hasError).toBeTruthy();
    await expect(errorAlert).toBeVisible();
    await expect(errorAlert).toContainText(/Please enter a question./i);
  });

  test('should handle question submission with no ingested files', async ({ page }) => {
    // Ensure no files are ingested
    cleanupTestFiles();

    // Navigate to RAG page
    await page.goto('/ai/rag');
    await page.waitForLoadState('networkidle');

    // Fill in a question
    await page.fill('#question', 'What is the content of the documents?');

    // Submit question
    await page.click('#ask-btn');
    await page.waitForLoadState('networkidle');

    // Should show error about no indexed files
    const errorAlert = page.locator('.alert-danger');
    await expect(errorAlert).toBeVisible();
    await expect(errorAlert).toContainText(/No files have been indexed for RAG/i);
  });
});
