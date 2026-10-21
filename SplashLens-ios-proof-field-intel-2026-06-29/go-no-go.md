# Go / No-Go

Date: 2026-06-29

## Verdict

No-go for TestFlight/App Store upload in this run.

## Green Checks

- Clean clone used because existing Mac checkout had uncommitted changes.
- Native iOS wrapper built successfully for simulator.
- Bundle ID verified: `com.splashlens.app`.
- Version verified: `1.0`.
- Build number verified: `10`.
- iOS minimum verified: `17.0`.
- Non-exempt encryption flag verified: `false`.
- Camera, microphone, and photo-library usage strings verified in built `Info.plist`.
- Wrapper loads `https://app.splashlens.com/?store=ios`.
- Native reload path added.
- WebKit cache/service-worker refresh added for first run per build.
- Field Intelligence packet displayed in native wrapper.
- Copy Packet wrote the CRM packet to simulator pasteboard.
- Native share sheet opened.
- Native CSV file share sheet opened.
- Native print options sheet opened.
- Camera permission prompt appeared only after Scan tab user action.
- Manual lookup and dosing calculator were reachable.

## Blockers Before Release

- Physical iPhone was offline, so real-device camera/microphone behavior was not verified.
- No signed App Store archive was produced or inspected.
- No App Store Connect/TestFlight processing state was checked.
- Native billing/IAP is not implemented or verified; store mode is free-core only.

## Release Action

No TestFlight upload, App Store submission, GitHub push, deploy, migration, payment change, or external send was performed.

## Next Release Gate Requirements

Before any upload/submission:

1. Re-run simulator smoke proof on the final build.
2. Run physical iPhone proof for camera and microphone permission behavior.
3. Produce and inspect the signed archive or exported artifact.
4. Verify bundle ID, version/build, signing, entitlements, permission strings, privacy manifest/state, and forbidden/rejected strings on the final artifact.
5. Upload only after blockers are resolved.
6. Confirm App Store Connect/TestFlight processing state after upload.
