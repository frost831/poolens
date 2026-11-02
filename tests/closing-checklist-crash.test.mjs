import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const app = readFileSync(new URL('../js/app.js', import.meta.url), 'utf8');
const source = app.slice(app.indexOf('function initGuide()'), app.indexOf('let _chemRowId = 0'));
const shortSource = source.replace('enabled: false, rolloutPercent: 50', 'enabled: true, rolloutPercent: 100');
const FULL_PHASES = [{ steps: ['Record the water test', 'Install the cover'] }];
const SHORT_PHASES = vm.runInNewContext(`${app.slice(app.indexOf('const SHORT_CLOSING_CHECKLIST = '), app.indexOf('const SHORT_CLOSING_KEY'))}\nSHORT_CLOSING_CHECKLIST`);
const PHOTO_KEYS = ['cover', 'plugs', 'equipment', 'chemistry'];

function createStorage() {
  const data = new Map();
  const kill = { armed: false, skip: 0, cut: 0, seen: 0 };
  return {
    getItem(key) { return data.has(key) ? data.get(key) : null; },
    setItem(key, value) {
      const text = String(value);
      if (kill.armed && kill.seen === kill.skip) {
        kill.armed = false;
        data.set(key, text.slice(0, text.length === 0 ? 0 : kill.cut % text.length));
        throw Object.assign(new Error('killed-mid-save'), { killed: true });
      }
      if (kill.armed) kill.seen += 1;
      data.set(key, text);
    },
    removeItem(key) {
      if (kill.armed && kill.seen === kill.skip) {
        kill.armed = false;
        throw Object.assign(new Error('killed-mid-save'), { killed: true });
      }
      if (kill.armed) kill.seen += 1;
      data.delete(key);
    },
    arm(skip, cut) {
      kill.armed = true;
      kill.skip = skip;
      kill.cut = cut;
      kill.seen = 0;
    },
  };
}

function boot(storage, { short = false } = {}) {
  const elements = new Map();
  const element = () => ({
    hidden: false,
    innerHTML: '',
    textContent: '',
    style: {},
    dataset: {},
    classList: { toggle(name, on) { this[name] = on; } },
  });
  const state = { clType: 'closing', checklists: {} };
  const context = vm.createContext({
    S: state,
    CL_MAP: {
      opening: { data: () => [], key: 'poolens-cl-opening', label: 'Opening', freq: 'Season Progress' },
      closing: { data: () => FULL_PHASES, key: 'poolens-cl-closing', label: 'Closing', freq: 'Season Progress' },
      weekly: { data: () => [], key: 'poolens-cl-weekly', label: 'Weekly', freq: 'This Week' },
      monthly: { data: () => [], key: 'poolens-cl-monthly', label: 'Monthly', freq: 'This Month' },
    },
    document: { getElementById: id => elements.get(id) || elements.set(id, element()).get(id) },
    localStorage: storage,
    getScanClientId: () => 'crash-harness-client',
    escAttr: value => String(value),
    escHtml: value => String(value),
    setEl: (id, value) => {
      if (!elements.has(id)) elements.set(id, element());
      elements.get(id).innerHTML = value;
    },
    a3ClosingText: value => value,
    a3Text: key => key,
    trackSplashLensEvent: () => {},
    globalThis: {},
  });
  vm.runInContext(short ? shortSource : source, context);
  context.initGuide();
  context.switchClType('closing');
  return { context, state, elements };
}

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

function snapshot(session, storage, key) {
  const decoded = session.context.decodeChecklistRecord(storage.getItem(key));
  assert.equal(decoded.state, 'ok', key);
  return plain(decoded.value);
}

function withAction(state, action) {
  const next = JSON.parse(JSON.stringify(state));
  if (action.kind === 'toggle') next[`${action.pi}-${action.si}`] = !next[`${action.pi}-${action.si}`];
  else next._photos = { ...(next._photos || {}), [action.key]: action.value };
  return next;
}

function assertSavedUi(session, recovered, phases, short) {
  const html = session.elements.get('checklist-content').innerHTML;
  const rendered = new Map();
  for (const match of html.matchAll(/id="cli-(\d+-\d+)" class="cl-item( done)?"/g)) rendered.set(match[1], Boolean(match[2]));
  let total = 0;
  let done = 0;
  phases.forEach((phase, pi) => {
    phase.steps.forEach((_, si) => {
      total += 1;
      const key = `${pi}-${si}`;
      const saved = !!recovered[key];
      if (saved) done += 1;
      assert.equal(rendered.get(key), saved, `${key} rendered as saved without a durable check`);
    });
  });
  assert.equal(session.elements.get('progress-text').innerHTML, `${done} / ${total}`);
  assert.equal(session.elements.get('progress-text').style.color, done === total && total > 0 ? '#166534' : '#0369a1');
  const proof = session.elements.get('closing-proof-content');
  if (short) {
    assert.equal(proof.hidden, true);
    assert.equal(proof.innerHTML.includes('textClosingProofPacket'), false);
    return;
  }
  const photos = PHOTO_KEYS.filter(key => String(recovered._photos?.[key] || '').trim()).length;
  assert.equal(proof.innerHTML.includes('textClosingProofPacket'), done === total && photos === PHOTO_KEYS.length);
}

test('closing checklist survives 500 mid-save kills without losing progress or showing a false saved state', () => {
  for (let i = 0; i < 500; i++) {
    const short = i % 5 === 0;
    const phases = short ? SHORT_PHASES : FULL_PHASES;
    const key = short ? 'poolens-cl-closing-short-v1' : 'poolens-cl-closing';
    const storage = createStorage();
    const preservedFull = JSON.stringify({ '0-0': true, kept: `full-${i}` });
    if (short) storage.setItem('poolens-cl-closing', preservedFull);

    const commit = boot(storage, { short });
    if (short) {
      commit.context.toggleItem(0, 0);
      commit.context.toggleItem(1, 0);
      commit.context.toggleItem(2, 0);
    } else {
      commit.context.toggleItem(0, 0);
      commit.context.setClosingPhotoReference('cover', 'cover.jpg');
      commit.context.setClosingPhotoReference('plugs', 'plugs.jpg');
      commit.context.setClosingPhotoReference('equipment', 'equipment.jpg');
      if (i % 4 === 0) commit.context.setClosingPhotoReference('chemistry', `chem-${i}.jpg`);
    }
    const committed = snapshot(commit, storage, key);
    const action = short
      ? { kind: 'toggle', pi: i % 3 === 2 ? 1 : 3, si: 0 }
      : (i % 3 === 1
        ? { kind: 'photo', key: 'chemistry', value: `note-${i}.jpg` }
        : { kind: 'toggle', pi: 0, si: i % 3 === 2 ? 0 : 1 });
    const intended = withAction(committed, action);
    const phase = i % 3;
    storage.arm(phase, (i * 17) + 3);

    const live = boot(storage, { short });
    let killed = false;
    try {
      if (action.kind === 'toggle') live.context.toggleItem(action.pi, action.si);
      else live.context.setClosingPhotoReference(action.key, action.value);
    } catch (error) {
      assert.equal(error.message, 'killed-mid-save', `iteration ${i}`);
      killed = true;
    }
    if (phase === 0) assert.equal(killed, true, `iteration ${i} did not interrupt the first write`);

    const recoveredSession = boot(storage, { short });
    const recovered = plain(short ? recoveredSession.state.checklists.closingShort : recoveredSession.state.checklists.closing);
    const same = candidate => JSON.stringify(candidate) === JSON.stringify(recovered);
    assert.equal(same(committed) || same(intended), true, `iteration ${i} kept a partial checklist`);
    if (phase === 0 || !killed) assert.deepEqual(recovered, phase === 0 ? committed : intended, `iteration ${i}`);
    assert.deepEqual(snapshot(recoveredSession, storage, key), recovered, `iteration ${i} memory disagreed with storage`);
    assert.equal(storage.getItem(`${key}.pending`), null, `iteration ${i} left a journal behind`);
    assertSavedUi(recoveredSession, recovered, phases, short);
    if (short) assert.equal(storage.getItem('poolens-cl-closing'), preservedFull, `iteration ${i} clobbered the full checklist`);
  }
});
