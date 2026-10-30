# SplashLens XSS hardening — October 29, 2026

Base: `origin/master` at `93a5ad3ebed24ff7a08859e05924a8c0b1753c1a`. Branch: `codex/splashlens-xss-hardening-20261029`. Review and approval are required before merge; this change has not been deployed.

## Reported high and medium risks

| Reported path | Change | Regression evidence |
|---|---|---|
| `showCaptureWithManualEntry` | Encode OCR/AI text with `escHtml` in text and `escAttr` in the input value. | Hostile markup and quotes round-trip as text and input values in desktop/mobile Chromium. |
| AI error-code result | Extract `renderAIErrorCodeResult`; escape brand, model, joined codes and context. The manual-edit button holds `data-code`; a fixed listener passes the decoded string to the editor. | All hostile fields remain inert; clicking Edit restores the exact original code without executing it. |
| `renderStripResult` | Escape notes, disclaimer and confidence. Convert nonblank string/number readings with `Number`, rejecting non-finite and nonnumeric values as missing rather than marking them in range. | Injection payloads create no elements; valid numeric text still renders and gets the correct range status. |
| `renderPartSnapCorpusPanel` | Filter sources through `safeUrl` before limiting the displayed links. Only absolute HTTPS survives. Candidate ID and source tier are escaped attributes read by a fixed listener. | JavaScript, data, HTTP, relative and malformed URLs are rejected. Valid source clicks preserve the exact decoded IDs and tracking event. |
| `scanChemSearch` | Escape the query in the no-results message. | Hostile queries display as text. |

## Helpers and event boundaries

`escHtml` encodes `& < > " '`. `escAttr` uses that encoder and also encodes backslash. Neither helper is a URL validator or a JavaScript-string encoder. `safeUrl` separately requires an absolute HTTPS URL and rejects control characters, backslashes, malformed URLs and other schemes. External source/review/proof links use the URL policy; deterministic internal checkout and affiliate routes remain internal routes and are attribute-encoded.

The change removes 88 data-bearing inline event attributes from `js/app.js`. Role actions, pools, route jobs, feedback, training, saved PartSnap stops, copying, verification, closing proof and other affected controls now use escaped data attributes and a delegated listener with explicit fixed action cases. The listener never evaluates data, calls a method named by arbitrary input, or constructs executable code. Numeric action arguments are converted with `Number`. Focusout and change actions retain their prior save/update behavior. Nested checkbox controls dispatch once.

Checkout capture previously inferred attribution by reading inline handler source. It now reads `data-checkout-intent` (`post-value`, `account`, `standard`) instead. Existing capture-phase store restrictions and middle-click handling remain in place. A full-app browser regression verifies that a deliberate post-value click invokes checkout once and records its attribution once. No checkout requests, charges or production writes are performed by the fixture.

## Stored-value cleanup and audit-file limitation

The referenced `RUFLO_XSS_AUDIT.md` was not present in the supplied attachments, current repository, inspected history paths, or the searched local file locations. Its numbered items 6–19 therefore cannot be matched to their exact descriptions until the file is supplied. This change independently hardens the affected stored-value surfaces found in `js/app.js`:

- Pool selection, report-pool selection and pool-list IDs.
- Pool detail edit/delete/report/history actions and generated element IDs.
- Equipment form, equipment decision, reminder form and chemistry form IDs, labels and actions.
- Pool edit volume and filter-diameter input values.
- Stored history dates, summaries and chemistry readings.
- Stored SLAM tracker targets, last/recent FC values and dusk readings (finite numeric conversion; malformed values display as missing).
- Service-passport history IDs and attributes.
- Route job pool IDs and numeric job actions.
- Saved PartSnap stop IDs/actions and saved-pool options.
- Route Brain options and form attributes.
- Guided PartSnap dimension text, encoded once to preserve quotes and backslashes.

The full-app test additionally reproduced stored XSS in pool type/sanitizer summaries and the latest-service date; both now use text encoding. The test seeds imported hostile data in localStorage, then exercises actual delegated notes, edit/save, equipment, chemistry and reminder actions with the same opaque ID. Reviewers should compare this coverage with the missing audit's exact numbered list when it becomes available.

## Verification

- Initial targeted regressions reproduced the unsafe paths before the fixes. The stored-pool summary/date browser regression also failed before its text-encoding repair.
- `npm test` with the existing Playwright runtime enabled: **404 passed, 0 failed, 0 skipped**. This includes 14 XSS regression tests, three of which use Chromium (desktop fragment, phone fragment, full app).
- `npm run partsnap:benchmark`: **120/120 metadata cases pass**, zero image-proven cases; this is unrelated to real-photo recognition accuracy.
- `node --check js/app.js` and `git diff --check`: pass.
- `tools/deploy-poolens-web.ps1 -StageOnly`: **35 public files**, no upload. App and worker query versions are synchronized at `20261029-xss-hardening`; offline cache is `splashlens-v59-xss-hardening`.
- Required Git health/fetch check: 18 registered repositories passed. Existing untracked Python caches are preserved and excluded.

Browser coverage uses `SPLASHLENS_PLAYWRIGHT_PATH` as the existing test suite does. On this PC it points to the bundled runtime's `playwright/index.mjs`. If that variable is absent, the ordinary suite skips the two existing browser checks plus the three new browser checks; do not equate that result with the zero-skip local run reported above. Inspect the PR's fresh provider checks separately.
