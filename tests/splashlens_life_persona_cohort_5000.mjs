import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const args = process.argv.slice(2);
const implementedMode = args.includes('--implemented');
const positionalArgs = args.filter((arg) => !arg.startsWith('--'));
const observedPath = positionalArgs[1]
  ? path.resolve(positionalArgs[1])
  : path.join(root, 'docs', 'persona-lab', '2026-07-16', 'observed-workflows.json');
const outputDir = positionalArgs[0]
  ? path.resolve(positionalArgs[0])
  : path.join(root, 'docs', 'persona-lab', '2026-07-16-5000');
const runScenario = implementedMode ? 'implemented_recommendations' : 'baseline_plus_recommendations';

if (!fs.existsSync(observedPath)) {
  throw new Error(`Missing browser evidence anchor: ${observedPath}`);
}

const observed = JSON.parse(fs.readFileSync(observedPath, 'utf8'));
const observedByRole = Object.fromEntries(observed.roles.map((entry) => [entry.role, entry]));
const observedBaseUrl = observed.base_url || 'browser smoke anchor';

const ROLE_CONFIG = {
  tech: {
    label: 'Service Tech',
    baseEase: 82,
    baseClarity: 81,
    baseWow: 69,
    baseTtv: 39,
    fit: 94,
    timeSaved: 18,
    anchor: 'A real code becomes a cautious field path with proof and verification language.',
    firstAction: 'Look up a code or identify a part.',
    goals: ['identify an equipment code', 'avoid a wrong part order', 'prepare a senior-tech packet', 'calculate a field dose', 'save visit proof'],
    settings: ['solo residential route', 'multi-tech service company', 'warranty service route', 'commercial pool route', 'repair-only specialist'],
  },
  facility: {
    label: 'Facility / CPO',
    baseEase: 86,
    baseClarity: 88,
    baseWow: 76,
    baseTtv: 31,
    fit: 92,
    timeSaved: 16,
    anchor: 'A facility situation becomes numbered actions and a clear resolve-or-escalate decision.',
    firstAction: 'Choose the situation happening at the water.',
    goals: ['run a daily pool check', 'respond to a contamination event', 'document a dose', 'prepare an escalation packet', 'record equipment proof'],
    settings: ['apartment or HOA pool', 'swim school', 'hotel or resort', 'municipal or school facility', 'fitness or medical facility'],
  },
  counter: {
    label: 'Counter / Distributor',
    baseEase: 73,
    baseClarity: 77,
    baseWow: 60,
    baseTtv: 52,
    fit: 87,
    timeSaved: 14,
    anchor: 'A part result exposes missing proof, callback risk, and a vendor-ready packet instead of a confident guess.',
    firstAction: 'Photograph the part or label and collect missing proof.',
    goals: ['identify a walk-in part', 'collect the missing label proof', 'send a vendor packet', 'reduce a wrong counter sale', 'compare possible part families'],
    settings: ['independent pool store', 'regional distributor counter', 'manufacturer support desk', 'mobile parts seller', 'service-company stock room'],
  },
  trainer: {
    label: 'Trainer',
    baseEase: 65,
    baseClarity: 68,
    baseWow: 49,
    baseTtv: 64,
    fit: 80,
    timeSaved: 12,
    anchor: 'Apprentice Mode turns a result into observe-prove-order coaching once a PartSnap result exists.',
    firstAction: 'Open a five-minute lesson or scenario.',
    goals: ['teach proof before ordering', 'run a five-minute field lesson', 'review a mystery part', 'practice escalation questions', 'use a facility scenario'],
    settings: ['CPO classroom', 'manufacturer training', 'service-company ride-along', 'trade-school lab', 'independent online training'],
  },
  homeowner: {
    label: 'Homeowner',
    baseEase: 70,
    baseClarity: 65,
    baseWow: 49,
    baseTtv: 49,
    fit: 70,
    timeSaved: 9,
    anchor: 'Volume and turnover math provide an immediate answer without requiring an account.',
    firstAction: 'Calculate a basic answer or prepare a note for a professional.',
    goals: ['estimate pool volume', 'understand turnover time', 'prepare a clear note for a pro', 'check a basic dosing input', 'know when to stop and call a pro'],
    settings: ['first-time pool owner', 'experienced DIY owner', 'short-term rental owner', 'HOA board volunteer', 'owner working with a service company'],
  },
};

const EXPERIENCE = ['0-1 years', '2-5 years', '6-10 years', '11-20 years', '21+ years'];
const EXPERIENCE_RANGES = {
  '0-1 years': [0, 1],
  '2-5 years': [2, 5],
  '6-10 years': [6, 10],
  '11-20 years': [11, 20],
  '21+ years': [21, 35],
};
const NAMES = [
  'Alex Reed', 'Jordan Diaz', 'Casey Patel', 'Morgan Brooks', 'Taylor Kim',
  'Riley Walker', 'Jamie Nguyen', 'Avery Garcia', 'Cameron Miller', 'Drew Johnson',
  'Sam Carter', 'Robin Clark', 'Jessie Hall', 'Devin Lewis', 'Skyler Young',
];
const CURRENT_WORKFLOWS = ['manufacturer manuals', 'web search', 'paper notes', 'CRM plus manuals', 'texting a senior tech'];

const QUOTAS = {
  experience: EXPERIENCE,
  organization_scale: ['one person or one site', '2-5 people or sites', '6-20 people or sites', '21-50 people or sites', '51+ people or sites'],
  tech_comfort: [1, 2, 3, 4, 5],
  urgency: [1, 2, 3, 4, 5],
  device: ['iPhone', 'Android', 'desktop', 'tablet or rugged device', 'shared device'],
  connection: ['good', 'mostly good', 'spotty', 'offline-first', 'unknown guest network'],
  accessibility_need: ['none stated', 'low vision', 'limited dexterity', 'screen reader', 'high cognitive load'],
  language: ['English', 'English/Spanish', 'Spanish-first', 'English learner', 'prefers visual steps'],
  life_stage: ['early career', 'raising young children', 'sandwich caregiver', 'established family', 'late career or empty nest'],
  time_pressure: ['protect dinner at home', 'school or daycare pickup', 'elder-care responsibility', 'second job or side work', 'unpredictable on-call schedule'],
  financial_context: ['stable budget', 'seasonal cash flow', 'equipment or vehicle payment', 'price-sensitive solo operation', 'growth and payroll pressure'],
  geography_climate: ['Sun Belt year-round', 'freeze-thaw Midwest', 'desert heat', 'coastal salt air', 'seasonal northern market'],
  shift_pattern: ['early route', 'standard daytime', 'split shift', 'nights or weekends', 'emergency on-call'],
  cognitive_state: ['rested', 'normal workday', 'rushed', 'end-of-day fatigue', 'interrupted and multitasking'],
  ai_trust: ['very low', 'low', 'neutral', 'high', 'very high'],
  training_background: ['self-taught', 'manufacturer-trained', 'CPO or credentialed', 'apprenticeship or ride-along', 'cross-trade entrant'],
  privacy_stance: ['comfortable with cloud tools', 'wants clear controls', 'avoids accounts', 'shares only with employer', 'will share for clear value'],
  current_workflow: CURRENT_WORKFLOWS,
};

const PERSONAL_PRIORITIES = [
  'get home for dinner',
  'avoid a weekend callback',
  'feel confident without calling a boss',
  'teach the next person faster',
  'protect customer or facility trust',
];

const INTERVENTIONS = [
  { id: 'role_next_action', name: 'Role-specific next-best-action home', effort: 'M', roles: ['tech', 'facility', 'counter', 'trainer', 'homeowner'] },
  { id: 'partsnap_direct', name: 'Direct PartSnap entry with no blocking role picker', effort: 'S', roles: ['tech', 'counter', 'trainer'] },
  { id: 'trainer_sample', name: 'Trainer opens on a five-minute sample lesson', effort: 'M', roles: ['trainer'] },
  { id: 'homeowner_nav', name: 'Homeowner-safe four-item navigation', effort: 'M', roles: ['homeowner'] },
  { id: 'counter_demo_packet', name: 'Counter sample part and vendor packet demo', effort: 'S', roles: ['counter'] },
  { id: 'facility_proof', name: 'Facility evidence capture and durable incident packet', effort: 'L', roles: ['facility'] },
  { id: 'feedback_after_value', name: 'Delay feedback until after value is absorbed', effort: 'S', roles: ['tech', 'facility', 'counter', 'trainer', 'homeowner'] },
  { id: 'optional_identity', name: 'Optional save and identity only after first success', effort: 'L', roles: ['tech', 'facility', 'counter', 'trainer', 'homeowner'] },
  { id: 'first_use_language', name: 'First-use language and visual-step choice', effort: 'L', roles: ['tech', 'facility', 'counter', 'trainer', 'homeowner'] },
  { id: 'time_back_outcome', name: 'Show the time-back outcome at completion', effort: 'S', roles: ['tech', 'facility', 'counter', 'trainer', 'homeowner'] },
];

function mulberry32(seed) {
  return function random() {
    let value = seed += 0x6D2B79F5;
    value = Math.imul(value ^ value >>> 15, value | 1);
    value ^= value + Math.imul(value ^ value >>> 7, value | 61);
    return ((value ^ value >>> 14) >>> 0) / 4294967296;
  };
}

const random = mulberry32(0x5000A11A);
const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, value));
const round = (value, digits = 1) => Number(value.toFixed(digits));
const pick = (items) => items[Math.floor(random() * items.length)];

function shuffle(items) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function exactQuota(values) {
  if (values.length !== 5) throw new Error('Every exact quota dimension must have five values.');
  return shuffle(values.flatMap((value) => Array(20).fill(value)));
}

const batchQuotaCache = new Map();

function batchQuotas(role, batch) {
  const cacheKey = `${role}-${batch}`;
  if (batchQuotaCache.has(cacheKey)) return batchQuotaCache.get(cacheKey);
  const cfg = ROLE_CONFIG[role];
  const data = {};
  for (const [key, values] of Object.entries(QUOTAS)) data[key] = exactQuota(values);
  data.primary_goal = exactQuota(cfg.goals);
  data.work_setting = exactQuota(cfg.settings);
  data.personal_priority = exactQuota(PERSONAL_PRIORITIES);
  batchQuotaCache.set(cacheKey, data);
  return data;
}

function yearsFor(experience) {
  const [minimum, maximum] = EXPERIENCE_RANGES[experience];
  return minimum + Math.floor(random() * (maximum - minimum + 1));
}

function pressureDelta(persona) {
  let delta = 0;
  if (['rushed', 'end-of-day fatigue', 'interrupted and multitasking'].includes(persona.cognitive_state)) delta -= 6;
  if (['split shift', 'nights or weekends', 'emergency on-call'].includes(persona.shift_pattern)) delta -= 3;
  if (persona.urgency >= 4) delta -= 4;
  if (persona.time_pressure !== 'protect dinner at home') delta -= 1;
  return delta;
}

function accessDelta(persona) {
  const map = {
    'none stated': 0,
    'low vision': -7,
    'limited dexterity': -6,
    'screen reader': -9,
    'high cognitive load': -10,
  };
  return map[persona.accessibility_need];
}

function languageDelta(persona) {
  const map = { English: 0, 'English/Spanish': -2, 'Spanish-first': -7, 'English learner': -6, 'prefers visual steps': -4 };
  return map[persona.language];
}

function connectionDelta(persona) {
  const map = { good: 1, 'mostly good': 0, spotty: -5, 'offline-first': -8, 'unknown guest network': -6 };
  return map[persona.connection];
}

function trustDisposition(persona) {
  const map = { 'very low': -10, low: -5, neutral: 0, high: 4, 'very high': 6 };
  return map[persona.ai_trust];
}

function personaAttributes(role, index) {
  const cfg = ROLE_CONFIG[role];
  const batch = Math.floor(index / 100) + 1;
  const position = index % 100;
  const q = batchQuotas(role, batch);
  const attributes = {};
  for (const key of Object.keys(q)) attributes[key] = q[key][position];
  return {
    persona_id: `DEMO-TEST-SL-5000-${role.toUpperCase()}-${String(index + 1).padStart(4, '0')}`,
    account_name: `DEMO TEST ${cfg.label} ${String(index + 1).padStart(4, '0')}`,
    name: pick(NAMES),
    role,
    role_label: cfg.label,
    batch,
    ...attributes,
    years_in_pool_world: yearsFor(attributes.experience),
  };
}

function painPointsFor(persona, scores) {
  const points = [];
  if (persona.role === 'trainer') points.push('training value is hidden until after a PartSnap result');
  if (persona.role === 'homeowner') points.push('technical navigation remains too broad for homeowner mode');
  if (persona.role === 'counter') points.push('proof packet value is invisible before the first successful scan');
  if (persona.role === 'tech' && /part/i.test(persona.primary_goal)) points.push('service-tech start favors code lookup over the PartSnap fork');
  if (persona.role === 'facility') points.push('facility completion packet needs richer evidence capture');
  if (['spotty', 'offline-first', 'unknown guest network'].includes(persona.connection) && ['counter', 'trainer'].includes(persona.role)) points.push('online dependency interrupts the first-value path');
  if (persona.accessibility_need === 'low vision') points.push('dense supporting copy is difficult to scan');
  if (persona.accessibility_need === 'limited dexterity') points.push('secondary controls need larger touch targets');
  if (persona.accessibility_need === 'screen reader') points.push('dynamic workflow state needs stronger screen-reader announcements');
  if (persona.accessibility_need === 'high cognitive load') points.push('too many tools remain visible after role choice');
  if (persona.language !== 'English') points.push('language or visual-step preference is absent from first use');
  if (persona.privacy_stance === 'avoids accounts' && /save|record|packet|note/i.test(persona.primary_goal)) points.push('saving value and no-account expectations need a clearer bridge');
  if (scores.time_to_value_seconds > 70) points.push('value requires too many first-session decisions');
  return [...new Set(points)].slice(0, 5);
}

function simulatePersona(role, index) {
  const cfg = ROLE_CONFIG[role];
  const persona = personaAttributes(role, index);
  const observedPassed = observedByRole[role]?.status === 'passed';
  const techDelta = (persona.tech_comfort - 3) * 4;
  const deviceDelta = persona.device === 'desktop' ? 3 : persona.device === 'shared device' ? -5 : persona.device === 'tablet or rugged device' ? 1 : -1;
  const onlineSensitivity = ['counter', 'trainer'].includes(role) ? connectionDelta(persona) : Math.min(0, connectionDelta(persona) / 3);
  const fatigue = pressureDelta(persona);
  const language = languageDelta(persona);
  const access = accessDelta(persona);
  const observedDelta = observedPassed ? 3 : -15;
  const experienceDelta = persona.experience === '0-1 years' ? -2 : persona.experience === '21+ years' ? 2 : 0;
  const noise = (random() - 0.5) * 12;

  const ease = clamp(cfg.baseEase + techDelta + deviceDelta + onlineSensitivity + fatigue + language + access + observedDelta + experienceDelta + noise);
  const clarity = clamp(cfg.baseClarity + techDelta * 0.4 + fatigue * 0.65 + language + access + observedDelta + (random() - 0.5) * 10);
  const trust = clamp(77 + trustDisposition(persona) + (persona.experience === '21+ years' ? 5 : 0) + (role === 'facility' ? 4 : 0) + (random() - 0.5) * 12);
  const completionProbability = clamp(ease * 0.56 + clarity * 0.38 + trust * 0.06, 8, 98);
  const completed = random() * 100 < completionProbability;
  const timeToValue = Math.max(12, cfg.baseTtv + (100 - ease) * 0.68 + persona.urgency * 1.5 + random() * 18);
  const relevanceBoost = persona.primary_goal === cfg.goals[0] ? 4 : 0;
  const timeBackBoost = ['get home for dinner', 'avoid a weekend callback'].includes(persona.personal_priority) ? 2 : 0;
  const wowProbability = clamp(cfg.baseWow + (clarity - 70) * 0.28 + (ease - 70) * 0.24 + (trust - 75) * 0.12 + relevanceBoost + timeBackBoost, 5, 95);
  const wow = completed && random() * 100 < wowProbability;
  const usefulness = clamp(cfg.fit * 0.52 + ease * 0.18 + clarity * 0.14 + trust * 0.08 + (wow ? 10 : -4));
  const confidenceLift = clamp(clarity * 0.42 + trust * 0.30 + cfg.fit * 0.18 + (wow ? 10 : 0));
  const stressReduction = clamp(ease * 0.36 + clarity * 0.23 + confidenceLift * 0.21 + (wow ? 13 : -5));
  const familyContextBoost = ['raising young children', 'sandwich caregiver'].includes(persona.life_stage) ? 8 : 3;
  const scheduleBoost = ['school or daycare pickup', 'elder-care responsibility', 'second job or side work', 'unpredictable on-call schedule'].includes(persona.time_pressure) ? 8 : 4;
  const priorityBoost = ['get home for dinner', 'avoid a weekend callback'].includes(persona.personal_priority) ? 10 : 5;
  const timeBackResonance = clamp(50 + familyContextBoost + scheduleBoost + priorityBoost + stressReduction * 0.18 + (wow ? 7 : 0));
  const timeSaved = Math.max(0, cfg.timeSaved + (ease - 70) * 0.13 + (wow ? 3 : 0) - Math.max(0, timeToValue - 60) * 0.06);
  const useAgain = clamp(usefulness * 0.54 + trust * 0.21 + confidenceLift * 0.15 + (wow ? 10 : 0));
  const shareIntent = clamp(useAgain * 0.48 + trust * 0.26 + (wow ? 15 : 0));
  const upgradeIntent = clamp((persona.financial_context === 'stable budget' ? 6 : -2) + usefulness * 0.34 + useAgain * 0.30 - 19);
  const loveScore = clamp(usefulness * 0.26 + ease * 0.17 + clarity * 0.16 + trust * 0.13 + confidenceLift * 0.11 + stressReduction * 0.10 + timeBackResonance * 0.07 + (wow ? 6 : -5));

  const scores = {
    ease_score: round(ease),
    clarity_score: round(clarity),
    trust_score: round(trust),
    usefulness_score: round(usefulness),
    confidence_lift_score: round(confidenceLift),
    stress_reduction_score: round(stressReduction),
    family_time_back_resonance_score: round(timeBackResonance),
    use_again_score: round(useAgain),
    share_intent_score: round(shareIntent),
    modeled_upgrade_intent_score: round(upgradeIntent),
    love_score: round(loveScore),
    completion_probability: round(completionProbability),
    completed_first_value: completed,
    wow_probability: round(wowProbability),
    wow_moment: wow,
    time_to_value_seconds: round(timeToValue),
    estimated_minutes_saved: round(timeSaved),
  };
  const painPoints = painPointsFor(persona, scores);
  const mainPain = painPoints[0] || 'the next action could be more obvious';
  const reaction = wow ? 'The payoff felt immediate enough to use again.' : 'I understood the idea, but the payoff did not feel immediate enough yet.';
  const feedback = `SIMULATED PERSONA FEEDBACK: I am a ${persona.work_setting} user in a ${persona.geography_climate.toLowerCase()} market, usually ${persona.cognitive_state.toLowerCase()}, and I am trying to ${persona.personal_priority}. ${cfg.anchor} ${reaction} My biggest friction was that ${mainPain}.`;

  return {
    ...persona,
    evidence_type: 'synthetic_model_not_real_user_feedback',
    observed_anchor: cfg.anchor,
    recommended_first_action: cfg.firstAction,
    ...scores,
    aha_trigger: cfg.anchor,
    pain_points: painPoints,
    simulated_feedback: feedback,
    persistence: 'none; no account created; DEMO TEST identifier exists only in offline artifacts',
  };
}

function interventionDelta(persona, intervention) {
  if (!intervention.roles.includes(persona.role)) return { affected: false, completion: 0, wow: 0, love: 0, ttv: 0 };
  let completion = 0;
  let wow = 0;
  let love = 0;
  let ttv = 0;
  const pain = persona.pain_points.join('|');
  switch (intervention.id) {
    case 'role_next_action':
      completion = 6; wow = 6; love = 5; ttv = 9;
      if (/too many tools|too many first-session decisions/.test(pain)) { completion += 5; wow += 4; love += 3; ttv += 6; }
      break;
    case 'partsnap_direct':
      completion = persona.role === 'tech' ? 5 : 7; wow = persona.role === 'trainer' ? 5 : 8; love = 5; ttv = 12;
      if (/PartSnap|partsnap|scan/.test(pain)) { completion += 4; wow += 4; love += 2; }
      break;
    case 'trainer_sample':
      completion = 17; wow = 25; love = 16; ttv = 25;
      break;
    case 'homeowner_nav':
      completion = 15; wow = 20; love = 14; ttv = 19;
      break;
    case 'counter_demo_packet':
      completion = 12; wow = 19; love = 13; ttv = 18;
      break;
    case 'facility_proof':
      completion = 4; wow = 10; love = 10; ttv = -2;
      break;
    case 'feedback_after_value':
      completion = 1; wow = 4; love = 4; ttv = 1;
      break;
    case 'optional_identity':
      completion = persona.privacy_stance === 'avoids accounts' ? 4 : 2;
      wow = /saving value|packet|proof/.test(pain) ? 8 : 3;
      love = /saving value|packet|proof/.test(pain) ? 9 : 4;
      ttv = 0;
      break;
    case 'first_use_language':
      if (persona.language === 'English') return { affected: false, completion: 0, wow: 0, love: 0, ttv: 0 };
      completion = persona.language === 'Spanish-first' || persona.language === 'English learner' ? 16 : 9;
      wow = persona.language === 'Spanish-first' || persona.language === 'English learner' ? 13 : 8;
      love = 12; ttv = 13;
      break;
    case 'time_back_outcome':
      completion = 0; wow = 7; love = 8; ttv = 0;
      if (['protect dinner at home', 'school or daycare pickup', 'elder-care responsibility'].includes(persona.time_pressure)) { wow += 3; love += 3; }
      break;
    default:
      throw new Error(`Unknown intervention ${intervention.id}`);
  }
  return { affected: true, completion, wow, love, ttv };
}

function predictedOutcome(persona, interventions) {
  const baselineCompletion = persona.completion_probability;
  const baselineWow = persona.completion_probability / 100 * persona.wow_probability;
  const baselineLove = persona.love_score;
  const baselineTtv = persona.time_to_value_seconds;
  let completionDelta = 0;
  let wowDelta = 0;
  let loveDelta = 0;
  let ttvDelta = 0;
  let affected = false;
  for (const intervention of interventions) {
    const delta = interventionDelta(persona, intervention);
    affected ||= delta.affected;
    completionDelta += delta.completion;
    wowDelta += delta.wow;
    loveDelta += delta.love;
    ttvDelta += delta.ttv;
  }
  // Counterfactual changes overlap. Saturating curves prevent a stack of plausible
  // individual improvements from turning into an implausibly perfect product.
  const completionLift = 22 * (1 - Math.exp(-Math.max(0, completionDelta) / 22));
  const wowLift = 40 * (1 - Math.exp(-Math.max(0, wowDelta) / 40));
  const loveLift = 25 * (1 - Math.exp(-Math.max(0, loveDelta) / 25));
  const positiveTtvLift = 40 * (1 - Math.exp(-Math.max(0, ttvDelta) / 40));
  const negativeTtvLift = Math.min(0, ttvDelta);
  const completion = clamp(baselineCompletion + completionLift, 0, 96);
  const wow = clamp(Math.min(completion, baselineWow + wowLift), 0, 92);
  const love = clamp(baselineLove + loveLift, 0, 95);
  const ttv = Math.max(10, baselineTtv - positiveTtvLift - negativeTtvLift);
  return { completion, wow, love, ttv, affected };
}

function interventionSummary(rows, intervention) {
  const baseline = rows.map((row) => predictedOutcome(row, []));
  const changed = rows.map((row) => predictedOutcome(row, [intervention]));
  const avg = (values, key) => values.reduce((sum, item) => sum + item[key], 0) / values.length;
  const completionLift = avg(changed, 'completion') - avg(baseline, 'completion');
  const wowLift = avg(changed, 'wow') - avg(baseline, 'wow');
  const loveLift = avg(changed, 'love') - avg(baseline, 'love');
  const ttvReduction = avg(baseline, 'ttv') - avg(changed, 'ttv');
  const effortPenalty = { S: 1, M: 2.5, L: 5 }[intervention.effort];
  return {
    intervention_id: intervention.id,
    intervention: intervention.name,
    effort: intervention.effort,
    personas_affected: changed.filter((item) => item.affected).length,
    affected_rate: round(changed.filter((item) => item.affected).length / rows.length * 100),
    completion_lift_pp: round(completionLift),
    wow_lift_pp: round(wowLift),
    love_lift_points: round(loveLift),
    time_to_value_reduction_seconds: round(ttvReduction),
    priority_score: round(wowLift * 0.50 + completionLift * 0.24 + loveLift * 0.20 + ttvReduction * 0.06 - effortPenalty),
  };
}

function summarize(rows, keyFn) {
  const groups = new Map();
  for (const row of rows) {
    const key = keyFn(row);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  }
  return [...groups.entries()].map(([group, entries]) => {
    const avg = (field) => entries.reduce((sum, entry) => sum + Number(entry[field] || 0), 0) / entries.length;
    return {
      group,
      personas: entries.length,
      completion_rate: round(entries.filter((entry) => entry.completed_first_value).length / entries.length * 100),
      wow_rate: round(entries.filter((entry) => entry.wow_moment).length / entries.length * 100),
      love_score: round(avg('love_score')),
      ease_score: round(avg('ease_score')),
      clarity_score: round(avg('clarity_score')),
      trust_score: round(avg('trust_score')),
      confidence_lift_score: round(avg('confidence_lift_score')),
      stress_reduction_score: round(avg('stress_reduction_score')),
      family_time_back_resonance_score: round(avg('family_time_back_resonance_score')),
      use_again_score: round(avg('use_again_score')),
      estimated_minutes_saved: round(avg('estimated_minutes_saved')),
      time_to_value_seconds: round(avg('time_to_value_seconds')),
    };
  });
}

function painSummary(rows) {
  const matchingRows = new Map();
  for (const row of rows) {
    for (const point of row.pain_points) {
      if (!matchingRows.has(point)) matchingRows.set(point, []);
      matchingRows.get(point).push(row);
    }
  }
  return [...matchingRows.entries()]
    .map(([pain_point, matches]) => {
      const roles = [...new Set(matches.map((row) => row.role))].sort();
      const eligible = rows.filter((row) => roles.includes(row.role)).length;
      const sourceType = pain_point === 'value requires too many first-session decisions'
        ? 'derived_from_modeled_time_to_value'
        : /facility completion|proof packet value|training value|technical navigation|service-tech start/.test(pain_point)
          ? 'browser_or_workflow_anchor'
          : 'stress_test_condition';
      return {
        pain_point,
        count: matches.length,
        cohort_rate: round(matches.length / rows.length * 100),
        affected_roles: roles,
        rate_within_affected_roles: round(matches.length / eligible * 100),
        source_type: sourceType,
      };
    })
    .sort((a, b) => b.count - a.count);
}

function csvEscape(value) {
  const text = Array.isArray(value) ? value.join('|') : String(value ?? '');
  return `"${text.replaceAll('"', '""')}"`;
}

function writeCsv(file, rows, columns = Object.keys(rows[0])) {
  const lines = [columns.map(csvEscape).join(',')];
  for (const row of rows) lines.push(columns.map((column) => csvEscape(row[column])).join(','));
  fs.writeFileSync(file, `${lines.join('\n')}\n`, 'utf8');
}

function hashFile(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

function validate(rows) {
  const errors = [];
  if (rows.length !== 5000) errors.push(`Expected 5000 personas, got ${rows.length}`);
  if (new Set(rows.map((row) => row.persona_id)).size !== 5000) errors.push('Persona IDs are not unique.');
  if (rows.some((row) => !row.persona_id.startsWith('DEMO-TEST-'))) errors.push('A persona lacks the DEMO-TEST prefix.');
  if (rows.some((row) => !row.simulated_feedback.startsWith('SIMULATED PERSONA FEEDBACK:'))) errors.push('A feedback record lacks the synthetic label.');
  if (rows.some((row) => row.evidence_type !== 'synthetic_model_not_real_user_feedback')) errors.push('Evidence labels are inconsistent.');
  for (const role of Object.keys(ROLE_CONFIG)) {
    const roleRows = rows.filter((row) => row.role === role);
    if (roleRows.length !== 1000) errors.push(`${role} has ${roleRows.length} personas instead of 1000.`);
    for (let batch = 1; batch <= 10; batch += 1) {
      const batchRows = roleRows.filter((row) => row.batch === batch);
      if (batchRows.length !== 100) errors.push(`${role} batch ${batch} has ${batchRows.length} personas.`);
      for (const dimension of [...Object.keys(QUOTAS), 'primary_goal', 'work_setting', 'personal_priority']) {
        const counts = new Map();
        for (const row of batchRows) counts.set(row[dimension], (counts.get(row[dimension]) || 0) + 1);
        if (counts.size !== 5 || [...counts.values()].some((count) => count !== 20)) errors.push(`${role} batch ${batch} quota failed for ${dimension}.`);
      }
    }
  }
  const forbidden = ['race', 'religion', 'sexual_orientation', 'political_affiliation'];
  if (forbidden.some((field) => rows.some((row) => Object.hasOwn(row, field)))) errors.push('A protected or irrelevant attribute field was included.');
  return errors;
}

fs.mkdirSync(outputDir, { recursive: true });
const personaDir = path.join(outputDir, 'personas');
fs.mkdirSync(personaDir, { recursive: true });

const allRows = [];
for (const role of Object.keys(ROLE_CONFIG)) {
  const roleRows = Array.from({ length: 1000 }, (_, index) => simulatePersona(role, index));
  allRows.push(...roleRows);
  fs.writeFileSync(path.join(personaDir, `${role}-1000.jsonl`), `${roleRows.map((row) => JSON.stringify(row)).join('\n')}\n`, 'utf8');
}

const validationErrors = validate(allRows);
if (validationErrors.length) throw new Error(`Cohort validation failed:\n${validationErrors.join('\n')}`);

const personaColumns = [
  'persona_id', 'account_name', 'name', 'role', 'role_label', 'batch', 'experience', 'years_in_pool_world',
  'organization_scale', 'tech_comfort', 'urgency', 'device', 'connection', 'accessibility_need', 'language',
  'life_stage', 'time_pressure', 'financial_context', 'geography_climate', 'shift_pattern', 'cognitive_state',
  'ai_trust', 'training_background', 'privacy_stance', 'current_workflow', 'work_setting', 'personal_priority',
  'primary_goal', 'completed_first_value', 'wow_moment', 'time_to_value_seconds', 'estimated_minutes_saved',
  'ease_score', 'clarity_score', 'trust_score', 'usefulness_score', 'confidence_lift_score',
  'stress_reduction_score', 'use_again_score', 'share_intent_score', 'modeled_upgrade_intent_score', 'love_score',
  'family_time_back_resonance_score',
  'pain_points', 'aha_trigger', 'simulated_feedback', 'evidence_type', 'persistence',
];
const cohortFile = path.join(outputDir, 'splashlens-life-persona-5000.csv');
writeCsv(cohortFile, allRows, personaColumns);

const roleSummary = summarize(allRows, (row) => row.role).map((row) => ({
  ...row,
  role_label: ROLE_CONFIG[row.group].label,
  observed_browser_status: observedByRole[row.group]?.status || 'missing',
}));
const batchSummary = summarize(allRows, (row) => `${row.role}-batch-${row.batch}`);
const segmentDimensions = [
  'experience', 'organization_scale', 'tech_comfort', 'urgency', 'device', 'connection', 'accessibility_need',
  'language', 'life_stage', 'time_pressure', 'financial_context', 'geography_climate', 'shift_pattern',
  'cognitive_state', 'ai_trust', 'training_background', 'privacy_stance', 'work_setting', 'personal_priority',
];
const segmentSummary = segmentDimensions.flatMap((dimension) => summarize(allRows, (row) => row[dimension]).map((row) => ({ dimension, ...row })));
const pains = painSummary(allRows);
const interventionRanking = INTERVENTIONS.map((intervention) => interventionSummary(allRows, intervention)).sort((a, b) => b.priority_score - a.priority_score);
const interventionRoleRanking = Object.keys(ROLE_CONFIG).flatMap((role) => INTERVENTIONS
  .filter((intervention) => intervention.roles.includes(role))
  .map((intervention) => ({ role, role_label: ROLE_CONFIG[role].label, ...interventionSummary(allRows.filter((row) => row.role === role), intervention) }))
  .sort((a, b) => b.priority_score - a.priority_score));

const bundle = [
  INTERVENTIONS.find((item) => item.id === 'role_next_action'),
  INTERVENTIONS.find((item) => item.id === 'partsnap_direct'),
  INTERVENTIONS.find((item) => item.id === 'trainer_sample'),
  INTERVENTIONS.find((item) => item.id === 'homeowner_nav'),
  INTERVENTIONS.find((item) => item.id === 'counter_demo_packet'),
  INTERVENTIONS.find((item) => item.id === 'facility_proof'),
  INTERVENTIONS.find((item) => item.id === 'feedback_after_value'),
  INTERVENTIONS.find((item) => item.id === 'first_use_language'),
  INTERVENTIONS.find((item) => item.id === 'time_back_outcome'),
];
const baselinePredicted = allRows.map((row) => predictedOutcome(row, []));
const bundlePredicted = allRows.map((row) => predictedOutcome(row, bundle));
const average = (values, key) => round(values.reduce((sum, item) => sum + item[key], 0) / values.length);
const bundleSummary = {
  baseline_expected_completion_rate: average(baselinePredicted, 'completion'),
  bundle_expected_completion_rate: average(bundlePredicted, 'completion'),
  baseline_expected_wow_rate: average(baselinePredicted, 'wow'),
  bundle_expected_wow_rate: average(bundlePredicted, 'wow'),
  baseline_love_score: average(baselinePredicted, 'love'),
  bundle_love_score: average(bundlePredicted, 'love'),
  baseline_time_to_value_seconds: average(baselinePredicted, 'ttv'),
  bundle_time_to_value_seconds: average(bundlePredicted, 'ttv'),
  evidence_type: 'synthetic_counterfactual_not_observed_product_performance',
};
const currentPredicted = implementedMode ? bundlePredicted : baselinePredicted;
const currentSummary = {
  scenario: runScenario,
  expected_completion_rate: average(currentPredicted, 'completion'),
  expected_wow_rate: average(currentPredicted, 'wow'),
  expected_love_score: average(currentPredicted, 'love'),
  expected_time_to_value_seconds: average(currentPredicted, 'ttv'),
  compared_to_baseline_completion_lift_pp: round(average(currentPredicted, 'completion') - average(baselinePredicted, 'completion')),
  compared_to_baseline_wow_lift_pp: round(average(currentPredicted, 'wow') - average(baselinePredicted, 'wow')),
  compared_to_baseline_love_lift: round(average(currentPredicted, 'love') - average(baselinePredicted, 'love')),
  compared_to_baseline_ttv_reduction_seconds: round(average(baselinePredicted, 'ttv') - average(currentPredicted, 'ttv')),
  evidence_type: implementedMode ? 'synthetic_post_implementation_estimate_anchored_to_browser_smoke' : 'synthetic_baseline_estimate',
};
const bundleRoleSummary = Object.keys(ROLE_CONFIG).map((role) => {
  const roleRows = allRows.filter((row) => row.role === role);
  const baseline = roleRows.map((row) => predictedOutcome(row, []));
  const changed = roleRows.map((row) => predictedOutcome(row, bundle));
  return {
    role,
    role_label: ROLE_CONFIG[role].label,
    baseline_expected_completion_rate: average(baseline, 'completion'),
    bundle_expected_completion_rate: average(changed, 'completion'),
    baseline_expected_wow_rate: average(baseline, 'wow'),
    bundle_expected_wow_rate: average(changed, 'wow'),
    baseline_love_score: average(baseline, 'love'),
    bundle_love_score: average(changed, 'love'),
    baseline_time_to_value_seconds: average(baseline, 'ttv'),
    bundle_time_to_value_seconds: average(changed, 'ttv'),
    evidence_type: 'synthetic_counterfactual_not_observed_product_performance',
  };
});
const currentRoleSummary = Object.keys(ROLE_CONFIG).map((role) => {
  const roleRows = allRows.filter((row) => row.role === role);
  const baseline = roleRows.map((row) => predictedOutcome(row, []));
  const current = roleRows.map((row) => predictedOutcome(row, implementedMode ? bundle : []));
  return {
    role,
    role_label: ROLE_CONFIG[role].label,
    scenario: runScenario,
    expected_completion_rate: average(current, 'completion'),
    expected_wow_rate: average(current, 'wow'),
    expected_love_score: average(current, 'love'),
    expected_time_to_value_seconds: average(current, 'ttv'),
    baseline_completion_rate: average(baseline, 'completion'),
    baseline_wow_rate: average(baseline, 'wow'),
    baseline_love_score: average(baseline, 'love'),
    baseline_time_to_value_seconds: average(baseline, 'ttv'),
    evidence_type: implementedMode ? 'synthetic_post_implementation_estimate_anchored_to_browser_smoke' : 'synthetic_baseline_estimate',
  };
});

const personaRanking = [...allRows]
  .sort((a, b) => b.love_score - a.love_score || b.use_again_score - a.use_again_score)
  .map((row, index) => ({
    rank: index + 1,
    persona_id: row.persona_id,
    role: row.role,
    role_label: row.role_label,
    work_setting: row.work_setting,
    life_stage: row.life_stage,
    time_pressure: row.time_pressure,
    personal_priority: row.personal_priority,
    primary_goal: row.primary_goal,
    completed_first_value: row.completed_first_value,
    wow_moment: row.wow_moment,
    love_score: row.love_score,
    use_again_score: row.use_again_score,
    family_time_back_resonance_score: row.family_time_back_resonance_score,
    outcome_tier: row.wow_moment && row.love_score >= 80 ? 'strong_aha' : row.completed_first_value && row.love_score >= 65 ? 'promising' : row.completed_first_value ? 'weak_payoff' : 'failed_first_value',
    primary_pain_point: row.pain_points[0] || '',
  }));

writeCsv(path.join(outputDir, 'splashlens-life-role-summary.csv'), roleSummary);
writeCsv(path.join(outputDir, 'splashlens-life-batch-summary.csv'), batchSummary);
writeCsv(path.join(outputDir, 'splashlens-life-segment-summary.csv'), segmentSummary);
writeCsv(path.join(outputDir, 'splashlens-life-pain-points.csv'), pains);
writeCsv(path.join(outputDir, 'splashlens-intervention-ranking.csv'), interventionRanking);
writeCsv(path.join(outputDir, 'splashlens-intervention-role-ranking.csv'), interventionRoleRanking);
writeCsv(path.join(outputDir, 'splashlens-bundle-role-lift.csv'), bundleRoleSummary);
writeCsv(path.join(outputDir, 'splashlens-current-landing-summary.csv'), [currentSummary]);
writeCsv(path.join(outputDir, 'splashlens-current-role-landing.csv'), currentRoleSummary);
writeCsv(path.join(outputDir, 'splashlens-persona-ranking-5000.csv'), personaRanking);

const rankedRoles = [...roleSummary].sort((a, b) => b.wow_rate - a.wow_rate);
const roleTable = rankedRoles.map((row, index) =>
  `| ${index + 1} | ${row.role_label} | ${row.completion_rate}% | ${row.wow_rate}% | ${row.love_score} | ${row.confidence_lift_score} | ${row.stress_reduction_score} | ${row.family_time_back_resonance_score} | ${row.estimated_minutes_saved} min | ${row.time_to_value_seconds}s |`,
).join('\n');
const painTable = pains.slice(0, 12).map((row) => `| ${row.pain_point} | ${row.count} | ${row.cohort_rate}% | ${row.rate_within_affected_roles}% | ${row.source_type} |`).join('\n');
const interventionTable = interventionRanking.map((row, index) =>
  `| ${index + 1} | ${row.intervention} | ${row.effort} | ${row.affected_rate}% | +${row.completion_lift_pp} pp | +${row.wow_lift_pp} pp | +${row.love_lift_points} | ${row.time_to_value_reduction_seconds}s | ${row.priority_score} |`,
).join('\n');
const interpretableDimensions = new Set(['experience', 'tech_comfort', 'urgency', 'device', 'connection', 'accessibility_need', 'language', 'time_pressure', 'shift_pattern', 'cognitive_state', 'ai_trust', 'personal_priority']);
const lowestSegments = [...segmentSummary].filter((row) => row.personas >= 500 && interpretableDimensions.has(row.dimension)).sort((a, b) => a.wow_rate - b.wow_rate).slice(0, 12);
const lowestTable = lowestSegments.map((row) => `| ${row.dimension} | ${row.group} | ${row.personas} | ${row.completion_rate}% | ${row.wow_rate}% | ${row.love_score} |`).join('\n');
const topSegments = [...segmentSummary].filter((row) => row.personas >= 500 && interpretableDimensions.has(row.dimension)).sort((a, b) => b.wow_rate - a.wow_rate).slice(0, 10);
const topTable = topSegments.map((row) => `| ${row.dimension} | ${row.group} | ${row.personas} | ${row.wow_rate}% | ${row.love_score} |`).join('\n');
const roleLiftTable = bundleRoleSummary.map((row) =>
  `| ${row.role_label} | ${row.baseline_expected_completion_rate}% | ${row.bundle_expected_completion_rate}% | ${row.baseline_expected_wow_rate}% | ${row.bundle_expected_wow_rate}% | ${row.baseline_time_to_value_seconds}s | ${row.bundle_time_to_value_seconds}s |`,
).join('\n');
const currentRoleTable = currentRoleSummary.map((row) =>
  `| ${row.role_label} | ${row.expected_completion_rate}% | ${row.expected_wow_rate}% | ${row.expected_love_score} | ${row.expected_time_to_value_seconds}s |`,
).join('\n');
const roleFixTable = Object.keys(ROLE_CONFIG).map((role) => {
  const fixes = interventionRoleRanking.filter((row) => row.role === role).slice(0, 3);
  return `| ${ROLE_CONFIG[role].label} | ${fixes.map((row) => row.intervention).join('; ')} |`;
}).join('\n');

const report = `# SplashLens 5,000-Life Persona Debrief

Date: 2026-07-16  
Run label: DEMO TEST SPLASHLENS 5000 LIFE PERSONA LAB

## Executive Read

SplashLens already creates the strongest first-use payoff for Facility / CPO and Service Tech users. Its broadest conversion problem is not lack of capability; it is that the right capability is sometimes hidden behind a generic tool surface. Trainer, Homeowner, and Counter users need to see their own outcome before they are asked to understand the whole product.

${implementedMode
  ? `After implementing the recommended role-first bundle, the model lands at **${currentSummary.expected_completion_rate}% expected first-value completion**, **${currentSummary.expected_wow_rate}% expected wow**, **${currentSummary.expected_love_score} love score**, and **${currentSummary.expected_time_to_value_seconds}s modeled time-to-value**. Compared with the original baseline, that is **+${currentSummary.compared_to_baseline_completion_lift_pp} pp completion**, **+${currentSummary.compared_to_baseline_wow_lift_pp} pp wow**, **+${currentSummary.compared_to_baseline_love_lift} love**, and **${currentSummary.compared_to_baseline_ttv_reduction_seconds}s faster**. These remain synthetic post-implementation estimates anchored to browser smoke evidence, not measured customer outcomes.`
  : `The modeled fix bundle raises expected first-value completion from **${bundleSummary.baseline_expected_completion_rate}% to ${bundleSummary.bundle_expected_completion_rate}%**, expected wow from **${bundleSummary.baseline_expected_wow_rate}% to ${bundleSummary.bundle_expected_wow_rate}%**, and love score from **${bundleSummary.baseline_love_score} to ${bundleSummary.bundle_love_score}** while reducing modeled time-to-value from **${bundleSummary.baseline_time_to_value_seconds}s to ${bundleSummary.bundle_time_to_value_seconds}s**. These are synthetic counterfactual estimates, not measured customer outcomes.`}

## Evidence Boundary

- **5,000 synthetic lives:** 1,000 per role in ten exact 100-person batches.
- **Browser anchor:** five-role browser smoke against ${observedBaseUrl}, with event and feedback writes intercepted.
- **Run scenario:** ${runScenario}.
- **Not testimonials:** every opinion is labeled SIMULATED PERSONA FEEDBACK.
- **No production pollution:** zero accounts, zero analytics writes, zero retained app records.
- **Relevant life context only:** no race, religion, sexual orientation, politics, or other irrelevant protected profiling.
- **Purpose:** prioritize prototypes and real tests. The percentages are not market forecasts.

## Role Ranking

| Rank | Role | Completion | Wow | Love | Confidence lift | Stress reduction | Time-back resonance | Minutes saved | Time to value |
|---:|---|---:|---:|---:|---:|---:|---:|---:|---:|
${roleTable}

## Current Landing After Recommendations

| Role | Expected completion | Expected wow | Expected love | Expected time to value |
|---|---:|---:|---:|---:|
${currentRoleTable}

## What Creates The Aha

1. **Facility / CPO:** a messy real-world situation becomes numbered actions and ends in a visible resolve-or-escalate choice.
2. **Service Tech:** fast lookup plus cautious verification language feels like confidence without pretending to replace judgment.
3. **Counter / Distributor:** missing-proof prompts, callback risk, and a vendor packet are more valuable than a part guess.
4. **Homeowner:** the no-account volume or turnover answer is useful, but the technician-scale navigation dilutes safety and relevance.
5. **Trainer:** the teachable observe-prove-order loop is strong only after it is found. The first-use surface does not demonstrate the training product.

## Life Context That Matters

The largest modeled drops come from interrupted or fatigued work, constrained connectivity, low technical comfort, first-use language mismatch, accessibility friction, and a role surface that still shows too many unrelated tools. Family and caregiving pressure do not reduce product fit by themselves; they make time-to-value and a visible time-back outcome more important.

### Modeled High-Resonance Hypotheses

| Dimension | Segment | Personas | Wow | Love |
|---|---|---:|---:|---:|
${topTable}

### Modeled Risk Hypotheses

| Dimension | Segment | Personas | Completion | Wow | Love |
|---|---|---:|---:|---:|---:|
${lowestTable}

The model assigns explicit friction to constrained connectivity, language mismatch, accessibility conditions, fatigue, and low technical comfort. These tables show the resulting hypotheses; they are not discovered demographic effects or causal evidence.

## Ranked Pain Points

| Pain point | Personas affected | Cohort rate | Rate inside affected role(s) | Source |
|---|---:|---:|---:|---|
${painTable}

## Fix Ranking

| Rank | Change | Effort | Reach | Completion lift | Wow lift | Love lift | TTV saved | Priority |
|---:|---|:---:|---:|---:|---:|---:|---:|---:|
${interventionTable}

## Expected Bundle Lift By Role

| Role | Completion now | Completion with bundle | Wow now | Wow with bundle | TTV now | TTV with bundle |
|---|---:|---:|---:|---:|---:|---:|
${roleLiftTable}

## Top Three Fixes By Role

| Role | Ranked fixes |
|---|---|
${roleFixTable}

## Recommended Build Sequence

1. **Role home:** after role selection, show one dominant next action, two secondary actions, and Change role. Keep the full toolbox one level down.
2. **Role-specific demonstrations:** Trainer gets a five-minute lesson; Counter gets a safe sample part/vendor packet; Homeowner gets four safe choices; Service Tech gets Code or PartSnap; Facility keeps its situation-first wizard.
3. **Fix PartSnap entry:** a deep link or app-store campaign link must land directly in a usable PartSnap flow without the role picker covering it.
4. **Move feedback:** ask after the person has read, saved, shared, or completed the result. Do not interrupt the first answer.
5. **Make time back visible:** completion should say what was prepared or avoided, not make an unverifiable promise. Example: "Packet ready. One fewer explanation to rebuild later."
6. **Language and visual steps:** offer language/visual preference at first use and keep numbered action text short.
7. **Optional save after success:** lookup stays free and no-account. Ask for identity only when the user chooses durable history, team proof, or cross-device access.
8. **Facility proof depth:** add readings, symptoms, recent changes, photos, actions, and escalation contacts to the incident packet.

## Majority-Wow Acceptance Gate

Do not ship based on this model alone. Prototype the bundle, then run consented role tests with these gates:

- At least 80% complete one meaningful workflow without help.
- At least 70% can state the product's value in their own words after one use.
- Median first value under 45 seconds for Tech, Facility, Counter, and Homeowner; under 60 seconds for Trainer.
- At least 70% choose Use again at 8/10 or higher.
- No more than 10% report that the role home showed too much irrelevant capability.
- Spanish-first, low-vision, limited-dexterity, screen-reader, spotty-network, and fatigue cohorts may not trail the overall completion rate by more than 10 points.

## Methodology Limits

- Cross-role ranking is partly encoded by observed workflow anchors and explicit starting assumptions. It is a prioritization model, not independent evidence of market demand.
- Exact one-dimensional quotas are enforced inside every 100-person batch. Attribute combinations are randomized, not pairwise constraint-balanced.
- Accessibility, language, connectivity, fatigue, and technical-comfort gaps are deliberately injected stress assumptions. They identify what to test; they do not prove real users experience those exact gaps.
- The five browser anchors prove the selected workflow rendered and reached its terminal state. They do not yet prove calculator correctness, screen-reader quality, offline recovery, Spanish comprehension, or field-device performance.
- Modeled time saved, upgrade intent, love, and repeat use are hypotheses. Only consented human behavior and retained product telemetry can validate them.

## Next Objective Test Lane

1. Add known-answer oracle tests for code lookup, dosing, turnover, PartSnap ambiguity/abstention, packet completeness, and record isolation.
2. Exercise each role under real browser constraints: keyboard-only, 200% zoom, screen-reader semantics, mobile touch targets, spotty network, offline/reconnect, and clean/warm service-worker states.
3. Block every unapproved POST, PUT, PATCH, and DELETE during automation and retain a request ledger proving zero production writes.
4. Run the same first-use tasks with consented human testers, measure unassisted completion and time to value, and collect their language separately from synthetic opinions.

## Buyer Lens

The strongest immediate users are service companies, facilities, trainers, and distributor/support teams that lose time rebuilding context or escalating incomplete information. The paid wedge remains durable proof, history, packets, and team visibility; the basic lookup earns trust by staying free.

## Estimated Strength

**Strong problem fit, medium onboarding consistency, high expansion potential.** The existing product demonstrates credible value in all five roles, but only Facility and Service Tech expose it consistently enough in the first minute.

## Transfer Risks

- Synthetic sentiment can overstate real willingness to return or pay.
- Broad role coverage can make SplashLens look unfocused unless the role home hides irrelevant tools.
- Part identification must stay cautious and source-aware; confidence without proof would damage trust.
- Language and accessibility improvements require real-device validation, not only modeled scoring.
- A save/account layer can weaken the no-account promise if introduced before first success.

## Valuation Levers

- Measured time-to-first-value and repeated use by role.
- Named service-company, facility, trainer, and distributor pilots.
- Proof packets created, shared, and reused.
- PartSnap searches that end in verified identity or useful escalation.
- Callback avoidance and time-back case studies with explicit permission.
- Corpus provenance and partner-verified manufacturer cards.

## Recommendation

Build the role-specific first minute before adding another broad tool. SplashLens has enough capability to create delight; the next leap is orchestration. The best flagship promise is: **identify the part, prove the visit, escalate smarter, and get time back**.

## Deliverables

- splashlens-life-persona-5000.csv: every persona, score, pain point, and labeled simulated opinion.
- personas/*.jsonl: 1,000 detailed records per role.
- splashlens-life-role-summary.csv: role ranking.
- splashlens-life-batch-summary.csv: all fifty 100-person batches.
- splashlens-life-segment-summary.csv: life-context segment performance.
- splashlens-life-pain-points.csv: ranked friction.
- splashlens-intervention-ranking.csv: total counterfactual ranking.
- splashlens-intervention-role-ranking.csv: fix ranking inside each role.
- splashlens-bundle-role-lift.csv: conservative counterfactual lift by role.
- splashlens-persona-ranking-5000.csv: all 5,000 personas ranked by modeled love and repeat-use strength.
- run-manifest.json: reproducibility, validation, and evidence boundaries.
`;

const reportFile = path.join(outputDir, 'SPLASHLENS_5000_LIFE_PERSONA_DEBRIEF_2026-07-16.md');
fs.writeFileSync(reportFile, report, 'utf8');

const blueprint = `# SplashLens Aha Fix Blueprint\n\n## Product principle\n\nThe first screen after role selection should answer: **What can SplashLens finish for me right now?**\n\n## Role homes\n\n| Role | Dominant action | Secondary actions | Completion payoff |\n|---|---|---|---|\n| Service Tech | Code or PartSnap segmented choice | Dose; Service proof | Verified next step or escalation packet |\n| Facility / CPO | What is happening? | Daily check; Dose | Resolve, document, or escalate |\n| Counter / Distributor | Identify a walk-in part | Missing proof; Vendor packet demo | Safer handoff with callback-risk clues |\n| Trainer | Start a five-minute lesson | Scenario; Apprentice review | Teachable proof-before-ordering exercise |\n| Homeowner | Get a basic answer | Prepare a pro note; Safety stop | Clear result and when to call a pro |\n\n## Implementation map\n\n1. On direct PartSnap links, do not let #role-picker cover #scan-result. Ask role non-modally after first value and never silently assign Service Tech.\n2. Trainer should render a clearly labeled DEMO TEST five-minute lesson inside #scan-result with Show answer key and Use a real part actions. Demo use must not emit a real PartSnap activation event.\n3. Homeowner should open at #tab-volume with turnover inputs first and only Volume, Basics, Saved Notes, and Ask a Pro visible. Keep an explicit Pro tools escape hatch.\n4. Counter should see Preview sample counter packet before camera use. The sample must clearly deny live inventory, fitment, or partner verification.\n5. Service Tech should see two dominant actions above the current chip workflow: Look up a code focusing #error-search and Identify a part opening #scan-mode-parts.\n6. Facility should progressively collect lane-specific readings, timestamps, symptoms, recent changes, and photo references before filling #facility-packet-text. Keep optional fields minimal so the strongest current workflow stays fast.\n7. Put Change role outside Facility mode and move language/visual-step choice into first use.\n\n## Instrumentation\n\nTrack role_selected, first_action_started, first_value_completed, result_saved, packet_shared, feedback_helpful, feedback_wrong, feedback_missing, role_changed, and optional_save_started. Tag automated tests DEMO-TEST and exclude them from production reporting.\n\n## Real-test script\n\nAsk the participant to use SplashLens for one real problem without coaching. Record time to first action, time to first useful answer, wrong turns, whether they can explain the value, confidence before/after, and whether the outcome gives them time or clarity back. End with: "What would make you use this on your next shift?"\n`;
fs.writeFileSync(path.join(outputDir, 'SPLASHLENS_AHA_FIX_BLUEPRINT_2026-07-16.md'), blueprint, 'utf8');

const manifest = {
  run_label: 'DEMO TEST SPLASHLENS 5000 LIFE PERSONA LAB',
  scenario: runScenario,
  generated_at: new Date().toISOString(),
  deterministic_seed: '0x5000A11A',
  browser_anchor: path.relative(root, observedPath).replaceAll('\\', '/'),
  roles: Object.keys(ROLE_CONFIG),
  personas_per_role: 1000,
  batches_per_role: 10,
  batch_size: 100,
  total_personas: allRows.length,
  production_accounts_created: 0,
  production_writes: 0,
  validation_errors: validationErrors,
  protected_attributes_excluded: ['race', 'religion', 'sexual_orientation', 'political_affiliation'],
  evidence_types: ['browser_observed_anchor', 'synthetic_model_not_real_user_feedback', 'synthetic_counterfactual_not_observed_product_performance'],
  balance_design: 'exact marginal quotas per 100-person batch; randomized combinations; pairwise balance not enforced',
  bundle_summary: bundleSummary,
  current_summary: currentSummary,
  generator_sha256: hashFile(fileURLToPath(import.meta.url)),
  observed_input_sha256: hashFile(observedPath),
  cohort_sha256: hashFile(cohortFile),
  output_sha256: {
    report: hashFile(reportFile),
    role_summary: hashFile(path.join(outputDir, 'splashlens-life-role-summary.csv')),
    segment_summary: hashFile(path.join(outputDir, 'splashlens-life-segment-summary.csv')),
    intervention_ranking: hashFile(path.join(outputDir, 'splashlens-intervention-ranking.csv')),
    current_landing_summary: hashFile(path.join(outputDir, 'splashlens-current-landing-summary.csv')),
    current_role_landing: hashFile(path.join(outputDir, 'splashlens-current-role-landing.csv')),
    persona_ranking: hashFile(path.join(outputDir, 'splashlens-persona-ranking-5000.csv')),
  },
};
fs.writeFileSync(path.join(outputDir, 'run-manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');

console.log(JSON.stringify({
  outputDir,
  totalPersonas: allRows.length,
  bundleSummary,
  topIntervention: interventionRanking[0],
  topPainPoint: pains[0],
  cohortSha256: manifest.cohort_sha256,
}, null, 2));
