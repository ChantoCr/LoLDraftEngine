import { useCallback, useEffect, useMemo, useState } from 'react'
import { createLiveDraftProviders } from '@/data/providers/live'
import { mockChampionMap, mockChampions } from '@/data/mock/champions'
import { mockChampionPoolProfile, mockDraftState } from '@/data/mock/draft'
import { mockStatsBundle } from '@/data/mock/stats'
import { buildChampionCatalogFromStatsBundle, createChampionCatalogEntry } from '@/domain/champion/catalog'
import { buildChampionMapFromScaffoldDataset } from '@/domain/champion-traits/scaffold'
import type { Role } from '@/domain/champion/types'
import { buildCoachSummary } from '@/domain/coach/summary'
import { analyzeDraftComposition } from '@/domain/composition/analyzer'
import { buildLiveGamePlan } from '@/domain/game-plan/build'
import {
  addBan,
  assignChampionToSlot,
  clearChampionFromSlot,
  removeBan,
  setCurrentPickRole,
  setRecommendationMode,
} from '@/domain/draft/operations'
import { recommendChampionsForDraft } from '@/domain/recommendation/engine'
import { AICoachPanel } from '@/features/coach/components/AICoachPanel'
import { CompositionPanel } from '@/features/composition/components/CompositionPanel'
import { BanPanel } from '@/features/draft-board/components/BanPanel'
import { DraftBoard } from '@/features/draft-board/components/DraftBoard'
import { LiveSessionPanel } from '@/features/live-session/components/LiveSessionPanel'
import { useLiveDraftSession } from '@/features/live-session/hooks/useLiveDraftSession'
import { MetaPanel } from '@/features/meta/components/MetaPanel'
import { ChampionPoolPanel } from '@/features/pool/components/ChampionPoolPanel'
import { RecommendationPanel } from '@/features/recommendations/components/RecommendationPanel'
import { StatsIntelPanel } from '@/features/stats/components/StatsIntelPanel'
import { useAvailablePatchVersions } from '@/features/stats/hooks/useAvailablePatchVersions'
import { usePatchStatsBundle } from '@/features/stats/hooks/usePatchStatsBundle'

function createInteractiveDraftState() {
  return {
    ...mockDraftState,
    patchVersion: 'latest',
    availableChampionIds: mockChampions.map((champion) => champion.id),
  }
}

function createFallbackChampionCatalog() {
  return Object.values(mockChampionMap).map((champion) =>
    createChampionCatalogEntry(champion.id, champion.name, champion.roles),
  )
}

function haveSameChampionIds(left: string[], right: string[]) {
  if (left.length !== right.length) {
    return false
  }

  return left.every((championId, index) => championId === right[index])
}

export function DraftWorkspacePage() {
  const [draftState, setDraftState] = useState(createInteractiveDraftState)
  const [selectedPatchVersion, setSelectedPatchVersion] = useState('latest')
  const fallbackChampionCatalog = useMemo(() => createFallbackChampionCatalog(), [])
  const {
    patchVersions,
    isLoading: isPatchVersionsLoading,
    error: patchVersionsError,
  } = useAvailablePatchVersions()
  const { bundle: fetchedStatsBundle, error: statsBundleError } = usePatchStatsBundle(selectedPatchVersion, mockStatsBundle)
  const activeStatsBundle = fetchedStatsBundle ?? mockStatsBundle
  const activeChampionMap = useMemo(
    () => buildChampionMapFromScaffoldDataset(activeStatsBundle, mockChampionMap),
    [activeStatsBundle],
  )

  const championCatalog = useMemo(() => {
    const statsCatalog = buildChampionCatalogFromStatsBundle(activeStatsBundle)
    return statsCatalog.length > 0 ? statsCatalog : fallbackChampionCatalog
  }, [activeStatsBundle, fallbackChampionCatalog])

  const championNamesById = useMemo(() => {
    return championCatalog.reduce<Record<string, string>>(
      (accumulator, champion) => {
        accumulator[champion.id] = champion.name
        return accumulator
      },
      { ...Object.fromEntries(Object.values(activeChampionMap).map((champion) => [champion.id, champion.name])) },
    )
  }, [activeChampionMap, championCatalog])

  useEffect(() => {
    const nextAvailableChampionIds = championCatalog.map((champion) => champion.id)

    if (nextAvailableChampionIds.length === 0) {
      return
    }

    setDraftState((currentDraftState) => {
      const hasSamePatchVersion = currentDraftState.patchVersion === activeStatsBundle.patchVersion
      const hasSameAvailableChampionIds = haveSameChampionIds(currentDraftState.availableChampionIds, nextAvailableChampionIds)

      if (hasSamePatchVersion && hasSameAvailableChampionIds) {
        return currentDraftState
      }

      return {
        ...currentDraftState,
        patchVersion: activeStatsBundle.patchVersion,
        availableChampionIds: nextAvailableChampionIds,
      }
    })
  }, [activeStatsBundle.patchVersion, championCatalog])

  const draftBoardWarnings = useMemo(() => {
    const warnings: string[] = []

    if (statsBundleError) {
      warnings.push(`Data Dragon sync failed\n${statsBundleError}`)
    }

    if (patchVersionsError) {
      warnings.push(`Data Dragon patch listing failed\n${patchVersionsError}`)
    }

    return warnings
  }, [patchVersionsError, statsBundleError])

  const handleRemoteDraftState = useCallback((incomingDraftState: typeof draftState) => {
    setDraftState(incomingDraftState)
  }, [])

  const liveDraftProviders = useMemo(() => createLiveDraftProviders(), [])
  const {
    identity,
    session,
    syncMode,
    setIdentity,
    setSyncMode,
    startSession,
    stopSession,
    triggerDesktopMockSequence,
  } = useLiveDraftSession({
    providers: liveDraftProviders,
    onDraftState: handleRemoteDraftState,
  })

  const derivedState = useMemo(() => {
    const compositionProfile = analyzeDraftComposition({
      draftState,
      championsById: activeChampionMap,
    })
    const enemyCompositionProfile = analyzeDraftComposition({
      draftState,
      championsById: activeChampionMap,
      side: 'ENEMY',
    })
    const bestOverallRecommendations = recommendChampionsForDraft({
      draftState,
      championsById: activeChampionMap,
      recommendationMode: 'BEST_OVERALL',
      statsBundle: activeStatsBundle,
      topN: 3,
    })
    const personalPoolRecommendations = recommendChampionsForDraft({
      draftState,
      championsById: activeChampionMap,
      recommendationMode: 'PERSONAL_POOL',
      championPool: mockChampionPoolProfile,
      statsBundle: activeStatsBundle,
      topN: 3,
    })

    const bestOverall = bestOverallRecommendations[0]
    const bestPool = personalPoolRecommendations[0]
    const bestOverallLabel = bestOverall ? bestOverall.championName : 'no available champion'
    const bestPoolLabel = bestPool ? bestPool.championName : 'no available pool candidate'

    return {
      compositionProfile,
      bestOverallRecommendations,
      personalPoolRecommendations,
      gamePlan: buildLiveGamePlan({
        draftState,
        championsById: activeChampionMap,
        allyProfile: compositionProfile,
        enemyProfile: enemyCompositionProfile,
      }),
      coachSummary: buildCoachSummary({
        draftState,
        championsById: activeChampionMap,
        compositionProfile,
        bestOverallLabel,
        bestPoolLabel,
      }),
    }
  }, [activeChampionMap, activeStatsBundle, draftState])

  function handleAssignChampion(side: 'ALLY' | 'ENEMY', role: Role, championId: string) {
    setDraftState((currentDraftState) => assignChampionToSlot(currentDraftState, side, role, championId))
  }

  function handleClearChampion(side: 'ALLY' | 'ENEMY', role: Role) {
    setDraftState((currentDraftState) => clearChampionFromSlot(currentDraftState, side, role))
  }

  function handleAddBan(side: 'ALLY' | 'ENEMY', championId: string) {
    setDraftState((currentDraftState) => addBan(currentDraftState, side, championId))
  }

  function handleRemoveBan(side: 'ALLY' | 'ENEMY', championId: string) {
    setDraftState((currentDraftState) => removeBan(currentDraftState, side, championId))
  }

  function handleCurrentRoleChange(role: Role) {
    setDraftState((currentDraftState) => setCurrentPickRole(currentDraftState, role))
  }

  function handleRecommendationModeChange(recommendationMode: typeof draftState.recommendationMode) {
    setDraftState((currentDraftState) => setRecommendationMode(currentDraftState, recommendationMode))
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,1fr)]">
      <div className="space-y-6">
        <LiveSessionPanel
          identity={identity}
          session={session}
          syncMode={syncMode}
          onIdentityChange={setIdentity}
          onSyncModeChange={setSyncMode}
          onStartSession={startSession}
          onStopSession={stopSession}
          onTriggerDesktopMockSequence={triggerDesktopMockSequence}
        />

        <DraftBoard
          draftState={draftState}
          championCatalog={championCatalog}
          championNamesById={championNamesById}
          dataWarnings={draftBoardWarnings}
          onAssignChampion={handleAssignChampion}
          onClearChampion={handleClearChampion}
          onSelectCurrentRole={handleCurrentRoleChange}
        />

        <BanPanel
          draftState={draftState}
          championCatalog={championCatalog}
          championNamesById={championNamesById}
          onAddBan={handleAddBan}
          onRemoveBan={handleRemoveBan}
        />

        <div className="grid gap-6 lg:grid-cols-2">
          <RecommendationPanel
            title="Best Overall Picks"
            subtitle="The strongest theoretical answers, regardless of player comfort."
            recommendations={derivedState.bestOverallRecommendations}
          />
          <RecommendationPanel
            title="Personal Pool Picks"
            subtitle="Recommendations constrained to the current player's support pool."
            recommendations={derivedState.personalPoolRecommendations}
          />
        </div>
      </div>

      <div className="space-y-6">
        <MetaPanel
          draftState={draftState}
          selectedPatchVersion={selectedPatchVersion}
          availablePatchVersions={patchVersions}
          isPatchVersionsLoading={isPatchVersionsLoading}
          patchVersionsError={patchVersionsError}
          onPatchVersionChange={setSelectedPatchVersion}
          onRecommendationModeChange={handleRecommendationModeChange}
          onCurrentRoleChange={handleCurrentRoleChange}
        />
        <StatsIntelPanel
          statsBundle={activeStatsBundle}
          currentRole={draftState.currentPickRole}
          championsById={activeChampionMap}
        />
        <CompositionPanel compositionProfile={derivedState.compositionProfile} />
        <ChampionPoolPanel championPool={mockChampionPoolProfile} championsById={activeChampionMap} />
        <AICoachPanel summary={derivedState.coachSummary} gamePlan={derivedState.gamePlan} />
      </div>
    </div>
  )
}
