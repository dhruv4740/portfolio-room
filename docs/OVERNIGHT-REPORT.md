# Overnight report (2026-10-08)

Rollback point: production deployment 15116623 (deck v2 live). Preview alias: preview.dhruvkothari.pages.dev.

## Done
- Launchpad trimmed to 5 buttons, pill hidden while launchpad open, landscape launchpad fits (verify-v3 45/45, verify-tour, verify-after-hours 26/26).
- SEO copy, JSON-LD, robots.txt.

- Entry redesign: launchpad is 2 choices (Resume & work primary, Try live apps secondary) + muted row; tour shortcut is now key 4.
- /work project cards have preview thumbnails (verify-recruiter 22/22, no horizontal scroll at 390 px).
- public/_headers: immutable assets, 7-day models/previews. Live on preview alias (checked with curl).
- verify-after-hours-audio: 33/35. The two lifecycle failures also occur on commit 41db62c, so they predate tonight's changes.

## In progress
- Pill coverage audit, cold-load measurement and model compression, seated touch look-around check, Haiku live-URL pass, then promote to production.
