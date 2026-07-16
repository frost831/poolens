import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const outputDir = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.join(root, 'docs', 'persona-lab', '2026-07-16');
const observedPath = path.join(outputDir, 'observed-workflows.json');

if (!fs.existsSync(observedPath)) {
  throw new Error(`Run splashlens_persona_workflow_smoke.py first. Missing ${observedPath}`);
}

const observed = JSON.parse(fs.readFileSync(observedPath, 'utf8'));
const observedByRole = Object.fromEntries(observed.roles.map((entry) => [entry.role, entry]));

const ROLE_CONFIG = {
  tech: {
    label: 'Service Tech',
    baseEase: 84,
    baseClarity: 82,
    baseWow: 0.79,
    baseTtv: 34,
    fit: 94,
    anchor: 'E05 lookup renders field guidance and verification language',
    goals: ['identify an equipment code', 'avoid a wrong part order', 'prepare a senior-tech packet', 'calculate a field dose', 'save visit proof'],
  },
  facility: {
    label: 'Facility / CPO',
    baseEase: 87,
    baseClarity: 88,
    baseWow: 0.81,
    baseTtv: 29,
    fit: 91,
    anchor: 'contamination lane gives numbered steps and resolve/escalate choices',
    goals: ['run a daily pool check', 'respond to a contamination event', 'document a dose', 'prepare an escalation packet', 'record equipment proof'],
  },
  counter: {
    label: 'Counter / Distributor',
    baseEase: 74,
    baseClarity: 78,
    baseWow: 0.72,
    baseTtv: 48,
    fit: 86,
    anchor: 'PartSnap result exposes missing proof, callback risk, and vendor packet',
    goals: ['identify a walk-in part', 'collect the missing label proof', 'send a vendor packet', 'reduce a wrong counter sale', 'compare possible part families'],
  },
  trainer: {
    label: 'Trainer',
    baseEase: 66,
    baseClarity: 68,
    baseWow: 0.61,
    baseTtv: 58,
    fit: 78,
    anchor: 'Apprentice Mode works after a PartSnap result is already present',
    goals: ['teach proof before ordering', 'run a five-minute field lesson', 'review a mystery part', 'practice escalation questions', 'use a facility scenario'],
  },
  homeowner: {
    label: 'Homeowner',
    baseEase: 72,
    baseClarity: 67,
    baseWow: 0.63,
    baseTtv: 43,
    fit: 69,
    anchor: 'volume and turnover math are immediate but the full technical nav remains visible',
    goals: ['estimate pool volume', 'understand turnover time', 'prepare a clear note for a pro', 'check a basic dosing input', 'know when to stop and call a pro'],
  },
};

const FIRST_NAMES = ['Alex', 'Jordan', 'Casey', 'Morgan', 'Taylor', 'Riley', 'Jamie', 'Avery', 'Cameron', 'Drew'];
const LAST_NAMES = ['Reed', 'Diaz', 'Patel', 'Brooks', 'Kim', 'Walker', 'Nguyen', 'Garcia', 'Miller', 'Johnson'];
const CURRENT_WORKFLOWS = ['manufacturer manuals', 'Google search', 'paper notes', 'CRM plus manuals', 'texting a senior tech', 'memory and photos'];
const EXPERIENCE_RANGES = {
  '0-1 years': [0, 1],
  '2-5 years': [2, 5],
  '6-10 years': [6, 10],
  '11-20 years': [11, 20],
  '21+ years': [21, 35],
};

function mulberry32(seed) {
  return function random() {
    let value = seed += 0x6D2B79F5;
    value = Math.imul(value ^ value >>> 15, value | 1);
    value ^= value + Math.imul(value ^ value >>> 7, value | 61);
    return ((value ^ value >>> 14) >>> 0) / 4294967296;
  };
}

const random = mulberry32(0x51A5C0DE);
const pick = (items) => items[Math.floor(random() * items.length)];
const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, value));
const round = (value, digits = 1) => Number(value.toFixed(digits));

function shuffle(items) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function quota(spec) {
  const values = [];
  for (const [value, count] of spec) {
    for (let i = 0; i < count; i += 1) values.push(value);
  }
  if (values.length !== 100) throw new Error(`Quota must contain 100 values, received ${values.length}`);
  return shuffle(values);
}

const quotaCache = new Map();

function batchQuotas(role, batch) {
  const key = `${role}-${batch}`;
  if (quotaCache.has(key)) return quotaCache.get(key);
  const goals = ROLE_CONFIG[role].goals;
  const homeownerScale = ['single pool', 'shared household', 'HOA or rental', 'multi-property', 'professionally managed'];
  const organizationScale = ['solo', '2-5', '6-20', '21-50', '51+'];
  const data = {
    experience: quota(Object.keys(EXPERIENCE_RANGES).map((value) => [value, 20])),
    company_size: quota((role === 'homeowner' ? homeownerScale : organizationScale).map((value) => [value, 20])),
    tech_comfort: quota([[1, 20], [2, 20], [3, 20], [4, 20], [5, 20]]),
    urgency: quota([[1, 20], [2, 20], [3, 20], [4, 20], [5, 20]]),
    device: quota([['iPhone', 30], ['Android', 30], ['desktop', 20], ['tablet or rugged device', 20]]),
    connection: quota([['good', 70], ['spotty', 15], ['offline-first', 15]]),
    accessibility_need: quota([
      ['none', 55], ['low vision', 10], ['limited dexterity', 10], ['screen reader', 10],
      ['high cognitive load', 10], ['hearing or speech', 5],
    ]),
    language: quota([['English', 60], ['English/Spanish', 20], ['Spanish-first', 20]]),
    primary_goal: quota(goals.map((value) => [value, 20])),
    current_workflow: quota(CURRENT_WORKFLOWS.map((value, index) => [value, index < 4 ? 17 : 16])),
  };
  quotaCache.set(key, data);
  return data;
}

function weighted(items) {
  const total = items.reduce((sum, item) => sum + item[1], 0);
  let cursor = random() * total;
  for (const [value, weight] of items) {
    cursor -= weight;
    if (cursor <= 0) return value;
  }
  return items.at(-1)[0];
}

function personaAttributes(role, index) {
  const cfg = ROLE_CONFIG[role];
  const batch = Math.floor(index / 100) + 1;
  const position = index % 100;
  const quotas = batchQuotas(role, batch);
  const experience = quotas.experience[position];
  const [yearMin, yearMax] = EXPERIENCE_RANGES[experience];
  return {
    persona_id: `DEMO-TEST-SL-${role.toUpperCase()}-${String(index + 1).padStart(3, '0')}`,
    account_name: `DEMO TEST ${cfg.label} ${String(index + 1).padStart(3, '0')}`,
    name: `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`,
    role,
    role_label: cfg.label,
    batch,
    experience,
    years_in_pool_world: yearMin + Math.floor(random() * (yearMax - yearMin + 1)),
    tech_comfort: quotas.tech_comfort[position],
    urgency: quotas.urgency[position],
    device: quotas.device[position],
    connection: quotas.connection[position],
    accessibility_need: quotas.accessibility_need[position],
    language: quotas.language[position],
    current_workflow: quotas.current_workflow[position],
    company_size: quotas.company_size[position],
    primary_goal: quotas.primary_goal[position],
  };
}

function painPointsFor(persona, scores) {
  const points = [];
  if (persona.role === 'trainer') points.push('training_value_hidden_until_after_a_partsnap_result');
  if (persona.role === 'homeowner') points.push('technical_navigation_remains_too_broad_for_homeowner_mode');
  if (persona.role === 'counter' && persona.connection !== 'good') points.push('partsnap_online_dependency_during_counter_work');
  if (persona.role === 'tech' && persona.primary_goal.includes('part')) points.push('role_opens_code_lookup_before_partsnap');
  if (persona.accessibility_need === 'low vision') points.push('dense_small_supporting_copy');
  if (persona.accessibility_need === 'limited dexterity') points.push('some_secondary_controls_are_smaller_than_primary_field_actions');
  if (persona.accessibility_need === 'high cognitive load') points.push('too_many_tools_visible_after_role_choice');
  if (persona.language !== 'English') points.push('language_choice_not_part_of_first_use_role_step');
  const multiUserContext = persona.role === 'homeowner'
    ? ['HOA or rental', 'multi-property', 'professionally managed'].includes(persona.company_size)
    : persona.company_size !== 'solo';
  const persistenceGoal = /save|record|history|shared/i.test(persona.primary_goal);
  if (multiUserContext && persistenceGoal) points.push('no_cross_device_team_history_without_optional_identity');
  if (scores.time_to_value_seconds > 75) points.push('value_requires_too_many_first_session_decisions');
  return [...new Set(points)].slice(0, 4);
}

function positiveSignals(persona, wow) {
  const signals = [];
  if (persona.role === 'facility') signals.push('numbered resolve_or_escalate workflow feels immediately actionable');
  if (persona.role === 'tech') signals.push('manual code lookup is fast and verification language builds trust');
  if (persona.role === 'counter') signals.push('missing proof and callback risk make the result safer than a confident guess');
  if (persona.role === 'trainer') signals.push('apprentice observe_prove_order exercise is teachable once revealed');
  if (persona.role === 'homeowner') signals.push('volume and turnover math gives a useful answer without an account');
  if (wow) signals.push('persona reached a recognizable field value moment in the first session');
  return signals;
}

function simulatePersona(role, index) {
  const cfg = ROLE_CONFIG[role];
  const observedRole = observedByRole[role];
  const persona = personaAttributes(role, index);
  const techDelta = (persona.tech_comfort - 3) * 4;
  const mobileDelta = ['Android', 'iPhone'].includes(persona.device) ? -2 : persona.device === 'desktop' ? 3 : 0;
  const connectionDelta = persona.connection === 'good' ? 1 : persona.connection === 'spotty' ? -5 : -9;
  const onlineSensitive = ['counter', 'trainer'].includes(role) ? connectionDelta : Math.min(0, connectionDelta / 3);
  const accessDelta = persona.accessibility_need === 'none' ? 0 : persona.accessibility_need === 'high cognitive load' ? -9 : -6;
  const languageDelta = persona.language === 'English' ? 0 : persona.language === 'English/Spanish' ? -2 : -6;
  const urgencyDelta = persona.urgency >= 4 ? -4 : persona.urgency === 1 ? 2 : 0;
  const observedDelta = observedRole?.status === 'passed' ? 3 : -15;
  const noise = (random() - 0.5) * 14;

  const ease = clamp(cfg.baseEase + techDelta + mobileDelta + onlineSensitive + accessDelta + languageDelta + urgencyDelta + observedDelta + noise);
  const clarity = clamp(cfg.baseClarity + techDelta * 0.45 + accessDelta + languageDelta + urgencyDelta + observedDelta + (random() - 0.5) * 12);
  const completionProbability = clamp((ease * 0.62 + clarity * 0.38) / 100, 0.08, 0.98);
  const completed = random() < completionProbability;
  const timeToValue = Math.max(12, cfg.baseTtv + (100 - ease) * 0.7 + persona.urgency * 2 + random() * 25);
  const wowProbability = clamp(
    (cfg.baseWow * 100 + (clarity - 70) * 0.35 + (ease - 70) * 0.25 + (persona.urgency - 3) * 2) / 100,
    0.08,
    0.95,
  );
  const wow = completed && random() < wowProbability;
  const trust = clamp(74 + (persona.experience === '21+ years' ? 7 : 0) + (role === 'facility' ? 6 : 0) + (random() - 0.5) * 16);
  const usefulness = clamp(cfg.fit * 0.55 + ease * 0.2 + clarity * 0.15 + (wow ? 10 : -4));
  const useAgain = clamp(usefulness * 0.65 + trust * 0.25 + (wow ? 10 : 0));
  const scores = {
    ease_score: round(ease),
    clarity_score: round(clarity),
    trust_score: round(trust),
    usefulness_score: round(usefulness),
    use_again_score: round(useAgain),
    completion_probability: round(completionProbability * 100),
    completed_first_value: completed,
    wow_moment: wow,
    wow_probability: round(wowProbability * 100),
    time_to_value_seconds: round(timeToValue),
  };
  const painPoints = painPointsFor(persona, scores);
  const positives = positiveSignals(persona, wow);
  const feeling = wow
    ? `SIMULATED PERSONA FEEDBACK: The ${cfg.anchor.toLowerCase()} made the value click. ${painPoints[0] ? `The first improvement I would ask for is ${painPoints[0].replaceAll('_', ' ')}.` : 'I would use this again on a real stop.'}`
    : `SIMULATED PERSONA FEEDBACK: I could see the purpose, but the first session did not create a strong enough payoff. ${painPoints[0] ? `Main friction: ${painPoints[0].replaceAll('_', ' ')}.` : 'I needed a clearer next best action.'}`;

  return {
    ...persona,
    evidence_type: 'synthetic_model_not_real_user_feedback',
    observed_anchor: cfg.anchor,
    ...scores,
    positive_signals: positives,
    pain_points: painPoints,
    simulated_feedback: feeling,
    persistence: 'none; no account created; DEMO TEST identifier exists only in this report',
  };
}

function csvEscape(value) {
  const text = Array.isArray(value) ? value.join('|') : String(value ?? '');
  return `"${text.replaceAll('"', '""')}"`;
}

function writeCsv(file, rows, columns) {
  const lines = [columns.map(csvEscape).join(',')];
  for (const row of rows) lines.push(columns.map((column) => csvEscape(row[column])).join(','));
  fs.writeFileSync(file, `${lines.join('\n')}\n`, 'utf8');
}

function summarize(rows, groupKey) {
  const groups = new Map();
  for (const row of rows) {
    const key = typeof groupKey === 'function' ? groupKey(row) : row[groupKey];
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  }
  return [...groups.entries()].map(([key, entries]) => {
    const avg = (field) => round(entries.reduce((sum, entry) => sum + Number(entry[field] || 0), 0) / entries.length);
    return {
      group: key,
      personas: entries.length,
      completion_rate: round(entries.filter((entry) => entry.completed_first_value).length / entries.length * 100),
      wow_rate: round(entries.filter((entry) => entry.wow_moment).length / entries.length * 100),
      ease_score: avg('ease_score'),
      clarity_score: avg('clarity_score'),
      trust_score: avg('trust_score'),
      usefulness_score: avg('usefulness_score'),
      use_again_score: avg('use_again_score'),
      time_to_value_seconds: avg('time_to_value_seconds'),
    };
  });
}

function topPainPoints(rows, limit = 12) {
  const counts = new Map();
  for (const row of rows) {
    for (const point of row.pain_points) counts.set(point, (counts.get(point) || 0) + 1);
  }
  return [...counts.entries()]
    .map(([pain_point, count]) => ({ pain_point, count, rate: round(count / rows.length * 100) }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

fs.mkdirSync(outputDir, { recursive: true });
const personaDir = path.join(outputDir, 'personas');
fs.mkdirSync(personaDir, { recursive: true });

const allRows = [];
for (const role of Object.keys(ROLE_CONFIG)) {
  const rows = Array.from({ length: 500 }, (_, index) => simulatePersona(role, index));
  allRows.push(...rows);
  fs.writeFileSync(
    path.join(personaDir, `${role}-500.jsonl`),
    `${rows.map((row) => JSON.stringify(row)).join('\n')}\n`,
    'utf8',
  );
}

const columns = [
  'persona_id', 'account_name', 'name', 'role', 'role_label', 'batch', 'experience',
  'years_in_pool_world', 'tech_comfort', 'urgency', 'device', 'connection',
  'accessibility_need', 'language', 'current_workflow', 'company_size', 'primary_goal',
  'completed_first_value', 'wow_moment', 'time_to_value_seconds', 'ease_score',
  'clarity_score', 'trust_score', 'usefulness_score', 'use_again_score', 'pain_points',
  'positive_signals', 'simulated_feedback', 'evidence_type', 'persistence',
];
writeCsv(path.join(outputDir, 'splashlens-persona-cohort-2500.csv'), allRows, columns);

const roleSummary = summarize(allRows, 'role').map((row) => ({
  ...row,
  role_label: ROLE_CONFIG[row.group].label,
  observed_status: observedByRole[row.group]?.status || 'missing',
}));
const batchSummary = summarize(allRows, (row) => `${row.role}-batch-${row.batch}`);
const painSummary = topPainPoints(allRows);
writeCsv(path.join(outputDir, 'splashlens-persona-role-summary.csv'), roleSummary, Object.keys(roleSummary[0]));
writeCsv(path.join(outputDir, 'splashlens-persona-batch-summary.csv'), batchSummary, Object.keys(batchSummary[0]));
writeCsv(path.join(outputDir, 'splashlens-persona-pain-points.csv'), painSummary, Object.keys(painSummary[0]));

const ranked = [...roleSummary].sort((a, b) => b.wow_rate - a.wow_rate);
const deepLinkCheck = observed.deep_link_checks?.find((entry) => entry.name.includes('PartSnap'));
const roleTable = ranked.map((row, index) =>
  `| ${index + 1} | ${row.role_label} | ${row.personas} | ${row.completion_rate}% | ${row.wow_rate}% | ${row.ease_score} | ${row.clarity_score} | ${row.use_again_score} | ${row.time_to_value_seconds}s |`,
).join('\n');
const observedTable = observed.roles.map((row) =>
  `| ${row.label} | ${row.status} | ${row.active_tab || '-'} | ${row.wow_trigger || '-'} | ${row.feedback_prompt_observed ? 'quick prompt' : row.full_feedback_overlay_observed ? 'full modal' : 'none'} | ${row.horizontal_overflow_px ?? '-'} px | ${row.console_errors?.length || 0} |`,
).join('\n');
const painTable = painSummary.slice(0, 10).map((row) =>
  `| ${row.pain_point.replaceAll('_', ' ')} | ${row.count} | ${row.rate}% |`,
).join('\n');

const report = `# SplashLens Persona Workflow Evaluation

Date: 2026-07-16  
Run label: DEMO TEST SPLASHLENS PERSONA LAB 2026-07-16

## Evidence Boundary

This report combines two different evidence types and does not blur them:

- **Browser-observed:** five real first-use journeys against https://app.splashlens.com with event and feedback writes intercepted.
- **Synthetic cohort:** 2,500 deterministic persona simulations, 500 per SplashLens role in five batches of 100. These are modeled opinions, not real customer quotes or testimonials.
- **Production accounts created:** 0. SplashLens is no-account by design.
- **Test data:** every synthetic identifier starts with DEMO TEST or DEMO-TEST. Browser contexts were ephemeral and closed after each journey.

## Browser-Observed Workflow

| Role | Result | Landing | Observed value moment | Feedback interruption | Horizontal overflow | Console errors |
|---|---:|---|---|---|---:|---:|
${observedTable}

### Confirmed First-Use Friction

- **Feedback timing:** Service Tech received the quick feedback prompt immediately after the first successful manual lookup. That is measurable, but may be earlier than the best moment to ask.
- **Homeowner density:** Homeowner reached a correct turnover result, but still had all nine technician navigation items visible.
- **PartSnap deep link:** ${deepLinkCheck?.tool_blocked_by_role_picker ? 'confirmed - the PartSnap tool rendered while the role picker remained visible over it in a fresh context.' : 'not reproduced in this run.'}
- **Facility packet depth:** Facility Assist gives the strongest guided path, but the current completion packet still needs richer reading, symptom, photo, and recent-change capture to become durable proof.

## Synthetic Cohort Ranking

| Rank | Role | Personas | First-value completion | Wow rate | Ease | Clarity | Use again | Avg. time to value |
|---:|---|---:|---:|---:|---:|---:|---:|---:|
${roleTable}

## What Creates The Wow

1. **Facility / CPO:** the cleanest first-use workflow. A situation becomes numbered actions and ends in an explicit resolve-or-escalate decision.
2. **Service Tech:** fast manual lookup plus verification language creates confidence without pretending to diagnose.
3. **Counter / Distributor:** PartSnap becomes differentiated when it shows missing proof, callback risk, and a vendor packet rather than only naming a part.
4. **Homeowner:** immediate volume/turnover math is useful, but the full technical navigation weakens the feeling that this is a safe homeowner lane.
5. **Trainer:** Apprentice Mode is credible after a PartSnap result, but the first screen does not reveal a lesson or scenario. The promised training value is one step too hidden.

## Ranked Pain Points

| Pain point | Personas affected | Cohort rate |
|---|---:|---:|
${painTable}

## Cohort Construction

Each role contains five deterministic 100-person batches. Every batch has exact quotas: five experience bands, five organization/site scales, five technical-comfort levels, five urgency levels, 30 iPhone, 30 Android, 20 desktop, 20 tablet/rugged, 70 normal connections, 15 constrained connections, 15 offline-first contexts, and explicit accessibility and language representation. Scores are directional modeled outputs anchored to the browser-observed workflow; they do not estimate real market prevalence.

## Recommended Product Moves

1. Add a role-specific **Next best action** card immediately after role selection. One dominant action, two secondary actions, and a visible change-role control.
2. Make **Trainer** open directly into a five-minute sample lesson or scenario. Do not require a successful PartSnap result before the training value is visible.
3. Give **Counter / Distributor** a safe DEMO TEST sample packet button so a counter person can understand the proof and escalation workflow before taking a photo.
4. Reduce **Homeowner** navigation to Volume, Basics, Ask a Pro, and Saved Notes. Keep advanced service tools behind an explicit Pro Tools entry.
5. Let **Service Tech** choose Code Lookup or PartSnap as the first dominant fork. Both are flagship entry points.
6. Keep **Facility / CPO** as the interaction model to copy: situation first, numbered steps, clear completion state, and escalation packet.
7. Add first-use outcome events for role selected, first meaningful action, first completed workflow, first wow proxy, and role change. Keep test traffic tagged or intercepted.

## How To Use This Report

The synthetic rates are directional prioritization evidence, not market validation. Use them to choose what to prototype and what to ask live testers. Real validation still requires named field testers completing the same journeys while timing and feedback are recorded with consent.

## Deliverables

- observed-workflows.json: browser facts and cleanup proof.
- splashlens-persona-cohort-2500.csv: all 2,500 individually scored personas.
- splashlens-persona-role-summary.csv: role ranking.
- splashlens-persona-batch-summary.csv: every 100-person batch.
- splashlens-persona-pain-points.csv: ranked friction.
- personas/*.jsonl: full per-role detail including modeled feedback.
- screenshots/*.png: role workflow evidence.
`;

fs.writeFileSync(path.join(outputDir, 'SPLASHLENS_PERSONA_COHORT_REPORT_2026-07-16.md'), report, 'utf8');
fs.writeFileSync(path.join(outputDir, 'run-manifest.json'), JSON.stringify({
  run_label: 'DEMO TEST SPLASHLENS PERSONA LAB 2026-07-16',
  generated_at: new Date().toISOString(),
  deterministic_seed: '0x51A5C0DE',
  roles: Object.keys(ROLE_CONFIG),
  personas_per_role: 500,
  batch_size: 100,
  total_personas: allRows.length,
  production_accounts_created: 0,
  production_writes: 'intercepted in browser smoke; cohort is offline only',
  cleanup: 'ephemeral browser contexts closed; no persistent test records',
  evidence_types: ['browser_observed', 'synthetic_model_not_real_user_feedback'],
}, null, 2), 'utf8');

console.log(JSON.stringify({ outputDir, totalPersonas: allRows.length, roleSummary, topPainPoints: painSummary.slice(0, 10) }, null, 2));
