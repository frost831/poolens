function json(status, payload, extraHeaders = {}) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...extraHeaders },
  });
}

function clean(value, max = 240) {
  return String(value || '').replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, max);
}

function authOk(request, env) {
  const secret = String(
    env.SPLASHLENS_STATS_SECRET ||
    env.SPLASHLENS_ADMIN_SECRET ||
    env.SPLASHLENS_ENTITLEMENT_ADMIN_SECRET ||
    '',
  ).trim();
  if (!secret) return false;

  const auth = request.headers.get('Authorization') || '';
  const bearer = auth.replace(/^Bearer\s+/i, '').trim();
  const headerSecret = request.headers.get('X-SplashLens-Stats-Secret') || '';
  return bearer === secret || headerSecret === secret;
}

function parseResult(record) {
  try {
    return JSON.parse(record.resultJson || '{}');
  } catch {
    return {};
  }
}

function reviewStatus(record, result = {}) {
  const confidence = clean(result.confidence || '', 40).toLowerCase();
  const hasPartNumber = Boolean(clean(result.partNumber || result.part_number || '', 80));
  const missingProof = Array.isArray(result.missingProof) ? result.missingProof : [];
  if (confidence === 'high' && hasPartNumber && missingProof.length === 0) return 'proof-ready';
  if (confidence === 'low' || missingProof.length >= 3) return 'senior-review';
  if (record.email) return 'reply-possible';
  return 'needs-triage';
}

function packetFromRecord(record, result = {}) {
  const proof = Array.isArray(result.visibleEvidence) ? result.visibleEvidence.filter(Boolean).join('; ') : '';
  const missing = Array.isArray(result.missingProof) ? result.missingProof.filter(Boolean).join('; ') : '';
  return [
    'SplashLens senior tech / vendor packet',
    `Ticket: ${record.id || 'unknown'}`,
    `Submitter: ${record.email || 'not provided'}`,
    `Possible part: ${[result.manufacturer, result.component].filter(Boolean).join(' ') || 'unknown'}`,
    `Model/family: ${result.model || 'needs model proof'}`,
    `Possible number: ${result.partNumber || 'not visible'}`,
    `Confidence: ${result.confidence || 'unknown'}`,
    proof ? `Visible proof: ${proof}` : '',
    missing ? `Still needed: ${missing}` : '',
    record.note ? `Field note: ${record.note}` : '',
    record.escalation ? `Original packet: ${record.escalation}` : '',
    'Verify against current manufacturer documentation before ordering or repair.',
  ].filter(Boolean).join('\n');
}

export async function onRequestGet({ request, env }) {
  if (!authOk(request, env)) {
    return json(401, { ok: false, error: 'Unauthorized' });
  }
  if (!env.SCAN_USAGE_KV || typeof env.SCAN_USAGE_KV.list !== 'function') {
    return json(503, { ok: false, error: 'SCAN_USAGE_KV review storage is not configured' });
  }

  const url = new URL(request.url);
  const limit = Math.min(Math.max(Number(url.searchParams.get('limit') || 100), 10), 250);
  let cursor;
  const keyNames = [];

  do {
    const page = await env.SCAN_USAGE_KV.list({ prefix: 'partsnap-feedback:', cursor, limit: 1000 });
    for (const key of page.keys || []) keyNames.push(key.name);
    cursor = page.list_complete ? undefined : page.cursor;
  } while (cursor);

  const newestKeys = keyNames.sort((a, b) => b.localeCompare(a)).slice(0, limit);
  const tickets = [];

  for (const keyName of newestKeys) {
    const raw = await env.SCAN_USAGE_KV.get(keyName);
    if (!raw) continue;
    try {
      const record = JSON.parse(raw);
      const result = parseResult(record);
      const ticket = {
        id: clean(record.id, 80),
        createdAt: clean(record.createdAt, 40),
        email: clean(record.email, 180),
        note: clean(record.note, 1000),
        source: clean(record.source, 80),
        path: clean(record.path, 300),
        status: reviewStatus(record, result),
        confidence: clean(result.confidence || 'unknown', 40),
        manufacturer: clean(result.manufacturer, 100),
        component: clean(result.component, 140),
        model: clean(result.model, 140),
        partNumber: clean(result.partNumber, 140),
        missingProof: Array.isArray(result.missingProof) ? result.missingProof.filter(Boolean) : [],
        visibleEvidence: Array.isArray(result.visibleEvidence) ? result.visibleEvidence.filter(Boolean) : [],
        packet: packetFromRecord(record, result),
      };
      tickets.push(ticket);
    } catch {}
  }

  const counts = tickets.reduce((acc, ticket) => {
    acc[ticket.status] = (acc[ticket.status] || 0) + 1;
    return acc;
  }, {});

  return json(200, {
    ok: true,
    generatedAt: new Date().toISOString(),
    storedTickets: keyNames.length,
    counts,
    tickets,
    caveat: 'Review tickets are user-submitted PartSnap feedback. They are triage material, not verified manufacturer fitment.',
  });
}
