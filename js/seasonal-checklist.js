const LANGUAGE_KEY = 'splashlens_language_profile';
export const REGION_KEY = 'splashlens-service-region-v1';
export const DISMISS_KEY = 'splashlens-seasonal-dismiss-v1';
export const REGIONS = Object.freeze(['midwest', 'sunbelt']);

const WINDOWS = {
  midwest: {
    opening: { start: [3, 15], end: [5, 31] },
    closing: { start: [9, 15], end: [11, 30] },
  },
  sunbelt: {
    opening: { start: [2, 1], end: [4, 30] },
    closing: { start: [11, 1], end: [12, 15] },
  },
};

function monthDay(date) {
  return (date.getMonth() + 1) * 100 + date.getDate();
}

function includes(date, window) {
  const value = monthDay(date);
  return value >= window.start[0] * 100 + window.start[1] && value <= window.end[0] * 100 + window.end[1];
}

export function seasonFor(region, date) {
  const windows = WINDOWS[region];
  if (!windows) return null;
  if (includes(date, windows.closing)) return 'closing';
  if (includes(date, windows.opening)) return 'opening';
  return null;
}

export function readRegion(storage) {
  const value = storage.getItem(REGION_KEY);
  return REGIONS.includes(value) ? value : '';
}

export function dismissKey(region, season, date) {
  return `${date.getFullYear()}:${region || 'unset'}:${season || 'region'}`;
}

function preferredLanguage(storage) {
  try {
    return JSON.parse(storage.getItem(LANGUAGE_KEY) || '{}').preferredLanguage === 'es' ? 'es' : 'en';
  } catch {
    return 'en';
  }
}

function text(storage, key) {
  const dictionary = globalThis.SplashLensI18N || globalThis.window?.SplashLensI18N;
  const translated = dictionary?.i18nText?.(preferredLanguage(storage), key);
  return translated && translated !== key ? translated : key;
}

function element(doc, tag, className, textContent) {
  const node = doc.createElement(tag);
  if (className) node.className = className;
  if (textContent) node.textContent = textContent;
  return node;
}

export function createSeasonalChecklist({
  storage = globalThis.localStorage,
  document: doc = globalThis.document,
  track = (name, props) => globalThis.trackSplashLensEvent?.(name, props),
  now = () => new Date(),
  openChecklist = (season) => {
    globalThis.switchClType?.(season);
    globalThis.showTab?.('guide');
  },
} = {}) {
  const seen = new Set();

  function dismissed(key) {
    return storage.getItem(DISMISS_KEY) === key;
  }

  function render(parent, { region, season, date, surface }) {
    parent.replaceChildren();
    const key = dismissKey(region, season, date);
    const prompt = season || !region;
    if (surface === 'counter' && (!prompt || dismissed(key))) return;
    const card = element(doc, 'section', 'field-surface-card');
    card.setAttribute('data-seasonal-checklist', season || 'region');
    card.append(
      element(doc, 'p', 'field-kicker', text(storage, 'seasonal.kicker')),
      element(doc, 'h2', 'field-title', text(storage, 'seasonal.title')),
      element(doc, 'p', 'field-body', text(storage, 'seasonal.notice')),
    );
    if (surface === 'guide') {
      const label = element(doc, 'label', 'field-label', text(storage, 'seasonal.regionLabel'));
      label.htmlFor = 'seasonal-region';
      const select = element(doc, 'select');
      select.id = 'seasonal-region';
      for (const value of ['', ...REGIONS]) {
        const option = element(doc, 'option', '', text(storage, value ? `seasonal.${value}` : 'seasonal.unset'));
        option.value = value;
        if (value === region) option.selected = true;
        select.append(option);
      }
      select.addEventListener('change', () => {
        const next = REGIONS.includes(select.value) ? select.value : '';
        if (next) storage.setItem(REGION_KEY, next);
        else storage.removeItem?.(REGION_KEY);
        track('seasonal_region_set', { region: next || 'unset' });
        mount('guide');
      });
      card.append(label, select);
    }
    const bodyKey = season === 'closing' ? 'seasonal.closingBody' : season === 'opening' ? 'seasonal.openingBody' : 'seasonal.unsetBody';
    if (!(surface === 'guide' && !season && region)) card.append(element(doc, 'p', 'field-body', text(storage, bodyKey)));
    if (season && !dismissed(key)) {
      const open = element(doc, 'button', 'stop-flow-send', text(storage, season === 'closing' ? 'seasonal.openClosing' : 'seasonal.openOpening'));
      open.type = 'button';
      open.addEventListener('click', () => {
        track('seasonal_checklist_opened', { season, region });
        openChecklist(season);
      });
      const dismiss = element(doc, 'button', 'stop-flow-secondary', text(storage, 'seasonal.dismiss'));
      dismiss.type = 'button';
      dismiss.addEventListener('click', () => {
        storage.setItem(DISMISS_KEY, key);
        track('seasonal_checklist_dismissed', { season, region });
        mount(surface);
      });
      card.append(open, dismiss);
      const shown = `${key}:${surface}`;
      if (!seen.has(shown)) {
        seen.add(shown);
        track('seasonal_checklist_shown', { season, region });
      }
    }
    parent.append(card);
  }

  function mount(tab) {
    const date = now();
    const region = readRegion(storage);
    const season = seasonFor(region, date);
    if (tab === 'counter' || !tab) {
      const counter = doc.getElementById('seasonal-counter-mount');
      if (counter) render(counter, { region, season, date, surface: 'counter' });
    }
    if (tab === 'guide' || !tab) {
      const guide = doc.getElementById('seasonal-guide-mount');
      if (guide) render(guide, { region, season, date, surface: 'guide' });
    }
  }

  return { mount };
}

if (typeof document !== 'undefined' && typeof window !== 'undefined') {
  window.SplashLensSeasonalChecklist = createSeasonalChecklist();
}
