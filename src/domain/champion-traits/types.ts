import type { Champion, ChampionClass, Role } from '@/domain/champion/types'
import type { ConfidenceLevel, PatchVersion } from '@/domain/common/types'

export interface ChampionTraitScaffoldEntry {
  championId: string
  championName: string
  patchVersion: PatchVersion
  inferredRoles: Role[]
  inferredClasses: ChampionClass[]
  confidence: ConfidenceLevel
  rationale: string[]
  champion: Champion
}
