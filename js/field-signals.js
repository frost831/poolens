const SIGNALS = {
  default: {
    kicker: 'Field signal',
    title: 'Capture proof before you guess.',
    body: 'Use one code, one photo, one model clue, and one note before ordering or escalating.',
    action: 'Open PartSnap',
    tab: 'scan'
  },
  errors: {
    kicker: 'Code lookup',
    title: 'Code first, context second.',
    body: 'After you search the code, add model family, symptom, recent work, and what proof is still missing.',
    action: 'Open reports',
    tab: 'report'
  },
  scan: {
    kicker: 'PartSnap',
    title: 'Second proof beats a confident guess.',
    body: 'Best results come from label/marking plus one wider photo showing where the part came from.',
    action: 'Save proof',
    tab: 'report'
  },
  report: {
    kicker: 'Service proof',
    title: 'Leave the stop with a clean handoff.',
    body: 'Turn the finding into a customer-safe note, senior-tech packet, or vendor packet before the route moves on.',
    action: 'Keep editing',
    tab: 'report'
  },
  route: {
    kicker: 'Connected pad',
    title: 'Smart pools fail in chains.',
    body: 'For pumps, automation, lights, and heaters, note power, comms, relay, app state, and last configuration change.',
    action: 'Open lookup',
    tab: 'errors'
  },
  facility: {
    kicker: 'Facility Assist',
    title: 'Operator questions need fast escalation proof.',
    body: 'Record reading, event type, action taken, who was notified, and what rule/manual still needs verification.',
    action: 'Build packet',
    tab: 'report'
  }
};

function trackSignal(eventName, props = {}) {
  if (typeof window.trackSplashLensEvent === 'function') {
    window.trackSplashLensEvent(eventName, props);
    return;
  }
  if (window.SplashLensAnalytics && typeof window.SplashLensAnalytics.track === 'function') {
    window.SplashLensAnalytics.track(eventName, props);
  }
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

function openTab(tab) {
  if (typeof window.showTab === 'function') window.showTab(tab);
}

function renderSignalCard(signal, context = {}) {
  const card = el('article', 'field-signal-card');
  const head = el('div', 'field-signal-head');
  head.appendChild(el('span', 'field-signal-kicker', signal.kicker || 'Field signal'));
  const close = el('button', 'field-signal-icon-btn', 'x');
  close.type = 'button';
  close.setAttribute('aria-label', 'Dismiss field signal');
  close.addEventListener('click', function () {
    card.remove();
    trackSignal('field_signal_dismissed', context);
  });
  head.appendChild(close);
  card.appendChild(head);
  card.appendChild(el('h2', '', signal.title));
  card.appendChild(el('p', '', signal.body));

  const actions = el('div', 'field-signal-actions');
  const primary = el('button', 'primary', signal.action || 'Open workflow');
  primary.type = 'button';
  primary.addEventListener('click', function () {
    trackSignal('field_signal_action_clicked', Object.assign({ target_tab: signal.tab || 'errors' }, context));
    openTab(signal.tab || 'errors');
  });
  const settings = el('button', '', 'Settings');
  settings.type = 'button';
  settings.addEventListener('click', function () {
    window.SplashLensFieldSignals.openSignalCenter('settings');
  });
  actions.appendChild(primary);
  actions.appendChild(settings);
  card.appendChild(actions);
  return card;
}

function signalForTab(tab) {
  return SIGNALS[tab] || SIGNALS.default;
}

function setBadge(count) {
  const badge = document.getElementById('field-signals-badge');
  if (!badge) return;
  if (count > 0) {
    badge.textContent = String(count);
    badge.style.display = 'grid';
  } else {
    badge.textContent = '0';
    badge.style.display = 'none';
  }
}

function showInline(signal, context = {}) {
  const inline = document.getElementById('field-signal-inline');
  if (!inline) return;
  inline.replaceChildren(renderSignalCard(signal, context));
  inline.style.display = 'block';
  setBadge(1);
  trackSignal('field_signal_inline_shown', context);
}

function modalBody() {
  return document.getElementById('field-signals-modal-body');
}

function openModal(title, cards) {
  const modal = document.getElementById('field-signals-modal');
  const titleNode = document.getElementById('field-signals-modal-title');
  const body = modalBody();
  if (!modal || !body) return;
  if (titleNode) titleNode.textContent = title || 'Field Signals';
  body.replaceChildren();
  cards.forEach(function (card) {
    body.appendChild(card);
  });
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('field-signals-modal-open');
}

function closeModal() {
  const modal = document.getElementById('field-signals-modal');
  if (!modal) return;
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('field-signals-modal-open');
  trackSignal('field_signal_center_closed', {});
}

function openSignalCenter(mode = 'center') {
  const cards = [
    renderSignalCard(SIGNALS.scan, { source: mode, lane: 'partsnap' }),
    renderSignalCard(SIGNALS.route, { source: mode, lane: 'connected_pad' }),
    renderSignalCard(SIGNALS.facility, { source: mode, lane: 'facility' }),
    renderSignalCard(SIGNALS.report, { source: mode, lane: 'service_proof' })
  ];
  openModal('Field Signals', cards);
  setBadge(0);
  trackSignal('field_signal_center_opened', { source: mode });
}

function onTabShown(tab) {
  if (!tab) return;
  if (tab === 'errors' || tab === 'scan' || tab === 'route' || tab === 'report') {
    showInline(signalForTab(tab), { source: 'tab', tab: tab });
  }
}

function onBrandSelected(data = {}) {
  showInline({
    kicker: 'Brand clue',
    title: 'Use the brand, then demand the model proof.',
    body: 'Brand alone is not enough for ordering. Capture model, serial, label, and the old part marking when possible.',
    action: 'Open PartSnap',
    tab: 'scan'
  }, { source: 'brand_selected', brand: String(data.brand || '').slice(0, 80) });
}

function onCodeOpened(data = {}) {
  showInline(SIGNALS.errors, { source: 'code_opened', code: String(data.code || '').slice(0, 40) });
}

function onSearch(query) {
  const value = String(query || '').trim();
  if (value.length < 3) return;
  if (/pump|motor|heater|automation|robot|salt|cell|light|spa|flow|breaker/i.test(value)) {
    showInline(SIGNALS.route, { source: 'search', query: value.slice(0, 60) });
  }
}

function onPoolViewed(pool = {}) {
  trackSignal('field_signal_pool_context_seen', { pool_id: String(pool.id || '').slice(0, 80) });
}

function onEquipmentSaved(item = {}, poolId = '') {
  showInline({
    kicker: 'Saved equipment',
    title: 'Future you just got faster.',
    body: 'Saved model and symptom history can turn the next visit into a cleaner proof packet instead of a fresh search.',
    action: 'Open reports',
    tab: 'report'
  }, {
    source: 'equipment_saved',
    pool_id: String(poolId || '').slice(0, 80),
    hardware: String(item.hardware || '').slice(0, 80)
  });
}

function scheduleNextVisitReminder(poolId, reminder = {}) {
  trackSignal('field_signal_next_visit_reminder_ready', {
    pool_id: String(poolId || '').slice(0, 80),
    has_date: Boolean(reminder.date)
  });
}

function onPartSnapResult(result = {}) {
  showInline({
    kicker: 'PartSnap result',
    title: 'Now turn the result into proof.',
    body: 'Before ordering, save the likely family, missing proof, second photo need, and supplier/vendor packet.',
    action: 'Save proof',
    tab: 'report'
  }, {
    source: 'partsnap_result',
    confidence: String(result.confidence || '').slice(0, 40),
    category: String(result.category || '').slice(0, 80)
  });
}

function offerSystemNotificationsAfterValue(trigger = '') {
  trackSignal('field_signal_notification_offer_eligible', { trigger: String(trigger || '').slice(0, 80) });
  if (!('Notification' in window) || Notification.permission !== 'default') return;
  showInline({
    kicker: 'Light reminders',
    title: 'Only useful field nudges.',
    body: 'Enable browser notifications when you want closing, pump, proof, or next-visit nudges. No generic noise.',
    action: 'Settings',
    tab: 'report'
  }, { source: 'notification_offer', trigger: String(trigger || '').slice(0, 80) });
}

function openPumpDecisionFromEquipment(poolId = '', itemId = '') {
  const intro = el('section', 'pump-decision-intro');
  intro.appendChild(el('strong', '', 'Pump repair or upgrade proof'));
  intro.appendChild(el('p', '', 'Before recommending repair or replacement, capture motor/pump plate, voltage, speed type, age, failure symptom, energy context, and customer objective.'));
  const list = el('div', 'pump-proof-list');
  ['Model and serial plate photo', 'Motor label and horsepower/THP', 'Failure symptom and when it happens', 'Current speed/control setup', 'Customer-safe recommendation note'].forEach(function (text, index) {
    const row = el('p', '', '');
    const num = el('b', '', String(index + 1));
    row.appendChild(num);
    row.appendChild(document.createTextNode(text));
    list.appendChild(row);
  });
  openModal('Pump Decision Helper', [intro, list]);
  trackSignal('pump_decision_helper_opened', {
    pool_id: String(poolId || '').slice(0, 80),
    item_id: String(itemId || '').slice(0, 80)
  });
}

window.SplashLensFieldSignals = {
  openSignalCenter,
  closeModal,
  onTabShown,
  onBrandSelected,
  onCodeOpened,
  onSearch,
  onPoolViewed,
  onEquipmentSaved,
  scheduleNextVisitReminder,
  onPartSnapResult,
  offerSystemNotificationsAfterValue,
  openPumpDecisionFromEquipment
};

setBadge(0);
