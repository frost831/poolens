import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import {
  REVIEW_COOLDOWN_MS,
  REVIEW_STATE_KEY,
  createReviewPrompt,
  reviewDecision,
  runReviewPrompt,
} from '../js/review-prompt.js';

const NOW = Date.parse('2026-10-12T12:00:00Z');

test('review prompt waits 45 days and does not start that wait while an offer is open', () => {
  assert.equal(REVIEW_COOLDOWN_MS, 45 * 24 * 60 * 60 * 1000);
  const recent = { idPromptAt: NOW - REVIEW_COOLDOWN_MS + 1 };
  assert.equal(reviewDecision(recent, NOW), 'skip');
  assert.equal(reviewDecision({ idPromptAt: NOW - REVIEW_COOLDOWN_MS }, NOW), 'web');
  assert.equal(reviewDecision({ reviewedAt: NOW - 1 }, NOW, { native: true }), 'skip');
  assert.equal(reviewDecision({ declinedAt: NOW - 1000 }, NOW), 'skip');
  assert.equal(reviewDecision({}, NOW, { blocked: true, native: true }), 'defer');
  assert.equal(reviewDecision({}, NOW, { native: true, storeShell: true }), 'native');
  assert.equal(reviewDecision({}, NOW, { storeShell: true }), 'unavailable');
});

test('native requestReview is called once and a thrown hook is still rate-limited', () => {
  const events = [];
  let calls = 0;
  const shown = [];
  const requested = runReviewPrompt({
    state: { wins: 2 },
    now: NOW,
    nativeReview: () => { calls += 1; },
    storeShell: true,
    track: (name, props) => events.push({ name, props }),
    showWebPrompt: (...args) => shown.push(args),
  });
  assert.equal(calls, 1);
  assert.equal(requested.decision, 'native');
  assert.equal(requested.state.idPromptAt, NOW);
  assert.equal(requested.state.wins, 2);
  assert.equal(events[0].name, 'store_review_prompt_requested');
  assert.equal(events[0].props.trigger, 'partsnap_result_success');
  assert.equal(shown.length, 0);
  const failed = runReviewPrompt({
    now: NOW,
    nativeReview: () => { throw new Error('bridge down'); },
    track: (name) => events.push({ name }),
    showWebPrompt: () => shown.push('web'),
  });
  assert.equal(failed.decision, 'native');
  assert.equal(failed.state.idPromptAt, NOW);
  assert.equal(events.at(-1).name, 'store_review_prompt_failed');
  assert.equal(shown.length, 0);
});

function memory(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem: key => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => values.set(key, String(value)),
  };
}

test('store shells without the native hook do not render a review card', () => {
  const storage = memory();
  const shown = [];
  const events = [];
  const review = createReviewPrompt({
    storage,
    document: { getElementById: () => null },
    now: () => NOW,
    nativeReview: () => undefined,
    storeShell: () => true,
    track: name => events.push(name),
    showWebPrompt: () => shown.push('web'),
  });
  assert.equal(review.afterSuccessfulId(), 'unavailable');
  assert.deepEqual(events, ['store_review_prompt_unavailable']);
  assert.equal(shown.length, 0);
  assert.equal(JSON.parse(storage.getItem(REVIEW_STATE_KEY)).idPromptAt, NOW);
  assert.equal(review.afterSuccessfulId(), 'skip');
});

test('web review uses the existing prompt and waits while a soft gate is open', () => {
  const storage = memory({ [REVIEW_STATE_KEY]: JSON.stringify({ wins: 1 }) });
  const events = [];
  const shown = [];
  const gates = new Set(['free-id-soft-gate']);
  const review = createReviewPrompt({
    storage,
    document: { getElementById: id => gates.has(id) ? { id } : null },
    now: () => NOW,
    nativeReview: () => undefined,
    storeShell: () => false,
    track: name => events.push(name),
    showWebPrompt: (trigger, options) => shown.push({ trigger, options }),
  });
  assert.equal(review.afterSuccessfulId(), 'defer');
  assert.equal(storage.getItem(REVIEW_STATE_KEY), JSON.stringify({ wins: 1 }));
  gates.clear();
  assert.equal(review.afterSuccessfulId(), 'web');
  assert.deepEqual(shown, [{ trigger: 'partsnap_result_success', options: { force: true, silent: true } }]);
  assert.deepEqual(events, ['store_review_prompt_shown']);
  assert.equal(JSON.parse(storage.getItem(REVIEW_STATE_KEY)).wins, 1);
});

test('successful identification asks for review after the soft gate and does not reuse the win prompt', () => {
  const app = readFileSync(new URL('../js/app.js', import.meta.url), 'utf8');
  const success = app.slice(app.indexOf("trackSplashLensEvent('partsnap_result_success'"), app.indexOf('trackPartSnapResultFailure(showGuidedRetry'));
  const soft = success.indexOf('SplashLensSoftGate?.noteSuccessfulFreeId');
  const review = success.indexOf('SplashLensReview?.afterSuccessfulId');
  assert.ok(soft > 0 && review > soft);
  const wins = app.slice(app.indexOf('const STORE_REVIEW_SUCCESS_EVENTS'), app.indexOf('const ACTIVATION_EVENT_TYPES'));
  assert.doesNotMatch(wins, /partsnap_result_success/);
  assert.match(app.slice(app.indexOf('function showStoreReviewPrompt'), app.indexOf('function closeStoreReviewPrompt')), /options = \{\}/);
  assert.match(app, /options\.force/);
  assert.match(app, /if \(overlayOpen\) return false/);
  const source = readFileSync(new URL('../js/review-prompt.js', import.meta.url), 'utf8');
  assert.match(source, /SplashLensNative\?\.requestReview/);
  assert.doesNotMatch(source, /Notification|requestPermission/);
});
