/* global CookieConsent, dataLayer */

// 1. Google Consent Mode v2 default state.
// Must be queued in dataLayer BEFORE gtag.js loads. gtag.js is gated on
// analytics consent, so this runs first on every page load and ensures
// Google blocks all cookies / ad features until the user opts in.
window.dataLayer = window.dataLayer || [];
function gtag() {
  dataLayer.push(arguments);
}
gtag('consent', 'default', {
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  analytics_storage: 'denied',
  functionality_storage: 'denied',
  personalization_storage: 'denied',
  security_storage: 'granted',
  wait_for_update: 500,
});

// 2. CookieConsent configuration.
// Categories, services, translations, and the consent mode hooks for Google.
// The library's data-category attribute on <script> tags in layout.pug does
// the actual script gating; this config just defines the categories and the
// per-service consent callbacks.
CookieConsent.run({
  categories: {
    necessary: {
      enabled: true,
      readOnly: true,
    },
    analytics: {
      autoClearCookies: true,
      services: {
        ga: {
          label: 'Google Analytics',
          cookies: [{ name: /^_ga/ }],
          onAccept: () => gtag('consent', 'update', { analytics_storage: 'granted' }),
          onReject: () => gtag('consent', 'update', { analytics_storage: 'denied' }),
        },
      },
    },
    marketing: {
      autoClearCookies: true,
      services: {
        facebook: {
          label: 'Facebook Pixel',
          cookies: [{ name: '_fbp' }, { name: '_fbc' }],
        },
        'google-ads': {
          // Google Ads features (conversion tracking, remarketing, Google
          // Signals) controlled by Consent Mode v2's ad_* settings. No
          // cookies to clear — gtag.js manages those via consent state.
          label: 'Google Ads features',
          onAccept: () =>
            gtag('consent', 'update', {
              ad_storage: 'granted',
              ad_user_data: 'granted',
              ad_personalization: 'granted',
            }),
          onReject: () =>
            gtag('consent', 'update', {
              ad_storage: 'denied',
              ad_user_data: 'denied',
              ad_personalization: 'denied',
            }),
        },
      },
    },
  },
  language: {
    default: 'en',
    translations: {
      en: {
        consentModal: {
          title: 'Cookies',
          description: 'This site uses cookies to deliver our services and analyse traffic. By using this site, you agree to our use of cookies.',
          acceptAllBtn: 'Accept all',
          acceptNecessaryBtn: 'Reject all',
          showPreferencesBtn: 'Manage preferences',
          footer: `
            <a href="/privacy-policy.html" target="_blank">Privacy Policy</a>
            <a href="/terms-of-use.html" target="_blank">Terms of Use</a>`,
        },
        preferencesModal: {
          title: 'Cookie preferences',
          acceptAllBtn: 'Accept all',
          acceptNecessaryBtn: 'Reject all',
          savePreferencesBtn: 'Save preferences',
          closeIconLabel: 'Close',
          sections: [
            {
              title: 'Strictly necessary',
              description: 'These cookies are essential for the site to function and cannot be switched off.',
              linkedCategory: 'necessary',
            },
            {
              title: 'Analytics',
              description: 'Help us understand how the site is used so we can measure and improve performance.',
              linkedCategory: 'analytics',
            },
            {
              title: 'Marketing',
              description: 'Used to measure the effectiveness of advertising campaigns and personalize ads shown to you.',
              linkedCategory: 'marketing',
            },
          ],
        },
      },
    },
  },
  guiOptions: {
    consentModal: {
      layout: 'box',
      position: 'bottom right',
      equalWeightButtons: true,
    },
    preferencesModal: {
      layout: 'box',
      equalWeightButtons: true,
    },
  },
});

// 3. Facebook Pixel queue stub.
// Defines fbq + queue. Init/track calls below queue safely. The actual
// fbevents.js library is loaded later (gated on data-category='marketing'
// in layout.pug) when the user grants marketing consent, and the queued
// events fire when fbevents.js processes them.
(function (f, b, n) {
  if (f.fbq) return;
  n = f.fbq = function () {
    if (n.callMethod) {
      n.callMethod.apply(n, arguments);
    } else {
      n.queue.push(arguments);
    }
  };
  if (!f._fbq) f._fbq = n;
  n.push = n;
  n.loaded = !0;
  n.version = '2.0';
  n.queue = [];
})(window, document);

// Init + first PageView only if a Pixel ID is configured. The ID is passed
// in via a data attribute on the <script> tag in layout.pug, since this
// file is served as a static asset and can't see Pug template variables
// directly.
var facebookPixelId = (document.currentScript && document.currentScript.dataset.facebookPixel) || '';
if (facebookPixelId) {
  fbq('init', facebookPixelId);
  fbq('track', 'PageView');
}
