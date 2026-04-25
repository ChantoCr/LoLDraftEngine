import type { Champion } from '@/domain/champion/types'
import type { ChampionBuildProfile } from '@/domain/build/types'

function inferArchetype(champion: Champion, role: ChampionBuildProfile['role']): ChampionBuildProfile['archetype'] {
  if (role === 'SUPPORT' && champion.classes.includes('ENCHANTER')) {
    return 'ENCHANTER_UTILITY'
  }

  if (role === 'SUPPORT' && champion.traits.peel + champion.traits.disengage >= champion.traits.engage + 2) {
    return 'PEEL_TANK_SUPPORT'
  }

  if (role === 'SUPPORT') {
    return 'ENGAGE_TANK_SUPPORT'
  }

  if (role === 'ADC' || champion.classes.includes('MARKSMAN')) {
    return 'CRIT_MARKSMAN'
  }

  if (role === 'MID' || champion.classes.includes('MAGE')) {
    return 'CONTROL_MAGE'
  }

  if (role === 'JUNGLE' && champion.classes.includes('TANK')) {
    return 'TANK_JUNGLER'
  }

  if (champion.traits.poke >= 4) {
    return 'POKE_FIGHTER'
  }

  return 'DIVER_BRUISER'
}

export function scaffoldChampionBuildProfile(champion: Champion, role: ChampionBuildProfile['role']): ChampionBuildProfile {
  const archetype = inferArchetype(champion, role)

  switch (archetype) {
    case 'ENGAGE_TANK_SUPPORT':
      return {
        championId: champion.id,
        role,
        source: 'SCAFFOLDED',
        archetype,
        defaultStarterItemIds: ['world-atlas', 'health-potion', 'health-potion'],
        defaultFirstBuyItemIds: ['ruby-crystal', 'boots'],
        coreTemplates: [{ id: 'default', label: 'Scaffolded engage support core', itemIds: ['locket', 'zekes-convergence', 'knights-vow'] }],
        situationalResponses: {
          HEAVY_PHYSICAL: ['frozen-heart'],
          HEAVY_MAGIC: ['abyssal-mask'],
          HIGH_HEALING: ['thornmail'],
          HIGH_DIVE: ['knights-vow'],
        },
        notes: ['Build profile is scaffolded from support engage traits and may need curation.'],
      }
    case 'PEEL_TANK_SUPPORT':
      return {
        championId: champion.id,
        role,
        source: 'SCAFFOLDED',
        archetype,
        defaultStarterItemIds: ['world-atlas', 'health-potion', 'health-potion'],
        defaultFirstBuyItemIds: ['kindlegem', 'boots'],
        coreTemplates: [{ id: 'default', label: 'Scaffolded peel support core', itemIds: ['locket', 'knights-vow', 'frozen-heart'] }],
        situationalResponses: {
          HEAVY_MAGIC: ['abyssal-mask'],
          HIGH_DIVE: ['knights-vow'],
          HIGH_CC: ['mikaels'],
          HIGH_HEALING: ['thornmail'],
        },
        notes: ['Build profile is scaffolded from peel/disengage traits and may need curation.'],
      }
    case 'ENCHANTER_UTILITY':
      return {
        championId: champion.id,
        role,
        source: 'SCAFFOLDED',
        archetype,
        defaultStarterItemIds: ['world-atlas', 'health-potion', 'health-potion'],
        defaultFirstBuyItemIds: ['forbidden-idol', 'boots'],
        coreTemplates: [{ id: 'default', label: 'Scaffolded enchanter core', itemIds: ['shurelya', 'redemption', 'mikaels'] }],
        situationalResponses: {
          HIGH_DIVE: ['redemption'],
          HIGH_PICK: ['mikaels'],
          HIGH_CC: ['mikaels'],
          HIGH_SHIELDING: ['imperial-mandate'],
        },
        notes: ['Build profile is scaffolded from enchanter/catcher traits and may need curation.'],
      }
    case 'CONTROL_MAGE':
      return {
        championId: champion.id,
        role,
        source: 'SCAFFOLDED',
        archetype,
        defaultStarterItemIds: ['doran-ring', 'health-potion'],
        defaultFirstBuyItemIds: ['lost-chapter', 'boots'],
        coreTemplates: [{ id: 'default', label: 'Scaffolded mage core', itemIds: ['malignance', 'shadowflame', 'rabadons'] }],
        situationalResponses: {
          HIGH_DIVE: ['zhonyas'],
          HIGH_PICK: ['banshees'],
          HIGH_BURST: ['zhonyas'],
          HIGH_FRONTLINE: ['shadowflame'],
        },
        notes: ['Build profile is scaffolded from mage traits and may need curation.'],
      }
    case 'CRIT_MARKSMAN':
      return {
        championId: champion.id,
        role,
        source: 'SCAFFOLDED',
        archetype,
        defaultStarterItemIds: ['doran-blade', 'health-potion'],
        defaultFirstBuyItemIds: ['noonquiver', 'boots'],
        coreTemplates: [{ id: 'default', label: 'Scaffolded marksman core', itemIds: ['infinity-edge', 'runaans', 'bloodthirster'] }],
        situationalResponses: {
          HIGH_FRONTLINE: ['lord-dominiks'],
          HIGH_DIVE: ['guardian-angel'],
          HIGH_BURST: ['guardian-angel'],
          HIGH_POKE: ['bloodthirster'],
        },
        notes: ['Build profile is scaffolded from marksman traits and may need curation.'],
      }
    case 'TANK_JUNGLER':
      return {
        championId: champion.id,
        role,
        source: 'SCAFFOLDED',
        archetype,
        defaultStarterItemIds: ['jungle-pet', 'health-potion'],
        defaultFirstBuyItemIds: ['kindlegem', 'cloth-armor'],
        coreTemplates: [{ id: 'default', label: 'Scaffolded tank jungle core', itemIds: ['sunfire-aegis', 'warmogs', 'abyssal-mask'] }],
        situationalResponses: {
          HEAVY_PHYSICAL: ['frozen-heart'],
          HEAVY_MAGIC: ['abyssal-mask'],
          HIGH_HEALING: ['thornmail'],
          HIGH_FRONTLINE: ['warmogs'],
        },
        notes: ['Build profile is scaffolded from tank jungle traits and may need curation.'],
      }
    case 'POKE_FIGHTER':
      return {
        championId: champion.id,
        role,
        source: 'SCAFFOLDED',
        archetype,
        defaultStarterItemIds: ['doran-blade', 'health-potion'],
        defaultFirstBuyItemIds: ['long-sword', 'caulfields-warhammer'],
        coreTemplates: [{ id: 'default', label: 'Scaffolded poke fighter core', itemIds: ['black-cleaver', 'deaths-dance', 'maw'] }],
        situationalResponses: {
          HEAVY_MAGIC: ['maw'],
          HEAVY_PHYSICAL: ['deaths-dance'],
          HIGH_FRONTLINE: ['black-cleaver'],
        },
        notes: ['Build profile is scaffolded from poke-fighter traits and may need curation.'],
      }
    case 'DIVER_BRUISER':
    default:
      return {
        championId: champion.id,
        role,
        source: 'SCAFFOLDED',
        archetype: 'DIVER_BRUISER',
        defaultStarterItemIds: role === 'JUNGLE' ? ['jungle-pet', 'health-potion'] : ['doran-blade', 'health-potion'],
        defaultFirstBuyItemIds: ['long-sword', 'caulfields-warhammer'],
        coreTemplates: [{ id: 'default', label: 'Scaffolded diver bruiser core', itemIds: ['trinity', 'black-cleaver', 'steraks'] }],
        situationalResponses: {
          HIGH_FRONTLINE: ['black-cleaver'],
          HIGH_BURST: ['steraks'],
          HEAVY_PHYSICAL: ['deaths-dance'],
          HEAVY_MAGIC: ['maw'],
        },
        notes: ['Build profile is scaffolded from fighter/dive traits and may need curation.'],
      }
  }
}
