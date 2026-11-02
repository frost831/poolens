# Public claims audit — 2026-11-02

Read-only review of user-facing SplashLens copy. No marketing text was changed.

Checked:

- Live pages fetched on 2026-11-02: `https://splashlens.com/`, `https://app.splashlens.com/llms.txt`, `https://app.splashlens.com/manifest.json`, the App Store URL linked from the homepage, the Google Play URL linked from the homepage, and the PoolPro article linked from the homepage.
- App repo `frost831/poolens` at `213a42b` (master after PR #84): `index.html`, `landing.html`, `llms.txt`, `manifest.json`, `privacy.html`, `js/i18n.js`, `js/data.js` pricing strings, `js/app.js` pricing answer, `functions/api/checkout.js` price labels, and the store-metadata drafts under `aso/` and `app-store-connect/`.
- Site repo `frost831/poolens-site` (read-only clone, not modified): public HTML, especially `index.html`, `paid-media.html`, `verified-field-network.html`, `llms.txt`, and blog calls to action. Internal `docs/` and outreach drafts were not treated as live pages.

This pass did not call Stripe, did not open store consoles, and did not edit either site.

## Findings that are unproven

### 1. "230+" field entries, published as a fact

The live homepage stat strip says **230+ / Field Reference Entries**. The same number is in the homepage comparison table as "Yes 230+ current entries", on `paid-media.html` ("230+ current troubleshooting entries"), in the live app file `https://app.splashlens.com/llms.txt`, in `llms.txt` in the app repo, and in the installed manifest shortcut ("Search 230+ pool and spa field reference entries"). The homepage fetched on 2026-11-02 matches `poolens-site` `index.html` for this strip.

Nothing in either repo generates that number from a reviewed inventory. The app's own store draft, `aso/2026-10-growth-listing-drafts.md`, says this version omits the brief's unverified 230+ app-code count. A mechanical count of `code:"..."` keys in `js/errors.js` is 246, and that file also contains unverified-family notes. A raw key count is not a published census, and it does not show that every entry is current. Older site notes still talk about 180+ as the previous public figure. The live stat should stay unpublished until a dated count defines what an "entry" is and which records are current.

### 2. "Core Tools Forever"

The same homepage stat strip says **Free / Core Tools Forever**. That is a promise about future price and availability. The nearby FAQ is more careful ("free to start", "stay free to start") and names paid lanes. No terms passage next to the stat locks core tools as free forever. This is an unproven guarantee.

### 3. Accuracy claims for SplashLens dosing

These public posts say SplashLens chemistry math is accurate, without a study, tolerance, or comparison set:

| Page | Claim |
| --- | --- |
| `blog/variable-speed-pump-mandate.html` | "SplashLens: accurate chemistry calculations at every stop" |
| `blog/pool-stabilizer-myths.html` | "accurate chemistry, free and offline" |
| `blog/pool-water-conservation.html` | "SplashLens accurate chemistry calculations help you get it right the first time" |
| `blog/pool-industry-certifications-worth-it.html` | "accurate chemistry calculations at every stop" and "chemistry accuracy demonstrates it" |
| `blog/pentair-intellicenter-update.html` | "accurate chemistry reference at every stop" |
| `blog/how-to-read-pool-test-strips.html` | "accurate chemical dose calculations" |
| `blog/ai-in-pool-service.html` | "accurate chemistry calculations in tools like SplashLens" and "just accurate chemistry" |
| `blog/best-pool-test-kits-2026.html` | "accurate chemical dosing" and "accurate chemical dose calculations" |

`js/data.js` labels the factors as Pool Math formulas and marks at least one pH note as approximate. There is no public accuracy percentage, and this audit did not find one on the homepage. The blog lines above are still accuracy claims.

`blog/pool-industry-labor-shortage.html` says accurate dosing tools cut callback time. That sentence is about the category, not a SplashLens measurement. It is weaker than the lines in the table, and it is still an outcome claim with no SplashLens result attached.

### 4. "Every major brand" and "first 200 techs" in the app repo

`landing.html` in the app repo says "Error codes for every major brand" in the meta description and the hero, and "First 200 techs on the list get early access". "Every major brand" is an absolute coverage claim with no brand list or gap list beside it. The "first 200" line states a cohort size and a list that this audit could not find. This file is app-repo copy; this pass did not confirm that `landing.html` is the page currently served at `app.splashlens.com`.

### 5. Competitor prices on the homepage comparison

`poolens-site` `index.html` compares SplashLens with unnamed products at "$1-2/pool/mo", "$55/tech/mo", and "$69+/mo", and marks SplashLens dosing as "Yes Full" against "Basic" and "Yes Auto-dose". Those figures and grades have no source, date, or product name in the table. They read as current market facts.

### 6. "300+ articles" in the app llms file

Live `https://app.splashlens.com/llms.txt` says the marketing site has a "blog (300+ articles)". `poolens-site/blog/` contains 303 HTML files and no separate article index. That file count can clear 300, but the sentence is not an audited count of published articles. The site's own `llms.txt` does not use this sentence.

## What this pass did not treat as an unproven boast

- No "trusted by", customer logo wall, star rating, or user-count claim showed up on the live homepage.
- The only "guarantee" sentence on that homepage is a limit: "PartSnap does not guarantee a seller or fit." Store drafts in the app repo also say SplashLens does not guarantee diagnosis, repair, or fit. Many equipment pages end with the same kind of disclaimer.
- "App Store Live" and "Google Play Live" match store URLs that returned HTTP 200 on 2026-11-02 (`id6763644905` and `com.splashlens.fieldtools`). This pass did not read the store listing text itself.
- The PoolPro launch URL linked from the homepage returned HTTP 200. The two AQUA URLs returned HTTP 403 to this client, so those two "Published by" links were not re-read here. The strip is a coverage line, not a customer endorsement.
- Homepage offline copy is qualified ("after an initial online load", "can work"). The app manifest is shorter: "Manual tools work offline", without the first-load limit. That shorter line is the one to tighten if copy is edited later.
- Public prices agree across the live FAQ, `js/data.js`, `js/app.js`, and `functions/api/checkout.js`: Pro $19/month or $149/year, Closing Pro $29 once for 60 days, Crew $39/month for one lead and up to 3 techs, Teams $49-79. Stripe was not queried. `BUSINESS_CASE.md` still describes older targets ($29/month Pro, 500+ codes). That file is not the live homepage, and it should not be copied into public pages.
- `verified-field-network.html` calls the network a moonshot and says a card is marked verified only after a partner supplies and approves the language. The word "Verified" in the title can still be read as a program that already exists. The page text is more careful than the title.

## Not found

No public accuracy percentage for SplashLens, no "trusted by" line, and no "500+" count on the live homepage. The risky public lines are the 230+ stat, "Core Tools Forever", the blog accuracy CTAs, the landing-page absolutes, and the unsourced comparison prices.
