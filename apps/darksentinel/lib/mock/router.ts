// In-browser stand-in for the Next.js API routes (app/api/**, removed for the
// static export) and the FastAPI backend behind them. Returns Response objects
// from fixtures after a short fake latency. No network is touched.
import { THREATS, threatPage, HEALTH, EXECUTIVE, RECON, INTELLIGENCE, NETWORK, NETWORK_SIM, analysisFor, EXPLAIN, scrub, ALERT_OK, csv } from "./data";

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

export async function handle(request: Request): Promise<Response> {
  const url = new URL(request.url, location.href);
  const path = url.pathname.replace(/^.*\/api\//, "").replace(/\/+$/, "");
  const body: Record<string, unknown> = request.method === "POST" ? await request.clone().json().catch(() => ({})) : {};
  await wait(120 + Math.random() * 280);
  switch (path) {
    case "health": return json(HEALTH);
    case "threats": return json(threatPage(url.searchParams));
    case "analytics/executive": return json(EXECUTIVE);
    case "analytics/recon": return json(RECON);
    case "analytics/intelligence": return json(INTELLIGENCE);
    case "network": return json(request.method === "POST" ? NETWORK_SIM : NETWORK);
    case "analyze": return json(analysisFor(String(body.text ?? body.textSnippet ?? body.hash ?? "")));
    case "analyze/explain": return json(EXPLAIN);
    case "pii/scrub": return json(scrub(String(body.text ?? "")));
    case "pii/audit": return json({ items: THREATS.filter((t) => (t.piiRedactions ?? []).length).map((t) => ({ hash: t.rowHash, redactions: t.piiRedactions })) });
    case "alerts/send":
    case "alerts/test": return json(ALERT_OK);
    case "scan": return json({ scanId: `demo-scan-${Date.now().toString(36)}`, status: "started" });
    case "scan/status": return json({ status: "complete", results: THREATS.slice(0, 8) });
    case "export/csv": return new Response(csv(), { status: 200, headers: { "content-type": "text/csv" } });
    default: return json({ error: `DEMO DATA - no fixture for ${path}` }, 404);
  }
}

// The pipeline page listens to /api/scan/status as an EventSource. Replay a
// staged run from fixtures so the stage cards animate without a backend.
const STAGES = ["APScheduler", "Ahmia Scraper", "ObfusLex Engine", "Guard Agent", "GLiNER-PII Scrubber", "RoBERTa-DDIR", "Blink.new Gateway", "Risk Engine", "n8n Orchestrator"];

type Flagged = Window & { __dsMockES?: boolean };

export function installMockEventSource() {
  if (typeof window === "undefined" || (window as Flagged).__dsMockES) return;
  (window as Flagged).__dsMockES = true;
  const Native = window.EventSource;
  class MockEventSource extends EventTarget {
    url: string;
    readyState = 0;
    onopen: ((e: Event) => void) | null = null;
    onmessage: ((e: MessageEvent) => void) | null = null;
    onerror: ((e: Event) => void) | null = null;
    private timers: number[] = [];
    constructor(url: string) {
      super();
      this.url = url;
      const emit = (data: unknown, at: number) => this.timers.push(window.setTimeout(() => {
        const ev = new MessageEvent("message", { data: JSON.stringify(data) });
        this.onmessage?.(ev);
        this.dispatchEvent(ev);
      }, at));
      this.timers.push(window.setTimeout(() => { this.readyState = 1; this.onopen?.(new Event("open")); }, 50));
      STAGES.forEach((name, i) => {
        emit({ type: "stage-update", stage: i, name, status: "processing", progress: 0.4, metrics: { rows: 8 } }, 300 + i * 700);
        emit({ type: "stage-update", stage: i, name, status: "complete", progress: 1, metrics: { rows: 8 } }, 650 + i * 700);
      });
      emit({ type: "scan-complete", totalRows: 8, safeRows: 7, blockedRows: 1, duration: 6.3, results: THREATS.slice(0, 8) }, 400 + STAGES.length * 700);
    }
    close() { this.timers.forEach(clearTimeout); this.readyState = 2; }
  }
  window.EventSource = function (url: string | URL, init?: EventSourceInit) {
    const s = String(url);
    return /\/api\/scan\/status/.test(s) ? (new MockEventSource(s) as unknown as EventSource) : new Native(url, init);
  } as unknown as typeof EventSource;
}
