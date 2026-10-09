import { readFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';

const draftPath = new URL('../aso/2026-10-growth-listing-drafts.md', import.meta.url);

export const limits = Object.freeze({
  ios: { name: 30, subtitle: 30, keywords: 100, promotionalText: 170, description: 4000 },
  play: { title: 30, shortDescription: 80, fullDescription: 4000 },
});

const expected = new Set(['ios/en-US', 'ios/es-MX', 'play/en-US', 'play/es-419']);
const prohibited = [
  /\$\s*\d|\bUSD\b|\bMXN\b/iu,
  /\bin[- ]app purchases?\b|\bIAP\b|\bsubscribe in app\b/iu,
  /\bSkimmer\b|\bPool Brain\b|\bDolphinTech\b/iu,
  /https?:\/\//iu,
];

export function parseDrafts(markdown) {
  const blocks = [...markdown.matchAll(/```json\s*\r?\n([\s\S]*?)\r?\n```/g)];
  return blocks.map((match, index) => {
    try {
      return JSON.parse(match[1]);
    } catch (error) {
      throw new Error(`JSON block ${index + 1}: ${error.message}`);
    }
  });
}

export function validateDrafts(drafts) {
  const errors = [];
  const counts = [];
  const seen = new Set();
  if (drafts.length !== expected.size) errors.push(`Expected ${expected.size} listings, found ${drafts.length}`);

  for (const draft of drafts) {
    const id = `${draft.platform}/${draft.locale}`;
    const fields = limits[draft.platform];
    if (!expected.has(id)) errors.push(`Unexpected listing ${id}`);
    if (seen.has(id)) errors.push(`Duplicate listing ${id}`);
    seen.add(id);
    if (!fields) continue;

    const allowed = new Set(['platform', 'locale', ...Object.keys(fields)]);
    for (const key of Object.keys(draft)) {
      if (!allowed.has(key)) errors.push(`${id}.${key}: unexpected field`);
    }
    for (const [key, max] of Object.entries(fields)) {
      const value = draft[key];
      if (typeof value !== 'string' || !value.trim()) {
        errors.push(`${id}.${key}: missing text`);
        continue;
      }
      const count = [...value].length;
      counts.push({ id, field: key, count, max });
      if (count > max) errors.push(`${id}.${key}: ${count} > ${max}`);
      if (value !== value.trim()) errors.push(`${id}.${key}: leading or trailing whitespace`);
      for (const pattern of prohibited) {
        if (pattern.test(value)) errors.push(`${id}.${key}: prohibited store copy (${pattern})`);
      }
    }
  }
  for (const id of expected) {
    if (!seen.has(id)) errors.push(`Missing listing ${id}`);
  }
  return { counts, errors };
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  const markdown = await readFile(draftPath, 'utf8');
  const result = validateDrafts(parseDrafts(markdown));
  for (const { id, field, count, max } of result.counts) {
    process.stdout.write(`${id}.${field}: ${count}/${max}\n`);
  }
  if (result.errors.length) {
    for (const error of result.errors) process.stderr.write(`FAIL ${error}\n`);
    process.exitCode = 1;
  } else {
    process.stdout.write('PASS: four complete listing drafts within limits\n');
  }
}
