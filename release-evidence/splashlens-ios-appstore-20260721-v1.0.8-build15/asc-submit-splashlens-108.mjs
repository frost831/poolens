import crypto from 'node:crypto';
import fs from 'node:fs';
import https from 'node:https';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const APP_ID = '6763644905';
const KEY_ID = '82ZGJT27W6';
const ISSUER_ID = '5a63c547-75c1-4efb-9be3-d675542a5630';
const KEY_PATH = `${process.env.HOME}/.appstoreconnect/private_keys/AuthKey_${KEY_ID}.p8`;
const VERSION = '1.0.8';
const BUILD_NUMBER = '15';
const BASE = 'https://api.appstoreconnect.apple.com';
const LOCALE = 'en-US';
const DISPLAY_TYPE = 'APP_IPHONE_67';
const OUT_DIR = path.dirname(fileURLToPath(import.meta.url));
const SHOT_DIR = path.join(OUT_DIR, 'asc-screenshots');

const SCREENSHOTS = [
  '01-partsnap-source-proof.png',
  '02-field-learning-partsnap-lesson.png',
  '03-cpo-scenario-answer-key.png',
  '04-service-proof-handoff.png'
];

const REVIEW_NOTES = `SplashLens is a free utility/reference wrapper around the SplashLens PWA at https://app.splashlens.com/?store=ios.

No account or demo login is required for core use.

Suggested review path:
1. Launch SplashLens.
2. If the role picker appears, choose Trainer.
3. Open Report / Service Proof and use the Field Learning OS buttons: PartSnap Lesson, CPO Scenario, and Proof Review.
4. Open Scan > PartSnap for optional photo/scanner reference assistance.
5. Open Report / Service Proof to generate a customer-safe service proof/passport summary.
6. Optional camera, photo, and microphone prompts appear only after the reviewer starts the related scan, selected-photo, or dictated-note flow.

Store wrapper mode is intended to stay free-core and should not show direct Stripe checkout or web-subscription CTAs. Online AI scan features require internet access. PartSnap results are possible matches with visible-proof and missing-proof prompts, not confirmed part-fit results.

SplashLens is a field reference, service-proof, and training-aid workflow. It does not replace equipment manuals, product labels, local code, official certification programs, manufacturer guidance, or qualified technician/CPO judgment. This build does not include completed training certificates, official Aquatic Council/CPO alignment, manufacturer endorsement, or guaranteed diagnosis/part-fit claims.`;

const WHATS_NEW = 'Adds Field Learning OS workflows that turn real PartSnap misses, facility scenarios, and saved service proof into short field lessons with proof checks and review guidance. SplashLens remains a reference aid and does not replace manuals, codes, certification, or qualified judgment.';
const PROMOTIONAL_TEXT = 'Get off the pad faster, then turn the stop into a five-minute field lesson.';

function b64url(input) {
  return Buffer.from(input).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function token() {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'ES256', kid: KEY_ID, typ: 'JWT' };
  const payload = { iss: ISSUER_ID, exp: now + 20 * 60, aud: 'appstoreconnect-v1' };
  const body = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(payload))}`;
  const signature = crypto.sign('sha256', Buffer.from(body), {
    key: fs.readFileSync(KEY_PATH, 'utf8'),
    dsaEncoding: 'ieee-p1363'
  });
  return `${body}.${b64url(signature)}`;
}

function slug(urlPath) {
  return urlPath.replace(/[^A-Za-z0-9_.=-]+/g, '_').replace(/_+/g, '_').slice(0, 140);
}

function saveResponse(method, urlPath, code, json) {
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');
  const file = path.join(OUT_DIR, `asc-${stamp}-${method}-${slug(urlPath)}-${code}.json`);
  fs.writeFileSync(file, JSON.stringify(json || {}, null, 2));
  return file;
}

async function request(method, urlPath, body = undefined, ok = undefined) {
  const url = new URL(`${BASE}${urlPath}`);
  const payload = body ? JSON.stringify(body) : undefined;
  const options = {
    method: method.toUpperCase(),
    hostname: url.hostname,
    path: `${url.pathname}${url.search}`,
    headers: {
      Authorization: `Bearer ${token()}`,
      'Content-Type': 'application/json'
    }
  };
  if (payload) options.headers['Content-Length'] = Buffer.byteLength(payload);

  const { statusCode, text } = await new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => resolve({ statusCode: res.statusCode, text: data }));
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });

  const json = text ? JSON.parse(text) : null;
  const file = saveResponse(method, urlPath, statusCode, json);
  console.log(`${method.toUpperCase()} ${urlPath} -> ${statusCode} (${file})`);
  const expected = ok || (method === 'post' ? [200, 201] : [200, 204]);
  if (!expected.includes(statusCode)) {
    if (json) console.log(JSON.stringify(json, null, 2));
    throw new Error(`Unexpected response ${statusCode} for ${method.toUpperCase()} ${urlPath}`);
  }
  return json;
}

const data = (type, id) => ({ type, id });
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function assertScreenshotFiles() {
  for (const name of SCREENSHOTS) {
    const file = path.join(SHOT_DIR, name);
    if (!fs.existsSync(file)) throw new Error(`Missing screenshot: ${file}`);
    const size = fs.statSync(file).size;
    if (size < 10_000) throw new Error(`Screenshot looks too small: ${file}`);
  }
}

async function waitForBuild() {
  const urlPath = `/v1/builds?filter[app]=${APP_ID}&filter[version]=${BUILD_NUMBER}&include=preReleaseVersion&fields[preReleaseVersions]=version,platform&fields[builds]=processingState,uploadedDate,version,usesNonExemptEncryption,expired,buildAudienceType&limit=20`;
  for (let attempt = 1; attempt <= 20; attempt += 1) {
    const json = await request('get', urlPath);
    const build = json.data.find((item) => item.attributes?.version === BUILD_NUMBER);
    const state = build?.attributes?.processingState || 'not visible';
    const audience = build?.attributes?.buildAudienceType || 'unknown';
    console.log(`build ${BUILD_NUMBER} state=${state} audience=${audience} attempt=${attempt}`);
    if (state === 'VALID' && audience === 'APP_STORE_ELIGIBLE') return build;
    if (['FAILED', 'INVALID'].includes(state)) throw new Error(`Build processing failed: ${state}`);
    await sleep(30_000);
  }
  throw new Error(`Build ${BUILD_NUMBER} did not become VALID in time`);
}

async function findOrCreateVersion() {
  const urlPath = `/v1/apps/${APP_ID}/appStoreVersions?filter[platform]=IOS&filter[versionString]=${VERSION}&fields[appStoreVersions]=versionString,appVersionState,platform,appStoreState&limit=5`;
  const existing = await request('get', urlPath);
  if (existing.data[0]) return existing.data[0];
  const created = await request('post', '/v1/appStoreVersions', {
    data: {
      type: 'appStoreVersions',
      attributes: { platform: 'IOS', versionString: VERSION },
      relationships: { app: { data: data('apps', APP_ID) } }
    }
  });
  return created.data;
}

async function patchReviewDetail(versionId) {
  const detail = (await request('get', `/v1/appStoreVersions/${versionId}/appStoreReviewDetail`)).data;
  await request('patch', `/v1/appStoreReviewDetails/${detail.id}`, {
    data: {
      type: 'appStoreReviewDetails',
      id: detail.id,
      attributes: {
        contactFirstName: 'Joshua',
        contactLastName: 'Frost',
        contactPhone: '8065550100',
        contactEmail: 'support@splashlens.com',
        demoAccountRequired: false,
        notes: REVIEW_NOTES
      }
    }
  });
  return detail.id;
}

async function getOrCreateLocalization(versionId) {
  const json = await request('get', `/v1/appStoreVersions/${versionId}/appStoreVersionLocalizations?fields[appStoreVersionLocalizations]=locale,whatsNew,promotionalText&limit=50`);
  const loc = json.data.find((item) => item.attributes?.locale === LOCALE) || json.data[0];
  if (loc) return loc;
  const created = await request('post', '/v1/appStoreVersionLocalizations', {
    data: {
      type: 'appStoreVersionLocalizations',
      attributes: { locale: LOCALE },
      relationships: { appStoreVersion: { data: data('appStoreVersions', versionId) } }
    }
  });
  return created.data;
}

async function patchLocalization(versionId) {
  const loc = await getOrCreateLocalization(versionId);
  await request('patch', `/v1/appStoreVersionLocalizations/${loc.id}`, {
    data: {
      type: 'appStoreVersionLocalizations',
      id: loc.id,
      attributes: {
        whatsNew: WHATS_NEW,
        promotionalText: PROMOTIONAL_TEXT
      }
    }
  });
  return loc.id;
}

async function attachBuild(versionId, buildId) {
  await request('patch', `/v1/appStoreVersions/${versionId}/relationships/build`, {
    data: data('builds', buildId)
  }, [204]);
}

async function getOrCreateScreenshotSet(localizationId) {
  const json = await request('get', `/v1/appStoreVersionLocalizations/${localizationId}/appScreenshotSets?fields[appScreenshotSets]=screenshotDisplayType&limit=50`);
  const existing = json.data.find((item) => item.attributes?.screenshotDisplayType === DISPLAY_TYPE);
  if (existing) return existing;
  const created = await request('post', '/v1/appScreenshotSets', {
    data: {
      type: 'appScreenshotSets',
      attributes: { screenshotDisplayType: DISPLAY_TYPE },
      relationships: { appStoreVersionLocalization: { data: data('appStoreVersionLocalizations', localizationId) } }
    }
  });
  return created.data;
}

async function deleteExistingScreenshots(setId) {
  const json = await request('get', `/v1/appScreenshotSets/${setId}/appScreenshots?limit=50`);
  for (const shot of json.data || []) {
    await request('delete', `/v1/appScreenshots/${shot.id}`, undefined, [204]);
  }
  return json.data?.length || 0;
}

function screenshotFileNamesMatch(shots = []) {
  const names = shots.map((shot) => shot.attributes?.fileName).filter(Boolean).sort();
  return names.length === SCREENSHOTS.length && names.every((name, index) => name === [...SCREENSHOTS].sort()[index]);
}

function screenshotState(shot) {
  return shot.attributes?.assetDeliveryState?.state || 'UNKNOWN';
}

function screenshotProcessingErrors(shots = []) {
  return shots.flatMap((shot) => shot.attributes?.assetDeliveryState?.errors || []);
}

async function waitForScreenshotProcessing(setId, requireExpectedNames = true) {
  for (let attempt = 1; attempt <= 24; attempt += 1) {
    const json = await request('get', `/v1/appScreenshotSets/${setId}/appScreenshots?limit=50`);
    const shots = json.data || [];
    const namesOk = !requireExpectedNames || screenshotFileNamesMatch(shots);
    const states = shots.map((shot) => `${shot.attributes?.fileName || shot.id}:${screenshotState(shot)}`).join(', ');
    const errors = screenshotProcessingErrors(shots);
    console.log(`screenshot processing attempt=${attempt} namesOk=${namesOk} states=${states}`);
    if (errors.length) throw new Error(`Screenshot processing errors: ${JSON.stringify(errors)}`);
    if (namesOk && shots.length === SCREENSHOTS.length && shots.every((shot) => screenshotState(shot) === 'COMPLETE')) {
      return json;
    }
    await sleep(10_000);
  }
  throw new Error(`Screenshots did not finish processing for set ${setId}`);
}

async function executeUploadOperations(filePath, operations) {
  const buffer = fs.readFileSync(filePath);
  for (const op of operations) {
    const slice = buffer.subarray(op.offset, op.offset + op.length);
    const headers = {};
    for (const header of op.requestHeaders || []) headers[header.name] = header.value;
    const res = await fetch(op.url, { method: op.method, headers, body: slice });
    if (!res.ok) {
      throw new Error(`Screenshot upload chunk failed ${res.status}: ${await res.text()}`);
    }
  }
}

async function uploadScreenshot(setId, fileName, index) {
  const filePath = path.join(SHOT_DIR, fileName);
  const fileBuffer = fs.readFileSync(filePath);
  const reserve = await request('post', '/v1/appScreenshots', {
    data: {
      type: 'appScreenshots',
      attributes: { fileName, fileSize: fileBuffer.length },
      relationships: { appScreenshotSet: { data: data('appScreenshotSets', setId) } }
    }
  });
  const shot = reserve.data;
  const operations = shot.attributes?.uploadOperations || [];
  if (!operations.length) throw new Error(`No upload operations returned for ${fileName}`);
  await executeUploadOperations(filePath, operations);
  const md5 = crypto.createHash('md5').update(fileBuffer).digest('hex');
  const finalized = await request('patch', `/v1/appScreenshots/${shot.id}`, {
    data: {
      type: 'appScreenshots',
      id: shot.id,
      attributes: { uploaded: true, sourceFileChecksum: md5 }
    }
  });
  console.log(`uploaded screenshot ${index + 1}/${SCREENSHOTS.length}: ${fileName} -> ${shot.id}`);
  return finalized.data;
}

async function uploadScreenshotSet(localizationId) {
  assertScreenshotFiles();
  const set = await getOrCreateScreenshotSet(localizationId);
  const existing = await request('get', `/v1/appScreenshotSets/${set.id}/appScreenshots?limit=50`);
  if (screenshotFileNamesMatch(existing.data || [])) {
    const readback = await waitForScreenshotProcessing(set.id, true);
    return { setId: set.id, deletedCount: 0, uploaded: readback.data || [], readback };
  }
  const deletedCount = await deleteExistingScreenshots(set.id);
  const uploaded = [];
  for (let i = 0; i < SCREENSHOTS.length; i += 1) {
    uploaded.push(await uploadScreenshot(set.id, SCREENSHOTS[i], i));
  }
  const readback = await waitForScreenshotProcessing(set.id, true);
  return { setId: set.id, deletedCount, uploaded, readback };
}

async function activeReviewSubmission() {
  const urlPath = `/v1/reviewSubmissions?filter[app]=${APP_ID}&include=appStoreVersionForReview,items&fields[reviewSubmissions]=appStoreVersionForReview,state,submittedDate,items,platform&fields[reviewSubmissionItems]=state,appStoreVersion&fields[appStoreVersions]=versionString,appVersionState,build&limit=20`;
  const json = await request('get', urlPath);
  const activeStates = ['READY_FOR_REVIEW', 'WAITING_FOR_REVIEW', 'IN_REVIEW', 'UNRESOLVED_ISSUES'];
  const submission = json.data.find((item) => activeStates.includes(String(item.attributes?.state)));
  return { submission, included: json.included || [] };
}

async function createReviewSubmission() {
  const json = await request('post', '/v1/reviewSubmissions', {
    data: {
      type: 'reviewSubmissions',
      attributes: { platform: 'IOS' },
      relationships: { app: { data: data('apps', APP_ID) } }
    }
  });
  return json.data;
}

async function createOrReadyReviewItem(submissionId, versionId, included) {
  const existing = included.find((item) => item.type === 'reviewSubmissionItems' && item.relationships?.appStoreVersion?.data?.id === versionId);
  const item = existing || (await request('post', '/v1/reviewSubmissionItems', {
    data: {
      type: 'reviewSubmissionItems',
      relationships: {
        reviewSubmission: { data: data('reviewSubmissions', submissionId) },
        appStoreVersion: { data: data('appStoreVersions', versionId) }
      }
    }
  })).data;
  if (item.attributes?.state === 'READY_FOR_REVIEW') return item;
  return (await request('patch', `/v1/reviewSubmissionItems/${item.id}`, {
    data: {
      type: 'reviewSubmissionItems',
      id: item.id,
      attributes: { state: 'READY_FOR_REVIEW' }
    }
  })).data;
}

async function submitReviewSubmission(submissionId) {
  return (await request('patch', `/v1/reviewSubmissions/${submissionId}`, {
    data: {
      type: 'reviewSubmissions',
      id: submissionId,
      attributes: { submitted: true }
    }
  })).data;
}

async function finalReadback(versionId, submissionId, screenshotSetId) {
  const [version, buildRel, reviewDetail, localization, screenshots, submission] = await Promise.all([
    request('get', `/v1/appStoreVersions/${versionId}?include=build&fields[appStoreVersions]=versionString,appVersionState,appStoreState,platform,build&fields[builds]=version,processingState,buildAudienceType,uploadedDate`),
    request('get', `/v1/appStoreVersions/${versionId}/relationships/build`),
    request('get', `/v1/appStoreVersions/${versionId}/appStoreReviewDetail`),
    request('get', `/v1/appStoreVersions/${versionId}/appStoreVersionLocalizations?fields[appStoreVersionLocalizations]=locale,whatsNew,promotionalText&limit=50`),
    request('get', `/v1/appScreenshotSets/${screenshotSetId}/appScreenshots?limit=50`),
    request('get', `/v1/reviewSubmissions/${submissionId}?include=items&fields[reviewSubmissions]=state,submittedDate,items&fields[reviewSubmissionItems]=state,appStoreVersion`)
  ]);
  return { version, buildRel, reviewDetail, localization, screenshots, submission };
}

const build = await waitForBuild();
const version = await findOrCreateVersion();
const versionId = version.id;
const buildId = build.id;
const reviewDetailId = await patchReviewDetail(versionId);
const localizationId = await patchLocalization(versionId);
const screenshotResult = await uploadScreenshotSet(localizationId);
await attachBuild(versionId, buildId);
let { submission, included } = await activeReviewSubmission();
submission ||= await createReviewSubmission();
const item = await createOrReadyReviewItem(submission.id, versionId, included);
const submitted = await submitReviewSubmission(submission.id);
const readback = await finalReadback(versionId, submission.id, screenshotResult.setId);

const final = {
  appId: APP_ID,
  version: VERSION,
  versionId,
  buildNumber: BUILD_NUMBER,
  buildId,
  reviewDetailId,
  localizationId,
  screenshotSetId: screenshotResult.setId,
  screenshotDeletedCount: screenshotResult.deletedCount,
  screenshotIds: screenshotResult.uploaded.map((shot) => shot.id),
  reviewSubmissionId: submission.id,
  reviewSubmissionItemId: item.id,
  reviewSubmissionState: submitted.attributes?.state,
  submittedDate: submitted.attributes?.submittedDate || null,
  submittedAt: new Date().toISOString()
};
fs.writeFileSync(path.join(OUT_DIR, `asc-submit-final-${VERSION}-${BUILD_NUMBER}.json`), JSON.stringify({ final, readback }, null, 2));
console.log(JSON.stringify(final, null, 2));
