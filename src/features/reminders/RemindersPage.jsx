import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarClock, CheckCircle2, Clock3, RotateCw } from 'lucide-react'
import { useProspects } from '../prospects/ProspectsContext'

function todayString() {
  return new Date().toISOString().slice(0, 10)
}

function addDays(days) {
  return new Date(Date.now() + days * 86400000).toISOString().slice(0, 10)
}

function compareDate(date) {
  if (!date) return 'none'
  const today = todayString()
  if (date < today) return 'overdue'
  if (date === today) return 'today'
  return 'upcoming'
}

function ReminderCard({ prospect, slug, onComplete, onSnooze }) {
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  async function complete() {
    setSaving(true)
    await onComplete(prospect.id, note)
    setNote('')
    setSaving(false)
  }

  async function snooze(days) {
    setSaving(true)
    await onSnooze(prospect.id, days)
    setSaving(false)
  }

  return (
    <article className="reminder-card">
      <div className="reminder-card-header">
        <div>
          <Link to={`/prospects/${slug}`}><strong>{prospect.business_name}</strong></Link>
          <span>{prospect.category || 'Local business'} · {prospect.status?.replaceAll('_', ' ')}</span>
        </div>
        <span className="badge">{prospect.next_follow_up}</span>
      </div>

      <textarea
        value={note}
        onChange={(event) => setNote(event.target.value)}
        placeholder="Add a quick note from this follow-up…"
      />

      <div className="reminder-actions">
        <button className="primary-button" type="button" onClick={complete} disabled={saving}>
          <CheckCircle2 size={16} /> Mark done
        </button>
        <button className="secondary-button" type="button" onClick={() => snooze(2)} disabled={saving}>
          <RotateCw size={16} /> Snooze 2 days
        </button>
        <button className="secondary-button" type="button" onClick={() => snooze(7)} disabled={saving}>
          <Clock3 size={16} /> Next week
        </button>
      </div>
    </article>
  )
}

export function RemindersPage() {
  const { prospects, completeFollowUp, snoozeFollowUp, slugForProspect } = useProspects()

  const reminders = useMemo(() => {
    const open = prospects.filter((prospect) => prospect.next_follow_up && !['won', 'lost'].includes(prospect.status))
    return {
      overdue: open.filter((prospect) => compareDate(prospect.next_follow_up) === 'overdue'),
      today: open.filter((prospect) => compareDate(prospect.next_follow_up) === 'today'),
      upcoming: open.filter((prospect) => compareDate(prospect.next_follow_up) === 'upcoming')
        .sort((a, b) => a.next_follow_up.localeCompare(b.next_follow_up))
        .slice(0, 12),
    }
  }, [prospects])

  const sections = [
    { key: 'overdue', title: 'Overdue', helper: 'Follow-ups that are past due.', icon: CalendarClock },
    { key: 'today', title: 'Due today', helper: 'Your main call/text/email list for today.', icon: CheckCircle2 },
    { key: 'upcoming', title: 'Upcoming', helper: 'Scheduled follow-ups coming next.', icon: Clock3 },
  ]

  return (
    <div className="page-stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">Reminder Engine</p>
          <h1>Daily follow-up command center</h1>
          <p>Work your list from top to bottom: follow up, add a quick note, then mark done or snooze.</p>
        </div>
        <Link className="primary-button" to="/prospects">Add prospect</Link>
      </header>

      <section className="card-grid">
        <article className="metric-card"><CalendarClock size={22} /><strong>{reminders.overdue.length}</strong><span>Overdue</span><p>Needs catch-up.</p></article>
        <article className="metric-card"><CheckCircle2 size={22} /><strong>{reminders.today.length}</strong><span>Due today</span><p>Do these first.</p></article>
        <article className="metric-card"><Clock3 size={22} /><strong>{reminders.upcoming.length}</strong><span>Upcoming</span><p>Already scheduled.</p></article>
        <article className="metric-card"><RotateCw size={22} /><strong>{addDays(2)}</strong><span>Default snooze</span><p>Two days from now.</p></article>
      </section>

      {sections.map((section) => {
        const Icon = section.icon
        const items = reminders[section.key]
        return (
          <section className="panel" key={section.key}>
            <div className="section-title-row">
              <div>
                <h2><Icon size={18} /> {section.title}</h2>
                <p className="small-muted">{section.helper}</p>
              </div>
              <span className="badge muted">{items.length}</span>
            </div>

            <div className="reminder-list">
              {items.length === 0 ? <p>No reminders here.</p> : items.map((prospect) => (
                <ReminderCard
                  key={prospect.id}
                  prospect={prospect}
                  slug={slugForProspect(prospect)}
                  onComplete={completeFollowUp}
                  onSnooze={snoozeFollowUp}
                />
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}
