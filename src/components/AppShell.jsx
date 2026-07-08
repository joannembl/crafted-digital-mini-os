import { NavLink, Outlet } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { BriefcaseBusiness, ChevronLeft, ChevronRight, Hammer, LayoutDashboard, LogOut, Menu, Settings, Users, X } from 'lucide-react'
import { useAuth } from '../features/auth/AuthContext'
import { useWorkspace } from '../features/workspace/WorkspaceContext'

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/prospects', label: 'Prospects', icon: Users },
  { to: '/demo-builder', label: 'Demo Builder', icon: Hammer },
  { to: '/clients', label: 'Clients', icon: BriefcaseBusiness },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export function AppShell() {
  const { user, signOut, isSupabaseConfigured } = useAuth()
  const { workspace } = useWorkspace()
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('cd-sidebar-collapsed') === 'true')
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    localStorage.setItem('cd-sidebar-collapsed', String(collapsed))
  }, [collapsed])

  function closeMobileNav() {
    setMobileOpen(false)
  }

  return (
    <div className={`app-shell ${collapsed ? 'sidebar-collapsed' : ''} ${mobileOpen ? 'mobile-nav-open' : ''}`}>
      <button className="mobile-menu-button" type="button" onClick={() => setMobileOpen(true)} aria-label="Open navigation">
        <Menu size={20} />
      </button>

      <div className="sidebar-backdrop" onClick={closeMobileNav} />

      <aside className="sidebar">
        <div className="sidebar-top-row">
          <div className="brand">
            <div className="brand-mark">CD</div>
            <div className="brand-text">
              <strong>Crafted Digital</strong>
              <span>Mini OS</span>
            </div>
          </div>

          <button className="icon-button mobile-close" type="button" onClick={closeMobileNav} aria-label="Close navigation">
            <X size={16} />
          </button>
        </div>

        <button className="collapse-button" type="button" onClick={() => setCollapsed((value) => !value)} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          <span>{collapsed ? 'Expand' : 'Collapse'}</span>
        </button>

        <nav className="nav-list">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink key={item.to} to={item.to} onClick={closeMobileNav} title={item.label} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <Icon size={18} />
                <span>{item.label}</span>
              </NavLink>
            )
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="workspace-pill">{workspace?.name ?? 'Crafted Digital'}</div>
          <div className="user-card">
            <div className="user-card-text">
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
