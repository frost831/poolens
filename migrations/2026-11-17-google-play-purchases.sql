-- Purchase tokens stay encrypted; the account key is a keyed HMAC of the
-- verified account, never a caller-supplied email or client identifier.
CREATE TABLE IF NOT EXISTS google_play_purchases (
  token_hash TEXT PRIMARY KEY NOT NULL,
  account_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  plan_key TEXT NOT NULL CHECK(plan_key IN ('monthly', 'yearly')),
  token_ciphertext TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS google_play_purchases_account ON google_play_purchases(account_id, expires_at DESC);
CREATE TABLE IF NOT EXISTS google_play_request_windows (
  account_id TEXT PRIMARY KEY NOT NULL,
  window_started INTEGER NOT NULL,
  attempts INTEGER NOT NULL CHECK(attempts BETWEEN 1 AND 20)
);
