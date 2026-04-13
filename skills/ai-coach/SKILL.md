# ai-coach

## Purpose
Design the conversational intelligence layer that explains, compares, and contextualizes draft recommendations.

## Focus
This skill turns structured signals into strategic explanations that feel helpful, sharp, and grounded.

## Responsibilities
- explain why a pick is recommended
- compare two or more picks
- answer strategy questions about the current draft
- explain win conditions
- explain execution risk
- translate technical scoring into human-readable guidance

## Inputs
- draft state
- composition profile
- recommendation breakdowns
- alerts
- recommendation mode
- player pool context
- game mode

## Outputs
- natural-language explanations
- pick comparisons
- strategic summaries
- draft coaching messages
- what-if analyses

## Rules
- never pretend vague intuition is hard evidence
- prefer structured reasons from the engine when available
- acknowledge uncertainty when signals conflict
- keep explanations actionable
- adapt explanation depth to context

## Typical Questions
- Why is this pick better than that one?
- What is our win condition?
- Why is the comp risky?
- What are we missing?
- Which pick is best if I want to carry?

## Implementation Guidance
- use structured prompt inputs, not raw unfiltered state dumps
- keep AI downstream of deterministic analysis where possible
- ground explanations in score breakdowns and comp alerts
- support concise and deep explanation modes
