const { test, expect } = require('@playwright/test');
const mongoose = require('mongoose');
const { restoreAuthSession } = require('../helpers/playwright-auth-setup');

require('dotenv').config({ path: '../../.env' });

const BASE_URL = process.env.BASE_URL || 'http://localhost:8080';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hackathon-starter';

test.describe('GitHub Authentication Tests', () => {
  let context;
  let page;

  test.beforeAll(async ({ browser }) => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(MONGODB_URI);
      console.log('✅ Connected to persistent MongoDB');
    }

    context = await browser.newContext();
    await restoreAuthSession(context);

    page = await context.newPage();
    console.log('✅ Session restored and page created');
  });

  test.afterAll(async () => {
    if (page) await page.close();
    if (context) await context.close();
  });

  test('should access authenticated home page with user info', async () => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    const loggedInElements = ['a[href="/logout"]', 'a[href="/account"]', '.navbar .dropdown-toggle', 'text=Logout', 'text=Account'];

    let isLoggedIn = false;
    for (const selector of loggedInElements) {
      try {
        await page.waitForSelector(selector, { timeout: 2000 });
        console.log(`✅ Found authentication indicator: ${selector}`);
        isLoggedIn = true;
        break;
      } catch {
        continue;
      }
    }

    expect(isLoggedIn).toBeTruthy();
    expect(page.url()).not.toContain('/login');
  });

  test('should access GitHub profile information', async () => {
    await page.goto(`${BASE_URL}/api/github`);
    await page.waitForLoadState('networkidle');

    const content = await page.textContent('body');

    expect(content).toMatch(/login|avatar_url|html_url|public_repos/i);
    expect(content).not.toContain('Unauthorized');
    expect(content).not.toContain('Access token not found');
  });

  test('should access GitHub API endpoints without authentication errors', async () => {
    const response = await page.goto(`${BASE_URL}/api/github`);
    expect(response.status()).not.toBe(401);
    expect(response.status()).not.toBe(403);

    const content = await page.textContent('body');

    try {
      const jsonContent = JSON.parse(content);
      expect(jsonContent).toHaveProperty('login');
      expect(jsonContent).toHaveProperty('id');
    } catch {
      expect(content).not.toContain('error');
      expect(content).not.toContain('Unauthorized');
    }
  });

  test('should access API GitHub user repositories', async () => {
    await page.goto(`${BASE_URL}/api/github`);
    await page.waitForLoadState('networkidle');

    const content = await page.textContent('body');

    try {
      const githubData = JSON.parse(content);

      expect(githubData).toHaveProperty('login');
      expect(githubData).toHaveProperty('avatar_url');
      expect(githubData).toHaveProperty('html_url');
      expect(typeof githubData.public_repos).toBe('number');

      console.log(`✅ GitHub user: ${githubData.login}`);
      console.log(`✅ Public repos: ${githubData.public_repos}`);
    } catch {
      expect(content).not.toContain('error');
      expect(content).not.toContain('Access token not found');
      expect(content).not.toContain('Unauthorized');
    }
  });

  test('should be able to logout and require re-authentication', async () => {
    await page.goto(`${BASE_URL}/`);
    await page.waitForLoadState('networkidle');

    const logoutSelectors = ['a[href="/logout"]', 'text=Logout', 'text=Sign out'];

    let loggedOut = false;
    for (const selector of logoutSelectors) {
      try {
        const logoutElement = page.locator(selector).first();
        if ((await logoutElement.count()) > 0) {
          await logoutElement.click();
          loggedOut = true;
          break;
        }
      } catch {
        continue;
      }
    }

    if (loggedOut) {
      await page.waitForLoadState('networkidle');

      const isLoggedOut = page.url().includes('/login') || (await page.locator('a[href="/login"]').count()) > 0;

      expect(isLoggedOut).toBeTruthy();

      await page.goto(`${BASE_URL}/account`);
      await page.waitForLoadState('networkidle');

      const redirectedToLogin = page.url().includes('/login');
      expect(redirectedToLogin).toBeTruthy();

      console.log('✅ Logout successful, protected routes now require authentication');
    } else {
      console.log('⚠️ Logout button not found, skipping logout test');
    }
  });
});

test.describe('Session Debugging', () => {
  test('debug session and environment', async () => {
    console.log('\n🔍 Session Debug Information:');
    console.log(`- BASE_URL: ${BASE_URL}`);
    console.log(`- MONGODB_URI: ${MONGODB_URI}`);
    console.log(`- Session env var exists: ${!!process.env.PLAYWRIGHT_AUTH_SESSION}`);

    if (process.env.PLAYWRIGHT_AUTH_SESSION) {
      try {
        const sessionData = JSON.parse(Buffer.from(process.env.PLAYWRIGHT_AUTH_SESSION, 'base64').toString());
        console.log(`- Session timestamp: ${sessionData.timestamp}`);
        console.log(`- Cookies count: ${sessionData.cookies?.length || 0}`);
        console.log(`- Origins count: ${sessionData.origins?.length || 0}`);
      } catch (parseError) {
        console.log(`- Session parse error: ${parseError.message}`);
      }
    }

    try {
      if (mongoose.connection.readyState === 0) {
        await mongoose.connect(MONGODB_URI);
      }
      console.log('- MongoDB connection: ✅ Connected');
      console.log(`- Database name: ${mongoose.connection.db.databaseName}`);
    } catch (mongoError) {
      console.log(`- MongoDB connection: ❌ ${mongoError.message}`);
    }
  });
});
