# Portfolio Concept Directions

These are 5 candidate directions for the portfolio overhaul, grounded in current Awwwards/FWA-tier creative-dev practice (GPGPU FBO sims, SDF raymarching, GSAP+Lenis smooth scroll, WebGL displacement). Each is shader/motion-driven, cheap to render (60fps), and needs no 3D-artist assets. Mockups live alongside this file.

## A — Particle Genesis (GPGPU morph hero)
Full-screen GPU particle system (~200k pts, FBO ping-pong compute). Idles as a living curl-noise flow field; morphs on scroll/click between targets: the name "DHRUV", a 3D form, and each project. Mouse repels/attracts. Additive + bloom + chromatic aberration. Maximum wow, very reels-able, biggest wow-per-effort.

## B — dhruvOS (living terminal OS)
Boot → desktop. The portfolio IS a fake retro-future OS: draggable windows (About / Projects / Terminal), a working terminal, the car-game as an app, CRT shader overlay. Novel as an idea, fully controllable polish, ~zero GPU cost, most dev-authentic.

## C — Liminal (raymarched dreamscape)
One full-screen fragment shader = an infinite surreal world: reflective floor, volumetric fog, low sun, SDF monoliths that are the projects. Scroll flies the camera forward; fog reveals the next monolith. Cinematic single-shader look, highest "crazy visuals."

## D — Kinetic (editorial + WebGL liquid + smooth scroll)
Award-tier editorial: Lenis smooth scroll + GSAP ScrollTrigger, giant variable-font kinetic typography, project images as WebGL planes with liquid displacement on hover + RGB-shift on scroll velocity, film grain. "Crazy polished," most reliably professional, the most "reels" in motion feel, lowest risk.

## E — Flux (interactive fluid backdrop)
Real-time flowing-liquid/aurora backdrop (animated domain-warped fbm) that the cursor stirs; palette shifts per section; clean glass/bento content floats over it. Mesmerizing, interactive, satisfying.

## F — Chromatic (iridescent morph 3D hero)
An icosphere displaced by noise in the vertex shader, oil-slick thin-film iridescence in the fragment shader, bloom; scroll scrubs the morph. Liquid-chrome Apple-keynote gloss.

## G — Drift (infinite draggable WebGL grid)
An endlessly wrapping grid of procedural project tiles you drag with momentum; drag velocity distorts the tiles (RGB-shift/stretch); click to focus. Tactile spatial navigation.

## H — Decoder (real-time ASCII render)
A rotating 3D form rendered to a low-res target, then a post shader maps luminance to ASCII glyphs from a generated atlas — green phosphor on black, scanlines. Hacker-terminal aesthetic.

## I — Resonance (audio-reactive visualizer)
A Web Audio FFT drives a radial spectrum + a bass-reactive central sphere with bloom; built-in generated soundscape (starts on click) or microphone input. Most alive/interactive.

## J — Gravity (2D physics playground)
matter.js drives skill/tech chips as draggable, throwable, stackable physical objects with custom canvas rendering; shake + reset controls. Playful and tactile.

## K — Reality Tear (flat site torn open to 3D) ⚑ flagship
A deliberately boring flat 2D site whose top layer the cursor tears away (jagged mask) to reveal a striking 3D WebGL world beneath; past a threshold the flat layer falls away entirely. The contrast is the concept — "looks broken on purpose."

## L — Wormhole (render-target portals)
Floating portal discs in a void, each a live window into its own 3D mini-world rendered to a separate WebGLRenderTarget; click a portal and the camera flies inside. One portal per project.

## M — Neural (living graph of you)
A force-directed graph of skills/projects/facts; hovering a node fires it and activation propagates along edges with ripple animations. You navigate by firing neurons, not scrolling.

## N — Singularity (the whole site is one shader)
A single fullscreen fragment shader raymarches every section and composites the text in GLSL (no meshes); scroll drives uProgress to morph between scenes. Signals serious graphics work.

## O — Corrupted (RPG save-file that heals)
The portfolio presents as a corrupted RPG — glitched UI, missing textures, scrambled text. Interacting repairs the corruption: stats are skills, quest log is projects, integrity rises to 100%.

## P — Powers of Ten (infinite scale zoom)
A seamless continuous WebGL zoom from galaxy → planet → city → desk → eye → neuron; each scale threshold reveals a section of the portfolio. Inspired by Eames' "Powers of Ten," interactive and personal.
