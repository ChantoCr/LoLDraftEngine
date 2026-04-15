# PROJECT_BRIEFING.md

## Project Name
LoLDraftEngine

## One-Sentence Definition
A multi-region League of Legends Draft Intelligence Platform that combines deterministic draft analysis, contextual champion recommendations, patch-aware stats signals, interactive live draft tooling, and future AI coaching.

---

## Product Vision
The project is intended to become a high-quality draft assistant for League of Legends that can:

- understand live draft states
- analyze team composition structure
- recommend champions by context
- support both best-theoretical and player-pool-constrained recommendations
- explain why picks are recommended
- sync with live champion select through backend and desktop-client integration
- stay patch-aware through Data Dragon and future real stats providers

This system is explicitly being designed as a **domain-first draft engine**, not as an LLM-only product.

---

## Core Product Modes
### Product modes
- Solo Queue
- Competitive
- Clash / Friends

### Recommendation modes
- Best Overall Picks
- Personal Pool Picks

---

## Key Strategic Decisions Already Made

### 1. Deterministic engine first
Business logic is deterministic wherever possible.
AI is downstream of structured analysis.

### 2. AI is not the source of truth
LLMs should explain and compare recommendations, not replace scoring correctness.

### 3. Strong separation of concerns
The project is split across:
- UI/presentation
- domain logic
- data providers/adapters
- stats ingestion
- live session orchestration
- backend companion API

### 4. Stats enhance, not replace, recommendations
Meta, matchup, and synergy signals are blended into deterministic scores with confidence-aware weighting.

### 5. Multi-region support is required
The project is **not EUW-only**.
It is explicitly designed for **all supported Riot regions**, including **LAN**.

### 6. Riot public API is not enough for true live champ-select sync
Riot can help with:
- player recognition
- account lookup
- summoner lookup
- active-game detection

But Riot public APIs do **not** give true champion-select pick/ban event streaming.
For real live draft sync, a **desktop-client local bridge** is still the better path.

### 7. Full champion coverage should come from real patch data
The project should not stay limited to a tiny mock roster.
The current direction is:
- use Data Dragon as the baseline roster and patch metadata source
- use scaffolded traits as a temporary quality bridge
- layer curated traits and real external stats on top later

---

## Supported Regions
The architecture already supports these regions as typed values:

- BR
- EUN
- EUW
- JP
- KR
- LAN
- LAS
- MENA
- NA
- OCE
- PH
- RU
- SG
- TH
- TR
- TW
- VN
- PBE

### Region routing logic already implemented
#### Americas cluster
- BR
- LAN
- LAS
- NA
- PBE

#### Europe cluster
- EUN
- EUW
- TR
- RU
- MENA

#### Asia cluster
- KR
- JP

#### SEA cluster
- OCE
- PH
- SG
- TH
- TW
- VN

### Important note for LAN
LAN is explicitly supported.
Current routing for LAN:
- regional cluster: `americas`
- platform id: `la1`

---

## Technical Stack

### Frontend
- React 19
- TypeScript
- Vite
- Tailwind CSS

### Backend companion
- Node.js
- Express
- TypeScript
- Server-Sent Events (SSE)

### Tooling
- Vitest
- ESLint
- tsx
- tsc
- tsc-alias

---

## Current Project Structure

### Frontend/domain/data
- `src/app/`
- `src/pages/`
- `src/features/`
- `src/domain/`
- `src/data/`
- `src/shared/`

### Backend
- `server/config/`
- `server/live/`
- `server/stats/`
- `server/championTraits/`

---

## Major Systems Already Implemented

# 1. Draft-State System
Implemented deterministic draft state creation and manipulation.

### Important files
- `src/domain/draft/types.ts`
- `src/domain/draft/constants.ts`
- `src/domain/draft/factories.ts`
- `src/domain/draft/selectors.ts`
- `src/domain/draft/operations.ts`

### Capabilities
- create serializable draft state
- assign champion to slot
- clear slot
- add/remove bans
- switch current role
- switch recommendation mode
- manage available champion IDs

---

# 2. Composition Analyzer
Implemented deterministic composition analysis.

### Important files
- `src/domain/composition/types.ts`
- `src/domain/composition/constants.ts`
- `src/domain/composition/analyzer.ts`

### Capabilities
- aggregate champion traits
- compute average team traits
- compute damage profile leaning
- score comp archetypes
- identify structural gaps
- generate strengths/weaknesses
- generate alerts
- estimate execution difficulty
- infer win conditions

### Archetype concepts already supported
- Engage
- Disengage
- Peel
- Poke
- Scaling
- Dive
- Pick
- Front-to-back
- Hybrid

---

# 3. Recommendation Engine
Implemented inspectable, weighted, deterministic recommendations.

### Important files
- `src/domain/recommendation/types.ts`
- `src/domain/recommendation/config.ts`
- `src/domain/recommendation/engine.ts`

### Scoring dimensions implemented
- ally synergy
- enemy counter
- comp repair
- damage balance
- frontline impact
- engage impact
- peel impact
- execution fit
- meta value
- comfort fit

### Modes supported
- Best Overall
- Personal Pool

### Outputs already implemented
- ranked recommendation candidates
- total score
- confidence
- per-dimension score breakdown
- typed reasons
- recommendation tags

---

# 4. Champion Pool Logic
Implemented personal-pool-aware recommendation flow.

### Important files
- `src/domain/champion-pool/types.ts`

### Pool tiers supported
- MAIN
- COMFORT
- PLAYABLE
- EMERGENCY

### Behavior already implemented
- filter recommendations to pool
- keep pool logic optional
- preserve distinction between theoretical best and realistic best-in-pool

---

# 5. Stats Layer
Implemented patch-aware stats scaffolding and provider architecture.

## Domain contracts
### Important files
- `src/domain/stats/types.ts`
- `src/domain/stats/factories.ts`
- `src/domain/stats/provider.ts`
- `src/domain/stats/merge.ts`
- `src/domain/stats/selectors.ts`

### Concepts already modeled
- ChampionRecord
- PatchDataBundle
- MetaSignal
- MatchupSignal
- SynergySignal
- ConfidenceIndicator
- DataFreshness

## Data Dragon support
### Important files
- `src/data/providers/dDragon/client.ts`
- `src/data/providers/dDragon/normalize.ts`
- `src/data/providers/dDragon/service.ts`
- `src/data/providers/dDragon/types.ts`

### Current Data Dragon behavior
- can load patch versions directly from Data Dragon
- supports the special requested patch token `latest`
- resolves `latest` to the newest available Data Dragon version
- resolves short versions like `15.8` to exact versions like `15.8.1`
- frontend manual mode can use Data Dragon directly without backend dependency
- full champion roster can now populate the draft board

## External stats adapter support
### Important files
- `src/data/providers/external/adapter.ts`
- `src/data/providers/external/types.ts`
- `src/data/providers/external/normalize.ts`
- `src/data/providers/external/service.ts`

## Backend stats API
### Important files
- `server/stats/router.ts`
- `server/stats/service.ts`
- `server/stats/externalRemoteAdapter.ts`

### Backend stats endpoints already implemented
- `GET /api/stats/patches`
- `GET /api/stats/patch/:patchVersion/catalog`
- `GET /api/stats/patch/:patchVersion/bundle`

### Current behavior
- can load champion metadata bundles
- can merge external stats signals into patch bundles
- can serve a backend champion catalog
- can serve merged patch bundles to frontend
- can use fixture-backed stats now
- can later use real external stats through `EXTERNAL_STATS_URL`

---

# 6. Stats-Enhanced Recommendation Blending
The recommendation engine already supports optional `statsBundle` input.

### Structured stats currently influence
- ally synergy
- enemy counter
- meta value

### Rule
Stats signals are blended in with confidence-aware weighting.
They do not replace deterministic draft logic.

---

# 7. Live Session System
Implemented frontend live-session state and backend live-session APIs.

## Frontend live-session layer
### Important files
- `src/domain/live/types.ts`
- `src/domain/live/constants.ts`
- `src/domain/live/provider.ts`
- `src/features/live-session/components/LiveSessionPanel.tsx`
- `src/features/live-session/hooks/useLiveDraftSession.ts`

### Sync modes implemented
- MANUAL
- MOCK
- RIOT_API
- DESKTOP_CLIENT

### Frontend behavior implemented
- summoner identity input
- region selection
- sync mode selection
- start/stop session
- last sync visibility
- backend-driven session updates
- better propagation of session-update events from providers

## Backend live API
### Important files
- `server/live/router.ts`
- `server/live/sse.ts`
- `server/live/sessionStore.ts`
- `server/live/types.ts`

### Live endpoints already implemented
- `GET /api/health`
- `POST /api/live/session/recognize`
- `GET /api/live/session/:id/events`

### SSE event types already implemented
- `draft-state`
- `session-update`

---

# 8. Mock Live Draft Flow
Implemented full mock live flow.

### Important files
- `src/data/mock/liveDraft.ts`
- `server/live/adapters/mock.ts`
- `src/data/providers/live/backendApi/client.ts`
- `src/data/providers/live/backendApi/provider.ts`
- `src/data/providers/live/mock.ts`

### Behavior
- frontend can run mock mode
- mock provider can stream draft snapshots into the workspace
- mock flow no longer needs backend recognition for basic usage

---

# 9. Riot Backend Integration Scaffold
Implemented real region-aware Riot API scaffolding.

### Important files
- `server/live/riot/routing.ts`
- `server/live/riot/client.ts`
- `server/live/adapters/riot.ts`

### Current capabilities
- region-aware routing logic
- account lookup by Riot ID scaffold
- summoner lookup by PUUID scaffold
- active game lookup scaffold
- useful backend error messaging if API key is missing
- clearer frontend error propagation for recognize failures

### Environment variable expected
- `RIOT_API_KEY`

### Important environment note
The backend loads `.env` and `.env.local`.
`.env.example` is only a template.

### Current limitation
Riot public APIs still do not provide true champion-select streaming.
This path is useful for player recognition and active-game detection, but not enough for full draft sync.

---

# 10. Desktop-Client Bridge Scaffold
Implemented a backend-side desktop-client bridge contract plus local runtime scaffolding.

### Important files
- `server/live/desktopClient/types.ts`
- `server/live/desktopClient/bridge.ts`
- `server/live/desktopClient/router.ts`
- `server/live/desktopClient/mockIngestRouter.ts`
- `server/live/adapters/desktopClient.ts`
- `server/live/desktopClient/runtime.ts`
- `server/live/desktopClient/fileSource.ts`
- `server/live/desktopClient/runFileCompanion.ts`
- `server/live/desktopClient/runMockCompanion.ts`

### Endpoints implemented
- `POST /api/live/desktop-client/session/:id/ingest`
- `POST /api/live/desktop-client/mock/session/:id/mock-sequence`

### Current capabilities
- ingest ack contract
- companion metadata on ingest
- heartbeat/session health updates
- optional auth token support via `DESKTOP_COMPANION_TOKEN`
- retry-aware runtime posting
- file-based bridge-compatible source runtime
- mock desktop companion runtime

### What this means
A future local bridge/companion process can:
- detect client state locally
- transform it into backend ingest payloads
- send those payloads to the backend
- have backend stream them to the frontend over SSE

### Current status
- backend contract exists
- in-memory bridge exists
- mock ingestion exists
- file-based runtime scaffold exists
- actual real LoL local source adapter is **not built yet**

---

# 11. Interactive Draft Builder
The draft board is already interactive.

### Important files
- `src/features/draft-board/components/DraftBoard.tsx`
- `src/features/meta/components/MetaPanel.tsx`
- `src/features/draft-board/components/BanPanel.tsx`
- `src/pages/DraftWorkspacePage.tsx`

### Current capabilities
- assign ally/enemy picks
- clear picks
- switch current role
- change recommendation mode
- add/remove bans
- recompute composition instantly
- recompute recommendations instantly
- choose requested patch from UI
- show resolved loaded patch separately

---

# 12. Full Champion Catalog Search + Latest Patch UX
Implemented broader champion search and patch selection in the UI.

### Important files
- `src/features/draft-board/components/ChampionSearchSelect.tsx`
- `src/features/meta/components/MetaPanel.tsx`
- `src/features/stats/hooks/useAvailablePatchVersions.ts`
- `src/features/stats/hooks/usePatchStatsBundle.ts`
- `src/pages/DraftWorkspacePage.tsx`

### Current behavior
- load champion catalog from Data Dragon-backed patch bundle
- use full roster rather than tiny mock-only availability
- search champion by name with visible clickable result list
- allow any champion in any lane for manual draft exploration
- use `latest` patch or choose a specific Data Dragon version
- show patch list loading/error feedback in the UI

---

# 13. Champion Trait Scaffold Dataset for Wider Champion Coverage
Implemented a scaffold generator for champion traits.

### Important files
- `src/domain/champion-traits/types.ts`
- `src/domain/champion-traits/scaffold.ts`
- `server/championTraits/service.ts`
- `server/championTraits/router.ts`
- `src/data/api/championTraits.ts`
- `src/features/champion-traits/hooks/useChampionTraitScaffold.ts`

### Backend endpoint
- `GET /api/champion-traits/patch/:patchVersion/scaffold`

### Current behavior
- infer approximate roles
- infer approximate traits from classes/kit signals
- infer damage profile
- provide confidence + rationale
- build a broader champion map from patch-served champion metadata
- preserve hand-authored champions as overrides where available

### Why this matters
This allows the system to reason about a much larger number of champions, even if not all are hand-tuned yet.

---

## Frontend Hooks and APIs Added Recently

### Frontend APIs
- `src/data/api/stats.ts`
- `src/data/api/championTraits.ts`
- `src/data/providers/live/backendApi/client.ts`

### Frontend hooks
- `src/features/stats/hooks/usePatchStatsBundle.ts`
- `src/features/stats/hooks/useAvailablePatchVersions.ts`
- `src/features/draft-board/hooks/useChampionCatalog.ts`
- `src/features/champion-traits/hooks/useChampionTraitScaffold.ts`

---

## Backend Environment Variables
Defined in `.env.example` as templates:
- `PORT=3001`
- `CORS_ORIGIN=http://localhost:5173`
- `RIOT_API_KEY=`
- `EXTERNAL_STATS_URL=`
- `DESKTOP_COMPANION_TOKEN=` (optional, recommended for local bridge protection)

The backend actually loads:
- `.env`
- `.env.local`

---

## Commands

### Frontend
- `npm run dev`

### Backend
- `npm run server:dev`
- `npm run server:start`
- `npm run server:build`

### Desktop companion helpers
- `npm run desktop:mock -- <sessionId>`
- `npm run desktop:file -- <sessionId> <draftState.json>`

### Full build
- `npm run build`
- `npm run build:client`

### Quality
- `npm run lint`
- `npm run test`
- `npm run test:run`

---

## Current Validation Status
As of the end of this chat, the project passes:
- build
- tests

Current tested state:
- **28 test files**
- **53 tests passing**

---

## Problems Still Not Fully Solved

### 1. Real desktop companion process is not finished
The project now has a stronger runtime scaffold, but it still needs a real local LoL source adapter.
That future process should:
- read actual client/LCU or bridge-compatible local state
- map picks/bans into internal `DraftState`
- call `/api/live/desktop-client/session/:id/ingest`

### 2. All-champion trait fidelity is still approximate for many champions
The scaffold system is useful, but high-quality recommendation behavior still benefits from:
- curated champion trait data
- patch-aware overrides
- manual review for difficult champions

### 3. Riot integration is scaffolded, not production complete
Still needed:
- better rate limit handling
- richer error and recovery handling
- session persistence if desired
- active-game/draft orchestration refinements

### 4. True live pick/ban sync still depends on desktop bridge
Riot public APIs alone are not sufficient for true champ-select event streaming.

### 5. AI Coach production integration is still pending
OpenAI/Pi prompt orchestration is not yet fully wired into the app.

### 6. Real external stats provider integration is still pending
The external stats adapter is ready, but a real production provider still needs to be connected.

---

## Recommended Next Steps After This Chat

### Highest-value next steps
1. Build the **real local desktop companion source adapter**.
2. Add **persistent curated champion trait JSON datasets** with patch-aware overrides.
3. Connect a **real external stats provider** behind `EXTERNAL_STATS_URL`.
4. Wire the **AI Coach layer** to structured recommendation/composition outputs.
5. Expand the UI with:
   - what-if simulation
   - comparison workflows
   - saved draft history
   - richer draft timeline views

### Best immediate next technical task
Start with:
- desktop companion source contract
- LCU-compatible polling adapter scaffold
- champ-select payload -> internal `DraftState` mapper

That is the most aligned next step with the real product need: live draft sync through a local bridge.

---

## Short Summary for a Future Chat
If a future assistant needs the shortest accurate context:

- This project is a multi-region LoL Draft Intelligence Platform.
- It already has deterministic draft-state, composition analysis, and recommendation logic.
- It already supports best-overall and personal-pool recommendations.
- It already blends stats signals into scoring without replacing deterministic logic.
- It now loads the full champion roster directly from Data Dragon and supports explicit patch selection, including `latest`.
- It already has a backend companion with live session recognition and SSE streaming.
- It already supports MANUAL, MOCK, RIOT_API, and DESKTOP_CLIENT live modes.
- Riot region routing is already scaffolded, including LAN via americas/la1.
- Riot public APIs are still not enough for true live champ-select sync.
- A desktop companion runtime scaffold now exists, including mock and file-based runners.
- The next best step is to build the real local LoL desktop source adapter and mapper into internal `DraftState`.
