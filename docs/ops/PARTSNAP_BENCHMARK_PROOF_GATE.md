# PartSnap Deterministic Benchmark Proof Gate

## Purpose

This gate gives SplashLens a repeatable baseline for PartSnap evidence handling before real, consented field-image labels are available. It tests deterministic family ranking, evidence-gated exact matching, safe abstention, unsafe confidence, category coverage, and a modeled packet-completion target.

It is deliberately not presented as computer-vision validation.

## Run

```powershell
node tools\run-partsnap-benchmark.mjs
node --test tests\partsnap-benchmark.test.mjs
```

Write the current Markdown report:

```powershell
node tools\run-partsnap-benchmark.mjs --report docs\ops\PARTSNAP_BENCHMARK_REPORT_2026-10-02.md
```

The process exits `0` only when every threshold passes. A failed threshold exits `1`; invalid arguments or runner errors exit `2`.

## Coverage

The fixture set contains 120 cases across:

- Pumps
- Filters
- Heaters
- Automation
- Salt systems
- Pressure and suction cleaners
- Robotic cleaners
- Lights
- Spa packs, hot tubs, and swim spas
- Closing equipment

Each catalog record produces four case types:

1. Explicit model/reference identifier, eligible for exact-record scoring
2. Manufacturer and model evidence, eligible only for family scoring
3. Physical/family evidence without a readable label
4. Conflicting evidence that must abstain

## Default Thresholds

| Metric | Threshold |
| --- | ---: |
| Total cases | At least 100 |
| Categories | All 10 |
| Cases per category | At least 10 |
| Top-1 family accuracy | At least 85% |
| Top-3 family accuracy | At least 97% |
| Exact-part accuracy | At least 90% of eligible cases |
| Abstention precision | At least 95% |
| Abstention recall | At least 95% |
| Unsafe false confidence | No more than 1% |
| Median modeled packet time | No more than 60 seconds |

## Evidence Boundary

All initial cases are labeled `metadata_reference_only` and `imageProven: false`. They use model and equipment-family references compiled in the repository from manufacturer materials. They do not contain a real part photograph and do not prove:

- Image-recognition accuracy
- Exact fitment or interchange
- An orderable replacement SKU
- Manufacturer approval
- Warranty eligibility
- Live API behavior
- Real technician completion time

`exactPartAccuracy` is calculated only for cases with an explicit model/reference identifier. The runner refuses to count unlabeled or ambiguous cases in that denominator and counts unsupported exact claims as unsafe false confidence.

The packet-time metric is modeled fixture data. The report prints evaluator runtime separately so modeled field time cannot be confused with software execution time.

## Promotion Path

Reference cases remain regression fixtures. Replace or supplement them with consented field images only after each image has:

1. A recorded provenance and usage right
2. An independently confirmed equipment family
3. Exact part identity only where the label, manual, and installed context support it
4. A documented abstain expectation when evidence is incomplete
5. A measured technician packet-completion time

Production claims about PartSnap accuracy must use the image-proven subset only. Reference-only results may never be quoted as field-photo accuracy.
