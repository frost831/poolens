export async function onRequest({ request, env }) {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return new Response('Method Not Allowed', {
      status: 405,
      headers: { Allow: 'GET, HEAD' },
    });
  }

  const assetUrl = new URL(request.url);
  assetUrl.pathname = '/owner-dashboard.html';
  assetUrl.search = '';

  const assetResponse = await env.ASSETS.fetch(new Request(assetUrl, request));
  const headers = new Headers(assetResponse.headers);
  headers.set('Cache-Control', 'no-store');
  headers.set('Content-Type', 'text/html; charset=utf-8');

  return new Response(request.method === 'HEAD' ? null : assetResponse.body, {
    status: assetResponse.status,
    headers,
  });
}
