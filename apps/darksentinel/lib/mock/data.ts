// DEMO DATA. Every value here is a visibly fake sample so the real DarkSentinel
// UI can run in the portfolio without its FastAPI backend, Postgres, Tor or n8n.
// Shapes follow types/*.ts and the .json<T>() generics in the components.
import type { Threat, ThreatPageResponse, AnalysisResult } from "@/types/threat";

const now = Date.now();
const ago = (minutes: number) => new Date(now - minutes * 60_000).toISOString();

const CATEGORIES = ["Credential Dump", "Malware Sale", "Exploit Kit", "PII Leak", "Marketplace", "Benign"];
const ENGINES = ["ahmia", "torch", "haystak"];

export const THREATS: Threat[] = Array.from({ length: 24 }, (_, i) => {
  const riskScore = +(((0.97 - i * 0.04) % 1 + 1) % 1).toFixed(2);
  const severity = riskScore >= 0.8 ? "CRITICAL" : riskScore >= 0.6 ? "HIGH" : riskScore >= 0.3 ? "MEDIUM" : "LOW";
  const category = CATEGORIES[i % CATEGORIES.length];
  const hash = `demo${(i + 1).toString(16).padStart(4, "0")}${"0".repeat(28)}`;
  return {
    rowHash: hash,
    source_hash: hash,
    riskScore,
    r_score: riskScore,
    textSnippet: `DEMO DATA - sample listing ${i + 1}: ${category.toLowerCase()} example text for the portfolio build`,
    title: `Sample listing ${i + 1} (demo)`,
    searchEngine: ENGINES[i % ENGINES.length],
    engine: ENGINES[i % ENGINES.length],
    query: "sample query",
    timestamp: ago(i * 37),
    created_at: ago(i * 37),
    category,
    severity,
    consensus: i % 5 === 0 ? "HUMAN_REVIEW" : severity === "LOW" ? "CLEAN" : "THREAT_CONFIRMED",
    robertaCategory: category,
    robertaConfidence: +(0.6 + (i % 4) * 0.1).toFixed(2),
    blinkCategory: category,
    blinkSeverity: severity,
    mitreTags: severity === "LOW" ? [] : ["T1078", "T1566"],
    llm_mitre: severity === "LOW" ? null : "T1078 Valid Accounts",
    llm_mitre_tactic: severity === "LOW" ? null : "Initial Access",
    llm_mitre_tactic_id: severity === "LOW" ? null : "TA0001",
    llm_mitre_technique_name: severity === "LOW" ? null : "Valid Accounts",
    obfuscationDetected: i % 4 === 0,
    obfusFlaggedTokens: i % 4 === 0 ? ["s@mple", "d3mo"] : [],
    piiRedactions: i % 3 === 0 ? [{ type: "EMAIL", count: 1 }] : [],
    guard_status: "safe",
    label: severity === "LOW" ? "benign" : "threat",
  };
});

export function threatPage(params: URLSearchParams): ThreatPageResponse {
  const hash = params.get("hash");
  let items = hash ? THREATS.filter((t) => t.rowHash === hash) : THREATS.slice();
  const sev = params.getAll("severity").flatMap((s) => s.split(",")).filter(Boolean);
  if (sev.length) items = items.filter((t) => sev.includes(t.severity));
  const category = params.get("category");
  if (category) items = items.filter((t) => t.category === category);
  const engine = params.get("engine");
  if (engine) items = items.filter((t) => t.searchEngine === engine);
  const search = params.get("search")?.toLowerCase();
  if (search) items = items.filter((t) => t.textSnippet.toLowerCase().includes(search));
  if (params.get("threatsOnly") === "true") items = items.filter((t) => t.severity !== "LOW");
  if (params.get("obfuscatedOnly") === "true") items = items.filter((t) => t.obfuscationDetected);
  const limit = Number(params.get("limit")) || 20;
  const page = Number(params.get("page")) || 1;
  const total = items.length;
  const pages = Math.max(1, Math.ceil(total / limit));
  return { items: items.slice((page - 1) * limit, page * limit), total, page, pages, source: "local", fallbackActive: false };
}

export const HEALTH = {
  status: "ok",
  n8n_reachable: true,
  postgres_connected: true,
  postgres_rows: THREATS.length,
  notify_medium: false,
  auth_required: false,
  services: {
    tor: { status: "online" }, postgres: { status: "online" }, n8n: { status: "online" },
    fastapi: { status: "online" }, roberta: { status: "online" }, scheduler: { status: "degraded" },
  },
  n8n_outbox: { queue_depth: 0, delivered: 12, failed: 0 },
  session_stats: { total_processed: THREATS.length, n8n_sent: 6, pg_stored: THREATS.length, failed: 0 },
  severity_routing: {
    CRITICAL: "Email + Slack via n8n (immediate)", HIGH: "Slack notification via n8n",
    MEDIUM: "Analyst queue in PostgreSQL", LOW: "Stored in PostgreSQL only",
  },
  cic_live_feed: { last_modified_utc: ago(3), latest_prediction: "Benign", latest_t_score: 0.12, trigger_scrape: false, detected_at: ago(3) },
};

const bySev = (s: string) => THREATS.filter((t) => t.severity === s).length;

export const EXECUTIVE = {
  totalThreats: THREATS.length,
  criticalCount: bySev("CRITICAL"),
  averageRisk: +(THREATS.reduce((a, t) => a + t.riskScore, 0) / THREATS.length).toFixed(2),
  topCategory: "Credential Dump",
  severityTrend: Array.from({ length: 7 }, (_, d) => ({
    date: new Date(now - (6 - d) * 86_400_000).toISOString().slice(0, 10),
    critical: 2 + (d % 3), high: 3 + (d % 2), medium: 4, low: 5 - (d % 2),
  })),
  riskDistribution: [
    { bucket: "0-0.2", count: 4 }, { bucket: "0.2-0.4", count: 5 }, { bucket: "0.4-0.6", count: 5 },
    { bucket: "0.6-0.8", count: 5 }, { bucket: "0.8-1.0", count: 5 },
  ],
  categories: CATEGORIES.map((name) => ({ name, value: THREATS.filter((t) => t.category === name).length })),
  recentCritical: THREATS.filter((t) => t.severity === "CRITICAL").slice(0, 5)
    .map((t) => ({ hash: t.rowHash, title: t.title ?? "", severity: t.severity, score: t.riskScore })),
};

export const RECON = {
  totalQueries: 6, avgMatchRate: 0.62, avgConfidence: 0.74, totalResults: THREATS.length,
  results: ["sample query", "demo credentials", "test marketplace", "example exploit", "placeholder leak", "sample malware"]
    .map((query, i) => ({
      query, totalResults: 4 + i, matchRate: +(0.5 + i * 0.06).toFixed(2),
      avgConfidence: +(0.65 + i * 0.04).toFixed(2), topSources: ENGINES.slice(0, 1 + (i % 3)),
    })),
};

export const INTELLIGENCE = {
  totalAnalyses: THREATS.length, avgAccuracy: 0.87, consensusRate: 0.8,
  engines: [
    { engine: "RoBERTa-DDIR", accuracy: 0.88, avgConfidence: 0.79, totalAnalyzed: THREATS.length, falsePositiveRate: 0.07 },
    { engine: "Blink.new LLM", accuracy: 0.85, avgConfidence: 0.76, totalAnalyzed: THREATS.length, falsePositiveRate: 0.09 },
  ],
  radarData: [
    { subject: "Precision", value: 86 }, { subject: "Recall", value: 82 }, { subject: "Coverage", value: 78 },
    { subject: "Latency", value: 70 }, { subject: "Agreement", value: 80 },
  ],
  recentDisagreements: THREATS.filter((t) => t.consensus === "HUMAN_REVIEW").slice(0, 4)
    .map((t) => ({ hash: t.rowHash, roberta: t.robertaCategory ?? "", blink: "Benign", consensus: "HUMAN_REVIEW" })),
};

export const NETWORK = {
  totalAnomalies: 9, criticalAnomalies: 2, uniqueSources: 6, activeAlerts: 3,
  events: Array.from({ length: 9 }, (_, i) => ({
    id: `demo-${i + 1}`,
    type: ["Port scan", "Beaconing", "DNS tunnel", "Brute force"][i % 4],
    source_ip: `10.0.${i}.${20 + i}`,
    destination: `192.0.2.${i + 1}:443`,
    severity: (["critical", "high", "medium", "low"] as const)[i % 4],
    timestamp: ago(i * 11),
    description: `DEMO DATA - sample anomaly ${i + 1}`,
  })),
};

export const NETWORK_SIM = {
  prediction: "Benign", t_score: 0.18, trigger_scrape: false,
  all_probabilities: { Benign: 0.82, Bot: 0.06, DDoS: 0.05, PortScan: 0.07 },
  detected_at: ago(0), data_source: "DEMO DATA", fallback_used: false,
};

export function analysisFor(text: string): AnalysisResult & Record<string, unknown> {
  const t = THREATS.find((x) => x.textSnippet === text || x.rowHash === text) ?? THREATS[0];
  return {
    roberta: {
      category: t.robertaCategory ?? t.category, confidence: t.robertaConfidence ?? 0.7,
      scores: Object.fromEntries(CATEGORIES.map((c) => [c, c === t.category ? 0.7 : 0.06])),
    },
    blink: { category: t.category, severity: t.severity, mitreTags: t.mitreTags ?? [], reasoning: "DEMO DATA - sample reasoning generated for the portfolio build." },
    consensus: t.consensus ?? "HUMAN_REVIEW",
    riskScore: t.riskScore,
    piiRedactions: t.piiRedactions ?? [],
    category: t.category, severity: t.severity, r_score: t.riskScore, c_score: t.robertaConfidence,
    verdict: t.label, action: t.severity === "CRITICAL" ? "auto_alert" : "log_only",
    llm_reasoning: "DEMO DATA - sample reasoning.", roberta_category: t.robertaCategory, llm_category: t.category,
    llm_mitre: t.llm_mitre, llm_mitre_tactic: t.llm_mitre_tactic, llm_mitre_tactic_id: t.llm_mitre_tactic_id,
    llm_mitre_technique_name: t.llm_mitre_technique_name,
    analyzed_at: ago(0),
  };
}

export const EXPLAIN = { summary: "DEMO DATA - this explanation is a fixed sample; the real deployment asks the LLM gateway.", error: null, model: "demo", generated_at: ago(0) };

export function scrub(text: string) {
  const redactions: Array<{ type: string; original: string; replacement: string }> = [];
  const scrubbed = text
    .replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, (m) => { redactions.push({ type: "EMAIL", original: m, replacement: "[EMAIL]" }); return "[EMAIL]"; })
    .replace(/\b\d{3}[-. ]?\d{3}[-. ]?\d{4}\b/g, (m) => { redactions.push({ type: "PHONE", original: m, replacement: "[PHONE]" }); return "[PHONE]"; });
  return { original: text, scrubbed, redactions };
}

export const ALERT_OK = { n8n_sent: true, n8n_queued: false, pg_stored: true, routed_to: ["demo-slack"], errors: [], test: "DEMO DATA" };

export function csv(): string {
  const head = "rowHash,severity,riskScore,category,engine,timestamp,textSnippet";
  return [head, ...THREATS.map((t) => [t.rowHash, t.severity, t.riskScore, t.category, t.searchEngine, t.timestamp, JSON.stringify(t.textSnippet)].join(","))].join("\n");
}
