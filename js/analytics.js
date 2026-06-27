(function () {
  var endpoint = '/api/events';

  function displayMode() {
    if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) return 'standalone';
    if (window.navigator.standalone) return 'ios_standalone';
    return 'browser';
  }

  function track(eventName, props) {
    if (typeof window.trackSplashLensEvent === 'function') {
      window.trackSplashLensEvent(eventName, props || {});
      return;
    }

    var body = JSON.stringify({
      event: eventName,
      source: 'app',
      path: window.location.pathname + window.location.search,
      props: props || {}
    });

    try {
      if (navigator.sendBeacon) {
        navigator.sendBeacon(endpoint, new Blob([body], { type: 'application/json' }));
        return;
      }
      fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: body,
        keepalive: true
      }).catch(function () {});
    } catch (err) {}
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
