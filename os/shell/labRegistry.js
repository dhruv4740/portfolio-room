/**
 * labRegistry.js — the honest, curated list of lab demos dhruvOS will launch.
 *
 * Source of truth for verdicts: docs/LAB-AUDIT.md (2026-09-13). Do not add an
 * entry here without a corresponding WORKS/DEGRADED line in that audit.
 *
 * `src` is resolved relative to this document's own location (os/index.html
 * or os/embed.html — both live directly under /os/), so it works identically
 * whether dhruvOS is loaded standalone or embedded in the v3 room.
 *
 * Excluded on purpose:
 * - particles (Particle Genesis) — audit verdict BROKEN, blank white page.
 * - room (3D Room) — dead metadata, no renderer exists. Not a demo.
 * - lab/os.html (the lab-variant OS shell) — DEGRADED and redundant with the
 *   full build below; shipping both reads as a bug, not an easter egg.
 */

export const LAB_APPS = [
  { id: 'chromatic',  title: 'Chromatic',       blurb: 'Iridescent liquid-chrome, Apple-keynote gloss.', status: 'works', src: '../lab/chromatic.html' },
  { id: 'corrupted',  title: 'Corrupted',        blurb: 'Glitched RPG save file. Skills as stats, projects as quests.', status: 'works', src: '../lab/corrupted.html' },
  { id: 'decoder',    title: 'Decoder',          blurb: 'Live 3D rendered as glowing ASCII art.', status: 'works', src: '../lab/decoder.html' },
  { id: 'drift',      title: 'Drift',            blurb: 'Infinite draggable canvas of work, flung with momentum.', status: 'works', src: '../lab/drift.html' },
  { id: 'fluid',      title: 'Flux',             blurb: 'Flowing-liquid backdrop, stirred by the cursor.', status: 'works', src: '../lab/fluid.html' },
  { id: 'gravity',    title: 'Gravity',          blurb: 'Skills as throwable physics objects.', status: 'works', src: '../lab/gravity.html' },
  { id: 'kinetic',    title: 'Kinetic',          blurb: 'Editorial kinetic type, scroll-driven liquid distortion.', status: 'works', src: '../lab/kinetic.html' },
  { id: 'neural',     title: 'Neural',           blurb: 'Identity as a living neural graph.', status: 'works', src: '../lab/neural.html' },
  { id: 'portals',    title: 'Wormhole',         blurb: 'Floating portals, each a window into a mini-world.', status: 'works', src: '../lab/portals.html' },
  { id: 'raymarch',   title: 'Liminal',          blurb: 'Scroll-fly through a raymarched dreamscape.', status: 'works', src: '../lab/raymarch.html' },
  { id: 'resonance',  title: 'Resonance',        blurb: 'Audio-reactive visualizer.', status: 'works', src: '../lab/resonance.html' },
  { id: 'zoom',       title: 'Powers of Ten',    blurb: 'A continuous infinite zoom from galaxy to atom.', status: 'works', src: '../lab/zoom.html' },
  { id: 'singularity', title: 'Singularity',     blurb: 'The whole page as one fragment shader.', status: 'degraded', note: 'renders, but the GLSL-text claim is unconfirmed', src: '../lab/singularity.html' },
  { id: 'tear',        title: 'Reality Tear',    blurb: 'A boring flat site your cursor drags open.', status: 'degraded', note: 'the drag-to-tear gesture is unverified', src: '../lab/tear.html' },
  { id: 'video3d',     title: 'Video 3D',        blurb: 'Scroll-scrubbed video on a displaced plane.', status: 'degraded', note: 'video frame did not confirm-load in audit', src: '../lab/video3d.html' },
  { id: 'dhruvos-full', title: 'dhruvOS (nested)', blurb: 'The standalone build of this exact OS, boot sequence and all.', status: 'works', note: 'easter egg — an OS inside the OS', src: 'index.html' },
];
