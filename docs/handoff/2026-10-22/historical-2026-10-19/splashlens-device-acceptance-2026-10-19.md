# SplashLens installed-device acceptance

The October 19 web fixes are tested. Installed iOS/Android behavior and real part identification still require a physical device and a verified test account. This checklist records that evidence without counting synthetic browser tests as field proof.

Use the current production app on one iPhone and one Android phone. Record the installed app version, OS, UTC time, and an opaque scan ID when one is displayed. Keep email codes, signed access links and customer information out of shared evidence.

| Check | Required observation |
|---|---|
| Camera denied | Deny camera permission. PartSnap shows Retry Camera, gallery/upload and manual lookup recovery. |
| Native gallery | Tap Upload photo, choose a photo, and cancel a later selection. The chosen evidence remains after cancellation; the picker does not loop back to a denied camera. |
| Browser gallery fallback | In the web app without a native bridge, Upload photo opens the photo/file picker. |
| Quality rejection | A poor photo gets a specific actionable reason and retains manual documentation. A rejection does not consume an AI scan. |
| Complete evidence | Capture equipment, markings/model plate and needed dimensions using a real permitted part photo set. Portrait and wide images remain fully visible in the combined sheet. |
| Verified AI request | Verify a test email, submit the completed set, and record the permission, upload, accepted request, model completion, candidate and verification stages. |
| Safe result | Readable markings support the candidate. Ambiguous fitment asks for verification rather than claiming an exact replacement. |
| Saved packet | Save/reopen the evidence packet and verify the captures and confidence/fitment checks survive. |
| Installed billing boundary | Store shells keep the approved native billing boundary; web Stripe offers are evaluated separately. |

The existing 120-case deterministic benchmark has zero image-proven cases. The current production-clean record has five PartSnap failures before AI (three camera denials, two photo-quality blocks), zero successful PartSnap results and zero model attempts. Fresh installed-device results are necessary to close that gap.

Payment transport has already been verified using actual Stripe TEST-mode payments with synthetic reserved emails and a test card, including signed provider webhooks, activation, matching billing dates, isolated storage and cancellation. No real-card charge or customer revenue was used for QA.
