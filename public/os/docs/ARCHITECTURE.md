# dhruvOS Architecture

## ctx Object

Built in `os/main.js`. Passed as second arg to every `app.mount(body, ctx)`.

```js
ctx = {
  // ── Navigation ──────────────────────────────────
  openApp(id: string),           // open any registered app by id
  openProject(projectId: string), // emit 'open-project' + open projects app
  openContact(),                  // open contact app

  // ── Data ────────────────────────────────────────
  content,   // see content.js shape below
  store,     // see store.js API below

  // ── Audio ───────────────────────────────────────
  audio: {
    start(), stop(), toggle() → boolean,
    get analyser()            // Web Audio AnalyserNode
  },

  // ── Theme ───────────────────────────────────────
  theme: {
    green:   '#5cffd0',
    amber:   '#ffb000',
    red:     '#ff4f4f',
    bg:      '#050a08',
    surface: '#0c1610',
    muted:   'rgba(92,255,208,0.45)',
  },
}
```

## content.js

`os/shell/content.js` — default-exports a frozen generated object. Edit
`src/v3/content/index.js`, then run `node scripts/gen-os-content.mjs` (also run
by `npm run build`) to update it.

```js
{
  identity: { name, role, location, tagline },
  contact:  { email, github, githubLabel, resume },
  skills:   [{ id, label, note, projects[] }],
  projects: [{ id, name, year, type, tagline, description, tech[], links: { live, github } }],
}
```

Empty `links.live` or `links.github` → link chip hidden. Empty `contact.resume` → resume button hidden.

## store.js

`os/shell/store.js` — singleton event bus + localStorage-backed state.

```js
store.on(event, fn)   → unsubscribe fn
store.emit(event, payload)
store.markExplored(appId)   // adds to explored set, persists, emits 'explored:change'
store.isExplored(appId)
store.exploredCount()
store.exploredRatio(total)
store.get(key)              // misc localStorage key
store.set(key, value)       // persists immediately
```

### Canonical events

| Event | Payload | Emitted by |
|---|---|---|
| `open-project` | `{ id }` | `ctx.openProject()` |
| `explored:change` | `{ count, appId }` | `store.markExplored()` |
| `wallpaper:set` | `{ palette }` | `wallpaper.js` SET button |
| `xp-maxed` | `{}` | `projects.js` when all 4 decoded |

## contactStrip.js

`os/shell/contactStrip.js` — mounts a 36px sticky footer inside any app container.

```js
import { mountContactStrip } from '../shell/contactStrip.js';
// inside mount():
const removeStrip = mountContactStrip(bodyEl);
// inside cleanup():
removeStrip();
```

Reads from `content.contact`. Resume button hidden when `content.contact.resume` is empty.

## App Contract

```js
export default {
  id: 'unique-string',
  title: 'display name',
  icon: '◈',
  width: 700,
  height: 540,
  mount(body, ctx) {
    // body = .win-body div  |  ctx = above
    // All listeners on body or child elements — NOT on window/document.
    return function cleanup() {
      // cancel rAF, disconnect ResizeObserver, remove listeners
    };
    // Animated apps may instead return { cleanup, setVisible }.
    // setVisible(false) is called on minimize, close, and embedded leave.
  },
};
```

## Design Tokens (CSS variables in styles.css)

| Variable | Value | Use |
|---|---|---|
| `--green` | `#5cffd0` | Primary accent |
| `--amber` | `#ffb000` | Secondary / highlights |
| `--red` | `#ff4f4f` | Close button, errors |
| `--bg` | `#050a08` | App background |
| `--surface` | `#0c1610` | Window / card background |
| `--surface2` | `#111e16` | Titlebar, taskbar |
| `--border` | `rgba(92,255,208,0.18)` | Default border |
| `--font` | `'JetBrains Mono', monospace` | All text |

### Design rules

- The default background is `#050a08`; the wallpaper app may apply a persisted
  palette to the shell.
- Borders always derived from `--green` or `--amber`. No blue/purple.
- Min font sizes: headings ≥13px, body ≥11px, labels ≥10px. No 8px copy.
- All glows derived from `--green` or `--amber`. No blue-glow halos.
- Hover states must be visually obvious (border change, color shift ≥0.3 alpha change).
