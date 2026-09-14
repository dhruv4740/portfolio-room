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
  linkedin: 'https://linkedin.com/in/dhruv4740',
  twitter: '',  // TODO(dhruv): empty hides the link
  // Drop the PDF at public/resume.pdf, then set this to '/resume.pdf'.
  // Empty hides the download button, so a missing file can never 404.
  resume: '',
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
    year: 2026,
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
  { id: 'three',    label: 'Three.js / WebGL',     proof: [],                                   note: 'Three.js sketches on the desk computer: Flux, Kinetic, Reality Tear' },
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
    decision:
      'It began as a self-hosted TypeScript backend with a device-registration API, local network traversal and a browser extension for the desktop side. I deleted all of it and moved to Firestore as shared state with a native Electron agent. That removed a server, its deployment and its firewall problem — and bought a real tradeoff: Firestore web keys are public, so isolation between sync codes was functional but not access-controlled until I wrote proper security rules.',
    broke:
      'The Windows agent logged that it had closed a tab, and the tab stayed open. PostMessage of WM_KEYDOWN for Ctrl never updates global key state, so Chromium read the synthetic W as a plain keypress with Ctrl not held. Fixed by re-asserting the foreground window and switching to SendInput, which injects input the OS actually accounts for.',
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
    decision:
      'The native buffer exposes peek and ack rather than drain. Drain-then-process loses events if processing crashes mid-loop; peek-then-ack only marks them consumed after they have actually been handled. Drain stayed behind as a legacy fallback.',
    broke:
      'The parser was inverting refund direction and filing bank boilerplate as real transactions. Separately, the buffered and live copies of one message now share a single timestamp read — dedup keys bucket by minute, and two clock reads can straddle a boundary.',
    tech: ['React Native', 'Kotlin', 'TypeScript', 'SQLite'],
    links: { live: '', github: 'https://github.com/dhruv4740/expense-tracker' },
  },
  {
    id: 'basket',
    name: 'Basket Price',
    year: 2026,
    kind: 'tool',
    tagline: 'Refuses to show you a price it cannot prove.',
    description: 
      'A private grocery price comparison and cart-sync tool for one family, across three delivery services. Built on a single rule: UNKNOWN is better than WRONG — it declines to state a total unless it has verified evidence for every line of it.',
    decision:
      'We built cart snapshot and undo, then deleted it. For a private tool the extra state and failure modes cost more than the feature returned, so cart writes now overwrite with no recovery path. Choosing to remove working code is the part I would defend.',
    broke:
      'A bot-mitigation 403 was indistinguishable from an expired session, and the recovery path deleted the stored credential on either — so a temporary block became a permanent lockout loop. Fixed by classifying the two failures separately and leaving the session intact on a block.',
    tech: ['Python'],
    links: { live: '', github: '' },
  },
  {
    id: 'darksentinel',
    name: 'DarkSentinel',
    year: 2026,
    kind: 'research',
    tagline: 'Darknet threat monitoring. Hackathon finalist.',
    description:
      'Team build for the Secure AI Systems and Software Hackathon (BITS Goa, co-organised with IIT Madras), where it reached the finals. A Random Forest scores CICFlowMeter network flows for Tor traffic; flagged activity triggers scraping over Tor, the scraped text is classified by RoBERTa and an LLM, and a combined risk score routes it to alerts or an analyst queue. A FastAPI backend serves Streamlit and Next.js dashboards.',
    decision:
      'I wired the Claude call to fire only when the Random Forest is unsure — Tor scores between 0.55 and 0.75 — behind a 60-second cooldown. Clear cases never reach the paid model, so its cost is bounded by time rather than by traffic volume.',
    broke:
      'A hardcoded fallback T-score could put an anomaly score on the dashboard that the model never produced, which made a missing prediction look like a working one. I removed the fallback from the analysis path.',
    tech: ['Python', 'FastAPI', 'Next.js', 'Random Forest', 'RoBERTa', 'Claude API', 'Tor', 'Streamlit'],
    links: { live: '', github: '' },
    note: 'Team project in a private repository. Deven owned model training, the LLM work and live Tor capture; I built the dashboards, the API features and the uncertain-zone Claude call.',
  },
  {
    id: 'crisiswatch',
    name: 'CrisisWatch',
    year: 2025,
    kind: 'product',
    tagline: 'Claim verification for a misinformation-heavy feed.',
    description:
      'Built at MumbaiHacks. AI-assisted claim checking with structured verdicts and a modular backend. Frontend on Vercel, backend on Render.',
    decision:
      'Built on LangGraph so the verification flow has explicit steps and state rather than one opaque prompt — every verdict comes from a path you can trace and debug. The model was fixed by what a hackathon budget allows, which made the real problem getting reliable structured output from one constrained model rather than shopping for a better one.',
    broke:
      'The WhatsApp bridge took a day of passes: Twilio posts form-encoded rather than JSON, a FastAPI import was missing, and content-type detection for image and audio had to be reworked. Sixteen commits, one sitting.',
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
    readout: 'READY',
    body: 'Apps, sketches and projects, running live on the desk computer.',
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
