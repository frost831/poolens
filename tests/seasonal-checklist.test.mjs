import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { i18nText } from '../js/i18n.js';
import {
  createSeasonalChecklist,
  dismissKey,
  seasonFor,
} from '../js/seasonal-checklist.js';

test('season follows the saved region and local date', () => {
  assert.equal(seasonFor('', new Date(2026, 9, 1)), null);
  assert.equal(seasonFor('midwest', new Date(2026, 8, 14)), null);
  assert.equal(seasonFor('midwest', new Date(2026, 8, 15)), 'closing');
  assert.equal(seasonFor('midwest', new Date(2026, 10, 30)), 'closing');
  assert.equal(seasonFor('midwest', new Date(2026, 11, 1)), null);
  assert.equal(seasonFor('midwest', new Date(2026, 2, 15)), 'opening');
  assert.equal(seasonFor('midwest', new Date(2026, 4, 31)), 'opening');
  assert.equal(seasonFor('midwest', new Date(2026, 5, 1)), null);
  assert.equal(seasonFor('sunbelt', new Date(2026, 1, 1)), 'opening');
  assert.equal(seasonFor('sunbelt', new Date(2026, 3, 30)), 'opening');
  assert.equal(seasonFor('sunbelt', new Date(2026, 4, 1)), null);
  assert.equal(seasonFor('sunbelt', new Date(2026, 10, 1)), 'closing');
  assert.equal(seasonFor('sunbelt', new Date(2026, 11, 15)), 'closing');
  assert.equal(seasonFor('sunbelt', new Date(2026, 11, 16)), null);
});

test('seasonal module does not request notifications', () => {
  const source = readFileSync(new URL('../js/seasonal-checklist.js', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /Notification|requestPermission|showNotification|pushManager/);
});

function memory(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem: key => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: key => values.delete(key),
  };
}

function mountDoc() {
  let id = 0;
  const nodes = new Map();
  function create(tag) {
    return {
      tag, className: '', textContent: '', children: [], attrs: {}, value: '', id: '', htmlFor: '', selected: false,
      setAttribute(name, value) { this.attrs[name] = value; },
      append(...kids) { this.children.push(...kids); },
      replaceChildren(...kids) { this.children = kids; },
      addEventListener(type, fn) { this.listeners = { ...(this.listeners || {}), [type]: fn }; },
    };
  }
  return {
    createElement(tag) { id += 1; return create(tag); },
    getElementById(nodeId) { return nodes.get(nodeId) || null; },
    add(nodeId) { const node = create('div'); nodes.set(nodeId, node); return node; },
  };
}

function walk(node, found = []) {
  found.push(node);
  for (const child of node.children || []) walk(child, found);
  return found;
}

test('in-season card opens the checklist and can be dismissed without leaving the region control', () => {
  globalThis.SplashLensI18N = { i18nText };
  const doc = mountDoc();
  const counter = doc.add('seasonal-counter-mount');
  const guide = doc.add('seasonal-guide-mount');
  const storage = memory({ 'splashlens-service-region-v1': 'midwest' });
  const events = [];
  const opened = [];
  const seasonal = createSeasonalChecklist({
    document: doc,
    storage,
    now: () => new Date(2026, 9, 12),
    openChecklist: season => opened.push(season),
    track: (name, props) => events.push({ name, props }),
  });
  seasonal.mount('counter');
  const open = walk(counter.children[0]).find(node => node.tag === 'button' && /Open closing checklist/.test(node.textContent));
  open.listeners.click();
  assert.deepEqual(opened, ['closing']);
  assert.equal(events.find(event => event.name === 'seasonal_checklist_shown').props.region, 'midwest');
  walk(counter.children[0]).find(node => node.tag === 'button' && /Dismiss/.test(node.textContent)).listeners.click();
  assert.equal(counter.children.length, 0);
  assert.equal(storage.getItem('splashlens-seasonal-dismiss-v1'), dismissKey('midwest', 'closing', new Date(2026, 9, 12)));
  seasonal.mount('guide');
  const select = walk(guide.children[0]).find(node => node.tag === 'select');
  assert.ok(select);
  assert.equal(walk(guide.children[0]).some(node => /Open closing checklist/.test(node.textContent || '')), false);
  select.value = 'sunbelt';
  select.listeners.change();
  assert.equal(storage.getItem('splashlens-service-region-v1'), 'sunbelt');
  assert.equal(events.at(-1).name, 'seasonal_region_set');
  assert.match(JSON.stringify(guide.children[0]), /Notifications stay off/);
});

test('Spanish seasonal copy does not promise a notification', () => {
  assert.match(i18nText('es', 'seasonal.notice'), /notificaciones siguen apagadas/i);
  assert.doesNotMatch(i18nText('en', 'seasonal.closingBody'), /must|guarantee|alert/i);
});
