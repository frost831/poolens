const AMPLITUDE_HTTP_V2_ENDPOINT = 'https://api2.amplitude.com/2/httpapi';

function clean(value, max = 120) {
  return String(value || '').replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, max);
}

function parseProps(record) {
  try {
    if (record.props && typeof record.props === 'object') return record.props;
    if (record.propsJson) return JSON.parse(record.propsJson);
  } catch {}
  return {};
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
  return {
    ok: true,
    enabled: amplitudeEnabled(env),
    apiKey: amplitudeEnabled(env) ? amplitudeApiKey(env) : '',
    project: 'splashlens',
    product: 'app',
    sdkUrl: 'https://cdn.amplitude.com/libs/analytics-browser-2.11.7-min.js.gz',
  };
}

function amplitudeIdentity(record, props) {
  const knownEmail = clean(
    props.known_email ||
    props.email ||
    props.customer_email ||
    props.customerEmail ||
    props.contact_email ||
    props.sl_email,
    180,
  ).toLowerCase();
  const leadId = clean(props.lead_id || props.contact_id || props.recipient_id || props.prospect_id || props.referral_id, 120);
  const participantId = clean(props.participant_id || props.participant, 80);
  const pilotId = clean(props.pilot_id || props.pilot, 80);
  const clientId = clean(props.client_id || props.clientId || '', 120);
  const sessionId = clean(props.session_id || props.sessionId || '', 160);
  const fallback = clean(record.correlationId || record.id || `${record.event}:${record.createdAt}`, 180);
  const userId = knownEmail || leadId || participantId || pilotId || '';
  const deviceId = clientId || sessionId || fallback || 'splashlens-anonymous-device';
  return {
    user_id: userId && userId.length >= 5 ? userId : undefined,
    device_id: deviceId.length >= 5 ? deviceId : 'splashlens-anonymous-device',
  };
}

function amplitudeUserProperties(record, props) {
  return {
    product: 'splashlens',
    source: clean(record.source || props.source || props.attribution_source || 'app', 80),
    role: clean(props.known_role || props.role || props.audience || props.persona || props.splashlens_role || '', 80),
    company: clean(props.known_company || props.company || props.organization || props.org || props.account || '', 160),
    identity_source: clean(props.identity_source || props.attribution_source || record.source || 'app', 80),
    identity_confidence: clean(props.identity_confidence || '', 40),
    store_shell: clean(props.store_shell || '', 40),
    language: clean(record.language?.preferredLanguage || props.preferred_language || '', 16),
    locale: clean(record.language?.locale || props.locale || '', 32),
  };
}

function pruneObject(value) {
  return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined && item !== null && item !== ''));
}

export async function forwardEventToAmplitude(env, record) {
  if (!amplitudeEnabled(env)) return { sent: false, skipped: true, reason: 'missing_amplitude_api_key' };
  const props = parseProps(record);
  const identity = amplitudeIdentity(record, props);
  const eventProperties = pruneObject({
    ...props,
    product: 'splashlens',
    source: clean(record.source || props.source || props.attribution_source || 'app', 80),
    path: clean(record.path || props.path || '', 300),
    page_path: clean(record.path || props.path || '', 300),
    preferred_language: clean(record.language?.preferredLanguage || props.preferred_language || '', 16),
    locale: clean(record.language?.locale || props.locale || '', 32),
  });

  const payload = {
    api_key: amplitudeApiKey(env),
    events: [{
      ...identity,
      event_type: clean(record.event || 'splashlens_event', 80),
      event_properties: eventProperties,
      user_properties: pruneObject(amplitudeUserProperties(record, props)),
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
