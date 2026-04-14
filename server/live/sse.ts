import type { Response } from 'express'

export function initializeSse(response: Response) {
  response.status(200)
  response.setHeader('Content-Type', 'text/event-stream')
  response.setHeader('Cache-Control', 'no-cache, no-transform')
  response.setHeader('Connection', 'keep-alive')
  response.flushHeaders?.()
}

export function writeSseEvent(response: Response, eventName: string, payload: unknown) {
  response.write(`event: ${eventName}\n`)
  response.write(`data: ${JSON.stringify(payload)}\n\n`)
}

export function writeSseComment(response: Response, comment: string) {
  response.write(`: ${comment}\n\n`)
}
