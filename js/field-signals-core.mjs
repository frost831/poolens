export const FIELD_SIGNAL_SCHEMA_VERSION = 1;

export const DEFAULT_FIELD_SIGNAL_PREFERENCES = Object.freeze({
  enabled: true,
  systemNotifications: false,
  maxDaily: 1,
  maxWeekly: 2,
  quietStart: '20:00',
  quietEnd: '07:00',
  categories: {
    proof: true,
    efficiency: true,
    equipmentUpdates: true,
    training: false,
    safety: true,
  },
});

export const DOE_PUMP_MOTOR_SOURCE = Object.freeze({
  id: 'doe-dpppm-2026',
  label: 'U.S. Department of Energy - Dedicated-Purpose Pool Pump Motors',
  url: 'https://www.energy.gov/cmei/buildings/dedicated-purpose-pool-pump-motors',
  secondaryUrl: 'https://www.energy.gov/gc/articles/dedicated-purpose-pool-pump-motors-enforcement-policy',
  verifiedAt: '2026-07-28',
  jurisdiction: 'United States',
  note: 'Standards and enforcement timing vary by motor size, manufacturing date, and product class.',
});

const PUMP_TERMS = [
  'pump', 'motor', 'impeller', 'diffuser', 'volute', 'wet end', 'wet-end',
  'pump lid', 'pump basket', 'shaft seal', 'variable speed', 'single speed',
];

const PROOF_TERMS = [
  'model plate', 'nameplate', 'serial', 'part number', 'molded number',
  'voltage', 'thp', 'horsepower', 'second photo', 'proof',
];

function cleanText(value) {
  return String(value || '').trim().toLowerCase();
}

function finiteNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function clampNumber(value, min, max, fallback) {
  const number = finiteNumber(value);
  if (number === null) return fallback;
  return Math.min(max, Math.max(min, number));
}

export function normalizeFieldSignalPreferences(value = {}) {
  const categories = value.categories && typeof value.categories === 'object'
    ? value.categories
    : {};
  return {
    enabled: value.enabled !== false,
    systemNotifications: value.systemNotifications === true,
    maxDaily: clampNumber(value.maxDaily, 0, 3, DEFAULT_FIELD_SIGNAL_PREFERENCES.maxDaily),
    maxWeekly: clampNumber(value.maxWeekly, 0, 7, DEFAULT_FIELD_SIGNAL_PREFERENCES.maxWeekly),
    quietStart: /^\d{2}:\d{2}$/.test(value.quietStart || '')
      ? value.quietStart
      : DEFAULT_FIELD_SIGNAL_PREFERENCES.quietStart,
    quietEnd: /^\d{2}:\d{2}$/.test(value.quietEnd || '')
      ? value.quietEnd
      : DEFAULT_FIELD_SIGNAL_PREFERENCES.quietEnd,
    categories: {
      proof: categories.proof !== false,
      efficiency: categories.efficiency !== false,
      equipmentUpdates: categories.equipmentUpdates !== false,
      training: categories.training === true,
      safety: categories.safety !== false,
    },
  };
}

export function classifyFieldContext(context = {}) {
  const text = cleanText([
    context.brand,
    context.category,
    context.hardware,
    context.component,
    context.model,
    context.symptom,
    context.query,
    context.description,
    ...(Array.isArray(context.missingProof) ? context.missingProof : []),
  ].filter(Boolean).join(' '));
  return {
    text,
    isPump: PUMP_TERMS.some((term) => text.includes(term)),
    hasProofLanguage: PROOF_TERMS.some((term) => text.includes(term)),
    hasModelProof: Boolean(cleanText(context.model || context.partNumber || context.modelPlate)),
    missingProofCount: Array.isArray(context.missingProof) ? context.missingProof.filter(Boolean).length : 0,
  };
}

export function buildContextualFieldSignals(context = {}) {
  const classified = classifyFieldContext(context);
  const signals = [];
  if (classified.isPump) {
    signals.push({
      id: 'pump-repair-upgrade-decision',
      category: 'efficiency',
      priority: 70,
      title: 'Repair or upgrade?',
      body: 'Compare the repair and replacement paths with the figures from this job. SplashLens will not invent energy savings.',
      actionLabel: 'Compare options',
      action: 'pump-decision',
      source: DOE_PUMP_MOTOR_SOURCE,
      equipmentType: 'pump',
    });
  }
  if (classified.isPump && (!classified.hasModelProof || classified.missingProofCount > 0)) {
    signals.push({
      id: 'pump-before-you-leave-proof',
      category: 'proof',
      priority: 90,
      title: 'Before you leave',
      body: 'Capture the pump and motor plates, THP, voltage, speed type, and one wide equipment-pad photo before quoting or ordering.',
      actionLabel: 'Open proof checklist',
      action: 'pump-proof',
      equipmentType: 'pump',
    });
  }
  if (classified.missingProofCount >= 2) {
    signals.push({
      id: 'partsnap-missing-proof',
      category: 'proof',
      priority: 95,
      title: 'One more photo can prevent a callback',
      body: 'This result still has multiple missing proof items. Capture the strongest missing item before leaving the stop.',
      actionLabel: 'Add proof photo',
      action: 'partsnap-proof',
    });
  }
  return signals.sort((a, b) => b.priority - a.priority);
}

function dayKey(timestamp) {
  return new Date(timestamp).toISOString().slice(0, 10);
}

function startOfWeek(timestamp) {
  const date = new Date(timestamp);
  const day = date.getUTCDay();
  const diff = (day + 6) % 7;
  date.setUTCDate(date.getUTCDate() - diff);
  date.setUTCHours(0, 0, 0, 0);
  return date.getTime();
}

export function isQuietTime(preferences, now = new Date()) {
  const prefs = normalizeFieldSignalPreferences(preferences);
  const [startHour, startMinute] = prefs.quietStart.split(':').map(Number);
  const [endHour, endMinute] = prefs.quietEnd.split(':').map(Number);
  const minutes = now.getHours() * 60 + now.getMinutes();
  const start = startHour * 60 + startMinute;
  const end = endHour * 60 + endMinute;
  if (start === end) return false;
  return start < end ? minutes >= start && minutes < end : minutes >= start || minutes < end;
}

export function isFieldSignalEligible(signal, preferences, history = {}, options = {}) {
  const prefs = normalizeFieldSignalPreferences(preferences);
  const now = options.now instanceof Date ? options.now : new Date(options.now || Date.now());
  const channel = options.channel || 'inline';
  if (!prefs.enabled) return { eligible: false, reason: 'disabled' };
  if (!prefs.categories[signal.category]) return { eligible: false, reason: 'category_disabled' };
  const dismissedUntil = Date.parse(history.dismissedUntil?.[signal.id] || '');
  if (Number.isFinite(dismissedUntil) && dismissedUntil > now.getTime()) {
    return { eligible: false, reason: 'snoozed' };
  }
  const completedAt = Date.parse(history.completedAt?.[signal.id] || '');
  if (Number.isFinite(completedAt) && now.getTime() - completedAt < 7 * 86400000) {
    return { eligible: false, reason: 'recently_completed' };
  }
  if (channel !== 'system') return { eligible: true, reason: 'context_match' };
  if (!prefs.systemNotifications) return { eligible: false, reason: 'system_disabled' };
  if (isQuietTime(prefs, now) && !(signal.category === 'safety' && signal.urgent === true && signal.source?.verifiedAt)) {
    return { eligible: false, reason: 'quiet_hours' };
  }
  const shown = Array.isArray(history.systemShownAt) ? history.systemShownAt.map(Date.parse).filter(Number.isFinite) : [];
  const today = dayKey(now);
  const daily = shown.filter((timestamp) => dayKey(timestamp) === today).length;
  const weekStart = startOfWeek(now);
  const weekly = shown.filter((timestamp) => timestamp >= weekStart && timestamp <= now.getTime()).length;
  if (daily >= prefs.maxDaily) return { eligible: false, reason: 'daily_cap' };
  if (weekly >= prefs.maxWeekly) return { eligible: false, reason: 'weekly_cap' };
  return { eligible: true, reason: 'context_match' };
}

export function calculatePumpDecision(input = {}) {
  const repairCost = Math.max(0, finiteNumber(input.repairCost) || 0);
  const replacementCost = Math.max(0, finiteNumber(input.replacementCost) || 0);
  const currentWatts = Math.max(0, finiteNumber(input.currentWatts) || 0);
  const proposedWatts = Math.max(0, finiteNumber(input.proposedWatts) || 0);
  const hoursPerDay = clampNumber(input.hoursPerDay, 0, 24, 0);
  const daysPerYear = clampNumber(input.daysPerYear, 0, 366, 0);
  const electricityRate = Math.max(0, finiteNumber(input.electricityRate) || 0);
  const hasEnergyInputs = currentWatts > 0 && proposedWatts > 0 && hoursPerDay > 0 && daysPerYear > 0 && electricityRate > 0;
  const currentAnnualKwh = hasEnergyInputs ? (currentWatts / 1000) * hoursPerDay * daysPerYear : null;
  const proposedAnnualKwh = hasEnergyInputs ? (proposedWatts / 1000) * hoursPerDay * daysPerYear : null;
  const currentAnnualCost = currentAnnualKwh === null ? null : currentAnnualKwh * electricityRate;
  const proposedAnnualCost = proposedAnnualKwh === null ? null : proposedAnnualKwh * electricityRate;
  const annualSavings = currentAnnualCost === null ? null : Math.max(0, currentAnnualCost - proposedAnnualCost);
  const replacementPremium = repairCost > 0 && replacementCost > 0
    ? Math.max(0, replacementCost - repairCost)
    : null;
  const simplePaybackYears = annualSavings && replacementPremium !== null
    ? replacementPremium / annualSavings
    : null;
  return {
    repairCost,
    replacementCost,
    hasEnergyInputs,
    currentAnnualKwh,
    proposedAnnualKwh,
    currentAnnualCost,
    proposedAnnualCost,
    annualSavings,
    replacementPremium,
    simplePaybackYears,
    inputsAreIllustrative: input.inputBasis !== 'measured' && input.inputBasis !== 'manufacturer',
  };
}

function money(value) {
  return Number.isFinite(value) ? `$${Math.round(value).toLocaleString('en-US')}` : '';
}

export function buildPumpCustomerSummary(input = {}, result = calculatePumpDecision(input)) {
  const equipment = [input.manufacturer, input.model].filter(Boolean).join(' ') || 'the existing pump';
  const lines = [
    `We reviewed two paths for ${equipment}: repair the existing equipment or compare it with a replacement option.`,
  ];
  if (result.repairCost > 0) lines.push(`The repair figure entered for this comparison is ${money(result.repairCost)}.`);
  if (result.replacementCost > 0) lines.push(`The replacement figure entered is ${money(result.replacementCost)}.`);
  if (result.hasEnergyInputs) {
    lines.push(`Using the entered wattage, schedule, and electric rate, the estimated annual operating-cost difference is about ${money(result.annualSavings)}.`);
    if (Number.isFinite(result.simplePaybackYears)) {
      lines.push(`The simple payback on the added upfront cost is approximately ${result.simplePaybackYears.toFixed(1)} years.`);
    }
  } else {
    lines.push('No energy-savings figure is shown because verified wattage, schedule, and utility-rate inputs were not all provided.');
  }
  lines.push('This is an option comparison, not a requirement or guarantee. Final selection should confirm model compatibility, hydraulic needs, electrical requirements, current manufacturer documentation, available products, and applicable rules.');
  return lines.join(' ');
}

export function pumpProofChecklist() {
  return [
    'Pump model plate',
    'Motor plate with THP and voltage',
    'Speed type and current schedule',
    'Wide equipment-pad photo',
    'Plumbing size and union orientation',
    'Current symptom and repair estimate',
    'Replacement model documentation',
    'Customer electric rate when discussing savings',
  ];
}
