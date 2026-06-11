# SplashLens App Store Connect Submission Details

Generated: 2026-05-27

This packet is the Mac-side source of truth for the SplashLens iOS wrapper. It must stay aligned with the live PWA at:

https://app.splashlens.com/?store=ios

## Verdict

SplashLens should be submitted as a free utility/reference wrapper around the SplashLens PWA.

Do not submit paid entitlement, unlimited AI, Route Ready certificate, manufacturer endorsement, or guaranteed diagnosis claims until native billing, production metering, and certificate verification are actually built.

## Apple Lane

- App name: SplashLens Field Tools
- Subtitle: Pool tech codes and notes
- Existing ASC bundle ID used for upload: com.splashlens.app
- Suggested future/account namespace from packet: com.belowzeromedia.splashlens
- SKU: splashlens-ios-2026
- Primary category: Utilities
- Secondary category: Productivity
- Pricing: Free
- Initial purchase model: no in-app purchases
- Wrapper URL: https://app.splashlens.com/?store=ios
- Marketing URL: https://splashlens.com
- Support URL: https://splashlens.com
- Privacy URL: https://splashlens.com/privacy.html
- Age rating target: 4+

The existing App Store Connect app record is `com.splashlens.app`. The suggested `com.belowzeromedia.splashlens` bundle ID does not currently have an ASC app record, and the available ASC API key cannot create new app records. Use the existing namespace unless the account owner manually creates a new ASC app record.

## Product Promise

SplashLens is a pool-service field reference app for technicians who need fast lookup, job notes, and lightweight field tools.

Built promises:

- Error-code lookup and reference workflows.
- Chemical dosing calculators and service math.
- Service notes and report-style field records.
- Filter guides, checklists, and offline app shell after first load.
- Optional online AI scanner for equipment displays, pool parts, and test strips.

Careful promises:

- AI scans are assistance only and require verification.
- Route Ready is a pilot/planned training layer unless modules and certificate verification are present in the submitted build.
- Affiliate/search links are convenience links and must be disclosed as such.

Do not promise:

- Unlimited AI scanning.
- Completed training certificates.
- Manufacturer endorsement.
- Guaranteed diagnosis, repair, or chemical safety.
- Paid entitlement features before native billing and metering are production-ready.

## Submit Only When Verified

- App opens directly into SplashLens, not old PoolLens branding.
- Direct Stripe or web upgrade CTAs are hidden in `store=ios` mode.
- Manual lookup, calculators, notes, filters, and checklists work after first load.
- Camera permission is requested only when the user starts a scanner flow.
- Privacy and support links are reachable.
- Screenshots do not imply certificates, official manufacturer status, paid native subscription unlocks, or guaranteed diagnosis.

## Open Blockers

- App Store Connect metadata and screenshots still require manual entry.
- Paid native billing remains out of scope until StoreKit and durable entitlements are real.
- Cloudflare scanner production launch still requires production secrets and bindings: `ANTHROPIC_API_KEY`, `ENVIRONMENT=production`, `SCAN_USAGE_KV`, and `SCAN_RATE_LIMITER`.
