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

function groups(props) {
  const company = clean(props.known_company || props.company || props.organization || props.org || props.account || '', 160);
  const campaign = clean(props.attribution_campaign || props.campaign || '', 120);
  const publisher = clean(props.publication || props.publisher || props.attribution_source || '', 80);
  const value = pruneObject({ company, campaign, publisher });
  return Object.keys(value).length ? value : undefined;
}

function identity(record, props) {
  const knownEmail = clean(props.known_email || props.contact_email || props.email || props.e || props.sl_email, 180).toLowerCase();
  const leadId = clean(props.lead_id || props.contact_id || props.recipient_id || props.prospect_id || props.referral_id, 120);
  const clientId = clean(props.client_id || props.clientId || props.anon_device_id || '', 120);
  const fallback = clean(record.correlationId || `${record.event}:${record.createdAt}`, 180);
  const userId = knownEmail || leadId || '';
  const deviceId = clientId || fallback || 'splashlens-app-device';
  return {
    user_id: userId && userId.length >= 5 ? userId : undefined,
    device_id: deviceId.length >= 5 ? deviceId : 'splashlens-app-device',
  };
}

export async function forwardEventToAmplitude(env, record, props = {}) {
  if (!amplitudeEnabled(env)) return { sent: false, skipped: true, reason: 'missing_amplitude_api_key' };
  const payload = {
    api_key: amplitudeApiKey(env),
    events: [{
      ...identity(record, props),
      event_type: clean(record.event || 'app_event', 80),
      event_properties: pruneObject({
        ...props,
        product: 'splashlens',
        source: clean(record.source || props.source || props.attribution_source || 'app', 80),
        path: clean(record.path || props.path || '', 300),
        page_path: clean(record.path || props.path || '', 300),
        plan: clean(record.plan || props.plan || '', 80),
        mode: clean(record.mode || props.mode || '', 80),
      }),
      user_properties: pruneObject({
        product: 'splashlens',
        source: clean(record.source || props.source || props.attribution_source || 'app', 80),
        role: clean(props.known_role || props.role || props.audience || props.persona || props.splashlens_role || '', 80),
        company: clean(props.known_company || props.company || props.organization || props.org || props.account || '', 160),
        identity_source: clean(props.identity_source || props.attribution_source || record.source || 'app', 80),
        identity_confidence: clean(props.identity_confidence || '', 40),
      }),
      groups: groups(props),
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
