import { localDay, readStops } from './stop-flow.js?v=20261012-stop-flow';

const LANGUAGE_KEY = 'splashlens_language_profile';

export function dayRecap(stops, day) {
  const todays = (Array.isArray(stops) ? stops : []).filter(stop => stop?.day === day);
  return {
    day,
    stopsLogged: todays.length,
    partsIdentified: todays.filter(stop => stop.partLabel && stop.partIdentifiedAt).length,
    packetsSent: todays.filter(stop => stop.packetSentAt).length,
  };
}

export function recapHasSavedWork(recap) {
  return recap.stopsLogged > 0;
}

function preferredLanguage(storage) {
  try {
    return JSON.parse(storage.getItem(LANGUAGE_KEY) || '{}').preferredLanguage === 'es' ? 'es' : 'en';
  } catch {
    return 'en';
  }
}

function text(storage, key) {
  const language = preferredLanguage(storage);
  const dictionary = globalThis.SplashLensI18N || globalThis.window?.SplashLensI18N;
  const translated = dictionary?.i18nText?.(language, key);
  return translated && translated !== key ? translated : key;
}

function element(doc, tag, className, textContent) {
  const node = doc.createElement(tag);
  if (className) node.className = className;
  if (textContent) node.textContent = textContent;
  return node;
}

export function createDayRecap({
  storage = globalThis.localStorage,
  document: doc = globalThis.document,
  track = (name, props) => globalThis.trackSplashLensEvent?.(name, props),
  now = () => new Date(),
  read = () => readStops(storage),
} = {}) {
  const seen = new Set();

  function render(parent, recap) {
    parent.replaceChildren();
    const card = element(doc, 'section', 'field-surface-card');
    card.setAttribute('data-day-recap', recap.day);
    card.append(
      element(doc, 'p', 'field-kicker', text(storage, 'recap.kicker')),
      element(doc, 'h2', 'field-title', text(storage, 'recap.title')),
    );
    if (!recapHasSavedWork(recap)) {
      card.append(element(doc, 'p', 'field-body', text(storage, 'recap.empty')));
      parent.append(card);
      return;
    }
    const list = element(doc, 'dl', 'day-recap-counts');
    for (const [key, value] of [
      ['recap.stops', recap.stopsLogged],
      ['recap.parts', recap.partsIdentified],
      ['recap.packets', recap.packetsSent],
    ]) {
      const row = element(doc, 'div', 'day-recap-row');
      row.append(element(doc, 'dt', '', text(storage, key)), element(doc, 'dd', '', String(value)));
      list.append(row);
    }
    card.append(list, element(doc, 'p', 'field-body', text(storage, 'recap.source')));
    parent.append(card);
  }

  function mount(tab) {
    const date = now();
    const showCounter = date.getHours() >= 16;
    const targets = [];
    if (tab === 'route' || !tab) targets.push('route-recap-mount');
    if ((tab === 'counter' || !tab) && showCounter) targets.push('day-recap-mount');
    if (tab === 'counter' && !showCounter) doc.getElementById('day-recap-mount')?.replaceChildren();
    if (tab === 'route') doc.getElementById('day-recap-mount')?.replaceChildren();
    const recap = dayRecap(read(), localDay(date));
    for (const id of targets) {
      const parent = doc.getElementById(id);
      if (!parent) continue;
      render(parent, recap);
      if (!seen.has(recap.day + ':' + id)) {
        seen.add(recap.day + ':' + id);
        track('day_recap_shown', {
          stops_logged: recap.stopsLogged,
          parts_identified: recap.partsIdentified,
          packets_sent: recap.packetsSent,
          surface: id === 'route-recap-mount' ? 'route' : 'counter',
        });
      }
    }
  }

  return { mount };
}

if (typeof document !== 'undefined' && typeof window !== 'undefined') {
  window.SplashLensDayRecap = createDayRecap();
}
