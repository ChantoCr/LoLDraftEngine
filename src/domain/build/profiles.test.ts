import { describe, expect, it } from 'vitest'
import { buildCuratedBuildProfileCoverageReport, getCuratedBuildProfileForPatch, normalizeBuildProfilePatchKey } from '@/domain/build/profiles'

describe('build profiles', () => {
  it('normalizes patch versions to patch-scoped build profile keys', () => {
    expect(normalizeBuildProfilePatchKey('15.8.1')).toBe('15.8')
    expect(normalizeBuildProfilePatchKey('15.8')).toBe('15.8')
    expect(normalizeBuildProfilePatchKey('latest')).toBe('15.8')
  })

  it('resolves curated profiles by patch-aware key', () => {
    const profile = getCuratedBuildProfileForPatch({
      patchVersion: '15.8.1',
      championId: 'ahri',
      role: 'MID',
    })

    expect(profile?.source).toBe('CURATED')
    expect(profile?.championId).toBe('ahri')
  })

  it('reports curated build profile coverage for a patch snapshot', () => {
    const report = buildCuratedBuildProfileCoverageReport({
      patchVersion: '15.8.1',
      champions: [
        { id: 'ahri', roles: ['MID'] },
        { id: 'xayah', roles: ['ADC'] },
        { id: 'unknown', roles: ['TOP'] },
      ],
    })

    expect(report.patchKey).toBe('15.8')
    expect(report.curatedCount).toBe(2)
    expect(report.expectedCount).toBe(3)
    expect(report.coverage).toBeCloseTo(2 / 3, 5)
  })
})
