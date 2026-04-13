# recommendation-engine

## Purpose
Design and improve the pick recommendation engine for live draft scenarios.

## Focus
This skill computes pick recommendations based on composition needs, enemy threats, matchups, synergy, and recommendation mode.

## Responsibilities
- rank pick candidates
- support best-overall and personal-pool modes
- score picks by multiple dimensions
- justify recommendations with structured breakdowns
- support scenario-based recommendations such as safest pick, best carry, best counterpick, and best frontline fix

## Inputs
- draft state
- available champions
- recommendation mode
- champion pool profile
- mode context such as SoloQ or Competitive
- optional patch/meta signals
- optional stat signals

## Outputs
- ranked candidates
- recommendation scores
- score breakdown by dimension
- reasons for and against each pick
- confidence score
- category-based recommendations

## Scoring Dimensions Typical dimensions may include:
- ally synergy
- enemy counter value
- comp repair value
- damage balance impact
- frontline impact
- engage impact
- peel impact
- execution fit
- meta value
- comfort fit

## Rules
- keep scoring inspectable
- avoid opaque total scores without breakdowns
- support dual recommendation mode cleanly
- distinguish ideal theoretical picks from realistic player picks
- allow category views without duplicating engine logic

## Typical Questions
- What are the best last-pick options?
- What fixes the comp most?
- What is the best pick inside the player's pool?
- What is the safest option?
- Which pick gives the highest strategic upside?

## Implementation Guidance
- model recommendation scoring as composable weighted functions
- separate hard filters from soft ranking
- store reasons as typed signals, not only strings
- support tuning by game mode
