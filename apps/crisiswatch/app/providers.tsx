"use client";

import { useEffect } from "react";
import { GamificationProvider } from "./components/ui/gamification";

const TRENDING = [
  { id: "demo-1", claim: "NASA confirms asteroid will hit Earth in 2025", verdict: "FALSE", confidence: 98, category: "tech", checked_count: 2847, checked_at: "2026-09-19T18:30:00.000Z" },
  { id: "demo-2", claim: "New study shows coffee extends lifespan by 10 years", verdict: "MOSTLY_FALSE", confidence: 89, category: "health", checked_count: 1923, checked_at: "2026-09-19T18:15:00.000Z" },
  { id: "demo-3", claim: "Government announces free WiFi for all citizens", verdict: "UNVERIFIABLE", confidence: 45, category: "politics", checked_count: 1456, checked_at: "2026-09-19T18:00:00.000Z" },
  { id: "demo-4", claim: "Electric vehicles cause more pollution than diesel cars", verdict: "FALSE", confidence: 94, category: "climate", checked_count: 3201, checked_at: "2026-09-19T17:30:00.000Z" },
  { id: "demo-5", claim: "AI will replace 50% of jobs by 2030", verdict: "MIXED", confidence: 62, category: "tech", checked_count: 2105, checked_at: "2026-09-19T17:00:00.000Z" },
  { id: "demo-6", claim: "Drinking 8 glasses of water daily is essential for health", verdict: "MOSTLY_TRUE", confidence: 78, category: "health", checked_count: 1678, checked_at: "2026-09-19T16:30:00.000Z" },
];

function checkResult(claim: string) {
  const lower = claim.toLowerCase();
  const verdict = lower.includes("water") || lower.includes("flood") ? "PARTIALLY TRUE" : "FALSE";
  const confidence = verdict === "FALSE" ? 96 : 72;
  return {
    success: true,
    data: {
      claim_id: "demo-claim-001",
      claim,
      verdict,
      confidence,
      severity: verdict === "FALSE" ? "high" : "medium",
      explanation: "DEMO DATA: the claim is compared against a fixed set of sample sources so the real interface can be explored offline.",
      explanation_hindi: "DEMO DATA: यह परिणाम पोर्टफोलियो में स्थानीय नमूना स्रोतों से बनाया गया है।",
      correction: "Check primary sources and current reporting before sharing this claim.",
      sources: 14,
      evidence: [{ source: "Sample source registry", snippet: "DEMO DATA: a representative evidence excerpt.", reliability: 0.92 }],
      side_by_side: { claim_points: [claim], fact_points: ["Sample fact from the demo fixture"], discrepancies: ["Fixture result is intentionally offline"] },
      misinformation_analysis: { primary_issue: "Unverified claim", tactics_detected: [], context_missing: [], manipulation_techniques: [] },
      time: "1.8s",
      cached: true,
    },
  };
}

function installDemoBackend() {
  if (typeof window === "undefined" || (window as Window & { __crisiswatchDemo?: boolean }).__crisiswatchDemo) return;
  (window as Window & { __crisiswatchDemo?: boolean }).__crisiswatchDemo = true;
  const realFetch = window.fetch.bind(window);
  const wait = (value: unknown, ms = 160) => new Promise(resolve => setTimeout(() => resolve(value), ms));
  window.fetch = async (input, init) => {
    const url = typeof input === "string" ? input : input instanceof Request ? input.url : input.toString();
    const path = new URL(url, window.location.origin).pathname;
    if (path === "/apps/crisiswatch/api/check" || path === "/api/check") {
      if ((init?.method || "GET").toUpperCase() === "GET") return wait(new Response(JSON.stringify({ status: "healthy", backend: true, demo: true }), { headers: { "Content-Type": "application/json" } })) as Promise<Response>;
      const body = init?.body ? JSON.parse(String(init.body)) : {};
      return wait(new Response(JSON.stringify(checkResult(String(body.claim || "Sample claim"))), { headers: { "Content-Type": "application/json" } })) as Promise<Response>;
    }
    if (path === "/apps/crisiswatch/api/trending" || path === "/api/trending") {
      const category = new URL(url, window.location.origin).searchParams.get("category") || "all";
      const claims = category === "all" ? TRENDING : TRENDING.filter(claim => claim.category === category);
      return wait(new Response(JSON.stringify({ claims, categories: ["politics", "health", "tech", "climate", "finance", "social"], total: claims.length }), { headers: { "Content-Type": "application/json" } })) as Promise<Response>;
    }
    return realFetch(input, init);
  };

  class DemoEventSource extends EventTarget {
    static CONNECTING = 0;
    static OPEN = 1;
    static CLOSED = 2;
    readyState = DemoEventSource.CONNECTING;
    onmessage: ((event: MessageEvent) => void) | null = null;
    onerror: (() => void) | null = null;
    private timers: ReturnType<typeof setTimeout>[] = [];
    constructor(private url: string) {
      super();
      this.timers.push(setTimeout(() => {
        if (this.readyState === DemoEventSource.CLOSED) return;
        this.readyState = DemoEventSource.OPEN;
        this.emit({ type: "step", step: "searching", message: "DEMO DATA: searching sample sources..." });
      }, 120));
      this.timers.push(setTimeout(() => this.emit({ type: "source", status: "found", source: "Sample source registry", count: 14 }), 300));
      this.timers.push(setTimeout(() => {
        const claim = new URL(this.url, window.location.origin).searchParams.get("claim") || "Sample claim";
        const result = checkResult(claim).data;
        this.emit({ type: "complete", result: { ...result, confidence: result.confidence / 100, claim_text: claim, sources_checked: 14, processing_time_seconds: 1.8 } });
      }, 520));
    }
    private emit(data: Record<string, unknown>) {
      if (this.readyState === DemoEventSource.CLOSED) return;
      const event = new MessageEvent("message", { data: JSON.stringify(data) });
      this.dispatchEvent(event);
      this.onmessage?.(event);
    }
    close() { this.readyState = DemoEventSource.CLOSED; this.timers.forEach(clearTimeout); }
  }
  window.EventSource = DemoEventSource as unknown as typeof EventSource;
}

installDemoBackend();

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => installDemoBackend(), []);
  return <GamificationProvider>{children}</GamificationProvider>;
}
