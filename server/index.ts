import { createServerApp } from '@server/app'

const { app, config } = createServerApp()

app.listen(config.port, () => {
  console.log(`LoLDraftEngine backend listening on http://localhost:${config.port}`)
})
