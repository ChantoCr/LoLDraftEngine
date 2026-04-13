# LoLDraftEngine

Interactive League of Legends Draft Intelligence Platform scaffolded with React, TypeScript, Tailwind CSS, AGENTS.md, and skill definitions for Pi-driven development.

## Getting started

```bash
npm install
npm run dev
```

## Available scripts

- `npm run dev` — start the Vite dev server
- `npm run build` — type-check and build for production
- `npm run preview` — preview the production build locally
- `npm run lint` — run ESLint

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
    mock/
      champions.ts
      draft.ts
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
  features/
    coach/components/
      AICoachPanel.tsx
    composition/components/
      CompositionPanel.tsx
    draft-board/components/
      DraftBoard.tsx
    meta/components/
      MetaPanel.tsx
    pool/components/
      ChampionPoolPanel.tsx
    recommendations/components/
      RecommendationPanel.tsx
  pages/
    DraftWorkspacePage.tsx
  shared/
    ui/
      Panel.tsx
```

## Structure intent

- `app/` app shell and provider composition
- `domain/` framework-agnostic draft, recommendation, composition, and pool contracts
- `data/` mock data and future provider adapters
- `features/` UI modules mapped to product capabilities
- `pages/` route-level composition
- `shared/` reusable presentational building blocks

## Notes

This scaffold is set up so the next step can be one of these:

1. implement the deterministic domain engine (`draft-state`, `composition`, `recommendations`)
2. add provider adapters and patch-aware stats data
3. wire OpenAI + Pi flows for the AI Coach layer
4. replace mock data with real draft and champion datasets
