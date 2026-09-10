INSERT INTO commercial_entitlements (
  id,
  email,
  lane,
  plan,
  status,
  source,
  stripe_session_id,
  current_period_end,
  created_at,
  updated_at
)
SELECT
  'stripe:' || stripe_session_id,
  lower(subject),
  'pro',
  plan,
  'active',
  'd1_payment_backfill',
  stripe_session_id,
  datetime(created_at, '+365 days'),
  created_at,
  CURRENT_TIMESTAMP
FROM payment_events pe
WHERE lower(COALESCE(plan, '')) LIKE '%partsnap%'
  AND COALESCE(subject, '') <> ''
  AND COALESCE(stripe_session_id, '') <> ''
  AND NOT EXISTS (
    SELECT 1
    FROM commercial_entitlements ce
    WHERE ce.id = 'stripe:' || pe.stripe_session_id
       OR lower(ce.email) = lower(pe.subject)
  );

INSERT INTO audit_records (
  id,
  actor_email,
  action,
  target_type,
  target_id,
  payload
)
SELECT
  'audit_' || lower(hex(randomblob(16))),
  lower(subject),
  'partsnap_pro_entitlement_backfilled',
  'commercial_entitlement',
  'stripe:' || stripe_session_id,
  json_object('source', 'payment_events', 'plan', plan, 'stripe_session_id', stripe_session_id)
FROM payment_events pe
WHERE lower(COALESCE(plan, '')) LIKE '%partsnap%'
  AND COALESCE(subject, '') <> ''
  AND COALESCE(stripe_session_id, '') <> ''
  AND EXISTS (
    SELECT 1
    FROM commercial_entitlements ce
    WHERE ce.id = 'stripe:' || pe.stripe_session_id
  )
  AND NOT EXISTS (
    SELECT 1
    FROM audit_records ar
    WHERE ar.action = 'partsnap_pro_entitlement_backfilled'
      AND ar.target_id = 'stripe:' || pe.stripe_session_id
  );
