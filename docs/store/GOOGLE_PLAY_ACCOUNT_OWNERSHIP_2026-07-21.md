# Google Play Account Ownership - 2026-07-21

## Production Account

- Developer account: `ThrottleShare`
- Account type: Organization
- Account ID: `7017771963942604688`
- Google login used to access it: `hello@throttleshare.com`
- Production SplashLens package: `com.splashlens.fieldtools`
- Console status observed: Production
- Console app ID: `4974110437390812521`

All future SplashLens Android releases must be uploaded to this app record.

## Obsolete Record

- Developer account: `warmsnowman831`
- Account type: Personal
- Account ID: `6282350079091140184`
- Obsolete package: `com.splashlens.app`
- Console status observed: Closed testing
- Installed audience observed: `0`
- Console app ID: `4974408849765183344`

This is not the public SplashLens Android package. Do not upload `com.splashlens.fieldtools` artifacts to this record. Do not transfer this obsolete shell into ThrottleShare unless there is a specific business reason to preserve the separate package; transferring it would leave two SplashLens records in the organization account.

## Release Gate

Before every Play upload, confirm all three values:

1. Developer account heading is `ThrottleShare`.
2. Account ID is `7017771963942604688`.
3. Package is `com.splashlens.fieldtools`.
