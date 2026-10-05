import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import {
  createOpaqueShareId,
  proofPacketHtmlHeaders,
  renderProofPacketHtml,
  sanitizeProofPacket,
  serializeProofPacket,
  validShareId,
} from '../functions/lib/proof-packets.mjs';
import { verifySplashLensAccount } from '../functions/lib/splashlens-account-auth.mjs';
import { canTransitionReview, reviewRequiresComment, sanitizeReviewInput } from '../functions/lib/team-review.mjs';

const proofApi = fs.readFileSync(new URL('../functions/api/proof-packets.js', import.meta.url), 'utf8');
const proofShareApi = fs.readFileSync(new URL('../functions/api/proof-packets/[shareId].js', import.meta.url), 'utf8');
const reviewApi = fs.readFileSync(new URL('../functions/api/team-review.js', import.meta.url), 'utf8');
const migration = fs.readFileSync(new URL('../migrations/2026-10-02-proof-packets-team-review.sql', import.meta.url), 'utf8');

function base64Url(value) {
  return Buffer.from(value).toString('base64url');
}

async function accountToken(secret, payload) {
  const encoded = base64Url(JSON.stringify(payload));
  const signed = `sl_account_v1.${encoded}`;
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = Buffer.from(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signed))).toString('base64url');
  return `${signed}.${signature}`;
}

test('proof packet IDs are opaque, fixed length, and URL safe', () => {
  const first = createOpaqueShareId();
  const second = createOpaqueShareId();
  assert.equal(validShareId(first), true);
  assert.equal(first.length, 32);
  assert.notEqual(first, second);
  assert.doesNotMatch(first, /[+/=]/);
});

test('proof payload is whitelisted and bounded before persistence', () => {
  const packet = sanitizeProofPacket({
    title: '  Pump Visit  ',
    customerLabel: 'Customer A',
    summary: 'x'.repeat(5000),
    equipment: Object.fromEntries(Array.from({ length: 40 }, (_, index) => [`key${index}`, 'value'])),
    evidence: Array.from({ length: 40 }, (_, index) => `photo ${index}`),
    ownerEmail: 'private@example.com',
    internalToken: 'never-store-this',
  });
  assert.equal(packet.title, 'Pump Visit');
  assert.equal(packet.summary.length, 2400);
  assert.equal(Object.keys(packet.equipment).length, 20);
  assert.equal(packet.evidence.length, 20);
  assert.equal('ownerEmail' in packet, false);
  assert.equal('internalToken' in packet, false);
  const serialized = serializeProofPacket(packet).serialized;
  assert.ok(Buffer.byteLength(serialized) <= 32 * 1024);
});

test('nested Service Passport survives serialization and public rendering', () => {
  const input = {
    customer: 'Jane Private',
    address: '123 Private Lane',
    tech: 'Technician Private',
    visitType: 'Equipment repair',
    date: '2026-10-05',
    readings: { source: 'spintouch-edited', fc: '3.2', ph: '7.4' },
    proof: {
      complete: true,
      missing: [],
      photoProof: 'pump-label.jpg',
      issueNote: 'Seal leak confirmed on inspection',
      customerSummary: 'Pump seal inspected and documented.',
    },
    equipmentNotes: 'Model plate verified',
    workPerformed: 'Inspected seal and photographed label',
    recommendations: 'Schedule seal replacement',
    callbackRisk: { level: 'medium', flags: ['Repeat pump issue'] },
  };
  const { packet, serialized } = serializeProofPacket({ packet: input });
  assert.equal(packet.summary, input.proof.customerSummary);
  assert.deepEqual(packet.evidence, ['pump-label.jpg']);
  assert.deepEqual(packet.workPerformed, [input.workPerformed]);
  assert.deepEqual(packet.recommendations, [input.recommendations]);
  assert.deepEqual(packet.warnings, ['Repeat pump issue']);
  assert.equal(packet.riskLevel, 'medium');
  assert.equal(packet.proofStatus, 'complete');
  assert.equal(packet.sourceProof['Reading source'], 'spintouch-edited');
  assert.equal(packet.sourceProof['Proof checklist'], 'Complete');
  assert.equal(packet.sourceProof['Issue note'], input.proof.issueNote);
  assert.equal(packet.equipment.Notes, 'Model plate verified');
  assert.equal(packet.readings.fc, '3.2');
  const html = renderProofPacketHtml(JSON.parse(serialized));
  for (const visible of ['Pump seal inspected', 'pump-label.jpg', 'Inspected seal', 'Schedule seal', 'Repeat pump issue', 'spintouch-edited', 'Callback risk: medium', 'Proof: complete']) {
    assert.match(html, new RegExp(visible));
  }
  for (const privateValue of [input.customer, input.address, input.tech]) {
    assert.doesNotMatch(serialized, new RegExp(privateValue));
    assert.doesNotMatch(html, new RegExp(privateValue));
  }
});

test('legacy public labels and unknown nested customer fields are never rendered', () => {
  const packet = sanitizeProofPacket({
    title: 'Visit',
    customerLabel: 'Private Customer',
    customer: 'Private Customer',
    address: 'Private Address',
    equipment: { model: 'Pump X', customerPhone: '555-123-4567' },
    readings: { fc: '3.0', customerEmail: 'private@example.com', techName: 'Private Tech' },
    sourceProof: { 'Reading source': 'manual', 'Customer address': 'Private Address' },
    proof: { customerName: 'Nested Private Customer', customerSummary: 'Visit complete' },
  });
  const html = renderProofPacketHtml(packet);
  assert.doesNotMatch(JSON.stringify(packet), /Private Customer|Private Address|Nested Private Customer|Private Tech|555-123-4567|private@example\.com/);
  assert.doesNotMatch(html, /Private Customer|Private Address|Nested Private Customer|Private Tech|555-123-4567|private@example\.com/);
  assert.match(html, /Visit complete/);
  assert.match(html, /Pump X/);
});

test('public proof renderer escapes content and emits locked-down headers', () => {
  const html = renderProofPacketHtml({
    title: '<script>alert(1)</script>',
    summary: '<img src=x onerror=alert(1)>',
    ownerEmail: 'private@example.com',
    evidence: ['Visible label'],
  }, { expiresAt: '2026-10-09T12:00:00.000Z' });
  assert.doesNotMatch(html, /<script>alert/);
  assert.doesNotMatch(html, /<img src=x/);
  assert.doesNotMatch(html, /private@example\.com/);
  assert.match(html, /&lt;script&gt;/);
  assert.match(html, /Visible label/);
  const headers = proofPacketHtmlHeaders();
  assert.match(headers['Content-Security-Policy'], /default-src 'none'/);
  assert.equal(headers['Referrer-Policy'], 'no-referrer');
  assert.equal(headers['X-Frame-Options'], 'DENY');
});

test('shared account verifier accepts valid signed account tokens and rejects tampering', async () => {
  const secret = 's'.repeat(48);
  const issuedAt = Math.floor(Date.now() / 1000);
  const token = await accountToken(secret, {
    sub: 'Tech@Example.com',
    iat: issuedAt,
    exp: issuedAt + 600,
    scopes: ['account', 'free_scan'],
  });
  const request = new Request('https://app.splashlens.com/api/team-review', {
    headers: { 'X-SplashLens-Account-Token': token },
  });
  assert.deepEqual(await verifySplashLensAccount(request, { SPLASHLENS_PROFILE_SECRET: secret }), {
    ok: true,
    email: 'tech@example.com',
    payload: {
      sub: 'Tech@Example.com',
      iat: issuedAt,
      exp: JSON.parse(Buffer.from(token.split('.')[1], 'base64url')).exp,
      scopes: ['account', 'free_scan'],
    },
  });
  const tampered = new Request('https://app.splashlens.com/api/team-review', {
    headers: { 'X-SplashLens-Account-Token': `${token.slice(0, -1)}x` },
  });
  assert.equal((await verifySplashLensAccount(tampered, { SPLASHLENS_PROFILE_SECRET: secret })).ok, false);
});

test('shared account verifier rejects sessions older than one day', async () => {
  const secret = 's'.repeat(48);
  const now = Math.floor(Date.now() / 1000);
  const token = await accountToken(secret, {
    sub: 'tech@example.com',
    iat: now - (25 * 60 * 60),
    exp: now + 600,
    scopes: ['account'],
  });
  const request = new Request('https://app.splashlens.com/api/team-review', {
    headers: { 'X-SplashLens-Account-Token': token },
  });
  const result = await verifySplashLensAccount(request, { SPLASHLENS_PROFILE_SECRET: secret });
  assert.equal(result.ok, false);
  assert.equal(result.status, 401);
});

test('team review transitions enforce evidence and final decision boundaries', () => {
  assert.equal(canTransitionReview('draft', 'submitted'), true);
  assert.equal(canTransitionReview('submitted', 'evidence_requested'), true);
  assert.equal(canTransitionReview('evidence_requested', 'submitted'), true);
  assert.equal(canTransitionReview('submitted', 'approved'), true);
  assert.equal(canTransitionReview('submitted', 'rejected'), true);
  assert.equal(canTransitionReview('draft', 'approved'), false);
  assert.equal(canTransitionReview('approved', 'submitted'), false);
  assert.equal(reviewRequiresComment('evidence_requested'), true);
  assert.equal(reviewRequiresComment('rejected'), true);
  assert.equal(reviewRequiresComment('approved'), false);
});

test('team review payload normalization bounds assignee, comments, and metadata', () => {
  const data = sanitizeReviewInput({
    team_id: 'team_123',
    title: 'Review pump seal',
    assignee_email: 'TECH@EXAMPLE.COM',
    comment: 'x'.repeat(3000),
    payload: Object.fromEntries(Array.from({ length: 50 }, (_, index) => [`key${index}`, 'y'.repeat(800)])),
  });
  assert.equal(data.teamId, 'team_123');
  assert.equal(data.assigneeEmail, 'tech@example.com');
  assert.equal(data.comment.length, 1500);
  assert.equal(Object.keys(data.payload).length, 30);
  assert.ok(Object.values(data.payload).every((value) => value.length <= 500));
});

test('proof packet API stores server-side data and returns path-only share URLs', () => {
  assert.match(proofApi, /INSERT INTO proof_packets/);
  assert.match(proofApi, /shareUrl: `\$\{origin\}\/api\/proof-packets\/\$\{shareId\}`/);
  assert.doesNotMatch(proofApi, /\?p=|searchParams\.set\(['"]p['"]/);
  assert.match(proofApi, /action === 'revoke'/);
  assert.match(proofShareApi, /status === 'revoked'/);
  assert.match(proofShareApi, /status = 'expired'/);
  assert.match(proofShareApi, /renderProofPacketHtml/);
  assert.match(proofShareApi, /onRequestDelete/);
  assert.match(proofShareApi, /SUBSCRIBERS_DB\.batch/);
  assert.match(proofApi, /MAX_RETAINED_PROOF_PACKETS_PER_OWNER/);
  assert.match(proofApi, /SUM\(CASE WHEN created_at >= datetime\('now', '-1 hour'\) THEN 1 ELSE 0 END\)/);
  assert.match(proofApi, /SUBSCRIBERS_DB\.batch/);
});

test('team review API exposes protected queue roles, comments, decisions, and audit', () => {
  assert.match(reviewApi, /verifySplashLensAccount/);
  assert.match(reviewApi, /REVIEWER_ROLES = new Set\(\['owner', 'admin'\]\)/);
  for (const action of ['create', 'assign', 'comment', 'submit', 'request_evidence', 'approve', 'reject']) {
    assert.match(reviewApi, new RegExp(`action === '${action}'`));
  }
  assert.match(reviewApi, /action === 'list'/);
  assert.match(reviewApi, /action === 'detail'/);
  assert.match(reviewApi, /INSERT INTO team_review_comments/);
  assert.match(reviewApi, /INSERT INTO team_review_audit/);
  assert.match(reviewApi, /team_review_\$\{cleanText\(action/);
  assert.match(reviewApi, /INNER JOIN teams t ON t\.id = tm\.team_id AND t\.status = 'active'/);
  assert.match(reviewApi, /WHERE id = \? AND status = \?/);
  assert.match(reviewApi, /last_transition_id/);
  assert.match(reviewApi, /db\.batch\(statements\)/);
  assert.match(reviewApi, /function auditStatements/);
  assert.match(reviewApi, /await db\.batch\(\[/);
  assert.match(reviewApi, /Proof packet must be active and belong to this team/);
  assert.match(reviewApi, /temporarily rate limited/);
});

test('migration covers durable proof packets and complete team review schema', () => {
  for (const table of ['proof_packets', 'proof_packet_audit', 'team_review_items', 'team_review_comments', 'team_review_audit']) {
    assert.match(migration, new RegExp(`CREATE TABLE IF NOT EXISTS ${table}`));
  }
  assert.match(migration, /share_id TEXT NOT NULL UNIQUE/);
  assert.match(migration, /expires_at DATETIME NOT NULL/);
  assert.match(migration, /assignee_email TEXT/);
  assert.match(migration, /reviewer_email TEXT/);
  assert.match(migration, /proof_packet_id TEXT/);
  assert.match(migration, /FOREIGN KEY \(proof_packet_id\) REFERENCES proof_packets\(id\)/);
});
