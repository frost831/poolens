# SplashLens Product Intelligence

## Purpose

The intelligence layer answers four operating questions with first-party evidence:

1. Where do users reach a useful field result?
2. Where do they begin and stop?
3. What need brings them back on another day?
4. Which product or payment path should be improved next?

The goal is repeat utility, not compulsive engagement. SplashLens should earn a return visit by helping a tech continue a job, verify a part, save visit history, prepare an escalation, or see newly relevant equipment guidance.

## New session signals

- `session_started`: one event when the app session begins.
- `app_tab_view`: named tool or tab viewed.
- `tab_dwell`: bounded dwell time when the user changes tools.
- `session_heartbeat`: visible engaged time in 30-second intervals; hidden time is excluded.
- `session_ended`: bounded session duration on page exit when the browser supports it.

Existing outcome events remain the source of truth for searches, scans, PartSnap results, saved proof, feedback, checkout starts, verified payments, installs, attribution, and native opens.

## Owner dashboard decisions

- Useful-session rate: sessions reaching a meaningful product outcome.
- Return-client rate: anonymous clients observed on at least two calendar days.
- Median time to first value: session start to first useful completion.
- Started-but-stopped rate: a first action without a first-value completion.
- Proof follow-through: saved proof divided by PartSnap results. This is directional because events are not joined to an account.
- Checkout completion: server-verified successful payments divided by observed upgrade starts.
- Where time goes: accumulated tab dwell by named tool.
- What to improve next: deterministic recommendations with visible rationale and action.

## Privacy and integrity guardrails

- No raw keystroke collection.
- No blanket recording of every click.
- No session replay, camera capture, or photo retention through analytics.
- No fabricated time-saved number.
- No email-open metric treated as product usage.
- No checkout click treated as revenue.
- Anonymous client and session identifiers remain device-scoped estimates, not people or accounts.
- KV read limits can make counts lower bounds; the aggregate reports partial coverage when truncated.

## Useful return loop roadmap

Use observed evidence to prioritize these non-manipulative return reasons:

1. Continue the last field workflow.
2. Reopen saved pool, spa, or facility history.
3. Prepare the next-visit proof checklist.
4. Show newly added equipment relevant to prior searches.
5. Offer one short lesson generated from a real missed-result pattern.

Do not add punitive streaks, fake urgency, random rewards, or notification pressure. A return should produce a field outcome.
