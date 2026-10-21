import crypto from 'node:crypto';
import fs from 'node:fs';
import https from 'node:https';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const APP_ID = '6763644905';
const VERSION_ID = '39cd5096-b90b-4526-bb20-961d561b1655';
const REVIEW_SUBMISSION_ID = 'e36eb61b-762e-4a13-94d1-201c3244b786';
const REVIEW_ITEM_ID = 'ZTM2ZWI2MWItNzYyZS00YTEzLTk0ZDEtMjAxYzMyNDRiNzg2fDZ8ODg4NjQwNTY4';
const KEY_ID = '82ZGJT27W6';
const ISSUER_ID = '5a63c547-75c1-4efb-9be3-d675542a5630';
const KEY_PATH = `${process.env.HOME}/.appstoreconnect/private_keys/AuthKey_${KEY_ID}.p8`;
const BASE = 'https://api.appstoreconnect.apple.com';
const OUT_DIR = path.dirname(fileURLToPath(import.meta.url));

const REVIEW_NOTES = `SplashLens is a free utility/reference wrapper around the SplashLens PWA at https://app.splashlens.com/?store=ios.

No account or demo login is required for core use.

July 27, 2026 resubmission note: the native store shell has been updated and deployed to production so store=ios runs as a free-core build only. The App Review path now shows no Stripe checkout links, no web-subscription CTAs, no paid-pilot lead capture, and no external purchase/upgrade buttons. Production evidence for the reviewed URL:
- https://app.splashlens.com/?store=ios&mode=trainer&utm_source=field_learning_os
- app.js cache marker: 20260727-store-safe-activation-funnel
- GitHub commit: 52862c97de4ff3bb8f8a221c1c34e621b2c9976f
- Cloudflare Pages production deployment: https://c1b5e99b.poolens.pages.dev

Suggested review path:
1. Launch SplashLens.
2. If the role picker appears, choose Trainer.
3. Open Report / Service Proof and use the Field Learning OS buttons: PartSnap Lesson, CPO Scenario, and Proof Review.
4. Open Scan > PartSnap for optional photo/scanner reference assistance.
5. Open Report / Service Proof to generate a customer-safe service proof/passport summary.
6. Optional camera, photo, and microphone prompts appear only after the reviewer starts the related scan, selected-photo, or dictated-note flow.

Online AI scan features require internet access. PartSnap results are possible matches with visible-proof and missing-proof prompts, not confirmed part-fit results.

SplashLens is a field reference, service-proof, and training-aid workflow. It does not replace equipment manuals, product labels, local code, official certification programs, manufacturer guidance, or qualified technician/CPO judgment. This build does not include completed training certificates, official Aquatic Council/CPO alignment, manufacturer endorsement, or guaranteed diagnosis/part-fit claims.`;

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

function saveResponse(method, urlPath, statusCode, json) {
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');
  const file = path.join(OUT_DIR, `asc-${stamp}-${method}-${slug(urlPath)}-${statusCode}.json`);
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
      res.on('data', (chunk) => {
        data += chunk;
      });
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

async function currentState() {
  const [version, buildRel, reviewDetail, submission] = await Promise.all([
    request('get', `/v1/appStoreVersions/${VERSION_ID}?include=build&fields[appStoreVersions]=versionString,appVersionState,appStoreState,platform,build&fields[builds]=version,processingState,buildAudienceType,uploadedDate,usesNonExemptEncryption,expired`),
    request('get', `/v1/appStoreVersions/${VERSION_ID}/relationships/build`),
    request('get', `/v1/appStoreVersions/${VERSION_ID}/appStoreReviewDetail`),
    request('get', `/v1/reviewSubmissions/${REVIEW_SUBMISSION_ID}?include=items&fields[reviewSubmissions]=state,submittedDate,items&fields[reviewSubmissionItems]=state,appStoreVersion`),
  ]);
  return { version, buildRel, reviewDetail, submission };
}

function findReviewItem(submissionJson) {
  const items = submissionJson.included?.filter((item) => item.type === 'reviewSubmissionItems') || [];
  return items.find((item) => item.id === REVIEW_ITEM_ID) || items[0] || null;
}

const before = await currentState();
const detailId = before.reviewDetail.data.id;
const beforeItem = findReviewItem(before.submission);

await request('patch', `/v1/appStoreReviewDetails/${detailId}`, {
  data: {
    type: 'appStoreReviewDetails',
    id: detailId,
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

await request('patch', `/v1/reviewSubmissionItems/${REVIEW_ITEM_ID}`, {
  data: {
    type: 'reviewSubmissionItems',
    id: REVIEW_ITEM_ID,
    attributes: { resolved: true },
  },
});

const submitted = await request('patch', `/v1/reviewSubmissions/${REVIEW_SUBMISSION_ID}`, {
  data: {
    type: 'reviewSubmissions',
    id: REVIEW_SUBMISSION_ID,
    attributes: { submitted: true },
  },
});

const after = await currentState();
const final = {
  appId: APP_ID,
  versionId: VERSION_ID,
  reviewDetailId: detailId,
  reviewSubmissionId: REVIEW_SUBMISSION_ID,
  reviewSubmissionItemId: REVIEW_ITEM_ID,
  beforeVersionState: before.version.data.attributes,
  beforeSubmissionState: before.submission.data.attributes?.state || null,
  beforeItemState: beforeItem?.attributes?.state || null,
  submittedState: submitted.data?.attributes?.state || null,
  submittedDate: submitted.data?.attributes?.submittedDate || null,
  afterVersionState: after.version.data.attributes,
  afterSubmissionState: after.submission.data.attributes?.state || null,
  afterItemState: findReviewItem(after.submission)?.attributes?.state || null,
  submittedAt: new Date().toISOString(),
};

fs.writeFileSync(path.join(OUT_DIR, 'asc-resubmit-final-1.0.8-build15-store-safe.json'), JSON.stringify({ final, before, after }, null, 2));
console.log(JSON.stringify(final, null, 2));
