const DEFAULT_FIRST_PARTY_HOSTS = [
  'app.splashlens.com',
  'splashlens.com',
  'www.splashlens.com',
];

const RESERVED_IDENTITY_PATTERNS = [
  /^support$/,
  /^admin$/,
  /^administrator$/,
  /^billing$/,
  /^security$/,
  /^official$/,
  /^platform support$/,
  /^splashlens$/,
  /^splashlens support$/,
  /^splashlens admin$/,
  /^splashlens billing$/,
  /^splashlens security$/,
  /^poolens support$/,
  /^poolens admin$/,
];

const PLATFORM_IMPERSONATION_PATTERNS = [
  /\bofficial\s+(splashlens|platform|app)\s+(support|admin|billing|security)\b/i,
  /\b(splashlens|platform|app)\s+(support|admin|billing|security)\s+(team|desk|department)\b/i,
  /\bthis\s+is\s+(splashlens|platform)\s+(support|admin|billing|security)\b/i,
  /\bfrom\s+(splashlens|platform)\s+(support|admin|billing|security)\b/i,
];

const PHISHING_PATTERNS = [
  /\bverify\s+(your\s+)?(account|payment|billing|identity|login)\b/i,
  /\baccount\s+(verification|required|suspended|locked|hold|restricted)\b/i,
  /\b(payment|billing|card)\s+(failed|declined|required|verification|update)\b/i,
  /\bupdate\s+(your\s+)?(payment|billing|card|password|login)\b/i,
  /\bconfirm\s+(your\s+)?(password|card|payment|login|account)\b/i,
  /\bsend\s+(your\s+)?(password|code|2fa|one[-\s]?time\s+code|otp)\b/i,
  /\blog\s*in\s+(here|now|to\s+avoid|to\s+restore)\b/i,
  /\bpay\s+(now|outside|off[-\s]?platform|by\s+wire|by\s+gift\s+card|by\s+crypto)\b/i,
];

const ACTION_LINK_WORDS = [
  'account',
  'payment',
  'billing',
  'support',
  'verify',
  'verification',
  'login',
  'log in',
  'password',
  'checkout',
  'invoice',
  'refund',
];

export function cleanSecurityText(value, max = 500) {
  return String(value || '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
}

export function normalizeIdentityName(value) {
  return cleanSecurityText(value, 120)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function isReservedIdentityName(value) {
  const normalized = normalizeIdentityName(value);
  if (!normalized) return false;
  return RESERVED_IDENTITY_PATTERNS.some((pattern) => pattern.test(normalized));
}

export function assertAllowedIdentityName(value, { staff = false } = {}) {
  if (staff) return { ok: true, normalized: normalizeIdentityName(value) };
  if (isReservedIdentityName(value)) {
    return {
      ok: false,
      code: 'reserved_identity',
      message: 'That name is reserved for official SplashLens staff.',
      normalized: normalizeIdentityName(value),
    };
  }
  return { ok: true, normalized: normalizeIdentityName(value) };
}

export function firstPartyHosts(env = {}) {
  return String(env.SPLASHLENS_FIRST_PARTY_HOSTS || DEFAULT_FIRST_PARTY_HOSTS.join(','))
    .split(',')
    .map((host) => host.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, ''))
    .filter(Boolean);
}

export function extractUrls(text) {
  const value = String(text || '');
  const matches = value.match(/\b(?:https?:\/\/|www\.)[^\s<>"'`)}\]]+/gi) || [];
  return matches.map((raw) => raw.replace(/[.,;:!?]+$/g, ''));
}

export function parseHttpUrl(raw) {
  const value = String(raw || '').trim();
  if (!value) return null;
  try {
    const url = new URL(value.startsWith('www.') ? `https://${value}` : value);
    if (!['https:', 'http:'].includes(url.protocol)) return null;
    return url;
  } catch {
    return null;
  }
}

export function isFirstPartyUrl(raw, env = {}) {
  const url = parseHttpUrl(raw);
  if (!url) return false;
  return firstPartyHosts(env).includes(url.hostname.toLowerCase());
}

function textHasActionIntent(text) {
  const normalized = cleanSecurityText(text, 4000).toLowerCase();
  return ACTION_LINK_WORDS.some((word) => normalized.includes(word));
}

function rateLimitIdentity(request, subject = '') {
  const ip = cleanSecurityText(
    request?.headers?.get?.('CF-Connecting-IP') ||
    request?.headers?.get?.('X-Forwarded-For')?.split(',')[0] ||
    request?.headers?.get?.('X-Real-IP') ||
    'unknown',
    80,
  ).toLowerCase();
  const safeSubject = cleanSecurityText(subject, 120).toLowerCase().replace(/[^a-z0-9@._-]+/g, '-');
  return `${ip}:${safeSubject || 'anonymous'}`;
}

export async function enforceSecurityRateLimit({
  env = {},
  request,
  action = 'submission',
  subject = '',
  limit = 20,
  windowSeconds = 3600,
} = {}) {
  const kv = env.SCAN_USAGE_KV;
  if (!kv || typeof kv.get !== 'function' || typeof kv.put !== 'function') {
    return { ok: true, limited: false, storageConfigured: false };
  }

  const bucket = Math.floor(Date.now() / (windowSeconds * 1000));
  const key = `security-rate:${cleanSecurityText(action, 40)}:${bucket}:${rateLimitIdentity(request, subject)}`;
  const current = Math.max(0, Number(await kv.get(key)) || 0);
  if (current >= limit) {
    const log = await writeModerationLog(env, {
      type: 'rate_limit_block',
      action,
      subject: cleanSecurityText(subject, 180),
      reason: 'security_rate_limit_exceeded',
      count: current,
      limit,
    });
    await sendSecurityAlert(env, log.entry);
    return { ok: false, limited: true, key, count: current, limit, storageConfigured: true };
  }
  await kv.put(key, String(current + 1), { expirationTtl: windowSeconds + 60 });
  return { ok: true, limited: false, key, count: current + 1, limit, storageConfigured: true };
}

export async function writeModerationLog(env = {}, record = {}) {
  const entry = {
    id: record.id || crypto.randomUUID(),
    type: cleanSecurityText(record.type || 'moderation_event', 80),
    action: cleanSecurityText(record.action || '', 80),
    actorId: cleanSecurityText(record.actorId || record.subject || '', 180),
    reasons: Array.isArray(record.reasons) ? record.reasons.map((reason) => cleanSecurityText(reason, 120)).slice(0, 12) : [],
    urls: Array.isArray(record.urls) ? record.urls.map((url) => cleanSecurityText(url, 300)).slice(0, 12) : [],
    context: cleanSecurityText(record.context || '', 120),
    createdAt: record.createdAt || new Date().toISOString(),
    dryRun: Boolean(record.dryRun),
  };
  if (env.SCAN_USAGE_KV && typeof env.SCAN_USAGE_KV.put === 'function') {
    await env.SCAN_USAGE_KV.put(`security-moderation:${entry.createdAt}:${entry.id}`, JSON.stringify(entry), {
      expirationTtl: 365 * 24 * 60 * 60,
    });
    return { stored: true, entry };
  }
  console.warn('SplashLens moderation log storage unavailable', JSON.stringify(entry));
  return { stored: false, entry };
}

export async function sendSecurityAlert(env = {}, entry = {}) {
  const sender = officialSenderConfig(env);
  const apiKey = cleanSecurityText(env.SENDGRID_API_KEY || '', 400);
  const to = cleanSecurityText(env.SPLASHLENS_SECURITY_NOTIFY_TO || env.SPLASHLENS_NOTIFY_TO || env.FLAGSHIP_NOTIFY_TO || env.LEAD_NOTIFY_TO || env.ADMIN_EMAIL || '', 180);
  if (!apiKey || !to || !sender.fromPolicyOk) {
    return { sent: false, reason: !sender.fromPolicyOk ? 'sender_policy_blocked' : 'missing_sendgrid_config' };
  }

  const text = [
    'SplashLens security gate alert',
    '',
    `Type: ${cleanSecurityText(entry.type || 'moderation_event', 80)}`,
    `Action: ${cleanSecurityText(entry.action || '', 80)}`,
    `Actor/user: ${cleanSecurityText(entry.actorId || '', 180)}`,
    `Reasons: ${Array.isArray(entry.reasons) ? entry.reasons.join(', ') : ''}`,
    `Links: ${Array.isArray(entry.urls) ? entry.urls.join(', ') : ''}`,
    `Context: ${cleanSecurityText(entry.context || '', 120)}`,
    `Created: ${cleanSecurityText(entry.createdAt || new Date().toISOString(), 60)}`,
    '',
    'Review the SplashLens moderation log before contacting users or applying quarantine.',
  ].join('\n');

  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${apiKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [{
        to: [{ email: to }],
        subject: `[SplashLens Security] ${cleanSecurityText(entry.type || 'Moderation alert', 80)}`,
        custom_args: {
          product: 'splashlens',
          template_id: 'security_gate_alert',
          correlation_id: crypto.randomUUID(),
          moderation_id: cleanSecurityText(entry.id || '', 120),
        },
      }],
      from: { email: sender.from, name: 'SplashLens Security' },
      reply_to: { email: sender.replyTo, name: 'SplashLens Support' },
      categories: ['splashlens', 'security-gate'],
      content: [{ type: 'text/plain', value: text }],
    }),
  });
  return { sent: response.ok, status: response.status };
}

export function scanMessageForAbuse({
  text = '',
  actorName = '',
  actorIsStaff = false,
  env = {},
  context = 'message',
} = {}) {
  const body = cleanSecurityText(text, 5000);
  const reasons = [];
  const matched = [];
  const urls = extractUrls(body);

  const identity = assertAllowedIdentityName(actorName, { staff: actorIsStaff });
  if (!identity.ok) reasons.push(identity.code);

  for (const pattern of PLATFORM_IMPERSONATION_PATTERNS) {
    if (pattern.test(body)) {
      reasons.push('platform_impersonation');
      matched.push(pattern.source);
      break;
    }
  }

  for (const pattern of PHISHING_PATTERNS) {
    if (pattern.test(body)) {
      reasons.push('phishing_language');
      matched.push(pattern.source);
      break;
    }
  }

  const actionIntent = textHasActionIntent(body);
  const externalActionLinks = urls.filter((url) => !isFirstPartyUrl(url, env));
  if (actionIntent && externalActionLinks.length) reasons.push('external_account_payment_or_support_link');

  return {
    ok: reasons.length === 0,
    action: reasons.length ? 'block' : 'allow',
    context,
    reasons: Array.from(new Set(reasons)),
    urls,
    externalActionLinks,
    matched,
  };
}

export async function protectUserSubmission({
  env = {},
  request,
  action = 'submission',
  subject = '',
  actorName = '',
  actorIsStaff = false,
  textParts = [],
  rateLimit = {},
  context = action,
} = {}) {
  const rate = await enforceSecurityRateLimit({
    env,
    request,
    action,
    subject,
    limit: rateLimit.limit || 20,
    windowSeconds: rateLimit.windowSeconds || 3600,
  });
  if (!rate.ok) {
    return {
      ok: false,
      status: 429,
      error: 'rate_limited',
      message: 'Too many attempts. Please try again later.',
      moderation: { reasons: ['rate_limit'], urls: [] },
    };
  }

  const abuse = scanMessageForAbuse({
    text: textParts.filter((part) => part !== undefined && part !== null).join('\n'),
    actorName,
    actorIsStaff,
    env,
    context,
  });
  if (!abuse.ok) {
    const log = await writeModerationLog(env, {
      type: 'blocked_submission',
      action,
      subject,
      reasons: abuse.reasons,
      urls: abuse.urls,
      context,
    });
    await sendSecurityAlert(env, log.entry);
    return {
      ok: false,
      status: 400,
      error: 'blocked_by_security_policy',
      message: 'This submission was blocked by SplashLens safety checks.',
      moderation: abuse,
    };
  }

  return { ok: true, rate, moderation: abuse };
}

export function officialEmailDomain(env = {}) {
  return cleanSecurityText(env.SPLASHLENS_OFFICIAL_EMAIL_DOMAIN || 'splashlens.com', 120).toLowerCase();
}

export function isOfficialEmailAddress(email, env = {}) {
  const value = cleanSecurityText(email, 180).toLowerCase();
  const domain = officialEmailDomain(env);
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.endsWith(`@${domain}`);
}

export function officialSenderConfig(env = {}, fallback = 'hello@splashlens.com') {
  const configuredFrom = cleanSecurityText(env.SENDGRID_FROM || env.FLAGSHIP_NOTIFY_FROM || fallback, 180).toLowerCase();
  const configuredReplyTo = cleanSecurityText(env.SPLASHLENS_REPLY_TO || env.SENDGRID_REPLY_TO || fallback, 180).toLowerCase();
  return {
    from: isOfficialEmailAddress(configuredFrom, env) ? configuredFrom : fallback,
    replyTo: isOfficialEmailAddress(configuredReplyTo, env) ? configuredReplyTo : fallback,
    fromPolicyOk: isOfficialEmailAddress(configuredFrom, env),
    replyToPolicyOk: isOfficialEmailAddress(configuredReplyTo, env),
    domain: officialEmailDomain(env),
  };
}
