import { CalendarCheck, Hammer, MessageSquare, Trophy } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useMemo } from 'react'
import { useProspects } from '../prospects/ProspectsContext'

function isDue(date) {
  if (!date) return false
  return new Date(`${date}T23:59:59`) <= new Date()
}

export function DashboardPage() {
  const { prospects, activities, slugForProspect } = useProspects()

  const followUpsDue = useMemo(() => prospects.filter((prospect) => isDue(prospect.next_follow_up) && !['won', 'lost'].includes(prospect.status)), [prospects])
  const demosReady = prospects.filter((prospect) => prospect.demo_status === 'ready')
  const wonThisMonth = prospects.filter((prospect) => prospect.status === 'won')
  const recentActivities = activities.slice(0, 5)

  const cards = [
    { label: 'Follow-ups due', value: followUpsDue.length, helper: 'Prospects that need attention today', icon: CalendarCheck },
    { label: 'Demos ready', value: demosReady.length, helper: 'Ready to send or review', icon: Hammer },
    { label: 'Recent notes', value: activities.length, helper: 'Calls, DMs, emails, and updates', icon: MessageSquare },
    { label: 'Won total', value: wonThisMonth.length, helper: 'Prospects marked as won', icon: Trophy },
  ]

  return (
    <div className="page-stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">Today</p>
          <h1>What needs your attention?</h1>
          <p>Your simplified workflow: add a prospect, build/send a demo, follow up, add notes, and mark won.</p>
        </div>
        <Link className="primary-button" to="/prospects">Add or view prospects</Link>
      </header>

      <section className="card-grid">
        {cards.map((card) => {
          const Icon = card.icon
          return (
            <article className="metric-card" key={card.label}>
              <Icon size={22} />
              <strong>{card.value}</strong>
              <span>{card.label}</span>
              <p>{card.helper}</p>
            </article>
          )
        })}
      </section>

      <div className="dashboard-grid">
        <section className="panel">
          <h2>Follow-ups due</h2>
          <div className="mini-list">
            {followUpsDue.length === 0 ? <p>No follow-ups due today.</p> : followUpsDue.map((prospect) => (
              <Link to={`/prospects/${slugForProspect(prospect)}`} key={prospect.id}><strong>{prospect.business_name}</strong><span>{prospect.next_follow_up}</span></Link>
            ))}
          </div>
        </section>

        <section className="panel">
          <h2>Recent activity</h2>
          <div className="mini-list">
            {recentActivities.length === 0 ? <p>No notes yet.</p> : recentActivities.map((activity) => {
              const prospect = prospects.find((item) => item.id === activity.prospect_id)
              return <Link to={`/prospects/${prospect ? slugForProspect(prospect) : activity.prospect_id}`} key={activity.id}><strong>{activity.type} · {prospect?.business_name || 'Prospect'}</strong><span>{activity.note}</span></Link>
            })}
          </div>
        </section>
      </div>

      <section className="panel">
        <h2>Mini OS workflow</h2>
        <div className="workflow-steps">
          {['Add Prospect', 'Build Demo', 'Send Demo', 'Follow Up', 'Mark Won'].map((step, index) => <div className="workflow-step" key={step}><span>{index + 1}</span>{step}</div>)}
        </div>
      </section>
    </div>
  )
}
