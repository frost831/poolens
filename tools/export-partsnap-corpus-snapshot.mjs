import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { getPartSnapCorpusSnapshot } from '../functions/_shared/partsnap-corpus.mjs';

const outDir = path.resolve('data/partsnap/generated');
const outPath = path.join(outDir, 'partsnap-corpus-snapshot.json');
const snapshot = getPartSnapCorpusSnapshot();

await mkdir(outDir, { recursive: true });
await writeFile(outPath, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8');

console.log(JSON.stringify({
  ok: true,
  outPath,
  seedFamilyCount: snapshot.stats.seedFamilyCount,
  targetFamilyCount: snapshot.stats.targetFamilyCount,
  sourceCount: snapshot.sourceCount,
}, null, 2));
