import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { inflateRawSync } from 'node:zlib';

// Census 2024 ZCTA representative points: https://www.census.gov/geographies/reference-files/time-series/geo/gazetteer-files.2024.html
// ZIP3 is only an approximation of a postal area. Choose a real ZCTA point near
// the median of each group, rather than a mean that may land outside the group.
const source = 'https://www2.census.gov/geo/docs/maps-data/data/gazetteer/2024_Gazetteer/2024_Gaz_zcta_national.zip';
const target = resolve(dirname(fileURLToPath(import.meta.url)), '../functions/_shared/freeze-zip3.json');
const response = await fetch(source);
if (!response.ok) throw new Error(`Census download failed: ${response.status}`);
const zip = Buffer.from(await response.arrayBuffer());
// The national archive has one deflated text member. Read the ZIP local header.
const nameLength = zip.readUInt16LE(26);
const extraLength = zip.readUInt16LE(28);
const compressedSize = zip.readUInt32LE(18);
const method = zip.readUInt16LE(8);
if (zip.readUInt32LE(0) !== 0x04034b50 || method !== 8 || !compressedSize) throw new Error('Unexpected Census archive format.');
const start = 30 + nameLength + extraLength;
const text = inflateRawSync(zip.subarray(start, start + compressedSize)).toString('utf8');
const groups = new Map();
for (const line of text.trim().split(/\r?\n/).slice(1)) {
  const [zcta, , , , , latRaw, lonRaw] = line.split('\t').map(value => value.trim());
  const lat = Number(latRaw); const lon = Number(lonRaw);
  if (!/^\d{5}$/.test(zcta) || !Number.isFinite(lat) || !Number.isFinite(lon)) continue;
  const key = zcta.slice(0, 3);
  if (!groups.has(key)) groups.set(key, []);
  groups.get(key).push({ lat, lon });
}
const result = {};
for (const [key, points] of [...groups].sort(([a], [b]) => a.localeCompare(b))) {
  const lat = [...points].sort((a, b) => a.lat - b.lat)[Math.floor(points.length / 2)].lat;
  const lon = [...points].sort((a, b) => a.lon - b.lon)[Math.floor(points.length / 2)].lon;
  const nearest = points.reduce((best, point) =>
    (point.lat - lat) ** 2 + (point.lon - lon) ** 2 < (best.lat - lat) ** 2 + (best.lon - lon) ** 2 ? point : best);
  result[key] = [Number(nearest.lat.toFixed(4)), Number(nearest.lon.toFixed(4))];
}
await writeFile(target, `${JSON.stringify(result)}\n`);
console.log(`Wrote ${Object.keys(result).length} ZIP3 representative points to ${target}`);
