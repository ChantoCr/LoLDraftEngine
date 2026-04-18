import { readFile } from 'node:fs/promises'
import path from 'node:path'
import type { DraftState } from '@/domain/draft/types'
import type { DesktopCompanionDraftSource } from '@server/live/desktopClient/source'

interface CreateJsonFileDraftSourceInput {
  filePath: string
}

export function createJsonFileDraftSource({ filePath }: CreateJsonFileDraftSourceInput): DesktopCompanionDraftSource {
  const absoluteFilePath = path.resolve(process.cwd(), filePath)

  return {
    async readSnapshot() {
      const fileContent = await readFile(absoluteFilePath, 'utf8')
      return {
        kind: 'FILE' as const,
        status: 'active' as const,
        observedAt: new Date().toISOString(),
        message: `Desktop companion forwarded a bridge-compatible file snapshot from ${absoluteFilePath}.`,
        draftState: JSON.parse(fileContent) as DraftState,
      }
    },
    describe() {
      return `json-file:${absoluteFilePath}`
    },
  }
}
