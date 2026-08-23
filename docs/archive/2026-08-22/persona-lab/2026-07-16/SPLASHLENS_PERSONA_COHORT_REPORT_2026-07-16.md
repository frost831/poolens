# SplashLens Persona Workflow Evaluation

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
| Service Tech | passed | tab-errors | manual code lookup | quick prompt | 0 px | 0 |
| Facility / CPO | passed | tab-errors | contamination response lane | none | 0 px | 0 |
| Counter / Distributor | passed | tab-scan | PartSnap proof and vendor packet | none | 0 px | 0 |
| Trainer | passed | tab-scan | PartSnap Apprentice Mode | none | 0 px | 0 |
| Homeowner | passed | tab-volume | pool turnover calculation | none | 0 px | 0 |

### Confirmed First-Use Friction

- **Feedback timing:** Service Tech received the quick feedback prompt immediately after the first successful manual lookup. That is measurable, but may be earlier than the best moment to ask.
- **Homeowner density:** Homeowner reached a correct turnover result, but still had all nine technician navigation items visible.
- **PartSnap deep link:** confirmed - the PartSnap tool rendered while the role picker remained visible over it in a fresh context.
- **Facility packet depth:** Facility Assist gives the strongest guided path, but the current completion packet still needs richer reading, symptom, photo, and recent-change capture to become durable proof.

## Synthetic Cohort Ranking

| Rank | Role | Personas | First-value completion | Wow rate | Ease | Clarity | Use again | Avg. time to value |
|---:|---|---:|---:|---:|---:|---:|---:|---:|
| 1 | Facility / CPO | 500 | 85.2% | 76.2% | 82.8 | 85.2 | 83.9 | 59.1s |
| 2 | Service Tech | 500 | 79.6% | 68% | 79.8 | 79.2 | 80.9 | 66.6s |
| 3 | Counter / Distributor | 500 | 69% | 51.6% | 69.1 | 75.4 | 73.2 | 87.9s |
| 4 | Trainer | 500 | 65.6% | 39.2% | 61.3 | 65 | 65.9 | 103.4s |
| 5 | Homeowner | 500 | 67.2% | 39.2% | 67.6 | 64 | 63.5 | 83.9s |

## What Creates The Wow

1. **Facility / CPO:** the cleanest first-use workflow. A situation becomes numbered actions and ends in an explicit resolve-or-escalate decision.
2. **Service Tech:** fast manual lookup plus verification language creates confidence without pretending to diagnose.
3. **Counter / Distributor:** PartSnap becomes differentiated when it shows missing proof, callback risk, and a vendor packet rather than only naming a part.
4. **Homeowner:** immediate volume/turnover math is useful, but the full technical navigation weakens the feeling that this is a safe homeowner lane.
5. **Trainer:** Apprentice Mode is credible after a PartSnap result, but the first screen does not reveal a lesson or scenario. The promised training value is one step too hidden.

## Ranked Pain Points

| Pain point | Personas affected | Cohort rate |
|---|---:|---:|
| value requires too many first session decisions | 1464 | 58.6% |
| language choice not part of first use role step | 1000 | 40% |
| training value hidden until after a partsnap result | 500 | 20% |
| technical navigation remains too broad for homeowner mode | 500 | 20% |
| too many tools visible after role choice | 250 | 10% |
| some secondary controls are smaller than primary field actions | 250 | 10% |
| dense small supporting copy | 250 | 10% |
| no cross device team history without optional identity | 157 | 6.3% |
| partsnap online dependency during counter work | 150 | 6% |
| role opens code lookup before partsnap | 100 | 4% |

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
