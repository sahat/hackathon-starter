const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

test.describe('File Upload API Integration', () => {
  test.describe.configure({ mode: 'serial' });
  let sharedPage;

  test.beforeAll(async ({ browser }) => {
    sharedPage = await browser.newPage();
    await sharedPage.goto('/api/upload');
    await sharedPage.waitForLoadState('networkidle');
  });

  test.afterAll(async () => {
    if (sharedPage) await sharedPage.close();
  });

  test('should upload a small file successfully', async () => {
    // Create a small test file in project 'tmp/' (gitignored)
    const tmpDir = path.join(__dirname, '../../tmp');
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }
    const testContent = 'This is a test file for upload functionality.';
    const testFilePath = path.join(tmpDir, 'small-test.txt');
    const uploadsDir = path.join(__dirname, '../../uploads');
    const beforeFiles = fs.existsSync(uploadsDir) ? new Set(fs.readdirSync(uploadsDir)) : new Set();
    let uploadedFilePath = null;

    try {
      fs.writeFileSync(testFilePath, testContent);

      // Verify CSRF token is present
      const csrfInput = sharedPage.locator('input[name="_csrf"]');
      await expect(csrfInput).toBeAttached();

      // Upload the file
      const fileInput = sharedPage.locator('input[type="file"][name="myFile"]');
      await fileInput.setInputFiles(testFilePath);

      // Submit form and wait for response
      const [response] = await Promise.all([sharedPage.waitForResponse((response) => response.url().includes('/api/upload') && response.request().method() === 'POST'), sharedPage.click('button[type="submit"]')]);

      // Verify redirect response
      expect(response.status()).toBe(302);

      // Wait for redirect to complete
      await sharedPage.waitForURL('/api/upload');
      await sharedPage.waitForLoadState('networkidle');

      // Check for success message
      const successAlert = sharedPage.locator('.alert.alert-success');
      await expect(successAlert).toBeVisible({ timeout: 10000 });
      await expect(successAlert).toContainText(/uploaded successfully/i);

      // Verify the uploaded file exists in 'uploads/' and matches content
      const afterFilesList = fs.existsSync(uploadsDir) ? fs.readdirSync(uploadsDir) : [];
      const newFiles = afterFilesList.filter((f) => !beforeFiles.has(f));
      expect(newFiles.length).toBeGreaterThan(0);

      const matchedFileName = newFiles.find((f) => {
        try {
          const content = fs.readFileSync(path.join(uploadsDir, f), 'utf8');
          return content === testContent;
        } catch {
          return false;
        }
      });
      expect(matchedFileName).toBeTruthy();
      uploadedFilePath = matchedFileName ? path.join(uploadsDir, matchedFileName) : null;
    } finally {
      // Clean up test file
      if (fs.existsSync(testFilePath)) {
        fs.unlinkSync(testFilePath);
      }
      // Clean up uploaded artifact for isolation
      if (uploadedFilePath && fs.existsSync(uploadedFilePath)) {
        fs.unlinkSync(uploadedFilePath);
      }
    }
  });

  test('should handle file size limit exceeded error', async () => {
    // Create a file larger than 1MB (1024 * 1024 bytes)
    const largeContent = 'A'.repeat(1024 * 1024 + 1000); // Slightly over 1MB
    const largeFilePath = path.join(__dirname, '../../tmp/large-test-file.txt');

    // Clean up any existing test file
    if (fs.existsSync(largeFilePath)) {
      fs.unlinkSync(largeFilePath);
    }

    fs.writeFileSync(largeFilePath, largeContent);

    try {
      // Verify CSRF token is present
      const csrfInput = sharedPage.locator('input[name="_csrf"]');
      await expect(csrfInput).toBeAttached();

      // Upload the large file
      const fileInput = sharedPage.locator('input[type="file"][name="myFile"]');
      await fileInput.setInputFiles(largeFilePath);

      // Submit form and wait for response
      const [response] = await Promise.all([sharedPage.waitForResponse((response) => response.url().includes('/api/upload') && response.request().method() === 'POST'), sharedPage.click('button[type="submit"]')]);

      // Verify redirect response
      expect(response.status()).toBe(302);

      // Wait for redirect to complete
      await sharedPage.waitForURL('/api/upload');
      await sharedPage.waitForLoadState('networkidle');

      // Check for error message about file size
      const errorAlert = sharedPage.locator('.alert.alert-danger');
      await expect(errorAlert).toBeVisible({ timeout: 10000 });
      await expect(errorAlert).toContainText(/file size.*too large.*1MB/i);
    } finally {
      // Clean up test file
      if (fs.existsSync(largeFilePath)) {
        fs.unlinkSync(largeFilePath);
      }
    }
  });

  test('should handle form submission without file', async () => {
    // Verify CSRF token is present
    const csrfInput = sharedPage.locator('input[name="_csrf"]');
    await expect(csrfInput).toBeAttached();

    // Submit form and wait for response
    const [response] = await Promise.all([sharedPage.waitForResponse((response) => response.url().includes('/api/upload') && response.request().method() === 'POST'), sharedPage.click('button[type="submit"]')]);

    // Verify redirect response
    expect(response.status()).toBe(302);

    // Wait for redirect to complete
    await sharedPage.waitForURL('/api/upload');
    await sharedPage.waitForLoadState('networkidle');

    // Should redirect back to upload page (no file selected is handled gracefully)
    await expect(sharedPage.locator('h2')).toContainText('File Upload');
  });

  test('should maintain CSRF protection', async () => {
    // Verify CSRF token is present
    const csrfInput = sharedPage.locator('input[name="_csrf"]');
    await expect(csrfInput).toBeAttached(); // CSRF is hidden, so check for presence

    const csrfValue = await csrfInput.getAttribute('value');
    expect(csrfValue).toBeTruthy();
    expect(csrfValue.length).toBeGreaterThan(0);

    // Verify form has correct enctype for file uploads
    const form = sharedPage.locator('form[enctype="multipart/form-data"]');
    await expect(form).toBeVisible();
    await expect(form).toHaveAttribute('method', 'POST');
  });

  test('should handle upload with maximum allowed file size', async () => {
    // Create tmp directory if it doesn't exist
    const tmpDir = path.join(__dirname, '../../tmp');
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }

    // Create a file very close to 1MB limit (1024 * 1024 bytes)
    const maxContent = 'A'.repeat(1024 * 1024 - 100); // Slightly under 1MB to account for headers
    const maxFilePath = path.join(tmpDir, 'max-size-test.txt');
    const uploadsDir = path.join(__dirname, '../../uploads');
    const beforeFiles = fs.existsSync(uploadsDir) ? new Set(fs.readdirSync(uploadsDir)) : new Set();
    let uploadedFilePath = null;

    try {
      fs.writeFileSync(maxFilePath, maxContent);

      // Verify CSRF token is present
      const csrfInput = sharedPage.locator('input[name="_csrf"]');
      await expect(csrfInput).toBeAttached();

      // Upload the file
      const fileInput = sharedPage.locator('input[type="file"][name="myFile"]');
      await fileInput.setInputFiles(maxFilePath);

      // Submit form and wait for response
      const [response] = await Promise.all([sharedPage.waitForResponse((response) => response.url().includes('/api/upload') && response.request().method() === 'POST'), sharedPage.click('button[type="submit"]')]);

      // Verify redirect response
      expect(response.status()).toBe(302);

      // Wait for redirect to complete
      await sharedPage.waitForURL('/api/upload');
      await sharedPage.waitForLoadState('networkidle');

      // Check for success message (should work for files at the limit)
      const successAlert = sharedPage.locator('.alert.alert-success');
      await expect(successAlert).toBeVisible({ timeout: 10000 });
      await expect(successAlert).toContainText(/uploaded successfully/i);

      // Verify the uploaded file exists in 'uploads/' and matches content
      const afterFilesList = fs.existsSync(uploadsDir) ? fs.readdirSync(uploadsDir) : [];
      const newFiles = afterFilesList.filter((f) => !beforeFiles.has(f));
      expect(newFiles.length).toBeGreaterThan(0);

      // Find the uploaded file by matching content
      const matchedFileName = newFiles.find((f) => {
        try {
          const uploadedContent = fs.readFileSync(path.join(uploadsDir, f), 'utf8');
          return uploadedContent === maxContent;
        } catch {
          return false;
        }
      });

      expect(matchedFileName).toBeTruthy();

      if (matchedFileName) {
        uploadedFilePath = path.join(uploadsDir, matchedFileName);

        // Verify content matches exactly
        const uploadedContent = fs.readFileSync(uploadedFilePath, 'utf8');
        expect(uploadedContent).toBe(maxContent);
      }
    } finally {
      // Clean up test file from tmp/ directory
      if (fs.existsSync(maxFilePath)) {
        fs.unlinkSync(maxFilePath);
      }
      // Clean up uploaded artifact for isolation
      if (uploadedFilePath && fs.existsSync(uploadedFilePath)) {
        fs.unlinkSync(uploadedFilePath);
      }
    }
  });

  test('should upload different file types', async () => {
    // Define different file types to test
    const fileTypes = [
      {
        name: 'test-file.txt',
        content: 'This is a plain text file for testing upload functionality.',
        mimeType: 'text/plain',
      },
      {
        name: 'test-data.json',
        content: JSON.stringify({ message: 'Hello World', timestamp: new Date().toISOString(), data: [1, 2, 3] }, null, 2),
        mimeType: 'application/json',
      },
      {
        name: 'test-data.csv',
        content: 'Name,Age,City\nJohn Doe,30,New York\nJane Smith,25,Los Angeles\nBob Johnson,35,Chicago',
        mimeType: 'text/csv',
      },
      {
        name: 'test-config.xml',
        content: '<?xml version="1.0" encoding="UTF-8"?>\n<config>\n  <setting name="debug">true</setting>\n  <setting name="timeout">5000</setting>\n</config>',
        mimeType: 'application/xml',
      },
    ];

    // Create tmp directory if it doesn't exist
    const tmpDir = path.join(__dirname, '../../tmp');
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }

    const uploadsDir = path.join(__dirname, '../../uploads');
    const beforeFiles = fs.existsSync(uploadsDir) ? new Set(fs.readdirSync(uploadsDir)) : new Set();
    const createdFiles = [];
    const uploadedFiles = [];

    try {
      // Test each file type
      for (const fileType of fileTypes) {
        const testFilePath = path.join(tmpDir, fileType.name);

        // Create test file in tmp/ directory
        fs.writeFileSync(testFilePath, fileType.content);
        createdFiles.push(testFilePath);

        // Verify CSRF token is present
        const csrfInput = sharedPage.locator('input[name="_csrf"]');
        await expect(csrfInput).toBeAttached();

        // Upload the file
        const fileInput = sharedPage.locator('input[type="file"][name="myFile"]');
        await fileInput.setInputFiles(testFilePath);

        // Submit form and wait for response
        const [response] = await Promise.all([sharedPage.waitForResponse((response) => response.url().includes('/api/upload') && response.request().method() === 'POST'), sharedPage.click('button[type="submit"]')]);

        // Verify redirect response
        expect(response.status()).toBe(302);

        // Wait for redirect to complete
        await sharedPage.waitForURL('/api/upload');
        await sharedPage.waitForLoadState('networkidle');

        // Check for success message
        const successAlert = sharedPage.locator('.alert.alert-success');
        await expect(successAlert).toBeVisible({ timeout: 10000 });
        await expect(successAlert).toContainText(/uploaded successfully/i);

        // Verify the uploaded file exists in 'uploads/' and matches content
        const afterFilesList = fs.existsSync(uploadsDir) ? fs.readdirSync(uploadsDir) : [];
        const newFiles = afterFilesList.filter((f) => !beforeFiles.has(f));
        expect(newFiles.length).toBeGreaterThan(0);

        // Find the uploaded file by matching content
        const matchedFileName = newFiles.find((f) => {
          try {
            const uploadedContent = fs.readFileSync(path.join(uploadsDir, f), 'utf8');
            return uploadedContent === fileType.content;
          } catch {
            return false;
          }
        });

        expect(matchedFileName).toBeTruthy();

        if (matchedFileName) {
          const uploadedFilePath = path.join(uploadsDir, matchedFileName);
          uploadedFiles.push(uploadedFilePath);

          // Verify content matches exactly
          const uploadedContent = fs.readFileSync(uploadedFilePath, 'utf8');
          expect(uploadedContent).toBe(fileType.content);

          // Update beforeFiles set for next iteration
          beforeFiles.add(matchedFileName);
        }
      }
    } finally {
      // Clean up test files from tmp/ directory
      createdFiles.forEach((filePath) => {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      });

      // Clean up uploaded files for test isolation
      uploadedFiles.forEach((filePath) => {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      });
    }
  });
});
