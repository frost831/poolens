function text(value) {
  return String(value || '').trim();
}

export function refundedEntitlementDecision(charge = {}, entitlement = null) {
  if (!charge.refunded || Number(charge.amount_refunded || 0) < Number(charge.amount || 0)) {
    return { action: 'ignored_partial_or_incomplete_refund', shouldRevoke: false };
  }
  const subject = text(
    charge.billing_details?.email || charge.receipt_email || charge.metadata?.customer_email,
  ).toLowerCase();
  const paymentIntentId = text(charge.payment_intent);
  if (!subject || !paymentIntentId) {
    return { action: 'refund_missing_entitlement_identity', shouldRevoke: false, subject, paymentIntentId };
  }
  const entitlementPaymentIntentId = text(entitlement?.stripePaymentIntentId);
  if (!entitlement || !entitlementPaymentIntentId || entitlementPaymentIntentId !== paymentIntentId) {
    return {
      action: 'refund_did_not_match_current_entitlement',
      shouldRevoke: false,
      subject,
      paymentIntentId,
    };
  }
  return {
    action: 'entitlement_revoked_after_full_refund',
    shouldRevoke: true,
    subject,
    paymentIntentId,
  };
}
