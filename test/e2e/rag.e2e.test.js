const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

test.describe('RAG Integration End-to-End Tests', () => {
  test.describe.configure({ mode: 'serial' });

  // RAG tests require MongoDB Atlas (not memory server) for vector search indexes
  let sharedPage;

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

  // Helper to copy fixture PDF to rag_input directory
  const setupTestPdf = (fixtureName, targetName) => {
    const fixturesDir = path.join(__dirname, 'fixtures');
    const ragInputDir = path.join(__dirname, '../../rag_input');

    // Ensure directory exists
    if (!fs.existsSync(ragInputDir)) {
      fs.mkdirSync(ragInputDir, { recursive: true });
    }

    const sourcePath = path.join(fixturesDir, fixtureName);
    const targetPath = path.join(ragInputDir, targetName);

    // Copy the fixture PDF
    fs.copyFileSync(sourcePath, targetPath);
    return targetPath;
  };

  test.beforeAll(async ({ browser }, testInfo) => {
    if (!process.env.MONGODB_URI) {
      testInfo.skip();
    }
    sharedPage = await browser.newPage();
    cleanupTestFiles();
  });

  test.afterAll(async () => {
    if (sharedPage) await sharedPage.close();
    cleanupTestFiles();
  });

  test.beforeEach(async () => {
    cleanupTestFiles();
  });

  test.describe('File Ingestion', () => {
    test('should show message when no PDF files are available for ingestion', async () => {
      await sharedPage.goto('/ai/rag');
      await sharedPage.waitForLoadState('networkidle');

      const ingestButton = sharedPage.locator('#ingest-btn');
      await ingestButton.click();
      await sharedPage.waitForLoadState('networkidle');

      const infoAlert = sharedPage.locator('.alert-primary');
      await expect(infoAlert).toBeVisible({ timeout: 5000 });
      await expect(infoAlert).toContainText('No PDF files found in the input directory');
    });

    test('should successfully ingest a valid PDF file', async () => {
      const testFileName = 'test-rag-content.pdf';
      setupTestPdf('rag-test-content.pdf', testFileName);

      await sharedPage.goto('/ai/rag');
      await sharedPage.waitForLoadState('networkidle');

      const ingestButton = sharedPage.locator('#ingest-btn');
      await ingestButton.click();
      await sharedPage.waitForLoadState('networkidle');

      const successAlert = sharedPage.locator('.alert-success');
      await expect(successAlert).toBeVisible({ timeout: 30000 });
      await expect(successAlert).toContainText('Successfully ingested');
      await expect(successAlert).toContainText(testFileName);

      const ingestedFilesList = sharedPage.locator('table.table tbody tr td');
      await expect(ingestedFilesList).toContainText(testFileName);
    });

    test('should skip already ingested files', async () => {
      const testFileName = 'test-skip-document.pdf';
      setupTestPdf('rag-test-content.pdf', testFileName);

      await sharedPage.goto('/ai/rag');
      await sharedPage.waitForLoadState('networkidle');

      // First ingestion
      await sharedPage.locator('#ingest-btn').click();
      await sharedPage.waitForLoadState('networkidle');

      const firstSuccess = sharedPage.locator('.alert-success');
      await expect(firstSuccess).toBeVisible({ timeout: 30000 });

      // Second ingestion attempt
      await sharedPage.locator('#ingest-btn').click();
      await sharedPage.waitForLoadState('networkidle');

      const infoAlert = sharedPage.locator('.alert-primary');
      await expect(infoAlert).toBeVisible({ timeout: 5000 });
      await expect(infoAlert).toContainText('No new files to ingest');
      await expect(infoAlert).toContainText('already been processed');
    });
  });

  test.describe('Question Asking', () => {
    test('should validate empty question submission', async () => {
      await sharedPage.goto('/ai/rag');
      await sharedPage.waitForLoadState('networkidle');

      await sharedPage.evaluate(() => {
        const form = document.querySelector('form[action="/ai/rag/ask"]');
        const questionField = document.getElementById('question');
        if (questionField) {
          questionField.value = '';
          questionField.removeAttribute('required');
        }
        if (form) {
          form.submit();
        }
      });

      await sharedPage.waitForLoadState('networkidle');

      const errorAlert = sharedPage.locator('.alert-danger');
      await expect(errorAlert).toBeVisible({ timeout: 5000 });
      await expect(errorAlert).toContainText('Please enter a question');
    });

    test('should show error when asking question without ingested files', async () => {
      await sharedPage.goto('/ai/rag');
      await sharedPage.waitForLoadState('networkidle');

      await sharedPage.fill('#question', 'What is the meaning of life?');
      await sharedPage.click('#ask-btn');
      await sharedPage.waitForLoadState('networkidle');

      const errorAlert = sharedPage.locator('.alert-danger');
      await expect(errorAlert).toBeVisible({ timeout: 5000 });
      await expect(errorAlert).toContainText('No files have been indexed for RAG');
    });

    test('should successfully process question and show RAG and non-RAG responses', async () => {
      const testFileName = 'test-question-content.pdf';
      setupTestPdf('rag-test-content.pdf', testFileName);

      await sharedPage.goto('/ai/rag');
      await sharedPage.waitForLoadState('networkidle');

      // Ingest the file first
      await sharedPage.locator('#ingest-btn').click();
      await sharedPage.waitForLoadState('networkidle');
      await expect(sharedPage.locator('.alert-success')).toBeVisible({ timeout: 30000 });

      // Now ask a question
      const question = 'What is the answer to life, the universe, and everything?';
      await sharedPage.fill('#question', question);
      await sharedPage.click('#ask-btn');
      await sharedPage.waitForLoadState('networkidle');

      // Check that question is displayed
      await expect(sharedPage.locator('strong')).toContainText('Question Asked:');
      await expect(sharedPage.locator('strong')).toContainText(question);

      // Check that both RAG and non-RAG responses are shown
      const ragResponseSection = sharedPage.locator('h3').filter({ hasText: 'RAG LLM Response' });
      const llmResponseSection = sharedPage.locator('h3').filter({ hasText: 'No-RAG LLM Response' });

      await expect(ragResponseSection).toBeVisible({ timeout: 60000 });
      await expect(llmResponseSection).toBeVisible({ timeout: 60000 });

      // Check that response boxes contain content
      const ragResponseBox = sharedPage.locator('.response-box').first();
      const llmResponseBox = sharedPage.locator('.response-box').last();

      await expect(ragResponseBox).toBeVisible();
      await expect(llmResponseBox).toBeVisible();

      const ragText = await ragResponseBox.textContent();
      const llmText = await llmResponseBox.textContent();
      expect(ragText.trim().length).toBeGreaterThan(0);
      expect(llmText.trim().length).toBeGreaterThan(0);
    });

    test('should handle question maxlength limit', async () => {
      await sharedPage.goto('/ai/rag');
      await sharedPage.waitForLoadState('networkidle');

      const longQuestion = 'A'.repeat(600);
      await sharedPage.fill('#question', longQuestion);

      const inputValue = await sharedPage.locator('#question').inputValue();
      expect(inputValue.length).toBeLessThanOrEqual(500);
    });
  });
});
