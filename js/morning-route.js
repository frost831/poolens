import { localDay, readStops, setFollowUpOpen } from './stop-flow.js?v=20261012-stop-flow';

const LANGUAGE_KEY = 'splashlens_language_profile';

export function utcDay(date) {
  return date.toISOString().slice(0, 10);
}

function cleanName(value) {
  if (typeof value !== 'string') return '';
  return value.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80);
}

export function morningRoute({ stops = [], route = {}, day, utc }) {
  const savedStops = stops.filter(stop => stop?.day === day && cleanName(stop.name)).map(stop => ({
    id: stop.id,
    name: cleanName(stop.name),
  }));
  const followUps = stops.filter(stop => cleanName(stop.followUp) && stop.followUpOpen).map(stop => ({
    id: stop.id,
    name: cleanName(stop.name),
    followUp: cleanName(stop.followUp),
  }));
  const routeJobs = route?.date === day || route?.date === utc
    ? (Array.isArray(route.jobs) ? route.jobs : []).filter(job => cleanName(job?.name)).map(job => ({
      id: cleanName(String(job.id || '')),
      name: cleanName(job.name),
      done: Boolean(job.done),
    }))
    : [];
  return { day, stops: savedStops, routeJobs, followUps };
}

export function morningHasEntries(view) {
  return view.stops.length + view.routeJobs.length + view.followUps.length > 0;
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

export function createMorningRoute({
  storage = globalThis.localStorage,
  document: doc = globalThis.document,
  track = (name, props) => globalThis.trackSplashLensEvent?.(name, props),
  now = () => new Date(),
  read = () => readStops(storage),
  readRoute = () => globalThis.getRoute?.() || { date: '', jobs: [] },
  closeFollowUp = (id) => setFollowUpOpen(storage, id, false),
} = {}) {
  const seen = new Set();

  function section(title, items, followUpAction) {
    const block = element(doc, 'div', 'morning-block');
    block.append(element(doc, 'h3', 'field-label', title));
    if (!items.length) {
      block.append(element(doc, 'p', 'field-body', text(storage, 'morning.noneInSection')));
      return block;
    }
    const list = element(doc, 'ul', 'morning-list');
    for (const item of items) {
      const row = element(doc, 'li', '');
      row.append(element(doc, 'span', '', item.followUp ? `${item.name}: ${item.followUp}` : item.name));
      if (followUpAction) {
        const button = element(doc, 'button', 'stop-flow-secondary', text(storage, 'morning.done'));
        button.type = 'button';
        button.addEventListener('click', () => followUpAction(item.id));
        row.append(button);
      }
      list.append(row);
    }
    block.append(list);
    return block;
  }

  function render(parent, view, surface) {
    parent.replaceChildren();
    const card = element(doc, 'section', 'field-surface-card');
    card.setAttribute('data-morning-route', view.day);
    card.append(
      element(doc, 'p', 'field-kicker', text(storage, 'morning.kicker')),
      element(doc, 'h2', 'field-title', text(storage, 'morning.title')),
    );
    if (!morningHasEntries(view)) {
      card.append(element(doc, 'p', 'field-body', text(storage, 'morning.empty')));
    } else {
      card.append(
        section(text(storage, 'morning.today'), view.stops),
        section(text(storage, 'morning.routeList'), view.routeJobs),
        section(text(storage, 'morning.followUps'), view.followUps, id => {
          closeFollowUp(id);
          track('morning_follow_up_closed', { surface });
          mount(surface);
        }),
        element(doc, 'p', 'field-body', text(storage, 'morning.source')),
      );
    }
    parent.append(card);
    const key = `${view.day}:${surface}`;
    if (!seen.has(key)) {
      seen.add(key);
      track('morning_route_shown', {
        stops: view.stops.length,
        route_jobs: view.routeJobs.length,
        follow_ups: view.followUps.length,
        surface,
      });
    }
  }

  function mount(tab) {
    const date = now();
    const view = morningRoute({ stops: read(), route: readRoute(), day: localDay(date), utc: utcDay(date) });
    const surface = tab === 'counter' ? 'counter' : 'route';
    if (tab === 'counter' || !tab) {
      const counter = doc.getElementById('morning-route-mount');
      if (counter) {
        if (date.getHours() < 12 && morningHasEntries(view)) render(counter, view, 'counter');
        else counter.replaceChildren();
      }
    }
    if (tab === 'route' || !tab) {
      const route = doc.getElementById('route-morning-mount');
      if (route) render(route, view, 'route');
    }
    return surface;
  }

  return { mount };
}

if (typeof document !== 'undefined' && typeof window !== 'undefined') {
  window.SplashLensMorningRoute = createMorningRoute();
}
