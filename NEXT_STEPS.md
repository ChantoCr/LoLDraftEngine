# NEXT_STEPS.md

## Purpose
This file captures the recommended execution roadmap after the current state of the project.

## Current snapshot after today's work
Completed or substantially improved today:
- frontend Data Dragon loading now supports the full champion roster
- special patch token `latest` now resolves to the newest available Data Dragon patch
- patch selector UI now exists, so users can pin `latest`, `16.8.1`, or another Data Dragon version
- draft board search now shows visible clickable search results
- manual drafting can use any champion in any lane slot
- mock live mode now works without backend recognition dependency
- Riot/backend recognition errors are surfaced more clearly
- desktop companion ingest contract now supports acking, auth token, heartbeat, companion metadata, and retry metadata
- desktop companion local runtime scaffold now exists
- file-based bridge-compatible local companion runner now exists

Current validated state:
- `npm run test:run` passes
- `npm run build` passes
- 28 test files
- 53 tests passing

---

## Priority 1 — Real desktop companion bridge
### Goal
Turn the desktop-client backend scaffold into a real local ingestion process capable of reading champion-select state and posting it to the backend.

### Why this is first
Riot public APIs are not enough for true live draft sync. The local bridge is the most realistic path to real-time pick/ban updates.

### What is already done
Implemented now:
- desktop ingest endpoint scaffold
- ingest ack payload
- mock ingest sequence endpoint
- optional companion auth header support via `DESKTOP_COMPANION_TOKEN`
- heartbeat/session health updates
- retry/delivery-attempt metadata support
- mock desktop companion runtime
- file-based bridge-compatible desktop companion runtime

### Deliverables still needed
- a local companion process/app that reads real LoL client state
- real champion-select source adapter
- source-to-`DraftState` mapper
- reconnect and polling strategy hardened for live client changes
- validation under rapid draft updates

### Suggested next tasks
1. define the **real desktop companion source contract** precisely
2. add an **LCU-compatible polling adapter scaffold**
3. map local champ-select payloads into internal `DraftState`
4. add source-level reconnect and retry behavior
5. add rapid-update integration tests
6. add optional session dedupe / stale-event protection if needed

### Recommended implementation order inside Priority 1
1. desktop source DTOs and adapter interface
2. LCU/bridge-compatible polling client scaffold
3. champ-select mapper -> internal `DraftState`
4. runtime integration with existing ingest endpoint
5. rapid-update tests and session-health assertions

---

## Priority 2 — Curated champion trait dataset
### Goal
Move from scaffold-only traits to persistent patch-aware curated trait data.

### Why this is second
The UI can now expose the full champion roster through Data Dragon, but recommendation quality still depends on good trait fidelity.

### Deliverables
- patch-scoped champion trait JSON files
- override system on top of scaffold generation
- validation tools for missing champions
- confidence distinction between curated and inferred traits

### Suggested tasks
1. create `data/traits/<patch>.json`
2. define schema for traits + rationale + confidence
3. merge curated values over scaffold values
4. add test coverage for missing/partial data
5. add tooling to diff new Data Dragon patch champions vs current trait coverage

---

## Priority 3 — Real external stats provider integration
### Goal
Replace fixture-only external stats with a real provider or backend aggregation pipeline.

### Why this is now more urgent
The project can already load the full Data Dragon roster and latest patch data. The next major quality unlock is real matchup, synergy, and meta data instead of placeholder/fallback-only behavior.

### Deliverables
- production external stats adapter
- patch-aware matchup signals
- patch-aware synergy signals
- role meta signals
- cache/freshness strategy

### Suggested tasks
1. choose provider or aggregation source
2. wire `EXTERNAL_STATS_URL`
3. add failure fallback behavior
4. add low-confidence/stale data logic
5. add contract tests for real payload shapes

### Recommendation
After the next desktop companion milestone, this should likely be the next major system to build.

---

## Priority 4 — AI Coach integration
### Goal
Connect OpenAI/Pi prompting to structured outputs from deterministic systems.

### Deliverables
- structured AI prompt inputs
- pick comparison flows
- what-if explanations
- concise vs deep explanation modes

### Suggested tasks
1. define AI input DTOs
2. map recommendation breakdown + comp profile into prompts
3. add UI follow-up flows
4. prevent unsupported claims when signals are weak

---

## Priority 5 — Draft UX expansion
### Goal
Improve practical usability of the drafting workflow.

### Deliverables
- what-if simulation branches
- comparison panels
- saved draft history
- draft timeline/pick order improvements
- clearer ban/pick state transitions

### Suggested tasks
1. saved scenarios
2. side-by-side pick comparison
3. draft export/import
4. timeline interaction model

### Note
A good chunk of practical UX work was already done today:
- patch selector
- latest-patch workflow
- visible clickable champion search results
- unrestricted lane assignment for manual exploration

---

## Priority 6 — Testing expansion
### Goal
Keep regressions under control as live sync and all-champion support expand.

### Suggested tasks
1. more scenario fixtures
2. backend route tests
3. integration tests for SSE flow
4. champion trait coverage tests
5. recommendation regression snapshots per patch
6. desktop companion runtime and mapper tests for rapid local updates

---

## Recommended immediate execution order
1. Real desktop companion source adapter
2. Curated champion trait dataset persistence
3. Real external stats provider connection
4. AI Coach orchestration
5. Expanded UX flows

---

## Tomorrow's recommended first coding task
If continuing in a new chat, start here:

### Step 1
Implement the **desktop companion real source contract**.

### Step 2
Add an **LCU-compatible polling adapter scaffold** that can later be wired to the actual local LoL client.

### Step 3
Implement the **champ-select payload -> internal `DraftState` mapper**.

That path keeps the project aligned with the real product goal: true live draft sync through a local bridge, not through Riot public APIs alone.

---

## Key reminder
Keep this hierarchy intact:
1. deterministic domain truth
2. stats-informed enhancement
3. AI explanation layer

Do not invert this by making AI the recommendation authority.
