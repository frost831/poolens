import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const app = fs.readFileSync(new URL('../js/app.js', import.meta.url), 'utf8');
const data = fs.readFileSync(new URL('../js/data.js', import.meta.url), 'utf8');
const shell = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const scan = fs.readFileSync(new URL('../functions/api/scan.js', import.meta.url), 'utf8');
const checkout = fs.readFileSync(new URL('../functions/api/checkout.js', import.meta.url), 'utf8');
const account = fs.readFileSync(new URL('../functions/api/account.js', import.meta.url), 'utf8');
const team = fs.readFileSync(new URL('../functions/api/team.js', import.meta.url), 'utf8');
const commercial = fs.readFileSync(new URL('../functions/api/commercial.js', import.meta.url), 'utf8');
const sw = fs.readFileSync(new URL('../sw.js', import.meta.url), 'utf8');

test('first open goes straight to field workflow instead of forcing persona picker', () => {
  assert.match(app, /field_home_opened_without_role_gate/);
  assert.doesNotMatch(app, /showRolePicker\(\);\s*\}/);
  assert.doesNotMatch(shell, /setSplashLensRole\('homeowner'/);
});

test('free scan allowance is three in browser and server code', () => {
  assert.match(app, /const SCAN_LIMIT_FREE = 3;/);
  assert.match(scan, /const FREE_SCAN_LIMIT = 3;/);
  assert.match(app, /A free field profile includes 3 AI scans each month/);
  assert.match(app, /ensureFreeScanProfile\(aiMode, result, status\)/);
  assert.match(scan, /Create a free SplashLens profile before using AI scans/);
  assert.match(scan, /Verify your free SplashLens profile email before using AI scans/);
  assert.match(scan, /verificationRequired: true/);
  assert.match(scan, /`free_profile:\$\{freeProfileEmail\}`/);
  assert.match(scan, /free_profile_scan_used/);
  assert.match(scan, /refundUsageQuota/);
  assert.match(scan, /publicUsage\(meter\.usage\)/);
});

test('pricing catalog uses the simplified North Star plan ladder', () => {
  assert.match(data, /Free to Start/);
  assert.match(data, /Free Field Profile/);
  assert.match(data, /Splash Lens Pro Unlimited/);
  assert.match(data, /\$29\/mo or \$249\/yr target/);
  assert.match(data, /Teams/);
  assert.doesNotMatch(data, /Saved Job Pro/);
  assert.doesNotMatch(data, /Free, No Account/);
  assert.doesNotMatch(data, /\$4\.99\/mo or \$39\/yr/);
});

test('saving job history requires a free save profile signal', () => {
  assert.match(app, /const FIELD_SAVE_ACCOUNT_KEY = 'splashlens-free-save-profile-v1'/);
  assert.match(app, /const FREE_PROFILE_TOKEN_KEY = 'splashlens-free-profile-token-v1'/);
  assert.match(app, /const ACCOUNT_TOKEN_KEY = 'splashlens-account-token-v1'/);
  assert.match(app, /const SPLASHLENS_ACCOUNT_ENDPOINT = '\/api\/account'/);
  assert.match(app, /const SPLASHLENS_TEAM_ENDPOINT = '\/api\/team'/);
  assert.match(app, /function ensureFieldSaveAccount/);
  assert.match(app, /const SPLASHLENS_FREE_PROFILE_ENDPOINT = '\/api\/free-profile'/);
  assert.match(app, /requestFreeProfileCode/);
  assert.match(app, /verifyFreeProfileCode/);
  assert.match(app, /X-SplashLens-Profile-Token/);
  assert.match(app, /X-SplashLens-Account-Token/);
  assert.match(app, /captureAccountSessionFromUrl/);
  assert.match(app, /openSplashLensAccount/);
  assert.match(app, /createSplashLensTeamWorkspace/);
  assert.match(app, /inviteSplashLensTeamMember/);
  assert.match(app, /acceptSplashLensTeamInvite/);
  assert.match(app, /Team workspace/);
  assert.match(app, /free_profile_token: freeProfileToken/);
  assert.match(app, /account_token: accountToken/);
  assert.match(scan, /const PROFILE_TOKEN_PREFIX = 'sl_profile_v1'/);
  assert.match(scan, /const ACCOUNT_TOKEN_PREFIX = 'sl_account_v1'/);
  assert.match(account, /const ACCOUNT_TOKEN_PREFIX = 'sl_account_v1'/);
  assert.match(team, /const ACCOUNT_TOKEN_PREFIX = 'sl_account_v1'/);
  assert.match(team, /CREATE TABLE IF NOT EXISTS team_members/);
  assert.match(app, /free_save_profile_created/);
  assert.match(app, /free_save_profile_server_synced/);
  assert.match(app, /ensureFieldSaveAccount\('service_report_saved'\)/);
  assert.match(app, /ensureFieldSaveAccount\('partsnap_field_stop_saved'\)/);
  assert.match(app, /ensureFieldSaveAccount\('partsnap_saved_to_pool'\)/);
});

test('service worker cache version ships the newest account bundle', () => {
  assert.match(shell, /app\.js\?v=20260930-ios-safe-gate/);
  assert.match(sw, /splashlens-v14-ios-safe-gate/);
  assert.match(sw, /app\.js\?v=20260930-ios-safe-gate/);
});

test('checkout exposes a JSON catalog and Splash Lens Pro Unlimited metadata', () => {
  assert.match(checkout, /url\.searchParams\.has\('catalog'\)/);
  assert.match(checkout, /Splash Lens Pro Unlimited Monthly/);
  assert.match(checkout, /Splash Lens Pro Unlimited Annual/);
  assert.match(checkout, /SPLASHLENS_STRIPE_PRICE_\$\{key\}_PRO/);
  assert.match(checkout, /SPLASHLENS_STRIPE_LINK_MONTHLY_PRO/);
  assert.match(checkout, /year\|annual/);
  assert.match(checkout, /X-SplashLens-Checkout-Mode/);
  assert.match(checkout, /stripe_checkout_session/);
  assert.match(checkout, /payment_link_direct/);
});

test('checkout intent reporting includes every app paid-action event', () => {
  const stats = fs.readFileSync(new URL('../functions/api/stats.js', import.meta.url), 'utf8');
  const runner = fs.readFileSync(new URL('../tools/run-field-intelligence-loop.mjs', import.meta.url), 'utf8');
  for (const eventName of [
    'checkout_click',
    'upgrade_click',
    'post_value_upgrade_clicked',
    'account_pro_checkout_clicked',
    'partsnap_pro_restore_requested',
    'native_purchase_click',
    'paid_lane_click',
    'paid_lane_lead_captured',
  ]) {
    assert.match(stats, new RegExp(eventName));
    assert.match(runner, new RegExp(eventName));
  }
});

test('post-value lookup results expose a paid path without charging for manual lookup', () => {
  assert.match(app, /function renderManualLookupUpgradeOffer/);
  assert.match(app, /Manual lookup stays free/);
  assert.match(app, /trackPostValueUpgrade\('monthly','scan_lookup_search'\)/);
  assert.match(app, /trackPostValueUpgrade\('yearly','scan_lookup_search'\)/);
  assert.match(app, /trackSplashLensEvent\('checkout_click', \{ plan, feature: 'unlimited_partsnap', placement \}\)/);
});

test('account dashboard shows commercial lanes without pretending every lane is checkout-ready', () => {
  assert.match(app, /const SPLASHLENS_COMMERCIAL_ENDPOINT = '\/api\/commercial'/);
  assert.match(app, /splashLensCommercialRequest/);
  assert.match(app, /renderSplashLensCommercialSection/);
  assert.match(app, /requestSplashLensCommercialAccess/);
  assert.match(app, /requestSplashLensPartnerCard/);
  assert.match(app, /Free lookup first\. Pay when proof, teams, or partner workflows matter/);
  assert.match(app, /Get Pro/);
  assert.match(app, /Request team/);
  assert.match(app, /Submit manufacturer \/ training card/);
  assert.match(app, /saveSplashLensCommercialProof/);
  assert.match(app, /service_report_saved_server/);
  assert.match(app, /partsnap_proof_saved_server/);
  assert.match(checkout, /requestAccessConfigured/);
  assert.match(commercial, /pilot_request/);
  assert.match(commercial, /partner_pilot/);
});

test('scan and save profile gates never depend on native JavaScript dialogs', () => {
  const start = app.indexOf('function ensureFieldSaveAccount');
  const end = app.indexOf('function speechRecognitionCtor');
  const gate = app.slice(start, end > start ? end : start + 16000);
  assert.ok(start > 0 && gate.length > 2000);
  assert.match(gate, /function openSplashLensSheet\(config\)/);
  assert.match(gate, /async function createFieldSaveProfile/);
  assert.match(gate, /autocomplete: 'one-time-code'/);
  assert.match(gate, /FIELD_SAVE_RETRY_ACTIONS\[feature\]/);
  assert.match(gate, /getStoreShellMode\(\) !== 'ios'/);
  const scanGate = gate.slice(gate.indexOf('async function createFieldSaveProfile'));
  assert.doesNotMatch(scanGate, /window\.(confirm|prompt|alert)\(/);
  assert.doesNotMatch(gate.slice(0, gate.indexOf('const FIELD_SAVE_RETRY_ACTIONS')), /window\.(confirm|prompt|alert)\(/);
});

test('first-value analytics exclude zero-result searches and count calculator output', () => {
  assert.match(app, /if \(matches\.length > 0\) \{[\s\S]*workflow: 'manual_code_search'/);
  assert.match(app, /workflow: 'manual_code_search',[\s\S]*lookup_zero_result/);
  assert.match(app, /workflow: 'turnover_calculator',[\s\S]*result_count: 1/);
});
