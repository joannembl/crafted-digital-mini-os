import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { supabase, isSupabaseConfigured } from '../../lib/supabase'
import { useWorkspace } from '../workspace/WorkspaceContext'

const ProspectsContext = createContext(null)

const STORAGE_KEY = 'crafted-digital-mini-os-phase-5'

export function slugify(value = '') {
  return value
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function prospectSlug(prospect) {
  return prospect?.slug || slugify(prospect?.business_name || '') || prospect?.id
}

const seedProspects = [
  {
    id: 'local-prospect-1',
    slug: 'cafe-mollie',
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
    package_type: 'Website, Handled',
    monthly_price: 99,
    setup_fee: 99,
    add_ons: '',
    client_notes: '',
    proposal_status: 'not_started',
    proposal_notes: '',
    proposal_sent_at: null,
    converted_at: null,
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
      setProspects(local.prospects.map((prospect) => ({ ...prospect, slug: prospectSlug(prospect) })))
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
      setProspects((prospectRows ?? []).map((prospect) => ({ ...prospect, slug: prospectSlug(prospect) })))
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
      slug: slugify(values.business_name),
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
      package_type: values.package_type || '',
      monthly_price: values.monthly_price === '' || values.monthly_price == null ? null : Number(values.monthly_price),
      setup_fee: values.setup_fee === '' || values.setup_fee == null ? null : Number(values.setup_fee),
      add_ons: values.add_ons || '',
      client_notes: values.client_notes || '',
      proposal_status: values.proposal_status || 'not_started',
      proposal_notes: values.proposal_notes || '',
      proposal_sent_at: values.proposal_sent_at || null,
      converted_at: values.converted_at || null,
      next_follow_up: values.next_follow_up || null,
      notes: values.notes || '',
    }

    if (!isSupabaseConfigured) {
      const created = { ...row, id: crypto.randomUUID(), created_at: new Date().toISOString() }
      persistLocal([created, ...prospects])
      return { data: created, error: null }
    }

    const { data, error } = await supabase.from('prospects').insert(row).select().single()
    if (!error) setProspects((current) => [{ ...data, slug: prospectSlug(data) }, ...current])
    return { data, error }
  }

  async function updateProspect(id, values) {
    const nextValues = { ...values }
    if (Object.prototype.hasOwnProperty.call(values, 'business_name')) {
      nextValues.slug = slugify(values.business_name)
    }

    if (!isSupabaseConfigured) {
      const next = prospects.map((prospect) => prospect.id === id ? { ...prospect, ...nextValues } : prospect)
      persistLocal(next)
      return { data: next.find((prospect) => prospect.id === id), error: null }
    }

    const { data, error } = await supabase.from('prospects').update(nextValues).eq('id', id).select().single()
    if (!error) setProspects((current) => current.map((prospect) => prospect.id === id ? { ...data, slug: prospectSlug(data) } : prospect))
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


  function generateOutreachMessage(prospect) {
    const ownerLine = prospect.owner_name ? ` ${prospect.owner_name}` : ''
    const demoLine = prospect.preview_url ? `\n\nHere is the demo:\n${prospect.preview_url}` : ''
    return `Hey${ownerLine}! I hope you are doing well. I am starting a local web design business and helping small businesses build modern, affordable websites.\n\nI put together a demo website for ${prospect.business_name} because I thought it would be easier to show you what your business could look like online.${demoLine}\n\nIf you like the direction, I would love to chat whenever you have time. We can customize the colors, photos, services, contact forms, booking, or anything else you would like. No pressure at all — I just thought you might enjoy seeing it.\n\nLet me know what you think!`
  }

  function buildProposalNotes(prospect) {
    const packageType = prospect.package_type || 'Website, Handled'
    const monthly = prospect.monthly_price ?? 99
    const setup = prospect.setup_fee ?? 99
    const addOns = prospect.add_ons?.trim() ? prospect.add_ons : 'None for now'
    return [
      `${prospect.business_name} Website Proposal`,
      ``,
      `Recommended package: ${packageType}`,
      `Setup fee: $${setup}`,
      `Monthly service: $${monthly}/month`,
      `Add-ons: ${addOns}`,
      ``,
      `Included:` ,
      `- Clean, mobile-ready website for ${prospect.business_name}`,
      `- Hosting and basic maintenance`,
      `- Small edits and updates`,
      `- Contact-focused layout built to turn visitors into calls or messages`,
      `- Monthly performance check-in`,
      ``,
      `Next step: confirm the package, collect final business details/photos, then move the demo toward launch.`
    ].join('\n')
  }

  async function generateProposal(prospectId) {
    const prospect = prospects.find((item) => item.id === prospectId)
    if (!prospect) return { error: new Error('Prospect not found') }

    const result = await updateProspect(prospectId, {
      proposal_status: 'drafted',
      proposal_notes: buildProposalNotes(prospect),
    })
    if (!result.error) await addActivity(prospectId, { type: 'Proposal', note: 'Generated proposal draft.' })
    return result
  }

  async function markProposalSent(prospectId) {
    const result = await updateProspect(prospectId, {
      proposal_status: 'sent',
      proposal_sent_at: new Date().toISOString(),
      status: 'proposal',
      next_follow_up: addDays(3),
    })
    if (!result.error) await addActivity(prospectId, { type: 'Proposal', note: 'Marked proposal as sent. Follow-up scheduled in 3 days.' })
    return result
  }

  async function convertToClient(prospectId, values = {}) {
    const result = await updateProspect(prospectId, {
      status: 'won',
      demo_status: 'live',
      package_type: values.package_type || 'Website, Handled',
      monthly_price: values.monthly_price === '' || values.monthly_price == null ? 99 : Number(values.monthly_price),
      setup_fee: values.setup_fee === '' || values.setup_fee == null ? 99 : Number(values.setup_fee),
      add_ons: values.add_ons || '',
      client_notes: values.client_notes || '',
      proposal_status: values.proposal_status || 'accepted',
      converted_at: new Date().toISOString(),
    })
    if (!result.error) await addActivity(prospectId, { type: 'Client', note: 'Converted prospect to client.' })
    return result
  }


  async function completeFollowUp(prospectId, note = '') {
    const cleanNote = note?.trim()
    const result = await updateProspect(prospectId, { next_follow_up: null })
    if (!result.error) {
      await addActivity(prospectId, {
        type: 'Follow-up',
        note: cleanNote || 'Completed follow-up.',
      })
    }
    return result
  }

  async function snoozeFollowUp(prospectId, days = 2) {
    const nextDate = addDays(days)
    const result = await updateProspect(prospectId, { next_follow_up: nextDate })
    if (!result.error) await addActivity(prospectId, { type: 'Follow-up', note: `Snoozed follow-up until ${nextDate}.` })
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
    convertToClient,
    generateOutreachMessage,
    generateProposal,
    markProposalSent,
    completeFollowUp,
    snoozeFollowUp,
    refresh: loadProspects,
    slugForProspect: prospectSlug,
  }), [prospects, activities, loading, error, loadProspects])

  return <ProspectsContext.Provider value={value}>{children}</ProspectsContext.Provider>
}

export function useProspects() {
  const context = useContext(ProspectsContext)
  if (!context) throw new Error('useProspects must be used inside ProspectsProvider')
  return context
}
