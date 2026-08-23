# Mac Handoff - SplashLens Field Learning OS iOS Refresh

## Done

- Field Learning OS is live at `https://app.splashlens.com/?mode=trainer&utm_source=field_learning_os`.
- Public positioning is live at `https://splashlens.com/field-learning-os`.
- PartSnap Lesson, CPO Scenario, and Proof Review were verified in production.
- App source is pushed to GitHub at commit `b46331222929d141e865328a9288d0cad8e2e2be`.
- The web feature does not require native-only implementation; the iOS wrapper must load the current live app and refresh store evidence.

## Needs Manual Action

- Apple owner: Mac.
- App Store Connect app: SplashLens, Apple ID `6763644905`.
- Bundle ID: `com.splashlens.app`.
- Current submitted train from the last verified handoff: version `1.0.7`, build `14`.
- Check App Store Connect before choosing a build number. Never reuse build `14`.
- If `1.0.7` is still waiting for review, do not cancel it solely for this web-delivered feature. Update promotional text/screenshots only where App Store Connect permits.
- If a new binary is required, use version `1.0.7` with build `15` or the next unused build shown in App Store Connect.

## Files / Artifacts

- Repo: `https://github.com/throttleshare/poolens.git`
- Branch: `feature/splashlens-usage-alerts-dashboard`
- Required commit: `b463312` or newer
- Existing iOS project and signing materials remain Mac-side.
- Public Learning OS page: `https://splashlens.com/field-learning-os`
- Trainer deep link: `https://app.splashlens.com/?mode=trainer&utm_source=field_learning_os`

## Commands

```bash
git clone https://github.com/throttleshare/poolens.git
cd poolens
git checkout feature/splashlens-usage-alerts-dashboard
git pull --ff-only
git rev-parse HEAD
```

Confirm the result is `b46331222929d141e865328a9288d0cad8e2e2be` or newer.

## Store Copy

Suggested release note:

> Adds Field Learning OS workflows that turn real PartSnap misses, facility scenarios, and saved service proof into short field lessons with proof checks and review guidance. SplashLens remains a reference aid and does not replace manuals, codes, certification, or qualified judgment.

Suggested promotional line:

> Get off the pad faster, then turn the stop into a five-minute field lesson.

Do not claim official Aquatic Council, CPO, manufacturer, or certification alignment unless a written partnership approves that language.

## Screenshot Set

Capture real wrapper screens, not marketing-only compositions:

1. PartSnap result with source-backed candidates and proof prompts.
2. Field Learning OS showing PartSnap Lesson.
3. CPO Scenario with the student task and answer key visible.
4. Service Proof workflow showing the report or handoff output.

Keep captions short:

- `Identify the family. Verify the proof.`
- `Turn real stops into five-minute lessons.`
- `Practice the facility response before it happens.`
- `Leave a cleaner handoff.`

## Verification

1. Delete or clear the prior wrapper cache before testing.
2. Confirm first launch opens the live SplashLens app without a blank or stale service-worker screen.
3. Confirm camera and microphone permission prompts appear only when the user starts a related action.
4. Open Trainer Mode and activate all three lesson types.
5. Verify privacy and support links load.
6. Verify checkout links open the intended purchase surface and no paid capability is described as unlocked before entitlement.
7. Run the iPhone screenshot set through copy/OCR review for clipping, stale version text, and unsupported claims.
8. Validate the archive and exported IPA before upload.

## Checklist

1. Pull `b463312` or newer.
2. Inspect the existing `1.0.7` / build `14` review state.
3. Keep the existing submission if the web-delivered update is already present and a binary replacement is unnecessary.
4. Otherwise build with the next unused build number.
5. Capture the four real workflow screenshots.
6. Validate, upload, submit, and save the App Store Connect submission ID and final Git commit.
