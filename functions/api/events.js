const ALERT_EVENTS = new Set([
  'article_referral_open',
  'first_app_open',
  'app_open',
  'pwa_install_prompt_seen',
  'pwa_installed',
  'pwa_standalone_open',
  'ai_scan_started',
  'manual_code_search',
  'partsnap_result',
  'partsnap_packet_copied',
  'partsnap_share_used',
  'partsnap_saved_to_pool',
  'partsnap_mystery_submitted',
  'partsnap_apprentice_started',
  'partsnap_partner_card_opened',
  'partsnap_second_proof_requested',
  'route_brain_saved_to_pool',
  'service_report_saved',
  'proof_ready_report_saved',
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
  const secret = String(
    env.SPLASHLENS_STATS_SECRET ||
    env.SPLASHLENS_ADMIN_SECRET ||
    env.SPLASHLENS_ENTITLEMENT_ADMIN_SECRET ||
    '',
  ).trim();
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

function eventSource(record, props = {}) {
  return clean(record.source || props.attribution_source || props.source || 'app', 80) || 'app';
}

function isPoolProEvent(record, props = {}) {
  const source = eventSource(record, props).toLowerCase();
  const attributionSource = clean(props.attribution_source || '', 80).toLowerCase();
  const referrer = clean(props.attribution_referrer || props.attribution_referrer_host || props.referrer || '', 300).toLowerCase();
  return source === 'poolpro' || attributionSource === 'poolpro' || referrer.includes('poolpromag.com');
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
  const keyNames = [];
  const records = [];

  do {
    const page = await env.SCAN_USAGE_KV.list({ prefix: 'event:', cursor, limit: 1000 });
    for (const key of page.keys || []) keyNames.push(key.name);
    cursor = page.list_complete ? undefined : page.cursor;
  } while (cursor);

  const newestKeys = keyNames.sort((a, b) => b.localeCompare(a)).slice(0, limit);
  for (const keyName of newestKeys) {
    const raw = await env.SCAN_USAGE_KV.get(keyName);
    if (!raw) continue;
    try {
      const record = JSON.parse(raw);
      records.push(record);
    } catch {}
  }

  records.sort((a, b) => eventTime(b) - eventTime(a));

  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  const since7d = now - 7 * dayMs;
  const since30d = now - 30 * dayMs;
  const eventsByName = new Map();
  const paths = new Map();
  const scanModes = new Map();
  const manualQueries = new Map();
  const callbackRisks = new Map();
  const sources = new Map();
  const referrers = new Map();
  const campaigns = new Map();
  const meaningfulEvents = new Set([
    'article_referral_open',
    'pwa_installed',
    'pwa_standalone_open',
    'ai_scan_started',
    'manual_code_search',
    'partsnap_result',
    'partsnap_packet_copied',
    'partsnap_share_used',
    'partsnap_saved_to_pool',
    'partsnap_mystery_submitted',
    'partsnap_apprentice_started',
    'partsnap_second_proof_requested',
    'route_brain_saved_to_pool',
    'service_report_saved',
    'proof_ready_report_saved',
    'checkout_success',
  ]);
  let events7d = 0;
  let events30d = 0;
  let appOpens7d = 0;
  let appOpens30d = 0;
  let firstOpens30d = 0;
  let installPrompts30d = 0;
  let installs30d = 0;
  let standaloneOpens30d = 0;
  let scans30d = 0;
  let searches30d = 0;
  let partsnapResults30d = 0;
  let meaningfulActions30d = 0;
  let partSnapPackets30d = 0;
  let partSnapSaved30d = 0;
  let partSnapMystery30d = 0;
  let partSnapApprentice30d = 0;
  let proofSaved30d = 0;
  let poolProEvents30d = 0;
  let poolProReferralOpens30d = 0;
  let poolProAppOpens30d = 0;
  let poolProFirstOpens30d = 0;
  let poolProInstalls30d = 0;
  let poolProStandaloneOpens30d = 0;
  let poolProScans30d = 0;
  let poolProStoreShellOpens30d = 0;
  let poolProMeaningfulActions30d = 0;
  const uniqueClients30d = new Set();
  const meaningfulClients30d = new Set();
  const poolProClients30d = new Set();

  for (const record of records) {
    const ts = eventTime(record);
    const props = parseProps(record);
    const clientId = clean(props.client_id || props.clientId || '', 120);
    const source = eventSource(record, props);
    const poolPro = isPoolProEvent(record, props);
    inc(eventsByName, record.event);
    inc(paths, record.path || props.path || 'unknown');
    inc(sources, source);
    if (props.attribution_referrer_host || props.attribution_referrer) inc(referrers, props.attribution_referrer_host || props.attribution_referrer);
    if (props.attribution_campaign) inc(campaigns, props.attribution_campaign);

    if (ts >= since7d) events7d += 1;
    if (ts >= since30d) {
      events30d += 1;
      if (clientId) uniqueClients30d.add(clientId);
      if (meaningfulEvents.has(record.event) && clientId) meaningfulClients30d.add(clientId);
      if (poolPro) {
        poolProEvents30d += 1;
        if (clientId) poolProClients30d.add(clientId);
        if (meaningfulEvents.has(record.event)) poolProMeaningfulActions30d += 1;
        if (record.event === 'article_referral_open') poolProReferralOpens30d += 1;
        if (record.event === 'first_app_open') poolProFirstOpens30d += 1;
        if (record.event === 'app_open') poolProAppOpens30d += 1;
        if (record.event === 'pwa_installed') poolProInstalls30d += 1;
        if (record.event === 'pwa_standalone_open') poolProStandaloneOpens30d += 1;
        if (record.event === 'ai_scan_started') poolProScans30d += 1;
        if (props.store_shell) poolProStoreShellOpens30d += 1;
      }
      if (record.event === 'first_app_open') firstOpens30d += 1;
      if (record.event === 'app_open') appOpens30d += 1;
      if (record.event === 'pwa_install_prompt_seen') installPrompts30d += 1;
      if (record.event === 'pwa_installed') installs30d += 1;
      if (record.event === 'pwa_standalone_open') standaloneOpens30d += 1;
      if (record.event === 'ai_scan_started') {
        scans30d += 1;
        inc(scanModes, props.mode || record.mode || 'unknown');
      }
      if (record.event === 'manual_code_search') {
        searches30d += 1;
        inc(manualQueries, [props.brand, props.query].filter(Boolean).join(': ') || props.query || 'unknown');
      }
      if (record.event === 'partsnap_result') partsnapResults30d += 1;
      if (meaningfulEvents.has(record.event)) meaningfulActions30d += 1;
      if (record.event === 'partsnap_packet_copied' || record.event === 'partsnap_share_used') partSnapPackets30d += 1;
      if (record.event === 'partsnap_saved_to_pool') partSnapSaved30d += 1;
      if (record.event === 'partsnap_mystery_submitted') partSnapMystery30d += 1;
      if (record.event === 'partsnap_apprentice_started') partSnapApprentice30d += 1;
      if (record.event === 'partsnap_saved_to_pool' || record.event === 'route_brain_saved_to_pool' || record.event === 'service_report_saved' || record.event === 'proof_ready_report_saved') proofSaved30d += 1;
      if (props.risk || props.callbackRisk) inc(callbackRisks, props.risk || props.callbackRisk);
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
      firstOpens30d,
      uniqueClients30d: uniqueClients30d.size,
      meaningfulClients30d: meaningfulClients30d.size,
      installPrompts30d,
      installs30d,
      standaloneOpens30d,
      scans30d,
      searches30d,
      partsnapResults30d,
      meaningfulActions30d,
      partSnapPackets30d,
      partSnapSaved30d,
      partSnapMystery30d,
      partSnapApprentice30d,
      proofSaved30d,
      poolProEvents30d,
      poolProReferralOpens30d,
      poolProAppOpens30d,
      poolProFirstOpens30d,
      poolProInstalls30d,
      poolProStandaloneOpens30d,
      poolProScans30d,
      poolProStoreShellOpens30d,
      poolProMeaningfulActions30d,
      poolProClients30d: poolProClients30d.size,
    },
    topEvents: topList(eventsByName),
    topSources: topList(sources),
    topReferrers: topList(referrers),
    topCampaigns: topList(campaigns),
    topPaths: topList(paths),
    scanModes: topList(scanModes),
    callbackRisks: topList(callbackRisks),
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
      'Native App Store downloads are only visible here after the app/web wrapper opens or when a tracked store click/referral reaches the app.',
      'Email alerts are intentionally limited to usage/conversion events, not outreach email opens.',
    ],
  });
}

async function sendEventAlert(env, record) {
  const config = notifyConfig(env);
  if (!config.apiKey || !config.from || !config.to) {
    return { sent: false, reason: 'missing_sendgrid_config' };
  }
  const labels = {
    first_app_open: 'First app open',
    article_referral_open: 'Article/referral landing',
    app_open: 'First/opened app',
    pwa_install_prompt_seen: 'Install prompt shown',
    pwa_installed: 'Installed app/PWA',
    pwa_standalone_open: 'Standalone/PWA open',
    ai_scan_started: 'Scanner used',
    manual_code_search: 'Manual code search',
    partsnap_result: 'PartSnap result',
    partsnap_packet_copied: 'PartSnap packet copied',
    partsnap_share_used: 'PartSnap packet shared',
    partsnap_saved_to_pool: 'PartSnap saved to proof passport',
    partsnap_mystery_submitted: 'Mystery Part Lab submission',
    partsnap_apprentice_started: 'PartSnap Apprentice Mode started',
    partsnap_second_proof_requested: 'PartSnap second proof requested',
    route_brain_saved_to_pool: 'Route Brain proof saved',
    service_report_saved: 'Service report saved',
    proof_ready_report_saved: 'Proof-ready report saved',
    waitlist_signup: 'Waitlist signup',
    checkout_success: 'Checkout success',
  };
  const props = parseProps(record);
  const source = eventSource(record, props);
  const sourcePrefix = source && source !== 'app' ? `${source.toUpperCase()} - ` : '';

  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${config.apiKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [{
        to: [{ email: config.to }],
        subject: `[SplashLens App] ${sourcePrefix}${labels[record.event] || record.event}`,
      }],
      from: { email: config.from, name: 'SplashLens Alerts' },
      categories: ['splashlens', 'app-event', record.event],
      content: [{
        type: 'text/plain',
        value: [
          'SplashLens app event',
          '',
          `Event: ${record.event}`,
          `Source: ${source}`,
          `Path: ${record.path}`,
          `Attribution source: ${props.attribution_source || source}`,
          `Attribution campaign: ${props.attribution_campaign || ''}`,
          `Attribution medium: ${props.attribution_medium || ''}`,
          `Attribution referrer: ${props.attribution_referrer || props.attribution_referrer_host || ''}`,
          `Attribution landing path: ${props.attribution_landing_path || ''}`,
          `Store shell: ${props.store_shell || ''}`,
          `Client ID: ${props.client_id || props.clientId || ''}`,
          `Session ID: ${props.session_id || props.sessionId || ''}`,
          `Preferred language: ${record.language.preferredLanguage}`,
          `Locale: ${record.language.locale}`,
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
    source: clean(body.source || props.attribution_source || props.source || 'app', 60),
    path: clean(body.path || props.path || '', 300),
    language: {
      preferredLanguage: clean(body.preferred_language || props.preferred_language || request.headers.get('X-BZM-Language') || 'en', 16),
      locale: clean(body.locale || props.locale || request.headers.get('X-BZM-Locale') || 'en', 32),
      autoTranslate: String(request.headers.get('X-BZM-Auto-Translate') || body.language_profile?.autoTranslate || props.language_profile?.autoTranslate || '') === 'true',
    },
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
