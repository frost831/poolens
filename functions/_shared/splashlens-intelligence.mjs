function count(value) {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 0;
}

function rate(numerator, denominator) {
  if (!denominator) return null;
  return Math.round((numerator / denominator) * 1000) / 10;
}

function metric(value, status, definition, source, extra = {}) {
  return {
    value: status === 'unavailable' ? null : count(value),
    status,
    definition,
    source,
    ...extra,
  };
}

function recommendation(id, priority, title, rationale, action, evidence = {}) {
  return { id, priority, title, rationale, action, evidence };
}

export function buildSplashLensAggregate(summary, options = {}) {
  const m = summary?.metrics || {};
  const observedAt = options.observedAt || summary?.generatedAt || new Date().toISOString();
  const dataThrough = summary?.dataThrough || null;
  const partial = Boolean(m.aggregateTruncated);
  const productStatus = partial ? 'partial' : 'observed';
  const revenueStatus = options.revenueConfigured ? productStatus : 'unavailable';
  const uniqueClients = count(m.uniqueClients30d);
  const activatedClients = count(m.activatedClients30d);
  const paidConversions = count(m.checkoutSuccess30d);
  const revenueCents = count(m.revenueCents30d);
  const searches = count(m.searches30d);
  const currencies = Array.from(new Set((summary?.recentPayments || [])
    .map((payment) => String(payment.currency || '').trim().toUpperCase())
    .filter(Boolean)));

  const recommendations = [];
  if (partial) {
    recommendations.push(recommendation(
      'increase-event-coverage',
      'high',
      'Increase aggregate event coverage',
      'The 30-day event set hit the protected endpoint limit, so the displayed counts are lower bounds.',
      'Move daily aggregates into durable counters or page through the full event set before using rates for decisions.',
      { discoveredEvents: count(m.aggregateKeysFound), processedEvents: count(m.storedEvents) },
    ));
  }
  if (count(m.partSnapStuck30d) > 0) {
    recommendations.push(recommendation(
      'review-stuck-partsnap-results',
      'high',
      'Review stuck PartSnap results',
      'Low-confidence, high-risk, or proof-incomplete results are the clearest product-friction signal.',
      'Review the affected result sessions and improve the top category prompt, proof request, or source coverage.',
      { stuckResults: count(m.partSnapStuck30d), topCategory: summary?.topPartSnapCategories?.[0]?.name || null },
    ));
  }
  if (count(m.quickFeedbackMissed30d) > count(m.quickFeedbackHelpful30d)) {
    recommendations.push(recommendation(
      'fix-negative-feedback-cluster',
      'high',
      'Fix the leading missed-result pattern',
      'Users marked more tracked workflows as wrong or missing than helpful in this window.',
      'Cluster recent missed feedback by workflow and equipment category, then verify the highest-volume failure first.',
      { helpful: count(m.quickFeedbackHelpful30d), missed: count(m.quickFeedbackMissed30d) },
    ));
  }
  if (searches > 0 && activatedClients === 0) {
    recommendations.push(recommendation(
      'audit-search-to-activation',
      'medium',
      'Audit search-to-activation continuity',
      'Search activity exists but no new client recorded its one-time first-value activation in the same window.',
      'Verify activation_completed still fires after the first successful lookup and segment returning devices from new users.',
      { searches, activatedClients },
    ));
  }
  if (options.revenueConfigured && activatedClients > 0 && paidConversions === 0) {
    recommendations.push(recommendation(
      'test-post-value-upgrade-path',
      'medium',
      'Test the upgrade path after demonstrated value',
      'Product activation is measurable, but no server-verified paid checkout appeared in this window.',
      'Show the upgrade decision after a useful PartSnap result or free-limit boundary and measure checkout completion separately.',
      { activatedClients, paidConversions },
    ));
  }
  if (!options.revenueConfigured) {
    recommendations.push(recommendation(
      'repair-paid-outcome-source',
      'high',
      'Restore the paid-outcome source',
      'Revenue is unavailable because server-side Stripe verification and durable event storage are not both configured.',
      'Configure the Stripe verification path before treating paid conversions or revenue as zero.',
    ));
  }
  if (summary?.topDemandLanes?.[0]) {
    recommendations.push(recommendation(
      'expand-leading-demand-lane',
      'low',
      `Expand ${summary.topDemandLanes[0].name} coverage`,
      'This is the highest-volume classified demand lane in the observed product-event window.',
      'Review its top queries and missing-proof feedback before adding the next source page or workflow.',
      { lane: summary.topDemandLanes[0].name, actions: count(summary.topDemandLanes[0].count) },
    ));
  }
  if (count(m.sessionCount30d) >= 5 && Number(m.meaningfulSessionRate30d || 0) < 35) {
    recommendations.push(recommendation(
      'shorten-path-to-field-value',
      'high',
      'Shorten the path to a useful field result',
      'Fewer than 35% of observed sessions reached a meaningful lookup, scan, proof, facility, or payment action.',
      'Route each role directly to its primary job and remove choices before the first result.',
      { meaningfulSessionRate: Number(m.meaningfulSessionRate30d || 0), sessions: count(m.sessionCount30d) },
    ));
  }
  if (Number(m.medianTimeToValueSeconds30d || 0) > 90) {
    recommendations.push(recommendation(
      'reduce-time-to-value',
      'high',
      'Reduce median time to first value',
      'The observed median first-value path is longer than 90 seconds.',
      'Open returning users on their last useful tool and make the first role choice skip directly to that workflow.',
      { medianTimeToValueSeconds: count(m.medianTimeToValueSeconds30d) },
    ));
  }
  if (count(m.partsnapResults30d) >= 3 && Number(m.proofFollowThroughRate30d || 0) < 20) {
    recommendations.push(recommendation(
      'centralize-proof-next-step',
      'medium',
      'Make the proof next step unmistakable',
      'Few observed PartSnap result sessions continued into saved service proof.',
      'Place one primary Save visit proof action directly below the cautious identification result.',
      { proofFollowThroughRate: Number(m.proofFollowThroughRate30d || 0) },
    ));
  }
  if (count(m.checkoutStarts30d) >= 2 && count(m.checkoutSuccess30d) === 0 && options.revenueConfigured) {
    recommendations.push(recommendation(
      'inspect-checkout-dropoff',
      'high',
      'Inspect checkout drop-off',
      'Observed upgrade starts did not produce a server-verified checkout success.',
      'Test the full purchase and entitlement path on mobile, then compare plan copy with the feature unlocked.',
      { checkoutStarts: count(m.checkoutStarts30d) },
    ));
  }
  if (count(m.uniqueClients30d) >= 5 && Number(m.returnClientRate30d || 0) < 20) {
    recommendations.push(recommendation(
      'build-useful-return-loop',
      'medium',
      'Give users a practical reason to return',
      'Fewer than 20% of observed anonymous clients returned on a second calendar day.',
      'Prioritize Continue last job, saved pool history, next-visit prompts, and newly added equipment relevant to prior work.',
      { returnClientRate: Number(m.returnClientRate30d || 0) },
    ));
  }

  return {
    ok: true,
    schemaVersion: 1,
    product: 'splashlens',
    windowDays: 30,
    observedAt,
    dataThrough,
    freshness: dataThrough ? 'observed' : 'observed_empty',
    dataQuality: {
      status: productStatus,
      truncated: partial,
      discoveredEvents: count(m.aggregateKeysFound),
      processedEvents: count(m.storedEvents),
      note: partial
        ? 'Counts are lower bounds because the protected event-read limit was reached.'
        : 'Counts are based on stored first-party events in the requested 30-day window.',
    },
    metrics: {
      searches: metric(searches, productStatus, 'Manual code and equipment lookup searches', 'SCAN_USAGE_KV:manual_code_search'),
      primaryActions: metric(count(m.activationCompletions30d), productStatus, 'One-time first-value activation completions', 'SCAN_USAGE_KV:activation_completed', {
        uniqueClients: activatedClients,
      }),
      paidConversions: metric(paidConversions, revenueStatus, 'Server-verified paid Stripe checkout sessions', 'Stripe verification + SCAN_USAGE_KV:checkout_success'),
      revenue: {
        valueCents: revenueStatus === 'unavailable' ? null : revenueCents,
        status: revenueStatus,
        currency: currencies.length === 1 ? currencies[0] : null,
        definition: 'Gross amount_total from server-verified paid Stripe checkout sessions; refunds and fees are not netted.',
        source: 'Stripe verification + SCAN_USAGE_KV:checkout_success',
      },
      uniqueClients: metric(uniqueClients, productStatus, 'Anonymous clients with at least one stored event', 'SCAN_USAGE_KV:client_id'),
      activationRate: {
        valuePercent: rate(activatedClients, uniqueClients),
        status: uniqueClients ? productStatus : 'unavailable',
        definition: 'Unique activated clients divided by unique observed clients.',
      },
      paidConversionRate: {
        valuePercent: options.revenueConfigured ? rate(paidConversions, activatedClients) : null,
        status: options.revenueConfigured && activatedClients ? productStatus : 'unavailable',
        definition: 'Server-verified paid checkouts divided by unique activated clients.',
      },
    },
    productSignals: {
      aiScans: count(m.scans30d),
      partSnapResults: count(m.partsnapResults30d),
      stuckPartSnapResults: count(m.partSnapStuck30d),
      proofSaves: count(m.proofSaved30d),
      helpfulFeedback: count(m.quickFeedbackHelpful30d),
      missedFeedback: count(m.quickFeedbackMissed30d),
      topSearches: summary?.manualQueries || [],
      topDemandLanes: summary?.topDemandLanes || [],
      topPartSnapCategories: summary?.topPartSnapCategories || [],
      sessions: count(m.sessionCount30d),
      meaningfulSessionRate: Number(m.meaningfulSessionRate30d || 0),
      returnClientRate: Number(m.returnClientRate30d || 0),
      abandonmentRate: Number(m.abandonmentRate30d || 0),
      proofFollowThroughRate: Number(m.proofFollowThroughRate30d || 0),
      checkoutCompletionRate: m.checkoutCompletionRate30d == null ? null : Number(m.checkoutCompletionRate30d),
      medianTimeToValueSeconds: m.medianTimeToValueSeconds30d == null ? null : count(m.medianTimeToValueSeconds30d),
      engagedSeconds: count(m.totalEngagedSeconds30d),
      topTabDwell: summary?.topTabDwell || [],
    },
    recommendations,
    caveats: [
      'Searches are product lookup events, not website search-engine queries.',
      'Primary actions are first-value product activations, not purchases.',
      'Paid conversions require server-side Stripe verification; checkout clicks are never counted.',
      'Revenue is gross checkout amount and must not be treated as recognized or net revenue.',
    ],
  };
}
