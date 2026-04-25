# TOMORROW_START_PROMPT.md

Read these files first, in order:
1. `README.md`
2. `HANDOFF.md`
3. `NEXT_STEPS.md`
4. `PROJECT_BRIEFING.md`
5. `AGENTS.md`

Current validated state:
- `npm run build` ✅
- `npm run test:run` ✅
- 43 test files
- 92 tests passing

Current project state:
- The application is working.
- `RIOT_API` live lookup remains aligned with spectator-v5 using the player **PUUID directly**.
- `401 Unauthorized - Unknown apikey` remains a backend key/config issue, not a spectator path issue.
- The backend reads `.env` and `.env.local`, not `.env.example`.
- Riot live mapping now recognizes queue context and can distinguish environments such as solo/duo, flex, clash, normals, Quickplay, and ARAM.
- Riot-based personal-pool lookup now exists through champion mastery for the recognized summoner and current role.
- A deterministic `draft-context` layer now exists and produces:
  - lane-phase guidance
  - mid-game posture
  - objective setup guidance
  - role-aware matchup danger
- The AI coach panel now renders those richer deterministic signals.
- The recommendation engine now simulates each candidate into the current open role and scores draft-context-aware dimensions including:
  - `laneMatchupFit`
  - `objectiveSetupFit`
  - `macroPostureFit`
- Recommendation outputs now include deterministic narratives and best-overall vs personal-pool comparison summaries.
- The draft workspace now shows 5 recommendations per mode instead of 3.
- Recommendation candidate generation uses the loaded Data Dragon patch roster for the current patch.
- Important limitation: full-roster recommendation quality still depends on champion-trait fidelity, and many champions are still scaffolded/inferred rather than fully curated.
- Important limitation: there is still **no deterministic build recommendation layer** yet.

Today’s priority should be:
1. build a deterministic recommendation-build layer for top candidates
2. keep it downstream of structured recommendation + draft-context signals
3. avoid pushing build logic into the UI
4. preserve the distinction between best-overall and personal-pool outputs
5. keep `DESKTOP_CLIENT` as the real live-sync path and `RIOT_API` as recognition / live-game roster / queue / pool mode

Please start with a file-by-file implementation plan for:
- starter / first-buy guidance
- core item path guidance
- situational item branches
- enemy-threat-aware build adjustments
- build explanation output for both best-overall and personal-pool recommendations

Then identify what must change in:
- the recommendation engine
- the draft-context layer
- any future build domain module
- the champion trait / data fidelity layer
- the UI presentation layer

Important constraints:
- keep deterministic logic first
- keep AI downstream of structured signals
- preserve clean domain boundaries
- do not push build logic into the UI
- keep best-overall and personal-pool modes clearly distinct
- do not pretend Data Dragon alone is enough for matchup-perfect build logic
- use the loaded Data Dragon roster, but be explicit about current scaffolded trait limitations

Deliver:
- a concrete architecture plan
- proposed file changes
- typed domain contracts
- incremental implementation order
- testing plan
