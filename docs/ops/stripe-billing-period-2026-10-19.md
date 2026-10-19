# Stripe billing period correction, 2026-10-19

An actual Stripe TEST checkout for $19/month completed on the dedicated Preview. The Stripe subscription carried its billing period on `items.data[0].current_period_end` (November 19), while the webhook saved the one-year scanner token expiry into `commercial_entitlements.current_period_end`. Checkout recovery retained that incorrect value because its conflict update preferred the existing date.

The webhook now stores a billing period only when supplied by Stripe, reads subscription-item dates as well as legacy subscription dates and invoice line periods, and preserves a known period through later checkout webhooks that omit it. Verified checkout recovery replaces an existing incorrect date with the period returned by Stripe. Crew checkout and billing use the same date reader. Scanner token lifetime and lifecycle revocation policy are unchanged.

Two new regression tests failed before the fix and pass afterward: monthly checkout date repair and modern subscription-item dates with reversed webhook ordering. The complete local suite passes 371/371 with browser tests enabled and zero skips. The metadata benchmark passes 120 cases, with zero image-proven cases.

The real TEST transaction used a reserved synthetic email and Stripe's test card. Payment, signed provider webhook, activation and Preview-only storage were verified; it is not customer revenue or real-device PartSnap proof. The test subscription was canceled afterward.
