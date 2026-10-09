const MAX_PACKET_LENGTH = 480;
const PASSPORT_HOSTS = new Set([
  'app.splashlens.com', 'splashlens.com', 'www.splashlens.com', 'poolens.pages.dev',
]);
const COPY = {
  en: { proof: 'SplashLens proof', code: 'SplashLens code answer', codeLabel: 'Code', result: 'Result', evidence: 'Proof', passport: 'Passport' },
  // needs_native_review: drafted field-facing Spanish labels.
  es: { proof: 'Prueba de SplashLens', code: 'Respuesta de código de SplashLens', codeLabel: 'Código', result: 'Resultado', evidence: 'Evidencia', passport: 'Pasaporte' },
};
const COMMERCE = /[$€£]|\b(?:usd|eur|price|pricing|checkout|payment|pay|subscribe|subscription|precio|precios|pago|pagar|compra|suscripci[oó]n)\b|\b\d+(?:\.\d{2})?\s*(?:\/|per\s+|por\s+)(?:mo|month|yr|year|mes|año)\b/i;

function clean(value) {
  if (typeof value !== 'string') return '';
  const text = value.replace(/[\u0000-\u001f\u007f-\u009f\u200e\u200f\u202a-\u202e\u2066-\u2069]/g, ' ').replace(/\s+/g, ' ').trim();
  return COMMERCE.test(text) ? '' : text;
}

function passportLink(value) {
  if (typeof value !== 'string' || value.length > 256) return '';
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || !PASSPORT_HOSTS.has(url.hostname) || url.port || url.username || url.password || url.search || url.hash) return '';
    return /^\/api\/proof-packets\/[A-Za-z0-9_-]{32}$/.test(url.pathname) ? url.href : '';
  } catch {
    return '';
  }
}

function fit(value, limit) {
  if (value.length <= limit) return value;
  if (limit < 2) return '';
  const end = value.charCodeAt(limit - 2);
  const length = end >= 0xd800 && end <= 0xdbff ? limit - 2 : limit - 1;
  return `${value.slice(0, length).trimEnd()}…`;
}

export function composeProofPacket({ language = 'en', kind = 'proof', code = '', summary = '', evidence = '', passportUrl = '' } = {}) {
  const labels = COPY[language === 'es' ? 'es' : 'en'];
  const link = passportLink(passportUrl);
  const footer = link ? `\n${labels.passport}: ${link}` : '';
  const lines = [kind === 'code' ? labels.code : labels.proof];
  const fields = [
    [kind === 'code' ? labels.codeLabel : '', clean(code), 80],
    [labels.result, clean(summary), 190],
    [labels.evidence, clean(evidence), 140],
  ];
  for (const [label, value, fieldLimit] of fields) {
    if (!value) continue;
    const prefix = label ? `${label}: ` : '';
    const remaining = MAX_PACKET_LENGTH - lines.join('\n').length - footer.length - prefix.length - 1;
    const entry = fit(value, Math.min(remaining, fieldLimit));
    if (entry) lines.push(`${prefix}${entry}`);
  }
  return `${lines.join('\n')}${footer}`;
}

export function smsUrl(text, platform) {
  if (platform !== 'ios' && platform !== 'android') throw new TypeError('SMS platform must be ios or android.');
  if (typeof text !== 'string' || !text || text.length > MAX_PACKET_LENGTH) throw new TypeError('A short packet is required.');
  return `sms:?${platform === 'ios' ? '&' : ''}body=${encodeURIComponent(text)}`;
}

export function smsPlatform(nav = globalThis.navigator) {
  const ua = nav?.userAgent || '';
  if (/iPhone|iPad|iPod/i.test(ua) || (nav?.platform === 'MacIntel' && nav?.maxTouchPoints > 1)) return 'ios';
  if (/Android/i.test(ua)) return 'android';
  return null;
}

function defaultOpenSms(url, doc) {
  if (!doc?.createElement || !doc?.body) return false;
  const anchor = doc.createElement('a');
  anchor.href = url;
  anchor.hidden = true;
  doc.body.append(anchor);
  try {
    anchor.click();
    return true;
  } finally {
    anchor.remove();
  }
}

export async function shareProofPacket({ packet, surface, platform, navigator: nav = globalThis.navigator,
  document: doc = globalThis.document, openSms = defaultOpenSms, onEvent = () => {} } = {}) {
  if (typeof packet !== 'string' || !packet || packet.length > MAX_PACKET_LENGTH || COMMERCE.test(packet)) {
    throw new TypeError('A short, commerce-free packet is required.');
  }
  if (typeof surface !== 'string' || !/^[a-z][a-z0-9_]{0,63}$/.test(surface)) throw new TypeError('A surface is required.');
  const emit = (event, channel) => { try { onEvent(event, { channel, surface }); } catch {} };
  const device = platform === undefined ? smsPlatform(nav) : platform;
  if (device === 'ios' || device === 'android') {
    emit('packet_share_tapped', 'sms');
    try {
      if (await openSms(smsUrl(packet, device), doc) === true) {
        emit('packet_shared', 'sms');
        return { channel: 'sms' };
      }
    } catch {}
  }
  if (typeof nav?.share === 'function') {
    emit('packet_share_tapped', 'share_sheet');
    try {
      await nav.share({ text: packet });
      emit('packet_shared', 'share_sheet');
      return { channel: 'share_sheet' };
    } catch (error) {
      if (error?.name === 'AbortError') return { channel: null, canceled: true };
    }
  }
  if (typeof nav?.clipboard?.writeText === 'function') {
    emit('packet_share_tapped', 'clipboard');
    try {
      await nav.clipboard.writeText(packet);
      emit('packet_shared', 'clipboard');
      return { channel: 'clipboard' };
    } catch {}
  }
  return { channel: null };
}
