import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { freeIdSoftGateCount } from '../js/field-config.js';
import { i18nText } from '../js/i18n.js';
import { COUNT_KEY, PLACEMENT, SESSION_KEY, createSoftGate } from '../js/soft-gate.js';

test('free identification soft gate defaults to five and rejects invalid config', () => {
  assert.equal(freeIdSoftGateCount(), 5);
  assert.equal(freeIdSoftGateCount(2), 2);
  for (const value of [0, -3, 1.5, '5', null, undefined]) assert.equal(freeIdSoftGateCount(value), 5);
});

function memory() {
  const values = new Map();
  return {
    getItem: key => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => values.set(key, String(value)),
  };
}

function elementFactory() {
  return function create(tag) {
    return {
      tag, className: '', textContent: '', id: '', href: '', target: '', rel: '', type: '', children: [], attrs: {},
      setAttribute(name, value) { this.attrs[name] = value; },
      append(...kids) { for (const kid of kids) { kid.parent = this; this.children.push(kid); } },
      addEventListener(type, fn) { this.listeners = { ...(this.listeners || {}), [type]: fn }; },
      remove() {
        this.removed = true;
        if (this.parent) this.parent.children = this.parent.children.filter(child => child !== this);
      },
      querySelector(selector) {
        const id = selector.startsWith('#') ? selector.slice(1) : selector;
        const walk = (node) => {
          if (node.id === id) return node;
          for (const child of node.children || []) {
            const found = walk(child);
            if (found) return found;
          }
          return null;
        };
        return walk(this);
      },
    };
  };
}

function resultNode(create) {
  const node = create('div');
  node.insertAdjacentElement = (_position, card) => node.append(card);
  return node;
}

function walk(node, found = []) {
  found.push(node);
  for (const child of node.children || []) walk(child, found);
  return found;
}

test('the fifth successful free identification offers the existing web checkout once per session', () => {
  globalThis.SplashLensI18N = { i18nText };
  const storage = memory();
  const session = memory();
  const events = [];
  const create = elementFactory();
  const gate = createSoftGate({
    storage,
    session,
    document: { createElement: create },
    checkoutUrl: plan => `/api/checkout?plan=${plan}&placement=${PLACEMENT}`,
    onCheckout: plan => `/api/checkout?plan=${plan}&clicked=1`,
    track: (name, props) => events.push({ name, props }),
  });
  const early = resultNode(create);
  for (let i = 0; i < 4; i += 1) gate.noteSuccessfulFreeId({ component: 'Pump lid' }, early);
  assert.equal(early.children.length, 0);
  const result = resultNode(create);
  const noted = gate.noteSuccessfulFreeId({ component: 'Pump lid' }, result);
  assert.equal(noted.count, 5);
  const card = result.querySelector('#free-id-soft-gate');
  const text = walk(card).map(node => node.textContent).join('\n');
  assert.match(text, /This identification stays on screen/);
  assert.match(text, /Successful free part identifications on this device: 5/);
  assert.doesNotMatch(text, /\$|streak|only \d+ left|hurry|last chance|guarantee/i);
  const links = walk(card).filter(node => node.tag === 'a');
  assert.deepEqual(links.map(link => link.attrs['data-checkout-plan']), ['monthly', 'yearly']);
  assert.equal(links.every(link => link.attrs['data-checkout-placement'] === PLACEMENT), true);
  assert.match(links[0].href, /\/api\/checkout\?plan=monthly/);
  links[0].listeners.click();
  assert.match(links[0].href, /clicked=1/);
  assert.equal(events[0].name, 'soft_gate_shown');
  assert.equal(events[0].props.placement, PLACEMENT);
  assert.equal(events[0].props.successful_ids, 5);
  const later = resultNode(create);
  gate.noteSuccessfulFreeId({ component: 'Pump lid' }, later);
  assert.equal(later.children.length, 0);
  walk(card).find(node => node.tag === 'button').listeners.click();
  assert.equal(card.removed, true);
  assert.equal(events.at(-1).name, 'soft_gate_dismissed');
  assert.equal(storage.getItem(COUNT_KEY), '6');
  assert.equal(session.getItem(SESSION_KEY), '1');
});

test('store shells count free identifications and do not render checkout', () => {
  const storage = memory();
  const create = elementFactory();
  const gate = createSoftGate({
    storage,
    session: memory(),
    document: { createElement: create },
    isStore: () => true,
    checkoutUrl: () => '/api/checkout?plan=monthly',
  });
  const result = resultNode(create);
  const noted = gate.noteSuccessfulFreeId({}, result);
  assert.equal(noted.counted, true);
  assert.equal(noted.shown, false);
  for (let i = 0; i < 4; i += 1) gate.noteSuccessfulFreeId({}, result);
  assert.equal(storage.getItem(COUNT_KEY), '5');
  assert.equal(result.children.length, 0);
});

test('Pro identifications are not counted and do not show the offer', () => {
  const storage = memory();
  const create = elementFactory();
  const gate = createSoftGate({
    storage,
    session: memory(),
    document: { createElement: create },
    isPro: () => true,
    checkoutUrl: plan => `/api/checkout?plan=${plan}`,
  });
  const noted = gate.noteSuccessfulFreeId({}, resultNode(create));
  assert.deepEqual(noted, { counted: false, count: 0, shown: false });
  assert.equal(storage.getItem(COUNT_KEY), null);
});

test('Spanish soft-gate copy keeps the count token and makes no scarcity claim', () => {
  assert.match(i18nText('es', 'softgate.body'), /\{count\}/);
  assert.match(i18nText('es', 'softgate.body'), /búsqueda manual sigue gratis/i);
  assert.doesNotMatch(i18nText('en', 'softgate.body'), /\$|streak|only \d+ left|hurry|guarantee|must/i);
});

test('successful PartSnap results notify the soft gate without changing the free scan cap', () => {
  const app = readFileSync(new URL('../js/app.js', import.meta.url), 'utf8');
  const checkout = readFileSync(new URL('../functions/api/checkout.js', import.meta.url), 'utf8');
  const success = app.slice(app.indexOf("trackSplashLensEvent('partsnap_result_success'"), app.indexOf('trackPartSnapResultFailure(showGuidedRetry'));
  assert.match(success, /SplashLensSoftGate\?\.noteSuccessfulFreeId\?\.\(_lastPartSnapResult, result\)/);
  assert.match(app, /const SCAN_LIMIT_FREE = 3/);
  assert.doesNotMatch(checkout, /freeSuccessfulIdSoftGate|soft_gate_free_ids/);
});
