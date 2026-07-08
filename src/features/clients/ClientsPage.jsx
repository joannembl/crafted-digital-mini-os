import { Link } from 'react-router-dom'
import { BriefcaseBusiness, ExternalLink } from 'lucide-react'
import { useMemo } from 'react'
import { useProspects } from '../prospects/ProspectsContext'

function money(value) {
  const number = Number(value || 0)
  if (!number) return '$0'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(number)
}

export function ClientsPage() {
  const { prospects } = useProspects()
  const clients = useMemo(() => prospects.filter((prospect) => prospect.status === 'won'), [prospects])
  const monthlyRevenue = clients.reduce((sum, client) => sum + Number(client.monthly_price || 0), 0)
  const setupRevenue = clients.reduce((sum, client) => sum + Number(client.setup_fee || 0), 0)

  return (
    <div className="page-stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">Phase 4</p>
          <h1>Clients</h1>
          <p>Keep won prospects simple: package, monthly price, add-ons, launch URL, and notes.</p>
        </div>
      </header>

      <div className="card-grid client-metrics">
        <article className="metric-card">
          <BriefcaseBusiness size={20} />
          <strong>{clients.length}</strong>
          <span>Active Clients</span>
          <p>Prospects marked as won.</p>
        </article>
        <article className="metric-card">
          <strong>{money(monthlyRevenue)}</strong>
          <span>Monthly Revenue</span>
          <p>Tracked monthly package value.</p>
        </article>
        <article className="metric-card">
          <strong>{money(setupRevenue)}</strong>
          <span>Setup Revenue</span>
          <p>One-time setup fees tracked.</p>
        </article>
        <article className="metric-card">
          <strong>{clients.filter((client) => client.live_url).length}</strong>
          <span>Live Sites</span>
          <p>Clients with a launch URL saved.</p>
        </article>
      </div>

      <section className="panel">
        <div className="toolbar">
          <div>
            <h2>Client list</h2>
            <p className="small-muted">Convert a prospect by opening their workspace and setting status to Won.</p>
          </div>
          <Link className="secondary-button" to="/prospects">View prospects</Link>
        </div>

        {clients.length === 0 ? (
          <div className="empty-state inline-empty">
            <BriefcaseBusiness size={32} />
            <h2>No clients yet</h2>
            <p>When someone says yes, mark their prospect status as Won and fill in the client details.</p>
          </div>
        ) : (
          <div className="client-list">
            {clients.map((client) => (
              <article className="client-card" key={client.id}>
                <div>
                  <p className="eyebrow">{client.package_type || 'Website package'}</p>
                  <h2>{client.business_name}</h2>
                  <p>{client.category || 'Local business'} · {money(client.monthly_price)}/mo · {money(client.setup_fee)} setup</p>
                  {client.add_ons && <p className="small-muted">Add-ons: {client.add_ons}</p>}
                </div>
                <div className="client-actions">
                  {client.live_url && <a className="secondary-button" href={client.live_url} target="_blank" rel="noreferrer"><ExternalLink size={16} /> Live site</a>}
                  <Link className="primary-button" to={`/prospects/${client.id}`}>Open client</Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
