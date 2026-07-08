import { Link, Navigate, useParams } from 'react-router-dom'
import { ArrowLeft, BriefcaseBusiness, ChevronDown, ExternalLink, FileText, Save, Send } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { slugify, useProspects } from './ProspectsContext'
import { demoStatuses, labelFor, prospectStatuses } from './prospectOptions'

export function ProspectWorkspacePage() {
  const { slug } = useParams()
  const { prospects, activities, updateProspect, addActivity, markDemoReady, markDemoSent, convertToClient, generateProposal, markProposalSent, slugForProspect } = useProspects()
  const prospect = prospects.find((item) => item.id === slug || item.slug === slug || slugify(item.business_name) === slug)
  const [note, setNote] = useState('')
  const [activityType, setActivityType] = useState('Note')
  const [saved, setSaved] = useState(false)
  const [overviewDraft, setOverviewDraft] = useState({})
  const [clientNotesDraft, setClientNotesDraft] = useState('')
  const [collapsedSections, setCollapsedSections] = useState({
    clientDetails: false,
    proposal: false,
    demoTracker: false,
    activityNotes: false,
  })

  const prospectActivities = useMemo(() => activities.filter((activity) => activity.prospect_id === prospect?.id), [activities, prospect?.id])

  useEffect(() => {
    setOverviewDraft({
      owner_name: prospect?.owner_name || '',
      category: prospect?.category || '',
      phone: prospect?.phone || '',
      email: prospect?.email || '',
      website: prospect?.website || '',
      instagram: prospect?.instagram || '',
      status: prospect?.status || 'research',
      next_follow_up: prospect?.next_follow_up || '',
      notes: prospect?.notes || '',
    })
    setClientNotesDraft(prospect?.client_notes || '')
  }, [prospect?.id])

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

  function toggleSection(section) {
    setCollapsedSections((current) => ({ ...current, [section]: !current[section] }))
  }

  function CollapsibleHeader({ section, title }) {
    const isCollapsed = collapsedSections[section]
    return (
      <button
        className="collapsible-panel-header"
        type="button"
        onClick={() => toggleSection(section)}
        aria-expanded={!isCollapsed}
      >
        <h2>{title}</h2>
        <ChevronDown className={isCollapsed ? 'chevron collapsed' : 'chevron'} size={18} />
      </button>
    )
  }

  async function saveOverviewChanges() {
    const result = await patch({
      owner_name: overviewDraft.owner_name || null,
      category: overviewDraft.category || null,
      phone: overviewDraft.phone || null,
      email: overviewDraft.email || null,
      website: overviewDraft.website || null,
      instagram: overviewDraft.instagram || null,
      status: overviewDraft.status || 'research',
      converted_at: overviewDraft.status === 'won' && !prospect.converted_at ? new Date().toISOString() : prospect.converted_at,
      next_follow_up: overviewDraft.next_follow_up || null,
      notes: overviewDraft.notes || null,
    })
    if (!result?.error) toast.success('Changes saved')
    else toast.error(result.error.message || 'Unable to save changes')
  }

  async function saveClientNotes() {
    if ((prospect.client_notes || '') === clientNotesDraft) return
    const result = await patch({ client_notes: clientNotesDraft })
    if (!result?.error) toast.success('Client notes saved')
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

  return (
    <div className="page-stack">
      <header className="page-header">
        <div>
          <Link className="back-link" to="/prospects"><ArrowLeft size={16} /> Back to prospects</Link>
          <p className="eyebrow">Prospect Workspace</p>
          <h1>{prospect.business_name}</h1>
          <p>{prospect.category || 'No category yet'} · {labelFor(prospectStatuses, prospect.status)}</p>
          <p className="muted-text">Route: /prospects/{slugForProspect(prospect)}</p>
        </div>
        {saved && <span className="save-pill"><Save size={15} /> Saved</span>}
      </header>

      <div className="workspace-grid">
        <section className="panel">
          <h2>Overview</h2>
          <div className="form-grid compact">
            <label>Owner<input value={overviewDraft.owner_name || ''} onChange={(e) => updateOverviewDraft('owner_name', e.target.value)} /></label>
            <label>Category<input value={overviewDraft.category || ''} onChange={(e) => updateOverviewDraft('category', e.target.value)} /></label>
            <label>Phone<input value={overviewDraft.phone || ''} onChange={(e) => updateOverviewDraft('phone', e.target.value)} /></label>
            <label>Email<input value={overviewDraft.email || ''} onChange={(e) => updateOverviewDraft('email', e.target.value)} /></label>
            <label>Website<input value={overviewDraft.website || ''} onChange={(e) => updateOverviewDraft('website', e.target.value)} /></label>
            <label>Instagram<input value={overviewDraft.instagram || ''} onChange={(e) => updateOverviewDraft('instagram', e.target.value)} /></label>
            <label>Status<select value={overviewDraft.status || 'research'} onChange={(e) => updateOverviewDraft('status', e.target.value)}>{prospectStatuses.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}</select></label>
            <label>Next follow-up<input type="date" value={overviewDraft.next_follow_up || ''} onChange={(e) => updateOverviewDraft('next_follow_up', e.target.value)} /></label>
            <label className="span-2">Main notes<textarea value={overviewDraft.notes || ''} onChange={(e) => updateOverviewDraft('notes', e.target.value)} /></label>
            <div className="form-actions span-2"><button className="primary-button" type="button" onClick={saveOverviewChanges}>Save changes</button></div>
          </div>
        </section>

        <section className="panel collapsible-panel">
          <CollapsibleHeader section="clientDetails" title="Client details" />
          {!collapsedSections.clientDetails && (
          <div className="form-stack">
            {prospect.status !== 'won' && (
              <button className="primary-button full-width" type="button" onClick={() => convertToClient(prospect.id).then((result) => result.error ? toast.error(result.error.message || 'Unable to convert client') : toast.success('Converted to client'))}>
                <BriefcaseBusiness size={16} /> Convert to Client
              </button>
            )}
            <label>Package
              <select value={prospect.package_type || ''} onChange={(e) => patch({ package_type: e.target.value })}>
                <option value="">Select package</option>
                <option value="Website, Handled">Website, Handled</option>
                <option value="Build & Own">Build & Own</option>
                <option value="Care Plan">Care Plan</option>
              </select>
            </label>
            <label>Monthly price<input type="number" min="0" value={prospect.monthly_price ?? ''} onChange={(e) => patch({ monthly_price: e.target.value === '' ? null : Number(e.target.value) })} placeholder="99" /></label>
            <label>Setup fee<input type="number" min="0" value={prospect.setup_fee ?? ''} onChange={(e) => patch({ setup_fee: e.target.value === '' ? null : Number(e.target.value) })} placeholder="99" /></label>
            <label>Add-ons<input value={prospect.add_ons || ''} onChange={(e) => patch({ add_ons: e.target.value })} placeholder="Booking, contact form, online store" /></label>
            <label>Live URL<input value={prospect.live_url || ''} onChange={(e) => patch({ live_url: e.target.value })} placeholder="https://clientsite.com" /></label>
            <label>Client notes<textarea value={clientNotesDraft} onChange={(e) => setClientNotesDraft(e.target.value)} onBlur={saveClientNotes} placeholder="Billing notes, launch notes, cancellation notes..." /></label>
            <button className="secondary-button full-width" type="button" onClick={saveClientNotes}>Save Client Notes</button>
          </div>
          )}
        </section>


        <section className="panel collapsible-panel">
          <CollapsibleHeader section="proposal" title="Proposal" />
          {!collapsedSections.proposal && (
          <div className="form-stack">
            <Link className="primary-button full-width" to="/proposals"><FileText size={16} /> Open Proposal Center</Link>
            <label>Proposal status
              <select value={prospect.proposal_status || 'not_started'} onChange={(e) => patch({ proposal_status: e.target.value })}>
                <option value="not_started">Not started</option>
                <option value="drafted">Drafted</option>
                <option value="sent">Sent</option>
                <option value="accepted">Accepted</option>
                <option value="declined">Declined</option>
              </select>
            </label>
            <button className="secondary-button full-width" type="button" onClick={() => generateProposal(prospect.id).then((result) => result.error ? toast.error(result.error.message || 'Unable to generate proposal') : toast.success('Proposal generated'))}><FileText size={16} /> Generate Proposal</button>
            <button className="secondary-button full-width" type="button" onClick={() => markProposalSent(prospect.id).then((result) => result.error ? toast.error(result.error.message || 'Unable to mark proposal sent') : toast.success('Proposal marked sent'))}><Send size={16} /> Mark Sent + Follow Up</button>
          </div>
          )}
        </section>

        <section className="panel collapsible-panel">
          <CollapsibleHeader section="demoTracker" title="Demo tracker" />
          {!collapsedSections.demoTracker && (
          <div className="form-stack">
            <Link className="primary-button full-width" to="/demo-builder">Open Demo Builder</Link>
            <label>Demo status<select value={prospect.demo_status || 'not_started'} onChange={(e) => patch({ demo_status: e.target.value })}>{demoStatuses.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}</select></label>
            <label>Preview URL<input value={prospect.preview_url || ''} onChange={(e) => patch({ preview_url: e.target.value })} placeholder="https://demo.netlify.app" /></label>
            {prospect.preview_url && <a className="secondary-button full-width" href={prospect.preview_url} target="_blank" rel="noreferrer"><ExternalLink size={16} /> Open preview</a>}
            <button className="primary-button full-width" type="button" onClick={() => markDemoReady(prospect.id, prospect.preview_url).then((result) => result.error ? toast.error(result.error.message || 'Unable to mark demo ready') : toast.success('Demo marked ready'))}>Mark Demo Ready</button>
            <button className="secondary-button full-width" type="button" onClick={() => markDemoSent(prospect.id).then((result) => result.error ? toast.error(result.error.message || 'Unable to mark demo sent') : toast.success('Demo marked sent'))}>Mark Sent + Follow Up</button>
          </div>
          )}
        </section>
      </div>

      <section className="panel collapsible-panel">
        <CollapsibleHeader section="activityNotes" title="Activity & notes" />
        {!collapsedSections.activityNotes && (
        <>
        <form className="activity-form" onSubmit={handleActivity}>
          <select value={activityType} onChange={(e) => setActivityType(e.target.value)}>
            {['Note', 'Call', 'Email', 'DM', 'Meeting', 'Demo'].map((type) => <option key={type}>{type}</option>)}
          </select>
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a quick note..." />
          <button className="primary-button" type="submit">Add Note</button>
        </form>

        <div className="timeline">
          {prospectActivities.length === 0 ? <p>No activity yet.</p> : prospectActivities.map((activity) => (
            <article className="timeline-item" key={activity.id}>
              <div><strong>{activity.type}</strong><span>{new Date(activity.created_at).toLocaleString()}</span></div>
              <p>{activity.note}</p>
            </article>
          ))}
        </div>
        </>
        )}
      </section>
    </div>
  )
}
