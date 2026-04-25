import type { ChampionPoolAdvice, ChampionPoolProfile } from '@/domain/champion-pool/types'
import type { Champion } from '@/domain/champion/types'
import type { CompositionProfile } from '@/domain/composition/types'
import type { RecommendationCandidate } from '@/domain/recommendation/types'

interface BuildChampionPoolAdviceInput {
  role: ChampionPoolProfile['role']
  championPool?: ChampionPoolProfile
  bestOverall?: RecommendationCandidate
  bestPool?: RecommendationCandidate
  allyProfile: CompositionProfile
  championsById: Record<string, Champion>
}

function buildCoverageGaps(
  championPool: ChampionPoolProfile | undefined,
  allyProfile: CompositionProfile,
  championsById: Record<string, Champion>,
) {
  if (!championPool || championPool.entries.length === 0) {
    return ['No role-specific pool entries are available yet.']
  }

  return allyProfile.structuralGaps.filter((gap) => {
    return !championPool.entries.some((entry) => {
      const champion = championsById[entry.championId]

      if (!champion) {
        return false
      }

      switch (gap) {
        case 'Reliable frontline':
          return champion.traits.frontline >= 3
        case 'Reliable engage':
        case 'Reliable access into ranged setups':
          return champion.traits.engage >= 3
        case 'Backline peel':
        case 'Anti-dive peel':
          return champion.traits.peel + champion.traits.disengage >= 6
        case 'Magic damage balance':
          return champion.traits.damageProfile === 'MAGIC' || champion.traits.damageProfile === 'MIXED'
        case 'Physical damage balance':
          return champion.traits.damageProfile === 'PHYSICAL' || champion.traits.damageProfile === 'MIXED'
        case 'Late-game scaling insurance':
          return champion.traits.scaling >= 3
        default:
          return false
      }
    })
  })
}

export function buildChampionPoolAdvice({
  role,
  championPool,
  bestOverall,
  bestPool,
  allyProfile,
  championsById,
}: BuildChampionPoolAdviceInput): ChampionPoolAdvice {
  const coverageGaps = buildCoverageGaps(championPool, allyProfile, championsById)
  const strategicGapScore = Math.max(0, (bestOverall?.breakdown.totalScore ?? 0) - (bestPool?.breakdown.totalScore ?? 0))

  if (!bestPool) {
    return {
      role,
      bestOverallChampionId: bestOverall?.championId,
      bestPoolChampionId: undefined,
      decision: 'POOL_GAP_WARNING',
      rationale: [
        'No current in-pool recommendation is available for this role and board state.',
        'Add more champions that solve your most common draft problems for this role.',
      ],
      coverageGaps,
      strategicGapScore,
    }
  }

  if (!bestOverall || bestOverall.championId === bestPool.championId) {
    return {
      role,
      bestOverallChampionId: bestOverall?.championId,
      bestPoolChampionId: bestPool.championId,
      decision: 'TAKE_BEST_POOL',
      rationale: [
        `${bestPool.championName} is already your best practical answer, so there is no need to stretch outside the pool.`,
        'You keep both structural value and execution comfort in the same pick.',
      ],
      coverageGaps,
      strategicGapScore,
    }
  }

  if (coverageGaps.length >= 2 || strategicGapScore >= 13) {
    return {
      role,
      bestOverallChampionId: bestOverall.championId,
      bestPoolChampionId: bestPool.championId,
      decision: 'STRETCH_FOR_BEST_OVERALL',
      rationale: [
        `${bestOverall.championName} covers the current draft problem materially better than ${bestPool.championName}.`,
        'Your pool is a bit thin for the exact structural issue this game is asking you to solve.',
      ],
      coverageGaps,
      strategicGapScore,
    }
  }

  return {
    role,
    bestOverallChampionId: bestOverall.championId,
    bestPoolChampionId: bestPool.championId,
    decision: 'TAKE_BEST_POOL',
    rationale: [
      `${bestPool.championName} gives up some theoretical value versus ${bestOverall.championName}, but the gap is still manageable.`,
      'In most real games, preserving execution reliability here is a reasonable trade.',
    ],
    coverageGaps,
    strategicGapScore,
  }
}
