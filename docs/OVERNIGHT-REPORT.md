# Overnight report (2026-10-08)

Rollback point: production deployment 15116623 (deck v2 live). Preview alias: preview.dhruvkothari.pages.dev.

## Done
- Launchpad trimmed to 5 buttons, pill hidden while launchpad open, landscape launchpad fits (verify-v3 45/45, verify-tour, verify-after-hours 26/26).
- SEO copy, JSON-LD, robots.txt.

- Entry redesign: launchpad is 2 choices (Resume & work primary, Try live apps secondary) + muted row; tour shortcut is now key 4.
- /work project cards have preview thumbnails (verify-recruiter 22/22, no horizontal scroll at 390 px).
- public/_headers: immutable assets, 7-day models/previews. Live on preview alias (checked with curl).
- verify-after-hours-audio: 33/35. The two lifecycle failures also occur on commit 41db62c, so they predate tonight's changes.

- Deck: single route to /work (FULL DETAILS). The orange primary opens the PDF; flip it to /work if preferred.
- /work: opaque sticky bar, heading scroll margin (heading was bleeding through).
- verify-tour needs GPU=1 (passes). verify-v3 45/45, verify-recruiter 22/22 on preview and production.
- PROMOTED to production: deployment 5bb077dd (commit 0399d1a label). Rollback: 15116623.

- /work restyle: alternating section bands, numbered section heads, one spacing rhythm, card internals regapped, opaque full-bleed sticky bar.
- Back-to-room speed: /work idle-prefetches the room (Scan + three chunks, 4 GLBs) 8 s after load, only on 4g, not saveData, not coarse pointer, tab visible; hover on the back button triggers it at once. 0 long tasks in the window; return trip loads them with 0 transfer from cache. Hands are not prefetched. Not C (no SPA merge).

## Not done
- Model/texture compression and cold-load re-measure: remaining non-hand GLBs total ~2.8 MB, now cached 7 days; skipped as low gain vs. visual risk.
- Seated touch look-around in landscape: still UNVERIFIED.
- Open: Fact or Cap naming on the CrisisWatch card, empty dk-dev Pages project, URL stays pages.dev, dead aboutOpen panel code in Scan.jsx.
