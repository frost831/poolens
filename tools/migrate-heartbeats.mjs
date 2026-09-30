import { pathToFileURL } from 'node:url';
import { d1Rows } from './run-field-intelligence-loop.mjs';

const DEFAULT_DATABASE = 'splashlens-subscribers';

function scalar(database, sql) {
  return Number(d1Rows(database, sql)[0]?.value || 0);
}

async function migrate(database = DEFAULT_DATABASE, execute = false) {
  d1Rows(database, `CREATE TABLE IF NOT EXISTS engagement_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event TEXT NOT NULL,
    source TEXT,
    path TEXT,
    mode TEXT,
    props TEXT,
    user_agent TEXT,
    referrer TEXT,
    country TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  const columns = new Set(d1Rows(database, 'PRAGMA table_info(engagement_events)').map((row) => row.name));
  if (!columns.has('legacy_event_id')) {
    if (!execute) {
      return {
        ok: true,
        dryRun: true,
        database,
        sourceHeartbeats: scalar(database, `SELECT COUNT(*) AS value FROM events WHERE event = 'session_heartbeat'`),
        destinationHeartbeats: scalar(database, `SELECT COUNT(*) AS value FROM engagement_events WHERE event = 'session_heartbeat'`),
        requiresLegacyIdColumn: true,
      };
    }
    d1Rows(database, 'ALTER TABLE engagement_events ADD COLUMN legacy_event_id INTEGER');
  }
  d1Rows(database, 'CREATE UNIQUE INDEX IF NOT EXISTS idx_engagement_events_legacy_event_id ON engagement_events(legacy_event_id)');

  const before = {
    source: scalar(database, `SELECT COUNT(*) AS value FROM events WHERE event = 'session_heartbeat'`),
    destination: scalar(database, `SELECT COUNT(*) AS value FROM engagement_events WHERE event = 'session_heartbeat'`),
  };
  if (!execute) return { ok: true, dryRun: true, database, before };

  d1Rows(database, `INSERT OR IGNORE INTO engagement_events
    (event, source, path, mode, props, user_agent, referrer, country, created_at, legacy_event_id)
    SELECT event, source, path, mode, props, user_agent, referrer, country, created_at, id
    FROM events WHERE event = 'session_heartbeat'`);

  const copied = scalar(database, `SELECT COUNT(*) AS value
    FROM events e JOIN engagement_events g ON g.legacy_event_id = e.id
    WHERE e.event = 'session_heartbeat' AND g.event = 'session_heartbeat'`);
  if (copied !== before.source) {
    throw new Error(`Heartbeat migration verification failed: copied ${copied} of ${before.source}; source rows were preserved.`);
  }

  d1Rows(database, `DELETE FROM events
    WHERE event = 'session_heartbeat'
      AND id IN (SELECT legacy_event_id FROM engagement_events WHERE legacy_event_id IS NOT NULL)`);

  const after = {
    source: scalar(database, `SELECT COUNT(*) AS value FROM events WHERE event = 'session_heartbeat'`),
    destination: scalar(database, `SELECT COUNT(*) AS value FROM engagement_events WHERE event = 'session_heartbeat'`),
  };
  if (after.source !== 0 || after.destination < before.destination + before.source) {
    throw new Error(`Heartbeat migration post-check failed: source=${after.source}, destination=${after.destination}.`);
  }
  return { ok: true, dryRun: false, database, before, copied, after };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const execute = process.argv.includes('--execute');
  const databaseIndex = process.argv.indexOf('--database');
  const database = databaseIndex >= 0 ? process.argv[databaseIndex + 1] : DEFAULT_DATABASE;
  migrate(database, execute)
    .then((result) => console.log(JSON.stringify(result, null, 2)))
    .catch((error) => {
      console.error(error instanceof Error ? error.stack || error.message : String(error));
      process.exitCode = 1;
    });
}

export { migrate };
