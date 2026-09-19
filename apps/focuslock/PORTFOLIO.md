# FocusLock desktop — portfolio build

Source: `C:\Users\hp\OneDrive\Desktop\new-focuslock\windows-agent` at commit
`9a13ab4`. The copy includes only the Electron renderer (`src/index.html`,
`src/index.css`, `src/renderer.js`) and its icon; the main process, preload,
Firebase configuration, credentials and Electron build output are omitted.

The original renderer is retained. `src/mock-electron.js` is the only runtime
seam: it exposes the same `window.electronAPI` method names as
`src/preload.cjs`, with deterministic, visibly demo-shaped state and a small
latency. The index script order and icon URL are adjusted for a static iframe.
`build.mjs` creates the temporary static output, which is refreshed with
`node scripts/build-apps.mjs focuslock`;
the portfolio build does not rebuild it automatically.

Changed source files: `src/index.html`, new `src/mock-electron.js`, new
`build.mjs`, and `package.json`. The copied `src/index.css` and
`src/renderer.js` remain byte-for-byte source copies.

Backend touchpoints inventoried from the source: all `window.electronAPI.*`
calls in `src/renderer.js` (`getSyncId`, `setSyncId`, `getPolicy`,
`updatePolicy`, `getTodos`, `addTodo`, `toggleTodo`, `deleteTodo`,
`startFocusSession`, `stopFocusSession`, `getFocusSession`, `getEvents`,
`getStreak`, `getUsageWeek`, `windowMinimize`, `windowClose`). No network calls
are made by the copied renderer.
