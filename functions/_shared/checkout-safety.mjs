export function paidFulfillmentGaps(env = {}) {
  const gaps = [];
  if (String(env.SPLASHLENS_PAID_CHECKOUT_ENABLED || '').trim().toLowerCase() !== 'true') {
    gaps.push('SPLASHLENS_PAID_CHECKOUT_ENABLED');
  }
  const webhookSecret = String(env.STRIPE_WEBHOOK_SECRET || env.SPLASHLENS_STRIPE_WEBHOOK_SECRET || '').trim();
  if (!webhookSecret.startsWith('whsec_')) gaps.push('STRIPE_WEBHOOK_SECRET');
  if (!String(env.SPLASHLENS_ENTITLEMENT_SECRET || '').trim()) gaps.push('SPLASHLENS_ENTITLEMENT_SECRET');
  if (!env.SCAN_USAGE_KV) gaps.push('SCAN_USAGE_KV');
  if (!String(env.SENDGRID_API_KEY || '').trim()) gaps.push('SENDGRID_API_KEY');
  return gaps;
}

export function outboundStoreKey(url) {
  return String(url.searchParams.get('store') || url.searchParams.get('vendor') || '').toLowerCase();
}
