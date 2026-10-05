import { forwardEventToAmplitude } from './amplitude.mjs';

export const SERVER_PAYMENT_EVENTS = new Set([
  'checkout_session_created', 'checkout_completed', 'subscription_created', 'entitlement_granted',
]);

function opaque(value, pattern) {
  const text = String(value || '');
  return pattern.test(text) ? text : '';
}

export function checkoutAttribution(input = {}) {
  const reference = opaque(input.client_reference_id, /^sl_checkout_[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i);
  return {
    source: reference && ['app', 'site'].includes(input.source) ? input.source : input.source === 'admin' ? 'admin' : 'server',
    client_reference_id: reference,
    client_id: opaque(input.client_id, /^(?:[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}|scan-[a-f0-9]{1,64})$/i),
    session_id: opaque(input.session_id, /^session-[a-z0-9]+-[a-z0-9-]{1,8}$/i),
    placement: opaque(input.placement, /^[a-z0-9_-]{1,80}$/i),
    store: ['ios', 'android', 'web'].includes(input.store) ? input.store : 'web',
  };
}

export function sessionAttribution(session) {
  return checkoutAttribution({ ...session?.metadata, client_reference_id: session?.client_reference_id || session?.metadata?.client_reference_id });
}

// Record server proof once across webhook retries and checkout-success reloads.
export async function recordPaymentEvent(env, event, reference, { plan = '', path = '', props = {}, userAgent = '' } = {}) {
  if (!SERVER_PAYMENT_EVENTS.has(event) || !reference) return;
  const db = env.SUBSCRIBERS_DB;
  if (!db || typeof db.prepare !== 'function') return;
  const attribution = checkoutAttribution(props);
  const safeProps = {
    ...attribution,
    payment_reference: reference,
    payment_status: ['paid', 'no_payment_required', 'unpaid'].includes(props.payment_status) ? props.payment_status : '',
    attribution_status: attribution.client_reference_id ? 'reference_present' : 'unattributed_server',
  };
  const eventKey = `${event}:${reference}`;
  try {
    await db.prepare(`CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT, event TEXT NOT NULL, source TEXT, path TEXT,
      plan TEXT, mode TEXT, props TEXT, user_agent TEXT, referrer TEXT, country TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`).run();
    await db.prepare(`CREATE TABLE IF NOT EXISTS payment_analytics_receipts (
      event_key TEXT PRIMARY KEY, created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`).run();
    const insertEvent = db.prepare(`INSERT INTO events (event, source, path, plan, mode, props, user_agent)
      SELECT ?, ?, ?, ?, 'server_verified', ?, ?
      WHERE NOT EXISTS (SELECT 1 FROM payment_analytics_receipts WHERE event_key = ?)`)
      .bind(event, safeProps.source, path, plan, JSON.stringify(safeProps), userAgent.slice(0, 300), eventKey);
    const receipt = db.prepare('INSERT OR IGNORE INTO payment_analytics_receipts (event_key) VALUES (?)').bind(eventKey);
    const results = typeof db.batch === 'function'
      ? await db.batch([insertEvent, receipt])
      : [await insertEvent.run(), await receipt.run()];
    if (results[0]?.meta?.changes === 0) return;
    await forwardEventToAmplitude(env, {
      correlationId: eventKey, event, source: safeProps.source, path, plan,
      mode: 'server_verified', createdAt: new Date().toISOString(),
    }, safeProps);
  } catch (error) {
    console.warn('SplashLens payment analytics unavailable:', String(error));
  }
}
