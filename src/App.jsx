import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { AuthPage } from './features/auth/AuthPage'
import { useAuth } from './features/auth/AuthContext'
import { DashboardPage } from './features/dashboard/DashboardPage'
import { DemoBuilderPage } from './features/demos/DemoBuilderPage'
import { ClientsPage } from './features/clients/ClientsPage'
import { ProspectsPage } from './features/prospects/ProspectsPage'
import { ProspectWorkspacePage } from './features/prospects/ProspectWorkspacePage'
import { SettingsPage } from './features/workspace/SettingsPage'

export function App() {
  const { user, loading } = useAuth()

  if (loading) return <div className="loading-screen">Loading Crafted Digital Mini OS…</div>
  if (!user) return <AuthPage />

  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<DashboardPage />} />
        <Route path="prospects" element={<ProspectsPage />} />
        <Route path="prospects/:id" element={<ProspectWorkspacePage />} />
        <Route path="demo-builder" element={<DemoBuilderPage />} />
        <Route path="clients" element={<ClientsPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
