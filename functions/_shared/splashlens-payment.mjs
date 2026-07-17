function clean(value, max = 180) {
  return String(value || '').replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, max);
}

function paymentTime(session) {
  const created = Number(session?.created || 0);
  const date = created > 0 ? new Date(created * 1000) : new Date();
  return Number.isFinite(date.getTime()) ? date.toISOString() : new Date().toISOString();
}

export async function recordVerifiedSplashLensPayment(env, session, details = {}) {
  if (!env.SCAN_USAGE_KV || typeof env.SCAN_USAGE_KV.put !== 'function') {
    return { stored: false, reason: 'missing_event_storage' };
  }

  const sessionId = clean(session?.id, 120);
  if (!/^cs_(test|live)_[A-Za-z0-9]+$/.test(sessionId)) {
    return { stored: false, reason: 'invalid_session_id' };
  }

  const createdAt = paymentTime(session);
  const subject = clean(details.subject || session?.customer_details?.email || session?.customer_email || session?.customer, 180).toLowerCase();
  const plan = clean(details.plan || session?.metadata?.plan || 'PartSnap Pro', 100);
  const planKey = clean(details.planKey || session?.metadata?.plan_key || '', 100);
  const feature = clean(details.feature || session?.metadata?.feature || '', 100);
  const scopes = Array.isArray(details.scopes)
    ? details.scopes.map((scope) => clean(scope, 60)).filter(Boolean).slice(0, 12)
    : clean(details.scopes || session?.metadata?.scopes || '', 300).split(',').map((scope) => clean(scope, 60)).filter(Boolean).slice(0, 12);
  const source = clean(details.source || 'stripe_server_verification', 60);
  const amountTotal = Math.max(0, Number(session?.amount_total || 0) || 0);
  const currency = clean(session?.currency, 12).toLowerCase();
  const paymentLinkId = clean(session?.payment_link, 120);
  const payment = {
    subject,
    plan,
    planKey,
    feature,
    scopes,
    source,
    stripeSessionId: sessionId,
    stripeCustomerId: clean(session?.customer, 120),
    stripePaymentLinkId: paymentLinkId,
    amountTotal,
    currency,
    createdAt,
  };
  const event = {
    event: 'checkout_success',
    source: 'stripe',
    path: clean(details.path || '/api/checkout-success', 300),
    language: { preferredLanguage: 'en', locale: 'en', autoTranslate: false },
    createdAt,
    propsJson: JSON.stringify({
      subject,
      plan,
      plan_key: planKey,
      feature,
      scopes,
      amount_total: amountTotal,
      currency,
      stripe_session_id: sessionId,
      stripe_payment_link_id: paymentLinkId,
      payment_source: source,
    }).slice(0, 2000),
  };
  const eventKey = `event:${createdAt}:checkout_success:${sessionId}`;

  await Promise.all([
    env.SCAN_USAGE_KV.put(`payment:${sessionId}`, JSON.stringify(payment), {
      expirationTtl: 365 * 24 * 60 * 60,
    }),
    env.SCAN_USAGE_KV.put(eventKey, JSON.stringify(event), {
      expirationTtl: 365 * 24 * 60 * 60,
    }),
  ]);
  return { stored: true, sessionId, eventKey };
}
