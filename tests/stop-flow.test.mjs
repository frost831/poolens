import assert from 'node:assert/strict';
import { test } from 'node:test';
import { i18nText } from '../js/i18n.js';
import {
  ACTIVE_STOP_KEY,
  STOP_LOG_KEY,
  attachPart,
  createStop,
  createStopFlow,
  customerPacket,
  localDay,
  markPacketSent,
  readStops,
  setFollowUpOpen,
} from '../js/stop-flow.js';

function memory(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem: key => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => values.set(key, String(value)),
    dump: () => values,
  };
}

function fakeDocument() {
  const nodes = new Map();
  function create(tag) {
    return {
      tag,
      className: '',
      textContent: '',
      hidden: false,
      type: '',
      value: '',
      placeholder: '',
      maxLength: 0,
      required: false,
      children: [],
      listeners: {},
      attrs: {},
      classList: { add() {}, remove() {} },
      setAttribute(name, value) { this.attrs[name] = value; },
      append(...kids) { this.children.push(...kids); },
      prepend(child) { this.children.unshift(child); },
      replaceChildren(...kids) { this.children = kids; },
      querySelector(selector) {
        const name = selector.replace(/[\[\]]/g, '');
        return this.children.find(child => child.attrs?.[name] || child.querySelector?.(selector)) || null;
      },
      addEventListener(type, fn) { this.listeners[type] = fn; },
      focus() { this.focused = true; },
      remove() { this.removed = true; },
    };
  }
  return {
    createElement: create,
    getElementById(id) { return nodes.get(id) || null },
    add(id) { const node = create('div'); nodes.set(id, node); return node; },
  };
}

test('new stop requires a name and keeps only what the tech typed', () => {
  const storage = memory();
  const now = new Date(2026, 9, 12, 8, 30);
  assert.equal(createStop(storage, { name: '   ' }, now).ok, false);
  assert.equal(storage.dump().has(STOP_LOG_KEY), false);
  const created = createStop(storage, { name: '  Maple pool  ', followUp: '  Heater next week  ' }, now);
  assert.equal(created.ok, true);
  assert.equal(created.stop.name, 'Maple pool');
  assert.equal(created.stop.followUp, 'Heater next week');
  assert.equal(created.stop.followUpOpen, true);
  assert.equal(created.stop.day, localDay(now));
  assert.equal(created.stop.partLabel, '');
  assert.equal(created.stop.packetSentAt, '');
  assert.equal(storage.getItem(ACTIVE_STOP_KEY), created.stop.id);
  assert.equal(readStops(storage)[0].name, 'Maple pool');
});

test('a part is attached only from the active stop and the actual result', () => {
  const storage = memory();
  const now = new Date(2026, 9, 12, 9, 0);
  assert.equal(attachPart(storage, { manufacturer: 'Hayward', component: 'Pump lid' }, now).attached, false);
  const created = createStop(storage, { name: 'Maple pool' }, now);
  assert.equal(attachPart(storage, {}, now).attached, false);
  assert.equal(readStops(storage)[0].partIdentifiedAt, '');
  const attached = attachPart(storage, { manufacturer: 'Hayward', component: 'Pump lid', model: 'SPX' }, now);
  assert.equal(attached.attached, true);
  assert.equal(attached.partLabel, 'Hayward Pump lid');
  assert.equal(readStops(storage)[0].id, created.stop.id);
  assert.ok(readStops(storage)[0].partIdentifiedAt);
});

test('customer summary is one short packet from the stop and possible part', () => {
  const stop = { name: 'Maple pool', partLabel: 'Hayward Pump lid', followUp: 'Internal note stays off the text' };
  const english = customerPacket(stop, 'en');
  const spanish = customerPacket(stop, 'es');
  assert.match(english, /Maple pool/);
  assert.match(english, /Possible part: Hayward Pump lid/);
  assert.match(english, /Verify the nameplate and the current manual before ordering/);
  assert.doesNotMatch(english, /Internal note/);
  assert.match(spanish, /Posible pieza: Hayward Pump lid/);
  assert.match(spanish, /Verifica la placa/);
  assert.ok(english.length <= 480);
  assert.ok(spanish.length <= 480);
  assert.doesNotMatch(english, /\$|guarantee|checkout/i);
  assert.doesNotMatch(spanish, /\$|garant/i);
  assert.equal(i18nText('es', 'stop.textSummary'), 'Enviar resumen al cliente');
  assert.equal(i18nText('en', 'stop.new'), 'New stop');
});

test('packet sent is recorded only after a share channel opens', () => {
  const storage = memory();
  const created = createStop(storage, { name: 'Maple pool' }, new Date(2026, 9, 12, 9, 0));
  attachPart(storage, { component: 'Lid' }, new Date(2026, 9, 12, 9, 5));
  assert.equal(readStops(storage)[0].packetSentAt, '');
  const sent = markPacketSent(storage, created.stop.id, new Date(2026, 9, 12, 9, 6));
  assert.ok(sent.packetSentAt);
  const closed = setFollowUpOpen(storage, created.stop.id, false);
  assert.equal(closed.followUpOpen, false);
});

test('new stop entry opens scan and the identified stop offers one text action', async () => {
  const storage = memory();
  const doc = fakeDocument();
  const mount = doc.add('stop-flow-mount');
  const scan = doc.add('scan-result');
  const events = [];
  const opened = [];
  let shared = null;
  globalThis.SplashLensI18N = { i18nText };
  const flow = createStopFlow({
    storage,
    document: doc,
    now: () => new Date(2026, 9, 12, 10, 0),
    track: (name, props) => events.push({ name, props }),
    openScan: () => opened.push('scan'),
    share: async (request) => {
      shared = request;
      request.onEvent('packet_share_tapped', { channel: 'sms', surface: request.surface });
      request.onEvent('packet_shared', { channel: 'sms', surface: request.surface });
      return { channel: 'sms' };
    },
  });
  flow.mount();
  const starter = mount.children[0];
  assert.equal(starter.tag, 'button');
  assert.match(starter.textContent, /New stop/);
  starter.listeners.click();
  const form = mount.children[0];
  assert.equal(form.tag, 'form');
  const inputs = form.children.filter(child => child.tag === 'input');
  inputs[0].value = '';
  form.listeners.submit({ preventDefault() {} });
  assert.equal(opened.length, 0);
  inputs[0].value = 'Maple pool';
  inputs[1].value = 'Call about the heater';
  form.listeners.submit({ preventDefault() {} });
  assert.deepEqual(opened, ['scan']);
  assert.equal(events.find(event => event.name === 'stop_created').props.has_follow_up, true);
  assert.doesNotMatch(JSON.stringify(events), /Maple pool|Call about the heater/);
  flow.onPartIdentified({ manufacturer: 'Hayward', component: 'Pump lid' });
  const packetCard = scan.children[0];
  assert.equal(packetCard.attrs['data-stop-packet']?.startsWith('stop-'), true);
  const send = packetCard.children.find(child => child.tag === 'button');
  assert.match(send.textContent, /Text customer summary/);
  await send.listeners.click();
  assert.equal(shared.surface, 'stop_summary');
  assert.match(shared.packet, /Maple pool/);
  assert.match(shared.packet, /Hayward Pump lid/);
  assert.doesNotMatch(shared.packet, /Call about the heater/);
  assert.ok(readStops(storage)[0].packetSentAt);
  assert.equal(events.some(event => event.name === 'stop_packet_sent' && event.props.channel === 'sms'), true);
  assert.equal(events.some(event => event.name === 'packet_shared'), true);
});
