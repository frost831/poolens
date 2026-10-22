// Stripe subscription versions expose the billing period on either the
// subscription itself or its item. Invoice events expose the line period.
export function stripePeriodEnd(object) {
  const value = Number(object?.current_period_end
    || object?.items?.data?.[0]?.current_period_end
    || object?.lines?.data?.[0]?.period?.end || 0);
  return Number.isFinite(value) && value > 0 ? value : 0;
}
