// src/content/index.js — single source of truth for the React shell.
// Consolidated from os/shell/content.js (the richest, real-valued source).
// Fill empty link fields as real values become available.

export const identity = {
  name: 'Dhruv Kothari',
  role: 'Developer & builder',
  location: 'Mumbai, India',
  tagline: 'Interfaces at the edge of code and craft.',
};

export const contact = {
  email: 'dhruvkothari13062006@gmail.com',
  github: 'https://github.com/dhruv4740',
  githubLabel: 'github.com/dhruv4740',
  linkedin: '', // unknown — fill when available
  twitter: '',  // unknown — fill when available
  resume: '',   // empty hides the resume button
};

export const skills = [
  { id: 'react',   label: 'React',      level: 0.90, projects: ['reddit', 'portfolio3d'] },
  { id: 'three',   label: 'Three.js',   level: 0.85, projects: ['portfolio3d', 'dhruvos'] },
  { id: 'webgl',   label: 'WebGL',      level: 0.80, projects: ['portfolio3d', 'dhruvos'] },
  { id: 'gsap',    label: 'GSAP',       level: 0.80, projects: ['dhruvos'] },
  { id: 'ts',      label: 'TypeScript', level: 0.85, projects: ['reddit', 'portfolio3d'] },
  { id: 'node',    label: 'Node.js',    level: 0.80, projects: ['reddit'] },
  { id: 'shaders', label: 'Shaders',    level: 0.75, projects: ['portfolio3d', 'dhruvos'] },
  { id: 'design',  label: 'Design',     level: 0.80, projects: ['dhruvos', 'portfolio3d'] },
  { id: 'python',  label: 'Python',     level: 0.65, projects: ['reddit'] },
  { id: 'canvas',  label: 'Canvas 2D',  level: 0.90, projects: ['dhruvos'] },
];

export const projects = [
  {
    id: 'reddit',
    name: 'Reddit Growth Copilot',
    year: 2024,
    type: 'MAIN QUEST',
    tagline: 'AI finds Reddit threads and drafts on-brand replies.',
    description: 'Scans Reddit in real-time to surface relevant threads for your product, then drafts contextual, non-spammy replies that drive genuine growth. Processes 1000+ threads per day. Built with Next.js, OpenAI API, and Reddit API.',
    tech: ['Next.js', 'OpenAI', 'Node.js', 'Reddit API'],
    links: { live: '', github: '' },
  },
  {
    id: 'geosvg',
    name: 'GeoSVG Maps Demo',
    year: 2024,
    type: 'SIDE QUEST',
    tagline: 'Interactive SVG map generator with live coordinates.',
    description: 'Map explorer built with Leaflet.js and custom SVG overlays. Live coordinate display, refresh controls, and vector export. Runs entirely in-browser with no backend.',
    tech: ['Leaflet.js', 'SVG', 'JavaScript'],
    links: { live: '', github: '' },
  },
  {
    id: 'portfolio3d',
    name: '3D Portfolio',
    year: 2025,
    type: 'SIDE QUEST',
    tagline: 'Walkable R3F room with physics, shaders, and a car game.',
    description: 'Immersive portfolio built with React Three Fiber. A walkable room with real-time physics (Rapier), custom GLSL shaders, postprocessing, and an embedded car game. First-person navigation throughout.',
    tech: ['React', 'Three.js', 'R3F', 'GLSL', 'Rapier'],
    links: { live: '', github: '' },
  },
  {
    id: 'dhruvos',
    name: 'dhruvOS',
    year: 2026,
    type: 'SIDE QUEST',
    tagline: 'A retro-future OS desktop as a portfolio.',
    description: 'Fake OS shell built as a portfolio. No bundler — pure ES modules. Canvas 2D apps, Web Audio API synthesizer, and interactive browser sketches. Everything runs in the browser.',
    tech: ['ES Modules', 'Canvas 2D', 'Web Audio', 'GSAP', 'Three.js'],
    links: { live: '', github: '' },
  },
];

const content = { identity, contact, skills, projects };
export default content;
