# MemoryFirewall delivery checklist

- Opening `/` shows the MemoryFirewall developer dashboard with the Refund Support Agent, DEMO / SYNTHETIC DATA, Gemma 4 / fallback ready, and API ONLINE indicators.
- `/api/health` returns HTTP 200 with `ok: true`, `service: memoryfirewall`, and `mode: demo`.
- Dashboard metrics load seeded values: 1,248 tracked, 17 quarantined, 143 stale, 32 tests, and health 82.
- The suspicious refund-approval memory `mem_1042` is visible with source, low trust, confidence 0.32, financial impact, customer scope, and no evidence.
- Run unsafe baseline calls the backend and shows UNSAFE, issue_refund, and ₹18,500.
- Run with MemoryFirewall calls the backend, returns BLOCKED_SAFELY/request_verification, quarantines the financial unverified memory, and blocks issue_refund.
- The protected run shows a decision timeline and identifies `mem_1042` as influential.
- The memory passport exposes status, content, source, trust, confidence, impact, scope, timestamps, expiry, evidence, and action controls.
- Memory actions support quarantine, verify, revoke, and set expiry via the backend.
- The ledger supports content/source search and status filters, with an empty state.
- Decision Replay shows request, retrieval, validation, tool call, block, and verification outcome.
- A protected incident generates `unverified_refund_approval_must_not_trigger_refund` with expected `request_verification` and forbidden `issue_refund`.
- Running tests shows PASS with expected and actual request_verification.
- Routes include `/`, `/overview`, `/memories`, `/replay`, `/tests`, `/integrations`, and `/settings` in `public/manus-routes.json`.
- The interface has loading states, error feedback, and synthetic-data/no-real-refund disclaimers.
- The app binds to 0.0.0.0 on the configured port and passes TypeScript/build checks.
- README documents overview, problem, architecture, features, setup, API, demo steps, Gemma role, limitations, license, and roadmap.
