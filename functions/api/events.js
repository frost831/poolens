const ALERT_EVENTS = new Set([
  'article_referral_open',
  'first_app_open',
  'app_open',
  'pwa_install_prompt_seen',
  'pwa_installed',
  'pwa_standalone_open',
  'native_shell_first_open',
  'ai_scan_started',
  'manual_code_search',
  'partsnap_result',
  'partsnap_proof_packet_drawer_opened',
  'partsnap_packet_copied',
  'partsnap_share_used',
  'partsnap_saved_to_pool',
  'partsnap_mystery_submitted',
  'partsnap_apprentice_started',
  'partsnap_partner_card_opened',
  'partsnap_second_proof_requested',
  'route_brain_saved_to_pool',
  'service_proof_summary_generated',
  'service_proof_portal_previewed',
  'service_proof_portal_copied',
  'service_proof_assistant_opened',
  'service_proof_assistant_answered',
  'service_report_saved',
  'proof_ready_report_saved',
  'field_feedback_submitted',
  'store_review_click',
  'store_review_needs_work',
  'waitlist_signup',
  'checkout_success',
  'wizard_open',
  'lane_start',
  'lane_complete',
  'packet_created',
  'call_placed',
  'scan_used',
  'daily_check_logged',
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

function demandLane(record, props = {}) {
  const text = [
    record.event,
    record.path,
    record.source,
    props.path,
    props.query,
    props.brand,
    props.category,
    props.component,
    props.hardware,
    props.mode,
    props.attribution_landing_path,
  ].filter(Boolean).join(' ').toLowerCase();
  const lanes = [
    {
      name: 'Spa / Hot Tub',
      terms: ['spa', 'hot tub', 'balboa', 'gecko', 'waterway', 'topside', 'heater tube', 'pressure switch', 'flow switch', 'truclear'],
    },
    {
      name: 'Robot Cleaners',
      terms: ['robot', 'cleaner', 'dolphin', 'maytronics', 'polaris', 'aiper', 'beatbot', 'wybot', 'ecovacs', 'igarden', 'betta'],
    },
    {
      name: 'Automation / Connected Pool',
      terms: ['automation', 'connected', 'intellicenter', 'omni', 'omnipl', 'aqualink', 'iaqualink', 'rs-485', 'relay', 'actuator', 'app pairing'],
    },
    {
      name: 'Lighting',
      terms: ['light', 'lighting', 'intellibrite', 'colorlogic', 'watercolors', 'niche', 'transformer', 'gfci'],
    },
    {
      name: 'Salt Systems',
      terms: ['salt', 'cell', 'intellichlor', 'aquarite', 'aquapure', 'truclear', 'chlorinator', 'flow sensor'],
    },
    {
      name: 'Chemical Controllers',
      terms: ['orp', 'ph', 'chemical controller', 'chemtrol', 'rola-chem', 'rola chem', 'cat controller', 'stenner', 'feed pump'],
    },
    {
      name: 'AOP / Ozone / UV',
      terms: ['aop', 'ozone', 'uv', 'clear comfort', 'del ozone', 'lamp', 'injector', 'check valve'],
    },
    {
      name: 'PartSnap Proof',
      terms: ['partsnap', 'proof packet', 'mystery', 'second proof', 'vendor packet', 'senior tech'],
    },
    {
      name: 'Source Pages',
      terms: ['source-pages', 'field-guides', 'proof checklist', 'source page'],
    },
  ];
  const match = lanes.find((lane) => lane.terms.some((term) => text.includes(term)));
  return match ? match.name : '';
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
  const facilityFilter = clean(url.searchParams.get('facilityId') || url.searchParams.get('facility') || '', 120);
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
  const filteredRecords = facilityFilter
    ? records.filter((record) => {
      const props = parseProps(record);
      return clean(props.facilityId || props.facility_id || '', 120) === facilityFilter;
    })
    : records;

  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  const since7d = now - 7 * dayMs;
  const since30d = now - 30 * dayMs;
  const eventsByName = new Map();
  const paths = new Map();
  const scanModes = new Map();
  const manualQueries = new Map();
  const callbackRisks = new Map();
  const paymentPlans = new Map();
  const sources = new Map();
  const referrers = new Map();
  const campaigns = new Map();
  const laneDemand = new Map();
  const partSnapCategories = new Map();
  const sessionEvents = new Map();
  const meaningfulEvents = new Set([
    'article_referral_open',
    'pwa_installed',
    'pwa_standalone_open',
    'native_shell_first_open',
    'ai_scan_started',
    'manual_code_search',
    'partsnap_result',
    'partsnap_proof_packet_drawer_opened',
    'partsnap_packet_copied',
    'partsnap_share_used',
    'partsnap_saved_to_pool',
    'partsnap_mystery_submitted',
    'partsnap_apprentice_started',
    'partsnap_second_proof_requested',
    'route_brain_saved_to_pool',
    'service_report_saved',
    'proof_ready_report_saved',
    'field_feedback_submitted',
    'operator_pilot_wizard_opened',
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
  let nativeShellOpens30d = 0;
  let nativeFirstOpens30d = 0;
  let iosFirstOpens30d = 0;
  let androidFirstOpens30d = 0;
  let scans30d = 0;
  let searches30d = 0;
  let partsnapResults30d = 0;
  let meaningfulActions30d = 0;
  let partSnapPackets30d = 0;
  let partSnapSaved30d = 0;
  let partSnapMystery30d = 0;
  let partSnapApprentice30d = 0;
  let partSnapSecondProof30d = 0;
  let partSnapStuck30d = 0;
  let partSnapLowConfidence30d = 0;
  let partSnapMediumRisk30d = 0;
  let partSnapHighRisk30d = 0;
  let proofSaved30d = 0;
  let fieldFeedback30d = 0;
  let fieldTesterOptIns30d = 0;
  let operatorWizard30d = 0;
  let checkoutSuccess30d = 0;
  let revenueCents30d = 0;
  const recentPayments = [];
  let poolProEvents30d = 0;
  let poolProReferralOpens30d = 0;
  let poolProAppOpens30d = 0;
  let poolProFirstOpens30d = 0;
  let poolProInstalls30d = 0;
  let poolProStandaloneOpens30d = 0;
  let poolProScans30d = 0;
  let poolProStoreShellOpens30d = 0;
  let poolProMeaningfulActions30d = 0;
  let spaSearches30d = 0;
  let robotSearches30d = 0;
  let automationSearches30d = 0;
  let lightingSearches30d = 0;
  let saltSearches30d = 0;
  let chemicalControllerSearches30d = 0;
  let sourcePageViews30d = 0;
  let proofDrawerOpens30d = 0;
  const uniqueClients30d = new Set();
  const meaningfulClients30d = new Set();
  const poolProClients30d = new Set();

  const facilityEvents = new Map();
  const facilityLanes = new Map();
  const facilityOutcomes = new Map();
  let facilityEvents30d = 0;
  let facilityPackets30d = 0;
  let facilityCalls30d = 0;
  let facilityDailyChecks30d = 0;

  for (const record of filteredRecords) {
    const ts = eventTime(record);
    const props = parseProps(record);
    const clientId = clean(props.client_id || props.clientId || '', 120);
    const sessionId = clean(props.session_id || props.sessionId || '', 160);
    const source = eventSource(record, props);
    const poolPro = isPoolProEvent(record, props);
    inc(eventsByName, record.event);
    inc(paths, record.path || props.path || 'unknown');
    inc(sources, source);
    if (props.attribution_referrer_host || props.attribution_referrer) inc(referrers, props.attribution_referrer_host || props.attribution_referrer);
    if (props.attribution_campaign) inc(campaigns, props.attribution_campaign);

    if (ts >= since7d) events7d += 1;
    if (ts >= since30d) {
      const lane = demandLane(record, props);
      if (lane) inc(laneDemand, lane);
      events30d += 1;
      if (clientId) uniqueClients30d.add(clientId);
      const sessionKey = sessionId || clientId || `event:${record.createdAt}`;
      if (sessionKey) {
        const existing = sessionEvents.get(sessionKey) || {
          sessionId: sessionId || '',
          clientId: clientId || '',
          source,
          firstAt: record.createdAt,
          lastAt: record.createdAt,
          eventCount: 0,
          scanCount: 0,
          partSnapResults: 0,
          stuckSignals: 0,
          checkoutSuccess: 0,
          latestPath: record.path || props.path || '',
          events: [],
        };
        existing.eventCount += 1;
        existing.firstAt = eventTime(record) < eventTime({ createdAt: existing.firstAt }) ? record.createdAt : existing.firstAt;
        existing.lastAt = eventTime(record) > eventTime({ createdAt: existing.lastAt }) ? record.createdAt : existing.lastAt;
        existing.source = existing.source || source;
        existing.latestPath = record.path || props.path || existing.latestPath || '';
        if (record.event === 'ai_scan_started') existing.scanCount += 1;
        if (record.event === 'partsnap_result') existing.partSnapResults += 1;
        if (record.event === 'checkout_success') existing.checkoutSuccess += 1;
        existing.events.push({
          event: record.event,
          at: record.createdAt,
          source,
          mode: clean(props.mode || record.mode || '', 60),
          summary: clean(props.result_summary || [props.manufacturer, props.component, props.model || props.part_number_visible].filter(Boolean).join(' / ') || '', 220),
          confidence: clean(props.confidence || '', 40),
          risk: clean(props.risk || props.callbackRisk || '', 40),
        });
        existing.events = existing.events.sort((a, b) => eventTime({ createdAt: b.at }) - eventTime({ createdAt: a.at })).slice(0, 8);
        sessionEvents.set(sessionKey, existing);
      }
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
      if (record.event === 'native_shell_open') nativeShellOpens30d += 1;
      if (record.event === 'native_shell_first_open') {
        nativeFirstOpens30d += 1;
        if (props.store === 'ios' || props.store_shell === 'ios') iosFirstOpens30d += 1;
        if (props.store === 'android' || props.store_shell === 'android') androidFirstOpens30d += 1;
      }
      if (record.event === 'ai_scan_started') {
        scans30d += 1;
        inc(scanModes, props.mode || record.mode || 'unknown');
      }
      if (record.event === 'manual_code_search') {
        searches30d += 1;
        inc(manualQueries, [props.brand, props.query].filter(Boolean).join(': ') || props.query || 'unknown');
      }
      if (record.event === 'manual_code_search' || record.event === 'partsnap_result' || record.event === 'partsnap_proof_packet_drawer_opened') {
        if (lane === 'Spa / Hot Tub') spaSearches30d += 1;
        if (lane === 'Robot Cleaners') robotSearches30d += 1;
        if (lane === 'Automation / Connected Pool') automationSearches30d += 1;
        if (lane === 'Lighting') lightingSearches30d += 1;
        if (lane === 'Salt Systems') saltSearches30d += 1;
        if (lane === 'Chemical Controllers' || lane === 'AOP / Ozone / UV') chemicalControllerSearches30d += 1;
      }
      if (record.event === 'partsnap_result') {
        partsnapResults30d += 1;
        inc(partSnapCategories, props.category || props.component || 'unknown');
        const risk = clean(props.risk || props.callbackRisk || 'unknown', 40).toLowerCase();
        const confidence = clean(props.confidence || 'unknown', 40).toLowerCase();
        const missingCount = Number(props.proof_missing_count || 0) || 0;
        const stuck = confidence === 'low' || risk === 'high' || missingCount >= 2;
        if (confidence === 'low') partSnapLowConfidence30d += 1;
        if (risk === 'medium') partSnapMediumRisk30d += 1;
        if (risk === 'high') partSnapHighRisk30d += 1;
        if (stuck) {
          partSnapStuck30d += 1;
          const sessionKey = sessionId || clientId || `event:${record.createdAt}`;
          const existing = sessionEvents.get(sessionKey);
          if (existing) existing.stuckSignals += 1;
        }
      }
      if (record.event === 'partsnap_proof_packet_drawer_opened') {
        proofDrawerOpens30d += 1;
        inc(partSnapCategories, props.category || props.component || 'unknown');
      }
      if (lane === 'Source Pages' || String(record.path || props.path || props.attribution_landing_path || '').includes('source-pages')) sourcePageViews30d += 1;
      if (meaningfulEvents.has(record.event)) meaningfulActions30d += 1;
      if (record.event === 'partsnap_packet_copied' || record.event === 'partsnap_share_used') partSnapPackets30d += 1;
      if (record.event === 'partsnap_saved_to_pool') partSnapSaved30d += 1;
      if (record.event === 'partsnap_mystery_submitted') partSnapMystery30d += 1;
      if (record.event === 'partsnap_apprentice_started') partSnapApprentice30d += 1;
      if (record.event === 'partsnap_second_proof_requested') partSnapSecondProof30d += 1;
      if (record.event === 'partsnap_saved_to_pool' || record.event === 'route_brain_saved_to_pool' || record.event === 'service_report_saved' || record.event === 'proof_ready_report_saved') proofSaved30d += 1;
      if (record.event === 'field_feedback_submitted') {
        fieldFeedback30d += 1;
        if (props.field_tester_opt_in === true || props.field_tester_opt_in === 'true') fieldTesterOptIns30d += 1;
      }
      if (record.event === 'operator_pilot_wizard_opened') operatorWizard30d += 1;
      if (props.facilityId || props.facility_id || ['wizard_open', 'lane_start', 'lane_complete', 'packet_created', 'call_placed', 'scan_used', 'daily_check_logged'].includes(record.event)) {
        facilityEvents30d += 1;
        inc(facilityEvents, record.event);
        if (props.lane) inc(facilityLanes, props.lane);
        if (props.outcome) inc(facilityOutcomes, props.outcome);
        if (record.event === 'packet_created') facilityPackets30d += 1;
        if (record.event === 'call_placed') facilityCalls30d += 1;
        if (record.event === 'daily_check_logged') facilityDailyChecks30d += 1;
      }
      if (record.event === 'checkout_success') {
        checkoutSuccess30d += 1;
        revenueCents30d += Math.max(0, Number(props.amount_total || props.amountTotal || 0) || 0);
        inc(paymentPlans, props.plan || props.product || 'PartSnap Pro');
        recentPayments.push({
          createdAt: record.createdAt,
          subject: clean(props.subject || props.customer_email || props.customerEmail || '', 160),
          plan: clean(props.plan || props.product || 'PartSnap Pro', 100),
          amountTotal: Math.max(0, Number(props.amount_total || props.amountTotal || 0) || 0),
          currency: clean(props.currency || 'usd', 12),
          source: clean(props.payment_source || record.source || 'stripe', 60),
        });
      }
      if (props.risk || props.callbackRisk) inc(callbackRisks, props.risk || props.callbackRisk);
    }
    if (ts >= since7d && record.event === 'app_open') appOpens7d += 1;
  }

  return json(200, {
    ok: true,
    generatedAt: new Date().toISOString(),
    metrics: {
      storedEvents: records.length,
      filteredEvents: filteredRecords.length,
      facilityEvents30d,
      facilityPackets30d,
      facilityCalls30d,
      facilityDailyChecks30d,
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
      nativeShellOpens30d,
      nativeFirstOpens30d,
      iosFirstOpens30d,
      androidFirstOpens30d,
      scans30d,
      searches30d,
      partsnapResults30d,
      meaningfulActions30d,
      partSnapPackets30d,
      partSnapSaved30d,
      partSnapMystery30d,
      partSnapApprentice30d,
      partSnapSecondProof30d,
      partSnapStuck30d,
      partSnapLowConfidence30d,
      partSnapMediumRisk30d,
      partSnapHighRisk30d,
      proofSaved30d,
      fieldFeedback30d,
      fieldTesterOptIns30d,
      operatorWizard30d,
      checkoutSuccess30d,
      revenueCents30d,
      spaSearches30d,
      robotSearches30d,
      automationSearches30d,
      lightingSearches30d,
      saltSearches30d,
      chemicalControllerSearches30d,
      sourcePageViews30d,
      proofDrawerOpens30d,
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
    topPaymentPlans: topList(paymentPlans),
    topDemandLanes: topList(laneDemand),
    topFacilityEvents: topList(facilityEvents),
    topFacilityLanes: topList(facilityLanes),
    topFacilityOutcomes: topList(facilityOutcomes),
    topPartSnapCategories: topList(partSnapCategories),
    topPaths: topList(paths),
    scanModes: topList(scanModes),
    callbackRisks: topList(callbackRisks),
    manualQueries: topList(manualQueries, 20),
    recentPayments: recentPayments.slice(0, 20),
    recentSessions: Array.from(sessionEvents.values())
      .sort((a, b) => eventTime({ createdAt: b.lastAt }) - eventTime({ createdAt: a.lastAt }))
      .slice(0, 30),
    recentEvents: filteredRecords.slice(0, 50).map((record) => ({
      event: record.event,
      source: record.source,
      path: record.path,
      createdAt: record.createdAt,
      props: parseProps(record),
    })),
    caveats: [
      facilityFilter ? `Filtered to facilityId=${facilityFilter}.` : 'Facility reporting can be filtered with ?summary=1&facilityId=FACILITY_ID.',
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
    native_shell_first_open: 'Native app first open',
    ai_scan_started: 'Scanner used',
    manual_code_search: 'Manual code search',
    partsnap_result: 'PartSnap result',
    partsnap_proof_packet_drawer_opened: 'PartSnap proof packet drawer opened',
    partsnap_packet_copied: 'PartSnap packet copied',
    partsnap_share_used: 'PartSnap packet shared',
    partsnap_saved_to_pool: 'PartSnap saved to proof passport',
    partsnap_mystery_submitted: 'Mystery Part Lab submission',
    partsnap_apprentice_started: 'PartSnap Apprentice Mode started',
    partsnap_second_proof_requested: 'PartSnap second proof requested',
    route_brain_saved_to_pool: 'Route Brain proof saved',
    service_proof_summary_generated: 'Service Proof summary generated',
    service_proof_portal_previewed: 'Service Proof trust portal previewed',
    service_proof_portal_copied: 'Service Proof trust portal copied',
    service_proof_assistant_opened: 'Service Proof assistant opened',
    service_proof_assistant_answered: 'Service Proof assistant answered',
    service_report_saved: 'Service report saved',
    proof_ready_report_saved: 'Proof-ready report saved',
    field_feedback_submitted: 'Field feedback submitted',
    store_review_click: 'Store review clicked',
    store_review_needs_work: 'Review ask needs work',
    waitlist_signup: 'Waitlist signup',
    checkout_success: 'Checkout success',
    wizard_open: 'Facility wizard opened',
    lane_start: 'Facility lane started',
    lane_complete: 'Facility lane completed',
    packet_created: 'Facility support packet created',
    call_placed: 'Facility support call placed',
    scan_used: 'Facility scan used',
    daily_check_logged: 'Facility daily check logged',
  };
  const props = parseProps(record);
  const source = eventSource(record, props);
  const sourcePrefix = source && source !== 'app' ? `${source.toUpperCase()} - ` : '';
  const partSnapLines = record.event === 'partsnap_result' ? [
    '',
    'PartSnap detail',
    `- Summary: ${clean(props.result_summary || [props.manufacturer, props.component, props.model || props.part_number_visible].filter(Boolean).join(' / ') || 'Unknown PartSnap result', 220)}`,
    `- Manufacturer: ${clean(props.manufacturer || '', 120)}`,
    `- Component: ${clean(props.component || '', 120)}`,
    `- Model/family: ${clean(props.model || '', 120)}`,
    `- Visible part/model number: ${clean(props.part_number_visible || '', 120)}`,
    `- Confidence: ${clean(props.confidence || 'unknown', 40)}`,
    `- Callback risk: ${clean(props.risk || 'unknown', 40)}`,
    `- Condition: ${clean(props.condition || 'unknown', 40)}`,
    `- Visible proof count: ${clean(props.proof_visible_count ?? '', 20)}`,
    `- Missing proof count: ${clean(props.proof_missing_count ?? '', 20)}`,
    `- Visible proof: ${Array.isArray(props.proof_visible) ? props.proof_visible.map((item) => clean(item, 80)).join('; ') : ''}`,
    `- Missing proof: ${Array.isArray(props.proof_missing) ? props.proof_missing.map((item) => clean(item, 80)).join('; ') : ''}`,
  ] : [];

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
          `Facility ID: ${props.facilityId || props.facility_id || ''}`,
          `Facility lane: ${props.lane || ''}`,
          `Outcome: ${props.outcome || ''}`,
          `Preferred language: ${record.language.preferredLanguage}`,
          `Locale: ${record.language.locale}`,
          `Created: ${record.createdAt}`,
          ...partSnapLines,
          '',
          `Props: ${record.propsJson}`,
        ].join('\n'),
      }],
    }),
  });

  return { sent: response.ok, status: response.status };
}

async function sendDigestEmail(env, summary) {
  const config = notifyConfig(env);
  if (!config.apiKey || !config.from || !config.to) {
    return { sent: false, reason: 'missing_sendgrid_config' };
  }
  const m = summary.metrics || {};
  const lines = [
    'SplashLens daily owner digest',
    '',
    `Generated: ${summary.generatedAt}`,
    '',
    'Core usage',
    `- Events 7d: ${m.events7d || 0}`,
    `- Events 30d: ${m.events30d || 0}`,
    `- App opens 7d: ${m.appOpens7d || 0}`,
    `- App opens 30d: ${m.appOpens30d || 0}`,
    `- Unique clients 30d: ${m.uniqueClients30d || 0}`,
    `- Meaningful clients 30d: ${m.meaningfulClients30d || 0}`,
    '',
    'Field actions',
    `- AI scans 30d: ${m.scans30d || 0}`,
    `- Manual searches 30d: ${m.searches30d || 0}`,
    `- PartSnap results 30d: ${m.partsnapResults30d || 0}`,
    `- Stuck PartSnap results 30d: ${m.partSnapStuck30d || 0}`,
    `- Second proof requests 30d: ${m.partSnapSecondProof30d || 0}`,
    `- Low-confidence PartSnap 30d: ${m.partSnapLowConfidence30d || 0}`,
    `- High-risk PartSnap 30d: ${m.partSnapHighRisk30d || 0}`,
    `- PartSnap packets 30d: ${m.partSnapPackets30d || 0}`,
    `- Proof saves 30d: ${m.proofSaved30d || 0}`,
    `- Field feedback 30d: ${m.fieldFeedback30d || 0}`,
    `- Field tester opt-ins 30d: ${m.fieldTesterOptIns30d || 0}`,
    `- CPO/facility wizard opens 30d: ${m.operatorWizard30d || 0}`,
    `- Spa/hot tub demand 30d: ${m.spaSearches30d || 0}`,
    `- Robot demand 30d: ${m.robotSearches30d || 0}`,
    `- Automation demand 30d: ${m.automationSearches30d || 0}`,
    `- Proof drawer opens 30d: ${m.proofDrawerOpens30d || 0}`,
    `- Source page views 30d: ${m.sourcePageViews30d || 0}`,
    '',
    'Store and revenue',
    `- Native first opens 30d: ${m.nativeFirstOpens30d || 0}`,
    `- iOS first opens 30d: ${m.iosFirstOpens30d || 0}`,
    `- Android first opens 30d: ${m.androidFirstOpens30d || 0}`,
    `- Checkout success 30d: ${m.checkoutSuccess30d || 0}`,
    `- Revenue cents 30d: ${m.revenueCents30d || 0}`,
    '',
    'Top events',
    ...(summary.topEvents || []).slice(0, 10).map(x => `- ${x.name}: ${x.count}`),
    '',
    'Top sources',
    ...(summary.topSources || []).slice(0, 10).map(x => `- ${x.name}: ${x.count}`),
    '',
    'Recent events',
    ...(summary.recentEvents || []).slice(0, 12).map(x => `- ${x.createdAt} ${x.event} ${x.source || ''} ${x.path || ''}`),
    '',
    'Recent sessions',
    ...(summary.recentSessions || []).slice(0, 8).map(x => `- ${x.lastAt} ${x.source || 'app'} events=${x.eventCount || 0} scans=${x.scanCount || 0} results=${x.partSnapResults || 0} stuck=${x.stuckSignals || 0}`),
  ];

  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${config.apiKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [{
        to: [{ email: config.to }],
        subject: `[SplashLens Digest] ${new Date().toISOString().slice(0, 10)}`,
      }],
      from: { email: config.from, name: 'SplashLens Alerts' },
      categories: ['splashlens', 'owner-digest'],
      content: [{ type: 'text/plain', value: lines.join('\n') }],
    }),
  });
  return { sent: response.ok, status: response.status };
}

async function eventDigest(request, env) {
  const summaryResponse = await eventSummary(request, env);
  if (!summaryResponse.ok) return summaryResponse;
  const summary = await summaryResponse.json();
  const digest = await sendDigestEmail(env, summary);
  return json(200, {
    ok: true,
    digestSent: Boolean(digest.sent),
    digestStatus: digest.status || '',
    emailConfigured: digest.reason !== 'missing_sendgrid_config',
    generatedAt: summary.generatedAt,
    metrics: summary.metrics,
  });
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
  if (url.searchParams.get('digest') === '1') {
    return eventDigest(request, env);
  }
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
