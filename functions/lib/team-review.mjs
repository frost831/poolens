import { cleanText, normalizeEmail } from './splashlens-account-auth.mjs';

export const REVIEW_TRANSITIONS = Object.freeze({
  draft: new Set(['submitted']),
  evidence_requested: new Set(['submitted']),
  submitted: new Set(['evidence_requested', 'approved', 'rejected']),
  approved: new Set(),
  rejected: new Set(),
});

export function canTransitionReview(from, to) {
  return Boolean(REVIEW_TRANSITIONS[String(from || '').toLowerCase()]?.has(String(to || '').toLowerCase()));
}

export function sanitizeReviewInput(input = {}) {
  const payloadSource = input.payload && typeof input.payload === 'object' && !Array.isArray(input.payload) ? input.payload : {};
  const payload = Object.fromEntries(
    Object.entries(payloadSource)
      .slice(0, 30)
      .map(([key, value]) => [cleanText(key, 80), cleanText(typeof value === 'object' ? JSON.stringify(value) : value, 500)])
      .filter(([key, value]) => key && value),
  );
  return {
    teamId: cleanText(input.teamId || input.team_id, 140),
    title: cleanText(input.title || 'Field proof review', 180),
    summary: cleanText(input.summary || input.note || '', 2400),
    proofPacketId: cleanText(input.proofPacketId || input.proof_packet_id, 140),
    assigneeEmail: normalizeEmail(input.assigneeEmail || input.assignee_email),
    comment: cleanText(input.comment || input.reason || '', 1500),
    payload,
  };
}

export function reviewRequiresComment(status) {
  return ['evidence_requested', 'rejected'].includes(String(status || '').toLowerCase());
}
