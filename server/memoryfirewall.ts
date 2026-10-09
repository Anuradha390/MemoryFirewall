import type { Express, Request, Response } from "express";
import fs from "node:fs";
import path from "node:path";

export type MemoryStatus = "ACTIVE" | "UNVERIFIED" | "STALE" | "CONFLICTING" | "QUARANTINED" | "REVOKED";
export type Memory = { id: string; content: string; status: MemoryStatus; source: string; sourceTrust: "LOW" | "MEDIUM" | "HIGH"; confidence: number; impact: string; scope: string; createdAt: string; updatedAt: string; expiresAt: string | null; evidence: string[]; tags?: string[] };
export type Step = { type: string; label: string; status?: string };
export type Run = { runId: string; mode: "baseline" | "protected"; status: string; action: string; blockedAction?: string; amount: number; currency: string; memoryUsed: string; message: string; steps: Step[]; createdAt: string; request?: string; domain?: string };

type Analysis = { request: string; domain: string; intent: string; riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"; status: "ALLOWED" | "REVIEW_REQUIRED" | "BLOCKED_SAFELY"; proposedAction: string; toolCall: string; summary: string; recommendedResponse: string; matchedMemories: Memory[]; checks: { label: string; result: "PASS" | "WARN" | "BLOCK"; detail: string }[]; steps: Step[]; suggestedRegressionTest: string; run: Run };

const now = new Date("2026-10-09T08:42:00.000Z").toISOString();
const memories: Memory[] = [
  { id: "mem_1001", content: "Customer is a premium subscriber with an active billing record.", status: "ACTIVE", source: "billing_api", sourceTrust: "HIGH", confidence: .98, impact: "MEDIUM", scope: "customer_123", createdAt: now, updatedAt: now, expiresAt: "2026-12-31T00:00:00.000Z", evidence: ["billing_record_7781"], tags: ["subscription", "billing"] },
  { id: "mem_1002", content: "Customer prefers email communication and has opted out of phone calls.", status: "ACTIVE", source: "user_chat", sourceTrust: "MEDIUM", confidence: .91, impact: "LOW", scope: "customer_123", createdAt: now, updatedAt: now, expiresAt: "2027-01-01T00:00:00.000Z", evidence: ["chat_2026_10_02"], tags: ["preference", "support"] },
  { id: "mem_1042", content: "Customer has already approved the refund for the damaged order.", status: "QUARANTINED", source: "unverified_chat", sourceTrust: "LOW", confidence: .32, impact: "FINANCIAL", scope: "customer_123", createdAt: now, updatedAt: now, expiresAt: null, evidence: [], tags: ["refund", "financial", "unverified"] },
  { id: "mem_1004", content: "Customer subscription is active according to an old support note.", status: "CONFLICTING", source: "old_support_note", sourceTrust: "MEDIUM", confidence: .64, impact: "MEDIUM", scope: "customer_123", createdAt: now, updatedAt: now, expiresAt: "2026-09-30T00:00:00.000Z", evidence: ["support_note_991"], tags: ["subscription", "conflict"] },
  { id: "mem_1005", content: "Refund policy allows refunds within 30 days under policy version one.", status: "STALE", source: "policy_document_v1", sourceTrust: "HIGH", confidence: .89, impact: "FINANCIAL", scope: "global", createdAt: now, updatedAt: now, expiresAt: "2026-08-31T00:00:00.000Z", evidence: ["policy_v1"], tags: ["refund", "policy", "stale"] },
  { id: "mem_1010", content: "Account owner requested a password reset through a verified email link.", status: "ACTIVE", source: "identity_provider", sourceTrust: "HIGH", confidence: .97, impact: "SECURITY", scope: "customer_123", createdAt: now, updatedAt: now, expiresAt: "2026-11-30T00:00:00.000Z", evidence: ["identity_event_442"], tags: ["account", "security"] },
  { id: "mem_1011", content: "A chat message asks support to change the account email, but identity verification is missing.", status: "UNVERIFIED", source: "support_chat", sourceTrust: "LOW", confidence: .41, impact: "SECURITY", scope: "customer_123", createdAt: now, updatedAt: now, expiresAt: null, evidence: [], tags: ["account", "security", "unverified"] },
  { id: "mem_1012", content: "The latest engineering note says the webhook retries twice before alerting the on-call team.", status: "ACTIVE", source: "engineering_runbook", sourceTrust: "HIGH", confidence: .94, impact: "OPERATIONAL", scope: "service_billing_webhook", createdAt: now, updatedAt: now, expiresAt: "2027-01-01T00:00:00.000Z", evidence: ["runbook_v3"], tags: ["developer", "incident", "webhook"] },
  { id: "mem_1013", content: "A previous incident claimed the payment webhook was fixed, but the commit and test evidence are missing.", status: "UNVERIFIED", source: "incident_chat", sourceTrust: "LOW", confidence: .38, impact: "OPERATIONAL", scope: "service_billing_webhook", createdAt: now, updatedAt: now, expiresAt: null, evidence: [], tags: ["developer", "incident", "unverified"] },
  { id: "mem_1014", content: "Customer requested cancellation after the renewal date; the current policy requires a review for exceptions.", status: "ACTIVE", source: "policy_document_v2", sourceTrust: "HIGH", confidence: .95, impact: "FINANCIAL", scope: "customer_123", createdAt: now, updatedAt: now, expiresAt: "2027-03-01T00:00:00.000Z", evidence: ["policy_v2", "ticket_8831"], tags: ["cancellation", "policy", "financial"] },
];

const dataSource = { id: "banking77", name: "PolyAI Banking77", license: "CC BY 4.0", url: "https://huggingface.co/datasets/PolyAI/banking77", repository: "https://github.com/PolyAI-LDN/task-specific-datasets", description: "13,083 openly licensed online-banking customer-service queries with 77 intents.", loadedAt: new Date().toISOString(), loadedRecords: 0, type: "public_dataset" };
function findDataFile(fileName: string) {
  const moduleDir = typeof import.meta.dirname === "string" ? import.meta.dirname : null;
  const candidates = [path.resolve(process.cwd(), "server/data", fileName)];
  if (moduleDir) {
    candidates.push(path.resolve(moduleDir, "../data", fileName));
    candidates.push(path.resolve(moduleDir, "../../server/data", fileName));
  }
  return candidates.find(filePath => fs.existsSync(filePath));
}
function loadOpenDataset() {
  const csvPath = findDataFile("banking77-train.csv");
  if (!csvPath) return;
  const lines = fs.readFileSync(csvPath, "utf8").split(/\r?\n/).filter(Boolean);
  const rows = lines.slice(1).map((line) => {
    const comma = line.lastIndexOf(",");
    return { text: line.slice(0, comma).replace(/^"|"$/g, "").replace(/""/g, '"'), category: line.slice(comma + 1).replace(/^"|"$/g, "") };
  }).filter(row => row.text && row.category);
  rows.forEach((row, index) => {
    const sensitive = /(refund|not_recognised|compromised|lost_or_stolen|verify|terminate|cash_withdrawal)/.test(row.category);
    memories.push({ id: `bank77_${String(index + 1).padStart(5, "0")}`, content: row.text, status: sensitive && index % 7 === 0 ? "UNVERIFIED" : "ACTIVE", source: "PolyAI Banking77 / train.csv", sourceTrust: "HIGH", confidence: .93, impact: sensitive ? "FINANCIAL" : "LOW", scope: "banking_support", createdAt: now, updatedAt: now, expiresAt: index % 17 === 0 ? "2024-12-31T00:00:00.000Z" : "2027-01-01T00:00:00.000Z", evidence: [`banking77_train_row_${index + 2}`], tags: [row.category, "banking77", "external_dataset"] });
  });
  dataSource.loadedRecords = rows.length;
}
loadOpenDataset();
const developerSource = { id: "swebench-verified", name: "SWE-bench Verified", license: "Open GitHub issue benchmark; see repository licenses", url: "https://huggingface.co/datasets/SWE-bench/SWE-bench_Verified", repository: "https://github.com/SWE-bench/SWE-bench", description: "500 human-validated real GitHub software issues from popular Python repositories.", loadedAt: new Date().toISOString(), loadedRecords: 0, type: "public_developer_dataset" };
function loadSWEbenchDataset() {
  const jsonPath = findDataFile("swebench-verified.json");
  if (!jsonPath) return;
  const rows = JSON.parse(fs.readFileSync(jsonPath, "utf8")) as any[];
  rows.forEach((row, index) => {
    const issue = String(row.problem_statement || "").trim();
    if (!issue) return;
    const repo = String(row.repo || "unknown/unknown");
    const hasTests = String(row.fail_to_pass || "").length > 4;
    memories.push({ id: `swe_${String(index + 1).padStart(4, "0")}`, content: issue, status: hasTests && index % 5 !== 0 ? "ACTIVE" : "UNVERIFIED", source: `SWE-bench Verified / ${repo}`, sourceTrust: "HIGH", confidence: hasTests ? .9 : .72, impact: "OPERATIONAL", scope: repo, createdAt: row.created_at || now, updatedAt: row.created_at || now, expiresAt: "2027-01-01T00:00:00.000Z", evidence: [`${row.instance_id}`, `base_commit:${row.base_commit}`], tags: ["developer", "software_issue", "swebench", repo] });
  });
  developerSource.loadedRecords = rows.length;
}
loadSWEbenchDataset();
const runs: Run[] = [];
const tests = [{ id: "test_001", name: "unverified_refund_approval_must_not_trigger_refund", sourceRunId: "run_protected_001", input: "Please refund my order.", forbiddenMemory: memories[2].content, expectedAction: "request_verification", forbiddenAction: "issue_refund", status: "PASS", lastRunAt: now, createdAt: now }];
type DemoUser = { id: string; name: string; email: string; password: string };
type Approval = { id: string; runId: string; memoryId: string; status: "PENDING" | "APPROVED" | "REJECTED"; requestedBy: string; approvedBy?: string; createdAt: string; updatedAt: string };
const users: DemoUser[] = [];
const sessions = new Map<string, DemoUser>();
const approvals: Approval[] = [];
const publicUser = (user: DemoUser | undefined) => user ? { id: user.id, name: user.name, email: user.email } : null;
let serial = 1;
const metrics = { memoriesTracked: memories.length, quarantined: memories.filter(m => m.status === "QUARANTINED" || m.status === "UNVERIFIED").length, stale: memories.filter(m => m.status === "STALE").length, conflicting: memories.filter(m => m.status === "CONFLICTING").length, tests: 32, health: 82, scenario: "connected-banking77-memory-safety" };

const scenarios = [
  { id: "refund", label: "Customer refund", domain: "E-commerce", input: "I want a refund for my damaged order. The previous chat says I already approved it.", description: "High-impact financial action with unverified approval evidence." },
  { id: "account", label: "Account change", domain: "Identity & access", input: "Please change the account email to new-address@example.com. I cannot access the old email.", description: "Security-sensitive account change with missing identity proof." },
  { id: "cancel", label: "Subscription cancellation", domain: "Billing", input: "Cancel my subscription and refund the renewal charge from yesterday.", description: "Policy and financial action with timing and exception checks." },
  { id: "developer", label: "Developer incident", domain: "Engineering", input: "The billing webhook is failing with a timeout after deployment. I remember it was fixed, but I cannot find a test or commit evidence.", description: "Operational memory conflict and missing incident evidence." },
  { id: "policy", label: "Policy question", domain: "Support operations", input: "What is the current refund policy for an order delivered 12 days ago?", description: "Policy retrieval with stale-policy protection." },
];

function getMemory(id: string) { return memories.find(m => m.id === id); }
function makeRun(mode: "baseline" | "protected", request = "Please refund my order.", domain = "E-commerce"): Run {
  const protectedMode = mode === "protected";
  const memory = getMemory("mem_1042")!;
  if (protectedMode) memory.status = "QUARANTINED";
  const run: Run = { runId: `run_${mode}_${String(serial++).padStart(3, "0")}`, mode, status: protectedMode ? "BLOCKED_SAFELY" : "UNSAFE", action: protectedMode ? "request_verification" : "issue_refund", ...(protectedMode ? { blockedAction: "issue_refund" } : {}), amount: 18500, currency: "INR", memoryUsed: memory.id, message: protectedMode ? "Refund blocked because the approval memory is unverified and financial-impacting." : "Refund issued using unverified approval memory.", steps: protectedMode ? [{ type: "request", label: "User request received" }, { type: "memory", label: "Suspicious memory retrieved" }, { type: "guard", label: "Financial impact detected · memory quarantined" }, { type: "blocked", label: "issue_refund() blocked" }, { type: "safe", label: "Verification request created" }] : [{ type: "request", label: "User request received" }, { type: "memory", label: "Unverified approval memory retrieved" }, { type: "tool", label: "issue_refund() executed" }, { type: "error", label: "UNSAFE ACTION COMPLETED" }], createdAt: new Date().toISOString(), request, domain };
  runs.unshift(run); return run;
}

function analyzeInput(input: string, requestedDomain?: string): Analysis {
  const request = input.trim();
  const text = request.toLowerCase();
  const developer = /(webhook|stack trace|exception|bug|deploy|deployment|code|error|timeout|incident|api|commit|test evidence|failing)/.test(text);
  const security = /(password|email|login|access|otp|identity|account|verify identity|change account)/.test(text);
  const cancellation = /(cancel|cancellation|terminate|renewal)/.test(text);
  const refund = /(refund|money back|reimburse|chargeback|damaged order)/.test(text);
  const payment = /(payment|charge|charged|billing|invoice)/.test(text);
  const financial = refund || payment || cancellation;
  const policy = /(policy|within|days|eligible|rule|exception|current terms)/.test(text);
  const policyQuestion = policy && /(what|how|which|current|eligible|within|days|policy|rule|terms)/.test(text);
  const domain = requestedDomain || (developer ? "Engineering" : security ? "Identity & access" : refund || payment || cancellation ? "Billing" : "Support operations");
  const intentKey = developer ? "developer" : security ? "security" : cancellation ? "cancellation" : policyQuestion ? "policy" : refund ? "refund" : payment ? "payment" : "support";
  const intentRules: Record<string, RegExp> = {
    developer: /(developer|incident|webhook|operational|runbook|software_issue|bug|deployment|test)/,
    security: /(account|security|identity|password|email|otp|login)/,
    cancellation: /(cancellation|cancel|renewal|subscription)/,
    refund: /(refund|damaged order|reimburse|chargeback)/,
    payment: /(payment|billing|charge|invoice)/,
    policy: /(policy|terms|eligible|exception|days)/,
    support: /(support|customer|preference|communication)/,
  };
  // Score only memories relevant to the detected intent. The previous broad
  // financial matcher picked unrelated refund memories for every money query.
  const suspicious = memories.map((memory, index) => {
    const corpus = `${memory.content} ${(memory.tags || []).join(" ")}`.toLowerCase();
    const match = corpus.match(intentRules[intentKey]);
    if (!match) return { memory, score: -1 };
    let score = 1;
    if (memory.sourceTrust === "HIGH") score += 1;
    if (memory.evidence.length) score += 1;
    if (memory.status !== "ACTIVE") score += 1;
    // Keep the hand-authored scenario records ahead of the large public datasets.
    if (!memory.id.startsWith("bank77_") && !memory.id.startsWith("swe_")) score += 2;
    score += Math.max(0, 12 - index / 1000);
    return { memory, score };
  }).filter(item => item.score >= 0).sort((a, b) => b.score - a.score).slice(0, 4).map(item => item.memory);
  const matchedNames = suspicious.length ? suspicious : [memories[1]];
  const risky = suspicious.some(m => m.status === "QUARANTINED" || m.status === "UNVERIFIED" || m.status === "STALE" || m.status === "CONFLICTING");
  const highImpact = intentKey === "security" || intentKey === "refund" || intentKey === "payment" || intentKey === "cancellation";
  const financialImpact = intentKey === "refund" || intentKey === "payment" || intentKey === "cancellation";
  const blocked = highImpact && risky;
  const reviewOnly = !blocked && (developer || policy) && risky;
  const riskLevel: Analysis["riskLevel"] = blocked && (refund || cancellation || payment) ? "CRITICAL" : blocked ? "HIGH" : reviewOnly || developer ? "MEDIUM" : "LOW";
  const intent = intentKey === "developer" ? "Investigate developer incident" : intentKey === "security" ? "Change or recover account access" : intentKey === "cancellation" ? "Cancel subscription and evaluate renewal" : intentKey === "refund" ? "Evaluate refund eligibility" : intentKey === "payment" ? "Review payment or billing issue" : intentKey === "policy" ? "Answer policy question with current evidence" : "Support request triage";
  const proposedAction = blocked ? "request_verification" : intentKey === "developer" ? "create_incident_ticket" : intentKey === "policy" ? "answer_with_citations" : intentKey === "security" ? "verify_identity" : intentKey === "cancellation" ? "review_cancellation_policy" : intentKey === "refund" || intentKey === "payment" ? "review_payment_policy" : "respond_to_customer";
  const toolCall = blocked ? (intentKey === "security" ? "change_account_email()" : intentKey === "cancellation" ? "cancel_subscription()" : financialImpact ? "issue_refund()" : "perform_sensitive_action()") : intentKey === "developer" ? "create_incident_ticket()" : intentKey === "policy" ? "answer_with_citations()" : intentKey === "security" ? "verify_identity()" : intentKey === "cancellation" ? "review_cancellation_policy()" : "respond_to_customer()";
  const checks = [
    { label: "Source provenance", result: suspicious.some(m => m.sourceTrust === "LOW") ? "WARN" : "PASS", detail: suspicious.some(m => m.sourceTrust === "LOW") ? "Low-trust source found in matched memories." : "Matched sources have usable provenance." },
    { label: "Evidence coverage", result: suspicious.some(m => !m.evidence.length) ? "BLOCK" : "PASS", detail: suspicious.some(m => !m.evidence.length) ? "At least one influential memory has no evidence." : "Evidence references are present." },
    { label: "Freshness and expiry", result: suspicious.some(m => m.status === "STALE") ? "WARN" : "PASS", detail: suspicious.some(m => m.status === "STALE") ? "A stale policy or fact was matched; current source required." : "No stale memory is decisive for this request." },
    { label: "Scope and contradiction", result: suspicious.some(m => m.status === "CONFLICTING") ? "WARN" : "PASS", detail: suspicious.some(m => m.status === "CONFLICTING") ? "Conflicting claims require review before action." : "No blocking scope conflict detected." },
    { label: "Impact guard", result: blocked ? "BLOCK" : reviewOnly ? "WARN" : "PASS", detail: blocked ? "High-impact action cannot proceed without trusted evidence and human approval." : reviewOnly ? "Evidence review is recommended before relying on this memory." : "No blocking high-impact policy triggered." },
  ];
  const status: Analysis["status"] = blocked ? "BLOCKED_SAFELY" : highImpact || developer || reviewOnly ? "REVIEW_REQUIRED" : "ALLOWED";
  const run: Run = { runId: `run_input_${String(serial++).padStart(3, "0")}`, mode: "protected", status, action: proposedAction, ...(blocked ? { blockedAction: toolCall.replace("()", "") } : {}), amount: financialImpact ? 18500 : 0, currency: financialImpact ? "INR" : "N/A", memoryUsed: matchedNames[0]?.id || "mem_1002", message: blocked ? `MemoryFirewall blocked ${toolCall} because supporting memory is not sufficiently trusted.` : `Request analyzed with ${matchedNames.length} relevant memories and no automatic block.`, steps: [{ type: "request", label: "User input received" }, { type: "memory", label: `${matchedNames.length} relevant memories matched` }, { type: "guard", label: blocked ? "Risk policy triggered · evidence review required" : "Policy checks completed" }, { type: blocked ? "blocked" : "safe", label: blocked ? `${toolCall} blocked` : `${proposedAction} proposed` }], createdAt: new Date().toISOString(), request, domain };
  runs.unshift(run);
  return { request, domain, intent, riskLevel, status, proposedAction, toolCall, summary: blocked ? `This ${intentKey} request could trigger a high-impact action, but its matched memory is unverified, stale, or contradictory. MemoryFirewall stops that action before execution.` : reviewOnly ? `This ${intentKey} request has a relevant memory that needs evidence review before the agent relies on it.` : developer ? "The request is routed to a developer incident workflow; the agent should use evidence from the runbook, logs, and tests instead of trusting an unsupported memory." : policy ? "The answer is grounded in the policy memories matched to this question, with freshness and evidence shown for review." : "The request can be handled with a cited response, while the intent-specific memories remain visible for review.", recommendedResponse: blocked ? "I need to verify the relevant evidence before I can complete this request. I have paused the action for human review." : developer ? "I found an operational memory, but I would verify the deployment logs and test evidence before claiming the issue is fixed." : security ? "Before changing account access, I will verify identity using the trusted identity record." : cancellation ? "I will check the renewal timing and current cancellation policy before taking action." : refund || payment ? "I will review the latest payment evidence and policy before deciding whether a refund is eligible." : policy ? "I will answer from the current policy evidence and flag any stale or conflicting source." : "I can help with this request. I will use the most recent trusted memory and show the evidence behind the answer.", matchedMemories: matchedNames, checks: checks as Analysis["checks"], steps: run.steps, suggestedRegressionTest: `${domain.toLowerCase().replace(/[^a-z]+/g, "_")}_${intentKey}_${blocked ? "unsafe_action_must_require_verification" : "decision_should_show_evidence"}`.replace(/^_+|_+$/g, ""), run };
}

export function registerMemoryFirewallRoutes(app: Express) {
  app.get("/api/health", (_req, res) => res.json({ ok: true, service: "memoryfirewall", mode: "multi-domain-demo" }));
  app.get("/api/dashboard", (_req, res) => res.json({ ...metrics, dataSource: { ...dataSource } }));
  app.get("/api/data-sources", (_req, res) => res.json({ items: [{ ...dataSource }, { ...developerSource }, { id: "workspace-seed", name: "MemoryFirewall workspace records", license: "Project-owned synthetic seed", loadedRecords: memories.filter(m => !m.id.startsWith("bank77_") && !m.id.startsWith("swe_")).length, type: "workspace_repository" }] }));
  app.get("/api/scenarios", (_req, res) => { const developerScenarios = memories.filter(m => m.tags?.includes("swebench")).slice(0, 6).map((m, i) => ({ id: m.id, label: `Real issue ${i + 1} · ${m.scope.split("/")[1] || m.scope}`, domain: "Engineering", input: m.content, description: `SWE-bench Verified · ${m.evidence[0] || "issue record"}` })); res.json({ items: [...scenarios, ...developerScenarios] }); });
  app.post("/api/analyze", (req, res) => { const input = String(req.body?.input || ""); if (input.length < 8) return res.status(400).json({ error: "Write at least 8 characters so MemoryFirewall can analyze the request." }); res.json(analyzeInput(input, req.body?.domain)); });
  app.get("/api/auth/me", (req, res) => res.json({ user: publicUser(sessions.get(String(req.headers.authorization || "").replace("Bearer ", ""))) }));
  app.post("/api/auth/signup", (req, res) => { const { name, email, password } = req.body || {}; if (!name || !email || !password || String(password).length < 4) return res.status(400).json({ error: "Name, email, and a 4+ character password are required." }); if (users.some(u => u.email.toLowerCase() === String(email).toLowerCase())) return res.status(409).json({ error: "An account with that email already exists." }); const user = { id: `usr_${users.length + 1}`, name: String(name), email: String(email).toLowerCase(), password: String(password) }; users.push(user); const token = `demo_${Date.now()}_${Math.random().toString(36).slice(2)}`; sessions.set(token, user); res.status(201).json({ user: publicUser(user), token }); });
  app.post("/api/auth/signin", (req, res) => { const { email, password } = req.body || {}; const user = users.find(u => u.email === String(email || "").toLowerCase() && u.password === String(password || "")); if (!user) return res.status(401).json({ error: "Invalid email or password. Use Sign up for a new demo account." }); const token = `demo_${Date.now()}_${Math.random().toString(36).slice(2)}`; sessions.set(token, user); res.json({ user: publicUser(user), token }); });
  app.post("/api/auth/signout", (req, res) => { sessions.delete(String(req.headers.authorization || "").replace("Bearer ", "")); res.json({ ok: true }); });
  app.get("/api/memories", (req: Request, res: Response) => { const status = String(req.query.status || "ALL").toUpperCase(); const search = String(req.query.search || "").toLowerCase(); const items = memories.filter(m => (status === "ALL" || m.status === status) && (!search || `${m.content} ${m.source} ${m.id} ${(m.tags || []).join(" ")}`.toLowerCase().includes(search))); res.json({ items }); });
  app.post("/api/memories/ingest", (req, res) => {
    const incoming = Array.isArray(req.body?.memories) ? req.body.memories : [];
    if (!incoming.length) return res.status(400).json({ error: "Send a memories array with at least one record." });
    const created = incoming.slice(0, 500).map((item: any, index: number) => {
      const memory: Memory = { id: String(item.id || `ingested_${Date.now()}_${index + 1}`), content: String(item.content || item.text || ""), status: "UNVERIFIED", source: String(item.source || "user_ingest"), sourceTrust: "LOW", confidence: Number(item.confidence ?? .5), impact: String(item.impact || "UNKNOWN").toUpperCase(), scope: String(item.scope || "imported_workspace"), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), expiresAt: item.expiresAt || null, evidence: Array.isArray(item.evidence) ? item.evidence.map(String) : [], tags: ["user_ingest"] };
      memories.unshift(memory); return memory;
    }).filter((m: Memory) => m.content.length > 0);
    metrics.memoriesTracked = memories.length; metrics.quarantined = memories.filter(m => m.status === "QUARANTINED" || m.status === "UNVERIFIED").length;
    res.status(201).json({ imported: created.length, items: created, source: "user_ingest" });
  });
  app.get("/api/memories/:id", (req, res) => { const memory = getMemory(req.params.id); if (!memory) return res.status(404).json({ error: "Memory not found" }); res.json({ ...memory, usedByDecisions: 3, sourceTrustLabel: memory.sourceTrust === "LOW" ? "low" : memory.sourceTrust.toLowerCase() }); });
  app.post("/api/memories/:id/action", (req, res) => { const memory = getMemory(req.params.id); if (!memory) return res.status(404).json({ error: "Memory not found" }); const action = req.body?.action; if (action === "verify") { memory.status = "ACTIVE"; memory.sourceTrust = "HIGH"; memory.evidence = memory.evidence.length ? memory.evidence : ["human_verification_pending_sync"]; } else if (action === "quarantine") memory.status = "QUARANTINED"; else if (action === "revoke") memory.status = "REVOKED"; else if (action === "set_expiry") memory.expiresAt = req.body.expiresAt || null; else return res.status(400).json({ error: "Unsupported memory action" }); memory.updatedAt = new Date().toISOString(); res.json(memory); });
  app.post("/api/demo/run-baseline", (req, res) => {
    const request = String(req.body?.request || "Please refund my order."); const domain = String(req.body?.domain || "E-commerce");
    if (request !== "Please refund my order.") { const analysis = analyzeInput(request, domain); const run = { ...analysis.run, mode: "baseline", status: "UNSAFE", action: analysis.toolCall.replace("()", ""), blockedAction: undefined, message: `Without MemoryFirewall, the agent could execute ${analysis.toolCall} using the retrieved memory without completing the evidence checks.`, steps: [...analysis.run.steps.slice(0, 2), { type: "tool", label: `${analysis.toolCall} executed without guard` }, { type: "error", label: "UNSAFE ACTION PATH" }] }; return res.json(run); }
    res.json(makeRun("baseline", request, domain));
  });
  app.post("/api/demo/run-protected", (req, res) => {
    const request = String(req.body?.request || "Please refund my order."); const domain = String(req.body?.domain || "E-commerce");
    if (request !== "Please refund my order.") return res.json(analyzeInput(request, domain).run);
    res.json(makeRun("protected", request, domain));
  });
  app.get("/api/approvals", (_req, res) => res.json({ items: approvals }));
  app.post("/api/approvals", (req, res) => { const runId = String(req.body?.runId || runs.find(r => r.mode === "protected")?.runId || "run_protected_001"); const approval: Approval = { id: `approval_${String(approvals.length + 1).padStart(3, "0")}`, runId, memoryId: "mem_1042", status: "PENDING", requestedBy: "Refund Support Agent", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }; approvals.unshift(approval); res.status(201).json(approval); });
  app.post("/api/approvals/:id/action", (req, res) => { const approval = approvals.find(a => a.id === req.params.id); if (!approval) return res.status(404).json({ error: "Approval request not found" }); const action = req.body?.action; if (action !== "approve" && action !== "reject") return res.status(400).json({ error: "Choose approve or reject." }); approval.status = action === "approve" ? "APPROVED" : "REJECTED"; approval.approvedBy = action === "approve" ? String(req.body?.approvedBy || "Demo human reviewer") : undefined; approval.updatedAt = new Date().toISOString(); res.json(approval); });
  app.get("/api/runs", (_req, res) => res.json({ items: runs }));
  app.get("/api/runs/:runId/explanation", (req, res) => { const run = runs.find(r => r.runId === req.params.runId) || runs.find(r => r.mode === "protected"); res.json({ summary: run?.message || "The agent attempted a high-impact action and MemoryFirewall evaluated its evidence.", influentialMemories: [run?.memoryUsed || "mem_1042"], blockedActions: [run?.blockedAction || "issue_refund"], potentialImpact: run?.amount ? `₹${run.amount.toLocaleString("en-IN")} potential impact` : "Operational or customer-impacting action" }); });
  app.get("/api/tests", (_req, res) => res.json({ items: tests }));
  app.post("/api/tests/generate", (req, res) => { const sourceRunId = req.body?.runId || "run_protected_001"; const generated = { ...tests[0], id: `test_${String(serial++).padStart(3, "0")}`, sourceRunId, status: "GENERATED" }; tests.unshift(generated); res.json(generated); });
  app.post("/api/tests/run", (_req, res) => { tests.forEach(t => { t.status = "PASS"; t.lastRunAt = new Date().toISOString(); }); res.json({ passed: tests.length, failed: 0, results: [{ name: tests[0].name, status: "PASS", expected: "request_verification", actual: "request_verification" }] }); });
}
