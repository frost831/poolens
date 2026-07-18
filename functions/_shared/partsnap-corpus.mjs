const SOURCE_LOOKUP = {
  'pentair-replacement-parts': {
    tier: 1,
    label: 'Pentair official replacement parts catalog',
    url: 'https://www.pentair.com/en-us/pool-spa/products/replacement-parts.html',
  },
  'pentair-2025-2026-catalog': {
    tier: 1,
    label: 'Pentair 2025-2026 product catalog',
    url: 'https://www.pentair.com/en-us/pool-spa/products/catalog.html',
  },
  'hayward-manuals': {
    tier: 1,
    label: 'Hayward official manuals and guides',
    url: 'https://www.hayward.com/guide-manuals',
  },
  'hayward-buyers-guide': {
    tier: 1,
    label: 'Hayward buyer guide and parts list lane',
    url: 'https://www.hayward.com/tools/buyers-guide',
  },
  'jandy-replacement-parts': {
    tier: 1,
    label: 'Jandy official products and replacement parts route',
    url: 'https://www.jandy.com/en/products',
  },
  'zodiac-genuine-parts': {
    tier: 1,
    label: 'Zodiac/Fluidra genuine parts route',
    url: 'https://www.zodiacpoolsystems.com/en/parts',
  },
  'maytronics-genuine-parts': {
    tier: 1,
    label: 'Maytronics official genuine robot parts',
    url: 'https://www.maytronics.com/en-us/parts-and-accessories.html',
  },
  'pool360-print-catalogs': {
    tier: 2,
    label: 'POOL360/SCP public print catalogs',
    url: 'https://www.pool360.com/PrintCatalogs',
  },
  'inyo-public-diagrams': {
    tier: 3,
    label: 'INYO public parts diagrams',
    url: 'https://www.inyopools.com/',
  },
  'balboa-user-guides': {
    tier: 1,
    label: 'Balboa official PDF user guides',
    url: 'https://www.balboawater.com/support/pdf-user-guides/',
  },
  'gecko-docs': {
    tier: 1,
    label: 'Gecko Alliance documentation',
    url: 'https://geckoalliance.com/support/',
  },
  'waterway-support': {
    tier: 1,
    label: 'Waterway product support',
    url: 'https://waterwayplastics.com/support/',
  },
  'master-spas-manuals': {
    tier: 1,
    label: 'Master Spas hot tub and swim spa manuals',
    url: 'https://www.masterspas.com/hot-tub-owners-manuals/',
  },
  'cal-spas-manuals': {
    tier: 1,
    label: 'Cal Spas owner manuals',
    url: 'https://calspas.com/owners-manuals',
  },
  'coast-spas-manuals': {
    tier: 1,
    label: 'Coast Spas manuals',
    url: 'https://www.coastspas.com/manuals.php',
  },
};

const SEED_FAMILIES = [
  family('pentair-pump-lids-baskets-orings', ['pentair-replacement-parts'], 'Pentair', 'pump', 'pump lid, basket, and O-ring family', ['SuperFlo', 'SuperMax', 'WhisperFlo', 'IntelliFlo'], ['pump lid', 'strainer lid', 'basket', 'o-ring', 'oring', 'pot lid'], ['clear lid', 'round strainer basket', 'lid clamp', 'molded lid number'], ['pump model plate', 'lid molded number', 'basket diameter', 'O-ring cross-section'], ['Pentair pump lids can look similar across wet-end generations.']),
  family('pentair-wet-end-seal-impeller', ['pentair-replacement-parts'], 'Pentair', 'pump', 'wet-end seal, diffuser, impeller, and seal plate family', ['WhisperFlo', 'SuperFlo', 'SuperMax', 'IntelliFlo'], ['impeller', 'diffuser', 'seal plate', 'shaft seal', 'mechanical seal', 'wet end'], ['vane pattern', 'ceramic seal', 'seal plate ribs', 'diffuser ring'], ['pump model plate', 'HP/THP and motor frame', 'impeller molded number', 'diffuser face photo'], ['Do not match impellers from horsepower alone.']),
  family('pentair-filter-lid-orings-air-relief', ['pentair-replacement-parts'], 'Pentair', 'filter', 'filter lid O-ring, clamp, gauge, and air relief family', ['Clean & Clear', 'FNS Plus', 'Quad DE', 'Tagelus', 'Sand Dollar'], ['filter o-ring', 'air relief', 'pressure gauge', 'filter clamp', 'cartridge lid'], ['tank band clamp', 'air bleed assembly', 'pressure gauge on lid'], ['filter model label', 'tank size', 'clamp style', 'air relief thread style'], ['Filter pressure parts require exact model and safety procedure.']),
  family('pentair-mastertemp-heater-sensors', ['pentair-replacement-parts'], 'Pentair', 'heater', 'MasterTemp / Max-E-Therm sensor and ignition family', ['MasterTemp', 'Max-E-Therm', 'Sta-Rite'], ['thermal regulator', 'thermistor', 'stack flue sensor', 'igniter', 'control board', 'pressure switch'], ['heater control display', 'gas heater jacket', 'sensor harness', 'igniter lead'], ['heater model/serial plate', 'error code display', 'gas/electrical boundary', 'manual part diagram'], ['Heater work can be gas/electrical safety-sensitive.']),
  family('hayward-super-pump-lid-basket', ['hayward-manuals', 'hayward-buyers-guide'], 'Hayward', 'pump', 'Super Pump lid, basket, O-ring, and drain plug family', ['Super Pump', 'Super Pump XE', 'MaxFlo', 'TriStar'], ['super pump', 'pump lid', 'basket', 'lid o-ring', 'drain plug'], ['ribbed pump basket', 'Hayward strainer lid', 'pump housing ears'], ['pump nameplate', 'wet-end body photo', 'lid/basket dimensions', 'molded part marking'], ['Super Pump, MaxFlo, and TriStar parts are easy to confuse from a cropped photo.']),
  family('hayward-wet-end-seal-impeller', ['hayward-manuals', 'hayward-buyers-guide'], 'Hayward', 'pump', 'Hayward impeller, diffuser, and shaft seal family', ['Super Pump', 'MaxFlo', 'TriStar', 'NorthStar'], ['impeller', 'diffuser', 'shaft seal', 'seal plate', 'motor seal'], ['impeller vanes', 'diffuser nose', 'seal plate gasket'], ['pump model plate', 'horsepower/service factor', 'impeller molded number', 'seal seat diameter'], ['A motor HP label alone is not enough for impeller selection.']),
  family('hayward-aquarite-turbocell-flow', ['hayward-manuals'], 'Hayward', 'salt', 'AquaRite TurboCell, flow switch, and control board family', ['AquaRite', 'TurboCell', 'T-CELL', 'AquaTrol'], ['salt cell', 't-cell', 'turbo cell', 'flow switch', 'main board', 'display board', 'chlorinator'], ['clear cell unions', 'flow switch tee', 'AquaRite display', 'cell cord'], ['cell label', 'control box model', 'instant salinity screen', 'flow switch plug'], ['Cell type setting must match the installed cell before diagnosis.']),
  family('hayward-hseries-heater-ignition-sensors', ['hayward-manuals'], 'Hayward', 'heater', 'H-Series heater ignition, sensor, and board family', ['H-Series', 'Universal H-Series', 'FD'], ['heater', 'igniter', 'flame sensor', 'thermistor', 'pressure switch', 'control board'], ['heater keypad', 'FD style jacket', 'igniter harness', 'water pressure switch'], ['heater model/serial', 'display code', 'gas type', 'manual troubleshooting table'], ['Gas heater repairs need qualified verification.']),
  family('hayward-omni-automation-relay', ['hayward-manuals'], 'Hayward', 'automation', 'Omni automation relay, RS-485, actuator, and app-pairing family', ['OmniLogic', 'OmniPL', 'OmniHub'], ['omni', 'automation', 'relay', 'actuator', 'rs-485', 'wifi', 'app offline'], ['automation enclosure', 'relay bank', 'RS-485 terminal', 'actuator valve'], ['controller model', 'firmware/app screen', 'relay labels', 'wiring photo'], ['Line-voltage and low-voltage automation faults should be escalated carefully.']),
  family('jandy-jxi-heater-sensor-ignition', ['jandy-replacement-parts'], 'Jandy', 'heater', 'JXi heater sensor, ignition, and bypass family', ['JXi', 'Legacy', 'Laars'], ['jxi', 'heater', 'igniter', 'flame sensor', 'pressure switch', 'thermal regulator', 'bypass'], ['JXi jacket', 'control display', 'sensor harness', 'compact heater cabinet'], ['heater data plate', 'display fault', 'gas type', 'manual parts diagram'], ['Do not assume ignition or board failure from one symptom.']),
  family('jandy-aqualink-automation', ['jandy-replacement-parts'], 'Jandy', 'automation', 'AquaLink / iAquaLink board, relay, actuator, and RS-485 family', ['AquaLink', 'iAquaLink', 'AquaLink RS', 'AquaLink EDGE'], ['aqualink', 'iaqualink', 'automation board', 'relay', 'actuator', 'rs-485', 'antenna'], ['Jandy power center', 'relay socket', 'actuator cam', 'RS-485 terminal block'], ['power center model', 'app screen', 'device assignment', 'wiring photo'], ['App problems can be network, firmware, board, or wiring.']),
  family('jandy-zodiac-cleaner-polaris', ['zodiac-genuine-parts', 'jandy-replacement-parts'], 'Polaris', 'cleaner', 'Polaris pressure cleaner bag, hose, wheel, tail, and backup valve family', ['Polaris 280', 'Polaris 360', 'Polaris 380', 'Quattro'], ['polaris', 'backup valve', 'tail sweep', 'cleaner bag', 'wheel', 'hose float'], ['pressure cleaner body', 'in-line backup valve', 'zippered bag', 'tail sweep'], ['cleaner model', 'booster pump presence', 'wheel/drive side photo', 'bag collar type'], ['Cleaner generations share lookalike bags, wheels, and hose parts.']),
  family('maytronics-dolphin-robot-consumables', ['maytronics-genuine-parts'], 'Maytronics', 'robot', 'Dolphin robot filters, brushes, tracks, cable, and power supply family', ['Dolphin', 'Niya', 'M-series', 'S-series', 'Nautilus'], ['dolphin', 'robot', 'track', 'brush', 'filter basket', 'power supply', 'cable', 'swivel'], ['robot track belt', 'pleated filter basket', 'floating cable', 'blue/yellow brushes'], ['robot model/serial', 'power supply label', 'track/brush profile', 'cable connector photo'], ['Robot accessories vary sharply by generation and retailer model.']),
  family('cordless-robot-new-tech', ['maytronics-genuine-parts'], 'multi-brand', 'robot', 'cordless robot charger, dock, filter, track, and impeller family', ['Beatbot', 'Aiper', 'Wybot', 'Ecovacs', 'iGarden'], ['cordless robot', 'charging dock', 'battery', 'filter tray', 'track', 'brush', 'impeller'], ['charging contacts', 'dock cradle', 'sealed battery body', 'large debris tray'], ['brand/model label', 'charger label', 'app/status light', 'runtime symptom'], ['Do not mix charger or battery assumptions across cordless robot brands.']),
  family('automation-actuators-valve-controls', ['hayward-manuals', 'jandy-replacement-parts', 'pentair-replacement-parts'], 'multi-brand', 'automation', 'valve actuator, cam, microswitch, relay, and transformer family', ['Pentair', 'Hayward', 'Jandy', 'Intermatic'], ['actuator', 'valve actuator', 'cam', 'micro switch', 'relay', 'transformer', 'timer'], ['black actuator housing', 'cam stack', 'relay contacts', 'transformer label'], ['automation brand', 'voltage label', 'valve position', 'wiring/control photo'], ['Miswired relays and actuator cams can create repeat callbacks.']),
  family('pool-light-niche-transformer', ['hayward-manuals', 'jandy-replacement-parts', 'pentair-replacement-parts'], 'multi-brand', 'lighting', 'pool light niche, gasket, transformer, and LED module family', ['ColorLogic', 'IntelliBrite', 'WaterColors', 'MicroBrite', 'GloBrite'], ['pool light', 'niche', 'light gasket', 'transformer', 'led module', 'junction box'], ['underwater fixture face ring', 'low-voltage transformer', 'junction box', 'niche cord'], ['fixture model', 'voltage', 'transformer label', 'GFCI behavior'], ['Lighting work requires voltage and bonding/GFCI verification.']),
  family('salt-cell-generic-flow-cleaning', ['hayward-manuals', 'jandy-replacement-parts', 'pentair-replacement-parts'], 'multi-brand', 'salt', 'salt cell, flow switch, unions, and control display family', ['AquaRite', 'Intellichlor', 'iChlor', 'TruClear', 'AquaPure'], ['salt cell', 'chlorinator', 'flow switch', 'cell cable', 'salt reading', 'low salt'], ['clear cell body', 'cell unions', 'control lights', 'flow tee'], ['cell model label', 'controller model', 'salt reading', 'water test verification'], ['Manual salt test and cell type settings matter before replacement.']),
  family('balboa-spa-pack-topside-heater', ['balboa-user-guides'], 'Balboa', 'spa', 'spa pack, topside, heater tube, sensor, and pressure/flow switch family', ['BP', 'VS', 'GS', 'spaTouch', 'TP'], ['balboa', 'spa pack', 'topside', 'heater tube', 'temperature sensor', 'flow switch', 'pressure switch'], ['metal heater tube', 'topside keypad', 'pack label', 'sensor plugs'], ['pack label', 'topside code', 'GFCI trip timing', 'water level/filter condition'], ['Spa packs combine water, heat, and electrical safety boundaries.']),
  family('gecko-spa-control-y-xe-yt', ['gecko-docs'], 'Gecko', 'spa', 'Gecko Y/XE/YT pack, keypad, heater, sensor, and in.touch family', ['Y series', 'XE', 'YT', 'in.touch', 'in.k1000'], ['gecko', 'spa pack', 'keypad', 'heater', 'sensor', 'wifi module', 'in.touch'], ['Gecko pack label', 'keypad display', 'heater tube', 'module cable'], ['pack model label', 'keypad code', 'manual link', 'pump/load configuration'], ['Gecko pack configs depend on exact equipment loadout.']),
  family('waterway-neo-spa-pack', ['waterway-support'], 'Waterway', 'spa', 'Waterway NEO pack, topside, heater, and pump wet-end family', ['NEO', 'Executive', 'Viper', 'Iron Might'], ['waterway', 'neo', 'spa pack', 'topside', 'wet end', 'circ pump', 'jet pump'], ['Waterway pump wet end', 'NEO topside', 'heater manifold', 'pump union'], ['pack label', 'pump label', 'topside code', 'jet/circ pump role'], ['Pump wet ends and motors are not interchangeable by appearance alone.']),
  family('swim-spa-current-pump', ['master-spas-manuals', 'cal-spas-manuals', 'coast-spas-manuals'], 'multi-brand', 'spa', 'swim spa current pump, diverter, suction, and jet-bank family', ['H2X', 'Endless Pools', 'Hydropool', 'TidalFit', 'SwimLife', 'Coast Swim Spa'], ['swim spa', 'current pump', 'river jet', 'diverter valve', 'suction cover', 'jet bank', 'manifold'], ['large current jet', 'multiple jet pumps', 'diverter handle', 'VGB suction cover'], ['brand/model plate', 'pump labels', 'suction cover marking', 'which jet bank is weak'], ['Current systems can involve multiple pumps and diverters; isolate the lane first.']),
  family('spa-ozone-uv-check-valve', ['balboa-user-guides', 'gecko-docs', 'waterway-support'], 'multi-brand', 'spa', 'spa ozone, UV, mineral/salt, bromine, and check-valve family', ['Balboa', 'Gecko', 'Waterway', 'Hot Spring', 'Jacuzzi', 'Sundance'], ['ozone', 'uv', 'check valve', 'mineral cartridge', 'bromine feeder', 'salt system', 'biofilm'], ['small clear tubing', 'ozone injector', 'UV lamp module', 'mineral cartridge'], ['sanitizer model', 'tubing direction', 'water intrusion proof', 'manual water test'], ['Ozone/UV clues help routing but do not replace water testing.']),
];

function family(id, sourceIds, manufacturer, category, component, modelFamilies, aliases, visualClues, requiredProof, lookalikeWarnings) {
  const sources = sourceIds.map((sourceId) => SOURCE_LOOKUP[sourceId]).filter(Boolean);
  return {
    id,
    manufacturer,
    category,
    component,
    modelFamilies,
    aliases,
    visualClues,
    requiredProof,
    lookalikeWarnings,
    sources,
    sourceTier: Math.min(...sources.map((source) => source.tier)),
  };
}

function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function containsPhrase(haystack, phrase) {
  const normalized = normalizeText(phrase);
  if (!normalized) return false;
  return haystack.includes(normalized);
}

function flattenScanText(result = {}) {
  const parts = [
    result.manufacturer,
    result.category,
    result.component,
    result.model,
    result.partNumber,
    result.description,
    result.verificationNotes,
    result.escalationSummary,
    ...(Array.isArray(result.searchTerms) ? result.searchTerms : []),
    ...(Array.isArray(result.visibleEvidence) ? result.visibleEvidence : []),
    ...(Array.isArray(result.missingProof) ? result.missingProof : []),
  ];
  return normalizeText(parts.filter(Boolean).join(' '));
}

function scoreFamily(result, familyRow, scanText) {
  let score = 0;
  const reasons = [];
  const resultManufacturer = normalizeText(result.manufacturer);
  const resultCategory = normalizeText(result.category);

  if (resultManufacturer && containsPhrase(normalizeText(familyRow.manufacturer), resultManufacturer)) {
    score += 6;
    reasons.push('brand');
  } else if (familyRow.manufacturer === 'multi-brand') {
    const matchedFamilyBrand = familyRow.modelFamilies.some((model) => containsPhrase(scanText, model));
    if (matchedFamilyBrand) {
      score += 4;
      reasons.push('brand/family');
    }
  }

  if (resultCategory && containsPhrase(normalizeText(familyRow.category), resultCategory)) {
    score += 5;
    reasons.push('category');
  }

  const modelHits = familyRow.modelFamilies.filter((model) => containsPhrase(scanText, model));
  if (modelHits.length) {
    score += Math.min(10, modelHits.length * 5);
    reasons.push('model family');
  }

  const aliasHits = familyRow.aliases.filter((alias) => containsPhrase(scanText, alias));
  if (aliasHits.length) {
    score += Math.min(12, aliasHits.length * 3);
    reasons.push('part language');
  }

  const clueHits = familyRow.visualClues.filter((clue) => containsPhrase(scanText, clue));
  if (clueHits.length) {
    score += Math.min(6, clueHits.length * 2);
    reasons.push('visual clue');
  }

  const partNumber = normalizeText(result.partNumber);
  if (partNumber && /[a-z]{2,}|[0-9]{3,}/.test(partNumber)) {
    const compactPart = partNumber.replace(/\s/g, '');
    if ([...familyRow.aliases, ...familyRow.modelFamilies].some((term) => compactPart.includes(normalizeText(term).replace(/\s/g, '')))) {
      score += 5;
      reasons.push('visible marking');
    }
  }

  return { score, reasons: [...new Set(reasons)] };
}

function matchLevelFor(score, reasons) {
  if (score >= 16 && reasons.includes('visible marking')) return 'visible-marking source hint';
  if (score >= 14 && reasons.includes('model family')) return 'source-backed family';
  if (score >= 9) return 'source-backed clue';
  return 'weak source hint';
}

export function attachPartSnapCorpusCandidates(result = {}) {
  if (!result || typeof result !== 'object') return result;
  const scanText = flattenScanText(result);
  const candidates = SEED_FAMILIES
    .map((familyRow) => {
      const scored = scoreFamily(result, familyRow, scanText);
      return { familyRow, ...scored };
    })
    .filter((match) => match.score >= 8)
    .sort((a, b) => b.score - a.score || a.familyRow.sourceTier - b.familyRow.sourceTier)
    .slice(0, 4)
    .map(({ familyRow, score, reasons }) => ({
      id: familyRow.id,
      manufacturer: familyRow.manufacturer,
      category: familyRow.category,
      component: familyRow.component,
      modelFamilies: familyRow.modelFamilies.slice(0, 5),
      matchLevel: matchLevelFor(score, reasons),
      matchScore: score,
      matchReasons: reasons,
      sourceTier: familyRow.sourceTier,
      sourceLabels: familyRow.sources.map((source) => source.label),
      sourceUrls: familyRow.sources.map((source) => source.url),
      requiredProof: familyRow.requiredProof.slice(0, 5),
      lookalikeWarnings: familyRow.lookalikeWarnings.slice(0, 3),
    }));

  const top = candidates[0] || null;
  return {
    ...result,
    corpusStatus: {
      label: top ? 'source-backed candidates' : 'ai-only',
      candidateCount: candidates.length,
      topSourceTier: top ? top.sourceTier : null,
      corpusVersion: 'seed-2026-07-17',
      note: top
        ? 'AI result was compared against the SplashLens seed evidence corpus. Verify proof before ordering.'
        : 'No source-backed family matched this scan yet. Treat this as AI-only and capture more proof.',
    },
    corpusCandidates: candidates,
  };
}

export const partsnapCorpusStats = {
  version: 'seed-2026-07-17',
  seedFamilyCount: SEED_FAMILIES.length,
  targetFamilyCount: 500000,
  categories: [...new Set(SEED_FAMILIES.map((row) => row.category))].sort(),
};

export function getPartSnapCorpusSnapshot() {
  const byCategory = new Map();
  const byManufacturer = new Map();
  const bySourceTier = new Map();
  for (const row of SEED_FAMILIES) {
    byCategory.set(row.category, (byCategory.get(row.category) || 0) + 1);
    byManufacturer.set(row.manufacturer, (byManufacturer.get(row.manufacturer) || 0) + 1);
    bySourceTier.set(`tier_${row.sourceTier}`, (bySourceTier.get(`tier_${row.sourceTier}`) || 0) + 1);
  }
  const toRows = (map) => Array.from(map.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

  return {
    ok: true,
    generatedAt: new Date().toISOString(),
    stats: partsnapCorpusStats,
    coverage: {
      byCategory: toRows(byCategory),
      byManufacturer: toRows(byManufacturer),
      bySourceTier: toRows(bySourceTier),
    },
    sourceCount: Object.keys(SOURCE_LOOKUP).length,
    sources: Object.entries(SOURCE_LOOKUP).map(([id, source]) => ({ id, ...source }))
      .sort((a, b) => a.tier - b.tier || a.id.localeCompare(b.id)),
    nextIngestionLanes: [
      'Pentair replacement-parts PDFs by category',
      'Hayward manual and buyer-guide part tables',
      'Jandy/Zodiac/Fluidra official catalog routes',
      'Maytronics robot parts and accessory families',
      'POOL360/SCP public sourcebook aliases where allowed',
      'Balboa/Gecko/Waterway spa-pack manuals',
      'Master Spas, Cal Spas, and Coast swim-spa manuals',
      'Human-reviewed PartSnap wrong/missing tickets',
    ],
    trustRules: [
      'AI-only results never become exact-fit claims.',
      'Source-backed means the family has supporting source language, not final ordering approval.',
      'Partner-verified is reserved for written partner-approved cards.',
      'Every ordering path needs model plate, markings, dimensions, or manual diagram verification.',
    ],
  };
}
