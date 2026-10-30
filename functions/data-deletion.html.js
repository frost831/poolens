export async function onRequest({ request, env }) {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return new Response('Method Not Allowed', {
      status: 405,
      headers: { Allow: 'GET, HEAD' },
    });
  }

  const assetUrl = new URL(request.url);
  assetUrl.pathname = '/data-deletion';
  assetUrl.search = '';

  const assetResponse = await env.ASSETS.fetch(new Request(assetUrl));
  const html = await assetResponse.text();
  if (!assetResponse.ok || !html.includes('id="deletion-form"')) {
    return new Response('The deletion request page is temporarily unavailable.', {
      status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' },
    });
  }
  const headers = new Headers(assetResponse.headers);
  headers.delete('Content-Length');
  headers.delete('Content-Encoding');
  headers.set('Cache-Control', 'public, max-age=0, must-revalidate');
  headers.set('Content-Type', 'text/html; charset=utf-8');

  return new Response(request.method === 'HEAD' ? null : html, {
    status: 200,
    headers,
  });
}
