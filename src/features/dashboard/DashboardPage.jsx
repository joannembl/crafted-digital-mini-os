import { CalendarCheck, Hammer, MessageSquare, Trophy } from 'lucide-react'

const cards = [
  { label: 'Follow-ups due', value: 0, helper: 'Phase 2 connects prospects + tasks', icon: CalendarCheck },
  { label: 'Demos ready', value: 0, helper: 'Phase 3 connects demo tracking', icon: Hammer },
  { label: 'Recent notes', value: 0, helper: 'Phase 2 adds activity notes', icon: MessageSquare },
  { label: 'Won this month', value: 0, helper: 'Phase 4 adds client conversion', icon: Trophy },
]

export function DashboardPage() {
  return (
    <div className="page-stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">Today</p>
          <h1>What needs your attention?</h1>
          <p>Phase 1 is the clean foundation. Phase 2 will make this dashboard active with real prospects, notes, and follow-ups.</p>
        </div>
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

      <section className="panel">
        <h2>Mini OS workflow</h2>
        <div className="workflow-steps">
          {['Add Prospect', 'Build Demo', 'Send Demo', 'Follow Up', 'Mark Won'].map((step, index) => (
            <div className="workflow-step" key={step}>
              <span>{index + 1}</span>
              {step}
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
