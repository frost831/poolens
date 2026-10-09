import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import vm from 'node:vm';
import { CLOSING_COPY_ES, I18N, closingText, i18nText } from '../js/i18n.js';

test('every English A3 string has a nonempty Spanish counterpart', () => {
  const enKeys = Object.keys(I18N.en).sort();
  const esKeys = Object.keys(I18N.es).sort();
  assert.deepEqual(esKeys, enKeys);
  for (const key of enKeys) {
    assert.ok(I18N.en[key].trim(), `empty English value: ${key}`);
    assert.ok(I18N.es[key].trim(), `empty Spanish value: ${key}`);
  }
});

test('A3 dictionary covers each requested chrome surface', () => {
  for (const prefix of ['language.', 'counter.', 'code.', 'packet.', 'closing.', 'upgrade.']) {
    assert.ok(Object.keys(I18N.en).some((key) => key.startsWith(prefix)), `missing ${prefix}`);
  }
  assert.equal(i18nText('es', 'counter.code'), 'Código');
  assert.equal(i18nText('fr', 'counter.code'), 'Code');
  assert.equal(i18nText('es', 'unknown.key'), 'unknown.key');
});

test('draft Spanish is flagged and share copy contains no price or checkout claim', () => {
  const source = readFileSync(new URL('../js/i18n.js', import.meta.url), 'utf8');
  const review = readFileSync(new URL('../docs/i18n/ES_REVIEW.md', import.meta.url), 'utf8');
  assert.match(source, /needs_native_review/);
  assert.match(review, /machine-drafted/);
  for (const key of ['packet.title', 'packet.shareCaution', 'packet.sampleTitle', 'packet.sampleCaution']) {
    assert.doesNotMatch(I18N.en[key], /\$|checkout|guarantee/i, key);
    assert.doesNotMatch(I18N.es[key], /\$|checkout|garant[ií]a/i, key);
  }
});

const app = readFileSync(new URL('../js/app.js', import.meta.url), 'utf8');
const shell = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

function functionSource(name) {
  const match = app.match(new RegExp(`^function ${name}\\([^]*?^}`, 'm'));
  assert.ok(match, `missing ${name}`);
  return match[0];
}

function storage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return { getItem: key => values.get(key) || null, setItem: (key, value) => values.set(key, String(value)) };
}

test('every static a3Text key and dynamic severity/phase key is present', () => {
  for (const [, key] of app.matchAll(/a3Text\('([^']+)'\)/g)) {
    assert.ok(Object.hasOwn(I18N.en, key), key);
    assert.ok(Object.hasOwn(I18N.es, key), key);
  }
  for (const severity of ['High', 'Medium', 'Low']) assert.ok(I18N.es[`code.severity${severity}`]);
  for (let phase = 1; phase <= 6; phase++) assert.ok(I18N.es[`closing.phase${phase}`]);
});

test('first open picker runs once and skips profiles, deep links and explicit language', () => {
  const sheet = [];
  const select = { value: '', addEventListener() {} };
  const context = vm.createContext({
    URLSearchParams,
    window: { location: { search: '' } },
    document: { getElementById: id => id === 'language-select' ? select : null },
    localStorage: storage(),
    LANGUAGE_STORAGE_KEY: 'splashlens_language_profile',
    getLanguageProfile: () => ({ preferredLanguage: 'en' }),
    setPreferredLanguage: () => {},
    refreshFirstUsePreferenceButtons: () => {},
    applySplashLensLocalization: () => {},
    initLocalizationObserver: () => {},
    openLanguageSheet: surface => sheet.push(surface),
    trackLanguageModeOpen: () => {},
    trackMarketInterestOpen: () => {},
    getFacilityDeepLinkParts: () => null,
  });
  vm.runInContext(functionSource('initLanguageLayer'), context);
  context.initLanguageLayer({ firstOpen: true });
  assert.deepEqual(sheet, ['first_open']);
  sheet.length = 0;
  context.localStorage.setItem('splashlens_language_profile', JSON.stringify({ preferredLanguage: 'en' }));
  context.initLanguageLayer({ firstOpen: true });
  assert.deepEqual(sheet, []);
  context.localStorage = storage();
  for (const query of ['?tab=scan', '?workflow=closing', '?lang=es', '?open=last_pool']) {
    context.window.location.search = query;
    context.initLanguageLayer({ firstOpen: true });
    assert.deepEqual(sheet, [], query);
  }
  context.window.location.search = '';
  context.initLanguageLayer({ firstOpen: false });
  assert.deepEqual(sheet, []);
});

test('sheet and legacy select persist choice and emit the required language event', () => {
  const events = [];
  const profile = storage();
  const sheet = { classList: { active: false, add() { this.active = true; }, remove() { this.active = false; }, contains() { return this.active; } }, setAttribute() {} };
  const select = { value: 'en' };
  const toggle = { focus() {} };
  const context = vm.createContext({
    document: { getElementById: id => ({ 'language-sheet': sheet, 'language-choice-en': { focus() {} }, 'language-select': select, 'counter-language-toggle': toggle })[id] },
    LANGUAGE_OPTIONS: ['en', 'es'],
    S: { clType: '' },
    setPreferredLanguage: language => { profile.setItem('splashlens_language_profile', JSON.stringify({ preferredLanguage: language })); return { preferredLanguage: language, locale: language }; },
    refreshFirstUsePreferenceButtons() {}, applySplashLensLocalization() {},
    trackSplashLensEvent: (name, props) => events.push([name, props]),
  });
  vm.runInContext("let languageSheetSurface = '';" + functionSource('openLanguageSheet') + functionSource('selectAppLanguage'), context);
  context.openLanguageSheet('first_open');
  context.selectAppLanguage('es');
  assert.equal(sheet.classList.active, false);
  assert.equal(select.value, 'es');
  assert.equal(JSON.parse(profile.getItem('splashlens_language_profile')).preferredLanguage, 'es');
  context.openLanguageSheet('header');
  context.selectAppLanguage('en');
  assert.deepEqual(events.filter(([name]) => name === 'language_selected').map(([, props]) => [props.language, props.surface]), [['es', 'first_open'], ['en', 'header']]);
  assert.match(shell, /id="language-select"/);
  assert.match(shell, /id="counter-language-toggle"/);
  assert.doesNotMatch(shell + app, /chooseRoleLanguage/);
});

test('Spanish code chrome and packet text keep manufacturer values unchanged', () => {
  const context = vm.createContext({
    a3Text: key => i18nText('es', key),
    escAttr: value => value,
    _lastPartSnapResult: { manufacturer: 'Pentair', component: 'pump lid', model: '123', confidence: 'low', visibleEvidence: ['label'], missingProof: ['manual'] },
  });
  vm.runInContext(functionSource('codeCard') + functionSource('partSnapEscalationText'), context);
  const card = context.codeCard({ code: 'E05', name: 'Ignition failure', causes: ['Check gas'], fix: ['Use manual'], callpro: true }, 'e05', '#000');
  assert.match(card, /Verifica primero/);
  assert.match(card, /Haz después/);
  assert.match(card, /E05/);
  assert.match(card, /Ignition failure/);
  assert.match(card, /Media/);
  assert.match(context.partSnapEscalationText(), /Pieza posible: Pentair pump lid/);
  assert.match(context.partSnapEscalationText(), /Modelo\/familia: 123/);
});

test('all upgrade surfaces remain suppressed in store shells', () => {
  for (const name of ['renderPostValueUpgradeOffer', 'renderPartSnapResultUpgradeOffer', 'renderManualLookupUpgradeOffer']) {
    const body = functionSource(name);
    assert.match(body, /isStoreShellMode\(\)/, name);
  }
  const context = vm.createContext({ isPartSnapPro: () => false, isStoreShellMode: () => true });
  vm.runInContext(functionSource('renderPostValueUpgradeOffer') + functionSource('renderPartSnapResultUpgradeOffer') + functionSource('renderManualLookupUpgradeOffer'), context);
  assert.equal(context.renderPostValueUpgradeOffer(), '');
  assert.equal(context.renderPartSnapResultUpgradeOffer(), '');
  assert.equal(context.renderManualLookupUpgradeOffer(2, 'E05'), '');
});

test('every closing step, proof photo and callback flag has an exact Spanish mapping', () => {
  const data = readFileSync(new URL('../js/data.js', import.meta.url), 'utf8');
  const window = {};
  vm.runInNewContext(data, { window });
  const steps = window.CLOSING_CHECKLIST.flatMap(phase => phase.steps);
  assert.equal(steps.length, 36);
  const proof = window.CLOSING_SEASON_PROOF;
  for (const source of [...steps, proof.title, proof.promise, proof.trustBoundary, ...proof.proofPhotos, ...proof.callbackFlags]) {
    assert.ok(Object.hasOwn(CLOSING_COPY_ES, source), `missing Spanish: ${source}`);
    assert.ok(CLOSING_COPY_ES[source].trim(), `empty Spanish: ${source}`);
    assert.notEqual(closingText('es', source), source);
    assert.equal(closingText('en', source), source);
  }
  assert.match(CLOSING_COPY_ES[steps[15]], /Nunca uses anticongelante automotriz/);
  assert.match(CLOSING_COPY_ES[steps[33]], /no garantiza cobertura/);
  assert.match(app, /S\.clType === 'closing' \? a3ClosingText\(step\) : step/);
});
