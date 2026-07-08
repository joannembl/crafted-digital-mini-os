import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { supabase, isSupabaseConfigured } from '../../lib/supabase'
import { useAuth } from '../auth/AuthContext'

const WorkspaceContext = createContext(null)

const localWorkspace = {
  id: 'local-workspace',
  name: 'Crafted Digital',
  role: 'owner',
  members: [
    { id: 'local-demo-user', full_name: 'Crafted Digital Owner', email: 'owner@crafteddigital.local', role: 'owner' },
  ],
}

export function WorkspaceProvider({ children }) {
  const { user } = useAuth()
  const [workspace, setWorkspace] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function loadWorkspace() {
    if (!user) {
      setWorkspace(null)
      setLoading(false)
      return
    }

    if (!isSupabaseConfigured) {
      setWorkspace(localWorkspace)
      setLoading(false)
      return
    }

    setLoading(true)
    setError('')

    const fullName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Owner'
    await supabase.from('profiles').upsert({ id: user.id, email: user.email, full_name: fullName })

    const { data: memberships, error: membershipError } = await supabase
      .from('workspace_members')
      .select('role, workspaces(id, name, owner_id)')
      .eq('user_id', user.id)

    if (membershipError) {
      setError(membershipError.message)
      setLoading(false)
      return
    }

    if (!memberships?.length) {
      const { data: createdWorkspace, error: workspaceError } = await supabase
        .from('workspaces')
        .insert({ name: 'Crafted Digital', owner_id: user.id })
        .select()
        .single()

      if (workspaceError) {
        setError(workspaceError.message)
        setLoading(false)
        return
      }

      const { error: memberError } = await supabase.from('workspace_members').insert({
        workspace_id: createdWorkspace.id,
        user_id: user.id,
        role: 'owner',
      })

      if (memberError) {
        setError(memberError.message)
        setLoading(false)
        return
      }

      setWorkspace({ ...createdWorkspace, role: 'owner', members: [] })
      setLoading(false)
      return
    }

    // If a teammate accepted an invite after account creation, prefer the shared member workspace
    // over the private workspace created during first login.
    const selected = memberships.find((membership) => membership.role === 'member') ?? memberships[0]
    const { data: memberRows, error: membersError } = await supabase
      .from('workspace_members')
      .select('id, role, profiles(id, full_name, email)')
      .eq('workspace_id', selected.workspaces.id)

    if (membersError) {
      setError(membersError.message)
      setLoading(false)
      return
    }

    setWorkspace({
      ...selected.workspaces,
      role: selected.role,
      members: memberRows?.map((row) => ({ id: row.profiles?.id ?? row.id, ...row.profiles, role: row.role })) ?? [],
    })
    setLoading(false)
  }

  useEffect(() => {
    loadWorkspace()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const value = useMemo(() => ({ workspace, loading, error, reloadWorkspace: loadWorkspace }), [workspace, loading, error])
  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext)
  if (!context) throw new Error('useWorkspace must be used inside WorkspaceProvider')
  return context
}
