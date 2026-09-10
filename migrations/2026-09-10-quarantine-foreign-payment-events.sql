CREATE TABLE IF NOT EXISTS payment_event_quarantine (
  id INTEGER PRIMARY KEY,
  event_type TEXT NOT NULL,
  stripe_session_id TEXT,
  subject TEXT,
  plan TEXT,
  created_at TEXT,
  quarantined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  quarantine_reason TEXT NOT NULL
);

INSERT OR IGNORE INTO payment_event_quarantine (id, event_type, stripe_session_id, subject, plan, created_at, quarantine_reason)
SELECT id, event_type, stripe_session_id, subject, plan, created_at, 'non_splashlens_plan'
FROM payment_events
WHERE COALESCE(plan, '') NOT LIKE '%PartSnap%'
  AND COALESCE(plan, '') NOT LIKE '%SplashLens%'
  AND COALESCE(plan, '') NOT LIKE '%Splash Lens%';

DELETE FROM payment_events
WHERE id IN (
  SELECT id
  FROM payment_event_quarantine
  WHERE quarantine_reason = 'non_splashlens_plan'
);
