import { Link, Navigate, useParams } from 'react-router-dom'
import { ArrowLeft, BriefcaseBusiness, ExternalLink, Save } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useProspects } from './ProspectsContext'
import { demoStatuses, labelFor, prospectStatuses } from './prospectOptions'

export function ProspectWorkspacePage() {
  const { id } = useParams()
  const { prospects, activities, updateProspect, addActivity, markDemoReady, markDemoSent, convertToClient } = useProspects()
  const prospect = prospects.find((item) => item.id === id)
  const [note, setNote] = useState('')
  const [activityType, setActivityType] = useState('Note')
  const [saved, setSaved] = useState(false)

  const prospectActivities = useMemo(() => activities.filter((activity) => activity.prospect_id === id), [activities, id])

  if (!prospect) return <Navigate to="/prospects" replace />

  async function patch(values) {
    setSaved(false)
    const result = await updateProspect(prospect.id, values)
    if (!result.error) {
      setSaved(true)
      window.setTimeout(() => setSaved(false), 1200)
    }
  }

  async function handleActivity(event) {
    event.preventDefault()
    if (!note.trim()) return
    const result = await addActivity(prospect.id, { type: activityType, note })
    if (!result.error) setNote('')
  }

  return (
    <div className="page-stack">
      <header className="page-header">
        <div>
          <Link className="back-link" to="/prospects"><ArrowLeft size={16} /> Back to prospects</Link>
          <p className="eyebrow">Prospect Workspace</p>
          <h1>{prospect.business_name}</h1>
          <p>{prospect.category || 'No category yet'} · {labelFor(prospectStatuses, prospect.status)}</p>
        </div>
        {saved && <span className="save-pill"><Save size={15} /> Saved</span>}
      </header>

      <div className="workspace-grid">
        <section className="panel">
          <h2>Overview</h2>
          <div className="form-grid compact">
            <label>Owner<input value={prospect.owner_name || ''} onChange={(e) => patch({ owner_name: e.target.value })} /></label>
            <label>Category<input value={prospect.category || ''} onChange={(e) => patch({ category: e.target.value })} /></label>
            <label>Phone<input value={prospect.phone || ''} onChange={(e) => patch({ phone: e.target.value })} /></label>
            <label>Email<input value={prospect.email || ''} onChange={(e) => patch({ email: e.target.value })} /></label>
            <label>Website<input value={prospect.website || ''} onChange={(e) => patch({ website: e.target.value })} /></label>
            <label>Instagram<input value={prospect.instagram || ''} onChange={(e) => patch({ instagram: e.target.value })} /></label>
            <label>Status<select value={prospect.status || 'research'} onChange={(e) => patch({ status: e.target.value, converted_at: e.target.value === 'won' && !prospect.converted_at ? new Date().toISOString() : prospect.converted_at })}>{prospectStatuses.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}</select></label>
            <label>Next follow-up<input type="date" value={prospect.next_follow_up || ''} onChange={(e) => patch({ next_follow_up: e.target.value || null })} /></label>
            <label className="span-2">Main notes<textarea value={prospect.notes || ''} onChange={(e) => patch({ notes: e.target.value })} /></label>
          </div>
        </section>

        <section className="panel">
          <h2>Client details</h2>
          <div className="form-stack">
            {prospect.status !== 'won' && (
              <button className="primary-button full-width" type="button" onClick={() => convertToClient(prospect.id)}>
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
            <label>Client notes<textarea value={prospect.client_notes || ''} onChange={(e) => patch({ client_notes: e.target.value })} placeholder="Billing notes, launch notes, cancellation notes..." /></label>
          </div>
        </section>

        <section className="panel">
          <h2>Demo tracker</h2>
          <div className="form-stack">
            <Link className="primary-button full-width" to="/demo-builder">Open Demo Builder</Link>
            <label>Demo status<select value={prospect.demo_status || 'not_started'} onChange={(e) => patch({ demo_status: e.target.value })}>{demoStatuses.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}</select></label>
            <label>Preview URL<input value={prospect.preview_url || ''} onChange={(e) => patch({ preview_url: e.target.value })} placeholder="https://demo.netlify.app" /></label>
            {prospect.preview_url && <a className="secondary-button full-width" href={prospect.preview_url} target="_blank" rel="noreferrer"><ExternalLink size={16} /> Open preview</a>}
            <button className="primary-button full-width" type="button" onClick={() => markDemoReady(prospect.id, prospect.preview_url)}>Mark Demo Ready</button>
            <button className="secondary-button full-width" type="button" onClick={() => markDemoSent(prospect.id)}>Mark Sent + Follow Up</button>
          </div>
        </section>
      </div>

      <section className="panel">
        <h2>Activity & notes</h2>
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
      </section>
    </div>
  )
}
