// ============================================================================
// Single source of truth for every surface: the room and /work.
//
// Facts here come from Dhruv's resume and repos. Do not embellish them.
// `decision` and `broke` are deliberately blank where the real answer is not
// yet known — an empty field renders as nothing, an invented one gets caught
// in an interview.
// ============================================================================

export const identity = {
  name: 'Dhruv Kothari',
  role: 'Software engineer',
  location: 'Mumbai, India',
  pitch: "He is a software engineer who ships real products, from Android apps to growth tools.",
  now: 'Growth intern at Blink.new (YC) until October 2026. Open to remote software engineering and growth engineering internships from December 2026.',
  tagline: "I'm a software engineer who ships real products, from Android apps to growth tools.",
  // Home page headline and availability lines. `pitch`, `now` and `tagline` stay: the Ask knowledge base and dhruvOS read them.
  headline: "I'm a software engineer who ships real products, from Android apps to growth tools.",
  availability: ['Growth intern at Blink.new (YC) until October 2026.', 'Open to remote software and growth engineering internships from December 2026.'],
  // One sentence, first person, no buzzwords. This is his own phrasing.
  statement:
    'I like building things end to end. That means mobile apps, backend automation and hackathon projects under time pressure.',
};

export const proofPoints = [
  { value: '18%', text: 'of contacted creators replied, across 489 outreach emails from an LLM pipeline I built at Blink' },
  { value: '4', text: 'internal growth tools shipped at Blink. They cover outreach, link building, SEO tracking and a Reddit copilot.' },
  { value: 'Top 5', text: "finalist at the IIT Madras × BITS Goa security hackathon, for DarkSentinel's LLM review layer" },
  { value: '2×', text: 'hackathon wins at Innovathon 2025 and REALMS 2025' },
];

export const contact = {
  email: 'hello@dhruvkothari.com',
  github: 'https://github.com/dhruv4740',
  githubLabel: 'github.com/dhruv4740',
  linkedin: 'https://linkedin.com/in/dhruv4740',
  twitter: '',  // TODO(dhruv): empty hides the link
  // Drop the PDF at public/resume.pdf, then set this to '/resume.pdf'.
  // Empty hides the download button, so a missing file can never 404.
  resume: '/resume.pdf',
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
    org: 'Blink.new',
    note: 'YC-backed AI app builder, remote',
    from: 'Jan 2026',
    to: 'Oct 2026',
    detail:
      'Built 4 internal growth tools. They cover creator outreach, link building, SEO mention monitoring and a Reddit growth copilot.',
    caseStudy: {
      // Panel text on the work page: bullets. Every other consumer joins them into prose; `pdf` keeps the one-page case file's original prose.
      summary: [
        'I built an outreach pipeline that drafts emails with an LLM and needs human approval.',
        'I built a link-building engine that scored 676 prospect sites and extracted contacts.',
        'I tracked AI-search (AEO) citations for Blink across 18 prompts.',
      ],
      problem: [
        'Blink.new needed repeatable growth channels.',
        'The team had no tooling for creator outreach, link building, AI-search visibility or Reddit.',
      ],
      decisions: [
        'I built four internal tools as the sole developer.',
        'I made a human approve every outreach email the LLM drafts.',
        'The link-building engine is a Flask dashboard.',
      ],
      result: [
        'I sourced 650 leads and sent 489 emails.',
        '41 of 228 contacted creators replied (18%) and 14 were positive.',
        'Reddit was 29.85% of Blink social traffic in Jun 2026.',
      ],
      pdf: {
        problem: 'Blink.new needed repeatable growth channels, and the team had no tooling for creator outreach, link building, AI-search visibility or Reddit.',
        decisions: 'I built four internal tools as the sole developer. The outreach pipeline (Python, SQLite, YouTube Data API, Gmail API) uses an LLM to draft messages, but a human approves every send. The link-building engine is a Flask dashboard that finds and scores prospect sites and extracts contacts.',
        result: '650 leads sourced, 489 emails sent, 41 of 228 contacted creators replied (18%), 14 positive. The link engine scored 676 prospect sites, AI-search tracking covered 18 prompts, and Reddit was 29.85% of Blink social traffic in Jun 2026.',
      },
    },
    bullets: [
      'Built a creator outreach pipeline (Python, SQLite, YouTube Data API, Gmail API, LLM drafting with human approval).',
      'Built a link-building engine (Flask dashboard) that found and scored prospect sites and extracted contacts.',
      'Tracked AI-search (AEO) citations for Blink across 18 prompts.',
    ],
    metrics: [
      { value: '4', label: 'internal growth tools' },
      { value: '650', label: 'leads sourced' },
      { value: '489', label: 'emails sent' },
      { value: '18%', label: 'of contacted creators replied (41 of 228)' },
      { value: '14', label: 'positive responses' },
      { value: '676', label: 'prospect sites found and scored' },
      { value: '29.85%', label: 'of Blink social traffic from Reddit (Jun 2026)' },
    ],
  },
  {
    id: 'arh',
    role: 'Web Developer Intern',
    org: 'ARH Tubes Pvt. Ltd.',
    from: 'Dec 2025',
    to: 'Jan 2026',
    detail:
      'Built and launched the company e-commerce storefront, tanttu.in, on Shopify.',
  },
];

export const achievements = [
  { id: 'innovathon', label: 'Innovathon 2025, Data Science track', result: 'Winner', year: 2025 },
  { id: 'realms',     label: 'REALMS 2025, AR Tourism track',       result: 'Winner', year: 2025 },
  {
    id: 'saiss',
    label: 'Secure AI Systems & Software Hackathon (BITS Goa x IIT Madras)',
    result: 'Top 5 finalist in problem statement',
    year: 2026,
  },
];

// `proof` lists project ids that actually demonstrate the skill. No percentages,
// no star ratings — evidence or nothing.
export const skills = [
  { id: 'react',    label: 'React / Next.js',      proof: ['crisiswatch'],                      note: '' },
  { id: 'ts',       label: 'TypeScript',           proof: ['expense', 'crisiswatch'],           note: '' },
  { id: 'node',     label: 'Node.js / Express',    proof: ['crisiswatch'],                      note: '' },
  { id: 'python',   label: 'Python',               proof: ['darksentinel', 'fraud', 'basket'],  note: 'FastAPI, Flask, pandas' },
  { id: 'kotlin',   label: 'Kotlin / Android',     proof: ['focuslock', 'expense'],             note: 'native modules, accessibility services' },
  { id: 'firebase', label: 'Firebase / Firestore', proof: ['focuslock'],                        note: 'cross-device sync and security rules' },
  { id: 'ml',       label: 'ML / data',            proof: ['darksentinel'],                     note: 'scikit-learn, pandas' },
  { id: 'three',    label: 'Three.js / WebGL',     proof: [],                                   note: 'Three.js sketches on the desk computer, including DarkSentinel, Expense Tracker' },
];

export const projects = [
  {
    id: 'focuslock',
    name: 'FocusLock',
    year: 2026,
    kind: 'product',
    tagline: 'Screen-time limits that follow you across Android and Windows.',
    description:
      'One Firestore backend enforces the same limits on two very different operating systems. An Android accessibility service detects target apps, a Windows agent enforces on the desktop, and short sync codes pair the devices.',
    decision:
      'It began as a self-hosted TypeScript backend with a device-registration API, local network traversal and a browser extension for the desktop side. I deleted all of it and moved to Firestore as shared state with a native Electron agent. That removed a server, its deployment and its firewall problem. It also bought a real tradeoff. Firestore web keys are public, so isolation between sync codes was functional but not access-controlled until I wrote proper security rules.',
    broke:
      'The Windows agent logged that it had closed a tab, and the tab stayed open. PostMessage of WM_KEYDOWN for Ctrl never updates global key state, so Chromium read the synthetic W as a plain keypress with Ctrl not held. Fixed by re-asserting the foreground window and switching to SendInput, which injects input the OS actually accounts for.',
    summary: 'A screen-time limiter that shares one daily allowance across an Android phone and a Windows PC.',
    detail: 'Enforces at the OS level. Switching browsers doesn\'t reset your limit, because the allowance is shared across browsers and devices. Over 250 automated tests. CI builds a signed APK plus Windows installer.',
    tech: ['Kotlin', 'Android', 'Electron', 'Firebase', 'Firestore'],
    caseStudy: {
      problem: [
        'Screen-time limits are easy to dodge.',
        'Switching browsers or devices resets the allowance.',
      ],
      decisions: [
        'I enforce limits at the OS level with one shared daily allowance.',
        'I replaced a self-hosted backend and browser extension with Firestore and an Electron agent.',
        'I wrote security rules so each sync code only reaches its members, capped at 10.',
      ],
      result: [
        'One allowance now covers an Android phone and a Windows PC.',
        'Ctrl+W logged as closed but the tab stayed open until I switched to SendInput.',
        'Over 250 automated tests back it, and CI builds a signed APK plus Windows installer.',
      ],
      pdf: {
        problem: 'Screen-time limits are easy to dodge: switch browsers or use another device and the allowance resets.',
        decisions: 'Enforce at the OS level, with one shared daily allowance. The first design was a self-hosted TypeScript backend plus a browser extension; I deleted it for Firestore as shared state and a native Electron agent, which removed a server and its firewall problem. Firestore web keys are public, so I wrote security rules that restrict each sync code to its members, capped at 10.',
        result: 'One allowance across an Android phone (Accessibility service) and a Windows PC. A Ctrl+W bug, where the agent logged a closed tab that stayed open, was fixed by switching from PostMessage to SendInput. Over 250 automated tests; CI builds a signed APK plus Windows installer.',
      },
    },
    links: { live: '', github: 'https://github.com/dhruv4740/focuslock' },
  },
  {
    id: 'expense',
    name: 'Expense Tracker',
    year: 2025,
    kind: 'product',
    tagline: 'Logs your spending by reading the receipts your phone already gets.',
    description:
      'React Native app where Kotlin captures SMS and notifications into a peek/ack buffer, and a TypeScript parser logs expenses automatically into local SQLite. It has no account, no cloud and no sync.',
    decision:
      'The native buffer exposes peek and ack rather than drain. Drain-then-process loses events if processing crashes mid-loop; peek-then-ack only marks them consumed after they have actually been handled. Drain stayed behind as a legacy fallback.',
    broke:
      'The parser was inverting refund direction and filing bank boilerplate as real transactions. Separately, the buffered and live copies of one message now share a single timestamp read. Dedup keys bucket by minute, and two clock reads can straddle a boundary.',
    tech: ['React Native', 'Kotlin', 'TypeScript', 'SQLite'],
    links: { live: '', github: 'https://github.com/dhruv4740/expense-tracker' },
  },
  {
    id: 'basket',
    name: 'BasketProof',
    year: 2026,
    kind: 'tool',
    tagline: 'Families in India compare grocery prices across Zepto, Instamart and Blinkit. This app works out the final cart total on each one, after fees.',
    description:
      "Families in India compare grocery prices across Zepto, Instamart and Blinkit. This app works out the final cart total on each one, after fees. If it can't fetch a price, it says so. It never shows a guess.",
    decision: '',
    broke: '',
    badge: "In progress. I'm rebuilding the interface.",
    tech: ['Python', 'FastAPI', 'PostgreSQL', 'Kotlin'],
    summary: 'Families in India compare grocery prices across Zepto, Instamart and Blinkit. This app works out the final cart total on each one, after fees.',
    caseStudy: {
      problem: [
        'Families in India compare grocery prices across Zepto, Instamart and Blinkit. This app works out the final cart total on each one, after fees.',
        "If it can't fetch a price, it says so. It never shows a guess.",
      ],
    },
    links: { live: '', github: '' },
  },
  {
    id: 'darksentinel',
    name: 'DarkSentinel',
    year: 2026,
    kind: 'research',
    tagline: 'Darknet threat monitoring. Top 5 finalist at the IIT Madras × BITS Goa hackathon.',
    description:
      'Team build for the Secure AI Systems and Software Hackathon (BITS Goa, co-organised with IIT Madras), where it was a top 5 finalist in its problem statement. A Random Forest scores CICFlowMeter network flows for Tor traffic. Flagged activity triggers scraping over Tor, the scraped text is classified by RoBERTa and an LLM, and a combined risk score routes it to alerts or an analyst queue. A FastAPI backend serves Streamlit and Next.js dashboards.',
    decision:
      'I wired the Claude call to fire only when the Random Forest is unsure. That means Tor scores between 0.55 and 0.75. It sits behind a 60-second cooldown. Clear cases never reach the paid model, so its cost is bounded by time rather than by traffic volume.',
    broke:
      'A hardcoded fallback T-score could put an anomaly score on the dashboard that the model never produced, which made a missing prediction look like a working one. I removed the fallback from the analysis path.',
    summary: 'A team dark-web traffic monitor that classifies network traffic and shows alerts on a live dashboard.',
    detail: 'I built the LLM review layer. Only predictions the model is unsure about go to an LLM, which keeps inference cost bounded.',
    badge: 'Top 5 finalist in problem statement, IIT Madras & BITS Goa hackathon 2026',
    tech: ['Python', 'FastAPI', 'Next.js', 'Random Forest', 'RoBERTa', 'Claude API', 'Tor', 'Streamlit'],
    caseStudy: {
      problem: [
        'Darknet traffic monitoring needs a classifier.',
        'Sending every flow to a paid LLM would be costly and slow.',
      ],
      decisions: [
        'A Random Forest scores network flows for Tor traffic.',
        'Only Tor scores between 0.55 and 0.75 reach Claude, behind a 60-second cooldown.',
        'I removed a fallback score that could show a result the model never produced.',
      ],
      result: [
        'This was a team build, and Deven did model training and live Tor capture.',
        'I built the dashboards and API features.',
        'Top 5 finalist in our problem statement at IIT Madras x BITS Goa 2026.',
      ],
      pdf: {
        problem: 'Monitoring darknet traffic needs a classifier, but sending every flow to a paid LLM would be costly and slow.',
        decisions: 'A Random Forest scores network flows for Tor traffic. Only predictions in the uncertain zone (Tor score 0.55 to 0.75) go to the Claude call, behind a 60-second cooldown, so cost is bounded by time rather than traffic. I removed a hardcoded fallback score that could show a result the model never produced.',
        result: 'A team build (model training and live Tor capture were Deven’s) with dashboards and an API; top 5 finalist in its problem statement at the IIT Madras x BITS Goa hackathon 2026.',
      },
    },
    links: { live: '', github: '' },
    note: 'Team project in a private repository. Deven owned model training, the LLM work and live Tor capture. I built the dashboards, the API features and the uncertain-zone Claude call.',
  },
  {
    id: 'hexfence',
    name: 'HexFence',
    year: 2026,
    kind: 'product',
    tagline: 'A Safe Guard that refuses lookalike payments, with open address-poisoning evidence on Arkiv.',
    description:
      'Built at ETHGlobal Mumbai 2026. Detects address poisoning, publishes the evidence openly on Arkiv, warns you locally before you sign, and makes a protected Safe refuse to pay a lookalike of an approved supplier while new suppliers still work.',
    decision: '',
    broke: '',
    badge: 'ETHGlobal Mumbai 2026 (5 to 7 Nov)',
    tech: ['Solidity', 'Safe', 'Arkiv', 'viem', 'Hardhat', 'Vite'],
    links: { live: 'https://deven1305.github.io/hexfence/', github: 'https://github.com/Deven1305/hexfence' },
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
      'Built on LangGraph so the verification flow has explicit steps and state rather than one opaque prompt. Every verdict comes from a path you can trace and debug. The model was fixed by what a hackathon budget allows, which made the real problem getting reliable structured output from one constrained model rather than shopping for a better one.',
    broke:
      'The WhatsApp bridge took a day of passes. Twilio posts form-encoded rather than JSON, a FastAPI import was missing, and content-type detection for image and audio had to be reworked. Sixteen commits, one sitting.',
    tech: ['Next.js', 'TypeScript', 'Node.js', 'Python'],
    links: { live: '', github: 'https://github.com/dhruv4740/crisiswatch' },
  },
  {
    id: 'fraud',
    name: 'F-Shield',
    year: 2025,
    kind: 'research',
    tagline: 'Fraud detection for small businesses.',
    badge: 'Winner, Innovathon 2025',
    description:
      'Machine-learning fraud detection for small businesses. It has CSV upload, transaction analysis and a Flask dashboard. Built with a team and won Innovathon 2025.',
    decision: '',
    broke: '',
    tech: ['Python', 'XGBoost', 'Flask', 'pandas'],
    links: { live: '', github: '' },
  },
  {
    id: 'portfolio3d',
    name: '3D Portfolio',
    year: 2026,
    kind: 'product',
    tagline: 'This site is a 3D studio room whose monitor runs live demos of other projects.',
    description: '',
    decision: '',
    broke: '',
    summary: 'An interactive 3D studio room whose monitor runs live demos of my other projects.',
    detail:
      'Detects each visitor\'s GPU and serves a 3D, mobile or no-WebGL version, holding 30 to 60 FPS on integrated graphics.',
    tech: ['Three.js', 'React 19', 'GSAP', 'GLSL', 'Playwright'],
    caseStudy: {
      problem: [
        'A 3D portfolio is slow or unusable on weak GPUs, phones and browsers without WebGL.',
      ],
      decisions: [
        'The site detects each visitor’s GPU and serves a 3D, mobile or no-WebGL version.',
        'The studio room’s monitor runs live demos of my other projects.',
        'Playwright checks cover the interactions.',
      ],
      result: [
        'It holds 30 to 60 FPS on integrated graphics.',
        'The same content is reachable on every tier, including the plain work page.',
      ],
      pdf: {
        problem: 'A 3D portfolio is slow or unusable on weak GPUs, phones and browsers without WebGL.',
        decisions: 'The site detects each visitor’s GPU and serves a 3D, mobile or no-WebGL version. The studio room’s monitor runs live demos of other projects, and Playwright checks cover the interactions.',
        result: 'Holds 30 to 60 FPS on integrated graphics; the same content is reachable on every tier, including the plain work page.',
      },
    },
    links: { live: '/room/', github: '' },
  },
  {
    id: 'blackout',
    name: 'Blackout',
    year: 2026,
    kind: 'product',
    tagline: 'Turns an OLED phone screen fully black while audio keeps playing.',
    description: '',
    decision: '',
    broke: '',
    summary: 'Turns an OLED phone screen fully black while audio keeps playing, saving battery.',
    detail:
      'Fingerprint unlock, a Quick Settings tile, and it uncovers automatically for calls and alarms. No internet permission.',
    tech: ['Kotlin', 'Android'],
    links: { live: '', github: 'https://github.com/dhruv4740/blackout' },
    caseStudy: {
      problem: [
        'On an OLED phone, listening to audio keeps the screen lit and drains battery.',
      ],
      decisions: [
        'Blackout turns the screen fully black while audio keeps playing.',
        'Fingerprint unlock and a Quick Settings tile control it.',
        'It uncovers for calls and alarms and has no internet permission.',
      ],
      result: [
        'It is a Kotlin Android app.',
        'The source is at github.com/dhruv4740/blackout.',
      ],
      pdf: {
        problem: 'On an OLED phone, listening to audio keeps the screen lit and drains battery.',
        decisions: 'Blackout turns the screen fully black while audio keeps playing. Fingerprint unlock and a Quick Settings tile control it, and it uncovers by itself for calls and alarms. It requests no internet permission.',
        result: 'A Kotlin Android app; source at https://github.com/dhruv4740/blackout.',
      },
    },
  },
  {
    id: 'cellbook',
    name: 'Cellbook',
    year: 2026,
    kind: 'product',
    tagline: 'A desktop spreadsheet app modelled on Excel.',
    description: '',
    decision: '',
    broke: '',
    summary: 'A desktop spreadsheet app modelled on Excel, with the same ribbon, menus and formulas.',
    detail: 'The formula engine is HyperFormula and the grid is drawn on a canvas.',
    tech: ['Electron', 'HyperFormula'],
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
    id: 'resume',
    label: 'Résumé',
    ref: 'contact',
    readout: 'READ RÉSUMÉ',
    body: 'One page: experience, highlights, education and skills.',
    href: '/resume/',
    hrefLabel: 'OPEN THE RÉSUMÉ PAGE',
  },
  {
    id: 'window',
    label: 'Window',
    ref: 'contact',
    readout: 'GET IN TOUCH',
    body: `Based in ${identity.location}. Reach me at ${contact.email}.`,
  },
];

// /work sections after the featured cards, in display order.
export const blinkTools = [
  { id: 'outreach', name: 'Creator outreach pipeline', detail: 'Python, SQLite, YouTube Data API and Gmail API, with LLM drafting and human approval before every send.' },
  { id: 'links', name: 'Link-building engine', detail: 'Flask dashboard that found and scored 676 prospect sites and extracted contacts.' },
  { id: 'seo', name: 'SEO and AI-search mention tracking', detail: 'Tracked AI-search citations across 18 prompts.' },
  { id: 'reddit', name: 'Reddit growth copilot', detail: 'Reddit was 29.85% of Blink social traffic (Jun 2026).' },
];

export const personalProjectIds = ['cellbook', 'portfolio3d', 'expense', 'blackout', 'basket'];

export const hackathonProjectIds = ['hexfence', 'fraud'];

// The cards in the "Featured" band, after Blink (built from experience[0]).
export const featuredProjectIds = ['focuslock', 'darksentinel', 'crisiswatch'];

// Facts only, taken from public/resume.pdf. Projects with no résumé line get none.
export const whatIDid = {
  focuslock: 'Kotlin, Android, Electron and Firebase. Backed by over 250 automated tests. CI builds a signed APK plus Windows installer.',
  portfolio3d: 'Three.js, React 19, GSAP, GLSL, Playwright. Detects each visitor’s GPU and serves a 3D, mobile or no-WebGL version, holding 30 to 60 FPS on integrated graphics.',
  darksentinel: 'Built the LLM review layer. Only predictions the model is unsure about go to an LLM, which keeps inference cost bounded. It was a team project, and we were top 5 finalists in our problem statement at the IIT Madras x BITS Goa hackathon 2026.',
  blackout: 'Kotlin, Android. Fingerprint unlock, a Quick Settings tile, and it steps aside for calls and alarms. No internet permission.',
  hexfence: 'Team project with Deven. I made 223 of the repo’s 280 commits.',
};
