import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { useAuth } from './features/auth/AuthContext'
import { AuthPage } from './features/auth/AuthPage'
import { DashboardPage } from './features/dashboard/DashboardPage'
import { PlaceholderPage } from './features/dashboard/PlaceholderPage'
import { SettingsPage } from './features/workspace/SettingsPage'

export function App() {
  const { user, loading } = useAuth()

  if (loading) return <div className="loading-screen">Loading Crafted Digital Mini OS…</div>
  if (!user) return <AuthPage />

  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<DashboardPage />} />
        <Route path="prospects" element={<PlaceholderPage title="Prospects" description="Your simple lead list will live here." next="Phase 2: Add prospects, stages, follow-up dates, and quick notes." />} />
        <Route path="demo-builder" element={<PlaceholderPage title="Demo Builder" description="A focused page for building and tracking demo sites." next="Phase 3: Pick a prospect, generate demo details, save preview URL, and mark demo ready." />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
