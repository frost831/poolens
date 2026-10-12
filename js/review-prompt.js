export const REVIEW_STATE_KEY = 'splashlens-store-review-state';
export const REVIEW_COOLDOWN_MS = 45 * 24 * 60 * 60 * 1000;
export const REVIEW_TRIGGER = 'partsnap_result_success';

function cooling(stamp, now) {
  const value = Number(stamp || 0);
  return value > 0 && now - value < REVIEW_COOLDOWN_MS;
}

export function reviewDecision(state = {}, now = Date.now(), { native = false, storeShell = false, blocked = false } = {}) {
  if (state.reviewedAt) return 'skip';
  if (cooling(state.idPromptAt, now) || cooling(state.declinedAt, now)) return 'skip';
  if (blocked) return 'defer';
  if (native) return 'native';
  if (storeShell) return 'unavailable';
  return 'web';
}

export function runReviewPrompt({
  state = {},
  now = Date.now(),
  nativeReview,
  storeShell = false,
  gateVisible = false,
  track = () => {},
  showWebPrompt = () => false,
} = {}) {
  const decision = reviewDecision(state, now, {
    native: typeof nativeReview === 'function',
    storeShell,
    blocked: gateVisible,
  });
  if (decision === 'skip' || decision === 'defer') return { decision, state };
  const next = { ...state, idPromptAt: now };
  if (decision === 'native') {
    track('store_review_prompt_requested', { trigger: REVIEW_TRIGGER });
    try {
      const result = nativeReview();
      if (result && typeof result.then === 'function') {
        result.then(null, () => track('store_review_prompt_failed', { trigger: REVIEW_TRIGGER }));
      }
    } catch {
      track('store_review_prompt_failed', { trigger: REVIEW_TRIGGER });
    }
    return { decision, state: next };
  }
  if (decision === 'unavailable') {
    track('store_review_prompt_unavailable', { trigger: REVIEW_TRIGGER });
    return { decision, state: next };
  }
  if (showWebPrompt(REVIEW_TRIGGER, { force: true, silent: true }) === false) return { decision: 'defer', state };
  track('store_review_prompt_shown', { trigger: REVIEW_TRIGGER });
  return { decision: 'web', state: next };
}

export function createReviewPrompt({
  storage = globalThis.localStorage,
  document: doc = globalThis.document,
  now = () => Date.now(),
  nativeReview = () => globalThis.SplashLensNative?.requestReview,
  storeShell = () => globalThis.isStoreShellMode?.() === true,
  track = (name, props) => globalThis.trackSplashLensEvent?.(name, props),
  showWebPrompt = (...args) => globalThis.showStoreReviewPrompt?.(...args),
} = {}) {
  function read() {
    try {
      const parsed = JSON.parse(storage.getItem(REVIEW_STATE_KEY) || '{}');
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  }

  function afterSuccessfulId() {
    const requestReview = nativeReview();
    const result = runReviewPrompt({
      state: read(),
      now: now(),
      nativeReview: typeof requestReview === 'function' ? requestReview : undefined,
      storeShell: storeShell() === true,
      gateVisible: Boolean(doc?.getElementById?.('third-scan-soft-gate') || doc?.getElementById?.('free-id-soft-gate')),
      track,
      showWebPrompt,
    });
    if (result.decision === 'native' || result.decision === 'unavailable' || result.decision === 'web') {
      try { storage.setItem(REVIEW_STATE_KEY, JSON.stringify(result.state)); } catch {}
    }
    return result.decision;
  }

  return { afterSuccessfulId };
}

if (typeof document !== 'undefined' && typeof window !== 'undefined') {
  window.SplashLensReview = createReviewPrompt();
}
