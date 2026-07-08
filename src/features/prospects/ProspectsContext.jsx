import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { supabase, isSupabaseConfigured } from '../../lib/supabase'
import { useWorkspace } from '../workspace/WorkspaceContext'

const ProspectsContext = createContext(null)

const STORAGE_KEY = 'crafted-digital-mini-os-phase-3'

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
    live_url: '',
    demo_brief: 'Local cafe demo focused on drinks, cozy photos, menu highlights, and easy contact.',
    demo_copy: 'Hero: A cozy neighborhood cafe with handcrafted drinks and friendly service. Sections: Featured drinks, about the cafe, menu preview, visit us, contact.',
    demo_notes: 'Use warm photos, simple menu cards, and clear call-to-action buttons.',
    demo_last_sent: null,
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

function addDays(days) {
  return new Date(Date.now() + days * 86400000).toISOString().slice(0, 10)
}

function buildDemoCopy(prospect) {
  const category = prospect.category || 'local business'
  const name = prospect.business_name
  return [
    `Hero: ${name} helps local customers with reliable ${category.toLowerCase()} services and a simple way to get in touch.`,
    `Sections: Services, why choose ${name}, customer-friendly process, location/contact, and a clear call-to-action.`,
    `Primary CTA: Call now or request a quote. Secondary CTA: View services.`,
    `Tone: local, trustworthy, clean, and easy to understand.`,
  ].join('\n\n')
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
      live_url: values.live_url || '',
      demo_brief: values.demo_brief || '',
      demo_copy: values.demo_copy || '',
      demo_notes: values.demo_notes || '',
      demo_last_sent: values.demo_last_sent || null,
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
      return { data: next.find((prospect) => prospect.id === id), error: null }
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

  async function generateDemoPlan(prospectId) {
    const prospect = prospects.find((item) => item.id === prospectId)
    if (!prospect) return { error: new Error('Prospect not found') }

    const values = {
      demo_status: 'building',
      status: prospect.status === 'research' ? 'demo_ready' : prospect.status,
      demo_brief: prospect.demo_brief || `${prospect.business_name} demo website for a ${prospect.category || 'local'} business.`,
      demo_copy: buildDemoCopy(prospect),
      demo_notes: prospect.demo_notes || 'Keep the design simple, mobile-first, and focused on turning visitors into calls or messages.',
    }

    const result = await updateProspect(prospectId, values)
    if (!result.error) await addActivity(prospectId, { type: 'Demo', note: 'Generated demo plan and website copy.' })
    return result
  }

  async function markDemoReady(prospectId, previewUrl = '') {
    const values = { demo_status: 'ready', status: 'demo_ready' }
    if (previewUrl) values.preview_url = previewUrl
    const result = await updateProspect(prospectId, values)
    if (!result.error) await addActivity(prospectId, { type: 'Demo', note: 'Marked demo as ready.' })
    return result
  }

  async function markDemoSent(prospectId) {
    const result = await updateProspect(prospectId, {
      demo_status: 'sent',
      status: 'contacted',
      demo_last_sent: new Date().toISOString(),
      next_follow_up: addDays(2),
    })
    if (!result.error) await addActivity(prospectId, { type: 'Demo', note: 'Marked demo as sent. Follow-up scheduled in 2 days.' })
    return result
  }

  const value = useMemo(() => ({
    prospects,
    activities,
    loading,
    error,
    createProspect,
    updateProspect,
    addActivity,
    generateDemoPlan,
    markDemoReady,
    markDemoSent,
    refresh: loadProspects,
  }), [prospects, activities, loading, error, loadProspects])

  return <ProspectsContext.Provider value={value}>{children}</ProspectsContext.Provider>
}

export function useProspects() {
  const context = useContext(ProspectsContext)
  if (!context) throw new Error('useProspects must be used inside ProspectsProvider')
  return context
}
