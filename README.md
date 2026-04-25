# LoLDraftEngine

Interactive League of Legends Draft Intelligence Platform scaffolded with React, TypeScript, Tailwind CSS, AGENTS.md, and skill definitions for Pi-driven development.

## Important project context files

Read these first when continuing work or starting a new chat:

- `PROJECT_BRIEFING.md` — full project briefing and technical context
- `HANDOFF.md` — concise handoff summary for future sessions
- `NEXT_STEPS.md` — prioritized roadmap and implementation order

## Getting started

Frontend only:

```bash
npm install
npm run dev
```

Manual drafting now loads the champion roster directly from Data Dragon in the browser, so the draft board can expose the full champion list even when the local backend is not running.

The app supports:
- the special patch token `latest`
- automatic resolution of `latest` to the newest Data Dragon patch
- explicit patch pinning from the UI, such as `16.8.1`

### Important Riot env note
`.env.example` is only a template.
To use `RIOT_API`, create a real env file:

```bash
cp .env.example .env.local
```

Then set your own values in `.env.local`, especially:
- `RIOT_API_KEY=...`

Important Riot key troubleshooting:
- `.env.example` is only a template, not the active backend config
- the backend reads `.env` and `.env.local`
- `401 Unauthorized - Unknown apikey` means the configured Riot key is invalid or expired
- if you are using a temporary Riot development key, generate a fresh one in the Riot Developer Portal and restart `npm run server:dev`
- if you already updated `.env.local` and still see `Unknown apikey`, check whether a stale shell/system `RIOT_API_KEY` is overriding the file value

Frontend + backend companion in two terminals:

```bash
npm run server:dev
npm run dev
```

Or run the backend companion directly:

```bash
npm run server:start
```

## Available scripts

- `npm run dev` — start the Vite dev server
- `npm run build` — build frontend and backend scaffold
- `npm run build:client` — build frontend only
- `npm run server:dev` — run the backend companion in watch mode
- `npm run server:build` — compile the backend companion scaffold
- `npm run server:start` — start the backend companion with `tsx`
- `npm run desktop:mock -- <sessionId>` — post a mock desktop-companion draft stream into an existing desktop-client session
- `npm run desktop:file -- <sessionId> <draftState.json>` — run a local desktop companion that polls a bridge-compatible draft-state json file and ingests updates into the backend
- `npm run desktop:lcu -- <sessionId> [patchVersion] [lockfilePath]` — run the LCU-backed local desktop companion against the active League client lockfile
- `npm run preview` — preview the production build locally
- `npm run lint` — run ESLint
- `npm run test` — run Vitest in watch mode
- `npm run test:run` — run the test suite once

## Frontend architecture scaffold

```text
src/
  app/
    App.tsx
    layout/
      AppShell.tsx
    providers/
      AppProviders.tsx
  data/
    cache/
      patchDataCache.ts
    mock/
      champions.ts
      draft.ts
    providers/
      dDragon/
        client.ts
        normalize.ts
        service.ts
        types.ts
      external/
        adapter.ts
        normalize.ts
        service.ts
        types.ts
      live/
        backendApi/
          client.ts
          provider.ts
          types.ts
        desktopClient.ts
        index.ts
        mock.ts
        riot.ts
  domain/
    champion/
      types.ts
    champion-pool/
      types.ts
    common/
      types.ts
    composition/
      types.ts
    draft/
      constants.ts
      types.ts
    recommendation/
      types.ts
    stats/
      factories.ts
      merge.ts
      provider.ts
      selectors.ts
      types.ts
  features/
    coach/components/
      AICoachPanel.tsx
    composition/components/
      CompositionPanel.tsx
    draft-board/components/
      DraftBoard.tsx
    live-session/
      components/
        LiveSessionPanel.tsx
      hooks/
        useLiveDraftSession.ts
    meta/components/
      MetaPanel.tsx
    pool/components/
      ChampionPoolPanel.tsx
    recommendations/components/
      RecommendationPanel.tsx
    stats/components/
      StatsIntelPanel.tsx
  pages/
    DraftWorkspacePage.tsx
  shared/
    ui/
      Panel.tsx
```

## Structure intent

- `app/` app shell and provider composition
- `domain/` framework-agnostic draft, recommendation, composition, pool, stats, and live-session contracts
- `data/` mock data, provider adapters, fixture ingestion, and patch-scoped caching
- `features/` UI modules mapped to product capabilities, including interactive draft controls and stats panels
- `pages/` route-level composition
- `shared/` reusable presentational building blocks

## Backend live API scaffold

The companion backend now exposes region-aware live-draft scaffolding for all supported Riot regions, including **LAN**.

Implemented endpoints:

- `GET /api/health`
- `POST /api/live/session/recognize`
- `GET /api/live/session/:id/events`
- `POST /api/live/desktop-client/session/:id/ingest`
- `POST /api/live/desktop-client/mock/session/:id/mock-sequence`
- `GET /api/stats/patches`
- `GET /api/stats/patch/:patchVersion/catalog`
- `GET /api/stats/patch/:patchVersion/bundle`
- `GET /api/champion-traits/patch/:patchVersion/scaffold`
- `POST /api/player-pool/riot/resolve`

Current backend adapters:

- `MOCK` — working mock live draft provider
- `RIOT_API` — region-aware Riot recognition scaffold with Americas / Europe / Asia / SEA routing
- `DESKTOP_CLIENT` — local bridge contract, ingest API, mock runner, and file-based bridge-compatible runtime scaffold

SSE event types:

- `draft-state`
- `session-update`

Example environment variables are in `.env.example`.

## Desktop companion notes

The desktop companion bridge now supports:
- ingest acknowledgements
- optional auth via `DESKTOP_COMPANION_TOKEN`
- heartbeat/session health updates
- companion metadata
- retry-aware local runtime posting
- typed source snapshots
- stale/duplicate ingest protection
- mock runner
- file-based bridge-compatible runner
- LCU lockfile discovery and local polling scaffold
- local self-signed HTTPS-compatible LCU requester
- in-UI desktop mock trigger helper

Current desktop-client reality:
- `DESKTOP_CLIENT` is the real path for live draft sync
- `desktop:lcu` is the preferred real local-client path
- `desktop:mock` and `desktop:file` are useful validation tools

## Riot live notes

`RIOT_API` mode can currently help with:
- Riot account recognition
- summoner profile metadata lookup
- active-game detection through spectator APIs
- active-game roster snapshot mapping into the draft board when spectator data is available

Important current implementation note from the official Riot docs:
- `summoner-v4` by PUUID should not be treated as the source of legacy encrypted summoner ids / account ids / legacy names
- `spectator-v5` active-game lookup should use the player's **PUUID directly**
- Data Dragon is unrelated to this live lookup path; DDragon only provides static patch/champion data

It cannot provide real champ-select pick/ban streaming through public Riot APIs alone.

Practical use of `RIOT_API` now:
- recognize the player
- detect a live game when Riot spectator APIs expose it
- map the current live-game roster into internal `DraftState` for composition/matchup/coach analysis
- surface detailed lookup diagnostics when Riot does not return an active spectator game

For true live draft sync, the long-term path remains:
- `DESKTOP_CLIENT`
- local companion process
- local champ-select source adapter

## Current progress

- deterministic draft-state, composition, recommendation, draft-context, champion-pool advisor, build, and coach layers are implemented
- Vitest coverage exists for draft operations, composition analysis, recommendation regression, build logic, build profile coverage, draft-context generation, champion-pool advisor behavior, stats ingestion, bundle merging, desktop companion runtime behavior, Riot mapping, and coach/game-plan logic
- Data Dragon loading now supports the full champion roster and latest patch resolution
- the draft board is interactive and supports visible clickable champion search results
- manual draft mode can place any champion in any lane slot for exploration
- a patch selector UI now exists, including `latest` and explicit patch pinning
- stats signals are blended into recommendation scoring without replacing deterministic rules
- recommendation candidates are evaluated with simulated candidate insertion plus draft-context scoring for lane matchup, objective setup, and macro posture fit
- recommendation outputs include richer deterministic narratives, decision factors, and best-overall vs personal-pool comparison summaries
- the deterministic build layer now produces:
  - starter guidance
  - first-buy guidance
  - core item paths
  - situational anti-dive / anti-poke / anti-heal / anti-frontline / anti-burst branches
  - enemy-threat-aware build adjustments
  - structured build explanations
- build guidance remains downstream of recommendation + draft-context signals and is kept out of React components
- curated build profiles are now patch-scoped through `src/domain/build/data/patches/15.8.ts`, with scaffolded fallback for broader roster coverage
- the workspace recommendation UI now uses one recommendation panel with tabs for `Best Overall` and `Personal Pool` instead of two side-by-side panels
- the draft workspace layout now uses more horizontal space for the AI coach and recommendation engine; the draft board sits beside draft controls / bans, and the coach + recommendation sections render full width below
- a live-session system supports MANUAL, MOCK, RIOT_API, and DESKTOP_CLIENT provider modes
- region support is designed to be multi-region, including LAN, LAS, NA, EUW, EUN, KR, BR, OCE, JP, MENA, SEA regions, and PBE
- a champion trait scaffold dataset can now be generated for broader champion coverage
- desktop-client bridge ingestion routes now exist, including auth/heartbeat-aware ingest handling
- desktop companion mock, file-based, and LCU helper runtimes now exist
- Riot API mode now stays informational/connected instead of pretending champ-select streaming is available
- Riot active-game lookup follows the official Riot docs more closely by using spectator-v5 with the player's PUUID directly
- Riot active-game roster snapshots can now be mapped into internal `DraftState` when spectator APIs expose the live game roster
- Riot queue recognition now maps live Riot sessions into queue-aware draft context such as Ranked Solo/Duo, Ranked Flex, Clash, normals, Quickplay, and ARAM
- Riot role inference is now heuristic-based instead of simple participant order only
- Riot invalid/expired API key handling is clearer, including explicit `401 Unauthorized - Unknown apikey` guidance, `.env` / `.env.local` reminders, and stale env override troubleshooting
- Riot-based personal-pool resolution now exists through champion mastery lookup for the recognized summoner and current role, with a fallback attempt that can recover the encrypted summoner id from active-game participant data when Riot omits it from the PUUID-based summoner response
- the live session panel includes copyable session ids, companion commands, troubleshooting guidance, clearer live-status indicators, Riot lookup diagnostics, Riot next-step guidance, and a desktop mock trigger button
- the desktop-client flow includes a compact debug panel with last heartbeat, companion instance id, last ingest event id / sequence, and a lightweight timeline of recent companion events
- a deterministic live game-plan layer exists for:
  - your champion’s job
  - ally comp identity
  - enemy comp identity
  - key threat to watch
  - easiest win condition
  - practical play rules
  - lane phase guidance
  - mid-game posture
  - objective setup guidance
  - role-aware matchup danger
- the AI coach panel renders richer structured guidance from deterministic signals
- the current app uses the full loaded Data Dragon champion roster for recommendation candidate generation, while strategic trait fidelity and build profile fidelity for many champions are still scaffolded/inferred rather than fully hand-curated

## Validation status

Current validated state:
- `npm run test:run` ✅
- `npm run build` ✅
- 46 test files
- 106 tests passing

## Next likely milestones

1. expand patch-scoped curated build profile coverage and champion threat fidelity for more high-priority champions / roles
2. persist patch-scoped curated champion trait datasets with clearer curated-vs-scaffolded confidence reporting
3. deepen personal-pool advisor messaging and recommendation comparison so the user sees explicit comfort vs strategic-value tradeoffs in the tabbed recommendation workflow
4. surface structured build guidance more deeply into the AI coach layer while keeping AI downstream of deterministic signals
5. validate the updated `RIOT_API` spectator-v5 PUUID flow, queue-aware live mapping, and Riot mastery fallback behavior against more real live games and captured fixtures
6. connect a real external stats provider for matchup, synergy, meta, and future build guidance
