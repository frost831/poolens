CREATE TABLE IF NOT EXISTS store_metric_imports (
  id TEXT PRIMARY KEY,
  platform TEXT NOT NULL,
  metric TEXT NOT NULL,
  value INTEGER NOT NULL DEFAULT 0,
  metric_date TEXT NOT NULL,
  source TEXT,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(platform, metric, metric_date, source)
);

CREATE INDEX IF NOT EXISTS idx_store_metric_imports_platform_date
  ON store_metric_imports(platform, metric_date);

CREATE INDEX IF NOT EXISTS idx_store_metric_imports_metric
  ON store_metric_imports(metric);
