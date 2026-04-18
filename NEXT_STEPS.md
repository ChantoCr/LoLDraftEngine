# NEXT_STEPS.md

## Purpose
This file captures the recommended execution roadmap after the current state of the project.

## Current snapshot after this chat
Completed or substantially improved during this session:
- desktop companion source contracts are now typed and runtime-oriented
- an LCU-compatible champ-select mapper -> internal `DraftState` now exists
- lockfile-based LCU credential discovery now exists
- local self-signed HTTPS-compatible LCU polling support now exists
- `desktop:lcu` runtime wiring now exists
- desktop stale/duplicate ingest protection now exists
- desktop mock triggering can now be done directly from the UI
- `DESKTOP_CLIENT` no longer requires Riot name/tag input
- RIOT_API mode now stays connected/informational instead of pretending unsupported streaming is an error
- Riot active-game roster snapshots can now be mapped into internal `DraftState` when spectator APIs expose the live game roster
- a deterministic live game-plan layer now exists
- the AI coach panel is now richer and grounded in deterministic game-plan outputs

Current validated state:
- `npm run test:run` passes
- `npm run build` passes
- 38 test files
- 78 tests passing

---

## Priority 1 — Riot live-game snapshot hardening
### Goal
Make `RIOT_API` reliably useful as a **live-game roster analysis mode** even though Riot public APIs still cannot provide real champ-select streaming.

### Why this matters now
Desktop-client live sync is in a much stronger state. The next best value from Riot mode is to populate the board from an active live game when spectator data exists, then feed composition/matchup/game-plan analysis from that state.

### What is already done
Implemented now:
- Riot account recognition
- summoner profile lookup
- active-game checks
- active-game failure handling improvements
- Riot active-game roster -> `DraftState` mapper
- initial and polled Riot live-game snapshot support

### Remaining deliverables
- better role inference for Riot live-game rosters
- clearer spectator-unavailable messaging
- debug visibility for whether a Riot live roster was mapped successfully
- optional timeline/debug events for Riot polling
- more real-world active-game fixture coverage

### Suggested next tasks
1. improve Riot roster role inference beyond simple order-based placement
2. add a Riot snapshot debug panel / event visibility
3. add route/adapter tests for spectator-unavailable and roster-available transitions
4. add more recorded active-game payload fixtures
5. keep Riot mode explicitly framed as live-game analysis, not draft streaming

---

## Priority 2 — Live Game Plan / Coach expansion
### Goal
Turn the existing deterministic game-plan layer into a more useful gameplay assistant once the board is populated from Desktop Client or Riot live-game snapshots.

### Why this is next
The board, analyzer, and recommendations already work. The most product-visible gain now is better role-specific and matchup-specific coaching.

### What is already done
Implemented now:
- deterministic `game-plan` domain module scaffold
- player champion job
- ally/enemy comp identity summary
- key threat to watch
- easiest win condition
- practical play rules
- richer AI coach panel rendering structured outputs

### Remaining deliverables
- lane plan / early-game plan
- objective setup advice
- side-lane / teamfight posture guidance
- clearer matchup danger summaries
- role-aware threat prioritization improvements

### Suggested next tasks
1. add lane-phase and mid-game plan outputs
2. add a richer threat model for enemy access / poke / scaling threats
3. split advice by role where useful
4. add deterministic “what not to do” guidance
5. keep AI downstream of structured signals only

---

## Priority 3 — Curated champion trait dataset
### Goal
Move from scaffold-only traits to persistent patch-aware curated trait data.

### Why this is still important
The UI can expose the full champion roster, but recommendation and coaching quality still depend heavily on trait fidelity.

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

## Priority 4 — Real external stats provider integration
### Goal
Replace fixture-only external stats with a real provider or backend aggregation pipeline.

### Why this remains high value
Real matchup, synergy, and meta signals are the next major quality unlock after live sync and trait fidelity.

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

---

## Priority 5 — Draft UX / Live debug visibility
### Goal
Improve practical usability and debuggability of live sessions.

### Deliverables
- desktop debug/timeline panel
- Riot snapshot/debug visibility
- last ingest event visibility
- companion connection health visibility
- easier board-source inspection

### Suggested tasks
1. show last draft-state source and timestamp
2. show last heartbeat / companion instance id
3. show Riot snapshot mapped / not mapped reason
4. add event counters / lightweight timeline
5. keep UI presentation separate from domain truth

---

## Priority 6 — Testing expansion
### Goal
Keep regressions under control as Riot snapshots, Desktop Client, and coach outputs expand.

### Suggested tasks
1. more recorded Riot active-game fixtures
2. more LCU / desktop runtime fixtures
3. backend route tests for Riot snapshot responses
4. recommendation regression snapshots per patch
5. game-plan regression coverage
6. SSE flow integration tests where practical

---

## Recommended immediate execution order
1. Riot live-game snapshot hardening
2. Live Game Plan / Coach expansion
3. Curated champion trait dataset persistence
4. Real external stats provider connection
5. Live debug visibility and UX improvements

---

## Tomorrow's recommended first coding task
If continuing in a new chat, start here:

### Step 1
Verify why the current `RIOT_API` live game is or is not producing a mapped roster snapshot on the board.

### Step 2
Improve role inference and debug visibility for Riot live-game snapshots.

### Step 3
Expand the deterministic game-plan outputs for live populated boards.

That path keeps the project aligned with the real product goal:
- `DESKTOP_CLIENT` for true live draft sync
- `RIOT_API` for useful live-game roster analysis
- deterministic coaching layered on top

---

## Key reminder
Keep this hierarchy intact:
1. deterministic domain truth
2. stats-informed enhancement
3. AI explanation layer

Do not invert this by making AI the recommendation authority.
