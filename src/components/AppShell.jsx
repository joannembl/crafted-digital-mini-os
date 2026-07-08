import { NavLink, Outlet } from 'react-router-dom'
import { LayoutDashboard, Users, Hammer, Settings, LogOut } from 'lucide-react'
import { useAuth } from '../features/auth/AuthContext'
import { useWorkspace } from '../features/workspace/WorkspaceContext'

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/prospects', label: 'Prospects', icon: Users },
  { to: '/demo-builder', label: 'Demo Builder', icon: Hammer },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export function AppShell() {
  const { user, signOut, isSupabaseConfigured } = useAuth()
  const { workspace } = useWorkspace()

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">CD</div>
          <div>
            <strong>Crafted Digital</strong>
            <span>Mini OS</span>
          </div>
        </div>

        <nav className="nav-list">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink key={item.to} to={item.to} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <Icon size={18} />
                {item.label}
              </NavLink>
            )
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="workspace-pill">{workspace?.name ?? 'Crafted Digital'}</div>
          <div className="user-card">
            <div>
              <strong>{user?.user_metadata?.full_name || user?.email || 'Owner'}</strong>
              <span>{isSupabaseConfigured ? 'Supabase connected' : 'Local preview mode'}</span>
            </div>
            <button className="icon-button" type="button" onClick={signOut} aria-label="Sign out">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  )
}
