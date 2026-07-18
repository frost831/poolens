import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const inputPath = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.resolve('data/partsnap/generated/partsnap-review-export.json');
const outDir = path.resolve('data/partsnap/generated');
const outPath = path.join(outDir, 'partsnap-promotion-draft.json');

function clean(value, max = 180) {
  return String(value || '').replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, max);
}

function slug(value) {
  const base = clean(value, 120)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 90);
  return base || `review-${Date.now().toString(36)}`;
}

function list(value, max = 8) {
  return Array.isArray(value) ? value.map((item) => clean(item)).filter(Boolean).slice(0, max) : [];
}

let payload;
try {
  payload = JSON.parse(await readFile(inputPath, 'utf8'));
} catch (error) {
  console.error(JSON.stringify({
    ok: false,
    error: `Could not read review export at ${inputPath}`,
    hint: 'Export /api/partsnap-review JSON into data/partsnap/generated/partsnap-review-export.json, or pass a path as the first argument.',
    detail: error.message,
  }, null, 2));
  process.exit(1);
}

const tickets = Array.isArray(payload.tickets) ? payload.tickets : Array.isArray(payload) ? payload : [];
const draftFamilies = tickets
  .filter((ticket) => ['corpus-gap', 'senior-review', 'needs-triage'].includes(clean(ticket.status, 80)))
  .map((ticket) => {
    const manufacturer = clean(ticket.manufacturer || 'multi-brand', 120) || 'multi-brand';
    const category = clean(ticket.category || 'other', 80) || 'other';
    const component = clean(ticket.component || ticket.note || 'reviewed field part family', 180);
    const model = clean(ticket.model || '', 120);
    const partNumber = clean(ticket.partNumber || '', 120);
    const visible = list(ticket.visibleEvidence, 8);
    const missing = list(ticket.missingProof, 8);
    return {
      id: `draft-${slug([manufacturer, model, component, partNumber].filter(Boolean).join('-'))}`,
      sourceIds: ['partsnap-field-feedback'],
      manufacturer,
      category,
      component: `${component} family`,
      modelFamilies: [model, partNumber].filter(Boolean),
      aliases: [component, model, partNumber].filter(Boolean),
      visualClues: visible.length ? visible : ['TODO: add reviewed visual clue'],
      requiredProof: missing.length ? missing : ['model plate', 'visible marking', 'source/manual verification'],
      lookalikeWarnings: ['TODO: add reviewed lookalike warning before promotion'],
      promotionReview: {
        ticketId: clean(ticket.id, 120),
        originalStatus: clean(ticket.status, 80),
        reviewerTodo: [
          'Replace sourceIds with official or permitted source IDs when available.',
          'Rewrite component as a family, not an exact part.',
          'Add required proof before ordering.',
          'Keep partner-verified language out unless written approval exists.',
        ],
      },
    };
  });

const draft = {
  version: new Date().toISOString().slice(0, 10),
  status: 'draft_from_review_export_not_approved',
  notes: 'Do not import this file directly. Human review must copy approved rows into data/partsnap/imports/approved-field-promotions.json.',
  sourceReviewExport: inputPath,
  families: draftFamilies,
};

await mkdir(outDir, { recursive: true });
await writeFile(outPath, `${JSON.stringify(draft, null, 2)}\n`, 'utf8');
console.log(JSON.stringify({
  ok: true,
  inputPath,
  outPath,
  ticketsRead: tickets.length,
  draftFamilyCount: draftFamilies.length,
}, null, 2));
