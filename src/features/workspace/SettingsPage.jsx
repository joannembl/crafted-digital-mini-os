import { useWorkspace } from './WorkspaceContext'

export function SettingsPage() {
  const { workspace, loading, error } = useWorkspace()

  return (
    <div className="page-stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">Workspace</p>
          <h1>Settings</h1>
          <p>Keep this private and simple: one owner, one teammate, one shared workflow.</p>
        </div>
      </header>

      <section className="panel">
        <h2>Workspace</h2>
        {loading && <p>Loading workspace…</p>}
        {error && <div className="error">{error}</div>}
        {workspace && (
          <div className="settings-list">
            <div><span>Name</span><strong>{workspace.name}</strong></div>
            <div><span>Your role</span><strong>{workspace.role}</strong></div>
          </div>
        )}
      </section>

      <section className="panel">
        <h2>Members</h2>
        <div className="member-list">
          {workspace?.members?.length ? workspace.members.map((member) => (
            <div className="member-row" key={member.id}>
              <div>
                <strong>{member.full_name || member.email}</strong>
                <span>{member.email}</span>
              </div>
              <span className="badge">{member.role}</span>
            </div>
          )) : <p>No members loaded yet.</p>}
        </div>
        <div className="notice">Phase 1 prepares the workspace model. The invite/member add form can come after your Supabase project is connected.</div>
      </section>
    </div>
  )
}
