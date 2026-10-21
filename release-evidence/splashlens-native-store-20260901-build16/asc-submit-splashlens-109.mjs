import crypto from 'node:crypto';
import fs from 'node:fs';
import https from 'node:https';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const APP_ID = '6763644905';
const KEY_ID = '82ZGJT27W6';
const ISSUER_ID = '5a63c547-75c1-4efb-9be3-d675542a5630';
const KEY_PATH = `${process.env.HOME}/.appstoreconnect/private_keys/AuthKey_${KEY_ID}.p8`;
const VERSION = '1.0.9';
const BUILD_NUMBER = '16';
const BASE = 'https://api.appstoreconnect.apple.com';
const LOCALE = 'en-US';
const DISPLAY_TYPE = 'APP_IPHONE_67';
const OUT_DIR = path.dirname(fileURLToPath(import.meta.url));
const SHOT_DIR = path.join(OUT_DIR, 'asc-screenshots');

const SCREENSHOTS = [
  '01-partsnap-field-start.png',
  '02-partsnap-pro-scan.png',
  '03-saved-job-history.png',
  '04-repeat-issue-watch.png',
];

const REVIEW_NOTES = fs.readFileSync(path.join(process.cwd(), 'app-store-connect/review_notes.txt'), 'utf8').trim();
const DESCRIPTION = fs.readFileSync(path.join(process.cwd(), 'app-store-connect/metadata/en-US/description.txt'), 'utf8').trim();
const PROMOTIONAL_TEXT = fs.readFileSync(path.join(process.cwd(), 'app-store-connect/metadata/en-US/promotional_text.txt'), 'utf8').trim();
const WHATS_NEW = 'Adds the current field workflow language for PartSnap Pro, Saved Job Pro, Team Field View, Facility Assist, Repeat Issue Watch, and saved job history. SplashLens remains a reference aid and does not replace manuals, model numbers, code requirements, or qualified judgment.';

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
    dsaEncoding: 'ieee-p1363',
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
      'Content-Type': 'application/json',
    },
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

function assertReleaseText() {
  const joined = [REVIEW_NOTES, DESCRIPTION, PROMOTIONAL_TEXT, WHATS_NEW].join('\n').toLowerCase();
  for (const term of ['service proof passport', 'service proof os', 'team proof os', 'callback risk score', 'proof layer']) {
    if (joined.includes(term)) throw new Error(`Blocked deprecated store term: ${term}`);
  }
  if (PROMOTIONAL_TEXT.length > 170) throw new Error(`Promotional text too long: ${PROMOTIONAL_TEXT.length}`);
  if (DESCRIPTION.length > 4000) throw new Error(`Description too long: ${DESCRIPTION.length}`);
}

function assertScreenshotFiles() {
  for (const name of SCREENSHOTS) {
    const file = path.join(SHOT_DIR, name);
    if (!fs.existsSync(file)) throw new Error(`Missing screenshot: ${file}`);
    if (fs.statSync(file).size < 10_000) throw new Error(`Screenshot looks too small: ${file}`);
  }
}

async function waitForBuild() {
  const urlPath = `/v1/builds?filter[app]=${APP_ID}&filter[version]=${BUILD_NUMBER}&include=preReleaseVersion&fields[preReleaseVersions]=version,platform&fields[builds]=processingState,uploadedDate,version,usesNonExemptEncryption,expired,buildAudienceType&limit=20`;
  for (let attempt = 1; attempt <= 40; attempt += 1) {
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
  const existing = await request('get', `/v1/apps/${APP_ID}/appStoreVersions?filter[platform]=IOS&filter[versionString]=${VERSION}&fields[appStoreVersions]=versionString,appVersionState,platform,appStoreState&limit=5`);
  if (existing.data[0]) return existing.data[0];
  const created = await request('post', '/v1/appStoreVersions', {
    data: {
      type: 'appStoreVersions',
      attributes: { platform: 'IOS', versionString: VERSION },
      relationships: { app: { data: data('apps', APP_ID) } },
    },
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
        notes: REVIEW_NOTES,
      },
    },
  });
  return detail.id;
}

async function getOrCreateLocalization(versionId) {
  const json = await request('get', `/v1/appStoreVersions/${versionId}/appStoreVersionLocalizations?fields[appStoreVersionLocalizations]=locale,whatsNew,promotionalText,description&limit=50`);
  const loc = json.data.find((item) => item.attributes?.locale === LOCALE) || json.data[0];
  if (loc) return loc;
  const created = await request('post', '/v1/appStoreVersionLocalizations', {
    data: {
      type: 'appStoreVersionLocalizations',
      attributes: { locale: LOCALE },
      relationships: { appStoreVersion: { data: data('appStoreVersions', versionId) } },
    },
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
        description: DESCRIPTION,
        promotionalText: PROMOTIONAL_TEXT,
        whatsNew: WHATS_NEW,
      },
    },
  });
  return loc.id;
}

async function getOrCreateScreenshotSet(localizationId) {
  const json = await request('get', `/v1/appStoreVersionLocalizations/${localizationId}/appScreenshotSets?fields[appScreenshotSets]=screenshotDisplayType&limit=50`);
  const existing = json.data.find((item) => item.attributes?.screenshotDisplayType === DISPLAY_TYPE);
  if (existing) return existing;
  const created = await request('post', '/v1/appScreenshotSets', {
    data: {
      type: 'appScreenshotSets',
      attributes: { screenshotDisplayType: DISPLAY_TYPE },
      relationships: { appStoreVersionLocalization: { data: data('appStoreVersionLocalizations', localizationId) } },
    },
  });
  return created.data;
}

async function executeUploadOperations(filePath, operations) {
  const buffer = fs.readFileSync(filePath);
  for (const op of operations) {
    const slice = buffer.subarray(op.offset, op.offset + op.length);
    const headers = {};
    for (const header of op.requestHeaders || []) headers[header.name] = header.value;
    const res = await fetch(op.url, { method: op.method, headers, body: slice });
    if (!res.ok) throw new Error(`Screenshot upload chunk failed ${res.status}: ${await res.text()}`);
  }
}

async function uploadScreenshot(setId, fileName) {
  const filePath = path.join(SHOT_DIR, fileName);
  const fileBuffer = fs.readFileSync(filePath);
  const reserve = await request('post', '/v1/appScreenshots', {
    data: {
      type: 'appScreenshots',
      attributes: { fileName, fileSize: fileBuffer.length },
      relationships: { appScreenshotSet: { data: data('appScreenshotSets', setId) } },
    },
  });
  const shot = reserve.data;
  await executeUploadOperations(filePath, shot.attributes?.uploadOperations || []);
  const md5 = crypto.createHash('md5').update(fileBuffer).digest('hex');
  await request('patch', `/v1/appScreenshots/${shot.id}`, {
    data: {
      type: 'appScreenshots',
      id: shot.id,
      attributes: { uploaded: true, sourceFileChecksum: md5 },
    },
  });
  return shot;
}

function screenshotFileNamesMatch(shots = []) {
  const names = shots.map((shot) => shot.attributes?.fileName).filter(Boolean).sort();
  return names.length === SCREENSHOTS.length && names.every((name, index) => name === [...SCREENSHOTS].sort()[index]);
}

async function uploadScreenshotSet(localizationId) {
  assertScreenshotFiles();
  const set = await getOrCreateScreenshotSet(localizationId);
  const existing = await request('get', `/v1/appScreenshotSets/${set.id}/appScreenshots?limit=50`);
  for (const shot of existing.data || []) {
    await request('delete', `/v1/appScreenshots/${shot.id}`, undefined, [204]);
  }
  const uploaded = [];
  for (const name of SCREENSHOTS) uploaded.push(await uploadScreenshot(set.id, name));
  for (let attempt = 1; attempt <= 24; attempt += 1) {
    const readback = await request('get', `/v1/appScreenshotSets/${set.id}/appScreenshots?limit=50`);
    const shots = readback.data || [];
    const states = shots.map((shot) => `${shot.attributes?.fileName || shot.id}:${shot.attributes?.assetDeliveryState?.state || 'UNKNOWN'}`).join(', ');
    console.log(`screenshot processing attempt=${attempt} states=${states}`);
    const errors = shots.flatMap((shot) => shot.attributes?.assetDeliveryState?.errors || []);
    if (errors.length) throw new Error(`Screenshot processing errors: ${JSON.stringify(errors)}`);
    if (screenshotFileNamesMatch(shots) && shots.every((shot) => shot.attributes?.assetDeliveryState?.state === 'COMPLETE')) {
      return { setId: set.id, deletedCount: existing.data?.length || 0, uploaded, readback };
    }
    await sleep(10_000);
  }
  throw new Error(`Screenshots did not finish processing for set ${set.id}`);
}

async function attachBuild(versionId, buildId) {
  await request('patch', `/v1/appStoreVersions/${versionId}/relationships/build`, {
    data: data('builds', buildId),
  }, [204]);
}

async function activeReviewSubmission() {
  const json = await request('get', `/v1/reviewSubmissions?filter[app]=${APP_ID}&include=appStoreVersionForReview,items&fields[reviewSubmissions]=appStoreVersionForReview,state,submittedDate,items,platform&fields[reviewSubmissionItems]=state,appStoreVersion&fields[appStoreVersions]=versionString,appVersionState,build&limit=20`);
  const activeStates = ['READY_FOR_REVIEW', 'WAITING_FOR_REVIEW', 'IN_REVIEW', 'UNRESOLVED_ISSUES'];
  const submission = json.data.find((item) => activeStates.includes(String(item.attributes?.state)));
  return { submission, included: json.included || [] };
}

async function createReviewSubmission() {
  return (await request('post', '/v1/reviewSubmissions', {
    data: {
      type: 'reviewSubmissions',
      attributes: { platform: 'IOS' },
      relationships: { app: { data: data('apps', APP_ID) } },
    },
  })).data;
}

async function createOrReadyReviewItem(submissionId, versionId, included) {
  const existing = included.find((item) => item.type === 'reviewSubmissionItems' && item.relationships?.appStoreVersion?.data?.id === versionId);
  const item = existing || (await request('post', '/v1/reviewSubmissionItems', {
    data: {
      type: 'reviewSubmissionItems',
      relationships: {
        reviewSubmission: { data: data('reviewSubmissions', submissionId) },
        appStoreVersion: { data: data('appStoreVersions', versionId) },
      },
    },
  })).data;
  if (item.attributes?.state === 'READY_FOR_REVIEW') return item;
  return (await request('patch', `/v1/reviewSubmissionItems/${item.id}`, {
    data: { type: 'reviewSubmissionItems', id: item.id, attributes: { state: 'READY_FOR_REVIEW' } },
  })).data;
}

async function submitReviewSubmission(submissionId) {
  return (await request('patch', `/v1/reviewSubmissions/${submissionId}`, {
    data: { type: 'reviewSubmissions', id: submissionId, attributes: { submitted: true } },
  })).data;
}

async function finalReadback(versionId, submissionId, screenshotSetId) {
  return {
    version: await request('get', `/v1/appStoreVersions/${versionId}?include=build&fields[appStoreVersions]=versionString,appVersionState,appStoreState,platform,build&fields[builds]=version,processingState,buildAudienceType,uploadedDate,usesNonExemptEncryption`),
    reviewDetail: await request('get', `/v1/appStoreVersions/${versionId}/appStoreReviewDetail`),
    localization: await request('get', `/v1/appStoreVersions/${versionId}/appStoreVersionLocalizations?fields[appStoreVersionLocalizations]=locale,whatsNew,promotionalText,description&limit=50`),
    screenshots: await request('get', `/v1/appScreenshotSets/${screenshotSetId}/appScreenshots?limit=50`),
    submission: await request('get', `/v1/reviewSubmissions/${submissionId}?include=items&fields[reviewSubmissions]=state,submittedDate,items&fields[reviewSubmissionItems]=state,appStoreVersion`),
  };
}

assertReleaseText();
const build = await waitForBuild();
const version = await findOrCreateVersion();
const versionId = version.id;
const reviewDetailId = await patchReviewDetail(versionId);
const localizationId = await patchLocalization(versionId);
const screenshotResult = await uploadScreenshotSet(localizationId);
await attachBuild(versionId, build.id);
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
  buildId: build.id,
  reviewDetailId,
  localizationId,
  screenshotSetId: screenshotResult.setId,
  screenshotDeletedCount: screenshotResult.deletedCount,
  screenshotIds: screenshotResult.uploaded.map((shot) => shot.id),
  reviewSubmissionId: submission.id,
  reviewSubmissionItemId: item.id,
  reviewSubmissionState: submitted.attributes?.state,
  submittedDate: submitted.attributes?.submittedDate || null,
  submittedAt: new Date().toISOString(),
};
fs.writeFileSync(path.join(OUT_DIR, `asc-submit-final-${VERSION}-${BUILD_NUMBER}.json`), JSON.stringify({ final, readback }, null, 2));
console.log(JSON.stringify(final, null, 2));
