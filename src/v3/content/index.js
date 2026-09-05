// ============================================================================
// v3 single source of truth.
// Every surface (desktop scan, mobile deck, /work) renders from this file.
// Migrated from src/content/index.js — skill levels replaced with evidence.
// ============================================================================

export const identity = {
  name: 'Dhruv Kothari',
  role: 'Creative developer',
  location: 'Mumbai, India',
  tagline: 'Interfaces at the edge of code and craft.',
  // Shown under the hero. Keep it one sentence, first person, no buzzwords.
  statement:
    'I build things that run in a browser and have no business running in a browser.',
};

export const contact = {
  email: 'dhruvkothari13062006@gmail.com',
  github: 'https://github.com/dhruv4740',
  githubLabel: 'github.com/dhruv4740',
  linkedin: '', // TODO(dhruv): fill — empty hides the link
  twitter: '',  // TODO(dhruv): fill — empty hides the link
  resume: '',   // TODO(dhruv): path to resume PDF — empty hides the button
};

// Skills as evidence, not self-assigned percentages.
// `proof` must point at something real: a project id or a lab entry id.
export const skills = [
  { id: 'three',   label: 'Three.js / WebGL', proof: ['dhruvos', 'portfolio3d'], note: '17 shipped experiments' },
  { id: 'shaders', label: 'GLSL shaders',     proof: ['portfolio3d', 'dhruvos'], note: 'raymarching, GPGPU, post FX' },
  { id: 'react',   label: 'React',            proof: ['reddit', 'portfolio3d'],  note: '3 projects' },
  { id: 'ts',      label: 'TypeScript',       proof: ['reddit', 'portfolio3d'],  note: '' },
  { id: 'node',    label: 'Node.js',          proof: ['reddit'],                 note: '' },
  { id: 'canvas',  label: 'Canvas 2D',        proof: ['dhruvos'],                note: '11 apps, no engine' },
  { id: 'audio',   label: 'Web Audio',        proof: ['dhruvos'],                note: 'synth + FFT' },
  { id: 'python',  label: 'Python',           proof: ['reddit'],                 note: '' },
];

export const projects = [
  {
    id: 'reddit',
    name: 'Reddit Growth Copilot',
    year: 2024,
    kind: 'product',
    tagline: 'AI finds Reddit threads and drafts on-brand replies.',
    description:
      'Scans Reddit in real time to surface relevant threads for your product, then drafts contextual, non-spammy replies. Processes 1000+ threads per day.',
    // The bit almost no junior portfolio has. Write one real decision + one real failure.
    decision: '',   // TODO(dhruv): a technical choice you made and why
    broke: '',      // TODO(dhruv): what broke and how you fixed it
    tech: ['Next.js', 'OpenAI', 'Node.js', 'Reddit API'],
    links: { live: '', github: '' }, // TODO(dhruv): fill both
  },
  {
    id: 'dhruvos',
    name: 'dhruvOS',
    year: 2026,
    kind: 'experiment',
    tagline: 'A retro-future OS desktop, built with no bundler.',
    description:
      'Fake OS shell: draggable window manager, 11 apps, Web Audio synthesizer, force-directed graph, Powers-of-Ten zoom. Pure ES modules, zero build step.',
    decision: '',
    broke: '',
    tech: ['ES Modules', 'Canvas 2D', 'Web Audio', 'GSAP', 'Three.js'],
    links: { live: '/os/', github: '' },
  },
  {
    id: 'portfolio3d',
    name: 'Walkable Room',
    year: 2025,
    kind: 'experiment',
    tagline: 'First-person R3F room with physics, shaders, and a car game.',
    description:
      'Immersive portfolio: walkable room with Rapier physics, custom GLSL, postprocessing, and an embedded Canvas game rendered onto the laptop screen.',
    decision: '',
    broke: '',
    tech: ['React', 'Three.js', 'R3F', 'GLSL', 'Rapier'],
    links: { live: '', github: '' },
  },
  {
    id: 'geosvg',
    name: 'GeoSVG Maps',
    year: 2024,
    kind: 'tool',
    tagline: 'Interactive SVG map generator with live coordinates.',
    description:
      'Map explorer built on Leaflet with custom SVG overlays, live coordinate readout and vector export. Entirely client-side.',
    decision: '',
    broke: '',
    tech: ['Leaflet.js', 'SVG', 'JavaScript'],
    links: { live: '', github: '' },
  },
];

// ---------------------------------------------------------------------------
// ANCHORS — points of interest inside the scanned room.
// `position` is in splat-space metres and MUST be re-tuned after the real
// capture lands; these values are calibrated to the dev placeholder splat.
// `ref` links an anchor to a project id, or 'lab' / 'about' / 'contact'.
// ---------------------------------------------------------------------------
export const anchors = [
  {
    id: 'monitor',
    label: 'Monitor',
    ref: 'lab',
    position: [0.0, 0.35, -0.6],
    // Camera parks here when the anchor is opened.
    view: { position: [0.0, 0.35, 0.9], target: [0.0, 0.32, -0.6] },
    readout: '17 EXPERIMENTS · LIVE',
    body: 'Everything I have built that runs in a browser. Each one is playable.',
  },
  {
    id: 'desk',
    label: 'Desk',
    ref: 'reddit',
    position: [-0.55, 0.05, -0.2],
    view: { position: [-0.7, 0.4, 0.7], target: [-0.55, 0.05, -0.2] },
    readout: 'MAIN PROJECT',
    body: '',
  },
  {
    id: 'notebook',
    label: 'Notebook',
    ref: 'about',
    position: [0.45, 0.0, -0.1],
    view: { position: [0.6, 0.35, 0.6], target: [0.45, 0.0, -0.1] },
    readout: 'WHO',
    body: identity.statement,
  },
  {
    id: 'window',
    label: 'Window',
    ref: 'contact',
    position: [1.1, 0.6, -1.2],
    view: { position: [0.6, 0.6, 0.2], target: [1.1, 0.6, -1.2] },
    readout: 'GET IN TOUCH',
    body: '',
  },
];

// ---------------------------------------------------------------------------
// Capture metadata — rendered as instrument telemetry. Update after real scan.
// ---------------------------------------------------------------------------
export const capture = {
  // TODO(dhruv): replace when the real room scan is trained.
  source: '/splats/dev-room.splat',
  isPlaceholder: true,
  label: 'DEV PLACEHOLDER',
  capturedOn: '',
  device: '',
  method: '',
};

const content = { identity, contact, skills, projects, anchors, capture };
export default content;
