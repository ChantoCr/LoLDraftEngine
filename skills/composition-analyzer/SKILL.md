# composition-analyzer

## Purpose
Design and improve the system responsible for evaluating a draft's structural composition.

## Focus
This skill analyzes team identity and composition quality using structured, deterministic signals.

## Responsibilities
- identify composition archetypes
- evaluate damage profile balance
- detect engage, disengage, peel, poke, scaling, dive, pick, and front-to-back traits
- assess frontline presence
- detect strategic weaknesses
- estimate execution difficulty
- infer likely win conditions

## Inputs
- ally picks by role
- enemy picks by role
- game mode
- optional patch context
- optional weights

## Outputs
- composition profile
- comp archetype labels
- strengths
- weaknesses
- structural gaps
- execution difficulty
- win conditions
- alerts

## Rules
- prefer deterministic logic over vague interpretation
- expose structured reasoning
- keep archetype scoring transparent
- allow multiple overlapping archetypes when appropriate
- distinguish between missing tools and weak tools

## Typical Questions
- What does this composition lack?
- Is this team too AD-heavy?
- Does this comp have enough frontline?
- Is this a poke comp, dive comp, or hybrid?
- How hard is this comp to execute?

## Implementation Guidance
- use feature vectors or weighted tags per champion
- aggregate team-level scores from champion-level traits
- create thresholds for alerts and comp labels
- separate raw scoring from natural-language explanation
