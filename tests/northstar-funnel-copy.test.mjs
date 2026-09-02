import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const app = fs.readFileSync(new URL('../js/app.js', import.meta.url), 'utf8');
const data = fs.readFileSync(new URL('../js/data.js', import.meta.url), 'utf8');
const shell = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const scan = fs.readFileSync(new URL('../functions/api/scan.js', import.meta.url), 'utf8');
const checkout = fs.readFileSync(new URL('../functions/api/checkout.js', import.meta.url), 'utf8');

test('first open goes straight to field workflow instead of forcing persona picker', () => {
  assert.match(app, /field_home_opened_without_role_gate/);
  assert.doesNotMatch(app, /showRolePicker\(\);\s*\}/);
  assert.doesNotMatch(shell, /setSplashLensRole\('homeowner'/);
});

test('free scan allowance is three in browser and server code', () => {
  assert.match(app, /const SCAN_LIMIT_FREE = 3;/);
  assert.match(scan, /const FREE_SCAN_LIMIT = 3;/);
  assert.match(app, /The FreeCore app includes 3 PartSnap app scans a month/);
});

test('pricing catalog uses the simplified North Star plan ladder', () => {
  assert.match(data, /Free, No Account/);
  assert.match(data, /Free Save Profile/);
  assert.match(data, /Splash Lens Pro Unlimited/);
  assert.match(data, /\$29\/mo or \$249\/yr target/);
  assert.match(data, /Teams/);
  assert.doesNotMatch(data, /Saved Job Pro/);
  assert.doesNotMatch(data, /\$4\.99\/mo or \$39\/yr/);
});

test('saving job history requires a free save profile signal', () => {
  assert.match(app, /const FIELD_SAVE_ACCOUNT_KEY = 'splashlens-free-save-profile-v1'/);
  assert.match(app, /function ensureFieldSaveAccount/);
  assert.match(app, /free_save_profile_created/);
  assert.match(app, /ensureFieldSaveAccount\('service_report_saved'\)/);
  assert.match(app, /ensureFieldSaveAccount\('partsnap_field_stop_saved'\)/);
  assert.match(app, /ensureFieldSaveAccount\('partsnap_saved_to_pool'\)/);
});

test('checkout exposes a JSON catalog and Splash Lens Pro Unlimited metadata', () => {
  assert.match(checkout, /url\.searchParams\.has\('catalog'\)/);
  assert.match(checkout, /Splash Lens Pro Unlimited Monthly/);
  assert.match(checkout, /Splash Lens Pro Unlimited Annual/);
  assert.match(checkout, /SPLASHLENS_STRIPE_PRICE_\$\{key\}_PRO/);
  assert.match(checkout, /SPLASHLENS_STRIPE_LINK_MONTHLY_PRO/);
});
