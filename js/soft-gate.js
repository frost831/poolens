import { freeIdSoftGateCount } from './field-config.js?v=20261012-soft-gate';

const LANGUAGE_KEY = 'splashlens_language_profile';
export const COUNT_KEY = 'splashlens-free-successful-ids-v1';
export const SESSION_KEY = 'splashlens-free-id-soft-gate-session-v1';
export const PLACEMENT = 'soft_gate_free_ids';

function preferredLanguage(storage) {
  try {
    return JSON.parse(storage.getItem(LANGUAGE_KEY) || '{}').preferredLanguage === 'es' ? 'es' : 'en';
  } catch {
    return 'en';
  }
}

function copy(storage, key, fallback) {
  const dictionary = globalThis.SplashLensI18N || globalThis.window?.SplashLensI18N;
  const translated = dictionary?.i18nText?.(preferredLanguage(storage), key);
  return translated && translated !== key ? translated : fallback;
}

function element(doc, tag, className, textContent) {
  const node = doc.createElement(tag);
  if (className) node.className = className;
  if (textContent) node.textContent = textContent;
  return node;
}

export function createSoftGate({
  storage = globalThis.localStorage,
  session = globalThis.sessionStorage,
  document: doc = globalThis.document,
  limit = freeIdSoftGateCount(),
  isPro = () => globalThis.isPartSnapPro?.() === true,
  isStore = () => globalThis.isStoreShellMode?.() === true,
  track = (name, props) => globalThis.trackSplashLensEvent?.(name, props),
  checkoutUrl = (plan) => globalThis.getCheckoutUrl?.(plan, PLACEMENT) || '',
  onCheckout = (plan) => globalThis.trackPostValueUpgrade?.(plan, PLACEMENT) || '',
} = {}) {
  const threshold = freeIdSoftGateCount(limit);

  function readCount() {
    const value = Number.parseInt(storage.getItem(COUNT_KEY) || '0', 10);
    return Number.isInteger(value) && value > 0 ? value : 0;
  }

  function noteSuccessfulFreeId(_part, resultEl) {
    if (isPro()) return { counted: false, count: readCount(), shown: false };
    const count = readCount() + 1;
    storage.setItem(COUNT_KEY, String(count));
    const shown = show(count, resultEl);
    return { counted: true, count, shown };
  }

  function show(count, resultEl) {
    if (isStore() || count < threshold || !resultEl || session.getItem(SESSION_KEY)) return false;
    if (resultEl.querySelector?.('#free-id-soft-gate')) return false;
    const monthly = checkoutUrl('monthly');
    const yearly = checkoutUrl('yearly');
    if (!monthly || !yearly) return false;
    session.setItem(SESSION_KEY, '1');
    const card = element(doc, 'section', 'field-surface-card');
    card.id = 'free-id-soft-gate';
    const body = copy(storage, 'softgate.body', 'Successful free part identifications on this device: {count}. Pro is available when you want more AI scans. Manual lookup stays free.')
      .replaceAll('{count}', String(count));
    card.append(
      element(doc, 'p', 'field-kicker', copy(storage, 'softgate.kicker', 'Pro')),
      element(doc, 'h2', 'field-title', copy(storage, 'softgate.title', 'This identification stays on screen.')),
      element(doc, 'p', 'field-body', body),
    );
    const actions = element(doc, 'div', 'soft-gate-actions');
    for (const [plan, href] of [['monthly', monthly], ['yearly', yearly]]) {
      const link = element(doc, 'a', 'stop-flow-send', copy(storage, plan === 'monthly' ? 'upgrade.monthly' : 'upgrade.yearly', plan === 'monthly' ? 'Monthly' : 'Yearly'));
      link.href = href;
      link.target = '_blank';
      link.rel = 'noopener';
      link.setAttribute('data-checkout-plan', plan);
      link.setAttribute('data-checkout-placement', PLACEMENT);
      link.addEventListener('click', () => {
        const next = onCheckout(plan);
        if (next) link.href = next;
      });
      actions.append(link);
    }
    const dismiss = element(doc, 'button', 'stop-flow-secondary', copy(storage, 'softgate.dismiss', 'Dismiss Pro offer'));
    dismiss.type = 'button';
    dismiss.addEventListener('click', () => {
      card.remove?.();
      track('soft_gate_dismissed', { placement: PLACEMENT, successful_ids: count });
    });
    card.append(actions, dismiss);
    if (typeof resultEl.insertAdjacentElement === 'function') resultEl.insertAdjacentElement('beforeend', card);
    else resultEl.append?.(card);
    track('soft_gate_shown', { placement: PLACEMENT, successful_ids: count });
    return true;
  }

  return { noteSuccessfulFreeId, readCount };
}

if (typeof document !== 'undefined' && typeof window !== 'undefined') {
  window.SplashLensSoftGate = createSoftGate();
}
