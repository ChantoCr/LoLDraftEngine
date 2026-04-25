import type { Champion, Role } from '@/domain/champion/types'
import type { CompositionProfile } from '@/domain/composition/types'
import { ROLE_ORDER } from '@/domain/draft/constants'
import { getDraftSlot } from '@/domain/draft/selectors'
import type { DraftState } from '@/domain/draft/types'
import type {
  DraftContext,
  EnemyThreatProfile,
  GuidanceBullet,
  GuidanceSeverity,
  LanePhaseGuidance,
  LanePosture,
  MatchupDangerType,
  MidGameGuidance,
  MidGamePosture,
  ObjectiveSetupGuidance,
  ObjectiveSetupStyle,
  RoleMatchupDanger,
  ThreatSignal,
  ThreatSignalType,
} from '@/domain/draft-context/types'

interface BuildDraftContextInput {
  draftState: DraftState
  championsById: Record<string, Champion>
  allyProfile: CompositionProfile
  enemyProfile: CompositionProfile
}

function createBullet(
  id: string,
  label: string,
  explanation: string,
  priority: GuidanceSeverity,
  sources: string[],
): GuidanceBullet {
  return {
    id,
    label,
    explanation,
    priority,
    sources,
  }
}

function getChampionForRole(team: DraftState['allyTeam'], role: Role, championsById: Record<string, Champion>) {
  const championId = getDraftSlot(team, role)?.championId
  return championId ? championsById[championId] : undefined
}

function getTeamChampions(team: DraftState['allyTeam'], championsById: Record<string, Champion>) {
  return ROLE_ORDER.flatMap((role) => {
    const champion = getChampionForRole(team, role, championsById)
    return champion ? [champion] : []
  })
}

function getCoordinationHint(draftState: DraftState) {
  if (draftState.productMode === 'COMPETITIVE') {
    return {
      summary: 'Coordinated setup is expected, so lean into timer-based objective plans and layered entrances.',
      source: 'product-mode-competitive',
    }
  }

  if (draftState.productMode === 'CLASH') {
    return {
      summary: 'You can expect more coordination than solo queue, so commit to grouped setup once vision and wave state are ready.',
      source: 'product-mode-clash',
    }
  }

  return {
    summary: 'Prefer cleaner, lower-setup plays that do not rely on everyone syncing the same idea perfectly.',
    source: 'product-mode-solo',
  }
}

function toSeverity(score: number): GuidanceSeverity {
  if (score >= 3.4) {
    return 'HIGH'
  }

  if (score >= 2.1) {
    return 'MEDIUM'
  }

  return 'LOW'
}

function getDangerMitigation(type: MatchupDangerType, role: Role) {
  switch (type) {
    case 'ALL_IN':
      return 'Thin the wave safely, track key engage cooldowns, and avoid donating the first health threshold for free.'
    case 'POKE':
      return 'Preserve health before the objective timer and do not trade your potion economy for low-value last hits.'
    case 'ROAM':
      return role === 'MID' || role === 'SUPPORT'
        ? 'Ping disappearance early and only leave lane on waves you can actually move from first.'
        : 'Respect missing timers and avoid isolated pathing when enemy move priority is unclear.'
    case 'DIVE':
      return 'Keep vision on likely entry lanes and save the first peel or disengage tool for the real commit.'
    case 'PICK':
      return 'Do not contest fog alone; reset together and force the enemy to show before facechecking.'
    case 'PRIORITY_LOSS':
      return 'Do not take forced trades just to hold wave control when your lane naturally loses first push.'
    default:
      return 'Play the safer wave and vision state until the board gives you a cleaner window.'
  }
}

function buildRoleDanger(
  role: Role,
  allyChampion: Champion | undefined,
  enemyChampion: Champion | undefined,
  enemyJungle: Champion | undefined,
  enemySupport: Champion | undefined,
): RoleMatchupDanger | undefined {
  if (!allyChampion || !enemyChampion) {
    return undefined
  }

  const allInScore =
    enemyChampion.traits.engage * 0.65 +
    enemyChampion.traits.dive * 0.55 -
    (allyChampion.traits.disengage * 0.45 + allyChampion.traits.peel * 0.35 + allyChampion.traits.frontline * 0.25)
  const pokeScore =
    enemyChampion.traits.poke * 0.9 - (allyChampion.traits.disengage * 0.35 + allyChampion.traits.poke * 0.2)
  const roamScore =
    (enemyChampion.traits.pick * 0.65 + enemyChampion.traits.engage * 0.35) +
    ((enemyJungle?.traits.pick ?? 0) * 0.35 + (enemyJungle?.traits.dive ?? 0) * 0.3) -
    (allyChampion.traits.pick * 0.2 + allyChampion.traits.disengage * 0.2)
  const diveScore =
    ((enemyJungle?.traits.dive ?? 0) * 0.65 + (enemySupport?.traits.engage ?? 0) * 0.35 + enemyChampion.traits.dive * 0.35) -
    (allyChampion.traits.peel * 0.4 + allyChampion.traits.frontline * 0.25 + allyChampion.traits.disengage * 0.35)
  const pickScore =
    enemyChampion.traits.pick * 0.7 +
    ((enemySupport?.traits.pick ?? 0) * 0.45 + (enemySupport?.traits.engage ?? 0) * 0.2) -
    (allyChampion.traits.disengage * 0.35 + allyChampion.traits.peel * 0.25)
  const priorityLossScore =
    (enemyChampion.traits.poke * 0.45 + enemyChampion.traits.engage * 0.35) -
    (allyChampion.traits.poke * 0.4 + allyChampion.traits.engage * 0.15)

  const ranked = [
    { type: 'ALL_IN' as const, score: allInScore },
    { type: 'POKE' as const, score: pokeScore },
    { type: 'ROAM' as const, score: roamScore },
    { type: 'DIVE' as const, score: diveScore },
    { type: 'PICK' as const, score: pickScore },
    { type: 'PRIORITY_LOSS' as const, score: priorityLossScore },
  ].sort((left, right) => right.score - left.score)

  const topDanger = ranked[0]

  if (!topDanger || topDanger.score < 1.8) {
    return undefined
  }

  const severity = toSeverity(topDanger.score)

  return {
    role,
    allyChampionId: allyChampion.id,
    enemyChampionId: enemyChampion.id,
    type: topDanger.type,
    severity,
    summary: `${enemyChampion.name} creates the clearest ${topDanger.type.toLowerCase().replace('_', ' ')} threat into ${allyChampion.name} on ${role}.`,
    explanation: `${enemyChampion.name} pressures this lane through ${topDanger.type.toLowerCase().replace('_', ' ')} windows, and that threat gets sharper when enemy map presence joins the lane on time.`,
    mitigation: getDangerMitigation(topDanger.type, role),
  }
}

function buildMatchupDangers({ draftState, championsById }: Pick<BuildDraftContextInput, 'draftState' | 'championsById'>) {
  const enemyJungle = getChampionForRole(draftState.enemyTeam, 'JUNGLE', championsById)
  const enemySupport = getChampionForRole(draftState.enemyTeam, 'SUPPORT', championsById)

  return ROLE_ORDER.flatMap((role) => {
    const allyChampion = getChampionForRole(draftState.allyTeam, role, championsById)
    const enemyChampion = getChampionForRole(draftState.enemyTeam, role, championsById)
    const danger = buildRoleDanger(role, allyChampion, enemyChampion, enemyJungle, enemySupport)

    return danger ? [danger] : []
  }).sort((left, right) => {
    const severityScore: Record<GuidanceSeverity, number> = { HIGH: 3, MEDIUM: 2, LOW: 1 }
    return severityScore[right.severity] - severityScore[left.severity]
  })
}

function buildLanePosture(
  role: Role,
  allyChampion: Champion | undefined,
  enemyChampion: Champion | undefined,
  linkedDangers: RoleMatchupDanger[],
): LanePosture {
  if (!allyChampion || !enemyChampion) {
    return 'STABILIZE'
  }

  const topDanger = linkedDangers[0]
  const allyProactive = allyChampion.traits.engage + allyChampion.traits.dive + allyChampion.traits.pick
  const enemyDefensive = enemyChampion.traits.peel + enemyChampion.traits.disengage + enemyChampion.traits.frontline

  if (topDanger?.type === 'ALL_IN' || topDanger?.type === 'DIVE') {
    return allyChampion.traits.poke >= 3 ? 'SHORT_TRADE' : 'STABILIZE'
  }

  if (topDanger?.type === 'POKE' || topDanger?.type === 'PRIORITY_LOSS') {
    return allyChampion.traits.engage >= 3 ? 'PROTECT_WAVE' : 'STABILIZE'
  }

  if ((role === 'MID' || role === 'SUPPORT') && allyChampion.traits.pick + allyChampion.traits.engage >= 6) {
    return 'PLAY_FOR_ROAM'
  }

  if (allyChampion.traits.poke >= enemyChampion.traits.poke + 1 && allyChampion.traits.poke >= 3) {
    return 'PRESS_PRIORITY'
  }

  if (allyProactive >= enemyDefensive + 2 && allyChampion.traits.engage >= 3) {
    return 'ALL_IN_WINDOW'
  }

  return 'PROTECT_WAVE'
}

function buildLaneSummary(posture: LanePosture, role: Role, allyChampion: Champion | undefined, queueHint: string) {
  const championLabel = allyChampion?.name ?? role

  switch (posture) {
    case 'PRESS_PRIORITY':
      return `${championLabel} can pressure early lane control here. ${queueHint}`
    case 'SHORT_TRADE':
      return `${championLabel} should look for short, controlled exchanges instead of long all-in commitments. ${queueHint}`
    case 'ALL_IN_WINDOW':
      return `${championLabel} has a real punish window if the enemy oversteps, but only after spacing and cooldowns are favorable. ${queueHint}`
    case 'PLAY_FOR_ROAM':
      return `${championLabel} should value move windows and map impact once the wave is in a stable state. ${queueHint}`
    case 'PROTECT_WAVE':
      return `${championLabel} should protect wave state first so the lane does not become unplayable before objective timers. ${queueHint}`
    case 'STABILIZE':
    default:
      return `${championLabel} should stabilize lane, preserve health, and wait for cleaner turns than the enemy’s first pressure window. ${queueHint}`
  }
}

function buildLaneGuidance(
  role: Role,
  allyChampion: Champion | undefined,
  enemyChampion: Champion | undefined,
  linkedDangers: RoleMatchupDanger[],
  draftState: DraftState,
): LanePhaseGuidance {
  const coordinationHint = getCoordinationHint(draftState)
  const posture = buildLanePosture(role, allyChampion, enemyChampion, linkedDangers)
  const priorities: GuidanceBullet[] = []
  const avoid: GuidanceBullet[] = []

  if (posture === 'PRESS_PRIORITY') {
    priorities.push(
      createBullet(
        `${role}-lane-priority`,
        'Use first push for information',
        'Pressure the wave to earn vision, timer control, and cleaner rotation options instead of forcing random damage trades.',
        'HIGH',
        ['lane-state', 'pressure'],
      ),
    )
  }

  if (posture === 'SHORT_TRADE' || posture === 'STABILIZE') {
    priorities.push(
      createBullet(
        `${role}-lane-short-cycle`,
        'Respect the first enemy commit',
        'Keep the lane in shorter trading cycles so you do not hand the enemy their best all-in or collapse window.',
        'HIGH',
        ['matchup-danger'],
      ),
    )
  }

  if (posture === 'PLAY_FOR_ROAM') {
    priorities.push(
      createBullet(
        `${role}-lane-roam`,
        'Move only on real wave windows',
        'Push or bounce the wave first, then leave lane with purpose instead of drifting and losing both farm and tempo.',
        'HIGH',
        ['roam-timing', 'queue-context'],
      ),
    )
  }

  priorities.push(
    createBullet(
      `${role}-lane-queue`,
      draftState.productMode === 'SOLO_QUEUE' ? 'Take cleaner lane actions' : 'Sync lane pressure with map timers',
      coordinationHint.summary,
      draftState.productMode === 'SOLO_QUEUE' ? 'MEDIUM' : 'HIGH',
      ['queue-context'],
    ),
  )

  if (linkedDangers[0]) {
    avoid.push(
      createBullet(
        `${role}-lane-danger`,
        `Do not give ${linkedDangers[0].type.toLowerCase().replace('_', ' ')} windows for free`,
        linkedDangers[0].mitigation,
        linkedDangers[0].severity,
        ['matchup-danger'],
      ),
    )
  }

  avoid.push(
    createBullet(
      `${role}-lane-overforce`,
      'Do not overforce the lane before the matchup is earned',
      'Most bad lanes become unrecoverable after one greedy health trade or wave crash; keep the lane playable first.',
      'MEDIUM',
      ['lane-state'],
    ),
  )

  return {
    role,
    posture,
    summary: buildLaneSummary(posture, role, allyChampion, coordinationHint.summary),
    priorities: priorities.slice(0, 3),
    avoid: avoid.slice(0, 2),
    linkedDangers,
  }
}

function buildMidGameGuidance(input: BuildDraftContextInput): MidGameGuidance {
  const { draftState, allyProfile, enemyProfile } = input
  const coordinationHint = getCoordinationHint(draftState)
  let posture: MidGamePosture = 'STALL_AND_SCALE'

  if (allyProfile.archetypes.includes('ENGAGE') && allyProfile.averageTraits.frontline >= 2.2) {
    posture = 'GROUP_AND_FORCE'
  } else if (allyProfile.archetypes.includes('FRONT_TO_BACK') || allyProfile.archetypes.includes('PEEL')) {
    posture = 'PROTECT_AND_FRONT_TO_BACK'
  } else if (allyProfile.archetypes.includes('PICK')) {
    posture = 'PICK_AND_RESET'
  } else if (allyProfile.archetypes.includes('DIVE')) {
    posture = 'SIDE_AND_COLLAPSE'
  }

  const priorities: GuidanceBullet[] = []
  const avoid: GuidanceBullet[] = []

  if (posture === 'GROUP_AND_FORCE') {
    priorities.push(
      createBullet(
        'mid-group-force',
        'Group early around first real contest',
        'Your comp gets more value from being first to a contested area than from giving the enemy time to spread the map.',
        'HIGH',
        ['ally-engage', 'frontline'],
      ),
    )
  }

  if (posture === 'PROTECT_AND_FRONT_TO_BACK') {
    priorities.push(
      createBullet(
        'mid-front-to-back',
        'Hold your formation through the first engage cycle',
        'You win if the carry line stays alive long enough to play the second rotation instead of panic-committing on first contact.',
        'HIGH',
        ['peel', 'scaling'],
      ),
    )
  }

  if (posture === 'PICK_AND_RESET') {
    priorities.push(
      createBullet(
        'mid-pick-reset',
        'Play fog and numbers advantages',
        'Use vision denial and catches to create uneven fights instead of frontally walking into a stable enemy setup.',
        'HIGH',
        ['pick', 'vision'],
      ),
    )
  }

  if (posture === 'STALL_AND_SCALE') {
    priorities.push(
      createBullet(
        'mid-scale',
        'Trade space only when the map is losing anyway',
        'If your late-game profile is better, avoid donating mid-game flips just to contest from a late arrival.',
        'HIGH',
        ['scaling', 'tempo'],
      ),
    )
  }

  if (posture === 'SIDE_AND_COLLAPSE') {
    priorities.push(
      createBullet(
        'mid-side-collapse',
        'Create side pressure before committing center map',
        'Force the enemy to answer side lanes or flanks, then collapse once their formation is split.',
        'HIGH',
        ['dive', 'side-lane'],
      ),
    )
  }

  priorities.push(
    createBullet(
      'mid-queue-context',
      draftState.productMode === 'SOLO_QUEUE' ? 'Choose lower-entropy setups' : 'Call the same setup window together',
      coordinationHint.summary,
      'MEDIUM',
      ['queue-context'],
    ),
  )

  if (enemyProfile.archetypes.includes('POKE')) {
    avoid.push(
      createBullet(
        'mid-poke-reset',
        'Do not give free poke resets before the fight starts',
        'Either control the choke first or leave; repeated half-commits favor the ranged team.',
        'HIGH',
        ['enemy-poke'],
      ),
    )
  }

  if (enemyProfile.archetypes.includes('DIVE') || enemyProfile.archetypes.includes('PICK')) {
    avoid.push(
      createBullet(
        'mid-isolation',
        'Do not let your carries path alone between lanes',
        'The enemy comp gets paid when your reset timers and pathing become disconnected.',
        'HIGH',
        ['enemy-access'],
      ),
    )
  }

  const summaries: Record<MidGamePosture, string> = {
    GROUP_AND_FORCE: `Your mid game is best when you group early, establish vision first, and force the enemy to answer your engage. ${coordinationHint.summary}`,
    PROTECT_AND_FRONT_TO_BACK: `Your mid game should revolve around stable formation and protected carries rather than chaotic chase patterns. ${coordinationHint.summary}`,
    PICK_AND_RESET: `Your best mid game comes from creating catches, resetting vision, and repeating that pattern before major objectives. ${coordinationHint.summary}`,
    STALL_AND_SCALE: `Your comp should avoid unnecessary volatility, hold lanes cleanly, and make the enemy prove they can start better fights first. ${coordinationHint.summary}`,
    SIDE_AND_COLLAPSE: `Your comp wants side pressure or flank leverage before committing a full grouped fight. ${coordinationHint.summary}`,
  }

  return {
    posture,
    summary: summaries[posture],
    priorities: priorities.slice(0, 3),
    avoid: avoid.slice(0, 2),
  }
}

function buildThreatSignal(
  type: ThreatSignalType,
  score: number,
  summary: string,
  sources: string[],
): ThreatSignal | undefined {
  if (score < 2.1) {
    return undefined
  }

  return {
    type,
    severity: toSeverity(score),
    summary,
    sources,
  }
}

type ChampionThreatOverrideKey =
  | 'healing'
  | 'shielding'
  | 'burst'
  | 'sustainedDps'
  | 'dive'
  | 'pick'
  | 'poke'
  | 'crowdControl'
  | 'frontline'

const CHAMPION_THREAT_OVERRIDES: Record<string, Partial<Record<ChampionThreatOverrideKey, number>>> = {
  aatrox: { healing: 2.6, sustainedDps: 0.6, frontline: 0.6 },
  ahri: { burst: 2.4, pick: 1.5, poke: 0.6 },
  braum: { shielding: 1.2, crowdControl: 0.7, frontline: 0.8 },
  jinx: { sustainedDps: 1.6 },
  jayce: { burst: 2.2, poke: 2.6 },
  leona: { dive: 1.1, crowdControl: 1.5, frontline: 0.6 },
  nautilus: { pick: 1.4, dive: 0.6, crowdControl: 1.7, frontline: 0.6 },
  orianna: { shielding: 1.6, burst: 1.4, poke: 0.7 },
  renata: { shielding: 1.7, poke: 0.8, pick: 0.7 },
  rakan: { shielding: 1.1, burst: 0.8, dive: 1.3, crowdControl: 1.3 },
  sejuani: { burst: 1.1, dive: 1, crowdControl: 1.6, frontline: 1 },
  vi: { burst: 2.5, dive: 1.8, pick: 1.2 },
  xayah: { sustainedDps: 1.2, crowdControl: 0.5 },
}

function buildEnemyThreatProfile(input: BuildDraftContextInput, matchupDangers: RoleMatchupDanger[]): EnemyThreatProfile {
  const enemyChampions = getTeamChampions(input.draftState.enemyTeam, input.championsById)
  const physicalPressure = enemyChampions.reduce((total, champion) => {
    if (champion.traits.damageProfile === 'PHYSICAL') {
      return total + 1
    }

    if (champion.traits.damageProfile === 'MIXED') {
      return total + 0.5
    }

    return total
  }, 0)
  const magicPressure = enemyChampions.reduce((total, champion) => {
    if (champion.traits.damageProfile === 'MAGIC') {
      return total + 1
    }

    if (champion.traits.damageProfile === 'MIXED') {
      return total + 0.5
    }

    return total
  }, 0)
  const burstPressure = enemyChampions.reduce((total, champion) => {
    const classBurst = champion.classes.includes('ASSASSIN')
      ? 1.8
      : champion.classes.includes('MAGE')
        ? 1.1
        : champion.classes.includes('FIGHTER')
          ? 0.8
          : 0.3
    const overrideBurst = CHAMPION_THREAT_OVERRIDES[champion.id]?.burst ?? 0

    return total + classBurst + champion.traits.pick * 0.15 + champion.traits.dive * 0.1 + overrideBurst
  }, 0)
  const sustainedDpsPressure = enemyChampions.reduce((total, champion) => {
    const classDps = champion.classes.includes('MARKSMAN')
      ? 1.8
      : champion.classes.includes('FIGHTER')
        ? 1.1
        : champion.classes.includes('MAGE')
          ? 0.8
          : 0.4

    return total + classDps + champion.traits.scaling * 0.1 + (CHAMPION_THREAT_OVERRIDES[champion.id]?.sustainedDps ?? 0)
  }, 0)
  const divePressure =
    input.enemyProfile.averageTraits.dive +
    input.enemyProfile.averageTraits.engage * 0.35 +
    matchupDangers.filter((danger) => danger.type === 'DIVE' || danger.type === 'ALL_IN').length * 0.4 +
    enemyChampions.reduce((total, champion) => total + (CHAMPION_THREAT_OVERRIDES[champion.id]?.dive ?? 0), 0) / 3
  const pokePressure =
    input.enemyProfile.averageTraits.poke +
    matchupDangers.filter((danger) => danger.type === 'POKE').length * 0.35 +
    enemyChampions.reduce((total, champion) => total + (CHAMPION_THREAT_OVERRIDES[champion.id]?.poke ?? 0), 0) / 3
  const pickPressure =
    input.enemyProfile.averageTraits.pick +
    input.enemyProfile.averageTraits.engage * 0.2 +
    matchupDangers.filter((danger) => danger.type === 'PICK' || danger.type === 'ROAM').length * 0.35 +
    enemyChampions.reduce((total, champion) => total + (CHAMPION_THREAT_OVERRIDES[champion.id]?.pick ?? 0), 0) / 3
  const frontlineDensity =
    input.enemyProfile.averageTraits.frontline +
    enemyChampions.reduce((total, champion) => total + (CHAMPION_THREAT_OVERRIDES[champion.id]?.frontline ?? 0), 0) / 4
  const healingPressure = enemyChampions.reduce((total, champion) => {
    const classHealing = champion.classes.includes('ENCHANTER') ? 0.8 : champion.classes.includes('FIGHTER') ? 0.35 : 0
    return total + classHealing + (CHAMPION_THREAT_OVERRIDES[champion.id]?.healing ?? 0)
  }, 0)
  const shieldingPressure = enemyChampions.reduce((total, champion) => {
    const classShielding = champion.classes.includes('ENCHANTER') ? 1.1 : champion.classes.includes('MAGE') ? 0.25 : 0
    return total + classShielding + (CHAMPION_THREAT_OVERRIDES[champion.id]?.shielding ?? 0)
  }, 0)
  const crowdControlDensity =
    input.enemyProfile.averageTraits.engage +
    input.enemyProfile.averageTraits.pick +
    input.enemyProfile.averageTraits.peel * 0.35 +
    enemyChampions.reduce((total, champion) => total + (CHAMPION_THREAT_OVERRIDES[champion.id]?.crowdControl ?? 0), 0) / 3

  const signals = [
    buildThreatSignal('PHYSICAL_DAMAGE', physicalPressure, 'Enemy damage is leaning physical enough to justify armor branches.', ['enemy-damage-profile']),
    buildThreatSignal('MAGIC_DAMAGE', magicPressure, 'Enemy damage is leaning magic enough to justify magic-resist branches.', ['enemy-damage-profile']),
    buildThreatSignal('BURST', burstPressure / 2, 'Enemy comp can threaten fast burst windows if they find first access.', ['enemy-classes', 'pick-access']),
    buildThreatSignal('SUSTAINED_DPS', sustainedDpsPressure / 2, 'Enemy comp can win longer fights through repeated DPS if left unchecked.', ['enemy-classes', 'scaling']),
    buildThreatSignal('DIVE', divePressure, 'Enemy comp can force access onto carries through dive or hard engage.', ['enemy-dive', 'matchup-dangers']),
    buildThreatSignal('POKE', pokePressure, 'Enemy comp can soften fights before full commit through range and poke.', ['enemy-poke']),
    buildThreatSignal('PICK', pickPressure, 'Enemy comp can punish isolated pathing and late facechecks.', ['enemy-pick', 'matchup-dangers']),
    buildThreatSignal('FRONTLINE', frontlineDensity, 'Enemy frontline density can make fights longer and item checks more important.', ['enemy-frontline']),
    buildThreatSignal('HEALING', healingPressure, 'Enemy sustain can drag out skirmishes unless you plan for anti-heal access.', ['enemy-overrides', 'enemy-classes']),
    buildThreatSignal('SHIELDING', shieldingPressure, 'Enemy shielding can blunt first engage windows and prolong objective fights.', ['enemy-overrides', 'enemy-classes']),
    buildThreatSignal('CROWD_CONTROL', crowdControlDensity, 'Enemy comp has enough crowd control density to punish bad first positioning.', ['enemy-engage', 'enemy-pick']),
  ].filter((signal): signal is ThreatSignal => Boolean(signal))

  return {
    signals,
    physicalPressure,
    magicPressure,
    burstPressure,
    sustainedDpsPressure,
    divePressure,
    pokePressure,
    pickPressure,
    frontlineDensity,
    healingPressure,
    shieldingPressure,
    crowdControlDensity,
  }
}

function buildObjectiveGuidance(input: BuildDraftContextInput): ObjectiveSetupGuidance {
  const { draftState, allyProfile, enemyProfile } = input
  const engageProfile = allyProfile.averageTraits.engage + allyProfile.averageTraits.frontline
  const enemyAccess = enemyProfile.averageTraits.dive + enemyProfile.averageTraits.pick
  const enemyPoke = enemyProfile.averageTraits.poke

  let primaryCall: ObjectiveSetupStyle = 'ARRIVE_FIRST'

  if (enemyPoke >= 2.5 && allyProfile.averageTraits.engage < 2.2) {
    primaryCall = 'CONTROL_CHOKES'
  } else if (enemyAccess >= 4.5 && allyProfile.averageTraits.peel < 2.3) {
    primaryCall = 'AVOID_BLIND_ENTRY'
  } else if (engageProfile >= 4.7) {
    primaryCall = allyProfile.averageTraits.pick >= 2.4 ? 'TURN_ON_ENTRY' : 'START_ON_SPAWN'
  } else if (allyProfile.averageTraits.scaling >= 2.8 && allyProfile.averageTraits.engage < 2) {
    primaryCall = 'TRADE_CROSSMAP'
  }

  const coordinationHint = getCoordinationHint(draftState)
  const dragon = [
    createBullet(
      'dragon-setup',
      primaryCall === 'TRADE_CROSSMAP' ? 'Trade if late' : 'Be in the river first',
      primaryCall === 'TRADE_CROSSMAP'
        ? 'If you do not arrive on time with wards and cooldowns, trade tempo elsewhere instead of facechecking late.'
        : 'Dragon fights are easier when your team controls the first vision line and the enemy has to walk into you.',
      'HIGH',
      ['dragon', 'setup'],
    ),
  ]
  const herald = [
    createBullet(
      'herald-setup',
      'Use Herald to reward lane priority, not to fix bad lane states',
      'Only invest in Herald when the nearest lanes can move first or when the enemy must answer a stronger side of the map.',
      'MEDIUM',
      ['herald', 'lane-priority'],
    ),
  ]
  const baron = [
    createBullet(
      'baron-setup',
      primaryCall === 'TURN_ON_ENTRY' ? 'Threaten Baron to turn on chokepoints' : 'Do not start Baron without a real setup edge',
      primaryCall === 'TURN_ON_ENTRY'
        ? 'Your comp can use Baron vision to bait the enemy into a worse entry angle than a full open-map fight.'
        : 'Baron punishes the team that starts it from a weak formation or without enough vision layers first.',
      'HIGH',
      ['baron', 'vision'],
    ),
  ]
  const commonRisks = [
    createBullet(
      'objective-queue',
      draftState.productMode === 'SOLO_QUEUE' ? 'Keep the call simple' : 'Announce the full setup sequence',
      coordinationHint.summary,
      'MEDIUM',
      ['queue-context'],
    ),
    createBullet(
      'objective-risk',
      primaryCall === 'AVOID_BLIND_ENTRY' ? 'Do not enter dark terrain late' : 'Do not split the formation on entry',
      primaryCall === 'AVOID_BLIND_ENTRY'
        ? 'The enemy access pattern is strong enough that late facechecks are usually losing before the real fight starts.'
        : 'Many objective fights are lost because half the team zones while the other half starts or chases.',
      'HIGH',
      ['enemy-access', 'setup-discipline'],
    ),
  ]

  const summaries: Record<ObjectiveSetupStyle, string> = {
    ARRIVE_FIRST: 'Your objective fights improve a lot when you are first on vision and wave state instead of contesting from a late angle.',
    START_ON_SPAWN: 'Your comp can start objectives on spawn if the formation is intact and the enemy must walk into your frontline first.',
    TURN_ON_ENTRY: 'Use the objective as leverage and punish the enemy’s entry rather than tunneling on finishing it immediately.',
    CONTROL_CHOKES: 'Fight around terrain and approach lines where your range, poke, or catch threat can soften the enemy first.',
    TRADE_CROSSMAP: 'If the setup is late or awkward, trade to the opposite side rather than forcing a bad neutral fight.',
    AVOID_BLIND_ENTRY: 'You should refuse dark, late objective entries unless your vision and carry protection are already in place.',
  }

  return {
    primaryCall,
    summary: `${summaries[primaryCall]} ${coordinationHint.summary}`,
    dragon,
    herald,
    baron,
    commonRisks,
  }
}

export function buildDraftContext(input: BuildDraftContextInput): DraftContext {
  const matchupDangers = buildMatchupDangers(input)
  const enemyThreatProfile = buildEnemyThreatProfile(input, matchupDangers)
  const lanePhaseByRole = ROLE_ORDER.reduce<Partial<Record<Role, LanePhaseGuidance>>>((accumulator, role) => {
    const allyChampion = getChampionForRole(input.draftState.allyTeam, role, input.championsById)
    const enemyChampion = getChampionForRole(input.draftState.enemyTeam, role, input.championsById)
    accumulator[role] = buildLaneGuidance(
      role,
      allyChampion,
      enemyChampion,
      matchupDangers.filter((danger) => danger.role === role),
      input.draftState,
    )
    return accumulator
  }, {})

  return {
    queueContext: input.draftState.queueContext,
    productMode: input.draftState.productMode,
    allyProfile: input.allyProfile,
    enemyProfile: input.enemyProfile,
    lanePhaseByRole,
    matchupDangers,
    enemyThreatProfile,
    midGame: buildMidGameGuidance(input),
    objectives: buildObjectiveGuidance(input),
  }
}
