# draft-state-architect

## Purpose
Design the draft state model and the rules that govern live draft interaction.

## Responsibilities
- define draft state shape
- model ally and enemy slots by role
- support bans and flexible selection states
- track available champion pool during draft
- support what-if simulation branches
- preserve state transitions clearly

## Rules
- make draft state serializable
- keep it UI-agnostic
- support saved draft history
- support deterministic recomputation
