import { Link } from 'react-router-dom'
import { Plus, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { useProspects } from './ProspectsContext'
import { demoStatuses, labelFor, prospectStatuses } from './prospectOptions'

const emptyForm = {
  business_name: '', owner_name: '', category: '', phone: '', email: '', website: '', instagram: '', status: 'research', demo_status: 'not_started', preview_url: '', next_follow_up: '', notes: '',
}

export function ProspectsPage() {
  const { prospects, createProspect, loading, error, slugForProspect } = useProspects()
  const [query, setQuery] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)

  const filtered = useMemo(() => {
    const q = query.toLowerCase()
    return prospects.filter((prospect) => [prospect.business_name, prospect.owner_name, prospect.category, prospect.instagram].join(' ').toLowerCase().includes(q))
  }, [prospects, query])

  async function handleSubmit(event) {
    event.preventDefault()
    const result = await createProspect(form)
    if (!result.error) {
      setForm(emptyForm)
      setShowForm(false)
      toast.success('Prospect created')
    } else {
      toast.error(result.error.message || 'Unable to create prospect')
    }
  }

  return (
    <div className="page-stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">Prospects</p>
          <h1>Your lead list</h1>
          <p>Add businesses, track their demo status, and keep the next follow-up visible.</p>
        </div>
        <button className="primary-button" type="button" onClick={() => setShowForm((value) => !value)}><Plus size={18} /> Add Prospect</button>
      </header>

      {error && <div className="error">{error}</div>}

      {showForm && (
        <section className="panel">
          <h2>Add a prospect</h2>
          <form className="form-grid" onSubmit={handleSubmit}>
            <label>Business name<input required value={form.business_name} onChange={(e) => setForm({ ...form, business_name: e.target.value })} /></label>
            <label>Owner name<input value={form.owner_name} onChange={(e) => setForm({ ...form, owner_name: e.target.value })} /></label>
            <label>Category<input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Auto detailer, cafe, tint shop" /></label>
            <label>Instagram<input value={form.instagram} onChange={(e) => setForm({ ...form, instagram: e.target.value })} /></label>
            <label>Phone<input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></label>
            <label>Email<input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
            <label>Status<select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>{prospectStatuses.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}</select></label>
            <label>Next follow-up<input type="date" value={form.next_follow_up ?? ''} onChange={(e) => setForm({ ...form, next_follow_up: e.target.value })} /></label>
            <label className="span-2">Notes<textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Why this business is a good fit..." /></label>
            <div className="form-actions span-2"><button className="secondary-button" type="button" onClick={() => setShowForm(false)}>Cancel</button><button className="primary-button" type="submit">Save Prospect</button></div>
          </form>
        </section>
      )}

      <section className="panel">
        <div className="toolbar">
          <div className="search-box"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search prospects..." /></div>
          <span>{filtered.length} prospects</span>
        </div>

        {loading ? <p>Loading prospects…</p> : filtered.length === 0 ? (
          <div className="empty-state"><h2>No prospects yet</h2><p>Add your first business to start the demo-first workflow.</p></div>
        ) : (
          <div className="table-list">
            {filtered.map((prospect) => (
              <Link className="prospect-row" to={`/prospects/${slugForProspect(prospect)}`} key={prospect.id}>
                <div><strong>{prospect.business_name}</strong><span>{prospect.category || prospect.owner_name || 'No category yet'}</span></div>
                <span className="badge">{labelFor(prospectStatuses, prospect.status)}</span>
                <span className="badge muted">Demo: {labelFor(demoStatuses, prospect.demo_status)}</span>
                <span>{prospect.next_follow_up ? `Follow up ${prospect.next_follow_up}` : 'No follow-up set'}</span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
