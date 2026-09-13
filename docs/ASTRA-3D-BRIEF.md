# 3D brief — night lighting pass

For the agent doing 3D work (Astra). Written 2026-09-13. Baseline is commit
`1a44ac9`, which already took the room from flat daylight to a dark first pass.
Look at `scripts/shots/wip-lighting.png` before starting — that is the current
state, not the target.

Read `AGENTS.md` for repo rules. This file is the art and technical direction.

## The decision

**The room is at night.** Confirmed by the user. Not dim daylight — night.

The reason is structural, not aesthetic. The concept is *click the glowing
monitor and get pulled inside it*. In the original daylight scene the monitor
was the dimmest object in a bright room, so the hero object had no visual
priority and the click needed a label to explain it. At night the monitor is the
brightest thing in frame and the affordance explains itself.

Second benefit: the room stops reading as a beige diorama floating on a black
page and instead dissolves into the `--void` background. That single change kills
the "low-poly isometric room" association that the scene currently invites.

## Light plan

Three sources. No general ambient fill beyond what's needed to keep geometry
from disappearing.

1. **The monitor — primary.** It is the hero and must behave like a real
   emitter: a cool bluish-white wash spilling onto the keyboard, the desk edge,
   the front of the mouse and the user-facing side of nearby objects. Falloff
   should be visible. This is the single highest-value effect in the brief — if
   only one thing gets done, do this.
2. **Desk lamp — warm key.** A contained warm pool on the desk surface. The
   shade interior should be emissive so the fixture reads as on. Currently it is
   a `PointLight` at intensity 0.75 that barely registers.
3. **Window — cool rim.** Keep the blind-slat shadow bands, but the source is
   now moonlight or a streetlight, not sun. Cool blue, low intensity, raking.
   Its job is rim-lighting object silhouettes so the chair, plant, books and
   pinboard don't vanish into the dark. Hard blue bands across the floor are
   more cinematic than the soft daylight version was.

**Legibility is the main risk of going dark.** The modeled detail (chair, plant,
books, pinboard, tower) must still be readable in silhouette. If something is
invisible, it may as well not have been modeled. Cool rim light is the fix,
not raising ambient.

## The hanging bulb

The user proposed a hanging bulb that flickers like an interrogation room.
**Take the bulb. Change the flicker.**

The fixture itself is a good idea: strong silhouette, adds vertical interest to
a composition that is currently all horizontal, and a swinging pendant casts a
moving pool that makes the space feel inhabited.

Three arguments against a *constant* interrogation-style flicker:

- **It competes with the monitor.** The whole point of night is to give the
  screen undisputed visual priority. A second flickering source pulls the eye
  away from the thing the user is supposed to click.
- **Tone mismatch.** Interrogation room reads hostile, grim, basement. This is a
  space where someone builds things. Ominous is a different portfolio.
- **Accessibility.** Repeated flashing is a photosensitivity hazard. WCAG 2.3.1
  caps flashing at three per second, and `prefers-reduced-motion` must disable
  it outright. A constantly flickering page is a real liability.

**Do this instead: flicker it once, on entry.** When the monitor is clicked and
the camera begins travelling in, the bulb surges and stutters — as if the
machine is drawing power — then settles or cuts out as you enter the screen.
Same drama, tied to the interaction, gone in a second, no accessibility problem,
and it makes the transition feel caused rather than decorative.

If the user still wants ambient flicker, keep it to a rare, subtle instability
rather than a strobe, and gate it behind `prefers-reduced-motion`.

## Technical constraints

- **`shadowMap.autoUpdate = false`** with a one-time `needsUpdate`. Furniture
  and lights are static; camera motion must not re-render the shadow map.
  Preserve this. **Flickering a light's `intensity` is free** — the shadow map
  stores depth, not brightness, so an intensity animation does not invalidate
  it. A light that *moves* (a swinging bulb) does. If you swing the pendant,
  either fake the moving pool with an animated texture/decal or accept and
  measure the cost of a dynamic shadow for that one light.
- **No new npm dependencies.**
- **Do not touch** `Scan.jsx`, `DhruvOSScreen.jsx`, `scripts/verify-v3.mjs`, or
  the raycasting / marker-projection / camera-travel logic in
  `WorkspaceStage.jsx`. Those are verified at 36/36 and owned elsewhere.
- **`WORKSPACE.screen` and `WORKSPACE.anchors` are load-bearing.** The camera
  travel target and the monitor's clickable plane derive from them. If monitor
  geometry moves, update `screen` in the same edit or you silently break entry.
- The UI chrome stays in the design system: `--void` background, `--bone` text,
  one accent `--signal #FF5F1F`, no gradients. The *room* is naturalistic and
  warm-vs-cool; that contrast against the chrome is intended.
- Do not restore Spark, `SplatStage.jsx`, or any `.splat` capture. Dead.

## Files you own

- `src/v3/desktop/buildWorkspace.js`
- the renderer-config and lighting block at the top of
  `src/v3/desktop/WorkspaceStage.jsx` (WebGLRenderer options, toneMapping,
  shadowMap, scene background/fog, lights)

## Verify

```bash
npm run build
node node_modules/vite/bin/vite.js preview --host 127.0.0.1 --port 4174
node scripts/shot.mjs scripts/shots/night.png
```

`scripts/shot.mjs` pins the surface override and screenshots the scene. **Look
at your screenshots and iterate.** Do not declare the lighting improved without
looking at it.

Then `node scripts/verify-v3.mjs` (check `BASE` matches your port) to confirm
you have not broken interaction. It should stay at 36/36.

Do not commit; report what changed and hand back.

## Known-unfinished, not your scope

The monitor displays a static painted canvas texture (`screenTexture()` in
`buildWorkspace.js`), not a live render of dhruvOS. The room-screen and the real
OS therefore do not match at the moment of handoff. Making that continuous is
the next build item and is being handled separately — but **the screen glow in
point 1 above should be built so it survives that swap.**
