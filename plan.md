# MemoryFirewall implementation plan

## Product and architecture
MemoryFirewall is a developer-tool console for inspecting and enforcing AI-agent memory reliability. The demo uses a React/Vite frontend served by an Express backend. The backend keeps a deterministic in-memory repository so the complete scenario works without a database or model key; the API shapes mirror the handoff specification and can later be backed by Drizzle/MySQL.

The core data path is: request -> retrieved memory -> deterministic policy engine -> agent decision -> tool call -> block/allow -> persisted run. Gemma 4 is represented as the reasoning/explanation layer in the UI; critical enforcement remains deterministic.

## Design system
- **Design movement:** dark observability console with editorial data density.
- **Core principles:** evidence first, controlled urgency, compact technical metadata, ten-second demo clarity.
- **Color philosophy:** graphite/navy foundations create calm focus; electric lime means verified safety; coral is reserved for unsafe outcomes; amber signals uncertainty; cyan/violet identifies model activity.
- **Layout paradigm:** fixed command rail plus a responsive evidence workspace, with a prominent split before/after verdict and trace-oriented cards instead of a generic centered dashboard.
- **Signature elements:** shield-and-node mark, lime trace rails, monospace evidence labels.
- **Interaction philosophy:** every action reveals its consequence; demo buttons call the API and update the trace, tables open a passport drawer, and generated tests appear as durable artifacts.
- **Animation:** short ease-out reveals for verdicts and trace steps; subtle pulse only on live/API indicators; no decorative motion competing with unsafe/safe signals.
- **Typography:** system sans for UI and headings; ui-monospace for IDs, statuses, API evidence, and YAML.
- **Brand essence:** the inspectable reliability layer for AI-agent memory; precise, calm, protective.
- **Brand voice:** direct, technical, evidence-led. Example lines: “Memory reliability, made inspectable.” and “Turn one failure into a regression test.”
- **Wordmark & logo:** a lime shield outline containing a connected memory node, paired with MEMORY + FIREWALL wordmark.
- **Signature brand color:** electric lime #c8f169.

## Project structure
- `client/src/App.tsx`: route-aware shell, pages, API-backed interactions, and demo controls.
- `client/src/index.css`: complete dark console design system and responsive layout.
- `server/memoryfirewall.ts`: seeded repository, deterministic policy engine, runs, replay explanations, and regression-test APIs.
- `server/_core/index.ts`: Express server and REST route registration.
- `public/manus-routes.json`: page-route manifest for preview and publication.
- `README.md`: setup, architecture, demo script, API contract, limits, and roadmap.

## Delivery decisions
The managed database is intentionally not required for this demo. The in-memory store preserves state for the running process and leaves clear repository boundaries for a future database adapter. The app is labeled synthetic demo data and never executes a real refund. All required user-facing flows are implemented through REST requests rather than static placeholders.

## Product clarity upgrade: multi-scenario input studio

The fixed “Please refund my order” lab is retained as a compatibility scenario, but the primary Overview experience is now a user-input driven Scenario Studio. It accepts free-form customer requests, policy questions, and developer incidents. Scenario chips provide realistic starting points for refund, account access, cancellation, policy, and webhook incidents. The API matches inputs against a seeded multi-domain memory bank and returns intent, risk, matched memories, provenance/evidence/freshness/scope checks, recommended response, proposed tool action, replay steps, and a generated regression-test name. The deterministic enforcement boundary remains unchanged: high-impact actions are blocked when evidence is insufficient.

## Connected data implementation

The project now uses a file-backed public dataset loader for PolyAI Banking77. At startup, `server/data/banking77-train.csv` is parsed into 10,004 memory passports with dataset provenance, evidence row IDs, confidence, scope, impact, expiry, and status. `/api/data-sources` exposes the source/license/count for UI transparency, `/api/memories` searches the imported records, and `/api/memories/ingest` accepts anonymized JSON records as unverified memories. This makes the demo connected to a real openly licensed dataset while keeping production privacy boundaries explicit.

## Developer workflow upgrade

A compact export of SWE-bench Verified (500 human-validated real GitHub software issues) is loaded from `server/data/swebench-verified.json` into developer-scoped memory passports. `/api/scenarios` exposes the first six issue records as real developer scenario chips. Scenario selection is lifted into the Overview so the selected request and domain are mirrored in the Safety Lab. Baseline and protected run endpoints now accept `{request, domain}` and persist the exact selected issue text in the run, verdict, trace, and replay data. Developer requests route to an operational incident action and remain reviewable when evidence or test history is incomplete.
