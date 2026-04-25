import type { BuildContext, BuildTrigger } from '@/domain/build/types'
import type { RecommendationScenario } from '@/domain/recommendation/types'

const severityScore: Record<BuildContext['activeThreats'][number]['severity'], number> = {
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
}

const triggerPriority: Record<BuildTrigger, number> = {
  HIGH_DIVE: 10,
  HIGH_BURST: 9,
  HIGH_PICK: 8,
  HIGH_POKE: 7,
  HIGH_FRONTLINE: 6,
  HIGH_HEALING: 5,
  HEAVY_PHYSICAL: 4,
  HEAVY_MAGIC: 4,
  HIGH_CC: 3,
  HIGH_SHIELDING: 2,
}

function toTrigger(type: string): BuildTrigger | undefined {
  switch (type) {
    case 'PHYSICAL_DAMAGE':
      return 'HEAVY_PHYSICAL'
    case 'MAGIC_DAMAGE':
      return 'HEAVY_MAGIC'
    case 'BURST':
      return 'HIGH_BURST'
    case 'DIVE':
      return 'HIGH_DIVE'
    case 'POKE':
      return 'HIGH_POKE'
    case 'PICK':
      return 'HIGH_PICK'
    case 'FRONTLINE':
      return 'HIGH_FRONTLINE'
    case 'HEALING':
      return 'HIGH_HEALING'
    case 'SHIELDING':
      return 'HIGH_SHIELDING'
    case 'CROWD_CONTROL':
      return 'HIGH_CC'
    default:
      return undefined
  }
}

export function buildBuildContext(scenario: RecommendationScenario): BuildContext {
  const role = scenario.simulatedDraftState.currentPickRole
  const laneGuidance = scenario.draftContext.lanePhaseByRole[role]
  const primaryMatchupDanger = scenario.draftContext.matchupDangers.find((danger) => danger.role === role)

  return {
    role,
    lanePosture: laneGuidance?.posture,
    primaryMatchupDanger: primaryMatchupDanger?.type,
    objectiveCall: scenario.draftContext.objectives.primaryCall,
    midGamePosture: scenario.draftContext.midGame.posture,
    activeThreats: scenario.draftContext.enemyThreatProfile.signals
      .flatMap((signal) => {
        const trigger = toTrigger(signal.type)

        return trigger
          ? [
              {
                trigger,
                severity: signal.severity,
                summary: signal.summary,
              },
            ]
          : []
      })
      .sort((left, right) => {
        const severityDelta = severityScore[right.severity] - severityScore[left.severity]

        if (severityDelta !== 0) {
          return severityDelta
        }

        return triggerPriority[right.trigger] - triggerPriority[left.trigger]
      }),
  }
}
