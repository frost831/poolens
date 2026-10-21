import crypto from 'node:crypto';
import fs from 'node:fs';
import https from 'node:https';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const APP_ID = '6763644905';
const KEY_ID = '82ZGJT27W6';
const ISSUER_ID = '5a63c547-75c1-4efb-9be3-d675542a5630';
const KEY_PATH = `${process.env.HOME}/.appstoreconnect/private_keys/AuthKey_${KEY_ID}.p8`;
const VERSION = '1.0.7';
const BUILD_NUMBER = '14';
const BASE = 'https://api.appstoreconnect.apple.com';
const OUT_DIR = path.dirname(fileURLToPath(import.meta.url));

const REVIEW_NOTES = `SplashLens is a no-account pool service field reference app. No demo login is required.

Suggested review path:
1. Launch SplashLens.
2. If the role picker appears, choose Technician.
3. Open scanner or visit report workflows to review optional camera/photo flows.
4. Open the dashboard/review queue links; they route outside the native web view when appropriate.
5. Toggle offline/online as needed; core tools are cached, but private dashboard and API surfaces are intentionally not cached.

Camera, photo, and microphone permissions are optional and are used only when the reviewer chooses scanner, selected-photo, or dictated-note flows.

SplashLens is a field reference and service-proof aid. It does not replace manuals, manufacturer guidance, compliance programs, or qualified technician judgment.`;

const WHATS_NEW = 'Refreshes native store routing and offline-ready cache handling, including safer dashboard/checkout links and updated PartSnap review export behavior for field workflows.';

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
  return urlPath.replace(/[^A-Za-z0-9_.=-]+/g, '_').replace(/_+/g, '_').slice(0, 120);
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

async function waitForBuild() {
  const urlPath = `/v1/builds?filter[app]=${APP_ID}&filter[version]=${BUILD_NUMBER}&include=preReleaseVersion&fields[preReleaseVersions]=version,platform&fields[builds]=processingState,uploadedDate,version,usesNonExemptEncryption,expired,buildAudienceType&limit=20`;
  for (let attempt = 1; attempt <= 20; attempt += 1) {
    const json = await request('get', urlPath);
    const build = json.data.find((item) => item.attributes?.version === BUILD_NUMBER);
    const state = build?.attributes?.processingState || 'not visible';
    const audience = build?.attributes?.buildAudienceType || 'unknown';
    console.log(`build ${BUILD_NUMBER} state=${state} audience=${audience} attempt=${attempt}`);
    if (state === 'VALID') return build;
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

async function patchLocalization(versionId) {
  const json = await request('get', `/v1/appStoreVersions/${versionId}/appStoreVersionLocalizations?fields[appStoreVersionLocalizations]=locale,whatsNew&limit=20`);
  const loc = json.data.find((item) => item.attributes?.locale === 'en-US') || json.data[0];
  if (!loc) return null;
  await request('patch', `/v1/appStoreVersionLocalizations/${loc.id}`, {
    data: {
      type: 'appStoreVersionLocalizations',
      id: loc.id,
      attributes: { whatsNew: WHATS_NEW }
    }
  }, [200, 409]);
  return loc.id;
}

async function attachBuild(versionId, buildId) {
  await request('patch', `/v1/appStoreVersions/${versionId}/relationships/build`, {
    data: data('builds', buildId)
  }, [204]);
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

const build = await waitForBuild();
const version = await findOrCreateVersion();
const versionId = version.id;
const buildId = build.id;
const reviewDetailId = await patchReviewDetail(versionId);
const localizationId = await patchLocalization(versionId);
await attachBuild(versionId, buildId);
let { submission, included } = await activeReviewSubmission();
submission ||= await createReviewSubmission();
const item = await createOrReadyReviewItem(submission.id, versionId, included);
const submitted = await submitReviewSubmission(submission.id);

const final = {
  appId: APP_ID,
  version: VERSION,
  versionId,
  buildNumber: BUILD_NUMBER,
  buildId,
  reviewDetailId,
  localizationId,
  reviewSubmissionId: submission.id,
  reviewSubmissionItemId: item.id,
  reviewSubmissionState: submitted.attributes?.state,
  submittedAt: new Date().toISOString()
};
fs.writeFileSync(path.join(OUT_DIR, `asc-submit-final-${VERSION}-${BUILD_NUMBER}.json`), JSON.stringify(final, null, 2));
console.log(JSON.stringify(final, null, 2));
