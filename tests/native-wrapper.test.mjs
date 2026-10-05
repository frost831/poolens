import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';

const app = fs.readFileSync(new URL('../js/app.js', import.meta.url), 'utf8');
const swift = fs.readFileSync(new URL('../ios/SplashLens/ContentView.swift', import.meta.url), 'utf8');

function galleryContext(pickGalleryPhoto) {
  const events = [];
  let browserPicks = 0;
  let analyzed;
  const context = vm.createContext({
    _scanMode: 'parts',
    getStoreShellMode: () => 'ios',
    trackSplashLensEvent: (...args) => events.push(args),
    window: { SplashLensNative: { pickGalleryPhoto } },
    document: { getElementById: () => ({ click: () => browserPicks++ }) },
    analyzeNativeGalleryPhoto: async photo => { analyzed = photo; },
  });
  vm.runInContext(app.slice(app.indexOf('async function requestGalleryPhotoFallback'),
    app.indexOf('async function analyzeNativeGalleryPhoto')), context);
  return { context, events, browserPicks: () => browserPicks, analyzed: () => analyzed };
}

test('a selected native gallery image reaches the existing analysis path once', async () => {
  const image = { dataUrl: 'data:image/jpeg;base64,dGVzdA==' };
  const state = galleryContext(async () => image);
  await state.context.requestGalleryPhotoFallback();
  assert.equal(state.analyzed(), image);
  assert.equal(state.browserPicks(), 0);
});

test('canceling or repeating an active native picker does not reopen the browser picker', async () => {
  for (const reason of ['gallery_cancelled', 'gallery_busy']) {
    const state = galleryContext(async () => { throw new Error(reason); });
    await state.context.requestGalleryPhotoFallback();
    assert.equal(state.browserPicks(), 0);
    assert.equal(state.events.filter(([name]) => name === 'native_gallery_pick_failed').length, 0);
  }
});

test('an unavailable or failed native picker falls back to the browser picker', async () => {
  for (const picker of [undefined, async () => { throw new Error('gallery_read_failed'); }]) {
    const state = galleryContext(picker);
    await state.context.requestGalleryPhotoFallback();
    assert.equal(state.browserPicks(), 1);
    assert.equal(state.analyzed(), undefined);
  }
});

test('the injected iOS bridge resolves and rejects the matching request and removes its resolver', async () => {
  const script = swift.split('private static let nativeBridgeScript = """')[1].split('"""')[0];
  const requests = [];
  const window = { webkit: { messageHandlers: { splashlensNativeGallery: {
    postMessage: body => requests.push(body),
  } } } };
  vm.runInNewContext(script, { window });
  const first = window.SplashLensNative.pickGalleryPhoto();
  const second = window.SplashLensNative.pickGalleryPhoto();
  const rejected = assert.rejects(second, /gallery_cancelled/);
  const payload = { requestId: requests[0].requestId, dataUrl: 'data:image/jpeg;base64,dGVzdA==' };
  window.SplashLensNative.__resolveGalleryPhoto(payload);
  window.SplashLensNative.__rejectGalleryPhoto({ requestId: requests[1].requestId, reason: 'gallery_cancelled' });
  assert.equal(await first, payload);
  await rejected;
  assert.equal(Object.keys(window.SplashLensNative.__galleryResolvers).length, 0);
});

test('the store upgrade opens one external browser handoff and leaves the wrapper location intact', () => {
  const links = [];
  const window = { location: { href: 'https://app.splashlens.com/?store=ios' } };
  const context = vm.createContext({
    window,
    getStoreShellMode: () => 'ios',
    trackSplashLensEvent: () => {},
    SPLASHLENS_WEB_UPGRADE_URL: 'https://splashlens.com/?upgrade=splashlens-pro#pricing',
    URL,
    document: { createElement: () => {
      const link = { click() { links.push({ href: this.href, target: this.target, rel: this.rel }); } };
      return link;
    } },
  });
  vm.runInContext(app.slice(app.indexOf('function openExternalWebUpgrade'),
    app.indexOf('function renderStoreWebUpgradeBridge')), context);
  context.openExternalWebUpgrade('test');
  assert.deepEqual(links, [{ href: 'https://splashlens.com/?upgrade=splashlens-pro&store=ios&utm_source=splashlens_native&utm_medium=app#pricing', target: '_blank', rel: 'noopener noreferrer' }]);
  assert.equal(window.location.href, 'https://app.splashlens.com/?store=ios');
});
