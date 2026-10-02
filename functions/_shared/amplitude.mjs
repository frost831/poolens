const AMPLITUDE_HTTP_V2_ENDPOINT = 'https://api2.amplitude.com/2/httpapi';

function clean(value, max = 120) {
  return String(value || '').replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, max);
}

function envFlag(value) {
  return /^(1|true|yes|on)$/i.test(String(value || '').trim());
}

export function amplitudeApiKey(env) {
  return String(env.AMPLITUDE_API_KEY || env.SPLASHLENS_AMPLITUDE_API_KEY || '').trim();
}

export function amplitudeEnabled(env) {
  return Boolean(amplitudeApiKey(env)) && !envFlag(env.SPLASHLENS_AMPLITUDE_DISABLED);
}

export function amplitudeConfigPayload(env) {
  const enabled = amplitudeEnabled(env);
  return {
    ok: true,
    enabled,
    status: enabled ? 'ready' : 'missing_api_key',
    ingestion: 'server_side_http_v2',
    keyExposed: false,
    project: 'splashlens',
    product: 'app',
    sdkUrl: 'https://cdn.amplitude.com/libs/analytics-browser-2.11.7-min.js.gz',
  };
}

function pruneObject(value) {
  return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined && item !== null && item !== ''));
}

const PERSONAL_PROP_KEYS = new Set([
  'email', 'e', 'sl_email', 'customer_email', 'contact_email', 'free_profile_email', 'known_email',
  'name', 'first_name', 'last_name', 'customer_name', 'contact_name', 'free_profile_name', 'known_name',
  'company', 'organization', 'org', 'account', 'free_profile_company', 'known_company',
  'phone', 'mobile', 'address', 'street', 'city', 'postal_code', 'zip',
  'lead_id', 'contact_id', 'recipient_id', 'prospect_id', 'pilot_id', 'participant_id',
]);

function sanitizeProps(props = {}) {
  return Object.fromEntries(Object.entries(props).flatMap(([key, value]) => {
    const normalizedKey = String(key || '').trim().toLowerCase();
    if (!normalizedKey || PERSONAL_PROP_KEYS.has(normalizedKey)) return [];
    if (value === null || ['string', 'number', 'boolean'].includes(typeof value)) {
      const safeValue = typeof value === 'string'
        ? clean(value, 300).replace(/[^\s@]+@[^\s@]+\.[^\s@]+/g, '[redacted-email]')
        : value;
      return [[key, safeValue]];
    }
    return [];
  }));
}

function groups(props) {
  const campaign = clean(props.attribution_campaign || props.campaign || '', 120);
  const publisher = clean(props.publication || props.publisher || props.attribution_source || '', 80);
  const value = pruneObject({ campaign, publisher });
  return Object.keys(value).length ? value : undefined;
}

function identity(record, props) {
  const clientId = clean(props.client_id || props.clientId || props.anon_device_id || '', 120);
  const fallback = clean(record.correlationId || `${record.event}:${record.createdAt}`, 180);
  const deviceId = clientId || fallback || 'splashlens-app-device';
  return {
    device_id: deviceId.length >= 5 ? deviceId : 'splashlens-app-device',
  };
}

export async function forwardEventToAmplitude(env, record, props = {}) {
  if (!amplitudeEnabled(env)) return { sent: false, skipped: true, reason: 'missing_amplitude_api_key' };
  const safeProps = sanitizeProps(props);
  const payload = {
    api_key: amplitudeApiKey(env),
    events: [{
      ...identity(record, safeProps),
      event_type: clean(record.event || 'app_event', 80),
      event_properties: pruneObject({
        ...safeProps,
        product: 'splashlens',
        source: clean(record.source || safeProps.source || safeProps.attribution_source || 'app', 80),
        path: clean(record.path || safeProps.path || '', 300),
        page_path: clean(record.path || safeProps.path || '', 300),
        plan: clean(record.plan || safeProps.plan || '', 80),
        mode: clean(record.mode || safeProps.mode || '', 80),
      }),
      user_properties: pruneObject({
        product: 'splashlens',
        source: clean(record.source || safeProps.source || safeProps.attribution_source || 'app', 80),
        role: clean(safeProps.known_role || safeProps.role || safeProps.audience || safeProps.persona || safeProps.splashlens_role || '', 80),
        identity_source: clean(safeProps.identity_source || safeProps.attribution_source || record.source || 'app', 80),
        identity_confidence: clean(safeProps.identity_confidence || '', 40),
      }),
      groups: groups(safeProps),
      time: Date.parse(record.createdAt || '') || Date.now(),
      insert_id: clean(record.correlationId || `${record.event}:${record.createdAt}`, 180),
    }],
  };
  try {
    const response = await fetch(AMPLITUDE_HTTP_V2_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return { sent: response.ok, status: response.status };
  } catch (error) {
    console.warn('Amplitude forwarding failed:', String(error));
    return { sent: false, reason: 'forward_failed' };
  }
}
