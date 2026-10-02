export const BENCHMARK_VERSION = '2026-10-02.1';

export const REQUIRED_CATEGORIES = [
  'pumps',
  'filters',
  'heaters',
  'automation',
  'salt_systems',
  'pressure_suction_cleaners',
  'robotic_cleaners',
  'lights',
  'spa_hot_tub_swim_spa',
  'closing_equipment',
];

const source = (section, note) => ({
  kind: 'repo_reference',
  locator: 'js/errors.js',
  section,
  authority: 'compiled_manufacturer_reference_metadata',
  note,
});

export const CATALOG = [
  {
    id: 'pentair-intelliflo3-vsf', category: 'pumps', family: 'variable_speed_pump_intelliflo3',
    manufacturer: 'Pentair', models: ['IntelliFlo3 VSF'], identifiers: ['011075'],
    keywords: ['variable speed', 'drive display', 'wet end', 'rs485'],
    source: source('IntelliFlo (Pentair)', 'Model and identifier are reference metadata, not fitment or order authorization.'),
  },
  {
    id: 'hayward-tristar-vs', category: 'pumps', family: 'variable_speed_pump_tristar_vs',
    manufacturer: 'Hayward', models: ['TriStar VS'], identifiers: ['SP3206VSP'],
    keywords: ['variable speed', 'drive keypad', 'strainer housing', 'union'],
    source: source('Hayward', 'Reference model metadata; verify the full motor and wet-end label before ordering.'),
  },
  {
    id: 'jandy-vs-flopro', category: 'pumps', family: 'variable_speed_pump_vs_flopro',
    manufacturer: 'Jandy', models: ['VS FloPro'], identifiers: ['VSFHP270DV2A'],
    keywords: ['variable speed', 'flopro', 'drive controller', 'union'],
    source: source('Jandy / Zodiac', 'Reference model metadata; suffix and voltage proof remain required.'),
  },
  {
    id: 'pentair-clean-clear-plus-420', category: 'filters', family: 'cartridge_filter_clean_clear_plus',
    manufacturer: 'Pentair', models: ['Clean & Clear Plus 420'], identifiers: ['CCP420'],
    keywords: ['cartridge filter', 'four cartridge', 'clamp ring', 'air relief'],
    source: source('Pentair', 'Model-family reference only; tank generation and label proof remain required.'),
  },
  {
    id: 'hayward-swimclear-525', category: 'filters', family: 'cartridge_filter_swimclear',
    manufacturer: 'Hayward', models: ['SwimClear 525'], identifiers: ['C5030'],
    keywords: ['cartridge filter', 'four cartridge', 'band clamp', 'manual air relief'],
    source: source('Hayward', 'Reference model metadata; confirm tank label and cartridge dimensions.'),
  },
  {
    id: 'jandy-cl460', category: 'filters', family: 'cartridge_filter_jandy_cl',
    manufacturer: 'Jandy', models: ['CL Series 460'], identifiers: ['CL460'],
    keywords: ['cartridge filter', 'four cartridge', 'tank clamp', 'pressure gauge'],
    source: source('Jandy / Zodiac', 'Reference model metadata; verify CL/CV family and tank label.'),
  },
  {
    id: 'pentair-mastertemp-400', category: 'heaters', family: 'gas_heater_mastertemp',
    manufacturer: 'Pentair', models: ['MasterTemp 400'], identifiers: ['460736'],
    keywords: ['gas heater', 'membrane keypad', 'stack flue sensor', 'thermal regulator'],
    source: source('Sta-Rite MAX-E-THERM / MASTER TEMP Gas Heater', 'Reference metadata; fuel, revision, and certification must be verified.'),
  },
  {
    id: 'hayward-universal-h400', category: 'heaters', family: 'gas_heater_universal_h_series',
    manufacturer: 'Hayward', models: ['Universal H-Series 400'], identifiers: ['H400FDN'],
    keywords: ['gas heater', 'fd heater', 'display bezel', 'induced draft'],
    source: source('Hayward', 'Reference metadata; natural/LP fuel suffix and serial range are mandatory proof.'),
  },
  {
    id: 'jandy-jxi-400', category: 'heaters', family: 'gas_heater_jxi',
    manufacturer: 'Jandy', models: ['JXi 400'], identifiers: ['JXI400N'],
    keywords: ['gas heater', 'jxi', 'versaflo', 'blower'],
    source: source('Jandy / Zodiac', 'Reference metadata; confirm fuel, heat-exchanger option, and full rating plate.'),
  },
  {
    id: 'pentair-intellicenter-i5ps', category: 'automation', family: 'automation_intellicenter',
    manufacturer: 'Pentair', models: ['IntelliCenter i5PS'], identifiers: ['521903'],
    keywords: ['automation panel', 'personality board', 'rs485', 'indoor control'],
    source: source('Pentair Automation (IntelliTouch / EasyTouch)', 'Reference metadata; panel personality and expansion configuration must be captured.'),
  },
  {
    id: 'hayward-omnilogic', category: 'automation', family: 'automation_omnilogic',
    manufacturer: 'Hayward', models: ['OmniLogic'], identifiers: ['HLBASE'],
    keywords: ['automation panel', 'omni', 'local display', 'low voltage board'],
    source: source('Hayward', 'Reference metadata; verify enclosure label, board revision, and installed modules.'),
  },
  {
    id: 'jandy-aqualink-rs', category: 'automation', family: 'automation_aqualink_rs',
    manufacturer: 'Jandy', models: ['AquaLink RS'], identifiers: ['IQ904-PS'],
    keywords: ['automation panel', 'aqualink', 'power center', 'rs485'],
    source: source('Connected Pool Network', 'Reference metadata; system size and revision proof remain required.'),
  },
  {
    id: 'hayward-aquarite-t15', category: 'salt_systems', family: 'salt_aquarite_turbocell',
    manufacturer: 'Hayward', models: ['AquaRite TurboCell T-15'], identifiers: ['T-CELL-15'],
    keywords: ['salt cell', 'turbocell', 'aquarite', 'flow switch'],
    source: source('Hayward Salt (TurboCell / AquaRite)', 'Reference metadata; cell type, controller revision, and independent salt test are required.'),
  },
  {
    id: 'pentair-intellichlor-ic40', category: 'salt_systems', family: 'salt_intellichlor',
    manufacturer: 'Pentair', models: ['IntelliChlor IC40'], identifiers: ['EC-520555'],
    keywords: ['salt cell', 'intellichlor', 'flow light', 'cell blades'],
    source: source('Pentair', 'Reference metadata; confirm cell label, power center, and measured salinity.'),
  },
  {
    id: 'jandy-truclear-11k', category: 'salt_systems', family: 'salt_truclear',
    manufacturer: 'Jandy', models: ['TruClear Salt Chlorinator'], identifiers: ['TRUCLEAR11K'],
    keywords: ['salt cell', 'truclear', 'viewing window', 'cell blades'],
    source: source('Jandy TruClear', 'Reference metadata; controller, cell window, and water-test proof remain required.'),
  },
  {
    id: 'polaris-280', category: 'pressure_suction_cleaners', family: 'pressure_cleaner_polaris_280',
    manufacturer: 'Polaris', models: ['Polaris 280'], identifiers: ['F5'],
    keywords: ['pressure cleaner', 'booster pump', 'backup valve', 'tail sweep'],
    source: source('Polaris Pressure-Side Cleaners', 'Reference metadata; cleaner body, feed hose, and booster setup must be verified.'),
  },
  {
    id: 'pentair-rebel', category: 'pressure_suction_cleaners', family: 'suction_cleaner_rebel',
    manufacturer: 'Pentair', models: ['Rebel Suction-Side Cleaner'], identifiers: ['360275'],
    keywords: ['suction cleaner', 'turbine', 'two wheel', 'vacuum hose'],
    source: source('Pentair', 'Reference metadata; body generation and turbine components require visual proof.'),
  },
  {
    id: 'hayward-poolcleaner-2x', category: 'pressure_suction_cleaners', family: 'suction_cleaner_poolcleaner',
    manufacturer: 'Hayward', models: ['The PoolCleaner 2-Wheel'], identifiers: ['W3PHS21CST'],
    keywords: ['suction cleaner', 'two wheel', 'turbine vanes', 'steering cam'],
    source: source('Hayward', 'Reference metadata; wheel count and model label must be confirmed.'),
  },
  {
    id: 'dolphin-nautilus-cc-plus', category: 'robotic_cleaners', family: 'robot_dolphin_nautilus',
    manufacturer: 'Maytronics', models: ['Dolphin Nautilus CC Plus'], identifiers: ['99996403-PC'],
    keywords: ['robotic cleaner', 'dolphin', 'power supply', 'filter basket'],
    source: source('Dolphin Robot Cleaners', 'Reference metadata; serial label and power-supply generation are required.'),
  },
  {
    id: 'aiper-scuba-s1', category: 'robotic_cleaners', family: 'robot_aiper_scuba',
    manufacturer: 'Aiper', models: ['Scuba S1'], identifiers: ['SCUBA-S1'],
    keywords: ['cordless robot', 'aiper', 'charging port', 'led status'],
    source: source('Aiper Robot Cleaners', 'Reference metadata; exact model and app/status evidence must be captured.'),
  },
  {
    id: 'polaris-alpha-iq-plus', category: 'robotic_cleaners', family: 'robot_polaris_alpha_iq',
    manufacturer: 'Polaris', models: ['Alpha IQ+'], identifiers: ['VRXIQP'],
    keywords: ['robotic cleaner', 'polaris', 'iaqualink', 'caddy power supply'],
    source: source('Polaris Robot Cleaners (i-series)', 'Reference metadata; robot and power-supply labels must be paired.'),
  },
  {
    id: 'pentair-intellibrite-5g', category: 'lights', family: 'light_intellibrite_5g',
    manufacturer: 'Pentair', models: ['IntelliBrite 5G'], identifiers: ['601001'],
    keywords: ['pool light', 'intellibrite', 'niche', 'cord length'],
    source: source('Pentair Lighting', 'Reference metadata; voltage, cord length, niche, and controller compatibility are required.'),
  },
  {
    id: 'hayward-colorlogic-4', category: 'lights', family: 'light_colorlogic',
    manufacturer: 'Hayward', models: ['ColorLogic 4.0'], identifiers: ['LPCUS11100'],
    keywords: ['pool light', 'colorlogic', 'niche light', 'transformer'],
    source: source('Hayward', 'Reference metadata; voltage, generation, niche, and cord length require proof.'),
  },
  {
    id: 'jandy-watercolors-nicheless', category: 'lights', family: 'light_watercolors_nicheless',
    manufacturer: 'Jandy', models: ['WaterColors Nicheless HydroCool'], identifiers: ['JLU4C12W'],
    keywords: ['nicheless light', 'watercolors', 'hydrocool', 'one and a half inch fitting'],
    source: source('Jandy Lighting', 'Reference metadata; controller mode, voltage, fitting, and cord length remain required.'),
  },
  {
    id: 'balboa-bp7', category: 'spa_hot_tub_swim_spa', family: 'spa_pack_balboa_bp',
    manufacturer: 'Balboa', models: ['BP7 Spa Pack'], identifiers: ['G4361'],
    keywords: ['spa pack', 'bp7', 'heater tube', 'topside'],
    source: source('Spa / Hot Tub / Swim Spa', 'Reference metadata; wiring, heater, pump count, and topside compatibility require proof.'),
  },
  {
    id: 'gecko-inye5', category: 'spa_hot_tub_swim_spa', family: 'spa_pack_gecko_inye',
    manufacturer: 'Gecko', models: ['in.ye-5 Spa Pack'], identifiers: ['0610-221046'],
    keywords: ['spa pack', 'gecko', 'in ye', 'heater assembly'],
    source: source('Spa / Hot Tub / Swim Spa', 'Reference metadata; software revision, wiring, and topside compatibility require proof.'),
  },
  {
    id: 'master-spas-h2x', category: 'spa_hot_tub_swim_spa', family: 'swim_spa_master_spas_h2x',
    manufacturer: 'Master Spas', models: ['H2X Challenger Swim Spa'], identifiers: ['H2X-CHALLENGER'],
    keywords: ['swim spa', 'h2x', 'current pump', 'spa pack'],
    source: source('Spa / Hot Tub / Swim Spa', 'System-family reference only; capture the component label before any exact-part claim.'),
  },
  {
    id: 'loop-loc-ultra-loc', category: 'closing_equipment', family: 'safety_cover_loop_loc',
    manufacturer: 'LOOP-LOC', models: ['ULTRA-LOC Safety Cover'], identifiers: ['ULTRA-LOC'],
    keywords: ['safety cover', 'spring', 'anchor', 'mesh panel'],
    source: source('Closing Season Mode', 'System-family reference; cover serial, dimensions, fabric, and hardware must be verified.'),
  },
  {
    id: 'coverstar-powerflex', category: 'closing_equipment', family: 'automatic_cover_coverstar',
    manufacturer: 'Coverstar', models: ['PowerFlex Automatic Cover'], identifiers: ['POWERFLEX'],
    keywords: ['automatic cover', 'drive motor', 'rope reel', 'cover track'],
    source: source('Automatic Pool Covers - Coverstar / Cover-Pools / APC', 'Reference metadata; mechanism, serial, track, and cover dimensions require proof.'),
  },
  {
    id: 'air-supply-cyclone-3hp', category: 'closing_equipment', family: 'closing_blower_cyclone',
    manufacturer: 'Air Supply', models: ['Cyclone 3 HP Blower'], identifiers: ['4128100'],
    keywords: ['winterizing blower', 'cyclone', 'three horsepower', 'air hose'],
    source: source('Closing Season Mode', 'Reference metadata; electrical rating and blower label must be verified before service.'),
  },
];

const categoryLanguage = {
  pumps: 'circulation equipment with a motor, wet end, and plumbing unions',
  filters: 'pressure vessel with filter elements, clamp, gauge, and air relief',
  heaters: 'gas-fired pool heating equipment with rating plate and control display',
  automation: 'outdoor automation control panel with relays and low-voltage communication',
  salt_systems: 'salt chlorination equipment with cell, controller, and flow proof',
  pressure_suction_cleaners: 'water-powered cleaner body with hose and mechanical drive parts',
  robotic_cleaners: 'electrically powered robotic cleaner with power or charging equipment',
  lights: 'underwater lighting equipment requiring voltage, niche, fitting, and cord proof',
  spa_hot_tub_swim_spa: 'spa or swim-spa control equipment with heater, pumps, and topside interface',
  closing_equipment: 'seasonal closing or cover equipment requiring dimensions and configuration proof',
};

function caseProvenance(candidate, variant) {
  return {
    evidenceType: 'metadata_reference_only',
    imageProven: false,
    sourceKind: candidate.source.kind,
    sourceLocator: `${candidate.source.locator}#${candidate.source.section}`,
    limitations: variant === 'exact_label'
      ? 'Exact record evaluation is enabled only by an explicit model/reference identifier. This does not prove fitment or authorize ordering.'
      : 'No photograph is included. This case validates deterministic evidence handling and family ranking only.',
  };
}

function variantsFor(candidate, catalogIndex) {
  const sameCategory = CATALOG.filter((item) => item.category === candidate.category);
  const peer = sameCategory[(sameCategory.indexOf(candidate) + 1) % sameCategory.length];
  const model = candidate.models[0];
  const identifier = candidate.identifiers[0];
  const [keywordA, keywordB] = candidate.keywords;
  const timeOffset = catalogIndex % 7;

  return [
    {
      id: `${candidate.id}--exact-label`, variant: 'exact_label',
      evidenceText: `${candidate.manufacturer} ${model} label identifier ${identifier}; visible ${keywordA} and ${keywordB}.`,
      expectedFamily: candidate.family, expectedPartId: candidate.id,
      familyEvaluable: true, exactPartEligible: true, shouldAbstain: false,
      modeledPacketSeconds: 34 + timeOffset,
    },
    {
      id: `${candidate.id}--model-label`, variant: 'model_label',
      evidenceText: `${candidate.manufacturer} ${model}; visible ${keywordA}, ${keywordB}, and installed context. Identifier is not readable.`,
      expectedFamily: candidate.family, expectedPartId: null,
      familyEvaluable: true, exactPartEligible: false, shouldAbstain: false,
      modeledPacketSeconds: 42 + timeOffset,
    },
    {
      id: `${candidate.id}--family-evidence`, variant: 'family_evidence',
      evidenceText: `${categoryLanguage[candidate.category]}; reference family ${candidate.family}; distinctive ${candidate.keywords.join(', ')}. Brand and model plate are missing.`,
      expectedFamily: candidate.family, expectedPartId: null,
      familyEvaluable: true, exactPartEligible: false, shouldAbstain: false,
      modeledPacketSeconds: 49 + timeOffset,
    },
    {
      id: `${candidate.id}--conflicting-evidence`, variant: 'conflicting_evidence',
      evidenceText: `Conflicting notes show ${candidate.manufacturer} ${model} and ${peer.manufacturer} ${peer.models[0]}; no readable identifier and no decisive context.`,
      expectedFamily: null, expectedPartId: null,
      familyEvaluable: false, exactPartEligible: false, shouldAbstain: true,
      modeledPacketSeconds: 55 + timeOffset,
    },
  ].map((item) => ({
    ...item,
    category: candidate.category,
    provenance: caseProvenance(candidate, item.variant),
  }));
}

export const BENCHMARK_CASES = CATALOG.flatMap(variantsFor);

export const DEFAULT_THRESHOLDS = Object.freeze({
  minimumCases: 100,
  minimumCategories: REQUIRED_CATEGORIES.length,
  minimumCasesPerCategory: 10,
  top1FamilyAccuracy: 0.85,
  top3FamilyAccuracy: 0.97,
  exactPartAccuracy: 0.90,
  abstentionPrecision: 0.95,
  abstentionRecall: 0.95,
  maximumUnsafeFalseConfidenceRate: 0.01,
  maximumMedianPacketSeconds: 60,
});
