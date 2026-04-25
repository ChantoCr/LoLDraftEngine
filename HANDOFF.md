# HANDOFF.md

## Project
LoLDraftEngine

## What this project is
A multi-region League of Legends Draft Intelligence Platform focused on deterministic draft analysis, inspectable recommendation logic, patch-aware data, live-session tooling, personal-pool-aware recommendations, and future AI-assisted strategic coaching.

The product supports two different live-related realities:
1. **RIOT_API** for player recognition, live-game roster snapshots when spectator APIs expose them, queue recognition, and Riot-based personal-pool lookup.
2. **DESKTOP_CLIENT** for the real local-client path to live pick/ban sync.

## Ultimate product goals
The long-term goal is to build a high-quality LoL draft assistant that can:
- understand live draft states
- sync real champion-select state through a local desktop companion
- analyze ally and enemy compositions deterministically
- recommend champions by context
- support both best-overall and personal-pool recommendation modes
- detect queue context such as solo/duo, flex, clash, normals, and similar live environments
- explain why a champion is recommended
- later recommend build paths deterministically from structured draft signals
- stay patch-aware

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

## What happened today

### 1. A deterministic build recommendation layer was implemented
The project now has a dedicated build domain module downstream of recommendation + draft-context signals.

Implemented areas:
- starter guidance
- first-buy guidance
- core item path guidance
- situational anti-dive / anti-poke / anti-heal / anti-frontline / anti-burst branches
- deterministic build explanations
- curated vs scaffolded build-profile quality notes

Important files:
- `src/domain/build/types.ts`
- `src/domain/build/context.ts`
- `src/domain/build/engine.ts`
- `src/domain/build/explain.ts`
- `src/domain/build/itemCatalog.ts`
- `src/domain/build/profileRegistry.ts`
- `src/domain/build/scaffold.ts`

Result:
- build logic is framework-agnostic and testable without React
- recommendation ranking and build selection remain separate domain concerns
- AI remains downstream of structured signals rather than becoming the build authority

### 2. Curated build fidelity was expanded and made patch-scoped
Curated build profiles were expanded for more champions and then moved into a patch-scoped data file.

Implemented files:
- `src/domain/build/data/patches/15.8.ts`
- `src/domain/build/profiles.ts`
- `src/domain/build/profiles.test.ts`

Result:
- curated build profiles now resolve through a patch-aware layer
- scaffold fallback still exists for broader roster coverage
- the project now has a cleaner long-term path for adding future patch-specific build datasets

### 3. Draft-context now exposes richer enemy threat signals for build logic
The deterministic draft-context layer was extended with structured enemy threat profiling.

Implemented / updated:
- `enemyThreatProfile`
- champion-specific threat overrides for burst, sustained DPS, dive, pick, poke, CC, frontline, healing, and shielding
- stronger downstream build triggers for lane-aware first-buy logic

Important files:
- `src/domain/draft-context/types.ts`
- `src/domain/draft-context/build.ts`
- `src/domain/draft-context/build.test.ts`

Result:
- build guidance is now reacting to more realistic board threats
- lane-specific first-buy decisions are materially stronger than the first v1 pass

### 4. Recommendation packaging now includes downstream build outputs
The recommendation pipeline now packages picks plus optional builds while still preserving clean mode separation.

Important files:
- `src/domain/recommendation/types.ts`
- `src/domain/recommendation/engine.ts`
- `src/domain/recommendation/pipeline.ts`
- `src/domain/recommendation/pipeline.test.ts`

Result:
- best-overall and personal-pool recommendations remain distinct in the domain layer
- the UI can render one unified recommendation surface without collapsing the underlying deterministic outputs

### 5. Recommendation UI was redesigned into one tabbed panel
The workspace no longer shows two side-by-side recommendation columns.

Updated files:
- `src/features/recommendations/components/RecommendationPanel.tsx`
- `src/features/meta/components/MetaPanel.tsx`
- `src/pages/DraftWorkspacePage.tsx`

Result:
- one recommendation panel now exists with explicit tabs for:
  - `Best Overall`
  - `Personal Pool`
- mode switching moved into the recommendation surface instead of being duplicated in the meta panel
- the domain distinction between best-overall and personal-pool recommendations is still preserved

### 6. Workspace layout was improved to give more room to coach + recommendations
The top of the page now uses:
- full-width `LiveSessionPanel`
- then a two-column row with:
  - `DraftBoard` on the left
  - draft controls / bans / pool context on the right
- then full-width `AICoachPanel`
- then full-width `RecommendationPanel`

Result:
- the coach and recommendation engine now use much more horizontal space
- the draft-control workflow is tighter and more readable

### 7. Riot personal-pool lookup was hardened
The Riot champion-pool resolver now tries to recover the encrypted summoner id from active-game participant data if Riot omits it from the PUUID-based summoner response.

Updated files:
- `server/playerPool/riot.ts`
- `server/playerPool/riot.test.ts`
- `src/features/pool/hooks/useResolvedChampionPool.ts`

Result:
- Riot pool lookup is more resilient in live contexts where spectator participant data exposes `summonerId`
- if Riot still does not expose an encrypted summoner id anywhere, fallback pool behavior stays explicit and the UI now explains that it is using fallback data

## Main systems already implemented
- deterministic draft-state model
- queue-aware draft state for Riot live sessions
- composition analyzer
- draft-context layer
- deterministic game-plan / coach layer
- recommendation engine with candidate simulation and draft-context dimensions
- best-overall vs personal-pool comparison logic
- tabbed recommendation UI over explicitly separate best-overall vs personal-pool domain outputs
- deterministic build domain layer with starter / first-buy / core / situational guidance
- patch-scoped curated build profile data plus scaffolded build fallback
- champion-pool advisor
- Riot-based personal-pool resolution through champion mastery
- Riot encrypted-summoner-id fallback recovery from active-game participant data when available
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

### Quality
- `npm run build`
- `npm run test:run`

## Current reality
### Already working well
- manual draft editing
- full Data Dragon roster loading in frontend mode
- latest-patch resolution and explicit patch selection
- queue-aware Riot live mapping into draft state
- Riot-based role-aware personal-pool resolution
- recommendation recomputation on draft changes
- richer deterministic recommendation narratives and comparison summaries
- bans UI
- desktop companion LCU path is working in the current user flow
- desktop mock trigger exists in UI and through CLI
- RIOT_API mode can act as a live-game roster analysis mode when spectator APIs expose the game roster
- draft-context, game-plan, recommendation, and coach layers all consume the board deterministically

### Important distinction
#### RIOT_API
Use for:
- Riot player recognition
- live-game presence checks
- live-game roster snapshots when Riot spectator data is available
- queue detection
- Riot-based champion-pool lookup

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
3. Riot active-game role inference is materially better than simple participant order placement, but it is still not production-perfect.
4. All-champion strategic trait fidelity is still partially scaffolded/inferred.
5. Deterministic build recommendation now exists, but curated build profile coverage and threat fidelity are still incomplete for much of the full roster.
6. Real matchup/synergy/meta/build stats still need a real provider behind `EXTERNAL_STATS_URL` or another production path.
7. AI coach is still deterministic-summary-first and not yet fully wired to OpenAI/Pi orchestration.

## Current quality status
Current validated state at the end of today:
- builds pass
- tests pass
- **46 test files**
- **106 tests passing**

## Important environment notes
- `.env.example` is a template only
- the backend actually loads `.env` and `.env.local`
- do not overwrite the user's Riot API key
- for Riot recognition and Riot pool lookup, keep using the user's configured `RIOT_API_KEY`
- optional desktop companion auth can use `DESKTOP_COMPANION_TOKEN`

## What to do next
Read:
- `PROJECT_BRIEFING.md` for full context
- `NEXT_STEPS.md` for execution order

### Highest-value next work after today
1. expand patch-scoped curated build profile coverage and curated threat overrides for more high-priority champions / roles
2. improve all-champion trait fidelity with curated patch-aware trait overrides
3. deepen personal-pool advisor messaging around comfort vs strategy tradeoffs
4. surface structured build outputs further into the coach layer without moving build logic into React
5. continue Riot live fixture capture as a follow-up stream, not the main next product focus

## Recommended first action in the next chat
Start with:
- reading `README.md`, `HANDOFF.md`, `NEXT_STEPS.md`, `PROJECT_BRIEFING.md`, and `PROMPT.md`
- then continue expanding patch-scoped curated build coverage and curated threat fidelity
- keep build + recommendation logic deterministic and downstream of structured signals
- preserve the current UI flow:
  - full-width live session
  - draft board beside controls / bans / pool context
  - full-width AI coach
  - full-width tabbed recommendation engine

Riot reminder for future debugging:
- the spectator-v5 PUUID path is the correct path
- `401 Unknown apikey` is a backend key/config issue, not a spectator path issue
- `DESKTOP_CLIENT` remains the real live-sync path
