import type { ChampionPoolProfile } from '@/domain/champion-pool/types'
import type { CompositionProfile } from '@/domain/composition/types'
import type { DraftState } from '@/domain/draft/types'
import type { RecommendationCandidate } from '@/domain/recommendation/types'

export const mockDraftState: DraftState = {
  patchVersion: '15.8',
  productMode: 'SOLO_QUEUE',
  recommendationMode: 'BEST_OVERALL',
  currentPickRole: 'SUPPORT',
  allyTeam: {
    side: 'ALLY',
    bans: ['irelia', 'lucian'],
    picks: [
      { role: 'TOP', championId: 'aatrox', isLocked: true },
      { role: 'JUNGLE', championId: 'sejuani', isLocked: true },
      { role: 'MID', championId: 'orianna', isLocked: true },
      { role: 'ADC', championId: 'jinx', isLocked: true },
      { role: 'SUPPORT', isLocked: false },
    ],
  },
  enemyTeam: {
    side: 'ENEMY',
    bans: ['rell', 'poppy'],
    picks: [
      { role: 'TOP', championId: 'jayce', isLocked: true },
      { role: 'JUNGLE', championId: 'vi', isLocked: true },
      { role: 'MID', championId: 'ahri', isLocked: true },
      { role: 'ADC', championId: 'xayah', isLocked: true },
      { role: 'SUPPORT', championId: 'rakan', isLocked: true },
    ],
  },
  availableChampionIds: ['nautilus', 'leona', 'braum', 'renata'],
}

export const mockCompositionProfile: CompositionProfile = {
  archetypes: ['FRONT_TO_BACK', 'ENGAGE', 'SCALING'],
  strengths: [
    'Reliable primary engage through Sejuani into Orianna follow-up.',
    'Strong late-fight DPS if Jinx is protected and front line holds.',
    'Mixed damage profile is healthy before final support selection.',
  ],
  weaknesses: [
    'Current backline protection is too light into Vi + Ahri + Rakan access.',
    'Support slot still needs to decide between stronger engage or stronger peel.',
  ],
  structuralGaps: ['Peel support for Jinx', 'Secondary engage consistency', 'Better anti-dive tools'],
  executionDifficulty: 'MEDIUM',
  winConditions: [
    'Start fights first around objectives and layer Sejuani/Orianna setup.',
    'Keep Jinx safe through the first dive window, then reset fights with superior DPS.',
  ],
  alerts: [
    {
      id: 'light-peel',
      severity: 'warning',
      title: 'Peel is currently light',
      description: 'Without a protective support, Vi and Ahri can reliably reach Jinx in mid-game fights.',
    },
    {
      id: 'support-defines-identity',
      severity: 'info',
      title: 'Support pick will define final identity',
      description: 'This slot decides whether the comp leans toward hard engage or stable front-to-back peeling.',
    },
  ],
}

export const mockBestOverallRecommendations: RecommendationCandidate[] = [
  {
    championId: 'nautilus',
    championName: 'Nautilus',
    recommendationMode: 'BEST_OVERALL',
    tags: ['Best engage', 'Reliable pick', 'Objective fights'],
    breakdown: {
      totalScore: 91,
      confidence: 'high',
      dimensions: [
        { dimension: 'allySynergy', score: 9.5, weight: 1.1, contribution: 10.5 },
        { dimension: 'compRepair', score: 8.8, weight: 1.2, contribution: 10.6 },
        { dimension: 'enemyCounter', score: 7.9, weight: 1, contribution: 7.9 },
        { dimension: 'engageImpact', score: 9.8, weight: 1, contribution: 9.8 },
      ],
      reasons: [
        {
          id: 'naut-orianna-setup',
          type: 'SYNERGY',
          direction: 'pro',
          label: 'Adds guaranteed setup for Orianna and Sejuani',
          explanation: 'Nautilus gives the comp a second low-variance engage path and cleaner chain CC.',
          impact: 9,
        },
        {
          id: 'naut-into-xayah-rakan',
          type: 'COUNTER',
          direction: 'pro',
          label: 'Pressures enemy bot lane before they fully scale',
          explanation: 'Threatens catches on Rakan entrances and punishes Jayce-led poke setups with hard commit.',
          impact: 7,
        },
      ],
    },
  },
  {
    championId: 'braum',
    championName: 'Braum',
    recommendationMode: 'BEST_OVERALL',
    tags: ['Best peel', 'Anti-dive', 'Safer execution'],
    breakdown: {
      totalScore: 88,
      confidence: 'high',
      dimensions: [
        { dimension: 'allySynergy', score: 8.6, weight: 1, contribution: 8.6 },
        { dimension: 'compRepair', score: 9.4, weight: 1.2, contribution: 11.3 },
        { dimension: 'peelImpact', score: 9.7, weight: 1, contribution: 9.7 },
        { dimension: 'executionFit', score: 8.4, weight: 0.9, contribution: 7.6 },
      ],
      reasons: [
        {
          id: 'braum-vs-dive',
          type: 'REPAIR',
          direction: 'pro',
          label: 'Best protection into Vi and Ahri dive',
          explanation: 'Braum lowers the enemy burst window and makes Jinx much easier to pilot in front-to-back fights.',
          impact: 10,
        },
        {
          id: 'braum-lower-proactivity',
          type: 'RISK',
          direction: 'con',
          label: 'Less proactive engage than Nautilus',
          explanation: 'You give up some initiation certainty and rely more on Sejuani to start fights.',
          impact: 4,
        },
      ],
    },
  },
  {
    championId: 'renata',
    championName: 'Renata Glasc',
    recommendationMode: 'BEST_OVERALL',
    tags: ['Hybrid utility', 'Reset fights', 'Punish dive'],
    breakdown: {
      totalScore: 82,
      confidence: 'medium',
      dimensions: [
        { dimension: 'allySynergy', score: 8.1, weight: 1, contribution: 8.1 },
        { dimension: 'compRepair', score: 8.2, weight: 1.1, contribution: 9 },
        { dimension: 'peelImpact', score: 8.9, weight: 1, contribution: 8.9 },
        { dimension: 'metaValue', score: 6.8, weight: 0.8, contribution: 5.4 },
      ],
      reasons: [
        {
          id: 'renata-reset-value',
          type: 'SYNERGY',
          direction: 'pro',
          label: 'Strong anti-dive reset potential',
          explanation: 'Renata helps the comp survive the first engage and creates better counter-engage windows.',
          impact: 8,
        },
      ],
    },
  },
]

export const mockChampionPoolProfile: ChampionPoolProfile = {
  playerLabel: 'Support Pool',
  role: 'SUPPORT',
  entries: [
    { championId: 'nautilus', tier: 'MAIN', masteryConfidence: 0.92 },
    { championId: 'braum', tier: 'COMFORT', masteryConfidence: 0.81 },
    { championId: 'leona', tier: 'PLAYABLE', masteryConfidence: 0.68 },
  ],
}

export const mockPersonalPoolRecommendations: RecommendationCandidate[] = [
  {
    championId: 'nautilus',
    championName: 'Nautilus',
    recommendationMode: 'PERSONAL_POOL',
    tags: ['Inside pool', 'Best overall overlap', 'Playmaker'],
    breakdown: {
      totalScore: 94,
      confidence: 'high',
      dimensions: [
        { dimension: 'allySynergy', score: 9.5, weight: 1.1, contribution: 10.5 },
        { dimension: 'comfortFit', score: 9.3, weight: 1, contribution: 9.3 },
        { dimension: 'compRepair', score: 8.8, weight: 1.2, contribution: 10.6 },
      ],
      reasons: [
        {
          id: 'naut-pool-best-fit',
          type: 'POOL',
          direction: 'pro',
          label: 'Matches both strategic fit and player comfort',
          explanation: 'This is the rare case where the best theoretical support is also a high-confidence personal pick.',
          impact: 10,
        },
      ],
    },
  },
  {
    championId: 'braum',
    championName: 'Braum',
    recommendationMode: 'PERSONAL_POOL',
    tags: ['Inside pool', 'Safest option', 'Protect Jinx'],
    breakdown: {
      totalScore: 87,
      confidence: 'high',
      dimensions: [
        { dimension: 'compRepair', score: 9.4, weight: 1.2, contribution: 11.3 },
        { dimension: 'comfortFit', score: 8.1, weight: 1, contribution: 8.1 },
        { dimension: 'peelImpact', score: 9.7, weight: 1, contribution: 9.7 },
      ],
      reasons: [
        {
          id: 'braum-pool-safety',
          type: 'POOL',
          direction: 'pro',
          label: 'High comfort fallback if team wants safer execution',
          explanation: 'Braum is slightly lower ceiling than Nautilus here, but it simplifies fight execution considerably.',
          impact: 8,
        },
      ],
    },
  },
  {
    championId: 'leona',
    championName: 'Leona',
    recommendationMode: 'PERSONAL_POOL',
    tags: ['Inside pool', 'Hard engage', 'Higher risk'],
    breakdown: {
      totalScore: 79,
      confidence: 'medium',
      dimensions: [
        { dimension: 'allySynergy', score: 8.7, weight: 1, contribution: 8.7 },
        { dimension: 'engageImpact', score: 9.2, weight: 1, contribution: 9.2 },
        { dimension: 'comfortFit', score: 6.8, weight: 1, contribution: 6.8 },
      ],
      reasons: [
        {
          id: 'leona-risk-profile',
          type: 'RISK',
          direction: 'con',
          label: 'Adds engage but not enough peel',
          explanation: 'Leona improves initiation but leaves Jinx more exposed if the first engage fails.',
          impact: 6,
        },
      ],
    },
  },
]

export const mockCoachSummary =
  'If you want the cleanest proactive support, pick Nautilus. He amplifies Sejuani and Orianna, gives your comp reliable target access, and still stabilizes objective fights. If the enemy dive is your main concern, Braum is the safer execution choice because he protects Jinx far better against Vi and Ahri.'
