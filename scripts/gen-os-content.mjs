// Generates public/os/shell/content.js from src/v3/content/index.js.
//
// The OS is a dependency-free ES-module app served from public/, so it cannot
// import across the bundler boundary. Before this script existed the OS carried
// its own hand-written content file, which drifted into inventing projects and
// metrics that were never true. Generating it means there is exactly one place
// facts live, and `npm run build` regenerates it.
//
// Run: node scripts/gen-os-content.mjs

import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');

const src = await import(
  'file://' + resolve(root, 'src/v3/content/index.js').replace(/\\/g, '/')
);

const {
  identity, contact, education, experience, achievements, skills, projects,
} = src;

// projects.js renders a glyph + label per entry. The source file ranks projects
// by depth, so the first three carry the most defensible engineering detail.
const questType = (project, index) =>
  index < 3 ? 'MAIN QUEST' : 'SIDE QUEST';

const payload = {
  identity: {
    name: identity.name,
    role: identity.role,
    location: identity.location,
    tagline: identity.tagline,
    statement: identity.statement,
  },
  contact,
  education,
  experience,
  achievements,
  // `proof` is renamed to `projects` because that is the key the OS apps read.
  // No skill levels: a self-assigned 0.9 is not a fact, and every consumer of
  // the old `level` field has been removed.
  skills: skills.map((s) => ({
    id: s.id,
    label: s.label,
    note: s.note,
    projects: s.proof,
  })),
  projects: projects.map((p, i) => ({
    id: p.id,
    name: p.name,
    year: p.year,
    kind: p.kind,
    type: questType(p, i),
    tagline: p.tagline,
    description: p.description,
    decision: p.decision,
    broke: p.broke,
    tech: p.tech,
    links: p.links,
    note: p.note || '',
  })),
};

const out = `// GENERATED FILE — DO NOT EDIT BY HAND.
// Source: src/v3/content/index.js
// Regenerate: node scripts/gen-os-content.mjs
export default Object.freeze(${JSON.stringify(payload, null, 2)});
`;

const dest = resolve(root, 'public/os/shell/content.js');
writeFileSync(dest, out, 'utf8');
console.log(
  `wrote ${dest} — ${payload.projects.length} projects, ` +
    `${payload.skills.length} skills, ${payload.achievements.length} achievements`
);
