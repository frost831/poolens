# SplashLens Aha Fix Blueprint

## Product principle

The first screen after role selection should answer: **What can SplashLens finish for me right now?**

## Role homes

| Role | Dominant action | Secondary actions | Completion payoff |
|---|---|---|---|
| Service Tech | Code or PartSnap segmented choice | Dose; Service proof | Verified next step or escalation packet |
| Facility / CPO | What is happening? | Daily check; Dose | Resolve, document, or escalate |
| Counter / Distributor | Identify a walk-in part | Missing proof; Vendor packet demo | Safer handoff with callback-risk clues |
| Trainer | Start a five-minute lesson | Scenario; Apprentice review | Teachable proof-before-ordering exercise |
| Homeowner | Get a basic answer | Prepare a pro note; Safety stop | Clear result and when to call a pro |

## Implementation map

1. On direct PartSnap links, do not let #role-picker cover #scan-result. Ask role non-modally after first value and never silently assign Service Tech.
2. Trainer should render a clearly labeled DEMO TEST five-minute lesson inside #scan-result with Show answer key and Use a real part actions. Demo use must not emit a real PartSnap activation event.
3. Homeowner should open at #tab-volume with turnover inputs first and only Volume, Basics, Saved Notes, and Ask a Pro visible. Keep an explicit Pro tools escape hatch.
4. Counter should see Preview sample counter packet before camera use. The sample must clearly deny live inventory, fitment, or partner verification.
5. Service Tech should see two dominant actions above the current chip workflow: Look up a code focusing #error-search and Identify a part opening #scan-mode-parts.
6. Facility should progressively collect lane-specific readings, timestamps, symptoms, recent changes, and photo references before filling #facility-packet-text. Keep optional fields minimal so the strongest current workflow stays fast.
7. Put Change role outside Facility mode and move language/visual-step choice into first use.

## Instrumentation

Track role_selected, first_action_started, first_value_completed, result_saved, packet_shared, feedback_helpful, feedback_wrong, feedback_missing, role_changed, and optional_save_started. Tag automated tests DEMO-TEST and exclude them from production reporting.

## Real-test script

Ask the participant to use SplashLens for one real problem without coaching. Record time to first action, time to first useful answer, wrong turns, whether they can explain the value, confidence before/after, and whether the outcome gives them time or clarity back. End with: "What would make you use this on your next shift?"
