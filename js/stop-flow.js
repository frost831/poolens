import { composeProofPacket, shareProofPacket } from './packet-share.js?v=20261009-restart-a4';

export const STOP_LOG_KEY = 'splashlens-stop-log-v1';
export const ACTIVE_STOP_KEY = 'splashlens-active-stop-v1';
const LANGUAGE_KEY = 'splashlens_language_profile';
const MAX_STOPS = 200;

function clean(value, limit) {
  if (typeof value !== 'string') return '';
  return value.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, limit);
}

export function localDay(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function preferredLanguage(storage) {
  try {
    const profile = JSON.parse(storage.getItem(LANGUAGE_KEY) || '{}');
    return profile.preferredLanguage === 'es' ? 'es' : 'en';
  } catch {
    return 'en';
  }
}

function text(storage, key) {
  const language = preferredLanguage(storage);
  const dictionary = globalThis.SplashLensI18N || globalThis.window?.SplashLensI18N;
  return dictionary?.i18nText?.(language, key) || key;
}

function normalizeStop(value) {
  if (!value || typeof value !== 'object') return null;
  const name = clean(value.name, 80);
  const day = typeof value.day === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value.day) ? value.day : '';
  const id = clean(value.id, 40);
  if (!name || !day || !id) return null;
  const followUp = clean(value.followUp, 240);
  const partLabel = clean(value.partLabel, 80);
  const partIdentifiedAt = partLabel ? clean(value.partIdentifiedAt, 40) : '';
  return {
    id,
    name,
    createdAt: clean(value.createdAt, 40),
    day,
    followUp,
    followUpOpen: Boolean(followUp && value.followUpOpen !== false),
    partLabel,
    partIdentifiedAt,
    packetSentAt: clean(value.packetSentAt, 40),
  };
}

export function readStops(storage) {
  try {
    const parsed = JSON.parse(storage.getItem(STOP_LOG_KEY) || '[]');
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizeStop).filter(Boolean).slice(0, MAX_STOPS);
  } catch {
    return [];
  }
}

export function writeStops(storage, stops) {
  storage.setItem(STOP_LOG_KEY, JSON.stringify(stops.slice(0, MAX_STOPS)));
}

export function activeStop(storage) {
  const id = clean(storage.getItem(ACTIVE_STOP_KEY) || '', 40);
  return readStops(storage).find(stop => stop.id === id) || null;
}

export function partLabelFromResult(result = {}) {
  const manufacturer = clean(result.manufacturer, 40);
  const component = clean(result.component, 60);
  const model = clean(result.model, 40);
  return [manufacturer, component || model].filter(Boolean).join(' ').slice(0, 80);
}

export function createStop(storage, { name = '', followUp = '' } = {}, now = new Date()) {
  const cleanName = clean(name, 80);
  if (!cleanName) return { ok: false, reason: 'name_required' };
  const note = clean(followUp, 240);
  const stop = {
    id: `stop-${now.getTime().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    name: cleanName,
    createdAt: now.toISOString(),
    day: localDay(now),
    followUp: note,
    followUpOpen: Boolean(note),
    partLabel: '',
    partIdentifiedAt: '',
    packetSentAt: '',
  };
  writeStops(storage, [stop, ...readStops(storage)]);
  storage.setItem(ACTIVE_STOP_KEY, stop.id);
  return { ok: true, stop };
}

export function attachPart(storage, result = {}, now = new Date()) {
  const current = activeStop(storage);
  const partLabel = partLabelFromResult(result);
  if (!current || !partLabel) return { attached: false, stop: current, partLabel: '' };
  const stop = { ...current, partLabel, partIdentifiedAt: now.toISOString() };
  writeStops(storage, readStops(storage).map(item => item.id === stop.id ? stop : item));
  return { attached: true, stop, partLabel };
}

export function markPacketSent(storage, id, now = new Date()) {
  const sentAt = now.toISOString();
  const stops = readStops(storage).map(stop => stop.id === id ? { ...stop, packetSentAt: sentAt } : stop);
  writeStops(storage, stops);
  return stops.find(stop => stop.id === id) || null;
}

export function setFollowUpOpen(storage, id, open) {
  const stops = readStops(storage).map(stop => {
    if (stop.id !== id || !stop.followUp) return stop;
    return { ...stop, followUpOpen: Boolean(open) };
  });
  writeStops(storage, stops);
  return stops.find(stop => stop.id === id) || null;
}

const PACKET_LABELS = {
  en: { possible: 'Possible part', none: 'No part identified on this stop yet.', verify: 'Verify the nameplate and the current manual before ordering.' },
  es: { possible: 'Posible pieza', none: 'Aún no hay una pieza identificada en esta visita.', verify: 'Verifica la placa y el manual vigente antes de pedir.' },
};

export function customerPacket(stop, language = 'en', labels = PACKET_LABELS[language === 'es' ? 'es' : 'en']) {
  const summary = [stop?.name, stop?.partLabel ? `${labels.possible}: ${stop.partLabel}` : labels.none].filter(Boolean).join('. ');
  return composeProofPacket({
    language: language === 'es' ? 'es' : 'en',
    kind: 'proof',
    summary,
    evidence: labels.verify,
  });
}

function element(doc, tag, className, textContent) {
  const node = doc.createElement(tag);
  if (className) node.className = className;
  if (textContent) node.textContent = textContent;
  return node;
}

function packetStatusCopy(storage, channel) {
  if (channel === 'sms') return text(storage, 'stop.openedSms');
  if (channel === 'share_sheet') return text(storage, 'stop.openedShare');
  if (channel === 'clipboard') return text(storage, 'stop.copiedSummary');
  return text(storage, 'stop.shareUnavailable');
}

export function createStopFlow({
  storage = globalThis.localStorage,
  document: doc = globalThis.document,
  track = (name, props) => globalThis.trackSplashLensEvent?.(name, props),
  openScan = () => { globalThis.showTab?.('scan'); globalThis.setScanMode?.('parts'); },
  share = shareProofPacket,
  now = () => new Date(),
} = {}) {
  let sharing = false;

  function language() {
    return preferredLanguage(storage);
  }

  function renderPacketActions(parent, stop) {
    parent.replaceChildren();
    const card = element(doc, 'div', 'field-surface-card');
    card.append(
      element(doc, 'p', 'field-kicker', text(storage, 'stop.packetKicker')),
      element(doc, 'p', 'field-title', stop.name),
    );
    const detail = element(doc, 'p', 'field-body', stop.partLabel
      ? `${text(storage, 'stop.possiblePart')}: ${stop.partLabel}`
      : text(storage, 'stop.scanNext'));
    card.append(detail);
    if (stop.partLabel) {
      const button = element(doc, 'button', 'stop-flow-send', text(storage, 'stop.textSummary'));
      button.type = 'button';
      button.addEventListener('click', () => sendPacket(stop.id, detail));
      card.append(button);
    } else {
      const resume = element(doc, 'button', 'stop-flow-send', text(storage, 'stop.resumeScan'));
      resume.type = 'button';
      resume.addEventListener('click', () => {
        track('stop_scan_opened', { source: 'resume' });
        openScan();
      });
      card.append(resume);
    }
    parent.append(card);
    return card;
  }

  function renderForm(parent) {
    parent.replaceChildren();
    const card = element(doc, 'form', 'field-surface-card');
    card.setAttribute('data-stop-form', 'open');
    const name = element(doc, 'input');
    name.type = 'text';
    name.maxLength = 80;
    name.required = true;
    name.setAttribute('aria-label', text(storage, 'stop.nameLabel'));
    name.placeholder = text(storage, 'stop.namePlaceholder');
    const follow = element(doc, 'input');
    follow.type = 'text';
    follow.maxLength = 240;
    follow.setAttribute('aria-label', text(storage, 'stop.followUpLabel'));
    follow.placeholder = text(storage, 'stop.followUpPlaceholder');
    const error = element(doc, 'p', 'field-error', '');
    error.hidden = true;
    const save = element(doc, 'button', 'stop-flow-send', text(storage, 'stop.saveAndScan'));
    save.type = 'submit';
    const cancel = element(doc, 'button', 'stop-flow-secondary', text(storage, 'stop.cancel'));
    cancel.type = 'button';
    cancel.addEventListener('click', () => renderIdle(parent));
    card.addEventListener('submit', event => {
      event.preventDefault();
      const created = createStop(storage, { name: name.value, followUp: follow.value }, now());
      if (!created.ok) {
        error.hidden = false;
        error.textContent = text(storage, 'stop.emptyName');
        name.focus();
        return;
      }
      track('stop_created', { has_follow_up: Boolean(created.stop.followUp) });
      track('stop_scan_opened', { source: 'new_stop' });
      renderPacketActions(parent, created.stop);
      openScan();
    });
    card.append(
      element(doc, 'p', 'field-kicker', text(storage, 'stop.new')),
      element(doc, 'label', 'field-label', text(storage, 'stop.nameLabel')),
      name,
      element(doc, 'label', 'field-label', text(storage, 'stop.followUpLabel')),
      follow,
      error,
      save,
      cancel,
    );
    parent.append(card);
    name.focus();
  }

  function renderIdle(parent) {
    parent.replaceChildren();
    const current = activeStop(storage);
    if (current && localDay(now()) === current.day) {
      renderPacketActions(parent, current);
      return;
    }
    const button = element(doc, 'button', 'counter-action stop-flow-new', text(storage, 'stop.new'));
    button.type = 'button';
    const hint = element(doc, 'span', '', text(storage, 'stop.newHint'));
    button.append(hint);
    button.addEventListener('click', () => {
      track('stop_flow_started', {});
      renderForm(parent);
    });
    parent.append(button);
  }

  function mountPoint(id) {
    return doc?.getElementById?.(id) || null;
  }

  function mount() {
    for (const id of ['stop-flow-mount', 'route-stop-mount']) {
      const parent = mountPoint(id);
      if (parent) renderIdle(parent);
    }
    const current = activeStop(storage);
    if (current?.partLabel) prependScanCard(current);
  }

  function prependScanCard(stop) {
    const result = mountPoint('scan-result');
    if (!result) return;
    const existing = result.querySelector?.('[data-stop-packet]');
    existing?.remove();
    const card = element(doc, 'div', 'field-surface-card stop-packet-card');
    card.setAttribute('data-stop-packet', stop.id);
    const status = element(doc, 'p', 'field-body', `${text(storage, 'stop.possiblePart')}: ${stop.partLabel}. ${text(storage, 'stop.verify')}`);
    const button = element(doc, 'button', 'stop-flow-send', text(storage, 'stop.textSummary'));
    button.type = 'button';
    button.addEventListener('click', () => sendPacket(stop.id, status));
    card.append(element(doc, 'p', 'field-kicker', text(storage, 'stop.packetKicker')), status, button);
    if (typeof result.prepend === 'function') result.prepend(card);
    else result.insertBefore?.(card, result.firstChild || null);
  }

  async function sendPacket(id, statusNode) {
    if (sharing) return;
    const stop = readStops(storage).find(item => item.id === id);
    if (!stop?.partLabel) return;
    sharing = true;
    try {
      const fallback = PACKET_LABELS[language()];
      const label = (key, plain) => {
        const value = text(storage, key);
        return value === key ? plain : value;
      };
      const packet = customerPacket(stop, language(), {
        possible: label('stop.possiblePart', fallback.possible),
        none: label('stop.noPartYet', fallback.none),
        verify: label('stop.verify', fallback.verify),
      });
      const result = await share({
        packet,
        surface: 'stop_summary',
        onEvent: (event, props) => track(event, props),
      });
      if (result?.channel) {
        markPacketSent(storage, id, now());
        track('stop_packet_sent', { channel: result.channel });
      }
      if (statusNode) statusNode.textContent = packetStatusCopy(storage, result?.channel);
    } finally {
      sharing = false;
    }
  }

  function onPartIdentified(result) {
    const attached = attachPart(storage, result, now());
    if (!attached.attached) return attached;
    track('stop_part_attached', { has_label: true });
    mount();
    return attached;
  }

  return { mount, onPartIdentified, sendPacket, renderForm, renderIdle };
}

if (typeof document !== 'undefined' && typeof window !== 'undefined') {
  const flow = createStopFlow();
  window.SplashLensStopFlow = {
    mount: flow.mount,
    onPartIdentified: flow.onPartIdentified,
    readStops: () => readStops(localStorage),
    setFollowUpOpen: (id, open) => setFollowUpOpen(localStorage, id, open),
  };
}
