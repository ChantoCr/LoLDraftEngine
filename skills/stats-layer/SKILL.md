# stats-layer

## Purpose
Design and maintain the layer that integrates static and dynamic game data into the draft system.

## Focus
This skill is responsible for data contracts, patch-aware assets, matchup data, meta signals, and statistical confidence inputs.

## Responsibilities
- define data contracts for champions, roles, matchups, and patch context
- integrate external data sources safely
- normalize and cache stats inputs
- version data by patch
- separate raw data from domain interpretation
- provide confidence-aware signals to the recommendation engine

## Inputs
- external APIs
- static champion metadata
- matchup datasets
- patch metadata
- role-based performance signals

## Outputs
- normalized champion records
- matchup signals
- synergy signals
- meta signals
- patch-scoped data bundles
- confidence indicators

## Rules
- keep data contracts stable and typed
- do not leak raw provider shapes into domain logic
- isolate provider-specific transformations
- annotate freshness and confidence where possible
- preserve patch version awareness

## Typical Questions
- What champion metadata do we need?
- How should patch versions be stored?
- How do we normalize matchup stats?
- Which signals should affect recommendation weights?
- How should stale or low-confidence data be handled?

## Implementation Guidance
- create adapter layers for external data providers
- normalize everything into internal domain types
- keep a clear distinction between measured data and inferred logic
- design for partial availability of stats
