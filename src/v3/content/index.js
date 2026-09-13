// ============================================================================
// Single source of truth for every surface: the room, the deck and /work.
//
// Facts here come from Dhruv's resume and repos. Do not embellish them.
// `decision` and `broke` are deliberately blank where the real answer is not
// yet known — an empty field renders as nothing, an invented one gets caught
// in an interview.
// ============================================================================

export const identity = {
  name: 'Dhruv Kothari',
  role: 'Full-stack developer',
  location: 'Mumbai, India',
  tagline: 'Third-year IT student. Growth intern at Blink.new (YC).',
  // One sentence, first person, no buzzwords. This is his own phrasing.
  statement:
    'I like building things end to end — mobile apps, backend automation, and hackathon projects under time pressure.',
};

export const contact = {
  email: 'dhruvkothari13062006@gmail.com',
  github: 'https://github.com/dhruv4740',
  githubLabel: 'github.com/dhruv4740',
  linkedin: '', // TODO(dhruv): paste the full URL — empty hides the link
  twitter: '',  // TODO(dhruv): empty hides the link
  resume: '',   // TODO(dhruv): put the PDF in public/ and point here
};

export const education = {
  school: 'KJ Somaiya College of Engineering',
  degree: 'B.Tech, Information Technology',
  year: 'Third year',
};

export const experience = [
  {
    id: 'blink',
    role: 'Growth Intern',
    org: 'Blink.new (1Flow Inc.)',
    note: 'YC-backed AI app builder',
    from: 'Jan 2026',
    to: 'Present',
    detail:
      'Ran organic growth experiments across search and community channels; analysed onboarding and engagement metrics to lift activation.',
  },
  {
    id: 'arh',
    role: 'Web Developer Intern',
    org: 'ARH Tubes Pvt. Ltd.',
    from: 'Dec 2025',
    to: 'Jan 2026',
    detail:
      'UI refactoring and asset handling for page responsiveness; integrated backend APIs and reduced UI inconsistencies.',
  },
  {
    id: 'efarm',
    role: 'IoT Developer Intern',
    org: 'EFarm, KJSCE',
    from: 'Feb 2025',
    to: 'Mar 2025',
    detail:
      'Automated irrigation prototype on Raspberry Pi with threshold-based pump control from live sensor data.',
  },
];

export const achievements = [
  { id: 'innovathon', label: 'Innovathon 2025 — Data Science track', result: 'Winner', year: 2025 },
  { id: 'realms',     label: 'REALMS 2025 — AR Tourism track',       result: 'Winner', year: 2025 },
  {
    id: 'saiss',
    label: 'Secure AI Systems & Software Hackathon (BITS Goa x IIT Madras)',
    result: 'Finalist',
    year: 2025,
  },
];

// `proof` lists project ids that actually demonstrate the skill. No percentages,
// no star ratings — evidence or nothing.
export const skills = [
  { id: 'react',    label: 'React / Next.js',      proof: ['crisiswatch', 'reddit'],            note: '' },
  { id: 'ts',       label: 'TypeScript',           proof: ['expense', 'crisiswatch', 'reddit'], note: '' },
  { id: 'node',     label: 'Node.js / Express',    proof: ['crisiswatch', 'reddit'],            note: '' },
  { id: 'python',   label: 'Python',               proof: ['darksentinel', 'fraud', 'basket'],  note: 'FastAPI, Flask, pandas' },
  { id: 'kotlin',   label: 'Kotlin / Android',     proof: ['focuslock', 'expense'],             note: 'native modules, accessibility services' },
  { id: 'firebase', label: 'Firebase / Firestore', proof: ['focuslock'],                        note: 'cross-device sync and security rules' },
  { id: 'ml',       label: 'ML / data',            proof: ['fraud', 'darksentinel'],            note: 'XGBoost, RoBERTa' },
  { id: 'iot',      label: 'ESP32 / Raspberry Pi', proof: ['ecowater'],                         note: 'sensor integration, control logic' },
  { id: 'three',    label: 'Three.js / WebGL',     proof: [],                                   note: '14 verified browser experiments' },
];

export const projects = [
  {
    id: 'focuslock',
    name: 'FocusLock',
    year: 2025,
    kind: 'product',
    tagline: 'Screen-time limits that follow you across Android and Windows.',
    description:
      'One Firestore backend enforces the same limits on two very different operating systems. An Android accessibility service detects target apps, a Windows agent enforces on the desktop, and short sync codes pair the devices.',
    decision: '', // pending — see docs/PROJECT-MATERIAL.md
    broke: '',    // pending
    tech: ['Kotlin', 'Android', 'Electron', 'Firebase', 'Firestore'],
    links: { live: '', github: 'https://github.com/dhruv4740/focuslock' },
  },
  {
    id: 'expense',
    name: 'Expense Tracker',
    year: 2025,
    kind: 'product',
    tagline: 'Logs your spending by reading the receipts your phone already gets.',
    description:
      'React Native with native Kotlin modules that parse SMS and notifications to log expenses automatically. Everything stays in local SQLite — no account, no cloud, no sync.',
    decision: '',
    broke: '',
    tech: ['React Native', 'Kotlin', 'TypeScript', 'SQLite'],
    links: { live: '', github: 'https://github.com/dhruv4740/expense-tracker' },
  },
  {
    id: 'darksentinel',
    name: 'DarkSentinel',
    year: 2025,
    kind: 'research',
    tagline: 'Darknet threat monitoring. Hackathon finalist.',
    description:
      'Built for the Secure AI Systems and Software Hackathon (BITS Goa, co-organised with IIT Madras), where it reached the finals. Captures traffic with CICFlowMeter, classifies anomalies with Random Forest and RoBERTa, scrapes over Tor, and surfaces results through a FastAPI service.',
    decision: '',
    broke: '',
    tech: ['Python', 'FastAPI', 'RoBERTa', 'Random Forest', 'Tor', 'Streamlit'],
    links: { live: '', github: '' },
    note: 'Contributed to a private team repository.',
  },
  {
    id: 'crisiswatch',
    name: 'CrisisWatch',
    year: 2025,
    kind: 'product',
    tagline: 'Claim verification for a misinformation-heavy feed.',
    description:
      'Built at MumbaiHacks. AI-assisted claim checking with structured verdicts and a modular backend. Frontend on Vercel, backend on Render.',
    decision: '',
    broke: '',
    tech: ['Next.js', 'TypeScript', 'Node.js', 'Python'],
    links: { live: '', github: 'https://github.com/dhruv4740/crisiswatch' },
  },
  {
    id: 'reddit',
    name: 'Reddit Growth Copilot',
    year: 2026,
    kind: 'product',
    tagline: 'Finds the threads worth replying to, then drafts the reply.',
    description:
      'Surfaces relevant Reddit threads for a product in real time and drafts contextual, non-spammy replies.',
    decision: '',
    broke: '',
    tech: ['TypeScript', 'Next.js', 'Node.js', 'Reddit API'],
    links: { live: '', github: '' },
  },
  {
    id: 'basket',
    name: 'Basket Price',
    year: 2026,
    kind: 'tool',
    tagline: '', // TODO: pending scan — see docs/PROJECT-MATERIAL.md
    description: '',
    decision: '',
    broke: '',
    tech: ['Python'],
    links: { live: '', github: '' },
  },
  {
    id: 'fraud',
    name: 'Fraud Detection Dashboard',
    year: 2025,
    kind: 'research',
    tagline: 'Innovathon 2025 winner.',
    description:
      'Machine-learning fraud detection for small businesses: CSV upload, transaction analysis, and a Flask dashboard. Around 85% accuracy on the test set.',
    decision: '',
    broke: '',
    tech: ['Python', 'XGBoost', 'Flask', 'pandas'],
    links: { live: '', github: '' },
  },
  {
    id: 'ecowater',
    name: 'Eco Water System',
    year: 2025,
    kind: 'hardware',
    tagline: 'Irrigation that waters when the soil says so.',
    description:
      'ESP32 and soil sensors driving threshold-based pump control with live monitoring.',
    decision: '',
    broke: '',
    tech: ['ESP32', 'Sensors', 'C++'],
    links: { live: '', github: '' },
  },
];

// Anchors are authored against the modeled room. `ref` points at a project id,
// or one of the special values: 'lab', 'about', 'contact'.
export const anchors = [
  {
    id: 'monitor',
    label: 'Monitor',
    ref: 'lab',
    readout: '14 EXPERIMENTS · VERIFIED',
    body: 'A live index of browser experiments. Each one runs; each one is playable.',
  },
  {
    id: 'desk',
    label: 'Desk',
    ref: 'focuslock',
    readout: 'FOCUSLOCK',
    body: '',
  },
  {
    id: 'notebook',
    label: 'Notebook',
    ref: 'about',
    readout: 'THE BUILDER',
    body: identity.statement,
  },
  {
    id: 'window',
    label: 'Window',
    ref: 'contact',
    readout: 'GET IN TOUCH',
    body: `Based in ${identity.location}. Reach me at ${contact.email}.`,
  },
];
