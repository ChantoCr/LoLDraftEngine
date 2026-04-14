# LoLDraftEngine

Interactive League of Legends Draft Intelligence Platform scaffolded with React, TypeScript, Tailwind CSS, AGENTS.md, and skill definitions for Pi-driven development.

## Getting started

Frontend only:

```bash
npm install
npm run dev
```

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

Current backend adapters:

- `MOCK` — working SSE draft timeline
- `RIOT_API` — scaffolded backend contract
- `DESKTOP_CLIENT` — scaffolded backend contract

SSE event types:

- `draft-state`
- `session-update`

## Current progress

- deterministic draft-state, composition, and recommendation engine are implemented
- Vitest coverage exists for draft operations, composition analysis, recommendation regression, stats ingestion, and bundle merging
- Data Dragon and generic external stats adapters are scaffolded
- the draft board is now interactive through manual champion selection by role
- stats signals are blended into recommendation scoring without replacing deterministic rules
- a live-session system now supports manual mode, mock live feed mode, and backend-driven Riot / desktop-client provider modes
- a mock live draft provider can stream draft snapshots into the workspace through the same provider contract future real integrations will use
- a local backend API scaffold now exists for summoner recognition and champion-select event streaming
- region support is designed to be multi-region, including LAN, LAS, NA, EUW, EUN, KR, BR, OCE, JP, MENA, SEA regions, and PBE

## Next likely milestones

1. implement the real local backend companion that serves `/api/live/session/recognize` and `/api/live/session/:id/events`
2. ingest real patch meta / matchup / synergy data through the external stats adapter
3. wire OpenAI + Pi flows for the AI Coach layer
4. expand scenario fixtures, bans UI, and draft comparison workflows
