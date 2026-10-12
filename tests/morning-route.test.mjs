import assert from 'node:assert/strict';
import { test } from 'node:test';
import { i18nText } from '../js/i18n.js';
import { createMorningRoute, morningHasEntries, morningRoute } from '../js/morning-route.js';

const stops = [
  { id: 'a', day: '2026-10-12', name: 'Maple', followUp: 'Heater', followUpOpen: true },
  { id: 'b', day: '2026-10-12', name: 'Oak', followUp: '', followUpOpen: false },
  { id: 'c', day: '2026-10-11', name: 'Pine', followUp: 'Plug photo', followUpOpen: true },
  { id: 'd', day: '2026-10-11', name: 'Closed', followUp: 'Done already', followUpOpen: false },
];

test('morning route lists only saved stops, route names, and open follow-ups', () => {
  const view = morningRoute({
    stops,
    route: { date: '2026-10-12', jobs: [{ id: '1', name: 'Cedar', done: false }, { name: '  ' }] },
    day: '2026-10-12',
    utc: '2026-10-12',
  });
  assert.deepEqual(view.stops.map(stop => stop.name), ['Maple', 'Oak']);
  assert.deepEqual(view.routeJobs.map(job => job.name), ['Cedar']);
  assert.deepEqual(view.followUps.map(stop => stop.followUp), ['Heater', 'Plug photo']);
  assert.equal(morningHasEntries(view), true);
  const stale = morningRoute({ stops, route: { date: '2026-10-01', jobs: [{ name: 'Old' }] }, day: '2026-10-12', utc: '2026-10-12' });
  assert.deepEqual(stale.routeJobs, []);
  const utcRoute = morningRoute({ stops: [], route: { date: '2026-10-13', jobs: [{ name: 'Late' }] }, day: '2026-10-12', utc: '2026-10-13' });
  assert.deepEqual(utcRoute.routeJobs.map(job => job.name), ['Late']);
});

function mountDoc() {
  const nodes = new Map();
  function create(tag) {
    return {
      tag, className: '', textContent: '', children: [], attrs: {}, type: '',
      setAttribute(name, value) { this.attrs[name] = value; },
      append(...kids) { this.children.push(...kids); },
      replaceChildren(...kids) { this.children = kids; },
      addEventListener(type, fn) { this.listeners = { ...(this.listeners || {}), [type]: fn }; },
    };
  }
  return {
    createElement: create,
    getElementById(id) { return nodes.get(id) || null; },
    add(id) { const node = create('div'); nodes.set(id, node); return node; },
  };
}

test('morning card shows user-entered rows and can close a follow-up', () => {
  globalThis.SplashLensI18N = { i18nText };
  const doc = mountDoc();
  const counter = doc.add('morning-route-mount');
  const route = doc.add('route-morning-mount');
  const events = [];
  let open = true;
  const morning = createMorningRoute({
    document: doc,
    storage: { getItem: () => null },
    now: () => new Date(2026, 9, 12, 7, 30),
    read: () => stops.map(stop => stop.id === 'a' ? { ...stop, followUpOpen: open } : stop),
    readRoute: () => ({ date: '2026-10-12', jobs: [{ id: '1', name: 'Cedar' }] }),
    closeFollowUp: () => { open = false; },
    track: (name, props) => events.push({ name, props }),
  });
  morning.mount('counter');
  const rendered = JSON.stringify(counter.children[0]);
  assert.match(rendered, /Maple: Heater/);
  assert.match(rendered, /Cedar/);
  assert.match(rendered, /Plug photo/);
  assert.doesNotMatch(rendered, /Done already/);
  assert.equal(events[0].props.follow_ups, 2);
  assert.doesNotMatch(JSON.stringify(events), /Maple|Heater|Cedar/);
  const walk = (node, found = []) => {
    found.push(node);
    for (const child of node.children || []) walk(child, found);
    return found;
  };
  const button = walk(counter.children[0]).find(node => node.tag === 'button');
  button.listeners.click();
  assert.equal(events.at(-1).name, 'morning_follow_up_closed');
  assert.doesNotMatch(JSON.stringify(counter.children[0]), /Maple: Heater/);

  const afternoon = createMorningRoute({
    document: doc,
    storage: { getItem: () => null },
    now: () => new Date(2026, 9, 12, 13, 0),
    read: () => [],
    readRoute: () => ({ date: '2026-10-12', jobs: [] }),
    track: () => {},
  });
  afternoon.mount('counter');
  assert.equal(counter.children.length, 0);
  afternoon.mount('route');
  assert.match(JSON.stringify(route.children[0]), /No stops or follow-ups saved for today/);
});

test('Spanish morning copy stays limited to saved work', () => {
  assert.equal(i18nText('es', 'morning.title'), 'Ruta de hoy');
  assert.match(i18nText('es', 'morning.empty'), /guardad/);
  assert.doesNotMatch(i18nText('en', 'morning.source'), /streak|most techs|guarantee/i);
});
