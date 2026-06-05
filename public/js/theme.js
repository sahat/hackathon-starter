/* global document, window */
/**
 * Client-side dark mode toggle.
 *
 * The theme is a UI preference stored in localStorage and applied to <html> as
 * the `data-bs-theme` attribute (Bootstrap 5.3's data color mode). The
 * attribute is also kept in sync with the `cc--darkmode` class that
 * vanilla-cookieconsent uses for its dark stylesheet.
 *
 * The inline <script> in views/layout.pug stamps the attribute on first
 * paint from localStorage (falling back to prefers-color-scheme). This
 * file is the runtime half: it handles clicks, persists the choice, and
 * syncs across tabs via the `storage` event.
 *
 * Storage key and attribute values must match the inline head script.
 */
(function () {
  const STORAGE_KEY = 'theme';
  const VALID = ['light', 'dark'];

  const html = document.documentElement;

  function readStored() {
    try {
      const v = window.localStorage.getItem(STORAGE_KEY);
      return VALID.includes(v) ? v : null;
    } catch {
      // localStorage can throw in privacy modes / sandboxed iframes.
      return null;
    }
  }

  function applyTheme(theme) {
    html.setAttribute('data-bs-theme', theme);
    html.classList.toggle('cc--darkmode', theme === 'dark');
    // Let page-specific widgets (HERE maps base layer, third-party embeds,
    // any data-viz that paints to a canvas) react to the flip. We dispatch
    // on `document` so it reaches the widest set of listeners; bubbling
    // stays inside the document tree and never crosses tabs.
    document.dispatchEvent(new CustomEvent('themechange', { detail: { theme } }));
  }

  function writeStored(theme) {
    try {
      window.localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // Same fallback as readStored: no-op if storage is unavailable.
    }
  }

  function currentTheme() {
    const attr = html.getAttribute('data-bs-theme');
    return VALID.includes(attr) ? attr : 'light';
  }

  function onToggleClick(event) {
    event.preventDefault();
    const next = currentTheme() === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    writeStored(next);
  }

  // Wire up the toggle button. We attach the handler to any element with
  // data-theme-toggle rather than hardcoding a single id, so the header
  // markup stays free of js-only hooks.
  document.addEventListener('click', (event) => {
    const target = event.target.closest('[data-theme-toggle]');
    if (target) onToggleClick(event);
  });

  // Sync theme across tabs. The `storage` event fires in *other* tabs
  // when localStorage changes, so a toggle in one tab immediately updates
  // the others.
  window.addEventListener('storage', (event) => {
    if (event.key !== STORAGE_KEY) return;
    const next = readStored();
    if (next && next !== currentTheme()) applyTheme(next);
  });
})();
