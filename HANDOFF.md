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

### Riot API behavior was clarified and hardened
We confirmed and reinforced the real product boundary:
- Riot public APIs are useful for **recognition** and **active-game presence**.
- Riot public APIs do **not** provide true champ-select pick/ban streaming.
- `RIOT_API` should be treated as a **live game roster analysis mode**, not a real live draft-sync mode.

Improvements made:
- Riot error handling is clearer and step-specific:
  - account lookup failures
  - summoner profile lookup failures
  - active-game lookup failures
- the spectator failure `Exception decrypting undefined` is now treated more gracefully instead of breaking the whole flow
- Riot sessions no longer downgrade to fake `error` status just because Riot cannot stream champ select
- Riot sessions remain connected/informational

### Riot active-game roster -> DraftState mapping was added
We added backend logic that can:
- pull Riot active-game spectator participants when available
- map ally and enemy rosters into internal `DraftState`
- map bans when Riot spectator data includes them
- use that state for:
  - draft board population
  - composition analysis
  - recommendations
  - AI coach/game-plan outputs

Important note:
- this still depends on Riot spectator data being available for the current live game
- this does **not** make Riot mode a champ-select stream

### Desktop companion milestone advanced significantly
The desktop-client path is now much stronger and is the real live sync path.

Implemented during this chat sequence:
- typed desktop source contract
- LCU-compatible champ-select mapper -> `DraftState`
- LCU polling scaffold
- lockfile-based credential discovery
- local self-signed HTTPS-compatible LCU requester
- `runLcuCompanion.ts`
- desktop runtime flush serialization
- stale/duplicate ingest protection
- file-based source compatibility with the new source contract
- recorded LCU fixture tests
- process-derived lockfile-path discovery heuristics

### Desktop-client UX was improved
The live session panel now includes:
- mode-specific guidance
- session id display
- copy session id button
- copy companion command buttons
- visual live status indicator
- Riot troubleshooting block
- `DESKTOP_CLIENT` no longer requires Riot name/tag input
- **Test desktop mock now** button that triggers the existing backend mock route directly from the UI

### AI Coach / game-plan work advanced
We implemented a deterministic **live game-plan layer** that produces:
- your champion’s job
- ally comp identity
- enemy comp identity
- key threat to watch
- easiest win condition
- practical play rules
- execution difficulty context

The AI coach panel is now richer and structured around deterministic outputs instead of only a generic paragraph.

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
3. Riot active-game role inference is still heuristic/order-based, not production-perfect role assignment.
4. All-champion strategic trait fidelity is still partially scaffolded/inferred.
5. Real matchup/synergy/meta stats still need a real provider behind `EXTERNAL_STATS_URL` or another production path.
6. AI coach is still deterministic-summary-first and not yet fully wired to OpenAI/Pi orchestration.

## Current quality status
Current validated state at the end of this chat:
- builds pass
- tests pass
- **38 test files**
- **78 tests passing**

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
1. improve **RIOT_API live-game snapshot usefulness**
   - better role inference for live-game rosters
   - clearer messaging when spectator data is unavailable
   - optional debug visibility for why a roster did or did not map into the board
2. persist **curated champion trait datasets** with patch-aware overrides
3. connect a **real external stats provider**
4. expand the **live game-plan / AI Coach** layer further
5. add live/debug visibility for desktop and Riot snapshot events

## Recommended first action in the next chat
Start with:
- reading `README.md`, `HANDOFF.md`, `NEXT_STEPS.md`, and `PROJECT_BRIEFING.md`
- then verify whether `RIOT_API` is producing a mapped live-game roster snapshot in the current game mode
- then continue the **live game-plan / coach expansion** and **Riot live snapshot hardening** work
