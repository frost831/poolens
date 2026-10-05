const controllers = new WeakMap();
const CONTROL = '[data-partsnap-boss-packet]';
const SHARE_ACTION = 'button[onclick="sharePartSnapPacket()"]';

function line(value, limit = 400) {
  return typeof value === 'string'
    ? value.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, limit)
    : '';
}

function list(value) {
  return Array.isArray(value) ? [...new Set(value.map(item => line(item)).filter(Boolean))].slice(0, 20) : [];
}

function sourceRoutes(result) {
  const routes = new Map();
  for (const candidate of (Array.isArray(result.corpusCandidates) ? result.corpusCandidates : []).slice(0, 4)) {
    if (!candidate || typeof candidate !== 'object') continue;
    for (const [index, value] of (Array.isArray(candidate.sourceUrls) ? candidate.sourceUrls : []).slice(0, 4).entries()) {
      if (typeof value !== 'string' || value.length > 2000) continue;
      try {
        const url = new URL(value);
        if (url.protocol !== 'https:' || url.username || url.password) continue;
        const label = line(Array.isArray(candidate.sourceLabels) ? candidate.sourceLabels[index] : '', 120) || 'Provided family reference';
        routes.set(url.href, `${label}: ${url.href}`);
      } catch {}
    }
  }
  return [...routes.values()].slice(0, 8);
}

export function buildPartSnapBossPacket(result = {}, { ladder = {}, orderGate = {} } = {}) {
  result = result && typeof result === 'object' ? result : {};
  const confidence = ['low', 'medium', 'high'].includes(result.confidence) ? result.confidence : 'unknown';
  const evidence = list(result.visibleEvidence);
  const missing = list([...list(result.missingProof), ...list(ladder.missing), ...list(orderGate.reasons)]);
  const sources = sourceRoutes(result);
  const suggested = [line(result.manufacturer, 120), line(result.component, 120)].filter(Boolean).join(' / ') || 'Unknown part';
  const text = [
    'SplashLens PartSnap - boss review draft',
    '',
    'Proof summary (scan-reported, not independently verified):',
    `Possible part/family: ${suggested}`,
    `Possible model: ${line(result.model, 120) || 'Not established'}`,
    `Possible part number: ${line(result.partNumber, 120) || 'Not established'}`,
    `AI confidence: ${confidence} (not fitment verification)`,
    ...(evidence.length ? evidence.map(item => `- Scan-reported observation: ${item}`) : ['- No visible proof was recorded.']),
    '',
    'Missing proof / ordering hold:',
    ...(missing.length ? missing.map(item => `- ${item}`) : ['- No additional gaps listed by the scan; current manufacturer verification is still required.']),
    '- Confirm equipment model, markings, dimensions, and current manufacturer parts diagram before ordering.',
    'This draft is not a diagnosis, exact-fit guarantee, manufacturer approval, or authorization to order.',
    '',
    'Source routes supplied with the result (check applicability and revision):',
    ...(sources.length ? sources.map((item, index) => `${index + 1}. ${item}`) : ['No source citations available. Treat this as an unverified AI suggestion.']),
    'A family reference is not proof that this part fits this equipment.',
    '',
    'Ask for my boss:',
    'Please review the proof and missing items above. What additional evidence should I capture, and who should verify the current parts diagram before we order?',
    '',
    'SplashLens Teams inquiry:',
    'Could we evaluate SplashLens Teams for crew proof review and job handoffs? Please ask hello@splashlens.com about access, current availability, pricing, and whether it fits our workflow before making a purchase decision.',
  ].join('\n');
  return {
    text,
    analytics: {
      confidence,
      proof_visible_count: evidence.length,
      proof_missing_count: missing.length,
      source_route_count: sources.length,
    },
  };
}

// app.js uses classic-script lexical state, not window properties for these values.
function currentSnapshot() {
  const result = typeof _lastPartSnapResult !== 'undefined' ? _lastPartSnapResult : null;
  const mode = typeof _scanMode !== 'undefined' ? _scanMode : '';
  if (!result) return { result, mode };
  const ladder = typeof partConfidenceLadder === 'function'
    ? partConfidenceLadder(result.confidence, result.partNumber, result.manufacturer, result.model, result.component)
    : {};
  const risk = typeof partSnapCallbackRisk === 'function'
    ? partSnapCallbackRisk(result, ladder, list(result.visibleEvidence), list(result.missingProof))
    : {};
  const orderGate = typeof getPartSnapOrderGate === 'function'
    ? getPartSnapOrderGate(result, result.corpusCandidates || [], ladder, risk, list(result.missingProof))
    : {};
  return { result, mode, ladder, orderGate };
}

export function isSuccessfulPartSnap({ result, mode, status = '' } = {}) {
  const component = line(result?.component, 120);
  return Boolean(
    mode === 'parts' && component && !/unknown|unidentified|not identified/i.test(component) &&
    ['medium', 'high'].includes(result?.confidence) &&
    status.trim() === `POSSIBLE MATCH: ${component}`
  );
}

export function initPartSnapBossPacket({
  document: doc = globalThis.document,
  navigator: nav = globalThis.navigator,
  getSnapshot = currentSnapshot,
  track = (event, props) => globalThis.window?.trackSplashLensEvent?.(event, props),
  MutationObserver: Observer = globalThis.MutationObserver,
} = {}) {
  if (!doc) return null;
  if (controllers.has(doc)) return controllers.get(doc);
  const root = doc.getElementById('scan-result');
  const status = doc.getElementById('scan-camera-status');
  if (!root || !status) return null;
  let state = null;
  let destroyed = false;

  function read() {
    try {
      const snapshot = getSnapshot();
      const anchor = root.querySelector(SHARE_ACTION);
      if (!anchor || !root.querySelector('#partsnap-feedback-panel') ||
          root.hidden || root.getAttribute('aria-busy') === 'true' ||
          !isSuccessfulPartSnap({ ...snapshot, status: status.textContent })) return null;
      return { snapshot, anchor, packet: buildPartSnapBossPacket(snapshot.result, snapshot) };
    } catch {
      return null;
    }
  }

  function emit(action, packet, method) {
    try {
      track(`partsnap_boss_packet_${action}`, { ...packet.analytics, method });
    } catch {}
  }

  function element(tag, text, style = '') {
    const node = doc.createElement(tag);
    if (text) node.textContent = text;
    if (style) node.style.cssText = style;
    return node;
  }

  function button(action, text) {
    const node = element('button', text, 'min-height:44px;min-width:0;padding:10px 12px;border:1px solid #0e7490;border-radius:8px;background:#0f766e;color:#fff;font-size:12px;font-weight:800;cursor:pointer;white-space:normal;overflow-wrap:anywhere;');
    node.type = 'button';
    node.dataset.partsnapBossAction = action;
    return node;
  }

  function refresh() {
    if (destroyed) return null;
    const live = read();
    if (!live) {
      root.querySelectorAll(CONTROL).forEach(node => node.remove());
      state = null;
      return null;
    }
    if (state?.result === live.snapshot.result && state.anchor === live.anchor &&
        state.packet.text === live.packet.text && root.contains(state.section)) return state;
    root.querySelectorAll(CONTROL).forEach(node => node.remove());
    const section = element('section', '', 'margin:10px 0;padding:10px 0;border-top:1px solid #334155;min-width:0;scroll-margin-bottom:calc(184px + env(safe-area-inset-bottom, 0px));');
    section.dataset.partsnapBossPacket = '';
    section.setAttribute('aria-label', 'Boss review draft');
    const open = button('open', 'Send this to my boss');
    open.style.width = '100%';
    open.setAttribute('aria-expanded', 'false');
    open.setAttribute('aria-controls', 'partsnap-boss-draft');
    const preview = element('div', '', 'margin-top:10px;scroll-margin-top:16px;scroll-margin-bottom:calc(184px + env(safe-area-inset-bottom, 0px));');
    preview.id = 'partsnap-boss-draft';
    preview.hidden = true;
    const label = element('label', 'Boss review draft', 'display:block;color:#e2e8f0;font-size:12px;font-weight:800;margin-bottom:6px;');
    label.htmlFor = 'partsnap-boss-draft-text';
    const textarea = element('textarea', '', 'display:block;box-sizing:border-box;width:100%;height:260px;max-height:45vh;padding:10px;border:1px solid #64748b;border-radius:8px;background:#f8fafc;color:#0f172a;font-size:12px;line-height:1.5;resize:vertical;');
    textarea.id = 'partsnap-boss-draft-text';
    textarea.readOnly = true;
    textarea.value = live.packet.text;
    const actions = element('div', '', 'display:flex;flex-wrap:wrap;gap:8px;margin-top:8px;');
    const copy = button('copy', 'Copy draft');
    const share = button('share', 'Share draft');
    share.hidden = typeof nav?.share !== 'function';
    const close = button('close', 'Close');
    close.style.background = '#334155';
    actions.append(copy, share, close);
    const notice = element('p', '', 'color:#cbd5e1;font-size:12px;line-height:1.4;margin-top:8px;');
    notice.setAttribute('role', 'status');
    preview.append(label, textarea, actions, notice);
    section.append(open, preview);
    live.anchor.parentElement.before(section);
    state = { section, anchor: live.anchor, result: live.snapshot.result, packet: live.packet, preview, textarea, notice, open, copy, share, pending: false };
    return state;
  }

  async function onClick(event) {
    const target = event.target?.closest?.('[data-partsnap-boss-action]');
    if (!target || !root.contains(target)) return;
    const active = refresh();
    if (!active || !active.section.contains(target)) return;
    const action = target.dataset.partsnapBossAction;
    if (action === 'open') {
      active.preview.hidden = false;
      active.open.setAttribute('aria-expanded', 'true');
      active.textarea.focus({ preventScroll: true });
      active.textarea.setSelectionRange(0, 0);
      active.textarea.scrollTop = 0;
      active.preview.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'auto' });
      emit('opened', active.packet, 'preview');
      return;
    }
    if (action === 'close') {
      active.preview.hidden = true;
      active.open.setAttribute('aria-expanded', 'false');
      active.open.focus();
      return;
    }
    if (active.pending || active.preview.hidden || !['copy', 'share'].includes(action)) return;
    if (action === 'copy' && typeof nav?.clipboard?.writeText !== 'function') {
      active.textarea.focus();
      active.textarea.select();
      active.notice.textContent = 'Clipboard unavailable. Draft selected for manual copy.';
      return;
    }
    if (action === 'share' && typeof nav?.share !== 'function') return;
    active.pending = true;
    active.copy.disabled = active.share.disabled = true;
    active.notice.textContent = '';
    try {
      if (action === 'share') await nav.share({ title: 'SplashLens PartSnap - boss review draft', text: active.packet.text });
      else await nav.clipboard.writeText(active.packet.text);
      emit(action === 'share' ? 'shared' : 'copied', active.packet, action === 'share' ? 'native' : 'clipboard');
      if (refresh() === active) active.notice.textContent = action === 'share' ? 'Draft shared.' : 'Draft copied.';
    } catch (error) {
      if (refresh() === active) {
        if (action === 'share' && error?.name === 'AbortError') active.notice.textContent = 'Share canceled.';
        else {
          active.textarea.focus();
          active.textarea.select();
          active.notice.textContent = action === 'share'
            ? 'Could not share. Use Copy draft or copy the selected text.'
            : 'Could not copy. Draft selected for manual copy.';
        }
      }
    } finally {
      active.pending = false;
      active.copy.disabled = active.share.disabled = false;
    }
  }

  const observer = typeof Observer === 'function' ? new Observer(refresh) : null;
  const panel = doc.getElementById('scan-camera-panel');
  if (panel) observer?.observe(panel, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['hidden', 'aria-busy', 'style'] });
  else {
    observer?.observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ['hidden', 'aria-busy'] });
    observer?.observe(status, { childList: true, subtree: true, characterData: true });
  }
  root.addEventListener('click', onClick);
  const controller = {
    refresh,
    destroy() {
      destroyed = true;
      observer?.disconnect();
      root.removeEventListener('click', onClick);
      root.querySelectorAll(CONTROL).forEach(node => node.remove());
      state = null;
      controllers.delete(doc);
    },
  };
  controllers.set(doc, controller);
  refresh();
  return controller;
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  window.SplashLensBossPacket = Object.freeze({ buildPacket: buildPartSnapBossPacket, init: initPartSnapBossPacket });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => initPartSnapBossPacket(), { once: true });
  else initPartSnapBossPacket();
}
