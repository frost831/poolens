import assert from 'node:assert/strict';
import { test } from 'node:test';
import { i18nText } from '../js/i18n.js';
import { createDayRecap, dayRecap, recapHasSavedWork } from '../js/day-recap.js';

const stops = [
  { day: '2026-10-12', name: 'Maple', partLabel: 'Hayward lid', partIdentifiedAt: '2026-10-12T15:00:00.000Z', packetSentAt: '2026-10-12T15:05:00.000Z' },
  { day: '2026-10-12', name: 'Oak', partLabel: '', partIdentifiedAt: '', packetSentAt: '' },
  { day: '2026-10-11', name: 'Yesterday', partLabel: 'Old part', partIdentifiedAt: '2026-10-11T15:00:00.000Z', packetSentAt: '2026-10-11T15:05:00.000Z' },
];

test('recap counts only today and only fields the tech actually recorded', () => {
  const recap = dayRecap(stops, '2026-10-12');
  assert.deepEqual(recap, { day: '2026-10-12', stopsLogged: 2, partsIdentified: 1, packetsSent: 1 });
  assert.equal(recapHasSavedWork(dayRecap([], '2026-10-12')), false);
  assert.equal(dayRecap([{ day: '2026-10-12', partLabel: '', partIdentifiedAt: '2026-10-12T15:00:00.000Z' }], '2026-10-12').partsIdentified, 0);
});

function mountDoc() {
  const nodes = new Map();
  function create(tag) {
    return {
      tag, className: '', textContent: '', children: [], attrs: {},
      setAttribute(name, value) { this.attrs[name] = value; },
      append(...kids) { this.children.push(...kids); },
      replaceChildren(...kids) { this.children = kids; },
    };
  }
  return {
    createElement: create,
    getElementById(id) { return nodes.get(id) || null; },
    add(id) { const node = create('div'); nodes.set(id, node); return node; },
  };
}

test('end-of-day card uses real counts and stays quiet before afternoon on Counter', () => {
  globalThis.SplashLensI18N = { i18nText };
  const doc = mountDoc();
  const counter = doc.add('day-recap-mount');
  const route = doc.add('route-recap-mount');
  const events = [];
  const recap = createDayRecap({
    document: doc,
    storage: { getItem: () => null },
    now: () => new Date(2026, 9, 12, 11, 0),
    read: () => stops,
    track: (name, props) => events.push({ name, props }),
  });
  recap.mount('counter');
  assert.equal(counter.children.length, 0);
  recap.mount('route');
  assert.equal(route.children.length, 1);
  const numbers = JSON.stringify(route.children[0]);
  assert.match(numbers, /Stops logged/);
  assert.match(numbers, /"textContent":"2"/);
  assert.match(numbers, /"textContent":"1"/);
  assert.doesNotMatch(numbers, /Maple|Oak|Yesterday|streak/);
  assert.equal(events[0].name, 'day_recap_shown');
  assert.deepEqual(events[0].props, { stops_logged: 2, parts_identified: 1, packets_sent: 1, surface: 'route' });

  const evening = createDayRecap({
    document: doc,
    storage: { getItem: () => null },
    now: () => new Date(2026, 9, 12, 16, 30),
    read: () => [],
    track: () => {},
  });
  evening.mount('counter');
  assert.match(counter.children[0].children.map(node => node.textContent).join(' '), /No stops saved on this device today/);
  assert.equal(counter.children[0].children.some(node => node.tag === 'dl'), false);
});

test('Spanish recap labels exist and do not invent a streak', () => {
  assert.equal(i18nText('es', 'recap.title'), 'Resumen del día');
  assert.match(i18nText('es', 'recap.source'), /este dispositivo/);
  assert.doesNotMatch(i18nText('en', 'recap.source'), /streak|average|most techs/i);
  assert.doesNotMatch(i18nText('es', 'recap.empty'), /\$|racha/i);
});
