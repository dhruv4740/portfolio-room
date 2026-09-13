# Open questions — waiting on Dhruv

Ask for these. Do not invent answers; every field below renders as nothing when
empty, which is safe, whereas a fabricated one gets caught in an interview.

## Outstanding

1. **DarkSentinel — what was your part, and what broke?**
   Private team repo, so it could not be read. `decision` and `broke` are empty
   in `src/v3/content/index.js`. Needed: which components he personally built
   (CICFlowMeter capture / the RF + RoBERTa classifier / Tor scraping / the
   FastAPI + Streamlit interface), and one real problem he hit.

2. **Résumé PDF.** He confirmed it should be downloadable and will supply the
   file. When it arrives: drop it at `public/resume.pdf`, then set
   `contact.resume = '/resume.pdf'`. The button stays hidden while that is
   empty, so a missing file can never 404.
   Note: the PDF he has is stale — it omits FocusLock, DarkSentinel, Expense
   Tracker and Basket Price entirely, and says "second-year" when he is in his
   third. Worth regenerating before publishing it.

3. **Three lab demos need a call** (see `docs/LAB-AUDIT.md`):
   - `video3d` — renders an SMPTE colour-bar placeholder and does not respond to
     scroll. Looks like real footage was never added. Recommend pulling it.
   - `tear` — almost certainly fine; the audit tested it with a mouse *move*
     when the demo asks for a *drag*. Needs a correct re-test, not a fix.
   - `singularity` — renders a real shader scene; only its "even the text is
     GLSL" claim is unconfirmed.

4. **`particles` (Particle Genesis)** — renders a blank white page with no
   console or network errors. Suspected float-texture path failing under
   SwiftShader, so it may work fine on a real GPU. Excluded from the OS lab
   launcher until checked in a real browser on his machine.

5. **Deployment** — no remote, host or domain chosen yet. Nothing has been
   pushed; `git push` is blocked until he supplies a remote.

6. **`og:image`** — absent, so shared links preview as bare text. Waiting on the
   finished night-lit room so the share image is the real thing.

## Answered — do not re-ask

- **Art direction**: night. Monitor is the brightest object; lamp warm, blinds
  cool. See `docs/ASTRA-3D-BRIEF.md`.
- **Inside the monitor**: dhruvOS, which already exists and retains state.
- **Basket Price**: ships, with neutral framing. No mention of scraping, terms
  of service, or the specific delivery companies' storefront mechanics.
- **Lab demo labels**: none. The container is called Lab; per-card "EXPERIMENT"
  tags were removed — labelling your own work as lesser reads as apologising
  for it.
- **Project set**: show all, ranked by depth. FocusLock, Expense Tracker and
  Basket Price lead; hackathon pieces sit below.
- **CrisisWatch decision**: framed around the constraint (fixed model, so the
  problem was reliable structured output from it) and LangGraph giving the
  verification flow traceable steps. Do **not** write anything implying the
  architecture was poor or that he did not know what he was doing.
- **LinkedIn**: linkedin.com/in/dhruv4740
