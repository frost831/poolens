# OCR / Copy Risk Review - June 22, 2026

## Metadata Source

The App Store copy source files are under:

- `app-store-connect/metadata/en-US/name.txt`
- `app-store-connect/metadata/en-US/subtitle.txt`
- `app-store-connect/metadata/en-US/promotional_text.txt`
- `app-store-connect/metadata/en-US/description.txt`
- `app-store-connect/metadata/en-US/keywords.txt`
- `app-store-connect/review_notes.txt`

The metadata and review notes avoid the blocked claim categories called out in the handoff:

- No guaranteed diagnosis claim.
- No guaranteed part-fit claim.
- No official manufacturer endorsement claim.
- No completed training certificate claim.
- No native paid unlimited AI scanning claim.
- No direct Stripe checkout claim inside the iOS wrapper.

`app-store-connect/metadata/en-US/description.txt` explicitly says SplashLens does not guarantee diagnosis, repair, chemical safety, manufacturer support, or training certification.

## Visible Copy To Watch

The latest live production browser audit did not show the older visible "PartSnap Pro is the paid web scanner upgrade" home copy. The current home screen is PartSnap-forward but free-core in store mode:

- `Find the part. Fix the stop.`
- `PartSnap Parts ID`
- `Photo the part. Then photo the label.`
- `Verify before buying.`

Store-mode More panel audit also showed no Stripe, checkout, buy-now, subscribe-now, payment-link, or card-required CTA.

## Store Wrapper Billing Behavior

Relevant implementation notes:

- `js/app.js` defines web checkout links for non-store web mode.
- `js/app.js` checks store shell mode via the `store=ios` query parameter.
- In store shell mode, the scan limit modal says the store build is free-core while native billing is finalized and offers "Use Manual Lookup" instead of web checkout links.

Latest live store-mode QA screenshots did not show direct Stripe/web-subscription CTAs. Fresh physical iPhone screenshots are still required before App Review submission.

## Result Language

The captured PartSnap result uses conservative language:

- `PART NOT IDENTIFIED - TRY CLOSER`
- `Unknown`
- `Verify model/serial and dimensions before ordering.`
- `Hold buying links until proof improves.`
- `Submit Mystery`

Because the simulator camera could not show a real part, the captured PartSnap result does not prove a high-quality possible-match example or alternates. It does prove the app avoids overclaiming when confidence is low.

## Source Comment Note

`js/errors.js` includes a source-code comment mentioning official service manuals and tech bulletins. That is not visible App Store copy, but it should not be turned into public copy unless source rights and wording are reviewed.
