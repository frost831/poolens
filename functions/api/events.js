const ALERT_EVENTS = new Set([
  'app_open',
  'pwa_installed',
  'ai_scan_started',
  'manual_code_search',
  'partsnap_result',
  'waitlist_signup',
  'checkout_success',
]);

function json(status, payload, extraHeaders = {}) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...extraHeaders },
  });
}

function clean(value, max = 120) {
  return String(value || '').replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, max);
}

function notifyConfig(env) {
  return {
    apiKey: (env.SENDGRID_API_KEY || '').trim(),
    from: (env.SENDGRID_FROM || env.FLAGSHIP_NOTIFY_FROM || 'hello@splashlens.com').trim(),
    to: (env.SPLASHLENS_NOTIFY_TO || env.FLAGSHIP_NOTIFY_TO || env.LEAD_NOTIFY_TO || env.ADMIN_EMAIL || '').trim(),
  };
}

function authOk(request, env) {
  const secret = String(env.SPLASHLENS_STATS_SECRET || env.SPLASHLENS_ADMIN_SECRET || '').trim();
  if (!secret) return false;

  const auth = request.headers.get('Authorization') || '';
  const bearer = auth.replace(/^Bearer\s+/i, '').trim();
  const headerSecret = request.headers.get('X-SplashLens-Stats-Secret') || '';
  return bearer === secret || headerSecret === secret;
}

function eventTime(record) {
  const value = Date.parse(record.createdAt || record.created_at || '');
  return Number.isFinite(value) ? value : 0;
}

function parseProps(record) {
  try {
    if (record.props && typeof record.props === 'object') return record.props;
    if (record.propsJson) return JSON.parse(record.propsJson);
  } catch {}
  return {};
}

function inc(map, key) {
  const safeKey = clean(key || 'unknown', 80) || 'unknown';
  map.set(safeKey, (map.get(safeKey) || 0) + 1);
}

function topList(map, limit = 12) {
  return Array.from(map.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .slice(0, limit);
}

async function eventSummary(request, env) {
  if (!authOk(request, env)) {
    return json(401, { ok: false, error: 'Unauthorized' });
  }
  if (!env.SCAN_USAGE_KV || typeof env.SCAN_USAGE_KV.list !== 'function') {
    return json(503, { ok: false, error: 'SCAN_USAGE_KV event storage is not configured' });
  }

  const url = new URL(request.url);
  const limit = Math.min(Math.max(Number(url.searchParams.get('limit') || 500), 50), 1000);
  let cursor;
  const records = [];

  do {
    const page = await env.SCAN_USAGE_KV.list({ prefix: 'event:', cursor, limit: Math.min(limit, 1000) });
    for (const key of page.keys || []) {
      if (records.length >= limit) break;
      const raw = await env.SCAN_USAGE_KV.get(key.name);
      if (!raw) continue;
      try {
        const record = JSON.parse(raw);
        records.push(record);
      } catch {}
    }
    cursor = page.list_complete ? undefined : page.cursor;
  } while (cursor && records.length < limit);

  records.sort((a, b) => eventTime(b) - eventTime(a));

  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  const since7d = now - 7 * dayMs;
  const since30d = now - 30 * dayMs;
  const eventsByName = new Map();
  const paths = new Map();
  const scanModes = new Map();
  const manualQueries = new Map();
  let events7d = 0;
  let events30d = 0;
  let appOpens7d = 0;
  let appOpens30d = 0;
  let installs30d = 0;
  let scans30d = 0;
  let searches30d = 0;
  let partsnapResults30d = 0;

  for (const record of records) {
    const ts = eventTime(record);
    const props = parseProps(record);
    inc(eventsByName, record.event);
    inc(paths, record.path || props.path || 'unknown');

    if (ts >= since7d) events7d += 1;
    if (ts >= since30d) {
      events30d += 1;
      if (record.event === 'app_open') appOpens30d += 1;
      if (record.event === 'pwa_installed') installs30d += 1;
      if (record.event === 'ai_scan_started') {
        scans30d += 1;
        inc(scanModes, props.mode || record.mode || 'unknown');
      }
      if (record.event === 'manual_code_search') {
        searches30d += 1;
        inc(manualQueries, [props.brand, props.query].filter(Boolean).join(': ') || props.query || 'unknown');
      }
      if (record.event === 'partsnap_result') partsnapResults30d += 1;
    }
    if (ts >= since7d && record.event === 'app_open') appOpens7d += 1;
  }

  return json(200, {
    ok: true,
    generatedAt: new Date().toISOString(),
    metrics: {
      storedEvents: records.length,
      events7d,
      events30d,
      appOpens7d,
      appOpens30d,
      installs30d,
      scans30d,
      searches30d,
      partsnapResults30d,
    },
    topEvents: topList(eventsByName),
    topPaths: topList(paths),
    scanModes: topList(scanModes),
    manualQueries: topList(manualQueries, 20),
    recentEvents: records.slice(0, 50).map((record) => ({
      event: record.event,
      source: record.source,
      path: record.path,
      createdAt: record.createdAt,
      props: parseProps(record),
    })),
    caveats: [
      'PWA install events are browser-dependent and may not fire on every iOS add-to-home-screen install.',
      'App opens are anonymous events; unique users need a durable anonymous client ID in a future pass.',
      'Email alerts are intentionally limited to usage/conversion events, not outreach email opens.',
    ],
  });
}

async function sendEventAlert(env, record) {
  const config = notifyConfig(env);
  if (!config.apiKey || !config.from || !config.to) {
    return { sent: false, reason: 'missing_sendgrid_config' };
  }

  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${config.apiKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [{
        to: [{ email: config.to }],
        subject: `[SplashLens App] ${record.event}`,
      }],
      from: { email: config.from, name: 'SplashLens Alerts' },
      categories: ['splashlens', 'app-event', record.event],
      content: [{
        type: 'text/plain',
        value: [
          'SplashLens app event',
          '',
          `Event: ${record.event}`,
          `Source: ${record.source}`,
          `Path: ${record.path}`,
          `Created: ${record.createdAt}`,
          '',
          `Props: ${record.propsJson}`,
        ].join('\n'),
      }],
    }),
  });

  return { sent: response.ok, status: response.status };
}

export async function onRequestPost({ request, env }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json(400, { ok: false, error: 'Invalid JSON' });
  }

  const event = clean(body.event || body.name, 80);
  if (!event) return json(400, { ok: false, error: 'Event name required' });

  const props = body.props && typeof body.props === 'object' ? body.props : {};
  const record = {
    event,
    source: clean(body.source || props.source || 'app', 60),
    path: clean(body.path || props.path || '', 300),
    createdAt: new Date().toISOString(),
    propsJson: JSON.stringify(props).slice(0, 2000),
  };

  if (env.SCAN_USAGE_KV) {
    const key = `event:${record.createdAt}:${crypto.randomUUID()}`;
    await env.SCAN_USAGE_KV.put(key, JSON.stringify(record), { expirationTtl: 60 * 60 * 24 * 120 });
  }

  let alert = { sent: false, skipped: true };
  if (ALERT_EVENTS.has(event)) {
    alert = await sendEventAlert(env, record);
    console.log('SplashLens app event alert:', JSON.stringify({ event, alert }));
  }

  return json(200, {
    ok: true,
    stored: Boolean(env.SCAN_USAGE_KV),
    alertQueued: Boolean(alert.sent),
    emailConfigured: alert.reason !== 'missing_sendgrid_config',
  });
}

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  if (url.searchParams.get('summary') === '1') {
    return eventSummary(request, env);
  }

  return json(200, {
    ok: true,
    status: 'SplashLens app event endpoint ready.',
    storageConfigured: Boolean(env.SCAN_USAGE_KV),
    emailConfigured: Boolean((env.SENDGRID_API_KEY || '').trim() && (env.SPLASHLENS_NOTIFY_TO || env.FLAGSHIP_NOTIFY_TO || env.LEAD_NOTIFY_TO || env.ADMIN_EMAIL || '').trim()),
  });
}
