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
- summoner lookup
- active-game detection
- active-game roster snapshot mapping into the draft board when spectator data is available

It cannot provide real champ-select pick/ban streaming through public Riot APIs alone.

Practical use of `RIOT_API` now:
- recognize the player
- detect a live game when Riot spectator APIs expose it
- map the current live-game roster into internal `DraftState` for composition/matchup/coach analysis

For true live draft sync, the long-term path remains:
- `DESKTOP_CLIENT`
- local companion process
- local champ-select source adapter

## Current progress

- deterministic draft-state, composition, and recommendation engine are implemented
- Vitest coverage exists for draft operations, composition analysis, recommendation regression, stats ingestion, bundle merging, desktop companion runtime behavior, Riot mapping, and coach/game-plan logic
- Data Dragon loading now supports the full champion roster and latest patch resolution
- the draft board is interactive and supports visible clickable champion search results
- manual draft mode can place any champion in any lane slot for exploration
- a patch selector UI now exists, including `latest` and explicit patch pinning
- stats signals are blended into recommendation scoring without replacing deterministic rules
- a live-session system supports MANUAL, MOCK, RIOT_API, and DESKTOP_CLIENT provider modes
- region support is designed to be multi-region, including LAN, LAS, NA, EUW, EUN, KR, BR, OCE, JP, MENA, SEA regions, and PBE
- a champion trait scaffold dataset can now be generated for broader champion coverage
- desktop-client bridge ingestion routes now exist, including auth/heartbeat-aware ingest handling
- desktop companion mock, file-based, and LCU helper runtimes now exist
- Riot API mode now stays informational/connected instead of pretending champ-select streaming is available
- Riot active-game roster snapshots can now be mapped into internal `DraftState` when spectator APIs expose the live game roster
- the live session panel now includes copyable session ids, companion commands, a desktop mock trigger button, troubleshooting guidance, and clearer live-status indicators
- a deterministic live game-plan layer now exists for:
  - your champion’s job
  - ally comp identity
  - enemy comp identity
  - key threat to watch
  - easiest win condition
  - first practical play rules
- the AI coach panel now renders richer structured guidance from deterministic signals

## Validation status

Current validated state:
- `npm run test:run` ✅
- `npm run build` ✅
- 38 test files
- 78 tests passing

## Next likely milestones

1. harden RIOT_API live-game roster snapshots with better role inference and clearer spectator-availability messaging
2. persist curated champion trait datasets with patch-aware overrides
3. ingest real patch meta / matchup / synergy data through the external stats adapter
4. expand the live game-plan / AI Coach layer with more matchup- and role-specific guidance
5. expand draft history, what-if, and comparison workflows
