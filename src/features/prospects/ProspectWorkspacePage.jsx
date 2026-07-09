import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, AlertTriangle, BriefcaseBusiness, ChevronDown, ExternalLink, FileText, Globe2, MapPin, MessageSquareText, RotateCcw, Save, Send, Sparkles, Trash2, UserRound } from 'lucide-react'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { slugify, useProspects } from './ProspectsContext'
import { demoStatuses, labelFor, prospectStatuses } from './prospectOptions'

function InstagramMark({ size = 15 }) {
  return <span className="platform-mark" style={{ fontSize: `${Math.max(12, size - 1)}px` }}>IG</span>
}

function FacebookMark({ size = 15 }) {
  return <span className="platform-mark" style={{ fontSize: `${Math.max(12, size - 1)}px` }}>FB</span>
}

function normalized(value) {
  return value === undefined || value === null ? '' : value
}

function draftSnapshot(value) {
  return JSON.stringify(value || {})
}

function createOverviewDraft(prospect) {
  return {
    owner_name: prospect?.owner_name || '',
    category: prospect?.category || '',
    phone: prospect?.phone || '',
    email: prospect?.email || '',
    website: prospect?.website || '',
    instagram: prospect?.instagram || '',
    facebook: prospect?.facebook || '',
    address: prospect?.address || '',
    google_place_id: prospect?.google_place_id || '',
    google_maps_url: prospect?.google_maps_url || '',
    google_rating: prospect?.google_rating ?? null,
    google_review_count: prospect?.google_review_count ?? null,
    google_types: prospect?.google_types || [],
    google_opening_hours: prospect?.google_opening_hours || [],
    google_imported_at: prospect?.google_imported_at || null,
    status: prospect?.status || 'research',
    next_follow_up: prospect?.next_follow_up || '',
    notes: prospect?.notes || '',
  }
}

function createDemoDraft(prospect) {
  return {
    demo_status: prospect?.demo_status || 'not_started',
    preview_url: prospect?.preview_url || '',
  }
}

function createClientDraft(prospect) {
  return {
    package_type: prospect?.package_type || '',
    monthly_price: normalized(prospect?.monthly_price),
    setup_fee: normalized(prospect?.setup_fee),
    add_ons: prospect?.add_ons || '',
    live_url: prospect?.live_url || '',
    client_notes: prospect?.client_notes || '',
  }
}

function createProposalDraft(prospect) {
  return {
    proposal_status: prospect?.proposal_status || 'not_started',
  }
}

export function ProspectWorkspacePage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { prospects, activities, updateProspect, addActivity, deleteActivity, deleteAllProspectActivities, clearDemo, clearClientDetails, deleteProspect, importBusinessFromGooglePlaces, markDemoReady, markDemoSent, convertToClient, generateProposal, markProposalSent, slugForProspect } = useProspects()
  const prospect = prospects.find((item) => item.id === slug || item.slug === slug || slugify(item.business_name) === slug)
  const [note, setNote] = useState('')
  const [activityType, setActivityType] = useState('Note')
  const [saved, setSaved] = useState(false)
  const [overviewDraft, setOverviewDraft] = useState({})
  const [demoDraft, setDemoDraft] = useState({})
  const [clientDraft, setClientDraft] = useState({})
  const [proposalDraft, setProposalDraft] = useState({})
  const [collapsedSections, setCollapsedSections] = useState({
    clientDetails: false,
    proposal: false,
    demoTracker: false,
    activityNotes: false,
  })
  const [confirmDialog, setConfirmDialog] = useState(null)
  const [unsavedDialog, setUnsavedDialog] = useState(null)
  const [importingBusiness, setImportingBusiness] = useState(false)

  const prospectActivities = useMemo(() => activities.filter((activity) => activity.prospect_id === prospect?.id), [activities, prospect?.id])
  const overviewDirty = prospect ? draftSnapshot(overviewDraft) !== draftSnapshot(createOverviewDraft(prospect)) : false
  const demoDirty = prospect ? draftSnapshot(demoDraft) !== draftSnapshot(createDemoDraft(prospect)) : false
  const clientDirty = prospect ? draftSnapshot(clientDraft) !== draftSnapshot(createClientDraft(prospect)) : false
  const proposalDirty = prospect ? draftSnapshot(proposalDraft) !== draftSnapshot(createProposalDraft(prospect)) : false
  const activityDirty = Boolean(note.trim())
  const hasUnsavedChanges = overviewDirty || demoDirty || clientDirty || proposalDirty || activityDirty

  useEffect(() => {
    setOverviewDraft(createOverviewDraft(prospect))
    setDemoDraft(createDemoDraft(prospect))
    setClientDraft(createClientDraft(prospect))
    setProposalDraft(createProposalDraft(prospect))
    setNote('')
  }, [prospect?.id])

  useEffect(() => {
    if (!hasUnsavedChanges) return

    function handleBeforeUnload(event) {
      event.preventDefault()
      event.returnValue = ''
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasUnsavedChanges])

  if (!prospect) return <Navigate to="/prospects" replace />

  async function patch(values) {
    setSaved(false)
    const result = await updateProspect(prospect.id, values)
    if (!result.error) {
      setSaved(true)
      window.setTimeout(() => setSaved(false), 1200)
    }
    return result
  }

  function updateOverviewDraft(field, value) {
    setOverviewDraft((current) => ({ ...current, [field]: value }))
  }

  function updateDemoDraft(field, value) {
    setDemoDraft((current) => ({ ...current, [field]: value }))
  }

  function updateClientDraft(field, value) {
    setClientDraft((current) => ({ ...current, [field]: value }))
  }

  function updateProposalDraft(field, value) {
    setProposalDraft((current) => ({ ...current, [field]: value }))
  }

  function openUnsavedDialog(config) {
    setUnsavedDialog(config)
  }

  function closeUnsavedDialog() {
    setUnsavedDialog(null)
  }

  function handleBackToProspects() {
    if (!hasUnsavedChanges) {
      navigate('/prospects')
      return
    }

    openUnsavedDialog({
      title: 'Leave with unsaved changes?',
      message: 'You have unsaved changes in this workspace. Leaving now will discard anything you have not saved.',
      confirmLabel: 'Discard and leave',
      onConfirm: () => {
        closeUnsavedDialog()
        navigate('/prospects')
      },
    })
  }

  function guardedNavigate(path) {
    if (!hasUnsavedChanges) {
      navigate(path)
      return
    }

    openUnsavedDialog({
      title: 'Leave with unsaved changes?',
      message: 'Save or discard your changes before leaving this workspace.',
      confirmLabel: 'Discard and continue',
      onConfirm: () => {
        closeUnsavedDialog()
        navigate(path)
      },
    })
  }

  function discardSection(section) {
    const sectionLabels = {
      overview: 'overview changes',
      demo: 'demo tracker changes',
      client: 'client detail changes',
      proposal: 'proposal changes',
      activity: 'unsaved activity note',
    }

    openUnsavedDialog({
      title: `Discard ${sectionLabels[section] || 'changes'}?`,
      message: 'This resets the unsaved edits in this section back to the last saved version.',
      confirmLabel: 'Discard changes',
      onConfirm: () => {
        if (section === 'overview') setOverviewDraft(createOverviewDraft(prospect))
        if (section === 'demo') setDemoDraft(createDemoDraft(prospect))
        if (section === 'client') setClientDraft(createClientDraft(prospect))
        if (section === 'proposal') setProposalDraft(createProposalDraft(prospect))
        if (section === 'activity') setNote('')
        closeUnsavedDialog()
        toast.success('Unsaved changes discarded')
      },
    })
  }

  function toggleSection(section) {
    setCollapsedSections((current) => ({ ...current, [section]: !current[section] }))
  }


  function externalUrl(value) {
    const trimmed = (value || '').trim()
    if (!trimmed) return ''
    return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
  }

  function mapsUrl(value) {
    const trimmed = (value || '').trim()
    if (!trimmed) return ''
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(trimmed)}`
  }

  function SocialField({ label, field, icon: Icon, placeholder }) {
    const url = externalUrl(overviewDraft[field])
    return (
      <label className="social-field">
        <span className="field-label-row"><Icon size={15} /> {label}</span>
        <span className="social-input-row">
          <input value={overviewDraft[field] || ''} onChange={(e) => updateOverviewDraft(field, e.target.value)} placeholder={placeholder} />
          {url && <a className="inline-visit-button" href={url} target="_blank" rel="noreferrer"><ExternalLink size={14} /> Visit</a>}
        </span>
      </label>
    )
  }

  function CollapsibleHeader({ section, title, icon: Icon, description }) {
    const isCollapsed = collapsedSections[section]
    return (
      <button
        className="collapsible-panel-header"
        type="button"
        onClick={() => toggleSection(section)}
        aria-expanded={!isCollapsed}
      >
        <span className="collapsible-title-wrap">
          {Icon && <span className="workspace-section-icon"><Icon size={18} /></span>}
          <span>
            <h2>{title}</h2>
            {description && <small>{description}</small>}
          </span>
        </span>
        <ChevronDown className={isCollapsed ? 'chevron collapsed' : 'chevron'} size={18} />
      </button>
    )
  }

  async function handleImportOverviewFromGooglePlaces() {
    if (!prospect.business_name?.trim() && !overviewDraft.address?.trim()) {
      toast.error('Add a business name or address first')
      return
    }

    setImportingBusiness(true)
    const result = await importBusinessFromGooglePlaces({ businessName: prospect.business_name, address: overviewDraft.address })
    setImportingBusiness(false)

    if (result.error) {
      toast.error(result.error.message || 'Unable to import business details')
      return
    }

    const business = result.data || {}
    setOverviewDraft((current) => ({
      ...current,
      category: business.category || current.category,
      phone: business.phone || current.phone,
      website: business.website || current.website,
      address: business.address || current.address,
      google_place_id: business.google_place_id || current.google_place_id,
      google_maps_url: business.google_maps_url || current.google_maps_url,
      google_rating: business.google_rating ?? current.google_rating,
      google_review_count: business.google_review_count ?? current.google_review_count,
      google_types: business.google_types || current.google_types,
      google_opening_hours: business.google_opening_hours || current.google_opening_hours,
      google_imported_at: business.google_imported_at || new Date().toISOString(),
    }))
    toast.success('Imported Google Places details — review and save changes')
  }

  async function saveOverviewChanges() {
    const result = await patch({
      owner_name: overviewDraft.owner_name || null,
      category: overviewDraft.category || null,
      phone: overviewDraft.phone || null,
      email: overviewDraft.email || null,
      website: overviewDraft.website || null,
      instagram: overviewDraft.instagram || null,
      facebook: overviewDraft.facebook || null,
      address: overviewDraft.address || null,
      google_place_id: overviewDraft.google_place_id || null,
      google_maps_url: overviewDraft.google_maps_url || null,
      google_rating: overviewDraft.google_rating === '' || overviewDraft.google_rating == null ? null : Number(overviewDraft.google_rating),
      google_review_count: overviewDraft.google_review_count === '' || overviewDraft.google_review_count == null ? null : Number(overviewDraft.google_review_count),
      google_types: Array.isArray(overviewDraft.google_types) ? overviewDraft.google_types : [],
      google_opening_hours: Array.isArray(overviewDraft.google_opening_hours) ? overviewDraft.google_opening_hours : [],
      google_imported_at: overviewDraft.google_imported_at || null,
      status: overviewDraft.status || 'research',
      converted_at: overviewDraft.status === 'won' && !prospect.converted_at ? new Date().toISOString() : prospect.converted_at,
      next_follow_up: overviewDraft.next_follow_up || null,
      notes: overviewDraft.notes || null,
    })
    if (!result?.error) toast.success('Changes saved')
    else toast.error(result.error.message || 'Unable to save changes')
  }

  async function saveDemoChanges({ silent = false } = {}) {
    if (!demoDirty) return { error: null }
    const result = await patch({
      demo_status: demoDraft.demo_status || 'not_started',
      preview_url: demoDraft.preview_url || null,
    })
    if (!result?.error && !silent) toast.success('Demo tracker saved')
    if (result?.error && !silent) toast.error(result.error.message || 'Unable to save demo tracker')
    return result
  }

  async function saveClientDetails() {
    if (!clientDirty) return { error: null }
    const result = await patch({
      package_type: clientDraft.package_type || null,
      monthly_price: clientDraft.monthly_price === '' || clientDraft.monthly_price == null ? null : Number(clientDraft.monthly_price),
      setup_fee: clientDraft.setup_fee === '' || clientDraft.setup_fee == null ? null : Number(clientDraft.setup_fee),
      add_ons: clientDraft.add_ons || null,
      live_url: clientDraft.live_url || null,
      client_notes: clientDraft.client_notes || null,
    })
    if (!result?.error) toast.success('Client details saved')
    else toast.error(result.error.message || 'Unable to save client details')
    return result
  }

  async function saveProposalChanges() {
    if (!proposalDirty) return { error: null }
    const result = await patch({ proposal_status: proposalDraft.proposal_status || 'not_started' })
    if (!result?.error) toast.success('Proposal saved')
    else toast.error(result.error.message || 'Unable to save proposal')
    return result
  }

  async function handleActivity(event) {
    event.preventDefault()
    if (!note.trim()) return
    const result = await addActivity(prospect.id, { type: activityType, note })
    if (!result.error) {
      setNote('')
      toast.success('Note added')
    } else {
      toast.error(result.error.message || 'Unable to add note')
    }
  }


  function openConfirmDialog(config) {
    setConfirmDialog(config)
  }

  function closeConfirmDialog() {
    setConfirmDialog(null)
  }

  function handleDeleteActivity(activity) {
    openConfirmDialog({
      title: `Delete ${activity.type.toLowerCase()} note?`,
      message: 'This removes the activity from the prospect timeline. This cannot be undone.',
      confirmLabel: 'Delete note',
      onConfirm: async () => {
        closeConfirmDialog()
        const result = await deleteActivity(activity.id)
        if (!result.error) toast.success('Activity deleted')
        else toast.error(result.error.message || 'Unable to delete activity')
      },
    })
  }

  function handleDeleteAllNotes() {
    openConfirmDialog({
      title: 'Delete all notes?',
      message: `This permanently removes all ${prospectActivities.length} saved notes and activities from ${prospect.business_name}. This cannot be undone.`,
      confirmLabel: 'Delete all notes',
      onConfirm: async () => {
        closeConfirmDialog()
        const result = await deleteAllProspectActivities(prospect.id)
        if (!result.error) toast.success('All notes deleted')
        else toast.error(result.error.message || 'Unable to delete notes')
      },
    })
  }

  function handleClearDemo() {
    openConfirmDialog({
      title: 'Clear demo fields?',
      message: 'This removes generated copy, AI HTML/CSS, research, preview URL, and publishing status. It does not delete files already pushed to GitHub Pages.',
      confirmLabel: 'Clear demo',
      onConfirm: async () => {
        closeConfirmDialog()
        const result = await clearDemo(prospect.id)
        if (!result.error) toast.success('Demo fields cleared')
        else toast.error(result.error.message || 'Unable to clear demo fields')
      },
    })
  }

  function handleClearClientDetails() {
    openConfirmDialog({
      title: 'Clear client details?',
      message: 'This removes package, pricing, add-ons, live URL, and client notes, then moves this record back to proposal.',
      confirmLabel: 'Clear client details',
      onConfirm: async () => {
        closeConfirmDialog()
        const result = await clearClientDetails(prospect.id)
        if (!result.error) toast.success('Client details cleared')
        else toast.error(result.error.message || 'Unable to clear client details')
      },
    })
  }

  function handleDeleteProspect() {
    openConfirmDialog({
      title: 'Delete prospect?',
      message: 'This permanently deletes this prospect and its saved notes, activities, research, demo fields, and client details from the OS. GitHub Pages demo files are not deleted yet.',
      confirmLabel: 'Delete prospect',
      requireText: prospect.business_name,
      onConfirm: async () => {
        closeConfirmDialog()
        const result = await deleteProspect(prospect.id)
        if (!result.error) {
          toast.success('Prospect deleted')
          navigate('/prospects')
        } else {
          toast.error(result.error.message || 'Unable to delete prospect')
        }
      },
    })
  }

  return (
    <div className="page-stack prospect-workspace-page">
      <header className="page-header workspace-page-header">
        <div>
          <button className="back-link button-link" type="button" onClick={handleBackToProspects}><ArrowLeft size={16} /> Back to prospects</button>
          <p className="eyebrow">Prospect Workspace</p>
          <h1>{prospect.business_name}</h1>
          <div className="workspace-meta-row">
            <span>{prospect.category || 'No category yet'}</span>
            <span>{labelFor(prospectStatuses, prospect.status)}</span>
            <span>{prospect.next_follow_up ? `Follow up ${prospect.next_follow_up}` : 'No follow-up set'}</span>
          </div>
          <p className="muted-text">Route: /prospects/{slugForProspect(prospect)}</p>
        </div>
        <div className="workspace-header-pills">
          {hasUnsavedChanges && <span className="unsaved-pill">Unsaved changes</span>}
          {saved && <span className="save-pill"><Save size={15} /> Saved</span>}
        </div>
      </header>

      <div className="workspace-stage-strip">
        {['research', 'contacted', 'demo_ready', 'proposal', 'won'].map((stage) => (
          <span key={stage} className={prospect.status === stage ? 'workspace-stage active' : 'workspace-stage'}>
            {labelFor(prospectStatuses, stage)}
          </span>
        ))}
      </div>

      <div className="prospect-workspace-layout">
        <section className="panel workspace-panel overview-panel">
          <div className="workspace-panel-header-static split-header">
            <div className="panel-title-row">
              <span className="workspace-section-icon"><UserRound size={18} /></span>
              <div>
                <h2>Overview</h2>
                <p>Core prospect details, pipeline stage, follow-up, and main notes.</p>
              </div>
            </div>
            <button className="secondary-button" type="button" onClick={handleImportOverviewFromGooglePlaces} disabled={importingBusiness}>
              <Sparkles size={16} /> {importingBusiness ? 'Importing...' : 'Import from Google'}
            </button>
          </div>
          <div className="form-grid compact workspace-form-grid">
            <div className="overview-subsection span-2">
              <h3>Business information</h3>
              <p>Basic details used for outreach, demo generation, and follow-up context.</p>
            </div>
            <label>Owner<input value={overviewDraft.owner_name || ''} onChange={(e) => updateOverviewDraft('owner_name', e.target.value)} /></label>
            <label>Category<input value={overviewDraft.category || ''} onChange={(e) => updateOverviewDraft('category', e.target.value)} /></label>
            <label>Status<select value={overviewDraft.status || 'research'} onChange={(e) => updateOverviewDraft('status', e.target.value)}>{prospectStatuses.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}</select></label>
            <label>Next follow-up<input type="date" value={overviewDraft.next_follow_up || ''} onChange={(e) => updateOverviewDraft('next_follow_up', e.target.value)} /></label>

            <div className="overview-subsection span-2">
              <h3>Location</h3>
              <p>Add the business address for local context, Google Maps lookup, and AI-generated demo copy.</p>
            </div>
            <label className="span-2 social-field">
              <span className="field-label-row"><MapPin size={15} /> Business address</span>
              <span className="social-input-row">
                <input value={overviewDraft.address || ''} onChange={(e) => updateOverviewDraft('address', e.target.value)} placeholder="Street address, city, state" />
                {mapsUrl(overviewDraft.address) && <a className="inline-visit-button" href={mapsUrl(overviewDraft.address)} target="_blank" rel="noreferrer"><ExternalLink size={14} /> Maps</a>}
              </span>
            </label>
            {(overviewDraft.google_rating || overviewDraft.google_maps_url) && (
              <div className="google-import-summary span-2">
                <div>
                  <strong>Google Places details imported</strong>
                  <p>{overviewDraft.google_rating ? `★ ${overviewDraft.google_rating} from ${overviewDraft.google_review_count || 0} reviews` : 'Saved Google business profile details.'}</p>
                </div>
                {overviewDraft.google_maps_url && <a className="inline-visit-button" href={overviewDraft.google_maps_url} target="_blank" rel="noreferrer"><ExternalLink size={14} /> Google profile</a>}
              </div>
            )}

            <div className="overview-subsection span-2">
              <h3>Contact & online presence</h3>
              <p>Add the links you use for research, demo inspiration, and client outreach.</p>
            </div>
            <label>Phone<input value={overviewDraft.phone || ''} onChange={(e) => updateOverviewDraft('phone', e.target.value)} /></label>
            <label>Email<input value={overviewDraft.email || ''} onChange={(e) => updateOverviewDraft('email', e.target.value)} /></label>
            <SocialField label="Website" field="website" icon={Globe2} placeholder="https://business.com" />
            <SocialField label="Instagram" field="instagram" icon={InstagramMark} placeholder="https://instagram.com/business" />
            <SocialField label="Facebook" field="facebook" icon={FacebookMark} placeholder="https://facebook.com/business" />
            <label className="span-2">Main notes<textarea value={overviewDraft.notes || ''} onChange={(e) => updateOverviewDraft('notes', e.target.value)} /></label>
            <div className="workspace-card-footer span-2">
              {overviewDirty && <button className="secondary-button" type="button" onClick={() => discardSection('overview')}>Discard changes</button>}
              <button className="primary-button" type="button" onClick={saveOverviewChanges} disabled={!overviewDirty}>Save changes</button>
            </div>
          </div>
        </section>

        <section className="panel collapsible-panel workspace-panel">
          <CollapsibleHeader section="demoTracker" title="Demo tracker" icon={Sparkles} description="Track preview URLs, publishing status, and demo follow-up actions." />
          {!collapsedSections.demoTracker && (
          <div className="workspace-section-body demo-tracker-grid">
            <div className="form-stack">
              <button className="primary-button full-width" type="button" onClick={() => guardedNavigate('/demo-builder')}>Open Demo Builder</button>
              <label>Demo status<select value={demoDraft.demo_status || 'not_started'} onChange={(e) => updateDemoDraft('demo_status', e.target.value)}>{demoStatuses.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}</select></label>
              <label>Preview URL<input value={demoDraft.preview_url || ''} onChange={(e) => updateDemoDraft('preview_url', e.target.value)} placeholder="https://demo.netlify.app" /></label>
            </div>
            <div className="workspace-action-card">
              <h3>Demo actions</h3>
              <p>Use these after generating or manually adding a preview URL.</p>
              <div className="workspace-card-footer stacked">
                {demoDraft.preview_url && <a className="secondary-button full-width" href={externalUrl(demoDraft.preview_url)} target="_blank" rel="noreferrer"><ExternalLink size={16} /> Open preview</a>}
                <button className="primary-button full-width" type="button" onClick={() => markDemoReady(prospect.id, demoDraft.preview_url).then((result) => result.error ? toast.error(result.error.message || 'Unable to mark demo ready') : toast.success('Demo marked ready'))}>Mark Demo Ready</button>
                <button className="secondary-button full-width" type="button" onClick={() => markDemoSent(prospect.id).then((result) => result.error ? toast.error(result.error.message || 'Unable to mark demo sent') : toast.success('Demo marked sent'))}>Mark Sent + Follow Up</button>
                {demoDirty && <button className="secondary-button full-width" type="button" onClick={() => discardSection('demo')}>Discard unsaved demo changes</button>}
                <button className="primary-button full-width" type="button" onClick={() => saveDemoChanges()} disabled={!demoDirty}>Save demo tracker</button>
                <button className="danger-button full-width" type="button" onClick={handleClearDemo}><RotateCcw size={16} /> Clear demo fields</button>
              </div>
            </div>
          </div>
          )}
        </section>


        <div className="workspace-card-pair">
          <section className="panel collapsible-panel workspace-panel equal-panel">
            <CollapsibleHeader section="clientDetails" title="Client details" icon={BriefcaseBusiness} description="Package, pricing, live URL, and client notes." />
            {!collapsedSections.clientDetails && (
            <div className="workspace-section-body form-stack">
              {prospect.status !== 'won' && (
                <button className="primary-button full-width" type="button" onClick={() => convertToClient(prospect.id).then((result) => result.error ? toast.error(result.error.message || 'Unable to convert client') : toast.success('Converted to client'))}>
                  <BriefcaseBusiness size={16} /> Convert to Client
                </button>
              )}
              <label>Package
                <select value={clientDraft.package_type || ''} onChange={(e) => updateClientDraft('package_type', e.target.value)}>
                  <option value="">Select package</option>
                  <option value="Website, Handled">Website, Handled</option>
                  <option value="Build & Own">Build & Own</option>
                  <option value="Care Plan">Care Plan</option>
                </select>
              </label>
              <div className="workspace-mini-grid">
                <label>Monthly price<input type="number" min="0" value={clientDraft.monthly_price ?? ''} onChange={(e) => updateClientDraft('monthly_price', e.target.value)} placeholder="99" /></label>
                <label>Setup fee<input type="number" min="0" value={clientDraft.setup_fee ?? ''} onChange={(e) => updateClientDraft('setup_fee', e.target.value)} placeholder="99" /></label>
              </div>
              <label>Add-ons<input value={clientDraft.add_ons || ''} onChange={(e) => updateClientDraft('add_ons', e.target.value)} placeholder="Booking, contact form, online store" /></label>
              <label>Live URL<input value={clientDraft.live_url || ''} onChange={(e) => updateClientDraft('live_url', e.target.value)} placeholder="https://clientsite.com" /></label>
              <label>Client notes<textarea value={clientDraft.client_notes || ''} onChange={(e) => updateClientDraft('client_notes', e.target.value)} placeholder="Billing notes, launch notes, cancellation notes..." /></label>
              <div className="workspace-card-footer">
                {clientDirty && <button className="secondary-button" type="button" onClick={() => discardSection('client')}>Discard changes</button>}
                <button className="primary-button" type="button" onClick={saveClientDetails} disabled={!clientDirty}>Save client details</button>
                {(prospect.converted_at || prospect.status === 'won') && <button className="danger-button" type="button" onClick={handleClearClientDetails}><RotateCcw size={16} /> Clear client details</button>}
              </div>
            </div>
            )}
          </section>

          <section className="panel collapsible-panel workspace-panel equal-panel">
            <CollapsibleHeader section="proposal" title="Proposal" icon={FileText} description="Draft, send, and follow up on your proposal." />
            {!collapsedSections.proposal && (
            <div className="workspace-section-body form-stack">
              <button className="primary-button full-width" type="button" onClick={() => guardedNavigate('/proposals')}><FileText size={16} /> Open Proposal Center</button>
              <label>Proposal status
                <select value={proposalDraft.proposal_status || 'not_started'} onChange={(e) => updateProposalDraft('proposal_status', e.target.value)}>
                  <option value="not_started">Not started</option>
                  <option value="drafted">Drafted</option>
                  <option value="sent">Sent</option>
                  <option value="accepted">Accepted</option>
                  <option value="declined">Declined</option>
                </select>
              </label>
              <div className="workspace-proposal-summary">
                <span>Suggested offer</span>
                <strong>Website, Handled · $99/mo</strong>
                <p>Use this section to keep proposal status separate from client conversion details.</p>
              </div>
              <div className="workspace-card-footer stacked">
                {proposalDirty && <button className="secondary-button full-width" type="button" onClick={() => discardSection('proposal')}>Discard proposal changes</button>}
                <button className="primary-button full-width" type="button" onClick={saveProposalChanges} disabled={!proposalDirty}>Save proposal status</button>
                <button className="secondary-button full-width" type="button" onClick={() => generateProposal(prospect.id).then((result) => result.error ? toast.error(result.error.message || 'Unable to generate proposal') : toast.success('Proposal generated'))}><FileText size={16} /> Generate Proposal</button>
                <button className="secondary-button full-width" type="button" onClick={() => markProposalSent(prospect.id).then((result) => result.error ? toast.error(result.error.message || 'Unable to mark proposal sent') : toast.success('Proposal marked sent'))}><Send size={16} /> Mark Sent + Follow Up</button>
              </div>
            </div>
            )}
          </section>
        </div>

        <section className="panel collapsible-panel workspace-panel">
          <CollapsibleHeader section="activityNotes" title="Activity & notes" icon={MessageSquareText} description="Log calls, DMs, emails, meetings, and follow-up notes." />
          {!collapsedSections.activityNotes && (
          <div className="workspace-section-body">
            <form className="activity-form workspace-activity-form" onSubmit={handleActivity}>
              <select value={activityType} onChange={(e) => setActivityType(e.target.value)}>
                {['Note', 'Call', 'Email', 'DM', 'Meeting', 'Demo'].map((type) => <option key={type}>{type}</option>)}
              </select>
              <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a quick note..." />
              {activityDirty && <button className="secondary-button" type="button" onClick={() => discardSection('activity')}>Discard</button>}
              <button className="primary-button" type="submit">Add Note</button>
            </form>

            {prospectActivities.length > 0 && (
              <div className="section-actions">
                <button className="danger-button" type="button" onClick={handleDeleteAllNotes}>
                  <Trash2 size={16} /> Delete all notes
                </button>
              </div>
            )}

            <div className="timeline workspace-timeline">
              {prospectActivities.length === 0 ? <p>No activity yet.</p> : prospectActivities.map((activity) => (
                <article className="timeline-item" key={activity.id}>
                  <div>
                    <strong>{activity.type}</strong>
                    <span>{new Date(activity.created_at).toLocaleString()}</span>
                    <button className="icon-danger-button" type="button" onClick={() => handleDeleteActivity(activity)} aria-label={`Delete ${activity.type} activity`}><Trash2 size={15} /></button>
                  </div>
                  <p>{activity.note}</p>
                </article>
              ))}
            </div>
          </div>
          )}
        </section>

        <section className="panel danger-zone workspace-danger-zone">
          <div className="workspace-panel-header-static">
            <span className="workspace-section-icon danger"><AlertTriangle size={18} /></span>
            <div>
              <p className="eyebrow">Danger zone</p>
              <h2>Delete prospect</h2>
              <p>Deletes this prospect and its saved activities/research from the OS. GitHub Pages demo files are not deleted yet.</p>
            </div>
          </div>
          <button className="danger-button" type="button" onClick={handleDeleteProspect}><Trash2 size={16} /> Delete prospect</button>
        </section>
      </div>
      <ConfirmDialog
        open={Boolean(confirmDialog)}
        title={confirmDialog?.title}
        message={confirmDialog?.message}
        confirmLabel={confirmDialog?.confirmLabel}
        requireText={confirmDialog?.requireText}
        tone="danger"
        onCancel={closeConfirmDialog}
        onConfirm={confirmDialog?.onConfirm}
      />
      <ConfirmDialog
        open={Boolean(unsavedDialog)}
        title={unsavedDialog?.title}
        message={unsavedDialog?.message}
        confirmLabel={unsavedDialog?.confirmLabel || 'Discard changes'}
        cancelLabel="Keep editing"
        tone="danger"
        onCancel={closeUnsavedDialog}
        onConfirm={unsavedDialog?.onConfirm}
      />
    </div>
  )
}
