import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const source = readFileSync(new URL('../js/app.js', import.meta.url), 'utf8');
function functionSource(name) {
  const match = source.match(new RegExp(`^async function ${name}\\([^]*?^}|^function ${name}\\([^]*?^}`, 'm'));
  assert.ok(match, `Missing ${name}`);
  return match[0];
}

const preflight = {
  block: true, blockers: ['flat_or_blank'], warnings: ['dim'], brightness: 54,
  contrast: 11, edgeScore: 1, width: 720, height: 1280,
};

test('a blocked gallery photo offers another gallery pick and records a scalar blocker', () => {
  const events = [];
  const result = { innerHTML: '' };
  const status = { textContent: '' };
  const context = vm.createContext({
    trackPartSnapResultFailure: (reason, props) => events.push({ event: 'fail', reason, props }),
    trackSplashLensEvent: (event, props) => events.push({ event, props }),
    getPartSnapRecoveryContext: () => null,
    partSnapPreflightCopy: () => ['Find markings', 'Aim at the label.'],
    escHtml: value => String(value),
  });
  vm.runInContext(functionSource('showPartSnapImagePreflight'), context);
  context.showPartSnapImagePreflight(preflight, result, status, true);
  assert.match(result.innerHTML, /Choose another photo/);
  assert.match(result.innerHTML, /onclick="requestGalleryPhotoFallback\(\)"/);
  assert.doesNotMatch(result.innerHTML, /onclick="captureAndAnalyze\(\)"/);
  assert.equal(events[0].reason, 'photo_quality');
  assert.equal(events[0].props.blocker, 'flat_or_blank');
  assert.equal(events[0].props.capture_source, 'gallery');
  assert.equal(events[1].props.primary_blocker, 'flat_or_blank');
  assert.equal(events[1].props.blocker_count, 1);
});

test('a blocked camera frame keeps camera retake, and capture passes the correct source', async () => {
  for (const uploaded of [true, false]) {
    let chosenSource;
    const canvas = { width: 720, height: 1280, getContext: () => ({ drawImage() {} }) };
    const video = { videoWidth: 720, videoHeight: 1280 };
    const result = {};
    const status = {};
    const context = vm.createContext({
      document: { getElementById: id => ({ 'scan-video': video, 'scan-canvas': canvas, 'scan-camera-status': status, 'scan-result': result })[id] },
      getPartSnapEvidenceSummary: () => ({ complete: false }),
      inspectPartSnapImage: () => preflight,
      showPartSnapImagePreflight: (_preflight, _result, _status, fromUpload) => { chosenSource = fromUpload; },
      trackSplashLensEvent: () => {},
    });
    vm.runInContext(`let _scanMode = 'parts'; let _scanUploadedFrameReady = ${uploaded};`, context);
    vm.runInContext(functionSource('captureAndAnalyze'), context);
    await context.captureAndAnalyze();
    assert.equal(chosenSource, uploaded);
  }
});

test('photo warnings retain a scalar reason through analytics sanitization', async () => {
  const events = [];
  const canvas = { width: 720, height: 1280, getContext: () => ({ drawImage() {} }) };
  const context = vm.createContext({
    document: { getElementById: id => ({
      'scan-video': { videoWidth: 720, videoHeight: 1280 },
      'scan-canvas': canvas, 'scan-camera-status': {}, 'scan-result': {},
    })[id] },
    getPartSnapEvidenceSummary: () => ({ complete: false }),
    inspectPartSnapImage: () => ({ ...preflight, block: false, blockers: [] }),
    trackSplashLensEvent: (event, props) => events.push({ event, props }),
    getPartSnapEvidenceStepIndex: () => 0,
    getPartSnapRecoveryContext: () => null,
    PARTSNAP_EVIDENCE_STEPS: [{ key: 'equipment' }],
    capturePartSnapEvidenceFrame: async () => false,
  });
  vm.runInContext("let _scanMode = 'parts'; let _scanUploadedFrameReady = false;", context);
  vm.runInContext(functionSource('captureAndAnalyze'), context);
  await context.captureAndAnalyze();
  const warning = events.find(item => item.event === 'partsnap_image_preflight_warning');
  assert.equal(warning.props.primary_warning, 'dim');
  assert.equal(warning.props.warning_count, 1);
});
