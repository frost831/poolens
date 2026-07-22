import assert from 'node:assert/strict';
import test from 'node:test';

import { buildSplashLensAggregate } from '../functions/_shared/splashlens-intelligence.mjs';

function summary(overrides = {}) {
  return {
    generatedAt: '2026-07-16T12:00:00.000Z',
    dataThrough: '2026-07-16T11:59:00.000Z',
    metrics: {
      storedEvents: 42,
      aggregateKeysFound: 42,
      aggregateTruncated: false,
      uniqueClients30d: 10,
      activatedClients30d: 4,
      activationCompletions30d: 4,
      searches30d: 12,
      checkoutSuccess30d: 1,
      revenueCents30d: 499,
      scans30d: 3,
      partsnapResults30d: 2,
      partSnapStuck30d: 1,
      proofSaved30d: 2,
      quickFeedbackHelpful30d: 3,
      quickFeedbackMissed30d: 1,
      ...overrides,
    },
    recentPayments: [{ currency: 'usd' }],
    manualQueries: [{ name: 'Pentair: E05', count: 4 }],
    topDemandLanes: [{ name: 'Spa / Hot Tub', count: 5 }],
    topPartSnapCategories: [{ name: 'pump', count: 2 }],
  };
}

test('keeps product activations separate from paid conversions', () => {
  const aggregate = buildSplashLensAggregate(summary(), { revenueConfigured: true });

  assert.equal(aggregate.metrics.searches.value, 12);
  assert.equal(aggregate.metrics.primaryActions.value, 4);
  assert.equal(aggregate.metrics.primaryActions.uniqueClients, 4);
  assert.equal(aggregate.metrics.paidConversions.value, 1);
  assert.equal(aggregate.metrics.revenue.valueCents, 499);
  assert.equal(aggregate.metrics.activationRate.valuePercent, 40);
  assert.equal(aggregate.metrics.paidConversionRate.valuePercent, 25);
  assert.match(aggregate.metrics.paidConversions.definition, /server-verified/i);
});

test('reports paid outcomes as unavailable when Stripe verification is not connected', () => {
  const aggregate = buildSplashLensAggregate(summary({ checkoutSuccess30d: 0, revenueCents30d: 0 }), {
    revenueConfigured: false,
  });

  assert.equal(aggregate.metrics.searches.status, 'observed');
  assert.equal(aggregate.metrics.paidConversions.status, 'unavailable');
  assert.equal(aggregate.metrics.paidConversions.value, null);
  assert.equal(aggregate.metrics.revenue.status, 'unavailable');
  assert.equal(aggregate.metrics.revenue.valueCents, null);
  assert.ok(aggregate.recommendations.some((item) => item.id === 'repair-paid-outcome-source'));
});

test('marks counts partial when the event read is truncated', () => {
  const aggregate = buildSplashLensAggregate(summary({
    aggregateKeysFound: 1200,
    storedEvents: 1000,
    aggregateTruncated: true,
  }), { revenueConfigured: true });

  assert.equal(aggregate.dataQuality.status, 'partial');
  assert.equal(aggregate.metrics.searches.status, 'partial');
  assert.ok(aggregate.recommendations.some((item) => item.id === 'increase-event-coverage'));
});

test('turns observed session friction into deterministic product recommendations', () => {
  const aggregate = buildSplashLensAggregate(summary({
    sessionCount30d: 20,
    meaningfulSessionRate30d: 25,
    medianTimeToValueSeconds30d: 125,
    returnClientRate30d: 10,
    checkoutStarts30d: 4,
    checkoutSuccess30d: 0,
    partsnapResults30d: 10,
    proofFollowThroughRate30d: 10,
  }), { revenueConfigured: true });

  const ids = new Set(aggregate.recommendations.map((item) => item.id));
  assert.ok(ids.has('shorten-path-to-field-value'));
  assert.ok(ids.has('reduce-time-to-value'));
  assert.ok(ids.has('centralize-proof-next-step'));
  assert.ok(ids.has('inspect-checkout-dropoff'));
  assert.ok(ids.has('build-useful-return-loop'));
  assert.equal(aggregate.productSignals.sessions, 20);
  assert.equal(aggregate.productSignals.medianTimeToValueSeconds, 125);
});
