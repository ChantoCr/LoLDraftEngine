import type { IncomingMessage, ServerResponse } from 'node:http'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { formatDevProxyError } from './server/dev/formatProxyError'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@server': fileURLToPath(new URL('./server', import.meta.url)),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        configure(proxy) {
          proxy.on('error', (error, request, response) => {
            const serverResponse = response as ServerResponse<IncomingMessage>

            if (serverResponse.headersSent || serverResponse.writableEnded) {
              return
            }

            const message = formatDevProxyError(request.url ?? '/api', error)
            serverResponse.statusCode = 502
            serverResponse.setHeader('Content-Type', 'application/json')
            serverResponse.end(JSON.stringify({ error: message }))
          })
        },
      },
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'server/**/*.test.ts'],
  },
})
