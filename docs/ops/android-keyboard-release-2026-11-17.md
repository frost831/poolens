# Live release and Android keyboard follow-up

PR97 merged as `87fee450116f2326c20fcb13f14f677ba56d559b`. Its post-merge
[CI passed](https://github.com/frost831/poolens/actions/runs/44181764385), and the
exact merged tree was deployed to [production](https://app.splashlens.com) at
[92fce3e1](https://92fce3e1.poolens.pages.dev). Live desktop/mobile smoke,
reviewed-source hashes, XSS, manual recovery, offline update and protected API
checks pass. Eight deployed-client billing/checkout checks pass with provider
fixtures. Separately, the verified BZM QA account opened the actual USD19/month
Stripe checkout and canceled: the prior answer and four photos returned on the
new release, with one scan still remaining in a fresh account response. No
payment or additional AI request was made.

## Keyboard defect and repair

Real Android keyboard testing found that the shared email sheet extended behind
the keyboard, making Not now untappable. The follow-up fits the visual viewport,
scrolls the fields separately, and keeps the main controls available. In very
short keyboard viewports the main actions share a row so the email field stays
fully readable. It handles viewport panning/resizing and missing visualViewport,
cleans up listeners, and restores focus. Two browser regressions fail before the
repair and pass afterward. The complete suite passes476 tests, zero failures or
skips, with Chromium fixtures enabled.

The candidate asset is `20261117-keyboard-sheet-2`, cache
`splashlens-v73-keyboard-sheet`, at the
[PR98 preview](https://android-keyboard-sheet-98.poolens.pages.dev).
This follow-up is not merged or deployed to production.

## Native evidence boundary

Candidate1.0.13/code14 was sideloaded on the isolated Android16 emulator. The
preview's static assets were routed into the actual TWA host for this test;
the run is not a production deployment. With the real keyboard open, both the
email field and main controls remain visible, and Not now dismisses the sheet
through a normal tap. Manual lookup, gallery, blank-photo rejection, account
gating and native web-checkout exclusion pass. Native windows are checked at
boot, launch, gallery, verification and the Play account gate. AI, verification
mail and checkout API side effects are blocked and asserted absent. This does
not establish a licensed Play purchase or physical-camera/fitment accuracy.

The preserved production1.0.12/code13 APK has SHA256
`7095a86394a58cd0199fb85ccf725e1fd989fe669a755fa2fefcb384b3584497`.
It was tested in a disposable read-only emulator overlay. Its DOM continued to
work behind a native Google Play protection dialog on the non-Play image.
That is **blocked native acceptance**, regardless of passing DOM assertions.
The receipt was corrected; protection was not bypassed. A valid production APK
test needs the official Play-installed app on a Play-enabled, signed-in runtime.
An official API35 Google Play image and a separate QA AVD are prepared for this
path; account sign-in and the official store install still need completion.

Run the native-window gate before accepting a receipt:

```powershell
node tools/check-android-native-window.mjs path/to/native-window.xml
```

The gate rejects missing/truncated hierarchy proof, ANRs, the observed Google
Play protection message, and unexpected native alerts. It prints a sanitized
result and exits nonzero for blocked proof. Apply it to every native milestone
and inspect screenshots before writing a passing flow receipt.

The earlier System UI ANR occurred in keyguard during boot before SplashLens
opened, with guest CPU saturation. A stable QA configuration uses hardware GLES,
720x1280 at320dpi, four guest cores,2048MiB RAM and Vulkan disabled, with host
memory checks and serial runs. The original QA configuration is backed up.
This is an emulator configuration repair, not an app/device stability claim.

Native paid billing remains disabled. Merchant linkage, actual catalog IDs,
licensed internal purchase/restore/revocation testing and release approval remain
separate gates. No store track, signing key, credential or production billing
schema was changed by this follow-up. Use `frost@belowzeromedia.com` for SplashLens
QA and new contacts; existing store ownership is not migrated.

References: [Android emulator troubleshooting](https://developer.android.com/studio/run/emulator-troubleshooting),
[Play billing test requirements](https://developer.android.com/google/play/billing/test),
[emulator licensing sign-in](https://developer.android.com/google/play/licensing/setting-up).
