# Reviewer Path

This path assumes the iOS wrapper opens `https://app.splashlens.com/?store=ios`.

1. Launch SplashLens.
2. Wait for the marketing/app shell to finish loading.
3. Tap `Open Tools`.
4. Open `Saved Pools`.
5. Open the proof pool named `Field Intel Test Pool`.
6. Confirm the Field Intelligence panel shows:
   - Service proof count
   - Equipment count
   - Callback risk count
   - Next visit reminder
   - Equipment tree entry: `Pentair / automation / IntelliCenter`
   - Symptom: `app pairing offline`
7. Tap `Copy Packet`.
8. Confirm simulator pasteboard contains the SplashLens Field Intelligence Packet.
9. Tap `Share`.
10. Confirm the native iOS share sheet appears.
11. Tap `CSV`.
12. Confirm the native file share sheet appears for `field-intel-test-pool-field-packet.csv`.
13. Tap `Print/PDF`.
14. Confirm the native iOS print options sheet appears with a preview.
15. Open `Scan`.
16. Confirm the camera permission prompt appears only after this user action.
17. Deny the simulator camera prompt for proof run.
18. Confirm manual lookup and dosing calculator remain available.

## Proof Data

Pool:

- Name: `Field Intel Test Pool`
- Address: `123 Main St`
- Profile: `15000 gal | Inground Gunite | Chlorine | Cartridge`
- Primary equipment note: `Pentair IntelliCenter`
- Latest chemistry: `FC 5 | CC 0 | pH 7.5 | TA 80 | CH 250 | CYA 40`
- Equipment: `Pentair / automation / IntelliCenter`
- Symptom: `app pairing offline`
- Next visit: `2026-07-06 - Check IntelliCenter app pairing and customer network.`

## Important Limitation

This run captured simulator proof only. A physical iPhone was listed offline, so real camera/microphone behavior was not verified on device.
