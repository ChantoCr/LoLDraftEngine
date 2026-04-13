import { DraftWorkspacePage } from '@/pages/DraftWorkspacePage'
import { AppShell } from './layout/AppShell'
import { AppProviders } from './providers/AppProviders'

function App() {
  return (
    <AppProviders>
      <AppShell>
        <DraftWorkspacePage />
      </AppShell>
    </AppProviders>
  )
}

export default App
