process.env.API_TEST_FILE = 'e2e/rag.e2e.test.js';
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');
const { registerTestInManifest, isInManifest } = require('../tools/fixture-helpers');

// Self-register this test in the manifest when recording
registerTestInManifest('e2e/rag.e2e.test.js');

// Skip this file during replay if it's not in the manifest
if (process.env.API_MODE === 'replay' && !isInManifest('e2e/rag.e2e.test.js')) {
  console.log('[fixtures] skipping e2e/rag.e2e.test.js as it is not in manifest for replay mode - 2 tests');
  test.skip(true, 'Not in manifest for replay mode');
}

/**
 * Create a minimal PDF file with ExampleCorp test data
 *
 * Note: This minimal PDF structure will trigger a "Warning: Indexing all PDF objects"
 * message from pdf.js during processing. This is expected and harmless - it simply means
 * the PDF lacks a standard XRef table, so pdf.js uses a fallback indexing method.
 * The PDF still processes correctly and the test works as intended.
 */
function writeMinimalPdf(filePath) {
  const text = `
ExampleCorp was founded in 2019.
Its headquarters are located in Seattle, Washington.

The company reported revenue of $12 million in 2023.
Net income for 2023 was $1.2 million.

ExampleCorp operates in the cloud services market.
Its primary competitors include AlphaCloud and NimbusCo.

In 2022, revenue was reported as $9 million.
The company does not operate in Europe.

This document contains no information about executive compensation.
Any claim about CEO salary is unsupported.
`.trim();

  const escaped = text.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');

  const pdf = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792]
   /Contents 4 0 R
   /Resources << /Font << /F1 5 0 R >> >>
>>
endobj
4 0 obj
<< /Length ${escaped.length + 73} >>
stream
BT
/F1 12 Tf
72 720 Td
(${escaped.replace(/\n/g, ') Tj\n0 -14 Td\n(')}) Tj
ET
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f
0000000010 00000 n
0000000060 00000 n
0000000117 00000 n
0000000275 00000 n
0000000450 00000 n
trailer
<< /Size 6 /Root 1 0 R >>
startxref
520
%%EOF`;

  fs.writeFileSync(filePath, pdf);
}

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

  test.afterAll(async () => {
    // Clean up MongoDB rag_chunks collection after all tests
    // Remove all documents that have fileName: 'test_examplecorp_fixture.pdf'
    const client = new MongoClient(process.env.MONGODB_URI);
    try {
      await client.connect();
      const db = client.db();
      const collection = db.collection('rag_chunks');
      const result = await collection.deleteMany({ fileName: 'test_examplecorp_fixture.pdf' });
      console.log(`Cleaned up ${result.deletedCount} documents from rag_chunks collection`);
    } catch (err) {
      console.error('Error cleaning up rag_chunks:', err);
    } finally {
      await client.close();
    }
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

  test('should ingest ExampleCorp PDF and answer revenue question', async ({ page }) => {
    // Increase timeout for this test due to 30 second wait for ingestion
    test.setTimeout(120000);

    // Create test PDF dynamically
    const ragInputDir = path.join(__dirname, '../../rag_input');
    const targetFile = path.join(ragInputDir, 'test_examplecorp_fixture.pdf');
    const ingestedFile = path.join(ragInputDir, 'ingested', 'test_examplecorp_fixture.pdf');

    // Ensure rag_input directory exists
    if (!fs.existsSync(ragInputDir)) {
      fs.mkdirSync(ragInputDir, { recursive: true });
    }

    // Create the PDF file with test data
    writeMinimalPdf(targetFile);

    try {
      // Navigate to RAG page
      await page.goto('/ai/rag');
      await page.waitForLoadState('networkidle');

      // Click the "Ingest Files" button
      const ingestBtn = page.locator('#ingest-btn');
      await expect(ingestBtn).toBeVisible();
      await ingestBtn.click();

      // Wait for ingestion to complete (redirect back to page)
      await page.waitForLoadState('networkidle');

      // Verify ingestion was successful (info messages use .alert-primary, not .alert-info)
      const successAlert = page.locator('.alert-success, .alert-primary');
      const errorAlert = page.locator('.alert-danger');

      await expect(successAlert.or(errorAlert)).toBeVisible({ timeout: 5000 });

      // If there's an error, fail with the error message
      if ((await errorAlert.count()) > 0) {
        const errorText = await errorAlert.textContent();
        throw new Error(`Ingestion failed: ${errorText}`);
      }

      await expect(successAlert).toBeVisible();

      // Verify the file appears in the Ingested Files list
      const fileInList = page.locator('table.table-striped tbody tr td', { hasText: 'test_examplecorp_fixture.pdf' });
      await expect(fileInList).toBeVisible({ timeout: 5000 });

      // Poll for index readiness instead of blind wait
      // MongoDB Atlas Search indexes can take time to build after ingestion
      // We poll by attempting to ask a question and checking for "index is not ready" error
      let indexReady = false;
      const maxAttempts = 12; // 12 attempts * 5 seconds = 60 seconds max wait

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        console.log(`Checking index readiness (attempt ${attempt}/${maxAttempts})...`);

        // Fill in a test question
        await page.fill('#question', 'How much money ExampleCorp made in 2023');

        // Click the ask button
        await page.click('#ask-btn');

        // Wait for response to load
        await page.waitForLoadState('networkidle');

        // Check if we got an "index is not ready" error
        const errorAlert = page.locator('.alert-danger');
        if ((await errorAlert.count()) > 0) {
          const errorText = await errorAlert.textContent();
          if (errorText.includes('index is not ready') || errorText.includes('not ready')) {
            console.log(`Index not ready yet: ${errorText.substring(0, 100)}...`);
            if (attempt < maxAttempts) {
              // Wait 5 seconds before next attempt
              await page.waitForTimeout(5000);
              // Navigate back to RAG page to try again
              await page.goto('/ai/rag');
              await page.waitForLoadState('networkidle');
              continue;
            }
          } else {
            // Different error - fail immediately
            throw new Error(`Unexpected error: ${errorText}`);
          }
        } else {
          // No error - index is ready and we got a response
          console.log('Index is ready!');
          indexReady = true;
          break;
        }
      }

      if (!indexReady) {
        throw new Error('Index did not become ready within the timeout period');
      }

      // At this point, we have a response on the page from the polling loop above
      // Verify we got a valid response
      const ragResponseBox = page.locator('.response-box').first();
      const hasResponse = (await ragResponseBox.count()) > 0;
      expect(hasResponse).toBeTruthy();

      // Verify the RAG response contains the expected values ($12 and $1.2)
      const ragResponsePre = page.locator('.response-box pre').first();
      await expect(ragResponsePre).toBeVisible();
      const ragResponseText = await ragResponsePre.textContent();
      expect(ragResponseText).toContain('$12');
      expect(ragResponseText).toContain('$1.2');

      // Verify the No-RAG LLM Response is present (the system shows both responses)
      const noRagResponseBoxes = page.locator('.response-box');
      expect(await noRagResponseBoxes.count()).toBeGreaterThanOrEqual(2);

      // The second response box is the No-RAG response
      // It should NOT contain the specific dollar amounts from the PDF since it doesn't have RAG context
      const noRagResponsePre = noRagResponseBoxes.nth(1).locator('pre');
      await expect(noRagResponsePre).toBeVisible();
      const noRagResponseText = await noRagResponsePre.textContent();

      // The No-RAG response should not have the specific ExampleCorp data
      expect(noRagResponseText).not.toContain('$12');
      expect(noRagResponseText).not.toContain('$1.2');
    } finally {
      // Clean up: remove the test file from rag_input if still there
      if (fs.existsSync(targetFile)) {
        fs.unlinkSync(targetFile);
      }
      // Clean up: remove the file from ingested directory
      if (fs.existsSync(ingestedFile)) {
        fs.unlinkSync(ingestedFile);
      }
    }
  });
});
