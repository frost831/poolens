CREATE TABLE IF NOT EXISTS library_misses (
  id TEXT PRIMARY KEY,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "trigger" TEXT NOT NULL CHECK ("trigger" IN ('code_no_hit', 'partsnap_low', 'partsnap_no_match', 'manual_fallback')),
  brand TEXT NOT NULL DEFAULT '',
  model TEXT NOT NULL DEFAULT '',
  query TEXT NOT NULL DEFAULT '',
  photo_ref TEXT,
  client_hash TEXT NOT NULL,
  traffic_class TEXT NOT NULL CHECK (traffic_class IN ('real', 'qa', 'bot', 'server')),
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'reviewing', 'resolved', 'dismissed'))
);

CREATE INDEX IF NOT EXISTS idx_library_misses_client_time ON library_misses (client_hash, created_at);
CREATE INDEX IF NOT EXISTS idx_library_misses_time_query ON library_misses (created_at, query, status);
