# NEXT_STEPS.md

## Purpose
This file captures the recommended execution roadmap after the current state of the project.

## Current snapshot after today
Completed or substantially improved during this session:
- a deterministic build recommendation layer now exists downstream of recommendation + draft-context signals
- build outputs now include:
  - starter guidance
  - first-buy guidance
  - core-item paths
  - situational anti-dive / anti-poke / anti-heal / anti-frontline / anti-burst branches
  - enemy-threat-aware build adjustments
  - deterministic build explanations
- build contracts, build engine, scaffold fallback, and build explanation layers now exist under `src/domain/build/`
- curated build coverage was expanded for more champions / roles and then moved into a patch-scoped file at `src/domain/build/data/patches/15.8.ts`
- the build profile registry is now patch-aware instead of relying on one in-code flat list only
- deterministic draft-context now exposes richer `enemyThreatProfile` signals for:
  - physical damage
  - magic damage
  - burst
  - sustained DPS
  - dive
  - poke
  - pick
  - frontline
  - healing
  - shielding
  - crowd control
- champion-specific threat overrides were expanded to make downstream build logic more realistic
- lane-specific first-buy logic is now stronger for mages, bruisers, ADCs, supports, and tank junglers
- recommendation packaging now includes downstream build outputs while keeping best-overall and personal-pool mode outputs distinct in the domain layer
- the recommendation UI now uses one tabbed recommendation panel instead of two side-by-side panels
- the workspace layout now gives more width to the AI coach and recommendation engine:
  - full-width live session
  - draft board beside controls / bans / pool context
  - full-width AI coach
  - full-width tabbed recommendation panel
- Riot-based champion-pool lookup now has a more resilient encrypted-summoner-id fallback using active-game participant data when Riot omits the id from the PUUID-based summoner response

Current validated state:
- `npm run test:run` passes
- `npm run build` passes
- 46 test files
- 106 tests passing

---

## Priority 1 — Patch-scoped curated build / threat expansion
### Goal
Strengthen the new deterministic build layer by expanding curated build profiles and curated threat fidelity for more high-priority champions and roles.

### Why this is next
The build system now exists and is product-visible. The next strongest step is improving recommendation-build quality across more of the roster without pretending scaffold-only coverage is enough.

### Desired deliverables
- more curated patch-scoped build profiles
- more curated champion-specific threat overrides
- clearer coverage reporting for curated vs scaffolded build support
- stronger lane-aware first-buy logic where important matchups repeatedly appear

### Suggested next tasks
1. add more patch-scoped curated build files and expand coverage beyond the current priority set
2. expand champion-specific threat overrides for difficult or high-frequency champions
3. add build profile completeness / coverage reporting to a debug or data-quality surface
4. keep deterministic build selection separate from recommendation ranking and UI presentation
5. add more regression scenarios for role-specific lane pressure and early itemization decisions

---

## Priority 2 — Curated champion trait dataset
### Goal
Improve all-champion recommendation fidelity by replacing more scaffold-only trait coverage with patch-aware curated data.

### Why this matters now
The engine now uses the full Data Dragon roster for recommendation candidates, but strategic quality still depends heavily on trait fidelity. Better champion traits will directly improve:
- best-overall picks
- personal-pool picks
- coach outputs
- future build-path reasoning

### Suggested next tasks
1. create patch-scoped curated trait files
2. define a merge layer for curated traits over scaffolded defaults
3. add confidence distinctions between curated vs inferred champions
4. add tooling to detect missing or weakly covered champions per patch
5. add regression tests for difficult champions / hybrid role champions

---

## Priority 3 — Personal pool / champion-pool advisor deepening
### Goal
Push personal-pool intelligence beyond raw mastery lookup and basic best-overall vs best-pool comparison.

### Why this is next
The app can now detect a player's pool and compare it against best-overall theory. The next step is to make those tradeoffs even more actionable.

### Remaining deliverables
- clearer comfort vs draft-value tradeoff language
- stronger pool-depth diagnosis per role
- better messaging when the pool lacks a required strategic tool
- stronger in-pool explanation for why a lower-theoretical pick is still the best realistic choice

### Suggested next tasks
1. improve pool-advisor rationale wording and severity
2. optionally enrich pool lookup later with match history / role frequency, not just mastery
3. add regression coverage for shallow-pool edge cases
4. expose more explicit “how much value you lose by staying in-pool” messaging

---

## Priority 4 — Composition analyzer and draft context refinement
### Goal
Continue improving structural context quality so recommendation and build systems become more trustworthy.

### Why this matters now
Recommendation and build quality now depend even more on the quality of the deterministic context layer.

### Suggested next tasks
1. refine structural alerts and comp summaries
2. add more nuanced access / peel / range-control / side-lane signals
3. improve queue-aware differences where appropriate
4. add more representative archetype tests and edge-case boards

---

## Priority 5 — Riot live validation follow-up
### Goal
Keep Riot live validation moving, but as a follow-up stream rather than the main next product focus.

### Why this is lower now
The Riot path is healthier and no longer the main value bottleneck. Coaching, recommendations, and future builds are the stronger product differentiators now.

### Suggested next tasks
1. record more fixtures for active-game success / not-found / forbidden / unavailable outcomes
2. validate queue recognition across more real game types
3. keep Riot mode explicitly framed as live-game analysis, not draft streaming
4. avoid reintroducing legacy encrypted-summoner fallback assumptions unless Riot docs require them again

---

## Priority 6 — Real external stats provider integration
### Goal
Connect a real provider for matchup, synergy, meta, and later build guidance.

### Why this still matters
The deterministic engine is stronger now, but external data remains the next major quality unlock after curated traits and build-path logic.

### Suggested next tasks
1. choose provider or aggregation source
2. wire `EXTERNAL_STATS_URL`
3. add failure / stale-data handling
4. later connect item/build-level signals where appropriate

---

## Priority 7 — Testing expansion
### Goal
Keep regressions under control as recommendations, pool logic, coach outputs, and future builds expand.

### Suggested tasks
1. recommendation regression snapshots across both modes
2. more queue-aware Riot mapping fixtures
3. more draft-context fixtures
4. build-layer tests once implemented
5. future integration tests for recommendation + build packages

---

## Recommended immediate execution order
1. patch-scoped curated build / threat expansion
2. curated champion trait dataset improvement
3. deeper personal-pool / champion-pool advisor messaging
4. coach-layer integration for structured build outputs
5. composition analyzer + draft-context refinement
6. Riot fixture capture follow-up
7. real external stats provider connection

---

## Tomorrow's recommended first coding task
If continuing in a new chat, start here:

### Step 1
Expand patch-scoped curated build data and curated threat overrides for more high-priority champions.

### Step 2
Add visibility for curated-vs-scaffolded build coverage / completeness so recommendation-build quality is easier to inspect.

### Step 3
Then wire structured build outputs deeper into the coach layer without moving build logic into React or making AI the authority.

Keep this aligned with the real product goal:
- `DESKTOP_CLIENT` for true live draft sync
- `RIOT_API` for live-game recognition / roster analysis / queue context / pool lookup
- deterministic recommendations, builds, and coach signals as the core product intelligence

---

## Key reminder
Keep this hierarchy intact:
1. deterministic domain truth
2. stats-informed enhancement
3. AI explanation layer

Do not invert this by making AI the recommendation or build authority.
