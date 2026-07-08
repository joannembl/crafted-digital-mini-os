import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { supabase, isSupabaseConfigured } from '../../lib/supabase'
import { useWorkspace } from '../workspace/WorkspaceContext'

const ProspectsContext = createContext(null)

const STORAGE_KEY = 'crafted-digital-mini-os-phase-2'

const seedProspects = [
  {
    id: 'local-prospect-1',
    workspace_id: 'local-workspace',
    business_name: 'Cafe Mollie',
    owner_name: '',
    category: 'Cafe',
    phone: '',
    email: '',
    website: '',
    instagram: '',
    status: 'demo_ready',
    demo_status: 'ready',
    preview_url: 'https://cafemolliephx.netlify.app/',
    next_follow_up: new Date().toISOString().slice(0, 10),
    notes: 'Demo built. Send a short personal follow-up.',
    created_at: new Date().toISOString(),
  },
]

const seedActivities = [
  {
    id: 'local-activity-1',
    prospect_id: 'local-prospect-1',
    workspace_id: 'local-workspace',
    type: 'Demo',
    note: 'Demo site is ready to send.',
    created_at: new Date().toISOString(),
  },
]

function readLocal() {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (!saved) return { prospects: seedProspects, activities: seedActivities }
  try {
    return JSON.parse(saved)
  } catch {
    return { prospects: seedProspects, activities: seedActivities }
  }
}

function writeLocal(nextState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState))
}

export function ProspectsProvider({ children }) {
  const { workspace } = useWorkspace()
  const [prospects, setProspects] = useState([])
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const workspaceId = workspace?.id

  const loadProspects = useCallback(async () => {
    if (!workspaceId) return
    setLoading(true)
    setError('')

    if (!isSupabaseConfigured) {
      const local = readLocal()
      setProspects(local.prospects)
      setActivities(local.activities)
      setLoading(false)
      return
    }

    const [{ data: prospectRows, error: prospectsError }, { data: activityRows, error: activitiesError }] = await Promise.all([
      supabase.from('prospects').select('*').eq('workspace_id', workspaceId).order('created_at', { ascending: false }),
      supabase.from('activities').select('*').eq('workspace_id', workspaceId).order('created_at', { ascending: false }),
    ])

    if (prospectsError || activitiesError) {
      setError(prospectsError?.message || activitiesError?.message)
    } else {
      setProspects(prospectRows ?? [])
      setActivities(activityRows ?? [])
    }
    setLoading(false)
  }, [workspaceId])

  useEffect(() => {
    loadProspects()
  }, [loadProspects])

  function persistLocal(nextProspects, nextActivities = activities) {
    setProspects(nextProspects)
    setActivities(nextActivities)
    writeLocal({ prospects: nextProspects, activities: nextActivities })
  }

  async function createProspect(values) {
    const row = {
      workspace_id: workspaceId,
      business_name: values.business_name,
      owner_name: values.owner_name || '',
      category: values.category || '',
      phone: values.phone || '',
      email: values.email || '',
      website: values.website || '',
      instagram: values.instagram || '',
      status: values.status || 'research',
      demo_status: values.demo_status || 'not_started',
      preview_url: values.preview_url || '',
      next_follow_up: values.next_follow_up || null,
      notes: values.notes || '',
    }

    if (!isSupabaseConfigured) {
      const created = { ...row, id: crypto.randomUUID(), created_at: new Date().toISOString() }
      persistLocal([created, ...prospects])
      return { data: created, error: null }
    }

    const { data, error } = await supabase.from('prospects').insert(row).select().single()
    if (!error) setProspects((current) => [data, ...current])
    return { data, error }
  }

  async function updateProspect(id, values) {
    if (!isSupabaseConfigured) {
      const next = prospects.map((prospect) => prospect.id === id ? { ...prospect, ...values } : prospect)
      persistLocal(next)
      return { error: null }
    }

    const { data, error } = await supabase.from('prospects').update(values).eq('id', id).select().single()
    if (!error) setProspects((current) => current.map((prospect) => prospect.id === id ? data : prospect))
    return { data, error }
  }

  async function addActivity(prospectId, values) {
    const row = {
      workspace_id: workspaceId,
      prospect_id: prospectId,
      type: values.type || 'Note',
      note: values.note,
    }

    if (!isSupabaseConfigured) {
      const created = { ...row, id: crypto.randomUUID(), created_at: new Date().toISOString() }
      persistLocal(prospects, [created, ...activities])
      return { data: created, error: null }
    }

    const { data, error } = await supabase.from('activities').insert(row).select().single()
    if (!error) setActivities((current) => [data, ...current])
    return { data, error }
  }

  const value = useMemo(() => ({
    prospects,
    activities,
    loading,
    error,
    createProspect,
    updateProspect,
    addActivity,
    refresh: loadProspects,
  }), [prospects, activities, loading, error, loadProspects])

  return <ProspectsContext.Provider value={value}>{children}</ProspectsContext.Provider>
}

export function useProspects() {
  const context = useContext(ProspectsContext)
  if (!context) throw new Error('useProspects must be used inside ProspectsProvider')
  return context
}
