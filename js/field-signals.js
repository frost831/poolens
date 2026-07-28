import {
  DEFAULT_FIELD_SIGNAL_PREFERENCES,
  DOE_PUMP_MOTOR_SOURCE,
  buildContextualFieldSignals,
  buildPumpCustomerSummary,
  calculatePumpDecision,
  classifyFieldContext,
  isFieldSignalEligible,
  normalizeFieldSignalPreferences,
  pumpProofChecklist,
} from './field-signals-core.mjs';

const PREFS_KEY = 'splashlens-field-signal-preferences-v1';
const HISTORY_KEY = 'splashlens-field-signal-history-v1';
const FEED_KEY = 'splashlens-field-signal-feed-v1';
const OFFER_KEY = 'splashlens-field-signal-permission-offer-v1';
const SCHEDULE_KEY = 'splashlens-field-signal-scheduled-v1';
const FEED_URL = '/data/field-signals/current.json';
const MODULE_VERSION = '2026-07-28';

let currentSignal = null;
let currentContext = {};
let latestPumpResult = null;
let modalReturnFocus = null;

function track(event, props = {}) {
  if (typeof window.trackSplashLensEvent === 'function') {
    window.trackSplashLensEvent(event, { module_version: MODULE_VERSION, ...props });
  }
}

function readJson(key, fallback) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || 'null');
    return parsed && typeof parsed === 'object' ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

function preferences() {
  return normalizeFieldSignalPreferences(readJson(PREFS_KEY, DEFAULT_FIELD_SIGNAL_PREFERENCES));
}

function savePreferences(next, source = 'settings') {
  const normalized = normalizeFieldSignalPreferences(next);
  writeJson(PREFS_KEY, normalized);
  syncWorkerPreferences(normalized);
  track('field_signal_settings_changed', {
    source,
    system_notifications: normalized.systemNotifications,
    max_daily: normalized.maxDaily,
    max_weekly: normalized.maxWeekly,
    proof: normalized.categories.proof,
    efficiency: normalized.categories.efficiency,
    equipment_updates: normalized.categories.equipmentUpdates,
    training: normalized.categories.training,
    safety: normalized.categories.safety,
  });
  return normalized;
}

function history() {
  const value = readJson(HISTORY_KEY, {});
  return {
    inlineShownAt: Array.isArray(value.inlineShownAt) ? value.inlineShownAt : [],
    systemShownAt: Array.isArray(value.systemShownAt) ? value.systemShownAt : [],
    dismissedUntil: value.dismissedUntil && typeof value.dismissedUntil === 'object' ? value.dismissedUntil : {},
    completedAt: value.completedAt && typeof value.completedAt === 'object' ? value.completedAt : {},
  };
}

function saveHistory(value) {
  const trimmed = {
    ...value,
    inlineShownAt: (value.inlineShownAt || []).slice(-100),
    systemShownAt: (value.systemShownAt || []).slice(-100),
  };
  writeJson(HISTORY_KEY, trimmed);
}

function esc(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function money(value) {
  return Number.isFinite(value) ? `$${Math.round(value).toLocaleString('en-US')}` : 'Need inputs';
}

function decimal(value, places = 1) {
  return Number.isFinite(value) ? Number(value).toFixed(places) : 'Need inputs';
}

function inlineHost() {
  return document.getElementById('field-signal-inline');
}

function modalElements() {
  return {
    root: document.getElementById('field-signals-modal'),
    title: document.getElementById('field-signals-modal-title'),
    body: document.getElementById('field-signals-modal-body'),
  };
}

function setBadge(count) {
  const badge = document.getElementById('field-signals-badge');
  if (!badge) return;
  badge.textContent = String(Math.max(0, count));
  badge.style.display = count > 0 ? 'grid' : 'none';
}

function markShown(signal, channel = 'inline') {
  const state = history();
  const key = channel === 'system' ? 'systemShownAt' : 'inlineShownAt';
  state[key].push(new Date().toISOString());
  saveHistory(state);
  track('field_signal_shown', {
    signal_id: signal.id,
    category: signal.category,
    channel,
    equipment_type: signal.equipmentType || '',
    source_id: signal.source?.id || '',
  });
}

function renderInlineSignal(signal, context = {}, placement = 'workflow') {
  const host = inlineHost();
  if (!host || !signal) return;
  currentSignal = signal;
  currentContext = context;
  const source = signal.source;
  host.innerHTML = `
    <article class="field-signal-card" data-signal-id="${esc(signal.id)}">
      <div class="field-signal-head">
        <span class="field-signal-kicker">Field Signal</span>
        <button type="button" class="field-signal-icon-btn" aria-label="Dismiss this signal" title="Dismiss" onclick="SplashLensFieldSignals.dismissCurrent(7)">x</button>
      </div>
      <h2>${esc(signal.title)}</h2>
      <p>${esc(signal.body)}</p>
      ${source ? `<p class="field-signal-source">Source checked ${esc(source.verifiedAt || '')}: <a href="${esc(source.url)}" target="_blank" rel="noopener">${esc(source.label || 'View source')}</a></p>` : ''}
      <div class="field-signal-actions">
        <button type="button" class="primary" onclick="SplashLensFieldSignals.runCurrentAction()">${esc(signal.actionLabel || 'Open')}</button>
        <button type="button" onclick="SplashLensFieldSignals.dismissCurrent(30)">Not relevant</button>
      </div>
    </article>`;
  host.style.display = '';
  setBadge(1);
  markShown(signal, 'inline');
  track('field_signal_context_match', {
    signal_id: signal.id,
    category: signal.category,
    placement,
    context_source: context.source || '',
  });
}

function chooseAndRender(signals, context = {}, placement = 'workflow') {
  const prefs = preferences();
  const state = history();
  const signal = signals.find((candidate) => isFieldSignalEligible(candidate, prefs, state, { channel: 'inline' }).eligible);
  if (signal && currentSignal?.id === signal.id) return;
  if (signal) renderInlineSignal(signal, context, placement);
}

function hideInline() {
  const host = inlineHost();
  if (host) {
    host.innerHTML = '';
    host.style.display = 'none';
  }
  currentSignal = null;
  setBadge(0);
}

function dismissCurrent(days = 7) {
  if (!currentSignal) return;
  const state = history();
  state.dismissedUntil[currentSignal.id] = new Date(Date.now() + Number(days || 7) * 86400000).toISOString();
  saveHistory(state);
  track('field_signal_dismissed', {
    signal_id: currentSignal.id,
    category: currentSignal.category,
    snooze_days: Number(days || 7),
  });
  hideInline();
}

function completeSignal(signalId) {
  if (!signalId) return;
  const state = history();
  state.completedAt[signalId] = new Date().toISOString();
  saveHistory(state);
}

function runAction(signal, context = {}) {
  if (!signal) return;
  track('field_signal_action', {
    signal_id: signal.id,
    category: signal.category,
    action: signal.action,
  });
  if (signal.action === 'pump-decision') {
    openPumpDecision(context);
  } else if (signal.action === 'pump-proof') {
    openPumpProofChecklist(context);
  } else if (signal.action === 'partsnap-proof') {
    if (typeof window.requestPartSnapSecondProof === 'function') window.requestPartSnapSecondProof();
  } else if (signal.action === 'saved-equipment') {
    if (typeof window.showTab === 'function') window.showTab('pools');
  }
  completeSignal(signal.id);
}

function runCurrentAction() {
  runAction(currentSignal, currentContext);
}

function openModal(title, html) {
  const { root, title: titleElement, body } = modalElements();
  if (!root || !titleElement || !body) return;
  modalReturnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  titleElement.textContent = title;
  body.innerHTML = html;
  root.classList.add('open');
  root.setAttribute('aria-hidden', 'false');
  document.body.classList.add('field-signals-modal-open');
  root.querySelector('button, input, select')?.focus();
}

function closeModal() {
  const { root } = modalElements();
  if (!root) return;
  root.classList.remove('open');
  root.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('field-signals-modal-open');
  modalReturnFocus?.focus?.();
  modalReturnFocus = null;
}

function trapModalFocus(event) {
  if (event.key !== 'Tab') return;
  const { root } = modalElements();
  if (!root?.classList.contains('open')) return;
  const focusable = [...root.querySelectorAll('button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')]
    .filter(element => element.offsetParent !== null);
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

function pumpContextValue(context, key, fallback = '') {
  return esc(context?.[key] ?? fallback);
}

function openPumpDecision(context = {}) {
  currentContext = { ...currentContext, ...context };
  track('pump_decision_started', {
    source: context.source || currentContext.source || 'field_signal',
    manufacturer: context.manufacturer || context.brand || '',
    model: context.model || '',
  });
  openModal('Pump decision assist', `
    <section class="pump-decision-intro">
      <strong>Compare. Do not guess.</strong>
      <p>Use the figures from this job. SplashLens will not assume an energy-savings percentage or tell the customer that a working pump must be replaced.</p>
    </section>
    <form id="pump-decision-form" onsubmit="event.preventDefault();SplashLensFieldSignals.calculatePump()">
      <div class="field-signal-form-grid">
        <label>Manufacturer<input id="pump-decision-manufacturer" value="${pumpContextValue(currentContext, 'manufacturer', currentContext.brand || '')}" placeholder="Manufacturer"></label>
        <label>Model<input id="pump-decision-model" value="${pumpContextValue(currentContext, 'model')}" placeholder="Exact model"></label>
        <label>Speed type<select id="pump-decision-speed"><option value="unknown">Unknown</option><option value="single-speed">Single speed</option><option value="two-speed">Two speed</option><option value="variable-speed">Variable speed</option></select></label>
        <label>THP<input id="pump-decision-thp" type="number" min="0" step="0.01" value="${pumpContextValue(currentContext, 'thp')}" placeholder="From plate"></label>
        <label>Repair figure ($)<input id="pump-decision-repair" type="number" min="0" step="1" placeholder="0"></label>
        <label>Replacement figure ($)<input id="pump-decision-replacement" type="number" min="0" step="1" placeholder="0"></label>
        <label>Current average watts<input id="pump-decision-current-watts" type="number" min="0" step="1" placeholder="Measured / documented"></label>
        <label>Proposed average watts<input id="pump-decision-proposed-watts" type="number" min="0" step="1" placeholder="Manufacturer / design"></label>
        <label>Run hours per day<input id="pump-decision-hours" type="number" min="0" max="24" step="0.1" placeholder="Current schedule"></label>
        <label>Operating days per year<input id="pump-decision-days" type="number" min="0" max="366" step="1" placeholder="365"></label>
        <label>Electric rate ($/kWh)<input id="pump-decision-rate" type="number" min="0" step="0.001" placeholder="Customer bill"></label>
        <label>Energy input basis<select id="pump-decision-basis"><option value="unknown">Not verified</option><option value="measured">Measured</option><option value="manufacturer">Manufacturer documentation</option></select></label>
      </div>
      <button class="field-signal-full-action" type="submit">Compare repair and replacement</button>
    </form>
    <div id="pump-decision-result"></div>
    <div class="field-signal-source-box">
      <strong>Rule context, not a sales claim</strong>
      <p>Federal motor standards and enforcement timing vary by motor size, manufacturing date, and product class. They do not automatically require replacing every operating pump.</p>
      <a href="${DOE_PUMP_MOTOR_SOURCE.url}" target="_blank" rel="noopener">DOE standards</a>
      <a href="${DOE_PUMP_MOTOR_SOURCE.secondaryUrl}" target="_blank" rel="noopener">DOE enforcement policy</a>
      <span>Source checked ${DOE_PUMP_MOTOR_SOURCE.verifiedAt}</span>
    </div>`);
}

function formValue(id) {
  return document.getElementById(id)?.value || '';
}

function pumpFormInput() {
  return {
    manufacturer: formValue('pump-decision-manufacturer').trim(),
    model: formValue('pump-decision-model').trim(),
    speedType: formValue('pump-decision-speed'),
    thp: formValue('pump-decision-thp'),
    repairCost: formValue('pump-decision-repair'),
    replacementCost: formValue('pump-decision-replacement'),
    currentWatts: formValue('pump-decision-current-watts'),
    proposedWatts: formValue('pump-decision-proposed-watts'),
    hoursPerDay: formValue('pump-decision-hours'),
    daysPerYear: formValue('pump-decision-days'),
    electricityRate: formValue('pump-decision-rate'),
    inputBasis: formValue('pump-decision-basis'),
  };
}

function calculatePump() {
  const input = pumpFormInput();
  const result = calculatePumpDecision(input);
  const summary = buildPumpCustomerSummary(input, result);
  latestPumpResult = { input, result, summary };
  const output = document.getElementById('pump-decision-result');
  if (!output) return;
  output.innerHTML = `
    <section class="pump-decision-result">
      <div class="pump-decision-metrics">
        <div><span>Repair</span><strong>${result.repairCost ? money(result.repairCost) : 'Need figure'}</strong></div>
        <div><span>Replacement</span><strong>${result.replacementCost ? money(result.replacementCost) : 'Need figure'}</strong></div>
        <div><span>Annual difference</span><strong>${money(result.annualSavings)}</strong></div>
        <div><span>Simple payback</span><strong>${Number.isFinite(result.simplePaybackYears) ? `${decimal(result.simplePaybackYears)} years` : 'Need inputs'}</strong></div>
      </div>
      ${!result.hasEnergyInputs ? '<p class="pump-decision-warning">No energy-savings figure is shown until both wattages, the schedule, and electric rate are entered.</p>' : ''}
      ${result.inputsAreIllustrative && result.hasEnergyInputs ? '<p class="pump-decision-warning">These energy inputs are not marked as measured or manufacturer-documented. Present them as an estimate only.</p>' : ''}
      <div class="pump-customer-summary"><strong>Customer-ready explanation</strong><p>${esc(summary)}</p></div>
      <div class="field-signal-actions three">
        <button class="primary" type="button" onclick="SplashLensFieldSignals.copyPumpSummary()">Copy explanation</button>
        <button type="button" onclick="SplashLensFieldSignals.addPumpSummaryToReport()">Add to visit report</button>
        <button type="button" onclick="SplashLensFieldSignals.openPumpProofChecklist()">Proof checklist</button>
      </div>
    </section>`;
  track('pump_decision_completed', {
    has_repair_figure: result.repairCost > 0,
    has_replacement_figure: result.replacementCost > 0,
    has_energy_inputs: result.hasEnergyInputs,
    input_basis: input.inputBasis,
    speed_type: input.speedType,
    thp: input.thp || '',
    payback_available: Number.isFinite(result.simplePaybackYears),
  });
  completeSignal('pump-repair-upgrade-decision');
}

async function copyText(value) {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    const area = document.createElement('textarea');
    area.value = value;
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    const copied = document.execCommand('copy');
    area.remove();
    return copied;
  }
}

async function copyPumpSummary() {
  if (!latestPumpResult) calculatePump();
  if (!latestPumpResult) return;
  const copied = await copyText(latestPumpResult.summary);
  track('pump_customer_summary_copied', { copied });
  const button = document.querySelector('.pump-decision-result .field-signal-actions .primary');
  if (button && copied) button.textContent = 'Copied';
}

function addPumpSummaryToReport() {
  if (!latestPumpResult) calculatePump();
  if (!latestPumpResult) return;
  closeModal();
  if (typeof window.showTab === 'function') window.showTab('report');
  const recommendations = document.getElementById('rpt-rec');
  const customerSummary = document.getElementById('rpt-customer-summary');
  if (recommendations) recommendations.value = [recommendations.value, latestPumpResult.summary].filter(Boolean).join('\n\n');
  if (customerSummary && !customerSummary.value.trim()) customerSummary.value = latestPumpResult.summary;
  track('pump_customer_summary_added_to_report', {
    has_customer_summary_field: Boolean(customerSummary),
  });
}

function openPumpProofChecklist(context = currentContext) {
  const checks = pumpProofChecklist();
  openModal('Pump proof checklist', `
    <section class="pump-decision-intro">
      <strong>Get the proof before the truck moves.</strong>
      <p>This checklist supports a cleaner quote, order, or escalation. It does not confirm fitment or diagnose the pump.</p>
    </section>
    <div class="pump-proof-list">
      ${checks.map((item, index) => `<label><input type="checkbox" data-pump-proof="${index}"><span><b>${index + 1}</b>${esc(item)}</span></label>`).join('')}
    </div>
    <div class="field-signal-actions">
      <button class="primary" type="button" onclick="SplashLensFieldSignals.finishPumpProof()">Proof captured</button>
      <button type="button" onclick="SplashLensFieldSignals.openPartSnapProof()">Open PartSnap</button>
    </div>`);
  track('pump_proof_checklist_opened', {
    source: context?.source || 'field_signal',
  });
}

function finishPumpProof() {
  const checked = document.querySelectorAll('[data-pump-proof]:checked').length;
  track('pump_proof_checklist_completed', { checked_count: checked, total_count: pumpProofChecklist().length });
  completeSignal('pump-before-you-leave-proof');
  closeModal();
}

function openPartSnapProof() {
  closeModal();
  if (typeof window.showTab === 'function') window.showTab('scan');
  setTimeout(() => {
    if (typeof window.setScanMode === 'function') window.setScanMode('parts');
  }, 80);
}

function categoryLabel(key) {
  return {
    proof: 'Before-you-leave proof',
    efficiency: 'Repair / upgrade opportunities',
    equipmentUpdates: 'Manual and equipment updates',
    training: 'Short field lessons',
    safety: 'Verified safety notices',
  }[key] || key;
}

function openSignalCenter() {
  const prefs = preferences();
  const permission = nativeNotificationBridgeAvailable()
    ? 'Available in the iOS app'
    : ('Notification' in window ? Notification.permission : 'Not supported here');
  openModal('Field Signals', `
    <section class="field-signal-settings-intro">
      <strong>Useful at the stop. Quiet everywhere else.</strong>
      <p>In-app signals stay contextual. System notifications are optional and default to no more than ${prefs.maxWeekly} per week.</p>
    </section>
    <div class="field-signal-setting-row system">
      <div><strong>System notifications</strong><span>${esc(permission)}. No email-open alerts and no generic engagement reminders.</span></div>
      <button type="button" class="${prefs.systemNotifications ? 'on' : ''}" onclick="SplashLensFieldSignals.requestSystemNotifications()">${prefs.systemNotifications ? 'On' : 'Enable'}</button>
    </div>
    <div class="field-signal-setting-list">
      ${Object.keys(prefs.categories).map((key) => `
        <label class="field-signal-setting-row">
          <span><strong>${esc(categoryLabel(key))}</strong><small>${key === 'training' ? 'Off by default' : 'On by default'}</small></span>
          <input type="checkbox" ${prefs.categories[key] ? 'checked' : ''} onchange="SplashLensFieldSignals.setCategory('${key}',this.checked)">
        </label>`).join('')}
    </div>
    <div class="field-signal-frequency">
      <label>System-alert limit
        <select onchange="SplashLensFieldSignals.setFrequency(this.value)">
          <option value="quiet" ${prefs.maxWeekly === 1 ? 'selected' : ''}>Quiet - 1 per week</option>
          <option value="standard" ${prefs.maxWeekly === 2 ? 'selected' : ''}>Standard - 2 per week</option>
          <option value="active" ${prefs.maxWeekly >= 3 ? 'selected' : ''}>Active - 3 per week</option>
        </select>
      </label>
      <p>Quiet hours: ${esc(prefs.quietStart)} to ${esc(prefs.quietEnd)}. Verified urgent safety notices are the only exception.</p>
    </div>
    <div class="field-signal-actions">
      ${prefs.systemNotifications ? '<button class="primary" type="button" onclick="SplashLensFieldSignals.sendSampleNotification()">Send sample</button>' : ''}
      <button type="button" onclick="SplashLensFieldSignals.disableSystemNotifications()">Turn system alerts off</button>
    </div>
    <p class="field-signal-privacy">Preferences and saved equipment stay on this device. Notification actions are tracked in aggregate so SplashLens can remove signals techs ignore.</p>`);
  track('field_signal_center_opened', {
    system_notifications: prefs.systemNotifications,
    permission,
  });
}

function setCategory(key, enabled) {
  const prefs = preferences();
  if (!(key in prefs.categories)) return;
  prefs.categories[key] = Boolean(enabled);
  savePreferences(prefs, 'category_toggle');
}

function setFrequency(mode) {
  const prefs = preferences();
  const limits = {
    quiet: { maxDaily: 1, maxWeekly: 1 },
    standard: { maxDaily: 1, maxWeekly: 2 },
    active: { maxDaily: 1, maxWeekly: 3 },
  }[mode] || { maxDaily: 1, maxWeekly: 2 };
  Object.assign(prefs, limits);
  savePreferences(prefs, 'frequency');
}

function nativeNotificationBridgeAvailable() {
  return Boolean(window.webkit?.messageHandlers?.splashlensNotifications);
}

async function requestSystemNotifications() {
  track('field_signal_permission_requested', {
    channel: nativeNotificationBridgeAvailable() ? 'ios_native' : 'web',
  });
  if (nativeNotificationBridgeAvailable()) {
    window.webkit.messageHandlers.splashlensNotifications.postMessage({ action: 'request' });
    return;
  }
  if (!('Notification' in window)) {
    showSettingsStatus('System notifications are not supported in this browser. In-app Field Signals still work.');
    track('field_signal_permission_result', { result: 'unsupported', channel: 'web' });
    return;
  }
  const result = await Notification.requestPermission();
  applyPermissionResult(result === 'granted', result, 'web');
}

function nativePermissionResult(granted, status = '') {
  applyPermissionResult(Boolean(granted), status || (granted ? 'granted' : 'denied'), 'ios_native');
}

function applyPermissionResult(granted, status, channel) {
  const prefs = preferences();
  prefs.systemNotifications = granted;
  savePreferences(prefs, 'permission_result');
  track('field_signal_permission_result', { result: status, granted, channel });
  if (granted) registerPeriodicSignalCheck();
  openSignalCenter();
}

function disableSystemNotifications() {
  const prefs = preferences();
  prefs.systemNotifications = false;
  savePreferences(prefs, 'disabled');
  if (nativeNotificationBridgeAvailable()) {
    window.webkit.messageHandlers.splashlensNotifications.postMessage({ action: 'cancelAll' });
  }
  writeJson(SCHEDULE_KEY, {});
  track('field_signal_system_disabled', {});
  openSignalCenter();
}

function showSettingsStatus(message) {
  const body = document.getElementById('field-signals-modal-body');
  if (!body) return;
  body.insertAdjacentHTML('afterbegin', `<p class="field-signal-status">${esc(message)}</p>`);
}

async function sendSampleNotification() {
  const sample = {
    id: 'field-signal-sample',
    category: 'proof',
    title: 'SplashLens Field Signal',
    body: 'Before you leave: capture the model plate and one wide equipment photo.',
    action: 'pump-proof',
    actionLabel: 'Open proof checklist',
  };
  const sent = await showSystemNotification(sample, { test: true });
  track('field_signal_sample_sent', { sent });
}

async function showSystemNotification(signal, options = {}) {
  const state = history();
  const gate = isFieldSignalEligible(signal, preferences(), state, { channel: 'system' });
  if (!options.test && !gate.eligible) return false;
  if (nativeNotificationBridgeAvailable()) {
    window.webkit.messageHandlers.splashlensNotifications.postMessage({
      action: 'schedule',
      id: signal.id,
      title: signal.title,
      body: signal.body,
      fireAt: new Date(Date.now() + 1500).toISOString(),
      deepLink: `https://app.splashlens.com/?field_signal=${encodeURIComponent(signal.id)}&tab=errors`,
    });
    if (!options.test) markShown(signal, 'system');
    return true;
  }
  if (!('serviceWorker' in navigator) || Notification.permission !== 'granted') return false;
  const registration = await navigator.serviceWorker.ready;
  registration.active?.postMessage({ type: 'SPLASHLENS_SHOW_FIELD_SIGNAL', signal });
  if (!options.test) markShown(signal, 'system');
  return true;
}

function syncWorkerPreferences(prefs = preferences()) {
  if (!('serviceWorker' in navigator)) return;
  navigator.serviceWorker.ready.then((registration) => {
    registration.active?.postMessage({ type: 'SPLASHLENS_FIELD_SIGNAL_PREFS', preferences: prefs });
  }).catch(() => {});
}

async function registerPeriodicSignalCheck() {
  if (!('serviceWorker' in navigator)) return false;
  try {
    const registration = await navigator.serviceWorker.ready;
    if (!registration.periodicSync) return false;
    await registration.periodicSync.register('splashlens-field-signals', { minInterval: 24 * 60 * 60 * 1000 });
    track('field_signal_periodic_check_registered', { supported: true });
    return true;
  } catch (error) {
    track('field_signal_periodic_check_registered', { supported: false, reason: String(error?.name || 'error') });
    return false;
  }
}

async function checkFeed(options = {}) {
  try {
    const response = await fetch(FEED_URL, { headers: { accept: 'application/json' } });
    if (!response.ok) return;
    const payload = await response.json();
    const items = Array.isArray(payload.items) ? payload.items : [];
    const baseline = readJson(FEED_KEY, { ids: [], checkedAt: '' });
    const known = new Set(Array.isArray(baseline.ids) ? baseline.ids : []);
    writeJson(FEED_KEY, { ids: items.map((item) => item.id), checkedAt: new Date().toISOString() });
    if (!baseline.checkedAt || options.baselineOnly) return;
    const newItem = items.find((item) => item.notificationEligible && !known.has(item.id));
    if (!newItem) return;
    const signal = {
      ...newItem,
      category: newItem.category === 'equipment' ? 'equipmentUpdates' : newItem.category,
      source: newItem.source ? { ...newItem.source, verifiedAt: newItem.verifiedAt, id: newItem.id } : null,
    };
    chooseAndRender([signal], { source: 'field_signal_feed' }, 'equipment_update');
    if (document.visibilityState === 'hidden') await showSystemNotification(signal);
  } catch {}
}

function offerSystemNotificationsAfterValue(source = 'saved_value') {
  const prefs = preferences();
  if (prefs.systemNotifications) return;
  const state = readJson(OFFER_KEY, { lastShownAt: '' });
  const last = Date.parse(state.lastShownAt || '');
  if (Number.isFinite(last) && Date.now() - last < 30 * 86400000) return;
  writeJson(OFFER_KEY, { lastShownAt: new Date().toISOString(), source });
  const signal = {
    id: 'field-signal-notification-offer',
    category: 'equipmentUpdates',
    title: 'Want only the alerts that can save a trip?',
    body: 'Opt in for saved-equipment updates, verified safety notices, and due reminders. The default limit is two per week.',
    actionLabel: 'Choose alerts',
    action: 'notification-settings',
    priority: 50,
  };
  currentSignal = signal;
  currentContext = { source };
  const host = inlineHost();
  if (!host) return;
  host.innerHTML = `
    <article class="field-signal-card permission-offer">
      <div class="field-signal-head"><span class="field-signal-kicker">Optional alerts</span><button type="button" class="field-signal-icon-btn" aria-label="Dismiss" onclick="SplashLensFieldSignals.dismissCurrent(30)">x</button></div>
      <h2>${esc(signal.title)}</h2><p>${esc(signal.body)}</p>
      <div class="field-signal-actions"><button class="primary" type="button" onclick="SplashLensFieldSignals.openSignalCenter()">Choose alerts</button><button type="button" onclick="SplashLensFieldSignals.dismissCurrent(30)">Not now</button></div>
    </article>`;
  host.style.display = '';
  markShown(signal, 'inline');
}

function contextSignals(context, placement) {
  const signals = buildContextualFieldSignals(context);
  chooseAndRender(signals, context, placement);
}

function onBrandSelected(context = {}) {
  contextSignals({ ...context, source: 'brand' }, 'brand_selected');
}

function onCodeOpened(context = {}) {
  contextSignals({ ...context, source: 'code' }, 'code_opened');
}

function onSearch(query = '') {
  if (!query || query.trim().length < 3) return;
  contextSignals({ query, source: 'manual_search' }, 'manual_search');
}

function onPartSnapResult(result = {}) {
  const missingProof = Array.isArray(result.missingProof) ? result.missingProof : [];
  contextSignals({
    ...result,
    hardware: result.category || result.component || '',
    missingProof,
    source: 'partsnap',
  }, 'partsnap_result');
}

function onEquipmentSaved(item = {}, poolId = '') {
  const classified = classifyFieldContext(item);
  if (classified.isPump) {
    contextSignals({ ...item, poolId, source: 'saved_equipment' }, 'equipment_saved');
  }
  offerSystemNotificationsAfterValue('equipment_saved');
}

function onPoolViewed(pool = {}) {
  const next = pool.nextVisitReminder || {};
  if (next.date) {
    const due = new Date(`${next.date}T23:59:59`);
    if (Number.isFinite(due.getTime()) && due.getTime() >= Date.now() - 86400000 && due.getTime() <= Date.now() + 2 * 86400000) {
      chooseAndRender([{
        id: `next-visit-${pool.id}`,
        category: 'proof',
        priority: 85,
        title: 'Next-visit reminder',
        body: next.note || `Review the saved proof for ${pool.name || 'this pool'} before the next stop.`,
        actionLabel: 'Review saved pool',
        action: 'saved-equipment',
      }], { poolId: pool.id, source: 'saved_pool' }, 'pool_detail');
      return;
    }
  }
  const pump = (pool.equipmentTree || []).find((item) => classifyFieldContext(item).isPump);
  if (pump) contextSignals({ ...pump, poolId: pool.id, source: 'saved_pool' }, 'pool_detail');
}

function onTabShown(name) {
  if (name === 'pools') {
    const pools = typeof window.getPools === 'function' ? window.getPools() : [];
    const duePool = pools.find((pool) => pool.nextVisitReminder?.date);
    if (duePool) onPoolViewed(duePool);
  }
}

function scheduleNextVisitReminder(poolId, reminder = {}, pool = {}) {
  const prefs = preferences();
  if (!prefs.systemNotifications || !reminder.date || !nativeNotificationBridgeAvailable()) return;
  const fireAt = new Date(`${reminder.date}T08:00:00`);
  if (!Number.isFinite(fireAt.getTime()) || fireAt.getTime() <= Date.now()) return;
  const signalId = `next-visit-${poolId}`;
  const scheduled = readJson(SCHEDULE_KEY, {});
  Object.entries(scheduled).forEach(([id, value]) => {
    if (!Number.isFinite(Date.parse(value)) || Date.parse(value) <= Date.now()) delete scheduled[id];
  });
  delete scheduled[signalId];
  const scheduledTimes = Object.values(scheduled).map(Date.parse).filter(Number.isFinite);
  const day = fireAt.toDateString();
  const daily = scheduledTimes.filter(value => new Date(value).toDateString() === day).length;
  const weekStart = new Date(fireAt);
  weekStart.setDate(fireAt.getDate() - ((fireAt.getDay() + 6) % 7));
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);
  const weekly = scheduledTimes.filter(value => value >= weekStart.getTime() && value < weekEnd.getTime()).length;
  if (daily >= prefs.maxDaily || weekly >= prefs.maxWeekly) {
    track('field_signal_native_reminder_skipped', {
      signal_id: signalId,
      reason: daily >= prefs.maxDaily ? 'daily_cap' : 'weekly_cap',
    });
    return;
  }
  window.webkit.messageHandlers.splashlensNotifications.postMessage({
    action: 'schedule',
    id: signalId,
    title: `SplashLens: ${pool.name || 'next visit'}`,
    body: reminder.note || 'Review the saved proof before the next stop.',
    fireAt: fireAt.toISOString(),
    deepLink: `https://app.splashlens.com/?tab=pools&pool=${encodeURIComponent(poolId)}&field_signal=next-visit`,
  });
  scheduled[signalId] = fireAt.toISOString();
  writeJson(SCHEDULE_KEY, scheduled);
  track('field_signal_native_reminder_scheduled', { signal_id: signalId, has_note: Boolean(reminder.note) });
}

function openPumpDecisionFromEquipment(poolId, itemId) {
  const pools = typeof window.getPools === 'function' ? window.getPools() : [];
  const pool = pools.find((candidate) => candidate.id === poolId);
  const item = (pool?.equipmentTree || []).find((candidate) => candidate.id === itemId) || {};
  openPumpDecision({ ...item, poolId, source: 'saved_equipment' });
}

function runCurrentActionWithSettings() {
  if (currentSignal?.action === 'notification-settings') {
    openSignalCenter();
    return;
  }
  runCurrentAction();
}

function initDeepLink() {
  const params = new URLSearchParams(window.location.search);
  const signalId = params.get('field_signal');
  if (!signalId) return;
  track('field_signal_notification_opened', { signal_id: signalId });
  if (signalId.includes('pump') || signalId === 'doe-pump-motor-2026') {
    setTimeout(() => openPumpDecision({ source: 'notification' }), 300);
  }
}

function init() {
  const initialPreferences = normalizeFieldSignalPreferences(readJson(PREFS_KEY, DEFAULT_FIELD_SIGNAL_PREFERENCES));
  writeJson(PREFS_KEY, initialPreferences);
  syncWorkerPreferences(initialPreferences);
  checkFeed({ baselineOnly: !readJson(FEED_KEY, {}).checkedAt });
  initDeepLink();
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') checkFeed();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeModal();
    trapModalFocus(event);
  });
}

window.SplashLensFieldSignals = {
  addPumpSummaryToReport,
  calculatePump,
  closeModal,
  copyPumpSummary,
  disableSystemNotifications,
  dismissCurrent,
  finishPumpProof,
  nativePermissionResult,
  offerSystemNotificationsAfterValue,
  onBrandSelected,
  onCodeOpened,
  onEquipmentSaved,
  onPartSnapResult,
  onPoolViewed,
  onSearch,
  onTabShown,
  openPartSnapProof,
  openPumpDecision,
  openPumpDecisionFromEquipment,
  openPumpProofChecklist,
  openSignalCenter,
  requestSystemNotifications,
  runCurrentAction: runCurrentActionWithSettings,
  scheduleNextVisitReminder,
  sendSampleNotification,
  setCategory,
  setFrequency,
};

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();
