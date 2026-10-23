// Read-only post-deploy check for the two public Cloudflare domains.
import { fileURLToPath } from 'node:url';

export const TARGETS = [
  { name: 'site', url: 'https://splashlens.com/' },
  { name: 'app', url: 'https://app.splashlens.com/' },
];

export async function checkPublicPage(target, fetchPage = fetch) {
  let response;
  try {
    response = await fetchPage(target.url, {
      method: 'GET',
      redirect: 'follow',
      cache: 'no-store',
      signal: AbortSignal.timeout(15000),
    });
  } catch (error) {
    return { name: target.name, ok: false, reason: error?.name === 'TimeoutError' ? 'timeout' : 'network_error' };
  }
  if (response.status !== 200) return { name: target.name, ok: false, reason: `http_${response.status}` };
  if (!/^text\/html\b/i.test(response.headers.get('Content-Type') || '')) {
    return { name: target.name, ok: false, reason: 'non_html' };
  }
  const html = await response.text();
  if (!/<html[\s>]/i.test(html) || !/Splash\s*Lens/i.test(html)) {
    return { name: target.name, ok: false, reason: 'unexpected_page' };
  }
  return { name: target.name, ok: true, reason: 'http_200_html' };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const results = await Promise.all(TARGETS.map(target => checkPublicPage(target)));
  for (const result of results) {
    console.log(`${result.name}: ${result.ok ? 'PASS' : 'FAIL'} ${result.reason}`);
  }
  if (results.some(result => !result.ok)) process.exitCode = 1;
}
