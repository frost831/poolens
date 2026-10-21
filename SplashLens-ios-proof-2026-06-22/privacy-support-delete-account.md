# Privacy, Support, And Delete Account Notes - June 22, 2026

## URLs In Metadata

- Privacy URL: `https://splashlens.com/privacy.html`
- Support URL: `https://splashlens.com`
- Marketing URL: `https://splashlens.com`

## Account Requirement

No account is required for core use in the iOS wrapper. Core tools include manual lookup, dosing, reports, filters, checklists, and Route Brain after first load.

## Optional Online Features

PartSnap and other AI scanner features are optional, user-initiated online features. Camera/photo access is requested only when the user starts a scanner workflow. Scanner input may be sent to the online scan endpoint for reference assistance.

The mystery-part feedback path is optional and intended to collect low-confidence training candidates.

## Delete Account / Data Handling

Because the iOS wrapper does not require account creation for core use, there is no in-app account to delete in the core reviewer path. A user can remove local app/browser-wrapper data by deleting the app from the device.

For any submitted support, feedback, or scanner-related data tied to a user request, the support path should direct the user through `https://splashlens.com` or the privacy page at `https://splashlens.com/privacy.html`.

## Permissions

- Camera: requested only when scanner mode starts.
- Photo library: only for user-selected scanner assistance.
- Microphone: intended only for dictated service notes where supported.

The captured proof includes camera permission on scanner start. Microphone prompt was not triggered because dictated service notes were not used during this smoke pass.
