# SplashLens Full Analytics Pull - 2026-08-07

## What was wired

- Added a protected first-party app usage pull endpoint at `/api/usage-pull`.
- Protected it with `SPLASHLENS_PULL_SECRET`, with fallback support for the existing `SPLASHLENS_STATS_SECRET`.
- Deployed the endpoint to Cloudflare Pages production for `app.splashlens.com`.
- Verified unauthenticated requests return JSON `401 Unauthorized`.
- Pulled the full 35-day app KV window with authentication.
- Pulled site D1 event, daily, and partner-intake snapshots from `splashlens-subscribers`.

## Current Amplitude state

Amplitude forwarding code already exists and is ready for server-side HTTP V2 forwarding, but production is not fully wired because no Amplitude key is present.

Live app status:

- `storageConfigured`: true
- `emailConfigured`: true
- `amplitudeConfigured`: false

Missing accepted env names:

- `AMPLITUDE_API_KEY`
- or `SPLASHLENS_AMPLITUDE_API_KEY`

Do not claim Amplitude is live until one of those is added to Cloudflare and `/api/events` returns `amplitudeConfigured:true`.

## Raw artifacts saved

- `docs/SPLASHLENS_APP_USAGE_PULL_LIVE_2026-08-07.json`
- `docs/SPLASHLENS_SITE_EVENTS_TOP_2026-08-07.json`
- `docs/SPLASHLENS_SITE_EVENTS_DAILY_2026-08-07.json`
- `docs/SPLASHLENS_SITE_PARTNER_INTAKE_2026-08-07.json`

## App usage pull

Window: 35 days  
Generated: 2026-08-07T15:15:39.550Z

| Metric | Count |
| --- | ---: |
| KV keys found | 26,445 |
| KV keys read | 26,445 |
| Parsed records | 26,445 |
| Real records | 6,319 |
| Synthetic/test records | 20,126 |
| Truncated | false |

The app has real usage, but historical QA/test traffic is still a large part of the dataset. Any founder or buyer report should lead with the `realCount` view, not total events.

## Real app funnel signals

Top real events:

| Event | Count |
| --- | ---: |
| `session_heartbeat` | 4,338 |
| `app_tab_click` | 228 |
| `app_open` | 217 |
| `first_app_open` | 167 |
| `role_picker_first_open` | 134 |
| `app_tab_view` | 133 |
| `language_mode_open` | 111 |
| `role_selected` | 104 |
| `native_shell_open` | 86 |
| `session_started` | 69 |
| `native_shell_first_open` | 66 |
| `article_referral_open` | 62 |
| `pwa_standalone_open` | 60 |
| `pwa_install_prompt_seen` | 57 |
| `first_value_completed` | 34 |
| `field_learning_os_lesson_generated` | 31 |
| `manual_code_search` | 28 |
| `field_feedback_prompt_shown` | 25 |
| `partsnap_apprentice_started` | 22 |
| `ai_scan_started` | 21 |
| `partsnap_result` | 21 |

Meaningful workflow counts:

| Workflow | Signal | Count |
| --- | --- | ---: |
| PartSnap | `partsnap_apprentice_started` | 22 |
| PartSnap | `partsnap_result` | 21 |
| PartSnap | `partsnap_direct_entry` | 2 |
| Facility Assist | `operator_pilot_wizard_opened` | 2 |
| Facility Assist | `facility_workflow_completed` | 2 |
| Feedback | `field_feedback_prompt_shown` | 25 |
| Feedback | `field_feedback_quick_answered` | 12 |
| Feedback | `field_feedback_submitted` | 3 |
| Checkout | `checkout_click` | 4 |

## Store/app source signals

Top app sources:

| Source | Count |
| --- | ---: |
| `com.splashlens.fieldtools` | 4,236 |
| `app` | 1,514 |
| `splashlens.com` | 161 |
| `named_pilot` | 117 |
| `field_learning_os` | 94 |
| `bing.com` | 34 |
| `com.splashlens.app` | 15 |

Top paths:

| Path | Count |
| --- | ---: |
| `/?store=android` | 4,251 |
| `/?store=ios` | 801 |
| `/` | 699 |
| `/?store=ios&tab=scan` | 103 |
| `/?tab=errors...named_pilot...` | 78 |
| `/?store=android&tab=scan` | 48 |
| `/facility-qr.html?store=ios` | 21 |
| `/?tab=route` | 17 |
| `/?mode=facility...` | 16 |
| `/?tab=scan` | 13 |

## Site funnel pull

Top site events:

| Event | Source | Path | Count |
| --- | --- | --- | ---: |
| `site_page_view` | `site` | `/` | 386 |
| `open_app_click` | `site` | `/` | 5 |
| `persona_fork_click` | `site` | `/` | 4 |
| `partsnap_click` | `site` | `/` | 3 |
| `app_store_download_click` | `site` | `/` | 2 |
| `press_coverage_click` | `site` | `/` | 2 |

Partner/facility intake:

| Lane | Source | Count | Last seen |
| --- | --- | ---: | --- |
| `Field Proof Pilot - Demo` | `field-proof-pilot-smoke` | 1 | 2026-08-07T13:46:47.027Z |

## Readout

What is working:

- App event storage is working.
- Email/event endpoint is live.
- Native/PWA opens are being recorded.
- Role picker, language mode, manual search, PartSnap, Facility Assist, Field Learning OS, and feedback prompts are firing.
- The protected pull endpoint now gives a repeatable founder-side report path.

What is weak:

- Site-to-app conversion is soft: homepage views are much higher than app-open, PartSnap, and store-click events.
- Checkout activity is tiny: four checkout clicks in the pulled window, and those need to be interpreted carefully against QA/source context.
- Known-user attribution is effectively absent in the pull. We can see behavior, but most app sessions are anonymous.
- Feedback is being prompted but not yet producing enough written field intelligence.
- Amplitude is not live until the API key is added.

## Growth plan

1. Put the 60-second Field Challenge above the fold on the website and in the first app screen.
2. Force every outreach link into a tracked mode: `utm_source`, `utm_campaign`, `lead_id`, and `challenge=field60`.
3. Add a gentle identity capture after the first useful workflow: "Want the result saved or sent to you?"
4. Make PartSnap the default challenge path for techs and counter/distributor contacts.
5. Make Facility Assist the default challenge path for trainers, CPOs, schools, aquatic centers, and Tim/Aquatic Council discussions.
6. Treat lookup as free and push paid value only after proof is created: saved history, customer summary, vendor packet, team dashboard.
7. Clean old QA-heavy analytics out of public-facing summaries. Keep raw data, but report real usage separately.
8. Add the Amplitude key in Cloudflare, then verify `/api/events` returns `amplitudeConfigured:true`.

## North Star

SplashLens should become the field proof layer for pool and spa work:

- identify the part,
- explain what proof is still missing,
- save the visit,
- create a customer-safe summary,
- create a senior-tech/vendor packet,
- turn repeated misses into field lessons,
- and show owners what techs are actually using.

The immediate growth blocker is not more broad awareness. It is converting attention into one completed field workflow and one known feedback signal per user.
