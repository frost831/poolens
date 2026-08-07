const MAX_DAYS = 120;
const DEFAULT_DAYS = 35;
const MAX_KEYS = 50000;

function json(status, payload) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'access-control-allow-origin': 'https://app.splashlens.com',
      'access-control-allow-headers': 'content-type, x-splashlens-pull-secret, x-splashlens-stats-secret',
    },
  });
}

function clean(value, max = 180) {
  return String(value || '').replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, max);
}

function isAuthorized(request, env) {
  const expected = clean(env.SPLASHLENS_PULL_SECRET || env.SPLASHLENS_STATS_SECRET, 500);
  if (!expected) return false;
  const provided = clean(
    request.headers.get('X-SplashLens-Pull-Secret') ||
    request.headers.get('X-SplashLens-Stats-Secret') ||
    new URL(request.url).searchParams.get('secret'),
    500,
  );
  return Boolean(provided) && provided === expected;
}

function intParam(url, name, fallback, min, max) {
  const value = Number.parseInt(url.searchParams.get(name) || '', 10);
  if (!Number.isFinite(value)) return fallback;
  return Math.max(min, Math.min(max, value));
}

function add(map, key, amount = 1) {
  const safe = clean(key || 'unknown') || 'unknown';
  map.set(safe, (map.get(safe) || 0) + amount);
}

function topList(map, limit = 30) {
  return Array.from(map.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([name, count]) => ({ name, count }));
}

function asObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function isSynthetic(record, props) {
  const joined = [
    record.event,
    record.source,
    record.path,
    record.mode,
    props.source,
    props.mode,
    props.test_id,
  ].map((value) => String(value || '').toLowerCase()).join(' ');
  return /codex|smoke|test|launch-gate|qa|audit|probe|demo/.test(joined);
}

function dayPrefix(date) {
  return `event:${date.toISOString().slice(0, 10)}`;
}

async function listKeys(kv, prefix) {
  const names = [];
  let cursor;
  do {
    const page = await kv.list({ prefix, cursor, limit: 1000 });
    for (const key of page.keys || []) names.push(key.name);
    cursor = page.list_complete ? undefined : page.cursor;
  } while (cursor);
  return names;
}

async function readValues(kv, names) {
  const values = [];
  for (let i = 0; i < names.length; i += 100) {
    const group = names.slice(i, i + 100);
    try {
      const bulk = await kv.get(group);
      if (bulk instanceof Map) {
        for (const name of group) values.push([name, bulk.get(name)]);
      } else {
        const individual = await Promise.all(group.map((name) => kv.get(name)));
        individual.forEach((value, index) => values.push([group[index], value]));
      }
    } catch {
      const individual = await Promise.all(group.map(async (name) => [name, await kv.get(name).catch(() => null)]));
      values.push(...individual);
    }
  }
  return values;
}

function safeSample(name, record, props) {
  return {
    key: clean(name, 120),
    event: clean(record.event, 80),
    source: clean(record.source, 80),
    path: clean(record.path, 180),
    mode: clean(record.mode || props.mode, 80),
    createdAt: clean(record.createdAt || record.created_at, 40),
    propKeys: Object.keys(props).slice(0, 25),
  };
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'access-control-allow-origin': 'https://app.splashlens.com',
      'access-control-allow-methods': 'GET, OPTIONS',
      'access-control-allow-headers': 'content-type, x-splashlens-pull-secret, x-splashlens-stats-secret',
    },
  });
}

export async function onRequestGet({ request, env }) {
  if (!isAuthorized(request, env)) {
    return json(401, { ok: false, error: 'Unauthorized' });
  }
  if (!env.SCAN_USAGE_KV || typeof env.SCAN_USAGE_KV.list !== 'function') {
    return json(503, { ok: false, error: 'SCAN_USAGE_KV is not configured' });
  }

  const url = new URL(request.url);
  const days = intParam(url, 'days', DEFAULT_DAYS, 1, MAX_DAYS);
  const maxKeys = intParam(url, 'maxKeys', MAX_KEYS, 100, MAX_KEYS);
  const now = new Date();
  const keys = new Set();
  const keyCountsByDay = {};

  for (let offset = 0; offset < days; offset += 1) {
    const date = new Date(now);
    date.setUTCDate(date.getUTCDate() - offset);
    const prefix = dayPrefix(date);
    const dayKeys = await listKeys(env.SCAN_USAGE_KV, prefix);
    keyCountsByDay[prefix.slice(6)] = dayKeys.length;
    for (const name of dayKeys) keys.add(name);
  }

  const sortedKeys = Array.from(keys).sort((a, b) => b.localeCompare(a));
  const limitedKeys = sortedKeys.slice(0, maxKeys);
  const values = await readValues(env.SCAN_USAGE_KV, limitedKeys);

  const maps = {
    events: new Map(),
    realEvents: new Map(),
    syntheticEvents: new Map(),
    sources: new Map(),
    paths: new Map(),
    modes: new Map(),
    plans: new Map(),
    days: new Map(),
    challenge: new Map(),
    partsnap: new Map(),
    facility: new Map(),
    feedback: new Map(),
    checkout: new Map(),
    knownUserSignals: new Map(),
    propKeys: new Map(),
  };
  const recentSampleShape = [];
  let parsed = 0;
  let parseErrors = 0;
  let realCount = 0;
  let syntheticCount = 0;

  for (const [name, raw] of values) {
    if (!raw) continue;
    let record;
    try {
      record = JSON.parse(raw);
      parsed += 1;
    } catch {
      parseErrors += 1;
      continue;
    }
    const props = asObject(record.props);
    const event = clean(record.event || 'unknown', 80);
    const synthetic = isSynthetic(record, props);
    const day = clean(record.createdAt || record.created_at || name, 40).slice(0, 10);

    add(maps.events, event);
    add(synthetic ? maps.syntheticEvents : maps.realEvents, event);
    add(maps.sources, record.source || props.source);
    add(maps.paths, record.path || props.path);
    add(maps.modes, record.mode || props.mode);
    add(maps.plans, record.plan || props.plan || props.plan_key || props.planKey);
    add(maps.days, day);
    for (const key of Object.keys(props)) add(maps.propKeys, key);

    if (synthetic) syntheticCount += 1;
    else realCount += 1;
    if (/challenge/i.test(event) || props.challenge || props.challenge_id) add(maps.challenge, event);
    if (/partsnap/i.test(event) || /partsnap/i.test(String(record.mode || props.mode || ''))) add(maps.partsnap, event);
    if (/facility|operator/i.test(event) || props.facility_id || props.facility_lane) add(maps.facility, event);
    if (/feedback/i.test(event)) add(maps.feedback, event);
    if (/checkout|upgrade|paid/i.test(event)) add(maps.checkout, event);
    if (props.known_email || props.known_name || props.known_company || props.lead_id || props.pilot_id || props.participant_id) {
      add(maps.knownUserSignals, event);
    }
    if (recentSampleShape.length < 25) recentSampleShape.push(safeSample(name, record, props));
  }

  return json(200, {
    ok: true,
    generatedAt: new Date().toISOString(),
    windowDays: days,
    keysFound: sortedKeys.length,
    keysRead: limitedKeys.length,
    truncated: sortedKeys.length > limitedKeys.length,
    parsed,
    parseErrors,
    realCount,
    syntheticCount,
    keyCountsByDay,
    topEvents: topList(maps.events, 60),
    realTopEvents: topList(maps.realEvents, 60),
    syntheticTopEvents: topList(maps.syntheticEvents, 40),
    topSources: topList(maps.sources, 40),
    topPaths: topList(maps.paths, 40),
    topModes: topList(maps.modes, 30),
    topPlans: topList(maps.plans, 30),
    eventsByDay: topList(maps.days, 120),
    challengeEvents: topList(maps.challenge, 40),
    partSnapEvents: topList(maps.partsnap, 40),
    facilityEvents: topList(maps.facility, 40),
    feedbackEvents: topList(maps.feedback, 40),
    checkoutEvents: topList(maps.checkout, 40),
    knownUserSignalEvents: topList(maps.knownUserSignals, 40),
    topPropKeys: topList(maps.propKeys, 80),
    recentSampleShape,
  });
}
