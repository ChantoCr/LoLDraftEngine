# PROMPT.md

Use this as the starting prompt for the next chat/session.

---

You are continuing work on **LoLDraftEngine**.

## Read first, in order
1. `README.md`
2. `HANDOFF.md`
3. `NEXT_STEPS.md`
4. `PROJECT_BRIEFING.md`
5. `AGENTS.md`

## Current validated state
- `npm run build` ✅
- `npm run test:run` ✅
- **46 test files**
- **106 tests passing**

## Current project state
- The application is working.
- `DESKTOP_CLIENT` remains the real live-sync path.
- `RIOT_API` remains recognition / live-game roster analysis / queue context / pool lookup mode, not true champ-select streaming.
- Riot live lookup remains aligned with spectator-v5 using the player **PUUID directly**.
- `401 Unauthorized - Unknown apikey` remains a backend key/config issue, not a spectator path issue.
- The backend reads `.env` and `.env.local`, not `.env.example`.
- Riot queue recognition now distinguishes solo/duo, flex, clash, normals, Quickplay, and ARAM.
- Riot-based personal-pool lookup exists through champion mastery for the recognized summoner and current role.
- Riot pool lookup now has a fallback attempt that can recover the encrypted summoner id from active-game participant data when Riot omits it from the PUUID-based summoner response.
- If Riot still does not expose an encrypted summoner id anywhere, fallback pool behavior remains the correct product fallback.
- A deterministic draft-context layer exists and produces:
  - lane-phase guidance
  - mid-game posture
  - objective setup guidance
  - role-aware matchup danger
  - structured enemy threat profiling
- A deterministic build layer now exists and produces:
  - starter guidance
  - first-buy guidance
  - core item paths
  - situational anti-dive / anti-poke / anti-heal / anti-frontline / anti-burst branches
  - enemy-threat-aware build adjustments
  - structured build explanations
- Recommendation outputs now include deterministic narratives and best-overall vs personal-pool comparison summaries.
- Recommendation UI now uses **one tabbed recommendation panel** for:
  - Best Overall
  - Personal Pool
- Important: keep the domain distinction explicit even though the UI is tabbed.
- The workspace layout currently is:
  - full-width `LiveSessionPanel`
  - row with `DraftBoard` on the left and controls / bans / pool context on the right
  - full-width `AICoachPanel`
  - full-width `RecommendationPanel`
  - lower row with `CompositionPanel` and `StatsIntelPanel`
- Curated build data is now patch-scoped, with current curated data in:
  - `src/domain/build/data/patches/15.8.ts`
- Build profile lookup is patch-aware.
- Full-roster recommendation/build quality still depends on curated trait fidelity and curated build profile coverage.
- Many champions are still scaffolded / inferred rather than fully curated.

## Today’s best next priority
Continue with:
1. **patch-scoped curated build profile expansion**
2. **curated threat-fidelity expansion**
3. **curated champion-trait fidelity improvements**
4. optionally **deeper structured build integration into the coach layer**

## What to work on next
Please start with a concrete implementation pass for:
- expanding curated patch-scoped build profiles for more high-priority champions / roles
- expanding curated champion-specific threat overrides for difficult / high-frequency champions
- adding clearer curated-vs-scaffolded build coverage / completeness visibility
- preserving deterministic logic first
- keeping AI downstream of structured signals
- keeping build logic out of React

## Important constraints
- keep deterministic logic first
- keep AI downstream of structured signals
- preserve clean domain boundaries
- do not push build logic into the UI
- preserve the clean distinction between best-overall and personal-pool outputs
- do not pretend Data Dragon alone is enough for matchup-perfect build logic
- use the loaded Data Dragon roster, but be explicit about scaffolded trait / scaffolded build limitations
- preserve the current UI layout unless a new change is explicitly requested

## Preferred deliverable style
- file-by-file plan
- strongly typed contracts
- incremental implementation order
- tests added with each meaningful deterministic expansion
- clear note about curated vs scaffolded coverage impact

## Good first files to inspect after the docs
- `src/domain/build/data/patches/15.8.ts`
- `src/domain/build/profiles.ts`
- `src/domain/build/profileRegistry.ts`
- `src/domain/build/engine.ts`
- `src/domain/draft-context/build.ts`
- `src/domain/build/profiles.test.ts`
- `src/domain/build/engine.test.ts`
- `src/pages/DraftWorkspacePage.tsx`

## If you need a concise mission statement
Continue improving the deterministic recommendation + build system, expand curated fidelity, preserve domain separation, and keep the product aligned around inspectable structured draft intelligence rather than LLM-first behavior.
