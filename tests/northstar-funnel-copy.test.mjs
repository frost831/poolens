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
  assert.match(fs.readFileSync(new URL('../js/i18n.js', import.meta.url), 'utf8'), /A free field profile includes 3 AI scans each month/);
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
  assert.match(data, /\$19\/mo or \$149\/yr/);
  assert.match(data, /\$49-79\/owner\/mo; techs free/);
  assert.doesNotMatch(data, /\$29\/mo or \$249\/yr|\$149\/company\/mo/);
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
  const shellAppUrl = shell.match(/<script src="(\/js\/app\.js\?v=[^"]+)"/ )?.[1];
  const precacheAppUrl = sw.match(/'(\/js\/app\.js\?v=[^']+)'/)?.[1];
  assert.equal(shellAppUrl, '/js/app.js?v=20261009-freeze-g0');
  assert.equal(precacheAppUrl, shellAppUrl);
  assert.match(shell, /\/js\/i18n\.js\?v=20261009-cost-unknown/);
  assert.match(sw, /\/js\/i18n\.js\?v=20261009-cost-unknown/);
  assert.match(app, /import\('\.\/truck-qr\.js\?v=20261009-restart-a5'\)/);
  assert.match(sw, /\/js\/truck-qr\.js\?v=20261009-restart-a5/);
  assert.match(sw, /\/js\/vendor\/qrcode-generator\.mjs\?v=20261009-restart-a5/);
  assert.match(app, /import\('\.\/packet-share\.js\?v=20261009-restart-a4'\)/);
  assert.match(sw, /\/js\/packet-share\.js\?v=20261009-restart-a4/);
  assert.match(shell, /errors\.js\?v=20261002-trust-fixes-3/);
  assert.match(sw, /const CACHE = 'splashlens-v39-freeze-g0'/);
  assert.match(sw, /\/js\/crm-proof-export\.js\?v=20261009-pc20/);
  assert.match(sw, /errors\.js\?v=20261002-trust-fixes-3/);
  assert.match(sw, /keys\.filter\(k => k !== CACHE\)/);
});

test('store-visible free-tools copy contains no promotional dollar amount', () => {
  assert.match(shell, /<strong>Free<\/strong><span>No card<\/span>/);
  assert.doesNotMatch(shell, /<strong>\$0<\/strong><span>No card<\/span>/);
  assert.match(shell, /id="rpt-cost-total"[^>]*>Not entered<\/span>/);
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

test('checkout reporting separates intent from offers and server payment stages', () => {
  const stats = fs.readFileSync(new URL('../functions/api/stats.js', import.meta.url), 'utf8');
  const runner = fs.readFileSync(new URL('../tools/run-field-intelligence-loop.mjs', import.meta.url), 'utf8');
  for (const eventName of [
    'checkout_click',
    'native_purchase_click',
    'checkout_cta_shown',
    'checkout_session_created',
    'checkout_completed',
    'subscription_created',
    'entitlement_granted',
  ]) {
    assert.match(stats, new RegExp(eventName));
    assert.match(runner, new RegExp(eventName));
  }
  assert.match(runner, /checkoutClicks30d: countEvents\(database, 30, \['checkout_click', 'native_purchase_click'\]\)/);
});

test('post-value lookup results expose a paid path without charging for manual lookup', () => {
  assert.match(app, /function renderManualLookupUpgradeOffer/);
  assert.match(app, /Manual lookup stays free/);
  assert.match(app, /trackPostValueUpgrade\('monthly','scan_lookup_search'\)/);
  assert.match(app, /trackPostValueUpgrade\('yearly','scan_lookup_search'\)/);
  assert.match(app, /trackSplashLensEvent\('checkout_click', props\)/);
  assert.match(app, /client_reference_id = `sl_checkout_/);
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
  const searchHandler = app.slice(app.indexOf('function onErrorSearch'), app.indexOf('function clearSearch'));
  assert.match(app, /trackSplashLensEvent\('code_answer_opened'/);
  assert.match(app, /if \(!matches\.length\) \{[\s\S]*lookup_zero_result/);
  assert.doesNotMatch(searchHandler, /first_value_completed/);
  assert.match(app, /function trackCalculationCompleted/);
  assert.match(app, /trackSplashLensEvent\('calculation_completed'/);
});
