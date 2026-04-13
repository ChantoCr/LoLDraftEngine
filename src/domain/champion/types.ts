import type { Id } from '@/domain/common/types'

export type Role = 'TOP' | 'JUNGLE' | 'MID' | 'ADC' | 'SUPPORT'
export type DamageProfile = 'PHYSICAL' | 'MAGIC' | 'MIXED'
export type ChampionClass =
  | 'TANK'
  | 'FIGHTER'
  | 'MAGE'
  | 'ASSASSIN'
  | 'MARKSMAN'
  | 'ENCHANTER'
  | 'CATCHER'

export interface ChampionTraits {
  engage: number
  disengage: number
  peel: number
  poke: number
  scaling: number
  dive: number
  pick: number
  frontline: number
  damageProfile: DamageProfile
}

export interface Champion {
  id: Id
  name: string
  roles: Role[]
  classes: ChampionClass[]
  traits: ChampionTraits
}
