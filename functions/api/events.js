import { buildSplashLensAggregate } from '../_shared/splashlens-intelligence.mjs';
import { amplitudeEnabled, forwardEventToAmplitude } from '../_shared/amplitude.mjs';

const ALERT_EVENTS = new Set([
  'pwa_installed',
  'native_shell_first_open',
  'partsnap_result',
  'partsnap_saved_to_pool',
  'partsnap_mystery_submitted',
  'partsnap_second_proof_requested',
  'route_brain_saved_to_pool',
  'service_proof_share_link_created',
  'service_proof_customer_summary_copied',
  'service_proof_json_exported',
  'service_proof_route_note_copied',
  'service_report_saved',
  'proof_ready_report_saved',
  'field_feedback_submitted',
  'store_review_needs_work',
  'waitlist_signup',
  'checkout_success',
  'packet_created',
  'call_placed',
]);

const HIGH_VALUE_PARTSNAP_SIGNALS = new Set([
  'low',
  'cautious',
  'needs-proof',
  'needs proof',
  'high-risk',
  'high risk',
]);

const FUNNEL_CAMPAIGN_EVENTS = new Set([
  'article_referral_open',
  'campaign_landing_view',
  'campaign_view',
  'field_challenge_page_view',
  'field_challenge_started',
]);
const FUNNEL_OPEN_EVENTS = new Set([
  'first_app_open',
  'app_open',
  'native_shell_first_open',
  'native_shell_open',
  'pwa_standalone_open',
  'app_store_click',
  'play_store_click',
  'app_store_download_click',
  'google_play_download_click',
  'play_store_download_click',
  'open_app_click',
  'partsnap_click',
]);
const FUNNEL_WORKFLOW_EVENTS = new Set([
  'manual_code_search',
  'partsnap_result',
  'facility_workflow_completed',
  'service_report_saved',
  'proof_ready_report_saved',
]);
const FUNNEL_PROOF_EVENTS = new Set([
  'partsnap_saved_to_pool',
  'partsnap_field_stop_saved',
  'route_brain_saved_to_pool',
  'service_report_saved',
  'proof_ready_report_saved',
  'service_proof_share_link_created',
]);
const FUNNEL_FEEDBACK_EVENTS = new Set([
  'field_feedback_submitted',
  'field_feedback_quick_answered',
  'field_challenge_feedback',
]);

function chunks(items, size) {
  const groups = [];
  for (let i = 0; i < items.length; i += size) groups.push(items.slice(i, i + size));
  return groups;
}

async function readKvValues(kv, keyNames) {
  try {
    const bulk = await kv.get(keyNames);
    if (bulk instanceof Map) return keyNames.map((keyName) => bulk.get(keyName));
  } catch (error) {
    console.warn('SplashLens KV bulk read unavailable; falling back to individual reads.', String(error));
  }
  return Promise.all(keyNames.map((keyName) => kv.get(keyName)));
}

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

function cleanEmail(value) {
  const email = clean(value, 180).toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : '';
}

function eventUserProfile(record, props = {}) {
  const email = cleanEmail(
    props.known_email ||
    props.email ||
    props.customer_email ||
    props.customerEmail ||
    props.subject ||
    props.contact_email ||
    props.sl_email,
  );
  const name = clean(props.known_name || props.contact_name || props.name || [props.first_name, props.last_name].filter(Boolean).join(' '), 140);
  const company = clean(props.known_company || props.company || props.organization || props.org || props.account, 160);
  const role = clean(props.known_role || props.role || props.audience || props.persona || props.splashlens_role, 80);
  const leadId = clean(props.lead_id || props.contact_id || props.recipient_id || props.prospect_id || props.referral_id, 120);
  const pilotId = clean(props.pilot_id || props.pilot, 80);
  const participantId = clean(props.participant_id || props.participant, 80);
  const hasIdentity = Boolean(email || name || company || role || leadId || pilotId || participantId);
  if (!hasIdentity) return null;
  const label = email || name || company || leadId || participantId || pilotId || 'known user';
  return {
    label,
    email,
    name,
    company,
    role,
    leadId,
    pilotId,
    participantId,
    clientId: clean(props.client_id || props.clientId || '', 120),
    sessionId: clean(props.session_id || props.sessionId || '', 160),
    source: clean(props.identity_source || props.attribution_source || record.source || 'app', 80),
    confidence: clean(props.identity_confidence || (email ? 'provided-email' : leadId || participantId || pilotId ? 'tracked-link' : 'self-described'), 40),
  };
}

function shouldSendImmediateAlert(record) {
  if (!ALERT_EVENTS.has(record.event)) return false;

  if (record.event === 'partsnap_result') {
    const props = parseProps(record);
    const confidence = clean(props.confidence || props.match_confidence || props.certainty || '', 80).toLowerCase();
    const risk = clean(props.callback_risk || props.callbackRisk || props.risk || '', 80).toLowerCase();
    const proofMissing = Array.isArray(props.proof_missing) ? props.proof_missing.length : Number(props.proof_missing_count || 0);
    return HIGH_VALUE_PARTSNAP_SIGNALS.has(confidence) ||
      HIGH_VALUE_PARTSNAP_SIGNALS.has(risk) ||
      risk.includes('high') ||
      confidence.includes('low') ||
      proofMissing >= 2;
  }

  return true;
}

function inc(map, key, amount = 1) {
  const safeKey = clean(key || 'unknown', 80) || 'unknown';
  map.set(safeKey, (map.get(safeKey) || 0) + amount);
}

function topList(map, limit = 12) {
  return Array.from(map.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .slice(0, limit);
}

function knownUserKey(user) {
  if (!user) return '';
  return clean(user.email || user.leadId || user.participantId || user.pilotId || user.label, 180).toLowerCase();
}

function rememberKnownUser(map, user, record) {
  const key = knownUserKey(user);
  if (!key) return;
  const existing = map.get(key) || {
    label: user.label,
    email: user.email,
    name: user.name,
    company: user.company,
    role: user.role,
    leadId: user.leadId,
    pilotId: user.pilotId,
    participantId: user.participantId,
    confidence: user.confidence,
    source: user.source,
    clientIds: new Set(),
    sessionIds: new Set(),
    firstAt: record.createdAt,
    lastAt: record.createdAt,
    eventCount: 0,
    meaningfulCount: 0,
    paidCount: 0,
    lastEvent: record.event,
  };
  existing.label = existing.label || user.label;
  existing.email = existing.email || user.email;
  existing.name = existing.name || user.name;
  existing.company = existing.company || user.company;
  existing.role = existing.role || user.role;
  existing.leadId = existing.leadId || user.leadId;
  existing.pilotId = existing.pilotId || user.pilotId;
  existing.participantId = existing.participantId || user.participantId;
  existing.confidence = user.email ? 'provided-email' : existing.confidence || user.confidence;
  existing.source = existing.source || user.source;
  if (user.clientId) existing.clientIds.add(user.clientId);
  if (user.sessionId) existing.sessionIds.add(user.sessionId);
  existing.eventCount += 1;
  existing.firstAt = eventTime(record) < eventTime({ createdAt: existing.firstAt }) ? record.createdAt : existing.firstAt;
  existing.lastAt = eventTime(record) > eventTime({ createdAt: existing.lastAt }) ? record.createdAt : existing.lastAt;
  existing.lastEvent = record.event;
  if (record.event === 'checkout_success') existing.paidCount += 1;
  map.set(key, existing);
}

function eventSource(record, props = {}) {
  return clean(record.source || props.attribution_source || props.source || 'app', 80) || 'app';
}

function eventIdentity(record, props = {}) {
  const user = eventUserProfile(record, props);
  return clean(
    user?.email || user?.leadId || user?.participantId || user?.pilotId || user?.label ||
    props.challenge_id || props.client_id || props.clientId || props.session_id || props.sessionId ||
    record.correlationId || record.id || `${record.event}:${record.createdAt}`,
    180,
  );
}

function isSyntheticEvent(record, props = {}) {
  const text = [
    props.test,
    props.demo,
    props.synthetic,
    props.environment,
    props.pilot_id,
    props.pilot,
    props.participant_id,
    props.participant,
    props.attribution_campaign,
    record.source,
  ].filter((value) => value !== undefined && value !== null).join(' ').toLowerCase();
  return props.test === true || props.demo === true || props.synthetic === true ||
    /(^|[^a-z])(test|demo|synthetic|playwright|benchmark)([^a-z]|$)/.test(text);
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
  const aggregateMode = url.searchParams.get('aggregate') === '1';
  const maxLimit = aggregateMode ? 3000 : 1000;
  const limit = Math.min(Math.max(Number(url.searchParams.get('limit') || (aggregateMode ? 3000 : 250)), 50), maxLimit);
  const days = Math.min(Math.max(Number(url.searchParams.get('days') || 30), 1), 90);
  const facilityFilter = clean(url.searchParams.get('facilityId') || url.searchParams.get('facility') || '', 120);
  const keySet = new Set();
  const records = [];

  const nowDate = new Date();
  for (let dayOffset = 0; dayOffset < days; dayOffset += 1) {
    const date = new Date(nowDate.getTime() - dayOffset * 24 * 60 * 60 * 1000);
    const prefix = `event:${date.toISOString().slice(0, 10)}`;
    let cursor;
    let pageCount = 0;
    do {
      const page = await env.SCAN_USAGE_KV.list({ prefix, cursor, limit: 1000 });
      for (const key of page.keys || []) keySet.add(key.name);
      cursor = page.list_complete ? undefined : page.cursor;
      pageCount += 1;
    } while (cursor && pageCount < 3);
  }

  const aggregateTruncated = keySet.size > limit;
  const newestKeys = Array.from(keySet).sort((a, b) => b.localeCompare(a)).slice(0, limit);
  for (const group of chunks(newestKeys, 100)) {
    const values = await readKvValues(env.SCAN_USAGE_KV, group);
    for (const raw of values) {
      if (!raw) continue;
      try {
        const record = JSON.parse(raw);
        records.push(record);
      } catch {}
    }
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
  const paymentFeatures = new Map();
  const paymentPlanKeys = new Map();
  const corpusStatuses = new Map();
  const corpusSourceTiers = new Map();
  const corpusMatchLevels = new Map();
  const sources = new Map();
  const referrers = new Map();
  const campaigns = new Map();
  const activationTypes = new Map();
  const activationSources = new Map();
  const activationCampaigns = new Map();
  const laneDemand = new Map();
  const partSnapCategories = new Map();
  const fieldSignalIds = new Map();
  const roles = new Map();
  const languages = new Map();
  const locales = new Map();
  const requestedLanguages = new Map();
  const markets = new Map();
  const sessionEvents = new Map();
  const clientActiveDays = new Map();
  const tabDwellSeconds = new Map();
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
    'partsnap_field_stop_saved',
    'partsnap_field_stop_reopened',
    'partsnap_field_stop_assign_started',
    'partsnap_mystery_submitted',
    'partsnap_apprentice_started',
    'partsnap_second_proof_requested',
    'route_brain_saved_to_pool',
    'service_report_saved',
    'proof_ready_report_saved',
    'service_proof_share_link_created',
    'service_proof_customer_summary_copied',
    'service_proof_json_exported',
    'service_proof_route_note_copied',
    'field_feedback_submitted',
    'operator_pilot_wizard_opened',
    'facility_workflow_action_selected',
    'facility_workflow_completed',
    'field_signal_action',
    'pump_decision_completed',
    'pump_customer_summary_copied',
    'pump_customer_summary_added_to_report',
    'activation_completed',
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
  let partSnapSourceBacked30d = 0;
  let partSnapAiOnly30d = 0;
  let partSnapCorpusCandidates30d = 0;
  let proofSaved30d = 0;
  let fieldFeedback30d = 0;
  let fieldTesterOptIns30d = 0;
  let quickFeedbackHelpful30d = 0;
  let quickFeedbackMissed30d = 0;
  let operatorWizard30d = 0;
  let fieldSignalsShown30d = 0;
  let fieldSignalActions30d = 0;
  let fieldSignalDismissals30d = 0;
  let fieldSignalPermissionsGranted30d = 0;
  let fieldSignalPermissionsDenied30d = 0;
  let pumpDecisionsStarted30d = 0;
  let pumpDecisionsCompleted30d = 0;
  let pumpCustomerSummaries30d = 0;
  let checkoutSuccess30d = 0;
  let serviceProofShareLinks30d = 0;
  let serviceProofCustomerSummaries30d = 0;
  let serviceProofJsonExports30d = 0;
  let serviceProofRouteNotes30d = 0;
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
  let partSnapFieldStopsSaved30d = 0;
  let partSnapFieldStopLibraryOpens30d = 0;
  let partSnapFieldStopsReopened30d = 0;
  let partSnapFieldStopAssignments30d = 0;
  let postValueUpgradeShown30d = 0;
  let postValueUpgradeClicked30d = 0;
  let activationCompletions30d = 0;
  let languageModeOpens30d = 0;
  let spanishModeOpens30d = 0;
  let frenchInterestOpens30d = 0;
  let portugueseInterestOpens30d = 0;
  let haitianCreoleInterestOpens30d = 0;
  let marketInterestOpens30d = 0;
  let canadaInterestOpens30d = 0;
  const uniqueClients30d = new Set();
  const meaningfulClients30d = new Set();
  const activatedClients30d = new Set();
  const poolProClients30d = new Set();
  const knownUserClients30d = new Set();
  const knownUsers = new Map();
  const clientActivityWindow = new Map();
  const funnelCampaignVisitors = new Set();
  const funnelAppStoreOpens = new Set();
  const funnelWorkflowCompleters = new Set();
  const funnelProofSavers = new Set();
  const funnelFeedbackSubmitters = new Set();
  const funnelCheckoutStarters = new Set();
  const funnelPaidClients = new Set();
  const funnelFieldStories = new Set();
  const funnelChallengeStarts = new Set();
  const funnelChallengeCompletions = new Set();
  const funnelReferralShares = new Set();

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
    const knownUser = eventUserProfile(record, props);
    const source = eventSource(record, props);
    const poolPro = isPoolProEvent(record, props);
    const preferredLanguage = clean(record.language?.preferredLanguage || props.preferred_language || props.source_language || 'en', 24).toLowerCase();
    const locale = clean(record.language?.locale || props.locale || preferredLanguage || 'en', 32).toLowerCase();
    const requestedLanguage = clean(props.requested_language || record.language?.requestedLanguage || '', 32).toLowerCase();
    const market = clean(props.market || props.country || '', 32).toLowerCase();
    inc(eventsByName, record.event);
    inc(paths, record.path || props.path || 'unknown');
    inc(sources, source);
    if (props.splashlens_role || props.role) inc(roles, props.splashlens_role || props.role);
    if (preferredLanguage) inc(languages, preferredLanguage);
    if (locale) inc(locales, locale);
    if (requestedLanguage) inc(requestedLanguages, requestedLanguage);
    if (market) inc(markets, market === 'canada' ? 'ca' : market);
    if (props.attribution_referrer_host || props.attribution_referrer) inc(referrers, props.attribution_referrer_host || props.attribution_referrer);
    if (props.attribution_campaign) inc(campaigns, props.attribution_campaign);

    if (ts >= since7d) events7d += 1;
    if (ts >= since30d) {
      const lane = demandLane(record, props);
      if (lane) inc(laneDemand, lane);
      events30d += 1;
      if (clientId) uniqueClients30d.add(clientId);
      if (knownUser && !isSyntheticEvent(record, props)) {
        rememberKnownUser(knownUsers, knownUser, record);
        if (clientId) knownUserClients30d.add(clientId);
        const userRow = knownUsers.get(knownUserKey(knownUser));
        if (userRow && meaningfulEvents.has(record.event)) userRow.meaningfulCount += 1;
      }
      const sessionKey = sessionId || clientId || `event:${record.createdAt}`;
      if (sessionKey) {
        const existing = sessionEvents.get(sessionKey) || {
          sessionId: sessionId || '',
          clientId: clientId || '',
          userLabel: knownUser?.label || '',
          userEmail: knownUser?.email || '',
          userCompany: knownUser?.company || '',
          userRole: knownUser?.role || '',
          userConfidence: knownUser?.confidence || '',
          source,
          firstAt: record.createdAt,
          lastAt: record.createdAt,
          eventCount: 0,
          scanCount: 0,
          partSnapResults: 0,
          stuckSignals: 0,
          checkoutSuccess: 0,
          checkoutStarts: 0,
          meaningful: false,
          firstActionAt: null,
          firstValueAt: null,
          engagedSeconds: 0,
          durationSeconds: 0,
          latestPath: record.path || props.path || '',
          events: [],
        };
        existing.eventCount += 1;
        if (knownUser) {
          existing.userLabel = existing.userLabel || knownUser.label || '';
          existing.userEmail = existing.userEmail || knownUser.email || '';
          existing.userCompany = existing.userCompany || knownUser.company || '';
          existing.userRole = existing.userRole || knownUser.role || '';
          existing.userConfidence = existing.userConfidence || knownUser.confidence || '';
        }
        existing.firstAt = eventTime(record) < eventTime({ createdAt: existing.firstAt }) ? record.createdAt : existing.firstAt;
        existing.lastAt = eventTime(record) > eventTime({ createdAt: existing.lastAt }) ? record.createdAt : existing.lastAt;
        existing.source = existing.source || source;
        existing.latestPath = record.path || props.path || existing.latestPath || '';
        if (record.event === 'ai_scan_started') existing.scanCount += 1;
        if (record.event === 'partsnap_result') existing.partSnapResults += 1;
        if (record.event === 'checkout_success') existing.checkoutSuccess += 1;
        if (record.event === 'upgrade_click' || record.event === 'checkout_started' || record.event === 'checkout_click') existing.checkoutStarts += 1;
        if (meaningfulEvents.has(record.event)) existing.meaningful = true;
        if (record.event === 'first_action_started' && (!existing.firstActionAt || eventTime(record) < eventTime({ createdAt: existing.firstActionAt }))) existing.firstActionAt = record.createdAt;
        if (['first_value_completed', 'activation_completed'].includes(record.event) && (!existing.firstValueAt || eventTime(record) < eventTime({ createdAt: existing.firstValueAt }))) existing.firstValueAt = record.createdAt;
        if (record.event === 'session_heartbeat') existing.engagedSeconds += Math.max(0, Math.min(300, Number(props.engaged_delta_seconds || 0) || 0));
        if (record.event === 'session_ended') existing.durationSeconds = Math.max(existing.durationSeconds, Math.min(7200, Number(props.session_duration_seconds || 0) || 0));
        if (record.event === 'tab_dwell') inc(tabDwellSeconds, clean(props.tab || 'unknown', 60), Math.max(0, Math.min(1800, Number(props.dwell_seconds || 0) || 0)));
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
      if (clientId) {
        const activeDays = clientActiveDays.get(clientId) || new Set();
        activeDays.add(new Date(ts).toISOString().slice(0, 10));
        clientActiveDays.set(clientId, activeDays);
        const activity = clientActivityWindow.get(clientId) || { first: ts, last: ts };
        activity.first = Math.min(activity.first, ts);
        activity.last = Math.max(activity.last, ts);
        clientActivityWindow.set(clientId, activity);
      }
      if (!isSyntheticEvent(record, props)) {
        const identity = eventIdentity(record, props);
        if (FUNNEL_CAMPAIGN_EVENTS.has(record.event)) funnelCampaignVisitors.add(identity);
        if (FUNNEL_OPEN_EVENTS.has(record.event)) funnelAppStoreOpens.add(identity);
        if (FUNNEL_WORKFLOW_EVENTS.has(record.event)) funnelWorkflowCompleters.add(identity);
        if (FUNNEL_PROOF_EVENTS.has(record.event)) funnelProofSavers.add(identity);
        if (FUNNEL_FEEDBACK_EVENTS.has(record.event)) funnelFeedbackSubmitters.add(identity);
        if (record.event === 'upgrade_click' || record.event === 'checkout_started' || record.event === 'checkout_click') funnelCheckoutStarters.add(identity);
        if (record.event === 'checkout_success') funnelPaidClients.add(identity);
        if (record.event === 'field_challenge_started') funnelChallengeStarts.add(identity);
        if (record.event === 'field_challenge_completed') funnelChallengeCompletions.add(identity);
        if (record.event === 'referral_share') funnelReferralShares.add(identity);
        const rating = Number(props.rating || 0);
        const feedback = clean(props.feedback || props.story || props.note || '', 900);
        if (record.event === 'field_story_submitted' || (record.event === 'field_feedback_submitted' && rating >= 4 && feedback.length >= 12)) {
          funnelFieldStories.add(identity);
        }
      }
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
        const corpusStatus = clean(props.corpus_status || 'unknown', 80).toLowerCase();
        const corpusTier = clean(props.corpus_top_source_tier || '', 40);
        const corpusMatch = clean(props.corpus_top_match_level || '', 120);
        const corpusCandidateCount = Number(props.corpus_candidate_count || 0) || 0;
        if (corpusStatus) inc(corpusStatuses, corpusStatus);
        if (corpusTier) inc(corpusSourceTiers, `tier_${corpusTier}`);
        if (corpusMatch) inc(corpusMatchLevels, corpusMatch);
        partSnapCorpusCandidates30d += corpusCandidateCount;
        if (corpusStatus.includes('source-backed')) partSnapSourceBacked30d += 1;
        if (corpusStatus.includes('ai-only') || corpusCandidateCount === 0) partSnapAiOnly30d += 1;
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
      if (record.event === 'partsnap_saved_to_pool' || record.event === 'partsnap_field_stop_saved') partSnapSaved30d += 1;
      if (record.event === 'partsnap_mystery_submitted') partSnapMystery30d += 1;
      if (record.event === 'partsnap_apprentice_started') partSnapApprentice30d += 1;
      if (record.event === 'partsnap_second_proof_requested') partSnapSecondProof30d += 1;
      if (record.event === 'partsnap_saved_to_pool' || record.event === 'partsnap_field_stop_saved' || record.event === 'route_brain_saved_to_pool' || record.event === 'service_report_saved' || record.event === 'proof_ready_report_saved') proofSaved30d += 1;
      if (record.event === 'field_feedback_submitted') {
        fieldFeedback30d += 1;
        if (props.field_tester_opt_in === true || props.field_tester_opt_in === 'true') fieldTesterOptIns30d += 1;
      }
      if (record.event === 'partsnap_field_stop_saved') partSnapFieldStopsSaved30d += 1;
      if (record.event === 'partsnap_field_stop_library_opened') partSnapFieldStopLibraryOpens30d += 1;
      if (record.event === 'partsnap_field_stop_reopened') partSnapFieldStopsReopened30d += 1;
      if (record.event === 'partsnap_field_stop_assign_started') partSnapFieldStopAssignments30d += 1;
      if (record.event === 'post_value_upgrade_shown') postValueUpgradeShown30d += 1;
      if (record.event === 'post_value_upgrade_clicked') postValueUpgradeClicked30d += 1;
      if (record.event === 'field_feedback_quick_answered') {
        if (props.answer === 'helped') quickFeedbackHelpful30d += 1;
        if (['missed', 'wrong', 'missing'].includes(props.answer)) quickFeedbackMissed30d += 1;
      }
      if (record.event === 'operator_pilot_wizard_opened') operatorWizard30d += 1;
      if (record.event === 'field_signal_shown') {
        fieldSignalsShown30d += 1;
        inc(fieldSignalIds, props.signal_id || 'unknown');
      }
      if (record.event === 'field_signal_action') {
        fieldSignalActions30d += 1;
        inc(fieldSignalIds, props.signal_id || 'unknown');
      }
      if (record.event === 'field_signal_dismissed') fieldSignalDismissals30d += 1;
      if (record.event === 'field_signal_permission_result') {
        const granted = props.granted === true || props.granted === 'true' || props.result === 'granted';
        if (granted) fieldSignalPermissionsGranted30d += 1;
        else if (props.result === 'denied' || props.result === 'default') fieldSignalPermissionsDenied30d += 1;
      }
      if (record.event === 'pump_decision_started') pumpDecisionsStarted30d += 1;
      if (record.event === 'pump_decision_completed') pumpDecisionsCompleted30d += 1;
      if (record.event === 'pump_customer_summary_copied' || record.event === 'pump_customer_summary_added_to_report') pumpCustomerSummaries30d += 1;
      if (record.event === 'activation_completed') {
        activationCompletions30d += 1;
        if (clientId) activatedClients30d.add(clientId);
        inc(activationTypes, props.activation_type || 'unknown');
        inc(activationSources, props.activation_source || source || 'direct');
        inc(activationCampaigns, props.activation_campaign || props.attribution_campaign || 'untagged');
      }
      if (record.event === 'language_mode_open') {
        languageModeOpens30d += 1;
        if (preferredLanguage === 'es' || props.spanish_field_mode === true || props.spanish_field_mode === 'true') spanishModeOpens30d += 1;
        if (requestedLanguage === 'fr' || requestedLanguage === 'fr-ca') frenchInterestOpens30d += 1;
        if (requestedLanguage === 'pt' || requestedLanguage === 'pt-br') portugueseInterestOpens30d += 1;
        if (requestedLanguage === 'ht' || requestedLanguage === 'ht-ht') haitianCreoleInterestOpens30d += 1;
      }
      if (record.event === 'market_interest_open') {
        marketInterestOpens30d += 1;
        if ((market === 'ca' || market === 'canada')) canadaInterestOpens30d += 1;
      }
      if (props.facilityId || props.facility_id || ['wizard_open', 'lane_start', 'lane_complete', 'packet_created', 'call_placed', 'scan_used', 'daily_check_logged', 'facility_workflow_action_selected', 'facility_workflow_completed'].includes(record.event)) {
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
        inc(paymentFeatures, props.feature || 'unknown');
        inc(paymentPlanKeys, props.plan_key || props.planKey || 'unknown');
        recentPayments.push({
          createdAt: record.createdAt,
          subject: clean(props.subject || props.customer_email || props.customerEmail || '', 160),
          plan: clean(props.plan || props.product || 'PartSnap Pro', 100),
          planKey: clean(props.plan_key || props.planKey || '', 100),
          feature: clean(props.feature || '', 100),
          amountTotal: Math.max(0, Number(props.amount_total || props.amountTotal || 0) || 0),
          currency: clean(props.currency || 'usd', 12),
          source: clean(props.payment_source || record.source || 'stripe', 60),
        });
      }
      if (record.event === 'service_proof_share_link_created') serviceProofShareLinks30d += 1;
      if (record.event === 'service_proof_customer_summary_copied') serviceProofCustomerSummaries30d += 1;
      if (record.event === 'service_proof_json_exported') serviceProofJsonExports30d += 1;
      if (record.event === 'service_proof_route_note_copied') serviceProofRouteNotes30d += 1;
      if (props.risk || props.callbackRisk) inc(callbackRisks, props.risk || props.callbackRisk);
    }
    if (ts >= since7d && record.event === 'app_open') appOpens7d += 1;
  }

  const sessions = Array.from(sessionEvents.values());
  const sessionDurations = sessions.map((item) => item.durationSeconds).filter((value) => value > 0).sort((a, b) => a - b);
  const timeToValueSeconds = sessions
    .filter((item) => item.firstValueAt)
    .map((item) => Math.max(0, Math.round((eventTime({ createdAt: item.firstValueAt }) - eventTime({ createdAt: item.firstAt })) / 1000)))
    .sort((a, b) => a - b);
  const median = (values) => values.length ? values[Math.floor((values.length - 1) / 2)] : null;
  const sessionCount30d = sessions.length;
  const meaningfulSessions30d = sessions.filter((item) => item.meaningful).length;
  const abandonedSessions30d = sessions.filter((item) => item.firstActionAt && !item.firstValueAt).length;
  const oneEventSessions30d = sessions.filter((item) => item.eventCount <= 1).length;
  const returningClients30d = Array.from(clientActiveDays.values()).filter((daysSet) => daysSet.size >= 2).length;
  const sevenDayReturningClients30d = Array.from(clientActivityWindow.values())
    .filter((activity) => activity.last - activity.first >= 7 * dayMs).length;
  const checkoutStarts30d = sessions.reduce((sum, item) => sum + item.checkoutStarts, 0);
  const totalEngagedSeconds30d = sessions.reduce((sum, item) => sum + item.engagedSeconds, 0);
  const pct = (value, total) => total ? Math.round((value / total) * 1000) / 10 : null;

  return json(200, {
    ok: true,
    generatedAt: new Date().toISOString(),
    dataThrough: filteredRecords[0]?.createdAt || null,
    metrics: {
      storedEvents: records.length,
      aggregateKeysFound: keySet.size,
      aggregateTruncated,
      coverageDays: days,
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
      knownUsers30d: knownUsers.size,
      knownUserClients30d: knownUserClients30d.size,
      anonymousClients30d: Math.max(0, uniqueClients30d.size - knownUserClients30d.size),
      meaningfulClients30d: meaningfulClients30d.size,
      activatedClients30d: activatedClients30d.size,
      activationCompletions30d,
      languageModeOpens30d,
      spanishModeOpens30d,
      frenchInterestOpens30d,
      portugueseInterestOpens30d,
      haitianCreoleInterestOpens30d,
      marketInterestOpens30d,
      canadaInterestOpens30d,
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
      partSnapSourceBacked30d,
      partSnapAiOnly30d,
      partSnapCorpusCandidates30d,
      proofSaved30d,
      fieldFeedback30d,
      fieldTesterOptIns30d,
      quickFeedbackHelpful30d,
      quickFeedbackMissed30d,
      operatorWizard30d,
      fieldSignalsShown30d,
      fieldSignalActions30d,
      fieldSignalDismissals30d,
      fieldSignalPermissionsGranted30d,
      fieldSignalPermissionsDenied30d,
      fieldSignalActionRate30d: pct(fieldSignalActions30d, fieldSignalsShown30d),
      pumpDecisionsStarted30d,
      pumpDecisionsCompleted30d,
      pumpDecisionCompletionRate30d: pct(pumpDecisionsCompleted30d, pumpDecisionsStarted30d),
      pumpCustomerSummaries30d,
      checkoutSuccess30d,
      serviceProofShareLinks30d,
      serviceProofCustomerSummaries30d,
      serviceProofJsonExports30d,
      serviceProofRouteNotes30d,
      revenueCents30d,
      spaSearches30d,
      robotSearches30d,
      automationSearches30d,
      lightingSearches30d,
      saltSearches30d,
      chemicalControllerSearches30d,
      sourcePageViews30d,
      proofDrawerOpens30d,
      partSnapFieldStopsSaved30d,
      partSnapFieldStopLibraryOpens30d,
      partSnapFieldStopsReopened30d,
      partSnapFieldStopAssignments30d,
      postValueUpgradeShown30d,
      postValueUpgradeClicked30d,
      postValueUpgradeClickRate30d: pct(postValueUpgradeClicked30d, postValueUpgradeShown30d),
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
      sessionCount30d,
      meaningfulSessions30d,
      abandonedSessions30d,
      oneEventSessions30d,
      returningClients30d,
      sevenDayReturningClients30d,
      funnelCampaignVisitors: funnelCampaignVisitors.size,
      funnelAppStoreOpens: funnelAppStoreOpens.size,
      funnelWorkflowCompleters: funnelWorkflowCompleters.size,
      funnelProofSavers: funnelProofSavers.size,
      funnelFeedbackSubmitters: funnelFeedbackSubmitters.size,
      funnelCheckoutStarters: funnelCheckoutStarters.size,
      funnelPaidClients: funnelPaidClients.size,
      funnelFieldStories: funnelFieldStories.size,
      funnelChallengeStarts: funnelChallengeStarts.size,
      funnelChallengeCompletions: funnelChallengeCompletions.size,
      funnelReferralShares: funnelReferralShares.size,
      checkoutStarts30d,
      totalEngagedSeconds30d,
      medianSessionDurationSeconds30d: median(sessionDurations),
      medianTimeToValueSeconds30d: median(timeToValueSeconds),
      meaningfulSessionRate30d: pct(meaningfulSessions30d, sessionCount30d),
      abandonmentRate30d: pct(abandonedSessions30d, sessionCount30d),
      returnClientRate30d: pct(returningClients30d, uniqueClients30d.size),
      proofFollowThroughRate30d: pct(proofSaved30d, partsnapResults30d),
      checkoutCompletionRate30d: pct(checkoutSuccess30d, checkoutStarts30d),
    },
    activationFunnel: [
      { key: 'campaign_visit', label: 'Tracked campaign visits', count: funnelCampaignVisitors.size, target: 100 },
      { key: 'app_open', label: 'App or store opens', count: funnelAppStoreOpens.size, target: 30 },
      { key: 'workflow_complete', label: 'Completed field workflows', count: funnelWorkflowCompleters.size, target: 15 },
      { key: 'proof_saved', label: 'Proof saved or shared', count: funnelProofSavers.size, target: 8 },
      { key: 'feedback', label: 'Direct feedback responses', count: funnelFeedbackSubmitters.size, target: 10 },
      { key: 'seven_day_return', label: 'Returned after 7 days', count: sevenDayReturningClients30d, target: 5 },
      { key: 'checkout_started', label: 'Checkout starts', count: funnelCheckoutStarters.size, target: 3 },
      { key: 'paid', label: 'Paid conversions', count: funnelPaidClients.size, target: 1, stretchTarget: 3 },
      { key: 'field_story', label: 'Usable field stories', count: funnelFieldStories.size, target: 3 },
    ],
    activationWindowDays: days,
    topEvents: topList(eventsByName),
    topSources: topList(sources),
    topReferrers: topList(referrers),
    topCampaigns: topList(campaigns),
    topActivationTypes: topList(activationTypes),
    topActivationSources: topList(activationSources),
    topActivationCampaigns: topList(activationCampaigns),
    topRoles: topList(roles),
    topLanguages: topList(languages),
    topLocales: topList(locales),
    topRequestedLanguages: topList(requestedLanguages),
    topMarkets: topList(markets),
    topPaymentPlans: topList(paymentPlans),
    topPaymentFeatures: topList(paymentFeatures),
    topPaymentPlanKeys: topList(paymentPlanKeys),
    topCorpusStatuses: topList(corpusStatuses),
    topCorpusSourceTiers: topList(corpusSourceTiers),
    topCorpusMatchLevels: topList(corpusMatchLevels),
    topDemandLanes: topList(laneDemand),
    topFacilityEvents: topList(facilityEvents),
    topFacilityLanes: topList(facilityLanes),
    topFacilityOutcomes: topList(facilityOutcomes),
    topPartSnapCategories: topList(partSnapCategories),
    topFieldSignals: topList(fieldSignalIds, 10),
    topPaths: topList(paths),
    scanModes: topList(scanModes),
    callbackRisks: topList(callbackRisks),
    topTabDwell: topList(tabDwellSeconds, 12),
    manualQueries: topList(manualQueries, 20),
    recentPayments: recentPayments.slice(0, 20),
    knownUsers: Array.from(knownUsers.values())
      .map((user) => ({
        label: user.label,
        email: user.email,
        name: user.name,
        company: user.company,
        role: user.role,
        leadId: user.leadId,
        pilotId: user.pilotId,
        participantId: user.participantId,
        confidence: user.confidence,
        source: user.source,
        clientCount: user.clientIds.size,
        sessionCount: user.sessionIds.size,
        eventCount: user.eventCount,
        meaningfulCount: user.meaningfulCount,
        paidCount: user.paidCount,
        firstAt: user.firstAt,
        lastAt: user.lastAt,
        lastEvent: user.lastEvent,
      }))
      .sort((a, b) => eventTime({ createdAt: b.lastAt }) - eventTime({ createdAt: a.lastAt }))
      .slice(0, 40),
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
      'Known-user reporting only appears when a user provides contact details, pays/restores, submits feedback, or arrives from a tagged outreach/pilot link.',
      'Email alerts are intentionally limited to usage/conversion events, not outreach email opens.',
      'Activation funnel counts exclude events tagged as test, demo, synthetic, Playwright, or benchmark traffic.',
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
    service_proof_share_link_created: 'Service Proof share link created',
    service_proof_customer_summary_copied: 'Customer-safe Service Proof summary copied',
    service_proof_json_exported: 'Service Proof JSON exported',
    service_proof_route_note_copied: 'Service Proof route note copied',
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
  const user = eventUserProfile(record, props);
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
    `- Corpus status: ${clean(props.corpus_status || 'unknown', 80)}`,
    `- Corpus candidates: ${clean(props.corpus_candidate_count ?? '', 20)}`,
    `- Corpus top source tier: ${clean(props.corpus_top_source_tier || '', 40)}`,
    `- Corpus top match: ${clean(props.corpus_top_match_level || '', 120)}`,
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
        custom_args: { product: 'splashlens', template_id: 'event_owner_alert', correlation_id: crypto.randomUUID(), event_id: record.correlationId, event_type: record.event },
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
          `User: ${user?.label || 'Anonymous device'}`,
          `Known email: ${user?.email || ''}`,
          `Known name: ${user?.name || ''}`,
          `Known company: ${user?.company || ''}`,
          `Known role: ${user?.role || ''}`,
          `Lead ID: ${user?.leadId || ''}`,
          `Pilot ID: ${user?.pilotId || ''}`,
          `Participant ID: ${user?.participantId || ''}`,
          `Identity confidence: ${user?.confidence || 'anonymous'}`,
          `Client ID: ${props.client_id || props.clientId || ''}`,
          `Session ID: ${props.session_id || props.sessionId || ''}`,
          `Facility ID: ${props.facilityId || props.facility_id || ''}`,
          `Facility lane: ${props.lane || ''}`,
          `Outcome: ${props.outcome || ''}`,
          `Preferred language: ${record.language?.preferredLanguage || props.preferred_language || ''}`,
          `Locale: ${record.language?.locale || props.locale || ''}`,
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
    `- Activated clients 30d: ${m.activatedClients30d || 0}`,
    `- Activation completions 30d: ${m.activationCompletions30d || 0}`,
    '',
    'Field actions',
    `- AI scans 30d: ${m.scans30d || 0}`,
    `- Manual searches 30d: ${m.searches30d || 0}`,
    `- PartSnap results 30d: ${m.partsnapResults30d || 0}`,
    `- Stuck PartSnap results 30d: ${m.partSnapStuck30d || 0}`,
    `- Second proof requests 30d: ${m.partSnapSecondProof30d || 0}`,
    `- Low-confidence PartSnap 30d: ${m.partSnapLowConfidence30d || 0}`,
    `- High-risk PartSnap 30d: ${m.partSnapHighRisk30d || 0}`,
    `- Source-backed PartSnap 30d: ${m.partSnapSourceBacked30d || 0}`,
    `- AI-only PartSnap 30d: ${m.partSnapAiOnly30d || 0}`,
    `- Corpus candidate total 30d: ${m.partSnapCorpusCandidates30d || 0}`,
    `- PartSnap packets 30d: ${m.partSnapPackets30d || 0}`,
    `- Proof saves 30d: ${m.proofSaved30d || 0}`,
    `- Field feedback 30d: ${m.fieldFeedback30d || 0}`,
    `- Field tester opt-ins 30d: ${m.fieldTesterOptIns30d || 0}`,
    `- CPO/facility wizard opens 30d: ${m.operatorWizard30d || 0}`,
    `- Field Signals shown 30d: ${m.fieldSignalsShown30d || 0}`,
    `- Field Signal actions 30d: ${m.fieldSignalActions30d || 0}`,
    `- Field Signal dismissals 30d: ${m.fieldSignalDismissals30d || 0}`,
    `- System notification opt-ins 30d: ${m.fieldSignalPermissionsGranted30d || 0}`,
    `- Pump decisions completed 30d: ${m.pumpDecisionsCompleted30d || 0}`,
    `- Customer option summaries 30d: ${m.pumpCustomerSummaries30d || 0}`,
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
        custom_args: { product: 'splashlens', template_id: 'event_digest', correlation_id: crypto.randomUUID() },
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
    correlationId: crypto.randomUUID(),
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

  const amplitude = await forwardEventToAmplitude(env, record);

  let alert = { sent: false, skipped: true };
  if (shouldSendImmediateAlert(record)) {
    alert = await sendEventAlert(env, record);
    console.log('SplashLens app event alert:', JSON.stringify({ event, alert }));
  }

  return json(200, {
    ok: true,
    stored: Boolean(env.SCAN_USAGE_KV),
    alertQueued: Boolean(alert.sent),
    emailConfigured: alert.reason !== 'missing_sendgrid_config',
    amplitudeQueued: Boolean(amplitude.sent),
    amplitudeConfigured: amplitude.reason !== 'missing_amplitude_api_key',
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
  if (url.searchParams.get('aggregate') === '1') {
    const summaryResponse = await eventSummary(request, env);
    if (!summaryResponse.ok) return summaryResponse;
    const summary = await summaryResponse.json();
    const checkoutMode = String(env.SPLASHLENS_CHECKOUT_MODE || '').trim().toLowerCase();
    const paymentLinkDirect = ['payment_link_direct', 'payment_links', 'links'].includes(checkoutMode);
    const firstPartyCheckoutVerified = !paymentLinkDirect && Boolean(String(env.STRIPE_SECRET_KEY || '').trim());
    const webhookVerified = String(env.STRIPE_WEBHOOK_SECRET || env.SPLASHLENS_STRIPE_WEBHOOK_SECRET || '').trim().startsWith('whsec_');
    return json(200, buildSplashLensAggregate(summary, {
      observedAt: new Date().toISOString(),
      revenueConfigured: Boolean(
        env.SCAN_USAGE_KV &&
        (firstPartyCheckoutVerified || webhookVerified)
      ),
    }));
  }

  return json(200, {
    ok: true,
    status: 'SplashLens app event endpoint ready.',
    storageConfigured: Boolean(env.SCAN_USAGE_KV),
    emailConfigured: Boolean((env.SENDGRID_API_KEY || '').trim() && (env.SPLASHLENS_NOTIFY_TO || env.FLAGSHIP_NOTIFY_TO || env.LEAD_NOTIFY_TO || env.ADMIN_EMAIL || '').trim()),
    amplitudeConfigured: amplitudeEnabled(env),
  });
}
