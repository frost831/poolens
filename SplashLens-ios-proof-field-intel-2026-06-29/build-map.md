# SplashLens Field Intelligence iOS Build Map

Date: 2026-06-29

## Source

- Working copy: `/Users/macbookpro/SplashLens-field-intel-ios-2026-06-29`
- Original dirty checkout left untouched: `/Users/macbookpro/Frost-iOS/poolens`
- Branch: `feature/splashlens-usage-alerts-dashboard`
- Branch tip inspected: `9831bde Add SplashLens field intelligence Mac handoff`
- App-code baseline underneath handoff doc: `d0d069f Build SplashLens field intelligence layer`
- Modified locally:
  - `SplashLens.xcodeproj/project.pbxproj`
  - `ios/SplashLens/ContentView.swift`

## Native Wrapper Changes

- Bundle identifier remains `com.splashlens.app`.
- Marketing version remains `1.0`.
- Build number bumped to `10`.
- Store shell URL is `https://app.splashlens.com/?store=ios`.
- WKWebView loads with `.reloadIgnoringLocalCacheData`.
- First run per build clears only WebKit cache/fetch/service-worker records for the SplashLens origin.
- Native reload button added with accessibility label `Reload SplashLens`.
- Native bridges added for:
  - `navigator.share`
  - Blob CSV download sharing
  - `window.print` and blank popup print flows

## Build

Command:

```sh
xcodebuild -project SplashLens.xcodeproj -scheme SplashLens -configuration Debug -destination 'generic/platform=iOS Simulator' -derivedDataPath /tmp/SplashLensDerivedData-field-intel-20260629 build
```

Result: succeeded.

Built app:

`/tmp/SplashLensDerivedData-field-intel-20260629/Build/Products/Debug-iphonesimulator/SplashLens.app`

## Built Info.plist Checks

- `CFBundleDisplayName`: `SplashLens`
- `CFBundleIdentifier`: `com.splashlens.app`
- `CFBundleShortVersionString`: `1.0`
- `CFBundleVersion`: `10`
- `MinimumOSVersion`: `17.0`
- `ITSAppUsesNonExemptEncryption`: `false`
- `NSCameraUsageDescription`: present
- `NSMicrophoneUsageDescription`: present
- `NSPhotoLibraryUsageDescription`: present

## Runtime Target

- Simulator: `Bay2CourseMoonshot-iPhone17ProMax Simulator (26.5)`
- Simulator UDID: `5BEF9814-6D0B-4BCB-A03B-B3977322735D`
- Latest launch bundle ID: `com.splashlens.app`

## Device Availability

`xcrun xctrace list devices` showed:

- Local Mac available.
- `Bay2CourseMoonshot-iPhone17ProMax Simulator (26.5)` available.
- Physical `iPhone (27.0)` listed under offline devices.
- Apple Watch listed under offline devices.

No physical iPhone was available for real camera/microphone proof in this run.
