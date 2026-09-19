# 🧢 Fact or Cap - Frontend

> **Real-time misinformation detection. No cap.**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-crisiswatch--web.vercel.app-blue?style=for-the-badge)](https://crisiswatch-web.vercel.app)
[![Backend API](https://img.shields.io/badge/API-crisiswatch--uoj4.onrender.com-green?style=for-the-badge)](https://crisiswatch-uoj4.onrender.com/docs)

## 🔗 Quick Links

| Resource | URL |
|----------|-----|
| **🌐 Live Website** | https://crisiswatch-web.vercel.app |
| **⚡ Backend API** | https://crisiswatch-uoj4.onrender.com |
| **📖 API Docs** | https://crisiswatch-uoj4.onrender.com/docs |
| **🔧 Frontend Repo** | https://github.com/dhruv4740/crisiswatch-web |
| **🐍 Backend Repo** | https://github.com/dhruv4740/crisiswatch |

---

## 🎯 What It Does

**Fact or Cap** is an AI-powered fact-checking app that helps you verify claims in seconds:

1. **Paste any claim** - News headlines, tweets, viral messages
2. **AI searches 10+ sources** - Wikipedia, news APIs, fact-checkers
3. **Get a verdict** - TRUE, FALSE, MIXED, or UNVERIFIABLE
4. **See the evidence** - Sources, confidence scores, explanations
5. **Share results** - Twitter, WhatsApp, copy to clipboard

---

## 🚀 Try It Now

### 👉 https://crisiswatch-web.vercel.app

Just visit the website, paste a claim, and click "Check if it's cap"!

---

## 🛠️ Run Locally

```bash
# Clone the repo
git clone https://github.com/dhruv4740/crisiswatch-web.git
cd crisiswatch-web

# Install dependencies
npm install

# Run development server
npm run dev

# Open http://localhost:3000
```

### Environment Variables (Optional)

Create `.env.local` to use your own backend:

```env
BACKEND_URL=http://localhost:8000
```

---

## 🧩 Browser Extension

The extension is in the `crisiswatch-extension/` folder.

### Installation (Chrome Developer Mode)

1. Open Chrome → `chrome://extensions/`
2. Enable **"Developer mode"** (top right toggle)
3. Click **"Load unpacked"**
4. Select the `crisiswatch-extension` folder

### How to Use

1. Select any text on a webpage
2. Click the Fact or Cap extension icon
3. See instant fact-check results!

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| **Real-time Streaming** | Watch sources being searched live |
| **Voice Input** | Speak your claim using the microphone |
| **Gamification** | Earn badges, build streaks, track stats |
| **Social Sharing** | Share on Twitter, WhatsApp, copy link |
| **Trending Claims** | See what others are fact-checking |
| **Bilingual** | English + Hindi explanations |
| **Dark Mode** | Beautiful dark UI |
| **Mobile Responsive** | Works on all devices |

---

## 🎮 Gamification

Earn badges by fact-checking claims:

| Badge | Requirement |
|-------|-------------|
| 🎯 First Check | Check 1 claim |
| 💥 Myth Buster | Bust 10 myths |
| 🔍 Truth Seeker | Seek truth 25 times |
| 🕵️ Cap Detective | Detect 50 caps |
| 🏆 Fact Champion | Check 100 claims |

Track your:
- **Today's Checks** - Claims checked today
- **Cap Rate** - % of claims that were false
- **Day Streak** - Consecutive days fact-checking
- **Total Checks** - Lifetime claims checked

---

## 🛠️ Tech Stack

| Technology | Purpose |
|------------|---------|
| **Next.js 14** | React framework with App Router |
| **TypeScript** | Type safety |
| **Tailwind CSS** | Styling |
| **Framer Motion** | Animations |
| **canvas-confetti** | Badge unlock celebrations |
| **Web Speech API** | Voice input |
| **Vercel** | Hosting |

---

## 📁 Project Structure

```
crisiswatch-web/
├── app/
│   ├── page.tsx              # Main landing page
│   ├── layout.tsx            # Root layout
│   ├── globals.css           # Global styles
│   ├── api/                  # API routes (proxy to backend)
│   │   ├── check/            # Claim checking endpoints
│   │   └── trending/         # Trending claims
│   └── components/
│       ├── sections/         # Page sections
│       │   ├── hero.tsx
│       │   ├── features.tsx
│       │   ├── live-demo.tsx # Main fact-checker
│       │   ├── trending.tsx
│       │   └── footer.tsx
│       └── ui/               # Reusable components
│           ├── gamification.tsx
│           ├── verdict-card.tsx
│           └── glass-card.tsx
├── crisiswatch-extension/    # Browser extension
├── public/                   # Static assets
└── package.json
```

---

## 📈 Verdict Types

| Verdict | Display | Color |
|---------|---------|-------|
| `TRUE` | NO CAP | Green |
| `MOSTLY_TRUE` | LOWKEY TRUE | Green |
| `MIXED` | KINDA TRUE | Yellow |
| `MOSTLY_FALSE` | MOSTLY CAP | Red |
| `FALSE` | THAT'S CAP | Red |
| `UNVERIFIABLE` | CAN'T TELL | Gray |

---

## 🏆 Hackathon

Built for the **CrisisWatch Hackathon 2025** - Misinformation Track

**Team**: Dhruv

---

## 📄 License

MIT

---

**No cap. Just facts.** 🧢
