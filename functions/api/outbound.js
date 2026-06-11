// GET /api/outbound - safe outbound search redirect for PartSnap.
// Affiliate IDs/templates are optional. If unset, redirects use plain search URLs.

const STORES = {
  leslies: {
    label: "Leslie's",
    envTemplate: 'SPLASHLENS_AFFILIATE_LESLIES_URL_TEMPLATE',
    fallback: 'https://lesliespool.com/search?text={q}',
  },
  intheswim: {
    label: 'In The Swim',
    envTemplate: 'SPLASHLENS_AFFILIATE_INTHESWIM_URL_TEMPLATE',
    fallback: 'https://intheswim.com/search?q={q}',
  },
  poolsupplyworld: {
    label: 'Pool Supply World',
    envTemplate: 'SPLASHLENS_AFFILIATE_POOLSUPPLYWORLD_URL_TEMPLATE',
    fallback: 'https://www.google.com/search?q=site%3Apoolsupplyworld.com+{q}',
  },
  web: {
    label: 'Web',
    fallback: 'https://www.google.com/search?q={q}+pool+part',
  },
};

function headers() {
  return {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
  };
}

function cleanQuery(value) {
  return String(value || '')
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .replace(/[<>]/g, '')
    .trim()
    .slice(0, 120);
}

function buildUrl(template, q) {
  return template.replaceAll('{q}', encodeURIComponent(q));
}

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const storeKey = String(url.searchParams.get('store') || '').toLowerCase();
  const q = cleanQuery(url.searchParams.get('q'));
  const store = STORES[storeKey];

  if (!store || !q) {
    return new Response(JSON.stringify({ ok: false, error: 'Valid store and q are required' }), {
      status: 400,
      headers: headers(),
    });
  }

  const template = store.envTemplate ? String(env[store.envTemplate] || '').trim() : '';
  const target = buildUrl(template || store.fallback, q);

  return Response.redirect(target, 302);
}
