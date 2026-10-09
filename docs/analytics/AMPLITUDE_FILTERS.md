# SplashLens operating filters

Amplitude project: `863388`.

Create and apply the saved segment **Real users** with `traffic_class = real` to every operating funnel and product chart. Exclude `qa`, `server`, and `bot` from activation, retention, checkout-intent, and conversion rates. Keep those events available in separate diagnostics views; do not delete them.

`traffic_class` and `is_internal` are assigned at ingestion in `/api/events` and in server payment events, then forwarded to Amplitude. `checkout_click` is client intent; `checkout_click_server` is a deduplicated POST backstop; `checkout_session_created` means Stripe returned a session. None proves payment. Only verified completion and entitlement events count as paid proof.

The saved segment must be created in the Amplitude UI by an account with project access. This repository does not contain an Amplitude management credential, so the segment is a documented operating rule, not a claim that the remote segment already exists.
