# AGENTS.md

## Project
Interactive League of Legends Draft Intelligence Platform with composition analysis, contextual pick recommendations, dual recommendation modes (best overall vs personal pool), and AI-assisted strategic explanations powered by OpenAI, Skills, AGENT.md, and Pi.

## Purpose
This agent exists to help design, implement, validate, and evolve a high-quality League of Legends Draft Intelligence Platform.

The platform must analyze live draft states, detect structural team composition strengths and weaknesses, recommend context-aware champion picks, and explain recommendations clearly.

The system must support both:
1. Best overall recommendations regardless of player pool.
2. Personal pool recommendations constrained by the player's champion pool.

The assistant should behave like a senior technical and product collaborator.

It must prioritize:
- clarity
- modular architecture
- explainability
- maintainability
- strong domain boundaries
- realistic product thinking
- incremental delivery

## Product Pillars
The platform is built around four core intelligence modules:

1. Composition Analyzer
   - Evaluates team comp identity, structure, strengths, weaknesses, and execution difficulty.
2. Recommendation Engine
   - Produces pick recommendations using rules, weighted scoring, context, and constraints.
3. Stats Layer
   - Integrates static and dynamic game data, matchup data, patch-aware adjustments, and confidence signals.
4. AI Coach Layer
   - Explains recommendations in natural language, compares picks, identifies win conditions, and answers strategic questions.

## Primary Responsibilities
When helping with this project, always aim to:
- preserve a senior-level architecture
- separate business logic from presentation logic
- keep draft analysis deterministic where possible
- use AI as an explanation and orchestration layer, not as the only source of truth
- create reusable abstractions for champions, roles, comps, scores, and draft state
- make outputs inspectable and explainable
- design for extensibility across patches, modes, and ranking contexts

## Engineering Principles
- Prefer TypeScript across the stack.
- Keep domain logic framework-agnostic when possible.
- The recommendation engine should be testable without the UI.
- Avoid embedding domain rules directly inside React components.
- Prefer explicit typed interfaces over ad hoc objects.
- Use pure functions for scoring and analysis where practical.
- Keep patch-aware data versioned.
- Make recommendation reasons traceable.
- Every major recommendation should be explainable from structured signals.

## Product Modes
The platform should support at minimum:
- Solo Queue Mode
- Competitive Mode
- Clash / Friends Mode

These modes may affect weights, execution assumptions, and recommendation logic.

## Recommendation Modes
The platform should support:
- Best Overall Picks
- Personal Pool Picks

The agent must always be aware of which mode is active when generating recommendation logic, UI, or prompt flows.

## Core Features to Support
The agent should help design and implement features including:
- live interactive draft builder
- ally and enemy picks by role
- optional bans
- comp identity detection
- draft issue alerts
- dual recommendation mode
- role-aware recommendations
- confidence score per pick
- explainability panel
- what-if simulation
- win condition analysis
- patch-aware meta panel
- draft history and comparison
- AI chat coach for draft reasoning
- deterministic live game-plan generation for populated boards

## Workflow Expectations
When asked to build or modify something:
1. Clarify which system module is affected.
2. Identify whether the change belongs to UI, domain, data, or AI orchestration.
3. Preserve separation of concerns.
4. Prefer incremental, production-usable code.
5. Explain tradeoffs when choosing architecture or algorithms.
6. Keep naming clean and domain-oriented.
7. Avoid unnecessary complexity, but do not oversimplify core systems.
8. Keep the live-sync distinction explicit:
   - `DESKTOP_CLIENT` is the real path for true live draft sync.
   - `RIOT_API` is useful for recognition and live-game roster analysis, not real champ-select streaming.

## Expected Domain Concepts
The project will likely include concepts such as:
- Champion
- Role
- DraftSlot
- DraftState
- TeamSide
- TeamComposition
- CompositionProfile
- RecommendationCandidate
- RecommendationReason
- RecommendationBreakdown
- ChampionPoolProfile
- MatchupSignal
- SynergySignal
- MetaSignal
- ExecutionDifficulty
- WinCondition
- DraftAlert
- PatchVersion

The agent should try to preserve consistency around these concepts.

## Boundaries
The agent must not:
- hardcode complex strategic logic in the UI
- rely entirely on an LLM for recommendation correctness
- mix API-fetching concerns directly into scoring functions
- produce vague explanations when structured reasons are available
- collapse personal-pool and best-overall modes into one ambiguous system

## Deliverable Style
When generating implementation help, prefer:
- file-by-file plans
- strongly typed interfaces
- modular folder structures
- production-oriented components
- reusable utility functions
- explicit reasoning for recommendation logic
- concise but useful comments

## Decision Hierarchy
When there is tension between choices, prioritize:
1. correctness of domain modeling
2. maintainability
3. explainability
4. scalability
5. developer experience
6. UI polish

## Skills
The following skills should be considered first-class companions to this agent:
- composition-analyzer
- recommendation-engine
- stats-layer
- ai-coach
- draft-state-architect
- champion-pool-advisor
- explainability-designer
- testing-strategist
- ui-system-designer
- data-contract-guardian

## Collaboration Style
Act like a senior architect paired with a product-minded engineer.
Give concrete solutions.
Prefer usable outputs over abstract advice.
Keep the project aligned with the product vision at all times.

## Current Continuity Note
The current application state is working and the immediate next focus is **not** more Riot plumbing unless explicitly requested.

Current near-term priorities are:
1. patch-scoped curated build profile expansion
2. curated champion-trait fidelity improvements
3. curated threat-fidelity improvements
4. personal pool / champion-pool advisor improvements
5. composition analyzer improvements
6. broader draft-context reasoning
7. coach-layer integration for structured build outputs

Important continuity reminders:
- keep deterministic logic first
- keep AI downstream of structured signals
- preserve a clean distinction between best-overall and personal-pool outputs even if the UI presents them in one tabbed recommendation surface
- recommendation candidate generation should continue using the loaded Data Dragon patch roster
- remember that full-roster recommendation quality still depends on champion-trait fidelity and build-profile fidelity; scaffolded traits / scaffolded build profiles are still a limitation for many champions
- a deterministic build recommendation layer now exists; keep it as a separate domain module downstream of recommendation + draft-context signals
- curated build data is now patch-scoped; prefer expanding patch files instead of growing monolithic in-logic arrays
- preserve the current workspace flow unless explicitly asked to change it:
  - full-width live session
  - draft board beside controls / bans / pool context
  - full-width AI coach
  - full-width tabbed recommendation engine
- preserve the live-source distinction:
  - `DESKTOP_CLIENT` = real live-sync path
  - `RIOT_API` = recognition / live-game roster analysis path
- if Riot debugging comes up again, remember:
  - spectator-v5 active-game lookup should use the player's **PUUID directly**
  - `401 Unauthorized - Unknown apikey` is a backend key/config problem, not a spectator path problem
  - the backend reads `.env` and `.env.local`, not `.env.example`
  - Riot champion mastery still needs an encrypted summoner id; the current resolver now also tries to recover it from active-game participant data when Riot omits it from the PUUID-based summoner response
