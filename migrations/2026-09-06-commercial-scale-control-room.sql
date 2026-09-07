CREATE TABLE IF NOT EXISTS commercial_entitlements (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  team_id TEXT,
  lane TEXT NOT NULL,
  plan TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  source TEXT,
  stripe_session_id TEXT,
  stripe_customer_id TEXT,
  current_period_end DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS commercial_intake (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT,
  company TEXT,
  role TEXT,
  lane TEXT NOT NULL,
  interest TEXT,
  notes TEXT,
  status TEXT DEFAULT 'new',
  source TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS service_proof_records (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  team_id TEXT,
  customer_label TEXT,
  workflow TEXT,
  summary TEXT,
  proof_status TEXT,
  risk_level TEXT,
  source TEXT,
  payload TEXT,
  status TEXT DEFAULT 'saved',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS partner_card_requests (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  company TEXT,
  lane TEXT,
  manufacturer TEXT,
  doc_url TEXT,
  proof_language TEXT,
  status TEXT DEFAULT 'new',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS partner_verified_cards (
  id TEXT PRIMARY KEY,
  request_id TEXT,
  company TEXT,
  lane TEXT,
  manufacturer TEXT,
  doc_url TEXT,
  proof_language TEXT,
  status TEXT DEFAULT 'draft',
  approved_by TEXT,
  approved_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS learning_modules (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  lane TEXT,
  audience TEXT,
  source_proof_id TEXT,
  body TEXT,
  quiz_json TEXT,
  status TEXT DEFAULT 'draft',
  created_by TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS team_billing (
  team_id TEXT PRIMARY KEY,
  plan TEXT DEFAULT 'pilot',
  status TEXT DEFAULT 'pilot',
  seat_limit INTEGER DEFAULT 3,
  billing_email TEXT,
  stripe_customer_id TEXT,
  current_period_end DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_records (
  id TEXT PRIMARY KEY,
  actor_email TEXT,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id TEXT,
  payload TEXT,
  user_agent TEXT,
  referrer TEXT,
  country TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
