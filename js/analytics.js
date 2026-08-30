(function () {
  'use strict';

  var endpoint = '/api/events';

  function displayMode() {
    if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) return 'standalone';
    return 'browser';
  }

  function track(eventName, props) {
    if (typeof window.trackSplashLensEvent === 'function') {
      window.trackSplashLensEvent(eventName, props || {});
      return;
    }

    try {
      var body = JSON.stringify({
        event: eventName,
        properties: Object.assign({
          path: window.location.pathname,
          title: document.title,
          displayMode: displayMode()
        }, props || {})
      });

      if (navigator.sendBeacon) {
        navigator.sendBeacon(endpoint, new Blob([body], { type: 'application/json' }));
        return;
      }

      fetch(endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: body,
        keepalive: true
      }).catch(function () {});
    } catch (error) {}
  }

  window.SplashLensAnalytics = { track: track };

  window.addEventListener('appinstalled', function () {
    if (typeof window.trackSplashLensEvent === 'function') return;
    track('pwa_installed', { displayMode: displayMode() });
  });

  document.addEventListener('click', function (event) {
    var tabButton = event.target.closest && event.target.closest('.nav-btn');
    if (tabButton) {
      track('app_tab_click', { tab: tabButton.id || '' });
    }
  });

  if (typeof window.trackSplashLensEvent !== 'function') {
    track('app_open', { title: document.title, displayMode: displayMode() });
  }
})();
