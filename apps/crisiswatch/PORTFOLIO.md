# CrisisWatch / Fact or Cap — portfolio build

Source: `C:\Users\hp\AppData\Local\Temp\resume-audit\crisiswatch-web` at
commit `330509f`.

The unused `live-demo-backup.txt` source backup is omitted.

Changed source files: `app/layout.tsx`, `app/providers.tsx`, `tailwind.config.ts`,
`app/api/check/route.ts` (removed), `app/api/check/stream/route.ts` (removed),
`app/api/trending/route.ts` (removed), `next.config.js`, and `package.json`.

The original Next.js page, components, animations and styling are copied as
authored. The following source changes make the renderer static: `app/layout.tsx`
restores the original Inter and Space Grotesk typography through an allowed
runtime Google Fonts stylesheet, while `tailwind.config.ts` gives each font
family explicit sans-serif fallbacks; `next.config.js` enables the static export
under `/apps/crisiswatch`, and the three `app/api/**` route handlers are removed.
`app/providers.tsx` is the narrow mock seam. It intercepts only this app's
`/api/check` and `/api/trending` browser requests and supplies deterministic
`DEMO DATA`; it also provides the same SSE event sequence expected by the live
demo. The POST fixture keeps the original percentage confidence contract, while
the synthetic SSE payload uses the source API's 0–1 scale before the copied
client's existing normalization. A small fake latency keeps the original
loading and progress states visible.

Backend touchpoints inventoried: `app/components/sections/live-demo.tsx`
calls `GET/POST /api/check` and `EventSource /api/check/stream`; that component
also reads the resulting SSE step/source/complete payloads. `app/components/
sections/trending.tsx` calls `GET /api/trending`. The removed server routes
proxied `BACKEND_URL` and are replaced by the browser seam. Unsplash image URLs
remain in the original UI and therefore require network access when those
sections are reached; the first screen does not depend on them.

Refresh the committed static export manually with
`node scripts/build-apps.mjs crisiswatch`; the portfolio build does not run the
Next toolchain automatically.

The OS entry applies a `1.25` iframe zoom because the authored live demo uses
10–11px utility labels; this brings them above the monitor readability floor
while keeping the page's responsive max-width layout intact.
