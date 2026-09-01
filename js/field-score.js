(function () {
  'use strict';

  var endpoint = '/api/events';
  var throttleMs = 20 * 60 * 1000;
  var promptDelayMs = 1600;
  var widget;
  var noteInput;
  var state = {
    action: '',
    detail: '',
    source: '',
    promptedAt: 0
  };

  function safeStore(kind, key, value) {
    try {
      var store = kind === 'local' ? window.localStorage : window.sessionStorage;
      if (arguments.length === 3) store.setItem(key, value);
      return store.getItem(key);
    } catch (error) {
      return null;
    }
  }

  function safeText(value, maxLength) {
    return String(value || '')
      .replace(/[^\w .,:;!?/#&=+@()-]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, maxLength || 160);
  }

  function currentTab() {
    var active = document.querySelector('.tab-panel.active');
    if (!active || !active.id) return '';
    return active.id.replace(/^tab-/, '');
  }

  function attribution() {
    var params = new URLSearchParams(window.location.search || '');
    return {
      utm_source: safeText(params.get('utm_source'), 80),
      utm_medium: safeText(params.get('utm_medium'), 80),
      utm_campaign: safeText(params.get('utm_campaign'), 100),
      ref: safeText(params.get('ref'), 100),
      challenge: safeText(params.get('challenge'), 80),
      challenge_path: safeText(params.get('challenge_path'), 80)
    };
  }

  function track(eventName, props) {
    var payload = Object.assign({
      path: window.location.pathname,
      tab: currentTab(),
      displayMode: window.matchMedia('(display-mode: standalone)').matches ? 'standalone' : 'browser'
    }, attribution(), props || {});

    if (typeof window.trackSplashLensEvent === 'function') {
      window.trackSplashLensEvent(eventName, payload);
      return;
    }

    if (window.SplashLensAnalytics && typeof window.SplashLensAnalytics.track === 'function') {
      window.SplashLensAnalytics.track(eventName, payload);
      return;
    }

    try {
      var body = JSON.stringify({ event: eventName, properties: payload });
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

  function init() {
    if (widget) return true;
    widget = document.getElementById('field-score-widget');
    noteInput = document.getElementById('field-score-note');
    if (!widget || !noteInput) return false;

    widget.addEventListener('click', function (event) {
      var closeButton = event.target.closest('[data-field-score-close]');
      if (closeButton) {
        close('dismissed');
        return;
      }

      var scoreButton = event.target.closest('[data-field-score]');
      if (scoreButton) {
        submit(scoreButton.getAttribute('data-field-score'));
      }
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && widget && !widget.hidden) close('escape');
    });

    return true;
  }

  function promptAllowed(action) {
    if (!action) return false;
    var params = new URLSearchParams(window.location.search || '');
    if (safeStore('session', 'splashlens-field-score-' + action)) return false;
    var lastPrompt = Number(safeStore('local', 'splashlens-field-score-last-prompt-at') || 0);
    var challengeRun = params.get('challenge') === 'field60';
    return challengeRun || Date.now() - lastPrompt > throttleMs;
  }

  function prompt(action, detail, source) {
    action = safeText(action, 90);
    detail = safeText(detail, 180);
    source = safeText(source, 80);
    if (!init() || !promptAllowed(action)) return;

    state = {
      action: action,
      detail: detail,
      source: source,
      promptedAt: Date.now()
    };

    noteInput.value = '';
    widget.hidden = false;
    safeStore('local', 'splashlens-field-score-last-prompt-at', String(Date.now()));
    track('field_score_prompted', state);
  }

  function close(reason) {
    if (!init()) return;
    widget.hidden = true;
    track('field_score_dismissed', Object.assign({}, state, {
      reason: safeText(reason || 'dismissed', 40),
      elapsedMs: Date.now() - state.promptedAt
    }));
  }

  function submit(score) {
    if (!init()) return;
    var cleanedScore = safeText(score, 40);
    safeStore('session', 'splashlens-field-score-' + state.action, '1');
    safeStore('local', 'splashlens-field-score-submitted-at', String(Date.now()));
    track('field_score_feedback', Object.assign({}, state, {
      score: cleanedScore,
      note: safeText(noteInput.value, 500),
      elapsedMs: Date.now() - state.promptedAt
    }));
    widget.hidden = true;
  }

  function delayedPrompt(action, detail, source, delayMs) {
    window.setTimeout(function () {
      prompt(action, detail, source);
    }, delayMs || promptDelayMs);
  }

  document.addEventListener('click', function (event) {
    var target = event.target.closest && event.target.closest('button,a');
    if (!target) return;

    var id = target.id || '';
    var text = safeText(target.textContent, 80).toLowerCase();
    var href = target.getAttribute && target.getAttribute('href');

    if (target.closest('#role-picker') || target.closest('#marketing-gate')) return;

    if (target.classList.contains('nav-btn')) {
      return;
    }

    if (id.indexOf('scan-mode-') === 0) {
      return;
    }

    if (href && href.indexOf('checkout') !== -1) {
      delayedPrompt('checkout_interest', href, 'paid_wedge');
      return;
    }

    if (/proof packet|save to pool history|share report|customer summary|vendor packet|calculate dose/.test(text)) {
      delayedPrompt('workflow_' + safeText(text, 48).replace(/\s+/g, '_'), text, 'workflow_button');
    }
  }, true);

  window.addEventListener('load', function () {
    init();
    var params = new URLSearchParams(window.location.search || '');
    if (params.get('challenge') === 'field60') {
      delayedPrompt('field60_return', params.get('challenge_path') || 'unknown', 'campaign', 4500);
    }
  });

  window.SplashLensFieldScore = {
    prompt: prompt,
    submit: submit,
    close: close
  };
})();
