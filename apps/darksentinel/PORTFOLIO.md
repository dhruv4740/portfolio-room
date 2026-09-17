# DarkSentinel UI — portfolio build

Source: `C:\Users\hp\OneDrive\Documents\demo_website\darksentinel-ui` at commit
`d5821bf`, copied without `node_modules`, `.next`, `.git` and `.env*`.

Changed for the portfolio (everything else is the original UI):
- `app/api/**` and `lib/server-threat-data.ts` removed: route handlers cannot
  exist in a static export.
- `lib/api.ts`: `bff` now answers every request from `lib/mock/router.ts`
  (fixtures in `lib/mock/data.ts`, all visibly DEMO DATA). `EventSource` for
  the pipeline page is shimmed there too.
- `next.config.mjs`: `output: "export"`, `basePath` and `assetPrefix`
  `/apps/darksentinel`, `trailingSlash`, unoptimized images.
- `app/threats/[hash]/page.tsx`: `generateStaticParams` over the fixture hashes.

Build: `npm install && npm run build` here writes `out/`. At the repo root,
`node scripts/build-apps.mjs darksentinel` runs that and copies `out/` to
`public/apps/darksentinel/`, which is committed so the portfolio's own
`npm run build` needs no Next toolchain.
