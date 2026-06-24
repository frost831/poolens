# SplashLens Flagship Wishlist Status - 2026-06-24

## Built And In The Web App

- PartSnap AI Service: possible manufacturer/component/model clues, visible evidence, missing proof, conservative confidence language, and verification search terms.
- Second Proof Photo workflow: prompts the tech to capture label, model plate, molded number, wiring label, or wider equipment context before ordering.
- Service Proof Passport: PartSnap and Route Brain results can be saved into the local pool/visit history.
- Senior Tech / Vendor Packet: creates a cleaner escalation packet from observed evidence and missing proof.
- Callback Risk Score: flags low, medium, and high callback risk based on confidence and missing evidence.
- Apprentice Mode: turns a PartSnap result into a training prompt with an answer key.
- Mystery Part Lab / feedback path: low-confidence results can be submitted as training candidates.
- Route Brain: equipment-tree intake, symptom matching, field checks, escalation notes, what changed since last visit, quick quote prep, and proof save.
- Voice notes: browser speech dictation buttons are present on report, pool, customer follow-up, and Route Brain note fields where supported by the device/browser.
- Owner usage dashboard API: event summaries include first opens, scanner use, PartSnap use, installs/download style events, apprentice starts, and Route Brain proof saves.
- Partner page and partner-ready cards: education, vendor counter, manufacturer, and training routes are positioned without implying endorsement.

## Added In This Pass

- PartSnap mystery-part submissions now return and display a ticket id.
- The app saves the last 25 PartSnap review tickets on the device.
- Failed mystery-part sends now create a local ticket marked `needs manual email` instead of disappearing.
- PartSnap ticket submissions include the ticket id in owner alert emails.
- Scan toolbar and camera action labels were cleaned to stable text so damaged icon encoding does not show on mobile.
- The public PartSnap page now markets the current feature set: Callback Risk Score, Service Proof Passport, Mystery Part Review Queue, Apprentice Mode, and senior-tech/vendor packets.
- Marketing-site schema now exposes the current PartSnap feature set for crawler/AEO surfaces.

## Still Externally Gated

- Real manufacturer-verified part fitment: requires OEM documentation rights, manufacturer cooperation, or a licensed parts-data source.
- Live vendor stock and pricing: requires integrations with distributors or parts vendors.
- Partner-verified cards: require actual partner approval before using verified language.
- Sponsored banner controls and reporting: require ad policy, partner inventory, placement rules, and billing/reporting agreement.
- Native iOS speech transcription: the web app has browser speech support; native wrapper speech still needs a Mac/Xcode build.
- Native store billing parity: web Stripe and native in-app purchase/store submission are separate release gates.
- App Store / Google Play approval: cannot be marked complete until each store accepts the submitted build.

## Product Positioning

SplashLens should lead with this:

> Built to get pool techs off the pad faster, with better proof and less guessing.

PartSnap is the flagship wedge. The strongest claim is not "guaranteed AI part ID." The stronger, safer, more defensible claim is:

> Photo the mystery part, capture proof, see possible matches, know what is missing, save the evidence, and escalate cleaner before ordering.

## Next Mac / Store Handoff

- Update iOS screenshots and metadata to show PartSnap tickets, Callback Risk Score, Service Proof Passport, and Apprentice Mode.
- Confirm iOS webview camera, microphone fallback, local storage, and app-store badge links.
- Submit the refreshed iOS build/metadata through App Store Connect from the Mac.
- Refresh Google Play screenshots and release notes from this web build before production submission.
