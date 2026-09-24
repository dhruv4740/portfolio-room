# Fraud Detection — portfolio build

Source: `C:\Users\hp\kharghar-hacks\kharghar` at commit `31c0cd4`.

Only the frontend is copied. Root notebooks, trained Python model files and
CSV datasets are omitted; the browser uses the documented demo API seam.

The copied Vite/React source, routes, Tailwind styling and dashboard
components remain the original UI. `vite.config.ts` adds the static base path
`/apps/fraud/` and writes to `out/`; `App.tsx` gives the original
`BrowserRouter` the matching basename. The Firebase boundary in
`src/firebase/firebase.tsx` is replaced by a signed-in in-memory
`demo@example.com` user, and the direct auth imports in `App.tsx`,
`components/AuthGuard.tsx`, `components/GoogleLoginButton.tsx`,
`components/Navbar.tsx`, `pages/Login.tsx` and `pages/Profile.tsx` use that
same seam. `src/services/api.ts` replaces the axios call to
`localhost:5000/predict_fraud` with a delayed deterministic `DEMO DATA` result.

Changed source files: `src/App.tsx`, `src/firebase/firebase.tsx`,
`src/services/api.ts`, `src/components/AuthGuard.tsx`,
`src/components/GoogleLoginButton.tsx`, `src/components/Navbar.tsx`,
`src/pages/Login.tsx`, `src/pages/Profile.tsx`, `src/pages/Dashboard.tsx`,
`src/pages/Landing.tsx`, `src/pages/Signup.tsx`, `vite.config.ts`, and
`package.json`. The three page files near the end only remove unused imports or
an unused setter required by the copied repo's strict TypeScript build; their
rendered UI is unchanged.

Backend touchpoints inventoried from the source: Firebase initialization and
auth state in `src/firebase/firebase.tsx`, `src/components/AuthGuard.tsx`,
`src/components/GoogleLoginButton.tsx`, `src/components/Navbar.tsx`,
`src/pages/Login.tsx` and `src/pages/Profile.tsx`; the axios request in
`src/services/api.ts`. No Firebase SDK or axios import remains in the static
bundle. The untouched CSV uploader still parses user-selected local CSV files.

Portfolio-only behaviour change: the landing page's "Start Free Trial" button
had no handler in the source; it now navigates to `/dashboard` (the demo user
is already signed in), so a visitor reaches the working demo from the hero.
`index.html`'s `<title>` is "Fraud Detection" instead of the template's
"Vite + React + TS" (it is the tab and window title).

Refresh the committed static export manually with
`node scripts/build-apps.mjs fraud`; the portfolio build does not run this
toolchain automatically.
