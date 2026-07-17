import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { supabase, isSupabaseConfigured } from '../../lib/supabase'
import { useWorkspace } from '../workspace/WorkspaceContext'
import { logAuditEvent } from '../../lib/audit'
import { generateDemoForgeSite } from '../../lib/demoForge'

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
    address: '',
    instagram: '',
    facebook: '',
    business_context: '',
    creative_direction: '',
    style_inspiration: '',
    google_place_id: '',
    google_maps_url: '',
    google_rating: null,
    google_review_count: null,
    google_types: [],
    google_opening_hours: [],
    google_imported_at: null,
    status: 'demo_ready',
    demo_status: 'ready',
    preview_url: 'https://cafemolliephx.netlify.app/',
    live_url: '',
    demo_brief: 'Local cafe demo focused on drinks, cozy photos, menu highlights, and easy contact.',
    demo_copy: 'Hero: A cozy neighborhood cafe with handcrafted drinks and friendly service. Sections: Featured drinks, about the cafe, menu preview, visit us, contact.',
    demo_notes: 'Use warm photos, simple menu cards, and clear call-to-action buttons.',
    demo_last_sent: null,
    ai_research_summary: '',
    ai_source_links: '',
    ai_generated_at: null,
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
      address: values.address || '',
      instagram: values.instagram || '',
      facebook: values.facebook || '',
      business_context: values.business_context || '',
      creative_direction: values.creative_direction || '',
      style_inspiration: values.style_inspiration || '',
      google_place_id: values.google_place_id || '',
      google_maps_url: values.google_maps_url || '',
      google_rating: values.google_rating === '' || values.google_rating == null ? null : Number(values.google_rating),
      google_review_count: values.google_review_count === '' || values.google_review_count == null ? null : Number(values.google_review_count),
      google_types: Array.isArray(values.google_types) ? values.google_types : [],
      google_opening_hours: Array.isArray(values.google_opening_hours) ? values.google_opening_hours : [],
      google_imported_at: values.google_imported_at || null,
      status: values.status || 'research',
      demo_status: values.demo_status || 'not_started',
      deployment_status: values.deployment_status || 'idle',
      deployment_checked_at: values.deployment_checked_at || null,
      preview_url: values.preview_url || '',
      live_url: values.live_url || '',
      demo_brief: values.demo_brief || '',
      demo_copy: values.demo_copy || '',
      demo_notes: values.demo_notes || '',
      demo_theme_key: values.demo_theme_key || '',
      demo_layout: values.demo_layout || '',
      demo_last_sent: values.demo_last_sent || null,
      ai_research_summary: values.ai_research_summary || '',
      ai_source_links: values.ai_source_links || '',
      ai_generated_at: values.ai_generated_at || null,
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
    if (!error) {
      setProspects((current) => [{ ...data, slug: prospectSlug(data) }, ...current])
      await logAuditEvent({
        workspaceId,
        action: 'prospect.created',
        entityType: 'prospect',
        entityId: data.id,
        metadata: { business_name: data.business_name, status: data.status },
      })
    }
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
    if (!error) {
      setActivities((current) => [data, ...current])
      await logAuditEvent({
        workspaceId,
        action: 'activity.created',
        entityType: 'activity',
        entityId: data.id,
        metadata: { prospect_id: prospectId, type: data.type },
      })
    }
    return { data, error }
  }


  function formatAiDemoCopy(generated) {
    if (!generated) return ''
    const sections = Array.isArray(generated.sections) ? generated.sections : []
    return [
      `Hero: ${generated.hero_headline || ''}`,
      `Subheadline: ${generated.hero_subheadline || ''}`,
      `Primary CTA: ${generated.primary_cta || 'Call now'}`,
      `Secondary CTA: ${generated.secondary_cta || 'View services'}`,
      '',
      'Sections:',
      ...sections.map((section) => `- ${section.title || 'Section'}: ${section.body || ''}`),
      '',
      `About: ${generated.about || ''}`,
      `Contact prompt: ${generated.contact_prompt || ''}`,
      `Design notes: ${generated.design_notes || ''}`,
    ].filter(Boolean).join('\n')
  }

  async function importBusinessFromGooglePlaces({ businessName = '', address = '' } = {}) {
    const query = [businessName, address].filter(Boolean).join(' ').trim()
    if (!query) return { data: null, error: new Error('Enter a business name or address first') }

    if (!isSupabaseConfigured) {
      return {
        data: {
          business_name: businessName || 'Imported Business',
          address,
          category: '',
          phone: '',
          website: '',
          google_maps_url: address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}` : '',
          google_place_id: '',
          google_rating: null,
          google_review_count: null,
          google_types: [],
          google_opening_hours: [],
          google_imported_at: new Date().toISOString(),
        },
        error: null,
      }
    }

    const { data, error } = await supabase.functions.invoke('import-google-place', {
      body: { business_name: businessName, address, query },
    })

    if (error || data?.error) {
      return { data: null, error: new Error(error?.message || data?.error || 'Unable to import from Google Places') }
    }

    return { data: data.business, error: null }
  }

  async function generateAiDemo(prospectId, prospectOverrides = {}) {
    const baseProspect = prospects.find((item) => item.id === prospectId)
    if (!baseProspect) return { error: new Error('Prospect not found') }
    const prospect = { ...baseProspect, ...prospectOverrides }

    if (!isSupabaseConfigured) {
      const generated = {
        research_summary: 'Local preview mode: connect Supabase + OpenAI/search secrets to generate research-backed demo copy.',
        hero_headline: `${prospect.business_name} — modern local website demo`,
        hero_subheadline: `A clean demo website designed to help ${prospect.business_name} explain services and turn visitors into calls or messages.`,
        primary_cta: prospect.phone ? 'Call Now' : 'Request a Quote',
        secondary_cta: 'View Services',
        sections: [
          { title: 'Services', body: 'Easy-to-scan cards explain the main services customers are looking for.' },
          { title: 'Why choose us', body: 'A friendly local message builds trust quickly.' },
          { title: 'Contact', body: 'Clear buttons make it simple to call, email, or message.' },
        ],
        about: `${prospect.business_name} is presented as a trustworthy local business with a clean, mobile-first website.`,
        contact_prompt: 'Reach out today to get started.',
        design_notes: 'Mobile-first, simple sections, bold CTA, and local trust cues.',
        designed_site: { html: '', css: '', summary: 'Local preview demo copy only', style_direction: 'Modern clean' },
        brand_profile: { logo_url: prospect.brand_logo_url || '', detected_colors: [], source: 'local_preview' },
        sources: [],
        ai_provider: 'local_preview',
        generation_provider: 'local_preview',
        generation_error: '',
      }
      const result = await updateProspect(prospectId, {
        demo_status: 'building',
        status: prospect.status === 'research' ? 'demo_ready' : prospect.status,
        demo_brief: generated.hero_subheadline,
        demo_copy: formatAiDemoCopy(generated),
        demo_notes: generated.design_notes,
        ai_research_summary: generated.research_summary,
        ai_source_links: '',
        ai_generated_at: new Date().toISOString(),
        demo_site_html: generated.designed_site?.html || '',
        demo_site_css: generated.designed_site?.css || '',
        demo_design_summary: generated.designed_site?.summary || generated.design_notes || '',
        demo_style: generated.designed_site?.style_direction || generated.brand_profile?.design_direction || 'Modern clean',
        brand_logo_url: generated.brand_profile?.logo_url || prospect.brand_logo_url || '',
        brand_profile: generated.brand_profile || null,
        generation_provider: generated.generation_provider || generated.ai_provider || 'local_preview',
        generation_error: generated.generation_error || '',
      })
      if (!result.error) await addActivity(prospectId, { type: 'AI Demo', note: 'Generated AI-designed demo page in local preview mode.' })
      return result
    }

    const { data, error } = await supabase.functions.invoke('generate-demo-ai', {
      body: { prospect },
    })

    if (error || data?.error) return { data: null, error: new Error(error?.message || data?.error || 'Unable to generate AI demo') }

    const generated = data.generated
    const sourceLinks = Array.isArray(generated?.sources)
      ? generated.sources.map((source) => `${source.title || 'Source'} — ${source.link || ''}`).filter(Boolean).join('\n')
      : ''

    const result = await updateProspect(prospectId, {
      demo_status: 'building',
      status: prospect.status === 'research' ? 'demo_ready' : prospect.status,
      demo_brief: generated?.hero_subheadline || prospect.demo_brief || `${prospect.business_name} AI-generated demo brief.`,
      demo_copy: formatAiDemoCopy(generated),
      demo_notes: generated?.design_notes || prospect.demo_notes || '',
      ai_research_summary: generated?.research_summary || data.research?.research_summary || '',
      ai_source_links: sourceLinks,
      ai_generated_at: new Date().toISOString(),
      demo_site_html: generated?.designed_site?.html || '',
      demo_site_css: generated?.designed_site?.css || '',
      demo_design_summary: generated?.designed_site?.summary || generated?.design_notes || '',
      demo_style: generated?.designed_site?.style_direction || generated?.brand_profile?.design_direction || data.research?.brand_profile?.design_direction || '',
      brand_logo_url: generated?.brand_profile?.logo_url || data.research?.brand_profile?.logo_url || prospect.brand_logo_url || '',
      brand_profile: generated?.brand_profile || data.research?.brand_profile || null,
      generation_provider: generated?.generation_provider || generated?.ai_provider || '',
      generation_error: generated?.generation_error || (Array.isArray(generated?.ai_errors) ? generated.ai_errors.join(' | ') : ''),
    })

    if (!result.error && data.research) {
      await supabase.from('business_research').insert({
        workspace_id: workspaceId,
        prospect_id: prospectId,
        provider: data.researchProvider || data.research.provider || 'google_places',
        google_json: data.research.google_place || null,
        website_content: data.research.website_content || null,
        brand_profile: generated?.brand_profile || data.research?.brand_profile || null,
        logo_url: generated?.brand_profile?.logo_url || data.research?.brand_profile?.logo_url || '',
        ai_summary: generated?.research_summary || data.research?.research_summary || '',
        source_links: sourceLinks,
      })
    }

    if (!result.error) {
      const provider = generated?.generation_provider || generated?.ai_provider || 'unknown'
      const note = provider === 'fallback'
        ? `AI generation failed; fallback demo created instead. ${generated?.generation_error || ''}`
        : `Generated AI-designed demo page with ${provider}${data.searched ? ' using Google Places and website research.' : ' from saved prospect details.'}`
      await addActivity(prospectId, { type: provider === 'fallback' ? 'AI Fallback' : 'AI Demo', note })
    }
    return result
  }

  async function generateDemoPlan(prospectId) {
    const prospect = prospects.find((item) => item.id === prospectId)
    if (!prospect) return { error: new Error('Prospect not found') }

    const values = {
      demo_status: 'building',
      deployment_status: prospect.deployment_status || 'idle',
      status: prospect.status === 'research' ? 'demo_ready' : prospect.status,
      demo_brief: prospect.demo_brief || `${prospect.business_name} demo website for a ${prospect.category || 'local'} business.`,
      demo_copy: buildDemoCopy(prospect),
      demo_notes: prospect.demo_notes || 'Keep the design simple, mobile-first, and focused on turning visitors into calls or messages.',
    }

    const result = await updateProspect(prospectId, values)
    if (!result.error) await addActivity(prospectId, { type: 'Demo', note: 'Generated demo plan and website copy.' })
    return result
  }

  // Runs the deterministic DemoForge engine entirely locally — no AI provider, no network call.
  // overrides can include demo_theme_key / demo_layout ('auto' or a specific key) plus any
  // creative brief fields, so a manual theme/layout choice takes priority over the auto-hash pick.
  async function generateForgeDemo(prospectId, overrides = {}) {
    const baseProspect = prospects.find((item) => item.id === prospectId)
    if (!baseProspect) return { error: new Error('Prospect not found') }
    const prospect = { ...baseProspect, ...overrides }

    let generated
    try {
      generated = generateDemoForgeSite({ prospect })
    } catch (err) {
      return { error: err instanceof Error ? err : new Error('Unable to generate DemoForge site') }
    }

    const result = await updateProspect(prospectId, {
      demo_status: 'building',
      status: prospect.status === 'research' ? 'demo_ready' : prospect.status,
      demo_brief: generated.hero_subheadline,
      demo_copy: formatAiDemoCopy(generated),
      demo_notes: generated.design_notes,
      ai_research_summary: generated.research_summary,
      ai_source_links: '',
      ai_generated_at: new Date().toISOString(),
      demo_site_html: generated.designed_site?.html || '',
      demo_site_css: generated.designed_site?.css || '',
      demo_design_summary: generated.designed_site?.summary || generated.design_notes || '',
      demo_style: generated.designed_site?.style_direction || '',
      brand_logo_url: generated.brand_profile?.logo_url || prospect.brand_logo_url || '',
      brand_profile: generated.brand_profile || null,
      generation_provider: 'demoforge',
      generation_error: '',
      demo_theme_key: overrides.demo_theme_key ?? prospect.demo_theme_key ?? '',
      demo_layout: overrides.demo_layout ?? prospect.demo_layout ?? '',
    })

    if (!result.error) {
      await addActivity(prospectId, {
        type: 'Demo',
        note: `Generated DemoForge site (${generated.brand_profile?.design_direction || 'style'}) — deterministic, no AI used.`,
      })
    }
    return result
  }

  async function markDemoReady(prospectId, previewUrl = '') {
    const values = { demo_status: 'ready', deployment_status: previewUrl ? 'live' : 'idle', status: 'demo_ready' }
    if (previewUrl) values.preview_url = previewUrl
    const result = await updateProspect(prospectId, values)
    if (!result.error) await addActivity(prospectId, { type: 'Demo', note: 'Marked demo as ready.' })
    return result
  }

  async function markDemoSent(prospectId) {
    const result = await updateProspect(prospectId, {
      demo_status: 'sent',
      deployment_status: 'live',
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
      deployment_status: 'live',
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



  async function deleteActivity(activityId) {
    const activity = activities.find((item) => item.id === activityId)
    if (!activity) return { error: new Error('Activity not found') }

    if (!isSupabaseConfigured) {
      const nextActivities = activities.filter((item) => item.id !== activityId)
      persistLocal(prospects, nextActivities)
      return { data: activity, error: null }
    }

    const { error } = await supabase.from('activities').delete().eq('id', activityId)
    if (!error) {
      setActivities((current) => current.filter((item) => item.id !== activityId))
      await logAuditEvent({
        workspaceId,
        action: 'activity.deleted',
        entityType: 'activity',
        entityId: activityId,
        metadata: { prospect_id: activity.prospect_id, type: activity.type },
      })
    }
    return { data: activity, error }
  }

  async function deleteAllProspectActivities(prospectId) {
    const prospect = prospects.find((item) => item.id === prospectId)
    if (!prospect) return { error: new Error('Prospect not found') }

    const deletedActivities = activities.filter((item) => item.prospect_id === prospectId)

    if (!isSupabaseConfigured) {
      const nextActivities = activities.filter((item) => item.prospect_id !== prospectId)
      persistLocal(prospects, nextActivities)
      return { data: deletedActivities, error: null }
    }

    const { error } = await supabase.from('activities').delete().eq('prospect_id', prospectId)
    if (!error) {
      setActivities((current) => current.filter((item) => item.prospect_id !== prospectId))
      await logAuditEvent({
        workspaceId,
        action: 'activity.bulk_deleted',
        entityType: 'prospect',
        entityId: prospectId,
        metadata: { business_name: prospect.business_name, deleted_count: deletedActivities.length },
      })
    }
    return { data: deletedActivities, error }
  }

  async function clearDemo(prospectId) {
    const prospect = prospects.find((item) => item.id === prospectId)
    if (!prospect) return { error: new Error('Prospect not found') }

    const clearedValues = {
      demo_status: 'not_started',
      deployment_status: 'idle',
      deployment_checked_at: null,
      preview_url: '',
      live_url: prospect.status === 'won' ? prospect.live_url : '',
      demo_brief: '',
      demo_copy: '',
      demo_notes: '',
      demo_last_sent: null,
      ai_research_summary: '',
      ai_source_links: '',
      ai_generated_at: null,
      demo_site_html: '',
      demo_site_css: '',
      demo_design_summary: '',
      demo_style: '',
      brand_profile: null,
      generation_provider: '',
      generation_error: '',
    }

    const result = await updateProspect(prospectId, clearedValues)

    if (!result.error && isSupabaseConfigured) {
      await supabase.from('business_research').delete().eq('prospect_id', prospectId)
    }

    if (!result.error) {
      await addActivity(prospectId, { type: 'Demo', note: 'Cleared demo, AI generation, deployment, and research fields.' })
      await logAuditEvent({
        workspaceId,
        action: 'demo.cleared',
        entityType: 'prospect',
        entityId: prospectId,
        metadata: { business_name: prospect.business_name },
      })
    }
    return result
  }

  async function clearClientDetails(prospectId) {
    const result = await updateProspect(prospectId, {
      status: 'proposal',
      package_type: '',
      monthly_price: null,
      setup_fee: null,
      add_ons: '',
      client_notes: '',
      converted_at: null,
      proposal_status: 'drafted',
    })
    if (!result.error) {
      await addActivity(prospectId, { type: 'Client', note: 'Cleared client details and moved prospect back to proposal.' })
      await logAuditEvent({
        workspaceId,
        action: 'client_details.cleared',
        entityType: 'prospect',
        entityId: prospectId,
        metadata: {},
      })
    }
    return result
  }

  async function deleteProspect(prospectId) {
    const prospect = prospects.find((item) => item.id === prospectId)
    if (!prospect) return { error: new Error('Prospect not found') }

    if (!isSupabaseConfigured) {
      const nextProspects = prospects.filter((item) => item.id !== prospectId)
      const nextActivities = activities.filter((item) => item.prospect_id !== prospectId)
      persistLocal(nextProspects, nextActivities)
      return { data: prospect, error: null }
    }

    await logAuditEvent({
      workspaceId,
      action: 'prospect.delete_requested',
      entityType: 'prospect',
      entityId: prospectId,
      metadata: { business_name: prospect.business_name, status: prospect.status },
    })

    const { error } = await supabase.from('prospects').delete().eq('id', prospectId)
    if (!error) {
      setProspects((current) => current.filter((item) => item.id !== prospectId))
      setActivities((current) => current.filter((item) => item.prospect_id !== prospectId))
    }
    return { data: prospect, error }
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
    importBusinessFromGooglePlaces,
    deleteActivity,
    deleteAllProspectActivities,
    clearDemo,
    clearClientDetails,
    deleteProspect,
    generateDemoPlan,
    generateForgeDemo,
    generateAiDemo,
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
