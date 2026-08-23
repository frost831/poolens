# Mac Handoff - SplashLens Language ASO Refresh - 2026-07-17

## Goal

Refresh iOS/App Store Connect and Google Play metadata to match the live web/app positioning without requiring a native code rebuild unless screenshots or store forms require it.

## Current Web/App Truth

- App: `https://app.splashlens.com`
- Public site: `https://splashlens.com`
- Spanish app mode: `https://app.splashlens.com/?lang=es`
- Canada app tag: `https://app.splashlens.com/?market=ca`
- Language hub: `https://splashlens.com/languages/`
- Spanish pages: `https://splashlens.com/es/`
- Canada pages: `https://splashlens.com/ca/`, `https://splashlens.com/fr-ca/`
- Portuguese/Haitian Creole pages are demand-capture pilots only: `https://splashlens.com/pt-br/`, `https://splashlens.com/ht/`

## 2026-07-17 PC Build Additions Before Mac Submission

- Service Proof Passport now has a command layer at the top of Visit Report:
  - Part/code workflow
  - Facility/CPO workflow
  - Regular visit workflow
- Spanish Field Mode chips now route into Service Proof workflows instead of only jumping tabs.
- Facility Assist packets can now be saved into a Service Proof Passport draft with facility readings, symptoms, photos, outcome, and customer-safe text.
- Browser workflow smoke passed locally for:
  - Regular visit to Passport
  - Spanish proof-note flow
  - Facility daily-check packet to Passport draft

## ASO Copy Direction

Primary one-line value:

SplashLens helps pool, spa, hot tub, swim spa, and facility teams identify parts, verify proof, and finish service notes faster.

Keywords to include where the stores allow:

pool service app, pool tech app, pool part identification, PartSnap, pool equipment codes, spa troubleshooting, hot tub troubleshooting, swim spa, pool automation, pool robot troubleshooting, salt cell, pool service notes, CPO, facility pool, Spanish field mode

Short description option:

Free field reference for pool and spa pros: PartSnap parts ID, equipment code lookup, proof packets, Facility Assist, dosing math, service notes, and Spanish Field Mode.

Long description guardrails:

- Say "possible matches" and "verification notes."
- Say "does not replace manuals, labels, manufacturer guidance, code requirements, or qualified judgment."
- Do not claim manufacturer partnership, diagnosis, fitment guarantee, or official training alignment.
- Do not present Portuguese or Haitian Creole as full app languages yet.

## Suggested Store Metadata Additions

- Spanish Field Mode is live for core field workflows.
- Canada pilot supports pool, spa, hot tub, swim spa, and facility proof workflows.
- PartSnap helps create a cleaner senior-tech/vendor packet before ordering.
- Service Proof Passport helps save readings, photos, notes, and customer-safe summaries.

## Screenshot Priority

1. PartSnap possible match with missing proof.
2. Spanish Field Mode quick-start strip.
3. Facility Assist workflow.
4. Service Proof Passport.
5. Owner dashboard proof/usage signals if store rules allow owner-facing screenshots.

## Build Requirement

No native binary rebuild is required for the web-hosted language pages or dashboard tracking. Rebuild only if native store screenshots, wrapper metadata, or store submission forms require fresh assets.
