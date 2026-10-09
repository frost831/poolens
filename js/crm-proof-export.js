const MAX_PACKET_LENGTH = 2400;
const FOOTER = 'Reference only. Verify repairs, part fit, chemical safety, and code requirements with labels, manuals, and qualified service judgment.';
const OMITTED = 'Additional detail omitted for note length; review the SplashLens Passport.';

const DESTINATIONS = {
  skimmer: {
    name: 'Skimmer',
    title: 'service note',
    order: ['customer', 'visit', 'tech', 'readings', 'chemicals', 'work', 'issue', 'equipment', 'photos', 'summary', 'recommendations', 'next', 'risk'],
  },
  poolBrain: {
    name: 'Pool Brain',
    title: 'field proof',
    order: ['customer', 'visit', 'tech', 'issue', 'equipment', 'readings', 'chemicals', 'work', 'photos', 'summary', 'recommendations', 'next', 'risk'],
  },
  jobber: {
    name: 'Jobber',
    title: 'job note',
    order: ['customer', 'visit', 'tech', 'work', 'issue', 'equipment', 'readings', 'chemicals', 'photos', 'summary', 'recommendations', 'next', 'risk'],
  },
  ptp: {
    name: 'Paythepoolman',
    title: 'service log',
    order: ['customer', 'visit', 'tech', 'readings', 'chemicals', 'issue', 'work', 'equipment', 'photos', 'summary', 'recommendations', 'next', 'risk'],
  },
};

function clean(value, limit) {
  if (typeof value !== 'string' && typeof value !== 'number') return '';
  const normalized = String(value)
    .replace(/[\x00-\x1f\x7f-\x9f\u202a-\u202e\u2066-\u2069]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const characters = Array.from(normalized);
  return characters.length > limit ? `${characters.slice(0, limit - 3).join('').trimEnd()}...` : normalized;
}

function joined(items, limit) {
  return clean(items.filter(Boolean).join(', '), limit);
}

function listed(items, count, itemLimit, totalLimit) {
  if (!Array.isArray(items)) return '';
  const suffix = items.length > count ? `+${items.length - count} more in Passport` : '';
  const shown = joined(items.slice(0, count).map(item => clean(item, itemLimit)), totalLimit - suffix.length - (suffix ? 2 : 0));
  return [shown, suffix].filter(Boolean).join(', ');
}

export function formatCrmProofPacket(passport, destination) {
  const config = DESTINATIONS[destination];
  if (!config) throw new TypeError('Unsupported CRM note destination');
  if (!passport || typeof passport !== 'object') throw new TypeError('A Service Passport is required');

  const proof = passport.proof || {};
  const readings = passport.readings || {};
  const risk = passport.callbackRisk || {};
  const status = proof.complete === true ? 'Ready' : 'Incomplete - verify before treating as final';
  const missing = listed(proof.missing, 4, 32, 180);
  const readingText = joined([
    ['FC', readings.fc], ['CC', readings.cc], ['pH', readings.ph],
    ['TA', readings.ta], ['CH', readings.ch], ['CYA', readings.cya],
  ].filter(([, value]) => value !== '' && value != null).map(([label, value]) => `${label} ${clean(value, 20)}`), 180);
  const chemicals = Array.isArray(passport.chemicals) ? passport.chemicals : [];
  const chemicalText = listed(chemicals.map(item => joined([clean(item?.name, 38), clean(item?.amt ?? item?.amount, 20)], 65)), 6, 65, 220);
  const riskLevel = ['low', 'medium', 'high'].includes(risk.level) ? risk.level : '';
  const riskFlags = listed(risk.flags, 2, 60, 170);
  const fields = {
    customer: ['Customer', clean(passport.customer, 90)],
    visit: ['Visit', joined([clean(passport.date, 30), clean(passport.visitType, 80)], 120)],
    tech: ['Tech', clean(passport.tech, 70)],
    readings: ['Readings', readingText ? joined([clean(readings.source, 30), readingText], 220) : ''],
    chemicals: ['Chemicals added', chemicalText],
    issue: ['Issue / tech note', clean(proof.issueNote, 220)],
    work: ['Work performed', clean(passport.workPerformed, 240)],
    equipment: ['Equipment', clean(passport.equipmentNotes, 200)],
    photos: ['Photo / proof references', clean(proof.photoProof, 170)],
    summary: ['Customer summary', clean(proof.customerSummary, 280)],
    recommendations: ['Recommended next step', clean(passport.recommendations, 200)],
    next: ['Next visit', clean(passport.nextVisit, 130)],
    risk: ['Callback watch', joined([riskLevel, riskFlags], 200)],
  };

  const lines = [`SplashLens ${config.title} | paste into ${config.name} notes`, `Proof status: ${status}`];
  if (!proof.complete && missing) lines.push(`Missing proof: ${missing}`);
  let omitted = false;
  for (const key of config.order) {
    const [label, value] = fields[key];
    if (!value) continue;
    const line = `${label}: ${value}`;
    const proposed = [...lines, line, '', OMITTED, FOOTER].join('\n');
    if (proposed.length <= MAX_PACKET_LENGTH) lines.push(line);
    else omitted = true;
  }
  if (omitted) lines.push('', OMITTED);
  lines.push('', FOOTER);
  return lines.join('\n');
}

export { MAX_PACKET_LENGTH };
