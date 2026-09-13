# Prompt for Astra — copy everything below the line

---

You are doing the 3D work on a personal portfolio. I will describe the repo, the
exact file you own, the constraints, and the two jobs. Read all of it before
writing code. Where you think a constraint is wrong, say so before you change it
rather than quietly working around it.

## The project

A portfolio for Dhruv Kothari, a third-year IT student in Mumbai. The landing
surface on desktop is an **authored three.js room** — desk, monitor, keyboard,
notebook, chair, desk lamp, window, wall poster, plant. The user orbits it.
Clicking the monitor flies the camera into the screen, which then hands off to
"dhruvOS", a real OS-like environment running in a same-origin iframe on the
monitor plane. So the room is not scenery — it is the entrance.

Stack: **vanilla three.js** (NOT react-three-fiber), Vite, React 19 around it.
The renderer, orbit controls, raycasting and render loop are hand-written and
owned by `src/v3/desktop/WorkspaceStage.jsx`. Do not introduce r3f, drei, or a
postprocessing library.

## Files

You own, and should expect to rewrite substantially:

- `src/v3/desktop/buildWorkspace.js` (~354 lines) — all geometry, materials,
  textures, lights. Exports `WORKSPACE`.

You may read and make *surgical* edits to, but do not restructure:

- `src/v3/desktop/WorkspaceStage.jsx` — renderer, orbit, raycast, camera travel
- `src/v3/desktop/cameraRig.js` — `flyTo()` (GSAP power3.inOut), idle drift, `project()`
- `src/v3/desktop/Scan.jsx` — phase machine: room / preparing / entering / inside / leaving
- `src/v3/desktop/perfGovernor.js` — render-on-demand + adaptive resolution + quality tiers

Everything else in the repo is not yours.

## Hard constraints — these are not preferences

**1. Integrated GPU is the target, not the fallback.** The owner's own laptop is
an AMD Radeon integrated GPU and the site must feel good there. Assume no
discrete GPU, assume thermal throttling, assume 1080p or lower. Every technique
you choose gets judged against that machine, not against your dev box.

**2. Shadows are baked once and never re-rendered.**
`renderer.shadowMap.autoUpdate = false`, with a single `needsUpdate = true` on
the first frame. Furniture and lights do not move, so camera motion must never
re-render the shadow map. **Preserve this.** If you add a light that casts
shadows, it must be static. A light that moves invalidates the whole scheme and
will tank the frame rate on the target hardware.

Corollary you can exploit: **changing a light's `intensity` is free.** The shadow
map stores depth, not brightness. Flicker, pulse and dimming cost nothing. Moving
the light costs everything.

**3. Render-on-demand.** The loop stops scheduling `requestAnimationFrame`
entirely when nothing is changing — verified zero callbacks over 3 seconds idle.
If you add any continuous animation, you have deliberately turned that off and
put the machine into a permanent 100%-GPU state. Don't, unless you tell me you
are doing it and why. Anything that must animate should either be event-driven
or request frames only while it runs.

**4. `WORKSPACE.screen` is load-bearing.**

```js
export const WORKSPACE = {
  min: [-2.5, 0, -1.85], max: [2.5, 3.2, 2.1],
  target: [0, 1.1, -0.15],
  anchors: {
    monitor: [0, 1.79, -0.37],
    desk:    [-1.22, 1.18, 0.28],
    notebook:[1.12, 1.21, 0.38],
    window:  [1.4, 2.12, -1.75],
  },
  screen: { center: [0, 1.79, -0.362], width: 1.28, height: 0.79 },
};
```

The camera-travel destination AND the monitor's clickable plane both derive from
`screen`. If you move or resize the monitor, you update `screen` **in the same
edit** or the entrance breaks. `anchors` drive projected DOM hotspot markers;
keep the four keys, move their positions if geometry moves.

**5. Objects are tagged for raycasting** via a local `tag(mesh, id)` helper where
id is one of `monitor`, `desk`, `notebook`, `window`. Anything clickable must be
tagged. Untagged decorative meshes are correctly ignored by the raycaster.

**6. Don't recolour the room to match the UI.** The surrounding chrome is a
near-black `--void #0A0A0B` with one orange accent `#FF5F1F`. The room is
deliberately warm and naturalistic against it. That contrast is intended.

## Job 1 — relight the room for night

The room is currently lit for daytime and reads as a lit diorama rather than a
place. The diagnosis: ambient is drowning contrast. Current lights are a
`HemisphereLight` at 0.55, a `DirectionalLight` "sun" at 4.4, a fill
`DirectionalLight` at 0.4, a lamp `PointLight` at 0.75, and a screen-glow
`PointLight` at 0.5.

There is also a structural argument for night specifically: right now the
**monitor is dimmer than the room it sits in**, which is backwards for a scene
whose entire job is to make you want to click the monitor. At night the monitor
becomes the brightest thing in frame and the composition does the pointing for
you.

Three sources, in priority order:

1. **The monitor — primary, cool.** Highest value in the whole scene. It should
   be the brightest thing, and its light should visibly spill onto the keyboard
   and the front edge of the desk. That spill is what sells "a real screen is on
   in a dark room". Get this one right before touching anything else.
2. **The desk lamp — warm key.** A pool of warm light with a real falloff. This
   is what keeps the scene from being monochrome blue.
3. **The window — cool rim through blinds.** Faint. Enough to separate the room's
   silhouette from the back wall, not enough to light the desk.

Kill or heavily reduce the hemisphere/ambient. Dark areas are allowed to be dark.
The failure mode to avoid is "daytime scene with the brightness slider down" —
you want genuine pools of light and genuine darkness between them.

Since shadows are baked, you can also bake light: the existing code already uses
`CanvasTexture` decals for the lamp pool and contact shadows. That technique is
cheap and you should lean on it harder rather than adding real lights.

### The hanging bulb

The owner asked for a hanging bulb "which flickers like a detective
interrogation room." Take the fixture — a bare bulb on a cord is a strong
silhouette element and gives the room a vertical the current layout lacks.

But do **not** make it flicker constantly. Three reasons: it competes for
attention with the monitor, which is the thing you actually want clicked; the
constant-flicker language reads as horror rather than as workspace; and
continuous high-contrast flashing is a WCAG 2.3.1 photosensitivity problem.

Instead: fire **one** power-surge flicker on entry — a short, irregular,
convincing stutter when the scene first appears, then it settles and holds
steady. Do it by animating `intensity` only, over maybe 700–1200ms, with an
irregular (not sine) envelope. Then stop requesting frames. That gives the whole
detective-room impression for the cost of one animation that ends.

Respect `prefers-reduced-motion`: skip the flicker, start at final intensity.

## Job 2 — sit in the chair

New feature, decided by the owner. Scope is **seated camera plus reaching for
objects** — explicitly NOT free walking. No collision, no WASD, no room
traversal. Adding those is out of scope and will cost too much on the target GPU.

What should happen:

1. The chair becomes clickable (tag it). A hotspot or affordance reads "SIT".
2. Clicking flies the camera to a **fixed seated eye position** — roughly where
   a person's eyes would be sitting at that desk. Use the existing `flyTo()` in
   `cameraRig.js` rather than writing a new camera path.
3. Once seated, the orbit controls change character: the user can **look around
   freely from that fixed point** — full head-turn range, no position change.
   From the seat they should be able to look down at the desk, across at the
   window, up at the bulb. Think "first person, neck only."
4. From seated, **individual desk objects become inspectable**. Clicking one
   brings it up for a closer look and reveals something. At minimum the notebook
   and the monitor; ideally the lamp, the poster, and whatever else earns it. The
   owner's requirement is that nothing is clickable for decoration's sake —
   every object you make interactive must reveal real content, and I will wire
   that content in on my side. Your job is the geometry, the camera moves, and
   telling me exactly which object ids you have made inspectable so I can attach
   content to each.
5. There must be an obvious way back out to the orbiting view. Escape key and a
   visible control.
6. The monitor must still be clickable from the seated position, and must still
   trigger the same entrance into dhruvOS. Do not fork that path.

Design note: sitting down is a *reward*, so it should feel physical. A slight
settle at the end of the move, a small change in FOV, the sense of weight. Do it
with the camera, not with particles.

Note the current chair geometry may be too crude to sit at convincingly — if it
needs rebuilding, rebuild it, and check that the seated eye height you choose
actually looks right against the desk height.

## What I need back

- The rewritten `buildWorkspace.js`, plus whatever surgical edits to
  `WorkspaceStage.jsx` / `cameraRig.js` / `Scan.jsx` the seated mode needs.
- A list of the object ids you made inspectable in seated mode, so I can attach
  real content to each.
- A note on anything you animated continuously, if you did, and why it was
  unavoidable.
- If you changed `WORKSPACE.screen` or `anchors`, say so explicitly and say what
  the new values are.
- Your honest read on whether any of this will struggle on an integrated GPU,
  and which part you would cut first if it does.

Do not add dependencies. Do not fabricate content — any text that appears in the
room comes from me, not from you; where you need a placeholder, make it obviously
a placeholder.

---
