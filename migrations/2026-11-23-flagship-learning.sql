-- Additive pilot storage. No photos, account emails, addresses, or customer IDs.
CREATE TABLE IF NOT EXISTS learning_cases (
  id TEXT PRIMARY KEY,
  product TEXT NOT NULL,
  receipt_id TEXT NOT NULL,
  owner_hash TEXT NOT NULL,
  group_key TEXT NOT NULL,
  split TEXT NOT NULL CHECK(split IN ('learn','holdout')),
  observation TEXT NOT NULL,
  baseline TEXT NOT NULL,
  outcome TEXT NOT NULL,
  note TEXT NOT NULL DEFAULT '',
  reported_label TEXT NOT NULL DEFAULT '',
  traffic_class TEXT NOT NULL,
  consent_version TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','verified','rejected')),
  expected_label TEXT,
  evidence_url TEXT,
  evidence_kind TEXT,
  reviewed_at TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  UNIQUE(product, receipt_id)
);
CREATE INDEX IF NOT EXISTS learning_review_queue ON learning_cases(product,status,created_at);
CREATE INDEX IF NOT EXISTS learning_owner ON learning_cases(product,owner_hash,created_at);
CREATE TABLE IF NOT EXISTS learning_versions (
  id TEXT PRIMARY KEY,
  product TEXT NOT NULL,
  knowledge TEXT NOT NULL,
  report TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'candidate' CHECK(status IN ('candidate','active','retired')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE UNIQUE INDEX IF NOT EXISTS learning_one_active ON learning_versions(product) WHERE status='active';
CREATE TABLE IF NOT EXISTS learning_audit (
  id TEXT PRIMARY KEY,
  product TEXT NOT NULL,
  action TEXT NOT NULL,
  subject_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
