const QA_SOURCES = new Set(['qa', 'codex', 'codex_smoke', 'launch-gate-test']);
const BOT_UA = /bot|crawler|spider|preview|headless|curl|python-requests|node-fetch|externalagent|facebookexternalhit/i;

export function classifyTraffic({ source = '', utmSource = '', userAgent = '', path = '', props = {}, webdriver = false, serverOrigin = false } = {}) {
  const namedSource = String(source || '').toLowerCase();
  const campaignSource = String(utmSource || props.attribution_source || props.utm_source || '').toLowerCase();
  const eventPath = String(path || '').toLowerCase();
  if (QA_SOURCES.has(namedSource) || QA_SOURCES.has(campaignSource)
      || props.demo === true || props.test === true || props.synthetic === true
      || eventPath.startsWith('/test/') || eventPath.includes('verify=')) return 'qa';
  if (webdriver || BOT_UA.test(String(userAgent || ''))) return 'bot';
  if (serverOrigin && !props.client_id && !props.clientId) return 'server';
  return 'real';
}
