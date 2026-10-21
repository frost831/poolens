# Field Intelligence Proof

Proof date: 2026-06-29

## Verified In Native iOS Wrapper

Screenshot: `screenshots/05-field-intelligence-panel-equipment-tree.png`

Observed field intelligence content:

- Pool profile for `Field Intel Test Pool`
- Service proof count visible
- Equipment count visible
- Callback risk count visible
- Next visit reminder visible
- Equipment tree visible
- Equipment entry: `Pentair / automation / IntelliCenter`
- Symptom: `app pairing offline`
- Confidence: `tech verified`
- CRM packet actions visible: `Copy Packet`, `Share`, `CSV`, `Print/PDF`

## Proof Packet Copied To Simulator Pasteboard

`xcrun simctl pbpaste 5BEF9814-6D0B-4BCB-A03B-B3977322735D` returned:

```text
SplashLens Field Intelligence Packet
Pool: Field Intel Test Pool
Address: 123 Main St
Profile: 15000 gal | Inground Gunite | Chlorine | Cartridge
Primary equipment note: Pentair IntelliCenter
Callback risk: Watch Next Visit
Next visit: 2026-07-06 - Check IntelliCenter app pairing and customer network.
Latest proof (2026-06-29): Equipment checked and callback risk packet generated.
Proof status: complete
Latest chemistry (2026-06-29): FC 5 | CC 0 | pH 7.5 | TA 80 | CH 250 | CYA 40
Equipment tree:
- Pentair / automation / IntelliCenter: app pairing offline (tech verified)
Site notes: Simulator proof profile for iOS wrapper verification.
Use this as a field packet for Jobber, Skimmer, Pool Brain, QuickBooks, office notes, a senior tech, or a vendor counter.
SplashLens is a reference aid. Verify with model numbers, manuals, qualified tech judgment, and manufacturer guidance before ordering parts or diagnosing.
```

## Seeded Proof Data

The proof pool was seeded into simulator-only WebKit localStorage because direct WKWebView automation could not reliably complete the nested mobile form. Existing localStorage values were UTF-16LE blobs, so the seed used the same value encoding for key `poolens-pools`.

This was local proof data only. It did not touch production data or any external account.
