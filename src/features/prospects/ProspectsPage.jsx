import { Link } from 'react-router-dom'
import { FilterX, Plus, Search, Sparkles } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { useProspects } from './ProspectsContext'
import { demoStatuses, labelFor, prospectStatuses } from './prospectOptions'

const createEmptyForm = () => ({
  business_name: '', owner_name: '', category: '', phone: '', email: '', address: '', website: '', instagram: '', facebook: '', google_place_id: '', google_maps_url: '', google_rating: null, google_review_count: null, google_types: [], google_opening_hours: [], google_imported_at: null, status: 'research', demo_status: 'not_started', preview_url: '', next_follow_up: '', notes: '',
})

function hasProspectFormChanges(form) {
  return JSON.stringify(form) !== JSON.stringify(createEmptyForm())
}

export function ProspectsPage() {
  const { prospects, createProspect, importBusinessFromGooglePlaces, loading, error, slugForProspect } = useProspects()
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [demoStatusFilter, setDemoStatusFilter] = useState('all')
  const [followUpFilter, setFollowUpFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [previewFilter, setPreviewFilter] = useState('all')
  const [websiteFilter, setWebsiteFilter] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(createEmptyForm)
  const [importing, setImporting] = useState(false)
  const [showDiscardDialog, setShowDiscardDialog] = useState(false)
  const businessNameRef = useRef(null)
  const formHasChanges = hasProspectFormChanges(form)


  useEffect(() => {
    if (!showForm) return

    const focusTimer = window.setTimeout(() => {
      businessNameRef.current?.focus()
    }, 50)

    return () => window.clearTimeout(focusTimer)
  }, [showForm])

  useEffect(() => {
    if (!showForm) return

    function handleKeyDown(event) {
      if (event.key !== 'Escape') return
      event.preventDefault()
      handleCancelAddProspect()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showForm, formHasChanges])

  function resetAddProspectForm() {
    setForm(createEmptyForm())
    setImporting(false)
    setShowDiscardDialog(false)
  }

  function openAddProspectForm() {
    resetAddProspectForm()
    setShowForm(true)
  }

  function closeAddProspectForm() {
    resetAddProspectForm()
    setShowForm(false)
  }

  function handleCancelAddProspect() {
    if (formHasChanges) {
      setShowDiscardDialog(true)
      return
    }

    closeAddProspectForm()
  }

  function handleDiscardAddProspect() {
    closeAddProspectForm()
  }

  const todayKey = new Date().toISOString().slice(0, 10)

  const categoryOptions = useMemo(() => {
    const categories = prospects
      .map((prospect) => prospect.category?.trim())
      .filter(Boolean)
      .filter((category, index, all) => all.findIndex((item) => item.toLowerCase() === category.toLowerCase()) === index)
      .sort((a, b) => a.localeCompare(b))

    return categories
  }, [prospects])

  const hasActiveFilters = Boolean(
    query ||
    statusFilter !== 'all' ||
    demoStatusFilter !== 'all' ||
    followUpFilter !== 'all' ||
    categoryFilter !== 'all' ||
    previewFilter !== 'all' ||
    websiteFilter !== 'all'
  )

  function clearFilters() {
    setQuery('')
    setStatusFilter('all')
    setDemoStatusFilter('all')
    setFollowUpFilter('all')
    setCategoryFilter('all')
    setPreviewFilter('all')
    setWebsiteFilter('all')
  }

  function matchesFollowUpFilter(prospect) {
    const followUp = prospect.next_follow_up

    if (followUpFilter === 'all') return true
    if (followUpFilter === 'none') return !followUp
    if (!followUp) return false
    if (followUpFilter === 'overdue') return followUp < todayKey
    if (followUpFilter === 'today') return followUp === todayKey
    if (followUpFilter === 'upcoming') return followUp > todayKey

    return true
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()

    return prospects.filter((prospect) => {
      const searchable = [
        prospect.business_name,
        prospect.owner_name,
        prospect.category,
        prospect.address,
        prospect.instagram,
        prospect.facebook,
        prospect.website,
        prospect.phone,
        prospect.email,
      ].join(' ').toLowerCase()

      const matchesSearch = !q || searchable.includes(q)
      const matchesStatus = statusFilter === 'all' || prospect.status === statusFilter
      const matchesDemoStatus = demoStatusFilter === 'all' || prospect.demo_status === demoStatusFilter
      const matchesCategory = categoryFilter === 'all' || prospect.category?.toLowerCase() === categoryFilter.toLowerCase()
      const matchesPreview = previewFilter === 'all' || (previewFilter === 'yes' ? Boolean(prospect.preview_url) : !prospect.preview_url)
      const matchesWebsite = websiteFilter === 'all' || (websiteFilter === 'yes' ? Boolean(prospect.website) : !prospect.website)

      return matchesSearch && matchesStatus && matchesDemoStatus && matchesCategory && matchesFollowUpFilter(prospect) && matchesPreview && matchesWebsite
    })
  }, [prospects, query, statusFilter, demoStatusFilter, categoryFilter, followUpFilter, previewFilter, websiteFilter, todayKey])


  async function handleImportFromGooglePlaces() {
    if (!form.business_name.trim() && !form.address.trim()) {
      toast.error('Enter a business name or address first')
      return
    }

    setImporting(true)
    const result = await importBusinessFromGooglePlaces({ businessName: form.business_name, address: form.address })
    setImporting(false)

    if (result.error) {
      toast.error(result.error.message || 'Unable to import business')
      return
    }

    const business = result.data || {}
    setForm((current) => ({
      ...current,
      business_name: business.business_name || current.business_name,
      category: business.category || current.category,
      phone: business.phone || current.phone,
      address: business.address || current.address,
      website: business.website || current.website,
      google_place_id: business.google_place_id || current.google_place_id,
      google_maps_url: business.google_maps_url || current.google_maps_url,
      google_rating: business.google_rating ?? current.google_rating,
      google_review_count: business.google_review_count ?? current.google_review_count,
      google_types: business.google_types || current.google_types,
      google_opening_hours: business.google_opening_hours || current.google_opening_hours,
      google_imported_at: business.google_imported_at || new Date().toISOString(),
    }))
    toast.success('Business details imported')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const result = await createProspect(form)
    if (!result.error) {
      closeAddProspectForm()
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
        <button className="primary-button" type="button" onClick={openAddProspectForm}><Plus size={18} /> Add Prospect</button>
      </header>

      {error && <div className="error">{error}</div>}

      {showForm && (
        <section className="panel">
          <h2>Add a prospect</h2>
          <div className="import-google-card">
            <div>
              <strong>Import from Google Places</strong>
              <p>Enter a business name and optional address, then pull in address, phone, website, rating, and Maps link.</p>
            </div>
            <button className="secondary-button" type="button" onClick={handleImportFromGooglePlaces} disabled={importing}>
              <Sparkles size={16} /> {importing ? 'Importing...' : 'Import details'}
            </button>
          </div>
          <form className="form-grid" onSubmit={handleSubmit}>
            <label>Business name<input ref={businessNameRef} required value={form.business_name} onChange={(e) => setForm({ ...form, business_name: e.target.value })} /></label>
            <label>Owner name<input value={form.owner_name} onChange={(e) => setForm({ ...form, owner_name: e.target.value })} /></label>
            <label>Category<input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Auto detailer, cafe, tint shop" /></label>
            <label>Address<input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Street address, city, state" /></label>
            <label>Website<input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} /></label>
            <label>Instagram<input value={form.instagram} onChange={(e) => setForm({ ...form, instagram: e.target.value })} /></label>
            <label>Facebook<input value={form.facebook} onChange={(e) => setForm({ ...form, facebook: e.target.value })} /></label>
            <label>Phone<input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></label>
            <label>Email<input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
            <label>Status<select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>{prospectStatuses.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}</select></label>
            <label>Next follow-up<input type="date" value={form.next_follow_up ?? ''} onChange={(e) => setForm({ ...form, next_follow_up: e.target.value })} /></label>
            <label className="span-2">Notes<textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Why this business is a good fit..." /></label>
            <div className="form-actions span-2"><button className="secondary-button" type="button" onClick={handleCancelAddProspect}>Cancel</button><button className="primary-button" type="submit">Save Prospect</button></div>
          </form>
        </section>
      )}

      <ConfirmDialog
        open={showDiscardDialog}
        title="Discard this prospect?"
        message="You have unsaved prospect details. Discarding will clear the form, imported Google Places data, and any notes you typed."
        confirmLabel="Discard changes"
        cancelLabel="Keep editing"
        tone="danger"
        onCancel={() => setShowDiscardDialog(false)}
        onConfirm={handleDiscardAddProspect}
      />

      <section className="panel">
        <div className="toolbar prospect-toolbar">
          <div className="search-box"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search prospects..." /></div>
          <span>{filtered.length} of {prospects.length} prospects</span>
        </div>

        <div className="filter-grid" aria-label="Prospect filters">
          <label>Status
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="all">All statuses</option>
              {prospectStatuses.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
            </select>
          </label>

          <label>Demo status
            <select value={demoStatusFilter} onChange={(event) => setDemoStatusFilter(event.target.value)}>
              <option value="all">All demo statuses</option>
              {demoStatuses.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
            </select>
          </label>

          <label>Follow-up
            <select value={followUpFilter} onChange={(event) => setFollowUpFilter(event.target.value)}>
              <option value="all">All follow-ups</option>
              <option value="overdue">Overdue</option>
              <option value="today">Due today</option>
              <option value="upcoming">Upcoming</option>
              <option value="none">No follow-up</option>
            </select>
          </label>

          <label>Category
            <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
              <option value="all">All categories</option>
              {categoryOptions.map((category) => <option key={category} value={category}>{category}</option>)}
            </select>
          </label>

          <label>Preview URL
            <select value={previewFilter} onChange={(event) => setPreviewFilter(event.target.value)}>
              <option value="all">Any</option>
              <option value="yes">Has preview</option>
              <option value="no">No preview</option>
            </select>
          </label>

          <label>Website
            <select value={websiteFilter} onChange={(event) => setWebsiteFilter(event.target.value)}>
              <option value="all">Any</option>
              <option value="yes">Has website</option>
              <option value="no">No website</option>
            </select>
          </label>
        </div>

        <div className="filter-actions">
          <button className="secondary-button" type="button" onClick={clearFilters} disabled={!hasActiveFilters}>
            <FilterX size={16} /> Clear filters
          </button>
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
                <span>{prospect.google_rating ? `★ ${prospect.google_rating} (${prospect.google_review_count || 0})` : (prospect.next_follow_up ? `Follow up ${prospect.next_follow_up}` : 'No follow-up set')}</span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
