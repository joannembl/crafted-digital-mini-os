import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { AuthPage } from './features/auth/AuthPage'
import { useAuth } from './features/auth/AuthContext'
import { DashboardPage } from './features/dashboard/DashboardPage'
import { PlaceholderPage } from './features/dashboard/PlaceholderPage'
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
        <Route path="demo-builder" element={<PlaceholderPage title="Demo Builder" description="For Phase 2, demo tracking lives inside each Prospect Workspace." next="Phase 3: Generate demo copy/site details, save preview URL, and mark demo ready from a focused builder." />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
