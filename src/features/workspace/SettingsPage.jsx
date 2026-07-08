import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { useWorkspace } from './WorkspaceContext'
import { isSupabaseConfigured, supabase } from '../../lib/supabase'

function makeInviteCode() {
  return Array.from(crypto.getRandomValues(new Uint8Array(6)))
    .map((value) => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[value % 32])
    .join('')
}

export function SettingsPage() {
  const { user } = useAuth()
  const { workspace, loading, error, reloadWorkspace } = useWorkspace()
  const [inviteCode, setInviteCode] = useState('')
  const [acceptCode, setAcceptCode] = useState('')
  const [inviteMessage, setInviteMessage] = useState('')
  const [inviteError, setInviteError] = useState('')
  const [savingInvite, setSavingInvite] = useState(false)
  const isOwner = workspace?.role === 'owner'

  const shareText = useMemo(() => {
    if (!inviteCode) return ''
    return `Join my Crafted Digital Mini OS workspace with invite code: ${inviteCode}`
  }, [inviteCode])

  useEffect(() => {
    async function loadInvite() {
      if (!isSupabaseConfigured || !workspace?.id || !isOwner) return
      const { data } = await supabase
        .from('workspace_invites')
        .select('code')
        .eq('workspace_id', workspace.id)
        .eq('revoked', false)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (data?.code) setInviteCode(data.code)
    }

    loadInvite()
  }, [workspace?.id, isOwner])

  async function generateInvite() {
    setInviteMessage('')
    setInviteError('')

    if (!workspace?.id || !user?.id) return

    if (!isSupabaseConfigured) {
      const code = 'DEMO123'
      setInviteCode(code)
      setInviteMessage('Demo invite code generated.')
      return
    }

    setSavingInvite(true)
    const code = makeInviteCode()
    const { error: createError } = await supabase.from('workspace_invites').insert({
      workspace_id: workspace.id,
      code,
      role: 'member',
      created_by: user.id,
    })

    setSavingInvite(false)

    if (createError) {
      setInviteError(createError.message)
      return
    }

    setInviteCode(code)
    setInviteMessage('Invite code created. Send this code to your teammate.')
  }

  async function copyInvite() {
    if (!shareText) return
    await navigator.clipboard.writeText(shareText)
    setInviteMessage('Invite copied to clipboard.')
  }

  async function acceptInvite(event) {
    event.preventDefault()
    setInviteMessage('')
    setInviteError('')

    const normalizedCode = acceptCode.trim().toUpperCase()
    if (!normalizedCode) {
      setInviteError('Enter an invite code first.')
      return
    }

    if (!isSupabaseConfigured) {
      setInviteMessage('Demo mode accepted the invite code.')
      return
    }

    setSavingInvite(true)
    const { data: invite, error: inviteLookupError } = await supabase
      .from('workspace_invites')
      .select('workspace_id, role, revoked')
      .eq('code', normalizedCode)
      .eq('revoked', false)
      .maybeSingle()

    if (inviteLookupError || !invite) {
      setSavingInvite(false)
      setInviteError(inviteLookupError?.message || 'That invite code was not found.')
      return
    }

    const { error: memberError } = await supabase.from('workspace_members').upsert({
      workspace_id: invite.workspace_id,
      user_id: user.id,
      role: invite.role || 'member',
    }, { onConflict: 'workspace_id,user_id' })

    setSavingInvite(false)

    if (memberError) {
      setInviteError(memberError.message)
      return
    }

    setAcceptCode('')
    setInviteMessage('Invite accepted. You are now connected to the shared workspace.')
    await reloadWorkspace()
  }

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
        <div className="section-heading">
          <div>
            <h2>Invite code</h2>
            <p className="muted">Share one simple code with your teammate. They sign up, paste the code, and join this workspace.</p>
          </div>
        </div>

        {isOwner ? (
          <div className="invite-card">
            <div className="invite-code-box">
              <span>Current invite code</span>
              <strong>{inviteCode || 'No code yet'}</strong>
            </div>
            <div className="button-row">
              <button className="primary-button" type="button" onClick={generateInvite} disabled={savingInvite}>
                {inviteCode ? 'Generate new code' : 'Generate invite code'}
              </button>
              <button className="secondary-button" type="button" onClick={copyInvite} disabled={!inviteCode}>
                Copy invite
              </button>
            </div>
          </div>
        ) : (
          <form className="form-grid" onSubmit={acceptInvite}>
            <label>
              Invite code
              <input value={acceptCode} onChange={(event) => setAcceptCode(event.target.value.toUpperCase())} placeholder="ABC123" />
            </label>
            <button className="primary-button" type="submit" disabled={savingInvite}>Accept invite</button>
          </form>
        )}

        {isOwner && (
          <form className="form-grid compact-form" onSubmit={acceptInvite}>
            <label>
              Have a code for another workspace?
              <input value={acceptCode} onChange={(event) => setAcceptCode(event.target.value.toUpperCase())} placeholder="Paste invite code" />
            </label>
            <button className="secondary-button" type="submit" disabled={savingInvite}>Join with code</button>
          </form>
        )}

        {inviteMessage && <div className="success">{inviteMessage}</div>}
        {inviteError && <div className="error">{inviteError}</div>}
      </section>

      <section className="panel">
        <h2>Members</h2>
        <div className="member-list">
          {workspace?.members?.length ? workspace.members.map((member) => (
            <div className="member-row" key={`${member.id}-${member.role}`}>
              <div>
                <strong>{member.full_name || member.email || 'Workspace member'}</strong>
                <span>{member.email || 'Email hidden'}</span>
              </div>
              <span className="badge">{member.role}</span>
            </div>
          )) : <p>No members loaded yet.</p>}
        </div>
      </section>
    </div>
  )
}
