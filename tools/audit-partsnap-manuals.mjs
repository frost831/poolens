import { PARTSNAP_SOURCES } from '../functions/data/partsnap-source-corpus.mjs';

// Deliberately bounded: inspect only the reviewed exact-manual entries. No crawl,
// cookies, authenticated sources, document redistribution or anti-bot bypass.
export async function auditManuals(fetcher = fetch) {
  const results = [];
  for (const [id, source] of Object.entries(PARTSNAP_SOURCES).filter(([, source]) => source.reviewedOn)) {
    const url = new URL(source.url);
    url.hash = '';
    const response = await fetcher(url.href, { headers: { Range: 'bytes=0-1023' }, signal: AbortSignal.timeout(20000) });
    const reader = response.body?.getReader();
    let header = '';
    try {
      const chunk = await reader?.read();
      header = new TextDecoder().decode(chunk?.value?.slice(0, 5));
    } finally { await reader?.cancel(); }
    const pdf = [200, 206].includes(response.status) &&
      /application\/pdf/i.test(response.headers.get('content-type') || '') && header === '%PDF-';
    results.push({ id, url: source.url, status: response.status, pdf, reviewedOn: source.reviewedOn, scope: source.scope });
  }
  return { checkedAt: new Date().toISOString(), ok: results.length > 0 && results.every(row => row.pdf), results };
}

if (process.argv[1]?.replaceAll('\\', '/').endsWith('/audit-partsnap-manuals.mjs')) {
  const result = await auditManuals();
  console.log(JSON.stringify(result, null, 2));
  if (!result.ok) process.exitCode = 1;
}
