import assert from 'node:assert/strict';
import test from 'node:test';

import { eventSource, eventUserProfile, shouldQueueImmediateAlert } from '../functions/api/events.js';

class MemoryKv {
  constructor() {
    this.store = new Map();
  }

  async get(key) {
    return this.store.get(key) || null;
  }

  async put(key, value) {
    this.store.set(key, value);
  }
}

function weakPartSnapRecord(overrides = {}) {
  const props = {
    client_id: '818085ca-e665-4218-b0a6-aa246836b0e0',
    session_id: 'session-msx0c433-818085ca',
    store_shell: 'ios',
    standalone: true,
    splashlens_role: 'tech',
    confidence: 'low',
    risk: 'high',
    component: 'unknown',
    proof_visible_count: 0,
    proof_missing_count: 3,
    corpus_status: 'ai-only',
    corpus_candidate_count: 0,
    proof_visible: [],
    proof_missing: ['clear pool-part photo', 'equipment model plate', 'visible component details'],
    result_summary: 'unknown',
    ...overrides,
  };
  return {
    correlationId: 'event-test',
    event: 'partsnap_result',
    source: 'app',
    path: '/?store=ios',
    createdAt: '2026-08-17T09:06:34.352Z',
    propsJson: JSON.stringify(props),
  };
}

test('role-only PartSnap alerts stay anonymous instead of saying known user', () => {
  const record = weakPartSnapRecord();
  const props = JSON.parse(record.propsJson);
  assert.equal(eventUserProfile(record, props), null);
});

test('iOS native shell becomes a useful app source label', () => {
  const record = weakPartSnapRecord();
  const props = JSON.parse(record.propsJson);
  assert.equal(eventSource(record, props), 'ios_app');
});

test('repeated weak unknown PartSnap results are deduped per session', async () => {
  const env = { SCAN_USAGE_KV: new MemoryKv() };
  const first = await shouldQueueImmediateAlert(weakPartSnapRecord(), env);
  const second = await shouldQueueImmediateAlert(weakPartSnapRecord({ proof_missing: ['clear pool-part photo', 'equipment model plate', 'part markings or branding'] }), env);
  assert.equal(first.ok, true);
  assert.equal(second.ok, false);
  assert.equal(second.reason, 'duplicate_weak_partsnap_result');
});

test('source-backed or identified PartSnap results are not weak-result deduped', async () => {
  const env = { SCAN_USAGE_KV: new MemoryKv() };
  const first = await shouldQueueImmediateAlert(weakPartSnapRecord({
    confidence: 'medium',
    risk: 'medium',
    component: 'pump lid',
    proof_visible_count: 2,
    proof_missing_count: 0,
    corpus_status: 'source-backed candidates',
    corpus_candidate_count: 2,
    result_summary: 'Pentair / pump lid',
  }), env);
  const second = await shouldQueueImmediateAlert(weakPartSnapRecord({
    confidence: 'medium',
    risk: 'medium',
    component: 'pump lid',
    proof_visible_count: 2,
    proof_missing_count: 0,
    corpus_status: 'source-backed candidates',
    corpus_candidate_count: 2,
    result_summary: 'Pentair / pump lid',
  }), env);
  assert.equal(first.ok, true);
  assert.equal(second.ok, true);
});
