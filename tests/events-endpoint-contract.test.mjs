import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const eventsEndpoint = readFileSync(new URL('../functions/api/events.js', import.meta.url), 'utf8');
const amplitudeConfig = readFileSync(new URL('../functions/api/amplitude-config.js', import.meta.url), 'utf8');
const amplitudeShared = readFileSync(new URL('../functions/_shared/amplitude.mjs', import.meta.url), 'utf8');
const statsEndpoint = readFileSync(new URL('../functions/api/stats.js', import.meta.url), 'utf8');
const freeProfileEndpoint = readFileSync(new URL('../functions/api/free-profile.js', import.meta.url), 'utf8');
const accountEndpoint = readFileSync(new URL('../functions/api/account.js', import.meta.url), 'utf8');
const teamEndpoint = readFileSync(new URL('../functions/api/team.js', import.meta.url), 'utf8');
const commercialEndpoint = readFileSync(new URL('../functions/api/commercial.js', import.meta.url), 'utf8');
const stripeWebhookEndpoint = readFileSync(new URL('../functions/api/stripe-webhook.js', import.meta.url), 'utf8');
const wrangler = readFileSync(new URL('../wrangler.toml', import.meta.url), 'utf8');

test('events endpoint accepts app analytics payload shapes', () => {
  assert.match(eventsEndpoint, /body\.event \|\| body\.name/);
  assert.match(eventsEndpoint, /plainObject\(body\.props\)/);
  assert.match(eventsEndpoint, /plainObject\(body\.properties\)/);
  assert.match(eventsEndpoint, /Event name required/);
});

test('events endpoint stores to D1 when the binding exists', () => {
  assert.match(eventsEndpoint, /SUBSCRIBERS_DB/);
  assert.match(eventsEndpoint, /CREATE TABLE IF NOT EXISTS events/);
  assert.match(eventsEndpoint, /INSERT INTO events/);
  assert.match(eventsEndpoint, /stored: true/);
});

test('app API routes expose protected stats and server-side amplitude config as JSON', () => {
  assert.match(amplitudeConfig, /amplitudeConfigPayload/);
  assert.match(amplitudeShared, /product: 'app'/);
  assert.match(statsEndpoint, /export async function onRequestGet/);
  assert.match(statsEndpoint, /Unauthorized/);
  assert.match(statsEndpoint, /EXTERNAL_EVENT_FILTER/);
  assert.match(statsEndpoint, /amplitude_readiness_smoke/);
  assert.match(statsEndpoint, /release_gate_live_custom_domain/);
  assert.match(statsEndpoint, /headless/);
  assert.match(statsEndpoint, /suspectNonSplashLensPaymentRows/);
});

test('events endpoint normalizes identity and suppresses internal heartbeat noise', () => {
  assert.match(eventsEndpoint, /normalizeIdentityProps/);
  assert.match(eventsEndpoint, /known_email/);
  assert.match(eventsEndpoint, /known_company/);
  assert.match(eventsEndpoint, /identity_confidence/);
  assert.match(eventsEndpoint, /internal_heartbeat_noise/);
  assert.match(eventsEndpoint, /forwardEventToAmplitude/);
});

test('free scanner profile endpoint verifies durable identity before AI usage', () => {
  assert.match(freeProfileEndpoint, /CREATE TABLE IF NOT EXISTS free_profiles/);
  assert.match(freeProfileEndpoint, /CREATE TABLE IF NOT EXISTS free_profile_verifications/);
  assert.match(freeProfileEndpoint, /email TEXT PRIMARY KEY/);
  assert.match(freeProfileEndpoint, /Valid email required for free scanner profile/);
  assert.match(freeProfileEndpoint, /SENDGRID_API_KEY/);
  assert.match(freeProfileEndpoint, /Your SplashLens free scanner code/);
  assert.match(freeProfileEndpoint, /free_scan_profile_code_sent/);
  assert.match(freeProfileEndpoint, /free_scan_profile_verified/);
  assert.match(freeProfileEndpoint, /profileToken/);
  assert.match(freeProfileEndpoint, /accountToken/);
  assert.match(freeProfileEndpoint, /sl_account_v1/);
  assert.match(freeProfileEndpoint, /user_accounts/);
  assert.match(freeProfileEndpoint, /sl_profile_v1/);
  assert.match(freeProfileEndpoint, /verified_at/);
  assert.match(freeProfileEndpoint, /SUBSCRIBERS_DB/);
  assert.match(freeProfileEndpoint, /ON CONFLICT\(email\) DO UPDATE/);
});

test('account endpoint requires a signed passwordless account token', () => {
  assert.match(accountEndpoint, /GET \/api\/account/);
  assert.match(accountEndpoint, /const ACCOUNT_TOKEN_PREFIX = 'sl_account_v1'/);
  assert.match(accountEndpoint, /X-SplashLens-Account-Token/);
  assert.match(accountEndpoint, /scopeAllowed\(payload\.scopes, 'account'\)/);
  assert.match(accountEndpoint, /user_accounts/);
  assert.match(accountEndpoint, /freeScanUsage/);
  assert.match(accountEndpoint, /recentEvents/);
});

test('team endpoint supports protected team workspaces and member invites', () => {
  assert.match(teamEndpoint, /\/api\/team/);
  assert.match(teamEndpoint, /const ACCOUNT_TOKEN_PREFIX = 'sl_account_v1'/);
  assert.match(teamEndpoint, /X-SplashLens-Account-Token/);
  assert.match(teamEndpoint, /CREATE TABLE IF NOT EXISTS teams/);
  assert.match(teamEndpoint, /CREATE TABLE IF NOT EXISTS team_members/);
  assert.match(teamEndpoint, /CREATE TABLE IF NOT EXISTS team_invites/);
  assert.match(teamEndpoint, /team_workspace_created/);
  assert.match(teamEndpoint, /team_workspace_archived/);
  assert.match(teamEndpoint, /team_member_invited/);
  assert.match(teamEndpoint, /team_member_joined/);
  assert.match(teamEndpoint, /SENDGRID_API_KEY/);
  assert.match(teamEndpoint, /Only team owners or admins can invite members/);
  assert.match(teamEndpoint, /already an active team member/);
  assert.match(teamEndpoint, /Only the team owner can archive this workspace/);
});

test('commercial endpoint exposes protected paid lanes, proof records, and partner intake', () => {
  assert.match(commercialEndpoint, /\/api\/commercial/);
  assert.match(commercialEndpoint, /const ACCOUNT_TOKEN_PREFIX = 'sl_account_v1'/);
  assert.match(commercialEndpoint, /X-SplashLens-Account-Token/);
  assert.match(commercialEndpoint, /PLAN_CATALOG/);
  assert.match(commercialEndpoint, /Splash Lens Pro/);
  assert.match(commercialEndpoint, /Team Workspaces/);
  assert.match(commercialEndpoint, /Facility \/ CPO Mode/);
  assert.match(commercialEndpoint, /Verified Manufacturer Cards/);
  assert.match(commercialEndpoint, /Distributor \/ Counter Mode/);
  assert.match(commercialEndpoint, /Field Learning OS/);
  assert.match(commercialEndpoint, /CREATE TABLE IF NOT EXISTS commercial_entitlements/);
  assert.match(commercialEndpoint, /CREATE TABLE IF NOT EXISTS commercial_intake/);
  assert.match(commercialEndpoint, /CREATE TABLE IF NOT EXISTS service_proof_records/);
  assert.match(commercialEndpoint, /CREATE TABLE IF NOT EXISTS partner_card_requests/);
  assert.match(commercialEndpoint, /CREATE TABLE IF NOT EXISTS audit_records/);
  assert.match(commercialEndpoint, /commercial_access_requested/);
  assert.match(commercialEndpoint, /service_proof_record_saved_server/);
  assert.match(commercialEndpoint, /partner_verified_card_requested/);
  assert.match(commercialEndpoint, /commercial_rate:/);
});

test('stripe webhook only activates SplashLens entitlements with explicit product proof', () => {
  assert.match(stripeWebhookEndpoint, /commercial_entitlements/);
  assert.match(stripeWebhookEndpoint, /stripe_entitlement_activated/);
  assert.match(stripeWebhookEndpoint, /allowedLinks\.includes\(paymentLink\)/);
  assert.match(stripeWebhookEndpoint, /product === 'splashlens'/);
  assert.match(stripeWebhookEndpoint, /!product && feature === 'scanner'/);
  assert.doesNotMatch(stripeWebhookEndpoint, /product !== 'cora'/);
});

test('app wrangler config declares the shared SplashLens events database binding', () => {
  assert.match(wrangler, /\[\[d1_databases\]\]/);
  assert.match(wrangler, /binding = "SUBSCRIBERS_DB"/);
  assert.match(wrangler, /database_name = "splashlens-subscribers"/);
  assert.match(wrangler, /database_id = "f474defb-4337-42ec-b143-7b37fc949761"/);
});
