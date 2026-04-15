# HANDOFF.md

## Project
LoLDraftEngine

## What this project is
A multi-region League of Legends Draft Intelligence Platform with:
- deterministic composition analysis
- deterministic recommendation scoring
- best-overall and personal-pool recommendation modes
- patch-aware stats scaffolding
- full-roster Data Dragon champion loading
- interactive draft UI
- backend live-session scaffold
- Riot account recognition scaffold
- desktop companion bridge scaffold
- future AI coaching support

## Region support
This project is **not EUW-only**.
It is designed for multi-region support, including **LAN**.

Important current routing example:
- LAN -> regional cluster: `americas`
- LAN -> platform id: `la1`

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

## Most important files to read first
1. `PROJECT_BRIEFING.md`
2. `AGENTS.md`
3. `README.md`
4. `NEXT_STEPS.md`

## What changed today
### Draft / patch / champion data
- manual draft mode now loads champion data directly from Data Dragon in the browser
- the app supports the special patch token `latest`
- `latest` resolves to the newest Data Dragon patch version available, such as `16.8.1`
- the UI now has a patch selector in `MetaPanel`
- the draft board now updates `availableChampionIds` from the loaded Data Dragon roster
- champion search on the draft board now shows a visible clickable result list
- champion search is no longer restricted by role, so any champion can be assigned to any lane slot

### Live session behavior
- `MOCK` frontend mode now works without relying on the backend recognize endpoint
- Riot/backend recognition errors now surface more clearly in the frontend
- the live session panel now explains that `RIOT_API_KEY` must be in `.env` or `.env.local`, not only `.env.example`

### Desktop companion bridge progress
- desktop ingest ack contract was expanded earlier in the day
- desktop ingest now supports:
  - auth token header via `DESKTOP_COMPANION_TOKEN`
  - heartbeat payloads
  - companion instance metadata
  - retry/delivery attempt metadata
  - session health updates
- local desktop companion runtime scaffold now exists
- a file-based bridge-compatible companion runner now exists:
  - `npm run desktop:file -- <sessionId> <draftState.json>`
- mock companion runner still exists:
  - `npm run desktop:mock -- <sessionId>`

## Main systems already implemented
- deterministic draft-state model
- composition analyzer
- recommendation engine
- stats-layer contracts and adapters
- Data Dragon scaffold
- external stats scaffold
- backend stats endpoints
- live-session frontend/backend scaffold
- Riot region-routing scaffold
- desktop-client bridge contract + local runtime scaffold + mock ingestion API
- champion trait scaffold dataset generator
- interactive draft board with bans
- patch selector + latest-patch sync UI
- clickable champion search on the draft board

## Live API endpoints
- `GET /api/health`
- `POST /api/live/session/recognize`
- `GET /api/live/session/:id/events`
- `POST /api/live/desktop-client/session/:id/ingest`
- `POST /api/live/desktop-client/mock/session/:id/mock-sequence`

## Stats endpoints
- `GET /api/stats/patches`
- `GET /api/stats/patch/:patchVersion/catalog`
- `GET /api/stats/patch/:patchVersion/bundle`
- `GET /api/champion-traits/patch/:patchVersion/scaffold`

## Current reality
### Already working
- manual draft editing
- full Data Dragon roster loading in frontend mode
- latest-patch resolution and explicit patch selection in UI
- clickable champion search with visible result list
- mock live draft flow
- region-aware session identity
- Riot account recognition scaffold through backend
- recommendation recomputation on draft changes
- bans UI
- desktop companion mock sequence runner
- desktop companion file-based runtime scaffold

### Scaffolded but not finished
- true Riot-backed production session reliability and rate-limit handling
- real LoL local client/LCU desktop source adapter
- full all-champion hand-curated trait data
- real external stats provider integration
- AI Coach production flows

## Biggest constraints
1. Riot public APIs do not provide full champion-select draft streaming.
2. All champions are now available through Data Dragon, but many strategic traits are still inferred rather than curated.
3. Desktop-client live sync still needs a real local LoL source adapter, not just mock/file-based bridge-compatible runtimes.
4. Real matchup/synergy/meta stats still need a real provider behind `EXTERNAL_STATS_URL` or another production stats path.

## Current quality status
Current validated state at the end of today:
- builds pass
- tests pass
- **28 test files**
- **53 tests passing**

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

If continuing tomorrow, the highest-priority next work is:
1. build the **real local LoL desktop companion source adapter**
   - source contract
   - LCU-compatible polling scaffold
   - champ-select -> `DraftState` mapper
   - reconnect / retry handling under rapid updates
2. persist **curated champion trait datasets** with patch-aware overrides
3. connect a **real external stats provider**
4. wire **AI Coach** to structured outputs

## Recommended first action in the next chat
Start with:
- reading `README.md`, `HANDOFF.md`, `NEXT_STEPS.md`, and `PROJECT_BRIEFING.md`
- then implement the next desktop companion milestone:
  - real source adapter contract
  - LCU or bridge-compatible polling adapter scaffold
  - mapper from local champ-select data to internal `DraftState`
