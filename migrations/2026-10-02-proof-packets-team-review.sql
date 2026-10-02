CREATE TABLE IF NOT EXISTS proof_packets (
  id TEXT PRIMARY KEY,
  share_id TEXT NOT NULL UNIQUE,
  owner_email TEXT NOT NULL,
  team_id TEXT,
  payload TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  expires_at DATETIME NOT NULL,
  revoked_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS proof_packet_audit (
  id TEXT PRIMARY KEY,
  proof_packet_id TEXT NOT NULL,
  actor_email TEXT NOT NULL,
  action TEXT NOT NULL,
  details TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_proof_packets_owner ON proof_packets(owner_email, created_at);
CREATE INDEX IF NOT EXISTS idx_proof_packets_team ON proof_packets(team_id, created_at);
CREATE INDEX IF NOT EXISTS idx_proof_packets_share ON proof_packets(share_id, status);

CREATE TABLE IF NOT EXISTS team_review_items (
  id TEXT PRIMARY KEY,
  team_id TEXT NOT NULL,
  created_by TEXT NOT NULL,
  assignee_email TEXT,
  reviewer_email TEXT,
  title TEXT NOT NULL,
  summary TEXT,
  proof_packet_id TEXT,
  payload TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  last_transition_id TEXT,
  submitted_at DATETIME,
  decided_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (proof_packet_id) REFERENCES proof_packets(id)
);

CREATE TABLE IF NOT EXISTS team_review_comments (
  id TEXT PRIMARY KEY,
  review_id TEXT NOT NULL,
  team_id TEXT NOT NULL,
  author_email TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'comment',
  body TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS team_review_audit (
  id TEXT PRIMARY KEY,
  review_id TEXT NOT NULL,
  team_id TEXT NOT NULL,
  actor_email TEXT NOT NULL,
  action TEXT NOT NULL,
  from_status TEXT,
  to_status TEXT,
  details TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_team_review_queue ON team_review_items(team_id, status, updated_at);
CREATE INDEX IF NOT EXISTS idx_team_review_assignee ON team_review_items(team_id, assignee_email, status);
CREATE INDEX IF NOT EXISTS idx_team_review_comments ON team_review_comments(review_id, created_at);
CREATE INDEX IF NOT EXISTS idx_team_review_audit ON team_review_audit(review_id, created_at);
