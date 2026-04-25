import { useCallback, useEffect, useMemo, useState } from 'react'
import { createLiveDraftProviders } from '@/data/providers/live'
import { mockChampionMap, mockChampions } from '@/data/mock/champions'
import { mockChampionPoolProfile, mockDraftState } from '@/data/mock/draft'
import { mockStatsBundle } from '@/data/mock/stats'
import { buildChampionCatalogFromStatsBundle, createChampionCatalogEntry } from '@/domain/champion/catalog'
import { buildChampionPoolAdvice } from '@/domain/champion-pool/advisor'
import { buildChampionMapFromScaffoldDataset } from '@/domain/champion-traits/scaffold'
import type { Role } from '@/domain/champion/types'
import { buildCoachSummary } from '@/domain/coach/summary'
import { analyzeDraftComposition } from '@/domain/composition/analyzer'
import { buildRecommendationModeComparison } from '@/domain/recommendation/compare'
import { buildRecommendationPipeline } from '@/domain/recommendation/pipeline'
import { buildLiveGamePlan } from '@/domain/game-plan/build'
import {
  addBan,
  assignChampionToSlot,
  clearChampionFromSlot,
  removeBan,
  setCurrentPickRole,
  setRecommendationMode,
} from '@/domain/draft/operations'
import { AICoachPanel } from '@/features/coach/components/AICoachPanel'
import { CompositionPanel } from '@/features/composition/components/CompositionPanel'
import { BanPanel } from '@/features/draft-board/components/BanPanel'
import { DraftBoard } from '@/features/draft-board/components/DraftBoard'
import { LiveSessionPanel } from '@/features/live-session/components/LiveSessionPanel'
import { useLiveDraftSession } from '@/features/live-session/hooks/useLiveDraftSession'
import { MetaPanel } from '@/features/meta/components/MetaPanel'
import { ChampionPoolPanel } from '@/features/pool/components/ChampionPoolPanel'
import { useResolvedChampionPool } from '@/features/pool/hooks/useResolvedChampionPool'
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

  const {
    championPool: resolvedChampionPool,
    isLoading: isChampionPoolLoading,
    error: championPoolError,
  } = useResolvedChampionPool({
    identity: syncMode === 'RIOT_API' ? session.player : undefined,
    role: draftState.currentPickRole,
    patchVersion: activeStatsBundle.patchVersion,
    enabled: syncMode === 'RIOT_API' && Boolean(session.player),
    fallbackPool: mockChampionPoolProfile.role === draftState.currentPickRole ? mockChampionPoolProfile : undefined,
  })

  const activeChampionPool = resolvedChampionPool ??
    (mockChampionPoolProfile.role === draftState.currentPickRole ? mockChampionPoolProfile : undefined)

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
    const recommendationPipeline = buildRecommendationPipeline({
      draftState,
      championsById: activeChampionMap,
      championPool: activeChampionPool,
      statsBundle: activeStatsBundle,
      topN: 5,
      buildTopN: 5,
    })

    const bestOverall = recommendationPipeline.bestOverall[0]?.candidate
    const bestPool = recommendationPipeline.personalPool[0]?.candidate
    const bestOverallLabel = bestOverall ? bestOverall.championName : 'no available champion'
    const bestPoolLabel = bestPool ? bestPool.championName : 'no available pool candidate'
    const gamePlan = buildLiveGamePlan({
      draftState,
      championsById: activeChampionMap,
      allyProfile: compositionProfile,
      enemyProfile: enemyCompositionProfile,
    })

    return {
      compositionProfile,
      bestOverallRecommendations: recommendationPipeline.bestOverall,
      personalPoolRecommendations: recommendationPipeline.personalPool,
      championPoolAdvice: activeChampionPool
        ? buildChampionPoolAdvice({
            role: draftState.currentPickRole,
            championPool: activeChampionPool,
            bestOverall,
            bestPool,
            allyProfile: compositionProfile,
            championsById: activeChampionMap,
          })
        : undefined,
      recommendationComparison: buildRecommendationModeComparison({
        bestOverall,
        bestPool,
      }),
      gamePlan,
      coachSummary: buildCoachSummary({
        draftState,
        championsById: activeChampionMap,
        compositionProfile,
        bestOverallLabel,
        bestPoolLabel,
        gamePlan,
      }),
    }
  }, [activeChampionMap, activeChampionPool, activeStatsBundle, draftState])

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

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(340px,0.95fr)]">
        <DraftBoard
          draftState={draftState}
          championCatalog={championCatalog}
          championNamesById={championNamesById}
          dataWarnings={draftBoardWarnings}
          onAssignChampion={handleAssignChampion}
          onClearChampion={handleClearChampion}
          onSelectCurrentRole={handleCurrentRoleChange}
        />

        <div className="space-y-6">
          <MetaPanel
            draftState={draftState}
            selectedPatchVersion={selectedPatchVersion}
            availablePatchVersions={patchVersions}
            isPatchVersionsLoading={isPatchVersionsLoading}
            patchVersionsError={patchVersionsError}
            onPatchVersionChange={setSelectedPatchVersion}
            onCurrentRoleChange={handleCurrentRoleChange}
          />
          <BanPanel
            draftState={draftState}
            championCatalog={championCatalog}
            championNamesById={championNamesById}
            onAddBan={handleAddBan}
            onRemoveBan={handleRemoveBan}
          />
          {activeChampionPool ? (
            <ChampionPoolPanel
              championPool={activeChampionPool}
              championsById={activeChampionMap}
              isLoading={isChampionPoolLoading}
              error={championPoolError}
              advice={derivedState.championPoolAdvice}
            />
          ) : null}
        </div>
      </div>

      <AICoachPanel summary={derivedState.coachSummary} gamePlan={derivedState.gamePlan} />

      <RecommendationPanel
        activeMode={draftState.recommendationMode}
        bestOverallRecommendations={derivedState.bestOverallRecommendations}
        personalPoolRecommendations={derivedState.personalPoolRecommendations}
        comparison={derivedState.recommendationComparison}
        onModeChange={handleRecommendationModeChange}
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <CompositionPanel compositionProfile={derivedState.compositionProfile} />
        <StatsIntelPanel
          statsBundle={activeStatsBundle}
          currentRole={draftState.currentPickRole}
          championsById={activeChampionMap}
        />
      </div>
    </div>
  )
}
