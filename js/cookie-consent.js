/* Cookie Consent — GDPR/CCPA compliant banner
-------------------------------------------------- */

(function () {
  'use strict';

  var STORAGE_KEY = 'cookieConsent';

  // Inject banner HTML
  var bannerHTML =
    '<div id="cookie-banner" class="cookie-consent-banner">' +
      '<div class="cookie-consent-content">' +
        '<p>We use cookies to analyze site traffic and improve your experience. ' +
        'See our <a href="privacy.html">Privacy Policy</a> for details.</p>' +
        '<div class="cookie-consent-buttons">' +
          '<button class="cookie-btn cookie-btn-accept" id="cookie-accept">Accept All</button>' +
          '<button class="cookie-btn cookie-btn-reject" id="cookie-reject">Reject All</button>' +
          '<button class="cookie-btn cookie-btn-customize" id="cookie-customize">Customize</button>' +
        '</div>' +
      '</div>' +
    '</div>' +
    '<div id="cookie-customize-panel" class="cookie-consent-customize">' +
      '<h3>Cookie Preferences</h3>' +
      '<div class="cookie-toggles">' +
        '<div class="cookie-toggle-row">' +
          '<div class="cookie-toggle-label">' +
            '<strong>Essential</strong>' +
            '<small>Required for the site to function. Always on.</small>' +
          '</div>' +
          '<input type="checkbox" checked disabled>' +
        '</div>' +
        '<div class="cookie-toggle-row">' +
          '<div class="cookie-toggle-label">' +
            '<strong>Analytics</strong>' +
            '<small>Helps us understand how visitors use the site (Google Analytics).</small>' +
          '</div>' +
          '<input type="checkbox" id="cookie-analytics" checked>' +
        '</div>' +
      '</div>' +
      '<div class="cookie-customize-buttons">' +
        '<button class="cookie-btn cookie-btn-accept" id="cookie-save">Save Preferences</button>' +
        '<button class="cookie-btn cookie-btn-reject" id="cookie-cancel">Cancel</button>' +
      '</div>' +
    '</div>';

  document.addEventListener('DOMContentLoaded', function () {
    // Append to body
    var wrapper = document.createElement('div');
    wrapper.innerHTML = bannerHTML;
    while (wrapper.firstChild) {
      document.body.appendChild(wrapper.firstChild);
    }

    var banner = document.getElementById('cookie-banner');
    var panel = document.getElementById('cookie-customize-panel');
    var analyticsToggle = document.getElementById('cookie-analytics');

    var stored = getConsent();

    if (!stored) {
      // First visit — show banner
      banner.classList.add('show');
    } else if (stored.analytics) {
      enableAnalytics();
    }

    // Accept all
    document.getElementById('cookie-accept').addEventListener('click', function () {
      saveConsent({ analytics: true });
      enableAnalytics();
      banner.classList.remove('show');
      panel.classList.remove('show');
    });

    // Reject all
    document.getElementById('cookie-reject').addEventListener('click', function () {
      saveConsent({ analytics: false });
      disableAnalytics();
      banner.classList.remove('show');
      panel.classList.remove('show');
    });

    // Show customize
    document.getElementById('cookie-customize').addEventListener('click', function () {
      banner.classList.remove('show');
      // Load current prefs
      var current = getConsent();
      analyticsToggle.checked = current ? current.analytics : true;
      panel.classList.add('show');
    });

    // Save preferences
    document.getElementById('cookie-save').addEventListener('click', function () {
      var prefs = { analytics: analyticsToggle.checked };
      saveConsent(prefs);
      if (prefs.analytics) {
        enableAnalytics();
      } else {
        disableAnalytics();
      }
      panel.classList.remove('show');
    });

    // Cancel customize
    document.getElementById('cookie-cancel').addEventListener('click', function () {
      panel.classList.remove('show');
      // If no consent yet, re-show banner
      if (!getConsent()) {
        banner.classList.add('show');
      }
    });

    // Expose for footer "Cookie Settings" link
    window.CookieConsent = {
      show: function () {
        var current = getConsent();
        analyticsToggle.checked = current ? current.analytics : true;
        banner.classList.remove('show');
        panel.classList.add('show');
      }
    };
  });

  function getConsent() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function saveConsent(prefs) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch (e) {
      // localStorage unavailable
    }
  }

  function enableAnalytics() {
    // GA4 is loaded via gtag in <head>; ensure it's not blocked
    if (window.gtag) {
      window.gtag('consent', 'update', {
        analytics_storage: 'granted'
      });
    }
  }

  function disableAnalytics() {
    if (window.gtag) {
      window.gtag('consent', 'update', {
        analytics_storage: 'denied'
      });
    }
    // Clear existing GA cookies
    document.cookie.split(';').forEach(function (c) {
      var name = c.trim().split('=')[0];
      if (name.indexOf('_ga') === 0 || name.indexOf('_gid') === 0) {
        document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=' + location.hostname;
        document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';
      }
    });
  }
})();
