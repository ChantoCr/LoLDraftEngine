# HANDOFF.md

## Project
LoLDraftEngine

## What this project is
A multi-region League of Legends Draft Intelligence Platform focused on deterministic draft analysis, inspectable recommendation logic, patch-aware data, live-session tooling, and future AI-assisted strategic coaching.

The product supports two different live-related realities:
1. **RIOT_API** for player recognition and live-game roster snapshots when Riot spectator APIs expose them.
2. **DESKTOP_CLIENT** for the real local-client path to live pick/ban sync.

## Ultimate product goals
The long-term goal is to build a high-quality LoL draft assistant that can:
- understand live draft states
- sync real champion-select state through a local desktop companion
- analyze ally and enemy compositions deterministically
- recommend context-aware champions
- support both best-overall and personal-pool recommendation modes
- stay patch-aware
- explain the draft, matchup, and game plan clearly
- give practical champion-specific play guidance after the board is populated

Important hierarchy:
1. deterministic domain truth
2. stats-informed enhancement
3. AI explanation layer

## Stack
### Frontend
- React 19
- TypeScript
- Vite
- Tailwind CSS

### Backend
- Node.js
- Express
- TypeScript
- SSE

### Tooling
- Vitest
- ESLint
- tsx
- tsc
- tsc-alias

## Region support
This project is **not EUW-only**.
It is designed for multi-region support, including **LAN**.

Important current routing example:
- LAN -> regional cluster: `americas`
- LAN -> platform id: `la1`

## Most important files to read first in the next chat
1. `README.md`
2. `HANDOFF.md`
3. `NEXT_STEPS.md`
4. `PROJECT_BRIEFING.md`
5. `AGENTS.md`

## Comprehensive summary of what happened in this chat

### Riot API behavior was re-validated against the official Riot docs
We checked the official Riot Developer Portal and corrected an outdated assumption in the live Riot path.

Important confirmed facts:
- Riot public APIs are useful for **recognition** and **active-game presence**.
- Riot public APIs do **not** provide true champ-select pick/ban streaming.
- `RIOT_API` should still be treated as a **live game roster analysis mode**, not a real live draft-sync mode.
- Data Dragon is **not** part of the live spectator problem; it only provides static patch/champion data.

Most important implementation correction from the official docs:
- `summoner-v4` by PUUID should not be treated as the source of legacy encrypted summoner ids / account ids / legacy names.
- `spectator-v5` active-game lookup should use the player's **PUUID directly**.

### Riot API live lookup was hardened and corrected
Implemented during this chat sequence:
- Riot snapshot debug panel
- Riot lookup diagnostics panel
- Riot pipeline summary panel
- Riot recommended-next-steps panel
- improved Riot role inference for mapped live-game rosters
- clearer Riot warning normalization for blocked / unavailable spectator paths
- **desktop-style fallback assumptions were removed from the required Riot live lookup path**
- Riot active-game lookup now calls spectator-v5 with the player's **PUUID directly**

Why this mattered:
- the previous flow was trying to recover legacy-style identifiers when Riot account recognition had already succeeded
- that caused misleading fallback behavior and 403s on routes that are not the required modern path for spectator-v5
- the current code now follows the official Riot docs more closely

Current Riot reality after this fix:
- recognition can succeed
- active-game lookup can now be attempted directly through spectator-v5 using the player PUUID
- if Riot still does not return an active game, the app can now expose that as a real spectator/API availability result instead of a broken legacy fallback chain

### Riot active-game roster -> DraftState mapping was expanded
We now have:
- Riot active-game spectator participant mapping into internal `DraftState`
- heuristic role inference instead of simple participant-order placement only
- clearer mapping failure reasoning
- richer diagnostics when a snapshot exists but does not map cleanly

Important note:
- this still depends on Riot spectator data being available for the current live game
- this does **not** make Riot mode a champ-select stream

### Desktop companion path was further improved
The desktop-client path remains the real live sync path and gained better operational visibility.

Implemented / improved:
- typed desktop source contract
- LCU-compatible champ-select mapper -> `DraftState`
- lockfile-based LCU credential discovery
- local self-signed HTTPS-compatible LCU requester
- desktop stale/duplicate ingest protection
- desktop mock / file / LCU helpers
- desktop debug panel showing:
  - last heartbeat
  - companion instance id
  - last ingest event id
  - last ingest sequence number
  - lightweight recent-event timeline
- `DESKTOP_CLIENT` still does not require Riot name/tag input
- **Test desktop mock now** button remains available in the UI

### AI Coach / game-plan work remains advanced and ready for expansion
Already implemented:
- your champion’s job
- ally comp identity
- enemy comp identity
- key threat to watch
- easiest win condition
- practical play rules
- execution difficulty context

The next best product-visible layer is still expanding lane-phase, mid-game, objective, and matchup-aware coaching.

## Main systems already implemented
- deterministic draft-state model
- composition analyzer
- recommendation engine
- stats-layer contracts and adapters
- Data Dragon integration with latest patch resolution
- external stats scaffold
- backend stats endpoints
- champion trait scaffold dataset generator
- live-session frontend/backend scaffold
- Riot routing scaffold
- Riot active-game roster -> internal `DraftState` mapping
- desktop-client bridge contract + runtime scaffold + mock/file/LCU runners
- interactive draft board with bans
- patch selector + latest-patch sync UI
- clickable champion search on the draft board
- deterministic live game-plan layer
- richer AI coach panel fed by deterministic signals

## Commands that matter right now
### Frontend
- `npm run dev`

### Backend
- `npm run server:dev`
- `npm run server:start`
- `npm run server:build`

### Desktop companion helpers
- `npm run desktop:mock -- <sessionId>`
- `npm run desktop:file -- <sessionId> <draftState.json>`
- `npm run desktop:lcu -- <sessionId> [patchVersion] [lockfilePath]`
- `npm run desktop:lcu -- <sessionId> [patchVersion] [lockfilePath]`

### Quality
- `npm run build`
- `npm run test:run`

## Current reality
### Already working well
- manual draft editing
- full Data Dragon roster loading in frontend mode
- latest-patch resolution and explicit patch selection
- recommendation recomputation on draft changes
- bans UI
- desktop companion LCU path is working in the current user flow
- desktop mock trigger exists in UI and through CLI
- RIOT_API mode can now act as a live-game roster analysis mode when spectator APIs expose the game roster
- Riot lookup diagnostics now show step-by-step status, pipeline summary, and recommended next actions when spectator lookup does not produce a board snapshot
- composition analysis and AI coach can consume the board state from those flows

### Important distinction
#### RIOT_API
Use for:
- Riot player recognition
- live-game presence checks
- live-game roster snapshots when Riot spectator data is available

Do **not** expect:
- champ-select pick/ban streaming
- real draft sync

#### DESKTOP_CLIENT
Use for:
- the real long-term live draft sync path
- local LoL client / LCU-based updates
- production-oriented live board population

## Biggest constraints still in play
1. Riot public APIs do not provide real champ-select draft streaming.
2. Riot spectator availability is not guaranteed for every game mode/session type.
3. Riot active-game role inference is now heuristic-based and materially better than simple order placement, but it is still not production-perfect.
4. All-champion strategic trait fidelity is still partially scaffolded/inferred.
5. Real matchup/synergy/meta stats still need a real provider behind `EXTERNAL_STATS_URL` or another production path.
6. AI coach is still deterministic-summary-first and not yet fully wired to OpenAI/Pi orchestration.

## Current quality status
Current validated state at the end of this chat:
- builds pass
- tests pass
- **39 test files**
- **83 tests passing**

## Important environment notes
- `.env.example` is a template only
- the backend actually loads `.env` and `.env.local`
- do not overwrite the user's Riot API key
- for Riot recognition, keep using the user's configured `RIOT_API_KEY`
- optional desktop companion auth can use `DESKTOP_COMPANION_TOKEN`

## What to do next
Read:
- `PROJECT_BRIEFING.md` for full context
- `NEXT_STEPS.md` for execution order

### Highest-value next work after this chat
1. validate the corrected **RIOT_API spectator-v5 PUUID lookup path** against real live games
   - capture recorded fixtures for success / not-found / forbidden cases
   - confirm the app now surfaces true spectator availability outcomes instead of legacy fallback artifacts
2. expand the **live game-plan / AI Coach** layer further
   - lane-phase plan
   - mid-game posture
   - objective setup guidance
   - role-aware matchup danger guidance
3. persist **curated champion trait datasets** with patch-aware overrides
4. connect a **real external stats provider**
5. continue polishing desktop live-sync UX and diagnostics where useful

## Recommended first action in the next chat
Start with:
- reading `README.md`, `HANDOFF.md`, `NEXT_STEPS.md`, and `PROJECT_BRIEFING.md`
- then verify the updated `RIOT_API` spectator-v5 **PUUID-based** active-game lookup against a real live game
- inspect whether the result is now:
  - active game found
  - no active game found
  - spectator forbidden / unavailable
- then continue the **live game-plan / coach expansion** work once Riot live validation is confirmed
