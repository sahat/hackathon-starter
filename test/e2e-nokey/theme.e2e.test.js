process.env.API_TEST_FILE = 'e2e-nokey/theme.e2e.test.js';
const { test, expect } = require('@playwright/test');
const { registerTestInManifest, isInManifest } = require('../tools/fixture-helpers');

// Self-register this test in the manifest when recording
registerTestInManifest('e2e-nokey/theme.e2e.test.js');

// Skip this file during replay if it's not in the manifest
if (process.env.API_MODE === 'replay' && !isInManifest('e2e-nokey/theme.e2e.test.js')) {
  console.log('[fixtures] skipping e2e-nokey/theme.e2e.test.js as it is not in manifest for replay mode - 4 tests');
  test.skip(true, 'Not in manifest for replay mode');
}

// All theme tests share a single browser context so localStorage (the
// persistence layer under test) is the same instance the application sees.
// We pin `colorScheme: 'light'` so the inline head script's prefers-color-scheme
// fallback resolves to a known value — otherwise this suite would flake on
// CI runners whose host OS prefers dark.
test.describe('Dark mode toggle', () => {
  test.describe.configure({ mode: 'serial' });

  let page;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext({ colorScheme: 'light' });
    page = await context.newPage();
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test.afterAll(async () => {
    if (page) await page.context().close();
  });

  test('stamps data-bs-theme on <html> on first paint and exposes a toggle button', async () => {
    // The inline <script> in <head> runs before the stylesheets load, so
    // by the time we get here the attribute is already on <html>.
    const html = page.locator('html');
    const theme = await html.getAttribute('data-bs-theme');
    expect(theme === 'light' || theme === 'dark').toBeTruthy();

    const toggle = page.locator('[data-theme-toggle]');
    await expect(toggle).toBeVisible();

    // `aria-pressed` is the contract screen readers and other assistive
    // tech rely on to read the toggle's current state. The first-paint
    // sync in /js/theme.js must align it with the rendered theme.
    const ariaPressed = await toggle.getAttribute('aria-pressed');
    const expectedPressed = theme === 'dark' ? 'true' : 'false';
    expect(ariaPressed).toBe(expectedPressed);
  });

  test('clicking the toggle flips data-bs-theme and persists to localStorage', async () => {
    // Start from a known state so the assertion direction is unambiguous.
    await page.evaluate(() => localStorage.removeItem('theme'));
    await page.reload();
    await page.waitForLoadState('networkidle');

    const html = page.locator('html');
    const before = await html.getAttribute('data-bs-theme');
    expect(before).toBe('light');

    await page.locator('[data-theme-toggle]').click();

    const after = await html.getAttribute('data-bs-theme');
    expect(after).toBe('dark');

    const stored = await page.evaluate(() => localStorage.getItem('theme'));
    expect(stored).toBe('dark');

    // Toggling back to light is symmetric.
    await page.locator('[data-theme-toggle]').click();
    expect(await html.getAttribute('data-bs-theme')).toBe('light');
    expect(await page.evaluate(() => localStorage.getItem('theme'))).toBe('light');
  });

  test('persisted theme is restored on the next page load', async () => {
    // Force a known state via the toggle, then reload to a different URL
    // and verify the inline head script stamps the right theme.
    await page.evaluate(() => localStorage.setItem('theme', 'dark'));
    await page.goto('/api/wikipedia');
    await page.waitForLoadState('networkidle');

    const html = page.locator('html');
    expect(await html.getAttribute('data-bs-theme')).toBe('dark');

    // Reset so other suites (and the next test run) see a clean slate.
    await page.evaluate(() => localStorage.setItem('theme', 'light'));
  });

  test('dispatches a themechange event on document for page-level widgets to react to', async () => {
    // Reset state explicitly: the previous test leaves us on /api/wikipedia
    // with localStorage.theme = 'dark', so the page theme attribute is
    // 'dark' when this test starts. Force a known state before installing
    // the listener.
    await page.evaluate(() => localStorage.setItem('theme', 'light'));
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Attach a listener that records the event, then click the toggle and
    // assert the listener saw a CustomEvent with `detail.theme` matching
    // the new attribute. This is the contract here-maps.pug (and any
    // other theme-aware widget) depends on.
    await page.evaluate(() => {
      window.__themeEvents = [];
      document.addEventListener('themechange', (e) => {
        window.__themeEvents.push(e.detail.theme);
      });
    });

    await page.locator('[data-theme-toggle]').click();
    await page.locator('[data-theme-toggle]').click();

    const events = await page.evaluate(() => window.__themeEvents);
    expect(events).toEqual(['dark', 'light']);
  });
});
