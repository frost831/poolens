# Permissions Proof

## Built Info.plist Permission Strings

Built app:

`/tmp/SplashLensDerivedData-field-intel-20260629/Build/Products/Debug-iphonesimulator/SplashLens.app`

Verified strings:

- `NSCameraUsageDescription`: `SplashLens uses the camera only when you choose the optional scanner to review equipment displays, parts, or test strips.`
- `NSMicrophoneUsageDescription`: `SplashLens can use the microphone only when you choose dictated service notes.`
- `NSPhotoLibraryUsageDescription`: `SplashLens can use a photo you select for optional scanner assistance.`

## Runtime Permission Behavior

Screenshot:

`screenshots/12-scan-camera-permission-user-action.png`

Observed behavior:

- Camera permission prompt appeared only after the user opened the `Scan` tab.
- Prompt text shown by iOS: `Allow app.splashlens.com to use your camera?`
- The prompt was denied for this simulator proof run.

## Device Proof Status

No physical iPhone was available for this run. `xcrun xctrace list devices` listed a physical `iPhone (27.0)` under offline devices.

Camera and microphone behavior still need real-device verification before TestFlight/App Store submission.
