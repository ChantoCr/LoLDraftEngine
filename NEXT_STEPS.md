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
- Riot lookup diagnostics, pipeline summary, and recommended-next-step guidance now exist in the UI
- desktop companion debug visibility now exists, including last heartbeat / companion id / last ingest event / lightweight timeline
- Riot active-game roster snapshots can now be mapped into internal `DraftState` when spectator APIs expose the live game roster
- Riot role inference is now heuristic-based instead of simple participant-order placement only
- the official Riot docs were checked and the Riot live path was corrected to use `spectator-v5` active-game lookup with the player's **PUUID directly**
- legacy encrypted-summoner/accountId/name fallback assumptions are no longer the required path for Riot spectator lookup
- a deterministic live game-plan layer now exists
- the AI coach panel is now richer and grounded in deterministic game-plan outputs

Current validated state:
- `npm run test:run` passes
- `npm run build` passes
- 39 test files
- 83 tests passing

---

## Priority 1 — Riot live-game validation after the official-doc fix
### Goal
Verify that `RIOT_API` now follows the correct modern Riot flow in real use:
- account recognition
- optional summoner profile metadata lookup
- spectator-v5 active-game lookup by **PUUID**
- roster mapping into `DraftState` when available

### Why this matters now
The biggest Riot issue in this chat sequence was an outdated assumption about needing legacy encrypted summoner identifiers for spectator lookup. The official Riot docs indicate spectator-v5 should use the player's PUUID directly. That fix is now implemented and needs real-world validation.

### What is already done
Implemented now:
- Riot account recognition
- summoner profile metadata lookup
- official-doc-aligned spectator-v5 PUUID lookup path
- clearer active-game failure handling
- Riot lookup diagnostics / pipeline summary / recommended actions
- Riot active-game roster -> `DraftState` mapper
- heuristic role inference for Riot rosters

### Remaining deliverables
- verify real-world active-game success / not-found / forbidden outcomes on the corrected PUUID path
- capture recorded fixtures for those outcomes
- add route/adapter tests around those real outcomes
- refine messaging if Riot spectator-v5 returns new edge-case payloads

### Suggested next tasks
1. test `RIOT_API` against a real live game using the corrected spectator-v5 PUUID path
2. record fixture payloads for:
   - active game found
   - no active game found
   - forbidden / unavailable
3. add regression tests for those real outcomes
4. keep Riot mode explicitly framed as live-game analysis, not draft streaming
5. avoid reintroducing legacy encrypted-summoner fallback assumptions unless Riot docs require them again

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

## Priority 5 — Draft UX / Live debug visibility follow-up
### Goal
Build on the newly added Riot diagnostics and desktop debug/timeline panel with small usability improvements only where they unlock validation speed.

### Already done
- desktop debug/timeline panel
- Riot snapshot/debug visibility
- last ingest event visibility
- companion connection health visibility
- recommended next actions in Riot mode

### Suggested follow-up tasks
1. optionally add event counters to the desktop timeline
2. optionally add last successful Riot snapshot timestamp separate from last poll/update timestamp
3. keep UI presentation separate from domain truth
4. avoid overbuilding diagnostics unless they directly help fixture capture or real-world validation

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
1. Validate the corrected Riot spectator-v5 PUUID flow against real games and capture fixtures
2. Live Game Plan / Coach expansion
3. Curated champion trait dataset persistence
4. Real external stats provider connection
5. Small follow-up polish to live debug UX only if needed for validation

---

## Tomorrow's recommended first coding task
If continuing in a new chat, start here:

### Step 1
Verify the corrected `RIOT_API` spectator-v5 **PUUID-based** active-game lookup against a real live game.

### Step 2
Capture / record the real outcome:
- active game found and mapped
- no active game found
- spectator forbidden / unavailable

### Step 3
If Riot validation looks healthy, shift immediately into expanding deterministic game-plan outputs for live populated boards.

That path keeps the project aligned with the real product goal:
- `DESKTOP_CLIENT` for true live draft sync
- `RIOT_API` for useful live-game roster analysis when spectator APIs cooperate
- deterministic coaching layered on top

---

## Key reminder
Keep this hierarchy intact:
1. deterministic domain truth
2. stats-informed enhancement
3. AI explanation layer

Do not invert this by making AI the recommendation authority.
