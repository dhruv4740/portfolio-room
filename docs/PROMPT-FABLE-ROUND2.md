# Fable 5.1 — round 2

Use the same system prompt as `docs/PROMPT-FABLE-LEAD.md`. This file is the
first user message. Effort: `xhigh`.

---

Read `AGENTS.md`, the top of `docs/HANDOFF.md`, and your own round-1 notes there.

You are the lead on this repo. The owner's words: Fable "will do the hardest jobs,
and future scope and ideas"; Gemini is "the workhorse with best limits". Gemini
gets its own brief in parallel (`docs/PROMPT-R8-GEMINI.md`) and can take whatever
you delegate. You can rewrite its brief, add to it, or review its output.

## What the owner saw after round 1

- **"hands are unrealistic, wrist part is very weird."** Your rig is better than
  what it replaced, but it still doesn't pass his eye. Judge it yourself in the
  running room, not from the tests.
- **"awards and monitor are merging."** From the seat, the award frame on the
  desk (`WORKSPACE.anchors.award`, `[-0.5, 1.335, -0.05]`) visually overlaps the
  monitor.

## Your jobs

1. **The hands and wrist.** Still the main open problem in the room.
2. **The awards frame against the monitor.**
3. **Real project UIs: the embedding pattern.** Gemini's round 7 redrew each
   project by hand as HTML strings in `public/os/apps/*.js`, because the brief
   required dependency-free apps. The owner rejected that: he wants **his actual
   UI**, built from each repo. The stacks:

   | Project | Repo | Stack | Runs on |
   |---|---|---|---|
   | DarkSentinel | `C:\Users\hp\OneDrive\Documents\demo_website\darksentinel-ui` | Next.js, framer-motion, recharts | monitor |
   | CrisisWatch | `C:\Users\hp\AppData\Local\Temp\resume-audit\crisiswatch-web` | Next.js with API routes, GSAP, framer-motion | monitor |
   | Fraud Detection | `C:\Users\hp\kharghar-hacks\kharghar` | React/Vite, Firebase, recharts, tsparticles | monitor |
   | FocusLock desktop | `C:\Users\hp\OneDrive\Desktop\new-focuslock\windows-agent` | Electron renderer, Firebase | monitor |
   | Expense Tracker | `C:\Users\hp\expense-tracker` | React Native | phone |
   | BasketProof | `C:\Users\hp\OneDrive\Desktop\comparison` | Kotlin, Jetpack Compose | phone |
   | FocusLock Android | `new-focuslock` | Android | phone (already built, round 5) |

   The owner chose: build the real frontends, replace backends, API routes and
   Firebase with in-browser fake data, and run the built output inside a
   dhruvOS window or on the phone. Decide how that works:
   - how a Next.js app with API routes becomes static and mocked;
   - how built apps are served and framed in dhruvOS without breaking the
     shell's window lifecycle or the persistent iframe (`DhruvOSScreen.jsx`);
   - what to do with React Native (web export?) and with Compose, which cannot
     run in a browser;
   - load cost, since each app is only fetched when opened.

   Prove the pattern on the hardest app, then write the recipe into Gemini's
   brief so it can do the rest.
4. **Readability standard.** The owner: apps "should look good and zoomed in and
   flattering, people shouldnt have to squint to see the ui elements". That goes
   for phone and monitor. Define what that means in practice (scale, how the
   camera frames the screen, minimum text size), and whether it is a rendering
   change on your side or an app change on Gemini's.
5. **The black void** outside the room. Still his decision. Propose options with
   screenshots.
6. **Leftovers from round 1:** the coffee-sip wrist angle (~84°), the lamp reach
   with no arc, and GPU cost of the rig. Fps on real hardware waits on the owner
   reading GPU MS on his laptop.
7. **Future scope and ideas.** Write `docs/IDEAS.md`: what would make this
   portfolio better, ranked by what it would cost and how much it would matter to
   the two audiences (builders first, internship screeners second). Ideas only.
   Nothing gets built from it without the owner's say.

## Owner decisions already made

- Reddit Growth Copilot stays out of the project apps.
- The Skills app (falling physics chips, `public/os/apps/gravity.js`) goes. His
  words: "whatever is the best and readable, why did we build this if noone can
  read it at all". Gemini replaces it; review the result.
- Speakers and headphones sound the same now (commit 2a1a76f).
- **Ask him before decisions that are his.** He said so again this round: "ask me
  before doing things, dont assume on my behalf".
