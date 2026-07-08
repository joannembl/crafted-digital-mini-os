import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Clipboard, FileText, Send } from 'lucide-react'
import { useProspects } from '../prospects/ProspectsContext'
import toast from 'react-hot-toast'

function copyText(text, setCopied) {
  navigator.clipboard?.writeText(text)
  setCopied(true)
  toast.success('Message copied')
  window.setTimeout(() => setCopied(false), 1200)
}

export function ProposalCenterPage() {
  const { prospects, generateProposal, markProposalSent, generateOutreachMessage, updateProspect, slugForProspect } = useProspects()
  const activeProspects = useMemo(() => prospects.filter((prospect) => prospect.status !== 'lost'), [prospects])
  const [selectedId, setSelectedId] = useState(activeProspects[0]?.id || '')
  const selected = activeProspects.find((prospect) => prospect.id === selectedId) || activeProspects[0]
  const [copied, setCopied] = useState(false)
  const [saved, setSaved] = useState('')

  async function runProposal() {
    if (!selected) return
    const result = await generateProposal(selected.id)
    if (!result.error) {
      setSaved('Proposal generated')
      toast.success('Proposal generated')
      window.setTimeout(() => setSaved(''), 1400)
    } else {
      toast.error(result.error.message || 'Unable to generate proposal')
    }
  }

  async function runMarkSent() {
    if (!selected) return
    const result = await markProposalSent(selected.id)
    if (!result.error) {
      setSaved('Proposal marked sent')
      toast.success('Proposal marked sent')
      window.setTimeout(() => setSaved(''), 1400)
    } else {
      toast.error(result.error.message || 'Unable to mark proposal sent')
    }
  }

  async function patch(values) {
    if (!selected) return
    const result = await updateProspect(selected.id, values)
    if (!result.error) {
      setSaved('Saved')
      window.setTimeout(() => setSaved(''), 1400)
    }
  }

  if (activeProspects.length === 0) {
    return (
      <div className="page-stack">
        <header className="page-header">
          <div>
            <p className="eyebrow">Phase 5</p>
            <h1>Proposal Center</h1>
            <p>Add a prospect first, then come back to create outreach and proposal copy.</p>
          </div>
          <Link className="primary-button" to="/prospects">Add prospect</Link>
        </header>
      </div>
    )
  }

  const outreach = selected ? generateOutreachMessage(selected) : ''

  return (
    <div className="page-stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">Phase 5</p>
          <h1>Outreach & Proposal Center</h1>
          <p>Generate copy-paste outreach, proposal details, and schedule follow-ups after sending.</p>
        </div>
        {saved && <span className="save-pill">{saved}</span>}
      </header>

      <div className="builder-grid">
        <aside className="panel builder-list">
          <h2>Prospects</h2>
          <div className="mini-list compact-list">
            {activeProspects.map((prospect) => (
              <button key={prospect.id} className={`queue-item ${selected?.id === prospect.id ? 'active' : ''}`} type="button" onClick={() => setSelectedId(prospect.id)}>
                <strong>{prospect.business_name}</strong>
                <span>{prospect.proposal_status || 'No proposal yet'}</span>
              </button>
            ))}
          </div>
        </aside>

        <section className="panel builder-main">
          <div className="builder-title-row">
            <div>
              <p className="eyebrow">Selected Prospect</p>
              <h2>{selected.business_name}</h2>
              <p>{selected.package_type || 'Website, Handled'} · ${selected.monthly_price ?? 99}/mo · setup ${selected.setup_fee ?? 99}</p>
            </div>
            <Link className="secondary-button" to={`/prospects/${slugForProspect(selected)}`}>Open workspace</Link>
          </div>

          <div className="action-row">
            <button className="primary-button" type="button" onClick={runProposal}><FileText size={16} /> Generate Proposal</button>
            <button className="secondary-button" type="button" onClick={runMarkSent}><Send size={16} /> Mark Proposal Sent</button>
          </div>

          <div className="form-grid compact">
            <label>Package
              <select value={selected.package_type || 'Website, Handled'} onChange={(e) => patch({ package_type: e.target.value })}>
                <option value="Website, Handled">Website, Handled</option>
                <option value="Build & Own">Build & Own</option>
                <option value="Care Plan">Care Plan</option>
              </select>
            </label>
            <label>Proposal status
              <select value={selected.proposal_status || 'not_started'} onChange={(e) => patch({ proposal_status: e.target.value })}>
                <option value="not_started">Not started</option>
                <option value="drafted">Drafted</option>
                <option value="sent">Sent</option>
                <option value="accepted">Accepted</option>
                <option value="declined">Declined</option>
              </select>
            </label>
            <label>Monthly price<input type="number" min="0" value={selected.monthly_price ?? 99} onChange={(e) => patch({ monthly_price: e.target.value === '' ? null : Number(e.target.value) })} /></label>
            <label>Setup fee<input type="number" min="0" value={selected.setup_fee ?? 99} onChange={(e) => patch({ setup_fee: e.target.value === '' ? null : Number(e.target.value) })} /></label>
            <label className="span-2">Add-ons<input value={selected.add_ons || ''} onChange={(e) => patch({ add_ons: e.target.value })} placeholder="Online booking, contact form, online store" /></label>
            <label className="span-2 tall-textarea">Proposal notes<textarea value={selected.proposal_notes || ''} onChange={(e) => patch({ proposal_notes: e.target.value })} placeholder="Generate a proposal first, then edit it here." /></label>
          </div>
        </section>
      </div>

      <section className="panel">
        <div className="builder-title-row">
          <div>
            <h2>Copy-paste outreach</h2>
            <p>Use this after the demo is ready. It automatically references their business and preview URL if available.</p>
          </div>
          <button className="secondary-button" type="button" onClick={() => copyText(outreach, setCopied)}><Clipboard size={16} /> {copied ? 'Copied' : 'Copy message'}</button>
        </div>
        <pre className="copy-box">{outreach}</pre>
      </section>
    </div>
  )
}
