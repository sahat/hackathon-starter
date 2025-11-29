/* eslint-env jquery, browser */
/* global $ */

$(() => {
  function setTheme(theme) {
    try {
      document.documentElement.setAttribute('data-bs-theme', theme);
      localStorage.setItem('theme', theme);
      updateIcon(theme);
    } catch (e) {
      console.error('Failed to set theme:', e);
    }
  }

  function updateIcon(theme) {
    var icon = document.getElementById('theme-icon');
    if (!icon) return;
    icon.textContent = theme === 'dark' ? '🌙' : '☀️';
  }

  var toggle = document.getElementById('theme-toggle');
  if (toggle) {
    toggle.addEventListener('click', function () {
      var current = document.documentElement.getAttribute('data-bs-theme') || 'light';
      setTheme(current === 'dark' ? 'light' : 'dark');
    });
  }

  var initial = document.documentElement.getAttribute('data-bs-theme') || 'light';
  updateIcon(initial);
});
