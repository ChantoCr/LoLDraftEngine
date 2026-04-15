import { readFile } from 'node:fs/promises'
import path from 'node:path'
import type { DraftState } from '@/domain/draft/types'
import type { DesktopCompanionDraftSource } from '@server/live/desktopClient/runtime'

interface CreateJsonFileDraftSourceInput {
  filePath: string
}

export function createJsonFileDraftSource({ filePath }: CreateJsonFileDraftSourceInput): DesktopCompanionDraftSource {
  const absoluteFilePath = path.resolve(process.cwd(), filePath)

  return {
    async readDraftState(): Promise<DraftState> {
      const fileContent = await readFile(absoluteFilePath, 'utf8')
      return JSON.parse(fileContent) as DraftState
    },
    describe() {
      return `json-file:${absoluteFilePath}`
    },
  }
}
