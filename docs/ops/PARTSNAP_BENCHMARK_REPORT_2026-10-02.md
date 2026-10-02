# PartSnap Deterministic Benchmark Report

Generated: 2026-10-02T18:43:18.071Z  
Benchmark version: 2026-10-02.1  
Result: **PASS**

## Evidence Boundary

This deterministic gate validates ranking and evidence policy against reference metadata. It does not validate computer vision, live API behavior, fitment, or field accuracy.

- Image-proven cases: 0
- Metadata/reference-only cases: 120
- Exact-part scoring denominator: 30 cases with an explicit reference identifier
- Exact-part success does not establish fitment, interchange, manufacturer approval, or permission to order
- Packet time is a deterministic modeled duration attached to each reference case, not observed technician time

## Metrics

| Metric | Result |
| --- | ---: |
| Cases | 120 |
| Family-evaluable cases | 90 |
| Top-1 family accuracy | 100.0% |
| Top-3 family accuracy | 100.0% |
| Exact-part accuracy on eligible cases | 100.0% |
| Abstention precision | 100.0% |
| Abstention recall | 100.0% |
| Unsafe false confidence | 0 (0.0%) |
| Unsupported exact claims | 0 |
| Median modeled packet time | 48.5s |
| Median evaluator runtime | 0.274ms |

## Threshold Checks

| Check | Status | Actual | Required |
| --- | --- | ---: | ---: |
| minimum cases | PASS | 120 | >= 100 |
| minimum categories | PASS | 10 | >= 10 |
| minimum cases per category | PASS | 12 | >= 10 |
| top-1 family accuracy | PASS | 1 | >= 0.85 |
| top-3 family accuracy | PASS | 1 | >= 0.97 |
| exact-part accuracy | PASS | 1 | >= 0.9 |
| abstention precision | PASS | 1 | >= 0.95 |
| abstention recall | PASS | 1 | >= 0.95 |
| unsafe false confidence rate | PASS | 0 | <= 0.01 |
| median packet time | PASS | 48.5 | <= 60s |

## Coverage

| Category | Cases |
| --- | ---: |
| pumps | 12 |
| filters | 12 |
| heaters | 12 |
| automation | 12 |
| salt_systems | 12 |
| pressure_suction_cleaners | 12 |
| robotic_cleaners | 12 |
| lights | 12 |
| spa_hot_tub_swim_spa | 12 |
| closing_equipment | 12 |

## Interpretation

This is a deterministic policy and retrieval proof gate. It proves that reference evidence is ranked consistently, exact matching is restricted to explicitly identified cases, ambiguous evidence causes abstention, unsafe confidence is counted, and threshold failures fail the process. It cannot be used as proof of photo-recognition accuracy or production field performance. The next benchmark revision should replace reference-only cases with consented, labeled field images while preserving these cases as regression fixtures.
