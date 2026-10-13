export const CREW_PLAN_KEY = 'crew_monthly';
export const CREW_LABEL = 'SplashLens Crew';
export const CREW_AMOUNT_CENTS = 3900;
export const CREW_SEAT_LIMIT = 4;

export function crewPriceId(env) {
  return String(env?.SPLASHLENS_STRIPE_PRICE_CREW_MONTHLY || '').trim();
}

export function isCrewCheckout(session) {
  return session?.metadata?.product === 'splashlens'
    && session?.metadata?.plan_key === CREW_PLAN_KEY
    && session?.metadata?.plan === CREW_LABEL;
}

function subscriptionPrice(subscription) {
  const price = subscription?.items?.data?.[0]?.price;
  if (!price) return null;
  return typeof price === 'string' ? { id: price } : price;
}

export function crewSubscriptionMatches(subscription, env) {
  const price = subscriptionPrice(subscription);
  const expected = crewPriceId(env);
  if (!price || !/^price_[A-Za-z0-9]+$/.test(expected) || price.id !== expected) return false;
  if (price.unit_amount != null && Number(price.unit_amount) !== CREW_AMOUNT_CENTS) return false;
  if (price.currency && price.currency !== 'usd') return false;
  if (price.recurring && (price.recurring.interval !== 'month' || Number(price.recurring.interval_count || 1) !== 1)) return false;
  return ['active', 'trialing'].includes(String(subscription?.status || ''));
}

async function ensureCrewTables(db) {
  await db.prepare(`CREATE TABLE IF NOT EXISTS teams (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, owner_email TEXT NOT NULL,
    status TEXT DEFAULT 'active', created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`).run();
  await db.prepare(`CREATE TABLE IF NOT EXISTS team_members (
    team_id TEXT NOT NULL, email TEXT NOT NULL, role TEXT DEFAULT 'member',
    status TEXT DEFAULT 'active', joined_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (team_id, email)
  )`).run();
  await db.prepare(`CREATE TABLE IF NOT EXISTS team_billing (
    team_id TEXT PRIMARY KEY, plan TEXT DEFAULT 'pilot', status TEXT DEFAULT 'pilot',
    seat_limit INTEGER DEFAULT 3, billing_email TEXT, stripe_customer_id TEXT,
    current_period_end DATETIME, created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`).run();
}

export async function ensureCrewBilling(db, { email, customerId, periodEnd, status }) {
  if (!db || typeof db.prepare !== 'function') return { ok: false };
  const lead = String(email || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead)) return { ok: false };
  const billingStatus = ['active', 'trialing', 'canceled', 'past_due', 'paused'].includes(status) ? status : 'active';
  try {
    await ensureCrewTables(db);
    const existing = await db.prepare(
      `SELECT id FROM teams WHERE lower(owner_email) = lower(?) AND status = 'active' ORDER BY created_at DESC LIMIT 1`,
    ).bind(lead).first();
    let teamId = existing?.id;
    if (!teamId) {
      teamId = `team_${crypto.randomUUID()}`;
      await db.prepare('INSERT INTO teams (id, name, owner_email) VALUES (?, ?, ?)').bind(teamId, 'SplashLens Crew', lead).run();
      await db.prepare(
        `INSERT INTO team_members (team_id, email, role, status, joined_at)
         VALUES (?, ?, 'owner', 'active', CURRENT_TIMESTAMP)`,
      ).bind(teamId, lead).run();
    }
    await db.prepare(
      `INSERT INTO team_billing (team_id, plan, status, seat_limit, billing_email, stripe_customer_id, current_period_end)
       VALUES (?, 'crew', ?, ?, ?, ?, ?)
       ON CONFLICT(team_id) DO UPDATE SET
         plan = 'crew',
         status = excluded.status,
         seat_limit = ?,
         billing_email = excluded.billing_email,
         stripe_customer_id = COALESCE(excluded.stripe_customer_id, team_billing.stripe_customer_id),
         current_period_end = COALESCE(excluded.current_period_end, team_billing.current_period_end),
         updated_at = CURRENT_TIMESTAMP`,
    ).bind(teamId, billingStatus, CREW_SEAT_LIMIT, lead, customerId || null, periodEnd || null, CREW_SEAT_LIMIT).run();
    return { ok: true, teamId, seatLimit: CREW_SEAT_LIMIT };
  } catch (error) {
    console.error('SplashLens Crew billing update failed', error);
    return { ok: false };
  }
}

export async function syncCrewBillingStatus(db, customerId, status, periodEnd) {
  if (!db || typeof db.prepare !== 'function' || !customerId) return;
  const next = ['active', 'trialing', 'canceled', 'past_due', 'paused', 'refunded', 'disputed'].includes(status) ? status : '';
  if (!next) return;
  try {
    await db.prepare(
      `UPDATE team_billing
       SET status = ?, current_period_end = COALESCE(?, current_period_end), updated_at = CURRENT_TIMESTAMP
       WHERE stripe_customer_id = ? AND plan = 'crew'`,
    ).bind(next, periodEnd || null, customerId).run();
  } catch {
    // Crew billing is created on the first paid Crew checkout.
  }
}
