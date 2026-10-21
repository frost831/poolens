import crypto from 'node:crypto';
import fs from 'node:fs';
import https from 'node:https';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const APP_ID = '6763644905';
const VERSION = '1.0.8';
const KEY_ID = '82ZGJT27W6';
const ISSUER_ID = '5a63c547-75c1-4efb-9be3-d675542a5630';
const KEY_PATH = `${process.env.HOME}/.appstoreconnect/private_keys/AuthKey_${KEY_ID}.p8`;
const BASE = 'https://api.appstoreconnect.apple.com';
const OUT_DIR = path.dirname(fileURLToPath(import.meta.url));

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

function saveResponse(label, method, urlPath, statusCode, json) {
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');
  const file = path.join(OUT_DIR, `${stamp}-${label}-${statusCode}-${slug(urlPath)}.json`);
  fs.writeFileSync(file, JSON.stringify(json || {}, null, 2));
  return file;
}

async function request(label, method, urlPath) {
  const url = new URL(`${BASE}${urlPath}`);
  const { statusCode, text } = await new Promise((resolve, reject) => {
    const req = https.request({
      method: method.toUpperCase(),
      hostname: url.hostname,
      path: `${url.pathname}${url.search}`,
      headers: {
        Authorization: `Bearer ${token()}`,
        'Content-Type': 'application/json',
      },
    }, (res) => {
      let data = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => resolve({ statusCode: res.statusCode, text: data }));
    });
    req.on('error', reject);
    req.end();
  });
  const json = text ? JSON.parse(text) : null;
  const file = saveResponse(label, method, urlPath, statusCode, json);
  console.log(`${method.toUpperCase()} ${label} ${urlPath} -> ${statusCode}`);
  if (statusCode < 200 || statusCode >= 300) {
    if (json) console.log(JSON.stringify(json, null, 2));
    throw new Error(`Unexpected response ${statusCode} for ${label}`);
  }
  return { json, file, statusCode };
}

const files = [];
async function capture(label, urlPath) {
  const result = await request(label, 'get', urlPath);
  files.push({ label, statusCode: result.statusCode, file: result.file });
  return result.json;
}

const versions = await capture(
  'versions',
  `/v1/apps/${APP_ID}/appStoreVersions?filter[platform]=IOS&fields[appStoreVersions]=versionString,appVersionState,appStoreState,platform&limit=20`,
);
const version = await capture(
  'version-108',
  `/v1/apps/${APP_ID}/appStoreVersions?filter[platform]=IOS&filter[versionString]=${VERSION}&include=build&fields[appStoreVersions]=versionString,appVersionState,appStoreState,platform,build&fields[builds]=version,processingState,buildAudienceType,uploadedDate,usesNonExemptEncryption,expired&limit=5`,
);
const versionId = version.data?.[0]?.id;
if (!versionId) throw new Error(`No App Store version found for ${VERSION}`);

const reviewDetail = await capture(
  'review-detail-108',
  `/v1/appStoreVersions/${versionId}/appStoreReviewDetail`,
);
const localizations = await capture(
  'localizations-108',
  `/v1/appStoreVersions/${versionId}/appStoreVersionLocalizations?fields[appStoreVersionLocalizations]=locale,whatsNew,promotionalText,description,keywords,marketingUrl,supportUrl&limit=50`,
);
const reviewSubmissions = await capture(
  'review-submissions',
  `/v1/reviewSubmissions?filter[app]=${APP_ID}&include=appStoreVersionForReview,items&fields[reviewSubmissions]=state,submittedDate,platform,items,appStoreVersionForReview&fields[reviewSubmissionItems]=state,appStoreVersion&fields[appStoreVersions]=versionString,appVersionState,appStoreState&limit=20`,
);
const activeSubmission = reviewSubmissions.data?.find((item) => {
  const versionForReview = item.relationships?.appStoreVersionForReview?.data?.id;
  return versionForReview === versionId;
});
let submissionDetail = null;
if (activeSubmission?.id) {
  submissionDetail = await capture(
    'review-submission-detail',
    `/v1/reviewSubmissions/${activeSubmission.id}?include=items&fields[reviewSubmissions]=state,submittedDate,items&fields[reviewSubmissionItems]=state,appStoreVersion`,
  );
}

const summary = {
  capturedAt: new Date().toISOString(),
  appId: APP_ID,
  versionId,
  files,
  versions: versions.data?.map((item) => ({ id: item.id, ...item.attributes })) || [],
  version108: {
    id: version.data?.[0]?.id,
    attributes: version.data?.[0]?.attributes || null,
    included: version.included?.map((item) => ({ type: item.type, id: item.id, ...item.attributes })) || [],
  },
  reviewDetail: {
    id: reviewDetail.data?.id,
    attributes: reviewDetail.data?.attributes || null,
  },
  localizations: localizations.data?.map((item) => ({ id: item.id, ...item.attributes })) || [],
  reviewSubmissions: reviewSubmissions.data?.map((item) => ({
    id: item.id,
    attributes: item.attributes,
    appStoreVersionForReview: item.relationships?.appStoreVersionForReview?.data?.id || null,
    itemIds: item.relationships?.items?.data?.map((rel) => rel.id) || [],
  })) || [],
  activeSubmission: activeSubmission ? {
    id: activeSubmission.id,
    attributes: activeSubmission.attributes,
    items: submissionDetail?.included?.filter((item) => item.type === 'reviewSubmissionItems').map((item) => ({ id: item.id, ...item.attributes })) || [],
  } : null,
};

fs.writeFileSync(path.join(OUT_DIR, 'summary.json'), JSON.stringify(summary, null, 2));
console.log(JSON.stringify(summary, null, 2));
