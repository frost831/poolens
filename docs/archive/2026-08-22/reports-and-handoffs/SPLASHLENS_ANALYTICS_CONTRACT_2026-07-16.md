# SplashLens Aggregate Analytics Contract

Protected endpoint:

```text
GET https://app.splashlens.com/api/events?aggregate=1&days=30
Authorization: Bearer <SPLASHLENS_STATS_SECRET>
```

The response is aggregate-only and includes `observedAt`, `dataThrough`, data-quality state, 30-day metrics, product signals, evidence-backed recommendations, and caveats.

## Truthful funnel taxonomy

- Search: `manual_code_search`, a manual product lookup. It is not a website search-engine query.
- Primary action: `activation_completed`, a one-time first-value completion after a successful lookup, PartSnap result/proof action, proof report save, or Facility Assist action.
- Paid conversion: `checkout_success`, written only after a server verifies a paid Stripe Checkout Session or a signature-verified Stripe webhook accepts a recognized SplashLens checkout.
- Revenue: Stripe `amount_total` from the same server-verified paid checkout. It is gross checkout value, not recognized or net revenue.

Clicks, checkout starts, store-page visits, and local entitlement flags are not conversions.

## Current production dependency

Production currently uses direct Stripe Payment Links. Revenue remains `unavailable`, not zero, until `STRIPE_WEBHOOK_SECRET` is configured for `https://app.splashlens.com/api/stripe-webhook` or first-party verified Checkout Sessions are safely re-enabled. The aggregate response detects this state rather than publishing a false zero.
