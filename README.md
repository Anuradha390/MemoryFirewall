# MemoryFirewall

> **Make AI-agent memory safe, inspectable, and testable.**

MemoryFirewall is a developer console and safety layer for AI agents that use long-term memory. It validates retrieved memories before an agent takes action, identifies stale, contradictory, unverified, or incorrectly scoped information, blocks unsafe high-impact actions, requests human approval, and turns incidents into regression tests.

## Why MemoryFirewall?

AI-agent memory can look like ordinary text while carrying serious risk. A memory may have weak provenance, no evidence, an expired policy, a conflicting claim, or the wrong customer scope. If an agent trusts it blindly, it can issue an unauthorized refund, change account access, or claim that an engineering issue is fixed without proof.

MemoryFirewall focuses on **reliability after retrieval and before action**.

## Core workflow

```text
User request
    ↓
AI-agent memory retrieval
    ↓
Memory Passport
    ↓
Deterministic policy guard
    ├── Safe action
    └── Review / quarantine → Human approval
                                  ↓
                           Decision Replay
                                  ↓
                           Regression Test
```

Every Memory Passport records:

- Provenance and source trust
- Confidence
- Evidence references
- Scope
- Expiry and freshness
- Impact level
- Lifecycle status

The reasoning layer can help interpret claims and explain decisions. The deterministic policy guard remains the final enforcement boundary for high-impact actions.

## Features

- **Scenario Studio** for customer, policy, account, billing, and developer requests
- **Intent-specific analysis** so different inputs produce different memories, risks, actions, and explanations
- **Memory Ledger** with search and status filters
- **Memory Passport** with provenance, evidence, confidence, scope, expiry, and lifecycle controls
- **Deterministic policy enforcement** for financial, security, and operational actions
- **Quarantine and human approval** for unsafe or uncertain decisions
- **Before/after safety lab** showing the unprotected and protected paths
- **Decision Replay** showing the full memory-to-action chain
- **Regression-test generation and execution** from incidents
- **REST API** for integrating an existing agent or memory backend
- **Connected public datasets** using PolyAI Banking77 and SWE-bench Verified records
- **Docker-ready deployment** for services such as Render

## Example scenarios

| Request | Typical result | Proposed action |
|---|---|---|
| Refund request with unverified approval memory | `BLOCKED_SAFELY` | `request_verification` |
| Account email change without identity proof | `BLOCKED_SAFELY` | `verify_identity` |
| Subscription cancellation after renewal | `BLOCKED_SAFELY` or review | `review_cancellation_policy` |
| Current policy question | `REVIEW_REQUIRED` | `answer_with_citations` |
| Billing webhook incident | `REVIEW_REQUIRED` | `create_incident_ticket` |

The application never executes a real refund or real customer action. Demo data is synthetic or sourced from public datasets.

## Technology stack

- **Frontend:** React 19, Vite, TypeScript, Wouter, Lucide React
- **Backend:** Express and TypeScript
- **Policy engine:** Deterministic TypeScript rules
- **Data layer:** Seeded in-memory repository with adapter boundaries for durable storage
- **Datasets:** PolyAI Banking77 and SWE-bench Verified
- **Build and deployment:** pnpm, Vite, esbuild, Docker

## Run locally

### Requirements

- Node.js 22 or later
- pnpm 10.18 or later

### Install and start

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

### Validate the project

```bash
pnpm check
pnpm test
pnpm build
```

## Useful routes

- `/` and `/overview` — Scenario Studio and Safety Lab
- `/memories` — searchable Memory Ledger
- `/replay` — Decision Replay
- `/tests` — regression tests
- `/guide` — product walkthrough
- `/integrations` — integration surfaces
- `/settings` — runtime and policy settings

## API overview

```text
GET  /api/health
GET  /api/dashboard
GET  /api/scenarios
POST /api/analyze
GET  /api/memories
GET  /api/memories/:id
POST /api/memories/:id/action
POST /api/demo/run-baseline
POST /api/demo/run-protected
GET  /api/runs
GET  /api/runs/:runId/explanation
GET  /api/tests
POST /api/tests/generate
POST /api/tests/run
GET  /api/approvals
POST /api/approvals
POST /api/approvals/:id/action
```

Example analysis request:

```bash
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"input":"The billing webhook is failing after deployment","domain":"Engineering"}'
```

## Docker deployment

The repository includes a production Dockerfile:

```bash
docker build -t memoryfirewall .
docker run --rm -p 3000:3000 -e NODE_ENV=production memoryfirewall
```

For a simple full-stack deployment, create a **Docker Web Service** on Render and connect this repository. Render will build the included `Dockerfile` and run the production server.

## Safety and production notes

This repository is a functional prototype. The demo repository is in-memory, so process restarts reset demo users, approvals, imported memories, and run history. Before production use, add durable storage, enterprise authentication, RBAC, encrypted audit logs, rate limiting, privacy controls, and hardened connectors.

The model reasoning layer must not be treated as a security proof. High-impact enforcement should remain deterministic, auditable, and independently testable.

## Project documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Methodology](docs/METHODOLOGY.md)
- [Verification report](VERIFICATION_REPORT.md)
- [Walkthrough video](public/memoryfirewall-walkthrough.mp4)

## License

MIT. See [LICENSE](LICENSE).
