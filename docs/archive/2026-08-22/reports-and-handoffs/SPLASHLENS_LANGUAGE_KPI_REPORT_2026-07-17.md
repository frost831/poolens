# SplashLens Language KPI Report - 2026-07-17

## What Is Live

- Spanish Field Mode is live in the app.
- Canada pilot pages are live at `https://splashlens.com/ca/` and `https://splashlens.com/fr-ca/`.
- Language hub and demand pages are live at:
  - `https://splashlens.com/languages/`
  - `https://splashlens.com/pt-br/`
  - `https://splashlens.com/ht/`

## Owner Dashboard Signals To Watch

Use `https://app.splashlens.com/dashboard` with owner access.

Watch these cards and tables weekly:

- Language Opens 30d
- Spanish Opens 30d
- French Interest 30d
- Portuguese Interest 30d
- Haitian Creole 30d
- Market Opens 30d
- Canada Opens 30d
- Requested Languages
- Markets
- PartSnap Results 30d
- PartSnap Saved 30d
- Facility events and proof-save events

## Decision Rules

- Build Spanish deeper first when Spanish app opens produce PartSnap, Facility Assist, or proof-save actions.
- Build French-Canadian app localization only after Canada/French traffic produces useful actions or a partner asks for it.
- Keep Portuguese and Haitian Creole as demand capture until the dashboard shows repeated language requests plus first useful actions.
- Do not call any pilot language a full translation until the app UI, proof prompts, safety disclaimers, and customer summaries are translated and reviewed.

## Current Public Verification

- App event endpoint returns healthy public status.
- New language pages return HTTP 200.
- `sitemap.xml`, `ai.txt`, and `llms.txt` expose the language pages for search and answer engines.
- A daily heartbeat was created to recheck language and Canada dashboard signals, starting on 2026-07-18.
