# SplashLens Mac Handoff - Facility Mode / Persona Workflow

Date: 2026-07-09

## What changed in the web app

- Added first-open persona picker using `localStorage` key `sl_role`.
- Roles:
  - `tech`: existing PartSnap-led app flow.
  - `facility`: new Facility Mode front door.
  - `apprentice`: tech app with PartSnap Apprentice/Training path promoted.
- Added URL session overrides:
  - `https://app.splashlens.com/?mode=facility`
  - `https://app.splashlens.com/?mode=tech`
  - `https://app.splashlens.com/?mode=apprentice`
- Added QR deep links:
  - `https://app.splashlens.com/f/{facilityId}/{equipmentId?}`
  - Demo: `https://app.splashlens.com/f/demo/pump-room`
- Added demo facility config:
  - `/facilities/demo.json`
- Added printable QR sticker sheet:
  - `/facility-qr.html?facility=demo`
- Added facility event telemetry:
  - `wizard_open`
  - `lane_start`
  - `lane_complete`
  - `packet_created`
  - `call_placed`
  - `scan_used`
  - `daily_check_logged`
- Added facility summary filtering:
  - `/api/events?summary=1&facilityId=demo`

## Native wrapper update needed

Use the latest web app build and confirm the native shells allow these routes:

- `/`
- `/?mode=facility`
- `/?mode=tech`
- `/?mode=apprentice`
- `/f/demo/pump-room`
- `/facility-qr.html?facility=demo`

If the iOS or Android wrapper has an allowlist, universal-link path filter, or route fallback list, add `/f/*` and `/facilities/*.json`.

## TestFlight / Play test script

1. Fresh install or clear app storage.
2. Open app.
3. Confirm role picker appears.
4. Choose `I am responsible for a pool`.
5. Confirm Facility Mode home says `What is going on?`.
6. Confirm bottom app nav is hidden until `All tools` is tapped.
7. Tap `Contamination event`.
8. Confirm numbered steps and reopen checklist appear.
9. Tap `Escalate - send packet`.
10. Confirm packet includes `Escalate - send packet`, facility/pool/time/lane/equipment/steps/role.
11. Open `https://app.splashlens.com/f/demo/pump-room`.
12. Confirm it lands in Facility Mode and shows `Demo Aquatic Facility: Pump room pad`.
13. Open `https://app.splashlens.com/?mode=tech`.
14. Confirm this does not permanently overwrite the saved role unless user uses Switch mode and chooses a role.

## Store copy / ASO note

Add this to "What's New" or release notes:

> New Facility Assist mode for CPOs, aquatic operators, swim schools, apartments, and multi-site pools. Staff can start with daily checks, dosing, contamination events, safe visible equipment checks, manual/equipment proof, or support packets while the deeper PartSnap and field tools remain available.

## Files changed for native review

- `index.html`
- `js/app.js`
- `functions/api/events.js`
- `manifest.json`
- `_redirects`
- `facilities/demo.json`
- `facility-qr.html`

## Validation already run on Windows

- `node --check js/app.js`
- Cloudflare module syntax checked by copying `functions/api/events.js` to `.mjs` and running `node --check`.
- Mock KV API test posted `lane_start` and queried `/api/events?summary=1&facilityId=demo`.
- Playwright local UI test verified:
  - `?mode=facility` opens Facility Mode.
  - bottom tools hidden in Facility Mode.
  - contamination lane has reopen checklist.
  - support packet renders.
  - `/f/demo/pump-room` loads demo facility/equipment context.
  - QR sticker sheet renders three stickers.
